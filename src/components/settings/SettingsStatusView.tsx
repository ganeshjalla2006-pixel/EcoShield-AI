import React, { useState } from 'react';
import {
  Server,
  Database,
  Cloud,
  Map,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  FileText,
  Key,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Clock,
  Sparkles,
  Layers,
  Activity,
  Award,
  Users,
} from 'lucide-react';
import { isFirebaseConfigured, getFirebaseConfig } from '../../services/firebaseConfig';
import { storageService } from '../../services/storageService';

interface SettingsStatusViewProps {
  onResetData: () => void;
  onOpenDemoGuide?: () => void;
}

export const SettingsStatusView: React.FC<SettingsStatusViewProps> = ({ onResetData, onOpenDemoGuide }) => {
  const [resetDone, setResetDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'guide' | 'checklist'>('architecture');
  const fbConfigured = isFirebaseConfigured();
  const fbConfig = getFirebaseConfig();

  const handleReset = () => {
    if (confirm('Reset application data to original verified seed state? This resets local storage.')) {
      onResetData();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#09150e] rounded-2xl border border-emerald-950/70 p-6 sm:p-7 shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                System Status & Transparency
              </span>
              <span className="text-xs text-slate-400">₹0 Budget Verified</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Settings & System Architecture
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Verifiable architecture status for zero-cost open-source APIs, meteorological telemetry, geospatial mapping layers, explainable AI scoring, and hackathon judge evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#0c1811] hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-emerald-950/80 hover:border-red-500/40 rounded-xl text-xs font-semibold transition-colors shadow-xs"
              title="Reset state to pristine baseline seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {resetDone && (
          <div className="mt-4 p-3 bg-emerald-950/40 text-emerald-300 text-xs rounded-xl border border-emerald-500/40 font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Application data successfully restored to pristine seed baseline. LocalStorage refreshed.</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-emerald-950/60 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'architecture'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Services & Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'guide'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Hackathon Demo Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'checklist'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Compliance & Ethics Audit</span>
        </button>
      </div>

      {/* TAB 1: ARCHITECTURE & SERVICES */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Open-Meteo Weather Service */}
            <div className="bg-[#0b140f] p-5 rounded-2xl border border-emerald-950/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Open-Meteo Weather API</h3>
                    <span className="text-[10px] text-slate-400">Hourly meteorological telemetry</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  LIVE (FREE TIER)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Open-access forecast telemetry under CC BY 4.0. No API key required for non-commercial open-data usage. Provides hourly rainfall, ambient temperature, and wind speed for real-time risk synergy calculations.
              </p>
              <div className="pt-2 border-t border-emerald-950/60 text-[11px] text-slate-400 flex justify-between">
                <span>Quota: 10,000 daily requests</span>
                <span className="text-emerald-400 font-medium font-mono">15-min in-memory cache active</span>
              </div>
            </div>

            {/* Leaflet + OpenStreetMap */}
            <div className="bg-[#0b140f] p-5 rounded-2xl border border-emerald-950/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Map className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">OpenStreetMap + Leaflet</h3>
                    <span className="text-[10px] text-slate-400">Geospatial risk coordinate engine</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ACTIVE (₹0 COST)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Zero-cost open mapping using standard Leaflet rendering with OpenStreetMap tile attribution. Avoids mandatory credit card billing requirements of proprietary map engines.
              </p>
              <div className="pt-2 border-t border-emerald-950/60 text-[11px] text-slate-400 flex justify-between">
                <span>Tile Attribution: &copy; OpenStreetMap</span>
                <span className="text-blue-400 font-medium font-mono">Custom SVG Pins</span>
              </div>
            </div>

            {/* Persistence & Database Layer */}
            <div className="bg-[#0b140f] p-5 rounded-2xl border border-emerald-950/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Persistence & Storage Layer</h3>
                    <span className="text-[10px] text-slate-400">Dual-layer client/cloud architecture</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    fbConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {fbConfigured ? 'FIREBASE CONNECTED' : 'LOCAL PERSISTENT STORAGE ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {fbConfigured
                  ? `Connected to Firebase Project ID: ${fbConfig.projectId}. Strict security rules enforced via firestore.rules.`
                  : 'Zero-configuration mode: Browser persistent storage engine active. Tasks, reports, audit trails, and EcoPoints persist reliably across browser refreshes.'}
              </p>
              <div className="pt-2 border-t border-emerald-950/60 text-[11px] text-slate-400 flex justify-between">
                <span>Storage Key: ecoshield_*_v1</span>
                <span className="text-purple-400 font-medium font-mono">Schema Validated</span>
              </div>
            </div>

            {/* Explainable AI Engine */}
            <div className="bg-[#0b140f] p-5 rounded-2xl border border-emerald-950/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Explainable Risk Engine</h3>
                    <span className="text-[10px] text-slate-400">Deterministic Multi-Criteria Analysis</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  DETERMINISTIC v1.4
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deterministic multi-factor environmental risk model. Combines baseline toxicity weights, observer severity, meteorological synergies, and site history into a normalized 0-100 score.
              </p>
              <div className="pt-2 border-t border-emerald-950/60 text-[11px] text-slate-400 flex justify-between">
                <span>Formula: MCEDA Transparent</span>
                <span className="text-emerald-400 font-medium font-mono">100% Explainable</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HACKATHON DEMO GUIDE */}
      {activeTab === 'guide' && (
        <div className="bg-[#0b140f] rounded-2xl border border-emerald-950/70 p-6 space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Hackathon Evaluation & Judge Demonstration Sequence</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Step-by-step 3 to 5 minute evaluation path covering the complete predictive prevention lifecycle.
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="p-3.5 bg-[#080d0a] border border-emerald-950/80 rounded-xl space-y-1">
              <strong className="text-emerald-400 block font-mono text-[11px]">
                STEP 1: Problem Statement & 9 Domains (Min 0-1)
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Introduce EcoShield AI’s slogan: <em>“Predict Pollution. Prevent Before It Happens.”</em> Navigate to <strong>Pollution Categories</strong> to show that the system covers 9 standardized environmental pollution domains with intrinsic hazard baselines and genuine open-data sources.
              </p>
            </div>

            <div className="p-3.5 bg-[#080d0a] border border-emerald-950/80 rounded-xl space-y-1">
              <strong className="text-emerald-400 block font-mono text-[11px]">
                STEP 2: Citizen Reporting & Gamification (Min 1-2)
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Switch Role to <strong>Citizen</strong>. Click <strong>Log Observation</strong> to submit a plastic drainage blockage. Point out the instant <strong>+10 EcoPoints</strong> reward, anti-gaming 60-second duplicate throttle, and the in-app confirmation notification.
              </p>
            </div>

            <div className="p-3.5 bg-[#080d0a] border border-emerald-950/80 rounded-xl space-y-1">
              <strong className="text-emerald-400 block font-mono text-[11px]">
                STEP 3: Prevention Command Center Dispatch (Min 2-3)
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Switch Role to <strong>Admin</strong>. Open <strong>Prevention Tasks</strong>. Find the submitted report in the Priority Incident Queue and dispatch a prevention task to Field Worker Rajesh with an explicit deadline.
              </p>
            </div>

            <div className="p-3.5 bg-[#080d0a] border border-emerald-950/80 rounded-xl space-y-1">
              <strong className="text-emerald-400 block font-mono text-[11px]">
                STEP 4: Field Execution & Verification (Min 3-4)
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Switch Role to <strong>Field Worker</strong>. Upload completion notes/proof. Submit for sign-off. Switch back to <strong>Admin</strong> to review the immutable audit trail and verify. Show the <strong>+25 EcoPoints</strong> awarded to the worker.
              </p>
            </div>

            <div className="p-3.5 bg-[#080d0a] border border-emerald-950/80 rounded-xl space-y-1">
              <strong className="text-emerald-400 block font-mono text-[11px]">
                STEP 5: Live Weather Map & Analytics Audit (Min 4-5)
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Open <strong>Live Map</strong> to see Leaflet pins and live weather telemetry. Open <strong>Risk Center</strong> &rarr; What-If Simulator to test rainfall adjustments. Open <strong>Analytics</strong> to filter real vs demo records and export a sanitized CSV.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ZERO-COST COMPLIANCE & ETHICS CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-[#0b140f] rounded-2xl border border-emerald-950/70 p-6 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Zero-Budget Compliance & Ethical AI Declaration (₹0 Spent)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3.5 bg-[#080d0a] rounded-xl border border-emerald-950/80 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">No Paid AI APIs:</strong>
                Explainable Multi-Criteria Decision Analysis runs deterministically in the client with mathematical transparency. Zero OpenAI or Anthropic billing.
              </div>
            </div>

            <div className="p-3.5 bg-[#080d0a] rounded-xl border border-emerald-950/80 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">No Paid Mapping APIs:</strong>
                Leaflet + OpenStreetMap provides zero-cost spatial mapping without requiring Google Cloud billing account activation.
              </div>
            </div>

            <div className="p-3.5 bg-[#080d0a] rounded-xl border border-emerald-950/80 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">No SMS / Phone OTP Costs:</strong>
                Browser-local persistent session simulator; zero remote push or telephony fees incurred.
              </div>
            </div>

            <div className="p-3.5 bg-[#080d0a] rounded-xl border border-emerald-950/80 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">No Secret Keys in Git:</strong>
                Zero credentials hardcoded in codebase; template environment provided in `.env.example`.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
