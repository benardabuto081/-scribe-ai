import { evaluateLicense, GRACE_DAYS, localLicense, mockSign, type CachedLicense } from './license';
import { MockAuthProvider } from '@/mocks/authProvider';
import { AuthError } from './provider';

const DAY = 86_400_000;
const now = Date.parse('2026-11-14T12:00:00Z');

function account(lastValidatedDaysAgo: number, expiresInDays = 365): CachedLicense {
  const base = {
    id: 'lic-1',
    plan: 'church' as const,
    holder: 'admin@church.org',
    issuedAt: new Date(now - 400 * DAY).toISOString(),
    expiresAt: new Date(now + expiresInDays * DAY).toISOString(),
  };
  return {
    ...base,
    signature: mockSign(base),
    lastValidatedAt: new Date(now - lastValidatedDaysAgo * DAY).toISOString(),
  };
}

describe('license evaluation (never blocks the booth)', () => {
  it('Local Mode license is valid forever, online or offline', () => {
    const l = localLicense('Grace Church', new Date(now - 5000 * DAY));
    expect(evaluateLicense(l, now, false)).toEqual({ state: 'valid', plan: 'local' });
  });

  it('online account license is valid', () => {
    expect(evaluateLicense(account(200), now, true)).toEqual({ state: 'valid', plan: 'church' });
  });

  it('offline within the grace period counts down', () => {
    expect(evaluateLicense(account(10), now, false)).toEqual({
      state: 'grace',
      plan: 'church',
      daysLeft: GRACE_DAYS - 10,
    });
  });

  it('offline beyond the grace period only pauses cloud features', () => {
    expect(evaluateLicense(account(GRACE_DAYS + 1), now, false)).toEqual({
      state: 'graceExpired',
      plan: 'church',
    });
  });

  it('detects tampering and expiry', () => {
    expect(evaluateLicense({ ...account(1), plan: 'trial' }, now, true)).toEqual({ state: 'invalid' });
    expect(evaluateLicense(account(1, -1), now, true)).toEqual({ state: 'expired', plan: 'church' });
    expect(evaluateLicense(null, now, true)).toEqual({ state: 'missing' });
  });
});

describe('MockAuthProvider', () => {
  const auth = new MockAuthProvider(0);
  it('signs in and rejects bad credentials', async () => {
    await expect(auth.signIn('pastor@church.org', 'goodpassword')).resolves.toMatchObject({
      email: 'pastor@church.org',
    });
    await expect(auth.signIn('pastor@church.org', 'wrongpassword')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    await expect(auth.signIn('not-an-email', 'goodpassword')).rejects.toBeInstanceOf(AuthError);
  });
  it('validates account creation and invites', async () => {
    await expect(auth.createAccount('A', 'taken@example.com', 'goodpassword')).rejects.toMatchObject({
      code: 'email_taken',
    });
    await expect(auth.createAccount('A', 'a@b.co', 'short')).rejects.toMatchObject({ code: 'weak_password' });
    await expect(auth.joinWorkspace({ id: 'u', name: 'u', email: 'u@x.y' }, 'nope')).rejects.toMatchObject({
      code: 'invalid_code',
    });
  });
  it('issues a license that verifies', async () => {
    const lic = await auth.fetchLicense({ id: 'u', name: 'u', email: 'u@x.y' });
    expect(
      evaluateLicense({ ...lic, lastValidatedAt: new Date().toISOString() }, Date.now(), true),
    ).toMatchObject({ state: 'valid' });
  });
  it('fails clearly when offline', async () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(auth.signIn('a@b.co', 'goodpassword')).rejects.toMatchObject({ code: 'offline' });
    spy.mockRestore();
  });
});
