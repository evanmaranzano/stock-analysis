import type { Env } from './types';
import { getCached, putCached, getCacheTTL } from './cache';
import { fetchQuote, fetchKLine, fetchFundamental, fetchMarketOverview } from './sources/eastmoney';
import { fetchHKQuote } from './sources/yahoo';
import { fetchUSQuote, fetchUSKLine } from './sources/twelvedata';
import { fetchUSFundamental } from './sources/alphavantage';
import { fetchNews } from './sources/finnhub';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ALLOWED_ORIGINS = new Set([
  'https://stock-analysis-7wj.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const baseCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsHeadersFor(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return { ...baseCorsHeaders, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
  }
  return baseCorsHeaders;
}

function json(request: Request, data: unknown, init?: ResponseInit): Response {
  return Response.json(data, { headers: { ...corsHeadersFor(request), ...init?.headers }, status: init?.status });
}

const VALID_PERIODS = new Set(['day', 'week', 'month']);
const SEARCH_MAX_LENGTH = 64;

function clientKey(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 'unknown';
}

export class RateLimiter {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const { key, maxRequests, windowMs } = await request.json() as {
      key: string;
      maxRequests: number;
      windowMs: number;
    };
    const result = await this.state.storage.transaction(async (txn) => {
      const now = Date.now();
      const entry = await txn.get<RateLimitEntry>(key);

      if (!entry || now > entry.resetAt) {
        const next = { count: 1, resetAt: now + windowMs };
        await txn.put(key, next);
        return { allowed: true, remaining: maxRequests - 1, resetAt: next.resetAt };
      }

      if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      const next = { count: entry.count + 1, resetAt: entry.resetAt };
      await txn.put(key, next);
      return { allowed: true, remaining: maxRequests - next.count, resetAt: next.resetAt };
    });

    return Response.json(result);
  }
}

