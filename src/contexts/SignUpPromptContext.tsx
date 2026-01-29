import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SignUpPrompt, shouldShowSignUpPrompt, incrementPromptCount } from '../components/SignUpPrompt';

type TriggerType = 'workout' | 'exercise' | 'save-workout';

interface SignUpPromptContextType {
  triggerSignUpPrompt: (trigger: TriggerType) => void;
}

const SignUpPromptContext = createContext<SignUpPromptContextType | null>(null);

export function SignUpPromptProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<TriggerType>('workout');

  const triggerSignUpPrompt = useCallback((trigger: TriggerType) => {
    // Don't show if user is already signed in or Supabase isn't configured
    if (user || !isConfigured) return;

    // Check if we should show the prompt based on action count
    if (shouldShowSignUpPrompt()) {
      setCurrentTrigger(trigger);
      setIsOpen(true);
    }

    // Always increment the count for tracking
    incrementPromptCount();
  }, [user, isConfigured]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <SignUpPromptContext.Provider value={{ triggerSignUpPrompt }}>
      {children}
      <SignUpPrompt
        isOpen={isOpen}
        onClose={handleClose}
        trigger={currentTrigger}
      />
    </SignUpPromptContext.Provider>
  );
}

export function useSignUpPrompt() {
  const context = useContext(SignUpPromptContext);
  if (!context) {
    throw new Error('useSignUpPrompt must be used within a SignUpPromptProvider');
  }
  return context;
}
