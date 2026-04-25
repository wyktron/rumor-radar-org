import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface Props {
  trigger?: React.ReactNode;
}

/**
 * Thin wrapper kept for backwards compatibility. CSO registration now lives on
 * its own page (`/csos/register`) because the form is too long to fit inside a
 * popup. This component just renders a link to that page.
 */
export function CSORegistrationDialog({ trigger }: Props) {
  if (trigger) {
    return <Link to="/csos/register">{trigger}</Link>;
  }
  return (
    <Button asChild className="gap-2">
      <Link to="/csos/register">
        <ShieldCheck className="h-4 w-4" />
        Apply for verification
      </Link>
    </Button>
  );
}
