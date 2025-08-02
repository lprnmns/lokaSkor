/**
 * HeatmapManager - Mode 2 heatmap visualization and top locations
 * Handles heatmap overlay generation, smooth animations, and top location display
 */
class HeatmapManager {
    constructor(mapManager, sidebar) {
        this.mapManager = mapManager;
        this.sidebar = sidebar;
        
        this.heatmapLayer = null;
        this.topLocationPins = [];
        this.selectedLocation = null;
        this.isVisible = false;
        
        this.initializeHeatmapStyles();
        
        console.log('HeatmapManager initialized');
    }

    initializeHeatmapStyles() {
        // Add heatmap-specific styles if not already present
        if (!document.getElementById('heatmap-styles')) {
            const styles = document.createElement('style');
            styles.id = 'heatmap-styles';
            styles.textContent = `
                .heatmap-overlay {
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                }
                
                .heatmap-overlay.visible {
                    opacity: 0.7;
                }
                
                .heatmap-cell {
                    transition: all 0.3s ease;
                }
                
                .top-location-pin {
                    --pin-size: 2.5rem;
                    position: relative;
                    cursor: pointer;
                    z-index: 150;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .top-location-pin .pin-body {
                    width: var(--pin-size);
                    height: var(--pin-size);
                    background: linear-gradient(135deg, hsl(var(--chart-2)), hsl(var(--chart-2)) 70%);
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    position: relative;
                    transition: all 0.3s ease;
                }
                
                .top-location-pin .pin-rank {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }
                
                .top-location-pin::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid hsl(var(--chart-2));
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                }
                
                .top-location-pin:hover {
                    transform: scale(1.15) translateY(-3px);
                    z-index: 200;
                }
                
                .top-location-pin:hover .pin-body {
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
                    background: linear-gradient(135deg, hsl(var(--chart-2)) 80%, hsl(var(--chart-1)));
                }
                
                .top-location-pin.selected {
                    transform: scale(1.1);
                    z-index: 180;
                }
                
                .top-location-pin.selected .pin-body {
                    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3), 0 6px 16px rgba(0, 0, 0, 0.2);
                    background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)) 70%);
                }
                
                .top-location-pin.selected::after {
                    border-top-color: hsl(var(--primary));
                }
                
                .location-tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(-10px);
                    background: hsl(var(--popover));
                    border: 1px solid hsl(var(--border));
                    border-radius: var(--radius);
                    padding: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    z-index: 1000;
                    min-width: 200px;
                }
                
                .location-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid hsl(var(--popover));
                }
                
                .top-location-pin:hover .location-tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(-5px);
                }
                
                .tooltip-rank {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: hsl(var(--primary));
                    margin-bottom: 0.25rem;
                }
                
                .tooltip-address {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: hsl(var(--foreground));
                    margin-bottom: 0.25rem;
                    line-height: 1.3;
                }
                
                .tooltip-score {
                    font-size: 0.75rem;
                    color: hsl(var(--muted-foreground));
                }
                
                .heatmap-legend {
                    position: absolute;
                    bottom: 2rem;
                    right: 2rem;
                    background: hsl(var(--card));
                    border: 1px solid hsl(var(--border));
                    border-radius: var(--radius);
                    padding: 1rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s ease;
                }
                
                .heatmap-legend.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .legend-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: hsl(var(--foreground));
                    margin-bottom: 0.5rem;
                }
                
                .legend-gradient {
                    width: 150px;
                    height: 20px;
                    background: linear-gradient(to right, 
                        rgba(255, 0, 0, 0.3), 
                        rgba(255, 165, 0, 0.5), 
                        rgba(0, 255, 0, 0.7)
                    );
                    border-radius: 10px;
                    margin-bottom: 0.5rem;
                }
                
                .legend-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: hsl(var(--muted-foreground));
                }
            `;
            document.head.appendChild(styles);
        }
    }

