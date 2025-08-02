# Detaylı Analiz Sistemi Yeniden Tasarım - Gereksinimler

## 📋 Proje Özeti
Mevcut detaylı analiz modal sistemini, interaktif kategori-bazlı detay gösterim sistemine dönüştürme

## 🎯 Ana Hedefler

### 1. Modal Kaldırma
- ❌ **Eski**: Tek büyük modal popup
- ✅ **Yeni**: Her kategori için expandable detay alanları

### 2. Kategori-Bazlı Detaylar
#### 2.1 Hastane Yakınlığı
- **Trigger**: Hastane kategori kartına tıklama
- **Gösterim**: En yakın hastane bilgileri, mesafe, harita mini görünümü

#### 2.2 Önemli Yerler  
- **Trigger**: Önemli yerler kategori kartına tıklama
- **Gösterim**: Metro, eczane, market vb. yakın yerler listesi

#### 2.3 Demografi Analizi
- **Trigger**: Demografi kategori kartına tıklama
- **Gösterim**: 
  - 🍕 **Pasta chart**: Demografik skorun bileşenleri (yaş, gelir, yoğunluk)
  - 📊 **Detay bilgiler**: Nüfus, yaş profili, gelir düzeyi

#### 2.4 Rekabet Analizi
- **Trigger**: Rekabet analizi kategori kartına tıklama  
- **Gösterim**:
  - 📍 **Sıralama**: Yakından uzağa rakip listesi
  - 📏 **Scroll**: Y-scroll ile en yakın 5 rakip görünür
  - 💰 **Puan etkisi**: Her rakip için puan kırılımı

## 🔧 Teknik Gereksinimler

### 3.1 UI/UX
- **Responsive design**: Mobile/tablet uyumlu
- **Smooth animations**: Expand/collapse efektleri
- **Clear navigation**: Hangi detayın açık olduğu belli olmalı
- **Data visualization**: Charts ve progress barlar

### 3.2 Data Management
- **Mevcut API**: Şu anki backend yapısını koruma
- **Data mapping**: API response'unu yeni UI yapısına mapping
- **State management**: Hangi detayların açık olduğunu takip

### 3.3 Performance
- **Lazy loading**: Detaylar sadece tıklandığında yüklensin
- **Memory efficiency**: Açılmayan detaylar DOM'da olmasın
- **Smooth scrolling**: Large lists için virtualization

## 📱 Kullanıcı Deneyimi

### 4.1 Ana Akış
1. Kullanıcı karşılaştırma sonuçlarını görür
2. Herhangi bir kategori kartına tıklar
3. O kategorinin detayları aynı sayfada expand olur
4. Diğer kategorilere geçiş yapabilir
5. Detayları kapatabilir

### 4.2 Visual Feedback
- **Loading states**: Detay yüklenirken spinner
- **Hover effects**: Tıklanabilir öğeler belirgin
- **Active states**: Hangi kategori açık belli olsun
- **Accessibility**: Keyboard navigation support

## 🎨 Tasarım Gereksinimleri

### 5.1 Pasta Chart (Demografi)
- **Kütüphane**: Chart.js veya benzeri lightweight library
- **Renkler**: Brand color palette kullanımı
- **Labels**: Her dilim için açıklayıcı etiketler
- **Interactive**: Hover'da detay bilgileri

### 5.2 Rekabet Listesi
- **Card design**: Her rakip için kart yapısı
- **Distance indicator**: Mesafe görsel gösterimi  
- **Score impact**: Pozitif/negatif etki renklendirme
- **Virtual scrolling**: Performance için

### 5.3 Harita Mini View
- **Leaflet integration**: Mevcut harita sistemi kullanımı
- **Pin clustering**: Yakın yerler için
- **Zoom controls**: Mini harita kontrolleri

## ⚡ Performans Kriterleri
- **First paint**: < 100ms kategori açılışı
- **Data loading**: < 500ms detail fetch
- **Smooth scrolling**: 60fps scroll performance
- **Memory usage**: < 50MB additional per detail view

## 🧪 Test Gereksinimleri
- **Unit tests**: Her kategori component için
- **Integration tests**: API data mapping
- **Visual regression**: UI tutarlılık testleri
- **Performance tests**: Large dataset handling

## 📋 Kabul Kriterleri
- [ ] Modal sistem tamamen kaldırılmış
- [ ] Her kategori için detay gösterim çalışıyor
- [ ] Pasta chart demografi için implement edilmiş
- [ ] Rekabet listesi scroll ile çalışıyor
- [ ] Mobile responsive tasarım
- [ ] Performance kriterleri karşılanmış
- [ ] Mevcut fonksiyonalite bozulmamış
