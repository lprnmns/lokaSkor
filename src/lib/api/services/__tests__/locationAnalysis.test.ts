import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { LocationAnalysisService } from '../locationAnalysis';
import { PointAnalysisRequest, BusinessCategory, ErrorType } from '../../types';

// Mock the base ApiService
vi.mock('../../base', () => ({
  ApiService: class MockApiService {
    retryRequest = vi.fn();
    request = vi.fn();
    invalidateCache = vi.fn();
    cache = {
      get: vi.fn()
    };
  }
}));

describe('LocationAnalysisService', () => {
  let service: LocationAnalysisService;
  let mockRetryRequest: Mock;
  let mockRequest: Mock;

  beforeEach(() => {
    service = new LocationAnalysisService();
    mockRetryRequest = (service as any).retryRequest;
    mockRequest = (service as any).request;
  });

  describe('analyzePoint', () => {
    it('should analyze a point successfully', async () => {
      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };

      const expectedResponse = {
        total_score: 85.5,
        normalized_score: 85.5,
        raw_score: 342.1,
        category: 'Çok İyi',
        color: '#ffc107',
        emoji: '🟡',
        breakdown: {
          hastane: { score: 80, distance: 500 },
          rakip_eczane: { score: -20, distance: 300 }
        }
      };

      mockRetryRequest.mockResolvedValue(expectedResponse);

      const result = await service.analyzePoint(request);

      expect(result).toEqual(expectedResponse);
      expect(mockRetryRequest).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle point analysis errors', async () => {
      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };

      const error = {
        type: ErrorType.LOCATION_ERROR,
        message: 'Bu bölge ticari faaliyet için uygun değil'
      };

      mockRetryRequest.mockRejectedValue(error);

      await expect(service.analyzePoint(request)).rejects.toEqual(error);
    });
  });

  describe('analyzeArea', () => {
    it('should analyze an area successfully', async () => {
      const mahalle = 'Çankaya';
      const kategori: BusinessCategory = 'cafe';

      const expectedResponse = {
        mahalle: 'Çankaya',
        kategori: 'cafe',
        en_iyi_lokasyonlar: [
          {
            lat: 39.9334,
            lon: 32.8597,
            score: 92.5,
            category: 'Mükemmel',
            emoji: '🟢',
            color: '#28a745',
            address: 'Çankaya - Grid 123'
          }
        ],
        toplam_lokasyon: 15,
        ortalama_skor: 78.3,
        analiz_ozeti: 'Çankaya için 15 lokasyon analiz edildi. Ortalama skor: 78.3/100'
      };

      mockRetryRequest.mockResolvedValue(expectedResponse);

      const result = await service.analyzeArea(mahalle, kategori);

      expect(result).toEqual(expectedResponse);
      expect(mockRetryRequest).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle area analysis errors', async () => {
      const mahalle = 'NonExistentArea';
      const kategori: BusinessCategory = 'cafe';

      const error = {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Mahalle bulunamadı'
      };

      mockRetryRequest.mockRejectedValue(error);

      await expect(service.analyzeArea(mahalle, kategori)).rejects.toEqual(error);
    });
  });

  describe('getHeatmapData', () => {
    it('should get heatmap data successfully', async () => {
      const request = {
        kategori: 'eczane' as BusinessCategory,
        bounds: {
          north: 40.0,
          south: 39.8,
          east: 33.0,
          west: 32.5
        }
      };

      const expectedResponse = {
        heatmap_data: [
          [39.9334, 32.8597, 0.85],
          [39.9234, 32.8497, 0.72],
          [39.9134, 32.8397, 0.91]
        ],
        total_points: 3,
        bounds: request.bounds
      };

      mockRetryRequest.mockResolvedValue(expectedResponse);

      const result = await service.getHeatmapData(request);

      expect(result).toEqual(expectedResponse);
      expect(mockRetryRequest).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('getLocations', () => {
    it('should get locations for a category', async () => {
      const kategori: BusinessCategory = 'market';
      const expectedLocations = [
        { id: 1, name: 'Market A', lat: 39.9334, lon: 32.8597 },
        { id: 2, name: 'Market B', lat: 39.9234, lon: 32.8497 }
      ];

      mockRetryRequest.mockResolvedValue(expectedLocations);

      const result = await service.getLocations(kategori);

      expect(result).toEqual(expectedLocations);
    });
  });

  describe('batchAnalyzePoints', () => {
    it('should analyze multiple points in batches', async () => {
      const requests: PointAnalysisRequest[] = [
        { lat: 39.9334, lon: 32.8597, kategori: 'eczane' },
        { lat: 39.9234, lon: 32.8497, kategori: 'eczane' },
        { lat: 39.9134, lon: 32.8397, kategori: 'eczane' }
      ];

      const mockResponses = [
        { total_score: 85, normalized_score: 85, raw_score: 340, category: 'Çok İyi', color: '#ffc107', emoji: '🟡', breakdown: {} },
        { total_score: 72, normalized_score: 72, raw_score: 288, category: 'İyi', color: '#fd7e14', emoji: '🟠', breakdown: {} },
        { total_score: 91, normalized_score: 91, raw_score: 364, category: 'Mükemmel', color: '#28a745', emoji: '🟢', breakdown: {} }
      ];

      // Mock analyzePoint to return different responses for each request
      vi.spyOn(service, 'analyzePoint')
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const results = await service.batchAnalyzePoints(requests);

      expect(results).toEqual(mockResponses);
      expect(service.analyzePoint).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in batch analysis', async () => {
      const requests: PointAnalysisRequest[] = [
        { lat: 39.9334, lon: 32.8597, kategori: 'eczane' },
        { lat: 39.9234, lon: 32.8497, kategori: 'eczane' }
      ];

      const successResponse = { 
        total_score: 85, normalized_score: 85, raw_score: 340, 
        category: 'Çok İyi', color: '#ffc107', emoji: '🟡', breakdown: {} 
      };

      // Mock first request to succeed, second to fail
      vi.spyOn(service, 'analyzePoint')
        .mockResolvedValueOnce(successResponse)
        .mockRejectedValueOnce(new Error('Analysis failed'));

      const results = await service.batchAnalyzePoints(requests);

      expect(results).toEqual([successResponse]);
      expect(service.analyzePoint).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAreaSummary', () => {
    it('should get summary for multiple categories', async () => {
      const mahalle = 'Çankaya';
      const categories: BusinessCategory[] = ['eczane', 'cafe'];

      const eczaneResponse = {
        mahalle: 'Çankaya',
        kategori: 'eczane',
        en_iyi_lokasyonlar: [],
        toplam_lokasyon: 5,
        ortalama_skor: 80,
        analiz_ozeti: 'Eczane analizi'
      };

      const cafeResponse = {
        mahalle: 'Çankaya',
        kategori: 'cafe',
        en_iyi_lokasyonlar: [],
        toplam_lokasyon: 8,
        ortalama_skor: 75,
        analiz_ozeti: 'Cafe analizi'
      };

      vi.spyOn(service, 'analyzeArea')
        .mockResolvedValueOnce(eczaneResponse)
        .mockResolvedValueOnce(cafeResponse);

      const result = await service.getAreaSummary(mahalle, categories);

      expect(result).toEqual({
        eczane: eczaneResponse,
        cafe: cafeResponse
      });
    });

    it('should handle failures in area summary gracefully', async () => {
      const mahalle = 'Çankaya';
      const categories: BusinessCategory[] = ['eczane', 'cafe'];

      const eczaneResponse = {
        mahalle: 'Çankaya',
        kategori: 'eczane',
        en_iyi_lokasyonlar: [],
        toplam_lokasyon: 5,
        ortalama_skor: 80,
        analiz_ozeti: 'Eczane analizi'
      };

      vi.spyOn(service, 'analyzeArea')
        .mockResolvedValueOnce(eczaneResponse)
        .mockRejectedValueOnce(new Error('Cafe analysis failed'));

      const result = await service.getAreaSummary(mahalle, categories);

      expect(result).toEqual({
        eczane: eczaneResponse
      });
    });
  });

  describe('cache management', () => {
    it('should invalidate cache for specific category and mahalle', () => {
      const mockInvalidateCache = vi.spyOn(service, 'invalidateCache');

      service.invalidateLocationCache('eczane', 'Çankaya');

      expect(mockInvalidateCache).toHaveBeenCalledWith('/api/v8/mahalle_analizi/Çankaya/eczane');
    });

    it('should invalidate cache for category only', () => {
      const mockInvalidateCache = vi.spyOn(service, 'invalidateCache');

      service.invalidateLocationCache('eczane');

      expect(mockInvalidateCache).toHaveBeenCalledWith('eczane');
    });

    it('should clear all cache when no parameters provided', () => {
      const mockInvalidateCache = vi.spyOn(service, 'invalidateCache');

      service.invalidateLocationCache();

      expect(mockInvalidateCache).toHaveBeenCalledWith();
    });

    it('should get cached point analysis', () => {
      const request: PointAnalysisRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };

      const cachedResponse = {
        total_score: 85,
        normalized_score: 85,
        raw_score: 340,
        category: 'Çok İyi',
        color: '#ffc107',
        emoji: '🟡',
        breakdown: {}
      };

      (service as any).cache.get.mockReturnValue(cachedResponse);

      const result = service.getCachedPointAnalysis(request);

      expect(result).toEqual(cachedResponse);
    });
  });

  describe('preWarmCache', () => {
    it('should pre-warm cache with common requests', async () => {
      const commonRequests: PointAnalysisRequest[] = [
        { lat: 39.9334, lon: 32.8597, kategori: 'eczane' },
        { lat: 39.9234, lon: 32.8497, kategori: 'cafe' }
      ];

      const mockAnalyzePoint = vi.spyOn(service, 'analyzePoint')
        .mockResolvedValue({} as any);

      await service.preWarmCache(commonRequests);

      // Give a small delay for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockAnalyzePoint).toHaveBeenCalledTimes(2);
    });
  });
});