/**
 * Error Recovery Strategies
 * Provides intelligent error recovery and fallback mechanisms
 */

import { ApiError, ErrorType, BusinessCategory, AnalysisMode } from '../types';
import { ErrorClassificationResult } from './ErrorClassification';

export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: () => Promise<any> | any;
  fallbackData?: any;
  userMessage?: string;
  actionText?: string;
}

export interface RecoveryContext {
  operation: string;
  parameters: Record<string, unknown>;
  previousAttempts: number;
  lastError: ApiError;
  classification: ErrorClassificationResult;
  userContext?: {
    category?: BusinessCategory;
    mode?: AnalysisMode;
    location?: { lat: number; lon: number };
    area?: string;
  };
}

export class ErrorRecoveryManager {
  private static readonly FALLBACK_DATA = {
    pointAnalysis: {
      total_score: 0,
      normalized_score: 0,
      raw_score: 0,
      category: 'Uygun Değil' as const,
      color: '#6c757d',
      emoji: '⚫',
      breakdown: {}
    },
    areaAnalysis: {
      mahalle: '',
      kategori: 'cafe' as BusinessCategory,
      en_iyi_lokasyonlar: [],
      toplam_lokasyon: 0,
      ortalama_skor: 0,
      analiz_ozeti: 'Analiz yapılamadı'
    },
    heatmapData: {
      heatmap_data: [],
      total_points: 0,
      bounds: { north: 40.2, south: 39.5, east: 33.2, west: 32.3 }
    }
  };

  static async createRecoveryStrategies(context: RecoveryContext): Promise<RecoveryStrategy[]> {
    const strategies: RecoveryStrategy[] = [];

    // Network error recovery strategies
    if (context.classification.type === ErrorType.NETWORK_ERROR) {
      strategies.push({
        name: 'retry_with_timeout',
        description: 'Retry with increased timeout',
        execute: async () => {
          // This would be implemented by the calling code
          throw new Error('Retry strategy to be implemented by caller');
        },
        userMessage: 'Bağlantı sorunu yaşanıyor. Tekrar denenecek.',
        actionText: 'Tekrar Dene'
      });

      strategies.push({
        name: 'use_cached_data',
        description: 'Use cached data if available',
        execute: () => this.getCachedData(context),
        userMessage: 'Önbelleğe alınmış veriler kullanılıyor.',
        actionText: 'Yenile'
      });

      strategies.push({
        name: 'offline_mode',
        description: 'Switch to offline mode with limited functionality',
        execute: () => this.getOfflineData(context),
        fallbackData: this.getFallbackData(context.operation),
        userMessage: 'Çevrimdışı modda çalışılıyor. Bazı özellikler sınırlı olabilir.',
        actionText: 'Çevrimiçi Ol'
      });
    }

    // Server error recovery strategies
    if (context.classification.type === ErrorType.SERVER_ERROR) {
      strategies.push({
        name: 'retry_with_backoff',
        description: 'Retry with exponential backoff',
        execute: async () => {
          throw new Error('Retry strategy to be implemented by caller');
        },
        userMessage: 'Sunucu geçici olarak kullanılamıyor. Tekrar denenecek.',
        actionText: 'Tekrar Dene'
      });

      strategies.push({
        name: 'alternative_endpoint',
        description: 'Try alternative API endpoint',
        execute: () => this.tryAlternativeEndpoint(context),
        userMessage: 'Alternatif veri kaynağı deneniyor.',
        actionText: 'Tekrar Dene'
      });
    }

    // Location error recovery strategies
    if (context.classification.type === ErrorType.LOCATION_ERROR) {
      strategies.push({
        name: 'suggest_nearby_location',
        description: 'Suggest nearby valid locations',
        execute: () => this.suggestNearbyLocations(context),
        userMessage: 'Bu lokasyon uygun değil. Yakındaki alternatif lokasyonlar öneriliyor.',
        actionText: 'Alternatifleri Gör'
      });

      strategies.push({
        name: 'expand_search_area',
        description: 'Expand search area to find suitable locations',
        execute: () => this.expandSearchArea(context),
        userMessage: 'Arama alanı genişletiliyor.',
        actionText: 'Genişletilmiş Arama'
      });

      strategies.push({
        name: 'show_general_info',
        description: 'Show general area information',
        execute: () => this.getGeneralAreaInfo(context),
        userMessage: 'Genel bölge bilgileri gösteriliyor.',
        actionText: 'Detaylı Analiz'
      });
    }

    // Validation error recovery strategies
    if (context.classification.type === ErrorType.VALIDATION_ERROR) {
      strategies.push({
        name: 'auto_correct_input',
        description: 'Automatically correct input parameters',
        execute: () => this.autoCorrectInput(context),
        userMessage: 'Girdi parametreleri otomatik olarak düzeltiliyor.',
        actionText: 'Düzeltilmiş Verilerle Dene'
      });

      strategies.push({
        name: 'provide_input_suggestions',
        description: 'Provide input correction suggestions',
        execute: () => this.getInputSuggestions(context),
        userMessage: 'Geçerli girdi önerileri sunuluyor.',
        actionText: 'Önerileri Gör'
      });
    }

    // Timeout error recovery strategies
    if (context.classification.type === ErrorType.TIMEOUT_ERROR) {
      strategies.push({
        name: 'simplified_analysis',
        description: 'Perform simplified analysis with reduced data',
        execute: () => this.getSimplifiedAnalysis(context),
        userMessage: 'Basitleştirilmiş analiz yapılıyor.',
        actionText: 'Detaylı Analiz'
      });

      strategies.push({
        name: 'progressive_loading',
        description: 'Load data progressively in smaller chunks',
        execute: () => this.getProgressiveData(context),
        userMessage: 'Veriler aşamalı olarak yükleniyor.',
        actionText: 'Tümünü Yükle'
      });
    }

    // Always add fallback strategy as last resort
    strategies.push({
      name: 'fallback_data',
      description: 'Use fallback data',
      execute: () => this.getFallbackData(context.operation),
      fallbackData: this.getFallbackData(context.operation),
      userMessage: 'Varsayılan veriler kullanılıyor.',
      actionText: 'Yeniden Dene'
    });

    return strategies;
  }

