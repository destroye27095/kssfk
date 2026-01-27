/* ============================================
   Job Model
   ============================================ */

class Job {
    constructor(data) {
        this.id = data.id || `job-${Date.now()}`;
        this.schoolId = data.schoolId;
        this.schoolName = data.schoolName;
        this.position = data.position;
        this.department = data.department;
        this.description = data.description;
        this.salary = data.salary;
        this.requirements = data.requirements || [];
        this.postedDate = data.postedDate || new Date().toISOString();
        this.closingDate = data.closingDate;
        this.status = data.status || 'open'; // open, closed, filled
        this.applications = data.applications || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    /**
     * Close job posting
     */
    close() {
        this.status = 'closed';
        return { success: true, message: 'Job posting closed' };
    }
    
    /**
     * Mark position as filled
     */
    markFilled() {
        this.status = 'filled';
        return { success: true, message: 'Position marked as filled' };
    }
    
    /**
     * Increment application count
     */
    addApplication() {
        this.applications += 1;
        return { success: true, totalApplications: this.applications };
    }
    
    /**
     * Get job summary
     */
    getSummary() {
        return {
            id: this.id,
            position: this.position,
            department: this.department,
            salary: this.salary,
            status: this.status,
            applications: this.applications,
            postedDate: this.postedDate
        };
    }
    
    /**
     * Validate job data
     */
    validate() {
        const errors = [];
        
        if (!this.schoolId) errors.push('School ID is required');
        if (!this.position) errors.push('Position title is required');
        if (!this.department) errors.push('Department is required');
        if (this.salary < 0) errors.push('Salary cannot be negative');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = Job;
