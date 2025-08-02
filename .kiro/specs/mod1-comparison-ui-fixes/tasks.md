# Implementation Plan

- [x] 1. Enhance backend competitor data structure


  - Modify the `/api/compare-locations` endpoint in `app.py` to include `distance_meters` field for each competitor
  - Ensure competitor data is sorted by distance before sending to frontend
  - Add proper error handling for missing or invalid competitor distance data
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 2. Update frontend competitor display logic
  - [x] 2.1 Modify competitor data processing in `mod1_comparison.js`


    - Update the `showResults()` method to handle new competitor data structure
    - Implement client-side sorting by `distance_meters` field as fallback
    - Add logic to limit competitors to maximum of 5 items
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 2.2 Update DetailPanelManager competitor section rendering



    - Modify competitor panel content generation in `DetailPanelManager.js`
    - Implement "No competitors found" message for empty competitor arrays
    - Ensure proper distance and impact score display formatting
    - _Requirements: 1.3, 1.5_

- [ ] 3. Implement star indicator system
  - [x] 3.1 Update metric winner determination logic


    - Modify `findWinningMetrics()` function in `mod1_comparison.js` to properly identify highest scoring metrics
    - Ensure star indicators are only shown for the actual highest score in each category
    - Handle edge cases like tied scores and missing data
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 3.2 Replace badge styling with borderless stars


    - Update `createMetricItem()` function to use ⭐ emoji instead of badge elements
    - Remove badge-related CSS classes and styling from metric headers
    - Ensure star indicators have proper ARIA labels for accessibility
    - _Requirements: 2.1, 2.2_

- [x] 4. Update CSS styling for clean star appearance

  - Remove existing `.category-leader-badge` styles from `mod1_comparison.css`
  - Add new `.metric-star-indicator` class with borderless, clean styling
  - Ensure star indicators align properly with metric headers
  - _Requirements: 2.2_

- [ ] 5. Test and validate implementation
  - [x] 5.1 Test competitor sorting and limiting functionality


    - Verify competitors are displayed in distance order (nearest to farthest)
    - Confirm maximum of 5 competitors are shown
    - Test edge cases with no competitors, fewer than 5 competitors, and identical distances
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 5.2 Test star indicator display

    - Verify stars only appear for highest scoring metrics
    - Test with multiple locations to ensure proper winner determination
    - Confirm main total score styling remains unchanged
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 6. Handle error cases and edge scenarios




  - Add proper error handling for malformed competitor data
  - Implement graceful fallbacks when distance data is missing
  - Ensure UI remains functional when API returns unexpected data structures
  - _Requirements: 1.3, 1.5_