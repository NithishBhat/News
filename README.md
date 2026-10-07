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
  CENICAFE, SCA). Prices can be displayed in USD, INR, EUR, BRL or GBP using
  ECB reference rates from [Frankfurter](https://www.frankfurter.app).
- **Crop calendar** — planting / flowering / harvest / pruning windows for
  arabica and robusta across 16 coffee-growing regions (India, Colombia,
  Brazil, Ethiopia, Vietnam, East Africa, Guatemala, Sumatra), compared
  against 5-year monthly climate normals and a 16-day rain forecast from
  Open-Meteo, with an estimated irrigation need per month.

Mobile-friendly: below 992px the three columns stack (weather → prices → news).

## Stack (MERN, Vercel-ready)

- **M** — MongoDB (optional Atlas cache of articles, see `.env.example`)
- **E** — Express (`server/index.js`, local dev only)
- **R** — React 18 + Vite (`src/`)
- **N** — Node serverless functions on Vercel (`api/news.js`, `api/weather.js`, `api/prices.js`, `api/climate.js`, `api/rainforecast.js`)

Also: Bootstrap 5, Chart.js (`react-chartjs-2`), `rss-parser`, Mongoose.

The `api/` handlers are shared between Express (local) and Vercel (prod), so
dev and prod behave identically.

## Run locally

```bash
npm install
npm run dev:api   # Express API on http://localhost:5001
npm run dev       # Vite dev server on http://localhost:5173 (proxies /api)
```

Environment variables (see `.env.example`, all optional):

- `MONGODB_URI` — MongoDB Atlas connection string for persisting articles; falls back to an in-memory cache
- `PORT` — Express port for local dev (default `5001`)

## Project structure

```
api/          Request handlers (Vercel functions, also mounted by Express)
lib/          Data fetching + caching: news (RSS), weather, prices, climate, db
server/       Express dev server (local only)
src/          React app: App.jsx, components/ (News, Weather, Prices, CropCalendar)
src/data/     Region crop calendars and ideal growing conditions
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
