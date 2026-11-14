import { execute, initCommands } from './index';
import { installCommandFeedback } from './feedback';
import { useAudit } from './audit';
import { useToasts } from '@/design-system/components/Toast';

beforeAll(() => initCommands());
beforeEach(() => {
  useToasts.setState({ toasts: [] });
  useAudit.getState().clear();
});

describe('command failures are never silent', () => {
  it('a failed operator command shows a danger toast and is in the audit log', async () => {
    const uninstall = installCommandFeedback();
    const out = await execute('look.apply', { lookId: 'does-not-exist' }, { source: 'ui' });
    expect(out.ok).toBe(false);
    const [t] = useToasts.getState().toasts;
    expect(t).toMatchObject({ tone: 'danger', title: 'Apply look failed' });
    expect(t?.description).toMatch(/Look not found/);
    expect(useAudit.getState().entries.at(-1)).toMatchObject({ commandId: 'look.apply', status: 'error' });
    uninstall();
  });

  it('expected AI refusals are not toasted (they belong in the AI panel)', async () => {
    const uninstall = installCommandFeedback();
    await execute('slide.next', {}, { source: 'ai', confidence: 0.9 });
    expect(useToasts.getState().toasts).toHaveLength(0);
    uninstall();
  });
});
