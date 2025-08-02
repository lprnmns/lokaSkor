/**
 * Business Category Selector Component
 * Allows selection of business category for analysis
 */

import React from 'react';
import { BusinessCategory } from '../../lib/api';

export interface CategorySelectorProps {
  selectedCategory: BusinessCategory;
  onCategoryChange: (category: BusinessCategory) => void;
  disabled?: boolean;
  className?: string;
}

const BUSINESS_CATEGORIES: Array<{
  value: BusinessCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    value: 'eczane',
    label: 'Eczane',
    description: 'Eczane ve sağlık hizmetleri',
    icon: '💊',
    color: '#e74c3c'
  },
  {
    value: 'firin',
    label: 'Fırın',
    description: 'Fırın ve unlu mamul satışı',
    icon: '🍞',
    color: '#f39c12'
  },
  {
    value: 'cafe',
    label: 'Cafe',
    description: 'Cafe ve kahve dükkanları',
    icon: '☕',
    color: '#8b4513'
  },
  {
    value: 'market',
    label: 'Market',
    description: 'Market ve gıda satışı',
    icon: '🛒',
    color: '#27ae60'
  },
  {
    value: 'restoran',
    label: 'Restoran',
    description: 'Restoran ve yemek hizmetleri',
    icon: '🍽️',
    color: '#9b59b6'
  }
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  disabled = false,
  className = ''
}) => {
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!disabled) {
      onCategoryChange(event.target.value as BusinessCategory);
    }
  };

  const selectedCategoryInfo = BUSINESS_CATEGORIES.find(cat => cat.value === selectedCategory);

  return (
    <div className={`category-selector ${className}`}>
      <label className="selector-label" htmlFor="category-select">
        İş Kategorisi
      </label>
      
      <div className="selector-container">
        <div 
          className="category-indicator"
          style={{ backgroundColor: selectedCategoryInfo?.color }}
          role="img"
          aria-label={selectedCategoryInfo?.label}
        >
          {selectedCategoryInfo?.icon}
        </div>
        
        <select
          id="category-select"
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={disabled}
          className={`category-select ${disabled ? 'disabled' : ''}`}
          aria-label="İş kategorisi seçin"
        >
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="category-description">
        {selectedCategoryInfo?.description}
      </div>
      
      {/* Category grid for mobile/touch interfaces */}
      <div className="category-grid">
        {BUSINESS_CATEGORIES.map((category) => (
          <button
            key={category.value}
            type="button"
            className={`category-button ${selectedCategory === category.value ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onCategoryChange(category.value)}
            disabled={disabled}
            title={category.description}
            style={{ 
              borderColor: category.color,
              backgroundColor: selectedCategory === category.value ? category.color + '20' : 'transparent'
            }}
          >
            <span className="category-icon" role="img" aria-hidden="true">
              {category.icon}
            </span>
            <span className="category-name">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;