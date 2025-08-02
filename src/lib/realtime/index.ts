/**
 * Real-time Data Updates System
 * Central export point for all real-time functionality
 */

// Data Update Manager
export {
  DataUpdateManager,
  type UpdateTrigger,
  type UpdateSubscription,
  type UpdateConfig,
  type PendingUpdate
} from './DataUpdateManager';

// Cache Invalidation
export {
  CacheInvalidationManager,
  type CacheInvalidationRule,
  type CacheInvalidationTrigger,
  type CacheInvalidationScope,
  type InvalidationContext,
  type CacheEntry,
  type InvalidationStats
} from './CacheInvalidation';

// Optimistic Updates
export {
  OptimisticUpdateManager,
  type OptimisticUpdate,
  type OptimisticUpdateConfig,
  type ConflictResolution,
  type OptimisticUpdateStats
} from './OptimisticUpdates';

// Real-time Hooks
export { useRealTimeUpdates } from './hooks/useRealTimeUpdates';
export { useOptimisticUpdates } from './hooks/useOptimisticUpdates';
export { useCacheInvalidation } from './hooks/useCacheInvalidation';

// Utilities
export { RealTimeUtils } from './utils/RealTimeUtils';