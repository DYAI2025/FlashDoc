# FlashDoc Chrome Web Store Assets Guidelines

## Overview
This document defines the asset requirements and creation guidelines for the FlashDoc Chrome Web Store listing (v3.1).

## Chrome Web Store Requirements

### Screenshots
- **Format**: PNG or JPEG
- **Dimensions**: 1280x800 or 640x400 pixels (16:10 aspect ratio)
- **Maximum file size**: 5MB per image
- **Quantity**: 1-5 screenshots required
- **Recommended**: 5 screenshots to maximize listing space

### Promotional Images
- **Small Tile**: 440x280 pixels (optional)
- **Large Tile**: 920x680 pixels (optional)
- **Marquee**: 1400x560 pixels (optional)
- **Format**: PNG or JPEG

### Promotional Video
- **Platform**: YouTube or Vimeo hosted
- **Duration**: 30-60 seconds recommended
- **Content**: Feature showcase, UI demonstration

## v3.1 Feature Priorities

### Primary Features to Showcase
1. **Customizable Quick-Save Slots** (NEW in v3.1)
   - 5 configurable buttons
   - Format selection per slot
   - Instant updates across extension

2. **Slot Presets** (NEW in v3.1)
   - Multiple button layout configurations
   - Quick switching between workflows
   - Up to 5 saved presets

3. **Expanded Shortcuts** (NEW in v3.1)
   - 10 category shortcuts (up from 5)
   - One-click organized saving

4. **Format Override** (v3.0 feature, still prominent)
   - Dropdown selection before saving
   - Smart format detection with manual override

5. **Corner Ball** (v2.1 feature, visually distinctive)
   - Draggable screen corner icon
   - Pin functionality
   - Quick access menu

## Screenshot Plan (5 screenshots)

### Screenshot 1: Hero Shot - Quick Save in Action
**Purpose**: Show the core value proposition
**Scene**:
- Browser showing an article or code snippet
- Text selected with floating save buttons visible
- 5 customizable slot buttons prominently displayed
- Clean, professional webpage background

**Annotations**:
- Arrow pointing to floating buttons: "Select text → Instant save"
- Highlight: "5 customizable buttons"
- Badge: "v3.1 - Fully Configurable"

**Technical Setup**:
- Open demo page with readable content
- Select 2-3 paragraphs of text
- Trigger floating button menu
- Ensure all 5 buttons are configured with different formats
- Screenshot at 1280x800

---

### Screenshot 2: Slot Configuration Interface
**Purpose**: Demonstrate the customization power
**Scene**:
- Options page showing "Quick-Save Slots Configuration" section
- All 5 slots visible with dropdown selectors
- Mix of formats and shortcuts assigned
- Clean UI with labels

**Annotations**:
- Headline: "Configure Your Perfect Workflow"
- Arrow: "Each button = Your choice"
- Callout: "Formats, Shortcuts, or Disabled"

**Technical Setup**:
- Navigate to chrome-extension://[id]/options.html
- Scroll to "Quick-Save Slots" section
- Configure example slots:
  - Slot 1: Markdown
  - Slot 2: PDF
  - Slot 3: Custom Shortcut "Meeting Notes"
  - Slot 4: JavaScript
  - Slot 5: Disabled
- Screenshot at 1280x800

---

### Screenshot 3: Slot Presets
**Purpose**: Show the preset system for workflow switching
**Scene**:
- Options page showing "Slot Presets" section
- Multiple preset cards visible
- Preset names: "Writing", "Coding", "Research", "Documentation"
- Active preset highlighted

**Annotations**:
- Headline: "Switch Workflows Instantly"
- Badge: "Up to 5 Presets"
- Arrow: "One-click layout change"

**Technical Setup**:
- Navigate to options page Presets section
- Create 4 example presets with descriptive names
- Show preset cards with save/activate/delete buttons
- Screenshot at 1280x800

---

### Screenshot 4: Expanded Category Shortcuts
**Purpose**: Highlight the 10-shortcut capacity
**Scene**:
- Options page showing "Category Shortcuts" section
- 10 shortcut rows visible (or scrollable view showing 7-8)
- Examples like:
  - "Meeting Notes" + .md
  - "Code Review" + .txt
  - "Design Specs" + .pdf
  - "Bug Reports" + .md
  - "API Docs" + .md

