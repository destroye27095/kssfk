/* ============================================
   Upload Model
   ============================================ */

class Upload {
    constructor(data) {
        this.id = data.id || `upload-${Date.now()}`;
        this.schoolId = data.schoolId;
        this.schoolName = data.schoolName;
        this.title = data.title;
        this.type = data.type; // Images, Videos, Documents, Results
        this.description = data.description;
        this.fileUrl = data.fileUrl;
        this.fileSize = data.fileSize;
        this.fileType = data.fileType;
        this.uploadedDate = data.uploadedDate || new Date().toISOString();
        this.status = data.status || 'pending'; // pending, approved, rejected
        this.termsAccepted = data.termsAccepted || false;
        this.paymentVerified = data.paymentVerified || false;
        this.approvedDate = data.approvedDate;
        this.rejectionReason = data.rejectionReason;
        this.approvedBy = data.approvedBy;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    /**
     * Check if upload is eligible for approval
     */
    isEligibleForApproval() {
        return this.termsAccepted && this.paymentVerified && this.status === 'pending';
    }
    
    /**
     * Approve upload
     */
    approve(approvedBy) {
        if (!this.isEligibleForApproval()) {
            return { success: false, message: 'Upload is not eligible for approval' };
        }
        
        this.status = 'approved';
        this.approvedDate = new Date().toISOString();
        this.approvedBy = approvedBy;
        
        return { success: true, message: 'Upload approved', upload: this };
    }
    
    /**
     * Reject upload
     */
    reject(reason) {
        this.status = 'rejected';
        this.rejectionReason = reason;
        
        return { success: true, message: 'Upload rejected', reason };
    }
    
    /**
     * Validate upload data
     */
    validate() {
        const errors = [];
        
        if (!this.schoolId) errors.push('School ID is required');
        if (!this.title) errors.push('Upload title is required');
        if (!this.type) errors.push('Upload type is required');
        if (!this.termsAccepted) errors.push('Terms must be accepted');
        if (!this.paymentVerified) errors.push('Payment must be verified');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = Upload;
