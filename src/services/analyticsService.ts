import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  UserProfile,
  PollutionCategory,
  ReportStatus,
  TaskStatus,
  TaskPriority,
} from '../types';

export type TimeframeOption = '7d' | '30d' | '90d' | 'all';
export type ProvenanceFilter = 'all' | 'real_only' | 'demo_only';

export interface AnalyticsFilterState {
  timeframe: TimeframeOption;
  provenance: ProvenanceFilter;
  category: string; // 'all' or PollutionCategory
  status: string;   // 'all' or ReportStatus
}

export interface ExportOptions {
  includeSensitiveDetails?: boolean;
  truncateCoordinates?: boolean; // round to 2 decimals (~1.1 km) for neighborhood privacy
}

export interface ExportMetadata {
  exportedAt: string;
  platform: string;
  filterState: AnalyticsFilterState;
  reportsCount: number;
  tasksCount: number;
  provenanceBreakdown: {
    realReportsCount: number;
    demoReportsCount: number;
    realTasksCount: number;
    demoTasksCount: number;
  };
  privacyNotice: string;
}

export interface AnalyticsSummary {
  totalReports: number;
  realUserReportsCount: number;
  demoSeedReportsCount: number;
  verifiedReportsCount: number;
  resolvedReportsCount: number;
  unresolvedReportsCount: number;
  awaitingReviewCount: number;
  totalTasks: number;
  realTasksCount: number;
  demoTasksCount: number;
  openTasksCount: number;
  assignedTasksCount: number;
  inProgressTasksCount: number;
  awaitingVerificationCount: number;
  verifiedTasksCount: number;
  overdueTasksCount: number;
  totalEcoPointsEarned: number;
  totalHotspotsMonitored: number;
}

export interface DescriptiveInsight {
  id: string;
  title: string;
  value: string | number;
  description: string;
  scope: string;
  type: 'warning' | 'info' | 'success' | 'alert';
}

const CATEGORY_COLORS: Record<PollutionCategory, string> = {
  water: '#0284c7',
  air: '#94a3b8',
  plastic: '#ea580c',
  soil: '#d97706',
  noise: '#a855f7',
  thermal: '#ef4444',
  radioactive: '#eab308',
  light: '#f43f5e',
  visual: '#14b8a6',
};

const ALL_CATEGORIES: PollutionCategory[] = [
  'plastic',
  'water',
  'air',
  'soil',
  'noise',
  'thermal',
  'light',
  'radioactive',
  'visual',
];

/**
 * Filter items by date range using `createdAt` timestamp.
 * Handles invalid, unparseable, or missing dates safely.
 */
export function filterByDateRange<T extends { createdAt?: string; observedAt?: string }>(
  items: T[],
  range: TimeframeOption,
  referenceDate: Date = new Date()
): T[] {
  if (range === 'all') return items;

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoffTime = referenceDate.getTime() - days * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    const rawDate = item.createdAt || item.observedAt;
    if (!rawDate) return false;
    const parsed = new Date(rawDate).getTime();
    if (isNaN(parsed)) return false;
    return parsed >= cutoffTime;
  });
}

/**
 * Filter items by data provenance (`isDemo: true` vs `isDemo: false`).
 */
export function filterByProvenance<T extends { isDemo?: boolean }>(
  items: T[],
  provenance: ProvenanceFilter
): T[] {
  if (provenance === 'real_only') {
    return items.filter((item) => !item.isDemo);
  }
  if (provenance === 'demo_only') {
    return items.filter((item) => Boolean(item.isDemo));
  }
  return items;
}

/**
 * Filter reports by category and status.
 */
export function filterReports(
  reports: PollutionReport[],
  filters: AnalyticsFilterState,
  referenceDate?: Date
): PollutionReport[] {
  let filtered = filterByProvenance(reports, filters.provenance);
  filtered = filterByDateRange(filtered, filters.timeframe, referenceDate);

  if (filters.category !== 'all') {
    filtered = filtered.filter((r) => r.category === filters.category);
  }
  if (filters.status !== 'all') {
    filtered = filtered.filter((r) => r.status === filters.status);
  }

  return filtered;
}

/**
 * Filter prevention tasks by category, status, and provenance.
 */
export function filterTasks(
  tasks: PreventionTask[],
  filters: AnalyticsFilterState,
  referenceDate?: Date
): PreventionTask[] {
  let filtered = filterByProvenance(tasks, filters.provenance);
  filtered = filterByDateRange(filtered, filters.timeframe, referenceDate);

  if (filters.category !== 'all') {
    filtered = filtered.filter((t) => t.category === filters.category);
  }
  if (filters.status !== 'all') {
    filtered = filtered.filter((t) => t.status === filters.status);
  }

  return filtered;
}

