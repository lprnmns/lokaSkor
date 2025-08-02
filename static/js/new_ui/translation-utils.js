/**
 * LocationIQ Modern UI - Translation Utilities
 * Handles translation functionality for HTML templates
 */

class TranslationUtils {
    constructor() {
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';
        this.translations = {};
        this.fallbackLanguage = 'tr';
        this.initialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.setLanguage = this.setLanguage.bind(this);
        this.getCurrentLanguage = this.getCurrentLanguage.bind(this);
        this.t = this.t.bind(this);
        this.translatePage = this.translatePage.bind(this);
        this.loadTranslations = this.loadTranslations.bind(this);
    }
    
    /**
     * Initialize translation system
     */
    async init() {
        if (this.initialized) {
            return;
        }
        
        try {
            console.log('Initializing translation system...');
            
            // Load translations for current language
            await this.loadTranslations(this.currentLanguage);
            
            // Set up language change event
            this.setupLanguageChangeEvents();
            
            this.initialized = true;
            console.log('Translation system initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize translation system:', error);
            // Fallback to default language
            await this.loadTranslations(this.fallbackLanguage);
        }
    }
    
    /**
     * Load translations for a specific language
     */
    async loadTranslations(language) {
        try {
            const response = await fetch(`/locales/${language}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${language}`);
            }
            const data = await response.json();
            this.translations[language] = data;
            console.log(`Loaded translations for ${language}`);
        } catch (error) {
            console.error(`Error loading translations for ${language}:`, error);
            // Try fallback language
            if (language !== this.fallbackLanguage) {
                await this.loadTranslations(this.fallbackLanguage);
            }
        }
    }
    
    /**
     * Set up language change events
     */
    setupLanguageChangeEvents() {
        // Listen for language change events
        window.addEventListener('languageChange', (event) => {
            this.setLanguage(event.detail.language);
        });
        
        // Listen for storage changes (for cross-tab synchronization)
        window.addEventListener('storage', (event) => {
            if (event.key === 'preferredLanguage') {
                this.setLanguage(event.newValue);
            }
        });
    }
    
    /**
     * Set current language
     */
    async setLanguage(language) {
        if (language === this.currentLanguage) {
            return;
        }
        
        try {
            // Load translations if not already loaded
            if (!this.translations[language]) {
                await this.loadTranslations(language);
            }
            
            this.currentLanguage = language;
            localStorage.setItem('preferredLanguage', language);
            
            // Update HTML lang attribute
            document.documentElement.lang = language;
            
            // Dispatch language change event
            const event = new CustomEvent('languageChanged', {
                detail: { language }
            });
            window.dispatchEvent(event);
            
            // Update all translated elements
            this.translatePage();
            
            console.log(`Language changed to: ${language}`);
            
        } catch (error) {
            console.error('Error setting language:', error);
        }
    }
    
    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Translate a key with optional parameters
     */
    t(key, params = {}) {
        if (!this.initialized) {
            console.warn('Translation system not initialized');
            return key;
        }
        
        // Get translation for current language
        const translation = this.getNestedTranslation(this.translations[this.currentLanguage], key);
        
        // If not found, try fallback language
        if (!translation && this.currentLanguage !== this.fallbackLanguage) {
            const fallbackTranslation = this.getNestedTranslation(this.translations[this.fallbackLanguage], key);
            if (fallbackTranslation) {
                return this.interpolate(fallbackTranslation, params);
            }
        }
        
        // If still not found, return key
        if (!translation) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }
        
        return this.interpolate(translation, params);
    }
    
    /**
     * Get nested translation from object
     */
    getNestedTranslation(obj, key) {
        const keys = key.split('.');
        let current = obj;
        
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return null;
            }
        }
        
        return current;
    }
    
    /**
     * Interpolate parameters into translation string
     */
    interpolate(str, params) {
        if (typeof str !== 'string') {
            return str;
        }
        
        return str.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }
    
    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
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
            
            // Get translation
            const translation = this.t(key, params);
            
            // Update element content
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update title
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.hasAttribute('data-i18n')) {
            const titleKey = titleElement.getAttribute('data-i18n');
            titleElement.textContent = this.t(titleKey);
        }
        
        // Update meta descriptions
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && metaDescription.hasAttribute('data-i18n')) {
            const descKey = metaDescription.getAttribute('data-i18n');
            metaDescription.content = this.t(descKey);
        }
    }
    
    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return [
            { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
            { code: 'en', name: 'English', flag: '🇬🇧' }
        ];
    }
    
    /**
     * Check if a language is available
     */
    isLanguageAvailable(language) {
        return this.getAvailableLanguages().some(lang => lang.code === language);
    }
    
    /**
     * Get language info by code
     */
    getLanguageInfo(language) {
        return this.getAvailableLanguages().find(lang => lang.code === language);
    }
    
    /**
     * Cleanup translation system
     */
    cleanup() {
        this.initialized = false;
        this.translations = {};
    }
}

// Create global instance
const translationUtils = new TranslationUtils();

// Make globally available
window.translationUtils = translationUtils;
window.translationUtilsInstance = translationUtils;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationUtils;
}