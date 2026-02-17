# Changelog

All notable changes to FlashDoc are documented in this file.

# FlashDoc Chrome Extension v3.2

FlashDoc turns any selected text into instantly downloadable files. Context menus, keyboard shortcuts, and a floating action button let you save snippets without leaving the page.

## What's New in v3.2

Version 3.2 fixes formatting issues when copying content with lines and special characters to PDF and DOCX, and removes the intrusive corner ball from the default experience.

### Horizontal Rule Support
Horizontal lines (`<hr>`) copied from web pages are now rendered correctly. PDFs show a gray separator line, and DOCX files show a bordered paragraph. Previously these were silently dropped.

### PDF Special Character Handling
Characters outside jsPDF's built-in font encoding (WinAnsiEncoding) no longer appear as blank spaces. Box-drawing characters (`─═│┌┐└┘`), arrows (`→←↑↓`), Greek letters (`αβπ`), check marks (`✓✔`), and other symbols are automatically replaced with readable ASCII alternatives. This also fixes list bullets at nested levels that were previously invisible.

### PDF Formatting Fidelity
Whitespace between formatted text segments is now preserved. Previously, a space between `<b>bold</b> <i>italic</i>` was lost, causing words to merge together in the PDF output.

### Corner Ball Disabled by Default
The draggable corner ball no longer appears on every page. It was covering important UI elements and interfering with normal browsing. The floating save button remains active. The corner ball can be re-enabled in settings if desired.

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



## [2.2.0] - 2025-12-15

### Changed
- **Category Shortcuts**: Replaced prefix system with simplified Category Shortcuts
  - Define up to 5 quick-save combos: Category + Format
  - Example: "Design" + ".md" = one-click save as `Design_save_YYYY-MM-DD.md`
  - Shortcuts appear prominently at top of floating menu
  - Cleaner UI in settings page

### Removed
- **Auto-Menu Timer**: Removed 3-second auto-menu feature (caused reliability issues)
- **Prefix Usage Tracking**: Simplified system no longer needs usage analytics

### Technical
- Replaced `filePrefixes`, `prefixUsage` with `categoryShortcuts` storage key
- New content.js methods: `buildShortcutsHtml()`, `saveWithShortcut()`
- Simplified `generateFilename()` for shortcut-based saves
- Removed: `trackPrefixUsage()`, `getSortedPrefixes()`, auto-menu timer methods

## [2.1.0] - 2025-12-14

### Added
- **DOCX Export**: Full Word document support with native ZIP/XML generation (no external libraries)
- **Corner Ball**: New draggable FlashDoc icon in screen corner
  - Drag anywhere on screen
  - Auto snap-back after 5 seconds when released
  - Pin function to keep position permanently
  - Quick access menu on click

### Changed
- **Floating Button positioning**: Increased offset (+40px) to avoid blocking selected text
- **Viewport clamping**: Floating button now stays within viewport bounds with smart flip logic
- **Settings UI**: Added Corner Ball toggle

### Technical
- New content.js methods: `createCornerBall()`, `startBallDrag()`, `onBallDrag()`, `endBallDrag()`, `snapBallBack()`, `toggleBallPin()`, `showBallMenu()`
- Service worker: `generateFilename()` extended with prefix parameter
- New storage key: `showCornerBall`

## [2.0.0] - Previous Release

- Initial Manifest V3 release
- PDF, Markdown, TXT, JSON, YAML, Code file support
- Smart format detection
- Floating save button
- Context menu integration
- Keyboard shortcuts
- Options page with customization
