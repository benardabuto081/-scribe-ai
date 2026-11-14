import en from '@/i18n/locales/en.json';
import sw from '@/i18n/locales/sw.json';
import { execute, initCommands, listCommands, undoLast } from './index';
import { useAudit } from './audit';
import { useLive } from '@/state/live';
import { useAi } from '@/state/ai';
import { useSession } from '@/state/session';
import { SOURCES } from './types';

type Tree = { [k: string]: string | Tree };
const has = (tree: Tree, key: string) =>
  key
    .split('.')
    .reduce<Tree | string | undefined>((n, k) => (typeof n === 'object' ? n[k] : undefined), tree) !==
  undefined;

const initialLive = useLive.getState();

beforeAll(() => initCommands());
beforeEach(() => {
  useLive.setState(initialLive, true);
  useAi.setState({ mode: 'assist', paused: false, proposals: [], autoThreshold: 0.85 });
  useSession.setState({ role: 'admin' });
  useAudit.getState().clear();
});

const program = () => useLive.getState().program;

describe('registered command set', () => {
  it('has at least 40 commands covering every required category', () => {
    const cmds = listCommands();
    expect(cmds.length).toBeGreaterThanOrEqual(40);
    const required = [
      'slide.trigger',
      'slide.next',
      'slide.previous',
      'slide.clear',
      'screen.clear',
      'screen.blackout',
      'screen.logo',
      'look.apply',
      'scripture.show',
      'song.load',
      'playlist.select',
      'playlist.nextItem',
      'timer.start',
      'timer.stop',
      'timer.reset',
      'message.show',
      'message.hide',
      'prop.toggle',
      'macro.run',
      'media.play',
      'media.stop',
      'audio.play',
      'audio.stop',
      'audio.fade',
      'ai.setMode',
      'ai.pause',
      'ai.resume',
      'ai.approve',
      'ai.dismiss',
      'ai.undoLast',
      'output.assignDisplay',
      'output.testPattern',
    ];
    const ids = new Set(cmds.map((c) => c.id));
    expect(required.filter((r) => !ids.has(r))).toEqual([]);
  });

  it('every command has an English and Kiswahili label', () => {
    const missing = listCommands()
      .filter((c) => !has(en as Tree, c.labelKey) || !has(sw as Tree, c.labelKey))
      .map((c) => c.labelKey);
    expect(missing).toEqual([]);
  });

  it('shortcuts are unique', () => {
    const shortcuts = listCommands().flatMap((c) => (c.shortcut ? [c.shortcut] : []));
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });
});

describe('live presentation flow', () => {
  it('load → next → next → previous → clear, with undo', async () => {
    expect(await execute('song.load', { songId: 'p-amazing-grace' })).toMatchObject({ ok: true });
    expect(program().slide).toBeNull();

    await execute('slide.next', {}, { source: 'keyboard' });
    expect(program().slide?.text).toMatch(/^Amazing grace!/);
    expect(program().nextSlide?.text).toMatch(/^I once was lost/);

    await execute('slide.next', {}, { source: 'ui' });
    expect(useLive.getState().programIndex).toBe(1);

    await execute('slide.previous', {}, { source: 'midi' });
    expect(useLive.getState().programIndex).toBe(0);

    await execute('slide.clear');
    expect(program().slide).toBeNull();

    await undoLast();
    expect(program().slide?.text).toMatch(/^Amazing grace!/);
  });

  it('the same command works from every source (button, keyboard, palette, remote, macro)', async () => {
    await execute('song.load', { songId: 'p-mighty-god' });
    for (const source of SOURCES.filter((s) => s !== 'ai')) {
      await execute('slide.trigger', { index: 2 }, { source });
      expect(program().slide?.text).toMatch(/^Mighty God/);
      await execute('slide.clear', {}, { source });
    }
    const sources = useAudit
      .getState()
      .entries.filter((e) => e.commandId === 'slide.trigger')
      .map((e) => e.source);
    expect(sources).toEqual(['ui', 'keyboard', 'midi', 'remote', 'macro']);
  });

  it('bumps the program version on every change (outputs ignore stale snapshots)', async () => {
    const v0 = program().version;
    await execute('screen.blackout');
    await execute('screen.blackout');
    expect(program().version).toBe(v0 + 2);
    expect(program().blackout).toBe(false);
  });

  it('scripture.show puts the first verse of a passage on air', async () => {
    const out = await execute('scripture.show', { reference: 'Jn 3:16-18' });
    expect(out).toMatchObject({ ok: true, result: 'John 3:16-18' });
    expect(program().slide).toMatchObject({ kind: 'scripture', reference: 'John 3:16' });
    expect(useLive.getState().adHoc?.slides).toHaveLength(3);
  });

  it('look.apply changes background, theme and stage layout', async () => {
    await execute('look.apply', { lookId: 'look-sermon' });
    expect(program().look.name).toBe('Sermon');
    expect(program().stage.layoutId).toBe('stage-pastor');
    expect(await execute('look.apply', { lookId: 'nope' })).toMatchObject({
      ok: false,
      error: { code: 'not_found' },
    });
  });

  it('macro.run executes each step as its own audited macro command', async () => {
    await execute('macro.run', { macroId: 'mac-sermon' });
    expect(program().look.id).toBe('look-sermon');
    expect(program().props.map((p) => p.id)).toContain('prop-speaker');
    expect(program().timers.find((t) => t.id === 'tm-sermon')?.startedAt).not.toBeNull();
    const steps = useAudit
      .getState()
      .entries.filter((e) => e.source === 'macro')
      .map((e) => e.commandId);
    expect(steps).toEqual(['look.apply', 'prop.toggle', 'timer.start']);
  });

  it('message.show fills template tokens', async () => {
    await execute('message.show', { messageId: 'msg-nursery', values: { name: 'Amani' } });
    expect(program().message?.text).toBe('Parent of Amani, please come to the nursery');
  });
});

