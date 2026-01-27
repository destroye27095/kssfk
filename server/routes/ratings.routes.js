/* ============================================
   RATINGS API ROUTES
   Star Rating System Management
   ============================================ */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const Rating = require('../models/Rating');
const RatingService = require('../services/RatingService');
const { ImmutableLogger } = require('../middleware/logging.middleware');

/**
 * GET /api/ratings/:schoolId
 * Get school rating
 */
router.get('/api/ratings/:schoolId', (req, res) => {
    try {
        const schoolsPath = path.join(__dirname, '../../data/schools.json');
        
        if (!fs.existsSync(schoolsPath)) {
            return res.status(404).json({
                success: false,
                error: 'Schools data not found'
            });
        }

        const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
        const school = schools.find(s => s.id === req.params.schoolId);

        if (!school) {
            return res.status(404).json({
                success: false,
                error: 'School not found'
            });
        }

        // Calculate rating using RatingService
        const rating = RatingService.calculateRating(school);

        ImmutableLogger.logAccess({
            action: 'VIEW_RATING',
            schoolId: req.params.schoolId,
            ip: req.ip
        });

        res.status(200).json({
            success: true,
            schoolId: req.params.schoolId,
            schoolName: school.name,
            rating: {
                stars: rating.stars,
                visual: RatingService.getStarVisual(rating.stars),
                status: RatingService.getRatingStatus(rating.stars),
                breakdown: rating.breakdown,
                lastUpdated: rating.lastUpdated
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ratings
 * Submit parent feedback/rating
 */
router.post('/api/ratings', (req, res) => {
    try {
        const { schoolId, score, comment } = req.body;

        if (!schoolId || !score) {
            return res.status(400).json({
                success: false,
                error: 'School ID and score required'
            });
        }

        if (score < 1 || score > 5) {
            return res.status(400).json({
                success: false,
                error: 'Score must be between 1 and 5'
            });
        }

        const rating = new Rating({
            schoolId,
            score,
            parentFeedback: score * 20 // Convert 1-5 to 0-100
        });

        // Store rating
        const ratingsPath = path.join(__dirname, '../../data/ratings.json');
        let ratings = [];

        if (fs.existsSync(ratingsPath)) {
            ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
        }

        ratings.push(rating);
        fs.writeFileSync(ratingsPath, JSON.stringify(ratings, null, 2), 'utf8');

        ImmutableLogger.logRating({
            schoolId,
            score,
            comment,
            submittedAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            ratingId: rating.id,
            message: 'Rating submitted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ratings/:schoolId/feedback
 * Get aggregated parent feedback
 */
router.get('/api/ratings/:schoolId/feedback', (req, res) => {
    try {
        const ratingsPath = path.join(__dirname, '../../data/ratings.json');
        
        if (!fs.existsSync(ratingsPath)) {
            return res.status(200).json({
                success: true,
                schoolId: req.params.schoolId,
                feedbackCount: 0,
                averageScore: 0
            });
        }

        const ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
        const schoolRatings = ratings.filter(r => r.schoolId === req.params.schoolId);

        const averageScore = schoolRatings.length > 0 ?
            schoolRatings.reduce((sum, r) => sum + r.score, 0) / schoolRatings.length : 0;

        res.status(200).json({
            success: true,
            schoolId: req.params.schoolId,
            feedbackCount: schoolRatings.length,
            averageScore: Math.round(averageScore * 10) / 10,
            distribution: {
                '5': schoolRatings.filter(r => r.score === 5).length,
                '4': schoolRatings.filter(r => r.score === 4).length,
                '3': schoolRatings.filter(r => r.score === 3).length,
                '2': schoolRatings.filter(r => r.score === 2).length,
                '1': schoolRatings.filter(r => r.score === 1).length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/ratings/:schoolId/verify
 * Admin verify rating (increases trust)
 */
router.put('/api/ratings/:schoolId/verify', (req, res) => {
    try {
        // Check admin role
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const ratingsPath = path.join(__dirname, '../../data/ratings.json');
        
        if (!fs.existsSync(ratingsPath)) {
            return res.status(404).json({
                success: false,
                error: 'Ratings not found'
            });
        }

        let ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
        const index = ratings.findIndex(r => r.schoolId === req.params.schoolId);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: 'Rating not found'
            });
        }

        ratings[index].verified = true;
        ratings[index].verifiedAt = new Date().toISOString();
        ratings[index].verifiedBy = req.user.id;

        fs.writeFileSync(ratingsPath, JSON.stringify(ratings, null, 2), 'utf8');

        ImmutableLogger.logEvent('ratings', 'RATING_VERIFIED', {
            schoolId: req.params.schoolId,
            adminId: req.user.id
        });

        res.status(200).json({
            success: true,
            message: 'Rating verified'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
