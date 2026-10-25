/**
 * EcoShield AI — Admin Profile & Role-Based Access Management
 * 
 * Displays:
 * - Admin Display Name: Ganesh Reddy (when provisioned)
 * - Verified Email Status (ganeshjalla2006@gmail.com)
 * - Administrative Role Badge
 * - Sign-Out control
 * - Safe profile-editing options (display name only; role cannot be altered by client)
 * - Comprehensive Role-Based Permissions Matrix (Admin vs Field Worker vs Citizen)
 * - PostgreSQL RLS policy enforcement details
 */

import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Key,
  Database,
  ArrowRight,
  LogOut,
  Sliders,
  FileCheck,
  ShieldAlert,
  Edit2,
  Save,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_EMAIL, ADMIN_DISPLAY_NAME } from '../../services/authService';

interface AdminProfileViewProps {
  onNavigateToDashboard: () => void;
  onNavigateToTasks: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  onNavigateToDashboard,
  onNavigateToTasks,
}) => {
  const {
    currentUser,
    authMode,
    isSupabaseConfigured,
    isAuthenticated,
    isEmailVerified,
    isAdmin,
    signOutCloud,
    logout,
    updateDisplayName,
  } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(currentUser.displayName);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check if current user is the provisioned admin account
  const isTargetAdminEmail = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
      setSaveStatus('Display name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await updateDisplayName(newDisplayName.trim());
      if (res.success) {
        setIsEditingName(false);
        setSaveStatus('Display name updated successfully.');
      } else {
        setSaveStatus(res.error || 'Failed to update name.');
      }
    } catch (err: any) {
      setSaveStatus(err.message || 'Error saving name.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    if (authMode === 'cloud_authenticated') {
      signOutCloud();
    } else {
      logout();
    }
    onNavigateToDashboard();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              Identity & Access Management
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-xs text-slate-400">Step 12.2</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Admin Profile & Authorization Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic authentication, role-based capability boundaries, and database Row Level Security (RLS) enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToDashboard}
            className="px-3 py-1.5 rounded-xl bg-[#0e1a13] hover:bg-[#12261b] text-slate-300 hover:text-white border border-emerald-950/80 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>Overview Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Profile Identity Card */}
      <div className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Avatar and Primary Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-forest-900 border-2 border-emerald-500/40 text-emerald-300 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'G'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="bg-[#060e09] border border-emerald-500/50 rounded-lg px-2.5 py-1 text-sm text-white font-bold outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                      title="Save Name"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <span>{currentUser.displayName}</span>
                    </h3>
                    <button
                      onClick={() => {
                        setNewDisplayName(currentUser.displayName);
                        setIsEditingName(true);
                      }}
                      className="text-slate-400 hover:text-emerald-400 p-1"
                      title="Edit Display Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.email}</span>
                </span>

                {/* Verification Badge */}
                {authMode === 'cloud_authenticated' ? (
                  isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-sans">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Cloud Identity</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-sans">
                      <AlertCircle className="w-3 h-3" />
                      <span>Verification Link Pending</span>
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-sans">
                    <Sparkles className="w-3 h-3" />
                    <span>Local Evaluation Persona</span>
                  </span>
                )}
              </div>

              {saveStatus && (
                <div className="text-[11px] text-emerald-400 font-medium pt-0.5">{saveStatus}</div>
              )}
            </div>
          </div>

          {/* Key Metrics / Gamification Status */}
          <div className="flex items-center gap-4 bg-[#08120c] p-3.5 rounded-xl border border-emerald-950/60 self-start sm:self-auto">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                EcoPoints
              </div>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {currentUser.ecoPoints}
              </div>
            </div>
            <div className="w-px h-8 bg-emerald-950/80" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Reports Logged
              </div>
              <div className="text-lg font-black text-slate-100 font-mono">
                {currentUser.reportsSubmitted}
              </div>
            </div>
            <div className="w-px h-8 bg-emerald-950/80" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Tasks Verified
              </div>
              <div className="text-lg font-black text-slate-100 font-mono">
                {currentUser.tasksCompleted}
              </div>
            </div>
          </div>
        </div>

        {/* Operating Security Banner */}
        <div className="mt-5 pt-4 border-t border-emerald-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Authentication Mode:</span>
            {authMode === 'cloud_authenticated' ? (
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Supabase Auth & PostgreSQL Session
              </span>
            ) : (
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Local Demo Mode (Isolated Browser Storage)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>Security Model:</span>
            <span className="text-slate-200">PostgreSQL 15 + RLS Strict Policies</span>
          </div>
        </div>
      </div>

      {/* Role-Based Permissions & Capability Matrix */}
      <div className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Municipal Role-Based Access Control (RBAC)
              </h3>
              <p className="text-[11px] text-slate-400">
                Authorizations enforced by backend database policies, not merely client-side visibility toggles.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Active Role: {currentUser.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-950/80 text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">System Operational Capability</th>
                <th className="py-2.5 px-3 text-center">Citizen</th>
                <th className="py-2.5 px-3 text-center">Field Worker</th>
                <th className="py-2.5 px-3 text-center text-emerald-400 font-bold">Admin (Director)</th>
                <th className="py-2.5 px-3 text-center">Active Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/40 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Submit Geotagged Observations & Evidence
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center font-mono text-emerald-400">Active</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Review & Verify Citizen Reports
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600">✗ Denied</td>
                <td className="py-2.5 px-3 text-center text-slate-600">✗ Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center font-mono">
                  {isAdmin ? <span className="text-emerald-400">Authorized</span> : <span className="text-slate-500">Restricted</span>}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Dispatch & Assign Prevention Tasks
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600">✗ Denied</td>
                <td className="py-2.5 px-3 text-center text-slate-600">✗ Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center font-mono">
                  {isAdmin ? <span className="text-emerald-400">Authorized</span> : <span className="text-slate-500">Restricted</span>}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Execute Field Work & Upload Post-Mitigation Photos
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600">✗ Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center font-mono">
                  {(isAdmin || currentUser.role === 'field_worker') ? <span className="text-emerald-400">Authorized</span> : <span className="text-slate-500">Restricted</span>}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Sign Off Mitigation Verification & Return for Correction
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600">✗ Denied</td>
                <td className="py-2.5 px-3 text-center text-slate-600">✗ Denied</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Allowed</td>
                <td className="py-2.5 px-3 text-center font-mono">
                  {isAdmin ? <span className="text-emerald-400">Authorized</span> : <span className="text-slate-500">Restricted</span>}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Self-Promotion to Administrator Role
                </td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">🔒 Blocked</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">🔒 Blocked</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-bold">🔒 Blocked</td>
                <td className="py-2.5 px-3 text-center font-mono text-rose-400">Protected</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Provisioning & Security Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Authorized Provisioning Boundary */}
        <div className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Authorized Admin Provisioning Boundary</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Administrative credentials are never self-granted or inferred from an email string alone. To provision an administrator in production:
          </p>

          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
            <li>
              User must complete cryptographic email confirmation for <code className="text-emerald-300 font-mono">{ADMIN_EMAIL}</code>.
            </li>
            <li>
              A database superuser executes a server-side <code className="text-emerald-300 font-mono">UPDATE public.profiles</code> migration.
            </li>
            <li>
              PostgreSQL Row Level Security validates <code className="text-emerald-300 font-mono">auth.uid()</code> against verified roles.
            </li>
          </ol>

          <div className="p-2.5 rounded-xl bg-[#08120c] border border-emerald-950/60 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`-- Server-Side SQL Provisioning
UPDATE public.profiles
SET role = 'admin', display_name = 'Ganesh Reddy'
WHERE email = 'ganeshjalla2006@gmail.com';`}
          </div>
        </div>

        {/* Card: Database RLS Defense Layer */}
        <div className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL Row Level Security (RLS)</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            All API queries through the Supabase client are authenticated with the user's JWT token. PostgreSQL automatically rejects unauthorized mutations:
          </p>

          <div className="space-y-2 text-[11px]">
            <div className="p-2 rounded-lg bg-[#08120c] border border-emerald-950/40">
              <strong className="text-slate-200">Anti-Self-Escalation Check:</strong>
              <div className="text-slate-400 mt-0.5">
                RLS policy <code className="text-emerald-400 font-mono">WITH CHECK (role = current_role)</code> prevents users from modifying their own role field.
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#08120c] border border-emerald-950/40">
              <strong className="text-slate-200">Immutable Audit Logs:</strong>
              <div className="text-slate-400 mt-0.5">
                The <code className="text-emerald-400 font-mono">task_audit_logs</code> table permits <code className="text-emerald-400 font-mono">INSERT</code> but strictly lacks <code className="text-emerald-400 font-mono">UPDATE</code> and <code className="text-emerald-400 font-mono">DELETE</code> policies.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
