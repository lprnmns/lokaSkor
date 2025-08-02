/**
 * Type Guards for Runtime Type Checking
 * Provides runtime type validation and type narrowing
 */

import { 
  BusinessCategory, 
  AnalysisMode, 
  LatLng, 
  MapBounds,
  PointAnalysisResponse,
  AreaAnalysisResponse,
  HeatmapResponse,
  ApiError,
  ErrorType,
  LoadingState,
  CacheEntry
} from './enhanced';

// Basic type guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

// Business logic type guards
export const isBusinessCategory = (value: unknown): value is BusinessCategory => {
  return isString(value) && ['eczane', 'firin', 'cafe', 'market', 'restoran'].includes(value);
};

export const isAnalysisMode = (value: unknown): value is AnalysisMode => {
  return isString(value) && ['point', 'area', 'heatmap'].includes(value);
};

export const isErrorType = (value: unknown): value is ErrorType => {
  return isString(value) && [
    'NETWORK_ERROR',
    'SERVER_ERROR', 
    'VALIDATION_ERROR',
    'TIMEOUT_ERROR',
    'LOCATION_ERROR',
    'UNKNOWN_ERROR'
  ].includes(value);
};

// Geographic type guards
export const isLatLng = (value: unknown): value is LatLng => {
  if (!isObject(value)) return false;
  
  const { lat, lng } = value as any;
  return isNumber(lat) && 
         isNumber(lng) && 
         lat >= 39.5 && lat <= 40.2 && 
         lng >= 32.3 && lng <= 33.2;
};

export const isMapBounds = (value: unknown): value is MapBounds => {
  if (!isObject(value)) return false;
  
  const { north, south, east, west } = value as any;
  return isNumber(north) && 
         isNumber(south) && 
         isNumber(east) && 
         isNumber(west) &&
         north > south && 
         east > west &&
         north >= 39.5 && north <= 40.2 &&
         south >= 39.5 && south <= 40.2 &&
         east >= 32.3 && east <= 33.2 &&
         west >= 32.3 && west <= 33.2;
};

// API response type guards
export const isPointAnalysisResponse = (value: unknown): value is PointAnalysisResponse => {
  if (!isObject(value)) return false;
  
  const response = value as any;
  return isNumber(response.total_score) &&
         isNumber(response.normalized_score) &&
         isNumber(response.raw_score) &&
         isString(response.category) &&
         isString(response.color) &&
         isString(response.emoji) &&
         isObject(response.breakdown) &&
         response.normalized_score >= 0 &&
         response.normalized_score <= 100 &&
         /^#[0-9a-fA-F]{6}$/.test(response.color) &&
         ['Mükemmel', 'Çok İyi', 'İyi', 'Orta', 'Uygun Değil'].includes(response.category);
};

export const isAreaAnalysisResponse = (value: unknown): value is AreaAnalysisResponse => {
  if (!isObject(value)) return false;
  
  const response = value as any;
  return isString(response.mahalle) &&
         isBusinessCategory(response.kategori) &&
         isArray(response.en_iyi_lokasyonlar) &&
         isNumber(response.toplam_lokasyon) &&
         isNumber(response.ortalama_skor) &&
         isString(response.analiz_ozeti) &&
         response.toplam_lokasyon >= 0 &&
         response.ortalama_skor >= 0 &&
         response.ortalama_skor <= 100;
};

export const isHeatmapResponse = (value: unknown): value is HeatmapResponse => {
  if (!isObject(value)) return false;
  
  const response = value as any;
  return isArray(response.heatmap_data) &&
         isNumber(response.total_points) &&
         isMapBounds(response.bounds) &&
         response.total_points >= 0 &&
         response.heatmap_data.every((point: unknown) => 
           isArray(point) && 
           point.length === 3 && 
           point.every(isNumber)
         );
};

export const isApiError = (value: unknown): value is ApiError => {
  if (!isObject(value)) return false;
  
  const error = value as any;
  return isErrorType(error.type) &&
         isString(error.code) &&
         isString(error.message) &&
         isString(error.timestamp) &&
         isBoolean(error.retryable);
};

export const isLoadingState = (value: unknown): value is LoadingState => {
  if (!isObject(value)) return false;
  
  const state = value as any;
  return isBoolean(state.loading) &&
         (isNull(state.error) || isApiError(state.error)) &&
         (isNull(state.lastUpdated) || isDate(state.lastUpdated));
};

// Cache type guards
export const isCacheEntry = <T>(value: unknown): value is CacheEntry<T> => {
  if (!isObject(value)) return false;
  
  const entry = value as any;
  return entry.data !== undefined &&
         isNumber(entry.timestamp) &&
         isNumber(entry.ttl) &&
         isString(entry.key) &&
         entry.timestamp > 0 &&
         entry.ttl > 0;
};

// Complex validation guards
export const isValidCoordinates = (lat: unknown, lon: unknown): lat is number && lon is number => {
  return isNumber(lat) && 
         isNumber(lon) && 
         lat >= 39.5 && lat <= 40.2 && 
         lon >= 32.3 && lon <= 33.2;
};

export const isValidScore = (score: unknown): score is number => {
  return isNumber(score) && score >= 0 && score <= 100;
};

export const isValidColor = (color: unknown): color is string => {
  return isString(color) && /^#[0-9a-fA-F]{6}$/.test(color);
};

