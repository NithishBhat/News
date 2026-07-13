import { useEffect, useState } from 'react';
import WeatherPanel from './components/WeatherPanel.jsx';
import NewsList from './components/NewsList.jsx';
import PricesPanel from './components/PricesPanel.jsx';
import CropCalendar from './components/CropCalendar.jsx';

const REFRESH_MS = 10 * 60 * 1000;

function pageFromHash() {
  return window.location.hash === '#/planner' ? 'planner' : 'home';
}

export default function App() {
  const [news, setNews] = useState({ status: 'loading', items: [] });
  const [page, setPage] = useState(pageFromHash);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('cn-theme') || 'dark'
  );

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('cn-theme', theme);
  }, [theme]);

  async function loadNews() {
    try {
      // cache: no-store — freshness is handled by the CDN (s-maxage), not
      // the browser cache, which otherwise serves stale payloads
      const res = await fetch('/api/news', { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const data = await res.json();
      setNews({ status: 'ready', items: data.items });
    } catch (err) {
      setNews((prev) =>
        prev.items.length
          ? prev
          : { status: 'error', items: [], error: err.message }
      );
    }
  }

  useEffect(() => {
    loadNews();
    const t = setInterval(loadNews, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <nav className="navbar sticky-top border-bottom bg-body py-2">
        <div className="container-xxl">
          <span className="navbar-brand mb-0 h1 brand">
            <img src="/bean.svg" alt="" className="brand-bean me-1" /> Coffee News
            <span className="brand-sub d-none d-md-inline ms-2">
              The grower&apos;s daily
            </span>
          </span>
          <ul className="nav segmented page-nav">
            <li className="nav-item">
              <a className={`nav-link py-1 px-3 ${page === 'home' ? 'active' : ''}`} href="#/">
                Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link py-1 px-3 ${page === 'planner' ? 'active' : ''}`}
                href="#/planner"
              >
                Crop planner
              </a>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-3">
            <span className="text-body-secondary small d-none d-sm-inline">
              {today}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </nav>

      <main className="container-xxl py-4">
        {page === 'planner' ? (
          <CropCalendar />
        ) : (
          <div className="row g-4">
            <aside className="col-lg-3 order-1">
              <WeatherPanel />
            </aside>

            <section className="col-lg-6 order-3 order-lg-2">
              <NewsList news={news} onRetry={loadNews} />
            </section>

            <aside className="col-lg-3 order-2 order-lg-3">
              <PricesPanel />
            </aside>
          </div>
        )}
      </main>

      <footer className="border-top py-3 mt-2">
        <div className="container-xxl text-center text-body-secondary small">
          Headlines via public RSS feeds · Weather by{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{' '}
          · Futures quotes via Barchart &amp; Yahoo Finance (delayed, informational
          only) · Built on the MERN stack
        </div>
      </footer>
    </>
  );
}
