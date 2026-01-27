/* ============================================
   PAYMENTS API ROUTES
   ACID-Compliant Payment Processing
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const Payment = require('../models/Payment');
const PaymentService = require('../services/PaymentService');
const PDFService = require('../services/PDFService');
const { AcidTransaction } = require('../middleware/transaction.middleware');
const { ImmutableLogger } = require('../middleware/logging.middleware');

/**
 * POST /api/payments
 * Process a new payment
 */
router.post('/api/payments', async (req, res) => {
    const transaction = new AcidTransaction();
    
    try {
        transaction.log('PAYMENT_REQUEST', req.body);

        // Create payment object
        const paymentData = new Payment(req.body);
        
        // Validate payment
        const validation = paymentData.validate();
        if (!validation.valid) {
            transaction.log('VALIDATION_FAILED', validation.errors);
            return res.status(400).json({
                success: false,
                errors: validation.errors,
                transactionId: transaction.transactionId
            });
        }

        // Process payment with ACID guarantee
        const result = await PaymentService.processPayment(req.body);
        
        if (!result.success) {
            transaction.log('PAYMENT_FAILED', result.error);
            ImmutableLogger.logEvent('payments', 'PAYMENT_FAILED', {
                amount: req.body.amount,
                reason: result.error,
                email: req.body.parentEmail
            });

            return res.status(400).json({
                success: false,
                error: result.error,
                transactionId: transaction.transactionId
            });
        }

        // Generate PDF receipt
        const pdfResult = await PDFService.generateReceipt({
            ...req.body,
            transactionNumber: Math.floor(Math.random() * 1000000),
            transactionId: result.transactionId
        });

        if (!pdfResult.success) {
            transaction.log('PDF_GENERATION_FAILED', pdfResult.error);
            // Payment succeeded but receipt failed - log warning
        }

        transaction.log('PAYMENT_SUCCESS', {
            transactionId: result.transactionId,
            receiptId: pdfResult.receiptId
        });

        // Log to immutable log
        ImmutableLogger.logPayment({
            transactionId: result.transactionId,
            amount: req.body.amount,
            parentEmail: req.body.parentEmail,
            schoolName: req.body.schoolName,
            status: 'completed'
        });

        res.status(200).json({
            success: true,
            transactionId: result.transactionId,
            receiptId: pdfResult.receiptId,
            receiptUrl: `/api/receipts/${pdfResult.receiptId}/pdf`,
            message: 'Payment processed successfully',
            nextSteps: 'Receipt will be sent to email shortly'
        });

    } catch (error) {
        transaction.log('PAYMENT_ERROR', error.message);
        
        ImmutableLogger.logEvent('payments', 'PAYMENT_ERROR', {
            error: error.message,
            email: req.body?.parentEmail
        });

        res.status(500).json({
            success: false,
            error: 'Payment processing error',
            details: error.message,
            transactionId: transaction.transactionId
        });
    } finally {
        transaction.saveLog();
    }
});

/**
 * GET /api/payments/:transactionId
 * Get payment details
 */
router.get('/api/payments/:transactionId', (req, res) => {
    try {
        const result = PaymentService.getPayment(req.params.transactionId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error
            });
        }

        // Don't expose sensitive data
        const payment = result.payment;
        delete payment.transactionLog; // Hide internal log

        ImmutableLogger.logAccess({
            action: 'GET_PAYMENT',
            transactionId: req.params.transactionId,
            ip: req.ip
        });

        res.status(200).json({
            success: true,
            payment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/payments/parent/:parentId
 * Get all payments for parent
 */
router.get('/api/payments/parent/:parentId', (req, res) => {
    try {
        const paymentsPath = path.join(__dirname, '../../data/payments.json');
        
        if (!fs.existsSync(paymentsPath)) {
            return res.status(200).json({
                success: true,
                payments: [],
                total: 0
            });
        }

        const payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
        const parentPayments = payments.filter(p => p.parentId === req.params.parentId);

        res.status(200).json({
            success: true,
            payments: parentPayments,
            total: parentPayments.length,
            totalAmount: parentPayments.reduce((sum, p) => sum + p.amount, 0)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/payments/stats
 * Get payment statistics
 */
router.get('/api/payments/stats', (req, res) => {
    try {
        const stats = PaymentService.getPaymentStats();

        res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/payments/:transactionId/refund
 * Refund payment
 */
router.post('/api/payments/:transactionId/refund', async (req, res) => {
    const transaction = new AcidTransaction();
    
    try {
        const { reason } = req.body;

        transaction.log('REFUND_REQUEST', {
            transactionId: req.params.transactionId,
            reason
        });

        // Only admin can refund
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const result = await PaymentService.refundPayment(req.params.transactionId, reason);

        if (!result.success) {
            transaction.log('REFUND_FAILED', result.error);
            return res.status(400).json(result);
        }

        transaction.log('REFUND_SUCCESS', result);

        ImmutableLogger.logEvent('payments', 'REFUND_PROCESSED', {
            originalTransaction: req.params.transactionId,
            refundId: result.refundId,
            reason
        });

        res.status(200).json(result);

    } catch (error) {
        transaction.log('REFUND_ERROR', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        transaction.saveLog();
    }
});

module.exports = router;
