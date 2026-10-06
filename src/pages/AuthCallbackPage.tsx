import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../services/profile/profileService';
import { resendVerificationEmail, formatAuthError } from '../services/auth/authService';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  const hasHandledSuccessRef = useRef(false);
  const hasInitiatedRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (hasInitiatedRef.current) return;
    hasInitiatedRef.current = true;

    let isCancelled = false;

    // Helper to complete login and navigate to dashboard
    const completeSuccessfulAuth = async (userId: string) => {
      if (hasHandledSuccessRef.current || isCancelled) return;
      hasHandledSuccessRef.current = true;

      // Clean OAuth code and parameters from URL
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch {
        // ignore history error
      }

      setStatus('success');

      try {
        await fetchProfile(userId);
      } catch (err) {
        console.warn('Profile fetch after OAuth:', err);
      }

      if (!isCancelled) {
        navigate('/dashboard', { replace: true });
      }
    };

    async function handleAuthCallback() {
      try {
        const url = new URL(window.location.href);

        // 1. Check for URL error parameters from OAuth provider
        const urlError = url.searchParams.get('error') || url.searchParams.get('error_description');
        let hashError: string | null = null;
        if (window.location.hash) {
          try {
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            hashError = hashParams.get('error') || hashParams.get('error_description');
          } catch {
            // ignore hash parse errors
          }
        }

        const rawError = urlError || hashError;
        if (rawError) {
          console.error('OAuth / verification error in URL:', rawError);
          const lower = rawError.toLowerCase();
          let friendly = 'GitHub sign-in could not be completed. Please try again.';
          if (lower.includes('access_denied')) {
            friendly = 'Authorization was denied. Please try again.';
          } else if (lower.includes('otp_expired') || lower.includes('expired')) {
            friendly = 'This verification link has expired or has already been used. Please request a new verification email.';
          } else {
            friendly = formatAuthError(rawError);
          }

          if (!isCancelled) {
            setStatus('error');
            setErrorMessage(friendly);
          }
          return;
        }

        // 2. Email verification using token_hash and type (signup or email verification link)
        const tokenHash = url.searchParams.get('token_hash');
        const otpType = url.searchParams.get('type') as any;
        if (tokenHash && otpType) {
          const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });

          if (otpError) {
            console.error('Email verification OTP error:', otpError);
            if (!isCancelled) {
              setStatus('error');
              setErrorMessage('Email verification could not be completed. Please request a new verification email.');
            }
            return;
          }

          const verifiedUser = otpData?.session?.user || otpData?.user;
          if (verifiedUser) {
            await completeSuccessfulAuth(verifiedUser.id);
            return;
          }
        }

        // 3. Setup auth state listener for OAuth events (PKCE automatic exchange or hash tokens)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (newSession?.user && !hasHandledSuccessRef.current) {
            subscription.unsubscribe();
            await completeSuccessfulAuth(newSession.user.id);
          }
        });

        // 4. Check if session was already established or automatically exchanged by detectSessionInUrl: true
        // supabase.auth.getSession() awaits internal initialization (which runs PKCE exchange when code is in URL)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          subscription.unsubscribe();
          await completeSuccessfulAuth(sessionData.session.user.id);
          return;
        }

        // 5. If code is present in URL and session was not immediately returned by getSession(),
        // attempt manual PKCE exchange as a fallback
        const code = url.searchParams.get('code');
        if (code && !hasHandledSuccessRef.current) {
          try {
            const { data: exchangeData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (exchangeData?.session?.user) {
              subscription.unsubscribe();
              await completeSuccessfulAuth(exchangeData.session.user.id);
              return;
            }

            if (exchangeError) {
              // Note: If the error is "PKCE code verifier not found in storage.",
              // it typically means the automatic detectSessionInUrl handler already consumed it.
              // Re-check getSession() after a short delay before declaring an error.
              console.warn('PKCE exchange error (may be handled by client auto-detection):', exchangeError.message);
            }
          } catch (err) {
            console.warn('PKCE exchange exception:', err);
          }
        }

        // 6. Grace period: Poll getSession() for up to 3.5 seconds
        // This gives the asynchronous auto-exchange ample time to finish writing the session
        const startTime = Date.now();
        const maxWaitMs = 3500;

        while (Date.now() - startTime < maxWaitMs && !hasHandledSuccessRef.current && !isCancelled) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const { data: pollData } = await supabase.auth.getSession();
          if (pollData?.session?.user) {
            subscription.unsubscribe();
            await completeSuccessfulAuth(pollData.session.user.id);
            return;
          }
        }

        subscription.unsubscribe();

        // 7. If still no session after grace period, show error screen
        if (!hasHandledSuccessRef.current && !isCancelled) {
          // If the user navigated directly to /auth/callback without any code or tokens, redirect to login
          if (!url.searchParams.has('code') && !url.searchParams.has('token_hash') && !window.location.hash) {
            navigate('/login', { replace: true });
            return;
          }

          setStatus('error');
          setErrorMessage('GitHub sign-in could not be completed. Please try again.');
        }
      } catch (err: unknown) {
        console.error('OAuth callback execution error:', err);
        if (!hasHandledSuccessRef.current && !isCancelled) {
          setStatus('error');
          setErrorMessage('GitHub sign-in could not be completed. Please try again.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendFeedback({
        type: 'error',
        message: 'Please enter your registered university email to receive a new link.',
      });
      return;
    }

    try {
      setResending(true);
      setResendFeedback(null);
      await resendVerificationEmail(resendEmail.trim());
      setResendFeedback({
        type: 'success',
        message: `A new verification email has been sent to ${resendEmail.trim()}. Please check your inbox.`,
      });
      setCountdown(60);
    } catch (err: unknown) {
      setResendFeedback({
        type: 'error',
        message: formatAuthError(err),
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Authenticating...
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Completing secure authentication with StudyMate AI.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
              Please wait while your session is established...
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Authentication Successful!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 mx-auto flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Sign-In Unsuccessful
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                We could not complete your sign in.
              </p>
            </div>

            <Alert variant="error">
              {errorMessage || 'GitHub sign-in could not be completed. Please try again.'}
            </Alert>

            {resendFeedback && (
              <Alert variant={resendFeedback.type} onDismiss={() => setResendFeedback(null)}>
                {resendFeedback.message}
              </Alert>
            )}

            {/* Resend form */}
            <form onSubmit={handleResend} className="space-y-3 pt-1 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resend verification to university email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                isLoading={resending}
                disabled={countdown > 0}
                leftIcon={<RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />}
              >
                {resending
                  ? 'Sending verification...'
                  : countdown > 0
                  ? `Resend available in ${countdown}s`
                  : 'Resend Verification Email'}
              </Button>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
              <Link
                to="/signup"
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
