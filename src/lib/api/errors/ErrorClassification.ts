/**
 * Error Classification System
 * Provides comprehensive error categorization and handling strategies
 */

import { AxiosError } from 'axios';
import { ApiError, ErrorType, UserFriendlyError } from '../types';

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  method?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorClassificationResult {
  type: ErrorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'system' | 'network' | 'business' | 'security';
  retryable: boolean;
  retryStrategy?: 'immediate' | 'exponential' | 'linear' | 'none';
  maxRetries?: number;
  retryDelay?: number;
  escalate?: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

export class ErrorClassifier {
  private static readonly CLASSIFICATION_RULES: Array<{
    condition: (error: any, context?: ErrorContext) => boolean;
    classification: Partial<ErrorClassificationResult>;
  }> = [
    // Network Errors
    {
      condition: (error) => !error.response && error.code === 'ECONNABORTED',
      classification: {
        type: ErrorType.TIMEOUT_ERROR,
        severity: 'medium',
        category: 'network',
        retryable: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 2000,
        logLevel: 'warn'
      }
    },
    {
      condition: (error) => !error.response && error.message?.includes('Network Error'),
      classification: {
        type: ErrorType.NETWORK_ERROR,
        severity: 'high',
        category: 'network',
        retryable: true,
        retryStrategy: 'exponential',
        maxRetries: 5,
        retryDelay: 1000,
        logLevel: 'error'
      }
    },
    {
      condition: (error) => !error.response,
      classification: {
        type: ErrorType.NETWORK_ERROR,
        severity: 'high',
        category: 'network',
        retryable: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 1000,
        logLevel: 'error'
      }
    },

    // Server Errors (5xx)
    {
      condition: (error) => error.response?.status >= 500 && error.response?.status < 600,
      classification: {
        type: ErrorType.SERVER_ERROR,
        severity: 'high',
        category: 'system',
        retryable: true,
        retryStrategy: 'exponential',
        maxRetries: 3,
        retryDelay: 2000,
        escalate: true,
        logLevel: 'error'
      }
    },

    // Client Errors (4xx)
    {
      condition: (error) => error.response?.status === 400,
      classification: {
        type: ErrorType.VALIDATION_ERROR,
        severity: 'medium',
        category: 'user',
        retryable: false,
        logLevel: 'warn'
      }
    },
    {
      condition: (error) => error.response?.status === 401,
      classification: {
        type: ErrorType.VALIDATION_ERROR,
        severity: 'high',
        category: 'security',
        retryable: false,
        escalate: true,
        logLevel: 'error'
      }
    },
    {
      condition: (error) => error.response?.status === 403,
      classification: {
        type: ErrorType.VALIDATION_ERROR,
        severity: 'high',
        category: 'security',
        retryable: false,
        escalate: true,
        logLevel: 'error'
      }
    },
    {
      condition: (error) => error.response?.status === 404,
      classification: {
        type: ErrorType.VALIDATION_ERROR,
        severity: 'low',
        category: 'user',
        retryable: false,
        logLevel: 'info'
      }
    },
    {
      condition: (error) => error.response?.status === 429,
      classification: {
        type: ErrorType.SERVER_ERROR,
        severity: 'medium',
        category: 'system',
        retryable: true,
        retryStrategy: 'exponential',
        maxRetries: 5,
        retryDelay: 5000,
        logLevel: 'warn'
      }
    },
    {
      condition: (error) => error.response?.status >= 400 && error.response?.status < 500,
      classification: {
        type: ErrorType.VALIDATION_ERROR,
        severity: 'medium',
        category: 'user',
        retryable: false,
        logLevel: 'warn'
      }
    },

    // Location-specific Errors
    {
      condition: (error) => 
        error.response?.data?.error?.includes('ticari faaliyet için uygun değil') ||
        error.response?.data?.error?.includes('temel hizmet bulunamadı'),
      classification: {
        type: ErrorType.LOCATION_ERROR,
        severity: 'low',
        category: 'business',
        retryable: false,
        logLevel: 'info'
      }
    },
    {
      condition: (error) => 
        error.response?.data?.error?.includes('Koordinatlar Ankara sınırları dışında'),
      classification: {
        type: ErrorType.LOCATION_ERROR,
        severity: 'low',
        category: 'user',
        retryable: false,
        logLevel: 'info'
      }
    },
    {
      condition: (error) => 
        error.response?.data?.error?.includes('mahalle') ||
        error.response?.data?.error?.includes('lokasyon'),
      classification: {
        type: ErrorType.LOCATION_ERROR,
        severity: 'medium',
        category: 'business',
        retryable: false,
        logLevel: 'warn'
      }
    }
  ];

  static classify(error: any, context?: ErrorContext): ErrorClassificationResult {
    // Find matching classification rule
    for (const rule of this.CLASSIFICATION_RULES) {
      if (rule.condition(error, context)) {
        return {
          type: ErrorType.UNKNOWN_ERROR,
          severity: 'medium',
          category: 'system',
          retryable: false,
          logLevel: 'error',
          ...rule.classification
        } as ErrorClassificationResult;
      }
    }

    // Default classification for unknown errors
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: 'medium',
      category: 'system',
      retryable: false,
      logLevel: 'error'
    };
  }

  static shouldRetry(
    classification: ErrorClassificationResult,
    currentRetryCount: number
  ): boolean {
    if (!classification.retryable) return false;
    if (!classification.maxRetries) return false;
    return currentRetryCount < classification.maxRetries;
  }

  static getRetryDelay(
    classification: ErrorClassificationResult,
    retryCount: number
  ): number {
    const baseDelay = classification.retryDelay || 1000;

    switch (classification.retryStrategy) {
      case 'immediate':
        return 0;
      case 'linear':
        return baseDelay * (retryCount + 1);
      case 'exponential':
        return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
      case 'none':
      default:
        return baseDelay;
    }
  }

  static shouldEscalate(
    classification: ErrorClassificationResult,
    context?: ErrorContext
  ): boolean {
    if (classification.escalate) return true;
    if (classification.severity === 'critical') return true;
    if (classification.category === 'security') return true;
    
    // Escalate if error occurs frequently
    if (context?.retryCount && context.retryCount > 5) return true;
    
    return false;
  }
}