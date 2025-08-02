/**
 * UI Integration Manager
 * Coordinates all UI enhancement systems and provides testing utilities
 */
class UIIntegrationManager {
    constructor() {
        this.systems = {
            stickyNavigation: null,
            universalBackground: null,
            enhancedScrollAnimations: null,
            animationPerformance: null,
            animationManager: null,
            microInteractions: null
        };
        
        this.performanceMetrics = {
            frameRate: 0,
            scrollVelocity: 0,
            animationCount: 0,
            lastUpdate: Date.now()
        };
        
        this.init();
    }

    /**
     * Initialize all UI systems
     */
    init() {
        console.log('UI Integration Manager initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeSystems());
        } else {
            this.initializeSystems();
        }
    }

    /**
     * Initialize all UI enhancement systems
     */
    initializeSystems() {
        try {
            // Initialize systems in order of dependency
            this.initializeAnimationSystems();
            this.initializeNavigationSystem();
            this.initializeBackgroundSystem();
            this.initializeScrollAnimations();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            // Setup integration tests
            this.setupIntegrationTests();
            
            console.log('All UI systems initialized successfully');
            
        } catch (error) {
            console.error('Error initializing UI systems:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize animation systems
     */
    initializeAnimationSystems() {
        // Animation Performance System
        if (typeof AnimationPerformance !== 'undefined') {
            this.systems.animationPerformance = new AnimationPerformance();
            console.log('✓ Animation Performance system initialized');
        }

        // Animation Manager
        if (typeof AnimationManager !== 'undefined') {
            this.systems.animationManager = new AnimationManager();
            console.log('✓ Animation Manager initialized');
        }

        // Micro Interactions
        if (typeof MicroInteractions !== 'undefined') {
            this.systems.microInteractions = new MicroInteractions();
            console.log('✓ Micro Interactions initialized');
        }
    }

    /**
     * Initialize sticky navigation system
     */
    initializeNavigationSystem() {
        if (document.querySelector('.nav-sticky')) {
            this.systems.stickyNavigation = window.stickyNavigation;
            console.log('✓ Sticky Navigation system initialized');
        }
    }

    /**
     * Initialize universal background system
     */
    initializeBackgroundSystem() {
        if (document.querySelector('.floating-element')) {
            this.systems.universalBackground = window.universalBackground;
            console.log('✓ Universal Background system initialized');
        }
    }

    /**
     * Initialize enhanced scroll animations
     */
    initializeScrollAnimations() {
        if (document.querySelector('.floating-element')) {
            this.systems.enhancedScrollAnimations = window.enhancedScrollAnimations;
            console.log('✓ Enhanced Scroll Animations initialized');
        }
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measurePerformance = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                this.performanceMetrics.frameRate = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Get scroll velocity if available
                if (this.systems.enhancedScrollAnimations) {
                    this.performanceMetrics.scrollVelocity = this.systems.enhancedScrollAnimations.getScrollVelocity();
                }
                
                // Count active animations
                this.performanceMetrics.animationCount = document.querySelectorAll('[style*="animation"]').length;
                
                this.performanceMetrics.lastUpdate = Date.now();
                
                // Log performance if below threshold
                if (this.performanceMetrics.frameRate < 30) {
                    console.warn('Low frame rate detected:', this.performanceMetrics.frameRate, 'fps');
                    this.optimizePerformance();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measurePerformance);
        };
        
        requestAnimationFrame(measurePerformance);
    }

    /**
     * Optimize performance when low frame rate is detected
     */
    optimizePerformance() {
        console.log('Optimizing performance...');
        
        // Reduce animation complexity
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        floatingElements.forEach(element => {
            element.style.animationDuration = '12s'; // Slower animations
        });
        
        // Disable particle effects temporarily
        if (this.systems.enhancedScrollAnimations) {
            this.systems.enhancedScrollAnimations.createScrollParticles = () => {}; // Disable particles
        }
    }

    /**
     * Setup integration tests
     */
    setupIntegrationTests() {
        // Test sticky navigation
        this.testStickyNavigation();
        
        // Test background system
        this.testBackgroundSystem();
        
        // Test scroll animations
        this.testScrollAnimations();
        
        // Test cross-system integration
        this.testSystemIntegration();
    }

    /**
     * Test sticky navigation functionality
     */
    testStickyNavigation() {
        const navbar = document.querySelector('.nav-sticky');
        if (!navbar) {
            console.warn('Sticky navigation test failed: navbar not found');
            return false;
        }

        // Test scroll behavior
        const originalScrollY = window.pageYOffset;
        window.scrollTo(0, 150); // Scroll past threshold
        
        setTimeout(() => {
            const hasEnhancedClass = navbar.classList.contains('nav-scroll-enhanced');
            console.log('✓ Sticky navigation scroll test:', hasEnhancedClass ? 'PASSED' : 'FAILED');
            
            // Restore scroll position
            window.scrollTo(0, originalScrollY);
        }, 100);

        return true;
    }

    /**
     * Test background system functionality
     */
    testBackgroundSystem() {
        const floatingElement = document.querySelector('.floating-element');
        if (!floatingElement) {
            console.warn('Background system test failed: floating element not found');
            return false;
        }

        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );
        
        const backgroundHeight = parseInt(floatingElement.style.height) || 0;
        const heightMatch = Math.abs(documentHeight - backgroundHeight) < 100;
        
        console.log('✓ Background height test:', heightMatch ? 'PASSED' : 'FAILED');
        console.log('  Document height:', documentHeight, 'Background height:', backgroundHeight);

        return heightMatch;
    }

    /**
     * Test scroll animations functionality
     */
    testScrollAnimations() {
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        if (floatingElements.length === 0) {
            console.warn('Scroll animations test failed: no floating elements found');
            return false;
        }

        // Simulate scroll event
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
        
        setTimeout(() => {
            let hasAnimatedElements = false;
            floatingElements.forEach(element => {
                if (element.style.animation || element.classList.contains('scroll-accelerated')) {
                    hasAnimatedElements = true;
                }
            });
            
            console.log('✓ Scroll animations test:', hasAnimatedElements ? 'PASSED' : 'FAILED');
        }, 100);

        return true;
    }

    /**
     * Test cross-system integration
     */
    testSystemIntegration() {
        let integrationScore = 0;
        const totalTests = 4;

        // Test 1: All systems initialized
        const systemsInitialized = Object.values(this.systems).filter(system => system !== null).length;
        if (systemsInitialized >= 3) integrationScore++;

        // Test 2: No JavaScript errors
        let hasErrors = false;
        const originalError = window.onerror;
        window.onerror = () => { hasErrors = true; };
        
        setTimeout(() => {
            window.onerror = originalError;
            if (!hasErrors) integrationScore++;
            
            // Test 3: Performance within acceptable range
            if (this.performanceMetrics.frameRate >= 30) integrationScore++;
            
            // Test 4: Responsive behavior
            const isResponsive = window.innerWidth > 768 ? 
                document.querySelector('.nav-links').style.display !== 'none' :
                document.querySelector('.mobile-menu-toggle').style.display !== 'none';
            if (isResponsive) integrationScore++;
            
            const integrationHealth = (integrationScore / totalTests) * 100;
            console.log(`✓ System integration health: ${integrationHealth}% (${integrationScore}/${totalTests} tests passed)`);
            
            if (integrationHealth < 75) {
                console.warn('Integration health below threshold, some features may not work optimally');
            }
        }, 500);
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('UI System initialization failed:', error);
        
        // Attempt graceful degradation
        document.body.classList.add('ui-degraded');
        
        // Disable problematic features
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        floatingElements.forEach(element => {
            element.style.animation = 'none';
        });
    }

    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        const status = {};
        Object.keys(this.systems).forEach(key => {
            status[key] = this.systems[key] !== null ? 'active' : 'inactive';
        });
        return status;
    }

    /**
     * Refresh all systems
     */
    refreshSystems() {
        console.log('Refreshing UI systems...');
        
        // Refresh background height
        if (this.systems.universalBackground) {
            this.systems.universalBackground.adjustFloatingHeight();
        }
        
        // Refresh navigation state
        if (this.systems.stickyNavigation) {
            this.systems.stickyNavigation.refresh();
        }
        
        // Re-find floating elements for animations
        if (this.systems.enhancedScrollAnimations) {
            this.systems.enhancedScrollAnimations.findFloatingElements();
        }
    }

    /**
     * Destroy all systems (cleanup)
     */
    destroy() {
        console.log('Destroying UI systems...');
        
        Object.values(this.systems).forEach(system => {
            if (system && typeof system.destroy === 'function') {
                system.destroy();
            }
        });
        
        this.systems = {};
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.uiIntegrationManager = new UIIntegrationManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIIntegrationManager;
}