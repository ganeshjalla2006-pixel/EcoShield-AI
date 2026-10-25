import React, { useState, useMemo } from 'react';
import {
  Wind,
  Droplets,
  Globe,
  Volume2,
  Sun,
  Flame,
  Trash2,
  Radio,
  Eye,
  Search,
  Filter,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Activity,
  PlusCircle,
  FileText,
  Clock,
  Sparkles,
  Layers,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { PollutionCategory, PollutionReport, PreventionTask, RiskLevel } from '../../types';
import { POLLUTION_CATEGORIES_DATA, CategoryDetailInfo } from '../../data/pollutionCategoriesData';

interface PollutionCategoriesViewProps {
  reports: PollutionReport[];
  tasks: PreventionTask[];
  onInitiateReport: (category: PollutionCategory) => void;
  onViewTask: (task: PreventionTask) => void;
  initialCategory?: PollutionCategory | null;
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

export const PollutionCategoriesView: React.FC<PollutionCategoriesViewProps> = ({
  reports,
  tasks,
  onInitiateReport,
  onViewTask,
  initialCategory = null,
}) => {
  // State for active drill-down view (null = grid view)
  const [selectedCategory, setSelectedCategory] = useState<PollutionCategory | null>(initialCategory);

  React.useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Search & Filter states for the grid
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const allCategories: CategoryDetailInfo[] = useMemo(() => {
    return Object.values(POLLUTION_CATEGORIES_DATA);
  }, []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      // Risk filter
      if (riskFilter !== 'all' && cat.illustrativeRiskLevel !== riskFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesDesc = cat.shortDescription.toLowerCase().includes(q);
        const matchesSources = cat.mainSources.some((s) => s.toLowerCase().includes(q));
        const matchesCauses = cat.majorCauses.some((c) => c.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesSources || matchesCauses;
      }
      return true;
    });
  }, [allCategories, searchQuery, riskFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || riskFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setRiskFilter('all');
  };

  // Helper for Risk Level Badge Styling
  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          dot: 'bg-red-400',
          label: 'Critical Hazard (Illustrative)',
        };
      case 'high':
        return {
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          dot: 'bg-orange-400',
          label: 'High Risk (Illustrative)',
        };
      case 'moderate':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          label: 'Moderate (Illustrative)',
        };
      case 'low':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'Low / Managed (Illustrative)',
        };
    }
  };

  // ==========================================
  // VIEW: Category Detailed Breakdown View
  // ==========================================
  if (selectedCategory) {
    const detail = POLLUTION_CATEGORIES_DATA[selectedCategory];
    const Icon = CATEGORY_ICONS[selectedCategory];
    const riskBadge = getRiskBadge(detail.illustrativeRiskLevel);

    const categoryReports = reports.filter((r) => r.category === selectedCategory);
    const categoryTasks = tasks.filter((t) => t.category === selectedCategory);

    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Navigation Breadcrumb & Back Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b140f] border border-emerald-950/60 rounded-xl px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All 9 Categories</span>
            </button>
            <span className="text-emerald-950">&bull;</span>
            <span className="text-white font-medium">{detail.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onInitiateReport(selectedCategory)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log {detail.name} Incident</span>
            </button>
          </div>
        </div>

        {/* Hero Header Banner */}
        <div className="bg-[#09150e] border border-emerald-950/70 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-elevated">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-forest-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25">
                      Domain: {detail.id.toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${riskBadge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${riskBadge.dot}`}></span>
                      <span>{riskBadge.label}</span>
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                    {detail.name}
                  </h1>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {detail.tagline}
              </p>

              {/* Simple Definition Box */}
              <div className="p-3.5 rounded-xl bg-[#0e1a13] border border-emerald-950/80 text-xs text-slate-200 leading-relaxed">
                <span className="font-semibold text-emerald-400 block mb-1">Standard Definition:</span>
                <p>{detail.definition}</p>
              </div>
            </div>

            {/* Feasibility & Origin Badge Box */}
            <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-4 text-xs space-y-2 md:w-72 flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Telemetry Feasibility
              </span>
              <div className="font-semibold text-emerald-300 text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{detail.feasibilityLabel}</span>
              </div>
              <div className="pt-2 border-t border-emerald-950/60 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block mb-0.5">Primary Public Data Origin:</span>
                <p className="leading-snug text-slate-400">{detail.genuineDataOrigin}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Core Breakdown: Causes & Impacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Major Causes & Sources */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Major Causes & Upstream Sources</span>
            </h3>

            <div className="space-y-2 text-xs">
              {detail.majorCauses.map((cause, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e1a13] p-3 rounded-lg border border-emerald-950/70 flex items-start gap-2.5 text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5"></span>
                  <span className="leading-relaxed">{cause}</span>
                </div>
              ))}
            </div>

            {/* Main Sources Badges */}
            <div className="pt-3 border-t border-emerald-950/50">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                Primary Contamination Vectors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detail.mainSources.map((source, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#08120c] border border-emerald-950/60 text-slate-300 text-[11px]"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Environmental & Human Impacts */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              <span>Environmental & Human Health Impacts</span>
            </h3>

            <div className="space-y-3">
              {/* Environmental */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide block">
                  Ecosystem Consequences:
                </span>
                {detail.environmentalImpacts.map((imp, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0e1a13] p-2.5 rounded-lg border border-emerald-950/70 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-500 font-bold">&bull;</span>
                    <span className="leading-snug">{imp}</span>
                  </div>
                ))}
              </div>

              {/* Human Health */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wide block">
                  Public Health Hazards:
                </span>
                {detail.humanImpacts.map((imp, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0e1a13] p-2.5 rounded-lg border border-emerald-950/70 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-red-400 font-bold">&bull;</span>
                    <span className="leading-snug">{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column: Early Warning Signs & Prevention / Control */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Early Warning Signs */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Observable Early Warning Signs</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Field symptoms recognizable by community watchdogs and field inspectors:
            </p>

            <ul className="space-y-2 text-xs">
              {detail.earlyWarningSigns.map((sign, idx) => (
                <li
                  key={idx}
                  className="bg-[#0e1a13] p-3 rounded-lg border border-emerald-950/70 text-slate-300 flex items-start gap-2"
                >
                  <span className="text-blue-400 font-semibold mt-0.5">👁</span>
                  <span className="leading-relaxed">{sign}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prevention Methods & Control Measures */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Proactive Prevention & Control Measures</span>
            </h3>

            {/* Upstream Prevention */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide block">
                Upstream Prevention Strategies:
              </span>
              {detail.preventionMethods.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e1a13] p-2.5 rounded-lg border border-emerald-950/70 text-xs text-slate-300 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{m}</span>
                </div>
              ))}
            </div>

            {/* Downstream Practical Controls */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide block">
                Rapid Engineering Barriers & Controls:
              </span>
              {detail.controlMeasures.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e1a13] p-2.5 rounded-lg border border-emerald-950/70 text-xs text-slate-300 flex items-start gap-2"
                >
                  <span className="text-emerald-400 font-mono font-bold">&rarr;</span>
                  <span className="leading-snug">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Measurable Example Risk Indicators Table / Cards */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Illustrative Measurable Risk Indicators</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Empirical environmental science benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {detail.exampleIndicators.map((ind, idx) => (
              <div
                key={idx}
                className="bg-[#0e1a13] p-3.5 rounded-xl border border-emerald-950/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white">{ind.name}</span>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {ind.unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug mb-2">
                    {ind.description}
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-950/60 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Safety Threshold:</span>
                  <span className="font-mono font-semibold text-slate-200">{ind.benchmark}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Associated Prevention Tasks & Community Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Tasks in this category */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Active Prevention Tasks ({categoryTasks.length})</span>
              </h3>
            </div>

            {categoryTasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#0e1a13] rounded-lg border border-dashed border-emerald-950/80">
                No active prevention tasks currently dispatched for {detail.name}.
              </div>
            ) : (
              <div className="space-y-2">
                {categoryTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onViewTask(t)}
                    className="p-3 rounded-lg bg-[#0e1a13] border border-emerald-950/80 hover:border-emerald-500/30 transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-mono text-emerald-400">{t.id}</span>
                      <span className="capitalize text-slate-400">{t.status.replace('_', ' ')}</span>
                    </div>
                    <div className="font-semibold text-white truncate">{t.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Assigned: {t.assignedTo?.name || 'Field Unit'}</span>
                      <span className="text-emerald-400 font-medium">Inspect &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reports in this category */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Recent Observations ({categoryReports.length})</span>
              </h3>
            </div>

            {categoryReports.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#0e1a13] rounded-lg border border-dashed border-emerald-950/80">
                No community observations logged yet for {detail.name}.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {categoryReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg bg-[#0e1a13] border border-emerald-950/80 text-xs flex justify-between items-center"
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-slate-200 truncate">{r.title}</div>
                      <div className="text-[10px] text-slate-400">
                        Severity {r.severity}/5 &bull; {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#08120c] text-emerald-400 border border-emerald-950/60 flex-shrink-0">
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Data Honesty Disclaimer */}
        <div className="p-3.5 bg-[#08120c] rounded-xl border border-emerald-950/60 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200">Data Integrity & Transparency:</strong> The indicators and baseline
            hazard classifications displayed for {detail.name} represent educational environmental engineering benchmarks.
            Live sensor telemetry is only asserted where dedicated telemetry infrastructure (e.g. CPCB AQI or NANMS sound stations)
            is connected. Other categories require certified field inspections and laboratory assays.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: 9 Categories Responsive Grid View
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#09150e] border border-emerald-950/70 rounded-2xl p-6 sm:p-7 text-white shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25">
              Standardized Framework
            </span>
            <span className="text-xs text-slate-400">Comprehensive Environmental Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Nine Standardized Pollution Domains
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Explore dedicated prevention protocols, measurable indicators, early warning signs, and authentic data origins
            across each environmental risk category.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-slate-400 font-mono bg-[#0e1a13] px-3 py-1.5 rounded-xl border border-emerald-950/80">
            Showing <strong className="text-emerald-400">{filteredCategories.length}</strong> of 9 Domains
          </span>
        </div>
      </div>

      {/* Search and Risk Filter Bar */}
      <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories by name, sources, or causes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdown & Clear Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-1.5 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent font-semibold text-emerald-400 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b140f] text-slate-200">All Risk Levels</option>
              <option value="critical" className="bg-[#0b140f] text-red-400">🔴 Critical</option>
              <option value="high" className="bg-[#0b140f] text-orange-400">🟠 High</option>
              <option value="moderate" className="bg-[#0b140f] text-amber-400">🟡 Moderate</option>
              <option value="low" className="bg-[#0b140f] text-emerald-400">🟢 Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Category Cards (or Empty State) */}
      {filteredCategories.length === 0 ? (
        <div className="bg-[#0b140f] border border-dashed border-emerald-950/80 rounded-2xl p-10 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Matching Pollution Categories Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No category matched your search query "<span className="text-emerald-400">{searchQuery}</span>" or selected risk filter.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-[#0e1a13] hover:bg-[#13281c] text-emerald-400 border border-emerald-950/80 rounded-xl text-xs font-semibold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const riskBadge = getRiskBadge(cat.illustrativeRiskLevel);
            const reportCount = reports.filter((r) => r.category === cat.id).length;
            const taskCount = tasks.filter((t) => t.category === cat.id && t.status !== 'completed' && t.status !== 'verified').length;

            return (
              <div
                key={cat.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedCategory(cat.id);
                  }
                }}
                className="bg-[#0b140f] border border-emerald-950/60 hover:border-emerald-500/40 rounded-2xl p-5 shadow-sm hover:shadow-glow-green transition-all duration-200 flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-forest-900/90 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${riskBadge.bg}`}
                      >
                        <span className={`w-1 h-1 rounded-full ${riskBadge.dot}`}></span>
                        <span>{riskBadge.label}</span>
                      </span>

                      {taskCount > 0 && (
                        <span className="text-[9px] text-amber-400 font-mono font-semibold">
                          {taskCount} active task{taskCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Short Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mb-1.5">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                    {cat.shortDescription}
                  </p>

                  {/* Main Sources Tags */}
                  <div className="space-y-1 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Common Sources:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.mainSources.slice(0, 3).map((source, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#0e1a13] text-slate-300 text-[10px] border border-emerald-950/60"
                        >
                          {source}
                        </span>
                      ))}
                      {cat.mainSources.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[9px] text-slate-400">
                          +{cat.mainSources.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pt-3 border-t border-emerald-950/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {reportCount} observation{reportCount === 1 ? '' : 's'}
                  </span>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-1 text-emerald-400 group-hover:text-emerald-300 font-semibold group-hover:translate-x-0.5 transition-all focus:outline-none"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Honest Scientific Attribution Strip */}
      <div className="bg-[#08120c] border border-emerald-950/60 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="leading-snug">
          <strong className="text-slate-200">Data Integrity Principle:</strong> EcoShield AI strictly labels all
          baseline risk tiers as illustrative environmental engineering profiles. Actual risk calculation is executed
          only when genuine verified observations and live Open-Meteo telemetry converge in the AI Risk Engine.
        </div>
      </div>
    </div>
  );
};
