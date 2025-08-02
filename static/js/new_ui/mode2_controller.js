/**
 * LocationIQ Modern UI - Mode 2 Controller
 * Handles region analysis logic and interface
 */

class Mode2Controller {
    constructor(apiClient, mapManager, sidebar) {
        this.apiClient = apiClient;
        this.mapManager = mapManager;
        this.sidebar = sidebar;
        this.selectedRegion = { il: null, ilce: null, mahalle: null };
        this.analysisResults = null;
        this.topLocations = [];
        this.businessType = null;
        this.isAnalyzing = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadRegionData();
        console.log('Mode2Controller initialized');
    }
    
    setupEventListeners() {
        const ilSelect = document.getElementById('il-select');
        const ilceSelect = document.getElementById('ilce-select');
        const mahalleSelect = document.getElementById('mahalle-select');
        const analyzeBtn = document.getElementById('analyze-region-btn');
        
        if (ilSelect) {
            ilSelect.addEventListener('change', (e) => {
                this.handleRegionChange('il', e.target.value);
            });
        }
        
        if (ilceSelect) {
            ilceSelect.addEventListener('change', (e) => {
                this.handleRegionChange('ilce', e.target.value);
            });
        }
        
        if (mahalleSelect) {
            mahalleSelect.addEventListener('change', (e) => {
                this.handleRegionChange('mahalle', e.target.value);
            });
        }
        
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeRegion());
        }
    }
    
    async loadRegionData() {
        try {
            this.setLoading(true, 'Bölge verileri yükleniyor...');
            
            const provinces = [
                'Adana', 'Ankara', 'Antalya', 'Bursa', 'İstanbul', 'İzmir', 'Konya'
            ];
            
            const ilSelect = document.getElementById('il-select');
            if (ilSelect) {
                ilSelect.innerHTML = '<option value="">İl Seçiniz</option>' +
                    provinces.map(il => `<option value="${il}">${il}</option>`).join('');
            }
            
            this.setLoading(false);
            
        } catch (error) {
            console.error('Error loading region data:', error);
            this.setLoading(false);
            this.showError('Bölge verileri yüklenirken hata oluştu');
        }
    }
    
    async handleRegionChange(level, value) {
        this.selectedRegion[level] = value;
        
        if (level === 'il') {
            this.selectedRegion.ilce = null;
            this.selectedRegion.mahalle = null;
            
            const ilceSelect = document.getElementById('ilce-select');
            const mahalleSelect = document.getElementById('mahalle-select');
            
            if (ilceSelect) {
                ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
                ilceSelect.disabled = !value;
            }
            
            if (mahalleSelect) {
                mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
                mahalleSelect.disabled = true;
            }
            
            if (value) {
                await this.loadIlceData(value);
            }
            
        } else if (level === 'ilce') {
            this.selectedRegion.mahalle = null;
            
            const mahalleSelect = document.getElementById('mahalle-select');
            if (mahalleSelect) {
                mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
                mahalleSelect.disabled = !value;
            }
            
            if (value) {
                await this.loadMahalleData(this.selectedRegion.il, value);
            }
        }
        
        this.updateAnalyzeButton();
    }
    
    async loadIlceData(il) {
        try {
            this.setLoading(true, 'İlçeler yükleniyor...');
            
            const districtData = {
                'Ankara': ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan'],
                'İstanbul': ['Kadıköy', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Fatih'],
                'İzmir': ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Bayraklı']
            };
            
            const districts = districtData[il] || ['Merkez'];
            
            const ilceSelect = document.getElementById('ilce-select');
            if (ilceSelect) {
                ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>' +
                    districts.map(ilce => `<option value="${ilce}">${ilce}</option>`).join('');
                ilceSelect.disabled = false;
            }
            
            this.setLoading(false);
            
        } catch (error) {
            console.error('Error loading district data:', error);
            this.setLoading(false);
        }
    }
    
    async loadMahalleData(il, ilce) {
        try {
            this.setLoading(true, 'Mahalleler yükleniyor...');
            
            const neighborhoods = [
                'Kızılay Mahallesi', 'Tunalı Mahallesi', 'Bahçelievler Mahallesi',
                'Çayyolu Mahallesi', 'Ümitköy Mahallesi'
            ];
            
            const mahalleSelect = document.getElementById('mahalle-select');
            if (mahalleSelect) {
                mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>' +
                    neighborhoods.map(mahalle => `<option value="${mahalle}">${mahalle}</option>`).join('');
                mahalleSelect.disabled = false;
            }
            
            this.setLoading(false);
            
        } catch (error) {
            console.error('Error loading neighborhood data:', error);
            this.setLoading(false);
        }
    }
    
    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyze-region-btn');
        const analyzeBtnText = document.getElementById('region-analyze-btn-text');
        
        if (analyzeBtn) {
            const canAnalyze = this.selectedRegion.il && 
                              this.selectedRegion.ilce && 
                              this.selectedRegion.mahalle && 
                              !this.isAnalyzing;
            
            analyzeBtn.disabled = !canAnalyze;
            
            if (analyzeBtnText) {
                if (this.isAnalyzing) {
                    analyzeBtnText.textContent = 'Analiz Ediliyor...';
                } else if (!this.selectedRegion.mahalle) {
                    analyzeBtnText.textContent = 'Mahalle Seçiniz';
                } else {
                    analyzeBtnText.textContent = 'Potansiyeli Yüksek Bölgeleri Göster';
                }
            }
        }
    }
    
    async analyzeRegion() {
        if (!this.selectedRegion.mahalle || this.isAnalyzing) return;
        
        try {
            this.isAnalyzing = true;
            this.updateAnalyzeButton();
            this.setLoading(true, 'Bölge analiz ediliyor...');
            
            const businessType = this.getBusinessType();
            if (!businessType) {
                throw new Error('İşletme türü belirtilmemiş');
            }
            
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            const heatmapData = this.generateHeatmapData();
            const topLocations = this.generateTopLocations();
            
            this.analysisResults = {
                region: this.selectedRegion,
                businessType: businessType,
                heatmapData: heatmapData,
                topLocations: topLocations,
                analyzedAt: new Date()
            };
            
            this.topLocations = topLocations;
            
            this.showHeatmap(heatmapData);
            this.showTopLocations(topLocations);
            
            this.setLoading(false);
            this.isAnalyzing = false;
            this.updateAnalyzeButton();
            
        } catch (error) {
            console.error('Error analyzing region:', error);
            this.setLoading(false);
            this.isAnalyzing = false;
            this.updateAnalyzeButton();
            this.showError('Bölge analizi sırasında hata oluştu: ' + error.message);
        }
    }
    
    generateHeatmapData() {
        const centerLat = 39.9334;
        const centerLng = 32.8597;
        const heatmapData = [];
        
        for (let i = 0; i < 50; i++) {
            const lat = centerLat + (Math.random() - 0.5) * 0.02;
            const lng = centerLng + (Math.random() - 0.5) * 0.02;
            const intensity = Math.random();
            
            heatmapData.push([lat, lng, intensity]);
        }
        
        return heatmapData;
    }
    
    generateTopLocations() {
        const locationNames = [
            'Ana Cadde Üzeri', 'Merkez Meydanı', 'Okul Karşısı', 
            'Hastane Yakını', 'Park Girişi'
        ];
        
        const topLocations = [];
        const centerLat = 39.9334;
        const centerLng = 32.8597;
        
        for (let i = 0; i < 5; i++) {
            const location = {
                id: Date.now() + i,
                name: locationNames[i],
                lat: centerLat + (Math.random() - 0.5) * 0.01,
                lng: centerLng + (Math.random() - 0.5) * 0.01,
                score: Math.floor(Math.random() * 20) + 80 - (i * 3),
                details: {
                    competitor: Math.random() > 0.5 ? 'Düşük' : 'Orta',
                    pedestrian: Math.floor(Math.random() * 20) + 80 - (i * 2),
                    target: Math.floor(Math.random() * 15) + 85 - (i * 2)
                },
                rank: i + 1
            };
            
            topLocations.push(location);
        }
        
        return topLocations;
    }
    
    showHeatmap(heatmapData) {
        if (this.mapManager) {
            // Show heatmap with enhanced animation
            this.mapManager.showHeatmapWithAnimation(heatmapData);
            
            // Calculate center and bounds
            const centerLat = heatmapData.reduce((sum, point) => sum + point[0], 0) / heatmapData.length;
            const centerLng = heatmapData.reduce((sum, point) => sum + point[1], 0) / heatmapData.length;
            
            // Focus map on the region with appropriate zoom
            this.mapManager.flyToLocation(centerLat, centerLng, 13);
            
            // Show heatmap legend
            this.showHeatmapLegend();
            
            // Add heatmap statistics
            this.showHeatmapStats(heatmapData);
        }
    }
    
    /**
     * Show heatmap legend
     */
    showHeatmapLegend() {
        const legend = document.getElementById('map-legend');
        if (legend) {
            legend.classList.remove('hidden');
            
            // Update legend content for heatmap
            const legendContent = legend.querySelector('.legend-content');
            if (legendContent) {
                legendContent.innerHTML = `
                    <div class="legend-item">
                        <div class="heatmap-color high-intensity"></div>
                        <span class="legend-label">Yüksek Potansiyel</span>
                    </div>
                    <div class="legend-item">
                        <div class="heatmap-color medium-intensity"></div>
                        <span class="legend-label">Orta Potansiyel</span>
                    </div>
                    <div class="legend-item">
                        <div class="heatmap-color low-intensity"></div>
                        <span class="legend-label">Düşük Potansiyel</span>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Show heatmap statistics
     */
    showHeatmapStats(heatmapData) {
        // Calculate statistics
        const intensities = heatmapData.map(point => point[2]);
        const avgIntensity = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
        const maxIntensity = Math.max(...intensities);
        const highIntensityPoints = intensities.filter(val => val > 0.7).length;
        
        // Create or update stats panel
        let statsPanel = document.getElementById('heatmap-stats');
        if (!statsPanel) {
            statsPanel = document.createElement('div');
            statsPanel.id = 'heatmap-stats';
            statsPanel.className = 'heatmap-stats';
            
            const regionResults = document.getElementById('region-results');
            if (regionResults) {
                regionResults.insertBefore(statsPanel, regionResults.firstChild);
            }
        }
        
        statsPanel.innerHTML = `
            <div class="stats-header">
                <h4 class="stats-title">
                    <i data-lucide="thermometer" class="w-4 h-4"></i>
                    Bölge Potansiyel Analizi
                </h4>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${Math.round(avgIntensity * 100)}%</div>
                    <div class="stat-label">Ortalama Potansiyel</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Math.round(maxIntensity * 100)}%</div>
                    <div class="stat-label">En Yüksek Potansiyel</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${highIntensityPoints}</div>
                    <div class="stat-label">Yüksek Potansiyel Alan</div>
                </div>
            </div>
        `;
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    showTopLocations(locations) {
        const resultsSection = document.getElementById('region-results');
        const topLocationsList = document.getElementById('top-locations-list');
        
        if (!resultsSection || !topLocationsList) return;
        
        // Create enhanced location cards
        topLocationsList.innerHTML = locations.map((location, index) => {
            const scoreClass = this.getScoreClass(location.score);
            const competitorClass = this.getCompetitorClass(location.details.competitor);
            
            return `
                <div class="top-location-item stagger-item" data-location-id="${location.id}" style="animation-delay: ${index * 0.1}s">
                    <div class="location-rank rank-${location.rank}">
                        <span class="rank-number">${location.rank}</span>
                        ${location.rank === 1 ? '<i data-lucide="crown" class="rank-icon"></i>' : ''}
                    </div>
                    <div class="location-details">
                        <div class="location-header">
                            <div class="location-name">${location.name}</div>
                            <div class="location-score ${scoreClass}">${location.score}/100</div>
                        </div>
                        <div class="location-metrics">
                            <div class="metric-chip">
                                <span class="metric-label">Rakip:</span>
                                <span class="metric-value ${competitorClass}">${location.details.competitor}</span>
                            </div>
                            <div class="metric-chip">
                                <span class="metric-label">Yaya:</span>
                                <span class="metric-value">${location.details.pedestrian}/100</span>
                            </div>
                            <div class="metric-chip">
                                <span class="metric-label">Hedef:</span>
                                <span class="metric-value">${location.details.target}/100</span>
                            </div>
                        </div>
                        <div class="location-coordinates">
                            <i data-lucide="map-pin" class="w-3 h-3"></i>
                            ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
                        </div>
                        <div class="location-insights">
                            ${this.generateLocationInsight(location)}
                        </div>
                    </div>
                    <div class="location-actions">
                        <button class="btn btn-sm btn-outline" onclick="mode2Controller.focusLocation(${location.id})" title="Haritada göster">
                            <i data-lucide="map-pin" class="w-3 h-3"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="mode2Controller.showLocationDetails(${location.id})" title="Detaylar">
                            <i data-lucide="info" class="w-3 h-3"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="mode2Controller.exportLocation(${location.id})" title="Dışa aktar">
                            <i data-lucide="download" class="w-3 h-3"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Show results section with enhanced animation
        resultsSection.classList.remove('hidden');
        resultsSection.style.opacity = '0';
        resultsSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultsSection.style.transition = 'all 0.4s ease-out';
            resultsSection.style.opacity = '1';
            resultsSection.style.transform = 'translateY(0)';
            
            // Trigger stagger animations for location items
            const locationItems = resultsSection.querySelectorAll('.stagger-item');
            locationItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('animate-scale-in');
                }, index * 150);
            });
        }, 100);
        
        // Add summary section
        this.showLocationsSummary(locations);
        
        // Add pins to map with enhanced animations
        this.addLocationPinsToMap(locations);
        
        // Show comparison chart
        this.showLocationsChart(locations);
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Generate location insight
     */
    generateLocationInsight(location) {
        const insights = [];
        
        if (location.score >= 85) {
            insights.push('Mükemmel lokasyon');
        } else if (location.score >= 75) {
            insights.push('Çok iyi seçenek');
        } else if (location.score >= 65) {
            insights.push('İyi potansiyel');
        }
        
        if (location.details.competitor === 'Düşük') {
            insights.push('Az rekabet');
        }
        
        if (location.details.pedestrian >= 80) {
            insights.push('Yüksek yaya trafiği');
        }
        
        if (location.details.target >= 80) {
            insights.push('İdeal hedef kitle');
        }
        
        return insights.length > 0 ? 
            `<div class="insight-tags">${insights.map(insight => `<span class="insight-tag">${insight}</span>`).join('')}</div>` : 
            '';
    }
    
    /**
     * Show locations summary
     */
    showLocationsSummary(locations) {
        const resultsSection = document.getElementById('region-results');
        if (!resultsSection) return;
        
        // Create summary if it doesn't exist
        let summarySection = document.getElementById('locations-summary');
        if (!summarySection) {
            summarySection = document.createElement('div');
            summarySection.id = 'locations-summary';
            summarySection.className = 'locations-summary';
            resultsSection.insertBefore(summarySection, resultsSection.firstChild);
        }
        
        const bestLocation = locations[0];
        const averageScore = Math.round(locations.reduce((sum, loc) => sum + loc.score, 0) / locations.length);
        const highScoreCount = locations.filter(loc => loc.score >= 80).length;
        
        summarySection.innerHTML = `
            <div class="summary-header">
                <h3 class="summary-title">
                    <i data-lucide="star" class="w-4 h-4"></i>
                    ${this.selectedRegion.mahalle} - En İyi 5 Lokasyon
                </h3>
                <div class="summary-badge">
                    ${this.selectedRegion.il} / ${this.selectedRegion.ilce}
                </div>
            </div>
            
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="stat-icon">
                        <i data-lucide="trophy" class="w-4 h-4"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${bestLocation.name}</div>
                        <div class="stat-label">En İyi Lokasyon (${bestLocation.score}/100)</div>
                    </div>
                </div>
                
                <div class="summary-stat">
                    <div class="stat-icon">
                        <i data-lucide="trending-up" class="w-4 h-4"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${averageScore}/100</div>
                        <div class="stat-label">Ortalama Skor</div>
                    </div>
                </div>
                
                <div class="summary-stat">
                    <div class="stat-icon">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${highScoreCount}/5</div>
                        <div class="stat-label">Yüksek Skorlu Lokasyon</div>
                    </div>
                </div>
            </div>
            
            <div class="summary-recommendation">
                <i data-lucide="lightbulb" class="w-4 h-4"></i>
                <span>${this.generateRegionRecommendation(locations)}</span>
            </div>
        `;
    }
    
    /**
     * Generate region recommendation
     */
    generateRegionRecommendation(locations) {
        const averageScore = locations.reduce((sum, loc) => sum + loc.score, 0) / locations.length;
        const bestLocation = locations[0];
        
        if (averageScore >= 80) {
            return `${this.selectedRegion.mahalle} mükemmel bir bölge! ${bestLocation.name} özellikle öne çıkıyor.`;
        } else if (averageScore >= 70) {
            return `${this.selectedRegion.mahalle} iyi bir seçim. ${bestLocation.name} en yüksek potansiyele sahip.`;
        } else if (averageScore >= 60) {
            return `${this.selectedRegion.mahalle} orta seviyede potansiyel sunuyor. ${bestLocation.name} en iyi seçenek.`;
        } else {
            return `${this.selectedRegion.mahalle} için alternatif bölgeleri de değerlendirmeyi düşünün.`;
        }
    }
    
    /**
     * Show locations comparison chart
     */
    showLocationsChart(locations) {
        const resultsSection = document.getElementById('region-results');
        if (!resultsSection) return;
        
        // Create chart container
        let chartContainer = document.getElementById('locations-chart');
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.id = 'locations-chart';
            chartContainer.className = 'locations-chart';
            resultsSection.appendChild(chartContainer);
        }
        
        chartContainer.innerHTML = `
            <div class="chart-header">
                <h4 class="chart-title">
                    <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
                    Skor Karşılaştırması
                </h4>
            </div>
            <div class="chart-content">
                ${locations.map((location, index) => `
                    <div class="chart-bar-container">
                        <div class="chart-bar">
                            <div class="chart-bar-fill ${this.getScoreClass(location.score)}" 
                                 style="width: ${location.score}%; animation-delay: ${index * 0.1}s">
                            </div>
                        </div>
                        <div class="chart-label">
                            <span class="chart-location">${location.name}</span>
                            <span class="chart-score">${location.score}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Animate chart bars
        setTimeout(() => {
            const chartBars = chartContainer.querySelectorAll('.chart-bar-fill');
            chartBars.forEach(bar => {
                bar.classList.add('animate-width');
            });
        }, 500);
    }
    
    /**
     * Get score class for styling
     */
    getScoreClass(score) {
        if (score >= 80) return 'high-score';
        if (score >= 60) return 'medium-score';
        return 'low-score';
    }
    
    /**
     * Get competitor class for styling
     */
    getCompetitorClass(competitor) {
        switch (competitor.toLowerCase()) {
            case 'düşük': return 'competitor-low';
            case 'orta': return 'competitor-medium';
            case 'yüksek': return 'competitor-high';
            default: return 'competitor-medium';
        }
    }
    
    addLocationPinsToMap(locations) {
        if (!this.mapManager) return;
        
        locations.forEach((location, index) => {
            setTimeout(() => {
                const pin = this.mapManager.addPinWithAnimation(location, location.score, {
                    delay: index * 200,
                    details: location.details
                });
                
                location.mapPin = pin;
            }, index * 300);
        });
    }
    
    focusLocation(locationId) {
        const location = this.topLocations.find(loc => loc.id === locationId);
        if (!location || !this.mapManager) return;
        
        this.mapManager.flyToLocation(location.lat, location.lng, 16);
        
        const targetItem = document.querySelector(`[data-location-id="${locationId}"]`);
        if (targetItem) {
            targetItem.classList.add('highlighted');
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                targetItem.classList.remove('highlighted');
            }, 3000);
        }
    }
    
    getBusinessType() {
        if (window.LocationIQApp) {
            const state = window.LocationIQApp.getState();
            return state.selectedBusinessType;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('business');
    }
    
    setLoading(isLoading, message = 'Yükleniyor...') {
        if (this.sidebar && typeof this.sidebar.setLoading === 'function') {
            this.sidebar.setLoading(isLoading, message);
        }
    }
    
    showError(message) {
        if (window.LocationIQApp && window.LocationIQApp.errorHandler) {
            window.LocationIQApp.errorHandler.showError('Hata', message);
        } else {
            alert(message);
        }
    }
    
    reset() {
        this.selectedRegion = { il: null, ilce: null, mahalle: null };
        this.analysisResults = null;
        this.topLocations = [];
        this.isAnalyzing = false;
        
        const ilSelect = document.getElementById('il-select');
        const ilceSelect = document.getElementById('ilce-select');
        const mahalleSelect = document.getElementById('mahalle-select');
        
        if (ilSelect) ilSelect.value = '';
        if (ilceSelect) {
            ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
            ilceSelect.disabled = true;
        }
        if (mahalleSelect) {
            mahalleSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
            mahalleSelect.disabled = true;
        }
        
        this.updateAnalyzeButton();
        
        const resultsSection = document.getElementById('region-results');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
        
        if (this.mapManager) {
            this.mapManager.clearPins();
            this.mapManager.clearHeatmap();
        }
    }
    
    setBusinessType(businessType) {
        this.businessType = businessType;
    }
    
    cleanup() {
        this.reset();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Mode2Controller;
}

// Make globally available
window.Mode2Controller = Mode2Controller;