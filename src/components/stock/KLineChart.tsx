import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { KLine as KLineType, KLinePeriod } from '../../api/types';
import Loading from '../common/Loading';

interface Props {
  data: KLineType[];
  loading: boolean;
  period: KLinePeriod;
  onPeriodChange: (period: KLinePeriod) => void;
}

export default function KLineChart({ data, loading, period, onPeriodChange }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInstance.current = echarts.init(chartRef.current);
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || data.length === 0) return;

    const dates = data.map((d) => d.date);
    const ohlc = data.map((d) => [d.open, d.close, d.low, d.high]);
    const volumes = data.map((d) => d.volume);

    function calcMA(days: number): (number | null)[] {
      return data.map((_, i) => {
        if (i < days - 1) return null;
        const sum = data.slice(i - days + 1, i + 1).reduce((s, d) => s + d.close, 0);
        return Math.round((sum / days) * 100) / 100;
      });
    }

    chartInstance.current.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      grid: [
        { left: '10%', right: '8%', top: '8%', height: '50%' },
        { left: '10%', right: '8%', top: '68%', height: '20%' },
      ],
      xAxis: [
        { type: 'category', data: dates, gridIndex: 0, boundaryGap: true },
        { type: 'category', data: dates, gridIndex: 1, boundaryGap: true },
      ],
      yAxis: [
        { scale: true, gridIndex: 0 },
        { scale: true, gridIndex: 1, splitNumber: 2 },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 60, end: 100 },
      ],
      series: [
        {
          type: 'candlestick',
          data: ohlc,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: '#ef4444',
            color0: '#22c55e',
            borderColor: '#ef4444',
            borderColor0: '#22c55e',
          },
        },
        {
          name: 'MA5',
          type: 'line',
          data: calcMA(5),
          smooth: true,
          lineStyle: { width: 1 },
          xAxisIndex: 0,
          yAxisIndex: 0,
        },
        {
          name: 'MA10',
          type: 'line',
          data: calcMA(10),
          smooth: true,
          lineStyle: { width: 1 },
          xAxisIndex: 0,
          yAxisIndex: 0,
        },
        {
          name: 'MA20',
          type: 'line',
          data: calcMA(20),
          smooth: true,
          lineStyle: { width: 1 },
          xAxisIndex: 0,
          yAxisIndex: 0,
        },
        {
          type: 'bar',
          data: volumes,
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: {
            color: (params: { dataIndex: number }) => {
              const d = data[params.dataIndex];
              return d && d.close >= d.open ? '#ef4444' : '#22c55e';
            },
          },
        },
      ],
    });
  }, [data]);

  useEffect(() => {
    function handleResize() {
      chartInstance.current?.resize();
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <Loading rows={8} />;

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(['day', 'week', 'month'] as KLinePeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`rounded-md px-3 py-1 text-sm ${
              period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === 'day' ? '日K' : p === 'week' ? '周K' : '月K'}
          </button>
        ))}
      </div>
      <div ref={chartRef} className="h-[400px] w-full" />
    </div>
  );
}
