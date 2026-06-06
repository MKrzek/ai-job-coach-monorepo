import { describe, it, expect } from 'vitest';
import { validateUploadCvBody } from '../../mastra/index.js';

describe('validateUploadCvBody', () => {
  it('returns valid with trimmed cvText and userId when both provided', () => {
    const result = validateUploadCvBody({
      cvText: '  I built React apps with TypeScript.  ',
      userId: 'user-test-1',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.cvText).toBe('I built React apps with TypeScript.');
      expect(result.userId).toBe('user-test-1');
    }
  });

  it('defaults userId to default-user when not provided', () => {
    const result = validateUploadCvBody({ cvText: 'some cv text' });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.userId).toBe('default-user');
    }
  });

  it('defaults userId to default-user when userId is undefined', () => {
    const result = validateUploadCvBody({
      cvText: 'some cv text',
      userId: undefined,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.userId).toBe('default-user');
    }
  });

  it('returns invalid when cvText is missing', () => {
    const result = validateUploadCvBody({ userId: 'user-test-1' });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('cvText is required');
    }
  });

  it('returns invalid when cvText is an empty string', () => {
    const result = validateUploadCvBody({ cvText: '', userId: 'user-test-1' });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('cvText is required');
    }
  });

  it('returns invalid when cvText is only whitespace', () => {
    const result = validateUploadCvBody({ cvText: '   ', userId: 'user-test-1' });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('cvText is required');
    }
  });

  it('returns invalid when body is null', () => {
    const result = validateUploadCvBody(null);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('cvText is required');
    }
  });

  it('returns invalid when body is empty object', () => {
    const result = validateUploadCvBody({});

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('cvText is required');
    }
  });

  it('preserves an explicitly empty-string userId', () => {
    const result = validateUploadCvBody({
      cvText: 'Valid CV text',
      userId: '',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.userId).toBe('');
    }
  });
});


