// FlashDoc Service Worker
// Core download and file management logic

// Import libraries for PDF and DOCX generation
importScripts('./lib/jspdf.umd.min.js');
importScripts('./lib/docx.umd.min.js');

// Shared detection helpers (also used in content script and tests)
try {
  importScripts('detection-utils.js');
} catch (error) {
  console.warn('Detection helpers unavailable in service worker:', error);
}

// ============================================================================
// FORMATTING ENGINE v2 - Foundation Layer
// Fixes: Bug #1 (Bold/Italic), #3 (Order), #5 (Entities), #6 (Nested Lists)
// ============================================================================

/**
 * EntityDecoder - Decodes HTML entities to Unicode characters
 * FIX for Bug #5: Vollständiger Entity-Decoder
 * @example EntityDecoder.decode('&amp;&mdash;&#8364;') → '&—€'
 */
const EntityDecoder = (function() {
  // Named entity map - using Unicode escape sequences to avoid parsing issues
  const NAMED_ENTITIES = {
    // Core entities (XML)
    'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'",
    // Whitespace
    'nbsp': '\u00A0', 'ensp': '\u2002', 'emsp': '\u2003', 'thinsp': '\u2009',
    // Dashes and punctuation
    'mdash': '\u2014', 'ndash': '\u2013', 'minus': '\u2212',
    'hellip': '\u2026', 'bull': '\u2022', 'middot': '\u00B7',
    'lsquo': '\u2018', 'rsquo': '\u2019', 'ldquo': '\u201C', 'rdquo': '\u201D',
    'laquo': '\u00AB', 'raquo': '\u00BB', 'prime': '\u2032', 'Prime': '\u2033',
    // Currency
    'euro': '\u20AC', 'pound': '\u00A3', 'yen': '\u00A5', 'cent': '\u00A2', 'curren': '\u00A4',
    // Legal/IP
    'copy': '\u00A9', 'reg': '\u00AE', 'trade': '\u2122',
    // Math symbols
    'times': '\u00D7', 'divide': '\u00F7', 'plusmn': '\u00B1',
    'frac12': '\u00BD', 'frac14': '\u00BC', 'frac34': '\u00BE',
    'deg': '\u00B0', 'sup2': '\u00B2', 'sup3': '\u00B3',
    // Arrows
    'larr': '\u2190', 'rarr': '\u2192', 'uarr': '\u2191', 'darr': '\u2193',
    // Greek letters (common)
    'alpha': '\u03B1', 'beta': '\u03B2', 'gamma': '\u03B3', 'delta': '\u03B4',
    'pi': '\u03C0', 'sigma': '\u03C3', 'omega': '\u03C9',
    // Accented characters (common)
    'agrave': '\u00E0', 'aacute': '\u00E1', 'acirc': '\u00E2', 'atilde': '\u00E3', 'auml': '\u00E4',
    'egrave': '\u00E8', 'eacute': '\u00E9', 'ecirc': '\u00EA', 'euml': '\u00EB',
    'igrave': '\u00EC', 'iacute': '\u00ED', 'icirc': '\u00EE', 'iuml': '\u00EF',
    'ograve': '\u00F2', 'oacute': '\u00F3', 'ocirc': '\u00F4', 'otilde': '\u00F5', 'ouml': '\u00F6',
    'ugrave': '\u00F9', 'uacute': '\u00FA', 'ucirc': '\u00FB', 'uuml': '\u00FC',
    'Agrave': '\u00C0', 'Aacute': '\u00C1', 'Acirc': '\u00C2', 'Atilde': '\u00C3', 'Auml': '\u00C4',
    'Egrave': '\u00C8', 'Eacute': '\u00C9', 'Ecirc': '\u00CA', 'Euml': '\u00CB',
    'Igrave': '\u00CC', 'Iacute': '\u00CD', 'Icirc': '\u00CE', 'Iuml': '\u00CF',
    'Ograve': '\u00D2', 'Oacute': '\u00D3', 'Ocirc': '\u00D4', 'Otilde': '\u00D5', 'Ouml': '\u00D6',
    'Ugrave': '\u00D9', 'Uacute': '\u00DA', 'Ucirc': '\u00DB', 'Uuml': '\u00DC',
    'ntilde': '\u00F1', 'Ntilde': '\u00D1', 'ccedil': '\u00E7', 'Ccedil': '\u00C7',
    'szlig': '\u00DF'
  };

  /**
   * Decode all HTML entities in a string
   * @param {string} str - Input string with entities
   * @returns {string} - Decoded string
   */
  function decode(str) {
    if (!str || typeof str !== 'string') return str || '';
    
    return str
      // Named entities: &name;
      .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name) => {
        return NAMED_ENTITIES[name] || match;
      })
      // Decimal numeric: &#1234;
      .replace(/&#(\d+);/g, (match, code) => {
        const num = parseInt(code, 10);
        return num > 0 && num < 0x110000 ? String.fromCodePoint(num) : match;
      })
      // Hexadecimal numeric: &#x1A2B;
      .replace(/&#[xX]([0-9a-fA-F]+);/g, (match, hex) => {
        const num = parseInt(hex, 16);
        return num > 0 && num < 0x110000 ? String.fromCodePoint(num) : match;
      });
  }

  return { decode, NAMED_ENTITIES };
})();

/**
 * HtmlTokenizer - Converts HTML string into ordered token stream
 * FIX for Bug #3: Dokumentreihenfolge erhalten durch Single-Pass Tokenization
 * @example HtmlTokenizer.tokenize('<p><strong>bold</strong></p>')
 *          → [open:p, open:strong, text:"bold", close:strong, close:p]
 */