/**
 * Compute breakdown across all 9 standardized pollution categories.
 * Guarantees all 9 categories are represented (with 0 count if none reported).
 */
export function getCategoryDistribution(reports: PollutionReport[]): Array<{
  category: PollutionCategory;
  name: string;
  count: number;
  percentage: number;
  color: string;
}> {
  const counts: Record<PollutionCategory, number> = {
    plastic: 0,
    water: 0,
    air: 0,
    soil: 0,
    noise: 0,
    thermal: 0,
    light: 0,
    radioactive: 0,
    visual: 0,
  };

  reports.forEach((r) => {
    if (counts[r.category] !== undefined) {
      counts[r.category]++;
    }
  });

  const total = reports.length;

  return ALL_CATEGORIES.map((cat) => ({
    category: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: counts[cat],
    percentage: total > 0 ? Math.round((counts[cat] / total) * 100) : 0,
    color: CATEGORY_COLORS[cat] || '#10b981',
  }));
}

/**
 * Breakdown of reports by status.
 */
export function getReportStatusDistribution(reports: PollutionReport[]): Array<{
  status: ReportStatus;
  label: string;
  count: number;
  color: string;
}> {
  const statuses: { status: ReportStatus; label: string; color: string }[] = [
    { status: 'submitted', label: 'Submitted', color: '#f59e0b' },
    { status: 'under_review', label: 'Under Review', color: '#38bdf8' },
    { status: 'verified', label: 'Verified', color: '#10b981' },
    { status: 'action_assigned', label: 'Action Assigned', color: '#818cf8' },
    { status: 'action_taken', label: 'Action Taken', color: '#34d399' },
    { status: 'resolved', label: 'Resolved', color: '#059669' },
    { status: 'rejected', label: 'Rejected', color: '#64748b' },
  ];

  return statuses.map((s) => ({
    ...s,
    count: reports.filter((r) => r.status === s.status).length,
  }));
}

/**
 * Breakdown of tasks by status.
 */
export function getTaskStatusDistribution(tasks: PreventionTask[]): Array<{
  status: TaskStatus;
  label: string;
  count: number;
  color: string;
}> {
  const statuses: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'pending', label: 'Pending Cordon', color: '#94a3b8' },
    { status: 'assigned', label: 'Assigned', color: '#38bdf8' },
    { status: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { status: 'completed', label: 'Awaiting Sign-off', color: '#a78bfa' },
    { status: 'verified', label: 'Verified & Closed', color: '#10b981' },
  ];

  return statuses.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.status === s.status).length,
  }));
}

/**
 * Breakdown of tasks by priority.
 */
export function getTaskPriorityDistribution(tasks: PreventionTask[]): Array<{
  priority: TaskPriority;
  label: string;
  count: number;
  color: string;
}> {
  const priorities: { priority: TaskPriority; label: string; color: string }[] = [
    { priority: 'critical', label: 'Critical (<4h)', color: '#ef4444' },
    { priority: 'high', label: 'High (<24h)', color: '#f97316' },
    { priority: 'medium', label: 'Medium (<72h)', color: '#eab308' },
    { priority: 'low', label: 'Low (<7d)', color: '#10b981' },
  ];

  return priorities.map((p) => ({
    ...p,
    count: tasks.filter((t) => t.priority === p.priority).length,
  }));
}

/**
 * Risk score distribution across standardized tiers (0-24 Low, 25-49 Moderate, 50-74 High, 75-100 Critical).
 */
export function getRiskTierDistribution(tasks: PreventionTask[]): Array<{
  tier: string;
  label: string;
  range: string;
  count: number;
  color: string;
}> {
  const counts = {
    critical: tasks.filter((t) => (t.riskScore ?? 0) >= 75).length,
    high: tasks.filter((t) => (t.riskScore ?? 0) >= 50 && (t.riskScore ?? 0) < 75).length,
    moderate: tasks.filter((t) => (t.riskScore ?? 0) >= 25 && (t.riskScore ?? 0) < 50).length,
    low: tasks.filter((t) => (t.riskScore ?? 0) < 25).length,
  };

  return [
    { tier: 'critical', label: 'Critical Risk', range: '75–100', count: counts.critical, color: '#ef4444' },
    { tier: 'high', label: 'High Risk', range: '50–74', count: counts.high, color: '#f97316' },
    { tier: 'moderate', label: 'Moderate Risk', range: '25–49', count: counts.moderate, color: '#eab308' },
    { tier: 'low', label: 'Low Risk', range: '0–24', count: counts.low, color: '#10b981' },
  ];
}

