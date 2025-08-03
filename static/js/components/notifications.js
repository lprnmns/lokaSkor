/**
 * LokaSkor Modern UI - Notification System
 * Manages user feedback and notifications
 */

class NotificationManager {
    constructor() {
        this.notifications = new Map();
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        this.init();
    }
    
    /**
     * Initialize notification manager
     */
    init() {
        this.createContainer();
        this.setupStyles();
        console.log('NotificationManager initialized');
    }
    
    /**
     * Create notification container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }
    
    /**
     * Setup notification styles
     */
    setupStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            /* Notification Container */
            .notification-container {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                max-width: 400px;
                pointer-events: none;
            }
            
            /* Notification Base */
            .notification {
                background: hsl(var(--card));
                border: 1px solid hsl(var(--border));
                border-radius: var(--radius);
                box-shadow: var(--shadow-lg);
                padding: 1rem;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            /* Notification Types */
            .notification.success {
                border-left: 4px solid hsl(var(--chart-2));
            }
            
            .notification.error {
                border-left: 4px solid hsl(var(--destructive));
            }
            
            .notification.warning {
                border-left: 4px solid hsl(var(--chart-4));
            }
            
            .notification.info {
                border-left: 4px solid hsl(var(--primary));
            }
            
            /* Notification Content */
            .notification-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .notification-icon {
                flex-shrink: 0;
                width: 1.25rem;
                height: 1.25rem;
                margin-top: 0.125rem;
            }
            
            .notification.success .notification-icon {
                color: hsl(var(--chart-2));
            }
            
            .notification.error .notification-icon {
                color: hsl(var(--destructive));
            }
            
            .notification.warning .notification-icon {
                color: hsl(var(--chart-4));
            }
            
            .notification.info .notification-icon {
                color: hsl(var(--primary));
            }
            
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: hsl(var(--foreground));
                margin: 0 0 0.25rem 0;
                line-height: 1.4;
            }
            
            .notification-message {
                font-size: 0.8125rem;
                color: hsl(var(--muted-foreground));
                line-height: 1.4;
                margin: 0;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: hsl(var(--muted-foreground));
                cursor: pointer;
                padding: 0.25rem;
                border-radius: var(--radius);
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: hsl(var(--accent));
                color: hsl(var(--foreground));
            }
            
