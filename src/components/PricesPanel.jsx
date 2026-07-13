import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const REFRESH_MS = 10 * 60 * 1000;

const RANGES = [
  { key: '1W', days: 5 },
  { key: '1M', days: 22 },
  { key: '3M', days: 66 },
  { key: '6M', days: 999 },
];

const ARABICA_COLOR = '#e8924a';
const ROBUSTA_COLOR = '#64a0e8';
const GRID_COLOR = 'rgba(128, 128, 128, 0.14)';
const TICK_COLOR = '#8a8f98';

const CURRENCIES = {
  USD: { symbol: 'US$', label: 'USD — US dollar' },
  INR: { symbol: '₹', label: 'INR — Indian rupee' },
  EUR: { symbol: '€', label: 'EUR — euro' },
  BRL: { symbol: 'R$', label: 'BRL — Brazilian real' },
  GBP: { symbol: '£', label: 'GBP — pound' },
};

// Futures quote natively in USD (arabica in US cents/lb, robusta in US$/t).
// Convert everything shown — quotes, chart, sessions — into the selected
// currency. USD keeps native units; usdbrl is itself an FX pair, never converted.
function convertContract(c, currency, fxRates) {
  if (currency === 'USD' || !fxRates?.[currency] || c.key === 'usdbrl') return c;
  const rate = fxRates[currency];
  const factor = c.key === 'arabica' ? rate / 100 : rate; // US¢ → whole currency units
  const conv = (v) => (v == null ? v : +(v * factor).toFixed(2));
  return {
    ...c,
    price: conv(c.price),
    prevClose: conv(c.prevClose),
    change: conv(c.change),
    unit: `${CURRENCIES[currency].symbol} / ${c.key === 'arabica' ? 'lb' : 'tonne'}`,
    history: c.history.map((p) => ({ t: p.t, c: conv(p.c) })),
  };
}

const GROWER_LINKS = [
  {
    icon: '📊',
    label: 'ICO',
    desc: 'Market reports & indicator prices',
    url: 'https://icocoffee.org',
  },
  {
    icon: '🌱',
    label: 'World Coffee Research',
    desc: 'Arabica & robusta varieties catalog',
    url: 'https://varieties.worldcoffeeresearch.org',
  },
  {
    icon: '🔬',
    label: 'CENICAFÉ',
    desc: 'Agronomy research & pest management',
    url: 'https://www.cenicafe.org',
  },
  {
    icon: '🌦️',
    label: 'Coffee & Climate',
    desc: 'Climate-adaptation toolbox for farms',
    url: 'https://toolbox.coffeeandclimate.org',
  },
  {
    icon: '🤝',
    label: 'SCA',
    desc: 'Price crisis & sustainability resources',
    url: 'https://sca.coffee',
  },
];

function fmtDate(d) {
  return new Date(d + 'T12:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function Delta({ value, pct }) {
  if (value == null) return <span className="text-body-secondary">—</span>;
  const up = value >= 0;
  return (
    <span className={`delta ${up ? 'delta-up' : 'delta-down'}`}>
      {up ? '+' : ''}
      {value.toLocaleString()} ({up ? '+' : ''}
      {pct}%)
    </span>
  );
}

function QuoteCard({ c }) {
  const up = c.change >= 0;
  return (
    <div className="quote-card">
      <div className="quote-card-head">
        <span className="quote-card-name">{c.name}</span>
        <span className={`quote-pill ${up ? 'quote-pill-up' : 'quote-pill-down'}`}>
          {up ? '▲' : '▼'} {Math.abs(c.changePct)}%
        </span>
      </div>
      <div className="quote-card-price">{c.price.toLocaleString()}</div>
      <div className="quote-card-meta">
        {c.unit} · {c.exchange} · prev {c.prevClose.toLocaleString()}
      </div>
    </div>
  );
}

function PriceChart({ contracts, range, currency }) {
  const arabica = contracts.find((c) => c.key === 'arabica');
  const robusta = contracts.find((c) => c.key === 'robusta');
  if (!arabica?.history?.length) return null;
  const aUnit = currency === 'USD' ? 'US¢/lb' : arabica.unit;
  const rUnit = currency === 'USD' ? 'US$/t' : robusta?.unit;

  const days = RANGES.find((r) => r.key === range)?.days ?? 999;
  const aHist = arabica.history.slice(-days);
  const labels = aHist.map((p) => p.t);
  const rByDate = new Map((robusta?.history || []).map((p) => [p.t, p.c]));
  const rAligned = labels.map((d) => rByDate.get(d) ?? null);

  const data = {
    labels: labels.map(fmtDate),
    datasets: [
      {
        label: `Arabica  ${aUnit}`,
        data: aHist.map((p) => p.c),
        borderColor: ARABICA_COLOR,
        backgroundColor: 'rgba(232, 146, 74, 0.14)',
        yAxisID: 'y',
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 10,
        borderWidth: 2,
        tension: 0.2,
      },
      ...(robusta
        ? [
            {
              label: `Robusta  ${rUnit}`,
              data: rAligned,
              borderColor: ROBUSTA_COLOR,
              yAxisID: 'y1',
              spanGaps: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHitRadius: 10,
              borderWidth: 2,
              tension: 0.2,
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: TICK_COLOR, boxWidth: 14, boxHeight: 2, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 22, 26, 0.92)',
        titleColor: '#fff',
        bodyColor: '#e6e8eb',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          title: (items) => items[0]?.label,
        },
      },
    },
    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, maxTicksLimit: 6, font: { size: 10 } },
      },
      y: {
        position: 'left',
        grid: { color: GRID_COLOR },
        ticks: { color: ARABICA_COLOR, font: { size: 10 } },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: ROBUSTA_COLOR, font: { size: 10 } },
      },
    },
  };

  return (
    <div className="price-chart">
      <Line data={data} options={options} />
    </div>
  );
}

