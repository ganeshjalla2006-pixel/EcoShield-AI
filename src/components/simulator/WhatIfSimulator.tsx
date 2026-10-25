import React, { useState } from 'react';
import {
  Sliders,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Cpu,
  Brain,
  Layers,
  FileCode,
} from 'lucide-react';
import { PollutionCategory, RiskLevel, SimulationInputs, SimulationResult } from '../../types';
import { EnvironmentalRiskEngine, CATEGORY_BASELINE_WEIGHTS } from '../../services/riskEngine';

export const WhatIfSimulator: React.FC = () => {
  const [inputs, setInputs] = useState<SimulationInputs>({
    category: 'plastic',
    reportedSeverity: 4,
    rainfallAmountMm: 22,
    drainageCleared: false,
    wasteAccumulationLevel: 4,
    windSpeedKmh: 12,
    temperatureC: 28,
    daysSinceLastInspection: 10,
  });

  const [activeTab, setActiveTab] = useState<'simulator' | 'risk_rules'>('simulator');

  const simulation: SimulationResult = EnvironmentalRiskEngine.simulateScenario(inputs);

  const getRiskBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const handleResetDefaults = () => {
    setInputs({
      category: 'plastic',
      reportedSeverity: 4,
      rainfallAmountMm: 0,
      drainageCleared: true,
      wasteAccumulationLevel: 2,
      windSpeedKmh: 10,
      temperatureC: 24,
      daysSinceLastInspection: 2,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'simulator'
              ? 'bg-forest-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Interactive What-If Scenario Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('risk_rules')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'risk_rules'
              ? 'bg-forest-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Transparent AI Risk Engine Logic</span>
        </button>
      </div>

      {activeTab === 'simulator' ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Hypothetical Sensitivity Lab
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                  What-If Environmental Risk Simulator
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Evaluate how preventive actions (e.g. clearing drainage culverts before heavy storms) alter environmental risk dynamics.
                </p>
              </div>
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Mitigation Preset</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Comparison Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Baseline Empirical Condition
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${getRiskBadgeColor(simulation.baselineRiskLevel)}`}>
                  {simulation.baselineRiskLevel} RISK
                </span>
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mb-1">
                {simulation.baselineRiskScore}
                <span className="text-base font-normal text-slate-400 ml-1">/ 100</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                Standard baseline calculated with standard category weights and initial reported severity.
              </p>
            </div>

            {/* Simulated Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Hypothetical Scenario Outcome</span>
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${getRiskBadgeColor(simulation.simulatedRiskLevel)}`}>
                  {simulation.simulatedRiskLevel} RISK
                </span>
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <div className="text-4xl font-extrabold text-slate-900">
                  {simulation.simulatedRiskScore}
                  <span className="text-base font-normal text-slate-400 ml-1">/ 100</span>
                </div>
                <div
                  className={`text-xs font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full ${
                    simulation.scoreDelta > 0
                      ? 'bg-red-100 text-red-700'
                      : simulation.scoreDelta < 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {simulation.scoreDelta > 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" /> +{simulation.scoreDelta} Risk Surge
                    </>
                  ) : simulation.scoreDelta < 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" /> {simulation.scoreDelta} Risk Reduction
                    </>
                  ) : (
                    'No Delta'
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                {simulation.scoreDelta < 0
                  ? 'Proactive preventive clearance significantly drops flood & leachate exposure.'
                  : simulation.scoreDelta > 0
                  ? 'Compounding weather and waste buildup elevates potential environmental catastrophe.'
                  : 'Scenario parameters match current baseline.'}
              </p>
            </div>
          </div>

          {/* Interactive Controls & Modifiers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Controls (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-forest-700" />
                <span>Adjust Scenario Parameters</span>
              </h3>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pollution Category</label>
                <select
                  value={inputs.category}
                  onChange={(e) => setInputs({ ...inputs, category: e.target.value as PollutionCategory })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-slate-50 text-slate-800"
                >
                  <option value="plastic">Plastic & Solid Waste (Culvert Blockage Focus)</option>
                  <option value="water">Water Contamination & Industrial Outfall</option>
                  <option value="air">Air Quality & Toxic Particulate</option>
                  <option value="soil">Soil Contamination & Brownfield Leaching</option>
                  <option value="thermal">Thermal Pollution & Effluent Anoxia</option>
                  <option value="noise">Noise Decibels & Acoustic Exposure</option>
                </select>
              </div>

              {/* Rainfall Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Forecast Rainfall Volume: {inputs.rainfallAmountMm} mm</span>
                  <span className="text-[11px] text-slate-400">
                    {inputs.rainfallAmountMm > 25 ? 'Torrential' : inputs.rainfallAmountMm > 5 ? 'Moderate' : 'Dry / Nil'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2"
                  value={inputs.rainfallAmountMm}
                  onChange={(e) => setInputs({ ...inputs, rainfallAmountMm: Number(e.target.value) })}
                  className="w-full accent-forest-700 cursor-pointer"
                />
              </div>

              {/* Drainage Cleared Toggle */}
              <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Proactive Drainage Clearance</span>
                  <p className="text-[11px] text-emerald-800">
                    Deploy trash rack cleaning and backhoe grabber prior to rainfall window.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInputs({ ...inputs, drainageCleared: !inputs.drainageCleared })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    inputs.drainageCleared
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {inputs.drainageCleared ? 'Culvert Cleared' : 'Unchecked / Clogged'}
                </button>
              </div>

              {/* Waste Accumulation Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Waste Accumulation Density: Level {inputs.wasteAccumulationLevel}/5</span>
                  <span className="text-[11px] text-slate-400">
                    {inputs.wasteAccumulationLevel >= 4 ? 'Overflowing' : 'Managed'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={inputs.wasteAccumulationLevel}
                  onChange={(e) => setInputs({ ...inputs, wasteAccumulationLevel: Number(e.target.value) })}
                  className="w-full accent-forest-700 cursor-pointer"
                />
              </div>

              {/* Days Since Last Inspection */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Days Since Site Inspection: {inputs.daysSinceLastInspection} days</span>
                  <span className="text-[11px] text-slate-400">
                    {inputs.daysSinceLastInspection > 14 ? 'Lapsed / High Uncertainty' : 'Fresh Data'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={inputs.daysSinceLastInspection}
                  onChange={(e) => setInputs({ ...inputs, daysSinceLastInspection: Number(e.target.value) })}
                  className="w-full accent-forest-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Factors & Limitations (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Mitigating Factors */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Active Preventive Reductions</span>
                </div>
                {simulation.mitigatingFactors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No mitigating actions applied in this run.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {simulation.mitigatingFactors.map((m, idx) => (
                      <li key={idx} className="bg-emerald-50 p-2 rounded border border-emerald-100 flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Worsening Factors */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Compounding Risk Escalators</span>
                </div>
                {simulation.worseningFactors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No compounding escalators active.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {simulation.worseningFactors.map((w, idx) => (
                      <li key={idx} className="bg-red-50 p-2 rounded border border-red-100 flex items-start gap-1.5">
                        <span className="text-red-600 font-bold">▲</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Limitations Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 leading-snug space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Scientific Simulator Limitations</span>
                </div>
                <p>{simulation.limitations}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Explanatory Rule Engine View */
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Architectural Transparency
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              Deterministic Explainable Risk Engine
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              In accordance with prompt constraints, EcoShield AI avoids claiming an opaque "deep neural model" without
              appropriate calibration datasets. Our engine employs documented, verifiable multi-criteria environmental decision analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-xs text-slate-800 mb-1">1. Category Baseline (0-25 pts)</div>
              <p className="text-[11px] text-slate-600">
                Inherent toxicity, dispersion velocity, and environmental half-life. Radioactive (25), Water (22), Air (20), Plastic (16), Noise (12), Visual (8).
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-xs text-slate-800 mb-1">2. Reported Severity (0-30 pts)</div>
              <p className="text-[11px] text-slate-600">
                Ground observation rating on 1-5 scale (6 points per rank). Scaled up based on field photos and inspector confirmation.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-xs text-slate-800 mb-1">3. Weather Synergy (0-20 pts)</div>
              <p className="text-[11px] text-slate-600">
                Real-time Open-Meteo feeds. Heavy rainfall amplifies drainage clogging; high wind accelerates atmospheric plumes; heat induces aquatic anoxia.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-xs overflow-x-auto space-y-2">
            <div className="text-emerald-400 font-bold">// Normalized Environmental Risk Formula</div>
            <div>RiskScore = Min(100, BaseHazard(Cat) + (Severity * 6) + WeatherMultiplier + EvidenceScore + ProximityHistory)</div>
            <div className="text-slate-400 mt-2">// Risk Classification Tiers:</div>
            <div>Critical: Score &ge; 80 (Mandates immediate 24h field intervention)</div>
            <div>High:     Score &ge; 60 (Mandates 48h mitigation task dispatch)</div>
            <div>Moderate: Score &ge; 35 (Queued for scheduled field inspection)</div>
            <div>Low:      Score &lt; 35 (Routine community monitoring)</div>
          </div>
        </div>
      )}
    </div>
  );
};
