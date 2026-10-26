import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  UserProfile,
  InAppNotification,
  TaskAuditEntry,
  PollutionCategory,
  RiskLevel,
  UserRole,
} from '../types';

const STORAGE_KEYS = {
  REPORTS: 'ecoshield_reports_v1',
  TASKS: 'ecoshield_tasks_v1',
  HOTSPOTS: 'ecoshield_hotspots_v1',
  USERS: 'ecoshield_users_v1',
  NOTIFICATIONS: 'ecoshield_notifications_v1',
  CURRENT_USER: 'ecoshield_current_user_v1',
  AUDIT_LOGS: 'ecoshield_audit_logs_v1',
};

// Realistic baseline seed data
const SEED_USERS: UserProfile[] = [
  {
    id: 'user_citizen_01',
    email: 'ananya.sharma@community.eco',
    displayName: 'Ananya Sharma',
    role: 'citizen',
    ecoPoints: 180,
    badges: ['Community Watchdog', 'Eagle Eye Scout'],
    reportsSubmitted: 5,
    tasksCompleted: 2,
  },
  {
    id: 'user_worker_01',
    email: 'field.rajesh@ecoshield.org',
    displayName: 'Rajesh Kumar',
    role: 'field_worker',
    department: 'Urban Drainage & Hazardous Waste Rapid Response',
    ecoPoints: 320,
    badges: ['Rapid Responder', 'Water Guardian', 'Clean River Hero'],
    reportsSubmitted: 11,
    tasksCompleted: 23,
  },
  {
    id: 'user_admin_01',
    email: 'director@ecoshield.org',
    displayName: 'Dr. Sarah Mukherjee',
    role: 'admin',
    department: 'Municipal Environmental Protection Board',
    ecoPoints: 450,
    badges: ['System Architect', 'Environmental Director', 'Rapid Responder'],
    reportsSubmitted: 6,
    tasksCompleted: 14,
  },
];

const SEED_HOTSPOTS: EnvironmentalHotspot[] = [
  {
    id: 'hotspot_01',
    name: 'Sector 4 Canal Inflow Choke Point',
    category: 'plastic',
    coordinates: { lat: 28.6139, lng: 77.2090, addressName: 'Connaught Outer Canal, New Delhi' },
    currentRiskScore: 84,
    currentRiskLevel: 'critical',
    activeReportsCount: 3,
    description: 'High accumulation of single-use plastics and packaging blocking culvert grates. High vulnerability to monsoon stormwater backup.',
    lastInspectedAt: '2026-10-22T09:30:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Install mechanical trash boom', 'Clear 40m culvert inlet before forecasted rain'],
  },
  {
    id: 'hotspot_02',
    name: 'Industrial Area Phase 2 Outfall Basin',
    category: 'water',
    coordinates: { lat: 28.5355, lng: 77.2600, addressName: 'Okhla Industrial Phase II Outfall, New Delhi' },
    currentRiskScore: 78,
    currentRiskLevel: 'high',
    activeReportsCount: 2,
    description: 'Intermittent chemical effluent release causing visible discoloration and acute biochemical oxygen demand (BOD) spikes.',
    lastInspectedAt: '2026-10-23T14:15:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Deploy automated water sampler', 'Cross-examine factory discharge logs'],
  },
  {
    id: 'hotspot_03',
    name: 'Ring Road Construction Corridor',
    category: 'air',
    coordinates: { lat: 28.5700, lng: 77.1950, addressName: 'South Ext Ring Road Flyover, New Delhi' },
    currentRiskScore: 66,
    currentRiskLevel: 'high',
    activeReportsCount: 1,
    description: 'Uncovered aggregate stockpiles creating localized PM10 and PM2.5 resuspension under vehicular turbulence.',
    lastInspectedAt: '2026-10-20T11:00:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Enforce tarpaulin covering on piles', 'Deploy mobile water sprinkler truck twice daily'],
  },
  {
    id: 'hotspot_04',
    name: 'Metro Line Underground Boring Site',
    category: 'noise',
    coordinates: { lat: 28.6300, lng: 77.2200, addressName: 'Barakhamba Road Tunnel Access, New Delhi' },
    currentRiskScore: 52,
    currentRiskLevel: 'moderate',
    activeReportsCount: 1,
    description: 'Night-time hydraulic excavator noise exceeding 75 dBA during residential quiet hours.',
    lastInspectedAt: '2026-10-21T21:40:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Erect 4-meter sound insulation acoustic panels around diesel hydraulic generator'],
  },
  {
    id: 'hotspot_05',
    name: 'Abandoned Foundry Soil Remediation Zone',
    category: 'soil',
    coordinates: { lat: 28.6650, lng: 77.1500, addressName: 'Mayapuri Industrial Area, New Delhi' },
    currentRiskScore: 72,
    currentRiskLevel: 'high',
    activeReportsCount: 1,
    description: 'Elevated lead and heavy metal slag deposits vulnerable to windblown transport and surface runoff.',
    lastInspectedAt: '2026-10-18T16:00:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Apply impermeable temporary seal', 'Commence core soil sampling grid'],
  },
  // --- HYDERABAD (Tech & Lake Hub) ---
  {
    id: 'hotspot_hyd_01',
    name: 'Hussain Sagar Siphon & Necklace Road Inlet',
    category: 'water',
    coordinates: { lat: 17.4239, lng: 78.4738, addressName: 'Hussain Sagar North Siphon, Necklace Road, Hyderabad' },
    currentRiskScore: 82,
    currentRiskLevel: 'critical',
    activeReportsCount: 2,
    description: 'Persistent chemical effluent inflows and organic loading creating acute dissolved oxygen depletion near the outflow sluice gates.',
    lastInspectedAt: '2026-10-24T08:30:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Deploy surface aeration units and floating bio-booms', 'Enforce pre-treatment protocols at upstream inlets'],
  },
  {
    id: 'hotspot_hyd_02',
    name: 'Musi River Amberpet Outfall Basin',
    category: 'plastic',
    coordinates: { lat: 17.3912, lng: 78.5140, addressName: 'Amberpet Musi River Causeway, Hyderabad' },
    currentRiskScore: 78,
    currentRiskLevel: 'high',
    activeReportsCount: 2,
    description: 'Solid municipal waste and industrial packaging choking seasonal river channels, causing stagnant septic pools and flood backup risk.',
    lastInspectedAt: '2026-10-23T16:00:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Install mechanical trash racks at causeway piers', 'Scheduled hydraulic desiltation before monsoon surge'],
  },
  {
    id: 'hotspot_hyd_03',
    name: 'Sanathnagar Industrial Air Quality Zone',
    category: 'air',
    coordinates: { lat: 17.4580, lng: 78.4430, addressName: 'Sanathnagar Industrial Corridor, Hyderabad' },
    currentRiskScore: 68,
    currentRiskLevel: 'high',
    activeReportsCount: 1,
    description: 'Elevated particulate matter (PM2.5/PM10) emissions from metal casting, pharmaceutical synthesis, and heavy freight movements.',
    lastInspectedAt: '2026-10-22T11:45:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Enforce wet scrubbing on industrial stacks', 'Deploy mobile mist cannon along transport corridor'],
  },
  // --- MUMBAI (Coastal Megacity) ---
  {
    id: 'hotspot_bom_01',
    name: 'Mithi River BKC Siphon & Culvert Choke',
    category: 'plastic',
    coordinates: { lat: 19.0650, lng: 72.8680, addressName: 'Bandra-Kurla Complex Mithi River Confluence, Mumbai' },
    currentRiskScore: 88,
    currentRiskLevel: 'critical',
    activeReportsCount: 2,
    description: 'Severe plastic bottleneck and commercial packaging accumulation obstructing tidal sluice gates, posing extreme high-tide monsoon flood hazard.',
    lastInspectedAt: '2026-10-25T07:15:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Install automated heavy trash boom at BKC bridge', 'Daily tidal dredge cycle during spring tides'],
  },
  {
    id: 'hotspot_bom_02',
    name: 'Mahim Creek Mangrove Estuary Buffer',
    category: 'water',
    coordinates: { lat: 19.0430, lng: 72.8420, addressName: 'Mahim Nature Park Estuary, Mumbai' },
    currentRiskScore: 76,
    currentRiskLevel: 'high',
    activeReportsCount: 2,
    description: 'Untreated sewage overflow and microplastic entanglement degrading protected mangrove breathing roots and estuarine nursery habitat.',
    lastInspectedAt: '2026-10-24T14:20:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Deploy wetland floating phytoremediation rafts', 'Enforce perimeter interception traps'],
  },
  {
    id: 'hotspot_bom_03',
    name: 'Chembur-Trombay Industrial & Refinery Corridor',
    category: 'air',
    coordinates: { lat: 19.0520, lng: 72.8980, addressName: 'Chembur Refinery Belt, Mumbai' },
    currentRiskScore: 71,
    currentRiskLevel: 'high',
    activeReportsCount: 1,
    description: 'Fugitive hydrocarbon emissions and sulfur dioxide plumes accumulating under coastal thermal inversion conditions.',
    lastInspectedAt: '2026-10-23T10:00:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Continuous fence-line optical hydrocarbon monitoring', 'Mandate vapor recovery systems at tanker loading gantries'],
  },
  // --- BENGALURU (Watershed & Plateaus) ---
  {
    id: 'hotspot_blr_01',
    name: 'Bellandur Lake North Inlet Foam Barrier',
    category: 'water',
    coordinates: { lat: 12.9360, lng: 77.6650, addressName: 'Bellandur Lake North Inflow, Bengaluru' },
    currentRiskScore: 85,
    currentRiskLevel: 'critical',
    activeReportsCount: 2,
    description: 'Severe chemical surfactant accumulation causing toxic flammable froth and methane release under pre-monsoon wind agitation.',
    lastInspectedAt: '2026-10-24T12:00:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Deploy high-capacity bio-enzyme spraying nozzles', 'Maintain 24/7 froth retention mesh barriers'],
  },
  {
    id: 'hotspot_blr_02',
    name: 'Varthur Lake Wetland Outlet & Sluice',
    category: 'plastic',
    coordinates: { lat: 12.9510, lng: 77.7210, addressName: 'Varthur Lake Spillway, Whitefield, Bengaluru' },
    currentRiskScore: 74,
    currentRiskLevel: 'high',
    activeReportsCount: 2,
    description: 'Macroplastic waste and unsegregated construction runoff choking the natural wetland bio-filtration gradient.',
    lastInspectedAt: '2026-10-23T09:30:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Deploy floating debris containment boom', 'Construct sediment catchment basins upstream'],
  },
  {
    id: 'hotspot_blr_03',
    name: 'Peenya Industrial Heavy Metal Soil Zone',
    category: 'soil',
    coordinates: { lat: 13.0280, lng: 77.5160, addressName: 'Peenya Industrial Phase III, Bengaluru' },
    currentRiskScore: 70,
    currentRiskLevel: 'high',
    activeReportsCount: 1,
    description: 'Hexavalent chromium and electroplating sludge leaching into shallow groundwater aquifers.',
    lastInspectedAt: '2026-10-21T15:00:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Core borehole groundwater plume monitoring', 'Enforce zero liquid discharge (ZLD) audits'],
  },
  // --- KOLKATA (Riverine Delta) ---
  {
    id: 'hotspot_ccu_01',
    name: 'Hooghly River Howrah Ghat Discharge Zone',
    category: 'water',
    coordinates: { lat: 22.5850, lng: 88.3450, addressName: 'Howrah Ferry Ghat Outfall, Kolkata' },
    currentRiskScore: 81,
    currentRiskLevel: 'critical',
    activeReportsCount: 2,
    description: 'High coliform count and untreated municipal wastewater outfalls draining into tidal Ganga/Hooghly waters.',
    lastInspectedAt: '2026-10-24T17:10:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Install riverine intercepter screens at outfall mouths', 'Regular dissolved oxygen sampling along ferry routes'],
  },
  {
    id: 'hotspot_ccu_02',
    name: 'East Kolkata Wetlands Canal Choke Point',
    category: 'plastic',
    coordinates: { lat: 22.5450, lng: 88.4230, addressName: 'Topsia Canal & Ramsar Wetland Buffer, Kolkata' },
    currentRiskScore: 77,
    currentRiskLevel: 'high',
    activeReportsCount: 2,
    description: 'Non-biodegradable polythene and solid debris restricting tidal bio-filtration channels in protected Ramsar wetlands.',
    lastInspectedAt: '2026-10-23T11:20:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Manual debris netting and weed harvester deployment', 'Strict policing against wetland boundary dumping'],
  },
  {
    id: 'hotspot_ccu_03',
    name: 'Tangra-Topsia Tannery Effluent Basin',
    category: 'soil',
    coordinates: { lat: 22.5510, lng: 88.3910, addressName: 'Tangra Industrial Cluster, Kolkata' },
    currentRiskScore: 73,
    currentRiskLevel: 'high',
    activeReportsCount: 1,
    description: 'Historical chromium and sulfide residue deposition in reclaimed soil and open drainage ditches.',
    lastInspectedAt: '2026-10-20T14:40:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Soil stabilization with bio-char and lime treatment', 'Cordon unlined drainage ditches'],
  },
  // --- CHENNAI (Coastal Corridor) ---
  {
    id: 'hotspot_maa_01',
    name: 'Cooum River Napier Bridge Siphon & Estuary',
    category: 'water',
    coordinates: { lat: 13.0680, lng: 80.2860, addressName: 'Napier Bridge Cooum River Mouth, Chennai' },
    currentRiskScore: 86,
    currentRiskLevel: 'critical',
    activeReportsCount: 2,
    description: 'Stagnant deoxygenated blackwater and plastic detritus blocking tidal flushing into the Bay of Bengal.',
    lastInspectedAt: '2026-10-25T06:45:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Deploy high-flow aeration fountains and sandbar dredger', 'Seal illegal municipal sewer connections along banks'],
  },
  {
    id: 'hotspot_maa_02',
    name: 'Adyar River Kotturpuram Sluice',
    category: 'plastic',
    coordinates: { lat: 13.0210, lng: 80.2450, addressName: 'Kotturpuram Causeway & Sluice Gate, Chennai' },
    currentRiskScore: 79,
    currentRiskLevel: 'high',
    activeReportsCount: 2,
    description: 'Massive consumer plastic bottles and urban debris threatening drainage during torrential Northeast Monsoon bursts.',
    lastInspectedAt: '2026-10-24T13:00:00Z',
    status: 'mitigation_active',
    recommendedActions: ['Clear 120m riverine trash boom before monsoon low pressure systems', 'Install automated trash skimmer'],
  },
  {
    id: 'hotspot_maa_03',
    name: 'Manali & Ennore Petrochemical / Thermal Belt',
    category: 'air',
    coordinates: { lat: 13.2180, lng: 80.3240, addressName: 'Ennore Thermal & Petrochemical Corridor, Chennai' },
    currentRiskScore: 75,
    currentRiskLevel: 'high',
    activeReportsCount: 1,
    description: 'High concentrations of fly ash particulates, sulfur emissions, and coastal marine petrochemical runoff.',
    lastInspectedAt: '2026-10-22T16:15:00Z',
    status: 'active_monitoring',
    recommendedActions: ['Install continuous opacity monitoring on fly ash conveyors', 'Water sprinkling over coal storage yards'],
  },
];

