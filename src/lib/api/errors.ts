import { AxiosError } from 'axios';
import { ApiError, ErrorType, UserFriendlyError } from './types';

// User-friendly error messages
export const ERROR_MESSAGES: Record<ErrorType, UserFriendlyError> = {
  [ErrorType.NETWORK_ERROR]: {
    title: 'Bağlantı Hatası',
    message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
    action: 'Tekrar Dene',
    retryable: true
  },
  [ErrorType.SERVER_ERROR]: {
    title: 'Sunucu Hatası',
    message: 'Sunucuda geçici bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
    action: 'Tekrar Dene',
    retryable: true
  },
  [ErrorType.VALIDATION_ERROR]: {
    title: 'Geçersiz Veri',
    message: 'Gönderilen veriler geçersiz. Lütfen bilgileri kontrol edin.',
    action: 'Düzelt',
    retryable: false
  },
  [ErrorType.TIMEOUT_ERROR]: {
    title: 'Zaman Aşımı',
    message: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
    action: 'Tekrar Dene',
    retryable: true
  },
  [ErrorType.LOCATION_ERROR]: {
    title: 'Lokasyon Uygun Değil',
    message: 'Seçilen lokasyon ticari faaliyet için uygun değil.',
    action: 'Farklı Lokasyon Seç',
    retryable: false
  },
  [ErrorType.UNKNOWN_ERROR]: {
    title: 'Bilinmeyen Hata',
    message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    action: 'Tekrar Dene',
    retryable: true
  }
};

export class ErrorHandler {
  static createApiError(
    type: ErrorType,
    code: string,
    message: string,
    details?: any
  ): ApiError {
    return {
      type,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      retryable: ERROR_MESSAGES[type].retryable
    };
  }

  static handleAxiosError(error: AxiosError): ApiError {
    // Network error (no response)
    if (!error.response) {
      return this.createApiError(
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        'Network connection failed',
        { originalError: error.message }
      );
    }

    const { status, data } = error.response;

    // Server errors (5xx)
    if (status >= 500) {
      return this.createApiError(
        ErrorType.SERVER_ERROR,
        `SERVER_ERROR_${status}`,
        'Internal server error',
        { status, data }
      );
    }

    // Client errors (4xx)
    if (status >= 400) {
      // Special handling for location-specific errors
      if (data && typeof data === 'object' && 'error' in data) {
        const errorMessage = (data as any).error;
        if (errorMessage.includes('ticari faaliyet için uygun değil') || 
            errorMessage.includes('temel hizmet bulunamadı')) {
          return this.createApiError(
            ErrorType.LOCATION_ERROR,
            'LOCATION_NOT_SUITABLE',
            errorMessage,
            { status, data }
          );
        }
      }

      return this.createApiError(
        ErrorType.VALIDATION_ERROR,
        `VALIDATION_ERROR_${status}`,
        'Request validation failed',
        { status, data }
      );
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return this.createApiError(
        ErrorType.TIMEOUT_ERROR,
        'TIMEOUT_ERROR',
        'Request timeout',
        { originalError: error.message }
      );
    }

    // Unknown error
    return this.createApiError(
      ErrorType.UNKNOWN_ERROR,
      'UNKNOWN_ERROR',
      'An unknown error occurred',
      { originalError: error.message, status }
    );
  }

  static getUserFriendlyError(apiError: ApiError): UserFriendlyError {
    const baseError = ERROR_MESSAGES[apiError.type];
    
    // Customize message for location errors
    if (apiError.type === ErrorType.LOCATION_ERROR && apiError.details?.data) {
      const serverMessage = apiError.details.data.error || apiError.details.data.reason;
      if (serverMessage) {
        return {
          ...baseError,
          message: serverMessage
        };
      }
    }

    return baseError;
  }

  static shouldRetry(error: ApiError, attemptCount: number, maxAttempts: number): boolean {
    if (attemptCount >= maxAttempts) {
      return false;
    }

    return error.retryable;
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(1000 * Math.pow(2, attemptCount), 10000);
  }
}