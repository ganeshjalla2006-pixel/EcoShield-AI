/**
 * EcoShield AI — Real Authentication Service
 * 
 * Provides real email/password authentication, session persistence,
 * password recovery, and secure role authorization via Supabase Auth & PostgreSQL.
 * 
 * Security Guardrails:
 * 1. Zero hardcoded passwords.
 * 2. Role is never trusted from client-side input.
 * 3. Client cannot self-promote to 'admin'.
 * 4. Display name "Ganesh Reddy" is only displayed for the provisioned admin account.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile, UserRole } from '../types';

export const ADMIN_EMAIL = 'ganeshjalla2006@gmail.com';
export const ADMIN_DISPLAY_NAME = 'Ganesh Reddy';

export interface AuthStateResult {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isEmailVerified: boolean;
  provider: 'supabase' | 'demo_local';
  error?: string;
}

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  isEmailUnverified?: boolean;
}

export interface SignUpResult {
  success: boolean;
  message: string;
  requiresEmailConfirmation: boolean;
  error?: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

class AuthService {
  /**
   * Signs in with email and password using Supabase Auth.
   * Throws an error if Supabase credentials are missing or credentials are invalid.
   */
  public async signIn(email: string, password: string): Promise<LoginResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Authentication Setup Required: Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return {
        success: false,
        error: 'Please provide both email address and password.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error: 'Email address has not been verified yet. Please check your inbox for the confirmation link.',
            isEmailUnverified: true,
          };
        }
        return {
          success: false,
          error: error.message || 'Invalid email or password. Please verify your credentials.',
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user returned by authentication provider.',
        };
      }

      const isVerified = Boolean(data.user.email_confirmed_at);
      const userProfile = await this.fetchUserProfile(data.user.id, data.user.email || trimmedEmail, data.user.user_metadata);

      return {
        success: true,
        user: userProfile,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected network error occurred during sign-in. Please try again.',
      };
    }
  }

  /**
   * Signs up a new user.
   * New users are ALWAYS given the 'citizen' role by default.
   * Admin roles can only be granted by database administrators through backend SQL.
   */
  public async signUp(email: string, password: string, displayName: string): Promise<SignUpResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: '',
        requiresEmailConfirmation: false,
        error: 'Authentication Setup Required: Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (!trimmedEmail || !password) {
      return {
        success: false,
        message: '',
        requiresEmailConfirmation: false,
        error: 'Please provide a valid email and password.',
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        message: '',
        requiresEmailConfirmation: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            display_name: cleanDisplayName || trimmedEmail.split('@')[0],
            // Note: Even if someone attempts to pass role: 'admin' here, the database trigger
            // overrides it to 'citizen'. Role escalation on signup is strictly prohibited.
          },
        },
      });

      if (error) {
        return {
          success: false,
          message: '',
          requiresEmailConfirmation: false,
          error: error.message,
        };
      }

      const requiresConfirmation = !data.session;
      return {
        success: true,
        requiresEmailConfirmation: requiresConfirmation,
        message: requiresConfirmation
          ? `Account created! A verification link has been sent to ${trimmedEmail}. Please verify before signing in.`
          : 'Account created and authenticated successfully.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        requiresEmailConfirmation: false,
        error: err.message || 'Network error during registration.',
      };
    }
  }

  /**
   * Triggers a password reset email using Supabase Auth.
   */
  public async resetPassword(email: string): Promise<PasswordResetResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: '',
        error: 'Authentication Setup Required: Supabase is not configured.',
      };
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return {
        success: false,
        message: '',
        error: 'Please provide the email address associated with your account.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });

      if (error) {
        return {
          success: false,
          message: '',
          error: error.message,
        };
      }

      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${trimmedEmail}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error: err.message || 'Unable to send password reset request.',
      };
    }
  }

  /**
   * Signs out the current Supabase session.
   */
  public async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  }

  /**
   * Restores active Supabase session on app refresh.
   */
  public async restoreSession(): Promise<AuthStateResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        isAuthenticated: false,
        user: null,
        isEmailVerified: false,
        provider: 'demo_local',
      };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session || !session.user) {
        return {
          isAuthenticated: false,
          user: null,
          isEmailVerified: false,
          provider: 'supabase',
        };
      }

      const user = session.user;
      const isVerified = Boolean(user.email_confirmed_at);
      const profile = await this.fetchUserProfile(user.id, user.email || '', user.user_metadata);

      return {
        isAuthenticated: true,
        user: profile,
        isEmailVerified: isVerified,
        provider: 'supabase',
      };
    } catch (err: any) {
      return {
        isAuthenticated: false,
        user: null,
        isEmailVerified: false,
        provider: 'supabase',
        error: err.message,
      };
    }
  }

  /**
   * Safely updates the user's display name.
   * Role changes are strictly prohibited here to prevent self-escalation.
   */
  public async updateDisplayName(userId: string, newDisplayName: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    const trimmed = newDisplayName.trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters.' };
    }

    try {
      // 1. Update Supabase auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      });
      if (authError) throw authError;

      // 2. Update public.profiles table if it exists
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', userId);

      // If profiles table update fails because table is not yet created, the auth metadata still holds the name
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile.' };
    }
  }

  /**
   * Fetches user profile from PostgreSQL public.profiles table or falls back to secure auth metadata.
   * Enforces that the provisioned admin email (ganeshjalla2006@gmail.com) is attributed to Ganesh Reddy.
   */
  private async fetchUserProfile(userId: string, email: string, metadata: any): Promise<UserProfile> {
    const isProvisionedAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // Try fetching from database public.profiles
    if (supabase) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profile && !error) {
          // If the database has confirmed the role:
          const finalRole: UserRole = (profile.role === 'admin' || profile.role === 'field_worker') ? profile.role : 'citizen';
          const finalDisplayName = (isProvisionedAdminEmail && finalRole === 'admin')
            ? (profile.display_name || ADMIN_DISPLAY_NAME)
            : (profile.display_name || metadata?.display_name || email.split('@')[0]);

          return {
            id: profile.id,
            email: profile.email || email,
            displayName: finalDisplayName,
            role: finalRole,
            ecoPoints: profile.eco_points || 0,
            badges: profile.badges || ['Eco Contributor'],
            reportsSubmitted: profile.reports_submitted || 0,
            tasksCompleted: profile.tasks_completed || 0,
            department: profile.department,
          };
        }
      } catch {
        // Table may not yet be provisioned or RLS may block, proceed to secure fallback
      }
    }

    // Secure fallback: If metadata or DB isn't available yet, assign role
    // NOTE: Only if database profile confirmed admin is role set to admin.
    // If profiles table doesn't exist yet, default is 'citizen' unless metadata has trusted claims.
    let role: UserRole = 'citizen';
    let displayName = metadata?.display_name || email.split('@')[0];

    if (isProvisionedAdminEmail && metadata?.role === 'admin') {
      role = 'admin';
      displayName = ADMIN_DISPLAY_NAME;
    }

    return {
      id: userId,
      email,
      displayName,
      role,
      ecoPoints: 50,
      badges: isProvisionedAdminEmail ? ['Municipal Admin', 'EcoShield Authority'] : ['Eco Pioneer'],
      reportsSubmitted: 0,
      tasksCompleted: 0,
    };
  }
}

export const authService = new AuthService();
