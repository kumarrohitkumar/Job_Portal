import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS = {
  pending: { label: 'In review', icon: Clock3, className: 'bg-marigold-soft text-marigold-ink' },
  accepted: { label: 'Shortlisted', icon: CheckCircle2, className: 'bg-success-soft text-success' },
  rejected: { label: 'Not selected', icon: XCircle, className: 'bg-destructive-soft text-destructive' },
};

export function StatusBadge({ status, className }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', s.className, className)}>
      <s.icon className="size-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}
