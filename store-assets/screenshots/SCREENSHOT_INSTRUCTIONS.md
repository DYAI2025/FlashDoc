# FlashDoc Screenshot Creation Instructions

## Overview
This document provides step-by-step instructions for creating professional Chrome Web Store screenshots for FlashDoc v3.1.

## Requirements

### Chrome Web Store Specs
- **Resolution**: 1280x800 pixels (16:10 aspect ratio) or 640x400 pixels
- **Recommended**: Use 1280x800 for clarity
- **Format**: PNG (preferred) or JPEG
- **Maximum file size**: 5MB per image
- **Quantity**: 5 screenshots (recommended)

### Tools Needed
- Chrome or Chrome Canary (latest version)
- FlashDoc extension loaded unpacked
- Screenshot tool (OS native, Chrome DevTools, or third-party)
- Image editor (Figma, Photoshop, GIMP, Photopea, or Canva)
- Demo content (provided below)

---

## Pre-Screenshot Setup

### 1. Browser Configuration

**Clean Profile**:
```bash
# Create clean Chrome profile (optional, for pristine screenshots)
google-chrome --user-data-dir=/tmp/chrome-clean-profile
```

**Browser Settings**:
- Window size: Set to exactly 1280x800 or use Chrome DevTools Device Mode
- Zoom: 100% (Ctrl+0 / Cmd+0)
- Theme: Default light theme
- Bookmarks bar: Hidden (Ctrl+Shift+B / Cmd+Shift+B)
- Extensions: Only FlashDoc visible
- Developer tools: Closed

**Check Window Size**:
```javascript
// Run in Chrome DevTools Console to verify
console.log(window.innerWidth, window.innerHeight);
// Should output: 1280 800 (or close)
```

---

### 2. Extension Configuration

**Load Extension**:
1. Navigate to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `/home/moltbot/FlashDoc` directory

**Configure for Demo**:

**Quick-Save Slots** (Options page):
- Slot 1: Markdown
- Slot 2: PDF
- Slot 3: JavaScript (or custom shortcut "Meeting Notes")
- Slot 4: Python
- Slot 5: JSON (or Disabled for variety)

**Category Shortcuts** (Options page):
Create 10 shortcuts with realistic names:
1. "Meeting Notes" + .md
2. "Code Review" + .txt
3. "Design Specs" + .pdf
4. "Bug Reports" + .md
5. "API Docs" + .md
6. "Daily Notes" + .txt
7. "Research" + .md
8. "Snippets" + .js
9. "SQL Queries" + .sql
10. "Config" + .yaml

**Slot Presets** (Options page):
Create 3-4 presets:
1. "Writing" - MD, PDF, TXT, DOCX, (disabled)
2. "Coding" - JS, Python, JSON, TypeScript, Go
3. "Research" - MD, TXT, PDF, (disabled), (disabled)
4. "Documentation" - MD, PDF, HTML, (disabled), (disabled)

**Other Settings**:
- Corner Ball: Enabled
- Privacy Mode: Disabled (for demo)
- File naming: Default pattern

---

### 3. Demo Content Preparation

**Option A: Use Existing Website**
Visit a professional article site:
- Medium.com articles
- Dev.to posts
- GitHub README files
- Wikipedia articles

**Option B: Create Custom Demo Page**
Create a file: `/tmp/flashdoc-demo.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlashDoc Demo Page</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 60px auto;
            padding: 0 40px;
            line-height: 1.8;
            color: #2D3748;
            background: #F7FAFC;
        }
        h1 {
            font-size: 42px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #1A202C;
        }
        h2 {
            font-size: 28px;
            font-weight: 600;
            margin-top: 32px;
            margin-bottom: 16px;
            color: #2D3748;
        }
        p {
            font-size: 18px;
            margin-bottom: 20px;
        }
        code {
            background: #EDF2F7;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
        }
        .metadata {
            color: #718096;
            font-size: 14px;
            margin-bottom: 24px;
        }
    </style>
</head>
<body>
    <article>
        <h1>Modern JavaScript Design Patterns</h1>
        <div class="metadata">Published on January 15, 2026 • 8 min read</div>

        <p>JavaScript has evolved significantly over the past decade, and with it, the patterns we use to structure our applications. Understanding these patterns is crucial for building maintainable, scalable codebases.</p>

        <h2>The Module Pattern</h2>
        <p>The Module Pattern remains one of the most fundamental patterns in JavaScript. It allows us to create private variables and methods while exposing a public API. Here's a modern implementation using ES6 modules:</p>

        <p>By encapsulating functionality within modules, we achieve better separation of concerns and reduce the risk of naming collisions in the global scope. This pattern is the foundation of modern JavaScript development.</p>

        <h2>Observer Pattern</h2>
        <p>The Observer Pattern defines a one-to-many dependency between objects. When one object changes state, all its dependents are notified automatically. This pattern is the backbone of reactive programming and is implemented in frameworks like React, Vue, and Angular.</p>

        <p>In modern JavaScript, we can implement this pattern using <code>EventTarget</code> or custom event emitters. The pattern promotes loose coupling and makes our code more flexible and easier to test.</p>

        <h2>Singleton Pattern</h2>
        <p>While controversial in some contexts, the Singleton Pattern ensures a class has only one instance and provides a global point of access to it. In JavaScript, this is naturally achieved through module scope or ES6 classes with private constructors.</p>

        <p>Common use cases include managing application state, database connections, or configuration objects. However, overuse of singletons can lead to tight coupling and make testing more difficult.</p>
    </article>
</body>
</html>
```

