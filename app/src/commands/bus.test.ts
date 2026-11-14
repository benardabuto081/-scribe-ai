import { z } from 'zod';
import { __resetBus, canUndo, execute, onCommand, setAiGate, setPermissionProvider, undoLast } from './bus';
import { __resetRegistry, defineCommand, listCommands, register } from './registry';
import { useAudit } from './audit';
import type { CommandDef } from './types';

let counter = 0;

const inc = defineCommand({
  id: 'test.increment',
  category: 'app',
  labelKey: 'x',
  args: z.object({ by: z.number().int().positive().default(1) }),
  permission: 'operate',
  aiAllowed: true,
  handler: ({ by }) => {
    counter += by;
    return { result: counter, undo: () => void (counter -= by) };
  },
});

const adminOnly = defineCommand({
  id: 'test.adminOnly',
  category: 'app',
  labelKey: 'x',
  args: z.object({}),
  permission: 'admin',
  aiAllowed: false,
  handler: () => ({ result: 'ok' }),
});

const boom = defineCommand({
  id: 'test.boom',
  category: 'app',
  labelKey: 'x',
  args: z.object({}),
  permission: 'view',
  aiAllowed: true,
  handler: () => {
    throw new Error('kaboom');
  },
});

beforeEach(() => {
  __resetRegistry();
  __resetBus();
  useAudit.getState().clear();
  counter = 0;
  register(...([inc, adminOnly, boom] as CommandDef[]));
});

describe('registry', () => {
  it('lists registered commands sorted by id', () => {
    expect(listCommands().map((c) => c.id)).toEqual(['test.adminOnly', 'test.boom', 'test.increment']);
  });
  it('rejects duplicate ids', () => {
    expect(() => register(inc as CommandDef)).toThrow(/already registered/);
  });
  it('rejects malformed ids', () => {
    expect(() => register({ ...(inc as CommandDef), id: 'NoDot' })).toThrow(/Invalid command id/);
  });
});

describe('execute', () => {
  it('runs the handler with parsed args and defaults', async () => {
    const out = await execute('test.increment');
    expect(out).toMatchObject({ ok: true, result: 1 });
    await execute('test.increment', { by: 5 });
    expect(counter).toBe(6);
  });

  it('fails unknown commands', async () => {
    const out = await execute('nope.nothing');
    expect(out).toMatchObject({ ok: false, error: { code: 'unknown_command' } });
  });

  it('validates args with zod and does not run the handler', async () => {
    const out = await execute('test.increment', { by: -2 });
    expect(out).toMatchObject({ ok: false, error: { code: 'invalid_args' } });
    expect(counter).toBe(0);
  });

  it('captures handler exceptions as handler_error', async () => {
    const out = await execute('test.boom');
    expect(out).toMatchObject({ ok: false, error: { code: 'handler_error', message: 'kaboom' } });
  });

  it('notifies listeners', async () => {
    const seen: string[] = [];
    onCommand((o, id) => seen.push(`${id}:${o.ok}`));
    await execute('test.increment');
    await execute('test.boom');
    expect(seen).toEqual(['test.increment:true', 'test.boom:false']);
  });
});

describe('permissions', () => {
  it('forbids commands above the operator permission', async () => {
    setPermissionProvider(() => 'operate');
    expect(await execute('test.adminOnly')).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(await execute('test.increment')).toMatchObject({ ok: true });
  });
  it('viewer cannot operate', async () => {
    setPermissionProvider(() => 'view');
    expect(await execute('test.increment')).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(counter).toBe(0);
  });
});

describe('AI source', () => {
  it('blocks commands that are not aiAllowed', async () => {
    const out = await execute('test.adminOnly', {}, { source: 'ai' });
    expect(out).toMatchObject({ ok: false, error: { code: 'ai_not_allowed' } });
  });
  it('consults the AI gate', async () => {
    setAiGate(() => ({ code: 'ai_paused', message: 'paused' }));
    expect(await execute('test.increment', {}, { source: 'ai' })).toMatchObject({
      ok: false,
      error: { code: 'ai_paused' },
    });
    // Non-AI sources ignore the AI gate.
    expect(await execute('test.increment', {}, { source: 'keyboard' })).toMatchObject({ ok: true });
  });
});

describe('undo', () => {
  it('undoes the most recent undoable command', async () => {
    await execute('test.increment', { by: 2 });
    await execute('test.increment', { by: 3 });
    expect(counter).toBe(5);
    expect(await undoLast()).toBe('test.increment');
    expect(counter).toBe(2);
  });

  it('undoes only AI actions when asked (Undo last AI action)', async () => {
    await execute('test.increment', { by: 10 }, { source: 'ai', confidence: 0.99 });
    await execute('test.increment', { by: 1 }, { source: 'ui' });
    expect(counter).toBe(11);
    expect(canUndo('ai')).toBe(true);
    await undoLast('ai');
    expect(counter).toBe(1); // UI action remains
    expect(canUndo('ai')).toBe(false);
    expect(await undoLast('ai')).toBeNull();
  });

  it('marks the audit entry as undone', async () => {
    const out = await execute('test.increment');
    await undoLast();
    const entry = useAudit.getState().entries.find((e) => e.id === out.auditId);
    expect(entry?.status).toBe('undone');
  });
});

describe('audit log', () => {
  it('records source, args, status, explanation for every invocation', async () => {
    await execute('test.increment', { by: 4 }, { source: 'midi' });
    await execute('test.increment', { by: -1 }, { source: 'remote' });
    await execute('test.increment', {}, { source: 'ai', explanation: 'heard "next"', confidence: 0.9 });
    const [a, b, c] = useAudit.getState().entries;
    expect(a).toMatchObject({
      commandId: 'test.increment',
      source: 'midi',
      args: { by: 4 },
      status: 'ok',
      undoable: true,
    });
    expect(b).toMatchObject({ source: 'remote', status: 'error', errorCode: 'invalid_args' });
    expect(c).toMatchObject({ source: 'ai', explanation: 'heard "next"', confidence: 0.9 });
    expect(typeof a?.at).toBe('number');
    expect(a?.durationMs).toBeGreaterThanOrEqual(0);
  });
});
