import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

interface SignUpPromptProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'workout' | 'exercise' | 'save-workout';
}

const MESSAGES = {
  workout: {
    title: 'Great workout!',
    description: 'Sign in to save your progress and sync across all your devices.',
  },
  exercise: {
    title: 'Exercise created!',
    description: 'Sign in to keep your custom exercises safe and access them anywhere.',
  },
  'save-workout': {
    title: 'Workout saved!',
    description: 'Sign in to sync your workouts across all your devices.',
  },
};

export function SignUpPrompt({ isOpen, onClose, trigger }: SignUpPromptProps) {
  const { signInWithEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'prompt' | 'email' | 'sent' | 'error'>('prompt');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !isConfigured) return null;

  const message = MESSAGES[trigger];

  const handleSignUp = () => {
    setStep('email');
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const { error } = await signInWithEmail(email.trim());
    setIsLoading(false);

    if (error) {
      setStep('error');
    } else {
      setStep('sent');
      // Close after showing confirmation
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  };

  const handleClose = () => {
    setEmail('');
    setStep('prompt');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        {step === 'prompt' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {message.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {message.description}
              </p>
            </div>

            <div className="space-y-3">
              <Button variant="primary" onClick={handleSignUp} className="w-full">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Sign Up with Email
                </div>
              </Button>
              <button
                onClick={handleClose}
                className="w-full py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Maybe Later
              </button>
            </div>
          </>
        )}

        {step === 'email' && (
          <>
            <button
              onClick={() => setStep('prompt')}
              className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Enter your email
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We'll send you a magic link to sign in. No password needed.
              </p>
            </div>

            <form onSubmit={handleSubmitEmail}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-4"
                autoFocus
                disabled={isLoading}
              />
              <Button
                variant="primary"
                type="submit"
                disabled={!email.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>
          </>
        )}

        {step === 'sent' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Check your email!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              We sent a magic link to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Unable to send magic link. Please try again.
            </p>
            <Button variant="primary" onClick={() => setStep('email')} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to check if we should show the prompt
const PROMPT_DISMISSED_KEY = 'moove_signup_prompt_dismissed';
const PROMPT_SHOWN_COUNT_KEY = 'moove_signup_prompt_count';

export function shouldShowSignUpPrompt(): boolean {
  // Don't show if user dismissed permanently
  const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
  if (dismissed === 'true') return false;

  // Show after first meaningful action, then every 3 actions
  const count = parseInt(localStorage.getItem(PROMPT_SHOWN_COUNT_KEY) || '0', 10);
  return count === 0 || count % 3 === 0;
}

export function incrementPromptCount(): void {
  const count = parseInt(localStorage.getItem(PROMPT_SHOWN_COUNT_KEY) || '0', 10);
  localStorage.setItem(PROMPT_SHOWN_COUNT_KEY, String(count + 1));
}

export function dismissSignUpPrompt(permanent: boolean = false): void {
  if (permanent) {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
  }
}
