/**
 * Data transformation utilities for API responses
 */

import { 
  PointAnalysisResponse, 
  AreaAnalysisResponse, 
  HeatmapResponse,
  BusinessCategory 
} from '../types';

/**
 * Transform Flask point analysis response to frontend format
 */
export function transformPointAnalysisResponse(response: any): PointAnalysisResponse {
  // Ensure all required fields are present with defaults
  return {
    total_score: response.total_score || 0,
    normalized_score: response.normalized_score || 0,
    raw_score: response.raw_score || response.total_score || 0,
    category: response.category || 'Uygun Değil',
    color: response.color || '#6c757d',
    emoji: response.emoji || '⚫',
    breakdown: response.breakdown || {}
  };
}

/**
 * Transform Flask area analysis response to frontend format
 */
export function transformAreaAnalysisResponse(response: any): AreaAnalysisResponse {
  return {
    mahalle: response.mahalle || '',
    kategori: response.kategori || '',
    en_iyi_lokasyonlar: (response.en_iyi_lokasyonlar || []).map((location: any) => ({
      lat: location.lat || 0,
      lon: location.lon || 0,
      score: location.score || 0,
      category: location.category || 'Uygun Değil',
      emoji: location.emoji || '⚫',
      color: location.color || '#6c757d',
      address: location.address || `${location.lat?.toFixed(4)}, ${location.lon?.toFixed(4)}`
    })),
    toplam_lokasyon: response.toplam_lokasyon || 0,
    ortalama_skor: response.ortalama_skor || 0,
    analiz_ozeti: response.analiz_ozeti || 'Analiz tamamlandı'
  };
}

/**
 * Transform Flask heatmap response to frontend format
 */
export function transformHeatmapResponse(response: any): HeatmapResponse {
  return {
    heatmap_data: response.heatmap_data || [],
    total_points: response.total_points || 0,
    bounds: response.bounds || { north: 0, south: 0, east: 0, west: 0 },
    message: response.message
  };
}

/**
 * Validate and sanitize coordinates
 */
export function validateCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  // Ankara bounds (approximate)
  const ANKARA_BOUNDS = {
    lat: { min: 39.5, max: 40.2 },
    lon: { min: 32.3, max: 33.2 }
  };

  const sanitizedLat = Math.max(ANKARA_BOUNDS.lat.min, Math.min(ANKARA_BOUNDS.lat.max, lat));
  const sanitizedLon = Math.max(ANKARA_BOUNDS.lon.min, Math.min(ANKARA_BOUNDS.lon.max, lon));

  return { lat: sanitizedLat, lon: sanitizedLon };
}

/**
 * Validate business category
 */
export function validateBusinessCategory(category: string): BusinessCategory {
  const validCategories: BusinessCategory[] = ['eczane', 'firin', 'cafe', 'market', 'restoran'];
  
  if (validCategories.includes(category as BusinessCategory)) {
    return category as BusinessCategory;
  }
  
  // Default to cafe if invalid category
  return 'cafe';
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  if (score >= 90) return `${score.toFixed(1)} - Mükemmel`;
  if (score >= 70) return `${score.toFixed(1)} - Çok İyi`;
  if (score >= 50) return `${score.toFixed(1)} - İyi`;
  if (score >= 30) return `${score.toFixed(1)} - Orta`;
  return `${score.toFixed(1)} - Uygun Değil`;
}

/**
 * Get category color based on score
 */
export function getCategoryColor(score: number): string {
  if (score >= 90) return '#28a745'; // Green
  if (score >= 70) return '#ffc107'; // Yellow
  if (score >= 50) return '#fd7e14'; // Orange
  if (score >= 30) return '#dc3545'; // Red
  return '#6c757d'; // Gray
}

/**
 * Get category emoji based on score
 */
export function getCategoryEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  if (score >= 30) return '🔴';
  return '⚫';
}

/**
 * Transform raw Flask response to standardized format
 */
export function standardizeApiResponse<T>(response: any, transformer: (data: any) => T): T {
  try {
    // Handle different response formats from Flask
    if (response.data) {
      return transformer(response.data);
    } else if (response.error) {
      throw new Error(response.error);
    } else {
      return transformer(response);
    }
  } catch (error) {
    console.error('Response transformation error:', error);
    throw error;
  }
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Create cache key for API requests
 */
export function createCacheKey(endpoint: string, params?: any): string {
  if (!params) return endpoint;
  
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as any);
    
  return `${endpoint}:${JSON.stringify(sortedParams)}`;
}

/**
 * Check if coordinates are within Ankara bounds
 */
export function isWithinAnkaraBounds(lat: number, lon: number): boolean {
  const ANKARA_BOUNDS = {
    lat: { min: 39.5, max: 40.2 },
    lon: { min: 32.3, max: 33.2 }
  };

  return (
    lat >= ANKARA_BOUNDS.lat.min && lat <= ANKARA_BOUNDS.lat.max &&
    lon >= ANKARA_BOUNDS.lon.min && lon <= ANKARA_BOUNDS.lon.max
  );
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}