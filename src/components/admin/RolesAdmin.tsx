import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, ShieldOff, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { relativeTime } from '@/lib/rumor-utils';

type AppRole = 'admin' | 'moderator' | 'cso_member' | 'user';

interface RoleRow {
  user_id: string;
  email: string;
  role: AppRole;
  granted_at: string;
}

const ASSIGNABLE_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Full administration, including managing roles' },
  { value: 'moderator', label: 'Moderator', description: 'Approve rumors, CSOs, run AI translation' },
  { value: 'cso_member', label: 'CSO member', description: 'Submit debunks on behalf of a CSO' },
];

const ROLE_STYLES: Record<AppRole, string> = {
  admin: 'border-destructive/40 text-destructive',
  moderator: 'border-primary/40 text-primary',
  cso_member: 'border-success/40 text-success',
  user: 'border-muted-foreground/30 text-muted-foreground',
};

export function RolesAdmin() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('moderator');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_roles');
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as RoleRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Enter the user email');
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('admin_grant_role', { _email: trimmed, _role: role });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Granted ${role} to ${trimmed}`);
    setEmail('');
    load();
  }

  async function handleRevoke(target: RoleRow) {
    if (!confirm(`Revoke ${target.role} from ${target.email}?`)) return;
    const { error } = await supabase.rpc('admin_revoke_role', {
      _email: target.email,
      _role: target.role,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Revoked ${target.role} from ${target.email}`);
    load();
  }

  return (
    <div className="space-y-4">
      <Card className="glass-panel p-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
          <UserPlus className="h-3.5 w-3.5" /> Grant a role to an existing user
        </div>
        <form onSubmit={handleGrant} className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">User email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      <span className="text-[10px] text-muted-foreground">{r.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={busy} className="font-mono uppercase tracking-wider text-xs">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
            Grant role
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-3">
          The user must have signed up at least once. The same user can hold multiple roles (e.g. moderator + cso_member).
        </p>
      </Card>

      <Card className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <ShieldOff className="h-3.5 w-3.5" /> Current role assignments
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={load} disabled={loading} className="text-xs">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Refresh'}
          </Button>
        </div>

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">No roles assigned yet.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={`${r.user_id}-${r.role}`}
                className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.email}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Granted {relativeTime(r.granted_at)}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_STYLES[r.role]}`}
                >
                  {r.role}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRevoke(r)}
                  aria-label={`Revoke ${r.role} from ${r.email}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
