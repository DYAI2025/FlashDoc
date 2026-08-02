# FlashDoc Promotional Graphics Guide

## Overview
This document provides specifications and templates for creating Chrome Web Store promotional graphics for FlashDoc v3.1.

---

## Chrome Web Store Promotional Image Requirements

### Small Tile
- **Dimensions**: 440x280 pixels
- **Format**: PNG or JPEG
- **Purpose**: Appears in Web Store promotional carousels
- **Usage**: Optional but recommended

### Large Tile
- **Dimensions**: 920x680 pixels
- **Format**: PNG or JPEG
- **Purpose**: Featured placements in Chrome Web Store
- **Usage**: Optional but recommended for featured listing eligibility

### Marquee
- **Dimensions**: 1400x560 pixels
- **Format**: PNG or JPEG
- **Purpose**: Hero banner in search results and category pages
- **Usage**: Optional but highly recommended for visibility

---

## Design Principles

### Brand Identity
- **Color Palette**:
  - Primary: #667eea (Blue-Purple)
  - Secondary: #764ba2 (Deep Purple)
  - Accent: #7ED321 (Green) for success states
  - Background: #F7FAFC (Light Gray) or White
  - Text: #2D3748 (Dark Gray), #4A5568 (Medium Gray)

- **Typography**:
  - Primary Font: Inter (Google Fonts, free)
  - Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
  - Headline: Bold (700 weight), 36-72px
  - Body: Regular (400 weight), 18-24px
  - Accent: Semi-Bold (600 weight), 20-28px

- **Visual Style**:
  - Clean, modern, professional
  - Gradient backgrounds (blue → purple)
  - Subtle shadows for depth
  - Icons: Line-style or flat design
  - Minimal but impactful

---

## Small Tile Design (440x280)

### Layout A: Logo-Centric

**Composition**:
```
┌─────────────────────────────────────┐
│  [Gradient Background]              │
│                                     │
│         [FlashDoc Logo]             │
│           128x128                   │
│                                     │
│        FlashDoc v3.1                │
│   Instant Document Creator          │
│                                     │
│  [PDF] [MD] [DOCX] [Code] [JSON]   │
│     (Format icons, 32x32)           │
│                                     │
└─────────────────────────────────────┘
```

**Specifications**:
- Background: Gradient from #667eea (top-left) to #764ba2 (bottom-right)
- Logo: Centered, 128x128px (use `icon128.png`)
- Text:
  - "FlashDoc v3.1": 28px, Bold, White
  - "Instant Document Creator": 16px, Regular, White (80% opacity)
- Icons: 5 format icons (PDF, Markdown, DOCX, Code bracket, JSON), 32x32px each
  - Arranged horizontally, centered
  - White icons with 70% opacity

**Figma Template**:
```
Frame: 440x280
Background: Linear Gradient (135deg, #667eea 0%, #764ba2 100%)

Elements:
1. Logo (Image): x=156, y=40, w=128, h=128
2. Text "FlashDoc v3.1": x=0, y=180, w=440, center-align, #FFFFFF, Bold 28px
3. Text "Instant Document Creator": x=0, y=210, w=440, center-align, #FFFFFF 80%, Regular 16px
4. Icon Row: y=240, center-align, spacing=8px, 32x32 each
```

---

### Layout B: Feature-Forward

**Composition**:
```
┌─────────────────────────────────────┐
│  FlashDoc v3.1                      │
│  NEW FEATURES:                      │
│                                     │
│  ⚙️ Customizable Buttons            │
│  🎯 Workflow Presets                │
│  ⚡ 10 Quick Shortcuts               │
│  📄 15+ Formats                     │
│                                     │
│  [Chrome Web Store Badge]           │
└─────────────────────────────────────┘
```

