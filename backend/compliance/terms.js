/* ============================================
   Terms & Conditions Enforcement
   ============================================ */

const termsAndConditions = {
    uploadTerms: {
        version: '1.0',
        effectiveDate: '2025-01-01',
        requirements: [
            'All content must be authentic and accurate',
            'No misleading or false information is permitted',
            'Schools must provide legitimate media and documents',
            'Acceptance of terms is mandatory for uploads',
            'Violation leads to 20% penalty enforcement'
        ]
    },
    
    paymentTerms: {
        uploadFee: 1000,
        currency: 'KES',
        mandatory: true,
        purpose: 'Media upload fee for platform maintenance'
    },
    
    schoolComplianceTerms: {
        version: '1.0',
        requirements: [
            'Regular fee updates must be submitted annually',
            'Vacancy information must be accurate',
            'Academic results must be authentic',
            'Job postings must be legitimate',
            'False information results in 20% penalty'
        ]
    }
};

/**
 * Verify terms acceptance
 */
function verifyTermsAcceptance(uploadData) {
    if (!uploadData.termsAccepted) {
        return {
            accepted: false,
            reason: 'Terms and conditions must be explicitly accepted'
        };
    }
    
    return {
        accepted: true,
        message: 'Terms accepted successfully',
        termsVersion: termsAndConditions.uploadTerms.version
    };
}

/**
 * Verify payment
 */
function verifyPayment(paymentData) {
    if (!paymentData.verified) {
        return {
            verified: false,
            reason: 'Payment must be verified before upload'
        };
    }
    
    if (paymentData.amount < termsAndConditions.paymentTerms.uploadFee) {
        return {
            verified: false,
            reason: `Minimum payment of KES ${termsAndConditions.paymentTerms.uploadFee} required`
        };
    }
    
    return {
        verified: true,
        message: 'Payment verified successfully'
    };
}

/**
 * Validate upload compliance
 */
function validateUploadCompliance(uploadData) {
    const errors = [];
    
    // Check terms
    const termsCheck = verifyTermsAcceptance(uploadData);
    if (!termsCheck.accepted) {
        errors.push(termsCheck.reason);
    }
    
    // Check payment
    const paymentCheck = verifyPayment(uploadData);
    if (!paymentCheck.verified) {
        errors.push(paymentCheck.reason);
    }
    
    // Check content authenticity
    if (!uploadData.content || uploadData.content.trim() === '') {
        errors.push('Content cannot be empty');
    }
    
    return {
        compliant: errors.length === 0,
        errors,
        timestamp: new Date().toISOString()
    };
}

/**
 * Get terms document
 */
function getTermsDocument(type = 'upload') {
    switch (type) {
        case 'upload':
            return termsAndConditions.uploadTerms;
        case 'payment':
            return termsAndConditions.paymentTerms;
        case 'school':
            return termsAndConditions.schoolComplianceTerms;
        default:
            return null;
    }
}

module.exports = {
    termsAndConditions,
    verifyTermsAcceptance,
    verifyPayment,
    validateUploadCompliance,
    getTermsDocument
};
