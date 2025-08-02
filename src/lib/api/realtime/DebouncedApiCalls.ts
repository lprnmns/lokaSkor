/**
 * Debounced API Calls Manager
 * Handles debouncing and throttling of API calls to prevent excessive requests
 */

import { EventEmitter } from 'events';

export interface DebouncedCallOptions {
  delay?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
  key?: string;
  priority?: number;
  cancelPrevious?: boolean;
}

export interface ThrottledCallOptions {
  interval?: number;
  leading?: boolean;
  trailing?: boolean;
  key?: string;
  priority?: number;
}

export interface QueuedCall<T = any> {
  id: string;
  key: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
  priority: number;
  options: DebouncedCallOptions | ThrottledCallOptions;
  type: 'debounced' | 'throttled';
  status: 'pending' | 'executing' | 'completed' | 'cancelled';
}

export interface CallStats {
  totalCalls: number;
  executedCalls: number;
  cancelledCalls: number;
  averageDelay: number;
  queueSize: number;
  activeKeys: string[];
}

export class DebouncedApiCallsManager extends EventEmitter {
  private debouncedTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttledTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastThrottledCall: Map<string, number> = new Map();
  private callQueue: Map<string, QueuedCall[]> = new Map();
  private activeRequests: Map<string, Promise<any>> = new Map();
  private stats = {
    totalCalls: 0,
    executedCalls: 0,
    cancelledCalls: 0,
    totalDelay: 0
  };

  /**
   * Debounce an API call
   */
  public debounce<T>(
    fn: () => Promise<T>,
    options: DebouncedCallOptions = {}
  ): Promise<T> {
    const {
      delay = 300,
      maxWait = 1000,
      leading = false,
      trailing = true,
      key = 'default',
      priority = 0,
      cancelPrevious = true
    } = options;

    this.stats.totalCalls++;

    return new Promise<T>((resolve, reject) => {
      const callId = this.generateId();
      const now = Date.now();

      // Create queued call
      const queuedCall: QueuedCall<T> = {
        id: callId,
        key,
        fn,
        resolve,
        reject,
        timestamp: now,
        priority,
        options,
        type: 'debounced',
        status: 'pending'
      };

      // Add to queue
      if (!this.callQueue.has(key)) {
        this.callQueue.set(key, []);
      }
      this.callQueue.get(key)!.push(queuedCall);

      // Cancel previous timer if exists and cancelPrevious is true
      if (cancelPrevious && this.debouncedTimers.has(key)) {
        clearTimeout(this.debouncedTimers.get(key)!);
        this.cancelPreviousCalls(key, callId);
      }

      // Execute immediately if leading is true and no timer exists
      if (leading && !this.debouncedTimers.has(key)) {
        this.executeCall(queuedCall);
        return;
      }

      // Set up debounced execution
      const timer = setTimeout(() => {
        this.debouncedTimers.delete(key);
        
        if (trailing) {
          this.executeQueuedCalls(key);
        }
      }, delay);

      this.debouncedTimers.set(key, timer);

      // Set up max wait timer if specified
      if (maxWait > 0 && maxWait > delay) {
        setTimeout(() => {
          if (this.debouncedTimers.has(key)) {
            clearTimeout(this.debouncedTimers.get(key)!);
            this.debouncedTimers.delete(key);
            this.executeQueuedCalls(key);
          }
        }, maxWait);
      }

      this.emit('call_queued', { callId, key, type: 'debounced' });
    });
  }

  /**
   * Throttle an API call
   */
  public throttle<T>(
    fn: () => Promise<T>,
    options: ThrottledCallOptions = {}
  ): Promise<T> {
    const {
      interval = 1000,
      leading = true,
      trailing = false,
      key = 'default',
      priority = 0
    } = options;

    this.stats.totalCalls++;

    return new Promise<T>((resolve, reject) => {
      const callId = this.generateId();
      const now = Date.now();
      const lastCall = this.lastThrottledCall.get(key) || 0;
      const timeSinceLastCall = now - lastCall;

      // Create queued call
      const queuedCall: QueuedCall<T> = {
        id: callId,
        key,
        fn,
        resolve,
        reject,
        timestamp: now,
        priority,
        options,
        type: 'throttled',
        status: 'pending'
      };

      // Add to queue
      if (!this.callQueue.has(key)) {
        this.callQueue.set(key, []);
      }
      this.callQueue.get(key)!.push(queuedCall);

      // Execute immediately if leading is true and enough time has passed
      if (leading && timeSinceLastCall >= interval) {
        this.lastThrottledCall.set(key, now);
        this.executeCall(queuedCall);
        return;
      }

      // Set up throttled execution
      if (!this.throttledTimers.has(key)) {
        const remainingTime = Math.max(0, interval - timeSinceLastCall);
        
        const timer = setTimeout(() => {
          this.throttledTimers.delete(key);
          this.lastThrottledCall.set(key, Date.now());
          
          if (trailing) {
            this.executeQueuedCalls(key);
          }
        }, remainingTime);

        this.throttledTimers.set(key, timer);
      }

      this.emit('call_queued', { callId, key, type: 'throttled' });
    });
  }

  /**
   * Execute a batch of API calls with debouncing
   */
  public debounceBatch<T>(
    calls: Array<{
      fn: () => Promise<T>;
      key?: string;
      priority?: number;
    }>,
    options: DebouncedCallOptions = {}
  ): Promise<T[]> {
    const batchKey = options.key || `batch-${this.generateId()}`;
    
    const batchPromises = calls.map((call, index) => 
      this.debounce(call.fn, {
        ...options,
        key: `${batchKey}-${index}`,
        priority: call.priority || 0
      })
    );

    return Promise.all(batchPromises);
  }