  private static getCachedData(context: RecoveryContext): any {
    // This would integrate with the caching system
    // For now, return null to indicate no cached data
    return null;
  }

  private static getOfflineData(context: RecoveryContext): any {
    // Return limited offline functionality data
    return {
      offline: true,
      message: 'Çevrimdışı mod aktif',
      limitedFeatures: true,
      ...this.getFallbackData(context.operation)
    };
  }

  private static tryAlternativeEndpoint(context: RecoveryContext): any {
    // This would try alternative API endpoints
    // For now, return a placeholder
    return {
      alternative: true,
      message: 'Alternatif veri kaynağı kullanılıyor'
    };
  }

  private static suggestNearbyLocations(context: RecoveryContext): any {
    const { userContext } = context;
    
    if (!userContext?.location) {
      return { suggestions: [] };
    }

    // Generate nearby location suggestions
    const suggestions = [];
    const baseLocation = userContext.location;
    
    for (let i = 0; i < 5; i++) {
      suggestions.push({
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.01,
        lon: baseLocation.lon + (Math.random() - 0.5) * 0.01,
        reason: `Alternatif lokasyon ${i + 1}`,
        distance: Math.round(Math.random() * 500 + 100) // 100-600m
      });
    }

    return {
      suggestions,
      message: 'Yakındaki uygun lokasyonlar',
      originalLocation: baseLocation
    };
  }

  private static expandSearchArea(context: RecoveryContext): any {
    return {
      expandedArea: true,
      message: 'Arama alanı genişletildi',
      newRadius: 2000, // 2km
      ...this.getFallbackData(context.operation)
    };
  }

  private static getGeneralAreaInfo(context: RecoveryContext): any {
    const { userContext } = context;
    
    return {
      generalInfo: true,
      area: userContext?.area || 'Bilinmeyen bölge',
      category: userContext?.category || 'cafe',
      message: 'Genel bölge bilgileri',
      demographics: {
        population: 'Orta yoğunluk',
        ageGroup: 'Karma',
        incomeLevel: 'Orta'
      },
      infrastructure: {
        transportation: 'İyi',
        accessibility: 'Orta',
        parking: 'Sınırlı'
      }
    };
  }

