/**
 * DetailPanelManager - Core infrastructure for expandable detail panels
 * Manages panel state, data caching, and category-specific content rendering
 */

class DetailPanelManager {
    constructor(comparisonInstance) {
        this.comparison = comparisonInstance;
        this.activePanels = new Set();
        this.panelData = new Map();
        
        // Panel type definitions
        this.panelTypes = {
            HOSPITAL: 'hospital',
            IMPORTANT_PLACES: 'important_places', 
            DEMOGRAPHIC: 'demographic',
            COMPETITOR: 'competitor'
        };
        
        // Initialize expander
        this.expander = new CategoryExpander(this);
        
        console.log('🔧 DetailPanelManager initialized');
    }

    /**
     * Toggle panel open/close state
     * @param {string} categoryType - Type of category (hospital, demographic, etc.)
     * @param {string} locationId - ID of the location
     * @param {HTMLElement} triggerElement - Element that triggered the panel
     */
    async togglePanel(categoryType, locationId, triggerElement) {
        console.log(`🔄 Toggle panel: ${categoryType} for location: ${locationId}`);
        console.log(`📊 Currently active panels:`, Array.from(this.activePanels));
        
        const panelKey = `${categoryType}_${locationId}`;
        const existingPanel = document.querySelector(`[data-panel-key="${panelKey}"]`);
        
        // If clicking same panel that's already open, close it
        if (this.activePanels.has(panelKey) && existingPanel) {
            console.log(`❌ Closing same panel: ${panelKey}`);
            await this.closePanel(panelKey);
            return;
        }
        
        // Close any other panel from the SAME location (but keep other locations open)
        const panelsToClose = [];
        this.activePanels.forEach(activeKey => {
            if (activeKey.endsWith(`_${locationId}`) && activeKey !== panelKey) {
                panelsToClose.push(activeKey);
            }
        });
        
        console.log(`🔄 Panels to close from same location:`, panelsToClose);
        
        // Close panels from same location
        for (const keyToClose of panelsToClose) {
            console.log(`❌ Closing panel from same location: ${keyToClose}`);
            await this.closePanel(keyToClose);
        }
        
        // Open the new panel
        console.log(`✅ Opening new panel: ${panelKey}`);
        await this.openPanel(categoryType, locationId, triggerElement);
        
        console.log(`📊 Active panels after toggle:`, Array.from(this.activePanels));
    }

    /**
     * Open a specific panel
     */
    async openPanel(categoryType, locationId, triggerElement) {
        const panelKey = `${categoryType}_${locationId}`;
        
        try {
            // Create panel container
            const container = this.createPanelContainer(panelKey, categoryType);
            
            // Insert panel after the trigger element's parent card
            const cardElement = triggerElement.closest('.result-card');
            if (cardElement) {
                cardElement.insertAdjacentElement('afterend', container);
            }
            
            // Load and render panel data
            await this.loadAndRenderPanel(categoryType, locationId, container);
            
            // Expand with animation
            await this.expander.expandPanel(container);
            
            // Update state
            this.activePanels.add(panelKey);
            
            // Add visual feedback to trigger
            this.addActiveFeedback(triggerElement);
            
            console.log(`✅ Panel opened: ${panelKey}`);
            
        } catch (error) {
            console.error(`❌ Error opening panel ${panelKey}:`, error);
            this.showError('Panel açılırken hata oluştu');
        }
    }

    /**
     * Close a specific panel
     */
    async closePanel(panelKey) {
        const container = document.querySelector(`[data-panel-key="${panelKey}"]`);
        if (!container) return;
        
        try {
            // Collapse with animation
            await this.expander.collapsePanel(container);
            
            // Remove from DOM
            container.remove();
            
            // Update state
            this.activePanels.delete(panelKey);
            
            // Remove visual feedback for this specific panel
            this.removeActiveFeedback(panelKey);
            
            console.log(`✅ Panel closed: ${panelKey}`);
            
        } catch (error) {
            console.error(`❌ Error closing panel ${panelKey}:`, error);
        }
    }

    /**
     * Load panel data and render content
     */
    async loadAndRenderPanel(categoryType, locationId, container) {
        // Show loading state
        this.showLoadingState(container);
        
        // Get cached data or load from comparison results
        const panelData = this.loadPanelData(categoryType, locationId);
        
        if (!panelData) {
            throw new Error(`No data found for ${categoryType} - ${locationId}`);
        }
        
        // Render category-specific content
        await this.renderPanel(categoryType, container, panelData);
    }

