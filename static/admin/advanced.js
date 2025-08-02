/**
 * Advanced Scoring Control Panel - Vue.js Application
 * Main application file with all components
 */

const { createApp } = Vue;

// Main Vue Application
const AdminApp = {
    data() {
        return {
            // Loading states
            isLoading: false,
            loadingMessage: 'Yükleniyor...',
            
            // Categories
            categories: [
                { id: 'eczane', name: 'Eczane', emoji: '💊' },
                { id: 'cafe', name: 'Cafe', emoji: '☕' },
                { id: 'restoran', name: 'Restoran', emoji: '🍽️' },
                { id: 'market', name: 'Market', emoji: '🛒' },
                { id: 'firin', name: 'Fırın', emoji: '🍞' }
            ],
            selectedCategory: 'eczane',
            
            // Data
            parameters: [],
            categoryWeights: {},
            testPoints: [],
            currentScore: null,
            expectedScore: null,
            activeTestPoint: null,
            
            // Performance
            performanceData: {
                lastScoringTime: 0,
                averageScoringTime: 0,
                totalRequests: 0
            },
            
            // UI States
            saveStatus: null,
            showComponentModal: false,
            showHistoryModal: false,
            showImportModal: false,
            selectedComponent: null,
            historyData: [],
            
            // Mobile
            showMobileMenu: false,
            activeMobileTab: 'parameters',
            mobileTabs: [
                { id: 'parameters', name: 'Parametreler', icon: '⚙️' },
                { id: 'map', name: 'Harita', icon: '🗺️' },
                { id: 'testing', name: 'Test', icon: '🧪' },
                { id: 'results', name: 'Sonuçlar', icon: '📊' }
            ]
        }
    },
    
    async mounted() {
        await this.initializeApp();
    },
    
    methods: {
        async initializeApp() {
            this.setLoading(true, 'Uygulama başlatılıyor...');
            
            try {
                await Promise.all([
                    this.loadCategoryData(),
                    this.loadTestPoints()
                ]);
                
                console.log('✅ Advanced Admin Panel initialized successfully');
            } catch (error) {
                console.error('❌ Initialization failed:', error);
                this.showError('Uygulama başlatılamadı: ' + error.message);
            } finally {
                this.setLoading(false);
            }
        },
        
        async loadCategoryData() {
            try {
                const [parametersResponse, weightsResponse] = await Promise.all([
                    fetch(`/api/admin/parameters/${this.selectedCategory}/list`),
                    fetch(`/api/admin/weights/${this.selectedCategory}`)
                ]);
                
                if (parametersResponse.ok) {
                    this.parameters = await parametersResponse.json();
                }
                
                if (weightsResponse.ok) {
                    this.categoryWeights = await weightsResponse.json();
                }
                
                console.log(`✅ Loaded data for category: ${this.selectedCategory}`);
            } catch (error) {
                console.error('❌ Failed to load category data:', error);
                this.showError('Kategori verileri yüklenemedi');
            }
        },
        
        async loadTestPoints() {
            try {
                const response = await fetch('/api/admin/testing/test-points');
                if (response.ok) {
                    this.testPoints = await response.json();
                    console.log(`✅ Loaded ${this.testPoints.length} test points`);
                }
            } catch (error) {
                console.error('❌ Failed to load test points:', error);
            }
        },
        
        async onParameterUpdated(parameter) {
            try {
                this.setSaveStatus('saving', 'Kaydediliyor...', 'text-yellow-600', 'bg-yellow-400');
                
                const response = await fetch(`/api/admin/parameters/${this.selectedCategory}/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        parameters: [parameter],
                        changed_by: 'admin',
                        change_reason: 'Real-time parameter update'
                    })
                });
                
                if (response.ok) {
                    this.setSaveStatus('saved', 'Kaydedildi', 'text-green-600', 'bg-green-400');
                    
                    // Re-score active test point if exists
                    if (this.activeTestPoint) {
                        await this.scoreTestPoint(this.activeTestPoint);
                    }
                } else {
                    throw new Error('Parameter update failed');
                }
                
            } catch (error) {
                console.error('❌ Parameter update failed:', error);
                this.setSaveStatus('error', 'Hata!', 'text-red-600', 'bg-red-400');
                this.showError('Parametre güncellenemedi');
            }
        },
        
        async onWeightsUpdated(weights) {
            try {
                const response = await fetch(`/api/admin/weights/${this.selectedCategory}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(weights)
                });
                
                if (response.ok) {
                    this.categoryWeights = weights;
                    this.setSaveStatus('saved', 'Ağırlıklar güncellendi', 'text-green-600', 'bg-green-400');
                    
                    // Re-score active test point
                    if (this.activeTestPoint) {
                        await this.scoreTestPoint(this.activeTestPoint);
                    }
                }
            } catch (error) {
                console.error('❌ Weights update failed:', error);
                this.showError('Ağırlıklar güncellenemedi');
            }
        },
        
        async onTestPointCreated(testPoint) {
            this.testPoints.push(testPoint);
            console.log('✅ Test point created:', testPoint.name);
        },
        
        async onTestPointSelected(testPoint) {
            this.activeTestPoint = testPoint;
            await this.scoreTestPoint(testPoint);
        },
        
        async onTestPointTested(testPoint) {
            await this.scoreTestPoint(testPoint);
        },
        
        async onMapPointClicked(lat, lon) {
            const quickTestPoint = {
                name: 'Hızlı Test',
                lat: lat,
                lon: lon,
                category: this.selectedCategory,
                is_quick_test: true
            };
            
            this.activeTestPoint = quickTestPoint;
            await this.scoreTestPoint(quickTestPoint);
        },
        
        async scoreTestPoint(testPoint) {
            try {
                this.setLoading(true, 'Nokta skorlanıyor...');
                
                const startTime = performance.now();
                
                const response = await fetch('/api/admin/testing/score-point', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        lat: testPoint.lat,
                        lon: testPoint.lon,
                        category: this.selectedCategory
                    })
                });
                
                const endTime = performance.now();
                const scoringTime = endTime - startTime;
                
                if (response.ok) {
                    this.currentScore = await response.json();
                    this.expectedScore = testPoint.expected_score;
                    
                    // Update performance metrics
                    this.updatePerformanceMetrics(scoringTime);
                    
                    console.log(`✅ Scored point: ${this.currentScore.total_score}/100 (${scoringTime.toFixed(2)}ms)`);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Scoring failed');
                }
                
            } catch (error) {
                console.error('❌ Scoring failed:', error);
                this.showError('Nokta skorlanamadı: ' + error.message);
            } finally {
                this.setLoading(false);
            }
        },
        
        updatePerformanceMetrics(scoringTime) {
            this.performanceData.lastScoringTime = scoringTime;
            this.performanceData.totalRequests++;
            
            // Calculate running average
            const alpha = 0.1; // Smoothing factor
            this.performanceData.averageScoringTime = 
                this.performanceData.averageScoringTime * (1 - alpha) + scoringTime * alpha;
        },
        
        onExpandComponent(component) {
            this.selectedComponent = component;
            this.showComponentModal = true;
        },
        
        async revertChanges() {
            try {
                const response = await fetch('/api/admin/history/parameter-history?category=' + this.selectedCategory);
                if (response.ok) {
                    this.historyData = await response.json();
                    this.showHistoryModal = true;
                }
            } catch (error) {
                console.error('❌ Failed to load history:', error);
                this.showError('Geçmiş yüklenemedi');
            }
        },
        
        async revertToHistory(historyId) {
            try {
                const response = await fetch('/api/admin/history/revert-changes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        history_id: historyId,
                        changed_by: 'admin'
                    })
                });
                
                if (response.ok) {
                    await this.loadCategoryData();
                    this.showHistoryModal = false;
                    this.setSaveStatus('reverted', 'Geri alındı', 'text-blue-600', 'bg-blue-400');
                }
            } catch (error) {
                console.error('❌ Revert failed:', error);
                this.showError('Geri alma başarısız');
            }
        },
        
        showHistory() {
            this.revertChanges();
        },
        
        async exportParameters() {
            try {
                const response = await fetch(`/api/admin/export/export-parameters?category=${this.selectedCategory}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Download as JSON file
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `parameters_${this.selectedCategory}_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    this.setSaveStatus('exported', 'Dışa aktarıldı', 'text-green-600', 'bg-green-400');
                }
            } catch (error) {
                console.error('❌ Export failed:', error);
                this.showError('Dışa aktarma başarısız');
            }
        },
        
        importParameters() {
            this.showImportModal = true;
        },
        
        async processImport(fileContent) {
            try {
                const data = JSON.parse(fileContent);
                
                const response = await fetch('/api/admin/export/import-parameters', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    await this.loadCategoryData();
                    this.showImportModal = false;
                    this.setSaveStatus('imported', `İçe aktarıldı: ${result.total_processed} parametre`, 'text-green-600', 'bg-green-400');
                }
            } catch (error) {
                console.error('❌ Import failed:', error);
                this.showError('İçe aktarma başarısız: ' + error.message);
            }
        },
        
        // Utility methods
        setLoading(loading, message = 'Yükleniyor...') {
            this.isLoading = loading;
            this.loadingMessage = message;
        },
        
        setSaveStatus(type, message, textColor, bgColor) {
            this.saveStatus = {
                type: type,
                message: message,
                textColor: textColor,
                color: bgColor
            };
            
            // Clear status after 3 seconds
            setTimeout(() => {
                this.saveStatus = null;
            }, 3000);
        },
        
        showError(message) {
            alert('❌ Hata: ' + message);
        }
    }
};

