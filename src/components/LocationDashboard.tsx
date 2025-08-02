/**
 * Enhanced Location Dashboard Component
 * Real-time location analysis dashboard with live updates
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  useRealtimePointAnalysis, 
  useRealtimeAreaAnalysis, 
  useRealtimeHeatmapData,
  useRealtimeNotifications,
  useToastNotifications
} from '../lib/api/realtime';
import { useLocationAnalysis } from '../lib/hooks/useLocationAnalysis';
import { BusinessCategory, AnalysisMode } from '../lib/api/types';
import { optimisticUpdates } from '../lib/api/realtime/OptimisticUpdates';
import { debouncedApiCalls } from '../lib/api/realtime/DebouncedApiCalls';

interface LocationDashboardProps {
  initialMode?: AnalysisMode;
  initialCategory?: BusinessCategory;
  initialLocation?: { lat: number; lon: number };
  initialArea?: string;
  enableRealtime?: boolean;
  enableNotifications?: boolean;
  className?: string;
}

interface DashboardState {
  mode: AnalysisMode;
  category: BusinessCategory;
  location: { lat: number; lon: number } | null;
  area: string;
  isAnalyzing: boolean;
  showSettings: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export const LocationDashboard: React.FC<LocationDashboardProps> = ({
  initialMode = 'point',
  initialCategory = 'cafe',
  initialLocation = null,
  initialArea = '',
  enableRealtime = true,
  enableNotifications = true,
  className = ''
}) => {
  // Dashboard state
  const [state, setState] = useState<DashboardState>({
    mode: initialMode,
    category: initialCategory,
    location: initialLocation,
    area: initialArea,
    isAnalyzing: false,
    showSettings: false,
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  // Traditional API hook for fallback
  const { 
    analyzePoint, 
    analyzeArea, 
    getHeatmapData,
    loading: apiLoading,
    error: apiError
  } = useLocationAnalysis();

  // Real-time hooks
  const pointAnalysis = useRealtimePointAnalysis(
    state.location?.lat || 0,
    state.location?.lon || 0,
    state.category,
    enableRealtime && state.mode === 'point' && state.location !== null
  );

  const areaAnalysis = useRealtimeAreaAnalysis(
    state.area,
    state.category,
    enableRealtime && state.mode === 'area' && state.area !== ''
  );

  const heatmapData = useRealtimeHeatmapData(
    state.category,
    null, // Will be set based on map bounds
    enableRealtime && state.mode === 'heatmap'
  );

  // Notifications
  const notifications = useRealtimeNotifications({
    enabled: enableNotifications,
    onNewNotification: (notification) => {
      showToast({
        type: notification.type,
        title: notification.title,
        message: notification.message
      });
    }
  });

  const { toasts, showToast, removeToast } = useToastNotifications();

  // Current analysis data based on mode
  const currentAnalysis = useMemo(() => {
    switch (state.mode) {
      case 'point':
        return pointAnalysis;
      case 'area':
        return areaAnalysis;
      case 'heatmap':
        return heatmapData;
      default:
        return { data: null, loading: false, error: null };
    }
  }, [state.mode, pointAnalysis, areaAnalysis, heatmapData]);

  // Handle mode change
  const handleModeChange = useCallback((newMode: AnalysisMode) => {
    setState(prev => ({ ...prev, mode: newMode }));
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((newCategory: BusinessCategory) => {
    setState(prev => ({ ...prev, category: newCategory }));
  }, []);

  // Handle location change (for point analysis)
  const handleLocationChange = useCallback((lat: number, lon: number) => {
    setState(prev => ({ ...prev, location: { lat, lon } }));
  }, []);

  // Handle area change (for area analysis)
  const handleAreaChange = useCallback((newArea: string) => {
    setState(prev => ({ ...prev, area: newArea }));
  }, []);

  // Manual analysis trigger with optimistic updates
  const triggerAnalysis = useCallback(async () => {
    if (state.isAnalyzing) return;

    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      let result;
      const cacheKey = `analysis-${state.mode}-${state.category}-${
        state.mode === 'point' ? `${state.location?.lat}-${state.location?.lon}` : state.area
      }`;

      if (state.mode === 'point' && state.location) {
        // Use optimistic updates for point analysis
        result = await optimisticUpdates.applyUpdate(
          cacheKey,
          { loading: true }, // Optimistic loading state
          () => analyzePoint(state.location!.lat, state.location!.lon, state.category),
          {
            type: 'update',
            metadata: {
              source: 'manual-trigger',
              operation: 'point-analysis'
            }
          }
        );
      } else if (state.mode === 'area' && state.area) {
        // Use debounced API call for area analysis
        result = await debouncedApiCalls.debounce(
          () => analyzeArea(state.area, state.category),
          {
            delay: 500,
            key: `area-${state.area}-${state.category}`,
            cancelPrevious: true
          }
        );
      } else if (state.mode === 'heatmap') {
        // Use throttled API call for heatmap
        result = await debouncedApiCalls.throttle(
          () => getHeatmapData({ kategori: state.category }),
          {
            interval: 2000,
            key: `heatmap-${state.category}`,
            leading: true
          }
        );
      }

      if (result?.success) {
        showToast({
          type: 'success',
          title: 'Analiz Tamamlandı',
          message: 'Lokasyon analizi başarıyla güncellendi.'
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Analiz Hatası',
        message: error.message || 'Analiz sırasında bir hata oluştu.'
      });
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [state, analyzePoint, analyzeArea, getHeatmapData, showToast]);

  // Auto-refresh effect
  useEffect(() => {
    if (!state.autoRefresh || !enableRealtime) return;

    const interval = setInterval(() => {
      if (currentAnalysis.connected) {
        currentAnalysis.requestUpdate?.();
      } else {
        triggerAnalysis();
      }
    }, state.refreshInterval);

    return () => clearInterval(interval);
  }, [state.autoRefresh, state.refreshInterval, enableRealtime, currentAnalysis, triggerAnalysis]);

  // Connection status indicator
  const ConnectionStatus: React.FC = () => (
    <div className={`flex items-center space-x-2 text-sm ${
      currentAnalysis.connected ? 'text-green-600' : 'text-red-600'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        currentAnalysis.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span>
        {currentAnalysis.connected 
          ? `Canlı (${currentAnalysis.connectionType})` 
          : 'Bağlantı Yok'
        }
      </span>
      {currentAnalysis.lastUpdated && (
        <span className="text-gray-500">
          Son güncelleme: {new Date(currentAnalysis.lastUpdated).toLocaleTimeString('tr-TR')}
        </span>
      )}
    </div>
  );

  // Analysis results display
  const AnalysisResults: React.FC = () => {
    const { data, loading, error } = currentAnalysis;
    const isLoading = loading || state.isAnalyzing || apiLoading;

    if (error || apiError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Analiz Hatası</h3>
          <p className="text-red-600 text-sm">
            {error?.message || apiError?.message || 'Bilinmeyen bir hata oluştu'}
          </p>
          <button
            onClick={triggerAnalysis}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Analiz yapılıyor...</span>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 mb-3">Henüz analiz yapılmadı</p>
          <button
            onClick={triggerAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Analizi Başlat
          </button>
        </div>
      );
    }

    // Render analysis results based on mode
    switch (state.mode) {
      case 'point':
        return <PointAnalysisResults data={data} />;
      case 'area':
        return <AreaAnalysisResults data={data} />;
      case 'heatmap':
        return <HeatmapResults data={data} />;
      default:
        return null;
    }
  };

  // Point analysis results component
  const PointAnalysisResults: React.FC<{ data: any }> = ({ data }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Nokta Analizi Sonucu</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          data.category === 'Çok İyi' ? 'bg-green-100 text-green-800' :
          data.category === 'İyi' ? 'bg-blue-100 text-blue-800' :
          data.category === 'Orta' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {data.emoji} {data.category}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{data.total_score}</div>
          <div className="text-sm text-gray-600">Toplam Skor</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{data.normalized_score}</div>
          <div className="text-sm text-gray-600">Normalize Skor</div>
        </div>
      </div>

      {data.breakdown && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Detay Analiz</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Trafik Skoru:</span>
              <span className="font-medium">{data.breakdown.traffic?.score || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
                                      <span>Rekabet Analizi:</span>
              <span className="font-medium">{data.breakdown.competitors?.score || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Demografi:</span>
              <span className="font-medium">{data.breakdown.demographics || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Area analysis results component
  const AreaAnalysisResults: React.FC<{ data: any }> = ({ data }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Bölge Analizi Sonucu</h3>
        <div className="text-sm text-gray-600">
          {data.mahalle} - {data.kategori}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{data.toplam_lokasyon || 0}</div>
          <div className="text-sm text-gray-600">Toplam Lokasyon</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{data.ortalama_skor || 0}</div>
          <div className="text-sm text-gray-600">Ortalama Skor</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {data.en_iyi_lokasyonlar?.length || 0}
          </div>
          <div className="text-sm text-gray-600">En İyi Lokasyon</div>
        </div>
      </div>

      {data.en_iyi_lokasyonlar && data.en_iyi_lokasyonlar.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">En İyi Lokasyonlar</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.en_iyi_lokasyonlar.slice(0, 5).map((location: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <span>{location.address || `Lokasyon ${index + 1}`}</span>
                <div className="flex items-center space-x-2">
                  <span>{location.emoji}</span>
                  <span className="font-medium">{location.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Heatmap results component
  const HeatmapResults: React.FC<{ data: any }> = ({ data }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Isı Haritası Verileri</h3>
        <div className="text-sm text-gray-600">
          {data.kategori}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">{data.total_points || 0}</div>
          <div className="text-sm text-gray-600">Toplam Nokta</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {data.heatmap_data?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Aktif Nokta</div>
        </div>
      </div>

      {data.bounds && (
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-1">Harita Sınırları:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Kuzey: {data.bounds.north?.toFixed(4)}</div>
            <div>Güney: {data.bounds.south?.toFixed(4)}</div>
            <div>Doğu: {data.bounds.east?.toFixed(4)}</div>
            <div>Batı: {data.bounds.west?.toFixed(4)}</div>
          </div>
        </div>
      )}
    </div>
  );

  // Settings panel
  const SettingsPanel: React.FC = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-medium text-gray-800">Ayarlar</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Otomatik Yenileme</label>
          <input
            type="checkbox"
            checked={state.autoRefresh}
            onChange={(e) => setState(prev => ({ ...prev, autoRefresh: e.target.checked }))}
            className="rounded"
          />
        </div>

        {state.autoRefresh && (
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Yenileme Aralığı (saniye)</label>
            <select
              value={state.refreshInterval / 1000}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                refreshInterval: parseInt(e.target.value) * 1000 
              }))}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10 saniye</option>
              <option value={30}>30 saniye</option>
              <option value={60}>1 dakika</option>
              <option value={300}>5 dakika</option>
            </select>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Güncelleme Sayısı: {currentAnalysis.updateCount || 0}</div>
            <div>Bağlantı Türü: {currentAnalysis.connectionType || 'Yok'}</div>
            {notifications.unreadCount > 0 && (
              <div>Okunmamış Bildirim: {notifications.unreadCount}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Toast notifications
  const ToastNotifications: React.FC = () => (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 ${
            toast.type === 'success' ? 'bg-green-50 border-green-400' :
            toast.type === 'error' ? 'bg-red-50 border-red-400' :
            toast.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
            'bg-blue-50 border-blue-400'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-medium text-sm ${
                toast.type === 'success' ? 'text-green-800' :
                toast.type === 'error' ? 'text-red-800' :
                toast.type === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {toast.title}
              </h4>
              <p className={`text-sm mt-1 ${
                toast.type === 'success' ? 'text-green-600' :
                toast.type === 'error' ? 'text-red-600' :
                toast.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lokasyon Analiz Paneli</h1>
        <div className="flex items-center space-x-4">
          <ConnectionStatus />
          <button
            onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-2">
        {(['point', 'area', 'heatmap'] as AnalysisMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              state.mode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mode === 'point' ? 'Nokta Analizi' :
             mode === 'area' ? 'Bölge Analizi' :
             'Isı Haritası'}
          </button>
        ))}
      </div>

      {/* Category Selection */}
      <div className="flex flex-wrap gap-2">
        {(['cafe', 'restoran', 'market', 'eczane', 'firin', 'avm'] as BusinessCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-3 py-1 rounded-full text-sm ${
              state.category === category
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.mode === 'point' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Koordinatlar</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                placeholder="Enlem"
                value={state.location?.lat || ''}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat) && state.location) {
                    handleLocationChange(lat, state.location.lon);
                  }
                }}
                className="p-2 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                step="any"
                placeholder="Boylam"
                value={state.location?.lon || ''}
                onChange={(e) => {
                  const lon = parseFloat(e.target.value);
                  if (!isNaN(lon) && state.location) {
                    handleLocationChange(state.location.lat, lon);
                  }
                }}
                className="p-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        )}

        {state.mode === 'area' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Mahalle</label>
            <input
              type="text"
              placeholder="Mahalle adı girin"
              value={state.area}
              onChange={(e) => handleAreaChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
        )}

        <div className="flex items-end">
          <button
            onClick={triggerAnalysis}
            disabled={state.isAnalyzing || apiLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isAnalyzing || apiLoading ? 'Analiz Yapılıyor...' : 'Analizi Başlat'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {state.showSettings && <SettingsPanel />}

      {/* Analysis Results */}
      <AnalysisResults />

      {/* Toast Notifications */}
      <ToastNotifications />
    </div>
  );
};