/**
 * BarRenderer - Utility class for rendering and managing progress bars
 * Handles DOM manipulation for creating and updating progress bars
 */
class BarRenderer {
    /**
     * Render a progress bar in the specified container
     * @param {string|HTMLElement} container - Container element or ID
     * @param {number} score - Score value between 0-100
     * @param {string} label - Label for the progress bar
     * @param {Object} options - Additional options
     * @returns {HTMLElement|null} Created progress bar element or null if failed
     */
    static renderProgressBar(container, score, label, options = {}) {
        try {
            // Get container element
            const containerElement = this.getContainerElement(container);
            if (!containerElement) {
                console.warn('BarRenderer: Container not found:', container);
                return null;
            }
            
            // Sanitize inputs
            const sanitizedScore = ColorCalculator.sanitizeScore(score);
            const sanitizedLabel = label || 'Progress';
            
            // Create progress bar HTML structure
            const progressBarHTML = this.createProgressBarHTML(sanitizedScore, sanitizedLabel, options);
            
            // Insert into container
            containerElement.innerHTML = progressBarHTML;
            
            // Get the created progress bar element
            const progressBarElement = containerElement.querySelector('.metric-progress-bar');
            
            // Apply initial styling
            if (progressBarElement) {
                this.applyProgressBarStyling(progressBarElement, sanitizedScore, options);
            }
            
            console.log(`✅ Progress bar rendered: ${sanitizedLabel} (${sanitizedScore}%)`);
            return progressBarElement;
            
        } catch (error) {
            console.error('BarRenderer: Error rendering progress bar:', error);
            return null;
        }
    }
    
    /**
     * Update an existing progress bar with new score
     * @param {string|HTMLElement} barElement - Progress bar element or selector
     * @param {number} newScore - New score value
     * @param {Object} options - Update options
     * @returns {boolean} Success status
     */
    static updateProgressBar(barElement, newScore, options = {}) {
        try {
            // Get bar element
            const element = this.getBarElement(barElement);
            if (!element) {
                console.warn('BarRenderer: Progress bar element not found:', barElement);
                return false;
            }
            
            // Sanitize new score
            const sanitizedScore = ColorCalculator.sanitizeScore(newScore);
            
            // Update styling
            this.applyProgressBarStyling(element, sanitizedScore, options);
            
            // Update score display
            const scoreDisplay = element.closest('.metric-progress-container')?.querySelector('.metric-score');
            if (scoreDisplay) {
                scoreDisplay.textContent = `${Math.round(sanitizedScore)}/100`;
            }
            
            console.log(`🔄 Progress bar updated: ${sanitizedScore}%`);
            return true;
            
        } catch (error) {
            console.error('BarRenderer: Error updating progress bar:', error);
            return false;
        }
    }
    
