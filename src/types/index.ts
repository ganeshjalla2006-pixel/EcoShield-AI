export type PollutionCategory =
  | 'air'
  | 'water'
  | 'soil'
  | 'noise'
  | 'light'
  | 'thermal'
  | 'plastic'
  | 'radioactive'
  | 'visual';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'action_assigned'
  | 'in_progress'
  | 'action_taken'
  | 'resolved'
  | 'rejected';

export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'verified';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type UserRole = 'citizen' | 'field_worker' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  ecoPoints: number;
  badges: string[];
  department?: string;
  avatarUrl?: string;
  reportsSubmitted: number;
  tasksCompleted: number;
  isDeactivated?: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
  addressName?: string;
}

export interface PollutionReport {
  id: string;
  category: PollutionCategory;
  title: string;
  description: string;
  location: Coordinates;
  severity: 1 | 2 | 3 | 4 | 5; // 1: Minor, 5: Severe hazard
  evidenceUrl?: string;
  evidenceType?: 'photo' | 'document' | 'observation';
  evidenceNotes?: string;
  status: ReportStatus;
  reporterId: string;
  reporterName: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  verifiedBy?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  linkedTaskId?: string;
  verificationRewardGranted?: boolean;
  isDemo?: boolean;
  observedAt?: string;
}

export interface FactorBreakdown {
  categoryBaseline: number;    // Base weight for the specific category (0-25)
  reportedSeverity: number;    // Scaled from report severity 1-5 (0-30)
  weatherMultiplier: number;   // Environmental synergies (rain/wind/heat) (0-20)
  evidenceConfidence: number;  // Verified report, photos, or observer credentials (0-15)
  proximityAndHistory: number; // Historical frequency / recurring hotspot (0-10)
}

export interface RiskAssessment {
  id: string;
  reportId?: string;
  title?: string;
  category: PollutionCategory;
  coordinates: Coordinates;
  score: number; // 0 to 100
  level: RiskLevel;
  factorBreakdown: FactorBreakdown;
  explanations: string[];
  recommendedActions: string[];
  responsePriority: TaskPriority;
  suggestedTimeframe?: string;
  dataConfidence: 'low' | 'medium' | 'high';
  ruleSetVersion: string;
  weatherSnapshotUsed?: {
    temperature: number;
    rainMm: number;
    windKmh: number;
    summary: string;
  };
  assessedAt: string;
}

export interface TaskAuditEntry {
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
}

export interface PreventionTask {
  id: string;
  reportId?: string;
  title: string;
  description: string;
  category: PollutionCategory;
  priority: TaskPriority;
  status: TaskStatus;
  location: Coordinates;
  riskScore: number;
  riskLevel: RiskLevel;
  assignedTo?: {
    id: string;
    name: string;
    role: UserRole;
  };
  deadline: string;
  beforeEvidence?: string;
  afterEvidence?: string;
  actionSummary?: string;
  reviewerNotes?: string;
  correctionNotes?: string;
  isDemo?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationRewardGranted?: boolean;
  createdAt: string;
  updatedAt: string;
  auditTrail: TaskAuditEntry[];
}

export interface EnvironmentalHotspot {
  id: string;
  name: string;
  category: PollutionCategory;
  coordinates: Coordinates;
  currentRiskScore: number;
  currentRiskLevel: RiskLevel;
  activeReportsCount: number;
  description: string;
  lastInspectedAt: string;
  status: 'active_monitoring' | 'mitigation_active' | 'cleared';
  recommendedActions: string[];
}

export interface WeatherDailyForecast {
  dates: string[];
  minTemps?: number[];
  maxTemps: number[];
  precipSums: number[];
  precipProbs?: number[];
  windSpeeds?: number[];
  weatherCodes?: number[];
  weatherDescriptions?: string[];
}

export interface WeatherData {
  coordinates: Coordinates;
  temperature: number;
  apparentTemperature: number;
  precipitation: number; // mm
  rain: number;
  precipitationProbability: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  relativeHumidity: number; // %
  weatherCode: number;
  weatherDescription: string;
  hourly: {
    times: string[];
    temperatures: number[];
    precipitationProbs: number[];
    precipitations?: number[];
    windSpeeds: number[];
    weatherCodes?: number[];
  };
  daily: WeatherDailyForecast;
  timezone?: string;
  forecastPeriod?: string;
  fetchedAt: string;
  source: string;
  isStale?: boolean;
}

export type ObservationQualityStatus =
  | 'verified_model_analysis'
  | 'official_ground_station'
  | 'laboratory_assay'
  | 'unverified';

export interface VerifiedPollutionObservation {
  id: string;
  category: PollutionCategory;
  indicator: string;
  value: number;
  unit: string;
  provider: string;
  coordinates: Coordinates;
  observedAt: string;
  timezone?: string;
  qualityStatus: ObservationQualityStatus;
  attribution: string;
  indexBand?: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  notes?: string;
}

export interface CategoryDataSourceStatus {
  category: PollutionCategory;
  categoryName: string;
  isLiveTelemetryAvailable: boolean;
  providerName: string;
  coverage: string;
  telemetryType: string;
  statusMessage: string;
  accessPrerequisites: string;
}

export type BackendProviderType = 'demo_local' | 'supabase' | 'firebase';

export interface AuthSession {
  user: UserProfile;
  provider: BackendProviderType;
  token?: string;
  expiresAt?: string;
  isDemoSimulation: boolean;
}

export interface BackendStatus {
  provider: BackendProviderType;
  isConfigured: boolean;
  statusMessage: string;
  supportedFeatures: {
    serverAuth: boolean;
    rowLevelSecurity: boolean;
    realtimeSync: boolean;
    cloudStorage: boolean;
  };
  pendingPrerequisites: string[];
}

export interface InAppNotification {
  id: string;
  userId?: string; // target user or undefined for global broadcast
  userRole?: UserRole; // target role: 'admin' | 'field_worker' | 'citizen'
  title: string;
  message: string;
  type: 'alert' | 'task' | 'report' | 'system';
  severity?: 'low' | 'moderate' | 'high' | 'critical';
  riskScore?: number;
  category?: PollutionCategory;
  linkedEntityId?: string;
  linkedEntityType?: 'report' | 'task' | 'hotspot';
  read: boolean;
  link?: string;
  dedupKey?: string;
  createdAt: string;
}

export interface SimulationInputs {
  category: PollutionCategory;
  reportedSeverity: number; // 1-5
  rainfallAmountMm: number;
  drainageCleared: boolean;
  wasteAccumulationLevel: number; // 1-5
  windSpeedKmh: number;
  temperatureC: number;
  daysSinceLastInspection: number;
}

export interface SimulationResult {
  baselineRiskScore: number;
  baselineRiskLevel: RiskLevel;
  simulatedRiskScore: number;
  simulatedRiskLevel: RiskLevel;
  scoreDelta: number;
  activeModifiers: string[];
  mitigatingFactors: string[];
  worseningFactors: string[];
  limitations: string;
}
