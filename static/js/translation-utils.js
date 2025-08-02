/**
 * LocationIQ - Translation Utilities
 * Shared translation utilities for JavaScript modules
 */

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
      const response = await fetch(`/static/locales/${lang}.json`);
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