const SEED_REPORTS: PollutionReport[] = [
  {
    id: 'REP-2026-001',
    category: 'plastic',
    title: 'Severe Plastic Bottleneck at Stormwater Drainage Siphon',
    description: 'Large mass of compacted plastic beverage bottles, polystyrene packaging, and organic debris completely blocking the 1.5m stormwater outflow siphon.',
    location: { lat: 28.6145, lng: 77.2085, addressName: 'Main Drainage Culvert #4, Sector 4' },
    severity: 5,
    evidenceType: 'photo',
    evidenceNotes: 'Geotagged high-resolution photo showing 80% cross-section occlusion.',
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Ananya Sharma',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-23T10:14:00Z',
    updatedAt: '2026-10-23T11:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    verificationNotes: 'Ground inspection confirmed severe flood hazard with approaching rainfall forecast.',
    linkedTaskId: 'TSK-PREV-101',
  },
  {
    id: 'REP-2026-002',
    category: 'water',
    title: 'Foaming Chemical Discharge in Tributary Creek',
    description: 'Thick white alkaline foam and sulfur smell emanating from an unmapped municipal stormwater drainage pipe entering the local creek.',
    location: { lat: 28.5360, lng: 77.2612, addressName: 'Okhla Drain Confluence Point' },
    severity: 4,
    evidenceType: 'photo',
    evidenceNotes: 'Visual documentation of continuous 20-meter foam plume.',
    status: 'under_review',
    reporterId: 'user_citizen_01',
    reporterName: 'Ananya Sharma',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T08:20:00Z',
    updatedAt: '2026-10-24T08:20:00Z',
  },
  {
    id: 'REP-2026-003',
    category: 'air',
    title: 'Dense Diesel Generator Particulate Plume at Commercial Complex',
    description: 'Unfiltered 500kVA backup diesel genset operating continuously without required acoustic or particulate scrubbers.',
    location: { lat: 28.5710, lng: 77.1945, addressName: 'South Extension Ring Road Plaza' },
    severity: 3,
    evidenceType: 'observation',
    evidenceNotes: 'Observed black particulate smoke depositing on nearby school playground.',
    status: 'action_taken',
    reporterId: 'user_worker_01',
    reporterName: 'Rajesh Kumar (Field Officer)',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-22T14:30:00Z',
    updatedAt: '2026-10-23T17:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    verificationNotes: 'Notice issued; catalytic soot filter installed and certified.',
  },
  {
    id: 'REP-2026-004',
    category: 'soil',
    title: 'Illegal Chemical Barrel Dumping in Fallow Field',
    description: 'Four rusted 200L steel drums leaking dark oily fluid with strong solvent odor into sandy loam soil.',
    location: { lat: 28.6655, lng: 77.1510, addressName: 'Mayapuri Peripheral Fallow Land' },
    severity: 4,
    evidenceType: 'photo',
    evidenceNotes: 'Visible soil discoloration extending 5 meters from drums.',
    status: 'verified',
    reporterId: 'user_citizen_01',
    reporterName: 'Ananya Sharma',
    isAnonymous: true,
    isDemo: true,
    createdAt: '2026-10-24T06:15:00Z',
    updatedAt: '2026-10-24T09:00:00Z',
    verifiedBy: 'Rajesh Kumar (Field Officer)',
    verificationNotes: 'Hazardous material containment team alerted.',
  },
  {
    id: 'REP-2026-005',
    category: 'noise',
    title: 'Excessive Nighttime Demolition Noise near Hospital',
    description: 'Pneumatic breaker hammering concrete until 02:30 AM within 80 meters of District General Hospital.',
    location: { lat: 28.6295, lng: 77.2210, addressName: 'Barakhamba Road Metro Construction' },
    severity: 3,
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Citizen Contributor',
    isAnonymous: true,
    isDemo: true,
    createdAt: '2026-10-23T23:45:00Z',
    updatedAt: '2026-10-24T07:30:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-PREV-102',
  },
  {
    id: 'REP-2026-006',
    category: 'visual',
    title: 'Chronic Fly-Tipping on Vacant Greenbelt Strip',
    description: 'Piles of construction rubble and abandoned commercial banners degrading public pedestrian greenway.',
    location: { lat: 28.6050, lng: 77.1850, addressName: 'Shanti Path Greenbelt Corridor' },
    severity: 2,
    status: 'submitted',
    reporterId: 'user_citizen_01',
    reporterName: 'Ananya Sharma',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T12:00:00Z',
    updatedAt: '2026-10-24T12:00:00Z',
  },
  {
    id: 'REP-2026-007',
    category: 'thermal',
    title: 'Superheated Cooling Water Outflow in Urban Canal',
    description: 'Substation cooling water discharging at 41.5°C directly into local canal, creating visible vapor and acute dissolved oxygen depletion.',
    location: { lat: 28.5200, lng: 77.2700, addressName: 'Badarpur Feeder Canal Outfall' },
    severity: 3,
    evidenceType: 'observation',
    evidenceNotes: 'Noticeable thermal plume with surface vapor and juvenile fish distress.',
    status: 'submitted',
    reporterId: 'user_citizen_01',
    reporterName: 'Ananya Sharma',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T13:10:00Z',
    updatedAt: '2026-10-24T13:10:00Z',
  },
  {
    id: 'REP-2026-008',
    category: 'light',
    title: 'Unshielded 10k-Lumen Floodlight Array Directed at Ecological Zone',
    description: 'Commercial sports facility operating unshielded high-intensity horizontal luminaires past midnight adjacent to bird sanctuary fringe.',
    location: { lat: 28.4900, lng: 77.2500, addressName: 'Asola Bhatti Sanctuary Border' },
    severity: 2,
    evidenceType: 'photo',
    evidenceNotes: 'Photographic evidence of skyward light spill and nocturnal tree canopy glare.',
    status: 'submitted',
    reporterId: 'user_citizen_01',
    reporterName: 'Ananya Sharma',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T14:00:00Z',
    updatedAt: '2026-10-24T14:00:00Z',
  },
  {
    id: 'REP-2026-009',
    category: 'radioactive',
    title: 'Elevated Gamma Dose Rate Anomaly in Scrap Metal Yard',
    description: 'Handheld dosimeter detected anomalous 4.6 µSv/h localized gamma radiation hotspot near unmanifested decommissioned industrial casing.',
    location: { lat: 28.6670, lng: 77.1490, addressName: 'Mayapuri Industrial Scrap Enclosure' },
    severity: 4,
    evidenceType: 'observation',
    evidenceNotes: 'Calibrated handheld survey meter confirmed 4.6 µSv/h at 1m cordon boundary.',
    status: 'verified',
    reporterId: 'user_worker_01',
    reporterName: 'Rajesh Kumar (Field Officer)',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T15:20:00Z',
    updatedAt: '2026-10-24T16:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    verificationNotes: 'Atomic regulatory liaison notified; temporary 50-meter perimeter cordon requested.',
  },
  // --- HYDERABAD (3 reports) ---
  {
    id: 'REP-HYD-001',
    category: 'plastic',
    title: 'Microplastic & Debris Congestion at Durgam Cheruvu Inflow',
    description: 'Submerged trash rack clogged with PET bottles and packaging debris near Madhapur tech corridor bridge.',
    location: { lat: 17.4370, lng: 78.3845, addressName: 'Durgam Cheruvu Cable Bridge Inflow, Madhapur, Hyderabad' },
    severity: 4,
    evidenceType: 'photo',
    evidenceNotes: 'Culvert inflow 75% restricted; stagnant surface scum forming.',
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Kavita Reddy',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T09:15:00Z',
    updatedAt: '2026-10-24T11:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-HYD-102',
  },
  {
    id: 'REP-HYD-002',
    category: 'water',
    title: 'Industrial Effluent Discharge into Jeedimetla Nala',
    description: 'Foaming dark chemical effluent with pungent odor detected entering stormwater channel towards Hussain Sagar feeder.',
    location: { lat: 17.5120, lng: 78.4480, addressName: 'Jeedimetla Industrial Drainage Outfall, Hyderabad' },
    severity: 5,
    evidenceType: 'observation',
    evidenceNotes: 'Water pH tested at 4.2 with mobile field kit; acute biological oxygen demand spike.',
    status: 'verified',
    reporterId: 'user_worker_01',
    reporterName: 'Rajesh Kumar (Field Officer)',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T07:30:00Z',
    updatedAt: '2026-10-24T08:45:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-HYD-101',
  },
  {
    id: 'REP-HYD-003',
    category: 'air',
    title: 'Uncontrolled Biomass & Waste Incineration at Jawaharnagar Fringe',
    description: 'Thick smoke plume from open waste burning drifting across outer ring road residential sectors.',
    location: { lat: 17.4980, lng: 78.5830, addressName: 'Jawaharnagar Landfill Perimeter, Hyderabad' },
    severity: 4,
    evidenceType: 'photo',
    status: 'under_review',
    reporterId: 'user_citizen_01',
    reporterName: 'Citizen Contributor',
    isAnonymous: true,
    isDemo: true,
    createdAt: '2026-10-25T05:20:00Z',
    updatedAt: '2026-10-25T05:20:00Z',
  },
  // --- MUMBAI (3 reports) ---
  {
    id: 'REP-BOM-001',
    category: 'plastic',
    title: 'Massive Marine Debris & Plastic Accumulation at Versova Beach Outfall',
    description: 'High tide left extensive deposits of single-use plastics, discarded fishing line, and packaging blocking storm gates.',
    location: { lat: 19.1350, lng: 72.8120, addressName: 'Versova Beach Stormwater Canal Mouth, Mumbai' },
    severity: 4,
    evidenceType: 'photo',
    evidenceNotes: 'Estimated 2.5 metric tons of plastic obstructing beach drainage channel.',
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Aarav Patel',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T10:00:00Z',
    updatedAt: '2026-10-24T12:30:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-BOM-101',
  },
  {
    id: 'REP-BOM-002',
    category: 'noise',
    title: 'High-Decibel Night Construction at Coastal Road Section',
    description: 'Heavy vibratory pile drivers operating past 01:00 AM within 120m of residential high-rises.',
    location: { lat: 18.9750, lng: 72.8050, addressName: 'Worli Sea Face Reclamation Section, Mumbai' },
    severity: 3,
    evidenceType: 'observation',
    status: 'submitted',
    reporterId: 'user_citizen_01',
    reporterName: 'Citizen Contributor',
    isAnonymous: true,
    isDemo: true,
    createdAt: '2026-10-25T01:15:00Z',
    updatedAt: '2026-10-25T01:15:00Z',
  },
  {
    id: 'REP-BOM-003',
    category: 'soil',
    title: 'Chemical Sludge Dumping near Deonar Landfill Buffer',
    description: 'Unmanifested industrial sludge tanks discarded along wetland buffer zone, leaking acidic leachate into soil.',
    location: { lat: 19.0620, lng: 72.9230, addressName: 'Deonar Dumping Ground Buffer Strip, Mumbai' },
    severity: 5,
    evidenceType: 'photo',
    status: 'verified',
    reporterId: 'user_worker_01',
    reporterName: 'Rajesh Kumar (Field Officer)',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T14:40:00Z',
    updatedAt: '2026-10-24T15:30:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-BOM-102',
  },
  // --- BENGALURU (3 reports) ---
  {
    id: 'REP-BLR-001',
    category: 'water',
    title: 'Toxic Surfactant Foam Overflowing Yemalur Bridge',
    description: 'Massive billows of detergent froth rising 3 meters above weir crest and spilling onto road corridor.',
    location: { lat: 12.9450, lng: 77.6830, addressName: 'Yemalur Bridge, Bellandur Catchment, Bengaluru' },
    severity: 5,
    evidenceType: 'photo',
    evidenceNotes: 'Airborne froth droplets causing respiratory irritation for passing motorists.',
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Deepa Narayan',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T08:10:00Z',
    updatedAt: '2026-10-24T09:30:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-BLR-101',
  },
  {
    id: 'REP-BLR-002',
    category: 'air',
    title: 'Severe Construction Dust & Traffic PM Resuspension at Silk Board',
    description: 'Continuous flyover boring combined with heavy bus corridor generating localized PM10 readings above 320 µg/m³.',
    location: { lat: 12.9175, lng: 77.6235, addressName: 'Silk Board Junction Flyover Underpass, Bengaluru' },
    severity: 4,
    evidenceType: 'observation',
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Rohan Deshmukh',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T11:25:00Z',
    updatedAt: '2026-10-24T13:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-BLR-102',
  },
  {
    id: 'REP-BLR-003',
    category: 'soil',
    title: 'Electronic Scrap Acid Leaching in Nayandahalli Warehouse Fringe',
    description: 'Open-air chemical stripping of printed circuit boards releasing copper cyanide runoff into unlined trench.',
    location: { lat: 12.9460, lng: 77.5280, addressName: 'Nayandahalli Industrial Buffer, Bengaluru' },
    severity: 4,
    evidenceType: 'photo',
    status: 'under_review',
    reporterId: 'user_citizen_01',
    reporterName: 'Citizen Contributor',
    isAnonymous: true,
    isDemo: true,
    createdAt: '2026-10-24T16:50:00Z',
    updatedAt: '2026-10-24T16:50:00Z',
  },
  // --- KOLKATA (3 reports) ---
  {
    id: 'REP-CCU-001',
    category: 'plastic',
    title: 'Plastic Siltation at Circular Canal Maniktala Inflow',
    description: 'Compacted single-use plastic layers and coconut husks blocking municipal lock gate drainage into Hooghly.',
    location: { lat: 22.5920, lng: 88.3780, addressName: 'Maniktala Circular Canal Bridge, Kolkata' },
    severity: 4,
    evidenceType: 'photo',
    evidenceNotes: 'Canal surface completely occluded; backflow observed during high tide.',
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Subir Banerjee',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T10:45:00Z',
    updatedAt: '2026-10-24T12:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-CCU-101',
  },
  {
    id: 'REP-CCU-002',
    category: 'air',
    title: 'Heavy Freight Smoke & Stubble Resuspension along Kona Expressway',
    description: 'Dense diesel exhaust plumes combined with perimeter agricultural burning causing visibility drop below 150m.',
    location: { lat: 22.5780, lng: 88.2910, addressName: 'Kona Expressway Toll Plaza Corridor, Kolkata' },
    severity: 3,
    evidenceType: 'observation',
    status: 'submitted',
    reporterId: 'user_citizen_01',
    reporterName: 'Ananya Sharma',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-25T04:15:00Z',
    updatedAt: '2026-10-25T04:15:00Z',
  },
  {
    id: 'REP-CCU-003',
    category: 'thermal',
    title: 'Thermal Discharge from Substation into Canal System',
    description: 'High-temperature cooling water outflow elevating local canal temperature to 39.8°C with noticeable fish mortality.',
    location: { lat: 22.5320, lng: 88.3840, addressName: 'Kasba Substation Canal Conduit, Kolkata' },
    severity: 3,
    evidenceType: 'observation',
    status: 'verified',
    reporterId: 'user_worker_01',
    reporterName: 'Rajesh Kumar (Field Officer)',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T13:40:00Z',
    updatedAt: '2026-10-24T15:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-CCU-102',
  },
  // --- CHENNAI (3 reports) ---
  {
    id: 'REP-MAA-001',
    category: 'soil',
    title: 'Fly Ash Slurry Leakage near Buckingham Canal',
    description: 'Ruptured slurry pipeline dispersing grey alkaline fly ash into wetland mudflats along Ennore canal.',
    location: { lat: 13.2050, lng: 80.3150, addressName: 'Ennore Creek Buckingham Canal Inflow, Chennai' },
    severity: 5,
    evidenceType: 'photo',
    evidenceNotes: 'Ash layer 15cm deep over approximately 300 square meters.',
    status: 'action_assigned',
    reporterId: 'user_worker_01',
    reporterName: 'Rajesh Kumar (Field Officer)',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T06:40:00Z',
    updatedAt: '2026-10-24T08:00:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-MAA-102',
  },
  {
    id: 'REP-MAA-002',
    category: 'plastic',
    title: 'Plastic Trash Dam at Mambalam Canal Railway Culvert',
    description: 'Hundreds of kilograms of beverage bottles and thermocol jammed against railway bridge piers, obstructing stormwater escape.',
    location: { lat: 13.0370, lng: 80.2280, addressName: 'Mambalam Canal Rail Crossing, T. Nagar, Chennai' },
    severity: 4,
    evidenceType: 'photo',
    status: 'action_assigned',
    reporterId: 'user_citizen_01',
    reporterName: 'Priya Sundaram',
    isAnonymous: false,
    isDemo: true,
    createdAt: '2026-10-24T09:20:00Z',
    updatedAt: '2026-10-24T10:15:00Z',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    linkedTaskId: 'TSK-MAA-101',
  },
  {
    id: 'REP-MAA-003',
    category: 'air',
    title: 'Chemical Odor Plume along Manali Highway Industrial Zone',
    description: 'Strong mercaptan and sulfurous volatile organic vapors impacting morning commuters and adjacent settlements.',
    location: { lat: 13.1650, lng: 80.2720, addressName: 'Manali Express Highway Industrial Strip, Chennai' },
    severity: 4,
    evidenceType: 'observation',
    status: 'under_review',
    reporterId: 'user_citizen_01',
    reporterName: 'Citizen Contributor',
    isAnonymous: true,
    isDemo: true,
    createdAt: '2026-10-25T03:30:00Z',
    updatedAt: '2026-10-25T03:30:00Z',
  },
];

