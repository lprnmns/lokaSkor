/**
 * Tests for Type Validation Functions
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  BusinessCategorySchema,
  AnalysisModeSchema,
  LatLngSchema,
  MapBoundsSchema,
  PointAnalysisRequestSchema,
  PointAnalysisResponseSchema,
  AreaAnalysisResponseSchema,
  HeatmapResponseSchema,
  ApiErrorSchema,
  validateBusinessCategory,
  validateCoordinates,
  validateMapBounds,
  validateApiResponse
} from '../schemas';

import {
  isBusinessCategory,
  isAnalysisMode,
  isLatLng,
  isMapBounds,
  isPointAnalysisResponse,
  isAreaAnalysisResponse,
  isHeatmapResponse,
  isApiError,
  isValidCoordinates,
  isValidScore,
  isValidColor,
  assertIsBusinessCategory,
  assertIsLatLng
} from '../guards';

describe('Zod Schemas', () => {
  describe('BusinessCategorySchema', () => {
    it('should validate valid business categories', () => {
      const validCategories = ['eczane', 'firin', 'cafe', 'market', 'restoran'];
      
      validCategories.forEach(category => {
        expect(BusinessCategorySchema.safeParse(category).success).toBe(true);
      });
    });

    it('should reject invalid business categories', () => {
      const invalidCategories = ['invalid', 'restaurant', 'pharmacy', '', null, undefined, 123];
      
      invalidCategories.forEach(category => {
        expect(BusinessCategorySchema.safeParse(category).success).toBe(false);
      });
    });
  });

  describe('AnalysisModeSchema', () => {
    it('should validate valid analysis modes', () => {
      const validModes = ['point', 'area', 'heatmap'];
      
      validModes.forEach(mode => {
        expect(AnalysisModeSchema.safeParse(mode).success).toBe(true);
      });
    });

    it('should reject invalid analysis modes', () => {
      const invalidModes = ['invalid', 'location', 'map', '', null, undefined, 123];
      
      invalidModes.forEach(mode => {
        expect(AnalysisModeSchema.safeParse(mode).success).toBe(false);
      });
    });
  });

  describe('LatLngSchema', () => {
    it('should validate valid Ankara coordinates', () => {
      const validCoords = [
        { lat: 39.9334, lng: 32.8597 }, // Kızılay
        { lat: 39.5, lng: 32.3 }, // Min bounds
        { lat: 40.2, lng: 33.2 }, // Max bounds
        { lat: 39.75, lng: 32.75 } // Middle
      ];
      
      validCoords.forEach(coord => {
        expect(LatLngSchema.safeParse(coord).success).toBe(true);
      });
    });

    it('should reject coordinates outside Ankara bounds', () => {
      const invalidCoords = [
        { lat: 39.4, lng: 32.8 }, // South of Ankara
        { lat: 40.3, lng: 32.8 }, // North of Ankara
        { lat: 39.9, lng: 32.2 }, // West of Ankara
        { lat: 39.9, lng: 33.3 }, // East of Ankara
        { lat: 41.0, lng: 29.0 }, // Istanbul
        { lat: 0, lng: 0 }, // Null Island
        { lat: null, lng: 32.8 }, // Invalid lat
        { lat: 39.9, lng: null } // Invalid lng
      ];
      
      invalidCoords.forEach(coord => {
        expect(LatLngSchema.safeParse(coord).success).toBe(false);
      });
    });
  });

  describe('MapBoundsSchema', () => {
    it('should validate valid map bounds', () => {
      const validBounds = {
        north: 40.0,
        south: 39.8,
        east: 33.0,
        west: 32.5
      };
      
      expect(MapBoundsSchema.safeParse(validBounds).success).toBe(true);
    });

    it('should reject invalid map bounds', () => {
      const invalidBounds = [
        { north: 39.8, south: 40.0, east: 33.0, west: 32.5 }, // north < south
        { north: 40.0, south: 39.8, east: 32.5, west: 33.0 }, // east < west
        { north: 40.3, south: 39.8, east: 33.0, west: 32.5 }, // north out of bounds
        { north: 40.0, south: 39.4, east: 33.0, west: 32.5 }, // south out of bounds
        { north: 40.0, south: 39.8, east: 33.3, west: 32.5 }, // east out of bounds
        { north: 40.0, south: 39.8, east: 33.0, west: 32.2 }  // west out of bounds
      ];
      
      invalidBounds.forEach(bounds => {
        expect(MapBoundsSchema.safeParse(bounds).success).toBe(false);
      });
    });
  });

  describe('PointAnalysisRequestSchema', () => {
    it('should validate valid point analysis request', () => {
      const validRequest = {
        lat: 39.9334,
        lon: 32.8597,
        kategori: 'eczane'
      };
      
      expect(PointAnalysisRequestSchema.safeParse(validRequest).success).toBe(true);
    });

    it('should reject invalid point analysis request', () => {
      const invalidRequests = [
        { lat: 39.9334, lon: 32.8597 }, // Missing kategori
        { lat: 39.9334, kategori: 'eczane' }, // Missing lon
        { lon: 32.8597, kategori: 'eczane' }, // Missing lat
        { lat: 41.0, lon: 29.0, kategori: 'eczane' }, // Invalid coordinates
        { lat: 39.9334, lon: 32.8597, kategori: 'invalid' } // Invalid kategori
      ];
      
      invalidRequests.forEach(request => {
        expect(PointAnalysisRequestSchema.safeParse(request).success).toBe(false);
      });
    });
  });

  describe('PointAnalysisResponseSchema', () => {
    it('should validate valid point analysis response', () => {
      const validResponse = {
        total_score: 85.5,
        normalized_score: 85.5,
        raw_score: 342.1,
        category: 'Çok İyi',
        color: '#ffc107',
        emoji: '🟡',
        breakdown: {
          hastane: { score: 80, distance: 500 },
          rakip_eczane: { score: -20, distance: 300 },
          simple_score: 15
        }
      };
      
      expect(PointAnalysisResponseSchema.safeParse(validResponse).success).toBe(true);
    });

    it('should reject invalid point analysis response', () => {
      const invalidResponses = [
        { // Missing required fields
          total_score: 85.5
        },
        { // Invalid normalized_score range
          total_score: 85.5,
          normalized_score: 150,
          raw_score: 342.1,
          category: 'Çok İyi',
          color: '#ffc107',
          emoji: '🟡',
          breakdown: {}
        },
        { // Invalid color format
          total_score: 85.5,
          normalized_score: 85.5,
          raw_score: 342.1,
          category: 'Çok İyi',
          color: 'invalid-color',
          emoji: '🟡',
          breakdown: {}
        },
        { // Invalid category
          total_score: 85.5,
          normalized_score: 85.5,
          raw_score: 342.1,
          category: 'Invalid Category',
          color: '#ffc107',
          emoji: '🟡',
          breakdown: {}
        }
      ];
      
      invalidResponses.forEach(response => {
        expect(PointAnalysisResponseSchema.safeParse(response).success).toBe(false);
      });
    });
  });
});

describe('Type Guards', () => {
  describe('isBusinessCategory', () => {
    it('should return true for valid business categories', () => {
      const validCategories = ['eczane', 'firin', 'cafe', 'market', 'restoran'];
      
      validCategories.forEach(category => {
        expect(isBusinessCategory(category)).toBe(true);
      });
    });

    it('should return false for invalid business categories', () => {
      const invalidCategories = ['invalid', 'restaurant', null, undefined, 123, {}];
      
      invalidCategories.forEach(category => {
        expect(isBusinessCategory(category)).toBe(false);
      });
    });
  });

  describe('isLatLng', () => {
    it('should return true for valid coordinates', () => {
      const validCoords = [
        { lat: 39.9334, lng: 32.8597 },
        { lat: 39.5, lng: 32.3 },
        { lat: 40.2, lng: 33.2 }
      ];
      
      validCoords.forEach(coord => {
        expect(isLatLng(coord)).toBe(true);
      });
    });

    it('should return false for invalid coordinates', () => {
      const invalidCoords = [
        { lat: 41.0, lng: 29.0 }, // Outside bounds
        { lat: 39.9334 }, // Missing lng
        { lng: 32.8597 }, // Missing lat
        null,
        undefined,
        'invalid',
        123
      ];
      
      invalidCoords.forEach(coord => {
        expect(isLatLng(coord)).toBe(false);
      });
    });
  });

  describe('isValidCoordinates', () => {
    it('should return true for valid coordinate pairs', () => {
      expect(isValidCoordinates(39.9334, 32.8597)).toBe(true);
      expect(isValidCoordinates(39.5, 32.3)).toBe(true);
      expect(isValidCoordinates(40.2, 33.2)).toBe(true);
    });

    it('should return false for invalid coordinate pairs', () => {
      expect(isValidCoordinates(41.0, 29.0)).toBe(false); // Outside bounds
      expect(isValidCoordinates('39.9334', 32.8597)).toBe(false); // String lat
      expect(isValidCoordinates(39.9334, '32.8597')).toBe(false); // String lng
      expect(isValidCoordinates(null, 32.8597)).toBe(false); // Null lat
      expect(isValidCoordinates(39.9334, null)).toBe(false); // Null lng
    });
  });

  describe('isValidScore', () => {
    it('should return true for valid scores', () => {
      expect(isValidScore(0)).toBe(true);
      expect(isValidScore(50)).toBe(true);
      expect(isValidScore(100)).toBe(true);
      expect(isValidScore(85.5)).toBe(true);
    });

    it('should return false for invalid scores', () => {
      expect(isValidScore(-1)).toBe(false);
      expect(isValidScore(101)).toBe(false);
      expect(isValidScore('85')).toBe(false);
      expect(isValidScore(null)).toBe(false);
      expect(isValidScore(undefined)).toBe(false);
    });
  });

  describe('isValidColor', () => {
    it('should return true for valid hex colors', () => {
      expect(isValidColor('#ffffff')).toBe(true);
      expect(isValidColor('#000000')).toBe(true);
      expect(isValidColor('#ffc107')).toBe(true);
      expect(isValidColor('#28a745')).toBe(true);
    });

    it('should return false for invalid colors', () => {
      expect(isValidColor('white')).toBe(false);
      expect(isValidColor('#fff')).toBe(false); // Too short
      expect(isValidColor('#fffffff')).toBe(false); // Too long
      expect(isValidColor('ffc107')).toBe(false); // Missing #
      expect(isValidColor('#gggggg')).toBe(false); // Invalid hex
      expect(isValidColor(null)).toBe(false);
    });
  });
});

describe('Validation Functions', () => {
  describe('validateBusinessCategory', () => {
    it('should return true for valid categories', () => {
      expect(validateBusinessCategory('eczane')).toBe(true);
      expect(validateBusinessCategory('cafe')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(validateBusinessCategory('invalid')).toBe(false);
      expect(validateBusinessCategory(null)).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should return validated coordinates for valid input', () => {
      const result = validateCoordinates(39.9334, 32.8597);
      expect(result).toEqual({ lat: 39.9334, lon: 32.8597 });
    });

    it('should throw error for invalid coordinates', () => {
      expect(() => validateCoordinates(41.0, 29.0)).toThrow('Invalid coordinates');
      expect(() => validateCoordinates('39.9334', 32.8597)).toThrow('Invalid coordinates');
    });
  });

  describe('validateMapBounds', () => {
    it('should return validated bounds for valid input', () => {
      const bounds = {
        north: 40.0,
        south: 39.8,
        east: 33.0,
        west: 32.5
      };
      
      const result = validateMapBounds(bounds);
      expect(result).toEqual(bounds);
    });

    it('should throw error for invalid bounds', () => {
      const invalidBounds = {
        north: 39.8,
        south: 40.0,
        east: 33.0,
        west: 32.5
      };
      
      expect(() => validateMapBounds(invalidBounds)).toThrow('Invalid map bounds');
    });
  });

  describe('validateApiResponse', () => {
    it('should return validated data for valid response', () => {
      const response = {
        total_score: 85.5,
        normalized_score: 85.5,
        raw_score: 342.1,
        category: 'Çok İyi',
        color: '#ffc107',
        emoji: '🟡',
        breakdown: {}
      };
      
      const result = validateApiResponse(response, PointAnalysisResponseSchema);
      expect(result).toEqual(response);
    });

    it('should throw error for invalid response', () => {
      const invalidResponse = {
        total_score: 85.5
        // Missing required fields
      };
      
      expect(() => validateApiResponse(invalidResponse, PointAnalysisResponseSchema))
        .toThrow('API response validation failed');
    });
  });
});

describe('Assertion Functions', () => {
  describe('assertIsBusinessCategory', () => {
    it('should not throw for valid business category', () => {
      expect(() => assertIsBusinessCategory('eczane')).not.toThrow();
    });

    it('should throw for invalid business category', () => {
      expect(() => assertIsBusinessCategory('invalid')).toThrow(TypeError);
      expect(() => assertIsBusinessCategory(null)).toThrow(TypeError);
    });
  });

  describe('assertIsLatLng', () => {
    it('should not throw for valid coordinates', () => {
      const coords = { lat: 39.9334, lng: 32.8597 };
      expect(() => assertIsLatLng(coords)).not.toThrow();
    });

    it('should throw for invalid coordinates', () => {
      expect(() => assertIsLatLng({ lat: 41.0, lng: 29.0 })).toThrow(TypeError);
      expect(() => assertIsLatLng(null)).toThrow(TypeError);
    });
  });
});

describe('Complex Validation Scenarios', () => {
  it('should validate complete point analysis workflow', () => {
    // Request validation
    const request = {
      lat: 39.9334,
      lon: 32.8597,
      kategori: 'eczane'
    };
    
    expect(PointAnalysisRequestSchema.safeParse(request).success).toBe(true);
    expect(isLatLng({ lat: request.lat, lng: request.lon })).toBe(true);
    expect(isBusinessCategory(request.kategori)).toBe(true);
    
    // Response validation
    const response = {
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
    
    expect(PointAnalysisResponseSchema.safeParse(response).success).toBe(true);
    expect(isPointAnalysisResponse(response)).toBe(true);
    expect(isValidScore(response.normalized_score)).toBe(true);
    expect(isValidColor(response.color)).toBe(true);
  });

  it('should validate area analysis with location data', () => {
    const response = {
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
      analiz_ozeti: 'Çankaya için 15 lokasyon analiz edildi.'
    };
    
    expect(AreaAnalysisResponseSchema.safeParse(response).success).toBe(true);
    expect(isAreaAnalysisResponse(response)).toBe(true);
    
    // Validate location data
    response.en_iyi_lokasyonlar.forEach(location => {
      expect(isValidCoordinates(location.lat, location.lon)).toBe(true);
      expect(isValidScore(location.score)).toBe(true);
      expect(isValidColor(location.color)).toBe(true);
    });
  });

  it('should validate heatmap data structure', () => {
    const response = {
      heatmap_data: [
        [39.9334, 32.8597, 0.85],
        [39.9234, 32.8497, 0.72],
        [39.9134, 32.8397, 0.91]
      ],
      total_points: 3,
      bounds: {
        north: 40.0,
        south: 39.8,
        east: 33.0,
        west: 32.5
      }
    };
    
    expect(HeatmapResponseSchema.safeParse(response).success).toBe(true);
    expect(isHeatmapResponse(response)).toBe(true);
    expect(isMapBounds(response.bounds)).toBe(true);
    
    // Validate heatmap data points
    response.heatmap_data.forEach(([lat, lon, intensity]) => {
      expect(typeof lat).toBe('number');
      expect(typeof lon).toBe('number');
      expect(typeof intensity).toBe('number');
      expect(intensity).toBeGreaterThanOrEqual(0);
      expect(intensity).toBeLessThanOrEqual(1);
    });
  });
});