/* ============================================
   Vacancies Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const vacanciesFile = path.join(__dirname, '../../data/vacancies.json');

function readVacancies() {
    try {
        return JSON.parse(fs.readFileSync(vacanciesFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function saveVacancies(data) {
    try {
        fs.writeFileSync(vacanciesFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

// GET all vacancies
router.get('/', (req, res) => {
    const vacancies = readVacancies();
    const processed = vacancies.map(v => ({
        ...v,
        remainingSeats: v.maxCapacity - v.currentEnrollment,
        vacancyPercentage: ((v.maxCapacity - v.currentEnrollment) / v.maxCapacity * 100).toFixed(1)
    }));
    res.json(processed);
});

// GET open vacancies only
router.get('/open', (req, res) => {
    const vacancies = readVacancies();
    const open = vacancies.filter(v => v.status === 'open').map(v => ({
        ...v,
        remainingSeats: v.maxCapacity - v.currentEnrollment
    }));
    res.json(open);
});

// GET vacancy by ID
router.get('/:id', (req, res) => {
    const vacancies = readVacancies();
    const vacancy = vacancies.find(v => v.id === req.params.id);
    
    if (!vacancy) {
        return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    res.json({
        ...vacancy,
        remainingSeats: vacancy.maxCapacity - vacancy.currentEnrollment
    });
});

// POST new vacancy
router.post('/', (req, res) => {
    const vacancies = readVacancies();
    const maxCapacity = req.body.maxCapacity;
    const currentEnrollment = req.body.currentEnrollment || 0;
    
    const newVacancy = {
        id: `vacancy-${Date.now()}`,
        ...req.body,
        postedDate: new Date().toISOString(),
        status: currentEnrollment >= maxCapacity ? 'closed' : 'open'
    };
    
    vacancies.push(newVacancy);
    
    if (saveVacancies(vacancies)) {
        res.status(201).json(newVacancy);
    } else {
        res.status(500).json({ error: 'Failed to create vacancy' });
    }
});

// PUT update enrollment and auto-close if full
router.put('/:id/enroll', (req, res) => {
    const vacancies = readVacancies();
    const index = vacancies.findIndex(v => v.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    const vacancy = vacancies[index];
    
    // Increment enrollment
    vacancy.currentEnrollment = (vacancy.currentEnrollment || 0) + 1;
    
    // Auto-close if full
    if (vacancy.currentEnrollment >= vacancy.maxCapacity) {
        vacancy.status = 'closed';
        vacancy.closedDate = new Date().toISOString();
    }
    
    if (saveVacancies(vacancies)) {
        res.json(vacancy);
    } else {
        res.status(500).json({ error: 'Failed to enroll' });
    }
});

// DELETE vacancy (close it)
router.delete('/:id', (req, res) => {
    const vacancies = readVacancies();
    const index = vacancies.findIndex(v => v.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    vacancies[index].status = 'closed';
    vacancies[index].closedDate = new Date().toISOString();
    
    if (saveVacancies(vacancies)) {
        res.json({ message: 'Vacancy closed', vacancy: vacancies[index] });
    } else {
        res.status(500).json({ error: 'Failed to close vacancy' });
    }
});

module.exports = router;
