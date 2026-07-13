import { useEffect, useMemo, useState } from 'react';
import { LANES, REGIONS, IDEALS, getWindows, nearestRegion, waterNeed } from '../data/regions.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NOW_MONTH = new Date().getMonth();

function irrigationLevel(deficit) {
  if (deficit <= 0) return { level: 0, label: 'Rain-fed', drops: '—' };
  if (deficit <= 40) return { level: 1, label: 'Light', drops: '💧' };
  if (deficit <= 80) return { level: 2, label: 'Moderate', drops: '💧💧' };
  return { level: 3, label: 'Heavy', drops: '💧💧💧' };
}

function segClass(months, m) {
  if (!months.includes(m)) return '';
  const prev = months.includes((m + 11) % 12);
  const next = months.includes((m + 1) % 12);
  return `seg${!prev || m === 0 ? ' seg-start' : ''}${!next || m === 11 ? ' seg-end' : ''}`;
}

// range bar: shaded ideal band on a fixed scale + caret marker for the
// region's actual value, green when inside the band
function IdealBar({ spec, value }) {
  const [s0, s1] = spec.scale;
  const [i0, i1] = spec.ideal;
  const pct = (v) => Math.min(Math.max(((v - s0) / (s1 - s0)) * 100, 0), 100);
  const inBand = value != null && value >= i0 && value <= i1;
  return (
    <div className="ideal-row">
      <div className="ideal-head">
        <span>{spec.label}</span>
        {value != null && (
          <span className={inBand ? 'ideal-ok' : 'ideal-off'}>
            {value.toLocaleString()}
            {spec.unit} {inBand ? '✓' : '⚠'}
          </span>
        )}
      </div>
      <div className="ideal-track">
        <div
          className="ideal-band"
          style={{ left: `${pct(i0)}%`, width: `${pct(i1) - pct(i0)}%` }}
        />
        {value != null && (
          <div
            className={`ideal-marker ${inBand ? 'ok' : 'off'}`}
            style={{ left: `${pct(value)}%` }}
          />
        )}
      </div>
      <div className="ideal-scale">
        <span>
          {s0.toLocaleString()}
          {spec.unit}
        </span>
        <span className="ideal-range">
          ideal {i0.toLocaleString()}–{i1.toLocaleString()}
          {spec.unit}
        </span>
        <span>
          {s1.toLocaleString()}
          {spec.unit}
        </span>
      </div>
    </div>
  );
}

