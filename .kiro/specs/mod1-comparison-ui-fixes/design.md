# Design Document

## Overview

This design document outlines the technical approach for implementing two UI improvements to the `/mod1-comparison` page: enhancing the competitor analysis display to show the top 5 closest competitors in distance order, and replacing badge-style winning indicators with clean borderless stars.

## Architecture

### Current System Analysis

The current system uses the following components:
- **Frontend**: `mod1_comparison.js` handles result display and UI interactions
- **Backend**: `/api/compare-locations` endpoint provides analysis data
- **Detail Panel System**: `DetailPanelManager.js` manages expandable content sections
- **Styling**: `mod1_comparison.css` contains current badge and competitor styling

### Affected Components

1. **Backend API Response**: Competitor data structure in `/api/compare-locations`
2. **Frontend Result Display**: `showResults()` method in `LocationComparison` class
3. **Detail Panel Content**: Competitor section rendering in `DetailPanelManager`
4. **CSS Styling**: Badge and star indicator styles

## Components and Interfaces

### 1. Backend API Enhancement

#### Current Competitor Data Structure
```json
{
  "competitors": [
    {
      "name": "Rakip Eczane",
      "distance": "300m", 
      "impact_score": -15.2
    }
  ]
}
```

#### Enhanced Competitor Data Structure
```json
{
  "competitors": [
    {
      "name": "Rakip Eczane 1",
      "distance": "300m",
      "distance_meters": 300,
      "impact_score": -15.2
    },
    {
      "name": "Rakip Eczane 2", 
      "distance": "450m",
      "distance_meters": 450,
      "impact_score": -8.7
    }
  ]
}
```

### 2. Frontend Result Processing

#### Competitor Sorting Logic
```javascript
// Sort competitors by distance and limit to 5
const sortedCompetitors = competitors
  .sort((a, b) => a.distance_meters - b.distance_meters)
  .slice(0, 5);
```

#### Star Indicator Logic
```javascript
// Determine winning metrics across all locations
const winningMetrics = findWinningMetrics(results);

// Apply star indicators only to highest scoring metrics
const isWinning = winningMetrics[metricType] === locationIndex;
```

### 3. UI Component Updates

#### Competitor Display Component
- **Location**: Detail panel competitor section
- **Behavior**: Show maximum 5 competitors ordered by distance
- **Fallback**: Display "No competitors found" when empty

#### Star Indicator Component  
- **Location**: Metric accordion headers
- **Style**: Borderless ⭐ emoji
- **Logic**: Only show for highest scoring metric in each category

## Data Models

### Competitor Model
```typescript
interface Competitor {
  name: string;           // Business name
  distance: string;       // Human readable distance (e.g., "300m")
  distance_meters: number; // Numeric distance for sorting
  impact_score: number;   // Negative impact on location score
}
```

### Metric Winner Model
```typescript
interface MetricWinners {
  hospital: number;      // Index of location with highest hospital score
  competitor: number;    // Index of location with highest competitor score  
  demographics: number;  // Index of location with highest demographic score
  important: number;     // Index of location with highest important places score
}
```

## Error Handling

### Competitor Data Handling
1. **Empty Competitors**: Display "Bu bölgede rakip işletme bulunamadı" message
2. **Missing Distance Data**: Fall back to original distance string sorting
3. **Invalid Impact Scores**: Default to 0 impact score

### Star Indicator Handling
1. **Tied Scores**: First location in array gets the star indicator
2. **Missing Score Data**: No star displayed for that metric
3. **Invalid Metric Types**: Gracefully ignore unknown metrics

## Testing Strategy

### Unit Tests
1. **Competitor Sorting**: Test distance-based sorting with various data sets
2. **Star Logic**: Test winning metric determination with tied and unique scores
3. **Edge Cases**: Test with empty data, single competitor, identical distances

### Integration Tests
1. **API Response**: Verify enhanced competitor data structure
2. **UI Rendering**: Confirm proper display of sorted competitors and stars
3. **User Interaction**: Test detail panel expansion with new competitor layout

### Visual Tests
1. **Star Appearance**: Verify borderless star styling
2. **Competitor List**: Confirm proper ordering and truncation to 5 items
3. **Responsive Design**: Test on mobile and desktop layouts

## Implementation Notes

### Performance Considerations
- Competitor sorting happens client-side to avoid additional API calls
- Star determination is calculated once during result processing
- CSS changes use existing design system variables

### Accessibility
- Star indicators include proper ARIA labels
- Competitor list maintains semantic HTML structure
- Screen reader friendly distance and impact descriptions

### Browser Compatibility
- Star emoji (⭐) has broad browser support
- CSS changes use standard properties
- JavaScript sorting uses ES5 compatible methods