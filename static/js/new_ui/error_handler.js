/**
 * LocationIQ Modern UI - Error Handler
 * Manages error display and user feedback
 */

class ErrorHandler {
    constructor(uiState) {
        this.uiState = uiState;
        this.errorContainer = null;
        this.errorTypes = {
            NETWORK_ERROR: 'network',
            API_ERROR: 'api',
            VALIDATION_ERROR: 'validation',
            MAP_ERROR: 'map',
            GENERIC_ERROR: 'generic'
        };
        
        this.init();
    }

    /**
     * Initialize error handler
     */
    init() {
        this.createErrorContainer();
        this.setupGlobalHandlers();
    }

    /**
     * Create error display container
     */
    createErrorContainer() {
        // Check if container already exists
        this.errorContainer = document.getElementById('error-container');
        
        if (!this.errorContainer) {
            this.errorContainer = document.createElement('div');
            this.errorContainer.id = 'error-container';
            this.errorContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(this.errorContainer);
        }
    }

    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handle(new Error(event.reason));
            event.preventDefault();
        });

        // Handle general JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            this.handle(event.error);
        });
        
        // Listen for language changes
        if (window.languageEvents) {
            window.languageEvents.subscribe((lang) => {
                // Update any existing error messages
                this.updateErrorMessages();
            });
        }
    }

    /**
     * Main error handling method
     */
    handle(error) {
        console.error('Handling error:', error);

        // Determine error type and create appropriate response
        const errorInfo = this.categorizeError(error);
        
        // Display error to user
        this.displayError(errorInfo);
        
        // Log error for debugging
        this.logError(error, errorInfo);
        
        // Add to state if uiState is available
        if (this.uiState) {
            this.uiState.addError(error);
        }

        // Track error for analytics
        this.trackError(error, errorInfo);

        return errorInfo;
    }
    
    /**
     * Track error for analytics
     */
    trackError(error, errorInfo) {
        // Send to analytics service if available
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track('Error Occurred', {
                errorType: errorInfo.type,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                severity: errorInfo.severity
            });
        }
        
        // Send to error reporting service
        if (window.Sentry && typeof window.Sentry.captureException === 'function') {
            window.Sentry.captureException(error, {
                tags: {
                    errorType: errorInfo.type,
                    severity: errorInfo.severity
                },
                extra: {
                    errorInfo: errorInfo,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    /**
     * Categorize error type
     */
    categorizeError(error) {
        let type = this.errorTypes.GENERIC_ERROR;
        let title = window.translationUtils ? window.translationUtils.t('errors.generic.title') : 'Bir Hata Oluştu';
        let message = window.translationUtils ? window.translationUtils.t('errors.generic.message') : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
        let actions = [];
        let severity = 'error';

        if (error instanceof NetworkError) {
            type = this.errorTypes.NETWORK_ERROR;
            title = window.translationUtils ? window.translationUtils.t('errors.network.title') : 'Bağlantı Hatası';
            message = window.translationUtils ? window.translationUtils.t('errors.network.message') : 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
            actions = [
                { text: window.translationUtils ? window.translationUtils.t('errors.actions.retry') : 'Tekrar Dene', action: () => window.location.reload() },
                { text: window.translationUtils ? window.translationUtils.t('errors.actions.close') : 'Kapat', action: null }
            ];
        } else if (error instanceof ApiError) {
            type = this.errorTypes.API_ERROR;
            title = window.translationUtils ? window.translationUtils.t('errors.api.title') : 'Sunucu Hatası';
            
            if (error.status >= 500) {
                message = window.translationUtils ? window.translationUtils.t('errors.api.serverError') : 'Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
            } else if (error.status === 404) {
                message = window.translationUtils ? window.translationUtils.t('errors.api.notFound') : 'İstenen kaynak bulunamadı.';
            } else if (error.status === 403) {
                message = window.translationUtils ? window.translationUtils.t('errors.api.forbidden') : 'Bu işlem için yetkiniz bulunmuyor.';
            } else if (error.status >= 400) {
                message = error.message || (window.translationUtils ? window.translationUtils.t('errors.api.requestError') : 'İstek işlenirken bir hata oluştu.');
            }
            
            actions = [
                { text: window.translationUtils ? window.translationUtils.t('errors.actions.retry') : 'Tekrar Dene', action: () => this.retryLastAction() },
                { text: window.translationUtils ? window.translationUtils.t('errors.actions.close') : 'Kapat', action: null }
            ];
        } else if (error instanceof ValidationError) {
            type = this.errorTypes.VALIDATION_ERROR;
            title = window.translationUtils ? window.translationUtils.t('errors.validation.title') : 'Geçersiz Veri';
            message = error.message || (window.translationUtils ? window.translationUtils.t('errors.validation.message') : 'Girilen veriler geçersiz.');
            severity = 'warning';
            
            if (error.missingFields && error.missingFields.length > 0) {
                message += ` ${window.translationUtils ? window.translationUtils.t('errors.validation.missingFields') : 'Eksik alanlar'}: ${error.missingFields.join(', ')}`;
            }
            
            actions = [{ text: window.translationUtils ? window.translationUtils.t('errors.actions.ok') : 'Tamam', action: null }];
        } else if (error.message && error.message.includes('map')) {
            type = this.errorTypes.MAP_ERROR;
            title = window.translationUtils ? window.translationUtils.t('errors.map.title') : 'Harita Hatası';
            message = window.translationUtils ? window.translationUtils.t('errors.map.message') : 'Harita yüklenirken bir sorun oluştu.';
            actions = [
                { text: window.translationUtils ? window.translationUtils.t('errors.actions.refreshMap') : 'Haritayı Yenile', action: () => this.refreshMap() },
                { text: window.translationUtils ? window.translationUtils.t('errors.actions.close') : 'Kapat', action: null }
            ];
        }

        return {
            type,
            title,
            message,
            actions,
            severity,
            timestamp: new Date().toISOString(),
            originalError: error
        };
    }

    /**
     * Display error to user
     */
    displayError(errorInfo) {
        // Create error notification element
        const errorElement = this.createErrorElement(errorInfo);
        
        // Add to container with animation
        this.errorContainer.appendChild(errorElement);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            errorElement.classList.add('notification-enter');
        });

        // Auto-remove after delay (except for critical errors)
        if (errorInfo.severity !== 'error') {
            setTimeout(() => {
                this.removeErrorElement(errorElement);
            }, 5000);
        }
    }

    /**
     * Create error display element
     */
    createErrorElement(errorInfo) {
        const element = document.createElement('div');
        element.className = `
            bg-white border-l-4 rounded-lg shadow-lg p-4 max-w-md
            ${this.getSeverityClasses(errorInfo.severity)}
            transform translate-x-full opacity-0 transition-all duration-300
        `;

        const iconHtml = this.getErrorIcon(errorInfo.severity);
        const actionsHtml = this.createActionsHtml(errorInfo.actions, element);

        element.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    ${iconHtml}
                </div>
                <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-gray-900">
                        ${errorInfo.title}
                    </h3>
                    <div class="mt-1 text-sm text-gray-600">
                        ${errorInfo.message}
                    </div>
                    ${actionsHtml}
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button class="close-btn inline-flex text-gray-400 hover:text-gray-600 focus:outline-none">
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add close functionality
        const closeBtn = element.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            this.removeErrorElement(element);
        });

        return element;
    }

    /**
     * Get severity-specific CSS classes
     */
    getSeverityClasses(severity) {
        switch (severity) {
            case 'error':
                return 'border-red-400 bg-red-50';
            case 'warning':
                return 'border-yellow-400 bg-yellow-50';
            case 'info':
                return 'border-blue-400 bg-blue-50';
            default:
                return 'border-gray-400 bg-gray-50';
        }
    }

    /**
     * Get error icon based on severity
     */
    getErrorIcon(severity) {
        const baseClasses = 'h-5 w-5';
        
        switch (severity) {
            case 'error':
                return `<svg class="${baseClasses} text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>`;
            case 'warning':
                return `<svg class="${baseClasses} text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>`;
            case 'info':
                return `<svg class="${baseClasses} text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>`;
            default:
                return `<svg class="${baseClasses} text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>`;
        }
    }

    /**
     * Create actions HTML
     */
    createActionsHtml(actions, element) {
        if (!actions || actions.length === 0) {
            return '';
        }

        const buttonsHtml = actions.map(action => {
            const isPrimary = action.text === (window.translationUtils ? window.translationUtils.t('errors.actions.retry') : 'Tekrar Dene') || action.text === (window.translationUtils ? window.translationUtils.t('errors.actions.ok') : 'Tamam');
            const buttonClass = isPrimary 
                ? 'btn btn-sm btn-primary mr-2' 
                : 'btn btn-sm btn-secondary mr-2';
            
            return `<button class="${buttonClass}" data-action="${action.text}">${action.text}</button>`;
        }).join('');

        // Add event listeners after element is created
        setTimeout(() => {
            actions.forEach(action => {
                const button = element.querySelector(`[data-action="${action.text}"]`);
                if (button) {
                    button.addEventListener('click', () => {
                        if (action.action) {
                            action.action();
                        }
                        this.removeErrorElement(element);
                    });
                }
            });
        }, 0);

        return `<div class="mt-3">${buttonsHtml}</div>`;
    }

    /**
     * Remove error element with animation
     */
    removeErrorElement(element) {
        element.classList.add('notification-exit');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }

    /**
     * Log error for debugging
     */
    logError(error, errorInfo) {
        const logData = {
            timestamp: errorInfo.timestamp,
            type: errorInfo.type,
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            state: this.uiState ? this.uiState.getState() : null
        };

        console.group('🚨 Error Details');
        console.error('Error:', error);
        console.table(logData);
        console.groupEnd();

        // In production, you might want to send this to a logging service
        // this.sendToLoggingService(logData);
    }

    /**
     * Retry last action (placeholder)
     */
    retryLastAction() {
        console.log('Retrying last action...');
        // This would be implemented based on the specific action that failed
        window.location.reload();
    }

    /**
     * Refresh map (placeholder)
     */
    refreshMap() {
        console.log('Refreshing map...');
        // This would be implemented to refresh the map component
        if (window.LocationIQApp && window.LocationIQApp.mapManager) {
            window.LocationIQApp.mapManager.refresh();
        }
    }

    /**
     * Clear all errors
     */
    clearAllErrors() {
        if (this.errorContainer) {
            this.errorContainer.innerHTML = '';
        }
        
        if (this.uiState) {
            this.uiState.clearErrors();
        }
    }

    /**
     * Show success message
     */
    showSuccess(title, message) {
        const successInfo = {
            type: 'success',
            title: title || (window.translationUtils ? window.translationUtils.t('errors.success.title') : 'Başarılı'),
            message: message || (window.translationUtils ? window.translationUtils.t('errors.success.message') : 'İşlem başarıyla tamamlandı.'),
            severity: 'info',
            actions: [{ text: window.translationUtils ? window.translationUtils.t('errors.actions.ok') : 'Tamam', action: null }],
            timestamp: new Date().toISOString()
        };

        this.displayError(successInfo);
    }

    /**
     * Show info message
     */
    showInfo(title, message) {
        const infoData = {
            type: 'info',
            title: title || (window.translationUtils ? window.translationUtils.t('errors.info.title') : 'Bilgi'),
            message: message || (window.translationUtils ? window.translationUtils.t('errors.info.message') : 'Bilgi mesajı.'),
            severity: 'info',
            actions: [{ text: window.translationUtils ? window.translationUtils.t('errors.actions.ok') : 'Tamam', action: null }],
            timestamp: new Date().toISOString()
        };

        this.displayError(infoData);
    }
    
    /**
     * Update error messages when language changes
     */
    updateErrorMessages() {
        // This would update any existing error messages when the language changes
        // For now, we'll just log that it was called
        console.log('Language changed, updating error messages...');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

// Make globally available
window.ErrorHandler = ErrorHandler;