import { getPrices } from '../lib/prices.js';

export default async function handler(req, res) {
  try {
    const data = await getPrices();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
