import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radar, Lock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const credSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(320),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

const signupSchema = credSchema.extend({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
});

export default function LoginPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const nav = useNavigate();

  // Sign-in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Sign-up fields
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suName, setSuName] = useState('');

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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ email: suEmail, password: suPassword, displayName: suName });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const res = await signUp(suEmail, suPassword, suName);
    setBusy(false);
    if (res.ok) {
      toast.success('Account created — you can sign in now.');
    } else {
      toast.error(res.error || 'Sign-up failed');
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

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="pt-4">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
                <Lock className="h-3.5 w-3.5" /> Authenticate
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="pt-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Display name</Label>
                <Input value={suName} onChange={(e) => setSuName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required minLength={8} />
                <p className="text-[11px] text-muted-foreground">Min 8 characters. Leaked-password protection is enabled.</p>
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
                <UserPlus className="h-3.5 w-3.5" /> Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border pt-4">
          <p className="text-[11px] text-muted-foreground text-center">
            New accounts default to read-only. An administrator must grant you the <strong>moderator</strong> or <strong>cso_member</strong> role to access the operator dashboard.
          </p>
        </div>
      </Card>
    </div>
  );
}
