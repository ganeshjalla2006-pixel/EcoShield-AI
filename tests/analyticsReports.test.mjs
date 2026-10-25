import test from 'node:test';
import assert from 'node:assert/strict';

// Pure analytics helper definitions mirroring src/services/analyticsService.ts for native node:test execution

const ALL_CATEGORIES = [
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

function filterByDateRange(items, range, referenceDate = new Date()) {
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

function filterByProvenance(items, provenance) {
  if (provenance === 'real_only') {
    return items.filter((item) => !item.isDemo);
  }
  if (provenance === 'demo_only') {
    return items.filter((item) => Boolean(item.isDemo));
  }
  return items;
}

function getCategoryDistribution(reports) {
  const counts = {
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
  }));
}

function getReportStatusDistribution(reports) {
  const statuses = [
    'submitted',
    'under_review',
    'verified',
    'action_assigned',
    'action_taken',
    'resolved',
    'rejected',
  ];

  return statuses.map((status) => ({
    status,
    count: reports.filter((r) => r.status === status).length,
  }));
}

function getTaskStatusDistribution(tasks) {
  const statuses = ['pending', 'assigned', 'in_progress', 'completed', 'verified'];
  return statuses.map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));
}

function getTaskPriorityDistribution(tasks) {
  const priorities = ['critical', 'high', 'medium', 'low'];
  return priorities.map((priority) => ({
    priority,
    count: tasks.filter((t) => t.priority === priority).length,
  }));
}

