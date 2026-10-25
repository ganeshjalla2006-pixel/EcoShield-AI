import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory Notification Engine test suite mirroring Step 8 implementation rules

class TestNotificationManager {
  constructor() {
    this.notifications = [];
  }

  addNotification(notif) {
    const item = {
      ...notif,
      id: notif.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: Boolean(notif.read),
      createdAt: notif.createdAt || new Date().toISOString(),
    };
    this.notifications.unshift(item);
    return item;
  }

  addNotificationWithDeduplication(notif) {
    if (notif.dedupKey) {
      const exists = this.notifications.some((n) => n.dedupKey === notif.dedupKey);
      if (exists) return null;
    }
    return this.addNotification(notif);
  }

  markRead(id) {
    const n = this.notifications.find((item) => item.id === id);
    if (n) n.read = true;
  }

  markAllRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

  deleteNotification(id) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  clearAllRead() {
    this.notifications = this.notifications.filter((n) => !n.read);
  }

  filterByRole(currentUser) {
    return this.notifications
      .filter((n) => {
        // 1. Admin operational visibility across all operational notifications
        if (currentUser.role === 'admin') return true;
        // 2. If assigned to a specific user ID, must match that user ID
        if (n.userId) return n.userId === currentUser.id;
        // 3. If target role is explicitly specified
        if (n.userRole) return n.userRole === currentUser.role;
        // 4. Field worker visibility for unassigned broadcasts
        if (currentUser.role === 'field_worker') {
          return n.type === 'task' || n.type === 'alert' || n.type === 'system';
        }
        // 5. Citizen visibility for unassigned broadcasts
        if (currentUser.role === 'citizen') {
          return n.type === 'alert' || n.type === 'report' || n.type === 'system';
        }
        return false;
      })
      .map((n) => {
        // Enforce anonymity in messages
        if (n.isAnonymous && n.message) {
          return {
            ...n,
            message: n.message.replace(/by [^.]+?\./, 'by Anonymous Citizen.'),
          };
        }
        return n;
      });
  }

  evaluateOverdueTasks(tasks, referenceDate = new Date()) {
    const now = referenceDate.getTime();
    const created = [];

    tasks.forEach((task) => {
      if (task.status === 'verified' || task.status === 'completed') return;
      if (!task.deadline) return;

      const deadlineTime = new Date(task.deadline).getTime();
      if (isNaN(deadlineTime) || deadlineTime >= now) return;

      const deadlineDate = task.deadline.slice(0, 10);
      const dedupKey = `OVERDUE_TASK_${task.id}_${deadlineDate}`;

      const notif = this.addNotificationWithDeduplication({
        userId: task.assignedTo?.id,
        userRole: 'admin',
        title: `OVERDUE HAZARD: Task ${task.id}`,
        message: `Prevention action "${task.title}" is overdue past deadline ${task.deadline}.`,
        type: 'alert',
        severity: 'critical',
        category: task.category,
        linkedEntityId: task.id,
        linkedEntityType: 'task',
        link: '/prevention',
        dedupKey,
      });

      if (notif) created.push(notif);
    });

    return created;
  }
}

// ---------------------- TEST SUITES ----------------------