export default function CropCalendar() {
  const [variety, setVariety] = useState('arabica');
  const [placeId, setPlaceId] = useState('india-chikmagalur');
  const [geo, setGeo] = useState({ status: 'pending' });
  const [focus, setFocus] = useState(NOW_MONTH);
  const [climate, setClimate] = useState({ status: 'loading' });
  const [rainFx, setRainFx] = useState({ status: 'loading' });
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [customPlace, setCustomPlace] = useState(null);

  // free-text place search (Open-Meteo geocoding, ~any village/estate town)
  async function runSearch(e) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    setSearchResults({ status: 'loading' });
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
      );
      const data = await res.json();
      setSearchResults({ status: 'ready', hits: data.results || [] });
    } catch {
      setSearchResults({ status: 'error' });
    }
  }

  function pickSearchResult(hit) {
    setCustomPlace({
      name: hit.name,
      detail: [hit.admin2, hit.admin1, hit.country].filter(Boolean).join(', '),
      lat: hit.latitude,
      lon: hit.longitude,
    });
    setPlaceId('custom');
    setSearchResults(null);
    setSearch('');
  }

  // detect current location once; becomes the default place when granted
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo({ status: 'unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ status: 'ready', lat: pos.coords.latitude, lon: pos.coords.longitude });
        setPlaceId('mylocation');
      },
      () => setGeo({ status: 'denied' }),
      { timeout: 6000, maximumAge: 3600000 }
    );
  }, []);

  // resolve the active place: searched places and user location borrow
  // windows from the nearest listed origin that grows the selected variety,
  // while climate is fetched for their exact coordinates
  const place = useMemo(() => {
    const adapted = (name, lat, lon) => {
      const { region, km } = nearestRegion(lat, lon, variety);
      return {
        name,
        lat,
        lon,
        windows: getWindows(region, variety).windows,
        shared: false,
        highlight: `Windows adapted from ${region.name} — the nearest ${variety} reference origin (~${km.toLocaleString()} km away). Rainfall, temperature and altitude are for ${name}'s exact coordinates.`,
      };
    };
    if (placeId === 'custom' && customPlace) {
      return { id: 'custom', ...adapted(customPlace.name, customPlace.lat, customPlace.lon) };
    }
    if (placeId === 'mylocation' && geo.status === 'ready') {
      return { id: 'mylocation', ...adapted('My location', geo.lat, geo.lon) };
    }
    const region = REGIONS.find((r) => r.id === placeId) || REGIONS[0];
    const { windows, shared } = getWindows(region, variety);
    return {
      id: region.id,
      name: region.name,
      lat: region.lat,
      lon: region.lon,
      windows,
      shared,
      highlight: region.highlight,
    };
  }, [placeId, variety, geo, customPlace]);

  useEffect(() => {
    let cancelled = false;
    setClimate({ status: 'loading' });
    fetch(`/api/climate?lat=${place.lat.toFixed(3)}&lon=${place.lon.toFixed(3)}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) setClimate({ status: 'ready', data });
      })
      .catch((err) => {
        if (!cancelled) setClimate({ status: 'error', error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [place.lat, place.lon]);

  // live 16-day rain forecast for the exact coordinates
  useEffect(() => {
    let cancelled = false;
    setRainFx({ status: 'loading' });
    fetch(`/api/rainforecast?lat=${place.lat.toFixed(3)}&lon=${place.lon.toFixed(3)}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) setRainFx({ status: 'ready', data });
      })
      .catch(() => {
        if (!cancelled) setRainFx({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [place.lat, place.lon]);

  const windows = place.windows;
  const rain = climate.data?.monthlyRain || Array(12).fill(null);
  const temp = climate.data?.monthlyTemp || Array(12).fill(null);
  const maxRain = Math.max(...rain.map((r) => r || 0), 1);

  const irrigation = useMemo(
    () =>
      MONTHS.map((_, m) => {
        if (rain[m] == null) return null;
        return irrigationLevel(waterNeed(windows, m) - rain[m]);
      }),
    [rain, windows]
  );

  const placeGroups = useMemo(() => {
    const groups = [];
    for (const r of REGIONS) {
      let g = groups.find((x) => x.label === r.group);
      if (!g) {
        g = { label: r.group, regions: [] };
        groups.push(g);
      }
      g.regions.push(r);
    }
    return groups;
  }, []);

  const focusActivities = LANES.filter((l) => windows[l.key].includes(focus));
  const focusDeficit = rain[focus] != null ? waterNeed(windows, focus) - rain[focus] : null;

  // region actuals vs variety ideals
  const ideals = IDEALS[variety];
  const annualRain = rain.every((r) => r == null)
    ? null
    : rain.reduce((s, r) => s + (r || 0), 0);
  const validTemps = temp.filter((t) => t != null);
  const avgTemp = validTemps.length
    ? +(validTemps.reduce((s, t) => s + t, 0) / validTemps.length).toFixed(1)
    : null;
  const elevation = climate.data?.elevation ?? null;

  return (
    <div className="crop-page">
      <div className="planner-head card mb-4">
        <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h2 className="section-title mb-0">Crop planner</h2>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="segmented" role="group" aria-label="Variety">
              <button
                type="button"
                className={`btn ${variety === 'arabica' ? 'active' : ''}`}
                onClick={() => setVariety('arabica')}
              >
                Arabica
              </button>
              <button
                type="button"
                className={`btn ${variety === 'robusta' ? 'active' : ''}`}
                onClick={() => setVariety('robusta')}
              >
                Robusta
              </button>
            </div>
            <select
              className="form-select region-select"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              aria-label="Growing region"
            >
              {customPlace && (
                <option value="custom">🔎 {customPlace.name}</option>
              )}
              {geo.status === 'ready' && (
                <option value="mylocation">📍 My location</option>
              )}
              {placeGroups.map((g) => (
                <optgroup label={g.label} key={g.label}>
                  {g.regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="place-search">
              <form className="input-group input-group-sm" onSubmit={runSearch}>
                <input
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search any village / estate…"
                  aria-label="Search place"
                />
                <button className="btn btn-outline-secondary" type="submit">
                  🔎
                </button>
              </form>
              {searchResults && (
                <div className="place-results card">
                  {searchResults.status === 'loading' && (
                    <div className="place-result text-body-secondary">Searching…</div>
                  )}
                  {searchResults.status === 'error' && (
                    <div className="place-result text-body-secondary">Search failed — try again.</div>
                  )}
                  {searchResults.status === 'ready' && !searchResults.hits.length && (
                    <div className="place-result text-body-secondary">No places found.</div>
                  )}
                  {searchResults.status === 'ready' &&
                    searchResults.hits.map((hit) => (
                      <button
                        type="button"
                        className="place-result"
                        key={hit.id || `${hit.latitude},${hit.longitude}`}
                        onClick={() => pickSearchResult(hit)}
                      >
                        <strong>{hit.name}</strong>
                        <small>
                          {[hit.admin2, hit.admin1, hit.country].filter(Boolean).join(', ')}
                        </small>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {geo.status === 'denied' && (
          <div className="card-footer text-body-secondary planner-geo-note">
            Location access denied — showing reference origins. Allow location to plan for your own farm.
          </div>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-3 mb-3 cal-legend">
            {LANES.map((l) => (
              <span className="legend-chip" key={l.key}>
                <span className="legend-swatch" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
            <span className="legend-chip">
              <span className="legend-swatch legend-rain" />
              Rainfall
            </span>
          </div>

          <div className="cal-grid" onMouseLeave={() => setFocus(NOW_MONTH)}>
            <div className="cal-label" />
            {MONTHS.map((mo, m) => (
              <div
                key={mo}
                className={`cal-month ${m === focus ? 'is-focus' : ''} ${m === NOW_MONTH ? 'is-now' : ''}`}
                onMouseEnter={() => setFocus(m)}
                onClick={() => setFocus(m)}
                title={m === NOW_MONTH ? 'Current month' : ''}
              >
                {mo}
              </div>
            ))}

            {LANES.map((lane) => (
              <div key={lane.key} style={{ display: 'contents' }}>
                <div className="cal-label">
                  <span className="cal-label-icon">{lane.icon}</span> {lane.label}
                </div>
                {MONTHS.map((_, m) => (
                  <div
                    key={m}
                    className={`cal-cell ${m === focus ? 'is-focus' : ''}`}
                    onMouseEnter={() => setFocus(m)}
                    onClick={() => setFocus(m)}
                  >
                    <div
                      className={segClass(windows[lane.key], m)}
                      style={windows[lane.key].includes(m) ? { background: lane.color } : undefined}
                    />
                  </div>
                ))}
              </div>
            ))}

            <div className="cal-label">
              <span className="cal-label-icon">🌧️</span> Rainfall
            </div>
            {MONTHS.map((_, m) => (
              <div
                key={m}
                className={`cal-cell cal-rain-cell ${m === focus ? 'is-focus' : ''}`}
                onMouseEnter={() => setFocus(m)}
                onClick={() => setFocus(m)}
                title={rain[m] != null ? `${rain[m]} mm` : ''}
              >
                {rain[m] != null && (
                  <div className="rain-col" style={{ height: `${Math.max((rain[m] / maxRain) * 100, 3)}%` }} />
                )}
              </div>
            ))}

            <div className="cal-label">
              <span className="cal-label-icon">🚿</span> Irrigation
            </div>
            {MONTHS.map((_, m) => (
              <div
                key={m}
                className={`cal-cell cal-irr-cell ${m === focus ? 'is-focus' : ''}`}
                onMouseEnter={() => setFocus(m)}
                onClick={() => setFocus(m)}
                title={
                  rain[m] != null
                    ? `${MONTHS[m]}: ${rain[m]} mm rain (normal) vs ${waterNeed(windows, m)} mm need`
                    : ''
                }
              >
                <span>{irrigation[m]?.drops ?? ''}</span>
              </div>
            ))}
          </div>

          {climate.status === 'error' && (
            <div className="text-body-secondary small mt-2">
              Rainfall data unavailable — {climate.error}
            </div>
          )}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header fw-semibold">
              {MONTHS[focus]} · {place.name} · {variety === 'arabica' ? 'Arabica' : 'Robusta'}
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2 mb-3">
                {focusActivities.length ? (
                  focusActivities.map((l) => (
                    <span className="focus-chip" style={{ borderLeftColor: l.color }} key={l.key}>
                      <span>{l.icon}</span>
                      <span>
                        <strong>{l.label}</strong>
                        <small>{l.note}</small>
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="focus-chip">
                    <span>🌿</span>
                    <span>
                      <strong>Maintenance</strong>
                      <small>Weeding, shade management, pest scouting</small>
                    </span>
                  </span>
                )}
              </div>
              <div className="focus-stats">
                <div className="focus-stat">
                  <span className="focus-stat-label">Rainfall</span>
                  <span className="focus-stat-value">
                    {rain[focus] != null ? `${rain[focus]} mm` : '…'}
                  </span>
                </div>
                <div className="focus-stat">
                  <span className="focus-stat-label">Avg temp</span>
                  <span className="focus-stat-value">
                    {temp[focus] != null ? `${temp[focus]}°C` : '…'}
                  </span>
                </div>
                <div className="focus-stat">
                  <span className="focus-stat-label">Crop needs</span>
                  <span className="focus-stat-value">{waterNeed(windows, focus)} mm</span>
                </div>
                <div className="focus-stat">
                  <span className="focus-stat-label">Water balance</span>
                  <span className="focus-stat-value">
                    {focusDeficit == null ? (
                      '…'
                    ) : (
                      <span className={focusDeficit <= 0 ? 'delta-up' : 'delta-down'}>
                        {focusDeficit <= 0 ? '+' : '−'}
                        {Math.abs(Math.round(focusDeficit))} mm
                      </span>
                    )}
                    {focusDeficit != null && (
                      <small className="d-block text-body-secondary">
                        {focusDeficit <= 0
                          ? 'normals cover the need — check live outlook'
                          : `plan ≈${Math.round(focusDeficit / 10) * 10} mm irrigation`}
                      </small>
                    )}
                  </span>
                </div>
              </div>

              {rainFx.status === 'ready' && (() => {
                const fx = rainFx.data;
                const periodNeed = Math.round(
                  waterNeed(windows, NOW_MONTH) * (fx.days.length / 30.4)
                );
                const diff = Math.round(fx.totalMm - periodNeed);
                const maxD = Math.max(...fx.days.map((d) => d.mm), 1);
                return (
                  <div className="mt-4">
                    <div className="market-section-label mb-2">
                      Live outlook · next {fx.days.length} days
                    </div>
                    <div className="fx-strip">
                      {fx.days.map((d) => (
                        <div
                          className="fx-day"
                          key={d.date}
                          title={`${new Date(d.date + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${d.mm} mm${d.prob != null ? ` · ${d.prob}% chance` : ''}`}
                        >
                          <div className="fx-track">
                            <div
                              className="fx-fill"
                              style={{ height: `${Math.max((d.mm / maxD) * 100, 3)}%` }}
                            />
                          </div>
                          <span className="fx-mm">{d.mm >= 1 ? Math.round(d.mm) : ''}</span>
                          <span className="fx-dow">
                            {new Date(d.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="fx-summary">
                      <strong className={diff >= 0 ? 'delta-up' : 'delta-down'}>
                        {fx.totalMm} mm forecast
                      </strong>{' '}
                      vs ≈{periodNeed} mm crop need for the period —{' '}
                      {diff >= 0
                        ? `${diff} mm surplus, irrigation unlikely`
                        : `${-diff} mm short, supplemental water likely needed`}
                    </div>
                  </div>
                );
              })()}
              {rainFx.status === 'error' && (
                <div className="text-body-secondary small mt-3">
                  Live rain forecast unavailable for this location.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="vstack gap-4">
            <div className="card">
              <div className="card-header fw-semibold">
                Ideal conditions · {variety === 'arabica' ? 'Arabica' : 'Robusta'}
              </div>
              <div className="card-body">
                <IdealBar spec={ideals.temp} value={avgTemp} />
                <IdealBar spec={ideals.rain} value={annualRain} />
                <IdealBar spec={ideals.alt} value={elevation} />
                <IdealBar spec={ideals.ph} value={null} />
              </div>
            </div>
            <div className="card">
              <div className="card-header fw-semibold">Region notes</div>
              <div className="card-body small">
                {place.shared && (
                  <p className="mb-2">
                    ☕ Arabica and robusta follow the same calendar at this origin.
                  </p>
                )}
                <p className="mb-2">{place.highlight}</p>
                <p className="text-body-secondary mb-0">
                  Rainfall &amp; temperature are 5-year monthly normals for{' '}
                  {place.lat.toFixed(1)}°, {place.lon.toFixed(1)}° (Open-Meteo archive).
                  Windows are regional norms — calibrate to your farm's altitude and microclimate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
