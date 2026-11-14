import { useState, type KeyboardEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';

export type TreeNode = {
  id: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
  count?: number;
  children?: TreeNode[];
  trailing?: ReactNode;
};

/** Accessible tree (role=tree) with arrow-key navigation. */
export function Tree({
  nodes,
  selectedId,
  onSelect,
  label,
  defaultExpanded = [],
}: {
  nodes: TreeNode[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  label: string;
  defaultExpanded?: string[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded));
  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Flatten visible nodes for keyboard navigation.
  const visible: { node: TreeNode; depth: number }[] = [];
  const walk = (list: TreeNode[], depth: number) =>
    list.forEach((n) => {
      visible.push({ node: n, depth });
      if (n.children && expanded.has(n.id)) walk(n.children, depth + 1);
    });
  walk(nodes, 0);

  function onKeyDown(e: KeyboardEvent) {
    const idx = visible.findIndex((v) => v.node.id === selectedId);
    const cur = visible[idx];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const n = visible[Math.min(idx + 1, visible.length - 1)];
      if (n) onSelect(n.node.id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const n = visible[Math.max(idx - 1, 0)];
      if (n) onSelect(n.node.id);
    } else if (e.key === 'ArrowRight' && cur?.node.children && !expanded.has(cur.node.id)) {
      toggle(cur.node.id);
    } else if (e.key === 'ArrowLeft' && cur?.node.children && expanded.has(cur.node.id)) {
      toggle(cur.node.id);
    }
  }

  return (
    <div
      role="tree"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="focus-ring flex flex-col rounded-md py-1"
    >
      {visible.map(({ node, depth }) => {
        const isOpen = expanded.has(node.id);
        const selected = node.id === selectedId;
        return (
          <div
            key={node.id}
            role="treeitem"
            aria-selected={selected}
            aria-expanded={node.children ? isOpen : undefined}
            aria-level={depth + 1}
            onClick={() => onSelect(node.id)}
            className={cn(
              'group flex h-9 cursor-pointer items-center gap-1.5 rounded-md pr-2 text-sm transition-colors duration-fast',
              selected ? 'bg-accent-soft text-fg' : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
            )}
            style={{ paddingLeft: 6 + depth * 16 }}
          >
            {node.children ? (
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(node.id);
                }}
                className="grid size-5 cursor-pointer place-items-center rounded-xs hover:bg-surface-4"
              >
                <Icon
                  icon={ChevronRight}
                  size={14}
                  className={cn('transition-transform duration-fast', isOpen && 'rotate-90')}
                />
              </button>
            ) : (
              <span className="size-5" />
            )}
            {node.color && (
              <span className="size-2 shrink-0 rounded-full" style={{ background: node.color }} aria-hidden />
            )}
            {node.icon && <Icon icon={node.icon} size={15} className={selected ? 'text-accent-fg' : ''} />}
            <span className="flex-1 truncate">{node.label}</span>
            {node.count !== undefined && (
              <span className="text-xs text-fg-subtle tabular-nums">{node.count}</span>
            )}
            {node.trailing}
          </div>
        );
      })}
    </div>
  );
}
