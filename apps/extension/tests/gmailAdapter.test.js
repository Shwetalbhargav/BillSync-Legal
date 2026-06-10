const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fakeElement(selectorMap = {}, attributes = {}) {
  const element = {
    nodeType: 1,
    value: attributes.value || '',
    textContent: attributes.textContent || '',
    parentElement: null,
    isConnected: true,
    getAttribute(name) {
      return attributes[name] || '';
    },
    querySelector(selector) {
      return firstMatch(selectorMap, selector);
    },
    querySelectorAll(selector) {
      return allMatches(selectorMap, selector);
    },
    closest() {
      return null;
    },
  };
  return element;
}

function selectorParts(selector) {
  return String(selector || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function firstMatch(selectorMap, selector) {
  for (const part of selectorParts(selector)) {
    const value = selectorMap[part];
    if (Array.isArray(value)) return value[0] || null;
    if (value) return value;
  }
  return null;
}

function allMatches(selectorMap, selector) {
  const results = [];
  for (const part of selectorParts(selector)) {
    const value = selectorMap[part];
    if (Array.isArray(value)) results.push(...value);
    else if (value) results.push(value);
  }
  return results;
}

function loadAdapter(document) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'gmailAdapter.js'), 'utf8');
  const sandbox = {
    window: {},
    document,
    Node: { ELEMENT_NODE: 1 },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
  };
  vm.runInNewContext(source, sandbox, { filename: 'gmailAdapter.js' });
  return sandbox.window.LegalBillablesGmailAdapter;
}

test('gmail adapter extracts compose fields from Gmail-like DOM fixture', () => {
  const subject = fakeElement({}, { value: 'Client update' });
  const body = fakeElement({}, { textContent: 'Draft body' });
  const recipient = fakeElement({}, { email: 'client@example.com' });
  const messageId = fakeElement({}, { 'data-message-id': 'msg-123' });
  const dialog = fakeElement({
    'input[name="subjectbox"]': subject,
    'div[aria-label="Message Body"][contenteditable="true"]': body,
    'div[aria-label="To"] [email]': [recipient],
    '[email]': [recipient],
    '[data-message-id]': messageId,
  });
  const document = fakeElement({
    'div[role="dialog"]': [dialog],
  });

  const adapter = loadAdapter(document);

  assert.equal(adapter.getComposeRoots().length, 1);
  assert.equal(adapter.getSubject(dialog), 'Client update');
  assert.equal(adapter.getBody(dialog).textContent, 'Draft body');
  assert.equal(JSON.stringify(adapter.getRecipients(dialog)), JSON.stringify(['client@example.com']));
  assert.equal(adapter.getMessageId(dialog), 'msg-123');
});

test('gmail adapter reports missing compose body as unhealthy', () => {
  const subject = fakeElement({}, { value: 'Client update' });
  const dialog = fakeElement({
    'input[name="subjectbox"]': subject,
  });
  const document = fakeElement({
    'div[role="dialog"]': [dialog],
  });

  const adapter = loadAdapter(document);
  const health = adapter.getHealth();

  assert.equal(health.composeCount, 1);
  assert.equal(health.ok, false);
  assert.equal(health.missing, 'compose-subject-or-body');
});
