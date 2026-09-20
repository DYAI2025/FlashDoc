#!/usr/bin/env node
/** FLAS-6 real-browser E2E: all save entry points share structured selection semantics. */
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require_ = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require_('playwright')); } catch {
  const pwRoot = process.env.FLASHDOC_PW_ROOT;
  if (!pwRoot) { console.error('playwright not found'); process.exit(1); }
  ({ chromium } = createRequire(path.join(pwRoot, 'x.js'))('playwright'));
}

const extDir = path.resolve(process.argv[2] || '.');
if (!fs.existsSync(path.join(extDir, 'manifest.json'))) { console.error('No manifest.json in ' + extDir); process.exit(1); }

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.error('  ✗ ' + name + ' ' + detail); }
}

const FIXTURE_HTML = '<div id="fixture"><h2>Structured Selection</h2><p>This contains <strong>bold</strong> and <em>italic</em> content.</p><p><strong>Adjacent bold</strong> <em>adjacent italic</em></p><p><strong>Span one</strong><span> </span><em>Span two</em></p><p><strong>Nbsp one</strong><span>&nbsp;</span><em>Nbsp two</em></p><p>before <font color="red">important</font> after</p><ul><li>First list item</li><li>Second list item</li></ul><hr><p>Final paragraph.</p></div>';
const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end('<!doctype html><html><head><title>FLAS-6 fixture</title></head><body>' + FIXTURE_HTML + '</body></html>');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const PAGE_URL = 'http://127.0.0.1:' + server.address().port + '/';

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdoc-flas6-'));
const ctx = await chromium.launchPersistentContext(userDataDir, {
  channel: process.env.FLASHDOC_PW_CHANNEL || 'chromium',
  headless: true,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--enable-unsafe-extension-debugging']
});
const cdp = await ctx.browser().newBrowserCDPSession();
await cdp.send('Extensions.loadUnpacked', { path: extDir });
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
const extId = new URL(sw.url()).host;

await sw.evaluate(async () => {
  await globalThis.__flashDoc.ready;
  await chrome.storage.sync.set({ privacyMode: 'off', showFloatingButton: true, selectionThreshold: 1 });
  await globalThis.__flashDoc.loadSettings();
  await globalThis.__flashDoc.updateContentScriptRegistration();
  globalThis.__flas6Selections = [];
  globalThis.__flas6Exports = [];
  globalThis.__flas6Warnings = [];
  const originalWarn = console.warn.bind(console);
  console.warn = (...args) => {
    globalThis.__flas6Warnings.push(args.map((value) =>
      typeof value === 'string' ? value : JSON.stringify(value)
    ).join(' '));
    originalWarn(...args);
  };
  const fd = globalThis.__flashDoc;
  const originalSaveSelection = fd.saveSelection.bind(fd);
  fd.saveSelection = async (selection, type, tab, options = {}) => {
    const normalized = FlashDocSelection.withRuntimeContext(selection, { sourceUrl: tab?.url || null });
    globalThis.__flas6Selections.push({ ...normalized, type });
    return originalSaveSelection(selection, type, tab, options);
  };
  const originalCreateBlob = fd.createBlob.bind(fd);
  fd.createBlob = async (content, type, html) => {
    const result = await originalCreateBlob(content, type, html);
    const canonicalBlocks = fd.buildCanonicalBlocks(content, html).map((block) => ({
      type: block.type,
      level: block.level || null,
      listType: block.listType || null,
      listLevel: block.listLevel || 0,
      runs: (block.runs || []).map((run) => ({
        text: run.text || '',
        bold: Boolean(run.bold),
        italic: Boolean(run.italic),
        underline: Boolean(run.underline),
        strikethrough: Boolean(run.strikethrough),
        code: Boolean(run.code)
      }))
    }));
    const docxBytes = type === 'docx'
      ? Array.from(new Uint8Array(await result.blob.arrayBuffer()))
      : null;
    globalThis.__flas6Exports.push({
      content, type, html, canonicalBlocks, size: result.blob.size, docxBytes,
      markdown: type === 'md' ? await result.blob.text() : null
    });
    return result;
  };
});

