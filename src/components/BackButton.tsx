import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface BackButtonProps {
  label?: string;
  fallback?: string;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  variant?: 'default' | 'subtle' | 'ghost';
  showTextOnMobile?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  fallback,
  className = '',
  onClick,
  ariaLabel = 'Go back',
  variant = 'default',
  showTextOnMobile = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Determine if there is meaningful history within the browser/router session
    const hasHistory =
      typeof window !== 'undefined' &&
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0;

    if (hasHistory) {
      navigate(-1);
    } else if (fallback) {
      navigate(fallback);
    } else {
      // Sensible default fallback based on current route
      const path = location.pathname;
      if (path.startsWith('/login') || path.startsWith('/signup')) {
        navigate('/');
      } else if (path.startsWith('/forgot-password') || path.startsWith('/reset-password') || path.startsWith('/auth')) {
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const variantClasses = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white shadow-2xs hover:border-slate-300 dark:hover:border-slate-700',
    subtle:
      'bg-slate-100/80 dark:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
    ghost:
      'bg-transparent border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={ariaLabel}
      className={`group inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-98 select-none ${variantClasses[variant]} ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
      <span className={showTextOnMobile ? 'inline' : 'hidden sm:inline'}>{label}</span>
    </button>
  );
};
