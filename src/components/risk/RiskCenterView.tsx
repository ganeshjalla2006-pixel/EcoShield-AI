import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Zap,
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
  Clock,
  ArrowRight,
  CheckCircle2,
  Info,
  PlusCircle,
  Sparkles,
  MapPin,
  Activity,
  FileText,
  Check,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  PollutionCategory,
  RiskLevel,
  TaskPriority,
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  Coordinates,
  UserProfile,
  RiskAssessment,
  SimulationInputs,
  SimulationResult,
  WeatherData,
} from '../../types';
import {
  EnvironmentalRiskEngine,
  CATEGORY_BASELINE_WEIGHTS,
  CATEGORY_METADATA,
  RISK_SCORE_BANDS,
  getRiskLevelFromScore,
  getResponseTimeframeFromScore,
} from '../../services/riskEngine';
import { fetchLiveWeatherData } from '../../services/weatherService';

interface RiskCenterViewProps {
  reports: PollutionReport[];
  tasks: PreventionTask[];
  hotspots?: EnvironmentalHotspot[];
  currentLocation?: Coordinates;
  currentUser?: UserProfile;
  onCreateTask?: (task: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => void;
  onNavigateToTasks?: () => void;
  onInitiateReport?: (category: PollutionCategory) => void;
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

export const RiskCenterView: React.FC<RiskCenterViewProps> = ({
  reports,
  tasks,
  hotspots = [],
  currentLocation = { lat: 28.6139, lng: 77.2090, addressName: 'Connaught Place, New Delhi' },
  currentUser,
  onCreateTask,
  onNavigateToTasks,
  onInitiateReport,
}) => {
  // Navigation Tabs within Risk Center
  const [activeTab, setActiveTab] = useState<'assessments' | 'simulator' | 'methodology'>('assessments');

  // Weather telemetry state
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(true);

  // Filters for Active Assessments
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'highest_risk' | 'lowest_risk' | 'newest'>('highest_risk');

  // Task creation quick modal state
  const [dispatchingAssessment, setDispatchingAssessment] = useState<RiskAssessment | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskDeadlineHours, setTaskDeadlineHours] = useState<number>(24);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // What-If Simulator Interactive State
  const [simInputs, setSimInputs] = useState<SimulationInputs>({
    category: 'plastic',
    reportedSeverity: 4,
    rainfallAmountMm: 22,
    drainageCleared: false,
    wasteAccumulationLevel: 4,
    windSpeedKmh: 12,
    temperatureC: 28,
    daysSinceLastInspection: 10,
  });

  // Fetch live weather data safely on mount
  useEffect(() => {
    let isMounted = true;
    setIsWeatherLoading(true);

    fetchLiveWeatherData(currentLocation)
      .then((data) => {
        if (isMounted) {
          setLiveWeather(data);
          setIsWeatherLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsWeatherLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentLocation.lat, currentLocation.lng]);

  // Compute Risk Assessments for all active reports & hotspots
  const allAssessments: RiskAssessment[] = useMemo(() => {
    const list: RiskAssessment[] = [];

    // 1. Assess all active reports
    reports.forEach((rep) => {
      const assessment = EnvironmentalRiskEngine.assessRisk({
        category: rep.category,
        reportedSeverity: rep.severity,
        coordinates: rep.location,
        hasVerifiedEvidence: Boolean(rep.verifiedBy || rep.evidenceUrl || rep.status === 'verified'),
        weather: liveWeather,
        isRecurringHotspot: hotspots.some((h) => h.category === rep.category),
        daysSinceInspection: 3,
        title: rep.title,
      });

      // Link back report id and custom title
      assessment.reportId = rep.id;
      list.push(assessment);
    });

    // 2. Assess hotspots that don't have direct reports
    hotspots.forEach((spot) => {
      const alreadyCovered = reports.some((r) => r.category === spot.category && r.location.addressName === spot.coordinates.addressName);
      if (!alreadyCovered) {
        const assessment = EnvironmentalRiskEngine.assessRisk({
          category: spot.category,
          reportedSeverity: 4,
          coordinates: spot.coordinates,
          hasVerifiedEvidence: true,
          weather: liveWeather,
          isRecurringHotspot: true,
          daysSinceInspection: 8,
          title: spot.name,
        });
        list.push(assessment);
      }
    });

    return list;
  }, [reports, hotspots, liveWeather]);

  // Summary counts across all 4 standardized score bands
  const riskCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, moderate: 0, low: 0, total: allAssessments.length };
    allAssessments.forEach((a) => {
      if (a.level in counts) {
        counts[a.level as keyof typeof counts]++;
      }
    });
    return counts;
  }, [allAssessments]);

  // Average platform environmental risk score
  const averageRiskScore = useMemo(() => {
    if (!allAssessments.length) return 0;
    const sum = allAssessments.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / allAssessments.length);
  }, [allAssessments]);