const page = await ctx.newPage();
await page.goto(PAGE_URL);
await page.waitForTimeout(1500);

async function selectFixture() {
  await page.bringToFront();
  await page.evaluate(() => {
    const fixture = document.getElementById('fixture');
    const range = document.createRange();
    range.selectNodeContents(fixture);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.waitForTimeout(350);
}

async function tabId() {
  return sw.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === url)?.id || null;
  }, PAGE_URL);
}

async function counts() {
  return sw.evaluate(() => ({ selections: globalThis.__flas6Selections.length, exports: globalThis.__flas6Exports.length }));
}

async function waitForExport(previous) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const current = await counts();
    if (current.exports > previous) return current;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for export');
}

async function currentText() { return page.evaluate(() => window.getSelection().toString()); }

async function triggerContextMenu(format) {
  await selectFixture();
  const id = await tabId();
  const text = await currentText();
  const before = (await counts()).exports;
  await sw.evaluate(({ id, text, format }) => {
    globalThis.__flashDoc.onContextMenuClicked({ menuItemId: 'flashdoc-' + format, selectionText: text, frameId: 0 }, { id, url: location.origin, title: 'fixture' });
  }, { id, text, format });
  await waitForExport(before);
}

async function triggerKeyboard(format) {
  await selectFixture();
  const before = (await counts()).exports;
  await sw.evaluate((format) => globalThis.__flashDoc.getSelectionAndSave(format), format);
  await waitForExport(before);
}

async function openPopup() {
  const popup = await ctx.newPage();
  await popup.goto('chrome-extension://' + extId + '/popup.html');
  await popup.waitForTimeout(700);
  return popup;
}

async function triggerPopup(format) {
  await selectFixture();
  const popup = await openPopup();
  await page.bringToFront();
  const before = (await counts()).exports;
  await popup.evaluate((format) => document.querySelector('.action-card[data-action="' + format + '"]').click(), format);
  await waitForExport(before);
  await popup.close();
}

async function triggerFloating(format) {
  await selectFixture();
  const before = (await counts()).exports;
  const selector = '.flashdoc-fab-option[data-format="' + format + '"]';
  await page.waitForSelector(selector, { timeout: 5000 });
  await page.evaluate((selector) => document.querySelector(selector).click(), selector);
  await waitForExport(before);
}

async function triggerRepeat(format) {
  await selectFixture();
  const popup = await openPopup();
  await page.bringToFront();
  await popup.waitForFunction((format) => {
    const button = document.getElementById('repeat-action-btn');
    const type = document.getElementById('repeat-type');
    return button && !button.classList.contains('hidden') && type && type.textContent === '.' + format;
  }, format, { timeout: 5000 });
  const before = (await counts()).exports;
  await popup.evaluate(() => document.getElementById('repeat-action-btn').click());
  await waitForExport(before);
  await popup.close();
}

