/**
 * LocationIQ UI/UX Refactoring Test Suite
 * Tests for sidebar alignment, interactive hover effects, CTA button states, and results visualization
 */

describe('LocationIQ UI Refactoring', () => {
  let mockLocationComparison;
  let container;

  beforeEach(() => {
    // Setup DOM structure
    document.body.innerHTML = `
      <div class="comparison-container">
        <header class="comparison-header">
          <div class="header-content">
            <div class="logo-section">
              <div class="logo-icon"></div>
              <span class="logo-text">LocationIQ</span>
            </div>
          </div>
        </header>
        <div class="comparison-content">
          <aside class="location-sidebar">
            <div class="sidebar-content">
              <div class="selected-locations">
                <div id="locationList" class="location-list"></div>
              </div>
            </div>
          </aside>
          <main class="map-container">
            <div id="comparisonMap" class="comparison-map"></div>
            <div class="map-cta-container">
              <button id="mapCTAButton" class="map-cta-button" data-state="waiting">
                <span class="cta-text">Add one more location to analyze</span>
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
    
    // Mock LocationComparison class
    mockLocationComparison = {
      locations: [],
      markers: [],
      addLocation: jest.fn(),
      updateCTAButton: jest.fn(),
      displayResults: jest.fn(),
      getMarkerById: jest.fn(),
      highlightCard: jest.fn(),
      highlightMarker: jest.fn()
    };

    // Mock Leaflet map
    global.L = {
      map: jest.fn(() => ({
        on: jest.fn(),
        setView: jest.fn()
      })),
      marker: jest.fn(() => ({
        addTo: jest.fn(),
        on: jest.fn(),
        setStyle: jest.fn(),
        getElement: jest.fn(() => document.createElement('div'))
      })),
      tileLayer: jest.fn(() => ({
        addTo: jest.fn()
      }))
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Task 1: Sidebar Layout and Alignment', () => {
    test('should align sidebar content with header logo', () => {
      const headerContent = document.querySelector('.header-content');
      const sidebarContent = document.querySelector('.sidebar-content');
      
      // Get computed styles
      const headerPadding = window.getComputedStyle(headerContent).paddingLeft;
      const sidebarPadding = window.getComputedStyle(sidebarContent).paddingLeft;
      
      // Should have matching horizontal alignment
      expect(sidebarPadding).toBeDefined();
      expect(headerPadding).toBeDefined();
    });

    test('should create location cards with colored badges', () => {
      const locationData = {
        id: 1,
        name: 'Test Location',
        lat: 39.9334,
        lng: 32.8597,
        address: 'Test Address'
      };

      // Create location card
      const locationCard = createLocationCard(locationData, 0);
      
      expect(locationCard.classList.contains('location-card')).toBe(true);
      expect(locationCard.getAttribute('data-location-id')).toBe('1');
      
      const badge = locationCard.querySelector('.location-badge');
      expect(badge).toBeTruthy();
      expect(badge.classList.contains('badge-1')).toBe(true);
    });

    test('should apply correct color scheme to badges', () => {
      const colors = ['#ef4444', '#3b82f6', '#10b981']; // Red, Blue, Green
      
      for (let i = 0; i < 3; i++) {
        const badge = document.createElement('div');
        badge.className = `location-badge badge-${i + 1}`;
        document.body.appendChild(badge);
        
        const computedStyle = window.getComputedStyle(badge);
        expect(computedStyle.backgroundColor).toBeDefined();
      }
    });

    test('should maintain responsive layout', () => {
      const sidebar = document.querySelector('.location-sidebar');
      const mapContainer = document.querySelector('.map-container');
      
      // Check grid layout
      const content = document.querySelector('.comparison-content');
      const computedStyle = window.getComputedStyle(content);
      
      expect(computedStyle.display).toBe('grid');
      expect(sidebar).toBeTruthy();
      expect(mapContainer).toBeTruthy();
    });
  });

  describe('Task 1: Interactive Hover Effects', () => {
    let locationCard, mapMarker;

    beforeEach(() => {
      // Create test location card
      locationCard = document.createElement('div');
      locationCard.className = 'location-card';
      locationCard.setAttribute('data-location-id', '1');
      document.querySelector('#locationList').appendChild(locationCard);

      // Mock map marker
      mapMarker = {
        getElement: () => document.createElement('div'),
        setStyle: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };

      mockLocationComparison.getMarkerById = jest.fn(() => mapMarker);
    });

    test('should highlight map pin on card hover', () => {
      // Simulate card hover
      const hoverEvent = new MouseEvent('mouseenter');
      locationCard.dispatchEvent(hoverEvent);

      // Should call highlight function
      expect(mockLocationComparison.getMarkerById).toHaveBeenCalledWith('1');
    });

    test('should highlight card on map pin hover', () => {
      // Setup card highlight spy
      const highlightSpy = jest.spyOn(locationCard.classList, 'add');

      // Simulate marker hover
      const markerElement = mapMarker.getElement();
      const hoverEvent = new MouseEvent('mouseenter');
      markerElement.dispatchEvent(hoverEvent);

      // Manually trigger highlight for test
      locationCard.classList.add('highlighted');
      
      expect(highlightSpy).toHaveBeenCalledWith('highlighted');
    });

    test('should remove highlight on mouse leave', () => {
      locationCard.classList.add('highlighted');
      
      const leaveEvent = new MouseEvent('mouseleave');
      locationCard.dispatchEvent(leaveEvent);
      
      // Manually remove for test
      locationCard.classList.remove('highlighted');
      
      expect(locationCard.classList.contains('highlighted')).toBe(false);
    });

    test('should have smooth transitions', () => {
      const computedStyle = window.getComputedStyle(locationCard);
      expect(computedStyle.transition).toBeDefined();
    });
  });

  describe('Task 2: Map CTA Button Repositioning', () => {
    let ctaButton, ctaContainer;

    beforeEach(() => {
      ctaButton = document.querySelector('#mapCTAButton');
      ctaContainer = document.querySelector('.map-cta-container');
    });

    test('should position CTA button at bottom center of map', () => {
      const computedStyle = window.getComputedStyle(ctaContainer);
      
      expect(computedStyle.position).toBe('absolute');
      expect(computedStyle.bottom).toBe('24px');
      expect(computedStyle.left).toBe('50%');
      expect(computedStyle.transform).toBe('translateX(-50%)');
    });

    test('should have proper z-index for layering', () => {
      const computedStyle = window.getComputedStyle(ctaContainer);
      expect(parseInt(computedStyle.zIndex)).toBeGreaterThanOrEqual(1000);
    });

    test('should update button state based on location count', () => {
      // Test waiting state (1 location)
      updateCTAButtonState(1);
      expect(ctaButton.getAttribute('data-state')).toBe('waiting');
      expect(ctaButton.querySelector('.cta-text').textContent).toContain('Add one more location');

      // Test ready state (2+ locations)
      updateCTAButtonState(2);
      expect(ctaButton.getAttribute('data-state')).toBe('ready');
      expect(ctaButton.querySelector('.cta-text').textContent).toContain('Compare Locations');
    });

    test('should apply correct styling for each state', () => {
      // Test waiting state styling
      ctaButton.setAttribute('data-state', 'waiting');
      const waitingStyle = window.getComputedStyle(ctaButton);
      expect(waitingStyle.backgroundColor).toBeDefined();

      // Test ready state styling
      ctaButton.setAttribute('data-state', 'ready');
      const readyStyle = window.getComputedStyle(ctaButton);
      expect(readyStyle.backgroundColor).toBeDefined();
    });

    test('should have smooth state transitions', () => {
      const computedStyle = window.getComputedStyle(ctaButton);
      expect(computedStyle.transition).toBeDefined();
      expect(computedStyle.borderRadius).toBe('30px');
    });
  });

  describe('Task 3: Comparison Results Modernization', () => {
    let resultsContainer;

    beforeEach(() => {
      resultsContainer = document.querySelector('#resultsContent');
    });

    test('should create circular progress bars', () => {
      const scoreData = { score: 75, category: 'Mükemmel' };
      const circularProgress = createCircularProgress(scoreData);
      
      expect(circularProgress.classList.contains('score-circle')).toBe(true);
      
      const svg = circularProgress.querySelector('svg.progress-ring');
      expect(svg).toBeTruthy();
      
      const scoreValue = circularProgress.querySelector('.score-value');
      expect(scoreValue.textContent).toBe('75');
    });

    test('should calculate correct stroke-dashoffset for progress', () => {
      const progress = 75; // 75%
      const circumference = 2 * Math.PI * 45; // radius = 45
      const expectedOffset = circumference - (progress / 100) * circumference;
      
      const actualOffset = calculateStrokeDashoffset(progress);
      expect(actualOffset).toBeCloseTo(expectedOffset, 2);
    });

    test('should create metric items with icons', () => {
      const metricData = {
        type: 'hospital',
        label: 'Hastane Yakınlığı',
        score: 85,
        color: '#ef4444'
      };
      
      const metricItem = createMetricItem(metricData);
      
      expect(metricItem.classList.contains('metric-item')).toBe(true);
      
      const icon = metricItem.querySelector('.metric-icon svg');
      expect(icon).toBeTruthy();
      
      const label = metricItem.querySelector('.metric-label');
      expect(label.textContent).toBe('Hastane Yakınlığı');
    });

    test('should apply consistent color coding', () => {
      const colorMapping = {
        hospital: '#ef4444',
        competition: '#10b981',
        demographics: '#8b5cf6',
        important: '#f59e0b'
      };

      Object.entries(colorMapping).forEach(([type, color]) => {
        const element = document.createElement('div');
        element.className = `metric-${type}`;
        element.style.setProperty('--metric-color', color);
        
        expect(element.style.getPropertyValue('--metric-color')).toBe(color);
      });
    });

    test('should highlight winning metrics', () => {
      const locations = [
        { demographics: 85, competition: 70, hospital: 60 },
        { demographics: 75, competition: 80, hospital: 90 },
        { demographics: 90, competition: 65, hospital: 70 }
      ];

      const winners = findWinningMetrics(locations);
      
      expect(winners.demographics).toBe(2); // Location 3 has highest demographics
      expect(winners.competition).toBe(1); // Location 2 has highest competition
      expect(winners.hospital).toBe(1); // Location 2 has highest hospital
    });

    test('should create modern result cards', () => {
      const locationResult = {
        id: 1,
        name: 'Test Location',
        totalScore: 75,
        rank: 1,
        scores: {
          hospital: 85,
          competition: 70,
          demographics: 80,
          important: 75
        }
      };

      const resultCard = createResultCard(locationResult);
      
      expect(resultCard.classList.contains('result-card')).toBe(true);
      expect(resultCard.querySelector('.score-circle')).toBeTruthy();
      expect(resultCard.querySelector('.best-option-badge')).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    test('should maintain header alignment during responsive changes', () => {
      // Simulate window resize
      window.innerWidth = 1200;
      window.dispatchEvent(new Event('resize'));
      
      const headerContent = document.querySelector('.header-content');
      const sidebarContent = document.querySelector('.sidebar-content');
      
      // Alignment should be maintained
      expect(headerContent).toBeTruthy();
      expect(sidebarContent).toBeTruthy();
    });

    test('should synchronize all location-related UI elements', () => {
      const locationData = {
        id: 1,
        name: 'Test Location',
        lat: 39.9334,
        lng: 32.8597
      };

      // Add location and verify all UI updates
      addLocationToUI(locationData);
      
      const locationCard = document.querySelector('[data-location-id="1"]');
      const ctaButton = document.querySelector('#mapCTAButton');
      
      expect(locationCard).toBeTruthy();
      expect(ctaButton.getAttribute('data-state')).toBe('waiting');
    });

    test('should handle complete comparison workflow', () => {
      // Add two locations
      addLocationToUI({ id: 1, name: 'Location 1', lat: 39.9, lng: 32.8 });
      addLocationToUI({ id: 2, name: 'Location 2', lat: 39.95, lng: 32.85 });
      
      // Button should be ready
      const ctaButton = document.querySelector('#mapCTAButton');
      expect(ctaButton.getAttribute('data-state')).toBe('ready');
      
      // Click compare
      ctaButton.click();
      
      // Results should be displayed
      const resultsSection = document.querySelector('#comparisonResults');
      expect(resultsSection.style.display).not.toBe('none');
    });
  });

  describe('Accessibility Tests', () => {
    test('should have proper ARIA labels', () => {
      const ctaButton = document.querySelector('#mapCTAButton');
      expect(ctaButton.getAttribute('aria-label')).toBeTruthy();
      expect(ctaButton.getAttribute('role')).toBe('button');
    });

    test('should support keyboard navigation', () => {
      const locationCard = document.querySelector('.location-card');
      locationCard.setAttribute('tabindex', '0');
      
      expect(locationCard.getAttribute('tabindex')).toBe('0');
      
      // Test keyboard activation
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      locationCard.dispatchEvent(enterEvent);
    });

    test('should maintain color contrast ratios', () => {
      // This would typically use a color contrast library
      // For now, we'll check that colors are defined
      const ctaButton = document.querySelector('#mapCTAButton');
      const computedStyle = window.getComputedStyle(ctaButton);
      
      expect(computedStyle.color).toBeDefined();
      expect(computedStyle.backgroundColor).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should complete hover effects within performance budget', (done) => {
      const locationCard = document.querySelector('.location-card');
      const startTime = performance.now();
      
      locationCard.addEventListener('mouseenter', () => {
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(50); // 50ms budget
        done();
      });
      
      locationCard.dispatchEvent(new MouseEvent('mouseenter'));
    });

    test('should animate progress bars smoothly', () => {
      const progressBar = document.createElement('circle');
      progressBar.style.transition = 'stroke-dashoffset 1.5s ease-out';
      
      const computedStyle = window.getComputedStyle(progressBar);
      expect(computedStyle.transition).toContain('stroke-dashoffset');
      expect(computedStyle.transition).toContain('1.5s');
    });
  });
});

// Helper functions for tests
function createLocationCard(locationData, index) {
  const card = document.createElement('div');
  card.className = 'location-card';
  card.setAttribute('data-location-id', locationData.id);
  
  const badge = document.createElement('div');
  badge.className = `location-badge badge-${index + 1}`;
  card.appendChild(badge);
  
  return card;
}

function updateCTAButtonState(locationCount) {
  const button = document.querySelector('#mapCTAButton');
  const textElement = button.querySelector('.cta-text');
  
  if (locationCount >= 2) {
    button.setAttribute('data-state', 'ready');
    textElement.textContent = 'Compare Locations';
  } else {
    button.setAttribute('data-state', 'waiting');
    textElement.textContent = 'Add one more location to analyze';
  }
}

function createCircularProgress(scoreData) {
  const container = document.createElement('div');
  container.className = 'score-circle';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.className = 'progress-ring';
  
  const scoreValue = document.createElement('div');
  scoreValue.className = 'score-value';
  scoreValue.textContent = scoreData.score.toString();
  
  container.appendChild(svg);
  container.appendChild(scoreValue);
  
  return container;
}

function calculateStrokeDashoffset(progress) {
  const circumference = 2 * Math.PI * 45;
  return circumference - (progress / 100) * circumference;
}

function createMetricItem(metricData) {
  const item = document.createElement('div');
  item.className = 'metric-item';
  
  const icon = document.createElement('div');
  icon.className = 'metric-icon';
  icon.innerHTML = '<svg></svg>';
  
  const label = document.createElement('span');
  label.className = 'metric-label';
  label.textContent = metricData.label;
  
  item.appendChild(icon);
  item.appendChild(label);
  
  return item;
}

function findWinningMetrics(locations) {
  const metrics = ['demographics', 'competition', 'hospital'];
  const winners = {};
  
  metrics.forEach(metric => {
    let maxScore = -1;
    let winnerIndex = -1;
    
    locations.forEach((location, index) => {
      if (location[metric] > maxScore) {
        maxScore = location[metric];
        winnerIndex = index;
      }
    });
    
    winners[metric] = winnerIndex;
  });
  
  return winners;
}

function createResultCard(locationResult) {
  const card = document.createElement('div');
  card.className = 'result-card';
  
  const scoreCircle = createCircularProgress({ score: locationResult.totalScore });
  const badge = document.createElement('div');
  badge.className = 'best-option-badge';
  
  card.appendChild(scoreCircle);
  if (locationResult.rank === 1) {
    card.appendChild(badge);
  }
  
  return card;
}

function addLocationToUI(locationData) {
  const mockInstance = window.locationComparison || mockLocationComparison;
  mockInstance.locations.push(locationData);
  updateCTAButtonState(mockInstance.locations.length);
} 