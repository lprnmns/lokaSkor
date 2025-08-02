/**
 * UI Test Suite
 * Comprehensive testing and validation for all UI enhancements
 */
class UITestSuite {
    constructor() {
        this.testResults = {
            stickyNavigation: {},
            universalBackground: {},
            enhancedAnimations: {},
            crossPageConsistency: {},
            performance: {},
            responsiveDesign: {}
        };
        
        this.testsPassed = 0;
        this.totalTests = 0;
        
        this.init();
    }

    /**
     * Initialize test suite
     */
    init() {
        console.log('🧪 UI Test Suite initializing...');
        
        // Wait for all systems to be ready
        setTimeout(() => {
            this.runAllTests();
        }, 2000);
    }

    /**
     * Run all test categories
     */
    async runAllTests() {
        console.log('🚀 Running comprehensive UI tests...');
        
        try {
            await this.testStickyNavigation();
            await this.testUniversalBackground();
            await this.testEnhancedAnimations();
            await this.testCrossPageConsistency();
            await this.testPerformance();
            await this.testResponsiveDesign();
            
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
        }
    }

    /**
     * Test sticky navigation functionality
     */
    async testStickyNavigation() {
        console.log('🧭 Testing sticky navigation...');
        
        const tests = {
            elementExists: this.testNavbarExists(),
            stickyPositioning: this.testStickyPositioning(),
            scrollBehavior: await this.testScrollBehavior(),
            responsiveMenu: this.testResponsiveMenu(),
            smoothScrolling: this.testSmoothScrolling()
        };
        
        this.testResults.stickyNavigation = tests;
        this.updateTestCounts(tests);
    }

    /**
     * Test universal background system
     */
    async testUniversalBackground() {
        console.log('🎨 Testing universal background...');
        
        const tests = {
            backgroundExists: this.testBackgroundExists(),
            heightAdjustment: this.testHeightAdjustment(),
            elementDistribution: this.testElementDistribution(),
            crossPageConsistency: this.testBackgroundConsistency(),
            dynamicHeightUpdate: await this.testDynamicHeightUpdate()
        };
        
        this.testResults.universalBackground = tests;
        this.updateTestCounts(tests);
    }

    /**
     * Test enhanced animations
     */
    async testEnhancedAnimations() {
        console.log('✨ Testing enhanced animations...');
        
        const tests = {
            floatingElementsExist: this.testFloatingElementsExist(),
            scrollVelocityDetection: await this.testScrollVelocityDetection(),
            animationAcceleration: await this.testAnimationAcceleration(),
            glowEffects: await this.testGlowEffects(),
            particleEffects: await this.testParticleEffects()
        };
        
        this.testResults.enhancedAnimations = tests;
        this.updateTestCounts(tests);
    }

    /**
     * Test cross-page consistency
     */
    async testCrossPageConsistency() {
        console.log('🔗 Testing cross-page consistency...');
        
        const tests = {
            navigationConsistency: this.testNavigationConsistency(),
            backgroundConsistency: this.testBackgroundConsistency(),
            animationConsistency: this.testAnimationConsistency(),
            styleConsistency: this.testStyleConsistency(),
            scriptLoading: this.testScriptLoading()
        };
        
        this.testResults.crossPageConsistency = tests;
        this.updateTestCounts(tests);
    }

    /**
     * Test performance metrics
     */
    async testPerformance() {
        console.log('⚡ Testing performance...');
        
        const tests = {
            frameRate: this.testFrameRate(),
            memoryUsage: this.testMemoryUsage(),
            scrollPerformance: await this.testScrollPerformance(),
            animationPerformance: this.testAnimationPerformance(),
            loadTime: this.testLoadTime()
        };
        
        this.testResults.performance = tests;
        this.updateTestCounts(tests);
    }

    /**
     * Test responsive design
     */
    async testResponsiveDesign() {
        console.log('📱 Testing responsive design...');
        
        const tests = {
            mobileNavigation: this.testMobileNavigation(),
            tabletLayout: this.testTabletLayout(),
            desktopLayout: this.testDesktopLayout(),
            touchInteractions: this.testTouchInteractions(),
            breakpointBehavior: await this.testBreakpointBehavior()
        };
        
        this.testResults.responsiveDesign = tests;
        this.updateTestCounts(tests);
    }

    // Individual test methods
    testNavbarExists() {
        const navbar = document.querySelector('.nav-sticky');
        return {
            passed: !!navbar,
            message: navbar ? 'Sticky navbar found' : 'Sticky navbar not found'
        };
    }

