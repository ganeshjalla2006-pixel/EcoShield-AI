import {
  PollutionCategory,
  RiskLevel,
  TaskPriority,
  RiskAssessment,
  FactorBreakdown,
  Coordinates,
  WeatherData,
  SimulationInputs,
  SimulationResult,
} from '../types';

/**
 * Baseline weights assigned by environmental hazard potential (0-25 scale).
 * Reflects baseline persistence, toxicity, and public health impact potential.
 */
export const CATEGORY_BASELINE_WEIGHTS: Record<PollutionCategory, number> = {
  radioactive: 25, // Extreme biological persistence and hazard
  water: 22,       // Rapid dispersion into drinking/aquatic systems
  air: 20,         // Inhalation hazard affecting broad populations
  soil: 18,        // Leaching into ground water and agricultural bioaccumulation
  plastic: 16,     // Structural clogging, microplastics, flash flood catalyst
  thermal: 14,     // Ecological shock, dissolved oxygen depletion in water bodies
  noise: 12,       // Chronic acoustic stress, sleep/cardiovascular disruption
  light: 10,       // Nocturnal ecological disruption, circadian disruption
  visual: 8,       // Amenity loss, illegal dumping precursor
};

/**
 * Standardized score bands as defined by environmental risk framework:
 * 0–24: Low
 * 25–49: Moderate
 * 50–74: High
 * 75–100: Critical
 */
