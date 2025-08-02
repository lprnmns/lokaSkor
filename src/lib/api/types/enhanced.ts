/**
 * Enhanced TypeScript Type Definitions
 * Advanced types for better type safety and developer experience
 */

import { z } from 'zod';
import * as schemas from '../schemas';

// Re-export schema-based types
export type {
  BusinessCategory,
  AnalysisMode,
  LatLng,
  MapBounds,
  PointAnalysisRequest,
  AreaAnalysisRequest,
  HeatmapRequest,
  PointAnalysisResponse,
  AreaAnalysisResponse,
  HeatmapResponse,
  LocationData,
  HeatmapDataPoint,
  ApiError,
  UserFriendlyError,
  LoadingState,
  ApiConfig,
  CacheConfig,
  AnalysisResult,
  AnalysisRequest,
  AnalysisDataForMode,
  AnalysisRequestForMode
} from '../schemas';

// Advanced utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// API Response wrapper types
export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
};

export type ApiResponseWithMeta<T, M = Record<string, unknown>> = ApiResponse<T> & {
  meta: M;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

// Error handling types
export type ErrorWithContext<T = unknown> = ApiError & {
  context?: T;
  stack?: string;
  cause?: Error;
};

export type ValidationError = {
  field: string;
  message: string;
  value?: unknown;
};

export type ValidationErrors = {
  errors: ValidationError[];
  message: string;
};

// State management types
export type AsyncState<T, E = ApiError> = {
  data: T | null;
  loading: boolean;
  error: E | null;
  lastUpdated: Date | null;
};

export type AsyncStateWithMeta<T, M = Record<string, unknown>, E = ApiError> = AsyncState<T, E> & {
  meta: M | null;
};

// Hook return types
export type UseAsyncReturn<T, E = ApiError> = AsyncState<T, E> & {
  execute: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
};

export type UseAsyncWithParamsReturn<T, P, E = ApiError> = AsyncState<T, E> & {
  execute: (params: P) => Promise<void>;
  reset: () => void;
  clearError: () => void;
};

// Cache types
export type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  hits: number;
  lastAccessed: number;
};

export type CacheStats = {
  size: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  lastCleared: Date | null;
  memoryUsage?: number;
};

export type CacheOptions = {
  ttl?: number;
  maxSize?: number;
  enablePersistence?: boolean;
  storageKey?: string;
  onEvict?: (key: string, entry: CacheEntry<unknown>) => void;
};

// Analysis-specific types
export type ScoreCategory = 'Mükemmel' | 'Çok İyi' | 'İyi' | 'Orta' | 'Uygun Değil';

export type ScoreBreakdownItem = {
  score: number;
  distance?: number;
  count?: number;
  weight?: number;
  normalized?: number;
};

export type ScoreBreakdown = Record<string, ScoreBreakdownItem | number>;

export type AnalysisMetrics = {
  processingTime: number;
  dataPoints: number;
  accuracy: number;
  confidence: number;
  version: string;
};

export type EnhancedPointAnalysisResponse = PointAnalysisResponse & {
  metrics?: AnalysisMetrics;
  recommendations?: string[];
  alternatives?: Array<{
    lat: number;
    lon: number;
    score: number;
    reason: string;
  }>;
};

export type EnhancedAreaAnalysisResponse = AreaAnalysisResponse & {
  metrics?: AnalysisMetrics;
  heatmapPreview?: Array<[number, number, number]>;
  competitorDensity?: number;
  marketSaturation?: number;
};

export type EnhancedHeatmapResponse = HeatmapResponse & {
  metrics?: AnalysisMetrics;
  resolution: number;
  interpolationMethod: string;
  dataQuality: number;
};

// Component prop types
export type ComponentWithClassName = {
  className?: string;
};

export type ComponentWithChildren = {
  children: React.ReactNode;
};

export type ComponentWithOptionalChildren = {
  children?: React.ReactNode;
};

export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Form types
export type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
};

