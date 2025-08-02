#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenStreetMap Veri Çekici
Yenimahalle bölgesi için POI verilerini OSM'den çeker
"""

import requests
import pandas as pd
import time
import json
from datetime import datetime

class OSMDataFetcher:
    def __init__(self):
        self.overpass_url = "http://overpass-api.de/api/interpreter"
        # Yenimahalle + çevre bölgeler (biraz geniş tutuyoruz)
        self.bbox = [39.85, 32.65, 40.05, 32.95]  # [south, west, north, east]
        
        # OSM kategorileri
        self.categories = {
            'hastane': 'hospital',
            'eczane': 'pharmacy',
            'metro': 'subway_entrance',  # Metro girişleri
            'universite': 'university',
            'avm': 'mall'
        }
        
        print(f"🌍 OSM Veri Çekici başlatıldı")
        print(f"📍 Bölge: {self.bbox} (Yenimahalle + çevre)")
        print(f"🎯 Kategoriler: {list(self.categories.keys())}")
    
    def fetch_poi_category(self, category_name, osm_tag):
        """Belirli bir POI kategorisini OSM'den çeker"""
        print(f"\n🔄 {category_name.title()} verileri çekiliyor...")
        
        # Overpass QL sorgusu
        query = f"""
        [out:json][timeout:30];
        (
          node["amenity"="{osm_tag}"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          way["amenity"="{osm_tag}"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          relation["amenity"="{osm_tag}"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
        );
        out center meta;
        """
        
        # Metro için özel sorgu (public_transport=subway_entrance)
        if osm_tag == 'subway_entrance':
            query = f"""
            [out:json][timeout:30];
            (
              node["public_transport"="subway_entrance"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
              node["railway"="subway_entrance"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
              node["public_transport"="station"]["subway"="yes"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
            );
            out center meta;
            """
        
        try:
            response = requests.get(self.overpass_url, params={'data': query}, timeout=60)
            response.raise_for_status()
            data = response.json()
            
            pois = []
            for element in data['elements']:
                try:
                    # Koordinatları al
                    if element['type'] == 'node':
                        lat, lon = element['lat'], element['lon']
                    elif 'center' in element:
                        lat, lon = element['center']['lat'], element['center']['lon']
                    else:
                        continue
                    
                    # İsim bilgisini al
                    tags = element.get('tags', {})
                    name = (tags.get('name') or 
                           tags.get('name:tr') or 
                           tags.get('brand') or 
                           f"{category_name.title()} #{element['id']}")
                    
                    pois.append({
                        'isim': name,
                        'enlem': lat,
                        'boylam': lon,
                        'osm_id': element['id'],
                        'osm_type': element['type']
                    })
                    
                except Exception as e:
                    print(f"⚠️  Element işlenirken hata: {e}")
                    continue
            
            print(f"✅ {len(pois)} {category_name} bulundu")
            return pd.DataFrame(pois)
            
        except requests.exceptions.RequestException as e:
            print(f"❌ {category_name} verisi çekilirken ağ hatası: {e}")
            return pd.DataFrame()
        except json.JSONDecodeError as e:
            print(f"❌ {category_name} verisi çekilirken JSON hatası: {e}")
            return pd.DataFrame()
        except Exception as e:
            print(f"❌ {category_name} verisi çekilirken genel hata: {e}")
            return pd.DataFrame()
    
    def fetch_all_categories(self):
        """Tüm POI kategorilerini çeker ve CSV'lere kaydeder"""
        print(f"\n🚀 Tüm kategoriler için OSM veri çekimi başlıyor...")
        print(f"⏰ Başlangıç: {datetime.now().strftime('%H:%M:%S')}")
        
        results = {}
        total_pois = 0
        
        for category_name, osm_tag in self.categories.items():
            try:
                # Veri çek
                df = self.fetch_poi_category(category_name, osm_tag)
                
                if not df.empty:
                    # CSV'ye kaydet
                    filename = f"{category_name}_osm.csv"
                    df.to_csv(filename, index=False, encoding='utf-8')
                    print(f"💾 {filename} kaydedildi ({len(df)} kayıt)")
                    
                    results[category_name] = len(df)
                    total_pois += len(df)
                else:
                    print(f"⚠️  {category_name} için veri bulunamadı")
                    results[category_name] = 0
                
                # API'ye nazik davranmak için kısa bekleme
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ {category_name} işlenirken hata: {e}")
                results[category_name] = 0
        
        # Özet rapor
        print(f"\n📊 OSM VERİ ÇEKİMİ TAMAMLANDI")
        print(f"⏰ Bitiş: {datetime.now().strftime('%H:%M:%S')}")
        print(f"📈 Toplam POI: {total_pois}")
        print(f"\n📋 Kategori Detayları:")
        for category, count in results.items():
            status = "✅" if count > 0 else "❌"
            print(f"  {status} {category.title()}: {count} kayıt")
        
        return results
    
    def test_connection(self):
        """OSM Overpass API bağlantısını test eder"""
        print("🔍 OSM Overpass API bağlantısı test ediliyor...")
        
        test_query = """
        [out:json][timeout:10];
        node["amenity"="hospital"](39.9,32.8,39.95,32.85);
        out count;
        """
        
        try:
            response = requests.get(self.overpass_url, params={'data': test_query}, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            print("✅ OSM API bağlantısı başarılı!")
            return True
            
        except Exception as e:
            print(f"❌ OSM API bağlantı hatası: {e}")
            return False

def main():
    """Ana fonksiyon"""
    print("🎯 OpenStreetMap Veri Çekici")
    print("=" * 50)
    
    fetcher = OSMDataFetcher()
    
    # Bağlantı testi
    if not fetcher.test_connection():
        print("❌ OSM API'ye bağlanılamıyor. İnternet bağlantınızı kontrol edin.")
        return
    
    # Tüm verileri çek
    results = fetcher.fetch_all_categories()
    
    # Başarı durumu
    successful_categories = sum(1 for count in results.values() if count > 0)
    total_categories = len(results)
    
    print(f"\n🎉 İşlem tamamlandı!")
    print(f"📊 {successful_categories}/{total_categories} kategori başarılı")
    
    if successful_categories > 0:
        print(f"\n💡 Sonraki adım: Flask server'ını yeniden başlatın")
        print(f"   python app.py")
    else:
        print(f"\n⚠️  Hiç veri çekilemedi. İnternet bağlantısını kontrol edin.")

if __name__ == "__main__":
    main()