describe('AI safety rules', () => {
  const propose = (confidence: number) =>
    execute(
      'ai.propose',
      {
        kind: 'lyric',
        heard: 'amazing grace how sweet the sound',
        decision: 'Show Amazing Grace, verse 1',
        why: 'Lyric match 0.94 against song index',
        confidence,
        commandId: 'song.load',
        args: { songId: 'p-amazing-grace', live: true },
      },
      { source: 'ai', confidence },
    );

  it('Assist (default): AI proposes, nothing goes live until approved', async () => {
    expect(useAi.getState().mode).toBe('assist');
    await propose(0.97);
    expect(useAi.getState().proposals[0]?.status).toBe('pending');
    expect(program().slide).toBeNull();

    // A direct AI action without approval is refused.
    expect(await execute('slide.next', {}, { source: 'ai', confidence: 0.99 })).toMatchObject({
      ok: false,
      error: { code: 'ai_needs_approval' },
    });

    // Operator approves (button / Ctrl+Enter / palette all run ai.approve).
    expect(await execute('ai.approve', {}, { source: 'keyboard' })).toMatchObject({ ok: true });
    expect(program().slide?.text).toMatch(/^Amazing grace!/);
    expect(useAi.getState().proposals[0]?.status).toBe('approved');

    // Undo last AI action reverts it.
    await execute('ai.undoLast');
    expect(program().slide).toBeNull();
  });

  it('Auto: high confidence executes, low confidence waits for the operator', async () => {
    useAi.setState({ mode: 'auto' });
    await propose(0.6);
    expect(useAi.getState().proposals[0]?.status).toBe('pending');
    expect(program().slide).toBeNull();

    await propose(0.95);
    expect(useAi.getState().proposals[0]?.status).toBe('auto');
    expect(program().slide?.text).toMatch(/^Amazing grace!/);
  });

  it('Pause AI blocks every AI action, including in Auto', async () => {
    useAi.setState({ mode: 'auto', paused: true });
    await propose(0.99);
    expect(program().slide).toBeNull();
    expect(await execute('slide.next', {}, { source: 'ai', confidence: 1 })).toMatchObject({
      ok: false,
      error: { code: 'ai_paused' },
    });
  });

  it('per-command AI permissions: blackout needs approval even in Auto', async () => {
    useAi.setState({ mode: 'auto' });
    expect(await execute('screen.blackout', {}, { source: 'ai', confidence: 1 })).toMatchObject({
      ok: false,
      error: { code: 'ai_not_allowed' },
    });
  });

  it('Manual: the AI never proposes actions', async () => {
    useAi.setState({ mode: 'manual' });
    await propose(0.99);
    expect(useAi.getState().proposals).toHaveLength(0);
  });

  it('commands not marked aiAllowed are refused for the AI', async () => {
    expect(await execute('ai.setMode', { mode: 'auto' }, { source: 'ai', approved: true })).toMatchObject({
      ok: false,
      error: { code: 'ai_not_allowed' },
    });
  });
});

describe('permissions with roles', () => {
  it('a Viewer cannot take slides; an Operator cannot assign displays', async () => {
    await execute('song.load', { songId: 'p-amazing-grace' });
    useSession.setState({ role: 'viewer' });
    expect(await execute('slide.next')).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    useSession.setState({ role: 'operator' });
    expect(await execute('slide.next')).toMatchObject({ ok: true });
    expect(await execute('output.testPattern', { role: 'audience' })).toMatchObject({
      ok: false,
      error: { code: 'forbidden' },
    });
  });
});
