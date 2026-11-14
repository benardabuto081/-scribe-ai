import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'col';
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
};

const gaps = { 0: 'gap-0', 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6', 8: 'gap-8' } as const;
const aligns = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const;
const justifies = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const;

export function Stack({ direction = 'col', gap = 2, align, justify, wrap, className, ...rest }: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        gaps[gap],
        align && aligns[align],
        justify && justifies[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...rest}
    />
  );
}
