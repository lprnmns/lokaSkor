/**
 * LocationIQ Modern UI - Language Selector
 * Handles language selection functionality for HTML templates
 */

class LanguageSelector {
    constructor() {
        this.selector = document.getElementById('languageSelector');
        this.button = document.getElementById('languageButton');
        this.dropdown = document.getElementById('languageDropdown');
        this.currentFlag = document.getElementById('currentFlag');
        this.currentCode = document.getElementById('currentCode');
        this.arrow = document.getElementById('arrow');
        
        this.isOpen = false;
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'tr';
        
        // Bind methods
        this.init = this.init.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.selectLanguage = this.selectLanguage.bind(this);
        this.closeDropdown = this.closeDropdown.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleEscapeKey = this.handleEscapeKey.bind(this);
        
        // Initialize if elements exist
        if (this.selector && this.button && this.dropdown) {
            this.init();
        }
    }
    
    /**
     * Initialize language selector
     */
    init() {
        console.log('Initializing language selector...');
        
        // Set up event listeners
        this.button.addEventListener('click', this.toggleDropdown);
        this.arrow.addEventListener('click', this.toggleDropdown);
        
        // Set up language option listeners
        const languageOptions = this.dropdown.querySelectorAll('.language-selector__option');
        languageOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const language = e.currentTarget.getAttribute('data-lang');
                this.selectLanguage(language);
            });
        });
        
        // Set up outside click handler
        document.addEventListener('click', this.handleOutsideClick);
        
        // Set up escape key handler
        document.addEventListener('keydown', this.handleEscapeKey);
        
        // Set up language change listener
        window.addEventListener('languageChanged', (event) => {
            this.currentLanguage = event.detail.language;
            this.updateUI();
        });
        
        // Initialize UI
        this.updateUI();
        
        console.log('Language selector initialized successfully');
    }
    
    /**
     * Toggle dropdown visibility
     */
    toggleDropdown(event) {
        event.stopPropagation();
        
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    /**
     * Open dropdown
     */
    openDropdown() {
        this.isOpen = true;
        this.dropdown.style.display = 'block';
        this.arrow.textContent = '▲';
        
        // Add animation class
        requestAnimationFrame(() => {
            this.dropdown.classList.add('show');
        });
        
        // Focus on first option
        const firstOption = this.dropdown.querySelector('.language-selector__option');
        if (firstOption) {
            firstOption.focus();
        }
    }
    
    /**
     * Close dropdown
     */
    closeDropdown() {
        this.isOpen = false;
        this.dropdown.classList.remove('show');
        this.arrow.textContent = '▼';
        
        // Hide dropdown after animation
        setTimeout(() => {
            this.dropdown.style.display = 'none';
        }, 200);
    }
    
    /**
     * Select a language
     */
    async selectLanguage(language) {
        if (language === this.currentLanguage) {
            this.closeDropdown();
            return;
        }
        
        try {
            // Dispatch language change event
            const event = new CustomEvent('languageChange', {
                detail: { language }
            });
            window.dispatchEvent(event);
            
            // Update UI
            this.currentLanguage = language;
            this.updateUI();
            this.closeDropdown();
            
            console.log(`Language selected: ${language}`);
            
        } catch (error) {
            console.error('Error selecting language:', error);
        }
    }
    
    /**
     * Update UI to reflect current language
     */
    updateUI() {
        if (!this.currentFlag || !this.currentCode) {
            return;
        }
        
        // Get language info
        const languageInfo = this.getLanguageInfo(this.currentLanguage);
        
        if (languageInfo) {
            this.currentFlag.textContent = languageInfo.flag;
            this.currentCode.textContent = languageInfo.code.toUpperCase();
        }
        
        // Update active state in dropdown
        const languageOptions = this.dropdown.querySelectorAll('.language-selector__option');
        languageOptions.forEach(option => {
            const optionLang = option.getAttribute('data-lang');
            if (optionLang === this.currentLanguage) {
                option.classList.add('language-selector__option--active');
            } else {
                option.classList.remove('language-selector__option--active');
            }
        });
    }
    
    /**
     * Handle outside clicks
     */
    handleOutsideClick(event) {
        if (this.isOpen && !this.selector.contains(event.target)) {
            this.closeDropdown();
        }
    }
    
    /**
     * Handle escape key
     */
    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.isOpen) {
            this.closeDropdown();
        }
    }
    
    /**
     * Get language information
     */
    getLanguageInfo(language) {
        const languages = [
            { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
            { code: 'en', name: 'English', flag: '🇬🇧' }
        ];
        
        return languages.find(lang => lang.code === language);
    }
    
    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Cleanup language selector
     */
    cleanup() {
        // Remove event listeners
        if (this.button) {
            this.button.removeEventListener('click', this.toggleDropdown);
        }
        if (this.arrow) {
            this.arrow.removeEventListener('click', this.toggleDropdown);
        }
        
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('keydown', this.handleEscapeKey);
        
        // Close dropdown if open
        if (this.isOpen) {
            this.closeDropdown();
        }
    }
}

// Create global instance
const languageSelector = new LanguageSelector();

// Make globally available
window.languageSelector = languageSelector;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageSelector;
}