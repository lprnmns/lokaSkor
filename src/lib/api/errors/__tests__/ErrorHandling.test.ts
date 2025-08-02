/**
 * Tests for Error Handling System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorType } from '../../types';
import { ErrorClassifier } from '../ErrorClassification';
import { ErrorRecoveryManager } from '../ErrorRecovery';
import { ErrorLogger } from '../ErrorLogger';
import { ToastNotificationManager } from '../ToastNotifications';
import { EnhancedErrorHandler } from '../EnhancedErrorHandler';

describe('Error Classification', () => {
  describe('ErrorClassifier', () => {
    it('should classify network errors correctly', () => {
      const networkError = {
        message: 'Network Error',
        response: undefined
      };

      const classification = ErrorClassifier.classify(networkError);

      expect(classification.type).toBe(ErrorType.NETWORK_ERROR);
      expect(classification.severity).toBe('high');
      expect(classification.category).toBe('network');
      expect(classification.retryable).toBe(true);
      expect(classification.retryStrategy).toBe('exponential');
    });

    it('should classify server errors correctly', () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' }
        }
      };

      const classification = ErrorClassifier.classify(serverError);

      expect(classification.type).toBe(ErrorType.SERVER_ERROR);
      expect(classification.severity).toBe('high');
      expect(classification.category).toBe('system');
      expect(classification.retryable).toBe(true);
      expect(classification.escalate).toBe(true);
    });

    it('should classify validation errors correctly', () => {
      const validationError = {
        response: {
          status: 400,
          data: { error: 'Bad Request' }
        }
      };

      const classification = ErrorClassifier.classify(validationError);

      expect(classification.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(classification.severity).toBe('medium');
      expect(classification.category).toBe('user');
      expect(classification.retryable).toBe(false);
    });

    it('should classify location errors correctly', () => {
      const locationError = {
        response: {
          status: 400,
          data: { error: 'Bu bölge ticari faaliyet için uygun değil' }
        }
      };

      const classification = ErrorClassifier.classify(locationError);

      expect(classification.type).toBe(ErrorType.LOCATION_ERROR);
      expect(classification.severity).toBe('low');
      expect(classification.category).toBe('business');
      expect(classification.retryable).toBe(false);
    });

    it('should determine retry eligibility correctly', () => {
      const retryableClassification = {
        type: ErrorType.NETWORK_ERROR,
        retryable: true,
        maxRetries: 3
      } as any;

      expect(ErrorClassifier.shouldRetry(retryableClassification, 0)).toBe(true);
      expect(ErrorClassifier.shouldRetry(retryableClassification, 2)).toBe(true);
      expect(ErrorClassifier.shouldRetry(retryableClassification, 3)).toBe(false);

      const nonRetryableClassification = {
        type: ErrorType.VALIDATION_ERROR,
        retryable: false
      } as any;

      expect(ErrorClassifier.shouldRetry(nonRetryableClassification, 0)).toBe(false);
    });

    it('should calculate retry delays correctly', () => {
      const exponentialClassification = {
        retryStrategy: 'exponential',
        retryDelay: 1000
      } as any;

      expect(ErrorClassifier.getRetryDelay(exponentialClassification, 0)).toBe(1000);
      expect(ErrorClassifier.getRetryDelay(exponentialClassification, 1)).toBe(2000);
      expect(ErrorClassifier.getRetryDelay(exponentialClassification, 2)).toBe(4000);

      const linearClassification = {
        retryStrategy: 'linear',
        retryDelay: 1000
      } as any;

      expect(ErrorClassifier.getRetryDelay(linearClassification, 0)).toBe(1000);
      expect(ErrorClassifier.getRetryDelay(linearClassification, 1)).toBe(2000);
      expect(ErrorClassifier.getRetryDelay(linearClassification, 2)).toBe(3000);
    });
  });
});

describe('Error Recovery', () => {
  describe('ErrorRecoveryManager', () => {
    it('should create appropriate recovery strategies for network errors', async () => {
      const context = {
        operation: 'analyzePoint',
        parameters: { lat: 39.9334, lon: 32.8597, kategori: 'eczane' },
        previousAttempts: 1,
        lastError: { type: ErrorType.NETWORK_ERROR } as any,
        classification: { type: ErrorType.NETWORK_ERROR, category: 'network' } as any
      };

      const strategies = await ErrorRecoveryManager.createRecoveryStrategies(context);

      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies.some(s => s.name === 'retry_with_timeout')).toBe(true);
      expect(strategies.some(s => s.name === 'use_cached_data')).toBe(true);
      expect(strategies.some(s => s.name === 'offline_mode')).toBe(true);
    });

    it('should create location-specific recovery strategies', async () => {
      const context = {
        operation: 'analyzePoint',
        parameters: { lat: 39.9334, lon: 32.8597, kategori: 'eczane' },
        previousAttempts: 0,
        lastError: { type: ErrorType.LOCATION_ERROR } as any,
        classification: { type: ErrorType.LOCATION_ERROR, category: 'business' } as any,
        userContext: {
          location: { lat: 39.9334, lon: 32.8597 }
        }
      };

      const strategies = await ErrorRecoveryManager.createRecoveryStrategies(context);

      expect(strategies.some(s => s.name === 'suggest_nearby_location')).toBe(true);
      expect(strategies.some(s => s.name === 'expand_search_area')).toBe(true);
      expect(strategies.some(s => s.name === 'show_general_info')).toBe(true);
    });

    it('should select best recovery strategy', async () => {
      const strategies = [
        { name: 'fallback_data', description: 'Fallback', execute: () => {} },
        { name: 'use_cached_data', description: 'Cache', execute: () => {} },
        { name: 'retry_with_timeout', description: 'Retry', execute: () => {} }
      ];

      const context = {} as any;
      const bestStrategy = ErrorRecoveryManager.getBestRecoveryStrategy(strategies, context);

      expect(bestStrategy.name).toBe('use_cached_data'); // Should prioritize cache over fallback
    });
  });
});

describe('Error Logger', () => {
  beforeEach(() => {
    ErrorLogger.clearLogs();
  });

  describe('ErrorLogger', () => {
    it('should log errors with correct metadata', () => {
      const error = {
        type: ErrorType.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        message: 'Network connection failed'
      } as any;

      const context = {
        operation: 'analyzePoint',
        timestamp: new Date(),
        userId: 'user123'
      };

      const classification = {
        severity: 'high',
        category: 'network'
      } as any;

      ErrorLogger.logApiError(error, context, classification);

      const logs = ErrorLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].error).toEqual(error);
      expect(logs[0].context).toEqual(context);
      expect(logs[0].classification).toEqual(classification);
    });

    it('should calculate error metrics correctly', () => {
      // Log some test errors
      ErrorLogger.error('Test error 1', { type: ErrorType.NETWORK_ERROR } as any);
      ErrorLogger.error('Test error 2', { type: ErrorType.SERVER_ERROR } as any);
      ErrorLogger.error('Test error 3', { type: ErrorType.NETWORK_ERROR } as any);

      const metrics = ErrorLogger.getMetrics(60);

      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsByType[ErrorType.NETWORK_ERROR]).toBe(2);
      expect(metrics.errorsByType[ErrorType.SERVER_ERROR]).toBe(1);
    });

    it('should filter logs correctly', () => {
      ErrorLogger.error('Error 1', { type: ErrorType.NETWORK_ERROR } as any);
      ErrorLogger.warn('Warning 1');
      ErrorLogger.info('Info 1');

      const errorLogs = ErrorLogger.getLogs({ level: 'error' });
      const warnLogs = ErrorLogger.getLogs({ level: 'warn' });

      expect(errorLogs.length).toBe(1);
      expect(warnLogs.length).toBe(1);
    });

    it('should export logs in different formats', () => {
      ErrorLogger.error('Test error', { type: ErrorType.NETWORK_ERROR } as any);

      const jsonExport = ErrorLogger.exportLogs('json');
      const csvExport = ErrorLogger.exportLogs('csv');

      expect(jsonExport).toContain('Test error');
      expect(csvExport).toContain('Test error');
      expect(csvExport).toContain('timestamp,level,message'); // CSV headers
    });
  });
});

describe('Toast Notifications', () => {
  beforeEach(() => {
    ToastNotificationManager.dismissAll();
  });

  describe('ToastNotificationManager', () => {
    it('should create and manage toast notifications', () => {
      const toastId = ToastNotificationManager.showError(
        'Test Error',
        'This is a test error message'
      );

      expect(toastId).toBeDefined();
      
      const notifications = ToastNotificationManager.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].title).toBe('Test Error');
    });

    it('should dismiss notifications correctly', () => {
      const toastId = ToastNotificationManager.showInfo('Test', 'Message');
      
      expect(ToastNotificationManager.getNotifications().length).toBe(1);
      
      const dismissed = ToastNotificationManager.dismissToast(toastId);
      expect(dismissed).toBe(true);
      expect(ToastNotificationManager.getNotifications().length).toBe(0);
    });

    it('should handle API errors with appropriate toast types', () => {
      const apiError = {
        type: ErrorType.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        message: 'Network failed'
      } as any;

      const userFriendlyError = {
        title: 'Connection Error',
        message: 'Please check your internet connection',
        retryable: true
      } as any;

      const classification = {
        severity: 'high',
        retryable: true
      } as any;

      const toastId = ToastNotificationManager.showApiError(
        apiError,
        userFriendlyError,
        classification
      );

      const notification = ToastNotificationManager.getNotificationById(toastId);
      expect(notification?.type).toBe('error');
      expect(notification?.title).toBe('Connection Error');
      expect(notification?.actions?.length).toBeGreaterThan(0);
    });

    it('should enforce maximum notification limit', () => {
      ToastNotificationManager.setMaxNotifications(3);

      // Add more notifications than the limit
      for (let i = 0; i < 5; i++) {
        ToastNotificationManager.showInfo(`Test ${i}`, 'Message');
      }

      const notifications = ToastNotificationManager.getNotifications();
      expect(notifications.length).toBe(3);
    });
  });
});

describe('Enhanced Error Handler', () => {
  beforeEach(() => {
    ErrorLogger.clearLogs();
    ToastNotificationManager.dismissAll();
  });

  describe('EnhancedErrorHandler', () => {
    it('should handle errors through complete pipeline', async () => {
      const error = new Error('Test error');
      
      const result = await EnhancedErrorHandler.handleError(error, 'test_operation');

      expect(result.handled).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.userFriendlyError).toBeDefined();
    });

    it('should handle network errors with retry action', async () => {
      const networkError = {
        message: 'Network Error',
        response: undefined
      };

      const retryAction = vi.fn().mockResolvedValue(undefined);
      
      const result = await EnhancedErrorHandler.handleNetworkError(
        networkError,
        'test_network_operation',
        retryAction
      );

      expect(result.classification.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.shouldRetry).toBe(true);
    });

    it('should handle location errors with suggestions', async () => {
      const locationError = {
        response: {
          status: 400,
          data: { error: 'Bu bölge ticari faaliyet için uygun değil' }
        }
      };

      const suggestAlternatives = vi.fn();
      
      const result = await EnhancedErrorHandler.handleLocationError(
        locationError,
        'test_location_operation',
        suggestAlternatives
      );

      expect(result.classification.type).toBe(ErrorType.LOCATION_ERROR);
      expect(result.recoveryStrategies?.length).toBeGreaterThan(0);
    });

    it('should execute recovery strategies', async () => {
      const strategy = {
        name: 'test_strategy',
        description: 'Test recovery strategy',
        execute: vi.fn().mockResolvedValue({ success: true, data: 'recovered' }),
        userMessage: 'Recovery successful'
      };

      const context = {
        operation: 'test',
        parameters: {},
        previousAttempts: 0,
        lastError: {} as any,
        classification: {} as any
      };

      const result = await EnhancedErrorHandler.executeRecoveryStrategy(strategy, context);

      expect(strategy.execute).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should provide error metrics', () => {
      // Generate some test errors
      EnhancedErrorHandler.handleError(new Error('Test 1'), 'op1');
      EnhancedErrorHandler.handleError(new Error('Test 2'), 'op2');

      const metrics = EnhancedErrorHandler.getErrorMetrics(60);

      expect(metrics.totalErrors).toBeGreaterThan(0);
      expect(metrics.errorsByType).toBeDefined();
    });

    it('should create error boundary handler', () => {
      const handler = EnhancedErrorHandler.createErrorBoundaryHandler('TestComponent');
      
      expect(typeof handler).toBe('function');
      
      // Test the handler
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'test stack' };
      
      expect(() => handler(error, errorInfo)).not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    ErrorLogger.clearLogs();
    ToastNotificationManager.dismissAll();
  });

  it('should handle complete error workflow', async () => {
    // Simulate a network error during point analysis
    const networkError = {
      message: 'Network Error',
      code: 'ECONNABORTED',
      response: undefined
    };

    const retryAction = vi.fn().mockResolvedValue(undefined);
    
    // Handle the error
    const result = await EnhancedErrorHandler.handleNetworkError(
      networkError,
      'analyzePoint',
      retryAction
    );

    // Verify error was classified correctly
    expect(result.classification.type).toBe(ErrorType.NETWORK_ERROR);
    expect(result.classification.retryable).toBe(true);

    // Verify logging
    const logs = ErrorLogger.getLogs();
    expect(logs.length).toBeGreaterThan(0);

    // Verify toast notification
    const notifications = ToastNotificationManager.getNotifications();
    expect(notifications.length).toBeGreaterThan(0);

    // Verify recovery strategies
    expect(result.recoveryStrategies?.length).toBeGreaterThan(0);
  });

  it('should handle location error with recovery', async () => {
    const locationError = {
      response: {
        status: 400,
        data: { error: 'Koordinatlar Ankara sınırları dışında' }
      }
    };

    const result = await EnhancedErrorHandler.handleLocationError(
      locationError,
      'analyzePoint'
    );

    // Should have location-specific recovery strategies
    const hasLocationRecovery = result.recoveryStrategies?.some(
      s => s.name === 'suggest_nearby_location' || s.name === 'auto_correct_input'
    );
    expect(hasLocationRecovery).toBe(true);

    // Should not be retryable
    expect(result.shouldRetry).toBe(false);
  });
});