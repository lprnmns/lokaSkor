/**
 * LoadingManager - Comprehensive loading states and skeleton loaders
 * Handles consistent loading experiences, skeleton loaders, and smooth transitions
 */
class LoadingManager {
    constructor() {
        this.activeLoaders = new Map();
        this.loadingStates = new Map();
        
        this.initializeSkeletonStyles();
        this.createGlobalLoadingOverlay();
        
        console.log('LoadingManager initialized');
    }

    initializeSkeletonStyles() {
        if (!document.getElementById('skeleton-styles')) {
            const styles = document.createElement('style');
            styles.id = 'skeleton-styles';
            styles.textContent = `
                /* Skeleton Animation */
                @keyframes skeleton-loading {
                    0% {
                        background-position: -200px 0;
                    }
                    100% {
                        background-position: calc(200px + 100%) 0;
                    }
                }
                
                .skeleton {
                    background: linear-gradient(90deg, 
                        hsl(var(--muted)) 25%, 
                        hsl(var(--muted) / 0.5) 50%, 
                        hsl(var(--muted)) 75%
                    );
                    background-size: 200px 100%;
                    animation: skeleton-loading 1.5s infinite linear;
                    border-radius: var(--radius);
                }
                
                .skeleton-text {
                    height: 1rem;
                    margin-bottom: 0.5rem;
                }
                
                .skeleton-text.large {
                    height: 1.5rem;
                }
                
                .skeleton-text.small {
                    height: 0.75rem;
                }
                
                .skeleton-avatar {
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                }
                
                .skeleton-button {
                    height: 2.5rem;
                    width: 6rem;
                    border-radius: var(--radius);
                }
                
                .skeleton-card {
                    padding: 1rem;
                    border: 1px solid hsl(var(--border));
                    border-radius: var(--radius);
                    background: hsl(var(--card));
                }
                
                /* Loading Spinners */
                .loading-spinner {
                    width: 2rem;
                    height: 2rem;
                    border: 3px solid hsl(var(--muted));
                    border-top: 3px solid hsl(var(--primary));
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                .loading-spinner-sm {
                    width: 1rem;
                    height: 1rem;
                    border-width: 2px;
                }
                
                .loading-spinner-lg {
                    width: 3rem;
                    height: 3rem;
                    border-width: 4px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Loading Dots */
                .loading-dots {
                    display: inline-flex;
                    gap: 0.25rem;
                    align-items: center;
                }
                
                .loading-dot {
                    width: 0.5rem;
                    height: 0.5rem;
                    background: hsl(var(--primary));
                    border-radius: 50%;
                    animation: loading-dot 1.4s infinite ease-in-out;
                }
                
                .loading-dot:nth-child(1) { animation-delay: -0.32s; }
                .loading-dot:nth-child(2) { animation-delay: -0.16s; }
                .loading-dot:nth-child(3) { animation-delay: 0s; }
                
                @keyframes loading-dot {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                /* Progress Bar */
                .loading-progress {
                    width: 100%;
                    height: 0.25rem;
                    background: hsl(var(--muted));
                    border-radius: 0.125rem;
                    overflow: hidden;
                }
                
                .loading-progress-bar {
                    height: 100%;
                    background: hsl(var(--primary));
                    border-radius: 0.125rem;
                    transition: width 0.3s ease;
                }
                
                .loading-progress-indeterminate {
                    width: 30%;
                    animation: progress-indeterminate 2s infinite linear;
                }
                
                @keyframes progress-indeterminate {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(400%);
                    }
                }
                
                /* Loading Overlay */
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .loading-overlay.visible {
                    opacity: 1;
                    visibility: visible;
                }
                
                .loading-content {
                    background: hsl(var(--card));
                    border: 1px solid hsl(var(--border));
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .loading-overlay.visible .loading-content {
                    transform: scale(1);
                }
                
                .loading-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: hsl(var(--foreground));
                    margin-bottom: 0.5rem;
                }
                
                .loading-message {
                    font-size: 0.875rem;
                    color: hsl(var(--muted-foreground));
                    margin-bottom: 1.5rem;
                }
                
                /* Skeleton Layouts */
                .skeleton-result-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .skeleton-result-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border: 1px solid hsl(var(--border));
                    border-radius: var(--radius);
                }
                
                .skeleton-result-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .skeleton-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    padding: 1.5rem;
                }
                
                .skeleton-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .skeleton-input {
                    height: 2.5rem;
                    border-radius: var(--radius);
                }
                
                /* Map Loading */
                .map-loading {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: hsl(var(--muted) / 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .map-loading.visible {
                    opacity: 1;
                    visibility: visible;
                }
                
                .map-loading-content {
                    background: hsl(var(--card));
                    border: 1px solid hsl(var(--border));
                    border-radius: var(--radius);
                    padding: 1.5rem;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                /* Pulse Animation */
                .pulse {
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                
                /* Fade Transitions */
                .fade-enter {
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s ease;
                }
                
                .fade-enter-active {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .fade-exit {
                    opacity: 1;
                    transform: translateY(0);
                    transition: all 0.3s ease;
                }
                
                .fade-exit-active {
                    opacity: 0;
                    transform: translateY(-10px);
                }
            `;
            document.head.appendChild(styles);
        }
    }