    /**
     * Create HTML structure for progress bar
     * @param {number} score - Sanitized score value
     * @param {string} label - Progress bar label
     * @param {Object} options - Rendering options
     * @returns {string} HTML string
     */
    static createProgressBarHTML(score, label, options = {}) {
        const {
            showScore = true,
            showLabel = true,
            className = '',
            id = ''
        } = options;
        
        const uniqueId = id || `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="metric-progress-container ${className}" data-score="${score}">
                ${showLabel || showScore ? `
                    <div class="metric-progress-header">
                        ${showLabel ? `<span class="metric-label">${label}</span>` : ''}
                        ${showScore ? `<span class="metric-score">${Math.round(score)}/100</span>` : ''}
                    </div>
                ` : ''}
                <div class="metric-progress-bar-wrapper">
                    <div class="metric-progress-bar" 
                         id="${uniqueId}"
                         role="progressbar"
                         aria-valuenow="${score}"
                         aria-valuemin="0"
                         aria-valuemax="100"
                         aria-label="${label} progress: ${score}%"
                         data-score="${score}">
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Apply styling to progress bar element
     * @param {HTMLElement} element - Progress bar element
     * @param {number} score - Score value
     * @param {Object} options - Styling options
     */
    static applyProgressBarStyling(element, score, options = {}) {
        if (!element) return;
        
        const {
            animate = true,
            duration = 800,
            delay = 0
        } = options;
        
        // Get color for score
        const color = ColorCalculator.getColorForScore(score);
        const category = ColorCalculator.getColorCategory(score);
        
        // Apply styles
        element.style.backgroundColor = color;
        element.style.width = `${score}%`;
        element.setAttribute('data-category', category);
        element.setAttribute('aria-valuenow', score);
        
        // Add CSS classes for category
        element.classList.remove('score-low', 'score-medium', 'score-high');
        element.classList.add(`score-${category}`);
        
        // Apply animation if requested
        if (animate) {
            this.animateProgressBar(element, score, duration, delay);
        }
    }
    
    /**
     * Animate progress bar to target width
     * @param {HTMLElement} element - Progress bar element
     * @param {number} targetScore - Target score percentage
     * @param {number} duration - Animation duration in ms
     * @param {number} delay - Animation delay in ms
     */
    static animateProgressBar(element, targetScore, duration = 800, delay = 0) {
        if (!element) return;
        
        // Set initial state
        element.style.width = '0%';
        element.style.transition = 'none';
        
        // Apply animation after delay
        setTimeout(() => {
            element.style.transition = `width ${duration}ms ease-out, background-color 300ms ease`;
            element.style.width = `${targetScore}%`;
        }, delay);
    }
    
    /**
     * Get container element from string or element
     * @param {string|HTMLElement} container - Container identifier
     * @returns {HTMLElement|null} Container element
     */
    static getContainerElement(container) {
        if (typeof container === 'string') {
            return document.getElementById(container) || document.querySelector(container);
        } else if (container instanceof HTMLElement) {
            return container;
        }
        return null;
    }
    
    /**
     * Get progress bar element from string or element
     * @param {string|HTMLElement} barElement - Bar element identifier
     * @returns {HTMLElement|null} Progress bar element
     */
    static getBarElement(barElement) {
        if (typeof barElement === 'string') {
            return document.getElementById(barElement) || document.querySelector(barElement);
        } else if (barElement instanceof HTMLElement) {
            return barElement;
        }
        return null;
    }
    
    /**
     * Create multiple progress bars with staggered animation
     * @param {Array} barConfigs - Array of bar configurations
     * @param {number} staggerDelay - Delay between each bar animation
     * @returns {Array} Array of created progress bar elements
     */
    static renderMultipleProgressBars(barConfigs, staggerDelay = 100) {
        const createdBars = [];
        
        barConfigs.forEach((config, index) => {
            const {
                container,
                score,
                label,
                options = {}
            } = config;
            
            // Add staggered delay
            const delayedOptions = {
                ...options,
                animate: true,
                delay: index * staggerDelay
            };
            
            const progressBar = this.renderProgressBar(container, score, label, delayedOptions);
            if (progressBar) {
                createdBars.push(progressBar);
            }
        });
        
        return createdBars;
    }
    
    /**
     * Remove progress bar from DOM
     * @param {string|HTMLElement} barElement - Progress bar element or selector
     * @returns {boolean} Success status
     */
    static removeProgressBar(barElement) {
        try {
            const element = this.getBarElement(barElement);
            if (!element) {
                console.warn('BarRenderer: Progress bar element not found for removal:', barElement);
                return false;
            }
            
            // Remove the entire container
            const container = element.closest('.metric-progress-container');
            if (container) {
                container.remove();
            } else {
                element.remove();
            }
            
            return true;
        } catch (error) {
            console.error('BarRenderer: Error removing progress bar:', error);
            return false;
        }
    }
    
    /**
     * Get all progress bars in the document
     * @returns {NodeList} All progress bar elements
     */
    static getAllProgressBars() {
        return document.querySelectorAll('.metric-progress-bar');
    }
    
    /**
     * Reset all progress bars to 0%
     * @param {boolean} animate - Whether to animate the reset
     */
    static resetAllProgressBars(animate = true) {
        const allBars = this.getAllProgressBars();
        allBars.forEach(bar => {
            if (animate) {
                bar.style.transition = 'width 300ms ease-out';
            } else {
                bar.style.transition = 'none';
            }
            bar.style.width = '0%';
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarRenderer;
}

// Global access for browser environment
if (typeof window !== 'undefined') {
    window.BarRenderer = BarRenderer;
}

// Console log for debugging
console.log('📊 BarRenderer utility class loaded');