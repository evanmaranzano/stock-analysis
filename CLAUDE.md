# StockLens — 股票投资分析平台

## 项目概述
- React + Vite + TypeScript + Tailwind CSS 前端，部署在 Cloudflare Pages
- Cloudflare Workers 做 API 代理层（缓存 + 限流 + 数据源适配）
- 零成本：免费 API + 免费 Cloudflare 托管

## 关键命令
- `npm run build` — 构建前端
- `cd workers && npx wrangler deploy` — 部署 Workers（自动读 .env）
- `cd workers && npx wrangler secret put <NAME>` — 设置 Workers Secret
- `npx wrangler pages deploy dist` — 部署前端到 Pages

## 部署配置
- `workers/.env` — Cloudflare API Token + Account ID（本地，不提交）
- `workers/.dev.vars` — 数据源 API Key（本地开发用，不提交）
- Workers Secrets — 生产环境 API Key（通过 `wrangler secret put` 设置）
- `.env.production` — VITE_API_BASE 烘焙进前端（构建时读取）

## Windows 注意事项
- `wrangler login` OAuth 回调端口 8976 被 Windows 防火墙拦截，改用 API Token
- `wrangler` 自动读取工作目录下 `.env` 文件中的 `CLOUDFLARE_API_TOKEN`

## 数据源
- A 股：东方财富 HTTP API（无需 key）
- 港股：Yahoo Finance（无需 key）
- 美股行情：Twelve Data（免费 800 req/day）
- 美股基本面：Alpha Vantage（免费 25 req/day）
- 新闻：Finnhub（免费 60 req/min）

## 已部署
- Workers API：https://stock-analysis-api.cenghaoyu28.workers.dev
- 前端：https://stock-analysis-7wj.pages.dev
