/**
 * CategoryExpander - Handles smooth expand/collapse animations for detail panels
 * Provides GPU-accelerated transitions with dynamic height calculation
 */

class CategoryExpander {
    constructor(panelManager) {
        this.panelManager = panelManager;
        this.animationDuration = 300; // milliseconds
        this.easing = 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Material Design easing
        
        console.log('✨ CategoryExpander initialized');
    }

    /**
     * Expand panel with smooth animation
     * @param {HTMLElement} container - Panel container element
     * @returns {Promise} - Resolves when animation completes
     */
    async expandPanel(container) {
        return new Promise((resolve) => {
            console.log('📈 Expanding panel:', container.dataset.panelKey);
            
            // Ensure container is in DOM
            if (!container.parentNode) {
                console.error('❌ Container not in DOM');
                resolve();
                return;
            }
            
            // Set initial state for measurement
            container.style.height = 'auto';
            container.style.overflow = 'hidden';
            container.style.transition = 'none';
            container.style.opacity = '0';
            
            // Force reflow to apply initial styles
            container.offsetHeight;
            
            // Measure natural height
            const targetHeight = this.calculateExpandedHeight(container);
            
            console.log(`📏 Target height: ${targetHeight}px`);
            
            // Set starting position
            container.style.height = '0px';
            container.style.opacity = '0';
            
            // Force reflow
            container.offsetHeight;
            
            // Apply transition
            container.style.transition = `
                height ${this.animationDuration}ms ${this.easing},
                opacity ${this.animationDuration}ms ${this.easing}
            `;
            
            // Add performance hint
            container.style.willChange = 'height, opacity';
            
            // Trigger animation
            requestAnimationFrame(() => {
                container.style.height = `${targetHeight}px`;
                container.style.opacity = '1';
                
                // Add expanded class for styling
                container.classList.add('expanded');
            });
            
            // Clean up after animation
            const cleanup = () => {
                container.style.height = 'auto';
                container.style.willChange = 'auto';
                container.style.transition = '';
                
                console.log('✅ Panel expand animation complete');
                resolve();
            };
            
            // Set timeout as fallback
            const timeoutId = setTimeout(cleanup, this.animationDuration + 50);
            
            // Listen for transition end
            const handleTransitionEnd = (e) => {
                if (e.target === container && e.propertyName === 'height') {
                    clearTimeout(timeoutId);
                    container.removeEventListener('transitionend', handleTransitionEnd);
                    cleanup();
                }
            };
            
            container.addEventListener('transitionend', handleTransitionEnd);
        });
    }

    /**
     * Collapse panel with smooth animation
     * @param {HTMLElement} container - Panel container element
     * @returns {Promise} - Resolves when animation completes
     */
    async collapsePanel(container) {
        return new Promise((resolve) => {
            console.log('📉 Collapsing panel:', container.dataset.panelKey);
            
            if (!container.parentNode) {
                resolve();
                return;
            }
            
            // Get current height for smooth collapse
            const currentHeight = container.offsetHeight;
            
            console.log(`📏 Current height: ${currentHeight}px`);
            
            // Set explicit height to start collapse animation
            container.style.height = `${currentHeight}px`;
            container.style.overflow = 'hidden';
            
            // Force reflow
            container.offsetHeight;
            
            // Apply transition
            container.style.transition = `
                height ${this.animationDuration}ms ${this.easing},
                opacity ${this.animationDuration}ms ${this.easing}
            `;
            
            // Add performance hint
            container.style.willChange = 'height, opacity';
            
            // Remove expanded class
            container.classList.remove('expanded');
            
            // Trigger animation
            requestAnimationFrame(() => {
                container.style.height = '0px';
                container.style.opacity = '0';
            });
            
            // Clean up after animation
            const cleanup = () => {
                container.style.willChange = 'auto';
                console.log('✅ Panel collapse animation complete');
                resolve();
            };
            
            // Set timeout as fallback
            const timeoutId = setTimeout(cleanup, this.animationDuration + 50);
            
            // Listen for transition end
            const handleTransitionEnd = (e) => {
                if (e.target === container && e.propertyName === 'height') {
                    clearTimeout(timeoutId);
                    container.removeEventListener('transitionend', handleTransitionEnd);
                    cleanup();
                }
            };
            
            container.addEventListener('transitionend', handleTransitionEnd);
        });
    }

