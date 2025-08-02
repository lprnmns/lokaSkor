import React from 'react';
import LocationSelectorSidebar from './components/LocationSelectorSidebar';
import MapPlaceholder from './components/MapPlaceholder';
import { TranslationProvider } from './contexts/TranslationContext';
import LanguageSelector from './components/LanguageSelector';

function App() {
  return (
    <TranslationProvider>
      <div className="min-h-screen bg-white flex">
        <div className="border-r border-slate-200">
          <LocationSelectorSidebar />
        </div>
        <MapPlaceholder />
        <LanguageSelector />
      </div>
    </TranslationProvider>
  );
}

export default App;