import { getWeather } from '../lib/weather.js';

export default async function handler(req, res) {
  try {
    const { city, lat, lon } = req.query;
    const weather = await getWeather({ city, lat, lon });
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=600');
    res.status(200).json(weather);
  } catch (err) {
    const notFound = /not found/i.test(err.message);
    res.status(notFound ? 404 : 502).json({ error: err.message });
  }
}
