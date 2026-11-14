import { cn } from './cn';

export function Kbd({ keys, className }: { keys: string; className?: string }) {
  const parts = keys.split('+');
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {parts.map((k) => (
        <kbd
          key={k}
          className="min-w-5 rounded-xs border border-line-strong bg-surface-3 px-1 text-center font-sans text-2xs font-medium text-fg-muted"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
