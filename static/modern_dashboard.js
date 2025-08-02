/**
 * Modern Dashboard JavaScript
 * LocationIQ Pro - Advanced Location Analysis
 */

class ModernLocationAnalyzer {
    constructor() {
        this.map = null;
        this.currentMode = 'heatmap';
        this.currentCategory = 'cafe';
        this.heatmapLayer = null;
        this.markersLayer = null;
        this.isAnalyzing = false;
        this.lastAnalysisResult = null;
        
        // Category configurations
        this.categoryConfig = {
            cafe: { emoji: '☕', color: '#f59e0b', name: 'Cafe' },
            restoran: { emoji: '🍽️', color: '#ea580c', name: 'Restoran' },
            market: { emoji: '🛒', color: '#7c3aed', name: 'Market' },
            eczane: { emoji: '💊', color: '#059669', name: 'Eczane' },
            firin: { emoji: '🍞', color: '#dc2626', name: 'Fırın' },
            avm: { emoji: '🛍️', color: '#2563eb', name: 'AVM' }
        };
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.setupEventListeners();
        this.updateUI();
        
        // Show welcome message
        this.showToast('success', 'LocationIQ Pro', 'Modern dashboard başarıyla yüklendi!');
    }
    
    initMap() {
        // Initialize map centered on Yenimahalle, Ankara
        this.map = L.map('map', {
            zoomControl: false // We'll use custom controls
        }).setView([39.9334, 32.8597], 12);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Initialize layers
        this.markersLayer = L.layerGroup().addTo(this.map);
        
        // Map event listeners - Direct analysis on click
        this.map.on('click', (e) => {
            if (this.currentMode === 'point') {
                this.analyzePointDirectly(e.latlng.lat, e.latlng.lng);
            }
        });
        
        this.map.on('zoomend moveend', () => {
            if (this.currentMode === 'heatmap') {
                this.updateHeatmap();
            }
        });
    }
    
