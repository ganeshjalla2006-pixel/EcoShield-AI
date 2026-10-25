/**
 * EcoShield AI — Secure Authentication Login Page
 * 
 * Provides:
 * - Real Email & Password Sign In
 * - Password Show / Hide toggle
 * - Forgot Password recovery workflow
 * - Registration / Sign Up workflow
 * - Clear error states: Invalid credentials, unverified email, network errors, missing backend config
 * - Zero storage of raw passwords in browser storage
 * - Accessible labels, keyboard focus, and responsive mobile/desktop layouts
 */

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Database,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_EMAIL, ADMIN_DISPLAY_NAME } from '../../services/authService';

interface LoginPageProps {
  onBackToLanding: () => void;
  onSuccess: () => void;
  onEnterDemo: () => void;
}

type AuthTab = 'signin' | 'signup' | 'forgot';

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToLanding,
  onSuccess,
  onEnterDemo,
}) => {
  const {
    isSupabaseConfigured,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Clear messages on tab change
  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Authentication Setup Required: Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured. Click "Backend Setup Guide" to configure or switch to Demo Mode.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPassword(cleanEmail, password);
      // Immediately clear password from local component state
      setPassword('');

      if (result.success) {
        onSuccess();
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setPassword('');
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Authentication Setup Required: Cloud backend is not connected. Please see Backend Setup Guide.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpWithPassword(cleanEmail, password, displayName);
      setPassword('');

      if (result.success) {
        setSuccessMessage(result.message);
        if (!result.requiresEmailConfirmation) {
          onSuccess();
        }
      } else {
        setErrorMessage(result.error || 'Registration failed.');
      }
    } catch (err: any) {
      setPassword('');
      setErrorMessage(err.message || 'Registration failed due to a network error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please provide a valid email address to send password reset instructions.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Authentication Setup Required: Password recovery requires an active Supabase project configuration.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordReset(cleanEmail);
      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setErrorMessage(result.error || 'Unable to send password reset email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error requesting password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b08] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Bar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-emerald-950/60 bg-[#08120c]/80 backdrop-blur-md">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">EcoShield AI</span>
        </div>

        <button
          onClick={onEnterDemo}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Demo Mode</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#0a150e] border border-emerald-950/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle green ambient glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Title */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest-900 border border-emerald-500/30 text-emerald-400 mb-2 shadow-sm">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {activeTab === 'signin' && 'Sign In to EcoShield AI'}
              {activeTab === 'signup' && 'Create Contributor Account'}
              {activeTab === 'forgot' && 'Reset Your Password'}
            </h2>
            <p className="text-xs text-slate-400">
              {activeTab === 'signin' && 'Secure access for municipal admins, field officers & citizens'}
              {activeTab === 'signup' && 'Register to submit verified reports and track community EcoPoints'}
              {activeTab === 'forgot' && 'Receive secure password recovery instructions via email'}
            </p>
          </div>

          {/* Backend Status Notice */}
          {!isSupabaseConfigured ? (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-300">Authentication Setup Required</div>
                  <div className="text-[11px] text-amber-200/90 leading-relaxed">
                    Cloud credentials (<code className="font-mono bg-black/30 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code>) are not configured. To enable real server authentication and admin access, connect a free Supabase project.
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                >
                  <Database className="w-3 h-3" />
                  <span>Setup Guide & SQL Script</span>
                </button>
                <button
                  type="button"
                  onClick={onEnterDemo}
                  className="text-slate-300 hover:text-white font-medium"
                >
                  Skip to Demo Persona &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase PostgreSQL Backend Active
              </span>
              <span className="font-mono text-slate-400">RLS Enforced</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-emerald-950/60 mb-5">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`flex-1 pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === 'signin'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`flex-1 pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === 'signup'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('forgot')}
              className={`flex-1 pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === 'forgot'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Forgot Password
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form: Sign In */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="e.g. ganeshjalla2006@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('forgot')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Admin Provisioning Hint */}
              <div className="p-2.5 rounded-xl bg-[#08120c] border border-emerald-950/60 text-[11px] text-slate-400 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-medium">Designated Municipal Admin:</span>{' '}
                  <span className="text-emerald-400 font-mono text-[10px]">{ADMIN_EMAIL}</span>
                </div>
                <span className="text-[10px] text-slate-400">Ganesh Reddy</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In Securely</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form: Create Account */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Full Contributor Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  placeholder="e.g. John Doe or Ganesh Reddy"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="e.g. ganeshjalla2006@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Set Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Public registrations are assigned the <strong>Citizen</strong> role. Admin privileges can only be granted via backend database migration.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register New Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form: Forgot Password */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="Enter registered email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  We will send a cryptographically signed password reset link from Supabase Auth.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Alternative Demo Mode Card */}
          <div className="mt-6 pt-5 border-t border-emerald-950/60 text-center">
            <div className="text-xs text-slate-400 mb-2">Want to evaluate without setting up cloud accounts?</div>
            <button
              type="button"
              onClick={onEnterDemo}
              className="w-full py-2 px-3 rounded-xl bg-[#0c1811] hover:bg-[#12261b] text-slate-300 hover:text-white border border-emerald-950/80 text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Explore Platform in Demo Persona Mode (₹0)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-emerald-950/40">
        EcoShield AI &bull; Enterprise PostgreSQL Row Level Security (RLS) &bull; Zero Hardcoded Secrets
      </footer>

      {/* Backend & Admin Provisioning Guide Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b140f] border border-emerald-900/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950/80 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Supabase Free-Tier & Admin Provisioning Guide</span>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                EcoShield AI uses real Supabase Auth + PostgreSQL with Row Level Security (RLS). Follow these 3 steps to connect a live cloud database at ₹0:
              </p>

              <div className="p-3 rounded-xl bg-[#08120c] border border-emerald-950/60 space-y-2">
                <div className="font-bold text-emerald-400">Step 1: Create a Free Project</div>
                <div className="text-slate-400 text-[11px]">
                  Sign up at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com</a> and create a new project.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#08120c] border border-emerald-950/60 space-y-2">
                <div className="font-bold text-emerald-400">Step 2: Add Public Credentials to .env</div>
                <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-300 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
                </pre>
                <div className="text-[10px] text-amber-300">
                  ⚠️ Never expose the secret <code className="font-mono">service_role</code> key in the frontend. Only use the public anon key.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#08120c] border border-emerald-950/60 space-y-2">
                <div className="font-bold text-emerald-400">Step 3: Secure Server-Side Admin Provisioning</div>
                <p className="text-[11px] text-slate-300">
                  Run this SQL snippet in the Supabase SQL Editor to securely configure <code className="font-mono text-emerald-300">{ADMIN_EMAIL}</code> as Admin with display name <code className="font-mono text-emerald-300">{ADMIN_DISPLAY_NAME}</code>:
                </p>
                <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-slate-200 overflow-x-auto">
{`-- 1. Ensure user registers with email: ganeshjalla2006@gmail.com
-- 2. Execute as Database Administrator / Superuser:
UPDATE public.profiles
SET role = 'admin',
    display_name = 'Ganesh Reddy'
WHERE email = 'ganeshjalla2006@gmail.com';`}
                </pre>
                <div className="text-[10px] text-slate-400">
                  This ensures that administrative authorization is issued strictly by trusted server-side execution, not by client-side manipulation.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-emerald-950/60">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
