(function installGmailAdapter() {
  if (window.LegalBillablesGmailAdapter) return;

  const SELECTORS = {
    composeRoots: [
      'div[role="dialog"]',
      'div[aria-label*="New Message"]',
      'div[aria-label*="Message Body"]',
    ],
    subject: [
      'input[name="subjectbox"]',
      'input[aria-label="Subject"]',
      'input[placeholder="Subject"]',
    ],
    body: [
      'div[aria-label="Message Body"][contenteditable="true"]',
      'div[g_editable="true"][contenteditable="true"]',
      'div[role="textbox"][contenteditable="true"]',
    ],
    sendButton: [
      '[data-tooltip*="Send"]',
      '[aria-label*="Send"]',
      'div[role="button"][data-tooltip-delay][tabindex="1"]',
    ],
    toChips: [
      'div[aria-label="To"] [email]',
      'div[aria-label="To"] [data-hovercard-id]',
      'span[email]',
      '[data-hovercard-id*="@"]',
    ],
    toInputs: [
      'textarea[aria-label="To"]',
      'input[aria-label="To"]',
      'textarea[name="to"]',
      'input[name="to"]',
    ],
    sendConfirmation: [
      '[role="alert"]',
      '[aria-live]',
      '.bAq',
      '.vh',
      '.aT',
    ],
    messageId: [
      '[data-message-id]',
      '[data-legacy-message-id]',
      '[data-msg-id]',
      '[name="messageId"]',
    ],
  };

  function first(root, selectors) {
    for (const selector of selectors) {
      const found = root?.querySelector?.(selector);
      if (found) return found;
    }
    return null;
  }

  function all(root, selectors) {
    const nodes = [];
    selectors.forEach((selector) => {
      root?.querySelectorAll?.(selector)?.forEach((node) => nodes.push(node));
    });
    return Array.from(new Set(nodes));
  }

  function hasSubject(root) {
    return !!first(root, SELECTORS.subject);
  }

  function hasBody(root) {
    return !!first(root, SELECTORS.body);
  }

  function getComposeRoots() {
    const roots = all(document, SELECTORS.composeRoots)
      .filter((root) => hasSubject(root) || hasBody(root));
    if (hasSubject(document) || hasBody(document)) roots.push(document);
    return Array.from(new Set(roots));
  }

  function getComposeRootFromNode(node) {
    if (!node) return getComposeRoots()[0] || null;
    for (const selector of SELECTORS.composeRoots) {
      const root = node.closest?.(selector);
      if (root && (hasSubject(root) || hasBody(root))) return root;
    }
    if (hasSubject(document) || hasBody(document)) return document;
    return null;
  }

  function getSubject(root) {
    return first(root, SELECTORS.subject)?.value || '';
  }

  function getBody(root) {
    return first(root, SELECTORS.body);
  }

  function getSendButton(root = document) {
    return first(root, SELECTORS.sendButton) || first(document, SELECTORS.sendButton);
  }

  function getRecipients(root) {
    const chips = all(root, SELECTORS.toChips)
      .map((el) => el.getAttribute('email') || el.getAttribute('data-hovercard-id'))
      .filter(Boolean);
    const raw = all(root, SELECTORS.toInputs)
      .flatMap((el) => String(el.value || '').split(/[,;]+/))
      .map((value) => value.trim())
      .filter(Boolean);
    return Array.from(new Set([...chips, ...raw]));
  }

  function hasSendConfirmationSignal() {
    return all(document, SELECTORS.sendConfirmation)
      .some((node) => /message sent/i.test(node.textContent || ''));
  }

  function getMessageId(root) {
    for (const el of all(root, SELECTORS.messageId)) {
      const value = el.getAttribute('data-message-id') ||
        el.getAttribute('data-legacy-message-id') ||
        el.getAttribute('data-msg-id') ||
        el.value;
      if (value) return String(value);
    }
    return '';
  }

  function getHealth() {
    const composeRoots = getComposeRoots();
    const brokenComposeRoots = composeRoots.filter((root) => !hasSubject(root) || !hasBody(root));
    return {
      ok: brokenComposeRoots.length === 0,
      composeCount: composeRoots.length,
      brokenComposeCount: brokenComposeRoots.length,
      missing: brokenComposeRoots.length ? 'compose-subject-or-body' : '',
    };
  }

  function observeComposeChanges(callback) {
    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(callback, 250);
    });
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'role', 'data-tooltip', 'contenteditable'],
    });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }

  window.LegalBillablesGmailAdapter = {
    SELECTORS,
    getComposeRoots,
    getComposeRootFromNode,
    getSubject,
    getBody,
    getSendButton,
    getRecipients,
    getMessageId,
    hasBody,
    hasSubject,
    hasSendConfirmationSignal,
    getHealth,
    observeComposeChanges,
  };
})();
