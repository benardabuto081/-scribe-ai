import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Cpu,
  Download,
  FolderOpen,
  HardDrive,
  ImagePlus,
  Languages,
  MemoryStick,
  Mic,
  MonitorPlay,
  Music,
  PartyPopper,
  Play,
  ScanEye,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Chip,
  cn,
  Field,
  Icon,
  Input,
  LogoMark,
  Meter,
  Segmented,
  Select,
  SoonTag,
  Spinner,
  Textarea,
  toast,
} from '@/design-system';
import { execute } from '@/commands';
import { useSettings } from '@/state/settings';
import { useSession } from '@/state/session';
import { refreshMonitors, useOutputs } from '@/outputs/windows';
import { OUTPUT_ROLES } from '@/outputs/types';
import { parseLyrics } from '@/features/songs/parseLyrics';
import { nextStep, prevStep, STEPS, stepIndex, useWizard, validateModelPack, type StepId } from './wizard';

const STEP_ICONS: Record<StepId, LucideIcon> = {
  church: Building2,
  languages: Languages,
  hardware: Cpu,
  audio: Mic,
  models: HardDrive,
  displays: MonitorPlay,
  import: Music,
  team: Users,
  finish: PartyPopper,
};

/* ================================================================== shell */

export function OnboardingRoute() {
  const { step } = useParams();
  const current = useWizard((s) => s.current);
  const user = useSession((s) => s.user);
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  if (!step || !STEPS.some((s) => s.id === step)) return <Navigate to={`/onboarding/${current}`} replace />;
  return <Onboarding step={step as StepId} />;
}

