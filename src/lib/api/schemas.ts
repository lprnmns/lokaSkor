/**
 * Zod Schemas for Runtime Type Validation
 * Provides runtime validation for API requests and responses
 */

import { z } from 'zod';

// Business Logic Schemas
export const BusinessCategorySchema = z.enum(['eczane', 'firin', 'cafe', 'market', 'restoran']);
export const AnalysisModeSchema = z.enum(['point', 'area', 'heatmap']);

// Geographic Schemas
export const LatLngSchema = z.object({
  lat: z.number().min(39.5).max(40.2, 'Latitude must be within Ankara bounds'),
  lng: z.number().min(32.3).max(33.2, 'Longitude must be within Ankara bounds')
});

export const MapBoundsSchema = z.object({
  north: z.number().min(39.5).max(40.2),
  south: z.number().min(39.5).max(40.2),
  east: z.number().min(32.3).max(33.2),
  west: z.number().min(32.3).max(33.2)
}).refine(
  (data) => data.north > data.south && data.east > data.west,
  { message: 'Invalid bounds: north must be > south, east must be > west' }
);

// API Request Schemas
export const PointAnalysisRequestSchema = z.object({
  lat: z.number().min(39.5).max(40.2),
  lon: z.number().min(32.3).max(33.2),
  kategori: BusinessCategorySchema
});

export const AreaAnalysisRequestSchema = z.object({
  mahalle: z.string().min(1, 'Mahalle name is required'),
  kategori: BusinessCategorySchema
});

export const HeatmapRequestSchema = z.object({
  kategori: BusinessCategorySchema,
  bounds: MapBoundsSchema
});

// API Response Schemas
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    success: z.boolean().default(true),
    message: z.string().optional(),
    timestamp: z.string().datetime().optional()
  });

// Score breakdown schema for point analysis
export const ScoreBreakdownItemSchema = z.object({
  score: z.number(),
  distance: z.number().optional(),
  count: z.number().optional()
});

export const PointAnalysisResponseSchema = z.object({
  total_score: z.number(),
  normalized_score: z.number().min(0).max(100),
  raw_score: z.number(),
  category: z.enum(['Mükemmel', 'Çok İyi', 'İyi', 'Orta', 'Uygun Değil']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color'),
  emoji: z.string().regex(/^[🟢🟡🟠🔴⚫]$/, 'Invalid emoji'),
  breakdown: z.record(z.string(), z.union([z.number(), ScoreBreakdownItemSchema]))
});

// Location data schema for area analysis
export const LocationDataSchema = z.object({
  lat: z.number().min(39.5).max(40.2),
  lon: z.number().min(32.3).max(33.2),
  score: z.number().min(0).max(100),
  category: z.string(),
  emoji: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  address: z.string()
});

export const AreaAnalysisResponseSchema = z.object({
  mahalle: z.string(),
  kategori: BusinessCategorySchema,
  en_iyi_lokasyonlar: z.array(LocationDataSchema),
  toplam_lokasyon: z.number().min(0),
  ortalama_skor: z.number().min(0).max(100),
  analiz_ozeti: z.string()
});

// Heatmap schemas
export const HeatmapDataPointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  intensity: z.number().min(0).max(1)
});

export const HeatmapResponseSchema = z.object({
  heatmap_data: z.array(z.tuple([z.number(), z.number(), z.number()])),
  total_points: z.number().min(0),
  bounds: MapBoundsSchema,
  message: z.string().optional()
});

// Error Schemas
export const ErrorTypeSchema = z.enum([
  'NETWORK_ERROR',
  'SERVER_ERROR',
  'VALIDATION_ERROR',
  'TIMEOUT_ERROR',
  'LOCATION_ERROR',
  'UNKNOWN_ERROR'
]);

export const ApiErrorSchema = z.object({
  type: ErrorTypeSchema,
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime(),
  retryable: z.boolean()
});

export const UserFriendlyErrorSchema = z.object({
  title: z.string(),
  message: z.string(),
  action: z.string().optional(),
  retryable: z.boolean()
});

// Loading State Schema
export const LoadingStateSchema = z.object({
  loading: z.boolean(),
  error: ApiErrorSchema.nullable(),
  lastUpdated: z.date().nullable()
});

// Cache Schemas
export const CacheEntrySchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    timestamp: z.number(),
    ttl: z.number(),
    key: z.string()
  });

export const CacheConfigSchema = z.object({
  defaultTTL: z.number().positive(),
  maxSize: z.number().positive(),
  enableCache: z.boolean()
});

// Configuration Schemas
export const ApiConfigSchema = z.object({
  baseURL: z.string().url(),
  timeout: z.number().positive(),
  retryAttempts: z.number().min(0).max(10),
  enableDebug: z.boolean()
});

// Component Props Schemas
export const LocationDashboardPropsSchema = z.object({
  initialCategory: BusinessCategorySchema.optional(),
  initialMode: AnalysisModeSchema.optional(),
  className: z.string().optional(),
  onAnalysisComplete: z.function().optional(),
  onError: z.function().optional()
});