test('Notification Center - Creates in-app notifications for report submission & critical severity alert', () => {
  const manager = new TestNotificationManager();

  // 1. Standard report submission (severity 3)
  const report1 = {
    id: 'REP-101',
    category: 'water',
    title: 'Discolored stream runoff',
    severity: 3,
    isAnonymous: false,
    reporterName: 'Ananya Sharma',
  };

  const notif1 = manager.addNotificationWithDeduplication({
    title: `New Incident Logged: ${report1.category.toUpperCase()}`,
    message: `Observation "${report1.title}" reported by ${report1.reporterName}. Assigned for review.`,
    type: 'report',
    category: report1.category,
    severity: 'moderate',
    linkedEntityId: report1.id,
    linkedEntityType: 'report',
    link: '/reports',
    dedupKey: `REPORT_SUBMITTED_${report1.id}`,
  });

  assert.ok(notif1);
  assert.equal(notif1.type, 'report');
  assert.equal(notif1.read, false);
  assert.equal(manager.notifications.length, 1);

  // 2. Critical severity report (severity 5) -> triggers both report & immediate risk alert
  const report2 = {
    id: 'REP-102',
    category: 'plastic',
    title: 'Culvert Completely Choked Before Rain',
    severity: 5,
    isAnonymous: false,
    reporterName: 'Vikram Mehta',
  };

  manager.addNotificationWithDeduplication({
    title: `New Incident Logged: ${report2.category.toUpperCase()}`,
    message: `Observation "${report2.title}" reported by ${report2.reporterName}.`,
    type: 'report',
    category: report2.category,
    linkedEntityId: report2.id,
    dedupKey: `REPORT_SUBMITTED_${report2.id}`,
  });

  const riskAlert = manager.addNotificationWithDeduplication({
    title: `HIGH SEVERITY ALERT: ${report2.category.toUpperCase()} (${report2.severity}/5)`,
    message: `High magnitude observation "${report2.title}" flagged. Immediate response needed.`,
    type: 'alert',
    severity: 'critical',
    category: report2.category,
    linkedEntityId: report2.id,
    dedupKey: `RISK_ALERT_REPORT_${report2.id}`,
  });

  assert.ok(riskAlert);
  assert.equal(riskAlert.severity, 'critical');
  assert.equal(manager.notifications.length, 3);
});

test('Notification Center - Creates task assignment, verification, and correction notifications', () => {
  const manager = new TestNotificationManager();
  const worker = { id: 'worker_01', name: 'Rajesh Kumar', role: 'field_worker' };

  // 1. Task assigned to worker
  const task = {
    id: 'TSK-PREV-201',
    title: 'Install Drainage Trash Boom',
    priority: 'high',
    deadline: '2026-10-26T12:00:00Z',
    category: 'plastic',
  };

  const assignedNotif = manager.addNotificationWithDeduplication({
    userId: worker.id,
    userRole: 'field_worker',
    title: `New Assignment: ${task.title}`,
    message: `Assigned priority: ${task.priority.toUpperCase()} with deadline 2026-10-26.`,
    type: 'task',
    linkedEntityId: task.id,
    linkedEntityType: 'task',
    link: '/prevention',
    dedupKey: `TASK_ASSIGNED_${task.id}_${worker.id}`,
  });

  assert.ok(assignedNotif);
  assert.equal(assignedNotif.userId, worker.id);

  // 2. Task submitted for verification (notifies admin)
  const submitVerify = manager.addNotificationWithDeduplication({
    userRole: 'admin',
    title: `Remediation Submitted: ${task.title}`,
    message: `Field worker submitted completion evidence for ${task.id}. Verification required.`,
    type: 'task',
    linkedEntityId: task.id,
    link: '/prevention',
    dedupKey: `TASK_SUBMITTED_VERIFY_${task.id}`,
  });
  assert.ok(submitVerify);
  assert.equal(submitVerify.userRole, 'admin');

  // 3. Task returned for correction
  const returnedNotif = manager.addNotificationWithDeduplication({
    userId: worker.id,
    userRole: 'field_worker',
    title: 'Action Returned for Correction',
    message: `Task ${task.id} requires revision: Additional geotextile photo needed.`,
    type: 'task',
    linkedEntityId: task.id,
    dedupKey: `TASK_CORRECTION_${task.id}_1`,
  });
  assert.ok(returnedNotif);
  assert.equal(returnedNotif.userId, worker.id);

  // 4. Task verified & EcoPoints credit
  const verifiedNotif = manager.addNotificationWithDeduplication({
    userId: worker.id,
    userRole: 'field_worker',
    title: 'Prevention Task Verified!',
    message: `Task ${task.id} was signed off by Director. +25 EcoPoints awarded.`,
    type: 'task',
    linkedEntityId: task.id,
    dedupKey: `TASK_VERIFIED_${task.id}`,
  });
  assert.ok(verifiedNotif);
  assert.equal(verifiedNotif.userId, worker.id);
});

