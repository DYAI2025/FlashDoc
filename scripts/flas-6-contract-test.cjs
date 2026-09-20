#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(process.argv[2] || '.');
let failures = 0;
const check = (name, condition, detail = '') => {
  if (condition) console.log('  ✓ ' + name);
  else { failures++; console.error('  ✗ ' + name + ' ' + detail); }
};

const contractSource = fs.readFileSync(path.join(root, 'selection-payload.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(contractSource, sandbox, { filename: 'selection-payload.js' });
const api = sandbox.FlashDocSelection;

console.log('\n=== FLAS-6 selection contract ===');
check('shared contract is exported', !!api);
check('contract fields are exact', JSON.stringify(Array.from(api.fields)) === JSON.stringify(['text','html','sourceUrl','frameId']));

const structured = api.createSelectionPayload({
  text: 'Structured Selection',
  html: '<h2>Structured Selection</h2><p><strong>bold</strong> <em>italic</em></p><ul><li>item</li></ul><hr>',
  sourceUrl: 'https://example.test/page',
  frameId: 3
});
check('structured payload preserves text', structured.text === 'Structured Selection');
check('structured payload preserves html', structured.html.includes('<strong>bold</strong>'));
check('structured payload preserves sourceUrl', structured.sourceUrl === 'https://example.test/page');
check('structured payload preserves frameId', structured.frameId === 3);

const whitespaceSpan = api.createSelectionPayload({
  text: 'one two',
  html: '<strong>one</strong><span> </span><em>two</em>'
});
check('whitespace-only span is unwrapped without deleting its separator',
  whitespaceSpan.html === '<strong>one</strong> <em>two</em>',
  whitespaceSpan.html);

const nbspSpan = api.createSelectionPayload({
  text: 'one\u00a0two',
  html: '<strong>one</strong><span>&nbsp;</span><em>two</em>'
});
check('nbsp-only span is unwrapped without deleting its separator',
  nbspSpan.html === '<strong>one</strong>&nbsp;<em>two</em>',
  nbspSpan.html);

const legacyFont = api.createSelectionPayload({
  text: 'before important after',
  html: 'before <font color="red">important</font> after'
});
check('legacy font wrapper is removed without deleting text',
  legacyFont.html === 'before important after',
  legacyFont.html);

const unsafeMarkup = api.createSelectionPayload({
  text: 'safe',
  html: '<style>.x{}</style><script>alert(1)</script><!--comment--><strong>safe</strong>'
});
check('script/style/comments are stripped centrally',
  unsafeMarkup.html === '<strong>safe</strong>',
  unsafeMarkup.html);

check('comparable text canonicalizes NBSP and whitespace',
  api.normalizeComparableText('one\u00a0\n two') === 'one two');

const unavailable = api.createSelectionPayload({ text: 'plain', html: null, sourceUrl: null, frameId: undefined });
check('html absence is explicit empty string', unavailable.html === '');
check('unknown sourceUrl is explicit null', unavailable.sourceUrl === null);
check('unknown frameId is explicit null', unavailable.frameId === null);
check('structured-html predicate false for fallback', api.hasStructuredHtml(unavailable) === false);

const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const popup = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');
const content = fs.readFileSync(path.join(root, 'content.js'), 'utf8');
const popupHtml = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');

check('service worker imports shared contract', sw.includes("importScripts('./selection-payload.js')"));
check('service worker exposes one saveSelection boundary', (sw.match(/async saveSelection\(/g) || []).length === 1);
check('context menu uses canonical extraction', sw.includes('this.getSelectionPayloadFromTab(tab, info.frameId, info.selectionText)'));
check('keyboard command path uses canonical extraction', sw.includes('const selection = await this.getSelectionPayloadFromTab(tab);'));
check('runtime saveContent normalizes selection', sw.includes('message.selection || legacySelection'));
check('plain-text fallback is visibly logged', sw.includes('Structured selection fallback: HTML unavailable; using plain text'));
check('fallback log does not include selected text argument', !sw.includes("console.warn('[FlashDoc] Structured selection fallback: HTML unavailable; using plain text', selection"));
check('popup loads shared contract before popup logic', popupHtml.indexOf('selection-payload.js') >= 0 && popupHtml.indexOf('selection-payload.js') < popupHtml.indexOf('popup.js'));
check('popup sends selection object', popup.includes('selection: FlashDocSelection.createSelectionPayload(selection)'));
check('repeat reuses canonical selection', popup.includes('const selectionResult = await getSelectionPayload(tab.id);') && popup.includes('sendSaveRequest(selection, lastActionData.type)'));
check('floating UI sends canonical selection', content.includes('selection: this.createSelectionPayload()'));
check('content scripts include shared contract', sw.includes("js: ['detection-utils.js', 'selection-payload.js', 'content.js']"));

check('service worker no longer owns selection span sanitizing',
  !sw.includes(".replace(/<span[^>]*>\\s*<\\/span>/gi, '')"));
check('popup no longer owns selection style/script sanitizing',
  !popup.includes(".replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi, '')"));
check('content script no longer owns destructive whitespace-span sanitizing',
  !content.includes(".replace(/<span[^>]*>\\s*<\\/span>/gi, '')") &&
  !content.includes(".replace(/<span[^>]*>(?:\\s*&nbsp;\\s*)*<\\/span>/gi, '')"));
check('service worker exposes semantic parity gate',
  sw.includes('selectionHtmlMatchesText(selection)') &&
  sw.includes('HTML/text semantic mismatch; using plain text'));

check('service worker distinguishes block-boundary and inline whitespace',
  sw.includes('buildSelectionTextPattern(html)') &&
  sw.includes("source += '\\\\s*'") &&
  sw.includes("source += '\\\\s+'"));

console.log(failures === 0 ? '\nFLAS-6 CONTRACT OK' : '\nFLAS-6 CONTRACT FAILED (' + failures + ')');
process.exit(failures === 0 ? 0 : 1);