    /**
     * Calculate the natural expanded height of container content
     * @param {HTMLElement} container - Container element
     * @returns {number} - Height in pixels
     */
    calculateExpandedHeight(container) {
        // Create a temporary clone for measurement
        const clone = container.cloneNode(true);
        
        // Set styles for accurate measurement
        clone.style.position = 'absolute';
        clone.style.visibility = 'hidden';
        clone.style.height = 'auto';
        clone.style.maxHeight = 'none';
        clone.style.overflow = 'visible';
        clone.style.opacity = '1';
        clone.style.transform = 'none';
        
        // Add to DOM for measurement
        container.parentNode.appendChild(clone);
        
        // Get height including padding and border
        const height = clone.offsetHeight;
        
        // Remove clone
        clone.remove();
        
        return height;
    }

    /**
     * Animate transition between two heights
     * @param {HTMLElement} element - Element to animate
     * @param {number} fromHeight - Starting height
     * @param {number} toHeight - Target height
     * @returns {Promise} - Resolves when animation completes
     */
    animateTransition(element, fromHeight, toHeight) {
        return new Promise((resolve) => {
            console.log(`🔄 Animating transition: ${fromHeight}px → ${toHeight}px`);
            
            // Set starting position
            element.style.height = `${fromHeight}px`;
            element.style.overflow = 'hidden';
            
            // Force reflow
            element.offsetHeight;
            
            // Apply transition
            element.style.transition = `height ${this.animationDuration}ms ${this.easing}`;
            element.style.willChange = 'height';
            
            // Trigger animation
            requestAnimationFrame(() => {
                element.style.height = `${toHeight}px`;
            });
            
            // Clean up after animation
            const cleanup = () => {
                element.style.willChange = 'auto';
                if (toHeight > 0) {
                    element.style.height = 'auto';
                }
                console.log('✅ Transition animation complete');
                resolve();
            };
            
            // Set timeout as fallback
            const timeoutId = setTimeout(cleanup, this.animationDuration + 50);
            
            // Listen for transition end
            const handleTransitionEnd = (e) => {
                if (e.target === element && e.propertyName === 'height') {
                    clearTimeout(timeoutId);
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    cleanup();
                }
            };
            
            element.addEventListener('transitionend', handleTransitionEnd);
        });
    }

    /**
     * Quick expand without animation (for instant display)
     * @param {HTMLElement} container - Panel container
     */
    instantExpand(container) {
        container.style.height = 'auto';
        container.style.opacity = '1';
        container.style.overflow = 'visible';
        container.classList.add('expanded');
        
        console.log('⚡ Panel instantly expanded');
    }

    /**
     * Quick collapse without animation
     * @param {HTMLElement} container - Panel container
     */
    instantCollapse(container) {
        container.style.height = '0px';
        container.style.opacity = '0';
        container.style.overflow = 'hidden';
        container.classList.remove('expanded');
        
        console.log('⚡ Panel instantly collapsed');
    }

    /**
     * Check if element is currently animating
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} - True if animating
     */
    isAnimating(element) {
        const computedStyle = getComputedStyle(element);
        const transitionProperty = computedStyle.transitionProperty;
        const transitionDuration = computedStyle.transitionDuration;
        
        return transitionProperty !== 'none' && parseFloat(transitionDuration) > 0;
    }

    /**
     * Wait for any ongoing animations to complete
     * @param {HTMLElement} element - Element to wait for
     * @returns {Promise} - Resolves when animations complete
     */
    waitForAnimations(element) {
        return new Promise((resolve) => {
            if (!this.isAnimating(element)) {
                resolve();
                return;
            }
            
            const handleTransitionEnd = () => {
                element.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            };
            
            element.addEventListener('transitionend', handleTransitionEnd);
            
            // Fallback timeout
            setTimeout(() => {
                element.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            }, this.animationDuration * 2);
        });
    }

    /**
     * Set custom animation duration
     * @param {number} duration - Duration in milliseconds
     */
    setAnimationDuration(duration) {
        this.animationDuration = Math.max(100, Math.min(1000, duration));
        console.log(`⏱️ Animation duration set to: ${this.animationDuration}ms`);
    }

    /**
     * Set custom easing function
     * @param {string} easing - CSS easing function
     */
    setEasing(easing) {
        this.easing = easing;
        console.log(`📈 Easing function set to: ${easing}`);
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            animationDuration: this.animationDuration,
            easing: this.easing,
            supportsWillChange: CSS.supports('will-change', 'transform'),
            supportsRequestAnimationFrame: typeof requestAnimationFrame !== 'undefined'
        };
    }
}

// Make it globally available
window.CategoryExpander = CategoryExpander; 