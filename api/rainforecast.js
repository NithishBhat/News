import { getRainForecast } from '../lib/climate.js';

export default async function handler(req, res) {
  try {
    const { lat, lon } = req.query;
    const forecast = await getRainForecast(lat, lon);
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=1800');
    res.status(200).json(forecast);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
