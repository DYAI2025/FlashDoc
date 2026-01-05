/**
 * FlashDoc Floating Button Slots Storage Schema
 * Version: 3.1.0
 *
 * This schema defines the storage structure for configurable contextual
 * selection chip slots with preset management.
 *
 * Storage Layer: chrome.storage.sync (synced across devices)
 */

// =============================================================================
// SECTION 1: CORE TYPE DEFINITIONS
// =============================================================================

/**
 * Supported format actions that can be assigned to a slot.
 * These correspond to file extensions/save actions available in FlashDoc.
 */
type FormatAction =
  | 'auto'      // Smart auto-detect
  | 'txt'       // Plain text
  | 'md'        // Markdown
  | 'docx'      // Microsoft Word
  | 'pdf'       // PDF document
  | 'json'      // JSON data
  | 'js'        // JavaScript
  | 'ts'        // TypeScript
  | 'py'        // Python
  | 'html'      // HTML
  | 'css'       // CSS
  | 'xml'       // XML
  | 'sql'       // SQL
  | 'sh'        // Shell script
  | 'yaml'      // YAML
  | 'csv'       // CSV
  | 'label'     // Label PDF (89x28mm)
  | 'saveas';   // Save As dialog

/**
 * Slot type discriminator for union type handling.
 */
type SlotType = 'format' | 'shortcut' | 'disabled';

/**
 * Base slot interface with common properties.
 */
interface BaseSlot {
  /** Unique identifier for the slot (0-4 for 5 slots) */
  index: number;
  /** Display label shown in UI (optional, auto-generated if omitted) */
  label?: string;
  /** Custom emoji/icon override (optional, uses default if omitted) */
  emoji?: string;
}

/**
 * Format action slot - directly triggers a save with specific format.
 */
interface FormatSlot extends BaseSlot {
  type: 'format';
  /** The format to save as when this slot is activated */
  format: FormatAction;
}

/**
 * Shortcut reference slot - references a category shortcut by ID.
 * This creates prefix_save.format files using the shortcut configuration.
 */
interface ShortcutSlot extends BaseSlot {
  type: 'shortcut';
  /** Reference to categoryShortcuts[].id */
  shortcutId: string;
}

/**
 * Disabled slot - slot is hidden/inactive.
 */
interface DisabledSlot extends BaseSlot {
  type: 'disabled';
}

/**
 * Union type for any slot configuration.
 */
type FloatingButtonSlot = FormatSlot | ShortcutSlot | DisabledSlot;

// =============================================================================
// SECTION 2: PRESET MANAGEMENT
// =============================================================================

/**
 * A preset contains a complete slot configuration that can be saved/loaded.
 */
interface FloatingButtonPreset {
  /** Unique identifier for the preset */
  id: string;
  /** User-defined name for the preset */
  name: string;
  /** Array of 5 slot configurations */
  slots: [FloatingButtonSlot, FloatingButtonSlot, FloatingButtonSlot, FloatingButtonSlot, FloatingButtonSlot];
  /** Timestamp when preset was created */
  createdAt: number;
  /** Timestamp when preset was last modified */
  updatedAt: number;
  /** Whether this is a system-provided preset (non-deletable) */
  isSystem?: boolean;
}

// =============================================================================
// SECTION 3: STORAGE KEYS AND SCHEMA
// =============================================================================

/**
 * New storage keys for floating button slots feature.
 * These are added to chrome.storage.sync alongside existing settings.
 */
interface FloatingButtonSlotsStorage {
  /**
   * Active slot configuration (5 slots).
   * This is the currently displayed configuration in the contextual chip.
   *
   * Storage key: 'floatingButtonSlots'
   */
  floatingButtonSlots: [FloatingButtonSlot, FloatingButtonSlot, FloatingButtonSlot, FloatingButtonSlot, FloatingButtonSlot];

  /**
   * User-defined presets (max 5).
   * Does not include system presets which are generated at runtime.
   *
   * Storage key: 'floatingButtonPresets'
   */
  floatingButtonPresets: FloatingButtonPreset[];

