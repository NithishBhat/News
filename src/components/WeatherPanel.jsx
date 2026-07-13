import { useEffect, useState } from 'react';

const WMO = {
  0: ['Clear', '☀️', '🌙'],
  1: ['Mostly Clear', '🌤️', '🌙'],
  2: ['Partly Cloudy', '⛅', '☁️'],
  3: ['Overcast', '☁️', '☁️'],
  45: ['Fog', '🌫️', '🌫️'],
  48: ['Rime Fog', '🌫️', '🌫️'],
  51: ['Light Drizzle', '🌦️', '🌧️'],
  53: ['Drizzle', '🌦️', '🌧️'],
  55: ['Heavy Drizzle', '🌧️', '🌧️'],
  56: ['Freezing Drizzle', '🌧️', '🌧️'],
  57: ['Freezing Drizzle', '🌧️', '🌧️'],
  61: ['Light Rain', '🌧️', '🌧️'],
  63: ['Rain', '🌧️', '🌧️'],
  65: ['Heavy Rain', '🌧️', '🌧️'],
  66: ['Freezing Rain', '🌧️', '🌧️'],
  67: ['Freezing Rain', '🌧️', '🌧️'],
  71: ['Light Snow', '🌨️', '🌨️'],
  73: ['Snow', '🌨️', '🌨️'],
  75: ['Heavy Snow', '❄️', '❄️'],
  77: ['Snow Grains', '❄️', '❄️'],
  80: ['Light Showers', '🌦️', '🌧️'],
  81: ['Showers', '🌧️', '🌧️'],
  82: ['Violent Showers', '⛈️', '⛈️'],
  85: ['Snow Showers', '🌨️', '🌨️'],
  86: ['Snow Showers', '🌨️', '🌨️'],
  95: ['Thunderstorm', '⛈️', '⛈️'],
  96: ['Thunderstorm', '⛈️', '⛈️'],
  99: ['Thunderstorm', '⛈️', '⛈️'],
};

function wmoDesc(code) {
  return (WMO[code] || ['—'])[0];
}

function wmoIcon(code, isDay = true) {
  const entry = WMO[code] || ['—', '🌡️', '🌡️'];
  return isDay ? entry[1] : entry[2];
}

// Apple-Weather-style condition gradients
function heroGradient(code, isDay) {
  if (!isDay) return 'linear-gradient(180deg, #0f2027 0%, #203a43 55%, #2c5364 100%)';
  if (code === 0 || code === 1) return 'linear-gradient(180deg, #2364aa 0%, #3f8fd2 55%, #72b4e0 100%)';
  if (code === 2) return 'linear-gradient(180deg, #3a7bb8 0%, #6aa3cc 60%, #93bcd6 100%)';
  if (code === 3 || code === 45 || code === 48) return 'linear-gradient(180deg, #54606e 0%, #77848f 60%, #97a1aa 100%)';
  if (code >= 95) return 'linear-gradient(180deg, #23272e 0%, #3d4552 60%, #545e6b 100%)';
  if (code >= 71 && code <= 86 && code !== 80 && code !== 81 && code !== 82)
    return 'linear-gradient(180deg, #7a8b99 0%, #9aa8b3 60%, #bcc6cd 100%)';
  return 'linear-gradient(180deg, #37475a 0%, #52667c 60%, #6d8196 100%)'; // rain
}

