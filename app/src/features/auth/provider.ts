import type { Role } from '@/state/session';

/**
 * Authentication backend contract. Phase A ships `MockAuthProvider` (src/mocks/authProvider.ts);
 * the real cloud backend implements this same interface later. Local Mode never touches it.
 */
export type AuthUser = { id: string; name: string; email: string };
export type Workspace = { id: string; name: string; role: Role };

export type AuthErrorCode =
  | 'offline'
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'invalid_email'
  | 'invalid_code'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string = code) {
    super(message);
    this.code = code;
  }
}

export type SignedLicense = {
  id: string;
  plan: 'local' | 'trial' | 'church';
  holder: string;
  issuedAt: string; // ISO
  /** Hard expiry of the subscription; null = perpetual (Local Mode). */
  expiresAt: string | null;
  signature: string;
};

export interface AuthProvider {
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  createAccount(name: string, email: string, password: string): Promise<AuthUser>;
  requestPasswordReset(email: string): Promise<void>;
  listWorkspaces(user: AuthUser): Promise<Workspace[]>;
  createWorkspace(user: AuthUser, name: string): Promise<Workspace>;
  joinWorkspace(user: AuthUser, inviteCode: string): Promise<Workspace>;
  /** Fetches a fresh signed license for the account (requires network). */
  fetchLicense(user: AuthUser): Promise<SignedLicense>;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;
