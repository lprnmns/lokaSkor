# HTML Templates Translation Strategy

## Overview
This strategy defines how to implement translation functionality in HTML templates within the project.

## Core Implementation

### 1. Translation Data Structure
Create JSON files for each language containing key-value pairs for translations:

```json
// templates/locales/en.json
{
  "header": {
    "welcome": "Welcome to our application",
    "signIn": "Sign In"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

```json
// templates/locales/tr.json
{
  "header": {
    "welcome": "Uygulamamıza Hoşgeldiniz",
    "signIn": "Giriş Yap"
  },
  "navigation": {
    "home": "Ana Sayfa",
    "about": "Hakkında",
    "contact": "İletişim"
  }
}
```

### 2. Translation Engine
Create a JavaScript translation engine to handle language switching:

```javascript
// static/js/translation-engine.js
class TranslationEngine {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'tr';
    this.translations = {};
    this.init();
  }

  async init() {
    await this.loadTranslations(this.currentLanguage);
  }

  async loadTranslations(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      this.translations[lang] = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (!translation[k]) return key; // Return key if translation not found
      translation = translation[k];
    }
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
    
    return translation;
  }

  async changeLanguage(lang) {
    await this.loadTranslations(lang);
    this.translatePage();
  }

  translatePage() {
    // Find all elements with data-i18n attribute and translate them
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const params = {};
      
      // Check for parameters
      const paramAttrs = element.getAttribute('data-i18n-params');
      if (paramAttrs) {
        try {
          Object.assign(params, JSON.parse(paramAttrs));
        } catch (e) {
          console.error('Error parsing translation parameters:', e);
        }
      }
      
      element.textContent = this.t(key, params);
    });
  }
}

// Initialize translation engine
const translator = new TranslationEngine();
```

## Integration Steps for HTML Templates

### 1. Template Modification
Add data attributes to HTML elements that need translation:

```html
<!-- Before translation -->
<h1>Welcome to our application</h1>
<button>Sign In</button>

<!-- After translation -->
<h1 data-i18n="header.welcome"></h1>
<button data-i18n="buttons.signIn"></button>
```

### 2. Language Selector Implementation
Add language selector to the top right corner of each template:

```html
<!-- Add to the header section of each HTML template -->
<div class="language-selector" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
  <select id="language-select" onchange="changeLanguage(this.value)">
    <option value="tr" selected>Türkçe</option>
    <option value="en">English</option>
  </select>
</div>
```

### 3. JavaScript Integration
Include the translation engine and initialization script in each template:

```html
<!-- At the end of each HTML template body -->
<script src="/js/translation-engine.js"></script>
<script>
  // Initialize translations when page loads
  document.addEventListener('DOMContentLoaded', function() {
    translator.translatePage();
    
    // Set the language selector to current language
    document.getElementById('language-select').value = translator.currentLanguage;
  });
  
  // Language change handler
  function changeLanguage(lang) {
    translator.changeLanguage(lang).then(() => {
      translator.translatePage();
    });
  }
</script>
```

## Specific Implementation for Each Template

### 1. Business Selection (`templates/new_ui/business_selection.html`)
- Add data-i18n attributes to all text elements
- Add language selector to top right corner
- Include translation engine scripts

### 2. Landing Page (`templates/new_ui/landing.html`)
- Add data-i18n attributes to all text elements
- Add language selector to top right corner
- Include translation engine scripts

### 3. Mode Selection (`templates/new_ui/mode_selection.html`)
- Add data-i18n attributes to all text elements
- Add language selector to top right corner
- Include translation engine scripts

### 4. Map Container Component (`templates/new_ui/components/map_container.html`)
- Add data-i18n attributes to text elements
- Include translation engine scripts (inherited from parent template)

### 5. Sidebar Component (`templates/new_ui/components/sidebar.html`)
- Add data-i18n attributes to text elements
- Include translation engine scripts (inherited from parent template)

## Translation File Structure

Create a locales directory for HTML templates:

```
templates/
  locales/
    en.json
    tr.json
```

## Implementation Example

```html
<!DOCTYPE html>
<html>
<head>
  <title data-i18n="page.title">Location Finder</title>
</head>
<body>
  <!-- Language Selector -->
  <div class="language-selector" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
    <select id="language-select" onchange="changeLanguage(this.value)">
      <option value="tr">Türkçe</option>
      <option value="en">English</option>
    </select>
  </div>
  
  <!-- Page Content -->
  <header>
    <h1 data-i18n="header.welcome"></h1>
    <nav>
      <a href="#" data-i18n="navigation.home"></a>
      <a href="#" data-i18n="navigation.about"></a>
      <a href="#" data-i18n="navigation.contact"></a>
    </nav>
  </header>
  
  <main>
    <p data-i18n="content.description"></p>
    <button data-i18n="buttons.submit"></button>
  </main>
  
  <!-- Translation Scripts -->
  <script src="/js/translation-engine.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      translator.translatePage();
      document.getElementById('language-select').value = translator.currentLanguage;
    });
    
    function changeLanguage(lang) {
      translator.changeLanguage(lang).then(() => {
        translator.translatePage();
      });
    }
  </script>
</body>
</html>
```

## Key Considerations

1. **Performance**: Load translation files asynchronously to avoid blocking page rendering
2. **Fallback**: Provide fallback to default language if translation is missing
3. **Dynamic Content**: Handle dynamically added content that may require translation
4. **SEO**: Consider SEO implications of client-side translations
5. **Accessibility**: Ensure language selector is accessible to screen readers
6. **Caching**: Implement caching for translation files to reduce server requests