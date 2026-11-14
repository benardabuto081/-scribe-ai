import { USE_MOCKS } from '@/mocks/flag';
import { MockAuthProvider } from '@/mocks/authProvider';
import { useSession, type Role } from '@/state/session';
import { localLicense, useLicense } from './license';
import { AuthError, type AuthProvider, type AuthUser, type Workspace } from './provider';

/** Used when no backend exists yet and mocks are off: account features clearly unavailable. */
class UnavailableAuthProvider implements AuthProvider {
  private fail(): never {
    throw new AuthError('offline', 'Account sign-in is not available in this build. Use Local Mode.');
  }
  signIn = async () => this.fail();
  signInWithGoogle = async () => this.fail();
  createAccount = async () => this.fail();
  requestPasswordReset = async () => this.fail();
  listWorkspaces = async () => this.fail();
  createWorkspace = async () => this.fail();
  joinWorkspace = async () => this.fail();
  fetchLicense = async () => this.fail();
}

let provider: AuthProvider = USE_MOCKS ? new MockAuthProvider() : new UnavailableAuthProvider();
export const getAuth = () => provider;
/** Tests / future real backend. */
export function setAuthProvider(p: AuthProvider) {
  provider = p;
}

/** Pending account between sign-in and workspace/role selection. */
let pendingUser: AuthUser | null = null;
export const getPendingUser = () => pendingUser;

/** Local Mode: fully offline, perpetual local license, local admin. No network call is made. */
export function continueInLocalMode(churchName?: string) {
  const name = churchName?.trim() || 'Local workspace';
  useLicense.getState().setLicense(localLicense(name));
  useSession
    .getState()
    .setSession({ id: 'local', name: 'Local operator', mode: 'local' }, { id: 'local', name });
  useSession.getState().setRole('admin');
}

export async function completeAccountSignIn(user: AuthUser) {
  pendingUser = user;
  const lic = await getAuth().fetchLicense(user);
  useLicense.getState().setLicense({ ...lic, lastValidatedAt: new Date().toISOString() });
}

export function finishAccountSetup(ws: Workspace, role: Role) {
  const user = pendingUser;
  if (!user) throw new AuthError('unknown', 'No signed-in account');
  useSession.getState().setSession({ id: user.id, name: user.name, email: user.email, mode: 'account' }, ws);
  useSession.getState().setRole(role);
  pendingUser = null;
}

/** Where the app should go now, given the stored session. */
export function nextRoute(): string {
  const s = useSession.getState();
  if (!s.user) return '/auth/sign-in';
  if (!s.onboarded) return '/onboarding';
  return '/home';
}
