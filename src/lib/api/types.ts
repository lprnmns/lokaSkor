/**
 * Legacy Types - Maintained for backward compatibility
 * New code should use types from ./types/index.ts
 */

// Re-export enhanced types for backward compatibility
export type {
  BusinessCategory,
  AnalysisMode,
  LatLng,
  MapBounds,
  PointAnalysisRequest,
  AreaAnalysisRequest,
  HeatmapRequest,
  ApiResponse,
  PointAnalysisResponse,
  LocationData,
  AreaAnalysisResponse,
  HeatmapDataPoint,
  HeatmapResponse,
  ApiError,
  UserFriendlyError,
  LoadingState,
  CacheEntry,
  CacheConfig
} from './types/enhanced';

// Error Types enum for backward compatibility
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  LOCATION_ERROR = 'LOCATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// API Configuration interface
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  enableDebug: boolean;
}