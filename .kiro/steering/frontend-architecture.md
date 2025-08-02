# LocationIQ - Frontend Mimarisi ve Tasarım Sistemi

## Frontend Mimarisi Genel Bakış

LocationIQ'nun frontend mimarisi, modern web standartlarını takip eden, performans odaklı ve kullanıcı deneyimi öncelikli bir yapıya sahiptir. Vanilla JavaScript ile class-based architecture kullanılarak geliştirilmiştir.

## Tasarım Sistemi (design_system.css)

### CSS Custom Properties
```css
:root {
  /* Color System */
  --primary-color: #3b82f6;
  --primary-dark: #1d4ed8;
  --secondary-color: #8b5cf6;
  
  /* Layout & Spacing */
  --radius: 0.5rem;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  
  /* Animation Durations */
  --duration-fast: 0.15s;
  --duration-normal: 0.2s;
  --duration-slow: 0.3s;
  
  /* Z-Index Scale */
  --z-dropdown: 1000;
  --z-modal: 1050;
  --z-tooltip: 1070;
}
```

### Responsive Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## Ana JavaScript Sınıfları

### 1. LocationComparison (mod1_comparison.js)

#### Sınıf Yapısı
```javascript
class LocationComparison {
    constructor(businessType) {
        this.businessType = businessType;
        this.locations = [];
        this.maxLocations = 3;
        this.map = null;
        this.markers = [];
        this.markerColors = ['#ef4444', '#3b82f6', '#10b981'];
        
        // Search manager
        this.searchManager = new SearchManager(300);
        
        // Detail panel system
        this.detailPanelManager = new DetailPanelManager(this);
    }
}
```

#### Ana Metodlar
```javascript
// Harita başlatma
initializeMap()

// Lokasyon yönetimi
addLocationFromMap(lat, lng)
addLocationFromSearch(result)
removeLocation(locationId)

// Karşılaştırma
startComparison()
showResults(results)

// UI güncellemeleri
updateUI()
createLocationCard(location, index)
```

### 2. SearchManager (mod1_comparison.js)

#### Debounced Search
```javascript
class SearchManager {
    constructor(debounceMs = 300) {
        this.debounceTimer = null;
        this.searchCache = new Map();
        this.abortController = null;
    }
    
    async search(query, callback) {
        // Debounce implementation
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(async () => {
            await this.performSearch(query, callback);
        }, this.debounceMs);
    }
}
```

#### Nominatim API Integration
```javascript
async performSearch(query, callback) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=tr&limit=5`,
        { 
            signal: this.abortController.signal,
            headers: { 'User-Agent': 'LocationIQ-Mod1/1.0' }
        }
    );
}
```

### 3. DetailPanelManager (components/DetailPanelManager.js)

#### Panel Yönetimi
```javascript
class DetailPanelManager {
    constructor(comparisonInstance) {
        this.comparisonInstance = comparisonInstance;
        this.activePanels = new Map();
        this.panelCache = new Map();
    }
    
    togglePanel(categoryType, locationId) {
        const panelKey = `${categoryType}_${locationId}`;
        
        if (this.activePanels.has(panelKey)) {
            this.closePanel(panelKey);
        } else {
            this.openPanel(categoryType, locationId);
        }
    }
}
```

#### Kategori Tipleri
- **hospital**: Hastane yakınlığı detayları
- **competitor**: Rakip analizi detayları
- **demographic**: Demografik bilgiler
- **important_places**: Önemli yerler detayları

### 4. CategoryExpander (components/CategoryExpander.js)

#### Smooth Animations
```javascript
class CategoryExpander {
    constructor(panelManager) {
        this.panelManager = panelManager;
        this.animationDuration = 300; // ms
    }
    
    expandPanel(container) {
        const content = container.querySelector('.accordion-content-inner');
        const targetHeight = content.scrollHeight;
        
        // CSS transition ile smooth animation
        container.style.height = `${targetHeight}px`;
        container.setAttribute('aria-expanded', 'true');
    }
}
```

## CSS Sınıf Yapısı (mod1_comparison.css)

### Layout Components
```css
/* Ana container */
.comparison-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header */
.comparison-header {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 100;
}

