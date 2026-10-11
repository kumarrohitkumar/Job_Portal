import { describe, expect, it } from 'vitest';
import { checkFile } from '@/hooks/useUpload';
import { formatExperience, formatSalary, initials, timeAgo } from '@/lib/format';

describe('formatting', () => {
  it('shows salary in lakh per annum', () => {
    expect(formatSalary(14)).toBe('₹14 LPA');
    expect(formatSalary(3.5)).toBe('₹3.5 LPA');
  });
  it('describes experience', () => {
    expect(formatExperience(0)).toBe('Freshers welcome');
    expect(formatExperience(1)).toBe('1+ year');
    expect(formatExperience(3)).toBe('3+ years');
  });
  it('says how long ago', () => {
    const now = Date.parse('2026-10-11T12:00:00Z');
    expect(timeAgo('2026-10-11T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-10-11T09:00:00Z', now)).toBe('3 hours ago');
    expect(timeAgo('2026-10-10T12:00:00Z', now)).toBe('1 day ago');
  });
  it('makes initials', () => {
    expect(initials('Northwind Labs')).toBe('NL');
    expect(initials('')).toBe('?');
  });
});

describe('upload checks', () => {
  const file = (type, size = 100) => ({ type, size });
  it('accepts a small PDF resume and images for photos', () => {
    expect(checkFile(file('application/pdf'), 'pdf')).toBeNull();
    expect(checkFile(file('image/webp'), 'image')).toBeNull();
  });
  it('rejects the wrong type and files over 2 MB', () => {
    expect(checkFile(file('image/png'), 'pdf')).toMatch(/PDF/);
    expect(checkFile(file('application/pdf', 3 * 1024 * 1024), 'pdf')).toMatch(/2 MB/);
  });
});
