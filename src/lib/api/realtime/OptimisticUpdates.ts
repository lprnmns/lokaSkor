/**
 * Optimistic Updates Manager
 * Handles optimistic UI updates with rollback capabilities
 */

import { EventEmitter } from 'events';
import { realtimeCache } from './RealtimeCache';

export interface OptimisticUpdate<T = any> {
  id: string;
  type: 'create' | 'update' | 'delete';
  key: string;
  optimisticData: T;
  previousData: T | null;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed' | 'rolled_back';
  retryCount: number;
  maxRetries: number;
  timeout: number;
  metadata?: {
    source: string;
    operation: string;
    context?: any;
  };
}

export interface OptimisticUpdateOptions {
  maxRetries?: number;
  timeout?: number;
  enableRollback?: boolean;
  enableBatching?: boolean;
  batchDelay?: number;
  debug?: boolean;
}

export interface OptimisticUpdateResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  rollback?: () => void;
}

export class OptimisticUpdatesManager extends EventEmitter {
  private updates: Map<string, OptimisticUpdate> = new Map();
  private options: Required<OptimisticUpdateOptions>;
  private batchTimer: NodeJS.Timeout | null = null;
  private pendingBatch: Set<string> = new Set();

  constructor(options: OptimisticUpdateOptions = {}) {
    super();
    
    this.options = {
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 10000, // 10 seconds
      enableRollback: options.enableRollback !== false,
      enableBatching: options.enableBatching || false,
      batchDelay: options.batchDelay || 100, // 100ms
      debug: options.debug || false
    };
  }

  /**
   * Apply optimistic update
   */
  public async applyUpdate<T>(
    key: string,
    optimisticData: T,
    operation: () => Promise<T>,
    options: {
      type?: OptimisticUpdate['type'];
      metadata?: OptimisticUpdate['metadata'];
      timeout?: number;
      maxRetries?: number;
    } = {}
  ): Promise<OptimisticUpdateResult<T>> {
    const updateId = this.generateId();
    const previousData = realtimeCache.get<T>(key);

    // Create optimistic update record
    const update: OptimisticUpdate<T> = {
      id: updateId,
      type: options.type || 'update',
      key,
      optimisticData,
      previousData,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || this.options.maxRetries,
      timeout: options.timeout || this.options.timeout,
      metadata: options.metadata
    };

    this.updates.set(updateId, update);

    // Apply optimistic update to cache immediately
    realtimeCache.set(key, optimisticData, undefined, {
      source: 'api',
      tags: ['optimistic']
    });

    this.log(`Applied optimistic update: ${updateId} for key: ${key}`);
    this.emit('optimistic_applied', { updateId, key, data: optimisticData });

    // Create rollback function
    const rollback = () => {
      if (this.options.enableRollback) {
        this.rollbackUpdate(updateId);
      }
    };

    try {
      // Execute the actual operation with timeout
      const result = await this.executeWithTimeout(operation, update.timeout);
      
      // Confirm the update
      this.confirmUpdate(updateId, result);
      
      return {
        success: true,
        data: result,
        rollback
      };
    } catch (error: any) {
      // Handle failure
      const shouldRetry = await this.handleUpdateFailure(updateId, error);
      
      if (shouldRetry) {
        // Retry the operation
        return this.retryUpdate(updateId, operation);
      } else {
        // Rollback if enabled
        if (this.options.enableRollback) {
          this.rollbackUpdate(updateId);
        }
        
        return {
          success: false,
          error: error,
          rollback
        };
      }
    }
  }

  /**
   * Batch multiple optimistic updates
   */
  public async applyBatchUpdates<T>(
    updates: Array<{
      key: string;
      optimisticData: T;
      operation: () => Promise<T>;
      options?: {
        type?: OptimisticUpdate['type'];
        metadata?: OptimisticUpdate['metadata'];
      };
    }>
  ): Promise<Array<OptimisticUpdateResult<T>>> {
    if (!this.options.enableBatching) {
      // Execute updates sequentially if batching is disabled
      const results: Array<OptimisticUpdateResult<T>> = [];
      for (const update of updates) {
        const result = await this.applyUpdate(
          update.key,
          update.optimisticData,
          update.operation,
          update.options
        );
        results.push(result);
      }
      return results;
    }

    // Apply all optimistic updates immediately
    const updateIds: string[] = [];
    const operations: Array<() => Promise<T>> = [];

    for (const update of updates) {
      const updateId = this.generateId();
      const previousData = realtimeCache.get<T>(update.key);

      const optimisticUpdate: OptimisticUpdate<T> = {
        id: updateId,
        type: update.options?.type || 'update',
        key: update.key,
        optimisticData: update.optimisticData,
        previousData,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
        maxRetries: this.options.maxRetries,
        timeout: this.options.timeout,
        metadata: update.options?.metadata
      };

      this.updates.set(updateId, optimisticUpdate);
      updateIds.push(updateId);
      operations.push(update.operation);

      // Apply optimistic update to cache
      realtimeCache.set(update.key, update.optimisticData, undefined, {
        source: 'api',
        tags: ['optimistic', 'batch']
      });

      this.log(`Applied batch optimistic update: ${updateId} for key: ${update.key}`);
    }

    this.emit('batch_optimistic_applied', { updateIds });

    // Execute all operations in parallel
    const results = await Promise.allSettled(
      operations.map((operation, index) => 
        this.executeWithTimeout(operation, this.options.timeout)
          .then(result => ({ index, result, success: true }))
          .catch(error => ({ index, error, success: false }))
      )
    );

    // Process results
    const finalResults: Array<OptimisticUpdateResult<T>> = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const updateId = updateIds[i];

      if (result.status === 'fulfilled' && result.value.success) {
        this.confirmUpdate(updateId, result.value.result);
        finalResults.push({
          success: true,
          data: result.value.result,
          rollback: () => this.rollbackUpdate(updateId)
        });
      } else {
        const error = result.status === 'fulfilled' ? result.value.error : result.reason;
        
        if (this.options.enableRollback) {
          this.rollbackUpdate(updateId);
        }
        
        finalResults.push({
          success: false,
          error: error,
          rollback: () => this.rollbackUpdate(updateId)
        });
      }
    }

