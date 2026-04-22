import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Globe, Mail, Calendar } from 'lucide-react';

export default function CSONetworkPage() {
  const { csos } = useApp();
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CSO Network</h1>
        <p className="text-sm text-muted-foreground">
          Verified civil society organizations partnering with Rumor Radar to investigate and debunk claims.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {csos.map((c) => (
          <Card key={c.id} className="glass-panel p-5 space-y-3 hover:shadow-glow transition-shadow group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-gradient-signal flex items-center justify-center font-bold text-primary-foreground text-sm">
                  {c.name.split(' ').slice(0, 2).map((s) => s[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{c.name}</h3>
                  <div className="text-xs text-muted-foreground font-mono">{c.country}</div>
                </div>
              </div>
              {c.verified && (
                <Badge className="gap-1 bg-success/15 text-success border-success/30 hover:bg-success/20" variant="outline">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{c.description}</p>
            <div className="space-y-1.5 text-xs pt-2 border-t border-border">
              {c.website && (
                <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <Globe className="h-3 w-3" /> {c.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" /> {c.contactEmail}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" /> Joined {new Date(c.dateJoined).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
