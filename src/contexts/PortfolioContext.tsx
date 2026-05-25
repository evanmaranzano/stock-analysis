import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Market } from '../api/types';
import { normalizeStockCode } from '../api/client';

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

export function sanitizeWatchlist(value: unknown): WatchListItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is WatchListItem => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
      (candidate.market === 'cn' || candidate.market === 'us' || candidate.market === 'hk') &&
      typeof candidate.code === 'string' &&
      normalizeStockCode(candidate.market, candidate.code) !== null &&
      typeof candidate.name === 'string' &&
      candidate.name.length > 0 &&
      typeof candidate.addedAt === 'string' &&
      !Number.isNaN(Date.parse(candidate.addedAt))
    );
  });
}

function loadWatchlist(): WatchListItem[] {
  try {
    return sanitizeWatchlist(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchListItem[]>(loadWatchlist);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch {
      // Keep in-memory watchlist when storage is unavailable.
    }
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