// Vue Components
const ParameterManager = {
    props: ['selectedCategory', 'parameters', 'categoryWeights', 'mobileMode'],
    emits: ['parameter-updated', 'weights-updated'],
    
    template: `
        <div class="p-6">
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    Parametre Yönetimi
                </h3>
                
                <!-- Category Info -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div class="flex items-center space-x-2">
                        <span class="text-2xl">{{ getCategoryEmoji(selectedCategory) }}</span>
                        <div>
                            <h4 class="font-medium text-blue-900">{{ getCategoryName(selectedCategory) }}</h4>
                            <p class="text-sm text-blue-700">{{ parameters.length }} aktif parametre</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Weight Configuration -->
            <div class="mb-8">
                <weight-configuration 
                    :weights="categoryWeights"
                    @update="$emit('weights-updated', $event)">
                </weight-configuration>
            </div>

            <!-- Parameter Groups -->
            <div class="space-y-6">
                <!-- Distance-based Parameters -->
                <parameter-group 
                    title="Mesafe Bazlı Parametreler"
                    icon="📏"
                    :parameters="distanceParameters"
                    @update="$emit('parameter-updated', $event)">
                </parameter-group>

                <!-- Demographic Parameters -->
                <parameter-group 
                    title="Demografik Parametreler"
                    icon="👥"
                    :parameters="demographicParameters"
                    @update="$emit('parameter-updated', $event)">
                </parameter-group>

                <!-- Other Parameters -->
                <parameter-group 
                    v-if="otherParameters.length > 0"
                    title="Diğer Parametreler"
                    icon="⚙️"
                    :parameters="otherParameters"
                    @update="$emit('parameter-updated', $event)">
                </parameter-group>
            </div>

            <!-- Quick Actions -->
            <div class="mt-8 space-y-3">
                <button @click="resetToDefaults" 
                        class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors">
                    🔄 Varsayılanlara Sıfırla
                </button>
                <button @click="saveAsPreset" 
                        class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors">
                    💾 Preset Olarak Kaydet
                </button>
            </div>
        </div>
    `,
    
    computed: {
        distanceParameters() {
            return this.parameters.filter(p => p.parameter_type === 'distance');
        },
        
        demographicParameters() {
            return this.parameters.filter(p => p.parameter_type === 'demographic');
        },
        
        otherParameters() {
            return this.parameters.filter(p => !['distance', 'demographic'].includes(p.parameter_type));
        }
    },
    
    methods: {
        getCategoryEmoji(category) {
            const categoryMap = {
                'eczane': '💊',
                'cafe': '☕',
                'restoran': '🍽️',
                'market': '🛒',
                'firin': '🍞'
            };
            return categoryMap[category] || '⚙️';
        },
        
        getCategoryName(category) {
            const categoryMap = {
                'eczane': 'Eczane',
                'cafe': 'Cafe',
                'restoran': 'Restoran',
                'market': 'Market',
                'firin': 'Fırın'
            };
            return categoryMap[category] || category;
        },
        
        resetToDefaults() {
            if (confirm('Tüm parametreler varsayılan değerlere sıfırlanacak. Emin misiniz?')) {
                // TODO: Implement reset to defaults
                console.log('Reset to defaults');
            }
        },
        
        saveAsPreset() {
            const presetName = prompt('Preset adı:');
            if (presetName) {
                // TODO: Implement save as preset
                console.log('Save as preset:', presetName);
            }
        }
    }
};

const WeightConfiguration = {
    props: ['weights'],
    emits: ['update'],
    
    data() {
        return {
            localWeights: {
                hospital_weight: 0.30,
                competitor_weight: 0.30,
                demographics_weight: 0.10,
                important_places_weight: 0.30
            }
        }
    },
    
    watch: {
        weights: {
            handler(newWeights) {
                if (newWeights) {
                    this.localWeights = { ...newWeights };
                }
            },
            immediate: true
        }
    },
    
    template: `
        <div class="border border-gray-200 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-4 flex items-center">
                ⚖️ Ağırlık Konfigürasyonu
                <span class="ml-2 text-sm text-gray-500">(Toplam: {{ totalWeight }}%)</span>
            </h4>
            
            <div class="space-y-4">
                <!-- Hospital Weight -->
                <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">🏥 Hastane Yakınlığı</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" 
                               v-model.number="localWeights.hospital_weight"
                               @input="updateWeights"
                               min="0" max="1" step="0.05"
                               class="w-24">
                        <span class="text-sm font-mono w-12">{{ Math.round(localWeights.hospital_weight * 100) }}%</span>
                    </div>
                </div>
                
                <!-- Competitor Weight -->
                <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">🏪 Rakip Yoğunluğu</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" 
                               v-model.number="localWeights.competitor_weight"
                               @input="updateWeights"
                               min="0" max="1" step="0.05"
                               class="w-24">
                        <span class="text-sm font-mono w-12">{{ Math.round(localWeights.competitor_weight * 100) }}%</span>
                    </div>
                </div>
                
                <!-- Demographics Weight -->
                <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">👥 Demografi</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" 
                               v-model.number="localWeights.demographics_weight"
                               @input="updateWeights"
                               min="0" max="1" step="0.05"
                               class="w-24">
                        <span class="text-sm font-mono w-12">{{ Math.round(localWeights.demographics_weight * 100) }}%</span>
                    </div>
                </div>
                
                <!-- Important Places Weight -->
                <div class="flex items-center justify-between">
                    <label class="text-sm font-medium text-gray-700">🚇 Önemli Yerler</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" 
                               v-model.number="localWeights.important_places_weight"
                               @input="updateWeights"
                               min="0" max="1" step="0.05"
                               class="w-24">
                        <span class="text-sm font-mono w-12">{{ Math.round(localWeights.important_places_weight * 100) }}%</span>
                    </div>
                </div>
            </div>
            
            <!-- Weight Validation -->
            <div class="mt-4 p-3 rounded-lg" :class="totalWeight === 100 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'">
                <div class="flex items-center space-x-2">
                    <span>{{ totalWeight === 100 ? '✅' : '⚠️' }}</span>
                    <span class="text-sm">
                        {{ totalWeight === 100 ? 'Ağırlıklar dengeli' : 'Toplam ağırlık %100 olmalı' }}
                    </span>
                </div>
            </div>
        </div>
    `,
    
    computed: {
        totalWeight() {
            return Math.round((
                this.localWeights.hospital_weight +
                this.localWeights.competitor_weight +
                this.localWeights.demographics_weight +
                this.localWeights.important_places_weight
            ) * 100);
        }
    },
    
    methods: {
        updateWeights() {
            this.$emit('update', this.localWeights);
        }
    }
};

// Register components and create app
const app = createApp(AdminApp);

app.component('parameter-manager', ParameterManager);
app.component('weight-configuration', WeightConfiguration);

