class TranslationEngine {
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
      if (!response.ok) {
        throw new Error(`Translation file not found for language: ${lang}`);
      }
      this.translations[lang] = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to empty translations
      this.translations[lang] = {};
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
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
  }
}

// Create a singleton instance
const translator = new TranslationEngine();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = translator;
} else {
  window.translator = translator;
}