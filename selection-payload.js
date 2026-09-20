// FlashDoc canonical structured-selection contract (FLAS-6).
// Classic-script compatible: service worker, popup and content scripts share this
// exact normalizer without modules or remote code.
(() => {
  const normalizeString = (value) => typeof value === 'string' ? value : '';
  const normalizeSourceUrl = (value) =>
    typeof value === 'string' && value.length > 0 ? value : null;
  const normalizeFrameId = (value) =>
    Number.isInteger(value) && value >= 0 ? value : null;

  function createSelectionPayload(input = {}) {
    return {
      text: normalizeString(input.text),
      html: normalizeString(input.html),
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
    fields: Object.freeze(['text', 'html', 'sourceUrl', 'frameId'])
  });
})();
