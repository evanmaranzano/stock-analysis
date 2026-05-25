import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Market, KLinePeriod } from '../api/types';
import { isValidMarket, normalizeStockCode } from '../api/client';
import { useStockQuote, useStockKLine, useStockFundamental, useStockNews } from '../hooks/useStock';
import StockDetail from '../components/stock/StockDetail';
import KLineChart from '../components/stock/KLineChart';
import FundamentalPanel from '../components/fundamental/FundamentalPanel';
import NewsList from '../components/news/NewsList';

type Tab = 'kline' | 'fundamental' | 'news';

export default function StockPage() {
  const { market, code } = useParams<{ market: Market; code: string }>();
  const [tab, setTab] = useState<Tab>('kline');
  const [period, setPeriod] = useState<KLinePeriod>('day');

  const isValidRoute = isValidMarket(market);
  const safeMarket = isValidRoute ? market : 'cn';
  const safeCode = isValidRoute && code ? normalizeStockCode(safeMarket, code) : null;
  const requestCode = safeCode || '000000';
  const enabled = isValidRoute && Boolean(safeCode);

  const { data: quote, loading: quoteLoading } = useStockQuote(safeMarket, requestCode, enabled);
  const { data: kline, loading: klineLoading } = useStockKLine(safeMarket, requestCode, period, enabled);
  const { data: fundamental, loading: fundLoading } = useStockFundamental(safeMarket, requestCode, enabled);
  const { data: news, loading: newsLoading } = useStockNews(enabled);

  if (!enabled) return <div className="p-6 text-gray-500">参数错误</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'kline', label: 'K 线图' },
    { key: 'fundamental', label: '基本面' },
    { key: 'news', label: '新闻' },
  ];

  return (
    <div className="space-y-6">
      {quote ? (
        <StockDetail quote={quote} />
      ) : quoteLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
      ) : (
        <div className="text-gray-500">无法获取行情</div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex border-b border-gray-200">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-6 py-3 text-sm font-medium ${
                tab === key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'kline' && (
            <KLineChart data={kline} loading={klineLoading} period={period} onPeriodChange={setPeriod} />
          )}
          {tab === 'fundamental' && <FundamentalPanel data={fundamental} loading={fundLoading} />}
          {tab === 'news' && <NewsList data={news} loading={newsLoading} />}
        </div>
      </div>
    </div>
  );
}
