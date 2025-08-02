# Language Selector Component Design

## Overview
Design a consistent language selector component that can be used across all UI modules with a fixed position in the top right corner.

## Component Specifications

### Visual Design
- **Position**: Fixed in the top right corner of the viewport
- **Z-index**: High value (e.g., 9999) to ensure it's always visible
- **Size**: Compact to avoid interfering with main content
- **Responsive**: Adapts to different screen sizes

### Visual Elements
1. **Main Button/Display**
   - Shows current language with flag or text
   - Down arrow indicator for dropdown
   - Hover effects for better UX

2. **Dropdown Menu**
   - Appears below the main button when clicked
   - Contains list of available languages
   - Smooth animation for showing/hiding
   - Background with subtle shadow for depth

3. **Language Options**
   - Flag icon for each language
   - Language name in native language
   - Checkmark or highlight for current selection

### Available Languages
- Turkish (Türkçe) - Default
- English (English)

## React Component Design

### Component Structure
```tsx
// src/components/LanguageSelector/LanguageSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import './LanguageSelector.css';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('tr');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    setIsOpen(false);
    // Notify translation system of language change
    window.dispatchEvent(new CustomEvent('languageChange', { detail: langCode }));
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button 
        className="language-selector__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="language-selector__flag">{getCurrentLanguage().flag}</span>
        <span className="language-selector__code">{currentLanguage.toUpperCase()}</span>
        <span className="language-selector__arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="language-selector__dropdown">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`language-selector__option ${
                currentLanguage === language.code ? 'language-selector__option--active' : ''
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="language-selector__flag">{language.flag}</span>
              <span className="language-selector__name">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
```

### CSS Styling
```css
/* src/components/LanguageSelector/LanguageSelector.css */
.language-selector {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.language-selector__button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.language-selector__button:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e0;
}

.language-selector__flag {
  font-size: 16px;
}

.language-selector__code {
  font-weight: 600;
  color: #334155;
}

.language-selector__arrow {
  font-size: 12px;
  color: #94a3b8;
}

.language-selector__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 160px;
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.language-selector__option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.language-selector__option:hover {
  background-color: #f1f5f9;
}

.language-selector__option--active {
  background-color: #dbeafe;
  font-weight: 600;
}

.language-selector__name {
  color: #334155;
}

/* Responsive design */
@media (max-width: 768px) {
  .language-selector {
    top: 12px;
    right: 12px;
  }
  
  .language-selector__button {
    padding: 6px 10px;
  }
  
  .language-selector__code {
    font-size: 14px;
  }
}
```

## HTML/JavaScript Implementation

### Component Structure
```html
<!-- Language selector for HTML templates -->
<div class="language-selector" id="languageSelector">
  <button class="language-selector__button" id="languageButton" aria-label="Select language">
    <span class="language-selector__flag" id="currentFlag">🇹🇷</span>
    <span class="language-selector__code" id="currentCode">TR</span>
    <span class="language-selector__arrow" id="arrow">▼</span>
  </button>

  <div class="language-selector__dropdown" id="languageDropdown" style="display: none;">
    <button class="language-selector__option language-selector__option--active" data-lang="tr">
      <span class="language-selector__flag">🇹🇷</span>
      <span class="language-selector__name">Türkçe</span>
    </button>
    <button class="language-selector__option" data-lang="en">
      <span class="language-selector__flag">🇬🇧</span>
      <span class="language-selector__name">English</span>
    </button>
  </div>
</div>
```

### JavaScript Functionality
```javascript
// static/js/language-selector.js
class LanguageSelector {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'tr';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    const button = document.getElementById('languageButton');
    const dropdown = document.getElementById('languageDropdown');
    const options = document.querySelectorAll('.language-selector__option');

    // Toggle dropdown
    button.addEventListener('click', () => {
      const isOpen = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';
      document.getElementById('arrow').textContent = isOpen ? '▼' : '▲';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!document.getElementById('languageSelector').contains(event.target)) {
        dropdown.style.display = 'none';
        document.getElementById('arrow').textContent = '▼';
      }
    });

    // Handle language selection
    options.forEach(option => {
      option.addEventListener('click', () => {
        const langCode = option.getAttribute('data-lang');
        this.changeLanguage(langCode);
      });
    });
  }

  changeLanguage(langCode) {
    this.currentLanguage = langCode;
    localStorage.setItem('language', langCode);
    
    // Update UI
    this.updateUI();
    
    // Hide dropdown
    document.getElementById('languageDropdown').style.display = 'none';
    document.getElementById('arrow').textContent = '▼';
    
    // Notify other components of language change
    window.dispatchEvent(new CustomEvent('languageChange', { detail: langCode }));
  }

  updateUI() {
    const languages = {
      tr: { flag: '🇹🇷', name: 'Türkçe' },
      en: { flag: '🇬🇧', name: 'English' }
    };
    
    const currentLang = languages[this.currentLanguage] || languages.tr;
    
    // Update button text
    document.getElementById('currentFlag').textContent = currentLang.flag;
    document.getElementById('currentCode').textContent = this.currentLanguage.toUpperCase();
    
    // Update active option
    document.querySelectorAll('.language-selector__option').forEach(option => {
      option.classList.remove('language-selector__option--active');
      if (option.getAttribute('data-lang') === this.currentLanguage) {
        option.classList.add('language-selector__option--active');
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LanguageSelector();
});
```

## Integration Guidelines

### For React Applications
1. Import the LanguageSelector component
2. Place it at the top level of the application (e.g., in App.tsx)
3. Ensure CSS is imported

### For HTML Templates
1. Include the HTML structure in the template
2. Add the CSS to the stylesheet
3. Include the JavaScript file before the closing body tag

### For JavaScript Modules
1. Listen for the 'languageChange' custom event
2. Update UI elements when the event is fired
3. Use the translation utilities for text content

## Accessibility Features

1. **ARIA Labels**: Proper labeling for screen readers
2. **Keyboard Navigation**: Full keyboard support
3. **Focus Management**: Proper focus handling
4. **Contrast**: Sufficient color contrast for readability
5. **Responsive**: Works on all device sizes

## Performance Considerations

1. **Minimal DOM**: Lightweight component structure
2. **Efficient Events**: Proper event handling and cleanup
3. **CSS Animations**: Hardware-accelerated animations
4. **Lazy Loading**: Load only when needed
5. **Caching**: Cache language data for quick access