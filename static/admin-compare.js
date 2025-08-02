// --- admin-compare.js (Parametre Optimizasyon Sistemi) ---

// Harita oluşturma fonksiyonu
function createMap(containerId) {
    const map = L.map(containerId, { zoomControl: false }).setView([39.96, 32.75], 12);
    
    // Uydu katmanı
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { 
        attribution: 'Tiles &copy; Esri' 
    }).addTo(map);
    
    // Etiket katmanı
    map.createPane('labels');
    map.getPane('labels').style.zIndex = 650;
    map.getPane('labels').style.pointerEvents = 'none';
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { 
        attribution: '&copy; CARTO', 
        pane: 'labels' 
    }).addTo(map);
    
    // Zoom kontrolü sağ üstte
    L.control.zoom({ position: 'topright' }).addTo(map);
    
    return map;
}

// Haritaları oluştur
const mapA = createMap('mapA');
const mapB = createMap('mapB');

// Harita senkronizasyonu kaldırıldı - her harita bağımsız

// Global değişkenler
let currentComparison = {};
const kategori = 'eczane'; // Şimdilik sabit, ileride dinamik yapılabilir
let markerA = null;
let markerB = null;

// POI katmanları
const poiLayerA = L.featureGroup().addTo(mapA);
const poiLayerB = L.featureGroup().addTo(mapB);

// Emoji haritası
const emoji_map = { 
    'hastane': '🏥', 
    'eczane': '💊', 
    'avm': '🛍️', 
    'metro': '🚇', 
    'universite': '🎓' 
};

// Tüm POI'ları yükle
function loadAllPois() {
    console.log("POI'lar yükleniyor...");
    
    // Önceki POI'ları temizle
    poiLayerA.clearLayers();
    poiLayerB.clearLayers();
    
    const poiTypes = ['hastane', 'eczane', 'avm', 'metro', 'universite'];
    
    poiTypes.forEach(poiType => {
        fetch(`/api/v5/get_locations/${poiType}`)
            .then(response => response.json())
            .then(locations => {
                locations.forEach(location => {
                    const emojiIcon = L.divIcon({ 
                        html: emoji_map[poiType] || '📍', 
                        className: 'emoji-icon',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    
                    const popupContent = `<b>${poiType.toUpperCase()}</b><br>${location.isim}`;
                    
                    // Her iki haritaya da ekle
                    L.marker([location.enlem, location.boylam], { icon: emojiIcon })
                        .bindPopup(popupContent)
                        .addTo(poiLayerA);
                        
                    L.marker([location.enlem, location.boylam], { icon: emojiIcon })
                        .bindPopup(popupContent)
                        .addTo(poiLayerB);
                });
            })
            .catch(error => {
                console.error(`${poiType} POI'ları yüklenirken hata:`, error);
            });
    });
}

// Yeni karşılaştırma çifti al
function getNewPair() {
    // Loading durumunu göster
    document.body.style.cursor = 'wait';
    document.getElementById('detailsA').innerHTML = '<div class="loading">Yeni nokta çifti yükleniyor</div>';
    document.getElementById('detailsB').innerHTML = '<div class="loading">Yeni nokta çifti yükleniyor</div>';
    
    fetch(`/api/v6/get_comparison_pair/${kategori}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Hata: ${data.error}`);
                return;
            }
            
            currentComparison = data;
            updateUI(data);
            document.body.style.cursor = 'default';
        })
        .catch(error => {
            console.error('Karşılaştırma çifti alınırken hata:', error);
            alert('Karşılaştırma çifti alınırken hata oluştu');
            document.body.style.cursor = 'default';
        });
}

