import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Radar, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const credSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(320),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav('/dashboard', { replace: true });
  }, [user, loading, nav]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.ok) {
      toast.success('Signed in');
      nav('/dashboard');
    } else {
      toast.error(res.error || 'Sign-in failed');
    }
  }

  return (
    <div className="container py-12 max-w-md">
      <Card className="glass-panel p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-gradient-signal shadow-glow">
            <Radar className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Operator console</h1>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Restricted access · Moderators &amp; CSO members
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" disabled={busy} className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
            <Lock className="h-3.5 w-3.5" /> Authenticate
          </Button>
        </form>

        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex gap-2.5">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Accounts are issued, not self-created.</p>
            <p className="text-muted-foreground">
              Rumor Radar does not have public sign-up. Verified CSOs receive credentials after their organization is approved through{' '}
              <Link to="/csos/register" className="text-primary underline">CSO registration</Link>. The rest of the site is fully usable without an account.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
