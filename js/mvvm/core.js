/**
 * MVVM Core Framework
 * Provides base classes and utilities for Model-View-ViewModel pattern
 * 
 * Version: 1.0.0
 * Developer: Wanoto Raphael - Meru University IT
 */

/**
 * Observable - Implements property observation pattern
 */
class Observable {
  constructor(initialValue = null) {
    this.value = initialValue;
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => this.subscribers = this.subscribers.filter(cb => cb !== callback);
  }

  notify(newValue, oldValue) {
    this.subscribers.forEach(callback => callback(newValue, oldValue));
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    const oldValue = this.value;
    if (oldValue !== newValue) {
      this.value = newValue;
      this.notify(newValue, oldValue);
    }
  }
}

/**
 * ObservableCollection - Array with observation capability
 */
class ObservableCollection {
  constructor(initialArray = []) {
    this.items = [...initialArray];
    this.subscribers = [];
    this.itemSubscribers = new Map();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => this.subscribers = this.subscribers.filter(cb => cb !== callback);
  }

  notify(action, items, index = -1) {
    this.subscribers.forEach(callback => callback({ action, items, index }));
  }

  add(item) {
    this.items.push(item);
    this.notify('add', [item], this.items.length - 1);
  }

  remove(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      this.notify('remove', [item], index);
    }
  }

  clear() {
    const removed = [...this.items];
    this.items = [];
    this.notify('clear', removed);
  }

  update(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.notify('update', [item], index);
    }
  }

  getItems() {
    return [...this.items];
  }

  filter(predicate) {
    return this.items.filter(predicate);
  }

  map(transformer) {
    return this.items.map(transformer);
  }

  get length() {
    return this.items.length;
  }

  at(index) {
    return this.items[index];
  }
}

/**
 * Model - Base class for data models
 */
class Model {
  constructor(data = {}) {
    this.data = data;
    this.properties = new Map();
    this.initializeProperties();
  }

  initializeProperties() {
    // Override in subclasses
  }

  defineProperty(name, initialValue = null, validator = null) {
    const observable = new Observable(initialValue);
    observable.validator = validator;
    this.properties.set(name, observable);
    
    Object.defineProperty(this, name, {
      get: () => observable.getValue(),
      set: (value) => {
        if (validator && !validator(value)) {
          throw new Error(`Validation failed for property: ${name}`);
        }
        observable.setValue(value);
      },
      enumerable: true,
      configurable: true
    });
  }

  subscribe(propertyName, callback) {
    const observable = this.properties.get(propertyName);
    if (observable) {
      return observable.subscribe(callback);
    }
    throw new Error(`Property not found: ${propertyName}`);
  }

  toJSON() {
    const obj = {};
    this.properties.forEach((observable, name) => {
      obj[name] = observable.getValue();
    });
    return obj;
  }

  static fromJSON(json) {
    return new this(json);
  }
}

/**
 * ViewModel - Base class for view models
 */
class ViewModel {
  constructor() {
    this.commands = new Map();
    this.properties = new Map();
    this.isLoading = new Observable(false);
    this.error = new Observable(null);
    this.initializeViewModel();
  }

  initializeViewModel() {
    // Override in subclasses
  }

  defineProperty(name, initialValue = null, validator = null) {
    const observable = new Observable(initialValue);
    observable.validator = validator;
    this.properties.set(name, observable);
    
    Object.defineProperty(this, name, {
      get: () => observable.getValue(),
      set: (value) => {
        if (validator && !validator(value)) {
          console.warn(`Validation failed for property: ${name}`);
          return;
        }
        observable.setValue(value);
      },
      enumerable: true,
      configurable: true
    });
  }

  defineCommand(name, execute, canExecute = null) {
    const command = {
      execute: execute.bind(this),
      canExecute: canExecute ? canExecute.bind(this) : () => true,
      subscribers: []
    };
    this.commands.set(name, command);
  }

  executeCommand(name, ...args) {
    const command = this.commands.get(name);
    if (command && command.canExecute()) {
      return command.execute(...args);
    }
    throw new Error(`Command not found or cannot execute: ${name}`);
  }

  subscribe(propertyName, callback) {
    const observable = this.properties.get(propertyName);
    if (observable) {
      return observable.subscribe(callback);
    }
    throw new Error(`Property not found: ${propertyName}`);
  }

  subscribeToCommand(commandName, callback) {
    const command = this.commands.get(commandName);
    if (command) {
      command.subscribers.push(callback);
      return () => {
        command.subscribers = command.subscribers.filter(cb => cb !== callback);
      };
    }
    throw new Error(`Command not found: ${commandName}`);
  }

