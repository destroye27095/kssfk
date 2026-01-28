# MVVM Quick Reference Card

**Print this card and keep it handy while coding!**

---

## 🎯 MVVM in 30 Seconds

```
MODEL ←→ VIEWMODEL ←→ VIEW
  ↓          ↓         ↓
Data    Business   UI/HTML
 &       Logic  &  Events
Logic  State Mgmt
```

---

## 📦 Four Core Components

### 1. MODEL (Data Layer)
```javascript
class SchoolModel extends Model {
  initializeProperties() {
    this.defineProperty('name', '', (v) => v.length > 0);
    this.defineProperty('annualFee', 0, (v) => v >= 0);
  }
  
  getAffordabilityCategory() {
    // Business logic here
  }
}

const school = new SchoolModel({ name: 'School', annualFee: 100000 });
school.name = 'Updated'; // Triggers notification
```

### 2. VIEWMODEL (Logic Layer)
```javascript
class SchoolViewModel extends ViewModel {
  initializeViewModel() {
    this.defineProperty('schools', []);
    this.defineProperty('selectedSchool', null);
    this.defineCommand('loadSchools', this.loadSchools);
  }
  
  async loadSchools() {
    this.setLoading(true);
    try {
      const data = await this.dataService.getSchools();
      this.defineProperty('schools', data);
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }
}

const vm = new SchoolViewModel();
await vm.loadSchools();
```

### 3. VIEW (UI Layer)
```javascript
class SchoolManagementView extends View {
  setupBindings() {
    this.bindProperty('#schoolName', 'schoolName', 'two-way');
  }
  
  setupEventListeners() {
    this.addEventListener('.btn-save', 'click', () => {
      this.viewModel.executeCommand('saveSchool');
    });
  }
  
  onPropertyChanged(propertyName) {
    if (propertyName === 'schools') {
      this.renderSchools(this.viewModel.schools);
    }
  }
}

const view = new SchoolManagementView(vm, document.getElementById('app'));
```

### 4. SERVICE (API Layer)
```javascript
class SchoolDataService extends DataService {
  async getSchools() {
    return this.get('/schools');
  }
  
  async createSchool(data) {
    return this.post('/schools', data);
  }
}
```

---

## 🔄 Data Flow Cheat Sheet

```
USER INTERACTION
       ↓
View.addEventListener() captures event
       ↓
viewModel.executeCommand() called
       ↓
ViewModel async operation
       ↓
DataService API call
       ↓
Server response
       ↓
Model updated: defineProperty()
       ↓
Observable.notify() triggered
       ↓
View.onPropertyChanged() called
       ↓
UI automatically re-rendered
       ↓
USER SEES RESULT
```

---

## 📋 Common Patterns

### Create & Load Data
```javascript
// 1. Create ViewModel
const vm = new SchoolViewModel();

// 2. Create View
const view = new SchoolManagementView(vm, element);

// 3. Load initial data
vm.loadSchools();
```

### Handle User Input
```javascript
// View automatically captures and syncs:
<input id="schoolName" /> ← → viewModel.schoolName

// Or use commands:
this.viewModel.executeCommand('saveSchool', data);
```

### Display Loading & Errors
```javascript
// Automatic! View subscribes to:
viewModel.isLoading      // Shows spinner
viewModel.error          // Shows error message
```

### Create New Item
```javascript
const newSchool = {
  name: 'New School',
  annualFee: 100000
};

await viewModel.executeCommand('createSchool', newSchool);
// View automatically updates!
```

---

## 🎨 Property Definition Quick Syntax

```javascript
// Simple property
this.defineProperty('name', 'Default Value');

// With validation
this.defineProperty('annualFee', 0, (v) => v >= 0);

// Boolean
this.defineProperty('isActive', false);

// Array/Collection
this.defineProperty('schools', []);
```

---

## 🔗 Binding Modes

```javascript
// Two-way (default) - bidirectional sync
this.bindProperty('#input', 'property', 'two-way');
// User types → ViewModel updates
// ViewModel changes → Input updates

// One-way - ViewModel → View
this.bindProperty('#display', 'property', 'one-way');
// Only ViewModel changes affect View

// One-way to source - View → ViewModel
this.bindProperty('#input', 'property', 'one-way-to-source');
// Only View changes affect ViewModel
```

---

## ⚡ Command Pattern Quick Guide

### Define Command
```javascript
this.defineCommand(
  'commandName',
  this.commandMethod,
  () => canExecuteCondition // Optional guard
);
```

### Execute Command
```javascript
viewModel.executeCommand('commandName');
viewModel.executeCommand('commandName', param1, param2);
```

### Command Example
```javascript
defineCommand('deleteSchool', this.deleteSchool, () => {
  return this.selectedSchool !== null;
});

async deleteSchool(schoolId) {
  if (confirm('Delete?')) {
    await this.dataService.deleteSchool(schoolId);
    await this.loadSchools();
  }
}
```

---

## 🛡️ Validation Quick Reference

```javascript
// String: non-empty
defineProperty('name', '', (v) => v && v.length > 0);

// Number: range
defineProperty('fee', 0, (v) => v >= 0 && v <= 1000000);

// Email
defineProperty('email', '', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));

// Age: adult only
defineProperty('age', 0, (v) => v >= 18);

// Enum/Select
defineProperty('type', 'public', (v) => ['public', 'private'].includes(v));
```

---

## 🔐 Error & Loading Management

