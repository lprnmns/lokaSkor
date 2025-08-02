# --- analyzer.py (NİHAİ ve EN GÜNCEL VERSİYON) ---

import pandas as pd
import geopandas as gpd
import glob
import os
import numpy as np

def normalize(s):
    # NaN değerleri 0 olarak doldurarak hesaplamayı garantile
    s = s.fillna(0)
    min_val = s.min()
    max_val = s.max()
    if min_val == max_val: return pd.Series([0.5] * len(s), index=s.index)
    return (s - min_val) / (max_val - min_val)

def full_analysis(isletme_turu, agirlik_dict):
    # --- 1. Temel Verileri Yükle ve Birleştir ---
    mahalle_dosyalari = glob.glob('mahalle_geojson/*.geojson')
    gdf_listesi = []
    for dosya in mahalle_dosyalari:
        mahalle_gdf = gpd.read_file(dosya)
        dosya_adi = os.path.basename(dosya)
        mahalle_adi = dosya_adi.replace('.geojson', '').replace('_', ' ')
        mahalle_gdf['mahalle'] = mahalle_adi
        gdf_listesi.append(mahalle_gdf)
    
    tum_mahalleler_gdf = gpd.GeoDataFrame(pd.concat(gdf_listesi, ignore_index=True))
    analiz_df = tum_mahalleler_gdf.dissolve(by='mahalle', aggfunc='first').reset_index()

    demografi_df = pd.read_csv('yenimahalle_demografi.csv')
    
    mahalleler_birlestirilmis_gdf = analiz_df.copy() # isim değişikliği
    mahalleler_birlestirilmis_gdf['mahalle_key'] = mahalleler_birlestirilmis_gdf['mahalle'].str.strip().str.lower().str.replace(' ', '').str.replace('ı','i').str.replace('ş','s').str.replace('ğ','g').str.replace('ç','c').str.replace('ö','o').str.replace('ü','u')
    demografi_df['mahalle_key'] = demografi_df['mahalle'].str.strip().str.lower().str.replace(' ', '').str.replace('ı','i').str.replace('ş','s').str.replace('ğ','g').str.replace('ç','c').str.replace('ö','o').str.replace('ü','u')

    analiz_df = mahalleler_birlestirilmis_gdf.merge(demografi_df, on='mahalle_key', how='inner')
    analiz_df = analiz_df.rename(columns={'mahalle_x': 'mahalle'})
    analiz_df = analiz_df.drop(columns=['mahalle_y', 'mahalle_key'])

    isletme_dosyalari = glob.glob('*_temiz.csv')
    isletme_gdf_dict = {}
    for dosya in isletme_dosyalari:
        anahtar = dosya.split('_')[0]
        df = pd.read_csv(dosya)
        gdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df.boylam, df.enlem), crs="EPSG:4326")
        isletme_gdf_dict[anahtar] = gdf

    analiz_df_4326 = analiz_df.to_crs(crs="EPSG:4326")
    for tur, isletme_gdf in isletme_gdf_dict.items():
        birlesmis = gpd.sjoin(isletme_gdf, analiz_df_4326, how="inner", predicate="within")
        sayim = birlesmis['mahalle'].value_counts()
        sutun_adi = f"{tur}_sayisi"
        analiz_df[sutun_adi] = analiz_df['mahalle'].map(sayim).fillna(0).astype(int)

    # --- 2. Metrikleri Hesapla ve Eksikleri Doldur (B Planı ile) ---
    tum_metrikler = [f"{tur}_basina_kisi" for tur in isletme_gdf_dict.keys()]
    for tur in isletme_gdf_dict.keys():
        sayi_sutun = f"{tur}_sayisi"
        metrik_sutun = f"{tur}_basina_kisi"
        analiz_df[metrik_sutun] = analiz_df['nufus'] / analiz_df[sayi_sutun].replace(0, np.nan)

    doldurulmus_analiz_df = analiz_df.copy()
    for metrik_sutunu in tum_metrikler:
        if metrik_sutunu in doldurulmus_analiz_df.columns:
            genel_ortalama = doldurulmus_analiz_df[metrik_sutunu].mean()
            eksik_indeksler = doldurulmus_analiz_df[doldurulmus_analiz_df[metrik_sutunu].isnull()].index
            for index in eksik_indeksler:
                eksik_mahalle_geometri = doldurulmus_analiz_df.loc[index].geometry
                komsu_skorlari = [komsu[metrik_sutunu] for i, komsu in doldurulmus_analiz_df[doldurulmus_analiz_df[metrik_sutunu].notna()].iterrows() if index != i and eksik_mahalle_geometri.intersects(komsu.geometry)]
                if komsu_skorlari:
                    doldurulmus_analiz_df.loc[index, metrik_sutunu] = sum(komsu_skorlari) / len(komsu_skorlari)
                else:
                    doldurulmus_analiz_df.loc[index, metrik_sutunu] = genel_ortalama

    final_df = doldurulmus_analiz_df

    # --- 3. Nihai Skorları Hesapla ---
    final_df['alan_km2'] = final_df.to_crs(epsg=32636).geometry.area / 1_000_000
    final_df['nufus_yogunlugu'] = final_df['nufus'] / final_df['alan_km2']
    final_df['yogunluk_skoru'] = normalize(final_df['nufus_yogunlugu'])
    ihtiyac_skor_sutun = f"{isletme_turu}_ihtiyac_skoru"
    ihtiyac_basina_kisi_sutun = f"{isletme_turu}_basina_kisi"
    final_df[ihtiyac_skor_sutun] = normalize(final_df[ihtiyac_basina_kisi_sutun])
    
    final_df['firsat_skoru'] = (
        final_df[ihtiyac_skor_sutun].fillna(0) * agirlik_dict.get('ihtiyac_agirligi', 0.5) +
        final_df['yogunluk_skoru'].fillna(0) * agirlik_dict.get('yogunluk_agirligi', 0.5)
    )
    final_df['firsat_skoru'] = (normalize(final_df['firsat_skoru']) * 100).round(1)

    return final_df[['mahalle', 'geometry', 'firsat_skoru']]