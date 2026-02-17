# FlashDoc Chrome Extension v3.2

FlashDoc turns any selected text into instantly downloadable files. Context menus, keyboard shortcuts, and a floating action button let you save snippets without leaving the page.

## What's New in v3.2

Version 3.2 fixes formatting issues when copying content with lines and special characters to PDF and DOCX, and removes the intrusive corner ball from the default experience.

### Horizontal Rule Support
Horizontal lines (`<hr>`) copied from web pages are now rendered correctly in PDF and DOCX.

### PDF Special Character Handling
Box-drawing characters, arrows, Greek letters, check marks, and other Unicode symbols are automatically replaced with readable ASCII alternatives instead of appearing as blank spaces.

### PDF Formatting Fidelity
Whitespace between formatted text segments is now preserved in PDF output.

### Corner Ball Disabled by Default
The corner ball no longer appears on every page. The floating save button remains active.

---

## What's New in v3.1

Version 3.1 focuses on customization. You now control exactly which buttons appear when you select text.

### Customizable Quick-Save Buttons
The five buttons that pop up near your selection are now fully configurable. Each slot can be a format (like PDF or Markdown), one of your saved shortcuts, or disabled entirely. Set them up once in the options page—they update everywhere instantly.

### Slot Presets
Save different button layouts for different workflows. A preset for writing might show Markdown and DOCX, while a coding preset shows JS, Python, and JSON. Switch between up to five presets without reconfiguring anything.

### More Shortcuts
The prefix shortcut limit increased from 5 to 10. Create more category-based save actions like "Meeting Notes + .md" or "Code Review + .txt" for one-click organized saving.

---

## What's New in v3.0

These features shipped in the previous release:

### Format Override Before Saving
The floating save button now shows a dropdown where you can change the detected format before downloading. If FlashDoc guesses Markdown but you need a PDF, just pick the right format from the menu. No more saving first and converting later.

### Live Filename Preview
The options page now displays a real-time preview of how your next file will be named. As you type a folder path or switch naming patterns, the preview updates instantly. You'll see exactly where files end up before you save anything.

### Privacy Mode
A new toggle in settings lets you disable automatic script injection. When enabled, FlashDoc only activates after you click "Activate" in the popup. This keeps the extension dormant on sensitive pages like banking sites or internal tools until you explicitly need it.

### Repeat Last Action
The popup now remembers your most recent save, including format and a content preview. One click on "Repeat" saves the current selection using the same format. Great for batch-saving multiple code snippets or notes in the same format.

---

## Features
- Format detection that distinguishes HTML from code reliably
- Context menu entries for common formats plus custom category shortcuts
- Floating action button and contextual save chip near selections
- Usage stats and recommendations in the options page

## Getting Started
1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. The floating button appears when you select text on a page.

## Detection Engine
The detection logic lives in `detection-utils.js` and is shared by the background worker and content script:
- HTML requires document markers (`<!DOCTYPE`, `<html>`, `<head>`, `<body>`) or multiple paired tags with optional `<script>`/`<style>` blocks.
- TypeScript needs at least two TS-specific signals (interfaces, typed parameters, enums) and rejects if HTML structure is present.
- JavaScript detection is blocked when HTML structure is detected.
- JSON, YAML, XML/SVG, SQL, shell scripts, CSV, Markdown, and CSS each have dedicated heuristics.

## Options & Shortcuts
Open **Options** from the extension card to configure folder naming, context menu entries, category shortcuts, and privacy mode.

Default keyboard shortcuts:
- `Ctrl/Cmd+Shift+S` – Smart Save (auto-detect format)
- `Ctrl/Cmd+Shift+T` – Save as `.txt`
- `Ctrl/Cmd+Shift+M` – Save as `.md`
- `Ctrl/Cmd+Shift+P` – Save as `.pdf`

## Testing
Run the detection sanity check:
```bash
node scripts/detection-check.js
```

Run the v3.0/v3.2 feature tests:
```bash
node scripts/v3-features-test.cjs
```

Both scripts exit with code 0 on success, making them suitable for CI pipelines.

## Repository Layout
- `content.js` – UI injected into pages (selection capture, configurable slots, format override)
- `service-worker.js` – Background logic for saving files, privacy mode, and stats
- `options.html/js/css` – Settings page with live preview and privacy toggle
- `popup.html/js/css` – Browser action popup with repeat functionality
- `detection-utils.js` – Shared format detection engine
- `scripts/` – Test scripts for detection and feature verification

## Changelog

### v3.2
- Horizontal rule (`<hr>`) rendering in PDF and DOCX
- PDF special character fallback (Unicode → ASCII for unsupported glyphs)
- Preserved whitespace between formatted text segments in PDF
- Corner ball disabled by default to prevent UI blocking
- WinAnsi-safe list bullets at all nesting levels

### v3.1
- Configurable contextual chip slots (5 buttons, each customizable)
- Slot presets for switching between different button layouts
- Increased prefix shortcuts from 5 to 10
- Live slot updates—changes in settings apply immediately
- Fallback handling for deleted shortcuts in slot configurations

### v3.0
- Added format override dropdown in the floating save UI
- Added live filename preview in the options page
- Added privacy mode for on-demand script injection
- Added repeat last action button in the popup
- Extended stats tracking with format type and content preview
- Improved recent file display with format icons and badges

### v2.3
- Improved HTML vs. TypeScript/JavaScript detection
- Added category shortcuts for quick prefix-based saving
- Fixed bold/italic formatting in PDF and DOCX exports
- Added corner ball UI element

### v2.0
- Complete rewrite with Manifest V3
- Added floating action button and contextual save chip
- Smart format detection engine
- Usage statistics and recommendations
