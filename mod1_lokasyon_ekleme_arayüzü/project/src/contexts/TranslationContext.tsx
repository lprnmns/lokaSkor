import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('tr');
  const [translations, setTranslations] = useState<Record<string, any>>({});

  // Dil değişikliğini ve çevirileri localStorage'da sakla
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setLanguageState(savedLang);
    }
    loadTranslations(savedLang || 'tr');
  }, []);

  const loadTranslations = async (lang: string) => {
    try {
      // Çeviri dosyalarını dinamik olarak yükle
      const common = await import(`../locales/${lang}/common.json`);
      
      setTranslations({
        ...common.default
      });
    } catch (error) {
      console.error(`Çeviri dosyaları yüklenirken hata oluştu: ${lang}`, error);
      // Varsayılan olarak Türkçe çevirileri yükle
      if (lang !== 'tr') {
        loadTranslations('tr');
      }
    }
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    loadTranslations(lang);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    // Çeviri anahtarını kullanarak çeviriyi bul
    const keys = key.split('.');
    let translation: any = translations;
    
    for (const k of keys) {
      if (!translation || !translation[k]) {
        // Çeviri bulunamazsa anahtarı döndür
        return key;
      }
      translation = translation[k];
    }
    
    // Parametreleri değiştir
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }
    
    return translation;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

// useTranslation hook'u
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation hook\'u bir TranslationProvider içinde kullanılmalıdır');
  }
  return context;
};