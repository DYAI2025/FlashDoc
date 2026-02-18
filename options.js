const CONTEXT_MENU_OPTIONS = [
  { id: 'auto', label: 'Smart auto-detect', description: 'Let FlashDoc choose the best format', emoji: '🎯' },
  { id: 'txt', label: 'Plain text (.txt)', description: 'Simple notes and prose', emoji: '📄' },
  { id: 'md', label: 'Markdown (.md)', description: 'Lightweight formatted docs', emoji: '📝' },
  { id: 'docx', label: 'Word (.docx)', description: 'Microsoft Word documents', emoji: '📜' },
  { id: 'json', label: 'JSON (.json)', description: 'APIs and structured data', emoji: '🧩' },
  { id: 'js', label: 'JavaScript (.js)', description: 'Browser and Node snippets', emoji: '🟡' },
  { id: 'ts', label: 'TypeScript (.ts)', description: 'Typed code blocks', emoji: '🔵' },
  { id: 'py', label: 'Python (.py)', description: 'Scripts & notebooks', emoji: '🐍' },
  { id: 'html', label: 'HTML (.html)', description: 'Templates and snippets', emoji: '🌐' },
  { id: 'css', label: 'CSS (.css)', description: 'Stylesheets', emoji: '🎨' },
  { id: 'xml', label: 'XML (.xml)', description: 'Configs and feeds', emoji: '📰' },
  { id: 'sql', label: 'SQL (.sql)', description: 'Database queries', emoji: '📑' },
  { id: 'sh', label: 'Shell (.sh)', description: 'Bash & shell scripts', emoji: '⚙️' },
  { id: 'yaml', label: 'YAML (.yaml)', description: 'Configs & workflows', emoji: '🧾' },
  { id: 'csv', label: 'CSV (.csv)', description: 'Spreadsheets and tables', emoji: '📊' },
  { id: 'pdf', label: 'PDF (.pdf)', description: 'Portable documents', emoji: '📕' },
  { id: 'label', label: 'Label (89×28mm PDF)', description: 'Ready-to-print labels', emoji: '🏷️' },
  { id: 'saveas', label: 'Save As…', description: 'Pick folder & filename each time', emoji: '📁' }
];

// v3.1 Constants (must be defined before DEFAULT_SETTINGS)
const MAX_SHORTCUTS = 10;
const MAX_SLOTS = 5;
const MAX_PRESETS = 5;
const VALID_FORMATS = ['txt', 'md', 'docx', 'pdf', 'json', 'js', 'ts', 'py', 'html', 'css', 'yaml', 'sql', 'sh', 'xml', 'csv', 'saveas'];

const DEFAULT_SLOTS = [
  { type: 'format', format: 'txt' },
  { type: 'format', format: 'md' },
  { type: 'format', format: 'docx' },
  { type: 'format', format: 'pdf' },
  { type: 'format', format: 'saveas' }
];

const DEFAULT_SETTINGS = {
  folderPath: 'FlashDocs/',
  namingPattern: 'timestamp',
  customPattern: 'file_{date}',
  organizeByType: true,
  showNotifications: true,
  playSound: false,
  autoDetectType: true,
  enableContextMenu: true,
  showFloatingButton: true,
  showCornerBall: false, // F3: Corner ball visibility (disabled by default)
  buttonPosition: 'bottom-right',
  autoHideButton: true,
  selectionThreshold: 10,
  enableSmartDetection: true,
  trackFormatUsage: true,
  trackDetectionAccuracy: true,
  showFormatRecommendations: true,
  contextMenuFormats: CONTEXT_MENU_OPTIONS.map(option => option.id),
  // Category Shortcuts: prefix + format combo
  categoryShortcuts: [], // Array of {id, name, format} objects, max 10
  // Privacy Mode: 'off' | 'on' | 'smart'
  privacyMode: 'off',
  // URL patterns for Smart privacy mode (array of glob strings)
  privacyPatterns: [],
  // v3.1: Configurable contextual chip slots
  floatingButtonSlots: DEFAULT_SLOTS,
  floatingButtonPresets: [],
  activeFloatingButtonPresetId: null
};

// Normalize a single slot with fallback handling
function normalizeSlot(slot, shortcuts = []) {
  if (!slot || typeof slot !== 'object') {
    return { type: 'disabled', _warning: 'invalid_slot' };
  }

  if (slot.type === 'format') {
    if (VALID_FORMATS.includes(slot.format)) {
      return { type: 'format', format: slot.format };
    }
    return { type: 'disabled', _warning: 'invalid_format' };
  }

  if (slot.type === 'shortcut') {
    const exists = shortcuts.some(s => s.id === slot.shortcutId);
    if (exists) {
      return { type: 'shortcut', shortcutId: slot.shortcutId };
    }
    return { type: 'disabled', _warning: 'shortcut_deleted' };
  }

  if (slot.type === 'disabled') {
    return { type: 'disabled' };
  }

  return { type: 'disabled', _warning: 'unknown_type' };
}

// Normalize all slots with fallback to defaults
function normalizeSlots(slots, shortcuts = []) {
  if (!Array.isArray(slots) || slots.length !== MAX_SLOTS) {
    return DEFAULT_SLOTS.map(s => normalizeSlot(s, shortcuts));
  }
  return slots.map(slot => normalizeSlot(slot, shortcuts));
}

// Normalize preset with validation
function normalizePreset(preset, shortcuts = []) {
  if (!preset || typeof preset !== 'object' || !preset.id || !preset.name) {
    return null;
  }
  return {
    id: preset.id,
    name: String(preset.name).substring(0, 30),
    slots: normalizeSlots(preset.slots, shortcuts),
    createdAt: preset.createdAt || Date.now()
  };
}

// Normalize all presets
function normalizePresets(presets, shortcuts = []) {
  if (!Array.isArray(presets)) return [];
  return presets
    .map(p => normalizePreset(p, shortcuts))
    .filter(p => p !== null)
    .slice(0, MAX_PRESETS);
}

const manifest = chrome.runtime.getManifest();

document.addEventListener('DOMContentLoaded', () => {
  renderVersion();
  setupForm();
  loadSettings();
  loadRecommendations();
  // Category Shortcuts management
  setupShortcutUI();
  loadShortcuts();
  // Live filename preview
  setupFilenamePreview();
  // Privacy URL pattern manager
  setupPrivacyPatterns();
  // v3.1: Contextual chip slots and presets
  setupSlotConfiguration();
  setupPresetManagement();
});

