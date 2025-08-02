# LocationIQ - Veri Mimarisi ve Yönetimi

## Veri Mimarisi Genel Bakış

LocationIQ, coğrafi analiz için çeşitli veri kaynaklarını entegre eden hibrit bir veri mimarisi kullanır. Sistem, performans için hafıza tabanlı önbellekleme ve hızlı arama için KDTree yapıları kullanır.

## DataManager Sınıfı (data_manager.py)

### Singleton Pattern
```python
# Uygulama boyunca tek bir DataManager nesnesi
data_manager = DataManager()
```

### Başlatma Süreci
```python
def __init__(self):
    print("DataManager başlatılıyor: Tüm veriler hafızaya yükleniyor...")
    self.grid_points = None
    self.demografi_data = None
    self.neighborhood_polygons = None
    self.poi_data = {}  # POI: Point of Interest
    self.poi_trees = {}  # Hızlı arama için KDTree'ler
    
    self._load_all_data()
```

## Veri Kaynakları

### 1. Coğrafi Grid Verileri
**Dosya**: `yenimahalle_grid.geojson`
**Format**: GeoJSON
**İçerik**: Analiz edilecek ızgara noktaları
```python
self.grid_points = gpd.read_file("yenimahalle_grid.geojson")
```

### 2. Demografik Veriler
**Dosya**: `yenimahalle_demografi.csv`
**Format**: CSV
**Kolonlar**:
- `mahalle`: Mahalle adı
- `nufus`: Nüfus sayısı
- `yas_profili`: Yaş dağılımı (genç/karma/yaşlı)
- `gelir_duzeyi`: Gelir seviyesi (düşük/orta/yüksek)

```python
self.demografi_data = pd.read_csv("yenimahalle_demografi.csv")
# Türkçe karakter normalizasyonu
self.demografi_data['mahalle_key'] = self.demografi_data['mahalle']\
    .str.strip().str.lower().str.replace(' ', '')\
    .str.replace('ı','i').str.replace('ş','s')\
    .str.replace('ğ','g').str.replace('ç','c')\
    .str.replace('ö','o').str.replace('ü','u')
```

### 3. Mahalle Sınırları
**Dizin**: `mahalle_geojson/*.geojson`
**Format**: GeoJSON dosyaları
**İşlem**: Tüm mahalle dosyaları birleştirilerek tek GeoDataFrame oluşturulur

```python
mahalle_dosyalari = glob.glob('mahalle_geojson/*.geojson')
for dosya in mahalle_dosyalari:
    mahalle_gdf = gpd.read_file(dosya)
    dosya_adi = os.path.basename(dosya)
    mahalle_adi = dosya_adi.replace('.geojson', '').replace('_', ' ')
    mahalle_gdf['mahalle'] = mahalle_adi
```

### 4. POI (Point of Interest) Verileri

#### Veri Kaynağı Öncelik Sırası
1. **OpenStreetMap (OSM)**: `*_osm.csv` (Öncelikli)
2. **Temiz CSV**: `*_temiz.csv` (Fallback)

```python
def _load_poi_data(self):
    # Önce OSM verilerini kontrol et
    osm_files = glob.glob('*_osm.csv')
    if osm_files:
        print("OpenStreetMap verileri bulundu")
        poi_files = osm_files
    else:
        print("Temiz CSV'ler kullanılacak")
        poi_files = glob.glob('*_temiz.csv')
```

#### POI Kategorileri
- **hastane**: Hastane ve sağlık tesisleri
- **eczane**: Eczane ve sağlık ürünleri
- **metro**: Metro istasyonları
- **market**: Market ve süpermarketler
- **avm**: Alışveriş merkezleri
- **universite**: Üniversite ve yüksekokullar
- **okul**: İlk ve ortaöğretim kurumları

## KDTree Optimizasyonu

### KDTree Oluşturma
```python
# Her POI kategorisi için KDTree oluştur
for key, gdf in self.poi_data.items():
    # UTM koordinatlarına dönüştür (metre cinsinden hesaplama)
    gdf_utm = gdf.to_crs(epsg=32636)
    coordinates = np.array(list(gdf_utm.geometry.apply(lambda p: (p.x, p.y))))
    
    if coordinates.size > 0:
        self.poi_trees[key] = cKDTree(coordinates)
```

