# data_manager.py (Düzeltilmiş Versiyon)

import geopandas as gpd
import pandas as pd
import glob
from scipy.spatial import cKDTree
import numpy as np
import os # <-- EKSİK OLAN VE ŞİMDİ EKLENEN SATIR

class DataManager:
    def __init__(self):
        print("DataManager başlatılıyor: Tüm veriler hafızaya yükleniyor...")
        self.grid_points = None
        self.demografi_data = None
        self.neighborhood_polygons = None
        self.poi_data = {} # POI: Point of Interest (Hastane, Eczane vb.)
        self.poi_trees = {} # Hızlı arama için KDTree'ler

        self._load_all_data()
        print("Tüm veriler başarıyla yüklendi ve hafızaya alındı.")

    def _load_all_data(self):
        # 1. Analiz edilecek ızgara noktalarını yükle
        self.grid_points = gpd.read_file("yenimahalle_grid.geojson")

        # 2. Demografi verisini yükle
        self.demografi_data = pd.read_csv("yenimahalle_demografi.csv")
        self.demografi_data['mahalle_key'] = self.demografi_data['mahalle'].str.strip().str.lower().str.replace(' ', '').str.replace('ı','i').str.replace('ş','s').str.replace('ğ','g').str.replace('ç','c').str.replace('ö','o').str.replace('ü','u')

        # 3. Mahalle poligonlarını yükle ve demografi ile birleştir
        mahalle_dosyalari = glob.glob('mahalle_geojson/*.geojson')
        gdf_listesi = []
        for dosya in mahalle_dosyalari:
            mahalle_gdf = gpd.read_file(dosya)
            # 'os' modülünü burada kullandığımız için import etmek zorundayız
            dosya_adi = os.path.basename(dosya)
            mahalle_adi = dosya_adi.replace('.geojson', '').replace('_', ' ')
            mahalle_gdf['mahalle'] = mahalle_adi
            gdf_listesi.append(mahalle_gdf)
        
        tum_mahalleler_gdf = gpd.GeoDataFrame(pd.concat(gdf_listesi, ignore_index=True))
        birlestirilmis_gdf = tum_mahalleler_gdf.dissolve(by='mahalle', aggfunc='first').reset_index()
        birlestirilmis_gdf['mahalle_key'] = birlestirilmis_gdf['mahalle'].str.strip().str.lower().str.replace(' ', '').str.replace('ı','i').str.replace('ş','s').str.replace('ğ','g').str.replace('ç','c').str.replace('ö','o').str.replace('ü','u')
        self.neighborhood_polygons = birlestirilmis_gdf.merge(self.demografi_data, on='mahalle_key', how='left')


        # 4. Tüm ilgi noktalarını (hastane, eczane, metro vb.) yükle
        self._load_poi_data()

    def _load_poi_data(self):
        """POI verilerini yükle (önce OSM, yoksa temiz CSV'ler)"""
        # Önce OSM verilerini kontrol et
        osm_files = glob.glob('*_osm.csv')
        poi_files = []
        
        if osm_files:
            print("OpenStreetMap verileri bulundu, bunlar kullanılacak")
            poi_files = osm_files
        else:
            print("OpenStreetMap verileri bulunamadı, temiz CSV'ler kullanılacak")
            poi_files = glob.glob('*_temiz.csv')
        
        for file in poi_files:
            # OSM dosyaları için: hastane_osm.csv -> hastane
            # Temiz dosyalar için: hastane_temiz.csv -> hastane
            key = os.path.basename(file).split('_')[0]
            
            try:
                df = pd.read_csv(file)
                if 'enlem' in df.columns and 'boylam' in df.columns:
                    # Geometri sütunu oluştur
                    gdf = gpd.GeoDataFrame(
                        df, geometry=gpd.points_from_xy(df.boylam, df.enlem), crs="EPSG:4326"
                    )
                    
                    # Veriyi sakla
                    self.poi_data[key] = gdf
                    
                    # UTM koordinatlarına dönüştürüp KDTree oluştur
                    gdf_utm = gdf.to_crs(epsg=32636)
                    coordinates = np.array(list(gdf_utm.geometry.apply(lambda p: (p.x, p.y))))
                    
                    if coordinates.size > 0:
                        self.poi_trees[key] = cKDTree(coordinates)
                    
                    source_type = "OpenStreetMap" if "_osm.csv" in file else "Yerel CSV"
                    print(f"{key} verileri yüklendi ({source_type}): {len(df)} kayıt")
                else:
                    print(f"Uyarı: {file} dosyasında enlem/boylam sütunları bulunamadı")
            except Exception as e:
                print(f"Hata: {key} verileri yüklenirken sorun oluştu: {e}")

# Uygulama boyunca kullanılacak tek bir DataManager nesnesi oluşturuyoruz
data_manager = DataManager()