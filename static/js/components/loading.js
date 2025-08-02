/**
 * LocationIQ Modern UI - Loading Manager
 * Manages loading states and skeleton loaders
 */

class LoadingManager {
    constructor() {
        this.activeLoaders = new Map();
        this.loadingOverlay = null;
        this.init();
    }
    
    /**
     * Initialize loading manager
     */
    init() {
        this.createGlobalOverlay();
        this.setupLoadingStyles();
        console.log('LoadingManager initialized');
    }
    
    /**
     * Create global loading overlay
     */
    createGlobalOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'global-loading-overlay';
        this.loadingOverlay.className = 'global-loading-overlay hidden';
        this.loadingOverlay.innerHTML = `
            <div class="loading-backdrop"></div>
            <div class="loading-content">
                <div class="loading-spinner-large"></div>
                <div class="loading-text">Yükleniyor...</div>
                <div class="loading-subtext">Lütfen bekleyin</div>
            </div>
        `;
        document.body.appendChild(this.loadingOverlay);
    }
    
    /**
     * Setup loading styles dynamically
     */
    setupLoadingStyles() {
        if (document.getElementById('loading-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            /* Global Loading Overlay */
            .global-loading-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .global-loading-overlay:not(.hidden) {
                opacity: 1;
                visibility: visible;
            }
            
            .loading-backdrop {
                position: absolute;
                inset: 0;
                background: hsl(var(--background) / 0.8);
                backdrop-filter: blur(4px);
            }
            
            .loading-content {
                position: relative;
                text-align: center;
                z-index: 1;
            }
            
            .loading-spinner-large {
                width: 3rem;
                height: 3rem;
                border: 3px solid hsl(var(--muted));
                border-top: 3px solid hsl(var(--primary));
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            .loading-text {
                font-size: 1.125rem;
                font-weight: 600;
                color: hsl(var(--foreground));
                margin-bottom: 0.5rem;
            }
            
            .loading-subtext {
                font-size: 0.875rem;
                color: hsl(var(--muted-foreground));
            }
            
            /* Skeleton Loaders */
            .skeleton {
                background: linear-gradient(90deg, 
                    hsl(var(--muted)) 25%, 
                    hsl(var(--muted) / 0.5) 50%, 
                    hsl(var(--muted)) 75%
                );
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
                border-radius: var(--radius);
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-text {
                height: 1rem;
                margin-bottom: 0.5rem;
            }
            
            .skeleton-text-sm {
                height: 0.875rem;
                width: 60%;
            }
            
            .skeleton-text-lg {
                height: 1.25rem;
                width: 80%;
            }
            
            .skeleton-title {
                height: 1.5rem;
                width: 40%;
                margin-bottom: 1rem;
            }
            
            .skeleton-button {
                height: 2.5rem;
                width: 8rem;
                border-radius: var(--radius);
            }
            
            .skeleton-card {
                height: 8rem;
                border-radius: var(--radius);
                margin-bottom: 1rem;
            }
            
            .skeleton-circle {
                width: 3rem;
                height: 3rem;
                border-radius: 50%;
            }
            
            .skeleton-avatar {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
            }
            
            /* Loading States */
            .loading-state {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                text-align: center;
            }
            
            .loading-dots {
                display: flex;
                gap: 0.25rem;
                margin: 0 auto;
            }
            
            .loading-dot {
                width: 0.5rem;
                height: 0.5rem;
                background: hsl(var(--primary));
                border-radius: 50%;
                animation: loading-dots 1.4s ease-in-out infinite both;
            }
            
            .loading-dot:nth-child(1) { animation-delay: -0.32s; }
            .loading-dot:nth-child(2) { animation-delay: -0.16s; }
            .loading-dot:nth-child(3) { animation-delay: 0s; }
            
            @keyframes loading-dots {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            /* Inline Loading */
            .inline-loading {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: hsl(var(--muted-foreground));
            }
            
            .inline-spinner {
                width: 1rem;
                height: 1rem;
                border: 2px solid hsl(var(--muted));
                border-top: 2px solid hsl(var(--primary));
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            /* Progress Bar */
            .progress-loading {
                width: 100%;
                height: 0.25rem;
                background: hsl(var(--muted));
                border-radius: 9999px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-loading::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    transparent, 
                    hsl(var(--primary)), 
                    transparent
                );
                animation: progress-indeterminate 1.5s infinite linear;
            }
            
            @keyframes progress-indeterminate {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            /* Pulse Loading */
            .pulse-loading {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            /* Fade Transitions */
            .fade-transition {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .fade-transition.loading {
                opacity: 0.5;
                transform: scale(0.98);
            }
            
            /* Button Loading States */
            .btn-loading {
                position: relative;
                color: transparent !important;
                pointer-events: none;
            }
            
            .btn-loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 1rem;
                height: 1rem;
                margin: -0.5rem 0 0 -0.5rem;
                border: 2px solid currentColor;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            /* Utility Classes */
            .hidden { display: none !important; }
            .invisible { visibility: hidden; }
            .opacity-0 { opacity: 0; }
            .opacity-50 { opacity: 0.5; }
            .opacity-100 { opacity: 1; }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Show global loading overlay
     */
    showGlobalLoading(message = 'Yükleniyor...', subtext = 'Lütfen bekleyin') {
        if (this.loadingOverlay) {
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            const loadingSubtext = this.loadingOverlay.querySelector('.loading-subtext');
            
            if (loadingText) loadingText.textContent = message;
            if (loadingSubtext) loadingSubtext.textContent = subtext;
            
            this.loadingOverlay.classList.remove('hidden');
        }
    }
    
    /**
     * Hide global loading overlay
     */
    hideGlobalLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Show skeleton loader in container
     */
    showSkeleton(container, type = 'default') {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;
        
        const skeletonId = `skeleton-${Date.now()}`;
        this.activeLoaders.set(container, skeletonId);
        
        const skeletonHTML = this.generateSkeletonHTML(type);
        container.innerHTML = skeletonHTML;
        container.classList.add('loading-container');
    }
    
    /**
     * Generate skeleton HTML based on type
     */
    generateSkeletonHTML(type) {
        switch (type) {
            case 'location-list':
                return Array(3).fill(0).map(() => `
                    <div class="skeleton-card">
                        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem;">
                            <div class="skeleton-circle"></div>
                            <div style="flex: 1;">
                                <div class="skeleton-text" style="width: 70%;"></div>
                                <div class="skeleton-text-sm"></div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
            case 'results-list':
                return Array(5).fill(0).map((_, index) => `
                    <div class="skeleton-card" style="animation-delay: ${index * 0.1}s;">
                        <div style="padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <div class="skeleton-text" style="width: 60%;"></div>
                                <div class="skeleton-button" style="width: 4rem; height: 2rem;"></div>
                            </div>
                            <div class="skeleton-text-sm" style="margin-bottom: 0.5rem;"></div>
                            <div class="skeleton-text-sm" style="width: 40%;"></div>
                        </div>
                    </div>
                `).join('');
                
            case 'region-select':
                return `
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <div class="skeleton-text-sm" style="width: 3rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton-button" style="width: 100%; height: 2.5rem;"></div>
                        </div>
                        <div>
                            <div class="skeleton-text-sm" style="width: 3rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton-button" style="width: 100%; height: 2.5rem;"></div>
                        </div>
                        <div>
                            <div class="skeleton-text-sm" style="width: 4rem; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton-button" style="width: 100%; height: 2.5rem;"></div>
                        </div>
                    </div>
                `;
                
            case 'heatmap-stats':
                return `
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        ${Array(3).fill(0).map(() => `
                            <div style="text-align: center; padding: 1rem;">
                                <div class="skeleton-text-lg" style="margin: 0 auto 0.5rem;"></div>
                                <div class="skeleton-text-sm" style="margin: 0 auto;"></div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
            case 'top-locations':
                return Array(5).fill(0).map((_, index) => `
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid hsl(var(--border)); border-radius: var(--radius); margin-bottom: 0.5rem; animation-delay: ${index * 0.1}s;" class="skeleton">
                        <div class="skeleton-circle" style="width: 2.5rem; height: 2.5rem;"></div>
                        <div style="flex: 1;">
                            <div class="skeleton-text" style="width: 70%; margin-bottom: 0.5rem;"></div>
                            <div class="skeleton-text-sm" style="width: 50%;"></div>
                        </div>
                        <div style="display: flex; gap: 0.25rem;">
                            <div class="skeleton-button" style="width: 2rem; height: 2rem;"></div>
                            <div class="skeleton-button" style="width: 2rem; height: 2rem;"></div>
                        </div>
                    </div>
                `).join('');
                
            default:
                return `
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text" style="width: 80%;"></div>
                    <div class="skeleton-text-sm"></div>
                `;
        }
    }
    
    /**
     * Hide skeleton loader
     */
    hideSkeleton(container, content = '') {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;
        
        // Remove from active loaders
        this.activeLoaders.delete(container);
        
        // Fade out skeleton and fade in content
        container.style.transition = 'opacity 0.3s ease';
        container.style.opacity = '0';
        
        setTimeout(() => {
            container.innerHTML = content;
            container.classList.remove('loading-container');
            container.style.opacity = '1';
            
            // Remove transition after animation
            setTimeout(() => {
                container.style.transition = '';
            }, 300);
        }, 150);
    }
    
    /**
     * Show inline loading spinner
     */
    showInlineLoading(element, text = 'Yükleniyor...') {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        const loadingHTML = `
            <div class="inline-loading">
                <div class="inline-spinner"></div>
                <span>${text}</span>
            </div>
        `;
        
        element.innerHTML = loadingHTML;
    }
    
    /**
     * Show loading dots
     */
    showLoadingDots(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        `;
    }
    
    /**
     * Show progress bar loading
     */
    showProgressLoading(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;
        
        container.innerHTML = '<div class="progress-loading"></div>';
    }
    
    /**
     * Add loading state to button
     */
    setButtonLoading(button, isLoading = true) {
        if (typeof button === 'string') {
            button = document.getElementById(button) || document.querySelector(button);
        }
        
        if (!button) return;
        
        if (isLoading) {
            button.classList.add('btn-loading');
            button.disabled = true;
            
            // Store original text
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.textContent;
            }
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
            
            // Restore original text
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }
    
    /**
     * Add pulse loading effect
     */
    setPulseLoading(element, isLoading = true) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        if (isLoading) {
            element.classList.add('pulse-loading');
        } else {
            element.classList.remove('pulse-loading');
        }
    }
    
    /**
     * Add fade transition loading
     */
    setFadeLoading(element, isLoading = true) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        element.classList.add('fade-transition');
        
        if (isLoading) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    }
    
    /**
     * Show loading state with custom message
     */
    showLoadingState(container, message = 'Yükleniyor...', type = 'spinner') {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;
        
        let loadingHTML = '';
        
        switch (type) {
            case 'dots':
                loadingHTML = `
                    <div class="loading-state">
                        <div>
                            <div class="loading-dots" style="margin-bottom: 1rem;"></div>
                            <div class="loading-text">${message}</div>
                        </div>
                    </div>
                `;
                break;
                
            case 'progress':
                loadingHTML = `
                    <div class="loading-state">
                        <div style="width: 200px;">
                            <div class="progress-loading" style="margin-bottom: 1rem;"></div>
                            <div class="loading-text">${message}</div>
                        </div>
                    </div>
                `;
                break;
                
            default:
                loadingHTML = `
                    <div class="loading-state">
                        <div>
                            <div class="loading-spinner" style="margin-bottom: 1rem;"></div>
                            <div class="loading-text">${message}</div>
                        </div>
                    </div>
                `;
        }
        
        container.innerHTML = loadingHTML;
    }
    
    /**
     * Clear all active loaders
     */
    clearAllLoaders() {
        this.activeLoaders.forEach((loaderId, container) => {
            container.classList.remove('loading-container');
            container.innerHTML = '';
        });
        this.activeLoaders.clear();
        this.hideGlobalLoading();
    }
    
    /**
     * Get loading template for specific component
     */
    getLoadingTemplate(type, options = {}) {
        const templates = {
            'sidebar-locations': () => this.generateSkeletonHTML('location-list'),
            'sidebar-results': () => this.generateSkeletonHTML('results-list'),
            'sidebar-regions': () => this.generateSkeletonHTML('region-select'),
            'map-loading': () => `
                <div class="loading-state">
                    <div class="loading-spinner-large"></div>
                    <div class="loading-text">Harita yükleniyor...</div>
                </div>
            `,
            'analysis-loading': () => `
                <div class="loading-state">
                    <div class="loading-dots"></div>
                    <div class="loading-text">${options.message || 'Analiz yapılıyor...'}</div>
                    <div class="loading-subtext">Bu işlem birkaç saniye sürebilir</div>
                </div>
            `
        };
        
        return templates[type] ? templates[type]() : this.generateSkeletonHTML('default');
    }
    
    /**
     * Cleanup loading manager
     */
    cleanup() {
        this.clearAllLoaders();
        
        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
        
        const loadingStyles = document.getElementById('loading-styles');
        if (loadingStyles && loadingStyles.parentNode) {
            loadingStyles.parentNode.removeChild(loadingStyles);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}

// Make globally available
window.LoadingManager = LoadingManager;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.loadingManager) {
            window.loadingManager = new LoadingManager();
        }
    });
} else {
    if (!window.loadingManager) {
        window.loadingManager = new LoadingManager();
    }
}