import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUSKLine, fetchUSQuote } from './twelvedata';

describe('TwelveData source validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects quote responses with non-numeric prices', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      close: 'not-a-number',
      change: '1.23',
      percent_change: '0.5',
      volume: '100',
      timestamp: 1779710000,
    })));

    await expect(fetchUSQuote('AAPL', 'test-key')).rejects.toThrow('Invalid TwelveData quote response');
  });

  it('rejects quote responses with blank numeric fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      close: '',
      change: '1.23',
      percent_change: '0.5',
      volume: '100',
      timestamp: 1779710000,
    })));

    await expect(fetchUSQuote('AAPL', 'test-key')).rejects.toThrow('Invalid TwelveData quote response');
  });

  it('rejects quote responses with non-numeric timestamps', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      close: '100',
      change: '1.23',
      percent_change: '0.5',
      volume: '100',
      timestamp: '2026-05-25',
    })));

    await expect(fetchUSQuote('AAPL', 'test-key')).rejects.toThrow('Invalid TwelveData quote response');
  });

  it('rejects quote responses with out-of-range timestamps', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      close: '100',
      change: '1.23',
      percent_change: '0.5',
      volume: '100',
      timestamp: 1e20,
    })));

    await expect(fetchUSQuote('AAPL', 'test-key')).rejects.toThrow('Invalid TwelveData quote response');
  });

  it('rejects kline responses with malformed rows', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      values: [{
        datetime: '2026-05-25',
        open: '100',
        high: 'bad',
        low: '99',
        close: '101',
        volume: '1000',
      }],
    })));

    await expect(fetchUSKLine('AAPL', 'test-key')).rejects.toThrow('Invalid TwelveData kline response');
  });

  it('rejects kline responses with blank numeric fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      values: [{
        datetime: '2026-05-25',
        open: '100',
        high: '102',
        low: ' ',
        close: '101',
        volume: '1000',
      }],
    })));

    await expect(fetchUSKLine('AAPL', 'test-key')).rejects.toThrow('Invalid TwelveData kline response');
  });

  it('rejects kline responses whose values field is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ values: { datetime: '2026-05-25' } })));

    await expect(fetchUSKLine('AAPL', 'test-key')).rejects.toThrow('No kline data for AAPL');
  });

  it('rejects kline rows with invalid dates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      values: [{
        datetime: 'bad-date',
        open: '100',
        high: '102',
        low: '99',
        close: '101',
        volume: '1000',
      }],
    })));

    await expect(fetchUSKLine('AAPL', 'test-key')).rejects.toThrow('Invalid TwelveData kline response');
  });
});