export const isValidUrl = (url: unknown): url is string => {
  if (!isString(url)) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidEmail = (email: unknown): email is string => {
  if (!isString(email)) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Array validation guards
export const isArrayOf = <T>(
  value: unknown, 
  guard: (item: unknown) => item is T
): value is T[] => {
  return isArray(value) && value.every(guard);
};

export const isNonEmptyArray = <T>(value: unknown): value is [T, ...T[]] => {
  return isArray(value) && value.length > 0;
};

export const isArrayOfStrings = (value: unknown): value is string[] => {
  return isArrayOf(value, isString);
};

export const isArrayOfNumbers = (value: unknown): value is number[] => {
  return isArrayOf(value, isNumber);
};

export const isArrayOfObjects = (value: unknown): value is Record<string, unknown>[] => {
  return isArrayOf(value, isObject);
};

// Object validation guards
export const hasProperty = <K extends string>(
  obj: unknown, 
  key: K
): obj is Record<K, unknown> => {
  return isObject(obj) && key in obj;
};

export const hasProperties = <K extends string>(
  obj: unknown, 
  keys: K[]
): obj is Record<K, unknown> => {
  return isObject(obj) && keys.every(key => key in obj);
};

export const isObjectWithShape = <T extends Record<string, (value: unknown) => boolean>>(
  value: unknown,
  shape: T
): value is { [K in keyof T]: T[K] extends (value: unknown) => value is infer U ? U : never } => {
  if (!isObject(value)) return false;
  
  return Object.entries(shape).every(([key, guard]) => {
    return key in value && guard((value as any)[key]);
  });
};

// Promise and async guards
export const isPromise = <T>(value: unknown): value is Promise<T> => {
  return value instanceof Promise || 
         (isObject(value) && isFunction((value as any).then));
};

export const isPromiseLike = <T>(value: unknown): value is PromiseLike<T> => {
  return isObject(value) && isFunction((value as any).then);
};

// Error guards
export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

export const isErrorWithMessage = (value: unknown): value is Error & { message: string } => {
  return isError(value) && isString(value.message);
};

export const isErrorWithStack = (value: unknown): value is Error & { stack: string } => {
  return isError(value) && isString(value.stack);
};

// React-specific guards
export const isReactElement = (value: unknown): value is React.ReactElement => {
  return isObject(value) && 
         hasProperty(value, '$$typeof') && 
         hasProperty(value, 'type') && 
         hasProperty(value, 'props');
};

export const isReactComponent = (value: unknown): value is React.ComponentType => {
  return isFunction(value);
};

// Environment guards
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

export const isServer = (): boolean => {
  return typeof window === 'undefined';
};

// Feature detection guards
export const hasLocalStorage = (): boolean => {
  try {
    return isBrowser() && 'localStorage' in window && window.localStorage !== null;
  } catch {
    return false;
  }
};

export const hasSessionStorage = (): boolean => {
  try {
    return isBrowser() && 'sessionStorage' in window && window.sessionStorage !== null;
  } catch {
    return false;
  }
};

export const hasGeolocation = (): boolean => {
  return isBrowser() && 'geolocation' in navigator;
};

export const hasWebGL = (): boolean => {
  if (!isBrowser()) return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
};

// Utility guard combinators
export const not = <T>(guard: (value: unknown) => value is T) => {
  return (value: unknown): value is Exclude<unknown, T> => !guard(value);
};

export const and = <T, U>(
  guardA: (value: unknown) => value is T,
  guardB: (value: unknown) => value is U
) => {
  return (value: unknown): value is T & U => guardA(value) && guardB(value);
};

export const or = <T, U>(
  guardA: (value: unknown) => value is T,
  guardB: (value: unknown) => value is U
) => {
  return (value: unknown): value is T | U => guardA(value) || guardB(value);
};

export const optional = <T>(guard: (value: unknown) => value is T) => {
  return (value: unknown): value is T | undefined => 
    isUndefined(value) || guard(value);
};

export const nullable = <T>(guard: (value: unknown) => value is T) => {
  return (value: unknown): value is T | null => 
    isNull(value) || guard(value);
};

export const maybe = <T>(guard: (value: unknown) => value is T) => {
  return (value: unknown): value is T | null | undefined => 
    isNullish(value) || guard(value);
};

// Assertion functions
export const assertIsString = (value: unknown): asserts value is string => {
  if (!isString(value)) {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
};

export const assertIsNumber = (value: unknown): asserts value is number => {
  if (!isNumber(value)) {
    throw new TypeError(`Expected number, got ${typeof value}`);
  }
};

export const assertIsObject = (value: unknown): asserts value is Record<string, unknown> => {
  if (!isObject(value)) {
    throw new TypeError(`Expected object, got ${typeof value}`);
  }
};

export const assertIsBusinessCategory = (value: unknown): asserts value is BusinessCategory => {
  if (!isBusinessCategory(value)) {
    throw new TypeError(`Expected BusinessCategory, got ${value}`);
  }
};

export const assertIsAnalysisMode = (value: unknown): asserts value is AnalysisMode => {
  if (!isAnalysisMode(value)) {
    throw new TypeError(`Expected AnalysisMode, got ${value}`);
  }
};

export const assertIsLatLng = (value: unknown): asserts value is LatLng => {
  if (!isLatLng(value)) {
    throw new TypeError(`Expected valid LatLng coordinates, got ${JSON.stringify(value)}`);
  }
};

export const assertIsMapBounds = (value: unknown): asserts value is MapBounds => {
  if (!isMapBounds(value)) {
    throw new TypeError(`Expected valid MapBounds, got ${JSON.stringify(value)}`);
  }
};