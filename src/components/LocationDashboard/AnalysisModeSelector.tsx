/**
 * Analysis Mode Selector Component
 * Allows switching between point, area, and heatmap analysis modes
 */

import React from 'react';
import { AnalysisMode } from '../../lib/api';

export interface AnalysisModeSelectorProps {
  selectedMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
  className?: string;
}

const ANALYSIS_MODES: Array<{
  value: AnalysisMode;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'point',
    label: 'Nokta Analizi',
    description: 'Belirli bir noktayı analiz et',
    icon: '📍'
  },
  {
    value: 'area',
    label: 'Bölge Analizi',
    description: 'Mahalle bazında analiz yap',
    icon: '🏘️'
  },
  {
    value: 'heatmap',
    label: 'Isı Haritası',
    description: 'Bölgesel yoğunluk haritası',
    icon: '🗺️'
  }
];

export const AnalysisModeSelector: React.FC<AnalysisModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
  className = ''
}) => {
  const handleModeChange = (mode: AnalysisMode) => {
    if (!disabled && mode !== selectedMode) {
      onModeChange(mode);
    }
  };

  return (
    <div className={`analysis-mode-selector ${className}`}>
      <label className="selector-label">Analiz Modu</label>
      
      <div className="mode-buttons">
        {ANALYSIS_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={`mode-button ${selectedMode === mode.value ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => handleModeChange(mode.value)}
            disabled={disabled}
            title={mode.description}
            aria-label={`${mode.label} - ${mode.description}`}
          >
            <span className="mode-icon" role="img" aria-hidden="true">
              {mode.icon}
            </span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mode-description">
        {ANALYSIS_MODES.find(mode => mode.value === selectedMode)?.description}
      </div>
    </div>
  );
};

export default AnalysisModeSelector;