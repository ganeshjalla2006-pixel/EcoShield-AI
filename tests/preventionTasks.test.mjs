import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory Task Workflow Engine for testing Step 4 rules
class PreventionTaskManager {
  constructor() {
    this.tasks = [];
    this.users = [
      { id: 'admin_1', displayName: 'Dr. Sarah Mukherjee', role: 'admin', ecoPoints: 450 },
      { id: 'worker_1', displayName: 'Rajesh Kumar', role: 'field_worker', ecoPoints: 320 },
      { id: 'citizen_1', displayName: 'Ananya Sharma', role: 'citizen', ecoPoints: 180 },
    ];
  }

  createTask(data, actor) {
    if (actor.role === 'citizen') {
      throw new Error('Unauthorized: Citizen contributors cannot create prevention tasks.');
    }

    const task = {
      id: `TSK-PREV-${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category || 'plastic',
      priority: data.priority || 'high',
      status: data.assignedTo ? 'assigned' : 'pending',
      assignedTo: data.assignedTo,
      deadline: data.deadline,
      beforeEvidence: data.beforeEvidence || 'Initial observation intake',
      afterEvidence: undefined,
      isDemo: Boolean(data.isDemo),
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          actorId: actor.id,
          actorName: actor.displayName,
          action: 'TASK_CREATED',
          details: `Task created with priority: ${data.priority || 'high'}`,
        },
      ],
    };
    this.tasks.push(task);
    return task;
  }

  assignWorker(taskId, worker, actor) {
    if (actor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can assign or reassign workers.');
    }
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.assignedTo = worker;
    if (task.status === 'pending') task.status = 'assigned';
    task.auditTrail.unshift({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.displayName,
      action: 'WORKER_ASSIGNED',
      details: `Assigned to ${worker.displayName} by ${actor.displayName}`,
    });
    return task;
  }

  transitionStatus(taskId, newStatus, actor, notes, afterEvidence) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');

    // Citizen permission check
    if (actor.role === 'citizen') {
      throw new Error('Unauthorized: Citizen contributors cannot alter task lifecycle.');
    }

    // Admin-only verification check
    if (newStatus === 'verified' && actor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators may verify mitigation proof.');
    }

    // Evidence requirement check
    const effectiveEvidence = afterEvidence || task.afterEvidence;
    if (newStatus === 'completed' && !effectiveEvidence) {
      throw new Error('Validation Error: Task cannot be submitted for verification without completion evidence.');
    }

    if (newStatus === 'verified' && !task.afterEvidence && !effectiveEvidence) {
      throw new Error('Validation Error: Task cannot be verified without completed mitigation evidence.');
    }

    task.status = newStatus;
    if (afterEvidence) task.afterEvidence = afterEvidence;
    if (notes) task.actionSummary = notes;

    if (newStatus === 'verified') {
      task.verifiedBy = actor.displayName;
      task.verifiedAt = new Date().toISOString();
      task.correctionNotes = undefined;

      // Award EcoPoints to assigned worker
      if (task.assignedTo?.id) {
        const u = this.users.find((user) => user.id === task.assignedTo.id);
        if (u) u.ecoPoints += 25;
      }
    }

    task.auditTrail.unshift({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.displayName,
      action: `STATUS_${newStatus.toUpperCase()}`,
      details: notes || `Status transitioned to ${newStatus}`,
    });

    return task;
  }

  returnForCorrection(taskId, correctionNotes, actor) {
    if (actor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can return tasks for correction.');
    }
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'in_progress';
    task.correctionNotes = correctionNotes;
    task.auditTrail.unshift({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.displayName,
      action: 'RETURNED_FOR_CORRECTION',
      details: correctionNotes,
    });
    return task;
  }
}

// ==========================================
// TEST SUITE: Step 4 Prevention Task Management
// ==========================================

test('Prevention Tasks - Full 5-stage lifecycle transition', () => {
  const manager = new PreventionTaskManager();
  const admin = manager.users[0];
  const worker = manager.users[1];

  // 1. Create open task (pending)
  const task = manager.createTask({
    title: 'Culvert Unblocking',
    description: 'Extract plastic blockage at culvert #4',
    category: 'plastic',
    priority: 'critical',
    deadline: new Date(Date.now() + 86400000).toISOString(),
  }, admin);

  assert.equal(task.status, 'pending');
  assert.equal(task.auditTrail.length, 1);

  // 2. Assign worker (assigned)
  manager.assignWorker(task.id, worker, admin);
  assert.equal(task.status, 'assigned');
  assert.equal(task.assignedTo.displayName, 'Rajesh Kumar');
  assert.equal(task.auditTrail[0].action, 'WORKER_ASSIGNED');

  // 3. Worker starts work (in_progress)
  manager.transitionStatus(task.id, 'in_progress', worker, 'Mobile grab team deployed');
  assert.equal(task.status, 'in_progress');
  assert.equal(task.auditTrail[0].action, 'STATUS_IN_PROGRESS');

  // 4. Worker submits for verification with after-action proof (completed)
  manager.transitionStatus(task.id, 'completed', worker, 'Removed 400kg plastic debris', 'Photo data: 0% culvert blockage');
  assert.equal(task.status, 'completed');
  assert.ok(task.afterEvidence.includes('0% culvert blockage'));

  // 5. Admin verifies task (verified)
  const workerInitialPoints = worker.ecoPoints;
  manager.transitionStatus(task.id, 'verified', admin, 'Compliant ground inspection verified');
  assert.equal(task.status, 'verified');
  assert.equal(task.verifiedBy, 'Dr. Sarah Mukherjee');
  assert.equal(worker.ecoPoints, workerInitialPoints + 25, 'Worker must be awarded 25 EcoPoints upon Admin verification');
});

test('Prevention Tasks - Evidence requirement validation enforcement', () => {
  const manager = new PreventionTaskManager();
  const admin = manager.users[0];
  const worker = manager.users[1];

  const task = manager.createTask({
    title: 'Hazardous Chemical Containment',
    category: 'water',
    priority: 'high',
    assignedTo: worker,
    deadline: new Date(Date.now() + 86400000).toISOString(),
  }, admin);

  manager.transitionStatus(task.id, 'in_progress', worker, 'Beginning containment');

  // Attempt to submit completed WITHOUT evidence
  assert.throws(
    () => {
      manager.transitionStatus(task.id, 'completed', worker, 'Work done');
    },
    /Validation Error: Task cannot be submitted for verification without completion evidence/,
    'Must reject completion submission when evidence is omitted'
  );
});

test('Prevention Tasks - Role authorization enforcement', () => {
  const manager = new PreventionTaskManager();
  const citizen = manager.users[2];
  const worker = manager.users[1];
  const admin = manager.users[0];

  const task = manager.createTask({
    title: 'Noise Barrier Installation',
    category: 'noise',
    priority: 'medium',
    assignedTo: worker,
    deadline: new Date(Date.now() + 86400000).toISOString(),
  }, admin);

  // Citizen cannot transition tasks
  assert.throws(
    () => {
      manager.transitionStatus(task.id, 'in_progress', citizen, 'Citizen attempted start');
    },
    /Unauthorized: Citizen contributors cannot alter task lifecycle/
  );

  // Field Worker cannot verify tasks
  manager.transitionStatus(task.id, 'in_progress', worker);
  manager.transitionStatus(task.id, 'completed', worker, 'Barriers installed', 'Acoustic measurement: 52 dBA');

  assert.throws(
    () => {
      manager.transitionStatus(task.id, 'verified', worker, 'Worker self-verification');
    },
    /Unauthorized: Only administrators may verify mitigation proof/
  );
});

test('Prevention Tasks - Admin return for correction workflow', () => {
  const manager = new PreventionTaskManager();
  const admin = manager.users[0];
  const worker = manager.users[1];

  const task = manager.createTask({
    title: 'Topsoil Geotextile Capping',
    category: 'soil',
    priority: 'high',
    assignedTo: worker,
    deadline: new Date(Date.now() + 86400000).toISOString(),
  }, admin);

  manager.transitionStatus(task.id, 'in_progress', worker);
  manager.transitionStatus(task.id, 'completed', worker, 'Liner laid', 'Photo: liner placed');

  // Admin reviews and rejects due to inadequate anchoring
  manager.returnForCorrection(task.id, 'Perimeter ballast insufficient. Anchor trenches required along North border.', admin);

  assert.equal(task.status, 'in_progress', 'Task must return to in_progress status');
  assert.equal(task.correctionNotes, 'Perimeter ballast insufficient. Anchor trenches required along North border.');
  assert.equal(task.auditTrail[0].action, 'RETURNED_FOR_CORRECTION');
});

test('Prevention Tasks - Overdue status calculation', () => {
  const pastDeadline = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
  const futureDeadline = new Date(Date.now() + 86400000).toISOString(); // 1 day ahead

  const overdueTask = {
    id: 'TSK-1',
    status: 'in_progress',
    deadline: pastDeadline,
  };

  const onTimeTask = {
    id: 'TSK-2',
    status: 'in_progress',
    deadline: futureDeadline,
  };

  const verifiedPastTask = {
    id: 'TSK-3',
    status: 'verified',
    deadline: pastDeadline,
  };

  const isOverdue = (t) => t.status !== 'verified' && new Date(t.deadline).getTime() < Date.now();

  assert.equal(isOverdue(overdueTask), true, 'In-progress task past deadline must be overdue');
  assert.equal(isOverdue(onTimeTask), false, 'Future deadline task is not overdue');
  assert.equal(isOverdue(verifiedPastTask), false, 'Verified tasks must never be marked overdue');
});
