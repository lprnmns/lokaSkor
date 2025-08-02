# Implementation Plan for Each UI Module

## Overview
This document outlines the specific implementation approach for adding translation functionality to each UI module in the project.

## 1. Main Landing Page (`landing-page/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Create `src/locales/` directory with `en/` and `tr/` subdirectories
   - Add `common.json`, `components.json`, and `pages.json` translation files
   - Create translation context and provider components

2. **Integrate Language Selector**
   - Add LanguageSelector component to `App.tsx`
   - Position in top right corner with fixed positioning

3. **Component Translation**
   - Identify all text elements in components
   - Replace hardcoded strings with translation keys
   - Use `useTranslation` hook in all components

4. **Testing**
   - Verify language switching works correctly
   - Check all UI elements are properly translated
   - Test responsive design with language selector

### Files to Modify
- `src/App.tsx` - Add TranslationProvider and LanguageSelector
- `src/components/*` - Add translation hooks and replace text
- `src/locales/*` - Create translation files

## 2. Location IQ Visualizer (`lovable-location-iq-visualize-main/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Create `src/locales/` directory with language subdirectories
   - Add translation files for common strings, pages, and components

2. **Integrate Language Selector**
   - Add LanguageSelector to main `App.tsx`
   - Ensure consistent positioning with other modules

3. **Page Translation**
   - Translate `pages/Index.tsx` and `pages/NotFound.tsx`
   - Add translation to all UI components in `components/`

4. **UI Component Translation**
   - Translate all shadcn/ui components
   - Add translation support to custom components

### Files to Modify
- `src/App.tsx` - Add translation provider and language selector
- `src/pages/*` - Add translation support
- `src/components/*` - Add translation hooks
- `src/locales/*` - Create translation files

## 3. Location Addition Interface (`mod1_lokasyon_ekleme_arayüzü/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Create locales directory with translation files
   - Implement translation context and provider

2. **Integrate Language Selector**
   - Add LanguageSelector to main App component
   - Position consistently with other modules

3. **Component Translation**
   - Translate all components in `src/components/`
   - Add translation to `Location.ts` type definitions where needed

4. **Feature-Specific Translation**
   - Translate location-specific terminology
   - Add translations for location categories

### Files to Modify
- `src/App.tsx` - Add translation provider
- `src/components/*` - Add translation support
- `src/locales/*` - Create translation files

## 4. Shop Comparison Interface (`Mod1-Belirli_Dükkanları_Karşılaştır/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Create locales directory with language files
   - Implement translation context

2. **Integrate Language Selector**
   - Add LanguageSelector to main App component

3. **UI Translation**
   - Translate all text elements in the simple UI
   - Ensure consistent terminology with other modules

### Files to Modify
- `src/App.tsx` - Add translation provider and language selector
- `src/locales/*` - Create translation files

## 5. Mode Selection (`mode-selection-main/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Create locales directory
   - Add translation files for mode selection options

2. **Integrate Language Selector**
   - Add LanguageSelector to main App component

3. **Mode Translation**
   - Translate mode names and descriptions
   - Ensure consistency with terminology used in other modules

### Files to Modify
- `src/App.tsx` - Add translation provider
- `src/locales/*` - Create translation files

## 6. Main Application Components (`src/components/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Create locales directory with comprehensive translation files
   - Implement translation context and provider

2. **Integrate Language Selector**
   - Add LanguageSelector to main dashboard component

3. **Component Translation**
   - Translate all dashboard components
   - Add translation to test files where appropriate

4. **Library Translation**
   - Translate error messages and API responses
   - Add translation support to hooks and utilities

### Files to Modify
- `src/components/LocationDashboard/LocationDashboard.tsx` - Add translation provider
- `src/components/LocationDashboard/*` - Add translation support
- `src/lib/*` - Add translation to error messages and utilities
- `src/locales/*` - Create translation files

## 7. HTML Templates (`templates/new_ui/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Create `templates/locales/` directory
   - Add `en.json` and `tr.json` translation files

2. **Integrate Language Selector**
   - Add HTML language selector to each template
   - Include CSS styling for consistent appearance

3. **Template Translation**
   - Add `data-i18n` attributes to all text elements
   - Include translation engine script in each template

4. **Component Translation**
   - Translate reusable components
   - Ensure inheritance of translation context

### Files to Modify
- `templates/new_ui/*.html` - Add language selector and data attributes
- `templates/new_ui/components/*.html` - Add data attributes
- `templates/locales/*` - Create translation files
- `static/js/translation-engine.js` - Implement translation engine

## 8. JavaScript Files (`static/js/new_ui/`)

### Implementation Steps
1. **Setup Translation Infrastructure**
   - Enhance existing translation utilities
   - Ensure all JS files can access translation functions

2. **Integrate Language Events**
   - Add event listeners for language changes
   - Update UI text when language changes

3. **Module Translation**
   - Add translation support to each JavaScript module
   - Replace hardcoded strings with translation keys

4. **Performance Optimization**
   - Implement caching for translation lookups
   - Optimize event handling for language changes

### Files to Modify
- `static/js/translation-utils.js` - Enhance translation utilities
- `static/js/language-events.js` - Implement event system
- `static/js/new_ui/*.js` - Add translation support to each module

## Implementation Order

### Phase 1: Infrastructure Setup
1. Create shared translation utilities
2. Implement language selector component
3. Set up translation file structure

### Phase 2: Core Modules
1. Main Landing Page (`landing-page/`)
2. Location IQ Visualizer (`lovable-location-iq-visualize-main/`)

### Phase 3: Supporting Modules
1. Location Addition Interface
2. Shop Comparison Interface
3. Mode Selection
4. Main Application Components

### Phase 4: Legacy UI
1. HTML Templates
2. JavaScript Files

## Quality Assurance

### Testing Approach
1. **Functional Testing**
   - Verify language switching works in all modules
   - Check all text elements are properly translated
   - Test persistence of language selection

2. **UI Testing**
   - Ensure language selector is visible and functional
   - Verify responsive design across all modules
   - Check for text overflow or layout issues

3. **Integration Testing**
   - Test consistency of terminology across modules
   - Verify translation context is properly inherited
   - Check performance impact of translation system

### Validation Criteria
- All user-facing text is translated
- Language selector appears in top right corner of all pages
- Language selection persists across sessions
- No broken UI elements after translation implementation
- Consistent terminology across all modules
- Minimal performance impact

## Rollout Strategy

### Development Approach
1. Implement in feature branches for each module
2. Create comprehensive test suites for translation functionality
3. Review and merge changes incrementally
4. Deploy to staging environment for validation

### Deployment Considerations
- Ensure translation files are properly deployed
- Verify CDN caching of translation files
- Monitor performance impact after deployment
- Prepare rollback plan if issues are discovered

## Maintenance

### Ongoing Tasks
1. Regular updates to translation files
2. Add new translations for feature additions
3. Monitor for missing translations
4. Optimize translation performance