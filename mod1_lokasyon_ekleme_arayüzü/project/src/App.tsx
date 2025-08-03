import React from 'react';
import LocationSelectorSidebar from './components/LocationSelectorSidebar';
import MapPlaceholder from './components/MapPlaceholder';

function App() {
  return (
    <div className="min-h-screen bg-white flex">
      <div className="border-r border-slate-200">
        <LocationSelectorSidebar />
      </div>
      <MapPlaceholder />
    </div>
  );
}

export default App;