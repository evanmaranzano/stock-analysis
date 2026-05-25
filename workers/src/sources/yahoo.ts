import type { Quote } from '../types';

function toYahooCode(code: string): string {
  return `${code.padStart(4, '0')}.HK`;
}

export async function fetchHKQuote(code: string): Promise<Quote> {
  const yahooCode = toYahooCode(code);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooCode}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${code}`);

  const data = await res.json() as {
    chart: {
      result: Array<{
        meta: { regularMarketPrice: number; previousClose: number; shortName: string };
        indicators: { quote: Array<{ volume: number[] }> };
      }> | null;
    };
  };

  const result = data.chart.result?.[0];
  if (!result) throw new Error(`No data for HK code: ${code}`);

  const price = result.meta.regularMarketPrice;
  const prevClose = result.meta.previousClose;
  const change = price - prevClose;

  return {
    market: 'hk',
    code,
    name: result.meta.shortName,
    price,
    change,
    changePercent: prevClose ? (change / prevClose) * 100 : 0,
    volume: result.indicators.quote[0]?.volume?.[0] ?? 0,
    timestamp: new Date().toISOString(),
    source: 'yahoo',
  };
}
