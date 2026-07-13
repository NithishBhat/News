// Crop calendars for major coffee-growing regions, per variety. Months are
// 0-indexed (0 = Jan). Windows are approximate industry norms per origin.
export const LANES = [
  { key: 'planting', label: 'Planting', color: '#4c9a5f', icon: '🌱', note: 'Transplant seedlings at the onset of the rains' },
  { key: 'flowering', label: 'Flowering', color: '#d67ab1', icon: '🌸', note: 'Blossom set — avoid water stress, protect from pests' },
  { key: 'harvestMain', label: 'Main harvest', color: '#c0392b', icon: '🍒', note: 'Selective picking of ripe cherry' },
  { key: 'harvestFly', label: 'Fly crop', color: '#e08e2b', icon: '🍒', note: 'Secondary (fly / mitaca) harvest' },
  { key: 'care', label: 'Prune & fertilize', color: '#6f7f8f', icon: '✂️', note: 'Post-harvest pruning, stumping and nutrition' },
];

// Western Ghats (Karnataka/Kerala) estates share the monsoon calendar:
// Feb–Mar blossom showers, SW monsoon planting, arabica picked before robusta.
const INDIA_WG = {
  arabica: {
    planting: [5, 6, 7],
    flowering: [1, 2],
    harvestMain: [10, 11, 0],
    harvestFly: [],
    care: [1, 2, 8],
  },
  robusta: {
    planting: [5, 6, 7],
    flowering: [2, 3],
    harvestMain: [0, 1, 2],
    harvestFly: [],
    care: [3, 4, 8],
  },
};

export const REGIONS = [
  {
    id: 'india-chikmagalur',
    name: 'Chikmagalur, Karnataka',
    group: 'India',
    lat: 13.32,
    lon: 75.77,
    highlight: 'Blossom showers in Feb–Mar trigger flowering; the SW monsoon (Jun–Sep) drives planting.',
    varieties: INDIA_WG,
  },
  {
    id: 'india-sakleshpur',
    name: 'Sakleshpur (Hassan), Karnataka',
    group: 'India',
    lat: 12.94,
    lon: 75.78,
    highlight: 'Hassan district estate belt on the Western Ghats crest — heavy monsoon exposure, robusta-strong with arabica at elevation.',
    varieties: INDIA_WG,
  },
  {
    id: 'india-belagodu',
    name: 'Belagodu (Hassan), Karnataka',
    group: 'India',
    lat: 12.98,
    lon: 75.82,
    highlight: 'Belagodu hobli of Sakleshpur taluk — classic Hassan robusta country with shade-grown estates along the Hemavathi.',
    varieties: INDIA_WG,
  },
  {
    id: 'india-kodagu',
    name: 'Kodagu (Coorg), Karnataka',
    group: 'India',
    lat: 12.42,
    lon: 75.74,
    highlight: 'India’s largest coffee district — dense shade canopies, pepper intercrop, robusta below 1,000 m and arabica above.',
    varieties: INDIA_WG,
  },
  {
    id: 'india-wayanad',
    name: 'Wayanad, Kerala',
    group: 'India',
    lat: 11.7,
    lon: 76.08,
    highlight: 'Kerala’s robusta plateau — slightly earlier picking than Karnataka; intercropped with pepper and areca.',
    varieties: { robusta: INDIA_WG.robusta },
  },
  {
    id: 'india-araku',
    name: 'Araku Valley, Andhra Pradesh',
    group: 'India',
    lat: 18.33,
    lon: 82.87,
    highlight: 'Tribal-grown arabica in the Eastern Ghats — NE monsoon influence shifts the calendar slightly later.',
    varieties: {
      arabica: {
        planting: [5, 6, 7],
        flowering: [2, 3],
        harvestMain: [10, 11, 0, 1],
        harvestFly: [],
        care: [2, 3, 8],
      },
    },
  },
  {
    id: 'colombia',
    name: 'Huila, Colombia',
    group: 'Americas',
    lat: 2.53,
    lon: -75.52,
    highlight: 'Two rainy seasons give a main harvest (Oct–Jan) and a mitaca (Apr–Jun).',
    varieties: {
      arabica: {
        planting: [2, 3, 4],
        flowering: [1, 2, 7, 8],
        harvestMain: [9, 10, 11, 0],
        harvestFly: [3, 4, 5],
        care: [1, 6],
      },
    },
  },
  {
    id: 'brazil-mg',
    name: 'Minas Gerais, Brazil',
    group: 'Americas',
    lat: -21.2,
    lon: -45.0,
    highlight: 'Single dry-season harvest (May–Sep); flowering follows the first spring rains.',
    varieties: {
      arabica: {
        planting: [10, 11, 0, 1],
        flowering: [8, 9, 10],
        harvestMain: [4, 5, 6, 7, 8],
        harvestFly: [],
        care: [7, 8],
      },
    },
  },
  {
    id: 'brazil-es',
    name: 'Espírito Santo, Brazil',
    group: 'Americas',
    lat: -19.5,
    lon: -40.4,
    highlight: 'Brazil’s conilon (robusta) belt — harvest Apr–Jul after spring flowering.',
    varieties: {
      robusta: {
        planting: [9, 10, 11],
        flowering: [8, 9],
        harvestMain: [3, 4, 5, 6],
        harvestFly: [],
        care: [7, 8],
      },
    },
  },
  {
    id: 'ethiopia',
    name: 'Sidama, Ethiopia',
    group: 'Africa',
    lat: 6.75,
    lon: 38.4,
    highlight: 'Kiremt rains (Jun–Sep) establish seedlings; harvest runs Oct–Jan.',
    varieties: {
      arabica: {
        planting: [5, 6, 7],
        flowering: [2, 3, 4],
        harvestMain: [9, 10, 11, 0],
        harvestFly: [],
        care: [0, 1],
      },
    },
  },
  {
    id: 'vietnam',
    name: 'Đắk Lắk, Vietnam',
    group: 'Asia-Pacific',
    lat: 12.7,
    lon: 108.05,
    highlight: 'Dry-season irrigation triggers flowering; harvest peaks Nov–Dec.',
    varieties: {
      robusta: {
        planting: [4, 5, 6, 7],
        flowering: [1, 2, 3],
        harvestMain: [9, 10, 11, 0],
        harvestFly: [],
        care: [0, 1],
      },
    },
  },
  {
    id: 'uganda',
    name: 'Central Uganda',
    group: 'Africa',
    lat: 0.35,
    lon: 32.5,
    highlight: 'Equatorial double rains give a main crop (Nov–Feb) and a fly crop (May–Aug).',
    varieties: {
      robusta: {
        planting: [2, 3, 8, 9],
        flowering: [2, 3, 8, 9],
        harvestMain: [10, 11, 0, 1],
        harvestFly: [4, 5, 6, 7],
        care: [2, 8],
      },
    },
  },
  {
    id: 'kenya',
    name: 'Nyeri, Kenya',
    group: 'Africa',
    lat: -0.42,
    lon: 36.95,
    highlight: 'Long rains (Mar–May) and short rains (Oct–Nov) give two flowerings and two crops.',
    varieties: {
      arabica: {
        planting: [2, 3, 9],
        flowering: [2, 3, 9, 10],
        harvestMain: [9, 10, 11],
        harvestFly: [4, 5, 6],
        care: [0, 1],
      },
    },
  },
  {
    id: 'tanzania',
    name: 'Kilimanjaro, Tanzania',
    group: 'Africa',
    lat: -3.23,
    lon: 37.25,
    highlight: 'Volcanic slopes of Kilimanjaro — flowering after the long rains, harvest Aug–Dec.',
    varieties: {
      arabica: {
        planting: [2, 3],
        flowering: [2, 3, 4],
        harvestMain: [7, 8, 9, 10, 11],
        harvestFly: [],
        care: [0, 1],
      },
    },
  },
  {
    id: 'guatemala',
    name: 'Antigua, Guatemala',
    group: 'Americas',
    lat: 14.56,
    lon: -90.73,
    highlight: 'High-altitude volcanic basin — rains from May set flowering; harvest peaks Dec–Mar.',
    varieties: {
      arabica: {
        planting: [4, 5],
        flowering: [3, 4],
        harvestMain: [11, 0, 1, 2],
        harvestFly: [],
        care: [3, 4],
      },
    },
  },
  {
    id: 'sumatra',
    name: 'Gayo Highlands, Sumatra',
    group: 'Asia-Pacific',
    lat: 4.6,
    lon: 96.85,
    highlight: 'Equatorial Aceh highlands — near year-round rain gives a long main crop and a fly crop.',
    varieties: {
      arabica: {
        planting: [8, 9, 10],
        flowering: [4, 5, 9, 10],
        harvestMain: [9, 10, 11, 0],
        harvestFly: [2, 3, 4],
        care: [1, 6],
      },
    },
  },
];

