#!/usr/bin/env node
/**
 * FlashDoc Format Quality Tests
 * Run with: node scripts/format-quality-test.cjs
 *
 * Comprehensive tests for document generation quality:
 * - HtmlTokenizer: whitespace preservation, entity decoding
 * - BlockBuilder: format stack, structure integrity, run merging
 * - PlainTextStructurer: heading detection, list parsing, paragraph grouping
 * - HtmlToMarkdown: HTML-to-Markdown conversion, plain text structuring
 * - PDF blocks: complete text, proper formatting, no lost content
 * - DOCX blocks: structure, headings, lists, formatting
 */

const fs = require('fs');
const path = require('path');

const PASS = '\x1b[32m\u2713\x1b[0m';
const FAIL = '\x1b[31m\u2717\x1b[0m';

let passed = 0;
let failed = 0;
let totalTests = 0;

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ${PASS} ${name}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${name}${details ? ` -- ${details}` : ''}`);
    failed++;
  }
}

function assertDeepEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  test(label, a === e, `\n    Expected: ${e}\n    Actual:   ${a}`);
}

// ============================================================================
// Load modules from service-worker.js
// Extract the formatting engine section and execute in a sandbox
// ============================================================================

const swSource = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf-8');

// Extract everything from start of file to "END FORMATTING ENGINE v2"
// This includes: EntityDecoder, HtmlTokenizer, BlockBuilder, DocxRenderer,
// PdfListContext, PdfRenderer, PlainTextStructurer, HtmlToMarkdown
const endMarker = '// END FORMATTING ENGINE v2';
const endIdx = swSource.indexOf(endMarker);
if (endIdx === -1) {
  console.error('FATAL: Could not find "END FORMATTING ENGINE v2" marker');
  process.exit(1);
}

// Skip the importScripts lines at the top (they fail in Node.js)
const startMarker = 'const EntityDecoder';
const startIdx = swSource.indexOf(startMarker);
if (startIdx === -1) {
  console.error('FATAL: Could not find EntityDecoder definition');
  process.exit(1);
}

const engineCode = swSource.substring(startIdx, endIdx);

// Remove console.log statements that reference emojis (avoid encoding issues)
const cleanCode = engineCode.replace(/console\.log\([^)]+\);/g, '');

// Execute in the current scope to define all modules
const sandbox = {};
const wrappedCode = `
(function() {
  ${cleanCode}
  return {
    EntityDecoder, HtmlTokenizer, BlockBuilder, DocxRenderer,
    PdfListContext, PdfRenderer, PlainTextStructurer, HtmlToMarkdown
  };
})()
`;

try {
  const modules = eval(wrappedCode);
  Object.assign(sandbox, modules);
} catch (e) {
  console.error('FATAL: Could not execute formatting engine:', e.message);
  console.error(e.stack);
  process.exit(1);
}

console.log('\n\x1b[1m=== FlashDoc Format Quality Tests ===\x1b[0m');
console.log(`Modules loaded: EntityDecoder, HtmlTokenizer, BlockBuilder, PlainTextStructurer, HtmlToMarkdown, PdfListContext\n`);

// ============================================================================
// TEST SUITE 1: EntityDecoder
// ============================================================================
console.log('\x1b[1m[1] EntityDecoder\x1b[0m');
{
  const { decode } = sandbox.EntityDecoder;

  test('Decodes named entities',
    decode('&amp; &lt; &gt;') === '& < >');

  test('Decodes mdash and ndash',
    decode('&mdash; &ndash;') === '\u2014 \u2013');

  test('Decodes decimal entities',
    decode('&#8364;') === '\u20AC'); // Euro sign

  test('Decodes hex entities',
    decode('&#x20AC;') === '\u20AC');

  test('Preserves unknown entities',
    decode('&unknown;') === '&unknown;');

  test('Handles empty/null input',
    decode('') === '' && decode(null) === '');

  test('Decodes common accented chars',
    decode('&auml;&ouml;&uuml;') === '\u00E4\u00F6\u00FC');

  test('Decodes nbsp',
    decode('hello&nbsp;world').includes('\u00A0'));
}

// ============================================================================
// TEST SUITE 2: HtmlTokenizer
// ============================================================================
console.log('\n\x1b[1m[2] HtmlTokenizer\x1b[0m');
{
  const { tokenize } = sandbox.HtmlTokenizer;

  // Basic tokenization
  const tokens1 = tokenize('<p>Hello</p>');
  test('Basic paragraph: correct token count',
    tokens1.length === 3);
  test('Basic paragraph: open, text, close',
    tokens1[0].type === 'open' && tokens1[0].tag === 'p' &&
    tokens1[1].type === 'text' && tokens1[1].content === 'Hello' &&
    tokens1[2].type === 'close' && tokens1[2].tag === 'p');

  // CRITICAL: Whitespace between inline tags must be preserved
  const tokens2 = tokenize('<strong>Hello</strong> <em>World</em>');
  test('Whitespace between inline tags is preserved',
    tokens2.some(t => t.type === 'text' && t.content === ' '),
    `Tokens: ${JSON.stringify(tokens2.map(t => t.type + ':' + (t.content || t.tag)))}`);

  // Multiple spaces should be preserved
  const tokens3 = tokenize('<b>A</b>  <i>B</i>');
  const spaceToken = tokens3.find(t => t.type === 'text' && t.content.trim() === '' && t.content.length > 0);
  test('Multiple spaces between tags preserved',
    spaceToken !== undefined,
    `Tokens: ${JSON.stringify(tokens3.map(t => t.type + ':' + (t.content || t.tag)))}`);

  // Entity decoding in text
  const tokens4 = tokenize('<p>&amp; &lt;tag&gt;</p>');
  test('Entities decoded in text content',
    tokens4[1].content === '& <tag>');

  // Self-closing tags
  const tokens5 = tokenize('<p>Line 1<br/>Line 2</p>');
  test('Self-closing br produces open token',
    tokens5.some(t => t.type === 'open' && t.tag === 'br'));

  // Nested tags
  const tokens6 = tokenize('<div><p><strong>Bold</strong></p></div>');
  test('Nested tags tokenized correctly',
    tokens6.length === 7 &&
    tokens6[0].tag === 'div' && tokens6[1].tag === 'p' && tokens6[2].tag === 'strong');

  // Empty input
  test('Empty input returns empty array',
    tokenize('').length === 0 && tokenize(null).length === 0);

  // Plain text (no tags)
  const tokens7 = tokenize('Just plain text');
  test('Plain text without tags produces single text token',
    tokens7.length === 1 && tokens7[0].type === 'text' && tokens7[0].content === 'Just plain text');

  // Attributes
  const tokens8 = tokenize('<a href="https://example.com" class="link">Click</a>');
  test('Attributes parsed correctly',
    tokens8[0].attrs.href === 'https://example.com' && tokens8[0].attrs.class === 'link');
}

// ============================================================================
// TEST SUITE 3: BlockBuilder
// ============================================================================
console.log('\n\x1b[1m[3] BlockBuilder\x1b[0m');
{
  const { build } = sandbox.BlockBuilder;
  const { tokenize } = sandbox.HtmlTokenizer;

  // Basic paragraph
  const blocks1 = build(tokenize('<p>Hello World</p>'));
  test('Basic paragraph: creates one block',
    blocks1.length === 1);
  test('Basic paragraph: type is paragraph',
    blocks1[0].type === 'paragraph');
  test('Basic paragraph: text preserved',
    blocks1[0].runs.some(r => r.text.includes('Hello World')));

  // Headings
  const blocks2 = build(tokenize('<h1>Title</h1><h2>Subtitle</h2><p>Text</p>'));
  test('Headings: H1 created',
    blocks2[0].type === 'heading' && blocks2[0].level === 1);
  test('Headings: H2 created',
    blocks2[1].type === 'heading' && blocks2[1].level === 2);
  test('Headings: paragraph follows',
    blocks2[2].type === 'paragraph');

  // CRITICAL: Bold + text + italic preserves space between them
  const blocks3 = build(tokenize('<p><strong>Bold</strong> <em>Italic</em></p>'));
  test('Bold + space + italic: all text present',
    blocks3.length === 1);
  const fullText3 = blocks3[0].runs.map(r => r.text).join('');
  test('Bold + space + italic: complete text with space',
    fullText3.includes('Bold') && fullText3.includes('Italic') && fullText3.includes(' '),
    `Full text: "${fullText3}"`);
  test('Bold + space + italic: bold formatting applied',
    blocks3[0].runs.some(r => r.bold && r.text.includes('Bold')));
  test('Bold + space + italic: italic formatting applied',
    blocks3[0].runs.some(r => r.italic && r.text.includes('Italic')));

  // Unordered list
  const blocks4 = build(tokenize('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>'));
  test('Unordered list: 3 items created',
    blocks4.length === 3);
  test('Unordered list: type is list-item',
    blocks4.every(b => b.type === 'list-item'));
  test('Unordered list: bullet type',
    blocks4.every(b => b.listType === 'bullet'));
  test('Unordered list: all text preserved',
    blocks4[0].runs[0].text.includes('Item 1') &&
    blocks4[1].runs[0].text.includes('Item 2') &&
    blocks4[2].runs[0].text.includes('Item 3'));

  // Ordered list
  const blocks5 = build(tokenize('<ol><li>First</li><li>Second</li></ol>'));
  test('Ordered list: type is ordered',
    blocks5.every(b => b.listType === 'ordered'));
  test('Ordered list: indices increment',
    blocks5[0].listIndex === 0 && blocks5[1].listIndex === 1);

  // Nested list
  const blocks6 = build(tokenize('<ul><li>Top<ul><li>Nested</li></ul></li></ul>'));
  test('Nested list: multiple levels',
    blocks6.some(b => b.listLevel === 0) && blocks6.some(b => b.listLevel === 1));

  // CSS styled spans
  const blocks7 = build(tokenize('<p><span style="font-weight: bold;">CSS Bold</span> normal</p>'));
  test('CSS bold detected',
    blocks7[0].runs.some(r => r.bold && r.text.includes('CSS Bold')));
  test('CSS bold: normal text not bold',
    blocks7[0].runs.some(r => !r.bold && r.text.includes('normal')));

  // Complex mixed formatting
  const html8 = '<p>Normal <strong>bold <em>bold-italic</em></strong> after</p>';
  const blocks8 = build(tokenize(html8));
  const fullText8 = blocks8[0].runs.map(r => r.text).join('');
  test('Mixed formatting: all text preserved',
    fullText8.includes('Normal') && fullText8.includes('bold') &&
    fullText8.includes('bold-italic') && fullText8.includes('after'),
    `Full text: "${fullText8}"`);
  test('Mixed formatting: bold-italic run exists',
    blocks8[0].runs.some(r => r.bold && r.italic));

  // Empty input
  test('Empty input returns empty array',
    build([]).length === 0 && build(null).length === 0);

  // Code formatting
  const blocks9 = build(tokenize('<p>Use <code>console.log()</code> for debugging</p>'));
  test('Code formatting detected',
    blocks9[0].runs.some(r => r.code && r.text.includes('console.log()')));

  // Multiple paragraphs
  const blocks10 = build(tokenize('<p>Para 1</p><p>Para 2</p><p>Para 3</p>'));
  test('Multiple paragraphs: all created',
    blocks10.length === 3);
  test('Multiple paragraphs: all text preserved',
    blocks10[0].runs[0].text.includes('Para 1') &&
    blocks10[1].runs[0].text.includes('Para 2') &&
    blocks10[2].runs[0].text.includes('Para 3'));
}

// ============================================================================
// TEST SUITE 4: PlainTextStructurer
// ============================================================================
console.log('\n\x1b[1m[4] PlainTextStructurer\x1b[0m');
{
  const { structure, isLikelyHeading, parseListItem } = sandbox.PlainTextStructurer;

  // First line as title
  const blocks1 = structure('My Document Title\n\nThis is the first paragraph.\n\nThis is the second paragraph.');
  test('First line becomes heading',
    blocks1[0].type === 'heading' && blocks1[0].level === 1);
  test('Remaining text becomes paragraphs',
    blocks1.filter(b => b.type === 'paragraph').length === 2);
  test('All text preserved',
    blocks1.some(b => b.runs[0].text.includes('My Document Title')) &&
    blocks1.some(b => b.runs[0].text.includes('first paragraph')) &&
    blocks1.some(b => b.runs[0].text.includes('second paragraph')));

  // ALL CAPS heading
  const blocks2 = structure('INTRODUCTION\n\nSome text here.');
  test('ALL CAPS line becomes heading',
    blocks2[0].type === 'heading');

  // Bullet list detection
  const blocks3 = structure('Shopping List\n\n- Apples\n- Bananas\n- Cherries');
  test('Bullet list: items detected',
    blocks3.filter(b => b.type === 'list-item').length === 3);
  test('Bullet list: type is bullet',
    blocks3.filter(b => b.type === 'list-item').every(b => b.listType === 'bullet'));
  test('Bullet list: text preserved',
    blocks3.some(b => b.runs[0].text === 'Apples') &&
    blocks3.some(b => b.runs[0].text === 'Bananas') &&
    blocks3.some(b => b.runs[0].text === 'Cherries'));

  // Numbered list detection
  const blocks4 = structure('Steps\n\n1. First step\n2. Second step\n3. Third step');
  test('Numbered list: items detected',
    blocks4.filter(b => b.type === 'list-item').length === 3);
  test('Numbered list: type is ordered',
    blocks4.filter(b => b.type === 'list-item').every(b => b.listType === 'ordered'));

  // Mixed content
  const blocks5 = structure('Report Title\n\nIntroduction paragraph with details.\n\nKEY FINDINGS\n\n1. Finding one\n2. Finding two\n\nConclusion paragraph.');
  test('Mixed content: has headings',
    blocks5.filter(b => b.type === 'heading').length >= 1);
  test('Mixed content: has paragraphs',
    blocks5.filter(b => b.type === 'paragraph').length >= 2);
  test('Mixed content: has list items',
    blocks5.filter(b => b.type === 'list-item').length === 2);

  // Section headers with colon
  const blocks6 = structure('Name: John\nAge: 30\n\nDetails:\nMore info here.');
  test('Colon-ending lines detected as headers',
    blocks6.some(b => b.type === 'heading' && b.runs[0].text.includes('Details:')));

  // Empty input
  test('Empty input returns empty array',
    structure('').length === 0 && structure(null).length === 0);

  // Single line
  const blocks7 = structure('Just one line');
  test('Single line: creates a heading (as first line)',
    blocks7.length === 1 && blocks7[0].type === 'heading');

  // Very long first line stays as paragraph
  const longLine = 'A'.repeat(130) + '\n\nSecond para.';
  const blocks8 = structure(longLine);
  test('Very long first line: not a heading',
    blocks8[0].type !== 'heading' || blocks8[0].runs[0].text.length <= 120);

  // Asterisk bullet lists
  const blocks9 = structure('List:\n\n* Alpha\n* Beta\n* Gamma');
  test('Asterisk bullets detected',
    blocks9.filter(b => b.type === 'list-item').length === 3);

  // parseListItem helper
  test('parseListItem: bullet dash',
    parseListItem('- Hello') !== null && parseListItem('- Hello').type === 'bullet');
  test('parseListItem: numbered',
    parseListItem('1. First') !== null && parseListItem('1. First').type === 'ordered');
  test('parseListItem: non-list returns null',
    parseListItem('Just text') === null);
}

// ============================================================================
// TEST SUITE 5: HtmlToMarkdown
// ============================================================================
console.log('\n\x1b[1m[5] HtmlToMarkdown\x1b[0m');
{
  const { convert, runsToMarkdownInline, convertPlainText } = sandbox.HtmlToMarkdown;

  // Basic HTML to Markdown
  const md1 = convert('<h1>Title</h1><p>Paragraph text.</p>', 'Title\nParagraph text.');
  test('H1 converted to # heading',
    md1.includes('# Title'));
  test('Paragraph text preserved',
    md1.includes('Paragraph text.'));

  // Multiple heading levels
  const md2 = convert('<h1>H1</h1><h2>H2</h2><h3>H3</h3>', '');
  test('H1 → # H1',
    md2.includes('# H1'));
  test('H2 → ## H2',
    md2.includes('## H2'));
  test('H3 → ### H3',
    md2.includes('### H3'));

  // Bold and italic
  const md3 = convert('<p><strong>Bold</strong> and <em>Italic</em></p>', '');
  test('Bold converted to **Bold**',
    md3.includes('**Bold**'));
  test('Italic converted to *Italic*',
    md3.includes('*Italic*'));

  // Code inline
  const md4 = convert('<p>Use <code>npm install</code> command</p>', '');
  test('Code converted to backticks',
    md4.includes('`npm install`'));

  // Unordered list
  const md5 = convert('<ul><li>Apple</li><li>Banana</li></ul>', '');
  test('Unordered list converted to - items',
    md5.includes('- Apple') && md5.includes('- Banana'));

  // Ordered list
  const md6 = convert('<ol><li>First</li><li>Second</li></ol>', '');
  test('Ordered list converted to numbered items',
    md6.includes('1. First') && md6.includes('2. Second'));

  // Strikethrough
  const md7 = convert('<p><del>Deleted</del> text</p>', '');
  test('Strikethrough converted to ~~text~~',
    md7.includes('~~Deleted~~'));

  // Plain text fallback (no HTML)
  const md8 = convert('', 'My Title\n\nFirst paragraph.\n\nSecond paragraph.');
  test('Plain text: title becomes heading',
    md8.includes('# My Title') || md8.includes('## My Title'));
  test('Plain text: paragraphs preserved',
    md8.includes('First paragraph.') && md8.includes('Second paragraph.'));

  // Plain text with list
  const md9 = convert('', 'Todo List\n\n- Buy milk\n- Clean house\n- Cook dinner');
  test('Plain text list: items preserved in Markdown',
    md9.includes('- Buy milk') && md9.includes('- Clean house'));

  // Bold + Italic combined
  const md10 = convert('<p><strong><em>Bold Italic</em></strong></p>', '');
  test('Bold+Italic converted to ***text***',
    md10.includes('***Bold Italic***'));

  // Empty input
  test('Empty HTML and text returns empty',
    convert('', '').length === 0 || convert('', '') === '');
}

// ============================================================================
// TEST SUITE 6: Complete Pipeline - HTML to Blocks (PDF/DOCX quality)
// ============================================================================
console.log('\n\x1b[1m[6] Complete Pipeline: HTML to Blocks Quality\x1b[0m');
{
  const { tokenize } = sandbox.HtmlTokenizer;
  const { build } = sandbox.BlockBuilder;

  // Test: No text lost in complex HTML
  const complexHtml = `
    <h1>Project Report</h1>
    <p>This is the <strong>introduction</strong> to our <em>important</em> project.</p>
    <h2>Key Findings</h2>
    <ul>
      <li>Finding <strong>one</strong> is significant</li>
      <li>Finding two shows <em>growth</em></li>
      <li>Finding three needs <strong><em>attention</em></strong></li>
    </ul>
    <h2>Conclusion</h2>
    <p>We recommend <strong>immediate action</strong> on all findings.</p>
  `;

  const blocks = build(tokenize(complexHtml));

  test('Complex HTML: has headings',
    blocks.filter(b => b.type === 'heading').length >= 2);
  test('Complex HTML: has paragraphs',
    blocks.filter(b => b.type === 'paragraph').length >= 2);
  test('Complex HTML: has list items',
    blocks.filter(b => b.type === 'list-item').length === 3);

  // Verify NO text is lost
  const allText = blocks.map(b => b.runs.map(r => r.text).join('')).join(' ');
  test('No text lost: "Project Report" present',
    allText.includes('Project Report'));
  test('No text lost: "introduction" present',
    allText.includes('introduction'));
  test('No text lost: "important" present',
    allText.includes('important'));
  test('No text lost: "Key Findings" present',
    allText.includes('Key Findings'));
  test('No text lost: "Finding" items present',
    allText.includes('Finding') && allText.includes('significant'));
  test('No text lost: "growth" present',
    allText.includes('growth'));
  test('No text lost: "attention" present',
    allText.includes('attention'));
  test('No text lost: "Conclusion" present',
    allText.includes('Conclusion'));
  test('No text lost: "immediate action" present',
    allText.includes('immediate action'));

  // Verify formatting is correct
  const findingBlocks = blocks.filter(b => b.type === 'list-item');
  test('List item "one" has bold formatting',
    findingBlocks[0].runs.some(r => r.bold && r.text.includes('one')));
  test('List item "growth" has italic formatting',
    findingBlocks[1].runs.some(r => r.italic && r.text.includes('growth')));

  // Test: spaces between formatted spans
  const spanHtml = '<p>Start <strong>bold</strong> middle <em>italic</em> end</p>';
  const spanBlocks = build(tokenize(spanHtml));
  const spanText = spanBlocks[0].runs.map(r => r.text).join('');
  test('Spaces between formatted spans preserved',
    spanText === 'Start bold middle italic end',
    `Actual: "${spanText}"`);

  // Test: table-like structures (tr/td)
  const tableHtml = '<div><p>Row 1 data</p><p>Row 2 data</p></div>';
  const tableBlocks = build(tokenize(tableHtml));
  const tableText = tableBlocks.map(b => b.runs.map(r => r.text).join('')).join('|');
  test('Div+paragraph content preserved',
    tableText.includes('Row 1 data') && tableText.includes('Row 2 data'));
}

// ============================================================================
// TEST SUITE 7: PdfListContext
// ============================================================================
console.log('\n\x1b[1m[7] PdfListContext\x1b[0m');
{
  const ctx = sandbox.PdfListContext;

  ctx.reset();

  // Bullet list
  test('Bullet prefix is bullet character',
    ctx.getPrefix({ type: 'list-item', listType: 'bullet', listLevel: 0, listIndex: 0 }).includes('\u2022'));

  // Ordered list
  ctx.reset();
  const p1 = ctx.getPrefix({ type: 'list-item', listType: 'ordered', listLevel: 0, listIndex: 0 });
  test('Ordered list first item is "1. "',
    p1 === '1. ', `Actual: "${p1}"`);

  const p2 = ctx.getPrefix({ type: 'list-item', listType: 'ordered', listLevel: 0, listIndex: 1 });
  test('Ordered list second item is "2. "',
    p2 === '2. ', `Actual: "${p2}"`);

  // Non-list block
  test('Non-list block returns null',
    ctx.getPrefix({ type: 'paragraph' }) === null);

  // New list resets counter
  ctx.reset();
  ctx.getPrefix({ type: 'list-item', listType: 'ordered', listLevel: 0, listIndex: 0 });
  ctx.getPrefix({ type: 'list-item', listType: 'ordered', listLevel: 0, listIndex: 1 });
  ctx.getPrefix({ type: 'paragraph' }); // Exit list context
  // This should NOT be a fresh PdfListContext since getPrefix resets on non-list.
  // Create a fresh one through reset:
  ctx.reset();
  const p3 = ctx.getPrefix({ type: 'list-item', listType: 'ordered', listLevel: 0, listIndex: 0 });
  test('New list after reset starts at 1',
    p3 === '1. ', `Actual: "${p3}"`);
}

// ============================================================================
// TEST SUITE 8: Edge Cases & Regression Tests
// ============================================================================
console.log('\n\x1b[1m[8] Edge Cases & Regression\x1b[0m');
{
  const { tokenize } = sandbox.HtmlTokenizer;
  const { build } = sandbox.BlockBuilder;
  const { convert } = sandbox.HtmlToMarkdown;
  const { structure } = sandbox.PlainTextStructurer;

  // Deeply nested formatting
  const deep = '<p><strong><em><u>Deep</u></em></strong></p>';
  const deepBlocks = build(tokenize(deep));
  test('Deeply nested formatting: text preserved',
    deepBlocks[0].runs.some(r => r.text.includes('Deep')));
  test('Deeply nested formatting: all formats applied',
    deepBlocks[0].runs.some(r => r.bold && r.italic && r.underline));

  // Very long text (ensure no truncation)
  const longText = 'A'.repeat(5000);
  const longBlocks = structure(longText);
  const longAllText = longBlocks.map(b => b.runs.map(r => r.text).join('')).join('');
  test('Long text: no truncation (5000 chars)',
    longAllText.length === 5000,
    `Actual length: ${longAllText.length}`);

  // Unicode content
  const unicodeHtml = '<p>Umlaute: \u00E4\u00F6\u00FC\u00DF. Emoji: test. CJK: \u4F60\u597D</p>';
  const unicodeBlocks = build(tokenize(unicodeHtml));
  test('Unicode content preserved',
    unicodeBlocks[0].runs.some(r => r.text.includes('\u00E4\u00F6\u00FC')));

  // Multiple consecutive bold spans
  const multiBold = '<p><b>Word1</b> <b>Word2</b> <b>Word3</b></p>';
  const multiBoldBlocks = build(tokenize(multiBold));
  const multiBoldText = multiBoldBlocks[0].runs.map(r => r.text).join('');
  test('Multiple bold spans: all words present with spaces',
    multiBoldText.includes('Word1') && multiBoldText.includes('Word2') && multiBoldText.includes('Word3'),
    `Text: "${multiBoldText}"`);
  test('Multiple bold spans: spaces between words',
    multiBoldText.includes(' '),
    `Text: "${multiBoldText}"`);

  // HTML with only whitespace text nodes
  const wsHtml = '<div>  \n  </div>';
  const wsBlocks = build(tokenize(wsHtml));
  test('Whitespace-only block handled gracefully',
    wsBlocks.length === 0 || wsBlocks.every(b => b.runs.length === 0 || b.runs.every(r => !r.text.trim())));

  // Line breaks within paragraph
  const brHtml = '<p>Line 1<br>Line 2<br>Line 3</p>';
  const brBlocks = build(tokenize(brHtml));
  const brText = brBlocks[0].runs.map(r => r.text).join('');
  test('Line breaks produce newline characters',
    brText.includes('\n'),
    `Text: "${brText}"`);

  // Markdown: complex real-world content
  const realWorldHtml = `
    <article>
      <h1>Getting Started with FlashDoc</h1>
      <p>FlashDoc is a <strong>powerful</strong> Chrome extension for saving text.</p>
      <h2>Features</h2>
      <ul>
        <li><strong>PDF</strong> generation with formatting</li>
        <li><strong>DOCX</strong> export with Word styles</li>
        <li><strong>Markdown</strong> conversion</li>
      </ul>
      <h2>Usage</h2>
      <ol>
        <li>Select text on any webpage</li>
        <li>Click the FlashDoc button</li>
        <li>Choose your format</li>
      </ol>
      <p>For more details, see the <em>documentation</em>.</p>
    </article>
  `;

  const realBlocks = build(tokenize(realWorldHtml));
  const realText = realBlocks.map(b => b.runs.map(r => r.text).join('')).join('|');

  test('Real-world HTML: headings extracted',
    realBlocks.filter(b => b.type === 'heading').length >= 2);
  test('Real-world HTML: bullet list items',
    realBlocks.filter(b => b.type === 'list-item' && b.listType === 'bullet').length === 3);
  test('Real-world HTML: ordered list items',
    realBlocks.filter(b => b.type === 'list-item' && b.listType === 'ordered').length === 3);
  test('Real-world HTML: all major text present',
    realText.includes('Getting Started') &&
    realText.includes('powerful') &&
    realText.includes('Features') &&
    realText.includes('PDF') &&
    realText.includes('DOCX') &&
    realText.includes('Markdown') &&
    realText.includes('Usage') &&
    realText.includes('Select text') &&
    realText.includes('documentation'));

  // Markdown conversion of real-world content
  const realMd = convert(realWorldHtml, '');
  test('Real-world Markdown: has # heading',
    realMd.includes('# Getting Started'));
  test('Real-world Markdown: has ## heading',
    realMd.includes('## Features') || realMd.includes('## Usage'));
  test('Real-world Markdown: has bold',
    realMd.includes('**PDF**') || realMd.includes('**powerful**'));
  test('Real-world Markdown: has bullet items',
    realMd.includes('- '));
  test('Real-world Markdown: has numbered items',
    realMd.includes('1. '));

  // Plain text structuring of typical copied content
  const plainCopied = `FlashDoc User Guide