const HtmlTokenizer = (function() {
  // Self-closing tags that don't require close token
  const SELF_CLOSING = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);

  /**
   * Parse attribute string into object
   * @param {string} attrString - e.g. 'href="url" class="cls"'
   * @returns {Object} - {href: 'url', class: 'cls'}
   */
  function parseAttributes(attrString) {
    const attrs = {};
    if (!attrString) return attrs;
    
    // Match: name="value" or name='value' or name=value
    const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match;
    
    while ((match = attrPattern.exec(attrString)) !== null) {
      const name = match[1].toLowerCase();
      const value = match[2] ?? match[3] ?? match[4] ?? '';
      attrs[name] = EntityDecoder.decode(value);
    }
    
    return attrs;
  }

  /**
   * Tokenize HTML string into ordered array of tokens
   * Preserves exact document order (critical for Bug #3 fix)
   * @param {string} html - HTML string to tokenize
   * @returns {Array<{type:string, tag?:string, content?:string, attrs?:Object}>}
   */
  function tokenize(html) {
    if (!html || typeof html !== 'string') return [];
    
    const tokens = [];
    // Pattern matches: <tag attrs>, </tag>, <tag/>, or <tag ... />
    const tagPattern = /<(\/?)(\w+)([^>]*?)(\/?)>/g;
    let lastIndex = 0;
    let match;

    while ((match = tagPattern.exec(html)) !== null) {
      // 1. Capture text BEFORE this tag (preserves order)
      if (match.index > lastIndex) {
        const textContent = html.slice(lastIndex, match.index);
        // Keep ALL text including single spaces between inline tags
        // (e.g. "<strong>Hello</strong> <em>World</em>" must keep the space)
        if (textContent.length > 0) {
          tokens.push({
            type: 'text',
            content: EntityDecoder.decode(textContent)
          });
        }
      }

      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();
      const attrString = match[3].trim();
      const isSelfClosingSlash = match[4] === '/';

      if (isClosing) {
        // Close tag: </tag>
        tokens.push({ type: 'close', tag: tagName });
      } else {
        // Open tag: <tag attrs>
        const token = {
          type: 'open',
          tag: tagName,
          attrs: parseAttributes(attrString)
        };
        tokens.push(token);

        // Self-closing: <br/> or <br /> or naturally self-closing tags
        if (isSelfClosingSlash || SELF_CLOSING.has(tagName)) {
          // Don't push close for self-closing, they're handled implicitly
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // 2. Capture remaining text after last tag
    if (lastIndex < html.length) {
      const remaining = html.slice(lastIndex);
      if (remaining.length > 0) {
        tokens.push({
          type: 'text',
          content: EntityDecoder.decode(remaining)
        });
      }
    }

    return tokens;
  }

  return { tokenize, parseAttributes };
})();

/**
 * BlockBuilder - Converts token stream into structured document blocks
 * FIX for Bug #1: Bold/Italic via Format-Stack
 * FIX for Bug #6: Nested Lists via Level-Tracking
 * FIX for Bug #7: Context-basierte List-Counter
 */
const BlockBuilder = (function() {
  // Block-level tags that create new blocks
  const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div', 'blockquote', 'pre', 'tr']);
  
  // Inline formatting tags → property name
  const INLINE_FORMAT_MAP = {
    'strong': 'bold', 'b': 'bold',
    'em': 'italic', 'i': 'italic',
    'u': 'underline',
    's': 'strikethrough', 'strike': 'strikethrough', 'del': 'strikethrough',
    'code': 'code', 'kbd': 'code', 'samp': 'code',
    'sub': 'subscript', 'sup': 'superscript'
  };

  // List container tags
  const LIST_CONTAINERS = new Set(['ul', 'ol']);

  /**
   * Parse CSS style attribute for formatting
   * @param {string} styleAttr - e.g. "font-weight: bold; font-style: italic"
   * @returns {Array<string>} - Array of format properties: ['bold', 'italic']
   */
  function parseStyleAttribute(styleAttr) {
    const formats = [];
    if (!styleAttr) return formats;
    
    const style = styleAttr.toLowerCase();
    
    // Bold detection: font-weight: bold/700/800/900
    if (/font-weight\s*:\s*(bold|[7-9]00)/.test(style)) {
      formats.push('bold');
    }
    
    // Italic detection: font-style: italic/oblique
    if (/font-style\s*:\s*(italic|oblique)/.test(style)) {
      formats.push('italic');
    }
    
    // Underline detection: text-decoration contains underline
    if (/text-decoration[^:]*:\s*[^;]*underline/.test(style)) {
      formats.push('underline');
    }
    
    // Strikethrough detection: text-decoration contains line-through
    if (/text-decoration[^:]*:\s*[^;]*line-through/.test(style)) {
      formats.push('strikethrough');
    }
    
    // Monospace/code detection: font-family contains mono/courier/consolas
    if (/font-family\s*:\s*[^;]*(mono|courier|consolas|menlo)/i.test(style)) {
      formats.push('code');
    }
    
    return formats;
  }

  /**
   * Build structured blocks from token stream
   * @param {Array} tokens - From HtmlTokenizer.tokenize()
   * @returns {Array<{type:string, runs:Array, level?:number, listType?:string, listLevel?:number, listIndex?:number}>}
   */
  function build(tokens) {
    if (!tokens || !Array.isArray(tokens)) return [];

    const blocks = [];
    const formatStack = [];  // Active inline formats: [{tag:'strong', prop:'bold'}, ...]
    const listStack = [];    // List nesting: [{type:'bullet'|'ordered', index:-1}, ...]
    
    let currentBlock = null;

    /**
     * Get current format state from stack
     */
    function getFormatState() {
      const state = { bold: false, italic: false, underline: false, strikethrough: false, code: false };
      for (const format of formatStack) {
        if (format.prop) state[format.prop] = true;
        // Handle CSS-derived formats (array of props)
        if (format.cssFormats) {
          for (const prop of format.cssFormats) {
            state[prop] = true;
          }
        }
      }
      return state;
    }

    /**
     * Ensure we have a current block to add runs to
     */
    function ensureBlock() {
      if (!currentBlock) {
        currentBlock = { type: 'paragraph', runs: [] };
        blocks.push(currentBlock);
      }
      return currentBlock;
    }

    /**
     * Finalize current block and start fresh
     */
    function finalizeBlock() {
      if (currentBlock && currentBlock.runs.length > 0) {
        // Merge consecutive runs with identical formatting to reduce fragments
        const merged = [];
        for (const run of currentBlock.runs) {
          const last = merged[merged.length - 1];
          if (last &&
              last.bold === run.bold &&
              last.italic === run.italic &&
              last.underline === run.underline &&
              last.strikethrough === run.strikethrough &&
              last.code === run.code) {
            last.text += run.text;
          } else {
            merged.push({ ...run });
          }
        }
        currentBlock.runs = merged;

        // Only trim leading/trailing runs that are purely whitespace
        // (but preserve single spaces between inline elements)
        while (currentBlock.runs.length > 0 &&
               currentBlock.runs[0].text.length > 0 &&
               !currentBlock.runs[0].text.trim() &&
               currentBlock.runs.length > 1) {
          // Only remove leading whitespace if there's other content
          currentBlock.runs.shift();
        }
        while (currentBlock.runs.length > 0 &&
               currentBlock.runs[currentBlock.runs.length - 1].text.length > 0 &&
               !currentBlock.runs[currentBlock.runs.length - 1].text.trim() &&
               currentBlock.runs.length > 1) {
          currentBlock.runs.pop();
        }

        // Trim leading whitespace in first run and trailing in last
        if (currentBlock.runs.length > 0) {
          currentBlock.runs[0].text = currentBlock.runs[0].text.replace(/^\s+/, '');
          const lastRun = currentBlock.runs[currentBlock.runs.length - 1];
          lastRun.text = lastRun.text.replace(/\s+$/, '');
        }
      }
      currentBlock = null;
    }

    // Process each token in order (preserving document order!)
    for (const token of tokens) {
      if (token.type === 'open') {
        const tag = token.tag;
        const attrs = token.attrs || {};

        // Check for CSS style formatting on ANY tag
        const cssFormats = parseStyleAttribute(attrs.style);

        // List containers - push to stack
        if (tag === 'ul') {
          listStack.push({ type: 'bullet', index: -1 });
        } else if (tag === 'ol') {
          listStack.push({ type: 'ordered', index: -1 });
        }
        // List items - create new block
        else if (tag === 'li') {
          finalizeBlock();
          const listCtx = listStack[listStack.length - 1] || { type: 'bullet', index: -1 };
          listCtx.index++;
          
          currentBlock = {
            type: 'list-item',
            listType: listCtx.type,
            listLevel: listStack.length - 1,
            listIndex: listCtx.index,
            runs: []
          };
          blocks.push(currentBlock);
        }
        // Headings
        else if (/^h([1-6])$/.test(tag)) {
          finalizeBlock();
          const level = parseInt(tag.charAt(1), 10);
          currentBlock = {
            type: 'heading',
            level: level,
            runs: []
          };
          blocks.push(currentBlock);
        }
        // Paragraphs and other block elements
        else if (BLOCK_TAGS.has(tag)) {
          finalizeBlock();
          currentBlock = { type: 'paragraph', runs: [] };
          blocks.push(currentBlock);
        }
        
        // Inline formatting - push to format stack (FIX for Bug #1!)
        // Either from semantic tags OR CSS styles
        if (INLINE_FORMAT_MAP[tag]) {
          formatStack.push({ tag: tag, prop: INLINE_FORMAT_MAP[tag] });
        } else if (cssFormats.length > 0) {
          // CSS-based formatting (span, div with style)
          formatStack.push({ tag: tag, cssFormats: cssFormats, isStyled: true });
        }
        
        // Horizontal rule - create a separator block
        if (tag === 'hr') {
          finalizeBlock();
          currentBlock = { type: 'horizontal-rule', runs: [{ text: '---' }] };
          blocks.push(currentBlock);
          finalizeBlock();
        }
        // Links - store href for potential use
        else if (tag === 'a') {
          formatStack.push({ tag: 'a', href: attrs.href || '' });
        }
        // Line breaks
        else if (tag === 'br') {
          ensureBlock();
          const state = getFormatState();
          currentBlock.runs.push({ text: '\n', ...state });
        }
      }
      else if (token.type === 'close') {
        const tag = token.tag;

        // List container closes
        if (LIST_CONTAINERS.has(tag)) {
          listStack.pop();
          if (listStack.length === 0) {
            finalizeBlock(); // Exit list context
          }
        }
        // Block element closes
        else if (tag === 'li' || /^h[1-6]$/.test(tag) || BLOCK_TAGS.has(tag)) {
          finalizeBlock();
        }
        // Inline format closes - pop from stack (FIX for Bug #1!)
        // Also handle CSS-styled spans/divs that were pushed to formatStack
        if (INLINE_FORMAT_MAP[tag] || tag === 'a') {
          for (let i = formatStack.length - 1; i >= 0; i--) {
            if (formatStack[i].tag === tag) {
              formatStack.splice(i, 1);
              break;
            }
          }
        } else {
          // Check if this closing tag has a matching CSS-styled entry in formatStack
          for (let i = formatStack.length - 1; i >= 0; i--) {
            if (formatStack[i].tag === tag && formatStack[i].isStyled) {
              formatStack.splice(i, 1);
              break;
            }
          }
        }
      }
      else if (token.type === 'text') {
        const text = token.content;
        if (!text) continue;

        ensureBlock();
        const state = getFormatState();
        
        // Add text run with current format state
        currentBlock.runs.push({
          text: text,
          bold: state.bold,
          italic: state.italic,
          underline: state.underline,
          strikethrough: state.strikethrough,
          code: state.code
        });
      }
    }

    // Finalize any remaining block
    finalizeBlock();

    // Clean up empty blocks (preserve horizontal rules)
    return blocks.filter(block =>
      block.type === 'horizontal-rule' ||
      (block.runs && block.runs.length > 0 &&
      block.runs.some(run => run.text && run.text.trim()))
    );
  }

  return { build };
})();

console.log('⚡ FlashDoc Formatting Engine v2 loaded');

// ============================================================================
// BATCH 2: DOCX Renderer Layer
// FIX for Bug #2: Echte DOCX Listen mit numbering config
// ============================================================================

/**
 * DocxRenderer - Creates properly formatted DOCX elements
 * Uses docx.js library with real Word formatting
 */
const DocxRenderer = (function() {
  /**
   * Create a TextRun with proper formatting from a run object
   * @param {Object} run - {text, bold, italic, underline, strikethrough, code}
   * @param {number} fontSize - Size in half-points (11pt = 22)
   * @returns {Object} - docx.TextRun configuration
   */
  function createTextRun(run, fontSize = 22) {
    const config = {
      text: run.text || '',
      font: run.code ? 'Courier New' : 'Calibri',
      size: fontSize,
      bold: Boolean(run.bold),
      italics: Boolean(run.italic)
    };
    
    if (run.underline) {
      config.underline = { type: 'single' };
    }
    if (run.strikethrough) {
      config.strike = true;
    }
    
    return config;
  }

  /**
   * Create numbering configuration for Word lists
   * FIX for Bug #2: Real Word numbering instead of Unicode bullets
   * @returns {Object} - Numbering configuration for docx.Document
   */
  function createNumberingConfig() {
    return {
      config: [
        // Bullet list configuration (3 levels)
        {
          reference: 'bullet-list',
          levels: [
            { level: 0, format: 'bullet', text: '•', alignment: 'left', style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: 'bullet', text: '○', alignment: 'left', style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: 'bullet', text: '▪', alignment: 'left', style: { paragraph: { indent: { left: 2160, hanging: 360 } } } }
          ]
        },
        // Ordered list configuration (3 levels)
        {
          reference: 'ordered-list',
          levels: [
            { level: 0, format: 'decimal', text: '%1.', alignment: 'left', style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: 'lowerLetter', text: '%2)', alignment: 'left', style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
            { level: 2, format: 'lowerRoman', text: '%3.', alignment: 'left', style: { paragraph: { indent: { left: 2160, hanging: 360 } } } }
          ]
        }
      ]
    };
  }

  return { createTextRun, createNumberingConfig };
})();

// ============================================================================
// BATCH 3: PDF Renderer Layer
// FIX for Bug #4: Korrekte Ordered-List Nummerierung
// FIX for Bug #7: Context-basierte Counter (separate per list)
// ============================================================================

/**
 * PdfListContext - Manages list counters for PDF rendering
 * FIX for Bug #4: PDF zeigt "1. 2. 3." statt "•."
 * FIX for Bug #7: Zweite <ol> startet bei 1 (nicht fortlaufend)
 */
const PdfListContext = (function() {
  let counters = {};      // Counter per level: {'ordered-0': 1, 'ordered-1': 1, ...}
  let lastListType = null;
  let lastListLevel = -1;
  let inListContext = false;

  /**
   * Reset all counters (call at start of new document)
   */
  function reset() {
    counters = {};
    lastListType = null;
    lastListLevel = -1;
    inListContext = false;
  }

  /**
   * Get prefix for a block (bullet or number)
   * @param {Object} block - Block with type, listType, listLevel, listIndex
   * @returns {string|null} - Prefix like "• " or "1. " or null for non-list
   */
  function getPrefix(block) {
    // Non-list block exits list context
    if (block.type !== 'list-item') {
      if (inListContext) {
        reset();
      }
      return null;
    }

    inListContext = true;
    const level = block.listLevel || 0;
    const type = block.listType || 'bullet';
    const key = `${type}-${level}`;

    // Detect NEW list (different type at same level, or first item at level 0)
    const isNewList = 
      (block.listIndex === 0 && level === 0) ||
      (type !== lastListType && level === 0);

    if (isNewList) {
      // Reset counters for new list
      counters = {};
    }

    // Ordered list: increment and return number
    if (type === 'ordered') {
      counters[key] = (counters[key] || 0) + 1;
      lastListType = type;
      lastListLevel = level;
      return `${counters[key]}. `;
    }

    // Bullet list: return appropriate bullet for level
    // Use WinAnsiEncoding-safe characters for PDF compatibility
    const bullets = ['\u2022', '-', '*'];  // • (WinAnsi), -, *
    const bulletIndex = Math.min(level, bullets.length - 1);
    lastListType = type;
    lastListLevel = level;
    return `${bullets[bulletIndex]} `;
  }

  return { getPrefix, reset };
})();

/**
 * PdfRenderer - Renders formatted runs to jsPDF
 * FIX for Bug #1: Bold/Italic korrekt in PDF
 */
const PdfRenderer = (function() {
  /**
   * Render a single text run with formatting
   * @param {Object} doc - jsPDF instance
   * @param {Object} run - {text, bold, italic, underline, code}
   * @param {number} x - X position in mm
   * @param {number} y - Y position in mm
   * @param {number} fontSize - Font size in pt
   * @returns {number} - New X position after text
   */
  function renderRun(doc, run, x, y, fontSize) {
    if (!run.text) return x;

    // Determine font style based on formatting
    let fontStyle = 'normal';
    if (run.bold && run.italic) {
      fontStyle = 'bolditalic';
    } else if (run.bold) {
      fontStyle = 'bold';
    } else if (run.italic) {
      fontStyle = 'italic';
    }

    // Set font (use monospace for code)
    const fontFamily = run.code ? 'courier' : 'helvetica';
    doc.setFont(fontFamily, fontStyle);
    doc.setFontSize(fontSize);
    
    // Render text
    doc.text(run.text, x, y);
    
    // Return new X position
    const textWidth = doc.getTextWidth(run.text);
    return x + textWidth;
  }

  /**
   * Render all runs in a block, handling word wrap
   * @param {Object} doc - jsPDF instance
   * @param {Array} runs - Array of run objects
   * @param {number} startX - Starting X position
   * @param {number} y - Y position
   * @param {number} fontSize - Font size
   * @param {number} maxWidth - Maximum width for wrapping
   * @returns {number} - Final X position
   */
  function renderRuns(doc, runs, startX, y, fontSize, maxWidth) {
    let x = startX;
    
    for (const run of runs) {
      x = renderRun(doc, run, x, y, fontSize);
    }
    
    return x;
  }

  return { renderRun, renderRuns };
})();

/**
 * sanitizeTextForPdf - Replaces Unicode characters unsupported by jsPDF's
 * built-in fonts (WinAnsiEncoding) with ASCII/Latin-1 fallbacks.
 * Prevents blank glyphs in Acrobat Reader and other PDF viewers.
 * @param {string} text - Input text potentially containing unsupported chars
 * @returns {string} - Text with unsupported chars replaced by safe alternatives
 */
function sanitizeTextForPdf(text) {
  if (!text) return text;

  // Map of unsupported Unicode → safe ASCII/Latin-1 replacements
  const replacements = {
    // Box-drawing characters → ASCII alternatives
    '\u2500': '-',  // ─ horizontal line
    '\u2501': '=',  // ━ heavy horizontal
    '\u2502': '|',  // │ vertical line
    '\u2503': '|',  // ┃ heavy vertical
    '\u250C': '+',  // ┌ top-left corner
    '\u250D': '+',  // ┍
    '\u250E': '+',  // ┎
    '\u250F': '+',  // ┏
    '\u2510': '+',  // ┐ top-right corner
    '\u2514': '+',  // └ bottom-left corner
    '\u2518': '+',  // ┘ bottom-right corner
    '\u251C': '+',  // ├ left tee
    '\u2524': '+',  // ┤ right tee
    '\u252C': '+',  // ┬ top tee
    '\u2534': '+',  // ┴ bottom tee
    '\u253C': '+',  // ┼ cross
    '\u2550': '=',  // ═ double horizontal
    '\u2551': '|',  // ║ double vertical
    '\u2552': '+',  // ╒
    '\u2553': '+',  // ╓
    '\u2554': '+',  // ╔
    '\u2555': '+',  // ╕
    '\u2556': '+',  // ╖
    '\u2557': '+',  // ╗
    '\u2558': '+',  // ╘
    '\u2559': '+',  // ╙
    '\u255A': '+',  // ╚
    '\u255B': '+',  // ╛
    '\u255C': '+',  // ╜
    '\u255D': '+',  // ╝
    '\u255E': '+',  // ╞
    '\u255F': '+',  // ╟
    '\u2560': '+',  // ╠
    '\u2561': '+',  // ╡
    '\u2562': '+',  // ╢
    '\u2563': '+',  // ╣
    '\u2564': '+',  // ╤
    '\u2565': '+',  // ╥
    '\u2566': '+',  // ╦
    '\u2567': '+',  // ╧
    '\u2568': '+',  // ╨
    '\u2569': '+',  // ╩
    '\u256A': '+',  // ╪
    '\u256B': '+',  // ╫
    '\u256C': '+',  // ╬

    // Arrows → ASCII alternatives
    '\u2190': '<-',  // ← leftwards arrow
    '\u2191': '^',   // ↑ upwards arrow
    '\u2192': '->',  // → rightwards arrow
    '\u2193': 'v',   // ↓ downwards arrow
    '\u2194': '<->', // ↔ left right arrow
    '\u21D0': '<=',  // ⇐ leftwards double arrow
    '\u21D2': '=>',  // ⇒ rightwards double arrow
    '\u21D4': '<=>', // ⇔ left right double arrow

    // Mathematical operators not in WinAnsi
    '\u2260': '!=',  // ≠ not equal to
    '\u2264': '<=',  // ≤ less than or equal
    '\u2265': '>=',  // ≥ greater than or equal
    '\u2248': '~=',  // ≈ almost equal
    '\u221E': 'inf', // ∞ infinity
    '\u2211': 'Sum', // ∑ summation
    '\u220F': 'Prod',// ∏ product
    '\u221A': 'sqrt',// √ square root
    '\u2202': 'd',   // ∂ partial differential
    '\u222B': 'int', // ∫ integral
    '\u2227': '^',   // ∧ logical and
    '\u2228': 'v',   // ∨ logical or
    '\u2229': 'n',   // ∩ intersection
    '\u222A': 'u',   // ∪ union

    // Greek letters (common, not in WinAnsi)
    '\u0391': 'A',   // Α Alpha
    '\u0392': 'B',   // Β Beta
    '\u0393': 'G',   // Γ Gamma
    '\u0394': 'D',   // Δ Delta
    '\u0395': 'E',   // Ε Epsilon
    '\u0396': 'Z',   // Ζ Zeta
    '\u0397': 'H',   // Η Eta
    '\u0398': 'Th',  // Θ Theta
    '\u0399': 'I',   // Ι Iota
    '\u039A': 'K',   // Κ Kappa
    '\u039B': 'L',   // Λ Lambda
    '\u039C': 'M',   // Μ Mu
    '\u039D': 'N',   // Ν Nu
    '\u039E': 'X',   // Ξ Xi
    '\u039F': 'O',   // Ο Omicron
    '\u03A0': 'P',   // Π Pi
    '\u03A1': 'R',   // Ρ Rho
    '\u03A3': 'S',   // Σ Sigma
    '\u03A4': 'T',   // Τ Tau
    '\u03A5': 'Y',   // Υ Upsilon
    '\u03A6': 'Ph',  // Φ Phi
    '\u03A7': 'X',   // Χ Chi
    '\u03A8': 'Ps',  // Ψ Psi
    '\u03A9': 'O',   // Ω Omega
    '\u03B1': 'a',   // α alpha
    '\u03B2': 'b',   // β beta
    '\u03B3': 'g',   // γ gamma
    '\u03B4': 'd',   // δ delta
    '\u03B5': 'e',   // ε epsilon
    '\u03B6': 'z',   // ζ zeta
    '\u03B7': 'h',   // η eta
    '\u03B8': 'th',  // θ theta
    '\u03B9': 'i',   // ι iota
    '\u03BA': 'k',   // κ kappa
    '\u03BB': 'l',   // λ lambda
    '\u03BC': 'u',   // μ mu
    '\u03BD': 'v',   // ν nu
    '\u03BE': 'x',   // ξ xi
    '\u03BF': 'o',   // ο omicron
    '\u03C0': 'pi',  // π pi
    '\u03C1': 'r',   // ρ rho
    '\u03C3': 's',   // σ sigma
    '\u03C4': 't',   // τ tau
    '\u03C5': 'y',   // υ upsilon
    '\u03C6': 'ph',  // φ phi
    '\u03C7': 'x',   // χ chi
    '\u03C8': 'ps',  // ψ psi
    '\u03C9': 'o',   // ω omega

    // Miscellaneous symbols
    '\u2713': 'v',   // ✓ check mark
    '\u2714': 'v',   // ✔ heavy check mark
    '\u2715': 'x',   // ✕ multiplication x
    '\u2716': 'x',   // ✖ heavy multiplication x
    '\u2717': 'x',   // ✗ ballot x
    '\u2718': 'x',   // ✘ heavy ballot x
    '\u25CF': '*',   // ● black circle
    '\u25CB': 'o',   // ○ white circle
    '\u25A0': '#',   // ■ black square
    '\u25A1': '[]',  // □ white square
    '\u25B2': '^',   // ▲ triangle up
    '\u25BC': 'v',   // ▼ triangle down
    '\u25C0': '<',   // ◀ triangle left
    '\u25B6': '>',   // ▶ triangle right
    '\u2605': '*',   // ★ black star
    '\u2606': '*',   // ☆ white star

    // Dingbats / emoticon placeholders
    '\u2764': '<3',  // ❤ heavy heart
    '\u2660': 'S',   // ♠ spade
    '\u2663': 'C',   // ♣ club
    '\u2665': 'H',   // ♥ heart
    '\u2666': 'D',   // ♦ diamond
  };

  let result = text;

  // Apply known replacements
  for (const [char, replacement] of Object.entries(replacements)) {
    if (result.includes(char)) {
      result = result.split(char).join(replacement);
    }
  }

  // Strip remaining characters outside WinAnsiEncoding range that would render as blanks.
  // WinAnsi covers: U+0000-00FF (Latin-1) plus some extras at U+0152,0153,0160,0161,
  // U+0178,017D,017E,0192,02C6,02DC, and U+2013-2022,2026,2030,2039,203A,20AC,2122.
  // We keep those and replace anything else with '?'.
  result = result.replace(/[^\x00-\xFF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]/g, '?');

  return result;
}

console.log('⚡ FlashDoc Renderer Layer loaded');

// ============================================================================
// PLAIN TEXT STRUCTURER - Intelligent structure detection for unformatted text
// Ensures every export (PDF, DOCX, MD) gets proper headings, paragraphs, lists
// ============================================================================

const PlainTextStructurer = (function() {
  /**
   * Detect if a line is likely a heading
   * Heuristics: short line, ALL CAPS, ends with no period, first line, etc.
   */
  function isLikelyHeading(line, index, allLines) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.length > 120) return false; // Too long for a heading

    // First non-empty line is often a title
    if (index === 0 && trimmed.length <= 80 && !trimmed.endsWith('.') && !trimmed.endsWith(',')) {
      return { level: 1 };
    }

    // ALL CAPS line (at least 3 chars, not a sentence)
    if (trimmed.length >= 3 && trimmed.length <= 80 &&
        trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) &&
        !trimmed.endsWith('.') && !trimmed.endsWith(',')) {
      return { level: 2 };
    }

    // Line followed by a blank line, short, no ending punctuation
    const nextLine = allLines[index + 1];
    const prevLine = index > 0 ? allLines[index - 1] : undefined;
    if (trimmed.length <= 60 &&
        !trimmed.endsWith('.') && !trimmed.endsWith(',') && !trimmed.endsWith(';') &&
        (nextLine === undefined || nextLine.trim() === '') &&
        (prevLine === undefined || prevLine.trim() === '')) {
      return { level: 2 };
    }

    // Lines ending with colon (section headers like "Introduction:")
    if (trimmed.endsWith(':') && trimmed.length <= 60) {
      return { level: 3 };
    }

    return false;
  }

  /**
   * Detect if a line is a list item
   */
  function parseListItem(line) {
    const trimmed = line.trim();

    // Bullet lists: -, *, •, ‣, ▪, ○
    const bulletMatch = trimmed.match(/^([•\-*▪○‣])\s+(.+)/);
    if (bulletMatch) {
      return { type: 'bullet', text: bulletMatch[2], level: 0 };
    }

    // Indented bullet (sub-list)
    const indentedBullet = line.match(/^(\s{2,})([•\-*▪○‣])\s+(.+)/);
    if (indentedBullet) {
      const indent = indentedBullet[1].length;
      return { type: 'bullet', text: indentedBullet[3], level: Math.min(Math.floor(indent / 2), 2) };
    }

    // Numbered lists: 1. 2. 3. or 1) 2) 3)
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      return { type: 'ordered', text: numberedMatch[2], index: parseInt(numberedMatch[1], 10) - 1, level: 0 };
    }

    // Letter lists: a) b) c) or a. b. c.
    const letterMatch = trimmed.match(/^([a-z])[.)]\s+(.+)/i);
    if (letterMatch) {
      return { type: 'ordered', text: letterMatch[2], index: letterMatch[1].toLowerCase().charCodeAt(0) - 97, level: 1 };
    }

    return null;
  }

  /**
   * Structure plain text into blocks compatible with BlockBuilder output
   * @param {string} text - Plain text content
   * @returns {Array} - Array of structured blocks
   */
  function structure(text) {
    if (!text || typeof text !== 'string') return [];

    const blocks = [];
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    let i = 0;
    let listIndex = -1;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        listIndex = -1; // Reset list context on empty line
        i++;
        continue;
      }

      // Check for heading
      const heading = isLikelyHeading(trimmed, i, lines);
      if (heading) {
        blocks.push({
          type: 'heading',
          level: heading.level,
          runs: [{ text: trimmed, bold: true, italic: false, underline: false, strikethrough: false, code: false }]
        });
        i++;
        continue;
      }

      // Check for list item
      const listItem = parseListItem(line);
      if (listItem) {
        listIndex++;
        blocks.push({
          type: 'list-item',
          listType: listItem.type,
          listLevel: listItem.level,
          listIndex: listItem.index !== undefined ? listItem.index : listIndex,
          runs: [{ text: listItem.text, bold: false, italic: false, underline: false, strikethrough: false, code: false }]
        });
        i++;
        continue;
      }

      // Regular paragraph - collect consecutive non-empty, non-special lines
      const paraLines = [trimmed];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        const nextTrimmed = nextLine.trim();
        if (!nextTrimmed) break; // Empty line ends paragraph
        if (parseListItem(nextLine)) break; // List item starts
        if (isLikelyHeading(nextTrimmed, i, lines)) break; // Heading starts
        paraLines.push(nextTrimmed);
        i++;
      }

      blocks.push({
        type: 'paragraph',
        runs: [{ text: paraLines.join(' '), bold: false, italic: false, underline: false, strikethrough: false, code: false }]
      });
      listIndex = -1;
    }

    return blocks;
  }

  return { structure, isLikelyHeading, parseListItem };
})();