const ParameterGroup = {
    props: ['title', 'icon', 'parameters'],
    emits: ['update'],
    
    data() {
        return {
            expandedParams: new Set(),
            localParameters: []
        }
    },
    
    watch: {
        parameters: {
            handler(newParams) {
                this.localParameters = newParams ? [...newParams] : [];
            },
            immediate: true,
            deep: true
        }
    },
    
    template: `
        <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold text-gray-900 flex items-center">
                    <span class="mr-2">{{ icon }}</span>
                    {{ title }}
                    <span class="ml-2 text-sm text-gray-500">({{ localParameters.length }})</span>
                </h4>
                <button @click="addNewParameter" 
                        class="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    ➕ Yeni Ekle
                </button>
            </div>
            
            <div v-if="localParameters.length === 0" class="text-center py-8 text-gray-500">
                <p>Bu kategoride parametre bulunmuyor</p>
                <button @click="addNewParameter" 
                        class="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                    İlk parametreyi ekle
                </button>
            </div>
            
            <div v-else class="space-y-4">
                <div v-for="param in localParameters" :key="param.id" 
                     class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    
                    <!-- Parameter Header -->
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center space-x-3">
                            <span class="font-medium text-gray-900">{{ param.parameter_name }}</span>
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {{ param.parameter_type }}
                            </span>
                            <span v-if="!param.is_active" class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Pasif
                            </span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button @click="toggleExpanded(param.id)" 
                                    class="text-gray-400 hover:text-gray-600">
                                {{ isExpanded(param.id) ? '🔽' : '▶️' }}
                            </button>
                            <button @click="duplicateParameter(param)" 
                                    class="text-blue-500 hover:text-blue-700 text-sm">
                                📋
                            </button>
                            <button @click="deleteParameter(param)" 
                                    class="text-red-500 hover:text-red-700 text-sm">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <!-- Parameter Controls -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <!-- Max Score -->
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">
                                Maksimum Puan
                            </label>
                            <input type="number" 
                                   v-model.number="param.max_score"
                                   @input="updateParameter(param)"
                                   :class="['w-full p-2 border rounded text-sm parameter-input',
                                           param.max_score < 0 ? 'border-red-300 bg-red-50' : 'border-gray-300']"
                                   step="0.1">
                        </div>

                        <!-- Effect Distance (for distance-based parameters) -->
                        <div v-if="param.parameter_type === 'distance'">
                            <label class="block text-xs text-gray-600 mb-1">
                                Etki Mesafesi (m)
                            </label>
                            <input type="number" 
                                   v-model.number="param.effect_distance"
                                   @input="updateParameter(param)"
                                   class="w-full p-2 border border-gray-300 rounded text-sm parameter-input"
                                   min="0" step="50">
                        </div>

                        <!-- Log Coefficient (for distance-based parameters) -->
                        <div v-if="param.parameter_type === 'distance'">
                            <label class="block text-xs text-gray-600 mb-1">
                                Log Katsayısı
                            </label>
                            <input type="number" 
                                   v-model.number="param.log_coefficient"
                                   @input="updateParameter(param)"
                                   class="w-full p-2 border border-gray-300 rounded text-sm parameter-input"
                                   min="0.1" max="10" step="0.1">
                        </div>
                        
                        <!-- Active Status -->
                        <div class="flex items-center">
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" 
                                       v-model="param.is_active"
                                       @change="updateParameter(param)"
                                       class="rounded">
                                <span class="text-xs text-gray-600">Aktif</span>
                            </label>
                        </div>
                    </div>

                    <!-- Real-time Preview -->
                    <div class="p-2 bg-blue-50 rounded text-sm border border-blue-200">
                        <div class="flex justify-between items-center">
                            <span class="text-blue-700 font-medium">Önizleme:</span>
                            <span class="text-blue-800">{{ calculatePreview(param) }}</span>
                        </div>
                    </div>

                    <!-- Expanded Details -->
                    <div v-if="isExpanded(param.id)" class="mt-4 pt-4 border-t border-gray-200">
                        <!-- Categorical Values (for demographic parameters) -->
                        <div v-if="param.parameter_type === 'demographic' && param.categorical_values">
                            <h5 class="text-sm font-medium text-gray-700 mb-2">Kategorik Değerler:</h5>
                            <div class="space-y-2">
                                <div v-for="(value, key) in param.categorical_values" :key="key"
                                     class="flex items-center justify-between bg-white p-2 rounded border">
                                    <span class="text-sm">{{ key }}</span>
                                    <input type="number" 
                                           v-model.number="param.categorical_values[key]"
                                           @input="updateParameter(param)"
                                           class="w-20 p-1 border border-gray-300 rounded text-sm"
                                           step="0.1">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Parameter Statistics -->
                        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-600">Oluşturulma:</span>
                                <span class="ml-1">{{ formatDate(param.created_at) }}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Güncelleme:</span>
                                <span class="ml-1">{{ formatDate(param.updated_at) }}</span>
                            </div>
                        </div>
                        
                        <!-- Advanced Settings -->
                        <div class="mt-4">
                            <h5 class="text-sm font-medium text-gray-700 mb-2">Gelişmiş Ayarlar:</h5>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs text-gray-600 mb-1">Parametre Adı</label>
                                    <input type="text" 
                                           v-model="param.parameter_name"
                                           @input="updateParameter(param)"
                                           class="w-full p-2 border border-gray-300 rounded text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 mb-1">Parametre Tipi</label>
                                    <select v-model="param.parameter_type"
                                            @change="updateParameter(param)"
                                            class="w-full p-2 border border-gray-300 rounded text-sm">
                                        <option value="distance">Mesafe Bazlı</option>
                                        <option value="demographic">Demografik</option>
                                        <option value="weight">Ağırlık</option>
                                        <option value="other">Diğer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    methods: {
        updateParameter(param) {
            // Debounce updates to avoid too many API calls
            clearTimeout(param._updateTimeout);
            param._updateTimeout = setTimeout(() => {
                this.$emit('update', param);
            }, 500);
        },
        
        toggleExpanded(paramId) {
            if (this.expandedParams.has(paramId)) {
                this.expandedParams.delete(paramId);
            } else {
                this.expandedParams.add(paramId);
            }
        },
        
        isExpanded(paramId) {
            return this.expandedParams.has(paramId);
        },
        
        calculatePreview(param) {
            if (param.parameter_type === 'distance') {
                const distance = 100; // Sample distance
                if (param.effect_distance && param.effect_distance > 0 && distance < param.effect_distance) {
                    const logFactor = Math.log(param.effect_distance / Math.max(distance, 10)) / Math.log(param.log_coefficient || 2);
                    const score = (param.max_score || 0) * Math.max(0, Math.min(1, logFactor));
                    return `100m mesafede: ${score.toFixed(1)} puan`;
                }
                return '100m mesafede: 0 puan';
            } else if (param.parameter_type === 'demographic') {
                return `Sabit değer: ${param.max_score || 0} puan`;
            }
            return `Değer: ${param.max_score || 0}`;
        },
        
        addNewParameter() {
            const newParam = {
                id: 'new_' + Date.now(),
                parameter_name: 'Yeni Parametre',
                parameter_type: 'distance',
                max_score: 0,
                effect_distance: 1000,
                log_coefficient: 2.0,
                categorical_values: null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.localParameters.push(newParam);
            this.expandedParams.add(newParam.id);
            this.$emit('update', newParam);
        },
        
        duplicateParameter(param) {
            const duplicatedParam = {
                ...param,
                id: 'dup_' + Date.now(),
                parameter_name: param.parameter_name + ' (Kopya)',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.localParameters.push(duplicatedParam);
            this.$emit('update', duplicatedParam);
        },
        
        deleteParameter(param) {
            if (confirm(`"${param.parameter_name}" parametresini silmek istediğinizden emin misiniz?`)) {
                const index = this.localParameters.findIndex(p => p.id === param.id);
                if (index > -1) {
                    this.localParameters.splice(index, 1);
                    this.expandedParams.delete(param.id);
                    // Emit delete event (will be handled by parent)
                    this.$emit('delete', param);
                }
            }
        },
        
        formatDate(dateString) {
            if (!dateString) return 'Bilinmiyor';
            try {
                return new Date(dateString).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch {
                return 'Geçersiz tarih';
            }
        }
    }
};

app.component('parameter-group', ParameterGroup);

const VisualMap = {
    props: ['selectedCategory', 'testPoints', 'activeTestPoint', 'mobileMode'],
    emits: ['point-clicked', 'test-point-selected'],
    
    data() {
        return {
            map: null,
            testPointMarkers: [],
            heatmapLayer: null,
            isMapReady: false,
            mapError: null,
            lastUpdateTime: 0
        }
    },
    
    mounted() {
        this.initializeMap();
    },
    
    beforeUnmount() {
        if (this.map) {
            this.map.remove();
        }
    },
    
    watch: {
        selectedCategory() {
            this.updateHeatmap();
        },
        
        testPoints: {
            handler() {
                this.updateTestPointMarkers();
            },
            deep: true
        },
        
        activeTestPoint(newPoint, oldPoint) {
            this.updateActiveTestPoint(newPoint, oldPoint);
        }
    },
    
    template: `
        <div class="h-full relative">
            <!-- Map Container -->
            <div id="visual-map" class="h-full w-full"></div>
            
            <!-- Map Controls -->
            <div class="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                <button @click="zoomIn" 
                        class="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                    ➕
                </button>
                <button @click="zoomOut" 
                        class="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                    ➖
                </button>
                <button @click="resetView" 
                        class="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                    🏠
                </button>
            </div>
            
            <!-- Map Legend -->
            <div class="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg z-[1000] max-w-xs">
                <h4 class="font-medium text-sm mb-2">🗺️ Harita Açıklaması</h4>
                <div class="space-y-1 text-xs">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Yüksek Skor (80-100)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Orta Skor (60-79)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Düşük Skor (0-59)</span>
                    </div>
                    <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                        <div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        <span>Test Noktaları</span>
                    </div>
                </div>
            </div>
            
            <!-- Loading Overlay -->
            <div v-if="!isMapReady" class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-[2000]">
                <div class="text-center">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-gray-600">Harita yükleniyor...</p>
                </div>
            </div>
            
            <!-- Error Overlay -->
            <div v-if="mapError" class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-[2000]">
                <div class="text-center">
                    <p class="text-red-600 mb-4">❌ Harita yüklenemedi</p>
                    <p class="text-sm text-gray-600 mb-4">{{ mapError }}</p>
                    <button @click="initializeMap" 
                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        🔄 Tekrar Dene
                    </button>
                </div>
            </div>
            
            <!-- Map Info -->
            <div class="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-sm z-[1000]">
                <div class="text-xs text-gray-600">
                    <div>Kategori: {{ getCategoryName(selectedCategory) }}</div>
                    <div>Test Noktaları: {{ testPoints.length }}</div>
                    <div v-if="lastUpdateTime">Son Güncelleme: {{ formatTime(lastUpdateTime) }}</div>
                </div>
            </div>
        </div>
    `,
    
    methods: {
        async initializeMap() {
            try {
                this.mapError = null;
                
                // Initialize Leaflet map
                this.map = L.map('visual-map', {
                    zoomControl: false // We have custom controls
                }).setView([39.9334, 32.8597], 12); // Yenimahalle center
                
                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(this.map);
                
                // Map event listeners
                this.map.on('click', (e) => {
                    this.$emit('point-clicked', e.latlng.lat, e.latlng.lng);
                });
                
                this.map.on('zoomend moveend', () => {
                    this.updateHeatmap();
                });
                
                // Wait for map to be ready
                this.map.whenReady(() => {
                    this.isMapReady = true;
                    this.updateTestPointMarkers();
                    this.updateHeatmap();
                    console.log('✅ Visual map initialized');
                });
                
            } catch (error) {
                console.error('❌ Map initialization failed:', error);
                this.mapError = error.message;
            }
        },
        
        updateTestPointMarkers() {
            if (!this.map || !this.isMapReady) return;
            
            // Clear existing markers
            this.testPointMarkers.forEach(marker => {
                this.map.removeLayer(marker);
            });
            this.testPointMarkers = [];
            
            // Add new markers
            this.testPoints.forEach(point => {
                const isActive = this.activeTestPoint && this.activeTestPoint.id === point.id;
                const isRelevant = point.category === this.selectedCategory;
                
                // Create custom icon
                const iconHtml = `
                    <div class="test-point-marker ${isActive ? 'active' : ''} ${!isRelevant ? 'inactive' : ''}"
                         style="
                            width: 24px; 
                            height: 24px; 
                            border-radius: 50%; 
                            border: 3px solid \${isActive ? '#3b82f6' : (isRelevant ? '#10b981' : '#9ca3af')}; 
                            background: white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                            cursor: pointer;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            ${isActive ? 'transform: scale(1.2);' : ''}
                         ">
                        ${point.is_predefined ? '🎯' : '📍'}
                    </div>
                `;
                
                const icon = L.divIcon({
                    html: iconHtml,
                    className: 'custom-test-point-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                const marker = L.marker([point.lat, point.lon], { icon })
                    .addTo(this.map);
                
                // Create detailed popup
                const popupContent = this.createTestPointPopup(point);
                marker.bindPopup(popupContent);
                
                // Click handler
                marker.on('click', () => {
                    this.$emit('test-point-selected', point);
                });
                
                this.testPointMarkers.push(marker);
            });
            
            console.log(`✅ Updated ${this.testPointMarkers.length} test point markers`);
        },
        
        createTestPointPopup(point) {
            const isRelevant = point.category === this.selectedCategory;
            
            return `
                <div class="test-point-popup" style="min-width: 200px; font-family: system-ui, sans-serif;">
                    <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 6px 6px 0 0; margin: -10px -10px 10px -10px;">
                        <h4 style="margin: 0; font-size: 16px; font-weight: bold;">
                            ${point.is_predefined ? '🎯' : '📍'} ${point.name}
                        </h4>
                        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                            ${point.category} • ${point.is_predefined ? 'Sistem' : 'Özel'}
                        </div>
                    </div>
                    
                    ${point.description ? `
                        <div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">📝 Açıklama:</div>
                            <div style="font-size: 13px;">${point.description}</div>
                        </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 10px; font-size: 12px;">
                        <div style="margin-bottom: 4px;"><strong>📍 Koordinatlar:</strong></div>
                        <div style="font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">
                            ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}
                        </div>
                    </div>
                    
                    ${point.expected_score ? `
                        <div style="margin-bottom: 10px; padding: 8px; background: #fef3c7; border-radius: 4px; border-left: 4px solid #f59e0b;">
                            <div style="font-size: 12px; color: #92400e; margin-bottom: 2px;">🎯 Beklenen Skor:</div>
                            <div style="font-size: 14px; font-weight: bold; color: #92400e;">${point.expected_score}/100</div>
                        </div>
                    ` : ''}
                    
                    ${!isRelevant ? `
                        <div style="margin-bottom: 10px; padding: 8px; background: #fee2e2; border-radius: 4px; border-left: 4px solid #ef4444;">
                            <div style="font-size: 12px; color: #991b1b;">
                                ⚠️ Bu nokta ${point.category} kategorisi için. Mevcut kategori: ${this.selectedCategory}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button onclick="window.testPointFromMap('${point.id}')" 
                                style="flex: 1; padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            🧪 Test Et
                        </button>
                        <button onclick="window.selectPointFromMap('${point.id}')" 
                                style="flex: 1; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            ✓ Seç
                        </button>
                    </div>
                </div>
            `;
        },
        
        updateActiveTestPoint(newPoint, oldPoint) {
            if (!this.map || !this.isMapReady) return;
            
            // Update marker styles
            this.updateTestPointMarkers();
            
            // Center map on active point
            if (newPoint && newPoint.lat && newPoint.lon) {
                this.map.setView([newPoint.lat, newPoint.lon], Math.max(this.map.getZoom(), 15));
            }
        },
        
        async updateHeatmap() {
            if (!this.map || !this.isMapReady) return;
            
            const zoom = this.map.getZoom();
            
            // Only show heatmap at higher zoom levels
            if (zoom < 13) {
                if (this.heatmapLayer) {
                    this.map.removeLayer(this.heatmapLayer);
                    this.heatmapLayer = null;
                }
                return;
            }
            
            try {
                const bounds = this.map.getBounds();
                
                const response = await fetch(`/api/v8/heatmap_data/${this.selectedCategory}?` + new URLSearchParams({
                    north: bounds.getNorth(),
                    south: bounds.getSouth(),
                    east: bounds.getEast(),
                    west: bounds.getWest()
                }));
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Remove old heatmap
                    if (this.heatmapLayer) {
                        this.map.removeLayer(this.heatmapLayer);
                    }
                    
                    if (result.heatmap_data && result.heatmap_data.length > 0) {
                        // Create new heatmap
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
                        
                        this.lastUpdateTime = Date.now();
                        console.log(`✅ Heatmap updated with ${result.total_points} points`);
                    }
                }
            } catch (error) {
                console.error('❌ Heatmap update failed:', error);
            }
        },
        
        zoomIn() {
            if (this.map) {
                this.map.zoomIn();
            }
        },
        
        zoomOut() {
            if (this.map) {
                this.map.zoomOut();
            }
        },
        
        resetView() {
            if (this.map) {
                this.map.setView([39.9334, 32.8597], 12);
            }
        },
        
        getCategoryName(category) {
            const categoryMap = {
                'eczane': 'Eczane',
                'cafe': 'Cafe',
                'restoran': 'Restoran',
                'market': 'Market',
                'firin': 'Fırın'
            };
            return categoryMap[category] || category;
        },
        
        formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }
};

app.component('visual-map', VisualMap);

// Global functions for popup buttons
window.testPointFromMap = function(pointId) {
    const app = document.querySelector('#admin-app').__vue_app__;
    const instance = app._instance;
    const point = instance.ctx.testPoints.find(p => p.id == pointId);
    if (point) {
        instance.emit('test-point-tested', point);
    }
};

window.selectPointFromMap = function(pointId) {
    const app = document.querySelector('#admin-app').__vue_app__;
    const instance = app._instance;
    const point = instance.ctx.testPoints.find(p => p.id == pointId);
    if (point) {
        instance.emit('test-point-selected', point);
    }
};

const TestPointManager = {
    props: ['testPoints', 'selectedCategory', 'activePoint', 'mobileMode'],
    emits: ['test-point-created', 'test-point-selected', 'test-point-tested'],
    
    data() {
        return {
            showAddForm: false,
            newTestPoint: {
                name: '',
                description: '',
                lat: null,
                lon: null,
                expected_score: null
            },
            quickTest: {
                lat: null,
                lon: null
            },
            isCreating: false
        }
    },
    
    computed: {
        predefinedPoints() {
            return this.testPoints.filter(p => p.is_predefined);
        },
        
        customPoints() {
            return this.testPoints.filter(p => !p.is_predefined);
        },
        
        filteredTestPoints() {
            return this.testPoints.filter(p => p.category === this.selectedCategory);
        }
    },
    
    template: `
        <div class="p-4 h-full flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-gray-900 flex items-center">
                    🧪 Test Noktaları
                    <span class="ml-2 text-sm text-gray-500">({{ filteredTestPoints.length }})</span>
                </h3>
                <button @click="showAddForm = !showAddForm" 
                        :class="['text-sm px-3 py-1 rounded transition-colors',
                                showAddForm ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200']">
                    {{ showAddForm ? '❌ İptal' : '➕ Yeni Ekle' }}
                </button>
            </div>

            <!-- Add New Test Point Form -->
            <div v-if="showAddForm" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 class="font-medium text-blue-900 mb-3">Yeni Test Noktası Ekle</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">İsim</label>
                        <input type="text" 
                               v-model="newTestPoint.name"
                               placeholder="Test noktası adı"
                               class="w-full p-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea v-model="newTestPoint.description"
                                  placeholder="Bu test noktasının özelliklerini açıklayın"
                                  rows="2"
                                  class="w-full p-2 border border-gray-300 rounded-lg text-sm"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Enlem</label>
                            <input type="number" 
                                   v-model.number="newTestPoint.lat"
                                   placeholder="39.969169"
                                   step="any"
                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Boylam</label>
                            <input type="number" 
                                   v-model.number="newTestPoint.lon"
                                   placeholder="32.783675"
                                   step="any"
                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Beklenen Skor (Opsiyonel)</label>
                        <input type="number" 
                               v-model.number="newTestPoint.expected_score"
                               placeholder="0-100 arası"
                               min="0" max="100"
                               class="w-full p-2 border border-gray-300 rounded-lg text-sm">
                    </div>
                    <div class="flex space-x-2">
                        <button @click="createTestPoint" 
                                :disabled="!canCreateTestPoint || isCreating"
                                :class="['flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
                                        canCreateTestPoint && !isCreating 
                                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed']">
                            {{ isCreating ? '⏳ Oluşturuluyor...' : '✅ Oluştur' }}
                        </button>
                        <button @click="resetForm" 
                                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors">
                            🔄 Temizle
                        </button>
                    </div>
                </div>
            </div>

            <!-- Predefined Test Points -->
            <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    🎯 Önceden Tanımlı Noktalar
                    <span class="ml-2 text-xs text-gray-500">({{ predefinedPoints.length }})</span>
                </h4>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                    <test-point-card 
                        v-for="point in predefinedPoints" 
                        :key="point.id"
                        :point="point"
                        :is-active="activePoint?.id === point.id"
                        :selected-category="selectedCategory"
                        @select="selectTestPoint"
                        @test="testPoint">
                    </test-point-card>
                </div>
            </div>

            <!-- Custom Test Points -->
            <div class="flex-1 overflow-y-auto">
                <h4 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    📍 Özel Test Noktaları
                    <span class="ml-2 text-xs text-gray-500">({{ customPoints.length }})</span>
                </h4>
                <div v-if="customPoints.length === 0" class="text-center py-8 text-gray-500">
                    <p class="text-sm">Henüz özel test noktası yok</p>
                    <button @click="showAddForm = true" 
                            class="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                        İlk test noktasını ekle
                    </button>
                </div>
                <div v-else class="space-y-2">
                    <test-point-card 
                        v-for="point in customPoints" 
                        :key="point.id"
                        :point="point"
                        :is-active="activePoint?.id === point.id"
                        :selected-category="selectedCategory"
                        :can-edit="true"
                        :can-delete="true"
                        @select="selectTestPoint"
                        @test="testPoint"
                        @edit="editTestPoint"
                        @delete="deleteTestPoint">
                    </test-point-card>
                </div>
            </div>

            <!-- Quick Test -->
            <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 class="text-sm font-medium text-gray-700 mb-2">⚡ Hızlı Test</h4>
                <div class="flex gap-2">
                    <input type="number" 
                           v-model.number="quickTest.lat"
                           placeholder="Enlem"
                           step="any"
                           class="flex-1 p-2 border border-gray-300 rounded text-sm">
                    <input type="number" 
                           v-model.number="quickTest.lon"
                           placeholder="Boylam"
                           step="any"
                           class="flex-1 p-2 border border-gray-300 rounded text-sm">
                    <button @click="testQuickPoint" 
                            :disabled="!canQuickTest"
                            :class="['px-3 py-2 rounded text-sm font-medium transition-colors',
                                    canQuickTest 
                                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed']">
                        🧪 Test
                    </button>
                </div>
            </div>
        </div>
    `,
    
    computed: {
        canCreateTestPoint() {
            return this.newTestPoint.name && 
                   this.newTestPoint.lat !== null && 
                   this.newTestPoint.lon !== null &&
                   this.newTestPoint.lat >= -90 && this.newTestPoint.lat <= 90 &&
                   this.newTestPoint.lon >= -180 && this.newTestPoint.lon <= 180;
        },
        
        canQuickTest() {
            return this.quickTest.lat !== null && 
                   this.quickTest.lon !== null &&
                   this.quickTest.lat >= -90 && this.quickTest.lat <= 90 &&
                   this.quickTest.lon >= -180 && this.quickTest.lon <= 180;
        }
    },
    
    methods: {
        async createTestPoint() {
            if (!this.canCreateTestPoint) return;
            
            this.isCreating = true;
            try {
                const response = await fetch('/api/admin/testing/test-points', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: this.newTestPoint.name,
                        description: this.newTestPoint.description,
                        lat: this.newTestPoint.lat,
                        lon: this.newTestPoint.lon,
                        category: this.selectedCategory,
                        expected_score: this.newTestPoint.expected_score,
                        created_by: 'admin'
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.$emit('test-point-created', result.test_point);
                    this.resetForm();
                    this.showAddForm = false;
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Test noktası oluşturulamadı');
                }
            } catch (error) {
                console.error('❌ Test point creation failed:', error);
                alert('Test noktası oluşturulamadı: ' + error.message);
            } finally {
                this.isCreating = false;
            }
        },
        
        resetForm() {
            this.newTestPoint = {
                name: '',
                description: '',
                lat: null,
                lon: null,
                expected_score: null
            };
        },
        
        selectTestPoint(point) {
            this.$emit('test-point-selected', point);
        },
        
        testPoint(point) {
            this.$emit('test-point-tested', point);
        },
        
        editTestPoint(point) {
            // Fill form with existing data for editing
            this.newTestPoint = {
                name: point.name,
                description: point.description || '',
                lat: point.lat,
                lon: point.lon,
                expected_score: point.expected_score
            };
            this.showAddForm = true;
        },
        
        async deleteTestPoint(point) {
            if (!confirm(`"${point.name}" test noktasını silmek istediğinizden emin misiniz?`)) {
                return;
            }
            
            try {
                const response = await fetch(`/api/admin/testing/test-points/${point.id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    // Remove from local array (parent will handle the update)
                    console.log('✅ Test point deleted:', point.name);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Test noktası silinemedi');
                }
            } catch (error) {
                console.error('❌ Test point deletion failed:', error);
                alert('Test noktası silinemedi: ' + error.message);
            }
        },
        
        testQuickPoint() {
            if (!this.canQuickTest) return;
            
            const quickPoint = {
                name: 'Hızlı Test',
                description: `Koordinatlar: ${this.quickTest.lat}, ${this.quickTest.lon}`,
                lat: this.quickTest.lat,
                lon: this.quickTest.lon,
                category: this.selectedCategory,
                is_quick_test: true
            };
            
            this.$emit('test-point-tested', quickPoint);
        }
    }
};

