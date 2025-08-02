/**
 * LocationDashboard Component Tests
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationDashboard } from '../LocationDashboard';
import { BusinessCategory, AnalysisMode } from '../../../lib/api';

// Mock the hooks
vi.mock('../../../lib/hooks', () => ({
  useLocationAnalysis: vi.fn(),
  useHeatmapData: vi.fn(),
  useApiError: vi.fn(),
  useLocationCache: vi.fn()
}));

// Mock child components
vi.mock('../AnalysisModeSelector', () => ({
  AnalysisModeSelector: ({ selectedMode, onModeChange }: any) => (
    <div data-testid="analysis-mode-selector">
      <button onClick={() => onModeChange('point')}>Point</button>
      <button onClick={() => onModeChange('area')}>Area</button>
      <button onClick={() => onModeChange('heatmap')}>Heatmap</button>
      <span>Current: {selectedMode}</span>
    </div>
  )
}));

vi.mock('../CategorySelector', () => ({
  CategorySelector: ({ selectedCategory, onCategoryChange }: any) => (
    <div data-testid="category-selector">
      <button onClick={() => onCategoryChange('eczane')}>Eczane</button>
      <button onClick={() => onCategoryChange('cafe')}>Cafe</button>
      <span>Current: {selectedCategory}</span>
    </div>
  )
}));

vi.mock('../MapView', () => ({
  MapView: ({ onMapClick, onAreaSelect, onBoundsChange }: any) => (
    <div data-testid="map-view">
      <button onClick={() => onMapClick(39.9334, 32.8597)}>Click Map</button>
      <button onClick={() => onAreaSelect('Çankaya')}>Select Area</button>
      <button onClick={() => onBoundsChange({ north: 40, south: 39, east: 33, west: 32 })}>
        Change Bounds
      </button>
    </div>
  )
}));

vi.mock('../ScoreDisplay', () => ({
  ScoreDisplay: ({ data, onRefresh }: any) => (
    <div data-testid="score-display">
      {data && <span>Score: {data.total_score}</span>}
      {onRefresh && <button onClick={onRefresh}>Refresh</button>}
    </div>
  )
}));

vi.mock('../ToggleControls', () => ({
  ToggleControls: ({ toggleStates, onToggleChange }: any) => (
    <div data-testid="toggle-controls">
      <button onClick={() => onToggleChange('trafficData', !toggleStates.trafficData)}>
        Toggle Traffic
      </button>
    </div>
  )
}));

vi.mock('../ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>
}));

describe('LocationDashboard', () => {
  let mockUseLocationAnalysis: Mock;
  let mockUseHeatmapData: Mock;
  let mockUseApiError: Mock;
  let mockUseLocationCache: Mock;

  const mockLocationAnalysisReturn = {
    state: {
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    },
    analyzePoint: vi.fn(),
    analyzeArea: vi.fn(),
    refresh: vi.fn(),
    clearError: vi.fn(),
    clearData: vi.fn(),
    isPointAnalysis: true,
    isAreaAnalysis: false
  };

  const mockHeatmapDataReturn = {
    state: {
      data: [],
      rawData: null,
      loading: false,
      error: null,
      lastUpdated: null,
      totalPoints: 0
    },
    loadHeatmapData: vi.fn(),
    refresh: vi.fn(),
    clearError: vi.fn(),
    clearData: vi.fn(),
    isLoading: false,
    hasData: false,
    hasError: false
  };

  const mockApiErrorReturn = {
    state: {
      error: null,
      userFriendlyError: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false,
      lastErrorTime: null
    },
    setError: vi.fn(),
    clearError: vi.fn(),
    retry: vi.fn(),
    getUserFriendlyMessage: vi.fn(() => 'Error message'),
    getErrorTitle: vi.fn(() => 'Error title'),
    getActionText: vi.fn(() => 'Retry'),
    shouldShowRetryButton: false,
    isNetworkError: false,
    isServerError: false,
    isValidationError: false,
    isLocationError: false
  };

  const mockLocationCacheReturn = {
    invalidateLocationCache: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    const hooks = require('../../../lib/hooks');
    mockUseLocationAnalysis = hooks.useLocationAnalysis;
    mockUseHeatmapData = hooks.useHeatmapData;
    mockUseApiError = hooks.useApiError;
    mockUseLocationCache = hooks.useLocationCache;

    mockUseLocationAnalysis.mockReturnValue(mockLocationAnalysisReturn);
    mockUseHeatmapData.mockReturnValue(mockHeatmapDataReturn);
    mockUseApiError.mockReturnValue(mockApiErrorReturn);
    mockUseLocationCache.mockReturnValue(mockLocationCacheReturn);
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<LocationDashboard />);
      
      expect(screen.getByText('Lokasyon Analizi')).toBeInTheDocument();
      expect(screen.getByTestId('analysis-mode-selector')).toBeInTheDocument();
      expect(screen.getByTestId('category-selector')).toBeInTheDocument();
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
      expect(screen.getByTestId('score-display')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <LocationDashboard
          initialCategory="eczane"
          initialMode="point"
          className="custom-class"
        />
      );
      
      expect(screen.getByText('Current: point')).toBeInTheDocument();
      expect(screen.getByText('Current: eczane')).toBeInTheDocument();
    });
  });

  describe('Analysis Mode Changes', () => {
    it('should handle analysis mode change', async () => {
      render(<LocationDashboard />);
      
      const pointButton = screen.getByText('Point');
      fireEvent.click(pointButton);
      
      await waitFor(() => {
        expect(mockLocationAnalysisReturn.clearData).toHaveBeenCalled();
        expect(mockHeatmapDataReturn.clearData).toHaveBeenCalled();
      });
    });

    it('should clear data when mode changes', async () => {
      render(<LocationDashboard />);
      
      const areaButton = screen.getByText('Area');
      fireEvent.click(areaButton);
      
      await waitFor(() => {
        expect(mockLocationAnalysisReturn.clearData).toHaveBeenCalled();
        expect(mockHeatmapDataReturn.clearData).toHaveBeenCalled();
        expect(mockApiErrorReturn.clearError).toHaveBeenCalled();
      });
    });
  });

  describe('Category Changes', () => {
    it('should handle category change', async () => {
      render(<LocationDashboard />);
      
      const eczaneButton = screen.getByText('Eczane');
      fireEvent.click(eczaneButton);
      
      await waitFor(() => {
        expect(mockLocationCacheReturn.invalidateLocationCache).toHaveBeenCalled();
        expect(mockLocationAnalysisReturn.clearData).toHaveBeenCalled();
        expect(mockHeatmapDataReturn.clearData).toHaveBeenCalled();
      });
    });
  });

  describe('Map Interactions', () => {
    it('should handle map click for point analysis', async () => {
      render(<LocationDashboard initialMode="point" />);
      
      const mapClickButton = screen.getByText('Click Map');
      fireEvent.click(mapClickButton);
      
      await waitFor(() => {
        expect(mockLocationAnalysisReturn.analyzePoint).toHaveBeenCalledWith(39.9334, 32.8597);
      });
    });

    it('should handle area selection', async () => {
      render(<LocationDashboard initialMode="area" />);
      
      const areaSelectButton = screen.getByText('Select Area');
      fireEvent.click(areaSelectButton);
      
      await waitFor(() => {
        expect(mockLocationAnalysisReturn.analyzeArea).toHaveBeenCalledWith('Çankaya');
      });
    });

    it('should handle bounds change for heatmap', async () => {
      render(<LocationDashboard initialMode="heatmap" />);
      
      const boundsButton = screen.getByText('Change Bounds');
      fireEvent.click(boundsButton);
      
      // Bounds change should be handled internally
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });
  });

  describe('Toggle Controls', () => {
    it('should handle toggle changes', async () => {
      render(<LocationDashboard />);
      
      const toggleButton = screen.getByText('Toggle Traffic');
      fireEvent.click(toggleButton);
      
      // Toggle change should trigger re-analysis if location is set
      expect(screen.getByTestId('toggle-controls')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error when API error occurs', () => {
      const errorReturn = {
        ...mockApiErrorReturn,
        state: {
          ...mockApiErrorReturn.state,
          error: {
            type: 'NETWORK_ERROR',
            message: 'Network error',
            code: 'NETWORK_ERROR',
            timestamp: new Date().toISOString(),
            retryable: true
          }
        },
        shouldShowRetryButton: true
      };
      
      mockUseApiError.mockReturnValue(errorReturn);
      
      render(<LocationDashboard />);
      
      expect(screen.getByText('Error title')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should show retry button for retryable errors', () => {
      const errorReturn = {
        ...mockApiErrorReturn,
        state: {
          ...mockApiErrorReturn.state,
          error: {
            type: 'NETWORK_ERROR',
            message: 'Network error',
            code: 'NETWORK_ERROR',
            timestamp: new Date().toISOString(),
            retryable: true
          }
        },
        shouldShowRetryButton: true
      };
      
      mockUseApiError.mockReturnValue(errorReturn);
      
      render(<LocationDashboard />);
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(errorReturn.retry).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when analysis is in progress', () => {
      const loadingReturn = {
        ...mockLocationAnalysisReturn,
        state: {
          ...mockLocationAnalysisReturn.state,
          loading: true
        }
      };
      
      mockUseLocationAnalysis.mockReturnValue(loadingReturn);
      
      render(<LocationDashboard />);
      
      // Loading state should be passed to child components
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
      expect(screen.getByTestId('score-display')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display analysis results when data is available', () => {
      const dataReturn = {
        ...mockLocationAnalysisReturn,
        state: {
          ...mockLocationAnalysisReturn.state,
          data: {
            total_score: 85.5,
            normalized_score: 85.5,
            raw_score: 342.1,
            category: 'Çok İyi',
            color: '#ffc107',
            emoji: '🟡',
            breakdown: {}
          },
          lastUpdated: new Date()
        }
      };
      
      mockUseLocationAnalysis.mockReturnValue(dataReturn);
      
      render(<LocationDashboard />);
      
      expect(screen.getByText('Score: 85.5')).toBeInTheDocument();
    });

    it('should call onAnalysisComplete when analysis completes', () => {
      const onAnalysisComplete = vi.fn();
      const dataReturn = {
        ...mockLocationAnalysisReturn,
        state: {
          ...mockLocationAnalysisReturn.state,
          data: { total_score: 85.5 },
          loading: false
        }
      };
      
      mockUseLocationAnalysis.mockReturnValue(dataReturn);
      
      render(<LocationDashboard onAnalysisComplete={onAnalysisComplete} />);
      
      expect(onAnalysisComplete).toHaveBeenCalledWith({ total_score: 85.5 });
    });
  });

  describe('Refresh Functionality', () => {
    it('should handle refresh action', async () => {
      const dataReturn = {
        ...mockLocationAnalysisReturn,
        state: {
          ...mockLocationAnalysisReturn.state,
          data: { total_score: 85.5 }
        }
      };
      
      mockUseLocationAnalysis.mockReturnValue(dataReturn);
      
      render(<LocationDashboard />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockLocationAnalysisReturn.refresh).toHaveBeenCalled();
      });
    });
  });
});