import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Radar, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(email, password);
    if (res.ok) {
      toast.success('Authenticated. Console unlocked.');
      nav('/dashboard');
    } else {
      toast.error(res.error || 'Login failed');
    }
  }

  function fill(role: 'mod' | 'cso') {
    if (role === 'mod') {
      setEmail('admin@rumorradar.org');
      setPassword('RumorRadar2024!Secure');
    } else {
      setEmail('cso@rumorradar.org');
      setPassword('CSOPartner2024!Demo');
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
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Restricted access · Moderators &amp; CSOs</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full gap-2 font-mono uppercase tracking-wider text-xs">
            <Lock className="h-3.5 w-3.5" /> Authenticate
          </Button>
        </form>
        <div className="border-t border-border pt-4 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Demo accounts</div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => fill('mod')} className="text-xs">Moderator</Button>
            <Button variant="outline" size="sm" onClick={() => fill('cso')} className="text-xs">CSO partner</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
