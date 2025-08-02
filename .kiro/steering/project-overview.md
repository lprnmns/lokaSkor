# LocationIQ - Modern UI Akıllı Lokasyon Analiz Platformu

## Proje Genel Bakış

LocationIQ, işletmeler için optimal lokasyon seçimi yapan gelişmiş bir coğrafi analiz platformudur. Proje, Flask tabanlı backend ve modern JavaScript frontend ile geliştirilmiş, Türkiye'nin Ankara ili Yenimahalle ilçesi odaklı bir lokasyon zekası sistemidir.

**⚠️ ÖNEMLİ**: Bu dokümantasyon sadece `/new-ui` rotası ile başlayan modern UI akışına odaklanmaktadır. Eski dosyalar ve kullanılmayan özellikler dahil edilmemiştir.

## Modern UI Akışı

### Aktif Rotalar
1. **`/new-ui` veya `/landing`**: Modern giriş sayfası
2. **`/business-selection`**: İşletme türü seçimi
3. **`/mode-selection`**: Analiz modu seçimi
4. **`/analysis-dashboard`**: Ana analiz dashboard
5. **`/mod1-comparison`**: ⭐ **ANA AKTİF SAYFA** - Lokasyon karşılaştırma

### Ana Kullanım Senaryosu
Kullanıcılar `/new-ui` → `/business-selection` → `/mode-selection` → `/mod1-comparison` akışını takip ederek lokasyon karşılaştırması yaparlar.

## Teknik Mimari (Sadece Aktif Dosyalar)

### Backend Mimarisi (Python/Flask)
```
app.py (Ana uygulama - Modern UI rotaları)
├── data_manager.py (Veri yönetimi ve KDTree)
├── scorer.py (V5.1 - Detaylı puanlama algoritması)
├── analyzer.py (Bölgesel analiz - kullanım durumu belirsiz)
└── optimizer.py (Parametre optimizasyonu - kullanım durumu belirsiz)
```

### Frontend Mimarisi (Sadece Aktif)
```
templates/
├── landing.html (Modern giriş)
├── business_selection.html (İşletme seçimi)
├── mode_selection.html (Mod seçimi)
├── analysis_dashboard.html (Ana dashboard)
└── mod1_location_comparison.html ⭐ (ANA SAYFA)

static/
├── css/
│   ├── design_system.css ⭐ (Ana tasarım sistemi)
│   ├── mod1_comparison.css ⭐ (Karşılaştırma stilleri)
│   └── animations.css (Animasyonlar)
└── js/
    ├── mod1_comparison.js ⭐ (Ana karşılaştırma logic)
    ├── components/
    │   ├── DetailPanelManager.js (Detail panel sistemi)
    │   └── CategoryExpander.js (Kategori genişletme)
    └── turkey_geo_data.js (Coğrafi yardımcılar)
```

### Aktif API Endpoint'leri
- **`POST /api/compare-locations`**: ⭐ Ana lokasyon karşılaştırma API
- **`POST /api/admin/testing/score-point`**: Nokta puanlama (modern dashboard için)

## Veri Kaynakları

### Coğrafi Veriler (Aktif)
- **OpenStreetMap (OSM)**: `*_osm.csv` dosyaları (öncelikli)
- **Fallback CSV**: `*_temiz.csv` dosyaları (OSM yoksa)
- **Grid Noktaları**: `yenimahalle_grid.geojson`
- **Demografik Veri**: `yenimahalle_demografi.csv`
- **Mahalle Sınırları**: `mahalle_geojson/*.geojson`

### Veritabanı Tabloları (Aktif)
- **Kural**: Skorlama parametreleri
- **Grid**: Analiz noktaları
- **Karsilastirma**: Kullanıcı karşılaştırmaları
- **WeightConfig**: Kategori ağırlıkları
- **ParameterConfig**: Parametre konfigürasyonları

## Ana Özellik: Lokasyon Karşılaştırma (mod1-comparison)

### Temel İşlevsellik
1. **Lokasyon Ekleme**: Harita tıklama veya arama ile 2-3 lokasyon seçimi
2. **Karşılaştırmalı Analiz**: Her lokasyon için detaylı puanlama
3. **Metrik Breakdown**: Hastane, rekabet, demografi, önemli yerler analizi
4. **İnteraktif Sonuçlar**: Detay panelleri ile genişletilebilir bilgiler

### Puanlama Algoritması (scorer.py)
```python
# Ana puanlama fonksiyonu
def score_single_point(lat, lon, kategori, kurallar):
    # 1. Mesafe bazlı skorlama (logaritmik azalma)
    # 2. Demografik uyumluluk
    # 3. Rekabet analizi (negatif etki)
    # 4. Önemli yerler yakınlığı
    # 5. Ağırlıklı toplam hesaplama
```

### Ağırlık Sistemi (Dinamik)
- **Hastane Yakınlığı**: %30 (varsayılan)
- **Rekabet Durumu**: %30 (varsayılan)
- **Önemli Yerler**: %30 (varsayılan)
- **Demografi**: %10 (varsayılan)

*Ağırlıklar WeightConfig tablosundan dinamik olarak alınır*

## Performans Optimizasyonları

### Backend
- **KDTree**: Hızlı mesafe hesaplamaları
- **Hafıza Önbellekleme**: DataManager sınıfında tüm veriler RAM'de
- **Lazy Loading**: OSM verileri önce kontrol edilir, yoksa CSV fallback

### Frontend
- **Debounced Search**: 300ms gecikme ile arama
- **GPU Animasyonlar**: CSS transform ve opacity kullanımı
- **Virtual Scrolling**: Büyük listeler için (planlanan)

## Temizlenecek Eski Dosyalar

### Kullanılmayan Templates
- `templates/anasayfa.html` (eski ana sayfa)
- `templates/modern_dashboard.html` (eski dashboard)
- `templates/compare.html` (eski karşılaştırma)
- `templates/animation_demo.html` (demo)

### Kullanılmayan JavaScript
- `static/map.js` (bazı fonksiyonlar modern UI'da kullanılmıyor)
- Eski dashboard logic'leri

### Kullanılmayan Rotalar
- `/` (anasayfa.html)
- `/modern` (modern_dashboard.html)
- `/compare` (compare.html)

## Geliştirme Öncelikleri

1. **Ana Odak**: `/mod1-comparison` sayfası ve `mod1_comparison.js`
2. **Core Backend**: `scorer.py` puanlama algoritması
3. **API Endpoint**: `/api/compare-locations`
4. **Styling**: `design_system.css` + `mod1_comparison.css`
5. **Detail System**: DetailPanelManager.js geliştirmeleri

Bu platform, modern UI akışı ile veri odaklı lokasyon seçimi yaparak işletmelerin başarı oranlarını artırmayı hedeflemektedir.