    async showHeatmap(mahalleId, businessType) {
        try {
            // Get heatmap data
            const heatmapData = await this.getHeatmapData(mahalleId, businessType);
            
            // Create heatmap layer
            this.createHeatmapLayer(heatmapData);
            
            // Show legend
            this.showLegend();
            
            // Get and display top locations
            const topLocations = await this.getTopLocations(mahalleId, businessType);
            this.displayTopLocations(topLocations);
            
            this.isVisible = true;
            
            return { heatmapData, topLocations };
            
        } catch (error) {
            console.error('Error showing heatmap:', error);
            throw error;
        }
    }

    async getHeatmapData(mahalleId, businessType) {
        try {
            // This would call your backend API
            // For now, return mock heatmap data
            return this.generateMockHeatmapData(mahalleId);
        } catch (error) {
            console.warn('Using mock heatmap data:', error);
            return this.generateMockHeatmapData(mahalleId);
        }
    }

    generateMockHeatmapData(mahalleId) {
        // Generate a grid of heatmap cells for the selected mahalle
        const cells = [];
        const centerLat = 39.9334;
        const centerLng = 32.8597;
        const gridSize = 0.005; // Approximately 500m
        const gridCount = 20;
        
        for (let i = 0; i < gridCount; i++) {
            for (let j = 0; j < gridCount; j++) {
                const lat = centerLat + (i - gridCount/2) * gridSize;
                const lng = centerLng + (j - gridCount/2) * gridSize;
                
                // Generate intensity based on distance from center and some randomness
                const distanceFromCenter = Math.sqrt(
                    Math.pow(i - gridCount/2, 2) + Math.pow(j - gridCount/2, 2)
                );
                const baseIntensity = Math.max(0, 1 - (distanceFromCenter / (gridCount/2)));
                const randomFactor = 0.3 + Math.random() * 0.7;
                const intensity = Math.min(1, baseIntensity * randomFactor);
                
                if (intensity > 0.1) { // Only include cells with meaningful intensity
                    cells.push({
                        lat,
                        lng,
                        intensity,
                        potential: Math.round(intensity * 100)
                    });
                }
            }
        }
        
        return {
            type: 'heatmap',
            cells: cells.sort((a, b) => b.intensity - a.intensity)
        };
    }

    createHeatmapLayer(heatmapData) {
        if (!this.mapManager || !this.mapManager.map) return;
        
        // Remove existing heatmap
        this.clearHeatmap();
        
        // Create heatmap overlay container
        const heatmapContainer = document.createElement('div');
        heatmapContainer.className = 'heatmap-overlay';
        heatmapContainer.id = 'heatmap-overlay';
        
        // Add heatmap cells
        heatmapData.cells.forEach((cell, index) => {
            const cellElement = this.createHeatmapCell(cell);
            heatmapContainer.appendChild(cellElement);
            
            // Animate cell appearance
            setTimeout(() => {
                cellElement.style.opacity = cell.intensity.toString();
            }, index * 10);
        });
        
        // Add to map
        this.mapManager.addOverlay(heatmapContainer);
        
        // Fade in the entire heatmap
        setTimeout(() => {
            heatmapContainer.classList.add('visible');
        }, 100);
        
        this.heatmapLayer = heatmapContainer;
    }

