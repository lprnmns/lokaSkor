// Akıllı Lokasyon Danışmanı - Ana JavaScript

// Özel hata sınıfları
class ApiError extends Error {
    constructor(message, responseData = null) {
        super(message);
        this.name = 'ApiError';
        this.responseData = responseData;
        this.timestamp = new Date().toISOString();
    }
}

class ValidationError extends Error {
    constructor(message, missingFields = []) {
        super(message);
        this.name = 'ValidationError';
        this.missingFields = missingFields;
        this.timestamp = new Date().toISOString();
    }
}

class NetworkError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

class LocationAnalyzer {
    constructor() {
        this.map = null;
        this.currentMode = 'point';
        this.poiLayers = {};
        this.heatmapLayer = null;
        this.topLocationsMarkers = [];
        this.mahalleler = [];
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.loadMahalleler();
        this.setupEventListeners();
    }
    
    initMap() {
        // Yenimahalle merkezi koordinatları
        this.map = L.map('map').setView([39.9334, 32.8597], 12);
        
        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Harita tıklama olayı (sadece nokta analizi modunda)
        this.map.on('click', (e) => {
            if (this.currentMode === 'point') {
                this.analyzePoint(e.latlng.lat, e.latlng.lng);
            }
        });
        
        // Zoom değişikliği olayı (ısı haritası için)
        this.map.on('zoomend', () => {
            if (this.currentMode === 'heatmap') {
                this.updateHeatmap();
            }
        });
    }
    
    async loadMahalleler() {
        try {
            // Mahalle listesini yükle (örnek veriler)
            this.mahalleler = [
                'Demetevler Mahallesi', 'Yeşilevler Mahallesi', 'Pamuklar Mahallesi',
                'Kentkoop Mahallesi', 'Gayret Mahallesi', 'Yeniçağ Mahallesi',
                'Demetlale Mahallesi', 'Macun Mahallesi', 'Özevler Mahallesi',
                'Çamlıca Mahallesi', 'Turgut Özal Mahallesi', '25 Mart Mahallesi'
            ];
            
            const mahalleSelect = document.getElementById('mahalle-select');
            this.mahalleler.forEach(mahalle => {
                const option = document.createElement('option');
                option.value = mahalle;
                option.textContent = mahalle;
                mahalleSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Mahalle listesi yüklenemedi:', error);
        }
    }
    
    setupEventListeners() {
        // Kategori değişikliği
        document.getElementById('business-type').addEventListener('change', () => {
            if (this.currentMode === 'heatmap') {
                this.updateHeatmap();
            }
        });
    }
    
    setMode(mode) {
        // Önceki modu temizle
        this.clearMode();
        
        // Yeni modu ayarla
        this.currentMode = mode;
        
        // Mode butonlarını güncelle
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`mode-${mode}`).classList.add('active');
        
        // Mode özel kontrolleri göster/gizle
        const areaControls = document.getElementById('area-controls');
        const resultDisplay = document.getElementById('result-display');
        
        if (mode === 'area') {
            areaControls.classList.remove('hidden');
            resultDisplay.classList.add('hidden');
        } else if (mode === 'point') {
            areaControls.classList.add('hidden');
            resultDisplay.classList.remove('hidden');
        } else if (mode === 'heatmap') {
            areaControls.classList.add('hidden');
            resultDisplay.classList.add('hidden');
            this.updateHeatmap();
        }
    }
    
    clearMode() {
        // Isı haritasını temizle
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
            this.heatmapLayer = null;
        }
        
        // En iyi lokasyon marker'larını temizle
        this.topLocationsMarkers.forEach(marker => this.map.removeLayer(marker));
        this.topLocationsMarkers = [];
        
        // Top locations listesini gizle
        document.getElementById('top-locations').classList.add('hidden');
    }
    
    // API yanıt doğrulama fonksiyonu
    validateApiResponse(response) {
        const requiredFields = ['total_score', 'category', 'emoji', 'color'];
        const missingFields = [];
        
        // Gerekli alanları kontrol et
        for (const field of requiredFields) {
            if (response[field] === undefined || response[field] === null || response[field] === '') {
                missingFields.push(field);
            }
        }
        
        // Mahalle alanını ayrıca kontrol et (opsiyonel ama önemli)
        if (!response.mahalle && !response.error) {
            console.warn('API Response: mahalle field is missing but not critical');
        }
        
        const isValid = missingFields.length === 0;
        
        // Doğrulama sonucunu logla
        if (!isValid) {
            console.error('API Response Validation Failed:', {
                missingFields: missingFields,
                receivedResponse: response
            });
        } else {
            console.log('API Response Validation Passed:', {
                score: response.total_score,
                category: response.category,
                mahalle: response.mahalle || 'N/A'
            });
        }
        
        return {
            isValid: isValid,
            missingFields: missingFields,
            errorMessage: isValid ? null : `Eksik alanlar: ${missingFields.join(', ')}`
        };
    }
    
