import type { NewsItem } from '../types';

export async function fetchNews(
  apiKey: string,
  category = 'general',
  limit = 20,
): Promise<NewsItem[]> {
  const url = `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json() as Array<{
    id: number;
    headline: string;
    url: string;
    source: string;
    datetime: number;
    summary: string;
    related?: string | string[];
  }>;

  return data.slice(0, limit).map((item) => ({
    id: String(item.id),
    title: item.headline,
    url: item.url,
    source: item.source,
    datetime: new Date(item.datetime * 1000).toISOString(),
    summary: item.summary,
    related: Array.isArray(item.related) ? item.related : item.related ? item.related.split(',') : undefined,
  }));
}
