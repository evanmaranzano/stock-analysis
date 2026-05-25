import type { Quote, KLine } from '../types';

function checkError(data: Record<string, unknown>): void {
  if (data.code && typeof data.code === 'number' && data.code >= 400) {
    throw new Error(`TwelveData: ${data.message || 'Unknown error'}`);
  }
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidDateInput(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value) && Number.isFinite(new Date(value * 1000).getTime());
  return false;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export async function fetchUSQuote(code: string, apiKey: string): Promise<Quote> {
  const url = new URL('https://api.twelvedata.com/quote');
  url.searchParams.set('symbol', code);
  url.searchParams.set('apikey', apiKey);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  const data = await res.json() as Record<string, unknown>;
  checkError(data);

  const price = parseFiniteNumber(data.close);
  const change = parseFiniteNumber(data.change);
  const changePercent = parseFiniteNumber(data.percent_change);
  const volume = parseFiniteNumber(data.volume);
  if (
    typeof data.symbol !== 'string' ||
    typeof data.name !== 'string' ||
    price === null ||
    change === null ||
    changePercent === null ||
    volume === null ||
    !isValidDateInput(data.timestamp)
  ) {
    throw new Error('Invalid TwelveData quote response');
  }

  return {
    market: 'us',
    code: data.symbol,
    name: data.name,
    price,
    change,
    changePercent,
    volume,
    timestamp: new Date(Number(data.timestamp) * 1000).toISOString(),
    source: 'twelvedata',
  };
}

export async function fetchUSKLine(
  code: string,
  apiKey: string,
  period: 'day' | 'week' | 'month' = 'day',
): Promise<KLine[]> {
  const interval = period === 'day' ? '1day' : period === 'week' ? '1week' : '1month';
  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', code);
  url.searchParams.set('interval', interval);
  url.searchParams.set('outputsize', '120');
  url.searchParams.set('apikey', apiKey);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`TwelveData kline HTTP ${res.status}`);
  const data = await res.json() as Record<string, unknown>;
  checkError(data);

  const values = data.values as Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;

  if (!Array.isArray(values)) throw new Error(`No kline data for ${code}`);

  const result = values.map((v) => ({
    date: v.datetime,
    open: parseFiniteNumber(v.open),
    high: parseFiniteNumber(v.high),
    low: parseFiniteNumber(v.low),
    close: parseFiniteNumber(v.close),
    volume: parseFiniteNumber(v.volume),
  }));

  if (result.some((v) => (
    typeof v.date !== 'string' ||
    !isValidDateString(v.date) ||
    v.open === null ||
    v.high === null ||
    v.low === null ||
    v.close === null ||
    v.volume === null
  ))) {
    throw new Error('Invalid TwelveData kline response');
  }

  return result as KLine[];
}
