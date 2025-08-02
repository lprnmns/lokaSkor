# Kullanıcı Akışı ve Prototip Yapısı

## 1. Kullanıcı Akışı (User Flow)

1.  **Landing Page / Ana Ekran:**
    *   Kullanıcıyı projenin değer önerisiyle karşılar: "İşletmeniz için en doğru konumu zekayla bulun."
    *   Net ve büyük bir Ana Eylem Çağrısı (CTA) butonu: "**Analize Başla**".

2.  **Adım 1: İşletme Türü Seçimi:**
    *   Kullanıcı "Analize Başla" butonuna tıklar.
    *   Ekrana işletme türlerini temsil eden, ikonlu ve büyük kartlar gelir: [Eczane], [Fırın], [Market], [Cafe], [Restoran].
    *   Kullanıcı birini seçer. Seçilen kart, belirgin bir şekilde vurgulanır.

3.  **Adım 2: Analiz Modu Seçimi:**
    *   İşletme türü seçildikten sonra, kullanıcıya iki net seçenek sunulur:
        *   **Kart 1 (Mod 1):** Başlık: "**Belirli Dükkanları Karşılaştır**". Açıklama: "Aklınızdaki birden fazla lokasyonun potansiyelini analiz edin."
        *   **Kart 2 (Mod 2):** Başlık: "**Yeni Fırsatları Keşfet**". Açıklama: "Seçtiğiniz bölgedeki en uygun konumları sizin için bulalım."
    *   Kullanıcı bir moda tıklar.

4.  **Adım 3A: Analiz Ekranı (Mod 1 - Karşılaştırma):**
    *   Arayüz iki ana bölümden oluşur: Sol taraf kontrol paneli, sağ taraf interaktif harita.
    *   **Sol Panel:**
        *   Bir başlık: "Karşılaştırılacak Adresler".
        *   Bir giriş alanı (input): "Adresi veya konumu girin..."
        *   `[+ Adres Ekle]` butonu.
        *   Kullanıcı adres ekledikçe, adresler bir liste halinde altında belirir. Her adresin yanında bir `[Sil]` ikonu bulunur.
        *   En az iki adres girildiğinde `[Konumları Analiz Et]` butonu aktif hale gelir.
    *   **Analiz Sonrası:**
        *   Kullanıcı butona tıklar. Bir yükleme animasyonu gösterilir.
        *   **Sol Panel:** Adres listesi, karşılaştırmalı bir tabloya dönüşür. Her lokasyon için:
            *   **Genel Skor (100 üzerinden)**
            *   Rakip Yoğunluğu (Düşük/Orta/Yüksek)
            *   Yaya Erişimi (Puanı)
            *   Hedef Kitle Uyumu (Puanı)
        *   **Harita:** Girilen tüm adresler, skorlarına göre renklendirilmiş pin'ler ile gösterilir. Pin'e tıklayınca detaylı bir popup açılır.

5.  **Adım 3B: Analiz Ekranı (Mod 2 - Keşif):**
    *   Yine sol panel ve sağ harita düzeni.
    *   **Sol Panel:**
        *   Başlık: "Bölge Seçin"
        *   Birbirine bağlı dropdown menüler: `[İl Seçiniz]`, `[İlçe Seçiniz]`, `[Mahalle Seçiniz]`.
        *   Mahalle seçildiğinde `[Potansiyeli Yüksek Bölgeleri Göster]` butonu aktif olur.
    *   **Analiz Sonrası:**
        *   Kullanıcı butona tıklar. Yükleme animasyonu.
        *   **Harita:** Seçilen mahalle üzerinde bir **ısı haritası (heatmap)** belirir. Koyu renkli alanlar en yüksek potansiyele sahip bölgeleri gösterir.
        *   **Sol Panel:** Haritadaki en yüksek skorlu 3-5 bölgenin/caddenin listesi belirir. "En Yüksek Potansiyelli Alanlar:" başlığı altında listelenir. Her bir liste öğesine tıklayınca harita o bölgeye odaklanır.

## 2. Genel Prototip Yapısı (Wireframe Mantığı)

*   **Genel Yerleşim:**
    *   Solda, ekranın yaklaşık %30-35'ini kaplayan, daraltılabilir bir **Sidebar**. Bu panel tüm kontrolleri, filtreleri ve analiz sonuç listelerini barındırır.
    *   Sağda, ekranın geri kalanını kaplayan tam ekran **Harita**.
*   **Ana Ekranlar:**
    1.  **Giriş Sayfası:** Tek odaklı, büyük ve net.
    2.  **Seçim Akışı Sayfaları (İşletme/Mod):** Tam ekran, büyük, tıklanabilir kartlar. Minimalist ve odaklı.
    3.  **Ana Analiz Paneli:** Yukarıda açıklanan Sidebar + Harita düzeni. Bu, uygulamanın kalbidir.
    4.  **Detay Popup/Modal:** Haritadaki bir pin'e veya bir sonuç listesi öğesine tıklandığında açılan, daha detaylı veri ve grafikler sunan pencere.