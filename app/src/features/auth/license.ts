import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SignedLicense } from './provider';

/**
 * Cached license with a long offline grace period. Rules (CLAUDE.md "Offline-first"):
 *  - Nothing here ever blocks running a service. The worst state only shows a banner and pauses
 *    cloud features (sync, updates, team).
 *  - Local Mode has a perpetual local license and never needs the network.
 *  - Account licenses are re-validated when online; offline they stay valid for GRACE_DAYS after
 *    the last successful validation.
 *
 * Signature check: Phase A uses a mock signing scheme (`mockSign`) — flagged in FEATURE_STATUS.
 * The real backend will sign with an asymmetric key and the app will verify with a bundled public key.
 */
export const GRACE_DAYS = 90;
const DAY = 86_400_000;

export type CachedLicense = SignedLicense & { lastValidatedAt: string };

export type LicenseStatus =
  | { state: 'missing' }
  | { state: 'invalid' } // signature mismatch (tampered cache)
  | { state: 'valid'; plan: SignedLicense['plan'] }
  | { state: 'grace'; plan: SignedLicense['plan']; daysLeft: number } // offline, within grace
  | { state: 'graceExpired'; plan: SignedLicense['plan'] } // offline too long: cloud features paused
  | { state: 'expired'; plan: SignedLicense['plan'] }; // subscription ended: cloud features paused

function payload(l: SignedLicense) {
  return `${l.id}|${l.plan}|${l.holder}|${l.issuedAt}|${l.expiresAt ?? 'never'}`;
}

/** MOCK signature (FNV-1a over the payload with a dev key). Not cryptographically secure. */
export function mockSign(l: Omit<SignedLicense, 'signature'>): string {
  const s = `scribe-dev-key|${payload({ ...l, signature: '' })}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `mock-${h.toString(16).padStart(8, '0')}`;
}

export function verifySignature(l: SignedLicense): boolean {
  return l.signature === mockSign(l);
}

export function evaluateLicense(l: CachedLicense | null, now: number, online: boolean): LicenseStatus {
  if (!l) return { state: 'missing' };
  if (!verifySignature(l)) return { state: 'invalid' };
  if (l.plan === 'local') return { state: 'valid', plan: 'local' };
  if (l.expiresAt && Date.parse(l.expiresAt) < now) return { state: 'expired', plan: l.plan };
  if (online) return { state: 'valid', plan: l.plan };
  const elapsedDays = (now - Date.parse(l.lastValidatedAt)) / DAY;
  if (elapsedDays <= GRACE_DAYS) {
    return { state: 'grace', plan: l.plan, daysLeft: Math.max(0, Math.ceil(GRACE_DAYS - elapsedDays)) };
  }
  return { state: 'graceExpired', plan: l.plan };
}

export function localLicense(holder: string, now = new Date()): CachedLicense {
  const base = { id: 'local', plan: 'local' as const, holder, issuedAt: now.toISOString(), expiresAt: null };
  return { ...base, signature: mockSign(base), lastValidatedAt: now.toISOString() };
}

type LicenseStore = {
  license: CachedLicense | null;
  setLicense: (l: CachedLicense | null) => void;
};

export const useLicense = create<LicenseStore>()(
  persist((set) => ({ license: null, setLicense: (license) => set({ license }) }), {
    name: 'scribe.license',
  }),
);
