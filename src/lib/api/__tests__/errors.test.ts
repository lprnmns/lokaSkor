import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { ErrorHandler } from '../errors';
import { ErrorType } from '../types';

describe('ErrorHandler', () => {
  describe('createApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = ErrorHandler.createApiError(
        ErrorType.NETWORK_ERROR,
        'NET_001',
        'Network failed',
        { extra: 'data' }
      );

      expect(error).toMatchObject({
        type: ErrorType.NETWORK_ERROR,
        code: 'NET_001',
        message: 'Network failed',
        details: { extra: 'data' },
        retryable: true
      });
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('handleAxiosError', () => {
    it('should handle network errors (no response)', () => {
      const axiosError = {
        message: 'Network Error',
        response: undefined
      } as AxiosError;

      const apiError = ErrorHandler.handleAxiosError(axiosError);

      expect(apiError).toMatchObject({
        type: ErrorType.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        message: 'Network connection failed'
      });
    });

    it('should handle server errors (5xx)', () => {
      const axiosError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      } as AxiosError;

      const apiError = ErrorHandler.handleAxiosError(axiosError);

      expect(apiError).toMatchObject({
        type: ErrorType.SERVER_ERROR,
        code: 'SERVER_ERROR_500',
        message: 'Internal server error'
      });
    });

    it('should handle location-specific errors', () => {
      const axiosError = {
        response: {
          status: 400,
          data: { 
            error: 'Bu bölge ticari faaliyet için uygun değil',
            reason: '2km içinde temel hizmet bulunamadı'
          }
        }
      } as AxiosError;

      const apiError = ErrorHandler.handleAxiosError(axiosError);

      expect(apiError).toMatchObject({
        type: ErrorType.LOCATION_ERROR,
        code: 'LOCATION_NOT_SUITABLE',
        message: 'Bu bölge ticari faaliyet için uygun değil'
      });
    });

    it('should handle validation errors (4xx)', () => {
      const axiosError = {
        response: {
          status: 400,
          data: { error: 'Invalid parameters' }
        }
      } as AxiosError;

      const apiError = ErrorHandler.handleAxiosError(axiosError);

      expect(apiError).toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        code: 'VALIDATION_ERROR_400',
        message: 'Request validation failed'
      });
    });

    it('should handle timeout errors', () => {
      const axiosError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      } as AxiosError;

      const apiError = ErrorHandler.handleAxiosError(axiosError);

      expect(apiError).toMatchObject({
        type: ErrorType.TIMEOUT_ERROR,
        code: 'TIMEOUT_ERROR',
        message: 'Request timeout'
      });
    });

    it('should handle unknown errors', () => {
      const axiosError = {
        message: 'Something went wrong',
        response: {
          status: 418 // I'm a teapot
        }
      } as AxiosError;

      const apiError = ErrorHandler.handleAxiosError(axiosError);

      expect(apiError).toMatchObject({
        type: ErrorType.UNKNOWN_ERROR,
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred'
      });
    });
  });

  describe('getUserFriendlyError', () => {
    it('should return base error message for most error types', () => {
      const apiError = ErrorHandler.createApiError(
        ErrorType.NETWORK_ERROR,
        'NET_001',
        'Network failed'
      );

      const userError = ErrorHandler.getUserFriendlyError(apiError);

      expect(userError).toMatchObject({
        title: 'Bağlantı Hatası',
        message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
        action: 'Tekrar Dene',
        retryable: true
      });
    });

    it('should customize message for location errors with server details', () => {
      const apiError = ErrorHandler.createApiError(
        ErrorType.LOCATION_ERROR,
        'LOC_001',
        'Location error',
        {
          data: {
            error: 'Seçilen lokasyon uygun değil - özel mesaj'
          }
        }
      );

      const userError = ErrorHandler.getUserFriendlyError(apiError);

      expect(userError.message).toBe('Seçilen lokasyon uygun değil - özel mesaj');
    });
  });

  describe('shouldRetry', () => {
    it('should not retry if max attempts reached', () => {
      const error = ErrorHandler.createApiError(
        ErrorType.NETWORK_ERROR,
        'NET_001',
        'Network failed'
      );

      const shouldRetry = ErrorHandler.shouldRetry(error, 3, 3);

      expect(shouldRetry).toBe(false);
    });

    it('should not retry non-retryable errors', () => {
      const error = ErrorHandler.createApiError(
        ErrorType.VALIDATION_ERROR,
        'VAL_001',
        'Validation failed'
      );

      const shouldRetry = ErrorHandler.shouldRetry(error, 1, 3);

      expect(shouldRetry).toBe(false);
    });

    it('should retry retryable errors within attempt limit', () => {
      const error = ErrorHandler.createApiError(
        ErrorType.NETWORK_ERROR,
        'NET_001',
        'Network failed'
      );

      const shouldRetry = ErrorHandler.shouldRetry(error, 1, 3);

      expect(shouldRetry).toBe(true);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff delays', () => {
      expect(ErrorHandler.getRetryDelay(0)).toBe(1000);
      expect(ErrorHandler.getRetryDelay(1)).toBe(2000);
      expect(ErrorHandler.getRetryDelay(2)).toBe(4000);
      expect(ErrorHandler.getRetryDelay(3)).toBe(8000);
    });

    it('should cap delay at 10 seconds', () => {
      expect(ErrorHandler.getRetryDelay(10)).toBe(10000);
    });
  });
});