    createGlobalLoadingOverlay() {
        if (!document.getElementById('global-loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'global-loading-overlay';
            overlay.className = 'loading-overlay';
            
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner loading-spinner-lg"></div>
                    <div class="loading-title">Yükleniyor</div>
                    <div class="loading-message">Lütfen bekleyin...</div>
                </div>
            `;
            
            document.body.appendChild(overlay);
        }
    }

    // Global loading overlay methods
    showGlobalLoading(title = 'Yükleniyor', message = 'Lütfen bekleyin...') {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            const titleElement = overlay.querySelector('.loading-title');
            const messageElement = overlay.querySelector('.loading-message');
            
            if (titleElement) titleElement.textContent = title;
            if (messageElement) messageElement.textContent = message;
            
            overlay.classList.add('visible');
        }
    }

    hideGlobalLoading() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    // Skeleton loader methods
    createSkeletonLoader(type, container, options = {}) {
        const loaderId = `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        let skeletonHTML = '';
        
        switch (type) {
            case 'result-list':
                skeletonHTML = this.createResultListSkeleton(options);
                break;
            case 'sidebar-form':
                skeletonHTML = this.createSidebarFormSkeleton(options);
                break;
            case 'map-loading':
                skeletonHTML = this.createMapLoadingSkeleton(options);
                break;
            case 'address-list':
                skeletonHTML = this.createAddressListSkeleton(options);
                break;
            case 'top-locations':
                skeletonHTML = this.createTopLocationsSkeleton(options);
                break;
            default:
                skeletonHTML = this.createGenericSkeleton(options);
        }
        
        const skeletonContainer = document.createElement('div');
        skeletonContainer.id = loaderId;
        skeletonContainer.className = 'skeleton-container fade-enter';
        skeletonContainer.innerHTML = skeletonHTML;
        
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (container) {
            container.appendChild(skeletonContainer);
            
            // Trigger fade-in animation
            setTimeout(() => {
                skeletonContainer.classList.add('fade-enter-active');
            }, 10);
        }
        
        this.activeLoaders.set(loaderId, {
            container: skeletonContainer,
            parentContainer: container,
            type
        });
        
        return loaderId;
    }

    createResultListSkeleton(options = {}) {
        const count = options.count || 3;
        const items = [];
        
        for (let i = 0; i < count; i++) {
            items.push(`
                <div class="skeleton-result-item">
                    <div class="skeleton skeleton-avatar"></div>
                    <div class="skeleton-result-content">
                        <div class="skeleton skeleton-text large" style="width: ${60 + Math.random() * 30}%"></div>
                        <div class="skeleton skeleton-text" style="width: ${40 + Math.random() * 40}%"></div>
                        <div class="skeleton skeleton-text small" style="width: ${30 + Math.random() * 50}%"></div>
                    </div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            `);
        }
        
        return `<div class="skeleton-result-list">${items.join('')}</div>`;
    }

    createSidebarFormSkeleton(options = {}) {
        return `
            <div class="skeleton-sidebar">
                <div class="skeleton skeleton-text large" style="width: 70%"></div>
                <div class="skeleton-form">
                    <div class="skeleton skeleton-input"></div>
                    <div class="skeleton skeleton-input"></div>
                    <div class="skeleton skeleton-input"></div>
                    <div class="skeleton skeleton-button" style="width: 100%"></div>
                </div>
                <div class="skeleton skeleton-text" style="width: 50%"></div>
                <div class="skeleton skeleton-text small" style="width: 80%"></div>
            </div>
        `;
    }

    createMapLoadingSkeleton(options = {}) {
        return `
            <div class="map-loading-content">
                <div class="loading-spinner"></div>
                <div style="margin-top: 1rem;">
                    <div class="loading-title">Harita Yükleniyor</div>
                    <div class="loading-message">${options.message || 'Konum verileri alınıyor...'}</div>
                </div>
            </div>
        `;
    }

    createAddressListSkeleton(options = {}) {
        const count = options.count || 2;
        const items = [];
        
        for (let i = 0; i < count; i++) {
            items.push(`
                <div class="skeleton-card">
                    <div class="skeleton skeleton-text" style="width: ${70 + Math.random() * 20}%"></div>
                    <div class="skeleton skeleton-text small" style="width: ${40 + Math.random() * 30}%"></div>
                </div>
            `);
        }
        
        return items.join('');
    }

    createTopLocationsSkeleton(options = {}) {
        const count = options.count || 5;
        const items = [];
        
        for (let i = 0; i < count; i++) {
            items.push(`
                <div class="skeleton-card">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="skeleton skeleton-avatar"></div>
                        <div style="flex: 1;">
                            <div class="skeleton skeleton-text" style="width: ${60 + Math.random() * 30}%"></div>
                            <div class="skeleton skeleton-text small" style="width: ${40 + Math.random() * 40}%"></div>
                        </div>
                    </div>
                </div>
            `);
        }
        
        return items.join('');
    }

    createGenericSkeleton(options = {}) {
        const lines = options.lines || 3;
        const items = [];
        
        for (let i = 0; i < lines; i++) {
            const width = 40 + Math.random() * 50;
            items.push(`<div class="skeleton skeleton-text" style="width: ${width}%"></div>`);
        }
        
        return items.join('');
    }

    // Remove skeleton loader
    removeSkeleton(loaderId) {
        const loader = this.activeLoaders.get(loaderId);
        if (loader && loader.container) {
            loader.container.classList.remove('fade-enter-active');
            loader.container.classList.add('fade-exit', 'fade-exit-active');
            
            setTimeout(() => {
                if (loader.container.parentNode) {
                    loader.container.parentNode.removeChild(loader.container);
                }
                this.activeLoaders.delete(loaderId);
            }, 300);
        }
    }

    // Progress bar methods
    createProgressBar(container, options = {}) {
        const progressId = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const progressHTML = `
            <div class="loading-progress">
                <div class="loading-progress-bar ${options.indeterminate ? 'loading-progress-indeterminate' : ''}" 
                     style="width: ${options.value || 0}%"></div>
            </div>
        `;
        
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (container) {
            const progressContainer = document.createElement('div');
            progressContainer.id = progressId;
            progressContainer.innerHTML = progressHTML;
            container.appendChild(progressContainer);
            
            this.activeLoaders.set(progressId, {
                container: progressContainer,
                parentContainer: container,
                type: 'progress'
            });
        }
        
        return progressId;
    }

    updateProgress(progressId, value) {
        const loader = this.activeLoaders.get(progressId);
        if (loader) {
            const progressBar = loader.container.querySelector('.loading-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
                progressBar.classList.remove('loading-progress-indeterminate');
            }
        }
    }

    // Loading state management
    setLoadingState(key, isLoading, options = {}) {
        if (isLoading) {
            this.loadingStates.set(key, {
                startTime: Date.now(),
                options
            });
            
            if (options.showGlobal) {
                this.showGlobalLoading(options.title, options.message);
            }
        } else {
            this.loadingStates.delete(key);
            
            if (options.showGlobal) {
                this.hideGlobalLoading();
            }
        }
    }

    isLoading(key) {
        return this.loadingStates.has(key);
    }

    getLoadingDuration(key) {
        const state = this.loadingStates.get(key);
        return state ? Date.now() - state.startTime : 0;
    }

    // Map loading methods
    showMapLoading(mapContainer, message = 'Harita yükleniyor...') {
        if (typeof mapContainer === 'string') {
            mapContainer = document.getElementById(mapContainer) || document.querySelector(mapContainer);
        }
        
        if (!mapContainer) return null;
        
        const existingLoader = mapContainer.querySelector('.map-loading');
        if (existingLoader) {
            existingLoader.classList.add('visible');
            return existingLoader;
        }
        
        const mapLoader = document.createElement('div');
        mapLoader.className = 'map-loading';
        mapLoader.innerHTML = this.createMapLoadingSkeleton({ message });
        
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(mapLoader);
        
        setTimeout(() => {
            mapLoader.classList.add('visible');
        }, 10);
        
        return mapLoader;
    }

    hideMapLoading(mapContainer) {
        if (typeof mapContainer === 'string') {
            mapContainer = document.getElementById(mapContainer) || document.querySelector(mapContainer);
        }
        
        if (!mapContainer) return;
        
        const mapLoader = mapContainer.querySelector('.map-loading');
        if (mapLoader) {
            mapLoader.classList.remove('visible');
            
            setTimeout(() => {
                if (mapLoader.parentNode) {
                    mapLoader.parentNode.removeChild(mapLoader);
                }
            }, 300);
        }
    }

    // Utility methods
    createLoadingSpinner(size = 'default') {
        const spinner = document.createElement('div');
        spinner.className = `loading-spinner ${size === 'small' ? 'loading-spinner-sm' : size === 'large' ? 'loading-spinner-lg' : ''}`;
        return spinner;
    }

    createLoadingDots() {
        const dots = document.createElement('div');
        dots.className = 'loading-dots';
        dots.innerHTML = `
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        `;
        return dots;
    }

    // Smooth content transitions
    async transitionContent(container, newContent, options = {}) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }
        
        if (!container) return;
        
        const duration = options.duration || 300;
        
        // Fade out current content
        container.style.transition = `opacity ${duration}ms ease`;
        container.style.opacity = '0';
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // Replace content
        if (typeof newContent === 'string') {
            container.innerHTML = newContent;
        } else if (newContent instanceof HTMLElement) {
            container.innerHTML = '';
            container.appendChild(newContent);
        }
        
        // Fade in new content
        container.style.opacity = '1';
        
        // Clean up transition
        setTimeout(() => {
            container.style.transition = '';
        }, duration);
    }

    // Clean up all loaders
    clearAllLoaders() {
        this.activeLoaders.forEach((loader, id) => {
            this.removeSkeleton(id);
        });
        
        this.activeLoaders.clear();
        this.loadingStates.clear();
        this.hideGlobalLoading();
    }

    // Get loading statistics
    getLoadingStats() {
        return {
            activeLoaders: this.activeLoaders.size,
            loadingStates: this.loadingStates.size,
            loaderTypes: Array.from(this.activeLoaders.values()).map(l => l.type)
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}