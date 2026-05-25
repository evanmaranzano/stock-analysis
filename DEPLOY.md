# Deployment Guide

## Prerequisites
1. Cloudflare account (free)
2. Node.js and npm
3. Cloudflare API token in `workers/.env` as `CLOUDFLARE_API_TOKEN`

## Deploy Workers
1. Set secrets:
   ```bash
   cd workers
   npx wrangler secret put TWELVEDATA_API_KEY
   npx wrangler secret put ALPHAVANTAGE_API_KEY
   npx wrangler secret put FINNHUB_API_KEY
   ```
2. Create KV namespace: `cd workers && npx wrangler kv namespace create CACHE_KV`
3. Update `wrangler.toml` with KV namespace ID under `[[kv_namespaces]]`
4. Deploy: `cd workers && npm run deploy`

## Deploy Frontend
1. Build: `npm run build`
2. Deploy: `npx wrangler@4.94.0 pages deploy dist --project-name=stock-analysis`

## Local Development
1. Start Workers: `cd workers && npm run dev` (port 8787)
2. Start Frontend: `npm run dev` (port 5173, proxies /api to Workers)
3. Toggle Mock mode via header button when Workers is not running
