# LocationIQ - Puanlama Algoritması Detaylı Analizi

## Puanlama Sistemi Genel Bakış

LocationIQ'nun kalbi olan puanlama algoritması `scorer.py` dosyasında `score_single_point()` fonksiyonu ile implement edilmiştir. Bu algoritma, bir lokasyonun işletme açmak için ne kadar uygun olduğunu 0-100 arası bir skorla değerlendirir.

## Ana Puanlama Fonksiyonu

### Fonksiyon İmzası
```python
def score_single_point(lat, lon, kategori, kurallar):
    """
    Verilen tek bir nokta için tüm kuralları ve çoklu etkenleri uygulayarak 
    detaylı skorlama yapar.
    
    Args:
        lat (float): Enlem koordinatı
        lon (float): Boylam koordinatı  
        kategori (str): İşletme kategorisi (eczane, cafe, market vb.)
        kurallar (list): Veritabanından gelen skorlama kuralları
    
    Returns:
        dict: Detaylı puanlama sonucu
    """
```

### Algoritma Adımları

#### 1. Koordinat Dönüşümü
```python
# WGS84'den UTM'ye dönüşüm (metre cinsinden hesaplama için)
point_wgs84 = gpd.GeoDataFrame(geometry=[Point(lon, lat)], crs="EPSG:4326")
point_utm = point_wgs84.to_crs(epsg=32636).iloc[0].geometry
point_coords = (point_utm.x, point_utm.y)
```

#### 2. Mahalle Tespiti ve Demografik Veri Alma
```python
# Spatial join ile mahalle belirleme
mahalle_bilgisi = gpd.sjoin(point_wgs84, data_manager.neighborhood_polygons, 
                           how='left', predicate='within')
```

## Puanlama Bileşenleri

### 1. Mesafe Bazlı Puanlama (Logaritmik Azalma)

#### Logaritmik Skor Fonksiyonu
```python
def logarithmic_score(distance, max_puan, etki_mesafesi, katsayi):
    if distance >= etki_mesafesi or max_puan == 0:
        return 0
    
    if distance <= 10:  # Minimum mesafe 10m
        distance = 10
    
    # Logaritmik azalma formülü
    log_factor = math.log(etki_mesafesi / distance) / math.log(katsayi)
    score = max_puan * max(0, min(1, log_factor))
    return score
```

#### Mesafe Etkisi Örnekleri
- **10m mesafede**: Maksimum puan
- **100m mesafede**: ~%80 puan
- **500m mesafede**: ~%40 puan  
- **1000m mesafede**: ~%10 puan
- **Etki mesafesi dışında**: 0 puan

### 2. POI (Point of Interest) Puanlaması

#### Hastane Puanlaması
```python
# Hastane yakınlığı pozitif etki
for hastane in nearby_hospitals:
    distance = calculate_distance(point_coords, hastane_coords)
    puan = logarithmic_score(distance, max_puan=50, etki_mesafesi=2000, katsayi=2.0)
    total_score += puan
```

#### Rakip Analizi (Negatif Etki)
```python
# Rakip işletmeler negatif etki yapar
for rakip in nearby_competitors:
    distance = calculate_distance(point_coords, rakip_coords)
    puan = logarithmic_score(distance, max_puan=30, etki_mesafesi=1000, katsayi=2.0)
    total_score -= abs(puan)  # Negatif etki
```

### 3. Demografik Puanlama

#### Nüfus Yoğunluğu
```python
# Nüfus yoğunluğu kategorileri
if mahalle_nufus >= 30000:
    nufus_yogunlugu_puan = 40.0  # Çok yüksek
elif mahalle_nufus >= 15000:
    nufus_yogunlugu_puan = 30.0  # Yüksek
elif mahalle_nufus >= 5000:
    nufus_yogunlugu_puan = 20.0  # Orta
else:
    nufus_yogunlugu_puan = 10.0  # Düşük
```

#### İşletme-Demografi Uyumu
```python
# Eczane için yaş profili uyumu
if kategori == 'eczane':
    if 'yaşlı' in yas_profili.lower():
        yas_puan = 30.0  # Yaşlı ağırlıklı eczane için çok iyi
    elif 'karma' in yas_profili.lower():
        yas_puan = 15.0  # Karma orta iyi
    elif 'genç' in yas_profili.lower():
        yas_puan = -10.0  # Genç ağırlıklı eczane için kötü
```

## Ağırlık Sistemi (Dinamik)

### Varsayılan Ağırlıklar
```python
hospital_weight = 0.30      # %30
competitor_weight = 0.30    # %30  
demographics_weight = 0.10  # %10
important_places_weight = 0.30  # %30
```

### Dinamik Ağırlık Alma
```python
# WeightConfig tablosundan kategori bazlı ağırlıklar
try:
    weight_config = WeightConfig.query.filter_by(category=kategori).first()
    if weight_config:
        hospital_weight = weight_config.hospital_weight
        competitor_weight = weight_config.competitor_weight
        # ... diğer ağırlıklar
except Exception as e:
    # Hata durumunda varsayılan ağırlıklar kullanılır
    pass
```

## Final Skor Hesaplama

### Normalize Edilmiş Skorlar (0-100)
```python
# Her bileşen 0-100 arası normalize edilir
hospital_score = normalize_score(hospital_raw, 0, 100)
competitor_score = 100 - normalize_score(abs(competitor_raw), 0, 1000)  # Ters çevrilir
demo_score = normalize_score(demo_raw, 0, 100)
important_score = normalize_score(important_raw, 0, 100)
```

### Ağırlıklı Toplam
```python
final_total_score = (
    hospital_score * hospital_weight +           # %30
    competitor_score * competitor_weight +       # %30  
    demo_score * demographics_weight +           # %10
    important_score * important_places_weight    # %30
)
```

### Kategori Belirleme
```python
if normalized_total >= 80:
    category = "Mükemmel"
    color = "#28a745"  # Yeşil
elif normalized_total >= 60:
    category = "Çok İyi"  
    color = "#ffc107"  # Sarı
elif normalized_total >= 40:
    category = "İyi"
    color = "#fd7e14"  # Turuncu
elif normalized_total >= 30:
    category = "Orta"
    color = "#dc3545"  # Kırmızı
else:
    category = "Uygun Değil"
    color = "#6c757d"  # Gri
```

## Detaylı Breakdown Yapısı

### API Response Format
```python
return {
    'lat': lat, 
    'lon': lon, 
    'total_score': normalized_total,
    'category': category,
    'color': color,
    'emoji': emoji,
    'breakdown': {
        'hospital_proximity': {
            'score': hospital_score,
            'explanation': 'Hastane yakınlığı',
            'weight': '30%'
        },
        'competitors': {
            'score': competitor_score,
            'explanation': 'Rakip yoğunluğu',
            'details': competitor_details,
            'weight': '30%'
        },
        'demographics': {
            'score': demo_score,
            'details': {
                'population': mahalle_nufus,
                'age_profile': yas_profili,
                'income_level': gelir_duzeyi
            },
            'weight': '10%'
        },
        'important_places': {
            'score': important_score,
            'details': {
                'metro_score': metro_score,
                'university_score': university_score,
                'mall_score': mall_score
            },
            'weight': '30%'
        }
    },
    'mahalle': mahalle_adi,
    'distances': distances
}
```

Bu algoritma, her lokasyon için kapsamlı bir analiz yaparak işletme sahiplerinin veri odaklı kararlar almasını sağlar.