import { getClimate } from '../lib/climate.js';

export default async function handler(req, res) {
  try {
    const { lat, lon } = req.query;
    const climate = await getClimate(lat, lon);
    // climate normals barely change — cache aggressively
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    res.status(200).json(climate);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
