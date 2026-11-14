import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppWindow,
  Grid3x3,
  MonitorPlay,
  MonitorSmartphone,
  RefreshCw,
  ScanEye,
  ScreenShare,
  Star,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Icon,
  Select,
  Spinner,
  Switch,
} from '@/design-system';
import { execute } from '@/commands';
import { PageHeader } from '@/app/PageHeader';
import { refreshMonitors, useOutputs } from '@/outputs/windows';
import { isTauri } from '@/outputs/bridge';
import { useLive } from '@/state/live';
import { OUTPUT_ROLES, type OutputRole } from '@/outputs/types';

const NONE = '__window__';

export function ScreensPage() {
  const { t } = useTranslation();
  const monitors = useOutputs((s) => s.monitors);
  const assignments = useOutputs((s) => s.assignments);
  const open = useOutputs((s) => s.open);
  const testPattern = useLive((s) => s.program.testPattern);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  async function detect() {
    setStatus('loading');
    try {
      await refreshMonitors();
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  // Bounding box of all displays for the arrangement diagram.
  const minX = Math.min(0, ...monitors.map((m) => m.x));
  const minY = Math.min(0, ...monitors.map((m) => m.y));
  const maxX = Math.max(1, ...monitors.map((m) => m.x + m.width));
  const maxY = Math.max(1, ...monitors.map((m) => m.y + m.height));
  const roleFor = (name: string) => OUTPUT_ROLES.filter((r) => assignments[r] === name);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        icon={ScreenShare}
        title={t('nav.screens')}
        subtitle={t('screens.subtitle')}
        status={{ tone: 'info', label: t('status.partial') }}
        actions={
          <Button icon={RefreshCw} loading={status === 'loading'} onClick={() => void detect()}>
            {t('screens.detect')}
          </Button>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {!isTauri() && (
          <p className="mb-4 rounded-md border border-info/30 bg-info-soft px-4 py-2.5 text-sm text-info">
            {t('screens.browserNote')}
          </p>
        )}
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader
              title={t('screens.arrangement')}
              icon={MonitorPlay}
              subtitle={t('screens.arrangementSub')}
            />
            <CardBody>
              {status === 'loading' && monitors.length === 0 ? (
                <Spinner />
              ) : monitors.length === 0 ? (
                <EmptyState
                  icon={ScreenShare}
                  title={t('screens.noneTitle')}
                  description={t('screens.noneBody')}
                />
              ) : (
                <div
                  className="relative w-full rounded-lg border border-line bg-surface-1"
                  style={{ aspectRatio: `${maxX - minX} / ${maxY - minY}`, maxHeight: 320 }}
                >
                  {monitors.map((m, i) => {
                    const roles = roleFor(m.name);
                    return (
                      <div
                        key={m.name}
                        className="absolute flex flex-col items-center justify-center gap-1 rounded-md border-2 bg-surface-3 p-2 text-center"
                        style={{
                          left: `${((m.x - minX) / (maxX - minX)) * 100}%`,
                          top: `${((m.y - minY) / (maxY - minY)) * 100}%`,
                          width: `calc(${(m.width / (maxX - minX)) * 100}% - 6px)`,
                          height: `calc(${(m.height / (maxY - minY)) * 100}% - 6px)`,
                          borderColor: roles.length ? 'var(--sa-accent)' : 'var(--sa-line-strong)',
                        }}
                      >
                        <span className="font-display text-lg font-semibold">{i + 1}</span>
                        <span className="text-2xs text-fg-muted">
                          {m.width}×{m.height}
                          {m.scale !== 1 && ` @${m.scale}x`}
                        </span>
                        <span className="flex flex-wrap justify-center gap-1">
                          {m.primary && <Badge icon={Star}>{t('screens.primary')}</Badge>}
                          {roles.map((r) => (
                            <Badge key={r} tone="accent">
                              {t(`shell.${r}`)}
                            </Badge>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="flex flex-col gap-4">
            {OUTPUT_ROLES.map((role) => (
              <OutputCard
                key={role}
                role={role}
                monitor={assignments[role]}
                isOpen={open[role]}
                pattern={testPattern[role]}
                options={monitors.map((m, i) => ({
                  value: m.name,
                  label: `${t('screens.display')} ${i + 1} — ${m.width}×${m.height}${m.primary ? ` (${t('screens.primary')})` : ''}`,
                }))}
              />
            ))}
            <Card>
              <CardHeader title={t('screens.isolationTitle')} icon={AppWindow} />
              <CardBody className="text-sm text-fg-muted">{t('screens.isolationBody')}</CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputCard({
  role,
  monitor,
  isOpen,
  pattern,
  options,
}: {
  role: OutputRole;
  monitor: string | null;
  isOpen: boolean;
  pattern: boolean;
  options: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader
        title={t(`shell.${role}`)}
        icon={role === 'audience' ? MonitorPlay : MonitorSmartphone}
        subtitle={isOpen ? t('shell.open') : t('shell.closed')}
        actions={
          isOpen ? (
            <Button icon={X} variant="ghost" onClick={() => void execute('output.close', { role })}>
              {t('screens.close')}
            </Button>
          ) : (
            <Button icon={AppWindow} variant="primary" onClick={() => void execute('output.open', { role })}>
              {t('screens.open')}
            </Button>
          )
        }
      />
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="w-28 text-sm text-fg-muted">{t('screens.display')}</span>
          <Select
            aria-label={`${t(`shell.${role}`)} ${t('screens.display')}`}
            className="flex-1"
            value={monitor ?? NONE}
            onValueChange={(v) =>
              void execute('output.assignDisplay', { role, monitor: v === NONE ? null : v })
            }
            options={[{ value: NONE, label: t('screens.windowed') }, ...options]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={pattern}
              onCheckedChange={(on) => void execute('output.testPattern', { role, on })}
              label={t('cmd.output.testPattern')}
            />
            <Icon icon={Grid3x3} size={15} className="text-fg-muted" />
            {t('screens.testPattern')}
          </label>
          <Button icon={ScanEye} variant="outline" onClick={() => void execute('output.identify', { role })}>
            {t('cmd.output.identify')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
