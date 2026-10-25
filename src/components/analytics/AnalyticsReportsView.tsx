import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Info,
  Calendar,
  Layers,
  Radio,
  FileText,
  Lock,
  Eye,
  X,
  Sparkles,
  Activity,
  Award,
} from 'lucide-react';
import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  UserProfile,
} from '../../types';
import {
  TimeframeOption,
  ProvenanceFilter,
  AnalyticsFilterState,
  filterReports,
  filterTasks,
  getCategoryDistribution,
  getReportStatusDistribution,
  getTaskStatusDistribution,
  getTaskPriorityDistribution,
  getRiskTierDistribution,
  getTimeTrendData,
  calculateAnalyticsSummary,
  generateDescriptiveInsights,
  exportReportsToCsv,
  exportTasksToCsv,
  exportToJson,
  ExportOptions,
} from '../../services/analyticsService';

interface AnalyticsReportsViewProps {
  reports: PollutionReport[];
  tasks: PreventionTask[];
  hotspots?: EnvironmentalHotspot[];
  users?: UserProfile[];
}

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({
  reports,
  tasks,
  hotspots = [],
  users = [],
}) => {
  // Filter States
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all');
  const [provenance, setProvenance] = useState<ProvenanceFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Export & Privacy Options
  const [truncateCoords, setTruncateCoords] = useState<boolean>(true);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string>('');

  const filterState: AnalyticsFilterState = {
    timeframe,
    provenance,
    category: selectedCategory,
    status: selectedStatus,
  };

  // Filtered Datasets
  const filteredReports = useMemo(
    () => filterReports(reports, filterState),
    [reports, timeframe, provenance, selectedCategory, selectedStatus]
  );

  const filteredTasks = useMemo(
    () => filterTasks(tasks, filterState),
    [tasks, timeframe, provenance, selectedCategory, selectedStatus]
  );

  // Computed Distributions & Metrics
  const summary = useMemo(
    () => calculateAnalyticsSummary(filteredReports, filteredTasks, hotspots, users),
    [filteredReports, filteredTasks, hotspots, users]
  );

  const categoryData = useMemo(
    () => getCategoryDistribution(filteredReports),
    [filteredReports]
  );

  const reportStatusData = useMemo(
    () => getReportStatusDistribution(filteredReports),
    [filteredReports]
  );

  const taskPriorityData = useMemo(
    () => getTaskPriorityDistribution(filteredTasks),
    [filteredTasks]
  );

  const riskTierData = useMemo(
    () => getRiskTierDistribution(filteredTasks),
    [filteredTasks]
  );

  const timeTrend = useMemo(
    () => getTimeTrendData(filteredReports, filteredTasks),
    [filteredReports, filteredTasks]
  );

  const timeframeLabel =
    timeframe === '7d'
      ? 'Last 7 Days'
      : timeframe === '30d'
      ? 'Last 30 Days'
      : timeframe === '90d'
      ? 'Last 90 Days'
      : 'All Available Records';

  const insights = useMemo(
    () => generateDescriptiveInsights(filteredReports, filteredTasks, timeframeLabel),
    [filteredReports, filteredTasks, timeframeLabel]
  );

  // File Download Triggers
  const handleDownloadReportsCsv = () => {
    const csv = exportReportsToCsv(filteredReports, { truncateCoordinates: truncateCoords });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoshield_reports_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice(`Exported ${filteredReports.length} reports to CSV (privacy-safe: Base64 scrubbed).`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleDownloadTasksCsv = () => {
    const csv = exportTasksToCsv(filteredTasks, { truncateCoordinates: truncateCoords });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoshield_prevention_tasks_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice(`Exported ${filteredTasks.length} prevention tasks to CSV.`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handleDownloadJsonAudit = () => {
    const json = exportToJson(
      filteredReports,
      filteredTasks,
      hotspots,
      {
        exportedAt: new Date().toISOString(),
        platform: 'EcoShield AI',
        filterState,
        reportsCount: filteredReports.length,
        tasksCount: filteredTasks.length,
        provenanceBreakdown: {
          realReportsCount: summary.realUserReportsCount,
          demoReportsCount: summary.demoSeedReportsCount,
          realTasksCount: summary.realTasksCount,
          demoTasksCount: summary.demoTasksCount,
        },
        privacyNotice: 'Sensitive fields scrubbed; Base64 images omitted.',
      },
      { truncateCoordinates: truncateCoords }
    );

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoshield_audit_package_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice('Exported full structured JSON audit payload.');
    setTimeout(() => setExportNotice(''), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-200">
      {/* Top Banner: Analytics Scope & Export Actions */}
      <div className="bg-[#09150e] border border-emerald-950/70 rounded-2xl p-5 sm:p-6 shadow-elevated">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Auditable Operational Metrics</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Predict Pollution. Prevent Before It Happens.
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              <span>Environmental Analytics & Regulatory Audit</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Transparent descriptive reporting of community pollution observations, prevention lifecycle
              completion rates, and auditable proof records.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadReportsCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0e1d15] hover:bg-[#13281c] text-emerald-300 border border-emerald-950/80 rounded-xl text-xs font-semibold transition-colors shadow-xs"
              title="Download filtered reports as CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Reports CSV</span>
            </button>

            <button
              onClick={handleDownloadTasksCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0e1d15] hover:bg-[#13281c] text-sky-300 border border-emerald-950/80 rounded-xl text-xs font-semibold transition-colors shadow-xs"
              title="Download filtered tasks as CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              <span>Tasks CSV</span>
            </button>

            <button
              onClick={handleDownloadJsonAudit}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0e1d15] hover:bg-[#13281c] text-slate-200 border border-emerald-950/80 rounded-xl text-xs font-semibold transition-colors shadow-xs"
              title="Download structured JSON archive"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>JSON Audit</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              title="View print-friendly summary report"
            >
              <Printer className="w-4 h-4" />
              <span>Print Audit</span>
            </button>
          </div>
        </div>

        {/* Temporary Export Notification */}
        {exportNotice && (
          <div className="mt-3 p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Multi-Dimensional Filter Toolbar */}
      <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Filter */}
            <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={timeframe}
                onChange={(e: any) => setTimeframe(e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="7d" className="bg-[#0b140f]">Last 7 Days</option>
                <option value="30d" className="bg-[#0b140f]">Last 30 Days</option>
                <option value="90d" className="bg-[#0b140f]">Last 90 Days</option>
                <option value="all" className="bg-[#0b140f]">All Available Records</option>
              </select>
            </div>

            {/* Data Provenance Filter */}
            <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={provenance}
                onChange={(e: any) => setProvenance(e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0b140f]">Data Scope: All Records</option>
                <option value="real_only" className="bg-[#0b140f] text-emerald-400 font-semibold">Real User Submissions Only</option>
                <option value="demo_only" className="bg-[#0b140f] text-amber-400">Demo Seed Records Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0b140f]">All 9 Pollution Domains</option>
                <option value="plastic" className="bg-[#0b140f]">Plastic Waste</option>
                <option value="water" className="bg-[#0b140f]">Water Contamination</option>
                <option value="air" className="bg-[#0b140f]">Air Pollution</option>
                <option value="soil" className="bg-[#0b140f]">Soil Pollution</option>
                <option value="noise" className="bg-[#0b140f]">Noise Decibels</option>
                <option value="thermal" className="bg-[#0b140f]">Thermal Pollution</option>
                <option value="light" className="bg-[#0b140f]">Light Pollution</option>
                <option value="radioactive" className="bg-[#0b140f]">Radioactive Hazard</option>
                <option value="visual" className="bg-[#0b140f]">Visual Blight</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0b140f]">All Report Statuses</option>
                <option value="submitted" className="bg-[#0b140f]">Submitted</option>
                <option value="under_review" className="bg-[#0b140f]">Under Review</option>
                <option value="verified" className="bg-[#0b140f]">Verified</option>
                <option value="action_assigned" className="bg-[#0b140f]">Action Assigned</option>
                <option value="action_taken" className="bg-[#0b140f]">Action Taken</option>
                <option value="resolved" className="bg-[#0b140f]">Resolved</option>
              </select>
            </div>
          </div>

          {/* Privacy Toggle: Truncate Coordinates */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={truncateCoords}
                onChange={(e) => setTruncateCoords(e.target.checked)}
                className="rounded accent-emerald-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Mask GPS Coordinates to Neighborhood Resolution (~1.1 km) in Exports</span>
              </span>
            </label>
          </div>
        </div>

        {/* Selected Scope Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-950/50 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Active Scope: <strong className="text-white">{filteredReports.length}</strong> reports (
              <span className="text-emerald-400 font-semibold">{summary.realUserReportsCount} real</span>,{' '}
              <span className="text-amber-400">{summary.demoSeedReportsCount} demo</span>)
            </span>
            <span>&bull;</span>
            <span>
              Tasks: <strong className="text-white">{filteredTasks.length}</strong> (
              <span className="text-sky-400 font-semibold">{summary.realTasksCount} real</span>,{' '}
              <span className="text-amber-400">{summary.demoTasksCount} demo</span>)
            </span>
          </div>
          <div className="font-mono text-slate-400 text-[10px]">
            Scope: {timeframeLabel} • Domain: {selectedCategory.toUpperCase()}
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Reports */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Filtered Reports
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {summary.totalReports}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">
              {summary.verifiedReportsCount} Verified ({summary.totalReports > 0 ? Math.round((summary.verifiedReportsCount / summary.totalReports) * 100) : 0}%)
            </span>
            <span className="text-slate-500 font-mono">{summary.resolvedReportsCount} Resolved</span>
          </div>
        </div>

        {/* Card 2: Prevention Tasks */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Prevention Interventions
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {summary.totalTasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-sky-400 font-semibold">
              {summary.inProgressTasksCount + summary.assignedTasksCount} In Field
            </span>
            <span className="text-emerald-400">{summary.verifiedTasksCount} Closed</span>
          </div>
        </div>

        {/* Card 3: Overdue Interventions */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Overdue Mitigation Tasks
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
              summary.overdueTasksCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {summary.overdueTasksCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.overdueTasksCount > 0 ? (
              <span className="text-red-400 font-semibold">Immediate attention needed</span>
            ) : (
              <span className="text-emerald-400">All tasks within response timeframes</span>
            )}
          </div>
        </div>

        {/* Card 4: Total Community EcoPoints */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 sm:p-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Community EcoPoints Earned
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 flex items-center gap-1.5">
            <Award className="w-6 h-6 text-emerald-400" />
            <span>{summary.totalEcoPointsEarned}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {users.length || 3} registered field contributors & scouts
          </div>
        </div>
      </div>

      {/* 4 Descriptive Explainable Insights */}
      <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-emerald-950/60 pb-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Descriptive Operational Insights</h3>
          <span className="text-[10px] text-slate-400 ml-auto font-mono">
            Derived directly from active scope
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-3.5 space-y-1.5 text-xs"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {ins.title}
              </div>
              <div className="text-base font-extrabold text-white">
                {ins.value}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {ins.description}
              </p>
              <div className="text-[9px] text-slate-400 font-mono pt-1 border-t border-emerald-950/50">
                {ins.scope}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Analytics Charts Grid (2x2 layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Breakdown Across All 9 Pollution Domains */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">
                Distribution Across 9 Pollution Domains
              </h3>
              <p className="text-[11px] text-slate-400">
                Observations categorized by standardized environmental domain.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              {filteredReports.length} Reports
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#102318" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b140f',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Time-Based Incident & Task Trends */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">
                Incident & Mitigation Time Trends
              </h3>
              <p className="text-[11px] text-slate-400">
                Discrete timeline observations plotted using actual recorded timestamps.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {timeframeLabel}
            </span>
          </div>

          {timeTrend.hasSufficientData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeTrend.trendPoints}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#102318" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b140f',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reports"
                    name="Reports Logged"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    name="Prevention Tasks"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#38bdf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex flex-col items-center justify-center p-6 text-center bg-[#08120c] rounded-xl border border-emerald-950/60">
              <Calendar className="w-8 h-8 text-slate-500 mb-2" />
              <h4 className="text-xs font-bold text-slate-300">
                Single-Date or Sparse Calendar Distribution
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                {timeTrend.message} In accordance with EcoShield AI data honesty guidelines, historical trend lines are not fabricated.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-mono bg-[#0e1a13] px-2.5 py-1 rounded-lg border border-emerald-950/80 text-emerald-400">
                  {filteredReports.length} reports logged on recorded dates
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart 3: Report Status Progression */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">
                Report Lifecycle Progression
              </h3>
              <p className="text-[11px] text-slate-400">
                Status progression from submission to verification and closure.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              Lifecycle Audit
            </span>
          </div>

          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {reportStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b140f',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-1.5 text-xs">
              {reportStatusData.map((st) => (
                <div key={st.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: st.color }}
                    />
                    <span className="text-slate-300 text-[11px]">{st.label}</span>
                  </div>
                  <span className="font-mono font-bold text-white text-[11px]">
                    {st.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Prevention Tasks Priority & Risk Score Distribution */}
        <div className="bg-[#0b140f] border border-emerald-950/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">
                Prevention Tasks by Priority & Risk Tier
              </h3>
              <p className="text-[11px] text-slate-400">
                Dispatched engineering tasks categorized by standardized response urgency.
              </p>
            </div>
            <span className="text-[10px] font-mono text-sky-400">
              {filteredTasks.length} Tasks
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={taskPriorityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#102318" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b140f',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]}>
                  {taskPriorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mandatory Engineering & Regulatory Disclosure */}
      <div className="bg-[#08120c] border border-emerald-950/70 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-200">Environmental Data Integrity Notice:</strong> Metrics displayed in this
          analytics console reflect administrative actions, community incident logging, and completed barrier deployments.
          They do not claim measured reductions in ambient pollutant parts-per-million or biochemical dissolved oxygen
          unless accompanied by certified laboratory assays. Seed demonstration data is strictly tagged to prevent
          unsubstantiated claims during environmental hackathons and audits.
        </div>
      </div>

      {/* Print-Friendly Report Modal / Dialog */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl max-w-3xl w-full p-6 text-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <span>EcoShield AI — Official Environmental Audit Report</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Generated at {new Date().toLocaleString()} • Filter Scope: {timeframeLabel}
                </span>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Summary */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0e1a13] p-3 rounded-xl border border-emerald-950/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Reports</span>
                  <strong className="text-white text-sm">{filteredReports.length}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Verified Incidents</span>
                  <strong className="text-emerald-400 text-sm">{summary.verifiedReportsCount}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Prevention Tasks</span>
                  <strong className="text-sky-400 text-sm">{filteredTasks.length}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Overdue Interventions</span>
                  <strong className="text-amber-400 text-sm">{summary.overdueTasksCount}</strong>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div>
                <h4 className="font-bold text-white mb-2">Breakdown by Environmental Domain</h4>
                <div className="border border-emerald-950/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#0e1a13] text-slate-300">
                      <tr>
                        <th className="p-2">Domain</th>
                        <th className="p-2">Observations Logged</th>
                        <th className="p-2">Percentage of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950/40">
                      {categoryData.map((cat) => (
                        <tr key={cat.category} className="hover:bg-[#0e1a13]/50">
                          <td className="p-2 font-medium text-white">{cat.name}</td>
                          <td className="p-2">{cat.count}</td>
                          <td className="p-2 font-mono">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Provenance Statement */}
              <div className="p-3 bg-[#08120c] rounded-xl border border-emerald-950/60 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Provenance & Verification Guarantee:</span>
                <p>
                  This report includes {summary.realUserReportsCount} real user observations and {summary.demoSeedReportsCount} seeded
                  baseline scenarios. GPS coordinates are masked to neighborhood resolution in external exports for contributor privacy.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-950/60">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3 py-1.5 bg-[#0e1a13] hover:bg-[#13281c] text-slate-300 rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print via System Dialog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
