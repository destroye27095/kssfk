# MVVM Architecture Implementation Guide

**Version**: 1.0.0  
**Date**: January 28, 2026  
**Developer**: Wanoto Raphael - Meru University IT

---

## 📋 Overview

MVVM (Model-View-ViewModel) is an architectural pattern that separates concerns into three distinct layers:

- **Model**: Data and business logic
- **View**: User interface and presentation
- **ViewModel**: Logic that connects Model and View, manages state

This implementation provides a production-ready MVVM framework for the KSFP frontend.

---

## 🗂️ Architecture Structure

```
MVVM Framework
├── Core Framework (core.js)
│   ├── Observable - Property observation
│   ├── ObservableCollection - Array observation
│   ├── Model - Base model class
│   ├── ViewModel - Base viewmodel class
│   ├── DataService - API communication
│   ├── Binding - Two-way data binding
│   └── View - Base view class
│
├── Models (models.js)
│   ├── SchoolModel
│   ├── PaymentModel
│   ├── FeeStructureModel
│   ├── ComplianceModel
│   └── AnalyticsModel
│
├── ViewModels (viewModels.js)
│   ├── SchoolViewModel
│   ├── PaymentViewModel
│   ├── FeeManagementViewModel
│   └── ComplianceViewModel
│
└── Views (views.js)
    ├── SchoolManagementView
    ├── PaymentManagementView
    ├── FeeManagementView
    └── ComplianceManagementView
```

---

## 🔧 Core Components

### 1. Observable

Provides property-level observation for automatic change detection.

```javascript
// Create observable property
const schoolName = new Observable('St. Mary Academy');

// Subscribe to changes
schoolName.subscribe((newValue, oldValue) => {
  console.log(`Changed from ${oldValue} to ${newValue}`);
});

// Update value (triggers subscribers)
schoolName.setValue('St. Mary Academy Updated');

// Get value
console.log(schoolName.getValue());
```

### 2. ObservableCollection

Provides collection observation for array operations.

```javascript
// Create observable collection
const schools = new ObservableCollection([school1, school2]);

// Subscribe to changes
schools.subscribe(({ action, items, index }) => {
  console.log(`Action: ${action}, Index: ${index}`);
});

// Perform operations (trigger subscribers)
schools.add(newSchool);
schools.remove(school1);
schools.update(school1);
schools.clear();

// Access items
const items = schools.getItems();
const filtered = schools.filter(s => s.annualFee < 100000);
```

### 3. Model

Base class for domain models with property definitions and validation.

```javascript
class SchoolModel extends Model {
  initializeProperties() {
    // Define properties with validation
    this.defineProperty('name', '', (v) => v && v.length > 0);
    this.defineProperty('annualFee', 0, (v) => v >= 0);
    this.defineProperty('academicRating', 0, (v) => v >= 0 && v <= 10);
  }

  // Add business logic methods
  getAffordabilityCategory() {
    if (this.annualFee === 0) return 'FREE';
    if (this.annualFee < 50000) return 'AFFORDABLE';
    if (this.annualFee < 150000) return 'MODERATE';
    return 'PREMIUM';
  }
}

// Usage
const school = new SchoolModel({
  name: 'St. Mary Academy',
  annualFee: 100000,
  academicRating: 8.5
});

console.log(school.getAffordabilityCategory()); // MODERATE
```

### 4. ViewModel

Manages UI state, commands, and business logic operations.

```javascript
class SchoolViewModel extends ViewModel {
  constructor() {
    super();
    this.dataService = new SchoolDataService();
  }

  initializeViewModel() {
    // Define observable properties
    this.defineProperty('schools', []);
    this.defineProperty('selectedSchool', null);
    this.defineProperty('filterType', 'all');

    // Define commands
    this.defineCommand('loadSchools', this.loadSchools);
    this.defineCommand('selectSchool', this.selectSchool);
    this.defineCommand('createSchool', this.createSchool);
  }

  async loadSchools() {
    this.setLoading(true);
    try {
      const response = await this.dataService.getSchools();
      const schools = response.data.map(d => new SchoolModel(d));
      this.defineProperty('schools', schools);
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }
}

// Usage
const viewModel = new SchoolViewModel();
await viewModel.loadSchools();
console.log(viewModel.schools);
```