const TestPointCard = {
    props: ['point', 'isActive', 'selectedCategory', 'canEdit', 'canDelete'],
    emits: ['select', 'test', 'edit', 'delete'],
    
    computed: {
        isRelevantCategory() {
            return this.point.category === this.selectedCategory;
        },
        
        cardClasses() {
            return [
                'p-3 border rounded-lg cursor-pointer transition-all duration-200',
                this.isActive 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                !this.isRelevantCategory ? 'opacity-50' : ''
            ];
        }
    },
    
    template: `
        <div :class="cardClasses" @click="$emit('select', point)">
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <h5 class="font-medium text-gray-900 text-sm">{{ point.name }}</h5>
                        <span v-if="point.is_predefined" 
                              class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Sistem
                        </span>
                        <span v-if="!isRelevantCategory" 
                              class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {{ point.category }}
                        </span>
                    </div>
                    <p v-if="point.description" class="text-xs text-gray-600 mt-1">
                        {{ point.description }}
                    </p>
                </div>
                
                <div class="flex items-center space-x-1 ml-2">
                    <button @click.stop="$emit('test', point)" 
                            class="text-green-600 hover:text-green-800 text-sm p-1 rounded hover:bg-green-50">
                        🧪
                    </button>
                    <button v-if="canEdit" 
                            @click.stop="$emit('edit', point)" 
                            class="text-blue-600 hover:text-blue-800 text-sm p-1 rounded hover:bg-blue-50">
                        ✏️
                    </button>
                    <button v-if="canDelete" 
                            @click.stop="$emit('delete', point)" 
                            class="text-red-600 hover:text-red-800 text-sm p-1 rounded hover:bg-red-50">
                        🗑️
                    </button>
                </div>
            </div>
            
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span>📍 {{ point.lat.toFixed(6) }}, {{ point.lon.toFixed(6) }}</span>
                <span v-if="point.expected_score" class="font-medium">
                    Beklenen: {{ point.expected_score }}/100
                </span>
            </div>
            
            <div v-if="isActive" class="mt-2 pt-2 border-t border-gray-200">
                <div class="flex items-center justify-center">
                    <span class="text-xs text-blue-600 font-medium">✓ Aktif Test Noktası</span>
                </div>
            </div>
        </div>
    `
};

