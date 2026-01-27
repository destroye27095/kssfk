/* ============================================
   Payment Model
   ============================================ */

class Payment {
    constructor(data) {
        this.id = data.id || `payment-${Date.now()}`;
        this.schoolId = data.schoolId;
        this.schoolName = data.schoolName;
        this.amount = data.amount;
        this.purpose = data.purpose; // Media upload fee, annual fee, etc.
        this.paymentDate = data.paymentDate || new Date().toISOString();
        this.status = data.status || 'pending'; // pending, completed, failed
        this.paymentMethod = data.paymentMethod; // Bank transfer, Mobile money
        this.transactionId = data.transactionId;
        this.reference = data.reference;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    /**
     * Verify payment completion
     */
    verify() {
        return {
            verified: this.status === 'completed',
            amount: this.amount,
            transactionId: this.transactionId,
            verificationDate: new Date().toISOString()
        };
    }
    
    /**
     * Generate payment receipt
     */
    generateReceipt() {
        return {
            receiptId: `RECEIPT-${this.id}`,
            schoolName: this.schoolName,
            amount: this.amount,
            purpose: this.purpose,
            paymentDate: this.paymentDate,
            status: this.status,
            transactionId: this.transactionId,
            generatedAt: new Date().toISOString()
        };
    }
    
    /**
     * Validate payment data
     */
    validate() {
        const errors = [];
        
        if (!this.schoolId) errors.push('School ID is required');
        if (!this.amount || this.amount <= 0) errors.push('Valid amount is required');
        if (!this.paymentMethod) errors.push('Payment method is required');
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = Payment;
