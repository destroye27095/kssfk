/* ============================================
   RATING MODEL
   Star Rating Data Structure (1-5 stars)
   ============================================ */

class Rating {
    constructor(data = {}) {
        this.id = data.id || `RATING-${Date.now()}`;
        this.schoolId = data.schoolId;
        this.score = data.score || 0; // 1-5
        this.stars = this.normalizeStars(data.score || 0);
        this.verified = data.verified || false;
        this.verifiedAt = data.verifiedAt || null;
        this.verifiedBy = data.verifiedBy || null; // admin ID
        
        // Rating breakdown
        this.factors = {
            feeTransparency: data.feeTransparency || 0,
            academicResults: data.academicResults || 0,
            uploadAccuracy: data.uploadAccuracy || 0,
            vacancyHonesty: data.vacancyHonesty || 0,
            parentFeedback: data.parentFeedback || 0,
            adminVerification: data.adminVerification || 0
        };

        this.penalties = data.penalties || [];
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        this.lockedUntil = data.lockedUntil || null; // Locked until year-end
        this.status = data.status || 'active'; // active, locked, appealed
    }

    /**
     * Normalize score to 1-5 stars
     */
    normalizeStars(score) {
        return Math.max(1, Math.min(5, Math.round(score * 2) / 2));
    }

    /**
     * Get star visual representation
     */
    getStarVisual() {
        const full = Math.floor(this.stars);
        const hasHalf = this.stars % 1 !== 0;
        const empty = 5 - full - (hasHalf ? 1 : 0);
        
        let visual = '★'.repeat(full);
        if (hasHalf) visual += '☆';
        visual += '☆'.repeat(empty);
        
        return visual;
    }

    /**
     * Get star status (Excellent, Good, etc)
     */
    getStatus() {
        if (this.stars >= 4.5) return 'Excellent';
        if (this.stars >= 4.0) return 'Very Good';
        if (this.stars >= 3.0) return 'Good';
        if (this.stars >= 2.0) return 'Fair';
        return 'Poor';
    }

    /**
     * Apply penalty
     */
    applyPenalty(amount, reason) {
        this.penalties.push({
            penaltyId: `PEN-${Date.now()}`,
            amount,
            reason,
            appliedDate: new Date().toISOString(),
            expiresDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

        this.stars = Math.max(1, this.stars - amount);
        this.lastUpdated = new Date().toISOString();
    }

    /**
     * Lock rating until year-end
     */
    lockUntilYearEnd() {
        const year = new Date().getFullYear();
        this.lockedUntil = new Date(year, 11, 31, 23, 59, 59).toISOString();
        this.status = 'locked';
    }

    /**
     * Verify rating (admin verification increases trust)
     */
    verify(adminId) {
        this.verified = true;
        this.verifiedAt = new Date().toISOString();
        this.verifiedBy = adminId;
        this.factors.adminVerification = 100; // Full admin score
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            schoolId: this.schoolId,
            score: this.score,
            stars: this.stars,
            starVisual: this.getStarVisual(),
            status: this.getStatus(),
            verified: this.verified,
            factors: this.factors,
            penalties: this.penalties,
            lastUpdated: this.lastUpdated,
            lockedUntil: this.lockedUntil
        };
    }
}

module.exports = Rating;
