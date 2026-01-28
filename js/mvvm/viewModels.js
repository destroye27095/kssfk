/**
 * MVVM ViewModels - Business logic and state management
 * Developer: Wanoto Raphael - Meru University IT
 */

/**
 * School Data Service
 */
class SchoolDataService extends DataService {
  async getSchools(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/schools?${params.toString()}`);
  }

  async getSchoolById(id) {
    return this.get(`/schools/${id}`);
  }

  async createSchool(schoolData) {
    return this.post('/schools', schoolData);
  }

  async updateSchool(id, schoolData) {
    return this.put(`/schools/${id}`, schoolData);
  }

  async deleteSchool(id) {
    return this.delete(`/schools/${id}`);
  }

  async searchSchools(query) {
    return this.post('/schools/search', query);
  }
}

/**
 * Payment Data Service
 */
class PaymentDataService extends DataService {
  async getPayments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/payments?${params.toString()}`);
  }

  async getPaymentById(id) {
    return this.get(`/payments/${id}`);
  }

  async createPayment(paymentData) {
    return this.post('/payments', paymentData);
  }

  async verifyPayment(id, code) {
    return this.put(`/payments/${id}/verify`, { verificationCode: code });
  }

  async getPaymentStats() {
    return this.get('/payments/stats/summary');
  }
}

/**
 * Fee Data Service
 */
class FeeDataService extends DataService {
  async getFeeGuidelines() {
    return this.get('/admin/fees');
  }

  async getFeesBySchool(schoolId) {
    return this.get(`/admin/fees/${schoolId}`);
  }

  async createFeeStructure(feeData) {
    return this.post('/admin/fees', feeData);
  }

  async getAffordabilityReport() {
    return this.get('/admin/fees/report/affordability');
  }
}

/**
 * Compliance Data Service
 */
class ComplianceDataService extends DataService {
  async getComplianceStatus() {
    return this.get('/compliance/status');
  }

  async applyPenalty(penaltyData) {
    return this.post('/compliance/penalties', penaltyData);
  }
}

/**
 * School ViewModel
 */
class SchoolViewModel extends ViewModel {
  constructor() {
    super();
    this.dataService = new SchoolDataService();
  }

  initializeViewModel() {
    // Observable properties
    this.defineProperty('schools', [], null);
    this.defineProperty('selectedSchool', null, null);
    this.defineProperty('filterType', 'all', null);
    this.defineProperty('filterMaxFee', 500000, null);
    this.defineProperty('searchQuery', '', null);
    this.defineProperty('sortBy', 'name', null);
    this.defineProperty('currentPage', 1, null);
    this.defineProperty('pageSize', 20, null);
    this.defineProperty('totalCount', 0, null);

    // Commands
    this.defineCommand('loadSchools', this.loadSchools);
    this.defineCommand('selectSchool', this.selectSchool);
    this.defineCommand('createSchool', this.createSchool);
    this.defineCommand('updateSchool', this.updateSchool);
    this.defineCommand('deleteSchool', this.deleteSchool);
    this.defineCommand('searchSchools', this.searchSchools);
    this.defineCommand('setFilters', this.setFilters);
  }

  async loadSchools() {
    await this.loadData();
    try {
      const filters = {
        type: this.filterType === 'all' ? undefined : this.filterType,
        maxFee: this.filterMaxFee,
        page: this.currentPage,
        limit: this.pageSize
      };

      const response = await this.dataService.getSchools(filters);
      const schools = response.data.map(data => new SchoolModel(data));
      this.defineProperty('schools', schools);
      this.defineProperty('totalCount', response.pagination?.total || 0);
    } catch (error) {
      this.setError(`Failed to load schools: ${error.message}`);
    }
  }

  async selectSchool(schoolId) {
    try {
      const response = await this.dataService.getSchoolById(schoolId);
      const school = new SchoolModel(response.data);
      this.defineProperty('selectedSchool', school);
    } catch (error) {
      this.setError(`Failed to load school: ${error.message}`);
    }
  }

