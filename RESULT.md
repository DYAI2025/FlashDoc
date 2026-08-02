# FlashDoc — Markdown & TXT Struktur-Preservation Fix

**Datum:** 2026-02-24  
**Branch:** `feature/i18n-preparation`  
**Commit:** `4d7f2b7` - https://github.com/DYAI2025/FlashDoc/commit/4d7f2b7

---

## ✅ Erledigte Aufgaben

### Problem (Original)
Text wurde beim Speichern als .md / .txt / .docx / .pdf als großer unformatierter Block gespeichert. Erwartet: Text wird mit Struktur (Überschriften, Listen, Fett, Kursiv) formatiert übernommen.

### Lösung implementiert

#### 1. MarkdownRenderer hinzugefügt (service-worker.js)

**Neuer Code:** `MarkdownRenderer` IIFE am Modul-Level

**Unterstützte Formatierungen:**
- Überschriften: `# H1`, `## H2`, `### H3` usw.
- Fett: `**text**`
- Kursiv: `*text*`
- Fett+Kursiv: `***text***`
- Durchgestrichen: `~~text~~`
- Code: `` `code` ``
- Ungeordnete Listen: `- Item`
- Geordnete Listen: `1. Item` (mit Einrückung für verschachtelte Listen)
- Blockquotes: `> Text`

#### 2. createMdBlob Methode

- Verwendet `HtmlTokenizer.tokenize(html)` für HTML-Parsing
- Verwendet `BlockBuilder.build(tokens)` für Block-Struktur
- Konvertiert Blocks zu Markdown mit `MarkdownRenderer.renderToMarkdown(blocks)`
- Fallback auf Plain-Text wenn kein HTML verfügbar

#### 3. TXT Struktur-Preservation

- Wenn HTML verfügbar: Parse Blocks und füge Leerzeilen zwischen Absätzen ein
- Behält die Struktur: Absätze werden durch doppelte Zeilenumbrüche getrennt

#### 4. Bestehende Formate (bereits funktional)

- **PDF:** Nutzt `createPdfBlob` mit Block-Iteration
- **DOCX:** Nutzt `createDocxBlob` mit `DocxRenderer` für echte Word-Formatierung

---

## 📁 Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `service-worker.js` | +71 Zeilen: MarkdownRenderer + createMdBlob + TXT-Verbesserung |

---

## 🔧 Technische Details

### Pipeline für .md / .txt:
```
HTML-Content 
  → HtmlTokenizer.tokenize() 
  → BlockBuilder.build() 
  → [MarkdownRenderer.renderToMarkdown() / TXT mapping] 
  → Blob
```

### Beispiel-Output:
**Input HTML:**
```html
<h1>Titel</h1>
<p>Ein <b>fetter</b> und <i>kursiver</i> Text</p>
<ul><li>Item 1</li><li>Item 2</li></ul>
```

**Output Markdown:**
```markdown
# Titel

Ein **fetter** und *kursiver* Text

- Item 1
- Item 2
```

---

## 🎯 Ergebnis

✅ **.md Dateien** werden jetzt mit korrekter Struktur gespeichert  
✅ **.txt Dateien** haben Absatztrennung  
✅ **.docx / .pdf** funktionierten bereits (verifiziert)  

---

## 🔗 Links

- **Repository:** https://github.com/DYAI2025/FlashDoc
- **Branch:** `feature/i18n-preparation`
- **Commit:** `4d7f2b7`