const SEED_TASKS: PreventionTask[] = [
  {
    id: 'TSK-PREV-101',
    reportId: 'REP-2026-001',
    title: 'Emergency Drainage Culvert Debris Clearance & Screen Fitting',
    description: 'Deploy rapid sanitation team with backhoe grabber to extract plastic blockage at Culvert #4 before incoming storm front. Install stainless steel trash rack.',
    category: 'plastic',
    priority: 'critical',
    status: 'in_progress',
    location: { lat: 28.6145, lng: 77.2085, addressName: 'Main Drainage Culvert #4, Sector 4' },
    riskScore: 88,
    riskLevel: 'critical',
    assignedTo: {
      id: 'user_worker_01',
      name: 'Rajesh Kumar (Field Officer)',
      role: 'field_worker',
    },
    deadline: '2026-10-26T12:00:00Z',
    beforeEvidence: 'Culvert clogged with estimated 450kg plastic waste; water level rising 0.4m.',
    isDemo: true,
    createdAt: '2026-10-23T11:15:00Z',
    updatedAt: '2026-10-24T10:00:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-23T11:15:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Task generated automatically by Prevention Command Center from verified critical risk assessment.',
      },
      {
        timestamp: '2026-10-23T11:30:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_ASSIGNED',
        details: 'Assigned to Rajesh Kumar (Field Officer) with 24h deadline due to rain forecast.',
      },
      {
        timestamp: '2026-10-24T08:00:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_IN_PROGRESS',
        details: 'Commenced extraction with mobile grab truck; 60% plastic debris recovered so far.',
      },
    ],
  },
  {
    id: 'TSK-PREV-102',
    reportId: 'REP-2026-005',
    title: 'Install Acoustic Curtains & Enforce Night Construction Curfew',
    description: 'Inspect Barakhamba Road tunnel site. Verify installation of 25mm sound absorption acoustic blankets and issue curfew notice for heavy pneumatic tooling after 22:00.',
    category: 'noise',
    priority: 'high',
    status: 'assigned',
    location: { lat: 28.6295, lng: 77.2210, addressName: 'Barakhamba Road Metro Construction' },
    riskScore: 68,
    riskLevel: 'high',
    assignedTo: {
      id: 'user_worker_01',
      name: 'Rajesh Kumar (Field Officer)',
      role: 'field_worker',
    },
    deadline: '2026-10-27T18:00:00Z',
    isDemo: true,
    createdAt: '2026-10-24T07:45:00Z',
    updatedAt: '2026-10-24T07:45:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T07:45:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Generated following citizen noise threshold complaints near medical facility.',
      },
      {
        timestamp: '2026-10-24T08:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'WORKER_ASSIGNED',
        details: 'Assigned to Officer Rajesh Kumar for acoustic audit.',
      },
    ],
  },
  {
    id: 'TSK-PREV-103',
    title: 'Deploy Protective Impermeable Geotextile Membrane on Slag Pile',
    description: 'Cover 120m² lead-contaminated soil surface in Sector 6 brownfield with weighted 1.5mm HDPE liner to prevent rainfall leaching into surrounding soil.',
    category: 'soil',
    priority: 'high',
    status: 'verified',
    location: { lat: 28.6650, lng: 77.1500, addressName: 'Mayapuri Peripheral Fallow Land' },
    riskScore: 74,
    riskLevel: 'high',
    assignedTo: {
      id: 'user_worker_01',
      name: 'Rajesh Kumar (Field Officer)',
      role: 'field_worker',
    },
    deadline: '2026-10-24T18:00:00Z',
    beforeEvidence: 'Exposed black foundry slag heap exposed to weather.',
    afterEvidence: '100% covered with anchored HDPE geomembrane with gravel ballasting.',
    actionSummary: 'Full liner barrier secured. Perimeter drainage canal dug to channel clean runoff away from soil zone.',
    reviewerNotes: 'Verified on-site by Senior Inspector. Runoff test showed zero heavy metal leaching.',
    verifiedBy: 'Dr. Sarah Mukherjee (Admin)',
    verifiedAt: '2026-10-24T20:00:00Z',
    isDemo: true,
    createdAt: '2026-10-21T09:00:00Z',
    updatedAt: '2026-10-24T20:00:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-21T09:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Initiated brownfield preventative capping.',
      },
      {
        timestamp: '2026-10-23T17:30:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_COMPLETED',
        details: 'Liner installed and ballasted. Submitted after-action documentation.',
      },
      {
        timestamp: '2026-10-24T20:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'STATUS_VERIFIED',
        details: 'Ground verification confirmed compliant containment. Task successfully marked closed and 25 EcoPoints awarded.',
      },
    ],
  },
  {
    id: 'TSK-PREV-104',
    reportId: 'REP-2026-002',
    title: 'Install Sorbent Boom Barrier at Chemical Outflow Creek',
    description: 'Deploy 50-meter hydrophobic absorbent booms and set up pH monitoring weir across tributary creek ahead of rainfall.',
    category: 'water',
    priority: 'critical',
    status: 'pending',
    location: { lat: 28.5360, lng: 77.2612, addressName: 'Okhla Drain Confluence Point' },
    riskScore: 84,
    riskLevel: 'critical',
    deadline: '2026-10-26T18:00:00Z',
    beforeEvidence: 'Alkaline foam plume observed spreading 20m along creek confluence.',
    isDemo: true,
    createdAt: '2026-10-24T14:00:00Z',
    updatedAt: '2026-10-24T14:00:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T14:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Open task generated awaiting rapid response field worker assignment.',
      },
    ],
  },
  {
    id: 'TSK-PREV-105',
    reportId: 'REP-2026-003',
    title: 'Verify Diesel Genset Catalytic Soot Filter Retrofit',
    description: 'Inspect commercial plaza backup generator and verify compliance with particulate emission reduction mandate.',
    category: 'air',
    priority: 'high',
    status: 'completed',
    location: { lat: 28.5710, lng: 77.1945, addressName: 'South Extension Ring Road Plaza' },
    riskScore: 66,
    riskLevel: 'high',
    assignedTo: {
      id: 'user_worker_01',
      name: 'Rajesh Kumar (Field Officer)',
      role: 'field_worker',
    },
    deadline: '2026-10-26T14:00:00Z',
    beforeEvidence: 'Unfiltered black soot billowing from rooftop generator exhaust stack.',
    afterEvidence: 'Catalytic particulate filter mounted; opacity meter measured 88% reduction in particulate smoke.',
    actionSummary: 'Field Officer Rajesh Kumar verified retrofit and calibrated soot trap. Awaiting Admin sign-off.',
    isDemo: true,
    createdAt: '2026-10-23T15:00:00Z',
    updatedAt: '2026-10-24T17:30:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-23T15:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Air quality remediation directive issued.',
      },
      {
        timestamp: '2026-10-24T17:30:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_COMPLETED',
        details: 'Submitted for Admin verification with opacity test certification.',
      },
    ],
  },
  {
    id: 'TSK-PREV-106',
    title: 'Emergency Desiltation of Sector 2 Storm Inlet Pipe',
    description: 'Excavate compacted sediment and plastic blockage from 80cm stormwater intake to prevent localized street inundation.',
    category: 'plastic',
    priority: 'critical',
    status: 'in_progress',
    location: { lat: 28.6180, lng: 77.2150, addressName: 'Sector 2 Storm Inlet Siphon' },
    riskScore: 82,
    riskLevel: 'critical',
    assignedTo: {
      id: 'user_worker_01',
      name: 'Rajesh Kumar (Field Officer)',
      role: 'field_worker',
    },
    deadline: '2026-10-23T12:00:00Z', // Overdue relative to current time
    beforeEvidence: 'Intake mouth 90% blocked by sandbags and single-use plastic debris.',
    isDemo: true,
    createdAt: '2026-10-22T08:00:00Z',
    updatedAt: '2026-10-23T10:00:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-22T08:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Critical flood prevention intake task dispatched.',
      },
      {
        timestamp: '2026-10-23T10:00:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_IN_PROGRESS',
        details: 'Excavation team on site; delayed due to equipment repositioning.',
      },
    ],
  },
  // --- HYDERABAD (2 tasks) ---
  {
    id: 'TSK-HYD-101',
    reportId: 'REP-HYD-002',
    title: 'Emergency Effluent Containment & Aeration at Jeedimetla Nala',
    description: 'Deploy neutralizing alkali lime treatment and floating surface aerators to mitigate low DO conditions.',
    category: 'water',
    priority: 'critical',
    status: 'in_progress',
    location: { lat: 17.5120, lng: 78.4480, addressName: 'Jeedimetla Industrial Drainage Outfall, Hyderabad' },
    riskScore: 86,
    riskLevel: 'critical',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-27T12:00:00Z',
    beforeEvidence: 'Acidic chemical froth draining into stormwater canal; pH 4.2.',
    isDemo: true,
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T10:30:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T09:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Critical chemical mitigation dispatched following water sample verification.',
      },
      {
        timestamp: '2026-10-24T09:30:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_IN_PROGRESS',
        details: 'Aeration boom deployed; neutralizing buffer dosing commenced.',
      },
    ],
  },
  {
    id: 'TSK-HYD-102',
    reportId: 'REP-HYD-001',
    title: 'Rapid Plastic Extraction & Silt Trap Clearance at Durgam Cheruvu',
    description: 'Extract blocked single-use plastics from inlet culvert screen using mobile crane arm; replace damaged baffle screens.',
    category: 'plastic',
    priority: 'high',
    status: 'assigned',
    location: { lat: 17.4370, lng: 78.3845, addressName: 'Durgam Cheruvu Cable Bridge Inflow, Madhapur, Hyderabad' },
    riskScore: 74,
    riskLevel: 'high',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-28T16:00:00Z',
    isDemo: true,
    createdAt: '2026-10-24T11:15:00Z',
    updatedAt: '2026-10-24T11:15:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T11:15:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Preventive lake preservation task assigned.',
      },
    ],
  },
  // --- MUMBAI (2 tasks) ---
  {
    id: 'TSK-BOM-101',
    reportId: 'REP-BOM-001',
    title: 'Install Heavy-Duty Trash Booms at Versova Drainage Outfall',
    description: 'Anchor interlocking HDPE floating boom across 60m canal outlet to capture marine plastic before high tide tidal wash.',
    category: 'plastic',
    priority: 'critical',
    status: 'in_progress',
    location: { lat: 19.1350, lng: 72.8120, addressName: 'Versova Beach Stormwater Canal Mouth, Mumbai' },
    riskScore: 84,
    riskLevel: 'critical',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-27T08:00:00Z',
    beforeEvidence: 'Extensive plastic accumulation impeding gravity drainage.',
    isDemo: true,
    createdAt: '2026-10-24T13:00:00Z',
    updatedAt: '2026-10-24T14:30:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T13:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Coastal flood prevention directive issued ahead of spring tide.',
      },
      {
        timestamp: '2026-10-24T14:30:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_IN_PROGRESS',
        details: 'Anchorage winches fitted; boom panels being towed into position.',
      },
    ],
  },
  {
    id: 'TSK-BOM-102',
    reportId: 'REP-BOM-003',
    title: 'Remediate Chemical Sludge Leaching at Deonar Buffer',
    description: 'Excavate contaminated surface sludge drums and lay high-density polyethylene impermeable containment liner.',
    category: 'soil',
    priority: 'high',
    status: 'assigned',
    location: { lat: 19.0620, lng: 72.9230, addressName: 'Deonar Dumping Ground Buffer Strip, Mumbai' },
    riskScore: 77,
    riskLevel: 'high',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-28T18:00:00Z',
    isDemo: true,
    createdAt: '2026-10-24T15:45:00Z',
    updatedAt: '2026-10-24T15:45:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T15:45:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Hazardous soil containment directive issued.',
      },
    ],
  },
  // --- BENGALURU (2 tasks) ---
  {
    id: 'TSK-BLR-101',
    reportId: 'REP-BLR-001',
    title: 'Deploy Foam Suppression Sprinklers at Yemalur Bridge Sluice',
    description: 'Set up high-pressure misting manifolds with biodegradable de-foaming agents to collapse toxic surfactant froth.',
    category: 'water',
    priority: 'critical',
    status: 'in_progress',
    location: { lat: 12.9450, lng: 77.6830, addressName: 'Yemalur Bridge, Bellandur Catchment, Bengaluru' },
    riskScore: 87,
    riskLevel: 'critical',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-27T10:00:00Z',
    beforeEvidence: 'Froth accumulation exceeding 2.5 meters above bridge guardrails.',
    isDemo: true,
    createdAt: '2026-10-24T10:00:00Z',
    updatedAt: '2026-10-24T11:45:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T10:00:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Urban froth mitigation directive issued.',
      },
      {
        timestamp: '2026-10-24T11:45:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_IN_PROGRESS',
        details: 'High-pressure mist system commissioned; froth height dropped by 60%.',
      },
    ],
  },
  {
    id: 'TSK-BLR-102',
    reportId: 'REP-BLR-002',
    title: 'Deploy High-Pressure Water Mist Cannons at Silk Board',
    description: 'Station twin truck-mounted fog cannons to scrub airborne particulate matter along metro construction corridor.',
    category: 'air',
    priority: 'high',
    status: 'assigned',
    location: { lat: 12.9175, lng: 77.6235, addressName: 'Silk Board Junction Flyover Underpass, Bengaluru' },
    riskScore: 75,
    riskLevel: 'high',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-28T14:00:00Z',
    isDemo: true,
    createdAt: '2026-10-24T13:30:00Z',
    updatedAt: '2026-10-24T13:30:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T13:30:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Airborne dust suppression dispatch generated.',
      },
    ],
  },
  // --- KOLKATA (2 tasks) ---
  {
    id: 'TSK-CCU-101',
    reportId: 'REP-CCU-001',
    title: 'Clear Tidal Plastic Bottlenecks at East Kolkata Wetland Spillway',
    description: 'Operate amphibious weed-and-plastic harvester to reopen 350m of tidal drainage arteries into Ramsar wetland.',
    category: 'plastic',
    priority: 'critical',
    status: 'in_progress',
    location: { lat: 22.5450, lng: 88.4230, addressName: 'Topsia Canal & Ramsar Wetland Buffer, Kolkata' },
    riskScore: 83,
    riskLevel: 'critical',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-27T15:00:00Z',
    beforeEvidence: 'Thick mat of plastic bottles and urban detritus choking bio-drainage.',
    isDemo: true,
    createdAt: '2026-10-24T12:30:00Z',
    updatedAt: '2026-10-24T14:00:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T12:30:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Ramsar wetland hydraulic clearance task created.',
      },
      {
        timestamp: '2026-10-24T14:00:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_IN_PROGRESS',
        details: 'Harvester vessel deployed; 1.8 tons of plastic extracted.',
      },
    ],
  },
  {
    id: 'TSK-CCU-102',
    reportId: 'REP-CCU-003',
    title: 'Verify Industrial Thermal Outflow Dispersion & Aeration',
    description: 'Inspect cooling channel weirs and mandate installation of cascade aerators to drop effluent temperature below 32°C.',
    category: 'thermal',
    priority: 'medium',
    status: 'assigned',
    location: { lat: 22.5320, lng: 88.3840, addressName: 'Kasba Substation Canal Conduit, Kolkata' },
    riskScore: 62,
    riskLevel: 'moderate',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-29T12:00:00Z',
    isDemo: true,
    createdAt: '2026-10-24T15:20:00Z',
    updatedAt: '2026-10-24T15:20:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T15:20:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Thermal effluent inspection directive issued.',
      },
    ],
  },
  // --- CHENNAI (2 tasks) ---
  {
    id: 'TSK-MAA-101',
    reportId: 'REP-MAA-002',
    title: 'Clear Estuarine Sluice Trash Boom at Cooum River Mouth',
    description: 'Mobilize heavy excavator with grab bucket to clear debris accumulation at Napier Bridge sluice before incoming rainfall.',
    category: 'water',
    priority: 'critical',
    status: 'in_progress',
    location: { lat: 13.0680, lng: 80.2860, addressName: 'Napier Bridge Cooum River Mouth, Chennai' },
    riskScore: 85,
    riskLevel: 'critical',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-27T06:00:00Z',
    beforeEvidence: 'Sluice gate passage obstructed by floating plastic mass; tidal exchange halted.',
    isDemo: true,
    createdAt: '2026-10-24T10:45:00Z',
    updatedAt: '2026-10-24T11:30:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T10:45:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Monsoon flood defense task initialized.',
      },
      {
        timestamp: '2026-10-24T11:30:00Z',
        actorId: 'user_worker_01',
        actorName: 'Rajesh Kumar',
        action: 'STATUS_IN_PROGRESS',
        details: 'Grab bucket operations underway; tidal flow partially restored.',
      },
    ],
  },
  {
    id: 'TSK-MAA-102',
    reportId: 'REP-MAA-001',
    title: 'Buckingham Canal Fly Ash Barrier Inspection & Soil Containment',
    description: 'Build clay-bund cofferdam to halt slurry migration from damaged ash pipeline into Buckingham Canal watercourse.',
    category: 'soil',
    priority: 'high',
    status: 'assigned',
    location: { lat: 13.2050, lng: 80.3150, addressName: 'Ennore Creek Buckingham Canal Inflow, Chennai' },
    riskScore: 78,
    riskLevel: 'high',
    assignedTo: { id: 'user_worker_01', name: 'Rajesh Kumar (Field Officer)', role: 'field_worker' },
    deadline: '2026-10-28T17:00:00Z',
    isDemo: true,
    createdAt: '2026-10-24T08:30:00Z',
    updatedAt: '2026-10-24T08:30:00Z',
    auditTrail: [
      {
        timestamp: '2026-10-24T08:30:00Z',
        actorId: 'user_admin_01',
        actorName: 'Dr. Sarah Mukherjee',
        action: 'TASK_CREATED',
        details: 'Ash containment barrier directive created.',
      },
    ],
  },
];

