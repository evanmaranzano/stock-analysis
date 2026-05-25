// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeWatchlist } from './PortfolioContext';

describe('sanitizeWatchlist', () => {
  it('drops non-arrays and malformed watchlist items', () => {
    expect(sanitizeWatchlist(null)).toEqual([]);
    expect(
      sanitizeWatchlist([
        { market: 'cn', code: '600519', name: '贵州茅台', addedAt: '2026-05-25T00:00:00.000Z' },
        { market: 'bad', code: 'AAPL', name: 'Apple', addedAt: '2026-05-25T00:00:00.000Z' },
        { market: 'us', code: 123, name: 'Broken', addedAt: '2026-05-25T00:00:00.000Z' },
        { market: 'us', code: 'AAPL/../../x', name: 'Bad Route', addedAt: '2026-05-25T00:00:00.000Z' },
      ]),
    ).toEqual([{ market: 'cn', code: '600519', name: '贵州茅台', addedAt: '2026-05-25T00:00:00.000Z' }]);
  });
});
