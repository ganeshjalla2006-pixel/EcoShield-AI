import { PollutionCategory, RiskLevel } from '../types';

export interface CategoryDetailInfo {
  id: PollutionCategory;
  name: string;
  tagline: string;
  shortDescription: string;
  definition: string;
  illustrativeRiskLevel: RiskLevel;
  mainSources: string[];
  majorCauses: string[];
  environmentalImpacts: string[];
  humanImpacts: string[];
  earlyWarningSigns: string[];
  preventionMethods: string[];
  controlMeasures: string[];
  exampleIndicators: { name: string; unit: string; benchmark: string; description: string }[];
  genuineDataOrigin: string;
  feasibilityLabel: 'Live Telemetry Available' | 'Verified Field Inspection Needed' | 'Specialized Lab Assay Required';
}

export const POLLUTION_CATEGORIES_DATA: Record<PollutionCategory, CategoryDetailInfo> = {
  air: {
    id: 'air',
    name: 'Air Pollution',
    tagline: 'Inhalable particulates, gaseous toxins, and atmospheric smog',
    shortDescription: 'Release of harmful solid particulates, liquid droplets, and toxic gases into the atmosphere.',
    definition: 'Air pollution occurs when chemical gases, fine particulate matter, or biological molecules contaminate the outdoor or indoor atmosphere, disrupting natural atmospheric chemistry and endangering living organisms.',
    illustrativeRiskLevel: 'high',
    mainSources: ['Vehicular exhaust emissions', 'Unfiltered diesel generator sets', 'Construction dust & aggregate piles', 'Agricultural stubble burning', 'Industrial smokestack emissions'],
    majorCauses: [
      'Combustion of fossil fuels in transport and thermal power utilities',
      'Uncontrolled demolition and construction aggregate resuspension',
      'Industrial release of sulfur dioxide (SO₂), nitrogen oxides (NOx), and carbon monoxide (CO)',
      'Seasonal agricultural open-biomass incineration'
    ],
    environmentalImpacts: [
      'Acid deposition damaging forest canopies and freshwater pH',
      'Formation of ground-level ozone damaging crop foliage and yields',
      'Atmospheric haze reducing natural photosynthetic solar radiation'
    ],
    humanImpacts: [
      'Exacerbation of asthma, chronic bronchitis, and cardiopulmonary disorders',
      'Deep alveolar penetration of fine particulates (PM2.5) into the bloodstream',
      'Elevated long-term risks of cardiovascular events and lung cancer'
    ],
    earlyWarningSigns: [
      'Reduced horizontal visibility and persistent brownish-grey horizon haze',
      'Noticeable combustion or acrid chemical odors in residential clusters',
      'Dust layer accumulation on building facades, leaves, and outdoor surfaces within hours',
      'Sudden increase in citizen eye irritation and dry cough complaints'
    ],
    preventionMethods: [
      'Establish low-emission buffer zones around high-density schools and hospitals',
      'Mandate dust-suppression tarpaulins and boundary fencing on all construction sites',
      'Promote clean public transit and transition to electric bus municipal fleets',
      'Enforce anti-idling bylaws for freight vehicles along residential freight corridors'
    ],
    controlMeasures: [
      'Deploy localized anti-smog water misting cannons along active construction corridors',
      'Mandate certified particulate diesel soot filters (DPFs) on stationary commercial gensets',
      'Implement temporary alternate traffic restrictions during atmospheric inversion episodes'
    ],
    exampleIndicators: [
      { name: 'PM2.5', unit: 'µg/m³', benchmark: '< 15 (24h avg)', description: 'Fine particulate matter small enough to enter human lung alveoli' },
      { name: 'PM10', unit: 'µg/m³', benchmark: '< 45 (24h avg)', description: 'Coarse inhalable dust particles from roads and earthworks' },
      { name: 'NO₂', unit: 'ppb', benchmark: '< 25 (1h avg)', description: 'Nitrogen dioxide from high-temperature vehicular combustion' },
      { name: 'AQI', unit: 'Index', benchmark: '0 - 50 (Good)', description: 'Composite atmospheric air quality health index' }
    ],
    genuineDataOrigin: 'Central Pollution Control Board (CPCB), OpenAQ, Copernicus Atmospheric Monitoring',
    feasibilityLabel: 'Live Telemetry Available'
  },
  water: {
    id: 'water',
    name: 'Water Pollution',
    tagline: 'Effluent discharge, chemical runoff, and freshwater degradation',
    shortDescription: 'Contamination of surface water bodies, streams, and aquifers by chemical or biological waste.',
    definition: 'Water pollution is the chemical, physical, or biological contamination of streams, lakes, coastal basins, or subterranean aquifers, rendering water unsafe for consumption, irrigation, or aquatic ecosystems.',
    illustrativeRiskLevel: 'high',
    mainSources: ['Untreated industrial wastewater outfalls', 'Municipal sewage pipe overflows', 'Agricultural fertilizer & pesticide runoff', 'Illegal tanker dumping into storm channels'],
    majorCauses: [
      'Direct discharge of untreated chemical or metallurgical process effluent',
      'Inadequate municipal wastewater sewage treatment plant (STP) capacity',
      'Surface wash-off of synthetic nitrogen and phosphorus agrochemicals into drainage ditches',
      'Leachate percolation from unlined solid waste landfills into the water table'
    ],
    environmentalImpacts: [
      'Acute depletion of dissolved oxygen (anoxia) causing massive fish mortality',
      'Eutrophication leading to dense, toxic cyanobacterial algal blooms',
      'Severe bioaccumulation of persistent toxins across the aquatic food chain'
    ],
    humanImpacts: [
      'Outbreaks of waterborne microbial infections (cholera, typhoid, dysentery)',
      'Heavy metal poisoning (lead, mercury, cadmium) affecting kidney and nervous systems',
      'Irreversible contamination of community drinking well aquifers'
    ],
    earlyWarningSigns: [
      'Unusual discoloration, oily surface sheen, or persistent foam on open canals',
      'Pungent sulfur, ammonia, or solvent smells near culverts or banks',
      'Lethargic fish surfacing for air or localized die-offs near outfalls',
      'Sudden localized proliferation of bright green or reddish algal mats'
    ],
    preventionMethods: [
      'Mandate zero-liquid-discharge (ZLD) closed-loop recycling in heavy manufacturing',
      'Establish vegetative riparian buffer strips along canal and river boundaries to absorb runoff',
      'Construct decentralized retention wetlands and sedimentation swales for stormwater treatment',
      'Conduct regular municipal pipeline pressure testing to identify cross-contamination'
    ],
    controlMeasures: [
      'Deploy floating containment absorbent booms to isolate surface chemical and petroleum slicks',
      'Immediately seal unpermitted industrial outfall sluices with emergency concrete gates',
      'Activate mobile aeration pumps at stagnant canal bottlenecks to prevent anoxic collapse'
    ],
    exampleIndicators: [
      { name: 'Dissolved Oxygen (DO)', unit: 'mg/L', benchmark: '> 5.0 (Healthy)', description: 'Free oxygen available for fish respiration and aquatic life' },
      { name: 'BOD (5-Day)', unit: 'mg/L', benchmark: '< 3.0 (Treated)', description: 'Biochemical oxygen demand exerted by decomposing organic matter' },
      { name: 'pH Level', unit: 'Scale', benchmark: '6.5 - 8.5', description: 'Acidity or alkalinity measure of the water body' },
      { name: 'Turbidity', unit: 'NTU', benchmark: '< 5.0', description: 'Suspended sediment clarity measurement' }
    ],
    genuineDataOrigin: 'National Water Quality Monitoring Program, Basin Authorities, Certified Grab Assay Labs',
    feasibilityLabel: 'Specialized Lab Assay Required'
  },
  soil: {
    id: 'soil',
    name: 'Soil Pollution',
    tagline: 'Heavy metal deposition, industrial slag, and chemical leaching',
    shortDescription: 'Deposition of toxic chemicals, solvents, and heavy metals degrading fertile topsoil.',
    definition: 'Soil pollution refers to the presence of synthetic xenobiotic chemicals, radioactive nuclides, or heavy metal residues at concentrations higher than natural background levels, causing adverse impacts on plant growth and terrestrial food webs.',
    illustrativeRiskLevel: 'high',
    mainSources: ['Clandestine chemical barrel dumping', 'Foundry slag heaps and smelting residues', 'Excessive persistent agrochemical applications', 'Automotive repair fluid disposal'],
    majorCauses: [
      'Unregulated dumping of hazardous industrial solid sludge in vacant fallow lots',
      'Decades of excessive organochlorine pesticide and synthetic fertilizer application',
      'Corroded underground petroleum storage tanks and pipeline seepage',
      'Industrial wastewater irrigation depositing cadmium, lead, and chromium in topsoil'
    ],
    environmentalImpacts: [
      'Destruction of beneficial soil microbiological biodiversity and mycorrhizal networks',
      'Loss of arable soil fertility and structure leading to irreversible land degradation',
      'Continuous leaching of contaminants into shallow agricultural groundwater wells'
    ],
    humanImpacts: [
      'Bioaccumulation of carcinogenic heavy metals into staple grain and vegetable crops',
      'Direct dermal absorption or inhalation of contaminated windblown dust by children and workers',
      'Chronic renal, skeletal, and neurological damage from long-term crop ingestion'
    ],
    earlyWarningSigns: [
      'Unexplained vegetation dieback, stunted plant growth, or barren scorched patches',
      'Visible white, yellow, or dark chemical crystalline crusts on dry topsoil',
      'Oily discoloration or strong solvent odors when digging shallow postholes',
      'Absence of earthworms and standard macro-invertebrates in moist soil samples'
    ],
    preventionMethods: [
      'Strict municipal tracking and manifest requirements for hazardous industrial sludge',
      'Encourage integrated pest management (IPM) and organic regenerative agriculture',
      'Mandate secondary containment bunds around all above-ground chemical storage tanks',
      'Conduct mandatory baseline brownfield environmental assessments before site transfers'
    ],
    controlMeasures: [
      'Install impermeable high-density polyethylene (HDPE) geotextile caps over exposed slag',
      'Construct perimeter cutoff trenches to isolate runoff from contaminated lots',
      'Initiate phytoremediation using hyper-accumulating botanical species (e.g. sunflowers, mustard)'
    ],
    exampleIndicators: [
      { name: 'Lead (Pb)', unit: 'mg/kg', benchmark: '< 100 (Safe)', description: 'Toxic heavy metal from legacy fuel additives, paint, and smelters' },
      { name: 'Cadmium (Cd)', unit: 'mg/kg', benchmark: '< 3.0 (Target)', description: 'Bioaccumulative toxic metal associated with industrial sludge' },
      { name: 'Soil pH', unit: 'Scale', benchmark: '6.0 - 7.5', description: 'Impacts heavy metal bioavailability and nutrient mobility' },
      { name: 'Total Hydrocarbons', unit: 'mg/kg', benchmark: '< 50', description: 'Petroleum fuel and lubricating oil residue content' }
    ],
    genuineDataOrigin: 'Agricultural Soil Testing Institutes, Brownfield Remediation Audits, Geological Surveys',
    feasibilityLabel: 'Specialized Lab Assay Required'
  },
  noise: {
    id: 'noise',
    name: 'Noise Pollution',
    tagline: 'Acoustic intrusion, heavy machinery impact, and urban decibels',
    shortDescription: 'Unwanted or harmful outdoor sounds exceeding permissible acoustic thresholds.',
    definition: 'Noise pollution is the propagation of unwanted or excessive sound that interferes with natural communication, damages auditory health, elevates stress hormones, and degrades residential livability.',
    illustrativeRiskLevel: 'moderate',
    mainSources: ['Unshielded night construction piling', 'Pneumatic concrete breakers and demolition drills', 'Heavy transit arterial freight traffic', 'Unpermitted commercial loudspeakers and events'],
    majorCauses: [
      'Operation of heavy pneumatic and hydraulic construction tools during night quiet hours',
      'Dense urban transit corridors without acoustic barriers adjacent to residential quarters',
      'Unbaffled industrial cooling fans, exhaust blowers, and air handling units on rooftops',
      'Aircraft approach corridors over high-density suburban communities'
    ],
    environmentalImpacts: [
      'Interference with bird vocalizations, mate selection, and territorial acoustic warnings',
      'Avoidance of traditional nesting habitats near arterial transit infrastructure',
      'Disruption of nocturnal predator-prey hunting acoustic dynamics'
    ],
    humanImpacts: [
      'Noise-induced temporary or permanent hearing threshold shift and chronic tinnitus',
      'Severe nocturnal sleep architecture disruption triggering hypertension and cardiac strain',
      'Cognitive impairment and diminished reading comprehension in school children near airports'
    ],
    earlyWarningSigns: [
      'Persistent rattling of window panes from low-frequency structural vibration',
      'Necessity to shout at arm’s length during standard outdoor conversation (> 75 dBA)',
      'Clustering of citizen disturbance complaints during designated residential quiet hours (22:00-06:00)',
      'Noticeable acoustic feedback or echoing from newly stripped building facades'
    ],
    preventionMethods: [
      'Incorporate mandatory acoustic buffer zones and setbacks in municipal urban master plans',
      'Enforce quiet equipment certification for municipal contractors and fleet tenders',
      'Construct vegetated earthen berms and dense evergreen tree belts along highway edges',
      'Mandate automated noise logging telemetry at high-density commercial construction sites'
    ],
    controlMeasures: [
      'Install temporary 25mm sound-absorbing acoustic blankets around pneumatic tooling',
      'Enforce strict operational curfews banning high-decibel pile driving after 22:00',
      'Issue automated noise abatement notices to commercial venues exceeding zonal decibel limits'
    ],
    exampleIndicators: [
      { name: 'Leq (Daytime)', unit: 'dBA', benchmark: '< 55 (Residential)', description: 'Equivalent continuous sound level measured over daylight hours' },
      { name: 'Leq (Nighttime)', unit: 'dBA', benchmark: '< 45 (Residential)', description: 'Equivalent continuous sound level measured during quiet night hours' },
      { name: 'Lpeak', unit: 'dBC', benchmark: '< 115', description: 'Peak instantaneous acoustic pressure from explosive or impact tools' },
      { name: 'Ldn', unit: 'dBA', benchmark: '< 60', description: 'Day-night average sound level penalizing nocturnal disturbances' }
    ],
    genuineDataOrigin: 'National Ambient Noise Monitoring Stations (NANMS), Municipal Sound Level Spot Checks',
    feasibilityLabel: 'Live Telemetry Available'
  },
  light: {
    id: 'light',
    name: 'Light Pollution',
    tagline: 'Nocturnal glare, unshielded outdoor luminaires, and skyglow',
    shortDescription: 'Excessive or misdirected artificial outdoor light degrading the nocturnal environment.',
    definition: 'Light pollution is the inappropriate, excessive, or misdirected use of artificial outdoor lighting, causing skyglow, nocturnal glare, light trespass into bedrooms, and severe circadian biological disruption.',
    illustrativeRiskLevel: 'low',
    mainSources: ['Unshielded municipal streetlights', 'Commercial architectural facade floodlights', 'High-intensity sports stadium lighting', 'Digital advertising billboards with excessive night lumens'],
    majorCauses: [
      'Fixtures emitting light directly upward or horizontally rather than downward at surfaces',
      'Use of high-kelvin cold blue-rich LED luminaires (> 4000K) that scatter easily in the atmosphere',
      'All-night illumination of vacant commercial structures and illuminated perimeter billboards',
      'Lack of automated astronomical timers or motion sensors on exterior facility fixtures'
    ],
    environmentalImpacts: [
      'Severe disorientation of migratory songbirds colliding with illuminated high-rises',
      'Disruption of nocturnal insect pollination networks and mass mortality near luminaires',
      'Altered amphibian mating behavior and foraging cycles in urban park wetland pockets'
    ],
    humanImpacts: [
      'Suppression of nocturnal melatonin synthesis impairing natural sleep cycles',
      'Increased incidence of circadian-related metabolic and sleep disorders',
      'Disabling glare reducing nighttime pedestrian and vehicular visual acuity'
    ],
    earlyWarningSigns: [
      'Inability to observe the Milky Way or primary constellations from suburban vantage points',
      'Noticeable glare illuminating bedroom interiors through standard window blinds',
      'Constant visible diffuse glow dome extending over metropolitan horizons for 30+ km',
      'Nocturnal bird song occurring during midnight hours under unshielded streetlights'
    ],
    preventionMethods: [
      'Mandate 100% full-cutoff downward-directed fixtures for all public and parking lighting',
      'Cap outdoor correlated color temperature (CCT) to warm spectrums (2200K - 2700K)',
      'Incorporate dark-sky lighting ordinances for municipal infrastructure and developments',
      'Promote voluntary commercial "lights-out" policies during peak avian migration weeks'
    ],
    controlMeasures: [
      'Retrofit existing glare-producing fixtures with downward mechanical cutoff visors',
      'Implement automated dimming schedules reducing public fixture brightness by 50% after midnight',
      'Mandate curfew power-downs on dynamic digital billboards between 22:00 and 06:00'
    ],
    exampleIndicators: [
      { name: 'Sky Quality Meter', unit: 'mag/arcsec²', benchmark: '> 20.0 (Dark)', description: 'Night sky brightness; higher numbers indicate darker, cleaner night skies' },
      { name: 'Bortle Scale', unit: 'Class 1-9', benchmark: 'Class 1-3 (Clean)', description: 'Observational scale ranging from pristine dark skies (1) to inner-city skyglow (9)' },
      { name: 'Upward Light Ratio', unit: '%', benchmark: '0% (Full Cutoff)', description: 'Percentage of fixture lumens emitted above the horizontal plane' },
      { name: 'Color Temp (CCT)', unit: 'Kelvin', benchmark: '< 3000K (Warm)', description: 'Warm spectrum LEDs produce significantly less atmospheric blue light scattering' }
    ],
    genuineDataOrigin: 'VIIRS Day/Night Band Satellite Sensors, Globe at Night Citizen Science Network',
    feasibilityLabel: 'Verified Field Inspection Needed'
  },
  thermal: {
    id: 'thermal',
    name: 'Thermal Pollution',
    tagline: 'Cooling water outfalls, aquatic heat shock, and urban microclimates',
    shortDescription: 'Abrupt degradation of ambient temperature in watercourses or dense urban microclimates.',
    definition: 'Thermal pollution is the sudden alteration of ambient water or atmospheric temperature, typically when industrial facilities use natural water bodies as cooling sinks and return heated effluent, dramatically diminishing dissolved oxygen capacity.',
    illustrativeRiskLevel: 'moderate',
    mainSources: ['Thermal power station cooling discharge', 'Industrial manufacturing process cooling outfalls', 'Urban heat island stormwater wash-off', 'Extensive loss of riverside vegetative shade canopy'],
    majorCauses: [
      'Once-through cooling systems drawing stream water and discharging it 5°C to 15°C hotter',
      'Unshaded black asphalt parking lots heating torrential summer stormwater before canal entry',
      'Clear-cutting of riparian vegetative buffers that naturally shade and cool shallow streams',
      'Dense concrete urban canyons trapping radiative heat without evaporative cooling'
    ],
    environmentalImpacts: [
      'Severe decrease in dissolved oxygen solubility causing respiratory collapse in aquatic fauna',
      'Acute thermal shock directly lethal to vulnerable fish eggs and benthic larvae',
      'Rapid acceleration of anaerobic bacterial decomposition and foul-smelling gas emissions'
    ],
    humanImpacts: [
      'Exacerbation of urban heat island stress elevating heatstroke vulnerability in cities',
      'Proliferation of warm-water pathogen vectors (e.g. bacterial amoebae and mosquitoes)',
      'Degradation of downstream municipal potable water intake quality'
    ],
    earlyWarningSigns: [
      'Visible heat shimmer or steam rising from canal outfall confluences on cool mornings',
      'Water temperature near discharges measuring more than 3°C above baseline upstream temperature',
      'Absence of cold-water fish species in reaches where they historically spawned',
      'Sudden accelerated growth of thermal-tolerant filamentous algae near industrial outfalls'
    ],
    preventionMethods: [
      'Require closed-loop evaporative cooling towers or dry air-cooling radiators in new plants',
      'Mandate extensive tree canopy preservation and riparian greenbelts along all urban water edges',
      'Implement reflective "cool roof" and permeable paving standards in municipal building codes',
      'Construct shaded retention ponds that allow warm stormwater to cool before stream discharge'
    ],
    controlMeasures: [
      'Throttle facility industrial discharge rates when ambient river temperatures exceed ecological limits',
      'Deploy mechanical artificial destratification and surface aerators to replenish dissolved oxygen',
      'Reroute warm process effluent into dedicated cooling retention basins prior to release'
    ],
    exampleIndicators: [
      { name: 'Thermal Delta (ΔT)', unit: '°C', benchmark: '< 2.8°C Rise', description: 'Temperature difference between upstream baseline and discharge zone' },
      { name: 'Surface Temp', unit: '°C', benchmark: 'Varies by Season', description: 'Absolute water temperature across the receiving channel' },
      { name: 'Oxygen Saturation', unit: '%', benchmark: '> 80%', description: 'Dissolved oxygen saturation percentage which drops rapidly as water heats' },
      { name: 'Heat Island Anomaly', unit: '°C', benchmark: '< 2.0°C Diff', description: 'Temperature excess in urbanized sectors compared to rural surroundings' }
    ],
    genuineDataOrigin: 'Landsat Thermal Infrared Satellite (TIRS), Continuous Outfall Thermal Loggers',
    feasibilityLabel: 'Live Telemetry Available'
  },
  plastic: {
    id: 'plastic',
    name: 'Plastic Pollution',
    tagline: 'Non-biodegradable debris, culvert choking, and macro-waste accumulation',
    shortDescription: 'Accumulation of synthetic polymers and non-biodegradable waste in waterways and soil.',
    definition: 'Plastic pollution involves the uncontained accumulation of synthetic polymeric debris (single-use packaging, polystyrene, synthetic fibers) that resists biological degradation, choking hydraulic infrastructure and fragmenting into hazardous microplastics.',
    illustrativeRiskLevel: 'critical',
    mainSources: ['Single-use beverage bottles and food containers', 'Uncollected commercial packaging films', 'Degraded agricultural mulch sheeting', 'Municipal open drain trash dump sites'],
    majorCauses: [
      'Inadequate municipal solid waste collection frequency in peri-urban communities',
      'Widespread usage of non-recyclable multi-layer flexible packaging',
      'Absence of trash capture grates or sediment screens on storm drain siphons',
      'Illegal fly-tipping into canal banks and storm channels to evade tipping fees'
    ],
    environmentalImpacts: [
      'Complete structural clogging of stormwater culverts triggering severe urban flash floods',
      'Entanglement, ingestion, and intestinal blockage in domestic livestock, birds, and aquatic fauna',
      'Gradual fragmentation into microscopic polymer particles (< 5mm) that adsorb organic toxins'
    ],
    humanImpacts: [
      'Localized neighborhood flood devastation from backed-up stormwater drainage',
      'Stagnant water ponding behind plastic blockages breeding dengue and malaria mosquito vectors',
      'Ingestion of microplastics and endocrine-disrupting phthalates via drinking water and fish'
    ],
    earlyWarningSigns: [
      'Floating debris dams forming at culvert inlets and bridge piers during light rain',
      'Water levels backing up behind siphon grates even under modest rainfall (< 10mm)',
      'Piles of discarded packaging encroaching within 5 meters of open drainage channels',
      'Citizen reports of foul stagnant pools forming where water should be freely flowing'
    ],
    preventionMethods: [
      'Implement community collection drop-off kiosks incentivized with EcoPoints',
      'Enforce bans on unrecyclable single-use plastic carrier bags and expanded polystyrene',
      'Require extended producer responsibility (EPR) take-back mandates for consumer packaging',
      'Install heavy-duty galvanized trash racks at all canal entrances before storm seasons'
    ],
    controlMeasures: [
      'Dispatch rapid backhoe clearance teams to extract identified plastic bottlenecks before rain events',
      'Install floating trash boom barriers across canal choke points to catch debris before siphons',
      'Deploy mobile shredders and compaction balers for immediate on-site volume reduction'
    ],
    exampleIndicators: [
      { name: 'Culvert Occlusion', unit: '% Area', benchmark: '0% (Clear)', description: 'Percentage of drainage cross-sectional area blocked by compacted debris' },
      { name: 'Debris Volume', unit: 'kg / 50m', benchmark: '< 10 kg', description: 'Mass of uncollected solid plastic waste along 50 meters of channel' },
      { name: 'Trash Trap Load', unit: '% Capacity', benchmark: '< 40%', description: 'Capacity utilization of installed municipal canal trash catchment screens' },
      { name: 'Microplastic Count', unit: 'particles/m³', benchmark: '< 50', description: 'Concentration of fragmented polymer particles in water samples' }
    ],
    genuineDataOrigin: 'Municipal Waste Audits, Stormwater Culvert Inspections, Geotagged Community Surveys',
    feasibilityLabel: 'Verified Field Inspection Needed'
  },
  radioactive: {
    id: 'radioactive',
    name: 'Radioactive Pollution',
    tagline: 'Ionizing radiation, orphan industrial sources, and isotope containment',
    shortDescription: 'Release or loss of unshielded radioactive materials and ionizing radiation.',
    definition: 'Radioactive pollution is the uncontrolled presence or release of radioactive substances into the air, water, or soil, where atomic decay emits ionizing radiation (alpha, beta, gamma) capable of damaging biological cellular DNA.',
    illustrativeRiskLevel: 'critical',
    mainSources: ['Lost industrial radiography cameras (Orphan sources)', 'Improperly decommissioned medical radiotherapy isotopes', 'Unshielded density/moisture gauges from road works', 'Unventilated basement radon gas accumulation'],
    majorCauses: [
      'Theft or abandonment of sealed industrial radiography sources during scrap metal recycling',
      'Mishandling of hospital nuclear medicine waste and radiopharmaceutical containers',
      'Breach of containment vessels during scrap metal smelting of radioactive industrial gauges',
      'Natural geological seepage of radon-222 from uranium-bearing bedrock into subterranean structures'
    ],
    environmentalImpacts: [
      'Persistent biological contamination of localized soil and vegetation exclusion zones',
      'Genetic mutations and reproductive failure in local wildlife populations',
      'Long-term accumulation of isotopes (e.g. Cesium-137, Cobalt-60) in organic matter'
    ],
    humanImpacts: [
      'Acute radiation sickness (ARS) from unshielded proximity to high-activity gamma sources',
      'Severe radiation burns and localized tissue necrosis from direct contact',
      'Dramatically elevated lifetime risk of leukemia and other oncological mutations'
    ],
    earlyWarningSigns: [
      'Unidentified heavy lead-lined or depleted uranium transport shields found in scrap yards',
      'Presence of standard international radioactive trefoil warning symbols on discarded items',
      'Audible clicking or threshold alarm triggered on calibrated handheld Geiger-Müller counters',
      'Unexplained acute radiation erythema (skin reddening) among scrap metal handlers'
    ],
    preventionMethods: [
      'Maintain strict cradle-to-grave national registry tracking for all radioactive sources',
      'Install portal radiation monitors at all municipal scrap metal processing entrances',
      'Mandate certified radiation safety officers (RSOs) at all industrial non-destructive testing firms',
      'Require sub-slab radon barrier membranes and passive soil ventilation in new foundations'
    ],
    controlMeasures: [
      'Immediately establish an emergency 100-meter exclusion cordon upon source discovery',
      'Notify regional atomic energy regulatory boards and specialized disaster response teams',
      'Deploy remote mechanical long-handled manipulators and lead transport pigs for recovery'
    ],
    exampleIndicators: [
      { name: 'Ambient Gamma Dose', unit: 'µSv/h', benchmark: '< 0.20 (Natural)', description: 'Hourly ambient gamma dose rate compared to natural local background' },
      { name: 'Surface Contamination', unit: 'Bq/cm²', benchmark: '< 0.40', description: 'Removable beta/gamma radioactive contamination on physical surfaces' },
      { name: 'Radon Concentration', unit: 'Bq/m³', benchmark: '< 100 (Action Lvl)', description: 'Indoor radon-222 gas concentration in subterranean spaces' },
      { name: 'Accumulated Dose', unit: 'mSv/year', benchmark: '< 1.0 (Public Limit)', description: 'Maximum permissible annual ionizing radiation dose for general public' }
    ],
    genuineDataOrigin: 'Atomic Energy Regulatory Board (AERB), Environmental Radiation Monitoring Networks',
    feasibilityLabel: 'Specialized Lab Assay Required'
  },
  visual: {
    id: 'visual',
    name: 'Visual Pollution',
    tagline: 'Illegal fly-tipping, chaotic blight, and derelict dump accumulation',
    shortDescription: 'Severe aesthetic degradation and chaotic open dumping in public spaces.',
    definition: 'Visual pollution refers to the pervasive presence of unsightly, intrusive, and chaotic human-made visual blight—such as illegal roadside fly-tipping, derelict vehicle accumulation, and chaotic commercial signage—that diminishes psychological well-being and acts as a gateway to toxic waste dumping.',
    illustrativeRiskLevel: 'low',
    mainSources: ['Illegal construction debris fly-tipping', 'Abandoned derelict motor vehicles', 'Chaotic unpermitted outdoor advertising displays', 'Tangled overhead telecommunication cabling'],
    majorCauses: [
      'Absence of affordable, accessible municipal construction debris disposal facilities',
      'Lax municipal enforcement against clandestine nighttime roadside dumping',
      'Proliferation of unpermitted commercial billboards on pedestrian pathways',
      'Neglected vacant municipal or private plots without boundary fences or deterrents'
    ],
    environmentalImpacts: [
      'Acts as an escalation catalyst—minor roadside litter quickly attracts hazardous chemical dumping',
      'Obstruction of pedestrian accessibility leading to erosion of roadside drainage margins',
      'Accumulation of water in dumped tires and scrap creating ideal mosquito breeding habitats'
    ],
    humanImpacts: [
      'Documented increase in cognitive fatigue, stress, and diminished civic community pride',
      'Impaired driver visibility and visual distraction at busy arterial intersections',
      'Depreciation of surrounding neighborhood property values and safety perception'
    ],
    earlyWarningSigns: [
      'First pile of construction rubble or tile debris appearing on a vacant lot shoulder',
      'Repeated instances of commercial posters pasted over municipal regulatory notices',
      'Abandoned vehicles missing license plates left on public road shoulders for > 14 days',
      'Accumulation of windblown debris trapped along chain-link perimeter fences'
    ],
    preventionMethods: [
      'Establish free municipal designated construction & demolition (C&D) recycling drop-offs',
      'Erect sturdy perimeter fencing and deterrent landscaping around vulnerable vacant parcels',
      'Deploy solar-powered CCTV cameras at chronic illegal fly-tipping crossroads',
      'Enforce municipal sign codes regulating maximum billboard dimensions and illumination'
    ],
    controlMeasures: [
      'Deploy scheduled mobile municipal clean-up trucks to clear fly-tipping within 48 hours',
      'Transform chronically blighted vacant corners into landscaped community micro-parks',
      'Issue municipal violation fines linked to property tax records for repeat fly-tippers'
    ],
    exampleIndicators: [
      { name: 'Blight Area', unit: 'sq. meters', benchmark: '< 10 m²', description: 'Total surface area affected by uncontained solid debris or fly-tipping' },
      { name: 'Accumulation Age', unit: 'Days', benchmark: '< 2 Days', description: 'Elapsed time since first observation before municipal intervention' },
      { name: 'Visual Intrusion Index', unit: 'Scale 1-10', benchmark: '< 3.0', description: 'Standardized assessment of aesthetic distraction and architectural disruption' },
      { name: 'Gateway Hazard Score', unit: 'Scale 1-5', benchmark: 'Level 1', description: 'Likelihood of a blighted lot escalating into a hazardous chemical dumping ground' }
    ],
    genuineDataOrigin: 'Municipal Code Enforcement Inspection Logs, Verified Citizen Geotagged Photography',
    feasibilityLabel: 'Verified Field Inspection Needed'
  }
};
