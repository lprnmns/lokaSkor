# LocationIQ - API Endpoints Referansı (Modern UI)

## Aktif API Endpoints

### 1. Ana Karşılaştırma API

#### `POST /api/compare-locations`
**Amaç**: Çoklu lokasyon karşılaştırma analizi
**Kullanım**: `mod1_comparison.js` tarafından çağrılır
**Authentication**: Yok (public)

##### Request Format
```json
{
    "locations": [
        {
            "id": "loc_1",
            "name": "Lokasyon 1",
            "lat": 39.9334,
            "lng": 32.8597,
            "address": "Adres bilgisi (opsiyonel)"
        },
        {
            "id": "loc_2", 
            "name": "Lokasyon 2",
            "lat": 39.9400,
            "lng": 32.8650,
            "address": "Adres bilgisi (opsiyonel)"
        }
    ],
    "business_type": "eczane"
}
```

##### Response Format
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
            "coordinates": {"lat": 39.9334, "lng": 32.8597},
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
                    },
                    "pharmacy": {
                        "name": "Eczane XYZ",
                        "distance": "300m"
                    }
                },
                "demographic": {
                    "population": 25000,
                    "age_profile": "Karma",
                    "income_level": "Orta",
                    "population_density_score": 30.0,
                    "age_score": 15.0,
                    "income_score": 10.0
                },
                "competitors": [
                    {
                        "name": "Rakip Eczane",
                        "distance": "300m",
                        "impact_score": -15.2
                    }
                ],
                "important_places": {
                    "metro_score": 80.0,
                    "university_score": 45.0,
                    "mall_score": 60.0,
                    "metro_distance": "1200m"
                },
                "mahalle": "Demetevler Mahallesi",
                "category": "Çok İyi",
                "raw_breakdown": {
                    "hospital_proximity": {
                        "score": 85.2,
                        "weight": "30%"
                    }
                }
            }
        }
    ],
    "business_type": "eczane",
    "analysis_date": "2024-01-15T10:30:00"
}
```

##### Error Response
```json
{
    "success": false,
    "error": "En az 2 lokasyon gerekli",
    "code": "INSUFFICIENT_LOCATIONS"
}
```

### 2. Admin/Test API'leri

#### `POST /api/admin/testing/score-point`
**Amaç**: Tek nokta puanlama (admin panel için optimize edilmiş)
**Kullanım**: Modern dashboard ve test amaçlı

##### Request Format
```json
{
    "lat": 39.9334,
    "lon": 32.8597,
    "category": "eczane"
}
```

##### Response Format
```json
{
    "success": true,
    "total_score": 75.3,
    "normalized_score": 75.3,
    "category": "Çok İyi",
    "color": "#ffc107",
    "emoji": "🟡",
    "mahalle": "Demetevler Mahallesi",
    "breakdown": {
        "hospital_proximity": {
            "score": 85.2,
            "explanation": "Hastane yakınlığı",
            "weight": "30%"
        }
    }
}
```

#### `GET /api/admin/testing/test-points`
**Amaç**: Test noktalarını listele
**Response**: Test noktaları array'i

#### `POST /api/admin/testing/test-points`
**Amaç**: Yeni test noktası oluştur

#### `PUT /api/admin/testing/test-points/<id>`
**Amaç**: Test noktası güncelle

#### `DELETE /api/admin/testing/test-points/<id>`
**Amaç**: Test noktası sil

## Kullanılmayan/Eski API'ler

### Temizlenecek Endpoint'ler
Bu endpoint'ler modern UI'da kullanılmıyor ve temizlenebilir:

- `GET /api/v5/score_point` - Eski puanlama API'si
- `GET /api/v8/mahalle_analizi/<mahalle>/<kategori>` - Eski mahalle analizi
- `GET /api/v8/heatmap_data/<kategori>` - Eski ısı haritası
- `GET /api/v5/get_locations/<poi_type>` - Eski POI listesi
- `POST /api/v7/enable_all_grids` - Eski grid aktivasyonu

## API Implementation Details

### Backend Implementation (`app.py`)

#### compare_locations Function
```python
@app.route('/api/compare-locations', methods=['POST'])
def compare_locations():
    try:
        data = request.get_json()
        locations = data.get('locations', [])
        business_type = data.get('business_type', 'genel')
        
        if len(locations) < 2:
            return jsonify({'error': 'En az 2 lokasyon gerekli'}), 400
        
        # Her lokasyon için analiz yap
        results = []
        for i, location in enumerate(locations):
            analysis = analyze_location_score(
                location['lat'], 
                location['lng'], 
                business_type
            )
            
            result = {
                'id': location['id'],
                'name': location['name'],
                'lat': location['lat'],
                'lng': location['lng'],
                'address': location.get('address', ''),
                'coordinates': {'lat': location['lat'], 'lng': location['lng']},
                'totalScore': analysis['total_score'],
                'rank': 0,  # Sonradan hesaplanır
                'scores': analysis['scores'],
                'details': analysis['details']
            }
            results.append(result)
        
        # Sıralama yap
        results.sort(key=lambda x: x['totalScore'], reverse=True)
        for i, result in enumerate(results):
            result['rank'] = i + 1
        
        return jsonify({
            'success': True,
            'locations': results,
            'business_type': business_type,
            'analysis_date': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': 'Analiz sırasında hata oluştu'}), 500
```

### Frontend API Calls

#### LocationComparison.js'de API Çağrısı
```javascript
async startComparison() {
    try {
        this.showLoading(true);
        
        const response = await fetch('/api/compare-locations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                locations: this.locations,
                business_type: this.businessType
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            this.showResults(result.locations);
        } else {
            throw new Error(result.error || 'Bilinmeyen hata');
        }
        
    } catch (error) {
        console.error('Comparison error:', error);
        this.showError(error.message);
    } finally {
        this.showLoading(false);
    }
}
```

## Error Handling

### Common Error Codes
- `INSUFFICIENT_LOCATIONS`: En az 2 lokasyon gerekli
- `INVALID_COORDINATES`: Geçersiz koordinat değerleri
- `UNSUPPORTED_BUSINESS_TYPE`: Desteklenmeyen işletme türü
- `ANALYSIS_FAILED`: Analiz sırasında hata
- `DATABASE_ERROR`: Veritabanı bağlantı hatası

### Error Response Format
```json
{
    "success": false,
    "error": "Hata mesajı",
    "code": "ERROR_CODE",
    "details": {
        "additional": "info"
    }
}
```

Bu API referansı, modern UI akışında kullanılan tüm aktif endpoint'leri ve bunların kullanım şekillerini kapsar.