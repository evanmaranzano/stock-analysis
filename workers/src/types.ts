export type Market = 'cn' | 'us' | 'hk';

export interface Env {
  TWELVEDATA_API_KEY: string;
  ALPHAVANTAGE_API_KEY: string;
  FINNHUB_API_KEY: string;
  CACHE_KV: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  ENVIRONMENT: string;
}

export interface Quote {
  market: Market;
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  source: string;
}

export interface KLine {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fundamental {
  market: Market;
  code: string;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  revenue: number | null;
  netIncome: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  source: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  datetime: string;
  summary: string;
  related?: string[];
}

export interface MarketOverview {
  market: Market;
  indices: Quote[];
  topGainers: Quote[];
  topLosers: Quote[];
}

export interface DataSourceStatus {
  source: string;
  status: 'ok' | 'fallback' | 'cached' | 'mock' | 'error';
  lastUpdated: string;
  quotaUsed?: number;
  quotaLimit?: number;
}
