import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Eraser,
  Image as ImageIcon,
  ListMusic,
  MessageSquareText,
  MonitorOff,
  Music,
  Pause,
  Play,
  PlayCircle,
  Radio,
  Search,
  Sparkles,
  Sticker,
  Timer as TimerIcon,
  Undo2,
  X,
  Zap,
} from 'lucide-react';
import {
  Badge,
  Button,
  cn,
  EmptyState,
  Icon,
  IconButton,
  Input,
  Kbd,
  Meter,
  Segmented,
  Select,
  SplitPane,
  Switch,
  Tooltip,
} from '@/design-system';
import { GROUP_COLORS } from '@/design-system/tokens/tokens';
import { execute, canUndo } from '@/commands';
import { useLive, currentSequence, toSlideContent } from '@/state/live';
import { useLibrary } from '@/state/library';
import { useAi, type AiMode, type Proposal } from '@/state/ai';
import { useEngine } from '@/state/engine';
import { AudienceFrame } from '@/outputs/OutputView';
import { TRANSITION_KINDS, type OutputState, type TransitionKind } from '@/outputs/types';
import { readTimer } from '@/outputs/timerText';
import { parseReference } from '@/features/bible/reference';
import { isAiFeedRunning, startAiFeed, stopAiFeed } from '@/mocks/aiFeed';
import { USE_MOCKS } from '@/mocks/flag';
import type { CueSlide } from '@/state/domain';

/* =============================================================== page */

export function LivePage() {
  const selectedPlaylistId = useLive((s) => s.selectedPlaylistId);
  const playlists = useLibrary((s) => s.playlists);

  // Sensible default: open the first plan if none is selected yet.
  useEffect(() => {
    const first = playlists[0];
    if (!selectedPlaylistId && first) void execute('playlist.select', { playlistId: first.id });
  }, [selectedPlaylistId, playlists]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <SplitPane
          id="live"
          panes={[
            { id: 'queue', defaultSize: '22', minSize: '16', children: <QueuePane /> },
            { id: 'center', defaultSize: '52', minSize: '36', children: <CenterPane /> },
            { id: 'ai', defaultSize: '26', minSize: '18', children: <AiPanel /> },
          ]}
        />
      </div>
      <QuickBar />
    </div>
  );
}

function PaneTitle({ icon, title, right }: { icon: typeof Radio; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
      <Icon icon={icon} size={15} className="text-fg-muted" />
      <h2 className="flex-1 truncate text-xs font-semibold tracking-wider text-fg-muted uppercase">
        {title}
      </h2>
      {right}
    </div>
  );
}

/* =============================================================== left: plan + quick search */

