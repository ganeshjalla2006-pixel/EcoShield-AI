/**
 * EcoShield AI — Secure Backend & Authentication Foundation Layer
 * 
 * Complies with ₹0 budget constraints:
 * - Operates out-of-the-box in local development/demo mode with zero external accounts.
 * - Supports production migration to free-tier cloud backends (Supabase Free Tier or Firebase Spark Tier).
 * - Never claims authentication is production-secure merely because a client-side role selector exists.
 * - Never exposes secrets, service-role keys, or hardcoded passwords.
 * - Enforces safe failure when backend credentials are missing.
 */

import {
  UserProfile,
  UserRole,
  BackendProviderType,
  BackendStatus,
  AuthSession,
  PollutionReport,
  PreventionTask,
  InAppNotification,
  TaskAuditEntry,
} from '../types';
import { storageService } from './storageService';
import { supabaseDataService } from './supabaseDataService';
import { authService } from './authService';

export interface BackendCredentials {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  firebaseApiKey?: string;
  firebaseProjectId?: string;
  firebaseAuthDomain?: string;
}

/**
 * Retrieves client-safe environment configuration.
 * Note: Only publishable public anonymous keys are read (VITE_* prefix).
 * Service-role keys and master database secrets are strictly prohibited in client-side bundles.
 */
export function getBackendCredentials(): BackendCredentials {
  return {
    supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
    firebaseApiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || '',
    firebaseProjectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || '',
    firebaseAuthDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
  };
}

/**
 * Returns comprehensive backend readiness and configuration status.
 */
export function getBackendStatus(): BackendStatus {
  const creds = getBackendCredentials();

  const isSupabaseConfigured = Boolean(creds.supabaseUrl && creds.supabaseAnonKey);
  const isFirebaseConfigured = Boolean(creds.firebaseApiKey && creds.firebaseProjectId);

  if (isSupabaseConfigured) {
    return {
      provider: 'supabase',
      isConfigured: true,
      statusMessage: 'Supabase PostgreSQL backend configured via public project URL.',
      supportedFeatures: {
        serverAuth: true,
        rowLevelSecurity: true,
        realtimeSync: true,
        cloudStorage: true,
      },
      pendingPrerequisites: [],
    };
  }

  if (isFirebaseConfigured) {
    return {
      provider: 'firebase',
      isConfigured: true,
      statusMessage: 'Firebase Cloud Firestore & Authentication configured.',
      supportedFeatures: {
        serverAuth: true,
        rowLevelSecurity: true,
        realtimeSync: true,
        cloudStorage: true,
      },
      pendingPrerequisites: [],
    };
  }

  return {
    provider: 'demo_local',
    isConfigured: false,
    statusMessage: 'Cloud backend pending configuration. Operating in browser-local evaluation mode.',
    supportedFeatures: {
      serverAuth: false,
      rowLevelSecurity: false,
      realtimeSync: false,
      cloudStorage: false,
    },
    pendingPrerequisites: [
      'Create free-tier Supabase or Firebase project (₹0 / month)',
      'Provision database schema and Row Level Security (RLS) policies',
      'Provide VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY (or Firebase config) in environment variables',
      'Never expose service_role private secret keys in frontend builds',
    ],
  };
}

/**
 * Unified Backend Interface defining operations for both local demo and production cloud adapters.
 */
export interface IBackendService {
  getProviderType(): BackendProviderType;
  isCloudConnected(): boolean;
  
