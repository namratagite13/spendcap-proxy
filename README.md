

https://github.com/user-attachments/assets/e6f99e96-8da2-4b1f-9d72-03f4030b77bc





# gemini-spend-guard

A drop-in proxy that caps what your Gemini API key can spend — hard budget limits, soft-limit alerts, and caching, so a shared key can't blow your bill.  

## What it does

- **Hard spend caps** — set a monthly budget, requests get blocked once you hit it. No surprise bill.
- **Soft-limit warnings** — get flagged (response header + payload) once you cross a threshold, before you hit the wall.
- **Exact-match caching** — repeat prompts don't cost you twice.
- **Accurate cost tracking** — counts *all* billed tokens, including model "thinking" tokens that some tools miss.
- **Rate limiting** — per-user/IP sliding window, limit is set for requests allowed per minute.
- **Prometheus metrics** — `/metrics` endpoint out of the box, plug into your existing dashboard.

## Quickstart

```bash
git clone https://github.com/namratagite13/spendcap-proxy.git  
cd spendcap-proxy
cp .env.example .env
# edit .env: add your GEMINI_API_KEY
docker compose up --build
```

That's it — Redis and the app both start, wired together automatically.

```bash
curl http://localhost:8080/health
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
| `ALERT_WEBHOOK_URL` | *(unset)* | Optional. POSTed to when a user crosses the soft limit — see [Budget alerts](#budget-alerts) below |
| `ALERT_WEBHOOK_URL_CRITICAL` | *(unset)* | Optional. POSTed to when a user hits the hard cap (a 402 block). Falls back to `ALERT_WEBHOOK_URL` if unset — set this separately if you want hard-stop alerts routed somewhere more urgent |  

## How the pipeline works

```
request → access control → validate payload → rate limit → spend cap check
        → cache check → Gemini call → track spend → respond (+ warning if near limit)
```
## Budget alerts
 
When a user crosses the soft-limit threshold, the proxy always surfaces it two ways by default:
 
- an `X-Budget-Warning` header on the response
- a `warning` object in the JSON body
That's enough if whatever's calling this proxy actually surfaces it to a human. If you want to be notified independently of that — without watching logs or API responses — set `ALERT_WEBHOOK_URL` in your `.env` to any webhook-compatible endpoint. The proxy fires two distinct events, each suppressed to once per 24h per severity so you're not spammed on every request:
 
| Event | Fires when | Sent to |
|---|---|---|
| `budget.soft_limit_crossed` | Spend crosses `SOFT_LIMIT_THRESHOLD_RATIO` | `ALERT_WEBHOOK_URL` |
| `budget.hard_limit_crossed` | Spend hits the monthly cap (request gets blocked with a 402) | `ALERT_WEBHOOK_URL_CRITICAL`, falling back to `ALERT_WEBHOOK_URL` if unset |
 
Payload shape (identical for both events, `event` field tells them apart):
```json
{
  "event": "budget.soft_limit_crossed",
  "userId": "default",
  "currentSpendUSD": 6.000008,
  "maxBudgetUSD": 10,
  "percentUsed": 60,
  "timestamp": "2026-08-13T19:29:34.424Z"
}
```
 
This is intentionally a generic webhook, not a built-in email/SMS integration — plug it into:
- a **Slack** or **Discord** incoming webhook URL, directly
- **Zapier**, **Make**, or **n8n**, if you want it turned into an email or something else
- your own endpoint, if you want to handle it yourself
Want hard-stop alerts in a different, more urgent channel than soft-limit warnings? Set `ALERT_WEBHOOK_URL_CRITICAL` separately — otherwise both events go to the same `ALERT_WEBHOOK_URL`.
 
Leave both unset and the proxy behaves exactly as if this didn't exist — no breaking change, no required setup.



## Monitoring

`GET /metrics` exposes standard Prometheus-format metrics: request counts/latency, cache hit rate, token usage, and estimated cost — all broken out by model. Point your existing Prometheus at it, or query it directly.

## Local development without Docker

```bash
npm install
# requires a local Redis instance — redis-server, or docker run -p 6379:6379 redis:alpine
node src/server.js OR
npm run dev
```

## Contributing

Issues and PRs welcome. If you're adding a feature, check it fits the current scope (cost governance) before adding new surface area — happy to discuss direction in an issue first.

## License

MIT