app.component('test-point-manager', TestPointManager);
app.component('test-point-card', TestPointCard);

const ScoreBreakdown = {
    props: ['currentScore', 'expectedScore', 'selectedCategory', 'mobileMode'],
    emits: ['expand-component'],
    
    data() {
        return {
            expandedComponents: new Set(),
            showSuggestions: true
        }
    },
    
    computed: {
        scoreComponents() {
            if (!this.currentScore || !this.currentScore.breakdown) return [];
            
            const breakdown = this.currentScore.breakdown;
            return [
                {
                    id: 'hospital',
                    name: 'Hastane Yakınlığı',
                    icon: '🏥',
                    score: breakdown.hospital_proximity?.score || 0,
                    weight: breakdown.hospital_proximity?.weight || '30%',
                    explanation: breakdown.hospital_proximity?.explanation || 'Hastane yakınlığı puanı',
                    color: this.getScoreColor(breakdown.hospital_proximity?.score || 0),
                    data: breakdown.hospital_proximity
                },
                {
                    id: 'competitors',
                    name: 'Rekabet Analizi',
                    icon: '🏪',
                    score: breakdown.competitors?.score || 0,
                    weight: breakdown.competitors?.weight || '30%',
                    explanation: breakdown.competitors?.explanation || 'Rakip yoğunluğu analizi',
                    color: this.getScoreColor(breakdown.competitors?.score || 0),
                    data: breakdown.competitors
                },
                {
                    id: 'demographics',
                    name: 'Demografi',
                    icon: '👥',
                    score: breakdown.demographics?.score || 0,
                    weight: breakdown.demographics?.weight || '10%',
                    explanation: breakdown.demographics?.explanation || 'Demografik uygunluk',
                    color: this.getScoreColor(breakdown.demographics?.score || 0),
                    data: breakdown.demographics
                },
                {
                    id: 'important_places',
                    name: 'Önemli Yerler',
                    icon: '🚇',
                    score: breakdown.important_places?.score || 0,
                    weight: breakdown.important_places?.weight || '30%',
                    explanation: breakdown.important_places?.explanation || 'Metro, üniversite, AVM yakınlığı',
                    color: this.getScoreColor(breakdown.important_places?.score || 0),
                    data: breakdown.important_places
                }
            ];
        },
        
        scoreDifference() {
            if (!this.expectedScore || !this.currentScore) return null;
            const diff = this.currentScore.total_score - this.expectedScore;
            return {
                value: diff,
                text: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
                isPositive: diff > 0,
                isSignificant: Math.abs(diff) > 10
            };
        },
        
        suggestions() {
            if (!this.currentScore) return [];
            
            const suggestions = [];
            const components = this.scoreComponents;
            
            // Low score suggestions
            components.forEach(comp => {
                if (comp.score < 40) {
                    switch (comp.id) {
                        case 'hospital':
                            suggestions.push('Hastane yakınlığı düşük. Hastane parametrelerini optimize edin.');
                            break;
                        case 'competitors':
                            suggestions.push('Rakip yoğunluğu yüksek. Farklı bir lokasyon düşünün.');
                            break;
                        case 'important_places':
                            suggestions.push('Önemli yerlere uzak. Metro ve AVM parametrelerini artırın.');
                            break;
                    }
                }
            });
            
            // Overall score suggestions
            if (this.currentScore.total_score < 50) {
                suggestions.push('Genel skor düşük. Tüm parametreleri gözden geçirin.');
            }
            
            // Score difference suggestions
            if (this.scoreDifference && this.scoreDifference.isSignificant) {
                if (this.scoreDifference.isPositive) {
                    suggestions.push('Skor beklentiden yüksek! İyi bir lokasyon.');
                } else {
                    suggestions.push('Skor beklentiden düşük. Parametreleri optimize edin.');
                }
            }
            
            return suggestions;
        }
    },
    
    template: `
>
            <div class="mb-6">
                <h3 class="fontenter">
                    📊 Skor Analizi
              
                        {{ curren}
                    </span>
                </h3>
                
                <div v-if="!currentScore>
                    <div class="text-6xl mb-4">🎯</div>
                  in</p>
                    <p class="text-gray-p>
             v>
         v>

   ">
lay -->
                
                    <div">
b-2">
                            {{ Math.round(currentScore.total_score) }onent); ScoreCompcomponent',t('score-omponen;
app.cBreakdown)Scoreeakdown', ore-brmponent('sc
        formatDistance(distance) {
            if (distance < 100) {
                return `${Math.round(distance)}m`;
            } else {
                return `${(distance / 1000).toFixed(1)}km`;
            }
        }
    },
    
    template: `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div class="flex justify-between items-center cursor-pointer" @click="$emit('toggle-expand')">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">{{ component.icon }}</span>
                    <div>
                        <h5 class="font-medium text-gray-900">{{ component.name }}</h5>
                        <p class="text-xs text-gray-500">{{ component.explanation }}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="text-right">
                        <div class="font-bold text-lg" :style="{ color: component.color }">
                            {{ Math.max(5, Math.min(100, component.score)) }}/100
                        </div>
                        <div class="text-xs text-gray-500">{{ component.weight }}%</div>
                    </div>
                    <span class="text-gray-400 cursor-pointer">{{ isExpanded ? '🔽' : '▶️' }}</span>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="mt-3 mb-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-300" 
                         :style="{ width: progressWidth + '%', backgroundColor: component.color }">
                    </div>
                </div>
            </div>
            
            <!-- Expanded Details -->
            <div v-if="isExpanded" class="mt-4 pt-4 border-t border-gray-200">
                <div class="space-y-3">
                    <!-- Raw Score Info -->
                    <div v-if="component.data?.raw_score !== undefined">
                        <span class="text-sm font-medium">Ham Puan:</span>
                        <span class="text-sm text-gray-600 ml-1">{{ component.data.raw_score.toFixed(2) }}</span>
                    </div>
                    
                    <!-- Distance Info -->
                    <div v-if="component.data?.distance">
                        <span class="text-sm font-medium">En Yakın Mesafe:</span>
                        <span class="text-sm text-gray-600 ml-1">{{ formatDistance(component.data.distance) }}</span>
                    </div>
                    
                    <!-- Details List -->
                    <div v-if="component.data?.details && component.data.details.length > 0">
                        <div class="text-sm font-medium text-gray-700 mb-2">Detaylar:</div>
                        <div class="max-h-32 overflow-y-auto space-y-1">
                            <div v-for="(detail, index) in component.data.details.slice(0, 5)" :key="index" 
                                 class="text-xs bg-gray-50 p-2 rounded flex justify-between">
                                <span>{{ detail.name || detail.ad || 'Bilinmeyen' }}</span>
                                <span class="font-mono">{{ detail.distance || detail.mesafe || '' }}</span>
                            </div>
                            <div v-if="component.data.details.length > 5" class="text-xs text-gray-500 mt-2">
                                ve {{ component.data.details.length - 5 }} tane daha...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`                  
  ls List -->tai De    <!--                        
          >
     </div           
      nce) }}t.data.distace(componenatDistan> {{ form:</spanakın MesafeEn Ymedium">lass="font- <span c                     y-600">
  text-gra"text-sm   class=                    " 
   .distancea?.datonentcompv v-if="   <di               
  ->nce Info - Dista <!--                    
           
         </div>             }}
      ixed(2) score.toFt.data.raw_ {{ componenPuan:</span>">Ham t-medium"fonass=    <span cl                    >
y-600" text-gra="text-smlass c                 
        ndefined"!== ure .raw_scont.data?if="compone <div v-                 
  fo -->aw Score In- R   <!-              y-3">
   e-class="spacv  <di               y-200">
order-grader-t bbor4 pt-4 s="mt-ed" claspand"isEx<div v-if=       s -->
     DetailExpanded   <!--                 
         </div>
        iv>
          </d>
              </div            r }">
 ponent.colo comdColor:roun'%', backgsWidth + rogres: pwidth="{      :style                   0" 
 ation-30urtion-all dll transied-fu-2 round"hlass=     <div c         
      -full h-2">00 roundedll bg-gray-2w-fuiv class="      <d         mb-2">
 ss="mt-3  cla   <div      -->
};

const ScoreComponent = {
    props: ['component', 'isExpanded'],
    emits: ['toggle-expand'],
    
    computed: {
        progressWidth() {
            return Math.max(5, Math.min(100, this.component.score));
        }
    },
    
    methods: {
        optimizeParameter() {
            // TODO: Implement parameter optimization
            alert('Parametre optimizasyonu yakında eklenecek!');
        },
        
        compareWithOthers() {
            // TODO: Implement comparison with other points
            alert('Karşılaştırma özelliği yakında eklenecek!');
        }
    }
       )[0]}.jsonplit('T'tring().s.toISOS${new Date()ry}_\ctedCatego{this.selereport_\$\`score_ = a.download            rl;
ref = u   a.h       ('a');
  eElementcreatent. documst a = con         lob);
  ectURL(bteObjRL.creast url = U      con     n' });
 cation/jsotype: 'appli { ull, 2)],eport, nngify(rb([JSON.striob = new Blot bl      cons          
 };
            
       gestionss: this.suguggestion        sn,
        dowakore.brerrentSccuis.down: threak           b   },
          
        xpectedScoreed: this.ect   expe                 category,
re.contS.currehis category: t                   
re,_scoore.totalurrentSchis.c total:           t       score: {
                    },
         e
     hallntScore.mathis.curree:    mahall               n,
  ntScore.lohis.curre: t         lon          re.lat,
 tScorren: this.cu         lat          cation: {
 lo                ry,
ectedCategos.selry: thitegoca         (),
       ringte().toISOSt Danewp: tam times            {
    rt =nst repo          co 
            n;
 ) returcores.currentShi(!t    if        () {
 ScoreReport    export   
         ,
;
        getCategoryName(category) {
            const categoryMap = {
                'eczane': 'Eczane',
                'cafe': 'Cafe',
                'restoran': 'Restoran',
                'market': 'Market',
                'firin': 'Fırın'
            };
            return categoryMap[category] || category;
        },
        
        getScoreColor(score) {
            if (score >= 80) return '#10b981'; // green
            if (score >= 60) return '#f59e0b'; // yellow
            if (score >= 40) return '#f97316'; // orange
            return '#ef4444'; // red
        },
        
        toggleExpand(componentId) {
            if (this.expandedComponents.has(componentId)) {
                this.expandedComponents.delete(componentId);
            } else {
                this.expandedComponents.add(componentId);
            }
        }
    }
};

// Register all components
app.component('parameter-manager', ParameterManager);
app.component('weight-configuration', WeightConfiguration);
app.component('parameter-group', ParameterGroup);
app.component('visual-map', VisualMap);
app.component('test-point-manager', TestPointManager);
app.component('test-point-card', TestPointCard);
app.component('score-breakdown', ScoreBreakdown);
app.component('score-component', ScoreComponent);

// Simple modal components
app.component('performance-monitor', {
    props: ['performanceData'],
    template: `<div class="text-sm text-gray-500">⚡ {{ Math.round(performanceData.lastScoringTime) }}ms</div>`
});

app.component('history-controls', {
    emits: ['revert', 'show-history'],
    template: `<button @click="$emit('show-history')" class="text-sm text-blue-600 hover:text-blue-800">📜 Geçmiş</button>`
});

app.component('export-controls', {
    emits: ['export', 'import'],
    template: `
        <div class="flex space-x-2">
            <button @click="$emit('export')" class="text-sm text-green-600 hover:text-green-800">📤 Dışa Aktar</button>
            <button @click="$emit('import')" class="text-sm text-blue-600 hover:text-blue-800">📥 İçe Aktar</button>
        </div>`
});

app.component('component-detail-modal', {
    props: ['componentData'],
    emits: ['close'],
    template: `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')"><div class="bg-white p-6 rounded-lg" @click.stop><h3>Component Detail</h3><button @click="$emit('close')" class="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Close</button></div></div>`
});

