import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  ShieldCheck,
  Clock,
  ExternalLink,
  MapPin,
  Cloud,
  Database,
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  FileSpreadsheet,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView?: (view: any) => void;
  onSwitchRole?: (role: any) => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onSwitchRole,
}) => {
  const [activeTab, setActiveTab] = useState<'tour' | 'architecture' | 'provenance' | 'why_prevention'>('tour');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className="bg-[#0b140f] border border-emerald-950/80 rounded-2xl max-w-4xl w-full p-4 sm:p-6 text-slate-200 shadow-2xl flex flex-col max-h-[92vh] my-auto animate-in fade-in-50 zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-guide-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-950/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-guide-title" className="font-bold text-base sm:text-lg text-white">
                  EcoShield AI — Judge Demonstration & System Audit Guide
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Step 9 Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                “Predict Pollution. Prevent Before It Happens.” &bull; ₹0 Budget Compliance Verified
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-forest-900/60 transition-colors"
            aria-label="Close Demo Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-emerald-950/60 gap-1 pt-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tour')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'tour'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3–5 Min Judge Walkthrough</span>
          </button>

          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'provenance'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Live vs Demo Data Transparency</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture & 9 Domains</span>
          </button>

          <button
            onClick={() => setActiveTab('why_prevention')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'why_prevention'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why Proactive Prevention Matters</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-1 sm:p-2 py-4 space-y-4 text-xs">
          {/* TAB 1: 3-5 MINUTE DEMO TOUR */}
          {activeTab === 'tour' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl space-y-1">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recommended 3–5 Minute Evaluator Sequence</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Follow these 5 distinct operational steps to evaluate the end-to-end prevention lifecycle from citizen report to admin sign-off and analytics export.
                </p>
              </div>

              {/* Step 1 */}
              <div className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <h3 className="font-bold text-white text-xs">Explore 9 Pollution Domains & Problem Statement</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Minute 0:00 – 1:00</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Navigate to <strong>Pollution Categories</strong>. Highlight that EcoShield AI covers all 9 standardized pollution types (Air, Water, Soil, Noise, Light, Thermal, Plastic, Radioactive, Visual). Each category provides intrinsic hazard baseline weights, standard mitigation protocols, and genuine public open data sources.
                </p>
                {onSelectView && (
                  <button
                    onClick={() => {
                      onSelectView('categories');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold mt-1"
                  >
                    <span>Jump to Pollution Categories</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Step 2 */}
              <div className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                      2
                    </span>
                    <h3 className="font-bold text-white text-xs">Citizen Report Intake & EcoPoints Award</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Minute 1:00 – 2:00</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Switch Role to <strong>Citizen (Public Scout)</strong> via header dropdown. Navigate to <strong>Citizen Portal</strong> or click <strong>Log Observation</strong>. Submit a report (e.g. Plastic waste blocking drainage canal; Severity 4). Observe instant <strong>+10 EcoPoints</strong> award, anti-gaming check, and in-app confirmation notification.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {onSwitchRole && (
                    <button
                      onClick={() => onSwitchRole('citizen')}
                      className="px-2.5 py-1 bg-forest-900 border border-emerald-500/30 text-emerald-300 rounded text-[11px] font-semibold"
                    >
                      Switch to Citizen
                    </button>
                  )}
                  {onSelectView && (
                    <button
                      onClick={() => {
                        onSelectView('citizen_portal');
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold"
                    >
                      <span>Open Citizen Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                    <h3 className="font-bold text-white text-xs">Admin Review & Prevention Task Dispatch</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Minute 2:00 – 3:00</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Switch Role to <strong>Admin (Director)</strong>. Navigate to <strong>Prevention Command Center</strong>. Locate the incoming report in the Priority Incident Queue and click <strong>Dispatch Task</strong>. Assign to Field Officer Rajesh Kumar with a concrete 24-hour deadline before rain.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {onSwitchRole && (
                    <button
                      onClick={() => onSwitchRole('admin')}
                      className="px-2.5 py-1 bg-forest-900 border border-emerald-500/30 text-emerald-300 rounded text-[11px] font-semibold"
                    >
                      Switch to Admin
                    </button>
                  )}
                  {onSelectView && (
                    <button
                      onClick={() => {
                        onSelectView('prevention_tasks');
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold"
                    >
                      <span>Open Prevention Tasks</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                      4
                    </span>
                    <h3 className="font-bold text-white text-xs">Field Worker Execution & Admin Sign-off</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Minute 3:00 – 4:00</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Switch Role to <strong>Field Worker (Officer)</strong>. Open the assigned task, transition status to <em>In Progress</em>, provide after-action proof notes (e.g. "Trash boom installed; 350kg debris removed"), and submit for verification. Switch back to <strong>Admin</strong> to verify or return for correction. Verification awards +25 EcoPoints to the field worker.
                </p>
              </div>

              {/* Step 5 */}
              <div className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                      5
                    </span>
                    <h3 className="font-bold text-white text-xs">Live Weather Map, Risk Simulator & Analytics Audit</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Minute 4:00 – 5:00</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Open <strong>Live Map</strong> to see Leaflet pins and live Open-Meteo telemetry. Open <strong>Risk Center</strong> &rarr; <em>What-If Simulator</em> to adjust the rainfall slider and observe immediate risk score deltas. Open <strong>Analytics</strong> to filter real vs demo data and export a privacy-sanitized CSV or JSON audit package.
                </p>
                {onSelectView && (
                  <button
                    onClick={() => {
                      onSelectView('analytics');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold mt-1"
                  >
                    <span>View Analytics & Data Export</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DATA PROVENANCE & TRANSPARENCY */}
          {activeTab === 'provenance' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl space-y-1">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Honest Architectural Data Transparency</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  EcoShield AI makes zero misleading claims. Here is an explicit declaration of what is genuinely live, what is stored locally, and what is seed data for demonstration purposes.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-emerald-950/60 rounded-xl overflow-hidden">
                  <thead className="bg-[#0e1a13] text-slate-300 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3 border-b border-emerald-950/80">Feature Component</th>
                      <th className="p-3 border-b border-emerald-950/80">Source & Mechanism</th>
                      <th className="p-3 border-b border-emerald-950/80">Classification</th>
                      <th className="p-3 border-b border-emerald-950/80">Operational Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/50 text-[11px]">
                    <tr className="hover:bg-forest-900/30">
                      <td className="p-3 font-semibold text-white">Weather Forecast Telemetry</td>
                      <td className="p-3 text-slate-300">Open-Meteo REST API (Hourly rain, temp, wind, WMO codes) with 15-min cache</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">100% Genuinely Live</td>
                      <td className="p-3 font-mono text-emerald-400">₹0 (Open Data)</td>
                    </tr>
                    <tr className="hover:bg-forest-900/30">
                      <td className="p-3 font-semibold text-white">Geospatial Basemap</td>
                      <td className="p-3 text-slate-300">Leaflet 1.9.4 rendering OpenStreetMap standard tile layers</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">100% Genuinely Live</td>
                      <td className="p-3 font-mono text-emerald-400">₹0 (OSM Free Tier)</td>
                    </tr>
                    <tr className="hover:bg-forest-900/30">
                      <td className="p-3 font-semibold text-white">User GPS Geolocation</td>
                      <td className="p-3 text-slate-300">Browser Geolocation API (Consented via explicit button click)</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">100% Genuinely Live</td>
                      <td className="p-3 font-mono text-emerald-400">₹0 (Browser Built-in)</td>
                    </tr>
                    <tr className="hover:bg-forest-900/30">
                      <td className="p-3 font-semibold text-white">Multi-Factor Risk Engine</td>
                      <td className="p-3 text-slate-300">Deterministic Multi-Criteria Decision Analysis (MCEDA) algorithm (0-100)</td>
                      <td className="p-3 font-mono text-cyan-400 font-bold">Client-Side Deterministic</td>
                      <td className="p-3 font-mono text-emerald-400">₹0 (No Cloud Inference)</td>
                    </tr>
                    <tr className="hover:bg-forest-900/30">
                      <td className="p-3 font-semibold text-white">Reports, Tasks & Audit Logs</td>
                      <td className="p-3 text-slate-300">Browser `localStorage` with fallback recovery; optional Firestore adapter</td>
                      <td className="p-3 font-mono text-amber-300 font-bold">Local Persistent Storage</td>
                      <td className="p-3 font-mono text-emerald-400">₹0 (No Server Billing)</td>
                    </tr>
                    <tr className="hover:bg-forest-900/30">
                      <td className="p-3 font-semibold text-white">Pre-Loaded Incidents & Hotspots</td>
                      <td className="p-3 text-slate-300">Calibrated baseline records tagged with `isDemo: true`</td>
                      <td className="p-3 font-mono text-purple-300 font-bold">Demonstration Seed Data</td>
                      <td className="p-3 font-mono text-emerald-400">₹0 (Packaged Baseline)</td>
                    </tr>
                    <tr className="hover:bg-forest-900/30">
                      <td className="p-3 font-semibold text-white">Role Switching</td>
                      <td className="p-3 text-slate-300">Client-side mock persona switcher for demo convenience</td>
                      <td className="p-3 font-mono text-amber-400 font-bold">Demo Simulation (No Server Auth)</td>
                      <td className="p-3 font-mono text-emerald-400">₹0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-[#080d0a] border border-amber-500/30 rounded-xl p-3.5 space-y-1.5 text-slate-300 text-[11px]">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Important Scientific & Ethical Disclaimers</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Not a Deep Learning Black Box:</strong> The risk calculation is an explainable mathematical formula based on environmental engineering principles, not an unverified neural network.</li>
                  <li><strong>Weather Forecasts vs Sensor Telemetry:</strong> Rain and wind forecasts from Open-Meteo act as risk catalysts (synergies); they are never fabricated as physical chemical sensor measurements.</li>
                  <li><strong>Privacy & Security:</strong> Anonymous reports never expose submitter identity. CSV and JSON exports scrub Base64 photographic blobs to prevent file bloat and protect community privacy.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM ARCHITECTURE & 9 POLLUTION DOMAINS */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl space-y-1">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Comprehensive 9 Pollution Categories Matrix</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Every category includes intrinsic baseline hazard weights (0-25), primary physical indicators, standard preventive protocols, and genuine public open data sources.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { name: 'Plastic Pollution', weight: 16, key: 'plastic', desc: 'Culvert & drainage choke points, storm backup, macro & microplastic runoff.' },
                  { name: 'Water Contamination', weight: 22, key: 'water', desc: 'Untreated industrial effluent, biochemical oxygen demand (BOD) spikes, chemical foam.' },
                  { name: 'Air Pollution', weight: 20, key: 'air', desc: 'PM2.5/PM10 resuspension, diesel particulate plumes, thermal inversions.' },
                  { name: 'Soil Pollution', weight: 18, key: 'soil', desc: 'Heavy metal foundry slag, illegal drum dumping, brownfield leaching.' },
                  { name: 'Noise Pollution', weight: 12, key: 'noise', desc: 'Nighttime hydraulic tooling near medical facilities, acute decibel violations.' },
                  { name: 'Thermal Pollution', weight: 14, key: 'thermal', desc: 'Superheated power plant cooling outflows inducing acute aquatic anoxia.' },
                  { name: 'Light Pollution', weight: 10, key: 'light', desc: 'Unshielded commercial sports floodlights disrupting nocturnal ecology.' },
                  { name: 'Radioactive Sources', weight: 25, key: 'radioactive', desc: 'Orphan scrap metal source exclusion zones, calibrated dose rate cordoning.' },
                  { name: 'Visual Blight', weight: 8, key: 'visual', desc: 'Construction fly-tipping, public right-of-way degradation, urban decay.' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{item.name}</span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        {item.weight}/25 Pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Data Flow Diagram Card */}
              <div className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-4 space-y-2">
                <span className="font-bold text-white text-xs block">End-to-End Prevention Workflow Pipeline</span>
                <div className="p-3 bg-[#0c1811] rounded-lg border border-emerald-950/80 font-mono text-[11px] text-slate-300 space-y-1.5 overflow-x-auto">
                  <div className="text-emerald-400 font-bold">Citizen Intake / Hotspot Record</div>
                  <div className="pl-4 text-slate-400">&darr; Fetches Open-Meteo Hourly Forecast (Rain, Wind, Heat)</div>
                  <div className="pl-4 text-emerald-300 font-bold">Deterministic Risk Engine (0-100 Score Band: Critical, High, Moderate, Low)</div>
                  <div className="pl-8 text-slate-400">&darr; Dispatches Priority Prevention Task with Action Deadline</div>
                  <div className="pl-8 text-cyan-300 font-bold">Field Officer Executes Mitigation & Uploads After-Action Proof</div>
                  <div className="pl-12 text-slate-400">&darr; Admin Reviews Audit Trail & Signs Off (+25 EcoPoints)</div>
                  <div className="pl-12 text-emerald-400 font-bold">Impact Analytics, Incident Closure & Sanitized CSV/JSON Export</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHY PROACTIVE PREVENTION MATTERS */}
          {activeTab === 'why_prevention' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl space-y-1">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>The Core Philosophy: "Predict Pollution. Prevent Before It Happens."</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Traditional environmental agencies are reactive: they clean up rivers *after* fish die-offs, or dredge neighborhoods *after* catastrophic flooding. EcoShield AI flips this paradigm to proactive mitigation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-2">
                  <span className="text-red-400 font-bold text-xs uppercase tracking-wide block">
                    Traditional Reactive Approach (Disaster Cleanup)
                  </span>
                  <ul className="space-y-2 text-slate-300 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">&times;</span>
                      <span>Debris remains in culverts until torrential monsoon rains overwhelm storm sewers.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">&times;</span>
                      <span>Entire residential sectors face sewage backflow and structural flood inundation.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">&times;</span>
                      <span>Emergency emergency response costs <strong>100x more</strong> in municipal funds and property damage.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">&times;</span>
                      <span>Citizens are left feeling powerless and distrustful of local governance.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-wide block">
                    EcoShield AI Predictive Prevention (Early Action)
                  </span>
                  <ul className="space-y-2 text-slate-300 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Citizen logs choked drainage culvert. Weather API detects 22mm rainfall front in 36 hours.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Risk Engine triggers a <strong>Critical Alert (Score 88/100)</strong> with a 24-hour response window.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Field Worker deploys a mechanical trash boom and extracts plastic <strong>before the rain starts</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Rainfall drains smoothly, zero flooding occurs, and citizen earns EcoPoints for civic stewardship.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Known Limitations & Roadmap */}
              <div className="bg-[#080d0a] border border-emerald-950/70 rounded-xl p-4 space-y-2 text-[11px] text-slate-300">
                <span className="font-bold text-white text-xs block">Technical Limitations & Future Roadmap</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
                  <div className="space-y-1">
                    <span className="text-amber-400 font-semibold block">Current Local Prototype Boundaries:</span>
                    <p>&bull; Persistence relies on client-side `localStorage`; clearing browser data resets state to seed data.</p>
                    <p>&bull; Role switcher simulates authorization locally without backend authentication or encrypted JWTs.</p>
                    <p>&bull; Weather updates have a 15-minute cache to respect Open-Meteo fair-use rate limits.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-emerald-400 font-semibold block">Production Scaling Roadmap:</span>
                    <p>&bull; Connect PostgreSQL / PostGIS backend with Row Level Security (RLS).</p>
                    <p>&bull; Direct LoRaWAN and MQTT integrations with real-time municipal water and air sensors.</p>
                    <p>&bull; Machine learning anomaly models trained on regional historical hydrological telemetry.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-emerald-950/60 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>EcoShield AI Platform v1.0 &bull; Built with React, TypeScript & Tailwind</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
            >
              Continue to Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
