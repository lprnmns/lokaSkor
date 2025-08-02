# LocationIQ - Modern UI Kullanıcı Akışı

## Kullanıcı Yolculuğu (User Journey)

### 1. Giriş Noktası: `/new-ui` veya `/landing`
**Template**: `templates/landing.html`
**Amaç**: Kullanıcıyı karşılama ve sisteme giriş
**Özellikler**:
- Modern tasarım ile karşılama
- Platform tanıtımı
- "Başla" butonu ile `/business-selection`'a yönlendirme

### 2. İşletme Türü Seçimi: `/business-selection`
**Template**: `templates/business_selection.html`
**Amaç**: Analiz yapılacak işletme türünü belirleme
**Seçenekler**:
- ☕ Cafe
- 🍽️ Restoran
- 🛒 Market
- 💊 Eczane
- 🍞 Fırın
- 🛍️ AVM

**Çıktı**: `business_type` parametresi ile `/mode-selection`'a geçiş

### 3. Analiz Modu Seçimi: `/mode-selection`
**Template**: `templates/mode_selection.html`
**Amaç**: Hangi tür analiz yapılacağını belirleme
**Seçenekler**:
- 📍 **Belirli Dükkanları Karşılaştır** (Mod1) → `/mod1-comparison`
- 🏘️ **Bölge Analizi** (Gelecek)
- 🗺️ **Isı Haritası** (Gelecek)

**Aktif Seçenek**: Sadece "Belirli Dükkanları Karşılaştır" çalışıyor

### 4. ⭐ Ana Sayfa: `/mod1-comparison`
**Template**: `templates/mod1_location_comparison.html`
**JavaScript**: `static/js/mod1_comparison.js`
**CSS**: `static/css/mod1_comparison.css`
**API**: `POST /api/compare-locations`

## Ana Sayfa Detaylı Akış (mod1-comparison)

### Sayfa Yapısı
```html
<div class="comparison-container">
  <!-- Header -->
  <header class="comparison-header">
    <div class="logo-section">LocationIQ</div>
    <button class="back-button">Geri</button>
  </header>
  
  <!-- Main Layout -->
  <div class="main-layout">
    <!-- Sidebar (Sol) -->
    <div class="location-selector-sidebar">
      <div class="search-section">
        <form class="smart-search-bar">
          <input type="text" placeholder="Adres arayın...">
        </form>
      </div>
      <div class="selected-locations-section">
        <h3>Seçilen Konumlar (0/3)</h3>
        <div id="selectedLocationsList"></div>
      </div>
      <div class="sidebar-footer">
        <button class="comparison-button">Karşılaştırmaya Başla</button>
      </div>
    </div>
    
    <!-- Map Container (Sağ) -->
    <main class="map-container">
      <div id="comparisonMap"></div>
    </main>
  </div>
  
  <!-- Results Section (Dinamik) -->
  <section id="comparisonResults" style="display: none;">
    <!-- Sonuçlar buraya yüklenir -->
  </section>
</div>
```

### Kullanıcı Etkileşim Akışı

#### 1. Lokasyon Ekleme
**Yöntem 1: Harita Tıklama**
```javascript
// map.on('click') event handler
this.map.on('click', (e) => {
    this.addLocationFromMap(e.latlng.lat, e.latlng.lng);
});
```

**Yöntem 2: Arama**
```javascript
// SearchManager sınıfı ile
this.searchManager.search(query, callback);
// Nominatim API kullanılıyor
```

#### 2. Lokasyon Yönetimi
- **Maksimum 3 lokasyon** eklenebilir
- Her lokasyon için **renk kodlu marker** (kırmızı, mavi, yeşil)
- **Silme butonu** ile lokasyon kaldırma
- **Hover efektleri** ile harita-sidebar senkronizasyonu

