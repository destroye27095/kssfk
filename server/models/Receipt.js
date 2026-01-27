/* ============================================
   RECEIPT MODEL
   Payment Receipt Data Structure
   PDF Receipt Reference & Metadata
   ============================================ */

class Receipt {
    constructor(data = {}) {
        this.id = data.id || `RECEIPT-${Date.now()}`;
        this.receiptNumber = data.receiptNumber || this.generateReceiptNumber();
        this.transactionId = data.transactionId;
        this.paymentId = data.paymentId;
        this.parentId = data.parentId;
        this.schoolId = data.schoolId;
        
        // Payment details
        this.amount = data.amount || 0;
        this.currency = 'KES'; // Kenya Shilling
        this.paymentDate = data.paymentDate || new Date().toISOString();
        this.parentName = data.parentName;
        this.parentEmail = data.parentEmail;
        this.parentPhone = data.parentPhone;
        this.schoolName = data.schoolName;
        this.schoolLevel = data.schoolLevel;
        
        // PDF storage
        this.pdfPath = data.pdfPath || null;
        this.pdfUrl = data.pdfUrl || null;
        this.pdfGenerated = data.pdfGenerated || false;
        this.pdfGeneratedAt = data.pdfGeneratedAt || null;
        
        // Receipt status
        this.status = data.status || 'pending'; // pending, generated, sent, viewed, archived
        this.sentTo = data.sentTo || []; // Email addresses sent to
        this.viewedAt = data.viewedAt || null;
        this.downloadedAt = data.downloadedAt || null;
        
        // Verification
        this.signature = data.signature || 'Served by KSFP courtesy of the school looked in';
        this.verified = data.verified || false;
        this.verificationHash = data.verificationHash || null;
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.expiresAt = data.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    /**
     * Generate receipt number in format KSFP-YYYY-XXXXXX
     */
    generateReceiptNumber() {
        const year = new Date().getFullYear();
        const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        return `KSFP-${year}-${random}`;
    }

    /**
     * Mark PDF as generated
     */
    setPdfGenerated(path, url) {
        this.pdfPath = path;
        this.pdfUrl = url;
        this.pdfGenerated = true;
        this.pdfGeneratedAt = new Date().toISOString();
        this.status = 'generated';
    }

    /**
     * Mark as sent to email
     */
    markAsSent(email) {
        if (!this.sentTo.includes(email)) {
            this.sentTo.push(email);
        }
        this.status = 'sent';
    }

    /**
     * Mark as viewed
     */
    markAsViewed() {
        this.viewedAt = new Date().toISOString();
        this.status = 'viewed';
    }

    /**
     * Mark as downloaded
     */
    markAsDownloaded() {
        this.downloadedAt = new Date().toISOString();
        this.status = 'downloaded';
    }

    /**
     * Calculate receipt hash for verification
     */
    calculateHash() {
        const crypto = require('crypto');
        const data = JSON.stringify({
            receiptNumber: this.receiptNumber,
            transactionId: this.transactionId,
            amount: this.amount,
            paymentDate: this.paymentDate,
            parentEmail: this.parentEmail,
            schoolName: this.schoolName
        });

        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Verify receipt authenticity
     */
    verify() {
        this.verificationHash = this.calculateHash();
        this.verified = true;
        return this.verificationHash;
    }

    /**
     * Check if receipt is expired
     */
    isExpired() {
        return new Date() > new Date(this.expiresAt);
    }

    /**
     * Archive receipt (move to backup)
     */
    archive() {
        this.status = 'archived';
    }

    /**
     * Get receipt as HTML (for display)
     */
    toHTML() {
        return `
            <div class="receipt">
                <h2>Payment Receipt</h2>
                <p><strong>Receipt No:</strong> ${this.receiptNumber}</p>
                <p><strong>Date:</strong> ${new Date(this.paymentDate).toLocaleString('en-KE')}</p>
                <hr>
                <p><strong>Parent Name:</strong> ${this.parentName}</p>
                <p><strong>School Name:</strong> ${this.schoolName}</p>
                <p><strong>Amount:</strong> KES ${this.amount.toLocaleString()}</p>
                <hr>
                <p><em>${this.signature}</em></p>
                <p><small>Transaction ID: ${this.transactionId}</small></p>
                <p><small>Verify: https://ksfp.ac.ke/verify/${this.receiptNumber}</small></p>
            </div>
        `;
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            receiptNumber: this.receiptNumber,
            transactionId: this.transactionId,
            amount: this.amount,
            currency: this.currency,
            paymentDate: this.paymentDate,
            parentName: this.parentName,
            parentEmail: this.parentEmail,
            schoolName: this.schoolName,
            status: this.status,
            pdfUrl: this.pdfUrl,
            verified: this.verified,
            createdAt: this.createdAt,
            expiresAt: this.expiresAt,
            signature: this.signature
        };
    }
}

module.exports = Receipt;
