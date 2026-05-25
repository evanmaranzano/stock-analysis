import { useState, useEffect, useRef } from 'react';
import { fetchQuote, fetchKLine, fetchFundamental, fetchNews } from '../api/client';
import type { Quote, KLine, Fundamental, NewsItem, Market, KLinePeriod } from '../api/types';

export function useStockQuote(market: Market, code: string, enabled = true) {
  const [data, setData] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    fetchQuote(market, code)
      .then((d) => { if (id === reqId.current) setData(d); })
      .catch(() => { if (id === reqId.current) setData(null); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [market, code, enabled]);

  return { data, loading };
}

export function useStockKLine(market: Market, code: string, period: KLinePeriod = 'day', enabled = true) {
  const [data, setData] = useState<KLine[]>([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    fetchKLine(market, code, period)
      .then((d) => { if (id === reqId.current) setData(d); })
      .catch(() => { if (id === reqId.current) setData([]); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [market, code, period, enabled]);

  return { data, loading };
}

export function useStockFundamental(market: Market, code: string, enabled = true) {
  const [data, setData] = useState<Fundamental | null>(null);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    fetchFundamental(market, code)
      .then((d) => { if (id === reqId.current) setData(d); })
      .catch(() => { if (id === reqId.current) setData(null); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [market, code, enabled]);

  return { data, loading };
}

export function useStockNews(enabled = true) {
  const [data, setData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    fetchNews()
      .then((d) => { if (id === reqId.current) setData(d); })
      .catch(() => { if (id === reqId.current) setData([]); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [enabled]);

  return { data, loading };
}
