import { describe, it, expect } from 'vitest';
import { detectCvIntent } from '../../mastra/index.js';

describe('detectCvIntent', () => {
  describe('rewrite intent', () => {
    it('detects "rewrite"', () => {
      expect(detectCvIntent('please rewrite my experience section')).toBe('rewrite');
    });

    it('detects "tailor"', () => {
      expect(detectCvIntent('can you tailor my cv for this role')).toBe('rewrite');
    });

    it('detects "improve"', () => {
      expect(detectCvIntent('improve my cv summary')).toBe('rewrite');
    });

    it('detects "rephrase"', () => {
      expect(detectCvIntent('rephrase this bullet point')).toBe('rewrite');
    });

    it('detects "revise"', () => {
      expect(detectCvIntent('revise my work history section')).toBe('rewrite');
    });

    it('detects "reword"', () => {
      expect(detectCvIntent('reword my skills section')).toBe('rewrite');
    });

    it('detects "bullet point"', () => {
      expect(detectCvIntent('fix my bullet point for this role')).toBe('rewrite');
    });

    it('detects "bullet points"', () => {
      expect(detectCvIntent('rewrite my bullet points')).toBe('rewrite');
    });

    it('detects "update my cv"', () => {
      expect(detectCvIntent('can you update my cv for this job')).toBe('rewrite');
    });

    it('detects "update my bullet"', () => {
      expect(detectCvIntent('update my bullet for this role')).toBe('rewrite');
    });

    it('detects "rewrite my cv"', () => {
      expect(detectCvIntent('rewrite my cv for a senior role')).toBe('rewrite');
    });

    it('detects "tailor my cv"', () => {
      expect(detectCvIntent('tailor my cv to this job description')).toBe('rewrite');
    });

    it('is case insensitive', () => {
      expect(detectCvIntent('REWRITE my CV')).toBe('rewrite');
      expect(detectCvIntent('Tailor My CV For This Role')).toBe('rewrite');
      expect(detectCvIntent('IMPROVE the summary')).toBe('rewrite');
    });

    it('detects keyword mid-sentence', () => {
      expect(detectCvIntent('I need you to improve and strengthen my experience section')).toBe('rewrite');
    });
  });

  describe('analyse intent', () => {
    it('returns analyse for general question', () => {
      expect(detectCvIntent('how strong is my cv?')).toBe('analyse');
    });

    it('returns analyse for empty string', () => {
      expect(detectCvIntent('')).toBe('analyse');
    });

    it('returns analyse for unrelated text', () => {
      expect(detectCvIntent('what jobs should I apply for?')).toBe('analyse');
    });

    it('returns analyse when no keywords match', () => {
      expect(detectCvIntent('can you check my cv for gaps?')).toBe('analyse');
    });

    it('returns analyse for score request', () => {
      expect(detectCvIntent('give me a score out of 10 for my cv')).toBe('analyse');
    });

    it('returns analyse for whitespace-only input', () => {
      expect(detectCvIntent('   ')).toBe('analyse');
    });
  });
});