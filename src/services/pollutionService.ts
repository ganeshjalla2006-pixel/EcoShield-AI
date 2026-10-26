import {
  Coordinates,
  PollutionCategory,
  VerifiedPollutionObservation,
  CategoryDataSourceStatus,
  ObservationQualityStatus,
} from '../types';
import { validateCoordinates, getCoordCacheKey } from './weatherService';

export interface PollutionDataResponse {
  observations: VerifiedPollutionObservation[];
  sourceStatuses: CategoryDataSourceStatus[];
  fetchedAt: string;
  provider: string;
  isStale?: boolean;
}

// In-memory cache for pollution data to respect provider rate limits (15 min TTL)
interface PollutionCacheEntry {
  data: PollutionDataResponse;
  timestamp: number;
}

const pollutionCache: Map<string, PollutionCacheEntry> = new Map();
export const POLLUTION_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Public Data Source Assessment Matrix for all 9 Pollution Categories.
 * Provides complete scientific honesty on availability, provider requirements, and live feasibility.
 */
export const CATEGORY_DATA_SOURCE_ASSESSMENT: Record<PollutionCategory, CategoryDataSourceStatus> = {
  air: {
    category: 'air',
    categoryName: 'Air Pollution',
    isLiveTelemetryAvailable: true,
    providerName: 'Copernicus CAMS (via Open-Meteo Air Quality) & OpenAQ v3 Ground In-Situ',
    coverage: 'Global High-Resolution (Atmospheric Chemical Transport Models + In-Situ Ground Monitoring Stations)',
    telemetryType: 'Real-Time Model Analysis & Calibrated Ground Sensor Assimilation',
    statusMessage: 'Live continuous telemetry available (PM2.5, PM10, NO₂, SO₂, CO, O₃, US/European AQI).',
    accessPrerequisites: '₹0 Free Tier, CC BY 4.0 Open Data Attribution. Optional: VITE_OPENAQ_API_KEY for physical in-situ ground sensors.',
  },
  water: {
    category: 'water',
    categoryName: 'Water Pollution',
    isLiveTelemetryAvailable: false,
    providerName: 'Central Water Commission (CWC) / State Water Boards',
    coverage: 'Designated River Basins & Fixed Hydrological Gauges (Periodic Grab Sampling)',
    telemetryType: 'Manual Grab Sampling & Specialized Wet Lab Assay',
    statusMessage: 'No verified live sensor telemetry available for this location. Verified field inspection or laboratory grab sample required.',
    accessPrerequisites: 'Requires institutional data-sharing MoU or authenticated REST credentials on National Data Sharing Platform (data.gov.in).',
  },
  soil: {
    category: 'soil',
    categoryName: 'Soil Contamination',
    isLiveTelemetryAvailable: false,
    providerName: 'State Pollution Control Boards (SPCB) / Geological Survey',
    coverage: 'Discrete Brownfield Cordon Zones & Industrial Foundry Sites',
    telemetryType: 'Core Borehole Sampling & Atomic Absorption Spectrometry',
    statusMessage: 'No verified live sensor telemetry available for this location. Laboratory soil assay required.',
    accessPrerequisites: 'Static environmental impact assessments (EIA) only. No continuous real-time public telemetry endpoint exists.',
  },
  noise: {
    category: 'noise',
    categoryName: 'Noise Pollution',
    isLiveTelemetryAvailable: false,
    providerName: 'Municipal Smart City Noise Monitoring Networks',
    coverage: 'Selective Metros (Dense Commercial/Silence Zones)',
    telemetryType: 'Calibrated Type-1 Sound Level Meters (dBA Leq)',
    statusMessage: 'No verified live sensor telemetry available for this location. Calibrated sound-level meter inspection required.',
    accessPrerequisites: 'Data restricted to municipal intranet dashboards; public CORS API endpoints are not published.',
  },
  plastic: {
    category: 'plastic',
    categoryName: 'Plastic & Solid Waste',
    isLiveTelemetryAvailable: false,
    providerName: 'Municipal Drainage & Sanitation Inspection Logs',
    coverage: 'Stormwater Culverts, Weirs, & Pumping Stations',
    telemetryType: 'Physical Inspection & Geotagged Photographic Audit',
    statusMessage: 'No verified live sensor telemetry available for this location. Civic reporting and field worker verification required.',
    accessPrerequisites: 'Managed via EcoShield AI Civic Citizen Portal & Prevention Command Center.',
  },
  thermal: {
    category: 'thermal',
    categoryName: 'Thermal Pollution',
    isLiveTelemetryAvailable: false,
    providerName: 'Thermal Power Plant Effluent Telemetry / Basin Outfall Monitors',
    coverage: 'Direct Cooling Water Discharge Channels',
    telemetryType: 'Submerged Thermistor Probes & Dissolved Oxygen Meters',
    statusMessage: 'No verified live sensor telemetry available for this location. Outfall basin probe verification required.',
    accessPrerequisites: 'Industrial facility SCADA feeds require industrial regulatory compliance token.',
  },
  light: {
    category: 'light',
    categoryName: 'Light Pollution',
    isLiveTelemetryAvailable: false,
    providerName: 'VIIRS / DMSP Satellite Nighttime Radiance & DarkSky Networks',
    coverage: 'Global Satellite Orbital Passes (Monthly/Annual Aggregates)',
    telemetryType: 'Top-of-Atmosphere Radiance Imagery (nW/cm²/sr)',
    statusMessage: 'No verified live sensor telemetry available for this location. Satellite composite imagery or field lux meter inspection required.',
    accessPrerequisites: 'NASA Earthdata / NOAA open archives require bulk raster tile processing, not continuous real-time point telemetry.',
  },
  radioactive: {
    category: 'radioactive',
    categoryName: 'Radioactive Sources',
    isLiveTelemetryAvailable: false,
    providerName: 'Atomic Energy Regulatory Board (AERB) / Emergency Radiation Networks',
    coverage: 'Nuclear Facilities & Major Port Scrap Metal Terminals',
    telemetryType: 'Calibrated Geiger-Müller & NaI(Tl) Scintillation Dosimeters (µSv/h)',
    statusMessage: 'No verified live sensor telemetry available for this location. Specialized nuclear regulatory survey and dosimeter inspection required.',
    accessPrerequisites: 'National security protocols restrict open real-time radiation telemetry APIs.',
  },
  visual: {
    category: 'visual',
    categoryName: 'Visual Blight',
    isLiveTelemetryAvailable: false,
    providerName: 'Municipal Urban Blight & Code Enforcement Records',
    coverage: 'Public Greenbelts, Right-of-Way Road Corridors',
    telemetryType: 'Geotagged Photographic Observation & Ground Inspection',
    statusMessage: 'No verified live sensor telemetry available for this location. Citizen reporting and ground verification required.',
    accessPrerequisites: 'Managed via EcoShield AI Citizen Portal with verifiable image proof.',
  },
};

