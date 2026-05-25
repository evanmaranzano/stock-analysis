import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../index';
import type { Env } from '../types';

function makeRateLimiterNamespace(): DurableObjectNamespace {
  const counters = new Map<string, { count: number; resetAt: number }>();
  return {
    idFromName: (name: string) => ({ name }),
    get: (id: { name: string }) => ({
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const body = await request.json() as { key: string; maxRequests: number; windowMs: number };
        const now = Date.now();
        const key = `${id.name}:${body.key}`;
        const entry = counters.get(key);
        if (!entry || now > entry.resetAt) {
          counters.set(key, { count: 1, resetAt: now + body.windowMs });
          return Response.json({ allowed: true, remaining: body.maxRequests - 1, resetAt: now + body.windowMs });
        }
        if (entry.count >= body.maxRequests) {
          return Response.json({ allowed: false, remaining: 0, resetAt: entry.resetAt });
        }
        entry.count++;
        return Response.json({ allowed: true, remaining: body.maxRequests - entry.count, resetAt: entry.resetAt });
      },
    }),
  } as unknown as DurableObjectNamespace;
}

function makeEnv(kvData: string | null = null, rateLimiter = makeRateLimiterNamespace()): Env {
  return {
    TWELVEDATA_API_KEY: 'test-twelve-key',
    ALPHAVANTAGE_API_KEY: 'test-alpha-key',
    FINNHUB_API_KEY: 'test-finnhub-key',
    ENVIRONMENT: 'test',
    CACHE_KV: {
      get: vi.fn().mockResolvedValue(kvData),
      put: vi.fn().mockResolvedValue(undefined),
    } as unknown as KVNamespace,
    RATE_LIMITER: rateLimiter,
  };
}

function makeDurableRateLimiterEnv(kvData: string | null = null): Env {
  return makeEnv(kvData, makeRateLimiterNamespace());
}

describe('worker request validation', () => {
  beforeEach(() => {
    vi.stubGlobal('caches', {
      default: {
        match: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: [] })));
  });

  it('rejects invalid CN quote codes before upstream fetch', async () => {
    const res = await worker.fetch(new Request('https://api.test/api/stock/cn/ABC123/quote'), makeEnv());

    expect(res.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects overlong search queries before upstream fetch', async () => {
    const q = 'A'.repeat(65);
    const res = await worker.fetch(new Request(`https://api.test/api/search?q=${q}`), makeEnv());

    expect(res.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not allow arbitrary browser origins', async () => {
    const res = await worker.fetch(
      new Request('https://api.test/api/status', {
        headers: { Origin: 'https://evil.example' },
      }),
      makeEnv(),
    );

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('serves cached news before consuming upstream rate limit', async () => {
    const cachedNews = JSON.stringify([{ id: 'cached', title: 'Cached news' }]);
    const env = makeEnv(cachedNews);

    const responses = await Promise.all(
      Array.from({ length: 35 }, () => worker.fetch(new Request('https://api.test/api/news?limit=1'), env)),
    );

    expect(responses.every((res) => res.status === 200)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('serves cached search results before consuming upstream rate limit', async () => {
    const cachedSearch = JSON.stringify([{ code: 'AAPL', name: 'Apple Inc.', market: 'us' }]);
    const env = makeEnv(cachedSearch);

    const responses = await Promise.all(
      Array.from({ length: 25 }, () => worker.fetch(new Request('https://api.test/api/search?q=AAPL'), env)),
    );

    expect(responses.every((res) => res.status === 200)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects failed search upstream responses without caching them', async () => {
    const env = makeEnv();
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: [] }, { status: 502 }));

    const res = await worker.fetch(new Request('https://api.test/api/search?q=AAPL'), env);

    expect(res.status).toBe(500);
    expect(env.CACHE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects malformed search upstream payloads without caching them', async () => {
    const env = makeEnv();
    vi.mocked(fetch).mockResolvedValue(Response.json({
      data: [{ symbol: 42, instrument_name: null, exchange: 'NASDAQ', instrument_type: 'Common Stock' }],
    }));

    const res = await worker.fetch(new Request('https://api.test/api/search?q=AAPL'), env);

    expect(res.status).toBe(500);
    expect(env.CACHE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects Twelve Data search error payloads without caching empty results', async () => {
    const env = makeEnv();
    vi.mocked(fetch).mockResolvedValue(Response.json({ status: 'error', code: 429, message: 'rate limit' }));

    const res = await worker.fetch(new Request('https://api.test/api/search?q=AAPL'), env);

    expect(res.status).toBe(500);
    expect(env.CACHE_KV.put).not.toHaveBeenCalled();
  });

  it('rejects invalid search result symbols before caching them', async () => {
    const env = makeEnv();
    vi.mocked(fetch).mockResolvedValue(Response.json({
      data: [{ symbol: 'AAPL/../../x', instrument_name: 'Apple Inc.', exchange: 'NASDAQ' }],
    }));

    const res = await worker.fetch(new Request('https://api.test/api/search?q=AAPL'), env);

    expect(res.status).toBe(500);
    expect(env.CACHE_KV.put).not.toHaveBeenCalled();
  });

  it('applies upstream rate limits per client before the global bucket', async () => {
    const env = makeDurableRateLimiterEnv();
    vi.mocked(fetch).mockImplementation(async () => Response.json([]));

    const firstIpResponses = await Promise.all(
      Array.from({ length: 31 }, () =>
        worker.fetch(new Request('https://api.test/api/news?limit=1', { headers: { 'CF-Connecting-IP': '192.0.2.1' } }), env),
      ),
    );
    const secondIpResponse = await worker.fetch(
      new Request('https://api.test/api/news?limit=1', { headers: { 'CF-Connecting-IP': '192.0.2.2' } }),
      env,
    );

    expect(firstIpResponses.at(-1)?.status).toBe(429);
    expect(secondIpResponse.status).toBe(200);
  });
});
