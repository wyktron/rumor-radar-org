import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Sparkles, Heart, ShieldCheck, PhoneCall } from 'lucide-react';
import { HOTLINE } from '@/constants/countries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    icon: Phone,
    title: 'You call our hotline',
    description: 'Dial the number to reach a secure line operated by Rumor Radar.',
  },
  {
    icon: Sparkles,
    title: 'ElevenLabs powers the conversation',
    description: 'A natural, multilingual AI voice listens to the rumor and gathers context — no human waits on the line.',
  },
  {
    icon: PhoneCall,
    title: 'Twilio places the outreach call',
    description: 'When you ask us to help a loved one, our agent rings them through Twilio at the time you chose.',
  },
  {
    icon: Heart,
    title: 'Empathy-first education',
    description: 'The AI explains the harms of disinformation calmly and respectfully — never lecturing, always listening.',
  },
];

export function CallExplainerDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <PhoneCall className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">How the verification call works</DialogTitle>
          <DialogDescription className="text-center">
            A free, AI-assisted hotline that helps you and your loved ones spot disinformation — without judgment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {STEPS.map((step) => (
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
          <p>Calls are private. We never share your number, and the AI is trained to be empathetic — not preachy.</p>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <a href={`tel:${HOTLINE.tel}`} onClick={() => onOpenChange(false)}>
            <Button className="gap-2">
              <Phone className="h-4 w-4" /> Call {HOTLINE.display}
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
