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
    id: 'user_admin_01',
    email: 'director@ecoshield.org',
    displayName: 'Dr. Sarah Mukherjee (Admin)',
    role: 'admin',
    department: 'Municipal Environmental Protection Board',
    ecoPoints: 450,
    badges: ['System Architect', 'Environmental Director', 'Rapid Responder'],
    reportsSubmitted: 6,
    tasksCompleted: 14,
  },
  {
    id: 'user_worker_01',
    email: 'field.rajesh@ecoshield.org',
    displayName: 'Rajesh Kumar (Field Officer)',
    role: 'field_worker',
    department: 'Urban Drainage & Hazardous Waste Rapid Response',
    ecoPoints: 320,
    badges: ['Rapid Responder', 'Water Guardian', 'Clean River Hero'],
    reportsSubmitted: 11,
    tasksCompleted: 23,
  },
  {
    id: 'user_citizen_01',
    email: 'ananya.sharma@community.eco',
    displayName: 'Ananya Sharma (Citizen)',
    role: 'citizen',
    ecoPoints: 180,
    badges: ['Community Watchdog', 'Eagle Eye Scout'],
    reportsSubmitted: 5,
    tasksCompleted: 2,
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
      this.inMemoryCache.reports = this.getFromLocal(STORAGE_KEYS.REPORTS, SEED_REPORTS);
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
      this.inMemoryCache.tasks = this.getFromLocal(STORAGE_KEYS.TASKS, SEED_TASKS);
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
      this.inMemoryCache.hotspots = this.getFromLocal(STORAGE_KEYS.HOTSPOTS, SEED_HOTSPOTS);
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
      this.inMemoryCache.notifications = this.getFromLocal(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
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
