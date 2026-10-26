import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  NavView,
} from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { InteractiveMap } from './components/map/InteractiveMap';
import { LiveMapView } from './components/map/LiveMapView';
import { PollutionCategoriesView } from './components/categories/PollutionCategoriesView';
import { PreventionCommandCenter } from './components/prevention/PreventionCommandCenter';
import { RiskCenterView } from './components/risk/RiskCenterView';
import { AnalyticsReportsView } from './components/analytics/AnalyticsReportsView';
import { CommunityCitizenPortal } from './components/community/CommunityCitizenPortal';
import { SettingsStatusView } from './components/settings/SettingsStatusView';
import { DemoGuideModal } from './components/demo/DemoGuideModal';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { AdminProfileView } from './components/auth/AdminProfileView';
import { useAuth } from './context/AuthContext';
import { storageService } from './services/storageService';
import { supabaseDataService } from './services/supabaseDataService';
import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  InAppNotification,
  Coordinates,
  PollutionCategory,
  UserRole,
} from './types';
import { evaluateOverdueTasks } from './services/notificationService';
import { Plus, X, Camera, Send, MapPin, Eye, Radio, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentUser,
    allUsers,
    authMode,
    isAuthenticated,
    switchRole,
    signOutCloud,
    enterDemoMode,
  } = useAuth();

  // App mode: Landing Page vs Platform Application vs Authentication Page
  const [inApp, setInApp] = useState<boolean>(false);
  const [showLoginPage, setShowLoginPage] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [activeCategoryDomain, setActiveCategoryDomain] = useState<PollutionCategory | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showDemoGuide, setShowDemoGuide] = useState<boolean>(false);

  // Application Data States (synced with storageService)
  const [reports, setReports] = useState<PollutionReport[]>(() => storageService.getReports());
  const [tasks, setTasks] = useState<PreventionTask[]>(() => storageService.getTasks());
  const [hotspots, setHotspots] = useState<EnvironmentalHotspot[]>(() => storageService.getHotspots());
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => storageService.getNotifications());

  // Consented or default location (Connaught Place / New Delhi Environmental Monitoring Sector)
  const [userLocation, setUserLocation] = useState<Coordinates>({
    lat: 28.6139,
    lng: 77.2090,
    addressName: 'Connaught Place Monitoring Sector, New Delhi',
  });

  // Global Quick Report Modal
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [modalCategory, setModalCategory] = useState<PollutionCategory>('plastic');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDescription, setModalDescription] = useState<string>('');
  const [modalSeverity, setModalSeverity] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [modalEvidence, setModalEvidence] = useState<string>('');

  // Selected entities for deep drill-down
  const [selectedReport, setSelectedReport] = useState<PollutionReport | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<EnvironmentalHotspot | null>(null);

  // Sync state helpers
  const refreshAllData = () => {
    setReports(storageService.getReports());
    setTasks(storageService.getTasks());
    setHotspots(storageService.getHotspots());
    setNotifications(storageService.getNotifications());
  };

  // Synchronize with Supabase Cloud PostgreSQL when connected
  useEffect(() => {
    let isMounted = true;
    const syncCloudData = async () => {
      if (supabaseDataService.isConnected()) {
        try {
          const [cloudReports, cloudTasks, cloudHotspots] = await Promise.all([
            supabaseDataService.getReports(),
            supabaseDataService.getTasks(),
            supabaseDataService.getHotspots(),
          ]);
          if (isMounted) {
            if (cloudReports && cloudReports.length > 0) {
              setReports(cloudReports);
            }
            if (cloudTasks && cloudTasks.length > 0) {
              setTasks(cloudTasks);
            }
            if (cloudHotspots && cloudHotspots.length > 0) {
              setHotspots(cloudHotspots);
            }
          }
        } catch (err) {
          console.warn('Supabase initial data sync error:', err);
        }
      }
    };

    syncCloudData();
    return () => {
      isMounted = false;
    };
  }, [authMode, currentUser.id]);

  const handleCreateReport = async (newRepData: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    const localRep = storageService.addReport(newRepData);
    refreshAllData();

    if (supabaseDataService.isConnected()) {
      try {
        const cloudRep = await supabaseDataService.createReport(newRepData, currentUser);
        setReports((prev) => prev.map((r) => (r.id === localRep.id ? cloudRep : r)));
      } catch (err) {
        console.warn('Cloud report sync error:', err);
      }
    }
  };

  const handleCreateTask = async (newTaskData: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    const localTask = storageService.addTask(newTaskData);
    refreshAllData();

    if (supabaseDataService.isConnected()) {
      try {
        const cloudTask = await supabaseDataService.createTask(newTaskData, currentUser);
        setTasks((prev) => prev.map((t) => (t.id === localTask.id ? cloudTask : t)));
      } catch (err) {
        console.warn('Cloud task sync error:', err);
      }
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: PreventionTask['status'],
    notes?: string,
    afterEvidence?: string
  ) => {
    storageService.updateTaskStatus(taskId, status, notes, afterEvidence, currentUser);
    refreshAllData();

    if (supabaseDataService.isConnected()) {
      await supabaseDataService.updateTaskStatus(taskId, status, notes, afterEvidence, currentUser);
    }
  };

  const handleReturnTaskForCorrection = async (taskId: string, notes: string) => {
    storageService.returnTaskForCorrection(taskId, notes, currentUser);
    refreshAllData();

    if (supabaseDataService.isConnected()) {
      await supabaseDataService.returnTaskForCorrection(taskId, notes, currentUser);
    }
  };

  const handleAssignTaskWorker = (
    taskId: string,
    worker: { id: string; name: string; role: UserRole }
  ) => {
    storageService.assignTaskWorker(taskId, worker, currentUser);
    refreshAllData();
  };

  const handleUpdateReportStatus = async (
    reportId: string,
    status: PollutionReport['status'],
    notes?: string
  ) => {
    storageService.updateReportStatus(reportId, status, currentUser.displayName, notes);
    refreshAllData();

    if (supabaseDataService.isConnected()) {
      await supabaseDataService.updateReportStatus(reportId, status, currentUser.displayName, notes, currentUser);
    }
  };

  const handleAddNewHotspot = async (hotspotData: Omit<EnvironmentalHotspot, 'id'>) => {
    const localHotspot = storageService.addHotspot(hotspotData);
    refreshAllData();

    if (supabaseDataService.isConnected()) {
      try {
        const cloudHotspot = await supabaseDataService.createHotspot(hotspotData, currentUser);
        setHotspots((prev) => prev.map((h) => (h.id === localHotspot.id ? cloudHotspot : h)));
      } catch (err) {
        console.warn('Cloud hotspot sync error:', err);
      }
    }
  };

  const handleNotificationClick = (notif: InAppNotification) => {
    storageService.markNotificationRead(notif.id);
    refreshAllData();
    if (notif.linkedEntityType === 'task' || notif.link === '/prevention' || notif.link === '/tasks') {
      setCurrentView('prevention_tasks');
    } else if (notif.linkedEntityType === 'report' || notif.link === '/reports' || notif.link === '/citizen') {
      setCurrentView('citizen_portal');
    } else if (notif.link === '/risk_center' || notif.link === '/risk-center') {
      setCurrentView('risk_center');
    } else if (notif.linkedEntityType === 'hotspot' || notif.link === '/live_map' || notif.link === '/map') {
      setCurrentView('live_map');
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    storageService.markNotificationRead(id);
    refreshAllData();
  };

  const handleDeleteNotification = (id: string) => {
    storageService.deleteNotification(id);
    refreshAllData();
  };

  const handleClearAllReadNotifications = () => {
    storageService.clearAllReadNotifications();
    refreshAllData();
  };

  const handleMarkAllNotificationsRead = () => {
    storageService.markAllNotificationsRead();
    refreshAllData();
  };

  // Evaluate task deadlines and emit overdue hazard alerts once on mount / refresh
  React.useEffect(() => {
    const overdueAlerts = evaluateOverdueTasks(tasks, notifications);
    if (overdueAlerts.length > 0) {
      overdueAlerts.forEach((alert) => {
        storageService.addNotificationWithDeduplication(alert);
      });
      refreshAllData();
    }
  }, []);

  const handleResetData = () => {
    storageService.resetToSeedData();
    refreshAllData();
  };

  const handleInitiateCategoryReport = (cat: PollutionCategory) => {
    setModalCategory(cat);
    setShowReportModal(true);
  };

  const handleQuickModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle || !modalDescription) return;

    handleCreateReport({
      category: modalCategory,
      title: modalTitle,
      description: modalDescription,
      location: userLocation,
      severity: modalSeverity,
      evidenceType: 'photo',
      evidenceNotes: modalEvidence || 'Citizen observational photographic intake.',
      status: 'submitted',
      reporterId: currentUser.id,
      reporterName: currentUser.displayName,
      isAnonymous: false,
    });

    setShowReportModal(false);
    setModalTitle('');
    setModalDescription('');
    setModalEvidence('');
  };

  // Human readable title for top navbar
  const getPageTitle = (view: NavView): string => {
    switch (view) {
      case 'overview':
        return 'Environmental Intelligence Dashboard';
      case 'live_map':
        return 'Live Geospatial Risk Map';
      case 'categories':
        return '9 Standardized Pollution Domains';
      case 'risk_center':
        return 'AI Risk Center & What-If Simulator';
      case 'prevention_tasks':
        return 'Prevention Command Center';
      case 'citizen_portal':
        return 'Citizen Participation & EcoPoints';
      case 'analytics':
        return 'Impact Analytics & Auditing';
      case 'admin_profile':
        return 'Admin Profile & Role-Based Access';
      case 'settings':
        return 'Settings & System Architecture';
      default:
        return 'EcoShield AI Platform';
    }
  };

  // Filtered reports if search query is typed
  const displayedReports = searchFilter
    ? reports.filter(
        (r) =>
          r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          r.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (r.location.addressName || '').toLowerCase().includes(searchFilter.toLowerCase())
      )
    : reports;

  // If user navigated to Authentication / Login
  if (showLoginPage) {
    return (
      <LoginPage
        onBackToLanding={() => {
          setShowLoginPage(false);
          setInApp(false);
        }}
        onSuccess={() => {
          setShowLoginPage(false);
          setInApp(true);
          setCurrentView('overview');
        }}
        onEnterDemo={() => {
          enterDemoMode('citizen');
          setShowLoginPage(false);
          setInApp(true);
          setCurrentView('overview');
        }}
      />
    );
  }

  // If user is on the Landing Page
  if (!inApp) {
    return (
      <LandingPage
        onEnterPlatform={() => setInApp(true)}
        onNavigateToLogin={() => setShowLoginPage(true)}
        onOpenReportModal={() => {
          setInApp(true);
          setShowReportModal(true);
        }}
        onSelectCategory={(cat) => {
          setInApp(true);
          setCurrentView('categories');
          setActiveCategoryDomain(cat);
          setModalCategory(cat);
        }}
        onNavigateToMap={() => {
          setInApp(true);
          setCurrentView('live_map');
        }}
        onNavigateToReports={() => {
          setInApp(true);
          setCurrentView('citizen_portal');
        }}
        onNavigateToTasks={() => {
          setInApp(true);
          setCurrentView('prevention_tasks');
        }}
        reports={reports}
        tasks={tasks}
        hotspots={hotspots}
        notifications={notifications}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080d0a] font-sans text-slate-100">
      {/* Dark Forest-Green Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          if (view === 'categories') {
            setActiveCategoryDomain(null);
          }
        }}
        userRole={currentUser.role}
        unreadCount={notifications.filter((n) => !n.read).length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenDemoGuide={() => setShowDemoGuide(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#080d0a]">
        {/* Top Header */}
        <Header
          pageTitle={getPageTitle(currentView)}
          currentUser={currentUser}
          notifications={notifications}
          authMode={authMode}
          isAuthenticated={isAuthenticated}
          onSwitchRole={(role) => switchRole(role)}
          onNotificationClick={handleNotificationClick}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onMarkNotificationRead={handleMarkNotificationRead}
          onDeleteNotification={handleDeleteNotification}
          onClearAllReadNotifications={handleClearAllReadNotifications}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSearchQuery={(q) => setSearchFilter(q)}
          onNavigateToAdminProfile={() => setCurrentView('admin_profile')}
          onNavigateToLogin={() => setShowLoginPage(true)}
          onNavigateToLanding={() => setInApp(false)}
          onSignOut={() => {
            signOutCloud();
            setCurrentView('overview');
          }}
        />

        {/* Operational Status Sub-Bar */}
        <div className="bg-[#060b08] border-b border-emerald-950/40 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Predictive Prevention Active</span>
            </span>
            <span className="text-emerald-950">&bull;</span>
            <span className="text-slate-400 hidden sm:inline">
              Active User: <strong className="text-slate-200 capitalize font-medium">{currentUser.displayName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowDemoGuide(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-xs"
              title="Open Hackathon Demo Walkthrough & Architecture Audit"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Demo Guide</span>
            </button>

            <button
              onClick={() => setInApp(false)}
              className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Observation</span>
            </button>
          </div>
        </div>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080d0a]">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* View: Overview Dashboard */}
            {currentView === 'overview' && (
              <OverviewDashboard
                reports={displayedReports}
                tasks={tasks}
                hotspots={hotspots}
                currentLocation={userLocation}
                onNavigateToView={(view) => setCurrentView(view)}
                onSelectReport={(rep) => setSelectedReport(rep)}
                onSelectHotspot={(spot) => setSelectedHotspot(spot)}
                onOpenReportModal={() => setShowReportModal(true)}
              />
            )}

            {/* View: Live Interactive Map & Meteorological Risk Telemetry */}
            {currentView === 'live_map' && (
              <LiveMapView
                reports={displayedReports}
                tasks={tasks}
                hotspots={hotspots}
                userLocation={userLocation}
                userRole={currentUser.role}
                onSelectLocation={(coords) => setUserLocation(coords)}
                onSelectReport={(r) => setSelectedReport(r)}
                onSelectHotspot={(h) => setSelectedHotspot(h)}
                onAddNewHotspot={handleAddNewHotspot}
                onNavigateToTasks={() => setCurrentView('prevention_tasks')}
                onNavigateToCitizenPortal={() => setCurrentView('citizen_portal')}
                onOpenReportModal={() => setShowReportModal(true)}
              />
            )}

            {/* View: 9 Pollution Categories */}
            {currentView === 'categories' && (
              <PollutionCategoriesView
                reports={displayedReports}
                tasks={tasks}
                initialCategory={activeCategoryDomain}
                onInitiateReport={handleInitiateCategoryReport}
                onViewTask={(task) => {
                  setCurrentView('prevention_tasks');
                }}
              />
            )}

            {/* View: Signature Feature - Prevention Command Center */}
            {currentView === 'prevention_tasks' && (
              <PreventionCommandCenter
                reports={displayedReports}
                tasks={tasks}
                users={allUsers}
                currentUser={currentUser}
                onCreateTask={handleCreateTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onUpdateReportStatus={handleUpdateReportStatus}
                onReturnTaskForCorrection={handleReturnTaskForCorrection}
                onAssignTaskWorker={handleAssignTaskWorker}
              />
            )}

            {/* View: AI Risk Center & Environmental Risk Assessment Engine */}
            {currentView === 'risk_center' && (
              <RiskCenterView
                reports={displayedReports}
                tasks={tasks}
                hotspots={hotspots}
                currentLocation={userLocation}
                currentUser={currentUser}
                onCreateTask={handleCreateTask}
                onNavigateToTasks={() => setCurrentView('prevention_tasks')}
                onInitiateReport={handleInitiateCategoryReport}
              />
            )}

            {/* View: Environmental Analytics & CSV Export */}
            {currentView === 'analytics' && (
              <AnalyticsReportsView
                reports={displayedReports}
                tasks={tasks}
                hotspots={hotspots}
                users={allUsers}
              />
            )}

            {/* View: Citizen Portal & EcoPoints */}
            {currentView === 'citizen_portal' && (
              <CommunityCitizenPortal
                currentUser={currentUser}
                allUsers={allUsers}
                onSubmitReport={handleCreateReport}
                userReports={displayedReports.filter((r) => r.reporterId === currentUser.id)}
                allReports={displayedReports}
                tasks={tasks}
                onNavigateToTasks={() => setCurrentView('prevention_tasks')}
                onUpdateReportStatus={handleUpdateReportStatus}
              />
            )}

            {/* View: Settings & Data Sources Status */}
            {currentView === 'settings' && (
              <SettingsStatusView
                onResetData={handleResetData}
                onOpenDemoGuide={() => setShowDemoGuide(true)}
              />
            )}

            {/* View: Admin Profile & Role-Based Access Control Console */}
            {currentView === 'admin_profile' && (
              <AdminProfileView
                onNavigateToDashboard={() => setCurrentView('overview')}
                onNavigateToTasks={() => setCurrentView('prevention_tasks')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Quick Submit Modal (Dark Charcoal/Forest Theme) */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b140f] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-emerald-950/80 text-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-950/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span>Submit Field Environmental Observation</span>
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickModalSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pollution Category</label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value as PollutionCategory)}
                    className="w-full border border-emerald-950/80 rounded-xl p-2 text-slate-200 outline-none bg-[#0e1a13] focus:border-emerald-500/50"
                  >
                    <option value="plastic">Plastic & Solid Waste</option>
                    <option value="water">Water Contamination</option>
                    <option value="air">Air Quality & Dust</option>
                    <option value="soil">Soil Contamination</option>
                    <option value="noise">Noise Decibels</option>
                    <option value="thermal">Thermal Pollution</option>
                    <option value="light">Light Pollution</option>
                    <option value="radioactive">Radioactive Source</option>
                    <option value="visual">Visual Blight</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Severity Rating (1-5)</label>
                  <select
                    value={modalSeverity}
                    onChange={(e) => setModalSeverity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full border border-emerald-950/80 rounded-xl p-2 text-slate-200 outline-none bg-[#0e1a13] focus:border-emerald-500/50"
                  >
                    <option value="1">1 - Minor Nuisance</option>
                    <option value="2">2 - Noticeable Concern</option>
                    <option value="3">3 - Substantial Hazard</option>
                    <option value="4">4 - High Environmental Risk</option>
                    <option value="5">5 - Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observation Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blocked drain canal with plastic beverage containers"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full border border-emerald-950/80 rounded-xl p-2.5 text-slate-100 outline-none bg-[#0e1a13] focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Environmental Narrative</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail visible volume, obstruction landmarks, nearby watercourses or population..."
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="w-full border border-emerald-950/80 rounded-xl p-2.5 text-slate-100 outline-none bg-[#0e1a13] focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Evidence or Photographic Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Photographic documentation shows 80% culvert choking before expected rain"
                  value={modalEvidence}
                  onChange={(e) => setModalEvidence(e.target.value)}
                  className="w-full border border-emerald-950/80 rounded-xl p-2.5 text-slate-100 outline-none bg-[#0e1a13] focus:border-emerald-500/50"
                />
              </div>

              <div className="p-2.5 bg-[#08120c] border border-emerald-950/60 rounded-xl text-slate-400 text-[11px] font-mono">
                📍 Coordinate: {userLocation.addressName || `Lat ${userLocation.lat}, Lng ${userLocation.lng}`}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-950/80 text-slate-400 hover:text-white hover:bg-[#0e1a13]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit to Queue (+10 EcoPoints)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Interactive Hackathon Judge Demo & Architecture Audit Modal */}
      <DemoGuideModal
        isOpen={showDemoGuide}
        onClose={() => setShowDemoGuide(false)}
        onSelectView={(view) => setCurrentView(view)}
        onSwitchRole={(role) => switchRole(role)}
      />
    </div>
  );
};
