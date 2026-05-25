import type { Env } from './types';

const CACHE_TTL: Record<string, number> = {
  quote: 30,
  kline: 3600,
  fundamental: 86400,
  news: 300,
  overview: 30,
  search: 300,
  status: 10,
};

export function getCacheTTL(category: string): number {
  return CACHE_TTL[category] ?? 60;
}

export async function getCached(
  request: Request,
  env: Env,
  key: string,
): Promise<Response | null> {
  const cache = caches.default;
  const cacheUrl = new URL(request.url);
  cacheUrl.pathname = `/__cache__/${key}`;
  const cacheRequest = new Request(cacheUrl.toString());
  const cached = await cache.match(cacheRequest);
  if (cached) return cached;

  const kvData = await env.CACHE_KV.get(key, 'text');
  if (kvData) {
    return new Response(kvData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'kv-hit',
      },
    });
  }

  return null;
}

export async function putCached(
  request: Request,
  env: Env,
  key: string,
  response: Response,
  ttl: number,
): Promise<void> {
  const cloned = response.clone();
  const body = await cloned.text();

  const cache = caches.default;
  const cacheUrl = new URL(request.url);
  cacheUrl.pathname = `/__cache__/${key}`;
  const cacheRequest = new Request(cacheUrl.toString());
  const cacheResponse = new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ttl}`,
    },
  });
  await cache.put(cacheRequest, cacheResponse);

  await env.CACHE_KV.put(key, body, { expirationTtl: ttl * 2 });
}
