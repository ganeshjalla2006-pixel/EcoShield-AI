/**
 * EcoShield AI — Supabase Real-Time Data Service Layer
 * 
 * Provides production-grade PostgreSQL CRUD operations, Row-Level Security (RLS)
 * compliance, and Supabase Storage evidence upload handling for EcoShield AI.
 * 
 * Architecture:
 * - Operates seamlessly alongside storageService (hybrid cloud-cache model).
 * - Translates PostgreSQL snake_case schema to frontend TypeScript camelCase.
 * - Handles authentication context, role permissions, and graceful fallback.
 * - Zero secret leakage: Only public anon key client is used.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  TaskAuditEntry,
  UserProfile,
  TaskStatus,
  ReportStatus,
  Coordinates,
} from '../types';
import { storageService } from './storageService';

// =============================================================================
// 1. DATA TRANSFORMERS (PostgreSQL snake_case <-> TypeScript camelCase)
// =============================================================================

export function mapDbToPollutionReport(row: any): PollutionReport {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    location: {
      lat: Number(row.lat),
      lng: Number(row.lng),
      addressName: row.address_name || undefined,
    },
    severity: Number(row.severity) as 1 | 2 | 3 | 4 | 5,
    evidenceUrl: row.evidence_url || undefined,
    evidenceType: row.evidence_type || 'observation',
    evidenceNotes: row.evidence_notes || undefined,
    status: row.status as ReportStatus,
    reporterId: row.reporter_id || 'anonymous',
    reporterName: row.is_anonymous ? 'Civic Scout' : (row.reporter_name || 'Civic Scout'),
    isAnonymous: Boolean(row.is_anonymous),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    verifiedBy: row.verified_by || undefined,
    verificationNotes: row.verification_notes || undefined,
    rejectionReason: row.rejection_reason || undefined,
    linkedTaskId: row.linked_task_id || undefined,
    verificationRewardGranted: Boolean(row.verification_reward_granted),
    isDemo: Boolean(row.is_demo),
    observedAt: row.observed_at || undefined,
  };
}

export function mapReportToDbPayload(
  report: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>,
  currentUser?: UserProfile | null
) {
  const isAnonymous = Boolean(report.isAnonymous);
  const reporterId = currentUser?.id && currentUser.id.includes('-') ? currentUser.id : null;
  const reporterName = isAnonymous
    ? 'Civic Scout'
    : (currentUser?.displayName || report.reporterName || 'Civic Scout');

  return {
    category: report.category,
    title: report.title.trim(),
    description: report.description.trim(),
    lat: report.location.lat,
    lng: report.location.lng,
    address_name: report.location.addressName || null,
    severity: report.severity,
    status: report.status || 'submitted',
    reporter_id: reporterId,
    reporter_name: reporterName,
    is_anonymous: isAnonymous,
    evidence_url: report.evidenceUrl || null,
    evidence_type: report.evidenceType || 'observation',
    evidence_notes: report.evidenceNotes || null,
    is_demo: report.isDemo ?? false,
    observed_at: report.observedAt || new Date().toISOString(),
  };
}

export function mapDbToPreventionTask(row: any, auditEntries: TaskAuditEntry[] = []): PreventionTask {
  return {
    id: row.id,
    reportId: row.report_id || undefined,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status as TaskStatus,
    location: {
      lat: Number(row.lat),
      lng: Number(row.lng),
      addressName: row.address_name || undefined,
    },
    riskScore: Number(row.risk_score || 50),
    riskLevel: row.risk_level || 'moderate',
    assignedTo: row.assigned_to_id
      ? {
          id: row.assigned_to_id,
          name: row.assigned_to_name || 'Assigned Officer',
          role: row.assigned_to_role || 'field_worker',
        }
      : undefined,
    deadline: row.deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
    beforeEvidence: row.before_evidence || undefined,
    afterEvidence: row.after_evidence || undefined,
    actionSummary: row.action_summary || undefined,
    reviewerNotes: row.reviewer_notes || undefined,
    correctionNotes: row.correction_notes || undefined,
    verifiedBy: row.verified_by || undefined,
    verifiedAt: row.verified_at || undefined,
    verificationRewardGranted: Boolean(row.verification_reward_granted),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    auditTrail: auditEntries,
  };
}

export function mapTaskToDbPayload(
  task: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>,
  _currentUser?: UserProfile | null
) {
  return {
    report_id: task.reportId || null,
    title: task.title.trim(),
    description: task.description.trim(),
    category: task.category,
    priority: task.priority || 'medium',
    status: task.status || 'assigned',
    lat: task.location.lat,
    lng: task.location.lng,
    address_name: task.location.addressName || null,
    risk_score: Math.min(100, Math.max(0, task.riskScore || 50)),
    risk_level: task.riskLevel || 'moderate',
    assigned_to_id: task.assignedTo?.id && task.assignedTo.id.includes('-') ? task.assignedTo.id : null,
    assigned_to_name: task.assignedTo?.name || null,
    assigned_to_role: task.assignedTo?.role || null,
    deadline: task.deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
    before_evidence: task.beforeEvidence || null,
    after_evidence: task.afterEvidence || null,
    action_summary: task.actionSummary || null,
    reviewer_notes: task.reviewerNotes || null,
    correction_notes: task.correctionNotes || null,
    verified_by: task.verifiedBy || null,
    verified_at: task.verifiedAt || null,
    is_demo: task.isDemo ?? false,
  };
}

export function mapDbToEnvironmentalHotspot(row: any): EnvironmentalHotspot {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    coordinates: {
      lat: Number(row.lat),
      lng: Number(row.lng),
      addressName: row.address_name || undefined,
    },
    currentRiskScore: Number(row.current_risk_score || 50),
    currentRiskLevel: row.current_risk_level || 'moderate',
    activeReportsCount: Number(row.active_reports_count || 0),
    description: row.description,
    status: row.status || 'active_monitoring',
    recommendedActions: Array.isArray(row.recommended_actions) ? row.recommended_actions : [],
    lastInspectedAt: row.last_inspected_at || new Date().toISOString(),
  };
}

export function mapHotspotToDbPayload(
  hotspot: Omit<EnvironmentalHotspot, 'id'>,
  currentUser?: UserProfile | null
) {
  const createdBy = currentUser?.id && currentUser.id.includes('-') ? currentUser.id : null;
  return {
    name: hotspot.name.trim(),
    category: hotspot.category,
    lat: hotspot.coordinates.lat,
    lng: hotspot.coordinates.lng,
    address_name: hotspot.coordinates.addressName || null,
    current_risk_score: hotspot.currentRiskScore || 50,
    current_risk_level: hotspot.currentRiskLevel || 'moderate',
    active_reports_count: hotspot.activeReportsCount || 0,
    description: hotspot.description.trim(),
    status: hotspot.status || 'active_monitoring',
    recommended_actions: hotspot.recommendedActions || [],
    last_inspected_at: hotspot.lastInspectedAt || new Date().toISOString(),
    created_by: createdBy,
  };
}

export function mapDbToTaskAuditEntry(row: any): TaskAuditEntry {
  return {
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    actorId: row.actor_id || 'system',
    actorName: row.actor_name || 'System Event',
    action: row.action,
    details: row.details || '',
  };
}

// =============================================================================
// 2. SUPABASE DATA SERVICE CLASS
// =============================================================================

class SupabaseDataService {
  /**
   * Checks whether the Supabase database connection is active and configured.
   */
  public isConnected(): boolean {
    return isSupabaseConfigured && Boolean(supabase);
  }

  // ---------------------------------------------------------------------------
  // 2.1 POLLUTION REPORTS
  // ---------------------------------------------------------------------------

  /**
   * Fetches pollution reports from PostgreSQL `public.pollution_reports`.
   * Falls back gracefully to `public_pollution_reports` view or localStorage cache.
   */
  public async getReports(): Promise<PollutionReport[]> {
    if (!this.isConnected() || !supabase) {
      return storageService.getReports();
    }

    try {
      // 1. Try querying the primary pollution_reports table
      const { data, error } = await supabase
        .from('pollution_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const cloudReports = data.map(mapDbToPollutionReport);
        const cloudIds = new Set(cloudReports.map((r) => r.id));
        const localSeeds = storageService.getReports().filter((r) => !cloudIds.has(r.id));
        return [...cloudReports, ...localSeeds];
      }

      // 2. If table is empty or anon permission blocked, attempt the public privacy view
      if (error) {
        console.warn('Direct pollution_reports query returned error, attempting public privacy view:', error.message);
        const { data: viewData, error: viewError } = await supabase
          .from('public_pollution_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!viewError && Array.isArray(viewData) && viewData.length > 0) {
          const cloudReports = viewData.map(mapDbToPollutionReport);
          const cloudIds = new Set(cloudReports.map((r) => r.id));
          const localSeeds = storageService.getReports().filter((r) => !cloudIds.has(r.id));
          return [...cloudReports, ...localSeeds];
        }
      }

      // If database has 0 rows yet, fall back to seed data from storageService
      const localReports = storageService.getReports();
      return localReports;
    } catch (err: any) {
      console.warn('Supabase getReports failed, using local storage cache:', err.message);
      return storageService.getReports();
    }
  }

  /**
   * Creates a new pollution report in PostgreSQL.
   */
  public async createReport(
    reportData: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser?: UserProfile | null
  ): Promise<PollutionReport> {
    // 1. Always update local storage first for optimistic UI responsiveness
    const localReport = storageService.addReport(reportData);

    if (!this.isConnected() || !supabase) {
      return localReport;
    }

    try {
      const payload = mapReportToDbPayload(reportData, currentUser);
      const { data, error } = await supabase
        .from('pollution_reports')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createReport insert returned error:', error.message);
        return localReport;
      }

      if (data) {
        const cloudReport = mapDbToPollutionReport(data);
        return cloudReport;
      }
    } catch (err: any) {
      console.warn('Supabase createReport network error, preserved in local storage:', err.message);
    }

    return localReport;
  }

  /**
   * Updates report status in PostgreSQL (verified, under_review, resolved, etc.)
   */
  public async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    verifiedBy?: string,
    verificationNotes?: string,
    currentUser?: UserProfile | null
  ): Promise<void> {
    // 1. Sync local cache
    storageService.updateReportStatus(reportId, status, verifiedBy, verificationNotes);

    if (!this.isConnected() || !supabase) return;

    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (verifiedBy) updates.verified_by = verifiedBy;
      if (verificationNotes) updates.verification_notes = verificationNotes;

      const { error } = await supabase
        .from('pollution_reports')
        .update(updates)
        .eq('id', reportId);

      if (error) {
        console.warn('Supabase updateReportStatus error:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase updateReportStatus network error:', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 2.2 PREVENTION TASKS & AUDIT LOGS
  // ---------------------------------------------------------------------------

  /**
   * Fetches prevention tasks and their audit logs from PostgreSQL.
   */
  public async getTasks(): Promise<PreventionTask[]> {
    if (!this.isConnected() || !supabase) {
      return storageService.getTasks();
    }

    try {
      // 1. Fetch tasks
      const { data: taskRows, error: taskError } = await supabase
        .from('prevention_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (taskError || !Array.isArray(taskRows) || taskRows.length === 0) {
        return storageService.getTasks();
      }

      // 2. Fetch associated audit logs
      const taskIds = taskRows.map((t) => t.id);
      let auditMap: Record<string, TaskAuditEntry[]> = {};

      try {
        const { data: auditRows, error: auditError } = await supabase
          .from('task_audit_logs')
          .select('*')
          .in('task_id', taskIds)
          .order('timestamp', { ascending: true });

        if (!auditError && Array.isArray(auditRows)) {
          auditRows.forEach((row) => {
            if (!auditMap[row.task_id]) auditMap[row.task_id] = [];
            auditMap[row.task_id].push(mapDbToTaskAuditEntry(row));
          });
        }
      } catch {
        // Audit log table optional fetch resilience
      }

      // 3. Map tasks with their audit logs
      const mappedTasks = taskRows.map((row) =>
        mapDbToPreventionTask(row, auditMap[row.id] || [])
      );

      const cloudIds = new Set(mappedTasks.map((t) => t.id));
      const localSeeds = storageService.getTasks().filter((t) => !cloudIds.has(t.id));
      return [...mappedTasks, ...localSeeds];
    } catch (err: any) {
      console.warn('Supabase getTasks failed, using local storage cache:', err.message);
      return storageService.getTasks();
    }
  }

  /**
   * Creates a new prevention task in PostgreSQL (Admin dispatch).
   */
  public async createTask(
    taskData: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>,
    currentUser?: UserProfile | null
  ): Promise<PreventionTask> {
    const localTask = storageService.addTask(taskData);

    if (!this.isConnected() || !supabase) {
      return localTask;
    }

    try {
      const payload = mapTaskToDbPayload(taskData, currentUser);
      const { data, error } = await supabase
        .from('prevention_tasks')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Supabase createTask insert error:', error.message);
        return localTask;
      }

      if (data) {
        return mapDbToPreventionTask(data, localTask.auditTrail);
      }
    } catch (err: any) {
      console.warn('Supabase createTask network error:', err.message);
    }

    return localTask;
  }

  /**
   * Updates prevention task status, after-evidence, notes, and audit log.
   */
  public async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    notes?: string,
    afterEvidence?: string,
    currentUser?: UserProfile | null
  ): Promise<void> {
    // 1. Sync local storage
    if (currentUser) {
      storageService.updateTaskStatus(taskId, status, notes, afterEvidence, currentUser);
    }

    if (!this.isConnected() || !supabase) return;

    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (afterEvidence) updates.after_evidence = afterEvidence;
      if (notes) updates.reviewer_notes = notes;
      if (status === 'verified') {
        updates.verified_by = currentUser?.displayName || 'Municipal Administrator';
        updates.verified_at = new Date().toISOString();
        updates.verification_reward_granted = true;
      }

      const { error } = await supabase
        .from('prevention_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) {
        console.warn('Supabase updateTaskStatus error:', error.message);
      }

      // If notes were provided, also record progress comment in task_audit_logs
      if (notes && currentUser?.id && currentUser.id.includes('-')) {
        await supabase.from('task_audit_logs').insert([
          {
            task_id: taskId,
            actor_id: currentUser.id,
            actor_name: currentUser.displayName,
            action: 'COMMENT_ADDED',
            details: notes,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      console.warn('Supabase updateTaskStatus network error:', err.message);
    }
  }

  /**
   * Admin returns task for correction with feedback notes.
   */
  public async returnTaskForCorrection(
    taskId: string,
    notes: string,
    currentUser?: UserProfile | null
  ): Promise<void> {
    if (currentUser) {
      storageService.returnTaskForCorrection(taskId, notes, currentUser);
    }

    if (!this.isConnected() || !supabase) return;

    try {
      await supabase
        .from('prevention_tasks')
        .update({
          status: 'in_progress',
          correction_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
    } catch (err: any) {
      console.warn('Supabase returnTaskForCorrection network error:', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 2.3 ENVIRONMENTAL HOTSPOTS
  // ---------------------------------------------------------------------------

  /**
   * Fetches environmental hotspots from PostgreSQL `public.environmental_hotspots`.
   */
  public async getHotspots(): Promise<EnvironmentalHotspot[]> {
    if (!this.isConnected() || !supabase) {
      return storageService.getHotspots();
    }

    try {
      const { data, error } = await supabase
        .from('environmental_hotspots')
        .select('*')
        .order('current_risk_score', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const cloudHotspots = data.map(mapDbToEnvironmentalHotspot);
        const cloudIds = new Set(cloudHotspots.map((h) => h.id));
        const localSeeds = storageService.getHotspots().filter((h) => !cloudIds.has(h.id));
        return [...cloudHotspots, ...localSeeds];
      }

      // Try public view fallback if anon
      if (error) {
        const { data: viewData, error: viewError } = await supabase
          .from('public_environmental_hotspots')
          .select('*')
          .order('current_risk_score', { ascending: false });

        if (!viewError && Array.isArray(viewData) && viewData.length > 0) {
          const cloudHotspots = viewData.map(mapDbToEnvironmentalHotspot);
          const cloudIds = new Set(cloudHotspots.map((h) => h.id));
          const localSeeds = storageService.getHotspots().filter((h) => !cloudIds.has(h.id));
          return [...cloudHotspots, ...localSeeds];
        }
      }

      return storageService.getHotspots();
    } catch (err: any) {
      console.warn('Supabase getHotspots failed, using local storage cache:', err.message);
      return storageService.getHotspots();
    }
  }

  /**
   * Creates a new environmental hotspot in PostgreSQL (Admin only).
   */
  public async createHotspot(
    hotspotData: Omit<EnvironmentalHotspot, 'id'>,
    currentUser?: UserProfile | null
  ): Promise<EnvironmentalHotspot> {
    const localHotspot = storageService.addHotspot(hotspotData);

    if (!this.isConnected() || !supabase) {
      return localHotspot;
    }

    try {
      const payload = mapHotspotToDbPayload(hotspotData, currentUser);
      const { data, error } = await supabase
        .from('environmental_hotspots')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        return mapDbToEnvironmentalHotspot(data);
      }
    } catch (err: any) {
      console.warn('Supabase createHotspot error:', err.message);
    }

    return localHotspot;
  }

  // ---------------------------------------------------------------------------
  // 2.4 EVIDENCE UPLOAD TO SUPABASE STORAGE ('report-evidence' BUCKET)
  // ---------------------------------------------------------------------------

  /**
   * Uploads photographic or document evidence to the private `report-evidence` storage bucket.
   * Path: `evidence/${userId}/${timestamp}_${sanitizedFilename}`
   * Returns a publicly accessible or signed evidence URL.
   */
  public async uploadEvidenceFile(
    file: File,
    userId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.isConnected() || !supabase) {
      return {
        success: false,
        error: 'Supabase storage is not configured. Falling back to local data encoding.',
      };
    }

    // 1. File size limit check (10MB per DATABASE_SCHEMA_FIXED.sql)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE_BYTES) {
      return {
        success: false,
        error: 'File size exceeds maximum 10MB limit allowed by Supabase storage policy.',
      };
    }

    // 2. Allowed MIME types check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Allowed formats: JPG, PNG, WEBP, or PDF.',
      };
    }

    try {
      // 3. Build path strictly conforming to RLS folder ownership:
      // (storage.foldername(name))[1] = auth.uid()::text
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `evidence/${userId}/${Date.now()}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('report-evidence')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
        return {
          success: false,
          error: `Storage upload rejected: ${error.message}`,
        };
      }

      // 4. Retrieve URL for storage record
      const { data: urlData } = supabase.storage
        .from('report-evidence')
        .getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network exception during storage upload.',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 2.5 REAL-TIME WEBSOCKET SUBSCRIPTIONS (POSTGRES_CHANGES)
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to real-time changes on the `pollution_reports` table.
   * Dispatches mapped PollutionReport entities on INSERT, UPDATE, or DELETE events.
   * Returns an unsubscribe cleanup callback.
   */
  public subscribeToReports(
    onChange: (event: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new?: PollutionReport;
      old?: { id: string };
    }) => void
  ): () => void {
    if (!this.isConnected() || !supabase) {
      return () => {};
    }

    try {
      const channelName = `realtime:pollution_reports:${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pollution_reports' },
          (payload: any) => {
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const mappedNew =
              payload.new && Object.keys(payload.new).length > 0
                ? mapDbToPollutionReport(payload.new)
                : undefined;
            const mappedOld =
              payload.old && (payload.old as any).id
                ? { id: (payload.old as any).id }
                : undefined;

            onChange({
              eventType,
              new: mappedNew,
              old: mappedOld,
            });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime WebSocket subscribed: pollution_reports');
          }
        });

      return () => {
        try {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        } catch (e) {
          console.warn('Error unsubscribing reports channel:', e);
        }
      };
    } catch (err: any) {
      console.warn('Failed to setup reports realtime channel:', err?.message);
      return () => {};
    }
  }

  /**
   * Subscribes to real-time changes on the `prevention_tasks` table.
   * Dispatches mapped PreventionTask entities on INSERT, UPDATE, or DELETE events.
   * Returns an unsubscribe cleanup callback.
   */
  public subscribeToTasks(
    onChange: (event: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new?: PreventionTask;
      old?: { id: string };
    }) => void
  ): () => void {
    if (!this.isConnected() || !supabase) {
      return () => {};
    }

    try {
      const channelName = `realtime:prevention_tasks:${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'prevention_tasks' },
          (payload: any) => {
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const mappedNew =
              payload.new && Object.keys(payload.new).length > 0
                ? mapDbToPreventionTask(payload.new)
                : undefined;
            const mappedOld =
              payload.old && (payload.old as any).id
                ? { id: (payload.old as any).id }
                : undefined;

            onChange({
              eventType,
              new: mappedNew,
              old: mappedOld,
            });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime WebSocket subscribed: prevention_tasks');
          }
        });

      return () => {
        try {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        } catch (e) {
          console.warn('Error unsubscribing tasks channel:', e);
        }
      };
    } catch (err: any) {
      console.warn('Failed to setup tasks realtime channel:', err?.message);
      return () => {};
    }
  }

  /**
   * Subscribes to real-time changes on the `environmental_hotspots` table.
   * Dispatches mapped EnvironmentalHotspot entities on INSERT, UPDATE, or DELETE events.
   * Returns an unsubscribe cleanup callback.
   */
  public subscribeToHotspots(
    onChange: (event: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new?: EnvironmentalHotspot;
      old?: { id: string };
    }) => void
  ): () => void {
    if (!this.isConnected() || !supabase) {
      return () => {};
    }

    try {
      const channelName = `realtime:environmental_hotspots:${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'environmental_hotspots' },
          (payload: any) => {
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const mappedNew =
              payload.new && Object.keys(payload.new).length > 0
                ? mapDbToEnvironmentalHotspot(payload.new)
                : undefined;
            const mappedOld =
              payload.old && (payload.old as any).id
                ? { id: (payload.old as any).id }
                : undefined;

            onChange({
              eventType,
              new: mappedNew,
              old: mappedOld,
            });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime WebSocket subscribed: environmental_hotspots');
          }
        });

      return () => {
        try {
          if (supabase) {
            supabase.removeChannel(channel);
          }
        } catch (e) {
          console.warn('Error unsubscribing hotspots channel:', e);
        }
      };
    } catch (err: any) {
      console.warn('Failed to setup hotspots realtime channel:', err?.message);
      return () => {};
    }
  }
}

export const supabaseDataService = new SupabaseDataService();
