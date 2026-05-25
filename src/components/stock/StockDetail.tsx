import type { Quote } from '../../api/types';
import { usePortfolio } from '../../contexts/PortfolioContext';

export default function StockDetail({ quote }: { quote: Quote }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = usePortfolio();
  const inWatchlist = isInWatchlist(quote.market, quote.code);
  const isUp = quote.change >= 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{quote.name}</h1>
          <p className="text-sm text-gray-500">
            {quote.code} · {quote.market.toUpperCase()}
          </p>
        </div>
        <button
          onClick={() =>
            inWatchlist
              ? removeFromWatchlist(quote.market, quote.code)
              : addToWatchlist({ market: quote.market, code: quote.code, name: quote.name })
          }
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            inWatchlist ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {inWatchlist ? '已自选' : '+ 加自选'}
        </button>
      </div>

      <div className="mt-4 flex items-baseline gap-4">
        <span className="text-4xl font-bold">{quote.price.toFixed(2)}</span>
        <span className={`text-lg font-medium ${isUp ? 'text-red-600' : 'text-green-600'}`}>
          {isUp ? '+' : ''}{quote.change.toFixed(2)} ({isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%)
        </span>
      </div>

      <div className="mt-4 flex gap-6 text-sm text-gray-500">
        <span>成交量: {(quote.volume / 10000).toFixed(0)} 万手</span>
        <span>数据源: {quote.source}</span>
      </div>
    </div>
  );
}
