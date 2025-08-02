/**
 * Real-time Data Update Manager
 * Manages automatic refresh, cache invalidation, and optimistic updates
 */

import { EventEmitter } from 'events';
import { BusinessCategory, AnalysisMode, LatLng, MapBounds } from '../api/types';
import { locationAnalysisService } from '../api/services';
import { ErrorLogger } from '../api/errors';

export interface UpdateTrigger {
  id: string;
  type: 'parameter_change' | 'time_based' | 'user_action' | 'cache_invalidation';
  source: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface UpdateSubscription {
  id: string;
  callback: (data: any, trigger: UpdateTrigger) => void;
  filters?: {
    categories?: BusinessCategory[];
    modes?: AnalysisMode[];
    locations?: LatLng[];
    areas?: string[];
  };
  debounceMs?: number;
  throttleMs?: number;
  priority?: 'low' | 'normal' | 'high';
  active: boolean;
}

export interface UpdateConfig {
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
  enableOptimisticUpdates: boolean;
  enableIntelligentCaching: boolean;
  maxConcurrentUpdates: number;
  retryFailedUpdates: boolean;
  batchUpdates: boolean;
  debugMode: boolean;
}

export interface PendingUpdate {
  id: string;
  operation: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
  retryCount: number;
  priority: 'low' | 'normal' | 'high';
  callback?: (result: any) => void;
  errorCallback?: (error: any) => void;
}

export class DataUpdateManager extends EventEmitter {
  private static instance: DataUpdateManager;
  private subscriptions: Map<string, UpdateSubscription> = new Map();
  private pendingUpdates: Map<string, PendingUpdate> = new Map();
  private activeUpdates: Set<string> = new Set();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastUpdateTimes: Map<string, Date> = new Map();
  private updateQueue: PendingUpdate[] = [];
  private isProcessingQueue = false;

  private config: UpdateConfig = {
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    enableOptimisticUpdates: true,
    enableIntelligentCaching: true,
    maxConcurrentUpdates: 5,
    retryFailedUpdates: true,
    batchUpdates: true,
    debugMode: process.env.NODE_ENV === 'development'
  };

  private constructor() {
    super();
    this.setupGlobalRefreshTimer();
    this.setupQueueProcessor();
  }

  static getInstance(): DataUpdateManager {
    if (!DataUpdateManager.instance) {
      DataUpdateManager.instance = new DataUpdateManager();
    }
    return DataUpdateManager.instance;
  }

  /**
   * Subscribe to data updates
   */
  subscribe(
    callback: (data: any, trigger: UpdateTrigger) => void,
    filters?: UpdateSubscription['filters'],
    options?: {
      debounceMs?: number;
      throttleMs?: number;
      priority?: 'low' | 'normal' | 'high';
    }
  ): string {
    const subscription: UpdateSubscription = {
      id: this.generateId(),
      callback,
      filters,
      debounceMs: options?.debounceMs || 500,
      throttleMs: options?.throttleMs,
      priority: options?.priority || 'normal',
      active: true
    };

    this.subscriptions.set(subscription.id, subscription);

    if (this.config.debugMode) {
      console.log(`[DataUpdateManager] New subscription: ${subscription.id}`);
    }

    return subscription.id;
  }

  /**
   * Unsubscribe from data updates
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    
    if (this.config.debugMode && removed) {
      console.log(`[DataUpdateManager] Removed subscription: ${subscriptionId}`);
    }

    return removed;
  }

  /**
   * Trigger data update for specific parameters
   */
  async triggerUpdate(
    operation: string,
    parameters: Record<string, unknown>,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      optimistic?: boolean;
      immediate?: boolean;
      callback?: (result: any) => void;
      errorCallback?: (error: any) => void;
    }
  ): Promise<string> {
    const updateId = this.generateId();
    const trigger: UpdateTrigger = {
      id: updateId,
      type: 'user_action',
      source: operation,
      timestamp: new Date(),
      data: parameters
    };

    // Handle optimistic updates
    if (options?.optimistic && this.config.enableOptimisticUpdates) {
      this.handleOptimisticUpdate(operation, parameters, trigger);
    }

    const pendingUpdate: PendingUpdate = {
      id: updateId,
      operation,
      parameters,
      timestamp: new Date(),
      retryCount: 0,
      priority: options?.priority || 'normal',
      callback: options?.callback,
      errorCallback: options?.errorCallback
    };

    if (options?.immediate) {
      this.executeUpdate(pendingUpdate, trigger);
    } else {
      this.queueUpdate(pendingUpdate, trigger);
    }

    return updateId;
  }

