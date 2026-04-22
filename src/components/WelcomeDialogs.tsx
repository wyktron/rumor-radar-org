import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Sparkles, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SEEN_KEY = 'rumor-radar.welcome-seen.v1';

export function WelcomeDialogs() {
  const [step, setStep] = useState<'notifications' | 'demo' | 'done'>('done');
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => setStep('notifications'), 600);
    return () => clearTimeout(t);
  }, []);

  const finish = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setStep('done');
  };

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({ title: 'Notifications not supported', description: 'Your browser does not support notifications.', variant: 'destructive' });
      setStep('demo');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        toast({ title: 'Notifications enabled', description: "We'll alert you on new debunks and confirmations." });
      } else if (result === 'denied') {
        toast({ title: 'Notifications blocked', description: 'You can enable them later in your browser settings.', variant: 'destructive' });
      }
    } catch {
      // ignore
    }
    setStep('demo');
  };

  const handleLearnMore = () => {
    finish();
    navigate('/about');
  };

  return (
    <>
      <Dialog open={step === 'notifications'} onOpenChange={(o) => !o && setStep('demo')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <Bell className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl">Stay Updated</DialogTitle>
            <DialogDescription className="text-center">
              Enable browser notifications to get instant alerts when new debunks or confirmations are added.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>We only notify you about verified facts, not rumors.</p>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setStep('demo')}>
              Maybe Later
            </Button>
            <Button onClick={handleEnableNotifications} className="gap-2">
              <Bell className="h-4 w-4" /> Enable Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={step === 'demo'} onOpenChange={(o) => !o && finish()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex justify-center mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-warning/15 text-warning border border-warning/30 rounded px-2 py-0.5">
                Demo Version
              </span>
            </div>
            <DialogTitle className="text-center text-xl">Welcome to Rumor Radar!</DialogTitle>
            <DialogDescription className="text-center">
              This is a demo version prepared for the Lovable hackathon. The full platform with real-time data and expanded features is coming soon!
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            Want to learn more about the project, our mission, and how you can get involved? Check out the About section for more information.
          </p>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={finish}>
              Got it
            </Button>
            <Button onClick={handleLearnMore}>Learn More in About</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
