import type { NewsItem } from '../types';

interface FinnhubNewsItem {
  id: number;
  headline: string;
  url: string;
  source: string;
  datetime: number;
  summary: string;
  related?: string | string[];
}

function isFinnhubNewsItem(value: unknown): value is FinnhubNewsItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.datetime !== 'number' || !Number.isFinite(item.datetime)) return false;
  const date = new Date(item.datetime * 1000);
  return (
    typeof item.id === 'number' &&
    typeof item.headline === 'string' &&
    typeof item.url === 'string' &&
    typeof item.source === 'string' &&
    Number.isFinite(date.getTime()) &&
    typeof item.summary === 'string' &&
    (
      item.related === undefined ||
      typeof item.related === 'string' ||
      (Array.isArray(item.related) && item.related.every((value) => typeof value === 'string'))
    )
  );
}

export async function fetchNews(
  apiKey: string,
  category = 'general',
  limit = 20,
): Promise<NewsItem[]> {
  const url = new URL('https://finnhub.io/api/v1/news');
  url.searchParams.set('category', category);
  url.searchParams.set('token', apiKey);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Invalid Finnhub news response');

  return data.filter(isFinnhubNewsItem).slice(0, limit).map((item) => ({
    id: String(item.id),
    title: item.headline,
    url: item.url,
    source: item.source,
    datetime: new Date(item.datetime * 1000).toISOString(),
    summary: item.summary,
    related: Array.isArray(item.related) ? item.related : item.related ? item.related.split(',') : undefined,
  }));
}
