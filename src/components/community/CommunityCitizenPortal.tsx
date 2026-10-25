import React, { useState, useMemo } from 'react';
import {
  Award,
  Medal,
  ShieldCheck,
  Send,
  Camera,
  MapPin,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Flame,
  Search,
  Filter,
  Eye,
  PlusCircle,
  X,
  RotateCcw,
  Info,
  Calendar,
  Lock,
  ExternalLink,
  Check,
  FileCheck,
  UserCheck,
  Activity,
  Wind,
  Droplets,
  Globe,
  Volume2,
  Sun,
  Trash2,
  Radio,
} from 'lucide-react';
import {
  PollutionCategory,
  PollutionReport,
  PreventionTask,
  UserProfile,
  Coordinates,
  ReportStatus,
} from '../../types';

interface CommunityCitizenPortalProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSubmitReport: (report: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  userReports: PollutionReport[];
  allReports?: PollutionReport[];
  tasks?: PreventionTask[];
  onNavigateToTasks?: () => void;
  onUpdateReportStatus?: (reportId: string, status: ReportStatus, notes?: string) => void;
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

// Standardized Badge Catalog
const BADGE_CATALOG = [
  {
    id: 'active_scout',
    name: 'Active Citizen Scout',
    description: 'Submitted your first verifiable environmental hazard observation.',
    icon: '🌱',
    requirement: '1 Report Submitted',
  },
  {
    id: 'community_watchdog',
    name: 'Community Watchdog',
    description: 'Active vigilance in public environmental safety with multiple verified reports.',
    icon: '🛡️',
    requirement: '3 Reports Submitted',
  },
  {
    id: 'eagle_eye',
    name: 'Eagle Eye Scout',
    description: 'Identified confirmed municipal contamination risks requiring field action.',
    icon: '🦅',
    requirement: '5 Reports Submitted',
  },
  {
    id: 'eco_champion',
    name: 'Eco Champion',
    description: 'Surpassed 100+ recognized community EcoPoints through sustained civic action.',
    icon: '⭐',
    requirement: '100+ EcoPoints Earned',
  },
  {
    id: 'rapid_responder',
    name: 'Rapid Responder',
    description: 'Reported a critical Level 4/5 hazard that triggered emergency prevention.',
    icon: '🚨',
    requirement: 'Critical Hazard Reported',
  },
  {
    id: 'water_guardian',
    name: 'Water Guardian',
    description: 'Logged actionable observations protecting local aquifers and drainage networks.',
    icon: '💧',
    requirement: 'Water or Plastic Report Logged',
  },
];

export const CommunityCitizenPortal: React.FC<CommunityCitizenPortalProps> = ({
  currentUser,
  allUsers,
  onSubmitReport,
  userReports,
  allReports = [],
  tasks = [],
  onNavigateToTasks,
  onUpdateReportStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'my_reports' | 'ecopoints' | 'leaderboard'>('submit');

  // Report Form state
  const [category, setCategory] = useState<PollutionCategory>('plastic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [lat, setLat] = useState<number>(28.6139);
  const [lng, setLng] = useState<number>(77.2090);
  const [addressName, setAddressName] = useState('Sector 4 Canal Corridor, New Delhi');
  const [observedAt, setObservedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceImage, setEvidenceImage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Form feedback state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Reports View Filters (default to 'all' so baseline community records are immediately visible)
  const [reportScope, setReportScope] = useState<'my' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'real_only' | 'demo_only'>('all');
  const [selectedReportDetail, setSelectedReportDetail] = useState<PollutionReport | null>(null);

  // System-wide reports pool for headline metrics to ensure synchronization with Dashboard & Prevention Tasks
  const effectiveAllReports = useMemo(() => {
    return allReports.length > 0 ? allReports : userReports;
  }, [allReports, userReports]);

  // Use effective report list based on selected scope
  const activeReportsList = useMemo(() => {
    return reportScope === 'my' ? userReports : effectiveAllReports;
  }, [reportScope, userReports, effectiveAllReports]);

  // Summary Metrics for Dashboard Counters (computed from system-wide ledger to mirror Dashboard total 9)
  const metrics = useMemo(() => {
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
      else if (r.status === 'action_assigned' || r.status === 'in_progress' || r.status === 'action_taken' || r.status === 'resolved') {
        actionTakenCount++;
      }
    });

    return {
      total: effectiveAllReports.length,
      submitted: submittedCount,
      underReview: underReviewCount,
      confirmed: confirmedCount,
      actionTaken: actionTakenCount,
      real: realCount,
      demo: demoCount,
    };
  }, [effectiveAllReports]);

  // Filtered reports for My Reports view
  const filteredReports = useMemo(() => {
    return activeReportsList
      .filter((r) => {
        if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
        if (statusFilter !== 'all') {
          if (statusFilter === 'action_taken') {
            if (r.status !== 'action_taken' && r.status !== 'action_assigned' && r.status !== 'in_progress' && r.status !== 'resolved') {
              return false;
            }
          } else if (r.status !== statusFilter) {
            return false;
          }
        }
        if (originFilter === 'real_only' && r.isDemo) return false;
        if (originFilter === 'demo_only' && !r.isDemo) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = r.title.toLowerCase().includes(q);
          const matchesDesc = r.description.toLowerCase().includes(q);
          const matchesLocation = (r.location.addressName || '').toLowerCase().includes(q);
          const matchesCategory = r.category.toLowerCase().includes(q);
          return matchesTitle || matchesDesc || matchesLocation || matchesCategory;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeReportsList, categoryFilter, statusFilter, originFilter, searchQuery]);

  // Request browser GPS position only upon explicit user click
  const handleUseMyCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('Requesting GPS consent from browser...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setLat(latitude);
        setLng(longitude);
        setAddressName(`Consented GPS Location (${latitude}°N, ${longitude}°E)`);
        setGpsStatus('GPS coordinates captured with user consent.');
        setTimeout(() => setGpsStatus(null), 3000);
      },
      (err) => {
        setGpsStatus(`GPS request cancelled or denied: ${err.message}. Manual entry available below.`);
        setTimeout(() => setGpsStatus(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Image File Upload via FileReader to Base64 DataURL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSubmitError('Photo size exceeds 2MB limit. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceImage(reader.result as string);
      setSubmitError(null);
    };
    reader.readAsDataURL(file);
  };

  // Form Submission with Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    // 1. Validation
    if (title.trim().length < 5) {
      setSubmitError('Please provide a descriptive incident title (at least 5 characters).');
      return;
    }

    if (description.trim().length < 10) {
      setSubmitError('Please provide more environmental context in the description (at least 10 characters).');
      return;
    }

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setSubmitError('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    try {
      onSubmitReport({
        category,
        title: title.trim(),
        description: description.trim(),
        location: {
          lat: Number(lat),
          lng: Number(lng),
          addressName: addressName.trim() || `Lat: ${lat}, Lng: ${lng}`,
        },
        severity,
        evidenceType: evidenceImage ? 'photo' : 'observation',
        evidenceNotes: [evidenceNotes.trim(), evidenceImage].filter(Boolean).join(' | ') || 'Visual observation recorded.',
        status: 'submitted',
        reporterId: currentUser.id,
        reporterName: isAnonymous ? 'Anonymous Citizen Contributor' : currentUser.displayName,
        isAnonymous,
        observedAt: observedAt ? new Date(observedAt).toISOString() : new Date().toISOString(),
        isDemo: false,
      });

      setSubmitSuccessMsg(
        'Observation successfully recorded! +10 EcoPoints awarded for civic vigilance. Your report is now queued for municipal verification.'
      );

      // Reset form fields
      setTitle('');
      setDescription('');
      setEvidenceNotes('');
      setEvidenceImage('');
      setIsAnonymous(false);

      setTimeout(() => setSubmitSuccessMsg(null), 5000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit report. Please check required fields.');
    }
  };

  // Admin action: verify or reject report
  const handleAdminVerifyReport = (reportId: string, newStatus: ReportStatus) => {
    if (currentUser.role !== 'admin' || !onUpdateReportStatus) return;
    onUpdateReportStatus(
      reportId,
      newStatus,
      newStatus === 'verified' ? 'Ground verification confirmed environmental hazard.' : 'Report reviewed.'
    );
    setSelectedReportDetail(null);
  };

  // Find linked prevention task for a report
  const getLinkedTask = (reportId: string) => {
    return tasks.find((t) => t.reportId === reportId);
  };

  // Sort leaderboard by points
  const sortedLeaderboard = [...allUsers].sort((a, b) => b.ecoPoints - a.ecoPoints);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner & User Vitals */}
      <div className="bg-[#09150e] border border-emerald-950/70 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-elevated">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Civic Environmental Intelligence</span>
              </span>

              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Demo Auth: {currentUser.role.toUpperCase()} ({currentUser.displayName})</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Citizen Reporting & EcoPoints Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Report observable pollution across all 9 categories, upload ground-level evidence, track municipal
              prevention workflows, and earn verifiable EcoPoints.
            </p>
          </div>

          {/* Current Contributor Vital Card */}
          <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-2xl p-4 flex items-center gap-4 text-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-black text-xl text-emerald-400 flex-shrink-0">
              {currentUser.displayName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{currentUser.displayName}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="flex items-center gap-1 font-mono font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentUser.ecoPoints} EcoPoints</span>
                </span>
                <span className="text-emerald-950">&bull;</span>
                <span className="text-emerald-400 font-medium">{currentUser.badges.length} Badges</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Summary Counter Badges (7 Indicators) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Reports */}
        <button
          onClick={() => {
            setActiveTab('my_reports');
            setReportScope('all');
            setStatusFilter('all');
          }}
          className="p-3 rounded-xl border border-emerald-950/60 bg-[#0b140f] hover:border-emerald-500/40 text-left transition-all"
        >
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Total Reports</span>
          <div className="text-xl font-black text-white">{metrics.total}</div>
          <span className="text-[9px] text-slate-500 block">
            {metrics.real} Real &bull; {metrics.demo} Demo
          </span>
        </button>

        {/* Submitted */}
        <button
          onClick={() => {
            setActiveTab('my_reports');
            setReportScope('all');
            setStatusFilter('submitted');
          }}
          className="p-3 rounded-xl border border-emerald-950/60 bg-[#0b140f] hover:border-blue-500/40 text-left transition-all"
        >
          <span className="text-[10px] uppercase font-mono text-blue-400 block mb-0.5">Submitted</span>
          <div className="text-xl font-black text-blue-300">{metrics.submitted}</div>
          <span className="text-[9px] text-blue-400/80 block">Queued For Review</span>
        </button>

        {/* Under Review */}
        <button
          onClick={() => {
            setActiveTab('my_reports');
            setReportScope('all');
            setStatusFilter('under_review');
          }}
          className="p-3 rounded-xl border border-emerald-950/60 bg-[#0b140f] hover:border-amber-500/40 text-left transition-all"
        >
          <span className="text-[10px] uppercase font-mono text-amber-400 block mb-0.5">Under Review</span>
          <div className="text-xl font-black text-amber-300">{metrics.underReview}</div>
          <span className="text-[9px] text-amber-400/80 block">Field Inspection</span>
        </button>

        {/* Confirmed Hazards */}
        <button
          onClick={() => {
            setActiveTab('my_reports');
            setReportScope('all');
            setStatusFilter('verified');
          }}
          className="p-3 rounded-xl border border-emerald-950/60 bg-[#0b140f] hover:border-emerald-500/40 text-left transition-all"
        >
          <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-0.5">Confirmed Risks</span>
          <div className="text-xl font-black text-emerald-300">{metrics.confirmed}</div>
          <span className="text-[9px] text-emerald-400/80 block">+15 Bonus Awarded</span>
        </button>

        {/* Action Taken */}
        <button
          onClick={() => {
            setActiveTab('my_reports');
            setReportScope('all');
            setStatusFilter('action_taken');
          }}
          className="p-3 rounded-xl border border-emerald-950/60 bg-[#0b140f] hover:border-purple-500/40 text-left transition-all"
        >
          <span className="text-[10px] uppercase font-mono text-purple-400 block mb-0.5">Action Taken</span>
          <div className="text-xl font-black text-purple-300">{metrics.actionTaken}</div>
          <span className="text-[9px] text-purple-400/80 block">Task Dispatched</span>
        </button>

        {/* EcoPoints Total */}
        <button
          onClick={() => setActiveTab('ecopoints')}
          className="p-3 rounded-xl border border-emerald-950/60 bg-[#0b140f] hover:border-amber-500/40 text-left transition-all"
        >
          <span className="text-[10px] uppercase font-mono text-amber-400 block mb-0.5">Your EcoPoints</span>
          <div className="text-xl font-black text-amber-300">{currentUser.ecoPoints}</div>
          <span className="text-[9px] text-amber-400/80 block">View Breakdown</span>
        </button>

        {/* Badges Available */}
        <button
          onClick={() => setActiveTab('ecopoints')}
          className="p-3 rounded-xl border border-emerald-950/60 bg-[#0b140f] hover:border-emerald-500/40 text-left transition-all"
        >
          <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-0.5">Badges Earned</span>
          <div className="text-xl font-black text-white">
            {currentUser.badges.length}
            <span className="text-xs text-slate-500 font-normal"> / {BADGE_CATALOG.length}</span>
          </div>
          <span className="text-[9px] text-emerald-400/80 block">Badges Catalog</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-950/60 pb-3">
        <button
          onClick={() => setActiveTab('submit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'submit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white bg-[#0b140f] hover:bg-[#0e1a13] border border-emerald-950/60'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Log Pollution Incident</span>
        </button>

        <button
          onClick={() => setActiveTab('my_reports')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'my_reports'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white bg-[#0b140f] hover:bg-[#0e1a13] border border-emerald-950/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Incident Reports & Action Tracking ({reportScope === 'my' ? userReports.length : effectiveAllReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ecopoints')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'ecopoints'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white bg-[#0b140f] hover:bg-[#0e1a13] border border-emerald-950/60'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>EcoPoints Rules & Badges Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white bg-[#0b140f] hover:bg-[#0e1a13] border border-emerald-950/60'
          }`}
        >
          <Medal className="w-3.5 h-3.5" />
          <span>Community Leaderboard</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: SUBMIT POLLUTION INCIDENT FORM */}
      {/* ========================================================== */}
      {activeTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Main Form (8 Cols) */}
          <div className="lg:col-span-8 bg-[#0b140f] border border-emerald-950/70 rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Log an Environmental Risk Observation</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit verifiable observations across any of the 9 pollution domains. Reports feed directly into our AI
                Risk Center to trigger proactive municipal prevention.
              </p>
            </div>

            {/* Error & Success Messages */}
            {submitError && (
              <div className="p-3.5 bg-red-950/40 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}
            {submitSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{submitSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-300">
              {/* Category & Severity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Dropdown (All 9) */}
                <div>
                  <label className="block font-semibold text-slate-200 mb-1.5">Pollution Domain</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PollutionCategory)}
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 capitalize"
                  >
                    <option value="plastic">Plastic & Solid Waste (Culvert & Stormwater Choking)</option>
                    <option value="water">Water Pollution (Chemical Discharges, Effluent Plumes)</option>
                    <option value="air">Air Pollution (Particulate Dust, Genset Smoke, Stubble)</option>
                    <option value="soil">Soil Contamination (Chemical Leaching, Slag Dumping)</option>
                    <option value="noise">Noise Decibels (Unpermitted Night Construction)</option>
                    <option value="thermal">Thermal Pollution (Cooling Outfall Hypoxia)</option>
                    <option value="light">Light Pollution (Skyglow, Glare near Nature Habitats)</option>
                    <option value="radioactive">Radioactive Hazard (Unmanifested Industrial Sources)</option>
                    <option value="visual">Visual Blight (Illegal Commercial Fly-Tipping)</option>
                  </select>
                </div>

                {/* Severity Slider (1-5) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-200">Observed Physical Severity</label>
                    <span className="font-bold text-red-400 font-mono">
                      Level {severity}/5 &bull;{' '}
                      {severity === 5
                        ? 'Critical Emergency'
                        : severity === 4
                        ? 'Severe Threat'
                        : severity === 3
                        ? 'Significant Hazard'
                        : severity === 2
                        ? 'Moderate Risk'
                        : 'Minor Concern'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full accent-emerald-500 cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 (Minor)</span>
                    <span>3 (Significant)</span>
                    <span>5 (Critical Hazard)</span>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Observation Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Compacted plastic waste damming Sector 4 storm drain siphon"
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Detailed Environmental Observations
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe volume, visual characteristics, proximity to drains/residents, odor, and any active meteorological conditions..."
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Observation Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Date & Time Observed</label>
                  <input
                    type="datetime-local"
                    value={observedAt}
                    onChange={(e) => setObservedAt(e.target.value)}
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Landmark / Street Address</label>
                  <input
                    type="text"
                    required
                    value={addressName}
                    onChange={(e) => setAddressName(e.target.value)}
                    placeholder="e.g. Sector 4 Outer Ring Culvert"
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Location Coordinates & GPS Permission Control */}
              <div className="bg-[#0e1a13] p-4 rounded-xl border border-emerald-950/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Geospatial Coordinates</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleUseMyCurrentLocation}
                    className="text-[11px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>📍 Use My Browser GPS (Consent Required)</span>
                  </button>
                </div>

                {gpsStatus && (
                  <p className="text-[11px] text-amber-300 font-mono italic animate-in fade-in-50">{gpsStatus}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lat}
                      onChange={(e) => setLat(Number(e.target.value))}
                      className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2 font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lng}
                      onChange={(e) => setLng(Number(e.target.value))}
                      className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2 font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photographic Evidence Upload & Local Storage Disclosure */}
              <div className="border border-dashed border-emerald-950/80 rounded-xl p-4 bg-[#0e1a13] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Attach Ground-Level Evidence (Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">JPG / PNG &lt; 2MB</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />

                  {evidenceImage && (
                    <div className="relative inline-block mt-1">
                      <img
                        src={evidenceImage}
                        alt="Evidence Preview"
                        className="w-32 h-24 object-cover rounded-lg border border-emerald-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setEvidenceImage('')}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    placeholder="Evidence description (e.g. Geotagged photo shows 80% cross-section blockage)..."
                    className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                  />

                  <p className="text-[10px] text-slate-400 italic">
                    Local Storage Disclosure: Photos are encoded and cached in browser storage (LocalStorage); they
                    may be cleared if browser storage is reset. Zero cloud bucket charges incurred.
                  </p>
                </div>
              </div>

              {/* Privacy Anonymous Toggle & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-emerald-950/60">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-emerald-950 bg-[#080d0a] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Submit as Anonymous Community Contributor (Hides identity from public)</span>
                </label>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle('');
                      setDescription('');
                      setEvidenceNotes('');
                      setEvidenceImage('');
                    }}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Earn +10 EcoPoints</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Rules & Profile Status (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* EcoPoints Rules Quick Card */}
            <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>EcoPoints Earning System</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-start gap-2 bg-[#080d0a] p-2.5 rounded-lg border border-emerald-950/60">
                  <span className="font-bold text-emerald-400 font-mono">+10 pts:</span>
                  <span>Verifiable environmental report submission with geographic coordinates.</span>
                </li>
                <li className="flex items-start gap-2 bg-[#080d0a] p-2.5 rounded-lg border border-emerald-950/60">
                  <span className="font-bold text-emerald-400 font-mono">+15 pts:</span>
                  <span>Observation verified and confirmed by municipal environmental director.</span>
                </li>
                <li className="flex items-start gap-2 bg-[#080d0a] p-2.5 rounded-lg border border-emerald-950/60">
                  <span className="font-bold text-emerald-400 font-mono">+25 pts:</span>
                  <span>Prevention task completion signed off by field engineering inspectors.</span>
                </li>
              </ul>
              <div className="pt-1 text-[11px] text-slate-400">
                Anti-Gaming Protection: Duplicate reports within 60 seconds are blocked. Rewards apply strictly once per
                unique event.
              </div>
            </div>

            {/* Recognized Badges Card */}
            <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Medal className="w-4 h-4 text-amber-400" />
                  <span>Your Badges ({currentUser.badges.length})</span>
                </h4>
                <button
                  onClick={() => setActiveTab('ecopoints')}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300"
                >
                  View All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentUser.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#0e1a13] text-amber-300 border border-amber-500/30 text-xs font-medium rounded-lg flex items-center gap-1.5"
                  >
                    <span>🎖️</span>
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: MY REPORTS & COMMUNITY INCIDENTS TRACKING */}
      {/* ========================================================== */}
      {activeTab === 'my_reports' && (
        <div className="space-y-4">
          {/* Controls Bar: Scope, Search, Filters */}
          <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Scope Switch: My Submissions vs All Community Reports */}
              <div className="flex items-center gap-1 bg-[#080d0a] p-1 rounded-lg border border-emerald-950/80">
                <button
                  onClick={() => setReportScope('my')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    reportScope === 'my'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  My Submissions ({userReports.length})
                </button>
                <button
                  onClick={() => setReportScope('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    reportScope === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Community Reports ({effectiveAllReports.length})
                </button>
              </div>

              {/* Search Field */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search reports by title, category, location, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#080d0a] border border-emerald-950/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">All 9 Pollution Domains</option>
                <option value="air">Air Pollution</option>
                <option value="water">Water Pollution</option>
                <option value="soil">Soil Pollution</option>
                <option value="noise">Noise Pollution</option>
                <option value="light">Light Pollution</option>
                <option value="thermal">Thermal Pollution</option>
                <option value="plastic">Plastic Pollution</option>
                <option value="radioactive">Radioactive Pollution</option>
                <option value="visual">Visual Blight</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">All Lifecycle Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Confirmed Risk</option>
                <option value="action_assigned">Action Dispatched</option>
                <option value="action_taken">Mitigation Complete</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value as any)}
                className="bg-[#080d0a] border border-emerald-950/80 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">All Data Sources</option>
                <option value="real_only">Real User Reports Only</option>
                <option value="demo_only">Demo Seed Reports Only</option>
              </select>

              {(categoryFilter !== 'all' || statusFilter !== 'all' || originFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setOriginFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Reports Grid */}
          {filteredReports.length === 0 ? (
            <div className="bg-[#0b140f] border border-emerald-950/60 rounded-xl p-10 text-center space-y-3">
              <Filter className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Incident Reports Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No observations match your current filter selections.
              </p>
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setOriginFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => {
                const Icon = CATEGORY_ICONS[report.category] || Activity;
                const linkedTask = getLinkedTask(report.id);

                return (
                  <div
                    key={report.id}
                    className="bg-[#0b140f] border border-emerald-950/70 hover:border-emerald-500/40 rounded-xl p-5 space-y-3 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header with Domain, Status, and Provenance */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#08120c] border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {report.category}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {report.isDemo ? 'Demo Seed' : 'Citizen Logged'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{report.id}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                              report.status === 'verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : report.status === 'action_taken' || report.status === 'resolved'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : report.status === 'under_review'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {report.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-bold text-red-400 block mt-0.5">
                            Severity {report.severity}/5
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="text-xs font-bold text-white leading-snug">{report.title}</h4>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-2">
                          {report.description}
                        </p>
                      </div>

                      {/* Location & Reporter Info */}
                      <div className="text-[11px] text-slate-400 space-y-1 bg-[#080d0a] p-2.5 rounded-lg border border-emerald-950/60">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{report.location.addressName || `Lat: ${report.location.lat}, Lng: ${report.location.lng}`}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            Reported by: <strong className="text-slate-200">{report.isAnonymous ? 'Anonymous Citizen' : report.reporterName}</strong>
                          </span>
                          <span>{new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Linked Prevention Task Alert Card (if dispatched) */}
                      {linkedTask && (
                        <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded-lg flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-emerald-300 text-[11px] block">
                                Prevention Task Dispatched: {linkedTask.id}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Status: {linkedTask.status.toUpperCase()} &bull; Assigned: {linkedTask.assignedTo?.name || 'Field Unit'}
                              </span>
                            </div>
                          </div>
                          {onNavigateToTasks && (
                            <button
                              onClick={onNavigateToTasks}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline flex-shrink-0"
                            >
                              Inspect Task
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Admin Actions Bar (Verify / Reject) */}
                    {currentUser.role === 'admin' && (
                      <div className="pt-2 border-t border-emerald-950/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">Admin Control</span>
                        <div className="flex items-center gap-1.5">
                          {report.status !== 'verified' && (
                            <button
                              onClick={() => handleAdminVerifyReport(report.id, 'verified')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] transition-colors"
                            >
                              Confirm Hazard (+15 Pts)
                            </button>
                          )}
                          {report.status === 'submitted' && (
                            <button
                              onClick={() => handleAdminVerifyReport(report.id, 'under_review')}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
                            >
                              Mark In Review
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: ECOPOINTS RULES & BADGES CATALOG */}
      {/* ========================================================== */}
      {activeTab === 'ecopoints' && (
        <div className="space-y-6">
          <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-6 sm:p-7 space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25">
                Gamified Environmental Stewardship
              </span>
              <h2 className="text-xl font-bold text-white mt-1">EcoPoints Reward System & Badges</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                EcoShield AI uses an accountable, merit-based reward structure. EcoPoints recognize civic vigilance,
                promote community reporting, and incentivize municipal engagement.
              </p>
            </div>

            {/* Points Rules Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300 border border-emerald-950/60 rounded-xl overflow-hidden">
                <thead className="bg-[#0e1a13] text-slate-300 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3 border-b border-emerald-950/80">Action Directive</th>
                    <th className="p-3 border-b border-emerald-950/80">EcoPoints Awarded</th>
                    <th className="p-3 border-b border-emerald-950/80">Validation Constraint</th>
                    <th className="p-3 border-b border-emerald-950/80">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/50">
                  <tr className="hover:bg-[#0e1a13]">
                    <td className="p-3 font-semibold text-white">Log Verified Incident Observation</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">+10 EcoPoints</td>
                    <td className="p-3 text-slate-400">Requires valid geospatial coordinates & description.</td>
                    <td className="p-3 text-slate-300">All registered community contributors.</td>
                  </tr>
                  <tr className="hover:bg-[#0e1a13]">
                    <td className="p-3 font-semibold text-white">Director Hazard Confirmation</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">+15 Bonus Points</td>
                    <td className="p-3 text-slate-400">Awarded when Admin inspects and validates severity.</td>
                    <td className="p-3 text-slate-300">Original incident reporter.</td>
                  </tr>
                  <tr className="hover:bg-[#0e1a13]">
                    <td className="p-3 font-semibold text-white">Prevention Task Execution Sign-Off</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">+25 EcoPoints</td>
                    <td className="p-3 text-slate-400">Requires photographic proof and closure sign-off.</td>
                    <td className="p-3 text-slate-300">Assigned municipal field worker.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Badges Catalog (Earned vs Available) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-400" />
                <span>Standardized Recognition Badges Catalog</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BADGE_CATALOG.map((badge) => {
                  const isEarned = currentUser.badges.includes(badge.name);

                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isEarned
                          ? 'bg-[#0e1a13] border-emerald-500/50 shadow-xs'
                          : 'bg-[#080d0a] border-emerald-950/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{badge.icon}</span>
                        {isEarned ? (
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            LOCKED
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-white">{badge.name}</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{badge.description}</p>
                      <div className="mt-2 pt-2 border-t border-emerald-950/60 text-[10px] font-mono text-emerald-400">
                        Target: {badge.requirement}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: COMMUNITY LEADERBOARD */}
      {/* ========================================================== */}
      {activeTab === 'leaderboard' && (
        <div className="bg-[#0b140f] border border-emerald-950/70 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Community Environmental Leaderboard</h3>
              <p className="text-xs text-slate-400">
                Top recognized citizen scouts, rapid responders, and field officers.
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-mono">Real-time sync</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-emerald-950/60 rounded-xl overflow-hidden">
              <thead className="bg-[#0e1a13] text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Contributor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Observations</th>
                  <th className="py-3 px-4">EcoPoints</th>
                  <th className="py-3 px-4">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/50">
                {sortedLeaderboard.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-[#0e1a13] text-slate-200">
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{user.displayName}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{user.reportsSubmitted}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400 font-mono">{user.ecoPoints}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.badges.slice(0, 3).map((b, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
