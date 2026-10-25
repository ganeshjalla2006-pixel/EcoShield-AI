import React, { useEffect, useState } from 'react';
import {
  Wind,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle2,
  ExternalLink,
  Layers,
  Activity,
  Droplets,
  Volume2,
  Flame,
  Sun,
  Trash2,
  Radio,
  Eye,
  Globe,
} from 'lucide-react';
import { Coordinates, VerifiedPollutionObservation, CategoryDataSourceStatus, PollutionCategory } from '../../types';
import {
  fetchVerifiedPollutionData,
  getAqiBandDetails,
  PollutionDataResponse,
} from '../../services/pollutionService';

interface VerifiedPollutionWidgetProps {
  coordinates: Coordinates;
  title?: string;
}

const CATEGORY_ICONS: Record<PollutionCategory, React.ComponentType<{ className?: string }>> = {
  air: Wind,
  water: Droplets,
  soil: Globe,
  noise: Volume2,
  light: Sun,
  thermal: Flame,
  plastic: Trash2,
  radioactive: Radio,
  visual: Eye,
};

export const VerifiedPollutionWidget: React.FC<VerifiedPollutionWidgetProps> = ({
  coordinates,
  title = 'Verified Environmental Observations & Public Sensor Assessment',
}) => {
  const [data, setData] = useState<PollutionDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'observations' | 'source_matrix'>('observations');

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchVerifiedPollutionData(coordinates, forceRefresh);
      setData(res);
    } catch (err: any) {
      console.warn('Verified pollution observation load error:', err);
      setError(err?.message || 'Unable to retrieve verified pollution observations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [coordinates.lat, coordinates.lng]);

  if (loading && !data) {
    return (
      <div className="bg-[#0b140f] rounded-2xl border border-emerald-950/60 p-5 shadow-elevated animate-pulse space-y-4">
        <div className="h-5 bg-forest-900/50 rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="h-20 bg-[#0e1a13] rounded-xl"></div>
          <div className="h-20 bg-[#0e1a13] rounded-xl"></div>
          <div className="h-20 bg-[#0e1a13] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-[#140b0b] border border-red-900/40 rounded-2xl p-5 text-xs text-red-200 shadow-elevated space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h4 className="font-bold text-sm text-red-300">Verified Pollution Telemetry Offline</h4>
          </div>
          <button
            onClick={() => loadData(true)}
            className="px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-[#0b140f] rounded-2xl border border-emerald-950/60 shadow-elevated overflow-hidden text-slate-200">
      {/* Top Banner */}
      <div className="bg-[#060e09] border-b border-emerald-950/60 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wide text-white">{title}</h3>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Copernicus CAMS</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {coordinates.lat.toFixed(4)}°N, {coordinates.lng.toFixed(4)}°E
            {coordinates.addressName ? ` • ${coordinates.addressName}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Sub-view switcher tabs */}
          <div className="flex items-center gap-1 bg-[#0e1d15] p-1 rounded-lg border border-emerald-950/80 text-xs">
            <button
              onClick={() => setActiveTab('observations')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'observations'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Air Observations ({data.observations.length})
            </button>
            <button
              onClick={() => setActiveTab('source_matrix')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'source_matrix'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 9 Domains Source Assessment
            </button>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={loading}
            title="Force refresh verified telemetry"
            className="p-1.5 rounded-lg bg-[#0e1d15] hover:bg-[#13281c] border border-emerald-950/80 transition-colors text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* TAB 1: Live Observations (Air Quality / Copernicus CAMS) */}
        {activeTab === 'observations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Attribution: {data.provider}</span>
              <span>Observed: {new Date(data.fetchedAt).toLocaleTimeString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.observations.map((obs) => {
                const bandInfo = obs.indexBand ? getAqiBandDetails(obs.indexBand) : null;
                return (
                  <div
                    key={obs.id}
                    className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{obs.indicator}</span>
                        {bandInfo && (
                          <span
                            className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded border ${bandInfo.bg}`}
                          >
                            {bandInfo.label}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-white tracking-tight">{obs.value}</span>
                        <span className="text-xs text-slate-400 font-mono">{obs.unit}</span>
                      </div>
                    </div>

                    <div className="border-t border-emerald-950/60 pt-2 text-[10px] space-y-1">
                      <div className="text-emerald-400/90 font-mono truncate">{obs.attribution}</div>
                      {obs.notes && <div className="text-slate-400 leading-snug">{obs.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scientific Transparency Notice */}
            <div className="p-3 bg-[#08120c] rounded-xl border border-emerald-950/60 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-slate-200">Data Provenance Standards:</span> Observations are
                ingested from European Copernicus Atmosphere Monitoring Service (CAMS) assimilation grids via Open-Meteo under CC BY 4.0.
                Data reflects genuine atmospheric monitoring and is never synthetically invented.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: All 9 Categories Data Source Assessment */}
        {activeTab === 'source_matrix' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong>Public Environmental Monitoring Assessment:</strong> Review of open public data availability across all 9
              standardized environmental hazard domains. EcoShield AI enforces strict scientific honesty and does not fabricate
              artificial sensor telemetry for categories lacking continuous public APIs.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.sourceStatuses.map((src) => {
                const IconComponent = CATEGORY_ICONS[src.category] || Activity;
                return (
                  <div
                    key={src.category}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                      src.isLiveTelemetryAvailable
                        ? 'bg-[#0e1a13] border-emerald-500/40'
                        : 'bg-[#08120c] border-emerald-950/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 capitalize">
                          <IconComponent className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{src.categoryName}</span>
                        </span>
                        {src.isLiveTelemetryAvailable ? (
                          <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                            Verified Live API
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded">
                            Field Inspection Needed
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {src.statusMessage}
                      </p>
                    </div>

                    <div className="border-t border-emerald-950/50 pt-2 text-[10px] space-y-1 text-slate-400">
                      <div><strong className="text-slate-300">Provider:</strong> {src.providerName}</div>
                      <div><strong className="text-slate-300">Prerequisite:</strong> {src.accessPrerequisites}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
