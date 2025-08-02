/**
 * React Hook for Centralized API Error Handling
 * Provides user-friendly error messages and retry functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError, ErrorHandler, UserFriendlyError, ErrorType } from '../api';

export interface UseApiErrorOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: ApiError) => void;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: ApiError) => void;
}

export interface ApiErrorState {
  error: ApiError | null;
  userFriendlyError: UserFriendlyError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  lastErrorTime: Date | null;
}

export interface UseApiErrorReturn {
  state: ApiErrorState;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  getUserFriendlyMessage: () => string;
  getErrorTitle: () => string;
  getActionText: () => string;
  shouldShowRetryButton: boolean;
  isNetworkError: boolean;
  isServerError: boolean;
  isValidationError: boolean;
  isLocationError: boolean;
}

export function useApiError(
  retryFunction?: () => Promise<void>,
  options: UseApiErrorOptions = {}
): UseApiErrorReturn {
  const {
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 2000,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  // State management
  const [state, setState] = useState<ApiErrorState>({
    error: null,
    userFriendlyError: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false,
    lastErrorTime: null
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<ApiErrorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Set error function
  const setError = useCallback((error: ApiError | null) => {
    if (!error) {
      updateState({
        error: null,
        userFriendlyError: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: false,
        lastErrorTime: null
      });
      return;
    }

    const userFriendlyError = ErrorHandler.getUserFriendlyError(error);
    const canRetry = error.retryable && retryFunction !== undefined;

    updateState({
      error,
      userFriendlyError,
      canRetry,
      lastErrorTime: new Date(),
      isRetrying: false
    });

    // Call error callback
    if (onError) {
      onError(error);
    }

    // Auto-retry if enabled and error is retryable
    if (autoRetry && canRetry && state.retryCount < maxRetries) {
      setTimeout(() => {
        retry();
      }, retryDelay);
    }
  }, [updateState, retryFunction, onError, autoRetry, maxRetries, retryDelay, state.retryCount]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Retry function
  const retry = useCallback(async () => {
    if (!retryFunction || !state.canRetry || state.isRetrying) return;

    const newRetryCount = state.retryCount + 1;

    // Check if max retries reached
    if (newRetryCount > maxRetries) {
      if (onMaxRetriesReached && state.error) {
        onMaxRetriesReached(state.error);
      }
      return;
    }

    updateState({ 
      isRetrying: true, 
      retryCount: newRetryCount 
    });

    // Call retry callback
    if (onRetry) {
      onRetry(newRetryCount);
    }

    try {
      await retryFunction();
      // If successful, clear the error
      clearError();
    } catch (error: any) {
      // If retry fails, update with new error
      const apiError = error as ApiError;
      updateState({ 
        error: apiError,
        userFriendlyError: ErrorHandler.getUserFriendlyError(apiError),
        isRetrying: false 
      });

      // Try auto-retry again if enabled
      if (autoRetry && newRetryCount < maxRetries) {
        setTimeout(() => {
          retry();
        }, retryDelay * Math.pow(2, newRetryCount - 1)); // Exponential backoff
      }
    }
  }, [
    retryFunction, 
    state.canRetry, 
    state.isRetrying, 
    state.retryCount, 
    state.error,
    maxRetries, 
    updateState, 
    onRetry, 
    onMaxRetriesReached, 
    clearError, 
    autoRetry, 
    retryDelay
  ]);

  // Helper functions
  const getUserFriendlyMessage = useCallback(() => {
    return state.userFriendlyError?.message || 'Bir hata oluştu';
  }, [state.userFriendlyError]);

  const getErrorTitle = useCallback(() => {
    return state.userFriendlyError?.title || 'Hata';
  }, [state.userFriendlyError]);

  const getActionText = useCallback(() => {
    return state.userFriendlyError?.action || 'Tamam';
  }, [state.userFriendlyError]);

  // Helper properties
  const shouldShowRetryButton = state.canRetry && !state.isRetrying && state.retryCount < maxRetries;
  const isNetworkError = state.error?.type === ErrorType.NETWORK_ERROR;
  const isServerError = state.error?.type === ErrorType.SERVER_ERROR;
  const isValidationError = state.error?.type === ErrorType.VALIDATION_ERROR;
  const isLocationError = state.error?.type === ErrorType.LOCATION_ERROR;

  return {
    state,
    setError,
    clearError,
    retry,
    getUserFriendlyMessage,
    getErrorTitle,
    getActionText,
    shouldShowRetryButton,
    isNetworkError,
    isServerError,
    isValidationError,
    isLocationError
  };
}

// Hook for handling multiple API errors
export function useMultipleApiErrors() {
  const [errors, setErrors] = useState<Map<string, ApiError>>(new Map());

  const setError = useCallback((key: string, error: ApiError | null) => {
    setErrors(prev => {
      const newErrors = new Map(prev);
      if (error) {
        newErrors.set(key, error);
      } else {
        newErrors.delete(key);
      }
      return newErrors;
    });
  }, []);

  const clearError = useCallback((key: string) => {
    setError(key, null);
  }, [setError]);

  const clearAllErrors = useCallback(() => {
    setErrors(new Map());
  }, []);

  const hasErrors = errors.size > 0;
  const errorCount = errors.size;
  const errorList = Array.from(errors.values());

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
    errorCount,
    errorList
  };
}

// Hook for toast-style error notifications
export function useErrorToast(duration = 5000) {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    error: ApiError;
    userFriendlyError: UserFriendlyError;
    timestamp: Date;
  }>>([]);

  const showError = useCallback((error: ApiError) => {
    const id = `error-${Date.now()}-${Math.random()}`;
    const userFriendlyError = ErrorHandler.getUserFriendlyError(error);
    
    const toast = {
      id,
      error,
      userFriendlyError,
      timestamp: new Date()
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, [duration]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showError,
    removeToast,
    clearAllToasts
  };
}