/**
 * Generates discrete time-series trend points strictly based on real timestamps.
 * Does NOT generate fake dates or invent historical points.
 */
export function getTimeTrendData(
  reports: PollutionReport[],
  tasks: PreventionTask[]
): {
  trendPoints: Array<{ date: string; reports: number; tasks: number }>;
  hasSufficientData: boolean;
  message?: string;
} {
  const dateMap: Record<string, { reports: number; tasks: number }> = {};

  reports.forEach((r) => {
    const rawDate = r.createdAt || r.observedAt;
    if (!rawDate) return;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!dateMap[key]) dateMap[key] = { reports: 0, tasks: 0 };
    dateMap[key].reports++;
  });

  tasks.forEach((t) => {
    const rawDate = t.createdAt;
    if (!rawDate) return;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    if (!dateMap[key]) dateMap[key] = { reports: 0, tasks: 0 };
    dateMap[key].tasks++;
  });

  const sortedDates = Object.keys(dateMap).sort();
  const trendPoints = sortedDates.map((date) => ({
    date,
    reports: dateMap[date].reports,
    tasks: dateMap[date].tasks,
  }));

  const hasSufficientData = sortedDates.length >= 2;
  const message = hasSufficientData
    ? undefined
    : sortedDates.length === 1
    ? 'Single date record available in selected filter scope. Multi-day trend line requires observations across multiple distinct calendar dates.'
    : 'No dated records found matching the active filter criteria.';

  return { trendPoints, hasSufficientData, message };
}

/**
 * Calculates high-level summary KPIs.
 */
export function calculateAnalyticsSummary(
  reports: PollutionReport[],
  tasks: PreventionTask[],
  hotspots: EnvironmentalHotspot[] = [],
  users: UserProfile[] = [],
  referenceDate: Date = new Date()
): AnalyticsSummary {
  const verifiedReports = reports.filter(
    (r) => r.status === 'verified' || r.status === 'action_assigned' || r.status === 'action_taken' || r.status === 'resolved'
  ).length;

  const resolvedReports = reports.filter((r) => r.status === 'resolved').length;
  const unresolvedReports = reports.filter((r) => r.status !== 'resolved' && r.status !== 'rejected').length;
  const awaitingReview = reports.filter((r) => r.status === 'submitted' || r.status === 'under_review').length;

  const realReports = reports.filter((r) => !r.isDemo).length;
  const demoReports = reports.filter((r) => Boolean(r.isDemo)).length;

  const realTasks = tasks.filter((t) => !t.isDemo).length;
  const demoTasks = tasks.filter((t) => Boolean(t.isDemo)).length;

  const openTasks = tasks.filter((t) => t.status === 'pending').length;
  const assignedTasks = tasks.filter((t) => t.status === 'assigned').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const awaitingVerification = tasks.filter((t) => t.status === 'completed').length;
  const verifiedTasks = tasks.filter((t) => t.status === 'verified').length;

  // Overdue: deadline in past and not yet verified or completed
  const now = referenceDate.getTime();
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'verified' || t.status === 'completed') return false;
    if (!t.deadline) return false;
    const deadlineTime = new Date(t.deadline).getTime();
    return !isNaN(deadlineTime) && deadlineTime < now;
  }).length;

  // Sum of EcoPoints across all users
  const totalEcoPoints = users.reduce((acc, u) => acc + (u.ecoPoints || 0), 0);

  return {
    totalReports: reports.length,
    realUserReportsCount: realReports,
    demoSeedReportsCount: demoReports,
    verifiedReportsCount: verifiedReports,
    resolvedReportsCount: resolvedReports,
    unresolvedReportsCount: unresolvedReports,
    awaitingReviewCount: awaitingReview,
    totalTasks: tasks.length,
    realTasksCount: realTasks,
    demoTasksCount: demoTasks,
    openTasksCount: openTasks,
    assignedTasksCount: assignedTasks,
    inProgressTasksCount: inProgressTasks,
    awaitingVerificationCount: awaitingVerification,
    verifiedTasksCount: verifiedTasks,
    overdueTasksCount: overdueTasks,
    totalEcoPointsEarned: totalEcoPoints,
    totalHotspotsMonitored: hotspots.length,
  };
}

