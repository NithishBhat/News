import { useMemo, useState } from 'react';

const PAGE_SIZE = 12;

const TABS = [
  { key: 'coffee', label: 'Coffee' },
  { key: 'all', label: 'All' },
  { key: 'markets', label: 'Markets' },
  { key: 'climate', label: 'Climate' },
  { key: 'world', label: 'World' },
];

const CATEGORY_BADGE = {
  coffee: 'cat-coffee',
  markets: 'cat-markets',
  climate: 'cat-climate',
  world: 'cat-world',
};

function timeAgo(iso) {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NewsRow({ item }) {
  return (
    <a
      className="card news-card text-decoration-none"
      href={item.link}
      target="_blank"
      rel="noreferrer"
    >
      <div className="card-body py-3 px-3">
        <h3 className="news-title mb-1">{item.title}</h3>
        <p className="news-snippet text-body-secondary mb-0">{item.snippet}</p>
        <div className="d-flex justify-content-between align-items-center mt-2 small">
          <span className="d-flex align-items-center gap-2 min-w-0">
            <span className={`badge ${CATEGORY_BADGE[item.category] || 'text-bg-secondary'}`}>
              {item.category}
            </span>
            <span className="text-body-secondary text-truncate">{item.source}</span>
          </span>
          <time
            className="text-body-secondary flex-shrink-0 ms-2"
            dateTime={item.publishedAt}
            title={new Date(item.publishedAt).toLocaleString()}
          >
            {timeAgo(item.publishedAt)}
          </time>
        </div>
      </div>
    </a>
  );
}

export default function NewsList({ news, onRetry }) {
  const [tab, setTab] = useState('coffee');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () =>
      tab === 'all'
        ? news.items
        : news.items.filter((i) => i.category === tab),
    [news.items, tab]
  );

  const counts = useMemo(() => {
    const c = { all: news.items.length };
    for (const i of news.items) c[i.category] = (c[i.category] || 0) + 1;
    return c;
  }, [news.items]);

  function switchTab(key) {
    setTab(key);
    setVisible(PAGE_SIZE);
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 className="section-title mb-0">Headlines</h2>
        <ul className="nav segmented flex-nowrap overflow-auto">
          {TABS.map((t) => (
            <li className="nav-item" key={t.key}>
              <button
                type="button"
                className={`nav-link py-1 px-2 ${tab === t.key ? 'active' : ''}`}
                onClick={() => switchTab(t.key)}
              >
                {t.label}
                {counts[t.key] != null && (
                  <span className="ms-1 opacity-75 small">{counts[t.key]}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {news.status === 'loading' && (
        <div className="vstack gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="card news-card placeholder-wave" key={i}>
              <div className="card-body">
                <span className="placeholder col-8 mb-2 d-block"></span>
                <span className="placeholder col-12 d-block mb-1"></span>
                <span className="placeholder col-10 d-block"></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {news.status === 'error' && (
        <div className="card">
          <div className="card-body text-center">
            <p className="mb-2">Couldn&apos;t load the news: {news.error}</p>
            <button className="btn btn-primary btn-sm" onClick={onRetry}>
              Try again
            </button>
          </div>
        </div>
      )}

      {news.status === 'ready' && (
        <>
          <div className="vstack gap-3">
            {filtered.slice(0, visible).map((item) => (
              <NewsRow item={item} key={item.link} />
            ))}
            {filtered.length === 0 && (
              <div className="card">
                <div className="card-body text-center text-body-secondary">
                  No stories in this section right now.
                </div>
              </div>
            )}
          </div>

          {visible < filtered.length && (
            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Load more ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
