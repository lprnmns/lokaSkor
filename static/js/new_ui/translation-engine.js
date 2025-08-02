/**
 * LocationIQ Modern UI - Translation Engine
 * Main translation engine that coordinates all translation functionality
 */

class TranslationEngine {
    constructor() {
        this.utils = null;
        this.selector = null;
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';
        this.fallbackLanguage = 'tr';
        this.isInitialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.setLanguage = this.setLanguage.bind(this);
        this.getCurrentLanguage = this.getCurrentLanguage.bind(this);
        this.translate = this.translate.bind(this);
        this.translatePage = this.translatePage.bind(this);
        this.getAvailableLanguages = this.getAvailableLanguages.bind(this);
        this.isLanguageAvailable = this.isLanguageAvailable.bind(this);
        this.getLanguageInfo = this.getLanguageInfo.bind(this);
        this.cleanup = this.cleanup.bind(this);
    }
    
    /**
     * Initialize the translation engine
     */
    async init() {
        if (this.isInitialized) {
            console.warn('Translation engine already initialized');
            return;
        }
        
        try {
            console.log('Initializing translation engine...');
            
            // Load translation utilities
            if (window.translationUtils) {
                this.utils = window.translationUtils;
            } else {
                // Fallback: create basic translation utils
                this.utils = this.createBasicUtils();
            }
            
            // Load language selector
            if (window.languageSelector) {
                this.selector = window.languageSelector;
            }
            
            // Initialize translation utilities
            if (this.utils && typeof this.utils.init === 'function') {
                await this.utils.init();
            }
            
            // Set up global translator reference
            window.translator = this;
            
            this.isInitialized = true;
            console.log('Translation engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize translation engine:', error);
            // Fallback to basic functionality
            this.utils = this.createBasicUtils();
            this.isInitialized = true;
        }
    }
    
    /**
     * Create basic translation utilities as fallback
     */
    createBasicUtils() {
        return {
            currentLanguage: this.currentLanguage,
            translations: {},
            
            init: async function() {
                // Load basic translations
                try {
                    const response = await fetch('/locales/' + this.currentLanguage + '.json');
                    if (response.ok) {
                        this.translations[this.currentLanguage] = await response.json();
                    }
                } catch (error) {
                    console.error('Failed to load translations:', error);
                }
            },
            
            setLanguage: async function(language) {
                this.currentLanguage = language;
                localStorage.setItem('preferredLanguage', language);
                
                // Reload translations
                await this.init();
                
                // Dispatch event
                const event = new CustomEvent('languageChanged', { detail: { language } });
                window.dispatchEvent(event);
            },
            
            getCurrentLanguage: function() {
                return this.currentLanguage;
            },
            
            t: function(key, params = {}) {
                const translation = this.getNestedTranslation(this.translations[this.currentLanguage], key);
                
                // Fallback to Turkish if translation not found
                if (!translation && this.currentLanguage !== 'tr') {
                    const fallbackTranslation = this.getNestedTranslation(this.translations['tr'], key);
                    if (fallbackTranslation) {
                        return this.interpolate(fallbackTranslation, params);
                    }
                }
                
                return translation || key;
            },
            
            getNestedTranslation: function(obj, key) {
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
            },
            
            interpolate: function(str, params) {
                if (typeof str !== 'string') {
                    return str;
                }
                
                return str.replace(/\{(\w+)\}/g, (match, key) => {
                    return params[key] !== undefined ? params[key] : match;
                });
            },
            
            translatePage: function() {
                const elements = document.querySelectorAll('[data-i18n]');
                elements.forEach(element => {
                    const key = element.getAttribute('data-i18n');
                    const params = {};
                    
                    const paramAttrs = element.getAttribute('data-i18n-params');
                    if (paramAttrs) {
                        try {
                            Object.assign(params, JSON.parse(paramAttrs));
                        } catch (e) {
                            console.error('Error parsing translation parameters:', e);
                        }
                    }
                    
                    const translation = this.t(key, params);
                    
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.placeholder = translation;
                    } else {
                        element.textContent = translation;
                    }
                });
            }
        };
    }
    
    /**
     * Set current language
     */
    async setLanguage(language) {
        if (!this.isInitialized) {
            console.warn('Translation engine not initialized');
            return;
        }
        
        try {
            if (this.utils && typeof this.utils.setLanguage === 'function') {
                await this.utils.setLanguage(language);
            }
            
            this.currentLanguage = language;
            
            // Update language selector if available
            if (this.selector && typeof this.selector.selectLanguage === 'function') {
                this.selector.selectLanguage(language);
            }
            
            // Translate page
            this.translatePage();
            
        } catch (error) {
            console.error('Error setting language:', error);
        }
    }
    
    /**
     * Get current language
     */
    getCurrentLanguage() {
        if (this.utils && typeof this.utils.getCurrentLanguage === 'function') {
            return this.utils.getCurrentLanguage();
        }
        return this.currentLanguage;
    }
    
    /**
     * Translate a key with optional parameters
     */
    translate(key, params = {}) {
        if (!this.isInitialized) {
            console.warn('Translation engine not initialized');
            return key;
        }
        
        if (this.utils && typeof this.utils.t === 'function') {
            return this.utils.t(key, params);
        }
        
        return key;
    }
    
    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
        if (!this.isInitialized) {
            console.warn('Translation engine not initialized');
            return;
        }
        
        if (this.utils && typeof this.utils.translatePage === 'function') {
            this.utils.translatePage();
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
     * Cleanup translation engine
     */
    cleanup() {
        this.isInitialized = false;
        this.utils = null;
        this.selector = null;
        
        // Remove global references
        if (window.translator === this) {
            window.translator = null;
        }
    }
}

// Create global instance
const translationEngine = new TranslationEngine();

// Make globally available
window.translationEngine = translationEngine;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationEngine;
}