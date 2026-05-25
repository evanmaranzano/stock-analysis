import type { Quote, KLine, Fundamental, NewsItem, MarketOverview, SearchResult, Market, KLinePeriod } from './types';
import { generateMockQuote, generateMockKLine, generateMockFundamental, generateMockNews, generateMockOverview, generateMockSearch } from './mock';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const MARKETS = new Set<Market>(['cn', 'us', 'hk']);

let mockMode = false;
let dataSourceState: 'live' | 'fallback' | 'mock' = 'live';

function safeGetStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep in-memory state when storage is unavailable.
  }
}

export function isValidMarket(value: unknown): value is Market {
  return typeof value === 'string' && MARKETS.has(value as Market);
}

export function normalizeStockCode(market: Market, code: string): string | null {
  const normalized = code.trim().toUpperCase();
  if (market === 'cn') return /^\d{6}$/.test(normalized) ? normalized : null;
  if (market === 'hk') return /^\d{1,5}$/.test(normalized) ? normalized.padStart(4, '0') : null;
  return /^[A-Z]{1,5}$/.test(normalized) ? normalized : null;
}

export function isMockMode(): boolean {
  return mockMode || safeGetStorage('mockMode') === 'true';
}

export function setMockMode(value: boolean): void {
  mockMode = value;
  safeSetStorage('mockMode', String(value));
  if (value) dataSourceState = 'mock';
}

export function getDataSourceState() {
  return dataSourceState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isQuote(value: unknown): value is Quote {
  if (!isRecord(value)) return false;
  return (
    isValidMarket(value.market) &&
    typeof value.code === 'string' &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.price) &&
    isFiniteNumber(value.change) &&
    isFiniteNumber(value.changePercent) &&
    isFiniteNumber(value.volume) &&
    isValidDateString(value.timestamp) &&
    typeof value.source === 'string'
  );
}

function isKLine(value: unknown): value is KLine {
  if (!isRecord(value)) return false;
  return (
    typeof value.date === 'string' &&
    isFiniteNumber(value.open) &&
    isFiniteNumber(value.high) &&
    isFiniteNumber(value.low) &&
    isFiniteNumber(value.close) &&
    isFiniteNumber(value.volume)
  );
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isFundamental(value: unknown): value is Fundamental {
  if (!isRecord(value)) return false;
  return (
    isValidMarket(value.market) &&
    typeof value.code === 'string' &&
    isNullableNumber(value.pe) &&
    isNullableNumber(value.pb) &&
    isNullableNumber(value.roe) &&
    isNullableNumber(value.revenue) &&
    isNullableNumber(value.netIncome) &&
    isNullableNumber(value.marketCap) &&
    isNullableNumber(value.dividendYield) &&
    typeof value.source === 'string'
  );
}

function isNewsItem(value: unknown): value is NewsItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.url === 'string' &&
    typeof value.source === 'string' &&
    isValidDateString(value.datetime) &&
    typeof value.summary === 'string' &&
    (value.related === undefined || isStringArray(value.related))
  );
}

function isMarketOverview(value: unknown): value is MarketOverview {
  if (!isRecord(value)) return false;
  return (
    isValidMarket(value.market) &&
    Array.isArray(value.indices) &&
    value.indices.every(isQuote) &&
    Array.isArray(value.topGainers) &&
    value.topGainers.every(isQuote) &&
    Array.isArray(value.topLosers) &&
    value.topLosers.every(isQuote)
  );
}

function isSearchResult(value: unknown): value is SearchResult {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === 'string' &&
    typeof value.name === 'string' &&
    isValidMarket(value.market) &&
    normalizeStockCode(value.market, value.code) !== null
  );
}

function validateResponse<T>(data: unknown, isValid: (value: unknown) => value is T): T {
  if (!isValid(data)) throw new Error('Invalid API response');
  return data;
}

async function apiFetch<T>(path: string, fallback: () => T, isValid: (value: unknown) => value is T): Promise<T> {
  if (isMockMode()) {
    dataSourceState = 'mock';
    return fallback();
  }

  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      console.warn(`API ${path} returned ${res.status}`);
      dataSourceState = 'fallback';
      throw new Error(`API ${path} returned ${res.status}`);
    }
    const data = validateResponse(await res.json(), isValid);
    dataSourceState = 'live';
    return data;
  } catch (err) {
    dataSourceState = 'fallback';
    throw err;
  }
}

export function fetchMarketOverview(): Promise<MarketOverview> {
  return apiFetch('/market/overview', () => generateMockOverview(), isMarketOverview);
}

export function fetchSearch(query: string, market: Market = 'cn'): Promise<SearchResult[]> {
  const q = query.trim().slice(0, 64);
  return apiFetch(`/search?q=${encodeURIComponent(q)}&market=${market}`, () => generateMockSearch(q), (value): value is SearchResult[] => (
    Array.isArray(value) && value.every(isSearchResult)
  ));
}

export function fetchQuote(market: Market, code: string): Promise<Quote> {
  const safeCode = normalizeStockCode(market, code);
  if (!isValidMarket(market) || !safeCode) return Promise.reject(new Error('Invalid stock code'));
  return apiFetch(`/stock/${market}/${encodeURIComponent(safeCode)}/quote`, () => generateMockQuote(market, safeCode), isQuote);
}

export function fetchKLine(market: Market, code: string, period: KLinePeriod = 'day'): Promise<KLine[]> {
  const safeCode = normalizeStockCode(market, code);
  if (!isValidMarket(market) || !safeCode) return Promise.reject(new Error('Invalid stock code'));
  return apiFetch(`/stock/${market}/${encodeURIComponent(safeCode)}/kline?period=${period}`, () => generateMockKLine(), (value): value is KLine[] => (
    Array.isArray(value) && value.every(isKLine)
  ));
}

export function fetchFundamental(market: Market, code: string): Promise<Fundamental> {
  const safeCode = normalizeStockCode(market, code);
  if (!isValidMarket(market) || !safeCode) return Promise.reject(new Error('Invalid stock code'));
  return apiFetch(`/stock/${market}/${encodeURIComponent(safeCode)}/fundamental`, () => generateMockFundamental(market, safeCode), isFundamental);
}

export function fetchNews(limit = 20): Promise<NewsItem[]> {
  return apiFetch(`/news?limit=${limit}`, () => generateMockNews(limit), (value): value is NewsItem[] => (
    Array.isArray(value) && value.every(isNewsItem)
  ));
}
