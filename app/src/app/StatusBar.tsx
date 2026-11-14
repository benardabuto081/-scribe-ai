import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ChevronDown,
  CirclePause,
  Cpu,
  Layers,
  Mic,
  MicOff,
  PlayCircle,
  Radio,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge, cn, Icon, Kbd, Meter, Popover, Segmented, Tooltip } from '@/design-system';
import { execute } from '@/commands';
import { useLive } from '@/state/live';
import { useAi, type AiMode } from '@/state/ai';
import { useEngine } from '@/state/engine';
import type { ServiceState } from '@/state/domain';
import { formatClock } from '@/outputs/timerText';

const SERVICE_STATES: ServiceState[] = ['preService', 'worship', 'sermon', 'prayer', 'announcements'];

/** Distinct data colors per service state; label text always accompanies the color. */
const STATE_DOT: Record<ServiceState, string> = {
  preService: 'bg-fg-subtle',
  worship: 'bg-cyan-400',
  sermon: 'bg-brand-400',
  prayer: 'bg-ai-proposing',
  announcements: 'bg-success',
};

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className="shrink-0 font-display text-sm font-semibold tabular-nums" dateTime={now.toISOString()}>
      {formatClock(now)}
    </time>
  );
}

function Divider() {
  return <span aria-hidden className="h-6 w-px shrink-0 bg-line" />;
}