function renderVersion() {
  const versionEl = document.getElementById('extension-version');
  if (versionEl) {
    versionEl.textContent = `v${manifest.version}`;
  }
}

function setupForm() {
  const form = document.getElementById('options-form');
  const namingPattern = document.getElementById('namingPattern');
  const customPatternRow = document.getElementById('custom-pattern-row');
  const selectionSlider = document.getElementById('selectionThreshold');
  const selectionValue = document.getElementById('selectionThresholdValue');
  const showFloatingButton = document.getElementById('showFloatingButton');
  const buttonPositionRow = document.getElementById('button-position-row');
  const resetButton = document.getElementById('reset-defaults');

  renderContextMenuFormatOptions(DEFAULT_SETTINGS.contextMenuFormats);

  if (namingPattern && customPatternRow) {
    namingPattern.addEventListener('change', () => {
      const isCustom = namingPattern.value === 'custom';
      customPatternRow.classList.toggle('hidden', !isCustom);
    });
  }

  if (selectionSlider && selectionValue) {
    const updateSliderValue = () => {
      selectionValue.textContent = selectionSlider.value;
    };
    selectionSlider.addEventListener('input', updateSliderValue);
    selectionSlider.addEventListener('change', updateSliderValue);
  }

  if (showFloatingButton && buttonPositionRow) {
    const togglePositionVisibility = () => {
      buttonPositionRow.classList.toggle('hidden', !showFloatingButton.checked);
    };
    showFloatingButton.addEventListener('change', togglePositionVisibility);
  }

  // Privacy mode selector: show/hide patterns section
  const privacyModeEl = document.getElementById('privacyMode');
  if (privacyModeEl) {
    privacyModeEl.addEventListener('change', () => {
      updatePrivacyStatus(privacyModeEl.value);
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      if (confirm('Alle Einstellungen auf Standard zurücksetzen?')) {
        await chrome.storage.sync.clear();
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
        applySettings(DEFAULT_SETTINGS);
        renderSlotDropdowns();
        renderPresetSelector();
        loadShortcuts();
        await refreshBackgroundSettings();
        showStatusMessage('Alle Einstellungen zurückgesetzt.', 'success');
      }
    });
  }

  // Per-section save buttons
  setupSectionSaveButtons();

  // Prevent form submission (no global save anymore)
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  }
}

// Per-section save handlers
function setupSectionSaveButtons() {
  document.querySelectorAll('[data-save-section]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const section = btn.dataset.saveSection;
      await saveSectionSettings(section);
    });
  });
}

async function saveSectionSettings(section) {
  const form = document.getElementById('options-form');
  if (!form) return;

  let updates = {};

  switch (section) {
    case 'storage':
      updates = {
        folderPath: (form.folderPath.value || DEFAULT_SETTINGS.folderPath).trim() || DEFAULT_SETTINGS.folderPath,
        namingPattern: form.namingPattern.value || DEFAULT_SETTINGS.namingPattern,
        customPattern: (form.customPattern.value || DEFAULT_SETTINGS.customPattern).trim() || DEFAULT_SETTINGS.customPattern,
        organizeByType: form.organizeByType.checked
      };
      break;

    case 'capture':
      updates = {
        autoDetectType: form.autoDetectType.checked,
        enableSmartDetection: form.enableSmartDetection.checked,
        selectionThreshold: Number(form.selectionThreshold.value || DEFAULT_SETTINGS.selectionThreshold)
      };
      break;

    case 'privacy': {
      const modeSelect = document.getElementById('privacyMode');
      const mode = modeSelect ? modeSelect.value : DEFAULT_SETTINGS.privacyMode;
      // Read current patterns from storage (they're managed separately via add/delete)
      const privacyStored = await chrome.storage.sync.get(['privacyPatterns']);
      updates = {
        privacyMode: mode,
        privacyPatterns: privacyStored.privacyPatterns || DEFAULT_SETTINGS.privacyPatterns
      };
      updatePrivacyStatus(mode);
      break;
    }

    case 'interface':
      updates = {
        showFloatingButton: form.showFloatingButton.checked,
        buttonPosition: form.buttonPosition.value || DEFAULT_SETTINGS.buttonPosition,
        autoHideButton: form.autoHideButton.checked,
        enableContextMenu: form.enableContextMenu.checked
      };
      break;

    case 'contextmenu':
      const selectedFormats = getSelectedContextMenuFormats(form);
      updates = {
        contextMenuFormats: selectedFormats.length ? selectedFormats : DEFAULT_SETTINGS.contextMenuFormats
      };
      break;

    case 'cornerball':
      updates = {
        showCornerBall: form.showCornerBall?.checked ?? DEFAULT_SETTINGS.showCornerBall
      };
      break;

    case 'feedback':
      updates = {
        showNotifications: form.showNotifications.checked,
        playSound: form.playSound.checked
      };
      break;

    case 'tracking':
      updates = {
        trackFormatUsage: form.trackFormatUsage?.checked ?? DEFAULT_SETTINGS.trackFormatUsage,
        trackDetectionAccuracy: form.trackDetectionAccuracy?.checked ?? DEFAULT_SETTINGS.trackDetectionAccuracy,
        showFormatRecommendations: form.showFormatRecommendations?.checked ?? DEFAULT_SETTINGS.showFormatRecommendations
      };
      break;

    default:
      return;
  }

  try {
    await chrome.storage.sync.set(updates);
    await refreshBackgroundSettings();
    notifyContentScripts();
    showStatusMessage('Gespeichert ✓', 'success');
  } catch (error) {
    console.error('Failed to save section:', section, error);
    showStatusMessage('Speichern fehlgeschlagen.', 'error');
  }
}

async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(null);
    const settings = { ...DEFAULT_SETTINGS, ...stored };
    applySettings(settings);
  } catch (error) {
    console.error('Failed to load settings', error);
    showStatusMessage('Unable to load saved settings.', 'error');
  }
}