// ============================================================================
// HTML TO MARKDOWN CONVERTER - Converts HTML token stream to Markdown text
// ============================================================================

const HtmlToMarkdown = (function() {
  /**
   * Convert HTML string to well-formatted Markdown
   * @param {string} html - HTML content
   * @param {string} plainText - Fallback plain text
   * @returns {string} - Markdown formatted string
   */
  function convert(html, plainText) {
    if (!html || !html.trim()) {
      return convertPlainText(plainText);
    }

    const tokens = HtmlTokenizer.tokenize(html);
    if (!tokens || tokens.length === 0) {
      return convertPlainText(plainText);
    }

    const blocks = BlockBuilder.build(tokens);
    if (!blocks || blocks.length === 0) {
      return convertPlainText(plainText);
    }

    return blocksToMarkdown(blocks);
  }

  /**
   * Convert structured blocks to Markdown text
   */
  function blocksToMarkdown(blocks) {
    const lines = [];

    for (const block of blocks) {
      if (block.type === 'heading') {
        const prefix = '#'.repeat(Math.min(block.level || 1, 6));
        // For headings, strip bold since # already implies heading weight
        const text = runsToMarkdownInline(block.runs, { stripBold: true });
        lines.push('');
        lines.push(`${prefix} ${text}`);
        lines.push('');
      } else if (block.type === 'list-item') {
        const indent = '  '.repeat(block.listLevel || 0);
        const text = runsToMarkdownInline(block.runs);
        if (block.listType === 'ordered') {
          const num = (block.listIndex || 0) + 1;
          lines.push(`${indent}${num}. ${text}`);
        } else {
          lines.push(`${indent}- ${text}`);
        }
      } else {
        // Paragraph
        const text = runsToMarkdownInline(block.runs);
        if (text.trim()) {
          lines.push('');
          lines.push(text);
        }
      }
    }

    // Clean up: remove leading empty lines, collapse multiple empty lines
    let result = lines.join('\n');
    result = result.replace(/^\n+/, '');
    result = result.replace(/\n{3,}/g, '\n\n');
    return result.trim() + '\n';
  }

  /**
   * Convert runs to inline Markdown (bold, italic, code)
   * @param {Array} runs - Array of run objects
   * @param {Object} opts - Options: { stripBold: true } to skip bold (for headings)
   */
  function runsToMarkdownInline(runs, opts = {}) {
    if (!runs || runs.length === 0) return '';

    return runs.map(run => {
      let text = run.text || '';
      if (!text) return '';

      const isBold = run.bold && !opts.stripBold;
      const isItalic = run.italic;

      // Code formatting (must be first - no nesting inside code)
      if (run.code) {
        return '`' + text + '`';
      }

      // Bold + Italic
      if (isBold && isItalic) {
        return '***' + text + '***';
      }
      if (isBold) {
        return '**' + text + '**';
      }
      if (isItalic) {
        return '*' + text + '*';
      }
      if (run.strikethrough) {
        return '~~' + text + '~~';
      }

      return text;
    }).join('');
  }

  /**
   * Convert plain text to structured Markdown using PlainTextStructurer
   */
  function convertPlainText(text) {
    if (!text || !text.trim()) return '';

    const blocks = PlainTextStructurer.structure(text);
    if (blocks.length === 0) {
      // Absolute fallback: just return the text as-is
      return text.trim() + '\n';
    }

    return blocksToMarkdown(blocks);
  }

  return { convert, blocksToMarkdown, runsToMarkdownInline, convertPlainText };
})();

