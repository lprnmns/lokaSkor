/**
 * LocationIQ - Language Events
 * Event system for language changes in JavaScript modules
 */

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