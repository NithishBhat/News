import Parser from 'rss-parser';
import { getDb, Article } from './db.js';

// Every feed is grower-relevant: coffee trade press, commodity/business
// desks, and climate coverage — no general-interest firehose (that's how a
// tennis result ends up on a coffee site).
const FEEDS = [
  { source: 'Daily Coffee News', url: 'https://dailycoffeenews.com/feed/', category: 'coffee' },
  { source: 'Global Coffee Report', url: 'https://www.gcrmag.com/feed/', category: 'coffee' },
  { source: 'Comunicaffe', url: 'https://www.comunicaffe.com/feed/', category: 'coffee' },
  { source: 'Sprudge', url: 'https://sprudge.com/feed', category: 'coffee' },
  { source: 'Fresh Cup', url: 'https://freshcup.com/feed/', category: 'coffee' },
  { source: 'Barista Magazine', url: 'https://www.baristamagazine.com/feed/', category: 'coffee' },
  { source: 'Bean Scene', url: 'https://www.beanscenemag.com.au/feed/', category: 'coffee' },
  { source: 'World Coffee Portal', url: 'https://www.worldcoffeeportal.com/rss', category: 'coffee' },
  { source: 'Coffee Review', url: 'https://www.coffeereview.com/feed/', category: 'coffee' },
  { source: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'markets' },
  { source: 'Guardian Business', url: 'https://www.theguardian.com/uk/business/rss', category: 'markets' },
  { source: 'NPR Business', url: 'https://feeds.npr.org/1006/rss.xml', category: 'markets' },
  { source: 'Guardian Environment', url: 'https://www.theguardian.com/environment/rss', category: 'climate' },
  { source: 'BBC Science & Environment', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'climate' },
  { source: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
  { source: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world' },
];

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'CoffeeNews/1.0 (+rss aggregator)' },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { at: 0, items: [] };

function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImage(item) {
  if (item.enclosure?.url && /image|jpg|jpeg|png|webp/i.test(item.enclosure.type || item.enclosure.url)) {
    return item.enclosure.url;
  }
  const media = item.mediaContent;
  if (media) {
    const m = Array.isArray(media) ? media[0] : media;
    if (m?.$?.url) return m.$.url;
  }
  const thumb = item.mediaThumbnail;
  if (thumb) {
    const t = Array.isArray(thumb) ? thumb[0] : thumb;
    if (t?.$?.url) return t.$.url;
  }
  const html = item.contentEncoded || item.content || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function normalizeItem(item, feed) {
  const { source, category } = feed;
  const publishedAt = item.isoDate || item.pubDate;
  const date = publishedAt ? new Date(publishedAt) : null;
  if (!date || isNaN(date.getTime())) return null;
  const title = stripHtml(item.title || '');
  const link = item.link || item.guid;
  if (!title || !link) return null;
  const raw = stripHtml(item.contentSnippet || item.content || item.contentEncoded || '');
  return {
    title,
    link,
    source,
    category,
    snippet: raw.length > 240 ? raw.slice(0, 240).trimEnd() + '…' : raw,
    image: extractImage(item),
    publishedAt: date.toISOString(),
  };
}

// some publishers emit raw ampersands, which breaks strict XML parsing
function sanitizeXml(xml) {
  return xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

async function fetchFeed(feed) {
  let parsed;
  try {
    parsed = await parser.parseURL(feed.url);
  } catch (err) {
    // retry with sanitized XML (rescues e.g. World Coffee Portal)
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw err;
    parsed = await parser.parseString(sanitizeXml(await res.text()));
  }
  return (parsed.items || [])
    .map((item) => normalizeItem(item, feed))
    .filter(Boolean);
}

async function saveToDb(items) {
  const db = await getDb();
  if (!db) return;
  await Article.bulkWrite(
    items.map((a) => ({
      updateOne: {
        filter: { link: a.link },
        update: { $set: a },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

async function loadFromDb() {
  const db = await getDb();
  if (!db) return [];
  const docs = await Article.find().sort({ publishedAt: -1 }).limit(80).lean();
  return docs.map(({ _id, __v, createdAt, updatedAt, ...rest }) => rest);
}

export async function getNews() {
  if (cache.items.length && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.items;
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const seen = new Set();
  const all = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((a) => {
      if (seen.has(a.link)) return false;
      seen.add(a.link);
      // catch-all feeds (Al Jazeera) mix in sports coverage — not our beat
      if (/\/sports?\//i.test(a.link)) return false;
      // drop future timestamps; coffee outlets publish less often, so they
      // get a 14-day window vs 7 days for the busier desks
      const age = Date.now() - new Date(a.publishedAt).getTime();
      const maxAge = (a.category === 'coffee' ? 14 : 7) * 24 * 60 * 60 * 1000;
      return age > -60 * 60 * 1000 && age < maxAge;
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // cap each category so no single desk floods the feed, then merge back
  // into one strictly time-ordered list
  const PER_CATEGORY = { coffee: 60, markets: 25, climate: 25, world: 25 };
  const counts = {};
  const items = all
    .filter((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
      return counts[a.category] <= (PER_CATEGORY[a.category] || 20);
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  if (items.length) {
    cache = { at: Date.now(), items };
    saveToDb(items).catch(() => {});
    return items;
  }

  // every feed failed — fall back to whatever Mongo has
  const fallback = await loadFromDb().catch(() => []);
  if (fallback.length) return fallback;
  if (cache.items.length) return cache.items;
  throw new Error('No news sources reachable');
}
