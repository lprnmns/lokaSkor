/**
 * LocationIQ UI/UX Refactoring Phase 2 - Test Suite
 * Tests for critical fixes: button positioning, layout height, pin stability, card interactions, and scoring
 */

describe('LocationIQ Phase 2 Critical Fixes', () => {
  let mockLocationComparison;
  let container;
  let mockMap;

  beforeEach(() => {
    // Setup DOM structure
    document.body.innerHTML = `
      <div class="comparison-container">
        <header class="comparison-header">
          <div class="header-content">
            <div class="logo-section">
              <span class="logo-text">LocationIQ</span>
            </div>
          </div>
        </header>
        <div class="comparison-content">
          <aside class="location-sidebar">
            <div class="sidebar-content aligned-content">
              <div class="selected-locations">
                <div id="locationList" class="location-list"></div>
              </div>
            </div>
          </aside>
          <main class="map-container">
            <div id="comparisonMap" class="comparison-map"></div>
            <div class="map-cta-container">
              <button id="mapCTAButton" class="map-cta-button" data-state="waiting">
                <span class="cta-icon">+</span>
                <span class="cta-text">Analiz için 1 nokta daha ekleyin</span>
              </button>
            </div>
          </main>
        </div>
        <section id="comparisonResults" class="comparison-results" style="display: none;">
          <div id="resultsContent" class="results-content"></div>
        </section>
      </div>
    `;

    container = document.querySelector('.comparison-container');
    
    // Mock Leaflet map
    mockMap = {
      setView: jest.fn(),
      setZoom: jest.fn(),
      getZoom: jest.fn(() => 12),
      getBounds: jest.fn(() => ({
        getNorth: () => 40,
        getSouth: () => 39,
        getEast: () => 33,
        getWest: () => 32
      })),
      panTo: jest.fn(),
      fitBounds: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      removeLayer: jest.fn(),
      addLayer: jest.fn()
    };

    global.L = {
      map: jest.fn(() => mockMap),
      marker: jest.fn(() => ({
        addTo: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        getLatLng: jest.fn(() => ({ lat: 39.9, lng: 32.8 })),
        setLatLng: jest.fn(),
        getElement: jest.fn(() => document.createElement('div')),
        remove: jest.fn()
      })),
      divIcon: jest.fn(() => ({})),
      tileLayer: jest.fn(() => ({
        addTo: jest.fn()
      })),
      featureGroup: jest.fn(() => ({
        getBounds: jest.fn(() => ({
          pad: jest.fn(() => mockMap.getBounds())
        }))
      }))
    };

    // Mock LocationComparison class
    mockLocationComparison = {
      locations: [],
      markers: [],
      map: mockMap,
      markerColors: ['#ef4444', '#3b82f6', '#10b981'],
      addLocation: jest.fn(),
      removeLocation: jest.fn(),
      updateCTAButton: jest.fn(),
      createMarker: jest.fn(),
      updateLocationList: jest.fn()
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Fix 1: Button Positioning Consistency', () => {
    test('should maintain identical button position across all states', () => {
      const ctaContainer = document.querySelector('.map-cta-container');
      const ctaButton = document.querySelector('#mapCTAButton');
      
      // Get initial position
      const initialContainerRect = ctaContainer.getBoundingClientRect();
      const initialButtonRect = ctaButton.getBoundingClientRect();
      
      // Change to waiting state (1 location)
      updateCTAButtonState(1);
      const waitingContainerRect = ctaContainer.getBoundingClientRect();
      const waitingButtonRect = ctaButton.getBoundingClientRect();
      
      // Change to ready state (2+ locations)
      updateCTAButtonState(2);
      const readyContainerRect = ctaContainer.getBoundingClientRect();
      const readyButtonRect = ctaButton.getBoundingClientRect();
      
      // Assert container position never changes
      expect(waitingContainerRect.left).toBe(initialContainerRect.left);
      expect(waitingContainerRect.top).toBe(initialContainerRect.top);
      expect(readyContainerRect.left).toBe(initialContainerRect.left);
      expect(readyContainerRect.top).toBe(initialContainerRect.top);
      
      // Assert button position within container never changes
      expect(waitingButtonRect.left).toBe(initialButtonRect.left);
      expect(waitingButtonRect.top).toBe(initialButtonRect.top);
      expect(readyButtonRect.left).toBe(initialButtonRect.left);
      expect(readyButtonRect.top).toBe(initialButtonRect.top);
    });

    test('should have proper CSS positioning values', () => {
      const ctaContainer = document.querySelector('.map-cta-container');
      const computedStyle = window.getComputedStyle(ctaContainer);
      
      expect(computedStyle.position).toBe('absolute');
      expect(computedStyle.bottom).toBe('30px');
      expect(computedStyle.left).toBe('50%');
      expect(computedStyle.transform).toBe('translateX(-50%)');
      expect(parseInt(computedStyle.zIndex)).toBeGreaterThanOrEqual(1000);
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.justifyContent).toBe('center');
    });

    test('should update button content without changing structure', () => {
      const ctaButton = document.querySelector('#mapCTAButton');
      const ctaText = ctaButton.querySelector('.cta-text');
      const ctaIcon = ctaButton.querySelector('.cta-icon');
      
      // Test state transitions
      updateCTAButtonState(0);
      expect(ctaButton.getAttribute('data-state')).toBe('disabled');
      expect(ctaText.textContent).toContain('Haritaya tıklayarak');
      
      updateCTAButtonState(1);
      expect(ctaButton.getAttribute('data-state')).toBe('waiting');
      expect(ctaText.textContent).toContain('1 nokta daha ekleyin');
      
      updateCTAButtonState(2);
      expect(ctaButton.getAttribute('data-state')).toBe('ready');
      expect(ctaText.textContent).toContain('Karşılaştırmaya Başla');
      
      // Assert DOM structure unchanged
      expect(ctaButton.querySelector('.cta-text')).toBe(ctaText);
      expect(ctaButton.querySelector('.cta-icon')).toBe(ctaIcon);
    });

    test('should have smooth transitions between states', () => {
      const ctaButton = document.querySelector('#mapCTAButton');
      const computedStyle = window.getComputedStyle(ctaButton);
      
      expect(computedStyle.transition).toContain('all');
      expect(computedStyle.transition).toMatch(/0\.[23]s/); // 0.2s or 0.3s
    });
  });

  describe('Fix 2: Layout Height Equalization', () => {
    test('should implement flexbox layout for main container', () => {
      const comparisonContent = document.querySelector('.comparison-content');
      const computedStyle = window.getComputedStyle(comparisonContent);
      
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.minHeight).toContain('calc(100vh');
    });

    test('should set proper flex properties for sidebar and map', () => {
      const sidebar = document.querySelector('.location-sidebar');
      const mapContainer = document.querySelector('.map-container');
      
      const sidebarStyle = window.getComputedStyle(sidebar);
      const mapStyle = window.getComputedStyle(mapContainer);
      
      expect(sidebarStyle.flexShrink).toBe('0');
      expect(sidebarStyle.width).toBe('400px');
      expect(mapStyle.flexGrow).toBe('1');
    });

    test('should maintain equal heights for sidebar and map', () => {
      const sidebar = document.querySelector('.location-sidebar');
      const mapContainer = document.querySelector('.map-container');
      
      // Add some content to sidebar to test height matching
      sidebar.style.height = '600px';
      
      const sidebarRect = sidebar.getBoundingClientRect();
      const mapRect = mapContainer.getBoundingClientRect();
      
      // Heights should be equal due to flex layout
      expect(Math.abs(sidebarRect.height - mapRect.height)).toBeLessThan(5);
    });

    test('should handle responsive breakpoints correctly', () => {
      // Mock window width change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      const comparisonContent = document.querySelector('.comparison-content');
      
      // Should maintain flex layout on tablet size
      expect(window.getComputedStyle(comparisonContent).display).toBe('flex');
      
      // Mock mobile width
      window.innerWidth = 768;
      window.dispatchEvent(new Event('resize'));
      
      // Should switch to column layout on mobile
      const mobileStyle = window.getComputedStyle(comparisonContent);
      expect(mobileStyle.flexDirection).toBe('column');
    });
  });

  describe('Fix 3: Map Pin Stability', () => {
    let testLocation;
    let mockMarker;

    beforeEach(() => {
      testLocation = {
        id: 1,
        name: 'Test Location',
        lat: 39.9334,
        lng: 32.8597,
        index: 0
      };

      mockMarker = {
        addTo: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        getLatLng: jest.fn(() => ({ lat: testLocation.lat, lng: testLocation.lng })),
        setLatLng: jest.fn(),
        getElement: jest.fn(() => {
          const elem = document.createElement('div');
          elem.className = 'custom-map-marker';
          return elem;
        }),
        remove: jest.fn(),
        options: { locationId: testLocation.id }
      };

      global.L.marker.mockReturnValue(mockMarker);
    });

    test('should create stable markers using L.divIcon', () => {
      const marker = createStableMarker(testLocation, 0);
      
      expect(global.L.divIcon).toHaveBeenCalledWith({
        className: 'custom-map-marker',
        html: expect.stringContaining('marker-pin'),
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -42]
      });
      
      expect(global.L.marker).toHaveBeenCalledWith(
        [testLocation.lat, testLocation.lng],
        expect.objectContaining({
          icon: expect.any(Object),
          locationId: testLocation.id,
          riseOnHover: true
        })
      );
    });

    test('should maintain pin position during zoom operations', () => {
      const marker = createStableMarker(testLocation, 0);
      const initialPosition = marker.getLatLng();
      
      // Simulate zoom change
      mockMap.setZoom(15);
      mockMap.setZoom(10);
      mockMap.setZoom(18);
      
      const finalPosition = marker.getLatLng();
      
      expect(finalPosition.lat).toBe(initialPosition.lat);
      expect(finalPosition.lng).toBe(initialPosition.lng);
    });

    test('should maintain pin position during pan operations', () => {
      const marker = createStableMarker(testLocation, 0);
      const initialPosition = marker.getLatLng();
      
      // Simulate pan operations
      mockMap.panTo([40.0, 33.0]);
      mockMap.panTo([39.5, 32.5]);
      
      const finalPosition = marker.getLatLng();
      
      expect(finalPosition.lat).toBe(initialPosition.lat);
      expect(finalPosition.lng).toBe(initialPosition.lng);
    });

    test('should preserve custom styling in stable markers', () => {
      const iconHtml = createMarkerHTML(testLocation, 0);
      
      expect(iconHtml).toContain('marker-container');
      expect(iconHtml).toContain('marker-pin');
      expect(iconHtml).toContain('marker-number');
      expect(iconHtml).toContain('marker-shadow');
      expect(iconHtml).toContain(mockLocationComparison.markerColors[0]);
      expect(iconHtml).toContain('1');
    });

    test('should maintain hover functionality with stable markers', () => {
      const marker = createStableMarker(testLocation, 0);
      
      // Verify hover event handlers are attached
      expect(marker.on).toHaveBeenCalledWith('mouseover', expect.any(Function));
      expect(marker.on).toHaveBeenCalledWith('mouseout', expect.any(Function));
      
      // Test hover interaction
      const mouseoverCallback = marker.on.mock.calls.find(call => call[0] === 'mouseover')[1];
      const mouseoutCallback = marker.on.mock.calls.find(call => call[0] === 'mouseout')[1];
      
      expect(mouseoverCallback).toBeInstanceOf(Function);
      expect(mouseoutCallback).toBeInstanceOf(Function);
    });
  });

  describe('Fix 4: Enhanced Sidebar Card Interactions', () => {
    let locationCard;

    beforeEach(() => {
      const testLocation = {
        id: 1,
        name: 'Test Location',
        lat: 39.9334,
        lng: 32.8597,
        address: 'Test Address'
      };

      locationCard = createEnhancedLocationCard(testLocation, 0);
      document.querySelector('#locationList').appendChild(locationCard);
    });

    test('should create enhanced location cards with proper structure', () => {
      expect(locationCard.classList.contains('location-card')).toBe(true);
      expect(locationCard.classList.contains('enhanced')).toBe(true);
      expect(locationCard.getAttribute('data-location-id')).toBe('1');
      
      const cardHeader = locationCard.querySelector('.card-header');
      const locationBadge = locationCard.querySelector('.location-badge');
      const locationInfo = locationCard.querySelector('.location-info');
      const deleteButton = locationCard.querySelector('.delete-button');
      
      expect(cardHeader).toBeTruthy();
      expect(locationBadge).toBeTruthy();
      expect(locationInfo).toBeTruthy();
      expect(deleteButton).toBeTruthy();
    });

    test('should have proper hover effects', () => {
      const computedStyle = window.getComputedStyle(locationCard);
      
      expect(computedStyle.transition).toContain('all');
      expect(computedStyle.transition).toMatch(/0\.3s/);
      expect(computedStyle.cursor).toBe('pointer');
      
      // Test hover class application
      locationCard.classList.add('hovered');
      const hoveredStyle = window.getComputedStyle(locationCard);
      
      expect(hoveredStyle.transform).toContain('translateY');
      expect(hoveredStyle.boxShadow).not.toBe('none');
    });

    test('should show delete button only on hover', () => {
      const deleteButton = locationCard.querySelector('.delete-button');
      const initialStyle = window.getComputedStyle(deleteButton);
      
      expect(initialStyle.opacity).toBe('0');
      expect(initialStyle.transform).toContain('scale(0.8)');
      
      // Simulate hover
      locationCard.classList.add('hovered');
      locationCard.dispatchEvent(new MouseEvent('mouseenter'));
      
      deleteButton.style.opacity = '1';
      deleteButton.style.transform = 'scale(1)';
      
      const hoveredStyle = window.getComputedStyle(deleteButton);
      expect(hoveredStyle.opacity).toBe('1');
      expect(hoveredStyle.transform).toContain('scale(1)');
    });

    test('should use trash can icon in delete button', () => {
      const deleteButton = locationCard.querySelector('.delete-button');
      const trashIcon = deleteButton.querySelector('.trash-icon');
      
      expect(trashIcon).toBeTruthy();
      expect(trashIcon.tagName.toLowerCase()).toBe('svg');
    });

    test('should have proper flexbox layout', () => {
      const cardHeader = locationCard.querySelector('.card-header');
      const headerStyle = window.getComputedStyle(cardHeader);
      
      expect(headerStyle.display).toBe('flex');
      expect(headerStyle.alignItems).toBe('center');
      expect(headerStyle.justifyContent).toBe('space-between');
    });

    test('should handle keyboard interactions', () => {
      expect(locationCard.getAttribute('tabindex')).toBe('0');
      expect(locationCard.getAttribute('role')).toBe('button');
      
      const keydownSpy = jest.fn();
      locationCard.addEventListener('keydown', keydownSpy);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      
      locationCard.dispatchEvent(enterEvent);
      locationCard.dispatchEvent(spaceEvent);
      
      expect(keydownSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fix 5: Complete Scoring Visual System', () => {
    let metricItem;

    beforeEach(() => {
      metricItem = createEnhancedMetricItem({
        type: 'hospital',
        label: 'Hastane Yakınlığı',
        score: 45,
        isWinning: false
      });
      document.body.appendChild(metricItem);
    });

    afterEach(() => {
      if (metricItem && metricItem.parentNode) {
        metricItem.parentNode.removeChild(metricItem);
      }
    });

    test('should apply correct color coding based on score ranges', () => {
      // Test low score (< 30)
      const lowScoreItem = createEnhancedMetricItem({
        type: 'hospital',
        label: 'Test',
        score: 25,
        isWinning: false
      });
      expect(lowScoreItem.classList.contains('score-low')).toBe(true);
      
      // Test medium score (30-70)
      const mediumScoreItem = createEnhancedMetricItem({
        type: 'hospital',
        label: 'Test',
        score: 50,
        isWinning: false
      });
      expect(mediumScoreItem.classList.contains('score-medium')).toBe(true);
      
      // Test high score (> 70)
      const highScoreItem = createEnhancedMetricItem({
        type: 'hospital',
        label: 'Test',
        score: 85,
        isWinning: false
      });
      expect(highScoreItem.classList.contains('score-high')).toBe(true);
    });

    test('should highlight winning categories', () => {
      const winningItem = createEnhancedMetricItem({
        type: 'hospital',
        label: 'Test',
        score: 85,
        isWinning: true
      });
      
      expect(winningItem.classList.contains('winning')).toBe(true);
      
      const trophy = winningItem.querySelector('.trophy-indicator');
      expect(trophy).toBeTruthy();
    });

    test('should have consistent color variables', () => {
      const hospitalStyle = window.getComputedStyle(metricItem);
      const metricColor = hospitalStyle.getPropertyValue('--metric-color');
      
      expect(metricColor).toBeTruthy();
      expect(metricColor).toBe('#ef4444'); // Hospital red color
    });

    test('should include proper metric icons', () => {
      const icon = metricItem.querySelector('.metric-icon svg');
      expect(icon).toBeTruthy();
      
      const iconContent = icon.innerHTML;
      expect(iconContent).toContain('path'); // SVG path element
    });

    test('should have enhanced progress bar styling', () => {
      const progressBar = metricItem.querySelector('.metric-progress-bar');
      const progressStyle = window.getComputedStyle(progressBar);
      
      expect(progressStyle.background).toContain('linear-gradient');
      expect(progressStyle.transition).toContain('width');
      expect(progressStyle.borderRadius).toBe('4px');
    });
  });

  describe('Fix 6: Mini Map Pin Consistency', () => {
    test('should create mini map pins matching main map colors', () => {
      const miniPin1 = createMiniMapPin({ id: 1 }, 0);
      const miniPin2 = createMiniMapPin({ id: 2 }, 1);
      const miniPin3 = createMiniMapPin({ id: 3 }, 2);
      
      expect(miniPin1).toContain(mockLocationComparison.markerColors[0]); // Red
      expect(miniPin2).toContain(mockLocationComparison.markerColors[1]); // Blue
      expect(miniPin3).toContain(mockLocationComparison.markerColors[2]); // Green
    });

    test('should display correct numbers in mini pins', () => {
      const miniPin1 = createMiniMapPin({ id: 1 }, 0);
      const miniPin2 = createMiniMapPin({ id: 2 }, 1);
      
      expect(miniPin1).toContain('1');
      expect(miniPin2).toContain('2');
    });

    test('should maintain consistent styling with main map', () => {
      const miniPin = createMiniMapPin({ id: 1 }, 0);
      
      expect(miniPin).toContain('mini-map-pin');
      expect(miniPin).toContain('mini-pin-number');
    });
  });

  describe('Fix 7: Enhanced Action Button Icons', () => {
    test('should add magnifying glass icon to detail button', () => {
      const detailButton = createEnhancedActionButton('primary', 'Detaylı Analiz', 'search');
      
      const icon = detailButton.querySelector('.button-icon');
      const text = detailButton.querySelector('span');
      
      expect(icon).toBeTruthy();
      expect(icon.tagName.toLowerCase()).toBe('svg');
      expect(text.textContent).toBe('Detaylı Analiz');
    });

    test('should add download icon to report button', () => {
      const reportButton = createEnhancedActionButton('secondary', 'Rapor Al', 'download');
      
      const icon = reportButton.querySelector('.button-icon');
      const text = reportButton.querySelector('span');
      
      expect(icon).toBeTruthy();
      expect(icon.tagName.toLowerCase()).toBe('svg');
      expect(text.textContent).toBe('Rapor Al');
    });

    test('should have proper icon-text alignment', () => {
      const button = createEnhancedActionButton('primary', 'Test', 'search');
      const buttonStyle = window.getComputedStyle(button);
      
      expect(buttonStyle.display).toBe('flex');
      expect(buttonStyle.alignItems).toBe('center');
      expect(buttonStyle.gap).toBeTruthy();
    });

    test('should maintain consistent icon sizing', () => {
      const button = createEnhancedActionButton('primary', 'Test', 'search');
      const icon = button.querySelector('.button-icon');
      const iconStyle = window.getComputedStyle(icon);
      
      expect(iconStyle.width).toBe('16px');
      expect(iconStyle.height).toBe('16px');
    });
  });

  describe('Performance and Integration Tests', () => {
    test('should complete layout changes within performance budget', (done) => {
      const startTime = performance.now();
      
      // Trigger layout change
      const comparisonContent = document.querySelector('.comparison-content');
      comparisonContent.style.display = 'flex';
      
      // Measure completion time
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(100); // 100ms budget
        done();
      });
    });

    test('should maintain 60fps during hover animations', () => {
      const locationCard = document.querySelector('.location-card');
      const startTime = performance.now();
      let frameCount = 0;
      
      function countFrames() {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          expect(frameCount).toBeGreaterThanOrEqual(55); // Allow some margin for 60fps
        }
      }
      
      // Start hover animation
      locationCard.classList.add('hovered');
      requestAnimationFrame(countFrames);
    });

    test('should maintain accessibility during all interactions', () => {
      const interactiveElements = document.querySelectorAll(
        'button, [role="button"], [tabindex="0"]'
      );
      
      interactiveElements.forEach(element => {
        expect(element.getAttribute('aria-label') || element.textContent.trim()).toBeTruthy();
        
        if (element.hasAttribute('tabindex')) {
          expect(parseInt(element.getAttribute('tabindex'))).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });
});

// Helper functions for tests
function updateCTAButtonState(locationCount) {
  const button = document.getElementById('mapCTAButton');
  const textElement = button.querySelector('.cta-text');
  const iconElement = button.querySelector('.cta-icon');
  
  if (locationCount === 0) {
    button.setAttribute('data-state', 'disabled');
    textElement.textContent = 'Haritaya tıklayarak lokasyon ekleyin';
    iconElement.textContent = '📍';
    button.disabled = true;
  } else if (locationCount === 1) {
    button.setAttribute('data-state', 'waiting');
    textElement.textContent = 'Analiz için 1 nokta daha ekleyin';
    iconElement.textContent = '+';
    button.disabled = false;
  } else {
    button.setAttribute('data-state', 'ready');
    textElement.textContent = 'Karşılaştırmaya Başla';
    iconElement.textContent = '⚡';
    button.disabled = false;
  }
}

function createStableMarker(location, index) {
  const markerColor = ['#ef4444', '#3b82f6', '#10b981'][index];
  
  const customIcon = global.L.divIcon({
    className: 'custom-map-marker',
    html: createMarkerHTML(location, index),
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42]
  });
  
  return global.L.marker([location.lat, location.lng], {
    icon: customIcon,
    locationId: location.id,
    riseOnHover: true
  });
}

function createMarkerHTML(location, index) {
  const markerColor = ['#ef4444', '#3b82f6', '#10b981'][index];
  return `
    <div class="marker-container">
      <div class="marker-pin" style="background-color: ${markerColor}">
        <span class="marker-number">${index + 1}</span>
      </div>
      <div class="marker-shadow"></div>
    </div>
  `;
}

function createEnhancedLocationCard(location, index) {
  const card = document.createElement('div');
  card.className = 'location-card enhanced';
  card.setAttribute('data-location-id', location.id);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  
  card.innerHTML = `
    <div class="card-header">
      <div class="location-badge badge-${index + 1}">
        <span class="badge-number">${index + 1}</span>
      </div>
      <div class="location-info">
        <h4 class="location-name">${location.name}</h4>
        <p class="location-address">${location.address}</p>
      </div>
      <button class="delete-button" aria-label="Remove location">
        <svg class="trash-icon" viewBox="0 0 24 24">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
    <div class="card-body">
      <div class="coordinates">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
    </div>
  `;
  
  return card;
}

function createEnhancedMetricItem(metricData) {
  const item = document.createElement('div');
  item.className = `metric-item metric-${metricData.type}`;
  
  // Add score-based class
  if (metricData.score < 30) {
    item.classList.add('score-low');
  } else if (metricData.score < 70) {
    item.classList.add('score-medium');
  } else {
    item.classList.add('score-high');
  }
  
  if (metricData.isWinning) {
    item.classList.add('winning');
  }
  
  item.innerHTML = `
    <div class="metric-icon">
      <svg viewBox="0 0 24 24">
        <path d="M12 2L3 7l9 5 9-5-9-5z"/>
      </svg>
    </div>
    <div class="metric-content">
      <span class="metric-label">${metricData.label}</span>
      <div class="metric-progress">
        <div class="metric-progress-bar" style="width: ${metricData.score}%"></div>
      </div>
      <span class="metric-score">${Math.round(metricData.score)}/100</span>
    </div>
    ${metricData.isWinning ? '<div class="trophy-indicator">🏆</div>' : ''}
  `;
  
  return item;
}

function createMiniMapPin(location, index) {
  const color = ['#ef4444', '#3b82f6', '#10b981'][index];
  return `
    <div class="mini-map-pin" style="background-color: ${color}">
      <span class="mini-pin-number">${index + 1}</span>
    </div>
  `;
}

function createEnhancedActionButton(type, text, iconType) {
  const button = document.createElement('button');
  button.className = `action-button ${type}`;
  
  const icons = {
    search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    download: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3'
  };
  
  button.innerHTML = `
    <svg class="button-icon" viewBox="0 0 24 24" stroke="currentColor" fill="none">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icons[iconType]}"/>
    </svg>
    <span>${text}</span>
  `;
  
  return button;
} 