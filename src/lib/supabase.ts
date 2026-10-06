import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://zsbtxwiumftuknheynrh.supabase.co';

const ENV_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_KEY_STORAGE = 'studymate_supabase_anon_key';

// Helper to get active anon key (prioritizing env, falling back to session-saved dev key)
function getActiveAnonKey(): string {
  if (ENV_ANON_KEY && ENV_ANON_KEY.trim() !== '') {
    return ENV_ANON_KEY.trim();
  }
  if (typeof window !== 'undefined') {
    const stored = window.sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (stored && stored.trim() !== '') {
      return stored.trim();
    }
  }
  return '';
}

let activeAnonKey = getActiveAnonKey();

export function isSupabaseConfigured(): boolean {
  return Boolean(activeAnonKey && activeAnonKey.length > 10 && activeAnonKey !== 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY');
}

// Fallback anon key allows client creation without unhandled init errors if env is still blank
const dummyKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export let supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  activeAnonKey || dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

// Listeners for key updates
type KeyChangeListener = (configured: boolean) => void;
const keyListeners: Set<KeyChangeListener> = new Set();

export function subscribeToConfigChanges(listener: KeyChangeListener): () => void {
  keyListeners.add(listener);
  return () => keyListeners.delete(listener);
}

export function setCustomAnonKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;

  activeAnonKey = trimmed;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_KEY_STORAGE, trimmed);
  }

  supabase = createClient(SUPABASE_URL, trimmed, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  const configured = isSupabaseConfigured();
  keyListeners.forEach((listener) => listener(configured));
  return true;
}

export function clearCustomAnonKey(): void {
  activeAnonKey = ENV_ANON_KEY;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_KEY_STORAGE);
  }
  supabase = createClient(SUPABASE_URL, activeAnonKey || dummyKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  keyListeners.forEach((listener) => listener(isSupabaseConfigured()));
}
