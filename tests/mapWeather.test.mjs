import test from 'node:test';
import assert from 'node:assert/strict';

// Weather Service and Risk Engine Logic for testing Step 6 rules

const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function validateCoordinates(coords) {
  if (!coords) {
    return { valid: false, reason: 'Coordinates object is null or undefined.' };
  }
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, reason: 'Coordinates must be valid numbers.' };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, reason: `Latitude ${lat} out of range. Must be between -90 and 90 degrees.` };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, reason: `Longitude ${lng} out of range. Must be between -180 and 180 degrees.` };
  }

  return { valid: true };
}

function decodeWmoWeatherCode(code) {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
      return 'Mainly clear';
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Fog and depositing rime fog';
    case 51:
      return 'Light drizzle';
    case 53:
      return 'Moderate drizzle';
    case 55:
      return 'Dense drizzle';
    case 56:
    case 57:
      return 'Freezing drizzle';
    case 61:
      return 'Slight rain';
    case 63:
      return 'Moderate rain';
    case 65:
      return 'Heavy rain';
    case 66:
    case 67:
      return 'Freezing rain';
    case 71:
      return 'Slight snow fall';
    case 73:
      return 'Moderate snow fall';
    case 75:
      return 'Heavy snow fall';
    case 77:
      return 'Snow grains';
    case 80:
      return 'Slight rain showers';
    case 81:
      return 'Moderate rain showers';
    case 82:
      return 'Violent rain showers';
    case 85:
    case 86:
      return 'Snow showers (slight/heavy)';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with heavy hail';
    default:
      return 'Atmospheric variability';
  }
}

function getWindDirectionCardinal(degrees) {
  if (isNaN(degrees)) return 'Variable';
  const deg = (degrees % 360 + 360) % 360;
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(deg / 22.5) % 16;
  return `${Math.round(deg)}° ${directions[index]}`;
}

function getCoordCacheKey(coords) {
  return `${Number(coords.lat).toFixed(2)},${Number(coords.lng).toFixed(2)}`;
}

const CATEGORY_BASELINE_WEIGHTS = {
  radioactive: 25,
  water: 22,
  air: 20,
  soil: 18,
  plastic: 16,
  thermal: 14,
  noise: 12,
  light: 10,
  visual: 8,
};

function assessWeatherRisk({ category = 'plastic', severity = 3, coords, weather = null }) {
  const base = CATEGORY_BASELINE_WEIGHTS[category] || 15;
  const sevScore = Math.min(5, Math.max(1, Math.round(Number(severity) || 3))) * 6;

  let weatherMultiplier = 4; // Baseline neutral
  const explanations = [];
  const recommendedActions = [];

  if (weather) {
    const rain = Math.max(0, Number(weather.rain || weather.precipitation || 0));
    const wind = Math.max(0, Number(weather.windSpeed || 0));
    const temp = Number(weather.temperature ?? 24);

    if ((category === 'plastic' || category === 'water' || category === 'soil' || category === 'radioactive') && rain > 5) {
      if (rain > 20) {
        weatherMultiplier = 20;
        explanations.push(
          `CRITICAL METEOROLOGICAL AMPLIFIER: Heavy precipitation (${rain.toFixed(1)} mm) over ${category} risk site.`
        );
        recommendedActions.push('Dispatch urgent drainage clearance crew before rain peak');
      } else {
        weatherMultiplier = 14;
        explanations.push(`Moderate precipitation (${rain.toFixed(1)} mm) detected. Elevates runoff volume.`);
      }
    } else if ((category === 'air' || category === 'radioactive') && wind > 25) {
      weatherMultiplier = 18;
      explanations.push(`HIGH WIND VELOCITY (${wind.toFixed(1)} km/h): Rapidly accelerates downwind atmospheric dispersion.`);
      recommendedActions.push('Issue downwind public advisory for vulnerable demographic groups');
    } else if (category === 'air' && wind < 5) {
      weatherMultiplier = 16;
      explanations.push(`STAGNANT AIR MASS: Low wind velocity (${wind.toFixed(1)} km/h) traps particulates in ground zones.`);
    } else if ((category === 'thermal' || category === 'water') && temp > 35) {
      weatherMultiplier = 17;
      explanations.push(`HIGH AMBIENT TEMPERATURE (${temp.toFixed(1)} °C): Sharp reduction in aquatic dissolved oxygen.`);
    } else {
      weatherMultiplier = 6;
    }
  } else {
    explanations.push('Weather telemetry unlinked for coordinates: Standard neutral meteorological coefficient (4/20) applied.');
  }

  const rawScore = base + sevScore + weatherMultiplier + 7;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let level = 'low';
  if (score >= 75) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 25) level = 'moderate';

  return {
    score,
    level,
    weatherMultiplier,
    explanations,
    recommendedActions,
  };
}

