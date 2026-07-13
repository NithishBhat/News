// Monthly climate normals (rainfall + temperature) for a coordinate, computed
// from 5 years of Open-Meteo's historical archive (free, no key). Cached
// in-memory per coordinate — regions are a small fixed set.

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const cache = new Map();

// live 16-day precipitation forecast; short cache since it changes daily
const rainCache = new Map();
const RAIN_TTL_MS = 30 * 60 * 1000;

export async function getRainForecast(lat, lon) {
  const la = +lat;
  const lo = +lon;
  if (isNaN(la) || isNaN(lo)) throw new Error('lat/lon required');
  const key = `${la.toFixed(2)},${lo.toFixed(2)}`;
  const hit = rainCache.get(key);
  if (hit && Date.now() - hit.at < RAIN_TTL_MS) return hit.data;

  const params = new URLSearchParams({
    latitude: la,
    longitude: lo,
    daily: 'precipitation_sum,precipitation_probability_max',
    forecast_days: '16',
    timezone: 'auto',
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Rain forecast failed (${res.status})`);
  const data = await res.json();

  const days = (data.daily?.time || []).map((date, i) => ({
    date,
    mm: +(data.daily.precipitation_sum[i] ?? 0).toFixed(1),
    prob: data.daily.precipitation_probability_max?.[i] ?? null,
  }));
  const result = {
    lat: la,
    lon: lo,
    days,
    totalMm: +days.reduce((s, d) => s + d.mm, 0).toFixed(1),
  };
  rainCache.set(key, { at: Date.now(), data: result });
  return result;
}

export async function getClimate(lat, lon) {
  const la = +lat;
  const lo = +lon;
  if (isNaN(la) || isNaN(lo)) throw new Error('lat/lon required');
  const key = `${la.toFixed(2)},${lo.toFixed(2)}`;
  if (cache.has(key)) return cache.get(key);

  const params = new URLSearchParams({
    latitude: la,
    longitude: lo,
    start_date: '2021-01-01',
    end_date: '2025-12-31',
    daily: 'precipitation_sum,temperature_2m_mean',
    timezone: 'auto',
  });
  const res = await fetch(`${ARCHIVE_URL}?${params}`);
  if (!res.ok) throw new Error(`Climate archive failed (${res.status})`);
  const data = await res.json();

  const rain = Array(12).fill(0);
  const tempSum = Array(12).fill(0);
  const tempCount = Array(12).fill(0);
  const yearsSeen = Array(12).fill(0).map(() => new Set());

  const days = data.daily?.time || [];
  for (let i = 0; i < days.length; i++) {
    const m = +days[i].slice(5, 7) - 1;
    yearsSeen[m].add(days[i].slice(0, 4));
    const p = data.daily.precipitation_sum[i];
    if (p != null) rain[m] += p;
    const t = data.daily.temperature_2m_mean[i];
    if (t != null) {
      tempSum[m] += t;
      tempCount[m]++;
    }
  }

  const result = {
    lat: la,
    lon: lo,
    elevation: data.elevation != null ? Math.round(data.elevation) : null,
    monthlyRain: rain.map((sum, m) => +(sum / Math.max(yearsSeen[m].size, 1)).toFixed(0)),
    monthlyTemp: tempSum.map((sum, m) =>
      tempCount[m] ? +(sum / tempCount[m]).toFixed(1) : null
    ),
    years: '2021–2025',
  };
  cache.set(key, result);
  return result;
}
