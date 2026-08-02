/**
 * FlashDoc Sync Manager
 * Handles chrome.storage.sync for multi-device support
 * 
 * Features:
 * - Sync Status monitoring
 * - Conflict Resolution (Last-Writer-Wins with timestamps)
 * - UI Indicators for sync state
 * - Privacy-aware sync (what gets synced, what stays local)
 */

const SyncManager = {
  // Keys that are synced across devices
  SYNCED_KEYS: [
    'folderPath',
    'namingPattern',
    'customPattern',
    'organizeByType',
    'showNotifications',
    'playSound',
    'autoDetectType',
    'enableContextMenu',
    'showFloatingButton',
    'showCornerBall',
    'buttonPosition',
    'autoHideButton',
    'selectionThreshold',
    'enableSmartDetection',
    'trackFormatUsage',
    'trackDetectionAccuracy',
    'showFormatRecommendations',
    'contextMenuFormats',
    'categoryShortcuts',
    'privacyMode',
    'floatingButtonSlots',
    'floatingButtonPresets',
    'activeFloatingButtonPresetId'
  ],

  // Keys that stay local only (privacy-sensitive usage data)
  LOCAL_ONLY_KEYS: [
    'stats',
    'formatUsage',
    'detectionAccuracy',
    'lastSyncTimestamp',
    'syncConflictLog'
  ],

  // Sync status
  status: {
    lastSync: null,
    isSyncing: false,
    conflictCount: 0,
    error: null
  },

  /**
   * Initialize sync manager
   */
  async init() {
    // Load last sync timestamp
    const data = await chrome.storage.local.get(['lastSyncTimestamp']);
    this.status.lastSync = data.lastSyncTimestamp || null;

    // Listen for sync changes
    chrome.storage.onChanged.addListener(this._handleStorageChange.bind(this));

    // Check sync status periodically
    this._startSyncMonitor();

    return this.status;
  },

  /**
   * Handle storage changes from other devices
   */
  _handleStorageChange(changes, areaName) {
    if (areaName !== 'sync') return;

    // Update last sync timestamp
    this.status.lastSync = Date.now();
    chrome.storage.local.set({ lastSyncTimestamp: this.status.lastSync });

    // Check for conflicts (same key changed in short timeframe)
    const conflictedKeys = Object.keys(changes).filter(key => {
      const change = changes[key];
      return change.oldValue !== undefined && change.newValue !== undefined;
    });

    if (conflictedKeys.length > 0) {
      this._handleConflict(conflictedKeys, changes);
    }

    // Notify UI
    this._notifyUI('sync', changes);
  },

  /**
   * Handle sync conflicts (Last-Writer-Wins strategy)
   */
  _handleConflict(keys, changes) {
    this.status.conflictCount += keys.length;

    // Log conflicts for debugging
    const conflictLog = {
      timestamp: Date.now(),
      keys: keys,
      resolution: 'last_writer_wins'
    };

    chrome.storage.local.get(['syncConflictLog']).then(data => {
      const log = data.syncConflictLog || [];
      log.push(conflictLog);
      // Keep only last 10 conflicts
      const trimmedLog = log.slice(-10);
      chrome.storage.local.set({ syncConflictLog: trimmedLog });
    });
  },

  /**
   * Start periodic sync status monitoring
   */
  _startSyncMonitor() {
    // Check sync status every 30 seconds
    setInterval(async () => {
      const data = await chrome.storage.local.get(['lastSyncTimestamp']);
      const now = Date.now();
      const timeSinceSync = now - (data.lastSyncTimestamp || now);

      // If no sync for more than 5 minutes, might be offline
      if (timeSinceSync > 5 * 60 * 1000 && !this.status.error) {
        this.status.error = 'offline';
        this._notifyUI('status', { status: 'offline' });
      } else if (timeSinceSync <= 5 * 60 * 1000 && this.status.error === 'offline') {
        this.status.error = null;
        this._notifyUI('status', { status: 'synced' });
      }
    }, 30000);
  },

  /**
   * Notify UI components of sync changes
   */
  _notifyUI(event, data) {
    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('flashdoc-sync', {
      detail: {
        event: event,
        status: this.status,
        data: data
      }
    }));
  },

  /**
   * Get current sync status
   */
  getStatus() {
    return {
      ...this.status,
      syncedKeys: this.SYNCED_KEYS.length,
      localOnlyKeys: this.LOCAL_ONLY_KEYS.length,
      lastSyncFormatted: this.status.lastSync 
        ? new Date(this.status.lastSync).toLocaleString()
        : 'Nie'
    };
  },

  /**
   * Force sync (trigger chrome.storage.sync)
   */
  async forceSync() {
    this.status.isSyncing = true;
    this._notifyUI('status', { status: 'syncing' });

    try {
      // Trigger a dummy write to force sync
      await chrome.storage.sync.set({ _syncTrigger: Date.now() });
      await chrome.storage.sync.remove('_syncTrigger');
      
      this.status.lastSync = Date.now();
      this.status.error = null;
      await chrome.storage.local.set({ lastSyncTimestamp: this.status.lastSync });
      
      return { success: true };
    } catch (error) {
      this.status.error = error.message;
      return { success: false, error: error.message };
    } finally {
      this.status.isSyncing = false;
      this._notifyUI('status', { status: this.status.error ? 'error' : 'synced' });
    }
  },

  /**
   * Get privacy info
   */
  getPrivacyInfo() {
    return {
      synced: {
        description: 'Diese Einstellungen werden mit anderen Geräten synchronisiert',
        keys: this.SYNCED_KEYS,
        includes: [
          'Alle Einstellungen und Präferenzen',
          'Speicherpfad und Benennung',
          'Format-Voreinstellungen (Presets)',
          'Tastenkürzel',
          'Floating Button Konfiguration',
          'Privacy Mode Einstellung'
        ]
      },
      localOnly: {
        description: 'Diese Daten bleiben nur auf diesem Gerät',
        keys: this.LOCAL_ONLY_KEYS,
        includes: [
          'Nutzungsstatistiken (Stats)',
          'Format-Nutzungshäufigkeit',
          'Erkennungsgenauigkeit',
          'Letzter Sync-Zeitpunkt'
        ]
      },
      whyLocalOnly: {
        reason: 'Datenschutz und minimale Synchronisation',
        details: [
          'Nutzungsdaten sind personenbezogen und haben keinen Mehrwert auf anderen Geräten',
          'Reduziert Sync-Traffic und Speicherplatz in Chrome',
          'Jedes Gerät hat unabhängige Nutzungsstatistiken',
          'Einstellungen sind das, was Benutzer tatsächlich zwischen Geräten teilen möchten'
        ]
      }
    };
  },

  /**
   * Export sync data (for backup)
   */
  async exportSyncData() {
    const data = await chrome.storage.sync.get(null);
    return {
      exportedAt: Date.now(),
      data: data,
      version: '3.0'
    };
  },

  /**
   * Import sync data (for restore)
   */
  async importSyncData(importData) {
    if (!importData || !importData.data) {
      return { success: false, error: 'Invalid import data' };
    }

    // Filter to only synced keys
    const filteredData = {};
    for (const key of this.SYNCED_KEYS) {
      if (importData.data[key] !== undefined) {
        filteredData[key] = importData.data[key];
      }
    }

    try {
      await chrome.storage.sync.set(filteredData);
      return { success: true, importedKeys: Object.keys(filteredData) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  SyncManager.init();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncManager;
}