/**
 * Generates transparent, explainable insights derived strictly from descriptive data.
 */
export function generateDescriptiveInsights(
  reports: PollutionReport[],
  tasks: PreventionTask[],
  timeframeLabel: string,
  referenceDate: Date = new Date()
): DescriptiveInsight[] {
  const insights: DescriptiveInsight[] = [];
  const scopeDesc = `Based on ${reports.length} report(s) and ${tasks.length} task(s) in '${timeframeLabel}'`;

  // 1. Most frequently reported category
  if (reports.length > 0) {
    const catDist = getCategoryDistribution(reports);
    const sortedCats = [...catDist].sort((a, b) => b.count - a.count);
    const topCat = sortedCats[0];
    if (topCat && topCat.count > 0) {
      insights.push({
        id: 'top-category',
        title: 'Predominant Pollution Domain',
        value: `${topCat.name} (${topCat.count} reports, ${topCat.percentage}%)`,
        description: `Most frequently logged observation domain in the selected filter window.`,
        scope: scopeDesc,
        type: 'info',
      });
    }
  }

  // 2. Unresolved community reports
  const unresolved = reports.filter((r) => r.status !== 'resolved' && r.status !== 'rejected').length;
  insights.push({
    id: 'unresolved-reports',
    title: 'Pending Incidents Requiring Resolution',
    value: `${unresolved} / ${reports.length}`,
    description: `Community reports in submitted, under review, or mitigation phases awaiting formal sign-off.`,
    scope: scopeDesc,
    type: unresolved > 0 ? 'warning' : 'success',
  });

  // 3. Overdue Prevention Tasks
  const now = referenceDate.getTime();
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'verified' || t.status === 'completed') return false;
    if (!t.deadline) return false;
    const deadlineTime = new Date(t.deadline).getTime();
    return !isNaN(deadlineTime) && deadlineTime < now;
  });

  insights.push({
    id: 'overdue-tasks',
    title: 'Overdue Prevention Interventions',
    value: overdueTasks.length,
    description:
      overdueTasks.length > 0
        ? `Intervention tasks past their mitigation deadline before weather/rain window closure.`
        : 'All active prevention assignments are currently on schedule within their response timeframes.',
    scope: scopeDesc,
    type: overdueTasks.length > 0 ? 'alert' : 'success',
  });

  // 4. Reports Awaiting Verification Review
  const awaitingReview = reports.filter((r) => r.status === 'submitted' || r.status === 'under_review').length;
  insights.push({
    id: 'awaiting-review',
    title: 'Observations Awaiting Review',
    value: awaitingReview,
    description: 'Fresh community observations pending administrator reconnaissance and dispatch verification.',
    scope: scopeDesc,
    type: awaitingReview > 0 ? 'info' : 'success',
  });

  return insights;
}

// ---------------------- CSV & JSON EXPORT UTILITIES ----------------------

/**
 * Escapes CSV field value safely handling commas, quotes, and newlines.
 */
export function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // Strip Base64 image blobs to keep exports small & privacy safe
  if (str.startsWith('data:image')) {
    return '"[Photo Evidence Attached - Omitted for export size & privacy]"';
  }
  // Replace internal quotes with double-quotes
  const escaped = str.replace(/"/g, '""');
  // Always wrap in double quotes for full delimiter safety
  return `"${escaped}"`;
}

/**
 * Generates privacy-safe CSV export for Reports.
 */
