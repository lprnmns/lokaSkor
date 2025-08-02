import React, { useState, useEffect } from 'react';
import { MapPin, ArrowLeft, TrendingUp, Users, Building2, Stethoscope, ShoppingBag, GraduationCap, Train, Car, Star, ChevronDown, ChevronUp, Info, ImageOff } from 'lucide-react';
import { TranslationProvider, useTranslation } from './contexts/TranslationContext';
import LanguageSelector from './components/LanguageSelector';

interface LocationData {
  id: number;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  totalScore: number;
  scores: {
    hospital: number;
    competitor: number;
    important: number;
    demographic: number;
  };
  details: {
    nearbyPlaces: {
      hospital: { name: string; distance: string; };
      metro: { name: string; distance: string; };
      pharmacy: { name: string; distance: string; };
    };
    demographic: {
      population: number;
      ageProfile: string;
      incomeLevel: string;
    };
    competitors: {
      name: string;
      distance: string;
      impact: number;
    }[];
    importantPlaces: {
      metro: { name: string; distance: string; score: number; }[];
      university: { name: string; distance: string; score: number; }[];
      mall: { name: string; distance: string; score: number; }[];
    };
  };
  streetViewImageUrl?: string;
}

const mockLocations: LocationData[] = [
  {
    id: 1,
    name: "Lokasyon A",
    address: "Demetevler Mahallesi, Ankara",
    coordinates: { lat: 39.968253, lng: 32.781993 },
    totalScore: 78,
    scores: {
      hospital: 85,
      competitor: 65,
      important: 82,
      demographic: 90
    },
    details: {
      nearbyPlaces: {
        hospital: { name: "Dr. Abdurrahman Yurtaslan Onkoloji Hastanesi", distance: "354m" },
        metro: { name: "Hastane Metro İstasyonu", distance: "161m" },
        pharmacy: { name: "Çalık Eczanesi", distance: "140m" }
      },
      demographic: {
        population: 29222,
        ageProfile: "Yaşlı Ağırlıklı",
        incomeLevel: "Orta-Düşük"
      },
      competitors: [
        { name: "Urankent Şeyma Eczanesi", distance: "632m", impact: -4.4 },
        { name: "Yurtseven Sami Eczanesi", distance: "699m", impact: -0.1 },
        { name: "Demetevler Eczanesi", distance: "571m", impact: -8.9 }
      ],
      importantPlaces: {
        metro: [
          { name: "Hastane Metro", distance: "161m", score: 20.0 }
        ],
        university: [],
        mall: [
          { name: "Karşıyaka AVM", distance: "441m", score: 7.4 }
        ]
      }
    },
    streetViewImageUrl: "https://example.com/street-view-a.jpg"
  },
  {
    id: 2,
    name: "Lokasyon B",
    address: "Çankaya Mahallesi, Ankara",
    coordinates: { lat: 39.918253, lng: 32.851993 },
    totalScore: 65,
    scores: {
      hospital: 45,
      competitor: 78,
      important: 70,
      demographic: 75
    },
    details: {
      nearbyPlaces: {
        hospital: { name: "Hacettepe Hastanesi", distance: "1.2km" },
        metro: { name: "Kızılay Metro İstasyonu", distance: "450m" },
        pharmacy: { name: "Merkez Eczanesi", distance: "220m" }
      },
      demographic: {
        population: 35400,
        ageProfile: "Genç Ağırlıklı",
        incomeLevel: "Yüksek"
      },
      competitors: [
        { name: "Çankaya Eczanesi", distance: "180m", impact: -12.5 },
        { name: "Merkez Eczanesi", distance: "220m", impact: -8.2 }
      ],
      importantPlaces: {
        metro: [
          { name: "Kızılay Metro", distance: "450m", score: 15.0 }
        ],
        university: [
          { name: "Hacettepe Üniversitesi", distance: "800m", score: 25.0 }
        ],
        mall: [
          { name: "Karum AVM", distance: "600m", score: 12.8 }
        ]
      }
    },
    streetViewImageUrl: "https://example.com/street-view-b.jpg"
  },
  {
    id: 3,
    name: "Lokasyon C",
    address: "Kavaklıdere Mahallesi, Ankara",
    coordinates: { lat: 39.908253, lng: 32.861993 },
    totalScore: 92,
    scores: {
      hospital: 70,
      competitor: 88,
      important: 95,
      demographic: 85
    },
    details: {
      nearbyPlaces: {
        hospital: { name: "Güven Hastanesi", distance: "680m" },
        metro: { name: "Kavaklıdere Metro İstasyonu", distance: "120m" },
        pharmacy: { name: "Sağlık Eczanesi", distance: "310m" }
      },
      demographic: {
        population: 42100,
        ageProfile: "Karma",
        incomeLevel: "Yüksek"
      },
      competitors: [
        { name: "Kavaklıdere Eczanesi", distance: "890m", impact: -2.1 }
      ],
      importantPlaces: {
        metro: [
          { name: "Kavaklıdere Metro", distance: "120m", score: 22.0 }
        ],
        university: [
          { name: "Bilkent Üniversitesi", distance: "2.1km", score: 8.0 }
        ],
        mall: [
          { name: "Tunalı AVM", distance: "300m", score: 18.5 },
          { name: "Karum AVM", distance: "1.1km", score: 8.2 }
        ]
      }
    },
    streetViewImageUrl: "https://example.com/street-view-c.jpg"
  }
];