FlashDoc is a Chrome extension that converts selected text into files.

FEATURES

- PDF generation
- Word document export
- Markdown conversion
- Auto-format detection

GETTING STARTED

1. Install the extension from Chrome Web Store
2. Select any text on a webpage
3. Click the FlashDoc button or use keyboard shortcuts
4. Choose your desired format

The extension supports multiple languages and Unicode text.`;

  const plainBlocks = structure(plainCopied);
  test('Plain text: title heading detected',
    plainBlocks[0].type === 'heading' && plainBlocks[0].runs[0].text.includes('FlashDoc User Guide'));
  test('Plain text: FEATURES heading detected',
    plainBlocks.some(b => b.type === 'heading' && b.runs[0].text.includes('FEATURES')));
  test('Plain text: bullet list items detected',
    plainBlocks.filter(b => b.type === 'list-item' && b.listType === 'bullet').length === 4);
  test('Plain text: numbered list items detected',
    plainBlocks.filter(b => b.type === 'list-item' && b.listType === 'ordered').length === 4);
  test('Plain text: conclusion paragraph present',
    plainBlocks.some(b => b.type === 'paragraph' && b.runs[0].text.includes('multiple languages')));

  const plainMd = convert('', plainCopied);
  test('Plain Markdown: has heading markers',
    (plainMd.match(/^#+\s/gm) || []).length >= 2);
  test('Plain Markdown: has bullet markers',
    (plainMd.match(/^- /gm) || []).length >= 4);
  test('Plain Markdown: has numbered markers',
    (plainMd.match(/^\d+\. /gm) || []).length >= 4);
}

// ============================================================================
// TEST SUITE 9: Format Completeness Check
// ============================================================================
console.log('\n\x1b[1m[9] Format Completeness Check\x1b[0m');
{
  // Verify that all exported modules have the expected API
  test('EntityDecoder has decode method',
    typeof sandbox.EntityDecoder.decode === 'function');
  test('HtmlTokenizer has tokenize method',
    typeof sandbox.HtmlTokenizer.tokenize === 'function');
  test('BlockBuilder has build method',
    typeof sandbox.BlockBuilder.build === 'function');
  test('PlainTextStructurer has structure method',
    typeof sandbox.PlainTextStructurer.structure === 'function');
  test('HtmlToMarkdown has convert method',
    typeof sandbox.HtmlToMarkdown.convert === 'function');
  test('HtmlToMarkdown has convertPlainText method',
    typeof sandbox.HtmlToMarkdown.convertPlainText === 'function');
  test('PdfListContext has getPrefix method',
    typeof sandbox.PdfListContext.getPrefix === 'function');
  test('PdfListContext has reset method',
    typeof sandbox.PdfListContext.reset === 'function');

  // Verify service-worker.js contains all needed components
  const sw = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf-8');
  test('Service worker has PlainTextStructurer',
    sw.includes('const PlainTextStructurer'));
  test('Service worker has HtmlToMarkdown',
    sw.includes('const HtmlToMarkdown'));
  test('Service worker uses PlainTextStructurer in PDF',
    sw.includes('PlainTextStructurer.structure(content)'));
  test('Service worker uses PlainTextStructurer in DOCX',
    sw.includes('PlainTextStructurer.structure(content)'));
  test('Service worker uses HtmlToMarkdown for MD',
    sw.includes('HtmlToMarkdown.convert(html, content)'));
  test('PDF renderer has word-wrap across runs',
    sw.includes('renderBlockRuns'));
  test('DOCX renderer has professional styling',
    sw.includes('heading1:') || sw.includes("heading1'"));
}

// ============================================================================
// Summary
// ============================================================================
console.log('\n\x1b[1m=== Test Summary ===\x1b[0m');
console.log(`  ${PASS} Passed: ${passed}`);
if (failed > 0) {
  console.log(`  ${FAIL} Failed: ${failed}`);
}
console.log(`  Total: ${totalTests}\n`);

if (failed > 0) {
  console.log('\x1b[31mSome tests failed. Please review and fix.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32mAll format quality tests passed!\x1b[0m\n');
  process.exit(0);
}
