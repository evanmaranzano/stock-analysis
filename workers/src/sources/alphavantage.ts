import type { Fundamental } from '../types';

export async function fetchUSFundamental(
  code: string,
  apiKey: string,
): Promise<Fundamental> {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${code}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`AlphaVantage HTTP ${res.status}`);
  const data = await res.json() as {
    PERatio?: string;
    PriceToBookRatio?: string;
    ReturnOnEquityTTM?: string;
    RevenueTTM?: string;
    NetIncomeTTM?: string;
    MarketCapitalization?: string;
    DividendYield?: string;
  };

  return {
    market: 'us',
    code,
    pe: data.PERatio ? parseFloat(data.PERatio) : null,
    pb: data.PriceToBookRatio ? parseFloat(data.PriceToBookRatio) : null,
    roe: data.ReturnOnEquityTTM ? parseFloat(data.ReturnOnEquityTTM) : null,
    revenue: data.RevenueTTM ? parseFloat(data.RevenueTTM) : null,
    netIncome: data.NetIncomeTTM ? parseFloat(data.NetIncomeTTM) : null,
    marketCap: data.MarketCapitalization ? parseFloat(data.MarketCapitalization) : null,
    dividendYield: data.DividendYield ? parseFloat(data.DividendYield) : null,
    source: 'alphavantage',
  };
}