/**
 * Categorizes US AQI value into standardized EPA index bands.
 */
export function getAqiIndexBand(aqi: number): 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous' {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

/**
 * Returns human-readable label and styling for an AQI index band.
 */
export function getAqiBandDetails(band: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous') {
  switch (band) {
    case 'good':
      return { label: 'Good (0-50)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    case 'moderate':
      return { label: 'Moderate (51-100)', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    case 'unhealthy_sensitive':
      return { label: 'Unhealthy for Sensitive Groups (101-150)', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };
    case 'unhealthy':
      return { label: 'Unhealthy (151-200)', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    case 'very_unhealthy':
      return { label: 'Very Unhealthy (201-300)', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };
    case 'hazardous':
      return { label: 'Hazardous (301+)', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40' };
  }
}

/**
 * Clears the in-memory pollution telemetry cache (used in testing and user-initiated reload).
 */
export function clearPollutionCache(): void {
  pollutionCache.clear();
}

/**
 * Safely resolves the OpenAQ API key from environment variables across Vite and Node test runners.
 */
export function getOpenAqApiKey(): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OPENAQ_API_KEY) {
      return String(import.meta.env.VITE_OPENAQ_API_KEY).trim();
    }
  } catch {
    // Vite import.meta boundary
  }
  const globalProc = (globalThis as any).process;
  if (globalProc && globalProc.env && globalProc.env.VITE_OPENAQ_API_KEY) {
    return String(globalProc.env.VITE_OPENAQ_API_KEY).trim();
  }
  return undefined;
}

/**
 * Optional OpenAQ v3 In-Situ Ground Station Telemetry Provider.
 * When `VITE_OPENAQ_API_KEY` is present, EcoShield AI queries the official OpenAQ v3 API
 * for physical in-situ monitoring stations within 25km radius.
 * If unconfigured or stations are unavailable, defaults to Copernicus CAMS (Open-Meteo) under CC BY 4.0.
 */
export async function tryFetchOpenAQGroundTelemetry(
  coords: Coordinates,
  apiKeyOverride?: string
): Promise<{ success: boolean; stationName?: string; observations?: VerifiedPollutionObservation[] }> {
  const token = apiKeyOverride || getOpenAqApiKey();
  if (!token) {
    return { success: false };
  }

  try {
    const url = `https://api.openaq.org/v3/locations?coordinates=${coords.lat},${coords.lng}&radius=25000&limit=3`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-API-Key': token,
      },
    });

    if (!res.ok) {
      return { success: false };
    }

    const json = await res.json();
    const results = json?.results;
    if (Array.isArray(results) && results.length > 0) {
      const station = results[0];
      const stationName = station.name || 'OpenAQ Ground In-Situ Station';
      const stationObs: VerifiedPollutionObservation[] = [];

      if (Array.isArray(station.sensors)) {
        for (const sensor of station.sensors) {
          const paramName = sensor?.parameter?.name?.toLowerCase();
          const value = sensor?.latest?.value;
          const unit = sensor?.parameter?.units || 'µg/m³';
          const observedAt = sensor?.latest?.datetime || new Date().toISOString();

          if (typeof value === 'number' && !isNaN(value)) {
            if (paramName === 'pm25' || paramName === 'pm2.5') {
              stationObs.push({
                id: `OBS-OPENAQ-PM25-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
                category: 'air',
                indicator: 'Particulate Matter (PM2.5)',
                value: Number(value.toFixed(1)),
                unit,
                provider: `OpenAQ In-Situ Ground Station (${stationName})`,
                coordinates: coords,
                observedAt,
                timezone: 'UTC',
                qualityStatus: 'official_ground_station',
                attribution: `OpenAQ Global Ground Station In-Situ Telemetry (${stationName})`,
              });
            } else if (paramName === 'pm10') {
              stationObs.push({
                id: `OBS-OPENAQ-PM10-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
                category: 'air',
                indicator: 'Coarse Particulate (PM10)',
                value: Number(value.toFixed(1)),
                unit,
                provider: `OpenAQ In-Situ Ground Station (${stationName})`,
                coordinates: coords,
                observedAt,
                timezone: 'UTC',
                qualityStatus: 'official_ground_station',
                attribution: `OpenAQ Global Ground Station In-Situ Telemetry (${stationName})`,
              });
            }
          }
        }
      }

      if (stationObs.length > 0) {
        return {
          success: true,
          stationName,
          observations: stationObs,
        };
      }
    }

    return { success: false };
  } catch (err) {
    console.warn('OpenAQ ground telemetry lookup note:', err);
    return { success: false };
  }
}

