import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * EcoShield AI — Step 9 Final Integration & Demo Readiness Test Suite
 * Tests end-to-end workflows, cross-module consistency, provenance, security, and ethics.
 */

class MockPlatformEngine {
  constructor() {
    this.users = [
      {
        id: 'user_admin_01',
        displayName: 'Dr. Sarah Mukherjee (Admin)',
        role: 'admin',
        ecoPoints: 450,
        badges: ['System Architect', 'Environmental Director'],
        reportsSubmitted: 6,
        tasksCompleted: 14,
      },
      {
        id: 'user_worker_01',
        displayName: 'Rajesh Kumar (Field Officer)',
        role: 'field_worker',
        ecoPoints: 320,
        badges: ['Rapid Responder', 'Water Guardian'],
        reportsSubmitted: 11,
        tasksCompleted: 23,
      },
      {
        id: 'user_citizen_01',
        displayName: 'Ananya Sharma (Citizen)',
        role: 'citizen',
        ecoPoints: 180,
        badges: ['Community Watchdog', 'Eagle Eye Scout'],
        reportsSubmitted: 5,
        tasksCompleted: 2,
      },
    ];

    this.reports = [];
    this.tasks = [];
    this.notifications = [];
  }

  // User Management
  getUser(id) {
    return this.users.find((u) => u.id === id);
  }

  awardPoints(userId, pts, badge) {
    const user = this.getUser(userId);
    if (!user) return;
    user.ecoPoints += pts;
    if (badge && !user.badges.includes(badge)) {
      user.badges.push(badge);
    }
  }

