// Turkey Geographic Data Manager
class TurkeyGeoData {
    constructor() {
        this.provinces = [];
        this.districts = {};
        this.boundaries = {};
        this.isLoaded = false;
        
        this.initializeData();
    }
    
    initializeData() {
        // Turkey provinces with their bounds (simplified for major cities)
        this.provinces = [
            { id: 1, name: "Adana", bounds: { north: 37.8, south: 36.2, east: 36.2, west: 34.8 } },
            { id: 6, name: "Ankara", bounds: { north: 40.2, south: 39.7, east: 33.0, west: 32.4 } },
            { id: 7, name: "Antalya", bounds: { north: 37.2, south: 36.0, east: 32.0, west: 29.5 } },
            { id: 35, name: "İzmir", bounds: { north: 38.8, south: 38.2, east: 27.5, west: 26.8 } },
            { id: 34, name: "İstanbul", bounds: { north: 41.3, south: 40.8, east: 29.8, west: 28.5 } },
            { id: 16, name: "Bursa", bounds: { north: 40.4, south: 39.8, east: 29.8, west: 28.9 } },
            { id: 33, name: "Mersin", bounds: { north: 36.9, south: 36.6, east: 34.8, west: 33.8 } },
            { id: 42, name: "Konya", bounds: { north: 38.2, south: 37.6, east: 33.0, west: 32.2 } },
            { id: 55, name: "Samsun", bounds: { north: 41.4, south: 41.1, east: 36.5, west: 35.8 } },
            { id: 21, name: "Diyarbakır", bounds: { north: 38.0, south: 37.8, east: 40.4, west: 40.0 } }
        ];
        
        // Districts for major provinces (focusing on Ankara for demo)
        this.districts = {
            6: [ // Ankara districts
                { id: 601, name: "Çankaya", bounds: { north: 39.95, south: 39.85, east: 32.90, west: 32.80 } },
                { id: 602, name: "Keçiören", bounds: { north: 40.00, south: 39.90, east: 32.90, west: 32.80 } },
                { id: 603, name: "Yenimahalle", bounds: { north: 39.98, south: 39.88, east: 32.85, west: 32.75 } },
                { id: 604, name: "Mamak", bounds: { north: 39.95, south: 39.85, east: 33.00, west: 32.90 } },
                { id: 605, name: "Sincan", bounds: { north: 39.85, south: 39.75, east: 32.70, west: 32.60 } },
                { id: 606, name: "Altındağ", bounds: { north: 39.95, south: 39.85, east: 32.90, west: 32.80 } },
                { id: 607, name: "Etimesgut", bounds: { north: 39.90, south: 39.80, east: 32.75, west: 32.65 } },
                { id: 608, name: "Gölbaşı", bounds: { north: 39.80, south: 39.70, east: 32.85, west: 32.75 } },
                { id: 609, name: "Pursaklar", bounds: { north: 40.05, south: 39.95, east: 32.95, west: 32.85 } }
            ],
            34: [ // İstanbul districts (sample)
                { id: 3401, name: "Kadıköy", bounds: { north: 40.98, south: 40.94, east: 29.08, west: 29.00 } },
                { id: 3402, name: "Beşiktaş", bounds: { north: 41.08, south: 41.02, east: 29.02, west: 28.96 } },
                { id: 3403, name: "Şişli", bounds: { north: 41.08, south: 41.02, east: 28.98, west: 28.92 } },
                { id: 3404, name: "Fatih", bounds: { north: 41.02, south: 40.98, east: 28.98, west: 28.92 } },
                { id: 3405, name: "Beyoğlu", bounds: { north: 41.04, south: 41.00, east: 28.98, west: 28.92 } }
            ],
            35: [ // İzmir districts (sample)
                { id: 3501, name: "Konak", bounds: { north: 38.45, south: 38.40, east: 27.15, west: 27.10 } },
                { id: 3502, name: "Karşıyaka", bounds: { north: 38.48, south: 38.43, east: 27.15, west: 27.10 } },
                { id: 3503, name: "Bornova", bounds: { north: 38.50, south: 38.45, east: 27.25, west: 27.20 } }
            ]
        };
        
        this.isLoaded = true;
    }
    
    getProvinces() {
        return this.provinces;
    }
    
    getDistricts(provinceId) {
        return this.districts[provinceId] || [];
    }
    
    getProvinceBounds(provinceId) {
        const province = this.provinces.find(p => p.id === provinceId);
        return province ? province.bounds : null;
    }
    
    getDistrictBounds(districtId) {
        for (const provinceId in this.districts) {
            const district = this.districts[provinceId].find(d => d.id === districtId);
            if (district) {
                return district.bounds;
            }
        }
        return null;
    }
    
    getTurkeyBounds() {
        return {
            north: 42.1,
            south: 35.8,
            east: 44.8,
            west: 25.7
        };
    }
    
    searchLocation(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // Search provinces
        this.provinces.forEach(province => {
            if (province.name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'province',
                    id: province.id,
                    name: province.name,
                    bounds: province.bounds
                });
            }
        });
        
        // Search districts
        for (const provinceId in this.districts) {
            this.districts[provinceId].forEach(district => {
                if (district.name.toLowerCase().includes(lowerQuery)) {
                    const province = this.provinces.find(p => p.id == provinceId);
                    results.push({
                        type: 'district',
                        id: district.id,
                        name: `${district.name}, ${province.name}`,
                        bounds: district.bounds
                    });
                }
            });
        }
        
        return results;
    }
    
    // Helper method to fit map to bounds
    fitMapToBounds(map, bounds) {
        if (!bounds) return;
        
        const southWest = L.latLng(bounds.south, bounds.west);
        const northEast = L.latLng(bounds.north, bounds.east);
        const mapBounds = L.latLngBounds(southWest, northEast);
        
        map.fitBounds(mapBounds, {
            padding: [20, 20],
            maxZoom: 12
        });
    }
}

// Export for use in other files
window.TurkeyGeoData = TurkeyGeoData;