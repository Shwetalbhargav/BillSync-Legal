(function initCaptureCore(globalScope) {
  function hashString(value) {
    let hash = 2166136261;
    const input = String(value || '');
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function formatMinSec(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds || 0)));
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  function createEmailSourceRef({
    messageId = '',
    threadId = '',
    captureId = '',
    userEmail = '',
    recipient = '',
    subject = '',
  } = {}) {
    const cleanMessageId = String(messageId || '').trim();
    const cleanThreadId = String(threadId || '').trim();
    const cleanCaptureId = String(captureId || '').trim();
    const fallbackKey = hashString([
      userEmail,
      recipient,
      subject,
      cleanThreadId,
      cleanCaptureId,
    ].join('|'));

    if (cleanMessageId) return `gmail:message:${cleanMessageId}`;
    if (cleanThreadId) return `gmail:thread:${cleanThreadId}:compose:${fallbackKey}`;
    return `gmail:compose:${cleanCaptureId || fallbackKey}`;
  }

  function computeIdleCappedActiveSeconds(events = [], { idleMs = 5000, finalTailMs = 0 } = {}) {
    const timestamps = events
      .map((event) => Number(typeof event === 'object' ? event.at ?? event.time : event))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    if (!timestamps.length) return 0;

    let activeMs = Math.min(Math.max(Number(finalTailMs || 0), 0), idleMs);
    for (let i = 1; i < timestamps.length; i += 1) {
      activeMs += Math.min(Math.max(timestamps[i] - timestamps[i - 1], 0), idleMs);
    }
    return Math.floor(activeMs / 1000);
  }

  const api = {
    hashString,
    formatMinSec,
    createEmailSourceRef,
    computeIdleCappedActiveSeconds,
  };

  globalScope.LegalBillablesCaptureCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
