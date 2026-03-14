import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const ALLOWED_DOMAIN = 'touramigo.com';
const SETTINGS_TIMEOUT_MS = 8000;

const getEmailDomain = (email?: string | null) => email?.split('@')[1]?.toLowerCase() ?? '';

const isEmbeddedApp = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const isAllowedOauthHost = (hostname: string) => hostname === 'accounts.google.com' || hostname.endsWith('.supabase.co');

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  mfaVerified: boolean;
  mfaRequired: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  verifyMfaOtp: (code: string, factorId: string) => Promise<void>;
  enrollMfa: () => Promise<{ qr: string; secret: string; factorId: string } | null>;
  verifyMfaEnrollment: (code: string, factorId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);

  const resetAuthState = useCallback(() => {
    setSession(null);
    setMfaVerified(false);
    setMfaRequired(false);
  }, []);

  const checkMfaStatus = useCallback(async () => {
    try {
      const { data: assuranceData, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) {
        setMfaVerified(false);
        setMfaRequired(false);
        return;
      }

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setMfaVerified(false);
        setMfaRequired(false);
        return;
      }

      const verifiedFactors = factors?.totp?.filter((factor) => factor.status === 'verified') ?? [];

      if (verifiedFactors.length === 0) {
        setMfaRequired(true);
        setMfaVerified(false);
        return;
      }

      if (assuranceData.currentLevel === 'aal2') {
        setMfaVerified(true);
        setMfaRequired(false);
        return;
      }

      setMfaRequired(true);
      setMfaVerified(false);
    } catch {
      setMfaVerified(false);
      setMfaRequired(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      if (!nextSession?.user) {
        resetAuthState();
        setIsLoading(false);
        return;
      }

      const domain = getEmailDomain(nextSession.user.email);
      if (domain !== ALLOWED_DOMAIN) {
        void supabase.auth.signOut();
        resetAuthState();
        setIsLoading(false);
        return;
      }

      setSession(nextSession);
      await checkMfaStatus();

      if (isMounted) {
        setIsLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        void handleSession(currentSession);
      })
      .catch(() => {
        if (!isMounted) return;
        resetAuthState();
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkMfaStatus, resetAuthState]);

  const signInWithGoogle = async () => {
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), SETTINGS_TIMEOUT_MS);

    try {
      const settingsResponse = await fetch(
        `${SUPABASE_URL}/auth/v1/settings?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}`,
        { signal: abortController.signal },
      );

      if (!settingsResponse.ok) {
        throw new Error('Unable to validate Google auth settings.');
      }

      const settings = await settingsResponse.json();
      if (!settings?.external?.google) {
        throw new Error('Google auth is disabled in Auth Providers. Enable Google and retry.');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
          queryParams: {
            hd: ALLOWED_DOMAIN,
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('Google auth URL was not generated.');
      }

      const oauthUrl = new URL(data.url);
      if (!isAllowedOauthHost(oauthUrl.hostname)) {
        throw new Error('Invalid OAuth redirect host.');
      }

      if (isEmbeddedApp()) {
        const popup = window.open(data.url, 'touramigo-google-auth', 'popup,width=520,height=640');
        if (!popup) {
          throw new Error('Popup blocked. Allow popups or open the app in a new tab to sign in.');
        }
        popup.focus();
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Google auth settings request timed out. Please retry.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    resetAuthState();
  };

  const enrollMfa = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'TourAmigo Authenticator',
    });

    if (error) throw error;

    return {
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    };
  };

  const verifyMfaEnrollment = async (code: string, factorId: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) throw verifyError;

    setMfaVerified(true);
    setMfaRequired(false);
  };

  const verifyMfaOtp = async (code: string, factorId: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) throw verifyError;

    setMfaVerified(true);
    setMfaRequired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        mfaVerified,
        mfaRequired,
        signInWithGoogle,
        signOut,
        verifyMfaOtp,
        enrollMfa,
        verifyMfaEnrollment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