**Specifications**:
- Background: White with subtle gradient overlay
- Top: "FlashDoc v3.1" (24px, Bold, #2D3748)
- Subhead: "NEW FEATURES:" (14px, Bold, #667eea)
- Feature bullets: 4 lines, 16px, Regular, #4A5568
  - Emojis: 20x20px inline
  - Line height: 1.5
- Bottom: Chrome Web Store badge (official asset, 206x58px)

**Figma Template**:
```
Frame: 440x280
Background: #FFFFFF with subtle radial gradient overlay (center: white, edges: #F7FAFC)

Elements:
1. Text "FlashDoc v3.1": x=24, y=24, #2D3748, Bold 24px
2. Text "NEW FEATURES:": x=24, y=56, #667eea, Bold 14px
3. Feature list: x=24, y=80, line-height=36px, #4A5568, Regular 16px
   - ⚙️ Customizable Buttons
   - 🎯 Workflow Presets
   - ⚡ 10 Quick Shortcuts
   - 📄 15+ Formats
4. Chrome Web Store Badge: x=117, y=200, w=206, h=58
```

---

## Large Tile Design (920x680)

### Layout A: Split Hero

**Composition**:
```
┌───────────────────────────────────────────────────────┐
│                                                       │
│  LEFT HALF (460px)        │  RIGHT HALF (460px)      │
│  ─────────────────        │  ──────────────────      │
│                           │                          │
│  FlashDoc v3.1            │  [Screenshot of UI]      │
│  Your Personal            │  Showing floating        │
│  Document Creator         │  save buttons over       │
│                           │  a webpage               │
│  ✓ Customizable Buttons   │                          │
│  ✓ Workflow Presets       │  [OR: Slot config UI]    │
│  ✓ 10 Quick Shortcuts     │                          │
│  ✓ 15+ Formats            │                          │
│  ✓ Zero Friction Saves    │                          │
│                           │                          │
│  [Install Now Button]     │                          │
│                           │                          │
└───────────────────────────────────────────────────────┘
```

**Specifications**:

**Left Half**:
- Background: Gradient (#667eea → #764ba2) with subtle pattern
- Padding: 48px
- Text (White):
  - "FlashDoc v3.1": 48px, Bold
  - "Your Personal Document Creator": 24px, Regular, 80% opacity
- Feature bullets: 18px, Regular, 90% opacity
  - Checkmarks: Green (#7ED321), 20x20px
  - Line height: 1.8
- Button:
  - "Install Now" (white text on semi-transparent black background)
  - Border-radius: 8px, padding: 12px 32px
  - Hover state: Scale 1.05

**Right Half**:
- Background: White or light gray
- Screenshot: 420x600px (portrait crop of hero screenshot)
- OR: Slot configuration UI screenshot
- Subtle drop shadow: 0px 8px 24px rgba(0,0,0,0.15)

**Figma Template**:
```
Frame: 920x680
Background: White

Left Section (0-460px):
  - Rectangle: 0,0, 460x680, Gradient (180deg, #667eea 0%, #764ba2 100%)
  - Add Noise texture: 5% opacity
  - Text "FlashDoc v3.1": x=48, y=80, White, Bold 48px
  - Text "Your Personal Document Creator": x=48, y=140, White 80%, Regular 24px
  - Feature list: x=48, y=200, White 90%, Regular 18px, line-height=46px
  - Button: x=48, y=560, w=160, h=48, bg=#000000 40%, text=White, Bold 18px, border-radius=8px

Right Section (460-920px):
  - Rectangle: 460,0, 460x680, bg=#FFFFFF
  - Screenshot: x=480, y=40, w=420, h=600, drop-shadow: 0px 8px 24px rgba(0,0,0,0.15)
```

---

### Layout B: Feature Grid

**Composition**:
```
┌───────────────────────────────────────────────────────┐
│  FlashDoc v3.1 - Customizable Quick-Save Workflow     │
│                                                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐         │
│  │  [Icon]   │  │  [Icon]   │  │  [Icon]   │         │
│  │ Customize │  │  Presets  │  │ Shortcuts │         │
│  │  Buttons  │  │           │  │           │         │
│  └───────────┘  └───────────┘  └───────────┘         │
│                                                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐         │
│  │  [Icon]   │  │  [Icon]   │  │  [Icon]   │         │
│  │   15+     │  │  Privacy  │  │   Zero    │         │
│  │  Formats  │  │   First   │  │  Friction │         │
│  └───────────┘  └───────────┘  └───────────┘         │
│                                                       │
│  PDF • Markdown • DOCX • Code • JSON • YAML          │
└───────────────────────────────────────────────────────┘
```

**Specifications**:
- Background: White or light gradient
- Headline: "FlashDoc v3.1 - Customizable Quick-Save Workflow" (36px, Bold, centered)
- 6 feature cards (3x2 grid):
  - Each card: 260x180px
  - Background: White, border: 2px solid #E2E8F0, border-radius: 12px
  - Icon: 64x64px, top-center
  - Text: 20px, Semi-Bold, centered, #2D3748
- Bottom: Format badges (small pills with format names)

---

## Marquee Design (1400x560)

### Layout A: Three-Act Hero

**Composition**:
```
┌─────────────────────────────────────────────────────────────────┐
│  SECTION 1 (400px)    │  SECTION 2 (600px)   │  SECTION 3 (400px) │
│  ─────────────────    │  ──────────────────  │  ───────────────── │
│                       │                      │                    │
│  Tired of             │  [Screenshot/GIF     │  FlashDoc v3.1     │
│  Copy-Paste           │   of quick-save      │                    │
│  Workflow?            │   action]            │  ✓ Customizable    │
│                       │                      │  ✓ Fast            │
│  [Frustrated emoji    │  Select → Click      │  ✓ 15+ Formats     │
│   or icon]            │  → Done              │                    │
│                       │                      │  [Install Button]  │
│                       │                      │                    │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications**:

**Section 1 (Problem)**:
- Background: Light gray (#F7FAFC)
- Text: "Tired of Copy-Paste Workflow?" (32px, Bold, #2D3748)
- Icon: Frustrated emoji or crossed-out clipboard icon (80x80px)

**Section 2 (Solution)**:
- Background: White
- Screenshot or animated GIF: 560x480px (centered)
  - Show text selection → floating buttons → file download
  - Add overlay text: "Select → Click → Done" (28px, Bold, semi-transparent background)
- Subtle drop shadow around screenshot

**Section 3 (CTA)**:
- Background: Gradient (#667eea → #764ba2)
- Text (White):
  - "FlashDoc v3.1" (40px, Bold)
  - Feature bullets (20px, Regular, 80% opacity):
    - ✓ Customizable
    - ✓ Fast
    - ✓ 15+ Formats
- Button: "Install Now" (white background, blue text, 24px, Bold)
  - Border-radius: 8px, padding: 16px 48px

**Figma Template**:
```
Frame: 1400x560
Background: White

Section 1 (0-400px):
  - Rectangle: 0,0, 400x560, bg=#F7FAFC
  - Text "Tired of Copy-Paste Workflow?": x=40, y=180, w=320, #2D3748, Bold 32px, center-align
  - Icon: x=160, y=280, w=80, h=80

Section 2 (400-1000px):
  - Rectangle: 400,0, 600x560, bg=#FFFFFF
  - Screenshot: x=420, y=40, w=560, h=480, drop-shadow: 0px 8px 16px rgba(0,0,0,0.1)
  - Overlay text: x=420, y=460, w=560, center-align, "Select → Click → Done", 28px, Bold

Section 3 (1000-1400px):
  - Rectangle: 1000,0, 400x560, Gradient (180deg, #667eea 0%, #764ba2 100%)
  - Text "FlashDoc v3.1": x=1040, y=100, w=320, White, Bold 40px, center-align
  - Feature list: x=1040, y=160, w=320, White 80%, Regular 20px, line-height=40px
  - Button: x=1120, y=420, w=160, h=56, bg=#FFFFFF, text=#667eea, Bold 24px, border-radius=8px
```

---

### Layout B: Full-Width Screenshot Hero

**Composition**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Full-width screenshot: FlashDoc in action]                   │
│  (Showing webpage with floating buttons overlaid)              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FlashDoc v3.1 - Configure Your Perfect Save Workflow   │  │
│  │  PDF • Markdown • DOCX • Code • JSON • YAML              │  │
│  │  [Install Now Button]                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications**:
- Background: Full-width screenshot (1400x560)
  - Use hero screenshot (webpage with floating buttons)
  - Apply slight blur to background (Gaussian Blur 2px)
  - Add dark overlay (black 40% opacity)
- Overlay panel (bottom-center):
  - Width: 1200px, Height: 120px
  - Background: White, border-radius: 12px, padding: 24px
  - Drop shadow: 0px 8px 24px rgba(0,0,0,0.2)
- Text (centered):
  - Headline: "FlashDoc v3.1 - Configure Your Perfect Save Workflow" (32px, Bold, #2D3748)
  - Formats: "PDF • Markdown • DOCX • Code • JSON • YAML" (18px, Regular, #4A5568)
  - Button: "Install Now" (blue background, white text, 20px, Bold)

---

## Asset Creation Workflow

### Tools

**Design Software**:
- **Figma** (recommended, free for basic use):
  - Web-based, no installation required
  - Easy collaboration
  - Export to PNG/JPEG at any resolution
  - Templates available in Figma Community

- **Canva** (easiest for non-designers):
  - Drag-and-drop interface
  - Pre-made templates
  - Custom dimensions supported
  - Free plan available

- **Adobe Photoshop/Illustrator** (professional):
  - Most powerful, steepest learning curve
  - Best for complex compositions
  - Requires subscription

- **GIMP** (free, open-source):
  - Photoshop alternative
  - Available on Linux/Windows/macOS
  - Full feature set

**Icon Resources**:
- Heroicons (heroicons.com) - Free, MIT license
- Feather Icons (feathericons.com) - Free, MIT license
- Lucide (lucide.dev) - Free, ISC license
- Font Awesome (fontawesome.com) - Free plan available

**Format Icons**:
- Use official logos where available:
  - PDF: Adobe PDF icon (ensure proper licensing)
  - Markdown: Official Markdown mark
  - Python: Python logo (PSF license)
  - JavaScript: JS logo (no official logo, use custom)
- Or create custom icons in brand colors

---

### Step-by-Step: Creating Small Tile in Figma

1. **Create Frame**:
   - File → New → Press `F` (Frame tool)
   - Enter dimensions: 440x280
   - Name frame: "FlashDoc Small Tile"

2. **Add Gradient Background**:
   - Select frame
   - Fill → Linear Gradient
   - Color stops: #667eea (0%) → #764ba2 (100%)
   - Angle: 135 degrees

3. **Import Logo**:
   - Drag `icon128.png` onto canvas
   - Resize to 128x128 (maintain aspect ratio)
   - Position: x=156, y=40 (centered horizontally)

4. **Add Text**:
   - Press `T` (Text tool)
   - Type "FlashDoc v3.1"
   - Font: Inter Bold, 28px
   - Color: White (#FFFFFF)
   - Align: Center (Cmd/Ctrl+T)
   - Position: y=180

5. **Add Subtitle**:
   - Duplicate text (Cmd/Ctrl+D)
   - Edit: "Instant Document Creator"
   - Font: Inter Regular, 16px
   - Opacity: 80%
   - Position: y=210

6. **Add Format Icons**:
   - Create 5 circles (32x32) or import icon SVGs
   - Arrange horizontally with 8px spacing
   - Use Auto Layout (Shift+A) for even spacing
   - Position: y=240, center-align

7. **Export**:
   - Select frame
   - Export settings: PNG, 2x scale (880x560, then scale down for sharpness)
   - Or: PNG, 1x scale (440x280)
   - Click "Export FlashDoc Small Tile"

8. **Optimize**:
   - Upload to TinyPNG.com
   - Download optimized version
   - Verify file size < 5MB (should be < 500KB)

---

### Step-by-Step: Creating Marquee in Canva

1. **Create Custom Size**:
   - Open Canva → "Create a design"
   - "Custom size" → Enter 1400x560 pixels

2. **Add Background**:
   - Elements → Search "gradient"
   - Select blue-purple gradient
   - Resize to cover entire canvas

3. **Upload Screenshot**:
   - Uploads → Upload files → Select hero screenshot
   - Drag onto canvas, resize to fit

4. **Add Overlay Panel**:
   - Elements → Search "rectangle"
   - Drag to bottom-center area
   - Resize to ~1200x120px
   - Set fill: White
   - Add shadow (Effects → Shadow → Drop shadow)

5. **Add Text**:
   - Text → Add heading: "FlashDoc v3.1 - Configure Your Perfect Save Workflow"
   - Font: Inter Bold (or Canva alternative: Montserrat Bold), 32px
   - Color: Dark gray (#2D3748)
   - Center-align

6. **Add Subtitle**:
   - Text → Add subheading: "PDF • Markdown • DOCX • Code • JSON • YAML"
   - Font: Inter Regular, 18px
   - Center-align below headline

7. **Add Button**:
   - Elements → Search "button"
   - Select rounded button style
   - Customize: Blue background, white text, "Install Now"

8. **Download**:
   - Share → Download
   - File type: PNG
   - Quality: High (recommended)
   - Download

9. **Optimize**:
   - Upload to Squoosh.app or TinyPNG.com
   - Compress to < 2MB

---

## Quality Checklist

**Before Finalizing**:
- [ ] All dimensions are exact (440x280, 920x680, 1400x560)
- [ ] Text is readable (no fonts < 14px)
- [ ] Brand colors used consistently
- [ ] Logo is high-resolution (not pixelated)
- [ ] No typos in text
- [ ] File sizes < 5MB (ideally < 1MB each)
- [ ] PNG format (for transparency) or JPEG (if no transparency needed)
- [ ] Images look sharp on Retina displays (test at 2x zoom)

**Design Review**:
- [ ] Visual hierarchy is clear (eye flows naturally)
- [ ] Color contrast meets accessibility standards (4.5:1 for text)
- [ ] Aligns with FlashDoc brand identity
- [ ] Stands out among competitor listings (browse Chrome Web Store for comparison)
- [ ] Call-to-action is prominent

---

## Alternative: AI-Generated Graphics

**Tools**:
- **Midjourney**, **DALL-E 3**, **Stable Diffusion** for concept art
- **Canva AI** for background generation
- **Remove.bg** for background removal

**Prompts**:
```
"Professional Chrome extension promotional banner, blue-purple gradient,
modern minimalist design, technology theme, clean UI, floating save buttons
icon, document formats, 1400x560 pixels, high quality"

"Small tile promotional graphic for document creator app,
clean modern design, blue gradient background, PDF and document icons,
professional tech style, 440x280 pixels"
```

**Note**: Always review AI-generated graphics for brand consistency and quality. Use as starting point, not final deliverable.

---

## File Deliverables

**Final Files**:
```
store-assets/promotional/
├── small-tile.png (440x280, < 500KB)
├── large-tile.png (920x680, < 1MB)
├── marquee.png (1400x560, < 1.5MB)
└── PROMO_GRAPHICS_GUIDE.md (this file)
```

**Source Files** (optional, for future edits):
```
store-assets/promotional/source/
├── small-tile.fig (Figma)
├── large-tile.fig (Figma)
├── marquee.fig (Figma)
└── assets/
    ├── logo.svg
    ├── format-icons/
    └── background-textures/
```

---

## Upload to Chrome Web Store

1. Log in to Chrome Web Store Developer Dashboard
2. Navigate to FlashDoc listing
3. Go to "Store listing" tab
4. Scroll to "Promotional images" section
5. Upload each image:
   - Small Tile (440x280)
   - Large Tile (920x680)
   - Marquee (1400x560)
6. Preview how images appear in different contexts
7. Save changes
8. Submit for review (if required)

---

## Maintenance

**Update Schedule**:
- **Minor versions (3.x)**: Update text only if new features are prominent
- **Major versions (4.0+)**: Full graphics refresh
- **Quarterly review**: Check if graphics still align with current UI/brand

**Performance Tracking**:
- Monitor install conversion rate before/after graphics update
- A/B test different marquee designs if traffic allows
- Analyze which promotional images get the most impressions (Chrome Web Store analytics)

---

**Document Version**: 1.0
**Created**: 2026-02-10
**Last Updated**: 2026-02-10
**Owner**: FlashDoc Development Team
