/**
 * LocationIQ Modern UI - Translation Test
 * Test script to verify translation functionality
 */

class TranslationTest {
    constructor() {
        this.testResults = [];
        this.currentLanguage = 'tr';
        this.availableLanguages = ['tr', 'en'];
        
        // Bind methods
        this.runTests = this.runTests.bind(this);
        this.testTranslationEngine = this.testTranslationEngine.bind(this);
        this.testLanguageSelector = this.testLanguageSelector.bind(this);
        this.testTranslationUtils = this.testTranslationUtils.bind(this);
        this.testPageTranslation = this.testPageTranslation.bind(this);
        this.testErrorMessages = this.testErrorMessages.bind(this);
        this.testAPIResponses = this.testAPIResponses.bind(this);
        this.logResult = this.logResult.bind(this);
        this.assert = this.assert.bind(this);
        this.assertEqual = this.assertEqual.bind(this);
        this.assertTrue = this.assertTrue.bind(this);
        this.assertFalse = this.assertFalse.bind(this);
    }
    
    /**
     * Run all translation tests
     */
    async runTests() {
        console.log('🧪 Starting translation tests...');
        console.log('=====================================');
        
        // Test translation engine
        await this.testTranslationEngine();
        
        // Test language selector
        await this.testLanguageSelector();
        
        // Test translation utilities
        await this.testTranslationUtils();
        
        // Test page translation
        await this.testPageTranslation();
        
        // Test error messages
        await this.testErrorMessages();
        
        // Test API responses
        await this.testAPIResponses();
        
        // Print test results
        this.printTestResults();
        
        return this.testResults;
    }
    
    /**
     * Test translation engine functionality
     */
    async testTranslationEngine() {
        console.log('\n🔍 Testing Translation Engine...');
        
        try {
            // Check if translation engine exists
            this.assertTrue(window.translationEngine, 'Translation engine should be available');
            this.logResult('Translation engine loaded', true);
            
            // Check if translator is available
            this.assertTrue(window.translator, 'Translator should be available');
            this.logResult('Translator instance available', true);
            
            // Test basic translation
            const testKey = 'landing.title';
            const translation = window.translator ? window.translator.translate(testKey) : testKey;
            this.assertTrue(translation && translation !== testKey, 'Translation should return translated text');
            this.logResult(`Translation for "${testKey}": ${translation}`, true);
            
            // Test language switching
            if (window.translator) {
                await window.translator.setLanguage('en');
                const englishTranslation = window.translator.translate(testKey);
                this.assertTrue(englishTranslation !== translation, 'English translation should be different from Turkish');
                this.logResult(`English translation for "${testKey}": ${englishTranslation}`, true);
                
                // Switch back to Turkish
                await window.translator.setLanguage('tr');
                const turkishTranslation = window.translator.translate(testKey);
                this.assertTrue(turkishTranslation === translation, 'Should return to original Turkish translation');
                this.logResult('Successfully switched back to Turkish', true);
            }
            
        } catch (error) {
            this.logResult(`Translation engine test failed: ${error.message}`, false);
        }
    }
    
    /**
     * Test language selector functionality
     */
    async testLanguageSelector() {
        console.log('\n🔍 Testing Language Selector...');
        
        try {
            // Check if language selector exists
            this.assertTrue(window.languageSelector, 'Language selector should be available');
            this.logResult('Language selector loaded', true);
            
            // Check if language selector methods exist
            this.assertTrue(typeof window.languageSelector.getCurrentLanguage === 'function', 'Language selector should have getCurrentLanguage method');
            this.logResult('Language selector methods available', true);
            
            // Test current language
            const currentLang = window.languageSelector.getCurrentLanguage();
            this.assertTrue(this.availableLanguages.includes(currentLang), `Current language should be one of: ${this.availableLanguages.join(', ')}`);
            this.logResult(`Current language: ${currentLang}`, true);
            
            // Test language selection
            if (window.languageSelector.selectLanguage) {
                await window.languageSelector.selectLanguage('en');
                const newLang = window.languageSelector.getCurrentLanguage();
                this.assertTrue(newLang === 'en', 'Language should be switched to English');
                this.logResult('Successfully switched to English', true);
                
                await window.languageSelector.selectLanguage('tr');
                const finalLang = window.languageSelector.getCurrentLanguage();
                this.assertTrue(finalLang === 'tr', 'Language should be switched back to Turkish');
                this.logResult('Successfully switched back to Turkish', true);
            }
            
        } catch (error) {
            this.logResult(`Language selector test failed: ${error.message}`, false);
        }
    }
    
