import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversation } from '@elevenlabs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Sparkles, Heart, ShieldCheck, PhoneCall, Mic, PhoneOff, Loader2 } from 'lucide-react';
import { HOTLINE } from '@/constants/countries';
import { toast } from '@/hooks/use-toast';

const ELEVENLABS_AGENT_ID = 'Mmxv1SKByrTiQvVFpJY7';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallExplainerDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onError: () => {
      toast({ variant: 'destructive', title: t('call.webCallError') });
    },
  });

  const isLive = conversation.status === 'connected';

  const startWebCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setIsConnecting(false);
      toast({ variant: 'destructive', title: t('call.webCallMicError') });
      return;
    }
    try {
      await conversation.startSession({ agentId: ELEVENLABS_AGENT_ID, connectionType: 'webrtc' });
    } catch {
      toast({ variant: 'destructive', title: t('call.webCallError') });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, t]);

  const endWebCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      /* ignore */
    }
  }, [conversation]);

  const handleOpenChange = (next: boolean) => {
    if (!next && isLive) void endWebCall();
    onOpenChange(next);
  };

  const steps = [
    { icon: Phone, title: t('call.step1Title'), description: t('call.step1Desc') },
    { icon: Sparkles, title: t('call.step2Title'), description: t('call.step2Desc') },
    { icon: PhoneCall, title: t('call.step3Title'), description: t('call.step3Desc') },
    { icon: Heart, title: t('call.step4Title'), description: t('call.step4Desc') },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          {isLive ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                {t('call.webCallLive')}
              </div>
              <p className="text-xs text-muted-foreground">
                {conversation.isSpeaking ? t('call.webCallSpeaking') : t('call.webCallListening')}
              </p>
              <Button variant="destructive" size="sm" className="w-full gap-2" onClick={endWebCall}>
                <PhoneOff className="h-4 w-4" /> {t('call.webCallEnd')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('call.webCallHint')}</p>
              <Button className="w-full gap-2" onClick={startWebCall} disabled={isConnecting}>
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                {isConnecting ? t('call.webCallConnecting') : t('call.webCallBtn')}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-3 text-xs text-success">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{t('call.privacy')}</p>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('call.cancel')}
          </Button>
          <a href={`tel:${HOTLINE.tel}`} onClick={() => handleOpenChange(false)}>
            <Button variant="secondary" className="gap-2">
              <Phone className="h-4 w-4" /> {t('call.callBtn', { number: HOTLINE.display })}
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
