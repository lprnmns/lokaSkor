/**
 * React Hook for Heatmap Data
 * Manages heatmap data loading and caching
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  locationAnalysisService,
  HeatmapRequest,
  HeatmapResponse,
  HeatmapDataPoint,
  BusinessCategory,
  MapBounds,
  ApiError
} from '../api';
import { debounce } from '../api/utils/transformers';

export interface UseHeatmapDataOptions {
  kategori: BusinessCategory;
  bounds: MapBounds | null;
  autoRefresh?: boolean;
  debounceMs?: number;
  enabled?: boolean;
}

export interface HeatmapDataState {
  data: HeatmapDataPoint[];
  rawData: HeatmapResponse | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: Date | null;
  totalPoints: number;
}

export interface UseHeatmapDataReturn {
  state: HeatmapDataState;
  loadHeatmapData: (bounds: MapBounds) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  clearData: () => void;
  isLoading: boolean;
  hasData: boolean;
  hasError: boolean;
}

export function useHeatmapData(options: UseHeatmapDataOptions): UseHeatmapDataReturn {
  const { 
    kategori, 
    bounds, 
    autoRefresh = false, 
    debounceMs = 1000, 
    enabled = true 
  } = options;
  
  // State management
  const [state, setState] = useState<HeatmapDataState>({
    data: [],
    rawData: null,
    loading: false,
    error: null,
    lastUpdated: null,
    totalPoints: 0
  });

  // Ref for current bounds to prevent stale closures
  const currentBoundsRef = useRef<MapBounds | null>(null);
  const loadingRef = useRef<boolean>(false);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<HeatmapDataState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Clear data
  const clearData = useCallback(() => {
    updateState({ 
      data: [], 
      rawData: null, 
      error: null, 
      lastUpdated: null, 
      totalPoints: 0 
    });
    currentBoundsRef.current = null;
  }, [updateState]);

  // Transform heatmap response to data points
  const transformHeatmapData = useCallback((response: HeatmapResponse): HeatmapDataPoint[] => {
    return response.heatmap_data.map(([lat, lon, intensity]) => ({
      lat,
      lon,
      intensity
    }));
  }, []);

  // Load heatmap data function
  const loadHeatmapData = useCallback(async (requestBounds: MapBounds) => {
    if (!enabled || loadingRef.current) return;

    const request: HeatmapRequest = {
      kategori,
      bounds: requestBounds
    };

    currentBoundsRef.current = requestBounds;
    loadingRef.current = true;
    updateState({ loading: true, error: null });

    try {
      const result = await locationAnalysisService.getHeatmapData(request);
      
      // Check if bounds haven't changed during the request
      if (JSON.stringify(currentBoundsRef.current) === JSON.stringify(requestBounds)) {
        const transformedData = transformHeatmapData(result);
        
        updateState({
          data: transformedData,
          rawData: result,
          loading: false,
          lastUpdated: new Date(),
          totalPoints: result.total_points
        });
      }
    } catch (error: any) {
      // Check if bounds haven't changed during the request
      if (JSON.stringify(currentBoundsRef.current) === JSON.stringify(requestBounds)) {
        const apiError = error as ApiError;
        updateState({
          loading: false,
          error: apiError
        });
      }
    } finally {
      loadingRef.current = false;
    }
  }, [kategori, enabled, updateState, transformHeatmapData]);

  // Debounced version of loadHeatmapData
  const debouncedLoadHeatmapData = useCallback(
    debounce(loadHeatmapData, debounceMs),
    [loadHeatmapData, debounceMs]
  );

  // Refresh current heatmap data
  const refresh = useCallback(async () => {
    if (currentBoundsRef.current) {
      await loadHeatmapData(currentBoundsRef.current);
    }
  }, [loadHeatmapData]);

  // Effect to load data when bounds change
  useEffect(() => {
    if (bounds && enabled) {
      if (debounceMs > 0) {
        debouncedLoadHeatmapData(bounds);
      } else {
        loadHeatmapData(bounds);
      }
    }
  }, [bounds, enabled, loadHeatmapData, debouncedLoadHeatmapData, debounceMs]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !currentBoundsRef.current || !enabled) return;

    const interval = setInterval(() => {
      refresh();
    }, 60000); // Refresh every minute for heatmap data

    return () => clearInterval(interval);
  }, [autoRefresh, refresh, enabled]);

  // Clear data when category changes
  useEffect(() => {
    clearData();
  }, [kategori, clearData]);

  // Helper properties
  const isLoading = state.loading;
  const hasData = state.data.length > 0;
  const hasError = state.error !== null;

  return {
    state,
    loadHeatmapData: debounceMs > 0 ? debouncedLoadHeatmapData : loadHeatmapData,
    refresh,
    clearError,
    clearData,
    isLoading,
    hasData,
    hasError
  };
}

// Simplified hook for basic heatmap usage
export function useSimpleHeatmap(kategori: BusinessCategory, bounds: MapBounds | null) {
  return useHeatmapData({
    kategori,
    bounds,
    debounceMs: 1000,
    enabled: bounds !== null
  });
}

// Hook for real-time heatmap with auto-refresh
export function useRealTimeHeatmap(kategori: BusinessCategory, bounds: MapBounds | null) {
  return useHeatmapData({
    kategori,
    bounds,
    autoRefresh: true,
    debounceMs: 500,
    enabled: bounds !== null
  });
}