/**
 * TypeScript Types Index
 * Central export point for all type definitions
 */

// Enhanced types
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
  AnalysisRequestForMode,
  DeepPartial,
  DeepRequired,
  Nullable,
  Optional,
  Maybe,
  ApiResponse,
  ApiResponseWithMeta,
  PaginatedResponse,
  ErrorWithContext,
  ValidationError,
  ValidationErrors,
  AsyncState,
  AsyncStateWithMeta,
  UseAsyncReturn,
  UseAsyncWithParamsReturn,
  CacheEntry,
  CacheStats,
  CacheOptions,
  ScoreCategory,
  ScoreBreakdownItem,
  ScoreBreakdown,
  AnalysisMetrics,
  EnhancedPointAnalysisResponse,
  EnhancedAreaAnalysisResponse,
  EnhancedHeatmapResponse,
  ComponentWithClassName,
  ComponentWithChildren,
  ComponentWithOptionalChildren,
  EventHandler,
  AsyncEventHandler,
  FormField,
  FormState,
  MapViewport,
  MapMarker,
  MapLayer,
  MapInteraction,
  ThemeColor,
  ThemeSize,
  ThemeSpacing,
  EnvironmentConfig,
  FeatureFlags,
  PerformanceMetric,
  PerformanceReport,
  AnalyticsEvent,
  UserInteraction,
  AriaAttributes,
  LocaleCode,
  TranslationKey,
  TranslationValues,
  LocalizedString,
  MockFunction,
  TestContext,
  KeysOfType,
  RequiredKeys,
  OptionalKeys,
  PickByType,
  OmitByType,
  AsyncFunction,
  SyncFunction,
  AnyFunction,
  Brand,
  UserId,
  SessionId,
  ApiKey,
  Timestamp,
  If,
  IsNever,
  IsAny,
  IsUnknown,
  Kebab,
  CamelToSnake,
  EventMap,
  EventEmitter
} from './enhanced';

// Utility types
export type {
  BaseComponentProps,
  ClickHandler,
  ChangeHandler,
  SubmitHandler,
  KeyboardHandler,
  FocusHandler,
  AsyncClickHandler,
  AsyncChangeHandler,
  AsyncSubmitHandler,
  FormFieldProps,
  SelectOption,
  SelectProps,
  ButtonVariant,
  ButtonSize,
  ButtonProps,
  ModalProps,
  DialogProps,
  LoadingProps,
  SkeletonProps,
  TableColumn,
  TableProps,
  CardProps,
  TabItem,
  TabsProps,
  NotificationType,
  NotificationProps,
  TooltipProps,
  PopoverProps,
  DrawerProps,
  LocationSelectorProps,
  CategorySelectorProps,
  AnalysisModeSelectorProps,
  ScoreDisplayProps,
  MapProps,
  AnalysisResultProps,
  ScoreBreakdownProps,
  FilterOption,
  FilterProps,
  SearchProps,
  LayoutProps,
  GridProps,
  FlexProps,
  ResponsiveValue,
  SpacingValue,
  ColorValue,
  AnimationProps,
  TransitionProps,
  AriaProps,
  DataAttributes,
  InteractiveProps,
  FormElementProps,
  WithLoadingProps,
  WithErrorProps,
  WithDataProps,
  RenderProp,
  ChildrenRenderProp,
  ForwardedRef,
  RefCallback,
  MutableRef,
  ComponentFactory,
  ComponentWithProps,
  AsProp,
  PropsToOmit,
  PolymorphicComponentProp,
  PolymorphicRef
} from './utilities';

// Zod schemas
export {
  BusinessCategorySchema,
  AnalysisModeSchema,
  LatLngSchema,
  MapBoundsSchema,
  PointAnalysisRequestSchema,
  AreaAnalysisRequestSchema,
  HeatmapRequestSchema,
  ApiResponseSchema,
  ScoreBreakdownItemSchema,
  PointAnalysisResponseSchema,
  LocationDataSchema,
  AreaAnalysisResponseSchema,
  HeatmapDataPointSchema,
  HeatmapResponseSchema,
  ErrorTypeSchema,
  ApiErrorSchema,
  UserFriendlyErrorSchema,
  LoadingStateSchema,
  CacheEntrySchema,
  CacheConfigSchema,
  ApiConfigSchema,
  LocationDashboardPropsSchema,
  LocationDashboardStateSchema,
  UseLocationAnalysisOptionsSchema,
  UseHeatmapDataOptionsSchema,
  UseApiErrorOptionsSchema,
  validateBusinessCategory,
  validateCoordinates,
  validateMapBounds,
  validateApiResponse
} from '../schemas';

