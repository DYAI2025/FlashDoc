### v3.2 - Release Notes

- Professional PDF output: proper margins, H1 underlines, segment-based word wrapping for mixed formatting
- Professional DOCX output: Calibri font, themed heading colors, 1.15 line spacing, Word-native list numbering
- HTML-to-Markdown conversion: headings, bold/italic/code/strikethrough, ordered and unordered lists
- Smart plain text structuring: auto-detects titles, ALL CAPS headers, bullet/numbered lists, paragraphs
- Fixed whitespace loss between formatted inline spans (e.g. bold + space + italic)
- Fixed CSS-styled span format stack not releasing on close
- Run merging to reduce text fragmentation
- 140 format quality tests covering the full pipeline


### v3.1 - Release Notes

- Configurable contextual chip slots (5 buttons, each customizable)
- Slot presets for switching between different button layouts
- Increased prefix shortcuts from 5 to 10
- Live slot updates—changes in settings apply immediately
- Fallback handling for deleted shortcuts in slot configurations


### v3.0 - Release Notes

- Added format override dropdown in the floating save UI
- Added live filename preview in the options page
- Added privacy mode for on-demand script injection
- Added repeat last action button in the popup
- Extended stats tracking with format type and content preview
- Improved recent file display with format icons and badges




# FlashDoc 2.3 - Release Notes

## Neu

### Bugfixes
- fixed DOXC Formating. It now creates the copies formation to you flashdoc file
- fixed pdf formating. It is not finished by now, but it work. Still not copies full formation to flash doc 


# FlashDoc 2.2.0 - Release Notes

## Neu

### Category Shortcuts
Das Prefix-System wurde durch ein einfacheres "Category Shortcuts"-System ersetzt:
- Erstelle bis zu 5 Schnellspeicher-Kombis: Kategorie + Format
- Beispiel: "Design" + ".md" = speichert als `Design_save_2025-12-15.md`
- Shortcuts erscheinen oben im Floating-Menü mit einem Klick erreichbar
- Einfachere Einstellungsseite ohne komplizierte Prefix-Auswahl

## Verbesserungen

### Vereinfachte Bedienung
- Direkter One-Click-Save mit vordefinierten Kategorien
- Kein zweistufiger Dialog mehr (Format -> Prefix)
- Saubere Trennung zwischen Shortcuts und Standard-Formaten im Menü

## Bugfixes
- Auto-Menü (3-Sekunden-Timer) entfernt - verursachte Zuverlässigkeitsprobleme
- Prefix-Tracking entfernt - vereinfachtes System braucht keine Nutzungsstatistik

## Technische Hinweise
- Keine neuen Berechtigungen erforderlich
- Alte `filePrefixes` Einstellungen werden nicht migriert - bitte neu erstellen als Shortcuts
- Neue Storage-Key: `categoryShortcuts` (Array mit {id, name, format})

---

# FlashDoc 2.1.0 - Previous Release

## Neu
- **Word-Dokumente (DOCX)**: Echte .docx Dateien erstellen
- **FlashDoc-Ball**: Draggbares Icon mit Pin-Funktion
- **Verbesserte Button-Positionierung**: +40px Offset, Viewport-Clamping
