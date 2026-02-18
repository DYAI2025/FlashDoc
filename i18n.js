/**
 * FlashDoc i18n Module
 * Provides internationalization support with runtime language detection
 */

// Cache for loaded messages
let messageCache = null;
let currentLocale = null;

/**
 * Get the current locale from Chrome i18n API
 * Falls back to 'en' if not available
 */
export function getCurrentLocale() {
  if (currentLocale) {
    return currentLocale;
  }

  // Try Chrome i18n API first
  try {
    const chromeLocale = chrome.i18n.getUILanguage?.() || 
                         chrome.i18n.getAcceptLanguages?.()?.[0] ||
                         navigator.language;
    
    // Normalize locale (e.g., 'en-US' -> 'en')
    currentLocale = normalizeLocale(chromeLocale);
    return currentLocale;
  } catch (e) {
    console.warn('[i18n] Chrome i18n API not available, using navigator.language');
    currentLocale = normalizeLocale(navigator.language || 'en');
    return currentLocale;
  }
}

/**
 * Normalize locale code to supported format
 * @param {string} locale - Raw locale string
 * @returns {string} Normalized locale code
 */
function normalizeLocale(locale) {
  if (!locale) return 'en';
  
  // Handle formats like 'en-US', 'en_US', 'de-DE' etc.
  const normalized = locale.toLowerCase().replace(/[-_]/g, '-');
  
  // Map to supported locales
  const supportedLocales = ['en', 'de', 'es', 'fr', 'ja', 'zh_cn', 'zh'];
  
  // Exact match
  if (supportedLocales.includes(normalized)) {
    return normalized;
  }
  
  // Handle Chinese variants
  if (normalized.startsWith('zh')) {
    return 'zh_cn';
  }
  
  // Default to English for unsupported locales
  return 'en';
}

/**
 * Check if RTL mode should be enabled for current locale
 * @returns {boolean} True if RTL layout should be used
 */
export function isRTLLocale() {
  const locale = getCurrentLocale();
  const rtlLocales = ['he', 'ar', 'fa', 'ur'];
  return rtlLocales.some(rtl => locale.startsWith(rtl));
}

/**
 * Load messages for a specific locale
 * @param {string} locale - Locale code (e.g., 'en', 'de')
 * @returns {Promise<Object>} Messages object
 */
async function loadMessages(locale) {
  const cacheKey = `messages_${locale}`;
  
  // Check cache first
  if (messageCache && messageCache[locale]) {
    return messageCache[locale];
  }
  
  try {
    // Try to load from _locales directory
    const response = await fetch(`_locales/${locale}/messages.json`);
    
    if (response.ok) {
      const messages = await response.json();
      
      // Initialize cache if needed
      if (!messageCache) {
        messageCache = {};
      }
      messageCache[locale] = messages;
      
      return messages;
    }
    
    // Fallback to English if locale not found
    if (locale !== 'en') {
      console.warn(`[i18n] Locale '${locale}' not found, falling back to 'en'`);
      return loadMessages('en');
    }
    
    return {};
  } catch (error) {
    console.warn(`[i18n] Failed to load messages for '${locale}':`, error);
    
    // Fallback to English
    if (locale !== 'en') {
      return loadMessages('en');
    }
    
    return {};
  }
}

/**
 * Get a localized message by key
 * Supports nested keys with dot notation (e.g., 'popup.title')
 * @param {string} key - Message key
 * @param {Object} substitutions - Optional substitutions for placeholders
 * @returns {string} Localized message
 */
export function getMessage(key, substitutions = {}) {
  try {
    // Try Chrome i18n API first
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
      let message = chrome.i18n.getMessage(key);
      
      if (message) {
        // Apply substitutions
        message = applySubstitutions(message, substitutions);
        return message;
      }
    }
    
    // Fallback to our message system
    const locale = getCurrentLocale();
    
    // Load messages if not cached
    if (!messageCache || !messageCache[locale]) {
      // For synchronous access, we'll try to use cached version
      if (messageCache && messageCache['en']) {
        return getMessageFromObject(messageCache['en'], key, substitutions);
      }
      return key; // Return key as fallback
    }
    
    return getMessageFromObject(messageCache[locale], key, substitutions);
  } catch (error) {
    console.warn(`[i18n] Error getting message for key '${key}':`, error);
    return key;
  }
}

/**
 * Get message from messages object with nested key support
 * @param {Object} messages - Messages object
 * @param {string} key - Dot-notation key
 * @param {Object} substitutions - Placeholder substitutions
 * @returns {string} Message or key if not found
 */
function getMessageFromObject(messages, key, substitutions = {}) {
  const keys = key.split('.');
  let value = messages;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  // Handle Chrome message format
  if (value && typeof value === 'object' && value.message) {
    let message = value.message;
    message = applySubstitutions(message, substitutions);
    return message;
  }
  
  if (typeof value === 'string') {
    return applySubstitutions(value, substitutions);
  }
  
  return key;
}

/**
 * Apply substitutions to message
 * Supports $variable$ and {variable} formats
 * @param {string} message - Message with placeholders
 * @param {Object} substitutions - Key-value pairs for substitution
 * @returns {string} Message with substitutions applied
 */
function applySubstitutions(message, substitutions) {
  if (!message || !substitutions) return message || '';
  
  let result = message;
  
  // Handle Chrome $placeholder$ format
  for (const [key, value] of Object.entries(substitutions)) {
    // $key$ format
    result = result.replace(new RegExp(`\\$${key}\\$`, 'g'), String(value));
    // {key} format
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  
  return result;
}

/**
 * Initialize i18n for the extension
 * Preloads messages for the current locale
 * @returns {Promise<string>} Current locale
 */
export async function initI18n() {
  const locale = getCurrentLocale();
  
  // Preload messages for current locale
  await loadMessages(locale);
  
  // Log locale for debugging
  console.log(`[i18n] Initialized with locale: ${locale}, RTL: ${isRTLLocale()}`);
  
  return locale;
}

/**
 * Get all supported locales
 * @returns {string[]} Array of supported locale codes
 */
export function getSupportedLocales() {
  return ['en', 'de', 'es', 'fr', 'ja', 'zh_cn'];
}

/**
 * Get locale info for display
 * @returns {Object} Locale information with code, name, and RTL status
 */
export function getLocaleInfo() {
  const locale = getCurrentLocale();
  
  const localeNames = {
    'en': 'English',
    'de': 'Deutsch',
    'es': 'Español',
    'fr': 'Français',
    'ja': '日本語',
    'zh_cn': '中文(简体)',
    'zh': '中文'
  };
  
  return {
    code: locale,
    name: localeNames[locale] || locale,
    isRTL: isRTLLocale(),
    supported: getSupportedLocales().includes(locale)
  };
}

/**
 * Apply RTL classes to document body
 * Should be called after DOM is ready
 */
export function applyRTLStyles() {
  if (isRTLLocale()) {
    document.body.classList.add('rtl');
    document.body.setAttribute('dir', 'rtl');
  } else {
    document.body.classList.remove('rtl');
    document.body.setAttribute('dir', 'ltr');
  }
}

// Export for use in other scripts
window.i18n = {
  getCurrentLocale,
  getMessage,
  initI18n,
  isRTLLocale,
  getSupportedLocales,
  getLocaleInfo,
  applyRTLStyles
};
