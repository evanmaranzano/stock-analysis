import { useDataSource, type DataSourceState } from '../../contexts/DataSourceContext';

const config: Record<DataSourceState, { color: string; label: string }> = {
  live: { color: 'bg-green-500', label: '实时数据' },
  fallback: { color: 'bg-yellow-500', label: '备用数据源' },
  cached: { color: 'bg-blue-500', label: '缓存数据' },
  mock: { color: 'bg-red-500', label: '模拟数据' },
  offline: { color: 'bg-gray-400', label: '离线' },
};

export default function DataSourceStatus() {
  const { state } = useDataSource();
  const { color, label } = config[state];

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
