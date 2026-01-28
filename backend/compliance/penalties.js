/* ============================================
   Penalties Compliance Module
   ============================================ */

/**
 * Detect and enforce fake information penalty
 * 20% fee increase for false/misleading information
 */
function detectFakeInformation(schoolData) {
    const suspiciousFlags = [];
    
    // Check for inconsistencies
    if (schoolData.academicRating && schoolData.academicRating > 10) {
        suspiciousFlags.push('Invalid academic rating');
    }
    
    if (schoolData.annualFee && schoolData.annualFee < 0) {
        suspiciousFlags.push('Negative fee value');
    }
    
    // Check for missing required fields
    if (!schoolData.name || !schoolData.email || !schoolData.phone) {
        suspiciousFlags.push('Missing required school information');
    }
    
    return {
        isFake: suspiciousFlags.length > 0,
        flags: suspiciousFlags,
        riskLevel: suspiciousFlags.length > 2 ? 'high' : 'low'
    };
}

/**
 * Apply 20% penalty for fake information
 */
function applyFakePenalty(schoolData) {
    const penaltyPercentage = 0.20; // 20%
    const penaltyAmount = schoolData.annualFee * penaltyPercentage;
    
    return {
        penaltyId: `penalty-${Date.now()}`,
        schoolId: schoolData.id,
        schoolName: schoolData.name,
        originalFee: schoolData.annualFee,
        penaltyAmount: penaltyAmount,
        newFee: schoolData.annualFee + penaltyAmount,
        penaltyType: 'Fake Information',
        penaltyPercentage: (penaltyPercentage * 100) + '%',
        appliedDate: new Date().toISOString(),
        status: 'pending_enforcement',
        reason: 'False or misleading information detected'
    };
}

/**
 * Enforce penalty on school fee
 */
function enforcePenalty(schoolData, penalty) {
    return {
        ...schoolData,
        annualFee: penalty.newFee,
        penaltyApplied: true,
        penaltyDetails: penalty,
        lastPenaltyDate: new Date().toISOString()
    };
}

/**
 * Calculate accumulated penalties for school
 */
function calculateAccumulatedPenalties(penalties) {
    return penalties.reduce((total, penalty) => {
        return total + penalty.penaltyAmount;
    }, 0);
}

/**
 * Check if school is under penalty
 */
function isUnderPenalty(schoolId, allPenalties) {
    return allPenalties.some(p => 
        p.schoolId === schoolId && 
        p.status === 'enforced'
    );
}

module.exports = {
    detectFakeInformation,
    applyFakePenalty,
    enforcePenalty,
    calculateAccumulatedPenalties,
    isUnderPenalty
};
