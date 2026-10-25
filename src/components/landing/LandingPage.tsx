import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Leaf,
  Activity,
  Wind,
  Droplet,
  Trash2,
  Brain,
  Sliders,
  CheckCircle,
  Users,
  Compass,
  Lock,
} from 'lucide-react';
import { PollutionCategory } from '../../types';

interface LandingPageProps {
  onEnterPlatform: () => void;
  onOpenReportModal: () => void;
  onSelectCategory?: (category: PollutionCategory) => void;
  onNavigateToLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPlatform,
  onOpenReportModal,
  onSelectCategory,
  onNavigateToLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-20 bg-forest-950 text-white border-b border-forest-900 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-700 border border-emerald-400/30 flex items-center justify-center text-white shadow-sm">
            <Leaf className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              EcoShield <span className="text-emerald-400 font-semibold text-sm">AI</span>
            </span>
            <span className="hidden sm:block text-[11px] text-emerald-400 font-medium">
              Predict Pollution. Prevent Before It Happens.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium bg-[#08120c] hover:bg-[#0c1a11] px-3 py-2 rounded-xl border border-emerald-950/80 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin & Sign In</span>
            </button>
          )}
          <button
            onClick={onOpenReportModal}
            className="text-xs text-slate-200 hover:text-white font-medium hidden sm:inline"
          >
            Submit Incident
          </button>
          <button
            onClick={onEnterPlatform}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section with Environmental Visuals */}
      <section className="relative bg-gradient-to-b from-forest-950 via-forest-900 to-slate-900 text-white py-20 px-6 sm:px-12 overflow-hidden border-b border-forest-800">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Production-Oriented Environmental Risk Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Predict Environmental Risks.<br />
            <span className="text-emerald-400">Prevent Disasters Before They Happen.</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            EcoShield AI synthesizes authentic meteorological forecasts with geotagged citizen observations to trigger
            proactive field interventions—clearing choked stormwater culverts, containing industrial plumes, and neutralizing
            toxic hazards before irreversible damage strikes communities.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <button
              onClick={onEnterPlatform}
              className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-7 py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <span>Enter Prevention Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-6 py-3.5 rounded-xl border border-white/20 transition-colors"
            >
              <span>Submit Citizen Observation</span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="pt-10 flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>₹0 Budget / 100% Free Stack</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Real Open-Meteo Weather API</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Leaflet + OpenStreetMap</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Transparent Explainable AI Rules</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Standard Environmental Pollution Domains */}
      <section className="py-16 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Comprehensive Monitoring
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Nine Standardized Environmental Risk Domains
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Each category maintains tailored risk indicators, genuine public data origins, and specific preventive protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              code: 'plastic' as PollutionCategory,
              cat: 'Plastic & Solid Waste',
              desc: 'Detection of culvert clogging and plastic accumulation prior to storm surge events.',
              icon: Trash2,
              color: 'text-orange-600 bg-orange-50',
            },
            {
              code: 'water' as PollutionCategory,
              cat: 'Water Contamination',
              desc: 'Monitoring toxic industrial effluent, BOD depletion, and canal outfall foam.',
              icon: Droplet,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              code: 'air' as PollutionCategory,
              cat: 'Air Quality & Dust',
              desc: 'Tracking particulate resuspension, generator soot, and atmospheric inversion layers.',
              icon: Wind,
              color: 'text-slate-600 bg-slate-100',
            },
            {
              code: 'soil' as PollutionCategory,
              cat: 'Soil Pollution',
              desc: 'Brownfield heavy metal slag, illegal chemical drum dumping, and agricultural leaching.',
              icon: Leaf,
              color: 'text-amber-700 bg-amber-50',
            },
            {
              code: 'noise' as PollutionCategory,
              cat: 'Noise Decibels',
              desc: 'Night-time construction pounding and excessive industrial acoustic exposure.',
              icon: Activity,
              color: 'text-purple-600 bg-purple-50',
            },
            {
              code: 'thermal' as PollutionCategory,
              cat: 'Thermal Pollution',
              desc: 'Industrial cooling outfalls and urban heat island microclimate shocks.',
              icon: Activity,
              color: 'text-red-600 bg-red-50',
            },
            {
              code: 'light' as PollutionCategory,
              cat: 'Light Pollution',
              desc: 'Unshielded outdoor luminaires, skyglow, and nocturnal ecological disturbance.',
              icon: Activity,
              color: 'text-pink-600 bg-pink-50',
            },
            {
              code: 'radioactive' as PollutionCategory,
              cat: 'Radioactive Materials',
              desc: 'Industrial gauge loss and radiation protection cordon enforcement.',
              icon: ShieldAlert,
              color: 'text-yellow-600 bg-yellow-50',
            },
            {
              code: 'visual' as PollutionCategory,
              cat: 'Visual Blight',
              desc: 'Open fly-tipping and derelict dumps serving as precursors to toxic waste.',
              icon: Users,
              color: 'text-teal-600 bg-teal-50',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(item.code);
                  } else {
                    onEnterPlatform();
                  }
                }}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3 font-bold group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-forest-800 transition-colors">{item.cat}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-forest-700 font-semibold group-hover:text-forest-900">
                  <span>Explore protocols & incidents</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Signature Architecture Workflow Banner */}
      <section className="bg-slate-900 text-white py-16 px-6 sm:px-12 border-t border-slate-800">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Signature Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              From Environmental Observation to Verified Prevention
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              EcoShield AI establishes an unbroken, audited chain of accountability.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-emerald-400 font-mono font-bold block mb-1">01 / DETECT</span>
              <h4 className="font-bold text-white mb-1">Observation & Telemetry</h4>
              <p className="text-slate-400 text-[11px]">
                Citizen reports or sensor hotspots paired with live Open-Meteo rain & wind forecasts.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-emerald-400 font-mono font-bold block mb-1">02 / MODEL</span>
              <h4 className="font-bold text-white mb-1">Transparent AI Risk</h4>
              <p className="text-slate-400 text-[11px]">
                Deterministic multi-criteria engine calculates normalized 0-100 score with full reasoning.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-emerald-400 font-mono font-bold block mb-1">03 / DISPATCH</span>
              <h4 className="font-bold text-white mb-1">Task Assignment</h4>
              <p className="text-slate-400 text-[11px]">
                Prevention Command Center routes action orders to field officers with clear deadlines.
              </p>
            </div>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-emerald-400 font-mono font-bold block mb-1">04 / VERIFY</span>
              <h4 className="font-bold text-white mb-1">Evidence & Audit</h4>
              <p className="text-slate-400 text-[11px]">
                Before/after photographic documentation reviewed & permanently signed off in the audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-950 text-slate-400 py-8 px-6 sm:px-12 border-t border-forest-900 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span>EcoShield AI Platform</span>
          </div>
          <div>
            Built with React, TypeScript, Leaflet, Open-Meteo & Tailwind CSS. Complies with zero-budget constraints.
          </div>
          <div className="text-slate-400">
            &copy; 2026 EcoShield AI Open Initiative.
          </div>
        </div>
      </footer>
    </div>
  );
};
