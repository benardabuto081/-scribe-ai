import { useEffect, useState, type ReactNode } from 'react';
import type { TransitionKind } from './types';

type Snapshot = { key: string; node: ReactNode };

/**
 * Cross-transitions between content keyed by `contentKey`. GPU-friendly: animates only
 * opacity, transform, clip-path and filter (see outputs.css).
 *
 * On a key change the previous content is captured *during render* (React's "adjust state when
 * a prop changes" pattern), so the outgoing and incoming layers appear in the same commit with
 * their animations already applied — no one-frame flash. Same-key re-renders update in place.
 */
export function Transitioner({
  contentKey,
  kind,
  durationMs,
  children,
}: {
  contentKey: string;
  kind: TransitionKind;
  durationMs: number;
  children: ReactNode;
}) {
  const [current, setCurrent] = useState<Snapshot>({ key: contentKey, node: children });
  const [outgoing, setOutgoing] = useState<Snapshot | null>(null);

  if (current.key !== contentKey) {
    setOutgoing(kind === 'cut' || durationMs === 0 ? null : current);
    setCurrent({ key: contentKey, node: children });
  } else if (current.node !== children) {
    setCurrent({ key: contentKey, node: children });
  }

  useEffect(() => {
    if (!outgoing) return;
    const t = window.setTimeout(() => setOutgoing(null), durationMs + 50);
    return () => window.clearTimeout(t);
  }, [outgoing, durationMs]);

  const style = { animationDuration: `${durationMs}ms` };
  return (
    <>
      {outgoing && (
        <div
          key={`out:${outgoing.key}`}
          className={`sa-tr-layer sa-tr-${kind} sa-tr-out`}
          style={style}
          aria-hidden
        >
          {outgoing.node}
        </div>
      )}
      <div
        key={`in:${contentKey}`}
        className={`sa-tr-layer sa-tr-${kind} ${outgoing ? 'sa-tr-in' : ''}`}
        style={style}
      >
        {children}
      </div>
    </>
  );
}
