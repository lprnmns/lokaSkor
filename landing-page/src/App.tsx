import React, { useEffect, useRef, useContext } from 'react';
import { MapPin, BarChart3, Globe, ArrowRight, Play, Shield, Zap, Users, Building, TrendingUp, Map } from 'lucide-react';
import LanguageSelector from './components/LanguageSelector';
import { TranslationContext } from './contexts/TranslationContext';

function App() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { t } = useContext(TranslationContext);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // 3D location-related objects rotation based on scroll
      const mapPins = document.querySelectorAll('.floating-map-pin');
      mapPins.forEach((pin, index) => {
        const element = pin as HTMLElement;
        const speed = 0.3 + index * 0.1;
        element.style.transform = `
          translateY(${Math.sin(scrollY * 0.008 + index) * 15}px) 
          rotateY(${scrollY * speed * 0.1}deg) 
          rotateZ(${Math.sin(scrollY * 0.01 + index) * 5}deg)
        `;
      });

      // Floating buildings
      const buildings = document.querySelectorAll('.floating-building');
      buildings.forEach((building, index) => {
        const element = building as HTMLElement;
        const speed = 0.2 + index * 0.05;
        element.style.transform = `
          translateY(${Math.cos(scrollY * 0.006 + index * 2) * 20}px) 
          translateX(${Math.sin(scrollY * 0.004 + index) * 10}px)
          rotateX(${scrollY * speed * 0.05}deg)
        `;
      });

      // Chart elements
      const charts = document.querySelectorAll('.floating-chart');
      charts.forEach((chart, index) => {
        const element = chart as HTMLElement;
        element.style.transform = `
          translateY(${Math.sin(scrollY * 0.01 + index * 1.5) * 25}px) 
          rotateZ(${scrollY * 0.05 + index * 10}deg)
          scale(${1 + Math.sin(scrollY * 0.008 + index) * 0.05})
        `;
      });

      // Subtle parallax effect for hero section
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden relative">
      {/* Animated Background Elements - Location Related */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Map Pins */}
        <div className="floating-map-pin absolute top-20 left-16 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg opacity-20">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="floating-map-pin absolute top-40 right-24 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg opacity-25">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="floating-map-pin absolute top-60 left-1/4 w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg opacity-15">
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <div className="floating-map-pin absolute bottom-40 right-16 w-11 h-11 bg-purple-500 rounded-full flex items-center justify-center shadow-lg opacity-20">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        
        {/* Floating Buildings */}
        <div className="floating-building absolute top-32 right-1/3 w-16 h-20 bg-gradient-to-t from-gray-400 to-gray-300 opacity-10 shadow-lg" style={{clipPath: 'polygon(0 100%, 0 20%, 50% 0%, 100% 20%, 100% 100%)'}}></div>
        <div className="floating-building absolute bottom-60 left-1/3 w-20 h-24 bg-gradient-to-t from-blue-400 to-blue-300 opacity-15 shadow-lg" style={{clipPath: 'polygon(0 100%, 0 25%, 50% 0%, 100% 25%, 100% 100%)'}}></div>
        <div className="floating-building absolute top-1/2 right-20 w-12 h-16 bg-gradient-to-t from-indigo-400 to-indigo-300 opacity-12 shadow-lg" style={{clipPath: 'polygon(0 100%, 0 30%, 50% 0%, 100% 30%, 100% 100%)'}}></div>
        
        {/* Floating Chart Elements */}
        <div className="floating-chart absolute top-24 left-1/3 w-16 h-12 bg-gradient-to-r from-green-400 to-emerald-400 opacity-10 rounded-lg flex items-end justify-center space-x-1 p-2">
          <div className="w-2 h-4 bg-white rounded-sm"></div>
          <div className="w-2 h-6 bg-white rounded-sm"></div>
          <div className="w-2 h-3 bg-white rounded-sm"></div>
          <div className="w-2 h-8 bg-white rounded-sm"></div>
        </div>
        <div className="floating-chart absolute bottom-32 left-20 w-14 h-14 bg-gradient-to-br from-orange-400 to-red-400 opacity-15 rounded-full flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">LocationIQ</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">{t('navigation.features')}</a>
              <a href="#demo" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">{t('navigation.demo')}</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">{t('navigation.contact')}</a>
              <div className="flex items-center space-x-4">
                <button className="text-blue-600 hover:text-blue-700 transition-colors font-medium underline">{t('navigation.adminPanel')}</button>
                <button className="text-blue-600 hover:text-blue-700 transition-colors font-medium underline">{t('navigation.oldVersion')}</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8 shadow-sm">
              <Globe className="w-4 h-4 mr-2" />
              {t('hero.tagline')}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              {t('hero.title')}
              <span className="block text-blue-600 mt-2">
                {t('hero.subtitle')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              {t('hero.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button className="group bg-blue-600 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <ArrowRight className="mr-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                {t('hero.startAnalysis')}
              </button>
              
              <button className="group flex items-center text-gray-700 hover:text-gray-900 px-8 py-5 rounded-xl text-lg font-semibold transition-all duration-300 border border-gray-300 hover:border-gray-400 bg-white/50 backdrop-blur-sm hover:bg-white/70">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform border border-blue-200">
                  <Play className="w-5 h-5 ml-1 text-blue-600" />
                </div>
                {t('hero.watchDemo')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('features.description')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-10 h-10 text-blue-600" />,
                title: t('features.detailedAnalysis.title'),
                description: t('features.detailedAnalysis.description'),
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200"
              },
              {
                icon: <Zap className="w-10 h-10 text-purple-600" />,
                title: t('features.realTimeData.title'),
                description: t('features.realTimeData.description'),
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200"
              },
              {
                icon: <Shield className="w-10 h-10 text-cyan-600" />,
                title: t('features.securePlatform.title'),
                description: t('features.securePlatform.description'),
                bgColor: "bg-cyan-50",
                borderColor: "border-cyan-200"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`group p-8 rounded-2xl ${feature.bgColor} border ${feature.borderColor} hover:shadow-lg transition-all duration-500 hover:transform hover:-translate-y-2 bg-white/50 backdrop-blur-sm`}
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md border border-gray-100">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-3xl p-12 shadow-lg">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { number: "10,000+", label: t('stats.locations') },
                { number: "500+", label: t('stats.customers') },
                { number: "99.9%", label: t('stats.uptime') },
                { number: "24/7", label: t('stats.support') }
              ].map((stat, index) => (
                <div key={index} className="group">
                  <div className="text-4xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 shadow-2xl text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                {t('cta.tryFree')}
              </button>
              <button className="border-2 border-white/30 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                {t('cta.moreInfo')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">LocationIQ</span>
              </div>
              <p className="text-gray-600">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">{t('footer.product')}</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.features')}</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.pricing')}</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.api')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">{t('footer.company')}</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.blog')}</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.careers')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.helpCenter')}</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.contact')}</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">{t('footer.status')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; 2024 LocationIQ. {t('footer.copyright')}</p>
            <div className="mt-4 text-sm">
              <span className="text-gray-400">Windows'u Etkinleştir</span>
              <br />
              <span className="text-gray-400 text-xs">Windows'u etkinleştirmek için Ayarlar'a gidin.</span>
            </div>
          </div>
        </div>
      </footer>
      <LanguageSelector />
    </div>
  );
}

export default App;