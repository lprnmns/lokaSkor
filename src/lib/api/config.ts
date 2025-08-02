// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  enableDebug: boolean;
}

// Environment-based configuration
const getApiConfig = (): ApiConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    baseURL: isDevelopment 
      ? 'http://localhost:5000' 
      : process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
    timeout: isDevelopment ? 10000 : 5000,
    retryAttempts: isDevelopment ? 3 : 2,
    enableDebug: isDevelopment || process.env.REACT_APP_ENABLE_DEBUG === 'true'
  };
};

export const apiConfig = getApiConfig();

// API Endpoints
export const API_ENDPOINTS = {
  POINT_ANALYSIS: '/api/v5/score_point',
  AREA_ANALYSIS: '/api/v8/mahalle_analizi',
  HEATMAP_DATA: '/api/v8/heatmap_data',
  LOCATIONS: '/api/v5/get_locations'
} as const;

// Request timeout configurations
export const TIMEOUT_CONFIG = {
  DEFAULT: apiConfig.timeout,
  LONG_RUNNING: apiConfig.timeout * 2,
  SHORT: apiConfig.timeout / 2
} as const;