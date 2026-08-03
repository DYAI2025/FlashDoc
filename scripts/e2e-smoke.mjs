#!/usr/bin/env node
/**
 * FlashDoc browser E2E smoke (FLAS-2/3/4/5) — real Chromium evidence.
 *
 * Loads the EXTRACTED store artifact (or a given directory) into Chromium via
 * Playwright and asserts:
 *   1. FLAS-2: extension loads — service worker appears, manifest_version 3.
 *   2. FLAS-3: i18n resolves — extensionName message non-empty, popup page
 *      contains no raw __MSG_ tokens (en and de runs).
 *   3. FLAS-5 off-mode: content script registered; FlashDoc UI present on a
 *      real http page.
 *   4. FLAS-5 on-mode: no registration, zero FlashDoc DOM nodes before
 *      activation; after explicit activation exactly one FlashDoc instance.
 *
 * Usage: node scripts/e2e-smoke.mjs [extensionDir]
 * Exit 0 = all green, 1 = failure.
 */

import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Resolve playwright from: local node_modules → $FLASHDOC_PW_ROOT.
// The repo intentionally has no package.json; CI installs playwright ad hoc.
const require_ = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require_('playwright'));
} catch {
  const pwRoot = process.env.FLASHDOC_PW_ROOT;
  if (!pwRoot) {
    console.error('playwright not found. Install it (npm i playwright) or set FLASHDOC_PW_ROOT to a node_modules dir containing it.');
    process.exit(1);
  }
  ({ chromium } = createRequire(path.join(pwRoot, 'x.js'))('playwright'));
}

const extDir = path.resolve(process.argv[2] || '.');
if (!fs.existsSync(path.join(extDir, 'manifest.json'))) {
  console.error(`No manifest.json in ${extDir}`);
  process.exit(1);
}

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`  ✓ ${name}`);
  else { failures++; console.error(`  ✗ ${name} ${detail}`); }
}

// Tiny http server — content scripts don't run on file:// by default.
const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end('<html><head><title>sensitive test page</title></head><body><p>account balance secret text for selection tests</p></body></html>');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PAGE_URL = `http://127.0.0.1:${server.address().port}/`;

async function launch(lang) {
  // Chrome for Testing >= M136 removed --load-extension; the supported path
  // is the CDP command Extensions.loadUnpacked, which requires the
  // --enable-unsafe-extension-debugging switch.
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flashdoc-e2e-'));
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: process.env.FLASHDOC_PW_CHANNEL || 'chromium',
    headless: true,
    // Playwright injects --disable-extensions by default, which also kills
    // CDP-installed extensions — it must be suppressed.
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      '--enable-unsafe-extension-debugging',
      `--lang=${lang}`
    ]
  });
  const cdp = await ctx.browser().newBrowserCDPSession();
  await cdp.send('Extensions.loadUnpacked', { path: extDir });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
  return { ctx, sw, userDataDir };
}

async function flashdocNodeCount(page) {
  return page.evaluate(() =>
    document.querySelectorAll('[class*="flashdoc"], [id*="flashdoc"]').length);
}

// ---------------- Run 1: en, default settings (privacy off) ----------------
console.log(`\n== Run 1 (lang=en, privacy off) — ${extDir}`);
{
  const { ctx, sw } = await launch('en');
  const extId = new URL(sw.url()).host;

  const mv = await sw.evaluate(() => chrome.runtime.getManifest().manifest_version);
  check('FLAS-2: service worker up, manifest_version === 3', mv === 3, `got ${mv}`);

  const name = await sw.evaluate(() => chrome.i18n.getMessage('extensionName'));
  check('FLAS-3: chrome.i18n resolves extensionName (en)', !!name, JSON.stringify(name));

  // give init() time to register content scripts
  await new Promise((r) => setTimeout(r, 1000));
  const regs = await sw.evaluate(() => chrome.scripting.getRegisteredContentScripts());
  check('FLAS-5: off-mode has dynamic registration', regs.some((r) => r.id === 'flashdoc-content'),
    JSON.stringify(regs));

  const page = await ctx.newPage();
  await page.goto(PAGE_URL);
  await page.waitForTimeout(1500);
  const nodes = await flashdocNodeCount(page);
  check('FLAS-5: off-mode injects UI on http page', nodes > 0, `nodes=${nodes}`);

  const popup = await ctx.newPage();
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await popup.waitForTimeout(800);
  const text = await popup.evaluate(() => document.body.innerText + ' ' + document.title);
  check('FLAS-3: popup shows no raw __MSG_ tokens (en)', !text.includes('__MSG_'),
    text.split('\n').filter((l) => l.includes('__MSG_')).slice(0, 3).join(' | '));

  await ctx.close();
}