async function checkRateLimiterNamespace(
  env: Env,
  namespace: string,
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  try {
    const id = env.RATE_LIMITER.idFromName(`${namespace}:${key}`);
    const stub = env.RATE_LIMITER.get(id);
    const response = await stub.fetch('https://rate-limit.local/check', {
      method: 'POST',
      body: JSON.stringify({ key: 'bucket', maxRequests, windowMs }),
    });
    if (!response.ok) return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
    return await response.json() as RateLimitResult;
  } catch {
    // DO unavailable — fail open to avoid total API outage
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
}

async function checkProviderRateLimit(
  env: Env,
  request: Request,
  provider: string,
  clientMaxRequests: number,
  globalMaxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const clientLimit = await checkRateLimiterNamespace(env, `client:${provider}`, clientKey(request), clientMaxRequests, windowMs);
  if (!clientLimit.allowed) return clientLimit;
  return await checkRateLimiterNamespace(env, `global:${provider}`, provider, globalMaxRequests, windowMs);
}

function validateCode(market: string, code: string): string | null {
  const normalized = code.toUpperCase();
  if (market === 'cn') return /^\d{6}$/.test(normalized) ? normalized : null;
  if (market === 'hk') return /^\d{1,5}$/.test(normalized) ? normalized.padStart(4, '0') : null;
  if (market === 'us') return /^[A-Z]{1,5}$/.test(normalized) ? normalized : null;
  return null;
}

function marketFromExchange(exchange: string): 'cn' | 'us' | 'hk' {
  if (exchange === 'SHE' || exchange === 'SHA') return 'cn';
  if (exchange === 'HKG') return 'hk';
  return 'us';
}

function normalizeSearchQuery(raw: string | null): string | null {
  const q = raw?.trim();
  if (!q || q.length > SEARCH_MAX_LENGTH) return null;
  return q;
}

function isSearchSourceItem(value: unknown): value is {
  symbol: string;
  instrument_name: string;
  exchange: string;
} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.symbol === 'string' &&
    typeof item.instrument_name === 'string' &&
    typeof item.exchange === 'string' &&
    validateCode(marketFromExchange(item.exchange), item.symbol) !== null
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeadersFor(request) });
    }

    if (request.method !== 'GET') {
      return json(request, { error: 'Method not allowed' }, { status: 405 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/status') {
        return json(request, { status: 'ok', timestamp: new Date().toISOString() });
      }

      if (path === '/api/market/overview') {
        const cached = await getCached(request, env, 'overview:cn');
        if (cached) return new Response(cached.body, { headers: { ...corsHeadersFor(request), 'X-Cache': 'hit' } });

        const data = await fetchMarketOverview();
        const resp = json(request, data);
        await putCached(request, env, 'overview:cn', resp, getCacheTTL('overview'));
        return resp;
      }

      if (path === '/api/search') {
        const q = normalizeSearchQuery(url.searchParams.get('q'));
        if (!q) return json(request, { error: 'Invalid q param' }, { status: 400 });

        const cacheKey = `search:${q}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeadersFor(request), 'X-Cache': 'hit' } });

        const rl = await checkProviderRateLimit(env, request, 'twelvedata-search', 20, 120, 60000);
        if (!rl.allowed) return json(request, { error: 'Rate limited' }, { status: 429 });

        // Use Twelve Data search (works globally)
        const searchUrl = new URL('https://api.twelvedata.com/symbol_search');
        searchUrl.searchParams.set('symbol', q);
        searchUrl.searchParams.set('apikey', env.TWELVEDATA_API_KEY);
        const res = await fetch(searchUrl.toString(), { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`TwelveData search HTTP ${res.status}`);
        const data = await res.json() as { data?: unknown };
        if ('status' in data || 'code' in data || 'message' in data) throw new Error('TwelveData search error response');
        if (data.data !== undefined && !Array.isArray(data.data)) throw new Error('Invalid TwelveData search response');

        const sourceItems = (data.data || []).filter(isSearchSourceItem);

        const results = sourceItems.slice(0, 10).map((item) => {
          const market = marketFromExchange(item.exchange);
          return {
            code: validateCode(market, item.symbol) || item.symbol,
            name: item.instrument_name,
            market,
          };
        });

        const resp = json(request, results);
        await putCached(request, env, cacheKey, resp, getCacheTTL('search'));
        return resp;
      }

      const quoteMatch = path.match(/^\/api\/stock\/(cn|us|hk)\/([A-Za-z0-9]+)\/quote$/);
      if (quoteMatch) {
        const [, market, rawCode] = quoteMatch;
        const code = validateCode(market, rawCode);
        if (!code) return json(request, { error: 'Invalid stock code' }, { status: 400 });
        const cacheKey = `quote:${market}:${code}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeadersFor(request), 'X-Cache': 'hit' } });

        let data;
        if (market === 'cn') {
          try {
            data = await fetchQuote(code);
          } catch {
            // Fallback to Twelve Data for A-shares
            const rl = await checkProviderRateLimit(env, request, 'twelvedata', 8, 60, 60000);
            if (!rl.allowed) return json(request, { error: 'Rate limited' }, { status: 429 });
            try { data = await fetchUSQuote(code, env.TWELVEDATA_API_KEY); data.market = 'cn'; } catch { throw new Error(`No data for CN code: ${code}`); }
          }
        } else if (market === 'hk') {
          data = await fetchHKQuote(code);
        } else if (market === 'us') {
          const rl = await checkProviderRateLimit(env, request, 'twelvedata', 8, 60, 60000);
          if (!rl.allowed) return json(request, { error: 'Rate limited' }, { status: 429 });
          data = await fetchUSQuote(code, env.TWELVEDATA_API_KEY);
        } else {
          return json(request, { error: 'Unknown market' }, { status: 400 });
        }

        const resp = json(request, data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('quote'));
        return resp;
      }

      const klineMatch = path.match(/^\/api\/stock\/(cn|us|hk)\/([A-Za-z0-9]+)\/kline$/);
      if (klineMatch) {
        const [, market, rawCode] = klineMatch;
        const code = validateCode(market, rawCode);
        if (!code) return json(request, { error: 'Invalid stock code' }, { status: 400 });
        const rawPeriod = url.searchParams.get('period') || 'day';
        if (rawPeriod && !VALID_PERIODS.has(rawPeriod)) {
          return json(request, { error: 'Invalid period. Use: day, week, month' }, { status: 400 });
        }
        const period = rawPeriod as 'day' | 'week' | 'month';
        const cacheKey = `kline:${market}:${code}:${period}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeadersFor(request), 'X-Cache': 'hit' } });

        let data;
        if (market === 'cn') {
          data = await fetchKLine(code, period);
        } else if (market === 'us') {
          const rl = await checkProviderRateLimit(env, request, 'twelvedata-kline', 20, 120, 60000);
          if (!rl.allowed) return json(request, { error: 'Rate limited' }, { status: 429 });
          data = await fetchUSKLine(code, env.TWELVEDATA_API_KEY, period);
        } else {
          return json(request, { error: 'K-line not supported for this market' }, { status: 400 });
        }

        const resp = json(request, data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('kline'));
        return resp;
      }

      const fundMatch = path.match(/^\/api\/stock\/(cn|us|hk)\/([A-Za-z0-9]+)\/fundamental$/);
      if (fundMatch) {
        const [, market, rawCode] = fundMatch;
        const code = validateCode(market, rawCode);
        if (!code) return json(request, { error: 'Invalid stock code' }, { status: 400 });
        const cacheKey = `fundamental:${market}:${code}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeadersFor(request), 'X-Cache': 'hit' } });

        let data;
        if (market === 'cn') {
          data = await fetchFundamental(code);
        } else if (market === 'us') {
          const rl = await checkProviderRateLimit(env, request, 'alphavantage', 5, 25, 60000);
          if (!rl.allowed) return json(request, { error: 'Rate limited' }, { status: 429 });
          data = await fetchUSFundamental(code, env.ALPHAVANTAGE_API_KEY);
        } else {
          return json(request, { error: 'Fundamentals not supported for this market' }, { status: 400 });
        }

        const resp = json(request, data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('fundamental'));
        return resp;
      }

      if (path === '/api/news') {
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 100);
        const cacheKey = `news:general:${limit}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeadersFor(request), 'X-Cache': 'hit' } });

        const rl = await checkProviderRateLimit(env, request, 'finnhub', 30, 60, 60000);
        if (!rl.allowed) return json(request, { error: 'Rate limited' }, { status: 429 });

        const data = await fetchNews(env.FINNHUB_API_KEY, 'general', limit);
        const resp = json(request, data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('news'));
        return resp;
      }

      return json(request, { error: 'Not found' }, { status: 404 });
    } catch (err) {
      console.error('Worker error:', err);
      return json(request, { error: 'Internal error' }, { status: 500 });
    }
  },
};