// ---------------------- 1. WEATHER UNIT & CODE PARSING ----------------------

test('Live Weather - Decodes WMO standard weather codes into plain human descriptions', () => {
  assert.equal(decodeWmoWeatherCode(0), 'Clear sky');
  assert.equal(decodeWmoWeatherCode(1), 'Mainly clear');
  assert.equal(decodeWmoWeatherCode(2), 'Partly cloudy');
  assert.equal(decodeWmoWeatherCode(3), 'Overcast');
  assert.equal(decodeWmoWeatherCode(45), 'Fog and depositing rime fog');
  assert.equal(decodeWmoWeatherCode(51), 'Light drizzle');
  assert.equal(decodeWmoWeatherCode(61), 'Slight rain');
  assert.equal(decodeWmoWeatherCode(63), 'Moderate rain');
  assert.equal(decodeWmoWeatherCode(65), 'Heavy rain');
  assert.equal(decodeWmoWeatherCode(71), 'Slight snow fall');
  assert.equal(decodeWmoWeatherCode(80), 'Slight rain showers');
  assert.equal(decodeWmoWeatherCode(82), 'Violent rain showers');
  assert.equal(decodeWmoWeatherCode(95), 'Thunderstorm');
  assert.equal(decodeWmoWeatherCode(99), 'Thunderstorm with heavy hail');
  assert.equal(decodeWmoWeatherCode(9999), 'Atmospheric variability');
});

test('Live Weather - Converts wind degrees to compass cardinal directions', () => {
  assert.equal(getWindDirectionCardinal(0), '0° N');
  assert.equal(getWindDirectionCardinal(45), '45° NE');
  assert.equal(getWindDirectionCardinal(65), '65° ENE');
  assert.equal(getWindDirectionCardinal(90), '90° E');
  assert.equal(getWindDirectionCardinal(180), '180° S');
  assert.equal(getWindDirectionCardinal(270), '270° W');
  assert.equal(getWindDirectionCardinal(360), '0° N');
  assert.equal(getWindDirectionCardinal(NaN), 'Variable');
});

// ---------------------- 2. COORDINATES VALIDATION & RESILIENCE ----------------------

test('Live Weather - Validates latitude and longitude boundaries', () => {
  // Valid coordinates (New Delhi)
  const validCoords = { lat: 28.6139, lng: 77.2090 };
  const res1 = validateCoordinates(validCoords);
  assert.equal(res1.valid, true);

  // Valid coordinates (Hyderabad)
  const res2 = validateCoordinates({ lat: 17.3850, lng: 78.4867 });
  assert.equal(res2.valid, true);

  // Invalid: Latitude out of range (> 90)
  const res3 = validateCoordinates({ lat: 91.5, lng: 77.2090 });
  assert.equal(res3.valid, false);
  assert.match(res3.reason, /Latitude .* out of range/);

  // Invalid: Latitude out of range (< -90)
  const res4 = validateCoordinates({ lat: -95.0, lng: 77.2090 });
  assert.equal(res4.valid, false);

  // Invalid: Longitude out of range (> 180)
  const res5 = validateCoordinates({ lat: 28.6139, lng: 185.0 });
  assert.equal(res5.valid, false);
  assert.match(res5.reason, /Longitude .* out of range/);

  // Invalid: NaN coordinates
  const res6 = validateCoordinates({ lat: NaN, lng: 77.2090 });
  assert.equal(res6.valid, false);
  assert.match(res6.reason, /Coordinates must be valid numbers/);

  // Invalid: Null or missing coordinates object
  const res7 = validateCoordinates(null);
  assert.equal(res7.valid, false);
});

// ---------------------- 3. CACHE KEY & 15-MINUTE TTL LOGIC ----------------------

test('Live Weather - Normalizes coordinates into 2-decimal cache keys (~1km radius)', () => {
  const key1 = getCoordCacheKey({ lat: 28.61394, lng: 77.20901 });
  const key2 = getCoordCacheKey({ lat: 28.61412, lng: 77.20889 });
  const keyDifferent = getCoordCacheKey({ lat: 28.6512, lng: 77.2512 });

  // Both close coordinates round to the same 2-decimal bucket
  assert.equal(key1, '28.61,77.21');
  assert.equal(key2, '28.61,77.21');
  assert.equal(key1, key2, 'Nearby points should share the same weather cache entry');
  assert.notEqual(key1, keyDifferent);
});

