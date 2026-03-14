import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function MfaSetup() {
  const { enrollMfa, verifyMfaEnrollment, verifyMfaOtp, signOut } = useAuth();
  const [step, setStep] = useState<'loading' | 'enroll' | 'verify'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkExistingFactors = async () => {
      try {
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          throw factorsError;
        }

        const allFactors = factors?.totp ?? [];
        const verifiedFactors = allFactors.filter((factor) => factor.status === 'verified');

        if (verifiedFactors.length > 0) {
          if (!isMounted) return;
          setFactorId(verifiedFactors[0].id);
          setStep('verify');
          return;
        }

        for (const factor of allFactors) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }

        const result = await enrollMfa();
        if (!result || !isMounted) return;

        setQrCode(result.qr);
        setSecret(result.secret);
        setFactorId(result.factorId);
        setStep('enroll');
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err, 'Failed to initialize MFA. Please sign in again.'));
        setStep('verify');
      }
    };

    void checkExistingFactors();

    return () => {
      isMounted = false;
    };
  }, [enrollMfa]);

  const handleVerify = async () => {
    if (!code || code.length !== 6 || !factorId) return;

    setLoading(true);
    setError(null);

    try {
      if (step === 'enroll') {
        await verifyMfaEnrollment(code, factorId);
      } else {
        await verifyMfaOtp(code, factorId);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground">{step === 'enroll' ? 'Set Up 2FA' : 'Verify 2FA'}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {step === 'enroll'
              ? 'Scan the QR code with your authenticator app'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {step === 'loading' ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}

        {step === 'enroll' && qrCode ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={qrCode} alt="MFA QR Code" className="w-48 h-48 rounded-lg border border-border" />
            </div>
            {secret ? (
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Manual entry key</p>
                <p className="text-xs font-mono text-foreground break-all select-all">{secret}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 'enroll' || step === 'verify' ? (
          <div className="space-y-3">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder="000000"
              className="text-center text-lg font-mono tracking-[0.3em] h-12"
              autoFocus
            />
            <Button onClick={() => void handleVerify()} disabled={code.length !== 6 || loading} className="w-full h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {step === 'enroll' ? 'Complete Setup' : 'Verify'}
            </Button>
            {error ? <p className="text-xs text-destructive text-center">{error}</p> : null}
          </div>
        ) : null}

        <Button variant="ghost" size="sm" onClick={() => void signOut()} className="w-full text-xs text-muted-foreground">
          <LogOut className="h-3 w-3 mr-1" /> Sign out
        </Button>
      </Card>
    </div>
  );
}
