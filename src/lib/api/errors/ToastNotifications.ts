/**
 * Toast Notification System for Error Feedback
 * Provides user-friendly error notifications with actions
 */

import { ApiError, ErrorType, UserFriendlyError } from '../types';
import { ErrorClassificationResult } from './ErrorClassification';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  dismissible?: boolean;
  actions?: ToastAction[];
  icon?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ToastAction {
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export interface ToastOptions {
  duration?: number;
  persistent?: boolean;
  dismissible?: boolean;
  actions?: ToastAction[];
  icon?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showProgress?: boolean;
  pauseOnHover?: boolean;
  closeOnClick?: boolean;
}

export type ToastListener = (notification: ToastNotification) => void;

export class ToastNotificationManager {
  private static notifications: ToastNotification[] = [];
  private static listeners: ToastListener[] = [];
  private static maxNotifications = 5;
  private static defaultDuration = 5000; // 5 seconds
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  // Default toast configurations for different error types
  private static readonly ERROR_TOAST_CONFIG: Record<ErrorType, Partial<ToastOptions>> = {
    [ErrorType.NETWORK_ERROR]: {
      duration: 8000,
      icon: '🌐',
      persistent: false,
      dismissible: true
    },
    [ErrorType.SERVER_ERROR]: {
      duration: 10000,
      icon: '🔧',
      persistent: false,
      dismissible: true
    },
    [ErrorType.VALIDATION_ERROR]: {
      duration: 6000,
      icon: '⚠️',
      persistent: false,
      dismissible: true
    },
    [ErrorType.TIMEOUT_ERROR]: {
      duration: 7000,
      icon: '⏱️',
      persistent: false,
      dismissible: true
    },
    [ErrorType.LOCATION_ERROR]: {
      duration: 8000,
      icon: '📍',
      persistent: false,
      dismissible: true
    },
    [ErrorType.UNKNOWN_ERROR]: {
      duration: 6000,
      icon: '❓',
      persistent: false,
      dismissible: true
    }
  };

  static showSuccess(
    title: string,
    message: string,
    options?: ToastOptions
  ): string {
    return this.show({
      type: 'success',
      title,
      message,
      icon: '✅',
      ...options
    });
  }

  static showInfo(
    title: string,
    message: string,
    options?: ToastOptions
  ): string {
    return this.show({
      type: 'info',
      title,
      message,
      icon: 'ℹ️',
      ...options
    });
  }

  static showWarning(
    title: string,
    message: string,
    options?: ToastOptions
  ): string {
    return this.show({
      type: 'warning',
      title,
      message,
      icon: '⚠️',
      ...options
    });
  }

  static showError(
    title: string,
    message: string,
    options?: ToastOptions
  ): string {
    return this.show({
      type: 'error',
      title,
      message,
      icon: '❌',
      ...options
    });
  }

  static showApiError(
    error: ApiError,
    userFriendlyError: UserFriendlyError,
    classification: ErrorClassificationResult,
    retryAction?: () => void | Promise<void>
  ): string {
    const config = this.ERROR_TOAST_CONFIG[error.type] || {};
    const actions: ToastAction[] = [];

    // Add retry action if error is retryable
    if (classification.retryable && retryAction) {
      actions.push({
        label: userFriendlyError.action || 'Tekrar Dene',
        action: retryAction,
        style: 'primary'
      });
    }

    // Add dismiss action
    actions.push({
      label: 'Kapat',
      action: () => {}, // Will be handled by dismiss logic
      style: 'secondary'
    });

    return this.show({
      type: this.mapSeverityToToastType(classification.severity),
      title: userFriendlyError.title,
      message: userFriendlyError.message,
      actions,
      metadata: {
        errorType: error.type,
        errorCode: error.code,
        severity: classification.severity,
        category: classification.category,
        retryable: classification.retryable
      },
      ...config
    });
  }

  static showNetworkError(retryAction?: () => void | Promise<void>): string {
    const actions: ToastAction[] = [];
    
    if (retryAction) {
      actions.push({
        label: 'Tekrar Dene',
        action: retryAction,
        style: 'primary'
      });
    }

    return this.showError(
      'Bağlantı Hatası',
      'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      {
        duration: 8000,
        icon: '🌐',
        actions
      }
    );
  }

  static showLocationError(
    message: string,
    suggestAlternatives?: () => void
  ): string {
    const actions: ToastAction[] = [];
    
    if (suggestAlternatives) {
      actions.push({
        label: 'Alternatifleri Gör',
        action: suggestAlternatives,
        style: 'primary'
      });
    }

    return this.showWarning(
      'Lokasyon Uygun Değil',
      message,
      {
        duration: 8000,
        icon: '📍',
        actions
      }
    );
  }

  static showLoadingToast(
    title: string,
    message: string,
    cancelAction?: () => void
  ): string {
    const actions: ToastAction[] = [];
    
    if (cancelAction) {
      actions.push({
        label: 'İptal',
        action: cancelAction,
        style: 'secondary'
      });
    }

    return this.show({
      type: 'info',
      title,
      message,
      icon: '⏳',
      persistent: true,
      dismissible: false,
      actions
    });
  }

  static updateToast(
    id: string,
    updates: Partial<Omit<ToastNotification, 'id' | 'timestamp'>>
  ): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;

    Object.assign(notification, updates);
    this.notifyListeners(notification);
    return true;
  }

  static dismissToast(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return false;

    const notification = this.notifications[index];
    this.notifications.splice(index, 1);
    
    // Clear timer if exists
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.notifyListeners(notification, 'dismissed');
    return true;
  }

  static dismissAll(): void {
    const toastIds = this.notifications.map(n => n.id);
    toastIds.forEach(id => this.dismissToast(id));
  }

  static dismissByType(type: ToastNotification['type']): void {
    const toastIds = this.notifications
      .filter(n => n.type === type)
      .map(n => n.id);
    toastIds.forEach(id => this.dismissToast(id));
  }

  static getNotifications(): ToastNotification[] {
    return [...this.notifications];
  }

  static getNotificationById(id: string): ToastNotification | undefined {
    return this.notifications.find(n => n.id === id);
  }

  static addListener(listener: ToastListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static setMaxNotifications(max: number): void {
    this.maxNotifications = max;
    this.enforceMaxNotifications();
  }

  static setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
  }

  private static show(options: {
    type: ToastNotification['type'];
    title: string;
    message: string;
  } & ToastOptions): string {
    const notification: ToastNotification = {
      id: this.generateId(),
      type: options.type,
      title: options.title,
      message: options.message,
      duration: options.duration ?? this.defaultDuration,
      persistent: options.persistent ?? false,
      dismissible: options.dismissible ?? true,
      actions: options.actions,
      icon: options.icon,
      timestamp: new Date(),
      metadata: options.metadata
    };

    this.notifications.push(notification);
    this.enforceMaxNotifications();
    this.notifyListeners(notification, 'added');

    // Set auto-dismiss timer if not persistent
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        this.dismissToast(notification.id);
      }, notification.duration);
      
      this.timers.set(notification.id, timer);
    }

    return notification.id;
  }

  private static enforceMaxNotifications(): void {
    if (this.notifications.length > this.maxNotifications) {
      const toRemove = this.notifications.length - this.maxNotifications;
      const removedNotifications = this.notifications.splice(0, toRemove);
      
      // Clear timers for removed notifications
      removedNotifications.forEach(notification => {
        const timer = this.timers.get(notification.id);
        if (timer) {
          clearTimeout(timer);
          this.timers.delete(notification.id);
        }
      });
    }
  }

  private static notifyListeners(
    notification: ToastNotification,
    action: 'added' | 'updated' | 'dismissed' = 'updated'
  ): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in toast listener:', error);
      }
    });
  }

  private static generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static mapSeverityToToastType(severity: string): ToastNotification['type'] {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  // Utility methods for common toast patterns
  static showRetryableError(
    title: string,
    message: string,
    retryAction: () => void | Promise<void>,
    maxRetries: number = 3
  ): string {
    let retryCount = 0;
    
    const handleRetry = async () => {
      retryCount++;
      
      try {
        await retryAction();
        this.showSuccess('Başarılı', 'İşlem başarıyla tamamlandı.');
      } catch (error) {
        if (retryCount < maxRetries) {
          this.showWarning(
            'Tekrar Deneniyor',
            `Deneme ${retryCount}/${maxRetries} başarısız. Tekrar deneniyor...`
          );
          setTimeout(handleRetry, 2000);
        } else {
          this.showError(
            'İşlem Başarısız',
            'Maksimum deneme sayısına ulaşıldı. Lütfen daha sonra tekrar deneyin.'
          );
        }
      }
    };

    return this.showError(title, message, {
      actions: [
        {
          label: 'Tekrar Dene',
          action: handleRetry,
          style: 'primary'
        }
      ]
    });
  }

  static showProgressToast(
    title: string,
    initialMessage: string,
    progressUpdates: Array<{ message: string; delay: number }>
  ): string {
    const toastId = this.showLoadingToast(title, initialMessage);
    
    let currentStep = 0;
    const updateProgress = () => {
      if (currentStep < progressUpdates.length) {
        const update = progressUpdates[currentStep];
        this.updateToast(toastId, { message: update.message });
        
        setTimeout(() => {
          currentStep++;
          updateProgress();
        }, update.delay);
      } else {
        this.dismissToast(toastId);
      }
    };

    setTimeout(updateProgress, 1000);
    return toastId;
  }

  static showConfirmationToast(
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ): string {
    return this.show({
      type: 'warning',
      title,
      message,
      persistent: true,
      dismissible: false,
      actions: [
        {
          label: 'Onayla',
          action: async () => {
            await onConfirm();
          },
          style: 'danger'
        },
        {
          label: 'İptal',
          action: () => {
            if (onCancel) onCancel();
          },
          style: 'secondary'
        }
      ]
    });
  }
}