function Onboarding({ step }: { step: StepId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { visited, skipped, goTo, markSkipped } = useWizard();
  const [canNext, setCanNext] = useState(true);
  const idx = stepIndex(step);
  const def = STEPS[idx];

  useEffect(() => goTo(step), [step, goTo]); // persist resume point

  const go = useCallback((s: StepId | null) => s && navigate(`/onboarding/${s}`), [navigate]);
  const next = () => go(nextStep(step));
  const back = () => go(prevStep(step));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        go(prevStep(step));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, go]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (canNext && step !== 'finish') next();
  }

  return (
    <div className="flex h-full bg-canvas">
      <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r border-line bg-surface-1 p-6 md:flex">
        <div className="flex items-center gap-3">
          <LogoMark size={32} />
          <span className="font-display font-semibold">{t('onboarding.title')}</span>
        </div>
        <ol className="flex flex-col gap-1" aria-label={t('onboarding.steps')}>
          {STEPS.map((s, i) => {
            const done = i < idx || (visited.includes(s.id) && i !== idx && i < idx);
            const isSkipped = skipped.includes(s.id) && i < idx;
            const reachable = visited.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => go(s.id)}
                  aria-current={i === idx ? 'step' : undefined}
                  className={cn(
                    'focus-ring flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-sm',
                    i === idx ? 'bg-accent-soft text-fg' : 'text-fg-muted',
                    reachable ? 'cursor-pointer hover:bg-surface-3' : 'cursor-default opacity-50',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full border text-2xs font-semibold',
                      done && !isSkipped
                        ? 'border-success bg-success-soft text-success'
                        : 'border-line-strong',
                    )}
                  >
                    {done && !isSkipped ? <Icon icon={Check} size={13} /> : i + 1}
                  </span>
                  <span className="flex-1">{t(`onboarding.${s.id}.short`)}</span>
                  {isSkipped && <span className="text-2xs text-fg-subtle">{t('onboarding.skipped')}</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col" noValidate data-step={step}>
        <div className="h-1 bg-surface-3">
          <div
            className="h-full bg-brand-gradient transition-[width] duration-slow ease-sa"
            style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-10">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-brand-gradient-soft text-accent-fg">
                <Icon icon={STEP_ICONS[step]} size={22} />
              </span>
              <div>
                <p className="text-xs font-medium tracking-wider text-fg-subtle uppercase">
                  {t('onboarding.progress', { n: idx + 1, total: STEPS.length })}
                </p>
                <h1 className="text-2xl font-semibold">{t(`onboarding.${step}.title`)}</h1>
                <p className="text-sm text-fg-muted">{t(`onboarding.${step}.subtitle`)}</p>
              </div>
            </div>
            <StepBody step={step} setCanNext={setCanNext} />
          </div>
        </div>
        <footer className="flex items-center gap-2 border-t border-line bg-surface-1 px-8 py-3">
          <Button icon={ArrowLeft} variant="ghost" onClick={back} disabled={idx === 0}>
            {t('common.back')}
          </Button>
          <span className="text-xs text-fg-subtle">{t('onboarding.keys')}</span>
          <div className="flex-1" />
          {def?.skippable && (
            <Button
              variant="ghost"
              data-selftest="wizard-skip"
              onClick={() => {
                markSkipped(step);
                next();
              }}
            >
              {t('onboarding.skip')}
            </Button>
          )}
          {step !== 'finish' && (
            <Button
              type="submit"
              variant="primary"
              iconRight={ArrowRight}
              disabled={!canNext}
              data-selftest="wizard-next"
            >
              {t('onboarding.next')}
            </Button>
          )}
        </footer>
      </form>
    </div>
  );
}

function StepBody({ step, setCanNext }: { step: StepId; setCanNext: (v: boolean) => void }) {
  switch (step) {
    case 'church':
      return <ChurchStep setCanNext={setCanNext} />;
    case 'languages':
      return <LanguagesStep setCanNext={setCanNext} />;
    case 'hardware':
      return <HardwareStep setCanNext={setCanNext} />;
    case 'audio':
      return <AudioStep setCanNext={setCanNext} />;
    case 'models':
      return <ModelsStep setCanNext={setCanNext} />;
    case 'displays':
      return <DisplaysStep setCanNext={setCanNext} />;
    case 'import':
      return <ImportStep setCanNext={setCanNext} />;
    case 'team':
      return <TeamStep setCanNext={setCanNext} />;
    case 'finish':
      return <FinishStep setCanNext={setCanNext} />;
  }
}

type StepProps = { setCanNext: (v: boolean) => void };

function useAlwaysNext(setCanNext: (v: boolean) => void) {
  useEffect(() => setCanNext(true), [setCanNext]);
}

/* ================================================================== 1. church */

const COUNTRIES = [
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'Burundi',
  'South Sudan',
  'Ethiopia',
  'Nigeria',
  'Ghana',
  'South Africa',
  'Other',
];

function ChurchStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  const church = useWizard((s) => s.data.church);
  const patch = useWizard((s) => s.patch);
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  useEffect(() => setCanNext(church.name.trim().length > 1), [church.name, setCanNext]);

  function onLogo(file: File | undefined) {
    setLogoError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) return setLogoError(t('onboarding.church.logoType'));
    if (file.size > 2 * 1024 * 1024) return setLogoError(t('onboarding.church.logoSize'));
    const reader = new FileReader();
    reader.onload = () => patch('church', { logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <Field label={t('onboarding.church.name')} hint={t('onboarding.church.nameHint')}>
        {(p) => (
          <Input
            {...p}
            autoFocus
            data-selftest="church-name"
            value={church.name}
            onChange={(e) => patch('church', { name: e.target.value })}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('onboarding.church.city')}>
          {(p) => (
            <Input {...p} value={church.city} onChange={(e) => patch('church', { city: e.target.value })} />
          )}
        </Field>
        <Field label={t('onboarding.church.country')}>
          {(p) => (
            <Select
              id={p.id}
              value={church.country}
              onValueChange={(country) => patch('church', { country })}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
            />
          )}
        </Field>
      </div>
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-1">
          {church.logoDataUrl ? (
            <img
              src={church.logoDataUrl}
              alt={t('onboarding.church.logo')}
              className="size-full object-contain"
            />
          ) : (
            <Icon icon={ImagePlus} size={24} className="text-fg-subtle" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('onboarding.church.logo')}</span>
          <div className="flex gap-2">
            <Button icon={ImagePlus} onClick={() => fileRef.current?.click()}>
              {church.logoDataUrl ? t('onboarding.church.replaceLogo') : t('onboarding.church.chooseLogo')}
            </Button>
            {church.logoDataUrl && (
              <Button variant="ghost" icon={X} onClick={() => patch('church', { logoDataUrl: null })}>
                {t('common.remove')}
              </Button>
            )}
          </div>
          <span className={cn('text-xs', logoError ? 'text-danger' : 'text-fg-subtle')}>
            {logoError ?? t('onboarding.church.logoHint')}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onLogo(e.target.files?.[0])}
          />
        </div>
      </div>
    </Card>
  );
}

/* ================================================================== 2. languages */

const SERVICE_LANGS = ['en', 'sw', 'luo', 'ki', 'lg', 'fr'] as const;

function LanguagesStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  const data = useWizard((s) => s.data.languages);
  const patch = useWizard((s) => s.patch);
  const setLanguage = useSettings((s) => s.setLanguage);
  useEffect(() => setCanNext(data.service.length > 0), [data.service.length, setCanNext]);
  const toggle = (l: string) =>
    patch('languages', {
      service: data.service.includes(l) ? data.service.filter((x) => x !== l) : [...data.service, l],
    });
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-sm font-semibold">{t('onboarding.languages.ui')}</h2>
        <Segmented
          label={t('onboarding.languages.ui')}
          value={data.ui}
          onChange={(ui) => {
            patch('languages', { ui });
            setLanguage(ui);
          }}
          options={[
            { value: 'en', label: 'English' },
            { value: 'sw', label: 'Kiswahili' },
          ]}
        />
      </Card>
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-sm font-semibold">{t('onboarding.languages.service')}</h2>
        <p className="text-xs text-fg-muted">{t('onboarding.languages.serviceHint')}</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_LANGS.map((l) => (
            <Chip key={l} selected={data.service.includes(l)} onClick={() => toggle(l)}>
              {t(`languages.${l}`)}
            </Chip>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-sm font-semibold">{t('onboarding.languages.translations')}</h2>
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface-1 px-3 py-2.5">
          <Icon icon={BookOpen} size={18} className="text-accent-fg" />
          <span className="flex-1 text-sm">King James Version (KJV)</span>
          <Badge tone="success" icon={Check}>
            {t('onboarding.languages.bundled')}
          </Badge>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-dashed border-line-strong px-3 py-2.5">
          <Icon icon={Download} size={18} className="text-fg-subtle" />
          <span className="flex-1 text-sm text-fg-muted">{t('onboarding.languages.importLicensed')}</span>
          <SoonTag />
        </div>
      </Card>
    </div>
  );
}

/* ================================================================== 3. hardware */

type Check = {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  ok: boolean | null;
  note?: string;
};

function webglRenderer(): string | null {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  } catch {
    return null;
  }
}

function HardwareStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  useAlwaysNext(setCanNext);
  const [checks, setChecks] = useState<Check[] | null>(null);

  const measure = useCallback(async (): Promise<Check[]> => {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const gpu = webglRenderer();
    const displays = await refreshMonitors()
      .then((m) => m.length)
      .catch(() => 0);
    const mics = await listInputs()
      .then((d) => d.length)
      .catch(() => 0);
    return [
      {
        id: 'ram',
        icon: MemoryStick,
        label: t('onboarding.hardware.ram'),
        value: mem ? `≥ ${mem} GB` : t('onboarding.hardware.unknown'),
        ok: mem === undefined ? null : mem >= 8,
        note: t('onboarding.hardware.ramNote'),
      },
      {
        id: 'cpu',
        icon: Cpu,
        label: t('onboarding.hardware.cpu'),
        value: t('onboarding.hardware.cores', { n: cores }),
        ok: cores >= 4,
        note: t('onboarding.hardware.cpuNote'),
      },
      {
        id: 'gpu',
        icon: MonitorPlay,
        label: t('onboarding.hardware.gpu'),
        value: gpu ?? t('onboarding.hardware.unknown'),
        ok: gpu !== null,
      },
      {
        id: 'displays',
        icon: ScanEye,
        label: t('onboarding.hardware.displays'),
        value: String(displays),
        ok: displays >= 2 ? true : null,
        note: displays < 2 ? t('onboarding.hardware.displaysNote') : undefined,
      },
      {
        id: 'mic',
        icon: Mic,
        label: t('onboarding.hardware.mic'),
        value: String(mics),
        ok: mics > 0,
        note: mics === 0 ? t('onboarding.hardware.micNote') : undefined,
      },
    ] satisfies Check[];
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void measure().then((c) => !cancelled && setChecks(c));
    return () => {
      cancelled = true;
    };
  }, [measure]);

  const run = () => {
    setChecks(null);
    void measure().then(setChecks);
  };

  if (!checks) return <Spinner label={t('onboarding.hardware.checking')} />;
  return (
    <Card className="divide-y divide-line">
      {checks.map((c) => (
        <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
          <Icon icon={c.icon} size={18} className="text-fg-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{c.label}</p>
            {c.note && <p className="text-xs text-fg-subtle">{c.note}</p>}
          </div>
          <span className="max-w-60 truncate text-sm text-fg-muted" title={c.value}>
            {c.value}
          </span>
          {c.ok === true ? (
            <Badge tone="success" icon={CheckCircle2}>
              {t('onboarding.hardware.ok')}
            </Badge>
          ) : c.ok === false ? (
            <Badge tone="warn" icon={AlertTriangle}>
              {t('onboarding.hardware.low')}
            </Badge>
          ) : (
            <Badge>{t('onboarding.hardware.info')}</Badge>
          )}
        </div>
      ))}
      <div className="flex justify-end px-5 py-3">
        <Button onClick={() => void run()}>{t('onboarding.hardware.recheck')}</Button>
      </div>
    </Card>
  );
}

/* ================================================================== 4. audio */

/** Lists audio inputs (labels appear only after microphone permission is granted). */
async function listInputs(): Promise<MediaDeviceInfo[]> {
  return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
}

/**
 * Opens a microphone and reports a 0..1 level every animation frame. Returns a stop function.
 * Lives outside React so the render path stays pure.
 */
async function openMeter(
  deviceId: string | null,
  onLevel: (level: number, dtMs: number) => void,
): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: deviceId ? { deviceId: { exact: deviceId } } : true,
  });
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let raf = 0;
  let last = performance.now();
  const tick = () => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const now = performance.now();
    onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 6), now - last);
    last = now;
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => {
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((tr) => tr.stop());
    void ctx.close();
  };
}

function AudioStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  useAlwaysNext(setCanNext);
  const audio = useWizard((s) => s.data.audio);
  const patch = useWizard((s) => s.patch);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [state, setState] = useState<'idle' | 'starting' | 'listening' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const heard = useRef(0);
  const stopRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let cancelled = false;
    listInputs()
      .then((d) => !cancelled && setDevices(d))
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stopRef.current();
    };
  }, []);

  function stop() {
    stopRef.current();
    stopRef.current = () => undefined;
    setLevel(0);
    setState('idle');
  }

  async function start(deviceId = audio.deviceId) {
    stopRef.current();
    setError(null);
    setState('starting');
    try {
      stopRef.current = await openMeter(deviceId, (lvl, dt) => {
        setLevel(lvl);
        if (lvl > 0.15) heard.current += dt;
        if (heard.current > 400 && !useWizard.getState().data.audio.tested) patch('audio', { tested: true });
      });
      setDevices(await listInputs()); // labels become available after permission
      setState('listening');
    } catch (e) {
      setState('error');
      setError(
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? t('onboarding.audio.denied')
          : t('onboarding.audio.failed'),
      );
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <Field label={t('onboarding.audio.device')}>
        {(p) => (
          <Select
            id={p.id}
            value={audio.deviceId ?? 'default'}
            onValueChange={(v) => {
              const id = v === 'default' ? null : v;
              patch('audio', { deviceId: id, tested: false });
              heard.current = 0;
              if (state === 'listening') void start(id);
            }}
            options={[
              { value: 'default', label: t('onboarding.audio.defaultDevice') },
              ...devices
                .filter((d) => d.deviceId && d.deviceId !== 'default')
                .map((d, i) => ({
                  value: d.deviceId,
                  label: d.label || `${t('onboarding.audio.mic')} ${i + 1}`,
                })),
            ]}
          />
        )}
      </Field>
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-1 p-5">
        <div className="flex items-center gap-3">
          <Icon
            icon={AudioLines}
            size={20}
            className={state === 'listening' ? 'text-ai-listening' : 'text-fg-subtle'}
          />
          <Meter label={t('status.mic')} value={level} variant="segmented" segments={24} className="h-3" />
        </div>
        <p className="text-sm text-fg-muted" aria-live="polite">
          {audio.tested ? (
            <span className="flex items-center gap-2 text-success">
              <Icon icon={CheckCircle2} size={16} />
              {t('onboarding.audio.heard')}
            </span>
          ) : state === 'listening' ? (
            t('onboarding.audio.saySomething')
          ) : (
            t('onboarding.audio.idle')
          )}
        </p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div>
          {state === 'listening' ? (
            <Button onClick={stop}>{t('onboarding.audio.stop')}</Button>
          ) : (
            <Button variant="primary" icon={Mic} loading={state === 'starting'} onClick={() => void start()}>
              {state === 'error' ? t('ds.retry') : t('onboarding.audio.start')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ================================================================== 5. model pack */

function ModelsStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  useAlwaysNext(setCanNext);
  const models = useWizard((s) => s.data.models);
  const patch = useWizard((s) => s.patch);
  const folderRef = useRef<HTMLInputElement>(null);
  const online = navigator.onLine;

  useEffect(() => {
    // Non-standard but supported by Chromium/WebView2: pick a whole folder (USB stick or local).
    folderRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  function onFolder(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const names = list.map((f) => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name);
    const folderName = names[0]?.split('/')[0] ?? null;
    const result = validateModelPack(names);
    patch('models', {
      source: 'folder',
      folderName,
      files: names.slice(0, 50),
      status: result.ok ? 'ok' : 'invalid',
    });
  }

  const check = models.source === 'folder' ? validateModelPack(models.files) : null;

  return (
    <div className="flex flex-col gap-4">
      <OptionCard
        icon={Download}
        title={t('onboarding.models.download')}
        body={online ? t('onboarding.models.downloadBody') : t('onboarding.models.downloadOffline')}
        trailing={<SoonTag />}
        disabled
      />
      <OptionCard
        icon={FolderOpen}
        title={t('onboarding.models.folder')}
        body={t('onboarding.models.folderBody')}
        selected={models.source === 'folder'}
        trailing={
          <Button icon={FolderOpen} onClick={() => folderRef.current?.click()}>
            {t('onboarding.models.chooseFolder')}
          </Button>
        }
      >
        {models.source === 'folder' && (
          <div
            role="status"
            className={cn(
              'mt-3 rounded-md border px-3 py-2 text-sm',
              models.status === 'ok'
                ? 'border-success/30 bg-success-soft text-success'
                : 'border-danger/30 bg-danger-soft text-danger',
            )}
          >
            {models.status === 'ok'
              ? t('onboarding.models.valid', { folder: models.folderName })
              : t('onboarding.models.invalid', { missing: check?.missing.join(', ') })}
          </div>
        )}
        <input ref={folderRef} type="file" multiple hidden onChange={(e) => onFolder(e.target.files)} />
      </OptionCard>
      <p className="text-xs text-fg-subtle">{t('onboarding.models.note')}</p>
    </div>
  );
}

function OptionCard({
  icon,
  title,
  body,
  trailing,
  selected,
  disabled,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  trailing?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className={cn('p-5', selected && 'border-accent/50', disabled && 'opacity-70')}>
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-3 text-accent-fg">
          <Icon icon={icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-fg-muted">{body}</p>
        </div>
        {trailing}
      </div>
      {children}
    </Card>
  );
}

/* ================================================================== 6. displays */

function DisplaysStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  useAlwaysNext(setCanNext);
  const monitors = useOutputs((s) => s.monitors);
  const assignments = useOutputs((s) => s.assignments);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void refreshMonitors()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Spinner />;
  const options = [
    { value: '__window__', label: t('screens.windowed') },
    ...monitors.map((m, i) => ({
      value: m.name,
      label: `${t('screens.display')} ${i + 1} — ${m.width}×${m.height}${m.primary ? ` (${t('screens.primary')})` : ''}`,
    })),
  ];
  return (
    <Card className="flex flex-col gap-4 p-6">
      <p className="text-sm text-fg-muted">{t('onboarding.displays.found', { count: monitors.length })}</p>
      {OUTPUT_ROLES.map((role) => (
        <div key={role} className="flex items-center gap-3">
          <span className="w-28 text-sm font-medium">{t(`shell.${role}`)}</span>
          <Select
            aria-label={t(`shell.${role}`)}
            className="flex-1"
            value={assignments[role] ?? '__window__'}
            onValueChange={(v) =>
              void execute('output.assignDisplay', { role, monitor: v === '__window__' ? null : v })
            }
            options={options}
          />
          <Button
            icon={ScanEye}
            variant="outline"
            onClick={() =>
              void execute('output.open', { role }).then(() => execute('output.identify', { role }))
            }
          >
            {t('cmd.output.identify')}
          </Button>
        </div>
      ))}
      <p className="text-xs text-fg-subtle">{t('onboarding.displays.later')}</p>
    </Card>
  );
}

/* ================================================================== 7. import */

function ImportStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  useAlwaysNext(setCanNext);
  const imported = useWizard((s) => s.data.imported);
  const patch = useWizard((s) => s.patch);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const sections = text.trim() ? parseLyrics(text) : [];

  async function addSong() {
    const out = await execute('song.createFromText', { title: title.trim(), text });
    if (out.ok) {
      patch('imported', { songs: imported.songs + 1 });
      toast({ title: t('onboarding.import.added', { title }), tone: 'success' });
      setTitle('');
      setText('');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('onboarding.import.pasteTitle')}</h2>
          {imported.songs > 0 && (
            <Badge tone="success">{t('onboarding.import.count', { count: imported.songs })}</Badge>
          )}
        </div>
        <Field label={t('common.title')}>
          {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} />}
        </Field>
        <Field label={t('onboarding.import.lyrics')} hint={t('onboarding.import.lyricsHint')}>
          {(p) => <Textarea {...p} rows={7} value={text} onChange={(e) => setText(e.target.value)} />}
        </Field>
        {sections.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label={t('onboarding.import.detected')}>
            {sections.map((s, i) => (
              <Badge key={i} tone="accent">
                {s.name} · {s.lines.length}
              </Badge>
            ))}
          </div>
        )}
        <div>
          <Button
            variant="primary"
            icon={Music}
            disabled={!title.trim() || sections.length === 0}
            onClick={() => void addSong()}
          >
            {t('onboarding.import.addSong')}
          </Button>
        </div>
      </Card>
      <OptionCard
        icon={ImagePlus}
        title={t('onboarding.import.media')}
        body={t('onboarding.import.mediaBody')}
        trailing={<SoonTag />}
        disabled
      />
    </div>
  );
}

/* ================================================================== 8. team */

function TeamStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  useAlwaysNext(setCanNext);
  const mode = useSession((s) => s.user?.mode ?? 'local');
  const invites = useWizard((s) => s.data.team.invites);
  const patch = useWizard((s) => s.patch);
  const [email, setEmail] = useState('');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (mode === 'local') {
    return (
      <OptionCard
        icon={Users}
        title={t('onboarding.team.localTitle')}
        body={t('onboarding.team.localBody')}
      />
    );
  }
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex gap-2">
        <Input
          aria-label={t('auth.email')}
          placeholder="name@church.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Button
          disabled={!valid}
          onClick={() => {
            patch('team', { invites: [...invites, email.trim()] });
            setEmail('');
          }}
        >
          {t('onboarding.team.add')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {invites.map((i) => (
          <Chip
            key={i}
            onRemove={() => patch('team', { invites: invites.filter((x) => x !== i) })}
            removeLabel={t('common.remove')}
          >
            {i}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-fg-subtle">{t('onboarding.team.queued')}</p>
    </Card>
  );
}

/* ================================================================== 9. finish */

function FinishStep({ setCanNext }: StepProps) {
  const { t } = useTranslation();
  useAlwaysNext(setCanNext);
  const { skipped, data } = useWizard();
  const rows = STEPS.filter((s) => s.id !== 'finish').map((s) => ({
    id: s.id,
    skipped: skipped.includes(s.id),
  }));
  return (
    <div className="flex flex-col gap-4">
      <Card className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
            <Icon icon={STEP_ICONS[r.id]} size={16} className="text-fg-muted" />
            <span className="flex-1">{t(`onboarding.${r.id}.short`)}</span>
            {r.skipped ? (
              <Badge>{t('onboarding.skipped')}</Badge>
            ) : (
              <Badge tone="success" icon={Check}>
                {t('onboarding.done')}
              </Badge>
            )}
          </div>
        ))}
      </Card>
      <Card className="flex flex-col gap-3 bg-brand-gradient-soft p-6">
        <h2 className="text-lg font-semibold">
          {t('onboarding.finish.ready', { church: data.church.name || t('app.name') })}
        </h2>
        <p className="text-sm text-fg-muted">{t('onboarding.finish.practiceBody')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="brand"
            icon={Play}
            data-selftest="finish-practice"
            onClick={() => void execute('onboarding.complete', { practice: true })}
          >
            {t('onboarding.finish.practice')}
          </Button>
          <Button
            data-selftest="finish-home"
            onClick={() => void execute('onboarding.complete', { practice: false })}
          >
            {t('onboarding.finish.home')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
