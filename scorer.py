# scorer.py (V5.1 - Detaylı Raporlama Motoru)

from data_manager import data_manager
import numpy as np
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

def get_rules_for_param(kurallar, parametre):
    # Bu fonksiyon, admin panelinden gelen kuralları daha kolay işlemek için bir sözlüğe çevirir.
    param_kurallari = {}
    for kural in kurallar:
        if kural.parametre == parametre:
            param_kurallari['max_puan'] = kural.max_puan
            param_kurallari['etki_mesafesi'] = kural.etki_mesafesi
            param_kurallari['log_katsayisi'] = kural.log_katsayisi
            if kural.deger:
                param_kurallari.setdefault('degerler', {})[kural.deger] = kural.max_puan
    return param_kurallari

def logarithmic_score(distance, max_puan, etki_mesafesi, katsayi):
    # Mesafeye göre logaritmik olarak azalan bir puan hesaplar.
    # 10m'de 20x, 100m'de 5x, 500m'de 1x, 1000m'de neredeyse 0
    if distance >= etki_mesafesi or max_puan == 0:
        return 0
    
    # Logaritmik azalma: log(etki_mesafesi/distance) * katsayi
    import math
    if distance <= 10:  # Minimum mesafe 10m
        distance = 10
    
    # Logaritmik puan hesaplama
    log_factor = math.log(etki_mesafesi / distance) / math.log(katsayi)
    score = max_puan * max(0, min(1, log_factor))
    
    return score

