import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resendVerificationEmail, formatAuthError } from '../services/auth/authService';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const emailParam = searchParams.get('email') || user?.email || '';
  const [emailInput, setEmailInput] = useState(emailParam);

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  // If user has an already-confirmed session
  const isVerified = Boolean(user && user.email_confirmed_at);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    const targetEmail = (emailInput || emailParam).trim();
    if (!targetEmail) {
      setResendStatus({
        type: 'error',
        message: 'Please enter your registered university email address to resend.',
      });
      return;
    }

    try {
      setResending(true);
      setResendStatus(null);
      await resendVerificationEmail(targetEmail);
      setResendStatus({
        type: 'success',
        message: `Verification link successfully resent to ${targetEmail}. Please check your inbox.`,
      });
      setCountdown(60);
    } catch (err: unknown) {
      setResendStatus({
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
        {/* Verification Success State */}
        {isVerified ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Email Verified Successfully!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Your university email is confirmed. You can now access your full academic dashboard and student profile.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          /* Dedicated Check your email view per requirements */
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-3xl">
              📩
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Check your email
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                We sent a verification link to:
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-1 bg-slate-50 dark:bg-slate-800/60 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700/60 inline-block max-w-full truncate">
                {emailParam || emailInput || 'your registered email'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Click the link in the email to verify your account.
              </p>
            </div>

            {resendStatus && (
              <Alert variant={resendStatus.type} onDismiss={() => setResendStatus(null)}>
                {resendStatus.message}
              </Alert>
            )}

            {!emailParam && (
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                isLoading={resending}
                disabled={countdown > 0}
                leftIcon={<RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />}
              >
                {resending
                  ? 'Sending verification...'
                  : countdown > 0
                  ? `Resend available in ${countdown}s`
                  : 'Resend verification email'}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-slate-600 dark:text-slate-400"
                onClick={() => navigate('/login')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Login
              </Button>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 text-left pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p>• If you don't see the email within a couple of minutes, check your spam folder.</p>
              <p>• The verification link will direct you securely back to StudyMate AI.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
