import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageSpinner({ label = 'Loading' }) {
  return (
    <div role="status" className="grid min-h-[50vh] place-items-center text-muted-foreground">
      <Loader2 className="size-7 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-muted', className)} />;
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-5 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-primary-soft text-accent-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="text-lg font-bold">{title}</h2>
      {children && <p className="mt-1 max-w-md text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive-soft p-5 text-sm text-destructive">
      <p className="font-semibold">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-semibold underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