console.log('⚡ FlashDoc PlainTextStructurer & HtmlToMarkdown loaded');

// ============================================================================
// END FORMATTING ENGINE v2
// ============================================================================

const CONTEXT_MENU_ITEMS = [
  { id: 'auto', title: '\u26A1 Auto-detect & Save' },
  { id: 'txt', title: '\uD83D\uDCC4 Save as .txt' },
  { id: 'md', title: '\uD83D\uDCDD Save as .md' },
  { id: 'docx', title: '\uD83D\uDCDC Save as .docx' },
  { id: 'json', title: '\uD83D\uDCCB Save as .json' },
  { id: 'js', title: '\uD83D\uDFE8 Save as .js' },
  { id: 'ts', title: '\uD83D\uDD35 Save as .ts' },
  { id: 'py', title: '\uD83D\uDC0D Save as .py' },
  { id: 'html', title: '\uD83C\uDF10 Save as .html' },
  { id: 'css', title: '\uD83C\uDFA8 Save as .css' },
  { id: 'xml', title: '\uD83D\uDCF0 Save as .xml' },
  { id: 'sql', title: '\uD83D\uDDC4 Save as .sql' },
  { id: 'sh', title: '\u2699\uFE0F Save as .sh' },
  { id: 'yaml', title: '\uD83D\uDCE6 Save as .yaml' },
  { id: 'csv', title: '\uD83D\uDCCA Save as .csv' },
  { id: 'pdf', title: '\uD83D\uDCD5 Save as PDF' },
  { id: 'label', title: '\uD83C\uDFF7\uFE0F Label 89\u00D728 mm (PDF)' },
  { id: 'saveas', title: '\uD83D\uDCC1 Save As\u2026', saveAs: true }
];

