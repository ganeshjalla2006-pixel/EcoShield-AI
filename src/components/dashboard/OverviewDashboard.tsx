import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Wind,
  Droplet,
  Trash2,
  Plus,
  Sliders,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';
import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  Coordinates,
} from '../../types';
import { WeatherStationWidget } from '../weather/WeatherStationWidget';
import { InteractiveMap } from '../map/InteractiveMap';

interface OverviewDashboardProps {
  reports: PollutionReport[];
  tasks: PreventionTask[];
  hotspots: EnvironmentalHotspot[];
  currentLocation: Coordinates;
  onNavigateToView: (view: any) => void;
  onSelectReport: (report: PollutionReport) => void;
  onSelectHotspot: (hotspot: EnvironmentalHotspot) => void;
  onOpenReportModal?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  reports,
  tasks,
  hotspots,
  currentLocation,
  onNavigateToView,
  onSelectReport,
  onSelectHotspot,
  onOpenReportModal,
}) => {
  const criticalReports = reports.filter((r) => r.severity >= 4);
  const urgentTasks = tasks.filter((t) => t.priority === 'critical' || t.priority === 'high');
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'verified');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Heading & Environmental Intelligence Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[#09150e] border border-emerald-950/70 p-6 sm:p-8 text-white shadow-elevated">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Telemetry</span>
              </span>
              <span className="text-xs text-slate-400 font-medium tracking-wide">
                Predict Pollution. Prevent Before It Happens.
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Environmental Intelligence
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              EcoShield AI evaluates multi-source meteorological forecasts and geotagged community observations
              to trigger proactive preventive interventions before preventable environmental damage strikes ecosystems.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              onClick={() => {
                if (onOpenReportModal) onOpenReportModal();
                else onNavigateToView('citizen_portal');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow-glow-green"
            >
              <Plus className="w-4 h-4" />
              <span>Log Observation</span>
            </button>

            <button
              onClick={() => onNavigateToView('risk_center')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e1d15] hover:bg-[#13281c] text-slate-200 rounded-xl text-xs font-medium border border-emerald-950/80 transition-colors"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>What-If Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clean Minimal Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Critical Hazards */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
              High-Risk Incidents
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {criticalReports.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-red-400 font-semibold">Severity 4-5</span>
            <span>&bull; Requiring immediate dispatch</span>
          </div>
        </div>

        {/* Card 2: Active Tasks */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
              Dispatched Tasks
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {urgentTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-amber-400 font-semibold">Field units active</span>
            <span>&bull; Approaching rain window</span>
          </div>
        </div>

        {/* Card 3: Monitored Hotspots */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
              Vulnerable Hotspots
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {hotspots.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Geotagged</span>
            <span>&bull; Drainage & outfall zones</span>
          </div>
        </div>

        {/* Card 4: Completed Mitigations */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
              Verified Actions
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {completedTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Signed off</span>
            <span>&bull; With before/after proof</span>
          </div>
        </div>
      </div>

      {/* Live Weather Telemetry (Open-Meteo Integration) */}
      <WeatherStationWidget coordinates={currentLocation} />

      {/* Two-Column Core Layout: Spatial Map & Priority Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Spatial Map Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Live Geospatial Risk Map
              </h2>
            </div>
            <button
              onClick={() => onNavigateToView('live_map')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Full Screen View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <InteractiveMap
            reports={reports}
            tasks={tasks}
            hotspots={hotspots}
            selectedLocation={currentLocation}
            onSelectReport={onSelectReport}
            onSelectHotspot={onSelectHotspot}
            onNavigateToTasks={() => onNavigateToView('prevention_tasks')}
            onNavigateToReports={() => onNavigateToView('citizen_portal')}
          />
        </div>

        {/* Right: Priority Prevention Queue (4 cols) */}
        <div className="lg:col-span-4 bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-950/50 pb-3 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Incident Action Queue
                </h3>
                <span className="text-[10px] text-slate-400">Prioritized by explainable AI risk</span>
              </div>
              <button
                onClick={() => onNavigateToView('prevention_tasks')}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                All ({tasks.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {urgentTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onNavigateToView('prevention_tasks')}
                  className="p-3 rounded-lg bg-[#0e1a13] border border-emerald-950/80 hover:border-emerald-500/30 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        t.priority === 'critical'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {t.priority} Risk ({t.riskScore}/100)
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white line-clamp-1 mb-1">{t.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                  <div className="mt-2 pt-2 border-t border-emerald-950/40 text-[10px] text-slate-400 flex justify-between items-center">
                    <span>Unit: {t.assignedTo?.name || 'Unassigned'}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <span>Dispatch</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 9 Pollution Categories Quick Strip */}
          <div className="pt-3 border-t border-emerald-950/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              9 Standardized Domains
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['plastic', 'water', 'air', 'soil', 'noise', 'thermal', 'light', 'radioactive', 'visual'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => onNavigateToView('categories')}
                  className="px-2 py-0.5 rounded bg-[#0e1a13] text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 border border-emerald-950/60 text-[10px] font-mono capitalize transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
