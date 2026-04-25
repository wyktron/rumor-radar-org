import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SEEN_KEY = 'rumor-radar.welcome-seen.v1';

export function WelcomeDialogs() {
  const [step, setStep] = useState<'notifications' | 'done'>('done');
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(SEEN_KEY)) return;
    const timer = setTimeout(() => setStep('notifications'), 600);
    return () => clearTimeout(timer);
  }, []);

  const finish = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setStep('done');
  };

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({ title: t('welcome.notSupported'), description: t('welcome.notSupportedDesc'), variant: 'destructive' });
      finish();
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        toast({ title: t('welcome.enabled'), description: t('welcome.enabledDesc') });
      } else if (result === 'denied') {
        toast({ title: t('welcome.blocked'), description: t('welcome.blockedDesc'), variant: 'destructive' });
      }
    } catch {
      // ignore
    }
    finish();
  };

  return (
    <>
      <Dialog open={step === 'notifications'} onOpenChange={(o) => !o && finish()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <Bell className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl">{t('welcome.notifTitle')}</DialogTitle>
            <DialogDescription className="text-center">{t('welcome.notifDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{t('welcome.notifInfo')}</p>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={finish}>
              {t('welcome.later')}
            </Button>
            <Button onClick={handleEnableNotifications} className="gap-2">
              <Bell className="h-4 w-4" /> {t('welcome.enable')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