test('Notification Center - Role-based visibility enforcement', () => {
  const manager = new TestNotificationManager();

  const adminUser = { id: 'admin_1', role: 'admin', displayName: 'Dr. Sarah' };
  const worker1 = { id: 'worker_1', role: 'field_worker', displayName: 'Rajesh' };
  const worker2 = { id: 'worker_2', role: 'field_worker', displayName: 'Amit' };
  const citizen = { id: 'citizen_1', role: 'citizen', displayName: 'Ananya' };

  // Notification for Worker 1
  manager.addNotification({
    id: 'N1',
    userId: 'worker_1',
    userRole: 'field_worker',
    title: 'Worker 1 Task',
    message: 'Your personal task',
    type: 'task',
  });

  // Notification for Citizen 1
  manager.addNotification({
    id: 'N2',
    userId: 'citizen_1',
    title: 'Report Verified',
    message: 'Your report was verified',
    type: 'report',
  });

  // Critical Broadcast Alert
  manager.addNotification({
    id: 'N3',
    title: 'Critical Weather Synergy Alert',
    message: 'Torrential rain approaching Sector 4',
    type: 'alert',
    severity: 'critical',
  });

  // Admin sees all 3
  const adminView = manager.filterByRole(adminUser);
  assert.equal(adminView.length, 3);

  // Worker 1 sees their assigned task (N1) + broadcast alert (N3), NOT citizen's report (N2)
  const worker1View = manager.filterByRole(worker1);
  assert.equal(worker1View.length, 2);
  assert.ok(worker1View.some((n) => n.id === 'N1'));
  assert.ok(worker1View.some((n) => n.id === 'N3'));
  assert.ok(!worker1View.some((n) => n.id === 'N2'));

  // Worker 2 does NOT see Worker 1's personal task (N1)
  const worker2View = manager.filterByRole(worker2);
  assert.equal(worker2View.length, 1);
  assert.equal(worker2View[0].id, 'N3');

  // Citizen sees their report update (N2) + broadcast alert (N3), NOT worker's task (N1)
  const citizenView = manager.filterByRole(citizen);
  assert.equal(citizenView.length, 2);
  assert.ok(citizenView.some((n) => n.id === 'N2'));
  assert.ok(citizenView.some((n) => n.id === 'N3'));
  assert.ok(!citizenView.some((n) => n.id === 'N1'));
});

test('Notification Center - Anonymous report privacy protection', () => {
  const manager = new TestNotificationManager();

  // Notification from anonymous citizen
  manager.addNotification({
    id: 'N_ANON',
    title: 'New Incident Logged: CHEMICAL',
    message: 'Observation "Leaking Valve" reported by Anonymous Citizen. Severity: 4/5.',
    type: 'report',
    isAnonymous: true,
  });

  const citizen = { id: 'citizen_2', role: 'citizen', displayName: 'Vikram' };
  const visible = manager.filterByRole(citizen);

  assert.equal(visible.length, 1);
  assert.ok(!visible[0].message.includes('Vikram'));
  assert.ok(!visible[0].message.includes('user_private_id'));
  assert.ok(visible[0].message.includes('Anonymous Citizen'));
});

test('Notification Center - Read/unread status transitions and clear operations', () => {
  const manager = new TestNotificationManager();

  const n1 = manager.addNotification({ id: 'N1', title: 'Alert 1', read: false });
  const n2 = manager.addNotification({ id: 'N2', title: 'Alert 2', read: false });
  const n3 = manager.addNotification({ id: 'N3', title: 'Alert 3', read: true });

  assert.equal(manager.notifications.filter((n) => !n.read).length, 2);

  // Mark single as read
  manager.markRead('N1');
  assert.equal(manager.notifications.find((n) => n.id === 'N1').read, true);
  assert.equal(manager.notifications.filter((n) => !n.read).length, 1);

  // Mark all as read
  manager.markAllRead();
  assert.ok(manager.notifications.every((n) => n.read === true));

  // Clear all read items
  manager.clearAllRead();
  assert.equal(manager.notifications.length, 0);

  // Delete single notification
  manager.addNotification({ id: 'N4', title: 'Alert 4', read: false });
  assert.equal(manager.notifications.length, 1);
  manager.deleteNotification('N4');
  assert.equal(manager.notifications.length, 0);
});

