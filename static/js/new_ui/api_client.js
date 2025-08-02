/**
 * LocationIQ Modern UI - API Client
 * Handles all communication with backend APIs
 */

class ApiClient {
    constructor() {
        this.baseUrl = window.location.origin;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.requestTimeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Make HTTP request with error handling and retries
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
        config.signal = controller.signal;

        let lastError = null;
        
        // Retry logic
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`API Request (attempt ${attempt}): ${config.method} ${url}`);
                
                const response = await fetch(url, config);
                clearTimeout(timeoutId);
                
                // Handle HTTP errors
                if (!response.ok) {
                    const errorData = await this.parseErrorResponse(response);
                    throw new ApiError(
                        `HTTP ${response.status}: ${response.statusText}`,
                        errorData,
                        response.status
                    );
                }
                
                // Parse response
                const data = await this.parseResponse(response);
                console.log(`API Response: ${config.method} ${url}`, data);
                
                return data;
                
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;
                
                // Don't retry on certain errors
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    throw error;
                }
                
                // Don't retry on the last attempt
                if (attempt === this.retryAttempts) {
                    break;
                }
                
                // Wait before retry
                await this.delay(this.retryDelay * attempt);
                console.log(`Retrying API request (${attempt + 1}/${this.retryAttempts})`);
            }
        }
        
        // Transform error types
        if (lastError.name === 'AbortError') {
            throw new NetworkError(window.translationUtils ? window.translationUtils.t('api.errors.timeout') : 'Request timeout', lastError);
        } else if (lastError instanceof TypeError) {
            throw new NetworkError(window.translationUtils ? window.translationUtils.t('api.errors.network') : 'Network error - check your connection', lastError);
        } else {
            throw lastError;
        }
    }

    /**
     * Parse API response
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    }

    /**
     * Parse error response
     */
    async parseErrorResponse(response) {
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return { message: await response.text() };
            }
        } catch (error) {
            return { message: window.translationUtils ? window.translationUtils.t('api.errors.unknown') : 'Unknown error occurred' };
        }
    }

    /**
     * Delay utility for retries
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, this.baseUrl);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return this.request(url.toString());
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ===== LocationIQ Specific API Methods =====

    /**
     * Score a single point (Mode 1)
     */
    async scorePoint(lat, lng, businessType) {
        if (!lat || !lng || !businessType) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.missingParams') : 'Missing required parameters', ['lat', 'lng', 'businessType']);
        }

        return this.post('/api/v5/score_point', {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            business_type: businessType
        });
    }

    /**
     * Score multiple points for comparison (Mode 1)
     */
    async scoreMultiplePoints(locations, businessType) {
        if (!locations || !Array.isArray(locations) || locations.length === 0) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.missingLocations') : 'Locations array is required', ['locations']);
        }
        
        if (!businessType) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.missingBusinessType') : 'Business type is required', ['businessType']);
        }

        // Score each location individually
        const promises = locations.map(location => 
            this.scorePoint(location.lat, location.lng, businessType)
        );

        try {
            const results = await Promise.all(promises);
            return results.map((result, index) => ({
                ...result,
                location: locations[index]
            }));
        } catch (error) {
            throw new ApiError(window.translationUtils ? window.translationUtils.t('api.errors.scoringFailed') : 'Failed to score multiple points', error);
        }
    }

    /**
     * Get region analysis (Mode 2)
     */
    async getRegionAnalysis(il, ilce, mahalle, businessType) {
        if (!il || !ilce || !mahalle || !businessType) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.missingRegionParams') : 'Missing required parameters', ['il', 'ilce', 'mahalle', 'businessType']);
        }

        return this.post('/api/v8/mahalle_analizi', {
            il,
            ilce,
            mahalle,
            business_type: businessType
        });
    }

    /**
     * Get heatmap data (Mode 2)
     */
    async getHeatmapData(il, ilce, mahalle, businessType) {
        if (!il || !ilce || !mahalle || !businessType) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.missingHeatmapParams') : 'Missing required parameters', ['il', 'ilce', 'mahalle', 'businessType']);
        }

        return this.post('/api/v8/heatmap_data', {
            il,
            ilce,
            mahalle,
            business_type: businessType
        });
    }

    /**
     * Get location suggestions for address search
     */
    async searchLocations(query) {
        if (!query || query.trim().length < 3) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.queryTooShort') : 'Search query must be at least 3 characters', ['query']);
        }

        // This would integrate with a geocoding service
        // For now, return a placeholder structure
        return this.get('/api/search/locations', { q: query.trim() });
    }

    /**
     * Get available regions (il, ilce, mahalle)
     */
    async getRegions(level = 'il', parent = null) {
        const params = { level };
        if (parent) {
            params.parent = parent;
        }
        
        return this.get('/api/regions', params);
    }

    /**
     * Validate coordinates
     */
    validateCoordinates(lat, lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.invalidCoordinates') : 'Invalid coordinates - must be numbers');
        }
        
        if (latitude < -90 || latitude > 90) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.latitudeRange') : 'Latitude must be between -90 and 90');
        }
        
        if (longitude < -180 || longitude > 180) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.longitudeRange') : 'Longitude must be between -180 and 180');
        }
        
        return { lat: latitude, lng: longitude };
    }

    /**
     * Validate business type
     */
    validateBusinessType(businessType) {
        const validTypes = ['eczane', 'firin', 'market', 'cafe', 'restoran'];
        
        if (!businessType || !validTypes.includes(businessType.toLowerCase())) {
            throw new ValidationError(window.translationUtils ? window.translationUtils.t('api.validation.invalidBusinessType', { types: validTypes.join(', ') }) : `Invalid business type. Must be one of: ${validTypes.join(', ')}`);
        }
        
        return businessType.toLowerCase();
    }

    /**
     * Get API health status
     */
    async getHealthStatus() {
        try {
            return await this.get('/api/health');
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    /**
     * Set custom headers for requests
     */
    setHeaders(headers) {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }

    /**
     * Set request timeout
     */
    setTimeout(timeout) {
        this.requestTimeout = timeout;
    }

    /**
     * Set retry configuration
     */
    setRetryConfig(attempts, delay) {
        this.retryAttempts = attempts;
        this.retryDelay = delay;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}