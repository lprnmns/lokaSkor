import { z } from 'zod';
import {
  PointAnalysisRequest,
  AreaAnalysisRequest,
  HeatmapRequest,
  PointAnalysisResponse,
  AreaAnalysisResponse,
  HeatmapResponse,
  BusinessCategory,
  MapBounds
} from '../types';

// Business category schema
const businessCategorySchema = z.enum(['eczane', 'firin', 'cafe', 'market', 'restoran']);

// Coordinate schemas
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

// Map bounds schema
const mapBoundsSchema = z.object({
  north: latitudeSchema,
  south: latitudeSchema,
  east: longitudeSchema,
  west: longitudeSchema
}).refine(
  (bounds) => bounds.north > bounds.south && bounds.east > bounds.west,
  { message: "Invalid bounds: north must be > south, east must be > west" }
);

// Request validation schemas
export const pointAnalysisRequestSchema = z.object({
  lat: latitudeSchema,
  lon: longitudeSchema,
  kategori: businessCategorySchema
});

export const areaAnalysisRequestSchema = z.object({
  mahalle: z.string().min(1, "Mahalle adı boş olamaz"),
  kategori: businessCategorySchema
});

export const heatmapRequestSchema = z.object({
  kategori: businessCategorySchema,
  bounds: mapBoundsSchema
});

// Response validation schemas
const locationDataSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  score: z.number(),
  category: z.string(),
  emoji: z.string(),
  color: z.string(),
  address: z.string()
});

export const pointAnalysisResponseSchema = z.object({
  total_score: z.number(),
  normalized_score: z.number(),
  raw_score: z.number(),
  category: z.string(),
  color: z.string(),
  emoji: z.string(),
  breakdown: z.record(z.any())
});

export const areaAnalysisResponseSchema = z.object({
  mahalle: z.string(),
  kategori: z.string(),
  en_iyi_lokasyonlar: z.array(locationDataSchema),
  toplam_lokasyon: z.number(),
  ortalama_skor: z.number(),
  analiz_ozeti: z.string()
});

export const heatmapResponseSchema = z.object({
  heatmap_data: z.array(z.tuple([z.number(), z.number(), z.number()])),
  total_points: z.number(),
  bounds: mapBoundsSchema,
  message: z.string().optional()
});

// Validation functions
export const validatePointAnalysisRequest = (data: unknown): PointAnalysisRequest => {
  return pointAnalysisRequestSchema.parse(data);
};

export const validateAreaAnalysisRequest = (data: unknown): AreaAnalysisRequest => {
  return areaAnalysisRequestSchema.parse(data);
};

export const validateHeatmapRequest = (data: unknown): HeatmapRequest => {
  return heatmapRequestSchema.parse(data);
};

export const validatePointAnalysisResponse = (data: unknown): PointAnalysisResponse => {
  return pointAnalysisResponseSchema.parse(data);
};

export const validateAreaAnalysisResponse = (data: unknown): AreaAnalysisResponse => {
  return areaAnalysisResponseSchema.parse(data);
};

export const validateHeatmapResponse = (data: unknown): HeatmapResponse => {
  return heatmapResponseSchema.parse(data);
};

// Utility validation functions
export const isValidBusinessCategory = (category: string): category is BusinessCategory => {
  return businessCategorySchema.safeParse(category).success;
};

export const isValidCoordinate = (lat: number, lon: number): boolean => {
  return latitudeSchema.safeParse(lat).success && longitudeSchema.safeParse(lon).success;
};

export const isValidMapBounds = (bounds: MapBounds): boolean => {
  return mapBoundsSchema.safeParse(bounds).success;
};

// Safe validation functions (returns null on error instead of throwing)
export const safeValidatePointAnalysisRequest = (data: unknown): PointAnalysisRequest | null => {
  const result = pointAnalysisRequestSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeValidateAreaAnalysisRequest = (data: unknown): AreaAnalysisRequest | null => {
  const result = areaAnalysisRequestSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeValidateHeatmapRequest = (data: unknown): HeatmapRequest | null => {
  const result = heatmapRequestSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeValidatePointAnalysisResponse = (data: unknown): PointAnalysisResponse | null => {
  const result = pointAnalysisResponseSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeValidateAreaAnalysisResponse = (data: unknown): AreaAnalysisResponse | null => {
  const result = areaAnalysisResponseSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeValidateHeatmapResponse = (data: unknown): HeatmapResponse | null => {
  const result = heatmapResponseSchema.safeParse(data);
  return result.success ? result.data : null;
};

// Validation error formatter
export const formatValidationError = (error: z.ZodError): string => {
  const issues = error.issues.map(issue => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  
  return `Validation failed: ${issues.join(', ')}`;
};

// Custom validation rules
export const validateTurkishMahalle = (mahalle: string): boolean => {
  // Basic validation for Turkish neighborhood names
  const turkishPattern = /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/;
  return turkishPattern.test(mahalle) && mahalle.length >= 2 && mahalle.length <= 50;
};

export const validateAnkaraCoordinates = (lat: number, lon: number): boolean => {
  // Rough bounds for Ankara, Turkey
  const ankaraBounds = {
    north: 40.2,
    south: 39.7,
    east: 33.2,
    west: 32.4
  };
  
  return (
    lat >= ankaraBounds.south &&
    lat <= ankaraBounds.north &&
    lon >= ankaraBounds.west &&
    lon <= ankaraBounds.east
  );
};