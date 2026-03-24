import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    checkExistingFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkExistingFactors = async () => {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const allFactors = factors?.totp || [];
    const verified = allFactors.filter(f => (f as { status: string }).status === 'verified');
    
    if (verified.length > 0) {
      setFactorId(verified[0].id);
      setStep('verify');
    } else {
      for (const f of allFactors) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      await startEnrollment();
    }
  };

  const startEnrollment = async () => {
    try {
      const result = await enrollMfa();
      if (result) {
        setQrCode(result.qr);
        setSecret(result.secret);
        setFactorId(result.factorId);
        setStep('enroll');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start MFA enrollment');
    }
  };

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
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground">
            {step === 'enroll' ? 'Set Up 2FA' : 'Verify 2FA'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {step === 'enroll'
              ? 'Scan the QR code with your authenticator app'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {step === 'loading' && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {step === 'enroll' && qrCode && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={qrCode} alt="MFA QR Code" className="w-48 h-48 rounded-lg border border-border" />
            </div>
            {secret && (
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Manual entry key</p>
                <p className="text-xs font-mono text-foreground break-all select-all">{secret}</p>
              </div>
            )}
          </div>
        )}

        {(step === 'enroll' || step === 'verify') && (
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
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
              className="w-full h-10"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {step === 'enroll' ? 'Complete Setup' : 'Verify'}
            </Button>
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full text-xs text-muted-foreground"
        >
          <LogOut className="h-3 w-3 mr-1" /> Sign out
        </Button>
      </Card>
    </div>
  );
}