// API'den veri çekme fonksiyonu
const fetchLocationData = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/compare-locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_type: 'eczane',
        locations: [
          {
            id: "1",
            name: "Hastane Metro",
            lat: 39.9334,
            lng: 32.8597,
            address: "Örnek Adres 1"
          },
          {
            id: "2",
            name: "Çamlıca Mahallesi",
            lat: 39.9200,
            lng: 32.8500,
            address: "Örnek Adres 2"
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('API çağrısı başarısız oldu');
    }
    
    const data = await response.json();
    return data.locations;
  } catch (error) {
    console.error('Veri çekme hatası:', error);
    return null;
  }
};

function App() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);
  const [realLocations, setRealLocations] = useState<LocationData[] | null>(null);
  const [loading, setLoading] = useState(false);
  
  // useTranslation hook'unu kullan
  const { t } = useTranslation();

  // Component yüklendiğinde API'den veri çek
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchLocationData();
      if (data) {
        // API'den gelen verileri doğru formata dönüştür
        const formattedData = data.map((location: any) => ({
          id: parseInt(location.id),
          name: location.name,
          address: location.address || "Adres bilgisi yok",
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          totalScore: location.totalScore,
          scores: {
            hospital: location.scores.hospital,
            competitor: location.scores.competitor,
            important: location.scores.important,
            demographic: location.scores.demographic
          },
          details: {
            nearbyPlaces: {
              hospital: {
                name: location.details.nearby_places.hospital?.name || "Hastane bulunamadı",
                distance: location.details.nearby_places.hospital?.distance || "Bilinmiyor"
              },
              metro: {
                name: location.details.nearby_places.metro?.name || "Metro istasyonu bulunamadı",
                distance: location.details.nearby_places.metro?.distance || "Bilinmiyor"
              },
              pharmacy: {
                name: location.details.nearby_places.pharmacy?.name || "Eczane bulunamadı",
                distance: location.details.nearby_places.pharmacy?.distance || "Bilinmiyor"
              }
            },
            demographic: {
              population: location.details.demographic?.population || 0,
              ageProfile: location.details.demographic?.age_profile || "Bilinmiyor",
              incomeLevel: location.details.demographic?.income_level || "Bilinmiyor"
            },
            competitors: location.details.competitors || [],
            importantPlaces: {
              metro: [],
              university: [],
              mall: []
            }
          },
          streetViewImageUrl: location.streetViewImageUrl
        }));
        
        setRealLocations(formattedData);
      }
      setLoading(false);
    };
    
    loadData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDynamicBorderColor = (index: number) => {
    const borderColors = [
      'border-blue-400',
      'border-blue-500', 
      'border-blue-600',
      'border-blue-700',
      'border-blue-800'
    ];
    return borderColors[index % borderColors.length];
  };

  const ScoreCard = ({ icon: Icon, title, score, maxScore = 100, color }: any) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getScoreColor(score)}`}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getScoreBarColor(score)} transition-all duration-500`}
          style={{ width: `${(score / maxScore) * 100}%` }}
        />
      </div>
    </div>
  );

  const DetailModal = ({ location, onClose }: { location: LocationData; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
              <p className="text-gray-600">{location.address}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Yakın Yerler */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              {t('comparison.nearbyPlaces')}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-red-600" />
                  <span className="text-sm">{location.details.nearbyPlaces.hospital.name}</span>
                </div>
                <span className="text-sm font-medium text-red-600">{location.details.nearbyPlaces.hospital.distance}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Train className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{location.details.nearbyPlaces.metro.name}</span>
                </div>
                <span className="text-sm font-medium text-blue-600">{location.details.nearbyPlaces.metro.distance}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{location.details.nearbyPlaces.pharmacy.name}</span>
                </div>
                <span className="text-sm font-medium text-green-600">{location.details.nearbyPlaces.pharmacy.distance}</span>
              </div>
            </div>
          </div>

          {/* Demografi */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              {t('comparison.demographics')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{location.details.demographic.population.toLocaleString()}</div>
                <div className="text-xs text-purple-600">Nüfus</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-sm font-medium text-purple-600">{location.details.demographic.ageProfile}</div>
                <div className="text-xs text-purple-600">Yaş Profili</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-sm font-medium text-purple-600">{location.details.demographic.incomeLevel}</div>
                <div className="text-xs text-purple-600">Gelir Düzeyi</div>
              </div>
            </div>
          </div>

          {/* Rekabet Analizi */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              {t('comparison.competitorAnalysis')}
            </h4>
            <div className="space-y-2">
              {location.details.competitors.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{competitor.name}</div>
                    <div className="text-xs text-gray-600">{competitor.distance}</div>
                  </div>
                  <span className={`text-sm font-medium ${competitor.impact < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {competitor.impact > 0 ? '+' : ''}{competitor.impact}/100
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Önemli Yerler */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-teal-600" />
              {t('comparison.importantPlaces')}
            </h4>
            <div className="space-y-3">
              {location.details.importantPlaces.metro.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Metro İstasyonları</div>
                  {location.details.importantPlaces.metro.map((metro, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Train className="w-3 h-3 text-blue-600" />
                        <span className="text-sm">{metro.name}</span>
                        <span className="text-xs text-gray-500">{metro.distance}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">+{metro.score}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {location.details.importantPlaces.university.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Üniversiteler</div>
                  {location.details.importantPlaces.university.map((uni, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3 h-3 text-indigo-600" />
                        <span className="text-sm">{uni.name}</span>
                        <span className="text-xs text-gray-500">{uni.distance}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">+{uni.score}</span>
                    </div>
                  ))}
                </div>
              )}

              {location.details.importantPlaces.mall.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Alışveriş Merkezleri</div>
                  {location.details.importantPlaces.mall.map((mall, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-teal-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3 h-3 text-teal-600" />
                        <span className="text-sm">{mall.name}</span>
                        <span className="text-xs text-gray-500">{mall.distance}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">+{mall.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TranslationProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <LanguageSelector />
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">{t('app.back')}</span>
                </button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">{t('app.title')}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  {t('app.watchDemo')}
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {t('app.getReport')}
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('app.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('app.description')}
          </p>
        </div>

        {/* Analysis Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(realLocations || mockLocations).map((location, index) => (
            <div key={location.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-2xl hover:scale-150 hover:z-50 transition-all duration-700 border-3 ${getDynamicBorderColor(index)} hover:border-opacity-100 relative group`}>
              {/* Location Header */}
              <div className="p-6 border-b border-gray-100 border border-gray-800 border-opacity-20 rounded-t-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-600">{location.address}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(location.totalScore).split(' ')[0]}`}>
                      {location.totalScore}
                    </div>
                    <div className="text-xs text-gray-500">/ 100</div>
                  </div>
                </div>
                
                {/* Overall Score Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full ${getScoreBarColor(location.totalScore)} transition-all duration-700`}
                    style={{ width: `${location.totalScore}%` }}
                  />
                </div>
                
                {index === 0 && location.totalScore === Math.max(...mockLocations.map(l => l.totalScore)) && (
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium mt-2">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{t('comparison.bestOption')}</span>
                  </div>
                )}
              </div>

              {/* Score Breakdown */}
              <div className="p-6 space-y-4">
                <ScoreCard 
                  icon={Stethoscope} 
                  title="Hastane Yakınlığı" 
                  score={location.scores.hospital} 
                  color="text-red-600"
                />
                <ScoreCard 
                  icon={Building2} 
                  title="Rekabet Analizi" 
                  score={location.scores.competitor} 
                  color="text-orange-600"
                />
                <ScoreCard 
                  icon={Star} 
                  title="Önemli Yerler" 
                  score={location.scores.important} 
                  color="text-teal-600"
                />
                <ScoreCard 
                  icon={Users} 
                  title="Demografi" 
                  score={location.scores.demographic} 
                  color="text-purple-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 space-y-3">
                {/* Street View Image */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t('comparison.streetView')}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{t('shop.name')}</span>
                    </div>
                  </div>
                  {location.streetViewImageUrl ? (
                    <img
                      src={location.streetViewImageUrl}
                      alt="Street View"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-200 rounded-lg flex flex-col items-center justify-center">
                      <ImageOff className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-gray-500">{t('comparison.streetViewNotAvailable')}</span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setSelectedLocation(location)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  {t('comparison.detailedAnalysis')}
                </button>
                <button className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('app.getReport')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className={`mt-12 bg-white rounded-2xl p-8 border-4 ${getDynamicBorderColor(0)} shadow-lg hover:shadow-xl transition-all duration-300`}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('comparison.summary')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {Math.max(...(realLocations || mockLocations).map(l => l.totalScore))}
              </div>
              <div className="text-sm text-green-600">{t('comparison.highestScore')}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {Math.round((realLocations || mockLocations).reduce((sum, l) => sum + l.totalScore, 0) / (realLocations || mockLocations).length)}
              </div>
              <div className="text-sm text-blue-600">{t('comparison.averageScore')}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {(realLocations || mockLocations).length}
              </div>
              <div className="text-sm text-purple-600">{t('comparison.analyzedLocations')}</div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedLocation && (
        <DetailModal 
          location={selectedLocation} 
          onClose={() => setSelectedLocation(null)} 
        />
      )}
    </div>
  );
}

export default App;