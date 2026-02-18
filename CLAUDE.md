# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlashDoc is a Chrome Extension (Manifest V3) that converts selected text into downloadable files. It supports multiple formats including PDF, DOCX, Markdown, JSON, and various code formats with smart content-type detection.

## Architecture

### Core Components

- **`service-worker.js`** - Background service worker handling:
  - File downloads via Chrome Downloads API
  - PDF generation (jsPDF) and DOCX generation (docx.js)
  - Context menu management
  - HTML-to-document formatting pipeline (Formatting Engine v2)
  - Smart content detection delegation

- **`content.js`** - Content script injected into pages:
  - Selection capture (text + HTML for formatting)
  - Floating UI (FAB button, contextual save chip, corner ball)
  - Keyboard shortcuts
  - Message passing to service worker

- **`detection-utils.js`** - Shared format detection engine:
  - Used by both service worker and content script
  - Detects: HTML, TypeScript, JavaScript, Python, JSON, YAML, XML, SQL, Shell, CSV, Markdown, CSS
  - Prioritizes HTML structure detection to avoid false code matches

### Formatting Engine v2 (service-worker.js)

Three-layer pipeline for PDF/DOCX generation:
1. **`HtmlTokenizer`** - Converts HTML to ordered token stream
2. **`BlockBuilder`** - Converts tokens to structured blocks with formatting
3. **`DocxRenderer`/`PdfRenderer`** - Renders blocks to output format

### Key Modules

- **`EntityDecoder`** - HTML entity decoding (named, decimal, hex)
- **`PdfListContext`** - Manages list numbering state for PDF rendering
- **`FlashDoc` class** - Main controller in service-worker.js
- **`FlashDocContent` class** - Main controller in content.js

## Commands

### Testing Detection Logic
```bash
node scripts/detection-check.js
```
Runs format detection sanity checks without browser runtime.

### Load Extension in Chrome
1. Navigate to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" and select this directory

## File Organization

```
├── manifest.json          # Extension manifest (v3)
├── service-worker.js      # Background logic (~1500 lines)
├── content.js             # Content script (~1250 lines)
├── detection-utils.js     # Shared detection engine
├── options.html/js/css    # Settings page
├── popup.html/js/css      # Browser action popup
├── lib/                   # Bundled libraries
│   ├── jspdf.umd.min.js
│   └── docx.umd.min.js
├── scripts/
│   └── detection-check.js # Node test script
└── privacy/index.html     # Privacy policy
```

## Key Patterns

### Message Passing
Content script sends save requests to service worker:
```javascript
chrome.runtime.sendMessage({
  action: 'saveContent',
  content: selectedText,
  html: selectedHtml,    // For formatting preservation
  type: 'auto',          // or specific format
  prefix: categoryName   // optional prefix for shortcuts
});
```

### Format Detection Priority
Detection order in `detection-utils.js:detectContentType()`:
1. URL → YAML → JSON → HTML → XML → TypeScript → JavaScript → Python → SQL → Shell → CSV → Markdown → CSS → txt

### HTML Detection Guards
TypeScript/JavaScript detection explicitly checks `hasHTMLStructure()` first to avoid misclassifying markup as code.

## Chrome APIs Used

- `chrome.downloads` - File saving
- `chrome.contextMenus` - Right-click menu
- `chrome.storage.sync/local` - Settings and stats
- `chrome.scripting` - Script injection on install/reload
- `chrome.commands` - Keyboard shortcuts
- `chrome.notifications` - Save confirmations
- `chrome.runtime.onMessage` - IPC between scripts

## Extension Settings (chrome.storage.sync)

Key settings: `folderPath`, `namingPattern`, `organizeByType`, `showFloatingButton`, `showCornerBall`, `contextMenuFormats`, `categoryShortcuts`, `privacyMode` ('off'|'on'|'smart'), `privacyPatterns` (URL glob array)