  /**
   * Trigger parameter change update
   */
  async onParameterChange(
    category: BusinessCategory,
    mode: AnalysisMode,
    location?: LatLng,
    area?: string,
    options?: { debounce?: boolean }
  ): Promise<void> {
    const trigger: UpdateTrigger = {
      id: this.generateId(),
      type: 'parameter_change',
      source: 'parameter_change',
      timestamp: new Date(),
      data: { category, mode, location, area }
    };

    // Invalidate related cache entries
    if (this.config.enableIntelligentCaching) {
      this.invalidateRelatedCache(category, mode, location, area);
    }

    // Determine which operations need to be updated
    const operations = this.determineRequiredOperations(mode, location, area);

    // Execute updates with debouncing if requested
    for (const operation of operations) {
      const parameters = this.buildOperationParameters(operation, category, location, area);
      
      if (options?.debounce) {
        this.debounceUpdate(operation, parameters, trigger);
      } else {
        await this.executeOperationUpdate(operation, parameters, trigger);
      }
    }
  }

  /**
   * Enable/disable auto-refresh for specific data types
   */
  setAutoRefresh(
    enabled: boolean,
    interval?: number,
    filters?: {
      categories?: BusinessCategory[];
      modes?: AnalysisMode[];
    }
  ): void {
    this.config.autoRefresh = enabled;
    
    if (interval) {
      this.config.refreshInterval = interval;
    }

    if (enabled) {
      this.setupGlobalRefreshTimer();
    } else {
      this.clearRefreshTimers();
    }

    this.emit('config_changed', { autoRefresh: enabled, interval, filters });
  }

  /**
   * Force refresh all active subscriptions
   */
  async forceRefreshAll(): Promise<void> {
    const trigger: UpdateTrigger = {
      id: this.generateId(),
      type: 'user_action',
      source: 'force_refresh',
      timestamp: new Date()
    };

    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.active);

