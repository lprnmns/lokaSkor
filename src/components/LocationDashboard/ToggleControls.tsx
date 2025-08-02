/**
 * Toggle Controls Component
 * Provides toggle switches for analysis options
 */

import React from 'react';

export interface ToggleControlsProps {
  toggleStates: {
    trafficData: boolean;
    competitorAnalysis: boolean;
    demographics: boolean;
  };
  onToggleChange: (toggle: keyof ToggleControlsProps['toggleStates'], value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const TOGGLE_OPTIONS = [
  {
    key: 'trafficData' as const,
    label: 'Trafik Verisi',
    description: 'Yaya ve araç trafiği analizi',
    icon: '🚗'
  },
  {
    key: 'competitorAnalysis' as const,
            label: 'Rekabet Analizi',
    description: 'Yakındaki rakip işletmeler',
    icon: '🏪'
  },
  {
    key: 'demographics' as const,
    label: 'Demografik Veri',
    description: 'Yaş ve gelir dağılımı',
    icon: '👥'
  }
];

export const ToggleControls: React.FC<ToggleControlsProps> = ({
  toggleStates,
  onToggleChange,
  disabled = false,
  className = ''
}) => {
  const handleToggleChange = (key: keyof ToggleControlsProps['toggleStates']) => {
    if (!disabled) {
      onToggleChange(key, !toggleStates[key]);
    }
  };

  return (
    <div className={`toggle-controls ${className}`}>
      <label className="controls-label">Analiz Seçenekleri</label>
      
      <div className="toggle-list">
        {TOGGLE_OPTIONS.map((option) => (
          <div
            key={option.key}
            className={`toggle-item ${toggleStates[option.key] ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          >
            <button
              type="button"
              className="toggle-button"
              onClick={() => handleToggleChange(option.key)}
              disabled={disabled}
              aria-pressed={toggleStates[option.key]}
              aria-label={`${option.label} ${toggleStates[option.key] ? 'aktif' : 'pasif'}`}
            >
              <span className="toggle-icon" role="img" aria-hidden="true">
                {option.icon}
              </span>
              
              <div className="toggle-content">
                <div className="toggle-label">{option.label}</div>
                <div className="toggle-description">{option.description}</div>
              </div>
              
              <div className={`toggle-switch ${toggleStates[option.key] ? 'on' : 'off'}`}>
                <div className="toggle-slider">
                  <div className="toggle-knob"></div>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
      
      <div className="toggle-summary">
        {Object.values(toggleStates).filter(Boolean).length} / {TOGGLE_OPTIONS.length} seçenek aktif
      </div>
    </div>
  );
};

export default ToggleControls;