**Annotations**:
- Headline: "10 Quick-Save Categories"
- Badge: "Doubled from v3.0"
- Callout: "Organize by project, type, or workflow"

**Technical Setup**:
- Navigate to options page shortcuts section
- Fill in 8-10 example shortcuts with realistic names
- Screenshot showing the full list
- Screenshot at 1280x800

---

### Screenshot 5: Format Override + Corner Ball
**Purpose**: Show additional power features
**Scene**:
- Split-screen or dual-feature layout:
  - Left: Floating button with format override dropdown open
  - Right: Corner ball UI element with menu expanded

**Annotations**:
- Left side: "Override Format Anytime"
- Right side: "Always-Accessible Corner Ball"
- Bottom banner: "Plus: PDF, DOCX, Markdown, Code, JSON, YAML, CSV, and more"

**Technical Setup**:
- Left: Select text, click floating button to show dropdown
- Right: Activate corner ball, show popup menu
- Combine screenshots or use side-by-side layout
- Screenshot at 1280x800

---

## Screenshot Creation Checklist

### Before Screenshots
- [ ] Update manifest.json version to 3.1
- [ ] Load extension in Chrome (Developer Mode)
- [ ] Prepare clean browser profile (no extra extensions visible)
- [ ] Set browser zoom to 100%
- [ ] Use professional demo content (lorem ipsum, code samples, articles)

### During Screenshots
- [ ] Use consistent browser theme (light mode recommended)
- [ ] Hide browser bookmarks bar for cleaner UI
- [ ] Capture at exact 1280x800 resolution
- [ ] Ensure all text is readable (no tiny fonts)
- [ ] Check for typos in UI or annotations

### Post-Processing
- [ ] Add subtle drop shadows to floating elements for depth
- [ ] Add annotation overlays (arrows, callouts, badges)
- [ ] Use consistent color scheme for annotations
  - Primary: #4A90E2 (blue)
  - Accent: #7ED321 (green)
  - Text: #4A4A4A (dark gray)
- [ ] Compress images to < 2MB without quality loss
- [ ] Export as PNG for transparency support

### Tools Recommended
- **Screenshot Capture**: Chrome DevTools Device Mode or OS screenshot tools
- **Annotation**: Figma, Sketch, Photoshop, or web-based tools (Canva, Photopea)
- **Compression**: TinyPNG, Squoosh.app

---

## Promotional Graphics

### Small Tile (440x280)
**Design**:
- FlashDoc logo centered
- Tagline: "Instant Document Creator"
- Gradient background: #667eea → #764ba2

**Elements**:
- Logo: 120x120px in center
- Text: "FlashDoc" in bold 32px
- Subtext: "Select → Save → Done" in 18px
- Icon row: PDF, MD, DOCX, Code file icons

---

### Large Tile (920x680)
**Design**:
- Split layout: Left = Feature bullets, Right = UI mockup
- Background: Gradient with subtle geometric pattern

**Left Side (400px width)**:
- "FlashDoc v3.1" headline
- Bullet list:
  - ⚙️ Customizable Save Buttons
  - 🎯 Workflow Presets
  - ⚡ 10 Category Shortcuts
  - 📄 PDF, Markdown, Code & More

**Right Side (520px width)**:
- Mockup of floating save buttons over document
- Or: Screenshot of slot configuration UI

---

### Marquee (1400x560)
**Design**:
- Wide hero banner
- Three-section layout: Problem → Solution → Call-to-Action

**Layout**:
- Left (400px): "Tired of Copy-Paste Workflow?"
- Center (600px): Animated GIF or screenshot of quick-save in action
- Right (400px): "Install FlashDoc" + feature badges

**Alternative Design**:
- Full-width screenshot of extension in use
- Overlay text: "FlashDoc v3.1 - Configure Your Perfect Save Workflow"
- Bottom bar: Format icons + "Install Now" button mockup

---

## Video Storyboard (30 seconds)

### Act 1: Problem (0-7s)
**Scene**: User manually copying text from webpage to text editor
- Frustrated facial expression (stock footage)
- Multiple clicks and keyboard shortcuts visible
- Text: "Tired of copy-paste-save?"

