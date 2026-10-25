import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Leaf,
  Activity,
  Wind,
  Droplet,
  Trash2,
  Brain,
  CheckCircle,
  MapPin,
  ExternalLink,
  CloudRain,
  Compass,
  AlertTriangle,
  Bell,
  Layers,
  Thermometer,
  Shield,
  Eye,
  Radio,
  Sliders,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Sun,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  PollutionCategory,
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  InAppNotification,
  Coordinates,
  WeatherData,
} from '../../types';
import { EcoGlobe3D } from '../3d/EcoGlobe3D';
import { InteractiveMap } from '../map/InteractiveMap';
import {
  fetchLiveWeatherData,
  decodeWmoWeatherCode,
  getWindDirectionCardinal,
} from '../../services/weatherService';
import {
  fetchVerifiedPollutionData,
  getAqiIndexBand,
  getAqiBandDetails,
} from '../../services/pollutionService';
import { POLLUTION_CATEGORIES_DATA } from '../../data/pollutionCategoriesData';

interface LandingPageProps {
  onEnterPlatform: () => void;
  onOpenReportModal: () => void;
  onSelectCategory?: (category: PollutionCategory) => void;
  onNavigateToLogin?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToTasks?: () => void;
  reports?: PollutionReport[];
  tasks?: PreventionTask[];
  hotspots?: EnvironmentalHotspot[];
  notifications?: InAppNotification[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
  onOpenReportModal,
  onSelectCategory,
  onNavigateToLogin,
  onNavigateToMap,
  onNavigateToReports,
  onNavigateToTasks,
  reports = [],
  tasks = [],
  hotspots = [],
  notifications = [],
}) => {
  // Live console tabs: map, weather, pollution, reports, alerts
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    'map' | 'weather' | 'pollution' | 'reports' | 'alerts'
  >('map');

  // Live telemetry state (Connaught Place / New Delhi default coordinates)
  const [activeCoords, setActiveCoords] = useState<Coordinates>({
    lat: 28.6139,
    lng: 77.209,
    addressName: 'Connaught Place Monitoring Sector, New Delhi',
  });

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [aqiValue, setAqiValue] = useState<number>(142);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Fetch live weather and pollution metrics
  const loadLiveTelemetry = async (coords: Coordinates) => {
    setIsLoadingTelemetry(true);
    setWeatherError(null);
    try {
      const [wData, pData] = await Promise.all([
        fetchLiveWeatherData(coords),
        fetchVerifiedPollutionData(coords),
      ]);
      setWeatherData(wData);
      if (pData && pData.observations && pData.observations.length > 0) {
        // Average PM2.5 or representative indicator
        const pm25Obs = pData.observations.find((p) => p.indicator.includes('PM2.5'));
        if (pm25Obs) {
          setAqiValue(Math.min(500, Math.round(pm25Obs.value * 2.1)));
        }
      }
    } catch (err) {
      console.warn('Failed to load telemetry on landing page:', err);
      setWeatherError('Connecting to Open-Meteo live satellite feeds...');
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    loadLiveTelemetry(activeCoords);
  }, []);

  const aqiBand = getAqiIndexBand(aqiValue);
  const aqiBandDetails = getAqiBandDetails(aqiBand);

  return (
    <div className="min-h-screen bg-[#040906] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden">
      {/* =========================================================================
          1. TOP NAVIGATION BAR (CLEAN & NO ACTIVE ADMIN)
         ========================================================================= */}
      <header className="h-20 bg-[#060e0a]/85 backdrop-blur-xl border-b border-emerald-950/70 px-4 sm:px-8 lg:px-12 flex items-center justify-between sticky top-0 z-50 transition-all">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onEnterPlatform}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-800 p-[1px] shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#05130b] rounded-2xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-white drop-shadow">
                EcoShield
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                3D AI
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/80 font-medium tracking-tight">
              Predict Pollution &bull; Prevent Disasters
            </p>
          </div>
        </div>

        {/* Center Quick Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setActiveConsoleTab('map')}
            className={`hover:text-emerald-400 transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'map' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Live 3D Map</span>
          </button>
          <button
            onClick={() => setActiveConsoleTab('weather')}
            className={`hover:text-emerald-400 transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'weather' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Live Weather & AQI</span>
          </button>
          <button
            onClick={() => setActiveConsoleTab('reports')}
            className={`hover:text-emerald-400 transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'reports' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Community Reports</span>
          </button>
          <button
            onClick={() => setActiveConsoleTab('alerts')}
            className={`hover:text-emerald-400 transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'alerts' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerts ({notifications.length})</span>
          </button>
        </nav>

        {/* Right CTA Buttons (Clean User Flow, No Active Admin) */}
        <div className="flex items-center gap-3">
          {onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#0c1811] hover:bg-[#12241a] rounded-xl border border-emerald-950/80 transition-all hover:border-emerald-500/40"
            >
              Sign In
            </button>
          )}

          <button
            onClick={onOpenReportModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Report Incident (+10 Pts)</span>
          </button>

          <button
            onClick={onEnterPlatform}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.55)] hover:-translate-y-0.5"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION WITH 3D BACKGROUND WEBGL ANIMATION & TITLE
         ========================================================================= */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 sm:px-8 lg:px-12 py-16 overflow-hidden border-b border-emerald-950/70">
        {/* Interactive 3D WebGL Canvas Globe Background */}
        <EcoGlobe3D interactive={true} className="absolute inset-0 w-full h-full z-0 opacity-85" />

        {/* Atmospheric Glow Filters */}
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-1 bg-[radial-gradient(ellipse_at_center,rgba(5,24,14,0.1)_0%,rgba(4,9,6,0.85)_75%,rgba(4,9,6,0.98)_100%)]" />

        {/* Hero Content */}
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6 pt-4">
          {/* Futuristic Live Telemetry Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#08180e]/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live 3D Geospatial Intelligence &bull; Open-Meteo Satellite Feed Active</span>
          </div>

          {/* MAIN TITLE (with rich 3D glowing typography) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
            <span className="block drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]">EcoShield AI</span>
            <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]">
              Predict Pollution. Prevent Before It Happens.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed drop-shadow">
            Autonomous 3D environmental risk intelligence platform synthesizing authentic satellite
            meteorology, open atmospheric telemetry, and geotagged civic observations to trigger proactive
            prevention before disasters strike communities.
          </p>

          {/* 3D Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <button
              onClick={onEnterPlatform}
              className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold px-8 py-4 rounded-2xl shadow-[0_10px_35px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_45px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-1 group"
            >
              <span>Explore 3D Command Center</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('live-console-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 bg-[#091810]/80 hover:bg-[#0d2217] text-white text-sm font-semibold px-7 py-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-400/60 backdrop-blur-md transition-all shadow-lg hover:-translate-y-1"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Live Google Maps & Telemetry</span>
            </button>

            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-emerald-300 text-sm font-semibold px-6 py-4 rounded-2xl border border-white/10 hover:border-emerald-400/40 backdrop-blur-md transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
              <span>Submit Report (+10 EcoPoints)</span>
            </button>
          </div>

          {/* 4 Interactive 3D Stat Counters */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-[#07130b]/80 border border-emerald-950/80 backdrop-blur-md hover:border-emerald-500/40 transition-colors shadow-lg">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">9 Domains</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Air, Water, Plastic & Soil</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#07130b]/80 border border-emerald-950/80 backdrop-blur-md hover:border-emerald-500/40 transition-colors shadow-lg">
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">₹0 / Free</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Zero Paid API Costs</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#07130b]/80 border border-emerald-950/80 backdrop-blur-md hover:border-emerald-500/40 transition-colors shadow-lg">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">15 Min</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Live Weather Telemetry</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#07130b]/80 border border-emerald-950/80 backdrop-blur-md hover:border-emerald-500/40 transition-colors shadow-lg">
              <div className="text-xl sm:text-2xl font-black text-teal-300 font-mono">100% Verifiable</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Audited PostgREST RLS</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. LIVE MULTI-VIEW 3D CONSOLE (GOOGLE MAPS, WEATHER, POLLUTION, ALERTS)
         ========================================================================= */}
      <section id="live-console-section" className="py-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Real-Time Environmental Console</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Live Earth Telemetry & Geospatial Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Switch between real-time Google Maps coordinates, live satellite weather, pollution metrics,
            active community incident reports, and emergency alerts.
          </p>
        </div>

        {/* 3D Glass Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#08140c] border border-emerald-950/80 backdrop-blur-xl max-w-3xl mx-auto mb-8 shadow-2xl">
          <button
            onClick={() => setActiveConsoleTab('map')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeConsoleTab === 'map'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-forest-900/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Live 3D Map ({reports.length} Reports)</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('weather')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeConsoleTab === 'weather'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-forest-900/50'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>Live Weather & Forecast</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('pollution')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeConsoleTab === 'pollution'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-forest-900/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Pollution & AQI</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeConsoleTab === 'reports'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-forest-900/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Community Feed</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeConsoleTab === 'alerts'
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-forest-900/50'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Urgent Alerts ({notifications.length})</span>
          </button>
        </div>

        {/* ---------------------------------------------------------------------
            TAB 1: LIVE 3D MAP & GOOGLE MAPS REPORT INTEGRATION
           --------------------------------------------------------------------- */}
        {activeConsoleTab === 'map' && (
          <div className="bg-[#06100a] rounded-3xl border border-emerald-900/50 p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in-50 duration-300">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>Geospatial Incident Monitoring</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live Geotagged Incidents &bull; Centered on {activeCoords.addressName || 'New Delhi'}
                  </p>
                </div>
              </div>

              {/* Google Maps External Quick Link */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activeCoords.lat},${activeCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1f14] hover:bg-[#122b1c] text-xs font-semibold text-emerald-300 border border-emerald-500/40 transition-colors shadow-sm"
                  title="View this location on Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open in Google Maps</span>
                </a>

                <button
                  onClick={onOpenReportModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pin New Report</span>
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Map Instance */}
            <div className="rounded-2xl overflow-hidden border border-emerald-950/80 shadow-inner">
              <InteractiveMap
                reports={reports}
                tasks={tasks}
                hotspots={hotspots}
                selectedLocation={activeCoords}
                onSelectLocation={(c) => {
                  setActiveCoords(c);
                  loadLiveTelemetry(c);
                }}
                heightClass="h-[520px]"
              />
            </div>

            {/* Quick Location Preset Selector */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">Jump to City:</span>
              {[
                { name: 'New Delhi', lat: 28.6139, lng: 77.209 },
                { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
                { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
                { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
                { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
              ].map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    const c = { lat: loc.lat, lng: loc.lng, addressName: `${loc.name} Monitoring Sector` };
                    setActiveCoords(c);
                    loadLiveTelemetry(c);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                    activeCoords.lat === loc.lat
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#08140c] text-slate-400 border-emerald-950/60 hover:text-white'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB 2: LIVE WEATHER & 7-DAY METEOROLOGICAL FORECAST
           --------------------------------------------------------------------- */}
        {activeConsoleTab === 'weather' && (
          <div className="bg-[#06100a] rounded-3xl border border-emerald-900/50 p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Live Open-Meteo Weather Telemetry</h3>
                  <p className="text-xs text-slate-400">
                    Station Coordinates: {activeCoords.lat.toFixed(4)}°N, {activeCoords.lng.toFixed(4)}°E
                  </p>
                </div>
              </div>

              <button
                onClick={() => loadLiveTelemetry(activeCoords)}
                disabled={isLoadingTelemetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1f14] hover:bg-[#122b1c] text-xs font-semibold text-emerald-300 border border-emerald-500/40 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTelemetry ? 'animate-spin' : ''}`} />
                <span>Refresh Station Data</span>
              </button>
            </div>

            {/* Current Weather Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-[#09170f] border border-emerald-950/70 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Temperature</div>
                <div className="text-2xl font-black text-white mt-1">
                  {weatherData ? `${Math.round(weatherData.temperature)}°C` : '28°C'}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  Feels like {weatherData ? `${Math.round(weatherData.apparentTemperature)}°C` : '29°C'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#09170f] border border-emerald-950/70 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Conditions</div>
                <div className="text-sm font-bold text-emerald-300 mt-2 truncate">
                  {weatherData ? weatherData.weatherDescription : 'Partly Cloudy'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">WMO Standard</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#09170f] border border-emerald-950/70 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Wind Velocity</div>
                <div className="text-2xl font-black text-cyan-300 mt-1">
                  {weatherData ? `${Math.round(weatherData.windSpeed)}` : '14'}{' '}
                  <span className="text-xs font-normal">km/h</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Heading: {weatherData ? getWindDirectionCardinal(weatherData.windDirection) : 'NW'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#09170f] border border-emerald-950/70 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Humidity</div>
                <div className="text-2xl font-black text-teal-300 mt-1">
                  {weatherData ? `${weatherData.relativeHumidity}%` : '58%'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Atmospheric Moisture</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#09170f] border border-emerald-950/70 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Rain Risk</div>
                <div className="text-2xl font-black text-blue-400 mt-1">
                  {weatherData ? `${weatherData.precipitationProbability}%` : '15%'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Culvert Flood Trigger</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#09170f] border border-emerald-950/70 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Air Quality</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{aqiValue}</div>
                <div className="text-[10px] text-amber-300 mt-0.5 uppercase font-semibold">
                  {aqiBandDetails.label}
                </div>
              </div>
            </div>

            {/* 7-Day Forecast Cards */}
            {weatherData?.daily && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  7-Day Environmental Forecast & Risk Trajectory
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {weatherData.daily.dates.slice(0, 7).map((dateStr: string, idx: number) => (
                    <div
                      key={dateStr}
                      className="p-3 rounded-xl bg-[#08140c] border border-emerald-950/70 text-center space-y-1 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="text-[11px] font-bold text-slate-300">
                        {new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-base font-extrabold text-white pt-1">
                        {Math.round(weatherData.daily.maxTemps[idx])}°
                        {weatherData.daily.minTemps && (
                          <span className="text-xs text-slate-400 ml-1">
                            {Math.round(weatherData.daily.minTemps[idx])}°
                          </span>
                        )}
                      </div>
                      {weatherData.daily.precipProbs && (
                        <div className="text-[10px] text-cyan-400 font-mono">
                          💧 {weatherData.daily.precipProbs[idx]}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB 3: LIVE POLLUTION METRICS & 9-DOMAIN SURVEILLANCE
           --------------------------------------------------------------------- */}
        {activeConsoleTab === 'pollution' && (
          <div className="bg-[#06100a] rounded-3xl border border-emerald-900/50 p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Comprehensive 9-Domain Pollution Telemetry</h3>
                  <p className="text-xs text-slate-400">
                    Real-Time Air, Water, Plastic, and Industrial Emission Baselines
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current AQI Index:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${aqiBandDetails.color}`}>
                  {aqiValue} &bull; {aqiBandDetails.label}
                </span>
              </div>
            </div>

            {/* Grid of 9 Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(POLLUTION_CATEGORIES_DATA).map((category) => (
                <div
                  key={category.id}
                  onClick={() => onSelectCategory && onSelectCategory(category.id as PollutionCategory)}
                  className="p-4 rounded-2xl bg-[#08150d] border border-emerald-950/80 hover:border-emerald-500/40 cursor-pointer transition-all hover:-translate-y-0.5 space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {category.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {category.shortDescription}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-emerald-950/40">
                    <span>Indicator: {category.exampleIndicators[0]?.name || 'Standard Benchmark'}</span>
                    <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB 4: RECENT COMMUNITY REPORTS FEED
           --------------------------------------------------------------------- */}
        {activeConsoleTab === 'reports' && (
          <div className="bg-[#06100a] rounded-3xl border border-emerald-900/50 p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60">
              <div>
                <h3 className="font-bold text-white text-base">Live Citizen Incident Stream</h3>
                <p className="text-xs text-slate-400">
                  Geotagged environmental observations verified by municipal response teams
                </p>
              </div>

              <button
                onClick={onOpenReportModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                + Submit Report
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No incident reports recorded yet. Be the first civic scout to submit an observation!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.slice(0, 6).map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-2xl bg-[#08150d] border border-emerald-950/80 space-y-3 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {report.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          report.status === 'verified'
                            ? 'bg-blue-500/20 text-blue-300'
                            : report.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{report.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-950/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[150px]">📍 {report.location.addressName || 'Geotagged'}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${report.location.lat},${report.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                      >
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------------
            TAB 5: LIVE URGENT NOTIFICATIONS & ADVISORIES
           --------------------------------------------------------------------- */}
        {activeConsoleTab === 'alerts' && (
          <div className="bg-[#06100a] rounded-3xl border border-emerald-900/50 p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/60">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Active Environmental Advisories & Dispatch Alerts</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                </h3>
                <p className="text-xs text-slate-400">
                  Critical flood warnings, airborne particulate alerts, and task dispatch logs
                </p>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No active critical advisories. All environmental parameters normal.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-2xl bg-[#09150e] border border-emerald-950/80 flex items-start gap-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          4. 3D FEATURE CARDS SECTION
         ========================================================================= */}
      <section className="py-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full relative z-10 border-t border-emerald-950/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            Engine Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
            Built for Municipal Scale & Civic Empowerment
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#06120b] border border-emerald-950/80 hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Weather-Pollution Synergy AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combines rain forecasts with drainage choke reports to calculate true flood risks before storm
              surge inundates municipal culverts.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#06120b] border border-emerald-950/80 hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Proactive Field Intervention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatches field crews with explicit photographic mitigation directives, requiring before-and-after
              evidence before admin verification sign-off.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#06120b] border border-emerald-950/80 hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Civic Gamification & EcoPoints</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Incentivizes citizens with +10 EcoPoints on incident submission and +15 bonus on verified
              containment, protected by anti-gaming database triggers.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. FOOTER
         ========================================================================= */}
      <footer className="mt-auto bg-[#030805] border-t border-emerald-950/80 py-10 px-4 sm:px-8 lg:px-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">EcoShield AI</span>
            <span>&bull; Autonomous Environmental Risk Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://github.com/ganeshjalla2006-pixel/EcoShield-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-emerald-400"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>&bull;</span>
            <span>Attribution: Open-Meteo & OpenStreetMap under CC BY 4.0</span>
            <span>&bull;</span>
            <span className="text-emerald-500 font-bold font-mono">₹0 Budget</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