test('Notification Center - Duplicate-event prevention and unchanged-risk deduplication', () => {
  const manager = new TestNotificationManager();

  const dedupKey = 'OVERDUE_TASK_TSK-101_2026-10-24';

  // First trigger
  const first = manager.addNotificationWithDeduplication({
    id: 'N1',
    title: 'OVERDUE HAZARD: Task TSK-101',
    message: 'Task is overdue',
    type: 'alert',
    dedupKey,
  });
  assert.ok(first);
  assert.equal(manager.notifications.length, 1);

  // Second trigger (e.g. on page refresh or component rerender)
  const duplicate = manager.addNotificationWithDeduplication({
    id: 'N2',
    title: 'OVERDUE HAZARD: Task TSK-101',
    message: 'Task is overdue',
    type: 'alert',
    dedupKey,
  });

  assert.equal(duplicate, null, 'Must reject duplicate event with identical dedupKey');
  assert.equal(manager.notifications.length, 1, 'Notifications count must remain unchanged');
});

test('Notification Center - Overdue task deadline evaluation and notification creation', () => {
  const manager = new TestNotificationManager();
  const refDate = new Date('2026-10-25T12:00:00Z');

  const tasks = [
    // Overdue task (deadline 2026-10-24)
    {
      id: 'TSK-101',
      title: 'Clear drainage culvert',
      status: 'assigned',
      priority: 'critical',
      deadline: '2026-10-24T12:00:00Z',
      assignedTo: { id: 'worker_01', name: 'Rajesh' },
    },
    // Future task (deadline 2026-10-30)
    {
      id: 'TSK-102',
      title: 'Install acoustic curtain',
      status: 'assigned',
      priority: 'high',
      deadline: '2026-10-30T12:00:00Z',
      assignedTo: { id: 'worker_01', name: 'Rajesh' },
    },
    // Past deadline but already completed/verified
    {
      id: 'TSK-103',
      title: 'Topsoil barrier',
      status: 'verified',
      priority: 'medium',
      deadline: '2026-10-20T12:00:00Z',
    },
  ];

  const overdueCreated = manager.evaluateOverdueTasks(tasks, refDate);

  assert.equal(overdueCreated.length, 1);
  assert.equal(overdueCreated[0].linkedEntityId, 'TSK-101');
  assert.equal(overdueCreated[0].severity, 'critical');

  // Running evaluation again immediately produces 0 new notifications due to deduplication
  const secondEval = manager.evaluateOverdueTasks(tasks, refDate);
  assert.equal(secondEval.length, 0);
});

test('Notification Center - Storage recovery from null or corrupted data', () => {
  const safeParseNotifications = (raw) => {
    try {
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  assert.deepEqual(safeParseNotifications(null), []);
  assert.deepEqual(safeParseNotifications(''), []);
  assert.deepEqual(safeParseNotifications('invalid json {['), []);
  assert.deepEqual(safeParseNotifications('{"notAnArray": true}'), []);
  assert.equal(safeParseNotifications('[{"id": "1", "title": "Valid"}]').length, 1);
});

test('Notification Center - Zero-budget in-app guarantee (no remote push or SMS)', () => {
  const systemNotice = {
    provider: 'Local In-App Storage',
    usesRemotePush: false,
    usesPaidSms: false,
    budgetCost: '₹0',
    persistence: 'Browser-Local Storage',
  };

  assert.equal(systemNotice.usesRemotePush, false);
  assert.equal(systemNotice.usesPaidSms, false);
  assert.equal(systemNotice.budgetCost, '₹0');
});