  async createSchool(schoolData) {
    this.setLoading(true);
    this.clearError();
    try {
      const school = new SchoolModel(schoolData);
      if (!school.isValid()) {
        throw new Error('Invalid school data');
      }

      const response = await this.dataService.createSchool(schoolData);
      await this.loadSchools();
      return response.data;
    } catch (error) {
      this.setError(`Failed to create school: ${error.message}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async updateSchool(schoolId, schoolData) {
    this.setLoading(true);
    this.clearError();
    try {
      const school = new SchoolModel(schoolData);
      if (!school.isValid()) {
        throw new Error('Invalid school data');
      }

      const response = await this.dataService.updateSchool(schoolId, schoolData);
      await this.loadSchools();
      return response.data;
    } catch (error) {
      this.setError(`Failed to update school: ${error.message}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteSchool(schoolId) {
    this.setLoading(true);
    this.clearError();
    try {
      await this.dataService.deleteSchool(schoolId);
      await this.loadSchools();
    } catch (error) {
      this.setError(`Failed to delete school: ${error.message}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async searchSchools(query) {
    this.setLoading(true);
    this.clearError();
    try {
      const response = await this.dataService.searchSchools(query);
      const schools = response.data.map(data => new SchoolModel(data));
      this.defineProperty('schools', schools);
    } catch (error) {
      this.setError(`Search failed: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  setFilters(type, maxFee) {
    this.defineProperty('filterType', type);
    this.defineProperty('filterMaxFee', maxFee);
    this.defineProperty('currentPage', 1);
    return this.loadSchools();
  }

  getTotalPages() {
    return Math.ceil(this.totalCount / this.pageSize);
  }
}

/**
 * Payment ViewModel
 */
class PaymentViewModel extends ViewModel {
  constructor() {
    super();
    this.dataService = new PaymentDataService();
  }

  initializeViewModel() {
    this.defineProperty('payments', []);
    this.defineProperty('selectedPayment', null);
    this.defineProperty('filterStatus', 'all');
    this.defineProperty('filterSchoolId', '');
    this.defineProperty('currentPage', 1);
    this.defineProperty('pageSize', 20);
    this.defineProperty('totalCount', 0);
    this.defineProperty('stats', null);

    this.defineCommand('loadPayments', this.loadPayments);
    this.defineCommand('selectPayment', this.selectPayment);
    this.defineCommand('createPayment', this.createPayment);
    this.defineCommand('verifyPayment', this.verifyPayment);
    this.defineCommand('loadStats', this.loadStats);
    this.defineCommand('setFilters', this.setFilters);
  }

  async loadPayments() {
    await this.loadData();
    try {
      const filters = {
        status: this.filterStatus === 'all' ? undefined : this.filterStatus,
        schoolId: this.filterSchoolId || undefined,
        page: this.currentPage,
        limit: this.pageSize
      };

      const response = await this.dataService.getPayments(filters);
      const payments = response.data.map(data => new PaymentModel(data));
      this.defineProperty('payments', payments);
      this.defineProperty('totalCount', response.pagination?.total || 0);
    } catch (error) {
      this.setError(`Failed to load payments: ${error.message}`);
    }
  }

  async selectPayment(paymentId) {
    try {
      const response = await this.dataService.getPaymentById(paymentId);
      const payment = new PaymentModel(response.data);
      this.defineProperty('selectedPayment', payment);
    } catch (error) {
      this.setError(`Failed to load payment: ${error.message}`);
    }
  }

  async createPayment(paymentData) {
    this.setLoading(true);
    this.clearError();
    try {
      const payment = new PaymentModel(paymentData);
      const response = await this.dataService.createPayment(paymentData);
      await this.loadPayments();
      return response.data;
    } catch (error) {
      this.setError(`Failed to create payment: ${error.message}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async verifyPayment(paymentId, code) {
    this.setLoading(true);
    this.clearError();
    try {
      const response = await this.dataService.verifyPayment(paymentId, code);
      await this.loadPayments();
      return response.data;
    } catch (error) {
      this.setError(`Failed to verify payment: ${error.message}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async loadStats() {
    try {
      const response = await this.dataService.getPaymentStats();
      this.defineProperty('stats', response.data);
    } catch (error) {
      this.setError(`Failed to load stats: ${error.message}`);
    }
  }

  setFilters(status, schoolId) {
    this.defineProperty('filterStatus', status);
    this.defineProperty('filterSchoolId', schoolId);
    this.defineProperty('currentPage', 1);
    return this.loadPayments();
  }
}

/**
 * Fee Management ViewModel
 */
class FeeManagementViewModel extends ViewModel {
  constructor() {
    super();
    this.dataService = new FeeDataService();
  }

  initializeViewModel() {
    this.defineProperty('feeStructures', []);
    this.defineProperty('selectedFee', null);
    this.defineProperty('affordabilityReport', null);

    this.defineCommand('loadFees', this.loadFees);
    this.defineCommand('createFeeStructure', this.createFeeStructure);
    this.defineCommand('loadAffordabilityReport', this.loadAffordabilityReport);
  }

  async loadFees() {
    await this.loadData();
    try {
      const response = await this.dataService.getFeeGuidelines();
      const fees = response.data.map(data => new FeeStructureModel(data));
      this.defineProperty('feeStructures', fees);
    } catch (error) {
      this.setError(`Failed to load fees: ${error.message}`);
    }
  }

  async createFeeStructure(feeData) {
    this.setLoading(true);
    this.clearError();
    try {
      const fee = new FeeStructureModel(feeData);
      const response = await this.dataService.createFeeStructure(feeData);
      await this.loadFees();
      return response.data;
    } catch (error) {
      this.setError(`Failed to create fee structure: ${error.message}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async loadAffordabilityReport() {
    try {
      const response = await this.dataService.getAffordabilityReport();
      this.defineProperty('affordabilityReport', response.data);
    } catch (error) {
      this.setError(`Failed to load report: ${error.message}`);
    }
  }
}

/**
 * Compliance ViewModel
 */
class ComplianceViewModel extends ViewModel {
  constructor() {
    super();
    this.dataService = new ComplianceDataService();
  }

  initializeViewModel() {
    this.defineProperty('complianceStatus', null);
    this.defineProperty('violations', []);

    this.defineCommand('loadComplianceStatus', this.loadComplianceStatus);
    this.defineCommand('applyPenalty', this.applyPenalty);
  }

  async loadComplianceStatus() {
    await this.loadData();
    try {
      const response = await this.dataService.getComplianceStatus();
      this.defineProperty('complianceStatus', response.data);
      const violations = response.data.violations?.map(v => new ComplianceModel(v)) || [];
      this.defineProperty('violations', violations);
    } catch (error) {
      this.setError(`Failed to load compliance status: ${error.message}`);
    }
  }

  async applyPenalty(penaltyData) {
    this.setLoading(true);
    this.clearError();
    try {
      const response = await this.dataService.applyPenalty(penaltyData);
      await this.loadComplianceStatus();
      return response.data;
    } catch (error) {
      this.setError(`Failed to apply penalty: ${error.message}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }
}

// Export ViewModels
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SchoolViewModel,
    PaymentViewModel,
    FeeManagementViewModel,
    ComplianceViewModel
  };
}
