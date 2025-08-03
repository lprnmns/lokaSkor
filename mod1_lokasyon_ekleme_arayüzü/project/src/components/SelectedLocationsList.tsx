import React from 'react';
import { Location } from '../types/Location';
import LocationCard from './LocationCard';
import { AlertCircle } from 'lucide-react';

interface SelectedLocationsListProps {
  locations: Location[];
  onRemoveLocation: (id: string) => void;
  isMaxReached: boolean;
}

const SelectedLocationsList: React.FC<SelectedLocationsListProps> = ({ 
  locations, 
  onRemoveLocation, 
  isMaxReached 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3 mb-4">
          Seçilen Konumlar ({locations.length}/3)
        </h3>
      </div>

      {isMaxReached && (
        <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800 text-sm font-medium">
            Maksimum konum sayısına ulaşıldı.
          </p>
        </div>
      )}

      {locations.length === 1 && (
        <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl">
          <p className="text-slate-600 text-sm text-center">
            Karşılaştırmaya başlamak için bir nokta daha ekleyin
          </p>
        </div>
      )}
      {locations.length === 0 ? (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <div className="text-blue-600 mb-2">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-blue-800 font-medium mb-1">Hiç konum seçilmedi</p>
          <p className="text-blue-600 text-sm">
            Karşılaştırmaya başlamak için en az 2 konum ekleyin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((location, index) => (
            <LocationCard
              key={location.id}
              location={location}
              index={index}
              onRemove={onRemoveLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectedLocationsList;