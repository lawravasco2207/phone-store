import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { AuthModal } from './AuthModal';

export type AuthPromptContextValue = {
  openAuth: () => void;
  closeAuth: () => void;
  requireAuth: (onAuthenticated?: () => void) => void;
  isOpen: boolean;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [queuedAction, setQueuedAction] = useState<(() => void) | null>(null);

  // When user logs in while modal is open, close it and run queued action
  useEffect(() => {
    if (isOpen && user) {
      setIsOpen(false);
      if (queuedAction) {
        const fn = queuedAction;
        setQueuedAction(null);
        try { fn(); } catch {}
      }
    }
  }, [user, isOpen, queuedAction]);

  const openAuth = useCallback(() => setIsOpen(true), []);
  const closeAuth = useCallback(() => setIsOpen(false), []);

  const requireAuth = useCallback((onAuthenticated?: () => void) => {
    if (user) {
      onAuthenticated?.();
      return;
    }
    if (onAuthenticated) setQueuedAction(() => onAuthenticated);
    setIsOpen(true);
  }, [user]);

  const value = useMemo<AuthPromptContextValue>(() => ({ openAuth, closeAuth, requireAuth, isOpen }), [openAuth, closeAuth, requireAuth, isOpen]);

  return (
    <AuthPromptContext.Provider value={value}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuth} />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt(): AuthPromptContextValue {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) {
    throw new Error('useAuthPrompt must be used within AuthPromptProvider');
  }
  return ctx;
}