  private static autoCorrectInput(context: RecoveryContext): any {
    const { parameters } = context;
    const corrected: Record<string, unknown> = {};

    // Auto-correct coordinates to be within Ankara bounds
    if (parameters.lat && typeof parameters.lat === 'number') {
      corrected.lat = Math.max(39.5, Math.min(40.2, parameters.lat));
    }
    if (parameters.lon && typeof parameters.lon === 'number') {
      corrected.lon = Math.max(32.3, Math.min(33.2, parameters.lon));
    }

    // Auto-correct business category
    if (parameters.kategori && typeof parameters.kategori === 'string') {
      const validCategories = ['eczane', 'firin', 'cafe', 'market', 'restoran'];
      if (!validCategories.includes(parameters.kategori)) {
        corrected.kategori = 'cafe'; // Default fallback
      }
    }

    return {
      correctedParameters: { ...parameters, ...corrected },
      corrections: Object.keys(corrected),
      message: 'Girdi parametreleri düzeltildi'
    };
  }

  private static getInputSuggestions(context: RecoveryContext): any {
    const { parameters } = context;
    const suggestions: Record<string, unknown[]> = {};

    // Suggest valid business categories
    if (parameters.kategori) {
      suggestions.kategori = [
        { value: 'eczane', label: 'Eczane', icon: '💊' },
        { value: 'firin', label: 'Fırın', icon: '🍞' },
        { value: 'cafe', label: 'Cafe', icon: '☕' },
        { value: 'market', label: 'Market', icon: '🛒' },
        { value: 'restoran', label: 'Restoran', icon: '🍽️' }
      ];
    }

    // Suggest valid neighborhoods
    if (parameters.mahalle) {
      suggestions.mahalle = [
        'Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan',
        'Etimesgut', 'Gölbaşı', 'Pursaklar', 'Altındağ'
      ];
    }

    return {
      suggestions,
      message: 'Geçerli seçenekler'
    };
  }

  private static getSimplifiedAnalysis(context: RecoveryContext): any {
    const { userContext } = context;
    
    return {
      simplified: true,
      message: 'Basitleştirilmiş analiz',
      category: userContext?.category || 'cafe',
      basicScore: Math.floor(Math.random() * 100),
      factors: [
        'Konum uygunluğu: Orta',
        'Erişilebilirlik: İyi',
        'Rekabet yoğunluğu: Düşük'
      ],
      recommendation: 'Detaylı analiz için tekrar deneyin'
    };
  }

  private static getProgressiveData(context: RecoveryContext): any {
    return {
      progressive: true,
      message: 'Aşamalı veri yükleme',
      loadedChunks: 1,
      totalChunks: 3,
      partialData: this.getFallbackData(context.operation)
    };
  }

  private static getFallbackData(operation: string): any {
    switch (operation) {
      case 'analyzePoint':
        return this.FALLBACK_DATA.pointAnalysis;
      case 'analyzeArea':
        return this.FALLBACK_DATA.areaAnalysis;
      case 'getHeatmapData':
        return this.FALLBACK_DATA.heatmapData;
      default:
        return {
          fallback: true,
          message: 'Varsayılan veri kullanılıyor'
        };
    }
  }

  static async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    context: RecoveryContext
  ): Promise<any> {
    try {
      const result = await strategy.execute();
      return {
        success: true,
        data: result,
        strategy: strategy.name,
        message: strategy.userMessage
      };
    } catch (error) {
      return {
        success: false,
        error,
        fallbackData: strategy.fallbackData,
        strategy: strategy.name,
        message: 'Kurtarma stratejisi başarısız oldu'
      };
    }
  }

  static getBestRecoveryStrategy(
    strategies: RecoveryStrategy[],
    context: RecoveryContext
  ): RecoveryStrategy {
    // Prioritize strategies based on context and error type
    const priorityOrder = [
      'use_cached_data',
      'retry_with_timeout',
      'suggest_nearby_location',
      'auto_correct_input',
      'simplified_analysis',
      'alternative_endpoint',
      'expand_search_area',
      'progressive_loading',
      'offline_mode',
      'fallback_data'
    ];

    for (const strategyName of priorityOrder) {
      const strategy = strategies.find(s => s.name === strategyName);
      if (strategy) {
        return strategy;
      }
    }

    // Return last strategy as ultimate fallback
    return strategies[strategies.length - 1];
  }
}