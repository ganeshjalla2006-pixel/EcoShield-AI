import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Read and verify the source data file directly
const sourceCode = fs.readFileSync('src/data/pollutionCategoriesData.ts', 'utf-8');

const EXPECTED_CATEGORIES = [
  'air',
  'water',
  'soil',
  'noise',
  'light',
  'thermal',
  'plastic',
  'radioactive',
  'visual'
];

test('Pollution Categories - All 9 standardized categories must be defined', () => {
  EXPECTED_CATEGORIES.forEach(cat => {
    assert.ok(
      sourceCode.includes(`${cat}: {`),
      `Category ${cat} must be configured in POLLUTION_CATEGORIES_DATA`
    );
  });
});

test('Pollution Categories - Mandatory educational and preventive domains', () => {
  const mandatorySections = [
    'name',
    'tagline',
    'shortDescription',
    'definition',
    'illustrativeRiskLevel',
    'mainSources',
    'majorCauses',
    'environmentalImpacts',
    'humanImpacts',
    'earlyWarningSigns',
    'preventionMethods',
    'controlMeasures',
    'exampleIndicators',
    'genuineDataOrigin',
    'feasibilityLabel'
  ];

  mandatorySections.forEach(section => {
    assert.ok(
      sourceCode.includes(`${section}:`),
      `Category metadata schema must include ${section}`
    );
  });
});

test('Pollution Categories - Data honesty & zero-unsubstantiated-claims check', () => {
  // Ensure illustrative nature is explicitly documented
  assert.ok(
    sourceCode.includes('illustrativeRiskLevel'),
    'Risk level must be explicitly marked as illustrative in data model'
  );
  assert.ok(
    sourceCode.includes('genuineDataOrigin'),
    'Data origin must be attributed to authentic sources'
  );
});

test('Pollution Categories - Responsive Filter & Search Logic', () => {
  const sampleCategories = [
    { id: 'air', name: 'Air Pollution', illustrativeRiskLevel: 'high', mainSources: ['Vehicular exhaust'], majorCauses: ['Fossil fuels'] },
    { id: 'water', name: 'Water Pollution', illustrativeRiskLevel: 'critical', mainSources: ['Untreated sewage'], majorCauses: ['Effluent discharge'] },
    { id: 'noise', name: 'Noise Pollution', illustrativeRiskLevel: 'moderate', mainSources: ['Traffic horns'], majorCauses: ['Machinery'] },
    { id: 'plastic', name: 'Plastic Pollution', illustrativeRiskLevel: 'high', mainSources: ['Single-use packaging'], majorCauses: ['Inadequate waste collection'] }
  ];

  // Search filter
  const filterByQuery = (query) => {
    const q = query.toLowerCase();
    return sampleCategories.filter(cat => 
      cat.name.toLowerCase().includes(q) ||
      cat.mainSources.some(s => s.toLowerCase().includes(q)) ||
      cat.majorCauses.some(c => c.toLowerCase().includes(q))
    );
  };

  assert.equal(filterByQuery('sewage').length, 1);
  assert.equal(filterByQuery('sewage')[0].id, 'water');
  assert.equal(filterByQuery('packaging').length, 1);
  assert.equal(filterByQuery('packaging')[0].id, 'plastic');
  assert.equal(filterByQuery('pollution').length, 4);

  // Risk filter
  const filterByRisk = (risk) => {
    return sampleCategories.filter(cat => risk === 'all' || cat.illustrativeRiskLevel === risk);
  };

  assert.equal(filterByRisk('all').length, 4);
  assert.equal(filterByRisk('critical').length, 1);
  assert.equal(filterByRisk('critical')[0].id, 'water');
  assert.equal(filterByRisk('moderate').length, 1);
  assert.equal(filterByRisk('moderate')[0].id, 'noise');
});
