import {
  InAppNotification,
  UserProfile,
  PollutionReport,
  PreventionTask,
  PollutionCategory,
  RiskLevel,
  UserRole,
} from '../types';

export type NotificationFilterType = 'all' | 'unread' | 'alert' | 'task' | 'report' | 'system';

/**
 * Filter notifications by current persona's access rules.
 * - Admin: Sees all operational, dispatch, and risk notifications.
 * - Field Worker: Sees assigned tasks, status changes, correction requests, and global alerts.
 * - Citizen: Sees updates on their own reports, EcoPoints credits, and public safety alerts.
 * - Privacy: Enforces anonymous reporter masking (never exposes personal details in text).
 */
export function filterNotificationsByRole(
  notifications: InAppNotification[],
  currentUser: UserProfile
): InAppNotification[] {
  return notifications
    .filter((n) => {
      // 1. Admin has broad operational visibility across all operational notifications
      if (currentUser.role === 'admin') {
        return true;
      }

      // 2. If assigned to a specific user ID, must match that user ID
      if (n.userId) {
        return n.userId === currentUser.id;
      }

      // 3. If target role is explicitly specified
      if (n.userRole) {
        return n.userRole === currentUser.role;
      }

      // 4. Field worker visibility for broadcasts
      if (currentUser.role === 'field_worker') {
        return n.type === 'task' || n.type === 'alert' || n.type === 'system';
      }

      // 5. Citizen visibility for broadcasts
      if (currentUser.role === 'citizen') {
        return n.type === 'alert' || n.type === 'report' || n.type === 'system';
      }

      return false;
    })
    .map((n) => {
      // Privacy safeguard: Ensure anonymous reports never leak reporter details
      if (n.type === 'report' && n.message.includes('undefined')) {
        return {
          ...n,
          message: n.message.replace(/undefined/g, 'Anonymous Citizen'),
        };
      }
      return n;
    });
}

/**
 * Filter notifications by UI tab / severity / category.
 */
export function filterNotificationsByTab(
  notifications: InAppNotification[],
  tab: NotificationFilterType
): InAppNotification[] {
  if (tab === 'unread') {
    return notifications.filter((n) => !n.read);
  }
  if (tab === 'alert' || tab === 'task' || tab === 'report' || tab === 'system') {
    return notifications.filter((n) => n.type === tab);
  }
  return notifications;
}

/**
 * Evaluates tasks and generates overdue alert notifications.
 * Uses a deduplication key (`OVERDUE_${task.id}_${deadlineDate}`) to prevent spamming on every render.
 */
export function evaluateOverdueTasks(
  tasks: PreventionTask[],
  existingNotifications: InAppNotification[],
  referenceDate: Date = new Date()
): InAppNotification[] {
  const now = referenceDate.getTime();
  const newNotifications: InAppNotification[] = [];

  const existingKeys = new Set(
    existingNotifications.map((n) => n.dedupKey).filter(Boolean)
  );

  tasks.forEach((task) => {
    // Only pending, assigned, or in_progress tasks can be overdue
    if (task.status === 'verified' || task.status === 'completed') return;
    if (!task.deadline) return;

    const deadlineTime = new Date(task.deadline).getTime();
    if (isNaN(deadlineTime) || deadlineTime >= now) return;

    const deadlineDateStr = task.deadline.slice(0, 10);
    const dedupKey = `OVERDUE_TASK_${task.id}_${deadlineDateStr}`;

    if (existingKeys.has(dedupKey)) return;

    const overdueAlert: InAppNotification = {
      id: `NOTIF-OVERDUE-${task.id}-${Date.now().toString(36)}`,
      userId: task.assignedTo?.id, // Notify assigned worker
      userRole: 'admin',          // And notify Admin
      title: `OVERDUE HAZARD: Task ${task.id}`,
      message: `Prevention action "${task.title}" is overdue past deadline ${new Date(task.deadline).toLocaleDateString()}. Immediate field intervention required.`,
      type: 'alert',
      severity: 'critical',
      category: task.category,
      riskScore: task.riskScore,
      linkedEntityId: task.id,
      linkedEntityType: 'task',
      link: '/prevention',
      dedupKey,
      read: false,
      createdAt: new Date().toISOString(),
    };

    newNotifications.push(overdueAlert);
    existingKeys.add(dedupKey);
  });

  return newNotifications;
}

/**
 * Creates notification for newly submitted citizen report.
 * Respects anonymity and prevents duplicate alerts.
 */
export function createReportSubmittedNotification(
  report: PollutionReport,
  existingNotifications: InAppNotification[]
): InAppNotification[] {
  const dedupKey = `REPORT_SUBMITTED_${report.id}`;
  const alreadyExists = existingNotifications.some((n) => n.dedupKey === dedupKey);
  if (alreadyExists) return [];

  const reporterDisplay = report.isAnonymous
    ? 'Anonymous Citizen'
    : (report.reporterName || 'Citizen Contributor');

  const notifications: InAppNotification[] = [];

  // Notification for Operational Admin / Community Feed
  notifications.push({
    id: `NOTIF-REP-${report.id}`,
    userRole: 'admin',
    title: `New Incident Logged: ${report.category.toUpperCase()}`,
    message: `Observation "${report.title}" reported by ${reporterDisplay}. Severity: ${report.severity}/5. Queued for initial review.`,
    type: 'report',
    severity: report.severity >= 4 ? 'critical' : report.severity === 3 ? 'moderate' : 'low',
    category: report.category,
    linkedEntityId: report.id,
    linkedEntityType: 'report',
    link: '/reports',
    dedupKey,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // If severity 4 or 5, also trigger immediate high risk alert
  if (report.severity >= 4) {
    const riskAlertDedup = `RISK_ALERT_REPORT_${report.id}`;
    if (!existingNotifications.some((n) => n.dedupKey === riskAlertDedup)) {
      notifications.push({
        id: `NOTIF-RISK-REP-${report.id}`,
        title: `HIGH SEVERITY ALERT: ${report.category.toUpperCase()} (${report.severity}/5)`,
        message: `High magnitude observation "${report.title}" flagged in ${report.location.addressName || 'monitored sector'}. Rapid reconnaissance needed.`,
        type: 'alert',
        severity: 'critical',
        category: report.category,
        linkedEntityId: report.id,
        linkedEntityType: 'report',
        link: '/reports',
        dedupKey: riskAlertDedup,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return notifications;
}

/**
 * Creates notification when an administrator updates a report status.
 */
export function createReportStatusNotification(
  report: PollutionReport,
  newStatus: string,
  notes?: string
): InAppNotification {
  const dedupKey = `REPORT_STATUS_${report.id}_${newStatus}`;

  return {
    id: `NOTIF-STAT-${report.id}-${Date.now().toString(36)}`,
    userId: report.reporterId, // Direct to submitting citizen
    title: `Observation Status: ${newStatus.replace('_', ' ').toUpperCase()}`,
    message: `Your observation "${report.title}" is now marked as "${newStatus.replace('_', ' ')}"${notes ? `: ${notes}` : '.'}`,
    type: 'report',
    category: report.category,
    linkedEntityId: report.id,
    linkedEntityType: 'report',
    link: '/reports',
    dedupKey,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Formats a readable timestamp relative to now.
 */
export function formatNotificationTime(isoDate: string): string {
  try {
    const time = new Date(isoDate).getTime();
    if (isNaN(time)) return 'Recently';

    const diffMs = Date.now() - time;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(isoDate).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}