const DEFAULT_CONTEXT_MENU_FORMATS = CONTEXT_MENU_ITEMS.map(item => item.id);

class FlashDoc {
  constructor() {
    this.stats = {
      totalFiles: 0,
      todayFiles: 0,
      todaysDate: '',
      lastFile: '',
      lastTimestamp: null,
      // Dev-Auftrag 4: Extended last action info
      lastAction: null  // { type, contentPreview, prefix }
    };
    this.contextMenuListenerRegistered = false;
    this.onContextMenuClicked = this.onContextMenuClicked.bind(this);
    this.init();
  }

  async init() {
    // Load settings
    this.settings = await this.loadSettings();
    
    // Setup listeners
    this.setupContextMenus();
    this.setupCommandListeners();
    this.setupMessageListeners();
    
    // Load stats
    await this.loadStats();
    
    console.log('\u26A1 FlashDoc initialized');
  }

  async loadSettings() {
    const defaults = {
      folderPath: 'FlashDocs/',
      namingPattern: 'timestamp',
      customPattern: 'file_{date}',
      organizeByType: true,
      showNotifications: true,
      playSound: false,
      autoDetectType: true,
      enableContextMenu: true,
      showFloatingButton: true,
      showCornerBall: false, // F3: Corner ball visibility (disabled by default to avoid UI blocking)
      buttonPosition: 'bottom-right',
      autoHideButton: true,
      selectionThreshold: 10,
      enableSmartDetection: true,
      trackFormatUsage: true,
      trackDetectionAccuracy: true,
      showFormatRecommendations: true,
      contextMenuFormats: DEFAULT_CONTEXT_MENU_FORMATS,
      // Category Shortcuts: prefix + format combo
      categoryShortcuts: [], // Array of {id, name, format} objects, max 10
      // Privacy Mode: 'off' | 'on' | 'smart'
      privacyMode: 'off',
      // URL patterns for Smart privacy mode
      privacyPatterns: [],
      // v3.1: Configurable contextual chip slots
      floatingButtonSlots: [
        { type: 'format', format: 'txt' },
        { type: 'format', format: 'md' },
        { type: 'format', format: 'docx' },
        { type: 'format', format: 'pdf' },
        { type: 'format', format: 'saveas' }
      ],
      floatingButtonPresets: [],
      activeFloatingButtonPresetId: null
    };

    const stored = await chrome.storage.sync.get(null);
    this.settings = { ...defaults, ...stored };
    return this.settings;
  }

  async loadStats() {
    const stored = await chrome.storage.local.get(['stats']);
    if (stored.stats) {
      this.stats = { ...this.stats, ...stored.stats };
    }
  }

  async saveStats() {
    await chrome.storage.local.set({ stats: this.stats });
  }

  setupContextMenus() {
    console.log('ðŸ”§ Setting up context menus...');
    console.log('ðŸ“¦ Current settings.categoryShortcuts:', this.settings.categoryShortcuts);

    // Remove existing menus
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        console.warn('Context menu cleanup warning:', chrome.runtime.lastError.message);
      }

      if (!this.settings.enableContextMenu) {
        console.log('â­ï¸ Context menu disabled in settings');
        return;
      }

      const selectedFormats = Array.isArray(this.settings.contextMenuFormats) && this.settings.contextMenuFormats.length
        ? this.settings.contextMenuFormats
        : DEFAULT_CONTEXT_MENU_FORMATS;
      const itemsToRender = CONTEXT_MENU_ITEMS.filter(item => selectedFormats.includes(item.id));
      const menuItems = itemsToRender.length ? itemsToRender : [CONTEXT_MENU_ITEMS[0]];

      // Parent menu
      chrome.contextMenus.create({
        id: 'flashdoc-parent',
        title: '\u26A1 FlashDoc',
        contexts: ['selection']
      });

      // Child menus - Standard formats
      menuItems.forEach(type => {
        chrome.contextMenus.create({
          id: `flashdoc-${type.id}`,
          parentId: 'flashdoc-parent',
          title: type.title,
          contexts: ['selection']
        });
      });

