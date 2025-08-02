import React, { useState } from 'react';
import { Trash2, MapPin } from 'lucide-react';
import { Location } from '../types/Location';
import { useTranslation } from '../contexts/TranslationContext';

interface LocationCardProps {
  location: Location;
  index: number;
  onRemove: (id: string) => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, index, onRemove }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const badgeColors = [
    'bg-red-500 text-white',
    'bg-blue-500 text-white', 
    'bg-green-500 text-white'
  ];

  return (
    <div
      className={`p-4 border border-slate-200 rounded-xl transition-all duration-200 cursor-pointer
        ${isHovered ? 'bg-slate-50 shadow-md' : 'bg-white shadow-sm'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${badgeColors[index]}`}>
            {index + 1}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 font-medium truncate">
              {location.address}
            </p>
            <div className="flex items-center space-x-1 text-slate-500 text-sm mt-1">
              <MapPin className="w-3 h-3" />
              <span>{location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>
        
        {isHovered && (
          <button
            onClick={() => onRemove(location.id)}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors duration-200 rounded-lg hover:bg-red-50"
            aria-label={t('locationCard.remove')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationCard;