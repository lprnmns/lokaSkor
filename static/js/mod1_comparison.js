// Mod1 Location Comparison JavaScript

// Enhanced Search Manager Class
class SearchManager {
    constructor(debounceMs = 300) {
        this.debounceTimer = null;
        this.currentQuery = '';
        this.isSearching = false;
        this.searchCache = new Map();
        this.debounceMs = debounceMs;
        this.lastResults = [];
        this.abortController = null;
    }

    async search(query, callback) {
        // Clear previous timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Abort previous request if still pending
        if (this.abortController) {
            this.abortController.abort();
        }

        this.currentQuery = query;

        // If query is too short, hide results immediately
        if (query.length < 3) {
            callback({ results: [], query: query, fromCache: false });
            return;
        }

        // Check cache first
        if (this.searchCache.has(query)) {
            const cachedResults = this.searchCache.get(query);
            callback({ results: cachedResults, query: query, fromCache: true });
            return;
        }

        // Debounce the actual search
        this.debounceTimer = setTimeout(async () => {
            await this.performSearch(query, callback);
        }, this.debounceMs);
    }

    async performSearch(query, callback) {
        // Double check query hasn't changed
        if (query !== this.currentQuery) {
            return;
        }

        this.isSearching = true;
        this.abortController = new AbortController();

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=tr&limit=5&addressdetails=1`,
                { 
                    signal: this.abortController.signal,
                    headers: {
                        'User-Agent': 'LokaSkor-Mod1/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const results = await response.json();
            
            // Cache the results
            this.searchCache.set(query, results);
            
            // Limit cache size
            if (this.searchCache.size > 50) {
                const firstKey = this.searchCache.keys().next().value;
                this.searchCache.delete(firstKey);
            }

            this.lastResults = results;
            callback({ results: results, query: query, fromCache: false });

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search aborted for query:', query);
                return;
            }
            
            console.error('Search error:', error);
            callback({ 
                results: [], 
                query: query, 
                error: 'Arama sırasında hata oluştu. Lütfen tekrar deneyin.',
                fromCache: false 
            });
        } finally {
            this.isSearching = false;
            this.abortController = null;
        }
    }

    clearCache() {
        this.searchCache.clear();
    }

    getLastResults() {
        return this.lastResults;
    }
}

class LocationComparison {
    constructor(businessType) {
        this.businessType = businessType;
        this.locations = [];
        this.maxLocations = 3;
        this.map = null;
        this.markers = [];
        this.markerColors = ['#ef4444', '#3b82f6', '#10b981'];
        
        // Initialize search manager
        this.searchManager = new SearchManager(300);
        this.currentSearchQuery = '';
        
        // Initialize geographic data
        this.geoData = new TurkeyGeoData();
        
        // UI Refactoring: Initialize interaction handlers
        this.initializeInteractionHandlers();
        
        // Modern UI: Initialize new UI elements
        this.initializeModernUIElements();
        
        // Initialize map status message
        this.mapStatusMessage = null;
        
        // Initialize detail panel system
        this.detailPanelManager = null;
        
        // Street View Static API integration
        this.streetViewEnabled = true;
        this.useAlternativeStreetView = false; // Initialize to false, will be updated by API test
        
        this.init();
    }

    /**
     * Modern UI: Initialize references to new UI elements
     */
    initializeModernUIElements() {
        this.searchInput = null;
        this.statusContainer = null;
        this.locationsList = null;
        this.comparisonFooter = null;
        this.startComparisonBtn = null;
        this.locationCountSpan = null;
        this.isLoading = false;
    }

    init() {
        this.initializeMap();
        // this.initializeGeographicNavigation(); // DISABLED: Geographic navigation removed from UI
        this.initializeModernUIBindings(); // Modern UI: Bind new elements
        this.bindEvents();
        this.updateUI();
        
        // Street View Static API is always enabled
        console.log('✅ Street View Static API enabled');
        
        // Initialize detail panel system
        if (window.DetailPanelManager) {
            this.detailPanelManager = new DetailPanelManager(this);
            window.detailPanelManager = this.detailPanelManager; // Global access for click handlers
            console.log('🔧 Detail panel system initialized');
        } else {
            console.warn('⚠️ DetailPanelManager not available');
        }
        
        console.log('LocationComparison initialized for:', this.businessType);
        console.log('📍 Original locations at init:', this.locations);
        console.log('Modern UI elements:', {
            searchInput: !!this.searchInput,
            statusContainer: !!this.statusContainer,
            locationsList: !!this.locationsList,
            comparisonFooter: !!this.comparisonFooter,
            mapStatusMessage: !!this.mapStatusMessage,
            detailPanelManager: !!this.detailPanelManager,
            streetViewEnabled: this.streetViewEnabled
        });
        
        // Test Google Maps API accessibility
        this.testGoogleMapsAPI();
    }

    testGoogleMapsAPI() {
        const testUrl = 'https://maps.googleapis.com/maps/api/streetview?size=100x100&location=39.9334,32.8597&key=AIzaSyBdqmzhohI-SKOE7pJ5kFULP3z0u5dMj6A';
        
        console.log('🧪 Testing Google Maps API with URL:', testUrl);
        
        fetch(testUrl)
            .then(response => {
                console.log('🌐 Google Maps API test response:', response.status, response.statusText);
                console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));
                
                if (response.status === 403) {
                    console.warn('⚠️ Google Maps API returned 403 - check API key and domain restrictions');
                    this.useAlternativeStreetView = true;
                } else if (response.status === 200) {
                    console.log('✅ Google Maps API is accessible');
                    this.useAlternativeStreetView = false;
                    
                    // Test if we can actually get the image data
                    return response.blob();
                } else {
                    console.warn(`⚠️ Google Maps API returned unexpected status: ${response.status}`);
                    this.useAlternativeStreetView = true;
                }
            })
            .then(blob => {
                if (blob) {
                    console.log('✅ Google Maps API returned image blob:', {
                        size: blob.size,
                        type: blob.type
                    });
                    
                    // Test if the blob is actually an image
                    const url = URL.createObjectURL(blob);
                    const testImg = new Image();
                    testImg.onload = () => {
                        console.log('✅ Google Maps API image loads successfully:', {
                            width: testImg.naturalWidth,
                            height: testImg.naturalHeight
                        });
                        URL.revokeObjectURL(url);
                    };
                    testImg.onerror = () => {
                        console.error('❌ Google Maps API image failed to load');
                        URL.revokeObjectURL(url);
                    };
                    testImg.src = url;
                }
            })
            .catch(error => {
                console.error('❌ Google Maps API test failed:', error);
                this.useAlternativeStreetView = true;
            });
    }

    createAlternativeStreetViewImage(lat, lng) {
        // Create a simple map placeholder with coordinates
        return `
            <div class="street-view-container">
                <div class="street-view-placeholder">
                    <div class="street-view-placeholder-icon">🗺️</div>
                    <p>Harita Görünümü</p>
                    <small>Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                    <div class="street-view-coordinate-display">
                        <strong>Enlem:</strong> ${lat.toFixed(6)}<br>
                        <strong>Boylam:</strong> ${lng.toFixed(6)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Modern UI: Initialize bindings to new UI elements
     */
    initializeModernUIBindings() {
        this.searchInput = document.getElementById('searchInput');
        this.statusContainer = document.getElementById('statusMessages');
        this.locationsList = document.getElementById('selectedLocationsList');
        this.comparisonFooter = document.getElementById('comparisonFooter');
        this.startComparisonBtn = document.getElementById('startComparisonBtn');
        this.locationCountSpan = document.getElementById('locationCount');
        this.mapStatusMessage = document.getElementById('mapStatusMessage');
        
        if (this.searchInput) {
            console.log('✅ Modern UI elements bound successfully');
        } else {
            console.warn('⚠️ Some modern UI elements not found');
        }
    }

    /**
     * UI Refactoring: Initialize hover interaction handlers
     */
    initializeInteractionHandlers() {
        this.hoveredLocationId = null;
        this.debounceTimer = null;
    }

    /**
     * UI Refactoring: Update CTA button state and text - DISABLED: CTA button removed
     */
    updateCTAButton() {
        // Old CTA button removed - this function is kept for backward compatibility
        return;
        
        // const ctaButton = document.getElementById('mapCTAButton');
        // const ctaText = ctaButton?.querySelector('.cta-text');
        // const ctaIcon = ctaButton?.querySelector('.cta-icon');
        
        // if (!ctaButton || !ctaText || !ctaIcon) return;

        // const locationCount = this.locations.length;
        
        // if (locationCount === 0) {
        //     ctaButton.setAttribute('data-state', 'disabled');
        //     ctaButton.disabled = true;
        //     ctaText.textContent = 'Haritaya tıklayarak lokasyon ekleyin';
        //     ctaIcon.textContent = '📍';
        // } else if (locationCount === 1) {
        //     ctaButton.setAttribute('data-state', 'waiting');
        //     ctaButton.disabled = false;
        //     ctaText.textContent = 'Analiz için 1 nokta daha ekleyin';
        //     ctaIcon.textContent = '+';
        // } else if (locationCount >= 2) {
        //     ctaButton.setAttribute('data-state', 'ready');
        //     ctaButton.disabled = false;
        //     ctaText.textContent = 'Karşılaştırmaya Başla';
        //     ctaIcon.textContent = '⚡';
        // }
    }

    /**
     * UI Refactoring: Create enhanced location card with badge - ENHANCED with trash icon
     */
    createLocationCard(location, index) {
        const card = document.createElement('div');
        card.className = 'location-item enhanced-card location-card';
        card.setAttribute('data-location-id', location.id);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Location ${index + 1}: ${location.name}`);

        // Create badge
        const badge = document.createElement('div');
        badge.className = `location-badge badge-${index + 1}`;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="location-info">
                    <h4 class="location-name">${location.name}</h4>
                    <div class="location-coordinates">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
                    </div>
                    ${location.address ? `<div class="location-address">${location.address}</div>` : ''}
                </div>
                <button class="delete-button" data-location-id="${location.id}" data-action="delete"
                        aria-label="Remove ${location.name}">
                    <svg class="trash-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        `;

        // Add badge to card
        card.appendChild(badge);

        // Add interaction handlers
        this.addCardInteractionHandlers(card, location.id);

        return card;
    }

    /**
     * UI Refactoring: Add interaction handlers to location card - FIXED: Delete button functionality
     */
    addCardInteractionHandlers(card, locationId) {
        // Removed hover effects - markers stay static as requested
        
        // Delete button handler
        const deleteButton = card.querySelector('.delete-button');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                this.removeLocation(locationId);
            });
        }
        
