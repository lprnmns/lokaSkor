#!/usr/bin/env python3
# fetch_mahalle_v4.py
# Kullanıcının isteği üzerine, mahalleleri tam isimle ("... Mahallesi")
# ve doğrudan Ankara alanı içinde arar.

import os
import re
import time
import json
import requests

try:
    from osm2geojson import json2geojson
except ImportError:
    print("osm2geojson kütüphanesi bulunamadı. Lütfen 'pip install osm2geojson' komutu ile kurun.")
    exit()

# --- Ayarlar ---
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OUTPUT_DIR   = "mahalle_geojson"
DELAY_SEC    = 2

# Mahalle isimleri (kullanıcının istediği tam formatta)
mahalleler = [
    "Turgut Özal Mahallesi", "Kardelen Mahallesi", "Kentkoop Mahallesi",
    "Demetevler Mahallesi", "Yeni Batı Mahallesi", "Serhat Mahallesi",
    "Demetgül Mahallesi", "Uğur Mumcu Mahallesi", "İlkyerleşim Mahallesi",
    "Demetlale Mahallesi", "İnönü Mahallesi", "Çiğdemtepe Mahallesi",
    "Pamuklar Mahallesi", "Ergenekon Mahallesi", "Yeşilevler Mahallesi",
    "Ergazi Mahallesi", "Mehmet Akif Ersoy Mahallesi", "Beştepe Mahallesi",
    "Özevler Mahallesi", "Barıştepe Mahallesi", "Karşıyaka Mahallesi",
    "Gayret Mahallesi", "Güventepe Mahallesi", "Burç Mahallesi",
    "Yunus Emre Mahallesi", "Kaletepe Mahallesi", "Işınlar Mahallesi",
    "Yakacık Mahallesi", "Esentepe Mahallesi", "Avcılar Mahallesi",
    "Çamlıca Mahallesi", "Kayalar Mahallesi", "Aşağı Yahyalar Mahallesi",
    "Anadolu Mahallesi", "Güzelyaka Mahallesi", "25 Mart Mahallesi",
    "Gazi Mahallesi", "Tepealtı Mahallesi", "Ostim Mahallesi",
    "Varlık Mahallesi", "Yeniçağ Mahallesi", "Çarşı Mahallesi",
    "Ragıp Tüzün Mahallesi", "Yukarı Yahyalar Mahallesi", "Barış Mahallesi",
    "Macun Mahallesi", "Susuz Mahallesi", "Memlik Mahallesi",
    "Yuvaköy Mahallesi", "Karacakaya Mahallesi", "Ata Mahallesi",
    "Batı Sitesi Mahallesi", "Cumhuriyet Mahallesi", "Çakırlar Mahallesi",
    "Emniyet Mahallesi", "İvedikköy Mahallesi", "Kuzey Yıldızı Mahallesi"
]
os.makedirs(OUTPUT_DIR, exist_ok=True)

def build_query(full_mahalle_name):
    # Kullanıcının isteğiyle, Ankara (admin_level=4) içinde
    # tam mahalle adıyla ("... Mahallesi") arama yapıyoruz.
    return f"""
    [out:json][timeout:30];
    area["name"="Ankara"]["admin_level"="4"]->.searchArea;
    (
      nwr["boundary"="administrative"]["name"="{full_mahalle_name}"](area.searchArea);
    );
    out geom;
    """

headers = {
    'User-Agent': 'LocationAnalysisProject/1.0'
}

for idx, mh_tam_isim in enumerate(mahalleler, 1):
    print(f"[{idx}/{len(mahalleler)}] '{mh_tam_isim}' sorgulanıyor...")
    
    try:
        query_data = build_query(mh_tam_isim)
        resp = requests.post(OVERPASS_URL, data={"data": query_data}, headers=headers, timeout=40)
        
        if resp.status_code != 200:
            print(f"  ❌ HTTP {resp.status_code} - {mh_tam_isim}")
            print(f"     Sunucu Cevabı: {resp.text[:200]}")
            continue

        osm_j = resp.json()
        gj = json2geojson(osm_j)
        feats = gj.get("features", [])
        
        if not feats:
            print(f"  ⚠️ '{mh_tam_isim}' için poligon bulunamadı.")
        else:
            fc = {"type": "FeatureCollection", "features": feats}
            
            safe_name = re.sub(r'[^\w\s-]', '', mh_tam_isim).strip().replace(' ', '_')
            path = os.path.join(OUTPUT_DIR, f"{safe_name}.geojson")
            
            with open(path, "w", encoding="utf-8") as f:
                json.dump(fc, f, ensure_ascii=False, indent=2)
            print(f"  ✔ Kaydedildi: {path}")

    except requests.exceptions.RequestException as e:
        print(f"  ❌ Ağ Hatası - {mh_tam_isim}: {e}")
    except Exception as e:
        print(f"  ❌ Genel Hata - {mh_tam_isim}: {e}")

    time.sleep(DELAY_SEC)

print("\nTamamlandı: Tüm dosyalar oluşturuldu.")