  /**
   * ID of the currently active preset.
   * Can be a user preset ID or a system preset ID ('default', 'code', 'docs').
   * Null indicates custom configuration not matching any preset.
   *
   * Storage key: 'activeFloatingButtonPresetId'
   */
  activeFloatingButtonPresetId: string | null;
}

// =============================================================================
// SECTION 4: DEFAULT VALUES
// =============================================================================

/**
 * Default slot configuration matching current hardcoded behavior.
 * This ensures backward compatibility - users get the same experience initially.
 */
const DEFAULT_FLOATING_BUTTON_SLOTS: FloatingButtonSlotsStorage['floatingButtonSlots'] = [
  { index: 0, type: 'format', format: 'txt', emoji: '📄' },
  { index: 1, type: 'format', format: 'md', emoji: '📝' },
  { index: 2, type: 'format', format: 'docx', emoji: '📜' },
  { index: 3, type: 'format', format: 'pdf', emoji: '📕' },
  { index: 4, type: 'format', format: 'saveas', emoji: '📁' }
];

/**
 * System-provided presets (generated at runtime, not stored).
 */
const SYSTEM_PRESETS: FloatingButtonPreset[] = [
  {
    id: 'system:default',
    name: 'Default',
    slots: [
      { index: 0, type: 'format', format: 'txt', emoji: '📄' },
      { index: 1, type: 'format', format: 'md', emoji: '📝' },
      { index: 2, type: 'format', format: 'docx', emoji: '📜' },
      { index: 3, type: 'format', format: 'pdf', emoji: '📕' },
      { index: 4, type: 'format', format: 'saveas', emoji: '📁' }
    ],
    createdAt: 0,
    updatedAt: 0,
    isSystem: true
  },
  {
    id: 'system:code',
    name: 'Code',
    slots: [
      { index: 0, type: 'format', format: 'auto', emoji: '🎯' },
      { index: 1, type: 'format', format: 'js', emoji: '🟡' },
      { index: 2, type: 'format', format: 'ts', emoji: '🔵' },
      { index: 3, type: 'format', format: 'py', emoji: '🐍' },
      { index: 4, type: 'format', format: 'json', emoji: '🧩' }
    ],
    createdAt: 0,
    updatedAt: 0,
    isSystem: true
  },
  {
    id: 'system:docs',
    name: 'Documents',
    slots: [
      { index: 0, type: 'format', format: 'pdf', emoji: '📕' },
      { index: 1, type: 'format', format: 'docx', emoji: '📜' },
      { index: 2, type: 'format', format: 'md', emoji: '📝' },
      { index: 3, type: 'format', format: 'txt', emoji: '📄' },
      { index: 4, type: 'format', format: 'label', emoji: '🏷️' }
    ],
    createdAt: 0,
    updatedAt: 0,
    isSystem: true
  }
];

/**
 * Default preset ID for new installations.
 */
const DEFAULT_ACTIVE_PRESET_ID: string = 'system:default';

/**
 * Maximum number of user-defined presets.
 */
const MAX_USER_PRESETS = 5;

/**
 * Maximum number of slots (fixed at 5 for UI consistency).
 */
const MAX_SLOTS = 5;

// =============================================================================
// SECTION 5: ADDITIONS TO DEFAULT_SETTINGS
// =============================================================================

/**
 * Extended DEFAULT_SETTINGS object for options.js and service-worker.js.
 * These should be merged with existing DEFAULT_SETTINGS.
 */
const FLOATING_BUTTON_SLOTS_DEFAULTS = {
  // New floating button slots settings
  floatingButtonSlots: DEFAULT_FLOATING_BUTTON_SLOTS,
  floatingButtonPresets: [] as FloatingButtonPreset[],
  activeFloatingButtonPresetId: DEFAULT_ACTIVE_PRESET_ID as string | null
};

// =============================================================================
// SECTION 6: MIGRATION AND NORMALIZATION
// =============================================================================

/**
 * Migration function signature for upgrading from pre-slots storage.
 * Called during loadSettings() to ensure backward compatibility.
 *
 * @param stored - Raw stored settings from chrome.storage.sync
 * @returns Normalized settings with slots initialized
 */
