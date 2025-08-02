/**
 * ColorCalculator - Utility class for converting scores to colors
 * Provides smooth red-to-green color interpolation for progress bars
 */
class ColorCalculator {
    /**
     * Convert a score (0-100) to an RGB color string
     * @param {number} score - Score value between 0-100
     * @returns {string} RGB color string like "rgb(255, 0, 0)"
     */
    static getColorForScore(score) {
        // Sanitize input score
        const sanitizedScore = this.sanitizeScore(score);
        
        // Calculate RGB values using smooth interpolation
        return this.interpolateColor(sanitizedScore);
    }
    
    /**
     * Sanitize and validate score input
     * @param {any} score - Input score value
     * @returns {number} Valid score between 0-100
     */
    static sanitizeScore(score) {
        // Handle invalid inputs
        if (typeof score !== 'number' || isNaN(score)) {
            console.warn('ColorCalculator: Invalid score provided, defaulting to 0:', score);
            return 0;
        }
        
        // Clamp to 0-100 range
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * Smooth red-to-green color interpolation
     * @param {number} score - Valid score between 0-100
     * @returns {string} RGB color string
     */
    static interpolateColor(score) {
        // Ensure score is in valid range
        score = Math.max(0, Math.min(100, score));
        
        let red, green, blue = 0;
        
        if (score <= 50) {
            // 0-50: Red to Yellow (red stays 255, green increases)
            red = 255;
            green = Math.round((score / 50) * 255);
        } else {
            // 51-100: Yellow to Green (red decreases, green stays 255)
            red = Math.round(255 - ((score - 50) / 50) * 255);
            green = 255;
        }
        
        return `rgb(${red}, ${green}, ${blue})`;
    }
    
    /**
     * Get color category for a score (for CSS classes)
     * @param {number} score - Score value between 0-100
     * @returns {string} Color category: 'low', 'medium', or 'high'
     */
    static getColorCategory(score) {
        const sanitizedScore = this.sanitizeScore(score);
        
        if (sanitizedScore <= 30) {
            return 'low';
        } else if (sanitizedScore <= 60) {
            return 'medium';
        } else {
            return 'high';
        }
    }
    
    /**
     * Get hex color for a score (alternative to RGB)
     * @param {number} score - Score value between 0-100
     * @returns {string} Hex color string like "#ff0000"
     */
    static getHexColorForScore(score) {
        const rgbColor = this.getColorForScore(score);
        return this.rgbToHex(rgbColor);
    }
    
    /**
     * Convert RGB string to hex
     * @param {string} rgb - RGB string like "rgb(255, 0, 0)"
     * @returns {string} Hex color string like "#ff0000"
     */
    static rgbToHex(rgb) {
        // Extract RGB values from string
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) {
            console.warn('ColorCalculator: Invalid RGB string:', rgb);
            return '#000000';
        }
        
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        // Convert to hex
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    /**
     * Get contrasting text color (black or white) for a given background color
     * @param {number} score - Score value between 0-100
     * @returns {string} Either '#000000' or '#ffffff'
     */
    static getContrastingTextColor(score) {
        const sanitizedScore = this.sanitizeScore(score);
        
        // For red-to-green spectrum, use black text for lighter colors (yellow-green)
        // and white text for darker colors (red)
        if (sanitizedScore > 40) {
            return '#000000'; // Black text for lighter backgrounds
        } else {
            return '#ffffff'; // White text for darker backgrounds
        }
    }
    
    /**
     * Test method to generate color samples
     * @returns {Array} Array of color samples for testing
     */
    static generateColorSamples() {
        const samples = [];
        for (let i = 0; i <= 100; i += 10) {
            samples.push({
                score: i,
                rgb: this.getColorForScore(i),
                hex: this.getHexColorForScore(i),
                category: this.getColorCategory(i),
                textColor: this.getContrastingTextColor(i)
            });
        }
        return samples;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorCalculator;
}

// Global access for browser environment
if (typeof window !== 'undefined') {
    window.ColorCalculator = ColorCalculator;
}

// Console log for debugging
console.log('🎨 ColorCalculator utility class loaded');