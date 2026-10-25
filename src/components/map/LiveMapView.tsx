import React, { useState } from 'react';
import {
  Compass,
  Cloud,
  ShieldAlert,
  Wind,
  Droplets,
  Thermometer,
  Layers,
  ArrowRight,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCheck,
  Eye,
  ExternalLink,
  Plus,
} from 'lucide-react';
import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  Coordinates,
  PollutionCategory,
  WeatherData,
} from '../../types';
import { InteractiveMap } from './InteractiveMap';
import { WeatherStationWidget } from '../weather/WeatherStationWidget';
import { VerifiedPollutionWidget } from '../weather/VerifiedPollutionWidget';
import { EnvironmentalRiskEngine, RISK_SCORE_BANDS } from '../../services/riskEngine';

interface LiveMapViewProps {
  reports: PollutionReport[];
  tasks: PreventionTask[];
  hotspots: EnvironmentalHotspot[];
  userLocation: Coordinates;
  userRole?: string;
  onSelectLocation: (coords: Coordinates) => void;
  onSelectReport: (report: PollutionReport) => void;
  onSelectHotspot: (hotspot: EnvironmentalHotspot) => void;
  onAddNewHotspot?: (hotspot: Omit<EnvironmentalHotspot, 'id'>) => void;
  onNavigateToTasks: () => void;
  onNavigateToCitizenPortal: () => void;
  onOpenReportModal?: () => void;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  reports,
  tasks,
  hotspots,
  userLocation,
  userRole,
  onSelectLocation,
  onSelectReport,
  onSelectHotspot,
  onAddNewHotspot,
  onNavigateToTasks,
  onNavigateToCitizenPortal,
  onOpenReportModal,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<
    | { type: 'report'; data: PollutionReport }
    | { type: 'task'; data: PreventionTask }
    | { type: 'hotspot'; data: EnvironmentalHotspot }
    | null
  >(null);

  const [activeWeatherCategory, setActiveWeatherCategory] = useState<PollutionCategory>('plastic');
  const [currentWeatherData, setCurrentWeatherData] = useState<WeatherData | null>(null);

  // Compute live weather-aware risk assessment for selected coordinates
  const weatherRiskAssessment = EnvironmentalRiskEngine.assessRisk({
    category: activeWeatherCategory,
    reportedSeverity: selectedEntity?.type === 'report' ? selectedEntity.data.severity : 3,
    coordinates: userLocation,
    weather: currentWeatherData,
    hasVerifiedEvidence: selectedEntity?.type === 'report' ? selectedEntity.data.status === 'verified' : false,
    isRecurringHotspot: selectedEntity?.type === 'hotspot',
    title: selectedEntity ? (selectedEntity.data as any).title || (selectedEntity.data as any).name : undefined,
  });

