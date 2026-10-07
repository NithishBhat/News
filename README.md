# Coffee News

Coffee News is a one-page daily dashboard for coffee growers. It puts what a grower checks every morning in one place: coffee and market news, the local weather forecast with warnings for frost, drought, heavy rain and leaf rust, live arabica and robusta coffee prices, and a crop calendar showing when to plant, prune and harvest in different growing regions.

Everything comes from free public sources (news RSS feeds, Open-Meteo for weather, Barchart and Yahoo Finance for prices), so no API keys are needed. It's built with React and a small Node backend, and it's set up to deploy on Vercel.

## What's on the page

**News (center).** Headlines from coffee trade press (Daily Coffee News, Global Coffee Report, Sprudge, World Coffee Portal and others), business desks (BBC, Guardian, NPR), climate coverage (Guardian, BBC) and world news (BBC World, Al Jazeera, with sports filtered out). Tabs for Coffee, All, Markets, Climate and World, newest first, 12 at a time with "Load more".

**Weather (left).** Current conditions, 12-hour rain probability, a 6-day forecast, and a "grower outlook" that flags frost, drought, heavy rain and leaf-rust risk from the forecast. Defaults to Boston; the search box changes the city.

**Prices (right).** Live quotes and a chart of Arabica Coffee C (ICE US) and Robusta 10-T (ICE Europe) on two axes, with 1M/3M/6M ranges over 180 days of daily history, plus USD/BRL. Prices can be shown in USD, INR, EUR, BRL or GBP using ECB rates from Frankfurter. There are also links to grower resources like ICO, World Coffee Research and SCA.

**Crop calendar.** Planting, flowering, harvest and pruning windows for arabica and robusta across 16 regions (India, Colombia, Brazil, Ethiopia, Vietnam, East Africa, Guatemala, Sumatra), compared with 5-year monthly climate normals and a 16-day rain forecast, with an estimated irrigation need per month.

Dark mode is the default, with a light/dark toggle. Below 992px wide the columns stack (weather, prices, news).

## Stack

React 18 + Vite and Bootstrap 5 on the frontend, Chart.js for the price chart. The request handlers in `api/` run as Vercel serverless functions in production and are mounted by a small Express server (`server/index.js`) for local dev, so both behave the same. `rss-parser` reads the feeds. MongoDB (through Mongoose) is an optional article cache; without it the app uses an in-memory cache.

News and prices are cached server-side for 10 minutes, with CDN cache headers on top, so the upstream sources aren't hit on every request. Barchart's public site API doesn't need a key, just a cookie/XSRF handshake.

## Running it

```bash
npm install
npm run dev:api   # Express API on http://localhost:5001
npm run dev       # Vite on http://localhost:5173, proxies /api
```

Optional environment variables (see `.env.example`):

- `MONGODB_URI`: MongoDB Atlas connection string for caching articles
- `PORT`: Express port for local dev, default `5001`

## Deploying

Import the repo into Vercel. It detects Vite and turns `api/` into serverless functions. Add `MONGODB_URI` under Environment Variables if you want the Mongo cache. `npx vercel` from the CLI also works.

## Layout

```
api/        request handlers (Vercel functions, also used by Express)
lib/        data fetching and caching: news, weather, prices, climate, db
server/     Express dev server
src/        React app and components (News, Weather, Prices, CropCalendar)
src/data/   region crop calendars and growing conditions
```
