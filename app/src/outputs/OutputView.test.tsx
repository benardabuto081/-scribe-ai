import { act, render, screen } from '@testing-library/react';
import { OutputView } from './OutputView';
import { publishOutputState } from './bridge';
import { EMPTY_OUTPUT_STATE, type OutputState } from './types';
import { readTimer } from './timerText';

const state = (patch: Partial<OutputState>): OutputState => ({
  ...EMPTY_OUTPUT_STATE,
  version: Date.now(),
  updatedAt: Date.now(),
  ...patch,
});

const slide = {
  key: 'p:1',
  text: 'Amazing grace! How sweet the sound',
  kind: 'lyric' as const,
  groupName: 'Verse 1',
};
const next = { key: 'p:2', text: 'I once was lost, but now am found;', kind: 'lyric' as const };

describe('output windows', () => {
  it('audience renders the snapshot published by the Studio (survives without the Studio)', async () => {
    await publishOutputState(state({ slide, message: { id: 'm', text: 'Parent of Amani, please come' } }));
    render(<OutputView role="audience" />);
    expect(screen.getByText(/Amazing grace!/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Parent of Amani');
  });

  it('audience hides the slide layer when the look disables it', async () => {
    await publishOutputState(
      state({
        slide,
        look: { ...EMPTY_OUTPUT_STATE.look, layers: { ...EMPTY_OUTPUT_STATE.look.layers, slide: false } },
      }),
    );
    render(<OutputView role="audience" />);
    expect(screen.queryByText(/Amazing grace!/)).not.toBeInTheDocument();
  });

  it('stage shows current and next slide and a stage message', async () => {
    await publishOutputState(
      state({ slide, nextSlide: next, stage: { layoutId: 'stage-lyrics', stageMessage: 'Wrap up' } }),
    );
    render(<OutputView role="stage" />);
    expect(screen.getByText(/Amazing grace!/)).toBeInTheDocument();
    expect(screen.getByText(/I once was lost/)).toBeInTheDocument();
    expect(screen.getByText('Wrap up')).toBeInTheDocument();
  });

  it('ignores stale snapshots (lower version)', async () => {
    await publishOutputState(state({ slide, version: 1000 }));
    render(<OutputView role="audience" />);
    const ch = new BroadcastChannel('scribe-output');
    await act(async () => {
      ch.postMessage(state({ slide: next, version: 999 }));
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.getByText(/Amazing grace!/)).toBeInTheDocument();
    ch.close();
  });

  it('shows a test pattern when enabled for that role only', async () => {
    await publishOutputState(state({ slide, testPattern: { audience: true, stage: false } }));
    const { unmount } = render(<OutputView role="audience" />);
    expect(screen.getByText('AUDIENCE')).toBeInTheDocument();
    unmount();
    render(<OutputView role="stage" />);
    expect(screen.queryByText('STAGE')).not.toBeInTheDocument();
  });
});

describe('readTimer', () => {
  const base = {
    id: 't',
    name: 'Sermon',
    accumulatedMs: 0,
    overrun: 'flash' as const,
    showOnAudience: false,
    showOnStage: true,
  };
  it('counts down and reports overrun', () => {
    const t = { ...base, mode: 'countdown' as const, durationSec: 60, startedAt: 0 };
    expect(readTimer(t, 15_000).text).toBe('0:45');
    const over = readTimer(t, 75_000);
    expect(over).toMatchObject({ text: '-0:15', overrun: true });
  });
  it('pauses using accumulated time', () => {
    const t = { ...base, mode: 'elapsed' as const, startedAt: null, accumulatedMs: 125_000 };
    expect(readTimer(t, 999_999).text).toBe('2:05');
  });
  it('stop-overrun clamps at zero', () => {
    const t = {
      ...base,
      mode: 'countdown' as const,
      durationSec: 10,
      startedAt: 0,
      overrun: 'stop' as const,
    };
    expect(readTimer(t, 20_000).text).toBe('0:00');
  });
});