#### 3. Karşılaştırma Başlatma
**Koşul**: En az 2 lokasyon seçili olmalı
**Aksiyon**: "Karşılaştırmaya Başla" butonuna tıklama
**API Çağrısı**:
```javascript
fetch('/api/compare-locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        locations: this.locations,
        business_type: this.businessType
    })
});
```

### API Response Yapısı

#### `/api/compare-locations` Response
```json
{
    "success": true,
    "locations": [
        {
            "id": "loc_1",
            "name": "Lokasyon 1",
            "lat": 39.9334,
            "lng": 32.8597,
            "address": "Adres bilgisi",
            "totalScore": 75.3,
            "rank": 1,
            "scores": {
                "hospital": 85.2,
                "competitor": 65.8,
                "demographics": 70.1,
                "important": 80.5
            },
            "details": {
                "nearby_places": {
                    "hospital": {
                        "name": "Ankara Şehir Hastanesi",
                        "distance": "850m"
                    },
                    "metro": {
                        "name": "Kızılay Metro",
                        "distance": "1.2km"
                    }
                },
                "demographic": {
                    "population": 25000,
                    "age_profile": "Karma",
                    "income_level": "Orta"
                },
                "competitors": [
                    {
                        "name": "Rakip Eczane",
                        "distance": "300m",
                        "impact_score": -15.2
                    }
                ]
            }
        }
    ],
    "business_type": "eczane",
    "analysis_date": "2024-01-15T10:30:00"
}
```

### Sonuç Gösterimi

#### Sonuç Kartları
Her lokasyon için:
- **Sıralama badge'i** (1., 2., 3.)
- **Toplam skor** (0-100 arası)
- **Metrik breakdown** (4 ana kategori)
- **Detay panelleri** (genişletilebilir)

#### İnteraktif Detaylar
**DetailPanelManager.js** ile:
- **Hastane Yakınlığı**: En yakın hastane, mesafe, erişilebilirlik
- **Rekabet Analizi**: Yakın rakipler, etki skorları, mesafeler
- **Demografi**: Nüfus, yaş profili, gelir düzeyi
- **Önemli Yerler**: Metro, üniversite, AVM yakınlığı

### Teknik Detaylar

#### Frontend Sınıfları
```javascript
// Ana sınıf
class LocationComparison {
    constructor(businessType)
    addLocationFromMap(lat, lng)
    startComparison()
    showResults(results)
}

// Arama yönetimi
class SearchManager {
    search(query, callback)
    performSearch(query, callback)
}

// Detay panelleri
class DetailPanelManager {
    togglePanel(categoryType, locationId)
    loadPanelData(categoryType, locationData)
}
```

#### CSS Sınıf Yapısı
```css
/* Ana container */
.comparison-container { }

/* Sidebar */
.location-selector-sidebar { }
.selected-locations-section { }
.location-card { }

/* Harita */
.map-container { }
.comparison-map { }

/* Sonuçlar */
.comparison-results { }
.result-card { }
.metric-accordion-item { }
```

### Performans Optimizasyonları

#### Frontend
- **Debounced search**: 300ms gecikme
- **Event delegation**: Dinamik elementler için
- **Lazy loading**: Detay panelleri sadece tıklandığında yüklenir
- **Memory management**: Event listener temizleme

#### Backend
- **KDTree**: O(log n) mesafe hesaplamaları
- **Caching**: DataManager'da tüm veriler RAM'de
- **Batch processing**: Çoklu lokasyon analizi tek seferde

### Hata Yönetimi

#### Frontend Hata Durumları
- **Ağ bağlantısı**: Timeout ve retry mekanizması
- **API hataları**: Kullanıcı dostu mesajlar
- **Validasyon**: Koordinat ve input kontrolü

#### Backend Hata Durumları
- **Veri eksikliği**: Fallback değerler
- **Hesaplama hataları**: Graceful degradation
- **Database hataları**: Error logging

Bu akış, kullanıcının `/new-ui`'dan başlayarak `/mod1-comparison`'da lokasyon karşılaştırması yapmasına kadar olan tüm süreci kapsar.