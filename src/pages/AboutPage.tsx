import { Card } from '@/components/ui/card';
import { Radar, Globe, ShieldCheck, Users, Activity, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/ContactForm';

export default function AboutPage() {
  return (
    <div className="container py-10 max-w-4xl space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-gradient-signal shadow-glow">
          <Radar className="h-7 w-7 text-primary-foreground radar-sweep" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Real-time intelligence against <span className="bg-gradient-signal bg-clip-text text-transparent">disinformation</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Rumor Radar is an open coordination platform that lets civil society organizations, journalists,
          and citizens monitor, investigate, and debunk misinformation as it spreads across borders.
        </p>
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Link to="/"><Button>Open the heatmap</Button></Link>
          <Link to="/submit"><Button variant="outline">Submit a rumor</Button></Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Feature icon={<Activity />} title="Live signal tracking" desc="Every rumor is geolocated and scored by reach, velocity, and confidence." />
        <Feature icon={<ShieldCheck />} title="CSO-verified debunks" desc="Vetted fact-checking partners publish source-backed verdicts." />
        <Feature icon={<Globe />} title="Cross-border view" desc="See how narratives jump between countries, languages, and platforms." />
        <Feature icon={<Users />} title="CSO Network" desc="A growing coalition of independent verification organizations." />
        <Feature icon={<Lock />} title="Anonymous submission" desc="Anyone can report a suspicious claim without creating an account." />
        <Feature icon={<Radar />} title="Moderator console" desc="Approve submissions, validate debunks, calibrate trending intensity." />
      </div>

      <Card className="glass-panel p-6 space-y-3">
        <h2 className="text-lg font-bold">Become a CSO partner</h2>
        <p className="text-sm text-muted-foreground">
          Verified civil society organizations get write access to publish debunks and verifications. Use the contact
          form below with your organization profile and recent investigations, and our partnerships team will be in touch.
        </p>
      </Card>

      <ContactForm />
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="glass-panel p-5 space-y-2 hover:shadow-glow transition-shadow">
      <div className="h-9 w-9 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}