### 5. DataService

Handles API communication with built-in authentication.

```javascript
class SchoolDataService extends DataService {
  async getSchools(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/schools?${params.toString()}`);
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
}
```

### 6. Binding

Two-way data binding between ViewModel and View elements.

```javascript
// Manual binding
const binding = new Binding(
  document.getElementById('schoolName'),
  viewModel,
  'selectedSchoolName',
  'two-way'
);

// Or use in View class
class MyView extends View {
  setupBindings() {
    this.bindProperty('#schoolName', 'schoolName', 'two-way');
    this.bindProperty('#annualFee', 'annualFee', 'two-way');
    this.bindProperty('#status', 'status', 'one-way');
  }
}
```

### 7. View

Base class for UI components with automatic change detection.

```javascript
class SchoolManagementView extends View {
  setupBindings() {
    // Setup two-way bindings
    this.bindProperty('#schoolName', 'schoolName');
    this.bindProperty('#annualFee', 'annualFee');
  }

  setupEventListeners() {
    // Attach event handlers
    this.addEventListener('.btn-save', 'click', () => {
      this.viewModel.executeCommand('saveSchool');
    });
  }

  onPropertyChanged(propertyName) {
    // Handle ViewModel changes
    if (propertyName === 'schools') {
      this.renderSchools(this.viewModel.schools);
    }
  }

  renderSchools(schools) {
    const list = this.rootElement.querySelector('.school-list');
    list.innerHTML = schools.map(s => `
      <div class="school-item">
        <h4>${s.name}</h4>
        <p>Annual Fee: KES ${s.annualFee}</p>
      </div>
    `).join('');
  }
}

// Usage
const view = new SchoolManagementView(viewModel, document.getElementById('app'));
```

---

## 📊 Data Flow

### User Interaction Flow

```
User Input
    ↓
View Event Handler
    ↓
ViewModel Command Execution
    ↓
Model Validation
    ↓
DataService API Call
    ↓
Server Response
    ↓
Model Update
    ↓
Observable.notify()
    ↓
View Update (via subscription)
    ↓
UI Re-render
```

### Example: Creating a School

```javascript
// 1. User fills form and clicks Save
// 2. View's event handler captures input
const schoolData = {
  name: this.rootElement.querySelector('#name').value,
  annualFee: this.rootElement.querySelector('#fee').value
};

// 3. Execute ViewModel command
await this.viewModel.executeCommand('createSchool', schoolData);

// 4. ViewModel validates and calls DataService
async createSchool(data) {
  const model = new SchoolModel(data);
  if (!model.isValid()) throw new Error('Invalid data');
  
  const response = await this.dataService.createSchool(data);
  
  // 5. Update ViewModel state
  this.defineProperty('schools', [...this.schools, response.data]);
}

// 6. Observable notifies subscribers (View)
// 7. View's onPropertyChanged() called
// 8. View re-renders schools list with new school
```

---

## 🎯 Usage Examples

### Example 1: School Management

```html
<div id="schoolApp">
  <div class="filters">
    <select id="filterType">
      <option value="all">All Types</option>
      <option value="private">Private</option>
      <option value="public">Public</option>
    </select>
    <button class="btn-apply-filters">Apply Filters</button>
  </div>
  
  <div class="schools-list"></div>
  
  <div class="school-details"></div>
  
  <div class="error-message" style="display:none;"></div>
</div>

<script src="js/mvvm/core.js"></script>
<script src="js/mvvm/models.js"></script>
<script src="js/mvvm/viewModels.js"></script>
<script src="js/mvvm/views.js"></script>

<script>
  // Initialize ViewModel
  const schoolVM = new SchoolViewModel();
  
  // Initialize View
  const schoolView = new SchoolManagementView(
    schoolVM,
    document.getElementById('schoolApp')
  );
  
  // Load initial data
  schoolVM.loadSchools();
</script>
```

### Example 2: Payment Processing

```javascript
// Initialize PaymentViewModel
const paymentVM = new PaymentViewModel();
const paymentView = new PaymentManagementView(
  paymentVM,
  document.getElementById('paymentApp')
);

