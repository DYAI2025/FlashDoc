#!/usr/bin/env node
/** FLAS-6 real-browser E2E: all save entry points share structured selection semantics. */
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

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

const FIXTURE_HTML = '<div id="fixture"><h2>Structured Selection</h2><p>This contains <strong>bold</strong> and <em>italic</em> content.</p><ul><li>First list item</li><li>Second list item</li></ul><hr><p>Final paragraph.</p></div>';
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
    globalThis.__flas6Exports.push({
      content, type, html, size: result.blob.size,
      markdown: type === 'md' ? await result.blob.text() : null
    });
    return result;
  };
});

const fallbackLogs = [];
sw.on('console', (msg) => { if (msg.type() === 'warning') fallbackLogs.push(msg.text()); });

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

function semanticSignature(record) {
  const html = (record.html || '').toLowerCase();
  return JSON.stringify({
    text: (record.content || '').replace(/\s+/g, ' ').trim(),
    h2: (html.match(/<h2\b/g) || []).length,
    strong: (html.match(/<strong\b/g) || []).length,
    em: (html.match(/<em\b/g) || []).length,
    ul: (html.match(/<ul\b/g) || []).length,
    li: (html.match(/<li\b/g) || []).length,
    hr: (html.match(/<hr\b/g) || []).length
  });
}

console.log('\n=== FLAS-6 browser E2E ===');
const formats = ['md', 'pdf', 'docx'];
const entries = [
  ['Context Menu', triggerContextMenu],
  ['Keyboard Shortcut', triggerKeyboard],
  ['Popup', triggerPopup],
  ['Floating UI', triggerFloating],
  ['Repeat', triggerRepeat]
];

for (const format of formats) {
  const start = await counts();
  for (const [name, trigger] of entries) {
    try { await trigger(format); check(format + ' ' + name + ' reaches export', true); }
    catch (error) { check(format + ' ' + name + ' reaches export', false, error.message); }
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
    check(format + ' payload ' + entries[i][0] + ' source URL is real', p.sourceUrl === PAGE_URL, String(p.sourceUrl));
    check(format + ' payload ' + entries[i][0] + ' frameId is real top frame', p.frameId === 0, String(p.frameId));
  }
  if (data.exports.length === 5) {
    const signatures = data.exports.map(semanticSignature);
    check(format + ' exports are semantically equivalent across triggers', new Set(signatures).size === 1, signatures.join(' | '));
    check(format + ' generated non-empty artifacts', data.exports.every((item) => item.size > 0));
    if (format === 'md') {
      check('Markdown preserves heading', data.exports.every((item) => /^## Structured Selection/m.test(item.markdown || '')));
      check('Markdown preserves bold', data.exports.every((item) => /\*\*bold\*\*/.test(item.markdown || '')));
      check('Markdown preserves italic', data.exports.every((item) => /\*italic\*/.test(item.markdown || '')));
      check('Markdown preserves list', data.exports.every((item) => /[-*] First list item/.test(item.markdown || '')));
      check('Markdown preserves horizontal rule', data.exports.every((item) => /^---$/m.test(item.markdown || '')));
    }
  }
}

await selectFixture();
const id = await tabId();
const fallbackBefore = (await counts()).exports;
await sw.evaluate(({ id, url }) => globalThis.__flashDoc.saveSelection({ text: 'Fallback only', html: '', sourceUrl: url, frameId: 0 }, 'txt', { id, url, title: 'fixture' }), { id, url: PAGE_URL });
await waitForExport(fallbackBefore);
await new Promise((resolve) => setTimeout(resolve, 100));
check('plain-text fallback emits visible log signal', fallbackLogs.some((line) => line.includes('Structured selection fallback: HTML unavailable; using plain text')));
check('fallback log does not leak selected content', fallbackLogs.every((line) => !line.includes('Fallback only')));

await ctx.close();
server.close();
console.log(failures === 0 ? '\nFLAS-6 E2E OK' : '\nFLAS-6 E2E FAILED (' + failures + ')');
process.exit(failures === 0 ? 0 : 1);
