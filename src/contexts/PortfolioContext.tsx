import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Market } from '../api/types';

export interface WatchListItem {
  market: Market;
  code: string;
  name: string;
  addedAt: string;
}

interface PortfolioContextValue {
  watchlist: WatchListItem[];
  addToWatchlist: (item: Omit<WatchListItem, 'addedAt'>) => void;
  removeFromWatchlist: (market: Market, code: string) => void;
  isInWatchlist: (market: Market, code: string) => boolean;
}

const STORAGE_KEY = 'stock-analysis-watchlist';

function loadWatchlist(): WatchListItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchListItem[]>(loadWatchlist);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = useCallback((item: Omit<WatchListItem, 'addedAt'>) => {
    setWatchlist((prev) => {
      if (prev.some((w) => w.market === item.market && w.code === item.code)) return prev;
      return [...prev, { ...item, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFromWatchlist = useCallback((market: Market, code: string) => {
    setWatchlist((prev) => prev.filter((w) => !(w.market === market && w.code === code)));
  }, []);

  const isInWatchlist = useCallback(
    (market: Market, code: string) => watchlist.some((w) => w.market === market && w.code === code),
    [watchlist],
  );

  return (
    <PortfolioContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
