/**
 * Intelligent Cache Invalidation System
 * Manages cache invalidation strategies and cache coherence
 */

import { EventEmitter } from 'events';
import { BusinessCategory, AnalysisMode, LatLng, MapBounds } from '../api/types';
import { ErrorLogger } from '../api/errors';

export interface CacheInvalidationRule {
  id: string;
  name: string;
  description: string;
  trigger: CacheInvalidationTrigger;
  scope: CacheInvalidationScope;
  strategy: 'immediate' | 'lazy' | 'scheduled' | 'conditional';
  condition?: (context: InvalidationContext) => boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  enabled: boolean;
}

export interface CacheInvalidationTrigger {
  type: 'parameter_change' | 'time_based' | 'data_change' | 'user_action' | 'system_event';
  parameters?: {
    categories?: BusinessCategory[];
    modes?: AnalysisMode[];
    timeThreshold?: number;
    dataTypes?: string[];
  };
}

export interface CacheInvalidationScope {
  type: 'specific' | 'category' | 'mode' | 'location' | 'global';
  targets: string[];
  patterns?: string[];
  excludePatterns?: string[];
}

export interface InvalidationContext {
  trigger: string;
  timestamp: Date;
  parameters: Record<string, unknown>;
  affectedKeys: string[];
  metadata?: Record<string, unknown>;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  ttl: number;
  accessCount: number;
  lastAccessed: Date;
  tags: string[];
  dependencies: string[];
}

export interface InvalidationStats {
  totalInvalidations: number;
  invalidationsByRule: Record<string, number>;
  invalidationsByTrigger: Record<string, number>;
  averageInvalidationTime: number;
  cacheHitRateAfterInvalidation: number;
  lastInvalidationTime: Date | null;
}

export class CacheInvalidationManager extends EventEmitter {
  private static instance: CacheInvalidationManager;
  private rules: Map<string, CacheInvalidationRule> = new Map();
  private cacheEntries: Map<string, CacheEntry> = new Map();
  private invalidationHistory: Array<{
    timestamp: Date;
    rule: string;
    trigger: string;
    keysInvalidated: string[];
    duration: number;
  }> = [];
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  private constructor() {
    super();
    this.initializeDefaultRules();
  }