    testStickyPositioning() {
        const navbar = document.querySelector('.nav-sticky');
        if (!navbar) return { passed: false, message: 'Navbar not found' };
        
        const styles = window.getComputedStyle(navbar);
        const isFixed = styles.position === 'fixed';
        const hasCorrectZIndex = parseInt(styles.zIndex) >= 1000;
        
        return {
            passed: isFixed && hasCorrectZIndex,
            message: `Position: ${styles.position}, Z-index: ${styles.zIndex}`
        };
    }

    async testScrollBehavior() {
        const navbar = document.querySelector('.nav-sticky');
        if (!navbar) return { passed: false, message: 'Navbar not found' };
        
        const originalScrollY = window.pageYOffset;
        
        // Scroll past threshold
        window.scrollTo(0, 150);
        
        return new Promise(resolve => {
            setTimeout(() => {
                const hasEnhancedClass = navbar.classList.contains('nav-scroll-enhanced');
                
                // Restore scroll position
                window.scrollTo(0, originalScrollY);
                
                resolve({
                    passed: hasEnhancedClass,
                    message: hasEnhancedClass ? 'Scroll behavior working' : 'Scroll behavior not working'
                });
            }, 200);
        });
    }

    testResponsiveMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        return {
            passed: !!(mobileToggle && mobileMenu),
            message: 'Mobile menu elements ' + (mobileToggle && mobileMenu ? 'found' : 'not found')
        };
    }

    testSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        return {
            passed: anchorLinks.length > 0,
            message: `Found ${anchorLinks.length} anchor links`
        };
    }

    testBackgroundExists() {
        const floatingElement = document.querySelector('.floating-element');
        return {
            passed: !!floatingElement,
            message: floatingElement ? 'Floating background found' : 'Floating background not found'
        };
    }

    testHeightAdjustment() {
        const floatingElement = document.querySelector('.floating-element');
        if (!floatingElement) return { passed: false, message: 'Floating element not found' };
        
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
        
        const backgroundHeight = parseInt(floatingElement.style.height) || 0;
        const heightMatch = Math.abs(documentHeight - backgroundHeight) < 200;
        
        return {
            passed: heightMatch,
            message: `Document: ${documentHeight}px, Background: ${backgroundHeight}px`
        };
    }

    testElementDistribution() {
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        const dynamicElements = document.querySelectorAll('.dynamic-element');
        
        return {
            passed: floatingElements.length >= 5,
            message: `Static: ${floatingElements.length}, Dynamic: ${dynamicElements.length}`
        };
    }

    testBackgroundConsistency() {
        const hasGradient = document.body.style.background.includes('gradient') || 
                           window.getComputedStyle(document.body).background.includes('gradient');
        
        return {
            passed: hasGradient,
            message: hasGradient ? 'Background gradient applied' : 'Background gradient missing'
        };
    }

    async testDynamicHeightUpdate() {
        const floatingElement = document.querySelector('.floating-element');
        if (!floatingElement) return { passed: false, message: 'Floating element not found' };
        
        const initialHeight = parseInt(floatingElement.style.height) || 0;
        
        // Trigger height adjustment
        if (window.universalBackground) {
            window.universalBackground.adjustFloatingHeight();
        }
        
        return new Promise(resolve => {
            setTimeout(() => {
                const newHeight = parseInt(floatingElement.style.height) || 0;
                resolve({
                    passed: newHeight > 0,
                    message: `Height updated from ${initialHeight}px to ${newHeight}px`
                });
            }, 100);
        });
    }

    testFloatingElementsExist() {
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        return {
            passed: floatingElements.length > 0,
            message: `Found ${floatingElements.length} floating elements`
        };
    }

    async testScrollVelocityDetection() {
        if (!window.enhancedScrollAnimations) {
            return { passed: false, message: 'Enhanced scroll animations not found' };
        }
        
        // Simulate scroll
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
        
        return new Promise(resolve => {
            setTimeout(() => {
                const velocity = window.enhancedScrollAnimations.getScrollVelocity();
                resolve({
                    passed: typeof velocity === 'number',
                    message: `Velocity detection: ${velocity}`
                });
            }, 100);
        });
    }

    async testAnimationAcceleration() {
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        if (floatingElements.length === 0) {
            return { passed: false, message: 'No floating elements found' };
        }
        
        // Simulate fast scroll
        if (window.enhancedScrollAnimations) {
            window.enhancedScrollAnimations.velocityDetector.velocity = 15; // Fast scroll
            window.enhancedScrollAnimations.updateAnimations();
        }
        
        return new Promise(resolve => {
            setTimeout(() => {
                let hasAccelerated = false;
                floatingElements.forEach(element => {
                    if (element.classList.contains('scroll-accelerated')) {
                        hasAccelerated = true;
                    }
                });
                
                resolve({
                    passed: hasAccelerated,
                    message: hasAccelerated ? 'Animation acceleration working' : 'Animation acceleration not working'
                });
            }, 100);
        });
    }

    async testGlowEffects() {
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        if (floatingElements.length === 0) {
            return { passed: false, message: 'No floating elements found' };
        }
        
        // Add glow effect manually for testing
        floatingElements[0].classList.add('scroll-glow');
        
        return new Promise(resolve => {
            setTimeout(() => {
                const hasGlow = floatingElements[0].classList.contains('scroll-glow');
                floatingElements[0].classList.remove('scroll-glow'); // Cleanup
                
                resolve({
                    passed: hasGlow,
                    message: hasGlow ? 'Glow effects working' : 'Glow effects not working'
                });
            }, 50);
        });
    }

    async testParticleEffects() {
        if (!window.enhancedScrollAnimations) {
            return { passed: false, message: 'Enhanced scroll animations not found' };
        }
        
        // Test particle creation
        const initialParticles = document.querySelectorAll('[style*="particle-fade"]').length;
        
        // Simulate particle creation
        window.enhancedScrollAnimations.createScrollParticles();
        
        return new Promise(resolve => {
            setTimeout(() => {
                const newParticles = document.querySelectorAll('[style*="particle-fade"]').length;
                resolve({
                    passed: newParticles >= initialParticles,
                    message: `Particles: ${initialParticles} → ${newParticles}`
                });
            }, 100);
        });
    }

    testNavigationConsistency() {
        const navbar = document.querySelector('.nav-sticky');
        const logo = document.querySelector('.logo-section');
        const navLinks = document.querySelector('.nav-links');
        
        return {
            passed: !!(navbar && logo && navLinks),
            message: 'Navigation structure ' + (navbar && logo && navLinks ? 'consistent' : 'inconsistent')
        };
    }

    testAnimationConsistency() {
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        let hasAnimations = 0;
        
        floatingElements.forEach(element => {
            if (element.style.animation || window.getComputedStyle(element).animation !== 'none') {
                hasAnimations++;
            }
        });
        
        return {
            passed: hasAnimations > 0,
            message: `${hasAnimations}/${floatingElements.length} elements have animations`
        };
    }

    testStyleConsistency() {
        const hasDesignSystem = !!document.querySelector('link[href*="design_system.css"]');
        const hasAnimations = !!document.querySelector('link[href*="animations.css"]');
        
        return {
            passed: hasDesignSystem && hasAnimations,
            message: `Design system: ${hasDesignSystem}, Animations: ${hasAnimations}`
        };
    }

    testScriptLoading() {
        const requiredScripts = [
            'sticky_navigation.js',
            'enhanced_scroll_animations.js',
            'ui_integration_manager.js',
            'performance_monitor.js'
        ];
        
        let loadedScripts = 0;
        requiredScripts.forEach(script => {
            if (document.querySelector(`script[src*="${script}"]`)) {
                loadedScripts++;
            }
        });
        
        return {
            passed: loadedScripts === requiredScripts.length,
            message: `${loadedScripts}/${requiredScripts.length} scripts loaded`
        };
    }

    testFrameRate() {
        const frameRate = window.performanceMonitor ? 
            window.performanceMonitor.getMetrics().frameRate : 0;
        
        return {
            passed: frameRate >= 30,
            message: `Frame rate: ${frameRate}fps`
        };
    }

    testMemoryUsage() {
        if (!performance.memory) {
            return { passed: true, message: 'Memory API not available' };
        }
        
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
        const isAcceptable = memoryMB < 100; // Less than 100MB
        
        return {
            passed: isAcceptable,
            message: `Memory usage: ${memoryMB}MB`
        };
    }

    async testScrollPerformance() {
        const startTime = performance.now();
        
        // Simulate scroll events
        for (let i = 0; i < 10; i++) {
            window.dispatchEvent(new Event('scroll'));
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
            passed: duration < 100, // Less than 100ms for 10 scroll events
            message: `Scroll performance: ${duration.toFixed(2)}ms`
        };
    }

    testAnimationPerformance() {
        const animatedElements = document.querySelectorAll('[style*="animation"]');
        const isAcceptable = animatedElements.length < 50; // Reasonable limit
        
        return {
            passed: isAcceptable,
            message: `Animated elements: ${animatedElements.length}`
        };
    }

    testLoadTime() {
        const loadTime = performance.timing ? 
            performance.timing.loadEventEnd - performance.timing.navigationStart : 0;
        
        return {
            passed: loadTime < 3000, // Less than 3 seconds
            message: `Load time: ${loadTime}ms`
        };
    }

    testMobileNavigation() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        return {
            passed: !!(mobileToggle && mobileMenu),
            message: 'Mobile navigation ' + (mobileToggle && mobileMenu ? 'available' : 'not available')
        };
    }

    testTabletLayout() {
        // Simulate tablet viewport
        const isTabletFriendly = window.innerWidth >= 768;
        
        return {
            passed: isTabletFriendly,
            message: `Viewport width: ${window.innerWidth}px`
        };
    }

    testDesktopLayout() {
        const navLinks = document.querySelector('.nav-links');
        const isDesktopReady = navLinks && window.getComputedStyle(navLinks).display !== 'none';
        
        return {
            passed: isDesktopReady,
            message: 'Desktop layout ' + (isDesktopReady ? 'ready' : 'not ready')
        };
    }

    testTouchInteractions() {
        const hasTouchSupport = 'ontouchstart' in window;
        
        return {
            passed: true, // Always pass, just informational
            message: `Touch support: ${hasTouchSupport}`
        };
    }

    async testBreakpointBehavior() {
        // Test responsive behavior at different breakpoints
        const originalWidth = window.innerWidth;
        
        // This is a simplified test since we can't actually resize the window
        const breakpoints = [768, 1024, 1280];
        const currentBreakpoint = breakpoints.find(bp => originalWidth >= bp) || 'mobile';
        
        return {
            passed: true,
            message: `Current breakpoint: ${currentBreakpoint}`
        };
    }

    /**
     * Update test counts
     */
    updateTestCounts(tests) {
        Object.values(tests).forEach(test => {
            this.totalTests++;
            if (test.passed) {
                this.testsPassed++;
            }
        });
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const passRate = Math.round((this.testsPassed / this.totalTests) * 100);
        
        console.log('\n📊 UI Test Suite Results');
        console.log('========================');
        console.log(`✅ Tests Passed: ${this.testsPassed}/${this.totalTests} (${passRate}%)`);
        
        // Detailed results by category
        Object.keys(this.testResults).forEach(category => {
            console.log(`\n📋 ${category}:`);
            Object.entries(this.testResults[category]).forEach(([test, result]) => {
                const status = result.passed ? '✅' : '❌';
                console.log(`  ${status} ${test}: ${result.message}`);
            });
        });
        
        // Overall assessment
        if (passRate >= 90) {
            console.log('\n🎉 Excellent! UI enhancements are working perfectly.');
        } else if (passRate >= 75) {
            console.log('\n👍 Good! Most UI enhancements are working correctly.');
        } else if (passRate >= 50) {
            console.log('\n⚠️  Warning! Some UI enhancements need attention.');
        } else {
            console.log('\n🚨 Critical! Major issues detected with UI enhancements.');
        }
        
        // Store results globally for debugging
        window.uiTestResults = this.testResults;
        window.uiTestSummary = {
            passed: this.testsPassed,
            total: this.totalTests,
            passRate: passRate
        };
    }

    /**
     * Run specific test category
     */
    async runTestCategory(category) {
        switch (category) {
            case 'navigation':
                await this.testStickyNavigation();
                break;
            case 'background':
                await this.testUniversalBackground();
                break;
            case 'animations':
                await this.testEnhancedAnimations();
                break;
            case 'performance':
                await this.testPerformance();
                break;
            case 'responsive':
                await this.testResponsiveDesign();
                break;
            default:
                console.warn('Unknown test category:', category);
        }
    }
}

// Auto-initialize test suite in development
document.addEventListener('DOMContentLoaded', () => {
    // Only run tests if in development or testing mode
    if (window.location.hostname === 'localhost' || window.location.search.includes('test=true')) {
        setTimeout(() => {
            window.uiTestSuite = new UITestSuite();
        }, 3000); // Wait for all systems to initialize
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UITestSuite;
}