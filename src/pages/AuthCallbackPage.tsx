import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { resendVerificationEmail, formatAuthError } from '../services/auth/authService';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    let isCancelled = false;

    async function processCallback() {
      try {
        // 1. Safely extract error from query params or URL hash
        const searchError = searchParams.get('error') || searchParams.get('error_description');
        const searchErrorCode = searchParams.get('error_code');

        let hashError: string | null = null;
        let hashErrorCode: string | null = null;
        let hashDescription: string | null = null;

        if (window.location.hash) {
          try {
            const rawHash = window.location.hash.startsWith('#')
              ? window.location.hash.substring(1)
              : window.location.hash;
            const hashParams = new URLSearchParams(rawHash);
            hashError = hashParams.get('error');
            hashErrorCode = hashParams.get('error_code');
            hashDescription = hashParams.get('error_description');
          } catch {
            // Ignore hash parse errors
          }
        }

        const rawError = searchError || hashDescription || hashError;
        const rawCode = searchErrorCode || hashErrorCode;

        if (rawError) {
          const lower = (rawError + ' ' + (rawCode || '')).toLowerCase();
          let friendly = 'Email verification could not be completed. Please request a new verification email.';

          if (lower.includes('otp_expired') || lower.includes('expired') || lower.includes('invalid or has expired')) {
            friendly = 'This verification link has expired or has already been used. If you have already verified your account, you can log in directly.';
          } else if (lower.includes('access_denied')) {
            friendly = 'Access was denied during verification. Please request a new link.';
          } else {
            friendly = formatAuthError(rawError);
          }

          if (!isCancelled) {
            setStatus('error');
            setErrorMessage(friendly);
          }
          return;
        }

        // 2. PKCE code exchange: check if `code` is in query parameters
        const code = searchParams.get('code');
        if (code) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            if (!isCancelled) {
              setStatus('error');
              setErrorMessage(formatAuthError(exchangeError));
            }
            return;
          }

          if (exchangeData?.session?.user) {
            if (exchangeData.session.user.email) {
              setResendEmail(exchangeData.session.user.email);
            }
            if (!isCancelled) {
              setStatus('success');
            }
            await refreshProfile();
            setTimeout(() => {
              if (!isCancelled) {
                navigate('/dashboard', { replace: true });
              }
            }, 1200);
            return;
          }
        }

        // 3. Email OTP verification fallback (if token_hash and type are passed)
        const tokenHash = searchParams.get('token_hash');
        const otpType = searchParams.get('type') as any;
        if (tokenHash && otpType) {
          const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });

          if (otpError) {
            if (!isCancelled) {
              setStatus('error');
              setErrorMessage(formatAuthError(otpError));
            }
            return;
          }

          if (otpData?.session?.user || otpData?.user) {
            if (!isCancelled) {
              setStatus('success');
            }
            await refreshProfile();
            setTimeout(() => {
              if (!isCancelled) {
                navigate('/dashboard', { replace: true });
              }
            }, 1200);
            return;
          }
        }

        // 4. Client-side session detection: check if session already established
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (!isCancelled) {
            setStatus('error');
            setErrorMessage(formatAuthError(sessionError));
          }
          return;
        }

        if (sessionData?.session?.user) {
          if (sessionData.session.user.email) {
            setResendEmail(sessionData.session.user.email);
          }
          if (!isCancelled) {
            setStatus('success');
          }
          await refreshProfile();
          setTimeout(() => {
            if (!isCancelled) {
              navigate('/dashboard', { replace: true });
            }
          }, 1200);
          return;
        }

        // 5. Wait for onAuthStateChange in case hash parsing is in flight
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (newSession?.user) {
            subscription.unsubscribe();
            if (!isCancelled) {
              setStatus('success');
            }
            await refreshProfile();
            setTimeout(() => {
              if (!isCancelled) {
                navigate('/dashboard', { replace: true });
              }
            }, 1200);
          }
        });

        // 6. Timeout after 4 seconds if no session is detected
        const timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          if (!isCancelled && status === 'loading') {
            setStatus('error');
            setErrorMessage(
              'No active authentication session could be verified from this link. Please log in or request a new verification email.'
            );
          }
        }, 4000);

        return () => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };
      } catch (err: unknown) {
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(formatAuthError(err));
        }
      }
    }

    processCallback();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, navigate, refreshProfile]);

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
        {/* State 1: Loading */}
        {status === 'loading' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Verifying Email...
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Authenticating your university credentials with StudyMate AI.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
              Please wait while your session is established...
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {status === 'success' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Email Verified Successfully!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Welcome to StudyMate AI. Preparing your academic dashboard...
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/dashboard', { replace: true })}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* State 3: Error */}
        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 mx-auto flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Verification Unsuccessful
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                We couldn't confirm your verification link.
              </p>
            </div>

            <Alert variant="error">
              {errorMessage || 'Email verification could not be completed. Please request a new verification email.'}
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
                  Resend to email address
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
