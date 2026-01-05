#!/usr/bin/env node
/**
 * FlashDoc v3.0/v3.1 Feature Tests
 * Run with: node scripts/v3-features-test.cjs
 *
 * Tests the new features introduced in v3.0:
 * - Type Preview & Override (Dev-Auftrag 1)
 * - Filename Live Preview (Dev-Auftrag 2)
 * - Privacy Mode (Dev-Auftrag 3)
 * - Repeat Last Action (Dev-Auftrag 4)
 *
 * And v3.1 features:
 * - Configurable Contextual Chip Slots (5 slots)
 * - Slot Preset Management (up to 5 presets)
 * - Increased MAX_SHORTCUTS (10)
 */

const fs = require('fs');
const path = require('path');

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const INFO = '\x1b[36mℹ\x1b[0m';

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`  ${PASS} ${name}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${name}${details ? ` - ${details}` : ''}`);
    failed++;
  }
}

function readFile(filename) {
  const filepath = path.join(__dirname, '..', filename);
  return fs.readFileSync(filepath, 'utf-8');
}

console.log('\n\x1b[1m=== FlashDoc v3.0/v3.1 Feature Tests ===\x1b[0m\n');

// ============================================
// Test 1: Type Preview & Override (content.js)
// ============================================
console.log('\x1b[1m[1] Type Preview & Override\x1b[0m');
try {
  const contentJs = readFile('content.js');

  test('Type selector HTML exists',
    contentJs.includes('flashdoc-ctx-type-selector'));

  test('Type menu container exists',
    contentJs.includes('flashdoc-ctx-type-menu'));

  test('quickSaveWithType method exists',
    contentJs.includes('async quickSaveWithType(type)'));

  test('Type display element exists',
    contentJs.includes('flashdoc-ctx-type'));

  test('Type selection event handler exists',
    contentJs.includes('flashdoc-type-option'));

  test('Type menu CSS styles included',
    contentJs.includes('.flashdoc-ctx-type-menu'));

} catch (e) {
  console.log(`  ${FAIL} Could not read content.js: ${e.message}`);
  failed++;
}

// ============================================
// Test 2: Filename Live Preview (options.js/html)
// ============================================
console.log('\n\x1b[1m[2] Filename Live Preview\x1b[0m');
try {
  const optionsJs = readFile('options.js');
  const optionsHtml = readFile('options.html');

  test('Preview container in HTML',
    optionsHtml.includes('id="filename-preview"'));

  test('Preview folder element',
    optionsHtml.includes('id="preview-folder"'));

  test('Preview filename element',
    optionsHtml.includes('id="preview-filename"'));

  test('Preview extension element',
    optionsHtml.includes('id="preview-ext"'));

  test('setupFilenamePreview function exists',
    optionsJs.includes('function setupFilenamePreview()'));

  test('updateFilenamePreview function exists',
    optionsJs.includes('function updateFilenamePreview()'));

  test('normalizeFolderPath helper exists',
    optionsJs.includes('function normalizeFolderPath('));

  test('Preview updates on input change',
    optionsJs.includes("addEventListener('input', updateFilenamePreview"));

} catch (e) {
  console.log(`  ${FAIL} Could not read options files: ${e.message}`);
  failed++;
}

// ============================================
// Test 3: Privacy Mode
// ============================================
console.log('\n\x1b[1m[3] Privacy Mode\x1b[0m');
try {
  const serviceWorker = readFile('service-worker.js');
  const optionsHtml = readFile('options.html');
  const optionsJs = readFile('options.js');
  const popupHtml = readFile('popup.html');
  const popupJs = readFile('popup.js');

  // Service Worker
  test('privacyMode in defaults',
    serviceWorker.includes('privacyMode: false'));

  test('updateContentScriptRegistration method',
    serviceWorker.includes('async updateContentScriptRegistration()'));

  test('injectContentScript method',
    serviceWorker.includes('async injectContentScript(tabId)'));

  test('activateTab message handler',
    serviceWorker.includes("action === 'activateTab'"));

  test('getPrivacyMode message handler',
    serviceWorker.includes("action === 'getPrivacyMode'"));

  // Options
  test('Privacy toggle in options.html',
    optionsHtml.includes('id="privacyMode"'));

  test('Privacy status container',
    optionsHtml.includes('id="privacy-status"'));

  test('updatePrivacyStatus function',
    optionsJs.includes('function updatePrivacyStatus('));

  // Popup
  test('Privacy banner in popup.html',
    popupHtml.includes('id="privacy-banner"'));

  test('Activate button in popup.html',
    popupHtml.includes('id="activate-btn"'));

  test('checkPrivacyMode function in popup.js',
    popupJs.includes('const checkPrivacyMode = async'));

  test('handleActivate function in popup.js',
    popupJs.includes('const handleActivate = async'));

} catch (e) {
  console.log(`  ${FAIL} Could not read files: ${e.message}`);
  failed++;
}