// ---------------- Run 2: de — i18n parity ---------------------------------
console.log('\n== Run 2 (lang=de)');
{
  const { ctx, sw } = await launch('de');
  const extId = new URL(sw.url()).host;

  const lang = await sw.evaluate(() => chrome.i18n.getUILanguage());
  const name = await sw.evaluate(() => chrome.i18n.getMessage('extensionName'));
  check(`FLAS-3: chrome.i18n resolves extensionName (ui=${lang})`, !!name, JSON.stringify(name));

  const popup = await ctx.newPage();
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await popup.waitForTimeout(800);
  const text = await popup.evaluate(() => document.body.innerText + ' ' + document.title);
  check('FLAS-3: popup shows no raw __MSG_ tokens (de)', !text.includes('__MSG_'),
    text.split('\n').filter((l) => l.includes('__MSG_')).slice(0, 3).join(' | '));

  await ctx.close();
}

// ---------------- Run 3: privacy mode ON ----------------------------------
console.log('\n== Run 3 (privacy mode on)');
{
  const { ctx, sw } = await launch('en');
  const extId = new URL(sw.url()).host;

  await sw.evaluate(() => chrome.storage.sync.set({ privacyMode: 'on' }));
  // Ask the SW to reload settings + registration via an extension page.
  const helper = await ctx.newPage();
  await helper.goto(`chrome-extension://${extId}/popup.html`);
  await helper.evaluate(() => chrome.runtime.sendMessage({ action: 'refreshSettings' }));
  await helper.waitForTimeout(800);

  const regs = await sw.evaluate(() => chrome.scripting.getRegisteredContentScripts());
  check('FLAS-5: on-mode has NO content script registration', regs.length === 0,
    JSON.stringify(regs));

  const page = await ctx.newPage();
  await page.goto(PAGE_URL);
  await page.waitForTimeout(1500);
  const before = await flashdocNodeCount(page);
  check('FLAS-5: sensitive page has ZERO FlashDoc DOM nodes pre-activation', before === 0,
    `nodes=${before}`);

  // Explicit activation: what the popup Activate button does.
  const tabId = await sw.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    return tabs.find((t) => t.url === url)?.id;
  }, PAGE_URL);
  check('found test tab for activation', !!tabId, '');

  if (tabId) {
    await sw.evaluate(async (id) => {
      await chrome.scripting.executeScript({
        target: { tabId: id, allFrames: true },
        files: ['detection-utils.js', 'content.js']
      });
    }, tabId);
    await page.waitForTimeout(500);
    await sw.evaluate((id) => chrome.tabs.sendMessage(id, { action: 'activateOnPage' }), tabId);
    await page.waitForTimeout(800);

    const buttons = await page.evaluate(() =>
      document.querySelectorAll('.flashdoc-floating').length);
    check('FLAS-5: after activation exactly one floating-button instance', buttons === 1,
      `buttons=${buttons}`);

    // Idempotency: inject + activate again — still exactly one instance.
    await sw.evaluate(async (id) => {
      await chrome.scripting.executeScript({
        target: { tabId: id, allFrames: true },
        files: ['detection-utils.js', 'content.js']
      });
      await chrome.tabs.sendMessage(id, { action: 'activateOnPage' });
    }, tabId);
    await page.waitForTimeout(800);
    const buttons2 = await page.evaluate(() =>
      document.querySelectorAll('.flashdoc-floating').length);
    check('FLAS-5: repeated injection/activation stays at one instance', buttons2 === 1,
      `buttons=${buttons2}`);
  }

  await ctx.close();
}

server.close();
console.log(failures === 0 ? '\nE2E SMOKE OK' : `\nE2E SMOKE FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
