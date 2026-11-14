import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  HardDrive,
  KeyRound,
  Languages,
  LogIn,
  Mail,
  MonitorPlay,
  Palette,
  ShieldCheck,
  UserPlus,
  Users,
  WifiOff,
} from 'lucide-react';
import {
  Badge,
  Button,
  cn,
  Field,
  Icon,
  Input,
  LogoLockup,
  LogoMark,
  Segmented,
  Spinner,
} from '@/design-system';
import { useSettings } from '@/state/settings';
import { ROLES, type Role } from '@/state/session';
import { AuthError, EMAIL_RE, MIN_PASSWORD, type Workspace } from './provider';
import { evaluateLicense, useLicense } from './license';
import {
  completeAccountSignIn,
  continueInLocalMode,
  finishAccountSetup,
  getAuth,
  getPendingUser,
  nextRoute,
} from './session';

/* ---------------------------------------------------------------- layout */

function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.language);
  const setLang = useSettings((s) => s.setLanguage);
  return (
    <div className="flex h-full overflow-auto bg-canvas">
      <aside className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden border-r border-line p-10 lg:flex">
        <div aria-hidden className="absolute inset-0 bg-brand-gradient-soft" />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-40 size-[520px] rounded-full bg-brand-600 opacity-25 blur-[120px]"
        />
        <div className="relative">
          <LogoLockup height={64} />
        </div>
        <div className="relative flex flex-col gap-5">
          <h2 className="font-display text-3xl leading-tight font-semibold">{t('auth.heroTitle')}</h2>
          <ul className="flex flex-col gap-3 text-sm text-fg-muted">
            {(['heroPoint1', 'heroPoint2', 'heroPoint3'] as const).map((k, i) => (
              <li key={k} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-md bg-surface-3 text-accent-fg">
                  <Icon icon={[MonitorPlay, WifiOff, ShieldCheck][i] ?? MonitorPlay} size={16} />
                </span>
                {t(`auth.${k}`)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-fg-subtle">{t('auth.footer')}</p>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 p-4">
          <Icon icon={Languages} size={16} className="text-fg-subtle" />
          <Segmented
            size="sm"
            label={t('settings.language')}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'en', label: 'English' },
              { value: 'sw', label: 'Kiswahili' },
            ]}
          />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}

function Heading({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: typeof LogIn }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <span className="lg:hidden">
        <LogoMark size={40} />
      </span>
      {icon && (
        <span className="hidden size-11 place-items-center rounded-xl border border-line bg-brand-gradient-soft text-accent-fg lg:grid">
          <Icon icon={icon} size={20} />
        </span>
      )}
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {error}
    </p>
  );
}