/* Main layout */
.main-layout {
    flex: 1;
    display: flex;
    min-height: calc(100vh - 80px);
}
```

### Sidebar Components
```css
/* Sidebar */
.location-selector-sidebar {
    flex-shrink: 0;
    width: 560px;
    background: var(--sidebar-bg);
    overflow-y: auto;
}

/* Location cards */
.location-card {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 0.75rem;
    transition: all 0.3s ease;
    position: relative;
}

.location-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Map Components
```css
/* Map container */
.map-container {
    flex-grow: 1;
    position: relative;
    height: calc(100vh - 80px);
}

.comparison-map {
    width: 100%;
    height: 100%;
    border-radius: 0;
}
```

### Result Components
```css
/* Result cards */
.result-card {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 3px solid transparent;
}

.result-card.rank-1 { border-color: #10b981; }
.result-card.rank-2 { border-color: #3b82f6; }
.result-card.rank-3 { border-color: #8b5cf6; }
```

## Animasyon Sistemi (animations.css)

### Keyframe Animations
```css
@keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slide-in-from-bottom {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}

@keyframes scale-in {
    from { 
        transform: scale(0.95);
        opacity: 0;
    }
    to { 
        transform: scale(1);
        opacity: 1;
    }
}
```

### Animation Classes
```css
.animate-fade-in {
    animation: fade-in var(--duration-slow) ease-out;
}

.animate-slide-in-from-bottom {
    animation: slide-in-from-bottom var(--duration-slow) ease-out;
}

.animate-scale-in {
    animation: scale-in var(--duration-normal) ease-out;
}
```

## Performans Optimizasyonları

### CSS Optimizasyonları
```css
/* GPU acceleration için transform ve opacity kullanımı */
.location-card {
    will-change: transform;
    transform: translateZ(0); /* Hardware acceleration */
}

/* Efficient transitions */
.transition-all {
    transition: all var(--duration-normal) ease-in-out;
}

.transition-transform {
    transition: transform var(--duration-normal) ease-in-out;
}
```

### JavaScript Optimizasyonları
```javascript
// Event delegation
document.addEventListener('click', (e) => {
    if (e.target.matches('.delete-button')) {
        this.removeLocation(e.target.dataset.locationId);
    }
});

// Debounced resize handler
window.addEventListener('resize', 
    this.debounce(() => this.handleResize(), 250)
);

// Memory management
destroy() {
    // Event listener temizleme
    this.abortController?.abort();
    this.searchManager.clearCache();
    this.detailPanelManager.closeAllPanels();
}
```

## Responsive Design

### Mobile Adaptations
```css
@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
    }
    
    .location-selector-sidebar {
        width: 100%;
        height: auto;
        min-height: 50vh;
    }
    
    .comparison-map {
        height: 50vh !important;
    }
}
```

### Touch Optimizations
```css
/* Touch-friendly button sizes */
.delete-button {
    min-width: 44px;
    min-height: 44px;
    touch-action: manipulation;
}

/* Prevent zoom on input focus */
input[type="text"] {
    font-size: 16px; /* iOS zoom prevention */
}
```

## Accessibility Features

### ARIA Labels
```html
<button class="delete-button" 
        aria-label="Remove location"
        data-location-id="123">
    <svg class="trash-icon">...</svg>
</button>
```

### Keyboard Navigation
```javascript
// Tab order management
card.setAttribute('tabindex', '0');
card.setAttribute('role', 'button');

// Keyboard event handling
card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.focusOnLocation(locationId);
    }
});
```

### Screen Reader Support
```html
<div role="progressbar" 
     aria-valuenow="75" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Hospital proximity score: 75 out of 100">
    <div class="progress-bar" style="width: 75%"></div>
</div>
```

Bu frontend mimarisi, modern web standartlarını takip ederek yüksek performanslı, erişilebilir ve kullanıcı dostu bir deneyim sunar.