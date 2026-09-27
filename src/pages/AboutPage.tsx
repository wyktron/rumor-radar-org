import { Card } from '@/components/ui/card';
import { Radar, Globe, ShieldCheck, Users, Activity, Lock, FileText, Trophy } from 'lucide-react';
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

      <Card className="glass-panel p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">{t('about.whoTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('about.whoDesc')}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Crit title={t('about.who1Title')} body={t('about.who1Desc')} />
          <Crit title={t('about.who2Title')} body={t('about.who2Desc')} />
          <Crit title={t('about.who3Title')} body={t('about.who3Desc')} />
          <Crit title={t('about.who4Title')} body={t('about.who4Desc')} />
        </div>
      </Card>

      <Card className="glass-panel p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">{t('about.govTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('about.govDesc')}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-panel p-6 space-y-4 border-primary/30">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Built for Deeptech GigaHack 2026 — Open Challenge</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This build is the Rumor Radar prototype entered into the Open Challenge track at{' '}
          <a href="http://gigahack.md/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Deeptech GigaHack</a>,
          Moldova&apos;s largest deeptech hackathon. The Open Challenge asks teams to ship a working MVP that solves a real problem
          with measurable impact, an explainable workflow, and clear potential to scale.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Crit title="Problem & impact" body="Cross-border rumours travel faster than corrections. Rumor Radar maps them live and routes each one to a fact-checking organisation in the country where it is spreading." />
          <Crit title="Working MVP" body="Live heatmap, public submission flow, moderation dashboard, verified-organisation network, AI-assisted intake and an inbound rumour hotline — all running end to end." />
          <Crit title="Explainable workflow" body="Every rumour carries its origin, topic, spread intensity, current verdict and the named organisation that debunked or confirmed it, with sources attached." />
          <Crit title="Integration & scale" body="Open data model with country codes, a public read API and organisation accounts, so national fact-checkers and EU bodies can plug in without bespoke integration." />
        </div>
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
          Demo data note: the organisation directory lists real, publicly active fact-checking organisations. Rumour records are
          illustrative examples of documented disinformation narrative types, generated for the hackathon demo — they are not
          individual verified incident reports.
        </p>
      </Card>

      <Card className="glass-panel p-6 space-y-3">

        <h2 className="text-lg font-bold">{t('about.partnerTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('about.partnerDesc')}
        </p>
      </Card>

      <Card className="glass-panel p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">{t('about.legalTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('about.legalDesc')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/terms"><Button variant="outline">{t('about.terms')}</Button></Link>
          <Link to="/privacy"><Button variant="outline">{t('about.privacyPolicy')}</Button></Link>
        </div>
      </Card>

      <ContactForm />
    </div>
  );
}

function Crit({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary/30 p-3">
      <div className="font-semibold text-[13px] mb-1">{title}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
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
