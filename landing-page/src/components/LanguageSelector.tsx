import React, { useState, useRef, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LanguageSelector: React.FC = () => {
  const [language, setLanguage] = useState<string>('tr');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  // Dropdown'u kapatmak için dışarı tıklama
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
    setLanguage(langCode);
    localStorage.setItem('language', langCode);
    setIsOpen(false);
    
    // Sayfayı yeniden yükle
    window.location.reload();
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === language) || languages[0];
  };

  return (
    <div className="language-selector" ref={dropdownRef} style={{
      position: 'fixed',
      top: '16px',
      left: '16px',
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
    }}>
      <button 
        className="language-selector__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Dil seçin"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }}
      >
        <span className="language-selector__flag" style={{ fontSize: '16px' }}>{getCurrentLanguage().flag}</span>
        <span className="language-selector__code" style={{ fontWeight: 600, color: '#334155' }}>{language.toUpperCase()}</span>
        <span className="language-selector__arrow" style={{ fontSize: '12px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="language-selector__dropdown" style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          minWidth: '160px',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease'
        }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-selector__option ${
                language === lang.code ? 'language-selector__option--active' : ''
              }`}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                backgroundColor: language === lang.code ? '#dbeafe' : 'transparent',
                fontWeight: language === lang.code ? 600 : 'normal'
              }}
            >
              <span className="language-selector__flag" style={{ fontSize: '16px' }}>{lang.flag}</span>
              <span className="language-selector__name" style={{ color: '#334155' }}>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;