async function readFormSettings(form) {
  const data = new FormData(form);
  // Preserve existing shortcuts - they're managed separately
  const stored = await chrome.storage.sync.get(['categoryShortcuts']);
  const settings = { ...DEFAULT_SETTINGS, categoryShortcuts: stored.categoryShortcuts || [] };

  settings.folderPath = (data.get('folderPath') || DEFAULT_SETTINGS.folderPath).trim() || DEFAULT_SETTINGS.folderPath;
  settings.namingPattern = data.get('namingPattern') || DEFAULT_SETTINGS.namingPattern;
  settings.customPattern = (data.get('customPattern') || DEFAULT_SETTINGS.customPattern).trim() || DEFAULT_SETTINGS.customPattern;
  settings.organizeByType = form.organizeByType.checked;
  settings.showNotifications = form.showNotifications.checked;
  settings.playSound = form.playSound.checked;
  settings.autoDetectType = form.autoDetectType.checked;
  settings.enableContextMenu = form.enableContextMenu.checked;
  settings.showFloatingButton = form.showFloatingButton.checked;
  settings.showCornerBall = form.showCornerBall?.checked ?? DEFAULT_SETTINGS.showCornerBall;
  settings.buttonPosition = form.buttonPosition.value || DEFAULT_SETTINGS.buttonPosition;
  settings.autoHideButton = form.autoHideButton.checked;
  settings.selectionThreshold = Number(form.selectionThreshold.value || DEFAULT_SETTINGS.selectionThreshold);
  settings.enableSmartDetection = form.enableSmartDetection.checked;
  settings.trackFormatUsage = form.trackFormatUsage?.checked ?? DEFAULT_SETTINGS.trackFormatUsage;
  settings.trackDetectionAccuracy = form.trackDetectionAccuracy?.checked ?? DEFAULT_SETTINGS.trackDetectionAccuracy;
  settings.showFormatRecommendations = form.showFormatRecommendations?.checked ?? DEFAULT_SETTINGS.showFormatRecommendations;
  const privacySelect = document.getElementById('privacyMode');
  settings.privacyMode = privacySelect ? privacySelect.value : DEFAULT_SETTINGS.privacyMode;
  const selectedFormats = getSelectedContextMenuFormats(form);
  settings.contextMenuFormats = selectedFormats.length ? selectedFormats : DEFAULT_SETTINGS.contextMenuFormats;

  return settings;
}

function applySettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  const form = document.getElementById('options-form');
  if (!form) {
    return;
  }

  form.folderPath.value = merged.folderPath;
  form.namingPattern.value = merged.namingPattern;
  form.customPattern.value = merged.customPattern;
  form.organizeByType.checked = merged.organizeByType;
  form.showNotifications.checked = merged.showNotifications;
  form.playSound.checked = merged.playSound;
  form.autoDetectType.checked = merged.autoDetectType;
  form.enableContextMenu.checked = merged.enableContextMenu;
  form.showFloatingButton.checked = merged.showFloatingButton;
  if (form.showCornerBall) form.showCornerBall.checked = merged.showCornerBall;
  form.buttonPosition.value = merged.buttonPosition;
  form.autoHideButton.checked = merged.autoHideButton;
  form.selectionThreshold.value = merged.selectionThreshold;
  form.enableSmartDetection.checked = merged.enableSmartDetection;
  if (form.trackFormatUsage) form.trackFormatUsage.checked = merged.trackFormatUsage;
  if (form.trackDetectionAccuracy) form.trackDetectionAccuracy.checked = merged.trackDetectionAccuracy;
  if (form.showFormatRecommendations) form.showFormatRecommendations.checked = merged.showFormatRecommendations;
  const privacyModeSelect = document.getElementById('privacyMode');
  if (privacyModeSelect) {
    // Migration: convert old boolean to new tri-state
    if (merged.privacyMode === true) {
      privacyModeSelect.value = 'on';
    } else if (merged.privacyMode === false) {
      privacyModeSelect.value = 'off';
    } else {
      privacyModeSelect.value = merged.privacyMode || 'off';
    }
  }
  setContextMenuFormatSelections(merged.contextMenuFormats);
  updatePrivacyStatus(merged.privacyMode);

  const customPatternRow = document.getElementById('custom-pattern-row');
  if (customPatternRow) {
    customPatternRow.classList.toggle('hidden', merged.namingPattern !== 'custom');
  }

  const selectionValue = document.getElementById('selectionThresholdValue');
  if (selectionValue) {
    selectionValue.textContent = String(merged.selectionThreshold);
  }

  const buttonPositionRow = document.getElementById('button-position-row');
  if (buttonPositionRow) {
    buttonPositionRow.classList.toggle('hidden', !merged.showFloatingButton);
  }
}

async function saveSettings(settings, { showStatus } = {}) {
  try {
    await chrome.storage.sync.set(settings);
    await refreshBackgroundSettings();
    if (showStatus) {
      showStatusMessage('Preferences saved.', 'success');
    }
  } catch (error) {
    console.error('Failed to save settings', error);
    showStatusMessage('Could not save preferences. Try again.', 'error');
  }
}

async function refreshBackgroundSettings() {
  try {
    await chrome.runtime.sendMessage({ action: 'refreshSettings' });
  } catch (error) {
    // Service worker might be sleeping; ignore the error as settings are persisted.
    if (error && error.message) {
      console.warn('Refresh message failed:', error.message);
    }
  }
}

function showStatusMessage(message, intent = 'info') {
  const statusEl = document.getElementById('status-message');
  if (!statusEl) {
    return;
  }

  statusEl.textContent = message;
  statusEl.classList.remove('success', 'error');

  if (intent === 'success') {
    statusEl.classList.add('success');
  } else if (intent === 'error') {
    statusEl.classList.add('error');
  }

  if (intent === 'success') {
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.classList.remove('success', 'error');
    }, 2500);
  }
}

async function loadRecommendations() {
  try {
    const stats = await chrome.storage.local.get(['stats', 'formatUsage', 'detectionAccuracy']);
    const recommendations = generateRecommendations(stats);
    displayRecommendations(recommendations);
  } catch (error) {
    console.error('Failed to load recommendations:', error);
  }
}

