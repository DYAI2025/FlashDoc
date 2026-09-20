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
  function normalizeHtml(value) {
    const html = normalizeString(value);
    if (!html) return '';

    return html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<font\b[^>]*>/gi, '')
      .replace(/<\/font\s*>/gi, '')
      .replace(/<span\b[^>]*>((?:\s|&nbsp;|&#160;|&#x0*a0;)*)<\/span>/gi, '$1');
  }

  function normalizeComparableText(value) {
    return normalizeString(value)
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenizeComparableText(value) {
    const normalized = normalizeComparableText(value);
    return normalized ? normalized.split(' ') : [];
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
    tokenizeComparableText,
    fields: Object.freeze(['text', 'html', 'sourceUrl', 'frameId'])
  });
})();
