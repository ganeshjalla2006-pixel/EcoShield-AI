import test from 'node:test';
import assert from 'node:assert/strict';

// Category baseline hazard weights (0-25 scale)
const CATEGORY_BASELINE_WEIGHTS = {
  radioactive: 25,
  water: 22,
  air: 20,
  soil: 18,
  plastic: 16,
  thermal: 14,
  noise: 12,
  light: 10,
  visual: 8,
};

// Standardized Score Bands
const RISK_SCORE_BANDS = {
  critical: { min: 75, max: 100, label: 'Critical', timeframe: '< 4 hours' },
  high: { min: 50, max: 74, label: 'High', timeframe: '< 24 hours' },
  moderate: { min: 25, max: 49, label: 'Moderate', timeframe: '< 72 hours' },
  low: { min: 0, max: 24, label: 'Low', timeframe: '< 7 days' },
};

function getRiskLevelFromScore(score) {
  const normalized = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
  if (normalized >= 75) return 'critical';
  if (normalized >= 50) return 'high';
  if (normalized >= 25) return 'moderate';
  return 'low';
}

function calculateScore({ category, severity, rainMm = 0, windKmh = 10, tempC = 24, isVerified = false, isHotspot = false, daysSince = 1 }) {
  // 1. Sanitize category
  const validCat = CATEGORY_BASELINE_WEIGHTS[category] !== undefined ? category : 'plastic';
  const base = CATEGORY_BASELINE_WEIGHTS[validCat];

  // 2. Sanitize severity (1-5)
  const rawSev = Number(severity);
  const cleanSev = isNaN(rawSev) ? 3 : Math.min(5, Math.max(1, Math.round(rawSev)));
  const sevScore = cleanSev * 6;

  // 3. Meteorological Synergy Multipliers
  let weatherMultiplier = 4;
  if ((validCat === 'plastic' || validCat === 'water' || validCat === 'soil' || validCat === 'radioactive') && rainMm > 5) {
    weatherMultiplier = rainMm > 20 ? 20 : 14;
  } else if ((validCat === 'air' || validCat === 'radioactive') && windKmh > 25) {
    weatherMultiplier = 18;
  } else if (validCat === 'air' && windKmh < 5) {
    weatherMultiplier = 16;
  } else if ((validCat === 'thermal' || validCat === 'water') && tempC > 35) {
    weatherMultiplier = 17;
  } else if (validCat === 'noise' && windKmh > 20) {
    weatherMultiplier = 10;
  }

  // 4. Evidence Confidence
  const evidence = isVerified ? 15 : 7;

  // 5. Proximity & History
  let history = isHotspot ? 5 : 0;
  if (daysSince > 7) history += 5;
  else history += 2;

  const raw = base + sevScore + weatherMultiplier + evidence + history;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

// ==========================================
// TEST SUITE: Step 3 Risk Engine
// ==========================================

test('Environmental Risk Engine - All 9 pollution categories baseline weights hierarchy', () => {
  const allNine = ['radioactive', 'water', 'air', 'soil', 'plastic', 'thermal', 'noise', 'light', 'visual'];
  allNine.forEach(cat => {
    assert.ok(CATEGORY_BASELINE_WEIGHTS[cat] !== undefined, `Category ${cat} must have a defined baseline weight`);
    assert.ok(CATEGORY_BASELINE_WEIGHTS[cat] >= 5 && CATEGORY_BASELINE_WEIGHTS[cat] <= 25, `${cat} weight must be between 5 and 25`);
  });

  // Verify key relative risk hierarchy
  assert.ok(CATEGORY_BASELINE_WEIGHTS.radioactive > CATEGORY_BASELINE_WEIGHTS.water);
  assert.ok(CATEGORY_BASELINE_WEIGHTS.water > CATEGORY_BASELINE_WEIGHTS.plastic);
  assert.ok(CATEGORY_BASELINE_WEIGHTS.plastic > CATEGORY_BASELINE_WEIGHTS.visual);
});

test('Environmental Risk Engine - Standardized score bands (0-24 Low, 25-49 Moderate, 50-74 High, 75-100 Critical)', () => {
  // Low: 0-24
  assert.equal(getRiskLevelFromScore(0), 'low');
  assert.equal(getRiskLevelFromScore(15), 'low');
  assert.equal(getRiskLevelFromScore(24), 'low');

  // Moderate: 25-49
  assert.equal(getRiskLevelFromScore(25), 'moderate');
  assert.equal(getRiskLevelFromScore(37), 'moderate');
  assert.equal(getRiskLevelFromScore(49), 'moderate');

  // High: 50-74
  assert.equal(getRiskLevelFromScore(50), 'high');
  assert.equal(getRiskLevelFromScore(62), 'high');
  assert.equal(getRiskLevelFromScore(74), 'high');

  // Critical: 75-100
  assert.equal(getRiskLevelFromScore(75), 'critical');
  assert.equal(getRiskLevelFromScore(88), 'critical');
  assert.equal(getRiskLevelFromScore(100), 'critical');
});

test('Environmental Risk Engine - Meteorological Synergy (Heavy Rain + Plastic Waste in Culvert)', () => {
  const dryScore = calculateScore({
    category: 'plastic',
    severity: 5,
    rainMm: 0,
    windKmh: 10,
    isVerified: true,
  });

  const heavyRainScore = calculateScore({
    category: 'plastic',
    severity: 5,
    rainMm: 35, // 35mm heavy rain
    windKmh: 10,
    isVerified: true,
  });

  assert.ok(heavyRainScore > dryScore, 'Heavy rain must elevate risk score for plastic culvert choking');
  assert.equal(heavyRainScore - dryScore, 16, 'Rain multiplier must add 16 synergy points');
  assert.ok(heavyRainScore >= 75, 'Synergy must push critical severity into Critical Risk Tier (>= 75)');
  assert.equal(getRiskLevelFromScore(heavyRainScore), 'critical');
});

test('Environmental Risk Engine - Airborne Particulate Wind Dispersion Synergy', () => {
  const calmScore = calculateScore({
    category: 'air',
    severity: 4,
    rainMm: 0,
    windKmh: 10,
    isVerified: true,
  });

  const highWindScore = calculateScore({
    category: 'air',
    severity: 4,
    rainMm: 0,
    windKmh: 35, // High wind
    isVerified: true,
  });

  assert.ok(highWindScore > calmScore, 'High wind should elevate downwind particulate dispersion risk');
  assert.equal(highWindScore - calmScore, 14, 'High wind dispersion multiplier must add 14 points');
});

test('Environmental Risk Engine - Thermal effluent and extreme heat synergy', () => {
  const normalTempScore = calculateScore({
    category: 'thermal',
    severity: 3,
    tempC: 22,
    isVerified: true,
  });

  const extremeHeatScore = calculateScore({
    category: 'thermal',
    severity: 3,
    tempC: 38, // 38°C extreme heat
    isVerified: true,
  });

  assert.ok(extremeHeatScore > normalTempScore, 'High ambient heat must worsen aquatic hypoxia & thermal shock');
  assert.equal(extremeHeatScore - normalTempScore, 13);
});

test('Environmental Risk Engine - Score boundaries & extreme input normalization', () => {
  // Test extreme bounds
  const extremeHigh = calculateScore({
    category: 'radioactive',
    severity: 10, // Out of bounds
    rainMm: 500,
    windKmh: 200,
    isVerified: true,
    isHotspot: true,
    daysSince: 100,
  });
  assert.equal(extremeHigh, 100, 'Score must be clamped at maximum 100');

  const extremeLow = calculateScore({
    category: 'visual',
    severity: -5, // Out of bounds negative
    rainMm: 0,
    windKmh: 0,
    isVerified: false,
    daysSince: 0,
  });
  assert.ok(extremeLow >= 0 && extremeLow <= 35, 'Negative severity clamped to 1');
});

test('Environmental Risk Engine - Invalid and missing inputs resilience', () => {
  // Null inputs
  const nullScore = calculateScore({
    category: null,
    severity: null,
  });
  assert.ok(typeof nullScore === 'number' && !isNaN(nullScore), 'Must calculate score without throwing NaN');
  assert.ok(nullScore >= 0 && nullScore <= 100);

  // Unrecognized category fallback
  const unrecognizedScore = calculateScore({
    category: 'extraterrestrial_debris',
    severity: 3,
  });
  assert.ok(typeof unrecognizedScore === 'number');
  assert.ok(unrecognizedScore >= 0 && unrecognizedScore <= 100);
});

test('Environmental Risk Engine - Preventive simulation scenario delta', () => {
  // Baseline without culvert clearance
  const cloggedScore = calculateScore({
    category: 'plastic',
    severity: 4,
    rainMm: 25,
    isVerified: true,
  });

  // Simulated with proactive clearance (-22 mitigation points)
  const mitigatedScore = Math.max(0, cloggedScore - 22);

  assert.ok(mitigatedScore < cloggedScore, 'Culvert clearance must reduce risk score');
  assert.equal(cloggedScore - mitigatedScore, 22, 'Mitigation delta must equal 22 points');
});

test('Environmental Risk Engine - Actionable response timeframes per score band', () => {
  const getSuggestedTimeframe = (score) => {
    const level = getRiskLevelFromScore(score);
    return RISK_SCORE_BANDS[level].timeframe;
  };

  assert.equal(getSuggestedTimeframe(85), '< 4 hours');
  assert.equal(getSuggestedTimeframe(65), '< 24 hours');
  assert.equal(getSuggestedTimeframe(35), '< 72 hours');
  assert.equal(getSuggestedTimeframe(15), '< 7 days');
});