function generateRecommendations(stats) {
  const recommendations = [];

  // Get format usage data
  const formatUsage = stats.formatUsage || {};
  const totalFiles = stats.stats?.totalFiles || 0;

  // Recommendation 1: Most used format
  const formats = Object.entries(formatUsage);
  if (formats.length > 0) {
    const mostUsed = formats.sort((a, b) => b[1] - a[1])[0];
    recommendations.push({
      icon: '📊',
      title: `Most Used Format: ${mostUsed[0].toUpperCase()}`,
      description: `You've saved ${mostUsed[1]} files in this format (${Math.round((mostUsed[1] / totalFiles) * 100)}% of total)`
    });
  } else {
    recommendations.push({
      icon: '🎯',
      title: 'Smart Auto-Detection Enabled',
      description: 'FlashDoc will automatically detect the best format for your content'
    });
  }

  // Recommendation 2: Detection accuracy
  const accuracy = stats.detectionAccuracy || {};
  const totalDetections = accuracy.total || 0;
  const correctDetections = accuracy.correct || 0;
  const accuracyRate = totalDetections > 0 ? Math.round((correctDetections / totalDetections) * 100) : 0;

  if (totalDetections > 5) {
    recommendations.push({
      icon: accuracyRate > 80 ? '✅' : '⚠️',
      title: `Detection Accuracy: ${accuracyRate}%`,
      description: `${correctDetections} out of ${totalDetections} auto-detections were accurate`
    });
  } else {
    recommendations.push({
      icon: '💡',
      title: 'New Format Detection Features',
      description: 'Now supports TypeScript, XML, SQL, Shell scripts, and more!'
    });
  }

  // Recommendation 3: Suggested formats based on usage
  const supportedFormats = ['ts', 'tsx', 'xml', 'sql', 'sh', 'bash', 'css'];
  const unusedFormats = supportedFormats.filter(fmt => !formatUsage[fmt]);

  if (unusedFormats.length > 0 && totalFiles > 10) {
    const formatList = unusedFormats.slice(0, 3).map(f => f.toUpperCase()).join(', ');
    recommendations.push({
      icon: '🆕',
      title: 'Try New Formats',
      description: `Explore these newly available formats: ${formatList}`
    });
  } else {
    recommendations.push({
      icon: '⚡',
      title: `${totalFiles} Files Saved`,
      description: 'Keep saving with FlashDoc for better recommendations!'
    });
  }

  return recommendations;
}

function displayRecommendations(recommendations) {
  const listEl = document.getElementById('recommendations-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  recommendations.forEach(rec => {
    const item = document.createElement('div');
    item.className = 'recommendation-item';
    item.innerHTML = `
      <span class="rec-icon">${rec.icon}</span>
      <div class="rec-content">
        <strong>${rec.title}</strong>
        <p>${rec.description}</p>
      </div>
    `;
    listEl.appendChild(item);
  });
}

function renderContextMenuFormatOptions(selectedFormats = []) {
  const container = document.getElementById('context-menu-formats');
  if (!container) return;

  container.innerHTML = '';
  CONTEXT_MENU_OPTIONS.forEach(option => {
    const label = document.createElement('label');
    label.className = 'format-option';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'contextMenuFormats';
    input.value = option.id;
    input.checked = selectedFormats.includes(option.id);

    const icon = document.createElement('div');
    icon.className = 'format-icon';
    icon.textContent = option.emoji;

    const copy = document.createElement('div');
    copy.className = 'format-copy';
    const title = document.createElement('strong');
    title.textContent = option.label;
    const description = document.createElement('span');
    description.textContent = option.description;
    copy.appendChild(title);
    copy.appendChild(description);

    label.appendChild(input);
    label.appendChild(icon);
    label.appendChild(copy);
    container.appendChild(label);
  });
}

function setContextMenuFormatSelections(selectedFormats = []) {
  const checkboxes = document.querySelectorAll('input[name="contextMenuFormats"]');
  checkboxes.forEach(box => {
    box.checked = selectedFormats.includes(box.value);
  });
}

function getSelectedContextMenuFormats(form) {
  return Array.from(form.querySelectorAll('input[name="contextMenuFormats"]'))
    .filter(input => input.checked)
    .map(input => input.value);
}

// Prefix Shortcuts Management Functions

