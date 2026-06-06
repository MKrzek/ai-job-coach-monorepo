import { describe, it, expect } from 'vitest';
import { detectCvIntent } from '../../mastra/index.js';

describe('detectCvIntent', () => {
  describe('routes to rewrite', () => {
    it.each([
      'rewrite my bullet points for this Node.js role',
      'tailor my CV to match this job',
      'improve these bullet points',
      'rephrase my experience section',
      'revise my CV for this role',
      'reword my backend experience',
      'update my cv for this position',
      'update my bullet points',
      'rewrite my cv please',
      'tailor my cv to match',
      'can you fix these bullet points',
      ' rewrite my cv ',
      'Tailor my CV!!!',
      'reword my experience, please',
    ])('"%s" → rewrite', (text) => {
      expect(detectCvIntent(text)).toBe('rewrite');
    });
  });

  describe('routes to analyse', () => {
    it.each([
      'how strong is my CV for this job?',
      'what is my match score?',
      'analyse my cv against this job description',
      'does my experience match?',
      'give me a score for this role',
      'what skills am I missing?',
      '',
      'hello',
      '   ',
      'can you review my cv?',
      'how well does my cv fit this job?',
    ])('"%s" → analyse', (text) => {
      expect(detectCvIntent(text)).toBe('analyse');
    });
  });

  it('is case-insensitive', () => {
    expect(detectCvIntent('REWRITE MY BULLET POINTS')).toBe('rewrite');
    expect(detectCvIntent('Tailor My CV')).toBe('rewrite');
    expect(detectCvIntent('WHAT IS MY MATCH SCORE?')).toBe('analyse');
  });

  it('prefers rewrite when both rewrite and analysis words appear', () => {
    expect(
      detectCvIntent('analyse my cv and rewrite my bullet points')
    ).toBe('rewrite');
  });
});
