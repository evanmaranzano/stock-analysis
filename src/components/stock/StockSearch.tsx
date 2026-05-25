import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSearch } from '../../api/client';
import type { SearchResult } from '../../api/types';

export default function StockSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSearch(query).then((data) => {
        setResults(data);
        setOpen(data.length > 0);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(item: SearchResult) {
    setOpen(false);
    setQuery('');
    navigate(`/stock/${item.market}/${item.code}`);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索股票代码或名称..."
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((item) => (
            <button
              key={`${item.market}-${item.code}`}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
              onClick={() => handleSelect(item)}
            >
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500">
                {item.code} · {item.market.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
