# React Components Translation Strategy

## Overview
This strategy defines how to implement translation functionality in all React applications within the project.

## Core Implementation

### 1. Translation Context
Create a context to manage the translation state across all components:

```javascript
// src/contexts/TranslationContext.ts
import React, { createContext, useContext, useState, useEffect } from 'react';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);
```

### 2. Translation Provider
Create a provider component to wrap the application:

```javascript
// src/providers/TranslationProvider.tsx
import React, { useState, useEffect } from 'react';
import { TranslationContext } from '../contexts/TranslationContext';
import translations from '../locales';

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('tr'); // Default to Turkish

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    // Implementation to retrieve translated string
    return translate(key, language, params);
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
      {children}
    </TranslationContext.Provider>
  );
};
```

### 3. Translation Hook
Create a custom hook for easy access to translation functions:

```javascript
// src/hooks/useTranslation.ts
import { useContext } from 'react';
import { TranslationContext } from '../contexts/TranslationContext';

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
```

## Integration Steps for Each React App

### 1. Main Landing Page (`landing-page/`)
- Wrap `App.tsx` with `TranslationProvider`
- Add language selector to top right corner
- Replace hardcoded text with translation keys

### 2. Location IQ Visualizer (`lovable-location-iq-visualize-main/`)
- Wrap `App.tsx` with `TranslationProvider`
- Add language selector to `pages/Index.tsx` and `pages/NotFound.tsx`
- Replace text in all UI components

### 3. Location Addition Interface (`mod1_lokasyon_ekleme_arayüzü/`)
- Wrap `App.tsx` with `TranslationProvider`
- Add language selector to all components in `components/` directory
- Translate component-specific text

### 4. Shop Comparison Interface (`Mod1-Belirli_Dükkanları_Karşılaştır/`)
- Wrap `App.tsx` with `TranslationProvider`
- Add language selector
- Translate all UI text

### 5. Mode Selection (`mode-selection-main/`)
- Wrap `App.tsx` with `TranslationProvider`
- Add language selector
- Translate UI elements

### 6. Main Application Components (`src/components/`)
- Wrap main `App.tsx` with `TranslationProvider`
- Add language selector to `LocationDashboard.tsx` and sub-components
- Translate all dashboard components

## Translation File Structure

Each React app will have its own locales directory:

```
src/
  locales/
    en/
      common.json
      components.json
      pages.json
    tr/
      common.json
      components.json
      pages.json
```

## Implementation Example

```tsx
// Before translation
const Header = () => {
  return (
    <header>
      <h1>Welcome to our application</h1>
      <button>Sign In</button>
    </header>
  );
};

// After translation
import { useTranslation } from '../hooks/useTranslation';

const Header = () => {
  const { t } = useTranslation();
  
  return (
    <header>
      <h1>{t('header.welcome')}</h1>
      <button>{t('buttons.signIn')}</button>
    </header>
  );
};
```

## Language Selector Integration

Add the language selector component to the top right corner of each main component:

```tsx
import { LanguageSelector } from '../components/LanguageSelector';

const App = () => {
  return (
    <div className="app">
      <header>
        <LanguageSelector />
      </header>
      <main>
        {/* Rest of the application */}
      </main>
    </div>
  );
};
```

## Key Considerations

1. **Performance**: Lazy load translation files to reduce initial bundle size
2. **Caching**: Cache loaded translations in memory for quick access
3. **Fallback**: Provide fallback to default language if translation is missing
4. **Dynamic Content**: Handle dynamic content that may require re-translation
5. **Testing**: Create tests for translation functionality