function ServiceStateChip() {
  const { t } = useTranslation();
  const state = useLive((s) => s.program.serviceState);
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="start"
      className="w-56 p-1"
      trigger={
        <button
          type="button"
          aria-label={`${t('status.serviceState')}: ${t(`service.states.${state}`)}`}
          className="focus-ring inline-flex h-control shrink-0 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-2 px-3 text-sm font-medium whitespace-nowrap hover:border-line-strong"
        >
          <span className={cn('size-2 rounded-full', STATE_DOT[state])} aria-hidden />
          {t(`service.states.${state}`)}
          <Icon icon={ChevronDown} size={14} className="text-fg-subtle" />
        </button>
      }
    >
      <ul role="listbox" aria-label={t('status.serviceState')}>
        {SERVICE_STATES.map((s) => (
          <li key={s}>
            <button
              type="button"
              role="option"
              aria-selected={s === state}
              onClick={() => {
                setOpen(false);
                void execute('service.setState', { state: s });
              }}
              className={cn(
                'flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 text-sm hover:bg-accent-soft',
                s === state && 'bg-surface-4',
              )}
            >
              <span className={cn('size-2 rounded-full', STATE_DOT[s])} aria-hidden />
              {t(`service.states.${s}`)}
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}

function AiControls() {
  const { t } = useTranslation();
  const mode = useAi((s) => s.mode);
  const paused = useAi((s) => s.paused);
  const lastConfidence = useAi((s) => s.proposals[0]?.confidence ?? null);
  const engine = useEngine((s) => s.status);
  const aiOff = engine !== 'connected';
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Segmented<AiMode>
        size="sm"
        label={t('ai.mode')}
        value={mode}
        onChange={(m) => void execute('ai.setMode', { mode: m })}
        options={[
          { value: 'manual', label: t('ai.modes.manual') },
          { value: 'assist', label: t('ai.modes.assist'), activeClassName: 'text-ai-proposing' },
          { value: 'auto', label: t('ai.modes.auto'), activeClassName: 'text-ai-acting' },
        ]}
      />
      <Tooltip content={t('status.aiConfidence')}>
        <span className="flex w-16 flex-col gap-1 max-2xl:hidden" aria-label={t('status.aiConfidence')}>
          <span className="text-2xs text-fg-subtle tabular-nums">
            {lastConfidence === null ? '—' : `${Math.round(lastConfidence * 100)}%`}
          </span>
          <Meter label={t('status.aiConfidence')} value={lastConfidence ?? 0} />
        </span>
      </Tooltip>
      <Tooltip content={paused ? t('cmd.ai.resume') : t('cmd.ai.pause')} shortcut="Ctrl+Shift+P">
        <button
          type="button"
          onClick={() => void execute('ai.togglePause')}
          aria-pressed={paused}
          aria-label={paused ? t('cmd.ai.resume') : t('cmd.ai.pause')}
          className={cn(
            'focus-ring inline-flex h-control cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold whitespace-nowrap',
            paused
              ? 'border-warn/40 bg-warn-soft text-warn'
              : 'border-line bg-surface-2 text-fg-muted hover:text-fg',
          )}
        >
          <Icon icon={paused ? PlayCircle : CirclePause} size={16} />
          <span className="max-xl:sr-only">{paused ? t('status.aiPaused') : t('status.pause')}</span>
        </button>
      </Tooltip>
      {aiOff && (
        <Badge tone="neutral" icon={Cpu} className="max-2xl:hidden">
          {t('status.aiUnavailable')}
        </Badge>
      )}
    </div>
  );
}

function MicMeter() {
  const { t } = useTranslation();
  const level = useEngine((s) => s.micLevel);
  const available = level !== null;
  return (
    <Tooltip content={available ? t('status.mic') : t('status.micUnavailable')}>
      <span className="flex shrink-0 items-center gap-2" aria-label={t('status.mic')}>
        <Icon
          icon={available ? Mic : MicOff}
          size={16}
          className={available ? 'text-fg-muted' : 'text-fg-subtle'}
        />
        <span className="w-12 2xl:w-20">
          <Meter label={t('status.mic')} value={level ?? 0} variant="segmented" segments={12} />
        </span>
      </span>
    </Tooltip>
  );
}

function EngineBadge() {
  const { t } = useTranslation();
  const status = useEngine((s) => s.status);
  const latency = useEngine((s) => s.latencyMs);
  const tone = status === 'connected' ? 'success' : status === 'starting' ? 'warn' : 'danger';
  return (
    <Tooltip
      content={
        latency !== null ? `${t(`status.engine.${status}`)} · ${latency} ms` : t(`status.engine.${status}`)
      }
    >
      <span className="shrink-0">
        <Badge tone={tone} dot icon={Activity}>
          {t(`status.engineShort.${status}`)}
        </Badge>
      </span>
    </Tooltip>
  );
}

function LiveIndicator() {
  const { t } = useTranslation();
  const p = useLive((s) => s.program);
  const onAir = !p.blackout && (p.slide !== null || p.media !== null || p.logo);
  return onAir ? (
    <Badge tone="live" icon={Radio} className="animate-pulse-live">
      {t('status.live')}
    </Badge>
  ) : (
    <Badge tone="neutral" icon={Radio}>
      {p.blackout ? t('status.blackout') : t('status.offAir')}
    </Badge>
  );
}

export function StatusBar() {
  const { t } = useTranslation();
  const online = useOnline();
  const look = useLive((s) => s.program.look.name);
  return (
    <header
      className="flex h-(--sa-statusbar-h) shrink-0 items-center gap-2.5 overflow-hidden border-b border-line bg-surface-1 px-3"
      aria-label={t('shell.statusBar')}
    >
      <ServiceStateChip />
      <Divider />
      <AiControls />
      <Divider />
      <MicMeter />
      <div className="min-w-0 flex-1" />
      <button
        type="button"
        onClick={() => void execute('app.openPalette')}
        aria-label={t('shell.searchOrCommand')}
        className="focus-ring inline-flex h-control shrink-0 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-2 px-3 text-sm whitespace-nowrap text-fg-subtle hover:border-line-strong hover:text-fg-muted 2xl:w-64"
      >
        <Icon icon={Search} size={15} />
        <span className="hidden flex-1 truncate text-left 2xl:inline">{t('shell.searchOrCommand')}</span>
        <Kbd keys="Ctrl+K" />
      </button>
      <div className="min-w-0 flex-1" />
      <Tooltip content={t('status.activeLook')}>
        <span className="flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap text-fg-muted">
          <Icon icon={Layers} size={15} />
          <span className="max-w-32 truncate max-xl:sr-only">{look}</span>
        </span>
      </Tooltip>
      <Divider />
      <Badge tone={online ? 'info' : 'warn'} icon={online ? Wifi : WifiOff}>
        <span className="max-2xl:sr-only">{online ? t('status.online') : t('status.offline')}</span>
      </Badge>
      <EngineBadge />
      <LiveIndicator />
      <Divider />
      <Clock />
    </header>
  );
}
