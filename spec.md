# Detaylı Analiz Sistemi - Teknik Spesifikasyon

## 🏗️ Mimari Genel Bakış

### 1.1 Mevcut Sistem
```
[Kategori Kartı] → [Detaylı Analiz Butonu] → [Modal Popup]
```

### 1.2 Yeni Sistem  
```
[Kategori Kartı] → [Click Handler] → [Expandable Detail Panel] → [Category-Specific Content]
```

## 📁 Dosya Yapısı

### 2.1 Yeni Dosyalar
```
static/js/components/
├── DetailPanelManager.js      # Ana detail panel yönetimi
├── CategoryExpander.js        # Expand/collapse logic
├── charts/
│   ├── DemographicChart.js    # Pasta chart component
│   └── ChartUtils.js          # Chart yardımcı fonksiyonlar
└── panels/
    ├── HospitalDetailPanel.js # Hastane detay paneli
    ├── ImportantPlacesPanel.js # Önemli yerler paneli
    ├── DemographicPanel.js    # Demografi detay paneli
    └── CompetitorPanel.js     # Rekabet analizi paneli
```

### 2.2 Güncellenen Dosyalar
```
static/js/mod1_comparison.js   # Ana comparison logic güncellemesi
static/css/mod1_comparison.css # Detail panel stilleri
templates/mod1_location_comparison.html # HTML structure
```

## 🎨 CSS Yapısı

### 3.1 Detail Panel Container
```css
.detail-panel-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  background: var(--ui-slate-50);
  border-radius: var(--ui-radius-lg);
  margin-top: var(--ui-spacing-md);
}

.detail-panel-container.expanded {
  max-height: 1000px;
  transition: max-height 0.4s ease-in;
}
```

### 3.2 Category-Specific Styles
```css
/* Hospital Detail Panel */
.hospital-detail-panel {
  padding: var(--ui-spacing-lg);
  border-left: 4px solid var(--ui-medical-blue);
}

/* Demographic Chart Container */
.demographic-chart-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ui-spacing-lg);
  align-items: center;
}

/* Competitor List */
.competitor-list {
  max-height: 400px;
  overflow-y: auto;
  padding: var(--ui-spacing-md);
}

.competitor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ui-spacing-md);
  border-bottom: 1px solid var(--ui-slate-200);
}
```

## 🧩 JavaScript Komponent Yapısı

### 4.1 DetailPanelManager Class
```javascript
class DetailPanelManager {
  constructor(comparisonInstance) {
    this.comparison = comparisonInstance;
    this.activePanels = new Set();
    this.panelData = new Map();
  }
  
  // Panel açma/kapatma
  togglePanel(categoryType, locationId) { }
  
  // Panel data yükleme
  loadPanelData(categoryType, locationData) { }
  
  // Panel render
  renderPanel(categoryType, container, data) { }
}
```

### 4.2 CategoryExpander Class
```javascript
class CategoryExpander {
  constructor(panelManager) {
    this.panelManager = panelManager;
    this.animationDuration = 300;
  }
  
  // Smooth expand animation
  expandPanel(container) { }
  
  // Smooth collapse animation  
  collapsePanel(container) { }
  
  // Height calculation for animation
  calculateExpandedHeight(content) { }
}
```

### 4.3 DemographicChart Class
```javascript
class DemographicChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.chart = null;
  }
  
  // Pasta chart oluşturma
  createPieChart(demographicData) {
    const config = {
      type: 'pie',
      data: {
        labels: ['Yaş Profili', 'Gelir Düzeyi', 'Nüfus Yoğunluğu'],
        datasets: [{
          data: [
            demographicData.age_score,
            demographicData.income_score, 
            demographicData.density_score
          ],
          backgroundColor: [
            'hsl(210, 100%, 70%)',  // Mavi
            'hsl(120, 60%, 60%)',   // Yeşil  
            'hsl(45, 100%, 65%)'    // Sarı
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    };
    
    this.chart = new Chart(this.canvas, config);
  }
  
  // Chart update
  updateChart(newData) { }
  
  // Chart destroy  
  destroy() { }
}
```

## 📊 Data Mapping Spesifikasyonu

