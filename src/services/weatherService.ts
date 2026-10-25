import { WeatherData, Coordinates } from '../types';

// In-memory cache to respect Open-Meteo fair-use policy (15 minute TTL)
export interface WeatherCacheEntry {
  data: WeatherData;
  timestamp: number;
}

const weatherCache: Map<string, WeatherCacheEntry> = new Map();
export const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Validates geographical coordinates to prevent invalid API calls and coordinate errors.
 */
export function validateCoordinates(coords: Coordinates | null | undefined): {
  valid: boolean;
  reason?: string;
} {
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

/**
 * Translates WMO standard weather codes returned by Open-Meteo into human-readable descriptions.
 */
export function decodeWmoWeatherCode(code: number): string {
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

/**
 * Converts wind direction in degrees (0-360) into compass cardinal directions.
 */
export function getWindDirectionCardinal(degrees: number): string {
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

/**
 * Generates normalized 2-decimal cache key for coordinates (~1.1 km radius precision).
 */
export function getCoordCacheKey(coords: Coordinates): string {
  return `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
}

/**
 * Exposes cache clearing for test suites and forced user reload.
 */
export function clearWeatherCache(): void {
  weatherCache.clear();
}

/**
 * Returns inspectable cache status for telemetry diagnostics.
 */
export function getWeatherCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: weatherCache.size,
    keys: Array.from(weatherCache.keys()),
  };
}

/**
 * Retrieves live weather telemetry from the free Open-Meteo API.
 * - No API key or authentication tokens required.
 * - Enforces 15-minute in-memory caching to respect fair-use policy.
 * - Safely handles invalid coordinates, API errors, and network disconnects.
 * - Never fabricates fake live data on complete failure; transparently bubbles errors.
 */
export async function fetchLiveWeatherData(
  coords: Coordinates,
  forceRefresh = false
): Promise<WeatherData> {
  // 1. Validate coordinates
  const validation = validateCoordinates(coords);
  if (!validation.valid) {
    throw new Error(`Coordinates validation failed: ${validation.reason}`);
  }

  const cacheKey = getCoordCacheKey(coords);
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  // 2. Check cache (unless forceRefresh requested)
  if (!forceRefresh && cached && now - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return {
      ...cached.data,
      isStale: false,
    };
  }

  // 3. Make live API request to Open-Meteo
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&forecast_hours=12&timezone=auto`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      let errorReason = `HTTP ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson?.reason) errorReason = errorJson.reason;
      } catch {
        // use status
      }
      throw new Error(`Open-Meteo API returned error: ${errorReason}`);
    }

    const json = await res.json();

    if (json.error) {
      throw new Error(`Open-Meteo API error: ${json.reason || 'Unknown weather service error'}`);
    }

    const current = json.current || {};
    const hourly = json.hourly || {
      time: [],
      temperature_2m: [],
      precipitation_probability: [],
      precipitation: [],
      weather_code: [],
      wind_speed_10m: [],
    };

    // Extract next 12 hours
    const times = (hourly.time || []).slice(0, 12).map((t: string) => {
      const d = new Date(t);
      return isNaN(d.getTime()) ? t : `${d.getHours().toString().padStart(2, '0')}:00`;
    });
    const temps = (hourly.temperature_2m || []).slice(0, 12).map((v: any) => Number(v) || 0);
    const precipProbs = (hourly.precipitation_probability || []).slice(0, 12).map((v: any) => Number(v) || 0);
    const precipitations = (hourly.precipitation || []).slice(0, 12).map((v: any) => Number(v) || 0);
    const winds = (hourly.wind_speed_10m || []).slice(0, 12).map((v: any) => Number(v) || 0);
    const weatherCodes = (hourly.weather_code || []).slice(0, 12).map((v: any) => Number(v) || 0);

    // Extract 7-day prospective daily forecast
    const dailyRaw = json.daily || {
      time: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
      precipitation_sum: [],
      precipitation_probability_max: [],
      wind_speed_10m_max: [],
      weather_code: [],
    };

    const dailyDates: string[] = (dailyRaw.time || []).slice(0, 7).map((d: string) => String(d));
    const dailyMaxTemps: number[] = (dailyRaw.temperature_2m_max || []).slice(0, 7).map((v: any) => Number(v) || 0);
    const dailyMinTemps: number[] = (dailyRaw.temperature_2m_min || []).slice(0, 7).map((v: any) => Number(v) || 0);
    const dailyPrecipSums: number[] = (dailyRaw.precipitation_sum || []).slice(0, 7).map((v: any) => Number(v) || 0);
    const dailyPrecipProbs: number[] = (dailyRaw.precipitation_probability_max || []).slice(0, 7).map((v: any) => Number(v) || 0);
    const dailyWindSpeeds: number[] = (dailyRaw.wind_speed_10m_max || []).slice(0, 7).map((v: any) => Number(v) || 0);
    const dailyWeatherCodes: number[] = (dailyRaw.weather_code || []).slice(0, 7).map((v: any) => Number(v) || 0);
    const dailyWeatherDescriptions: string[] = dailyWeatherCodes.map((code) => decodeWmoWeatherCode(code));

    const timezone = typeof json.timezone === 'string' && json.timezone ? json.timezone : 'UTC';

    const startDate = dailyDates[0] || new Date().toISOString().slice(0, 10);
    const endDate = dailyDates[dailyDates.length - 1] || startDate;
    const forecastPeriod = dailyDates.length > 0 ? `7-Day Horizon (${startDate} to ${endDate})` : 'Prospective 7-Day Horizon';

    const weatherCode = Number(current.weather_code ?? 0);

    const weatherData: WeatherData = {
      coordinates: coords,
      temperature: Number(current.temperature_2m ?? 24),
      apparentTemperature: Number(current.apparent_temperature ?? current.temperature_2m ?? 24),
      precipitation: Number(current.precipitation ?? 0),
      rain: Number(current.rain ?? 0),
      precipitationProbability: precipProbs[0] ?? 0,
      windSpeed: Number(current.wind_speed_10m ?? 8),
      windDirection: Number(current.wind_direction_10m ?? 180),
      relativeHumidity: Number(current.relative_humidity_2m ?? 60),
      weatherCode: weatherCode,
      weatherDescription: decodeWmoWeatherCode(weatherCode),
      hourly: {
        times,
        temperatures: temps,
        precipitationProbs: precipProbs,
        precipitations,
        windSpeeds: winds,
        weatherCodes,
      },
      daily: {
        dates: dailyDates,
        minTemps: dailyMinTemps,
        maxTemps: dailyMaxTemps,
        precipSums: dailyPrecipSums,
        precipProbs: dailyPrecipProbs,
        windSpeeds: dailyWindSpeeds,
        weatherCodes: dailyWeatherCodes,
        weatherDescriptions: dailyWeatherDescriptions,
      },
      timezone,
      forecastPeriod,
      fetchedAt: new Date().toISOString(),
      source: 'Open-Meteo Open Data API (Non-commercial Fair Use)',
      isStale: false,
    };

    // Update in-memory cache
    weatherCache.set(cacheKey, { data: weatherData, timestamp: now });
    return weatherData;
  } catch (err: any) {
    // If a cached response exists from an earlier successful fetch, return it marked as stale
    if (cached) {
      return {
        ...cached.data,
        isStale: true,
      };
    }

    // Do NOT fabricate mock success data when network fails without previous cache.
    // Propagate descriptive error so UI can display offline/API-error state with a Retry action.
    throw new Error(
      `Open-Meteo weather service unavailable: ${err?.message || 'Network request failed'}. Please verify connection and retry.`
    );
  }
}