  static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }

  /**
   * Add cache invalidation rule
   */
  addRule(rule: CacheInvalidationRule): void {
    this.rules.set(rule.id, rule);
    this.emit('rule_added', rule);
  }

  /**
   * Remove cache invalidation rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.emit('rule_removed', ruleId);
    }
    return removed;
  }

  /**
   * Register cache entry with metadata
   */
  registerCacheEntry(
    key: string,
    data: any,
    ttl: number = 300000, // 5 minutes default
    tags: string[] = [],
    dependencies: string[] = []
  ): void {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      ttl,
      accessCount: 0,
      lastAccessed: new Date(),
      tags,
      dependencies
    };

    this.cacheEntries.set(key, entry);
    
    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    // Update dependency graph
    dependencies.forEach(dep => {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(key);
    });
  }

  /**
   * Trigger cache invalidation based on context
   */
  async invalidate(context: InvalidationContext): Promise<string[]> {
    const startTime = Date.now();
    const invalidatedKeys: string[] = [];

    // Find applicable rules
    const applicableRules = this.findApplicableRules(context);
    
    // Sort rules by priority
    applicableRules.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Execute invalidation rules
    for (const rule of applicableRules) {
      try {
        const keysToInvalidate = await this.executeInvalidationRule(rule, context);
        invalidatedKeys.push(...keysToInvalidate);
      } catch (error) {
        ErrorLogger.error(`Cache invalidation rule failed: ${rule.id}`, error as any);
      }
    }

    // Remove duplicates
    const uniqueInvalidatedKeys = [...new Set(invalidatedKeys)];

    // Record invalidation history
    this.recordInvalidation(context, applicableRules, uniqueInvalidatedKeys, Date.now() - startTime);

    // Emit invalidation event
    this.emit('invalidation_completed', {
      context,
      invalidatedKeys: uniqueInvalidatedKeys,
      rulesApplied: applicableRules.length
    });

    return uniqueInvalidatedKeys;
  }

  /**
   * Invalidate cache by category
   */
  async invalidateByCategory(category: BusinessCategory): Promise<string[]> {
    const context: InvalidationContext = {
      trigger: 'category_change',
      timestamp: new Date(),
      parameters: { category },
      affectedKeys: []
    };

    return this.invalidate(context);
  }

  /**
   * Invalidate cache by analysis mode
   */
  async invalidateByMode(mode: AnalysisMode): Promise<string[]> {
    const context: InvalidationContext = {
      trigger: 'mode_change',
      timestamp: new Date(),
      parameters: { mode },
      affectedKeys: []
    };

    return this.invalidate(context);
  }

  /**
   * Invalidate cache by location
   */
  async invalidateByLocation(location: LatLng, radius: number = 1000): Promise<string[]> {
    const context: InvalidationContext = {
      trigger: 'location_change',
      timestamp: new Date(),
      parameters: { location, radius },
      affectedKeys: []
    };

    return this.invalidate(context);
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<string[]> {
    const keysToInvalidate = new Set<string>();
    
    tags.forEach(tag => {
      const taggedKeys = this.tagIndex.get(tag);
      if (taggedKeys) {
        taggedKeys.forEach(key => keysToInvalidate.add(key));
      }
    });

    const invalidatedKeys = Array.from(keysToInvalidate);
    
    // Remove from cache
    invalidatedKeys.forEach(key => {
      this.removeCacheEntry(key);
    });

    return invalidatedKeys;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern);
    const keysToInvalidate = Array.from(this.cacheEntries.keys())
      .filter(key => regex.test(key));

    keysToInvalidate.forEach(key => {
      this.removeCacheEntry(key);
    });

    return keysToInvalidate;
  }

  /**
   * Invalidate dependent cache entries
   */
  async invalidateDependencies(key: string): Promise<string[]> {
    const dependentKeys = this.findDependentKeys(key);
    
    dependentKeys.forEach(depKey => {
      this.removeCacheEntry(depKey);
    });

    return dependentKeys;
  }

  /**
   * Schedule cache invalidation
   */
  scheduleInvalidation(
    delay: number,
    context: InvalidationContext
  ): string {
    const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setTimeout(async () => {
      try {
        await this.invalidate(context);
      } catch (error) {
        ErrorLogger.error(`Scheduled cache invalidation failed: ${scheduleId}`, error as any);
      }
    }, delay);

    return scheduleId;
  }

  /**
   * Get cache invalidation statistics
   */
  getInvalidationStats(): InvalidationStats {
    const now = new Date();
    const recentInvalidations = this.invalidationHistory.filter(
      inv => now.getTime() - inv.timestamp.getTime() < 3600000 // Last hour
    );

    const invalidationsByRule: Record<string, number> = {};
    const invalidationsByTrigger: Record<string, number> = {};
    let totalDuration = 0;

    recentInvalidations.forEach(inv => {
      invalidationsByRule[inv.rule] = (invalidationsByRule[inv.rule] || 0) + 1;
      invalidationsByTrigger[inv.trigger] = (invalidationsByTrigger[inv.trigger] || 0) + 1;
      totalDuration += inv.duration;
    });

    return {
      totalInvalidations: recentInvalidations.length,
      invalidationsByRule,
      invalidationsByTrigger,
      averageInvalidationTime: recentInvalidations.length > 0 ? totalDuration / recentInvalidations.length : 0,
      cacheHitRateAfterInvalidation: this.calculateCacheHitRate(),
      lastInvalidationTime: this.invalidationHistory.length > 0 ? 
        this.invalidationHistory[this.invalidationHistory.length - 1].timestamp : null
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries(): string[] {
    const now = new Date();
    const expiredKeys: string[] = [];

    this.cacheEntries.forEach((entry, key) => {
      if (now.getTime() - entry.timestamp.getTime() > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.removeCacheEntry(key);
    });

    if (expiredKeys.length > 0) {
      this.emit('cleanup_completed', { expiredKeys: expiredKeys.length });
    }

    return expiredKeys;
  }

  private initializeDefaultRules(): void {
    // Rule 1: Invalidate point analysis cache when category changes
    this.addRule({
      id: 'category_change_point',
      name: 'Category Change - Point Analysis',
      description: 'Invalidate point analysis cache when business category changes',
      trigger: {
        type: 'parameter_change',
        parameters: { categories: ['eczane', 'firin', 'cafe', 'market', 'restoran'] }
      },
      scope: {
        type: 'category',
        targets: ['point_analysis'],
        patterns: ['analyzePoint:*']
      },
      strategy: 'immediate',
      priority: 'high',
      enabled: true
    });

    // Rule 2: Invalidate area analysis cache when area changes
    this.addRule({
      id: 'area_change',
      name: 'Area Change - Area Analysis',
      description: 'Invalidate area analysis cache when selected area changes',
      trigger: {
        type: 'parameter_change'
      },
      scope: {
        type: 'mode',
        targets: ['area_analysis'],
        patterns: ['analyzeArea:*']
      },
      strategy: 'immediate',
      priority: 'high',
      enabled: true
    });

    // Rule 3: Invalidate heatmap cache when bounds change
    this.addRule({
      id: 'bounds_change_heatmap',
      name: 'Bounds Change - Heatmap',
      description: 'Invalidate heatmap cache when map bounds change significantly',
      trigger: {
        type: 'parameter_change'
      },
      scope: {
        type: 'mode',
        targets: ['heatmap'],
        patterns: ['getHeatmapData:*']
      },
      strategy: 'lazy',
      priority: 'normal',
      enabled: true
    });

    // Rule 4: Time-based invalidation for stale data
    this.addRule({
      id: 'time_based_cleanup',
      name: 'Time-based Cleanup',
      description: 'Invalidate cache entries older than their TTL',
      trigger: {
        type: 'time_based',
        parameters: { timeThreshold: 300000 } // 5 minutes
      },
      scope: {
        type: 'global',
        targets: ['*']
      },
      strategy: 'scheduled',
      priority: 'low',
      enabled: true
    });

    // Rule 5: Location-based invalidation
    this.addRule({
      id: 'location_proximity',
      name: 'Location Proximity Invalidation',
      description: 'Invalidate cache for nearby locations when location changes',
      trigger: {
        type: 'parameter_change'
      },
      scope: {
        type: 'location',
        targets: ['point_analysis', 'heatmap']
      },
      strategy: 'conditional',
      condition: (context) => {
        // Only invalidate if location change is significant (>100m)
        return this.isSignificantLocationChange(context);
      },
      priority: 'normal',
      enabled: true
    });
  }

  private findApplicableRules(context: InvalidationContext): CacheInvalidationRule[] {
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.enabled) return false;
      
      // Check if rule condition is met
      if (rule.condition && !rule.condition(context)) {
        return false;
      }

      // Check trigger type match
      if (rule.trigger.type !== context.trigger) {
        return false;
      }

      return true;
    });
  }

  private async executeInvalidationRule(
    rule: CacheInvalidationRule,
    context: InvalidationContext
  ): Promise<string[]> {
    const keysToInvalidate: string[] = [];

    switch (rule.scope.type) {
      case 'specific':
        keysToInvalidate.push(...rule.scope.targets);
        break;
      case 'category':
        keysToInvalidate.push(...this.findKeysByCategory(context.parameters.category as BusinessCategory));
        break;
      case 'mode':
        keysToInvalidate.push(...this.findKeysByMode(context.parameters.mode as AnalysisMode));
        break;
      case 'location':
        keysToInvalidate.push(...this.findKeysByLocation(context.parameters.location as LatLng));
        break;
      case 'global':
        keysToInvalidate.push(...Array.from(this.cacheEntries.keys()));
        break;
    }

    // Apply pattern filters
    let filteredKeys = keysToInvalidate;
    
    if (rule.scope.patterns) {
      filteredKeys = filteredKeys.filter(key =>
        rule.scope.patterns!.some(pattern => new RegExp(pattern).test(key))
      );
    }

    if (rule.scope.excludePatterns) {
      filteredKeys = filteredKeys.filter(key =>
        !rule.scope.excludePatterns!.some(pattern => new RegExp(pattern).test(key))
      );
    }

    // Execute invalidation based on strategy
    switch (rule.strategy) {
      case 'immediate':
        filteredKeys.forEach(key => this.removeCacheEntry(key));
        break;
      case 'lazy':
        filteredKeys.forEach(key => this.markForLazyInvalidation(key));
        break;
      case 'scheduled':
        this.scheduleInvalidation(5000, context); // 5 second delay
        break;
      case 'conditional':
        if (rule.condition && rule.condition(context)) {
          filteredKeys.forEach(key => this.removeCacheEntry(key));
        }
        break;
    }

    return filteredKeys;
  }

  private findKeysByCategory(category: BusinessCategory): string[] {
    return Array.from(this.cacheEntries.keys())
      .filter(key => key.includes(category));
  }

  private findKeysByMode(mode: AnalysisMode): string[] {
    const modePatterns = {
      point: 'analyzePoint',
      area: 'analyzeArea',
      heatmap: 'getHeatmapData'
    };

    const pattern = modePatterns[mode];
    return Array.from(this.cacheEntries.keys())
      .filter(key => key.includes(pattern));
  }

  private findKeysByLocation(location: LatLng): string[] {
    // This would implement spatial indexing for location-based cache keys
    // For now, return keys that contain coordinate information
    return Array.from(this.cacheEntries.keys())
      .filter(key => key.includes(`${location.lat}`) || key.includes(`${location.lng}`));
  }

  private findDependentKeys(key: string): string[] {
    const dependents = this.dependencyGraph.get(key);
    return dependents ? Array.from(dependents) : [];
  }

  private removeCacheEntry(key: string): void {
    const entry = this.cacheEntries.get(key);
    if (!entry) return;

    // Remove from main cache
    this.cacheEntries.delete(key);

    // Remove from tag index
    entry.tags.forEach(tag => {
      const taggedKeys = this.tagIndex.get(tag);
      if (taggedKeys) {
        taggedKeys.delete(key);
        if (taggedKeys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    // Remove from dependency graph
    entry.dependencies.forEach(dep => {
      const dependents = this.dependencyGraph.get(dep);
      if (dependents) {
        dependents.delete(key);
        if (dependents.size === 0) {
          this.dependencyGraph.delete(dep);
        }
      }
    });
  }

  private markForLazyInvalidation(key: string): void {
    const entry = this.cacheEntries.get(key);
    if (entry) {
      // Mark entry as stale but don't remove immediately
      entry.ttl = 0; // Will be cleaned up on next access or cleanup cycle
    }
  }

  private isSignificantLocationChange(context: InvalidationContext): boolean {
    // This would implement logic to determine if location change is significant
    // For now, always return true
    return true;
  }

  private recordInvalidation(
    context: InvalidationContext,
    rules: CacheInvalidationRule[],
    invalidatedKeys: string[],
    duration: number
  ): void {
    rules.forEach(rule => {
      this.invalidationHistory.push({
        timestamp: context.timestamp,
        rule: rule.id,
        trigger: context.trigger,
        keysInvalidated: invalidatedKeys,
        duration
      });
    });

    // Keep only recent history (last 1000 entries)
    if (this.invalidationHistory.length > 1000) {
      this.invalidationHistory = this.invalidationHistory.slice(-1000);
    }
  }

  private calculateCacheHitRate(): number {
    const totalAccesses = Array.from(this.cacheEntries.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    const totalEntries = this.cacheEntries.size;
    
    return totalEntries > 0 ? (totalAccesses / totalEntries) * 100 : 0;
  }
}