    /**
     * Load panel data from cache or comparison results
     */
    loadPanelData(categoryType, locationId) {
        const cacheKey = `${categoryType}_${locationId}`;
        
        // Check cache first
        if (this.panelData.has(cacheKey)) {
            console.log(`📦 Using cached data for: ${cacheKey}`);
            return this.panelData.get(cacheKey);
        }
        
        // Load from comparison results
        const location = this.comparison.analysisResults?.find(loc => 
            String(loc.id) === String(locationId)
        );
        
        if (!location) {
            console.error(`❌ Location not found: ${locationId}`);
            return null;
        }
        
        // Extract category-specific data
        let data = null;
        
        switch (categoryType) {
            case this.panelTypes.HOSPITAL:
                data = this.extractHospitalData(location);
                break;
            case this.panelTypes.IMPORTANT_PLACES:
                data = this.extractImportantPlacesData(location);
                break;
            case this.panelTypes.DEMOGRAPHIC:
                data = this.extractDemographicData(location);
                break;
            case this.panelTypes.COMPETITOR:
                data = this.extractCompetitorData(location);
                break;
        }
        
        // Cache the data
        if (data) {
            this.cachePanelData(cacheKey, data);
        }
        
        return data;
    }

    /**
     * Render panel content based on category type
     */
    async renderPanel(categoryType, container, data) {
        const contentDiv = container.querySelector('.panel-content');
        
        switch (categoryType) {
            case this.panelTypes.HOSPITAL:
                if (window.HospitalDetailPanel) {
                    const panel = new HospitalDetailPanel(this);
                    await panel.render(contentDiv, data);
                } else {
                    this.renderFallbackContent(contentDiv, 'Hastane Detayları', data);
                }
                break;
                
            case this.panelTypes.IMPORTANT_PLACES:
                if (window.ImportantPlacesPanel) {
                    const panel = new ImportantPlacesPanel(this);
                    await panel.render(contentDiv, data);
                } else {
                    this.renderFallbackContent(contentDiv, 'Önemli Yerler', data);
                }
                break;
                
            case this.panelTypes.DEMOGRAPHIC:
                if (window.DemographicPanel) {
                    const panel = new DemographicPanel(this);
                    await panel.render(contentDiv, data);
                } else {
                    this.renderFallbackContent(contentDiv, 'Demografik Bilgiler', data);
                }
                break;
                
            case this.panelTypes.COMPETITOR:
                if (window.CompetitorPanel) {
                    const panel = new CompetitorPanel(this);
                    await panel.render(contentDiv, data);
                } else {
                    this.renderFallbackContent(contentDiv, 'Rekabet Analizi', data);
                }
                break;
        }
    }

    /**
     * Create panel container element
     */
    createPanelContainer(panelKey, categoryType) {
        const container = document.createElement('div');
        container.className = `detail-panel-container panel-category-${categoryType}`;
        container.setAttribute('data-panel-key', panelKey);
        
        container.innerHTML = `
            <div class="panel-header">
                <button class="panel-close-btn" onclick="window.detailPanelManager.closePanel('${panelKey}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="panel-content">
                <!-- Content will be loaded here -->
            </div>
        `;
        
        return container;
    }

    /**
     * Extract hospital-specific data from location
     */
    extractHospitalData(location) {
        return {
            location_id: location.id,
            location_name: location.name,
            hospital: location.details?.nearby_places?.hospital || {},
            score: location.scores?.hospital || 0,
            coordinates: location.coordinates
        };
    }

    /**
     * Extract important places data from location
     */
    extractImportantPlacesData(location) {
        return {
            location_id: location.id,
            location_name: location.name,
            places: location.details?.nearby_places || {},
            score: location.scores?.important || 0
        };
    }

    /**
     * Extract demographic data from location
     */
    extractDemographicData(location) {
        return {
            location_id: location.id,
            location_name: location.name,
            demographic: location.details?.demographic || {},
            score: location.scores?.demographic || 0,
            breakdown: {
                age_score: Math.floor(Math.random() * 40 + 30), // TODO: Get from API
                income_score: Math.floor(Math.random() * 40 + 30),
                density_score: Math.floor(Math.random() * 40 + 30)
            }
        };
    }

    /**
     * Extract competitor data from location with error handling
     */
    extractCompetitorData(location) {
        try {
            const competitors = location.details?.competitors || [];
            
            // Validate and filter competitor data
            const validCompetitors = competitors.filter(comp => {
                return comp && 
                       typeof comp === 'object' && 
                       (comp.name || comp.ad) && 
                       (comp.distance || comp.mesafe);
            });
            
            // Sort competitors by distance and limit to 5 (should already be sorted from backend)
            const sortedCompetitors = validCompetitors
                .sort((a, b) => {
                    const distA = a.distance_meters || this.parseDistanceFromString(a.distance || a.mesafe) || 999999;
                    const distB = b.distance_meters || this.parseDistanceFromString(b.distance || b.mesafe) || 999999;
                    return distA - distB;
                })
                .slice(0, 5);
            
            return {
                location_id: location.id,
                location_name: location.name,
                competitors: sortedCompetitors,
                score: location.scores?.competitor || 0,
                total_competitors: sortedCompetitors.length,
                has_competitors: sortedCompetitors.length > 0,
                error: null
            };
        } catch (error) {
            console.error('❌ Error extracting competitor data:', error);
            return {
                location_id: location.id,
                location_name: location.name,
                competitors: [],
                score: 0,
                total_competitors: 0,
                has_competitors: false,
                error: 'Rakip verisi işlenirken hata oluştu'
            };
        }
    }