**Voiceover**: "Saving snippets from the web shouldn't be this tedious."

---

### Act 2: Solution Introduction (8-15s)
**Scene**: FlashDoc logo animation → Browser with extension active
- Select text on professional webpage
- Floating buttons appear with smooth animation
- Click one button → File downloads instantly
- Text: "Meet FlashDoc"

**Voiceover**: "FlashDoc turns any selected text into instant downloads. No copy, no paste, no hassle."

---

### Act 3: Feature Showcase (16-26s)
**Scene**: Rapid feature montage (2-3 seconds each)

**Clip 1**: Slot configuration interface
- Text: "Customize Your Buttons"
- Show dropdown selections changing

**Clip 2**: Preset switching
- Text: "Switch Workflows Instantly"
- Click preset → buttons reconfigure

**Clip 3**: Format variety
- Quick cuts of saving as: PDF, Markdown, DOCX, Python, JSON
- Icons fly in for each format

**Clip 4**: Corner ball feature
- Drag corner ball around screen
- Pin it in place
- Text: "Always Accessible"

**Voiceover**: "Customize five quick-save buttons. Switch between presets for different workflows. Supports PDF, Markdown, code, and 15 more formats."

---

### Act 4: Call to Action (27-30s)
**Scene**: FlashDoc logo + Chrome Web Store badge
- Text: "FlashDoc v3.1"
- Text: "Free • Open Source • Zero Friction"
- Chrome Web Store button pulses

**Voiceover**: "Install FlashDoc today. Free, open source, and zero friction."

---

### Video Technical Specs
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30fps minimum, 60fps preferred
- **Format**: MP4 (H.264 codec)
- **Audio**: Music bed (royalty-free) at 20% volume under voiceover
- **Captions**: Embedded subtitles for accessibility
- **Branding**: Consistent color scheme (blue/purple gradient)

### Production Tools
- **Screen Recording**: OBS Studio, ScreenFlow, Camtasia
- **Video Editing**: DaVinci Resolve (free), Adobe Premiere, Final Cut Pro
- **Animation**: After Effects, Motion, Blender (for logo animation)
- **Stock Assets**: Envato Elements, Storyblocks (for problem scene)
- **Music**: Epidemic Sound, Artlist, YouTube Audio Library

---

## Store Listing Text Optimization

### Current Description
```
⚡ Select → Save → Done. Instant file creation from any text.
PDF, Markdown, Code, YAML - all formats, zero friction.
```

**Issues**:
- Doesn't highlight v3.1 customization features
- Too generic
- Doesn't differentiate from competitors

---

### Optimized Description (Option A: Feature-Forward)
```
⚙️ Customize your perfect save workflow. FlashDoc v3.1 lets you configure
five quick-save buttons with any format or shortcut. Create presets for
writing, coding, research - switch instantly. Select text → Click button →
Done. Supports PDF, Markdown, DOCX, code (15+ formats), zero friction.
```

**Length**: 289 characters (under 450 limit)
**Keywords**: customize, workflow, presets, quick-save, formats
**Value Prop**: Customization + Speed + Format variety

---

### Optimized Description (Option B: Problem-Solution)
```
Stop copy-pasting! FlashDoc turns any selected text into instant downloads.
Configure 5 quick-save buttons to match your workflow. Need PDF meeting
notes? One click. Code snippet to .py file? One click. Create presets for
different projects. 15+ formats including PDF, Markdown, DOCX, JSON, YAML,
and all major code languages. Zero friction document creation.
```

**Length**: 389 characters
**Keywords**: workflow, quick-save, PDF, Markdown, code, formats
**Value Prop**: Solves pain point + Customization + Speed

---

### Optimized Description (Option C: Benefit-Driven)
```
⚡ Your personal document creator. Select text → Save in any format → Done.
FlashDoc v3.1 gives you 5 customizable quick-save buttons that adapt to
your workflow. Writing? PDF + Markdown. Coding? Python + JSON. Research?
TXT + DOCX. Create presets, switch instantly. Supports 15+ formats. Free,
fast, zero friction.
```

**Length**: 333 characters
**Keywords**: customizable, workflow, formats, presets, fast
**Value Prop**: Personal adaptation + Speed + Simplicity

---