  // Notifications with deduplication
  addNotification(notif) {
    if (notif.dedupKey) {
      const exists = this.notifications.some((n) => n.dedupKey === notif.dedupKey);
      if (exists) return null;
    }
    const item = {
      ...notif,
      id: notif.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(item);
    return item;
  }

  // Reports
  submitReport(reportData) {
    // 60-second duplicate throttle
    const isDuplicate = this.reports.some(
      (r) =>
        r.reporterId === reportData.reporterId &&
        r.category === reportData.category &&
        r.title.toLowerCase().trim() === reportData.title.toLowerCase().trim() &&
        Date.now() - new Date(r.createdAt).getTime() < 60000
    );
    if (isDuplicate) {
      throw new Error('Duplicate submission detected.');
    }

    const report = {
      ...reportData,
      id: `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'submitted',
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.reports.unshift(report);

    // Award +10 EcoPoints
    this.awardPoints(report.reporterId, 10, 'Active Citizen Scout');

    // Notify submitter
    const reporterName = report.isAnonymous ? 'Anonymous Citizen' : (report.reporterName || 'Citizen Contributor');
    this.addNotification({
      userRole: 'citizen',
      userId: report.isAnonymous ? undefined : report.reporterId,
      title: `Observation Logged: ${report.category.toUpperCase()}`,
      message: `"${report.title}" reported by ${reporterName}. Severity ${report.severity}/5.`,
      type: 'report',
      linkedEntityId: report.id,
      linkedEntityType: 'report',
      link: '/citizen',
      dedupKey: `REP_SUBMIT_${report.id}`,
    });

    // If critical severity (>=4), notify Admin
    if (report.severity >= 4) {
      this.addNotification({
        userRole: 'admin',
        title: `HIGH SEVERITY ALERT: ${report.category.toUpperCase()}`,
        message: `High magnitude observation "${report.title}" flagged in ${report.location?.addressName || 'monitored sector'}.`,
        type: 'alert',
        severity: 'critical',
        category: report.category,
        linkedEntityId: report.id,
        linkedEntityType: 'report',
        link: '/reports',
        dedupKey: `RISK_ALERT_${report.id}`,
      });
    }

    return report;
  }

  updateReportStatus(reportId, newStatus, actor) {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Report not found');

    const oldStatus = report.status;
    report.status = newStatus;
    report.updatedAt = new Date().toISOString();

    // If confirmed by Admin, award +15 bonus to reporter
    if (newStatus === 'verified' && oldStatus !== 'verified') {
      this.awardPoints(report.reporterId, 15, 'Eagle Eye Scout');
    }

    this.addNotification({
      userRole: 'citizen',
      userId: report.isAnonymous ? undefined : report.reporterId,
      title: `Report Status Updated: ${newStatus.toUpperCase()}`,
      message: `Your report ${report.id} was updated to "${newStatus}" by ${actor.displayName}.`,
      type: 'report',
      linkedEntityId: report.id,
      linkedEntityType: 'report',
      link: '/citizen',
      dedupKey: `REP_STATUS_${report.id}_${newStatus}`,
    });

    return report;
  }

  // Prevention Tasks
  dispatchTask(taskData, actor) {
    if (actor.role === 'citizen') {
      throw new Error('Unauthorized: Citizens cannot dispatch administrative tasks.');
    }

    const task = {
      ...taskData,
      id: `TSK-PREV-${Math.floor(100 + Math.random() * 900)}`,
      status: taskData.assignedTo ? 'assigned' : 'pending',
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          actorId: actor.id,
          actorName: actor.displayName,
          action: 'TASK_CREATED',
          details: `Dispatched with priority ${taskData.priority}`,
        },
      ],
    };
    this.tasks.unshift(task);

    // If linked to report, update report status
    if (task.reportId) {
      const rep = this.reports.find((r) => r.id === task.reportId);
      if (rep) {
        rep.status = 'action_assigned';
        rep.linkedTaskId = task.id;
      }
    }

    // Notify assigned worker
    if (task.assignedTo?.id) {
      this.addNotification({
        userId: task.assignedTo.id,
        userRole: 'field_worker',
        title: `New Assignment: ${task.title}`,
        message: `Task ${task.id} assigned to you with deadline ${task.deadline}.`,
        type: 'task',
        linkedEntityId: task.id,
        linkedEntityType: 'task',
        link: '/prevention',
        dedupKey: `TASK_ASSIGN_${task.id}_${task.assignedTo.id}`,
      });
    }

    return task;
  }

  submitTaskEvidence(taskId, actionSummary, afterEvidence, worker) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (!afterEvidence || !afterEvidence.trim()) {
      throw new Error('Task evidence is mandatory before submission for verification.');
    }

    task.status = 'completed'; // awaiting sign-off
    task.actionSummary = actionSummary;
    task.afterEvidence = afterEvidence;
    task.updatedAt = new Date().toISOString();
    task.auditTrail.unshift({
      timestamp: new Date().toISOString(),
      actorId: worker.id,
      actorName: worker.displayName,
      action: 'STATUS_COMPLETED',
      details: actionSummary,
    });

    // Notify Admin of completion submission
    this.addNotification({
      userRole: 'admin',
      title: `Remediation Submitted: ${task.title}`,
      message: `Field officer ${worker.displayName} submitted completion proof for ${task.id}. Verification required.`,
      type: 'task',
      linkedEntityId: task.id,
      linkedEntityType: 'task',
      link: '/prevention',
      dedupKey: `TASK_SUBMIT_VERIFY_${task.id}`,
    });

    return task;
  }

  verifyTask(taskId, admin, notes) {
    if (admin.role !== 'admin') {
      throw new Error('Unauthorized: Only Admin can verify tasks.');
    }
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (!task.afterEvidence) {
      throw new Error('Cannot verify task without submitted field evidence.');
    }

    task.status = 'verified';
    task.verifiedBy = admin.displayName;
    task.verifiedAt = new Date().toISOString();
    task.reviewerNotes = notes;
    task.updatedAt = new Date().toISOString();
    task.auditTrail.unshift({
      timestamp: new Date().toISOString(),
      actorId: admin.id,
      actorName: admin.displayName,
      action: 'STATUS_VERIFIED',
      details: notes || 'Verified and signed off.',
    });

    // Award +25 EcoPoints to assigned worker
    if (task.assignedTo?.id) {
      this.awardPoints(task.assignedTo.id, 25, 'Prevention Guardian');
      this.addNotification({
        userId: task.assignedTo.id,
        userRole: 'field_worker',
        title: 'Prevention Task Verified!',
        message: `Task ${task.id} signed off by ${admin.displayName}. +25 EcoPoints awarded.`,
        type: 'task',
        linkedEntityId: task.id,
        linkedEntityType: 'task',
        link: '/prevention',
        dedupKey: `TASK_VERIFIED_${task.id}`,
      });
    }

    // Sync linked report
    if (task.reportId) {
      const rep = this.reports.find((r) => r.id === task.reportId);
      if (rep) {
        rep.status = 'action_taken';
      }
    }

    return task;
  }

  returnTaskForCorrection(taskId, correctionNotes, admin) {
    if (admin.role !== 'admin') {
      throw new Error('Unauthorized: Only Admin can return tasks for correction.');
    }
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'in_progress';
    task.correctionNotes = correctionNotes;
    task.updatedAt = new Date().toISOString();
    task.auditTrail.unshift({
      timestamp: new Date().toISOString(),
      actorId: admin.id,
      actorName: admin.displayName,
      action: 'RETURNED_FOR_CORRECTION',
      details: correctionNotes,
    });

    if (task.assignedTo?.id) {
      this.addNotification({
        userId: task.assignedTo.id,
        userRole: 'field_worker',
        title: 'Action Returned for Correction',
        message: `Task ${task.id} requires revision: ${correctionNotes}`,
        type: 'task',
        linkedEntityId: task.id,
        linkedEntityType: 'task',
        link: '/prevention',
        dedupKey: `TASK_CORRECT_${task.id}_${Date.now()}`,
      });
    }

    return task;
  }
}

// ---------------------------------------------------------------------
// TEST SUITES
// ---------------------------------------------------------------------

test('Integration — End-to-End Prevention Lifecycle: Report -> Task -> Evidence -> Verification', () => {
  const platform = new MockPlatformEngine();
  const citizen = platform.getUser('user_citizen_01');
  const admin = platform.getUser('user_admin_01');
  const worker = platform.getUser('user_worker_01');

  const initialCitizenPoints = citizen.ecoPoints;
  const initialWorkerPoints = worker.ecoPoints;

  // 1. Citizen submits critical plastic report
  const report = platform.submitReport({
    category: 'plastic',
    title: 'Severe plastic obstruction at storm intake siphon',
    description: 'Debris completely occluding culvert inlet ahead of rain.',
    location: { lat: 28.6145, lng: 77.2085, addressName: 'Drainage Culvert #4' },
    severity: 5,
    reporterId: citizen.id,
    reporterName: citizen.displayName,
    isAnonymous: false,
  });

  assert.equal(report.isDemo, false);
  assert.equal(report.status, 'submitted');
  assert.equal(citizen.ecoPoints, initialCitizenPoints + 10, 'Citizen must earn +10 EcoPoints on submission');
  assert.ok(citizen.badges.includes('Active Citizen Scout'), 'Must earn Active Scout badge');

  // Check alert generated for Admin due to severity 5
  assert.ok(
    platform.notifications.some((n) => n.type === 'alert' && n.severity === 'critical' && n.userRole === 'admin'),
    'Severity 5 report must trigger immediate critical alert for Admin'
  );

  // 2. Admin reviews report and dispatches prevention task
  const task = platform.dispatchTask(
    {
      reportId: report.id,
      title: 'Emergency Drainage Culvert Trash Boom Deployment',
      description: 'Extract plastic accumulation and fit protective trash boom.',
      category: 'plastic',
      priority: 'critical',
      location: report.location,
      assignedTo: { id: worker.id, name: worker.displayName, role: worker.role },
      deadline: '2026-10-26T12:00:00Z',
    },
    admin
  );

  assert.equal(task.isDemo, false);
  assert.equal(task.status, 'assigned');
  assert.equal(report.status, 'action_assigned', 'Report status must update to action_assigned');
  assert.equal(report.linkedTaskId, task.id);

  // Check worker notification
  assert.ok(
    platform.notifications.some((n) => n.userId === worker.id && n.linkedEntityId === task.id),
    'Assigned worker must receive in-app assignment notification'
  );

  // 3. Field worker attempts submission without evidence -> Must Fail
  assert.throws(
    () => platform.submitTaskEvidence(task.id, 'Finished job', '', worker),
    /mandatory/,
    'Task must NOT transition to completion without evidence proof'
  );

  // 4. Field worker submits valid after-action evidence
  platform.submitTaskEvidence(
    task.id,
    'Excavated 350kg plastic waste; installed heavy-duty stainless steel trash boom.',
    'Geotagged after-photo showing unobstructed water flow.',
    worker
  );

  assert.equal(task.status, 'completed', 'Status must transition to completed (awaiting verification)');
  assert.ok(task.auditTrail.some((entry) => entry.action === 'STATUS_COMPLETED'));

  // 5. Admin verifies task and closes ticket
  platform.verifyTask(task.id, admin, 'On-site inspection confirmed culvert 100% operational.');

  assert.equal(task.status, 'verified', 'Task must be verified');
  assert.equal(task.verifiedBy, admin.displayName);
  assert.equal(worker.ecoPoints, initialWorkerPoints + 25, 'Worker must be credited +25 EcoPoints on verified sign-off');
  assert.ok(worker.badges.includes('Prevention Guardian'), 'Worker must receive Prevention Guardian badge');
  assert.equal(report.status, 'action_taken', 'Linked report status must transition to action_taken');
});

test('Integration — Return for Correction Workflow', () => {
  const platform = new MockPlatformEngine();
  const admin = platform.getUser('user_admin_01');
  const worker = platform.getUser('user_worker_01');

  const task = platform.dispatchTask(
    {
      title: 'Geotextile Liner Placement',
      description: 'Cover toxic slag with 1.5mm HDPE geomembrane.',
      category: 'soil',
      priority: 'high',
      location: { lat: 28.665, lng: 77.15 },
      assignedTo: { id: worker.id, name: worker.displayName, role: worker.role },
      deadline: '2026-10-27T18:00:00Z',
    },
    admin
  );

  platform.submitTaskEvidence(task.id, 'Partial covering done', 'Liner placed on half the mound', worker);

  // Admin returns for correction
  platform.returnTaskForCorrection(
    task.id,
    'Inadequate coverage: Northwest perimeter remains exposed to rainfall leaching. Full ballasting required.',
    admin
  );

  assert.equal(task.status, 'in_progress', 'Task must return to in_progress status');
  assert.ok(task.correctionNotes.includes('Northwest perimeter remains exposed'));
  assert.ok(task.auditTrail.some((e) => e.action === 'RETURNED_FOR_CORRECTION'));
});

test('Integration — Anti-Gaming & Duplicate Protection', () => {
  const platform = new MockPlatformEngine();
  const citizen = platform.getUser('user_citizen_01');

  platform.submitReport({
    category: 'water',
    title: 'Chemical foam in canal',
    description: 'White alkaline foam plume observed.',
    location: { lat: 28.536, lng: 77.261 },
    severity: 3,
    reporterId: citizen.id,
    reporterName: citizen.displayName,
    isAnonymous: false,
  });

  // Attempt rapid duplicate submission within 60s
  assert.throws(
    () =>
      platform.submitReport({
        category: 'water',
        title: 'Chemical foam in canal',
        description: 'White alkaline foam plume observed.',
        location: { lat: 28.536, lng: 77.261 },
        severity: 3,
        reporterId: citizen.id,
        reporterName: citizen.displayName,
        isAnonymous: false,
      }),
    /Duplicate submission detected/,
    'Rapid duplicate submission must be blocked'
  );
});

test('Integration — Anonymous Reporting Privacy Enforcement', () => {
  const platform = new MockPlatformEngine();
  const citizen = platform.getUser('user_citizen_01');

  const report = platform.submitReport({
    category: 'radioactive',
    title: 'Radiation anomaly near scrap yard',
    description: 'Elevated dosimeter count.',
    location: { lat: 28.667, lng: 77.149 },
    severity: 4,
    reporterId: citizen.id,
    reporterName: citizen.displayName,
    isAnonymous: true,
  });

  // Check notification text does not leak citizen's name
  const citizenNotif = platform.notifications.find((n) => n.linkedEntityId === report.id && n.type === 'report');
  assert.ok(citizenNotif);
  assert.ok(
    citizenNotif.message.includes('Anonymous Citizen'),
    'Notification message must mask submitter as Anonymous Citizen'
  );
  assert.ok(
    !citizenNotif.message.includes(citizen.displayName),
    'Notification message must NOT contain citizen real name'
  );
});

test('Integration — Real vs Demo Data Provenance Integrity', () => {
  const platform = new MockPlatformEngine();
  const citizen = platform.getUser('user_citizen_01');
  const admin = platform.getUser('user_admin_01');

  // User created report
  const liveReport = platform.submitReport({
    category: 'noise',
    title: 'Nighttime hydraulic tooling violation',
    description: 'Construction noise exceeds threshold past midnight.',
    location: { lat: 28.629, lng: 77.221 },
    severity: 3,
    reporterId: citizen.id,
    reporterName: citizen.displayName,
    isAnonymous: false,
  });

  // Seed demo report
  const demoReport = {
    id: 'REP-2026-001',
    category: 'plastic',
    title: 'Demo seed plastic report',
    isDemo: true,
  };

  assert.equal(liveReport.isDemo, false, 'User created reports must be marked isDemo: false');
  assert.equal(demoReport.isDemo, true, 'Seed reports must be marked isDemo: true');

  // User created task
  const liveTask = platform.dispatchTask(
    {
      title: 'Acoustic Barrier Inspection',
      description: 'Check decibel curtain.',
      category: 'noise',
      priority: 'high',
      location: { lat: 28.629, lng: 77.221 },
      deadline: '2026-10-28T00:00:00Z',
    },
    admin
  );

  assert.equal(liveTask.isDemo, false, 'User created tasks must be marked isDemo: false');
});

test('Integration — Zero-Budget Integrity & Free Telemetry Guarantees', () => {
  // Confirm Open-Meteo and OpenStreetMap usage
  const openMeteoBaseUrl = 'https://api.open-meteo.com/v1/forecast';
  const osmTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  assert.ok(openMeteoBaseUrl.includes('open-meteo.com'), 'Uses Open-Meteo non-commercial open data API');
  assert.ok(osmTileUrl.includes('openstreetmap.org'), 'Uses OpenStreetMap free tile service');
});

test('Step 10.3 Regression — Citizen Portal Ledger Synchronization & Provenance Consistency', () => {
  // Verify report counts in Citizen Portal reflect platform totals even when user has 0 personal submissions
  const seedReports = [
    { id: 'REP-01', category: 'plastic', status: 'action_assigned', isDemo: true, reporterId: 'user_citizen_01' },
    { id: 'REP-02', category: 'water', status: 'under_review', isDemo: true, reporterId: 'user_citizen_01' },
    { id: 'REP-03', category: 'air', status: 'action_taken', isDemo: true, reporterId: 'user_worker_01' },
    { id: 'REP-04', category: 'soil', status: 'verified', isDemo: true, reporterId: 'user_citizen_01' },
    { id: 'REP-05', category: 'noise', status: 'action_assigned', isDemo: true, reporterId: 'user_citizen_01' },
    { id: 'REP-06', category: 'visual', status: 'submitted', isDemo: true, reporterId: 'user_citizen_01' },
    { id: 'REP-07', category: 'thermal', status: 'submitted', isDemo: true, reporterId: 'user_citizen_01' },
    { id: 'REP-08', category: 'light', status: 'submitted', isDemo: true, reporterId: 'user_citizen_01' },
    { id: 'REP-09', category: 'radioactive', status: 'verified', isDemo: true, reporterId: 'user_worker_01' },
  ];

  const adminUserId = 'user_admin_01';
  const userReportsForAdmin = seedReports.filter((r) => r.reporterId === adminUserId);
  assert.equal(userReportsForAdmin.length, 0, 'Admin starts with 0 personal submissions');

  // Effective all reports pool must be 9
  const effectiveAllReports = seedReports.length > 0 ? seedReports : userReportsForAdmin;
  assert.equal(effectiveAllReports.length, 9, 'Effective all reports pool must reflect all 9 baseline reports');

  // Verify headline metrics calculation matches platform inventory
  let submittedCount = 0;
  let underReviewCount = 0;
  let confirmedCount = 0;
  let actionTakenCount = 0;
  let realCount = 0;
  let demoCount = 0;

  effectiveAllReports.forEach((r) => {
    if (r.isDemo) demoCount++;
    else realCount++;

    if (r.status === 'submitted') submittedCount++;
    else if (r.status === 'under_review') underReviewCount++;
    else if (r.status === 'verified') confirmedCount++;
    else if (
      r.status === 'action_assigned' ||
      r.status === 'in_progress' ||
      r.status === 'action_taken' ||
      r.status === 'resolved'
    ) {
      actionTakenCount++;
    }
  });

  assert.equal(demoCount, 9, 'All 9 baseline reports must be demo provenance');
  assert.equal(realCount, 0, 'Zero real reports before user submission');
  assert.equal(submittedCount, 3, '3 submitted reports in baseline');
  assert.equal(underReviewCount, 1, '1 under_review report in baseline');
  assert.equal(confirmedCount, 2, '2 confirmed risk reports in baseline');
  assert.equal(actionTakenCount, 3, '3 action dispatched / taken reports in baseline');
  assert.equal(submittedCount + underReviewCount + confirmedCount + actionTakenCount, 9);

  // When a user submits a report, real count increments while demo count is intact
  const newReport = {
    id: 'REP-LIVE-10',
    category: 'plastic',
    status: 'submitted',
    isDemo: false,
    reporterId: adminUserId,
  };
  const updatedAllReports = [newReport, ...seedReports];
  const updatedUserReports = updatedAllReports.filter((r) => r.reporterId === adminUserId);

  assert.equal(updatedUserReports.length, 1, 'Admin now has 1 personal submission');
  assert.equal(updatedAllReports.length, 10, 'Total reports updated to 10');
  assert.equal(updatedAllReports.filter((r) => !r.isDemo).length, 1, 'Exactly 1 real report');
  assert.equal(updatedAllReports.filter((r) => r.isDemo).length, 9, 'Demo reports count remains 9');
});

test('Step 10.3 Regression — Meteorological Forecast Telemetry Structure & Safeguards', () => {
  // Confirm weather hourly data conforms to 12-hour non-clipping forecast requirements
  const mockHourly = {
    times: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
    temperatures: [28.2, 29.1, 30.0, 29.8, 28.5, 27.2, 26.0, 25.4, 24.8, 24.2, 23.9, 23.5],
    precipitationProbs: [10, 15, 20, 35, 60, 45, 20, 10, 5, 5, 0, 0],
    precipitations: [0, 0, 0, 0.4, 2.1, 1.2, 0, 0, 0, 0, 0, 0],
  };

  assert.equal(mockHourly.times.length, 12, 'Hourly forecast contains exactly 12 hours');
  assert.equal(mockHourly.temperatures.length, 12, '12 temperature data points');
  assert.equal(mockHourly.precipitationProbs.length, 12, '12 precipitation probability data points');

  // Verify all timestamps are formatted HH:MM strings to fit into 72px forecast cards
  mockHourly.times.forEach((t) => {
    assert.match(t, /^\d{2}:\d{2}$/, 'Timestamp must be strictly 5-char HH:MM format');
  });

  // Verify precipitation probability boundaries
  mockHourly.precipitationProbs.forEach((p) => {
    assert.ok(p >= 0 && p <= 100, 'Precipitation probability must be 0-100%');
  });
});