  async loadData() {
    this.isLoading.setValue(true);
    this.error.setValue(null);
    try {
      // Override in subclasses
    } catch (err) {
      this.error.setValue(err.message);
      console.error('ViewModel loadData error:', err);
    } finally {
      this.isLoading.setValue(false);
    }
  }

  setLoading(isLoading) {
    this.isLoading.setValue(isLoading);
  }

  setError(error) {
    this.error.setValue(error);
  }

  clearError() {
    this.error.setValue(null);
  }
}

/**
 * DataService - Base class for API communication
 */
class DataService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.authToken = localStorage.getItem('authToken');
  }

  setAuthToken(token) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Fetch error: ${endpoint}`, error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.fetch(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.fetch(endpoint, { method: 'DELETE' });
  }
}

/**
 * Binding - Two-way data binding between ViewModel and View
 */
class Binding {
  constructor(element, viewModel, propertyName, mode = 'two-way') {
    this.element = element;
    this.viewModel = viewModel;
    this.propertyName = propertyName;
    this.mode = mode;
    this.init();
  }

  init() {
    // View to ViewModel binding
    if (this.mode === 'two-way' || this.mode === 'one-way-to-source') {
      this.element.addEventListener('change', (e) => {
        this.viewModel[this.propertyName] = this.getElementValue();
      });

      this.element.addEventListener('input', (e) => {
        this.viewModel[this.propertyName] = this.getElementValue();
      });
    }

    // ViewModel to View binding
    if (this.mode === 'two-way' || this.mode === 'one-way') {
      this.viewModel.subscribe(this.propertyName, (newValue) => {
        this.setElementValue(newValue);
      });

      // Set initial value
      this.setElementValue(this.viewModel[this.propertyName]);
    }
  }

  getElementValue() {
    if (this.element.type === 'checkbox') {
      return this.element.checked;
    } else if (this.element.tagName === 'SELECT') {
      return this.element.value;
    }
    return this.element.value;
  }

  setElementValue(value) {
    if (this.element.type === 'checkbox') {
      this.element.checked = Boolean(value);
    } else if (this.element.tagName === 'SELECT') {
      this.element.value = value || '';
    } else {
      this.element.textContent = value || '';
      this.element.value = value || '';
    }
  }
}

/**
 * View - Base class for views
 */
class View {
  constructor(viewModel, rootElement) {
    this.viewModel = viewModel;
    this.rootElement = rootElement;
    this.bindings = [];
    this.eventListeners = [];
    this.init();
  }

  init() {
    this.setupBindings();
    this.setupEventListeners();
    this.attachViewModelSubscriptions();
  }

  setupBindings() {
    // Override in subclasses
  }

  setupEventListeners() {
    // Override in subclasses
  }

  attachViewModelSubscriptions() {
    // Subscribe to ViewModel changes
    this.viewModel.properties.forEach((observable, propertyName) => {
      observable.subscribe(() => this.onPropertyChanged(propertyName));
    });

    // Subscribe to loading state
    this.viewModel.isLoading.subscribe((isLoading) => {
      this.setLoadingState(isLoading);
    });

    // Subscribe to errors
    this.viewModel.error.subscribe((error) => {
      if (error) {
        this.showError(error);
      } else {
        this.clearError();
      }
    });
  }

  bindProperty(selector, propertyName, mode = 'two-way') {
    const element = this.rootElement.querySelector(selector);
    if (element) {
      const binding = new Binding(element, this.viewModel, propertyName, mode);
      this.bindings.push(binding);
    }
  }

  addEventListener(selector, eventType, handler) {
    const element = this.rootElement.querySelector(selector);
    if (element) {
      element.addEventListener(eventType, handler.bind(this));
      this.eventListeners.push({ element, eventType, handler });
    }
  }

  onPropertyChanged(propertyName) {
    // Override in subclasses for custom handling
  }

  setLoadingState(isLoading) {
    if (isLoading) {
      this.rootElement.classList.add('is-loading');
    } else {
      this.rootElement.classList.remove('is-loading');
    }
  }

  showError(message) {
    const errorElement = this.rootElement.querySelector('.error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearError() {
    const errorElement = this.rootElement.querySelector('.error-message');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  dispose() {
    this.bindings.forEach(binding => {
      // Clean up bindings if needed
    });
    this.eventListeners.forEach(({ element, eventType, handler }) => {
      element.removeEventListener(eventType, handler);
    });
  }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Observable,
    ObservableCollection,
    Model,
    ViewModel,
    DataService,
    Binding,
    View
  };
}
