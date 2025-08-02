/**
 * LocationIQ Modern UI - Sidebar Component
 * Manages sidebar interactions and mode-specific content
 */

class Sidebar {
    constructor(mode = 'comparison') {
        this.mode = mode;
        this.isCollapsed = false;
        this.isMobile = window.innerWidth <= 768;
        this.locations = [];
        this.selectedRegion = {
            il: null,
            ilce: null,
            mahalle: null
        };
        
        this.init();
    }
    
    /**
     * Initialize sidebar component
     */
    init() {
        this.bindElements();
        this.setupEventListeners();
        this.setupResponsiveHandling();
        this.setMode(this.mode);
        
        console.log('Sidebar initialized with mode:', this.mode);
    }
    
    /**
     * Bind DOM elements
     */
    bindElements() {
        // Main elements
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('sidebar-overlay');
        this.toggleBtn = document.getElementById('sidebar-toggle');
        
        // Header elements
        this.sidebarTitle = document.getElementById('sidebar-title');
        this.businessIcon = document.getElementById('business-icon');
        this.businessName = document.getElementById('business-name');
        this.modeIcon = document.getElementById('mode-icon');
        this.modeName = document.getElementById('mode-name');
        
        // Mode content containers
        this.comparisonContent = document.getElementById('comparison-content');
        this.regionContent = document.getElementById('region-content');
        this.loadingState = document.getElementById('loading-state');
        
        // Comparison mode elements
        this.addressInput = document.getElementById('address-input');
        this.addLocationBtn = document.getElementById('add-location-btn');
        this.locationList = document.getElementById('location-list');
        this.locationCount = document.getElementById('location-count');
        this.emptyState = document.getElementById('empty-state');
        this.analyzeLocationsBtn = document.getElementById('analyze-locations-btn');
        this.comparisonResults = document.getElementById('comparison-results');
        this.resultsList = document.getElementById('results-list');
        
        // Region mode elements
        this.ilSelect = document.getElementById('il-select');
        this.ilceSelect = document.getElementById('ilce-select');
        this.mahalleSelect = document.getElementById('mahalle-select');
        this.analyzeRegionBtn = document.getElementById('analyze-region-btn');
        this.regionResults = document.getElementById('region-results');
        this.topLocationsList = document.getElementById('top-locations-list');
        
        // Footer elements
        this.resetBtn = document.getElementById('reset-analysis-btn');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle sidebar
        this.toggleBtn?.addEventListener('click', () => this.toggle());
        this.overlay?.addEventListener('click', () => this.close());
        
        // Comparison mode events
        this.addLocationBtn?.addEventListener('click', () => this.addLocation());
        this.addressInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addLocation();
            }
        });
        this.analyzeLocationsBtn?.addEventListener('click', () => this.analyzeLocations());
        
        // Region mode events
        this.ilSelect?.addEventListener('change', (e) => this.handleRegionChange('il', e.target.value));
        this.ilceSelect?.addEventListener('change', (e) => this.handleRegionChange('ilce', e.target.value));
        this.mahalleSelect?.addEventListener('change', (e) => this.handleRegionChange('mahalle', e.target.value));
        this.analyzeRegionBtn?.addEventListener('click', () => this.analyzeRegion());
        
        // Reset button
        this.resetBtn?.addEventListener('click', () => this.resetAnalysis());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobile && !this.isCollapsed) {
                this.close();
            }
        });
    }
    
    /**
     * Setup responsive handling
     */
    setupResponsiveHandling() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                if (this.isMobile) {
                    this.close();
                } else {
                    this.open();
                }
            }
        });
        
        // Initialize mobile state
        if (this.isMobile) {
            this.close();
        }
    }
    
    /**
     * Set sidebar mode
     */
    setMode(mode) {
        this.mode = mode;
        
        // Hide all mode content
        this.comparisonContent?.classList.add('hidden');
        this.regionContent?.classList.add('hidden');
        
        // Show appropriate content
        if (mode === 'comparison') {
            this.comparisonContent?.classList.remove('hidden');
            this.sidebarTitle.textContent = 'Lokasyon Karşılaştırma';
            this.modeIcon.setAttribute('data-lucide', 'git-compare');
            this.modeName.textContent = 'Karşılaştırma Modu';
        } else if (mode === 'region') {
            this.regionContent?.classList.remove('hidden');
            this.sidebarTitle.textContent = 'Bölge Keşfi';
            this.modeIcon.setAttribute('data-lucide', 'search');
            this.modeName.textContent = 'Keşif Modu';
            this.loadRegionData();
        }
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        this.updateLocationCount();
    }
    
    /**
     * Set business type context
     */
    setBusinessType(businessType) {
        const businessTypes = {
            eczane: { name: 'Eczane', icon: 'cross' },
            firin: { name: 'Fırın', icon: 'wheat' },
            market: { name: 'Market', icon: 'shopping-cart' },
            cafe: { name: 'Cafe', icon: 'coffee' },
            restoran: { name: 'Restoran', icon: 'utensils' }
        };
        
        if (businessTypes[businessType]) {
            const config = businessTypes[businessType];
            this.businessName.textContent = config.name;
            this.businessIcon.setAttribute('data-lucide', config.icon);
            
            // Refresh icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
    
    /**
     * Toggle sidebar visibility
     */
    toggle() {
        if (this.isCollapsed) {
            this.open();
        } else {
            this.close();
        }
    }
    
    /**
     * Open sidebar
     */
    open() {
        this.isCollapsed = false;
        this.sidebar?.classList.remove('collapsed');
        
        if (this.isMobile) {
            this.sidebar?.classList.add('open');
            this.overlay?.classList.remove('hidden');
            this.overlay?.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }
        
        // Update toggle icon
        this.toggleBtn?.querySelector('i')?.setAttribute('data-lucide', 'panel-left-close');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Close sidebar
     */
    close() {
        this.isCollapsed = true;
        
        if (this.isMobile) {
            this.sidebar?.classList.remove('open');
            this.overlay?.classList.remove('visible');
            this.overlay?.classList.add('hidden');
            document.body.style.overflow = '';
        } else {
            this.sidebar?.classList.add('collapsed');
        }
        
        // Update toggle icon
        this.toggleBtn?.querySelector('i')?.setAttribute('data-lucide', 'panel-left-open');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Add location for comparison
     */
    async addLocation() {
        const address = this.addressInput?.value.trim();
        if (!address) return;
        
        try {
            // Show loading state
            this.setLoading(true, 'Konum aranıyor...');
            
            // Here you would typically geocode the address
            // For now, we'll simulate with a placeholder
            const location = {
                id: Date.now(),
                address: address,
                lat: 39.9334 + (Math.random() - 0.5) * 0.1,
                lng: 32.8597 + (Math.random() - 0.5) * 0.1,
                score: null
            };
            
            this.locations.push(location);
            this.renderLocationList();
            this.updateLocationCount();
            this.updateAnalyzeButton();
            
            // Clear input
            this.addressInput.value = '';
            
            // Hide loading
            this.setLoading(false);
            
        } catch (error) {
            console.error('Error adding location:', error);
            this.setLoading(false);
            // Show error message
        }
    }
    
    /**
     * Remove location from comparison
     */
    removeLocation(locationId) {
        this.locations = this.locations.filter(loc => loc.id !== locationId);
        this.renderLocationList();
        this.updateLocationCount();
        this.updateAnalyzeButton();
        
        // Hide results if no locations
        if (this.locations.length === 0) {
            this.comparisonResults?.classList.add('hidden');
        }
    }
    
    /**
     * Render location list
     */
    renderLocationList() {
        if (!this.locationList) return;
        
        if (this.locations.length === 0) {
            this.locationList.innerHTML = '';
            this.emptyState?.classList.remove('hidden');
            return;
        }
        
        this.emptyState?.classList.add('hidden');
        
        this.locationList.innerHTML = this.locations.map(location => `
            <div class="location-item" data-location-id="${location.id}">
                <div class="location-info">
                    <div class="location-address">${location.address}</div>
                    <div class="location-coords">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
                </div>
                <div class="location-actions">
                    <button class="location-action" onclick="sidebar.focusLocation(${location.id})" title="Haritada göster">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                    <button class="location-action delete" onclick="sidebar.removeLocation(${location.id})" title="Kaldır">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Update location count badge
     */
    updateLocationCount() {
        if (this.locationCount) {
            this.locationCount.textContent = this.locations.length;
        }
    }
    
    /**
     * Update analyze button state
     */
    updateAnalyzeButton() {
        if (this.analyzeLocationsBtn) {
            const canAnalyze = this.locations.length >= 2;
            this.analyzeLocationsBtn.disabled = !canAnalyze;
            
            const btnText = this.analyzeLocationsBtn.querySelector('#analyze-btn-text');
            if (btnText) {
                if (canAnalyze) {
                    btnText.textContent = `${this.locations.length} Konumu Analiz Et`;
                } else {
                    btnText.textContent = 'En Az 2 Konum Gerekli';
                }
            }
        }
    }
    
    /**
     * Analyze locations
     */
    async analyzeLocations() {
        if (this.locations.length < 2) return;
        
        try {
            this.setLoading(true, 'Lokasyonlar analiz ediliyor...');
            
            // Here you would call the actual API
            // For now, simulate analysis
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simulate results
            this.locations.forEach(location => {
                location.score = Math.floor(Math.random() * 40) + 60; // 60-100
                location.details = {
                    competitor: Math.random() > 0.5 ? 'Düşük' : 'Orta',
                    pedestrian: Math.floor(Math.random() * 30) + 70,
                    target: Math.floor(Math.random() * 25) + 75
                };
            });
            
            this.renderResults();
            this.comparisonResults?.classList.remove('hidden');
            this.setLoading(false);
            
        } catch (error) {
            console.error('Error analyzing locations:', error);
            this.setLoading(false);
        }
    }
    
    /**
     * Render analysis results
     */
    renderResults() {
        if (!this.resultsList) return;
        
        // Sort by score descending
        const sortedLocations = [...this.locations].sort((a, b) => (b.score || 0) - (a.score || 0));
        
        this.resultsList.innerHTML = sortedLocations.map(location => {
            const scoreClass = location.score >= 80 ? 'high' : location.score >= 60 ? 'medium' : 'low';
            
            return `
                <div class="result-item" data-location-id="${location.id}">
                    <div class="result-header">
                        <div class="result-address">${location.address}</div>
                        <div class="result-score ${scoreClass}">${location.score}/100</div>
                    </div>
                    <div class="result-details">
                        <div class="result-detail">
                            <span>Rakip Yoğunluğu:</span>
                            <span>${location.details.competitor}</span>
                        </div>
                        <div class="result-detail">
                            <span>Yaya Erişimi:</span>
                            <span>${location.details.pedestrian}/100</span>
                        </div>
                        <div class="result-detail">
                            <span>Hedef Kitle:</span>
                            <span>${location.details.target}/100</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Handle region selection change
     */
    async handleRegionChange(level, value) {
        this.selectedRegion[level] = value;
        
        if (level === 'il') {
            this.selectedRegion.ilce = null;
            this.selectedRegion.mahalle = null;
            this.ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
            this.mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
            this.ilceSelect.disabled = !value;
            this.mahalleSelect.disabled = true;
            
            if (value) {
                await this.loadIlceData(value);
            }
        } else if (level === 'ilce') {
            this.selectedRegion.mahalle = null;
            this.mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
            this.mahalleSelect.disabled = !value;
            
            if (value) {
                await this.loadMahalleData(this.selectedRegion.il, value);
            }
        }
        
        this.updateRegionAnalyzeButton();
    }
    
    /**
     * Load region data
     */
    async loadRegionData() {
        try {
            // Load provinces
            const provinces = ['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya'];
            this.ilSelect.innerHTML = '<option value="">İl Seçiniz</option>' +
                provinces.map(il => `<option value="${il}">${il}</option>`).join('');
        } catch (error) {
            console.error('Error loading region data:', error);
        }
    }
    
    /**
     * Load district data
     */
    async loadIlceData(il) {
        try {
            // Simulate loading districts
            const districts = ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan'];
            this.ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>' +
                districts.map(ilce => `<option value="${ilce}">${ilce}</option>`).join('');
            this.ilceSelect.disabled = false;
        } catch (error) {
            console.error('Error loading district data:', error);
        }
    }
    
    /**
     * Load neighborhood data
     */
    async loadMahalleData(il, ilce) {
        try {
            // Simulate loading neighborhoods
            const neighborhoods = ['Kızılay', 'Tunalı', 'Bahçelievler', 'Çayyolu', 'Ümitköy'];
            this.mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>' +
                neighborhoods.map(mahalle => `<option value="${mahalle}">${mahalle}</option>`).join('');
            this.mahalleSelect.disabled = false;
        } catch (error) {
            console.error('Error loading neighborhood data:', error);
        }
    }
    
    /**
     * Update region analyze button
     */
    updateRegionAnalyzeButton() {
        if (this.analyzeRegionBtn) {
            const canAnalyze = this.selectedRegion.il && this.selectedRegion.ilce && this.selectedRegion.mahalle;
            this.analyzeRegionBtn.disabled = !canAnalyze;
        }
    }
    
    /**
     * Analyze region
     */
    async analyzeRegion() {
        if (!this.selectedRegion.mahalle) return;
        
        try {
            this.setLoading(true, 'Bölge analiz ediliyor...');
            
            // Simulate analysis
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // Simulate top locations
            const topLocations = [
                { name: 'Ana Cadde Üzeri', score: 95 },
                { name: 'Merkez Meydanı', score: 88 },
                { name: 'Okul Karşısı', score: 82 },
                { name: 'Hastane Yakını', score: 78 },
                { name: 'Park Girişi', score: 74 }
            ];
            
            this.renderTopLocations(topLocations);
            this.regionResults?.classList.remove('hidden');
            this.setLoading(false);
            
        } catch (error) {
            console.error('Error analyzing region:', error);
            this.setLoading(false);
        }
    }
    
    /**
     * Render top locations
     */
    renderTopLocations(locations) {
        if (!this.topLocationsList) return;
        
        this.topLocationsList.innerHTML = locations.map((location, index) => `
            <div class="top-location-item" data-location-index="${index}">
                <div class="location-rank">${index + 1}</div>
                <div class="location-details">
                    <div class="location-name">${location.name}</div>
                    <div class="location-score-text">Skor: ${location.score}/100</div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Focus on location (for map integration)
     */
    focusLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location && window.mapManager) {
            window.mapManager.focusLocation(location.lat, location.lng);
        }
    }
    
    /**
     * Set loading state
     */
    setLoading(isLoading, message = 'Yükleniyor...') {
        if (isLoading) {
            this.loadingState?.classList.remove('hidden');
            const loadingText = this.loadingState?.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
        } else {
            this.loadingState?.classList.add('hidden');
        }
    }
    
    /**
     * Reset analysis
     */
    resetAnalysis() {
        // Reset comparison mode
        this.locations = [];
        this.renderLocationList();
        this.updateLocationCount();
        this.updateAnalyzeButton();
        this.comparisonResults?.classList.add('hidden');
        
        // Reset region mode
        this.selectedRegion = { il: null, ilce: null, mahalle: null };
        this.ilSelect.value = '';
        this.ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
        this.mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
        this.ilceSelect.disabled = true;
        this.mahalleSelect.disabled = true;
        this.updateRegionAnalyzeButton();
        this.regionResults?.classList.add('hidden');
        
        // Clear input
        if (this.addressInput) {
            this.addressInput.value = '';
        }
    }
    
    /**
     * Cleanup component
     */
    cleanup() {
        // Remove event listeners and clean up
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeydown);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
}

// Make globally available
window.Sidebar = Sidebar;