export function exportReportsToCsv(
  reports: PollutionReport[],
  options: ExportOptions = { truncateCoordinates: true }
): string {
  const headers = [
    'Report_ID',
    'Category',
    'Title',
    'Description',
    'Severity_1_to_5',
    'Status',
    'Latitude',
    'Longitude',
    'Location_Label',
    'Reporter_Name',
    'Is_Anonymous',
    'Data_Provenance',
    'Observed_At',
    'Created_At',
  ];

  const rows = reports.map((r) => {
    const lat = r.location?.lat !== undefined
      ? options.truncateCoordinates ? Number(r.location.lat).toFixed(2) : r.location.lat
      : '';
    const lng = r.location?.lng !== undefined
      ? options.truncateCoordinates ? Number(r.location.lng).toFixed(2) : r.location.lng
      : '';

    const reporterName = r.isAnonymous ? 'Anonymous Citizen' : (r.reporterName || 'Citizen Contributor');
    const provenance = r.isDemo ? 'Demo Seed Data' : 'Real User Submission';

    return [
      escapeCsvField(r.id),
      escapeCsvField(r.category),
      escapeCsvField(r.title),
      escapeCsvField(r.description),
      escapeCsvField(r.severity),
      escapeCsvField(r.status),
      escapeCsvField(lat),
      escapeCsvField(lng),
      escapeCsvField(r.location?.addressName || 'Unspecified'),
      escapeCsvField(reporterName),
      escapeCsvField(r.isAnonymous ? 'true' : 'false'),
      escapeCsvField(provenance),
      escapeCsvField(r.observedAt || r.createdAt),
      escapeCsvField(r.createdAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates privacy-safe CSV export for Prevention Tasks.
 */
export function exportTasksToCsv(
  tasks: PreventionTask[],
  options: ExportOptions = { truncateCoordinates: true }
): string {
  const headers = [
    'Task_ID',
    'Linked_Report_ID',
    'Category',
    'Priority',
    'Status',
    'Risk_Score_0_to_100',
    'Risk_Level',
    'Title',
    'Description',
    'Assigned_Worker',
    'Deadline',
    'Latitude',
    'Longitude',
    'Location_Label',
    'Data_Provenance',
    'Created_At',
  ];

  const rows = tasks.map((t) => {
    const lat = t.location?.lat !== undefined
      ? options.truncateCoordinates ? Number(t.location.lat).toFixed(2) : t.location.lat
      : '';
    const lng = t.location?.lng !== undefined
      ? options.truncateCoordinates ? Number(t.location.lng).toFixed(2) : t.location.lng
      : '';

    const provenance = t.isDemo ? 'Demo Seed Data' : 'Real Stored Task';
    const workerName = t.assignedTo?.name || 'Unassigned';

    return [
      escapeCsvField(t.id),
      escapeCsvField(t.reportId || ''),
      escapeCsvField(t.category),
      escapeCsvField(t.priority),
      escapeCsvField(t.status),
      escapeCsvField(t.riskScore ?? ''),
      escapeCsvField(t.riskLevel ?? ''),
      escapeCsvField(t.title),
      escapeCsvField(t.description),
      escapeCsvField(workerName),
      escapeCsvField(t.deadline || ''),
      escapeCsvField(lat),
      escapeCsvField(lng),
      escapeCsvField(t.location?.addressName || ''),
      escapeCsvField(provenance),
      escapeCsvField(t.createdAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates structured JSON export with metadata and sanitized records.
 */
export function exportToJson(
  reports: PollutionReport[],
  tasks: PreventionTask[],
  hotspots: EnvironmentalHotspot[],
  metadata: ExportMetadata,
  options: ExportOptions = { truncateCoordinates: true }
): string {
  // Sanitize reports to scrub Base64 images and enforce anonymity
  const sanitizedReports = reports.map((r) => {
    const copy: any = { ...r };
    if (copy.evidenceUrl && copy.evidenceUrl.startsWith('data:image')) {
      copy.evidenceUrl = '[SCRUBBED_BASE64_PHOTO]';
    }
    if (copy.isAnonymous) {
      copy.reporterName = 'Anonymous Citizen';
      delete copy.reporterId;
    }
    if (options.truncateCoordinates && copy.location) {
      copy.location = {
        ...copy.location,
        lat: Number(copy.location.lat).toFixed(2),
        lng: Number(copy.location.lng).toFixed(2),
      };
    }
    return copy;
  });

  const sanitizedTasks = tasks.map((t) => {
    const copy: any = { ...t };
    if (options.truncateCoordinates && copy.location) {
      copy.location = {
        ...copy.location,
        lat: Number(copy.location.lat).toFixed(2),
        lng: Number(copy.location.lng).toFixed(2),
      };
    }
    return copy;
  });

  const exportPayload = {
    metadata: {
      ...metadata,
      exportedAt: new Date().toISOString(),
      privacyGuarantees: [
        'Base64 photo evidence scrubbed to minimize payload size and avoid unconsented visual data exposure.',
        'Anonymous contributors masked as Anonymous Citizen.',
        options.truncateCoordinates ? 'Geographical coordinates rounded to 2 decimal places (~1.1 km neighborhood resolution).' : 'Full-precision coordinates included as requested.',
      ],
    },
    reports: sanitizedReports,
    tasks: sanitizedTasks,
    hotspots: hotspots,
  };

  return JSON.stringify(exportPayload, null, 2);
}
