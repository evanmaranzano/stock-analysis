import { usePortfolio } from '../../contexts/PortfolioContext';

export default function PortfolioSummary() {
  const { watchlist } = usePortfolio();

  const counts = {
    cn: watchlist.filter((w) => w.market === 'cn').length,
    us: watchlist.filter((w) => w.market === 'us').length,
    hk: watchlist.filter((w) => w.market === 'hk').length,
  };

  return (
    <div className="flex gap-4">
      {[
        { label: 'A 股', count: counts.cn, color: 'text-red-600' },
        { label: '美股', count: counts.us, color: 'text-blue-600' },
        { label: '港股', count: counts.hk, color: 'text-green-600' },
      ].map(({ label, count, color }) => (
        <div key={label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-xs text-gray-500">{label}</div>
          <div className={`text-xl font-bold ${color}`}>{count}</div>
        </div>
      ))}
    </div>
  );
}
