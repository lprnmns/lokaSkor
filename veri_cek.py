import geopandas as gpd
import requests
import json
import pandas as pd
import time

# Overpass API'nin URL'i
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# 1. Adım: Sınır dosyamızı okuyalım
try:
    boundary = gpd.read_file("yenimahalle_sinir.geojson")
    print("Yenimahalle sınır dosyası başarıyla okundu.")
except Exception as e:
    print(f"Hata: yenimahalle_sinir.geojson dosyası bulunamadı veya okunamadı. Hata: {e}")
    exit()

# GeoDataFrame'deki ilk (ve tek) geometriyi alalım
yenimahalle_polygon = boundary.geometry.iloc[0]

# Polygon'un koordinatlarını Overpass API'nin anlayacağı formata çevirelim
# (latitude longitude latitude longitude ...)
coords = yenimahalle_polygon.exterior.coords.xy
polygon_str = " ".join([f"{y} {x}" for x, y in zip(coords[0], coords[1])])


# 2. Adım: Belirli bir etikete göre veri çeken fonksiyonu yazalım
def veri_cek(polygon_filter, tag):
    """
    Verilen coğrafi sınır (polygon) ve etikete göre Overpass API'den veri çeker.
    Örnek tag: "shop"="bakery" (Fırınlar için)
    """
    query = f"""
    [out:json];
    (
      node[{tag}](poly:"{polygon_filter}");
      way[{tag}](poly:"{polygon_filter}");
      rel[{tag}](poly:"{polygon_filter}");
    );
    out center;
    """
    
    print(f"'{tag}' için veri çekiliyor...")
    
    # ####################################################################
    # ## DEĞİŞİKLİK BURADA: İsteği GET yerine POST olarak gönderiyoruz. ##
    # ## Bu, uzun sorguların hatasız gitmesini sağlar.                 ##
    # ####################################################################
    response = requests.post(OVERPASS_URL, data={'data': query})
    
    # Başarılı bir cevap aldık mı kontrol edelim (200 OK)
    if response.status_code == 200:
        print("Veri başarıyla çekildi.")
        data = response.json()
        return data['elements']
    else:
        print(f"Hata: API'den veri çekilemedi. Hata Kodu: {response.status_code}")
        print(f"Sunucu Cevabı: {response.text}") # Sunucudan gelen hatayı da yazdıralım
        return None

# 3. Adım: Çektiğimiz veriyi işleyip CSV dosyasına kaydeden fonksiyon
def veriyi_kaydet(elements, dosya_adi):
    if elements is None or not elements:
        print(f"{dosya_adi} için kaydedilecek veri bulunamadı.")
        return

    points = []
    for element in elements:
        lat = element.get('lat') or element.get('center', {}).get('lat')
        lon = element.get('lon') or element.get('center', {}).get('lon')
        
        if lat is None or lon is None:
            continue

        name = element.get('tags', {}).get('name', 'İsimsiz')
        
        points.append({
            'isim': name,
            'enlem': lat,
            'boylam': lon
        })

    df = pd.DataFrame(points)
    df.to_csv(dosya_adi, index=False)
    print(f"Veriler başarıyla '{dosya_adi}' dosyasına kaydedildi. Toplam {len(df)} kayıt.")


# 4. Adım: Çekmek istediğimiz veri türlerini ve etiketlerini tanımlayalım
cekilecek_veriler = {
    "eczane_verileri.csv": '"amenity"="pharmacy"',
    "firin_verileri.csv": '"shop"="bakery"',
    "cafe_verileri.csv": '"amenity"="cafe"',
    "restoran_verileri.csv": '"amenity"="restaurant"',
    "market_verileri.csv": '"shop"="supermarket"',
    "hastane_verileri.csv": '"amenity"="hospital"',
    "okul_verileri.csv": '"amenity"="school"'
}

# 5. Adım: Döngü ile tüm veri türlerini çekip kaydedelim
for dosya, etiket in cekilecek_veriler.items():
    veriler = veri_cek(polygon_str, etiket)
    veriyi_kaydet(veriler, dosya)
    # API'yi yormamak için her istek arasında kısa bir süre bekleyelim
    time.sleep(5) 

print("\nTüm veri çekme işlemleri tamamlandı!")