      // Add category shortcuts (prefix combos) if any exist
      const shortcuts = this.settings.categoryShortcuts || [];
      console.log('ðŸ“‹ Category shortcuts:', shortcuts);
      if (shortcuts.length > 0) {
        // Add separator
        chrome.contextMenus.create({
          id: 'flashdoc-separator',
          parentId: 'flashdoc-parent',
          type: 'separator',
          contexts: ['selection']
        });

        // Add each shortcut
        const formatEmojis = {
          txt: 'ðŸ“„', md: 'ðŸ“', docx: 'ðŸ“œ', pdf: 'ðŸ“•', json: 'ðŸ§©',
          js: 'ðŸŸ¡', ts: 'ðŸ”µ', py: 'ðŸ', html: 'ðŸŒ', css: 'ðŸŽ¨',
          yaml: 'ðŸ§¾', sql: 'ðŸ“‘', sh: 'âš™ï¸'
        };

        shortcuts.forEach(shortcut => {
          const emoji = formatEmojis[shortcut.format] || 'ðŸ“„';
          chrome.contextMenus.create({
            id: `flashdoc-shortcut-${shortcut.id}`,
            parentId: 'flashdoc-parent',
            title: `${emoji} ${shortcut.name}_save.${shortcut.format}`,
            contexts: ['selection']
          });
        });
      }
    });

    if (!this.contextMenuListenerRegistered) {
      chrome.contextMenus.onClicked.addListener(this.onContextMenuClicked);
      this.contextMenuListenerRegistered = true;
    }
  }

  setupCommandListeners() {
    const commandMap = {
      'save-smart': 'auto',
      'save-txt': 'txt',
      'save-md': 'md',
      'save-pdf': 'pdf'
    };

    chrome.commands.onCommand.addListener((command) => {
      const type = commandMap[command];
      if (!type) return;
      this.getSelectionAndSave(type).catch((error) => {
        console.error('Command save failed:', error);
      });
    });
  }

  // Update content script registration based on privacy mode
  async updateContentScriptRegistration() {
    const mode = this.getPrivacyMode();
    try {
      // First, unregister any existing dynamic registration
      try {
        await chrome.scripting.unregisterContentScripts({ ids: ['flashdoc-content'] });
      } catch (e) {
        // Ignore if not registered
      }

      if (mode === 'off') {
        console.log('🔓 Privacy mode OFF - content scripts active on all pages');
      } else if (mode === 'on') {
        console.log('🔒 Privacy mode ALWAYS ON - on-demand injection only');
      } else if (mode === 'smart') {
        const patterns = this.settings.privacyPatterns || [];
        console.log(`🧠 Privacy mode SMART - ${patterns.length} URL patterns configured`);
      }
    } catch (error) {
      console.error('Content script registration update failed:', error);
    }
  }

  /**
   * Get normalized privacy mode (handles migration from boolean)
   * @returns {'off' | 'on' | 'smart'}
   */
  getPrivacyMode() {
    const mode = this.settings.privacyMode;
    if (mode === true) return 'on';
    if (mode === false) return 'off';
    if (['off', 'on', 'smart'].includes(mode)) return mode;
    return 'off';
  }

  /**
   * Check if a URL should have scripts blocked by privacy mode
   * @param {string} url - The page URL to check
   * @returns {boolean} - true if scripts should be blocked
   */
  isUrlPrivacyBlocked(url) {
    const mode = this.getPrivacyMode();
    if (mode === 'off') return false;
    if (mode === 'on') return true;
    if (mode === 'smart') {
      const patterns = this.settings.privacyPatterns || [];
      return patterns.some(pattern => this.matchUrlPattern(pattern, url));
    }
    return false;
  }

  /**
   * Match a URL against a wildcard pattern
   * Supports * as wildcard (matches any sequence of characters)
   * @param {string} pattern - Glob-style pattern (e.g. *://*.bank.com/*)
   * @param {string} url - URL to test
   * @returns {boolean}
   */
  matchUrlPattern(pattern, url) {
    if (!pattern || !url) return false;
    // Escape regex special chars except *, then convert * to .*
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    try {
      const regex = new RegExp('^' + escaped + '$', 'i');
      return regex.test(url);
    } catch (e) {
      return false;
    }
  }

  // Manually inject content scripts into a specific tab
  async injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        files: ['detection-utils.js', 'content.js']
      });
      console.log(`✅ Content scripts injected into tab ${tabId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Injection failed for tab ${tabId}:`, error);
      return { success: false, error: error.message };
    }
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'saveContent') {
        const options = {
          prefix: message.prefix || null,
          html: message.html || '' // HTML content for formatting
        };
        this.handleSave(message.content, message.type, sender.tab, options)
          .then((result) => sendResponse({ success: true, result }))
          .catch((error) => {
            const messageText = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: messageText });
          });
        return true;
      } else if (message.action === 'getStats') {
        // Ensure stats are loaded from storage before responding
        this.loadStats()
          .then(() => {
            sendResponse({ stats: this.stats });
          })
          .catch((error) => {
            console.error('Stats load error:', error);
            sendResponse({ stats: this.stats });
          });
        return true;
      } else if (message.action === 'getSettings') {
        sendResponse({ settings: this.settings });
        return true;
      } else if (message.action === 'refreshSettings') {
        this.loadSettings()
          .then(() => {
            this.setupContextMenus();
            this.updateContentScriptRegistration();
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error('Settings refresh failed:', error);
            const messageText = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: messageText });
          });
        return true;
      } else if (message.action === 'activateTab') {
        // Manual activation for privacy mode
        const tabId = message.tabId;
        if (!tabId) {
          sendResponse({ success: false, error: 'No tab ID provided' });
          return true;
        }
        this.injectContentScript(tabId)
          .then((result) => sendResponse(result))
          .catch((error) => {
            const messageText = error instanceof Error ? error.message : String(error);
            sendResponse({ success: false, error: messageText });
          });
        return true;
      } else if (message.action === 'getPrivacyMode') {
        sendResponse({
          privacyMode: this.getPrivacyMode(),
          privacyPatterns: this.settings.privacyPatterns || []
        });
        return true;
      } else if (message.action === 'checkPrivacyForUrl') {
        const blocked = this.isUrlPrivacyBlocked(message.url || '');
        sendResponse({ blocked, mode: this.getPrivacyMode() });
        return true;
      }
      return true;
    });
  }

  onContextMenuClicked(info, tab) {
    if (!info.menuItemId || !info.menuItemId.startsWith('flashdoc-')) return;

    const menuId = info.menuItemId.replace('flashdoc-', '');

    // Check if it's a shortcut (prefix combo)
    if (menuId.startsWith('shortcut-')) {
      const shortcutId = menuId.replace('shortcut-', '');
      const shortcuts = this.settings.categoryShortcuts || [];
      const shortcut = shortcuts.find(s => s.id === shortcutId);

      if (shortcut) {
        this.handleSave(info.selectionText, shortcut.format, tab, { prefix: shortcut.name }).catch((error) => {
          console.error('Shortcut save failed:', error);
        });
      }
      return;
    }

    // Standard format save - need to get HTML from tab
    this.getHtmlSelectionAndSave(info.selectionText, menuId, tab).catch((error) => {
      console.error('Context menu save failed:', error);
    });
  }

  /**
   * Get HTML selection from tab and save
   */
  async getHtmlSelectionAndSave(fallbackText, type, tab) {
    let html = '';
    let text = fallbackText;
    
    // Try to get HTML from the tab
    if (tab && tab.id) {
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return { html: '' };
            try {
              const range = sel.getRangeAt(0);
              const container = document.createElement('div');
              container.appendChild(range.cloneContents());
              return { html: container.innerHTML };
            } catch (e) {
              return { html: '' };
            }
          }
        });
        if (result && result.result && result.result.html) {
          html = result.result.html;
        }
      } catch (e) {
        console.log('[FlashDoc] Could not get HTML selection:', e);
      }
    }
    
    await this.handleSave(text, type, tab, { html });
  }

  async getSelectionAndSave(type) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        const error = new Error('No active tab');
        error.handled = true;
        this.showNotification('\u274C No active tab', 'error');
        throw error;
      }

      const [selection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return { text: '', html: '' };
          
          const text = sel.toString();
          
          // Extract HTML from selection
          let html = '';
          try {
            const range = sel.getRangeAt(0);
            const container = document.createElement('div');
            container.appendChild(range.cloneContents());
            html = container.innerHTML;
          } catch (e) {
            html = '';
          }
          
          return { text, html };
        }
      });

      if (selection && selection.result && selection.result.text && selection.result.text.trim()) {
        await this.handleSave(selection.result.text, type, tab, { html: selection.result.html });
      } else {
        const error = new Error('No text selected');
        error.handled = true;
        this.showNotification('\u274C No text selected', 'error');
        throw error;
      }
    } catch (error) {
      console.error('Error getting selection:', error);
      if (!error || !error.handled) {
        this.showNotification('\u274C No text selected', 'error');
      }
    }
  }

  async handleSave(content, type, tab, options = {}) {
    if (!content || content.trim().length === 0) {
      const error = new Error('No content to save');
      error.handled = true;
      this.showNotification('\u274C No content to save', 'error');
      throw error;
    }

    try {
      const saveAsRequested = options.saveAs || type === 'saveas';
      let requestedType = type === 'saveas' ? 'auto' : type;
      // Auto-detect if requested
      let targetType = requestedType;
      if (targetType === 'auto') {
        targetType = this.settings.autoDetectType
          ? this.detectContentType(content)
          : 'txt';
      }

      // Generate filename (with optional prefix from category shortcuts)
      const filename = this.generateFilename(content, targetType, tab, options.prefix || null);
      
      // Create file path with optional type organization
      let filepath = this.settings.folderPath;
      if (this.settings.organizeByType) {
        filepath += `${targetType}/`;
      }
      filepath += filename;

      const { blob, mimeType } = await this.createBlob(content, targetType, options.html || '');
      const { url, revoke } = await this.prepareDownloadUrl(blob, mimeType);

      const downloadId = await chrome.downloads.download({
        url,
        filename: filepath,
        saveAs: saveAsRequested,
        conflictAction: 'uniquify'
      });

      // Update stats
      this.stats.totalFiles++;
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      if (this.stats.todaysDate !== todayKey) {
        this.stats.todaysDate = todayKey;
        this.stats.todayFiles = 0;
      }
      this.stats.todayFiles++;
      this.stats.lastFile = filename;
      this.stats.lastTimestamp = now.getTime();
      // Dev-Auftrag 4: Store extended action info for repeat functionality
      this.stats.lastAction = {
        type: targetType,
        contentPreview: content.substring(0, 100).replace(/\n/g, ' ').trim(),
        prefix: options.prefix || null
      };
      await this.saveStats();

      // Track format usage if enabled
      if (this.settings.trackFormatUsage) {
        await this.trackFormatUsage(targetType);
      }

      // Track detection accuracy if enabled and auto-detection was used
      if (this.settings.trackDetectionAccuracy && requestedType === 'auto') {
        await this.trackDetectionAccuracy(targetType);
      }

      // Show success notification
      if (this.settings.showNotifications) {
        this.showNotification(`\u2728 ${filename} created!`);
      }

      // Cleanup
      setTimeout(() => revoke(), 1000);

      console.log(`\u2705 File saved: ${filepath}`);
      return { filename, downloadId, type: targetType };

    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      console.error('Error saving file:', failure);
      this.showNotification(`\u274C Error: ${failure.message}`, 'error');
      failure.handled = true;
      throw failure;
    }
  }

  generateFilename(content, extension, tab, prefix = null) {
    const fileExtension = extension === 'label' ? 'pdf' : extension;
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5);

    // If a category shortcut prefix is provided, use simplified naming
    if (prefix && prefix.trim()) {
      const sanitizedPrefix = prefix.trim().replace(/[^a-z0-9_-]/gi, '_');
      // Use format: Category_save_YYYY-MM-DD_HH-MM-SS.ext
      return `${sanitizedPrefix}_save_${timestamp}.${fileExtension}`;
    }

    // Standard naming patterns
    let baseName;
    switch (this.settings.namingPattern) {
      case 'firstline': {
        const firstLine = content.split('\n')[0]
          .substring(0, 50)
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_+/g, '_')
          .toLowerCase()
          .trim();

        baseName = firstLine && firstLine.length > 3
          ? firstLine
          : `flashdoc_${timestamp}`;
        break;
      }

      case 'custom': {
        baseName = this.settings.customPattern
          .replace('{date}', timestamp.split('_')[0])
          .replace('{time}', timestamp.split('_')[1])
          .replace('{type}', extension);
        break;
      }

      case 'timestamp':
      default:
        baseName = `flashdoc_${timestamp}`;
    }

    return `${baseName}.${fileExtension}`;
  }

  async createBlob(content, extension, html = '') {
    if (extension === 'pdf') {
      const pdfBlob = this.createPdfBlob(content, html);
      return { blob: pdfBlob, mimeType: 'application/pdf' };
    }

    if (extension === 'docx') {
      // Note: createDocxBlob is now async, caller must await
      const docxBlob = await this.createDocxBlob(content, html);
      return { blob: docxBlob, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    }

    const mimeTypes = {
      'txt': 'text/plain;charset=utf-8',
      'md': 'text/markdown;charset=utf-8',
      'yaml': 'text/yaml;charset=utf-8',
      'py': 'text/x-python;charset=utf-8',
      'js': 'text/javascript;charset=utf-8',
      'ts': 'text/typescript;charset=utf-8',
      'tsx': 'text/typescript;charset=utf-8',
      'json': 'application/json;charset=utf-8',
      'html': 'text/html;charset=utf-8',
      'css': 'text/css;charset=utf-8',
      'xml': 'application/xml;charset=utf-8',
      'svg': 'image/svg+xml;charset=utf-8',
      'sql': 'application/sql;charset=utf-8',
      'sh': 'application/x-sh;charset=utf-8',
      'bash': 'application/x-sh;charset=utf-8',
      'csv': 'text/csv;charset=utf-8',
      'url': 'text/plain;charset=utf-8'
    };

    if (extension === 'label') {
      const labelBlob = this.createLabelPdf(content);
      return { blob: labelBlob, mimeType: 'application/pdf' };
    }

    if (extension === 'md') {
      // Convert HTML to proper Markdown, or structure plain text
      const markdownContent = HtmlToMarkdown.convert(html, content);
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      return { blob, mimeType: 'text/markdown;charset=utf-8' };
    }

    const mimeType = mimeTypes[extension] || 'text/plain;charset=utf-8';
    return { blob: new Blob([content], { type: mimeType }), mimeType };
  }

  async prepareDownloadUrl(blob, mimeType) {
    const supportsObjectUrl = globalThis.URL && typeof globalThis.URL.createObjectURL === 'function';
    if (supportsObjectUrl) {
      const objectUrl = URL.createObjectURL(blob);
      return {
        url: objectUrl,
        revoke: () => URL.revokeObjectURL(objectUrl)
      };
    }

    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    const binaryChunks = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binaryChunks.push(String.fromCharCode.apply(null, chunk));
    }

    const base64 = btoa(binaryChunks.join(''));
    return {
      url: `data:${mimeType};base64,${base64}`,
      revoke: () => {}
    };
  }

  // DEPRECATED: parseHtmlContent removed in v2
  // Replaced by: HtmlTokenizer.tokenize() + BlockBuilder.build()
  // See FORMATTING ENGINE v2 at top of file

  createPdfBlob(content, html = '') {
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Parse HTML or structure plain text
    let blocks;
    if (html && html.trim()) {
      const tokens = HtmlTokenizer.tokenize(html);
      blocks = BlockBuilder.build(tokens);
    }
    if (!blocks || blocks.length === 0) {
      // Use PlainTextStructurer for intelligent structure detection
      blocks = PlainTextStructurer.structure(content);
    }
    if (!blocks || blocks.length === 0) {
      // Absolute fallback: single paragraph with all content
      blocks = [{
        type: 'paragraph',
        runs: [{ text: content.trim(), bold: false, italic: false, underline: false, strikethrough: false, code: false }]
      }];
    }

    const fontSizes = {
      h1: 20, h2: 16, h3: 14, h4: 12, h5: 11, h6: 10,
      paragraph: 11, 'list-item': 11
    };
    const lineHeights = {
      h1: 9, h2: 7.5, h3: 6.5, h4: 5.5, h5: 5, h6: 5,
      paragraph: 5, 'list-item': 5
    };
    const spacingAfter = {
      h1: 4, h2: 3, h3: 2.5, h4: 2, h5: 1.5, h6: 1.5,
      paragraph: 3, 'list-item': 1.5
    };

    let y = margin;
    PdfListContext.reset();

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    /**
     * Collect all text from a block's runs into segments with formatting info,
     * then word-wrap them together across the full line width.
     * This fixes the issue where individual runs would overflow the line.
     */
    const renderBlockRuns = (block, startX, fontSize, lineHeight) => {
      // Build a flat list of word-segments with formatting
      const segments = [];
      for (const run of block.runs) {
        if (!run.text) continue;
        // Don't skip whitespace-only runs - they may be spaces between words
        const text = run.text;

        let fontStyle = 'normal';
        if (run.bold && run.italic) fontStyle = 'bolditalic';
        else if (run.bold) fontStyle = 'bold';
        else if (run.italic) fontStyle = 'italic';
        if (block.type === 'heading') fontStyle = run.italic ? 'bolditalic' : 'bold';

        const fontFamily = run.code ? 'courier' : 'helvetica';

        // Split text into words, preserving spaces
        const words = text.split(/(\s+)/);
        for (const word of words) {
          if (word.length === 0) continue;
          segments.push({
            text: word,
            fontFamily,
            fontStyle,
            fontSize,
            isSpace: !word.trim()
          });
        }
      }

      if (segments.length === 0) return;

      // Render segments with proper word wrapping
      let x = startX;
      const indentX = startX; // Return to this X on new line

      for (let si = 0; si < segments.length; si++) {
        const seg = segments[si];
        doc.setFont(seg.fontFamily, seg.fontStyle);
        doc.setFontSize(seg.fontSize);
        const segWidth = doc.getTextWidth(seg.text);

        // Check if this word would overflow the line
        if (!seg.isSpace && x + segWidth > margin + maxWidth + 0.5 && x > indentX + 1) {
          // Move to next line
          y += lineHeight;
          checkPageBreak(lineHeight);
          x = indentX;
          // Skip leading spaces on new line
          if (seg.isSpace) continue;
        }

        // Skip trailing spaces at line start
        if (seg.isSpace && Math.abs(x - indentX) < 0.5) continue;

        checkPageBreak(lineHeight);
        doc.text(seg.text, x, y);
        x += segWidth;
      }
    };

    for (const block of blocks) {
      const blockType = block.type === 'heading' ? `h${block.level}` : block.type;
      const fontSize = fontSizes[blockType] || fontSizes.paragraph;
      const lineHeight = lineHeights[blockType] || lineHeights.paragraph;
      let x = margin;

      // Extra spacing before headings (not for the very first element)
      if (block.type === 'heading' && y > margin + 1) {
        y += 4;
      }

      // Get list prefix
      const prefix = PdfListContext.getPrefix(block);
      if (prefix) {
        const indent = (block.listLevel || 0) * 6;
        x = margin + indent;
        checkPageBreak(lineHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.text(prefix, x, y);
        x += doc.getTextWidth(prefix);
      }

      checkPageBreak(lineHeight);

      // Draw heading underline for H1
      if (block.type === 'heading' && block.level === 1) {
        renderBlockRuns(block, x, fontSize, lineHeight);
        y += 1.5;
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + maxWidth, y);
        y += spacingAfter.h1;
      } else {
        renderBlockRuns(block, x, fontSize, lineHeight);
        y += lineHeight + (spacingAfter[blockType] || spacingAfter.paragraph);
      }
    }

    return doc.output('blob');
  }

  createLabelPdf(content) {
    // Label dimensions: 89mm x 28mm
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [89, 28]
    });

    const width = 89;
    const height = 28;
    const marginX = 4;
    const marginY = 3;
    const maxLines = 4;

    // Normalize and clean content
    const cleanContent = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Split into lines and flatten
    const rawLines = cleanContent.split('\n').filter(line => line.trim());

    // Calculate available space
    const availableWidth = width - (marginX * 2);
    const availableHeight = height - (marginY * 2);

    // Start with max font size and reduce until text fits
    let fontSize = 14;
    const minFontSize = 6;
    let lines = [];
    let lineHeight = 0;

    while (fontSize >= minFontSize) {
      doc.setFontSize(fontSize);
      lineHeight = fontSize * 0.4; // Approximate line height in mm

      // Wrap all lines to fit width
      lines = [];
      for (const rawLine of rawLines) {
        const wrapped = doc.splitTextToSize(rawLine, availableWidth);
        lines.push(...wrapped);
        if (lines.length > maxLines) break;
      }

      // Limit to max lines
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
      }

      // Check if text fits in available height
      const totalHeight = lines.length * lineHeight;
      if (totalHeight <= availableHeight) {
        break;
      }

      fontSize -= 1;
    }

    // Center text vertically
    const totalTextHeight = lines.length * lineHeight;
    let y = marginY + (availableHeight - totalTextHeight) / 2 + lineHeight * 0.8;

    // Set font for final render
    doc.setFont('helvetica');
    doc.setFontSize(fontSize);

    // Draw each line centered horizontally
    for (const line of lines) {
      const textWidth = doc.getTextWidth(line);
      const x = marginX + (availableWidth - textWidth) / 2;
      doc.text(line, x, y);
      y += lineHeight;
    }

    return doc.output('blob');
  }

  async createDocxBlob(content, html = '') {
    const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, BorderStyle } = docx;

    // Parse HTML or structure plain text
    let blocks;
    if (html && html.trim()) {
      const tokens = HtmlTokenizer.tokenize(html);
      blocks = BlockBuilder.build(tokens);
    }
    if (!blocks || blocks.length === 0) {
      // Use PlainTextStructurer for intelligent structure detection
      blocks = PlainTextStructurer.structure(content);
    }
    if (!blocks || blocks.length === 0) {
      // Absolute fallback: single paragraph
      blocks = [{
        type: 'paragraph',
        runs: [{ text: content.trim(), bold: false, italic: false, underline: false, strikethrough: false, code: false }]
      }];
    }

    const headingLevels = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6
    };

    const fontSizes = {
      h1: 40, h2: 32, h3: 28, h4: 24, h5: 22, h6: 20,
      paragraph: 22, 'list-item': 22
    };

    // Build paragraphs with proper formatting
    const paragraphs = [];

    for (const block of blocks) {
      const fontSize = block.type === 'heading'
        ? (fontSizes[`h${block.level}`] || 28)
        : (fontSizes[block.type] || 22);

      // Create text runs with formatting
      const textRuns = block.runs
        .filter(run => run.text) // Keep space-only runs but not null/empty
        .map(run => {
          const config = DocxRenderer.createTextRun(run, fontSize);
          if (block.type === 'heading') config.bold = true;
          return new TextRun(config);
        });

      if (textRuns.length === 0) continue;

      if (block.type === 'list-item') {
        const level = Math.min(block.listLevel || 0, 2);
        const reference = block.listType === 'ordered' ? 'ordered-list' : 'bullet-list';

        paragraphs.push(new Paragraph({
          children: textRuns,
          numbering: { reference, level },
          spacing: { after: 80, line: 276 }
        }));
      } else if (block.type === 'heading') {
        paragraphs.push(new Paragraph({
          children: textRuns,
          heading: headingLevels[block.level] || HeadingLevel.HEADING_1,
          spacing: {
            before: block.level === 1 ? 360 : 240,
            after: block.level === 1 ? 200 : 120
          }
        }));
      } else {
        // Regular paragraph with comfortable line spacing
        paragraphs.push(new Paragraph({
          children: textRuns,
          spacing: { after: 160, line: 276 }
        }));
      }
    }

    // Create professional document with proper styles
    const docDocument = new Document({
      numbering: DocxRenderer.createNumberingConfig(),
      styles: {
        default: {
          document: {
            run: {
              font: 'Calibri',
              size: 22, // 11pt
              color: '333333'
            },
            paragraph: {
              spacing: { line: 276 }
            }
          },
          heading1: {
            run: {
              font: 'Calibri',
              size: 40, // 20pt
              bold: true,
              color: '1E5C4A'
            },
            paragraph: {
              spacing: { before: 360, after: 200 }
            }
          },
          heading2: {
            run: {
              font: 'Calibri',
              size: 32, // 16pt
              bold: true,
              color: '2A7A62'
            },
            paragraph: {
              spacing: { before: 240, after: 120 }
            }
          },
          heading3: {
            run: {
              font: 'Calibri',
              size: 28, // 14pt
              bold: true,
              color: '333333'
            },
            paragraph: {
              spacing: { before: 200, after: 100 }
            }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // Letter size
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
          }
        },
        children: paragraphs
      }]
    });

    return await Packer.toBlob(docDocument);
  }

  detectContentType(content) {
    if (typeof DetectionUtils?.detectContentType === 'function') {
      return DetectionUtils.detectContentType(content);
    }

    // Fallback to plain text if helpers fail to load
    return 'txt';
  }

  async trackFormatUsage(format) {
    try {
      const stored = await chrome.storage.local.get(['formatUsage']);
      const formatUsage = stored.formatUsage || {};
      formatUsage[format] = (formatUsage[format] || 0) + 1;
      await chrome.storage.local.set({ formatUsage });
    } catch (error) {
      console.error('Failed to track format usage:', error);
    }
  }

  async trackDetectionAccuracy(detectedFormat) {
    try {
      const stored = await chrome.storage.local.get(['detectionAccuracy']);
      const accuracy = stored.detectionAccuracy || { total: 0, correct: 0 };
      accuracy.total++;
      // For now, we assume detection is correct. In future, users could provide feedback
      accuracy.correct++;
      await chrome.storage.local.set({ detectionAccuracy: accuracy });
    } catch (error) {
      console.error('Failed to track detection accuracy:', error);
    }
  }

  showNotification(message, type = 'success') {
    if (!this.settings.showNotifications) return;

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'FlashDoc',
      message: message,
      priority: type === 'error' ? 2 : 1
    });
  }
}

// Initialize
new FlashDoc();

// Handle installation and extension reload
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`âš¡ FlashDoc ${details.reason}: re-injecting content scripts...`);

  // Re-inject content scripts into all existing tabs to fix "Extension not available" error
  // This is necessary because old content scripts become orphaned after extension reload
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      // Skip chrome:// pages, extension pages, and tabs without URLs
      if (tab.id && tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://') &&
          !tab.url.startsWith('about:')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ['content.js']
          });
          console.log(`âœ… Injected into tab ${tab.id}: ${tab.url.substring(0, 50)}...`);
        } catch (e) {
          // Tab might not support scripting - this is normal
          console.log(`â­ï¸ Skipped tab ${tab.id}: ${e.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to re-inject content scripts:', error);
  }

  if (details.reason === 'install') {
    console.log('ðŸŽ‰ FlashDoc installed!');
    chrome.tabs.create({ url: 'options.html' });
  }
});
