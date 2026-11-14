import { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
};

export type SortState = { key: string; dir: 'asc' | 'desc' } | null;

const ROW_H = 44;

/** Virtualized data table using CSS grid rows (stays fast with 10k+ rows). */
export function Table<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  selectedKey,
  onRowClick,
  onRowDoubleClick,
  label,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort?: SortState;
  onSortChange?: (s: SortState) => void;
  selectedKey?: string | null;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  label: string;
  className?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is the chosen virtualizer.
  const virt = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 8,
  });
  const template = columns.map((c) => c.width ?? 'minmax(0,1fr)').join(' ');

  function toggleSort(key: string) {
    if (!onSortChange) return;
    if (sort?.key !== key) onSortChange({ key, dir: 'asc' });
    else if (sort.dir === 'asc') onSortChange({ key, dir: 'desc' });
    else onSortChange(null);
  }

  return (
    <div
      role="table"
      aria-label={label}
      aria-rowcount={rows.length}
      className={cn('flex min-h-0 flex-col', className)}
    >
      <div role="rowgroup" className="border-b border-line bg-surface-1">
        <div role="row" className="grid h-9 items-center px-3" style={{ gridTemplateColumns: template }}>
          {columns.map((c) => (
            <div
              key={c.key}
              role="columnheader"
              aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
              className={cn(
                'px-2 text-2xs font-semibold tracking-wider text-fg-subtle uppercase',
                alignCls(c.align),
              )}
            >
              {c.sortable ? (
                <button
                  type="button"
                  onClick={() => toggleSort(c.key)}
                  className="focus-ring inline-flex cursor-pointer items-center gap-1 rounded-xs uppercase hover:text-fg"
                >
                  {c.header}
                  {sort?.key === c.key && <Icon icon={sort.dir === 'asc' ? ArrowUp : ArrowDown} size={12} />}
                </button>
              ) : (
                c.header
              )}
            </div>
          ))}
        </div>
      </div>
      <div ref={parentRef} role="rowgroup" className="min-h-0 flex-1 overflow-auto">
        <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
          {virt.getVirtualItems().map((vi) => {
            const row = rows[vi.index];
            if (row === undefined) return null;
            const key = rowKey(row);
            const selected = key === selectedKey;
            return (
              <div
                key={key}
                role="row"
                aria-rowindex={vi.index + 1}
                aria-selected={selected}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onDoubleClick={() => onRowDoubleClick?.(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRowDoubleClick?.(row);
                  if (e.key === ' ') {
                    e.preventDefault();
                    onRowClick?.(row);
                  }
                }}
                className={cn(
                  'focus-ring absolute inset-x-0 grid cursor-default items-center border-b border-line/60 px-3 text-sm',
                  'transition-colors duration-fast',
                  selected ? 'bg-accent-soft' : 'hover:bg-surface-3',
                  onRowClick && 'cursor-pointer',
                )}
                style={{
                  gridTemplateColumns: template,
                  height: ROW_H,
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                {columns.map((c) => (
                  <div key={c.key} role="cell" className={cn('min-w-0 truncate px-2', alignCls(c.align))}>
                    {c.cell(row)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function alignCls(a?: 'left' | 'right' | 'center') {
  return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
}