test('Live Weather - Cache TTL and stale-data error handling behavior', () => {
  class MockWeatherCache {
    constructor(ttlMs = WEATHER_CACHE_TTL_MS) {
      this.cache = new Map();
      this.ttlMs = ttlMs;
    }

    set(key, data, timestamp = Date.now()) {
      this.cache.set(key, { data, timestamp });
    }

    get(coords, now = Date.now(), forceRefresh = false) {
      const key = getCoordCacheKey(coords);
      const entry = this.cache.get(key);
      if (!entry) return null;

      if (!forceRefresh && now - entry.timestamp < this.ttlMs) {
        return { ...entry.data, isStale: false };
      }
      return { ...entry.data, isStale: true };
    }
  }

  const cache = new MockWeatherCache(15 * 60 * 1000); // 15 mins
  const coords = { lat: 28.6139, lng: 77.2090 };
  const mockWeather = {
    coordinates: coords,
    temperature: 24.5,
    apparentTemperature: 25.0,
    precipitation: 0.0,
    rain: 0.0,
    precipitationProbability: 10,
    windSpeed: 12.0,
    windDirection: 180,
    relativeHumidity: 55,
    weatherCode: 1,
    weatherDescription: 'Mainly clear',
    hourly: { times: ['01:00', '02:00'], temperatures: [24, 23], precipitationProbs: [10, 10], windSpeeds: [12, 10] },
    daily: { dates: ['Today'], maxTemps: [28], precipSums: [0] },
    fetchedAt: new Date().toISOString(),
    source: 'Open-Meteo',
    isStale: false,
  };

  const t0 = 1000000;
  cache.set(getCoordCacheKey(coords), mockWeather, t0);

  // 1. Fetch within 5 minutes -> fresh cached data
  const t5min = t0 + 5 * 60 * 1000;
  const result1 = cache.get(coords, t5min);
  assert.ok(result1);
  assert.equal(result1.isStale, false);
  assert.equal(result1.temperature, 24.5);

  // 2. Fetch past 15 minutes -> stale cached data
  const t20min = t0 + 20 * 60 * 1000;
  const result2 = cache.get(coords, t20min);
  assert.ok(result2);
  assert.equal(result2.isStale, true, 'Cached entry past 15 min TTL must be flagged isStale: true');

  // 3. Force refresh ignores valid cache
  const result3 = cache.get(coords, t5min, true);
  assert.equal(result3.isStale, true, 'Force refresh must not treat cache as fresh');
});

// ---------------------- 4. MAP MARKER CLASSIFICATION & DATA PROVENANCE ----------------------

test('Interactive Map - Filters out entities with invalid or missing coordinates', () => {
  const reports = [
    { id: 'R1', title: 'Valid Report', location: { lat: 28.6139, lng: 77.2090 }, severity: 4, isDemo: false },
    { id: 'R2', title: 'Missing Lat', location: { lat: NaN, lng: 77.2090 }, severity: 3, isDemo: false },
    { id: 'R3', title: 'Null Coords', location: null, severity: 2, isDemo: true },
  ];

  const tasks = [
    { id: 'T1', title: 'Valid Task', location: { lat: 28.5360, lng: 77.2612 }, priority: 'critical', isDemo: true },
    { id: 'T2', title: 'Undefined Lng', location: { lat: 28.5360, lng: undefined }, priority: 'high', isDemo: false },
  ];

  const sanitizeEntities = (items, getLoc) =>
    items.filter((item) => {
      const loc = getLoc(item);
      return loc && typeof loc.lat === 'number' && !isNaN(loc.lat) && typeof loc.lng === 'number' && !isNaN(loc.lng);
    });

  const validReports = sanitizeEntities(reports, (r) => r.location);
  const validTasks = sanitizeEntities(tasks, (t) => t.location);

  assert.equal(validReports.length, 1);
  assert.equal(validReports[0].id, 'R1');
  assert.equal(validTasks.length, 1);
  assert.equal(validTasks[0].id, 'T1');
});

