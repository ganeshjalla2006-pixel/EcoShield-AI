import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Camera,
  History,
  Send,
  Plus,
  Filter,
  Eye,
  Info,
  RotateCcw,
  Search,
  Upload,
  Calendar,
  MapPin,
  Check,
  X,
  FileText,
  Activity,
  Wind,
  Droplets,
  Globe,
  Volume2,
  Sun,
  Flame,
  Trash2,
  Radio,
  Lock,
  Award,
} from 'lucide-react';
import {
  PollutionReport,
  PreventionTask,
  UserProfile,
  TaskPriority,
  TaskStatus,
  RiskLevel,
  PollutionCategory,
  UserRole,
} from '../../types';

interface PreventionCommandCenterProps {
  reports: PollutionReport[];
  tasks: PreventionTask[];
  users: UserProfile[];
  currentUser: UserProfile;
  onCreateTask: (task: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, notes?: string, afterEvidence?: string) => void;
  onUpdateReportStatus?: (reportId: string, status: PollutionReport['status'], notes?: string) => void;
  onReturnTaskForCorrection?: (taskId: string, notes: string) => void;
  onAssignTaskWorker?: (taskId: string, worker: { id: string; name: string; role: UserRole }) => void;
}

const CATEGORY_ICONS: Record<PollutionCategory, React.ComponentType<{ className?: string }>> = {
  air: Wind,
  water: Droplets,
  soil: Globe,
  noise: Volume2,
  light: Sun,
  thermal: Flame,
  plastic: Trash2,
  radioactive: Radio,
  visual: Eye,
};