    createHeatmapCell(cell) {
        const cellElement = document.createElement('div');
        cellElement.className = 'heatmap-cell';
        
        // Calculate color based on intensity
        const color = this.getHeatmapColor(cell.intensity);
        const size = 30 + (cell.intensity * 20); // 30-50px based on intensity
        
        cellElement.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            transform: translate(-50%, -50%);
        `;
        
        // Position on map (this would use actual map projection)
        const mapBounds = this.mapManager.getBounds();
        const x = ((cell.lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
        const y = ((mapBounds.north - cell.lat) / (mapBounds.north - mapBounds.south)) * 100;
        
        cellElement.style.left = `${x}%`;
        cellElement.style.top = `${y}%`;
        
        return cellElement;
    }

    getHeatmapColor(intensity) {
        // Create color gradient from red (low) to green (high)
        const red = Math.round(255 * (1 - intensity));
        const green = Math.round(255 * intensity);
        const blue = 0;
        const alpha = 0.3 + (intensity * 0.4); // 0.3 to 0.7 alpha
        
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    async getTopLocations(mahalleId, businessType) {
        try {
            // This would call your backend API
            // For now, return mock top locations
            return this.generateMockTopLocations();
        } catch (error) {
            console.warn('Using mock top locations:', error);
            return this.generateMockTopLocations();
        }
    }

    generateMockTopLocations() {
        const locations = [
            {
                id: 1,
                address: 'Kızılay Meydanı, Çankaya',
                coordinates: [32.8597, 39.9334],
                score: 95,
                potential: 'Çok Yüksek',
                details: {
                    footTraffic: 'Yüksek',
                    competition: 'Orta',
                    accessibility: 'Mükemmel'
                }
            },
            {
                id: 2,
                address: 'Tunalı Hilmi Caddesi, Çankaya',
                coordinates: [32.8547, 39.9284],
                score: 88,
                potential: 'Yüksek',
                details: {
                    footTraffic: 'Yüksek',
                    competition: 'Yüksek',
                    accessibility: 'İyi'
                }
            },
            {
                id: 3,
                address: 'Çayyolu Merkez, Çankaya',
                coordinates: [32.7897, 39.9134],
                score: 82,
                potential: 'Yüksek',
                details: {
                    footTraffic: 'Orta',
                    competition: 'Düşük',
                    accessibility: 'İyi'
                }
            },
            {
                id: 4,
                address: 'Bahçelievler Merkez, Çankaya',
                coordinates: [32.8347, 39.9184],
                score: 76,
                potential: 'Orta',
                details: {
                    footTraffic: 'Orta',
                    competition: 'Orta',
                    accessibility: 'Orta'
                }
            },
            {
                id: 5,
                address: 'Emek Mahallesi, Çankaya',
                coordinates: [32.8197, 39.9084],
                score: 71,
                potential: 'Orta',
                details: {
                    footTraffic: 'Orta',
                    competition: 'Düşük',
                    accessibility: 'Orta'
                }
            }
        ];
        
        return locations.sort((a, b) => b.score - a.score);
    }

    displayTopLocations(locations) {
        // Clear existing pins
        this.clearTopLocationPins();
        
        // Create pins for each location
        locations.forEach((location, index) => {
            const pin = this.createTopLocationPin(location, index + 1);
            this.topLocationPins.push({
                id: location.id,
                element: pin,
                data: location
            });
            
            // Add to map with animation delay
            setTimeout(() => {
                this.mapManager.addPin({
                    id: `top-location-${location.id}`,
                    coordinates: location.coordinates,
                    element: pin,
                    data: location,
                    onClick: () => this.selectTopLocation(location)
                });
                
                // Animate pin appearance
                pin.style.opacity = '0';
                pin.style.transform = 'scale(0.5) translateY(20px)';
                
                setTimeout(() => {
                    pin.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    pin.style.opacity = '1';
                    pin.style.transform = 'scale(1) translateY(0)';
                }, 50);
                
            }, index * 200);
        });
        
        // Update sidebar with top locations
        if (this.sidebar) {
            this.sidebar.showMode2Results(locations);
        }
    }

    createTopLocationPin(location, rank) {
        const pin = document.createElement('div');
        pin.className = 'top-location-pin';
        pin.dataset.locationId = location.id;
        
        pin.innerHTML = `
            <div class="pin-body">
                <div class="pin-rank">${rank}</div>
            </div>
            <div class="location-tooltip">
                <div class="tooltip-rank">#${rank} En İyi Lokasyon</div>
                <div class="tooltip-address">${location.address}</div>
                <div class="tooltip-score">Potansiyel: ${location.potential} (${location.score})</div>
            </div>
        `;
        
        // Add hover effects
        pin.addEventListener('mouseenter', () => {
            this.highlightSidebarLocation(location.id);
        });
        
        pin.addEventListener('mouseleave', () => {
            this.unhighlightSidebarLocation(location.id);
        });
        
        return pin;
    }

    selectTopLocation(location) {
        // Remove previous selection
        this.topLocationPins.forEach(pin => {
            pin.element.classList.remove('selected');
        });
        
        // Add selection to clicked pin
        const selectedPin = this.topLocationPins.find(pin => pin.id === location.id);
        if (selectedPin) {
            selectedPin.element.classList.add('selected');
        }
        
        // Focus on location
        if (this.mapManager) {
            this.mapManager.focusOnLocation(location.coordinates, location);
        }
        
        // Update sidebar selection
        if (this.sidebar) {
            this.sidebar.selectTopLocation(location);
        }
        
        this.selectedLocation = location;
    }

    highlightSidebarLocation(locationId) {
        const sidebarItem = document.querySelector(`[data-location-id="${locationId}"]`);
        if (sidebarItem) {
            sidebarItem.classList.add('location-hover');
        }
    }

    unhighlightSidebarLocation(locationId) {
        const sidebarItem = document.querySelector(`[data-location-id="${locationId}"]`);
        if (sidebarItem) {
            sidebarItem.classList.remove('location-hover');
        }
    }

    showLegend() {
        // Remove existing legend
        this.hideLegend();
        
        const legend = document.createElement('div');
        legend.className = 'heatmap-legend';
        legend.id = 'heatmap-legend';
        
        legend.innerHTML = `
            <div class="legend-title">Potansiyel Haritası</div>
            <div class="legend-gradient"></div>
            <div class="legend-labels">
                <span>Düşük</span>
                <span>Orta</span>
                <span>Yüksek</span>
            </div>
        `;
        
        document.body.appendChild(legend);
        
        // Animate in
        setTimeout(() => {
            legend.classList.add('visible');
        }, 300);
    }

    hideLegend() {
        const existingLegend = document.getElementById('heatmap-legend');
        if (existingLegend) {
            existingLegend.classList.remove('visible');
            setTimeout(() => {
                if (existingLegend.parentNode) {
                    existingLegend.parentNode.removeChild(existingLegend);
                }
            }, 300);
        }
    }

    clearHeatmap() {
        if (this.heatmapLayer) {
            this.heatmapLayer.classList.remove('visible');
            
            setTimeout(() => {
                if (this.mapManager) {
                    this.mapManager.removeOverlay(this.heatmapLayer);
                }
                this.heatmapLayer = null;
            }, 500);
        }
        
        this.hideLegend();
    }

    clearTopLocationPins() {
        this.topLocationPins.forEach(pin => {
            if (this.mapManager) {
                this.mapManager.removePin(`top-location-${pin.id}`);
            }
        });
        
        this.topLocationPins = [];
        this.selectedLocation = null;
    }

    clearAll() {
        this.clearHeatmap();
        this.clearTopLocationPins();
        this.isVisible = false;
    }

    // Animation methods
    animateHeatmapIn() {
        if (!this.heatmapLayer) return;
        
        const cells = this.heatmapLayer.querySelectorAll('.heatmap-cell');
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.transform = 'translate(-50%, -50%) scale(1)';
                cell.style.opacity = cell.dataset.intensity;
            }, index * 20);
        });
    }

    animateHeatmapOut() {
        if (!this.heatmapLayer) return;
        
        const cells = this.heatmapLayer.querySelectorAll('.heatmap-cell');
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.transform = 'translate(-50%, -50%) scale(0)';
                cell.style.opacity = '0';
            }, index * 10);
        });
    }

    // Public API methods
    isHeatmapVisible() {
        return this.isVisible;
    }

    getSelectedLocation() {
        return this.selectedLocation;
    }

    getTopLocations() {
        return this.topLocationPins.map(pin => pin.data);
    }

    focusOnTopLocation(locationId) {
        const location = this.topLocationPins.find(pin => pin.id === locationId);
        if (location) {
            this.selectTopLocation(location.data);
        }
    }

    updateHeatmapIntensity(multiplier = 1) {
        if (!this.heatmapLayer) return;
        
        const cells = this.heatmapLayer.querySelectorAll('.heatmap-cell');
        cells.forEach(cell => {
            const currentOpacity = parseFloat(cell.style.opacity);
            const newOpacity = Math.min(1, currentOpacity * multiplier);
            cell.style.opacity = newOpacity.toString();
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeatmapManager;
}