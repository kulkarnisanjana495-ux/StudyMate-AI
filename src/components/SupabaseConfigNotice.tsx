import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { SUPABASE_URL, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const SupabaseConfigNotice: React.FC = () => {
  const { isConfigured } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [anonKeyInput, setAnonKeyInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonKeyInput.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid Supabase anon/publishable key.' });
      return;
    }

    setFeedback({
      type: 'success',
      message: 'To permanently set your key, define VITE_SUPABASE_ANON_KEY in your .env file.',
    });
  };

  const handleReset = () => {
    setAnonKeyInput('');
    setFeedback({ type: 'info' as any, message: 'Reset to environment default.' });
  };

  return (
    <>
      {/* Top Banner if not configured */}
      {!isConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between z-40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Supabase Project Ready:</strong> Target: <code className="bg-amber-200/50 dark:bg-amber-950/60 px-1 py-0.5 rounded font-mono">zsbtxwiumftuknheynrh.supabase.co</code>. Set <code className="bg-amber-200/50 dark:bg-amber-950/60 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono">.env</code> or connect in 1-click.
            </span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline hover:no-underline ml-3 whitespace-nowrap cursor-pointer"
          >
            Configure Anon Key &rarr;
          </button>
        </div>
      )}

      {/* Config Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Supabase Project Configuration"
        description="Verify or provide your Supabase Anon/Publishable Key for real database authentication."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Target Supabase Project:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                StudyMate AI
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Supabase URL:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
                {SUPABASE_URL}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Connection Status:</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {isConfigured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Anon Key Connected
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Anon Key Required
                  </>
                )}
              </span>
            </div>
          </div>

          {feedback && (
            <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          )}

          <form onSubmit={handleSaveKey} className="space-y-3">
            <Input
              label="Supabase Anon / Public Key"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKeyInput}
              onChange={(e) => setAnonKeyInput(e.target.value)}
              helperText="Found in Supabase Dashboard > Project Settings > API > Project API keys (anon public)"
              leftIcon={<KeyRound className="w-4 h-4" />}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              {isConfigured && (
                <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                  Clear Session Key
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Connect
              </Button>
            </div>
          </form>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
            Note: You can also specify <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> directly in your <code className="font-mono">.env</code> file. No service-role key is ever requested or used.
          </p>
        </div>
      </Modal>
    </>
  );
};
