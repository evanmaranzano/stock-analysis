import { describe, it, expect } from 'vitest';
import { getCacheTTL } from '../cache';

describe('getCacheTTL', () => {
  it('returns 30s for quotes', () => {
    expect(getCacheTTL('quote')).toBe(30);
  });

  it('returns 3600s for kline', () => {
    expect(getCacheTTL('kline')).toBe(3600);
  });

  it('returns 86400s for fundamental', () => {
    expect(getCacheTTL('fundamental')).toBe(86400);
  });

  it('returns 300s for news', () => {
    expect(getCacheTTL('news')).toBe(300);
  });

  it('returns 60s for unknown category', () => {
    expect(getCacheTTL('unknown')).toBe(60);
  });
});