app.component('history-modal', {
    props: ['historyData'],
    emits: ['close', 'revert'],
    template: `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')"><div class="bg-white p-6 rounded-lg max-w-2xl" @click.stop><h3>Parameter History</h3><p>History data will be shown here</p><button @click="$emit('close')" class="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Close</button></div></div>`
});

app.component('import-modal', {
    emits: ['close', 'import'],
    template: `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')"><div class="bg-white p-6 rounded-lg" @click.stop><h3>Import Parameters</h3><input type="file" accept=".json" @change="handleFileSelect"><button @click="$emit('close')" class="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Close</button></div></div>`,
    methods: {
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.$emit('import', e.target.result);
                };
                reader.readAsText(file);
            }
        }
    }
});

// Mount the application
app.mount('#admin-app');

console.log('🎯 Advanced Admin Panel Vue.js application mounted successfully!');
          </div>               >
        </span-80">/100opacityxt-2xl n class="tepa}<sold m-bfont5xl ss="text-cla    <div                     terext-cen="tss clag">hadow-ld-lg snde rou-white p-6extisplay tore-dss="sc<div clare Displl Sco!-- Overa         <       space-y-6lass="" ctScoreurren-if="civ v   <d        </di </di   çin</ sestesindenktası li test nolayın veyaa tıkayokt bir nitadant-sm">Har400 tex noktası seç test2">Birlg mb-ext-y-500 tra="text-glass  <p cpy-12"r centet-"texlass= c"e.mahalle }tScor">ext-gray-500m ttext-sl-2 "mass=re" clcurrentScof=" v-ian      <spex items-c0 mb-2 fltext-gray-90-semibold uto"erflow-y-a6 h-full ov"p-=class   <div      emplate:  ttionsax 5 sugges(0, 5); // Mlice                     olabilir.')ötümserk kametreler ço düşük. Pareklenendensh('Skor bns.pustioggeur olabilir.'se iyim çokerarametreln yüksek. Pnder beklenence.isPoserence.isSignifferereDifs.scohince && tcoreDifferes.sif (thi            coual sected vs act      // Exp       i                         brea                    t_places'n geçirin.')deni gözmetreleri para düzeyive geliri Yaş profilluk düşük. uygunografik ('Dems.pushtiongesug          s                  ics':phgraase 'demo c                    leyin. eke kuralınimum mesafya mizaltın ve ap etkisiniip var. Rakik fazla rakÇons.push('gestio                          ın.')ni artır

