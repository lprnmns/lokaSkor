class LanguageSelector {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'tr';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    const button = document.getElementById('languageButton');
    const dropdown = document.getElementById('languageDropdown');
    const options = document.querySelectorAll('.language-selector__option');

    if (!button || !dropdown) return;

    // Toggle dropdown
    button.addEventListener('click', () => {
      const isOpen = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';
      document.getElementById('arrow').textContent = isOpen ? '▼' : '▲';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!document.getElementById('languageSelector') || 
          !document.getElementById('languageSelector').contains(event.target)) {
        dropdown.style.display = 'none';
        if (document.getElementById('arrow')) {
          document.getElementById('arrow').textContent = '▼';
        }
      }
    });

    // Handle language selection
    options.forEach(option => {
      option.addEventListener('click', () => {
        const langCode = option.getAttribute('data-lang');
        this.changeLanguage(langCode);
      });
    });
  }

  async changeLanguage(langCode) {
    this.currentLanguage = langCode;
    localStorage.setItem('language', langCode);
    
    // Update UI
    this.updateUI();
    
    // Hide dropdown
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
    
    if (document.getElementById('arrow')) {
      document.getElementById('arrow').textContent = '▼';
    }
    
    // Notify other components of language change
    window.dispatchEvent(new CustomEvent('languageChange', { detail: langCode }));
    
    // Reload translations
    if (window.translator) {
      await window.translator.changeLanguage(langCode);
      this.translatePage();
    }
  }

  updateUI() {
    const languages = {
      tr: { flag: '🇹🇷', name: 'Türkçe' },
      en: { flag: '🇬🇧', name: 'English' }
    };
    
    const currentLang = languages[this.currentLanguage] || languages.tr;
    
    // Update button text if elements exist
    const currentFlag = document.getElementById('currentFlag');
    const currentCode = document.getElementById('currentCode');
    
    if (currentFlag) {
      currentFlag.textContent = currentLang.flag;
    }
    
    if (currentCode) {
      currentCode.textContent = this.currentLanguage.toUpperCase();
    }
    
    // Update active option
    const options = document.querySelectorAll('.language-selector__option');
    options.forEach(option => {
      option.classList.remove('language-selector__option--active');
      if (option.getAttribute('data-lang') === this.currentLanguage) {
        option.classList.add('language-selector__option--active');
      }
    });
  }

  translatePage() {
    // Find all elements with data-i18n attribute and translate them
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const params = {};
      
      // Check for parameters
      const paramAttrs = element.getAttribute('data-i18n-params');
      if (paramAttrs) {
        try {
          Object.assign(params, JSON.parse(paramAttrs));
        } catch (e) {
          console.error('Error parsing translation parameters:', e);
        }
      }
      
      if (window.translator) {
        element.textContent = window.translator.t(key, params);
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if language selector elements exist
  if (document.getElementById('languageSelector') || document.getElementById('languageButton')) {
    new LanguageSelector();
  }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageSelector;
} else {
  window.LanguageSelector = LanguageSelector;
}