export type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FormField<T[K]>;
} & {
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Partial<Record<keyof T, string>>;
};

// Map-related types
export type MapViewport = {
  center: LatLng;
  zoom: number;
  bounds: MapBounds;
};

export type MapMarker = {
  id: string;
  position: LatLng;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  onClick?: () => void;
};

export type MapLayer = {
  id: string;
  type: 'heatmap' | 'markers' | 'polygons' | 'lines';
  data: unknown;
  visible: boolean;
  opacity?: number;
  zIndex?: number;
};

export type MapInteraction = {
  type: 'click' | 'hover' | 'drag' | 'zoom';
  position: LatLng;
  target?: string;
  data?: unknown;
};

// Theme and styling types
export type ThemeColor = {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
};

export type ThemeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

// Configuration types
export type EnvironmentConfig = {
  NODE_ENV: 'development' | 'production' | 'test';
  API_BASE_URL: string;
  API_TIMEOUT: number;
  RETRY_ATTEMPTS: number;
  ENABLE_DEBUG: boolean;
  CACHE_TTL: number;
  MAX_CACHE_SIZE: number;
};

export type FeatureFlags = {
  enableHeatmap: boolean;
  enableAreaAnalysis: boolean;
  enableRealTimeUpdates: boolean;
  enableAdvancedMetrics: boolean;
  enableCaching: boolean;
  enableOfflineMode: boolean;
};

// Performance monitoring types
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  tags?: Record<string, string>;
};

export type PerformanceReport = {
  metrics: PerformanceMetric[];
  summary: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    cacheHitRate: number;
  };
  period: {
    start: Date;
    end: Date;
  };
};

// Analytics types
export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
};

export type UserInteraction = {
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'input';
  element: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

// Accessibility types
export type AriaAttributes = {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  role?: string;
  tabIndex?: number;
};

// Internationalization types
export type LocaleCode = 'tr-TR' | 'en-US' | 'de-DE' | 'fr-FR';

export type TranslationKey = string;
export type TranslationValues = Record<string, string | number>;

export type LocalizedString = {
  [K in LocaleCode]?: string;
};

// Testing types
export type MockFunction<T extends (...args: any[]) => any> = T & {
  mockReturnValue: (value: ReturnType<T>) => void;
  mockResolvedValue: (value: ReturnType<T>) => void;
  mockRejectedValue: (error: Error) => void;
  mockClear: () => void;
  mockReset: () => void;
};

export type TestContext<T = Record<string, unknown>> = {
  setup: () => Promise<void>;
  teardown: () => Promise<void>;
  data: T;
  mocks: Record<string, MockFunction<any>>;
};

// Utility type helpers
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

// Function type utilities
export type AsyncFunction<T extends unknown[] = [], R = unknown> = (...args: T) => Promise<R>;
export type SyncFunction<T extends unknown[] = [], R = unknown> = (...args: T) => R;
export type AnyFunction<T extends unknown[] = [], R = unknown> = SyncFunction<T, R> | AsyncFunction<T, R>;

// Brand types for type safety
export type Brand<T, B> = T & { __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ApiKey = Brand<string, 'ApiKey'>;
export type Timestamp = Brand<number, 'Timestamp'>;

// Conditional types for better API design
export type If<C extends boolean, T, F> = C extends true ? T : F;

export type IsNever<T> = [T] extends [never] ? true : false;
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;

// Template literal types for better string handling
export type Kebab<T extends string> = T extends `${infer A}${infer B}`
  ? B extends Uncapitalize<B>
    ? `${Uncapitalize<A>}${Kebab<B>}`
    : `${Uncapitalize<A>}-${Kebab<Uncapitalize<B>>}`
  : T;

export type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

// Type-safe event emitter
export type EventMap = Record<string, unknown[]>;

export type EventEmitter<T extends EventMap> = {
  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void;
  off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void;
  emit<K extends keyof T>(event: K, ...args: T[K]): void;
  once<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void;
};