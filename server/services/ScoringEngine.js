/**
 * KSFP Intelligent Scoring Engine
 * Composite algorithm for school ratings
 * Combines: fees + environment + security + teachers + distance + courses
 */

const fs = require('fs');
const path = require('path');

class ScoringEngine {
    /**
     * Weight distribution for composite score
     * Must sum to 100%
     */
    static WEIGHTS = {
        fee_affordability: 25,      // Fees relative to income levels
        environment_quality: 15,    // Quiet, spacious, peaceful
        security_level: 15,         // Physical safety measures
        teacher_quality: 20,        // Qualifications, ratio, diversity
        curriculum_offerings: 15,   // Courses, programs, specialization
        accessibility: 10           // Distance from target market
    };

    /**
     * Calculate comprehensive school score (0-100)
     * @param {Object} schoolData - Complete school profile
     * @returns {Object} {overall_score, star_rating, breakdown, recommendations}
     */
    static calculateCompositeScore(schoolData) {
        const breakdown = {};
        let weightedTotal = 0;

        // 1. FEE AFFORDABILITY (25%)
        const feeScore = this.calculateFeeAffordabilityScore(schoolData.fees);
        breakdown.fee_affordability = {
            score: feeScore,
            weight: this.WEIGHTS.fee_affordability,
            weighted: (feeScore * this.WEIGHTS.fee_affordability) / 100
        };
        weightedTotal += breakdown.fee_affordability.weighted;

        // 2. ENVIRONMENT QUALITY (15%)
        const envScore = schoolData.environment_score || 50;
        breakdown.environment_quality = {
            score: envScore,
            weight: this.WEIGHTS.environment_quality,
            weighted: (envScore * this.WEIGHTS.environment_quality) / 100
        };
        weightedTotal += breakdown.environment_quality.weighted;

        // 3. SECURITY LEVEL (15%)
        const secScore = schoolData.security_score || 50;
        breakdown.security_level = {
            score: secScore,
            weight: this.WEIGHTS.security_level,
            weighted: (secScore * this.WEIGHTS.security_level) / 100
        };
        weightedTotal += breakdown.security_level.weighted;

        // 4. TEACHER QUALITY (20%)
        const teacherScore = schoolData.teacher_quality_score || 50;
        breakdown.teacher_quality = {
            score: teacherScore,
            weight: this.WEIGHTS.teacher_quality,
            weighted: (teacherScore * this.WEIGHTS.teacher_quality) / 100
        };
        weightedTotal += breakdown.teacher_quality.weighted;

        // 5. CURRICULUM OFFERINGS (15%)
        const currScore = this.calculateCurriculumScore(schoolData.curriculum);
        breakdown.curriculum_offerings = {
            score: currScore,
            weight: this.WEIGHTS.curriculum_offerings,
            weighted: (currScore * this.WEIGHTS.curriculum_offerings) / 100
        };
        weightedTotal += breakdown.curriculum_offerings.weighted;

        // 6. ACCESSIBILITY (10%)
        const accessScore = this.calculateAccessibilityScore(schoolData.distance);
        breakdown.accessibility = {
            score: accessScore,
            weight: this.WEIGHTS.accessibility,
            weighted: (accessScore * this.WEIGHTS.accessibility) / 100
        };
        weightedTotal += breakdown.accessibility.weighted;

        // Final score
        const overallScore = Math.round(weightedTotal);

        // Convert to star rating
        const starRating = this.scoreToStars(overallScore);

        return {
            overall_score: overallScore,
            star_rating: starRating,
            breakdown: breakdown,
            confidence_level: this.getConfidenceLevel(schoolData),
            calculated_at: new Date().toISOString(),
            valid_until: this.getValidUntil(schoolData)
        };
    }