const SEED_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'NOTIF-01',
    title: 'Critical Weather Synergy Alert',
    message: 'High precipitation forecast (18mm) over Sector 4 Plastic Hotspot. Immediate culvert inspection recommended.',
    type: 'alert',
    read: false,
    link: '/prevention',
    createdAt: '2026-10-24T06:00:00Z',
  },
  {
    id: 'NOTIF-02',
    title: 'New Citizen Report Verified',
    message: 'Report REP-2026-004 (Illegal Chemical Drum Dumping) has been verified by Field Operations.',
    type: 'report',
    read: false,
    link: '/reports',
    createdAt: '2026-10-24T09:05:00Z',
  },
  {
    id: 'NOTIF-03',
    title: 'Prevention Task Verified',
    message: 'Task TSK-PREV-103 (Geotextile Liner on Slag Pile) was verified and signed off by Environmental Director.',
    type: 'task',
    read: true,
    link: '/prevention',
    createdAt: '2026-10-23T20:05:00Z',
  },
  {
    id: 'NOTIF-04',
    title: 'Regional Risk Alert — Hyderabad',
    message: 'Elevated precipitation forecast over Hussain Sagar Siphon & Amberpet Musi basin. High flood & debris backup risk.',
    type: 'alert',
    read: false,
    link: '/live-map',
    createdAt: '2026-10-25T06:30:00Z',
  },
  {
    id: 'NOTIF-05',
    title: 'Coastal Tidal Warning — Mumbai',
    message: 'Spring high tide + Mithi River BKC culvert plastic bottleneck. Immediate sluice clearance recommended.',
    type: 'alert',
    read: false,
    link: '/live-map',
    createdAt: '2026-10-25T07:00:00Z',
  },
];

