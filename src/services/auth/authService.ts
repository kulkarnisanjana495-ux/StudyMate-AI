import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { User, Session } from '../../types/auth';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message = typeof error === 'string'
    ? error
    : (error as { message?: string; error_description?: string })?.message ||
      (error as { message?: string; error_description?: string })?.error_description ||
      'Email verification could not be completed. Please request a new verification email.';

  if (!message || message === 'null' || message === 'undefined') {
    return 'Authentication could not be completed. Please try again.';
  }

  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please double-check your credentials.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (lower.includes('already registered') || lower.includes('user already exists')) {
    return 'An account with this email address already exists. Please log in instead.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Please wait a few moments before trying again.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (lower.includes('auth api not found') || lower.includes('invalid api key')) {
    return 'Supabase connection error: Invalid or missing API key. Please configure your VITE_SUPABASE_ANON_KEY.';
  }
  if (lower.includes('otp_expired') || lower.includes('expired') || lower.includes('invalid or has expired')) {
    return 'This verification link has expired or has already been used. Please request a new verification email.';
  }

  return message;
}

export async function signUpWithEmail({ email, password, fullName }: SignUpParams): Promise<{
  user: User | null;
  session: Session | null;
  requiresVerification: boolean;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Anon Key is not configured. Please supply a valid key.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(formatAuthError(error));
  }

  // When email confirmation is enabled:
  // data.user may exist, data.session may be null.
  // Do NOT attempt to access data.session.user when data.session is null.
  // Do NOT attempt to access user.id unless user actually exists.
  const user = data?.user ?? null;
  const session = data?.session ?? null;

  const requiresVerification = Boolean(
    user && (!session || !user.email_confirmed_at)
  );

  return {
    user,
    session,
    requiresVerification,
  };
}

export async function signInWithEmail({ email, password }: SignInParams): Promise<{
  user: User;
  session: Session;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Anon Key is not configured. Please supply a valid key.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(formatAuthError(error));
  }

  if (!data?.user || !data?.session) {
    throw new Error('Please verify your email address before signing in.');
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signInWithOAuth(provider: 'google' | 'github'): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Anon Key is not configured. Please supply a valid key.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Anon Key is not configured. Please supply a valid key.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Anon Key is not configured. Please supply a valid key.');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function resendVerificationEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Anon Key is not configured. Please supply a valid key.');
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch {
    return null;
  }
}
