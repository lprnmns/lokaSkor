/**
 * Sidebar Component - Responsive sidebar with mode-specific content
 */
class Sidebar {
    constructor() {
        this.isCollapsed = false;
        this.isMobileHidden = window.innerWidth < 768;
        this.currentMode = null;
        this.addresses = [];
        this.selectedLocation = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupResponsive();
        
        console.log('Sidebar initialized');
    }

    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.collapseBtn = document.querySelector('.sidebar-collapse-btn');
        
        // Mode content containers
        this.mode1Content = document.getElementById('mode1Content');
        this.mode2Content = document.getElementById('mode2Content');
        this.modeContentContainer = document.getElementById('sidebarModeContent');
        
        // Selection info elements
        this.businessTypeSpan = document.getElementById('sidebarBusinessType');
        this.analysisModeSpan = document.getElementById('sidebarAnalysisMode');
        
        // Mode 1 elements
        this.addressInput = document.getElementById('addressInput');
        this.addAddressBtn = document.getElementById('addAddressBtn');
        this.addressList = document.getElementById('addressList');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.mode1Results = document.getElementById('mode1Results');
        this.comparisonResults = document.getElementById('comparisonResults');
        
        // Mode 2 elements
        this.ilSelect = document.getElementById('ilSelect');
        this.ilceSelect = document.getElementById('ilceSelect');
        this.mahalleSelect = document.getElementById('mahalleSelect');
        this.regionAnalyzeBtn = document.getElementById('regionAnalyzeBtn');
        this.mode2Results = document.getElementById('mode2Results');
        this.topLocations = document.getElementById('topLocations');
        
