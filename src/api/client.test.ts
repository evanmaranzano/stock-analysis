// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchQuote, fetchSearch, getDataSourceState, isValidMarket, normalizeStockCode, setMockMode } from './client';

describe('api client safety', () => {
  beforeEach(() => {
    localStorage.clear();
    setMockMode(false);
    vi.restoreAllMocks();
  });

  it('does not silently return mock quotes when live API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('upstream failed', { status: 502 })));

    await expect(fetchQuote('us', 'AAPL')).rejects.toThrow();
  });

  it('rejects malformed quote payloads from the live API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ price: 'bad' })));

    await expect(fetchQuote('us', 'AAPL')).rejects.toThrow('Invalid API response');
    expect(getDataSourceState()).toBe('fallback');
  });

  it('rejects malformed search result codes from the live API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([
      { code: 'AAPL/../../x', name: 'Bad route', market: 'us' },
    ])));

    await expect(fetchSearch('AAPL')).rejects.toThrow('Invalid API response');
    expect(getDataSourceState()).toBe('fallback');
  });

  it('validates markets and stock codes before building request paths', () => {
    expect(isValidMarket('us')).toBe(true);
    expect(isValidMarket('bad')).toBe(false);
    expect(normalizeStockCode('cn', '600519')).toBe('600519');
    expect(normalizeStockCode('cn', 'ABC123')).toBeNull();
    expect(normalizeStockCode('us', 'brkb')).toBe('BRKB');
    expect(normalizeStockCode('us', 'AAPL/../../x')).toBeNull();
  });
});