  const riskBand = RISK_SCORE_BANDS[weatherRiskAssessment.level];

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Top Banner with Coordinates, Providers & Operational Disclaimers */}
      <div className="bg-[#09150e] border border-emerald-950/70 rounded-2xl p-5 sm:p-6 text-white shadow-elevated">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>OpenStreetMap + Open-Meteo Integration</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Zero-Cost • No API Keys Required • CC BY 4.0 Fair Use
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-emerald-400" />
              <span>Live Geospatial Risk Map & Meteorological Telemetry</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Real-time spatial visualization correlating verified community observations, prevention dispatch
              assignments, and deterministic weather forecasts to predict pollution propagation before runoff or atmospheric dispersion occurs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Observation Here</span>
              </button>
            )}

            <button
              onClick={onNavigateToTasks}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0e1d15] hover:bg-[#13281c] text-slate-200 border border-emerald-950/80 rounded-xl text-xs font-medium transition-colors"
            >
              <span>Prevention Tasks ({tasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: 7-8 Cols Map + 5-4 Cols Live Telemetry & Risk Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Left Column: Leaflet Interactive Map (8 cols on xl, 7 on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 min-w-0 space-y-4">
          <InteractiveMap
            reports={reports}
            tasks={tasks}
            hotspots={hotspots}
            selectedLocation={userLocation}
            userRole={userRole}
            heightClass="h-[640px]"
            onSelectLocation={(coords) => onSelectLocation(coords)}
            onSelectReport={(rep) => {
              setSelectedEntity({ type: 'report', data: rep });
              setActiveWeatherCategory(rep.category);
              onSelectReport(rep);
            }}
            onSelectTask={(tsk) => {
              setSelectedEntity({ type: 'task', data: tsk });
              setActiveWeatherCategory(tsk.category);
            }}
            onSelectHotspot={(spot) => {
              setSelectedEntity({ type: 'hotspot', data: spot });
              setActiveWeatherCategory(spot.category);
              onSelectHotspot(spot);
            }}
            onAddNewHotspot={onAddNewHotspot}
            onNavigateToTasks={onNavigateToTasks}
            onNavigateToReports={onNavigateToCitizenPortal}
          />

          {/* Quick Notice under map */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-500" />
              <span>Click anywhere on the map or use the search bar to evaluate weather & risk for that specific coordinate.</span>
            </span>
            <span className="font-mono text-emerald-400">
              Active: {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E
            </span>
          </div>
        </div>

        {/* Right Column: Live Open-Meteo Weather + Verified Pollution Telemetry + Risk Engine Preview (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 min-w-0 space-y-5">
          {/* 1. Live Open-Meteo Weather & 7-Day Outlook Widget */}
          <WeatherStationWidget
            coordinates={userLocation}
            onWeatherDataLoaded={(data) => setCurrentWeatherData(data)}
            compact={false}
            inSidebar={true}
          />

          {/* 2. Verified Environmental Observations & 9-Category Source Assessment */}
          <VerifiedPollutionWidget
            coordinates={userLocation}
          />

          {/* 3. Weather-Aware Risk Assessment Preview Engine */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-5 shadow-elevated space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Weather-Aware Risk Engine</h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${riskBand.badgeBg}`}
              >
                {riskBand.label} ({weatherRiskAssessment.score}/100)
              </span>
            </div>

            {/* Category Synergy Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Evaluate Meteorological Synergy by Domain:
              </label>
              <select
                value={activeWeatherCategory}
                onChange={(e: any) => setActiveWeatherCategory(e.target.value)}
                className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="plastic">Plastic & Solid Waste (Runoff & Culvert Choking)</option>
                <option value="water">Water Contamination (Rainfall Wash-off)</option>
                <option value="air">Air Pollution (Wind Dispersion & Inversion)</option>
                <option value="soil">Soil Contamination (Groundwater Leaching)</option>
                <option value="thermal">Thermal Pollution (Heatwave DO Depletion)</option>
                <option value="noise">Noise Decibels (Atmospheric Propagation)</option>
                <option value="light">Light Pollution (Skyglow on Clear Nights)</option>
                <option value="radioactive">Radioactive Hazard (Wind Drift)</option>
                <option value="visual">Visual Blight (Debris Migration)</option>
              </select>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Deterministic Risk Score</span>
                <span className="font-mono font-bold text-white">{weatherRiskAssessment.score} / 100</span>
              </div>
              <div className="w-full bg-[#08120c] h-2.5 rounded-full overflow-hidden border border-emerald-950/60">
                <div
                  className={`h-full transition-all duration-500 ${
                    weatherRiskAssessment.score >= 75
                      ? 'bg-red-500'
                      : weatherRiskAssessment.score >= 50
                      ? 'bg-orange-500'
                      : weatherRiskAssessment.score >= 25
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${weatherRiskAssessment.score}%` }}
                />
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#0e1a13] border border-emerald-950/60 rounded-xl p-2.5">
                <span className="text-slate-400 block text-[10px]">Baseline Hazard</span>
                <span className="font-bold text-white text-xs">
                  {weatherRiskAssessment.factorBreakdown.categoryBaseline} / 25
                </span>
              </div>
              <div className="bg-[#0e1a13] border border-emerald-950/60 rounded-xl p-2.5">
                <span className="text-slate-400 block text-[10px]">Reported Severity</span>
                <span className="font-bold text-white text-xs">
                  {weatherRiskAssessment.factorBreakdown.reportedSeverity} / 30
                </span>
              </div>
              <div className="bg-[#0e1a13] border border-emerald-950/60 rounded-xl p-2.5">
                <span className="text-slate-400 block text-[10px]">Weather Multiplier</span>
                <span className="font-bold text-emerald-400 text-xs">
                  +{weatherRiskAssessment.factorBreakdown.weatherMultiplier} / 20
                </span>
              </div>
              <div className="bg-[#0e1a13] border border-emerald-950/60 rounded-xl p-2.5">
                <span className="text-slate-400 block text-[10px]">Evidence Confidence</span>
                <span className="font-bold text-white text-xs">
                  {weatherRiskAssessment.factorBreakdown.evidenceConfidence} / 15
                </span>
              </div>
            </div>

            {/* Explainable Insights */}
            <div className="space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-300 block">Meteorological Rationale:</span>
              <ul className="space-y-1 text-slate-400">
                {weatherRiskAssessment.explanations.slice(0, 2).map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Action */}
            <div className="p-3 bg-[#08120c] rounded-xl border border-emerald-950/60 text-xs">
              <span className="font-semibold text-emerald-400 block mb-1">
                Proactive Preventive Measure:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {weatherRiskAssessment.recommendedActions[0] ||
                  'Maintain standard monitoring cordon before weather front passage.'}
              </p>
            </div>

            <div className="text-[10px] text-slate-500 leading-tight border-t border-emerald-950/40 pt-2">
              Rule set version: <span className="font-mono text-slate-400">{weatherRiskAssessment.ruleSetVersion}</span>.
              Calculations are estimates based on deterministic rules and not official hazard decrees.
            </div>
          </div>

          {/* 3. Selected Entity Details Drawer (if user clicked a pin) */}
          {selectedEntity && (
            <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-5 shadow-elevated text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-950/60 pb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Selected Map Marker
                </span>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  Clear Selection
                </button>
              </div>

              {selectedEntity.type === 'report' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm line-clamp-1">
                      {selectedEntity.data.title}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 uppercase">
                      {selectedEntity.data.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">
                    {selectedEntity.data.description}
                  </p>
                  <div className="pt-2 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">
                      Severity: <strong className="text-white">{selectedEntity.data.severity}/5</strong>
                    </span>
                    <button
                      onClick={onNavigateToCitizenPortal}
                      className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>View in Citizen Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {selectedEntity.type === 'task' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm line-clamp-1">
                      {selectedEntity.data.title}
                    </span>
                    <span className="text-[10px] font-mono text-sky-400 uppercase">
                      {selectedEntity.data.priority}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">
                    {selectedEntity.data.description}
                  </p>
                  <div className="pt-2 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">
                      Assigned: <strong className="text-white">{selectedEntity.data.assignedTo?.name || 'Unassigned'}</strong>
                    </span>
                    <button
                      onClick={onNavigateToTasks}
                      className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Open Command Center</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {selectedEntity.type === 'hotspot' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm line-clamp-1">
                      {selectedEntity.data.name}
                    </span>
                    <span className="text-[10px] font-mono text-red-400 uppercase">
                      {selectedEntity.data.currentRiskLevel}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">
                    {selectedEntity.data.description}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400">
                    Linked reports: <strong className="text-white">{selectedEntity.data.activeReportsCount}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