        // State elements
        this.loadingState = document.getElementById('sidebarLoading');
        this.errorState = document.getElementById('sidebarError');
    }

    bindEvents() {
        // Toggle events
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleMobile());
        }
        
        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', () => this.toggleCollapse());
        }
        
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeMobile());
        }
        
        // Mode 1 events
        if (this.addressInput) {
            this.addressInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addAddress();
                }
            });
        }
        
        // Mode 2 events
        if (this.ilSelect) {
            this.ilSelect.addEventListener('change', () => this.onIlChange());
        }
        
        if (this.ilceSelect) {
            this.ilceSelect.addEventListener('change', () => this.onIlceChange());
        }
        
        if (this.mahalleSelect) {
            this.mahalleSelect.addEventListener('change', () => this.onMahalleChange());
        }
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Escape key to close mobile sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.isMobileHidden) {
                this.closeMobile();
            }
        });
        
        // Listen for language changes
        if (window.languageEvents) {
            window.languageEvents.subscribe((lang) => {
                this.updateUIText();
            });
        }
    }

    setupResponsive() {
        this.handleResize();
    }

    handleResize() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile && !this.isMobileHidden) {
            // Was desktop, now mobile - hide sidebar
            this.isMobileHidden = true;
            this.sidebar.classList.add('mobile-hidden');
            this.sidebarOverlay.classList.remove('visible');
        } else if (!isMobile && this.isMobileHidden) {
            // Was mobile, now desktop - show sidebar
            this.isMobileHidden = false;
            this.sidebar.classList.remove('mobile-hidden');
        }
    }

    // Mobile toggle methods
    toggleMobile() {
        if (window.innerWidth < 768) {
            if (this.isMobileHidden) {
                this.openMobile();
            } else {
                this.closeMobile();
            }
        }
    }

    openMobile() {
        this.isMobileHidden = false;
        this.sidebar.classList.remove('mobile-hidden');
        this.sidebar.classList.add('sidebar-enter');
        this.sidebarOverlay.classList.remove('hidden');
        this.sidebarOverlay.classList.add('visible');
        
        // Update toggle icon
        this.updateToggleIcon(false);
        
        setTimeout(() => {
            this.sidebar.classList.remove('sidebar-enter');
        }, 300);
    }

    closeMobile() {
        if (window.innerWidth < 768) {
            this.isMobileHidden = true;
            this.sidebar.classList.add('sidebar-exit');
            this.sidebarOverlay.classList.remove('visible');
            
            // Update toggle icon
            this.updateToggleIcon(true);
            
            setTimeout(() => {
                this.sidebar.classList.add('mobile-hidden');
                this.sidebar.classList.remove('sidebar-exit');
                this.sidebarOverlay.classList.add('hidden');
            }, 300);
        }
    }

    // Desktop collapse methods
    toggleCollapse() {
        if (window.innerWidth >= 768) {
            this.isCollapsed = !this.isCollapsed;
            
            if (this.isCollapsed) {
                this.sidebar.classList.add('collapsed');
            } else {
                this.sidebar.classList.remove('collapsed');
            }
            
            // Notify map to adjust
            if (window.mapManager) {
                window.mapManager.handleSidebarResize(this.isCollapsed);
            }
        }
    }

    updateToggleIcon(isClosed) {
        const openIcon = this.sidebarToggle.querySelector('.sidebar-toggle-open');
        const closeIcon = this.sidebarToggle.querySelector('.sidebar-toggle-close');
        
        if (isClosed) {
            openIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        } else {
            openIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
        }
    }

    // Mode management
    setMode(mode, businessType = null) {
        this.currentMode = mode;
        
        // Update selection info
        if (businessType) {
            this.businessTypeSpan.textContent = this.getBusinessTypeLabel(businessType);
        }
        
        this.analysisModeSpan.textContent = mode === 'mode1' ? 
            (window.translationUtils ? window.translationUtils.t('sidebar.analysisMode.comparison') : 'Lokasyon Karşılaştırması') : 
            (window.translationUtils ? window.translationUtils.t('sidebar.analysisMode.region') : 'Bölge Analizi');
        
        // Show appropriate content
        this.showModeContent(mode);
        
        // Initialize mode-specific functionality
        if (mode === 'mode1') {
            this.initializeMode1();
        } else if (mode === 'mode2') {
            this.initializeMode2();
        }
    }

    showModeContent(mode) {
        // Hide all mode content
        this.mode1Content.classList.add('hidden');
        this.mode2Content.classList.add('hidden');
        
        // Show selected mode content
        if (mode === 'mode1') {
            this.mode1Content.classList.remove('hidden');
        } else if (mode === 'mode2') {
            this.mode2Content.classList.remove('hidden');
        }
    }

    getBusinessTypeLabel(businessType) {
        const labels = {
            'eczane': window.translationUtils ? window.translationUtils.t('businessTypes.pharmacy') : 'Eczane',
            'firin': window.translationUtils ? window.translationUtils.t('businessTypes.bakery') : 'Fırın',
            'market': window.translationUtils ? window.translationUtils.t('businessTypes.market') : 'Market',
            'cafe': window.translationUtils ? window.translationUtils.t('businessTypes.cafe') : 'Cafe',
            'restoran': window.translationUtils ? window.translationUtils.t('businessTypes.restaurant') : 'Restoran'
        };
        return labels[businessType] || businessType;
    }

    // Mode 1: Point Comparison Methods
    initializeMode1() {
        this.addresses = [];
        this.updateAddressList();
        this.updateAnalyzeButton();
        this.hideResults();
    }

    addAddress() {
        const address = this.addressInput.value.trim();
        if (!address) return;
        
        // Check for duplicates
        if (this.addresses.some(addr => addr.text === address)) {
            this.showError(window.translationUtils ? window.translationUtils.t('sidebar.mode1.errors.duplicateAddress') : 'Bu adres zaten eklenmiş');
            return;
        }
        
        const addressObj = {
            id: Date.now(),
            text: address,
            coordinates: null // Will be geocoded later
        };
        
        this.addresses.push(addressObj);
        this.addressInput.value = '';
        this.updateAddressList();
        this.updateAnalyzeButton();
        
        // Animate new address item
        setTimeout(() => {
            const newItem = this.addressList.lastElementChild;
            if (newItem) {
                newItem.style.opacity = '0';
                newItem.style.transform = 'translateY(-10px)';
                newItem.offsetHeight; // Force reflow
                newItem.style.transition = 'all 0.3s ease';
                newItem.style.opacity = '1';
                newItem.style.transform = 'translateY(0)';
            }
        }, 10);
    }

    removeAddress(addressId) {
        this.addresses = this.addresses.filter(addr => addr.id !== addressId);
        this.updateAddressList();
        this.updateAnalyzeButton();
        this.hideResults();
    }

    updateAddressList() {
        if (!this.addressList) return;
        
        this.addressList.innerHTML = '';
        
        this.addresses.forEach(address => {
            const addressItem = document.createElement('div');
            addressItem.className = 'address-item';
            addressItem.innerHTML = `
                <span class="address-text">${address.text}</span>
                <button class="address-remove" onclick="window.sidebar.removeAddress(${address.id})" title="${window.translationUtils ? window.translationUtils.t('sidebar.mode1.removeAddress') : 'Adresi kaldır'}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            `;
            this.addressList.appendChild(addressItem);
        });
    }

    updateAnalyzeButton() {
        if (!this.analyzeBtn) return;
        
        const hasEnoughAddresses = this.addresses.length >= 2;
        this.analyzeBtn.disabled = !hasEnoughAddresses;
        
        if (hasEnoughAddresses) {
            this.analyzeBtn.textContent = window.translationUtils ? 
                window.translationUtils.t('sidebar.mode1.analyzeButton', { count: this.addresses.length }) : 
                `${this.addresses.length} Konumu Analiz Et`;
        } else {
            this.analyzeBtn.textContent = window.translationUtils ? 
                window.translationUtils.t('sidebar.mode1.minAddressesRequired') : 
                'En az 2 konum gerekli';
        }
    }

    async startAnalysis() {
        if (this.addresses.length < 2) return;
        
        this.showLoading(window.translationUtils ? window.translationUtils.t('sidebar.mode1.analyzing') : 'Konumlar analiz ediliyor...');
        
        try {
            // Geocode addresses first
            const geocodedAddresses = await this.geocodeAddresses();
            
            // Perform analysis
            const results = await this.analyzeLocations(geocodedAddresses);
            
            // Display results
            this.showMode1Results(results);
            
            // Update map
            if (window.mapManager) {
                window.mapManager.showComparisonResults(results);
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(window.translationUtils ? window.translationUtils.t('sidebar.mode1.analysisError') : 'Analiz sırasında bir hata oluştu');
        } finally {
            this.hideLoading();
        }
    }

    async geocodeAddresses() {
        // This would integrate with your geocoding service
        // For now, return mock data
        return this.addresses.map(addr => ({
            ...addr,
            coordinates: [32.8597 + Math.random() * 0.1, 39.9334 + Math.random() * 0.1]
        }));
    }

    async analyzeLocations(addresses) {
        // This would call your backend API
        // For now, return mock results
        return addresses.map((addr, index) => ({
            id: addr.id,
            address: addr.text,
            coordinates: addr.coordinates,
            score: Math.floor(Math.random() * 40) + 60,
            metrics: {
                competition: Math.floor(Math.random() * 100),
                accessibility: Math.floor(Math.random() * 100),
                targetAudience: Math.floor(Math.random() * 100),
                footTraffic: Math.floor(Math.random() * 100)
            }
        }));
    }

    showMode1Results(results) {
        if (!this.comparisonResults) return;
        
        this.comparisonResults.innerHTML = '';
        
        // Sort by score
        const sortedResults = results.sort((a, b) => b.score - a.score);
        
        sortedResults.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.dataset.resultId = result.id;
            resultItem.onclick = () => this.selectResult(result);
            
            resultItem.innerHTML = `
                <div class="result-header">
                    <span class="result-address">${result.address}</span>
                    <span class="result-score">${result.score}</span>
                </div>
                <div class="result-metrics">
                    <span>${window.translationUtils ? window.translationUtils.t('sidebar.mode1.metrics.competition') : 'Rekabet'}: ${result.metrics.competition}</span>
                    <span>${window.translationUtils ? window.translationUtils.t('sidebar.mode1.metrics.accessibility') : 'Erişim'}: ${result.metrics.accessibility}</span>
                    <span>${window.translationUtils ? window.translationUtils.t('sidebar.mode1.metrics.targetAudience') : 'Hedef'}: ${result.metrics.targetAudience}</span>
                    <span>${window.translationUtils ? window.translationUtils.t('sidebar.mode1.metrics.footTraffic') : 'Trafik'}: ${result.metrics.footTraffic}</span>
                </div>
            `;
            
            this.comparisonResults.appendChild(resultItem);
        });
        
        this.mode1Results.classList.remove('hidden');
        
        // Animate results appearance
        setTimeout(() => {
            const items = this.comparisonResults.querySelectorAll('.result-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    item.offsetHeight; // Force reflow
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 10);
    }

    selectResult(result) {
        // Remove previous selection
        this.comparisonResults.querySelectorAll('.result-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        const resultItem = this.comparisonResults.querySelector(`[data-result-id="${result.id}"]`);
        if (resultItem) {
            resultItem.classList.add('selected');
        }
        
        // Focus on map
        if (window.mapManager) {
            window.mapManager.focusOnLocation(result.coordinates);
        }
        
        this.selectedLocation = result;
    }

    // Mode 2: Region Analysis Methods
    initializeMode2() {
        this.loadLocationData();
        this.resetDropdowns();
        this.hideResults();
    }

    async loadLocationData() {
        try {
            // This would load from your backend
            // For now, use mock data
            this.locationData = {
                iller: [
                    { id: 6, name: 'Ankara' },
                    { id: 34, name: 'İstanbul' },
                    { id: 35, name: 'İzmir' }
                ]
            };
            
            this.populateIlDropdown();
        } catch (error) {
            console.error('Error loading location data:', error);
        }
    }

    populateIlDropdown() {
        if (!this.ilSelect) return;
        
        this.ilSelect.innerHTML = `<option value="">${window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectProvince') : 'İl seçiniz'}</option>`;
        
        this.locationData.iller.forEach(il => {
            const option = document.createElement('option');
            option.value = il.id;
            option.textContent = il.name;
            this.ilSelect.appendChild(option);
        });
    }

    async onIlChange() {
        const ilId = this.ilSelect.value;
        
        if (!ilId) {
            this.resetIlceDropdown();
            return;
        }
        
        try {
            // Mock data for districts
            const ilceler = [
                { id: 1, name: 'Çankaya' },
                { id: 2, name: 'Keçiören' },
                { id: 3, name: 'Yenimahalle' }
            ];
            
            this.populateIlceDropdown(ilceler);
        } catch (error) {
            console.error('Error loading districts:', error);
        }
    }

    populateIlceDropdown(ilceler) {
        if (!this.ilceSelect) return;
        
        this.ilceSelect.innerHTML = `<option value="">${window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectDistrict') : 'İlçe seçiniz'}</option>`;
        this.ilceSelect.disabled = false;
        
        ilceler.forEach(ilce => {
            const option = document.createElement('option');
            option.value = ilce.id;
            option.textContent = ilce.name;
            this.ilceSelect.appendChild(option);
        });
        
        this.resetMahalleDropdown();
    }

    async onIlceChange() {
        const ilceId = this.ilceSelect.value;
        
        if (!ilceId) {
            this.resetMahalleDropdown();
            return;
        }
        
        try {
            // Mock data for neighborhoods
            const mahalleler = [
                { id: 1, name: 'Kızılay' },
                { id: 2, name: 'Tunalı' },
                { id: 3, name: 'Çayyolu' }
            ];
            
            this.populateMahalleDropdown(mahalleler);
        } catch (error) {
            console.error('Error loading neighborhoods:', error);
        }
    }

    populateMahalleDropdown(mahalleler) {
        if (!this.mahalleSelect) return;
        
        this.mahalleSelect.innerHTML = `<option value="">${window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectNeighborhood') : 'Mahalle seçiniz'}</option>`;
        this.mahalleSelect.disabled = false;
        
        mahalleler.forEach(mahalle => {
            const option = document.createElement('option');
            option.value = mahalle.id;
            option.textContent = mahalle.name;
            this.mahalleSelect.appendChild(option);
        });
        
        this.updateRegionAnalyzeButton();
    }

    onMahalleChange() {
        this.updateRegionAnalyzeButton();
    }

    updateRegionAnalyzeButton() {
        if (!this.regionAnalyzeBtn) return;
        
        const hasSelection = this.mahalleSelect && this.mahalleSelect.value;
        this.regionAnalyzeBtn.disabled = !hasSelection;
    }

    resetDropdowns() {
        this.resetIlceDropdown();
        this.resetMahalleDropdown();
    }

    resetIlceDropdown() {
        if (this.ilceSelect) {
            this.ilceSelect.innerHTML = `<option value="">${window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectDistrict') : 'İlçe seçiniz'}</option>`;
            this.ilceSelect.disabled = true;
        }
        this.resetMahalleDropdown();
    }

    resetMahalleDropdown() {
        if (this.mahalleSelect) {
            this.mahalleSelect.innerHTML = `<option value="">${window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectNeighborhood') : 'Mahalle seçiniz'}</option>`;
            this.mahalleSelect.disabled = true;
        }
        this.updateRegionAnalyzeButton();
    }

    async startRegionAnalysis() {
        const mahalleId = this.mahalleSelect.value;
        if (!mahalleId) return;
        
        this.showLoading(window.translationUtils ? window.translationUtils.t('sidebar.mode2.analyzing') : 'Bölge analizi yapılıyor...');
        
        try {
            // Get heatmap data
            const heatmapData = await this.getHeatmapData(mahalleId);
            
            // Get top locations
            const topLocations = await this.getTopLocations(mahalleId);
            
            // Display results
            this.showMode2Results(topLocations);
            
            // Update map
            if (window.mapManager) {
                window.mapManager.showHeatmap(heatmapData);
                window.mapManager.showTopLocations(topLocations);
            }
            
        } catch (error) {
            console.error('Region analysis error:', error);
            this.showError(window.translationUtils ? window.translationUtils.t('sidebar.mode2.analysisError') : 'Bölge analizi sırasında bir hata oluştu');
        } finally {
            this.hideLoading();
        }
    }

    async getHeatmapData(mahalleId) {
        // Mock heatmap data
        return {
            type: 'FeatureCollection',
            features: []
        };
    }

    async getTopLocations(mahalleId) {
        // Mock top locations
        return [
            {
                id: 1,
                address: 'Kızılay Meydanı, Çankaya',
                coordinates: [32.8597, 39.9334],
                score: 95,
                potential: window.translationUtils ? window.translationUtils.t('sidebar.mode2.potential.veryHigh') : 'Çok Yüksek'
            },
            {
                id: 2,
                address: 'Tunalı Hilmi Caddesi, Çankaya',
                coordinates: [32.8547, 39.9284],
                score: 88,
                potential: window.translationUtils ? window.translationUtils.t('sidebar.mode2.potential.high') : 'Yüksek'
            },
            {
                id: 3,
                address: 'Çayyolu Merkez, Çankaya',
                coordinates: [32.7897, 39.9134],
                score: 82,
                potential: window.translationUtils ? window.translationUtils.t('sidebar.mode2.potential.high') : 'Yüksek'
            }
        ];
    }

    showMode2Results(locations) {
        if (!this.topLocations) return;
        
        this.topLocations.innerHTML = '';
        
        locations.forEach((location, index) => {
            const locationItem = document.createElement('div');
            locationItem.className = 'top-location-item';
            locationItem.dataset.locationId = location.id;
            locationItem.dataset.rank = index + 1;
            locationItem.onclick = () => this.selectTopLocation(location);
            
            locationItem.innerHTML = `
                <div class="location-info">
                    <div class="location-address">${location.address}</div>
                    <div class="location-score">${window.translationUtils ? window.translationUtils.t('sidebar.mode2.scoreLabel') : 'Skor'}: ${location.score}</div>
                </div>
            `;
            
            this.topLocations.appendChild(locationItem);
        });
        
        this.mode2Results.classList.remove('hidden');
        
        // Animate results appearance
        setTimeout(() => {
            const items = this.topLocations.querySelectorAll('.top-location-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    item.offsetHeight; // Force reflow
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 10);
    }

    selectTopLocation(location) {
        // Remove previous selection
        this.topLocations.querySelectorAll('.top-location-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        const locationItem = this.topLocations.querySelector(`[data-location-id="${location.id}"]`);
        if (locationItem) {
            locationItem.classList.add('selected');
        }
        
        // Focus on map
        if (window.mapManager) {
            window.mapManager.focusOnLocation(location.coordinates);
        }
    }

    // State management methods
    showLoading(message = window.translationUtils ? window.translationUtils.t('sidebar.loading') : 'Yükleniyor...') {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
        
        const loadingText = this.loadingState.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    hideLoading() {
        this.loadingState.classList.add('hidden');
    }

    showError(message) {
        this.hideAllStates();
        this.errorState.classList.remove('hidden');
        
        const errorText = this.errorState.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorState.classList.add('hidden');
    }

    hideResults() {
        this.mode1Results.classList.add('hidden');
        this.mode2Results.classList.add('hidden');
    }

    hideAllStates() {
        this.hideLoading();
        this.hideError();
    }

    retryAnalysis() {
        this.hideError();
        
        if (this.currentMode === 'mode1') {
            this.startAnalysis();
        } else if (this.currentMode === 'mode2') {
            this.startRegionAnalysis();
        }
    }

    // Update UI text when language changes
    updateUIText() {
        // Update analysis mode span
        if (this.analysisModeSpan) {
            this.analysisModeSpan.textContent = this.currentMode === 'mode1' ? 
                (window.translationUtils ? window.translationUtils.t('sidebar.analysisMode.comparison') : 'Lokasyon Karşılaştırması') : 
                (window.translationUtils ? window.translationUtils.t('sidebar.analysisMode.region') : 'Bölge Analizi');
        }
        
        // Update business type labels
        if (this.businessTypeSpan && this.businessTypeSpan.textContent) {
            // This would need to be updated based on the current business type
            // For now, we'll leave it as is since it's set dynamically
        }
        
        // Update analyze buttons
        this.updateAnalyzeButton();
        this.updateRegionAnalyzeButton();
        
        // Update dropdown placeholders
        if (this.ilSelect) {
            const ilPlaceholder = this.ilSelect.querySelector('option[value=""]');
            if (ilPlaceholder) {
                ilPlaceholder.textContent = window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectProvince') : 'İl seçiniz';
            }
        }
        
        if (this.ilceSelect) {
            const ilcePlaceholder = this.ilceSelect.querySelector('option[value=""]');
            if (ilcePlaceholder) {
                ilcePlaceholder.textContent = window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectDistrict') : 'İlçe seçiniz';
            }
        }
        
        if (this.mahalleSelect) {
            const mahallePlaceholder = this.mahalleSelect.querySelector('option[value=""]');
            if (mahallePlaceholder) {
                mahallePlaceholder.textContent = window.translationUtils ? window.translationUtils.t('sidebar.mode2.selectNeighborhood') : 'Mahalle seçiniz';
            }
        }
    }

    // Public API methods
    getSidebarWidth() {
        if (this.isMobileHidden) return 0;
        if (this.isCollapsed) return 50;
        return 400;
    }

    isVisible() {
        return !this.isMobileHidden;
    }

    getCurrentMode() {
        return this.currentMode;
    }

    getSelectedLocation() {
        return this.selectedLocation;
    }

    getAddresses() {
        return this.addresses;
    }
}

// Global functions for HTML onclick handlers
window.toggleSidebarCollapse = function() {
    if (window.sidebar) {
        window.sidebar.toggleCollapse();
    }
};

window.closeSidebar = function() {
    if (window.sidebar) {
        window.sidebar.closeMobile();
    }
};

window.addAddress = function() {
    if (window.sidebar) {
        window.sidebar.addAddress();
    }
};

window.startAnalysis = function() {
    if (window.sidebar) {
        window.sidebar.startAnalysis();
    }
};

window.startRegionAnalysis = function() {
    if (window.sidebar) {
        window.sidebar.startRegionAnalysis();
    }
};

window.retryAnalysis = function() {
    if (window.sidebar) {
        window.sidebar.retryAnalysis();
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
}