Open this file in Chrome: `file:///tmp/flashdoc-demo.html`

---

## Screenshot 1: Hero Shot - Quick Save in Action

### Goal
Showcase the core value proposition: selecting text triggers customizable save buttons.

### Step-by-Step

**1. Prepare Page**:
- Open demo page (custom HTML or professional article)
- Scroll to show 2-3 paragraphs of readable text
- Ensure page looks clean and professional

**2. Select Text**:
- Click and drag to select 2-3 paragraphs (150-300 words)
- Selection should be clearly visible (blue highlight)
- Text should be readable in final screenshot

**3. Trigger FlashDoc**:
- Wait for floating button menu to appear above/below selection
- Ensure all 5 configured buttons are visible
- Buttons should display clear labels (Markdown, PDF, JS, Python, JSON)

**4. Capture Screenshot**:
- Use OS screenshot tool (Windows: Win+Shift+S, macOS: Cmd+Shift+4, Linux: Flameshot/Spectacle)
- OR use Chrome DevTools: Ctrl+Shift+P → "Capture screenshot" → "Capture full size screenshot"
- Crop to 1280x800 if needed
- Save as: `screenshot-1-hero-raw.png`

**5. Annotations** (in image editor):

**Add Text Overlays**:
- Top-left: "FlashDoc v3.1" (32px, bold, #2D3748)
- Center-top: "Select text → Instant save" (28px, semi-bold, #4A5568)
  - Add arrow pointing to floating buttons
  - Arrow color: #667eea (blue), 4px stroke

**Add Callouts**:
- Callout box near buttons: "5 Customizable Buttons" (20px, bold, white text)
  - Background: #667eea, border-radius: 8px, padding: 8px 16px
  - Add small arrow pointing to button row

**Add Badge**:
- Top-right corner: Circular badge with "NEW" text
  - Background: #7ED321 (green), 60px diameter
  - Text: "NEW" (18px, bold, white)

**Visual Enhancements**:
- Add subtle drop shadow to floating button menu (0px 4px 12px rgba(0,0,0,0.15))
- Add soft glow around selected text (optional, #FFD700 with 20% opacity)

**6. Export**:
- Save as: `screenshot-1-hero-final.png`
- Resolution: 1280x800
- Format: PNG
- Optimize with TinyPNG or Squoosh.app (target: < 1MB)

---

## Screenshot 2: Slot Configuration Interface

### Goal
Demonstrate the customization power of v3.1 - configurable quick-save slots.

### Step-by-Step

**1. Open Options Page**:
- Right-click FlashDoc icon in Chrome toolbar
- Select "Options"
- OR navigate to: `chrome://extensions/?id=[extension-id]` → Details → Extension options

**2. Navigate to Slots Section**:
- Scroll to "Quick-Save Slots Configuration" section
- Ensure all 5 slots are visible in viewport
- Check that slots have varied configurations (mix of formats and shortcuts)

**3. Compose Scene**:
- Zoom to 90-100% so slots are clearly readable
- Ensure no other browser UI is visible (hide bookmarks, minimize extensions menu)
- Click on one dropdown to show it open (e.g., Slot 3)
  - Display dropdown options: Formats (PDF, Markdown, TXT, etc.) and Shortcuts
  - This shows interactivity

**4. Capture Screenshot**:
- Capture entire browser window or crop to options page content area
- Ensure 1280x800 resolution
- Save as: `screenshot-2-slots-raw.png`

**5. Annotations**:

**Add Headline**:
- Top-center: "Configure Your Perfect Workflow" (36px, bold, #2D3748)
- Subtitle: "Customize each button to match your needs" (20px, #4A5568)

**Add Arrows**:
- Arrow pointing to Slot 1: "Choose format..." (18px, #667eea)
- Arrow pointing to Slot 3 (with open dropdown): "...or custom shortcut" (18px, #667eea)
- Arrows: Blue (#667eea), 3px stroke, curved

**Add Callout Box**:
- Right side: Feature list box
  - Background: White, border: 2px solid #E2E8F0, border-radius: 12px, padding: 24px
  - Content:
    - "✓ 15+ Format Options" (18px, #2D3748)
    - "✓ Custom Shortcuts" (18px, #2D3748)
    - "✓ Disable Any Slot" (18px, #2D3748)
    - "✓ Instant Updates" (18px, #2D3748)

**6. Export**:
- Save as: `screenshot-2-slots-final.png`
- Resolution: 1280x800, PNG, optimized

---

## Screenshot 3: Slot Presets

### Goal
Show the preset system for instant workflow switching.

### Step-by-Step

**1. Open Options Page**:
- Navigate to Options page
- Scroll to "Slot Presets" section

**2. Ensure Presets Exist**:
- Create 4 presets if not already done:
  1. "Writing" (Markdown, PDF, TXT, DOCX, disabled)
  2. "Coding" (JavaScript, Python, JSON, TypeScript, Go)
  3. "Research" (Markdown, TXT, PDF, disabled, disabled)
  4. "Documentation" (Markdown, PDF, HTML, disabled, disabled)

**3. Compose Scene**:
- Ensure all 4 preset cards are visible
- One preset should be marked as "Active" (green border or checkmark)
- Preset cards should show preset name and action buttons (Activate, Edit, Delete)

**4. Capture Screenshot**:
- Capture presets section
- Ensure clean composition (no other distracting UI elements)
- Save as: `screenshot-3-presets-raw.png`

**5. Annotations**:

**Add Headline**:
- Top: "Switch Workflows Instantly" (36px, bold, #2D3748)
- Subtitle: "Create up to 5 presets for different tasks" (20px, #4A5568)

**Add Badge**:
- Top-right: "Up to 5 Presets" badge
  - Background: #667eea, text: white, 18px, bold
  - Border-radius: 20px, padding: 6px 16px

**Add Arrows**:
- Arrow pointing to "Writing" preset: "For articles & notes" (16px, #718096)
- Arrow pointing to "Coding" preset: "For development work" (16px, #718096)
- Arrow pointing to "Activate" button: "One-click switch" (16px, #667eea)

**Add Visual Highlight**:
- Subtle glow around active preset card (0px 0px 12px rgba(102, 126, 234, 0.4))

**6. Export**:
- Save as: `screenshot-3-presets-final.png`
- Resolution: 1280x800, PNG, optimized

---

## Screenshot 4: Expanded Category Shortcuts

### Goal
Highlight the 10-shortcut capacity (doubled from v3.0).

### Step-by-Step

**1. Open Options Page**:
- Navigate to Options page
- Scroll to "Category Shortcuts" section

**2. Ensure 10 Shortcuts Exist**:
- Fill in all 10 shortcut rows with realistic names:
  - Meeting Notes + .md
  - Code Review + .txt
  - Design Specs + .pdf
  - Bug Reports + .md
  - API Docs + .md
  - Daily Notes + .txt
  - Research + .md
  - Snippets + .js
  - SQL Queries + .sql
  - Config + .yaml

**3. Compose Scene**:
- Show all 10 rows (or as many as fit in viewport)
- If not all fit, capture showing 7-8 rows with scroll indicator
- Ensure each row shows: Name field, Format dropdown, and action buttons

**4. Capture Screenshot**:
- Capture shortcuts section
- Ensure rows are clearly readable
- Save as: `screenshot-4-shortcuts-raw.png`

**5. Annotations**:

**Add Headline**:
- Top: "10 Quick-Save Categories" (36px, bold, #2D3748)
- Subtitle: "Organize by project, type, or workflow" (20px, #4A5568)

**Add Badge**:
- Top-right: "Doubled from v3.0" badge
  - Background: #7ED321 (green), text: white, 18px, bold
  - Border-radius: 20px, padding: 6px 16px
  - Add "2x" icon or "↑" arrow

**Add Callout**:
- Right side: Example use case box
  - Background: #EDF2F7, border-radius: 8px, padding: 16px
  - Content:
    - "Example: 'Meeting Notes'" (16px, bold, #2D3748)
    - "Right-click → 'Meeting Notes'" (14px, #4A5568)
    - "→ Saves as: Meeting_Notes_2026-02-10.md" (14px, #4A5568)

**Add Visual Highlight**:
- Highlight first 3 shortcuts with subtle yellow background (rgba(255, 215, 0, 0.1))
- Add note: "Your most-used shortcuts" (14px, #718096)

**6. Export**:
- Save as: `screenshot-4-shortcuts-final.png`
- Resolution: 1280x800, PNG, optimized

---

## Screenshot 5: Format Override + Corner Ball

### Goal
Show additional power features (Format Override and Corner Ball).

### Step-by-Step

**1. Prepare Split-Screen Composition**:

This screenshot will be a composite of two separate captures:
- **Left half (640x800)**: Format Override feature
- **Right half (640x800)**: Corner Ball feature

**2. Capture Left: Format Override**

**Setup**:
- Open demo page
- Select 2-3 paragraphs of text
- Trigger floating button menu
- Click on the format dropdown (small arrow icon on button)
  - This should show list of alternative formats
  - Example: Auto-detected "Markdown", but dropdown shows PDF, TXT, DOCX, etc.

**Capture**:
- Screenshot showing floating button with dropdown open
- Crop to focus on button + dropdown (zoom in if needed)
- Save as: `screenshot-5-left-override.png`

**3. Capture Right: Corner Ball**

**Setup**:
- Enable Corner Ball in options (should be already enabled)
- Open demo page
- Corner Ball should be visible in screen corner (default: bottom-right)
- Click Corner Ball to open quick-access menu
  - Menu should show save options, settings link, etc.

**Capture**:
- Screenshot showing Corner Ball icon and expanded menu
- Crop to focus on Corner Ball + menu area
- Save as: `screenshot-5-right-cornerball.png`

**4. Composite Image** (in image editor):

**Layout**:
- Create 1280x800 canvas
- Place format override image on left half (0-640px width)
- Place corner ball image on right half (640-1280px width)
- Add vertical divider line (1px, #E2E8F0, at 640px)

**5. Annotations**:

**Left Side**:
- Top: "Override Format Anytime" (24px, bold, #2D3748)
- Arrow pointing to dropdown: "Change detected format" (16px, #667eea)

**Right Side**:
- Top: "Always-Accessible Corner Ball" (24px, bold, #2D3748)
- Arrow pointing to Corner Ball: "Drag, pin, or click" (16px, #667eea)

**Bottom Banner**:
- Full-width bar at bottom (1280px width, 80px height)
- Background: Gradient (#667eea → #764ba2)
- Text (centered, white): "Supports 15+ Formats: PDF, DOCX, Markdown, JavaScript, Python, JSON, YAML, CSV, and more" (18px, bold)

**6. Export**:
- Save as: `screenshot-5-features-final.png`
- Resolution: 1280x800, PNG, optimized

---

## Post-Processing Checklist

For all screenshots:

**Color Correction**:
- [ ] Adjust brightness/contrast for clarity
- [ ] Ensure text is readable (not too faint)
- [ ] Apply subtle vignette (darken edges 5-10%)

**Consistency**:
- [ ] All screenshots use same annotation style (font, colors, arrow style)
- [ ] Consistent color palette:
  - Primary blue: #667eea
  - Accent green: #7ED321
  - Text dark: #2D3748
  - Text light: #4A5568
- [ ] Same drop shadow settings across all floating elements

**Quality Check**:
- [ ] No typos in annotations
- [ ] All text is readable at 1280x800 resolution
- [ ] No personal information visible (email, username, etc.)
- [ ] Browser UI is clean (no extra extensions, bookmarks, etc.)

**File Optimization**:
- [ ] All images are exactly 1280x800 pixels
- [ ] PNG format (for transparency support)
- [ ] Compressed to < 1MB per image (use TinyPNG, Squoosh.app)
- [ ] Named consistently: `screenshot-1-hero.png`, `screenshot-2-slots.png`, etc.

---

## Alternative: Automated Screenshot Tool

For batch processing, use Puppeteer to automate screenshot capture:

**Setup**:
```bash
cd /home/moltbot/FlashDoc
npm install puppeteer
```

**Script**: `scripts/capture-screenshots.js`

```javascript
const puppeteer = require('puppeteer');
const path = require('path');

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${path.resolve(__dirname, '..')}`,
      `--load-extension=${path.resolve(__dirname, '..')}`,
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Screenshot 1: Hero Shot
  await page.goto('file:///tmp/flashdoc-demo.html');
  await page.waitForTimeout(2000);
  // Simulate text selection (manual step required)
  await page.screenshot({ path: 'store-assets/screenshots/screenshot-1-hero-raw.png' });

  // Screenshot 2: Slots Configuration
  await page.goto('chrome-extension://[extension-id]/options.html');
  await page.waitForSelector('.slots-section');
  await page.screenshot({ path: 'store-assets/screenshots/screenshot-2-slots-raw.png' });

  // ... repeat for other screenshots

  await browser.close();
}

captureScreenshots();
```

**Note**: This script requires manual adjustments for extension ID and interaction steps (text selection, dropdown opening).

---

## Final Deliverables

**Screenshot Files**:
- `screenshot-1-hero.png` (1280x800, < 1MB)
- `screenshot-2-slots.png` (1280x800, < 1MB)
- `screenshot-3-presets.png` (1280x800, < 1MB)
- `screenshot-4-shortcuts.png` (1280x800, < 1MB)
- `screenshot-5-features.png` (1280x800, < 1MB)

**Organization**:
```
store-assets/
├── screenshots/
│   ├── raw/              # Unedited captures
│   │   ├── screenshot-1-hero-raw.png
│   │   ├── screenshot-2-slots-raw.png
│   │   └── ...
│   ├── final/            # Annotated, ready for upload
│   │   ├── screenshot-1-hero.png
│   │   ├── screenshot-2-slots.png
│   │   └── ...
│   └── SCREENSHOT_INSTRUCTIONS.md (this file)
```

**Upload to Chrome Web Store**:
1. Log in to Chrome Web Store Developer Dashboard
2. Navigate to FlashDoc listing
3. Go to "Store listing" tab
4. Scroll to "Screenshots" section
5. Upload all 5 screenshots in order (Hero → Slots → Presets → Shortcuts → Features)
6. Add optional captions if desired
7. Save changes

---

## Troubleshooting

**Problem**: Screenshot resolution is incorrect
**Solution**: Use Chrome DevTools Device Mode to set exact 1280x800 viewport, then use "Capture screenshot"

**Problem**: Floating button doesn't appear when text is selected
**Solution**: Check extension is enabled, reload page (Ctrl+R), ensure FlashDoc is configured correctly

**Problem**: Annotations look unprofessional
**Solution**: Use design tool templates (Figma Community has free Chrome Store screenshot templates)

**Problem**: File size too large (> 5MB)
**Solution**: Use TinyPNG.com or Squoosh.app to compress PNG without quality loss

**Problem**: Text in screenshot is too small/unreadable
**Solution**: Increase browser zoom to 110-125%, then capture and scale back to 1280x800

---

## Resources

**Screenshot Tools**:
- **Windows**: Snipping Tool, Snip & Sketch (Win+Shift+S)
- **macOS**: Screenshot app (Cmd+Shift+5), Preview
- **Linux**: Flameshot, Spectacle, GNOME Screenshot
- **Chrome**: DevTools → Cmd/Ctrl+Shift+P → "Capture screenshot"

**Image Editors**:
- **Free Web-Based**: Photopea (photopea.com), Canva
- **Free Desktop**: GIMP, Paint.NET, Krita
- **Paid**: Figma, Adobe Photoshop, Sketch

**Compression Tools**:
- TinyPNG (tinypng.com) - web-based, excellent compression
- Squoosh (squoosh.app) - web-based, Google's image optimizer
- ImageOptim (macOS) - desktop app
- OptiPNG (CLI) - `optipng -o7 screenshot.png`

**Inspiration**:
- Browse top productivity extensions on Chrome Web Store
- Analyze their screenshot composition, annotations, and style
- Examples: Grammarly, Loom, Notion Web Clipper

---

**Document Version**: 1.0
**Created**: 2026-02-10
**Last Updated**: 2026-02-10
**Owner**: FlashDoc Development Team
