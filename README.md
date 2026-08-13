# gemini-spend-guard

A drop-in proxy that caps what your Gemini API key can spend — with safety guardrails included.

The API to save user from getting massive api bill, User can keep close eye on prompt token spend can set max budget limit and soft budget limit and get alerted when hitting any of it.

## What it does

- **Hard spend caps** — set a monthly budget, requests get blocked once you hit it. No surprise bill.
- **Soft-limit warnings** — get flagged (response header + payload) once you cross a threshold, before you hit the wall.
- **Exact-match caching** — repeat prompts don't cost you twice.
- **Accurate cost tracking** — counts *all* billed tokens, including model "thinking" tokens that some tools miss.
- **Rate limiting** — per-user/IP sliding window, limit is set for requests allowed per minute.
- **Prometheus metrics** — `/metrics` endpoint out of the box, plug into your existing dashboard.

## Quickstart

```bash
git clone https://github.com/namratagite13/gemini-spend-guard.git  
cd gemini-spend-guard
cp .env.example .env
# edit .env: add your GEMINI_API_KEY
docker compose up --build
```

That's it — Redis and the app both start, wired together automatically.

```bash
curl http://localhost:3000/health
```

Send a request:
```bash
curl -X POST http://localhost:3000/v1/ai/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-proxy-key" \
  -d '{"prompt":"hello there"}'
```

## Configuration

All config lives in `.env` — see `.env.example` for the full list. Key ones:

| Variable | Default | What it does |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Your real Gemini API key |
| `PROXY_KEY` | *(unset)* | Optional shared key. |
| `DEFAULT_MONTHLY_BUDGET_USD` | `10.00` | Hard cap — requests blocked once spend reaches this |
| `SOFT_LIMIT_THRESHOLD_RATIO` | `0.50` | Warn once spend crosses this fraction of the budget |
| `USE_MOCK_GEMINI` | `false` | Set `true` to test the whole pipeline without hitting the real API or spending anything |

## How the pipeline works

```
request → access control → validate payload → rate limit → spend cap check
        → cache check → Gemini call → track spend → respond (+ warning if near limit)
```

## Monitoring

`GET /metrics` exposes standard Prometheus-format metrics: request counts/latency, cache hit rate, token usage, and estimated cost — all broken out by model. Point your existing Prometheus at it, or query it directly.

## Local development without Docker

```bash
npm install
# requires a local Redis instance — redis-server, or docker run -p 6379:6379 redis:alpine
node src/server.js
```

## Contributing

Issues and PRs welcome. If you're adding a feature, check it fits the current scope (cost governance) before adding new surface area — happy to discuss direction in an issue first.

## License

MIT