// Load payments
await paymentVM.loadPayments();

// Create payment
const paymentData = {
  schoolId: 'school-001',
  amount: 5000,
  purpose: 'Annual Fee'
};
await paymentVM.executeCommand('createPayment', paymentData);

// Load statistics
await paymentVM.loadStats();

// Verify payment
await paymentVM.executeCommand('verifyPayment', paymentId, verificationCode);
```

### Example 3: Fee Management

```javascript
const feeVM = new FeeManagementViewModel();
const feeView = new FeeManagementView(feeVM, document.getElementById('feeApp'));

// Load fee guidelines
await feeVM.loadFees();

// Create new fee structure
const feeData = {
  schoolLevel: 'primary',
  schoolType: 'private',
  tuitionFee: 80000,
  enrollmentFee: 5000,
  developmentFee: 10000,
  activityFee: 5000
};
await feeVM.executeCommand('createFeeStructure', feeData);

// Load affordability report
await feeVM.loadAffordabilityReport();
```

---

## 🔄 Two-Way Binding

### Automatic Synchronization

```javascript
// HTML
<input type="text" id="schoolName" />

// JavaScript
class SchoolVM extends ViewModel {
  initializeViewModel() {
    this.defineProperty('schoolName', '');
  }
}

const vm = new SchoolVM();

// Setup binding (one way)
new Binding(
  document.getElementById('schoolName'),
  vm,
  'schoolName',
  'two-way'
);

// User types in input → ViewModel updates
// ViewModel changes → Input updates
vm.schoolName = 'New Name'; // Input shows "New Name"
```

### Binding Modes

```javascript
// Two-way (default)
new Binding(element, vm, 'property', 'two-way');
// Changes flow: View ↔ ViewModel

// One-way (ViewModel → View)
new Binding(element, vm, 'property', 'one-way');
// Changes flow: ViewModel → View

// One-way to Source (View → ViewModel)
new Binding(element, vm, 'property', 'one-way-to-source');
// Changes flow: View → ViewModel
```

---

## 📝 Command Pattern

### Defining Commands

```javascript
class MyViewModel extends ViewModel {
  initializeViewModel() {
    // Define command without parameters
    this.defineCommand('loadData', this.loadData);
    
    // Define command with execution guard
    this.defineCommand('saveData', this.saveData, () => {
      return this.hasChanges;
    });
  }

  async loadData() {
    this.setLoading(true);
    try {
      // Load data...
    } finally {
      this.setLoading(false);
    }
  }

  async saveData(data) {
    if (!data.isValid()) {
      this.setError('Invalid data');
      return;
    }
    // Save data...
  }
}
```

### Executing Commands

```javascript
const vm = new MyViewModel();

// Execute command
await vm.executeCommand('loadData');

// Execute with parameters
await vm.executeCommand('saveData', { name: 'Test' });

// Command guard prevents execution if canExecute returns false
vm.hasChanges = false;
vm.executeCommand('saveData'); // Won't execute

vm.hasChanges = true;
vm.executeCommand('saveData'); // Executes
```

---

## 🧪 Testing MVVM Components

### Testing Models

```javascript
describe('SchoolModel', () => {
  test('should validate annual fee', () => {
    const school = new SchoolModel({ annualFee: -100 });
    expect(() => school.validate()).toThrow();
  });

  test('should calculate affordability category', () => {
    const school = new SchoolModel({ annualFee: 100000 });
    expect(school.getAffordabilityCategory()).toBe('MODERATE');
  });
});
```

### Testing ViewModels

```javascript
describe('SchoolViewModel', () => {
  let vm;

  beforeEach(() => {
    vm = new SchoolViewModel();
    // Mock DataService
    vm.dataService.getSchools = jest.fn().mockResolvedValue({
      data: [{ id: 1, name: 'Test School', annualFee: 100000 }]
    });
  });

  test('should load schools', async () => {
    await vm.loadSchools();
    expect(vm.schools.length).toBe(1);
    expect(vm.schools[0].name).toBe('Test School');
  });

  test('should set loading state', async () => {
    const loadingStates = [];
    vm.isLoading.subscribe(s => loadingStates.push(s));
    
    await vm.loadSchools();
    
    expect(loadingStates).toEqual([true, false]);
  });
});
```

---

## 🚀 Best Practices

### 1. Property Validation

```javascript
// Always define validators
this.defineProperty('email', '', (v) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
});