export const PreventionCommandCenter: React.FC<PreventionCommandCenterProps> = ({
  reports,
  tasks,
  users,
  currentUser,
  onCreateTask,
  onUpdateTaskStatus,
  onUpdateReportStatus,
  onReturnTaskForCorrection,
  onAssignTaskWorker,
}) => {
  // Selected task for detailed inspection
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'real_only' | 'demo_only'>('all');
  const [sortBy, setSortBy] = useState<'deadline_asc' | 'deadline_desc' | 'priority_desc' | 'risk_desc'>('deadline_asc');

  // Modal & form states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionInput, setCorrectionInput] = useState<string>('');

  // Operational action form inputs
  const [actionNotes, setActionNotes] = useState<string>('');
  const [afterEvidenceInput, setAfterEvidenceInput] = useState<string>('');
  const [afterEvidenceImage, setAfterEvidenceImage] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New task form state
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskCategory, setTaskCategory] = useState<PollutionCategory>('plastic');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [assignedUserId, setAssignedUserId] = useState<string>(
    users.find((u) => u.role === 'field_worker')?.id || users[0]?.id || ''
  );
  const [deadlineDays, setDeadlineDays] = useState<number>(2);

  // Re-assignment dropdown state for Admin
  const [reassignWorkerId, setReassignWorkerId] = useState<string>('');

  // Find currently active inspected task
  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || tasks[0] || null;
  }, [tasks, selectedTaskId]);

  // Overdue calculation helper
  const isTaskOverdue = (task: PreventionTask): boolean => {
    if (task.status === 'verified') return false;
    return new Date(task.deadline).getTime() < Date.now();
  };

  // Dashboard Summary Metrics across all tasks
  const metrics = useMemo(() => {
    let openCount = 0;
    let assignedCount = 0;
    let inProgressCount = 0;
    let awaitingVerificationCount = 0;
    let verifiedCount = 0;
    let overdueCount = 0;
    let realCount = 0;
    let demoCount = 0;

    tasks.forEach((t) => {
      if (t.isDemo) demoCount++;
      else realCount++;

      if (t.status === 'pending') openCount++;
      else if (t.status === 'assigned') assignedCount++;
      else if (t.status === 'in_progress') inProgressCount++;
      else if (t.status === 'completed') awaitingVerificationCount++;
      else if (t.status === 'verified') verifiedCount++;

      if (isTaskOverdue(t)) overdueCount++;
    });

    return {
      total: tasks.length,
      open: openCount,
      assigned: assignedCount,
      inProgress: inProgressCount,
      awaitingVerification: awaitingVerificationCount,
      verified: verifiedCount,
      overdue: overdueCount,
      real: realCount,
      demo: demoCount,
    };
  }, [tasks]);

  // Filter & Sort Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Status filter
        if (statusFilter === 'overdue') {
          if (!isTaskOverdue(t)) return false;
        } else if (statusFilter !== 'all' && t.status !== statusFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

        // Worker filter
        if (workerFilter !== 'all') {
          if (workerFilter === 'unassigned' && t.assignedTo) return false;
          if (workerFilter !== 'unassigned' && t.assignedTo?.id !== workerFilter) return false;
        }

        // Origin filter (real vs demo)
        if (originFilter === 'real_only' && t.isDemo) return false;
        if (originFilter === 'demo_only' && !t.isDemo) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = t.id.toLowerCase().includes(q);
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesDesc = t.description.toLowerCase().includes(q);
          const matchesLocation = (t.location.addressName || '').toLowerCase().includes(q);
          const matchesWorker = (t.assignedTo?.name || '').toLowerCase().includes(q);
          return matchesId || matchesTitle || matchesDesc || matchesLocation || matchesWorker;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline_asc') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === 'deadline_desc') {
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        }
        if (sortBy === 'priority_desc') {
          const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
        }
        return b.riskScore - a.riskScore;
      });
  }, [tasks, statusFilter, priorityFilter, categoryFilter, workerFilter, originFilter, searchQuery, sortBy]);

  // Pending reports needing prevention tasks
  const pendingReports = useMemo(() => {
    return reports.filter(
      (r) =>
        (r.status === 'submitted' || r.status === 'under_review' || r.status === 'verified') &&
        !tasks.some((t) => t.reportId === r.id)
    );
  }, [reports, tasks]);

  // Handle Image File Upload (converted to Data URL for local display)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setActionError('File size exceeds 2MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAfterEvidenceImage(reader.result as string);
      setActionError(null);
    };
    reader.readAsDataURL(file);
  };

  // Status Transition with Role & Evidence Enforcement
  const handleStatusTransition = (newStatus: TaskStatus) => {
    if (!selectedTask) return;
    setActionError(null);
    setActionSuccess(null);

    // 1. Role Authorization Enforcement
    if (currentUser.role === 'citizen') {
      setActionError('Unauthorized: Citizen contributors have view-only access and cannot alter operational tasks.');
      return;
    }

    if (newStatus === 'verified' && currentUser.role !== 'admin') {
      setActionError('Unauthorized: Only administrators may verify mitigation proof and close prevention tasks.');
      return;
    }

    // 2. Evidence Validation Enforcement
    const combinedEvidence = [afterEvidenceInput.trim(), afterEvidenceImage].filter(Boolean).join(' | ');
    const effectiveEvidence = combinedEvidence || selectedTask.afterEvidence;

    if (newStatus === 'completed' && !effectiveEvidence) {
      setActionError('Validation Error: You must attach after-action evidence (photo or notes) before submitting for verification.');
      return;
    }

    if (newStatus === 'verified' && !selectedTask.afterEvidence && !effectiveEvidence) {
      setActionError('Validation Error: Task cannot be verified without completed mitigation evidence.');
      return;
    }

    try {
      onUpdateTaskStatus(
        selectedTask.id,
        newStatus,
        actionNotes.trim() || undefined,
        combinedEvidence || undefined
      );

      setActionSuccess(`Task status transitioned to ${newStatus.toUpperCase()} successfully.`);
      setActionNotes('');
      setAfterEvidenceInput('');
      setAfterEvidenceImage('');

      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update task status.');
    }
  };

  // Return Task for Correction (Admin only)
  const handleConfirmReturnForCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !correctionInput.trim()) return;

    if (currentUser.role !== 'admin') {
      setActionError('Unauthorized: Only administrators can return tasks for correction.');
      return;
    }

    if (onReturnTaskForCorrection) {
      onReturnTaskForCorrection(selectedTask.id, correctionInput.trim());
    } else {
      onUpdateTaskStatus(selectedTask.id, 'in_progress', `RETURNED FOR CORRECTION: ${correctionInput.trim()}`);
    }

    setShowCorrectionModal(false);
    setCorrectionInput('');
    setActionSuccess('Task returned to field worker for correction with mandatory revision directives.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Assign or Reassign Worker (Admin only)
  const handleReassignWorker = () => {
    if (!selectedTask || !reassignWorkerId) return;

    if (currentUser.role !== 'admin') {
      setActionError('Unauthorized: Only administrators can assign or reassign workers.');
      return;
    }

    const worker = users.find((u) => u.id === reassignWorkerId);
    if (!worker) return;

    if (onAssignTaskWorker) {
      onAssignTaskWorker(selectedTask.id, {
        id: worker.id,
        name: worker.displayName,
        role: worker.role,
      });
    }

    setReassignWorkerId('');
    setActionSuccess(`Worker successfully reassigned to ${worker.displayName}.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Create Task Submission
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role === 'citizen') {
      setActionError('Unauthorized: Citizen contributors cannot create administrative prevention tasks.');
      return;
    }

    const rep = reports.find((r) => r.id === selectedReportId);
    const assignedUser = users.find((u) => u.id === assignedUserId);

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

    let riskLevel: RiskLevel = 'moderate';
    let riskScore = 65;
    if (taskPriority === 'critical') {
      riskLevel = 'critical';
      riskScore = 88;
    } else if (taskPriority === 'high') {
      riskLevel = 'high';
      riskScore = 72;
    } else if (taskPriority === 'low') {
      riskLevel = 'low';
      riskScore = 20;
    }

    onCreateTask({
      reportId: rep?.id,
      title: taskTitle,
      description: taskDescription,
      category: taskCategory,
      priority: taskPriority,
      status: assignedUser ? 'assigned' : 'pending',
      location: rep?.location || { lat: 28.6139, lng: 77.2090, addressName: 'Designated Environmental Sector' },
      riskScore,
      riskLevel,
      assignedTo: assignedUser
        ? { id: assignedUser.id, name: assignedUser.displayName, role: assignedUser.role }
        : undefined,
      deadline: deadlineDate.toISOString(),
      beforeEvidence: rep?.evidenceNotes || 'Pending initial baseline photographic inspection.',
      isDemo: false, // Explicitly logged by user
    });

    if (rep && onUpdateReportStatus) {
      onUpdateReportStatus(rep.id, 'action_assigned', `Task created and assigned to ${assignedUser?.displayName || 'Field Unit'}`);
    }

    setShowCreateModal(false);
    setTaskTitle('');
    setTaskDescription('');
  };

  // Open Create Modal pre-populated for a report
  const handleOpenCreateForReport = (rep: PollutionReport) => {
    setSelectedReportId(rep.id);
    setTaskCategory(rep.category);
    setTaskTitle(`Pre-empt Risk: Clean & Mitigate ${rep.title}`);
    setTaskDescription(
      `Deploy inspection and preventive barrier at ${rep.location.addressName || 'the reported coordinates'}. Issue ground report with before/after photo documentation.`
    );
    setTaskPriority(rep.severity >= 4 ? 'critical' : 'high');
    setShowCreateModal(true);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setWorkerFilter('all');
    setOriginFilter('all');
    setSortBy('deadline_asc');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner & Context Summary */}
      <div className="bg-[#09150e] border border-emerald-950/70 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-elevated">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Closed-Loop Prevention Operations</span>
              </span>

              {/* Demo Mode Role Authorization Notice */}
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Demo Role Auth: {currentUser.role.toUpperCase()} ({currentUser.displayName})</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Prevention Task Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Converts predictive risk alerts into trackable, auditable field actions. Mandates before/after mitigation
              evidence and authorized verification before work closure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser.role !== 'citizen' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Prevention Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Dashboard Status Counters Bar (7 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Tasks */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-[#0e1a13] border-emerald-500 ring-1 ring-emerald-500/40'
              : 'bg-[#0b140f] border-emerald-950/60 hover:border-emerald-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Total Tasks</span>
          <div className="text-xl font-black text-white">{metrics.total}</div>
          <span className="text-[9px] text-slate-500 block">
            {metrics.real} Logged &bull; {metrics.demo} Demo
          </span>
        </button>

        {/* Open Tasks */}
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'bg-slate-800/40 border-slate-400 ring-1 ring-slate-400/40'
              : 'bg-[#0b140f] border-emerald-950/60 hover:border-slate-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Open (Unassigned)</span>
          <div className="text-xl font-black text-slate-300">{metrics.open}</div>
          <span className="text-[9px] text-slate-400 block">Awaiting Worker</span>
        </button>

        {/* Assigned Tasks */}
        <button
          onClick={() => setStatusFilter('assigned')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'assigned'
              ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/40'
              : 'bg-[#0b140f] border-emerald-950/60 hover:border-blue-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-blue-400 block mb-0.5">Assigned</span>
          <div className="text-xl font-black text-blue-300">{metrics.assigned}</div>
          <span className="text-[9px] text-blue-400/80 block">Dispatched to Field</span>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'in_progress'
              ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/40'
              : 'bg-[#0b140f] border-emerald-950/60 hover:border-purple-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-purple-400 block mb-0.5">In Progress</span>
          <div className="text-xl font-black text-purple-300">{metrics.inProgress}</div>
          <span className="text-[9px] text-purple-400/80 block">Active Mitigation</span>
        </button>

        {/* Awaiting Verification */}
        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'completed'
              ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40'
              : 'bg-[#0b140f] border-emerald-950/60 hover:border-amber-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-amber-400 block mb-0.5">Awaiting Review</span>
          <div className="text-xl font-black text-amber-300">{metrics.awaitingVerification}</div>
          <span className="text-[9px] text-amber-400/80 block">Proof Submitted</span>
        </button>

        {/* Verified & Closed */}
        <button
          onClick={() => setStatusFilter('verified')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'verified'
              ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
              : 'bg-[#0b140f] border-emerald-950/60 hover:border-emerald-500/40'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-0.5">Verified</span>
          <div className="text-xl font-black text-emerald-300">{metrics.verified}</div>
          <span className="text-[9px] text-emerald-400/80 block">Audited Compliant</span>
        </button>

        {/* Overdue Tasks */}
        <button
          onClick={() => setStatusFilter('overdue')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'overdue'
              ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500/40'
              : 'bg-[#0b140f] border-emerald-950/60 hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] uppercase font-mono text-red-400">Overdue</span>
            {metrics.overdue > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>}
          </div>
          <div className="text-xl font-black text-red-400">{metrics.overdue}</div>
          <span className="text-[9px] text-red-300/80 block">Missed Deadline</span>
        </button>
      </div>

      {/* Priority Queue of Unassigned Reports (if any) */}
      {pendingReports.length > 0 && currentUser.role !== 'citizen' && (
        <div className="bg-[#0b140f] border border-amber-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Priority Incident Queue: Field Reports Awaiting Task Dispatch ({pendingReports.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Verified community observations ready for action</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingReports.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="bg-[#080d0a] border border-emerald-950/80 rounded-lg p-3 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {r.category}
                    </span>
                    <span className="text-[10px] font-bold text-red-400">Severity {r.severity}/5</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{r.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{r.description}</p>
                </div>

                <div className="pt-2 border-t border-emerald-950/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">{r.id}</span>
                  <button
                    onClick={() => handleOpenCreateForReport(r)}
                    className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded transition-colors"
                  >
                    <span>Dispatch Task</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter, Search, and Sort Bar */}
      <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks by ID, location, title, instructions, or assigned worker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Clear Filter Button */}
          {(statusFilter !== 'all' ||
            priorityFilter !== 'all' ||
            categoryFilter !== 'all' ||
            workerFilter !== 'all' ||
            originFilter !== 'all' ||
            searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition-colors self-end md:self-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Open (Unassigned)</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Awaiting Verification</option>
            <option value="verified">Verified & Closed</option>
            <option value="overdue">⚠️ Overdue Tasks</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All 9 Categories</option>
            <option value="air">Air Pollution</option>
            <option value="water">Water Pollution</option>
            <option value="soil">Soil Pollution</option>
            <option value="noise">Noise Pollution</option>
            <option value="light">Light Pollution</option>
            <option value="thermal">Thermal Pollution</option>
            <option value="plastic">Plastic Pollution</option>
            <option value="radioactive">Radioactive Pollution</option>
            <option value="visual">Visual Pollution</option>
          </select>

          {/* Worker Dropdown */}
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Personnel</option>
            <option value="unassigned">Unassigned Tasks</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} ({u.role})
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 col-span-2 sm:col-span-1"
          >
            <option value="deadline_asc">Sort: Deadline (Soonest)</option>
            <option value="deadline_desc">Sort: Deadline (Furthest)</option>
            <option value="priority_desc">Sort: Highest Priority</option>
            <option value="risk_desc">Sort: Highest Risk Score</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column View: Task List on Left, Active Task Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Filtered Task List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing {filteredTasks.length} matching tasks</span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Click task to inspect details & audit trail
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-8 text-center space-y-3">
              <Filter className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Prevention Tasks Found</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No active prevention tasks match your current search and filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredTasks.map((t) => {
                const isSelected = selectedTask?.id === t.id;
                const overdue = isTaskOverdue(t);
                const Icon = CATEGORY_ICONS[t.category] || Activity;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#0e1a13] border-emerald-500 shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-[#0b140f] hover:bg-[#0e1a13]/60 border-emerald-950/70'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            t.priority === 'critical'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : t.priority === 'high'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {t.priority} ({t.riskScore}/100)
                        </span>

                        {/* Real vs Demo Seed Badge */}
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {t.isDemo ? 'Demo Seed' : 'Field Logged'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {overdue && (
                          <span className="text-[9px] font-bold uppercase bg-red-950 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse"></span>
                            <span>Overdue</span>
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Task Title & Category */}
                    <div className="flex items-start gap-2.5 mb-1.5">
                      <div className="w-6 h-6 rounded bg-[#08120c] border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">{t.title}</h4>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 mb-2 leading-relaxed pl-8">
                      {t.description}
                    </p>

                    {/* Card Footer: Assignee & Deadline */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-emerald-950/60 pl-8">
                      <span>Officer: <strong className="text-slate-300 font-medium">{t.assignedTo?.name || 'Unassigned'}</strong></span>
                      <span className={overdue ? 'text-red-400 font-bold' : ''}>
                        Due: {new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active Task Inspector & Workflow Actions (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedTask ? (
            <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl shadow-sm overflow-hidden space-y-5 p-6 text-xs text-slate-200">
              {/* Notifications / Alerts banner */}
              {actionError && (
                <div className="p-3 bg-red-950/40 border border-red-500/60 rounded-xl text-red-200 flex items-start gap-2 animate-in fade-in-50">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-emerald-200 flex items-start gap-2 animate-in fade-in-50">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Inspector Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-950/60 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                      {selectedTask.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        selectedTask.priority === 'critical'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {selectedTask.priority} Priority ({selectedTask.riskScore}/100)
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 uppercase">
                      STATUS: {selectedTask.status.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {selectedTask.isDemo ? 'Demo Seed Data' : 'Real Stored Task'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1.5">{selectedTask.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedTask.location.addressName || `Lat: ${selectedTask.location.lat}, Lng: ${selectedTask.location.lng}`}</span>
                  </p>
                </div>

                <div className="text-right text-xs bg-[#0e1a13] border border-emerald-950/80 p-3 rounded-xl min-w-[150px]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned Worker</span>
                  <span className="font-bold text-white text-xs block mt-0.5">
                    {selectedTask.assignedTo?.name || 'Unassigned'}
                  </span>
                  <span className="text-[10px] text-emerald-400 block">
                    {selectedTask.assignedTo?.role ? `Role: ${selectedTask.assignedTo.role}` : 'Needs Assignment'}
                  </span>
                </div>
              </div>

              {/* Task Directive Details */}
              <div className="bg-[#0e1a13] p-4 rounded-xl border border-emerald-950/80 space-y-1.5">
                <span className="font-semibold text-emerald-400 block uppercase tracking-wider text-[10px]">
                  Mandated Prevention Directive:
                </span>
                <p className="text-slate-200 leading-relaxed">{selectedTask.description}</p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-400">
                  <span>Created: {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  <span className={isTaskOverdue(selectedTask) ? 'text-red-400 font-bold' : ''}>
                    Target Deadline: {new Date(selectedTask.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Admin Worker Assignment / Reassignment Control */}
              {currentUser.role === 'admin' && (
                <div className="bg-[#080d0a] border border-emerald-950/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-300">Operational Assignment Control:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={reassignWorkerId}
                      onChange={(e) => setReassignWorkerId(e.target.value)}
                      className="bg-[#0e1a13] border border-emerald-950/80 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Field Worker...</option>
                      {users
                        .filter((u) => u.role === 'field_worker')
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.displayName}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleReassignWorker}
                      disabled={!reassignWorkerId}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-xs"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}

              {/* Returned for Correction Warning Banner */}
              {selectedTask.correctionNotes && selectedTask.status !== 'verified' && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/50 rounded-xl space-y-1 text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Returned by Administrator for Revision</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed pl-6">
                    "{selectedTask.correctionNotes}"
                  </p>
                </div>
              )}

              {/* Before & After Action Verification Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before Evidence */}
                <div className="border border-emerald-950/80 rounded-xl p-4 bg-[#080d0a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-amber-400">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Before-Action Baseline Intake</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Phase 1</span>
                  </div>
                  <p className="text-slate-300 leading-snug">
                    {selectedTask.beforeEvidence || 'Initial risk intake notes logged.'}
                  </p>
                </div>

                {/* After Evidence */}
                <div className="border border-emerald-950/80 rounded-xl p-4 bg-[#080d0a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Completed Mitigation Proof</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Phase 2</span>
                  </div>

                  {selectedTask.afterEvidence ? (
                    <div className="space-y-2">
                      <p className="text-slate-200 leading-snug">{selectedTask.afterEvidence}</p>
                      {selectedTask.actionSummary && (
                        <p className="text-[11px] text-slate-400 italic">"{selectedTask.actionSummary}"</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Field verification documentation pending submission.</p>
                  )}
                </div>
              </div>

              {/* Verified Sign-Off Banner (if task is verified) */}
              {selectedTask.status === 'verified' && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/60 rounded-xl flex items-center justify-between gap-3 text-emerald-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white block">
                        Verified by {selectedTask.verifiedBy || 'Administrator'}
                      </span>
                      <span className="text-[11px] text-emerald-300">
                        Closed on {new Date(selectedTask.verifiedAt || selectedTask.updatedAt).toLocaleString()} &bull; +25 EcoPoints Awarded
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-600 text-white font-bold px-2.5 py-1 rounded">
                    AUDITED & COMPLIANT
                  </span>
                </div>
              )}

              {/* Action Toolbar with Direct Role Enforcement */}
              <div className="bg-[#0e1a13] rounded-xl p-4 border border-emerald-950/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Lifecycle Transition Controls</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Active User Role: <strong className="text-emerald-300 capitalize">{currentUser.role}</strong>
                  </span>
                </div>

                {/* Citizen View-Only Notice */}
                {currentUser.role === 'citizen' ? (
                  <div className="p-3 bg-slate-900/60 border border-emerald-950/60 rounded-lg text-slate-300 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Public Transparency View: Citizens may monitor community mitigation progress and audit trails.
                      Operational dispatch and verification controls are reserved for certified municipal personnel.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Operational inputs for Field Worker & Admin */}
                    {selectedTask.status !== 'verified' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Action Notes / Mitigation Summary:
                          </label>
                          <input
                            type="text"
                            placeholder="Enter mitigation notes (e.g. Cleared 450kg plastic debris from siphon #4)..."
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {selectedTask.status === 'in_progress' && (
                          <div className="space-y-2 pt-1">
                            <label className="block text-[11px] font-semibold text-slate-300">
                              Mitigation Proof / Measurement Verification:
                            </label>
                            <input
                              type="text"
                              placeholder="Enter measurement proof (e.g. 0% cross-section occlusion; flow restored)..."
                              value={afterEvidenceInput}
                              onChange={(e) => setAfterEvidenceInput(e.target.value)}
                              className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />

                            {/* Photo Upload with Local Storage Disclosure */}
                            <div className="border border-dashed border-emerald-950/80 rounded-lg p-3 bg-[#080d0a] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Attach Completion Photograph</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">JPG / PNG &lt; 2MB</span>
                              </div>

                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                              />

                              {afterEvidenceImage && (
                                <div className="mt-2 relative inline-block">
                                  <img
                                    src={afterEvidenceImage}
                                    alt="Uploaded evidence preview"
                                    className="w-28 h-20 object-cover rounded-lg border border-emerald-500/40"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setAfterEvidenceImage('')}
                                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              <p className="text-[10px] text-slate-500 italic">
                                Storage Disclosure: Photographic proof is encoded and cached locally in browser
                                storage; no paid cloud storage bucket or subscription required.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Transition Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-950/60">
                      {/* Assigned -> In Progress */}
                      {selectedTask.status === 'assigned' && (
                        <button
                          onClick={() => handleStatusTransition('in_progress')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Start Work (Mark In Progress)</span>
                        </button>
                      )}

                      {/* In Progress -> Completed (Submit for Review) */}
                      {selectedTask.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusTransition('completed')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Completed Mitigation for Verification</span>
                        </button>
                      )}

                      {/* Admin Verification & Rejection Controls */}
                      {currentUser.role === 'admin' && selectedTask.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleStatusTransition('verified')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>Verify Mitigation Proof (+25 EcoPoints)</span>
                          </button>

                          <button
                            onClick={() => setShowCorrectionModal(true)}
                            className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            <span>Return for Correction</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Immutable Action Audit Trail History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Immutable Action Audit Trail ({selectedTask.auditTrail.length} Events)</span>
                </h4>

                <div className="space-y-2 border-l-2 border-emerald-950/80 pl-3.5 ml-1">
                  {selectedTask.auditTrail.map((entry, idx) => (
                    <div key={idx} className="relative pb-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono font-bold text-emerald-400 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {entry.action}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          by <strong className="text-slate-300">{entry.actorName}</strong> &bull;{' '}
                          {new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{entry.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-10 text-center text-xs text-slate-400">
              Select a prevention task from the list to view its complete audit trail and operational controls.
            </div>
          )}
        </div>
      </div>

      {/* Return for Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b140f] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-500/50 text-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-950/60 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Return Task for Correction</span>
              </h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnForCorrection} className="space-y-3.5 text-xs">
              <p className="text-slate-300">
                Specify the deficiency or required corrective actions. The task will be returned to the field worker in
                In-Progress status.
              </p>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Required Corrections:</label>
                <textarea
                  required
                  rows={3}
                  value={correctionInput}
                  onChange={(e) => setCorrectionInput(e.target.value)}
                  placeholder="e.g. Siphon debris partially remaining on left bank; additional filtration screens required before closure..."
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg transition-colors"
                >
                  Confirm Return for Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deploy Prevention Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b140f] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-emerald-950/80 text-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-950/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>Deploy Prevention Task</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Incident Report</label>
                <select
                  value={selectedReportId}
                  onChange={(e) => {
                    setSelectedReportId(e.target.value);
                    const r = reports.find((rep) => rep.id === e.target.value);
                    if (r) setTaskCategory(r.category);
                  }}
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Stand-alone Prevention Initiative</option>
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.category.toUpperCase()}] {r.title} (Severity: {r.severity}/5)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pollution Domain</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value as PollutionCategory)}
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 capitalize"
                >
                  <option value="air">Air Pollution</option>
                  <option value="water">Water Pollution</option>
                  <option value="soil">Soil Pollution</option>
                  <option value="noise">Noise Pollution</option>
                  <option value="light">Light Pollution</option>
                  <option value="thermal">Thermal Pollution</option>
                  <option value="plastic">Plastic Pollution</option>
                  <option value="radioactive">Radioactive Pollution</option>
                  <option value="visual">Visual Pollution</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Clean & Mitigate Plastic Culvert Obstruction"
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Action Directive & Instructions</label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Mandated field procedures, barrier specifications, safety cordons, and photographic requirements..."
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="critical">Critical (&lt; 24h)</option>
                    <option value="high">High (&lt; 48h)</option>
                    <option value="medium">Medium (&lt; 72h)</option>
                    <option value="low">Low (&lt; 7d)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assign Field Officer</label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned (Open Queue)</option>
                    {users
                      .filter((u) => u.role === 'field_worker')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Deploy Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
