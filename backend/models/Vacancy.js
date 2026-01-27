/* ============================================
   Vacancy Model
   ============================================ */

class Vacancy {
    constructor(data) {
        this.id = data.id || `vacancy-${Date.now()}`;
        this.schoolId = data.schoolId;
        this.schoolName = data.schoolName;
        this.grade = data.grade;
        this.stream = data.stream;
        this.maxCapacity = data.maxCapacity;
        this.currentEnrollment = data.currentEnrollment || 0;
        this.postedDate = data.postedDate || new Date().toISOString();
        this.status = data.status || 'open'; // open, closed
        this.closedDate = data.closedDate;
        this.termsAndConditions = data.termsAndConditions;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    /**
     * Get remaining seats
     */
    getRemainingSeats() {
        return Math.max(0, this.maxCapacity - this.currentEnrollment);
    }
    
    /**
     * Get vacancy percentage
     */
    getVacancyPercentage() {
        return ((this.getRemainingSeats() / this.maxCapacity) * 100).toFixed(1);
    }
    
    /**
     * Check if vacancy is full
     */
    isFull() {
        return this.currentEnrollment >= this.maxCapacity;
    }
    
    /**
     * Enroll a student
     */
    enroll() {
        if (this.isFull()) {
            this.status = 'closed';
            this.closedDate = new Date().toISOString();
            return { success: false, message: 'Vacancy is full' };
        }
        
        this.currentEnrollment += 1;
        
        // Auto-close if now full
        if (this.isFull()) {
            this.status = 'closed';
            this.closedDate = new Date().toISOString();
        }
        
        return { success: true, message: 'Student enrolled', remainingSeats: this.getRemainingSeats() };
    }
    
    /**
     * Close vacancy
     */
    close() {
        this.status = 'closed';
        this.closedDate = new Date().toISOString();
        return { success: true, message: 'Vacancy closed' };
    }
    
    /**
     * Validate vacancy data
     */
    validate() {
        const errors = [];
        
        if (!this.schoolId) errors.push('School ID is required');
        if (!this.grade) errors.push('Grade is required');
        if (!this.maxCapacity || this.maxCapacity <= 0) errors.push('Valid capacity is required');
        if (this.currentEnrollment < 0) errors.push('Enrollment cannot be negative');
        if (this.currentEnrollment > this.maxCapacity) errors.push('Enrollment cannot exceed capacity');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = Vacancy;