// Type guards
export {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isDate,
  isNull,
  isUndefined,
  isNullish,
  isBusinessCategory,
  isAnalysisMode,
  isErrorType,
  isLatLng,
  isMapBounds,
  isPointAnalysisResponse,
  isAreaAnalysisResponse,
  isHeatmapResponse,
  isApiError,
  isLoadingState,
  isCacheEntry,
  isValidCoordinates,
  isValidScore,
  isValidColor,
  isValidUrl,
  isValidEmail,
  isArrayOf,
  isNonEmptyArray,
  isArrayOfStrings,
  isArrayOfNumbers,
  isArrayOfObjects,
  hasProperty,
  hasProperties,
  isObjectWithShape,
  isPromise,
  isPromiseLike,
  isError,
  isErrorWithMessage,
  isErrorWithStack,
  isReactElement,
  isReactComponent,
  isDevelopment,
  isProduction,
  isTest,
  isBrowser,
  isServer,
  hasLocalStorage,
  hasSessionStorage,
  hasGeolocation,
  hasWebGL,
  not,
  and,
  or,
  optional,
  nullable,
  maybe,
  assertIsString,
  assertIsNumber,
  assertIsObject,
  assertIsBusinessCategory,
  assertIsAnalysisMode,
  assertIsLatLng,
  assertIsMapBounds
} from './guards';

// Re-export from main types file for backward compatibility
export type {
  ErrorType
} from '../types';

// Constants for type checking
export const BUSINESS_CATEGORIES = ['eczane', 'firin', 'cafe', 'market', 'restoran'] as const;
export const ANALYSIS_MODES = ['point', 'area', 'heatmap'] as const;
export const ERROR_TYPES = [
  'NETWORK_ERROR',
  'SERVER_ERROR',
  'VALIDATION_ERROR',
  'TIMEOUT_ERROR',
  'LOCATION_ERROR',
  'UNKNOWN_ERROR'
] as const;
export const SCORE_CATEGORIES = ['Mükemmel', 'Çok İyi', 'İyi', 'Orta', 'Uygun Değil'] as const;

// Ankara bounds constants
export const ANKARA_BOUNDS = {
  LAT_MIN: 39.5,
  LAT_MAX: 40.2,
  LNG_MIN: 32.3,
  LNG_MAX: 33.2,
  CENTER: { lat: 39.9334, lng: 32.8597 } // Kızılay
} as const;

// Default values
export const DEFAULT_VALUES = {
  BUSINESS_CATEGORY: 'cafe' as BusinessCategory,
  ANALYSIS_MODE: 'heatmap' as AnalysisMode,
  MAP_ZOOM: 11,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  API_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  DEBOUNCE_MS: 500
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  HEX_COLOR: /^#[0-9a-fA-F]{6}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^\+?[\d\s\-\(\)]+$/
} as const;

// Type utility functions
export const createTypedArray = <T>(items: T[]): readonly T[] => items as const;

export const createEnum = <T extends Record<string, string | number>>(obj: T): T => obj;

export const createBrand = <T, B extends string>(value: T): Brand<T, B> => 
  value as Brand<T, B>;

// Type-safe object keys
export const typedKeys = <T extends Record<string, unknown>>(obj: T): (keyof T)[] =>
  Object.keys(obj) as (keyof T)[];

// Type-safe object entries
export const typedEntries = <T extends Record<string, unknown>>(obj: T): [keyof T, T[keyof T]][] =>
  Object.entries(obj) as [keyof T, T[keyof T]][];

// Type-safe object values
export const typedValues = <T extends Record<string, unknown>>(obj: T): T[keyof T][] =>
  Object.values(obj) as T[keyof T][];

// Type assertion helpers
export const asBusinessCategory = (value: string): BusinessCategory => {
  assertIsBusinessCategory(value);
  return value;
};

export const asAnalysisMode = (value: string): AnalysisMode => {
  assertIsAnalysisMode(value);
  return value;
};

export const asLatLng = (value: unknown): LatLng => {
  assertIsLatLng(value);
  return value;
};

export const asMapBounds = (value: unknown): MapBounds => {
  assertIsMapBounds(value);
  return value;
};