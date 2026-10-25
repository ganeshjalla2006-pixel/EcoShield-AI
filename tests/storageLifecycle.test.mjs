import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory test mock for storageService lifecycle
class MockStorageService {
  constructor() {
    this.reports = [];
    this.tasks = [];
    this.users = [
      { id: 'u1', name: 'Citizen Ananya', ecoPoints: 100, badges: [] },
      { id: 'u2', name: 'Officer Rajesh', ecoPoints: 200, badges: ['Rapid Responder'] }
    ];
    this.auditLogs = [];
  }

  submitReport(rep) {
    const newRep = {
      ...rep,
      id: `REP-${Date.now()}`,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    this.reports.push(newRep);
    
    // EcoPoints award
    const u = this.users.find(user => user.id === rep.reporterId);
    if (u) {
      u.ecoPoints += 10;
      if (!u.badges.includes('Active Scout')) u.badges.push('Active Scout');
    }
    return newRep;
  }

  createPreventionTask(task) {
    const newTask = {
      ...task,
      id: `TSK-${Date.now()}`,
      status: 'assigned',
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          actor: task.creatorName,
          action: 'TASK_CREATED',
          details: `Task assigned to ${task.assigneeName}`
        }
      ]
    };
    this.tasks.push(newTask);
    return newTask;
  }

  transitionTaskStatus(taskId, newStatus, actorName, notes, afterEvidence) {
    const t = this.tasks.find(task => task.id === taskId);
    if (!t) throw new Error('Task not found');

    t.status = newStatus;
    if (afterEvidence) t.afterEvidence = afterEvidence;
    if (notes) t.actionSummary = notes;

    t.auditTrail.push({
      timestamp: new Date().toISOString(),
      actor: actorName,
      action: `STATUS_${newStatus.toUpperCase()}`,
      details: notes || `Status changed to ${newStatus}`
    });
    return t;
  }
}

test('Storage & Workflow - Report submission awards EcoPoints & badge', () => {
  const store = new MockStorageService();
  const rep = store.submitReport({
    category: 'plastic',
    title: 'Plastic obstruction at canal culvert',
    reporterId: 'u1',
    severity: 5
  });

  assert.equal(rep.status, 'submitted');
  assert.equal(store.reports.length, 1);
  const user = store.users.find(u => u.id === 'u1');
  assert.equal(user.ecoPoints, 110, 'Must award 10 EcoPoints for submission');
  assert.ok(user.badges.includes('Active Scout'));
});

test('Storage & Workflow - Prevention task lifecycle with immutable audit trail', () => {
  const store = new MockStorageService();
  const task = store.createPreventionTask({
    title: 'Drainage Cleansing',
    creatorName: 'Director Mukherjee',
    assigneeName: 'Officer Rajesh'
  });

  assert.equal(task.status, 'assigned');
  assert.equal(task.auditTrail.length, 1);
  assert.equal(task.auditTrail[0].action, 'TASK_CREATED');

  // Move to in_progress
  store.transitionTaskStatus(task.id, 'in_progress', 'Officer Rajesh', 'Commenced excavator grab');
  assert.equal(task.status, 'in_progress');
  assert.equal(task.auditTrail.length, 2);

  // Move to completed with after-action evidence
  store.transitionTaskStatus(task.id, 'completed', 'Officer Rajesh', 'Debris cleared 100%', 'Photo: culvert clear');
  assert.equal(task.status, 'completed');
  assert.equal(task.afterEvidence, 'Photo: culvert clear');
  assert.equal(task.auditTrail.length, 3);

  // Director verification
  store.transitionTaskStatus(task.id, 'verified', 'Director Mukherjee', 'On-site sensor inspection compliant');
  assert.equal(task.status, 'verified');
  assert.equal(task.auditTrail.length, 4);
});
