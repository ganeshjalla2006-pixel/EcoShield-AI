import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Database,
  Lock,
  Server,
  AlertTriangle,
  CheckCircle2,
  X,
  Copy,
  Check,
  ExternalLink,
  Code2,
  FileText,
  Key,
} from 'lucide-react';
import { getBackendStatus, DATABASE_SCHEMA_SPECIFICATION } from '../../services/backendService';

interface BackendFoundationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendFoundationModal: React.FC<BackendFoundationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'schema' | 'migration' | 'security'>('status');
  const [copied, setCopied] = useState(false);

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

  const status = getBackendStatus();

  const handleCopySchema = () => {
    navigator.clipboard.writeText(DATABASE_SCHEMA_SPECIFICATION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in-50 duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 relative z-10"
      >
        {/* Header */}
        <div className="bg-[#060e09] border-b border-emerald-950/70 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Secure Backend & Authentication Foundation</span>
                <span className="text-[10px] font-mono uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Step 11 Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Migration roadmap from browser demo storage to a hardened zero-budget cloud database.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-forest-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#08120c] px-4 py-2.5 border-b border-emerald-950/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Architecture Status</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Auth Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>PostgreSQL & RLS Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'migration'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Data Migration Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* TAB 1: Architecture Status */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="bg-[#0e1a13] border border-emerald-950/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Active Backend Mode</span>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>Browser LocalStorage Persistent Engine</span>
                    <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      ₹0 Budget • Zero Setup
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {status.statusMessage}
                  </p>
                </div>

                <div className="flex-shrink-0 bg-[#08120c] p-2.5 rounded-lg border border-emerald-950/70 font-mono text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Cloud Backend: Pending</span>
                  </div>
                  <div className="text-slate-400">Auth Mode: Client Persona Demo</div>
                </div>
              </div>

              {/* Supported ₹0 Cloud Tiers */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Supported ₹0-Budget Cloud Backends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#08120c] border border-emerald-950/70 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-emerald-400 text-xs">Supabase (PostgreSQL + RLS)</strong>
                      <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1">
                      <li>• 500 MB dedicated PostgreSQL database</li>
                      <li>• Server-enforced Row Level Security (RLS)</li>
                      <li>• Built-in GoTrue email/password authentication</li>
                      <li>• Real-time WebSocket change subscriptions</li>
                    </ul>
                  </div>

                  <div className="bg-[#08120c] border border-emerald-950/70 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-amber-400 text-xs">Firebase Cloud Firestore (Spark Tier)</strong>
                      <span className="text-[9px] font-mono bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">
                        Alternative
                      </span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1">
                      <li>• 1 GB storage, 50k reads/day, 20k writes/day</li>
                      <li>• Firebase Security Rules (already drafted in firestore.rules)</li>
                      <li>• Identity platform with email verification</li>
                      <li>• Offline IndexedDB cache persistence</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Prerequisites Checklist */}
              <div className="bg-[#0e1a13] border border-emerald-950/60 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-white text-xs">Prerequisites for Cloud Activation</h4>
                <ul className="space-y-1.5 text-slate-400">
                  {status.pendingPrerequisites.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Security & Authentication Controls */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Data Honesty Disclosure:</strong> The existing header role switcher is an in-browser persona
                  selector designed for hackathon judges and local usability testing. It does <em>not</em> provide cryptographic
                  server-side session security. Never deploy public multi-tenant portals without activating the backend RLS controls below.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#08120c] p-3.5 rounded-xl border border-emerald-950/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Password Security</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Passwords must never be handled or stored in frontend plaintext. Supabase/Firebase manages bcrypt/argon2
                    hashing server-side with salt rotation and rate-limiting.
                  </p>
                </div>

                <div className="bg-[#08120c] p-3.5 rounded-xl border border-emerald-950/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Key Boundary Protection</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Client applications must strictly use publishable anonymous keys (`VITE_SUPABASE_ANON_KEY`).
                    Never expose `service_role` master secret keys in client-side code or git commits.
                  </p>
                </div>

                <div className="bg-[#08120c] p-3.5 rounded-xl border border-emerald-950/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Row Level Security (RLS)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    All tables enforce PostgreSQL RLS. Citizens can only create reports attributed to their own auth UID.
                    Only authorized Field Workers and Admins can update ticket statuses or close prevention tasks.
                  </p>
                </div>

                <div className="bg-[#08120c] p-3.5 rounded-xl border border-emerald-950/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Immutable Audit Trails</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Audit logs on tasks are strictly INSERT-only. No UPDATE or DELETE policies exist on `task_audit_logs`,
                    guaranteeing tamper-evident municipal accountability.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PostgreSQL Schema */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Ready-to-execute SQL migration script for Supabase SQL Editor:
                </span>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Schema SQL'}</span>
                </button>
              </div>

              <pre className="bg-[#050a07] border border-emerald-950/80 rounded-xl p-4 font-mono text-[10px] text-emerald-300 overflow-x-auto max-h-[380px] leading-relaxed">
                {DATABASE_SCHEMA_SPECIFICATION}
              </pre>
            </div>
          )}

          {/* TAB 4: Data Migration Plan */}
          {activeTab === 'migration' && (
            <div className="space-y-4">
              <div className="bg-[#0e1a13] border border-emerald-950/70 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-white text-xs">Four-Phase Safe Migration Sequence</h4>
                <ol className="space-y-2 text-[11px] text-slate-300 list-decimal list-inside">
                  <li>
                    <strong>Database Schema Provisioning:</strong> Open Supabase SQL Editor and execute the schema from the
                    Schema tab. This initializes tables, RLS policies, and enum constraints.
                  </li>
                  <li>
                    <strong>Initial Admin Provisioning:</strong> Sign up the director account via Supabase Auth.
                    In Supabase Dashboard, elevate `role = 'admin'` in the `public.profiles` table.
                  </li>
                  <li>
                    <strong>Safe Local Storage Transition:</strong> Do <em>not</em> automatically dump browser LocalStorage
                    photographic blobs directly into database rows. Upload images to a Supabase Storage bucket (`evidence-bucket`)
                    and insert clean public URLs into `evidence_url`.
                  </li>
                  <li>
                    <strong>Environment Configuration:</strong> Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in
                    Cloudflare Pages or production environment variables. EcoShield AI will automatically switch from local demo
                    storage to the live PostgreSQL backend.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#060e09] border-t border-emerald-950/70 p-4 flex items-center justify-between text-xs text-slate-400">
          <span>Zero-Cost Architecture • No Credit Cards Required</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0e1d15] hover:bg-[#13281c] text-white border border-emerald-950/80 rounded-lg transition-colors font-semibold"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
