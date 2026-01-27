/* ============================================
   ENHANCED PAYMENT MODEL
   ACID-Safe Payment Processing
   ============================================ */

class Payment {
    constructor(data = {}) {
        this.id = data.id || `PAY-${Date.now()}`;
        this.transactionId = data.transactionId || null;
        this.parentId = data.parentId;
        this.schoolId = data.schoolId;
        
        // Amount and currency
        this.amount = data.amount || 0;
        this.currency = 'KES';
        this.purpose = data.purpose || 'School Fee';
        
        // Payment method
        this.paymentMethod = data.paymentMethod || 'mpesa'; // mpesa, card, bank_transfer
        this.paymentReference = data.paymentReference || null;
        
        // Payer details
        this.parentName = data.parentName;
        this.parentEmail = data.parentEmail;
        this.parentPhone = data.parentPhone;
        
        // School details
        this.schoolName = data.schoolName;
        this.schoolLevel = data.schoolLevel;
        this.schoolLocation = data.schoolLocation;
        
        // Status tracking
        this.status = data.status || 'pending'; // pending, processing, completed, failed, refunded
        this.createdAt = data.createdAt || new Date().toISOString();
        this.processedAt = data.processedAt || null;
        
        // Receipt
        this.receiptId = data.receiptId || null;
        this.receiptUrl = data.receiptUrl || null;
        
        // Refund tracking
        this.refundId = data.refundId || null;
        this.refundReason = data.refundReason || null;
        this.refundDate = data.refundDate || null;
        
        // ACID compliance
        this.transactionLog = data.transactionLog || [];
        this.checksumValid = data.checksumValid || false;
    }

    /**
     * Mark payment as processing
     */
    startProcessing() {
        this.status = 'processing';
        this.logTransaction('PROCESSING', 'Payment processing started');
    }

    /**
     * Mark payment as completed
     */
    complete(transactionId, receiptId) {
        this.status = 'completed';
        this.transactionId = transactionId;
        this.receiptId = receiptId;
        this.processedAt = new Date().toISOString();
        this.logTransaction('COMPLETED', 'Payment processed successfully');
    }

    /**
     * Mark payment as failed
     */
    fail(reason) {
        this.status = 'failed';
        this.logTransaction('FAILED', reason);
    }

    /**
     * Process refund
     */
    refund(refundId, reason) {
        this.status = 'refunded';
        this.refundId = refundId;
        this.refundReason = reason;
        this.refundDate = new Date().toISOString();
        this.logTransaction('REFUNDED', reason);
    }

    /**
     * Log transaction step
     */
    logTransaction(step, details) {
        this.transactionLog.push({
            step,
            details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Validate payment data
     */
    validate() {
        const errors = [];

        if (!this.parentId) errors.push('Parent ID required');
        if (!this.schoolId) errors.push('School ID required');
        if (this.amount <= 0) errors.push('Amount must be greater than 0');
        if (this.amount > 500000) errors.push('Amount exceeds limit');
        if (!this.paymentMethod) errors.push('Payment method required');
        if (!this.parentEmail) errors.push('Parent email required');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate checksum for data integrity
     */
    calculateChecksum() {
        const crypto = require('crypto');
        const data = JSON.stringify({
            amount: this.amount,
            parentId: this.parentId,
            schoolId: this.schoolId,
            createdAt: this.createdAt
        });

        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Verify checksum
     */
    verifyChecksum(checksum) {
        return this.calculateChecksum() === checksum;
    }

    /**
     * Get payment status
     */
    getStatus() {
        const statuses = {
            'pending': 'Awaiting processing',
            'processing': 'Currently processing',
            'completed': 'Successfully completed',
            'failed': 'Payment failed',
            'refunded': 'Refunded to account'
        };

        return statuses[this.status] || 'Unknown';
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            transactionId: this.transactionId,
            parentId: this.parentId,
            schoolId: this.schoolId,
            amount: this.amount,
            currency: this.currency,
            status: this.status,
            paymentMethod: this.paymentMethod,
            createdAt: this.createdAt,
            processedAt: this.processedAt,
            receiptId: this.receiptId,
            refundId: this.refundId,
            refundReason: this.refundReason,
            transactionLog: this.transactionLog
        };
    }

    /**
     * Convert to display object
     */
    toDisplay() {
        return {
            receiptNumber: this.receiptId,
            parentName: this.parentName,
            schoolName: this.schoolName,
            amount: `KES ${this.amount.toLocaleString()}`,
            date: new Date(this.createdAt).toLocaleString('en-KE'),
            status: this.getStatus()
        };
    }
}

module.exports = Payment;
