# LocationIQ - Aktif Dosya Yapısı (Modern UI)

## Aktif Backend Dosyaları

### Ana Uygulama
- **`app.py`**: Flask ana uygulaması
  - Modern UI rotaları (`/new-ui`, `/landing`, `/business-selection`, `/mode-selection`, `/analysis-dashboard`, `/mod1-comparison`)
  - API endpoint'leri (`/api/compare-locations`, `/api/admin/testing/*`)
  - Veritabanı modelleri

### Core Backend Modülleri
- **`data_manager.py`**: Veri yönetimi ve önbellekleme
- **`scorer.py`**: Puanlama algoritması (V5.1 - Detaylı Raporlama Motoru)
- **`analyzer.py`**: Bölgesel analiz fonksiyonları (kullanım durumu belirsiz)
- **`optimizer.py`**: Parametre optimizasyon motoru (kullanım durumu belirsiz)

## Aktif Frontend Dosyaları

### Templates (Modern UI)
```
templates/
├── landing.html                    # Modern giriş sayfası
├── business_selection.html         # İşletme türü seçimi
├── mode_selection.html            # Analiz modu seçimi
├── analysis_dashboard.html        # Ana analiz dashboard
├── mod1_location_comparison.html  # ⭐ AKTİF KULLANILAN - Lokasyon karşılaştırma
└── new_ui/                        # Alternatif template dizini
    ├── landing.html
    ├── business_selection.html
    └── mode_selection.html
```

### JavaScript Dosyaları
```
static/
├── js/
│   ├── mod1_comparison.js         # ⭐ AKTİF - Lokasyon karşılaştırma logic
│   ├── components/
│   │   ├── DetailPanelManager.js  # Detail panel sistemi
│   │   └── CategoryExpander.js    # Kategori genişletme
│   └── turkey_geo_data.js         # Coğrafi veri yardımcıları
├── modern_dashboard.js            # Modern dashboard logic (kullanım belirsiz)
└── map.js                         # Temel harita işlevleri (kısmen kullanılıyor)
```

### CSS Dosyaları
```
static/css/
├── design_system.css              # ⭐ AKTİF - Ana tasarım sistemi
├── mod1_comparison.css            # ⭐ AKTİF - Karşılaştırma sayfası stilleri
└── animations.css                 # Animasyon stilleri
```

## Aktif API Endpoint'leri

### Modern UI API'leri
- **`POST /api/compare-locations`**: ⭐ Ana lokasyon karşılaştırma analizi
- **`POST /api/admin/testing/score-point`**: Nokta puanlama (admin panel için optimize edilmiş)

### Test ve Admin API'leri
- **`GET /api/admin/testing/test-points`**: Test noktalarını getir
- **`POST /api/admin/testing/test-points`**: Yeni test noktası oluştur
- **`PUT /api/admin/testing/test-points/<id>`**: Test noktası güncelle
- **`DELETE /api/admin/testing/test-points/<id>`**: Test noktası sil

## Veri Dosyaları

### Coğrafi Veriler
```
├── *_osm.csv                      # OpenStreetMap verileri (öncelikli)
├── *_temiz.csv                    # Temizlenmiş CSV verileri (fallback)
├── yenimahalle_grid.geojson       # Analiz grid noktaları
├── yenimahalle_demografi.csv      # Demografik veriler
└── mahalle_geojson/*.geojson      # Mahalle sınır verileri
```

### Veritabanı
- **`parameter_optimization.db`**: SQLite veritabanı
  - Kural, Grid, Karsilastirma, OptimizasyonLog tabloları
  - WeightConfig, ParameterConfig, AdvancedParameter tabloları

## Kullanılmayan/Eski Dosyalar (Temizlenecek)

### Eski Templates
- `templates/anasayfa.html` - Eski ana sayfa
- `templates/modern_dashboard.html` - Eski modern dashboard
- `templates/compare.html` - Eski karşılaştırma sayfası
- `templates/animation_demo.html` - Demo sayfası

### Potansiyel Eski JavaScript
- Bazı `static/map.js` fonksiyonları (modern UI'da kullanılmayan)
- Eski dashboard logic'leri

### Eski Rotalar (app.py'da temizlenecek)
```python
@app.route('/')  # anasayfa.html - ESKİ
@app.route('/modern')  # modern_dashboard.html - ESKİ
@app.route('/compare')  # compare.html - ESKİ
```

## Dosya Bağımlılıkları

### mod1_location_comparison.html Bağımlılıkları
```html
<!-- CSS -->
<link rel="stylesheet" href="static/css/design_system.css">
<link rel="stylesheet" href="static/css/animations.css">
<link rel="stylesheet" href="static/css/mod1_comparison.css">

<!-- JavaScript -->
<script src="static/js/turkey_geo_data.js"></script>
<script src="static/js/components/CategoryExpander.js"></script>
<script src="static/js/components/DetailPanelManager.js"></script>
<script src="static/js/mod1_comparison.js"></script>
```

### Backend Bağımlılıkları
```python
# app.py içinde
from data_manager import data_manager
from scorer import score_single_point
# analyzer.py ve optimizer.py kullanım durumu belirsiz
```

## Geliştirme Odak Noktaları

1. **Ana Aktif Sayfa**: `/mod1-comparison` - Lokasyon karşılaştırma
2. **Core Backend**: `scorer.py` - Puanlama algoritması
3. **Frontend Logic**: `mod1_comparison.js` - Karşılaştırma mantığı
4. **Styling**: `design_system.css` + `mod1_comparison.css`
5. **API**: `/api/compare-locations` endpoint'i

## Temizlik Önerileri

### Silinebilir Dosyalar
1. `templates/anasayfa.html`
2. `templates/modern_dashboard.html`
3. `templates/compare.html`
4. `templates/animation_demo.html`
5. `static/modern_dashboard.js` (eğer kullanılmıyorsa)
6. `static/map.js` içindeki kullanılmayan fonksiyonlar

### Silinebilir Rotalar (app.py)
```python
# Bu rotalar silinebilir
@app.route('/')
@app.route('/modern')
@app.route('/compare')
```

### Kontrol Edilmesi Gerekenler
- `analyzer.py` ve `optimizer.py` gerçekten kullanılıyor mu?
- `static/modern_dashboard.js` hangi sayfalarda kullanılıyor?
- `static/map.js` içindeki hangi fonksiyonlar hala gerekli?

Bu yapı, modern UI akışının tam olarak hangi dosyaların aktif olduğunu ve hangilerinin temizlenebileceğini gösterir.