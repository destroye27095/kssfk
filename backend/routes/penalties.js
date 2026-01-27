/* ============================================
   Penalties Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const penaltiesFile = path.join(__dirname, '../../data/penalties.json');

function readPenalties() {
    try {
        if (!fs.existsSync(penaltiesFile)) {
            return [];
        }
        return JSON.parse(fs.readFileSync(penaltiesFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function savePenalties(data) {
    try {
        fs.writeFileSync(penaltiesFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

// GET all penalties
router.get('/', (req, res) => {
    const penalties = readPenalties();
    res.json(penalties);
});

// GET penalties by school
router.get('/school/:schoolId', (req, res) => {
    const penalties = readPenalties();
    const schoolPenalties = penalties.filter(p => p.schoolId === req.params.schoolId);
    res.json(schoolPenalties);
});

// GET penalty by ID
router.get('/:id', (req, res) => {
    const penalties = readPenalties();
    const penalty = penalties.find(p => p.id === req.params.id);
    
    if (!penalty) {
        return res.status(404).json({ error: 'Penalty not found' });
    }
    
    res.json(penalty);
});

// POST new penalty (for fake information)
router.post('/', (req, res) => {
    const penalties = readPenalties();
    const penaltyAmount = req.body.amount || (req.body.baseAmount * 0.20); // 20% penalty
    
    const newPenalty = {
        id: `penalty-${Date.now()}`,
        ...req.body,
        amount: penaltyAmount,
        appliedDate: new Date().toISOString(),
        status: 'pending'
    };
    
    penalties.push(newPenalty);
    
    if (savePenalties(penalties)) {
        res.status(201).json(newPenalty);
    } else {
        res.status(500).json({ error: 'Failed to apply penalty' });
    }
});

// PUT enforce penalty
router.put('/:id/enforce', (req, res) => {
    const penalties = readPenalties();
    const index = penalties.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Penalty not found' });
    }
    
    penalties[index].status = 'enforced';
    penalties[index].enforcedDate = new Date().toISOString();
    penalties[index].enforcedBy = req.body.enforcedBy || 'admin';
    
    if (savePenalties(penalties)) {
        res.json(penalties[index]);
    } else {
        res.status(500).json({ error: 'Failed to enforce penalty' });
    }
});

// GET penalty statistics
router.get('/stats/all', (req, res) => {
    const penalties = readPenalties();
    const total = penalties.reduce((sum, p) => sum + p.amount, 0);
    
    res.json({
        totalPenalties: penalties.length,
        totalAmount: total,
        averagePenalty: (total / penalties.length).toFixed(2),
        enforced: penalties.filter(p => p.status === 'enforced').length,
        pending: penalties.filter(p => p.status === 'pending').length
    });
});

module.exports = router;
