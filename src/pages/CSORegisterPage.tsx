import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Clock, Mail, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CSORegistrationForm } from '@/components/CSORegistrationForm';

export default function CSORegisterPage() {
  useEffect(() => {
    document.title = 'Register as Certified CSO · Rumor Radar';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        'content',
        'Apply for Certified CSO status on Rumor Radar to publish verified debunks and verifications.',
      );
    }
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link to="/csos">
            <ArrowLeft className="h-4 w-4" /> Back to CSO Network
          </Link>
        </Button>
      </div>

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-mono uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> CSO Verification Program
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Register as a Certified CSO</h1>
        <p className="text-muted-foreground">
          Civil society organizations, fact-checkers and academic units can apply to publish verified debunks
          on Rumor Radar. Submissions are reviewed manually and you will hear back within 5 business days.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          icon={FileCheck2}
          title="Submit application"
          body="Tell us about your organization, methodology and team."
        />
        <InfoCard
          icon={Clock}
          title="Manual review"
          body="Our editorial team reviews documents within 5 business days."
        />
        <InfoCard
          icon={Mail}
          title="Get notified"
          body="You'll receive an email with the outcome and next steps."
        />
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <CSORegistrationForm />
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border bg-card p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{body}</p>
    </div>
  );
}
