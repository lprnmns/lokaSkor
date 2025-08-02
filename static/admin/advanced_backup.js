/**
 * Advanced Scoring Control Panel - Simplified Working Version
 */

const { createApp } = Vue;

// Main Vue Application
const AdminApp = {
    data() {
        return {
            isLoading: false,
            loadingMessage: 'Yükleniyor...',
            categories: [
                { id: 'eczane', name: 'Eczane', emoji: '💊' },
                { id: 'cafe', name: 'Cafe', emoji: '☕' },
                { id: 'restoran', name: 'Restoran', emoji: '🍽️' },
                { id: 'market', name: 'Market', emoji: '🛒' },
                { id: 'firin', name: 'Fırın', emoji: '🍞' }
            ],
            selectedCategory: 'eczane',
            parameters: [],
            categoryWeights: {},
            testPoints: [],
            currentScore: null,
            expectedScore: null,
            activeTestPoint: null,
            saveStatus: null,
            showMobileMenu: false,
            activeMobileTab: 'parameters',
            
            // Modal states
            showComponentModal: false,
            showHistoryModal: false,
            showImportModal: false,
            selectedComponent: null,
            historyData: [],
            
            // Performance data
            performanceData: {
                lastScoringTime: 0,
                averageScoringTime: 0,
                totalRequests: 0
            },
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
            
            setTimeout(() => {
                this.saveStatus = null;
            }, 3000);
        },
        
        showError(message) {
            alert('❌ Hata: ' + message);
        },
        
        async onTestPointTested(testPointData) {
            this.currentScore = testPointData.result;
            this.activeTestPoint = testPointData;
            console.log('✅ Test point result received:', testPointData.result);
        },
        
        // Placeholder methods for template compatibility
        async onParameterUpdated(parameter) {
            console.log('Parameter updated:', parameter);
            
            try {
                // Send parameter update to backend
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
                    console.log(`✅ Parameter "${parameter.parameter_name}" updated to ${parameter.max_score} on backend`);
                    
                    // Clear current score to force re-calculation with new parameters
                    this.currentScore = null;
                    this.activeTestPoint = null;
                    
                    // Clear map markers if they exist
                    if (this.map && this.markersLayer) {
                        this.markersLayer.clearLayers();
                    }
                    
                    // Show success notification
                    this.setSaveStatus('saved', `${parameter.parameter_name} güncellendi - Yeni test için haritaya tıklayın`, 'text-green-600', 'bg-green-400');
                    
                    console.log('💡 Parameter update complete. Next scoring will use new values.');
                } else {
                    console.error('❌ Parameter update failed');
                    this.setSaveStatus('error', 'Parametre güncellenemedi', 'text-red-600', 'bg-red-400');
                }
            } catch (error) {
                console.error('❌ Parameter update error:', error);
                this.setSaveStatus('error', 'Bağlantı hatası', 'text-red-600', 'bg-red-400');
            }
        },
        
        async onWeightsUpdated(weights) {
            console.log('Weights updated:', weights);
            
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
                    console.log('✅ Weights updated on backend');
                    
                    // Clear current score to force re-calculation with new weights
                    this.currentScore = null;
                    this.activeTestPoint = null;
                    
                    // Clear map markers if they exist
                    if (this.map && this.markersLayer) {
                        this.markersLayer.clearLayers();
                    }
                    
                    this.setSaveStatus('saved', 'Ağırlıklar güncellendi - Yeni test için haritaya tıklayın', 'text-green-600', 'bg-green-400');
                    
                    console.log('💡 Weight update complete. Next scoring will use new values.');
                } else {
                    console.error('❌ Weights update failed');
                    this.setSaveStatus('error', 'Ağırlıklar güncellenemedi', 'text-red-600', 'bg-red-400');
                }
            } catch (error) {
                console.error('❌ Weights update error:', error);
                this.setSaveStatus('error', 'Bağlantı hatası', 'text-red-600', 'bg-red-400');
            }
        },
        
        async onTestPointCreated(testPoint) {
            console.log('Test point created:', testPoint);
        },
        
        async onTestPointSelected(testPoint) {
            console.log('Test point selected:', testPoint);
        },
        
        async onMapPointClicked(lat, lon) {
            console.log(`🎯 Advanced Admin - Map point clicked: ${lat.toFixed(6)}, ${lon.toFixed(6)} for category: ${this.selectedCategory}`);
            
            // Set active test point
            this.activeTestPoint = {
                lat: lat,
                lon: lon,
                name: 'Harita Testi'
            };
            
            // Score the point using the admin testing endpoint that uses current parameters
            try {
                const response = await fetch('/api/admin/testing/score-point', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        lat: lat,
                        lon: lon,
                        category: this.selectedCategory
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ Advanced Admin - Score result:`, result);
                    console.log(`📊 Advanced Admin - Final score: ${Math.round(result.total_score || result.normalized_score || 0)}/100`);
                    
                    this.currentScore = result;
                    
                    // Update performance metrics if available
                    if (result.performance) {
                        this.performanceData.lastScoringTime = result.performance.scoring_time_ms;
                        this.performanceData.totalRequests++;
                        
                        // Calculate running average
                        if (this.performanceData.totalRequests === 1) {
                            this.performanceData.averageScoringTime = result.performance.scoring_time_ms;
                        } else {
                            this.performanceData.averageScoringTime = 
                                (this.performanceData.averageScoringTime * (this.performanceData.totalRequests - 1) + 
                                 result.performance.scoring_time_ms) / this.performanceData.totalRequests;
                        }
                    }
                    
                    console.log('✅ Advanced Admin - Map point scored with current parameters:', result);
                } else {
                    const error = await response.json();
                    console.error('❌ Scoring failed:', error);
                    alert('❌ Hata: ' + (error.error || 'Bilinmeyen hata'));
                }
            } catch (error) {
                console.error('❌ Scoring error:', error);
                alert('❌ Hata: ' + error.message);
            }
        },
        
        onExpandComponent(component) {
            console.log('Component expanded:', component);
        },
        
        async revertChanges() {
            console.log('Revert changes requested');
        },
        
        showHistory() {
            console.log('Show history requested');
        },
        
        async exportParameters() {
            console.log('Export parameters requested');
        },
        
        async importParameters() {
            console.log('Import parameters requested');
        },
        
        getDefaultParameters() {
            return [
                {
                    id: 1,
                    category: this.selectedCategory,
                    parameter_name: 'Hastane Yakınlığı',
                    parameter_type: 'distance',
                    max_score: 100,
                    effect_distance: 2000,
                    log_coefficient: 2.0,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 2,
                    category: this.selectedCategory,
                    parameter_name: 'Rekabet Analizi',
                    parameter_type: 'distance',
                    max_score: -50,
                    effect_distance: 500,
                    log_coefficient: 1.5,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 3,
                    category: this.selectedCategory,
                    parameter_name: 'Demografi',
                    parameter_type: 'demographic',
                    max_score: 50,
                    effect_distance: null,
                    log_coefficient: null,
                    categorical_values: {
                        'yaşlı_nüfus': 30,
                        'genç_nüfus': 20,
                        'gelir_seviyesi': 25
                    },
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 4,
                    category: this.selectedCategory,
                    parameter_name: 'Metro Yakınlığı',
                    parameter_type: 'distance',
                    max_score: 80,
                    effect_distance: 1000,
                    log_coefficient: 2.5,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 5,
                    category: this.selectedCategory,
                    parameter_name: 'AVM Yakınlığı',
                    parameter_type: 'distance',
                    max_score: 60,
                    effect_distance: 1500,
                    log_coefficient: 2.0,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
        },
        
        async loadCategoryData() {
            this.setLoading(true, 'Kategori verileri yükleniyor...');
            
            try {
                // Clear current score when changing category
                this.currentScore = null;
                this.activeTestPoint = null;
                
                const [parametersResponse, weightsResponse] = await Promise.all([
                    fetch(`/api/admin/parameters/${this.selectedCategory}/list`),
                    fetch(`/api/admin/weights/${this.selectedCategory}`)
                ]);
                
                if (parametersResponse.ok) {
                    this.parameters = await parametersResponse.json();
                } else {
                    console.warn('Parameters API not available, using default parameters');
                    this.parameters = this.getDefaultParameters();
                }
                
                if (weightsResponse.ok) {
                    this.categoryWeights = await weightsResponse.json();
                } else {
                    console.warn('Weights API not available, using defaults');
                    this.categoryWeights = {
                        hospital_weight: 0.30,
                        competitor_weight: 0.30,
                        demographics_weight: 0.10,
                        important_places_weight: 0.30
                    };
                }
                
                console.log(`✅ Loaded data for category: ${this.selectedCategory}`);
            } catch (error) {
                console.error('❌ Failed to load category data:', error);
                // Don't show error for API endpoints that might not exist yet
                console.warn('Some API endpoints may not be available yet');
            } finally {
                this.setLoading(false);
            }
        }
    }
};

// EditableInput Component - Click to edit input fields
const EditableInput = {
    props: {
        value: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            default: 'parameter' // 'parameter', 'weight', 'distance'
        },
        min: {
            type: Number,
            default: undefined
        },
        max: {
            type: Number,
            default: undefined
        },
        step: {
            type: Number,
            default: 0.1
        },
        suffix: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: ''
        }
    },
    emits: ['update:value'],
    
    template: `
        <div class="relative inline-block">
            <!-- Display Mode -->
            <div v-if="!isEditing" 
                 @click="startEdit"
                 :class="[
                     'px-2 py-1 border rounded cursor-pointer hover:bg-gray-50 transition-colors',
                     'min-w-[60px] text-center',
                     isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
                 ]">
                <span class="font-mono text-sm">{{ displayValue }}{{ suffix }}</span>
            </div>
            
            <!-- Edit Mode -->
            <div v-else class="relative">
                <input 
                    ref="input"
                    v-model="localValue"
                    @blur="finishEdit"
                    @keydown.enter="finishEdit"
                    @keydown.escape="cancelEdit"
                    @input="validateInput"
                    :class="[
                        'px-2 py-1 border rounded text-center font-mono text-sm',
                        'min-w-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500',
                        isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
                    ]"
                    :placeholder="placeholder"
                    type="number"
                    :step="step"
                    :min="min"
                    :max="max"
                />
                
                <!-- Error tooltip -->
                <div v-if="!isValid && errorMessage" 
                     class="absolute z-10 px-2 py-1 text-xs text-white bg-red-600 rounded shadow-lg -top-8 left-0 whitespace-nowrap">
                    {{ errorMessage }}
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            isEditing: false,
            localValue: this.value,
            originalValue: this.value,
            isValid: true,
            errorMessage: ''
        }
    },
    
    computed: {
        displayValue() {
            if (this.type === 'weight') {
                return Math.round(this.value);
            }
            return this.value;
        }
    },
    
    watch: {
        value(newValue) {
            this.localValue = newValue;
            this.originalValue = newValue;
        }
    },
    
    methods: {
        startEdit() {
            this.isEditing = true;
            this.originalValue = this.value;
            this.localValue = this.type === 'weight' ? Math.round(this.value) : this.value;
            
            this.$nextTick(() => {
                if (this.$refs.input) {
                    this.$refs.input.focus();
                    this.$refs.input.select();
                }
            });
        },
        
        finishEdit() {
            if (this.isValidValue(this.localValue)) {
                const finalValue = this.type === 'weight' ? 
                    parseFloat(this.localValue) : 
                    parseFloat(this.localValue);
                    
                this.$emit('update:value', finalValue);
                this.isEditing = false;
                this.isValid = true;
                this.errorMessage = '';
            } else {
                // Show error but don't close edit mode
                this.isValid = false;
            }
        },
        
        cancelEdit() {
            this.isEditing = false;
            this.localValue = this.originalValue;
            this.isValid = true;
            this.errorMessage = '';
        },
        
        validateInput() {
            this.isValid = this.isValidValue(this.localValue);
            if (!this.isValid) {
                this.errorMessage = this.getErrorMessage(this.localValue);
            } else {
                this.errorMessage = '';
            }
        },
        
        isValidValue(value) {
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            if (this.min !== undefined && num < this.min) return false;
            if (this.max !== undefined && num > this.max) return false;
            return true;
        },
        
        getErrorMessage(value) {
            const num = parseFloat(value);
            if (isNaN(num)) return 'Geçerli bir sayı girin';
            if (this.min !== undefined && num < this.min) return `Minimum değer: ${this.min}`;
            if (this.max !== undefined && num > this.max) return `Maksimum değer: ${this.max}`;
            return 'Geçersiz değer';
        }
    }
};

