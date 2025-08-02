/**
 * Enhanced Scroll Animation System
 * Provides velocity-based animation enhancements and visual effects
 */
class ScrollVelocityDetector {
    constructor() {
        this.lastScrollY = window.pageYOffset;
        this.velocity = 0;
        this.velocityThresholds = {
            slow: 2,
            medium: 5,
            fast: 10
        };
        this.updateInterval = null;
    }

    /**
     * Start velocity detection
     */
    start() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 16); // ~60fps
    }

    /**
     * Stop velocity detection
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update velocity calculation
     */
    update() {
        const currentScrollY = window.pageYOffset;
        this.velocity = Math.abs(currentScrollY - this.lastScrollY);
        this.lastScrollY = currentScrollY;
        return this.getVelocityLevel();
    }

    /**
     * Get current velocity level
     */
    getVelocityLevel() {
        if (this.velocity >= this.velocityThresholds.fast) {
            return 'fast';
        } else if (this.velocity >= this.velocityThresholds.medium) {
            return 'medium';
        } else if (this.velocity >= this.velocityThresholds.slow) {
            return 'slow';
        }
        return 'idle';
    }

    /**
     * Get raw velocity value
     */
    getVelocity() {
        return this.velocity;
    }
}

class EnhancedScrollAnimations {
    constructor() {
        this.floatingElements = [];
        this.velocityDetector = new ScrollVelocityDetector();
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.ticking = false;
        
        this.init();
    }

    /**
     * Initialize the enhanced animation system
     */
    init() {
        this.findFloatingElements();
        this.setupScrollListeners();
        this.velocityDetector.start();
        
        console.log('Enhanced Scroll Animations initialized with', this.floatingElements.length, 'elements');
    }

    /**
     * Find all floating elements in the page
     */
    findFloatingElements() {
        this.floatingElements = document.querySelectorAll(
            '.floating-map-pin, .floating-building, .floating-chart, .dynamic-element'
        );
        
        // Store original animations for each element
        this.floatingElements.forEach((element, index) => {
            if (!element.dataset.originalAnimation) {
                element.dataset.originalAnimation = element.style.animation || '';
            }
        });
    }

    /**
     * Setup scroll event listeners
     */
    setupScrollListeners() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Update elements list when new elements are added
        const observer = new MutationObserver(() => {
            this.findFloatingElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Handle scroll events with throttling for 60fps performance
     */
    handleScroll() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                try {
                    this.updateAnimations();
                } catch (error) {
                    console.error('Error updating animations:', error);
                    this.handleAnimationError(error);
                }
                this.ticking = false;
            });
            this.ticking = true;
        }

        // Set scrolling state
        this.isScrolling = true;
        clearTimeout(this.scrollTimeout);
        
        // Reset scroll state after scrolling stops
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
            this.resetAnimations();
        }, 150);
    }

    /**
     * Handle animation errors gracefully
     */
    handleAnimationError(error) {
        console.warn('Animation error detected, switching to safe mode:', error);
        
        // Disable problematic animations
        this.floatingElements.forEach(element => {
            element.classList.remove('scroll-accelerated', 'scroll-glow', 'scroll-enhanced');
            element.style.animation = element.dataset.originalAnimation || '';
        });
        
        // Reduce update frequency
        this.velocityDetector.stop();
        setTimeout(() => {
            if (this.velocityDetector) {
                this.velocityDetector.start();
            }
        }, 1000);
    }

    /**
     * Update animations based on scroll velocity
     */
    updateAnimations() {
        const velocityLevel = this.velocityDetector.getVelocityLevel();
        const velocity = this.velocityDetector.getVelocity();
        
        this.floatingElements.forEach((element, index) => {
            this.applyScrollEffects(element, velocityLevel, velocity, index);
        });
    }

    /**
     * Apply scroll effects to individual elements
     */
    applyScrollEffects(element, velocityLevel, velocity, index) {
        // Remove existing scroll classes
        element.classList.remove('scroll-accelerated', 'scroll-glow', 'scroll-enhanced');
        
        switch(velocityLevel) {
            case 'fast':
                element.classList.add('scroll-accelerated', 'scroll-glow');
                this.addRandomMovement(element, velocity);
                break;
                
            case 'medium':
                element.classList.add('scroll-accelerated');
                break;
                
            case 'slow':
                element.classList.add('scroll-enhanced');
                break;
                
            default:
                // Idle state - no additional effects
                break;
        }
        
        // Apply parallax effect
        this.applyParallaxEffect(element, index, velocity);
    }

    /**
     * Add random movement during fast scrolling
     */
    addRandomMovement(element, velocity) {
        const randomX = (Math.random() - 0.5) * Math.min(velocity * 2, 40);
        const randomY = (Math.random() - 0.5) * Math.min(velocity * 2, 40);
        const randomRotation = Math.random() * 360;
        
        const currentTransform = element.style.transform || '';
        const baseTransform = currentTransform.replace(/translate\([^)]*\)/g, '').replace(/rotate\([^)]*\)/g, '');
        
        element.style.transform = `${baseTransform} translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg)`;
    }

    /**
     * Apply parallax effect based on scroll position and velocity
     */
    applyParallaxEffect(element, index, velocity) {
        const scrolled = window.pageYOffset;
        const baseSpeed = 0.05 + (index * 0.02);
        const velocityMultiplier = Math.min(velocity * 0.01, 0.5);
        const speed = baseSpeed + velocityMultiplier;
        
        const yPos = -(scrolled * speed);
        const xDrift = Math.sin(scrolled * 0.001 + index) * 10;
        
        // Apply parallax without interfering with other transforms
        const currentTransform = element.style.transform || '';
        const withoutParallax = currentTransform.replace(/translate\([^)]*\)/g, '');
        
        element.style.transform = `${withoutParallax} translate(${xDrift}px, ${yPos}px)`;
    }

    /**
     * Reset animations to normal state
     */
    resetAnimations() {
        this.floatingElements.forEach(element => {
            element.classList.remove('scroll-accelerated', 'scroll-glow', 'scroll-enhanced');
            
            // Reset to original animation
            if (element.dataset.originalAnimation) {
                element.style.animation = element.dataset.originalAnimation;
            }
        });
    }

    /**
     * Create particle effects for very fast scrolling
     */
    createScrollParticles() {
        if (!this.isScrolling || this.velocityDetector.getVelocity() < 15) return;

        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: radial-gradient(circle, #60a5fa, #3b82f6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 2;
            opacity: 0.6;
            left: ${Math.random() * window.innerWidth}px;
            top: ${Math.random() * window.innerHeight}px;
            animation: particle-fade 1s ease-out forwards;
        `;

        document.body.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }

    /**
     * Get current scroll velocity
     */
    getScrollVelocity() {
        return this.velocityDetector.getVelocity();
    }

    /**
     * Check if currently scrolling
     */
    isCurrentlyScrolling() {
        return this.isScrolling;
    }

    /**
     * Destroy the animation system
     */
    destroy() {
        this.velocityDetector.stop();
        window.removeEventListener('scroll', this.handleScroll.bind(this));
        this.resetAnimations();
        
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if floating elements exist
    if (document.querySelector('.floating-element')) {
        window.enhancedScrollAnimations = new EnhancedScrollAnimations();
        
        // Create particle effects periodically during fast scrolling
        setInterval(() => {
            if (window.enhancedScrollAnimations) {
                window.enhancedScrollAnimations.createScrollParticles();
            }
        }, 100);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScrollVelocityDetector, EnhancedScrollAnimations };
}