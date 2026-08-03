#!/usr/bin/env node
/**
 * FlashDoc extension validator (FLAS-2, FLAS-3, FLAS-4).
 *
 * Usage: node scripts/validate-extension.cjs [extensionRootDir] [--list-files]
 *
 * Checks (fail-closed, exit 1 on any error):
 *  1. manifest.json is strict JSON, manifest_version === 3, default_locale set
 *     when _locales/ exists.
 *  2. Every _locales/<loc>/messages.json is Chrome-conformant: flat top-level
 *     keys matching /^[a-zA-Z0-9_@]+$/, each an object with a string `message`.
 *  3. Every __MSG_key__ placeholder referenced in manifest.json and *.html
 *     resolves to a key in the default locale.
 *  4. Locale parity: every non-default locale is a key-subset of the default
 *     locale (missing keys are OK — Chrome falls back; unknown keys fail).
 *  5. Every file referenced by the manifest, HTML script/link tags and
 *     service-worker importScripts() exists on disk.
 *
 * --list-files prints the derived runtime file list (used by build-zip.sh)
 * and suppresses the human-readable report on success.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).filter(Boolean);
const listFiles = args.includes('--list-files');
const ROOT = path.resolve(args.find((a) => !a.startsWith('--')) || '.');

const errors = [];
const info = [];

function fail(msg) { errors.push(msg); }

function readJsonStrict(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

// ---- 1. Manifest ----------------------------------------------------------
const manifestPath = path.join(ROOT, 'manifest.json');
let manifest = null;
try {
  manifest = readJsonStrict(manifestPath);
  info.push('manifest.json: strict JSON parse OK');
} catch (e) {
  fail(`manifest.json is not valid JSON: ${e.message}`);
}

if (manifest) {
  if (manifest.manifest_version !== 3) {
    fail(`manifest_version must be the integer 3, got: ${JSON.stringify(manifest.manifest_version)}`);
  }
  const hasLocales = fs.existsSync(path.join(ROOT, '_locales'));
  if (hasLocales && !manifest.default_locale) {
    fail('_locales/ exists but manifest has no default_locale');
  }
}

// ---- 2. Locale files ------------------------------------------------------
const KEY_RE = /^[a-zA-Z0-9_@]+$/;
const localesDir = path.join(ROOT, '_locales');
const localeKeys = {}; // locale -> Set of keys

if (fs.existsSync(localesDir)) {
  for (const loc of fs.readdirSync(localesDir)) {
    const msgFile = path.join(localesDir, loc, 'messages.json');
    if (!fs.existsSync(msgFile)) continue; // e.g. rtl.css lives in _locales/
    let msgs;
    try {
      msgs = readJsonStrict(msgFile);
    } catch (e) {
      fail(`_locales/${loc}/messages.json invalid JSON: ${e.message}`);
      continue;
    }
    localeKeys[loc] = new Set(Object.keys(msgs));
    for (const [key, val] of Object.entries(msgs)) {
      if (!KEY_RE.test(key)) {
        fail(`_locales/${loc}: key "${key}" violates Chrome key contract ${KEY_RE}`);
      }
      if (!val || typeof val !== 'object' || typeof val.message !== 'string') {
        fail(`_locales/${loc}: key "${key}" has no string "message" element`);
      }
    }
    info.push(`_locales/${loc}: ${Object.keys(msgs).length} keys, schema OK`);
  }
}

// ---- 3. __MSG_ references -------------------------------------------------
const defaultLocale = manifest && manifest.default_locale;
const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const msgRefs = new Map(); // key -> [sources]

function collectMsgRefs(text, source) {
  for (const m of text.matchAll(/__MSG_([A-Za-z0-9_@.]+?)__/g)) {
    const key = m[1];
    if (!msgRefs.has(key)) msgRefs.set(key, []);
    msgRefs.get(key).push(source);
  }
}

if (fs.existsSync(manifestPath)) {
  collectMsgRefs(fs.readFileSync(manifestPath, 'utf8'), 'manifest.json');
}
for (const f of htmlFiles) {
  collectMsgRefs(fs.readFileSync(path.join(ROOT, f), 'utf8'), f);
}

if (defaultLocale && localeKeys[defaultLocale]) {
  for (const [key, sources] of msgRefs) {
    if (!KEY_RE.test(key)) {
      fail(`__MSG_${key}__ (${[...new Set(sources)].join(', ')}) uses an illegal key (dots etc.)`);
    } else if (!localeKeys[defaultLocale].has(key)) {
      fail(`__MSG_${key}__ (${[...new Set(sources)].join(', ')}) missing in _locales/${defaultLocale}`);
    }
  }
  info.push(`__MSG_ references: ${msgRefs.size} distinct keys checked against ${defaultLocale}`);
} else if (msgRefs.size > 0) {
  fail(`Found ${msgRefs.size} __MSG_ references but no default locale to resolve them`);
}

// ---- 4. Locale parity -----------------------------------------------------
if (defaultLocale && localeKeys[defaultLocale]) {
  const base = localeKeys[defaultLocale];
  for (const [loc, keys] of Object.entries(localeKeys)) {
    if (loc === defaultLocale) continue;
    const unknown = [...keys].filter((k) => !base.has(k));
    if (unknown.length) {
      fail(`_locales/${loc}: keys not present in ${defaultLocale}: ${unknown.slice(0, 10).join(', ')}${unknown.length > 10 ? ' …' : ''}`);
    }
    const missing = [...base].filter((k) => !keys.has(k)).length;
    info.push(`_locales/${loc}: subset OK, ${missing} keys fall back to ${defaultLocale}`);
  }
}

// ---- 5. Referenced files exist -------------------------------------------
const runtimeFiles = new Set(['manifest.json']);

function addRef(rel, source) {
  const clean = rel.replace(/^\.\//, '').split('?')[0].split('#')[0];
  if (!clean || /^(https?:|chrome:|data:)/.test(clean)) return;
  runtimeFiles.add(clean);
  if (!fs.existsSync(path.join(ROOT, clean))) {
    fail(`${source} references missing file: ${clean}`);
  }
}

if (manifest) {
  if (manifest.background && manifest.background.service_worker) {
    addRef(manifest.background.service_worker, 'manifest background');
  }
  for (const v of Object.values(manifest.icons || {})) addRef(v, 'manifest icons');
  if (manifest.action) {
    if (manifest.action.default_popup) addRef(manifest.action.default_popup, 'manifest action');
    for (const v of Object.values(manifest.action.default_icon || {})) addRef(v, 'manifest action icon');
  }
  if (manifest.options_page) addRef(manifest.options_page, 'manifest options_page');
  for (const cs of manifest.content_scripts || []) {
    for (const f of cs.js || []) addRef(f, 'manifest content_scripts');
    for (const f of cs.css || []) addRef(f, 'manifest content_scripts css');
  }
  for (const war of manifest.web_accessible_resources || []) {
    for (const f of war.resources || []) if (!f.includes('*')) addRef(f, 'manifest war');
  }
}

for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) addRef(m[1], f);
  for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)) addRef(m[1], f);
  runtimeFiles.add(f);
}

// importScripts() and scripting-API file refs from runtime JS files.
// registerContentScripts/executeScript reference files via `files: [...]`
// arrays that no static manifest entry covers — they must ship too.
for (const f of [...runtimeFiles].filter((f) => f.endsWith('.js'))) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/importScripts\(([^)]+)\)/g)) {
    for (const arg of m[1].matchAll(/["']([^"']+)["']/g)) addRef(arg[1], `${f} importScripts`);
  }
  for (const m of src.matchAll(/\bfiles:\s*\[([^\]]+)\]/g)) {
    for (const arg of m[1].matchAll(/["']([^"']+\.(?:js|css))["']/g)) {
      addRef(arg[1], `${f} scripting files`);
    }
  }
}

// Whole directories that must ship
for (const dir of ['_locales', 'lib', 'privacy']) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) continue;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name !== '.DS_Store') runtimeFiles.add(path.relative(ROOT, full));
    }
  };
  walk(p);
}

// ---- Report ---------------------------------------------------------------
if (errors.length) {
  console.error(`VALIDATION FAILED (${errors.length} error${errors.length > 1 ? 's' : ''}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

if (listFiles) {
  for (const f of [...runtimeFiles].sort()) console.log(f);
} else {
  for (const i of info) console.log(`  ✓ ${i}`);
  console.log(`VALIDATION OK — ${runtimeFiles.size} runtime files verified in ${ROOT}`);
}
