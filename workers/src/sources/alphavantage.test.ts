import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUSFundamental } from './alphavantage';

describe('Alpha Vantage source validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects provider error payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      Note: 'Thank you for using Alpha Vantage. Our standard API rate limit is 25 requests per day.',
    })));

    await expect(fetchUSFundamental('AAPL', 'test-key')).rejects.toThrow('AlphaVantage');
  });

  it('rejects empty overview payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})));

    await expect(fetchUSFundamental('AAPL', 'test-key')).rejects.toThrow('Invalid AlphaVantage overview response');
  });

  it('converts invalid optional numeric fields to null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      PERatio: 'not-a-number',
      PriceToBookRatio: '42.5',
      ReturnOnEquityTTM: ' ',
    })));

    await expect(fetchUSFundamental('AAPL', 'test-key')).resolves.toMatchObject({
      pe: null,
      pb: 42.5,
      roe: null,
    });
  });
});
