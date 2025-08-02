// --- compare.js (Tüm Hataları Giderilmiş Nihai Sürüm) ---

function createMap(containerId) {
    const map = L.map(containerId, { zoomControl: false }).setView([39.96, 32.75], 12);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(map);
    map.createPane('labels');
    map.getPane('labels').style.zIndex = 650;
    map.getPane('labels').style.pointerEvents = 'none';
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', pane: 'labels' }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    return map;
}

const mapA = createMap('mapA');
const mapB = createMap('mapB');

mapA.sync(mapB);
mapB.sync(mapA);

let currentComparison = {};
const kategori = 'eczane';
let markerA = null;
let markerB = null;
// Her harita için ayrı bir POI katmanı oluşturuyoruz
const poiLayerA = L.featureGroup().addTo(mapA);
const poiLayerB = L.featureGroup().addTo(mapB);
const emoji_map = { 'hastane': '🏥', 'eczane': '💊', 'avm': '🛍️', 'metro': '🚇', 'universite': '🎓' };

function loadAllPois() {
    console.log("Tüm önemli yerler yükleniyor...");
    poiLayerA.clearLayers();
    poiLayerB.clearLayers();
    const poiTypes = ['hastane', 'eczane', 'avm', 'metro', 'universite'];
    
    poiTypes.forEach(poiType => {
        fetch(`/api/v6/get_locations/${poiType}`)
            .then(response => response.json())
            .then(locations => {
                locations.forEach(location => {
                    const emojiIcon = L.divIcon({ html: emoji_map[poiType] || '📍', className: 'emoji-icon' });
                    const markerOptions = { icon: emojiIcon };
                    // Her iki katmana da aynı marker'ı ekle
                    L.marker([location.enlem, location.boylam], markerOptions).bindPopup(`<b>${poiType.toUpperCase()}</b><br>${location.isim}`).addTo(poiLayerA);
                    L.marker([location.enlem, location.boylam], markerOptions).bindPopup(`<b>${poiType.toUpperCase()}</b><br>${location.isim}`).addTo(poiLayerB);
                });
            });
    });
}

function getNewPair() {
    document.body.style.cursor = 'wait';
    fetch(`/api/v6/get_comparison_pair/${kategori}`)
        .then(response => response.json())
        .then(data => {
            currentComparison = data;
            updateUI(data);
            document.body.style.cursor = 'default';
        });
}

function updateUI(data) {
    // Senkronizasyonu geçici olarak durdur
    mapA.unsync(mapB);
    mapB.unsync(mapA);

    // Önceki raptiyeleri temizle
    if (markerA) { mapA.removeLayer(markerA); }
    if (markerB) { mapB.removeLayer(markerB); }

    // Nokta A için arayüzü güncelle
    const noktaA = data.nokta_A;
    markerA = L.marker([noktaA.lat, noktaA.lon]).addTo(mapA);
    mapA.setView([noktaA.lat, noktaA.lon], 16);
    updateDetailsPanel('A', noktaA);

    // Nokta B için arayüzü güncelle
    const noktaB = data.nokta_B;
    markerB = L.marker([noktaB.lat, noktaB.lon]).addTo(mapB);
    mapB.setView([noktaB.lat, noktaB.lon], 16);
    updateDetailsPanel('B', noktaB);

    // Haritalar yerleştikten sonra senkronizasyonu tekrar başlat
    setTimeout(function() {
        mapA.sync(mapB);
        mapB.sync(mapA);
    }, 100);
}

function updateDetailsPanel(panelId, noktaData) {
    const detailsDiv = document.getElementById(`details${panelId}`);
    let detailsHtml = `<h3>Nokta ${panelId} (Skor: ${noktaData.total_score.toFixed(1)})</h3>`;
    detailsHtml += `<b>Mahalle:</b> ${noktaData.mahalle}<hr>`;
    detailsHtml += `<ul>`;
    for (const [key, value] of Object.entries(noktaData.breakdown)) {
        detailsHtml += `<li><b>${key}:</b> ${value}</li>`;
    }
    detailsHtml += `</ul>`;
    detailsDiv.innerHTML = detailsHtml;
}

function makeDecision(decision) {
    const notes = document.getElementById('comparison-notes').value;
    const payload = { kategori: kategori, nokta_A_id: currentComparison.nokta_A.id, nokta_B_id: currentComparison.nokta_B.id, nokta_A_breakdown: currentComparison.nokta_A.breakdown, nokta_B_skor_dokumu: currentComparison.nokta_B.breakdown, secim: decision, notlar: notes };
    fetch('/api/v6/save_comparison', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            document.getElementById('comparison-notes').value = '';
            getNewPair();
        });
}

// --- Sayfa Yüklendiğinde Başlat ---
window.onload = () => {
    loadAllPois();
    getNewPair();
};