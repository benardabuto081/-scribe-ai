import { memo, useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import markUrl from '@/assets/brand/mark.png';
import { subscribeOutputState, isTauri } from './bridge';
import { Transitioner } from './Transitioner';
import { formatClock, readTimer } from './timerText';
import {
  EMPTY_OUTPUT_STATE,
  type OutputRole,
  type OutputState,
  type SlideContent,
  type ThemeStyle,
} from './types';
import './outputs.css';

/*
 * Output windows render *content*, not UI chrome: the colors here (black stage, white text,
 * test-pattern bars) are broadcast conventions, intentionally not theme tokens.
 */

function useOutputState(): OutputState {
  const [state, setState] = useState<OutputState>(EMPTY_OUTPUT_STATE);
  useEffect(() => subscribeOutputState(setState), []);
  return state;
}

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Output-window-only shortcuts: reopen Studio (Ctrl+Shift+S), quit (Ctrl+Shift+Q). */
function useOutputShortcuts() {
  useEffect(() => {
    if (!isTauri()) return;
    const onKey = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey)) return;
      const { invoke } = await import('@tauri-apps/api/core');
      if (e.key.toLowerCase() === 's') await invoke('studio_reopen');
      if (e.key.toLowerCase() === 'q') await invoke('app_quit');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function OutputView({ role }: { role: OutputRole }) {
  const state = useOutputState();
  useOutputShortcuts();
  useEffect(() => {
    document.title = `Scribe AI — ${role === 'audience' ? 'Audience' : 'Stage'}`;
  }, [role]);
  if (state.testPattern[role]) return <TestPattern role={role} />;
  return (
    <div className="sa-output" data-role={role}>
      {role === 'audience' ? <Audience state={state} /> : <Stage state={state} />}
      {state.identify[role] && <Identify role={role} />}
    </div>
  );
}

/* ================================ Audience ================================ */

function textStyle(theme: ThemeStyle): CSSProperties {
  return {
    fontFamily: `'${theme.fontFamily}', sans-serif`,
    fontWeight: theme.fontWeight,
    color: theme.textColor,
    fontSize: `${theme.textSize}cqh`,
    lineHeight: 1.22,
    textTransform: theme.uppercase ? 'uppercase' : undefined,
    textShadow: theme.textShadow ? '0 0.3cqh 1.4cqh rgb(0 0 0 / 0.55)' : undefined,
    whiteSpace: 'pre-line',
    textWrap: 'balance',
  };
}

const SlideText = memo(function SlideText({ slide, theme }: { slide: SlideContent; theme: ThemeStyle }) {
  const isScripture = slide.kind === 'scripture';
  const base = textStyle(isScripture ? { ...theme, textSize: Math.min(theme.textSize, 5.2) } : theme);
  const position: CSSProperties =
    theme.align === 'bottom'
      ? { justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center', padding: '0 8cqw 7cqh' }
      : theme.align === 'left'
        ? { justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left', padding: '0 9cqw' }
        : { justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 8cqw' };
  const panel: CSSProperties | undefined = theme.panel
    ? {
        background: 'rgb(0 0 0 / 0.55)',
        padding: '2.4cqh 3cqw',
        borderRadius: '1.2cqh',
        backdropFilter: 'blur(6px)',
      }
    : undefined;
  return (
    <div className="sa-layer flex flex-col" style={position}>
      <div style={panel}>
        <p style={{ ...base, margin: 0 }}>{slide.text}</p>
        {isScripture && slide.reference && (
          <p
            style={{
              ...textStyle(theme),
              fontSize: `${Math.max(2.4, theme.textSize * 0.5)}cqh`,
              fontWeight: 600,
              opacity: 0.85,
              marginTop: '2.4cqh',
              letterSpacing: '0.04em',
            }}
          >
            {slide.reference} · KJV
          </p>
        )}
      </div>
    </div>
  );
});

function Audience({ state }: { state: OutputState }) {
  const { look, transition, theme } = state;
  const layers = look.layers;
  const slideKey = state.slide?.key ?? 'empty';
  return (
    <>
      {layers.background && state.background && (
        <div
          className="sa-layer sa-bg-animated"
          style={{ background: state.background.css, transition: 'background 600ms ease' }}
        />
      )}
      {layers.media && state.media && (
        <Transitioner contentKey={state.media.id} kind="fade" durationMs={600}>
          <div className="sa-layer sa-bg-animated" style={{ background: state.media.css }} />
        </Transitioner>
      )}
      {layers.slide && (
        <Transitioner contentKey={slideKey} kind={transition.kind} durationMs={transition.durationMs}>
          {state.slide ? <SlideText slide={state.slide} theme={theme} /> : null}
        </Transitioner>
      )}
      {layers.props && <Props state={state} />}
      {layers.messages && state.message && <MessageTicker text={state.message.text} />}
      <AudienceTimers state={state} />
      {/* Logo hold and blackout sit above everything and fade. */}
      <div
        className="sa-layer grid place-items-center bg-black"
        style={{ opacity: state.logo ? 1 : 0, transition: 'opacity 500ms ease', pointerEvents: 'none' }}
      >
        <img src={markUrl} alt="" style={{ height: '28cqh', opacity: 0.95 }} />
      </div>
      <div
        className="sa-layer bg-black"
        style={{ opacity: state.blackout ? 1 : 0, transition: 'opacity 400ms ease', pointerEvents: 'none' }}
      />
    </>
  );
}

function Props({ state }: { state: OutputState }) {
  return (
    <>
      {state.props.map((p) => {
        switch (p.kind) {
          case 'lowerThird':
          case 'giving':
          case 'social':
            return (
              <div
                key={p.id}
                className="sa-prop-enter absolute"
                style={{
                  left: '5cqw',
                  bottom: p.kind === 'lowerThird' ? '9cqh' : '5cqh',
                  padding: '1.6cqh 2.4cqw',
                  borderRadius: '1cqh',
                  background: 'linear-gradient(90deg, rgb(10 18 56 / 0.92), rgb(10 18 56 / 0.7))',
                  borderLeft: '0.6cqh solid #22d3ee',
                  boxShadow: '0 1cqh 3cqh rgb(0 0 0 / 0.4)',
                }}
              >
                <div style={{ fontFamily: "'Montserrat Variable'", fontWeight: 700, fontSize: '3.6cqh' }}>
                  {p.title}
                </div>
                {p.subtitle && <div style={{ fontSize: '2.3cqh', opacity: 0.85 }}>{p.subtitle}</div>}
              </div>
            );
          case 'logo':
            return (
              <img
                key={p.id}
                src={markUrl}
                alt=""
                className="sa-prop-enter absolute"
                style={{ right: '3cqw', top: '4cqh', height: '9cqh', opacity: 0.85 }}
              />
            );
          case 'clock':
            return <PropClock key={p.id} />;
          default:
            return null;
        }
      })}
    </>
  );
}

function PropClock() {
  const now = useNow();
  return (
    <div
      className="sa-prop-enter absolute tabular-nums"
      style={{
        right: '3cqw',
        bottom: '4cqh',
        fontSize: '3.4cqh',
        fontWeight: 600,
        textShadow: '0 0.3cqh 1cqh #000',
      }}
    >
      {formatClock(new Date(now))}
    </div>
  );
}

function MessageTicker({ text }: { text: string }) {
  return (
    <div
      className="sa-prop-enter absolute inset-x-0 top-0 text-center"
      style={{
        background: 'rgb(200 30 50 / 0.92)',
        padding: '1.2cqh 3cqw',
        fontSize: '3cqh',
        fontWeight: 600,
      }}
      role="status"
    >
      {text}
    </div>
  );
}

function AudienceTimers({ state }: { state: OutputState }) {
  const now = useNow();
  const visible = state.timers.filter((t) => t.showOnAudience);
  if (visible.length === 0) return null;
  return (
    <div className="absolute inset-x-0 bottom-[6cqh] flex justify-center gap-[4cqw]">
      {visible.map((t) => {
        const r = readTimer(t, now);
        return (
          <div key={t.id} className="text-center">
            <div
              className={`tabular-nums ${r.overrun && t.overrun === 'flash' ? 'sa-flash' : ''}`}
              style={{
                fontFamily: "'Montserrat Variable'",
                fontWeight: 700,
                fontSize: '12cqh',
                lineHeight: 1,
                color: r.overrun ? '#ff6b78' : '#fff',
                textShadow: '0 0.5cqh 2cqh rgb(0 0 0 / 0.5)',
              }}
            >
              {r.text}
            </div>
            <div style={{ fontSize: '2.4cqh', opacity: 0.8, marginTop: '1cqh' }}>{t.name}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================ Stage ================================ */

function Stage({ state }: { state: OutputState }) {
  const { t } = useTranslation();
  const now = useNow();
  const layout = state.stage.layoutId;
  const timers = state.timers.filter((x) => x.showOnStage);
  const big = layout === 'stage-pastor';
  return (
    <div
      className="sa-layer flex flex-col"
      style={{ background: '#05070c', padding: '2.5cqh 2.5cqw', gap: '2cqh' }}
    >
      {/* header row */}
      <div className="flex items-center justify-between" style={{ fontSize: '3cqh' }}>
        <span
          style={{
            padding: '0.6cqh 1.6cqw',
            borderRadius: '99px',
            background: '#16213d',
            color: '#9fd8ff',
            fontWeight: 600,
          }}
        >
          {t(`service.states.${state.serviceState}`)}
        </span>
        <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '5cqh' }}>
          {formatClock(new Date(now))}
        </span>
      </div>

      {state.stage.stageMessage && (
        <div
          className="sa-flash"
          style={{
            background: '#f5b53d',
            color: '#111',
            fontWeight: 700,
            fontSize: '4.4cqh',
            padding: '1.4cqh 2cqw',
            borderRadius: '1cqh',
          }}
        >
          {state.stage.stageMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1" style={{ gap: '2cqw' }}>
        {!big && (
          <div className="flex min-w-0 flex-[3] flex-col" style={{ gap: '2cqh' }}>
            <StageSlide
              label={t('stage.current')}
              slide={state.slide}
              size={state.slide?.kind === 'scripture' ? 5.4 : 7}
              accent
            />
            <StageSlide label={t('stage.next')} slide={state.nextSlide} size={4.2} />
          </div>
        )}
        <div className={`flex min-w-0 flex-col ${big ? 'flex-1' : 'flex-[1.3]'}`} style={{ gap: '2cqh' }}>
          {timers.length === 0 && <div style={{ fontSize: '3cqh', opacity: 0.4 }}>{t('stage.noTimers')}</div>}
          {timers.map((tm) => {
            const r = readTimer(tm, now);
            return (
              <div
                key={tm.id}
                style={{ background: '#0d1424', borderRadius: '1.4cqh', padding: '2cqh 2cqw' }}
              >
                <div style={{ fontSize: '2.6cqh', opacity: 0.7 }}>{tm.name}</div>
                <div
                  className={`tabular-nums ${r.overrun && tm.overrun === 'flash' ? 'sa-flash' : ''}`}
                  style={{
                    fontSize: big ? '22cqh' : '10cqh',
                    fontWeight: 700,
                    lineHeight: 1.05,
                    color: r.overrun
                      ? '#ff6b78'
                      : r.remainingMs !== null && r.remainingMs < 120000
                        ? '#f5b53d'
                        : '#fff',
                  }}
                >
                  {r.text}
                </div>
              </div>
            );
          })}
          {state.slide?.notes && (
            <div
              style={{
                fontSize: '3.2cqh',
                background: '#0d1424',
                borderRadius: '1.4cqh',
                padding: '2cqh 2cqw',
              }}
            >
              {state.slide.notes}
            </div>
          )}
        </div>
      </div>

      {state.aiTranscriptLine && (
        <div style={{ fontSize: '2.6cqh', opacity: 0.6, fontStyle: 'italic' }}>
          “{state.aiTranscriptLine}”
        </div>
      )}
      {(state.blackout || state.logo) && (
        <div style={{ fontSize: '2.6cqh', color: '#ff6b78', fontWeight: 700 }}>
          {state.blackout ? t('stage.audienceBlack') : t('stage.audienceLogo')}
        </div>
      )}
    </div>
  );
}

function StageSlide({
  label,
  slide,
  size,
  accent,
}: {
  label: string;
  slide: SlideContent | null;
  size: number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{
        background: '#0d1424',
        borderRadius: '1.4cqh',
        padding: '1.6cqh 2cqw',
        borderTop: `0.5cqh solid ${accent ? (slide?.groupColor ?? '#22d3ee') : '#2a3449'}`,
      }}
    >
      <div
        className="flex justify-between"
        style={{ fontSize: '2.4cqh', opacity: 0.7, marginBottom: '1cqh' }}
      >
        <span>{label}</span>
        <span>{slide?.groupName ?? ''}</span>
      </div>
      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={{
          fontSize: `${size}cqh`,
          fontWeight: accent ? 700 : 500,
          lineHeight: 1.2,
          whiteSpace: 'pre-line',
          opacity: accent ? 1 : 0.75,
        }}
      >
        {slide?.text ?? '—'}
      </div>
    </div>
  );
}

/* ================================ Diagnostics ================================ */

function TestPattern({ role }: { role: OutputRole }) {
  const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
  return (
    <div className="sa-output" style={{ cursor: 'default' }}>
      <div className="sa-layer flex">
        {bars.map((c) => (
          <div key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div
        className="sa-layer"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.35) 1px, transparent 1px)',
          backgroundSize: '10cqw 10cqh',
        }}
      />
      <div className="sa-layer" style={{ border: '0.4cqh solid #fff', margin: '5cqh 5cqw' }} />
      <div className="sa-layer grid place-items-center">
        <div
          style={{
            background: '#000',
            padding: '3cqh 5cqw',
            borderRadius: '2cqh',
            textAlign: 'center',
            fontSize: '6cqh',
            fontWeight: 700,
          }}
        >
          {role.toUpperCase()}
          <div style={{ fontSize: '3cqh', fontWeight: 500, opacity: 0.8 }}>
            {window.screen.width}×{window.screen.height} · {window.innerWidth}×{window.innerHeight}
          </div>
        </div>
      </div>
    </div>
  );
}

function Identify({ role }: { role: OutputRole }) {
  return (
    <div className="sa-layer grid place-items-center" style={{ background: 'rgb(30 64 255 / 0.85)' }}>
      <div style={{ fontSize: '16cqh', fontWeight: 800, letterSpacing: '0.06em' }}>{role.toUpperCase()}</div>
    </div>
  );
}
