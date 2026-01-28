/**
 * MVVM Views - UI components and event handling
 * Developer: Wanoto Raphael - Meru University IT
 */

/**
 * School Management View
 */
class SchoolManagementView extends View {
  setupBindings() {
    // School list bindings would go here
    // this.bindProperty('#schoolList', 'schools', 'one-way');
    // this.bindProperty('#filterType', 'filterType', 'two-way');
    // this.bindProperty('#filterMaxFee', 'filterMaxFee', 'two-way');
  }

  setupEventListeners() {
    this.addEventListener('.btn-load-schools', 'click', () => {
      this.viewModel.executeCommand('loadSchools');
    });

    this.addEventListener('.btn-create-school', 'click', () => {
      this.showCreateForm();
    });

    this.addEventListener('.btn-apply-filters', 'click', () => {
      const type = this.rootElement.querySelector('#filterType')?.value || 'all';
      const maxFee = this.rootElement.querySelector('#filterMaxFee')?.value || 500000;
      this.viewModel.executeCommand('setFilters', type, maxFee);
    });

    this.addEventListener('.btn-search', 'click', () => {
      const query = this.rootElement.querySelector('#searchQuery')?.value || '';
      if (query) {
        this.viewModel.executeCommand('searchSchools', { query });
      }
    });
  }

