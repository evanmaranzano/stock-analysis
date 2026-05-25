import type { NewsItem } from '../../api/types';
import NewsCard from './NewsCard';
import Loading from '../common/Loading';

interface Props {
  data: NewsItem[];
  loading: boolean;
}

export default function NewsList({ data, loading }: Props) {
  if (loading) return <Loading rows={4} />;
  if (data.length === 0) return <div className="text-gray-500">暂无新闻</div>;

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
