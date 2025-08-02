/**
 * Interactive Map View Component
 * Displays map with location analysis visualization
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  AnalysisMode, 
  BusinessCategory, 
  LatLng, 
  MapBounds, 
  HeatmapDataPoint 
} from '../../lib/api';

export interface MapViewProps {
  analysisMode: AnalysisMode;
  selectedCategory: BusinessCategory;
  currentLocation: LatLng | null;
  selectedArea: string | null;
  heatmapData: HeatmapDataPoint[];
  onMapClick: (lat: number, lng: number) => void;
  onAreaSelect: (area: string) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  loading?: boolean;
  className?: string;
}

// Mock neighborhoods for area selection
const ANKARA_NEIGHBORHOODS = [
  'Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan',
  'Etimesgut', 'Gölbaşı', 'Pursaklar', 'Altındağ', 'Polatlı',
  'Beypazarı', 'Ayaş', 'Güdül', 'Kızılcahamam', 'Şereflikoçhisar'
];

export const MapView: React.FC<MapViewProps> = ({
  analysisMode,
  selectedCategory,
  currentLocation,
  selectedArea,
  heatmapData,
  onMapClick,
  onAreaSelect,
  onBoundsChange,
  loading = false,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 39.9334, lng: 32.8597 }); // Ankara center
  const [zoomLevel, setZoomLevel] = useState(11);

  // Handle map click events
  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (analysisMode !== 'point' || loading) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (simplified calculation)
    // In a real implementation, this would use proper map projection
    const lat = mapCenter.lat + (rect.height / 2 - y) * 0.001;
    const lng = mapCenter.lng + (x - rect.width / 2) * 0.001;
    
    onMapClick(lat, lng);
  }, [analysisMode, loading, mapCenter, onMapClick]);

  // Handle area selection
  const handleAreaSelect = useCallback((area: string) => {
    if (analysisMode !== 'area' || loading) return;
    onAreaSelect(area);
  }, [analysisMode, loading, onAreaSelect]);

  // Update map bounds when view changes
  useEffect(() => {
    const bounds: MapBounds = {
      north: mapCenter.lat + 0.05,
      south: mapCenter.lat - 0.05,
      east: mapCenter.lng + 0.05,
      west: mapCenter.lng - 0.05
    };
    onBoundsChange(bounds);
  }, [mapCenter, onBoundsChange]);

  // Render heatmap overlay
  const renderHeatmapOverlay = () => {
    if (analysisMode !== 'heatmap' || heatmapData.length === 0) return null;

    return (
      <div className="heatmap-overlay">
        {heatmapData.map((point, index) => (
          <div
            key={index}
            className="heatmap-point"
            style={{
              position: 'absolute',
              left: `${((point.lon - mapCenter.lng + 0.05) / 0.1) * 100}%`,
              top: `${((mapCenter.lat - point.lat + 0.05) / 0.1) * 100}%`,
              opacity: point.intensity,
              backgroundColor: `rgba(255, ${255 - Math.floor(point.intensity * 255)}, 0, ${point.intensity})`,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </div>
    );
  };

  // Render current location marker
  const renderLocationMarker = () => {
    if (analysisMode !== 'point' || !currentLocation) return null;

    return (
      <div
        className="location-marker"
        style={{
          position: 'absolute',
          left: `${((currentLocation.lng - mapCenter.lng + 0.05) / 0.1) * 100}%`,
          top: `${((mapCenter.lat - currentLocation.lat + 0.05) / 0.1) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 1000
        }}
      >
        <div className="marker-pin">📍</div>
        <div className="marker-pulse"></div>
      </div>
    );
  };

  // Render area selector
  const renderAreaSelector = () => {
    if (analysisMode !== 'area') return null;

    return (
      <div className="area-selector">
        <label htmlFor="area-select">Mahalle Seçin:</label>
        <select
          id="area-select"
          value={selectedArea || ''}
          onChange={(e) => handleAreaSelect(e.target.value)}
          disabled={loading}
          className={loading ? 'disabled' : ''}
        >
          <option value="">Mahalle seçin...</option>
          {ANKARA_NEIGHBORHOODS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Render map controls
  const renderMapControls = () => (
    <div className="map-controls">
      <button
        type="button"
        className="zoom-in"
        onClick={() => setZoomLevel(prev => Math.min(prev + 1, 18))}
        disabled={loading}
        aria-label="Yakınlaştır"
      >
        +
      </button>
      <button
        type="button"
        className="zoom-out"
        onClick={() => setZoomLevel(prev => Math.max(prev - 1, 8))}
        disabled={loading}
        aria-label="Uzaklaştır"
      >
        -
      </button>
      <button
        type="button"
        className="center-map"
        onClick={() => setMapCenter({ lat: 39.9334, lng: 32.8597 })}
        disabled={loading}
        aria-label="Merkeze dön"
      >
        🎯
      </button>
    </div>
  );

  // Render analysis mode instructions
  const renderInstructions = () => {
    const instructions = {
      point: 'Haritaya tıklayarak analiz yapmak istediğiniz noktayı seçin',
      area: 'Analiz yapmak istediğiniz mahalleyi seçin',
      heatmap: 'Isı haritası otomatik olarak yükleniyor'
    };

    return (
      <div className="map-instructions">
        <p>{instructions[analysisMode]}</p>
      </div>
    );
  };

  return (
    <div className={`map-view ${className} ${loading ? 'loading' : ''}`}>
      {renderAreaSelector()}
      {renderInstructions()}
      
      <div
        ref={mapContainerRef}
        className={`map-container ${analysisMode}`}
        onClick={handleMapClick}
        style={{
          cursor: analysisMode === 'point' && !loading ? 'crosshair' : 'default',
          position: 'relative',
          width: '100%',
          height: '400px',
          backgroundColor: '#f0f8ff',
          border: '2px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Simplified map background */}
        <div className="map-background">
          <div className="map-grid">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`h-${i}`} className="grid-line horizontal" style={{ top: `${i * 10}%` }} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`v-${i}`} className="grid-line vertical" style={{ left: `${i * 10}%` }} />
            ))}
          </div>
          
          {/* Ankara outline (simplified) */}
          <div className="city-outline">
            <div className="city-center" style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '60%',
              border: '2px dashed #666',
              borderRadius: '30%',
              opacity: 0.3
            }}>
              <span style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '12px',
                color: '#666'
              }}>
                Ankara
              </span>
            </div>
          </div>
        </div>

        {renderHeatmapOverlay()}
        {renderLocationMarker()}
        
        {loading && (
          <div className="map-loading-overlay">
            <div className="loading-spinner">⏳</div>
            <span>Yükleniyor...</span>
          </div>
        )}
      </div>

      {renderMapControls()}
      
      <div className="map-info">
        <div className="coordinates">
          Merkez: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
        </div>
        <div className="zoom-level">
          Zoom: {zoomLevel}
        </div>
        {analysisMode === 'heatmap' && (
          <div className="heatmap-info">
            Veri noktası: {heatmapData.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;