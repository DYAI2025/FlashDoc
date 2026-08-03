/**
 * FlashDoc i18n runtime (classic script, no module syntax).
 *
 * Chrome only substitutes __MSG_key__ placeholders in manifest.json and CSS
 * files — NOT in HTML. This script localizes extension pages at runtime by
 * replacing __MSG_key__ tokens in text nodes and common attributes using
 * chrome.i18n.getMessage(), and applies RTL layout when needed.
 *
 * Locale message files live in _locales/<locale>/messages.json with flat
 * Chrome-conformant keys (e.g. popup_title, actions_smartDesc).
 */
(function () {
  'use strict';

  var MSG_TOKEN = /__MSG_([A-Za-z0-9_@]+)__/g;
  var RTL_LOCALES = ['he', 'ar', 'fa', 'ur'];

  function getMessage(key, substitutions) {
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
        var msg = chrome.i18n.getMessage(key, substitutions);
        if (msg) return msg;
      }
    } catch (e) {
      console.warn('[i18n] getMessage failed for "' + key + '":', e);
    }
    return '';
  }

  function getCurrentLocale() {
    try {
      return chrome.i18n.getUILanguage() || 'en';
    } catch (e) {
      return (navigator.language || 'en');
    }
  }

  function isRTLLocale() {
    var locale = getCurrentLocale().toLowerCase();
    return RTL_LOCALES.some(function (rtl) { return locale.indexOf(rtl) === 0; });
  }

  function replaceTokens(text) {
    return text.replace(MSG_TOKEN, function (full, key) {
      var msg = getMessage(key);
      return msg || full; // keep token visible if key missing → test-detectable
    });
  }

  /** Replace __MSG_key__ tokens in all text nodes and common attributes. */
  function localizeDocument(root) {
    var doc = root || document;
    var walker = doc.createTreeWalker(doc.body || doc.documentElement, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf('__MSG_') !== -1) {
        node.nodeValue = replaceTokens(node.nodeValue);
      }
    }
    var attrs = ['title', 'placeholder', 'aria-label', 'alt', 'value'];
    var els = (doc.body || doc.documentElement).querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      for (var a = 0; a < attrs.length; a++) {
        var val = els[i].getAttribute(attrs[a]);
        if (val && val.indexOf('__MSG_') !== -1) {
          els[i].setAttribute(attrs[a], replaceTokens(val));
        }
      }
    }
    if (doc.title && doc.title.indexOf('__MSG_') !== -1) {
      doc.title = replaceTokens(doc.title);
    }
  }

  function applyRTLStyles() {
    if (isRTLLocale()) {
      document.body.classList.add('rtl');
      document.body.setAttribute('dir', 'rtl');
    } else {
      document.body.classList.remove('rtl');
      document.body.setAttribute('dir', 'ltr');
    }
  }

  function initI18n() {
    localizeDocument(document);
    applyRTLStyles();
    return getCurrentLocale();
  }

  window.i18n = {
    getMessage: getMessage,
    getCurrentLocale: getCurrentLocale,
    isRTLLocale: isRTLLocale,
    localizeDocument: localizeDocument,
    applyRTLStyles: applyRTLStyles,
    initI18n: initI18n
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})();
