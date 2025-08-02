# LocationIQ UI/UX Refactoring - Technical Specifications

## Architecture Overview

### Current Implementation Analysis
- **Template Engine**: Jinja2 server-side rendering
- **CSS Framework**: Custom design system with CSS custom properties
- **JavaScript**: Vanilla JS with class-based architecture
- **Map Library**: Leaflet.js v1.9.4 with custom markers
- **State Management**: Object-oriented approach with DOM manipulation

### Design System Integration
- **Colors**: Use existing CSS custom properties from `design_system.css`
- **Typography**: System font stack with consistent sizing
- **Spacing**: Follow established spacing scale (--spacing-*)
- **Animations**: Leverage existing animation framework

## Component Specifications

### 1. Sidebar Layout Component

#### Structure
```html
<aside class="location-sidebar">
  <div class="sidebar-content aligned-content">
    <div class="location-input-section">...</div>
    <div class="selected-locations">
      <div class="location-card" data-location-id="1">
        <div class="location-badge badge-1"></div>
        <div class="location-info">...</div>
      </div>
    </div>
  </div>
</aside>
```

#### CSS Classes
```css
.aligned-content {
  padding-left: var(--header-horizontal-padding);
  margin-left: 0;
}

.location-card {
  position: relative;
  transition: all 0.3s ease;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}

.location-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  position: absolute;
  top: -8px;
  right: -8px;
}
```

#### Color Mapping
- **Location 1**: `#ef4444` (Red)
- **Location 2**: `#3b82f6` (Blue) 
- **Location 3**: `#10b981` (Green)

### 2. Map CTA Component

#### Structure
```html
<div class="map-cta-container">
  <button class="map-cta-button" data-state="waiting">
    <span class="cta-icon">+</span>
    <span class="cta-text">Add one more location to analyze</span>
  </button>
</div>
```

#### States & Styling
```css
.map-cta-button[data-state="waiting"] {
  background-color: rgba(255, 255, 255, 0.9);
  color: #6b7280;
  border: 2px solid rgba(107, 114, 128, 0.3);
}

.map-cta-button[data-state="ready"] {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

#### Positioning
```css
.map-cta-container {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none;
}

.map-cta-button {
  pointer-events: auto;
  border-radius: 30px;
  padding: 12px 24px;
  transition: all 0.2s ease-in-out;
}
```

### 3. Results Section Component

#### Circular Progress Bar Specification
```html
<div class="score-circle">
  <svg viewBox="0 0 100 100" class="progress-ring">
    <circle cx="50" cy="50" r="45" class="progress-ring-background"/>
    <circle cx="50" cy="50" r="45" class="progress-ring-progress" 
            stroke-dasharray="282.74" stroke-dashoffset="198.32"/>
  </svg>
  <div class="score-value">39</div>
</div>
```

#### Icon System
```html
<div class="metric-item">
  <div class="metric-icon">
    <svg class="icon-hospital">...</svg>
  </div>
  <div class="metric-content">
    <span class="metric-label">Hastane Yakınlığı</span>
    <div class="metric-progress">...</div>
  </div>
</div>
```

#### Color Coding
- **Hospital**: `#ef4444` (Red)
- **Competition**: `#10b981` (Green)
- **Demographics**: `#8b5cf6` (Purple)
- **Important Places**: `#f59e0b` (Amber)

## Interactive Specifications

### Hover Effects

#### Card-to-Pin Interaction
```javascript
// On card hover
card.addEventListener('mouseenter', () => {
  const marker = this.getMarkerById(locationId);
  marker.setStyle({
    transform: 'scale(1.2)',
    zIndex: 1000
  });
});

// On card leave
card.addEventListener('mouseleave', () => {
  marker.setStyle({
    transform: 'scale(1)',
    zIndex: 100
  });
});
```

#### Pin-to-Card Interaction
```javascript
// On marker hover
marker.on('mouseover', () => {
  const card = document.querySelector(`[data-location-id="${locationId}"]`);
  card.classList.add('highlighted');
});

marker.on('mouseout', () => {
  card.classList.remove('highlighted');
});
```

### Animation Timings
- **Hover transitions**: `0.2s ease-in-out`
- **State changes**: `0.3s ease`
- **Progress animations**: `1.5s ease-out`
- **Map interactions**: `0.15s ease`

## Performance Considerations

### CSS Optimizations
- Use `transform` and `opacity` for animations (GPU acceleration)
- Implement `will-change` property for animated elements
- Minimize repaints with composite layers

### JavaScript Optimizations
- Debounce hover events (100ms)
- Use requestAnimationFrame for smooth animations
- Implement efficient event delegation

### Loading Strategy
- Progressive enhancement approach
- Graceful degradation for older browsers
- Lazy load heavy animations

## Browser Compatibility

### Supported Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Fallbacks
- CSS custom properties fallbacks
- Transform fallbacks for older browsers
- SVG fallbacks to CSS borders

## Accessibility Specifications

### ARIA Labels
```html
<button class="map-cta-button" 
        aria-label="Compare selected locations"
        role="button"
        tabindex="0">
```

### Keyboard Navigation
- Tab order: Input fields → Location cards → CTA button → Results
- Enter/Space activation for interactive elements
- Focus indicators for all clickable elements

### Screen Reader Support
- Semantic HTML structure
- Live regions for dynamic updates
- Descriptive text for visual elements

## Testing Criteria

### Unit Tests
- Component rendering
- State management
- Event handling
- Animation completion

### Integration Tests
- Card-pin interaction synchronization
- CTA button state transitions
- Results section data binding

### Visual Regression Tests
- Layout alignment verification
- Color consistency checks
- Animation smoothness validation

### Performance Tests
- Animation frame rate monitoring
- Memory usage tracking
- Initial load time measurement