export const LocationDashboardStateSchema = z.object({
  analysisMode: AnalysisModeSchema,
  selectedCategory: BusinessCategorySchema,
  currentLocation: LatLngSchema.nullable(),
  selectedArea: z.string().nullable(),
  mapBounds: MapBoundsSchema.nullable(),
  toggleStates: z.object({
    trafficData: z.boolean(),
    competitorAnalysis: z.boolean(),
    demographics: z.boolean()
  })
});

// Hook Options Schemas
export const UseLocationAnalysisOptionsSchema = z.object({
  kategori: BusinessCategorySchema,
  analysisMode: AnalysisModeSchema,
  autoRefresh: z.boolean().optional(),
  debounceMs: z.number().positive().optional()
});

export const UseHeatmapDataOptionsSchema = z.object({
  kategori: BusinessCategorySchema,
  bounds: MapBoundsSchema.nullable(),
  autoRefresh: z.boolean().optional(),
  debounceMs: z.number().positive().optional(),
  enabled: z.boolean().optional()
});

export const UseApiErrorOptionsSchema = z.object({
  autoRetry: z.boolean().optional(),
  maxRetries: z.number().min(0).max(10).optional(),
  retryDelay: z.number().positive().optional(),
  onError: z.function().optional(),
  onRetry: z.function().optional(),
  onMaxRetriesReached: z.function().optional()
});

// Validation Helper Functions
export const validateBusinessCategory = (value: unknown): value is z.infer<typeof BusinessCategorySchema> => {
  return BusinessCategorySchema.safeParse(value).success;
};

export const validateCoordinates = (lat: unknown, lon: unknown): { lat: number; lon: number } => {
  const coordsSchema = z.object({
    lat: z.number().min(39.5).max(40.2),
    lon: z.number().min(32.3).max(33.2)
  });
  
  const result = coordsSchema.safeParse({ lat, lon });
  if (!result.success) {
    throw new Error(`Invalid coordinates: ${result.error.message}`);
  }
  
  return result.data;
};

export const validateMapBounds = (bounds: unknown): z.infer<typeof MapBoundsSchema> => {
  const result = MapBoundsSchema.safeParse(bounds);
  if (!result.success) {
    throw new Error(`Invalid map bounds: ${result.error.message}`);
  }
  
  return result.data;
};

export const validateApiResponse = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`API response validation failed: ${result.error.message}`);
  }
  
  return result.data;
};

// Type Guards
export const isPointAnalysisResponse = (data: unknown): data is z.infer<typeof PointAnalysisResponseSchema> => {
  return PointAnalysisResponseSchema.safeParse(data).success;
};

export const isAreaAnalysisResponse = (data: unknown): data is z.infer<typeof AreaAnalysisResponseSchema> => {
  return AreaAnalysisResponseSchema.safeParse(data).success;
};

export const isHeatmapResponse = (data: unknown): data is z.infer<typeof HeatmapResponseSchema> => {
  return HeatmapResponseSchema.safeParse(data).success;
};

export const isApiError = (error: unknown): error is z.infer<typeof ApiErrorSchema> => {
  return ApiErrorSchema.safeParse(error).success;
};

// Schema-based type inference
export type BusinessCategory = z.infer<typeof BusinessCategorySchema>;
export type AnalysisMode = z.infer<typeof AnalysisModeSchema>;
export type LatLng = z.infer<typeof LatLngSchema>;
export type MapBounds = z.infer<typeof MapBoundsSchema>;
export type PointAnalysisRequest = z.infer<typeof PointAnalysisRequestSchema>;
export type AreaAnalysisRequest = z.infer<typeof AreaAnalysisRequestSchema>;
export type HeatmapRequest = z.infer<typeof HeatmapRequestSchema>;
export type PointAnalysisResponse = z.infer<typeof PointAnalysisResponseSchema>;
export type AreaAnalysisResponse = z.infer<typeof AreaAnalysisResponseSchema>;
export type HeatmapResponse = z.infer<typeof HeatmapResponseSchema>;
export type LocationData = z.infer<typeof LocationDataSchema>;
export type HeatmapDataPoint = z.infer<typeof HeatmapDataPointSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type UserFriendlyError = z.infer<typeof UserFriendlyErrorSchema>;
export type LoadingState = z.infer<typeof LoadingStateSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;

// Utility type for creating validated API responses
export type ValidatedApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
};

// Advanced utility types
export type AnalysisResult = PointAnalysisResponse | AreaAnalysisResponse;
export type AnalysisRequest = PointAnalysisRequest | AreaAnalysisRequest | HeatmapRequest;

// Conditional types for analysis modes
export type AnalysisDataForMode<T extends AnalysisMode> = 
  T extends 'point' ? PointAnalysisResponse :
  T extends 'area' ? AreaAnalysisResponse :
  T extends 'heatmap' ? HeatmapResponse :
  never;

export type AnalysisRequestForMode<T extends AnalysisMode> = 
  T extends 'point' ? PointAnalysisRequest :
  T extends 'area' ? AreaAnalysisRequest :
  T extends 'heatmap' ? HeatmapRequest :
  never;