app.component('performance-monitor', {
    props: ['performanceData'],
    template: `<div class="text-sm text-gray-500">⚡ {{ Math.round(performanceData.lastScoringTime) }}ms</div>`
});

app.component('history-controls', {
    emits: ['revert', 'show-history'],
    template: `<button @click="$emit('show-history')" class="text-sm text-blue-600 hover:text-blue-800">📜 Geçmiş</button>`
});

app.component('export-controls', {
    emits: ['export', 'import'],
    template: `
        <div class="flex space-x-2">
            <button @click="$emit('export')" class="text-sm text-green-600 hover:text-green-800">📤 Dışa Aktar</button>
            <button @click="$emit('import')" class="text-sm text-blue-600 hover:text-blue-800">📥 İçe Aktar</button>
        </div>
    `
});

// Modal components (placeholders)
app.component('component-detail-modal', {
    props: ['componentData'],
    emits: ['close'],
    template: `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')"><div class="bg-white p-6 rounded-lg" @click.stop><h3>Component Detail</h3><button @click="$emit('close')" class="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Close</button></div></div>`
});

app.component('history-modal', {
    props: ['historyData'],
    emits: ['close', 'revert'],
    template: `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')"><div class="bg-white p-6 rounded-lg max-w-2xl" @click.stop><h3>Parameter History</h3><p>History data will be shown here</p><button @click="$emit('close')" class="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Close</button></div></div>`
});

app.component('import-modal', {
    emits: ['close', 'import'],
    template: `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="$emit('close')"><div class="bg-white p-6 rounded-lg" @click.stop><h3>Import Parameters</h3><input type="file" accept=".json" @change="handleFileSelect"><button @click="$emit('close')" class="mt-4 px-4 py-2 bg-gray-500 text-white rounded">Close</button></div></div>`,
    methods: {
        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.$emit('import', e.target.result);
                };
                reader.readAsText(file);
            }
        }
    }
});

// Mount the app
app.mount('#admin-app');

