import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Layers,
  Brain,
  ShieldAlert,
  BarChart3,
  Users,
  Settings,
  Leaf,
  X,
  Radio,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

export type NavView =
  | 'overview'
  | 'live_map'
  | 'categories'
  | 'risk_center'
  | 'prevention_tasks'
  | 'analytics'
  | 'citizen_portal'
  | 'settings'
  | 'admin_profile';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  userRole: UserRole;
  unreadCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenDemoGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  userRole,
  unreadCount = 0,
  isOpenMobile = false,
  onCloseMobile,
  onOpenDemoGuide,
}) => {
  const navItems = [
    { id: 'overview' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live_map' as NavView, label: 'Live Map', icon: MapPin },
    { id: 'categories' as NavView, label: 'Pollution Categories', icon: Layers, badge: '9 Types' },
    { id: 'risk_center' as NavView, label: 'Risk Center', icon: Brain, badge: 'AI Engine' },
    { id: 'prevention_tasks' as NavView, label: 'Prevention Tasks', icon: ShieldAlert, badge: 'Core' },
    { id: 'citizen_portal' as NavView, label: 'Citizen Portal', icon: Users, badge: 'EcoPoints' },
    { id: 'analytics' as NavView, label: 'Analytics', icon: BarChart3 },
    ...(userRole === 'admin'
      ? [{ id: 'admin_profile' as NavView, label: 'Admin Console', icon: UserCheck, badge: 'RBAC' }]
      : []),
    { id: 'settings' as NavView, label: 'Settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#08120c] border-r border-emerald-950/60 select-none text-slate-300">
      {/* Brand Header */}
      <div className="h-18 px-5 py-4 flex items-center justify-between border-b border-emerald-950/50 bg-[#060e09]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950/50">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">EcoShield</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight tracking-tight mt-0.5">
              Predict Pollution. Prevent Before It Happens.
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-forest-900/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">
          Navigation System
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-forest-900/90 text-white border border-emerald-500/30 shadow-subtle'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#0c1912]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className={isActive ? 'font-semibold text-white' : ''}>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#0f1f17] text-slate-400 border border-emerald-950/40 group-hover:text-emerald-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Role & Environment Status Indicator */}
      <div className="p-3 border-t border-emerald-950/50 bg-[#060e09]">
        <div className="p-2.5 rounded-xl bg-[#0c1811] border border-emerald-950/60 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Operating Role
            </span>
            <span className="capitalize font-semibold text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {userRole.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-950/40">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Open-Meteo & OSM Active</span>
            </div>
            <span className="font-mono text-emerald-500 font-bold">₹0 Free Tier</span>
          </div>

          {onOpenDemoGuide && (
            <button
              onClick={() => {
                onOpenDemoGuide();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full mt-2 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              <span>Judge Demo Tour</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 h-screen sticky top-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
