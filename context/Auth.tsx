import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { api, ApiError } from '@/services/api';
import { clearToken, getToken, setToken } from '@/services/session';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface SignUpInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

interface AuthValue {
  status: Status;
  bootError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  retryBoot: () => void;
  forgetSession: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // The local token is cleared either way.
    }
    await clearToken();
    setBootError(null);
    setStatus('signedOut');
  }, []);

  const forgetSession = useCallback(async () => {
    await clearToken();
    setBootError(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('loading');
      const token = await getToken();
      if (!token) {
        if (!cancelled) {
          setBootError(null);
          setStatus('signedOut');
        }
        return;
      }
      try {
        await api('/auth/me');
        if (!cancelled) {
          setBootError(null);
          setStatus('signedIn');
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          await clearToken();
          setBootError(null);
          setStatus('signedOut');
          return;
        }
        setBootError(error instanceof Error ? error.message : 'Could not reach the API');
        setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootAttempt]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api<{ token: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await setToken(result.token);
    setBootError(null);
    setStatus('signedIn');
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const result = await api<{ token: string }>('/auth/register', {
      method: 'POST',
      body: input,
    });
    await setToken(result.token);
    setBootError(null);
    setStatus('signedIn');
  }, []);

  const retryBoot = useCallback(() => setBootAttempt((attempt) => attempt + 1), []);

  return (
    <AuthContext.Provider value={{ status, bootError, signIn, signUp, signOut, retryBoot, forgetSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
