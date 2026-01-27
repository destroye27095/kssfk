/* ============================================
   Admin Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const uploadsFile = path.join(__dirname, '../../data/uploads.json');
const paymentsFile = path.join(__dirname, '../../data/payments.json');
const penaltiesFile = path.join(__dirname, '../../data/penalties.json');

// Helper functions
function readFile(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return [];
    }
}

function writeFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing file:', error);
        return false;
    }
}

// GET dashboard stats
router.get('/stats', (req, res) => {
    const uploads = readFile(uploadsFile);
    const payments = readFile(paymentsFile);
    const penalties = readFile(penaltiesFile);
    
    res.json({
        totalUploads: uploads.length,
        pendingUploads: uploads.filter(u => u.status === 'pending').length,
        approvedUploads: uploads.filter(u => u.status === 'approved').length,
        totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
        totalPenalties: penalties.length,
        activePenalties: penalties.filter(p => !p.enforcedDate).length
    });
});

// GET all uploads
router.get('/uploads', (req, res) => {
    const uploads = readFile(uploadsFile);
    res.json(uploads);
});

// Approve upload
router.put('/uploads/:id/approve', (req, res) => {
    const uploads = readFile(uploadsFile);
    const index = uploads.findIndex(u => u.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Upload not found' });
    }
    
    uploads[index].status = 'approved';
    uploads[index].approvedDate = new Date().toISOString();
    uploads[index].approvedBy = req.user?.email || 'admin';
    
    if (writeFile(uploadsFile, uploads)) {
        res.json(uploads[index]);
    } else {
        res.status(500).json({ error: 'Failed to approve upload' });
    }
});

// Reject upload
router.put('/uploads/:id/reject', (req, res) => {
    const uploads = readFile(uploadsFile);
    const index = uploads.findIndex(u => u.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Upload not found' });
    }
    
    uploads[index].status = 'rejected';
    uploads[index].rejectedDate = new Date().toISOString();
    uploads[index].rejectionReason = req.body.reason || '';
    
    if (writeFile(uploadsFile, uploads)) {
        res.json(uploads[index]);
    } else {
        res.status(500).json({ error: 'Failed to reject upload' });
    }
});

// GET all payments
router.get('/payments', (req, res) => {
    const payments = readFile(paymentsFile);
    res.json(payments);
});

// Verify payment
router.put('/payments/:id/verify', (req, res) => {
    const payments = readFile(paymentsFile);
    const index = payments.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Payment not found' });
    }
    
    payments[index].status = 'verified';
    payments[index].verifiedDate = new Date().toISOString();
    
    if (writeFile(paymentsFile, payments)) {
        res.json(payments[index]);
    } else {
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// GET penalties
router.get('/penalties', (req, res) => {
    const penalties = readFile(penaltiesFile);
    res.json(penalties);
});

// Apply penalty
router.post('/penalties', (req, res) => {
    const penalties = readFile(penaltiesFile);
    const newPenalty = {
        id: `penalty-${Date.now()}`,
        ...req.body,
        appliedDate: new Date().toISOString(),
        appliedBy: req.user?.email || 'admin'
    };
    
    penalties.push(newPenalty);
    
    if (writeFile(penaltiesFile, penalties)) {
        res.status(201).json(newPenalty);
    } else {
        res.status(500).json({ error: 'Failed to apply penalty' });
    }
});

// Enforce penalty
router.put('/penalties/:id/enforce', (req, res) => {
    const penalties = readFile(penaltiesFile);
    const index = penalties.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Penalty not found' });
    }
    
    penalties[index].enforcedDate = new Date().toISOString();
    penalties[index].status = 'enforced';
    
    if (writeFile(penaltiesFile, penalties)) {
        res.json(penalties[index]);
    } else {
        res.status(500).json({ error: 'Failed to enforce penalty' });
    }
});

module.exports = router;
