#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
OpenStreetMap Veri Güncelleme Scripti
Bu script OSM verilerini manuel olarak günceller
"""

import os
import sys
import logging
from datetime import datetime

# Logging ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def update_osm_data():
    """OpenStreetMap verilerini güncelle"""
    logging.info("=" * 50)
    logging.info("OpenStreetMap Veri Güncelleme İşlemi Başlatılıyor")
    logging.info("=" * 50)
    
    try:
        # fetch_osm_data modülünü import et
        from fetch_osm_data import OSMDataFetcher
        
        # OSM verilerini çek
        logging.info("Veri çekme işlemi başlatılıyor...")
        fetcher = OSMDataFetcher()
        results = fetcher.fetch_all_pois()
        
        # Özet rapor
        logging.info("\n" + "=" * 30)
        logging.info("ÖZET RAPOR")
        logging.info("=" * 30)
        
        total_records = 0
        success_count = 0
        
        for category, count in results.items():
            if count > 0:
                logging.info(f"✅ {category.capitalize()}: {count} kayıt")
                success_count += 1
            else:
                logging.info(f"⚠️ {category.capitalize()}: Veri bulunamadı")
            total_records += count
        
        logging.info("-" * 30)
        logging.info(f"Toplam: {total_records} kayıt")
        logging.info(f"Başarılı kategoriler: {success_count}/{len(results)}")
        logging.info("=" * 30)
        
        if total_records > 0:
            logging.info("✅ Veri güncelleme işlemi başarıyla tamamlandı!")
            return True
        else:
            logging.warning("⚠️ Hiç veri çekilemedi. İnternet bağlantısını kontrol edin.")
            return False
            
    except ImportError as e:
        logging.error(f"❌ fetch_osm_data modülü bulunamadı: {str(e)}")
        logging.error("fetch_osm_data.py dosyasının mevcut olduğundan emin olun.")
        return False
    except Exception as e:
        logging.error(f"❌ Veri güncelleme hatası: {str(e)}")
        return False

def show_current_data_status():
    """Mevcut veri durumunu göster"""
    import glob
    
    logging.info("\n" + "=" * 30)
    logging.info("MEVCUT VERİ DURUMU")
    logging.info("=" * 30)
    
    # OSM dosyalarını kontrol et
    osm_files = glob.glob('*_osm.csv')
    csv_files = glob.glob('*_temiz.csv')
    
    if osm_files:
        logging.info("OpenStreetMap Verileri:")
        for file in sorted(osm_files):
            try:
                import pandas as pd
                df = pd.read_csv(file)
                category = os.path.basename(file).split('_')[0]
                logging.info(f"  ✅ {category.capitalize()}: {len(df)} kayıt ({file})")
            except Exception as e:
                logging.error(f"  ❌ {file}: Okunamadı ({str(e)})")
    else:
        logging.info("OpenStreetMap Verileri: Bulunamadı")
    
    if csv_files:
        logging.info("\nYerel CSV Verileri:")
        for file in sorted(csv_files):
            try:
                import pandas as pd
                df = pd.read_csv(file)
                category = os.path.basename(file).split('_')[0]
                logging.info(f"  📁 {category.capitalize()}: {len(df)} kayıt ({file})")
            except Exception as e:
                logging.error(f"  ❌ {file}: Okunamadı ({str(e)})")
    else:
        logging.info("\nYerel CSV Verileri: Bulunamadı")
    
    logging.info("=" * 30)

def main():
    """Ana fonksiyon"""
    print("OpenStreetMap Veri Güncelleme Aracı")
    print("=" * 40)
    
    # Mevcut durumu göster
    show_current_data_status()
    
    # Kullanıcıdan onay al
    try:
        response = input("\nOSM verilerini güncellemek istiyor musunuz? (e/h): ").lower().strip()
        if response not in ['e', 'evet', 'y', 'yes']:
            print("İşlem iptal edildi.")
            return
    except KeyboardInterrupt:
        print("\nİşlem iptal edildi.")
        return
    
    # Güncelleme işlemini başlat
    start_time = datetime.now()
    success = update_osm_data()
    end_time = datetime.now()
    
    # Sonuç raporu
    duration = (end_time - start_time).total_seconds()
    logging.info(f"\nİşlem süresi: {duration:.1f} saniye")
    
    if success:
        logging.info("🎉 Güncelleme tamamlandı! Flask uygulamasını yeniden başlatabilirsiniz.")
        print("\nFlask uygulamasını yeniden başlatmak için:")
        print("  python app.py")
    else:
        logging.error("❌ Güncelleme başarısız oldu. Mevcut veriler kullanılmaya devam edecek.")

if __name__ == "__main__":
    main()