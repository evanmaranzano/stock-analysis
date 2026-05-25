import type { Quote } from '../../api/types';

export default function IndexCard({ quote }: { quote: Quote }) {
  const isUp = quote.change >= 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500">{quote.name}</div>
      <div className="mt-1 text-2xl font-bold">{quote.price.toFixed(2)}</div>
      <div className={`mt-1 text-sm font-medium ${isUp ? 'text-red-600' : 'text-green-600'}`}>
        {isUp ? '+' : ''}{quote.change.toFixed(2)} ({isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%)
      </div>
    </div>
  );
}
