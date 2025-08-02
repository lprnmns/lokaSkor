import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import axios from 'axios';
import { ApiService } from '../base';
import { ErrorType } from '../types';
import { apiConfig } from '../config';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('ApiService', () => {
  let apiService: ApiService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      create: vi.fn().mockReturnThis(),
      request: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    apiService = new ApiService(apiConfig);
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: apiConfig.baseURL,
        timeout: apiConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request method', () => {
    it('should make successful request and return data', async () => {
      const mockData = { success: true, data: 'test' };
      mockAxiosInstance.request.mockResolvedValue({ data: mockData });

      const result = await (apiService as any).request({
        method: 'GET',
        url: '/test'
      });

      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test'
      });
    });

    it('should handle axios errors and convert to ApiError', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: { error: 'Server error' }
        }
      };
      mockAxiosInstance.request.mockRejectedValue(axiosError);

      await expect((apiService as any).request({
        method: 'GET',
        url: '/test'
      })).rejects.toMatchObject({
        type: ErrorType.SERVER_ERROR,
        code: 'SERVER_ERROR_500'
      });
    });

    it('should use cache for GET requests', async () => {
      const mockData = { success: true, data: 'cached' };
      
      // First request
      mockAxiosInstance.request.mockResolvedValue({ data: mockData });
      await (apiService as any).request({
        method: 'GET',
        url: '/test'
      });

      // Second request should use cache
      const result = await (apiService as any).request({
        method: 'GET',
        url: '/test'
      });

      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryRequest method', () => {
    it('should retry failed requests up to maxAttempts', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce({ type: ErrorType.NETWORK_ERROR, retryable: true })
        .mockRejectedValueOnce({ type: ErrorType.NETWORK_ERROR, retryable: true })
        .mockResolvedValue('success');

      const result = await (apiService as any).retryRequest(mockFn, 3);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValue({ type: ErrorType.VALIDATION_ERROR, retryable: false });

      await expect((apiService as any).retryRequest(mockFn, 3))
        .rejects.toMatchObject({ type: ErrorType.VALIDATION_ERROR });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max attempts', async () => {
      const mockError = { type: ErrorType.NETWORK_ERROR, retryable: true };
      const mockFn = vi.fn().mockRejectedValue(mockError);

      await expect((apiService as any).retryRequest(mockFn, 2))
        .rejects.toEqual(mockError);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache management', () => {
    it('should invalidate cache by pattern', () => {
      const cacheSpy = vi.spyOn((apiService as any).cache, 'invalidatePattern');
      
      apiService.invalidateCache('test-pattern');
      
      expect(cacheSpy).toHaveBeenCalledWith('test-pattern');
    });

    it('should clear all cache when no pattern provided', () => {
      const cacheSpy = vi.spyOn((apiService as any).cache, 'clear');
      
      apiService.invalidateCache();
      
      expect(cacheSpy).toHaveBeenCalled();
    });

    it('should return cache stats', () => {
      const mockStats = { size: 5, maxSize: 100, enabled: true };
      vi.spyOn((apiService as any).cache, 'getStats').mockReturnValue(mockStats);
      
      const stats = apiService.getCacheStats();
      
      expect(stats).toEqual(mockStats);
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200 });
      
      const result = await apiService.healthCheck();
      
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', { timeout: 5000 });
    });

    it('should return false for failed health check', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));
      
      const result = await apiService.healthCheck();
      
      expect(result).toBe(false);
    });
  });
});