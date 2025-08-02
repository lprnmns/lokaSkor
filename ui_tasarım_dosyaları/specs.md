# Detaylı UI ve Animasyon Özellikleri

## 1. Tasarım Sistemi ve Bileşenler (Components)

*   **Renkler:** Sağlanan CSS değişkenleri (`:root` ve `.dark`) temel alınacaktır.
    *   `--primary`: Ana CTA butonları, aktif linkler, seçili öğelerin çerçeveleri, önemli ikonlar.
    *   `--secondary`: İkincil butonlar, pasif arkaplanlar.
    *   `--background` / `--foreground`: Sayfa arkaplanı ve ana metin rengi.
    *   `--card` / `--card-foreground`: Tüm bilgi kartlarının arkaplanı ve metin rengi.
    *   `--destructive`: Silme butonları/ikonları, düşük skor göstergeleri, negatif uyarılar.
    *   `--border`, `--input`: Giriş alanlarının ve kartların sınır çizgileri.
    *   `--ring`: Bir giriş alanına odaklanıldığında (focus state) beliren vurgu halkası.
    *   `--chart-1` to `--chart-5`: Veri görselleştirmeleri için ana renkler. Özellikle Mod 2'deki ısı haritası ve karşılaştırma grafiklerinde kullanılacak.
*   **Tipografi:**
    *   `--font-sans`: Tüm arayüz metinleri (başlıklar, paragraflar, buton metinleri) için kullanılacak.
    *   Başlıklar (h1, h2): Daha kalın (Semibold veya Bold).
    *   Paragraf/Body: Normal (Regular).
*   **Gölge ve Kenar Yuvarlaklığı:**
    *   `--radius`: `0.5rem` değeri tüm buton, kart ve input alanlarında tutarlı bir şekilde kullanılacak (`border-radius: var(--radius)`).
    *   `--shadow-sm` / `--shadow`: Tıklanabilir kartlar ve elementlerin "default" hali.
    *   `--shadow-md` / `--shadow-lg`: Kartların üzerine gelindiğinde (hover state) veya seçildiğinde belirecek daha belirgin gölge.
*   **Bileşenler:**
    *   **Butonlar:**
        *   *Primary:* Dolgu rengi `var(--primary)`, metin rengi `var(--primary-foreground)`. Hover durumunda hafifçe koyulaşır veya `transform: scale(1.02)` uygulanır.
        *   *Secondary:* Dolgu rengi `var(--secondary)`, metin rengi `var(--secondary-foreground)`. Hover durumunda `var(--accent)` rengine dönebilir.
    *   **Kartlar (Cards):**
        *   Arkaplan `var(--card)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow-sm)`.
        *   Üzerine gelindiğinde (hover): `box-shadow: var(--shadow-lg)`, `border-color: var(--primary)`.
    *   **Giriş Alanları (Inputs & Dropdowns):**
        *   Arkaplan `var(--input)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`.
        *   Focus durumunda: `border-color: transparent`, `box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring)`. Bu modern ve erişilebilir bir focus stilidir.
    *   **Harita Pinleri:**
        *   SVG ikonlar kullanılacak.
        *   **Skor Pinleri (Mod 1):** Skor aralığına göre renklenir. >80 için `var(--chart-2)`, 60-80 için `var(--chart-3)`, <60 için `var(--chart-5)`.
        *   Seçili pin daha büyük (`scale(1.2)`) ve etrafında bir `ring` olur.

## 2. Animasyonlar ve Mikro-Etkileşimler

*   **Sayfa Geçişleri:** Basit ve hızlı bir `fade-in` (opaklık 0'dan 1'e) efekti.
*   **Yükleme Durumları (Loading States):**
    *   Analiz beklenirken, sonuçların geleceği yerde **iskelet yükleyiciler (skeleton loaders)** kullanılacak. Örneğin, sol paneldeki sonuç listesi yerine, parlayan gri renkte sahte liste elemanları gösterilir. Bu, kullanıcıya ne beklemesi gerektiğini gösterir.
    *   Harita yüklenirken ortada basit bir `spinner` animasyonu.
*   **Harita Etkileşimleri:**
    *   **Pinlerin Belirmesi:** Analiz bittiğinde, pinler haritaya rastgele değil, hafif bir `drop-down` (yukarıdan düşme) veya `scale-in` (küçükten büyüyerek belirme) animasyonu ile teker teker eklenir. Bu, canlı ve dinamik bir his verir.
    *   **Isı Haritası (Heatmap):** "Analiz Et" butonuna basıldığında ısı haritası aniden belirmemeli, `0.5s` süren bir `fade-in` animasyonu ile yumuşakça ortaya çıkmalı.
    *   **Odaklanma (Pan/Zoom):** Kullanıcı listeden bir sonuca tıkladığında haritanın o konuma kayması ani değil, `flyTo` gibi yumuşak bir kamera hareketiyle olmalı.
*   **Hover Efektleri:**
    *   Tıklanabilir tüm elementler (kartlar, butonlar, liste öğeleri) üzerine gelindiğinde `transition: all 0.2s ease-in-out;` ile yumuşak bir renk, gölge veya boyut değişimi yaşamalıdır.
*   **Skor Göstergesi:**
    *   Analiz sonucunda beliren "85/100" gibi sayısal skorlar, sabit durmak yerine 0'dan başlayıp hedeflenen rakama kadar hızlıca sayan bir animasyonla gösterilebilir. Bu, sonucu daha tatmin edici ve "kazanılmış" hissettirir.
*   **Sidebar Animasyonu:**
    *   Eğer Sidebar daraltılabilir yapılacaksa, bu işlem `transform: translateX(-100%)` ile akıcı bir şekilde yapılmalıdır.