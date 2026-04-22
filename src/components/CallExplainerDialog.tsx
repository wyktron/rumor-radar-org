import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Sparkles, Heart, ShieldCheck, PhoneCall } from 'lucide-react';
import { HOTLINE } from '@/constants/countries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallExplainerDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const steps = [
    { icon: Phone, title: t('call.step1Title'), description: t('call.step1Desc') },
    { icon: Sparkles, title: t('call.step2Title'), description: t('call.step2Desc') },
    { icon: PhoneCall, title: t('call.step3Title'), description: t('call.step3Desc') },
    { icon: Heart, title: t('call.step4Title'), description: t('call.step4Desc') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <PhoneCall className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">{t('call.title')}</DialogTitle>
          <DialogDescription className="text-center">{t('call.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.title} className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <step.icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold leading-tight">{step.title}</div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-3 text-xs text-success">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{t('call.privacy')}</p>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('call.cancel')}
          </Button>
          <a href={`tel:${HOTLINE.tel}`} onClick={() => onOpenChange(false)}>
            <Button className="gap-2">
              <Phone className="h-4 w-4" /> {t('call.callBtn', { number: HOTLINE.display })}
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