        // Keyboard support
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.focusOnLocation(locationId);
            }
        });

        // Click to focus on map (exclude delete button clicks)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-button')) {
                this.focusOnLocation(locationId);
            }
        });
    }

    /**
     * UI Refactoring: Highlight map marker - FIXED: Proper state management
     */
    highlightMarker(locationId) {
        const marker = this.getMarkerById(locationId);
        if (marker) {
            const markerElement = marker.getElement();
            if (markerElement) {
                // Store original styles if not already stored
                if (!markerElement.dataset.originalTransform) {
                    markerElement.dataset.originalTransform = markerElement.style.transform || '';
                    markerElement.dataset.originalZIndex = markerElement.style.zIndex || '';
                }
                
                markerElement.style.transform = 'scale(1.2)';
                markerElement.style.zIndex = '1001';
                markerElement.style.transition = 'all 0.2s ease-in-out';
                markerElement.style.opacity = '1';
                markerElement.style.visibility = 'visible';
            }
        }
    }

    /**
     * UI Refactoring: Remove marker highlight - FIXED: Proper state restoration
     */
    unhighlightMarker(locationId) {
        const marker = this.getMarkerById(locationId);
        if (marker) {
            const markerElement = marker.getElement();
            if (markerElement) {
                // Restore original styles
                markerElement.style.transform = markerElement.dataset.originalTransform || '';
                markerElement.style.zIndex = markerElement.dataset.originalZIndex || '';
                markerElement.style.transition = 'all 0.2s ease-in-out';
                markerElement.style.opacity = '1';
                markerElement.style.visibility = 'visible';
                
                // Clean up transition after animation
                setTimeout(() => {
                    if (markerElement.style.transform === '') {
                        markerElement.style.transition = '';
                    }
                }, 200);
            }
        }
    }

    /**
     * UI Refactoring: Highlight location card
     */
    highlightCard(locationId) {
        const card = document.querySelector(`[data-location-id="${locationId}"]`);
        if (card) {
            card.classList.add('highlighted');
        }
    }

    /**
     * UI Refactoring: Remove card highlight
     */
    unhighlightCard(locationId) {
        const card = document.querySelector(`[data-location-id="${locationId}"]`);
        if (card) {
            card.classList.remove('highlighted');
        }
    }

    /**
     * UI Refactoring: Focus on location (zoom to marker)
     */
    focusOnLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location && this.map) {
            this.map.setView([location.lat, location.lng], 16);
        }
    }

    /**
     * Get marker by location ID
     */
    getMarkerById(locationId) {
        return this.markers.find(marker => marker.options.locationId === locationId);
    }

    /**
     * UI Refactoring: Create circular progress bar
     */
    createCircularProgress(score, size = 120) {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (score / 100) * circumference;

        return `
            <div class="score-circle" style="width: ${size}px; height: ${size}px;">
                <svg class="progress-ring" viewBox="0 0 100 100">
                    <circle 
                        class="progress-ring-background" 
                        cx="50" cy="50" r="${radius}"
                        stroke-width="8" fill="none" stroke="rgba(229, 231, 235, 0.3)">
                    </circle>
                    <circle 
                        class="progress-ring-progress" 
                        cx="50" cy="50" r="${radius}"
                        stroke-width="8" fill="none" 
                        stroke="#3b82f6" 
                        stroke-linecap="round"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${strokeDashoffset}"
                        style="transition: stroke-dashoffset 1.5s ease-out;">
                    </circle>
                </svg>
                <div class="score-value">${Math.round(score)}</div>
            </div>
        `;
    }

    /**
     * UI Refactoring: Get metric icon SVG
     */
    getMetricIcon(metricType) {
        const icons = {
            hospital: `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/>
                    <path d="M12 8v4M10 10h4"/>
                </svg>
            `,
            competition: `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
                    <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                    <path d="M21 5H3l2-3h14l2 3z"/>
                </svg>
            `,
            demographics: `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <path d="M20 8v6M23 11h-6"/>
                </svg>
            `,
            important: `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
            `
        };
        return icons[metricType] || icons.important;
    }

    /**
     * Create an accordion metric item with expandable content
     */
    createMetricItem(metricType, label, score, isWinning = false, locationId = null) {
        const icon = this.getMetricIcon(metricType);
        const progressColor = this.getProgressColor(score);
        console.log(`🎨 Progress color for ${label} (${score}): ${progressColor}`);
        const accordionId = `accordion_${metricType}_${locationId || Date.now()}`;
        
        // Map metricType to panel category type
        const categoryMap = {
            'hospital': 'hospital',
            'important': 'important_places', 
            'demographics': 'demographic',
            'competition': 'competitor'
        };
        const categoryType = categoryMap[metricType] || metricType;
        
        const htmlContent = `
            <div class="metric-accordion-item metric-${metricType}" 
                 data-category-type="${categoryType}"
                 data-location-id="${locationId || ''}"
                 data-score="${score}"
                 data-accordion-id="${accordionId}">
                
                <!-- Clickable Header -->
                <div class="accordion-header" 
                     role="button"
                     tabindex="0"
                     aria-expanded="false"
                     aria-controls="${accordionId}"
                     onclick="window.locationComparison.toggleAccordion('${accordionId}')"
                     onkeydown="window.locationComparison.handleAccordionKeydown(event, '${accordionId}')">
                    
                    <div class="accordion-header-content">
                        <div class="category-title-group">
                            <div class="category-icon">
                                ${icon}
                            </div>
                            <h4 class="category-title">${label}</h4>
                        </div>
                        
                        <div class="accordion-header-right">
                            <span class="category-score">${Math.round(score)}/100</span>
                            ${isWinning ? '<span class="metric-star-indicator" aria-label="En yüksek skor">⭐</span>' : ''}
                            <svg class="accordion-chevron" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Inline Colorful Progress Bar -->
                    <div class="metric-progress-container" data-score="${score}">
                        <div class="metric-progress-bar-wrapper">
                            <div class="metric-progress-bar" 
                                 style="--target-width: ${score}%; --progress-color: ${progressColor}; background-color: ${progressColor} !important;"
                                 role="progressbar"
                                 aria-valuenow="${score}"
                                 aria-valuemin="0"
                                 aria-valuemax="100"
                                 aria-label="${label} progress: ${score}%"
                                 data-score="${score}">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Expandable Content -->
                <div class="accordion-content" 
                     id="${accordionId}"
                     aria-hidden="true"
                     data-category-type="${categoryType}"
                     data-location-id="${locationId}">
                    <div class="accordion-content-inner">
                        <!-- Content will be loaded dynamically -->
                        <div class="loading-placeholder">
                            <div class="loading-spinner"></div>
                            <p>Detaylar yükleniyor...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return htmlContent;
    }

    /**
     * Get progress bar color with smooth gradient transition - RED TO GREEN
     */
    getProgressColor(score) {
        // Ensure score is between 0-100
        score = Math.max(0, Math.min(100, score));
        
        // Simple red to green interpolation
        // 0 = pure red (255, 0, 0), 100 = pure green (0, 255, 0)
        const red = Math.round(255 * (100 - score) / 100);
        const green = Math.round(255 * score / 100);
        const blue = 0;
        
        return `rgb(${red}, ${green}, ${blue})`;
    }

    /**
     * Alternative RGB interpolation method (backup)
     */
    getProgressColorRGB(score) {
        score = Math.max(0, Math.min(100, score));
        
        // Red to Green interpolation
        const red = Math.round(255 * (100 - score) / 100);
        const green = Math.round(255 * score / 100);
        const blue = 0;
        
        return `rgb(${red}, ${green}, ${blue})`;
    }

    /**
     * UI Refactoring: Find winning metrics across locations
     */
    findWinningMetrics(results) {
        const metrics = ['hospital', 'important', 'demographic', 'competitor'];
        const winners = {};
        
        metrics.forEach(metric => {
            let maxScore = -1;
            let winnerIndex = -1;
            
            results.forEach((result, index) => {
                const score = result.scores?.[metric] || 0;
                // Only consider valid scores (not NaN, null, or undefined)
                if (typeof score === 'number' && !isNaN(score) && score > maxScore) {
                    maxScore = score;
                    winnerIndex = index;
                }
            });
            
            // Only set winner if we found a valid score and it's meaningfully high (> 0)
            if (winnerIndex !== -1 && maxScore > 0) {
                winners[metric] = winnerIndex;
            }
        });
        
        return winners;
    }

    /**
     * UI Refactoring: Get winning metrics for a specific location with error handling
     */
    getLocationWinners(allWinners, locationIndex) {
        const locationWinners = {};
        
        try {
            if (!allWinners || typeof allWinners !== 'object') {
                console.warn('⚠️ Invalid allWinners data:', allWinners);
                return locationWinners;
            }

            if (typeof locationIndex !== 'number' || locationIndex < 0) {
                console.warn('⚠️ Invalid locationIndex:', locationIndex);
                return locationWinners;
            }

            Object.keys(allWinners).forEach(metric => {
                if (allWinners[metric] === locationIndex) {
                    locationWinners[metric] = true;
                }
            });
        } catch (error) {
            console.error('❌ Error determining location winners:', error);
        }
        
        return locationWinners;
    }

    /**
     * Process competitor data with error handling and sorting
     */
    processCompetitorData(competitorDetails) {
        try {
            if (!Array.isArray(competitorDetails)) {
                console.warn('⚠️ Competitor details is not an array:', competitorDetails);
                return [];
            }

            return competitorDetails
                .filter(comp => comp && typeof comp === 'object') // Filter out invalid entries
                .map(comp => {
                    // Safe data extraction with fallbacks
                    const name = comp.ad || comp.name || 'Rakip İşletme';
                    const distance = comp.mesafe || comp.distance || 'Bilinmiyor';
                    const distanceMeters = this.safeParseDistance(comp.distance_meters);
                    const impact = this.safeParseImpact(comp.puan || comp.impact);

                    return {
                        name,
                        distance,
                        distance_meters: distanceMeters,
                        impact
                    };
                })
                .sort((a, b) => (a.distance_meters || 999999) - (b.distance_meters || 999999))  // Sort by distance
                .slice(0, 5);  // Limit to 5 competitors
        } catch (error) {
            console.error('❌ Error processing competitor data:', error);
            return [];
        }
    }

    /**
     * Safely parse distance meters with fallback
     */
    safeParseDistance(distanceMeters) {
        if (typeof distanceMeters === 'number' && !isNaN(distanceMeters)) {
            return distanceMeters;
        }
        if (typeof distanceMeters === 'string') {
            const parsed = parseInt(distanceMeters);
            return !isNaN(parsed) ? parsed : 999999;
        }
        return 999999; // Default fallback
    }

    /**
     * Safely parse impact score with fallback
     */
    safeParseImpact(impact) {
        if (typeof impact === 'number' && !isNaN(impact)) {
            return impact;
        }
        if (typeof impact === 'string') {
            const cleaned = impact.replace(/[+\s]/g, '');
            const parsed = parseFloat(cleaned);
            return !isNaN(parsed) ? parsed : 0;
        }
        return 0; // Default fallback
    }

    /**
     * Create Street View Static API image
     */
    createStreetViewImage(lat, lng) {
        // If API is not accessible, use alternative approach
        if (this.useAlternativeStreetView) {
            console.log('🔄 Using alternative Street View for coordinates:', lat, lng);
            return this.createAlternativeStreetViewImage(lat, lng);
        }
        
        const apiKey = 'AIzaSyBdqmzhohI-SKOE7pJ5kFULP3z0u5dMj6A';
        const size = '300x200';
        const fov = '90';
        const heading = '0';
        const pitch = '0';
        
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;
        
        // Log the URL for debugging
        console.log('🗺️ Street View URL:', streetViewUrl);
        console.log('🔍 useAlternativeStreetView value:', this.useAlternativeStreetView);
        
        // Create a unique ID for this Street View container
        const containerId = `street-view-${lat}-${lng}`.replace(/\./g, '-');
        console.log('🔍 Container ID:', containerId);
        
        // Set a timeout to handle cases where the API doesn't respond
        setTimeout(() => {
            const container = document.getElementById(containerId);
            if (container && !container.classList.contains('street-view-loaded') && !container.classList.contains('street-view-error-container')) {
                console.log('⏰ Street View timeout for coordinates:', lat, lng);
                console.log('🔍 Container classes:', container.className);
                this.handleStreetViewError(lat, lng, containerId);
            }
        }, 15000); // Increased to 15 second timeout
        
        return `
            <div class="street-view-container" id="${containerId}">
                <div class="street-view-loading">
                    <div class="street-view-loading-spinner"></div>
                    <p>Street View yükleniyor...</p>
                </div>
                <img src="${streetViewUrl}"
                     alt="Street View"
                     class="street-view-static-image"
                     style="width: 100%; height: auto; display: none;">
                <div class="street-view-fallback" style="display: none;">
                    <div class="street-view-placeholder">
                        <div class="street-view-placeholder-icon">🗺️</div>
                        <p>Harita Görünümü</p>
                        <small>Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for Street View images
     */
    setupStreetViewEventListeners(container) {
        const img = container.querySelector('.street-view-static-image');
        if (!img) {
            console.log('❌ No image found in Street View container:', container.id);
            return;
        }

        // Extract coordinates from container ID
        const containerId = container.id;
        const coordsMatch = containerId.match(/street-view-([\d.-]+)-([\d.-]+)/);
        if (!coordsMatch) {
            console.log('❌ Could not extract coordinates from container ID:', containerId);
            return;
        }

        const lat = parseFloat(coordsMatch[1].replace(/-/g, '.'));
        const lng = parseFloat(coordsMatch[2].replace(/-/g, '.'));

        console.log('🔧 Setting up event listeners for Street View:', {
            containerId,
            lat,
            lng,
            imgSrc: img.src
        });

        // Remove any existing listeners
        img.onload = null;
        img.onerror = null;

        // Add new event listeners
        img.onload = () => {
            console.log('🖼️ Image onload triggered for', containerId);
            this.handleStreetViewSuccess(lat, lng, containerId);
        };

        img.onerror = () => {
            console.log('🖼️ Image onerror triggered for', containerId);
            this.handleStreetViewError(lat, lng, containerId);
        };

        // Force image to load immediately to avoid lazy loading issues
        if (img.complete) {
            console.log('🖼️ Image already loaded for', containerId);
            if (img.naturalWidth > 0) {
                this.handleStreetViewSuccess(lat, lng, containerId);
            } else {
                this.handleStreetViewError(lat, lng, containerId);
            }
        } else {
            console.log('🖼️ Image loading in progress for', containerId);
            
            // Use fetch to load the image and create a blob URL to bypass lazy loading
            fetch(img.src)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    console.log('🖼️ Image blob loaded successfully for', containerId, {
                        size: blob.size,
                        type: blob.type
                    });
                    
                    // Create blob URL and set it as the image source
                    const blobUrl = URL.createObjectURL(blob);
                    img.src = blobUrl;
                    
                    // Clean up blob URL after image loads
                    img.onload = () => {
                        console.log('🖼️ Image onload triggered for', containerId);
                        URL.revokeObjectURL(blobUrl);
                        this.handleStreetViewSuccess(lat, lng, containerId);
                    };
                    
                    img.onerror = () => {
                        console.log('🖼️ Image onerror triggered for', containerId);
                        URL.revokeObjectURL(blobUrl);
                        this.handleStreetViewError(lat, lng, containerId);
                    };
                })
                .catch(error => {
                    console.error('❌ Failed to fetch image for', containerId, error);
                    this.handleStreetViewError(lat, lng, containerId);
                });
        }
    }

    handleStreetViewError(lat, lng, containerId) {
        console.log('❌ Street View image failed to load for coordinates:', lat, lng);
        console.log('🔍 Container ID:', containerId);
        const container = document.getElementById(containerId);
        console.log('🔍 Container found:', !!container);
        if (container) {
            // Check if we've already tried multiple headings
            const retryCount = container.dataset.retryCount || 0;
            
            if (retryCount < 3) {
                // Try different heading values
                const headings = [90, 180, 270];
                const nextHeading = headings[retryCount];
                
                console.log(`🔄 Retrying Street View with heading ${nextHeading} for coordinates:`, lat, lng);
                
                const apiKey = 'AIzaSyBdqmzhohI-SKOE7pJ5kFULP3z0u5dMj6A';
                const size = '300x200';
                const fov = '90';
                const pitch = '0';
                
                const retryUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${nextHeading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;
                
                container.dataset.retryCount = parseInt(retryCount) + 1;
                
                const img = container.querySelector('.street-view-static-image');
                if (img) {
                    img.src = retryUrl;
                    img.onerror = () => this.handleStreetViewError(lat, lng, containerId);
                    img.onload = () => this.handleStreetViewSuccess(lat, lng, containerId);
                }
                return;
            }
            
            // All retries failed, show fallback
            const loadingDiv = container.querySelector('.street-view-loading');
            const image = container.querySelector('.street-view-static-image');
            const fallbackDiv = container.querySelector('.street-view-fallback');
            
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            if (image) {
                image.style.display = 'none';
            }
            if (fallbackDiv) {
                fallbackDiv.style.display = 'flex';
            }
            
            container.classList.add('street-view-fallback-container');
        }
    }

    handleStreetViewSuccess(lat, lng, containerId) {
        console.log('✅ Street View image loaded successfully for coordinates:', lat, lng);
        console.log('🔍 Container ID:', containerId);
        const container = document.getElementById(containerId);
        console.log('🔍 Container found:', !!container);
        if (container) {
            const loadingDiv = container.querySelector('.street-view-loading');
            const image = container.querySelector('.street-view-static-image');
            
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            if (image) {
                image.style.display = 'block';
                image.style.width = '100%';
                image.style.height = 'auto';
                image.style.maxWidth = '100%';
                console.log('🖼️ Street View image displayed:', {
                    src: image.src,
                    width: image.offsetWidth,
                    height: image.offsetHeight,
                    display: image.style.display
                });
            }
            
            container.classList.add('street-view-loaded');
        }
    }

    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('comparisonMap').setView([39.9334, 32.8597], 6); // Turkey center
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Add click event to map
        this.map.on('click', (e) => {
            this.addLocationFromMap(e.latlng.lat, e.latlng.lng);
        });
    }

    initializeGeographicNavigation() {
        const provinceSelect = document.getElementById('provinceSelect');
        const districtSelect = document.getElementById('districtSelect');
        
        // Populate provinces
        const provinces = this.geoData.getProvinces();
        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });
        
        // Province change handler
        provinceSelect.addEventListener('change', (e) => {
            this.handleProvinceChange(e.target.value);
        });
        
        // District change handler
        districtSelect.addEventListener('change', (e) => {
            this.handleDistrictChange(e.target.value);
        });
    }

    handleProvinceChange(provinceId) {
        const districtSelect = document.getElementById('districtSelect');
        
        // Clear districts
        districtSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
        
        if (!provinceId) {
            // Show all Turkey
            districtSelect.disabled = true;
            const bounds = this.geoData.getTurkeyBounds();
            this.geoData.fitMapToBounds(this.map, bounds);
            return;
        }
        
        // Enable district selection
        districtSelect.disabled = false;
        
        // Populate districts
        const districts = this.geoData.getDistricts(parseInt(provinceId));
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district.id;
            option.textContent = district.name;
            districtSelect.appendChild(option);
        });
        
        // Zoom to province
        const bounds = this.geoData.getProvinceBounds(parseInt(provinceId));
        if (bounds) {
            this.geoData.fitMapToBounds(this.map, bounds);
        }
    }

    handleDistrictChange(districtId) {
        if (!districtId) return;
        
        // Zoom to district
        const bounds = this.geoData.getDistrictBounds(parseInt(districtId));
        if (bounds) {
            this.geoData.fitMapToBounds(this.map, bounds);
        }
    }


    bindEvents() {
        // Modern UI: New search form handler
        const searchForm = document.getElementById('locationSearchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleModernSearch();
            });
        }

        // Modern UI: Smart input validation with debouncing
        if (this.searchInput) {
            this.searchInput.addEventListener('input', 
                this.debounce((e) => this.validateModernInput(e.target.value), 300)
            );
            
            // Also bind old search functionality for compatibility
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearchEnhanced(e.target.value);
            });
        }

        // Modern UI: Start comparison button
        if (this.startComparisonBtn) {
            this.startComparisonBtn.addEventListener('click', () => {
                this.startComparison();
            });
        }

        // Legacy support: Coordinate input (fallback)
        const addCoordinateBtn = document.getElementById('addCoordinateBtn');
        if (addCoordinateBtn) {
            addCoordinateBtn.addEventListener('click', () => {
                this.addLocationFromCoordinates();
            });
        }

        const coordinateInput = document.getElementById('coordinateInput');
        if (coordinateInput) {
            coordinateInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addLocationFromCoordinates();
                }
            });
        }

        // Legacy support: Old search input (fallback)
        const oldSearchInput = document.getElementById('searchInput');
        if (oldSearchInput) {
            oldSearchInput.addEventListener('input', (e) => {
                this.handleSearchEnhanced(e.target.value);
            });
        }

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#searchInput') && !e.target.closest('#searchResults')) {
                this.hideSearchResults();
            }
        });

        // Legacy support: Compare buttons (sidebar and new CTA button)
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.startComparison();
            });
        }
        
        // UI Refactoring: Old CTA button removed - using sidebar button only
        // const mapCTAButton = document.getElementById('mapCTAButton');
        // if (mapCTAButton) {
        //     mapCTAButton.addEventListener('click', () => {
        //         this.startComparison();
        //     });
        // }

        // Reset map button
        const resetMapBtn = document.getElementById('resetMapBtn');
        if (resetMapBtn) {
            resetMapBtn.addEventListener('click', () => {
                this.resetMap();
            });
        }

        // New comparison button
        const newComparisonBtn = document.getElementById('newComparisonBtn');
        if (newComparisonBtn) {
            newComparisonBtn.addEventListener('click', () => {
                this.startNewComparison();
            });
        }
    }

    addLocationFromCoordinates() {
        const input = document.getElementById('coordinateInput');
        const coords = input.value.trim();
        
        if (!coords) {
            this.showNotification('Lütfen koordinat girin', 'warning');
            return;
        }

        const parsed = this.parseCoordinates(coords);
        if (!parsed) {
            this.showNotification('Geçersiz koordinat formatı. Örnek: 41.0082, 28.9784', 'error');
            return;
        }

        if (!this.isValidLocation(parsed.lat, parsed.lng)) {
            this.showNotification('Koordinatlar Türkiye sınırları içinde olmalıdır', 'error');
            return;
        }

        this.addLocation(parsed.lat, parsed.lng, `Lokasyon ${this.locations.length + 1}`);
        input.value = '';
    }

    /* ========================================= */
    /* MODERN UI METHODS */
    /* ========================================= */

    /**
     * Modern UI: Handle search form submission
     */
    async handleModernSearch() {
        if (this.locations.length >= this.maxLocations) {
            this.showModernStatusMessage('Maksimum konum sayısına ulaşıldı.', 'warning');
            return;
        }

        const input = this.searchInput.value.trim();
        if (!input) return;

        try {
            const parsedInput = this.parseLocationInput(input);
            if (!parsedInput) {
                this.showModernStatusMessage('Lütfen geçerli bir adres veya koordinat girin.', 'warning');
                return;
            }

            this.setLoading(true);

            // For coordinates, use directly
            if (parsedInput.type === 'coordinates') {
                this.addModernLocation({
                    lat: parsedInput.lat,
                    lng: parsedInput.lng,
                    address: parsedInput.address,
                    source: parsedInput.source
                });
            } else {
                // For addresses, use mock coordinates for now
                // In production, this would integrate with geocoding service
                this.addModernLocation({
                    lat: 39.9334 + (Math.random() - 0.5) * 0.1,
                    lng: 32.8597 + (Math.random() - 0.5) * 0.1,
                    address: parsedInput.address,
                    source: parsedInput.source
                });
            }

            this.searchInput.value = '';
            console.log('🧹 Search input cleared');
            this.showModernStatusMessage('Konum başarıyla eklendi.', 'info');

        } catch (error) {
            this.showModernStatusMessage(error.message, 'warning');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Modern UI: Smart location input parsing with validation
     */
    parseLocationInput(input) {
        if (!input || input.trim().length < 3) {
            return null;
        }

        const trimmed = input.trim();

        // Check for coordinate format: "lat,lng" or "lat lng"
        const coordsRegex = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
        const coordsMatch = trimmed.match(coordsRegex);

        if (coordsMatch) {
            const lat = parseFloat(coordsMatch[1]);
            const lng = parseFloat(coordsMatch[2]);

            // Validate coordinate ranges
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return {
                    type: 'coordinates',
                    lat: lat,
                    lng: lng,
                    address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    source: 'coordinates'
                };
            } else {
                throw new Error('Koordinat değerleri geçersiz. Enlem: -90 ile 90, Boylam: -180 ile 180 arasında olmalıdır.');
            }
        }

        // Treat as address
        return {
            type: 'address',
            address: trimmed,
            source: 'address'
        };
    }

    /**
     * Modern UI: Add location using new data structure
     */
    addModernLocation(locationData) {
        const location = {
            id: this.generateId(),
            name: locationData.address,
            address: locationData.address,
            lat: locationData.lat,
            lng: locationData.lng,
            addedAt: new Date(),
            index: this.locations.length,
            source: locationData.source || 'unknown'
        };

        this.locations.push(location);
        this.addMarkerToMap(location);
        this.updateModernUI();
    }

    /**
     * Modern UI: Remove location with modern UI updates
     */
    removeModernLocation(locationId) {
        const index = this.locations.findIndex(loc => loc.id === locationId);
        if (index === -1) return;

        // Remove from array
        this.locations.splice(index, 1);

        // Update indices
        this.locations.forEach((loc, i) => {
            loc.index = i;
        });

        // Remove marker from map
        this.removeMarkerFromMap(locationId);

        // Update UI
        this.updateModernUI();
        this.showModernStatusMessage('Konum kaldırıldı.', 'info');
    }

    /**
     * Remove marker from map by location ID
     */
    removeMarkerFromMap(locationId) {
        // Find marker with matching location ID
        const markerIndex = this.markers.findIndex(marker => 
            marker.options && marker.options.locationId === locationId
        );
        
        if (markerIndex !== -1) {
            // Remove marker from map
            this.map.removeLayer(this.markers[markerIndex]);
            
            // Remove from markers array
            this.markers.splice(markerIndex, 1);
            
            console.log(`🗑️ Marker removed for location: ${locationId}`);
        } else {
            console.warn(`⚠️ Marker not found for location: ${locationId}`);
        }
    }

    /**
     * Modern UI: Render location card HTML
     */
    renderModernLocationCard(location) {
        // Fix badge numbering: Use array position instead of stored index
        const currentIndex = this.locations.findIndex(loc => loc.id === location.id);
        const badgeNumber = currentIndex + 1;
        const badgeClass = `badge-${badgeNumber}`;
        
        return `
            <div class="location-card" data-location-id="${location.id}" role="button" tabindex="0" aria-label="Lokasyon kartı: ${location.address}">
                <div class="location-card-content">
                    <div class="location-info">
                        <h4 class="location-name">${location.name}</h4>
                        <p class="location-coordinates">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
                        </p>
                    </div>
                    <div class="location-badge-right ${badgeClass}">
                        ${badgeNumber}
                    </div>
                    <button class="location-remove" 
                            onclick="window.locationComparison.removeModernLocation('${location.id}')"
                            aria-label="Konumu kaldır">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Modern UI: Update entire UI state
     */
    updateModernUI() {
        this.updateLocationCount();
        this.updateLocationsList();
        this.updateStatusMessages();
        this.updateSearchInput();
        this.updateComparisonButton();
        this.updateMapStatusMessage();
    }

    /**
     * Modern UI: Update location count display
     */
    updateLocationCount() {
        if (this.locationCountSpan) {
            this.locationCountSpan.textContent = this.locations.length;
        }
    }

    /**
     * Modern UI: Update locations list
     */
    updateLocationsList() {
        if (!this.locationsList) return;

        if (this.locations.length === 0) {
            this.locationsList.innerHTML = '';
            return;
        }

        const cardsHTML = this.locations
            .map(location => this.renderModernLocationCard(location))
            .join('');
        
        this.locationsList.innerHTML = cardsHTML;
    }

    /**
     * Modern UI: Update status messages
     */
    updateStatusMessages() {
        if (!this.statusContainer) {
            console.warn('❌ statusContainer not found, cannot update status messages');
            return;
        }

        const count = this.locations.length;
        console.log('🔄 Updating status messages for count:', count);
        let message = '';

        if (count === 0) {
            console.log('📝 Creating empty state message');
            message = `
                <div class="status-message empty">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <p><strong>Hiç konum seçilmedi</strong></p>
                    <p>Karşılaştırmaya başlamak için en az 2 konum ekleyin.</p>
                </div>
            `;
        } else if (count === 1) {
            message = `
                <div class="status-message info">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <p>Karşılaştırmaya başlamak için bir nokta daha ekleyin</p>
                </div>
            `;
        } else if (count >= this.maxLocations) {
            message = `
                <div class="status-message warning">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                    </svg>
                    <p><strong>Maksimum konum sayısına ulaşıldı.</strong></p>
                </div>
            `;
        }

        this.statusContainer.innerHTML = message;
        console.log('✅ Status message updated:', message.length > 0 ? 'Message set' : 'Empty message');
    }

    /**
     * Modern UI: Update search input state
     */
    updateSearchInput() {
        if (!this.searchInput) return;

        const isDisabled = this.locations.length >= this.maxLocations;
        this.searchInput.disabled = isDisabled;
        
        if (isDisabled) {
            this.searchInput.placeholder = 'Maksimum konum sayısına ulaşıldı';
        } else {
            this.searchInput.placeholder = 'Adres arayın veya koordinat yapıştırın';
        }
    }

    /**
     * Modern UI: Update comparison button
     */
    updateComparisonButton() {
        if (!this.comparisonFooter || !this.startComparisonBtn) return;

        const canCompare = this.locations.length >= 2;
        
        if (canCompare) {
            this.comparisonFooter.style.display = 'block';
            this.startComparisonBtn.disabled = false;
        } else {
            this.comparisonFooter.style.display = 'none';
            this.startComparisonBtn.disabled = true;
        }
    }

    /**
     * Modern UI: Show status message
     */
    showModernStatusMessage(message, type = 'info') {
        // Use existing notification system as fallback
        this.showNotification(message, type);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * Modern UI: Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        if (this.searchInput) {
            this.searchInput.disabled = loading || this.locations.length >= this.maxLocations;
            
            if (loading) {
                this.searchInput.placeholder = 'Konum ekleniyor...';
            }
        }
    }

    /**
     * Modern UI: Validate input format with visual feedback
     */
    validateModernInput(input) {
        // Real-time validation feedback would go here
        // For now, just log the validation
        console.log('Validating input:', input);
    }

    /**
     * Modern UI: Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Modern UI: Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Modern UI: Update map status message based on location count
     */
    updateMapStatusMessage() {
        if (!this.mapStatusMessage) {
            console.warn('❌ Map status message element not found');
            return;
        }

        const count = this.locations.length;
        let state, icon, text;

        if (count === 0) {
            state = 'empty';
            icon = '📍';
            text = 'Konum eklemek için haritaya tıklayın';
        } else if (count === 1) {
            state = 'waiting';
            icon = '➕';
            text = 'Karşılaştırma için bir nokta daha seçin';
        } else if (count >= 2) {
            state = 'ready';
            icon = '✅';
            text = 'Karşılaştırmaya hazır';
        }

        // Update state attribute
        this.mapStatusMessage.setAttribute('data-state', state);
        
        // Update content
        const iconElement = this.mapStatusMessage.querySelector('.status-icon');
        const textElement = this.mapStatusMessage.querySelector('.status-text');
        
        if (iconElement) iconElement.textContent = icon;
        if (textElement) textElement.textContent = text;

        console.log(`🗺️ Map status updated: ${state} - "${text}"`);
    }

    addLocationFromMap(lat, lng) {
        if (this.locations.length >= this.maxLocations) {
            this.showNotification(`Maksimum ${this.maxLocations} lokasyon ekleyebilirsiniz`, 'warning');
            return;
        }

        if (!this.isValidLocation(lat, lng)) {
            this.showNotification('Bu konum Türkiye sınırları içinde değil', 'error');
            return;
        }

        this.addLocation(lat, lng, `Lokasyon ${this.locations.length + 1}`);
    }

    addLocation(lat, lng, name, address = '') {
        if (this.locations.length >= this.maxLocations) {
            this.showNotification(`Maksimum ${this.maxLocations} lokasyon ekleyebilirsiniz`, 'error');
            return;
        }

        // Check if location already exists (within 100m)
        const exists = this.locations.some(loc => {
            const distance = this.calculateDistance(lat, lng, loc.lat, loc.lng);
            return distance < 0.1; // 100 meters
        });

        if (exists) {
            this.showNotification('Bu lokasyon zaten eklenmiş', 'warning');
            return;
        }

        const location = {
            id: Date.now().toString(),
            lat: lat,
            lng: lng,
            name: name,
            address: address || name,
            addedAt: new Date(),
            index: this.locations.length,
            source: 'legacy'
        };
        
        console.log('📍 Creating location:', {
            id: location.id,
            name: location.name,
            coordinates: `${lat}, ${lng}`,
            source: location.source
        });

        this.locations.push(location);
        
        // Update indices after adding
        this.locations.forEach((loc, idx) => {
            loc.index = idx;
        });
        
        this.addMarkerToMap(location);
        this.updateLocationList();
        this.updateUI();

        this.showNotification('Lokasyon eklendi', 'success');
        console.log('✅ Location added successfully. Total locations:', this.locations.length);
    }

    addMarkerToMap(location) {
        const markerColor = this.markerColors[location.index];
        
        // FIXED: Create stable marker using proper L.divIcon with pin-style design
        const markerHtml = `
            <div class="marker-container">
                <div class="marker-pin" style="background-color: ${markerColor}">
                    <span class="marker-number">${location.index + 1}</span>
                </div>
                <div class="marker-shadow"></div>
            </div>
        `;

        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: markerHtml,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42]
        });

        const marker = L.marker([location.lat, location.lng], {
            icon: customIcon,
            locationId: location.id,
            riseOnHover: true
        }).addTo(this.map);

        marker.bindPopup(`
            <div style="text-align: center;">
                <strong>${location.name}</strong><br>
                <small>${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</small><br>
                ${location.address ? `<small>${location.address}</small>` : ''}
            </div>
        `);

        // UI Refactoring: Hover effects removed - markers and cards stay static

        this.markers.push(marker);

        // Fit map to show all markers
        if (this.markers.length > 1) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        } else {
            this.map.setView([location.lat, location.lng], 12);
        }
    }

    removeLocation(locationId) {
        const index = this.locations.findIndex(loc => loc.id === locationId);
        if (index === -1) return;

        // Remove marker
        if (this.markers[index]) {
            this.map.removeLayer(this.markers[index]);
            this.markers.splice(index, 1);
        }

        // Remove location
        this.locations.splice(index, 1);

        // Update indices
        this.locations.forEach((loc, i) => {
            loc.index = i;
        });

        // Clear and re-add all markers with updated indices
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        
        this.locations.forEach(location => {
            this.addMarkerToMap(location);
        });

        this.updateLocationList();
        this.updateUI();

        this.showNotification('Lokasyon kaldırıldı', 'info');
    }

    /**
     * Remove multiple unsupported locations from the list
     */
    removeUnsupportedLocations(locationsToRemove) {
        locationsToRemove.forEach(location => {
            this.removeLocation(location.id);
        });
    }

    /**
     * Show message about unsupported regions
     */
    showUnsupportedRegionMessage(failedLocations) {
        const locationNames = failedLocations.map(loc => loc.name).join(', ');
        const message = `Bu bölgeler henüz desteklenmiyor: ${locationNames}. Uygun olmayan noktalar çıkarılmıştır.`;
        this.showNotification(message, 'warning'); // Use default 6 seconds
    }

    /**
     * Safely parse score values, handling NaN and invalid data
     */
    safeParseScore(score) {
        if (score === null || score === undefined) return 0;
        if (typeof score === 'number' && !isNaN(score)) return score;
        if (typeof score === 'string') {
            if (score.includes('NaN') || score === 'NaN') return 0;
            const parsed = parseFloat(score);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    updateLocationList() {
        // Modern UI: Try modern container first, fallback to legacy
        const modernContainer = document.getElementById('selectedLocationsList');
        const legacyContainer = document.getElementById('locationList');
        
        if (modernContainer) {
            console.log('📋 Using modern location list container');
            modernContainer.innerHTML = '';
            this.locations.forEach((location, index) => {
                const locationCard = this.renderModernLocationCard(location);
                const cardElement = document.createElement('div');
                cardElement.innerHTML = locationCard;
                modernContainer.appendChild(cardElement.firstElementChild);
            });
        } else if (legacyContainer) {
            console.log('📋 Using legacy location list container');
            legacyContainer.innerHTML = '';
            this.locations.forEach((location, index) => {
                const locationCard = this.createLocationCard(location, index);
                legacyContainer.appendChild(locationCard);
            });
        } else {
            console.warn('❌ No location list container found');
        }
    }

    updateUI() {
        // Modern UI: Use new UI update system if available
        if (this.searchInput && this.statusContainer) {
            console.log('✅ Using modern UI update system');
            this.updateModernUI();
        } else {
            console.log('⚠️ Modern UI elements not available, using legacy fallback');
            // Still update map status message if available
            this.updateMapStatusMessage();
        }

        // Legacy fallback: Update location counter
        const locationCountElement = document.getElementById('locationCount');
        if (locationCountElement) {
            locationCountElement.textContent = this.locations.length;
        }

        // UI Refactoring: Update CTA button state (always run for backward compatibility)
        this.updateCTAButton();

        // Legacy fallback: Update sidebar button visibility
        const sidebarBtn = document.getElementById('compareBtn');
        if (sidebarBtn) {
            if (this.locations.length === 0) {
                // No locations: Show sidebar button
                sidebarBtn.style.display = 'flex';
                sidebarBtn.disabled = true;
            } else {
                // Has locations: Hide sidebar button
                sidebarBtn.style.display = 'none';
            }
        }
    }

    handleSearchEnhanced(query) {
        this.currentSearchQuery = query;
        
        this.searchManager.search(query, (result) => {
            // Only process if this is still the current query
            if (result.query !== this.currentSearchQuery) {
                return;
            }
            
            if (result.error) {
                this.showSearchError(result.error);
                return;
            }
            
            this.showSearchResults(result.results, result.fromCache);
        });
    }

    showSearchError(errorMessage) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = `
            <div class="search-result-item search-error">
                <div style="color: #dc2626; font-weight: 500;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style="display: inline; margin-right: 8px;">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    ${errorMessage}
                </div>
            </div>
        `;
        resultsContainer.style.display = 'block';
    }

    showSearchResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">Sonuç bulunamadı</div>';
            resultsContainer.style.display = 'block';
            return;
        }

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div style="font-weight: 500;">${result.display_name}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">${result.lat}, ${result.lon}</div>
            `;
            
            item.addEventListener('click', () => {
                this.addLocation(
                    parseFloat(result.lat),
                    parseFloat(result.lon),
                    result.display_name.split(',')[0],
                    result.display_name
                );
                this.hideSearchResults();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = '';
                    console.log('🧹 Search input cleared after result selection');
                }
            });

            resultsContainer.appendChild(item);
        });

        resultsContainer.style.display = 'block';
    }

    hideSearchResults() {
        document.getElementById('searchResults').style.display = 'none';
    }

    async startComparison() {
        if (this.locations.length < 2) {
            this.showNotification('En az 2 lokasyon gerekli', 'warning');
            return;
        }

        this.showLoadingOverlay();

        try {
            // Simulate analysis progress
            await this.simulateAnalysisProgress();

            // Call backend for analysis using the exact same endpoint as modern dashboard
            const analysisPromises = this.locations.map(async (location) => {
                try {
                    const response = await fetch('/api/admin/testing/score-point', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            lat: location.lat,
                            lon: location.lng,
                            category: this.businessType
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: Analysis failed for location ${location.name}`);
                    }
                    
                    const responseText = await response.text();
                    
                    // Check for completely empty or malformed response
                    if (responseText.trim() === '' || responseText === 'null') {
                        throw new Error(`Empty response for location ${location.name} - region not supported`);
                    }
                    
                    let result;
                    try {
                        result = JSON.parse(responseText);
                        console.log(`✅ Successfully parsed response for ${location.name}:`, result);
                    } catch (parseError) {
                        // Only fail if JSON is completely unparseable
                        console.error(`❌ JSON parse error for ${location.name}:`, parseError);
                        console.error(`Raw response was:`, responseText);
                        throw new Error(`Invalid JSON for location ${location.name} - region not supported`);
                    }
                    
                    // Debug: Log the total_score value
                    console.log(`🔍 Checking total_score for ${location.name}:`, {
                        total_score: result.total_score,
                        type: typeof result.total_score,
                        isNull: result.total_score === null,
                        isUndefined: result.total_score === undefined
                    });
                    
                    // Only validate critical fields - allow NaN in non-critical fields
                    if (result.total_score === null || result.total_score === undefined || 
                        (typeof result.total_score === 'string' && result.total_score.includes('NaN'))) {
                        console.error(`❌ Invalid total_score for ${location.name}:`, result.total_score);
                        throw new Error(`Invalid score data for location ${location.name} - region not supported`);
                    }
                    
                    // Convert string NaN to 0 for total_score
                    if (typeof result.total_score === 'string') {
                        result.total_score = parseFloat(result.total_score) || 0;
                    }
                
                // Format result using modern dashboard response structure
                console.log(`🏗️ Building result object for location:`, {
                    originalId: location.id,
                    originalIdType: typeof location.id,
                    name: location.name
                });
                
                return {
                    id: location.id,
                    name: location.name,
                    lat: location.lat,
                    lng: location.lng,
                    address: location.address,
                    coordinates: { lat: location.lat, lng: location.lng },
                    totalScore: result.total_score || 0,
                    rank: 0, // Will be calculated after all scores
                    scores: {
                        hospital: this.safeParseScore(result.breakdown?.hospital_proximity?.score) || 0,
                        competitor: this.safeParseScore(result.breakdown?.competitors?.score) || 0,
                        important: this.safeParseScore(result.breakdown?.important_places?.score) || 0,
                        demographic: this.safeParseScore(result.breakdown?.demographics?.score) || 0
                    },
                    details: {
                        nearby_places: {
                            hospital: {
                                name: result.distances?.hastane_name || 'Hastane',
                                distance: this.formatDistance(result.distances?.hastane_distance)
                            },
                            metro: {
                                name: result.distances?.metro_name || 'Metro',
                                distance: this.formatDistance(result.distances?.metro_distance)
                            },
                            pharmacy: {
                                name: result.distances?.competitor_name || 'Market/Eczane',
                                distance: this.formatDistance(result.distances?.competitor_distance)
                            }
                        },
                        demographic: {
                            population: result.breakdown?.demographics?.details?.population || 0,
                            age_profile: result.breakdown?.demographics?.details?.age_profile || 'Bilinmiyor',
                            income_level: result.breakdown?.demographics?.details?.income_level || 'Bilinmiyor'
                        },
                        competitors: this.processCompetitorData(result.breakdown?.competitors?.details || []),
                        important_places: {
                            metro: result.breakdown?.important_places?.details?.metro_score ? [{
                                name: 'Metro İstasyonu',
                                distance: this.formatDistance(result.distances?.metro_distance),
                                score: result.breakdown?.important_places?.details?.metro_score || 0
                            }] : [],
                            university: result.breakdown?.important_places?.details?.university_score ? [{
                                name: 'Üniversite',
                                distance: 'Bilinmiyor',
                                score: result.breakdown?.important_places?.details?.university_score || 0
                            }] : [],
                            mall: result.breakdown?.important_places?.details?.mall_score ? [{
                                name: 'Alışveriş Merkezi',
                                distance: 'Bilinmiyor',
                                score: result.breakdown?.important_places?.details?.mall_score || 0
                            }] : []
                        },
                        mahalle: result.mahalle || 'Bilinmiyor',
                        category: result.category || 'Orta',
                        weights: {
                            hospital: result.breakdown?.hospital_proximity?.weight || '30%',
                            competitor: result.breakdown?.competitors?.weight || '30%',
                            demographics: result.breakdown?.demographics?.weight || '10%',
                            important_places: result.breakdown?.important_places?.weight || '30%'
                        }
                    }
                };
                
                } catch (locationError) {
                    // Return null for failed locations - they will be filtered out
                    console.warn(`Location analysis failed: ${locationError.message}`);
                    return null;
                }
            });
            
            // Filter out failed locations and handle errors
            const allResults = await Promise.allSettled(analysisPromises);
            const successfulResults = [];
            const failedLocations = [];
            
            allResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value !== null) {
                    successfulResults.push(result.value);
                } else {
                    failedLocations.push(this.locations[index]);
                }
            });
            
            // Remove failed locations from the list
            if (failedLocations.length > 0) {
                this.removeUnsupportedLocations(failedLocations);
                this.showUnsupportedRegionMessage(failedLocations);
            }
            
            // Check if we have enough successful results
            if (successfulResults.length < 2) {
                this.showNotification('Analiz için yeterli geçerli lokasyon yok. En az 2 desteklenen lokasyon gerekli.', 'warning');
                return;
            }
            
            const results = successfulResults;
            
            // Calculate ranks
            results.sort((a, b) => b.totalScore - a.totalScore);
            results.forEach((result, index) => {
                result.rank = index + 1;
            });
            
            const finalResults = {
                success: true,
                locations: results,
                business_type: this.businessType,
                analysis_date: new Date().toISOString()
            };
            
            this.showResults(finalResults);

        } catch (error) {
            console.error('Comparison error:', error);
            this.showNotification('Analiz sırasında hata oluştu', 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    async simulateAnalysisProgress() {
        const progressBar = document.getElementById('analysisProgress');
        let progress = 0;

        return new Promise(resolve => {
            const interval = setInterval(() => {
                progress += Math.random() * 15 + 5;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(resolve, 500);
                }
                progressBar.style.width = progress + '%';
            }, 200);
        });
    }

    showResults(results) {
        const resultsSection = document.getElementById('comparisonResults');
        const resultsContent = document.getElementById('resultsContent');
        
        resultsContent.innerHTML = '';

        // UI Refactoring: Find winning metrics across all locations
        const winners = this.findWinningMetrics(results.locations);

        // Create result cards for each location
        results.locations.forEach((location, index) => {
            console.log(`🏗️ Creating card for location ${index}:`, {
                id: location.id,
                idType: typeof location.id,
                name: location.name,
                coordinates: location.coordinates
            });
            const card = document.createElement('div');
            card.className = `result-card rank-${location.rank}`;
            
            card.innerHTML = `
                <div class="result-header">
                    <div class="result-header-content">
                        <div class="result-info">
                            <h3>${location.name}</h3>
                            <p>${location.address || 'Koordinat: ' + location.coordinates.lat.toFixed(4) + ', ' + location.coordinates.lng.toFixed(4)}</p>
                        </div>
                        <div class="result-total-score">
                            ${this.createCircularProgress(location.totalScore, 100)}
                        </div>
                    </div>
                    
                    ${location.rank === 1 ? `
                        <div class="best-location-badge">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            En İyi Seçenek
                        </div>
                    ` : ''}
                </div>

                <div class="result-body">
                    <div class="score-breakdown">
                        ${this.createScoreItems(location.scores, this.getLocationWinners(winners, index), location.id)}
                    </div>
                    
                    <div class="street-view-map">
                        <div class="street-view-header">
                            <span class="street-view-title">Street View</span>
                            <div class="street-view-coords">${location.coordinates.lat.toFixed(4)}, ${location.coordinates.lng.toFixed(4)}</div>
                        </div>
                        <div class="street-view-image">
                            ${this.createStreetViewImage(location.coordinates.lat, location.coordinates.lng)}
                        </div>
                    </div>
                    

                </div>
            `;
            resultsContent.appendChild(card);
            
            // Street View is now integrated directly in the location card template
            console.log('✅ Street View integrated in location card for:', location.name);
        });

        // Store results for detail modal
        this.analysisResults = results.locations;
        console.log('💾 Stored analysisResults:', this.analysisResults);
        console.log('🔍 analysisResults IDs:', this.analysisResults.map(loc => `${loc.id} (${typeof loc.id})`));
        
                    // Debug Street View containers and setup event listeners
            setTimeout(() => {
                const streetViewContainers = document.querySelectorAll('.street-view-container');
                console.log('🔍 Found Street View containers:', streetViewContainers.length);
                streetViewContainers.forEach((container, index) => {
                    console.log(`  Container ${index}:`, {
                        id: container.id,
                        hasImage: !!container.querySelector('img'),
                        hasLoading: !!container.querySelector('.street-view-loading'),
                        classes: container.className
                    });
                    
                    // Setup event listeners for this container
                    this.setupStreetViewEventListeners(container);
                });
                
                // Add test function to window for debugging
                window.testStreetView = (lat = 39.9691, lng = 32.7838) => {
                    console.log('🧪 Testing Street View for coordinates:', lat, lng);
                    const testContainer = document.createElement('div');
                    testContainer.innerHTML = this.createStreetViewImage(lat, lng);
                    document.body.appendChild(testContainer);
                    console.log('🧪 Test Street View container added to page');
                    
                    // Setup event listeners for test container
                    const testStreetViewContainer = testContainer.querySelector('.street-view-container');
                    if (testStreetViewContainer) {
                        this.setupStreetViewEventListeners(testStreetViewContainer);
                    }
                };

                // Add function to test specific coordinates with fetch
                window.testStreetViewFetch = (lat = 39.9691, lng = 32.7838) => {
                    console.log('🧪 Testing Street View fetch for coordinates:', lat, lng);
                    const apiKey = 'AIzaSyBdqmzhohI-SKOE7pJ5kFULP3z0u5dMj6A';
                    const testUrl = `https://maps.googleapis.com/maps/api/streetview?size=300x200&location=${lat},${lng}&heading=0&pitch=0&fov=90&key=${apiKey}`;
                    
                    console.log('🧪 Fetch URL:', testUrl);
                    
                    fetch(testUrl)
                        .then(response => {
                            console.log('🧪 Fetch response:', response.status, response.statusText);
                            console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
                            
                            if (response.ok) {
                                return response.blob();
                            } else {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                        })
                        .then(blob => {
                            console.log('🧪 Fetch successful, blob:', {
                                size: blob.size,
                                type: blob.type
                            });
                            
                            // Create a test image to verify it loads
                            const url = URL.createObjectURL(blob);
                            const testImg = new Image();
                            testImg.onload = () => {
                                console.log('🧪 Test image loaded successfully:', {
                                    width: testImg.naturalWidth,
                                    height: testImg.naturalHeight
                                });
                                URL.revokeObjectURL(url);
                            };
                            testImg.onerror = () => {
                                console.error('🧪 Test image failed to load');
                                URL.revokeObjectURL(url);
                            };
                            testImg.src = url;
                        })
                        .catch(error => {
                            console.error('🧪 Fetch failed:', error);
                        });
                };

                // Add function to check all Street View containers
                window.checkStreetViewContainers = () => {
                    const containers = document.querySelectorAll('.street-view-container');
                    console.log('🔍 Checking all Street View containers:', containers.length);
                    
                    containers.forEach((container, index) => {
                        const img = container.querySelector('.street-view-static-image');
                        const loading = container.querySelector('.street-view-loading');
                        const fallback = container.querySelector('.street-view-fallback');
                        
                        console.log(`Container ${index} (${container.id}):`, {
                            hasImage: !!img,
                            imageSrc: img?.src,
                            imageComplete: img?.complete,
                            imageNaturalWidth: img?.naturalWidth,
                            imageNaturalHeight: img?.naturalHeight,
                            imageDisplay: img?.style.display,
                            hasLoading: !!loading,
                            loadingDisplay: loading?.style.display,
                            hasFallback: !!fallback,
                            fallbackDisplay: fallback?.style.display,
                            classes: container.className,
                            retryCount: container.dataset.retryCount
                        });
                    });
                };

                // Add function to test the new fetch-based approach
                window.testFetchBasedStreetView = (lat = 39.9691, lng = 32.7838) => {
                    console.log('🧪 Testing fetch-based Street View for coordinates:', lat, lng);
                    const apiKey = 'AIzaSyBdqmzhohI-SKOE7pJ5kFULP3z0u5dMj6A';
                    const testUrl = `https://maps.googleapis.com/maps/api/streetview?size=300x200&location=${lat},${lng}&heading=0&pitch=0&fov=90&key=${apiKey}`;
                    
                    console.log('🧪 Fetch URL:', testUrl);
                    
                    fetch(testUrl)
                        .then(response => {
                            console.log('🧪 Fetch response:', response.status, response.statusText);
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            return response.blob();
                        })
                        .then(blob => {
                            console.log('🧪 Fetch successful, blob:', {
                                size: blob.size,
                                type: blob.type
                            });
                            
                            // Create a test container and image
                            const testContainer = document.createElement('div');
                            testContainer.innerHTML = `
                                <div class="street-view-container" id="test-fetch-${lat}-${lng}">
                                    <div class="street-view-loading">
                                        <div class="street-view-loading-spinner"></div>
                                        <p>Test Street View yükleniyor...</p>
                                    </div>
                                    <img src="" alt="Test Street View" class="street-view-static-image" style="width: 100%; height: auto; display: none;">
                                    <div class="street-view-fallback" style="display: none;">
                                        <div class="street-view-placeholder">
                                            <div class="street-view-placeholder-icon">🗺️</div>
                                            <p>Test Harita Görünümü</p>
                                            <small>Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            document.body.appendChild(testContainer);
                            const img = testContainer.querySelector('.street-view-static-image');
                            
                            // Set up event listeners
                            const blobUrl = URL.createObjectURL(blob);
                            img.onload = () => {
                                console.log('🧪 Test fetch-based image loaded successfully');
                                img.style.display = 'block';
                                testContainer.querySelector('.street-view-loading').style.display = 'none';
                                URL.revokeObjectURL(blobUrl);
                            };
                            img.onerror = () => {
                                console.error('🧪 Test fetch-based image failed to load');
                                testContainer.querySelector('.street-view-fallback').style.display = 'block';
                                testContainer.querySelector('.street-view-loading').style.display = 'none';
                                URL.revokeObjectURL(blobUrl);
                            };
                            
                            img.src = blobUrl;
                        })
                        .catch(error => {
                            console.error('🧪 Fetch-based test failed:', error);
                        });
                };
            }, 1000);

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        console.log('✅ Results displayed with Street View images in location cards');
        
        // Add event delegation for metric item clicks (Detail Panel System)
        this.setupMetricItemClickHandlers(resultsSection);
        
        // Progress bars are now rendered inline in createMetricItem
        console.log('✅ Results displayed with inline progress bars');
        
        // Results shown successfully
    }

    /**
     * Setup event delegation for metric item clicks to open detail panels
     */
    setupMetricItemClickHandlers(container) {
        // Remove any existing listeners
        container.removeEventListener('click', this.handleMetricItemClick);
        container.removeEventListener('keydown', this.handleMetricItemKeydown);
        
        // Add event delegation for clicks
        this.handleMetricItemClick = (event) => {
            const metricItem = event.target.closest('.metric-item');
            if (!metricItem) return;
            
            const categoryType = metricItem.getAttribute('data-category-type');
            const locationId = metricItem.getAttribute('data-location-id');
            
            if (categoryType && locationId && this.detailPanelManager) {
                console.log(`🎯 Metric item clicked: ${categoryType} for location ${locationId}`);
                this.detailPanelManager.togglePanel(categoryType, locationId, metricItem);
            }
        };
        
        // Add event delegation for keyboard navigation
        this.handleMetricItemKeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const metricItem = event.target.closest('.metric-item');
                if (metricItem) {
                    metricItem.click();
                }
            }
        };
        
        container.addEventListener('click', this.handleMetricItemClick);
        container.addEventListener('keydown', this.handleMetricItemKeydown);
        
        console.log('🎯 Metric item click handlers setup complete');
    }

    createScoreItems(scores, winners = {}, locationId = null) {
        const scoreItems = [
            { key: 'hospital', title: 'Hastane Yakınlığı', type: 'hospital' },
            { key: 'important', title: 'Önemli Yerler', type: 'important' },
            { key: 'demographic', title: 'Demografi', type: 'demographics' },
            { key: 'competitor', title: 'Rekabet Analizi', type: 'competition' }
        ];

        return scoreItems.map(item => {
            const score = scores[item.key] || 0;
            const isWinning = winners[item.key] !== undefined;
            
            return this.createMetricItem(item.type, item.title, score, isWinning, locationId);
        }).join('');
    }

    getScoreIcon(type) {
        const icons = {
            hospital: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>',
            competitor: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>',
            important: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>',
            demographic: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>'
        };
        return icons[type] || '';
    }

    showLocationDetails(locationId) {
        console.log('🔍 showLocationDetails called with locationId:', locationId);
        console.log('📊 Current analysisResults:', this.analysisResults);
        
        if (!this.analysisResults) {
            console.error('❌ No analysis results found');
            alert('Analiz sonuçları bulunamadı. Lütfen önce karşılaştırmayı çalıştırın.');
            return;
        }
        
        // Use new detail panel system if available
        if (this.detailPanelManager) {
            console.log('🎯 Using new detail panel system');
            
            // Find the result card for this location
            const resultCard = document.querySelector(`[data-location-id="${locationId}"]`);
            if (resultCard) {
                // Open the first available category panel (e.g., hospital)
                this.detailPanelManager.togglePanel('hospital', locationId, resultCard);
            } else {
                console.error('❌ Could not find result card for location:', locationId);
                alert('Lokasyon kartı bulunamadı. Lütfen sayfayı yenileyin.');
            }
            return;
        }
        
        // Fallback: Show notification that new system is being used
        console.warn('⚠️ DetailPanelManager not available, showing fallback message');
        alert('Detaylı analiz için kategori kartlarına (Hastane, Demografi, vs.) tıklayın.');
    }

    formatDistance(distance) {
        if (!distance || distance === 'Bilinmiyor' || distance === null) {
            return 'Bilinmiyor';
        }
        
        // If it's already formatted (contains 'm'), return as is
        if (typeof distance === 'string' && distance.includes('m')) {
            return distance;
        }
        
        // If it's a number, format it
        const numDistance = parseFloat(distance);
        if (!isNaN(numDistance)) {
            return `${Math.round(numDistance)}m`;
        }
        
        return 'Bilinmiyor';
    }

    createDetailModal(location) {
        console.log('🔧 createDetailModal called for location:', location);
        
        // Remove existing modal
        const existingModal = document.querySelector('.detail-modal');
        if (existingModal) {
            console.log('🗑️ Removing existing modal');
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'detail-modal';
        console.log('✨ Created modal element:', modal);
        modal.innerHTML = `
            <div class="detail-modal-content">
                <div class="detail-modal-header">
                    <div class="detail-modal-header-content">
                        <div>
                            <h3 class="detail-modal-title">${location.name}</h3>
                            <p class="detail-modal-subtitle">${location.address || 'Koordinat: ' + location.coordinates.lat.toFixed(4) + ', ' + location.coordinates.lng.toFixed(4)}</p>
                        </div>
                        <button class="detail-modal-close" onclick="this.closest('.detail-modal').remove()">
                            ✕
                        </button>
                    </div>
                </div>

                <div class="detail-modal-body">
                    ${this.createDetailSections(location)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('📌 Modal appended to body. Total modals in DOM:', document.querySelectorAll('.detail-modal').length);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createDetailSections(location) {
        return `
            <!-- 1. Hastane Yakınlığı -->
            <div class="detail-section">
                <h4 class="detail-section-title">
                    <svg class="detail-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                    </svg>
                    Hastane Yakınlığı
                </h4>
                <div class="nearby-places-grid">
                    <div class="nearby-place-item hospital">
                        <div class="nearby-place-info">
                            <svg class="nearby-place-icon hospital" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                            </svg>
                            <span class="nearby-place-name">${location.details.nearby_places.hospital.name}</span>
                        </div>
                        <span class="nearby-place-distance hospital">${location.details.nearby_places.hospital.distance}</span>
                    </div>
                    <div class="nearby-place-item metro">
                        <div class="nearby-place-info">
                            <svg class="nearby-place-icon metro" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                            </svg>
                            <span class="nearby-place-name">${location.details.nearby_places.metro.name}</span>
                        </div>
                        <span class="nearby-place-distance metro">${location.details.nearby_places.metro.distance}</span>
                    </div>
                    <div class="nearby-place-item pharmacy">
                        <div class="nearby-place-info">
                            <svg class="nearby-place-icon pharmacy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"/>
                            </svg>
                            <span class="nearby-place-name">${location.details.nearby_places.pharmacy.name}</span>
                        </div>
                        <span class="nearby-place-distance pharmacy">${location.details.nearby_places.pharmacy.distance}</span>
                    </div>
                </div>
            </div>

            <!-- 2. Demografik Bilgiler (Hastane yakınlığının altında) -->
            <div class="detail-section">
                <h4 class="detail-section-title">
                    <svg class="detail-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                    Demografik Bilgiler
                </h4>
                <div class="demographic-grid">
                    <div class="demographic-item">
                        <div class="demographic-value">${location.details.demographic.population.toLocaleString()}</div>
                        <div class="demographic-label">Nüfus</div>
                    </div>
                    <div class="demographic-item">
                        <div class="demographic-value">${location.details.demographic.age_profile}</div>
                        <div class="demographic-label">Yaş Profili</div>
                    </div>
                    <div class="demographic-item">
                        <div class="demographic-value">${location.details.demographic.income_level}</div>
                        <div class="demographic-label">Gelir Düzeyi</div>
                    </div>
                </div>
            </div>

            <!-- 3. Önemli Yerler -->
            <div class="detail-section">
                <h4 class="detail-section-title">
                    <svg class="detail-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    Önemli Yerler
                </h4>
                <div class="important-places-sections">
                    ${this.createImportantPlacesSection('Metro İstasyonları', location.details.important_places.metro, 'metro')}
                    ${this.createImportantPlacesSection('Üniversiteler', location.details.important_places.university, 'university')}
                    ${this.createImportantPlacesSection('Alışveriş Merkezleri', location.details.important_places.mall, 'mall')}
                </div>
            </div>

            <!-- 4. Rekabet Analizi (EN SONDA) -->
            <div class="detail-section">
                <h4 class="detail-section-title">
                    <svg class="detail-section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    Rekabet Analizi
                </h4>
                <div class="competitors-list">
                    ${location.details.competitors.map(competitor => `
                        <div class="competitor-item">
                            <div class="competitor-info">
                                <div class="competitor-name">${competitor.name}</div>
                                <div class="competitor-distance">${competitor.distance}</div>
                            </div>
                            <span class="competitor-impact ${competitor.impact < 0 ? 'negative' : 'positive'}">
                                ${competitor.impact > 0 ? '+' : ''}${competitor.impact}/100
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createImportantPlacesSection(title, places, type) {
        if (!places || places.length === 0) return '';

        const icons = {
            metro: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>',
            university: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>',
            mall: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"/>'
        };

        return `
            <div class="important-place-category">
                <div class="important-place-category-title">${title}</div>
                <div class="important-place-list">
                    ${places.map(place => `
                        <div class="important-place-item ${type}">
                            <div class="important-place-item-info">
                                <svg class="important-place-item-icon ${type}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    ${icons[type]}
                                </svg>
                                <span class="important-place-item-name">${place.name}</span>
                                <span class="important-place-item-distance">${place.distance}</span>
                            </div>
                            <span class="important-place-item-score">+${place.score}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getFactorName(key) {
        const names = {
            population_density: 'Nüfus Yoğunluğu',
            competitor_count: 'Rakip Sayısı',
            accessibility: 'Ulaşılabilirlik',
            demographics: 'Demografik Uyum',
            economic_indicators: 'Ekonomik Göstergeler'
        };
        return names[key] || key;
    }

    resetMap() {
        // Clear all locations and markers
        this.locations = [];
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        
        // Reset map view
        this.map.setView([39.9334, 32.8597], 6);
        
        // Update UI
        this.updateLocationList();
        this.updateUI();
        
        // Hide results
        document.getElementById('comparisonResults').style.display = 'none';
        
        this.showNotification('Harita sıfırlandı', 'info');
    }

    startNewComparison() {
        this.resetMap();
    }

    showLoadingOverlay() {
        document.getElementById('analysisLoading').style.display = 'flex';
        document.getElementById('analysisProgress').style.width = '0%';
    }

    hideLoadingOverlay() {
        document.getElementById('analysisLoading').style.display = 'none';
    }

    showNotification(message, type = 'info', duration = 6000) {
        // Remove any existing notifications first
        this.clearAllNotifications();
        
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${type === 'error' ? '#f56565' : type === 'warning' ? '#ed8936' : type === 'success' ? '#48bb78' : '#4299e1'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 400px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease-in-out;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                <span style="flex: 1; padding-right: 10px;">${message}</span>
                <button class="notification-close" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">&times;</button>
            </div>
        `;

        // Add to container
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove after specified duration
        const timeoutId = setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.removeNotification(notification);
        });
    }
    
    clearAllNotifications() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
    }
    
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    parseCoordinates(input) {
        // Support various formats: "lat,lng", "lat, lng", "lat lng"
        const cleaned = input.replace(/\s+/g, ' ').trim();
        const parts = cleaned.split(/[,\s]+/);
        
        if (parts.length !== 2) return null;
        
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (isNaN(lat) || isNaN(lng)) return null;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
        
        return { lat, lng };
    }

    isValidLocation(lat, lng) {
        // Check if coordinates are within Turkey bounds (approximate)
        return lat >= 35.8 && lat <= 42.1 && lng >= 25.7 && lng <= 44.8;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /* ========================================= */
    /* ACCORDION FUNCTIONALITY */
    /* ========================================= */

    /**
     * Toggle accordion open/close state
     */
    async toggleAccordion(accordionId) {
        const accordionItem = document.querySelector(`[data-accordion-id="${accordionId}"]`);
        const header = accordionItem?.querySelector('.accordion-header');
        const content = accordionItem?.querySelector('.accordion-content');
        const chevron = accordionItem?.querySelector('.accordion-chevron');
        
        if (!accordionItem || !header || !content) {
            console.error('Accordion elements not found:', accordionId);
            return;
        }

        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        
        // Close other accordions from the same location only
        await this.closeSameLocationAccordions(accordionId);
        
        if (isExpanded) {
            // Close this accordion
            await this.closeAccordion(accordionItem, header, content, chevron);
        } else {
            // Open this accordion
            await this.openAccordion(accordionItem, header, content, chevron);
        }
    }

    /**
     * Open an accordion
     */
    async openAccordion(accordionItem, header, content, chevron) {
        const categoryType = content.getAttribute('data-category-type');
        const locationId = content.getAttribute('data-location-id');
        
        // Load content if not already loaded
        await this.loadAccordionContent(content, categoryType, locationId);
        
        // Update states
        header.setAttribute('aria-expanded', 'true');
        content.setAttribute('aria-hidden', 'false');
        accordionItem.classList.add('expanded');
        
        // Animate chevron
        chevron.style.transform = 'rotate(180deg)';
        
        // Add active highlight to header
        header.classList.add('active');
        
        // Animate content expansion
        content.style.maxHeight = '0';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 300ms ease-in-out';
        
        // Force reflow and set target height
        content.offsetHeight;
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Clean up after animation
        setTimeout(() => {
            content.style.maxHeight = 'none';
            content.style.overflow = 'visible';
        }, 300);
        
        console.log(`✅ Accordion opened: ${categoryType} for location ${locationId}`);
    }

    /**
     * Close an accordion
     */
    async closeAccordion(accordionItem, header, content, chevron) {
        // Update states
        header.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');
        accordionItem.classList.remove('expanded');
        
        // Animate chevron
        chevron.style.transform = 'rotate(0deg)';
        
        // Remove active highlight
        header.classList.remove('active');
        
        // Animate content collapse
        content.style.maxHeight = content.scrollHeight + 'px';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 300ms ease-in-out';
        
        // Force reflow and collapse
        content.offsetHeight;
        content.style.maxHeight = '0';
        
        console.log(`✅ Accordion closed`);
    }

    /**
     * Close accordions from the same location only
     */
    async closeSameLocationAccordions(currentAccordionId) {
        // Extract location ID from current accordion ID
        const currentAccordionItem = document.querySelector(`[data-accordion-id="${currentAccordionId}"]`);
        if (!currentAccordionItem) return;
        
        const currentContent = currentAccordionItem.querySelector('.accordion-content');
        const currentLocationId = currentContent?.getAttribute('data-location-id');
        
        if (!currentLocationId) return;
        
        // Find and close other accordions from the same location
        const expandedAccordions = document.querySelectorAll('.metric-accordion-item.expanded');
        
        for (const accordionItem of expandedAccordions) {
            const accordionId = accordionItem.getAttribute('data-accordion-id');
            if (accordionId !== currentAccordionId) {
                const content = accordionItem.querySelector('.accordion-content');
                const locationId = content?.getAttribute('data-location-id');
                
                // Only close if it's from the same location
                if (locationId === currentLocationId) {
                    const header = accordionItem.querySelector('.accordion-header');
                    const chevron = accordionItem.querySelector('.accordion-chevron');
                    
                    if (header && content && chevron) {
                        console.log(`❌ Closing accordion from same location: ${accordionId}`);
                        await this.closeAccordion(accordionItem, header, content, chevron);
                    }
                }
            }
        }
    }

    /**
     * Close all accordions except the specified one (kept for backward compatibility)
     */
    async closeAllAccordions(exceptAccordionId = null) {
        const expandedAccordions = document.querySelectorAll('.metric-accordion-item.expanded');
        
        for (const accordionItem of expandedAccordions) {
            const accordionId = accordionItem.getAttribute('data-accordion-id');
            if (accordionId !== exceptAccordionId) {
                const header = accordionItem.querySelector('.accordion-header');
                const content = accordionItem.querySelector('.accordion-content');
                const chevron = accordionItem.querySelector('.accordion-chevron');
                
                if (header && content && chevron) {
                    await this.closeAccordion(accordionItem, header, content, chevron);
                }
            }
        }
    }

    /**
     * Handle keyboard navigation for accordions
     */
    handleAccordionKeydown(event, accordionId) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggleAccordion(accordionId);
        }
    }

    /**
     * Load content for accordion based on category type
     */
    async loadAccordionContent(contentElement, categoryType, locationId) {
        const contentInner = contentElement.querySelector('.accordion-content-inner');
        
        // Check if content is already loaded
        if (contentInner.querySelector('.loading-placeholder')) {
            // Get location data
            const location = this.analysisResults?.find(loc => String(loc.id) === String(locationId));
            
            if (!location) {
                contentInner.innerHTML = '<div class="error-message">Lokasyon verisi bulunamadı</div>';
                return;
            }
            
            // Load category-specific content
            let contentHTML = '';
            
            switch (categoryType) {
                case 'hospital':
                    contentHTML = this.createHospitalAccordionContent(location);
                    break;
                case 'important_places':
                    contentHTML = this.createImportantPlacesAccordionContent(location);
                    break;
                case 'demographic':
                    contentHTML = this.createDemographicAccordionContent(location);
                    break;
                case 'competitor':
                    contentHTML = this.createCompetitorAccordionContent(location);
                    break;
                default:
                    contentHTML = '<div class="error-message">Bilinmeyen kategori türü</div>';
            }
            
            contentInner.innerHTML = contentHTML;
            
            // If this is the demographics category, initialize the donut chart
            if (categoryType === 'demographic') {
                setTimeout(() => this.initializeDemographicsDonutChart(contentInner, location), 100);
            }
        }
    }

    /**
     * Create hospital accordion content
     */
    createHospitalAccordionContent(location) {
        const hospital = location.details?.nearby_places?.hospital || {};
        
        // Format hospital name with type label
        const hospitalName = hospital.name || 'Hastane';
        const hospitalWithType = hospitalName.includes('Hastane') ? hospitalName : `${hospitalName} - Hastane`;
        
        return `
            <div class="accordion-section">
                <h5 class="section-title">En Yakın Hastane</h5>
                <div class="nearby-place-item hospital-item">
                    <div class="place-info">
                        <svg class="place-icon hospital" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                        <span class="place-name">${hospitalWithType}</span>
                    </div>
                    <span class="place-distance hospital-distance">${hospital.distance || 'Bilinmiyor'}</span>
                </div>
                
                <div class="score-explanation">
                    <p><strong>Hastane Yakınlığı Puanı:</strong> ${Math.round(location.scores?.hospital || 0)}/100</p>
                    <p class="explanation-text">Bu puan, en yakın hastanenin mesafesine ve kalitesine göre hesaplanmıştır.</p>
                </div>
            </div>
        `;
    }

    /**
     * Create important places accordion content
     */
    createImportantPlacesAccordionContent(location) {
        const places = location.details?.nearby_places || {};
        
        // Format place names with type labels
        const metroName = places.metro?.name || 'Metro İstasyonu';
        const metroWithType = metroName.includes('Metro') ? metroName : `${metroName} - Metro`;
        
        const pharmacyName = places.pharmacy?.name || 'Eczane';
        const pharmacyWithType = pharmacyName.includes('Eczane') || pharmacyName.includes('Market') ? pharmacyName : `${pharmacyName} - Market/Eczane`;
        
        return `
            <div class="accordion-section">
                <h5 class="section-title">Önemli Yerler</h5>
                
                <div class="important-places-list">
                    <div class="nearby-place-item metro-item">
                        <div class="place-info">
                            <svg class="place-icon metro" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                            </svg>
                            <span class="place-name">${metroWithType}</span>
                        </div>
                        <span class="place-distance metro-distance">${places.metro?.distance || 'Bilinmiyor'}</span>
                    </div>
                    
                    <div class="nearby-place-item pharmacy-item">
                        <div class="place-info">
                            <svg class="place-icon pharmacy" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"/>
                            </svg>
                            <span class="place-name">${pharmacyWithType}</span>
                        </div>
                        <span class="place-distance pharmacy-distance">${places.pharmacy?.distance || 'Bilinmiyor'}</span>
                    </div>
                </div>
                
                <div class="score-explanation">
                    <p><strong>Önemli Yerler Puanı:</strong> ${Math.round(location.scores?.important || 0)}/100</p>
                    <p class="explanation-text">Bu puan, çevredeki önemli yerlere erişim kolaylığına göre hesaplanmıştır.</p>
                </div>
            </div>
        `;
    }

    /**
     * Create demographic accordion content (will include donut chart)
     */
    createDemographicAccordionContent(location) {
        const demographic = location.details?.demographic || {};
        
        return `
            <div class="accordion-section demographic-section">
                <h5 class="section-title">Puan Dağılımı</h5>
                
                <!-- Donut Chart Container -->
                <div class="donut-chart-container">
                    <div id="demographics-donut-chart" class="donut-chart"></div>
                </div>
                
                <h5 class="section-title" style="margin-top: 1.5rem;">Demografik Bilgiler</h5>
                <div class="demographic-stats">
                    <div class="stat-card">
                        <div class="stat-value">${demographic.population?.toLocaleString() || 'Bilinmiyor'}</div>
                        <div class="stat-label">Nüfus</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${demographic.age_profile || 'Bilinmiyor'}</div>
                        <div class="stat-label">Yaş Profili</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${demographic.income_level || 'Bilinmiyor'}</div>
                        <div class="stat-label">Gelir Düzeyi</div>
                    </div>
                </div>
                
                <div class="score-explanation">
                    <p><strong>Demografi Puanı:</strong> ${Math.round(location.scores?.demographic || 0)}/100</p>
                    <p class="explanation-text">Bu puan, nüfus yoğunluğu, yaş profili ve gelir düzeyi faktörlerine göre hesaplanmıştır.</p>
                </div>
            </div>
        `;
    }

    /**
     * Create competitor accordion content
     */
    createCompetitorAccordionContent(location) {
        const competitors = location.details?.competitors || [];
        
        return `
            <div class="accordion-section">
                <h5 class="section-title">Rakip Analizi</h5>
                
                <div class="competitors-list">
                    ${competitors.length > 0 ? competitors.map(competitor => `
                        <div class="competitor-item">
                            <div class="competitor-info">
                                <div class="competitor-name">${competitor.name}</div>
                                <div class="competitor-distance">${competitor.distance}</div>
                            </div>
                            <span class="competitor-impact ${competitor.impact < 0 ? 'negative' : 'positive'}">
                                ${competitor.impact > 0 ? '+' : ''}${competitor.impact}/100
                            </span>
                        </div>
                    `).join('') : '<p class="no-data">Yakında rakip işletme bulunamadı</p>'}
                </div>
                
                <div class="score-explanation">
                    <p><strong>Rekabet Puanı:</strong> ${Math.round(location.scores?.competitor || 0)}/100</p>
                    <p class="explanation-text">Bu puan, çevredeki rakip işletmelerin sayısı ve mesafesine göre hesaplanmıştır.</p>
                </div>
            </div>
        `;
    }

    /**
     * Initialize donut chart for demographics
     */
    initializeDemographicsDonutChart(container, location) {
        const chartContainer = container.querySelector('#demographics-donut-chart');
        if (!chartContainer) return;
        
        // Sample data - in production this would come from the API
        const totalScore = location.scores?.demographic || 0;
        const data = {
            "Yaş Profili": Math.floor(totalScore * 0.4),
            "Gelir Düzeyi": Math.floor(totalScore * 0.35),
            "Nüfus Yoğunluğu": Math.floor(totalScore * 0.25)
        };
        
        // Create custom SVG donut chart
        this.createDonutChart(chartContainer, data, totalScore);
    }

    /**
     * Create SVG donut chart
     */
    createDonutChart(container, data, totalScore) {
        const size = 200;
        const strokeWidth = 20;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        const total = Object.values(data).reduce((sum, value) => sum + value, 0);
        
        let currentOffset = 0;
        
        const svg = `
            <svg width="${size}" height="${size}" class="donut-svg">
                <g transform="translate(${size/2}, ${size/2})">
                    ${Object.entries(data).map(([key, value], index) => {
                        const percentage = total > 0 ? (value / total) : 0;
                        const strokeDasharray = circumference * percentage;
                        const strokeDashoffset = circumference - currentOffset;
                        currentOffset += strokeDasharray;
                        
                        return `
                            <circle
                                cx="0"
                                cy="0" 
                                r="${radius}"
                                fill="transparent"
                                stroke="${colors[index]}"
                                stroke-width="${strokeWidth}"
                                stroke-dasharray="${strokeDasharray} ${circumference - strokeDasharray}"
                                stroke-dashoffset="${strokeDashoffset}"
                                class="donut-segment"
                                data-label="${key}"
                                data-value="${value}"
                                transform="rotate(-90)"
                                style="cursor: pointer; transition: stroke-width 0.3s ease;"
                                onmouseover="this.setAttribute('stroke-width', '${strokeWidth + 4}')"
                                onmouseout="this.setAttribute('stroke-width', '${strokeWidth}')"
                            />
                        `;
                    }).join('')}
                    
                    <!-- Center text -->
                    <text x="0" y="0" text-anchor="middle" dominant-baseline="central" class="donut-center-text">
                        <tspan x="0" dy="-0.3em" class="donut-score">${Math.round(totalScore)}</tspan>
                        <tspan x="0" dy="1.2em" class="donut-label">Toplam</tspan>
                    </text>
                </g>
            </svg>
            
            <!-- Legend -->
            <div class="donut-legend">
                ${Object.entries(data).map(([key, value], index) => `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${colors[index]}"></div>
                        <span class="legend-label">${key}</span>
                        <span class="legend-value">${value}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = svg;
    }

    /**
     * NEW: Render colorful progress bars for all locations
     * @param {Array} locations - Array of location results
     */
    renderProgressBars(locations) {
        try {
            // Input validation
            if (!Array.isArray(locations) || locations.length === 0) {
                console.warn('⚠️ No locations provided for progress bar rendering');
                return;
            }
            
            console.log('🎨 Starting progress bar rendering for', locations.length, 'locations');
            
            // Check if required classes are available
            if (!window.BarRenderer || !window.ColorCalculator) {
                console.warn('⚠️ Progress bar utilities not loaded, skipping progress bar rendering');
                this.showProgressBarFallback();
                return;
            }
            
            const progressBarConfigs = [];
            let successfulConfigs = 0;
            let failedConfigs = 0;
            
            locations.forEach((location, locationIndex) => {
                try {
                    // Validate location data
                    if (!location || typeof location !== 'object') {
                        console.warn(`⚠️ Invalid location data at index ${locationIndex}:`, location);
                        failedConfigs++;
                        return;
                    }
                    
                    const locationId = location.id || `location_${locationIndex}`;
                    const scores = location.scores || {};
                    
                    // Define metrics to render
                    const metrics = [
                        { key: 'hospital', label: 'Hastane Yakınlığı' },
                        { key: 'competitor', label: 'Rekabet Durumu' },
                        { key: 'demographics', label: 'Demografi' },
                        { key: 'important', label: 'Önemli Yerler' }
                    ];
                    
                    metrics.forEach(metric => {
                        try {
                            // Safely extract score with fallback
                            let score = scores[metric.key];
                            
                            // Handle various score formats
                            if (typeof score !== 'number' || isNaN(score)) {
                                console.warn(`⚠️ Invalid score for ${metric.key} in location ${locationId}:`, score);
                                score = 0; // Fallback to 0
                            }
                            
                            const containerId = `progress_${metric.key}_${locationId}`;
                            
                            // Verify container will exist
                            setTimeout(() => {
                                const container = document.getElementById(containerId);
                                if (!container) {
                                    console.warn(`⚠️ Progress bar container not found: ${containerId}`);
                                }
                            }, 100);
                            
                            // Add to batch configuration
                            progressBarConfigs.push({
                                container: containerId,
                                score: score,
                                label: metric.label,
                                options: {
                                    showScore: false, // Score is already shown in header
                                    showLabel: false, // Label is already shown in header
                                    animate: true,
                                    className: `metric-progress-${metric.key}`,
                                    id: `bar_${metric.key}_${locationId}`
                                }
                            });
                            
                            successfulConfigs++;
                            
                        } catch (metricError) {
                            console.error(`❌ Error processing metric ${metric.key} for location ${locationId}:`, metricError);
                            failedConfigs++;
                        }
                    });
                    
                } catch (locationError) {
                    console.error(`❌ Error processing location at index ${locationIndex}:`, locationError);
                    failedConfigs++;
                }
            });
            
            console.log(`📊 Progress bar config summary: ${successfulConfigs} successful, ${failedConfigs} failed`);
            
            // Render all progress bars with staggered animation
            if (progressBarConfigs.length > 0) {
                // Add delay to ensure DOM is ready
                setTimeout(() => {
                    try {
                        const createdBars = BarRenderer.renderMultipleProgressBars(progressBarConfigs, 50);
                        const successfulBars = createdBars.filter(bar => bar !== null).length;
                        
                        console.log(`✅ Successfully rendered ${successfulBars}/${progressBarConfigs.length} progress bars`);
                        
                        if (successfulBars === 0) {
                            console.warn('⚠️ No progress bars were successfully rendered');
                            this.showProgressBarFallback();
                        }
                        
                    } catch (renderError) {
                        console.error('❌ Error during progress bar rendering:', renderError);
                        this.showProgressBarFallback();
                    }
                }, 200);
            } else {
                console.warn('⚠️ No valid progress bar configurations generated');
                this.showProgressBarFallback();
            }
            
        } catch (error) {
            console.error('❌ Critical error in renderProgressBars:', error);
            this.showProgressBarFallback();
        }
    }
    
    /**
     * Show fallback styling when progress bars fail to render
     */
    showProgressBarFallback() {
        console.log('🔄 Applying progress bar fallback styling');
        
        // Find all progress bar containers and apply fallback
        const containers = document.querySelectorAll('[id^="progress_"]');
        containers.forEach(container => {
            if (container.innerHTML.trim() === '') {
                container.innerHTML = `
                    <div class="progress-bar-fallback">
                        <div class="fallback-message">Progress bar unavailable</div>
                    </div>
                `;
                container.style.opacity = '0.5';
            }
        });
        
        // Add fallback CSS if not already added
        if (!document.getElementById('progress-bar-fallback-styles')) {
            const fallbackStyles = document.createElement('style');
            fallbackStyles.id = 'progress-bar-fallback-styles';
            fallbackStyles.textContent = `
                .progress-bar-fallback {
                    height: 0.75rem;
                    background: #f3f4f6;
                    border-radius: 0.375rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px dashed #d1d5db;
                }
                .fallback-message {
                    font-size: 0.625rem;
                    color: #9ca3af;
                    font-style: italic;
                }
            `;
            document.head.appendChild(fallbackStyles);
        }
    }
}

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideInRight 0.3s ease;
    }

    .notification-success { background: #10b981; color: white; }
    .notification-error { background: #ef4444; color: white; }
    .notification-warning { background: #f59e0b; color: white; }
    .notification-info { background: #3b82f6; color: white; }

    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    .result-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .result-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .result-marker {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 1.25rem;
    }

    .result-info {
        flex: 1;
    }

    .result-info h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.25rem 0;
    }

    .result-info p {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
    }

    .result-score {
        font-size: 2rem;
        font-weight: 700;
        color: #374151;
    }

    .best-score {
        color: #10b981;
    }

    .score-breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .factor-item {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .factor-name {
        min-width: 120px;
        font-size: 0.875rem;
        color: #374151;
    }

    .factor-bar {
        flex: 1;
        height: 8px;
        background: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
    }

    .factor-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #10b981);
        border-radius: 4px;
        transition: width 0.5s ease;
    }

    .factor-value {
        min-width: 50px;
        font-size: 0.875rem;
        color: #6b7280;
        text-align: right;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);