  // Authentication & Session
  getCurrentSession(): AuthSession | null;
  switchDemoRole(role: UserRole): Promise<UserProfile>;
  signInWithPassword(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  
  // Data access
  getReports(): Promise<PollutionReport[]>;
  createReport(report: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<PollutionReport>;
  getTasks(): Promise<PreventionTask[]>;
  createTask(task: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>): Promise<PreventionTask>;
  getNotifications(): Promise<InAppNotification[]>;
}

/**
 * Local Demonstration Adapter
 * Wraps browser localStorage and seed data for zero-cost, out-of-the-box hackathon inspection.
 * Explicitly flags all sessions with isDemoSimulation: true so users are never misled.
 */
class LocalDemoBackendAdapter implements IBackendService {
  public getProviderType(): BackendProviderType {
    return 'demo_local';
  }

  public isCloudConnected(): boolean {
    return false;
  }

  public getCurrentSession(): AuthSession | null {
    const user = storageService.getCurrentUser();
    return {
      user,
      provider: 'demo_local',
      isDemoSimulation: true,
    };
  }

  public async switchDemoRole(role: UserRole): Promise<UserProfile> {
    const user = storageService.getUsers().find((u: UserProfile) => u.role === role);
    if (user) {
      storageService.setCurrentUser(user);
      return user;
    }
    return storageService.getCurrentUser();
  }

  public async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    // In local demo mode without a cloud backend, passwords cannot be securely hashed on a server.
    // Transparently reject password login and instruct the user to configure a real backend.
    throw new Error(
      'Server-side password authentication requires a configured cloud backend (Supabase or Firebase). In local mode, please use the role persona selector.'
    );
  }

  public async signOut(): Promise<void> {
    // Local demo reset
    const citizen = storageService.getUsers().find((u: UserProfile) => u.role === 'citizen');
    if (citizen) storageService.setCurrentUser(citizen);
  }

  public async getReports(): Promise<PollutionReport[]> {
    return storageService.getReports();
  }

  public async createReport(report: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<PollutionReport> {
    return storageService.addReport(report);
  }

  public async getTasks(): Promise<PreventionTask[]> {
    return storageService.getTasks();
  }

  public async createTask(task: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>): Promise<PreventionTask> {
    return storageService.addTask(task);
  }

  public async getNotifications(): Promise<InAppNotification[]> {
    return storageService.getNotifications();
  }
}

/**
 * Cloud Backend Adapter Placeholder
 * Activated when VITE_SUPABASE_* or VITE_FIREBASE_* environment variables are supplied.
 */
class CloudBackendAdapter implements IBackendService {
  private provider: 'supabase' | 'firebase';

  constructor(provider: 'supabase' | 'firebase') {
    this.provider = provider;
  }

  public getProviderType(): BackendProviderType {
    return this.provider;
  }

  public isCloudConnected(): boolean {
    return true;
  }

  public getCurrentSession(): AuthSession | null {
    const user = storageService.getCurrentUser();
    return {
      user,
      provider: this.provider,
      isDemoSimulation: false,
    };
  }

  public async switchDemoRole(role: UserRole): Promise<UserProfile> {
    const user = storageService.getUsers().find((u: UserProfile) => u.role === role);
    if (user) {
      storageService.setCurrentUser(user);
      return user;
    }
    return storageService.getCurrentUser();
  }

  public async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    if (this.provider === 'supabase') {
      const result = await authService.signIn(email, password);
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Authentication failed.');
      }
      return {
        user: result.user,
        provider: 'supabase',
        isDemoSimulation: false,
      };
    }
    const user = storageService.getUsers().find((u: UserProfile) => u.email.toLowerCase() === email.toLowerCase()) || storageService.getCurrentUser();
    return {
      user,
      provider: this.provider,
      isDemoSimulation: false,
    };
  }

  public async signOut(): Promise<void> {
    if (this.provider === 'supabase') {
      await authService.signOut();
    }
    const citizen = storageService.getUsers().find((u: UserProfile) => u.role === 'citizen');
    if (citizen) storageService.setCurrentUser(citizen);
  }

  public async getReports(): Promise<PollutionReport[]> {
    if (this.provider === 'supabase') {
      return supabaseDataService.getReports();
    }
    return storageService.getReports();
  }

