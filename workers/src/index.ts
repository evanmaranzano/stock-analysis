import type { Env } from './types';
import { getCached, putCached, getCacheTTL } from './cache';
import { checkRateLimit } from './ratelimit';
import { fetchQuote, fetchKLine, fetchFundamental, fetchMarketOverview } from './sources/eastmoney';
import { fetchHKQuote } from './sources/yahoo';
import { fetchUSQuote, fetchUSKLine } from './sources/twelvedata';
import { fetchUSFundamental } from './sources/alphavantage';
import { fetchNews } from './sources/finnhub';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, { headers: { ...corsHeaders, ...init?.headers }, status: init?.status });
}

const VALID_PERIODS = new Set(['day', 'week', 'month']);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/status') {
        return json({ status: 'ok', timestamp: new Date().toISOString() });
      }

      if (path === '/api/market/overview') {
        const cached = await getCached(request, env, 'overview:cn');
        if (cached) return new Response(cached.body, { headers: { ...corsHeaders, 'X-Cache': 'hit' } });

        const data = await fetchMarketOverview();
        const resp = json(data);
        await putCached(request, env, 'overview:cn', resp, getCacheTTL('overview'));
        return resp;
      }

      if (path === '/api/search') {
        const q = url.searchParams.get('q');
        if (!q) return json({ error: 'Missing q param' }, { status: 400 });

        const cacheKey = `search:${q}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeaders, 'X-Cache': 'hit' } });

        // Use Twelve Data search (works globally)
        const searchUrl = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(q)}&apikey=${env.TWELVEDATA_API_KEY}`;
        const res = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
        const data = await res.json() as { data?: Array<{ symbol: string; instrument_name: string; exchange: string; instrument_type: string }> };

        const results = (data.data || []).slice(0, 10).map((item) => {
          let market: 'cn' | 'us' | 'hk' = 'us';
          if (item.exchange === 'SHE' || item.exchange === 'SHA') market = 'cn';
          else if (item.exchange === 'HKG') market = 'hk';
          return {
            code: item.symbol,
            name: item.instrument_name,
            market,
          };
        });

        const resp = json(results);
        await putCached(request, env, cacheKey, resp, getCacheTTL('search'));
        return resp;
      }

      const quoteMatch = path.match(/^\/api\/stock\/(cn|us|hk)\/([A-Za-z0-9]+)\/quote$/);
      if (quoteMatch) {
        const [, market, code] = quoteMatch;
        const cacheKey = `quote:${market}:${code}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeaders, 'X-Cache': 'hit' } });

        let data;
        if (market === 'cn') {
          try {
            data = await fetchQuote(code);
          } catch {
            // Fallback to Twelve Data for A-shares
            try { data = await fetchUSQuote(code, env.TWELVEDATA_API_KEY); data.market = 'cn'; } catch { throw new Error(`No data for CN code: ${code}`); }
          }
        } else if (market === 'hk') {
          data = await fetchHKQuote(code);
        } else if (market === 'us') {
          const rl = checkRateLimit('twelvedata', 8, 60000);
          if (!rl.allowed) return json({ error: 'Rate limited' }, { status: 429 });
          data = await fetchUSQuote(code, env.TWELVEDATA_API_KEY);
        } else {
          return json({ error: 'Unknown market' }, { status: 400 });
        }

        const resp = json(data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('quote'));
        return resp;
      }

      const klineMatch = path.match(/^\/api\/stock\/(cn|us|hk)\/([A-Za-z0-9]+)\/kline$/);
      if (klineMatch) {
        const [, market, code] = klineMatch;
        const rawPeriod = url.searchParams.get('period') || 'day';
        const period = VALID_PERIODS.has(rawPeriod) ? rawPeriod as 'day' | 'week' | 'month' : 'day';
        const cacheKey = `kline:${market}:${code}:${period}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeaders, 'X-Cache': 'hit' } });

        let data;
        if (market === 'cn') {
          data = await fetchKLine(code, period);
        } else if (market === 'us') {
          const rl = checkRateLimit('twelvedata-kline', 20, 60000);
          if (!rl.allowed) return json({ error: 'Rate limited' }, { status: 429 });
          data = await fetchUSKLine(code, env.TWELVEDATA_API_KEY, period);
        } else {
          return json({ error: 'K-line not supported for this market' }, { status: 400 });
        }

        const resp = json(data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('kline'));
        return resp;
      }

      const fundMatch = path.match(/^\/api\/stock\/(cn|us|hk)\/([A-Za-z0-9]+)\/fundamental$/);
      if (fundMatch) {
        const [, market, code] = fundMatch;
        const cacheKey = `fundamental:${market}:${code}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeaders, 'X-Cache': 'hit' } });

        let data;
        if (market === 'cn') {
          data = await fetchFundamental(code);
        } else if (market === 'us') {
          const rl = checkRateLimit('alphavantage', 5, 60000);
          if (!rl.allowed) return json({ error: 'Rate limited' }, { status: 429 });
          data = await fetchUSFundamental(code, env.ALPHAVANTAGE_API_KEY);
        } else {
          return json({ error: 'Fundamentals not supported for this market' }, { status: 400 });
        }

        const resp = json(data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('fundamental'));
        return resp;
      }

      if (path === '/api/news') {
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 100);
        const rl = checkRateLimit('finnhub', 30, 60000);
        if (!rl.allowed) return json({ error: 'Rate limited' }, { status: 429 });

        const cacheKey = `news:general:${limit}`;
        const cached = await getCached(request, env, cacheKey);
        if (cached) return new Response(cached.body, { headers: { ...corsHeaders, 'X-Cache': 'hit' } });

        const data = await fetchNews(env.FINNHUB_API_KEY, 'general', limit);
        const resp = json(data);
        await putCached(request, env, cacheKey, resp, getCacheTTL('news'));
        return resp;
      }

      return json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Internal error' }, { status: 500 });
    }
  },
};
