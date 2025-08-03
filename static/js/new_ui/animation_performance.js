/**
 * LokaSkor Modern UI - Animation Performance Optimizer
 * Optimizes animations for better performance and user experience
 */

class AnimationPerformance {
    constructor() {
        this.isReducedMotion = false;
        this.performanceMode = 'auto'; // auto, high, low
        this.frameRate = 60;
        this.animationQueue = [];
        this.runningAnimations = new Set();
        this.intersectionObserver = null;
        
        this.init();
    }
    
    /**
     * Initialize performance optimizer
     */
    init() {
        this.detectCapabilities();
        this.setupPerformanceMonitoring();
        this.setupIntersectionObserver();
        this.optimizeExistingAnimations();
        console.log('AnimationPerformance initialized', {
            reducedMotion: this.isReducedMotion,
            performanceMode: this.performanceMode
        });
    }

    /**
     * Detect device capabilities and user preferences
     */
    detectCapabilities() {
        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.isReducedMotion = mediaQuery.matches;
        
        mediaQuery.addEventListener('change', (e) => {
            this.isReducedMotion = e.matches;
            this.updateAnimationSettings();
        });
        
        // Detect device performance indicators
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const memory = navigator.deviceMemory;
        const cores = navigator.hardwareConcurrency;
        
        // Determine performance mode
        if (this.isReducedMotion) {
            this.performanceMode = 'minimal';
        } else if (connection && connection.effectiveType) {
            // Network-based performance hints
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.performanceMode = 'low';
            } else if (connection.effectiveType === '3g') {
                this.performanceMode = 'medium';
            } else {
                this.performanceMode = 'high';
            }
        } else if (memory && cores) {
            // Hardware-based performance hints
            if (memory < 4 || cores < 4) {
                this.performanceMode = 'low';
            } else if (memory < 8 || cores < 8) {
                this.performanceMode = 'medium';
            } else {
                this.performanceMode = 'high';
            }
        }
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                this.frameRate = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Adjust performance mode based on FPS
                if (this.frameRate < 30 && this.performanceMode !== 'low') {
                    this.performanceMode = 'low';
                    this.updateAnimationSettings();
                } else if (this.frameRate > 50 && this.performanceMode === 'low') {
                    this.performanceMode = 'medium';
                    this.updateAnimationSettings();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * Setup intersection observer for viewport-based optimizations
     */
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                
                if (entry.isIntersecting) {
                    // Element is visible, enable animations
                    element.classList.remove('animation-paused');
                    this.resumeElementAnimations(element);
                } else {
                    // Element is not visible, pause animations
                    element.classList.add('animation-paused');
                    this.pauseElementAnimations(element);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        // Observe animated elements
        this.observeAnimatedElements();
    }
    
    /**
     * Observe animated elements for viewport optimization
     */
    observeAnimatedElements() {
        const animatedElements = document.querySelectorAll(`
            [class*="animate-"],
            [class*="transition-"],
            .loading-spinner,
            .progress-bar,
            .skeleton
        `);
        
        animatedElements.forEach(element => {
            this.intersectionObserver.observe(element);
        });
    }
    
    /**
     * Update animation settings based on performance mode
     */
    updateAnimationSettings() {
        const root = document.documentElement;
        
        switch (this.performanceMode) {
            case 'minimal':
                root.style.setProperty('--animation-duration-multiplier', '0.01');
                root.style.setProperty('--animation-enabled', '0');
                this.disableComplexAnimations();
                break;
                
            case 'low':
                root.style.setProperty('--animation-duration-multiplier', '0.5');
                root.style.setProperty('--animation-enabled', '1');
                this.simplifyAnimations();
                break;
                
            case 'medium':
                root.style.setProperty('--animation-duration-multiplier', '0.8');
                root.style.setProperty('--animation-enabled', '1');
                this.enableStandardAnimations();
                break;
                
            case 'high':
                root.style.setProperty('--animation-duration-multiplier', '1');
                root.style.setProperty('--animation-enabled', '1');
                this.enableAllAnimations();
                break;
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('animationPerformanceChange', {
            detail: {
                mode: this.performanceMode,
                reducedMotion: this.isReducedMotion,
                frameRate: this.frameRate
            }
        }));
    }
    
    /**
     * Disable complex animations
     */
    disableComplexAnimations() {
        const complexSelectors = [
            '.parallax',
            '.particle-effect',
            '.complex-transition',
            '[class*="bounce"]',
            '[class*="elastic"]',
            '[class*="spring"]'
        ];
        
        complexSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.style.animation = 'none';
                element.style.transition = 'none';
            });
        });
    }
    
    /**
     * Simplify animations for low performance mode
     */
    simplifyAnimations() {
        // Replace complex animations with simple ones
        const replacements = {
            'bounce': 'fade',
            'elastic': 'ease',
            'spring': 'ease-out',
            'rubber-band': 'scale',
            'jello': 'fade'
        };
        
        Object.entries(replacements).forEach(([complex, simple]) => {
            document.querySelectorAll(`[class*="${complex}"]`).forEach(element => {
                element.classList.forEach(className => {
                    if (className.includes(complex)) {
                        element.classList.remove(className);
                        element.classList.add(className.replace(complex, simple));
                    }
                });
            });
        });
    }
    
    /**
     * Enable standard animations
     */
    enableStandardAnimations() {
        // Remove performance restrictions but keep some optimizations
        document.querySelectorAll('.animation-disabled').forEach(element => {
            element.classList.remove('animation-disabled');
        });
    }
    
    /**
     * Enable all animations
     */
    enableAllAnimations() {
        // Remove all performance restrictions
        document.querySelectorAll('.animation-disabled, .animation-simplified').forEach(element => {
            element.classList.remove('animation-disabled', 'animation-simplified');
        });
    }
    
    /**
     * Pause element animations
     */
    pauseElementAnimations(element) {
        const computedStyle = window.getComputedStyle(element);
        
        if (computedStyle.animationName !== 'none') {
            element.style.animationPlayState = 'paused';
        }
        
        // Pause child animations
        element.querySelectorAll('[class*="animate-"]').forEach(child => {
            child.style.animationPlayState = 'paused';
        });
    }
    
    /**
     * Resume element animations
     */
    resumeElementAnimations(element) {
        element.style.animationPlayState = 'running';
        
        // Resume child animations
        element.querySelectorAll('[class*="animate-"]').forEach(child => {
            child.style.animationPlayState = 'running';
        });
    }
    
    /**
     * Optimize existing animations
     */
    optimizeExistingAnimations() {
        // Add will-change property to animated elements
        document.querySelectorAll(`
            [class*="animate-"],
            [class*="transition-"],
            .hover-lift,
            .hover-scale,
            .card-interactive
        `).forEach(element => {
            element.style.willChange = 'transform, opacity';
        });
    }
    
    /**
     * Create optimized animation
     */
    createOptimizedAnimation(element, keyframes, options = {}) {
        // Adjust options based on performance mode
        const optimizedOptions = {
            ...options,
            duration: (options.duration || 300) * this.getPerformanceMultiplier(),
            easing: this.getOptimizedEasing(options.easing || 'ease')
        };
        
        // Skip animation if reduced motion is preferred
        if (this.isReducedMotion && !options.force) {
            return Promise.resolve();
        }
        
        // Use Web Animations API for better performance
        const animation = element.animate(keyframes, optimizedOptions);
        
        // Track running animation
        this.runningAnimations.add(animation);
        
        animation.addEventListener('finish', () => {
            this.runningAnimations.delete(animation);
            element.style.willChange = 'auto';
        });
        
        return animation.finished;
    }
    
    /**
     * Get performance multiplier for animation duration
     */
    getPerformanceMultiplier() {
        switch (this.performanceMode) {
            case 'minimal': return 0.01;
            case 'low': return 0.5;
            case 'medium': return 0.8;
            case 'high': return 1;
            default: return 1;
        }
    }
    
    /**
     * Get optimized easing function
     */
    getOptimizedEasing(easing) {
        if (this.performanceMode === 'low' || this.performanceMode === 'minimal') {
            // Use simpler easing functions
            const simpleEasings = {
                'cubic-bezier(0.68, -0.55, 0.265, 1.55)': 'ease-out',
                'cubic-bezier(0.34, 1.56, 0.64, 1)': 'ease-out',
                'spring': 'ease-out',
                'bounce': 'ease'
            };
            
            return simpleEasings[easing] || 'ease';
        }
        
        return easing;
    }
    
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return {
            mode: this.performanceMode,
            reducedMotion: this.isReducedMotion,
            frameRate: this.frameRate,
            runningAnimations: this.runningAnimations.size,
            queuedAnimations: this.animationQueue.length
        };
    }
    
    /**
     * Force performance mode
     */
    setPerformanceMode(mode) {
        this.performanceMode = mode;
        this.updateAnimationSettings();
    }
    
    /**
     * Cleanup performance optimizer
     */
    cleanup() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // Cancel running animations
        this.runningAnimations.forEach(animation => {
            animation.cancel();
        });
        
        this.runningAnimations.clear();
        this.animationQueue = [];
    }
}

// Make globally available
window.AnimationPerformance = AnimationPerformance;