function renderShortcutList(shortcuts = []) {
  const container = document.getElementById('shortcut-list');
  if (!container) return;

  container.innerHTML = '';

  if (shortcuts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚡</span>
        <p>Noch keine Shortcuts erstellt</p>
      </div>
    `;
    updateShortcutCount(0);
    return;
  }

  const formatEmojis = {
    txt: '📄', md: '📝', docx: '📜', pdf: '📕', json: '🧩',
    js: '🟡', ts: '🔵', py: '🐍', html: '🌐', css: '🎨',
    yaml: '🧾', sql: '📑', sh: '⚙️'
  };

  shortcuts.forEach((shortcut) => {
    const item = document.createElement('div');
    item.className = 'shortcut-item';
    const emoji = formatEmojis[shortcut.format] || '📄';

    item.innerHTML = `
      <span class="shortcut-emoji">${emoji}</span>
      <span class="shortcut-label">${shortcut.name}_save.${shortcut.format}</span>
      <button type="button" class="shortcut-delete" title="Löschen">✕</button>
    `;

    item.querySelector('.shortcut-delete').addEventListener('click', () => {
      deleteShortcut(shortcut.id);
    });

    container.appendChild(item);
  });

  updateShortcutCount(shortcuts.length);
}

function updateShortcutCount(count) {
  const countEl = document.getElementById('shortcut-count');
  if (countEl) {
    countEl.textContent = `${count}/10 Shortcuts`;
    countEl.classList.toggle('at-limit', count >= MAX_SHORTCUTS);
  }

  const addBtn = document.getElementById('add-shortcut');
  const nameInput = document.getElementById('new-shortcut-name');
  const formatSelect = document.getElementById('new-shortcut-format');

  if (addBtn) addBtn.disabled = count >= MAX_SHORTCUTS;
  if (nameInput) nameInput.disabled = count >= MAX_SHORTCUTS;
  if (formatSelect) formatSelect.disabled = count >= MAX_SHORTCUTS;
}

async function addShortcut() {
  const nameInput = document.getElementById('new-shortcut-name');
  const formatSelect = document.getElementById('new-shortcut-format');

  if (!nameInput || !formatSelect) return;

  const name = nameInput.value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const format = formatSelect.value;

  if (!name) {
    showStatusMessage('Bitte einen Prefix-Namen eingeben.', 'error');
    nameInput.focus();
    return;
  }

  const settings = await chrome.storage.sync.get(['categoryShortcuts']);
  const shortcuts = settings.categoryShortcuts || [];

  if (shortcuts.length >= MAX_SHORTCUTS) {
    showStatusMessage(`Maximum ${MAX_SHORTCUTS} Shortcuts erlaubt.`, 'error');
    return;
  }

  // Check for duplicates
  const isDuplicate = shortcuts.some(s =>
    s.name.toLowerCase() === name.toLowerCase() && s.format === format
  );

  if (isDuplicate) {
    showStatusMessage('Dieser Shortcut existiert bereits.', 'error');
    return;
  }

  const newShortcut = {
    id: `shortcut_${Date.now()}`,
    name: name,
    format: format
  };

  shortcuts.push(newShortcut);
  await chrome.storage.sync.set({ categoryShortcuts: shortcuts });

  // Clear input field
  nameInput.value = '';

  renderShortcutList(shortcuts);
  await refreshBackgroundSettings();
  notifyContentScripts();
  showStatusMessage(`✓ "${name}_save.${format}" hinzugefügt`, 'success');
}

async function deleteShortcut(shortcutId) {
  const settings = await chrome.storage.sync.get(['categoryShortcuts']);
  const shortcuts = (settings.categoryShortcuts || []).filter(s => s.id !== shortcutId);
  await chrome.storage.sync.set({ categoryShortcuts: shortcuts });
  renderShortcutList(shortcuts);
  await refreshBackgroundSettings();
  notifyContentScripts();
  showStatusMessage('Shortcut gelöscht.', 'success');
}

function setupShortcutUI() {
  const addBtn = document.getElementById('add-shortcut');
  const nameInput = document.getElementById('new-shortcut-name');

  if (addBtn) {
    addBtn.addEventListener('click', addShortcut);
  }

  // Allow Enter key to add shortcut
  if (nameInput) {
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addShortcut();
      }
    });
  }
}

async function loadShortcuts() {
  const settings = await chrome.storage.sync.get(['categoryShortcuts']);
  renderShortcutList(settings.categoryShortcuts || []);
}

// Privacy Mode Status Display

function updatePrivacyStatus(mode) {
  const statusEl = document.getElementById('privacy-status');
  const patternsSection = document.getElementById('privacy-patterns-section');
  if (!statusEl) return;

  // Migration: convert old boolean to new tri-state
  if (mode === true) mode = 'on';
  if (mode === false) mode = 'off';

  // Show/hide patterns section
  if (patternsSection) {
    patternsSection.classList.toggle('hidden', mode !== 'smart');
  }

  if (mode === 'on') {
    statusEl.innerHTML = `
      <div class="privacy-badge enabled">
        <span class="badge-icon">🔒</span>
        <span class="badge-text">Privacy Mode: Always On</span>
      </div>
      <p class="privacy-note">Content scripts will not run automatically on any page. The extension popup and keyboard shortcuts still work. Click "Activate" in the popup to enable scripts on a specific page.</p>
    `;
  } else if (mode === 'smart') {
    statusEl.innerHTML = `
      <div class="privacy-badge smart">
        <span class="badge-icon">🧠</span>
        <span class="badge-text">Privacy Mode: Smart</span>
      </div>
      <p class="privacy-note">Content scripts are blocked on pages matching your URL patterns below. On all other pages, FlashDoc works normally.</p>
    `;
  } else {
    statusEl.innerHTML = `
      <div class="privacy-badge disabled">
        <span class="badge-icon">🌐</span>
        <span class="badge-text">Privacy Mode: Off</span>
      </div>
      <p class="privacy-note">FlashDoc is active on all pages for instant text selection.</p>
    `;
  }
}

// Live Filename Preview Functions

function setupFilenamePreview() {
  const inputs = ['folderPath', 'namingPattern', 'customPattern', 'organizeByType'];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateFilenamePreview);
      el.addEventListener('change', updateFilenamePreview);
    }
  });

  // Initial preview
  updateFilenamePreview();
}

function updateFilenamePreview() {
  const previewContainer = document.getElementById('filename-preview');
  const folderEl = document.getElementById('preview-folder');
  const filenameEl = document.getElementById('preview-filename');
  const extEl = document.getElementById('preview-ext');

  if (!previewContainer || !folderEl || !filenameEl || !extEl) return;

  // Get current values
  const folderPath = (document.getElementById('folderPath')?.value || 'FlashDocs/').trim();
  const pattern = document.getElementById('namingPattern')?.value || 'timestamp';
  const customPattern = document.getElementById('customPattern')?.value || 'file_{date}';
  const organizeByType = document.getElementById('organizeByType')?.checked || false;

  // Generate preview components
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
  const exampleType = 'md'; // Example format

  // Build folder path
  let folder = normalizeFolderPath(folderPath);
  if (organizeByType) {
    folder += exampleType + '/';
  }

  // Build filename based on pattern
  let filename;
  switch (pattern) {
    case 'timestamp':
      filename = `flashdoc_${date}_${time}`;
      break;
    case 'firstline':
      filename = 'first_line_of_selection';
      break;
    case 'custom':
      filename = (customPattern || 'file_{date}')
        .replace(/{date}/g, date)
        .replace(/{time}/g, time)
        .replace(/{type}/g, exampleType);
      // Sanitize filename
      filename = filename.replace(/[<>:"/\\|?*]/g, '_');
      break;
    default:
      filename = `flashdoc_${date}_${time}`;
  }

  // Update display
  folderEl.textContent = folder;
  filenameEl.textContent = filename;
  extEl.textContent = '.' + exampleType;

  // Animate update
  previewContainer.classList.add('updating');
  setTimeout(() => previewContainer.classList.remove('updating'), 300);
}

function normalizeFolderPath(path) {
  if (!path) return '';

  // Trim whitespace
  let normalized = path.trim();

  // Remove leading slashes (relative to Downloads)
  normalized = normalized.replace(/^\/+/, '');

  // Remove directory traversal attempts
  normalized = normalized.replace(/\.\.\//g, '');

  // Ensure trailing slash
  if (normalized && !normalized.endsWith('/')) {
    normalized += '/';
  }

  return normalized;
}

// ============================================
// v3.1: Contextual Chip Slot Configuration
// ============================================

const FORMAT_LABELS = {
  txt: '📄 Text', md: '📝 Markdown', docx: '📜 Word', pdf: '📕 PDF',
  json: '🧩 JSON', js: '🟡 JavaScript', ts: '🔵 TypeScript', py: '🐍 Python',
  html: '🌐 HTML', css: '🎨 CSS', yaml: '🧾 YAML', sql: '📑 SQL',
  sh: '⚙️ Shell', xml: '📰 XML', csv: '📊 CSV', saveas: '📁 Save As'
};

function setupSlotConfiguration() {
  const container = document.getElementById('slots-config');
  if (!container) return;

  // Initial render
  renderSlotDropdowns();

  // Listen for shortcut changes to update options
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.categoryShortcuts || changes.floatingButtonSlots) {
      renderSlotDropdowns();
    }
  });
}

const FORMAT_EMOJIS = {
  txt: '📄', md: '📝', docx: '📜', pdf: '📕', json: '🧩',
  js: '🟡', ts: '🔵', py: '🐍', html: '🌐', css: '🎨',
  yaml: '🧾', sql: '📑', sh: '⚙️', xml: '📰', csv: '📊', saveas: '📁'
};

async function renderSlotDropdowns() {
  const container = document.getElementById('slots-config');
  if (!container) return;

  const stored = await chrome.storage.sync.get(['floatingButtonSlots', 'categoryShortcuts']);
  const shortcuts = stored.categoryShortcuts || [];
  const slots = normalizeSlots(stored.floatingButtonSlots, shortcuts);

  container.innerHTML = '';

  for (let i = 0; i < MAX_SLOTS; i++) {
    const slot = slots[i];
    const slotEl = document.createElement('div');
    slotEl.className = 'slot-config-item';

    const select = document.createElement('select');
    select.id = `slot-${i}`;
    select.name = `slot-${i}`;
    select.className = 'slot-select-compact';
    select.title = `Slot ${i + 1}`;

    // Build options: Disabled, Formats, Shortcuts
    let optionsHtml = '<option value="disabled">⬜</option>';
    for (const fmt of VALID_FORMATS) {
      const selected = slot.type === 'format' && slot.format === fmt ? 'selected' : '';
      optionsHtml += `<option value="format:${fmt}" ${selected}>${FORMAT_EMOJIS[fmt] || '📄'} .${fmt}</option>`;
    }

    if (shortcuts.length > 0) {
      optionsHtml += '<optgroup label="Shortcuts">';
      for (const s of shortcuts) {
        const selected = slot.type === 'shortcut' && slot.shortcutId === s.id ? 'selected' : '';
        const emoji = FORMAT_EMOJIS[s.format] || '📄';
        optionsHtml += `<option value="shortcut:${s.id}" ${selected}>${emoji} ${s.name}</option>`;
      }
      optionsHtml += '</optgroup>';
    }

    select.innerHTML = optionsHtml;

    // Restore selection
    if (slot.type === 'format') {
      select.value = `format:${slot.format}`;
    } else if (slot.type === 'shortcut') {
      select.value = `shortcut:${slot.shortcutId}`;
    } else {
      select.value = 'disabled';
    }

    // Add warning indicator for invalid slots
    if (slot._warning) {
      select.classList.add('slot-warning');
      select.title = `Warning: ${slot._warning}`;
    }

    select.addEventListener('change', () => {
      saveSlotConfiguration();
      updateSlotPreview();
    });

    slotEl.appendChild(select);
    container.appendChild(slotEl);
  }

  // Update the visual preview
  updateSlotPreview();
}

function updateSlotPreview() {
  const previewContainer = document.getElementById('preview-slot-buttons');
  if (!previewContainer) return;

  const previewSlots = previewContainer.querySelectorAll('.preview-slot');

  for (let i = 0; i < MAX_SLOTS; i++) {
    const select = document.getElementById(`slot-${i}`);
    const previewSlot = previewSlots[i];

    if (!select || !previewSlot) continue;

    const value = select.value;
    let emoji = '⬜';

    if (value.startsWith('format:')) {
      const fmt = value.replace('format:', '');
      emoji = FORMAT_EMOJIS[fmt] || '📄';
    } else if (value.startsWith('shortcut:')) {
      // Find shortcut emoji
      const option = select.querySelector(`option[value="${value}"]`);
      if (option) {
        emoji = option.textContent.split(' ')[0];
      }
    }

    previewSlot.textContent = emoji;
  }
}

async function saveSlotConfiguration() {
  const slots = [];
  const stored = await chrome.storage.sync.get(['categoryShortcuts']);
  const shortcuts = stored.categoryShortcuts || [];

  for (let i = 0; i < MAX_SLOTS; i++) {
    const select = document.getElementById(`slot-${i}`);
    if (!select) continue;

    const value = select.value;
    if (value === 'disabled') {
      slots.push({ type: 'disabled' });
    } else if (value.startsWith('format:')) {
      slots.push({ type: 'format', format: value.replace('format:', '') });
    } else if (value.startsWith('shortcut:')) {
      slots.push({ type: 'shortcut', shortcutId: value.replace('shortcut:', '') });
    } else {
      slots.push({ type: 'disabled' });
    }
  }

  const normalizedSlots = normalizeSlots(slots, shortcuts);
  await chrome.storage.sync.set({ floatingButtonSlots: normalizedSlots });
  await refreshBackgroundSettings();
  notifyContentScripts();
  showStatusMessage('Slot configuration saved.', 'success');
}

// ============================================
// v3.1: Preset Management
// ============================================

function setupPresetManagement() {
  const selector = document.getElementById('preset-selector');
  const applyBtn = document.getElementById('preset-apply');
  const saveBtn = document.getElementById('preset-save');
  const deleteBtn = document.getElementById('preset-delete');
  const newBtn = document.getElementById('preset-new');

  if (selector) {
    // Don't auto-apply on selection - wait for Apply button
    selector.addEventListener('change', updatePresetButtonStates);
    renderPresetSelector();
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', applySelectedPreset);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveCurrentPreset);
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteCurrentPreset);
  }

  if (newBtn) {
    newBtn.addEventListener('click', createNewPreset);
  }

  // Initial button state
  updatePresetButtonStates();
}

async function renderPresetSelector() {
  const selector = document.getElementById('preset-selector');
  const countEl = document.getElementById('preset-count');
  const activeNameEl = document.getElementById('active-preset-name');
  const activeIndicator = document.getElementById('active-preset-indicator');
  if (!selector) return;

  const stored = await chrome.storage.sync.get(['floatingButtonPresets', 'activeFloatingButtonPresetId', 'categoryShortcuts']);
  const shortcuts = stored.categoryShortcuts || [];
  const presets = normalizePresets(stored.floatingButtonPresets, shortcuts);
  const activeId = stored.activeFloatingButtonPresetId;

  selector.innerHTML = '<option value="">— Preset wählen —</option>';

  let activePresetName = null;
  presets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    // Don't auto-select the active preset in dropdown
    selector.appendChild(option);

    if (preset.id === activeId) {
      activePresetName = preset.name;
    }
  });

  // Update active preset indicator
  if (activeNameEl) {
    activeNameEl.textContent = activePresetName || 'Keins';
    activeNameEl.classList.toggle('has-active', !!activePresetName);
  }
  if (activeIndicator) {
    activeIndicator.classList.toggle('active', !!activePresetName);
  }

  if (countEl) {
    countEl.textContent = `${presets.length}/${MAX_PRESETS} Presets`;
    countEl.classList.toggle('at-limit', presets.length >= MAX_PRESETS);
  }

  // Disable new button if at limit
  const newBtn = document.getElementById('preset-new');
  if (newBtn) {
    newBtn.disabled = presets.length >= MAX_PRESETS;
  }

  updatePresetButtonStates();
}

function updatePresetButtonStates() {
  const selector = document.getElementById('preset-selector');
  const applyBtn = document.getElementById('preset-apply');
  const saveBtn = document.getElementById('preset-save');
  const deleteBtn = document.getElementById('preset-delete');

  const hasSelection = selector && selector.value;

  if (applyBtn) applyBtn.disabled = !hasSelection;
  if (saveBtn) saveBtn.disabled = !hasSelection;
  if (deleteBtn) deleteBtn.disabled = !hasSelection;
}

async function applySelectedPreset() {
  const selector = document.getElementById('preset-selector');
  if (!selector || !selector.value) {
    showStatusMessage('Bitte wähle zuerst ein Preset aus.', 'error');
    return;
  }

  try {
    const presetId = selector.value;
    const stored = await chrome.storage.sync.get(['floatingButtonPresets', 'categoryShortcuts']);
    const shortcuts = stored.categoryShortcuts || [];
    const presets = stored.floatingButtonPresets || [];

    console.log('[FlashDoc] Applying preset:', presetId, 'Available:', presets.map(p => p.id));

    // Find preset directly (without over-normalizing)
    const preset = presets.find(p => p && p.id === presetId);

    if (preset) {
      // Normalize slots before applying
      const normalizedSlots = normalizeSlots(preset.slots, shortcuts);

      await chrome.storage.sync.set({
        floatingButtonSlots: normalizedSlots,
        activeFloatingButtonPresetId: presetId
      });

      await renderSlotDropdowns();
      await renderPresetSelector();
      await refreshBackgroundSettings();
      notifyContentScripts();
      showStatusMessage(`Preset "${preset.name}" aktiviert.`, 'success');

      // Reset selector to show placeholder
      selector.value = '';
      updatePresetButtonStates();

      console.log('[FlashDoc] Preset applied:', preset.name, 'Slots:', normalizedSlots);
    } else {
      console.error('[FlashDoc] Preset not found:', presetId, 'in', presets);
      showStatusMessage('Preset nicht gefunden. Bitte Seite neu laden.', 'error');
    }
  } catch (error) {
    console.error('[FlashDoc] Apply preset error:', error);
    showStatusMessage('Fehler beim Anwenden des Presets.', 'error');
  }
}

async function deactivatePreset() {
  await chrome.storage.sync.set({ activeFloatingButtonPresetId: null });
  renderPresetSelector();
  await refreshBackgroundSettings();
  notifyContentScripts();
  showStatusMessage('Preset deaktiviert.', 'success');
}

async function saveCurrentPreset() {
  const selector = document.getElementById('preset-selector');
  if (!selector || !selector.value) {
    showStatusMessage('Wähle ein Preset zum Überschreiben oder erstelle ein neues.', 'error');
    return;
  }

  try {
    const presetId = selector.value;
    const stored = await chrome.storage.sync.get(['floatingButtonPresets', 'floatingButtonSlots', 'categoryShortcuts']);
    const shortcuts = stored.categoryShortcuts || [];
    const presets = stored.floatingButtonPresets || [];
    const currentSlots = normalizeSlots(stored.floatingButtonSlots, shortcuts);

    console.log('[FlashDoc] Saving to preset:', presetId, 'Current slots:', currentSlots);

    const presetIndex = presets.findIndex(p => p && p.id === presetId);
    if (presetIndex === -1) {
      console.error('[FlashDoc] Save preset not found:', presetId, 'in', presets);
      showStatusMessage('Preset nicht gefunden. Bitte Seite neu laden.', 'error');
      return;
    }

    // Confirm overwrite
    const presetName = presets[presetIndex].name;
    if (!confirm(`Aktuelle Slot-Konfiguration in "${presetName}" speichern?`)) {
      return;
    }

    // Update preset in place
    presets[presetIndex] = {
      ...presets[presetIndex],
      slots: currentSlots,
      updatedAt: Date.now()
    };

    await chrome.storage.sync.set({ floatingButtonPresets: presets });
    showStatusMessage(`Preset "${presetName}" gespeichert.`, 'success');

    // Reset selector
    selector.value = '';
    updatePresetButtonStates();

    console.log('[FlashDoc] Preset saved:', presetName);
  } catch (error) {
    console.error('[FlashDoc] Save preset error:', error);
    showStatusMessage('Fehler beim Speichern des Presets.', 'error');
  }
}

async function deleteCurrentPreset() {
  const selector = document.getElementById('preset-selector');
  if (!selector || !selector.value) {
    showStatusMessage('Wähle ein Preset zum Löschen.', 'error');
    return;
  }

  try {
    const presetId = selector.value;
    const stored = await chrome.storage.sync.get(['floatingButtonPresets', 'activeFloatingButtonPresetId']);
    let presets = stored.floatingButtonPresets || [];

    const preset = presets.find(p => p && p.id === presetId);
    if (!preset) {
      showStatusMessage('Preset nicht gefunden.', 'error');
      return;
    }

    // Confirm deletion
    if (!confirm(`Preset "${preset.name}" wirklich löschen?`)) {
      return;
    }

    presets = presets.filter(p => p && p.id !== presetId);

    const updates = { floatingButtonPresets: presets };
    if (stored.activeFloatingButtonPresetId === presetId) {
      updates.activeFloatingButtonPresetId = null;
    }

    await chrome.storage.sync.set(updates);
    await renderPresetSelector();
    showStatusMessage(`Preset "${preset.name}" gelöscht.`, 'success');

    // Reset selector
    selector.value = '';
    updatePresetButtonStates();

    console.log('[FlashDoc] Preset deleted:', preset.name);
  } catch (error) {
    console.error('[FlashDoc] Delete preset error:', error);
    showStatusMessage('Fehler beim Löschen des Presets.', 'error');
  }
}

async function createNewPreset() {
  try {
    const stored = await chrome.storage.sync.get(['floatingButtonPresets', 'floatingButtonSlots', 'categoryShortcuts']);
    const shortcuts = stored.categoryShortcuts || [];
    const existingPresets = stored.floatingButtonPresets || [];

    // Don't normalize here - preserve raw data
    if (existingPresets.length >= MAX_PRESETS) {
      showStatusMessage(`Maximal ${MAX_PRESETS} Presets erlaubt.`, 'error');
      return;
    }

    const name = prompt('Preset-Name eingeben:', `Preset ${existingPresets.length + 1}`);
    if (!name || !name.trim()) return;

    const currentSlots = normalizeSlots(stored.floatingButtonSlots, shortcuts);

    const newPreset = {
      id: `preset_${Date.now()}`,
      name: name.trim().substring(0, 30),
      slots: currentSlots,
      createdAt: Date.now()
    };

    // Add to existing presets (don't normalize - preserve original data)
    const updatedPresets = [...existingPresets, newPreset];

    await chrome.storage.sync.set({
      floatingButtonPresets: updatedPresets,
      floatingButtonSlots: currentSlots, // Also set current slots
      activeFloatingButtonPresetId: newPreset.id
    });

    await renderPresetSelector();
    await renderSlotDropdowns();
    await refreshBackgroundSettings();
    notifyContentScripts();
    showStatusMessage(`Preset "${newPreset.name}" erstellt und aktiviert.`, 'success');

    console.log('[FlashDoc] Preset created:', newPreset.id, 'Total presets:', updatedPresets.length);
  } catch (error) {
    console.error('[FlashDoc] Create preset error:', error);
    showStatusMessage('Fehler beim Erstellen des Presets.', 'error');
  }
}

// ============================================
// Privacy URL Pattern Manager
// ============================================

const MAX_PATTERNS = 20;

function setupPrivacyPatterns() {
  const addBtn = document.getElementById('add-pattern-btn');
  const input = document.getElementById('new-pattern-input');

  if (addBtn) {
    addBtn.addEventListener('click', addPrivacyPattern);
  }
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPrivacyPattern();
      }
    });
  }

  // Preset buttons
  document.querySelectorAll('.pattern-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const pattern = btn.dataset.pattern;
      if (pattern) {
        addPrivacyPatternValue(pattern);
      }
    });
  });

  // Initial load
  loadPrivacyPatterns();
}

async function loadPrivacyPatterns() {
  const stored = await chrome.storage.sync.get(['privacyPatterns']);
  const patterns = stored.privacyPatterns || [];
  renderPatternList(patterns);
}

function renderPatternList(patterns) {
  const container = document.getElementById('pattern-list');
  const countEl = document.getElementById('pattern-count');
  if (!container) return;

  container.innerHTML = '';

  if (patterns.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔒</span>
        <p>No URL patterns yet. Add patterns above.</p>
      </div>
    `;
    if (countEl) countEl.textContent = `0/${MAX_PATTERNS} Patterns`;
    updatePatternInputState(0);
    return;
  }

  patterns.forEach((pattern, index) => {
    const item = document.createElement('div');
    item.className = 'pattern-item';
    item.innerHTML = `
      <span class="pattern-icon">🔒</span>
      <code class="pattern-value">${escapeHtmlForPatterns(pattern)}</code>
      <button type="button" class="pattern-delete" title="Remove pattern" data-index="${index}">✕</button>
    `;
    item.querySelector('.pattern-delete').addEventListener('click', () => {
      deletePrivacyPattern(index);
    });
    container.appendChild(item);
  });

  if (countEl) {
    countEl.textContent = `${patterns.length}/${MAX_PATTERNS} Patterns`;
    countEl.classList.toggle('at-limit', patterns.length >= MAX_PATTERNS);
  }
  updatePatternInputState(patterns.length);
}

