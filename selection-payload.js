// FlashDoc canonical structured-selection contract (FLAS-6).
// Classic-script compatible: service worker, popup and content scripts share this
// exact normalizer without modules or remote code.
(() => {
  const normalizeString = (value) => typeof value === 'string' ? value : '';
  const normalizeSourceUrl = (value) =>
    typeof value === 'string' && value.length > 0 ? value : null;
  const normalizeFrameId = (value) =>
    Number.isInteger(value) && value >= 0 ? value : null;

  // Keep extraction dumb and centralize all string-level cleanup here.
  // Important: whitespace-only inline wrappers are unwrapped, never deleted with
  // their contents, because they can carry the only separator between words.
  function splitMarkup(value) {
    const tokens = [];
    let offset = 0;

    while (offset < value.length) {
      if (value[offset] !== '<') {
        const nextTag = value.indexOf('<', offset);
        const end = nextTag === -1 ? value.length : nextTag;
        tokens.push({ type: 'text', raw: value.slice(offset, end) });
        offset = end;
        continue;
      }

      let cursor = offset + 1;
      let quote = null;
      while (cursor < value.length) {
        const char = value[cursor];
        if (quote) {
          if (char === quote) quote = null;
        } else if (char === '"' || char === "'") {
          quote = char;
        } else if (char === '>') {
          cursor++;
          break;
        }
        cursor++;
      }

      if (cursor > value.length || value[cursor - 1] !== '>') {
        tokens.push({ type: 'text', raw: value.slice(offset) });
        break;
      }

      tokens.push({ type: 'tag', raw: value.slice(offset, cursor) });
      offset = cursor;
    }

    return tokens;
  }

  function isWhitespaceOnlyMarkupText(value) {
    const decoded = normalizeString(value)
      .replace(/&nbsp;|&#160;|&#x0*a0;/gi, '\u00a0');
    return /^[\s\u00a0]*$/.test(decoded);
  }

  function unwrapWhitespaceOnlySpans(value) {
    if (!value) return '';
    const tokens = splitMarkup(value);
    const stack = [];
    const remove = new Set();

    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.type === 'text') {
        if (!isWhitespaceOnlyMarkupText(token.raw) && stack.length > 0) {
          stack[stack.length - 1].meaningful = true;
        }
        continue;
      }

      const raw = token.raw;
      const isCloseSpan = /^<\s*\/\s*span\b/i.test(raw);
      const isOpenSpan = !isCloseSpan && /^<\s*span\b/i.test(raw);
      if (isOpenSpan) {
        if (/\/\s*>$/.test(raw)) {
          remove.add(index);
        } else {
          stack.push({ openIndex: index, meaningful: false });
        }
        continue;
      }

      if (!isCloseSpan) continue;
      const frame = stack.pop();
      if (!frame) continue;
      if (!frame.meaningful) {
        remove.add(frame.openIndex);
        remove.add(index);
      } else if (stack.length > 0) {
        stack[stack.length - 1].meaningful = true;
      }
    }

    return tokens
      .filter((_, index) => !remove.has(index))
      .map((token) => token.raw)
      .join('');
  }

  function normalizeHtml(value) {
    const html = normalizeString(value);
    if (!html) return '';

    const cleaned = html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<font\b[^>]*>/gi, '')
      .replace(/<\/font\s*>/gi, '');

    return unwrapWhitespaceOnlySpans(cleaned);
  }

  function normalizeComparableText(value) {
    return normalizeString(value)
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function createSelectionPayload(input = {}) {
    return {
      text: normalizeString(input.text),
      html: normalizeHtml(input.html),
      sourceUrl: normalizeSourceUrl(input.sourceUrl),
      frameId: normalizeFrameId(input.frameId)
    };
  }

  function withRuntimeContext(input = {}, context = {}) {
    const payload = createSelectionPayload(input);
    return createSelectionPayload({
      ...payload,
      sourceUrl: payload.sourceUrl ?? context.sourceUrl ?? null,
      frameId: payload.frameId ?? context.frameId ?? null
    });
  }

  function hasStructuredHtml(input = {}) {
    return createSelectionPayload(input).html.trim().length > 0;
  }

  globalThis.FlashDocSelection = Object.freeze({
    createSelectionPayload,
    withRuntimeContext,
    hasStructuredHtml,
    normalizeHtml,
    normalizeComparableText,
    fields: Object.freeze(['text', 'html', 'sourceUrl', 'frameId'])
  });
})();