    /**
     * Test translation utilities
     */
    async testTranslationUtils() {
        console.log('\n🔍 Testing Translation Utilities...');
        
        try {
            // Check if translation utilities exist
            this.assertTrue(window.translationUtils, 'Translation utilities should be available');
            this.logResult('Translation utilities loaded', true);
            
            // Check if translation utilities methods exist
            this.assertTrue(typeof window.translationUtils.t === 'function', 'Translation utilities should have t method');
            this.assertTrue(typeof window.translationUtils.getCurrentLanguage === 'function', 'Translation utilities should have getCurrentLanguage method');
            this.assertTrue(typeof window.translationUtils.translatePage === 'function', 'Translation utilities should have translatePage method');
            this.logResult('Translation utility methods available', true);
            
            // Test translation with parameters
            const testKeyWithParams = 'api.validation.invalidBusinessType';
            const params = { types: 'eczane, fırın, market' };
            const translation = window.translationUtils.t(testKeyWithParams, params);
            this.assertTrue(translation.includes('eczane, fırın, market'), 'Translation should include parameters');
            this.logResult(`Parameterized translation works: ${translation}`, true);
            
            // Test page translation
            window.translationUtils.translatePage();
            this.logResult('Page translation executed', true);
            
        } catch (error) {
            this.logResult(`Translation utilities test failed: ${error.message}`, false);
        }
    }
    
    /**
     * Test page translation functionality
     */
    async testPageTranslation() {
        console.log('\n🔍 Testing Page Translation...');
        
        try {
            // Check if page has translatable elements
            const translatableElements = document.querySelectorAll('[data-i18n]');
            this.assertTrue(translatableElements.length > 0, 'Page should have translatable elements');
            this.logResult(`Found ${translatableElements.length} translatable elements`, true);
            
            // Test translation of specific elements
            if (translatableElements.length > 0) {
                const firstElement = translatableElements[0];
                const originalKey = firstElement.getAttribute('data-i18n');
                const originalText = firstElement.textContent;
                
                // Switch language
                if (window.translator) {
                    await window.translator.setLanguage('en');
                    
                    // Check if text changed
                    setTimeout(() => {
                        const newText = firstElement.textContent;
                        this.assertTrue(newText !== originalText, 'Element text should change when language changes');
                        this.logResult(`Element text changed from "${originalText}" to "${newText}"`, true);
                        
                        // Switch back
                        window.translator.setLanguage('tr');
                    }, 100);
                }
            }
            
        } catch (error) {
            this.logResult(`Page translation test failed: ${error.message}`, false);
        }
    }
    
    /**
     * Test error message translation
     */
    async testErrorMessages() {
        console.log('\n🔍 Testing Error Message Translation...');
        
        try {
            // Test error message keys
            const errorKeys = [
                'errors.generic.title',
                'errors.generic.message',
                'errors.network.title',
                'errors.network.message',
                'errors.api.title',
                'errors.validation.title',
                'errors.map.title'
            ];
            
            let allTranslated = true;
            errorKeys.forEach(key => {
                const translation = window.translationUtils ? window.translationUtils.t(key) : key;
                if (translation === key) {
                    allTranslated = false;
                    console.warn(`❌ Error message not translated: ${key}`);
                }
            });
            
            this.assertTrue(allTranslated, 'All error messages should be translated');
            this.logResult('Error messages translation working', true);
            
        } catch (error) {
            this.logResult(`Error message test failed: ${error.message}`, false);
        }
    }
    
    /**
     * Test API response translation
     */
    async testAPIResponses() {
        console.log('\n🔍 Testing API Response Translation...');
        
        try {
            // Test API error translation
            const apiErrorKeys = [
                'api.errors.timeout',
                'api.errors.network',
                'api.errors.unknown',
                'api.validation.missingParams',
                'api.validation.missingLocations',
                'api.validation.invalidBusinessType'
            ];
            
            let allTranslated = true;
            apiErrorKeys.forEach(key => {
                const translation = window.translationUtils ? window.translationUtils.t(key) : key;
                if (translation === key) {
                    allTranslated = false;
                    console.warn(`❌ API error not translated: ${key}`);
                }
            });
            
            this.assertTrue(allTranslated, 'All API error messages should be translated');
            this.logResult('API response translation working', true);
            
        } catch (error) {
            this.logResult(`API response test failed: ${error.message}`, false);
        }
    }
    
    /**
     * Log test result
     */
    logResult(message, passed) {
        const result = {
            test: message,
            passed: passed,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (passed) {
            console.log(`✅ ${message}`);
        } else {
            console.error(`❌ ${message}`);
        }
    }
    
    /**
     * Print test results summary
     */
    printTestResults() {
        console.log('\n📊 Test Results Summary');
        console.log('=======================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const failed = total - passed;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${total}`);
        console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.test}`);
            });
        }
        
        console.log('\n🎯 Test completed!');
    }
    
    // Assertion helpers
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: Expected "${expected}", got "${actual}"`);
        }
    }
    
    assertTrue(condition, message) {
        this.assert(condition, message || 'Expected true, got false');
    }
    
    assertFalse(condition, message) {
        this.assert(!condition, message || 'Expected false, got true');
    }
}

// Create test instance and run tests when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const test = new TranslationTest();
    
    // Add test button to page for manual testing
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Run Translation Tests';
    testButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    
    testButton.addEventListener('click', async () => {
        const results = await test.runTests();
        console.log('Test results:', results);
    });
    
    document.body.appendChild(testButton);
    
    // Auto-run tests after a short delay
    setTimeout(async () => {
        console.log('🚀 Auto-running translation tests...');
        await test.runTests();
    }, 2000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationTest;
}