    /**
     * Calculate fee affordability score
     * Based on: fees vs county median income, ASAL free zones
     * @param {Object} fees - {annual_tuition, enrollment, lunch_program}
     * @returns {number} 0-100
     */
    static calculateFeeAffordabilityScore(fees) {
        if (!fees) return 50; // Neutral if no data

        let score = 50;

        // ASAL zones → automatic free fees
        if (fees.policy === 'FREE') {
            return 100;
        }

        // Base on annual tuition affordability
        const annualTuition = fees.annual_tuition || 0;

        // Assuming median parent income: 200,000 KES/year
        const medianParentIncome = 200000;
        const affordabilityRatio = annualTuition / medianParentIncome;

        if (affordabilityRatio <= 0.05) {
            score = 95;  // ≤5% of income = excellent
        } else if (affordabilityRatio <= 0.10) {
            score = 80;  // 5-10% = good
        } else if (affordabilityRatio <= 0.15) {
            score = 65;  // 10-15% = acceptable
        } else if (affordabilityRatio <= 0.25) {
            score = 45;  // 15-25% = expensive
        } else {
            score = 20;  // >25% = very expensive
        }

        // Bonus for lunch program (nutrition matters)
        if (fees.lunch_program) {
            score += 5;
        }

        return Math.min(100, score);
    }

    /**
     * Calculate curriculum score
     * Based on: subject diversity, special programs
     * @param {Object} curriculum - {total_courses, distribution, has_sports, has_music}
     * @returns {number} 0-100
     */
    static calculateCurriculumScore(curriculum) {
        if (!curriculum) return 50;

        let score = 50;

        // More courses = more options
        const courseCount = curriculum.total_courses || 0;
        if (courseCount >= 15) score += 20;
        else if (courseCount >= 10) score += 15;
        else if (courseCount >= 5) score += 10;

        // Diverse subjects
        const distribution = curriculum.distribution || {};
        const hasSTEM = distribution.STEM > 0 ? 10 : 0;
        const hasArts = distribution.ARTS > 0 ? 10 : 0;
        const hasScience = distribution.SCIENCE > 0 ? 10 : 0;
        score += hasSTEM + hasArts + hasScience;

        // Extra-curricular programs
        if (curriculum.has_sports) score += 5;
        if (curriculum.has_music) score += 5;

        return Math.min(100, score);
    }

    /**
     * Calculate accessibility score
     * Based on distance from school market
     * @param {number} distance - Distance in km
     * @returns {number} 0-100
     */
    static calculateAccessibilityScore(distance) {
        if (!distance) return 50;

        // Closer = better access
        if (distance < 1) return 100;          // Very close
        if (distance < 5) return 85;           // Close
        if (distance < 10) return 70;          // Accessible
        if (distance < 20) return 50;          // Moderate
        if (distance < 40) return 30;          // Far
        return 10;                              // Very far
    }

    /**
     * Convert overall score to star rating (1-5)
     * @param {number} score - 0-100
     * @returns {number} 1-5 stars
     */
    static scoreToStars(score) {
        if (score >= 85) return 5;   // ★★★★★
        if (score >= 70) return 4.5; // ★★★★☆
        if (score >= 60) return 4;   // ★★★★
        if (score >= 50) return 3.5; // ★★★☆
        if (score >= 40) return 3;   // ★★★
        if (score >= 25) return 2.5; // ★★☆
        if (score >= 15) return 2;   // ★★
        return 1;                     // ★
    }

    /**
     * Convert star rating to visual representation
     * @param {number} stars
     * @returns {string}
     */
    static starToVisual(stars) {
        const fullStar = '★';
        const halfStar = '☆';

        let visual = '';
        let remaining = stars;

        for (let i = 0; i < 5; i++) {
            if (remaining >= 1) {
                visual += fullStar;
                remaining -= 1;
            } else if (remaining >= 0.5) {
                visual += '⭐';
                remaining -= 0.5;
            }
        }

        return visual;
    }

