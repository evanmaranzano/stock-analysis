import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMarketOverview } from '../../api/client';
import type { MarketOverview as MarketOverviewType, Quote } from '../../api/types';
import IndexCard from './IndexCard';
import Loading from '../common/Loading';

function QuoteRow({ quote }: { quote: Quote }) {
  const navigate = useNavigate();
  const isUp = quote.change >= 0;

  return (
    <tr
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => navigate(`/stock/${quote.market}/${quote.code}`)}
    >
      <td className="px-3 py-2 text-sm">{quote.code}</td>
      <td className="px-3 py-2 text-sm font-medium">{quote.name}</td>
      <td className="px-3 py-2 text-sm text-right">{quote.price.toFixed(2)}</td>
      <td className={`px-3 py-2 text-sm text-right font-medium ${isUp ? 'text-red-600' : 'text-green-600'}`}>
        {isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%
      </td>
    </tr>
  );
}

export default function MarketOverview() {
  const [data, setData] = useState<MarketOverviewType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketOverview()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading rows={6} />;
  if (!data) return <div className="text-gray-500">暂无数据</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-lg font-semibold">大盘指数</h2>
        <div className="grid grid-cols-3 gap-4">
          {data.indices.map((q) => (
            <IndexCard key={q.code} quote={q} />
          ))}
        </div>
      </div>

      {data.topGainers.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">涨幅榜</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="px-3 py-2">代码</th>
                <th className="px-3 py-2">名称</th>
                <th className="px-3 py-2 text-right">价格</th>
                <th className="px-3 py-2 text-right">涨跌幅</th>
              </tr>
            </thead>
            <tbody>
              {data.topGainers.map((q) => (
                <QuoteRow key={q.code} quote={q} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