type MigrateSlotsSettings = (stored: Record<string, unknown>) => {
  floatingButtonSlots: FloatingButtonSlotsStorage['floatingButtonSlots'];
  floatingButtonPresets: FloatingButtonPreset[];
  activeFloatingButtonPresetId: string | null;
};

/**
 * Migration implementation for backward compatibility.
 *
 * Strategy:
 * 1. If floatingButtonSlots exists and is valid, use it
 * 2. If not present, initialize with DEFAULT_FLOATING_BUTTON_SLOTS
 * 3. Validate shortcut references against existing categoryShortcuts
 * 4. Replace invalid shortcut references with disabled slots
 */
const migrateFloatingButtonSlots: MigrateSlotsSettings = (stored) => {
  // Default result
  const result = {
    floatingButtonSlots: [...DEFAULT_FLOATING_BUTTON_SLOTS] as FloatingButtonSlotsStorage['floatingButtonSlots'],
    floatingButtonPresets: [] as FloatingButtonPreset[],
    activeFloatingButtonPresetId: DEFAULT_ACTIVE_PRESET_ID as string | null
  };

  // Check if new schema exists
  if (stored.floatingButtonSlots && Array.isArray(stored.floatingButtonSlots)) {
    const slots = stored.floatingButtonSlots as FloatingButtonSlot[];
    const categoryShortcuts = (stored.categoryShortcuts || []) as Array<{ id: string }>;
    const validShortcutIds = new Set(categoryShortcuts.map(s => s.id));

    // Validate and normalize each slot
    const normalizedSlots = slots.slice(0, MAX_SLOTS).map((slot, index) => {
      // Ensure index is set correctly
      const normalizedSlot = { ...slot, index };

      // Validate shortcut references
      if (normalizedSlot.type === 'shortcut') {
        const shortcutSlot = normalizedSlot as ShortcutSlot;
        if (!validShortcutIds.has(shortcutSlot.shortcutId)) {
          // Invalid shortcut reference - disable the slot
          return { index, type: 'disabled' as const };
        }
      }

      return normalizedSlot;
    });

    // Pad with defaults if less than MAX_SLOTS
    while (normalizedSlots.length < MAX_SLOTS) {
      normalizedSlots.push({
        ...DEFAULT_FLOATING_BUTTON_SLOTS[normalizedSlots.length],
        index: normalizedSlots.length
      });
    }

    result.floatingButtonSlots = normalizedSlots as FloatingButtonSlotsStorage['floatingButtonSlots'];
  }

  // Migrate presets
  if (stored.floatingButtonPresets && Array.isArray(stored.floatingButtonPresets)) {
    result.floatingButtonPresets = (stored.floatingButtonPresets as FloatingButtonPreset[])
      .filter(preset => !preset.isSystem) // Don't store system presets
      .slice(0, MAX_USER_PRESETS);
  }

  // Migrate active preset ID
  if (typeof stored.activeFloatingButtonPresetId === 'string' || stored.activeFloatingButtonPresetId === null) {
    result.activeFloatingButtonPresetId = stored.activeFloatingButtonPresetId as string | null;
  }

  return result;
};

/**
 * Normalization function to validate slot configuration at runtime.
 * Used after loading settings and before applying to UI.
 *
 * @param slots - Slot configuration to normalize
 * @param categoryShortcuts - Current category shortcuts for validation
 * @returns Normalized and validated slot configuration
 */
type NormalizeSlotsConfig = (
  slots: FloatingButtonSlot[],
  categoryShortcuts: Array<{ id: string; name: string; format: string }>
) => FloatingButtonSlotsStorage['floatingButtonSlots'];

