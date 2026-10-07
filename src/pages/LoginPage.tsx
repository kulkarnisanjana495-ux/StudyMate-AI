import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, GraduationCap, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signInWithEmail, resendVerificationEmail, formatAuthError } from '../services/auth/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { OAuthButtons } from '../components/OAuthButtons';
import { BackButton } from '../components/BackButton';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (user) {
      const isEmailUnconfirmed = user.app_metadata?.provider === 'email' && !user.email_confirmed_at;
      if (!isEmailUnconfirmed) {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setResendMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const { user: loggedInUser, session: loggedInSession } = await signInWithEmail({
        email: email.trim(),
        password,
      });

      // If user exists but email is not confirmed
      if (loggedInUser && !loggedInUser.email_confirmed_at && loggedInUser.app_metadata?.provider === 'email') {
        setIsUnverified(true);
        setError('Please verify your email address before signing in.');
        return;
      }

      if (loggedInSession) {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const lower = rawMessage.toLowerCase();

      if (
        lower.includes('not confirmed') ||
        lower.includes('not verified') ||
        lower.includes('verification')
      ) {
        setIsUnverified(true);
        setError('Please verify your email address before signing in.');
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email to resend verification.');
      return;
    }

    try {
      setResending(true);
      await resendVerificationEmail(email.trim());
      setResendMessage(`Verification email sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12">
      <div className="mb-4 flex items-center justify-start">
        <BackButton fallback="/" label="Back" />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your StudyMate AI coursework and exam notes.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" onDismiss={() => setError(null)}>
              <div>{error}</div>
              {isUnverified && (
                <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline cursor-pointer text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    <span>{resending ? 'Sending verification...' : 'Resend verification email'}</span>
                  </button>
                  <Link
                    to={`/auth/verify-email?email=${encodeURIComponent(email.trim())}`}
                    className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline"
                  >
                    View instructions &rarr;
                  </Link>
                </div>
              )}
            </Alert>
          </div>
        )}

        {resendMessage && (
          <div className="mb-4">
            <Alert variant="success" onDismiss={() => setResendMessage(null)}>
              {resendMessage}
            </Alert>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="mb-6">
          <OAuthButtons onError={(err) => setError(err)} />
          <div className="my-5 border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="Enter your Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password <span className="text-rose-500">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            {loading ? 'Signing in...' : 'Sign In with Email'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
};