function dayName(dateStr, i) {
  if (i === 0) return 'Today';
  return new Date(dateStr + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' });
}

function hourLabel(iso, i) {
  if (i === 0) return 'Now';
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric' }).replace(' ', '');
}

// Agronomy heuristics for arabica: ideal 18–21 °C, ~30–50 mm rain/week,
// frost below ~2 °C is lethal, sustained high humidity favors leaf rust.
function growerOutlook({ current, daily }) {
  const alerts = [];
  const minTemp = Math.min(...daily.map((d) => d.tempMin));
  const rain6 = daily.reduce((s, d) => s + (d.rainMm || 0), 0);

  if (minTemp <= 2) {
    alerts.push({ label: 'Frost watch', level: 'danger', text: `Lows near ${Math.round(minTemp)}°C this week — protect nursery stock and young plants.` });
  }
  if (rain6 < 15) {
    alerts.push({ label: 'Irrigation advisory', level: 'warning', text: `${rain6.toFixed(1)} mm forecast over 6 days, below crop requirement. Schedule irrigation.` });
  } else if (rain6 > 90) {
    alerts.push({ label: 'Drainage advisory', level: 'warning', text: `${rain6.toFixed(0)} mm forecast over 6 days. Inspect drainage channels and erosion controls.` });
  } else {
    alerts.push({ label: 'Rainfall', level: 'success', text: `${rain6.toFixed(0)} mm forecast over 6 days — within target range.` });
  }
  if (current.humidity >= 85) {
    alerts.push({ label: 'Leaf rust risk', level: 'warning', text: `Relative humidity ${current.humidity}% favors H. vastatrix — scout susceptible lots.` });
  }
  const avgToday = (daily[0].tempMax + daily[0].tempMin) / 2;
  if (avgToday > 26) {
    alerts.push({ label: 'Heat stress', level: 'warning', text: `Daily mean ${avgToday.toFixed(0)}°C exceeds arabica optimum — shade management recommended.` });
  } else if (avgToday >= 18 && avgToday <= 22) {
    alerts.push({ label: 'Temperature', level: 'success', text: `Daily mean ${avgToday.toFixed(0)}°C — within arabica's optimal 18–21°C band.` });
  }
  return alerts;
}

export default function WeatherPanel() {
  const [city, setCity] = useState('Boston');
  const [input, setInput] = useState('');
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetch(`/api/weather?city=${encodeURIComponent(city)}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  function onSubmit(e) {
    e.preventDefault();
    if (input.trim()) {
      setCity(input.trim());
      setInput('');
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="wx-hero wx-hero-loading placeholder-wave" aria-busy="true">
        <span className="placeholder col-7 d-block mb-3"></span>
        <span className="placeholder col-4 d-block mb-2"></span>
        <span className="placeholder col-9 d-block"></span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="card">
        <div className="card-body">
          <div className="fw-semibold mb-2">Weather unavailable</div>
          <div className="text-body-secondary small mb-3">{state.error}</div>
          <form className="input-group input-group-sm" onSubmit={onSubmit}>
            <input className="form-control" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try another city…" aria-label="City" />
            <button className="btn btn-outline-secondary" type="submit">Go</button>
          </form>
        </div>
      </div>
    );
  }

  const { location, current, next12h, daily, units } = state.data;
  const weekMin = Math.min(...daily.map((d) => d.tempMin));
  const weekMax = Math.max(...daily.map((d) => d.tempMax));
  const span = weekMax - weekMin || 1;
  const alerts = growerOutlook(state.data);
  const today = daily[0];

  return (
    <div className="vstack gap-4">
      <div className="wx-hero" style={{ background: heroGradient(current.weatherCode, current.isDay) }}>
        <form className="wx-search" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search city"
            aria-label="City"
          />
        </form>

        <div className="wx-top">
          <div className="wx-city">{location.name}</div>
          <div className="wx-temp">{Math.round(current.temp)}°</div>
          <div className="wx-cond">{wmoDesc(current.weatherCode)}</div>
          <div className="wx-hilo">
            H:{Math.round(today.tempMax)}° L:{Math.round(today.tempMin)}°
          </div>
        </div>

        <div className="wx-section">
          <div className="wx-section-label">
            {today.rainChance >= 40
              ? `Rain expected today — ${today.rainChance}% chance, ${today.rainMm?.toFixed(1)} ${units.rain}.`
              : `${wmoDesc(current.weatherCode)} conditions for the next 12 hours.`}
          </div>
          <div className="wx-hourly">
            {next12h.map((h, i) => (
              <div className="wx-hour" key={h.time} title={`${h.rainChance ?? 0}% rain · ${h.rainMm ?? 0} mm`}>
                <span className="wx-hour-label">{hourLabel(h.time, i)}</span>
                <span className="wx-hour-icon">{wmoIcon(h.weatherCode, h.isDay)}</span>
                <span className={`wx-hour-rain ${h.rainChance >= 20 ? '' : 'invisible'}`}>
                  {h.rainChance}%
                </span>
                <span className="wx-hour-temp">{Math.round(h.temp)}°</span>
              </div>
            ))}
          </div>
        </div>

        <div className="wx-section">
          <div className="wx-section-label">6-day forecast</div>
          <div className="wx-daily">
            {daily.map((d, i) => (
              <div className="wx-day" key={d.date} title={`Rain ${d.rainChance ?? 0}% · ${d.rainMm?.toFixed(1) ?? 0} mm`}>
                <span className="wx-day-name">{dayName(d.date, i)}</span>
                <span className="wx-day-icon">
                  {wmoIcon(d.weatherCode)}
                  {d.rainChance >= 40 && <em className="wx-day-rain">{d.rainChance}%</em>}
                </span>
                <span className="wx-day-lo">{Math.round(d.tempMin)}°</span>
                <span className="wx-range">
                  <span
                    className="wx-range-fill"
                    style={{
                      left: `${((d.tempMin - weekMin) / span) * 100}%`,
                      width: `${Math.max(((d.tempMax - d.tempMin) / span) * 100, 6)}%`,
                    }}
                  />
                </span>
                <span className="wx-day-hi">{Math.round(d.tempMax)}°</span>
              </div>
            ))}
          </div>
        </div>

        <div className="wx-tiles">
          <div className="wx-tile">
            <span className="wx-tile-label">Feels like</span>
            <span className="wx-tile-value">{Math.round(current.feelsLike)}°</span>
          </div>
          <div className="wx-tile">
            <span className="wx-tile-label">Humidity</span>
            <span className="wx-tile-value">{current.humidity}%</span>
          </div>
          <div className="wx-tile">
            <span className="wx-tile-label">Wind</span>
            <span className="wx-tile-value">
              {Math.round(current.windKmh)}
              <small> {units.wind}</small>
            </span>
          </div>
          <div className="wx-tile">
            <span className="wx-tile-label">Rain today</span>
            <span className="wx-tile-value">
              {today.rainMm?.toFixed(1) ?? 0}
              <small> {units.rain}</small>
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header fw-semibold">Field advisories</div>
        <ul className="list-group list-group-flush">
          {alerts.map((a, i) => (
            <li className={`list-group-item small outlook-${a.level}`} key={i}>
              <span className="fw-semibold">{a.label}: </span>
              {a.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
