/**
 * LokaSkor Modern UI - Error Handler
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
        let title = 'Bir Hata Oluştu';
        let message = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
        let actions = [];
        let severity = 'error';

        if (error instanceof NetworkError) {
            type = this.errorTypes.NETWORK_ERROR;
            title = 'Bağlantı Hatası';
            message = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
            actions = [
                { text: 'Tekrar Dene', action: () => window.location.reload() },
                { text: 'Kapat', action: null }
            ];
        } else if (error instanceof ApiError) {
            type = this.errorTypes.API_ERROR;
            title = 'Sunucu Hatası';
            
            if (error.status >= 500) {
                message = 'Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
            } else if (error.status === 404) {
                message = 'İstenen kaynak bulunamadı.';
            } else if (error.status === 403) {
                message = 'Bu işlem için yetkiniz bulunmuyor.';
            } else if (error.status >= 400) {
                message = error.message || 'İstek işlenirken bir hata oluştu.';
            }
            
            actions = [
                { text: 'Tekrar Dene', action: () => this.retryLastAction() },
                { text: 'Kapat', action: null }
            ];
        } else if (error instanceof ValidationError) {
            type = this.errorTypes.VALIDATION_ERROR;
            title = 'Geçersiz Veri';
            message = error.message || 'Girilen veriler geçersiz.';
            severity = 'warning';
            
            if (error.missingFields && error.missingFields.length > 0) {
                message += ` Eksik alanlar: ${error.missingFields.join(', ')}`;
            }
            
            actions = [{ text: 'Tamam', action: null }];
        } else if (error.message && error.message.includes('map')) {
            type = this.errorTypes.MAP_ERROR;
            title = 'Harita Hatası';
            message = 'Harita yüklenirken bir sorun oluştu.';
            actions = [
                { text: 'Haritayı Yenile', action: () => this.refreshMap() },
                { text: 'Kapat', action: null }
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
            const isPrimary = action.text === 'Tekrar Dene' || action.text === 'Tamam';
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
        if (window.LokaSkorApp && window.LokaSkorApp.mapManager) {
            window.LokaSkorApp.mapManager.refresh();
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
            title,
            message,
            severity: 'info',
            actions: [{ text: 'Tamam', action: null }],
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
            title,
            message,
            severity: 'info',
            actions: [{ text: 'Tamam', action: null }],
            timestamp: new Date().toISOString()
        };

        this.displayError(infoData);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}   
 /**
     * Create comprehensive notification system
     */
    createNotificationSystem() {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    /**
     * Show success notification
     */
    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }
    
    /**
     * Show warning notification
     */
    showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }
    
    /**
     * Show info notification
     */
    showInfo(message, duration = 3000) {
        this.showNotification(message, 'info', duration);
    }
    
    /**
     * Show error notification
     */
    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }
    
    /**
     * Show generic notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const container = this.createNotificationSystem();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} notification-enter`;
        
        const icons = {
            success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>`,
            error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
            info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${icons[type] || icons.info}
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentNode.parentNode.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('notification-exit');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, duration);
        }
        
        return notification;
    }
    
    /**
     * Show confirmation dialog
     */
    showConfirmation(message, onConfirm, onCancel = null) {
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal-overlay';
        
        modal.innerHTML = `
            <div class="confirmation-modal-content">
                <div class="confirmation-modal-header">
                    <div class="confirmation-icon">
                        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="confirmation-title">Onay</h3>
                </div>
                <div class="confirmation-modal-body">
                    <p class="confirmation-message">${message}</p>
                </div>
                <div class="confirmation-modal-actions">
                    <button class="btn btn-outline btn-sm" id="confirmCancel">İptal</button>
                    <button class="btn btn-primary btn-sm" id="confirmOk">Tamam</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('#confirmOk').addEventListener('click', () => {
            modal.remove();
            if (onConfirm) onConfirm();
        });
        
        modal.querySelector('#confirmCancel').addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }
        });
        
        // Add animation
        setTimeout(() => {
            modal.classList.add('confirmation-modal-visible');
        }, 10);
        
        return modal;
    }
    
    /**
     * Show loading feedback
     */
    showLoading(message = 'Yükleniyor...', cancellable = false) {
        const modal = document.createElement('div');
        modal.className = 'loading-modal-overlay';
        modal.id = 'loadingModal';
        
        modal.innerHTML = `
            <div class="loading-modal-content">
                <div class="loading-spinner-large"></div>
                <div class="loading-message">${message}</div>
                ${cancellable ? '<button class="btn btn-outline btn-sm" onclick="this.closest(\'.loading-modal-overlay\').remove()">İptal</button>' : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('loading-modal-visible');
        }, 10);
        
        return modal;
    }
    
    /**
     * Hide loading feedback
     */
    hideLoading() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.add('loading-modal-exit');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }
    
    /**
     * Show progress feedback
     */
    showProgress(message = 'İşleniyor...', initialProgress = 0) {
        const modal = document.createElement('div');
        modal.className = 'progress-modal-overlay';
        modal.id = 'progressModal';
        
        modal.innerHTML = `
            <div class="progress-modal-content">
                <div class="progress-message">${message}</div>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${initialProgress}%"></div>
                    </div>
                    <div class="progress-percentage">${initialProgress}%</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('progress-modal-visible');
        }, 10);
        
        return {
            modal,
            updateProgress: (progress, newMessage = null) => {
                const fill = modal.querySelector('.progress-fill');
                const percentage = modal.querySelector('.progress-percentage');
                const messageEl = modal.querySelector('.progress-message');
                
                if (fill) fill.style.width = `${progress}%`;
                if (percentage) percentage.textContent = `${Math.round(progress)}%`;
                if (newMessage && messageEl) messageEl.textContent = newMessage;
            },
            close: () => {
                modal.classList.add('progress-modal-exit');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        };
    }
    
    /**
     * Show form validation errors
     */
    showValidationErrors(errors) {
        // Clear existing validation errors
        document.querySelectorAll('.validation-error').forEach(error => {
            error.remove();
        });
        
        document.querySelectorAll('.input-error').forEach(input => {
            input.classList.remove('input-error');
        });
        
        // Show new validation errors
        Object.keys(errors).forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field) {
                field.classList.add('input-error');
                
                const errorMessage = document.createElement('div');
                errorMessage.className = 'validation-error';
                errorMessage.textContent = errors[fieldName];
                
                // Insert error message after the field
                field.parentNode.insertBefore(errorMessage, field.nextSibling);
                
                // Remove error on input
                field.addEventListener('input', () => {
                    field.classList.remove('input-error');
                    errorMessage.remove();
                }, { once: true });
            }
        });
        
        // Show summary notification
        const errorCount = Object.keys(errors).length;
        this.showError(`${errorCount} alanda hata bulundu. Lütfen düzeltin.`);
    }
    
    /**
     * Show network status
     */
    showNetworkStatus(isOnline) {
        // Remove existing network status
        const existing = document.getElementById('networkStatus');
        if (existing) {
            existing.remove();
        }
        
        if (!isOnline) {
            const status = document.createElement('div');
            status.id = 'networkStatus';
            status.className = 'network-status offline';
            status.innerHTML = `
                <div class="network-status-content">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364"/>
                    </svg>
                    <span>Bağlantı yok</span>
                </div>
            `;
            
            document.body.appendChild(status);
            
            setTimeout(() => {
                status.classList.add('network-status-visible');
            }, 10);
        }
    }
    
    /**
     * Retry last action
     */
    retryLastAction() {
        if (this.lastAction) {
            try {
                this.lastAction();
            } catch (error) {
                this.handle(error);
            }
        }
    }
    
    /**
     * Set last action for retry functionality
     */
    setLastAction(action) {
        this.lastAction = action;
    }
    
    /**
     * Refresh map
     */
    refreshMap() {
        if (window.mapManager && window.mapManager.reload) {
            window.mapManager.reload();
        } else {
            window.location.reload();
        }
    }
    
    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
        
        // Remove modals
        document.querySelectorAll('.confirmation-modal-overlay, .loading-modal-overlay, .progress-modal-overlay').forEach(modal => {
            modal.remove();
        });
    }
    
    /**
     * Get error statistics
     */
    getErrorStats() {
        if (!this.uiState) return null;
        
        const errors = this.uiState.getState().errors || [];
        const stats = {
            total: errors.length,
            byType: {},
            recent: errors.filter(error => 
                Date.now() - new Date(error.timestamp).getTime() < 3600000 // Last hour
            ).length
        };
        
        errors.forEach(error => {
            const type = error.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.showNetworkStatus(true);
            this.showSuccess('Bağlantı yeniden kuruldu');
        });
        
        window.addEventListener('offline', () => {
            this.showNetworkStatus(false);
            this.showWarning('İnternet bağlantısı kesildi');
        });
    }
    
    /**
     * Cleanup error handler
     */
    cleanup() {
        this.clearAllNotifications();
        
        // Remove event listeners
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
        window.removeEventListener('error', this.handleError);
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        
        // Remove containers
        const containers = [
            'error-container',
            'notification-container',
            'networkStatus'
        ];
        
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

// Make globally available
window.ErrorHandler = ErrorHandler;