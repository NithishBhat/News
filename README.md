# ☕ Coffee News

A coffee grower's daily dashboard. Bootstrap 5 UI with dark mode (default)
and a light/dark toggle.

- **Center** — headlines as equal-sized rectangular cards stacked vertically,
  newest-first, with category tabs (☕ Coffee / All / Markets / Climate /
  World) and "Load more" pagination (12 at a time). Every feed is
  grower-relevant: coffee trade press (Daily Coffee News, Global Coffee
  Report, Comunicaffe), business desks (BBC, Guardian, NPR), climate
  coverage (Guardian, BBC), and world news (BBC World, Al Jazeera — sports
  stories filtered out).
- **Left** — current weather, 12-hour rain-probability bars, 6-day forecast,
  and a "grower outlook" (frost / drought / heavy-rain / leaf-rust alerts
  derived from the forecast) via [Open-Meteo](https://open-meteo.com)
  (free, no API key).
- **Right** — live quotes and a detailed Chart.js price chart with 1M/3M/6M
  ranges showing **both Arabica Coffee C (ICE US) and Robusta 10-T (ICE
  Europe)** on dual axes, 180 days of end-of-day history via Barchart's
  public site API (free, no key — cookie/XSRF handshake), plus USD/BRL via
  Yahoo Finance, and grower resource links (ICO, World Coffee Research,
  CENICAFE, SCA).

Mobile-friendly: below 992px the three columns stack (weather → prices → news).

## Stack (MERN, Vercel-ready)

- **M** — MongoDB (optional Atlas cache of articles, see `.env.example`)
- **E** — Express (`server/index.js`, local dev only)
- **R** — React 18 + Vite (`src/`)
- **N** — Node serverless functions on Vercel (`api/news.js`, `api/weather.js`, `api/prices.js`)

The `api/` handlers are shared between Express (local) and Vercel (prod), so
dev and prod behave identically.

## Run locally

```bash
npm install
npm run dev:api   # Express API on http://localhost:5001
npm run dev       # Vite dev server on http://localhost:5173 (proxies /api)
```

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
   Vercel auto-detects Vite; the `api/` folder becomes serverless functions.
3. (Optional) Add `MONGODB_URI` in **Project Settings → Environment Variables**
   pointing at a free MongoDB Atlas cluster to persist articles.
4. Deploy. Done.

Or from the CLI: `npx vercel` in this folder.

## Notes

- News is cached server-side for 10 minutes (plus CDN `s-maxage`), so RSS
  hosts aren't hammered.
- Weather defaults to Boston; use the search box to change city (geocoded via
  Open-Meteo's free geocoding API).
"# News" 
