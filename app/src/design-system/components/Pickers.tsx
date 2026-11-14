import { useState, type KeyboardEvent } from 'react';
import { Keyboard, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../primitives/cn';
import { Icon } from '../primitives/Icon';
import { Kbd } from '../primitives/Kbd';
import { Popover } from './Popover';
import { Input } from './Input';
import { Select } from './Select';
import { Slider } from './Slider';
import { IconButton } from './IconButton';

/* ---------------- Color picker ---------------- */

/** Swatches here are user content colors (slide/text colors), not UI chrome — hence literal values. */
export const CONTENT_SWATCHES = [
  '#ffffff',
  '#e9eef8',
  '#9ca8be',
  '#3a4256',
  '#0b0f17',
  '#000000',
  '#1e40ff',
  '#1f8bff',
  '#22d3ee',
  '#2fcf7a',
  '#f5b53d',
  '#ff8a4c',
  '#f04d5d',
  '#f07ab0',
  '#8b7cff',
  '#e7c06a',
  '#7a4b2a',
  '#0f5132',
];

const HEX = /^#([0-9a-f]{6})$/i;

export function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
}) {
  return (
    <Popover
      trigger={
        <button
          type="button"
          aria-label={`${label}: ${value}`}
          className="focus-ring flex h-control cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-1 pr-3 pl-1.5 text-sm hover:border-line-strong"
        >
          <span className="size-7 rounded-sm border border-line-strong" style={{ background: value }} />
          <span className="font-mono text-xs text-fg-muted uppercase">{value}</span>
        </button>
      }
      className="w-64"
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-6 gap-1.5" role="listbox" aria-label={label}>
          {CONTENT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={c.toLowerCase() === value.toLowerCase()}
              aria-label={c}
              onClick={() => onChange(c)}
              className={cn(
                'focus-ring size-8 cursor-pointer rounded-sm border transition-transform duration-fast hover:scale-110',
                c.toLowerCase() === value.toLowerCase()
                  ? 'border-fg ring-2 ring-accent'
                  : 'border-line-strong',
              )}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="size-10 cursor-pointer rounded-sm border border-line bg-transparent"
          />
          {/* Keyed by value so the draft resets whenever the committed color changes. */}
          <HexInput key={value} value={value} onChange={onChange} />
        </div>
      </div>
    </Popover>
  );
}

function HexInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <Input
      aria-label="Hex"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (HEX.test(e.target.value)) onChange(e.target.value);
      }}
      className="font-mono uppercase"
      wrapperClassName="flex-1"
    />
  );
}

/* ---------------- Font picker ---------------- */

/** Only bundled OFL fonts are offered. More arrive with the template packs (Phase D). */
export const BUNDLED_FONTS = [
  { value: 'Inter Variable', label: 'Inter' },
  { value: 'Montserrat Variable', label: 'Montserrat' },
] as const;

export function FontPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (font: string) => void;
  label: string;
}) {
  return (
    <Select
      aria-label={label}
      value={value}
      onValueChange={onChange}
      options={BUNDLED_FONTS.map((f) => ({ value: f.value, label: f.label }))}
    />
  );
}

/* ---------------- Gradient editor ---------------- */

export type GradientStop = { color: string; at: number };
export type Gradient = { angle: number; stops: GradientStop[] };

export function gradientCss(g: Gradient): string {
  const stops = [...g.stops].sort((a, b) => a.at - b.at).map((s) => `${s.color} ${s.at}%`);
  return `linear-gradient(${g.angle}deg, ${stops.join(', ')})`;
}

export function GradientEditor({ value, onChange }: { value: Gradient; onChange: (g: Gradient) => void }) {
  const { t } = useTranslation();
  const setStop = (i: number, patch: Partial<GradientStop>) =>
    onChange({ ...value, stops: value.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <div className="flex flex-col gap-3">
      <div className="h-20 rounded-md border border-line-strong" style={{ background: gradientCss(value) }} />
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-fg-muted">{t('ds.angle')}</span>
        <Slider
          label={t('ds.angle')}
          value={value.angle}
          min={0}
          max={360}
          onValueChange={(angle) => onChange({ ...value, angle })}
        />
        <span className="w-10 text-right text-xs text-fg-muted tabular-nums">{value.angle}°</span>
      </div>
      {value.stops.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <ColorPicker
            label={t('ds.stopColor', { n: i + 1 })}
            value={s.color}
            onChange={(color) => setStop(i, { color })}
          />
          <Slider
            label={t('ds.stopPosition', { n: i + 1 })}
            value={s.at}
            onValueChange={(at) => setStop(i, { at })}
          />
          <IconButton
            icon={Trash2}
            label={t('ds.removeStop')}
            disabled={value.stops.length <= 2}
            onClick={() => onChange({ ...value, stops: value.stops.filter((_, j) => j !== i) })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...value, stops: [...value.stops, { color: '#ffffff', at: 100 }] })}
        className="focus-ring inline-flex h-control cursor-pointer items-center gap-2 self-start rounded-md px-2 text-sm text-accent-fg hover:bg-accent-soft"
      >
        <Icon icon={Plus} size={15} /> {t('ds.addStop')}
      </button>
    </div>
  );
}

/* ---------------- Shortcut recorder ---------------- */

export function formatShortcut(
  e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>,
): string | null {
  const ignored = ['Control', 'Shift', 'Alt', 'Meta'];
  if (ignored.includes(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(key);
  return parts.join('+');
}

export function ShortcutRecorder({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (shortcut: string | null) => void;
  label: string;
}) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setRecording(true)}
      onBlur={() => setRecording(false)}
      onKeyDown={(e) => {
        if (!recording) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') return setRecording(false);
        if (e.key === 'Backspace' || e.key === 'Delete') {
          onChange(null);
          return setRecording(false);
        }
        const s = formatShortcut(e);
        if (s) {
          onChange(s);
          setRecording(false);
        }
      }}
      className={cn(
        'focus-ring inline-flex h-control min-w-40 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm',
        recording
          ? 'border-accent bg-accent-soft text-accent-fg'
          : 'border-line bg-surface-1 text-fg-muted hover:border-line-strong',
      )}
    >
      <Icon icon={Keyboard} size={15} />
      {recording ? t('ds.pressKeys') : value ? <Kbd keys={value} /> : t('ds.noShortcut')}
    </button>
  );
}