    setupEventListeners() {
        // Analysis mode buttons
        document.querySelectorAll('.analysis-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.setAnalysisMode(mode);
            });
        });
        
        // Business category selector
        document.getElementById('business-category').addEventListener('change', (e) => {
            this.setBusinessCategory(e.target.value);
        });
        
        // Run analysis button
        document.getElementById('run-analysis').addEventListener('click', () => {
            this.runAnalysis();
        });
        
        // Map controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.map.zoomIn();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.map.zoomOut();
        });
        
        // Point analysis inputs
        const pointLatInput = document.getElementById('point-lat');
        const pointLonInput = document.getElementById('point-lon');
        
        if (pointLatInput && pointLonInput) {
            [pointLatInput, pointLonInput].forEach(input => {
                input.addEventListener('change', () => {
                    const lat = parseFloat(pointLatInput.value);
                    const lon = parseFloat(pointLonInput.value);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        this.map.setView([lat, lon], 16);
                        this.analyzePointDirectly(lat, lon);
                    }
                });
            });
        }
        
        // Area analysis selector
        const areaSelect = document.getElementById('target-area');
        if (areaSelect) {
            areaSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.analyzeArea(e.target.value);
                }
            });
        }
    }
    
    // Direct point analysis when clicking on map
    async analyzePointDirectly(lat, lon) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.showLoading(true);
        
        // Update input fields
        document.getElementById('point-lat').value = lat.toFixed(6);
        document.getElementById('point-lon').value = lon.toFixed(6);
        
        try {
            console.log(`🎯 Modern Dashboard - Scoring point: ${lat.toFixed(6)}, ${lon.toFixed(6)} for category: ${this.currentCategory}`);
            
            const response = await fetch('/api/admin/testing/score-point', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lat: lat,
                    lon: lon,
                    category: this.currentCategory
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API hatası');
            }
            
            const result = await response.json();
            console.log(`✅ Modern Dashboard - Score result:`, result);
            console.log(`📊 Modern Dashboard - Final score: ${Math.round(result.total_score || result.normalized_score || 0)}/100`);
            
            this.lastAnalysisResult = result;
            this.displayPointResult(result, lat, lon);
            this.showToast('success', 'Analiz Tamamlandı', `Skor: ${Math.round(result.total_score || result.normalized_score || 0)}/100`);
            
        } catch (error) {
            console.error('Point analysis error:', error);
            this.showToast('error', 'Analiz Hatası', error.message || 'Analiz sırasında bir hata oluştu');
        } finally {
            this.isAnalyzing = false;
            this.showLoading(false);
        }
    }
    
    createDetailedPopup(result, lat, lon) {
        const score = result.total_score || result.normalized_score || 0;
        const breakdown = result.breakdown || {};
        
        let popupContent = `
            <div class="detailed-popup" style="min-width: 350px; font-family: system-ui, sans-serif;">
                <!-- Header -->
                <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 8px 8px 0 0; margin: -10px -10px 15px -10px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: bold;">
                        ${result.emoji || '📍'} ${result.category || 'Lokasyon Analizi'}
                    </h3>
                    <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">
                        ${Math.round(score)}<span style="font-size: 18px;">/100</span>
                    </div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        ${result.mahalle || 'Bilinmeyen Mahalle'}
                    </div>
                </div>
                
                <!-- Coordinates -->
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 12px;">
                    <strong>📍 Koordinatlar:</strong><br>
                    Enlem: ${lat.toFixed(6)} | Boylam: ${lon.toFixed(6)}
                </div>
        `;
        
        // Score breakdown with clickable details
        if (breakdown.hospital_proximity || breakdown.competitors || breakdown.demographics || breakdown.important_places) {
            popupContent += `
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #374151;">📊 Puan Detayları</h4>
                    <div style="display: grid; gap: 8px;">
            `;
            
            if (breakdown.hospital_proximity) {
                popupContent += `
                    <div style="padding: 8px; background: #f0f9ff; border-radius: 4px; cursor: pointer; transition: all 0.2s;" 
                         onclick="locationAnalyzer.showDetailBreakdown('hospital', ${JSON.stringify(breakdown.hospital_proximity).replace(/"/g, '&quot;')}, ${JSON.stringify(result.raw_breakdown).replace(/"/g, '&quot;')})">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px;">🏥 Hastane Yakınlığı (${breakdown.hospital_proximity.weight}):</span>
                            <span style="font-weight: bold; color: ${this.getScoreColorHex(breakdown.hospital_proximity.score)};">
                                ${Math.round(breakdown.hospital_proximity.score || 0)}/100 ▼
                            </span>
                        </div>
                    </div>
                `;
            }
            
            if (breakdown.competitors) {
                popupContent += `
                    <div style="padding: 8px; background: #fef3f2; border-radius: 4px; cursor: pointer; transition: all 0.2s;" 
                         onclick="locationAnalyzer.showDetailBreakdown('competitors', ${JSON.stringify(breakdown.competitors).replace(/"/g, '&quot;')}, ${JSON.stringify(result.raw_breakdown).replace(/"/g, '&quot;')})">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px;">🏪 Rekabet Analizi (${breakdown.competitors.weight}):</span>
                            <span style="font-weight: bold; color: ${this.getScoreColorHex(breakdown.competitors.score)};">
                                ${Math.round(breakdown.competitors.score || 0)}/100 ▼
                            </span>
                        </div>
                    </div>
                `;
            }
            
            if (breakdown.important_places) {
                popupContent += `
                    <div style="padding: 8px; background: #f0fdf4; border-radius: 4px; cursor: pointer; transition: all 0.2s;" 
                         onclick="locationAnalyzer.showDetailBreakdown('important_places', ${JSON.stringify(breakdown.important_places).replace(/"/g, '&quot;')}, ${JSON.stringify(result.raw_breakdown).replace(/"/g, '&quot;')})">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px;">🚇 Önemli Yerler (${breakdown.important_places.weight}):</span>
                            <span style="font-weight: bold; color: ${this.getScoreColorHex(breakdown.important_places.score)};">
                                ${Math.round(breakdown.important_places.score || 0)}/100 ▼
                            </span>
                        </div>
                    </div>
                `;
            }
            
            if (breakdown.demographics) {
                popupContent += `
                    <div style="padding: 8px; background: #fefce8; border-radius: 4px; cursor: pointer; transition: all 0.2s;" 
                         onclick="locationAnalyzer.showDetailBreakdown('demographics', ${JSON.stringify(breakdown.demographics).replace(/"/g, '&quot;')}, ${JSON.stringify(result.raw_breakdown).replace(/"/g, '&quot;')})">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 13px;">👥 Demografi (${breakdown.demographics.weight}):</span>
                            <span style="font-weight: bold; color: ${this.getScoreColorHex(breakdown.demographics.score)};">
                                ${Math.round(breakdown.demographics.score || 0)}/100 ▼
                            </span>
                        </div>
                    </div>
                `;
            }
            
            popupContent += `</div></div>`;
        }
        
        // Nearby places (if available)
        popupContent += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #374151;">📍 Yakın Yerler</h4>
                <div style="max-height: 150px; overflow-y: auto;">
        `;
        
        // Add nearby places information with names
        const nearbyPlaces = [];
        
        // Hospital
        if (breakdown.hospital_distance) {
            nearbyPlaces.push({
                type: '🏥 En Yakın Hastane',
                name: result.distances?.hastane_name || 'Bilinmeyen Hastane',
                distance: this.calculateDistance(breakdown.hospital_distance)
            });
        }
        
        // Metro
        if (breakdown.metro_distance) {
            nearbyPlaces.push({
                type: '🚇 En Yakın Metro',
                name: result.distances?.metro_name || 'Bilinmeyen Metro',
                distance: this.calculateDistance(breakdown.metro_distance)
            });
        }
        
        // Market
        if (breakdown.market_distance) {
            nearbyPlaces.push({
                type: '🛒 En Yakın Market',
                name: result.distances?.market_name || 'Bilinmeyen Market',
                distance: this.calculateDistance(breakdown.market_distance)
            });
        }
        
        // Competitor
        if (breakdown.competitor_distance) {
            const config = this.categoryConfig[this.currentCategory];
            nearbyPlaces.push({
                type: `🏪 En Yakın ${config.name}`,
                name: result.distances?.[`${this.currentCategory}_name`] || `Bilinmeyen ${config.name}`,
                distance: this.calculateDistance(breakdown.competitor_distance)
            });
        }
        
        if (nearbyPlaces.length === 0) {
            popupContent += `<div style="text-align: center; color: #6b7280; font-size: 12px; padding: 10px;">Yakın yer bilgisi mevcut değil</div>`;
        } else {
            nearbyPlaces.forEach(place => {
                popupContent += `
                    <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span style="font-weight: bold;">${place.type}:</span>
                            <span style="font-weight: bold; color: #059669;">${place.distance}</span>
                        </div>
                        <div style="font-size: 11px; color: #6b7280; padding-left: 4px;">
                            📍 ${place.name}
                        </div>
                    </div>
                `;
            });
        }
        
        popupContent += `</div></div>`;
        
        // Action buttons
        popupContent += `
            <div style="display: flex; gap: 8px; margin-top: 15px;">
                <button onclick="locationAnalyzer.showDetailedAnalysis(${lat}, ${lon})" 
                        style="flex: 1; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    📊 Detaylı Analiz
                </button>
                <button onclick="locationAnalyzer.exportPointReport(${lat}, ${lon})" 
                        style="flex: 1; padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    📄 Rapor Al
                </button>
            </div>
        `;
        
        popupContent += `</div>`;
        
        return popupContent;
    }
    
    calculateDistance(distance) {
        if (!distance) return null;
        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    }
    
    getScoreColorHex(score) {
        if (score >= 80) return '#059669'; // green
        if (score >= 60) return '#d97706'; // yellow
        if (score >= 40) return '#ea580c'; // orange
        return '#dc2626'; // red
    }
    
    showDetailBreakdown(type, breakdownData, rawBreakdown) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const content = this.createDetailBreakdownContent(type, breakdownData, rawBreakdown);
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 24px; max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: bold;">${this.getDetailTitle(type)}</h2>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
                </div>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    getDetailTitle(type) {
        const titles = {
            'hospital': '🏥 Hastane Yakınlığı Detayı',
            'competitors': '🏪 Rekabet Analizi Detayı',
            'important_places': '🚇 Önemli Yerler Detayı',
            'demographics': '👥 Demografi Detayı'
        };
        return titles[type] || 'Detay';
    }
    
    createDetailBreakdownContent(type, breakdownData, rawBreakdown) {
        switch(type) {
            case 'hospital':
                return this.createHospitalDetail(breakdownData, rawBreakdown);
            case 'competitors':
                return this.createCompetitorDetail(breakdownData, rawBreakdown);
            case 'important_places':
                return this.createImportantPlacesDetail(breakdownData, rawBreakdown);
            case 'demographics':
                return this.createDemographicsDetail(breakdownData, rawBreakdown);
            default:
                return '<p>Detay bilgisi mevcut değil</p>';
        }
    }
    
    createHospitalDetail(breakdownData, rawBreakdown) {
        const hospitalData = rawBreakdown.hastane || {};
        const details = hospitalData.details || [];
        
        let content = `
            <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: bold; font-size: 16px;">Toplam Puan:</span>
                    <span style="font-size: 18px; font-weight: bold; color: ${this.getScoreColorHex(breakdownData.score)};">
                        ${Math.round(breakdownData.score || 0)}/100
                    </span>
                </div>
                <div style="font-size: 14px; color: #666;">
                    ${breakdownData.explanation || 'Hastane yakınlığından alınan puan'}
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Yakındaki Hastaneler:</h3>
        `;
        
        if (details.length > 0) {
            details.forEach(hospital => {
                const score = parseFloat(hospital.puan) || 0;
                content += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid ${this.getScoreColorHex(Math.abs(score))};">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 4px;">${hospital.ad || 'Bilinmeyen Hastane'}</div>
                            <div style="font-size: 12px; color: #666;">📍 Mesafe: ${hospital.mesafe || 'Bilinmiyor'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: ${this.getScoreColorHex(Math.abs(score))};">
                                +${Math.abs(score).toFixed(1)}/100
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            content += `
                <div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 6px;">
                    Yakında hastane bulunamadı
                </div>
            `;
        }
        
        content += `</div>`;
        return content;
    }
    
    createCompetitorDetail(breakdownData, rawBreakdown) {
        const competitorKey = `rakip_${this.currentCategory}`;
        const competitorData = rawBreakdown[competitorKey] || {};
        const details = competitorData.details || [];
        
        let content = `
            <div style="background: #fef3f2; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: bold; font-size: 16px;">Rakip Durumu:</span>
                    <span style="font-size: 18px; font-weight: bold; color: ${this.getScoreColorHex(breakdownData.score)};">
                        ${Math.round(breakdownData.score || 0)}/100
                    </span>
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">
                    ${breakdownData.explanation || 'Rakip yoğunluğu analizi'}
                </div>
                <div style="font-size: 12px; color: #888;">
                    <strong>Not:</strong> Düşük puan = Çok rakip var (kötü), Yüksek puan = Az rakip (iyi)
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Yakındaki Rakipler:</h3>
        `;
        
        if (details.length > 0) {
            let totalNegativeScore = 0;
            details.forEach(competitor => {
                const rawScore = parseFloat(competitor.puan) || 0;
                totalNegativeScore += Math.abs(rawScore);
                content += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid #dc2626;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 4px;">${competitor.ad || 'Bilinmeyen Rakip'}</div>
                            <div style="font-size: 12px; color: #666;">📍 Mesafe: ${competitor.mesafe || 'Bilinmiyor'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: #dc2626;">
                                -${Math.abs(rawScore).toFixed(1)}/100
                            </div>
                            <div style="font-size: 10px; color: #888;">
                                (Negatif etki)
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += `
                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 12px;">
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">Hesaplama:</div>
                    <div style="font-size: 12px; color: #666;">
                        • Toplam Negatif Etki: -${totalNegativeScore.toFixed(1)}/100<br>
                        • Normalize Edilmiş Puan: ${Math.round(breakdownData.score || 0)}/100<br>
                        • <em>100 - (negatif etki) = final puan</em>
                    </div>
                </div>
            `;
        } else {
            content += `
                <div style="text-align: center; padding: 20px; color: #666; background: #f8f9fa; border-radius: 6px;">
                    <div style="font-size: 16px; margin-bottom: 8px;">🎉 Yakında rakip yok!</div>
                    <div style="font-size: 14px;">Bu lokasyon rekabet açısından çok iyi</div>
                </div>
            `;
        }
        
        content += `</div>`;
        return content;
    }
    
    createImportantPlacesDetail(breakdownData, rawBreakdown) {
        const places = [
            { key: 'metro', icon: '🚇', name: 'Metro İstasyonları' },
            { key: 'universite', icon: '🎓', name: 'Üniversiteler' },
            { key: 'avm', icon: '🛍️', name: 'AVM\'ler' }
        ];
        
        let content = `
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: bold; font-size: 16px;">Toplam Puan:</span>
                    <span style="font-size: 18px; font-weight: bold; color: ${this.getScoreColorHex(breakdownData.score)};">
                        ${Math.round(breakdownData.score || 0)}/100
                    </span>
                </div>
                <div style="font-size: 14px; color: #666;">
                    ${breakdownData.explanation || 'Önemli yerlere yakınlık puanı'}
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Yakındaki Önemli Yerler:</h3>
        `;
        
        places.forEach(place => {
            const placeData = rawBreakdown[place.key] || {};
            const details = placeData.details || [];
            const placeScore = breakdownData.details?.[`${place.key}_score`] || 0;
            
            content += `
                <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: bold;">${place.icon} ${place.name}</span>
                        <span style="font-weight: bold; color: ${this.getScoreColorHex(placeScore)};">
                            +${Math.round(placeScore)}/100
                        </span>
                    </div>
            `;
            
            if (details.length > 0) {
                details.forEach(item => {
                    const score = parseFloat(item.puan) || 0;
                    content += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: white; border-radius: 4px; margin-bottom: 4px;">
                            <div>
                                <div style="font-size: 14px; margin-bottom: 2px;">${item.ad || 'Bilinmeyen'}</div>
                                <div style="font-size: 12px; color: #666;">📍 ${item.mesafe || 'Mesafe bilinmiyor'}</div>
                            </div>
                            <div style="font-weight: bold; color: ${this.getScoreColorHex(Math.abs(score))};">
                                +${Math.abs(score).toFixed(1)}
                            </div>
                        </div>
                    `;
                });
            } else {
                content += `
                    <div style="text-align: center; padding: 12px; color: #666; font-size: 12px;">
                        Yakında ${place.name.toLowerCase()} bulunamadı
                    </div>
                `;
            }
            
            content += `</div>`;
        });
        
        content += `</div>`;
        return content;
    }
    
    createDemographicsDetail(breakdownData, rawBreakdown) {
        const details = breakdownData.details || {};
        
        let content = `
            <div style="background: #fefce8; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: bold; font-size: 16px;">Toplam Demografi Puanı:</span>
                    <span style="font-size: 18px; font-weight: bold; color: ${this.getScoreColorHex(breakdownData.score)};">
                        ${Math.round(breakdownData.score || 0)}/100
                    </span>
                </div>
                <div style="font-size: 14px; color: #666;">
                    ${breakdownData.explanation || 'Demografik uygunluk analizi'}
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Demografik Detaylar:</h3>
                
                <div style="display: grid; gap: 12px;">
                    <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #3b82f6;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: bold;">👥 Nüfus Yoğunluğu</span>
                            <span style="font-weight: bold; color: ${this.getScoreColorHex(details.population_density_score || 0)};">
                                +${Math.round(details.population_density_score || 0)}/100
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            Mahalle Nüfusu: ${details.population?.toLocaleString() || 'Bilinmiyor'} kişi
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #10b981;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: bold;">👶 Yaş Profili</span>
                            <span style="font-weight: bold; color: ${this.getScoreColorHex(details.age_score || 0)};">
                                ${details.age_score > 0 ? '+' : ''}${Math.round(details.age_score || 0)}/100
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            Profil: ${details.age_profile || 'Bilinmiyor'}
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #f59e0b;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: bold;">💰 Gelir Düzeyi</span>
                            <span style="font-weight: bold; color: ${this.getScoreColorHex(details.income_score || 0)};">
                                ${details.income_score > 0 ? '+' : ''}${Math.round(details.income_score || 0)}/100
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            Düzey: ${details.income_level || 'Bilinmiyor'}
                        </div>
                    </div>
                </div>
                
                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 12px;">
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">Hesaplama:</div>
                    <div style="font-size: 12px; color: #666;">
                        Nüfus Yoğunluğu (${Math.round(details.population_density_score || 0)}) + 
                        Yaş Profili (${Math.round(details.age_score || 0)}) + 
                        Gelir Düzeyi (${Math.round(details.income_score || 0)}) = 
                        <strong>${Math.round(breakdownData.score || 0)}/100</strong>
                    </div>
                </div>
            </div>
        `;
        
        return content;
    }
    
    displayPointResult(result, lat, lon) {
        // Clear existing markers
        this.markersLayer.clearLayers();
        
        // Create detailed popup content
        const popupContent = this.createDetailedPopup(result, lat, lon);
        
        // Add marker
        const marker = L.marker([lat, lon]).addTo(this.markersLayer);
        marker.bindPopup(popupContent, {
            maxWidth: 400,
            className: 'custom-popup'
        }).openPopup();
        
        // Update score display
        this.updateScoreDisplay(result);
        
        // Center map on point
        this.map.setView([lat, lon], 16);
    }
    
    setAnalysisMode(mode) {
        // CRITICAL: Set the current mode first
        this.currentMode = mode;
        console.log('Mode changed to:', mode); // Debug log
        
        // Update UI
        document.querySelectorAll('.analysis-mode-btn').forEach(btn => {
            btn.classList.remove('bg-primary/10', 'border', 'border-primary', 'text-primary');
            btn.classList.add('hover:bg-gray-50');
        });
        
        const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('bg-primary/10', 'border', 'border-primary', 'text-primary');
            activeBtn.classList.remove('hover:bg-gray-50');
        }
        
        // Show/hide relevant controls
        document.getElementById('point-controls').classList.toggle('hidden', mode !== 'point');
        document.getElementById('area-controls').classList.toggle('hidden', mode !== 'area');
        
        // Update view mode badge
        const badges = {
            point: 'Nokta Analizi',
            area: 'Bölge Analizi',
            heatmap: 'Isı Haritası Görünümü'
        };
        document.getElementById('view-mode-badge').textContent = badges[mode];
        
        // Clear existing layers
        this.clearLayers();
        
        // Initialize mode-specific features
        if (mode === 'heatmap') {
            this.updateHeatmap();
        }
        
        this.showToast('info', 'Mod Değişti', `${badges[mode]} moduna geçildi`);
    }
    
    setBusinessCategory(category) {
        console.log(`🏷️ Modern Dashboard - Category changed from ${this.currentCategory} to ${category}`);
        this.currentCategory = category;
        const config = this.categoryConfig[category];
        
        // Update category badge
        const badge = document.getElementById('category-badge');
        badge.textContent = `${config.emoji} ${config.name}`;
        
        // Clear existing results when category changes
        this.clearLayers();
        this.lastAnalysisResult = null;
        
        // Update heatmap if in heatmap mode
        if (this.currentMode === 'heatmap') {
            this.updateHeatmap();
        }
        
        this.showToast('info', 'Kategori Değişti', `${config.name} kategorisi seçildi - Yeni analiz için haritaya tıklayın`);
    }
    
    async runAnalysis() {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.showLoading(true);
        
        try {
            let result;
            
            switch (this.currentMode) {
                case 'point':
                    result = await this.runPointAnalysis();
                    break;
                case 'area':
                    result = await this.runAreaAnalysis();
                    break;
                case 'heatmap':
                    result = await this.updateHeatmap();
                    break;
            }
            
            if (result) {
                this.showToast('success', 'Analiz Tamamlandı', 'Lokasyon analizi başarıyla güncellendi');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showToast('error', 'Analiz Hatası', error.message || 'Analiz sırasında bir hata oluştu');
        } finally {
            this.isAnalyzing = false;
            this.showLoading(false);
        }
    }
    
    async runPointAnalysis() {
        const latInput = document.getElementById('point-lat');
        const lonInput = document.getElementById('point-lon');
        
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        
        if (isNaN(lat) || isNaN(lon)) {
            throw new Error('Geçerli koordinatlar girin');
        }
        
        return this.analyzePointDirectly(lat, lon);
    }
    
    async runAreaAnalysis() {
        const areaSelect = document.getElementById('target-area');
        const area = areaSelect.value;
        
        if (!area) {
            throw new Error('Bir mahalle seçin');
        }
        
        const response = await fetch(`/api/v8/mahalle_analizi/${encodeURIComponent(area)}/${this.currentCategory}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API hatası');
        }
        
        const result = await response.json();
        this.displayAreaResult(result);
        return result;
    }
    
    async updateHeatmap() {
        if (this.map.getZoom() < 14) {
            this.showToast('info', 'Yakınlaştırın', 'Isı haritası için daha fazla yakınlaştırın (zoom ≥ 14)');
            return;
        }
        
        const bounds = this.map.getBounds();
        
        const response = await fetch(`/api/v8/heatmap_data/${this.currentCategory}?` + new URLSearchParams({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        }));
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Heatmap verisi alınamadı');
        }
        
        const result = await response.json();
        this.displayHeatmap(result);
        return result;
    }
    
    displayAreaResult(result) {
        // Clear existing markers
        this.markersLayer.clearLayers();
        
        if (result.en_iyi_lokasyonlar && result.en_iyi_lokasyonlar.length > 0) {
            const markers = [];
            
            result.en_iyi_lokasyonlar.forEach((location, index) => {
                const marker = L.marker([location.lat, location.lon]).addTo(this.markersLayer);
                marker.bindPopup(`
                    <div class="text-center p-2">
                        <h4 class="font-bold mb-2">#${index + 1} - ${location.score}/100</h4>
                        <p class="text-sm">${location.address}</p>
                        <p class="text-lg">${location.emoji} ${location.category}</p>
                    </div>
                `);
                markers.push(marker);
            });
            
            // Fit map to show all markers
            if (markers.length > 0) {
                const group = new L.featureGroup(markers);
                this.map.fitBounds(group.getBounds().pad(0.1));
            }
        }
        
        // Update score display with area summary
        this.updateScoreDisplay({
            total_score: result.ortalama_skor,
            category: `${result.mahalle} Ortalaması`,
            breakdown: {
                total_locations: result.toplam_lokasyon,
                best_locations: result.en_iyi_lokasyonlar?.length || 0
            }
        });
    }
    
    displayHeatmap(result) {
        // Remove existing heatmap
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
        }
        
        if (result.heatmap_data && result.heatmap_data.length > 0) {
            this.heatmapLayer = L.heatLayer(result.heatmap_data, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                gradient: {
                    0.0: '#800026',  // Red (low score)
                    0.2: '#BD0026',
                    0.4: '#E31A1C',
                    0.6: '#FC4E2A',
                    0.8: '#FD8D3C',
                    1.0: '#FEB24C'   // Yellow-orange (high score)
                }
            }).addTo(this.map);
            
            this.showToast('success', 'Isı Haritası', `${result.total_points} nokta yüklendi`);
        } else {
            this.showToast('info', 'Veri Yok', 'Bu bölgede uygun lokasyon bulunamadı');
        }
    }
    
    updateScoreDisplay(result) {
        const scoreElement = document.getElementById('site-score');
        const breakdownElement = document.getElementById('score-breakdown');
        
        // Update main score
        const score = result.total_score || result.normalized_score || 0;
        scoreElement.textContent = Math.round(score);
        
        // Update score color based on value
        scoreElement.className = `text-5xl font-bold mb-1 ${
            score >= 80 ? 'text-green-600' :
            score >= 60 ? 'text-yellow-600' :
            score >= 40 ? 'text-orange-600' :
            'text-red-600'
        }`;
        
        // Update breakdown
        if (result.breakdown) {
            const breakdown = result.breakdown;
            const items = breakdownElement.querySelectorAll('.flex');
            
            if (items.length >= 4) {
                // Traffic
                if (breakdown.traffic) {
                    const trafficSpan = items[0].querySelector('span:last-child');
                    trafficSpan.textContent = this.getScoreLabel(breakdown.traffic.score);
                    trafficSpan.className = `text-sm font-medium ${this.getScoreColor(breakdown.traffic.score)}`;
                }
                
                // Competition
                if (breakdown.competitors) {
                    const compSpan = items[1].querySelector('span:last-child');
                    compSpan.textContent = this.getScoreLabel(breakdown.competitors.score);
                    compSpan.className = `text-sm font-medium ${this.getScoreColor(breakdown.competitors.score)}`;
                }
                
                // Demographics
                if (breakdown.demographics) {
                    const demoSpan = items[2].querySelector('span:last-child');
                    demoSpan.textContent = this.getScoreLabel(breakdown.demographics);
                    demoSpan.className = `text-sm font-medium ${this.getScoreColor(breakdown.demographics)}`;
                }
                
                // Accessibility (calculated from overall score)
                const accessSpan = items[3].querySelector('span:last-child');
                accessSpan.textContent = this.getScoreLabel(score);
                accessSpan.className = `text-sm font-medium ${this.getScoreColor(score)}`;
            }
        }
    }
    
    getScoreLabel(score) {
        if (score >= 80) return 'Mükemmel';
        if (score >= 60) return 'İyi';
        if (score >= 40) return 'Orta';
        if (score >= 20) return 'Düşük';
        return 'Zayıf';
    }
    
    getScoreColor(score) {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    }
    
    // Show detailed analysis in a modal
    showDetailedAnalysis(lat, lon) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 24px; max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: bold;">📊 Detaylı Lokasyon Analizi</h2>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; font-weight: bold; color: #3b82f6; margin-bottom: 8px;">
                        ${Math.round(this.lastAnalysisResult?.total_score || this.lastAnalysisResult?.normalized_score || 0)}
                    </div>
                    <div style="font-size: 18px; color: #6b7280;">100 üzerinden</div>
                    <div style="font-size: 14px; color: #9ca3af; margin-top: 4px;">
                        Koordinatlar: ${lat.toFixed(6)}, ${lon.toFixed(6)}
                    </div>
                </div>
                
                <div id="detailed-analysis-content">
                    ${this.createDetailedAnalysisContent(this.lastAnalysisResult || {})}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    createDetailedAnalysisContent(result) {
        const breakdown = result.breakdown || {};
        
        return `
            <div style="display: grid; gap: 16px;">
                <!-- Score Breakdown -->
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Puan Dağılımı</h3>
                    <div style="display: grid; gap: 8px;">
                        ${breakdown.traffic ? `
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: white; border-radius: 4px;">
                                <span>🚶 Yaya Trafiği</span>
                                <span style="font-weight: bold;">${Math.round(breakdown.traffic.score || 0)} puan</span>
                            </div>
                        ` : ''}
                        ${breakdown.competitors ? `
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: white; border-radius: 4px;">
                                <span>🏪 Rakip Durumu</span>
                                <span style="font-weight: bold;">${Math.round(breakdown.competitors.score || 0)} puan</span>
                            </div>
                        ` : ''}
                        ${breakdown.demographics ? `
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: white; border-radius: 4px;">
                                <span>👥 Demografi</span>
                                <span style="font-weight: bold;">${Math.round(breakdown.demographics || 0)} puan</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Distance Analysis -->
                <div style="background: #f0f9ff; padding: 16px; border-radius: 8px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Mesafe Analizi</h3>
                    <div style="display: grid; gap: 6px; font-size: 14px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>🏥 En Yakın Hastane:</span>
                            <span style="font-weight: bold;">${this.calculateDistance(breakdown.hospital_distance) || 'Bilinmiyor'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>🚇 En Yakın Metro:</span>
                            <span style="font-weight: bold;">${this.calculateDistance(breakdown.metro_distance) || 'Bilinmiyor'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>🛒 En Yakın Market:</span>
                            <span style="font-weight: bold;">${this.calculateDistance(breakdown.market_distance) || 'Bilinmiyor'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>🏪 En Yakın Rakip:</span>
                            <span style="font-weight: bold;">${this.calculateDistance(breakdown.competitors?.distance) || 'Bilinmiyor'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Recommendations -->
                <div style="background: #f0fdf4; padding: 16px; border-radius: 8px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">💡 Öneriler</h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                        ${this.generateRecommendations(result)}
                    </ul>
                </div>
            </div>
        `;
    }
    
    generateRecommendations(result) {
        const score = result.total_score || result.normalized_score || 0;
        const breakdown = result.breakdown || {};
        let recommendations = [];
        
        if (score >= 80) {
            recommendations.push('<li>Bu lokasyon mükemmel bir seçim! Hemen harekete geçebilirsiniz.</li>');
        } else if (score >= 60) {
            recommendations.push('<li>Bu lokasyon iyi bir potansiyele sahip.</li>');
        } else {
            recommendations.push('<li>Bu lokasyonu tekrar değerlendirmenizi öneririz.</li>');
        }
        
        if (breakdown.competitors && breakdown.competitors.score < 0) {
            recommendations.push('<li>Rakip yoğunluğu yüksek. Farklılaşma stratejileri geliştirin.</li>');
        }
        
        if (breakdown.traffic && breakdown.traffic.score > 50) {
            recommendations.push('<li>Yaya trafiği yeterli seviyede.</li>');
        }
        
        return recommendations.join('');
    }
    
    async exportPointReport(lat, lon) {
        this.showToast('info', 'Rapor Hazırlanıyor', 'Detaylı rapor hazırlanıyor...');
        
        try {
            // Get the analysis result
            const result = this.lastAnalysisResult;
            if (!result) {
                throw new Error('Önce analiz yapmanız gerekiyor');
            }
            
            // Generate HTML report
            const reportHtml = this.generateReportHtml(result, lat, lon);
            
            // Create and download the report
            this.downloadHtmlReport(reportHtml, `lokasyon-raporu-${lat.toFixed(4)}-${lon.toFixed(4)}.html`);
            
            this.showToast('success', 'Rapor Hazırlandı', 'Rapor başarıyla indirildi!');
            
        } catch (error) {
            console.error('Report generation error:', error);
            this.showToast('error', 'Rapor Hatası', error.message || 'Rapor oluşturulurken hata oluştu');
        }
    }
    
    generateReportHtml(result, lat, lon) {
        const score = result.total_score || result.normalized_score || 0;
        const breakdown = result.breakdown || {};
        const config = this.categoryConfig[this.currentCategory];
        
        return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocationIQ Pro - Lokasyon Analiz Raporu</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .score-display {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .score-number {
            font-size: 64px;
            font-weight: bold;
            color: ${this.getScoreColorHex(score)};
            margin: 0;
        }
        .score-label {
            font-size: 18px;
            color: #6c757d;
            margin: 5px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .info-item strong {
            display: block;
            color: #495057;
            margin-bottom: 5px;
        }
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin: 8px 0;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid ${this.getScoreColorHex(score)};
        }
        .distance-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .distance-table th,
        .distance-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        .distance-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #495057;
        }
        .recommendations {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
        }
        .recommendations h3 {
            color: #155724;
            margin-top: 0;
        }
        .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin: 8px 0;
            color: #155724;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
        }
        @media print {
            body { background: white; }
            .card { box-shadow: none; border: 1px solid #dee2e6; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 LocationIQ Pro</h1>
        <div class="subtitle">Lokasyon Analiz Raporu</div>
        <div style="margin-top: 15px; font-size: 14px;">
            Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
        </div>
    </div>

    <div class="card">
        <h2 style="margin-top: 0; color: #495057;">📍 Lokasyon Bilgileri</h2>
        <div class="info-grid">
            <div class="info-item">
                <strong>Koordinatlar</strong>
                Enlem: ${lat.toFixed(6)}<br>
                Boylam: ${lon.toFixed(6)}
            </div>
            <div class="info-item">
                <strong>İşletme Kategorisi</strong>
                ${config.emoji} ${config.name}
            </div>
            <div class="info-item">
                <strong>Mahalle</strong>
                ${result.mahalle || 'Bilinmeyen Mahalle'}
            </div>
            <div class="info-item">
                <strong>Analiz Tarihi</strong>
                ${new Date().toLocaleDateString('tr-TR')}
            </div>
        </div>
    </div>

    <div class="card">
        <h2 style="margin-top: 0; color: #495057;">📊 Genel Değerlendirme</h2>
        <div class="score-display">
            <div class="score-number">${Math.round(score)}</div>
            <div class="score-label">100 üzerinden</div>
            <div style="font-size: 24px; margin-top: 10px;">
                ${result.emoji || '📍'} ${result.category || 'Lokasyon Analizi'}
            </div>
        </div>
    </div>

    ${breakdown.traffic || breakdown.competitors || breakdown.demographics ? `
    <div class="card">
        <h2 style="margin-top: 0; color: #495057;">📈 Puan Detayları</h2>
        ${breakdown.traffic ? `
        <div class="breakdown-item">
            <span>🚶 Yaya Trafiği</span>
            <strong style="color: ${this.getScoreColorHex(breakdown.traffic.score)};">
                ${Math.round(breakdown.traffic.score || 0)} puan
            </strong>
        </div>
        ` : ''}
        ${breakdown.competitors ? `
        <div class="breakdown-item">
                                    <span>🏪 Rekabet Analizi</span>
            <strong style="color: ${this.getScoreColorHex(breakdown.competitors.score)};">
                ${Math.round(breakdown.competitors.score || 0)} puan
            </strong>
        </div>
        ` : ''}
        ${breakdown.demographics ? `
        <div class="breakdown-item">
            <span>👥 Demografi</span>
            <strong style="color: ${this.getScoreColorHex(breakdown.demographics)};">
                ${Math.round(breakdown.demographics || 0)} puan
            </strong>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="card">
        <h2 style="margin-top: 0; color: #495057;">📏 Mesafe Analizi</h2>
        <table class="distance-table">
            <thead>
                <tr>
                    <th>Tesis Türü</th>
                    <th>En Yakın Mesafe</th>
                    <th>Değerlendirme</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>🏥 Hastane</td>
                    <td>${this.calculateDistance(breakdown.hospital_distance) || 'Bilinmiyor'}</td>
                    <td>${this.getDistanceEvaluation(breakdown.hospital_distance, 'hospital')}</td>
                </tr>
                <tr>
                    <td>🚇 Metro İstasyonu</td>
                    <td>${this.calculateDistance(breakdown.metro_distance) || 'Bilinmiyor'}</td>
                    <td>${this.getDistanceEvaluation(breakdown.metro_distance, 'metro')}</td>
                </tr>
                <tr>
                    <td>🛒 Market</td>
                    <td>${this.calculateDistance(breakdown.market_distance) || 'Bilinmiyor'}</td>
                    <td>${this.getDistanceEvaluation(breakdown.market_distance, 'market')}</td>
                </tr>
                <tr>
                    <td>🏪 Rakip İşletme</td>
                    <td>${this.calculateDistance(breakdown.competitors?.distance) || 'Bilinmiyor'}</td>
                    <td>${this.getDistanceEvaluation(breakdown.competitors?.distance, 'competitor')}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="card">
        <div class="recommendations">
            <h3>💡 Öneriler ve Değerlendirme</h3>
            <ul>
                ${this.generateRecommendations(result)}
            </ul>
            
            <h4 style="color: #155724; margin-top: 20px;">📋 Sonuç</h4>
            <p style="color: #155724; font-weight: bold;">
                ${this.getFinalRecommendation(score)}
            </p>
        </div>
    </div>

    <div class="footer">
        <p><strong>LocationIQ Pro</strong> - Gelişmiş Lokasyon Analizi</p>
        <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde otomatik olarak oluşturulmuştur.</p>
        <p style="font-size: 12px; margin-top: 10px;">
            Koordinatlar: ${lat.toFixed(6)}, ${lon.toFixed(6)} | 
            Kategori: ${config.name} | 
            Skor: ${Math.round(score)}/100
        </p>
    </div>
</body>
</html>
        `;
    }
    
    getDistanceEvaluation(distance, type) {
        if (!distance) return 'Veri yok';
        
        const evaluations = {
            hospital: {
                excellent: 500,
                good: 1000,
                fair: 2000
            },
            metro: {
                excellent: 300,
                good: 600,
                fair: 1200
            },
            market: {
                excellent: 200,
                good: 500,
                fair: 1000
            },
            competitor: {
                excellent: 500, // For competitors, closer is worse
                good: 300,
                fair: 100
            }
        };
        
        const eval_data = evaluations[type];
        if (!eval_data) return 'Değerlendirilemedi';
        
        if (type === 'competitor') {
            // For competitors, reverse logic
            if (distance >= eval_data.excellent) return '✅ Mükemmel';
            if (distance >= eval_data.good) return '👍 İyi';
            if (distance >= eval_data.fair) return '⚠️ Orta';
            return '❌ Zayıf';
        } else {
            // For services, closer is better
            if (distance <= eval_data.excellent) return '✅ Mükemmel';
            if (distance <= eval_data.good) return '👍 İyi';
            if (distance <= eval_data.fair) return '⚠️ Orta';
            return '❌ Uzak';
        }
    }
    
    getFinalRecommendation(score) {
        if (score >= 80) {
            return 'Bu lokasyon işletmeniz için mükemmel bir seçim! Güvenle yatırım yapabilirsiniz.';
        } else if (score >= 60) {
            return 'Bu lokasyon iyi bir potansiyele sahip. Dikkatli planlama ile başarılı olabilirsiniz.';
        } else if (score >= 40) {
            return 'Bu lokasyon orta düzeyde risk taşıyor. Ek araştırma yapmanızı öneririz.';
        } else {
            return 'Bu lokasyon yüksek risk taşıyor. Alternatif lokasyonları değerlendirmenizi öneririz.';
        }
    }
    
    downloadHtmlReport(htmlContent, filename) {
        // Create blob with HTML content
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(link.href);
    }
    
    clearLayers() {
        if (this.markersLayer) {
            this.markersLayer.clearLayers();
        }
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
            this.heatmapLayer = null;
        }
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    showToast(type, title, message, duration = 4000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
        };
        
        toast.className = `max-w-sm p-4 rounded-lg shadow-lg border-l-4 ${colors[type]} transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="font-medium text-sm mb-1">${title}</h4>
                    <p class="text-sm">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-400 hover:text-gray-600">
                    ×
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    updateUI() {
        // Update category badge
        const config = this.categoryConfig[this.currentCategory];
        document.getElementById('category-badge').textContent = `${config.emoji} ${config.name}`;
        
        // Set initial analysis mode
        this.setAnalysisMode(this.currentMode);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.locationAnalyzer = new ModernLocationAnalyzer();
});

// Global functions for compatibility
function setAnalysisMode(mode) {
    if (window.locationAnalyzer) {
        window.locationAnalyzer.setAnalysisMode(mode);
    }
}

function runAnalysis() {
    if (window.locationAnalyzer) {
        window.locationAnalyzer.runAnalysis();
    }
}