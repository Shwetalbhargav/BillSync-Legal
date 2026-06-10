const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../captureCore.js');

test('sourceRef prefers Gmail messageId and stays stable', () => {
  const input = {
    messageId: 'msg-123',
    threadId: 'thread-999',
    captureId: 'capture-a',
    userEmail: 'lawyer@example.com',
    recipient: 'client@example.com',
    subject: 'Matter update',
  };

  assert.equal(core.createEmailSourceRef(input), 'gmail:message:msg-123');
  assert.equal(core.createEmailSourceRef(input), core.createEmailSourceRef({ ...input }));
});

test('sourceRef falls back to thread and capture data idempotently', () => {
  const input = {
    threadId: 'thread-999',
    captureId: 'capture-a',
    userEmail: 'lawyer@example.com',
    recipient: 'client@example.com',
    subject: 'Matter update',
  };

  const first = core.createEmailSourceRef(input);
  const second = core.createEmailSourceRef({ ...input });
  const changed = core.createEmailSourceRef({ ...input, captureId: 'capture-b' });

  assert.match(first, /^gmail:thread:thread-999:compose:/);
  assert.equal(first, second);
  assert.notEqual(first, changed);
});

test('idle-capped typing time does not count long inactive gaps', () => {
  const seconds = core.computeIdleCappedActiveSeconds(
    [0, 1000, 9000],
    { idleMs: 5000, finalTailMs: 5000 }
  );

  assert.equal(seconds, 11);
});

test('formatMinSec returns stable timer display', () => {
  assert.equal(core.formatMinSec(0), '00:00');
  assert.equal(core.formatMinSec(65), '01:05');
  assert.equal(core.formatMinSec(179), '02:59');
});