function calculateAnalyticsSummary(reports, tasks, hotspots = [], users = [], referenceDate = new Date()) {
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

  const now = referenceDate.getTime();
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'verified' || t.status === 'completed') return false;
    if (!t.deadline) return false;
    const deadlineTime = new Date(t.deadline).getTime();
    return !isNaN(deadlineTime) && deadlineTime < now;
  }).length;

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

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.startsWith('data:image')) {
    return '"[Photo Evidence Attached - Omitted for export size & privacy]"';
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function exportReportsToCsv(reports, options = { truncateCoordinates: true }) {
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
      escapeCsvField(r.createdAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

function exportToJson(reports, tasks, metadata, options = { truncateCoordinates: true }) {
  const sanitizedReports = reports.map((r) => {
    const copy = { ...r };
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

  return JSON.stringify({ metadata, reports: sanitizedReports, tasks }, null, 2);
}

// ---------------------- TEST SUITE ----------------------

test('Analytics & Reports - Aggregates all 9 standardized pollution categories accurately', () => {
  const reports = [
    { id: '1', category: 'plastic', status: 'submitted' },
    { id: '2', category: 'plastic', status: 'verified' },
    { id: '3', category: 'water', status: 'action_taken' },
    { id: '4', category: 'air', status: 'under_review' },
    { id: '5', category: 'noise', status: 'submitted' },
  ];

  const distribution = getCategoryDistribution(reports);

  assert.equal(distribution.length, 9, 'Must represent all 9 standardized categories');
  
  const plastic = distribution.find((d) => d.category === 'plastic');
  assert.equal(plastic.count, 2);
  assert.equal(plastic.percentage, 40); // 2/5 = 40%

  const water = distribution.find((d) => d.category === 'water');
  assert.equal(water.count, 1);
  assert.equal(water.percentage, 20); // 1/5 = 20%

  const radioactive = distribution.find((d) => d.category === 'radioactive');
  assert.equal(radioactive.count, 0);
  assert.equal(radioactive.percentage, 0);
});

test('Analytics & Reports - Aggregates reports by status correctly', () => {
  const reports = [
    { id: '1', status: 'submitted' },
    { id: '2', status: 'submitted' },
    { id: '3', status: 'under_review' },
    { id: '4', status: 'verified' },
    { id: '5', status: 'resolved' },
    { id: '6', status: 'resolved' },
  ];

  const statusDist = getReportStatusDistribution(reports);
  const submitted = statusDist.find((s) => s.status === 'submitted');
  const resolved = statusDist.find((s) => s.status === 'resolved');
  const rejected = statusDist.find((s) => s.status === 'rejected');

  assert.equal(submitted.count, 2);
  assert.equal(resolved.count, 2);
  assert.equal(rejected.count, 0);
});

test('Analytics & Reports - Real-versus-demo provenance filtering', () => {
  const reports = [
    { id: 'R1', title: 'Citizen Drain Blockage', isDemo: false },
    { id: 'R2', title: 'Citizen Air Plume', isDemo: false },
    { id: 'R3', title: 'Seed Water Culvert', isDemo: true },
    { id: 'R4', title: 'Seed Noise Pile', isDemo: true },
  ];

  const all = filterByProvenance(reports, 'all');
  const realOnly = filterByProvenance(reports, 'real_only');
  const demoOnly = filterByProvenance(reports, 'demo_only');

  assert.equal(all.length, 4);
  assert.equal(realOnly.length, 2);
  assert.ok(realOnly.every((r) => r.isDemo === false));
  assert.equal(demoOnly.length, 2);
  assert.ok(demoOnly.every((r) => r.isDemo === true));
});

test('Analytics & Reports - Date range filtering and handles invalid or missing timestamps safely', () => {
  const refDate = new Date('2026-10-25T00:00:00Z');

  const items = [
    { id: '1', createdAt: '2026-10-24T12:00:00Z' }, // 1 day ago (in 7d)
    { id: '2', createdAt: '2026-10-15T00:00:00Z' }, // 10 days ago (in 30d, not in 7d)
    { id: '3', createdAt: '2026-08-10T00:00:00Z' }, // ~75 days ago (in 90d, not in 30d)
    { id: '4', createdAt: '2025-01-01T00:00:00Z' }, // ~1.5 years ago (only in 'all')
    { id: '5', createdAt: 'invalid-date-string' },   // Malformed
    { id: '6', createdAt: null },                   // Null
  ];

  const in7d = filterByDateRange(items, '7d', refDate);
  const in30d = filterByDateRange(items, '30d', refDate);
  const in90d = filterByDateRange(items, '90d', refDate);
  const inAll = filterByDateRange(items, 'all', refDate);

  assert.equal(in7d.length, 1);
  assert.equal(in7d[0].id, '1');

  assert.equal(in30d.length, 2);
  assert.equal(in90d.length, 3);
  assert.equal(inAll.length, 6, 'All filter must retain all records including missing timestamps');
});

test('Analytics & Reports - Resilient against empty datasets with zero-division protection', () => {
  const emptyReports = [];
  const emptyTasks = [];
  const emptyHotspots = [];
  const emptyUsers = [];

  const summary = calculateAnalyticsSummary(emptyReports, emptyTasks, emptyHotspots, emptyUsers);

  assert.equal(summary.totalReports, 0);
  assert.equal(summary.realUserReportsCount, 0);
  assert.equal(summary.totalTasks, 0);
  assert.equal(summary.totalEcoPointsEarned, 0);
  assert.equal(summary.overdueTasksCount, 0);

  const catDist = getCategoryDistribution(emptyReports);
  assert.equal(catDist.length, 9);
  assert.ok(catDist.every((c) => c.count === 0 && c.percentage === 0));
});

test('Analytics & Reports - Accurately calculates task status, priority, and overdue counts', () => {
  const refDate = new Date('2026-10-25T12:00:00Z');

  const tasks = [
    // Overdue: pending and deadline in past
    { id: 'T1', priority: 'critical', status: 'pending', deadline: '2026-10-24T12:00:00Z', isDemo: false },
    // Overdue: assigned and deadline in past
    { id: 'T2', priority: 'high', status: 'assigned', deadline: '2026-10-20T12:00:00Z', isDemo: false },
    // NOT overdue: completed before deadline or even if deadline past because it's completed
    { id: 'T3', priority: 'high', status: 'completed', deadline: '2026-10-20T12:00:00Z', isDemo: true },
    // NOT overdue: verified
    { id: 'T4', priority: 'medium', status: 'verified', deadline: '2026-10-20T12:00:00Z', isDemo: true },
    // NOT overdue: future deadline
    { id: 'T5', priority: 'low', status: 'in_progress', deadline: '2026-10-30T12:00:00Z', isDemo: false },
  ];

  const summary = calculateAnalyticsSummary([], tasks, [], [], refDate);

  assert.equal(summary.totalTasks, 5);
  assert.equal(summary.openTasksCount, 1);
  assert.equal(summary.assignedTasksCount, 1);
  assert.equal(summary.inProgressTasksCount, 1);
  assert.equal(summary.awaitingVerificationCount, 1);
  assert.equal(summary.verifiedTasksCount, 1);
  assert.equal(summary.overdueTasksCount, 2, 'Only uncompleted/unverified tasks with past deadlines are overdue');

  const priorityDist = getTaskPriorityDistribution(tasks);
  assert.equal(priorityDist.find((p) => p.priority === 'critical').count, 1);
  assert.equal(priorityDist.find((p) => p.priority === 'high').count, 2);
  assert.equal(priorityDist.find((p) => p.priority === 'low').count, 1);
});

test('Analytics & Reports - CSV escaping safely handles commas, double-quotes, newlines, and scrubs Base64 photos', () => {
  // Test escapeCsvField
  assert.equal(escapeCsvField('Clean string'), '"Clean string"');
  assert.equal(escapeCsvField('Title with, comma'), '"Title with, comma"');
  assert.equal(escapeCsvField('Quote "test" phrase'), '"Quote ""test"" phrase"');
  assert.equal(escapeCsvField('Line 1\nLine 2'), '"Line 1\nLine 2"');
  assert.equal(escapeCsvField(null), '""');
  assert.equal(escapeCsvField(undefined), '""');

  // Base64 photo scrubbing
  const base64Sample = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';
  const scrubbed = escapeCsvField(base64Sample);
  assert.ok(scrubbed.includes('[Photo Evidence Attached - Omitted for export size & privacy]'));
  assert.ok(!scrubbed.includes('base64,/9j/4AAQSk'));
});

test('Analytics & Reports - Generates privacy-safe CSV with masked coordinates and anonymous reporter protection', () => {
  const reports = [
    {
      id: 'REP-01',
      category: 'plastic',
      title: 'Chemical drums, leaking',
      description: 'Line 1\nLine 2 with "double quotes"',
      severity: 5,
      status: 'verified',
      location: { lat: 28.613945, lng: 77.209012, addressName: 'Industrial Culvert #4' },
      reporterName: 'Ananya Sharma',
      isAnonymous: false,
      isDemo: false,
      createdAt: '2026-10-24T10:00:00Z',
    },
    {
      id: 'REP-02',
      category: 'water',
      title: 'Acidic runoff',
      description: 'Runoff plume',
      severity: 4,
      status: 'submitted',
      location: { lat: 17.385011, lng: 78.486712, addressName: 'Canal Junction' },
      reporterName: 'Vikram Mehta',
      isAnonymous: true, // Anonymous report
      isDemo: true,
      createdAt: '2026-10-24T11:00:00Z',
    },
  ];

  const csv = exportReportsToCsv(reports, { truncateCoordinates: true });

  // 1. Verify headers
  assert.ok(csv.startsWith('Report_ID,Category,Title,Description'));

  // 2. Verify delimiter & quote escaping
  assert.ok(csv.includes('"Chemical drums, leaking"'));
  assert.ok(csv.includes('""double quotes""'));

  // 3. Verify coordinate truncation (28.61, 77.21) for privacy
  assert.ok(csv.includes('"28.61"'));
  assert.ok(csv.includes('"77.21"'));
  assert.ok(!csv.includes('28.613945'));

  // 4. Verify anonymous reporter protection
  assert.ok(csv.includes('"Anonymous Citizen"'));
  assert.ok(csv.includes('Demo Seed Data'));
  assert.ok(csv.includes('Real User Submission'));
});

test('Analytics & Reports - Structured JSON export includes metadata, filter provenance, and scrubbed payload', () => {
  const reports = [
    {
      id: 'R1',
      title: 'Discolored Creek Water',
      evidenceUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      isAnonymous: true,
      reporterId: 'user_private_999',
      location: { lat: 28.6139, lng: 77.2090 },
      isDemo: false,
    },
  ];

  const tasks = [
    { id: 'T1', title: 'Emergency Neutralization', location: { lat: 28.6139, lng: 77.2090 } },
  ];

  const metadata = {
    exportedAt: '2026-10-25T01:30:00Z',
    platform: 'EcoShield AI',
    filterState: { timeframe: '30d', provenance: 'all', category: 'all', status: 'all' },
    reportsCount: 1,
    tasksCount: 1,
  };

  const jsonStr = exportToJson(reports, tasks, metadata, { truncateCoordinates: true });
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.metadata.platform, 'EcoShield AI');
  assert.equal(parsed.reports.length, 1);
  assert.equal(parsed.reports[0].evidenceUrl, '[SCRUBBED_BASE64_PHOTO]', 'Base64 image must be scrubbed in JSON export');
  assert.equal(parsed.reports[0].reporterName, 'Anonymous Citizen');
  assert.equal(parsed.reports[0].reporterId, undefined, 'Private reporterId must be removed for anonymous reports');
  assert.equal(parsed.reports[0].location.lat, '28.61', 'Coordinates must be truncated to 2 decimals for privacy');
});

test('Analytics & Reports - Consistency between filters, summary KPIs, and chart aggregations', () => {
  const reports = [
    { id: '1', category: 'plastic', status: 'verified', isDemo: false, createdAt: '2026-10-24T10:00:00Z' },
    { id: '2', category: 'plastic', status: 'submitted', isDemo: false, createdAt: '2026-10-24T11:00:00Z' },
    { id: '3', category: 'water', status: 'resolved', isDemo: true, createdAt: '2026-10-24T12:00:00Z' },
    { id: '4', category: 'air', status: 'under_review', isDemo: true, createdAt: '2026-10-01T12:00:00Z' },
  ];

  // Filter: Real only within 7 days
  const filtered = filterByProvenance(reports, 'real_only');
  const filtered7d = filterByDateRange(filtered, '7d', new Date('2026-10-25T00:00:00Z'));

  assert.equal(filtered7d.length, 2);

  // Category distribution sum must match filtered count exactly
  const catDist = getCategoryDistribution(filtered7d);
  const totalInCats = catDist.reduce((acc, c) => acc + c.count, 0);
  assert.equal(totalInCats, filtered7d.length);

  // Status distribution sum must match filtered count exactly
  const statusDist = getReportStatusDistribution(filtered7d);
  const totalInStatuses = statusDist.reduce((acc, s) => acc + s.count, 0);
  assert.equal(totalInStatuses, filtered7d.length);
});