test('Interactive Map - Clearly separates real user reports from demo seed markers', () => {
  const reports = [
    { id: 'R_REAL_1', title: 'Citizen Waste Pile', isDemo: false, severity: 3 },
    { id: 'R_DEMO_1', title: 'Seed Culvert Hazard', isDemo: true, severity: 5 },
    { id: 'R_DEMO_2', title: 'Seed Water Foam', isDemo: true, severity: 4 },
  ];

  const tasks = [
    { id: 'T_REAL_1', title: 'Citizen Dispatched Task', isDemo: false, priority: 'high' },
    { id: 'T_DEMO_1', title: 'Seed Emergency Siphon Screen', isDemo: true, priority: 'critical' },
  ];

  // Filter: Real Only
  const realReports = reports.filter((r) => !r.isDemo);
  const realTasks = tasks.filter((t) => !t.isDemo);
  assert.equal(realReports.length, 1);
  assert.equal(realReports[0].id, 'R_REAL_1');
  assert.equal(realTasks.length, 1);
  assert.equal(realTasks[0].id, 'T_REAL_1');

  // Filter: Demo Only
  const demoReports = reports.filter((r) => r.isDemo);
  const demoTasks = tasks.filter((t) => t.isDemo);
  assert.equal(demoReports.length, 2);
  assert.equal(demoTasks.length, 1);
});

// ---------------------- 5. WEATHER & RISK ENGINE INTEGRATION ----------------------

test('Weather Integration - Amplifies plastic & water risk during heavy rainfall', () => {
  const coords = { lat: 28.6139, lng: 77.2090 };

  // Scenario 1: Dry conditions (0 mm rain)
  const dryWeather = {
    coordinates: coords,
    temperature: 24,
    apparentTemperature: 24,
    precipitation: 0,
    rain: 0,
    windSpeed: 10,
    windDirection: 180,
    relativeHumidity: 50,
    weatherCode: 0,
    weatherDescription: 'Clear',
  };

  const dryAssessment = assessWeatherRisk({
    category: 'plastic',
    severity: 4,
    coords,
    weather: dryWeather,
  });

  // Scenario 2: Torrential rain (>20 mm)
  const stormWeather = {
    coordinates: coords,
    temperature: 20,
    apparentTemperature: 20,
    precipitation: 32.5,
    rain: 32.5,
    windSpeed: 20,
    windDirection: 180,
    relativeHumidity: 95,
    weatherCode: 65,
    weatherDescription: 'Heavy rain',
  };

  const stormAssessment = assessWeatherRisk({
    category: 'plastic',
    severity: 4,
    coords,
    weather: stormWeather,
  });

  // Score must be higher during heavy rain due to culvert choking and flash flood risk
  assert.ok(
    stormAssessment.score > dryAssessment.score,
    `Storm score (${stormAssessment.score}) must exceed dry score (${dryAssessment.score})`
  );
  assert.equal(stormAssessment.weatherMultiplier, 20, 'Heavy rain over plastic must yield max +20 weather multiplier');
  assert.ok(stormAssessment.explanations.some((e) => e.includes('CRITICAL METEOROLOGICAL AMPLIFIER')));
  assert.ok(stormAssessment.recommendedActions.some((a) => a.includes('drainage clearance crew')));
});

test('Weather Integration - Evaluates high wind dispersion on air pollution risks', () => {
  const coords = { lat: 28.6139, lng: 77.2090 };

  const highWindWeather = {
    coordinates: coords,
    temperature: 25,
    apparentTemperature: 25,
    precipitation: 0,
    rain: 0,
    windSpeed: 38.0, // High wind
    windDirection: 270,
    relativeHumidity: 40,
    weatherCode: 1,
    weatherDescription: 'Windy',
  };

  const assessment = assessWeatherRisk({
    category: 'air',
    severity: 3,
    coords,
    weather: highWindWeather,
  });

  assert.equal(assessment.weatherMultiplier, 18, 'High wind dispersion over air pollution must contribute 18/20');
  assert.ok(assessment.explanations.some((e) => e.includes('HIGH WIND VELOCITY')));
  assert.ok(assessment.recommendedActions.some((a) => a.includes('downwind public advisory')));
});

test('Weather Integration - Handles missing or null weather safely with neutral baseline', () => {
  const coords = { lat: 28.6139, lng: 77.2090 };

  const unlinkedAssessment = assessWeatherRisk({
    category: 'soil',
    severity: 3,
    coords,
    weather: null, // Null weather
  });

  assert.ok(unlinkedAssessment.score >= 0 && unlinkedAssessment.score <= 100);
  assert.equal(unlinkedAssessment.weatherMultiplier, 4, 'Missing weather must apply neutral 4/20 baseline multiplier');
  assert.ok(unlinkedAssessment.explanations.some((e) => e.includes('Weather telemetry unlinked')));
});