// ============================================
// Test 4: Repeat Last Action
// ============================================
console.log('\n\x1b[1m[4] Repeat Last Action\x1b[0m');
try {
  const serviceWorker = readFile('service-worker.js');
  const popupHtml = readFile('popup.html');
  const popupJs = readFile('popup.js');
  const popupCss = readFile('popup.css');

  // Service Worker - extended stats
  test('lastAction in stats object',
    serviceWorker.includes('lastAction: null'));

  test('lastAction stored on save',
    serviceWorker.includes('this.stats.lastAction = {'));

  test('contentPreview captured',
    serviceWorker.includes('contentPreview: content.substring(0, 100)'));

  // Popup HTML
  test('Repeat button in popup.html',
    popupHtml.includes('id="repeat-action-btn"'));

  test('Repeat type display element',
    popupHtml.includes('id="repeat-type"'));

  // Popup JS
  test('FORMAT_ICONS mapping',
    popupJs.includes('const FORMAT_ICONS = {'));

  test('lastActionData variable',
    popupJs.includes('let lastActionData = null'));

  test('handleRepeatAction function',
    popupJs.includes('const handleRepeatAction = async'));

  test('Recent item click triggers repeat',
    popupJs.includes('handleRepeatAction()'));

  test('repeatActionBtn event listener',
    popupJs.includes("repeatActionBtn.addEventListener('click'"));

  // Popup CSS
  test('repeat-action-btn styles',
    popupCss.includes('.repeat-action-btn {'));

  test('recent-item-icon styles',
    popupCss.includes('.recent-item-icon {'));

  test('recent-item-badge styles',
    popupCss.includes('.recent-item-badge {'));

} catch (e) {
  console.log(`  ${FAIL} Could not read files: ${e.message}`);
  failed++;
}

// ============================================
// Test 5: Manifest & Version
// ============================================
console.log('\n\x1b[1m[5] Manifest Configuration\x1b[0m');
try {
  const manifest = JSON.parse(readFile('manifest.json'));

  test('Manifest version is 3.0',
    manifest.version === '3.0',
    `Current: ${manifest.version}`);

  test('Required permissions present',
    manifest.permissions.includes('scripting') &&
    manifest.permissions.includes('storage'));

  test('Content scripts configured',
    manifest.content_scripts && manifest.content_scripts.length > 0);

  test('Service worker configured',
    manifest.background && manifest.background.service_worker === 'service-worker.js');

} catch (e) {
  console.log(`  ${FAIL} Could not parse manifest.json: ${e.message}`);
  failed++;
}

