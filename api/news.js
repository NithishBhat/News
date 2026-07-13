import { getNews } from '../lib/news.js';

export default async function handler(req, res) {
  try {
    const items = await getNews();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    res.status(200).json({ count: items.length, items });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