function useAuthErrorText() {
  const { t } = useTranslation();
  return (e: unknown) =>
    e instanceof AuthError
      ? t(`auth.errors.${e.code}`, { defaultValue: e.message })
      : t('auth.errors.unknown');
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-fg-subtle">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ---------------------------------------------------------------- splash */

export function SplashScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const license = useLicense((s) => s.license);
  const [phase, setPhase] = useState<'checking' | 'done'>('checking');
  // Evaluated once on mount (local cache only — never blocks).
  const [status] = useState(() => evaluateLicense(license, Date.now(), navigator.onLine));

  useEffect(() => {
    // The license check is local (cached) and never blocks; the delay only lets the brand breathe.
    const id = window.setTimeout(() => {
      setPhase('done');
      navigate(nextRoute(), { replace: true });
    }, 900);
    return () => window.clearTimeout(id);
  }, [navigate]);

  return (
    <div className="grid h-full place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-6">
        <LogoLockup height={84} />
        <div className="flex items-center gap-3 text-sm text-fg-muted" role="status">
          {phase === 'checking' ? <Spinner label={t('auth.splash.checking')} /> : null}
          {status.state === 'grace' && (
            <Badge tone="warn" icon={WifiOff}>
              {t('auth.license.grace', { days: status.daysLeft })}
            </Badge>
          )}
          {(status.state === 'graceExpired' || status.state === 'expired') && (
            <Badge tone="warn">{t(`auth.license.${status.state}`)}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sign in */

export function SignInScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorText = useAuthErrorText();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const offline = !navigator.onLine;

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) return setError(t('auth.errors.invalid_email'));
    setBusy('email');
    try {
      await completeAccountSignIn(await getAuth().signIn(email, password));
      navigate('/auth/workspace');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    setError(null);
    setBusy('google');
    try {
      await completeAccountSignIn(await getAuth().signInWithGoogle());
      navigate('/auth/workspace');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  function local() {
    continueInLocalMode();
    navigate(nextRoute());
  }

  return (
    <AuthLayout>
      <Heading title={t('auth.signIn.title')} subtitle={t('auth.signIn.subtitle')} icon={LogIn} />
      <Button
        variant="brand"
        size="lg"
        block
        icon={HardDrive}
        onClick={local}
        data-selftest="local-mode"
        autoFocus
      >
        {t('auth.signIn.localMode')}
      </Button>
      <p className="mt-2 text-xs text-fg-subtle">{t('auth.signIn.localModeHint')}</p>
      <Divider label={t('auth.signIn.orAccount')} />
      {offline && (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn">
          <Icon icon={WifiOff} size={16} />
          {t('auth.signIn.offlineNote')}
        </p>
      )}
      <form onSubmit={(e) => void signIn(e)} className="flex flex-col gap-4" noValidate>
        <Field label={t('auth.email')}>
          {(p) => (
            <Input
              {...p}
              type="email"
              autoComplete="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('auth.password')}>
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="current-password"
              icon={KeyRound}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <div className="-mt-2 flex justify-end">
          <Link to="/auth/forgot" className="focus-ring rounded-xs text-xs text-accent-fg hover:underline">
            {t('auth.signIn.forgot')}
          </Link>
        </div>
        <FormError error={error} />
        <Button type="submit" variant="primary" block loading={busy === 'email'} disabled={busy !== null}>
          {t('auth.signIn.submit')}
        </Button>
        <Button block onClick={() => void google()} loading={busy === 'google'} disabled={busy !== null}>
          {t('auth.signIn.google')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-fg-muted">
        {t('auth.signIn.noAccount')}{' '}
        <Link to="/auth/create" className="focus-ring rounded-xs text-accent-fg hover:underline">
          {t('auth.signIn.createLink')}
        </Link>
      </p>
    </AuthLayout>
  );
}

/* ---------------------------------------------------------------- create account */

export function CreateAccountScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorText = useAuthErrorText();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weak = password.length > 0 && password.length < MIN_PASSWORD;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t('auth.errors.nameRequired'));
    if (!EMAIL_RE.test(email)) return setError(t('auth.errors.invalid_email'));
    if (password.length < MIN_PASSWORD) return setError(t('auth.errors.weak_password'));
    setBusy(true);
    try {
      await completeAccountSignIn(await getAuth().createAccount(name, email, password));
      navigate('/auth/workspace');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <BackLink to="/auth/sign-in" />
      <Heading title={t('auth.create.title')} subtitle={t('auth.create.subtitle')} icon={UserPlus} />
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
        <Field label={t('auth.name')}>
          {(p) => (
            <Input
              {...p}
              autoFocus
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('auth.email')}>
          {(p) => (
            <Input {...p} type="email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Field>
        <Field
          label={t('auth.password')}
          hint={t('auth.create.passwordHint', { n: MIN_PASSWORD })}
          error={weak ? t('auth.errors.weak_password') : undefined}
        >
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="new-password"
              icon={KeyRound}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <FormError error={error} />
        <Button type="submit" variant="primary" block loading={busy}>
          {t('auth.create.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}

function BackLink({ to }: { to: string }) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className="focus-ring mb-4 inline-flex h-10 items-center gap-1.5 rounded-md text-sm text-fg-muted hover:text-fg"
    >
      <Icon icon={ArrowLeft} size={16} />
      {t('common.back')}
    </Link>
  );
}

/* ---------------------------------------------------------------- forgot password */

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const errorText = useAuthErrorText();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) return setError(t('auth.errors.invalid_email'));
    setState('busy');
    try {
      await getAuth().requestPasswordReset(email);
      setState('sent');
    } catch (err) {
      setError(errorText(err));
      setState('idle');
    }
  }

  return (
    <AuthLayout>
      <BackLink to="/auth/sign-in" />
      {state === 'sent' ? (
        <div className="flex flex-col items-start gap-4" role="status">
          <span className="grid size-12 place-items-center rounded-xl bg-success-soft text-success">
            <Icon icon={CheckCircle2} size={22} />
          </span>
          <h1 className="text-2xl font-semibold">{t('auth.forgot.sentTitle')}</h1>
          <p className="text-sm text-fg-muted">{t('auth.forgot.sentBody', { email })}</p>
        </div>
      ) : (
        <>
          <Heading title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} icon={KeyRound} />
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
            <Field label={t('auth.email')}>
              {(p) => (
                <Input
                  {...p}
                  autoFocus
                  type="email"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
            <FormError error={error} />
            <Button type="submit" variant="primary" block loading={state === 'busy'}>
              {t('auth.forgot.submit')}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

/* ---------------------------------------------------------------- workspace */

export function WorkspaceScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorText = useAuthErrorText();
  const user = getPendingUser();
  const [mode, setMode] = useState<'pick' | 'create' | 'join'>('pick');
  const [list, setList] = useState<Workspace[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAuth()
      .listWorkspaces(user)
      .then((ws) => !cancelled && setList(ws))
      .catch((e: unknown) => !cancelled && setLoadError(errorText(e)));
    return () => {
      cancelled = true;
    };
  }, [user, errorText]);

  if (!user) {
    // Direct navigation without signing in.
    return (
      <AuthLayout>
        <Heading title={t('auth.workspace.title')} subtitle={t('auth.workspace.signInFirst')} />
        <Button variant="primary" onClick={() => navigate('/auth/sign-in')}>
          {t('auth.signIn.submit')}
        </Button>
      </AuthLayout>
    );
  }

  const choose = (ws: Workspace) => navigate('/auth/role', { state: ws });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      choose(
        mode === 'create'
          ? await getAuth().createWorkspace(user, name)
          : await getAuth().joinWorkspace(user, code),
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <Heading
        title={t('auth.workspace.title')}
        subtitle={t('auth.workspace.subtitle', { name: user.name })}
        icon={Building2}
      />
      <Segmented
        label={t('auth.workspace.title')}
        value={mode}
        onChange={setMode}
        className="mb-5"
        options={[
          { value: 'pick', label: t('auth.workspace.mine') },
          { value: 'create', label: t('auth.workspace.create') },
          { value: 'join', label: t('auth.workspace.join') },
        ]}
      />
      {mode === 'pick' &&
        (loadError ? (
          <FormError error={loadError} />
        ) : list === null ? (
          <Spinner />
        ) : list.length === 0 ? (
          <p className="text-sm text-fg-muted">{t('auth.workspace.none')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((ws) => (
              <li key={ws.id}>
                <button
                  type="button"
                  onClick={() => choose(ws)}
                  className="focus-ring flex h-14 w-full cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface-2 px-4 text-left hover:border-line-strong hover:bg-surface-3"
                >
                  <Icon icon={Building2} size={18} className="text-accent-fg" />
                  <span className="flex-1 font-medium">{ws.name}</span>
                  <Badge>{t(`roles.${ws.role}`)}</Badge>
                </button>
              </li>
            ))}
          </ul>
        ))}
      {mode !== 'pick' && (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
          {mode === 'create' ? (
            <Field label={t('auth.workspace.churchName')}>
              {(p) => <Input {...p} autoFocus value={name} onChange={(e) => setName(e.target.value)} />}
            </Field>
          ) : (
            <Field label={t('auth.workspace.inviteCode')} hint={t('auth.workspace.inviteHint')}>
              {(p) => (
                <Input
                  {...p}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              )}
            </Field>
          )}
          <FormError error={error} />
          <Button
            type="submit"
            variant="primary"
            block
            loading={busy}
            disabled={mode === 'create' ? !name.trim() : !code.trim()}
          >
            {mode === 'create' ? t('auth.workspace.createSubmit') : t('auth.workspace.joinSubmit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

/* ---------------------------------------------------------------- role */

const ROLE_ICONS: Record<Role, typeof Users> = {
  admin: ShieldCheck,
  operator: MonitorPlay,
  planner: Users,
  designer: Palette,
  viewer: LogIn,
};

export function RoleScreen({ workspace }: { workspace: Workspace | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(workspace?.role ?? 'operator');
  if (!workspace) {
    return (
      <AuthLayout>
        <Heading title={t('auth.role.title')} subtitle={t('auth.workspace.signInFirst')} />
        <Button variant="primary" onClick={() => navigate('/auth/sign-in')}>
          {t('auth.signIn.submit')}
        </Button>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout>
      <BackLink to="/auth/workspace" />
      <Heading
        title={t('auth.role.title')}
        subtitle={t('auth.role.subtitle', { name: workspace.name })}
        icon={Users}
      />
      <div role="radiogroup" aria-label={t('auth.role.title')} className="flex flex-col gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={cn(
              'focus-ring flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 text-left',
              role === r
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-surface-2 hover:border-line-strong',
            )}
          >
            <Icon icon={ROLE_ICONS[r]} size={18} className="text-accent-fg" />
            <span className="flex flex-1 flex-col">
              <span className="font-medium">{t(`roles.${r}`)}</span>
              <span className="text-xs text-fg-muted">{t(`roles.${r}Desc`)}</span>
            </span>
          </button>
        ))}
      </div>
      <Button
        variant="primary"
        block
        className="mt-5"
        onClick={() => {
          finishAccountSetup(workspace, role);
          navigate(nextRoute());
        }}
      >
        {t('common.continue')}
      </Button>
    </AuthLayout>
  );
}
