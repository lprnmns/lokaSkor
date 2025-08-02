/**
 * Score Display Component
 * Shows analysis results and scores with visual indicators
 */

import React, { useMemo } from 'react';
import { 
  AnalysisMode, 
  PointAnalysisResponse, 
  AreaAnalysisResponse 
} from '../../lib/api';

export interface ScoreDisplayProps {
  analysisMode: AnalysisMode;
  data: PointAnalysisResponse | AreaAnalysisResponse | null;
  heatmapStats?: {
    totalPoints: number;
    lastUpdated: Date | null;
  };
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  analysisMode,
  data,
  heatmapStats,
  loading = false,
  onRefresh,
  className = ''
}) => {
  // Determine if data is point analysis or area analysis
  const isPointAnalysis = useMemo(() => {
    return data && 'total_score' in data;
  }, [data]);

  const isAreaAnalysis = useMemo(() => {
    return data && 'mahalle' in data;
  }, [data]);

  // Render point analysis results
  const renderPointAnalysis = () => {
    if (!isPointAnalysis) return null;
    
    const pointData = data as PointAnalysisResponse;

    return (
      <div className="point-analysis-results">
        <div className="score-header">
          <div className="main-score">
            <div 
              className="score-circle"
              style={{ 
                backgroundColor: pointData.color,
                color: '#fff'
              }}
            >
              <span className="score-emoji">{pointData.emoji}</span>
              <span className="score-value">{pointData.total_score.toFixed(1)}</span>
            </div>
            <div className="score-category">
              {pointData.category}
            </div>
          </div>
          
          <div className="score-details">
            <div className="score-item">
              <label>Normalize Skor:</label>
              <span>{pointData.normalized_score.toFixed(1)}/100</span>
            </div>
            <div className="score-item">
              <label>Ham Skor:</label>
              <span>{pointData.raw_score.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="score-breakdown">
          <h4>Detaylı Analiz</h4>
          <div className="breakdown-items">
            {Object.entries(pointData.breakdown).map(([key, value]) => (
              <div key={key} className="breakdown-item">
                <div className="breakdown-label">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="breakdown-value">
                  <div className="breakdown-score">
                    {typeof value === 'object' ? value.score?.toFixed(1) : value.toFixed(1)}
                  </div>
                  {typeof value === 'object' && value.distance && (
                    <div className="breakdown-distance">
                      {value.distance}m
                    </div>
                  )}
                  {typeof value === 'object' && value.count && (
                    <div className="breakdown-count">
                      {value.count} adet
                    </div>
                  )}
                </div>
                <div 
                  className="breakdown-bar"
                  style={{
                    width: `${Math.abs((typeof value === 'object' ? value.score : value) / 100) * 100}%`,
                    backgroundColor: (typeof value === 'object' ? value.score : value) >= 0 ? '#28a745' : '#dc3545'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render area analysis results
  const renderAreaAnalysis = () => {
    if (!isAreaAnalysis) return null;
    
    const areaData = data as AreaAnalysisResponse;

    return (
      <div className="area-analysis-results">
        <div className="area-header">
          <h3>{areaData.mahalle} - {areaData.kategori}</h3>
          <div className="area-stats">
            <div className="stat-item">
              <label>Toplam Lokasyon:</label>
              <span>{areaData.toplam_lokasyon}</span>
            </div>
            <div className="stat-item">
              <label>Ortalama Skor:</label>
              <span>{areaData.ortalama_skor.toFixed(1)}/100</span>
            </div>
          </div>
        </div>

        <div className="area-summary">
          <p>{areaData.analiz_ozeti}</p>
        </div>

        <div className="best-locations">
          <h4>En İyi Lokasyonlar</h4>
          <div className="locations-list">
            {areaData.en_iyi_lokasyonlar.slice(0, 5).map((location, index) => (
              <div key={index} className="location-item">
                <div className="location-rank">#{index + 1}</div>
                <div className="location-info">
                  <div className="location-score">
                    <span className="score-emoji">{location.emoji}</span>
                    <span className="score-value">{location.score.toFixed(1)}</span>
                  </div>
                  <div className="location-details">
                    <div className="location-category">{location.category}</div>
                    <div className="location-address">{location.address}</div>
                    <div className="location-coords">
                      {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render heatmap stats
  const renderHeatmapStats = () => {
    if (analysisMode !== 'heatmap' || !heatmapStats) return null;

    return (
      <div className="heatmap-stats">
        <h3>Isı Haritası İstatistikleri</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{heatmapStats.totalPoints}</div>
            <div className="stat-label">Veri Noktası</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {heatmapStats.lastUpdated ? 
                heatmapStats.lastUpdated.toLocaleTimeString('tr-TR') : 
                'Henüz yok'
              }
            </div>
            <div className="stat-label">Son Güncelleme</div>
          </div>
        </div>
        
        <div className="heatmap-legend">
          <h5>Yoğunluk Göstergesi</h5>
          <div className="legend-bar">
            <div className="legend-gradient"></div>
            <div className="legend-labels">
              <span>Düşük</span>
              <span>Orta</span>
              <span>Yüksek</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const emptyMessages = {
      point: 'Haritadan bir nokta seçerek analiz başlatın',
      area: 'Bir mahalle seçerek analiz başlatın',
      heatmap: 'Isı haritası yükleniyor...'
    };

    return (
      <div className="empty-state">
        <div className="empty-icon">
          {analysisMode === 'point' && '📍'}
          {analysisMode === 'area' && '🏘️'}
          {analysisMode === 'heatmap' && '🗺️'}
        </div>
        <div className="empty-message">
          {emptyMessages[analysisMode]}
        </div>
      </div>
    );
  };

  // Render loading state
  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner">⏳</div>
      <div className="loading-message">Analiz yapılıyor...</div>
    </div>
  );

  return (
    <div className={`score-display ${className} ${analysisMode}`}>
      <div className="display-header">
        <h2>Analiz Sonuçları</h2>
        {onRefresh && !loading && data && (
          <button
            type="button"
            className="refresh-button"
            onClick={onRefresh}
            aria-label="Sonuçları yenile"
          >
            🔄 Yenile
          </button>
        )}
      </div>

      <div className="display-content">
        {loading && renderLoadingState()}
        
        {!loading && !data && analysisMode !== 'heatmap' && renderEmptyState()}
        
        {!loading && data && analysisMode === 'point' && renderPointAnalysis()}
        
        {!loading && data && analysisMode === 'area' && renderAreaAnalysis()}
        
        {analysisMode === 'heatmap' && renderHeatmapStats()}
      </div>
    </div>
  );
};

export default ScoreDisplay;