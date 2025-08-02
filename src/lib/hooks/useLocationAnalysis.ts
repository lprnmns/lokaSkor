/**
 * React Hook for Location Analysis
 * Manages state for point, area, and heatmap analysis
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  locationAnalysisService,
  PointAnalysisRequest,
  PointAnalysisResponse,
  AreaAnalysisResponse,
  BusinessCategory,
  AnalysisMode,
  ApiError,
  ErrorHandler
} from '../api';
import { debounce } from '../api/utils/transformers';

export interface UseLocationAnalysisOptions {
  kategori: BusinessCategory;
  analysisMode: AnalysisMode;
  autoRefresh?: boolean;
  debounceMs?: number;
}

export interface LocationAnalysisState {
  data: PointAnalysisResponse | AreaAnalysisResponse | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: Date | null;
}

export interface UseLocationAnalysisReturn {
  state: LocationAnalysisState;
  analyzePoint: (lat: number, lon: number) => Promise<void>;
  analyzeArea: (mahalle: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  clearData: () => void;
  isPointAnalysis: boolean;
  isAreaAnalysis: boolean;
}

export function useLocationAnalysis(options: UseLocationAnalysisOptions): UseLocationAnalysisReturn {
  const { kategori, analysisMode, autoRefresh = false, debounceMs = 500 } = options;
  
  // State management
  const [state, setState] = useState<LocationAnalysisState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  // Refs for current analysis parameters
  const currentAnalysisRef = useRef<{
    type: 'point' | 'area';
    params: any;
  } | null>(null);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<LocationAnalysisState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Clear data
  const clearData = useCallback(() => {
    updateState({ data: null, error: null, lastUpdated: null });
    currentAnalysisRef.current = null;
  }, [updateState]);

  // Point analysis function
  const analyzePoint = useCallback(async (lat: number, lon: number) => {
    if (analysisMode !== 'point') return;

    const request: PointAnalysisRequest = { lat, lon, kategori };
    currentAnalysisRef.current = { type: 'point', params: request };

    updateState({ loading: true, error: null });

    try {
      const result = await locationAnalysisService.analyzePoint(request);
      
      // Check if this is still the current analysis
      if (currentAnalysisRef.current?.type === 'point' && 
          JSON.stringify(currentAnalysisRef.current.params) === JSON.stringify(request)) {
        updateState({
          data: result,
          loading: false,
          lastUpdated: new Date()
        });
      }
    } catch (error: any) {
      // Check if this is still the current analysis
      if (currentAnalysisRef.current?.type === 'point' && 
          JSON.stringify(currentAnalysisRef.current.params) === JSON.stringify(request)) {
        const apiError = error as ApiError;
        updateState({
          loading: false,
          error: apiError
        });
      }
    }
  }, [kategori, analysisMode, updateState]);

  // Area analysis function
  const analyzeArea = useCallback(async (mahalle: string) => {
    if (analysisMode !== 'area') return;

    const params = { mahalle, kategori };
    currentAnalysisRef.current = { type: 'area', params };

    updateState({ loading: true, error: null });

    try {
      const result = await locationAnalysisService.analyzeArea(mahalle, kategori);
      
      // Check if this is still the current analysis
      if (currentAnalysisRef.current?.type === 'area' && 
          JSON.stringify(currentAnalysisRef.current.params) === JSON.stringify(params)) {
        updateState({
          data: result,
          loading: false,
          lastUpdated: new Date()
        });
      }
    } catch (error: any) {
      // Check if this is still the current analysis
      if (currentAnalysisRef.current?.type === 'area' && 
          JSON.stringify(currentAnalysisRef.current.params) === JSON.stringify(params)) {
        const apiError = error as ApiError;
        updateState({
          loading: false,
          error: apiError
        });
      }
    }
  }, [kategori, analysisMode, updateState]);

  // Debounced versions of analysis functions
  const debouncedAnalyzePoint = useCallback(
    debounce(analyzePoint, debounceMs),
    [analyzePoint, debounceMs]
  );

  const debouncedAnalyzeArea = useCallback(
    debounce(analyzeArea, debounceMs),
    [analyzeArea, debounceMs]
  );

  // Refresh current analysis
  const refresh = useCallback(async () => {
    if (!currentAnalysisRef.current) return;

    const { type, params } = currentAnalysisRef.current;
    
    if (type === 'point') {
      await analyzePoint(params.lat, params.lon);
    } else if (type === 'area') {
      await analyzeArea(params.mahalle);
    }
  }, [analyzePoint, analyzeArea]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !currentAnalysisRef.current) return;

    const interval = setInterval(() => {
      refresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  // Clear data when analysis mode or category changes
  useEffect(() => {
    clearData();
  }, [analysisMode, kategori, clearData]);

  // Helper properties
  const isPointAnalysis = analysisMode === 'point';
  const isAreaAnalysis = analysisMode === 'area';

  return {
    state,
    analyzePoint: debounceMs > 0 ? debouncedAnalyzePoint : analyzePoint,
    analyzeArea: debounceMs > 0 ? debouncedAnalyzeArea : analyzeArea,
    refresh,
    clearError,
    clearData,
    isPointAnalysis,
    isAreaAnalysis
  };
}

// Hook for point analysis specifically
export function usePointAnalysis(kategori: BusinessCategory, debounceMs = 500) {
  return useLocationAnalysis({
    kategori,
    analysisMode: 'point',
    debounceMs
  });
}

// Hook for area analysis specifically
export function useAreaAnalysis(kategori: BusinessCategory, autoRefresh = false) {
  return useLocationAnalysis({
    kategori,
    analysisMode: 'area',
    autoRefresh
  });
}