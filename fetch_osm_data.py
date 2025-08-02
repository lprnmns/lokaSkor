#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
OpenStreetMap Veri Çekici
Yenimahalle bölgesi için POI verilerini OpenStreetMap'ten çeker
"""

import requests
import pandas as pd
import os
import time
import logging

# Logging ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

class OSMDataFetcher:
    def __init__(self, bbox=None):
        """
        OpenStreetMap'ten POI verilerini çekmek için sınıf
        
        Args:
            bbox: [south, west, north, east] formatında bounding box
                  None ise Yenimahalle sınırları kullanılır
        """
        # Yenimahalle sınırları (varsayılan)
        self.bbox = bbox or [39.85, 32.65, 40.05, 32.95]
        self.overpass_url = "https://overpass-api.de/api/interpreter"
        self.timeout = 25
        self.request_delay = 2  # API rate limiting için
        
        # OSM kategorileri ve eşleşen Türkçe isimler
        self.osm_categories = {
            'hastane': 'hospital',
            'eczane': 'pharmacy', 
            'metro': 'station',
            'universite': 'university',
            'avm': 'mall'
        }
    
    def fetch_all_pois(self):
        """
        Tüm POI kategorilerini çek ve CSV'lere kaydet
        
        Returns:
            dict: Her kategori için çekilen kayıt sayısı
        """
        results = {}
        
        logging.info("OpenStreetMap veri çekme işlemi başlatılıyor...")
        logging.info(f"Bounding box: {self.bbox}")
        
        for tr_name, osm_tag in self.osm_categories.items():
            try:
                logging.info(f"{tr_name.capitalize()} verileri çekiliyor...")
                
                if tr_name == 'metro':
                    df = self.fetch_metro_stations()
                elif tr_name == 'universite':
                    df = self.fetch_universities()
                elif tr_name == 'avm':
                    df = self.fetch_malls()
                else:
                    df = self.fetch_poi_category(osm_tag)
                
                # Sonuçları kaydet
                if df is not None and not df.empty:
                    csv_path = f"{tr_name}_osm.csv"
                    df.to_csv(csv_path, index=False, encoding='utf-8')
                    results[tr_name] = len(df)
                    logging.info(f"✅ {len(df)} {tr_name} kaydedildi: {csv_path}")
                else:
                    logging.warning(f"⚠️ {tr_name} için veri bulunamadı")
                    results[tr_name] = 0
                
                # API limitlerini aşmamak için bekle
                if tr_name != list(self.osm_categories.keys())[-1]:  # Son kategori değilse bekle
                    time.sleep(self.request_delay)
                
            except Exception as e:
                logging.error(f"❌ {tr_name} verileri çekilirken hata: {str(e)}")
                results[tr_name] = 0
        
        return results
    
    def fetch_poi_category(self, osm_tag):
        """
        Belirli bir POI kategorisini çek (hastane, eczane için)
        
        Args:
            osm_tag: OpenStreetMap tag'i (örn. 'hospital', 'pharmacy')
            
        Returns:
            DataFrame: POI verileri
        """
        query = f"""
        [out:json][timeout:{self.timeout}];
        (
          node["amenity"="{osm_tag}"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          way["amenity"="{osm_tag}"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          relation["amenity"="{osm_tag}"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
        );
        out center meta;
        """
        
        return self._execute_query(query, osm_tag)
    
    def fetch_metro_stations(self):
        """
        Metro istasyonlarını çek (özel sorgu)
        """
        query = f"""
        [out:json][timeout:{self.timeout}];
        (
          node["station"="subway"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          node["railway"="station"]["subway"="yes"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          node["public_transport"="station"]["subway"="yes"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          node["railway"="station"]["station"="subway"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
        );
        out center meta;
        """
        
        return self._execute_query(query, "metro")
    
    def fetch_universities(self):
        """
        Üniversiteleri çek (university + college)
        """
        query = f"""
        [out:json][timeout:{self.timeout}];
        (
          node["amenity"="university"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          way["amenity"="university"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          relation["amenity"="university"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          node["amenity"="college"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          way["amenity"="college"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
        );
        out center meta;
        """
        
        return self._execute_query(query, "universite")
    
    def fetch_malls(self):
        """
        AVM'leri çek (mall + shopping center)
        """
        query = f"""
        [out:json][timeout:{self.timeout}];
        (
          node["shop"="mall"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          way["shop"="mall"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          relation["shop"="mall"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          node["amenity"="marketplace"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
          way["amenity"="marketplace"]({self.bbox[0]},{self.bbox[1]},{self.bbox[2]},{self.bbox[3]});
        );
        out center meta;
        """
        
        return self._execute_query(query, "avm")
    
    def _execute_query(self, query, category_name):
        """
        Overpass API sorgusunu çalıştır ve sonuçları işle
        
        Args:
            query: Overpass QL sorgusu
            category_name: Kategori ismi (logging için)
            
        Returns:
            DataFrame: İşlenmiş POI verileri
        """
        try:
            # API'ye sorgu gönder
            response = requests.get(
                self.overpass_url, 
                params={'data': query},
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                logging.error(f"API hatası ({category_name}): {response.status_code} - {response.text[:200]}")
                return None
            
            data = response.json()
            
            # Sonuçları işle
            pois = []
            for element in data.get('elements', []):
                try:
                    # Koordinatları al
                    if element['type'] == 'node':
                        lat, lon = element['lat'], element['lon']
                    else:
                        center = element.get('center', {})
                        lat, lon = center.get('lat'), center.get('lon')
                    
                    # Koordinat kontrolü
                    if not lat or not lon:
                        continue
                    
                    # İsim bilgisi (Türkçe öncelikli)
                    tags = element.get('tags', {})
                    name = (tags.get('name:tr') or 
                           tags.get('name') or 
                           f"Bilinmeyen {category_name.capitalize()}")
                    
                    pois.append({
                        'isim': name,
                        'enlem': lat,
                        'boylam': lon,
                        'osm_id': element['id']
                    })
                    
                except Exception as e:
                    logging.warning(f"Element işlenirken hata ({category_name}): {str(e)}")
                    continue
            
            # DataFrame oluştur
            if pois:
                return pd.DataFrame(pois)
            else:
                return pd.DataFrame(columns=['isim', 'enlem', 'boylam', 'osm_id'])
                
        except requests.exceptions.Timeout:
            logging.error(f"Timeout hatası ({category_name}): {self.timeout} saniye aşıldı")
            return None
        except requests.exceptions.ConnectionError:
            logging.error(f"Bağlantı hatası ({category_name}): İnternet bağlantısını kontrol edin")
            return None
        except requests.exceptions.RequestException as e:
            logging.error(f"İstek hatası ({category_name}): {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Beklenmeyen hata ({category_name}): {str(e)}")
            return None


if __name__ == "__main__":
    # Script doğrudan çalıştırıldığında tüm verileri çek
    fetcher = OSMDataFetcher()
    results = fetcher.fetch_all_pois()
    
    # Özet rapor
    logging.info("\n===== ÖZET RAPOR =====")
    total_records = 0
    for category, count in results.items():
        logging.info(f"{category.capitalize()}: {count} kayıt")
        total_records += count
    
    logging.info(f"Toplam: {total_records} kayıt")
    logging.info("Veri çekme işlemi tamamlandı!")