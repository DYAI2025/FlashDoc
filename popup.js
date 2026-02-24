const STATUS_STYLES = {
  ok: {
    dot: '#48bb78',
    text: '#48bb78',
    background: 'rgba(72, 187, 120, 0.12)',
    border: 'rgba(72, 187, 120, 0.35)',
  },
  info: {
    dot: '#63b3ed',
    text: '#63b3ed',
    background: 'rgba(99, 179, 237, 0.15)',
    border: 'rgba(99, 179, 237, 0.4)',
  },
  warn: {
    dot: '#f6ad55',
    text: '#f6ad55',
    background: 'rgba(246, 173, 85, 0.18)',
    border: 'rgba(246, 173, 85, 0.45)',
  },
  error: {
    dot: '#fc8181',
    text: '#fc8181',
    background: 'rgba(252, 129, 129, 0.18)',
    border: 'rgba(252, 129, 129, 0.45)',
  },
};

const ACTION_TYPES = {
  smart: 'auto',
  txt: 'txt',
  md: 'md',
  docx: 'docx',
  pdf: 'pdf',
  label: 'label',
};

const manifest = chrome.runtime.getManifest();

document.addEventListener('DOMContentLoaded', () => {
  const totalEl = document.getElementById('total-files');
  const todayEl = document.getElementById('today-files');
  const lastEl = document.getElementById('last-saved');
  const statusIndicator = document.querySelector('.status-indicator');
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  const syncIndicator = document.getElementById('sync-indicator');
  const syncText = document.getElementById('sync-text');
  const recentList = document.getElementById('recent-list');
  const quickButtons = document.querySelectorAll('.action-card');
  const openFolderBtn = document.getElementById('open-folder');
  const settingsBtn = document.getElementById('settings');
  const helpBtn = document.getElementById('help');
  const privacyBanner = document.getElementById('privacy-banner');
  const activateBtn = document.getElementById('activate-btn');
  const repeatActionBtn = document.getElementById('repeat-action-btn');
  const repeatTypeEl = document.getElementById('repeat-type');

  // Initialize Sync Manager
  const syncStatus = SyncManager.getStatus();
  const updateSyncIndicator = (status) => {
    if (!syncIndicator || !syncText) return;
    
    syncIndicator.className = 'sync-indicator ' + status;
    const messages = {
      synced: chrome.i18n.getMessage('syncSynced') || 'Synced',
      syncing: chrome.i18n.getMessage('syncSyncing') || 'Syncing...',
      offline: chrome.i18n.getMessage('syncOffline') || 'Offline',
      error: chrome.i18n.getMessage('syncError') || 'Sync Error'
    };
    syncText.textContent = messages[status] || messages.synced;
  };
  
  // Set initial sync status
  updateSyncIndicator(syncStatus.error ? 'offline' : 'synced');
  
  // Listen for sync events
  window.addEventListener('flashdoc-sync', (e) => {
    const { event, status } = e.detail;
    if (event === 'status') {
      updateSyncIndicator(status.status);
    } else if (event === 'sync') {
      updateSyncIndicator('synced');
    }
  });

  // Store last action for repeat functionality
  let lastActionData = null;

  const setStatus = (message, intent = 'ok') => {
    const palette = STATUS_STYLES[intent] || STATUS_STYLES.info;
    statusText.textContent = message;
    statusText.style.color = palette.text;
    statusDot.style.background = palette.dot;
    statusIndicator.style.background = palette.background;
    statusIndicator.style.borderColor = palette.border;
  };

  const escapeHtml = (value = '') => value.replace(/[&<>"']/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char] || char;
  });

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 30_000) return 'Just now';
    if (diff < 90_000) return '1 minute ago';
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const FORMAT_ICONS = {
    txt: '📄', md: '📝', docx: '📜', pdf: '📕', json: '🧩',
    js: '🟡', ts: '🔵', py: '🐍', html: '🌐', css: '🎨',
    yaml: '🧾', csv: '📊', sql: '🗄️', sh: '⚙️', xml: '📰',
    label: '🏷️', auto: '🎯'
  };

  const renderStats = (stats) => {
    const safeStats = stats || {};
    totalEl.textContent = safeStats.totalFiles ?? 0;
    todayEl.textContent = safeStats.todayFiles ?? 0;
    lastEl.textContent = formatRelativeTime(safeStats.lastTimestamp);

    recentList.innerHTML = '';
    if (safeStats.lastFile) {
      const lastAction = safeStats.lastAction || {};
      const typeIcon = FORMAT_ICONS[lastAction.type] || '📄';
      const typeLabel = lastAction.type ? `.${lastAction.type}` : '';
      const preview = lastAction.contentPreview
        ? escapeHtml(lastAction.contentPreview.substring(0, 50)) + (lastAction.contentPreview.length > 50 ? '...' : '')
        : '';

      const item = document.createElement('div');
      item.className = 'recent-item clickable';
      item.innerHTML = `
        <div class="recent-item-icon">${typeIcon}</div>
        <div class="recent-item-content">
          <div class="recent-item-name">${escapeHtml(safeStats.lastFile)}</div>
          ${preview ? `<div class="recent-item-preview">${preview}</div>` : ''}
          <div class="recent-item-time">Saved ${formatRelativeTime(safeStats.lastTimestamp)}</div>
        </div>
        <div class="recent-item-badge">${typeLabel}</div>
      `;

      // Click to show action menu or trigger repeat
      item.addEventListener('click', () => {
        if (lastActionData) {
          handleRepeatAction();
        }
      });

      recentList.appendChild(item);

      // Store and show repeat button
      if (lastAction.type) {
        lastActionData = lastAction;
        repeatTypeEl.textContent = `.${lastAction.type}`;
        repeatActionBtn.classList.remove('hidden');
      }
    } else {
      recentList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📂</span>
          <p>No recent files yet</p>
        </div>
      `;
      repeatActionBtn.classList.add('hidden');
      lastActionData = null;
    }
  };

  const loadStatsFromStorage = async () => {
    try {
      const result = await chrome.storage.local.get('stats');
      return result && result.stats ? result.stats : null;
    } catch (storageError) {
      console.warn('Stats storage read failed:', storageError);
      return null;
    }
  };

  const sendMessageWithTimeout = (message, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Service worker timeout'));
      }, timeout);

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  };

  const loadStats = async (quiet = false) => {
    try {
      const response = await sendMessageWithTimeout({ action: 'getStats' }, 1000);
      renderStats(response ? response.stats : null);
      if (!quiet) {
        setStatus('Ready', 'ok');
      }
    } catch (error) {
      // Check if it's a connection error (service worker not responding)
      const isConnectionError =
        error && (
          error.message === 'Service worker timeout' ||
          error.message?.includes('Receiving end does not exist') ||
          error.message?.includes('Could not establish connection')
        );

      if (!isConnectionError) {
        console.error('Stats load failed:', error);
      }

      const cachedStats = await loadStatsFromStorage();
      renderStats(cachedStats);

      if (!quiet) {
        if (cachedStats) {
          setStatus('Ready', 'ok');
        } else {
          setStatus('Ready', 'ok');
        }
      }
    }
  };

  const guessDataType = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return 'auto';
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch (error) {
      // Ignore parse errors
    }
    if (/[,;\t]/.test(trimmed) && trimmed.includes('\n')) return 'csv';
    if (/^[\w-]+:\s+/m.test(trimmed)) return 'yaml';
    return 'auto';
  };

  const resolveActionType = (action, text) => {
    if (action === 'code') return 'auto';
    if (action === 'data') return guessDataType(text);
    return ACTION_TYPES[action] || 'txt';
  };

  const queryActiveTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  };

  const getSelectionText = async (tabId) => {
    if (!tabId) return { text: '', success: false };
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.getSelection().toString()
      });
      return { text: (result && result.result) || '', success: true };
    } catch (error) {
      console.warn('Selection read failed:', error);
      return { text: '', success: false, error };
    }
  };

  const getPageSource = async (tabId) => {
    if (!tabId) return '';
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.documentElement.outerHTML
      });
      return (result && result.result) || '';
    } catch (error) {
      console.warn('Page source read failed:', error);
      return '';
    }
  };

  const sendSaveRequest = async (content, type) => {
    try {
      const response = await sendMessageWithTimeout({
        action: 'saveContent',
        content,
        type,
      }, 5000);
      return response || { success: false, error: 'No response from service worker' };
    } catch (error) {
      const isConnectionError =
        error && (
          error.message === 'Service worker timeout' ||
          error.message?.includes('Receiving end does not exist') ||
          error.message?.includes('Could not establish connection')
        );

      const errorMessage = isConnectionError
        ? 'Service worker unavailable. Please try again.'
        : (error instanceof Error ? error.message : String(error));

      return { success: false, error: errorMessage };
    }
  };

  const handleQuickAction = async (action) => {
    setStatus('Preparing save...', 'info');
    const tab = await queryActiveTab();
    if (!tab) {
      setStatus('No active tab detected', 'error');
      return;
    }

    const selection = await getSelectionText(tab.id);
    let text = selection.text.trim();

    if (!text && action === 'smart') {
      text = `${tab.title || 'Untitled'}\n${tab.url || ''}`.trim();
    }

    if (!text && action === 'code') {
      text = await getPageSource(tab.id);
      if (text) {
        setStatus('Saving page source...', 'info');
        const response = await sendSaveRequest(text, 'html');
        if (response.success) {
          await loadStats(true);
          setStatus('Page source saved', 'ok');
        } else {
          setStatus(response.error || 'Save failed', 'error');
        }
        return;
      }
    }

    if (!text) {
      if (selection.error) {
        setStatus('Cannot access this page. Try a different tab.', 'error');
      } else {
        setStatus('Select text first', 'warn');
      }
      return;
    }

    const type = resolveActionType(action, text);
    const response = await sendSaveRequest(text, type);

    if (response.success) {
      const label = type === 'auto' ? 'smart' : type;
      await loadStats(true);
      setStatus(`Saved as ${label.toUpperCase()}`, 'ok');
    } else {
      setStatus(response.error || 'Save failed', 'error');
    }
  };

  quickButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      handleQuickAction(action);
    });
  });

  openFolderBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://downloads/' });
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  helpBtn.addEventListener('click', () => {
    const helpUrl = manifest.homepage_url || 'https://github.com/benjiyo/flashdoc';
    chrome.tabs.create({ url: helpUrl });
  });

  // Check privacy mode and show activation banner if needed
  const checkPrivacyMode = async () => {
    try {
      const response = await sendMessageWithTimeout({ action: 'getPrivacyMode' }, 1000);
      if (response && response.privacyMode) {
        privacyBanner.classList.remove('hidden');
      } else {
        privacyBanner.classList.add('hidden');
      }
    } catch (error) {
      // Fallback: check storage directly
      try {
        const result = await chrome.storage.sync.get('privacyMode');
        if (result && result.privacyMode) {
          privacyBanner.classList.remove('hidden');
        }
      } catch (e) {
        console.warn('Privacy mode check failed:', e);
      }
    }
  };

  // Handle activation button click
  const handleActivate = async () => {
    setStatus('Activating...', 'info');
    activateBtn.disabled = true;
    activateBtn.textContent = '...';

    try {
      const tab = await queryActiveTab();
      if (!tab || !tab.id) {
        setStatus('No active tab', 'error');
        activateBtn.disabled = false;
        activateBtn.textContent = 'Activate';
        return;
      }

      const response = await sendMessageWithTimeout({
        action: 'activateTab',
        tabId: tab.id
      }, 3000);

      if (response && response.success) {
        setStatus('FlashDoc activated!', 'ok');
        activateBtn.textContent = '✓ Active';
        activateBtn.classList.add('activated');
        // Hide banner after short delay
        setTimeout(() => {
          privacyBanner.classList.add('activated');
        }, 1500);
      } else {
        setStatus(response?.error || 'Activation failed', 'error');
        activateBtn.disabled = false;
        activateBtn.textContent = 'Retry';
      }
    } catch (error) {
      console.error('Activation error:', error);
      setStatus('Activation failed', 'error');
      activateBtn.disabled = false;
      activateBtn.textContent = 'Retry';
    }
  };

  activateBtn.addEventListener('click', handleActivate);

  // Handle repeat last action
  const handleRepeatAction = async () => {
    if (!lastActionData || !lastActionData.type) {
      setStatus('No action to repeat', 'warn');
      return;
    }

    setStatus(`Repeating ${lastActionData.type.toUpperCase()}...`, 'info');
    repeatActionBtn.classList.add('loading');

    try {
      const tab = await queryActiveTab();
      if (!tab || !tab.id) {
        setStatus('No active tab', 'error');
        repeatActionBtn.classList.remove('loading');
        return;
      }

      const selection = await getSelectionText(tab.id);
      const text = selection.text.trim();

      if (!text) {
        setStatus('Select text first', 'warn');
        repeatActionBtn.classList.remove('loading');
        return;
      }

      // Send save request with the last used type
      const response = await sendSaveRequest(text, lastActionData.type);

      if (response.success) {
        await loadStats(true);
        setStatus(`Saved as ${lastActionData.type.toUpperCase()}`, 'ok');

        // Visual feedback
        repeatActionBtn.classList.add('success');
        setTimeout(() => {
          repeatActionBtn.classList.remove('success');
        }, 1500);
      } else {
        setStatus(response.error || 'Save failed', 'error');
      }
    } catch (error) {
      console.error('Repeat action error:', error);
      setStatus('Repeat failed', 'error');
    } finally {
      repeatActionBtn.classList.remove('loading');
    }
  };

  repeatActionBtn.addEventListener('click', handleRepeatAction);

  // Initialize
  checkPrivacyMode();
  loadStats();
});