    async analyzePoint(lat, lon) {
        const kategori = document.getElementById('business-type').value;
        
        try {
            this.showStatusMessage('Nokta analiz ediliyor...', 'info');
            
            // API isteği parametrelerini logla
            console.log('API Request:', { lat, lon, kategori });
            
            // Timeout ile API çağrısı (10 saniye)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('/api/v5/score_point', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lat, lon, kategori }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Yanıt durumunu kontrol et
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Response:', errorData);
                throw new ApiError(errorData.error || `HTTP ${response.status}: ${response.statusText}`, errorData);
            }
            
            const result = await response.json();
            console.log('API Response:', result);
            
            // API hatası kontrolü
            if (result.error) {
                throw new ApiError(result.error, result);
            }
            
            // Yanıt yapısını doğrula
            const validation = this.validateApiResponse(result);
            if (!validation.isValid) {
                throw new ValidationError(validation.errorMessage, validation.missingFields);
            }
            
            // Sonuçları göster
            this.displayPointResult(result, lat, lon);
            
        } catch (error) {
            this.handleAnalysisError(error, lat, lon);
        }
    }
    
    handleAnalysisError(error, lat, lon) {
        console.error('Nokta analizi hatası:', {
            error: error,
            location: { lat, lon },
            timestamp: new Date().toISOString()
        });
        
        let userMessage = 'Analiz sırasında bir hata oluştu.';
        
        if (error.name === 'AbortError') {
            userMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error instanceof ApiError) {
            userMessage = error.message;
            if (error.responseData && error.responseData.suggestion) {
                userMessage += ` ${error.responseData.suggestion}`;
            }
        } else if (error instanceof ValidationError) {
            userMessage = 'Sunucudan geçersiz yanıt alındı. Lütfen tekrar deneyin.';
            console.error('Eksik alanlar:', error.missingFields);
        } else if (error instanceof NetworkError || error.name === 'TypeError') {
            userMessage = 'Ağ bağlantısı sorunu. İnternet bağlantınızı kontrol edin.';
        }
        
        this.showStatusMessage(userMessage, 'error');
    }
    
    displayPointResult(result, lat, lon) {
        // Veri doğrulama ve yedek değerler
        const score = result.total_score || result.normalized_score || 0;
        const category = result.category || 'Bilinmeyen';
        const emoji = result.emoji || '❓';
        const color = result.color || '#6c757d';
        const mahalle = result.mahalle || 'Bilinmeyen Mahalle';
        
        // Başarılı sonuç logla
        console.log('Displaying Point Result:', {
            score: score,
            category: category,
            emoji: emoji,
            mahalle: mahalle,
            originalResult: result
        });
        
        // Haritada marker ekle
        const marker = L.marker([lat, lon]).addTo(this.map);
        marker.bindPopup(`
            <div style="text-align: center;">
                <h4>${emoji} ${category}</h4>
                <p><strong>${score}/100</strong></p>
                <p style="font-size: 12px;">${mahalle}</p>
            </div>
        `).openPopup();
        
        // Sidebar'da sonuçları göster - null kontrolü ile
        const scoreElement = document.getElementById('score-number');
        const categoryElement = document.getElementById('score-category');
        const detailsElement = document.getElementById('score-details');
        
        if (scoreElement) {
            scoreElement.textContent = `${score}/100`;
            scoreElement.style.color = color;
        }
        
        if (categoryElement) {
            categoryElement.textContent = `${emoji} ${category}`;
        }
        
        if (detailsElement) {
            detailsElement.textContent = mahalle;
        }
        
        const resultDisplay = document.getElementById('result-display');
        if (resultDisplay) {
            resultDisplay.classList.remove('hidden');
        }
        
        this.showStatusMessage(`Analiz tamamlandı: ${category}`, 'success');
    }
    
    async analyzeArea() {
        const mahalle = document.getElementById('mahalle-select').value;
        const kategori = document.getElementById('business-type').value;
        
        if (!mahalle) {
            this.showStatusMessage('Lütfen bir mahalle seçin', 'error');
            return;
        }
        
        try {
            this.showStatusMessage('Mahalle analiz ediliyor...', 'info');
            
            const response = await fetch(`/api/v8/mahalle_analizi/${encodeURIComponent(mahalle)}/${kategori}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Mahalle analizi başarısız');
            }
            
            this.displayTopLocations(result.en_iyi_lokasyonlar);
            this.showStatusMessage(result.analiz_ozeti, 'success');
            
        } catch (error) {
            console.error('Mahalle analizi hatası:', error);
            this.showStatusMessage(`Hata: ${error.message}`, 'error');
        }
    }
    
    displayTopLocations(locations) {
        // Önceki marker'ları temizle
        this.topLocationsMarkers.forEach(marker => this.map.removeLayer(marker));
        this.topLocationsMarkers = [];
        
        // Yeni marker'ları ekle
        locations.forEach((location, index) => {
            const marker = L.marker([location.lat, location.lon]).addTo(this.map);
            
            marker.bindPopup(`
                <div style="text-align: center;">
                    <h4>#${index + 1} - ${location.score}/100</h4>
                    <p>${location.address}</p>
                    <p>${location.emoji} ${location.category}</p>
                </div>
            `);
            
            this.topLocationsMarkers.push(marker);
        });
        
        // Liste görünümünü güncelle
        const listContainer = document.getElementById('top-locations');
        listContainer.innerHTML = locations.map((location, index) => `
            <div class="location-item" onclick="locationAnalyzer.focusLocation(${location.lat}, ${location.lon})">
                <div class="location-score" style="color: ${location.color};">
                    #${index + 1} - ${location.score}/100 ${location.emoji}
                </div>
                <div class="location-details">${location.address}</div>
            </div>
        `).join('');
        
        listContainer.classList.remove('hidden');
        
        // Haritayı tüm lokasyonları gösterecek şekilde ayarla
        if (this.topLocationsMarkers.length > 0) {
            const group = new L.featureGroup(this.topLocationsMarkers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
        
        this.showStatusMessage(`${locations.length} en iyi lokasyon bulundu`, 'success');
    }
    
    focusLocation(lat, lon) {
        this.map.setView([lat, lon], 16);
        
        // İlgili marker'ı bul ve popup'ını aç
        this.topLocationsMarkers.forEach(marker => {
            if (Math.abs(marker.getLatLng().lat - lat) < 0.001 && 
                Math.abs(marker.getLatLng().lng - lon) < 0.001) {
                marker.openPopup();
            }
        });
    }
    
    async updateHeatmap() {
        const zoom = this.map.getZoom();
        
        if (zoom < 14) {
            // Zoom seviyesi düşükse ısı haritasını gizle
            if (this.heatmapLayer) {
                this.map.removeLayer(this.heatmapLayer);
                this.heatmapLayer = null;
            }
            this.showStatusMessage('Isı haritası için daha fazla yakınlaştırın (zoom ≥ 14)', 'info');
            return;
        }
        
        try {
            const kategori = document.getElementById('business-type').value;
            const bounds = this.map.getBounds();
            
            this.showStatusMessage('Isı haritası yükleniyor...', 'info');
            
            // Gerçek API'den heatmap verisi al
            const response = await fetch(`/api/v8/heatmap_data/${kategori}?` + new URLSearchParams({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            }));
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Heatmap verisi alınamadı');
            }
            
            // Önceki ısı haritasını kaldır
            if (this.heatmapLayer) {
                this.map.removeLayer(this.heatmapLayer);
            }
            
            if (result.heatmap_data && result.heatmap_data.length > 0) {
                // Yeni ısı haritası ekle
                this.heatmapLayer = L.heatLayer(result.heatmap_data, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 17,
                    gradient: {
                        0.0: '#800026',  // Kırmızı (düşük puan)
                        0.2: '#BD0026',
                        0.4: '#E31A1C',
                        0.6: '#FC4E2A',
                        0.8: '#FD8D3C',
                        1.0: '#FEB24C'   // Sarı-turuncu (yüksek puan)
                    }
                }).addTo(this.map);
                
                this.showStatusMessage(`Isı haritası güncellendi (${result.total_points} nokta)`, 'success');
            } else {
                this.showStatusMessage('Bu bölgede uygun lokasyon bulunamadı', 'info');
            }
            
        } catch (error) {
            console.error('Isı haritası hatası:', error);
            this.showStatusMessage(`Isı haritası hatası: ${error.message}`, 'error');
        }
    }
    
    async togglePOI(poiType) {
        const checkbox = document.getElementById(`toggle-${poiType}`);
        
        if (checkbox.checked) {
            // POI layer'ını yükle ve göster
            await this.loadPOILayer(poiType);
        } else {
            // POI layer'ını gizle
            this.hidePOILayer(poiType);
        }
    }
    
    async loadPOILayer(poiType) {
        try {
            if (this.poiLayers[poiType]) {
                // Zaten yüklü, sadece göster
                this.map.addLayer(this.poiLayers[poiType]);
                return;
            }
            
            this.showStatusMessage(`${poiType} verileri yükleniyor...`, 'info');
            
            const response = await fetch(`/api/v5/get_locations/${poiType}`);
            const locations = await response.json();
            
            if (!response.ok) {
                throw new Error('POI verileri yüklenemedi');
            }
            
            // POI marker'larını oluştur
            const markers = [];
            locations.forEach(location => {
                // Koordinat sütun isimlerini kontrol et
                const lat = location.lat || location.enlem;
                const lon = location.lon || location.lng || location.boylam;
                
                if (lat && lon) {
                    const marker = L.marker([lat, lon]);
                    marker.bindPopup(`
                        <div>
                            <h4>${location.name || location.ad || location.isim || poiType}</h4>
                            <p>${location.address || location.adres || 'Adres bilgisi yok'}</p>
                        </div>
                    `);
                    markers.push(marker);
                }
            });
            
            // Layer group oluştur ve haritaya ekle
            this.poiLayers[poiType] = L.layerGroup(markers);
            this.map.addLayer(this.poiLayers[poiType]);
            
            this.showStatusMessage(`${markers.length} ${poiType} yüklendi`, 'success');
            
        } catch (error) {
            console.error(`${poiType} POI yükleme hatası:`, error);
            this.showStatusMessage(`${poiType} verileri yüklenemedi: ${error.message}`, 'error');
            
            // Checkbox'ı geri al
            document.getElementById(`toggle-${poiType}`).checked = false;
        }
    }
    
    hidePOILayer(poiType) {
        if (this.poiLayers[poiType]) {
            this.map.removeLayer(this.poiLayers[poiType]);
        }
    }
    
    async enableAllGrids() {
        try {
            this.showStatusMessage('Tüm gridler aktif ediliyor...', 'info');
            
            const response = await fetch('/api/v7/enable_all_grids', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Grid aktivasyonu başarısız');
            }
            
            this.showStatusMessage(result.message, 'success');
            
        } catch (error) {
            console.error('Grid aktivasyon hatası:', error);
            this.showStatusMessage(`Hata: ${error.message}`, 'error');
        }
    }
    
    clearMap() {
        // Tüm layer'ları temizle
        Object.values(this.poiLayers).forEach(layer => {
            this.map.removeLayer(layer);
        });
        this.poiLayers = {};
        
        // Checkbox'ları temizle
        document.querySelectorAll('.poi-toggle input').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Mode'u temizle
        this.clearMode();
        
        // Sonuç display'ini gizle
        document.getElementById('result-display').classList.add('hidden');
        
        this.showStatusMessage('Harita temizlendi', 'success');
    }
    
    showStatusMessage(message, type) {
        // Console'da göster
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        switch (type) {
            case 'success':
                toast.style.background = '#28a745';
                break;
            case 'error':
                toast.style.background = '#dc3545';
                break;
            case 'info':
                toast.style.background = '#17a2b8';
                break;
            default:
                toast.style.background = '#6c757d';
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 4 saniye sonra kaldır
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 4000);
    }
}

// Global functions for HTML onclick handlers
function setMode(mode) {
    locationAnalyzer.setMode(mode);
}

function togglePOI(poiType) {
    locationAnalyzer.togglePOI(poiType);
}

function analyzeArea() {
    locationAnalyzer.analyzeArea();
}

function enableAllGrids() {
    locationAnalyzer.enableAllGrids();
}

function clearMap() {
    locationAnalyzer.clearMap();
}

// Initialize location analyzer when page loads
let locationAnalyzer;
document.addEventListener('DOMContentLoaded', () => {
    locationAnalyzer = new LocationAnalyzer();
});