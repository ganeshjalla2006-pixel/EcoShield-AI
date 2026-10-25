import test from 'node:test';
import assert from 'node:assert/strict';

// Citizen Portal & Pollution Reporting Engine test suite
class CitizenReportingEngine {
  constructor() {
    this.reports = [];
    this.tasks = [];
    this.users = [
      { id: 'citizen_1', displayName: 'Ananya Sharma', role: 'citizen', ecoPoints: 100, badges: ['Active Citizen Scout'] },
      { id: 'citizen_2', displayName: 'Vikram Mehta', role: 'citizen', ecoPoints: 40, badges: [] },
      { id: 'worker_1', displayName: 'Rajesh Kumar', role: 'field_worker', ecoPoints: 320, badges: ['Rapid Responder'] },
      { id: 'admin_1', displayName: 'Dr. Sarah Mukherjee', role: 'admin', ecoPoints: 450, badges: ['Eagle Eye Scout'] },
    ];
    this.validCategories = [
      'air',
      'water',
      'soil',
      'noise',
      'light',
      'thermal',
      'plastic',
      'radioactive',
      'visual',
    ];
    this.recentSubmissionFingerprints = new Map();
  }

  submitReport(input, actor) {
    // 1. Validation checks
    if (!input.title || input.title.trim().length < 5) {
      throw new Error('Validation failed: Report title must be at least 5 characters long.');
    }
    if (!input.description || input.description.trim().length < 10) {
      throw new Error('Validation failed: Description must be at least 10 characters long.');
    }
    if (!this.validCategories.includes(input.category)) {
      throw new Error(`Validation failed: Invalid pollution category '${input.category}'. Must be one of 9 standardized categories.`);
    }
    if (typeof input.severity !== 'number' || input.severity < 1 || input.severity > 5) {
      throw new Error('Validation failed: Severity rating must be an integer between 1 and 5.');
    }
    if (!input.location || typeof input.location.lat !== 'number' || typeof input.location.lng !== 'number') {
      throw new Error('Validation failed: Valid geographical coordinates (lat, lng) are required.');
    }

    // 2. Anti-spam / Duplicate prevention (prevents reward gaming within 60 seconds)
    const now = Date.now();
    const fingerprint = `${actor.id}-${input.category}-${input.title.trim().toLowerCase()}`;
    const lastSubmitted = this.recentSubmissionFingerprints.get(fingerprint);
    if (lastSubmitted && now - lastSubmitted < 60000) {
      throw new Error('Duplicate report detected: You recently submitted an identical report. Please wait before submitting again.');
    }

    // 3. Construct report object
    const report = {
      id: `REP-${now}-${Math.floor(Math.random() * 1000)}`,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      location: {
        lat: input.location.lat,
        lng: input.location.lng,
        addressName: input.location.addressName || 'Unspecified location',
      },
      severity: input.severity,
      evidenceType: input.evidenceType || 'photo',
      evidenceNotes: input.evidenceNotes || '',
      status: 'submitted',
      reporterId: actor.id,
      reporterName: input.isAnonymous ? 'Anonymous Citizen' : actor.displayName,
      isAnonymous: Boolean(input.isAnonymous),
      isDemo: false,
      observedAt: input.observedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reports.push(report);
    this.recentSubmissionFingerprints.set(fingerprint, now);

    // 4. Award EcoPoints (+10 points for valid community report submission)
    const user = this.users.find((u) => u.id === actor.id);
    if (user) {
      user.ecoPoints = (user.ecoPoints || 0) + 10;
      if (!user.badges.includes('Active Citizen Scout')) {
        user.badges.push('Active Citizen Scout');
      }
    }

    return report;
  }

  updateReportStatus(reportId, newStatus, actor, notes) {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) {
      throw new Error(`Report not found with id: ${reportId}`);
    }

    // Citizens cannot verify or resolve reports
    if (actor.role === 'citizen') {
      throw new Error('Unauthorized: Citizen contributors cannot alter report status or verify incidents.');
    }

    // Valid transitions
    const validTransitions = {
      submitted: ['under_review', 'verified', 'resolved'],
      under_review: ['verified', 'resolved'],
      verified: ['action_assigned', 'action_taken', 'resolved'],
      action_assigned: ['action_taken', 'resolved'],
      action_taken: ['resolved'],
      resolved: [],
    };

    const allowed = validTransitions[report.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${report.status} to ${newStatus}`);
    }

    const previousStatus = report.status;
    report.status = newStatus;
    report.updatedAt = new Date().toISOString();
    if (notes) {
      report.evidenceNotes = report.evidenceNotes ? `${report.evidenceNotes}\n[${actor.displayName}]: ${notes}` : `[${actor.displayName}]: ${notes}`;
    }

    // Award bonus EcoPoints (+15 bonus) if Admin confirms/verifies the report
    if (newStatus === 'verified' && previousStatus !== 'verified') {
      const reporter = this.users.find((u) => u.id === report.reporterId);
      if (reporter) {
        reporter.ecoPoints = (reporter.ecoPoints || 0) + 15;
        if (reporter.ecoPoints >= 100 && !reporter.badges.includes('Community Watchdog')) {
          reporter.badges.push('Community Watchdog');
        }
      }
    }

    return report;
  }

  linkPreventionTask(reportId, taskData, actor) {
    if (actor.role !== 'admin' && actor.role !== 'field_worker') {
      throw new Error('Unauthorized: Only Field Workers and Admins can create linked prevention tasks.');
    }
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Report not found');

    const task = {
      id: `TSK-PREV-${Date.now()}`,
      title: taskData.title || `Remediation for: ${report.title}`,
      description: taskData.description || report.description,
      category: report.category,
      priority: report.severity >= 4 ? 'critical' : 'high',
      status: 'pending',
      linkedReportId: report.id,
      location: report.location,
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    report.status = 'action_assigned';
    return task;
  }
}

// ---------------------- TEST SUITE ----------------------

test('Citizen Portal - Supports all 9 pollution categories', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[0];

  const categories = [
    'air', 'water', 'soil', 'noise', 'light', 'thermal', 'plastic', 'radioactive', 'visual'
  ];

  for (const cat of categories) {
    const report = engine.submitReport({
      category: cat,
      title: `Observation of ${cat} pollution incident`,
      description: `Comprehensive environmental observation of ${cat} contamination in industrial perimeter.`,
      severity: 3,
      location: { lat: 17.385, lng: 78.486, addressName: 'Zone 4 Industrial Corridor' },
    }, citizen);

    assert.equal(report.category, cat);
    assert.equal(report.status, 'submitted');
    assert.equal(report.isDemo, false, 'User submissions must be explicitly marked isDemo: false');
  }

  assert.equal(engine.reports.length, 9);
});

test('Citizen Portal - Validates minimum title and description lengths', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[0];

  assert.throws(
    () => {
      engine.submitReport({
        category: 'air',
        title: 'Bad',
        description: 'Valid description that has enough characters.',
        severity: 3,
        location: { lat: 17.385, lng: 78.486 },
      }, citizen);
    },
    /Report title must be at least 5 characters/
  );

  assert.throws(
    () => {
      engine.submitReport({
        category: 'water',
        title: 'Chemical runoff in drainage',
        description: 'Short',
        severity: 4,
        location: { lat: 17.385, lng: 78.486 },
      }, citizen);
    },
    /Description must be at least 10 characters/
  );
});

test('Citizen Portal - Rejects invalid severity ratings and categories', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[0];

  assert.throws(
    () => {
      engine.submitReport({
        category: 'cosmic_rays',
        title: 'Unknown radiation source detected',
        description: 'Detailed description exceeding the minimum required character threshold.',
        severity: 3,
        location: { lat: 17.385, lng: 78.486 },
      }, citizen);
    },
    /Invalid pollution category/
  );

  assert.throws(
    () => {
      engine.submitReport({
        category: 'noise',
        title: 'Excessive generator noise at night',
        description: 'Industrial generators running above 90 dB without acoustic dampening.',
        severity: 6, // Invalid severity
        location: { lat: 17.385, lng: 78.486 },
      }, citizen);
    },
    /Severity rating must be an integer between 1 and 5/
  );
});

test('Citizen Portal - Respects anonymous reporting preference', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[0];

  const report = engine.submitReport({
    category: 'soil',
    title: 'Illegal battery dumping on vacant plot',
    description: 'Multiple discarded lead-acid batteries leaking acid into unpaved soil.',
    severity: 4,
    location: { lat: 17.385, lng: 78.486, addressName: 'Industrial Plot #12' },
    isAnonymous: true,
  }, citizen);

  assert.equal(report.isAnonymous, true);
  assert.equal(report.reporterName, 'Anonymous Citizen');
  assert.equal(report.reporterId, citizen.id, 'Reporter ID remains stored internally for audit and EcoPoints');
});

test('Citizen Portal - GPS and manual location fallback support', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[1]; // Vikram Mehta

  // Case A: With GPS coordinates
  const gpsReport = engine.submitReport({
    category: 'water',
    title: 'Severe oil sheen observed on lake surface',
    description: 'Hydrocarbon sheen stretching 50 meters near the eastern drainage outfall.',
    severity: 4,
    location: { lat: 17.4399, lng: 78.4983, addressName: 'Hussain Sagar East Outfall' },
  }, citizen);
  assert.equal(gpsReport.location.lat, 17.4399);
  assert.equal(gpsReport.location.lng, 78.4983);
  assert.equal(gpsReport.location.addressName, 'Hussain Sagar East Outfall');

  // Case B: Coordinates validation failure if completely missing
  assert.throws(
    () => {
      engine.submitReport({
        category: 'plastic',
        title: 'Blocked stormwater culvert',
        description: 'Culvert blocked with single-use plastic bottles and packaging.',
        severity: 3,
        location: null,
      }, citizen);
    },
    /Valid geographical coordinates/
  );
});

test('Citizen Portal - Awards +10 EcoPoints on submission and prevents duplicate reward gaming', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[1]; // ecoPoints: 40
  const initialPoints = citizen.ecoPoints;

  const report1 = engine.submitReport({
    category: 'plastic',
    title: 'Severe plastic choke point at canal inlet',
    description: 'High concentration of non-biodegradable waste impeding water flow.',
    severity: 4,
    location: { lat: 17.385, lng: 78.486, addressName: 'Canal Junction 2' },
  }, citizen);

  assert.equal(citizen.ecoPoints, initialPoints + 10, 'Must award 10 EcoPoints for valid submission');
  assert.ok(citizen.badges.includes('Active Citizen Scout'), 'Must award Active Citizen Scout badge');

  // Attempt duplicate submission immediately
  assert.throws(
    () => {
      engine.submitReport({
        category: 'plastic',
        title: 'Severe plastic choke point at canal inlet',
        description: 'High concentration of non-biodegradable waste impeding water flow.',
        severity: 4,
        location: { lat: 17.385, lng: 78.486 },
      }, citizen);
    },
    /Duplicate report detected/
  );

  // Ensure points were not incremented again
  assert.equal(citizen.ecoPoints, initialPoints + 10);
});

test('Citizen Portal - Authorization: Citizen cannot verify reports; Admin can verify and award +15 bonus', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[0];
  const admin = engine.users[3]; // Dr. Sarah Mukherjee

  const report = engine.submitReport({
    category: 'air',
    title: 'Dense particulate plume from warehouse boiler',
    description: 'Black smoke observed emerging continuously from an unpermitted exhaust stack.',
    severity: 5,
    location: { lat: 17.385, lng: 78.486, addressName: 'Warehouse Zone B' },
  }, citizen);

  const pointsAfterSubmit = citizen.ecoPoints;

  // Citizen cannot self-verify
  assert.throws(
    () => {
      engine.updateReportStatus(report.id, 'verified', citizen, 'Attempting self verification');
    },
    /Citizen contributors cannot alter report status/
  );

  // Admin verifies report
  const updatedReport = engine.updateReportStatus(report.id, 'verified', admin, 'Confirmed high particulate discharge via sensor cross-reference');
  assert.equal(updatedReport.status, 'verified');

  // Citizen receives +15 bonus points
  assert.equal(citizen.ecoPoints, pointsAfterSubmit + 15, 'Citizen must receive +15 bonus EcoPoints upon verification');
  assert.ok(citizen.badges.includes('Community Watchdog'), 'Citizen qualifies for Community Watchdog badge');
});

test('Citizen Portal - Report lifecycle progression and prevention task linkage', () => {
  const engine = new CitizenReportingEngine();
  const citizen = engine.users[0];
  const admin = engine.users[3];

  const report = engine.submitReport({
    category: 'water',
    title: 'Suspected industrial acidic discharge into canal',
    description: 'Yellowish discolored water and strong sulfur odor observed at culvert discharge.',
    severity: 5,
    location: { lat: 17.41, lng: 78.45, addressName: 'Kukatpally Nala Outfall' },
  }, citizen);

  assert.equal(report.status, 'submitted');

  // Move to under_review
  engine.updateReportStatus(report.id, 'under_review', admin, 'Assigned inspector for visual reconnaissance');
  assert.equal(report.status, 'under_review');

  // Move to verified
  engine.updateReportStatus(report.id, 'verified', admin, 'Water pH test confirmed 4.2 acidity');
  assert.equal(report.status, 'verified');

  // Create linked prevention task
  const task = engine.linkPreventionTask(report.id, {
    title: 'Emergency Neutralization & Source Interception',
    description: 'Deploy neutralizing agent and trace discharge pipe back to source facility.',
  }, admin);

  assert.equal(task.linkedReportId, report.id);
  assert.equal(task.priority, 'critical');
  assert.equal(report.status, 'action_assigned');

  // Progress to resolved
  engine.updateReportStatus(report.id, 'resolved', admin, 'Interception complete. Violator served notice.');
  assert.equal(report.status, 'resolved');
});
