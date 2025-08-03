import React from 'react';
import { BarChart3, Search, MapPin, ArrowLeft, Play } from 'lucide-react';

function App() {
  const [selectedMode, setSelectedMode] = React.useState<'compare' | 'discover' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">LocationIQ</h1>
        </div>
        <button className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium text-sm">
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Geri
          </div>
        </button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-24 pb-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
            Hangi analiz türünü{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              tercih ediyorsunuz?
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            İhtiyacınıza en uygun analiz modülünü seçin ve lokasyon potansiyelini keşfedin
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Compare Stores Card */}
          <div 
            className={`group relative cursor-pointer transition-all duration-500 ${
              selectedMode === 'compare' ? 'transform scale-105 -translate-y-2' : 'hover:scale-105 hover:-translate-y-2'
            }`}
            onClick={() => setSelectedMode(selectedMode === 'compare' ? null : 'compare')}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl transition-all duration-500 ${
              selectedMode === 'compare' 
                ? 'opacity-30 scale-110' 
                : 'opacity-0 group-hover:opacity-20 group-hover:scale-105'
            }`} />
            
            {/* Card Content */}
            <div className={`relative bg-white rounded-2xl p-8 shadow-lg border transition-all duration-500 ${
              selectedMode === 'compare' 
                ? 'border-blue-400 shadow-blue-200/50 ring-4 ring-blue-400 ring-opacity-60' 
                : 'border-blue-100 group-hover:border-blue-300 group-hover:shadow-2xl'
            }`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  selectedMode === 'compare' 
                    ? 'shadow-blue-400/50 scale-110' 
                    : 'group-hover:shadow-blue-300'
                }`}>
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Belirli Dükkanları Karşılaştır</h3>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Bildiğiniz spesifik adresleri karşılaştırın ve hangisinin daha avantajlı olduğunu öğrenin
              </p>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-lg">Bu modda neler var:</h4>
                <ul className="space-y-3">
                  {[
                    'Birden fazla adres karşılaştırması',
                    'Detaylı skor analizi',
                    'Rakip yoğunluğu karşılaştırması',
                    'Yaya erişimi değerlendirmesi'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {selectedMode === 'compare' && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Discover Opportunities Card */}
          <div 
            className={`group relative cursor-pointer transition-all duration-500 ${
              selectedMode === 'discover' ? 'transform scale-105 -translate-y-2' : 'hover:scale-105 hover:-translate-y-2'
            }`}
            onClick={() => setSelectedMode(selectedMode === 'discover' ? null : 'discover')}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl transition-all duration-500 ${
              selectedMode === 'discover' 
                ? 'opacity-30 scale-110' 
                : 'opacity-0 group-hover:opacity-20 group-hover:scale-105'
            }`} />
            
            {/* Card Content */}
            <div className={`relative bg-white rounded-2xl p-8 shadow-lg border transition-all duration-500 ${
              selectedMode === 'discover' 
                ? 'border-cyan-400 shadow-cyan-200/50 ring-4 ring-cyan-400 ring-opacity-60' 
                : 'border-blue-100 group-hover:border-cyan-300 group-hover:shadow-2xl'
            }`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  selectedMode === 'discover' 
                    ? 'shadow-cyan-400/50 scale-110' 
                    : 'group-hover:shadow-cyan-300'
                }`}>
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Yeni Fırsatları Keşfet</h3>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Belirli bir bölgedeki en potansiyelli lokasyonları keşfedin ve yeni fırsatları yakalayın
              </p>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-lg">Bu modda neler var:</h4>
                <ul className="space-y-3">
                  {[
                    'Bölgesel potansiyel haritası',
                    'En iyi 5 lokasyon önerisi',
                    'Mahalle bazında analiz',
                    'Yoğunluk haritası görselleştirme'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {selectedMode === 'discover' && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Sticky Analyze Button */}
      {selectedMode && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <button className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 overflow-hidden border-2 border-white/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
            <div className="relative flex items-center gap-3">
              <Play className="w-6 h-6 fill-current" />
              <span className="text-xl">
                {selectedMode === 'compare' ? 'Karşılaştırma' : 'Keşif'} Analizini Başlat
              </span>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
          </button>
        </div>
      )}

      {/* Footer Note */}
      <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-blue-100 max-w-xs">
        <h4 className="font-semibold text-gray-800 mb-1">Windows'u Etkinleştir</h4>
        <p className="text-sm text-gray-600">Windows'u etkinleştirmek için Ayarlar'a gidin</p>
      </div>
    </div>
  );
}

export default App;