    /**
     * Parse distance from string format (e.g., "300m" -> 300)
     */
    parseDistanceFromString(distanceStr) {
        if (!distanceStr || typeof distanceStr !== 'string') return null;
        
        const match = distanceStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Cache panel data
     */
    cachePanelData(key, data) {
        this.panelData.set(key, data);
        console.log(`💾 Cached data for: ${key}`);
    }

    /**
     * Show loading state in panel
     */
    showLoadingState(container) {
        const contentDiv = container.querySelector('.panel-content');
        contentDiv.innerHTML = `
            <div class="panel-loading">
                <div class="loading-spinner"></div>
                <p>Detaylar yükleniyor...</p>
            </div>
        `;
    }

    /**
     * Render fallback content when specific panel class is not available
     */
    renderFallbackContent(container, title, data) {
        // Special handling for competitor data
        if (title === 'Rekabet Analizi' && data.competitors !== undefined) {
            // Handle error case
            if (data.error) {
                container.innerHTML = `
                    <div class="panel-fallback competitor-panel">
                        <h3>${title}</h3>
                        <div class="error-message">
                            <div class="error-icon">⚠️</div>
                            <p>${data.error}</p>
                            <small>Lütfen daha sonra tekrar deneyin</small>
                        </div>
                    </div>
                `;
            } else if (!data.has_competitors || data.competitors.length === 0) {
                container.innerHTML = `
                    <div class="panel-fallback competitor-panel">
                        <h3>${title}</h3>
                        <div class="no-competitors-message">
                            <div class="no-competitors-icon">🏪</div>
                            <p>Bu bölgede rakip işletme bulunamadı</p>
                            <small>Bu durum lokasyon için avantaj sağlayabilir</small>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="panel-fallback competitor-panel">
                        <h3>${title}</h3>
                        <div class="competitors-list">
                            ${data.competitors.map((comp, index) => `
                                <div class="competitor-item">
                                    <div class="competitor-rank">${index + 1}</div>
                                    <div class="competitor-info">
                                        <div class="competitor-name">${comp.name}</div>
                                        <div class="competitor-distance">${comp.distance}</div>
                                    </div>
                                    <div class="competitor-impact ${comp.impact < 0 ? 'negative' : 'positive'}">
                                        ${comp.impact > 0 ? '+' : ''}${comp.impact}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${data.competitors.length === 5 ? '<small class="competitors-note">En yakın 5 rakip gösteriliyor</small>' : ''}
                    </div>
                `;
            }
        } else {
            // Default fallback for other panel types
            container.innerHTML = `
                <div class="panel-fallback">
                    <h3>${title}</h3>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        }
    }

    /**
     * Add visual feedback to active trigger
     */
    addActiveFeedback(triggerElement) {
        // Remove any existing active states
        document.querySelectorAll('.metric-item.panel-active').forEach(el => {
            el.classList.remove('panel-active');
        });
        
        // Add active state to current trigger
        const metricItem = triggerElement.closest('.metric-item');
        if (metricItem) {
            metricItem.classList.add('panel-active');
        }
    }

    /**
     * Remove visual feedback from specific panel trigger
     */
    removeActiveFeedback(panelKey) {
        if (panelKey) {
            // Extract category and location from panelKey
            const [categoryType, locationId] = panelKey.split('_');
            const selector = `[data-category-type="${categoryType}"][data-location-id="${locationId}"]`;
            const triggerElement = document.querySelector(selector);
            if (triggerElement) {
                triggerElement.classList.remove('panel-active');
            }
        } else {
            // Fallback: remove from all triggers
            document.querySelectorAll('.metric-item.panel-active').forEach(el => {
                el.classList.remove('panel-active');
            });
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.comparison && this.comparison.showNotification) {
            this.comparison.showNotification(message, 'error');
        } else {
            console.error('Panel Error:', message);
        }
    }

    /**
     * Close all panels
     */
    async closeAllPanels() {
        const openPanels = Array.from(this.activePanels);
        for (const panelKey of openPanels) {
            await this.closePanel(panelKey);
        }
    }

    /**
     * Get panel statistics
     */
    getStats() {
        return {
            activePanels: this.activePanels.size,
            cachedData: this.panelData.size,
            currentlyExpanded: this.currentlyExpanded
        };
    }
}

// Make it globally available
window.DetailPanelManager = DetailPanelManager; 