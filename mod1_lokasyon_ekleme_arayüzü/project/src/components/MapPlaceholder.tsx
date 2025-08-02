import React from 'react';
import { Map, Navigation } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

const MapPlaceholder: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 bg-slate-200 relative overflow-hidden">
      {/* Map placeholder with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-300"></div>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-slate-600">
          <Map className="w-24 h-24 mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-semibold mb-2">{t('map.title')}</h3>
          <p className="text-slate-500 max-w-sm">
            {t('map.description')}
          </p>
        </div>
      </div>

      {/* Map controls placeholder */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button className="w-10 h-8 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold border-b border-slate-200">
            +
          </button>
          <button className="w-10 h-8 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold">
            −
          </button>
        </div>
      </div>

      {/* Mock location pins */}
      <div className="absolute top-1/3 left-1/3 w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 opacity-60">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="absolute top-2/3 right-1/3 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 opacity-60">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
};

export default MapPlaceholder;