```javascript
// In ViewModel async operation:
async loadSchools() {
  this.setLoading(true);      // Show spinner
  this.clearError();          // Clear old errors
  
  try {
    // Do work
    const data = await api.get();
    this.defineProperty('schools', data);
  } catch (error) {
    this.setError(error.message); // Show error
  } finally {
    this.setLoading(false);    // Hide spinner
  }
}

// View automatically handles UI updates!
```

---

## 📡 API Service Template

```javascript
class MyDataService extends DataService {
  async getItems() {
    return this.get('/endpoint');
  }

  async getItemById(id) {
    return this.get(`/endpoint/${id}`);
  }

  async createItem(data) {
    return this.post('/endpoint', data);
  }

  async updateItem(id, data) {
    return this.put(`/endpoint/${id}`, data);
  }

  async deleteItem(id) {
    return this.delete(`/endpoint/${id}`);
  }
}
```

---

## 🧪 Testing Quick Tips

```javascript
// Test Model
const model = new SchoolModel({ annualFee: 100 });
expect(model.getAffordabilityCategory()).toBe('AFFORDABLE');

// Test ViewModel
const vm = new SchoolViewModel();
vm.dataService.getSchools = jest.fn().mockResolvedValue({ data: [...] });
await vm.loadSchools();
expect(vm.schools.length).toBe(1);

// Test View
const view = new SchoolManagementView(vm, element);
expect(element.querySelector('.school-list')).toBeDefined();
```

---

## 🚀 Integration Checklist

- [ ] Include MVVM files: `core.js`, `models.js`, `viewModels.js`, `views.js`
- [ ] Create ViewModel instance
- [ ] Create View instance
- [ ] Call initial load command
- [ ] Test with browser DevTools
- [ ] Check API endpoints work
- [ ] Verify error handling
- [ ] Test loading states
- [ ] Test user interactions

---

## 📚 File Reference Guide

| File | Use For |
|------|---------|
| `core.js` | Framework classes (Observable, ViewModel, etc) |
| `models.js` | School, Payment, Fee, Compliance models |
| `viewModels.js` | SchoolVM, PaymentVM, FeeVM, ComplianceVM |
| `views.js` | School, Payment, Fee, Compliance views |
| `MVVM_GUIDE.md` | Complete documentation |

---

## 🐛 Quick Debugging

```javascript
// Check ViewModel state
window.vm = new SchoolViewModel();
console.log(vm.schools);        // Check data
console.log(vm.isLoading);      // Check loading
console.log(vm.error);          // Check errors

// Check observable properties
vm.subscribe('schools', (newValue) => {
  console.log('Schools updated:', newValue);
});

// Check view bindings
const view = new SchoolManagementView(vm, element);
console.log(view.bindings);     // Check bindings
```

---

## ⚙️ Common Mistakes to Avoid

❌ **Don't**: Manual DOM manipulation  
✅ **Do**: Use View.bindProperty() and renderXxx() methods

❌ **Don't**: Direct property assignment without validation  
✅ **Do**: Define with validators in defineProperty()

❌ **Don't**: Forget to handle errors in async operations  
✅ **Do**: Use try-catch and setError()

❌ **Don't**: Leave subscriptions unmanaged  
✅ **Do**: Store unsubscribe function and call when done

❌ **Don't**: Mix MVVM with imperative DOM code  
✅ **Do**: Keep everything within MVVM pattern

---

## 🎯 Most Used Methods

```javascript
// Model
model.defineProperty(name, initialValue, validator?)

// ViewModel
vm.defineProperty(name, initialValue, validator?)
vm.defineCommand(name, executeFunction, canExecuteFunction?)
vm.executeCommand(name, ...args)
vm.subscribe(propertyName, callback)
vm.setLoading(boolean)
vm.setError(message)
vm.clearError()

// View
view.bindProperty(selector, propertyName, mode?)
view.addEventListener(selector, eventType, handler)
view.onPropertyChanged(propertyName)
view.dispose()

// DataService
service.get(endpoint)
service.post(endpoint, data)
service.put(endpoint, data)
service.delete(endpoint)
service.setAuthToken(token)
```

---

## 💡 Pro Tips

1. **Always validate** in defineProperty validators
2. **Use commands** for all user actions
3. **Bind HTML inputs** with two-way binding
4. **Handle errors** with try-catch
5. **Show loading** state during async operations
6. **Unsubscribe** from observables when done
7. **Test components** independently
8. **Use DataService** for all API calls
9. **Keep Views simple** - rendering only
10. **Keep Models pure** - data and logic only

---

## 🔗 Quick Links

- [Full MVVM Guide](./js/mvvm/MVVM_GUIDE.md)
- [Complete Status](./MVVM_COMPLETE_STATUS.md)
- [Implementation Summary](./MVVM_IMPLEMENTATION_SUMMARY.md)
- [Core Framework](./js/mvvm/core.js)
- [Models](./js/mvvm/models.js)
- [ViewModels](./js/mvvm/viewModels.js)
- [Views](./js/mvvm/views.js)

---

## ✨ Remember

MVVM separates:
- **Model**: What your data is
- **View**: How it looks
- **ViewModel**: What it does

Keep them separate, and your code stays clean, testable, and maintainable!

---

**Date**: January 28, 2026  
**Developer**: Wanoto Raphael - Meru University IT  
**Version**: 1.0.0

---

**Print this card and keep it on your desk!** 📌