  showCreateForm() {
    // Implementation for showing create form modal
    const modal = this.rootElement.querySelector('#schoolModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  renderSchools(schools) {
    const listElement = this.rootElement.querySelector('.schools-list');
    if (!listElement) return;

    listElement.innerHTML = schools.map(school => `
      <div class="school-row" data-school-id="${school.id}">
        <div class="school-info">
          <h3>${school.name}</h3>
          <p>Grade: ${school.grade} | Type: ${school.type}</p>
          <p>Annual Fee: KES ${school.annualFee.toLocaleString()}</p>
          <span class="affordability-badge ${school.getAffordabilityCategory().toLowerCase()}">
            ${school.getAffordabilityCategory()}
          </span>
        </div>
        <div class="school-actions">
          <button class="btn btn-sm btn-info" onclick="schoolView.selectSchool('${school.id}')">
            View Details
          </button>
          <button class="btn btn-sm btn-edit" onclick="schoolView.editSchool('${school.id}')">
            Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="schoolView.deleteSchool('${school.id}')">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  selectSchool(schoolId) {
    this.viewModel.executeCommand('selectSchool', schoolId).then(() => {
      const school = this.viewModel.selectedSchool;
      this.showSchoolDetails(school);
    });
  }

  editSchool(schoolId) {
    this.viewModel.executeCommand('selectSchool', schoolId).then(() => {
      this.showEditForm(this.viewModel.selectedSchool);
    });
  }

  deleteSchool(schoolId) {
    if (confirm('Are you sure you want to delete this school?')) {
      this.viewModel.executeCommand('deleteSchool', schoolId);
    }
  }

  showSchoolDetails(school) {
    const detailsPanel = this.rootElement.querySelector('.school-details');
    if (detailsPanel) {
      detailsPanel.innerHTML = `
        <div class="details-content">
          <h3>${school.name}</h3>
          <div class="detail-row">
            <label>Grade:</label>
            <span>${school.grade}</span>
          </div>
          <div class="detail-row">
            <label>Type:</label>
            <span>${school.type}</span>
          </div>
          <div class="detail-row">
            <label>Annual Fee:</label>
            <span>KES ${school.annualFee.toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <label>Location:</label>
            <span>${school.location}</span>
          </div>
          <div class="detail-row">
            <label>Overall Score:</label>
            <span>${school.getOverallScore().toFixed(2)}/10</span>
          </div>
          <div class="detail-row">
            <label>Contact Person:</label>
            <span>${school.contactPerson}</span>
          </div>
          <div class="detail-row">
            <label>Email:</label>
            <span>${school.email}</span>
          </div>
          <div class="detail-row">
            <label>Phone:</label>
            <span>${school.phone}</span>
          </div>
        </div>
      `;
    }
  }

  showEditForm(school) {
    // Implementation for edit form
    const modal = this.rootElement.querySelector('#schoolModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      // Populate form with school data
      this.rootElement.querySelector('#schoolName').value = school.name;
      this.rootElement.querySelector('#schoolGrade').value = school.grade;
      this.rootElement.querySelector('#schoolType').value = school.type;
      this.rootElement.querySelector('#schoolAnnualFee').value = school.annualFee;
      this.rootElement.querySelector('#schoolLocation').value = school.location;
    }
  }

  onPropertyChanged(propertyName) {
    if (propertyName === 'schools') {
      this.renderSchools(this.viewModel.schools);
    }
  }
}

/**
 * Payment Management View
 */
class PaymentManagementView extends View {
  setupBindings() {
    // Payment bindings
  }

  setupEventListeners() {
    this.addEventListener('.btn-load-payments', 'click', () => {
      this.viewModel.executeCommand('loadPayments');
    });

    this.addEventListener('.btn-create-payment', 'click', () => {
      this.showCreatePaymentForm();
    });

    this.addEventListener('.btn-load-stats', 'click', () => {
      this.viewModel.executeCommand('loadStats');
    });

    this.addEventListener('.btn-apply-filters', 'click', () => {
      const status = this.rootElement.querySelector('#filterStatus')?.value || 'all';
      const schoolId = this.rootElement.querySelector('#filterSchoolId')?.value || '';
      this.viewModel.executeCommand('setFilters', status, schoolId);
    });
  }

  renderPayments(payments) {
    const listElement = this.rootElement.querySelector('.payments-list');
    if (!listElement) return;

    listElement.innerHTML = payments.map(payment => `
      <div class="payment-row" data-payment-id="${payment.id}">
        <div class="payment-info">
          <h4>${payment.schoolName}</h4>
          <p>Amount: KES ${payment.amount.toLocaleString()}</p>
          <p>Purpose: ${payment.purpose}</p>
          <span class="status-badge ${payment.status}">
            ${payment.status.toUpperCase()}
          </span>
        </div>
        <div class="payment-actions">
          <button class="btn btn-sm btn-info" onclick="paymentView.selectPayment('${payment.id}')">
            Details
          </button>
          ${payment.canVerify() ? `
            <button class="btn btn-sm btn-success" onclick="paymentView.verifyPayment('${payment.id}')">
              Verify
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  renderStats(stats) {
    const statsElement = this.rootElement.querySelector('.payment-stats');
    if (!statsElement || !stats) return;

    statsElement.innerHTML = `
      <div class="stat-card">
        <h5>Total Payments</h5>
        <p class="stat-value">${stats.totalPayments || 0}</p>
      </div>
      <div class="stat-card">
        <h5>Total Amount</h5>
        <p class="stat-value">KES ${(stats.totalAmount || 0).toLocaleString()}</p>
      </div>
      <div class="stat-card">
        <h5>Success Rate</h5>
        <p class="stat-value">${stats.successRate || 0}%</p>
      </div>
      <div class="stat-card">
        <h5>Completed</h5>
        <p class="stat-value">${stats.completedCount || 0}</p>
      </div>
      <div class="stat-card">
        <h5>Pending</h5>
        <p class="stat-value">${stats.pendingCount || 0}</p>
      </div>
      <div class="stat-card">
        <h5>Failed</h5>
        <p class="stat-value">${stats.failedCount || 0}</p>
      </div>
    `;
  }

  selectPayment(paymentId) {
    this.viewModel.executeCommand('selectPayment', paymentId);
  }

  verifyPayment(paymentId) {
    const code = prompt('Enter verification code:');
    if (code) {
      this.viewModel.executeCommand('verifyPayment', paymentId, code);
    }
  }

  showCreatePaymentForm() {
    const modal = this.rootElement.querySelector('#paymentModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  onPropertyChanged(propertyName) {
    if (propertyName === 'payments') {
      this.renderPayments(this.viewModel.payments);
    } else if (propertyName === 'stats') {
      this.renderStats(this.viewModel.stats);
    }
  }
}

/**
 * Fee Management View
 */
class FeeManagementView extends View {
  setupBindings() {
    // Fee bindings
  }

  setupEventListeners() {
    this.addEventListener('.btn-load-fees', 'click', () => {
      this.viewModel.executeCommand('loadFees');
    });

    this.addEventListener('.btn-load-report', 'click', () => {
      this.viewModel.executeCommand('loadAffordabilityReport');
    });

    this.addEventListener('.btn-create-fee', 'click', () => {
      this.showCreateFeeForm();
    });
  }

  renderFeeStructures(fees) {
    const listElement = this.rootElement.querySelector('.fee-structures');
    if (!listElement) return;

    listElement.innerHTML = fees.map(fee => `
      <div class="fee-row">
        <div class="fee-info">
          <h4>${fee.schoolLevel} - ${fee.schoolType}</h4>
          <p>Annual Total: KES ${fee.getAnnualTotal().toLocaleString()}</p>
          <p>Category: ${fee.getAffordabilityCategory()}</p>
          <small>Effective from: ${fee.effectiveFrom}</small>
        </div>
        <div class="fee-breakdown">
          <p>Tuition: KES ${fee.tuitionFee.toLocaleString()}</p>
          <p>Enrollment: KES ${fee.enrollmentFee.toLocaleString()}</p>
          <p>Development: KES ${fee.developmentFee.toLocaleString()}</p>
          <p>Activity: KES ${fee.activityFee.toLocaleString()}</p>
        </div>
      </div>
    `).join('');
  }

  renderAffordabilityReport(report) {
    const reportElement = this.rootElement.querySelector('.affordability-report');
    if (!reportElement || !report) return;

    reportElement.innerHTML = `
      <div class="report-content">
        <h4>Affordability Distribution</h4>
        <div class="affordability-stats">
          <div class="stat">
            <label>Free Schools:</label>
            <span>${report.freeSchools || 0}</span>
          </div>
          <div class="stat">
            <label>Affordable:</label>
            <span>${report.affordable || 0}</span>
          </div>
          <div class="stat">
            <label>Moderate:</label>
            <span>${report.moderate || 0}</span>
          </div>
          <div class="stat">
            <label>Premium:</label>
            <span>${report.premium || 0}</span>
          </div>
        </div>
        <p>Average Annual Fee: KES ${(report.averageAnnualFee || 0).toLocaleString()}</p>
      </div>
    `;
  }

  showCreateFeeForm() {
    const modal = this.rootElement.querySelector('#feeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  onPropertyChanged(propertyName) {
    if (propertyName === 'feeStructures') {
      this.renderFeeStructures(this.viewModel.feeStructures);
    } else if (propertyName === 'affordabilityReport') {
      this.renderAffordabilityReport(this.viewModel.affordabilityReport);
    }
  }
}

/**
 * Compliance Management View
 */
class ComplianceManagementView extends View {
  setupBindings() {
    // Compliance bindings
  }

  setupEventListeners() {
    this.addEventListener('.btn-load-compliance', 'click', () => {
      this.viewModel.executeCommand('loadComplianceStatus');
    });

    this.addEventListener('.btn-apply-penalties', 'click', () => {
      this.showPenaltyForm();
    });
  }

  renderComplianceStatus(status) {
    const statusElement = this.rootElement.querySelector('.compliance-status');
    if (!statusElement || !status) return;

    statusElement.innerHTML = `
      <div class="status-overview">
        <div class="status-card compliant">
          <h5>Compliant Schools</h5>
          <p class="number">${status.compliant || 0}</p>
        </div>
        <div class="status-card at-risk">
          <h5>At Risk Schools</h5>
          <p class="number">${status.at_risk || 0}</p>
        </div>
        <div class="status-card non-compliant">
          <h5>Non-Compliant Schools</h5>
          <p class="number">${status.non_compliant || 0}</p>
        </div>
        <div class="status-card">
          <h5>Compliance Rate</h5>
          <p class="number">${(status.compliance_rate || 0).toFixed(1)}%</p>
        </div>
      </div>
    `;
  }

  renderViolations(violations) {
    const violationsElement = this.rootElement.querySelector('.violations-list');
    if (!violationsElement) return;

    violationsElement.innerHTML = violations.map(violation => `
      <div class="violation-row severity-${violation.severity}">
        <div class="violation-info">
          <h5>${violation.schoolName}</h5>
          <p>Type: ${violation.violationType}</p>
          <p>Reason: ${violation.reason}</p>
          <span class="severity-badge">${violation.severity.toUpperCase()}</span>
        </div>
        <div class="violation-action">
          ${violation.canApplyPenalty() ? `
            <button class="btn btn-sm btn-warning" onclick="complianceView.applyPenalty('${violation.id}')">
              Apply Penalty
            </button>
          ` : ''}
          ${violation.penaltyApplied ? `
            <p>Penalty: KES ${violation.penaltyAmount.toLocaleString()}</p>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  applyPenalty(violationId) {
    // Implementation for penalty application
    const penalty = this.viewModel.violations.find(v => v.id === violationId);
    if (penalty && penalty.canApplyPenalty()) {
      this.viewModel.executeCommand('applyPenalty', {
        schoolId: penalty.schoolId,
        violationType: penalty.violationType,
        reason: penalty.reason,
        penaltyPercentage: 20
      });
    }
  }

  showPenaltyForm() {
    const modal = this.rootElement.querySelector('#penaltyModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  onPropertyChanged(propertyName) {
    if (propertyName === 'complianceStatus') {
      this.renderComplianceStatus(this.viewModel.complianceStatus);
    } else if (propertyName === 'violations') {
      this.renderViolations(this.viewModel.violations);
    }
  }
}

// Export Views
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SchoolManagementView,
    PaymentManagementView,
    FeeManagementView,
    ComplianceManagementView
  };
}
