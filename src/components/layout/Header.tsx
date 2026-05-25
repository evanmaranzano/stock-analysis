import { Link } from 'react-router-dom';
import { useDataSource } from '../../contexts/DataSourceContext';
import DataSourceStatus from '../common/DataSourceStatus';
import StockSearch from '../stock/StockSearch';

export default function Header() {
  const { mockMode, toggleMockMode } = useDataSource();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <Link to="/" className="text-xl font-bold text-gray-900">
        StockLens
      </Link>

      <div className="flex-1 px-8">
        <StockSearch />
      </div>

      <div className="flex items-center gap-4">
        <DataSourceStatus />
        <button
          onClick={toggleMockMode}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          {mockMode ? '关闭 Mock' : '开启 Mock'}
        </button>
      </div>
    </header>
  );
}
