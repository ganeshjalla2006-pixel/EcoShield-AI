import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  Wrench,
  FileText,
  CheckCircle2,
  Trash2,
  Check,
  X,
  Filter,
  Search,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  Lock,
  Radio,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { InAppNotification, UserProfile, UserRole } from '../../types';
import {
  NotificationFilterType,
  filterNotificationsByRole,
  filterNotificationsByTab,
  formatNotificationTime,
} from '../../services/notificationService';

interface NotificationCenterProps {
  notifications: InAppNotification[];
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notif: InAppNotification) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllRead: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentUser,
  isOpen,
  onClose,
  onNotificationClick,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAllRead,
}) => {
  const [activeTab, setActiveTab] = useState<NotificationFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmClearRead, setConfirmClearRead] = useState<boolean>(false);

  // 1. Filter by role visibility
  const roleFiltered = useMemo(
    () => filterNotificationsByRole(notifications, currentUser),
    [notifications, currentUser]
  );

  // 2. Filter by active tab
  const tabFiltered = useMemo(
    () => filterNotificationsByTab(roleFiltered, activeTab),
    [roleFiltered, activeTab]
  );

  // 3. Filter by search query
  const displayedNotifications = useMemo(() => {
    if (!searchQuery.trim()) return tabFiltered;
    const q = searchQuery.toLowerCase();
    return tabFiltered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.category || '').toLowerCase().includes(q)
    );
  }, [tabFiltered, searchQuery]);

  const unreadCount = roleFiltered.filter((n) => !n.read).length;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl max-w-2xl w-full p-4 sm:p-6 text-slate-200 shadow-2xl flex flex-col max-h-[90vh] my-auto animate-in fade-in-50 zoom-in-95 duration-150 relative z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 id="notification-center-title" className="font-bold text-base text-white flex items-center gap-2">
                <span>In-App Notification Center</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {unreadCount} Unread
                  </span>
                )}
              </h2>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Persona View:</span>
                <span className="capitalize font-semibold text-emerald-400">
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span>&bull;</span>
                <span className="text-slate-400">{currentUser.displayName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#0e1d15] transition-colors"
            title="Close Notification Center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational & Zero-Budget Notice Banner */}
        <div className="my-3 p-2.5 bg-[#08120c] rounded-xl border border-emerald-950/60 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="text-slate-300">In-App Architecture:</strong> Notifications are securely persisted in
            your local browser storage. No paid remote push messaging, SMS, or external Firebase servers are required
            (preserving the ₹0 budget constraint). Role switching is for verification and testing.
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-2.5 pb-3 border-b border-emerald-950/60">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-[#0e1a13] text-slate-300 hover:bg-[#13281c] border border-emerald-950/80'
              }`}
            >
              All ({roleFiltered.length})
            </button>

            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'unread'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-[#0e1a13] text-slate-300 hover:bg-[#13281c] border border-emerald-950/80'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('alert')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'alert'
                  ? 'bg-red-600/80 text-white font-semibold shadow-xs'
                  : 'bg-[#0e1a13] text-slate-300 hover:bg-[#13281c] border border-emerald-950/80'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Risk Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('task')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'task'
                  ? 'bg-sky-600/80 text-white font-semibold shadow-xs'
                  : 'bg-[#0e1a13] text-slate-300 hover:bg-[#13281c] border border-emerald-950/80'
              }`}
            >
              <Wrench className="w-3 h-3 text-sky-400" />
              <span>Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'report'
                  ? 'bg-emerald-600/80 text-white font-semibold shadow-xs'
                  : 'bg-[#0e1a13] text-slate-300 hover:bg-[#13281c] border border-emerald-950/80'
              }`}
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'system'
                  ? 'bg-purple-600/80 text-white font-semibold shadow-xs'
                  : 'bg-[#0e1a13] text-slate-300 hover:bg-[#13281c] border border-emerald-950/80'
              }`}
            >
              <Sliders className="w-3 h-3 text-purple-400" />
              <span>System</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notification messages, tasks, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="px-2.5 py-1.5 bg-[#0e1a13] hover:bg-[#13281c] text-emerald-400 hover:text-emerald-300 border border-emerald-950/80 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Mark all read
                </button>
              )}

              {confirmClearRead ? (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[10px] text-amber-400">Clear read?</span>
                  <button
                    onClick={() => {
                      onClearAllRead();
                      setConfirmClearRead(false);
                    }}
                    className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClearRead(false)}
                    className="px-2 py-1 bg-[#0e1a13] text-slate-400 rounded-lg text-[10px]"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearRead(true)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#0e1a13] rounded-xl transition-colors"
                  title="Clear all read notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification Cards Scroll Area */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 min-h-[220px]">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 opacity-30 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-400">No Notifications in this View</h4>
              <p className="text-[11px] text-slate-500 max-w-xs">
                {searchQuery
                  ? `No alerts match "${searchQuery}". Try a different keyword.`
                  : activeTab === 'unread'
                  ? 'All caught up! No unread notifications for your current persona.'
                  : 'Operational events and alerts will appear here as incidents are logged and assigned.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((n) => {
              const isAlert = n.type === 'alert' || n.severity === 'critical';
              const isTask = n.type === 'task';
              const isReport = n.type === 'report';

              return (
                <div
                  key={n.id}
                  className={`group relative rounded-xl border p-3 text-xs transition-all flex flex-col gap-1.5 ${
                    !n.read
                      ? 'bg-[#0e1a13] border-emerald-500/40 shadow-xs'
                      : 'bg-[#08120c]/60 border-emerald-950/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Icon */}
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isAlert
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : isTask
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : isReport
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {isAlert ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : isTask ? (
                          <Wrench className="w-3.5 h-3.5" />
                        ) : isReport ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : (
                          <Radio className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs leading-tight">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          )}
                          {n.category && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-900/40 uppercase">
                              {n.category}
                            </span>
                          )}
                          {n.severity && (
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                                n.severity === 'critical'
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {n.severity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Relative Time & Quick Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] text-slate-400">
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>{formatNotificationTime(n.createdAt)}</span>
                      </span>

                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(n.id);
                          }}
                          className="p-1 hover:text-emerald-400 hover:bg-[#13281c] rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(n.id);
                        }}
                        className="p-1 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors opacity-60 hover:opacity-100"
                        title="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Message Body */}
                  <p className="text-[11px] text-slate-300 leading-relaxed pl-8">
                    {n.message}
                  </p>

                  {/* Navigation Action Bar if Linked Record Exists */}
                  {(n.link || n.linkedEntityId) && (
                    <div className="pl-8 pt-1 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => {
                          onNotificationClick(n);
                          onClose();
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors group-hover:underline"
                      >
                        <span>
                          {n.type === 'task'
                            ? 'Open in Prevention Command Center'
                            : n.type === 'report'
                            ? 'Inspect in Citizen Portal'
                            : n.type === 'alert'
                            ? 'Investigate Risk Site'
                            : 'Navigate to View'}
                        </span>
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      {n.linkedEntityId && (
                        <span className="font-mono text-[10px] text-slate-400">
                          Ref: {n.linkedEntityId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <span>Role filtering active:</span>
            <strong className="text-white capitalize">{currentUser.role.replace('_', ' ')}</strong>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0e1a13] hover:bg-[#13281c] text-white rounded-xl font-medium border border-emerald-950/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
