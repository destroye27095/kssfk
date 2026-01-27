/* ============================================
   School Model
   ============================================ */

class School {
    constructor(data) {
        this.id = data.id || `school-${Date.now()}`;
        this.name = data.name;
        this.grade = data.grade; // ECDE, Primary, Secondary, University
        this.type = data.type; // public, private
        this.streams = data.streams || []; // Coed, Boys, Girls
        this.monthlyFee = data.monthlyFee;
        this.yearlyFee = data.yearlyFee;
        this.phone = data.phone;
        this.email = data.email;
        this.location = data.location;
        this.academicRating = data.academicRating || 0;
        this.infrastructure = data.infrastructure || 0;
        this.facilities = data.facilities || 0;
        this.sportsRating = data.sportsRating || 0;
        this.vacancyRate = data.vacancyRate || 0;
        this.penaltyApplied = data.penaltyApplied || false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    /**
     * Calculate school score based on multiple factors
     */
    calculateScore() {
        const weights = {
            academic: 0.35,
            infrastructure: 0.20,
            facilities: 0.20,
            sports: 0.15,
            vacancy: 0.10
        };
        
        const score = 
            (this.academicRating * weights.academic) +
            (this.infrastructure * weights.infrastructure) +
            (this.facilities * weights.facilities) +
            (this.sportsRating * weights.sports) +
            (this.vacancyRate * weights.vacancy);
        
        return Math.round(score);
    }
    
    /**
     * Validate school data
     */
    validate() {
        const errors = [];
        
        if (!this.name) errors.push('School name is required');
        if (!this.grade) errors.push('School grade is required');
        if (!this.type) errors.push('School type is required');
        if (this.monthlyFee < 0) errors.push('Monthly fee cannot be negative');
        if (!this.email) errors.push('Email is required');
        if (!this.phone) errors.push('Phone is required');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Apply fee doubling for private schools (if needed)
     */
    applyPrivateFeeMultiplier(multiplier = 2) {
        if (this.type === 'private') {
            this.monthlyFee = this.monthlyFee * multiplier;
            this.yearlyFee = this.yearlyFee * multiplier;
        }
        return this;
    }
}

module.exports = School;