    for (const subscription of activeSubscriptions) {
      try {
        // This would trigger refresh for each subscription's data
        await this.refreshSubscriptionData(subscription, trigger);
      } catch (error) {
        ErrorLogger.error(`Failed to refresh subscription ${subscription.id}`, error as any);
      }
    }
  }

  /**
   * Get update statistics
   */
  getUpdateStats(): {
    activeSubscriptions: number;
    pendingUpdates: number;
    activeUpdates: number;
    queueLength: number;
    lastUpdateTime: Date | null;
    updateFrequency: number;
  } {
    const now = new Date();
    const recentUpdates = Array.from(this.lastUpdateTimes.values())
      .filter(time => now.getTime() - time.getTime() < 60000); // Last minute

    return {
      activeSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.active).length,
      pendingUpdates: this.pendingUpdates.size,
      activeUpdates: this.activeUpdates.size,
      queueLength: this.updateQueue.length,
      lastUpdateTime: this.getLastUpdateTime(),
      updateFrequency: recentUpdates.length
    };
  }

  /**
   * Configure update behavior
   */
  configure(config: Partial<UpdateConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.autoRefresh !== undefined) {
      this.setAutoRefresh(config.autoRefresh, config.refreshInterval);
    }

    this.emit('config_changed', this.config);
  }

  /**
   * Clear all pending updates and reset state
   */
  reset(): void {
    this.clearRefreshTimers();
    this.pendingUpdates.clear();
    this.activeUpdates.clear();
    this.updateQueue = [];
    this.lastUpdateTimes.clear();
    
    this.emit('reset');
  }

  private setupGlobalRefreshTimer(): void {
    this.clearRefreshTimers();
    
    if (this.config.autoRefresh) {
      const timer = setInterval(() => {
        this.performScheduledRefresh();
      }, this.config.refreshInterval);
      
      this.refreshTimers.set('global', timer);
    }
  }

  private clearRefreshTimers(): void {
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();
  }

  private async performScheduledRefresh(): Promise<void> {
    const trigger: UpdateTrigger = {
      id: this.generateId(),
      type: 'time_based',
      source: 'scheduled_refresh',
      timestamp: new Date()
    };

    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.active);

    // Batch refresh operations to avoid overwhelming the API
    const batches = this.createRefreshBatches(activeSubscriptions);
    
    for (const batch of batches) {
      await this.processBatch(batch, trigger);
      
      // Small delay between batches to prevent API overload
      if (batches.length > 1) {
        await this.sleep(100);
      }
    }
  }

  private createRefreshBatches(subscriptions: UpdateSubscription[]): UpdateSubscription[][] {
    const batchSize = Math.max(1, Math.floor(this.config.maxConcurrentUpdates / 2));
    const batches: UpdateSubscription[][] = [];
    
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      batches.push(subscriptions.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private async processBatch(batch: UpdateSubscription[], trigger: UpdateTrigger): Promise<void> {
    const promises = batch.map(subscription => 
      this.refreshSubscriptionData(subscription, trigger)
    );
    
    await Promise.allSettled(promises);
  }

  private async refreshSubscriptionData(
    subscription: UpdateSubscription,
    trigger: UpdateTrigger
  ): Promise<void> {
    try {
      // This would determine what data to refresh based on subscription filters
      // For now, we'll emit a refresh event that the subscription can handle
      this.notifySubscription(subscription, null, trigger);
    } catch (error) {
      ErrorLogger.error(`Failed to refresh subscription ${subscription.id}`, error as any);
    }
  }

  private setupQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.updateQueue.length > 0) {
        this.processUpdateQueue();
      }
    }, 100); // Process queue every 100ms
  }

  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    try {
      while (this.updateQueue.length > 0 && this.activeUpdates.size < this.config.maxConcurrentUpdates) {
        // Sort by priority and timestamp
        this.updateQueue.sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          
          if (priorityDiff !== 0) return priorityDiff;
          return a.timestamp.getTime() - b.timestamp.getTime();
        });

        const update = this.updateQueue.shift();
        if (update) {
          const trigger: UpdateTrigger = {
            id: this.generateId(),
            type: 'user_action',
            source: update.operation,
            timestamp: new Date(),
            data: update.parameters
          };
          
          this.executeUpdate(update, trigger);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private queueUpdate(update: PendingUpdate, trigger: UpdateTrigger): void {
    this.updateQueue.push(update);
    this.pendingUpdates.set(update.id, update);
    
    if (this.config.debugMode) {
      console.log(`[DataUpdateManager] Queued update: ${update.operation}`);
    }
  }

  private async executeUpdate(update: PendingUpdate, trigger: UpdateTrigger): Promise<void> {
    this.activeUpdates.add(update.id);
    this.pendingUpdates.delete(update.id);
    
    try {
      const result = await this.executeOperationUpdate(update.operation, update.parameters, trigger);
      
      if (update.callback) {
        update.callback(result);
      }
      
      this.lastUpdateTimes.set(update.operation, new Date());
      
    } catch (error) {
      if (this.config.retryFailedUpdates && update.retryCount < 3) {
        update.retryCount++;
        this.queueUpdate(update, trigger);
      } else if (update.errorCallback) {
        update.errorCallback(error);
      }
      
      ErrorLogger.error(`Update failed: ${update.operation}`, error as any);
    } finally {
      this.activeUpdates.delete(update.id);
    }
  }

  private async executeOperationUpdate(
    operation: string,
    parameters: Record<string, unknown>,
    trigger: UpdateTrigger
  ): Promise<any> {
    switch (operation) {
      case 'analyzePoint':
        return await locationAnalysisService.analyzePoint(parameters as any);
      case 'analyzeArea':
        return await locationAnalysisService.analyzeArea(
          parameters.mahalle as string,
          parameters.kategori as BusinessCategory
        );
      case 'getHeatmapData':
        return await locationAnalysisService.getHeatmapData(parameters as any);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private handleOptimisticUpdate(
    operation: string,
    parameters: Record<string, unknown>,
    trigger: UpdateTrigger
  ): void {
    // Generate optimistic data based on operation type
    const optimisticData = this.generateOptimisticData(operation, parameters);
    
    // Notify subscriptions with optimistic data
    this.notifySubscriptions(optimisticData, { ...trigger, type: 'user_action' });
  }

  private generateOptimisticData(operation: string, parameters: Record<string, unknown>): any {
    // Generate placeholder data for immediate UI feedback
    switch (operation) {
      case 'analyzePoint':
        return {
          optimistic: true,
          total_score: 0,
          normalized_score: 0,
          loading: true
        };
      case 'analyzeArea':
        return {
          optimistic: true,
          mahalle: parameters.mahalle,
          kategori: parameters.kategori,
          loading: true
        };
      case 'getHeatmapData':
        return {
          optimistic: true,
          heatmap_data: [],
          loading: true
        };
      default:
        return { optimistic: true, loading: true };
    }
  }

  private notifySubscriptions(data: any, trigger: UpdateTrigger): void {
    this.subscriptions.forEach(subscription => {
      if (subscription.active && this.matchesFilters(subscription, trigger)) {
        this.notifySubscription(subscription, data, trigger);
      }
    });
  }

  private notifySubscription(
    subscription: UpdateSubscription,
    data: any,
    trigger: UpdateTrigger
  ): void {
    try {
      // Apply debouncing if configured
      if (subscription.debounceMs) {
        this.debounceCallback(subscription, data, trigger);
      } else {
        subscription.callback(data, trigger);
      }
    } catch (error) {
      ErrorLogger.error(`Subscription callback failed: ${subscription.id}`, error as any);
    }
  }

  private debounceCallback(
    subscription: UpdateSubscription,
    data: any,
    trigger: UpdateTrigger
  ): void {
    const timerId = `callback-${subscription.id}`;
    
    if (this.refreshTimers.has(timerId)) {
      clearTimeout(this.refreshTimers.get(timerId)!);
    }
    
    const timer = setTimeout(() => {
      subscription.callback(data, trigger);
      this.refreshTimers.delete(timerId);
    }, subscription.debounceMs);
    
    this.refreshTimers.set(timerId, timer);
  }

  private debounceUpdate(
    operation: string,
    parameters: Record<string, unknown>,
    trigger: UpdateTrigger
  ): void {
    const timerId = `update-${operation}`;
    
    if (this.refreshTimers.has(timerId)) {
      clearTimeout(this.refreshTimers.get(timerId)!);
    }
    
    const timer = setTimeout(() => {
      this.executeOperationUpdate(operation, parameters, trigger);
      this.refreshTimers.delete(timerId);
    }, 500); // Default debounce delay
    
    this.refreshTimers.set(timerId, timer);
  }

  private matchesFilters(subscription: UpdateSubscription, trigger: UpdateTrigger): boolean {
    if (!subscription.filters) return true;
    
    const { categories, modes, locations, areas } = subscription.filters;
    const triggerData = trigger.data;
    
    if (!triggerData) return true;
    
    if (categories && triggerData.category && !categories.includes(triggerData.category as BusinessCategory)) {
      return false;
    }
    
    if (modes && triggerData.mode && !modes.includes(triggerData.mode as AnalysisMode)) {
      return false;
    }
    
    // Additional filter logic for locations and areas would go here
    
    return true;
  }

  private determineRequiredOperations(
    mode: AnalysisMode,
    location?: LatLng,
    area?: string
  ): string[] {
    const operations: string[] = [];
    
    switch (mode) {
      case 'point':
        if (location) operations.push('analyzePoint');
        break;
      case 'area':
        if (area) operations.push('analyzeArea');
        break;
      case 'heatmap':
        operations.push('getHeatmapData');
        break;
    }
    
    return operations;
  }

  private buildOperationParameters(
    operation: string,
    category: BusinessCategory,
    location?: LatLng,
    area?: string
  ): Record<string, unknown> {
    switch (operation) {
      case 'analyzePoint':
        return {
          lat: location?.lat,
          lon: location?.lng,
          kategori: category
        };
      case 'analyzeArea':
        return {
          mahalle: area,
          kategori: category
        };
      case 'getHeatmapData':
        return {
          kategori: category,
          bounds: { north: 40.2, south: 39.5, east: 33.2, west: 32.3 } // Default Ankara bounds
        };
      default:
        return {};
    }
  }

  private invalidateRelatedCache(
    category: BusinessCategory,
    mode: AnalysisMode,
    location?: LatLng,
    area?: string
  ): void {
    // This would integrate with the caching system to invalidate related entries
    locationAnalysisService.invalidateLocationCache(category, area);
  }

  private getLastUpdateTime(): Date | null {
    const times = Array.from(this.lastUpdateTimes.values());
    return times.length > 0 ? new Date(Math.max(...times.map(t => t.getTime()))) : null;
  }

  private generateId(): string {
    return `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}