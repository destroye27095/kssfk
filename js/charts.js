/* ============================================
   KSSFK - Charts and Analytics
   ============================================ */

/**
 * Initialize charts using Chart.js library
 */
function initializeCharts() {
    // Placeholder for chart initialization
    // Requires Chart.js library to be loaded
}

/**
 * Generate fee trends chart
 */
function generateFeeTrendsChart(data) {
    // Analyze fee trends across school types and levels
    const feeData = data.reduce((acc, school) => {
        const key = `${school.type}-${school.grade}`;
        if (!acc[key]) {
            acc[key] = {
                type: school.type,
                grade: school.grade,
                fees: [],
                count: 0
            };
        }
        acc[key].fees.push(school.monthlyFee);
        acc[key].count++;
        return acc;
    }, {});

    // Calculate averages
    const chartData = Object.values(feeData).map(item => ({
        label: `${item.grade} (${item.type})`,
        average: (item.fees.reduce((a, b) => a + b, 0) / item.count).toFixed(2),
        count: item.count
    }));

    return chartData;
}

/**
 * Generate stream popularity chart
 */
function generateStreamPopularityChart(data) {
    const streamCount = {};

    data.forEach(school => {
        school.streams.forEach(stream => {
            streamCount[stream] = (streamCount[stream] || 0) + 1;
        });
    });

    return Object.entries(streamCount).map(([stream, count]) => ({
        stream,
        count,
        percentage: ((count / data.length) * 100).toFixed(1)
    }));
}

/**
 * Generate parent preference statistics
 */
function generateParentPreferenceStats(enrollments) {
    const preferences = {};

    enrollments.forEach(enrollment => {
        const schoolName = enrollment.schoolName;
        preferences[schoolName] = (preferences[schoolName] || 0) + 1;
    });

    return Object.entries(preferences)
        .map(([school, count]) => ({
            school,
            enrollments: count
        }))
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 10); // Top 10
}

/**
 * Generate fee comparison data
 */
function generateFeeComparisonData(data) {
    const byLevel = {};

    data.forEach(school => {
        if (!byLevel[school.grade]) {
            byLevel[school.grade] = [];
        }
        byLevel[school.grade].push(school.monthlyFee);
    });

    return Object.entries(byLevel).map(([level, fees]) => ({
        level,
        min: Math.min(...fees),
        max: Math.max(...fees),
        average: (fees.reduce((a, b) => a + b, 0) / fees.length).toFixed(2),
        median: getMedian(fees)
    }));
}

/**
 * Calculate median value
 */
function getMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
}

/**
 * Generate vacancy analysis
 */
function generateVacancyAnalysis(vacancies) {
    const total = vacancies.length;
    const open = vacancies.filter(v => v.status === 'open').length;
    const closed = vacancies.filter(v => v.status === 'closed').length;
    const totalSeats = vacancies.reduce((sum, v) => sum + v.maxCapacity, 0);
    const filledSeats = vacancies.reduce((sum, v) => sum + v.currentEnrollment, 0);

    return {
        totalVacancies: total,
        openVacancies: open,
        closedVacancies: closed,
        openPercentage: ((open / total) * 100).toFixed(1),
        totalSeatsAvailable: totalSeats,
        seatsFilledPercentage: ((filledSeats / totalSeats) * 100).toFixed(1)
    };
}

/**
 * Generate upload statistics
 */
function generateUploadStatistics(uploads) {
    const byType = {};
    const byStatus = {};

    uploads.forEach(upload => {
        // Count by type
        byType[upload.type] = (byType[upload.type] || 0) + 1;

        // Count by status
        byStatus[upload.status] = (byStatus[upload.status] || 0) + 1;
    });

    return {
        totalUploads: uploads.length,
        byType: Object.entries(byType).map(([type, count]) => ({
            type,
            count
        })),
        byStatus: Object.entries(byStatus).map(([status, count]) => ({
            status,
            count
        }))
    };
}

/**
 * Generate penalty statistics
 */
function generatePenaltyStatistics(penalties) {
    const byReason = {};
    let totalPenalties = 0;

    penalties.forEach(penalty => {
        byReason[penalty.reason] = (byReason[penalty.reason] || 0) + 1;
        totalPenalties += penalty.amount;
    });

    return {
        totalPenalties: penalties.length,
        totalAmount: totalPenalties,
        averagePenalty: (totalPenalties / penalties.length).toFixed(2),
        byReason: Object.entries(byReason).map(([reason, count]) => ({
            reason,
            count
        }))
    };
}

/**
 * Generate payment analytics
 */
function generatePaymentAnalytics(payments) {
    const byMonth = {};
    const byStatus = {};

    payments.forEach(payment => {
        // Group by month
        const date = new Date(payment.paymentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + payment.amount;

        // Count by status
        byStatus[payment.status] = (byStatus[payment.status] || 0) + 1;
    });

    return {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        averagePayment: (payments.reduce((sum, p) => sum + p.amount, 0) / payments.length).toFixed(2),
        byMonth: Object.entries(byMonth).map(([month, amount]) => ({
            month,
            amount
        })),
        byStatus: Object.entries(byStatus).map(([status, count]) => ({
            status,
            count
        }))
    };
}
