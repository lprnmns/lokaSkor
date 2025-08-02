/**
 * LocationIQ Modern UI - Main Application Controller
 * Manages the overall application state and coordinates between components
 */

// Custom Error Classes
class ApiError extends Error {
    constructor(message, responseData = null, status = null) {
        super(message);
        this.name = 'ApiError';
        this.responseData = responseData;
        this.status = status;
        this.timestamp = new Date().toISOString();
    }
}

class ValidationError extends Error {
    constructor(message, missingFields = []) {
        super(message);
        this.name = 'ValidationError';
        this.missingFields = missingFields;
        this.timestamp = new Date().toISOString();
    }
}

class NetworkError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Central State Management System
 */
class UIState {
    constructor() {
        this.state = {
            currentMode: null, // 'comparison' or 'region'
            selectedBusinessType: null,
            currentPage: 'landing', // 'landing', 'business-selection', 'mode-selection', 'analysis'
            analysisResults: null,
            loadingStates: {
                analysis: false,
                map: false,
                results: false,
                businessTypes: false
            },
            errors: [],
            notifications: []
        };
        
        this.observers = new Map();
        this.history = [];
        this.maxHistorySize = 10;
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(event, callback) {
        if (!this.observers.has(event)) {
            this.observers.set(event, []);
        }
        this.observers.get(event).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.observers.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }
    
    /**
     * Notify observers of state changes
     */
    notify(event, data) {
        const callbacks = this.observers.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data, this.state);
                } catch (error) {
                    console.error(`Error in state observer for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Update state and notify observers
     */
    setState(updates) {
        // Save current state to history
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        
        const previousState = { ...this.state };
        
        // Apply updates
        if (typeof updates === 'function') {
            this.state = { ...this.state, ...updates(this.state) };
        } else {
            this.state = { ...this.state, ...updates };
        }
        
        // Notify observers of specific changes
        Object.keys(updates).forEach(key => {
            if (previousState[key] !== this.state[key]) {
                this.notify(`${key}Changed`, {
                    previous: previousState[key],
                    current: this.state[key]
                });
            }
        });
        
        // Notify general state change
        this.notify('stateChanged', {
            previous: previousState,
            current: this.state
        });
    }
    
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Set current mode
     */
    setMode(mode) {
        this.setState({ currentMode: mode });
    }
    
    /**
     * Set business type
     */
    setBusinessType(type) {
        this.setState({ selectedBusinessType: type });
    }
    
    /**
     * Set current page
     */
    setPage(page) {
        this.setState({ currentPage: page });
    }
    
    /**
     * Set loading state
     */
    setLoading(key, isLoading) {
        this.setState({
            loadingStates: {
                ...this.state.loadingStates,
                [key]: isLoading
            }
        });
    }
    
    /**
     * Add error
     */
    addError(error) {
        const errorObj = {
            id: Date.now(),
            message: error.message,
            type: error.name || 'Error',
            timestamp: new Date().toISOString(),
            details: error.responseData || null
        };
        
        this.setState({
            errors: [...this.state.errors, errorObj]
        });
        
        return errorObj.id;
    }
    
    /**
     * Remove error
     */
    removeError(errorId) {
        this.setState({
            errors: this.state.errors.filter(error => error.id !== errorId)
        });
    }
    
    /**
     * Clear all errors
     */
    clearErrors() {
        this.setState({ errors: [] });
    }
    
    /**
     * Add notification
     */
    addNotification(notification) {
        const notificationObj = {
            id: Date.now(),
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            timestamp: new Date().toISOString(),
            autoClose: notification.autoClose !== false,
            duration: notification.duration || 5000
        };
        
        this.setState({
            notifications: [...this.state.notifications, notificationObj]
        });
        
        // Auto-remove notification if specified
        if (notificationObj.autoClose) {
            setTimeout(() => {
                this.removeNotification(notificationObj.id);
            }, notificationObj.duration);
        }
        
        return notificationObj.id;
    }
    
    /**
     * Remove notification
     */
    removeNotification(notificationId) {
        this.setState({
            notifications: this.state.notifications.filter(
                notification => notification.id !== notificationId
            )
        });
    }
    
    /**
     * Go back to previous state
     */
    goBack() {
        if (this.history.length > 0) {
            const previousState = this.history.pop();
            this.state = previousState;
            this.notify('stateChanged', {
                previous: null,
                current: this.state
            });
        }
    }
    
    /**
     * Reset state to initial values
     */
    reset() {
        this.state = {
            currentMode: null,
            selectedBusinessType: null,
            currentPage: 'landing',
            analysisResults: null,
            loadingStates: {
                analysis: false,
                map: false,
                results: false,
                businessTypes: false
            },
            errors: [],
            notifications: []
        };
        this.history = [];
        this.notify('stateReset', this.state);
    }
}

/**
 * Main Application Controller
 */
class LocationIQApp {
    constructor() {
        this.state = new UIState();
        this.apiClient = null;
        this.errorHandler = null;
        this.currentController = null;
        this.initialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.navigate = this.navigate.bind(this);
        this.handleError = this.handleError.bind(this);
    }
    
    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            console.warn('LocationIQ App already initialized');
            return;
        }
        
        try {
            console.log('Initializing LocationIQ Modern UI...');
            
            // Initialize API client and error handler
            this.apiClient = new ApiClient();
            this.errorHandler = new ErrorHandler(this.state);
            
            // Initialize translation utilities
            if (window.translationUtils) {
                await window.translationUtils.init();
            }
            
            // Initialize animation systems
            this.animationPerformance = new AnimationPerformance();
            this.animationManager = new AnimationManager();
            this.microInteractions = new MicroInteractions();
            
            // Set up global error handling
            this.setupGlobalErrorHandling();
            
            // Set up state observers
            this.setupStateObservers();
            
            // Set up animation performance monitoring
            this.setupAnimationPerformanceMonitoring();
            
            // Initialize based on current page
            await this.initializePage();
            
            this.initialized = true;
            console.log('LocationIQ Modern UI initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize LocationIQ App:', error);
            this.handleError(error);
        }
    }
    
    /**
     * Set up global error handling
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError(new Error(event.message));
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(new Error(event.reason));
        });
        
        // Listen for language changes
        if (window.languageEvents) {
            window.languageEvents.subscribe((lang) => {
                // Update UI when language changes
                this.updateUIText();
            });
        }
    }
    
    /**
     * Set up state observers
     */
    setupStateObservers() {
        // Listen for page changes
        this.state.subscribe('currentPageChanged', ({ current }) => {
            this.handlePageChange(current);
        });
        
        // Listen for mode changes
        this.state.subscribe('currentModeChanged', ({ current }) => {
            this.handleModeChange(current);
        });
        
        // Listen for errors
        this.state.subscribe('errorsChanged', ({ current }) => {
            if (current.length > 0) {
                const latestError = current[current.length - 1];
                this.errorHandler.displayError(latestError);
            }
        });
        
        // Listen for notifications
        this.state.subscribe('notificationsChanged', ({ current }) => {
            if (current.length > 0) {
                const latestNotification = current[current.length - 1];
                this.displayNotification(latestNotification);
            }
        });
    }
    
    /**
     * Set up animation performance monitoring
     */
    setupAnimationPerformanceMonitoring() {
        // Listen for performance mode changes
        window.addEventListener('animationPerformanceChange', (event) => {
            const { mode, reducedMotion, frameRate } = event.detail;
            
            console.log('Animation performance changed:', {
                mode,
                reducedMotion,
                frameRate
            });
            
            // Update UI based on performance mode
            this.updateUIForPerformanceMode(mode);
            
            // Notify other components
            this.state.notify('animationPerformanceChanged', event.detail);
        });
        
        // Monitor animation queue size
        setInterval(() => {
            if (this.animationManager && this.animationManager.animationQueue) {
                const queueSize = this.animationManager.animationQueue.length;
                if (queueSize > 10) {
                    console.warn('Animation queue is getting large:', queueSize);
                    // Could implement queue management here
                }
            }
        }, 5000);
    }
    
    /**
     * Update UI based on performance mode
     */
    updateUIForPerformanceMode(mode) {
        const body = document.body;
        
        // Remove existing performance classes
        body.classList.remove('performance-minimal', 'performance-low', 'performance-medium', 'performance-high');
        
        // Add current performance class
        body.classList.add(`performance-${mode}`);
        
        // Update CSS custom properties for performance
        const root = document.documentElement;
        
        switch (mode) {
            case 'minimal':
                root.style.setProperty('--animation-duration-fast', '0.01ms');
                root.style.setProperty('--animation-duration-normal', '0.01ms');
                root.style.setProperty('--animation-duration-slow', '0.01ms');
                break;
            case 'low':
                root.style.setProperty('--animation-duration-fast', '75ms');
                root.style.setProperty('--animation-duration-normal', '150ms');
                root.style.setProperty('--animation-duration-slow', '250ms');
                break;
            case 'medium':
                root.style.setProperty('--animation-duration-fast', '120ms');
                root.style.setProperty('--animation-duration-normal', '240ms');
                root.style.setProperty('--animation-duration-slow', '400ms');
                break;
            case 'high':
                root.style.setProperty('--animation-duration-fast', '150ms');
                root.style.setProperty('--animation-duration-normal', '300ms');
                root.style.setProperty('--animation-duration-slow', '500ms');
                break;
        }
    }
    
    /**
     * Update UI text when language changes
     */
    updateUIText() {
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = {};
            
            // Check for parameters
            const paramAttrs = element.getAttribute('data-i18n-params');
            if (paramAttrs) {
                try {
                    Object.assign(params, JSON.parse(paramAttrs));
                } catch (e) {
                    console.error('Error parsing translation parameters:', e);
                }
            }
            
            if (window.translationUtils) {
                element.textContent = window.translationUtils.t(key, params);
            }
        });
    }
    
    /**
     * Initialize page based on current URL or state
     */
    async initializePage() {
        const path = window.location.pathname;
        const currentPage = this.determinePageFromPath(path);
        this.state.setPage(currentPage);
    }
    
    /**
     * Determine page from URL path
     */
    determinePageFromPath(path) {
        if (path.includes('business-selection')) return 'business-selection';
        if (path.includes('mode-selection')) return 'mode-selection';
        if (path.includes('analysis')) return 'analysis';
        return 'landing';
    }
    
    /**
     * Handle page changes
     */
    async handlePageChange(newPage) {
        try {
            // Clean up current controller
            if (this.currentController && this.currentController.cleanup) {
                await this.currentController.cleanup();
            }
            
            // Initialize new page controller
            switch (newPage) {
                case 'business-selection':
                    // Will be implemented in later tasks
                    break;
                case 'mode-selection':
                    // Will be implemented in later tasks
                    break;
                case 'analysis':
                    // Will be implemented in later tasks
                    break;
                default:
                    // Landing page - no special controller needed
                    break;
            }
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    /**
     * Handle mode changes
     */
    handleModeChange(newMode) {
        console.log(`Mode changed to: ${newMode}`);
        // Mode-specific logic will be implemented in later tasks
    }
    
    /**
     * Navigate to a new page
     */
    navigate(page, data = {}) {
        try {
            // Update state
            this.state.setPage(page);
            
            // Update URL if needed (without page reload)
            const newUrl = this.getUrlForPage(page);
            if (newUrl !== window.location.pathname) {
                window.history.pushState({ page, data }, '', newUrl);
            }
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    /**
     * Get URL for page
     */
    getUrlForPage(page) {
        const baseUrl = window.location.origin;
        switch (page) {
            case 'business-selection':
                return `${baseUrl}/business-selection`;
            case 'mode-selection':
                return `${baseUrl}/mode-selection`;
            case 'analysis':
                return `${baseUrl}/analysis`;
            default:
                return `${baseUrl}/`;
        }
    }
    
    /**
     * Handle errors
     */
    handleError(error) {
        console.error('Application error:', error);
        
        // Add error to state
        const errorId = this.state.addError(error);
        
        // Use error handler if available
        if (this.errorHandler) {
            this.errorHandler.handle(error);
        }
        
        return errorId;
    }
    
    /**
     * Display notification
     */
    displayNotification(notification) {
        // This will be implemented with the notification component
        console.log('Notification:', notification);
    }
    
    /**
     * Get API client
     */
    getApiClient() {
        return this.apiClient;
    }
    
    /**
     * Get current state
     */
    getState() {
        return this.state.getState();
    }
    
    /**
     * Cleanup application
     */
    async cleanup() {
        if (this.currentController && this.currentController.cleanup) {
            await this.currentController.cleanup();
        }
        
        // Cleanup animation systems
        if (this.animationManager && this.animationManager.cleanup) {
            this.animationManager.cleanup();
        }
        
        if (this.animationPerformance && this.animationPerformance.cleanup) {
            this.animationPerformance.cleanup();
        }
        
        if (this.microInteractions && this.microInteractions.cleanup) {
            this.microInteractions.cleanup();
        }
        
        this.state.reset();
        this.initialized = false;
    }
}

// Global app instance
let app = null;

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new LocationIQApp();
        await app.init();
        
        // Make app globally available for debugging
        window.LocationIQApp = app;
        
    } catch (error) {
        console.error('Failed to start LocationIQ App:', error);
    }
});

/**
 * Handle browser back/forward buttons
 */
window.addEventListener('popstate', (event) => {
    if (app && event.state) {
        app.navigate(event.state.page, event.state.data);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LocationIQApp,
        UIState,
        ApiError,
        ValidationError,
        NetworkError
    };
}