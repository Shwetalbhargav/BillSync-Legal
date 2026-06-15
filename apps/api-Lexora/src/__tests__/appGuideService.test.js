import { describe, expect, test } from 'vitest';
import { buildAppGuideAnswer } from '../modules/ai/services/appGuideService.js';

describe('app guide assistant answers', () => {
  test('answers Chrome extension questions with setup and capture guidance', () => {
    const result = buildAppGuideAnswer({
      input: 'how does the google extension work',
      context: { currentPath: '/app/dashboard' },
    });

    expect(result.title).toBe('Chrome extension capture');
    expect(result.text).toContain('capture work from Gmail and browser research');
    expect(result.text).toContain('/app/extension/setup');
    expect(result.text).not.toBe('Summary: how does the google extension work');
  });

  test('answers daily work questions with task and work meter flow', () => {
    const result = buildAppGuideAnswer({
      input: 'guide me through my daily work',
      context: { currentPath: '/app/work-meter' },
    });

    expect(result.title).toBe('Daily work flow');
    expect(result.text).toContain('start from My Tasks or My Work Today');
    expect(result.text).toContain('/app/work-meter');
  });
});