function normalizeText(value) {
  return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function canonicalSignature(record) {
  return JSON.stringify(record.canonicalBlocks || []);
}

function canonicalText(record) {
  return normalizeText((record.canonicalBlocks || [])
    .map((block) => (block.runs || []).map((run) => run.text || '').join(''))
    .join(' '));
}

function extractDocxText(bytes) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdoc-docx-'));
  const docxPath = path.join(dir, 'artifact.docx');
  fs.writeFileSync(docxPath, Buffer.from(bytes || []));
  const unzip = spawnSync('unzip', ['-p', docxPath, 'word/document.xml'], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  if (unzip.status !== 0) {
    throw new Error('DOCX document.xml extraction failed: ' + (unzip.stderr || unzip.status));
  }
  const xml = unzip.stdout || '';
  return normalizeText(
    Array.from(xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g))
      .map((match) => match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'"))
      .join('')
  );
}

const oracleGood = { canonicalBlocks: [{ type: 'paragraph', runs: [
  { text: 'one', bold: true }, { text: ' ', bold: false }, { text: 'two', italic: true }
]}] };
const oracleBad = { canonicalBlocks: [{ type: 'paragraph', runs: [
  { text: 'one', bold: true }, { text: 'two', italic: true }
]}] };
check('canonical oracle distinguishes material whitespace loss',
  canonicalSignature(oracleGood) !== canonicalSignature(oracleBad));

console.log('\n=== FLAS-6 browser verification ===');
const formats = ['md', 'pdf', 'docx'];
const entries = [
  ['Context Menu', triggerContextMenu, 'browser-integration'],
  ['Keyboard Shortcut', triggerKeyboard, 'browser-integration'],
  ['Popup', triggerPopup, 'ui-e2e'],
  ['Floating UI', triggerFloating, 'ui-e2e'],
  ['Repeat', triggerRepeat, 'ui-e2e']
];

for (const format of formats) {
  const start = await counts();
  for (const [name, trigger, coverage] of entries) {
    try { await trigger(format); check(format + ' ' + name + ' [' + coverage + '] reaches export', true); }
    catch (error) { check(format + ' ' + name + ' [' + coverage + '] reaches export', false, error.message); }
  }
  const data = await sw.evaluate((startIndex) => ({
    selections: globalThis.__flas6Selections.slice(startIndex),
    exports: globalThis.__flas6Exports.slice(startIndex)
  }), start.exports);
  check(format + ' produced five selection payloads', data.selections.length === 5, 'got ' + data.selections.length);
  check(format + ' produced five exports', data.exports.length === 5, 'got ' + data.exports.length);
  for (let i = 0; i < data.selections.length; i++) {
    const p = data.selections[i];
    check(format + ' payload ' + entries[i][0] + ' has exact keys', JSON.stringify(Object.keys(p).filter((k) => k !== 'type').sort()) === JSON.stringify(['frameId','html','sourceUrl','text']));
    check(format + ' payload ' + entries[i][0] + ' preserves structured HTML', /<h2\b/i.test(p.html) && /<strong\b/i.test(p.html) && /<em\b/i.test(p.html) && /<ul\b/i.test(p.html) && /<hr\b/i.test(p.html));
    check(format + ' payload ' + entries[i][0] + ' preserves adjacent inline whitespace', /<\/strong>\s+<em\b/i.test(p.html));
    check(format + ' payload ' + entries[i][0] + ' unwraps whitespace-only span without losing separator',
      /<strong>Span one<\/strong>\s+<em>Span two<\/em>/i.test(p.html), p.html);
    check(format + ' payload ' + entries[i][0] + ' unwraps nbsp-only span without losing separator',
      /<strong>Nbsp one<\/strong>(?:&nbsp;|&#160;|&#x0*a0;|\u00a0)<em>Nbsp two<\/em>/i.test(p.html), p.html);
    check(format + ' payload ' + entries[i][0] + ' preserves legacy font text', p.html.includes('important'));
    check(format + ' payload ' + entries[i][0] + ' source URL is real', p.sourceUrl === PAGE_URL, String(p.sourceUrl));
    check(format + ' payload ' + entries[i][0] + ' frameId is real top frame', p.frameId === 0, String(p.frameId));
  }
  if (data.exports.length === 5) {
    const signatures = data.exports.map(canonicalSignature);
    check(format + ' canonical renderer inputs are equivalent across triggers',
      new Set(signatures).size === 1, signatures.join(' | '));
    check(format + ' canonical text retains whitespace-span semantics',
      data.exports.every((item) => canonicalText(item).includes('Span one Span two')));
    check(format + ' canonical text retains nbsp-span semantics',
      data.exports.every((item) => canonicalText(item).includes('Nbsp one Nbsp two')));
    check(format + ' generated non-empty artifacts', data.exports.every((item) => item.size > 0));
    if (format === 'md') {
      check('Markdown preserves heading', data.exports.every((item) => /^## Structured Selection/m.test(item.markdown || '')));
      check('Markdown preserves bold', data.exports.every((item) => /\*\*bold\*\*/.test(item.markdown || '')));
      check('Markdown preserves italic', data.exports.every((item) => /\*italic\*/.test(item.markdown || '')));
      check('Markdown preserves list', data.exports.every((item) => /[-*] First list item/.test(item.markdown || '')));
      check('Markdown preserves horizontal rule', data.exports.every((item) => /^---$/m.test(item.markdown || '')));
      check('Markdown preserves adjacent inline whitespace', data.exports.every((item) => /\*\*Adjacent bold\*\*\s+\*adjacent italic\*/.test(item.markdown || '')));
      check('Markdown preserves legacy font text', data.exports.every((item) => /before\s+important\s+after/.test(item.markdown || '')));
      check('Markdown artifact preserves whitespace-only span semantics',
        data.exports.every((item) => /\*\*Span one\*\*\s+\*Span two\*/.test(item.markdown || '')));
      check('Markdown artifact preserves nbsp-span semantics',
        data.exports.every((item) => /\*\*Nbsp one\*\*\s+\*Nbsp two\*/.test(item.markdown || '')));
    }
    if (format === 'docx') {
      const docxTexts = data.exports.map((item) => extractDocxText(item.docxBytes));
      check('DOCX document.xml preserves whitespace-only span semantics',
        docxTexts.every((text) => text.includes('Span one Span two')), docxTexts.join(' | '));
      check('DOCX document.xml preserves nbsp-span semantics',
        docxTexts.every((text) => text.includes('Nbsp one Nbsp two')), docxTexts.join(' | '));
      check('DOCX document.xml text is equivalent across triggers',
        new Set(docxTexts).size === 1, docxTexts.join(' | '));
    }
    if (format === 'pdf') {
      check('PDF claim is bound to shared canonical block representation',
        data.exports.every((item) => Array.isArray(item.canonicalBlocks) && item.canonicalBlocks.length > 0));
    }
  }
}

// Semantic mismatch must fail closed to plain text before rendering.
const mismatchBefore = (await counts()).exports;
await sw.evaluate(({ url }) => globalThis.__flashDoc.saveSelection({
  text: 'one two',
  html: '<strong>one</strong><em>two</em>',
  sourceUrl: url,
  frameId: 0
}, 'md', { id: 1, url, title: 'fixture' }), { url: PAGE_URL });
await waitForExport(mismatchBefore);
const mismatchData = await sw.evaluate((index) => ({
  exported: globalThis.__flas6Exports[index],
  warnings: globalThis.__flas6Warnings.slice()
}), mismatchBefore);
check('semantic mismatch clears structured HTML before renderer',
  mismatchData.exported?.html === '', String(mismatchData.exported?.html));
check('semantic mismatch falls back to complete plain text artifact',
  /one two/.test(mismatchData.exported?.markdown || ''), String(mismatchData.exported?.markdown));
check('semantic mismatch emits visible metadata-only warning',
  mismatchData.warnings.some((line) => line.includes('HTML/text semantic mismatch; using plain text')));
check('semantic mismatch warning does not leak selected text',
  mismatchData.warnings.every((line) => !line.includes('one two') && !line.includes('<strong>')));

await selectFixture();
const id = await tabId();
const fallbackBefore = (await counts()).exports;
await sw.evaluate(({ id, url }) => globalThis.__flashDoc.saveSelection({ text: 'Fallback only', html: '', sourceUrl: url, frameId: 0 }, 'txt', { id, url, title: 'fixture' }), { id, url: PAGE_URL });
await waitForExport(fallbackBefore);
await new Promise((resolve) => setTimeout(resolve, 100));
const fallbackLogs = await sw.evaluate(() => globalThis.__flas6Warnings.slice());
check('plain-text fallback emits visible log signal', fallbackLogs.some((line) => line.includes('Structured selection fallback: HTML unavailable; using plain text')));
check('fallback log does not leak selected content', fallbackLogs.every((line) => !line.includes('Fallback only')));

await ctx.close();
server.close();
console.log(failures === 0 ? '\nFLAS-6 BROWSER VERIFICATION OK' : '\nFLAS-6 BROWSER VERIFICATION FAILED (' + failures + ')');
process.exit(failures === 0 ? 0 : 1);
