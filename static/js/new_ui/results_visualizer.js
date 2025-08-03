/**
 * ResultsVisualizer - Enhanced visualization for Mode 1 analysis results
 * Handles detailed popup functionality, color-coded pins, and interactive results display
 */
class ResultsVisualizer {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.results = [];
        this.selectedResult = null;
        this.popupElement = null;
        
        this.initializePopupTemplate();
        this.bindEvents();
        
        console.log('ResultsVisualizer initialized');
    }

    initializePopupTemplate() {
        // Create popup template if it doesn't exist
        if (!document.getElementById('result-popup-template')) {
            const template = document.createElement('template');
            template.id = 'result-popup-template';
            template.innerHTML = `
                <div class="result-popup">
                    <div class="popup-header">
                        <div class="popup-rank"></div>
                        <div class="popup-info">
                            <h3 class="popup-address"></h3>
                            <div class="popup-score-container">
                                <span class="popup-score"></span>
                                <span class="popup-score-label">puan</span>
                            </div>
                        </div>
                        <button class="popup-close" onclick="window.resultsVisualizer.closePopup()">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="popup-content">
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-header">
                                    <span class="metric-title">Genel Skor</span>
                                    <span class="metric-main-value"></span>
                                </div>
                                <div class="metric-description">Toplam performans değerlendirmesi</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <span class="metric-title">Rakip Yoğunluğu</span>
                                    <span class="metric-competition-value"></span>
                                </div>
                                <div class="metric-bar-container">
                                    <div class="metric-progress-bar">
                                        <div class="metric-progress-fill competition-fill"></div>
                                    </div>
                                </div>
                                <div class="metric-description">Çevredeki rakip işletme sayısı</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <span class="metric-title">Yaya Erişimi</span>
                                    <span class="metric-accessibility-value"></span>
                                </div>
                                <div class="metric-bar-container">
                                    <div class="metric-progress-bar">
                                        <div class="metric-progress-fill accessibility-fill"></div>
                                    </div>
                                </div>
                                <div class="metric-description">Yürüme mesafesi ve ulaşım kolaylığı</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <span class="metric-title">Hedef Kitle Uyumu</span>
                                    <span class="metric-target-value"></span>
                                </div>
                                <div class="metric-bar-container">
                                    <div class="metric-progress-bar">
                                        <div class="metric-progress-fill target-fill"></div>
                                    </div>
                                </div>
                                <div class="metric-description">Demografik uyum ve müşteri potansiyeli</div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4 class="details-title">Detaylı Bilgiler</h4>
                            <div class="details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Yakındaki Rakipler:</span>
                                    <span class="detail-value competitors-count"></span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Yürüme Mesafesi:</span>
                                    <span class="detail-value walking-distance"></span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Toplu Taşıma:</span>
                                    <span class="detail-value public-transport"></span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Otopark:</span>
                                    <span class="detail-value parking-info"></span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="actions-section">
                            <button class="btn btn-primary btn-sm" onclick="window.resultsVisualizer.focusOnLocation()">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                Haritada Göster
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="window.resultsVisualizer.compareWithOthers()">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                                Karşılaştır
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.head.appendChild(template);
        }
    }

    bindEvents() {
        // Close popup on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popupElement) {
                this.closePopup();
            }
        });

        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (this.popupElement && !this.popupElement.contains(e.target) && !e.target.closest('.map-pin')) {
                this.closePopup();
            }
        });
    }

    displayResults(results) {
        this.results = results;
        this.createMapPins(results);
        this.updateResultsList(results);
    }

    createMapPins(results) {
        if (!this.mapManager) return;

        // Clear existing pins
        this.mapManager.clearComparisonPins();

        // Sort results by score for ranking
        const sortedResults = [...results].sort((a, b) => b.score - a.score);

        sortedResults.forEach((result, index) => {
            const pinColor = this.getScoreColor(result.score);
            const rank = index + 1;
            
            const pinElement = this.createPinElement(result, rank, pinColor);
            
            this.mapManager.addPin({
                id: result.id,
                coordinates: result.coordinates,
                element: pinElement,
                data: result,
                onClick: () => this.showPopup(result, rank)
            });
        });
    }

    createPinElement(result, rank, color) {
        const pin = document.createElement('div');
        pin.className = 'map-pin comparison-pin';
        pin.dataset.resultId = result.id;
        pin.style.setProperty('--pin-color', color);
        
        pin.innerHTML = `
            <div class="pin-body">
                <div class="pin-rank">${rank}</div>
                <div class="pin-score">${result.score}</div>
            </div>
            <div class="pin-tooltip">
                <div class="tooltip-address">${result.address}</div>
                <div class="tooltip-score">Skor: ${result.score}</div>
            </div>
        `;

        // Add hover effects
        pin.addEventListener('mouseenter', () => {
            pin.classList.add('pin-hover');
            this.highlightResultItem(result.id);
        });

        pin.addEventListener('mouseleave', () => {
            pin.classList.remove('pin-hover');
            this.unhighlightResultItem(result.id);
        });

        return pin;
    }

    getScoreColor(score) {
        if (score >= 80) return 'hsl(var(--chart-2))'; // Green
        if (score >= 60) return 'hsl(var(--chart-3))'; // Yellow
        return 'hsl(var(--chart-5))'; // Red
    }

    showPopup(result, rank) {
        this.closePopup(); // Close any existing popup
        
        const template = document.getElementById('result-popup-template');
        if (!template) return;

        // Clone template content
        const popupContent = template.content.cloneNode(true);
        
        // Create popup container
        this.popupElement = document.createElement('div');
        this.popupElement.className = 'popup-overlay';
        this.popupElement.appendChild(popupContent);
        
        // Populate popup data
        this.populatePopup(this.popupElement, result, rank);
        
        // Add to DOM
        document.body.appendChild(this.popupElement);
        
        // Animate in
        setTimeout(() => {
            this.popupElement.classList.add('popup-visible');
        }, 10);
        
        // Store current result
        this.selectedResult = result;
        
        // Highlight corresponding result item
        this.selectResultItem(result.id);
    }

    populatePopup(popup, result, rank) {
        // Header information
        popup.querySelector('.popup-rank').textContent = `#${rank}`;
        popup.querySelector('.popup-address').textContent = result.address;
        popup.querySelector('.popup-score').textContent = result.score;
        popup.querySelector('.popup-score').style.color = this.getScoreColor(result.score);
        
        // Main metrics
        popup.querySelector('.metric-main-value').textContent = result.score;
        popup.querySelector('.metric-competition-value').textContent = result.metrics.competition;
        popup.querySelector('.metric-accessibility-value').textContent = result.metrics.accessibility;
        popup.querySelector('.metric-target-value').textContent = result.metrics.targetAudience;
        
        // Progress bars
        popup.querySelector('.competition-fill').style.width = `${result.metrics.competition}%`;
        popup.querySelector('.accessibility-fill').style.width = `${result.metrics.accessibility}%`;
        popup.querySelector('.target-fill').style.width = `${result.metrics.targetAudience}%`;
        
        // Detailed information
        popup.querySelector('.competitors-count').textContent = result.details.nearbyCompetitors || 'N/A';
        popup.querySelector('.walking-distance').textContent = result.details.walkingDistance ? `${result.details.walkingDistance}m` : 'N/A';
        popup.querySelector('.public-transport').textContent = result.details.publicTransport ? 'Mevcut' : 'Yok';
        popup.querySelector('.parking-info').textContent = result.details.parking || 'Bilgi yok';
        
        // Animate metrics
        setTimeout(() => {
            this.animateMetrics(popup);
        }, 300);
    }

    animateMetrics(popup) {
        const progressBars = popup.querySelectorAll('.metric-progress-fill');
        progressBars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                bar.style.width = bar.style.width; // Trigger animation
            }, index * 200);
        });
    }

    closePopup() {
        if (!this.popupElement) return;
        
        this.popupElement.classList.remove('popup-visible');
        
        setTimeout(() => {
            if (this.popupElement && this.popupElement.parentNode) {
                this.popupElement.parentNode.removeChild(this.popupElement);
            }
            this.popupElement = null;
            this.selectedResult = null;
        }, 300);
        
        // Remove result item selection
        this.unselectAllResultItems();
    }

    focusOnLocation() {
        if (this.selectedResult && this.mapManager) {
            this.mapManager.focusOnLocation(this.selectedResult.coordinates);
            this.closePopup();
        }
    }

    compareWithOthers() {
        if (this.selectedResult) {
            // This could open a comparison view
            console.log('Compare with others:', this.selectedResult);
            // For now, just close popup and highlight all results
            this.closePopup();
            this.highlightAllResults();
        }
    }

    updateResultsList(results) {
        // This method works with the sidebar results list
        const resultsList = document.getElementById('comparisonResults');
        if (!resultsList) return;

        // Sort results by score
        const sortedResults = [...results].sort((a, b) => b.score - a.score);
        
        // Update existing result items with enhanced styling
        sortedResults.forEach((result, index) => {
            const resultItem = resultsList.querySelector(`[data-result-id="${result.id}"]`);
            if (resultItem) {
                this.enhanceResultItem(resultItem, result, index + 1);
            }
        });
    }

    enhanceResultItem(resultItem, result, rank) {
        // Add rank indicator if not present
        if (!resultItem.querySelector('.result-rank')) {
            const rankElement = document.createElement('div');
            rankElement.className = 'result-rank';
            rankElement.textContent = `#${rank}`;
            
            const header = resultItem.querySelector('.result-header');
            if (header) {
                header.insertBefore(rankElement, header.firstChild);
            }
        }

        // Add click handler for popup
        resultItem.addEventListener('click', () => {
            this.showPopup(result, rank);
        });

        // Add hover effects
        resultItem.addEventListener('mouseenter', () => {
            this.highlightPin(result.id);
        });

        resultItem.addEventListener('mouseleave', () => {
            this.unhighlightPin(result.id);
        });
    }

    highlightPin(resultId) {
        const pin = document.querySelector(`[data-result-id="${resultId}"]`);
        if (pin) {
            pin.classList.add('pin-highlight');
        }
    }

    unhighlightPin(resultId) {
        const pin = document.querySelector(`[data-result-id="${resultId}"]`);
        if (pin) {
            pin.classList.remove('pin-highlight');
        }
    }

    highlightResultItem(resultId) {
        const resultItem = document.querySelector(`#comparisonResults [data-result-id="${resultId}"]`);
        if (resultItem) {
            resultItem.classList.add('result-hover');
        }
    }

    unhighlightResultItem(resultId) {
        const resultItem = document.querySelector(`#comparisonResults [data-result-id="${resultId}"]`);
        if (resultItem) {
            resultItem.classList.remove('result-hover');
        }
    }

    selectResultItem(resultId) {
        this.unselectAllResultItems();
        const resultItem = document.querySelector(`#comparisonResults [data-result-id="${resultId}"]`);
        if (resultItem) {
            resultItem.classList.add('selected');
        }
    }

    unselectAllResultItems() {
        const resultItems = document.querySelectorAll('#comparisonResults .result-item');
        resultItems.forEach(item => {
            item.classList.remove('selected');
        });
    }

    highlightAllResults() {
        const resultItems = document.querySelectorAll('#comparisonResults .result-item');
        resultItems.forEach(item => {
            item.classList.add('result-highlight');
        });
        
        setTimeout(() => {
            resultItems.forEach(item => {
                item.classList.remove('result-highlight');
            });
        }, 2000);
    }

    // Public API methods
    getSelectedResult() {
        return this.selectedResult;
    }

    clearResults() {
        this.results = [];
        this.selectedResult = null;
        this.closePopup();
        
        if (this.mapManager) {
            this.mapManager.clearComparisonPins();
        }
    }

    updateResult(resultId, newData) {
        const resultIndex = this.results.findIndex(r => r.id === resultId);
        if (resultIndex !== -1) {
            this.results[resultIndex] = { ...this.results[resultIndex], ...newData };
            
            // Update popup if it's showing this result
            if (this.selectedResult && this.selectedResult.id === resultId) {
                this.selectedResult = this.results[resultIndex];
                // Refresh popup
                const rank = this.results
                    .sort((a, b) => b.score - a.score)
                    .findIndex(r => r.id === resultId) + 1;
                this.showPopup(this.selectedResult, rank);
            }
        }
    }
}

// Global instance
window.resultsVisualizer = null;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsVisualizer;
}