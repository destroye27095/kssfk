/* ============================================
   KSSFK - Utility Functions
   ============================================ */

/**
 * Filter Engine - Apply multiple filter criteria
 */
function filterSchools(schools, filters) {
    return schools.filter(school => {
        // Gender filter
        if (filters.gender && !school.streams.includes(filters.gender)) {
            return false;
        }

        // Grade filter
        if (filters.grade && school.grade !== filters.grade) {
            return false;
        }

        // Stream filter
        if (filters.stream && !school.streams.includes(filters.stream)) {
            return false;
        }

        // Fee range filter
        if (filters.minFee && school.monthlyFee < filters.minFee) {
            return false;
        }

        if (filters.maxFee && school.monthlyFee > filters.maxFee) {
            return false;
        }

        return true;
    });
}

/**
 * Private Fee Logic - Double fee for private schools not applying for certain programs
 */
function applyPrivateFeeLogic(school, applyingForScholarship = false) {
    if (school.type === 'private' && !applyingForScholarship) {
        return {
            ...school,
            monthlyFee: school.monthlyFee * 2,
            yearlyFee: school.yearlyFee * 2,
            feePriceNote: 'Private school fee (doubled for non-scholarship)'
        };
    }
    return school;
}

/**
 * Scoring Engine - Calculate school rank based on multiple criteria
 */
function scoreSchool(school) {
    let score = 0;

    // Academic performance (0-30 points)
    if (school.academicRating) {
        score += school.academicRating * 3;
    }

    // Infrastructure (0-20 points)
    if (school.infrastructure) {
        score += school.infrastructure * 2;
    }

    // Facilities (0-20 points)
    if (school.facilities) {
        score += school.facilities * 2;
    }

    // Sports (0-15 points)
    if (school.sportsRating) {
        score += school.sportsRating * 1.5;
    }

    // Availability (0-15 points)
    if (school.vacancyRate) {
        score += school.vacancyRate * 1.5;
    }

    return Math.round(score);
}

/**
 * Sort schools by score, fee, or distance
 */
function sortSchools(schools, sortBy = 'score', order = 'desc') {
    const sorted = [...schools].sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'score') {
            comparison = a.score - b.score;
        } else if (sortBy === 'fee') {
            comparison = a.monthlyFee - b.monthlyFee;
        } else if (sortBy === 'name') {
            comparison = a.name.localeCompare(b.name);
        }

        return order === 'desc' ? comparison * -1 : comparison;
    });

    return sorted;
}

/**
 * Load schools data from JSON
 */
async function loadSchools() {
    try {
        const response = await fetch('data/schools.json');
        if (!response.ok) throw new Error('Failed to load schools');
        return await response.json();
    } catch (error) {
        console.error('Error loading schools:', error);
        return [];
    }
}

/**
 * Load payments data
 */
async function loadPayments() {
    try {
        const response = await fetch('data/payments.json');
        if (!response.ok) throw new Error('Failed to load payments');
        return await response.json();
    } catch (error) {
        console.error('Error loading payments:', error);
        return [];
    }
}

/**
 * Load vacancies data
 */
async function loadVacancies() {
    try {
        const response = await fetch('data/vacancies.json');
        if (!response.ok) throw new Error('Failed to load vacancies');
        return await response.json();
    } catch (error) {
        console.error('Error loading vacancies:', error);
        return [];
    }
}

/**
 * Validate school upload - Check terms and payments
 */
function validateSchoolUpload(uploadData) {
    const errors = [];

    // Check if terms accepted
    if (!uploadData.termsAccepted) {
        errors.push('Terms and conditions must be accepted');
    }

    // Check if payment verified
    if (!uploadData.paymentVerified) {
        errors.push('Payment verification required');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
    if (!allowedTypes.includes(uploadData.fileType)) {
        errors.push('Invalid file type. Allowed: JPEG, PNG, MP4, PDF');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Apply penalty for fake information
 */
function applyFakePenalty(school) {
    const penalty = school.monthlyFee * 0.20; // 20% penalty
    return {
        ...school,
        monthlyFee: school.monthlyFee + penalty,
        yearlyFee: school.yearlyFee + (penalty * 12),
        penaltyApplied: true,
        penaltyAmount: penalty,
        penaltyReason: 'Fake information detected and verified'
    };
}

/**
 * Check vacancy availability
 */
function checkVacancy(vacancy) {
    const remainingSeats = vacancy.maxCapacity - vacancy.currentEnrollment;
    return {
        ...vacancy,
        seatsAvailable: remainingSeats > 0,
        remainingSeats: remainingSeats,
        vacancyPercentage: Math.round((remainingSeats / vacancy.maxCapacity) * 100)
    };
}

/**
 * Auto-close vacancy when full
 */
function autoCloseVacancy(vacancy) {
    if (vacancy.currentEnrollment >= vacancy.maxCapacity) {
        return {
            ...vacancy,
            status: 'closed',
            closedAt: new Date().toISOString()
        };
    }
    return vacancy;
}

/**
 * Log activity (for audit trails)
 */
function logActivity(activityType, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: activityType,
        details: details,
        ipAddress: 'client-side',
        userAgent: navigator.userAgent
    };

    // Store in local storage for client-side logging
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('activityLogs', JSON.stringify(logs));

    return logEntry;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Debounce function for event handling
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Generate UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Local storage helpers
 */
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }
};
