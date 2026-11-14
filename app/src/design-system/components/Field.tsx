import { useId, type ReactNode } from 'react';
import { cn } from '../primitives/cn';

type ControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean };

/** Label + control + hint/error wrapper. Passes the generated id to the control via render prop. */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const id = useId();
  const descId = hint || error ? `${id}-desc` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-medium text-fg-muted">
        {label}
      </label>
      {children({ id, 'aria-describedby': descId, 'aria-invalid': error ? true : undefined })}
      {(error || hint) && (
        <p id={descId} className={cn('text-xs', error ? 'text-danger' : 'text-fg-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
