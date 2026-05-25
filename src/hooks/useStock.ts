import { useState, useEffect } from 'react';
import { fetchQuote, fetchKLine, fetchFundamental, fetchNews } from '../api/client';
import type { Quote, KLine, Fundamental, NewsItem, Market, KLinePeriod } from '../api/types';

export function useStockQuote(market: Market, code: string) {
  const [data, setData] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchQuote(market, code).then(setData).finally(() => setLoading(false));
  }, [market, code]);

  return { data, loading };
}

export function useStockKLine(market: Market, code: string, period: KLinePeriod = 'day') {
  const [data, setData] = useState<KLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchKLine(market, code, period).then(setData).finally(() => setLoading(false));
  }, [market, code, period]);

  return { data, loading };
}

export function useStockFundamental(market: Market, code: string) {
  const [data, setData] = useState<Fundamental | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFundamental(market, code).then(setData).finally(() => setLoading(false));
  }, [market, code]);

  return { data, loading };
}

export function useStockNews() {
  const [data, setData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchNews().then(setData).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
