/**
 * Enhanced LocationDashboard Component
 * Integrates with Flask backend for real-time location analysis
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import {
  useLocationAnalysis,
  useHeatmapData,
  useApiError,
  useLocationCache 
} from '../../lib/hooks';
import { 
  BusinessCategory, 
  AnalysisMode, 
  LatLng, 
  MapBounds,
  PointAnalysisResponse,
  AreaAnalysisResponse 
} from '../../lib/api';
import { AnalysisModeSelector } from './AnalysisModeSelector';
import { CategorySelector } from './CategorySelector';
import { MapView } from './MapView';
import { ScoreDisplay } from './ScoreDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';
import { ToggleControls } from './ToggleControls';

export interface LocationDashboardProps {
  initialCategory?: BusinessCategory;
  initialMode?: AnalysisMode;
  className?: string;
  onAnalysisComplete?: (data: PointAnalysisResponse | AreaAnalysisResponse) => void;
  onError?: (error: Error) => void;
}

export interface LocationDashboardState {
  analysisMode: AnalysisMode;
  selectedCategory: BusinessCategory;
  currentLocation: LatLng | null;
  selectedArea: string | null;
  mapBounds: MapBounds | null;
  toggleStates: {
    trafficData: boolean;
    competitorAnalysis: boolean;
    demographics: boolean;
  };
}

export const LocationDashboard: React.FC<LocationDashboardProps> = ({
  initialCategory = 'cafe',
  initialMode = 'heatmap',
  className = '',
  onAnalysisComplete,
  onError
}) => {
  const { t } = useTranslation();
  
  // Component state
  const [state, setState] = useState<LocationDashboardState>({
    analysisMode: initialMode,
    selectedCategory: initialCategory,
    currentLocation: null,
    selectedArea: null,
    mapBounds: null,
    toggleStates: {
      trafficData: true,
      competitorAnalysis: false,
      demographics: true
    }
  });

  // API integration hooks
  const locationAnalysis = useLocationAnalysis({
    kategori: state.selectedCategory,
    analysisMode: state.analysisMode,
    autoRefresh: false,
    debounceMs: 500
  });

  const heatmapData = useHeatmapData({
    kategori: state.selectedCategory,
    bounds: state.mapBounds,
    autoRefresh: state.analysisMode === 'heatmap',
    debounceMs: 1000,
    enabled: state.analysisMode === 'heatmap'
  });

  const errorHandler = useApiError(
    useCallback(async () => {
      // Retry logic based on current analysis mode
      if (state.analysisMode === 'point' && state.currentLocation) {
        await locationAnalysis.analyzePoint(
          state.currentLocation.lat, 
          state.currentLocation.lng
        );
      } else if (state.analysisMode === 'area' && state.selectedArea) {
        await locationAnalysis.analyzeArea(state.selectedArea);
      } else if (state.analysisMode === 'heatmap' && state.mapBounds) {
        await heatmapData.loadHeatmapData(state.mapBounds);
      }
    }, [state, locationAnalysis, heatmapData]),
    {
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 2000,
      onError: (error) => {
        console.error('LocationDashboard API Error:', error);
        onError?.(new Error(error.message));
      }
    }
  );

  const cache = useLocationCache();

  // Helper function to update state
  const updateState = useCallback((updates: Partial<LocationDashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Event handlers
  const handleAnalysisModeChange = useCallback((mode: AnalysisMode) => {
    updateState({ analysisMode: mode });
    
    // Clear previous analysis data when mode changes
    locationAnalysis.clearData();
    heatmapData.clearData();
    errorHandler.clearError();
  }, [updateState, locationAnalysis, heatmapData, errorHandler]);

  const handleCategoryChange = useCallback((category: BusinessCategory) => {
    updateState({ selectedCategory: category });
    
    // Clear cache for old category
    cache.invalidateLocationCache();
    
    // Clear previous data
    locationAnalysis.clearData();
    heatmapData.clearData();
    errorHandler.clearError();
  }, [updateState, cache, locationAnalysis, heatmapData, errorHandler]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (state.analysisMode !== 'point') return;

    const location: LatLng = { lat, lng };
    updateState({ currentLocation: location });

    try {
      await locationAnalysis.analyzePoint(lat, lng);
    } catch (error: any) {
      errorHandler.setError(error);
    }
  }, [state.analysisMode, updateState, locationAnalysis, errorHandler]);

  const handleAreaSelect = useCallback(async (area: string) => {
    if (state.analysisMode !== 'area') return;

    updateState({ selectedArea: area });

    try {
      await locationAnalysis.analyzeArea(area);
    } catch (error: any) {
      errorHandler.setError(error);
    }
  }, [state.analysisMode, updateState, locationAnalysis, errorHandler]);

  const handleMapBoundsChange = useCallback((bounds: MapBounds) => {
    updateState({ mapBounds: bounds });
    
    if (state.analysisMode === 'heatmap') {
      // Heatmap data will be loaded automatically via useHeatmapData hook
      heatmapData.clearError();
    }
  }, [state.analysisMode, updateState, heatmapData]);

  const handleToggleChange = useCallback((toggle: keyof LocationDashboardState['toggleStates'], value: boolean) => {
    updateState({
      toggleStates: {
        ...state.toggleStates,
        [toggle]: value
      }
    });

    // Refresh current analysis with new toggle settings
    if (state.analysisMode === 'point' && state.currentLocation) {
      locationAnalysis.analyzePoint(state.currentLocation.lat, state.currentLocation.lng);
    } else if (state.analysisMode === 'area' && state.selectedArea) {
      locationAnalysis.analyzeArea(state.selectedArea);
    }
  }, [updateState, state, locationAnalysis]);

  const handleRefresh = useCallback(async () => {
    try {
      if (state.analysisMode === 'point') {
        await locationAnalysis.refresh();
      } else if (state.analysisMode === 'area') {
        await locationAnalysis.refresh();
      } else if (state.analysisMode === 'heatmap') {
        await heatmapData.refresh();
      }
    } catch (error: any) {
      errorHandler.setError(error);
    }
  }, [state.analysisMode, locationAnalysis, heatmapData, errorHandler]);

  // Effect to handle analysis completion
  useEffect(() => {
    if (locationAnalysis.state.data && !locationAnalysis.state.loading) {
      onAnalysisComplete?.(locationAnalysis.state.data);
    }
  }, [locationAnalysis.state.data, locationAnalysis.state.loading, onAnalysisComplete]);

  // Effect to handle API errors
  useEffect(() => {
    if (locationAnalysis.state.error) {
      errorHandler.setError(locationAnalysis.state.error);
    }
  }, [locationAnalysis.state.error, errorHandler]);

  useEffect(() => {
    if (heatmapData.state.error) {
      errorHandler.setError(heatmapData.state.error);
    }
  }, [heatmapData.state.error, errorHandler]);

  // Computed values
  const isLoading = useMemo(() => {
    return locationAnalysis.state.loading || heatmapData.state.loading || errorHandler.state.isRetrying;
  }, [locationAnalysis.state.loading, heatmapData.state.loading, errorHandler.state.isRetrying]);

  const hasData = useMemo(() => {
    return locationAnalysis.state.data !== null || heatmapData.state.data.length > 0;
  }, [locationAnalysis.state.data, heatmapData.state.data]);

  const currentError = useMemo(() => {
    return errorHandler.state.error;
  }, [errorHandler.state.error]);

  // Render helpers
  const renderAnalysisControls = () => (
    <div className="analysis-controls">
      <AnalysisModeSelector
        selectedMode={state.analysisMode}
        onModeChange={handleAnalysisModeChange}
        disabled={isLoading}
      />
      
      <CategorySelector
        selectedCategory={state.selectedCategory}
        onCategoryChange={handleCategoryChange}
        disabled={isLoading}
      />
      
      <ToggleControls
        toggleStates={state.toggleStates}
        onToggleChange={handleToggleChange}
        disabled={isLoading}
      />
    </div>
  );

  const renderMainContent = () => {
    if (currentError && !errorHandler.state.isRetrying) {
      return (
        <div className="error-container">
          <div className="error-message">
            <h3>{errorHandler.getErrorTitle()}</h3>
            <p>{errorHandler.getUserFriendlyMessage()}</p>
            {errorHandler.shouldShowRetryButton && (
              <button 
                onClick={errorHandler.retry}
                className="retry-button"
                disabled={errorHandler.state.isRetrying}
              >
                {errorHandler.state.isRetrying ? 'Tekrar Deneniyor...' : errorHandler.getActionText()}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="main-content">
        <div className="map-container">
          <MapView
            analysisMode={state.analysisMode}
            selectedCategory={state.selectedCategory}
            currentLocation={state.currentLocation}
            selectedArea={state.selectedArea}
            heatmapData={heatmapData.state.data}
            onMapClick={handleMapClick}
            onAreaSelect={handleAreaSelect}
            onBoundsChange={handleMapBoundsChange}
            loading={isLoading}
          />
          
          {isLoading && (
            <div className="loading-overlay">
              <LoadingSpinner message="Analiz yapılıyor..." />
            </div>
          )}
        </div>

        <div className="results-container">
          <ScoreDisplay
            analysisMode={state.analysisMode}
            data={locationAnalysis.state.data}
            heatmapStats={{
              totalPoints: heatmapData.state.totalPoints,
              lastUpdated: heatmapData.state.lastUpdated
            }}
            loading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary onError={onError}>
      <div className={`location-dashboard ${className}`}>
        <div className="dashboard-header">
          <h1>{t('dashboard.title')}</h1>
          {renderAnalysisControls()}
        </div>
        
        {renderMainContent()}
        
        <div className="dashboard-footer">
          <div className="status-info">
            {hasData && locationAnalysis.state.lastUpdated && (
              <span className="last-updated">
                Son güncelleme: {locationAnalysis.state.lastUpdated.toLocaleTimeString('tr-TR')}
              </span>
            )}
            
            {state.analysisMode === 'heatmap' && heatmapData.state.totalPoints > 0 && (
              <span className="data-points">
                {heatmapData.state.totalPoints} veri noktası
              </span>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default LocationDashboard;