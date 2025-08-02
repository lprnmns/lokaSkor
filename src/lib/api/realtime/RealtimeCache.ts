/**
 * Realtime Data Cache
 * Intelligent caching system for real-time data with TTL and invalidation
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  version: number;
  metadata?: {
    source: 'api' | 'websocket' | 'eventsource' | 'polling';
    requestId?: string;
    tags?: string[];
  };
}

export interface CacheOptions {
  defaultTTL?: number;
  maxSize?: number;
  enableCompression?: boolean;
  enablePersistence?: boolean;
  storageKey?: string;
  debug?: boolean;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  memoryUsage: number;
}

export class RealtimeCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private version = 1;

  constructor(options: CacheOptions = {}) {
    this.options = {
      defaultTTL: options.defaultTTL || 300000, // 5 minutes
      maxSize: options.maxSize || 1000,
      enableCompression: options.enableCompression || false,
      enablePersistence: options.enablePersistence || false,
      storageKey: options.storageKey || 'realtime-cache',
      debug: options.debug || false
    };

    // Load from localStorage if persistence is enabled
    if (this.options.enablePersistence) {
      this.loadFromStorage();
    }

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get data from cache
   */
  public get<T = any>(key: string): T | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.log(`Cache miss for key: ${key}`);
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.log(`Cache expired for key: ${key}`);
      return null;
    }

    this.stats.hits++;
    this.log(`Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Set data in cache
   */
  public set<T = any>(
    key: string, 
    data: T, 
    ttl?: number, 
    metadata?: CacheEntry['metadata']
  ): void {
    // Check cache size limit
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data: this.options.enableCompression ? this.compress(data) : data,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTTL,
      key,
      version: this.version,
      metadata
    };

    this.cache.set(key, entry);
    this.log(`Cache set for key: ${key}, TTL: ${entry.ttl}ms`);

    // Persist to storage if enabled
    if (this.options.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Update existing cache entry
   */
  public update<T = any>(key: string, updater: (current: T | null) => T): void {
    const current = this.get<T>(key);
    const updated = updater(current);
    
    // Preserve existing TTL and metadata if updating existing entry
    const existingEntry = this.cache.get(key);
    const ttl = existingEntry ? existingEntry.ttl - (Date.now() - existingEntry.timestamp) : undefined;
    const metadata = existingEntry?.metadata;

    this.set(key, updated, ttl, metadata);
  }

  /**
   * Delete data from cache
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.log(`Cache deleted for key: ${key}`);
      
      if (this.options.enablePersistence) {
        this.saveToStorage();
      }
    }
    return deleted;
  }

  /**
   * Check if key exists in cache and is not expired
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.log('Cache cleared');
    
    if (this.options.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Invalidate cache entries by pattern or tags
   */
  public invalidate(pattern?: string | RegExp, tags?: string[]): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      let shouldInvalidate = false;

      // Check pattern match
      if (pattern) {
        if (typeof pattern === 'string') {
          shouldInvalidate = key.includes(pattern);
        } else {
          shouldInvalidate = pattern.test(key);
        }
      }

      // Check tag match
      if (tags && entry.metadata?.tags) {
        shouldInvalidate = shouldInvalidate || tags.some(tag => 
          entry.metadata!.tags!.includes(tag)
        );
      }

      if (shouldInvalidate) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.log(`Invalidated ${invalidated} cache entries`);
    
    if (invalidated > 0 && this.options.enablePersistence) {
      this.saveToStorage();
    }

    return invalidated;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
      totalRequests: this.stats.totalRequests,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Get all cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries by pattern
   */
  public getByPattern(pattern: string | RegExp): Array<{ key: string; data: any }> {
    const results: Array<{ key: string; data: any }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        let matches = false;
        
        if (typeof pattern === 'string') {
          matches = key.includes(pattern);
        } else {
          matches = pattern.test(key);
        }

        if (matches) {
          results.push({
            key,
            data: this.options.enableCompression ? this.decompress(entry.data) : entry.data
          });
        }
      }
    }

    return results;
  }

  /**
   * Refresh cache entry TTL
   */
  public refresh(key: string, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      return false;
    }

    entry.timestamp = Date.now();
    entry.ttl = ttl || this.options.defaultTTL;
    
    this.log(`Cache refreshed for key: ${key}`);
    return true;
  }

  /**
   * Cleanup expired entries
   */
  public cleanup(): number {
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.log(`Cleaned up ${cleaned} expired cache entries`);
      
      if (this.options.enablePersistence) {
        this.saveToStorage();
      }
    }

    return cleaned;
  }

  /**
   * Destroy cache and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.cache.clear();
    this.log('Cache destroyed');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log(`Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    // Run cleanup every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const entry of this.cache.values()) {
      // Rough estimation of memory usage
      size += JSON.stringify(entry).length * 2; // UTF-16 encoding
    }
    
    return size;
  }

  /**
   * Compress data (simple JSON compression)
   */
  private compress<T>(data: T): string {
    return JSON.stringify(data);
  }

  /**
   * Decompress data
   */
  private decompress<T>(compressed: string): T {
    return JSON.parse(compressed);
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const cacheData = {
        version: this.version,
        timestamp: Date.now(),
        entries: Array.from(this.cache.entries())
      };

      localStorage.setItem(this.options.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      this.log(`Failed to save cache to storage: ${error}`, 'error');
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (!stored) return;

      const cacheData = JSON.parse(stored);
      
      // Check version compatibility
      if (cacheData.version !== this.version) {
        this.log('Cache version mismatch, clearing storage');
        localStorage.removeItem(this.options.storageKey);
        return;
      }

      // Restore cache entries
      for (const [key, entry] of cacheData.entries) {
        // Only restore non-expired entries
        if (!this.isExpired(entry)) {
          this.cache.set(key, entry);
        }
      }

      this.log(`Loaded ${this.cache.size} cache entries from storage`);
    } catch (error) {
      this.log(`Failed to load cache from storage: ${error}`, 'error');
      localStorage.removeItem(this.options.storageKey);
    }
  }

  /**
   * Log message if debug is enabled
   */
  private log(message: string, level: 'log' | 'error' = 'log'): void {
    if (this.options.debug) {
      if (level === 'error') {
        console.error(`[RealtimeCache] ${message}`);
      } else {
        console.log(`[RealtimeCache] ${message}`);
      }
    }
  }
}

// Global cache instance
export const realtimeCache = new RealtimeCache({
  defaultTTL: 300000, // 5 minutes
  maxSize: 1000,
  enablePersistence: true,
  debug: process.env.NODE_ENV === 'development'
});