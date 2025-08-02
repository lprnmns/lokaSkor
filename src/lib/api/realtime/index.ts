/**
 * Real-time API Module
 * Exports all real-time functionality
 */

// WebSocket Client
export { WebSocketClient } from './WebSocketClient';
export type { 
  WebSocketMessage, 
  WebSocketOptions, 
  WebSocketState 
} from './WebSocketClient';

// EventSource Client
export { EventSourceClient } from './EventSourceClient';
export type { 
  EventSourceMessage, 
  EventSourceOptions, 
  EventSourceState 
} from './EventSourceClient';

// Realtime Data Manager
export { RealtimeDataManager } from './RealtimeDataManager';
export type { 
  RealtimeDataOptions, 
  RealtimeDataState, 
  RealtimeUpdate, 
  SubscriptionOptions 
} from './RealtimeDataManager';

// Realtime Cache
export { RealtimeCache, realtimeCache } from './RealtimeCache';
export type { 
  CacheEntry, 
  CacheOptions, 
  CacheStats 
} from './RealtimeCache';

// Optimistic Updates
export { OptimisticUpdatesManager, optimisticUpdates } from './OptimisticUpdates';
export type { 
  OptimisticUpdate, 
  OptimisticUpdateOptions, 
  OptimisticUpdateResult 
} from './OptimisticUpdates';

// Debounced API Calls
export { DebouncedApiCallsManager, debouncedApiCalls } from './DebouncedApiCalls';
export type { 
  DebouncedCallOptions, 
  ThrottledCallOptions, 
  QueuedCall, 
  CallStats 
} from './DebouncedApiCalls';

// Hooks
export { 
  useRealtimeData, 
  useRealtimePointAnalysis, 
  useRealtimeAreaAnalysis, 
  useRealtimeHeatmapData 
} from '../hooks/useRealtimeData';
export type { 
  UseRealtimeDataOptions, 
  RealtimeDataState 
} from '../hooks/useRealtimeData';

export { 
  useRealtimeNotifications, 
  useToastNotifications 
} from '../hooks/useRealtimeNotifications';
export type { 
  Notification, 
  UseRealtimeNotificationsOptions, 
  NotificationsState 
} from '../hooks/useRealtimeNotifications';