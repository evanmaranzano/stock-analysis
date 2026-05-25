import type { Quote, KLine } from '../types';

interface TwelveDataError {
  code: number;
  message: string;
}

function checkError(data: Record<string, unknown>): void {
  if (data.code && typeof data.code === 'number' && data.code >= 400) {
    throw new Error(`TwelveData: ${data.message || 'Unknown error'}`);
  }
}

export async function fetchUSQuote(code: string, apiKey: string): Promise<Quote> {
  const url = `https://api.twelvedata.com/quote?symbol=${code}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  const data = await res.json() as Record<string, unknown>;
  checkError(data);

  return {
    market: 'us',
    code: data.symbol as string,
    name: data.name as string,
    price: parseFloat(data.close as string),
    change: parseFloat(data.change as string),
    changePercent: parseFloat(data.percent_change as string),
    volume: parseInt(data.volume as string, 10),
    timestamp: new Date((data.timestamp as number) * 1000).toISOString(),
    source: 'twelvedata',
  };
}

export async function fetchUSKLine(
  code: string,
  apiKey: string,
  period: 'day' | 'week' | 'month' = 'day',
): Promise<KLine[]> {
  const interval = period === 'day' ? '1day' : period === 'week' ? '1week' : '1month';
  const url = `https://api.twelvedata.com/time_series?symbol=${code}&interval=${interval}&outputsize=120&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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

  if (!values) throw new Error(`No kline data for ${code}`);

  return values.map((v) => ({
    date: v.datetime,
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: parseInt(v.volume, 10),
  }));
}
