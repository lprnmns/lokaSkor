/**
 * Performance Monitor
 * Monitors and optimizes UI performance in real-time
 */
class PerformanceMonitor {
    constructor() {
        this.frameRate = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.isMonitoring = false;
        this.performanceThresholds = {
            critical: 20, // fps
            warning: 30,  // fps
            good: 50      // fps
        };
        this.optimizationLevel = 0; // 0 = none, 1 = light, 2 = aggressive
        
        this.init();
    }

    /**
     * Initialize performance monitoring
     */
    init() {
        this.startMonitoring();
        this.setupPerformanceObserver();
        console.log('Performance Monitor initialized');
    }

    /**
     * Start frame rate monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitorFrameRate();
    }

    /**
     * Stop frame rate monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
    }

    /**
     * Monitor frame rate continuously
     */
    monitorFrameRate() {
        if (!this.isMonitoring) return;

        const currentTime = performance.now();
        this.frameCount++;

        if (currentTime - this.lastTime >= 1000) {
            this.frameRate = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            
            // Check performance and optimize if needed
            this.checkPerformance();
            
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        requestAnimationFrame(() => this.monitorFrameRate());
    }

    /**
     * Check current performance and apply optimizations
     */
    checkPerformance() {
        const previousLevel = this.optimizationLevel;

        if (this.frameRate < this.performanceThresholds.critical) {
            this.optimizationLevel = 2; // Aggressive optimization
            console.warn(`Critical performance: ${this.frameRate}fps - Applying aggressive optimizations`);
        } else if (this.frameRate < this.performanceThresholds.warning) {
            this.optimizationLevel = 1; // Light optimization
            console.warn(`Low performance: ${this.frameRate}fps - Applying light optimizations`);
        } else if (this.frameRate > this.performanceThresholds.good) {
            this.optimizationLevel = 0; // No optimization needed
            if (previousLevel > 0) {
                console.log(`Good performance: ${this.frameRate}fps - Removing optimizations`);
            }
        }

        // Apply optimizations if level changed
        if (this.optimizationLevel !== previousLevel) {
            this.applyOptimizations();
        }
    }

    /**
     * Apply performance optimizations based on current level
     */
    applyOptimizations() {
        switch (this.optimizationLevel) {
            case 0: // No optimization
                this.removeOptimizations();
                break;
                
            case 1: // Light optimization
                this.applyLightOptimizations();
                break;
                
            case 2: // Aggressive optimization
                this.applyAggressiveOptimizations();
                break;
        }
    }

    /**
     * Apply light performance optimizations
     */
    applyLightOptimizations() {
        // Reduce animation frequency
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        floatingElements.forEach(element => {
            const currentDuration = element.style.animationDuration || '8s';
            const newDuration = parseFloat(currentDuration) * 1.5 + 's';
            element.style.animationDuration = newDuration;
        });

        // Reduce scroll animation sensitivity
        if (window.enhancedScrollAnimations) {
            window.enhancedScrollAnimations.velocityDetector.velocityThresholds.fast = 15;
            window.enhancedScrollAnimations.velocityDetector.velocityThresholds.medium = 8;
        }

        document.body.classList.add('performance-optimized-light');
    }

    /**
     * Apply aggressive performance optimizations
     */
    applyAggressiveOptimizations() {
        // Significantly reduce animations
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        floatingElements.forEach(element => {
            element.style.animationDuration = '20s'; // Very slow
            element.style.animationTimingFunction = 'linear'; // Simpler timing
        });

        // Disable particle effects
        if (window.enhancedScrollAnimations) {
            window.enhancedScrollAnimations.createScrollParticles = () => {}; // Disable
            window.enhancedScrollAnimations.velocityDetector.velocityThresholds.fast = 20;
        }

        // Reduce background complexity
        const dynamicElements = document.querySelectorAll('.dynamic-element');
        dynamicElements.forEach((element, index) => {
            if (index % 2 === 0) { // Hide every other element
                element.style.display = 'none';
            }
        });

        document.body.classList.add('performance-optimized-aggressive');
    }

    /**
     * Remove all performance optimizations
     */
    removeOptimizations() {
        // Restore original animation durations
        const floatingElements = document.querySelectorAll('.floating-map-pin, .floating-building, .floating-chart');
        floatingElements.forEach(element => {
            if (element.dataset.originalAnimation) {
                element.style.animation = element.dataset.originalAnimation;
            }
        });

        // Restore scroll animation sensitivity
        if (window.enhancedScrollAnimations) {
            window.enhancedScrollAnimations.velocityDetector.velocityThresholds.fast = 10;
            window.enhancedScrollAnimations.velocityDetector.velocityThresholds.medium = 5;
        }

        // Restore dynamic elements
        const dynamicElements = document.querySelectorAll('.dynamic-element');
        dynamicElements.forEach(element => {
            element.style.display = '';
        });

        document.body.classList.remove('performance-optimized-light', 'performance-optimized-aggressive');
    }

    /**
     * Setup Performance Observer API if available
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'measure' && entry.duration > 16.67) {
                            console.warn('Long task detected:', entry.name, entry.duration + 'ms');
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (error) {
                console.warn('Performance Observer not supported:', error);
            }
        }
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        return {
            frameRate: this.frameRate,
            optimizationLevel: this.optimizationLevel,
            isMonitoring: this.isMonitoring,
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Get memory usage if available
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
            };
        }
        return null;
    }

    /**
     * Force performance optimization
     */
    forceOptimization(level = 1) {
        this.optimizationLevel = level;
        this.applyOptimizations();
        console.log(`Forced optimization level: ${level}`);
    }

    /**
     * Reset performance optimizations
     */
    reset() {
        this.optimizationLevel = 0;
        this.removeOptimizations();
        console.log('Performance optimizations reset');
    }

    /**
     * Destroy performance monitor
     */
    destroy() {
        this.stopMonitoring();
        this.reset();
    }
}

// Auto-initialize performance monitor
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on pages with animations
    if (document.querySelector('.floating-element')) {
        window.performanceMonitor = new PerformanceMonitor();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}