// last sessions with day-over-day change for both benchmarks
function SessionsTable({ contracts }) {
  const arabica = contracts.find((c) => c.key === 'arabica');
  const robusta = contracts.find((c) => c.key === 'robusta');
  if (!arabica?.history?.length) return null;

  const rByDate = new Map((robusta?.history || []).map((p) => [p.t, p.c]));
  const pts = arabica.history.slice(-7);
  const rows = [];
  for (let i = pts.length - 1; i >= 1; i--) {
    const date = pts[i].t;
    const a = pts[i].c;
    const aPrev = pts[i - 1].c;
    const r = rByDate.get(date);
    const rPrev = rByDate.get(pts[i - 1].t);
    rows.push({
      date,
      a,
      aPct: aPrev ? (((a - aPrev) / aPrev) * 100).toFixed(1) : null,
      r,
      rPct: r != null && rPrev ? (((r - rPrev) / rPrev) * 100).toFixed(1) : null,
    });
  }

  return (
    <table className="table table-sm sessions-table mb-0">
      <thead>
        <tr>
          <th>Session</th>
          <th className="text-end">Arabica</th>
          <th className="text-end">Robusta</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 5).map((row) => (
          <tr key={row.date}>
            <td>{fmtDate(row.date)}</td>
            <td className="text-end">
              {row.a.toLocaleString()}
              {row.aPct != null && (
                <span className={`session-pct ${+row.aPct >= 0 ? 'delta-up' : 'delta-down'}`}>
                  {+row.aPct >= 0 ? '+' : ''}
                  {row.aPct}%
                </span>
              )}
            </td>
            <td className="text-end">
              {row.r != null ? row.r.toLocaleString() : '—'}
              {row.rPct != null && (
                <span className={`session-pct ${+row.rPct >= 0 ? 'delta-up' : 'delta-down'}`}>
                  {+row.rPct >= 0 ? '+' : ''}
                  {row.rPct}%
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PricesPanel() {
  const [state, setState] = useState({ status: 'loading' });
  const [range, setRange] = useState('1M');
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('cn-currency') || 'USD'
  );

  function changeCurrency(cur) {
    setCurrency(cur);
    localStorage.setItem('cn-currency', cur);
  }

  async function load() {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setState({ status: 'ready', data });
    } catch (err) {
      setState((prev) =>
        prev.status === 'ready' ? prev : { status: 'error', error: err.message }
      );
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="vstack gap-4">
      <div className="card market-card">
        <div className="card-header d-flex justify-content-between align-items-center gap-2">
          <span className="fw-semibold">Coffee market</span>
          <div className="d-flex align-items-center gap-2">
            {state.status === 'ready' && (
              <span className="market-updated d-none d-sm-inline">
                {new Date(state.data.updatedAt).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}
            <select
              className="form-select form-select-sm currency-select"
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              aria-label="Display currency"
              title="Display currency"
            >
              {Object.entries(CURRENCIES).map(([code, { label }]) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body pt-3">
          {state.status === 'loading' && (
            <div className="placeholder-wave py-3">
              <span className="placeholder col-12 d-block mb-2"></span>
              <span className="placeholder col-8 d-block"></span>
            </div>
          )}
          {state.status === 'error' && (
            <div className="text-body-secondary small py-2">
              Prices unavailable — {state.error}
            </div>
          )}
          {state.status === 'ready' && (() => {
            const view = state.data.contracts.map((c) =>
              convertContract(c, currency, state.data.fxRates)
            );
            return (
            <>
              {currency !== 'USD' && !state.data.fxRates?.[currency] && (
                <div className="text-body-secondary small mb-2">
                  FX rates unavailable — showing native USD units.
                </div>
              )}
              <div className="quote-grid">
                {view.map((c) => (
                  <QuoteCard c={c} key={c.key} />
                ))}
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                <span className="market-section-label">Price history</span>
                <div className="segmented" role="group" aria-label="Chart range">
                  {RANGES.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      className={`btn ${range === r.key ? 'active' : ''}`}
                      onClick={() => setRange(r.key)}
                    >
                      {r.key}
                    </button>
                  ))}
                </div>
              </div>
              <PriceChart contracts={view} range={range} currency={currency} />

              <div className="market-section-label mt-3 mb-1">Recent sessions</div>
              <SessionsTable contracts={view} />

              <div className="text-body-secondary market-footnote mt-2">
                Front-month continuous contracts · EOD closes · quotes delayed,
                informational only
                {currency !== 'USD' && state.data.fxRates?.[currency]
                  ? ` · converted at ${state.data.fxRates[currency]} ${currency}/USD (ECB)`
                  : ''}
              </div>
            </>
            );
          })()}
        </div>
      </div>

      <div className="card">
        <div className="card-header fw-semibold">Grower resources</div>
        <div className="card-body p-2 vstack gap-2">
          {GROWER_LINKS.map((l) => (
            <a
              className="resource-item"
              href={l.url}
              target="_blank"
              rel="noreferrer"
              key={l.url}
            >
              <span className="resource-icon">{l.icon}</span>
              <span className="resource-text">
                <span className="resource-label">{l.label}</span>
                <span className="resource-desc">{l.desc}</span>
              </span>
              <span className="resource-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
