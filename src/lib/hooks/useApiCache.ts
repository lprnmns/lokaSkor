/**
 * React Hook for API Caching Management
 * Provides intelligent caching with TTL and invalidation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { locationAnalysisService } from '../api';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface UseApiCacheOptions {
  defaultTTL?: number;
  maxSize?: number;
  enablePersistence?: boolean;
  storageKey?: string;
}

export interface ApiCacheState {
  size: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  lastCleared: Date | null;
}

export interface UseApiCacheReturn {
  state: ApiCacheState;
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  invalidatePattern: (pattern: string) => void;
  preload: <T>(key: string, dataLoader: () => Promise<T>, ttl?: number) => Promise<T>;
  getStats: () => ApiCacheState;
  exportCache: () => string;
  importCache: (cacheData: string) => void;
}

export function useApiCache(options: UseApiCacheOptions = {}): UseApiCacheReturn {
  const {
    defaultTTL = 5 * 60 * 1000, // 5 minutes
    maxSize = 100,
    enablePersistence = false,
    storageKey = 'api-cache'
  } = options;

  // Cache storage
  const cacheRef = useRef<Map<string, CacheEntry<any>>>(new Map());
  const statsRef = useRef({
    totalRequests: 0,
    cacheHits: 0,
    lastCleared: null as Date | null
  });

  // State for cache statistics
  const [state, setState] = useState<ApiCacheState>({
    size: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    lastCleared: null
  });

  // Update state from refs
  const updateState = useCallback(() => {
    const cache = cacheRef.current;
    const stats = statsRef.current;
    
    setState({
      size: cache.size,
      hitRate: stats.totalRequests > 0 ? (stats.cacheHits / stats.totalRequests) * 100 : 0,
      totalRequests: stats.totalRequests,
      cacheHits: stats.cacheHits,
      lastCleared: stats.lastCleared
    });
  }, []);

  // Load cache from localStorage on mount
  useEffect(() => {
    if (enablePersistence) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const cache = new Map();
          
          // Restore cache entries, filtering out expired ones
          const now = Date.now();
          for (const [key, entry] of parsed.entries) {
            if (now - entry.timestamp < entry.ttl) {
              cache.set(key, entry);
            }
          }
          
          cacheRef.current = cache;
          updateState();
        }
      } catch (error) {
        console.warn('Failed to load cache from localStorage:', error);
      }
    }
  }, [enablePersistence, storageKey, updateState]);

  // Save cache to localStorage
  const saveToStorage = useCallback(() => {
    if (enablePersistence) {
      try {
        const cacheData = {
          entries: Array.from(cacheRef.current.entries()),
          timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Failed to save cache to localStorage:', error);
      }
    }
  }, [enablePersistence, storageKey]);

  // Clean expired entries
  const cleanExpired = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    let cleaned = false;

    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
        cleaned = true;
      }
    }

    if (cleaned) {
      updateState();
      saveToStorage();
    }
  }, [updateState, saveToStorage]);

  // Enforce cache size limit
  const enforceSizeLimit = useCallback(() => {
    const cache = cacheRef.current;
    
    if (cache.size > maxSize) {
      // Remove oldest entries
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, cache.size - maxSize);
      toRemove.forEach(([key]) => cache.delete(key));
      
      updateState();
      saveToStorage();
    }
  }, [maxSize, updateState, saveToStorage]);

  // Get data from cache
  const get = useCallback(<T>(key: string): T | null => {
    const cache = cacheRef.current;
    const stats = statsRef.current;
    
    stats.totalRequests++;
    
    const entry = cache.get(key);
    if (!entry) {
      updateState();
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      updateState();
      saveToStorage();
      return null;
    }

    stats.cacheHits++;
    updateState();
    return entry.data as T;
  }, [updateState, saveToStorage]);

  // Set data in cache
  const set = useCallback(<T>(key: string, data: T, ttl = defaultTTL) => {
    const cache = cacheRef.current;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    cache.set(key, entry);
    
    // Clean expired entries and enforce size limit
    cleanExpired();
    enforceSizeLimit();
    
    updateState();
    saveToStorage();
  }, [defaultTTL, cleanExpired, enforceSizeLimit, updateState, saveToStorage]);

  // Remove specific key
  const remove = useCallback((key: string) => {
    const cache = cacheRef.current;
    cache.delete(key);
    updateState();
    saveToStorage();
  }, [updateState, saveToStorage]);

  // Clear all cache
  const clear = useCallback(() => {
    cacheRef.current.clear();
    statsRef.current = {
      totalRequests: 0,
      cacheHits: 0,
      lastCleared: new Date()
    };
    updateState();
    saveToStorage();
  }, [updateState, saveToStorage]);

  // Invalidate cache entries matching pattern
  const invalidatePattern = useCallback((pattern: string) => {
    const cache = cacheRef.current;
    const regex = new RegExp(pattern);
    let removed = false;

    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
        removed = true;
      }
    }

    if (removed) {
      updateState();
      saveToStorage();
    }
  }, [updateState, saveToStorage]);

  // Preload data into cache
  const preload = useCallback(async <T>(
    key: string, 
    dataLoader: () => Promise<T>, 
    ttl = defaultTTL
  ): Promise<T> => {
    // Check if already cached
    const cached = get<T>(key);
    if (cached) {
      return cached;
    }

    // Load and cache data
    try {
      const data = await dataLoader();
      set(key, data, ttl);
      return data;
    } catch (error) {
      throw error;
    }
  }, [defaultTTL, get, set]);

  // Get cache statistics
  const getStats = useCallback((): ApiCacheState => {
    return { ...state };
  }, [state]);

  // Export cache data
  const exportCache = useCallback((): string => {
    const cache = cacheRef.current;
    const stats = statsRef.current;
    
    const exportData = {
      entries: Array.from(cache.entries()),
      stats,
      timestamp: Date.now()
    };
    
    return JSON.stringify(exportData);
  }, []);

  // Import cache data
  const importCache = useCallback((cacheData: string) => {
    try {
      const parsed = JSON.parse(cacheData);
      const cache = new Map();
      
      // Import entries, filtering out expired ones
      const now = Date.now();
      for (const [key, entry] of parsed.entries) {
        if (now - entry.timestamp < entry.ttl) {
          cache.set(key, entry);
        }
      }
      
      cacheRef.current = cache;
      
      // Import stats if available
      if (parsed.stats) {
        statsRef.current = { ...parsed.stats };
      }
      
      updateState();
      saveToStorage();
    } catch (error) {
      console.error('Failed to import cache data:', error);
    }
  }, [updateState, saveToStorage]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpired();
    }, 60000); // Clean every minute

    return () => clearInterval(interval);
  }, [cleanExpired]);

  return {
    state,
    get,
    set,
    remove,
    clear,
    invalidatePattern,
    preload,
    getStats,
    exportCache,
    importCache
  };
}

// Hook for location analysis specific caching
export function useLocationCache() {
  const cache = useApiCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes for location data
    maxSize: 50,
    enablePersistence: true,
    storageKey: 'location-analysis-cache'
  });

  // Specialized methods for location analysis
  const cachePointAnalysis = useCallback((lat: number, lon: number, kategori: string, data: any) => {
    const key = `point:${lat}:${lon}:${kategori}`;
    cache.set(key, data, 2 * 60 * 1000); // 2 minutes for point analysis
  }, [cache]);

  const getCachedPointAnalysis = useCallback((lat: number, lon: number, kategori: string) => {
    const key = `point:${lat}:${lon}:${kategori}`;
    return cache.get(key);
  }, [cache]);

  const cacheAreaAnalysis = useCallback((mahalle: string, kategori: string, data: any) => {
    const key = `area:${mahalle}:${kategori}`;
    cache.set(key, data, 5 * 60 * 1000); // 5 minutes for area analysis
  }, [cache]);

  const getCachedAreaAnalysis = useCallback((mahalle: string, kategori: string) => {
    const key = `area:${mahalle}:${kategori}`;
    return cache.get(key);
  }, [cache]);

  const cacheHeatmapData = useCallback((bounds: any, kategori: string, data: any) => {
    const key = `heatmap:${JSON.stringify(bounds)}:${kategori}`;
    cache.set(key, data, 3 * 60 * 1000); // 3 minutes for heatmap data
  }, [cache]);

  const getCachedHeatmapData = useCallback((bounds: any, kategori: string) => {
    const key = `heatmap:${JSON.stringify(bounds)}:${kategori}`;
    return cache.get(key);
  }, [cache]);

  const invalidateLocationCache = useCallback((kategori?: string) => {
    if (kategori) {
      cache.invalidatePattern(`.*:${kategori}`);
    } else {
      cache.clear();
    }
  }, [cache]);

  return {
    ...cache,
    cachePointAnalysis,
    getCachedPointAnalysis,
    cacheAreaAnalysis,
    getCachedAreaAnalysis,
    cacheHeatmapData,
    getCachedHeatmapData,
    invalidateLocationCache
  };
}