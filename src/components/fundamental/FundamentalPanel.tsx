import type { Fundamental } from '../../api/types';
import Loading from '../common/Loading';

const metrics = [
  { key: 'pe', label: '市盈率 (PE)', format: (v: number | null) => v?.toFixed(2) ?? '-' },
  { key: 'pb', label: '市净率 (PB)', format: (v: number | null) => v?.toFixed(2) ?? '-' },
  { key: 'roe', label: 'ROE (%)', format: (v: number | null) => (v != null ? `${v.toFixed(2)}%` : '-') },
  { key: 'revenue', label: '营收', format: (v: number | null) => (v != null ? `${(v / 1e8).toFixed(2)} 亿` : '-') },
  { key: 'netIncome', label: '净利润', format: (v: number | null) => (v != null ? `${(v / 1e8).toFixed(2)} 亿` : '-') },
  { key: 'marketCap', label: '市值', format: (v: number | null) => (v != null ? `${(v / 1e8).toFixed(2)} 亿` : '-') },
  { key: 'dividendYield', label: '股息率', format: (v: number | null) => (v != null ? `${v.toFixed(2)}%` : '-') },
];

interface Props {
  data: Fundamental | null;
  loading: boolean;
}

export default function FundamentalPanel({ data, loading }: Props) {
  if (loading) return <Loading rows={4} />;
  if (!data) return <div className="text-gray-500">暂无基本面数据</div>;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {metrics.map(({ key, label, format }) => (
        <div key={key} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="mt-1 text-lg font-semibold">
            {format((data as unknown as Record<string, number | null>)[key])}
          </div>
        </div>
      ))}
      <div className="col-span-full text-right text-xs text-gray-400">数据源: {data.source}</div>
    </div>
  );
}