    /**
     * Get confidence level for rating
     * (based on data completeness)
     * @param {Object} schoolData
     * @returns {string} 'HIGH' | 'MEDIUM' | 'LOW'
     */
    static getConfidenceLevel(schoolData) {
        let dataPoints = 0;
        const requiredDataPoints = [
            'fees',
            'environment_score',
            'security_score',
            'teacher_quality_score',
            'curriculum',
            'distance'
        ];

        requiredDataPoints.forEach(point => {
            if (schoolData[point]) dataPoints++;
        });

        const completeness = dataPoints / requiredDataPoints.length;

        if (completeness >= 0.8) return 'HIGH';
        if (completeness >= 0.5) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Get rating valid until date
     * Ratings locked for academic year, but can be updated annually
     * @param {Object} schoolData
     * @returns {string} ISO date
     */
    static getValidUntil(schoolData) {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Academic year ends in December
        const academicYearEnd = new Date(`${currentYear}-12-31`);
        
        // If past academic year end, extend to next year
        if (now > academicYearEnd) {
            academicYearEnd.setFullYear(currentYear + 1);
        }

        return academicYearEnd.toISOString();
    }

    /**
     * Get rating summary for parents
     * @param {Object} rating - Result from calculateCompositeScore
     * @returns {Object}
     */
    static getSummary(rating) {
        return {
            stars: rating.star_rating,
            visual: this.starToVisual(rating.star_rating),
            score: rating.overall_score,
            confidence: rating.confidence_level,
            message: this.getRatingMessage(rating.overall_score),
            valid_until: rating.valid_until
        };
    }

    /**
     * Get human-readable rating message
     * @param {number} score
     * @returns {string}
     */
    static getRatingMessage(score) {
        if (score >= 85) return 'Excellent school - Highly recommended';
        if (score >= 70) return 'Good school - Worth considering';
        if (score >= 60) return 'Average school - Mixed reviews';
        if (score >= 40) return 'Below average - Needs improvement';
        return 'Poor school - Significant concerns';
    }

    /**
     * Get improvement recommendations
     * @param {Object} breakdown - Score breakdown
     * @returns {Array} Prioritized recommendations
     */
    static getImprovements(breakdown) {
        const improvements = [];

        // Identify lowest-scoring areas
        const scores = Object.entries(breakdown)
            .map(([area, data]) => ({
                area: area,
                score: data.score
            }))
            .sort((a, b) => a.score - b.score);

        // Top 3 areas for improvement
        scores.slice(0, 3).forEach(item => {
            const recommendation = this.getAreaRecommendation(item.area);
            if (recommendation) {
                improvements.push(recommendation);
            }
        });

        return improvements;
    }

    /**
     * Get specific recommendation for area
     * @param {string} area
     * @returns {Object}
     */
    static getAreaRecommendation(area) {
        const recommendations = {
            'fee_affordability': {
                area: 'Fee affordability',
                action: 'Work with parents on payment plans or seek fee subsidies'
            },
            'environment_quality': {
                area: 'Environment quality',
                action: 'Expand school grounds, improve landscaping, reduce noise pollution'
            },
            'security_level': {
                area: 'Security',
                action: 'Install fencing, hire guards, install CCTV cameras'
            },
            'teacher_quality': {
                area: 'Teacher quality',
                action: 'Recruit qualified teachers, improve student-teacher ratio'
            },
            'curriculum_offerings': {
                area: 'Curriculum',
                action: 'Add more course options, introduce special programs (sports, music)'
            },
            'accessibility': {
                area: 'Accessibility',
                action: 'Consider satellite campus or transportation support'
            }
        };

        return recommendations[area];
    }

    /**
     * Compare schools and rank them
     * @param {Array} schools - Array of school objects with all scoring data
     * @returns {Array} Sorted by score (highest first)
     */
    static rankSchools(schools) {
        const rankedSchools = schools.map(school => {
            const rating = this.calculateCompositeScore(school);
            return {
                ...school,
                rating: rating
            };
        });

        return rankedSchools.sort((a, b) => b.rating.overall_score - a.rating.overall_score);
    }

    /**
     * Log rating calculation
     * @param {string} schoolId
     * @param {Object} ratingData
     */
    static logRating(schoolId, ratingData) {
        try {
            const logPath = path.join(__dirname, '../../logs/ratings.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...ratingData,
                event: 'RATING_CALCULATED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Rating logging error:', error);
        }
    }

    /**
     * Validate rating before publishing
     * @param {Object} rating
     * @returns {Object} {valid, issues}
     */
    static validateRating(rating) {
        const issues = [];

        if (rating.confidence_level === 'LOW') {
            issues.push('Low confidence - incomplete data');
        }

        if (rating.overall_score < 20) {
            issues.push('Very low score - consider recheck of data');
        }

        if (!rating.valid_until) {
            issues.push('No validity period set');
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            ready_to_publish: issues.length === 0
        };
    }
}

module.exports = ScoringEngine;