### 5.1 Hospital Detail Data
```javascript
const hospitalDetailData = {
  nearest_hospital: {
    name: location.details.nearby_places.hospital.name,
    distance: location.details.nearby_places.hospital.distance,
    coordinates: { lat: 39.xxxx, lng: 32.xxxx },
    score_impact: "+15 puan"
  },
  alternative_hospitals: [...], // 2-3 alternatif hastane
  accessibility_score: 85
};
```

### 5.2 Demographic Chart Data
```javascript
const demographicChartData = {
  age_score: 65,      // Yaş profili skoru (0-100)
  income_score: 78,   // Gelir düzeyi skoru (0-100)  
  density_score: 45,  // Nüfus yoğunluğu skoru (0-100)
  total_score: 62,    // Toplam demografi skoru
  details: {
    population: "45,230 kişi",
    age_profile: "25-45 yaş ağırlıklı", 
    income_level: "Orta-üst gelir"
  }
};
```

### 5.3 Competitor List Data
```javascript
const competitorData = {
  total_competitors: 12,
  visible_competitors: 5, // İlk 5 tanesi görünür
  competitors: [
    {
      name: "Eczane A",
      distance: "150m",
      distance_meters: 150,
      score_impact: -8,
      impact_description: "Çok yakın rakip",
      coordinates: { lat: 39.xxxx, lng: 32.xxxx }
    },
    // ... daha fazla rakip
  ].sort((a, b) => a.distance_meters - b.distance_meters)
};
```

## 🔄 Event Flow Diagramı

### 6.1 Panel Açma Akışı
```
1. User clicks category card
   ↓
2. CategoryExpander.expandPanel()
   ↓  
3. DetailPanelManager.loadPanelData()
   ↓
4. API call (if needed) / Data formatting
   ↓
5. Component-specific render (Hospital/Demo/Competitor)
   ↓
6. Smooth animation to expanded state
   ↓
7. Panel content fully visible
```

### 6.2 Chart Rendering Flow
```
1. DemographicPanel.render()
   ↓
2. Create canvas element
   ↓
3. DemographicChart.createPieChart()
   ↓
4. Chart.js initialization
   ↓
5. Data binding and animation
```

## 🚀 Performance Optimizasyonları

### 7.1 Lazy Loading
- Panel içeriği sadece açıldığında yüklenir
- Chart library (Chart.js) sadece demografi paneli açıldığında load edilir
- Competitor data pagination (5'li gruplar halinde)

### 7.2 Memory Management
- Kapatılan panellerin chart instance'ları destroy edilir
- Büyük data setleri WeakMap ile cache'lenir
- Event listener'lar cleanup'lanır

### 7.3 Animation Performance
- CSS transforms kullanımı (GPU acceleration)
- RequestAnimationFrame ile smooth animations
- Will-change property ile optimize edilmiş transitions

## 🧪 Test Stratejisi

### 8.1 Unit Tests
```javascript
// DetailPanelManager tests
describe('DetailPanelManager', () => {
  test('should toggle panel correctly', () => { });
  test('should load data for each category', () => { });
  test('should handle multiple panels', () => { });
});

// DemographicChart tests  
describe('DemographicChart', () => {
  test('should create pie chart with correct data', () => { });
  test('should update chart when data changes', () => { });
  test('should destroy chart properly', () => { });
});
```

### 8.2 Integration Tests
```javascript
// Full flow tests
describe('Detail Panel Integration', () => {
  test('should open hospital panel on click', () => { });
  test('should display demographic chart correctly', () => { });
  test('should scroll competitor list properly', () => { });
});
```

## 🔧 Implementation Phases

### Phase 1: Core Infrastructure
- DetailPanelManager class
- CategoryExpander class  
- Basic panel structure

### Phase 2: Hospital & Important Places
- HospitalDetailPanel implementation
- ImportantPlacesPanel implementation

### Phase 3: Demographics with Chart
- Chart.js integration
- DemographicChart class
- Pasta chart implementation

### Phase 4: Competitor Analysis
- CompetitorPanel with virtual scrolling
- Sorting and pagination
- Score impact visualization

### Phase 5: Polish & Testing
- Animation refinements
- Performance optimizations
- Comprehensive testing 