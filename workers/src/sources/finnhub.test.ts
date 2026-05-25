import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchNews } from './finnhub';

describe('Finnhub source validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects non-array news payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'rate limit' })));

    await expect(fetchNews('test-key')).rejects.toThrow('Invalid Finnhub news response');
  });

  it('filters malformed news items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([
      {
        id: 1,
        headline: 'Valid headline',
        url: 'https://example.com/story',
        source: 'Finnhub',
        datetime: 1779710000,
        summary: 'Valid summary',
      },
      {
        id: 2,
        headline: 'Bad date',
        url: 'https://example.com/bad',
        source: 'Finnhub',
        datetime: 'bad',
        summary: 'Invalid',
      },
    ])));

    await expect(fetchNews('test-key')).resolves.toHaveLength(1);
  });

  it('filters news items with out-of-range timestamps and invalid related arrays', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([
      {
        id: 1,
        headline: 'Bad timestamp',
        url: 'https://example.com/story',
        source: 'Finnhub',
        datetime: 1e20,
        summary: 'Invalid date',
      },
      {
        id: 2,
        headline: 'Bad related',
        url: 'https://example.com/related',
        source: 'Finnhub',
        datetime: 1779710000,
        summary: 'Invalid related',
        related: [42],
      },
    ])));

    await expect(fetchNews('test-key')).resolves.toHaveLength(0);
  });
});
