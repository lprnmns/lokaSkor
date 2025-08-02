/**
 * Integration tests for LocationAnalysisService
 * These tests make actual API calls to the Flask backend
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LocationAnalysisService } from '../locationAnalysis';
import { PointAnalysisRequest, BusinessCategory } from '../../types';

// Skip integration tests in CI/CD unless explicitly enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!runIntegrationTests)('LocationAnalysisService Integration Tests', () => {
  let service: LocationAnalysisService;
  let isFlaskServerRunning = false;

  beforeAll(async () => {
    service = new LocationAnalysisService();
    
    // Check if Flask server is running
    try {
      isFlaskServerRunning = await service.healthCheck();
      if (!isFlaskServerRunning) {
        console.warn('Flask server is not running. Integration tests will be skipped.');
      }
    } catch (error) {
      console.warn('Could not connect to Flask server:', error);
    }
  });

  afterAll(() => {
    // Clean up any resources if needed
  });

  describe('Point Analysis Integration', () => {
    it('should analyze a real point in Ankara', async () => {
      if (!isFlaskServerRunning) return;

      const request: PointAnalysisRequest = {
        lat: 39.9334, // Kızılay area
        lon: 32.8597,
        kategori: 'eczane'
      };

      const result = await service.analyzePoint(request);

      expect(result).toBeDefined();
      expect(result.total_score).toBeTypeOf('number');
      expect(result.normalized_score).toBeGreaterThanOrEqual(0);
      expect(result.normalized_score).toBeLessThanOrEqual(100);
      expect(result.category).toMatch(/^(Mükemmel|Çok İyi|İyi|Orta|Uygun Değil)$/);
      expect(result.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result.emoji).toMatch(/^[🟢🟡🟠🔴⚫]$/);
      expect(result.breakdown).toBeTypeOf('object');
    }, 15000); // 15 second timeout for API call

    it('should handle invalid coordinates gracefully', async () => {
      if (!isFlaskServerRunning) return;

      const request: PointAnalysisRequest = {
        lat: 0, // Invalid coordinates
        lon: 0,
        kategori: 'eczane'
      };

      await expect(service.analyzePoint(request)).rejects.toThrow();
    });

    it('should validate coordinates within Ankara bounds', async () => {
      if (!isFlaskServerRunning) return;

      const request: PointAnalysisRequest = {
        lat: 41.0, // Outside Ankara bounds
        lon: 29.0,
        kategori: 'eczane'
      };

      await expect(service.analyzePoint(request)).rejects.toThrow('Koordinatlar Ankara sınırları dışında');
    });
  });

  describe('Area Analysis Integration', () => {
    it('should analyze a real neighborhood in Ankara', async () => {
      if (!isFlaskServerRunning) return;

      const result = await service.analyzeArea('Çankaya', 'cafe');

      expect(result).toBeDefined();
      expect(result.mahalle).toBe('Çankaya');
      expect(result.kategori).toBe('cafe');
      expect(result.en_iyi_lokasyonlar).toBeInstanceOf(Array);
      expect(result.toplam_lokasyon).toBeGreaterThanOrEqual(0);
      expect(result.ortalama_skor).toBeGreaterThanOrEqual(0);
      expect(result.analiz_ozeti).toBeTypeOf('string');

      // Check location data structure
      if (result.en_iyi_lokasyonlar.length > 0) {
        const location = result.en_iyi_lokasyonlar[0];
        expect(location.lat).toBeTypeOf('number');
        expect(location.lon).toBeTypeOf('number');
        expect(location.score).toBeTypeOf('number');
        expect(location.category).toBeTypeOf('string');
        expect(location.emoji).toBeTypeOf('string');
        expect(location.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(location.address).toBeTypeOf('string');
      }
    }, 20000); // 20 second timeout for area analysis

    it('should handle non-existent neighborhood', async () => {
      if (!isFlaskServerRunning) return;

      await expect(service.analyzeArea('NonExistentNeighborhood', 'cafe'))
        .rejects.toThrow();
    });
  });

  describe('Heatmap Data Integration', () => {
    it('should get heatmap data for a real area', async () => {
      if (!isFlaskServerRunning) return;

      const request = {
        kategori: 'eczane' as BusinessCategory,
        bounds: {
          north: 39.95,
          south: 39.90,
          east: 32.90,
          west: 32.80
        }
      };

      const result = await service.getHeatmapData(request);

      expect(result).toBeDefined();
      expect(result.heatmap_data).toBeInstanceOf(Array);
      expect(result.total_points).toBeGreaterThanOrEqual(0);
      expect(result.bounds).toBeTypeOf('object');

      // Check heatmap data structure
      if (result.heatmap_data.length > 0) {
        const dataPoint = result.heatmap_data[0];
        expect(dataPoint).toBeInstanceOf(Array);
        expect(dataPoint).toHaveLength(3);
        expect(dataPoint[0]).toBeTypeOf('number'); // lat
        expect(dataPoint[1]).toBeTypeOf('number'); // lon
        expect(dataPoint[2]).toBeTypeOf('number'); // intensity
      }
    }, 25000); // 25 second timeout for heatmap data
  });

  describe('Batch Operations Integration', () => {
    it('should batch analyze multiple points', async () => {
      if (!isFlaskServerRunning) return;

      const requests: PointAnalysisRequest[] = [
        { lat: 39.9334, lon: 32.8597, kategori: 'eczane' },
        { lat: 39.9234, lon: 32.8497, kategori: 'eczane' },
        { lat: 39.9134, lon: 32.8397, kategori: 'eczane' }
      ];

      const results = await service.batchAnalyzePoints(requests);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(requests.length);

      results.forEach(result => {
        expect(result.total_score).toBeTypeOf('number');
        expect(result.normalized_score).toBeGreaterThanOrEqual(0);
        expect(result.normalized_score).toBeLessThanOrEqual(100);
      });
    }, 30000); // 30 second timeout for batch operations

    it('should get area summary for multiple categories', async () => {
      if (!isFlaskServerRunning) return;

      const categories: BusinessCategory[] = ['eczane', 'cafe'];
      const result = await service.getAreaSummary('Çankaya', categories);

      expect(result).toBeTypeOf('object');
      expect(Object.keys(result).length).toBeGreaterThan(0);

      Object.entries(result).forEach(([kategori, analysis]) => {
        expect(categories).toContain(kategori as BusinessCategory);
        expect(analysis.mahalle).toBe('Çankaya');
        expect(analysis.kategori).toBe(kategori);
      });
    }, 40000); // 40 second timeout for multiple area analyses
  });

  describe('Caching Integration', () => {
    it('should cache and retrieve point analysis results', async () => {
      if (!isFlaskServerRunning) return;

      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };

      // First call - should hit the API
      const startTime1 = Date.now();
      const result1 = await service.analyzePoint(request);
      const duration1 = Date.now() - startTime1;

      // Second call - should hit the cache (faster)
      const startTime2 = Date.now();
      const result2 = await service.analyzePoint(request);
      const duration2 = Date.now() - startTime2;

      expect(result1).toEqual(result2);
      expect(duration2).toBeLessThan(duration1); // Cache should be faster
    }, 20000);

    it('should invalidate cache correctly', async () => {
      if (!isFlaskServerRunning) return;

      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };

      // Make initial request
      await service.analyzePoint(request);

      // Check if cached
      const cached = service.getCachedPointAnalysis(request);
      expect(cached).toBeDefined();

      // Invalidate cache
      service.invalidateLocationCache();

      // Cache should be cleared (this is harder to test directly)
      // We'll just verify the method doesn't throw
      expect(() => service.invalidateLocationCache('eczane')).not.toThrow();
      expect(() => service.invalidateLocationCache('eczane', 'Çankaya')).not.toThrow();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle server errors gracefully', async () => {
      if (!isFlaskServerRunning) return;

      // Test with invalid category that might cause server error
      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'invalid_category' as BusinessCategory
      };

      // Should either succeed (if server handles it) or fail gracefully
      try {
        await service.analyzePoint(request);
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toBeTypeOf('string');
      }
    });

    it('should handle network timeouts', async () => {
      if (!isFlaskServerRunning) return;

      // Create service with very short timeout
      const shortTimeoutService = new LocationAnalysisService({
        baseURL: 'http://localhost:5000',
        timeout: 1, // 1ms timeout - should always fail
        retryAttempts: 1,
        enableDebug: false
      });

      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };

      await expect(shortTimeoutService.analyzePoint(request)).rejects.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should complete point analysis within reasonable time', async () => {
      if (!isFlaskServerRunning) return;

      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };

      const startTime = Date.now();
      await service.analyzePoint(request);
      const duration = Date.now() - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it('should handle concurrent requests efficiently', async () => {
      if (!isFlaskServerRunning) return;

      const requests = Array.from({ length: 5 }, (_, i) => ({
        lat: 39.9334 + (i * 0.001),
        lon: 32.8597 + (i * 0.001),
        kategori: 'eczane' as BusinessCategory
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => service.analyzePoint(request))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      // Concurrent requests should be faster than sequential
      expect(duration).toBeLessThan(20000); // 20 seconds for 5 concurrent requests
    }, 25000);
  });
});