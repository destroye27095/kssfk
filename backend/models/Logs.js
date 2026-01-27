/* ============================================
   Logs Model
   ============================================ */

class Log {
    constructor(data) {
        this.id = data.id || `log-${Date.now()}`;
        this.type = data.type; // upload, payment, enrollment, penalty
        this.timestamp = data.timestamp || new Date().toISOString();
        this.userId = data.userId;
        this.userType = data.userType; // parent, school, admin
        this.action = data.action;
        this.entityId = data.entityId;
        this.entityType = data.entityType;
        this.details = data.details;
        this.status = data.status;
        this.ipAddress = data.ipAddress;
        this.userAgent = data.userAgent;
    }
    
    /**
     * Log an upload action
     */
    static createUploadLog(uploadId, action, schoolId) {
        return new Log({
            type: 'upload',
            action,
            entityId: uploadId,
            entityType: 'upload',
            details: { schoolId }
        });
    }
    
    /**
     * Log a payment action
     */
    static createPaymentLog(paymentId, action, schoolId) {
        return new Log({
            type: 'payment',
            action,
            entityId: paymentId,
            entityType: 'payment',
            details: { schoolId }
        });
    }
    
    /**
     * Log an enrollment action
     */
    static createEnrollmentLog(enrollmentId, schoolId, parentId) {
        return new Log({
            type: 'enrollment',
            action: 'student_enrolled',
            entityId: enrollmentId,
            entityType: 'enrollment',
            details: { schoolId, parentId }
        });
    }
    
    /**
     * Log a penalty action
     */
    static createPenaltyLog(penaltyId, schoolId, reason) {
        return new Log({
            type: 'penalty',
            action: 'penalty_applied',
            entityId: penaltyId,
            entityType: 'penalty',
            details: { schoolId, reason }
        });
    }
    
    /**
     * Get log entry in JSON format
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            timestamp: this.timestamp,
            userId: this.userId,
            userType: this.userType,
            action: this.action,
            entityId: this.entityId,
            entityType: this.entityType,
            details: this.details,
            status: this.status,
            ipAddress: this.ipAddress
        };
    }
}

module.exports = Log;
