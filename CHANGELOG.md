# Changelog

All notable changes to FlashDoc are documented in this file.

# FlashDoc Chrome Extension v3.2

FlashDoc turns any selected text into instantly downloadable files. Context menus, keyboard shortcuts, and a floating action button let you save snippets without leaving the page.

## What's New in v3.2

Version 3.2 delivers professional-quality document exports. PDF, DOCX, and Markdown files now preserve formatting, structure, and all selected text reliably.

### Professional Document Quality
- PDF: proper margins (20mm), heading hierarchy with H1 underlines, segment-based word wrapping across mixed formatting
- DOCX: Calibri font, themed heading colors (#1E5C4A / #2A7A62), 1.15 line spacing, real Word numbering for lists
- Markdown: full HTML-to-Markdown conversion with `#` headings, `**bold**`, `*italic*`, `` `code` ``, and list syntax

### Smart Plain Text Structuring
When no HTML formatting is available, FlashDoc now detects structure automatically: titles, ALL CAPS section headers, colon-ending labels, bullet lists, numbered lists, and paragraph grouping.

### Formatting Pipeline Fixes
- Whitespace between inline formatted spans is no longer dropped
- CSS-styled spans (`font-weight: bold` etc.) properly track and release formatting
- Consecutive runs with identical formatting are merged to reduce fragmentation
- Block-level trimming preserves meaningful inter-word spaces

### Testing
140 format quality tests covering the entire pipeline: EntityDecoder, HtmlTokenizer, BlockBuilder, PlainTextStructurer, HtmlToMarkdown, PdfListContext, and real-world content scenarios.

---

## What's New in v3.1

- Configurable contextual chip slots (5 buttons, each customizable)
- Slot presets for switching between different button layouts
- Increased prefix shortcuts from 5 to 10
- Live slot updates from settings

---

## What's New in v3.0

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