### Recommended: Option C
**Reasoning**:
- Starts with emotional benefit ("Your personal")
- Clear workflow explanation
- Concrete use-case examples
- Highlights v3.1 customization
- Ends with trust signals (free, fast)

---

## A/B Test Variations

### Test 1: Description Emphasis
- **Variant A**: Customization-first (Option A)
- **Variant B**: Problem-solution (Option B)
- **Variant C**: Benefit-driven (Option C)
- **Metric**: Install conversion rate
- **Duration**: 2 weeks per variant

### Test 2: Screenshot Order
- **Variant A**: Current planned order (Hero → Config → Presets → Shortcuts → Override)
- **Variant B**: Feature-first order (Config → Presets → Hero → Shortcuts → Override)
- **Metric**: User engagement (time on listing page)
- **Duration**: 2 weeks per variant

### Test 3: Promotional Image Style
- **Variant A**: Minimal/clean design (logo + icons)
- **Variant B**: UI-heavy design (screenshot-based)
- **Metric**: Click-through rate on Web Store search
- **Duration**: 2 weeks per variant

---

## Next Steps

### Immediate Actions
1. Update manifest.json to version 3.1
2. Create screenshot capture plan document
3. Set up clean Chrome profile for screenshots
4. Prepare demo content pages

### Production Phase
1. Capture 5 screenshots per guidelines
2. Annotate screenshots in design tool
3. Create 3 promotional graphics
4. Record video following storyboard
5. Edit video with music and captions

### Upload & Testing
1. Upload all assets to Chrome Web Store Developer Dashboard
2. Implement description Option C
3. Publish listing update
4. Set up A/B test tracking (if supported by Chrome Web Store)

### Documentation
1. Archive old assets (if any) in `store-assets/archive/`
2. Document asset creation process for future updates
3. Create `STORE_LISTING.md` with finalized copy

---

## Asset Checklist

### Screenshots
- [ ] Screenshot 1: Hero Shot - Quick Save in Action
- [ ] Screenshot 2: Slot Configuration Interface
- [ ] Screenshot 3: Slot Presets
- [ ] Screenshot 4: Expanded Category Shortcuts
- [ ] Screenshot 5: Format Override + Corner Ball

### Promotional Graphics
- [ ] Small Tile (440x280)
- [ ] Large Tile (920x680)
- [ ] Marquee (1400x560)

### Video
- [ ] Storyboard approved
- [ ] Screen recordings captured
- [ ] Voiceover recorded
- [ ] Video edited and exported
- [ ] Uploaded to YouTube

### Listing Copy
- [ ] Description optimized
- [ ] Keywords researched
- [ ] A/B test variants prepared

### Technical
- [ ] Manifest version updated to 3.1
- [ ] Extension tested with latest Chrome version
- [ ] Privacy policy reviewed
- [ ] Developer dashboard access confirmed

---

## Resources

### Design Assets
- FlashDoc icon: `icon128.png` (use as logo base)
- Color scheme: Extract from existing UI (blues, purples)
- Font: Use system fonts (Segoe UI, San Francisco) for screenshots

### Demo Content Sources
- Lorem ipsum generators: lipsum.com
- Code samples: GitHub public repos
- Professional articles: Medium, Dev.to (public domain)

### Stock Resources (Royalty-Free)
- Icons: Heroicons, Feather Icons, Lucide
- Images: Unsplash, Pexels
- Music: YouTube Audio Library, Free Music Archive

### Tools
- Screenshot: Flameshot (Linux), Snagit, Chrome DevTools
- Design: Figma (free), Photopea (web-based)
- Video: OBS Studio (free), Kdenlive (free)
- Compression: Squoosh.app, TinyPNG

---

## Maintenance Plan

### Quarterly Review
- Update screenshots if UI changes significantly
- Refresh video if feature set expands
- Review description keywords for SEO optimization

### Version Updates
- Minor versions (3.x): Update description text only
- Major versions (4.0+): Full asset refresh required

### Performance Monitoring
- Track install conversion rate via Chrome Web Store analytics
- Monitor user reviews for feature confusion (screenshot clarity)
- A/B test results documentation

---

**Document Version**: 1.0
**Created**: 2026-02-10
**Last Updated**: 2026-02-10
**Owner**: FlashDoc Development Team
