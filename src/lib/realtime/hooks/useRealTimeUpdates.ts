/**
 * React Hook for Real-time Data Updates
 * Provides automatic refresh and parameter change handling
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { BusinessCategory, AnalysisMode, LatLng } from '../../api/types';
import { DataUpdateManager, UpdateTrigger } from '../DataUpdateManager';
import { useDebouncedCallback } from '../../hooks/useDebounce';

export interface UseRealTimeUpdatesOptions {
  category: BusinessCategory;
  mode: AnalysisMode;
  location?: LatLng;
  area?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  debounceMs?: number;
  enabled?: boolean;
  onUpdate?: (data: any, trigger: UpdateTrigger) => void;
  onError?: (error: any) => void;
}

export interface RealTimeUpdateState {
  isSubscribed: boolean;
  lastUpdate: Date | null;
  updateCount: number;
  pendingUpdates: number;
  autoRefreshEnabled: boolean;
}

export interface UseRealTimeUpdatesReturn {
  state: RealTimeUpdateState;
  triggerUpdate: (immediate?: boolean) => Promise<string>;
  enableAutoRefresh: (enabled: boolean, interval?: number) => void;
  forceRefresh: () => Promise<void>;
  getUpdateStats: () => any;
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions): UseRealTimeUpdatesReturn {
  const {
    category,
    mode,
    location,
    area,
    autoRefresh = true,
    refreshInterval = 30000,
    debounceMs = 500,
    enabled = true,
    onUpdate,
    onError
  } = options;

  const [state, setState] = useState<RealTimeUpdateState>({
    isSubscribed: false,
    lastUpdate: null,
    updateCount: 0,
    pendingUpdates: 0,
    autoRefreshEnabled: autoRefresh
  });

  const subscriptionIdRef = useRef<string | null>(null);
  const updateManagerRef = useRef<DataUpdateManager>(DataUpdateManager.getInstance());
  const lastParametersRef = useRef<{
    category: BusinessCategory;
    mode: AnalysisMode;
    location?: LatLng;
    area?: string;
  }>({ category, mode, location, area });

  // Update state helper
  const updateState = useCallback((updates: Partial<RealTimeUpdateState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle data updates
  const handleUpdate = useCallback((data: any, trigger: UpdateTrigger) => {
    updateState({
      lastUpdate: new Date(),
      updateCount: state.updateCount + 1
    });

    if (onUpdate) {
      try {
        onUpdate(data, trigger);
      } catch (error) {
        console.error('Update callback error:', error);
        if (onError) {
          onError(error);
        }
      }
    }
  }, [state.updateCount, updateState, onUpdate, onError]);

  // Debounced parameter change handler
  const debouncedParameterChange = useDebouncedCallback(
    useCallback(async () => {
      if (!enabled) return;

      try {
        await updateManagerRef.current.onParameterChange(
          category,
          mode,
          location,
          area,
          { debounce: false } // Already debounced at hook level
        );
      } catch (error) {
        console.error('Parameter change error:', error);
        if (onError) {
          onError(error);
        }
      }
    }, [category, mode, location, area, enabled, onError]),
    debounceMs,
    [category, mode, location, area, enabled]
  );

  // Subscribe to updates
  const subscribe = useCallback(() => {
    if (!enabled || subscriptionIdRef.current) return;

    const subscriptionId = updateManagerRef.current.subscribe(
      handleUpdate,
      {
        categories: [category],
        modes: [mode],
        locations: location ? [location] : undefined,
        areas: area ? [area] : undefined
      },
      {
        debounceMs,
        priority: 'normal'
      }
    );

    subscriptionIdRef.current = subscriptionId;
    updateState({ isSubscribed: true });
  }, [enabled, category, mode, location, area, debounceMs, handleUpdate, updateState]);

  // Unsubscribe from updates
  const unsubscribe = useCallback(() => {
    if (subscriptionIdRef.current) {
      updateManagerRef.current.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
      updateState({ isSubscribed: false });
    }
  }, [updateState]);

  // Trigger manual update
  const triggerUpdate = useCallback(async (immediate = false): Promise<string> => {
    if (!enabled) {
      throw new Error('Real-time updates are disabled');
    }

    const operation = mode === 'point' ? 'analyzePoint' :
                     mode === 'area' ? 'analyzeArea' :
                     'getHeatmapData';

    const parameters = mode === 'point' && location ? 
      { lat: location.lat, lon: location.lng, kategori: category } :
      mode === 'area' && area ?
      { mahalle: area, kategori: category } :
      { kategori: category, bounds: { north: 40.2, south: 39.5, east: 33.2, west: 32.3 } };

    return updateManagerRef.current.triggerUpdate(
      operation,
      parameters,
      {
        priority: 'normal',
        immediate,
        callback: (result) => {
          handleUpdate(result, {
            id: 'manual-trigger',
            type: 'user_action',
            source: 'manual_trigger',
            timestamp: new Date(),
            data: parameters
          });
        },
        errorCallback: (error) => {
          if (onError) {
            onError(error);
          }
        }
      }
    );
  }, [enabled, mode, location, area, category, handleUpdate, onError]);

  // Enable/disable auto refresh
  const enableAutoRefresh = useCallback((enabled: boolean, interval?: number) => {
    updateManagerRef.current.setAutoRefresh(
      enabled,
      interval || refreshInterval,
      {
        categories: [category],
        modes: [mode]
      }
    );

    updateState({ autoRefreshEnabled: enabled });
  }, [category, mode, refreshInterval, updateState]);

  // Force refresh all data
  const forceRefresh = useCallback(async () => {
    if (!enabled) return;

    try {
      await updateManagerRef.current.forceRefreshAll();
    } catch (error) {
      console.error('Force refresh error:', error);
      if (onError) {
        onError(error);
      }
    }
  }, [enabled, onError]);

  // Get update statistics
  const getUpdateStats = useCallback(() => {
    return updateManagerRef.current.getUpdateStats();
  }, []);

  // Effect to handle subscription lifecycle
  useEffect(() => {
    if (enabled) {
      subscribe();
    } else {
      unsubscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [enabled, subscribe, unsubscribe]);

  // Effect to handle parameter changes
  useEffect(() => {
    const currentParams = { category, mode, location, area };
    const lastParams = lastParametersRef.current;

    // Check if parameters have changed
    const hasChanged = 
      currentParams.category !== lastParams.category ||
      currentParams.mode !== lastParams.mode ||
      currentParams.location?.lat !== lastParams.location?.lat ||
      currentParams.location?.lng !== lastParams.location?.lng ||
      currentParams.area !== lastParams.area;

    if (hasChanged && enabled) {
      // Update subscription with new filters
      unsubscribe();
      subscribe();

      // Trigger parameter change update
      debouncedParameterChange();

      lastParametersRef.current = currentParams;
    }
  }, [category, mode, location, area, enabled, subscribe, unsubscribe, debouncedParameterChange]);

  // Effect to handle auto refresh configuration
  useEffect(() => {
    if (enabled) {
      enableAutoRefresh(autoRefresh, refreshInterval);
    }
  }, [enabled, autoRefresh, refreshInterval, enableAutoRefresh]);

  // Effect to update pending updates count
  useEffect(() => {
    const updatePendingCount = () => {
      const stats = updateManagerRef.current.getUpdateStats();
      updateState({ pendingUpdates: stats.pendingUpdates });
    };

    const interval = setInterval(updatePendingCount, 1000);
    return () => clearInterval(interval);
  }, [updateState]);

  return {
    state,
    triggerUpdate,
    enableAutoRefresh,
    forceRefresh,
    getUpdateStats
  };
}