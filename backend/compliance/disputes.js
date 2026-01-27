/* ============================================
   Disputes & Victim Compensation Module
   ============================================ */

/**
 * File a dispute claim
 */
function fileDispute(claimData) {
    return {
        disputeId: `dispute-${Date.now()}`,
        claimantType: claimData.claimantType, // 'parent' or 'victim'
        schoolId: claimData.schoolId,
        schoolName: claimData.schoolName,
        description: claimData.description,
        claimAmount: claimData.claimAmount,
        evidence: claimData.evidence,
        filedDate: new Date().toISOString(),
        status: 'pending_review',
        priority: calculatePriority(claimData.severity)
    };
}

/**
 * Calculate claim priority
 */
function calculatePriority(severity) {
    switch (severity) {
        case 'critical':
            return 'high';
        case 'significant':
            return 'medium';
        case 'minor':
            return 'low';
        default:
            return 'medium';
    }
}

/**
 * Review and approve compensation
 */
function approveCompensation(dispute) {
    return {
        compensationId: `comp-${Date.now()}`,
        disputeId: dispute.disputeId,
        claimantType: dispute.claimantType,
        approvedAmount: dispute.claimAmount,
        fundingSource: 'School Penalty Enforcement Fund',
        approvalDate: new Date().toISOString(),
        status: 'approved',
        paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
}

/**
 * Track compensation payment
 */
function trackCompensationPayment(compensation) {
    return {
        ...compensation,
        paymentStatus: 'pending',
        trackingNumber: `COMP-${Date.now()}`,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Get all disputes for school
 */
function getSchoolDisputes(schoolId, allDisputes) {
    return allDisputes.filter(d => d.schoolId === schoolId);
}

/**
 * Calculate total compensation liability for school
 */
function calculateCompensationLiability(schoolDisputes) {
    return schoolDisputes
        .filter(d => d.status === 'approved')
        .reduce((total, dispute) => total + dispute.claimAmount, 0);
}

module.exports = {
    fileDispute,
    calculatePriority,
    approveCompensation,
    trackCompensationPayment,
    getSchoolDisputes,
    calculateCompensationLiability
};
