// Local development server. On Vercel the files in /api are deployed as
// serverless functions instead; this Express app mounts the same handlers
// so `npm run dev:api` + the Vite proxy mirror production behavior.
import express from 'express';
import newsHandler from '../api/news.js';
import weatherHandler from '../api/weather.js';
import pricesHandler from '../api/prices.js';
import climateHandler from '../api/climate.js';
import rainForecastHandler from '../api/rainforecast.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.get('/api/news', (req, res) => newsHandler(req, res));
app.get('/api/weather', (req, res) => weatherHandler(req, res));
app.get('/api/prices', (req, res) => pricesHandler(req, res));
app.get('/api/climate', (req, res) => climateHandler(req, res));
app.get('/api/rainforecast', (req, res) => rainForecastHandler(req, res));

app.listen(PORT, () => {
  console.log(`Coffee News API listening on http://localhost:${PORT}`);
});