def score_single_point(lat, lon, kategori, kurallar):
    """Verilen tek bir nokta için tüm kuralları ve çoklu etkenleri uygulayarak detaylı skorlama yapar."""
    
    point_wgs84 = gpd.GeoDataFrame(geometry=[Point(lon, lat)], crs="EPSG:4326")
    point_utm = point_wgs84.to_crs(epsg=32636).iloc[0].geometry
    point_coords = (point_utm.x, point_utm.y)

    total_score = 0
    # --- DEĞİŞİKLİK BURADA: breakdown artık daha detaylı bilgi tutacak ---
    breakdown = {}
    
    # Mesafe bilgileri için
    distances = {}
    
    mahalle_bilgisi = gpd.sjoin(point_wgs84, data_manager.neighborhood_polygons, how='left', predicate='within')
    if mahalle_bilgisi.empty:
        # Demografi verisi olmayan bölge için varsayılan değerler kullan
        mahalle_adi = "Bilinmeyen Mahalle"
        # Boş bir DataFrame oluştur varsayılan değerlerle
        mahalle_bilgisi = pd.DataFrame({
            'mahalle_x': [mahalle_adi],
            'nufus': [15000],  # Varsayılan nüfus
            'yas_profili': ['Karma'],  # Varsayılan yaş profili
            'gelir_duzeyi': ['Orta']   # Varsayılan gelir düzeyi
        })
    else:
        mahalle_adi = mahalle_bilgisi['mahalle_x'].iloc[0]

    # --- En yakın mesafeleri hesapla (tüm önemli POI'ler için) ---
    important_pois = ['hastane', 'metro', 'market', kategori]  # Kategori de rakip olarak eklenir
    
    for poi_type in important_pois:
        tree = data_manager.poi_trees.get(poi_type)
        poi_gdf = data_manager.poi_data.get(poi_type)
        
        if tree and poi_gdf is not None and not poi_gdf.empty:
            # En yakın POI'yi bul
            distance, index = tree.query(point_coords, k=1)
            if distance < 10000:  # 10km içindeki en yakın
                distances[f"{poi_type}_distance"] = float(distance)
                distances[f"{poi_type}_name"] = str(poi_gdf.iloc[index].get('isim', 'Bilinmeyen'))

    # --- Puanlamayı Başlat ---
    # 1. Mesafe Bazlı Parametreler
    parametre_listesi = list(set([k.parametre for k in kurallar if k.etki_mesafesi > 0]))
    
    for param in parametre_listesi:
        kural = get_rules_for_param(kurallar, param)
        if not kural: continue

        poi_key = param.replace('rakip_', '')
        tree = data_manager.poi_trees.get(poi_key)
        poi_gdf = data_manager.poi_data.get(poi_key)
        
        if tree and poi_gdf is not None and not poi_gdf.empty:
            indices = tree.query_ball_point(point_coords, r=kural['etki_mesafesi'])
            if not indices: continue

            param_toplam_puan = 0
            etkileyen_ler = []
            min_distance = float('inf')

            for i in indices:
                distance = np.linalg.norm(point_coords - tree.data[i])
                puan = logarithmic_score(distance, kural['max_puan'], kural['etki_mesafesi'], kural['log_katsayisi'])
                
                # Rakip parametreleri için puanı negatif yap
                if param.startswith('rakip_'):
                    puan = -abs(puan)  # Her zaman negatif
                
                param_toplam_puan += puan
                min_distance = min(min_distance, distance)
                try:
                    etkileyen_ler.append({
                        "ad": poi_gdf.iloc[i].get('isim', 'Bilinmeyen'),
                        "mesafe": f"{distance:.0f}m",
                        "distance_meters": int(distance) if distance and not np.isnan(distance) else 999999,  # Safe distance conversion
                        "puan": f"{puan:+.1f}" if not np.isnan(puan) else "0.0"
                    })
                except (ValueError, TypeError) as e:
                    # Fallback for invalid data
                    etkileyen_ler.append({
                        "ad": poi_gdf.iloc[i].get('isim', 'Bilinmeyen'),
                        "mesafe": "Bilinmiyor",
                        "distance_meters": 999999,
                        "puan": "0.0"
                    })
            
            if abs(param_toplam_puan) > 0.1:
                total_score += param_toplam_puan
                
                # Sort competitors by distance and limit to 5 (only for competitor parameters)
                if param.startswith('rakip_'):
                    etkileyen_ler_sorted = sorted(etkileyen_ler, key=lambda x: x.get('distance_meters', 999999))[:5]
                else:
                    etkileyen_ler_sorted = etkileyen_ler
                
                breakdown[param] = {
                    "score": param_toplam_puan,
                    "count": len(etkileyen_ler_sorted),
                    "closest_distance": min_distance if min_distance != float('inf') else None,
                    "details": etkileyen_ler_sorted
                }

    # 2. Demografi Bazlı Parametreler
    demografi_toplam = 0
    for param in ['yas_profili', 'gelir_duzeyi']:
        kural = get_rules_for_param(kurallar, param)
        if not kural: continue
        
        deger = mahalle_bilgisi[param].iloc[0] if param in mahalle_bilgisi.columns else None
        if pd.notna(deger) and deger in kural.get('degerler', {}):
            puan = kural['degerler'][deger]
            total_score += puan
            demografi_toplam += puan
            breakdown[param] = {
                "score": puan,
                "value": deger,
                "details": [{"ad": mahalle_adi, "profil": deger}]
            }

    # Mesafe bilgilerini breakdown'a ekle
    breakdown.update(distances)
    
    # Normalize puanları (0-100 arası)
    def normalize_score(raw_score, min_val=-5000, max_val=200):
        if raw_score is None:
            return 0
        normalized = ((raw_score - min_val) / (max_val - min_val)) * 100
        return max(0, min(100, normalized))
    
    # Rakip analizi puanını düzelt (negatif olmalı)
    # Hem rakip_{kategori} hem de rakip_{kategori} formatlarını kontrol et
    competitor_key = f'rakip_{kategori}'
    if competitor_key not in breakdown:
        # Alternatif format dene
        for key in breakdown.keys():
            if key.startswith('rakip_') and kategori in key:
                competitor_key = key
                break
    
    competitor_score = float(breakdown.get(competitor_key, {}).get('score', 0))
    
    # DEBUG: Rakip puanını kontrol et
    print(f"DEBUG - Kategori: {kategori}")
    print(f"DEBUG - Competitor score: {competitor_score}")
    print(f"DEBUG - Breakdown keys: {list(breakdown.keys())}")
    
    # Demografi verilerini mahalle bilgisinden al
    mahalle_nufus = int(mahalle_bilgisi['nufus'].iloc[0]) if 'nufus' in mahalle_bilgisi.columns and pd.notna(mahalle_bilgisi['nufus'].iloc[0]) else 0
    yas_profili = str(mahalle_bilgisi['yas_profili'].iloc[0]) if 'yas_profili' in mahalle_bilgisi.columns and pd.notna(mahalle_bilgisi['yas_profili'].iloc[0]) else 'Bilinmiyor'
    gelir_duzeyi = str(mahalle_bilgisi['gelir_duzeyi'].iloc[0]) if 'gelir_duzeyi' in mahalle_bilgisi.columns and pd.notna(mahalle_bilgisi['gelir_duzeyi'].iloc[0]) else 'Bilinmiyor'
    
    # Nüfus yoğunluğu hesapla (daha mantıklı yaklaşım)
    # 0-5000: Düşük (10 puan), 5000-15000: Orta (20 puan), 15000-30000: Yüksek (30 puan), 30000+: Çok Yüksek (40 puan)
    if mahalle_nufus > 0:
        if mahalle_nufus >= 30000:
            nufus_yogunlugu_puan = 40.0  # Çok yüksek nüfus
        elif mahalle_nufus >= 15000:
            nufus_yogunlugu_puan = 30.0  # Yüksek nüfus
        elif mahalle_nufus >= 5000:
            nufus_yogunlugu_puan = 20.0  # Orta nüfus
        else:
            nufus_yogunlugu_puan = 10.0  # Düşük nüfus
    else:
        nufus_yogunlugu_puan = 0.0
    
    # Yaş profili puanı - Akıllı eşleştirme
    yas_puan = 0.0
    if yas_profili and yas_profili != 'Bilinmiyor':
        yas_kural = get_rules_for_param(kurallar, 'yas_profili')
        if yas_kural and 'degerler' in yas_kural:
            # Önce tam eşleşme dene
            if yas_profili in yas_kural['degerler']:
                yas_puan = float(yas_kural['degerler'][yas_profili])
            else:
                # Akıllı eşleştirme - eczane için yaşlı ağırlıklı iyi
                if kategori == 'eczane':
                    if 'yaşlı' in yas_profili.lower():
                        yas_puan = 30.0  # Yaşlı ağırlıklı eczane için çok iyi
                    elif 'karma' in yas_profili.lower():
                        yas_puan = 15.0  # Karma orta iyi
                    elif 'genç' in yas_profili.lower():
                        yas_puan = -10.0  # Genç ağırlıklı eczane için kötü
    
    # Gelir düzeyi puanı - Akıllı eşleştirme
    gelir_puan = 0.0
    if gelir_duzeyi and gelir_duzeyi != 'Bilinmiyor':
        gelir_kural = get_rules_for_param(kurallar, 'gelir_duzeyi')
        if gelir_kural and 'degerler' in gelir_kural:
            # Önce tam eşleşme dene
            if gelir_duzeyi in gelir_kural['degerler']:
                gelir_puan = float(gelir_kural['degerler'][gelir_duzeyi])
            else:
                # Akıllı eşleştirme - eczane için orta gelir iyi
                if kategori == 'eczane':
                    if 'yüksek' in gelir_duzeyi.lower():
                        gelir_puan = 20.0  # Yüksek gelir çok iyi
                    elif 'orta' in gelir_duzeyi.lower():
                        gelir_puan = 10.0  # Orta gelir iyi
                    elif 'düşük' in gelir_duzeyi.lower():
                        gelir_puan = 5.0   # Düşük gelir az iyi
    
    demo_score = float(yas_puan + gelir_puan + nufus_yogunlugu_puan)
    
    # Hastane yakınlığı puanı hesapla
    hospital_score = 0.0
    if 'hastane' in breakdown:
        hospital_raw = breakdown['hastane'].get('score', 0)
        hospital_score = normalize_score(hospital_raw, 0, 100)
    
    # Önemli yerler puanı hesapla (metro, üniversite, avm)
    important_places_score = 0.0
    important_count = 0
    
    for place in ['metro', 'universite', 'avm']:
        if place in breakdown:
            place_raw = breakdown[place].get('score', 0)
            place_normalized = normalize_score(place_raw, 0, 50)
            important_places_score += place_normalized
            important_count += 1
    
    if important_count > 0:
        important_places_score = important_places_score / important_count  # Ortalama al
    
    # Rakip puanını 0-100 arası normalize et (negatif olduğu için ters çevir)
    competitor_normalized = 100 - normalize_score(abs(competitor_score), 0, 1000)  # Ne kadar rakip varsa o kadar düşük puan
    
    # Demografi puanını 0-100 arası normalize et
    demo_normalized = normalize_score(demo_score, 0, 100)
    
    # Dinamik ağırlıkları al (veritabanından)
    # Önce varsayılan değerleri ata
    hospital_weight = 0.30
    competitor_weight = 0.30
    demographics_weight = 0.10
    important_places_weight = 0.30
    
    try:
        from flask import has_app_context
        if has_app_context():
            from app import WeightConfig, db
            weight_config = WeightConfig.query.filter_by(category=kategori).first()
            if weight_config:
                hospital_weight = weight_config.hospital_weight
                competitor_weight = weight_config.competitor_weight
                demographics_weight = weight_config.demographics_weight
                important_places_weight = weight_config.important_places_weight
    except Exception as e:
        # Hata durumunda varsayılan ağırlıklar kullanılır
        pass
    
    # Ağırlık yüzdelerini string olarak hazırla
    hospital_weight_str = f"{int(hospital_weight * 100)}%"
    competitor_weight_str = f"{int(competitor_weight * 100)}%"
    demographics_weight_str = f"{int(demographics_weight * 100)}%"
    important_places_weight_str = f"{int(important_places_weight * 100)}%"
    
    # Özel breakdown formatı (JavaScript ile uyumlu) - HER ŞEY 0-100 ARASI
    formatted_breakdown = {
        'hospital_proximity': {
            'score': round(hospital_score, 1),  # 0-100 arası
            'raw_score': breakdown.get('hastane', {}).get('score', 0),
            'distance': distances.get('hastane_distance'),
            'explanation': 'Hastane yakınlığı (yüksek = hastaneye yakın)',
            'weight': hospital_weight_str
        },
        'competitors': {
            'score': round(competitor_normalized, 1),  # 0-100 arası (düşük = çok rakip)
            'raw_score': competitor_score,  # Ham değer (debug için)
            'distance': distances.get(f'{kategori}_distance'),
            'explanation': f'Rakip yoğunluğu (düşük = çok rakip var)',
            'details': breakdown.get(competitor_key, {}).get('details', []),
            'weight': competitor_weight_str
        },
        'demographics': {
            'score': round(demo_normalized, 1),  # 0-100 arası
            'raw_score': demo_score,  # Ham değer (debug için)
            'explanation': 'Nüfus yoğunluğu, yaş profili ve gelir düzeyi uygunluğu',
            'details': {
                'population': mahalle_nufus,
                'population_density_score': round(nufus_yogunlugu_puan, 1),
                'age_profile': yas_profili,
                'age_score': round(yas_puan, 1),
                'income_level': gelir_duzeyi,
                'income_score': round(gelir_puan, 1)
            },
            'weight': demographics_weight_str
        },
        'important_places': {
            'score': round(important_places_score, 1),  # 0-100 arası
            'explanation': 'Metro, üniversite, AVM yakınlığı',
            'details': {
                'metro_distance': distances.get('metro_distance'),
                'metro_score': round(normalize_score(breakdown.get('metro', {}).get('score', 0), 0, 50), 1) if 'metro' in breakdown else 0,
                'university_score': round(normalize_score(breakdown.get('universite', {}).get('score', 0), 0, 50), 1) if 'universite' in breakdown else 0,
                'mall_score': round(normalize_score(breakdown.get('avm', {}).get('score', 0), 0, 50), 1) if 'avm' in breakdown else 0
            },
            'weight': important_places_weight_str
        },
        'hospital_distance': distances.get('hastane_distance'),
        'metro_distance': distances.get('metro_distance'), 
        'market_distance': distances.get('market_distance'),
        'competitor_distance': distances.get(f'{kategori}_distance')
    }

    # Toplam puanı hesapla (dinamik ağırlıklı ortalama)
    final_total_score = (
        hospital_score * hospital_weight +           # Hastane (dinamik)
        competitor_normalized * competitor_weight +  # Rakip (dinamik)
        demo_normalized * demographics_weight +      # Demografi (dinamik)
        important_places_score * important_places_weight  # Önemli yerler (dinamik)
    )
    
    # DEBUG: Puan hesaplamasını kontrol et
    print(f"DEBUG - Competitor normalized: {competitor_normalized}")
    print(f"DEBUG - Demo normalized: {demo_normalized}")
    print(f"DEBUG - Final total: {final_total_score}")
    
    # Zaten 0-100 arası olduğu için ek normalize gerek yok
    normalized_total = round(final_total_score, 1)
    
    # Kullanıcı dostu kategoriler ekle
    if normalized_total >= 80:
        category = "Mükemmel"
        color = "#28a745"  # Yeşil
        emoji = "🟢"
    elif normalized_total >= 60:
        category = "Çok İyi"
        color = "#ffc107"  # Sarı
        emoji = "🟡"
    elif normalized_total >= 40:
        category = "İyi"
        color = "#fd7e14"  # Turuncu
        emoji = "🟠"
    elif normalized_total >= 30:
        category = "Orta"
        color = "#dc3545"  # Kırmızı
        emoji = "🔴"
    else:
        category = "Uygun Değil"
        color = "#6c757d"  # Gri
        emoji = "⚫"

    return {
        'lat': lat, 
        'lon': lon, 
        'total_score': normalized_total,  # Normalize edilmiş toplam puan
        'raw_total_score': final_total_score,  # Ham toplam puan
        'category': category,
        'color': color,
        'emoji': emoji,
        'breakdown': formatted_breakdown, 
        'mahalle': mahalle_adi,
        'raw_breakdown': breakdown,  # Detaylı bilgi için
        'distances': distances  # Tüm mesafe bilgileri
    }


