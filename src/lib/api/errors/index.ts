/**
 * Error Handling System Exports
 * Central export point for all error handling functionality
 */

// Error Classification
export {
  ErrorClassifier,
  type ErrorContext,
  type ErrorClassificationResult
} from './ErrorClassification';

// Error Recovery
export {
  ErrorRecoveryManager,
  type RecoveryStrategy,
  type RecoveryContext
} from './ErrorRecovery';

// Error Logging
export {
  ErrorLogger,
  type LogEntry,
  type ErrorMetrics,
  type AlertRule
} from './ErrorLogger';

// Toast Notifications
export {
  ToastNotificationManager,
  type ToastNotification,
  type ToastAction,
  type ToastOptions,
  type ToastListener
} from './ToastNotifications';

// Enhanced Error Handler (combines all functionality)
export { EnhancedErrorHandler } from './EnhancedErrorHandler';

// Re-export base error types
export { ErrorHandler, ERROR_MESSAGES } from '../errors';
export type { ApiError, UserFriendlyError, ErrorType } from '../types';