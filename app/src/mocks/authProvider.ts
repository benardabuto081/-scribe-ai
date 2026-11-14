import {
  AuthError,
  EMAIL_RE,
  MIN_PASSWORD,
  type AuthProvider,
  type AuthUser,
  type SignedLicense,
  type Workspace,
} from '@/features/auth/provider';
import { mockSign } from '@/features/auth/license';

/**
 * MOCK auth backend for Phase A. Behaves like a network service:
 *  - ~600 ms latency, fails with `offline` when the machine has no connection;
 *  - password "wrongpassword" → invalid credentials; "taken@example.com" → email taken;
 *  - invite code must be 6 characters (e.g. "GRACE1").
 * Replace with the real backend by implementing `AuthProvider`.
 */
const latency = (ms = 600) => new Promise((r) => setTimeout(r, ms));

function requireOnline() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AuthError('offline');
}

const userFor = (email: string, name?: string): AuthUser => ({
  id: `u-${email.toLowerCase()}`,
  email: email.toLowerCase(),
  name: name ?? email.split('@')[0] ?? email,
});

export class MockAuthProvider implements AuthProvider {
  constructor(private readonly delayMs = 600) {}

  async signIn(email: string, password: string): Promise<AuthUser> {
    requireOnline();
    await latency(this.delayMs);
    if (!EMAIL_RE.test(email)) throw new AuthError('invalid_email');
    if (password === 'wrongpassword' || password.length < MIN_PASSWORD)
      throw new AuthError('invalid_credentials');
    return userFor(email);
  }

  async signInWithGoogle(): Promise<AuthUser> {
    requireOnline();
    await latency(this.delayMs);
    return userFor('demo.operator@example.com', 'Demo Operator');
  }

  async createAccount(name: string, email: string, password: string): Promise<AuthUser> {
    requireOnline();
    await latency(this.delayMs);
    if (!EMAIL_RE.test(email)) throw new AuthError('invalid_email');
    if (email.toLowerCase() === 'taken@example.com') throw new AuthError('email_taken');
    if (password.length < MIN_PASSWORD) throw new AuthError('weak_password');
    return userFor(email, name);
  }

  async requestPasswordReset(email: string): Promise<void> {
    requireOnline();
    await latency(this.delayMs);
    if (!EMAIL_RE.test(email)) throw new AuthError('invalid_email');
  }

  async listWorkspaces(): Promise<Workspace[]> {
    requireOnline();
    await latency(this.delayMs / 2);
    return [{ id: 'ws-demo', name: 'Grace Fellowship (demo)', role: 'operator' }];
  }

  async createWorkspace(_user: AuthUser, name: string): Promise<Workspace> {
    requireOnline();
    await latency(this.delayMs);
    return { id: `ws-${name.toLowerCase().replace(/\W+/g, '-')}`, name, role: 'admin' };
  }

  async joinWorkspace(_user: AuthUser, inviteCode: string): Promise<Workspace> {
    requireOnline();
    await latency(this.delayMs);
    if (!/^[A-Z0-9]{6}$/i.test(inviteCode.trim())) throw new AuthError('invalid_code');
    return { id: `ws-${inviteCode.toLowerCase()}`, name: 'Joined workspace', role: 'operator' };
  }

  async fetchLicense(user: AuthUser): Promise<SignedLicense> {
    requireOnline();
    await latency(this.delayMs / 2);
    const now = new Date();
    const base = {
      id: `lic-${user.id}`,
      plan: 'trial' as const,
      holder: user.email,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
    };
    return { ...base, signature: mockSign(base) };
  }
}