// Simple components
const ParameterManager = {
    props: ['selectedCategory', 'parameters', 'categoryWeights'],
    emits: ['parameter-updated', 'weights-updated'],
    
    template: `
        <div class="p-6">
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    ⚙️ Parametre Yönetimi
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
                                <editable-input 
                                    :value="Math.round(localWeights.hospital_weight * 100)"
                                    type="weight"
                                    :min="0"
                                    :max="100"
                                    :step="1"
                                    suffix="%"
                                    @update:value="updateWeightValue('hospital_weight', $event)"
                                    class="w-16"
                                />
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
                                <editable-input 
                                    :value="Math.round(localWeights.competitor_weight * 100)"
                                    type="weight"
                                    :min="0"
                                    :max="100"
                                    :step="1"
                                    suffix="%"
                                    @update:value="updateWeightValue('competitor_weight', $event)"
                                    class="w-16"
                                />
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
                                <editable-input 
                                    :value="Math.round(localWeights.demographics_weight * 100)"
                                    type="weight"
                                    :min="0"
                                    :max="100"
                                    :step="1"
                                    suffix="%"
                                    @update:value="updateWeightValue('demographics_weight', $event)"
                                    class="w-16"
                                />
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
                                <editable-input 
                                    :value="Math.round(localWeights.important_places_weight * 100)"
                                    type="weight"
                                    :min="0"
                                    :max="100"
                                    :step="1"
                                    suffix="%"
                                    @update:value="updateWeightValue('important_places_weight', $event)"
                                    class="w-16"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <!-- Weight Validation -->
                    <div class="mt-4 p-3 rounded-lg" :class="totalWeight === 100 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'">
                        <div class="flex items-center space-x-2">
                            <span>{{ totalWeight === 100 ? '✅' : '⚠️' }}</span>
                            <span class="text-sm">
                                {{ getWeightValidationMessage() }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Parameters List -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="font-medium text-gray-900">📋 Parametre Listesi</h4>
                    <button @click="addNewParameter" 
                            class="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
                        ➕ Yeni Ekle
                    </button>
                </div>
                
                <div v-if="parameters && parameters.length > 0" class="space-y-3">
                    <div v-for="param in localParameters" :key="param.id" 
                         class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        
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
                                <editable-input 
                                    :value="param.max_score"
                                    type="parameter"
                                    :min="-1000"
                                    :max="1000"
                                    :step="0.1"
                                    @update:value="updateParameterValue(param, 'max_score', $event)"
                                    class="w-full"
                                />
                            </div>

                            <!-- Effect Distance (for distance-based parameters) -->
                            <div v-if="param.parameter_type === 'distance'">
                                <label class="block text-xs text-gray-600 mb-1">
                                    Etki Mesafesi (m)
                                </label>
                                <editable-input 
                                    :value="param.effect_distance"
                                    type="distance"
                                    :min="0"
                                    :max="10000"
                                    :step="50"
                                    suffix="m"
                                    @update:value="updateParameterValue(param, 'effect_distance', $event)"
                                    class="w-full"
                                />
                            </div>

                            <!-- Log Coefficient (for distance-based parameters) -->
                            <div v-if="param.parameter_type === 'distance'">
                                <label class="block text-xs text-gray-600 mb-1">
                                    Log Katsayısı
                                </label>
                                <editable-input 
                                    :value="param.log_coefficient"
                                    type="parameter"
                                    :min="0.1"
                                    :max="10"
                                    :step="0.1"
                                    @update:value="updateParameterValue(param, 'log_coefficient', $event)"
                                    class="w-full"
                                />
                            </div>
                        </div>

                        <!-- Expanded Details -->
                        <div v-if="isExpanded(param.id)" class="mt-4 pt-4 border-t border-gray-200">
                            <div class="space-y-3">
                                <!-- Active Toggle -->
                                <div class="flex items-center space-x-3">
                                    <label class="flex items-center">
                                        <input type="checkbox" 
                                               v-model="param.is_active"
                                               @change="updateParameter(param)"
                                               class="mr-2">
                                        <span class="text-sm">Aktif</span>
                                    </label>
                                </div>
                                
                                <!-- Categorical Values (for demographic parameters) -->
                                <div v-if="param.parameter_type === 'demographic' && param.categorical_values">
                                    <label class="block text-xs text-gray-600 mb-1">
                                        Kategorik Değerler
                                    </label>
                                    <textarea v-model="param.categorical_values_text"
                                              @input="updateCategoricalValues(param)"
                                              class="w-full p-2 border border-gray-300 rounded text-sm"
                                              rows="3"
                                              placeholder="JSON formatında değerler"></textarea>
                                </div>
                                
                                <!-- Last Updated -->
                                <div class="text-xs text-gray-500">
                                    Son güncelleme: {{ formatDate(param.updated_at) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center text-gray-500 py-8">
                    <p>Bu kategori için parametre bulunamadı</p>
                    <button @click="addNewParameter" 
                            class="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                        İlk parametreyi ekle
                    </button>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            localWeights: {
                hospital_weight: 0.30,
                competitor_weight: 0.30,
                demographics_weight: 0.10,
                important_places_weight: 0.30
            },
            localParameters: [],
            expandedParams: new Set()
        }
    },
    
    watch: {
        categoryWeights: {
            handler(newWeights) {
                if (newWeights && Object.keys(newWeights).length > 0) {
                    this.localWeights = { ...newWeights };
                }
            },
            immediate: true
        },
        
        parameters: {
            handler(newParams) {
                this.localParameters = newParams ? [...newParams] : [];
                // Add text representation for categorical values
                this.localParameters.forEach(param => {
                    if (param.categorical_values) {
                        param.categorical_values_text = JSON.stringify(param.categorical_values, null, 2);
                    }
                });
            },
            immediate: true,
            deep: true
        }
    },
    
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
        
        updateWeights() {
            this.$emit('weights-updated', this.localWeights);
        },
        
        updateParameter(param) {
            this.$emit('parameter-updated', param);
        },
        
        updateParameterValue(param, field, newValue) {
            param[field] = newValue;
            this.updateParameter(param);
        },
        
        updateWeightValue(weightType, newValue) {
            // Convert percentage back to decimal
            this.localWeights[weightType] = newValue / 100;
            this.updateWeights();
        },
        
        validateWeightTotal() {
            const total = Object.values(this.localWeights).reduce((sum, val) => sum + val, 0);
            return Math.abs(total - 1.0) < 0.01; // Allow small floating point errors
        },
        
        getWeightValidationMessage() {
            const total = this.totalWeight;
            if (total === 100) {
                return 'Ağırlıklar dengeli';
            } else if (total < 100) {
                return `Toplam ağırlık %${total} - %${100 - total} eksik`;
            } else {
                return `Toplam ağırlık %${total} - %${total - 100} fazla`;
            }
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
        
        addNewParameter() {
            const newParam = {
                id: Date.now(), // Temporary ID
                parameter_name: 'Yeni Parametre',
                parameter_type: 'distance',
                max_score: 100,
                effect_distance: 1000,
                log_coefficient: 2.0,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.localParameters.push(newParam);
            this.expandedParams.add(newParam.id);
            this.updateParameter(newParam);
        },
        
        duplicateParameter(param) {
            const duplicated = {
                ...param,
                id: Date.now(),
                parameter_name: param.parameter_name + ' (Kopya)',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.localParameters.push(duplicated);
            this.updateParameter(duplicated);
        },
        
        deleteParameter(param) {
            if (confirm(`"${param.parameter_name}" parametresini silmek istediğinizden emin misiniz?`)) {
                const index = this.localParameters.findIndex(p => p.id === param.id);
                if (index > -1) {
                    this.localParameters.splice(index, 1);
                    this.expandedParams.delete(param.id);
                    // Emit deletion event
                    this.$emit('parameter-deleted', param);
                }
            }
        },
        
        updateCategoricalValues(param) {
            try {
                param.categorical_values = JSON.parse(param.categorical_values_text);
                this.updateParameter(param);
            } catch (error) {
                console.warn('Invalid JSON in categorical values:', error);
            }
        },
        
        formatDate(dateString) {
            if (!dateString) return 'Bilinmiyor';
            return new Date(dateString).toLocaleString('tr-TR');
        }
    }
};

const VisualMap = {
    props: ['selectedCategory', 'testPoints', 'activeTestPoint', 'currentScore'],
    emits: ['point-clicked', 'test-point-selected'],
    
    data() {
        return {
            map: null,
            markersLayer: null,
            currentMarker: null,
            isFullscreen: false,
            isScoring: false
        }
    },
    
    template: `
        <div :class="['bg-white flex flex-col transition-all duration-300',
                     isFullscreen ? 'fixed inset-0 z-50' : 'h-full']">
            <!-- Map Header -->
            <div class="bg-gray-50 border-b border-gray-200 p-3">
                <div class="flex justify-between items-center">
                    <h3 class="font-medium text-gray-900">🗺️ {{ getCategoryName(selectedCategory) }} Lokasyon Analizi</h3>
                    <div class="flex items-center space-x-2">
                        <button @click="toggleFullscreen" 
                                class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm">
                            {{ isFullscreen ? '🔲 Küçült' : '🔳 Tam Ekran' }}
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Leaflet Map Container -->
            <div class="flex-1 relative">
                <div id="leaflet-map" 
                     :class="['h-full w-full',
                             isFullscreen ? 'min-h-[calc(100vh-60px)]' : 'min-h-[400px]']">
                </div>
                
                <!-- Loading Indicator -->
                <div v-if="isScoring" 
                     class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[1000]">
                    <div class="bg-white rounded-lg p-6 shadow-xl text-center">
                        <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <div class="text-gray-700 font-medium">Nokta skorlanıyor...</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    mounted() {
        this.$nextTick(() => {
            this.initializeMap();
        });
    },
    
    beforeUnmount() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    },
    
    watch: {
        currentScore() {
            this.isScoring = false;
            if (this.currentScore && this.activeTestPoint) {
                this.updateScoreMarker();
            }
        },
        
        activeTestPoint() {
            if (this.activeTestPoint) {
                this.updateScoreMarker();
            }
        }
    },
    
    methods: {
        initializeMap() {
            // Wait a bit to ensure DOM is ready
            setTimeout(() => {
                const mapContainer = document.getElementById('leaflet-map');
                if (!mapContainer) {
                    console.error('Map container not found');
                    return;
                }
                
                // Check if map is already initialized
                if (this.map) {
                    console.log('Map already initialized');
                    return;
                }
                
                try {
                    // Initialize Leaflet map - exactly like modern dashboard
                    this.map = L.map('leaflet-map', {
                        zoomControl: true
                    }).setView([39.9334, 32.8597], 12);
                    
                    // Add tile layer
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }).addTo(this.map);
                    
                    // Initialize markers layer
                    this.markersLayer = L.layerGroup().addTo(this.map);
                    
                    // Add click event for direct analysis
                    this.map.on('click', (e) => {
                        this.onMapClick(e.latlng.lat, e.latlng.lng);
                    });
                    
                    console.log('✅ Leaflet map initialized successfully');
                } catch (error) {
                    console.error('❌ Map initialization failed:', error);
                }
            }, 100);
        },
        
        async onMapClick(lat, lng) {
            if (this.isScoring) return;
            
            this.isScoring = true;
            
            // Clear previous markers
            this.clearMarkers();
            
            // Add temporary marker
            const tempMarker = L.marker([lat, lng])
                .addTo(this.markersLayer)
                .bindPopup('Skorlanıyor...')
                .openPopup();
            
            this.currentMarker = tempMarker;
            
            // Emit the point click event to trigger scoring
            this.$emit('point-clicked', lat, lng);
            
            // Set a timeout to hide loading if scoring takes too long
            setTimeout(() => {
                this.isScoring = false;
            }, 10000);
        },
        
        updateScoreMarker() {
            if (!this.activeTestPoint || !this.currentScore || !this.map) return;
            
            // Clear previous markers
            this.clearMarkers();
            
            const lat = this.activeTestPoint.lat;
            const lng = this.activeTestPoint.lon;
            const score = this.currentScore.total_score || 0;
            
            // Create custom icon based on score
            const iconColor = this.getScoreColor(score);
            const iconHtml = `
                <div style="
                    width: 40px; 
                    height: 40px; 
                    background-color: ${iconColor}; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-weight: bold; 
                    font-size: 14px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                ">
                    ${Math.round(score)}
                </div>
            `;
            
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-score-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20]
            });
            
            // Create popup content
            const popupContent = this.createPopupContent();
            
            // Add marker with score to markers layer
            this.currentMarker = L.marker([lat, lng], { icon: customIcon })
                .addTo(this.markersLayer)
                .bindPopup(popupContent, {
                    maxWidth: 300,
                    className: 'score-popup'
                })
                .openPopup();
            
            // Center map on the point
            this.map.setView([lat, lng], 15);
        },
        
        createPopupContent() {
            if (!this.currentScore) return 'Skorlanıyor...';
            
            const score = this.currentScore.total_score || 0;
            const category = this.currentScore.category || 'Değerlendiriliyor...';
            const emoji = this.currentScore.emoji || '🔄';
            
            let popupHtml = `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: ${this.getScoreColor(score)}; margin-bottom: 5px;">
                        ${Math.round(score)}/100
                    </div>
                    <div style="font-size: 16px; margin-bottom: 5px;">${category}</div>
                    <div style="font-size: 24px; margin-bottom: 10px;">${emoji}</div>
            `;
            
            // Add breakdown if available
            if (this.currentScore.breakdown) {
                popupHtml += '<div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">';
                
                Object.entries(this.currentScore.breakdown).forEach(([key, component]) => {
                    if (component && component.score !== undefined) {
                        const componentScore = Math.round(component.score);
                        const icon = this.getComponentIcon(key);
                        const name = this.getComponentName(key);
                        
                        popupHtml += `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 14px;">
                                <span>${icon} ${name}</span>
                                <span style="font-weight: bold; color: ${this.getScoreColor(componentScore)};">
                                    ${componentScore}
                                </span>
                            </div>
                        `;
                    }
                });
                
                popupHtml += '</div>';
            }
            
            // Add coordinates
            if (this.activeTestPoint) {
                popupHtml += `
                    <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; font-size: 12px; color: #666;">
                        📍 ${this.activeTestPoint.lat.toFixed(6)}, ${this.activeTestPoint.lon.toFixed(6)}
                    </div>
                `;
            }
            
            popupHtml += '</div>';
            
            return popupHtml;
        },
        
        clearMarkers() {
            if (this.markersLayer) {
                this.markersLayer.clearLayers();
            }
            this.currentMarker = null;
        },
        
        getScoreColor(score) {
            if (score >= 80) return '#10b981'; // green
            if (score >= 60) return '#f59e0b'; // yellow
            if (score >= 40) return '#f97316'; // orange
            return '#ef4444'; // red
        },
        
        getComponentIcon(key) {
            const icons = {
                'hospital_proximity': '🏥',
                'competitors': '🏪',
                'demographics': '👥',
                'important_places': '🚇'
            };
            return icons[key] || '⚙️';
        },
        
        getComponentName(key) {
            const names = {
                'hospital_proximity': 'Hastane',
                'competitors': 'Rakip',
                'demographics': 'Demografi',
                'important_places': 'Önemli Yerler'
            };
            return names[key] || key;
        },
        
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            if (this.isFullscreen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
            
            // Resize map after fullscreen toggle
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 300);
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

