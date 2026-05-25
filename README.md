# StockLens - 股票投资分析平台

零成本多市场股票信息分析网站，支持 A 股、美股、港股。

## 功能

- **市场概览** — 大盘指数、涨幅榜、跌幅榜实时数据
- **股票搜索** — 按代码或名称模糊搜索（支持 A 股/美股/港股）
- **个股详情** — 实时行情、K 线图（日/周/月）、基本面数据
- **自选股** — 本地存储，无需登录
- **行情数据源** — 自动降级：实时数据 → 缓存 → 模拟数据

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + ECharts |
| 后端 | Cloudflare Workers（API 代理 + 缓存 + 限流） |
| 部署 | Cloudflare Pages（前端）+ Cloudflare Workers（API） |
| 数据源 | 腾讯财经（A 股）、Twelve Data（美股/搜索）、Finnhub（新闻） |

## 架构

```
浏览器 → Cloudflare Pages（静态前端）
              ↓ API 请求
         Cloudflare Workers（API 代理层）
              ↓ 转发
         腾讯财经 / Twelve Data / Finnhub
```

Workers 层负责：
- 请求缓存（KV + Cache API）
- 速率限制
- 数据格式统一
- API Key 安全存储（Secrets）

## 本地开发

```bash
# 前端
npm install
npm run dev

# Workers（另开终端）
cd workers
npm install
cp .dev.vars.example .dev.vars  # 填入 API Keys
npm run dev
```

## 部署

```bash
# 前端 → Cloudflare Pages
npm run build
npx wrangler pages deploy dist --project-name=stock-analysis

# Workers → Cloudflare Workers
cd workers
npx wrangler deploy
```

## 环境变量

### Workers Secrets（通过 wrangler secret put 设置）

| 变量 | 用途 |
|------|------|
| `TWELVEDATA_API_KEY` | Twelve Data API（美股行情 + 搜索） |
| `FINNHUB_API_KEY` | Finnhub API（财经新闻） |
| `ALPHAVANTAGE_API_KEY` | Alpha Vantage（美股基本面） |

### 前端 `.env.production`

```
VITE_API_BASE=https://your-worker.workers.dev/api
```

## 目录结构

```
stock-analysis/
├── src/                    # 前端源码
│   ├── api/                # API 客户端 + Mock 数据
│   ├── components/         # UI 组件
│   ├── contexts/           # React Context（自选股、数据源状态）
│   ├── pages/              # 页面组件
│   └── hooks/              # 自定义 Hooks
├── workers/                # Cloudflare Workers
│   └── src/
│       ├── sources/        # 数据源适配器（腾讯/Twelve Data/Finnhub）
│       ├── cache.ts        # 缓存策略
│       └── ratelimit.ts    # 速率限制
├── .env.production         # 前端生产环境变量
└── vite.config.ts          # Vite 配置
```

## 免费额度

| 服务 | 免费额度 |
|------|----------|
| Cloudflare Pages | 无限静态请求 |
| Cloudflare Workers | 10 万次/天 |
| Twelve Data | 800 次/天 |
| Finnhub | 60 次/分钟 |
| 腾讯财经 | 无限制 |

## License

MIT
