/**
 * Mode1Controller - Point Comparison Interface Controller
 * Handles address input, geocoding, and comparative analysis
 */
class Mode1Controller {
    constructor(mapManager, sidebar, apiClient) {
        this.mapManager = mapManager;
        this.sidebar = sidebar;
        this.apiClient = apiClient;
        
        this.addresses = [];
        this.analysisResults = [];
        this.selectedBusinessType = null;
        this.isAnalyzing = false;
        
        this.initializeElements();
        this.bindEvents();
        
        console.log('Mode1Controller initialized');
    }

    initializeElements() {
        // Get elements from sidebar
        this.addressInput = document.getElementById('addressInput');
        this.addAddressBtn = document.getElementById('addAddressBtn');
        this.addressList = document.getElementById('addressList');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.resultsContainer = document.getElementById('mode1Results');
        this.comparisonResults = document.getElementById('comparisonResults');
    }

    bindEvents() {
        // Address input events
        if (this.addressInput) {
            this.addressInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleAddAddress();
                }
            });

            this.addressInput.addEventListener('input', () => {
                this.validateAddressInput();
            });

            // Add autocomplete functionality
            this.setupAddressAutocomplete();
        }

        // Add address button
        if (this.addAddressBtn) {
            this.addAddressBtn.addEventListener('click', () => {
                this.handleAddAddress();
            });
        }

        // Analyze button
        if (this.analyzeBtn) {
            this.analyzeBtn.addEventListener('click', () => {
                this.handleStartAnalysis();
            });
        }
    }

    setupAddressAutocomplete() {
        // Simple autocomplete implementation
        let autocompleteTimeout;
        
        this.addressInput.addEventListener('input', (e) => {
            clearTimeout(autocompleteTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 3) {
                this.hideAutocomplete();
                return;
            }
            
            autocompleteTimeout = setTimeout(() => {
                this.showAddressSuggestions(query);
            }, 300);
        });

        // Hide autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.address-input-container')) {
                this.hideAutocomplete();
            }
        });
    }

    async showAddressSuggestions(query) {
        try {
            // This would integrate with a geocoding service
            // For now, show some mock suggestions
            const suggestions = await this.getAddressSuggestions(query);
            this.renderAutocomplete(suggestions);
        } catch (error) {
            console.error('Error getting address suggestions:', error);
        }
    }

    async getAddressSuggestions(query) {
        // Mock suggestions - in real implementation, this would call a geocoding API
        const mockSuggestions = [
            `${query} - Çankaya, Ankara`,
            `${query} - Keçiören, Ankara`,
            `${query} - Yenimahalle, Ankara`,
            `${query} Caddesi - Kızılay, Ankara`,
            `${query} Sokak - Tunalı, Ankara`
        ];
        
        return mockSuggestions.slice(0, 5);
    }

    renderAutocomplete(suggestions) {
        // Remove existing autocomplete
        this.hideAutocomplete();
        
        if (suggestions.length === 0) return;
        
        const autocompleteContainer = document.createElement('div');
        autocompleteContainer.className = 'address-autocomplete';
        autocompleteContainer.innerHTML = suggestions.map(suggestion => `
            <div class="autocomplete-item" onclick="window.mode1Controller.selectSuggestion('${suggestion}')">
                <svg class="w-4 h-4 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                ${suggestion}
            </div>
        `).join('');
        
        const inputContainer = this.addressInput.closest('.address-input-container');
        inputContainer.appendChild(autocompleteContainer);
        
        // Add styles if not already added
        if (!document.getElementById('autocomplete-styles')) {
            const styles = document.createElement('style');
            styles.id = 'autocomplete-styles';
            styles.textContent = `
                .address-autocomplete {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: hsl(var(--card));
                    border: 1px solid hsl(var(--border));
                    border-radius: var(--radius);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .autocomplete-item {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem;
                    cursor: pointer;
                    border-bottom: 1px solid hsl(var(--border));
                    transition: background-color 0.2s ease;
                }
                
                .autocomplete-item:last-child {
                    border-bottom: none;
                }
                
                .autocomplete-item:hover {
                    background: hsl(var(--muted));
                }
                
                .address-input-container {
                    position: relative;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    selectSuggestion(suggestion) {
        this.addressInput.value = suggestion;
        this.hideAutocomplete();
        this.validateAddressInput();
        this.addressInput.focus();
    }

    hideAutocomplete() {
        const existing = document.querySelector('.address-autocomplete');
        if (existing) {
            existing.remove();
        }
    }

    validateAddressInput() {
        const address = this.addressInput.value.trim();
        const isValid = address.length >= 3;
        const isDuplicate = this.addresses.some(addr => addr.text === address);
        
        if (this.addAddressBtn) {
            this.addAddressBtn.disabled = !isValid || isDuplicate;
            
            if (isDuplicate) {
                this.addAddressBtn.textContent = 'Adres zaten mevcut';
            } else if (!isValid) {
                this.addAddressBtn.textContent = 'En az 3 karakter';
            } else {
                this.addAddressBtn.textContent = 'Adres Ekle';
            }
        }
    }

    async handleAddAddress() {
        const address = this.addressInput.value.trim();
        
        if (!this.isValidAddress(address)) {
            this.showError('Geçerli bir adres girin');
            return;
        }
        
        if (this.isDuplicateAddress(address)) {
            this.showError('Bu adres zaten eklenmiş');
            return;
        }
        
        try {
            // Show loading state for this address
            this.setAddButtonLoading(true);
            
            // Geocode the address
            const coordinates = await this.geocodeAddress(address);
            
            // Add to addresses list
            const addressObj = {
                id: Date.now(),
                text: address,
                coordinates: coordinates,
                isValid: true
            };
            
            this.addresses.push(addressObj);
            
            // Update UI
            this.updateAddressList();
            this.updateAnalyzeButton();
            this.clearAddressInput();
            
            // Add pin to map
            if (this.mapManager) {
                this.mapManager.addAddressPin(addressObj);
            }
            
            // Hide autocomplete
            this.hideAutocomplete();
            
        } catch (error) {
            console.error('Error adding address:', error);
            this.showError('Adres eklenirken hata oluştu');
        } finally {
            this.setAddButtonLoading(false);
        }
    }

    isValidAddress(address) {
        return address && address.length >= 3;
    }

    isDuplicateAddress(address) {
        return this.addresses.some(addr => addr.text.toLowerCase() === address.toLowerCase());
    }

    async geocodeAddress(address) {
        try {
            // This would integrate with your geocoding service
            // For now, return mock coordinates around Ankara
            const baseCoords = [32.8597, 39.9334]; // Ankara center
            const randomOffset = () => (Math.random() - 0.5) * 0.1; // ±0.05 degrees
            
            return [
                baseCoords[0] + randomOffset(),
                baseCoords[1] + randomOffset()
            ];
        } catch (error) {
            throw new Error('Adres konumu bulunamadı');
        }
    }

    setAddButtonLoading(loading) {
        if (!this.addAddressBtn) return;
        
        if (loading) {
            this.addAddressBtn.disabled = true;
            this.addAddressBtn.innerHTML = `
                <div class="loading-spinner-sm mr-2"></div>
                Ekleniyor...
            `;
        } else {
            this.addAddressBtn.disabled = false;
            this.addAddressBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Adres Ekle
            `;
        }
    }

    clearAddressInput() {
        if (this.addressInput) {
            this.addressInput.value = '';
            this.validateAddressInput();
        }
    }

    updateAddressList() {
        if (!this.addressList) return;
        
        this.addressList.innerHTML = '';
        
        this.addresses.forEach((address, index) => {
            const addressItem = document.createElement('div');
            addressItem.className = 'address-item';
            addressItem.style.opacity = '0';
            addressItem.style.transform = 'translateY(-10px)';
            
            addressItem.innerHTML = `
                <div class="address-content">
                    <span class="address-text">${address.text}</span>
                    ${!address.isValid ? '<span class="address-error">Konum bulunamadı</span>' : ''}
                </div>
                <button class="address-remove" onclick="window.mode1Controller.removeAddress(${address.id})" title="Adresi kaldır">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            `;
            
            this.addressList.appendChild(addressItem);
            
            // Animate in
            setTimeout(() => {
                addressItem.style.transition = 'all 0.3s ease';
                addressItem.style.opacity = '1';
                addressItem.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    removeAddress(addressId) {
        const addressIndex = this.addresses.findIndex(addr => addr.id === addressId);
        if (addressIndex === -1) return;
        
        const address = this.addresses[addressIndex];
        
        // Remove from array
        this.addresses.splice(addressIndex, 1);
        
        // Update UI
        this.updateAddressList();
        this.updateAnalyzeButton();
        
        // Remove from map
        if (this.mapManager) {
            this.mapManager.removeAddressPin(address.id);
        }
        
        // Clear results if we have less than 2 addresses
        if (this.addresses.length < 2) {
            this.clearResults();
        }
    }

    updateAnalyzeButton() {
        if (!this.analyzeBtn) return;
        
        const validAddresses = this.addresses.filter(addr => addr.isValid);
        const hasEnoughAddresses = validAddresses.length >= 2;
        
        this.analyzeBtn.disabled = !hasEnoughAddresses || this.isAnalyzing;
        
        if (this.isAnalyzing) {
            this.analyzeBtn.innerHTML = `
                <div class="loading-spinner-sm mr-2"></div>
                Analiz ediliyor...
            `;
        } else if (hasEnoughAddresses) {
            this.analyzeBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                ${validAddresses.length} Konumu Analiz Et
            `;
        } else {
            this.analyzeBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                En az 2 geçerli konum gerekli
            `;
        }
    }

    async handleStartAnalysis() {
        const validAddresses = this.addresses.filter(addr => addr.isValid);
        
        if (validAddresses.length < 2) {
            this.showError('En az 2 geçerli konum gerekli');
            return;
        }
        
        if (this.isAnalyzing) return;
        
        try {
            this.isAnalyzing = true;
            this.updateAnalyzeButton();
            
            // Show loading state
            if (this.sidebar) {
                this.sidebar.showLoading('Konumlar analiz ediliyor...');
            }
            
            // Perform analysis
            const results = await this.analyzeLocations(validAddresses);
            
            // Store results
            this.analysisResults = results;
            
            // Display results
            this.displayResults(results);
            
            // Update map
            if (this.mapManager) {
                this.mapManager.showComparisonResults(results);
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Analiz sırasında bir hata oluştu');
        } finally {
            this.isAnalyzing = false;
            this.updateAnalyzeButton();
            
            if (this.sidebar) {
                this.sidebar.hideLoading();
            }
        }
    }

    async analyzeLocations(addresses) {
        try {
            // Prepare request data
            const requestData = {
                business_type: this.selectedBusinessType,
                locations: addresses.map(addr => ({
                    id: addr.id,
                    address: addr.text,
                    coordinates: addr.coordinates
                }))
            };
            
            // Call backend API
            const response = await this.apiClient.post('/api/v5/score_points', requestData);
            
            if (!response.success) {
                throw new Error(response.error || 'Analiz başarısız');
            }
            
            return response.data.map(result => ({
                id: result.id,
                address: result.address,
                coordinates: result.coordinates,
                score: Math.round(result.total_score),
                metrics: {
                    competition: Math.round(result.competition_score || 0),
                    accessibility: Math.round(result.accessibility_score || 0),
                    targetAudience: Math.round(result.target_audience_score || 0),
                    footTraffic: Math.round(result.foot_traffic_score || 0)
                },
                details: result.details || {}
            }));
            
        } catch (error) {
            // Fallback to mock data for development
            console.warn('Using mock data for analysis:', error);
            return this.getMockAnalysisResults(addresses);
        }
    }

    getMockAnalysisResults(addresses) {
        return addresses.map(addr => ({
            id: addr.id,
            address: addr.text,
            coordinates: addr.coordinates,
            score: Math.floor(Math.random() * 40) + 60, // 60-100
            metrics: {
                competition: Math.floor(Math.random() * 100),
                accessibility: Math.floor(Math.random() * 100),
                targetAudience: Math.floor(Math.random() * 100),
                footTraffic: Math.floor(Math.random() * 100)
            },
            details: {
                nearbyCompetitors: Math.floor(Math.random() * 10),
                walkingDistance: Math.floor(Math.random() * 500) + 100,
                publicTransport: Math.random() > 0.5
            }
        }));
    }

    displayResults(results) {
        if (!this.comparisonResults) return;
        
        // Clear previous results
        this.comparisonResults.innerHTML = '';
        
        // Sort by score (highest first)
        const sortedResults = [...results].sort((a, b) => b.score - a.score);
        
        // Create result items
        sortedResults.forEach((result, index) => {
            const resultItem = this.createResultItem(result, index);
            this.comparisonResults.appendChild(resultItem);
        });
        
        // Show results container
        if (this.resultsContainer) {
            this.resultsContainer.classList.remove('hidden');
        }
        
        // Animate results appearance
        this.animateResultsIn();
    }

    createResultItem(result, index) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.dataset.resultId = result.id;
        resultItem.style.opacity = '0';
        resultItem.style.transform = 'translateY(20px)';
        
        // Determine score color
        const scoreColor = this.getScoreColor(result.score);
        
        resultItem.innerHTML = `
            <div class="result-header">
                <div class="result-rank">#${index + 1}</div>
                <div class="result-info">
                    <div class="result-address">${result.address}</div>
                    <div class="result-score" style="color: ${scoreColor}">
                        ${result.score}
                        <span class="score-label">puan</span>
                    </div>
                </div>
            </div>
            <div class="result-metrics">
                <div class="metric-item">
                    <span class="metric-label">Rekabet</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${result.metrics.competition}%"></div>
                    </div>
                    <span class="metric-value">${result.metrics.competition}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Erişim</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${result.metrics.accessibility}%"></div>
                    </div>
                    <span class="metric-value">${result.metrics.accessibility}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Hedef Kitle</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${result.metrics.targetAudience}%"></div>
                    </div>
                    <span class="metric-value">${result.metrics.targetAudience}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Yaya Trafiği</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${result.metrics.footTraffic}%"></div>
                    </div>
                    <span class="metric-value">${result.metrics.footTraffic}</span>
                </div>
            </div>
        `;
        
        // Add click handler
        resultItem.addEventListener('click', () => {
            this.selectResult(result);
        });
        
        return resultItem;
    }

    getScoreColor(score) {
        if (score >= 80) return 'hsl(var(--chart-2))'; // Green
        if (score >= 60) return 'hsl(var(--chart-3))'; // Yellow
        return 'hsl(var(--chart-5))'; // Red
    }

    animateResultsIn() {
        const resultItems = this.comparisonResults.querySelectorAll('.result-item');
        
        resultItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
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
        if (this.mapManager) {
            this.mapManager.focusOnLocation(result.coordinates, result);
        }
        
        // Store selection
        this.selectedResult = result;
    }

    clearResults() {
        if (this.comparisonResults) {
            this.comparisonResults.innerHTML = '';
        }
        
        if (this.resultsContainer) {
            this.resultsContainer.classList.add('hidden');
        }
        
        this.analysisResults = [];
        this.selectedResult = null;
        
        // Clear map results
        if (this.mapManager) {
            this.mapManager.clearComparisonResults();
        }
    }

    showError(message) {
        // Use sidebar error display or create notification
        if (this.sidebar) {
            this.sidebar.showError(message);
        } else {
            // Fallback notification
            console.error(message);
            alert(message); // Replace with proper notification system
        }
    }

    // Public API methods
    setBusinessType(businessType) {
        this.selectedBusinessType = businessType;
    }

    getAddresses() {
        return this.addresses;
    }

    getResults() {
        return this.analysisResults;
    }

    getSelectedResult() {
        return this.selectedResult;
    }

    reset() {
        this.addresses = [];
        this.analysisResults = [];
        this.selectedResult = null;
        this.isAnalyzing = false;
        
        this.updateAddressList();
        this.updateAnalyzeButton();
        this.clearResults();
        this.clearAddressInput();
        
        if (this.mapManager) {
            this.mapManager.clearAddressPins();
            this.mapManager.clearComparisonResults();
        }
    }
}

// Global function for HTML onclick handlers
window.mode1Controller = null;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Mode1Controller;
}