import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

export const SUPABASE_URL: string =
  (env as Record<string, string | undefined>).VITE_SUPABASE_URL || 'https://zsbtxwiumftuknheynrh.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (env as Record<string, string | undefined>).VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

// Single browser Supabase client instance across the application lifecycle
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function isSupabaseConfigured(): boolean {
  return true;
}

export function subscribeToConfigChanges(_listener: (configured: boolean) => void): () => void {
  return () => {};
}