  // Filtered & Sorted Assessments
  const filteredAssessments = useMemo(() => {
    return allAssessments
      .filter((a) => {
        // Category filter
        if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
        // Risk level filter
        if (riskLevelFilter !== 'all' && a.level !== riskLevelFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = (a.title || '').toLowerCase().includes(q);
          const matchesCategory = a.category.toLowerCase().includes(q);
          const matchesLocation = (a.coordinates.addressName || '').toLowerCase().includes(q);
          const matchesExplanation = a.explanations.some((exp) => exp.toLowerCase().includes(q));
          return matchesTitle || matchesCategory || matchesLocation || matchesExplanation;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_risk') return b.score - a.score;
        if (sortBy === 'lowest_risk') return a.score - b.score;
        return new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime();
      });
  }, [allAssessments, categoryFilter, riskLevelFilter, searchQuery, sortBy]);

  // Highest Priority Risks (Critical band >= 75)
  const criticalPriorityRisks = useMemo(() => {
    return allAssessments.filter((a) => a.level === 'critical');
  }, [allAssessments]);

  // What-If Simulator Result
  const simResult: SimulationResult = useMemo(() => {
    return EnvironmentalRiskEngine.simulateScenario(simInputs);
  }, [simInputs]);

  // Reset simulator to baseline mitigation preset
  const handleResetSimDefaults = () => {
    setSimInputs({
      category: 'plastic',
      reportedSeverity: 4,
      rainfallAmountMm: 0,
      drainageCleared: true,
      wasteAccumulationLevel: 2,
      windSpeedKmh: 10,
      temperatureC: 24,
      daysSinceLastInspection: 2,
    });
  };

  // Open Task Dispatch Modal
  const handleOpenDispatchModal = (assessment: RiskAssessment) => {
    setDispatchingAssessment(assessment);
    setTaskTitle(`Preventive Mitigation: ${assessment.title || assessment.category.toUpperCase()}`);
    setTaskDescription(
      `Dispatched by AI Risk Center based on ${assessment.level.toUpperCase()} risk evaluation (${assessment.score}/100).\nRecommended Action: ${
        assessment.recommendedActions[0] || 'Perform immediate field containment.'
      }`
    );
    setTaskDeadlineHours(assessment.level === 'critical' ? 4 : assessment.level === 'high' ? 24 : 72);
  };

  // Submit Dispatched Task
  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingAssessment || !onCreateTask) return;

    const deadlineDate = new Date();
    deadlineDate.setHours(deadlineDate.getHours() + taskDeadlineHours);

    onCreateTask({
      reportId: dispatchingAssessment.reportId,
      title: taskTitle,
      description: taskDescription,
      category: dispatchingAssessment.category,
      priority: dispatchingAssessment.responsePriority,
      status: 'assigned',
      location: dispatchingAssessment.coordinates,
      riskScore: dispatchingAssessment.score,
      riskLevel: dispatchingAssessment.level,
      deadline: deadlineDate.toISOString(),
      assignedTo: {
        id: currentUser?.id || 'officer_rapid_01',
        name: currentUser?.displayName || 'Rajesh Kumar (Field Officer)',
        role: 'field_worker',
      },
    });

