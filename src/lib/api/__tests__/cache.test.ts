import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiCache } from '../cache';

describe('ApiCache', () => {
  let cache: ApiCache;

  beforeEach(() => {
    cache = new ApiCache({
      defaultTTL: 1000, // 1 second for testing
      maxSize: 3,
      enableCache: true
    });
  });

  describe('basic operations', () => {
    it('should store and retrieve data', () => {
      const testData = { test: 'data' };
      
      cache.set('/test', testData);
      const result = cache.get('/test');
      
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('/non-existent');
      
      expect(result).toBeNull();
    });

    it('should handle parameters in cache key', () => {
      const testData = { test: 'data' };
      const params = { id: 1, name: 'test' };
      
      cache.set('/test', testData, params);
      const result = cache.get('/test', params);
      
      expect(result).toEqual(testData);
    });

    it('should differentiate between different parameters', () => {
      const testData1 = { test: 'data1' };
      const testData2 = { test: 'data2' };
      
      cache.set('/test', testData1, { id: 1 });
      cache.set('/test', testData2, { id: 2 });
      
      expect(cache.get('/test', { id: 1 })).toEqual(testData1);
      expect(cache.get('/test', { id: 2 })).toEqual(testData2);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire data after TTL', async () => {
      const testData = { test: 'data' };
      
      cache.set('/test', testData);
      expect(cache.get('/test')).toEqual(testData);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cache.get('/test')).toBeNull();
    });

    it('should use custom TTL when provided', async () => {
      const testData = { test: 'data' };
      
      cache.set('/test', testData, undefined, 2000); // 2 seconds
      
      // Should still be available after default TTL
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('/test')).toEqual(testData);
    });
  });

  describe('cache size management', () => {
    it('should evict oldest entries when max size reached', () => {
      cache.set('/test1', { data: 1 });
      cache.set('/test2', { data: 2 });
      cache.set('/test3', { data: 3 });
      cache.set('/test4', { data: 4 }); // Should evict /test1
      
      expect(cache.get('/test1')).toBeNull();
      expect(cache.get('/test2')).toEqual({ data: 2 });
      expect(cache.get('/test3')).toEqual({ data: 3 });
      expect(cache.get('/test4')).toEqual({ data: 4 });
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate specific entries', () => {
      cache.set('/test1', { data: 1 });
      cache.set('/test2', { data: 2 });
      
      cache.invalidate('/test1');
      
      expect(cache.get('/test1')).toBeNull();
      expect(cache.get('/test2')).toEqual({ data: 2 });
    });

    it('should invalidate entries by pattern', () => {
      cache.set('/api/users/1', { user: 1 });
      cache.set('/api/users/2', { user: 2 });
      cache.set('/api/posts/1', { post: 1 });
      
      cache.invalidatePattern('/api/users');
      
      expect(cache.get('/api/users/1')).toBeNull();
      expect(cache.get('/api/users/2')).toBeNull();
      expect(cache.get('/api/posts/1')).toEqual({ post: 1 });
    });

    it('should clear all cache entries', () => {
      cache.set('/test1', { data: 1 });
      cache.set('/test2', { data: 2 });
      
      cache.clear();
      
      expect(cache.get('/test1')).toBeNull();
      expect(cache.get('/test2')).toBeNull();
    });
  });

  describe('disabled cache', () => {
    beforeEach(() => {
      cache = new ApiCache({ enableCache: false });
    });

    it('should not store data when cache is disabled', () => {
      cache.set('/test', { data: 'test' });
      const result = cache.get('/test');
      
      expect(result).toBeNull();
    });
  });

  describe('cache stats', () => {
    it('should return correct cache statistics', () => {
      cache.set('/test1', { data: 1 });
      cache.set('/test2', { data: 2 });
      
      const stats = cache.getStats();
      
      expect(stats).toEqual({
        size: 2,
        maxSize: 3,
        enabled: true
      });
    });
  });
});