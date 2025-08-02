import { ApiService } from '../base';
import { API_ENDPOINTS, TIMEOUT_CONFIG } from '../config';
import {
  PointAnalysisRequest,
  PointAnalysisResponse,
  AreaAnalysisRequest,
  AreaAnalysisResponse,
  HeatmapRequest,
  HeatmapResponse,
  BusinessCategory
} from '../types';
import {
  transformPointAnalysisResponse,
  transformAreaAnalysisResponse,
  transformHeatmapResponse,
  validateCoordinates,
  validateBusinessCategory,
  standardizeApiResponse
} from '../utils/transformers';

export class LocationAnalysisService extends ApiService {
  /**
   * Handle location-specific errors
   */
  private handleLocationError(error: any, context: string): never {
    if (this.config.enableDebug) {
      console.error(`[LocationAnalysisService] ${context} error:`, error);
    }

    // Re-throw the error to be handled by the base error handler
    throw error;
  }

  /**
   * Validate analysis request parameters
   */
  private validateAnalysisRequest(request: PointAnalysisRequest): void {
    if (!request.lat || !request.lon) {
      throw new Error('Koordinat bilgileri eksik');
    }

    if (request.lat < 39.5 || request.lat > 40.2 || 
        request.lon < 32.3 || request.lon > 33.2) {
      throw new Error('Koordinatlar Ankara sınırları dışında');
    }

    if (!request.kategori) {
      throw new Error('İş kategorisi belirtilmemiş');
    }
  }

  /**
   * Analyze a specific point location using Flask /api/v5/score_point endpoint
   */
  async analyzePoint(request: PointAnalysisRequest): Promise<PointAnalysisResponse> {
    try {
      // Validate request parameters
      this.validateAnalysisRequest(request);
      
      // Validate and sanitize input coordinates
      const validatedCoords = validateCoordinates(request.lat, request.lon);
      const validatedCategory = validateBusinessCategory(request.kategori);
      
      const validatedRequest = {
        ...request,
        lat: validatedCoords.lat,
        lon: validatedCoords.lon,
        kategori: validatedCategory
      };

      return this.retryRequest(async () => {
        const response = await this.request<any>({
          method: 'POST',
          url: API_ENDPOINTS.POINT_ANALYSIS,
          data: validatedRequest,
          timeout: TIMEOUT_CONFIG.DEFAULT
        }, true, 2 * 60 * 1000); // Cache for 2 minutes
        
        // Transform response using utility function
        return standardizeApiResponse(response, transformPointAnalysisResponse);
      });
    } catch (error) {
      this.handleLocationError(error, 'Point Analysis');
    }
  }

  /**
   * Analyze a neighborhood/area using Flask /api/v8/mahalle_analizi endpoint
   */
  async analyzeArea(mahalle: string, kategori: BusinessCategory): Promise<AreaAnalysisResponse> {
    const validatedCategory = validateBusinessCategory(kategori);
    
    return this.retryRequest(async () => {
      const response = await this.request<any>({
        method: 'GET',
        url: `${API_ENDPOINTS.AREA_ANALYSIS}/${encodeURIComponent(mahalle)}/${validatedCategory}`,
        timeout: TIMEOUT_CONFIG.LONG_RUNNING
      }, true, 5 * 60 * 1000); // Cache for 5 minutes
      
      // Transform response using utility function
      return standardizeApiResponse(response, transformAreaAnalysisResponse);
    });
  }

  /**
   * Get heatmap data for a specific area and business category using Flask /api/v8/heatmap_data endpoint
   */
  async getHeatmapData(request: HeatmapRequest): Promise<HeatmapResponse> {
    const { kategori, bounds } = request;
    const validatedCategory = validateBusinessCategory(kategori);
    
    return this.retryRequest(async () => {
      const response = await this.request<any>({
        method: 'GET',
        url: `${API_ENDPOINTS.HEATMAP_DATA}/${validatedCategory}`,
        params: {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west
        },
        timeout: TIMEOUT_CONFIG.LONG_RUNNING
      }, true, 3 * 60 * 1000); // Cache for 3 minutes
      
      // Transform response using utility function
      return standardizeApiResponse(response, transformHeatmapResponse);
    });
  }

  /**
   * Get available locations for a specific business category
   */
  async getLocations(kategori: BusinessCategory): Promise<any[]> {
    return this.retryRequest(async () => {
      return await this.request<any[]>({
        method: 'GET',
        url: `${API_ENDPOINTS.LOCATIONS}/${kategori}`,
        timeout: TIMEOUT_CONFIG.DEFAULT
      }, true, 10 * 60 * 1000); // Cache for 10 minutes
    });
  }

  /**
   * Batch analyze multiple points
   */
  async batchAnalyzePoints(requests: PointAnalysisRequest[]): Promise<PointAnalysisResponse[]> {
    // Process requests in parallel with a concurrency limit
    const BATCH_SIZE = 5;
    const results: PointAnalysisResponse[] = [];
    
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(request => this.analyzePoint(request));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        // If batch fails, try individual requests
        for (const request of batch) {
          try {
            const result = await this.analyzePoint(request);
            results.push(result);
          } catch (individualError) {
            // Log error but continue with other requests
            console.error('Failed to analyze point:', request, individualError);
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Get analysis summary for multiple categories in an area
   */
  async getAreaSummary(mahalle: string, categories: BusinessCategory[]): Promise<Record<BusinessCategory, AreaAnalysisResponse>> {
    const promises = categories.map(async (kategori) => {
      try {
        const result = await this.analyzeArea(mahalle, kategori);
        return { kategori, result };
      } catch (error) {
        console.error(`Failed to analyze ${kategori} in ${mahalle}:`, error);
        return { kategori, result: null };
      }
    });

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { kategori, result }) => {
      if (result) {
        acc[kategori] = result;
      }
      return acc;
    }, {} as Record<BusinessCategory, AreaAnalysisResponse>);
  }

  /**
   * Invalidate cache for specific location or category
   */
  invalidateLocationCache(kategori?: BusinessCategory, mahalle?: string): void {
    if (kategori && mahalle) {
      this.invalidateCache(`${API_ENDPOINTS.AREA_ANALYSIS}/${mahalle}/${kategori}`);
    } else if (kategori) {
      this.invalidateCache(kategori);
    } else {
      this.invalidateCache();
    }
  }

  /**
   * Get cached analysis if available
   */
  getCachedPointAnalysis(request: PointAnalysisRequest): PointAnalysisResponse | null {
    const cacheKey = `POST:${API_ENDPOINTS.POINT_ANALYSIS}`;
    return (this as any).cache.get(cacheKey, request);
  }

  /**
   * Pre-warm cache with common analysis requests
   */
  async preWarmCache(commonRequests: PointAnalysisRequest[]): Promise<void> {
    // Execute requests in background without waiting
    commonRequests.forEach(request => {
      this.analyzePoint(request).catch(error => {
        console.warn('Pre-warm cache failed for:', request, error);
      });
    });
  }
}