import * as RS from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';
import { inputBase } from './Input';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  className,
  'aria-label': ariaLabel,
  disabled,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
}) {
  return (
    <RS.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RS.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          inputBase,
          'flex h-control cursor-pointer items-center justify-between gap-2 px-3 text-left',
          className,
        )}
      >
        <RS.Value placeholder={placeholder} />
        <RS.Icon>
          <Icon icon={ChevronDown} size={16} className="text-fg-subtle" />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content
          position="popper"
          sideOffset={4}
          className="animate-scale-in z-50 max-h-80 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-line-strong bg-surface-3 p-1 shadow-3"
        >
          <RS.Viewport>
            {options.map((o) => (
              <RS.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="relative flex h-9 cursor-pointer items-center rounded-sm pr-3 pl-8 text-sm text-fg outline-none select-none data-disabled:opacity-40 data-highlighted:bg-accent-soft"
              >
                <RS.ItemIndicator className="absolute left-2">
                  <Icon icon={Check} size={15} className="text-accent-fg" />
                </RS.ItemIndicator>
                <RS.ItemText>{o.label}</RS.ItemText>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}