// ============================================
// Test 6: v3.1 - Configurable Chip Slots
// ============================================
console.log('\n\x1b[1m[6] v3.1: Configurable Chip Slots\x1b[0m');
try {
  const contentJs = readFile('content.js');
  const optionsJs = readFile('options.js');
  const optionsHtml = readFile('options.html');

  // Constants
  test('MAX_SLOTS constant defined',
    optionsJs.includes('const MAX_SLOTS = 5'));

  test('VALID_FORMATS array defined',
    optionsJs.includes('const VALID_FORMATS = ['));

  test('DEFAULT_SLOTS configuration defined',
    optionsJs.includes('const DEFAULT_SLOTS = ['));

  // Normalization functions
  test('normalizeSlot function exists',
    optionsJs.includes('function normalizeSlot(slot'));

  test('normalizeSlots function exists',
    optionsJs.includes('function normalizeSlots(slots'));

  // UI Elements
  test('Slot config container in HTML',
    optionsHtml.includes('id="slots-config"'));

  test('Contextual Chip Slots section in HTML',
    optionsHtml.includes('Contextual Chip Slots'));

  // Content.js slot rendering
  test('FORMAT_ICONS mapping in content.js',
    contentJs.includes('FORMAT_ICONS = {'));

  test('FORMAT_LABELS mapping in content.js',
    contentJs.includes('FORMAT_LABELS = {'));

  test('renderSlotButtons method exists',
    contentJs.includes('renderSlotButtons()'));

  test('floatingButtonSlots in content settings',
    contentJs.includes('floatingButtonSlots'));

  test('slot-disabled CSS class defined',
    contentJs.includes('.slot-disabled'));

  test('storage.onChanged listener for live updates',
    contentJs.includes('chrome.storage.onChanged.addListener'));

} catch (e) {
  console.log(`  ${FAIL} Could not read files: ${e.message}`);
  failed++;
}

// ============================================
// Test 7: v3.1 - Preset Management
// ============================================
console.log('\n\x1b[1m[7] v3.1: Preset Management\x1b[0m');
try {
  const optionsJs = readFile('options.js');
  const optionsHtml = readFile('options.html');
  const optionsCss = readFile('options.css');

  // Constants
  test('MAX_PRESETS constant defined',
    optionsJs.includes('const MAX_PRESETS = 5'));

  // Normalization functions
  test('normalizePreset function exists',
    optionsJs.includes('function normalizePreset(preset'));

  test('normalizePresets function exists',
    optionsJs.includes('function normalizePresets(presets'));

  // UI Elements
  test('Preset selector in HTML',
    optionsHtml.includes('id="preset-selector"'));

  test('Preset save button in HTML',
    optionsHtml.includes('id="preset-save"'));

  test('Preset delete button in HTML',
    optionsHtml.includes('id="preset-delete"'));

  test('Preset new button in HTML',
    optionsHtml.includes('id="preset-new"'));

  test('Preset count display in HTML',
    optionsHtml.includes('id="preset-count"'));

  // CSS Styles
  test('Preset section styles exist',
    optionsCss.includes('.preset-section'));

  test('Preset toolbar styles exist',
    optionsCss.includes('.preset-toolbar'));

} catch (e) {
  console.log(`  ${FAIL} Could not read files: ${e.message}`);
  failed++;
}

// ============================================
// Test 8: v3.1 - Increased MAX_SHORTCUTS
// ============================================
console.log('\n\x1b[1m[8] v3.1: Increased MAX_SHORTCUTS\x1b[0m');
try {
  const optionsJs = readFile('options.js');
  const optionsHtml = readFile('options.html');
  const serviceWorker = readFile('service-worker.js');

  // MAX_SHORTCUTS = 10
  test('MAX_SHORTCUTS is 10 in options.js',
    optionsJs.includes('const MAX_SHORTCUTS = 10'));

  test('Shortcut count shows /10 in HTML',
    optionsHtml.includes('0/10 Shortcuts'));

  // Service worker defaults
  test('floatingButtonSlots in service worker defaults',
    serviceWorker.includes('floatingButtonSlots:'));

  test('floatingButtonPresets in service worker defaults',
    serviceWorker.includes('floatingButtonPresets:'));

  test('activeFloatingButtonPresetId in service worker defaults',
    serviceWorker.includes('activeFloatingButtonPresetId:'));

} catch (e) {
  console.log(`  ${FAIL} Could not read files: ${e.message}`);
  failed++;
}

// ============================================
// Summary
// ============================================
console.log('\n\x1b[1m=== Test Summary ===\x1b[0m');
console.log(`  ${PASS} Passed: ${passed}`);
console.log(`  ${FAIL} Failed: ${failed}`);
console.log(`  Total: ${passed + failed}\n`);

if (failed > 0) {
  console.log('\x1b[31mSome tests failed. Please fix before deployment.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32mAll tests passed! Ready for deployment.\x1b[0m\n');
  process.exit(0);
}
