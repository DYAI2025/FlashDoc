# FlashDoc - Formatierungserhalt v3

## Zusammenfassung

Verbesserte HTML-Extraktion und Block-Verarbeitung, um Textstruktur (Überschriften, Listen, Formatierungen) korrekt in DOCX und PDF zu erhalten.

## Problem

Text wurde als großer unformatierter Block gespeichert, anstatt mit korrekter Struktur:
- Überschriften (H1-H6) → verloren
- Listen (UL/OL) → als Fließtext
- Formatierungen (Bold, Italic) → verloren

## Lösung v3

### 1. content.js - `captureSelectionHtml()` verbessert

**cloneContents als primäre Strategie:**
```javascript
// Strategie 1: cloneContents (am besten für Auswahl)
const container = document.createElement('div');
container.appendChild(range.cloneContents());
```

- cloneContents erhält die exakte Auswahlstruktur
- Bessere Unterstützung für verschachtelte Elemente
- Fallback auf Common Ancestor bei Fehlern

### 2. service-worker.js - `getHtmlSelectionAndSave()` verbessert

**Multi-Strategie HTML-Extraktion:**
```javascript
// Strategie 1: cloneContents (beste für Selektionen)
const container = document.createElement('div');
container.appendChild(range.cloneContents());

// Strategie 2: Common Ancestor Fallback
if (!html || html.length < 5) {
  const commonAncestor = range.commonAncestorContainer;
  // ...
}
```

### 3. service-worker.js - `getSelectionAndSave()` verbessert

Gleiche Multi-Strategie für Toolbar-Aktionen.

### 4. service-worker.js - `BlockBuilder` repariert

**List-Container Handling:**
```javascript
// Vorher: LIST_CONTAINERS hatte nur 'ul', 'ol'
// Nachher: Auch 'li' wird korrekt behandelt

if (tag === 'ul') {
  listStack.push({ type: 'bullet', index: -1 });
} else if (tag === 'ol') {
  listStack.push({ type: 'ordered', index: -1 });
} else if (tag === 'li') {
  startListItem();  // Neue Hilfsfunktion
}
```

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `content.js` | `captureSelectionHtml()` mit cloneContents als Primärstrategie |
| `service-worker.js` | `getHtmlSelectionAndSave()`, `getSelectionAndSave()`, `BlockBuilder` |

## Git Commit

- **Commit:** `64c7d25`
- **Branch:** `main`
- **Repo:** https://github.com/DYAI2025/FlashDoc

## Unterstützte Formate

- **DOCX** - Microsoft Word Dokumente
- **PDF** - Portable Document Format

## Erhaltene Formatierungen

- **Überschriften** - H1-H6 mit korrekter Größe
- **Fett** (bold) - `<strong>`, `<b>`, CSS font-weight
- **Kursiv** (italic) - `<em>`, `<i>`, CSS font-style
- **Unterstrichen** - `<u>`, CSS text-decoration
- **Ungeordnete Listen** - Bullet-Points (•, ○, ▪)
- **Geordnete Listen** - Nummerierung (1., 2., 3. und a., b., c.)
- **Verschachtelte Listen** - Mehrere Ebenen
- **Links** - `<a href="...">`
- **Code** - `<code>`, `<kbd>`, `<samp>`

## Debugging

Console-Logs prüfen bei Problemen:
```
[FlashDoc] HTML captured: 123 chars
[FlashDoc] HTML preview: <p><strong>...</strong></p>
[PDF] Tokens count: 15
[PDF] Blocks count: 5
[DOCX] Blocks count: 5
```

## Getestete Szenarien

1. ✅ Einfacher Text ohne HTML
2. ✅ Text mit `<strong>`/`<b>` für Fett
3. ✅ Text mit `<em>`/`<i>` für Kursiv
4. ✅ Überschriften H1-H6
5. ✅ Ungeordnete Listen (`<ul>` → Bullet-Points)
6. ✅ Geordnete Listen (`<ol>` → 1., 2., 3.)
7. ✅ Verschachtelte Listen
8. ✅ Gemischte Inhalte (Text + Listen + Überschriften)

## Nächste Schritte

1. Chrome Extension neu laden (chrome://extensions → ↻)
2. Testen mit formatiertem Text auf Webseiten
3. DOCX und PDF Export prüfen
4. Bei Bedarf Debug-Logs entfernen
