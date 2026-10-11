import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Label, control, hint and error wired together for screen readers. `children(id, describedBy, invalid)`. */
export function Field({ label, hint, error, className, children, optional }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </label>
      {children(id, describedBy, !!error)}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
