import type { Quote, KLine, Fundamental, MarketOverview } from '../types';

const PRICE_DIVISOR = 100;

function toTencentCode(code: string): string {
  if (code.startsWith('6') || code.startsWith('9')) return `sh${code}`;
  return `sz${code}`;
}

function parseTencentQuote(raw: string): Quote | null {
  // Format: v_sh600519="1~贵州茅台~600519~1285.88~1290.20~..."
  const match = raw.match(/v_(\w+)="(.+)"/);
  if (!match) return null;

  const [, , data] = match;
  const parts = data.split('~');
  if (parts.length < 35) return null;

  const name = parts[1];
  const code = parts[2];
  const price = parseFloat(parts[3]);
  const prevClose = parseFloat(parts[4]);
  const change = price - prevClose;
  const volume = parseInt(parts[6], 10) || 0;
  const market: 'cn' = 'cn';

  return {
    market,
    code,
    name,
    price,
    change,
    changePercent: prevClose ? (change / prevClose) * 100 : 0,
    volume,
    timestamp: new Date().toISOString(),
    source: 'tencent',
  };
}

async function fetchTencentRaw(codes: string[]): Promise<string> {
  const codeStr = codes.map(toTencentCode).join(',');
  const url = `https://qt.gtimg.cn/q=${codeStr}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Tencent HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder('gb18030').decode(buf);
}

export async function fetchQuote(code: string): Promise<Quote> {
  const raw = await fetchTencentRaw([code]);
  const quote = parseTencentQuote(raw);
  if (!quote) throw new Error(`Failed to parse quote for ${code}`);
  return quote;
}

export async function fetchKLine(
  code: string,
  period: 'day' | 'week' | 'month' = 'day',
): Promise<KLine[]> {
  // Use Tencent web K-line API
  const tcCode = toTencentCode(code);
  const periodMap = { day: 'day', week: 'week', month: 'month' };
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tcCode},${periodMap[period]},,120,qfq`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Tencent kline HTTP ${res.status}`);

  const data = await res.json() as Record<string, unknown>;
  const inner = data.data as Record<string, unknown> | undefined;
  if (!inner) throw new Error(`No kline data for ${code}`);

  const stockData = inner[tcCode] as Record<string, unknown> | undefined;
  const klines = (stockData?.[`${periodMap[period]}qfq`] || stockData?.[periodMap[period]]) as string[][] | undefined;
  if (!klines) throw new Error(`No kline array for ${code}`);

  return klines.map((item) => ({
    date: item[0],
    open: parseFloat(item[1]),
    close: parseFloat(item[2]),
    high: parseFloat(item[3]),
    low: parseFloat(item[4]),
    volume: parseInt(item[5], 10) || 0,
  }));
}

export async function fetchFundamental(code: string): Promise<Fundamental> {
  // Use Tencent basic info
  const raw = await fetchTencentRaw([code]);
  const match = raw.match(/v_(\w+)="(.+)"/);
  if (!match) throw new Error(`No data for ${code}`);

  const parts = match[2].split('~');
  const pe = parseFloat(parts[39]) || null;
  const pb = parseFloat(parts[46]) || null;
  const marketCap = parseFloat(parts[45]) ? parseFloat(parts[45]) * 1e8 : null; // 亿元 → 元

  return {
    market: 'cn',
    code,
    pe,
    pb,
    roe: null,
    revenue: null,
    netIncome: null,
    marketCap,
    dividendYield: null,
    source: 'tencent',
  };
}

export async function fetchMarketOverview(): Promise<MarketOverview> {
  // Fetch indices + popular stocks in one batch
  const codes = [
    // Indices
    'sh000001', 'sz399001', 'sz399006',
    // Popular A-shares for gainers/losers
    'sh600519', 'sz000858', 'sh601318', 'sh600036', 'sh601398',
    'sz000001', 'sh600276', 'sz300750', 'sh688981', 'sz002594',
    'sh601012', 'sz000333', 'sh600900', 'sz002475', 'sh601899',
  ];

  const url = `https://qt.gtimg.cn/q=${codes.join(',')}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Tencent overview HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const raw = new TextDecoder('gb18030').decode(buf);

  const indices: Quote[] = [];
  const stocks: Quote[] = [];
  const lines = raw.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const quote = parseTencentQuote(line);
    if (!quote) continue;
    const cleanCode = quote.code.replace(/^(sh|sz)/, '');
    quote.code = cleanCode;

    if (['000001', '399001', '399006'].includes(cleanCode)) {
      indices.push(quote);
    } else {
      stocks.push(quote);
    }
  }

  const sorted = stocks.sort((a, b) => b.changePercent - a.changePercent);
  const topGainers = sorted.slice(0, 5);
  const topLosers = sorted.slice(-5).reverse();

  return { market: 'cn', indices, topGainers, topLosers };
}
