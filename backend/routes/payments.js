/* ============================================
   Payments Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const paymentsFile = path.join(__dirname, '../../data/payments.json');

function readPayments() {
    try {
        return JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function savePayments(data) {
    try {
        fs.writeFileSync(paymentsFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

// GET all payments
router.get('/', (req, res) => {
    const payments = readPayments();
    res.json(payments);
});

// GET payment by ID
router.get('/:id', (req, res) => {
    const payments = readPayments();
    const payment = payments.find(p => p.id === req.params.id);
    
    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
});

// POST new payment
router.post('/', (req, res) => {
    const payments = readPayments();
    const newPayment = {
        id: `payment-${Date.now()}`,
        ...req.body,
        paymentDate: new Date().toISOString(),
        status: 'pending'
    };
    
    payments.push(newPayment);
    
    if (savePayments(payments)) {
        res.status(201).json(newPayment);
    } else {
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// PUT update payment status
router.put('/:id', (req, res) => {
    const payments = readPayments();
    const index = payments.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Payment not found' });
    }
    
    payments[index] = { ...payments[index], ...req.body, updatedAt: new Date().toISOString() };
    
    if (savePayments(payments)) {
        res.json(payments[index]);
    } else {
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// GET payments by school
router.get('/school/:schoolId', (req, res) => {
    const payments = readPayments();
    const schoolPayments = payments.filter(p => p.schoolId === req.params.schoolId);
    res.json(schoolPayments);
});

// GET payment statistics
router.get('/stats/all', (req, res) => {
    const payments = readPayments();
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    
    res.json({
        totalPayments: payments.length,
        totalAmount: total,
        completedPayments: completed,
        pendingPayments: pending,
        averagePayment: (total / payments.length).toFixed(2)
    });
});

module.exports = router;
