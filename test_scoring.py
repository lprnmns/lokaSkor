#!/usr/bin/env python3
# Test scoring system

import sys
sys.path.append('.')

from scorer import score_single_point
from app import Kural

# Test kuralları oluştur
kurallar = [
    Kural(isletme_turu='eczane', parametre='hastane', max_puan=100, etki_mesafesi=1000, log_katsayisi=2.0),
    Kural(isletme_turu='eczane', parametre='rakip_eczane', max_puan=-100, etki_mesafesi=700, log_katsayisi=3.0),
    Kural(isletme_turu='eczane', parametre='metro', max_puan=50, etki_mesafesi=800, log_katsayisi=2.0),
    Kural(isletme_turu='eczane', parametre='yas_profili', deger='Yaşlı Ağırlıklı / Karma', max_puan=30, etki_mesafesi=0, log_katsayisi=1.0),
    Kural(isletme_turu='eczane', parametre='gelir_duzeyi', deger='Orta-Düşük / Orta', max_puan=10, etki_mesafesi=0, log_katsayisi=1.0),
]

# Test noktası - iki eczanenin ortası
lat, lon = 39.969169, 32.783675
print(f"Test Noktası: {lat}, {lon}")
print("Yakındaki Eczaneler:")
print("- Bilge Şen Eczanesi: 39.9695248, 32.7831893 (~40m)")
print("- Birinci Eczanesi: 39.9694219, 32.7835277 (~50m)")
print()

try:
    result = score_single_point(lat, lon, 'eczane', kurallar)
    
    print('=== SKORLAMA SONUCU ===')
    print(f'Toplam Skor: {result.get("total_score", "HATA")}')
    print(f'Kategori: {result.get("category", "HATA")}')
    print(f'Mahalle: {result.get("mahalle", "HATA")}')
    
    if 'breakdown' in result:
        breakdown = result['breakdown']
        print(f'\n=== DETAYLAR ===')
        print(f'Hastane: {breakdown.get("hospital_proximity", {}).get("score", "HATA")}')
        print(f'Rakip: {breakdown.get("competitors", {}).get("score", "HATA")}')
        print(f'Demografi: {breakdown.get("demographics", {}).get("score", "HATA")}')
        print(f'Önemli Yerler: {breakdown.get("important_places", {}).get("score", "HATA")}')
        
        # Raw breakdown kontrol
        if 'raw_breakdown' in result:
            raw = result['raw_breakdown']
            print(f'\n=== RAW BREAKDOWN ===')
            for key, value in raw.items():
                if 'rakip' in key:
                    print(f'{key}: {value}')
    
except Exception as e:
    print(f"HATA: {e}")
    import traceback
    traceback.print_exc()