console.log('🎯 Advanced Scoring Control Panel loaded successfully');
const
 ScoreBreakdown = {
    props: ['currentScore', 'expectedScore', 'selectedCategory', 'mobileMode'],
    emits: ['expand-component'],
    
    data() {
        return {
            expandedComponents: new Set(),
            showSuggestions: true
        }
    },
    
    computed: {
        scoreComponents() {
            if (!this.currentScore || !this.currentScore.breakdown) return [];
            
            const breakdown = this.currentScore.breakdown;
            return [
                {
                    id: 'hospital',
                    name: 'Hastane Yakınlığı',
                    icon: '🏥',
                    score: breakdown.hospital_proximity?.score || 0,
                    weight: breakdown.hospital_proximity?.weight || '30%',
                    explanation: breakdown.hospital_proximity?.explanation || 'Hastane yakınlığı puanı',
                    color: this.getScoreColor(breakdown.hospital_proximity?.score || 0),
                    data: breakdown.hospital_proximity
                },
                {
                    id: 'competitors',
                    name: 'Rekabet Analizi',
                    icon: '🏪',
                    score: breakdown.competitors?.score || 0,
                    weight: breakdown.competitors?.weight || '30%',
                    explanation: breakdown.competitors?.explanation || 'Rakip yoğunluğu analizi',
                    color: this.getScoreColor(breakdown.competitors?.score || 0),
                    data: breakdown.competitors
                },
                {
                    id: 'demographics',
                    name: 'Demografi',
                    icon: '👥',
                    score: breakdown.demographics?.score || 0,
                    weight: breakdown.demographics?.weight || '10%',
                    explanation: breakdown.demographics?.explanation || 'Demografik uygunluk',
                    color: this.getScoreColor(breakdown.demographics?.score || 0),
                    data: breakdown.demographics
                },
                {
                    id: 'important_places',
                    name: 'Önemli Yerler',
                    icon: '🚇',
                    score: breakdown.important_places?.score || 0,
                    weight: breakdown.important_places?.weight || '30%',
                    explanation: breakdown.important_places?.explanation || 'Metro, üniversite, AVM yakınlığı',
                    color: this.getScoreColor(breakdown.important_places?.score || 0),
                    data: breakdown.important_places
                }
            ];
        },
        
        scoreDifference() {
            if (!this.expectedScore || !this.currentScore) return null;
            const diff = this.currentScore.total_score - this.expectedScore;
            return {
                value: diff,
                text: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
                isPositive: diff > 0,
                isSignificant: Math.abs(diff) > 10
            };
        },
        
        suggestions() {
            if (!this.currentScore) return [];
            
            const suggestions = [];
            const components = this.scoreComponents;
            
            // Low score suggestions
            components.forEach(comp => {
                if (comp.score < 40) {
                    switch (comp.id) {
                        case 'hospital':
                            suggestions.push('Hastane yakınlığı düşük. Hastane parametrelerini artırın.');
                            break;
                        case 'competitors':
                            suggestions.push('Çok fazla rakip var. Rakip etkisini azaltın veya minimum mesafe kuralı ekleyin.');
                            break;
                        case 'demographics':
                            suggestions.push('Demografik uygunluk düşük. Yaş profili ve gelir düzeyi parametrelerini gözden geçirin.');
                            break;
                        case 'important_places':
                            suggestions.push('Önemli yerlere uzak. Metro ve AVM parametrelerini artırın.');
                            break;
                    }
                }
            });
            
            // Overall score suggestions
            if (this.currentScore.total_score < 50) {
                suggestions.push('Genel skor düşük. Tüm parametreleri gözden geçirin.');
            }
            
            // Expected vs actual score
            if (this.scoreDifference && this.scoreDifference.isSignificant) {
                if (this.scoreDifference.isPositive) {
                    suggestions.push('Skor beklenenden yüksek. Parametreler çok iyimser olabilir.');
                } else {
                    suggestions.push('Skor beklenenden düşük. Parametreler çok kötümser olabilir.');
                }
            }
            
            return suggestions.slice(0, 5); // Max 5 suggestions
        }
    },
    
    template: `
        <div class="p-6 h-full overflow-y-auto">
            <div class="mb-6">
                <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                    📊 Skor Analizi
                    <span v-if="currentScore" class="ml-2 text-sm text-gray-500">
                        {{ currentScore.mahalle }}
                    </span>
                </h3>
                
                <div v-if="!currentScore" class="text-center py-12">
                    <div class="text-6xl mb-4">🎯</div>
                    <p class="text-gray-500 text-lg mb-2">Bir test noktası seçin</p>
                    <p class="text-gray-400 text-sm">Haritadan bir noktaya tıklayın veya test noktası listesinden seçin</p>
                </div>
            </div>

            <div v-if="currentScore" class="space-y-6">
                <!-- Overall Score Display -->
                <div class="score-display text-white p-6 rounded-lg shadow-lg">
                    <div class="text-center">
                        <div class="text-5xl font-bold mb-2">
                            {{ Math.round(currentScore.total_score) }}<span class="text-2xl opacity-80">/100</span>
                        </div>
                        <div class="text-xl mb-2">
                            {{ currentScore.emoji }} {{ currentScore.category }}
                        </div>
                        <div class="text-sm opacity-90">
                            {{ getCategoryName(selectedCategory) }} için uygunluk skoru
                        </div>
                    </div>
                </div>

                <!-- Score Components -->
                <div class="space-y-4">
                    <h4 class="font-medium text-gray-900 mb-3">🔍 Detaylı Analiz</h4>
                    <score-component 
                        v-for="component in scoreComponents"
                        :key="component.id"
                        :component="component"
                        :is-expanded="expandedComponents.has(component.id)"
                        @toggle-expand="toggleExpand(component.id)"
                        @expand-detail="$emit('expand-component', component)">
                    </score-component>
                </div>

                <!-- Expected vs Actual Comparison -->
                <div v-if="expectedScore" class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 class="font-medium text-yellow-800 mb-3 flex items-center">
                        🎯 Beklenen Skorla Karşılaştırma
                    </h4>
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-sm text-gray-600 mb-1">Beklenen</div>
                            <div class="text-lg font-bold text-yellow-700">{{ expectedScore }}/100</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">Gerçek</div>
                            <div class="text-lg font-bold text-yellow-700">{{ Math.round(currentScore.total_score) }}/100</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">Fark</div>
                            <div :class="['text-lg font-bold', 
                                        scoreDifference.isPositive ? 'text-green-600' : 'text-red-600']">
                                {{ scoreDifference.text }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AI Suggestions -->
                <div v-if="suggestions.length > 0 && showSuggestions" class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-medium text-blue-800 flex items-center">
                            🤖 AI Önerileri
                        </h4>
                        <button @click="showSuggestions = false" 
                                class="text-blue-600 hover:text-blue-800 text-sm">
                            ✕
                        </button>
                    </div>
                    <ul class="text-sm text-blue-700 space-y-2">
                        <li v-for="(suggestion, index) in suggestions" :key="index" 
                            class="flex items-start space-x-2">
                            <span class="text-blue-500 mt-0.5">•</span>
                            <span>{{ suggestion }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    
    methods: {
        toggleExpand(componentId) {
            if (this.expandedComponents.has(componentId)) {
                this.expandedComponents.delete(componentId);
            } else {
                this.expandedComponents.add(componentId);
            }
        },
        
        getScoreColor(score) {
            if (score >= 80) return '#10b981'; // green
            if (score >= 60) return '#f59e0b'; // yellow
            if (score >= 40) return '#f97316'; // orange
            return '#ef4444'; // red
        },
        
        getCategoryName(category) {
            const categoryMap = {
                'eczane': 'Eczane',
                'cafe': 'Cafe',
                'restoran': 'Restoran',
                'market': 'Market',
                'firin': 'Fırın'
            };
            return categoryMap[category] || category;
        }
    }
};

const ScoreComponent = {
    props: ['component', 'isExpanded'],
    emits: ['toggle-expand', 'expand-detail'],
    
    computed: {
        progressWidth() {
            return Math.max(5, Math.min(100, this.component.score));
        }
    },
    
    template: `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div class="flex justify-between items-center cursor-pointer" 
                 @click="$emit('toggle-expand')">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">{{ component.icon }}</span>
                    <div>
                        <h5 class="font-medium text-gray-900">{{ component.name }}</h5>
                        <p class="text-xs text-gray-500">{{ component.explanation }}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="text-right">
                        <div class="font-bold text-lg" :style="{ color: component.color }">
                            {{ Math.round(component.score) }}/100
                        </div>
                        <div class="text-xs text-gray-500">{{ component.weight }}</div>
                    </div>
                    <span class="text-gray-400">{{ isExpanded ? '🔽' : '▶️' }}</span>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="mt-3 mb-2">
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-300" 
                         :style="{ width: progressWidth + '%', backgroundColor: component.color }">
                    </div>
                </div>
            </div>
            
            <!-- Expanded Details -->
            <div v-if="isExpanded" class="mt-4 pt-4 border-t border-gray-200">
                <div class="space-y-3">
                    <div v-if="component.data?.raw_score !== undefined" 
                         class="text-sm text-gray-600">
                        <span class="font-medium">Ham Puan:</span> {{ component.data.raw_score.toFixed(2) }}
                    </div>
                    
                    <div v-if="component.data?.distance" 
                         class="text-sm text-gray-600">
                        <span class="font-medium">En Yakın Mesafe:</span> {{ formatDistance(component.data.distance) }}
                    </div>
                    
                    <button @click="$emit('expand-detail')" 
                            class="w-full mt-3 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors">
                        🔍 Detaylı Analiz
                    </button>
                </div>
            </div>
        </div>
    `,
    
    methods: {
        formatDistance(distance) {
            if (distance < 1000) {
                return `${Math.round(distance)}m`;
            } else {
                return `${(distance / 1000).toFixed(1)}km`;
            }
        }
    }
};

// Update component registrations
app.component('score-breakdown', ScoreBreakdown);
app.component('score-component', ScoreComponent);