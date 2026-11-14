import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../primitives/cn';

/**
 * Virtualized responsive thumbnail grid. Columns derive from container width and `minItemWidth`.
 * Items keep a fixed aspect ratio; caption area is `captionHeight` px.
 */
export function ThumbnailGrid<T>({
  items,
  itemKey,
  renderItem,
  minItemWidth = 200,
  aspect = 16 / 9,
  captionHeight = 40,
  gap = 12,
  label,
  className,
}: {
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  minItemWidth?: number;
  aspect?: number;
  captionHeight?: number;
  gap?: number;
  label: string;
  className?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const inner = Math.max(0, width - gap * 2);
  const cols = Math.max(1, Math.floor((inner + gap) / (minItemWidth + gap)));
  const itemW = cols > 0 ? (inner - gap * (cols - 1)) / cols : minItemWidth;
  const rowH = itemW / aspect + captionHeight + gap;
  const rowCount = Math.ceil(items.length / cols);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is the chosen virtualizer.
  const virt = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowH,
    overscan: 3,
  });

  useEffect(() => {
    virt.measure();
  }, [rowH, virt]);

  return (
    <div ref={parentRef} role="list" aria-label={label} className={cn('min-h-0 overflow-auto', className)}>
      <div style={{ height: virt.getTotalSize() + gap, position: 'relative' }}>
        {width > 0 &&
          virt.getVirtualItems().map((vr) => (
            <div
              key={vr.key}
              className="absolute inset-x-0 grid"
              style={{
                transform: `translateY(${vr.start + gap}px)`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap,
                paddingInline: gap,
              }}
            >
              {items.slice(vr.index * cols, vr.index * cols + cols).map((item, i) => (
                <div role="listitem" key={itemKey(item)}>
                  {renderItem(item, vr.index * cols + i)}
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
