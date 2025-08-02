import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiConfig, ApiError } from './types';
import { ErrorHandler } from './errors';
import { ApiCache } from './cache';
import { apiConfig } from './config';

export class ApiService {
  protected axiosInstance: AxiosInstance;
  protected cache: ApiCache;
  protected config: ApiConfig;

  constructor(config: ApiConfig = apiConfig) {
    this.config = config;
    this.cache = new ApiCache({
      enableCache: true,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100
    });

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.config.enableDebug) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data
          });
        }
        return config;
      },
      (error) => {
        if (this.config.enableDebug) {
          console.error('[API] Request error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (this.config.enableDebug) {
          console.log(`[API] Response ${response.status}:`, response.data);
        }
        return response;
      },
      (error) => {
        if (this.config.enableDebug) {
          console.error('[API] Response error:', error);
        }
        return Promise.reject(error);
      }
    );
  }

  protected async request<T>(
    config: AxiosRequestConfig,
    useCache: boolean = true,
    cacheTTL?: number
  ): Promise<T> {
    const cacheKey = `${config.method}:${config.url}`;
    
    // Try cache first
    if (useCache && config.method === 'GET') {
      const cachedData = this.cache.get<T>(cacheKey, config.params);
      if (cachedData) {
        if (this.config.enableDebug) {
          console.log('[API] Cache hit:', cacheKey);
        }
        return cachedData;
      }
    }

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request(config);
      
      // Cache successful GET requests
      if (useCache && config.method === 'GET' && response.data) {
        this.cache.set(cacheKey, response.data, config.params, cacheTTL);
      }

      return response.data;
    } catch (error: any) {
      const apiError = ErrorHandler.handleAxiosError(error);
      throw apiError;
    }
  }

  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxAttempts: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: ApiError;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error as ApiError;
        
        if (!ErrorHandler.shouldRetry(lastError, attempt, maxAttempts)) {
          break;
        }

        if (attempt < maxAttempts - 1) {
          const delay = ErrorHandler.getRetryDelay(attempt);
          if (this.config.enableDebug) {
            console.log(`[API] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
          }
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for cache management
  public invalidateCache(pattern?: string): void {
    if (pattern) {
      this.cache.invalidatePattern(pattern);
    } else {
      this.cache.clear();
    }
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}