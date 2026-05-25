import type { Quote, KLine, Fundamental, NewsItem, MarketOverview, SearchResult, Market, KLinePeriod } from './types';
import { generateMockQuote, generateMockKLine, generateMockFundamental, generateMockNews, generateMockOverview, generateMockSearch } from './mock';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

let mockMode = false;
let dataSourceState: 'live' | 'fallback' | 'mock' = 'live';

export function isMockMode(): boolean {
  return mockMode || localStorage.getItem('mockMode') === 'true';
}

export function setMockMode(value: boolean): void {
  mockMode = value;
  localStorage.setItem('mockMode', String(value));
  if (value) dataSourceState = 'mock';
}

export function getDataSourceState() {
  return dataSourceState;
}

async function apiFetch<T>(path: string, fallback: () => T): Promise<T> {
  if (isMockMode()) {
    dataSourceState = 'mock';
    return fallback();
  }

  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      console.warn(`API ${path} returned ${res.status}, using fallback`);
      dataSourceState = 'fallback';
      return fallback();
    }
    const data = (await res.json()) as T;
    dataSourceState = 'live';
    return data;
  } catch (err) {
    console.warn(`API ${path} failed:`, err);
    dataSourceState = 'fallback';
    return fallback();
  }
}

export function fetchMarketOverview(): Promise<MarketOverview> {
  return apiFetch('/market/overview', () => generateMockOverview());
}

export function fetchSearch(query: string, market: Market = 'cn'): Promise<SearchResult[]> {
  return apiFetch(`/search?q=${encodeURIComponent(query)}&market=${market}`, () => generateMockSearch(query));
}

export function fetchQuote(market: Market, code: string): Promise<Quote> {
  return apiFetch(`/stock/${market}/${code}/quote`, () => generateMockQuote(market, code));
}

export function fetchKLine(market: Market, code: string, period: KLinePeriod = 'day'): Promise<KLine[]> {
  return apiFetch(`/stock/${market}/${code}/kline?period=${period}`, () => generateMockKLine());
}

export function fetchFundamental(market: Market, code: string): Promise<Fundamental> {
  return apiFetch(`/stock/${market}/${code}/fundamental`, () => generateMockFundamental(market, code));
}

export function fetchNews(limit = 20): Promise<NewsItem[]> {
  return apiFetch(`/news?limit=${limit}`, () => generateMockNews(limit));
}
