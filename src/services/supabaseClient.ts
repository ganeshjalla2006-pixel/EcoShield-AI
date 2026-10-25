/**
 * EcoShield AI — Supabase Client & Connection Layer
 * 
 * Provides real authentication and PostgreSQL connection when configured.
 * Strictly adheres to ₹0 budget constraints (Free Tier compatible).
 * 
 * Security Guardrails:
 * - Only publishable public anonymous keys (VITE_SUPABASE_ANON_KEY) are consumed.
 * - Service-role private keys must NEVER be placed in client-side bundles.
 * - Safely handles missing credentials with zero crashes or fake claims.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  statusMessage: string;
}

/**
 * Validates and retrieves Supabase configuration from environment variables.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

  // Basic format validation
  const isValidUrl = Boolean(url && (url.startsWith('https://') || url.startsWith('http://localhost')));
  const isValidKey = Boolean(anonKey && anonKey.length > 20);

  const isConfigured = isValidUrl && isValidKey;

  let statusMessage = 'Supabase credentials not configured. Operating in local demo evaluation mode.';
  if (isConfigured) {
    statusMessage = `Connected to Supabase project at ${url.replace(/(https?:\/\/)([^.]+).*/, '$1$2.supabase.co')}`;
  } else if (url && !isValidKey) {
    statusMessage = 'VITE_SUPABASE_URL provided but VITE_SUPABASE_ANON_KEY is missing or invalid.';
  } else if (!url && anonKey) {
    statusMessage = 'VITE_SUPABASE_ANON_KEY provided but VITE_SUPABASE_URL is missing.';
  }

  return {
    url,
    anonKey,
    isConfigured,
    statusMessage,
  };
}

const config = getSupabaseConfig();

/**
 * Singleton Supabase Client instance.
 * Returns null if valid credentials are not configured in environment variables.
 */
export const supabase: SupabaseClient | null = config.isConfigured
  ? createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ecoshield-supabase-auth-token',
      },
    })
  : null;

export const isSupabaseConfigured = config.isConfigured;
