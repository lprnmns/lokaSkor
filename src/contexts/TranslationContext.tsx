import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>('tr');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'tr';
    setLanguage(savedLang);
    loadTranslations(savedLang);
  }, []);

  const loadTranslations = async (lang: string) => {
    try {
      const translationModule = await import(`../locales/${lang}/common.json`);
      setTranslations(translationModule.default);
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      // Fallback to empty translations
      setTranslations({});
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    loadTranslations(lang);
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};