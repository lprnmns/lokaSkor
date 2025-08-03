/**
 * LokaSkor Modern UI - Enhanced Map Manager
 * Manages map interactions, animations, and visualizations
 */

class MapManager {
    constructor(containerId = 'map') {
        this.containerId = containerId;
        this.map = null;
        this.pins = [];
        this.heatmapLayer = null;
        this.selectedPin = null;
        this.animationQueue = [];
        this.isFullscreen = false;
        this.showHeatmap = false;
        this.showPins = true;
        
        // Default map center (Ankara)
        this.defaultCenter = [39.9334, 32.8597];
        this.defaultZoom = 11;
        
        this.init();
    }
    
    /**
     * Initialize map manager
     */
    async init() {
        try {
            await this.initializeMap();
            this.setupControls();
            this.setupEventListeners();
            this.hideLoading();
            
            console.log('MapManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MapManager:', error);
            this.showError('Harita yüklenemedi');
        }
    }
    
    /**
     * Initialize Leaflet map
     */
    async initializeMap() {
        // Show loading state
        this.showLoading();
        
        // Initialize map
        this.map = L.map(this.containerId, {
            center: this.defaultCenter,
            zoom: this.defaultZoom,
            zoomControl: false, // We use custom controls
            attributionControl: true,
            preferCanvas: true, // Better performance for many markers
            maxZoom: 18,
            minZoom: 6
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        // Setup map event listeners
        this.map.on('click', (e) => this.handleMapClick(e));
        this.map.on('zoomend', () => this.handleZoomChange());
        this.map.on('moveend', () => this.handleMapMove());
        
        // Wait for map to be ready
        await new Promise(resolve => {
            this.map.whenReady(() => resolve());
        });
    }
    
    /**
     * Setup map controls
     */
    setupControls() {
        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        
        zoomInBtn?.addEventListener('click', () => this.zoomIn());
        zoomOutBtn?.addEventListener('click', () => this.zoomOut());
        
        // View controls
        const centerViewBtn = document.getElementById('center-view-btn');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        
        centerViewBtn?.addEventListener('click', () => this.centerView());
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
        
        // Layer controls
        const toggleHeatmapBtn = document.getElementById('toggle-heatmap-btn');
        const togglePinsBtn = document.getElementById('toggle-pins-btn');
        
        toggleHeatmapBtn?.addEventListener('click', () => this.toggleHeatmap());
        togglePinsBtn?.addEventListener('click', () => this.togglePins());
        
        // Info panel controls
        const closeInfoPanel = document.getElementById('close-info-panel');
        closeInfoPanel?.addEventListener('click', () => this.hideInfoPanel());
        
        // Legend controls
        const legendHeader = document.querySelector('.legend-header');
        legendHeader?.addEventListener('click', () => this.toggleLegend());
        
        // Coordinates controls
        const addCoordinateBtn = document.getElementById('add-coordinate-btn');
        addCoordinateBtn?.addEventListener('click', () => this.addCoordinateLocation());
    }
    
    /**
     * Setup additional event listeners
     */
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case 'f':
                case 'F':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleFullscreen();
                    }
                    break;
                case 'Escape':
                    if (this.isFullscreen) {
                        this.toggleFullscreen();
                    }
                    this.hideInfoPanel();
                    this.hideCoordinatesDisplay();
                    break;
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    /**
     * Add pin with animation
     */
    addPinWithAnimation(location, score, options = {}) {
        const pin = this.createPin(location, score, options);
        
        // Add to pins array
        this.pins.push(pin);
        
        // Animate pin appearance
        setTimeout(() => {
            this.animatePin(pin, 'drop-down');
        }, options.delay || 0);
        
        return pin;
    }
    
    /**
     * Create custom pin marker
     */
    createPin(location, score, options = {}) {
        const { lat, lng, address, id } = location;
        const scoreClass = this.getScoreClass(score);
        
        // Create custom marker HTML
        const markerHtml = `
            <div class="custom-marker ${scoreClass}" data-pin-id="${id || Date.now()}">
                <i data-lucide="map-pin" class="w-4 h-4"></i>
            </div>
        `;
        
        // Create marker
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: markerHtml,
                className: 'custom-marker-container',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            })
        });
        
        // Add popup content
        const popupContent = this.createPopupContent(location, score, options);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });
        
        // Add event listeners
        marker.on('click', () => this.handlePinClick(marker, location, score));
        marker.on('mouseover', () => this.handlePinHover(marker, true));
        marker.on('mouseout', () => this.handlePinHover(marker, false));
        
        // Add to map if pins are visible
        if (this.showPins) {
            marker.addTo(this.map);
        }
        
        // Store additional data
        marker._locationData = { location, score, options };
        
        return marker;
    }
    
    /**
     * Create popup content for pin
     */
    createPopupContent(location, score, options = {}) {
        const scoreClass = this.getScoreClass(score);
        const details = options.details || {};
        
        return `
            <div class="pin-popup">
                <div class="popup-header">
                    <h4 class="popup-title">${location.address || 'Lokasyon'}</h4>
                    <div class="popup-score ${scoreClass}">${score}/100</div>
                </div>
                <div class="popup-content">
                    <div class="popup-coordinates">
                        <i data-lucide="map-pin" class="w-3 h-3"></i>
                        ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
                    </div>
                    ${details.competitor ? `
                        <div class="popup-detail">
                            <span>Rakip Yoğunluğu:</span>
                            <span>${details.competitor}</span>
                        </div>
                    ` : ''}
                    ${details.pedestrian ? `
                        <div class="popup-detail">
                            <span>Yaya Erişimi:</span>
                            <span>${details.pedestrian}/100</span>
                        </div>
                    ` : ''}
                    ${details.target ? `
                        <div class="popup-detail">
                            <span>Hedef Kitle:</span>
                            <span>${details.target}/100</span>
                        </div>
                    ` : ''}
                </div>
                <div class="popup-actions">
                    <button class="btn btn-sm btn-primary" onclick="mapManager.showLocationDetails('${location.id || Date.now()}')">
                        Detayları Gör
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Animate pin appearance
     */
    animatePin(pin, animationType = 'drop-down') {
        const markerElement = pin.getElement();
        if (!markerElement) return;
        
        const markerDiv = markerElement.querySelector('.custom-marker');
        if (!markerDiv) return;
        
        switch (animationType) {
            case 'drop-down':
                markerDiv.style.transform = 'translateY(-100px) scale(0) rotate(-45deg)';
                markerDiv.style.opacity = '0';
                
                setTimeout(() => {
                    markerDiv.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    markerDiv.style.transform = 'translateY(0) scale(1) rotate(-45deg)';
                    markerDiv.style.opacity = '1';
                }, 50);
                break;
                
            case 'scale-in':
                markerDiv.style.transform = 'scale(0) rotate(-45deg)';
                markerDiv.style.opacity = '0';
                
                setTimeout(() => {
                    markerDiv.style.transition = 'all 0.4s ease-out';
                    markerDiv.style.transform = 'scale(1) rotate(-45deg)';
                    markerDiv.style.opacity = '1';
                }, 50);
                break;
                
            case 'bounce':
                markerDiv.classList.add('pin-bounce');
                setTimeout(() => {
                    markerDiv.classList.remove('pin-bounce');
                }, 1000);
                break;
        }
    }
    
    /**
     * Show heatmap with animation
     */
    showHeatmapWithAnimation(data) {
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
        }
        
        // Create heatmap layer
        this.heatmapLayer = L.heatLayer(data, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.0: '#3B82F6',
                0.2: '#10B981',
                0.4: '#F59E0B',
                0.6: '#EF4444',
                1.0: '#DC2626'
            }
        });
        
        // Add with fade-in animation
        this.heatmapLayer.setOptions({ opacity: 0 });
        this.heatmapLayer.addTo(this.map);
        
        // Animate opacity
        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.05;
            this.heatmapLayer.setOptions({ opacity });
            if (opacity >= 0.8) {
                clearInterval(fadeIn);
            }
        }, 25);
        
        this.showHeatmap = true;
        this.updateHeatmapButton();
    }
    
    /**
     * Handle pin click
     */
    handlePinClick(marker, location, score) {
        // Deselect previous pin
        if (this.selectedPin) {
            const prevElement = this.selectedPin.getElement();
            if (prevElement) {
                const prevMarker = prevElement.querySelector('.custom-marker');
                if (prevMarker) {
                    prevMarker.classList.remove('selected');
                }
            }
        }
        
        // Select new pin
        this.selectedPin = marker;
        const markerElement = marker.getElement();
        if (markerElement) {
            const markerDiv = markerElement.querySelector('.custom-marker');
            if (markerDiv) {
                markerDiv.classList.add('selected');
            }
        }
        
        // Show info panel
        this.showLocationDetails(location.id || Date.now(), location, score);
        
        // Smooth pan to location
        this.flyToLocation(location.lat, location.lng, this.map.getZoom());
    }
    
    /**
     * Handle pin hover
     */
    handlePinHover(marker, isHovering) {
        const markerElement = marker.getElement();
        if (!markerElement) return;
        
        const markerDiv = markerElement.querySelector('.custom-marker');
        if (!markerDiv) return;
        
        if (isHovering) {
            markerDiv.style.transform = 'rotate(-45deg) scale(1.2)';
            markerDiv.style.zIndex = '1000';
        } else if (!markerDiv.classList.contains('selected')) {
            markerDiv.style.transform = 'rotate(-45deg) scale(1)';
            markerDiv.style.zIndex = '';
        }
    }
    
    /**
     * Handle map click
     */
    handleMapClick(e) {
        const { lat, lng } = e.latlng;
        
        // Show coordinates display
        this.showCoordinatesDisplay(lat, lng);
        
        // Hide info panel if clicking on empty area
        if (e.originalEvent.target.classList.contains('leaflet-container')) {
            this.hideInfoPanel();
            this.deselectAllPins();
        }
    }
    
    /**
     * Smooth camera movement
     */
    flyToLocation(lat, lng, zoom = null) {
        const targetZoom = zoom || Math.max(this.map.getZoom(), 15);
        
        this.map.flyTo([lat, lng], targetZoom, {
            animate: true,
            duration: 1.5,
            easeLinearity: 0.25
        });
    }
    
    /**
     * Focus on multiple locations
     */
    focusOnLocations(locations) {
        if (!locations || locations.length === 0) return;
        
        if (locations.length === 1) {
            this.flyToLocation(locations[0].lat, locations[0].lng);
        } else {
            // Create bounds from all locations
            const bounds = L.latLngBounds(
                locations.map(loc => [loc.lat, loc.lng])
            );
            
            this.map.flyToBounds(bounds, {
                padding: [50, 50],
                animate: true,
                duration: 1.5
            });
        }
    }
    
    /**
     * Show location details in info panel
     */
    showLocationDetails(locationId, location, score) {
        const infoPanel = document.getElementById('map-info-panel');
        const infoPanelBody = document.getElementById('info-panel-body');
        
        if (!infoPanel || !infoPanelBody) return;
        
        const scoreClass = this.getScoreClass(score);
        
        infoPanelBody.innerHTML = `
            <div class="location-detail-card">
                <div class="detail-header">
                    <h4 class="detail-title">${location.address || 'Lokasyon Detayları'}</h4>
                    <div class="detail-score ${scoreClass}">${score}/100</div>
                </div>
                
                <div class="detail-section">
                    <h5 class="section-title">Konum Bilgileri</h5>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Enlem:</span>
                            <span class="detail-value">${location.lat.toFixed(6)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Boylam:</span>
                            <span class="detail-value">${location.lng.toFixed(6)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h5 class="section-title">Analiz Sonuçları</h5>
                    <div class="score-breakdown">
                        <div class="score-item">
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${score}%"></div>
                            </div>
                            <span class="score-text">Genel Skor: ${score}/100</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn btn-sm btn-outline" onclick="mapManager.exportLocationData('${locationId}')">
                        <i data-lucide="download" class="w-3 h-3"></i>
                        Dışa Aktar
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="mapManager.shareLocation('${locationId}')">
                        <i data-lucide="share" class="w-3 h-3"></i>
                        Paylaş
                    </button>
                </div>
            </div>
        `;
        
        // Show panel
        infoPanel.classList.remove('hidden');
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Show coordinates display
     */
    showCoordinatesDisplay(lat, lng) {
        const coordsDisplay = document.getElementById('coordinates-display');
        const coordsText = document.getElementById('coordinates-text');
        
        if (coordsDisplay && coordsText) {
            coordsText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            coordsDisplay.classList.remove('hidden');
            coordsDisplay._coordinates = { lat, lng };
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideCoordinatesDisplay();
            }, 5000);
        }
    }
    
    /**
     * Hide coordinates display
     */
    hideCoordinatesDisplay() {
        const coordsDisplay = document.getElementById('coordinates-display');
        if (coordsDisplay) {
            coordsDisplay.classList.add('hidden');
        }
    }
    
    /**
     * Add location from coordinates
     */
    addCoordinateLocation() {
        const coordsDisplay = document.getElementById('coordinates-display');
        if (!coordsDisplay || !coordsDisplay._coordinates) return;
        
        const { lat, lng } = coordsDisplay._coordinates;
        
        // Trigger add location in sidebar if available
        if (window.sidebar && typeof window.sidebar.addLocationFromCoordinates === 'function') {
            window.sidebar.addLocationFromCoordinates(lat, lng);
        }
        
        this.hideCoordinatesDisplay();
    }
    
    /**
     * Map control methods
     */
    zoomIn() {
        this.map.zoomIn();
    }
    
    zoomOut() {
        this.map.zoomOut();
    }
    
    centerView() {
        this.map.flyTo(this.defaultCenter, this.defaultZoom);
    }
    
    toggleFullscreen() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;
        
        if (!this.isFullscreen) {
            if (mapContainer.requestFullscreen) {
                mapContainer.requestFullscreen();
            } else if (mapContainer.webkitRequestFullscreen) {
                mapContainer.webkitRequestFullscreen();
            } else if (mapContainer.msRequestFullscreen) {
                mapContainer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        
        this.isFullscreen = !this.isFullscreen;
        this.updateFullscreenButton();
    }
    
    toggleHeatmap() {
        this.showHeatmap = !this.showHeatmap;
        
        if (this.heatmapLayer) {
            if (this.showHeatmap) {
                this.heatmapLayer.addTo(this.map);
            } else {
                this.map.removeLayer(this.heatmapLayer);
            }
        }
        
        this.updateHeatmapButton();
    }
    
    togglePins() {
        this.showPins = !this.showPins;
        
        this.pins.forEach(pin => {
            if (this.showPins) {
                pin.addTo(this.map);
            } else {
                this.map.removeLayer(pin);
            }
        });
        
        this.updatePinsButton();
    }
    
    toggleLegend() {
        const legend = document.getElementById('map-legend');
        if (legend) {
            legend.classList.toggle('expanded');
        }
    }
    
    /**
     * Update button states
     */
    updateHeatmapButton() {
        const btn = document.getElementById('toggle-heatmap-btn');
        if (btn) {
            btn.classList.toggle('active', this.showHeatmap);
        }
    }
    
    updatePinsButton() {
        const btn = document.getElementById('toggle-pins-btn');
        if (btn) {
            btn.classList.toggle('active', this.showPins);
        }
    }
    
    updateFullscreenButton() {
        const btn = document.getElementById('fullscreen-btn');
        const icon = btn?.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', this.isFullscreen ? 'minimize' : 'maximize');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
    
    /**
     * Utility methods
     */
    getScoreClass(score) {
        if (score >= 80) return 'high-score';
        if (score >= 60) return 'medium-score';
        return 'low-score';
    }
    
    hideInfoPanel() {
        const infoPanel = document.getElementById('map-info-panel');
        if (infoPanel) {
            infoPanel.classList.add('hidden');
        }
    }
    
    deselectAllPins() {
        this.pins.forEach(pin => {
            const markerElement = pin.getElement();
            if (markerElement) {
                const markerDiv = markerElement.querySelector('.custom-marker');
                if (markerDiv) {
                    markerDiv.classList.remove('selected');
                }
            }
        });
        this.selectedPin = null;
    }
    
    showLoading() {
        const loading = document.getElementById('map-loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const loading = document.getElementById('map-loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
    
    showError(message) {
        console.error('Map error:', message);
        // Could show error in UI
    }
    
    handleResize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }
    
    handleZoomChange() {
        // Update UI based on zoom level
        const zoom = this.map.getZoom();
        console.log('Zoom changed to:', zoom);
    }
    
    handleMapMove() {
        // Update UI based on map position
        const center = this.map.getCenter();
        console.log('Map moved to:', center);
    }
    
    /**
     * Clear all pins
     */
    clearPins() {
        this.pins.forEach(pin => {
            this.map.removeLayer(pin);
        });
        this.pins = [];
        this.selectedPin = null;
    }
    
    /**
     * Clear heatmap
     */
    clearHeatmap() {
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
            this.heatmapLayer = null;
        }
        this.showHeatmap = false;
        this.updateHeatmapButton();
    }
    
    /**
     * Export location data
     */
    exportLocationData(locationId) {
        console.log('Exporting location data for:', locationId);
        // Implementation for data export
    }
    
    /**
     * Share location
     */
    shareLocation(locationId) {
        console.log('Sharing location:', locationId);
        // Implementation for location sharing
    }
    
    /**
     * Cleanup map manager
     */
    cleanup() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.pins = [];
        this.heatmapLayer = null;
        this.selectedPin = null;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
}

// Make globally available
window.MapManager = MapManager;