import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../../contexts/PortfolioContext';

export default function WatchList() {
  const { watchlist, removeFromWatchlist } = usePortfolio();
  const navigate = useNavigate();

  if (watchlist.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        自选股列表为空，在股票详情页点击"加自选"添加
      </div>
    );
  }

  return (
    <table className="w-full rounded-lg border border-gray-200 bg-white">
      <thead>
        <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
          <th className="px-4 py-3">代码</th>
          <th className="px-4 py-3">名称</th>
          <th className="px-4 py-3">市场</th>
          <th className="px-4 py-3">添加时间</th>
          <th className="px-4 py-3 text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        {watchlist.map((item) => (
          <tr
            key={`${item.market}-${item.code}`}
            className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
            onClick={() => navigate(`/stock/${item.market}/${item.code}`)}
          >
            <td className="px-4 py-3 text-sm">{item.code}</td>
            <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.market.toUpperCase()}</td>
            <td className="px-4 py-3 text-sm text-gray-500">
              {new Date(item.addedAt).toLocaleDateString('zh-CN')}
            </td>
            <td className="px-4 py-3 text-right">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchlist(item.market, item.code);
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
