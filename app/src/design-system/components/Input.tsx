import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export const inputBase =
  'w-full rounded-md border border-line bg-surface-1 text-sm text-fg placeholder:text-fg-subtle ' +
  'transition-[border-color,box-shadow] duration-fast ease-sa hover:border-line-strong ' +
  'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ' +
  'disabled:opacity-50 aria-[invalid=true]:border-danger';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  trailing?: ReactNode;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, trailing, className, wrapperClassName, ...rest },
  ref,
) {
  return (
    <div className={cn('relative flex items-center', wrapperClassName)}>
      {icon && <Icon icon={icon} size={16} className="pointer-events-none absolute left-3 text-fg-subtle" />}
      <input
        ref={ref}
        className={cn(inputBase, 'h-control', icon ? 'pl-9' : 'pl-3', trailing ? 'pr-11' : 'pr-3', className)}
        {...rest}
      />
      {trailing && <div className="absolute right-1 flex items-center">{trailing}</div>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(inputBase, 'min-h-24 px-3 py-2', className)} {...rest} />;
  },
);