  /**
   * Cancel all pending calls for a key
   */
  public cancel(key: string): number {
    let cancelled = 0;

    // Cancel debounced timer
    if (this.debouncedTimers.has(key)) {
      clearTimeout(this.debouncedTimers.get(key)!);
      this.debouncedTimers.delete(key);
    }

    // Cancel throttled timer
    if (this.throttledTimers.has(key)) {
      clearTimeout(this.throttledTimers.get(key)!);
      this.throttledTimers.delete(key);
    }

    // Cancel queued calls
    const queue = this.callQueue.get(key);
    if (queue) {
      for (const call of queue) {
        if (call.status === 'pending') {
          call.status = 'cancelled';
          call.reject(new Error('Call cancelled'));
          cancelled++;
          this.stats.cancelledCalls++;
        }
      }
      this.callQueue.delete(key);
    }

    if (cancelled > 0) {
      this.emit('calls_cancelled', { key, count: cancelled });
    }

    return cancelled;
  }

  /**
   * Cancel all pending calls
   */
  public cancelAll(): number {
    let totalCancelled = 0;

    for (const key of this.callQueue.keys()) {
      totalCancelled += this.cancel(key);
    }

    return totalCancelled;
  }

  /**
   * Get pending calls for a key
   */
  public getPendingCalls(key: string): QueuedCall[] {
    const queue = this.callQueue.get(key);
    return queue ? queue.filter(call => call.status === 'pending') : [];
  }

  /**
   * Get all pending calls
   */
  public getAllPendingCalls(): QueuedCall[] {
    const allCalls: QueuedCall[] = [];
    
    for (const queue of this.callQueue.values()) {
      allCalls.push(...queue.filter(call => call.status === 'pending'));
    }

    return allCalls.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
  }

  /**
   * Get call statistics
   */
  public getStats(): CallStats {
    const queueSize = Array.from(this.callQueue.values())
      .reduce((total, queue) => total + queue.length, 0);

    return {
      totalCalls: this.stats.totalCalls,
      executedCalls: this.stats.executedCalls,
      cancelledCalls: this.stats.cancelledCalls,
      averageDelay: this.stats.executedCalls > 0 ? 
        this.stats.totalDelay / this.stats.executedCalls : 0,
      queueSize,
      activeKeys: Array.from(this.callQueue.keys())
    };
  }

  /**
   * Check if there are pending calls for a key
   */
  public hasPendingCalls(key: string): boolean {
    return this.getPendingCalls(key).length > 0;
  }

  /**
   * Flush all pending calls immediately
   */
  public flush(key?: string): Promise<void> {
    if (key) {
      return this.flushKey(key);
    } else {
      const promises = Array.from(this.callQueue.keys()).map(k => this.flushKey(k));
      return Promise.all(promises).then(() => {});
    }
  }

  /**
   * Execute queued calls for a specific key
   */
  private executeQueuedCalls(key: string): void {
    const queue = this.callQueue.get(key);
    if (!queue || queue.length === 0) return;

    // Sort by priority (highest first) then by timestamp (oldest first)
    const sortedCalls = queue
      .filter(call => call.status === 'pending')
      .sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);

    if (sortedCalls.length === 0) return;

    // Execute the highest priority call
    const callToExecute = sortedCalls[0];
    this.executeCall(callToExecute);

    // Remove executed call from queue
    const index = queue.indexOf(callToExecute);
    if (index > -1) {
      queue.splice(index, 1);
    }

    // Clean up empty queue
    if (queue.length === 0) {
      this.callQueue.delete(key);
    }
  }

  /**
   * Execute a single call
   */
  private async executeCall<T>(call: QueuedCall<T>): Promise<void> {
    if (call.status !== 'pending') return;

    call.status = 'executing';
    const startTime = Date.now();

    try {
      // Check if there's already an active request for this key
      if (this.activeRequests.has(call.key)) {
        const existingRequest = this.activeRequests.get(call.key)!;
        const result = await existingRequest;
        call.resolve(result);
      } else {
        // Execute the function
        const requestPromise = call.fn();
        this.activeRequests.set(call.key, requestPromise);

        const result = await requestPromise;
        
        call.status = 'completed';
        call.resolve(result);
        
        this.activeRequests.delete(call.key);
      }

      // Update stats
      this.stats.executedCalls++;
      this.stats.totalDelay += Date.now() - startTime;

      this.emit('call_executed', { 
        callId: call.id, 
        key: call.key, 
        duration: Date.now() - startTime 
      });

    } catch (error) {
      call.status = 'completed';
      call.reject(error);
      
      this.activeRequests.delete(call.key);
      
      this.emit('call_failed', { 
        callId: call.id, 
        key: call.key, 
        error 
      });
    }
  }

  /**
   * Cancel previous calls for a key (except the specified call)
   */
  private cancelPreviousCalls(key: string, exceptCallId: string): void {
    const queue = this.callQueue.get(key);
    if (!queue) return;

    for (const call of queue) {
      if (call.id !== exceptCallId && call.status === 'pending') {
        call.status = 'cancelled';
        call.reject(new Error('Call cancelled by newer call'));
        this.stats.cancelledCalls++;
      }
    }
  }

  /**
   * Flush calls for a specific key
   */
  private async flushKey(key: string): Promise<void> {
    // Cancel existing timers
    if (this.debouncedTimers.has(key)) {
      clearTimeout(this.debouncedTimers.get(key)!);
      this.debouncedTimers.delete(key);
    }

    if (this.throttledTimers.has(key)) {
      clearTimeout(this.throttledTimers.get(key)!);
      this.throttledTimers.delete(key);
    }

    // Execute all pending calls
    this.executeQueuedCalls(key);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global debounced API calls manager
export const debouncedApiCalls = new DebouncedApiCallsManager();