import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const ALLOWED_DOMAIN = 'touramigo.com';

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

  useEffect(() => {
    const handleSession = async (nextSession: Session | null) => {
      if (nextSession?.user) {
        const email = nextSession.user.email || '';
        const domain = email.split('@')[1];

        if (domain !== ALLOWED_DOMAIN) {
          await supabase.auth.signOut();
          setSession(null);
          setMfaVerified(false);
          setMfaRequired(false);
          setIsLoading(false);
          return;
        }

        setSession(nextSession);
        await checkMfaStatus();
        setIsLoading(false);
        return;
      }

      setSession(null);
      setMfaVerified(false);
      setMfaRequired(false);
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data: { currentLevel }, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        console.error('MFA check error:', error);
        setMfaVerified(false);
        setMfaRequired(false);
        return;
      }
      
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factors?.totp?.filter(f => (f as any).status === 'verified') || [];
      
      if (verifiedFactors.length === 0) {
        // No MFA enrolled — user needs to set it up
        setMfaRequired(true);
        setMfaVerified(false);
      } else if (currentLevel === 'aal2') {
        setMfaVerified(true);
        setMfaRequired(false);
      } else {
        // Has MFA enrolled but hasn't verified this session
        setMfaRequired(true);
        setMfaVerified(false);
      }
    } catch {
      setMfaVerified(false);
      setMfaRequired(false);
    }
  };

  const signInWithGoogle = async () => {
    const settingsResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/settings?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}`,
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
    const isAllowedHost = oauthUrl.hostname === 'accounts.google.com' || oauthUrl.hostname.endsWith('.supabase.co');
    if (!isAllowedHost) {
      throw new Error('Invalid OAuth redirect host.');
    }

    window.location.assign(data.url);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMfaVerified(false);
    setMfaRequired(false);
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
    <AuthContext.Provider value={{
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
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
