// Live coffee futures via Barchart's site API (free, no key — needs a
// cookie/XSRF handshake first). Covers both benchmarks: Arabica "Coffee C"
// (ICE US, US¢/lb) and Robusta 10-T (ICE Europe, US$/tonne), each with
// 180 days of end-of-day history for the chart. USD/BRL comes from Yahoo
// Finance's public chart API.

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const BARCHART_PAGE = 'https://www.barchart.com/futures/quotes/KC*0';
const BARCHART_API = 'https://www.barchart.com/proxies/core-api/v1';

const FUTURES = [
  { key: 'arabica', symbol: 'KC*0', name: 'Arabica · Coffee C', exchange: 'ICE US', unit: 'US¢ / lb' },
  { key: 'robusta', symbol: 'RM*0', name: 'Robusta 10-T', exchange: 'ICE Europe', unit: 'US$ / tonne' },
];

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { at: 0, data: null };

async function barchartSession() {
  const res = await fetch(BARCHART_PAGE, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
  });
  const setCookies = res.headers.getSetCookie?.() || [];
  const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
  const xsrfCookie = setCookies.find((c) => c.startsWith('XSRF-TOKEN='));
  if (!xsrfCookie) throw new Error('Barchart session handshake failed');
  const xsrf = decodeURIComponent(xsrfCookie.split(';')[0].slice('XSRF-TOKEN='.length));
  return { cookies, xsrf };
}

async function barchartGet(session, path) {
  const res = await fetch(`${BARCHART_API}${path}`, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Cookie: session.cookies,
      'x-xsrf-token': session.xsrf,
      Referer: BARCHART_PAGE,
    },
  });
  if (!res.ok) throw new Error(`Barchart API ${res.status}`);
  return res.json();
}

async function fetchFutures() {
  const session = await barchartSession();
  const symbols = FUTURES.map((f) => f.symbol).join(',');

  const [quotes, ...histories] = await Promise.all([
    barchartGet(
      session,
      `/quotes/get?symbols=${encodeURIComponent(symbols)}&fields=symbol,symbolName,lastPrice,previousPrice,tradeTime&raw=1`
    ),
    ...FUTURES.map((f) =>
      barchartGet(
        session,
        `/historical/get?symbol=${encodeURIComponent(f.symbol)}&fields=tradeTime.format(Y-m-d),lastPrice&type=eod&limit=180&order=asc&raw=1`
      )
    ),
  ]);

  return FUTURES.map((f, i) => {
    // continuous-contract symbols (KC*0) resolve to the front month (KCU26)
    const quote = quotes.data.find((q) => q.raw?.symbol?.startsWith(f.symbol.slice(0, 2)));
    const history = (histories[i].data || []).map((d) => ({
      t: d.raw.tradeTime,
      c: +d.raw.lastPrice,
    }));
    const price = quote?.raw?.lastPrice ?? history[history.length - 1]?.c;
    const prevClose = quote?.raw?.previousPrice ?? history[history.length - 2]?.c ?? price;
    if (price == null) throw new Error(`No price for ${f.symbol}`);
    return {
      ...f,
      contract: quote?.symbolName || f.name,
      price: +(+price).toFixed(2),
      prevClose: +(+prevClose).toFixed(2),
      change: +(price - prevClose).toFixed(2),
      changePct: prevClose ? +(((price - prevClose) / prevClose) * 100).toFixed(2) : 0,
      history,
    };
  });
}

async function fetchUsdBrl() {
  const res = await fetch(
    'https://query1.finance.yahoo.com/v8/finance/chart/BRL%3DX?range=6mo&interval=1d',
    { headers: { 'User-Agent': UA, Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Yahoo BRL=X → ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data for BRL=X');
  const closes = result.indicators?.quote?.[0]?.close || [];
  const history = (result.timestamp || [])
    .map((t, i) => ({ t: new Date(t * 1000).toISOString().slice(0, 10), c: closes[i] }))
    .filter((p) => p.c != null)
    .map((p) => ({ t: p.t, c: +p.c.toFixed(4) }));
  const price = result.meta?.regularMarketPrice ?? history[history.length - 1]?.c;
  const prevClose = history[history.length - 2]?.c ?? price;
  return {
    key: 'usdbrl',
    symbol: 'BRL=X',
    name: 'USD / BRL',
    exchange: 'FX',
    unit: 'Brazilian real',
    price: +price.toFixed(4),
    prevClose: +prevClose.toFixed(4),
    change: +(price - prevClose).toFixed(4),
    changePct: prevClose ? +(((price - prevClose) / prevClose) * 100).toFixed(2) : 0,
    history,
  };
}

// ECB reference rates via Frankfurter (free, no key) so the client can
// display prices in other currencies
async function fetchFxRates() {
  const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,EUR,BRL,GBP', {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`Frankfurter → ${res.status}`);
  const json = await res.json();
  return { USD: 1, ...json.rates };
}

export async function getPrices() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const [futures, fx, rates] = await Promise.allSettled([
    fetchFutures(),
    fetchUsdBrl(),
    fetchFxRates(),
  ]);
  const contracts = [
    ...(futures.status === 'fulfilled' ? futures.value : []),
    ...(fx.status === 'fulfilled' ? [fx.value] : []),
  ];

  if (!contracts.length) {
    if (cache.data) return cache.data;
    throw new Error(
      `Price sources unreachable (${futures.reason?.message || fx.reason?.message})`
    );
  }

  const data = {
    updatedAt: new Date().toISOString(),
    contracts,
    fxRates: rates.status === 'fulfilled' ? rates.value : null,
  };
  cache = { at: Date.now(), data };
  return data;
}
