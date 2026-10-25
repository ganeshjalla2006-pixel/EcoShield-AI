import React, { useEffect, useState } from 'react';
import {
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Clock,
  Compass,
  AlertCircle,
  RefreshCw,
  Info,
  Calendar,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { Coordinates, WeatherData } from '../../types';
import {
  fetchLiveWeatherData,
  getWindDirectionCardinal,
  validateCoordinates,
} from '../../services/weatherService';

interface WeatherStationWidgetProps {
  coordinates: Coordinates;
  onWeatherDataLoaded?: (data: WeatherData) => void;
  title?: string;
  compact?: boolean;
  inSidebar?: boolean;
}

export const WeatherStationWidget: React.FC<WeatherStationWidgetProps> = ({
  coordinates,
  onWeatherDataLoaded,
  title = 'Meteorological Risk Telemetry',
  compact = false,
  inSidebar = false,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<'hourly' | 'daily'>('hourly');

  const loadWeather = async (forceRefresh = false) => {
    const val = validateCoordinates(coordinates);
    if (!val.valid) {
      setError(val.reason || 'Invalid coordinates supplied.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveWeatherData(coordinates, forceRefresh);
      setWeather(data);
      if (onWeatherDataLoaded) {
        onWeatherDataLoaded(data);
      }
    } catch (err: any) {
      console.warn('Weather telemetry retrieval error:', err);
      setError(err?.message || 'Unable to retrieve live Open-Meteo weather telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [coordinates.lat, coordinates.lng]);

  // Loading Skeleton State
  if (loading && !weather) {
    return (
      <div className="bg-[#0b140f] rounded-2xl border border-emerald-950/60 p-5 shadow-sm animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-forest-900/50 rounded w-1/3"></div>
          <div className="h-4 bg-forest-900/30 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-20 bg-[#0e1a13] rounded-xl"></div>
          <div className="h-20 bg-[#0e1a13] rounded-xl"></div>
          <div className="h-20 bg-[#0e1a13] rounded-xl"></div>
          <div className="h-20 bg-[#0e1a13] rounded-xl"></div>
        </div>
        <div className="h-16 bg-[#0e1a13] rounded-xl"></div>
      </div>
    );
  }

  // Error / Offline State with Retry
  if (error && !weather) {
    return (
      <div className="bg-[#140b0b] border border-red-900/40 rounded-2xl p-5 text-xs text-red-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-400" />
            <h4 className="font-bold text-sm text-red-300">Live Weather Telemetry Unavailable</h4>
          </div>
          <button
            onClick={() => loadWeather(true)}
            className="px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 font-semibold text-xs transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>

        <p className="text-slate-300 text-xs leading-relaxed">
          {error}
        </p>

        <div className="p-3 bg-black/40 rounded-xl border border-red-950/60 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Data Honesty Disclosure:</strong> In accordance with EcoShield AI standards, failed weather
            queries are not silently masked with fabricated numbers. You may re-attempt connection when online.
          </span>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-[#0b140f] rounded-2xl border border-emerald-950/60 shadow-elevated overflow-hidden text-slate-200">
      {/* Top Header with Location, Cache Status & Refresh */}
      <div className="bg-[#060e09] border-b border-emerald-950/60 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wide text-white">{title}</h3>
            {weather.isStale ? (
              <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>Cached Telemetry</span>
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Open-Meteo</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {weather.coordinates.lat.toFixed(4)}°N, {weather.coordinates.lng.toFixed(4)}°E
            {weather.coordinates.addressName ? ` • ${weather.coordinates.addressName}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
            <span className="text-slate-300">Timezone: {weather.timezone || 'UTC'}</span>
            <span>&bull;</span>
            <span className="text-emerald-400">{weather.forecastPeriod || '7-Day Horizon'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block">Open Data Provider</span>
            <span className="font-mono text-emerald-400 text-[11px] font-semibold">{weather.source}</span>
          </div>
          <button
            onClick={() => loadWeather(true)}
            disabled={loading}
            title="Force refresh live weather data"
            className="p-1.5 rounded-lg bg-[#0e1d15] hover:bg-[#13281c] border border-emerald-950/80 transition-colors text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="p-4 sm:p-5">
        <div className={`grid gap-2.5 ${inSidebar ? 'grid-cols-1 min-[380px]:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4 sm:gap-3'}`}>
          {/* Temperature & Apparent Temp */}
          <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 min-w-0 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">Temperature</span>
              <div className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {weather.temperature.toFixed(1)}°C
              </div>
              <span className="text-[10px] text-slate-400 block truncate" title={`Feels like ${weather.apparentTemperature.toFixed(1)}°C`}>
                Feels {weather.apparentTemperature.toFixed(1)}°C
              </span>
            </div>
          </div>

          {/* Precipitation & Rainfall */}
          <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 min-w-0 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">Precipitation</span>
              <div className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {weather.precipitation.toFixed(1)} mm
              </div>
              <span className="text-[10px] text-slate-400 block truncate" title={`${weather.precipitationProbability}% prob. (Rain ${weather.rain.toFixed(1)} mm)`}>
                {weather.precipitationProbability}% ({weather.rain.toFixed(1)}mm)
              </span>
            </div>
          </div>

          {/* Wind Speed & Direction */}
          <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 min-w-0 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
              <Wind className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">Wind Velocity</span>
              <div className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {weather.windSpeed.toFixed(1)} km/h
              </div>
              <span className="text-[10px] text-slate-400 block truncate" title={`Direction: ${getWindDirectionCardinal(weather.windDirection)}`}>
                {getWindDirectionCardinal(weather.windDirection)}
              </span>
            </div>
          </div>

          {/* Relative Humidity & Condition */}
          <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 min-w-0 shadow-xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">Rel. Humidity</span>
              <div className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {weather.relativeHumidity}%
              </div>
              <span className="text-[10px] text-emerald-300 font-medium block truncate" title={weather.weatherDescription}>
                {weather.weatherDescription}
              </span>
            </div>
          </div>
        </div>

        {/* Forecast Track (Hourly Trend or Genuine 7-Day Prospective Outlook) */}
        {!compact && (
          <div className="mt-4 pt-3 border-t border-emerald-950/60 min-w-0">
            {/* Horizon Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1 bg-[#08120c] p-1 rounded-lg border border-emerald-950/70 text-xs">
                <button
                  type="button"
                  onClick={() => setForecastHorizon('hourly')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    forecastHorizon === 'hourly'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>12-Hour Hourly Trend</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForecastHorizon('daily')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    forecastHorizon === 'daily'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>7-Day Prospective Outlook</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-400">
                Updated: {new Date(weather.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* View A: 12-Hour Hourly Track */}
            {forecastHorizon === 'hourly' && weather.hourly.times.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scrollbar-thumb-emerald-900/60 scrollbar-track-transparent">
                {weather.hourly.times.map((time, idx) => {
                  const precipProb = weather.hourly.precipitationProbs[idx] ?? 0;
                  const precipMm = weather.hourly.precipitations?.[idx] ?? 0;
                  return (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-[72px] bg-[#08120c] border border-emerald-950/60 rounded-xl p-2 flex flex-col justify-between text-center shadow-2xs"
                    >
                      <span className="text-[10px] font-mono text-slate-400 leading-none">{time}</span>
                      <span className="text-xs font-bold text-white my-1.5 leading-tight">
                        {weather.hourly.temperatures[idx] ?? '-'}°C
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.5 rounded leading-none ${
                          precipProb > 30 || precipMm > 1
                            ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                            : 'text-slate-400 bg-slate-900/40'
                        }`}
                        title={precipMm > 0 ? `${precipMm.toFixed(1)} mm rainfall` : `${precipProb}% probability`}
                      >
                        {precipProb}% rain
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View B: Genuine 7-Day Prospective Outlook */}
            {forecastHorizon === 'daily' && weather.daily && weather.daily.dates.length > 0 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scrollbar-thumb-emerald-900/60 scrollbar-track-transparent">
                {weather.daily.dates.map((dateStr, idx) => {
                  const d = new Date(dateStr + 'T00:00:00');
                  const dayName = isNaN(d.getTime())
                    ? dateStr
                    : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                  const minT = weather.daily.minTemps?.[idx] ?? 0;
                  const maxT = weather.daily.maxTemps[idx] ?? 0;
                  const rainSum = weather.daily.precipSums[idx] ?? 0;
                  const rainProb = weather.daily.precipProbs?.[idx] ?? 0;
                  const windMax = weather.daily.windSpeeds?.[idx] ?? 0;
                  const desc = weather.daily.weatherDescriptions?.[idx] || 'Atmospheric variability';

                  return (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-[130px] bg-[#08120c] border border-emerald-950/70 rounded-xl p-3 flex flex-col justify-between text-xs space-y-2 shadow-2xs"
                    >
                      <div>
                        <div className="text-[11px] font-bold text-white leading-tight">{dayName}</div>
                        <div className="text-[10px] text-emerald-400/90 truncate mt-0.5" title={desc}>
                          {desc}
                        </div>
                      </div>

                      <div className="bg-[#0e1a13] p-1.5 rounded-lg border border-emerald-950/60 font-mono">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Min/Max:</span>
                          <span className="font-bold text-white">
                            {minT.toFixed(0)}° / {maxT.toFixed(0)}°C
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] mt-1">
                          <span className="text-slate-400">Rain:</span>
                          <span className={rainSum > 5 || rainProb > 30 ? 'text-blue-300 font-bold' : 'text-slate-300'}>
                            {rainSum > 0 ? `${rainSum.toFixed(1)}mm` : `${rainProb}%`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] mt-1">
                          <span className="text-slate-400">Wind:</span>
                          <span className="text-teal-300">{windMax.toFixed(0)} km/h</span>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-500 text-center font-mono">
                        {idx === 0 ? 'Today (Forecast)' : `Day +${idx}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Scientific & Operational Disclaimer */}
        <div className="mt-3 p-2.5 bg-[#08120c] rounded-xl border border-emerald-950/60 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-slate-300">Contextual Forecast Evidence:</span> Weather parameters
            from Open-Meteo are prospective meteorological estimates and do not replace official emergency storm
            warnings or direct in-situ chemical contaminant assays.
          </div>
        </div>
      </div>
    </div>
  );
};