function QueuePane() {
  const { t } = useTranslation();
  const playlists = useLibrary((s) => s.playlists);
  const presentations = useLibrary((s) => s.presentations);
  const selectedPlaylistId = useLive((s) => s.selectedPlaylistId);
  const selectedItemId = useLive((s) => s.selectedItemId);
  const [query, setQuery] = useState('');
  const playlist = playlists.find((p) => p.id === selectedPlaylistId);

  const ref = query.trim().length > 2 ? parseReference(query) : null;
  const songs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return presentations
      .filter((p) => p.kind === 'song' && !p.deletedAt)
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.groups.some((g) => g.slides.some((s) => s.text.toLowerCase().includes(q))),
      )
      .slice(0, 8);
  }, [query, presentations]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ref) void execute('scripture.load', { reference: query });
    else if (songs[0]) void execute('song.load', { songId: songs[0].id });
  }

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <PaneTitle icon={ListMusic} title={t('live.plan')} />
      <div className="border-b border-line p-3">
        <Select
          aria-label={t('live.plan')}
          value={selectedPlaylistId ?? undefined}
          placeholder={t('live.choosePlan')}
          onValueChange={(id) => void execute('playlist.select', { playlistId: id })}
          options={playlists.map((p) => ({ value: p.id, label: p.date ? `${p.name} · ${p.date}` : p.name }))}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {!playlist ? (
          <EmptyState icon={ListMusic} title={t('live.noPlanTitle')} description={t('live.noPlanBody')} />
        ) : playlist.items.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title={t('live.emptyPlanTitle')}
            description={t('live.emptyPlanBody')}
          />
        ) : (
          <ul className="flex flex-col gap-0.5" aria-label={t('live.plan')}>
            {playlist.items.map((item) =>
              item.kind === 'header' ? (
                <li
                  key={item.id}
                  className="px-2 pt-3 pb-1 text-2xs font-semibold tracking-wider text-fg-subtle uppercase"
                >
                  {item.title}
                </li>
              ) : (
                <li key={item.id}>
                  <button
                    type="button"
                    data-selftest={`plan-item-${item.id}`}
                    aria-current={item.id === selectedItemId ? 'true' : undefined}
                    onClick={() => void execute('playlist.selectItem', { itemId: item.id })}
                    className={cn(
                      'focus-ring flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left text-sm',
                      item.id === selectedItemId
                        ? 'bg-accent-soft text-fg'
                        : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
                    )}
                  >
                    <Icon
                      icon={item.kind === 'scripture' ? BookOpen : item.kind === 'macro' ? Zap : Music}
                      size={15}
                    />
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.durationSec !== undefined && (
                      <span className="text-2xs text-fg-subtle tabular-nums">
                        {Math.round(item.durationSec / 60)}′
                      </span>
                    )}
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 border-t border-line p-3">
        <Input
          icon={Search}
          aria-label={t('live.quickSearch')}
          placeholder={t('live.quickSearchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {ref && (
          <Button type="submit" variant="secondary" icon={BookOpen} block>
            {t('live.loadScripture', {
              ref: `${ref.book.en} ${ref.chapter}${ref.verseEnd !== 0 ? `:${ref.verseStart}` : ''}`,
            })}
          </Button>
        )}
        {songs.length > 0 && (
          <ul className="flex max-h-48 flex-col overflow-auto">
            {songs.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => void execute('song.load', { songId: s.id })}
                  className="focus-ring flex h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-surface-3"
                >
                  <Icon icon={Music} size={14} className="text-fg-subtle" />
                  <span className="truncate">{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

/* =============================================================== center: monitors + controls + grid */

function usePreviewState(): OutputState {
  const live = useLive();
  return useMemo(() => {
    const seq = currentSequence(live);
    return {
      ...live.program,
      slide: toSlideContent(live, seq[live.previewIndex]),
      blackout: false,
      logo: false,
    };
  }, [live]);
}

function CenterPane() {
  const { t } = useTranslation();
  const program = useLive((s) => s.program);
  const preview = usePreviewState();
  const live = useLive();
  const seq = currentSequence(live);
  const presentations = useLibrary((s) => s.presentations);
  const title = live.adHoc?.title ?? presentations.find((p) => p.id === live.activePresentationId)?.title;

  return (
    <div className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-line p-3">
        <Monitor label={t('live.preview')} tone="preview">
          <AudienceFrame state={preview} label={t('live.preview')} monitor="preview" />
        </Monitor>
        <Monitor label={t('live.program')} tone="program" onAir={!program.blackout && program.slide !== null}>
          <AudienceFrame state={program} label={t('live.program')} monitor="program" />
        </Monitor>
      </div>
      <ActionBar />
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-3 text-sm">
        <span className="truncate font-medium">{title ?? t('live.nothingLoaded')}</span>
        {seq.length > 0 && (
          <span className="text-xs text-fg-subtle">{t('live.slideCount', { count: seq.length })}</span>
        )}
        <span className="flex-1" />
        <span className="hidden text-xs text-fg-subtle xl:inline">{t('live.gridHint')}</span>
      </div>
      <SlideGrid seq={seq} />
    </div>
  );
}

function Monitor({
  label,
  tone,
  onAir,
  children,
}: {
  label: string;
  tone: 'preview' | 'program';
  onAir?: boolean;
  children: React.ReactNode;
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-1.5">
      <figcaption className="flex items-center gap-2 text-2xs font-semibold tracking-wider uppercase">
        <span
          className={cn(
            'size-2 rounded-full',
            tone === 'program' ? (onAir ? 'bg-live animate-pulse-live' : 'bg-fg-subtle') : 'bg-accent',
          )}
        />
        <span className={tone === 'program' ? 'text-live' : 'text-accent-fg'}>{label}</span>
      </figcaption>
      <div
        className={cn(
          'overflow-hidden rounded-md border-2',
          tone === 'program' ? (onAir ? 'border-live' : 'border-line-strong') : 'border-accent/60',
        )}
      >
        {children}
      </div>
    </figure>
  );
}

function ActionBar() {
  const { t } = useTranslation();
  const program = useLive((s) => s.program);
  const transition = program.transition;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2">
      <Tooltip content={t('cmd.slide.previous')} shortcut="←">
        <Button icon={ChevronLeft} onClick={() => void execute('slide.previous')}>
          {t('live.prev')}
        </Button>
      </Tooltip>
      <Tooltip content={t('cmd.slide.take')} shortcut="Enter">
        <Button variant="live" icon={Play} onClick={() => void execute('slide.take')} data-selftest="take">
          {t('live.take')}
        </Button>
      </Tooltip>
      <Tooltip content={t('cmd.slide.next')} shortcut="→">
        <Button variant="primary" iconRight={ChevronRight} onClick={() => void execute('slide.next')}>
          {t('live.next')}
        </Button>
      </Tooltip>
      <span className="mx-1 h-6 w-px bg-line" aria-hidden />
      <Tooltip content={t('cmd.slide.clear')} shortcut="F1">
        <Button icon={Eraser} onClick={() => void execute('slide.clear')}>
          {t('live.clearText')}
        </Button>
      </Tooltip>
      <Tooltip content={t('cmd.screen.clear')} shortcut="Escape">
        <Button icon={X} onClick={() => void execute('screen.clear')}>
          {t('live.clearAll')}
        </Button>
      </Tooltip>
      <IconButton
        icon={MonitorOff}
        label={t('cmd.screen.blackout')}
        shortcut="B"
        variant={program.blackout ? 'live' : 'secondary'}
        active={program.blackout}
        onClick={() => void execute('screen.blackout')}
      />
      <IconButton
        icon={ImageIcon}
        label={t('cmd.screen.logo')}
        shortcut="L"
        variant="secondary"
        active={program.logo}
        onClick={() => void execute('screen.logo')}
      />
      <span className="flex-1" />
      <Select
        aria-label={t('cmd.transition.set')}
        className="w-36"
        value={transition.kind}
        onValueChange={(kind) =>
          void execute('transition.set', {
            kind: kind as TransitionKind,
            durationMs: kind === 'cut' ? 0 : transition.durationMs || 400,
          })
        }
        options={TRANSITION_KINDS.map((k) => ({ value: k, label: t(`transitions.${k}`) }))}
      />
      <Select
        aria-label={t('live.clearLayer')}
        className="w-40"
        placeholder={t('live.clearLayer')}
        value={undefined}
        onValueChange={(layer) => void execute('screen.clearLayer', { layer })}
        options={(['background', 'media', 'props', 'messages', 'audio'] as const).map((l) => ({
          value: l,
          label: t(`live.layers.${l}`),
        }))}
      />
    </div>
  );
}

function SlideGrid({ seq }: { seq: CueSlide[] }) {
  const { t } = useTranslation();
  const programIndex = useLive((s) => s.programIndex);
  const previewIndex = useLive((s) => s.previewIndex);
  if (seq.length === 0) {
    return (
      <div className="grid flex-1 place-items-center">
        <EmptyState icon={Radio} title={t('live.emptyTitle')} description={t('live.emptyBody')} />
      </div>
    );
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto p-3">
      <ol
        className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5"
        aria-label={t('live.slides')}
      >
        {seq.map((cue, i) => {
          const onAir = i === programIndex;
          const inPreview = i === previewIndex && !onAir;
          return (
            <li key={cue.id}>
              <button
                type="button"
                data-selftest={`slide-${i}`}
                onClick={(e) =>
                  void execute(e.altKey ? 'slide.preview' : 'slide.trigger', { index: i }, { source: 'ui' })
                }
                aria-current={onAir ? 'true' : undefined}
                className={cn(
                  'focus-ring group flex h-full min-h-28 w-full cursor-pointer flex-col overflow-hidden rounded-md border-2 bg-surface-2 text-left transition-colors duration-fast',
                  onAir
                    ? 'border-live'
                    : inPreview
                      ? 'border-accent'
                      : 'border-line hover:border-line-strong',
                )}
              >
                <div
                  className="flex h-6 items-center gap-1.5 px-2 text-2xs font-semibold"
                  style={{ background: `color-mix(in srgb, ${GROUP_COLORS[cue.groupKey]} 22%, transparent)` }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: GROUP_COLORS[cue.groupKey] }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{cue.groupName}</span>
                  {i < 9 && <Kbd keys={String(i + 1)} />}
                  {onAir && <Badge tone="live">{t('status.live')}</Badge>}
                </div>
                <p className="line-clamp-4 flex-1 px-2 py-1.5 text-xs leading-snug whitespace-pre-line text-fg">
                  {cue.text || <span className="text-fg-subtle">{t('live.blankSlide')}</span>}
                </p>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* =============================================================== right: AI panel */

function AiPanel() {
  const { t } = useTranslation();
  const mode = useAi((s) => s.mode);
  const paused = useAi((s) => s.paused);
  const proposals = useAi((s) => s.proposals);
  const transcript = useAi((s) => s.transcript);
  const engine = useEngine((s) => s.status);
  const [simulating, setSimulating] = useState(isAiFeedRunning);
  const [manual, setManual] = useState('');
  useEffect(() => () => stopAiFeed(), []);

  const pending = proposals.filter((p) => p.status === 'pending');
  const recent = proposals.filter((p) => p.status !== 'pending').slice(0, 6);

  return (
    <aside className="flex h-full flex-col bg-surface-1" aria-label={t('live.ai.title')}>
      <PaneTitle
        icon={Sparkles}
        title={t('live.ai.title')}
        right={
          <Badge tone={engine === 'connected' ? 'success' : 'neutral'} dot>
            {engine === 'connected' ? t('live.ai.engineOn') : t('live.ai.engineOff')}
          </Badge>
        }
      />
      <div className="flex flex-col gap-2 border-b border-line p-3">
        <Segmented<AiMode>
          label={t('ai.mode')}
          value={mode}
          onChange={(m) => void execute('ai.setMode', { mode: m })}
          options={[
            { value: 'manual', label: t('ai.modes.manual') },
            { value: 'assist', label: t('ai.modes.assist') },
            { value: 'auto', label: t('ai.modes.auto') },
          ]}
        />
        <div className="flex gap-2">
          <Button
            icon={paused ? PlayCircle : CirclePause}
            variant={paused ? 'outline' : 'secondary'}
            className="flex-1"
            onClick={() => void execute('ai.togglePause')}
          >
            {paused ? t('cmd.ai.resume') : t('cmd.ai.pause')}
          </Button>
          <IconButton
            icon={Undo2}
            label={t('cmd.ai.undoLast')}
            shortcut="Ctrl+Shift+Z"
            variant="secondary"
            disabled={!canUndo('ai')}
            onClick={() => void execute('ai.undoLast')}
          />
        </div>
        {USE_MOCKS && (
          <label className="flex items-center justify-between gap-2 rounded-md border border-dashed border-line-strong px-3 py-2 text-xs">
            <span>
              <span className="font-medium text-fg">{t('live.ai.simulate')}</span>
              <span className="block text-fg-subtle">{t('live.ai.simulateHint')}</span>
            </span>
            <Switch
              checked={simulating}
              label={t('live.ai.simulate')}
              onCheckedChange={(on) => {
                if (on) startAiFeed();
                else stopAiFeed();
                setSimulating(on);
              }}
            />
          </label>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <h3 className="mb-2 text-2xs font-semibold tracking-wider text-fg-subtle uppercase">
          {t('live.ai.suggestions')} {pending.length > 0 && `(${pending.length})`}
        </h3>
        {pending.length === 0 ? (
          <p className="mb-4 text-xs text-fg-subtle">
            {mode === 'manual' ? t('live.ai.manualHint') : t('live.ai.noSuggestions')}
          </p>
        ) : (
          <ul className="mb-4 flex flex-col gap-2">
            {pending.map((p, i) => (
              <ProposalCard key={p.id} p={p} first={i === 0} />
            ))}
          </ul>
        )}
        {recent.length > 0 && (
          <>
            <h3 className="mb-2 text-2xs font-semibold tracking-wider text-fg-subtle uppercase">
              {t('live.ai.recent')}
            </h3>
            <ul className="mb-4 flex flex-col gap-1">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-xs text-fg-muted">
                  <Badge
                    tone={
                      p.status === 'approved' || p.status === 'auto'
                        ? 'success'
                        : p.status === 'failed'
                          ? 'danger'
                          : 'neutral'
                    }
                  >
                    {t(`live.ai.status.${p.status}`)}
                  </Badge>
                  <span className="truncate">{p.decision}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <h3 className="mb-2 text-2xs font-semibold tracking-wider text-fg-subtle uppercase">
          {t('live.ai.transcript')}
        </h3>
        {transcript.length === 0 ? (
          <p className="text-xs text-fg-subtle">
            {engine === 'connected' ? t('live.ai.listening') : t('live.ai.noTranscript')}
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5" aria-live="polite">
            {transcript.slice(-8).map((l) => (
              <li key={l.id} className="text-xs leading-snug text-fg-muted">
                {l.text}
              </li>
            ))}
          </ol>
        )}
      </div>

      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!manual.trim()) return;
          void execute('scripture.show', { reference: manual }).then((o) => o.ok && setManual(''));
        }}
      >
        <Input
          icon={BookOpen}
          aria-label={t('live.ai.manual')}
          placeholder={t('live.ai.manualPlaceholder')}
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Button type="submit" variant="primary">
          {t('live.ai.show')}
        </Button>
      </form>
    </aside>
  );
}

function ProposalCard({ p, first }: { p: Proposal; first: boolean }) {
  const { t } = useTranslation();
  return (
    <li className="rounded-lg border border-ai-proposing/40 bg-surface-2 p-3 shadow-1">
      <div className="mb-1.5 flex items-center gap-2">
        <Badge tone="ai" icon={Sparkles}>
          {t(`live.ai.kinds.${p.kind}`)}
        </Badge>
        <span className="flex-1" />
        <span className="text-2xs text-fg-subtle tabular-nums">{Math.round(p.confidence * 100)}%</span>
      </div>
      <Meter label={t('status.aiConfidence')} value={p.confidence} className="mb-2" />
      <p className="text-sm font-medium text-fg">{p.decision}</p>
      <p className="mt-1 text-xs text-fg-muted italic">“{p.heard}”</p>
      <p className="mt-1 text-xs text-fg-subtle">{p.why}</p>
      <div className="mt-2.5 flex gap-2">
        <Tooltip content={t('cmd.ai.approve')} shortcut={first ? 'Ctrl+Enter' : undefined}>
          <Button
            variant="primary"
            icon={Check}
            className="flex-1"
            data-selftest="ai-approve"
            onClick={() => void execute('ai.approve', { proposalId: p.id })}
          >
            {t('live.ai.approve')}
          </Button>
        </Tooltip>
        <Tooltip content={t('cmd.ai.dismiss')} shortcut={first ? 'Ctrl+Backspace' : undefined}>
          <Button icon={X} onClick={() => void execute('ai.dismiss', { proposalId: p.id })}>
            {t('live.ai.dismiss')}
          </Button>
        </Tooltip>
      </div>
    </li>
  );
}

/* =============================================================== bottom quick-bar */

function QuickBar() {
  const { t } = useTranslation();
  const timers = useLibrary((s) => s.timers);
  const props = useLibrary((s) => s.props);
  const messages = useLibrary((s) => s.messages);
  const macros = useLibrary((s) => s.macros);
  const program = useLive((s) => s.program);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-14 shrink-0 items-center gap-4 overflow-x-auto border-t border-line bg-surface-1 px-3">
      <Group icon={TimerIcon} label={t('nav.timers')}>
        {timers.slice(0, 3).map((tm) => {
          const st = program.timers.find((x) => x.id === tm.id);
          const running = st?.startedAt !== null && st !== undefined;
          return (
            <Button
              key={tm.id}
              variant={running ? 'primary' : 'secondary'}
              icon={running ? Pause : Play}
              onClick={() => void execute(running ? 'timer.stop' : 'timer.start', { timerId: tm.id })}
            >
              <span className="max-w-24 truncate">{tm.name}</span>
              {st && <span className="tabular-nums">{readTimer(st, now).text}</span>}
            </Button>
          );
        })}
      </Group>
      <Group icon={Sticker} label={t('nav.props')}>
        {props.slice(0, 4).map((p) => {
          const on = program.props.some((x) => x.id === p.id);
          return (
            <Button
              key={p.id}
              variant={on ? 'primary' : 'secondary'}
              aria-pressed={on}
              onClick={() => void execute('prop.toggle', { propId: p.id })}
            >
              <span className="max-w-28 truncate">{p.name}</span>
            </Button>
          );
        })}
      </Group>
      <Group icon={MessageSquareText} label={t('nav.messages')}>
        {program.message ? (
          <Button variant="danger" icon={X} onClick={() => void execute('message.hide')}>
            {t('cmd.message.hide')}
          </Button>
        ) : (
          messages
            .filter((m) => m.tokens.length === 0)
            .slice(0, 2)
            .map((m) => (
              <Button key={m.id} onClick={() => void execute('message.show', { messageId: m.id })}>
                <span className="max-w-28 truncate">{m.name}</span>
              </Button>
            ))
        )}
      </Group>
      <Group icon={Zap} label={t('nav.macros')}>
        {macros.map((m) => (
          <Button key={m.id} onClick={() => void execute('macro.run', { macroId: m.id })}>
            <span className="size-2 rounded-full" style={{ background: m.color }} aria-hidden />
            {m.name}
          </Button>
        ))}
      </Group>
    </div>
  );
}

function Group({ icon, label, children }: { icon: typeof Zap; label: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={label}>
      <Tooltip content={label}>
        <span className="grid size-8 place-items-center text-fg-subtle">
          <Icon icon={icon} size={16} />
        </span>
      </Tooltip>
      {children}
    </div>
  );
}
