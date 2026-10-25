import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { authService, ADMIN_EMAIL, ADMIN_DISPLAY_NAME, LoginResult, SignUpResult, PasswordResetResult } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

export type AuthMode = 'cloud_authenticated' | 'demo_mode';

interface AuthContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  authMode: AuthMode;
  isSupabaseConfigured: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isAdmin: boolean;
  isFieldWorker: boolean;
  isCitizen: boolean;
  
  // Real Cloud Authentication Methods
  signInWithPassword: (email: string, password: string) => Promise<LoginResult>;
  signUpWithPassword: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  sendPasswordReset: (email: string) => Promise<PasswordResetResult>;
  signOutCloud: () => Promise<void>;
  updateDisplayName: (newName: string) => Promise<{ success: boolean; error?: string }>;
  
  // Demo Mode & Legacy Compatibility
  switchRole: (role: UserRole) => void;
  enterDemoMode: (role?: UserRole) => void;
  login: (email: string, role?: UserRole) => boolean;
  register: (name: string, email: string, role: UserRole) => UserProfile;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('demo_mode');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => storageService.getCurrentUser());
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => storageService.getUsers());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);

  const isAdmin = currentUser.role === 'admin';
  const isFieldWorker = currentUser.role === 'field_worker';
  const isCitizen = currentUser.role === 'citizen';

  // Attempt to restore real cloud session on initial mount
  useEffect(() => {
    let isMounted = true;

    async function checkCloudSession() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const sessionState = await authService.restoreSession();
        if (isMounted && sessionState.isAuthenticated && sessionState.user) {
          setCurrentUser(sessionState.user);
          setAuthMode('cloud_authenticated');
          setIsAuthenticated(true);
          setIsEmailVerified(sessionState.isEmailVerified);
        }
      } catch (err) {
        console.warn('Failed to restore cloud authentication session:', err);
      }
    }

    checkCloudSession();

    // Listen to Supabase Auth State changes if client is available
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await authService.restoreSession();
          if (profile.user) {
            setCurrentUser(profile.user);
            setAuthMode('cloud_authenticated');
            setIsAuthenticated(true);
            setIsEmailVerified(profile.isEmailVerified);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setIsEmailVerified(false);
          // Return safely to demo mode
          const defaultCitizen = storageService.getUsers().find((u) => u.role === 'citizen') || storageService.getUsers()[0];
          setCurrentUser(defaultCitizen);
          setAuthMode('demo_mode');
        }
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUser = () => {
    if (authMode === 'demo_mode') {
      const updated = storageService.getCurrentUser();
      setCurrentUser(updated);
      setAllUsers(storageService.getUsers());
    }
  };

  /**
   * Real sign-in with email and password via Supabase Auth
   */
  const signInWithPassword = async (email: string, password: string): Promise<LoginResult> => {
    const result = await authService.signIn(email, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setAuthMode('cloud_authenticated');
      setIsAuthenticated(true);
      setIsEmailVerified(!result.isEmailUnverified);
    }
    return result;
  };

  /**
   * Real sign-up via Supabase Auth
   */
  const signUpWithPassword = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<SignUpResult> => {
    return authService.signUp(email, password, displayName);
  };

  /**
   * Trigger real password reset
   */
  const sendPasswordReset = async (email: string): Promise<PasswordResetResult> => {
    return authService.resetPassword(email);
  };

  /**
   * Real cloud sign-out
   */
  const signOutCloud = async () => {
    await authService.signOut();
    setIsAuthenticated(false);
    setIsEmailVerified(false);
    setAuthMode('demo_mode');
    const citizen = storageService.getUsers().find((u) => u.role === 'citizen') || storageService.getUsers()[0];
    storageService.setCurrentUser(citizen);
    setCurrentUser(citizen);
  };

  /**
   * Update display name safely
   */
  const updateDisplayName = async (newName: string): Promise<{ success: boolean; error?: string }> => {
    if (authMode === 'cloud_authenticated' && isAuthenticated) {
      const res = await authService.updateDisplayName(currentUser.id, newName);
      if (res.success) {
        setCurrentUser((prev) => ({ ...prev, displayName: newName }));
      }
      return res;
    } else {
      // Demo mode display name update
      const updated = { ...currentUser, displayName: newName };
      storageService.setCurrentUser(updated);
      setCurrentUser(updated);
      refreshUser();
      return { success: true };
    }
  };

  /**
   * Enter or switch demo persona
   */
  const enterDemoMode = (targetRole: UserRole = 'admin') => {
    setAuthMode('demo_mode');
    setIsAuthenticated(false);
    setIsEmailVerified(false);
    const matched = storageService.getUsers().find((u) => u.role === targetRole);
    if (matched) {
      storageService.setCurrentUser(matched);
      setCurrentUser(matched);
    }
  };

  /**
   * Role Switcher (allowed in demo mode for hackathon judging; locked in cloud auth mode)
   */
  const switchRole = (newRole: UserRole) => {
    if (authMode === 'cloud_authenticated') {
      console.warn('Role switching is disabled for real cloud-authenticated accounts. Permissions are enforced by backend PostgreSQL RLS.');
      return;
    }

    const matched = storageService.getUsers().find((u) => u.role === newRole);
    if (matched) {
      storageService.setCurrentUser(matched);
      setCurrentUser(matched);
    } else {
      const updated: UserProfile = {
        ...currentUser,
        role: newRole,
      };
      storageService.setCurrentUser(updated);
      setCurrentUser(updated);
    }
    refreshUser();
  };

  /**
   * Legacy demo login (retained for backward compatibility and offline testing)
   */
  const login = (email: string, forcedRole?: UserRole): boolean => {
    const users = storageService.getUsers();
    let matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!matched && forcedRole) {
      matched = {
        id: `user_${Date.now().toString(36)}`,
        email,
        displayName: email.split('@')[0],
        role: forcedRole,
        ecoPoints: 50,
        badges: ['New Eco Member'],
        reportsSubmitted: 0,
        tasksCompleted: 0,
      };
      storageService.setCurrentUser(matched);
      setCurrentUser(matched);
      refreshUser();
      return true;
    }

    if (matched) {
      storageService.setCurrentUser(matched);
      setCurrentUser(matched);
      refreshUser();
      return true;
    }

    return false;
  };

  /**
   * Legacy demo register
   */
  const register = (name: string, email: string, role: UserRole): UserProfile => {
    const newUser: UserProfile = {
      id: `user_${Date.now().toString(36)}`,
      email,
      displayName: name,
      role,
      ecoPoints: 50,
      badges: ['EcoShield Pioneer'],
      reportsSubmitted: 0,
      tasksCompleted: 0,
    };

    storageService.setCurrentUser(newUser);
    setCurrentUser(newUser);
    refreshUser();
    return newUser;
  };

  /**
   * Legacy demo logout
   */
  const logout = () => {
    if (authMode === 'cloud_authenticated') {
      signOutCloud();
      return;
    }
    const citizen = storageService.getUsers().find((u) => u.role === 'citizen') || storageService.getUsers()[0];
    storageService.setCurrentUser(citizen);
    setCurrentUser(citizen);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        authMode,
        isSupabaseConfigured,
        isAuthenticated,
        isEmailVerified,
        isAdmin,
        isFieldWorker,
        isCitizen,
        signInWithPassword,
        signUpWithPassword,
        sendPasswordReset,
        signOutCloud,
        updateDisplayName,
        switchRole,
        enterDemoMode,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
