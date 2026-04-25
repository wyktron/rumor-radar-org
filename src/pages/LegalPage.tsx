import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LegalPageProps {
  type: 'terms' | 'privacy';
}

export default function LegalPage({ type }: LegalPageProps) {
  const { t } = useTranslation();
  const isTerms = type === 'terms';
  const title = isTerms ? t('legal.termsTitle') : t('legal.privacyTitle');
  const Icon = isTerms ? FileText : ShieldCheck;
  const sections = isTerms
    ? [
        ['termsUseTitle', 'termsUse'],
        ['termsContentTitle', 'termsContent'],
        ['termsPartnersTitle', 'termsPartners'],
        ['termsDisclaimerTitle', 'termsDisclaimer'],
      ]
    : [
        ['privacyDataTitle', 'privacyData'],
        ['privacyUseTitle', 'privacyUse'],
        ['privacySharingTitle', 'privacySharing'],
        ['privacyRightsTitle', 'privacyRights'],
      ];

  return (
    <main className="container max-w-3xl py-10 space-y-6">
      <div className="space-y-4">
        <Link to="/about">
          <Button variant="outline" size="sm">{t('legal.backAbout')}</Button>
        </Link>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/30">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('legal.updated')}</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {isTerms ? t('legal.termsIntro') : t('legal.privacyIntro')}
        </p>
      </div>

      <div className="space-y-4">
        {sections.map(([headingKey, bodyKey]) => (
          <Card key={headingKey} className="glass-panel p-5 space-y-2">
            <h2 className="text-lg font-semibold">{t(`legal.${headingKey}`)}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(`legal.${bodyKey}`)}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
