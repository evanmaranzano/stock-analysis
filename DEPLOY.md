# Deployment Guide

## Prerequisites
1. Cloudflare account (free)
2. Wrangler CLI: `npm install -g wrangler`
3. Login: `wrangler login`

## Deploy Workers
1. Set secrets:
   ```bash
   cd workers
   wrangler secret put TWELVEDATA_API_KEY
   wrangler secret put ALPHAVANTAGE_API_KEY
   wrangler secret put FINNHUB_API_KEY
   ```
2. Create KV namespace: `wrangler kv namespace create CACHE_KV`
3. Update `wrangler.toml` with KV namespace ID under `[[kv_namespaces]]`
4. Deploy: `npm run deploy:workers`

## Deploy Frontend
1. Build: `npm run build`
2. Deploy: `wrangler pages deploy dist --project-name stock-analysis`

## Local Development
1. Start Workers: `cd workers && npm run dev` (port 8787)
2. Start Frontend: `npm run dev` (port 5173, proxies /api to Workers)
3. Toggle Mock mode via header button when Workers is not running