const normalizeFloatingButtonSlots: NormalizeSlotsConfig = (slots, categoryShortcuts) => {
  const validShortcutIds = new Set(categoryShortcuts.map(s => s.id));

  const normalized = slots.slice(0, MAX_SLOTS).map((slot, index): FloatingButtonSlot => {
    const base = { ...slot, index };

    switch (base.type) {
      case 'format':
        // Validate format is known
        const validFormats: FormatAction[] = [
          'auto', 'txt', 'md', 'docx', 'pdf', 'json', 'js', 'ts',
          'py', 'html', 'css', 'xml', 'sql', 'sh', 'yaml', 'csv', 'label', 'saveas'
        ];
        if (!validFormats.includes((base as FormatSlot).format)) {
          return { index, type: 'format', format: 'txt' };
        }
        return base as FormatSlot;

      case 'shortcut':
        // Validate shortcut reference exists
        if (!validShortcutIds.has((base as ShortcutSlot).shortcutId)) {
          return { index, type: 'disabled' };
        }
        return base as ShortcutSlot;

      case 'disabled':
        return { index, type: 'disabled' };

      default:
        // Unknown type - disable
        return { index, type: 'disabled' };
    }
  });

  // Pad with defaults if needed
  while (normalized.length < MAX_SLOTS) {
    normalized.push({
      ...DEFAULT_FLOATING_BUTTON_SLOTS[normalized.length],
      index: normalized.length
    });
  }

  return normalized as FloatingButtonSlotsStorage['floatingButtonSlots'];
};

/**
 * Validate a preset before saving.
 *
 * @param preset - Preset to validate
 * @param categoryShortcuts - Current shortcuts for validation
 * @returns Validation result with errors if any
 */
type ValidatePreset = (
  preset: Partial<FloatingButtonPreset>,
  categoryShortcuts: Array<{ id: string }>
) => { valid: boolean; errors: string[] };

