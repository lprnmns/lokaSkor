/**
 * Enhanced Error Handler
 * Combines all error handling functionality into a unified system
 */

import { AxiosError } from 'axios';
import { ApiError, ErrorType, UserFriendlyError } from '../types';
import { ErrorHandler } from '../errors';
import { ErrorClassifier, ErrorContext, ErrorClassificationResult } from './ErrorClassification';
import { ErrorRecoveryManager, RecoveryStrategy, RecoveryContext } from './ErrorRecovery';
import { ErrorLogger } from './ErrorLogger';
import { ToastNotificationManager } from './ToastNotifications';

export interface EnhancedErrorHandlingOptions {
  enableLogging?: boolean;
  enableToastNotifications?: boolean;
  enableRecovery?: boolean;
  enableRetry?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  maxRetries?: number;
  retryDelay?: number;
  showUserFriendlyMessages?: boolean;
  escalateThreshold?: number;
  context?: Partial<ErrorContext>;
}

export interface ErrorHandlingResult {
  handled: boolean;
  error: ApiError;
  classification: ErrorClassificationResult;
  userFriendlyError: UserFriendlyError;
  recoveryStrategies?: RecoveryStrategy[];
  toastId?: string;
  shouldRetry: boolean;
  retryDelay?: number;
  logEntryId?: string;
}

export class EnhancedErrorHandler {
  private static defaultOptions: EnhancedErrorHandlingOptions = {
    enableLogging: true,
    enableToastNotifications: true,
    enableRecovery: true,
    enableRetry: true,
    logLevel: 'error',
    maxRetries: 3,
    retryDelay: 1000,
    showUserFriendlyMessages: true,
    escalateThreshold: 5
  };

  /**
   * Main error handling method that processes errors through the complete pipeline
   */
  static async handleError(
    error: any,
    operation: string,
    options: EnhancedErrorHandlingOptions = {}
  ): Promise<ErrorHandlingResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Step 1: Convert to ApiError
    const apiError = this.convertToApiError(error);
    
    // Step 2: Create context
    const context: ErrorContext = {
      operation,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      requestId: this.generateRequestId(),
      ...mergedOptions.context
    };

    // Step 3: Classify error
    const classification = ErrorClassifier.classify(error, context);
    
    // Step 4: Get user-friendly error
    const userFriendlyError = ErrorHandler.getUserFriendlyError(apiError);
    
    // Step 5: Log error
    let logEntryId: string | undefined;
    if (mergedOptions.enableLogging) {
      ErrorLogger.logApiError(apiError, context, classification);
      logEntryId = `${context.requestId}-${Date.now()}`;
    }

    // Step 6: Determine retry strategy
    const shouldRetry = mergedOptions.enableRetry && 
                       ErrorClassifier.shouldRetry(classification, context.retryCount || 0);
    const retryDelay = shouldRetry ? 
                      ErrorClassifier.getRetryDelay(classification, context.retryCount || 0) : 
                      undefined;

    // Step 7: Generate recovery strategies
    let recoveryStrategies: RecoveryStrategy[] | undefined;
    if (mergedOptions.enableRecovery) {
      const recoveryContext: RecoveryContext = {
        operation,
        parameters: context.metadata || {},
        previousAttempts: context.retryCount || 0,
        lastError: apiError,
        classification,
        userContext: this.extractUserContext(context)
      };
      
      recoveryStrategies = await ErrorRecoveryManager.createRecoveryStrategies(recoveryContext);
    }

    // Step 8: Show toast notification
    let toastId: string | undefined;
    if (mergedOptions.enableToastNotifications && mergedOptions.showUserFriendlyMessages) {
      toastId = this.showErrorToast(apiError, userFriendlyError, classification, recoveryStrategies);
    }

    // Step 9: Check for escalation
    if (ErrorClassifier.shouldEscalate(classification, context)) {
      this.escalateError(apiError, context, classification);
    }

