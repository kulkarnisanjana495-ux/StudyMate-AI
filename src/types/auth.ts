import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import type { Profile } from './profile';

export type User = SupabaseUser;
export type Session = SupabaseSession;

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
}

export type AuthProvider = 'google' | 'github';