/**
 * Retrieves genuine verified environmental observations for the given coordinates.
 * - Queries Open-Meteo Air Quality (Copernicus CAMS & atmospheric monitoring).
 * - Enforces 15-minute in-memory caching.
 * - Returns genuine Air Quality observations (PM2.5, PM10, NO₂, SO₂, CO, O₃, US AQI).
 * - For categories without live telemetry, provides an honest non-fabricated status assessment.
 * - Never fabricates fake sensor numbers for water, soil, noise, etc.
 */
export async function fetchVerifiedPollutionData(
  coords: Coordinates,
  forceRefresh = false
): Promise<PollutionDataResponse> {
  const validation = validateCoordinates(coords);
  if (!validation.valid) {
    throw new Error(`Coordinates validation failed for pollution telemetry: ${validation.reason}`);
  }

  const cacheKey = getCoordCacheKey(coords);
  const now = Date.now();
  const cached = pollutionCache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.timestamp < POLLUTION_CACHE_TTL_MS) {
    return {
      ...cached.data,
      isStale: false,
    };
  }

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lng}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index&timezone=auto`;

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
      throw new Error(`Open-Meteo Air Quality API returned error: ${errorReason}`);
    }

    const json = await res.json();

    if (json.error) {
      throw new Error(`Air Quality API error: ${json.reason || 'Unknown air quality service error'}`);
    }

    const current = json.current || {};
    const observedAt = current.time ? new Date(current.time).toISOString() : new Date().toISOString();
    const timezone = typeof json.timezone === 'string' && json.timezone ? json.timezone : 'UTC';

    const observations: VerifiedPollutionObservation[] = [];
    const providerName = 'Copernicus CAMS via Open-Meteo Air Quality (CC BY 4.0)';

    // 1. PM2.5 Observation
    if (typeof current.pm2_5 === 'number' && !isNaN(current.pm2_5)) {
      observations.push({
        id: `OBS-AIR-PM25-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
        category: 'air',
        indicator: 'Particulate Matter (PM2.5)',
        value: Number(current.pm2_5.toFixed(1)),
        unit: 'µg/m³',
        provider: providerName,
        coordinates: coords,
        observedAt,
        timezone,
        qualityStatus: 'verified_model_analysis',
        attribution: 'Copernicus Atmosphere Monitoring Service (CAMS) Global Near-Real-Time',
        notes: current.pm2_5 > 60 ? 'Exceeds standard 24h WHO guideline (15 µg/m³)' : 'Within moderate ambient boundary',
      });
    }

    // 2. PM10 Observation
    if (typeof current.pm10 === 'number' && !isNaN(current.pm10)) {
      observations.push({
        id: `OBS-AIR-PM10-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
        category: 'air',
        indicator: 'Coarse Particulate (PM10)',
        value: Number(current.pm10.toFixed(1)),
        unit: 'µg/m³',
        provider: providerName,
        coordinates: coords,
        observedAt,
        timezone,
        qualityStatus: 'verified_model_analysis',
        attribution: 'Copernicus Atmosphere Monitoring Service (CAMS)',
        notes: current.pm10 > 100 ? 'Elevated coarse dust concentration' : 'Normal ambient level',
      });
    }

    // 3. Nitrogen Dioxide (NO2)
    if (typeof current.nitrogen_dioxide === 'number' && !isNaN(current.nitrogen_dioxide)) {
      observations.push({
        id: `OBS-AIR-NO2-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
        category: 'air',
        indicator: 'Nitrogen Dioxide (NO₂)',
        value: Number(current.nitrogen_dioxide.toFixed(1)),
        unit: 'µg/m³',
        provider: providerName,
        coordinates: coords,
        observedAt,
        timezone,
        qualityStatus: 'verified_model_analysis',
        attribution: 'Copernicus Atmosphere Monitoring Service (CAMS)',
      });
    }

    // 4. Sulphur Dioxide (SO2)
    if (typeof current.sulphur_dioxide === 'number' && !isNaN(current.sulphur_dioxide)) {
      observations.push({
        id: `OBS-AIR-SO2-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
        category: 'air',
        indicator: 'Sulphur Dioxide (SO₂)',
        value: Number(current.sulphur_dioxide.toFixed(1)),
        unit: 'µg/m³',
        provider: providerName,
        coordinates: coords,
        observedAt,
        timezone,
        qualityStatus: 'verified_model_analysis',
        attribution: 'Copernicus Atmosphere Monitoring Service (CAMS)',
      });
    }

    // 5. Ground-Level Ozone (O3)
    if (typeof current.ozone === 'number' && !isNaN(current.ozone)) {
      observations.push({
        id: `OBS-AIR-O3-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
        category: 'air',
        indicator: 'Ozone (O₃)',
        value: Number(current.ozone.toFixed(1)),
        unit: 'µg/m³',
        provider: providerName,
        coordinates: coords,
        observedAt,
        timezone,
        qualityStatus: 'verified_model_analysis',
        attribution: 'Copernicus Atmosphere Monitoring Service (CAMS)',
      });
    }

    // 6. United States Air Quality Index (US AQI)
    if (typeof current.us_aqi === 'number' && !isNaN(current.us_aqi)) {
      const aqiVal = Math.round(current.us_aqi);
      observations.push({
        id: `OBS-AIR-USAQI-${coords.lat.toFixed(2)}-${coords.lng.toFixed(2)}`,
        category: 'air',
        indicator: 'Air Quality Index (US AQI)',
        value: aqiVal,
        unit: 'AQI index',
        provider: providerName,
        coordinates: coords,
        observedAt,
        timezone,
        qualityStatus: 'verified_model_analysis',
        attribution: 'Calculated using United States EPA Air Quality Index Formula',
        indexBand: getAqiIndexBand(aqiVal),
      });
    }

    // 7. Optional OpenAQ v3 Physical Ground Station Ingestion (when VITE_OPENAQ_API_KEY is configured)
    let activeProvider = providerName;
    try {
      const openAqResult = await tryFetchOpenAQGroundTelemetry(coords);
      if (openAqResult.success && openAqResult.observations && openAqResult.observations.length > 0) {
        observations.unshift(...openAqResult.observations);
        activeProvider = `OpenAQ In-Situ Ground Station (${openAqResult.stationName}) & ${providerName}`;
      }
    } catch {
      // Graceful zero-cost fallback to Copernicus CAMS
    }

    const sourceStatuses = Object.values(CATEGORY_DATA_SOURCE_ASSESSMENT);

    const payload: PollutionDataResponse = {
      observations,
      sourceStatuses,
      fetchedAt: new Date().toISOString(),
      provider: activeProvider,
      isStale: false,
    };

    pollutionCache.set(cacheKey, { data: payload, timestamp: now });
    return payload;
  } catch (err: any) {
    if (cached) {
      return {
        ...cached.data,
        isStale: true,
      };
    }

    throw new Error(
      `Open-Meteo Air Quality telemetry unavailable: ${err?.message || 'Network request failed'}. You may retry connection when online.`
    );
  }
}