this.defineProperty('age', 0, (v) => v >= 0 && v <= 150);
```

### 2. Error Handling

```javascript
async loadData() {
  this.setLoading(true);
  this.clearError();
  try {
    const data = await this.dataService.fetchData();
    this.defineProperty('data', data);
  } catch (error) {
    this.setError(`Failed to load data: ${error.message}`);
  } finally {
    this.setLoading(false);
  }
}
```

### 3. Resource Cleanup

```javascript
// Dispose view when done
const view = new MyView(viewModel, element);

// Later...
view.dispose(); // Removes event listeners, cleans up bindings
```

### 4. Authentication

```javascript
const service = new DataService();
service.setAuthToken(token);

// Token automatically included in all requests
const response = await service.get('/protected-endpoint');
```

### 5. Observable Subscriptions

```javascript
// Always save unsubscribe function for cleanup
const unsubscribe = viewModel.subscribe('propertyName', (newValue) => {
  console.log('Property changed:', newValue);
});

// Unsubscribe when done
unsubscribe();
```

---

## 📂 File Structure

```
js/mvvm/
├── core.js              # MVVM core framework (700+ lines)
├── models.js            # Domain models (300+ lines)
├── viewModels.js        # Business logic ViewModels (600+ lines)
├── views.js             # UI Views (700+ lines)
└── README.md            # This documentation
```

---

## 🔗 Integration with Existing Code

### Using with existing admin.js

```javascript
// Keep existing initialization code
const adminApp = document.getElementById('adminApp');

// Create ViewModels
const schoolVM = new SchoolViewModel();
const paymentVM = new PaymentViewModel();
const feeVM = new FeeManagementViewModel();
const complianceVM = new ComplianceViewModel();

// Create Views
const schoolView = new SchoolManagementView(schoolVM, adminApp.querySelector('#schoolSection'));
const paymentView = new PaymentManagementView(paymentVM, adminApp.querySelector('#paymentSection'));
const feeView = new FeeManagementView(feeVM, adminApp.querySelector('#feeSection'));
const complianceView = new ComplianceManagementView(complianceVM, adminApp.querySelector('#complianceSection'));

// Load initial data
schoolVM.loadSchools();
paymentVM.loadPayments();
feeVM.loadFees();
complianceVM.loadComplianceStatus();
```

---

## 📈 Performance Considerations

### Observable Updates

Observable changes are synchronous. For large collections:

```javascript
// Batch updates to reduce notifications
const schools = new ObservableCollection();

// Instead of adding one by one (triggers multiple notifications)
// Add in batch
schools.items = newSchools;
schools.notify('batch-update', newSchools);
```

### Binding Performance

For large lists, consider virtual scrolling:

```javascript
// Render only visible items
renderVisibleSchools(schools) {
  const visibleSchools = schools.slice(startIndex, endIndex);
  // Render only visible items
}
```

---

## 🐛 Debugging

### Enable Logging

```javascript
// Monitor ViewModel changes
const vm = new SchoolViewModel();
vm.properties.forEach((observable, name) => {
  observable.subscribe((newValue) => {
    console.log(`${name}: ${oldValue} → ${newValue}`);
  });
});
```

### View Browser DevTools

```javascript
// Attach to window for debugging
window.schoolVM = new SchoolViewModel();
window.paymentVM = new PaymentViewModel();

// In console:
// > schoolVM.schools
// > paymentVM.stats
```

---

## 📚 Further Reading

- [MVVM Pattern Documentation](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)
- [Reactive Programming](https://reactivex.io/)
- [Design Patterns in JavaScript](https://www.patterns.dev/)

---

## 📞 Support

For questions or issues with MVVM implementation:

- Review examples in [views.js](./views.js)
- Check test files for usage patterns
- Refer to API documentation in comments

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Developer**: Wanoto Raphael - Meru University IT  
**Copyright**: © 2026 All Rights Reserved
