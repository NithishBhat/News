// Weather + rainfall prediction via Open-Meteo (free, no API key).
// https://open-meteo.com/en/docs

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

async function geocode(city) {
  const res = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) throw new Error(`City not found: ${city}`);
  return {
    lat: hit.latitude,
    lon: hit.longitude,
    name: hit.name,
    country: hit.country,
    admin1: hit.admin1,
  };
}

export async function getWeather({ city, lat, lon }) {
  let location;
  if (lat != null && lon != null && !isNaN(+lat) && !isNaN(+lon)) {
    location = { lat: +lat, lon: +lon, name: 'Your location', country: '' };
  } else {
    location = await geocode(city || 'Boston');
  }

  const params = new URLSearchParams({
    latitude: location.lat,
    longitude: location.lon,
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day',
    hourly: 'precipitation_probability,precipitation,temperature_2m,weather_code,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '6',
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`);
  const data = await res.json();

  // Next 12 hours of rain prediction starting from the current hour
  const nowIso = data.current.time.slice(0, 13); // "YYYY-MM-DDTHH"
  let startIdx = data.hourly.time.findIndex((t) => t.startsWith(nowIso));
  if (startIdx === -1) startIdx = 0;
  const next12h = data.hourly.time
    .slice(startIdx, startIdx + 12)
    .map((time, i) => ({
      time,
      rainChance: data.hourly.precipitation_probability[startIdx + i],
      rainMm: data.hourly.precipitation[startIdx + i],
      temp: data.hourly.temperature_2m[startIdx + i],
      weatherCode: data.hourly.weather_code[startIdx + i],
      isDay: data.hourly.is_day[startIdx + i] === 1,
    }));

  const daily = data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    rainChance: data.daily.precipitation_probability_max[i],
    rainMm: data.daily.precipitation_sum[i],
  }));

  return {
    location,
    timezone: data.timezone,
    current: {
      time: data.current.time,
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      windKmh: data.current.wind_speed_10m,
      isDay: data.current.is_day === 1,
    },
    next12h,
    daily,
    units: { temp: '°C', rain: 'mm', wind: 'km/h' },
  };
}
