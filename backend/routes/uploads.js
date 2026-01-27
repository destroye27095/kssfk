/* ============================================
   Uploads Routes
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const uploadsFile = path.join(__dirname, '../../data/uploads.json');

function readUploads() {
    try {
        return JSON.parse(fs.readFileSync(uploadsFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function saveUploads(data) {
    try {
        fs.writeFileSync(uploadsFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

// GET all uploads
router.get('/', (req, res) => {
    const uploads = readUploads();
    res.json(uploads);
});

// GET uploads by school
router.get('/school/:schoolId', (req, res) => {
    const uploads = readUploads();
    const schoolUploads = uploads.filter(u => u.schoolId === req.params.schoolId);
    res.json(schoolUploads);
});

// GET upload by ID
router.get('/:id', (req, res) => {
    const uploads = readUploads();
    const upload = uploads.find(u => u.id === req.params.id);
    
    if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
    }
    
    res.json(upload);
});

// POST new upload
router.post('/', (req, res) => {
    // Validate upload
    if (!req.body.termsAccepted || !req.body.paymentVerified) {
        return res.status(400).json({ error: 'Terms must be accepted and payment verified' });
    }
    
    const uploads = readUploads();
    const newUpload = {
        id: `upload-${Date.now()}`,
        ...req.body,
        uploadedDate: new Date().toISOString(),
        status: 'pending'
    };
    
    uploads.push(newUpload);
    
    if (saveUploads(uploads)) {
        res.status(201).json(newUpload);
    } else {
        res.status(500).json({ error: 'Failed to create upload' });
    }
});

// PUT update upload
router.put('/:id', (req, res) => {
    const uploads = readUploads();
    const index = uploads.findIndex(u => u.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Upload not found' });
    }
    
    uploads[index] = { ...uploads[index], ...req.body, updatedAt: new Date().toISOString() };
    
    if (saveUploads(uploads)) {
        res.json(uploads[index]);
    } else {
        res.status(500).json({ error: 'Failed to update upload' });
    }
});

// GET uploads statistics
router.get('/stats/all', (req, res) => {
    const uploads = readUploads();
    
    res.json({
        totalUploads: uploads.length,
        byStatus: {
            pending: uploads.filter(u => u.status === 'pending').length,
            approved: uploads.filter(u => u.status === 'approved').length,
            rejected: uploads.filter(u => u.status === 'rejected').length
        },
        byType: {
            images: uploads.filter(u => u.type === 'Images').length,
            videos: uploads.filter(u => u.type === 'Videos').length,
            documents: uploads.filter(u => u.type === 'Documents').length
        }
    });
});

module.exports = router;
