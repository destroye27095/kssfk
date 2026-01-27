/* ============================================
   Schools Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const schoolsFile = path.join(__dirname, '../../data/schools.json');

// Read schools data
function getSchools() {
    try {
        const data = fs.readFileSync(schoolsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading schools file:', error);
        return [];
    }
}

// Write schools data
function saveSchools(schools) {
    try {
        fs.writeFileSync(schoolsFile, JSON.stringify(schools, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing schools file:', error);
        return false;
    }
}

// GET all schools
router.get('/', (req, res) => {
    const schools = getSchools();
    res.json(schools);
});

// GET school by ID
router.get('/:id', (req, res) => {
    const schools = getSchools();
    const school = schools.find(s => s.id === req.params.id);
    
    if (!school) {
        return res.status(404).json({ error: 'School not found' });
    }
    
    res.json(school);
});

// POST new school
router.post('/', (req, res) => {
    const schools = getSchools();
    const newSchool = {
        id: `school-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    schools.push(newSchool);
    
    if (saveSchools(schools)) {
        res.status(201).json(newSchool);
    } else {
        res.status(500).json({ error: 'Failed to create school' });
    }
});

// PUT update school
router.put('/:id', (req, res) => {
    const schools = getSchools();
    const index = schools.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'School not found' });
    }
    
    schools[index] = { ...schools[index], ...req.body, updatedAt: new Date().toISOString() };
    
    if (saveSchools(schools)) {
        res.json(schools[index]);
    } else {
        res.status(500).json({ error: 'Failed to update school' });
    }
});

// DELETE school
router.delete('/:id', (req, res) => {
    const schools = getSchools();
    const index = schools.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'School not found' });
    }
    
    const deletedSchool = schools.splice(index, 1);
    
    if (saveSchools(schools)) {
        res.json({ message: 'School deleted successfully', school: deletedSchool[0] });
    } else {
        res.status(500).json({ error: 'Failed to delete school' });
    }
});

// Search schools by filter
router.post('/search', (req, res) => {
    const schools = getSchools();
    const { grade, type, stream, maxFee } = req.body;
    
    let filtered = schools;
    
    if (grade) filtered = filtered.filter(s => s.grade === grade);
    if (type) filtered = filtered.filter(s => s.type === type);
    if (stream) filtered = filtered.filter(s => s.streams.includes(stream));
    if (maxFee) filtered = filtered.filter(s => s.monthlyFee <= maxFee);
    
    res.json(filtered);
});

module.exports = router;
