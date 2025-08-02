/**
 * Tests for useLocationAnalysis hook
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocationAnalysis, usePointAnalysis, useAreaAnalysis } from '../useLocationAnalysis';
import { BusinessCategory } from '../../api';

// Mock the location analysis service
vi.mock('../../api', () => ({
  locationAnalysisService: {
    analyzePoint: vi.fn(),
    analyzeArea: vi.fn()
  },
  ErrorHandler: {
    getUserFriendlyError: vi.fn()
  }
}));

// Mock debounce utility
vi.mock('../../api/utils/transformers', () => ({
  debounce: vi.fn((fn) => fn)
}));

describe('useLocationAnalysis', () => {
  let mockAnalyzePoint: Mock;
  let mockAnalyzeArea: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { locationAnalysisService } = require('../../api');
    mockAnalyzePoint = locationAnalysisService.analyzePoint;
    mockAnalyzeArea = locationAnalysisService.analyzeArea;
  });

  describe('Point Analysis Mode', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'eczane',
          analysisMode: 'point'
        })
      );

      expect(result.current.state).toEqual({
        data: null,
        loading: false,
        error: null,
        lastUpdated: null
      });
      expect(result.current.isPointAnalysis).toBe(true);
      expect(result.current.isAreaAnalysis).toBe(false);
    });

    it('should analyze point successfully', async () => {
      const mockResponse = {
        total_score: 85,
        normalized_score: 85,
        raw_score: 340,
        category: 'Çok İyi',
        color: '#ffc107',
        emoji: '🟡',
        breakdown: {}
      };

      mockAnalyzePoint.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'eczane',
          analysisMode: 'point'
        })
      );

      await act(async () => {
        await result.current.analyzePoint(39.9334, 32.8597);
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      expect(result.current.state.data).toEqual(mockResponse);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.lastUpdated).toBeInstanceOf(Date);
      expect(mockAnalyzePoint).toHaveBeenCalledWith({
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      });
    });

    it('should handle point analysis errors', async () => {
      const mockError = {
        type: 'LOCATION_ERROR',
        message: 'Invalid location',
        code: 'LOCATION_NOT_SUITABLE',
        timestamp: new Date().toISOString(),
        retryable: false
      };

      mockAnalyzePoint.mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'eczane',
          analysisMode: 'point'
        })
      );

      await act(async () => {
        await result.current.analyzePoint(39.9334, 32.8597);
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.data).toBeNull();
    });

    it('should not analyze point when not in point mode', async () => {
      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'eczane',
          analysisMode: 'area'
        })
      );

      await act(async () => {
        await result.current.analyzePoint(39.9334, 32.8597);
      });

      expect(mockAnalyzePoint).not.toHaveBeenCalled();
    });
  });

  describe('Area Analysis Mode', () => {
    it('should analyze area successfully', async () => {
      const mockResponse = {
        mahalle: 'Çankaya',
        kategori: 'cafe',
        en_iyi_lokasyonlar: [],
        toplam_lokasyon: 10,
        ortalama_skor: 75,
        analiz_ozeti: 'Analysis complete'
      };

      mockAnalyzeArea.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'cafe',
          analysisMode: 'area'
        })
      );

      await act(async () => {
        await result.current.analyzeArea('Çankaya');
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      expect(result.current.state.data).toEqual(mockResponse);
      expect(result.current.state.error).toBeNull();
      expect(mockAnalyzeArea).toHaveBeenCalledWith('Çankaya', 'cafe');
    });

    it('should handle area analysis errors', async () => {
      const mockError = {
        type: 'VALIDATION_ERROR',
        message: 'Area not found',
        code: 'AREA_NOT_FOUND',
        timestamp: new Date().toISOString(),
        retryable: false
      };

      mockAnalyzeArea.mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'cafe',
          analysisMode: 'area'
        })
      );

      await act(async () => {
        await result.current.analyzeArea('NonExistentArea');
      });

      await waitFor(() => {
        expect(result.current.state.loading).toBe(false);
      });

      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.data).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should clear error', () => {
      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'eczane',
          analysisMode: 'point'
        })
      );

      // Set an error first
      act(() => {
        result.current.state.error = {
          type: 'NETWORK_ERROR',
          message: 'Network error',
          code: 'NETWORK_ERROR',
          timestamp: new Date().toISOString(),
          retryable: true
        } as any;
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.state.error).toBeNull();
    });

    it('should clear data', () => {
      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'eczane',
          analysisMode: 'point'
        })
      );

      act(() => {
        result.current.clearData();
      });

      expect(result.current.state.data).toBeNull();
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.lastUpdated).toBeNull();
    });

    it('should refresh current analysis', async () => {
      const mockResponse = {
        total_score: 85,
        normalized_score: 85,
        raw_score: 340,
        category: 'Çok İyi',
        color: '#ffc107',
        emoji: '🟡',
        breakdown: {}
      };

      mockAnalyzePoint.mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useLocationAnalysis({
          kategori: 'eczane',
          analysisMode: 'point'
        })
      );

      // First analysis
      await act(async () => {
        await result.current.analyzePoint(39.9334, 32.8597);
      });

      // Clear mock calls
      mockAnalyzePoint.mockClear();

      // Refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockAnalyzePoint).toHaveBeenCalledWith({
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      });
    });
  });

  describe('Category and Mode Changes', () => {
    it('should clear data when category changes', () => {
      const { result, rerender } = renderHook(
        ({ kategori }) =>
          useLocationAnalysis({
            kategori,
            analysisMode: 'point'
          }),
        {
          initialProps: { kategori: 'eczane' as BusinessCategory }
        }
      );

      // Set some data
      act(() => {
        result.current.state.data = { total_score: 85 } as any;
      });

      // Change category
      rerender({ kategori: 'cafe' as BusinessCategory });

      expect(result.current.state.data).toBeNull();
    });

    it('should clear data when analysis mode changes', () => {
      const { result, rerender } = renderHook(
        ({ analysisMode }) =>
          useLocationAnalysis({
            kategori: 'eczane',
            analysisMode
          }),
        {
          initialProps: { analysisMode: 'point' as const }
        }
      );

      // Set some data
      act(() => {
        result.current.state.data = { total_score: 85 } as any;
      });

      // Change analysis mode
      rerender({ analysisMode: 'area' as const });

      expect(result.current.state.data).toBeNull();
    });
  });
});

describe('usePointAnalysis', () => {
  it('should create point analysis hook with correct configuration', () => {
    const { result } = renderHook(() => usePointAnalysis('eczane', 300));

    expect(result.current.isPointAnalysis).toBe(true);
    expect(result.current.isAreaAnalysis).toBe(false);
  });
});

describe('useAreaAnalysis', () => {
  it('should create area analysis hook with correct configuration', () => {
    const { result } = renderHook(() => useAreaAnalysis('cafe', true));

    expect(result.current.isPointAnalysis).toBe(false);
    expect(result.current.isAreaAnalysis).toBe(true);
  });
});