// Arayüzü güncelle
function updateUI(data) {
    // Önceki markerları temizle
    if (markerA) { mapA.removeLayer(markerA); }
    if (markerB) { mapB.removeLayer(markerB); }

    // Nokta A için arayüzü güncelle
    const noktaA = data.nokta_A;
    const customIconA = L.divIcon({
        html: '<div style="background: #007bff; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">A</div>',
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    markerA = L.marker([noktaA.lat, noktaA.lon], { icon: customIconA }).addTo(mapA);
    mapA.setView([noktaA.lat, noktaA.lon], 16);
    updateDetailsPanel('A', noktaA);

    // Nokta B için arayüzü güncelle
    const noktaB = data.nokta_B;
    const customIconB = L.divIcon({
        html: '<div style="background: #dc3545; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">B</div>',
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    markerB = L.marker([noktaB.lat, noktaB.lon], { icon: customIconB }).addTo(mapB);
    mapB.setView([noktaB.lat, noktaB.lon], 16);
    updateDetailsPanel('B', noktaB);

    // Senkronizasyonu kaldır - her harita bağımsız olsun
    // mapA.sync(mapB);
    // mapB.sync(mapA);
}

// Detay panelini güncelle
function updateDetailsPanel(panelId, noktaData) {
    const detailsDiv = document.getElementById(`details${panelId}`);
    
    let detailsHtml = `
        <div class="mahalle-info">📍 ${noktaData.mahalle}</div>
        <div class="score-display ${noktaData.total_score < 0 ? 'score-negative' : ''}">
            Skor: ${noktaData.total_score.toFixed(1)}
        </div>
        <h3>Puan Detayları</h3>
        <ul>
    `;
    
    // Puan detaylarını ekle
    if (noktaData.breakdown && Object.keys(noktaData.breakdown).length > 0) {
        for (const [key, value] of Object.entries(noktaData.breakdown)) {
            detailsHtml += `<li><strong>${key}:</strong> ${value.toplam_puan}</li>`;
        }
    } else {
        detailsHtml += `<li>Puan detayı bulunamadı</li>`;
    }
    
    detailsHtml += `</ul>`;
    detailsDiv.innerHTML = detailsHtml;
}

// Karşılaştırma kararı ver
function makeDecision(decision) {
    if (!currentComparison.nokta_A || !currentComparison.nokta_B) {
        alert('Önce nokta çifti yüklenmelidir');
        return;
    }
    
    const notes = document.getElementById('comparison-notes').value;
    
    const payload = {
        kategori: kategori,
        nokta_A_id: currentComparison.nokta_A.id,
        nokta_B_id: currentComparison.nokta_B.id,
        nokta_A_skor: currentComparison.nokta_A.total_score,
        nokta_B_skor: currentComparison.nokta_B.total_score,
        secim: decision,
        notlar: notes
    };
    
    // Butonları geçici olarak devre dışı bırak
    const buttons = document.querySelectorAll('.comparison-buttons button');
    buttons.forEach(btn => btn.disabled = true);
    
    fetch('/api/v6/save_comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`Hata: ${data.error}`);
        } else {
            console.log('Karşılaştırma kaydedildi:', data.message);
            // Notları temizle
            document.getElementById('comparison-notes').value = '';
            // İstatistikleri güncelle
            updateStats();
            // Yeni çift yükle
            getNewPair();
        }
    })
    .catch(error => {
        console.error('Karşılaştırma kaydedilirken hata:', error);
        alert('Karşılaştırma kaydedilirken hata oluştu');
    })
    .finally(() => {
        // Butonları tekrar aktif et
        buttons.forEach(btn => btn.disabled = false);
    });
}

// İstatistikleri güncelle
function updateStats() {
    fetch('/api/v6/comparison_stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-comparisons').textContent = data.total_comparisons || 0;
            
            const threshold = data.optimization_threshold || 100;
            const current = data.total_comparisons || 0;
            const remaining = Math.max(0, threshold - current);
            
            if (data.ready_for_optimization) {
                document.getElementById('optimization-status').textContent = 'Hazır ✅';
                document.getElementById('optimization-status').style.color = '#28a745';
            } else {
                document.getElementById('optimization-status').textContent = `${remaining} kaldı`;
                document.getElementById('optimization-status').style.color = '#ffc107';
            }
        })
        .catch(error => {
            console.error('İstatistikler alınırken hata:', error);
        });
}

// Sayfa yüklendiğinde başlat
window.onload = () => {
    console.log('Admin karşılaştırma sayfası yükleniyor...');
    
    // POI'ları yükle
    loadAllPois();
    
    // İstatistikleri yükle
    updateStats();
    
    // İlk karşılaştırma çiftini al
    getNewPair();
    
    console.log('Sayfa hazır!');
};