### Hızlı Mesafe Sorguları
```python
# En yakın POI bulma - O(log n) karmaşıklık
distance, index = tree.query(point_coords, k=1)

# Belirli yarıçaptaki tüm POI'leri bulma
indices = tree.query_ball_point(point_coords, r=radius)
```

## Veritabanı Yapısı (SQLite)

### Ana Tablolar

#### Kural Tablosu
```python
class Kural(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    isletme_turu = db.Column(db.String(50), nullable=False, index=True)
    parametre = db.Column(db.String(50), nullable=False)
    max_puan = db.Column(db.Float, default=0)
    etki_mesafesi = db.Column(db.Integer, default=1000)
    log_katsayisi = db.Column(db.Float, default=2.0)
    deger = db.Column(db.String(100), nullable=True)
    aktif = db.Column(db.Boolean, default=True)
```

#### WeightConfig Tablosu
```python
class WeightConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False, unique=True)
    hospital_weight = db.Column(db.Float, default=0.30)
    competitor_weight = db.Column(db.Float, default=0.30)
    demographics_weight = db.Column(db.Float, default=0.10)
    important_places_weight = db.Column(db.Float, default=0.30)
```

#### Karsilastirma Tablosu
```python
class Karsilastirma(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nokta_a_lat = db.Column(db.Float, nullable=False)
    nokta_a_lon = db.Column(db.Float, nullable=False)
    nokta_b_lat = db.Column(db.Float, nullable=False)
    nokta_b_lon = db.Column(db.Float, nullable=False)
    secim = db.Column(db.String(20), nullable=False)
    kategori = db.Column(db.String(50), nullable=False)
    nokta_a_skor = db.Column(db.Float, nullable=True)
    nokta_b_skor = db.Column(db.Float, nullable=True)
    tarih = db.Column(db.DateTime, default=datetime.utcnow)
```

## Veri Akışı

### 1. Uygulama Başlatma
```
app.py başlatılır
    ↓
check_osm_data() çalışır
    ↓
DataManager() oluşturulur
    ↓
Tüm veriler hafızaya yüklenir
    ↓
KDTree'ler oluşturulur
```

### 2. Puanlama İsteği
```
API isteği gelir (/api/compare-locations)
    ↓
scorer.py/score_single_point() çağrılır
    ↓
data_manager'dan veriler alınır (hafızadan)
    ↓
KDTree ile hızlı mesafe hesaplamaları
    ↓
Sonuç JSON olarak döndürülür
```

## Performans Optimizasyonları

### Hafıza Yönetimi
- **Tüm veriler RAM'de**: Disk I/O minimizasyonu
- **KDTree yapıları**: O(log n) arama karmaşıklığı
- **Spatial indexing**: GeoPandas spatial join optimizasyonu

### Koordinat Sistemi Optimizasyonu
- **WGS84 (EPSG:4326)**: Giriş koordinatları
- **UTM Zone 36N (EPSG:32636)**: Mesafe hesaplamaları (metre cinsinden)

### Veri Önbellekleme
```python
# Mahalle-demografi birleştirmesi önbelleklenir
self.neighborhood_polygons = birlestirilmis_gdf.merge(
    self.demografi_data, on='mahalle_key', how='left'
)
```

## Hata Yönetimi ve Fallback

### OSM Veri Kontrolü
```python
def check_osm_data():
    osm_files = glob.glob('*_osm.csv')
    if not osm_files:
        print("OpenStreetMap verileri bulunamadı. Veriler çekiliyor...")
        # fetch_osm_data.py çalıştırılmaya çalışılır
        # Başarısızlık durumunda temiz CSV'ler kullanılır
```

### Veri Eksikliği Durumları
- **Mahalle bulunamadığında**: Varsayılan demografik değerler
- **POI verisi yoksa**: 0 puan veya minimum değerler
- **Koordinat dönüşüm hatası**: Hata loglanır, işlem devam eder

Bu veri mimarisi, yüksek performanslı coğrafi analiz için optimize edilmiş, ölçeklenebilir bir yapı sunar.