import type { ReactNode } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import { cn } from '../primitives/cn';

export type PaneSpec = {
  id: string;
  children: ReactNode;
  /** Percent of the group (string) or pixels (number). */
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  collapsible?: boolean;
  className?: string;
};

/**
 * Resizable split pane with layout persisted to localStorage under `scribe.layout.<id>`.
 * Separators are keyboard operable (arrow keys) and have a 9px hit area around a 1px line.
 */
export function SplitPane({
  id,
  panes,
  orientation = 'horizontal',
  className,
}: {
  id: string;
  panes: PaneSpec[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `scribe.layout.${id}`,
    panelIds: panes.map((p) => p.id),
    storage: localStorage,
  });
  return (
    <Group
      id={id}
      orientation={orientation}
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      className={cn('h-full w-full', className)}
    >
      {panes.map((p, i) => (
        <PaneWithSeparator key={p.id} pane={p} last={i === panes.length - 1} orientation={orientation} />
      ))}
    </Group>
  );
}

function PaneWithSeparator({
  pane,
  last,
  orientation,
}: {
  pane: PaneSpec;
  last: boolean;
  orientation: 'horizontal' | 'vertical';
}) {
  return (
    <>
      <Panel
        id={pane.id}
        defaultSize={pane.defaultSize}
        minSize={pane.minSize}
        maxSize={pane.maxSize}
        collapsible={pane.collapsible}
        className={cn('min-h-0 min-w-0', pane.className)}
      >
        {pane.children}
      </Panel>
      {!last && (
        <Separator
          className={cn(
            'group relative flex shrink-0 items-center justify-center outline-none',
            orientation === 'horizontal'
              ? 'w-[9px] -mx-1 cursor-col-resize'
              : 'h-[9px] -my-1 cursor-row-resize',
          )}
        >
          <span
            className={cn(
              'bg-line transition-colors duration-fast group-hover:bg-accent group-focus-visible:bg-focus group-data-[separator=active]:bg-accent',
              orientation === 'horizontal' ? 'h-full w-px' : 'h-px w-full',
            )}
          />
        </Separator>
      )}
    </>
  );
}
