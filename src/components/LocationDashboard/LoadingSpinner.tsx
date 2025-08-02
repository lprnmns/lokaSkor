/**
 * Loading Spinner Component
 * Provides visual feedback during API calls
 */

import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Yükleniyor...',
  size = 'medium',
  className = ''
}) => {
  return (
    <div className={`loading-spinner ${size} ${className}`}>
      <div className="spinner-container">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        {message && (
          <div className="spinner-message">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;