// A region's windows for a variety; falls back to the other variety's
// calendar when the origin doesn't distinguish them (shared = true).
export function getWindows(region, variety) {
  const native = region.varieties[variety];
  if (native) return { windows: native, shared: false };
  const other = variety === 'arabica' ? 'robusta' : 'arabica';
  return { windows: region.varieties[other], shared: true };
}

// Agronomic optima per variety (scale = axis bounds for the range bars)
export const IDEALS = {
  arabica: {
    temp: { ideal: [18, 21], scale: [10, 32], unit: '°C', label: 'Avg temperature' },
    rain: { ideal: [1500, 2500], scale: [0, 4000], unit: ' mm/yr', label: 'Annual rainfall' },
    alt: { ideal: [1000, 2000], scale: [0, 2600], unit: ' m', label: 'Altitude' },
    ph: { ideal: [5.2, 6.2], scale: [4, 8], unit: '', label: 'Soil pH' },
  },
  robusta: {
    temp: { ideal: [22, 28], scale: [10, 32], unit: '°C', label: 'Avg temperature' },
    rain: { ideal: [2000, 3000], scale: [0, 4000], unit: ' mm/yr', label: 'Annual rainfall' },
    alt: { ideal: [0, 800], scale: [0, 2600], unit: ' m', label: 'Altitude' },
    ph: { ideal: [5.0, 6.5], scale: [4, 8], unit: '', label: 'Soil pH' },
  },
};

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// nearest listed origin that grows the given variety
export function nearestRegion(lat, lon, variety) {
  const candidates = REGIONS.filter((r) => r.varieties[variety]);
  let best = candidates[0];
  let bestKm = Infinity;
  for (const r of candidates) {
    const km = haversineKm(lat, lon, r.lat, r.lon);
    if (km < bestKm) {
      bestKm = km;
      best = r;
    }
  }
  return { region: best, km: bestKm };
}

// Approximate crop water requirement by growth stage (mm/month).
export function waterNeed(windows, month) {
  if (windows.flowering.includes(month)) return 130;
  if (windows.harvestMain.includes(month) || windows.harvestFly.includes(month)) return 70;
  return 100;
}