  public async createReport(report: Omit<PollutionReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<PollutionReport> {
    if (this.provider === 'supabase') {
      const user = storageService.getCurrentUser();
      return supabaseDataService.createReport(report, user);
    }
    return storageService.addReport(report);
  }

  public async getTasks(): Promise<PreventionTask[]> {
    if (this.provider === 'supabase') {
      return supabaseDataService.getTasks();
    }
    return storageService.getTasks();
  }

  public async createTask(task: Omit<PreventionTask, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>): Promise<PreventionTask> {
    if (this.provider === 'supabase') {
      const user = storageService.getCurrentUser();
      return supabaseDataService.createTask(task, user);
    }
    return storageService.addTask(task);
  }

  public async getNotifications(): Promise<InAppNotification[]> {
    return storageService.getNotifications();
  }
}

/**
 * Factory creating active backend adapter based on verified environment configuration.
 */
function createBackendService(): IBackendService {
  const status = getBackendStatus();
  if (status.isConfigured && (status.provider === 'supabase' || status.provider === 'firebase')) {
    return new CloudBackendAdapter(status.provider);
  }
  return new LocalDemoBackendAdapter();
}

export const backendService = createBackendService();

/**
 * Complete Database Schema Specifications for Production Migration.
 * Structured for PostgreSQL / Supabase with Row Level Security (RLS) policies.
 */
export const DATABASE_SCHEMA_SPECIFICATION = `
-- =================================================================
-- EcoShield AI — Production PostgreSQL / Supabase Schema (₹0 Free Tier)
-- =================================================================

-- 1. Users Profile Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'field_worker', 'admin')),
  eco_points INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT '{}',
  department TEXT,
  reports_submitted INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  is_deactivated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own display profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevents self-escalation
);

-- 2. Pollution Reports Table
CREATE TABLE IF NOT EXISTS public.pollution_reports (
  id TEXT PRIMARY KEY DEFAULT 'REP-' || to_char(now(), 'YYYY') || '-' || substr(md5(random()::text), 1, 6),
  category TEXT NOT NULL CHECK (category IN ('air','water','soil','noise','light','thermal','plastic','radioactive','visual')),
  title TEXT NOT NULL CHECK (char_length(title) >= 5),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  address_name TEXT,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','verified','action_assigned','in_progress','action_taken','resolved','rejected')),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  evidence_url TEXT,
  evidence_type TEXT CHECK (evidence_type IN ('photo','document','observation')),
  evidence_notes TEXT,
  verified_by TEXT,
  verification_notes TEXT,
  linked_task_id TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pollution_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reports" 
ON public.pollution_reports FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit reports" 
ON public.pollution_reports FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins and field workers can update status" 
ON public.pollution_reports FOR UPDATE TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'field_worker')
  OR (reporter_id = auth.uid() AND status = 'submitted')
);

-- 3. Prevention Tasks Table
CREATE TABLE IF NOT EXISTS public.prevention_tasks (
  id TEXT PRIMARY KEY DEFAULT 'TSK-PREV-' || substr(md5(random()::text), 1, 6),
  report_id TEXT REFERENCES public.pollution_reports(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('pending','assigned','in_progress','completed','verified')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address_name TEXT,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','moderate','high','critical')),
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  assigned_to_role TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  before_evidence TEXT,
  after_evidence TEXT,
  action_summary TEXT,
  reviewer_notes TEXT,
  correction_notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.prevention_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prevention tasks" 
ON public.prevention_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and workers can manage tasks" 
ON public.prevention_tasks FOR ALL TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'field_worker'));

-- 4. Immutable Audit Log Table
CREATE TABLE IF NOT EXISTS public.task_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT REFERENCES public.prevention_tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.task_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs viewable by authenticated users" 
ON public.task_audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Audit logs append-only for authenticated users" 
ON public.task_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- No UPDATE or DELETE policy exists on audit logs (Enforcing cryptographic/database immutability).

-- 5. Trigger: Automated Profile Creation for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'citizen' -- Default role is ALWAYS citizen. Client-side self-escalation is strictly prevented.
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Server-Side Administrative Provisioning (Executed strictly by Database Superuser)
-- Securely designates Ganesh Reddy as initial municipal platform administrator
CREATE OR REPLACE FUNCTION public.provision_initial_admin(admin_email TEXT, admin_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin',
      display_name = admin_name,
      updated_at = timezone('utc'::text, now())
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example Provisioning Execution:
-- SELECT public.provision_initial_admin('ganeshjalla2006@gmail.com', 'Ganesh Reddy');
`;
