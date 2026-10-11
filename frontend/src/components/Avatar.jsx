import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Avatar({ name, src, className }) {
  return src ? (
    <img src={src} alt="" className={cn('size-9 shrink-0 rounded-full object-cover', className)} />
  ) : (
    <span aria-hidden="true" className={cn('grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground', className)}>
      {initials(name)}
    </span>
  );
}

const TINTS = ['bg-primary-soft text-accent-foreground', 'bg-marigold-soft text-marigold-ink', 'bg-success-soft text-success', 'bg-destructive-soft text-destructive'];

/** A company logo, or its initials on a tint chosen from the name so each company keeps its colour. */
export function CompanyLogo({ company, className }) {
  const tint = TINTS[[...(company?.name ?? '')].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length];
  return company?.logoUrl ? (
    <img src={company.logoUrl} alt="" className={cn('size-12 shrink-0 rounded-xl border bg-card object-contain p-1', className)} />
  ) : (
    <span aria-hidden="true" className={cn('grid size-12 shrink-0 place-items-center rounded-xl font-display text-lg font-bold', tint, className)}>
      {initials(company?.name)}
    </span>
  );
}
