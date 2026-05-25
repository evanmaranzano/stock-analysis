import type { NewsItem } from '../../api/types';

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
    >
      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</h3>
      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.summary}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <span>{item.source}</span>
        <span>·</span>
        <span>{new Date(item.datetime).toLocaleString('zh-CN')}</span>
      </div>
    </a>
  );
}
