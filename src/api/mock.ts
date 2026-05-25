import type { Quote, KLine, Fundamental, NewsItem, MarketOverview, SearchResult, Market } from './types';

export function generateMockQuote(market: Market, code: string): Quote {
  const price = 50 + Math.random() * 200;
  const change = (Math.random() - 0.5) * 10;
  return {
    market,
    code,
    name: market === 'cn' ? `模拟股票${code}` : market === 'us' ? `MOCK${code}` : `Mock HK ${code}`,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round((change / price) * 10000) / 100,
    volume: Math.floor(Math.random() * 10000000),
    timestamp: new Date().toISOString(),
    source: 'mock',
  };
}

export function generateMockKLine(days = 120): KLine[] {
  const result: KLine[] = [];
  let price = 100;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * 5;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    price = close;

    result.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 5000000),
    });
  }
  return result;
}

export function generateMockFundamental(market: Market, code: string): Fundamental {
  return {
    market,
    code,
    pe: Math.round((10 + Math.random() * 40) * 100) / 100,
    pb: Math.round((0.5 + Math.random() * 8) * 100) / 100,
    roe: Math.round((5 + Math.random() * 25) * 100) / 100,
    revenue: Math.floor(Math.random() * 100000000000),
    netIncome: Math.floor(Math.random() * 10000000000),
    marketCap: Math.floor(Math.random() * 500000000000),
    dividendYield: Math.round(Math.random() * 5 * 100) / 100,
    source: 'mock',
  };
}

export function generateMockNews(limit: number): NewsItem[] {
  const titles = [
    '全球市场波动加剧，投资者关注通胀数据',
    '科技股集体反弹，纳斯达克指数上涨',
    '央行宣布维持利率不变，符合市场预期',
    '新能源板块持续走强，多只个股涨停',
    '港股恒生指数收涨，南向资金净流入',
    '美联储会议纪要释放鸽派信号',
    '半导体行业景气度回升，相关ETF获资金青睐',
    '房地产政策持续优化，地产股集体走强',
  ];

  return Array.from({ length: Math.min(limit, titles.length) }, (_, i) => ({
    id: `mock-${i}`,
    title: titles[i],
    url: '#',
    source: ['财联社', '路透社', '彭博', '新浪财经'][i % 4],
    datetime: new Date(Date.now() - i * 3600000).toISOString(),
    summary: '这是一条模拟新闻数据，用于在 API 不可用时展示页面布局。',
  }));
}

export function generateMockOverview(): MarketOverview {
  return {
    market: 'cn',
    indices: [
      { market: 'cn', code: '000001', name: '上证指数', price: 3150.23, change: 15.67, changePercent: 0.5, volume: 234567890, timestamp: new Date().toISOString(), source: 'mock' },
      { market: 'cn', code: '399001', name: '深证成指', price: 10234.56, change: -45.23, changePercent: -0.44, volume: 198765432, timestamp: new Date().toISOString(), source: 'mock' },
      { market: 'cn', code: '399006', name: '创业板指', price: 2045.78, change: 23.45, changePercent: 1.16, volume: 87654321, timestamp: new Date().toISOString(), source: 'mock' },
    ],
    topGainers: [generateMockQuote('cn', '600519'), generateMockQuote('cn', '000858'), generateMockQuote('cn', '601318')],
    topLosers: [generateMockQuote('cn', '600036'), generateMockQuote('cn', '601398'), generateMockQuote('cn', '000001')],
  };
}

export function generateMockSearch(query: string): SearchResult[] {
  const items: SearchResult[] = [
    { code: '600519', name: '贵州茅台', market: 'cn' },
    { code: '000858', name: '五粮液', market: 'cn' },
    { code: 'AAPL', name: 'Apple Inc.', market: 'us' },
    { code: '0700', name: '腾讯控股', market: 'hk' },
  ];
  return items.filter((s) => s.code.includes(query) || s.name.includes(query));
}
