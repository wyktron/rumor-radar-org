import { Card } from '@/components/ui/card';
import { Radar, Globe, ShieldCheck, Users, Activity, Lock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/ContactForm';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-10 max-w-4xl space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-gradient-signal shadow-glow">
          <Radar className="h-7 w-7 text-primary-foreground radar-sweep" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {t('about.headline1')} <span className="bg-gradient-signal bg-clip-text text-transparent">{t('about.headline2')}</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('about.intro')}
        </p>
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Link to="/"><Button>{t('about.openHeatmap')}</Button></Link>
          <Link to="/submit"><Button variant="outline">{t('about.submitRumor')}</Button></Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Feature icon={<Activity />} title={t('about.f1Title')} desc={t('about.f1Desc')} />
        <Feature icon={<ShieldCheck />} title={t('about.f2Title')} desc={t('about.f2Desc')} />
        <Feature icon={<Globe />} title={t('about.f3Title')} desc={t('about.f3Desc')} />
        <Feature icon={<Users />} title={t('about.f4Title')} desc={t('about.f4Desc')} />
        <Feature icon={<Lock />} title={t('about.f5Title')} desc={t('about.f5Desc')} />
        <Feature icon={<Radar />} title={t('about.f6Title')} desc={t('about.f6Desc')} />
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
