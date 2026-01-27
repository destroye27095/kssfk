/* ============================================
   Jobs Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const jobsFile = path.join(__dirname, '../../data/jobs.json');

function readJobs() {
    try {
        if (!fs.existsSync(jobsFile)) {
            return [];
        }
        return JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function saveJobs(data) {
    try {
        fs.writeFileSync(jobsFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

// GET all jobs
router.get('/', (req, res) => {
    const jobs = readJobs();
    res.json(jobs);
});

// GET jobs by school
router.get('/school/:schoolId', (req, res) => {
    const jobs = readJobs();
    const schoolJobs = jobs.filter(j => j.schoolId === req.params.schoolId);
    res.json(schoolJobs);
});

// GET job by ID
router.get('/:id', (req, res) => {
    const jobs = readJobs();
    const job = jobs.find(j => j.id === req.params.id);
    
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
});

// POST new job
router.post('/', (req, res) => {
    const jobs = readJobs();
    const newJob = {
        id: `job-${Date.now()}`,
        ...req.body,
        postedDate: new Date().toISOString(),
        status: 'open'
    };
    
    jobs.push(newJob);
    
    if (saveJobs(jobs)) {
        res.status(201).json(newJob);
    } else {
        res.status(500).json({ error: 'Failed to create job' });
    }
});

// PUT update job
router.put('/:id', (req, res) => {
    const jobs = readJobs();
    const index = jobs.findIndex(j => j.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Job not found' });
    }
    
    jobs[index] = { ...jobs[index], ...req.body, updatedAt: new Date().toISOString() };
    
    if (saveJobs(jobs)) {
        res.json(jobs[index]);
    } else {
        res.status(500).json({ error: 'Failed to update job' });
    }
});

// DELETE job (close posting)
router.delete('/:id', (req, res) => {
    const jobs = readJobs();
    const index = jobs.findIndex(j => j.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Job not found' });
    }
    
    jobs[index].status = 'closed';
    jobs[index].closedDate = new Date().toISOString();
    
    if (saveJobs(jobs)) {
        res.json({ message: 'Job posting closed', job: jobs[index] });
    } else {
        res.status(500).json({ error: 'Failed to close job' });
    }
});

module.exports = router;
