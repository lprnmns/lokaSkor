# LocationIQ - Geliştirme Kılavuzu (Modern UI)

## Geliştirme Ortamı

### Gerekli Bağımlılıklar
```bash
# Python bağımlılıkları
pip install flask flask-sqlalchemy flask-admin
pip install geopandas pandas numpy scipy
pip install requests

# Frontend bağımlılıkları (CDN)
# Leaflet.js 1.9.4
# Chart.js (planlanan)
```

### Proje Başlatma
```bash
# Geliştirme sunucusu
python app.py

# Modern UI erişim
http://127.0.0.1:5000/new-ui
http://127.0.0.1:5000/mod1-comparison
```

## Kod Standartları

### Python (Backend)
```python
# Fonksiyon dokümantasyonu
def score_single_point(lat, lon, kategori, kurallar):
    """
    Tek nokta için detaylı skorlama yapar.
    
    Args:
        lat (float): Enlem koordinatı
        lon (float): Boylam koordinatı
        kategori (str): İşletme kategorisi
        kurallar (list): Skorlama kuralları
    
    Returns:
        dict: Detaylı puanlama sonucu
    """
```

### JavaScript (Frontend)
```javascript
// Class-based architecture
class LocationComparison {
    constructor(businessType) {
        this.businessType = businessType;
        this.locations = [];
        // ...
    }
    
    /**
     * Lokasyon karşılaştırması başlatır
     * @returns {Promise<void>}
     */
    async startComparison() {
        // Implementation
    }
}
```

### CSS (Styling)
```css
/* CSS Custom Properties kullanımı */
:root {
    --primary-color: #3b82f6;
    --spacing-md: 1rem;
}

/* BEM metodolojisi */
.location-card {
    /* Block */
}

.location-card__header {
    /* Element */
}

.location-card--highlighted {
    /* Modifier */
}
```

## Dosya Organizasyonu

### Backend Dosyaları
```
├── app.py                 # Ana Flask uygulaması
├── data_manager.py        # Veri yönetimi
├── scorer.py             # Puanlama algoritması
├── analyzer.py           # Bölgesel analiz (kullanım belirsiz)
└── optimizer.py          # Parametre optimizasyonu (kullanım belirsiz)
```

### Frontend Dosyaları
```
templates/
├── mod1_location_comparison.html  # Ana sayfa
├── landing.html                   # Giriş sayfası
├── business_selection.html        # İşletme seçimi
└── mode_selection.html           # Mod seçimi

static/
├── css/
│   ├── design_system.css         # Ana tasarım sistemi
│   ├── mod1_comparison.css       # Karşılaştırma stilleri
│   └── animations.css            # Animasyonlar
└── js/
    ├── mod1_comparison.js        # Ana karşılaştırma logic
    ├── components/
    │   ├── DetailPanelManager.js # Detail panel sistemi
    │   └── CategoryExpander.js   # Kategori genişletme
    └── turkey_geo_data.js        # Coğrafi yardımcılar
```

## Geliştirme Akışı

### 1. Yeni Özellik Ekleme
1. Backend'de gerekli API endpoint'i oluştur
2. Frontend'de ilgili JavaScript sınıfını güncelle
3. CSS stillerini ekle
4. Test et

### 2. Bug Fix Süreci
1. Sorunu reproduce et
2. Console log'larını kontrol et
3. Backend/Frontend'de debug yap
4. Fix'i uygula ve test et

### 3. Performance Optimizasyonu
1. Chrome DevTools ile analiz yap
2. Network tab'ında API çağrılarını kontrol et
3. Memory tab'ında memory leak'leri kontrol et
4. Lighthouse ile genel performansı ölç

## Test Stratejisi

### Backend Testing
```python
# scorer.py test örneği
def test_score_single_point():
    lat, lon = 39.9334, 32.8597
    kategori = 'eczane'
    kurallar = get_test_rules()
    
    result = score_single_point(lat, lon, kategori, kurallar)
    
    assert 'total_score' in result
    assert 0 <= result['total_score'] <= 100
    assert result['category'] in ['Mükemmel', 'Çok İyi', 'İyi', 'Orta', 'Uygun Değil']
```

### Frontend Testing
```javascript
// mod1_comparison.js test örneği
describe('LocationComparison', () => {
    let comparison;
    
    beforeEach(() => {
        comparison = new LocationComparison('eczane');
    });
    
    test('should add location correctly', () => {
        comparison.addLocationFromMap(39.9334, 32.8597);
        expect(comparison.locations.length).toBe(1);
    });
});
```

Bu kılavuz, modern UI odaklı geliştirme sürecini destekler.