/* ============================================
   RECEIPTS API ROUTES
   Payment Receipt Management & PDF Delivery
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const Receipt = require('../models/Receipt');
const PDFService = require('../services/PDFService');
const { ImmutableLogger } = require('../middleware/logging.middleware');

/**
 * GET /api/receipts/:receiptId
 * Get receipt details
 */
router.get('/api/receipts/:receiptId', (req, res) => {
    try {
        const metadataPath = path.join(__dirname, '../../storage/receipts/metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
        }

        const receipts = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const receipt = receipts.find(r => r.receiptId === req.params.receiptId);

        if (!receipt) {
            return res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
        }

        // Mark as viewed
        receipt.viewedAt = new Date().toISOString();
        fs.writeFileSync(metadataPath, JSON.stringify(receipts, null, 2), 'utf8');

        ImmutableLogger.logEvent('receipts', 'RECEIPT_VIEWED', {
            receiptId: req.params.receiptId,
            ip: req.ip
        });

        res.status(200).json({
            success: true,
            receipt
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/receipts/:receiptId/pdf
 * Download receipt as PDF
 */
router.get('/api/receipts/:receiptId/pdf', (req, res) => {
    try {
        const result = PDFService.getReceipt(req.params.receiptId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error
            });
        }

        // Mark as downloaded
        const metadataPath = path.join(__dirname, '../../storage/receipts/metadata.json');
        if (fs.existsSync(metadataPath)) {
            const receipts = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const index = receipts.findIndex(r => r.receiptId === req.params.receiptId);
            
            if (index !== -1) {
                receipts[index].downloadedAt = new Date().toISOString();
                fs.writeFileSync(metadataPath, JSON.stringify(receipts, null, 2), 'utf8');
            }
        }

        ImmutableLogger.logEvent('receipts', 'RECEIPT_DOWNLOADED', {
            receiptId: req.params.receiptId,
            ip: req.ip
        });

        // Send PDF file
        res.download(result.filePath, result.fileName);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/receipts/:receiptId/resend
 * Resend receipt to email
 */
router.post('/api/receipts/:receiptId/resend', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email address required'
            });
        }

        const metadataPath = path.join(__dirname, '../../storage/receipts/metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
        }

        const receipts = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const index = receipts.findIndex(r => r.receiptId === req.params.receiptId);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Receipt not found'
            });
        }

        // In production: Send email with PDF attachment
        // For now: Just mark as resent
        if (!receipts[index].resendHistory) {
            receipts[index].resendHistory = [];
        }

        receipts[index].resendHistory.push({
            email,
            sentAt: new Date().toISOString()
        });

        fs.writeFileSync(metadataPath, JSON.stringify(receipts, null, 2), 'utf8');

        ImmutableLogger.logEvent('receipts', 'RECEIPT_RESENT', {
            receiptId: req.params.receiptId,
            email
        });

        res.status(200).json({
            success: true,
            message: 'Receipt resent to email'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/receipts/parent/:parentId
 * Get all receipts for parent
 */
router.get('/api/receipts/parent/:parentId', (req, res) => {
    try {
        const metadataPath = path.join(__dirname, '../../storage/receipts/metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return res.status(200).json({
                success: true,
                receipts: [],
                total: 0
            });
        }

        const receipts = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const parentReceipts = receipts.filter(r => r.parentId === req.params.parentId);

        res.status(200).json({
            success: true,
            receipts: parentReceipts,
            total: parentReceipts.length,
            totalAmount: parentReceipts.reduce((sum, r) => sum + r.amount, 0)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/receipts/verify/:receiptId
 * Verify receipt authenticity
 */
router.get('/api/receipts/verify/:receiptId', (req, res) => {
    try {
        const result = PDFService.verifyReceipt(req.params.receiptId);

        ImmutableLogger.logEvent('receipts', 'RECEIPT_VERIFICATION_ATTEMPTED', {
            receiptId: req.params.receiptId,
            valid: result.valid
        });

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/receipts/stats
 * Get receipt statistics
 */
router.get('/api/receipts/stats', (req, res) => {
    try {
        const metadataPath = path.join(__dirname, '../../storage/receipts/metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return res.status(200).json({
                success: true,
                totalReceipts: 0,
                totalAmount: 0,
                averageReceipt: 0
            });
        }

        const receipts = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        res.status(200).json({
            success: true,
            totalReceipts: receipts.length,
            totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
            averageReceipt: receipts.length > 0 ?
                Math.round(receipts.reduce((sum, r) => sum + r.amount, 0) / receipts.length) : 0,
            viewedCount: receipts.filter(r => r.viewedAt).length,
            downloadedCount: receipts.filter(r => r.downloadedAt).length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
