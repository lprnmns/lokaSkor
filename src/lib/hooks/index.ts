/**
 * React Hooks for Location Analysis
 * Centralized exports for all custom hooks
 */

// Location Analysis Hooks
export {
  useLocationAnalysis,
  usePointAnalysis,
  useAreaAnalysis,
  type UseLocationAnalysisOptions,
  type LocationAnalysisState,
  type UseLocationAnalysisReturn
} from './useLocationAnalysis';

// Heatmap Data Hooks
export {
  useHeatmapData,
  useSimpleHeatmap,
  useRealTimeHeatmap,
  type UseHeatmapDataOptions,
  type HeatmapDataState,
  type UseHeatmapDataReturn
} from './useHeatmapData';

// Error Handling Hooks
export {
  useApiError,
  useMultipleApiErrors,
  useErrorToast,
  type UseApiErrorOptions,
  type ApiErrorState,
  type UseApiErrorReturn
} from './useApiError';

// Caching Hooks
export {
  useApiCache,
  useLocationCache,
  type UseApiCacheOptions,
  type ApiCacheState,
  type UseApiCacheReturn,
  type CacheEntry
} from './useApiCache';

// Debouncing and Throttling Hooks
export {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  useDebouncedApiCall,
  useThrottledApiCall,
  useDebouncedSearch,
  useMultipleDebounce,
  useDebouncedValidation
} from './useDebounce';