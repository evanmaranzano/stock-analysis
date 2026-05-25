import type { Fundamental } from '../types';

function parseOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === 'None') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchUSFundamental(
  code: string,
  apiKey: string,
): Promise<Fundamental> {
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'OVERVIEW');
  url.searchParams.set('symbol', code);
  url.searchParams.set('apikey', apiKey);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`AlphaVantage HTTP ${res.status}`);
  const data = await res.json() as {
    PERatio?: string;
    PriceToBookRatio?: string;
    ReturnOnEquityTTM?: string;
    RevenueTTM?: string;
    NetIncomeTTM?: string;
    MarketCapitalization?: string;
    DividendYield?: string;
    Note?: string;
    Information?: string;
    'Error Message'?: string;
  };
  const providerError = data.Note || data.Information || data['Error Message'];
  if (providerError) throw new Error(`AlphaVantage: ${providerError}`);
  if (!Object.keys(data).some((key) => key !== 'Symbol')) {
    throw new Error('Invalid AlphaVantage overview response');
  }

  return {
    market: 'us',
    code,
    pe: parseOptionalNumber(data.PERatio),
    pb: parseOptionalNumber(data.PriceToBookRatio),
    roe: parseOptionalNumber(data.ReturnOnEquityTTM),
    revenue: parseOptionalNumber(data.RevenueTTM),
    netIncome: parseOptionalNumber(data.NetIncomeTTM),
    marketCap: parseOptionalNumber(data.MarketCapitalization),
    dividendYield: parseOptionalNumber(data.DividendYield),
    source: 'alphavantage',
  };
}