const TestPointManager = {
    props: ['testPoints', 'selectedCategory'],
    emits: ['test-point-tested'],
    
    data() {
        return {
            testPoint: {
                lat: 39.969169,
                lon: 32.783675
            },
            isScoring: false
        }
    },
    
    template: `
        <div class="p-4 h-full flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                    🧪 Test Noktaları
                </h3>
            </div>
            
            <!-- Quick Test -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h4 class="font-medium text-gray-900 mb-3">Hızlı Test</h4>
                
                <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Enlem</label>
                        <input type="number" 
                               v-model.number="testPoint.lat" 
                               step="any" 
                               class="w-full p-2 border border-gray-300 rounded text-sm"
                               :disabled="isScoring">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Boylam</label>
                        <input type="number" 
                               v-model.number="testPoint.lon" 
                               step="any" 
                               class="w-full p-2 border border-gray-300 rounded text-sm"
                               :disabled="isScoring">
                    </div>
                </div>
                
                <button @click="scoreTestPoint" 
                        :disabled="isScoring"
                        :class="['w-full py-2 px-4 rounded-lg font-medium transition-colors',
                                isScoring 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-green-500 hover:bg-green-600 text-white']">
                    {{ isScoring ? '⏳ Skorlanıyor...' : '🎯 Test Et' }}
                </button>
            </div>
            
            <!-- Predefined Test Points -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex-1">
                <h4 class="font-medium text-gray-900 mb-3">Kayıtlı Test Noktaları</h4>
                <div v-if="testPoints && testPoints.length > 0" class="space-y-2">
                    <div v-for="point in testPoints.slice(0, 5)" :key="point.id" 
                         class="bg-white p-3 rounded border hover:shadow-sm cursor-pointer transition-shadow"
                         @click="selectTestPoint(point)">
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-medium text-sm">{{ point.name }}</div>
                                <div class="text-xs text-gray-500">{{ point.lat.toFixed(4) }}, {{ point.lon.toFixed(4) }}</div>
                            </div>
                            <div class="text-xs text-blue-600">Test Et</div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center text-gray-500 py-4">
                    <p class="text-sm">Henüz kayıtlı test noktası yok</p>
                </div>
            </div>
        </div>
    `,
    
    methods: {
        async scoreTestPoint() {
            this.isScoring = true;
            
            try {
                const response = await fetch('/api/admin/testing/score-point', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        lat: this.testPoint.lat,
                        lon: this.testPoint.lon,
                        category: this.selectedCategory
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.$emit('test-point-tested', {
                        ...this.testPoint,
                        result: result
                    });
                    console.log('✅ Test point scored:', result);
                } else {
                    const error = await response.json();
                    alert('❌ Hata: ' + (error.error || 'Bilinmeyen hata'));
                }
            } catch (error) {
                console.error('❌ Scoring failed:', error);
                alert('❌ Hata: ' + error.message);
            } finally {
                this.isScoring = false;
            }
        },
        
        selectTestPoint(point) {
            this.testPoint.lat = point.lat;
            this.testPoint.lon = point.lon;
            this.scoreTestPoint();
        }
    }
};

// ScoreBreakdown component removed - using map popup for score display

// Create and mount the app
const app = createApp(AdminApp);

app.component('editable-input', EditableInput);
app.component('parameter-manager', ParameterManager);
app.component('visual-map', VisualMap);
app.component('test-point-manager', TestPointManager);
// ScoreBreakdown component removed - using map popup instead

// Simple placeholder components
app.component('performance-monitor', {
    props: ['performanceData'],
    template: `<div class="text-sm text-gray-500">⚡ Performans</div>`
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

// Modal placeholders
app.component('component-detail-modal', {
    props: ['componentData'],
    emits: ['close'],
    template: `<div></div>`
});

app.component('history-modal', {
    props: ['historyData'],
    emits: ['close', 'revert'],
    template: `<div></div>`
});

app.component('import-modal', {
    emits: ['close', 'import'],
    template: `<div></div>`
});

app.mount('#admin-app');

console.log('🎯 Advanced Admin Panel Vue.js application mounted successfully!');