function escapeHtmlForPatterns(str) {
  return str.replace(/[&<>"']/g, (ch) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[ch] || ch;
  });
}

function updatePatternInputState(count) {
  const input = document.getElementById('new-pattern-input');
  const addBtn = document.getElementById('add-pattern-btn');
  const atLimit = count >= MAX_PATTERNS;
  if (input) input.disabled = atLimit;
  if (addBtn) addBtn.disabled = atLimit;
}

async function addPrivacyPattern() {
  const input = document.getElementById('new-pattern-input');
  if (!input) return;

  const value = input.value.trim();
  if (!value) {
    showStatusMessage('Please enter a URL pattern.', 'error');
    input.focus();
    return;
  }

  await addPrivacyPatternValue(value);
  input.value = '';
  input.focus();
}

async function addPrivacyPatternValue(pattern) {
  const stored = await chrome.storage.sync.get(['privacyPatterns']);
  const patterns = stored.privacyPatterns || [];

  if (patterns.length >= MAX_PATTERNS) {
    showStatusMessage(`Maximum ${MAX_PATTERNS} patterns allowed.`, 'error');
    return;
  }

  // Check for duplicates
  if (patterns.includes(pattern)) {
    showStatusMessage('This pattern already exists.', 'error');
    return;
  }

  patterns.push(pattern);
  await chrome.storage.sync.set({ privacyPatterns: patterns });
  renderPatternList(patterns);
  await refreshBackgroundSettings();
  notifyContentScripts();
  showStatusMessage(`Pattern added: ${pattern}`, 'success');
}

async function deletePrivacyPattern(index) {
  const stored = await chrome.storage.sync.get(['privacyPatterns']);
  const patterns = stored.privacyPatterns || [];

  if (index < 0 || index >= patterns.length) return;

  const removed = patterns.splice(index, 1)[0];
  await chrome.storage.sync.set({ privacyPatterns: patterns });
  renderPatternList(patterns);
  await refreshBackgroundSettings();
  notifyContentScripts();
  showStatusMessage(`Pattern removed: ${removed}`, 'success');
}

// Notify all content scripts to update their floating button with new shortcuts
async function notifyContentScripts() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'updateSettings' });
        } catch (e) {
          // Tab might not have content script loaded (e.g., chrome:// pages)
        }
      }
    }
  } catch (error) {
    console.warn('Could not notify content scripts:', error);
  }
}
