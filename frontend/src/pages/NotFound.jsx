import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/States';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container py-20">
      <EmptyState icon={Compass} title="We couldn't find that page" action={<Button asChild><Link to="/jobs">Browse jobs</Link></Button>}>
        The link may be old or mistyped.
      </EmptyState>
    </div>
  );
}
