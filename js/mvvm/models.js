/**
 * MVVM Models - Data models for KSFP
 * Developer: Wanoto Raphael - Meru University IT
 */

/**
 * School Model
 */
class SchoolModel extends Model {
  initializeProperties() {
    this.defineProperty('id', this.data.id || null);
    this.defineProperty('name', this.data.name || '', (v) => v && v.length > 0);
    this.defineProperty('grade', this.data.grade || '', (v) => v && v.length > 0);
    this.defineProperty('type', this.data.type || 'private');
    this.defineProperty('location', this.data.location || '');
    this.defineProperty('annualFee', this.data.annualFee || 0, (v) => v >= 0);
    this.defineProperty('email', this.data.email || '');
    this.defineProperty('phone', this.data.phone || '');
    this.defineProperty('contactPerson', this.data.contactPerson || '');
    this.defineProperty('website', this.data.website || '');
    this.defineProperty('academicRating', this.data.academicRating || 0, (v) => v >= 0 && v <= 10);
    this.defineProperty('infrastructure', this.data.infrastructure || 0, (v) => v >= 0 && v <= 10);
    this.defineProperty('facilities', this.data.facilities || 0, (v) => v >= 0 && v <= 10);
    this.defineProperty('sportsRating', this.data.sportsRating || 0, (v) => v >= 0 && v <= 10);
    this.defineProperty('staffCount', this.data.staffCount || 0, (v) => v >= 0);
    this.defineProperty('studentCount', this.data.studentCount || 0, (v) => v >= 0);
  }

  getAffordabilityCategory() {
    const fee = this.annualFee;
    if (fee === 0) return 'FREE';
    if (fee < 50000) return 'AFFORDABLE';
    if (fee < 150000) return 'MODERATE';
    return 'PREMIUM';
  }

  getOverallScore() {
    const scores = [
      this.academicRating,
      this.infrastructure,
      this.facilities,
      this.sportsRating
    ];
    const validScores = scores.filter(s => s > 0);
    if (validScores.length === 0) return 0;
    return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  }

  isValid() {
    return this.name && this.grade && this.annualFee >= 0;
  }
}

/**
 * Payment Model
 */
class PaymentModel extends Model {
  initializeProperties() {
    this.defineProperty('id', this.data.id || null);
    this.defineProperty('schoolId', this.data.schoolId || '', (v) => v && v.length > 0);
    this.defineProperty('schoolName', this.data.schoolName || '');
    this.defineProperty('amount', this.data.amount || 0, (v) => v > 0);
    this.defineProperty('purpose', this.data.purpose || '');
    this.defineProperty('paymentMethod', this.data.paymentMethod || '');
    this.defineProperty('status', this.data.status || 'pending');
    this.defineProperty('paymentDate', this.data.paymentDate || new Date().toISOString());
    this.defineProperty('verificationCode', this.data.verificationCode || '');
    this.defineProperty('transactionId', this.data.transactionId || '');
    this.defineProperty('receipt', this.data.receipt || '');
  }

  isVerified() {
    return this.status === 'completed';
  }

  isPending() {
    return this.status === 'pending';
  }

  isFailed() {
    return this.status === 'failed';
  }

  canVerify() {
    return this.status === 'pending' && this.transactionId;
  }
}

/**
 * Fee Structure Model
 */
class FeeStructureModel extends Model {
  initializeProperties() {
    this.defineProperty('id', this.data.id || null);
    this.defineProperty('schoolLevel', this.data.schoolLevel || '', (v) => v && v.length > 0);
    this.defineProperty('schoolType', this.data.schoolType || 'public');
    this.defineProperty('tuitionFee', this.data.tuitionFee || 0, (v) => v >= 0);
    this.defineProperty('enrollmentFee', this.data.enrollmentFee || 0, (v) => v >= 0);
    this.defineProperty('developmentFee', this.data.developmentFee || 0, (v) => v >= 0);
    this.defineProperty('activityFee', this.data.activityFee || 0, (v) => v >= 0);
    this.defineProperty('billingPeriod', this.data.billingPeriod || 'annual');
    this.defineProperty('effectiveFrom', this.data.effectiveFrom || new Date().toISOString().split('T')[0]);
  }

  getAnnualTotal() {
    return this.tuitionFee + this.enrollmentFee + this.developmentFee + this.activityFee;
  }

  getAffordabilityCategory() {
    const total = this.getAnnualTotal();
    if (total === 0) return 'FREE';
    if (total < 50000) return 'AFFORDABLE';
    if (total < 150000) return 'MODERATE';
    return 'PREMIUM';
  }
}

/**
 * Compliance Record Model
 */
class ComplianceModel extends Model {
  initializeProperties() {
    this.defineProperty('id', this.data.id || null);
    this.defineProperty('schoolId', this.data.schoolId || '', (v) => v && v.length > 0);
    this.defineProperty('schoolName', this.data.schoolName || '');
    this.defineProperty('violationType', this.data.violationType || '');
    this.defineProperty('reason', this.data.reason || '');
    this.defineProperty('severity', this.data.severity || 'medium');
    this.defineProperty('status', this.data.status || 'open');
    this.defineProperty('penaltyApplied', this.data.penaltyApplied || false);
    this.defineProperty('penaltyAmount', this.data.penaltyAmount || 0, (v) => v >= 0);
    this.defineProperty('resolvedDate', this.data.resolvedDate || null);
    this.defineProperty('notes', this.data.notes || '');
  }

  isResolved() {
    return this.status === 'resolved';
  }

  isCritical() {
    return this.severity === 'critical';
  }

  canApplyPenalty() {
    return !this.penaltyApplied && this.status === 'open';
  }
}

/**
 * Analytics Model
 */
class AnalyticsModel extends Model {
  initializeProperties() {
    this.defineProperty('period', this.data.period || 'monthly');
    this.defineProperty('totalSchools', this.data.totalSchools || 0);
    this.defineProperty('totalRevenue', this.data.totalRevenue || 0);
    this.defineProperty('totalPayments', this.data.totalPayments || 0);
    this.defineProperty('completedPayments', this.data.completedPayments || 0);
    this.defineProperty('pendingPayments', this.data.pendingPayments || 0);
    this.defineProperty('failedPayments', this.data.failedPayments || 0);
    this.defineProperty('averagePayment', this.data.averagePayment || 0);
    this.defineProperty('paymentSuccessRate', this.data.paymentSuccessRate || 0);
  }

  getSuccessPercentage() {
    return this.paymentSuccessRate || 0;
  }

  getTotalAttempts() {
    return this.completedPayments + this.pendingPayments + this.failedPayments;
  }
}

// Export Models
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SchoolModel,
    PaymentModel,
    FeeStructureModel,
    ComplianceModel,
    AnalyticsModel
  };
}
