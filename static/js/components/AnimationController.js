/**
 * AnimationController - Utility class for managing progress bar animations
 * Provides smooth animations and staggered effects for progress bars
 */
class AnimationController {
    /**
     * Animate a single progress bar to target width
     * @param {HTMLElement} barElement - Progress bar element
     * @param {number} targetWidth - Target width percentage (0-100)
     * @param {number} duration - Animation duration in milliseconds
     * @param {Object} options - Animation options
     * @returns {Promise} Promise that resolves when animation completes
     */
    static animateProgressBar(barElement, targetWidth, duration = 800, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (!barElement || !(barElement instanceof HTMLElement)) {
                    reject(new Error('Invalid progress bar element'));
                    return;
                }
                
                const {
                    delay = 0,
                    easing = 'ease-out',
                    onStart = null,
                    onComplete = null,
                    animateColor = true
                } = options;
                
                // Sanitize target width
                const sanitizedWidth = Math.max(0, Math.min(100, targetWidth));
                
                // Set initial state
                barElement.style.width = '0%';
                barElement.style.transition = 'none';
                
                // Call onStart callback
                if (typeof onStart === 'function') {
                    onStart(barElement);
                }
                
                // Start animation after delay
                setTimeout(() => {
                    // Set up transition
                    const transitions = [`width ${duration}ms ${easing}`];
                    if (animateColor) {
                        transitions.push('background-color 300ms ease');
                    }
                    barElement.style.transition = transitions.join(', ');
                    
                    // Apply target width
                    barElement.style.width = `${sanitizedWidth}%`;
                    
                    // Update color if needed
                    if (animateColor && window.ColorCalculator) {
                        const color = ColorCalculator.getColorForScore(sanitizedWidth);
                        barElement.style.backgroundColor = color;
                    }
                    
                    // Resolve promise when animation completes
                    setTimeout(() => {
                        if (typeof onComplete === 'function') {
                            onComplete(barElement);
                        }
                        resolve(barElement);
                    }, duration);
                    
                }, delay);
                
            } catch (error) {
                console.error('AnimationController: Error animating progress bar:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Animate multiple progress bars with staggered timing
     * @param {Array} barElements - Array of progress bar elements
     * @param {Array|number} targetWidths - Target widths (array or single value)
     * @param {number} staggerDelay - Delay between each bar animation
     * @param {Object} options - Animation options
     * @returns {Promise} Promise that resolves when all animations complete
     */
    static staggeredAnimation(barElements, targetWidths, staggerDelay = 100, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (!Array.isArray(barElements) || barElements.length === 0) {
                    reject(new Error('Invalid bar elements array'));
                    return;
                }
                
                const {
                    duration = 800,
                    onAllComplete = null
                } = options;
                
                // Normalize target widths
                const widths = Array.isArray(targetWidths) 
                    ? targetWidths 
                    : new Array(barElements.length).fill(targetWidths);
                
                // Create animation promises
                const animationPromises = barElements.map((barElement, index) => {
                    const targetWidth = widths[index] || 0;
                    const delay = index * staggerDelay;
                    
                    return this.animateProgressBar(barElement, targetWidth, duration, {
                        ...options,
                        delay
                    });
                });
                
                // Wait for all animations to complete
                Promise.all(animationPromises)
                    .then((results) => {
                        if (typeof onAllComplete === 'function') {
                            onAllComplete(results);
                        }
                        resolve(results);
                    })
                    .catch(reject);
                    
            } catch (error) {
                console.error('AnimationController: Error in staggered animation:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Create a wave animation effect across multiple progress bars
     * @param {Array} barElements - Array of progress bar elements
     * @param {Array} targetWidths - Target widths for each bar
     * @param {Object} options - Wave animation options
     * @returns {Promise} Promise that resolves when wave completes
     */
    static waveAnimation(barElements, targetWidths, options = {}) {
        const {
            waveSpeed = 150,
            duration = 600,
            direction = 'forward' // 'forward' or 'reverse'
        } = options;
        
        const elements = direction === 'reverse' ? [...barElements].reverse() : barElements;
        const widths = direction === 'reverse' ? [...targetWidths].reverse() : targetWidths;
        
        return this.staggeredAnimation(elements, widths, waveSpeed, {
            duration,
            ...options
        });
    }
    
    /**
     * Pulse animation for a progress bar
     * @param {HTMLElement} barElement - Progress bar element
     * @param {number} pulseCount - Number of pulses
     * @param {number} pulseDuration - Duration of each pulse
     * @returns {Promise} Promise that resolves when pulses complete
     */
    static pulseAnimation(barElement, pulseCount = 3, pulseDuration = 300) {
        return new Promise((resolve, reject) => {
            try {
                if (!barElement || !(barElement instanceof HTMLElement)) {
                    reject(new Error('Invalid progress bar element'));
                    return;
                }
                
                let currentPulse = 0;
                const originalOpacity = barElement.style.opacity || '1';
                
                const pulse = () => {
                    if (currentPulse >= pulseCount) {
                        barElement.style.opacity = originalOpacity;
                        resolve(barElement);
                        return;
                    }
                    
                    // Fade out
                    barElement.style.transition = `opacity ${pulseDuration / 2}ms ease-in-out`;
                    barElement.style.opacity = '0.3';
                    
                    setTimeout(() => {
                        // Fade in
                        barElement.style.opacity = originalOpacity;
                        currentPulse++;
                        
                        setTimeout(pulse, pulseDuration / 2);
                    }, pulseDuration / 2);
                };
                
                pulse();
                
            } catch (error) {
                console.error('AnimationController: Error in pulse animation:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Bounce animation for progress bar
     * @param {HTMLElement} barElement - Progress bar element
     * @param {number} bounceHeight - Height of bounce in pixels
     * @param {number} duration - Animation duration
     * @returns {Promise} Promise that resolves when bounce completes
     */
    static bounceAnimation(barElement, bounceHeight = 5, duration = 400) {
        return new Promise((resolve, reject) => {
            try {
                if (!barElement || !(barElement instanceof HTMLElement)) {
                    reject(new Error('Invalid progress bar element'));
                    return;
                }
                
                const originalTransform = barElement.style.transform || '';
                
                // Apply bounce animation
                barElement.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
                barElement.style.transform = `${originalTransform} translateY(-${bounceHeight}px)`;
                
                setTimeout(() => {
                    barElement.style.transform = originalTransform;
                    
                    setTimeout(() => {
                        resolve(barElement);
                    }, duration);
                }, duration / 2);
                
            } catch (error) {
                console.error('AnimationController: Error in bounce animation:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Reset all animations on progress bars
     * @param {Array} barElements - Array of progress bar elements
     */
    static resetAnimations(barElements) {
        if (!Array.isArray(barElements)) {
            barElements = [barElements];
        }
        
        barElements.forEach(barElement => {
            if (barElement && barElement instanceof HTMLElement) {
                barElement.style.transition = 'none';
                barElement.style.transform = '';
                barElement.style.opacity = '';
                barElement.style.width = '0%';
            }
        });
    }
    
    /**
     * Create a smooth loading animation sequence
     * @param {Array} barConfigs - Array of {element, targetWidth} objects
     * @param {Object} options - Loading animation options
     * @returns {Promise} Promise that resolves when loading completes
     */
    static loadingSequence(barConfigs, options = {}) {
        const {
            staggerDelay = 150,
            duration = 800,
            showLoadingText = true,
            loadingContainer = null
        } = options;
        
        return new Promise((resolve, reject) => {
            try {
                // Show loading indicator if requested
                if (showLoadingText && loadingContainer) {
                    const loadingElement = document.createElement('div');
                    loadingElement.className = 'progress-loading-indicator';
                    loadingElement.textContent = 'Loading progress...';
                    loadingContainer.appendChild(loadingElement);
                }
                
                // Extract elements and widths
                const elements = barConfigs.map(config => config.element);
                const widths = barConfigs.map(config => config.targetWidth);
                
                // Start staggered animation
                this.staggeredAnimation(elements, widths, staggerDelay, {
                    duration,
                    onAllComplete: (results) => {
                        // Remove loading indicator
                        if (showLoadingText && loadingContainer) {
                            const loadingElement = loadingContainer.querySelector('.progress-loading-indicator');
                            if (loadingElement) {
                                loadingElement.remove();
                            }
                        }
                        resolve(results);
                    }
                }).catch(reject);
                
            } catch (error) {
                console.error('AnimationController: Error in loading sequence:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Get animation duration based on score difference
     * @param {number} currentScore - Current score
     * @param {number} targetScore - Target score
     * @param {number} baseDuration - Base animation duration
     * @returns {number} Calculated animation duration
     */
    static getAdaptiveDuration(currentScore, targetScore, baseDuration = 800) {
        const scoreDifference = Math.abs(targetScore - currentScore);
        const durationMultiplier = Math.max(0.3, Math.min(1.5, scoreDifference / 50));
        return Math.round(baseDuration * durationMultiplier);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
}

// Global access for browser environment
if (typeof window !== 'undefined') {
    window.AnimationController = AnimationController;
}

// Console log for debugging
console.log('🎬 AnimationController utility class loaded');