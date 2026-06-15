import { describe, expect, test } from 'vitest';
import { buildAppGuideAnswer } from '../modules/ai/services/appGuideService.js';

describe('app guide assistant answers', () => {
  test('answers Chrome extension questions with setup and capture guidance', async () => {
    const result = await buildAppGuideAnswer({
      input: 'how does the google extension work',
      context: { currentPath: '/app/dashboard' },
    });

    expect(result.title).toBe('Chrome extension capture');
    expect(result.text).toContain('capture work from Gmail and browser research');
    expect(result.text).toContain('Extension Setup');
    expect(result.text).not.toBe('Summary: how does the google extension work');
  });

  test('answers daily work questions with task and work meter flow', async () => {
    const result = await buildAppGuideAnswer({
      input: 'guide me through my daily work',
      context: { currentPath: '/app/work-meter' },
    });

    expect(result.title).toBe('Daily work flow');
    expect(result.text).toContain('start from My Tasks or My Work Today');
    expect(result.text).toContain('Work Meter');
  });

  test('answers partner profile questions from saved professional details', async () => {
    const result = await buildAppGuideAnswer({
      input: 'tell me about partners professional life',
      snapshot: {
        firm: { name: 'Harmon Associates', currency: 'INR' },
        roleCounts: { partner: 1, lawyer: 2 },
        partners: [
          {
            userId: { name: 'Aarav Mehta', role: 'partner' },
            title: 'Managing Partner',
            specialization: ['Commercial disputes', 'Technology contracts'],
            experienceYears: 14,
            landmarkCases: [{ caseTitle: 'NovaTech IP matter', year: 2025 }],
            achievements: [{ title: 'Built the disputes practice', year: 2024 }],
            publications: [{ title: 'Practical contract risk', year: 2023 }],
          },
        ],
      },
    });

    expect(result.title).toBe('Partner professional profile');
    expect(result.text).toContain('Aarav Mehta');
    expect(result.text).toContain('Managing Partner');
    expect(result.text).toContain('Commercial disputes');
    expect(result.text).toContain('I will keep this professional');
  });
});
