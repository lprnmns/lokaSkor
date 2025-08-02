# JavaScript Files Translation Strategy

## Overview
This strategy defines how to implement translation functionality in standalone JavaScript files within the project.

## Core Implementation

### 1. Shared Translation Utility
Create a shared translation utility that can be imported by all JavaScript files:

```javascript
// static/js/translation-utils.js
class TranslationUtils {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'tr';
    this.translations = {};
    this.init();
  }

  async init() {
    await this.loadTranslations(this.currentLanguage);
  }

  async loadTranslations(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      this.translations[lang] = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];
    
    // Navigate through nested keys
    for (const k of keys) {
      if (!translation || !translation[k]) return key; // Return key if translation not found
      translation = translation[k];
    }
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });
    
    return translation;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  async changeLanguage(lang) {
    await this.loadTranslations(lang);
  }
}

// Create a singleton instance
const translationUtils = new TranslationUtils();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = translationUtils;
} else {
  window.translationUtils = translationUtils;
}
```

### 2. Language Change Event System
Implement an event system to notify JavaScript components of language changes:

```javascript
// static/js/language-events.js
class LanguageEvents {
  constructor() {
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  unsubscribe(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notify(language) {
    this.listeners.forEach(callback => callback(language));
  }
}

// Create a global instance
const languageEvents = new LanguageEvents();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = languageEvents;
} else {
  window.languageEvents = languageEvents;
}
```

## Integration Steps for JavaScript Files

### 1. Import Translation Utilities
Each JavaScript file that needs translation should import the utilities:

```javascript
// In each JS file that requires translation
// For Node.js style modules
const { t, getCurrentLanguage } = require('./translation-utils');

// For browser style globals
// const { t, getCurrentLanguage } = window.translationUtils;
```

### 2. Update UI Text Dynamically
Replace hardcoded strings with translation function calls:

```javascript
// Before translation
function updateUI() {
  document.getElementById('status').textContent = 'Loading...';
  document.getElementById('button').textContent = 'Submit';
}

// After translation
function updateUI() {
  document.getElementById('status').textContent = t('status.loading');
  document.getElementById('button').textContent = t('buttons.submit');
}
```

### 3. Listen for Language Changes
Subscribe to language change events to update UI when language changes:

```javascript
// Subscribe to language changes
languageEvents.subscribe((newLanguage) => {
  // Update all translated text in the UI
  updateUIText();
});

function updateUIText() {
  // Update all UI elements with translated text
  const elements = document.querySelectorAll('[data-js-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-js-i18n');
    element.textContent = t(key);
  });
}
```

## Specific Implementation for Each JavaScript File

### 1. Advanced Animation Manager (`advanced_animation_manager.js`)
- Import translation utilities
- Translate animation status messages
- Update UI elements with translated text

### 2. Animation Manager (`animation_manager.js`)
- Import translation utilities
- Translate animation control labels
- Handle language change events

### 3. Animation Performance (`animation_performance.js`)
- Import translation utilities
- Translate performance metrics labels
- Update displayed text when language changes

### 4. API Client (`api_client.js`)
- Import translation utilities
- Translate error messages
- Translate status messages

### 5. Enhanced Scroll Animations (`enhanced_scroll_animations.js`)
- Import translation utilities
- Translate animation descriptions
- Update UI text dynamically

### 6. Error Handler (`error_handler.js`)
- Import translation utilities
- Translate error messages
- Display translated error messages to user

### 7. Heatmap Manager (`heatmap_manager.js`)
- Import translation utilities
- Translate heatmap labels and tooltips
- Update legend text when language changes

### 8. Loading Manager (`loading_manager.js`)
- Import translation utilities
- Translate loading messages
- Update loading status text dynamically

### 9. Main Application (`main.js`)
- Import translation utilities and language events
- Initialize translation system
- Set up language change handlers
- Coordinate translation updates across modules

### 10. Map Manager (`map_manager.js`)
- Import translation utilities
- Translate map control labels
- Translate location information
- Update map UI text when language changes

### 11. Micro Interactions (`micro_interactions.js`)
- Import translation utilities
- Translate interaction feedback messages
- Update UI text dynamically

### 12. Mode Controllers (`mode1_controller.js`, `mode2_controller.js`)
- Import translation utilities
- Translate mode-specific labels and instructions
- Update UI text when language changes

### 13. Performance Monitor (`performance_monitor.js`)
- Import translation utilities
- Translate performance metrics labels
- Update displayed text dynamically

### 14. Results Visualizer (`results_visualizer.js`)
- Import translation utilities
- Translate result labels and descriptions
- Update visualization text when language changes

### 15. Sidebar Components (`sidebar_component.js`, `sidebar_manager.js`, `sidebar.js`)
- Import translation utilities
- Translate sidebar labels and controls
- Update sidebar text when language changes

### 16. Sticky Navigation (`sticky_navigation.js`)
- Import translation utilities
- Translate navigation labels
- Update navigation text when language changes

### 17. UI Integration Manager (`ui_integration_manager.js`)
- Import translation utilities
- Coordinate translation across UI components
- Handle language change events for integrated components

### 18. UI Test Suite (`ui_test_suite.js`)
- Import translation utilities
- Translate test descriptions and results
- Update test UI text when language changes

## Implementation Example

```javascript
// example_module.js
// Import translation utilities
const { t, getCurrentLanguage } = require('./translation-utils');
const languageEvents = require('./language-events');

class ExampleModule {
  constructor() {
    this.init();
    // Subscribe to language change events
    languageEvents.subscribe(this.handleLanguageChange.bind(this));
  }

  init() {
    // Initialize module with translated text
    this.updateUIText();
  }

  updateUIText() {
    // Update all UI elements with translated text
    document.getElementById('title').textContent = t('module.title');
    document.getElementById('description').textContent = t('module.description');
    document.getElementById('button').textContent = t('buttons.action');
  }

  handleLanguageChange(newLanguage) {
    // Update UI when language changes
    this.updateUIText();
  }

  showMessage(messageKey, params = {}) {
    // Display translated message
    const message = t(messageKey, params);
    document.getElementById('message').textContent = message;
  }
}

// Initialize module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ExampleModule();
});

// Export for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExampleModule;
}
```

## Key Considerations

1. **Module Loading**: Ensure translation utilities are loaded before other modules
2. **Error Handling**: Gracefully handle missing translations
3. **Performance**: Cache translations to avoid repeated lookups
4. **Memory Management**: Unsubscribe from events when modules are destroyed
5. **Consistency**: Use consistent translation keys across modules
6. **Testing**: Create tests for translation functionality in JavaScript modules
7. **Documentation**: Document translation keys used in each module