const validateFloatingButtonPreset: ValidatePreset = (preset, categoryShortcuts) => {
  const errors: string[] = [];

  if (!preset.id || typeof preset.id !== 'string') {
    errors.push('Preset ID is required');
  }

  if (!preset.name || typeof preset.name !== 'string' || preset.name.trim().length === 0) {
    errors.push('Preset name is required');
  }

  if (!preset.slots || !Array.isArray(preset.slots) || preset.slots.length !== MAX_SLOTS) {
    errors.push(`Preset must have exactly ${MAX_SLOTS} slots`);
  } else {
    const validShortcutIds = new Set(categoryShortcuts.map(s => s.id));
    preset.slots.forEach((slot, index) => {
      if (slot.type === 'shortcut' && !validShortcutIds.has((slot as ShortcutSlot).shortcutId)) {
        errors.push(`Slot ${index} references invalid shortcut`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
};

// =============================================================================
// SECTION 7: STORAGE KEY NAMING CONVENTIONS
// =============================================================================

/**
 * Storage key constants for consistent access.
 * All keys are camelCase to match existing FlashDoc conventions.
 */
const STORAGE_KEYS = {
  // Existing keys (for reference)
  EXISTING: {
    folderPath: 'folderPath',
    namingPattern: 'namingPattern',
    customPattern: 'customPattern',
    organizeByType: 'organizeByType',
    showNotifications: 'showNotifications',
    playSound: 'playSound',
    autoDetectType: 'autoDetectType',
    enableContextMenu: 'enableContextMenu',
    showFloatingButton: 'showFloatingButton',
    showCornerBall: 'showCornerBall',
    buttonPosition: 'buttonPosition',
    autoHideButton: 'autoHideButton',
    selectionThreshold: 'selectionThreshold',
    enableSmartDetection: 'enableSmartDetection',
    trackFormatUsage: 'trackFormatUsage',
    trackDetectionAccuracy: 'trackDetectionAccuracy',
    showFormatRecommendations: 'showFormatRecommendations',
    contextMenuFormats: 'contextMenuFormats',
    categoryShortcuts: 'categoryShortcuts',
    privacyMode: 'privacyMode'
  },

  // New keys for floating button slots feature
  NEW: {
    /** Active slot configuration array */
    floatingButtonSlots: 'floatingButtonSlots',
    /** User-defined presets array */
    floatingButtonPresets: 'floatingButtonPresets',
    /** ID of active preset (or null for custom) */
    activeFloatingButtonPresetId: 'activeFloatingButtonPresetId'
  }
} as const;

// =============================================================================
// SECTION 8: HELPER TYPES FOR IMPLEMENTATION
// =============================================================================

/**
 * Emoji map for slot display.
 * Used when slot.emoji is not defined.
 */
const FORMAT_EMOJI_MAP: Record<FormatAction, string> = {
  auto: '🎯',
  txt: '📄',
  md: '📝',
  docx: '📜',
  pdf: '📕',
  json: '🧩',
  js: '🟡',
  ts: '🔵',
  py: '🐍',
  html: '🌐',
  css: '🎨',
  xml: '📰',
  sql: '📑',
  sh: '⚙️',
  yaml: '🧾',
  csv: '📊',
  label: '🏷️',
  saveas: '📁'
};

/**
 * Get display info for a slot (emoji and label).
 * Resolves shortcut references to their display values.
 */
type GetSlotDisplayInfo = (
  slot: FloatingButtonSlot,
  categoryShortcuts: Array<{ id: string; name: string; format: string }>
) => { emoji: string; label: string; format: string | null };

const getSlotDisplayInfo: GetSlotDisplayInfo = (slot, categoryShortcuts) => {
  switch (slot.type) {
    case 'format':
      return {
        emoji: slot.emoji || FORMAT_EMOJI_MAP[slot.format] || '📄',
        label: slot.label || slot.format.toUpperCase(),
        format: slot.format
      };

    case 'shortcut':
      const shortcut = categoryShortcuts.find(s => s.id === slot.shortcutId);
      if (!shortcut) {
        return { emoji: '❌', label: 'Invalid', format: null };
      }
      return {
        emoji: slot.emoji || FORMAT_EMOJI_MAP[shortcut.format as FormatAction] || '📄',
        label: slot.label || shortcut.name,
        format: shortcut.format
      };

    case 'disabled':
      return { emoji: '', label: '', format: null };

    default:
      return { emoji: '❌', label: 'Unknown', format: null };
  }
};

// =============================================================================
// SECTION 9: EXPORTS SUMMARY
// =============================================================================

/**
 * Exports for implementation in options.js, content.js, and service-worker.js:
 *
 * Types:
 * - FormatAction
 * - SlotType
 * - FloatingButtonSlot (union of FormatSlot | ShortcutSlot | DisabledSlot)
 * - FloatingButtonPreset
 * - FloatingButtonSlotsStorage
 *
 * Constants:
 * - DEFAULT_FLOATING_BUTTON_SLOTS
 * - SYSTEM_PRESETS
 * - DEFAULT_ACTIVE_PRESET_ID
 * - MAX_USER_PRESETS (5)
 * - MAX_SLOTS (5)
 * - STORAGE_KEYS
 * - FORMAT_EMOJI_MAP
 * - FLOATING_BUTTON_SLOTS_DEFAULTS (merge with DEFAULT_SETTINGS)
 *
 * Functions:
 * - migrateFloatingButtonSlots(stored) - Migration for backward compatibility
 * - normalizeFloatingButtonSlots(slots, shortcuts) - Runtime validation
 * - validateFloatingButtonPreset(preset, shortcuts) - Preset validation
 * - getSlotDisplayInfo(slot, shortcuts) - Display info resolution
 */

export {
  // Types
  FormatAction,
  SlotType,
  FormatSlot,
  ShortcutSlot,
  DisabledSlot,
  FloatingButtonSlot,
  FloatingButtonPreset,
  FloatingButtonSlotsStorage,

  // Constants
  DEFAULT_FLOATING_BUTTON_SLOTS,
  SYSTEM_PRESETS,
  DEFAULT_ACTIVE_PRESET_ID,
  MAX_USER_PRESETS,
  MAX_SLOTS,
  STORAGE_KEYS,
  FORMAT_EMOJI_MAP,
  FLOATING_BUTTON_SLOTS_DEFAULTS,

  // Functions
  migrateFloatingButtonSlots,
  normalizeFloatingButtonSlots,
  validateFloatingButtonPreset,
  getSlotDisplayInfo
};