    setDispatchSuccessMsg(`Task successfully assigned to field units with a ${taskDeadlineHours}-hour response window.`);
    setTimeout(() => {
      setDispatchSuccessMsg(null);
      setDispatchingAssessment(null);
    }, 2000);
  };

  // Check if a risk assessment already has an active task
  const getLinkedTask = (assessment: RiskAssessment) => {
    if (assessment.reportId) {
      return tasks.find((t) => t.reportId === assessment.reportId);
    }
    return tasks.find(
      (t) =>
        t.category === assessment.category &&
        (t.location.addressName === assessment.coordinates.addressName ||
          (Math.abs(t.location.lat - assessment.coordinates.lat) < 0.005 &&
            Math.abs(t.location.lng - assessment.coordinates.lng) < 0.005))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner & Context Summary Bar */}
      <div className="bg-[#09150e] border border-emerald-950/70 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-elevated">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deterministic Risk Assessment Engine v1.4</span>
              </span>

              {/* Weather Telemetry Source Badge */}
              <span className="text-[10px] font-mono text-slate-300 bg-slate-800/60 px-2.5 py-0.5 rounded border border-slate-700/50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>
                  Telemetry:{' '}
                  {isWeatherLoading
                    ? 'Syncing Open-Meteo...'
                    : liveWeather
                    ? `${liveWeather.temperature}°C, ${liveWeather.precipitation}mm rain, ${liveWeather.windSpeed}km/h wind`
                    : 'Standard Baseline Neutral Weather'}
                </span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Risk Center & Preventive Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Calculates explainable risk scores (0–100) combining observed physical severity with live meteorological
              telemetry across all 9 standardized pollution categories.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-3.5 min-w-[120px] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Overall Index</span>
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                <span className={averageRiskScore >= 75 ? 'text-red-400' : averageRiskScore >= 50 ? 'text-orange-400' : 'text-emerald-400'}>
                  {averageRiskScore}
                </span>
                <span className="text-xs font-normal text-slate-500">/100</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {getRiskLevelFromScore(averageRiskScore).toUpperCase()} RISK
              </span>
            </div>

            <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-3.5 min-w-[120px] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Critical Alerts</span>
              <div className="text-2xl font-black text-red-400 flex items-center justify-center gap-1">
                <span>{riskCounts.critical}</span>
                <span className="text-xs font-normal text-slate-500">active</span>
              </div>
              <span className="text-[10px] text-red-300/80 font-medium">&lt; 4h Response Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-950/60 pb-3">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
            activeTab === 'assessments'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white bg-[#0b140f] hover:bg-[#0e1a13] border border-emerald-950/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Risk Assessments & Prevention Actions ({allAssessments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
            activeTab === 'simulator'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white bg-[#0b140f] hover:bg-[#0e1a13] border border-emerald-950/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Interactive What-If Scenario Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('methodology')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
            activeTab === 'methodology'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white bg-[#0b140f] hover:bg-[#0e1a13] border border-emerald-950/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Scoring Engine Transparency & AI Ethics</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: ACTIVE RISK ASSESSMENTS & PREVENTION ACTIONS */}
      {/* ========================================================== */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          {/* Critical Emergency Banner (if any Critical risks exist) */}
          {criticalPriorityRisks.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 sm:p-5 text-red-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Highest-Priority Risk Notice: {criticalPriorityRisks.length} Critical Hazards</span>
                      <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                        Immediate Action (&lt; 4 Hours)
                      </span>
                    </h3>
                    <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
                      Severe synergy identified between environmental debris and weather forecast. Culvert obstruction
                      or hazardous dispersion presents imminent public risk.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRiskLevelFilter('critical');
                    setCategoryFilter('all');
                  }}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 self-start sm:self-auto"
                >
                  Filter {criticalPriorityRisks.length} Critical Risks
                </button>
              </div>
            </div>
          )}

          {/* Score Band Filter Cards (Interactive Counts) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Critical Card */}
            <button
              onClick={() => setRiskLevelFilter(riskLevelFilter === 'critical' ? 'all' : 'critical')}
              className={`p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-1 focus:ring-red-500 ${
                riskLevelFilter === 'critical'
                  ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500'
                  : 'bg-[#0b140f] border-emerald-950/60 hover:border-red-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  <span>Critical (75–100)</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{riskCounts.critical}</span>
              </div>
              <p className="text-[10px] text-slate-400">&lt; 4h Emergency Dispatch</p>
            </button>

            {/* High Card */}
            <button
              onClick={() => setRiskLevelFilter(riskLevelFilter === 'high' ? 'all' : 'high')}
              className={`p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                riskLevelFilter === 'high'
                  ? 'bg-orange-950/40 border-orange-500/60 ring-1 ring-orange-500'
                  : 'bg-[#0b140f] border-emerald-950/60 hover:border-orange-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  <span>High (50–74)</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{riskCounts.high}</span>
              </div>
              <p className="text-[10px] text-slate-400">&lt; 24h Rapid Mitigation</p>
            </button>

            {/* Moderate Card */}
            <button
              onClick={() => setRiskLevelFilter(riskLevelFilter === 'moderate' ? 'all' : 'moderate')}
              className={`p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                riskLevelFilter === 'moderate'
                  ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500'
                  : 'bg-[#0b140f] border-emerald-950/60 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Moderate (25–49)</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{riskCounts.moderate}</span>
              </div>
              <p className="text-[10px] text-slate-400">&lt; 72h Planned Action</p>
            </button>

            {/* Low Card */}
            <button
              onClick={() => setRiskLevelFilter(riskLevelFilter === 'low' ? 'all' : 'low')}
              className={`p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                riskLevelFilter === 'low'
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500'
                  : 'bg-[#0b140f] border-emerald-950/60 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Low (0–24)</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{riskCounts.low}</span>
              </div>
              <p className="text-[10px] text-slate-400">&lt; 7d Routine Audit</p>
            </button>
          </div>

          {/* Filter, Search, and Sort Bar */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search assessments by location, title, or contributing factors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All 9 Pollution Categories</option>
                <option value="air">Air Pollution</option>
                <option value="water">Water Pollution</option>
                <option value="soil">Soil Pollution</option>
                <option value="noise">Noise Pollution</option>
                <option value="light">Light Pollution</option>
                <option value="thermal">Thermal Pollution</option>
                <option value="plastic">Plastic Pollution</option>
                <option value="radioactive">Radioactive Pollution</option>
                <option value="visual">Visual Pollution</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="highest_risk">Sort: Highest Score First</option>
                <option value="lowest_risk">Sort: Lowest Score First</option>
                <option value="newest">Sort: Most Recent</option>
              </select>

              {/* Clear Filter Button */}
              {(categoryFilter !== 'all' || riskLevelFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setRiskLevelFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Assessment Cards Grid */}
          {filteredAssessments.length === 0 ? (
            <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Matching Risk Assessments Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active environmental evaluations match your current category and risk band filters.
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setRiskLevelFilter('all');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredAssessments.map((assessment) => {
                const Icon = CATEGORY_ICONS[assessment.category] || Activity;
                const band = RISK_SCORE_BANDS[assessment.level];
                const linkedTask = getLinkedTask(assessment);

                return (
                  <div
                    key={assessment.id}
                    className="bg-[#0b140f] border border-emerald-950/70 hover:border-emerald-500/40 rounded-xl p-5 space-y-4 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header: Category, Code, Score & Level Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#08120c] border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                                {assessment.category.toUpperCase()}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${band.badgeBg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${band.dotColor}`}></span>
                                <span>
                                  {band.label.toUpperCase()} ({assessment.score}/100)
                                </span>
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                              {assessment.title || `${assessment.category} Risk Evaluation`}
                            </h3>
                          </div>
                        </div>

                        {/* Normalized Score Circle/Badge */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-xl font-black ${
                              assessment.level === 'critical'
                                ? 'text-red-400'
                                : assessment.level === 'high'
                                ? 'text-orange-400'
                                : assessment.level === 'moderate'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {assessment.score}
                            <span className="text-xs font-normal text-slate-500">/100</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Score Band: {band.min}–{band.max}
                          </span>
                        </div>
                      </div>

                      {/* Location & Timeframe Info */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 border-t border-emerald-950/50 pt-2.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{assessment.coordinates.addressName || 'Monitored Sector'}</span>
                        </span>
                        <span className="text-emerald-950">&bull;</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Timeframe: {assessment.suggestedTimeframe || band.timeframe}</span>
                        </span>
                      </div>

                      {/* Mathematical Contributing Factor Breakdown */}
                      <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-lg p-3 space-y-2 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Contributing Factors Weight Breakdown:
                        </span>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                          <div className="bg-[#08120c] p-1.5 rounded border border-emerald-950/60">
                            <span className="text-[10px] text-slate-400 block">Baseline</span>
                            <strong className="text-emerald-300">{assessment.factorBreakdown.categoryBaseline}/25</strong>
                          </div>
                          <div className="bg-[#08120c] p-1.5 rounded border border-emerald-950/60">
                            <span className="text-[10px] text-slate-400 block">Severity</span>
                            <strong className="text-emerald-300">{assessment.factorBreakdown.reportedSeverity}/30</strong>
                          </div>
                          <div className="bg-[#08120c] p-1.5 rounded border border-emerald-950/60">
                            <span className="text-[10px] text-slate-400 block">Weather</span>
                            <strong className="text-emerald-300">{assessment.factorBreakdown.weatherMultiplier}/20</strong>
                          </div>
                          <div className="bg-[#08120c] p-1.5 rounded border border-emerald-950/60">
                            <span className="text-[10px] text-slate-400 block">Evidence</span>
                            <strong className="text-emerald-300">{assessment.factorBreakdown.evidenceConfidence}/15</strong>
                          </div>
                          <div className="bg-[#08120c] p-1.5 rounded border border-emerald-950/60 col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-slate-400 block">History</span>
                            <strong className="text-emerald-300">{assessment.factorBreakdown.proximityAndHistory}/10</strong>
                          </div>
                        </div>
                      </div>

                      {/* Transparent Explanations (Why Flagged) */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-300 block">Why this risk was flagged:</span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {assessment.explanations.slice(0, 3).map((exp, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-emerald-400 font-bold mt-0.5">&rsaquo;</span>
                              <span>{exp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Preventive Actions */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-emerald-400 block">
                          Recommended Preventive Actions:
                        </span>
                        <div className="space-y-1">
                          {assessment.recommendedActions.slice(0, 2).map((act, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] bg-[#0e1a13] text-slate-200 border border-emerald-950/60 px-2.5 py-1.5 rounded-lg flex items-center gap-2"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="border-t border-emerald-950/60 pt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        Evaluated: {new Date(assessment.assessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {linkedTask ? (
                        <button
                          onClick={onNavigateToTasks}
                          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Task Active: {linkedTask.title.slice(0, 22)}...</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDispatchModal(assessment)}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Dispatch Prevention Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: INTERACTIVE WHAT-IF SCENARIO LAB */}
      {/* ========================================================== */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#09150e] border border-emerald-950/70 rounded-xl p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Hypothetical Sensitivity Lab (Simulation Only)
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                  What-If Environmental Risk Scenario Simulator
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Evaluate how preventive interventions (e.g. clearing drainage culverts and deploying trash booms
                  before monsoon downpours) alter risk trajectory before damage occurs.
                </p>
              </div>
              <button
                onClick={handleResetSimDefaults}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Mitigation Preset</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Comparison Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Empirical Card */}
            <div className="bg-[#0b140f] border border-emerald-950/80 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Baseline Empirical Condition
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                    RISK_SCORE_BANDS[simResult.baselineRiskLevel].badgeBg
                  }`}
                >
                  {simResult.baselineRiskLevel} RISK
                </span>
              </div>
              <div className="text-4xl font-black text-white">
                {simResult.baselineRiskScore}
                <span className="text-base font-normal text-slate-500 ml-1">/ 100</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Standard baseline calculated with intrinsic category baseline hazard and initial reported severity.
              </p>
            </div>

            {/* Simulated Scenario Outcome Card */}
            <div className="bg-[#0b140f] border border-emerald-950/80 rounded-xl p-5 shadow-sm relative overflow-hidden space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hypothetical Simulated Outcome</span>
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                    RISK_SCORE_BANDS[simResult.simulatedRiskLevel].badgeBg
                  }`}
                >
                  {simResult.simulatedRiskLevel} RISK
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-black text-white">
                  {simResult.simulatedRiskScore}
                  <span className="text-base font-normal text-slate-500 ml-1">/ 100</span>
                </div>
                <div
                  className={`text-xs font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full ${
                    simResult.scoreDelta > 0
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : simResult.scoreDelta < 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {simResult.scoreDelta > 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" /> +{simResult.scoreDelta} Risk Surge
                    </>
                  ) : simResult.scoreDelta < 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" /> {simResult.scoreDelta} Risk Reduction
                    </>
                  ) : (
                    'No Delta'
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-normal">
                {simResult.scoreDelta < 0
                  ? 'Proactive preventive clearance significantly drops flood & leachate exposure.'
                  : simResult.scoreDelta > 0
                  ? 'Compounding weather and waste buildup elevates potential environmental catastrophe.'
                  : 'Scenario parameters match current baseline.'}
              </p>
            </div>
          </div>

          {/* Controls & Modifiers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Scenario Sliders */}
            <div className="lg:col-span-7 bg-[#0b140f] border border-emerald-950/70 rounded-xl p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-white border-b border-emerald-950/60 pb-2.5 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Adjust Scenario Parameters</span>
              </h3>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pollution Category</label>
                <select
                  value={simInputs.category}
                  onChange={(e) => setSimInputs({ ...simInputs, category: e.target.value as PollutionCategory })}
                  className="w-full text-xs p-2.5 border border-emerald-950/80 rounded-lg outline-none bg-[#080d0a] text-slate-200 focus:border-emerald-500"
                >
                  <option value="plastic">Plastic & Solid Waste (Culvert Hydraulic Clogging Focus)</option>
                  <option value="water">Water Contamination & Industrial Effluent Outfall</option>
                  <option value="air">Air Quality & Toxic Airborne Particulate Dispersion</option>
                  <option value="soil">Soil Contamination & Agro-chemical Leaching</option>
                  <option value="thermal">Thermal Pollution & Effluent Hypoxia</option>
                  <option value="noise">Noise Decibels & Acoustic Exposure Pressure</option>
                  <option value="light">Light Pollution & Nocturnal Skyglow</option>
                  <option value="radioactive">Radioactive Isotope Environmental Radiation</option>
                  <option value="visual">Visual Blight & Illegal Dumping Precursor</option>
                </select>
              </div>

              {/* Rainfall Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Forecast Rainfall Volume: {simInputs.rainfallAmountMm} mm</span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {simInputs.rainfallAmountMm > 25
                      ? 'Torrential Downpour'
                      : simInputs.rainfallAmountMm > 10
                      ? 'Moderate Rain'
                      : 'Dry / Light'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2"
                  value={simInputs.rainfallAmountMm}
                  onChange={(e) => setSimInputs({ ...simInputs, rainfallAmountMm: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Proactive Drainage Clearance Toggle */}
              <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-white block">Proactive Drainage Culvert Clearance</span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Deploy backhoe grabber and install steel trash rack screens prior to rainfall.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSimInputs({ ...simInputs, drainageCleared: !simInputs.drainageCleared })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
                    simInputs.drainageCleared
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {simInputs.drainageCleared ? 'Culvert Cleared' : 'Unchecked / Blocked'}
                </button>
              </div>

              {/* Waste Accumulation Density */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Waste Accumulation Density: Level {simInputs.wasteAccumulationLevel}/5</span>
                  <span className="text-[11px] text-slate-400">
                    {simInputs.wasteAccumulationLevel >= 4 ? 'Overflowing Debris' : 'Managed Collection'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={simInputs.wasteAccumulationLevel}
                  onChange={(e) => setSimInputs({ ...simInputs, wasteAccumulationLevel: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Wind Speed Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Wind Velocity: {simInputs.windSpeedKmh} km/h</span>
                  <span className="text-[11px] text-slate-400">
                    {simInputs.windSpeedKmh > 25 ? 'High Dispersion' : simInputs.windSpeedKmh < 5 ? 'Stagnant Smog Trap' : 'Moderate'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2"
                  value={simInputs.windSpeedKmh}
                  onChange={(e) => setSimInputs({ ...simInputs, windSpeedKmh: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Ambient Temperature Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Ambient Temperature: {simInputs.temperatureC} °C</span>
                  <span className="text-[11px] text-slate-400">
                    {simInputs.temperatureC > 35 ? 'Extreme Heat / Anoxia Vulnerability' : 'Normal'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={simInputs.temperatureC}
                  onChange={(e) => setSimInputs({ ...simInputs, temperatureC: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Inspection Elapsed Days Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Days Since Last Field Inspection: {simInputs.daysSinceLastInspection} days</span>
                  <span className="text-[11px] text-slate-400">
                    {simInputs.daysSinceLastInspection > 14 ? 'Lapsed & Unmonitored' : 'Recently Audited'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={simInputs.daysSinceLastInspection}
                  onChange={(e) => setSimInputs({ ...simInputs, daysSinceLastInspection: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Right Column: Dynamic Factor Impact Summary */}
            <div className="lg:col-span-5 space-y-4">
              {/* Mitigating Factors */}
              <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Mitigating Preventive Factors</span>
                </h4>
                {simResult.mitigatingFactors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No active mitigation actions selected. Toggle "Culvert Cleared" or lower waste accumulation to
                    simulate risk reduction.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {simResult.mitigatingFactors.map((mit, i) => (
                      <li
                        key={i}
                        className="text-xs bg-emerald-950/20 text-emerald-300 border border-emerald-500/20 p-2.5 rounded-lg flex items-start gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{mit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Worsening Factors */}
              <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Aggravating Environmental Factors</span>
                </h4>
                {simResult.worseningFactors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No aggravating parameters currently applied.</p>
                ) : (
                  <ul className="space-y-2">
                    {simResult.worseningFactors.map((worse, i) => (
                      <li
                        key={i}
                        className="text-xs bg-red-950/20 text-red-300 border border-red-500/20 p-2.5 rounded-lg flex items-start gap-2"
                      >
                        <span className="text-red-400 font-bold mt-0.5">&rsaquo;</span>
                        <span>{worse}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Simulator Disclosure Box */}
              <div className="p-4 rounded-xl bg-[#0e1a13] border border-emerald-950/80 text-xs text-slate-300 space-y-2">
                <span className="font-semibold text-emerald-400 block">Simulation Methodology Notice:</span>
                <p className="text-[11px] leading-relaxed text-slate-400">{simResult.limitations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: SCORING METHODOLOGY & AI ETHICS */}
      {/* ========================================================== */}
      {activeTab === 'methodology' && (
        <div className="space-y-6">
          <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-6 sm:p-7 space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25">
                Explainable AI Architecture
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Mathematical Risk Scoring Formulation</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                EcoShield AI uses a deterministic, fully transparent weighted scoring model (normalized 0 to 100 score)
                calibrated against empirical environmental engineering heuristics.
              </p>
            </div>

            {/* Formula Block */}
            <div className="bg-[#080d0a] border border-emerald-950/80 rounded-xl p-5 text-center font-mono text-xs sm:text-sm text-emerald-300 space-y-2">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider block">Normalized Scoring Formula:</span>
              <div className="py-2 text-white font-bold text-sm sm:text-base">
                {'Risk Score = min(100, max(0, CategoryBaseline + ReportedSeverity + WeatherMultiplier + EvidenceConfidence + ProximityAndHistory))'}
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Each component contributes an isolated, accountable point weight that can be inspected by citizens, field officers, and municipal directors.
              </p>
            </div>

            {/* Score Bands Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Standardized Risk Score Bands & Action Windows</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300 border border-emerald-950/60 rounded-xl overflow-hidden">
                  <thead className="bg-[#0e1a13] text-slate-300 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3 border-b border-emerald-950/80">Score Range</th>
                      <th className="p-3 border-b border-emerald-950/80">Risk Level</th>
                      <th className="p-3 border-b border-emerald-950/80">Operational Response Timeframe</th>
                      <th className="p-3 border-b border-emerald-950/80">Municipal Directive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/50">
                    <tr className="hover:bg-red-950/20">
                      <td className="p-3 font-mono font-bold text-red-400">75 – 100</td>
                      <td className="p-3 font-bold text-red-400">CRITICAL</td>
                      <td className="p-3 font-semibold text-white">&lt; 4 Hours</td>
                      <td className="p-3 text-slate-300">
                        Immediate emergency cordon, hazardous source isolation, and mechanized culvert extraction.
                      </td>
                    </tr>
                    <tr className="hover:bg-orange-950/20">
                      <td className="p-3 font-mono font-bold text-orange-400">50 – 74</td>
                      <td className="p-3 font-bold text-orange-400">HIGH</td>
                      <td className="p-3 font-semibold text-white">&lt; 24 Hours</td>
                      <td className="p-3 text-slate-300">
                        Rapid field dispatch, floating boom installation, and targeted dust/effluent suppression.
                      </td>
                    </tr>
                    <tr className="hover:bg-amber-950/20">
                      <td className="p-3 font-mono font-bold text-amber-400">25 – 49</td>
                      <td className="p-3 font-bold text-amber-400">MODERATE</td>
                      <td className="p-3 font-semibold text-white">&lt; 72 Hours</td>
                      <td className="p-3 text-slate-300">
                        Scheduled physical inspection, community notice issuance, and source verification sampling.
                      </td>
                    </tr>
                    <tr className="hover:bg-emerald-950/20">
                      <td className="p-3 font-mono font-bold text-emerald-400">0 – 24</td>
                      <td className="p-3 font-bold text-emerald-400">LOW</td>
                      <td className="p-3 font-semibold text-white">&lt; 7 Days</td>
                      <td className="p-3 text-slate-300">
                        Routine environmental monitoring, baseline telemetry recording, and preventive maintenance.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Baseline Weights Hierarchy Table across 9 Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Intrinsic Hazard Baseline Weights (All 9 Categories)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(CATEGORY_BASELINE_WEIGHTS).map(([cat, weight]) => {
                  const Icon = CATEGORY_ICONS[cat as PollutionCategory] || Activity;
                  const meta = CATEGORY_METADATA[cat as PollutionCategory];
                  return (
                    <div
                      key={cat}
                      className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#08120c] border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block capitalize">{cat}</span>
                          <span className="text-[10px] text-slate-400">{meta?.liveSensorFeasibility}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">{weight}/25</span>
                        <span className="text-[9px] text-slate-500 block uppercase">Base Pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ethics & Budget Integrity Notice */}
            <div className="bg-[#080d0a] border border-emerald-950/80 rounded-xl p-5 space-y-2 text-xs text-slate-300">
              <span className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Cost & AI Ethics Declaration</span>
              </span>
              <p className="leading-relaxed text-slate-300">
                EcoShield AI intentionally operates on a ₹0 initial budget using Open-Meteo free non-commercial telemetry
                and OpenStreetMap geospatial data. This engine is a deterministic, explainable rules-based system — it
                does not claim to be a trained black-box deep learning model or scientifically unverified predictive algorithm.
                All sample scores are clearly identified to prevent user deception.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* QUICK TASK DISPATCH MODAL */}
      {/* ========================================================== */}
      {dispatchingAssessment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b140f] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-emerald-950/80 text-slate-200 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-950/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Dispatch Preventive Mitigation Task</span>
              </h3>
              <button
                onClick={() => setDispatchingAssessment(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dispatchSuccessMsg ? (
              <div className="bg-emerald-950/40 border border-emerald-500/60 rounded-xl p-5 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Task Successfully Dispatched</h4>
                <p className="text-xs text-emerald-300">{dispatchSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Task Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mitigation Instructions</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={3}
                    required
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Target Response Window</label>
                    <select
                      value={taskDeadlineHours}
                      onChange={(e) => setTaskDeadlineHours(Number(e.target.value))}
                      className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={4}>4 Hours (Emergency Critical)</option>
                      <option value={24}>24 Hours (Rapid Field Action)</option>
                      <option value={48}>48 Hours (Standard Scheduled)</option>
                      <option value={72}>72 Hours (Planned Containment)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Risk Severity Band</label>
                    <div className="bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 font-bold uppercase text-emerald-400">
                      {dispatchingAssessment.level} ({dispatchingAssessment.score}/100)
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-emerald-950/60">
                  <button
                    type="button"
                    onClick={() => setDispatchingAssessment(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Task Dispatch</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