    return finalResults;
  }

  /**
   * Confirm optimistic update
   */
  public confirmUpdate<T>(updateId: string, actualData: T): void {
    const update = this.updates.get(updateId);
    if (!update) return;

    update.status = 'confirmed';
    
    // Update cache with actual data
    realtimeCache.set(update.key, actualData, undefined, {
      source: 'api',
      tags: ['confirmed']
    });

    this.log(`Confirmed optimistic update: ${updateId}`);
    this.emit('optimistic_confirmed', { updateId, key: update.key, data: actualData });

    // Clean up after a delay
    setTimeout(() => {
      this.updates.delete(updateId);
    }, 5000);
  }

  /**
   * Rollback optimistic update
   */
  public rollbackUpdate(updateId: string): void {
    const update = this.updates.get(updateId);
    if (!update) return;

    update.status = 'rolled_back';

    // Restore previous data
    if (update.previousData !== null) {
      realtimeCache.set(update.key, update.previousData);
    } else {
      realtimeCache.delete(update.key);
    }

    this.log(`Rolled back optimistic update: ${updateId}`);
    this.emit('optimistic_rolled_back', { 
      updateId, 
      key: update.key, 
      previousData: update.previousData 
    });

    // Clean up
    this.updates.delete(updateId);
  }

  /**
   * Retry failed update
   */
  private async retryUpdate<T>(
    updateId: string,
    operation: () => Promise<T>
  ): Promise<OptimisticUpdateResult<T>> {
    const update = this.updates.get(updateId);
    if (!update) {
      return { success: false, error: new Error('Update not found') };
    }

    update.retryCount++;
    this.log(`Retrying optimistic update: ${updateId} (attempt ${update.retryCount})`);

    try {
      const result = await this.executeWithTimeout(operation, update.timeout);
      this.confirmUpdate(updateId, result);
      
      return {
        success: true,
        data: result,
        rollback: () => this.rollbackUpdate(updateId)
      };
    } catch (error: any) {
      const shouldRetry = await this.handleUpdateFailure(updateId, error);
      
      if (shouldRetry) {
        return this.retryUpdate(updateId, operation);
      } else {
        if (this.options.enableRollback) {
          this.rollbackUpdate(updateId);
        }
        
        return {
          success: false,
          error: error,
          rollback: () => this.rollbackUpdate(updateId)
        };
      }
    }
  }

  /**
   * Handle update failure
   */
  private async handleUpdateFailure(updateId: string, error: Error): Promise<boolean> {
    const update = this.updates.get(updateId);
    if (!update) return false;

    update.status = 'failed';
    
    this.log(`Optimistic update failed: ${updateId} - ${error.message}`, 'error');
    this.emit('optimistic_failed', { updateId, key: update.key, error });

    // Check if we should retry
    const shouldRetry = update.retryCount < update.maxRetries;
    
    if (shouldRetry) {
      // Exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, update.retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return shouldRetry;
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Get pending updates
   */
  public getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.updates.values()).filter(update => 
      update.status === 'pending'
    );
  }

  /**
   * Get update by ID
   */
  public getUpdate(updateId: string): OptimisticUpdate | null {
    return this.updates.get(updateId) || null;
  }

  /**
   * Get updates by key
   */
  public getUpdatesByKey(key: string): OptimisticUpdate[] {
    return Array.from(this.updates.values()).filter(update => 
      update.key === key
    );
  }

  /**
   * Clear all updates
   */
  public clearUpdates(): void {
    this.updates.clear();
    this.log('Cleared all optimistic updates');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log message if debug is enabled
   */
  private log(message: string, level: 'log' | 'error' = 'log'): void {
    if (this.options.debug) {
      if (level === 'error') {
        console.error(`[OptimisticUpdates] ${message}`);
      } else {
        console.log(`[OptimisticUpdates] ${message}`);
      }
    }
  }
}

// Global optimistic updates manager
export const optimisticUpdates = new OptimisticUpdatesManager({
  maxRetries: 3,
  timeout: 10000,
  enableRollback: true,
  enableBatching: true,
  debug: process.env.NODE_ENV === 'development'
});