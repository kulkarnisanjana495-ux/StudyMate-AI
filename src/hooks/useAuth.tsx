import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  subscribeToConfigChanges,
} from '../lib/supabase';
import { fetchProfile } from '../services/profile/profileService';
import type { User, Session, AuthState } from '../types/auth';
import type { Profile } from '../types/profile';

interface AuthContextType extends AuthState {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  passwordRecoveryActive: boolean;
  clearPasswordRecoveryFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured());
  const [error, setError] = useState<string | null>(null);
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState<boolean>(false);

  const loadProfileForUser = useCallback(async (currentUser: User | null | undefined) => {
    if (!currentUser?.id) return;

    try {
      const fetched = await fetchProfile(currentUser.id);
      if (fetched) {
        setProfile(fetched);
      } else {
        // Fallback profile if database trigger is slightly delayed
        const metaName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          (currentUser.email ? currentUser.email.split('@')[0] : 'Student');

        setProfile({
          id: currentUser.id,
          name: metaName,
          college_name: null,
          year_of_study: null,
          semester: null,
          email: currentUser.email || null,
          avatar_url:
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture ||
            null,
        });

        // Retry profile fetch after 1.5s in case DB trigger is asynchronous
        setTimeout(async () => {
          if (currentUser?.id) {
            const recheck = await fetchProfile(currentUser.id);
            if (recheck) setProfile(recheck);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const updated = await fetchProfile(user.id);
      if (updated) {
        setProfile(updated);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, [user]);

  // Handle configuration changes & init
  useEffect(() => {
    const unsubscribeConfig = subscribeToConfigChanges((configured) => {
      setIsConfigured(configured);
    });

    return () => {
      unsubscribeConfig();
    };
  }, []);

  // Listen to Supabase auth events
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setLoading(true);
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (isMounted) setError(sessionError?.message || 'Session error');
        }

        const currentSession = data?.session ?? null;
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }

        if (currentSession?.user) {
          await loadProfileForUser(currentSession.user);
        } else {
          if (isMounted) setProfile(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) setError('Failed to initialize session');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      const safeSession = newSession ?? null;
      setSession(safeSession);
      setUser(safeSession?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryActive(true);
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (safeSession?.user) {
          await loadProfileForUser(safeSession.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForUser, isConfigured]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, []);

  const clearPasswordRecoveryFlag = useCallback(() => {
    setPasswordRecoveryActive(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        error,
        refreshProfile,
        signOut,
        passwordRecoveryActive,
        clearPasswordRecoveryFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