export const RISK_SCORE_BANDS = {
  critical: {
    min: 75,
    max: 100,
    label: 'Critical',
    timeframe: '< 4 hours (Immediate emergency cordon & rapid mitigation)',
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
    dotColor: 'bg-red-400',
  },
  high: {
    min: 50,
    max: 74,
    label: 'High',
    timeframe: '< 24 hours (Rapid dispatch & engineering containment)',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    dotColor: 'bg-orange-400',
  },
  moderate: {
    min: 25,
    max: 49,
    label: 'Moderate',
    timeframe: '< 72 hours (Scheduled field inspection & source control)',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  low: {
    min: 0,
    max: 24,
    label: 'Low',
    timeframe: '< 7 days (Routine monitoring & preventive maintenance)',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
} as const;

export function getRiskLevelFromScore(score: number): RiskLevel {
  const normalized = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
  if (normalized >= 75) return 'critical';
  if (normalized >= 50) return 'high';
  if (normalized >= 25) return 'moderate';
  return 'low';
}

export function getResponseTimeframeFromScore(score: number): string {
  const level = getRiskLevelFromScore(score);
  return RISK_SCORE_BANDS[level].timeframe;
}

export const CATEGORY_METADATA: Record<
  PollutionCategory,
  {
    name: string;
    description: string;
    primaryIndicators: string[];
    genuineDataSources: string;
    liveSensorFeasibility: 'Live Telemetry Available' | 'Verified Field Inspection Needed' | 'Specialized Lab Assay Required';
    keyRisks: string[];
    standardPreventiveMeasures: string[];
  }
> = {
  air: {
    name: 'Air Pollution',
    description: 'Particulate matter (PM2.5/PM10), ground-level ozone, nitrogen dioxide, and volatile organic compounds from vehicular, industrial, and biomass emissions.',
    primaryIndicators: ['PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'NO₂ (ppb)', 'AQI index', 'Thermal inversion layer'],
    genuineDataSources: 'Government Central Pollution Control Board (CPCB), OpenAQ, Copernicus Atmospheric Service',
    liveSensorFeasibility: 'Live Telemetry Available',
    keyRisks: ['Cardiopulmonary distress', 'Smog accumulation under calm wind', 'Acid deposition on vegetation'],
    standardPreventiveMeasures: [
      'Issue local anti-idling and dust-suppression alerts',
      'Deploy water misting cannons along active construction corridors',
      'Temporarily reroute heavy diesel freight during atmospheric inversions',
    ],
  },
  water: {
    name: 'Water Pollution',
    description: 'Contamination of streams, lakes, coastal waters, or groundwater aquifers by untreated industrial effluent, chemical runoff, sewage, or heavy metals.',
    primaryIndicators: ['Dissolved Oxygen (DO mg/L)', 'Biochemical Oxygen Demand (BOD)', 'pH value', 'Fecal coliforms', 'Turbidity'],
    genuineDataSources: 'National Water Quality Monitoring Networks, Basin Authorities, Certified Grab Sampling Labs',
    liveSensorFeasibility: 'Specialized Lab Assay Required',
    keyRisks: ['Fish die-offs from anoxia', 'Potable water aquifer contamination', 'Toxic algal blooms'],
    standardPreventiveMeasures: [
      'Seal illegal industrial discharge sluices immediately',
      'Install floating absorbent boom barriers at inlet confluences',
      'Divert storm runoff to sedimentation retention ponds prior to river entry',
    ],
  },
  soil: {
    name: 'Soil Pollution',
    description: 'Deposition of xenobiotic chemicals, heavy metals (lead, cadmium, arsenic), petroleum hydrocarbons, or pesticides into terrestrial topsoil.',
    primaryIndicators: ['Soil heavy metal index', 'Hydrocarbon presence (mg/kg)', 'pH alteration', 'Loss of microbial biomass'],
    genuineDataSources: 'Agricultural soil testing institutes, Brownfield environmental remediation audits',
    liveSensorFeasibility: 'Specialized Lab Assay Required',
    keyRisks: ['Bioaccumulation in edible crops', 'Percolation into shallow drinking wells', 'Loss of arable land'],
    standardPreventiveMeasures: [
      'Isolate contaminated topsoil using impermeable geotextile liners',
      'Begin phytoremediation planting (hyper-accumulating botanical species)',
      'Intercept agricultural pesticide wash-off trenches',
    ],
  },
  noise: {
    name: 'Noise Pollution',
    description: 'Excessive ambient acoustic energy from industrial machinery, construction piling, transit arteries, or unpermitted commercial sound systems.',
    primaryIndicators: ['Equivalent Continuous Sound Level (Leq dBA)', 'Peak impulse noise (Lpeak dBC)', 'Day-Night average (Ldn)'],
    genuineDataSources: 'Continuous Ambient Noise Monitoring Stations (NANMS), Sound level meter spot checks',
    liveSensorFeasibility: 'Live Telemetry Available',
    keyRisks: ['Auditory fatigue and threshold shift', 'Sleep disruption near hospitals/residential zones', 'Disruption of avian communication'],
    standardPreventiveMeasures: [
      'Enforce acoustic curfews on high-decibel pile driving',
      'Install temporary sound barrier acoustic curtains around job sites',
      'Issue noise abatement warnings to unpermitted commercial venues',
    ],
  },
  light: {
    name: 'Light Pollution',
    description: 'Over-illumination, unshielded outdoor luminaires, skyglow, and excessive glare degrading the nocturnal environment.',
    primaryIndicators: ['Sky Quality Meter (mag/arcsec²)', 'Bortle Dark-Sky scale (Class 1-9)', 'Upward light ratio (%)'],
    genuineDataSources: 'VIIRS Day/Night Band satellite imagery, Globe at Night citizen science data',
    liveSensorFeasibility: 'Verified Field Inspection Needed',
    keyRisks: ['Disorientation of migratory birds', 'Disruption of insect pollination cycles', 'Human melatonin suppression'],
    standardPreventiveMeasures: [
      'Mandate full-cutoff downward shielded light fixtures on public poles',
      'Schedule automated dimming of commercial architectural facade lighting past 22:00',
      'Transition municipal lighting to warm color temperature (< 3000K)',
    ],
  },
  thermal: {
    name: 'Thermal Pollution',
    description: 'Abrupt elevation or depression of ambient temperature in water bodies or urban microclimates, typically from industrial cooling water discharge or loss of riparian canopy.',
    primaryIndicators: ['Thermal effluent delta (ΔT °C)', 'Water surface temperature', 'Urban Heat Island anomaly index'],
    genuineDataSources: 'Thermal infrared satellite radiometry (Landsat TIRS), Outfall temperature monitoring loggers',
    liveSensorFeasibility: 'Live Telemetry Available',
    keyRisks: ['Acute thermal shock to aquatic organisms', 'Accelerated bacterial proliferation', 'Urban heat stress vulnerability'],
    standardPreventiveMeasures: [
      'Require industrial cooling retention towers before outfall release',
      'Expand vegetative shade canopies along degraded water bank buffer zones',
      'Implement reflective cool-roof coatings in high-density urban clusters',
    ],
  },
  plastic: {
    name: 'Plastic & Solid Waste Pollution',
    description: 'Non-biodegradable polymeric refuse, uncollected single-use plastics, packaging debris, and dumped waste accumulating in waterways and urban storm infrastructure.',
    primaryIndicators: ['Debris volume per linear meter', 'Drainage cross-sectional occlusion (%)', 'Microplastic count / m³'],
    genuineDataSources: 'Municipal waste audits, Stormwater drain inspections, Verified community surveys',
    liveSensorFeasibility: 'Verified Field Inspection Needed',
    keyRisks: ['Severe storm drain blockage inducing localized flash floods', 'Entanglement of domestic & wild fauna', 'Microplastic fragmentation'],
    standardPreventiveMeasures: [
      'Deploy rapid catchment trash-traps at canal culverts before storm events',
      'Dispatch rapid clearance crews to unblock drainage culverts flagged with plastic buildup',
      'Establish community collection drop-points with EcoPoints incentives',
    ],
  },
  radioactive: {
    name: 'Radioactive Pollution',
    description: 'Ionizing radiation contamination from improperly disposed industrial gauges, medical radiotherapy isotopes, or uncontained radioactive materials.',
    primaryIndicators: ['Ambient gamma dose rate (µSv/h)', 'Alpha/Beta surface contamination (Bq/cm²)', 'Radon concentration (Bq/m³)'],
    genuineDataSources: 'National Radiation Protection Agencies, Environmental Gamma Monitoring Networks',
    liveSensorFeasibility: 'Specialized Lab Assay Required',
    keyRisks: ['Acute radiation exposure', 'Long-term oncological hazards', 'Exclusion zone necessity'],
    standardPreventiveMeasures: [
      'Immediately establish an exclusion cordon with certified Geiger counter verification',
      'Notify regional disaster management and nuclear regulatory inspectors',
      'Deploy lead-lined containment transport shields for source recovery',
    ],
  },
  visual: {
    name: 'Visual Pollution',
    description: 'Severe visual blight, uncontained open fly-tipping, chaotic illegal signage, derelict vehicle accumulation, or unkempt dumping ground blight.',
    primaryIndicators: ['Blight area square footage', 'Visual intrusion index', 'Accumulation age (days)'],
    genuineDataSources: 'Municipal code enforcement inspections, Verified citizen geotagged photography',
    liveSensorFeasibility: 'Verified Field Inspection Needed',
    keyRisks: ['Precursor to escalation into hazardous clandestine chemical dumping', 'Depreciation of community well-being', 'Vermin breeding'],
    standardPreventiveMeasures: [
      'Clean and landscape vulnerable vacant lots into green community pockets',
      'Erect deterrent fencing and warning signage with municipal penalties',
      'Deploy periodic mobile sanitation patrols to prevent recurring dumping',
    ],
  },
};

export class EnvironmentalRiskEngine {
  private static RULE_VERSION = 'v1.4.0-explainable-rules';

  /**
   * Deterministic, explainable scoring engine.
   * Calculates a normalized risk score (0-100) based on weighted factors and real weather synergy.
   * Fully sanitized against missing, null, or out-of-range parameters.
   */
  public static assessRisk(params: {
    category?: PollutionCategory;
    reportedSeverity?: number;
    coordinates?: Coordinates;
    hasVerifiedEvidence?: boolean;
    weather?: WeatherData | null;
    isRecurringHotspot?: boolean;
    daysSinceInspection?: number;
    title?: string;
  }): RiskAssessment {
    // 1. Sanitize Category (Fallback to 'plastic' if invalid or missing)
    const validCategories = Object.keys(CATEGORY_BASELINE_WEIGHTS) as PollutionCategory[];
    const category: PollutionCategory =
      params?.category && validCategories.includes(params.category)
        ? params.category
        : 'plastic';

    // 2. Sanitize Reported Severity (clamp between 1 and 5; default to 3)
    const rawSeverity = Number(params?.reportedSeverity);
    const reportedSeverity: 1 | 2 | 3 | 4 | 5 = (
      isNaN(rawSeverity)
        ? 3
        : Math.min(5, Math.max(1, Math.round(rawSeverity)))
    ) as 1 | 2 | 3 | 4 | 5;

    // 3. Sanitize Coordinates
    const coordinates: Coordinates = {
      lat: typeof params?.coordinates?.lat === 'number' && !isNaN(params.coordinates.lat) ? params.coordinates.lat : 28.6139,
      lng: typeof params?.coordinates?.lng === 'number' && !isNaN(params.coordinates.lng) ? params.coordinates.lng : 77.2090,
      addressName: params?.coordinates?.addressName || 'Environmental Monitoring Zone',
    };

    const hasVerifiedEvidence = Boolean(params?.hasVerifiedEvidence);
    const isRecurringHotspot = Boolean(params?.isRecurringHotspot);
    const daysSinceInspection = Math.max(0, Math.min(365, Number(params?.daysSinceInspection) || 1));
    const weather = params?.weather ?? null;

    const explanations: string[] = [];
    const recommendedActions: string[] = [];

    // Factor 1: Category Baseline Hazard Weight (0 to 25)
    const categoryBaseline = CATEGORY_BASELINE_WEIGHTS[category] ?? 15;
    explanations.push(
      `Baseline Hazard: ${category.toUpperCase()} has a baseline intrinsic hazard weight of ${categoryBaseline}/25 reflecting persistence and public toxicity.`
    );

    // Factor 2: Reported Severity (0 to 30)
    // Severity 1: 6pts, 2: 12pts, 3: 18pts, 4: 24pts, 5: 30pts
    const reportedSeverityWeight = reportedSeverity * 6;
    explanations.push(
      `Reported Severity (${reportedSeverity}/5): Contributes ${reportedSeverityWeight}/30 points based on observable physical magnitude.`
    );

    // Factor 3: Meteorological Synergy Multiplier (0 to 20)
    let weatherMultiplier = 4; // Baseline neutral weather
    let weatherSummary = 'Neutral ambient conditions (no severe meteorological multiplier)';

    if (weather) {
      const rain = Math.max(0, Number(weather.rain || weather.precipitation || 0));
      const wind = Math.max(0, Number(weather.windSpeed || 0));
      const temp = Number(weather.temperature ?? 24);

      // Synergy Scenario A: Rain + Plastic / Water / Soil / Radioactive Contamination
      if ((category === 'plastic' || category === 'water' || category === 'soil' || category === 'radioactive') && rain > 5) {
        if (rain > 20) {
          weatherMultiplier = 20;
          explanations.push(
            `CRITICAL METEOROLOGICAL AMPLIFIER: Heavy precipitation (${rain.toFixed(1)} mm) over ${category} risk site. Massive threat of drainage culvert hydraulic choking, flash flooding, or groundwater leaching.`
          );
          recommendedActions.push(
            'Dispatch urgent drainage clearance crew before rain peak',
            'Install floating retention trash booms across downstream outflow'
          );
        } else {
          weatherMultiplier = 14;
          explanations.push(
            `Moderate precipitation (${rain.toFixed(1)} mm) detected. Elevates runoff volume and contaminant wash-off.`
          );
          recommendedActions.push('Inspect storm drain inlets within 500m radius of the site');
        }
      }

      // Synergy Scenario B: High Wind + Air / Radioactive Contamination (Dispersion)
      else if ((category === 'air' || category === 'radioactive') && wind > 25) {
        weatherMultiplier = 18;
        explanations.push(
          `HIGH WIND VELOCITY (${wind.toFixed(1)} km/h): Rapidly accelerates downwind atmospheric dispersion toward populated residential zones.`
        );
        recommendedActions.push(
          'Issue downwind public advisory for vulnerable demographic groups',
          'Deploy continuous misting dust-suppression on open surfaces'
        );
      }

      // Synergy Scenario C: Stagnant Air Mass / Inversion + Air Pollution (Smog Trap)
      else if (category === 'air' && wind < 5) {
        weatherMultiplier = 16;
        explanations.push(
          `STAGNANT AIR MASS: Low wind velocity (${wind.toFixed(1)} km/h) prevents atmospheric boundary layer ventilation, concentrating particulates in ground breathing zones.`
        );
        recommendedActions.push('Temporarily restrict non-essential diesel generator operation');
      }

      // Synergy Scenario D: High Ambient Heat + Thermal / Chemical Water Pollution
      else if ((category === 'thermal' || category === 'water') && temp > 35) {
        weatherMultiplier = 17;
        explanations.push(
          `HIGH AMBIENT TEMPERATURE (${temp.toFixed(1)} °C): Sharp reduction in aquatic dissolved oxygen (DO) saturation compounding thermal effluent shock.`
        );
        recommendedActions.push('Activate mechanical river aeration and check dissolved oxygen levels');
      }

      // Synergy Scenario E: Noise with Atmospheric Wind Shear
      else if (category === 'noise' && wind > 20) {
        weatherMultiplier = 10;
        explanations.push(
          `Atmospheric wind gradient (${wind.toFixed(1)} km/h) extending downwind acoustic propagation footprint.`
        );
      }

      // Synergy Scenario F: Light Pollution on Clear Night
      else if (category === 'light' && rain === 0) {
        weatherMultiplier = 8;
        explanations.push('Unobscured nocturnal sky conditions amplifying upward lumen skyglow.');
      } else {
        weatherMultiplier = 6;
        weatherSummary = `Ambient temp ${temp.toFixed(1)}°C, wind ${wind.toFixed(1)} km/h, rain ${rain.toFixed(1)} mm.`;
      }
    } else {
      explanations.push('Weather telemetry unlinked for coordinates: Standard neutral meteorological coefficient (4/20) applied.');
    }

    // Factor 4: Evidence Confidence Weight (0 to 15)
    let evidenceConfidence = 5;
    let dataConfidence: 'low' | 'medium' | 'high' = 'low';

    if (hasVerifiedEvidence) {
      evidenceConfidence = 15;
      dataConfidence = 'high';
      explanations.push('Field verified observation with attached photographic or instrument evidence: +15/15 confidence weight.');
    } else {
      evidenceConfidence = 7;
      dataConfidence = 'medium';
      explanations.push('Community observation pending secondary municipal verification: +7/15 confidence weight.');
    }

    // Factor 5: Proximity, Recurring Hotspot & Inspection Elapsed Time (0 to 10)
    let proximityAndHistory = 0;
    if (isRecurringHotspot) {
      proximityAndHistory += 5;
      explanations.push('Documented recurring environmental hotspot: +5 vulnerability history points.');
    }

    if (daysSinceInspection > 7) {
      proximityAndHistory += 5;
      explanations.push(`Uninspected for ${daysSinceInspection} days: +5 points for accumulated unmonitored risk.`);
    } else {
      proximityAndHistory += 2;
    }

    // Total Normalized Score (0 to 100)
    const rawTotal =
      categoryBaseline +
      reportedSeverityWeight +
      weatherMultiplier +
      evidenceConfidence +
      proximityAndHistory;

    const normalizedScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    // Categorize Risk Level according to configurable standards:
    // 0–24: Low | 25–49: Moderate | 50–74: High | 75–100: Critical
    const level: RiskLevel = getRiskLevelFromScore(normalizedScore);
    const suggestedTimeframe = getResponseTimeframeFromScore(normalizedScore);

    let responsePriority: TaskPriority = 'low';
    if (level === 'critical') responsePriority = 'critical';
    else if (level === 'high') responsePriority = 'high';
    else if (level === 'moderate') responsePriority = 'medium';
    else responsePriority = 'low';

    // Standard Category Recommendations
    const catMetadata = CATEGORY_METADATA[category];
    if (catMetadata) {
      catMetadata.standardPreventiveMeasures.forEach((measure) => {
        if (!recommendedActions.includes(measure)) {
          recommendedActions.push(measure);
        }
      });
    }

    const factorBreakdown: FactorBreakdown = {
      categoryBaseline,
      reportedSeverity: reportedSeverityWeight,
      weatherMultiplier,
      evidenceConfidence,
      proximityAndHistory,
    };

    return {
      id: `RA-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: params.title || `${catMetadata?.name || category} Risk Evaluation`,
      category,
      coordinates,
      score: normalizedScore,
      level,
      factorBreakdown,
      explanations,
      recommendedActions: recommendedActions.slice(0, 4),
      responsePriority,
      suggestedTimeframe,
      dataConfidence,
      ruleSetVersion: EnvironmentalRiskEngine.RULE_VERSION,
      weatherSnapshotUsed: weather
        ? {
            temperature: weather.temperature,
            rainMm: weather.rain || weather.precipitation || 0,
            windKmh: weather.windSpeed,
            summary: weatherSummary,
          }
        : undefined,
      assessedAt: new Date().toISOString(),
    };
  }

  /**
   * What-If Scenario Simulator:
   * Evaluates outcomes of modifying actionable factors (e.g. culvert clearance vs rain surge vs wind changes).
   * Fully sanitized against missing, negative, or excessive parameters.
   */
  public static simulateScenario(inputs: SimulationInputs): SimulationResult {
    const activeModifiers: string[] = [];
    const mitigatingFactors: string[] = [];
    const worseningFactors: string[] = [];

    const validCategories = Object.keys(CATEGORY_BASELINE_WEIGHTS) as PollutionCategory[];
    const category: PollutionCategory =
      inputs?.category && validCategories.includes(inputs.category)
        ? inputs.category
        : 'plastic';

    const reportedSeverity = Math.min(5, Math.max(1, Math.round(Number(inputs?.reportedSeverity) || 4))) as 1 | 2 | 3 | 4 | 5;
    const rainfallAmountMm = Math.max(0, Math.min(300, Number(inputs?.rainfallAmountMm) || 0));
    const windSpeedKmh = Math.max(0, Math.min(150, Number(inputs?.windSpeedKmh) || 10));
    const temperatureC = Math.max(-40, Math.min(60, Number(inputs?.temperatureC) || 24));
    const wasteAccumulationLevel = Math.max(1, Math.min(5, Math.round(Number(inputs?.wasteAccumulationLevel) || 3)));
    const daysSinceLastInspection = Math.max(0, Math.min(365, Number(inputs?.daysSinceLastInspection) || 2));
    const drainageCleared = Boolean(inputs?.drainageCleared);

    // Calculate baseline
    const baseAssessment = this.assessRisk({
      category,
      reportedSeverity,
      coordinates: { lat: 28.6139, lng: 77.2090, addressName: 'Simulated Model Baseline' },
      hasVerifiedEvidence: true,
      weather: {
        coordinates: { lat: 28.6139, lng: 77.2090 },
        temperature: 24,
        apparentTemperature: 24,
        precipitation: 0,
        rain: 0,
        precipitationProbability: 10,
        windSpeed: 10,
        windDirection: 0,
        relativeHumidity: 60,
        weatherCode: 0,
        weatherDescription: 'Clear',
        hourly: { times: [], temperatures: [], precipitationProbs: [], windSpeeds: [] },
        daily: {
          dates: [],
          minTemps: [],
          maxTemps: [],
          precipSums: [],
          precipProbs: [],
          windSpeeds: [],
          weatherCodes: [],
          weatherDescriptions: [],
        },
        fetchedAt: new Date().toISOString(),
        source: 'Baseline Reference Weather',
      },
      isRecurringHotspot: false,
      daysSinceInspection: 1,
    });

    let simulatedScore = baseAssessment.score;

    // 1. Rainfall surge
    if (rainfallAmountMm > 0) {
      if (rainfallAmountMm > 25) {
        simulatedScore += 18;
        worseningFactors.push(`Torrential precipitation (+${rainfallAmountMm}mm): Massive hydraulic runoff & culvert choking multiplier (+18 pts)`);
      } else if (rainfallAmountMm > 10) {
        simulatedScore += 10;
        worseningFactors.push(`Moderate precipitation (+${rainfallAmountMm}mm): Leaching and stormwater accumulation (+10 pts)`);
      } else {
        simulatedScore += 4;
        worseningFactors.push(`Light rainfall (+${rainfallAmountMm}mm): Minor surface runoff (+4 pts)`);
      }
    }

    // 2. Drainage clearance (Preventive Mitigation)
    if (drainageCleared) {
      simulatedScore -= 22;
      mitigatingFactors.push('Drainage culvert proactively cleared & trash racks installed: Removes hydraulic bottleneck (-22 pts)');
    } else {
      simulatedScore += 6;
      worseningFactors.push('Uncleared culvert: Leaves existing debris blockage in path of flow (+6 pts)');
    }

    // 3. Waste accumulation level
    if (wasteAccumulationLevel > 3) {
      const extra = (wasteAccumulationLevel - 3) * 6;
      simulatedScore += extra;
      worseningFactors.push(`Heavy uncollected waste volume (Level ${wasteAccumulationLevel}/5): Increases biohazard & clogging (+${extra} pts)`);
    } else if (wasteAccumulationLevel === 1) {
      simulatedScore -= 8;
      mitigatingFactors.push('Low waste density / continuous municipal waste segregation (-8 pts)');
    }

    // 4. Wind synergy for air/radioactive
    if (category === 'air' || category === 'radioactive') {
      if (windSpeedKmh > 25) {
        simulatedScore += 12;
        worseningFactors.push(`High wind velocity (${windSpeedKmh} km/h): Expands downwind particulate/toxic dispersion (+12 pts)`);
      } else if (windSpeedKmh < 5) {
        simulatedScore += 10;
        worseningFactors.push(`Stagnant calm air (${windSpeedKmh} km/h): Prevents pollutant dispersion, trapping smog (+10 pts)`);
      }
    }

    // 5. Ambient temperature synergy for thermal/water
    if (category === 'thermal' || category === 'water') {
      if (temperatureC > 35) {
        simulatedScore += 12;
        worseningFactors.push(`Extreme ambient heat (${temperatureC}°C): Accelerates aquatic hypoxia and bacterial blooms (+12 pts)`);
      }
    }

    // 6. Inspection freshness
    if (daysSinceLastInspection > 14) {
      simulatedScore += 8;
      worseningFactors.push(`Lapsed inspection period (${daysSinceLastInspection} days): High unmonitored risk penalty (+8 pts)`);
    } else if (daysSinceLastInspection <= 2) {
      mitigatingFactors.push('Fresh physical inspection verified within 48 hours (-4 pts)');
      simulatedScore -= 4;
    }

    // Clamp score strictly between 0 and 100
    simulatedScore = Math.max(0, Math.min(100, Math.round(simulatedScore)));

    const simulatedLevel: RiskLevel = getRiskLevelFromScore(simulatedScore);

    return {
      baselineRiskScore: baseAssessment.score,
      baselineRiskLevel: baseAssessment.level,
      simulatedRiskScore: simulatedScore,
      simulatedRiskLevel: simulatedLevel,
      scoreDelta: simulatedScore - baseAssessment.score,
      activeModifiers,
      mitigatingFactors,
      worseningFactors,
      limitations:
        'DISCLAIMER: This scenario evaluates sensitivity based on deterministic rules and empirical environmental engineering heuristics. It is NOT an uncalibrated CFD/dispersion simulation and is designed for preventive prioritization and scenario exploration.',
    };
  }
}