            /* Notification Actions */
            .notification-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.75rem;
                justify-content: flex-end;
            }
            
            .notification-action {
                padding: 0.25rem 0.75rem;
                font-size: 0.75rem;
                font-weight: 500;
                border-radius: var(--radius);
                border: 1px solid hsl(var(--border));
                background: hsl(var(--background));
                color: hsl(var(--foreground));
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .notification-action:hover {
                background: hsl(var(--accent));
                border-color: hsl(var(--primary));
            }
            
            .notification-action.primary {
                background: hsl(var(--primary));
                color: hsl(var(--primary-foreground));
                border-color: hsl(var(--primary));
            }
            
            .notification-action.primary:hover {
                background: hsl(var(--primary) / 0.9);
            }
            
            /* Progress Bar */
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: hsl(var(--primary));
                transition: width linear;
                border-radius: 0 0 var(--radius) var(--radius);
            }
            
            .notification.success .notification-progress {
                background: hsl(var(--chart-2));
            }
            
            .notification.error .notification-progress {
                background: hsl(var(--destructive));
            }
            
            .notification.warning .notification-progress {
                background: hsl(var(--chart-4));
            }
            
            /* Loading Notification */
            .notification-loading {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
            }
            
            .notification-spinner {
                width: 1rem;
                height: 1rem;
                border: 2px solid hsl(var(--muted));
                border-top: 2px solid hsl(var(--primary));
                border-radius: 50%;
                animation: spin 1s linear infinite;
                flex-shrink: 0;
            }
            
            /* Responsive Design */
            @media (max-width: 640px) {
                .notification-container {
                    top: 0.5rem;
                    right: 0.5rem;
                    left: 0.5rem;
                    max-width: none;
                }
                
                .notification {
                    transform: translateY(-100%);
                }
                
                .notification.show {
                    transform: translateY(0);
                }
                
                .notification.hide {
                    transform: translateY(-100%);
                }
            }
            
            /* Animations */
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Show notification
     */
    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.defaultDuration,
            actions = [],
            persistent = false,
            id = null
        } = options;
        
        // Remove existing notification with same ID
        if (id && this.notifications.has(id)) {
            this.hide(id);
        }
        
        // Limit number of notifications
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }
        
        const notificationId = id || `notification-${Date.now()}`;
        const notification = this.createNotification({
            id: notificationId,
            type,
            title,
            message,
            actions,
            persistent,
            duration
        });
        
        this.container.appendChild(notification);
        this.notifications.set(notificationId, {
            element: notification,
            timer: null,
            duration,
            persistent
        });
        
        // Show notification with animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto-hide if not persistent
        if (!persistent && duration > 0) {
            this.setAutoHide(notificationId, duration);
        }
        
        return notificationId;
    }
    
    /**
     * Create notification element
     */
    createNotification(options) {
        const { id, type, title, message, actions, persistent, duration } = options;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;
        
        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        notification.innerHTML = `
            <div class="notification-header">
                <i data-lucide="${iconMap[type]}" class="notification-icon"></i>
                <div class="notification-content">
                    ${title ? `<h4 class="notification-title">${title}</h4>` : ''}
                    ${message ? `<p class="notification-message">${message}</p>` : ''}
                </div>
                <button class="notification-close" onclick="notificationManager.hide('${id}')">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            ${actions.length > 0 ? this.createActionsHTML(actions, id) : ''}
            ${!persistent && duration > 0 ? `<div class="notification-progress" style="width: 100%; transition-duration: ${duration}ms;"></div>` : ''}
        `;
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return notification;
    }
    
    /**
     * Create actions HTML
     */
    createActionsHTML(actions, notificationId) {
        const actionsHTML = actions.map(action => {
            const className = action.primary ? 'notification-action primary' : 'notification-action';
            const onclick = action.action ? `onclick="(${action.action.toString()})(); notificationManager.hide('${notificationId}');"` : `onclick="notificationManager.hide('${notificationId}');"`;
            
            return `<button class="${className}" ${onclick}>${action.text}</button>`;
        }).join('');
        
        return `<div class="notification-actions">${actionsHTML}</div>`;
    }
    
    /**
     * Set auto-hide timer
     */
    setAutoHide(id, duration) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;
        
        // Start progress bar animation
        const progressBar = notificationData.element.querySelector('.notification-progress');
        if (progressBar) {
            requestAnimationFrame(() => {
                progressBar.style.width = '0%';
            });
        }
        
        // Set hide timer
        notificationData.timer = setTimeout(() => {
            this.hide(id);
        }, duration);
    }
    
    /**
     * Hide notification
     */
    hide(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;
        
        const { element, timer } = notificationData;
        
        // Clear timer
        if (timer) {
            clearTimeout(timer);
        }
        
        // Hide with animation
        element.classList.remove('show');
        element.classList.add('hide');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }
    
    /**
     * Show success notification
     */
    success(title, message, options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }
    
    /**
     * Show error notification
     */
    error(title, message, options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 0, // Don't auto-hide errors
            ...options
        });
    }
    
    /**
     * Show warning notification
     */
    warning(title, message, options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            duration: 7000, // Longer duration for warnings
            ...options
        });
    }
    
    /**
     * Show info notification
     */
    info(title, message, options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }
    
    /**
     * Show loading notification
     */
    loading(message = 'Yükleniyor...', id = 'loading') {
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.dataset.id = id;
        
        notification.innerHTML = `
            <div class="notification-loading">
                <div class="notification-spinner"></div>
                <span>${message}</span>
            </div>
        `;
        
        // Remove existing loading notification
        if (this.notifications.has(id)) {
            this.hide(id);
        }
        
        this.container.appendChild(notification);
        this.notifications.set(id, {
            element: notification,
            timer: null,
            duration: 0,
            persistent: true
        });
        
        // Show notification
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        return id;
    }
    
    /**
     * Update loading notification
     */
    updateLoading(message, id = 'loading') {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;
        
        const messageElement = notificationData.element.querySelector('.notification-loading span');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
    
    /**
     * Hide loading notification
     */
    hideLoading(id = 'loading') {
        this.hide(id);
    }
    
    /**
     * Clear all notifications
     */
    clearAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
    }
    
    /**
     * Get notification count
     */
    getCount() {
        return this.notifications.size;
    }
    
    /**
     * Check if notification exists
     */
    exists(id) {
        return this.notifications.has(id);
    }
    
    /**
     * Cleanup notification manager
     */
    cleanup() {
        this.clearAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        const notificationStyles = document.getElementById('notification-styles');
        if (notificationStyles && notificationStyles.parentNode) {
            notificationStyles.parentNode.removeChild(notificationStyles);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}

// Make globally available
window.NotificationManager = NotificationManager;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.notificationManager) {
            window.notificationManager = new NotificationManager();
        }
    });
} else {
    if (!window.notificationManager) {
        window.notificationManager = new NotificationManager();
    }
}