    return {
      handled: true,
      error: apiError,
      classification,
      userFriendlyError,
      recoveryStrategies,
      toastId,
      shouldRetry,
      retryDelay,
      logEntryId
    };
  }

  /**
   * Handle network errors specifically
   */
  static async handleNetworkError(
    error: any,
    operation: string,
    retryAction?: () => Promise<void>
  ): Promise<ErrorHandlingResult> {
    const result = await this.handleError(error, operation, {
      enableToastNotifications: true,
      enableRecovery: true,
      enableRetry: true
    });

    // Show specific network error toast with retry action
    if (retryAction) {
      ToastNotificationManager.showNetworkError(retryAction);
    }

    return result;
  }

  /**
   * Handle location-specific errors
   */
  static async handleLocationError(
    error: any,
    operation: string,
    suggestAlternatives?: () => void
  ): Promise<ErrorHandlingResult> {
    const result = await this.handleError(error, operation, {
      enableRecovery: true,
      logLevel: 'info' // Location errors are usually user-facing, not system errors
    });

    // Show specific location error toast
    if (result.userFriendlyError && suggestAlternatives) {
      ToastNotificationManager.showLocationError(
        result.userFriendlyError.message,
        suggestAlternatives
      );
    }

    return result;
  }

  /**
   * Handle validation errors with input suggestions
   */
  static async handleValidationError(
    error: any,
    operation: string,
    inputSuggestions?: () => void
  ): Promise<ErrorHandlingResult> {
    const result = await this.handleError(error, operation, {
      enableRecovery: true,
      enableRetry: false, // Validation errors usually don't benefit from retry
      logLevel: 'warn'
    });

    return result;
  }

  /**
   * Handle server errors with automatic retry
   */
  static async handleServerError(
    error: any,
    operation: string,
    retryAction?: () => Promise<void>
  ): Promise<ErrorHandlingResult> {
    const result = await this.handleError(error, operation, {
      enableRetry: true,
      maxRetries: 5,
      retryDelay: 2000,
      escalateThreshold: 3
    });

    // Implement automatic retry if action provided
    if (result.shouldRetry && retryAction) {
      setTimeout(async () => {
        try {
          await retryAction();
          ToastNotificationManager.showSuccess(
            'Başarılı',
            'İşlem başarıyla tamamlandı.'
          );
        } catch (retryError) {
          // Handle retry failure
          this.handleError(retryError, `${operation}_retry`);
        }
      }, result.retryDelay || 2000);
    }

    return result;
  }

  /**
   * Execute recovery strategy
   */
  static async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    context: RecoveryContext
  ): Promise<any> {
    try {
      ErrorLogger.info(`Executing recovery strategy: ${strategy.name}`, {
        strategy: strategy.name,
        operation: context.operation
      });

      const result = await ErrorRecoveryManager.executeRecoveryStrategy(strategy, context);
      
      if (result.success) {
        ToastNotificationManager.showSuccess(
          'Kurtarma Başarılı',
          strategy.userMessage || 'İşlem alternatif yöntemle tamamlandı.'
        );
      }

      return result;
    } catch (error) {
      ErrorLogger.error(`Recovery strategy failed: ${strategy.name}`, error as ApiError);
      throw error;
    }
  }

  /**
   * Get error metrics and analytics
   */
  static getErrorMetrics(timeRangeMinutes: number = 60) {
    return ErrorLogger.getMetrics(timeRangeMinutes);
  }

  /**
   * Get recent errors for debugging
   */
  static getRecentErrors(timeRangeMinutes: number = 60) {
    return ErrorLogger.getRecentErrors(timeRangeMinutes);
  }

  /**
   * Clear all error logs and notifications
   */
  static clearAll(): void {
    ErrorLogger.clearLogs();
    ToastNotificationManager.dismissAll();
  }

  /**
   * Set global error handling options
   */
  static setDefaultOptions(options: Partial<EnhancedErrorHandlingOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Create error boundary handler for React components
   */
  static createErrorBoundaryHandler(componentName: string) {
    return (error: Error, errorInfo: any) => {
      this.handleError(error, `component_error_${componentName}`, {
        context: {
          metadata: {
            componentName,
            errorInfo,
            componentStack: errorInfo.componentStack
          }
        },
        logLevel: 'error',
        enableToastNotifications: true
      });
    };
  }

  /**
   * Create global error handler for unhandled errors
   */
  static setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, 'unhandled_promise_rejection', {
          context: {
            metadata: {
              promise: event.promise,
              reason: event.reason
            }
          },
          logLevel: 'error'
        });
      });

      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error, 'uncaught_error', {
          context: {
            metadata: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              message: event.message
            }
          },
          logLevel: 'fatal'
        });
      });
    }
  }

  private static convertToApiError(error: any): ApiError {
    if (error.type && error.code && error.message) {
      return error as ApiError;
    }

    if (error.isAxiosError || error.response || error.request) {
      return ErrorHandler.handleAxiosError(error as AxiosError);
    }

    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN_ERROR,
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: { stack: error.stack },
        timestamp: new Date().toISOString(),
        retryable: false
      };
    }

    return {
      type: ErrorType.UNKNOWN_ERROR,
      code: 'UNKNOWN_ERROR',
      message: String(error),
      timestamp: new Date().toISOString(),
      retryable: false
    };
  }

  private static showErrorToast(
    apiError: ApiError,
    userFriendlyError: UserFriendlyError,
    classification: ErrorClassificationResult,
    recoveryStrategies?: RecoveryStrategy[]
  ): string {
    // Create retry action if strategies are available
    let retryAction: (() => Promise<void>) | undefined;
    
    if (recoveryStrategies && recoveryStrategies.length > 0) {
      const bestStrategy = ErrorRecoveryManager.getBestRecoveryStrategy(
        recoveryStrategies,
        {} as RecoveryContext // This would need proper context
      );
      
      retryAction = async () => {
        await bestStrategy.execute();
      };
    }

    return ToastNotificationManager.showApiError(
      apiError,
      userFriendlyError,
      classification,
      retryAction
    );
  }

  private static escalateError(
    error: ApiError,
    context: ErrorContext,
    classification: ErrorClassificationResult
  ): void {
    ErrorLogger.fatal(
      `Escalated error: ${error.message}`,
      error,
      context,
      classification
    );

    // Send to external monitoring service
    this.sendToMonitoringService(error, context, classification);
  }

  private static sendToMonitoringService(
    error: ApiError,
    context: ErrorContext,
    classification: ErrorClassificationResult
  ): void {
    // This would integrate with external monitoring services
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 ESCALATED ERROR:', {
        error,
        context,
        classification
      });
    }
  }

  private static extractUserContext(context: ErrorContext): any {
    return {
      // Extract user-relevant context from error context
      // This would be customized based on your application's needs
    };
  }

  private static generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}