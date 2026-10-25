import React, { useState } from 'react';
import {
  Bell,
  Search,
  Shield,
  Menu,
  CheckCircle,
  Command,
  ChevronDown,
  Sparkles,
  User,
  Sliders,
  Database,
  Lock,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { UserProfile, UserRole, InAppNotification } from '../../types';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { BackendFoundationModal } from './BackendFoundationModal';

interface HeaderProps {
  pageTitle: string;
  currentUser: UserProfile;
  notifications: InAppNotification[];
  authMode?: 'cloud_authenticated' | 'demo_mode';
  isAuthenticated?: boolean;
  onSwitchRole: (role: UserRole) => void;
  onNotificationClick: (notif: InAppNotification) => void;
  onMarkAllNotificationsRead: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllReadNotifications?: () => void;
  onOpenMobileSidebar?: () => void;
  onSearchQuery?: (query: string) => void;
  onNavigateToAdminProfile?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToLanding?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  currentUser,
  notifications,
  authMode = 'demo_mode',
  isAuthenticated = false,
  onSwitchRole,
  onNotificationClick,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onDeleteNotification,
  onClearAllReadNotifications,
  onOpenMobileSidebar,
  onSearchQuery,
  onNavigateToAdminProfile,
  onNavigateToLogin,
  onNavigateToLanding,
  onSignOut,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const roleMenuRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearchQuery) onSearchQuery(e.target.value);
  };

  // Keyboard shortcut Cmd/Ctrl + K to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to close dropdowns
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[#070e09] border-b border-emerald-950/60 px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0 backdrop-blur-md">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-forest-900/60 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white capitalize tracking-tight flex items-center gap-2">
            <span>{pageTitle}</span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </h1>
          <p className="text-[10px] text-slate-400 hidden lg:block">
            EcoShield AI &bull; Autonomous Environmental Risk Platform
          </p>
        </div>
      </div>

      {/* Center: Search Field */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search incident coordinates, pollution domains, or task IDs..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full bg-[#0d1b13] border border-emerald-950/80 rounded-xl pl-9 pr-14 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-slate-400 bg-[#08120c] px-1.5 py-0.5 rounded border border-emerald-950/60 font-mono">
            <span>⌘K</span>
          </div>
        </div>
      </div>

      {/* Right: Backend Foundation, Role Selector, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 3D Landing Page Shortcut */}
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 hover:from-emerald-900/60 hover:to-cyan-900/60 text-slate-200 rounded-xl text-xs font-semibold border border-emerald-500/30 transition-all shadow-xs"
            title="Return to 3D Landing Page"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">3D Landing</span>
          </button>
        )}

        {/* Backend Foundation Status Badge */}
        <button
          onClick={() => setShowBackendModal(true)}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0e1d15] hover:bg-[#12261b] text-slate-300 rounded-xl text-xs font-medium border border-emerald-950/80 transition-colors"
          title="Inspect Cloud Backend & Database Foundation"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono">
            {authMode === 'cloud_authenticated' ? 'Backend: Supabase RLS' : 'Backend: Local Demo'}
          </span>
        </button>

        {/* Role Selector / Cloud Auth Status */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0e1d15] hover:bg-[#12261b] text-slate-200 rounded-xl text-xs font-medium border border-emerald-950/80 transition-colors"
            title={authMode === 'cloud_authenticated' ? 'Verified Cloud Session' : 'Switch Demo Role Persona'}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-slate-400">Role:</span>
            <span className="capitalize font-semibold text-emerald-300">
              {currentUser.role.replace('_', ' ')}
            </span>
            {authMode === 'cloud_authenticated' ? (
              <span className="hidden md:inline px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Verified
              </span>
            ) : (
              <span className="hidden md:inline px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                Demo
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0c1811] rounded-xl shadow-2xl border border-emerald-900/40 py-1.5 z-40 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
              {authMode === 'cloud_authenticated' ? (
                <>
                  <div className="px-3 py-2 border-b border-emerald-950/60 flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Authenticated Account
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      PostgreSQL RLS
                    </span>
                  </div>

                  <div className="p-3 space-y-1">
                    <div className="text-white font-semibold">{currentUser.displayName}</div>
                    <div className="text-slate-400 text-[11px] font-mono truncate">{currentUser.email}</div>
                    <div className="pt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {currentUser.role.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-emerald-950/60 pt-1">
                    {onNavigateToAdminProfile && (
                      <button
                        onClick={() => {
                          onNavigateToAdminProfile();
                          setShowRoleMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-200 hover:text-white hover:bg-forest-900/50 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Manage Admin Profile & RBAC</span>
                      </button>
                    )}

                    {onSignOut && (
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowRoleMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Session</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-emerald-950/60 flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Demo Persona Switcher
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Instant
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSwitchRole('citizen');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-forest-900/50 transition-colors ${
                      currentUser.role === 'citizen' ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Citizen (Public Scout)</div>
                      <div className="text-[10px] text-slate-400">Submit reports, earn EcoPoints</div>
                    </div>
                    {currentUser.role === 'citizen' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchRole('field_worker');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-forest-900/50 transition-colors ${
                      currentUser.role === 'field_worker' ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Field Worker (Officer)</div>
                      <div className="text-[10px] text-slate-400">Executes tasks, submits proof</div>
                    </div>
                    {currentUser.role === 'field_worker' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-forest-900/50 transition-colors ${
                      currentUser.role === 'admin' ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Admin (Director)</div>
                      <div className="text-[10px] text-slate-400">Full dispatch & sign-off authority</div>
                    </div>
                    {currentUser.role === 'admin' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  {/* Link to Real Login */}
                  {onNavigateToLogin && (
                    <div className="border-t border-emerald-950/60 pt-1 mt-1">
                      <button
                        onClick={() => {
                          onNavigateToLogin();
                          setShowRoleMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-medium transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sign In with Real Account &rarr;</span>
                      </button>
                    </div>
                  )}

                  {/* Data Transparency Notice & Cloud Setup Link */}
                  <div className="mx-2 mt-1.5 p-2 rounded-lg bg-[#08120c] border border-emerald-950/60 text-[10px] text-slate-400 leading-snug space-y-1.5">
                    <div>
                      <span className="text-amber-400 font-semibold block mb-0.5">⚠️ Demonstration Mode:</span>
                      Role switching simulates municipal access tiers in the client browser. No cloud authentication or server session is enforced.
                    </div>
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setShowBackendModal(true);
                      }}
                      className="w-full text-left text-emerald-400 hover:text-emerald-300 font-mono text-[9px] flex items-center gap-1 pt-1 border-t border-emerald-950/60"
                    >
                      <Database className="w-3 h-3 text-emerald-400" />
                      <span>View Cloud Backend & RLS Specs</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications Icon with Unread Count Badge */}
        <div>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#0e1d15] transition-colors border border-transparent hover:border-emerald-950/60 flex items-center gap-1"
            title="In-App Notifications & Alerts"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500 text-black text-[9px] font-bold rounded-full font-mono shadow-xs shadow-emerald-400/50">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Modal / Panel Notification Center */}
          <NotificationCenter
            notifications={notifications}
            currentUser={currentUser}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onNotificationClick={(notif) => {
              onNotificationClick(notif);
              setShowNotifications(false);
            }}
            onMarkRead={(id) => onMarkNotificationRead && onMarkNotificationRead(id)}
            onMarkAllRead={() => onMarkAllNotificationsRead()}
            onDeleteNotification={(id) => onDeleteNotification && onDeleteNotification(id)}
            onClearAllRead={() => onClearAllReadNotifications && onClearAllReadNotifications()}
          />
        </div>

        {/* User Profile Pill */}
        <button
          onClick={() => {
            if (onNavigateToAdminProfile) onNavigateToAdminProfile();
          }}
          className="flex items-center gap-2.5 pl-2 border-l border-emerald-950/80 hover:opacity-90 transition-opacity text-left"
          title="Open Admin Profile & RBAC Console"
        >
          <div className="w-8 h-8 rounded-xl bg-forest-900 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-xs shadow-subtle shrink-0">
            {currentUser.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left text-xs">
            <div className="font-semibold text-white leading-tight truncate max-w-[120px]">
              {currentUser.displayName}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              {currentUser.ecoPoints} EcoPoints
            </div>
          </div>
        </button>
      </div>

      {/* Cloud Backend & Database Foundation Modal */}
      <BackendFoundationModal
        isOpen={showBackendModal}
        onClose={() => setShowBackendModal(false)}
      />
    </header>
  );
};