class StorageService {
  private inMemoryCache: {
    reports: PollutionReport[] | null;
    tasks: PreventionTask[] | null;
    hotspots: EnvironmentalHotspot[] | null;
    users: UserProfile[] | null;
    notifications: InAppNotification[] | null;
    currentUser: UserProfile | null;
  } = {
    reports: null,
    tasks: null,
    hotspots: null,
    users: null,
    notifications: null,
    currentUser: null,
  };

  private getFromLocal<T>(key: string, seed: T): T {
    try {
      if (typeof window === 'undefined') return seed;
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Storage access error for ${key}:`, e);
      return seed;
    }
  }

  private saveToLocal<T>(key: string, data: T): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Storage save error for ${key}:`, e);
    }
  }

  // User Management
  public getUsers(): UserProfile[] {
    if (!this.inMemoryCache.users) {
      this.inMemoryCache.users = this.getFromLocal(STORAGE_KEYS.USERS, SEED_USERS);
    }
    return [...this.inMemoryCache.users];
  }

  public getCurrentUser(): UserProfile {
    if (!this.inMemoryCache.currentUser) {
      this.inMemoryCache.currentUser = this.getFromLocal(STORAGE_KEYS.CURRENT_USER, SEED_USERS[0]);
    }
    return { ...this.inMemoryCache.currentUser };
  }

  public setCurrentUser(user: UserProfile): void {
    this.inMemoryCache.currentUser = user;
    this.saveToLocal(STORAGE_KEYS.CURRENT_USER, user);
  }

  public updateUserPoints(userId: string, addedPoints: number, newBadge?: string): void {
    const users = this.getUsers().map((u) => {
      if (u.id === userId) {
        const badges = [...u.badges];
        if (newBadge && !badges.includes(newBadge)) {
          badges.push(newBadge);
        }
        return {
          ...u,
          ecoPoints: u.ecoPoints + addedPoints,
          badges,
          reportsSubmitted: u.reportsSubmitted + 1,
        };
      }
      return u;
    });
    this.inMemoryCache.users = users;
    this.saveToLocal(STORAGE_KEYS.USERS, users);

    // Update active user if same
    if (this.inMemoryCache.currentUser?.id === userId) {
      this.setCurrentUser({
        ...this.inMemoryCache.currentUser,
        ecoPoints: this.inMemoryCache.currentUser.ecoPoints + addedPoints,
        badges: newBadge && !this.inMemoryCache.currentUser.badges.includes(newBadge)
          ? [...this.inMemoryCache.currentUser.badges, newBadge]
          : this.inMemoryCache.currentUser.badges,
        reportsSubmitted: this.inMemoryCache.currentUser.reportsSubmitted + 1,
      });
    }
  }

  // Reports
  public getReports(): PollutionReport[] {
    if (!this.inMemoryCache.reports) {
      const stored = this.getFromLocal(STORAGE_KEYS.REPORTS, SEED_REPORTS);
      // Auto-migrate: ensure all multi-city seed reports are available in existing local caches
      const storedIds = new Set(stored.map((r) => r.id));
      const missingSeeds = SEED_REPORTS.filter((r) => !storedIds.has(r.id));
      if (missingSeeds.length > 0) {
        const merged = [...stored, ...missingSeeds];
        this.saveToLocal(STORAGE_KEYS.REPORTS, merged);
        this.inMemoryCache.reports = merged;
      } else {
        this.inMemoryCache.reports = stored;
      }
    }
    return [...this.inMemoryCache.reports];
  }

  public addReport(report: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>): PollutionReport {
    // Duplicate prevention: check if identical title & category from same reporter exists within 60 seconds
    const existingReports = this.getReports();
    const isDuplicate = existingReports.some(
      (r) =>
        r.reporterId === report.reporterId &&
        r.category === report.category &&
        r.title.toLowerCase().trim() === report.title.toLowerCase().trim() &&
        Date.now() - new Date(r.createdAt).getTime() < 60000
    );

    if (isDuplicate) {
      throw new Error('Duplicate submission detected: An identical observation was submitted recently. Please avoid duplicate reports.');
    }

    const newReport: PollutionReport = {
      ...report,
      id: `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };

    const reports = [newReport, ...existingReports];
    this.inMemoryCache.reports = reports;
    this.saveToLocal(STORAGE_KEYS.REPORTS, reports);

    // Award EcoPoints to reporter (10 points for submission)
    this.updateUserPoints(newReport.reporterId, 10, 'Active Citizen Scout');

    // Add In-App notification with deduplication & privacy
    const reporterDisplay = newReport.isAnonymous ? 'Anonymous Citizen' : (newReport.reporterName || 'Citizen Contributor');
    this.addNotificationWithDeduplication({
      title: `New Incident Logged: ${newReport.category.toUpperCase()}`,
      message: `"${newReport.title}" reported by ${reporterDisplay}. Severity: ${newReport.severity}/5. Queued for initial review.`,
      type: 'report',
      severity: newReport.severity >= 4 ? 'critical' : newReport.severity === 3 ? 'moderate' : 'low',
      category: newReport.category,
      linkedEntityId: newReport.id,
      linkedEntityType: 'report',
      link: '/reports',
      dedupKey: `REPORT_SUBMITTED_${newReport.id}`,
    });

    // If critical severity (4 or 5), also trigger risk alert
    if (newReport.severity >= 4) {
      this.addNotificationWithDeduplication({
        title: `HIGH SEVERITY ALERT: ${newReport.category.toUpperCase()} (${newReport.severity}/5)`,
        message: `High magnitude observation "${newReport.title}" flagged in ${newReport.location.addressName || 'monitored sector'}. Rapid reconnaissance needed.`,
        type: 'alert',
        severity: 'critical',
        category: newReport.category,
        linkedEntityId: newReport.id,
        linkedEntityType: 'report',
        link: '/reports',
        dedupKey: `RISK_ALERT_REPORT_${newReport.id}`,
      });
    }

    return newReport;
  }

  public updateReportStatus(
    reportId: string,
    status: PollutionReport['status'],
    verifiedBy?: string,
    verificationNotes?: string,
    rejectionReason?: string
  ): PollutionReport | null {
    let reporterToAward: string | null = null;
    let targetReport: PollutionReport | null = null;

    const reports = this.getReports().map((r) => {
      if (r.id === reportId) {
        if (status === 'verified' && r.status !== 'verified') {
          reporterToAward = r.reporterId;
        }

        const updated = {
          ...r,
          status,
          verifiedBy: verifiedBy || r.verifiedBy,
          verificationNotes: verificationNotes || r.verificationNotes,
          rejectionReason: rejectionReason || r.rejectionReason,
          updatedAt: new Date().toISOString(),
        };
        targetReport = updated;
        return updated;
      }
      return r;
    });

    this.inMemoryCache.reports = reports;
    this.saveToLocal(STORAGE_KEYS.REPORTS, reports);

    // If verified by Admin, award bonus EcoPoints to reporter
    if (reporterToAward) {
      this.updateUserPoints(reporterToAward, 15, 'Eagle Eye Scout');
    }

    // Notify submitting citizen of status update
    if (targetReport) {
      const rep = targetReport as PollutionReport;
      this.addNotificationWithDeduplication({
        userId: rep.reporterId,
        title: `Observation Status: ${status.replace('_', ' ').toUpperCase()}`,
        message: `Your observation "${rep.title}" is now marked as "${status.replace('_', ' ')}"${verificationNotes ? `: ${verificationNotes}` : '.'}`,
        type: 'report',
        category: rep.category,
        linkedEntityId: rep.id,
        linkedEntityType: 'report',
        link: '/reports',
        dedupKey: `REPORT_STATUS_${rep.id}_${status}`,
      });
    }

    return targetReport;
  }

  // Prevention Tasks
  public getTasks(): PreventionTask[] {
    if (!this.inMemoryCache.tasks) {
      const stored = this.getFromLocal(STORAGE_KEYS.TASKS, SEED_TASKS);
      // Auto-migrate: ensure all multi-city seed tasks are available in existing local caches
      const storedIds = new Set(stored.map((t) => t.id));
      const missingSeeds = SEED_TASKS.filter((t) => !storedIds.has(t.id));
      if (missingSeeds.length > 0) {
        const merged = [...stored, ...missingSeeds];
        this.saveToLocal(STORAGE_KEYS.TASKS, merged);
        this.inMemoryCache.tasks = merged;
      } else {
        this.inMemoryCache.tasks = stored;
      }
    }
    return [...this.inMemoryCache.tasks];
  }

  public addTask(task: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>): PreventionTask {
    const currentUser = this.getCurrentUser();
    const newTask: PreventionTask = {
      ...task,
      id: `TSK-PREV-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: task.isDemo ?? false,
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          action: 'TASK_CREATED',
          details: `Prevention task created with priority: ${task.priority.toUpperCase()}`,
        },
      ],
    };

    const tasks = [newTask, ...this.getTasks()];
    this.inMemoryCache.tasks = tasks;
    this.saveToLocal(STORAGE_KEYS.TASKS, tasks);

    this.addNotificationWithDeduplication({
      userRole: newTask.assignedTo ? 'field_worker' : 'admin',
      userId: newTask.assignedTo?.id,
      title: 'New Prevention Task Logged',
      message: `${newTask.title} has been logged with priority ${newTask.priority.toUpperCase()}${newTask.assignedTo ? ` and assigned to ${newTask.assignedTo.name}` : ''}.`,
      type: 'task',
      severity: newTask.priority === 'critical' ? 'critical' : newTask.priority === 'high' ? 'high' : 'moderate',
      category: newTask.category,
      linkedEntityId: newTask.id,
      linkedEntityType: 'task',
      link: '/prevention',
      dedupKey: `TASK_CREATED_${newTask.id}`,
    });

    return newTask;
  }

  public updateTaskStatus(
    taskId: string,
    status: PreventionTask['status'],
    notes?: string,
    afterEvidence?: string,
    actor?: UserProfile
  ): PreventionTask | null {
    const currentUser = actor || this.getCurrentUser();
    let verifiedWorkerId: string | null = null;
    let linkedReportId: string | null = null;

    const tasks = this.getTasks().map((t) => {
      if (t.id === taskId) {
        // Enforce evidence validation before completion or verification
        const effectiveEvidence = afterEvidence || t.afterEvidence;
        if ((status === 'completed' || status === 'verified') && !effectiveEvidence) {
          throw new Error('Validation Error: Task cannot be submitted or verified without completion evidence.');
        }

        const auditEntry: TaskAuditEntry = {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          action: `STATUS_${status.toUpperCase()}`,
          details: notes || `Status transitioned to ${status}`,
        };

        const updated: PreventionTask = {
          ...t,
          status,
          updatedAt: new Date().toISOString(),
          auditTrail: [auditEntry, ...t.auditTrail],
        };

        if (afterEvidence) {
          updated.afterEvidence = afterEvidence;
        }
        if (status === 'completed') {
          updated.actionSummary = notes || updated.actionSummary;
        }
        if (status === 'verified') {
          updated.verifiedBy = currentUser.displayName;
          updated.verifiedAt = new Date().toISOString();
          updated.reviewerNotes = notes || updated.reviewerNotes;
          updated.correctionNotes = undefined; // Clear correction notices once verified

          if (t.assignedTo?.id) {
            verifiedWorkerId = t.assignedTo.id;
          }
          if (t.reportId) {
            linkedReportId = t.reportId;
          }
        }

        return updated;
      }
      return t;
    });

    this.inMemoryCache.tasks = tasks;
    this.saveToLocal(STORAGE_KEYS.TASKS, tasks);

    // If submitted for verification, notify Admin
    if (status === 'completed') {
      const taskObj = tasks.find((t) => t.id === taskId);
      this.addNotificationWithDeduplication({
        userRole: 'admin',
        title: `Remediation Submitted: ${taskObj?.title || taskId}`,
        message: `Field worker submitted completion evidence for ${taskId}. Verification sign-off required.`,
        type: 'task',
        linkedEntityId: taskId,
        linkedEntityType: 'task',
        link: '/prevention',
        dedupKey: `TASK_SUBMITTED_VERIFY_${taskId}`,
      });
    }

    // Award EcoPoints to the field worker upon Admin verification
    if (verifiedWorkerId) {
      this.updateUserPoints(verifiedWorkerId, 25, 'Prevention Guardian');
      this.addNotificationWithDeduplication({
        userId: verifiedWorkerId,
        userRole: 'field_worker',
        title: 'Prevention Task Verified!',
        message: `Task ${taskId} was verified and signed off by ${currentUser.displayName}. +25 EcoPoints awarded.`,
        type: 'task',
        linkedEntityId: taskId,
        linkedEntityType: 'task',
        link: '/prevention',
        dedupKey: `TASK_VERIFIED_${taskId}`,
      });
    }

    // Sync linked report status if applicable
    if (linkedReportId) {
      this.updateReportStatus(
        linkedReportId,
        'action_taken',
        currentUser.displayName,
        `Mitigation verified by ${currentUser.displayName} through Prevention Command Center.`
      );
    }

    return tasks.find((t) => t.id === taskId) || null;
  }

  public returnTaskForCorrection(
    taskId: string,
    correctionNotes: string,
    actor?: UserProfile
  ): PreventionTask | null {
    const currentUser = actor || this.getCurrentUser();
    let assignedWorkerId: string | undefined;

    const tasks = this.getTasks().map((t) => {
      if (t.id === taskId) {
        assignedWorkerId = t.assignedTo?.id;
        const auditEntry: TaskAuditEntry = {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          action: 'RETURNED_FOR_CORRECTION',
          details: correctionNotes || 'Task returned for additional mitigation and evidence correction.',
        };

        const updated: PreventionTask = {
          ...t,
          status: 'in_progress',
          correctionNotes,
          updatedAt: new Date().toISOString(),
          auditTrail: [auditEntry, ...t.auditTrail],
        };

        return updated;
      }
      return t;
    });

    this.inMemoryCache.tasks = tasks;
    this.saveToLocal(STORAGE_KEYS.TASKS, tasks);

    this.addNotificationWithDeduplication({
      userId: assignedWorkerId,
      userRole: 'field_worker',
      title: 'Action Returned for Correction',
      message: `Task ${taskId} requires revision: ${correctionNotes}`,
      type: 'task',
      linkedEntityId: taskId,
      linkedEntityType: 'task',
      link: '/prevention',
      dedupKey: `TASK_CORRECTION_${taskId}_${Date.now()}`,
    });

    return tasks.find((t) => t.id === taskId) || null;
  }

  public assignTaskWorker(
    taskId: string,
    worker: { id: string; name: string; role: UserRole },
    actor?: UserProfile
  ): PreventionTask | null {
    const currentUser = actor || this.getCurrentUser();
    const tasks = this.getTasks().map((t) => {
      if (t.id === taskId) {
        const auditEntry: TaskAuditEntry = {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          action: 'WORKER_ASSIGNED',
          details: `Task assigned to ${worker.name} (${worker.role}) by ${currentUser.displayName}`,
        };

        const updated: PreventionTask = {
          ...t,
          assignedTo: worker,
          status: t.status === 'pending' ? 'assigned' : t.status,
          updatedAt: new Date().toISOString(),
          auditTrail: [auditEntry, ...t.auditTrail],
        };

        return updated;
      }
      return t;
    });

    this.inMemoryCache.tasks = tasks;
    this.saveToLocal(STORAGE_KEYS.TASKS, tasks);

    const assignedTask = tasks.find((t) => t.id === taskId);
    if (assignedTask) {
      this.addNotificationWithDeduplication({
        userId: worker.id,
        userRole: 'field_worker',
        title: `New Assignment: ${assignedTask.title}`,
        message: `Assigned to you by ${currentUser.displayName}. Priority: ${assignedTask.priority.toUpperCase()}. Deadline: ${new Date(assignedTask.deadline).toLocaleDateString()}.`,
        type: 'task',
        category: assignedTask.category,
        linkedEntityId: assignedTask.id,
        linkedEntityType: 'task',
        link: '/prevention',
        dedupKey: `TASK_ASSIGNED_${taskId}_${worker.id}`,
      });
    }

    return assignedTask || null;
  }

  // Hotspots
  public getHotspots(): EnvironmentalHotspot[] {
    if (!this.inMemoryCache.hotspots) {
      const stored = this.getFromLocal(STORAGE_KEYS.HOTSPOTS, SEED_HOTSPOTS);
      // Auto-migrate: ensure all multi-city seed hotspots are available in existing local caches
      const storedIds = new Set(stored.map((h) => h.id));
      const missingSeeds = SEED_HOTSPOTS.filter((h) => !storedIds.has(h.id));
      if (missingSeeds.length > 0) {
        const merged = [...stored, ...missingSeeds];
        this.saveToLocal(STORAGE_KEYS.HOTSPOTS, merged);
        this.inMemoryCache.hotspots = merged;
      } else {
        this.inMemoryCache.hotspots = stored;
      }
    }
    return [...this.inMemoryCache.hotspots];
  }

  public addHotspot(hotspot: Omit<EnvironmentalHotspot, 'id'>): EnvironmentalHotspot {
    const newHotspot: EnvironmentalHotspot = {
      ...hotspot,
      id: `hotspot_${Date.now().toString(36)}`,
    };
    const hotspots = [newHotspot, ...this.getHotspots()];
    this.inMemoryCache.hotspots = hotspots;
    this.saveToLocal(STORAGE_KEYS.HOTSPOTS, hotspots);
    return newHotspot;
  }

  // Notifications
  public getNotifications(): InAppNotification[] {
    if (!this.inMemoryCache.notifications) {
      const stored = this.getFromLocal(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
      const storedIds = new Set(stored.map((n) => n.id));
      const missingSeeds = SEED_NOTIFICATIONS.filter((n) => !storedIds.has(n.id));
      if (missingSeeds.length > 0) {
        const merged = [...stored, ...missingSeeds];
        this.saveToLocal(STORAGE_KEYS.NOTIFICATIONS, merged);
        this.inMemoryCache.notifications = merged;
      } else {
        this.inMemoryCache.notifications = stored;
      }
    }
    return [...this.inMemoryCache.notifications];
  }

  public addNotification(notification: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): InAppNotification {
    const newNotif: InAppNotification = {
      ...notification,
      id: `NOTIF-${Date.now().toString(36)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const notifs = [newNotif, ...this.getNotifications()];
    this.inMemoryCache.notifications = notifs;
    this.saveToLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return newNotif;
  }

  public addNotificationWithDeduplication(notification: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): InAppNotification | null {
    if (notification.dedupKey) {
      const existing = this.getNotifications().find((n) => n.dedupKey === notification.dedupKey);
      if (existing) return null;
    }
    return this.addNotification(notification);
  }

  public deleteNotification(id: string): void {
    const notifs = this.getNotifications().filter((n) => n.id !== id);
    this.inMemoryCache.notifications = notifs;
    this.saveToLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public clearAllReadNotifications(): void {
    const notifs = this.getNotifications().filter((n) => !n.read);
    this.inMemoryCache.notifications = notifs;
    this.saveToLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markNotificationRead(id: string): void {
    const notifs = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.inMemoryCache.notifications = notifs;
    this.saveToLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markAllNotificationsRead(): void {
    const notifs = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.inMemoryCache.notifications = notifs;
    this.saveToLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // Reset to initial baseline demo data
  public resetToSeedData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.REPORTS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.HOTSPOTS);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.inMemoryCache = {
      reports: null,
      tasks: null,
      hotspots: null,
      users: null,
      notifications: null,
      currentUser: null,
    };
  }

  // Export JSON/CSV
  public exportDataAsJson(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      platform: 'EcoShield AI',
      reports: this.getReports(),
      tasks: this.getTasks(),
      hotspots: this.getHotspots(),
      users: this.getUsers(),
    };
    return JSON.stringify(data, null, 2);
  }

  public exportReportsAsCsv(): string {
    const reports = this.getReports();
    const headers = ['ID', 'Category', 'Title', 'Severity', 'Status', 'Latitude', 'Longitude', 'Address', 'Reporter', 'Created_At'];
    const rows = reports.map((r) => [
      r.id,
      r.category,
      `"${r.title.replace(/"/g, '""')}"`,
      r.severity,
      r.status,
      r.location.lat,
      r.location.lng,
      `"${(r.location.addressName || '').replace(/"/g, '""')}"`,
      r.isAnonymous ? 'Anonymous Citizen' : `"${r.reporterName}"`,
      r.createdAt,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

export const storageService = new StorageService();
