import React, { useState } from 'react';
import { Location } from '../types/Location';
import SmartSearchBar from './SmartSearchBar';
import SelectedLocationsList from './SelectedLocationsList';

const LocationSelectorSidebar: React.FC = () => {
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);

  const isMaxReached = selectedLocations.length >= 3;

  // Mock function to simulate geocoding/coordinate parsing
  const parseLocationInput = (input: string): { address: string; coordinates: { lat: number; lng: number } } => {
    // Check if input looks like coordinates (simple regex for lat,lng)
    const coordsMatch = input.match(/^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/);
    
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[2]);
      return {
        address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        coordinates: { lat, lng }
      };
    }
    
    // Mock geocoding result for address
    const mockCoordinates = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1
    };
    
    return {
      address: input,
      coordinates: mockCoordinates
    };
  };

  const handleSearch = (query: string) => {
    if (isMaxReached) return;

    const parsedLocation = parseLocationInput(query);
    const newLocation: Location = {
      id: Math.random().toString(36).substr(2, 9),
      address: parsedLocation.address,
      coordinates: parsedLocation.coordinates,
      addedAt: new Date()
    };

    setSelectedLocations(prev => [...prev, newLocation]);
  };

  const handleRemoveLocation = (id: string) => {
    setSelectedLocations(prev => prev.filter(location => location.id !== id));
  };

  return (
    <div className="w-[400px] bg-slate-50 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">LocationIQ</h1>
            <p className="text-sm text-slate-500">Konum Analiz Aracı</p>
          </div>
        </div>

        <div className="space-y-4">
          <SmartSearchBar 
            disabled={isMaxReached}
            onSearch={handleSearch}
          />
          
          {!isMaxReached && (
            <p className="text-sm text-slate-500 text-center">
              veya eklemek için haritadan bir konum seçin
            </p>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <SelectedLocationsList
          locations={selectedLocations}
          onRemoveLocation={handleRemoveLocation}
          isMaxReached={isMaxReached}
        />
      </div>

      {/* Footer */}
      {selectedLocations.length >= 2 && (
        <div className="p-6 border-t border-slate-200 bg-white">
          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200">
            Start Comparison
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationSelectorSidebar;