import { useTranslation } from 'react-i18next';
import { MonitorPlay, MonitorSmartphone, Undo2 } from 'lucide-react';
import { Badge, Button, Icon, Tooltip } from '@/design-system';
import { execute } from '@/commands';
import { useAudit } from '@/commands/audit';
import { getCommand } from '@/commands/registry';
import { useOutputs } from '@/outputs/windows';

/** Bottom status strip: output windows, last command (from the audit log), undo. */
export function BottomStrip() {
  const { t } = useTranslation();
  const last = useAudit((s) => s.entries[s.entries.length - 1]);
  const open = useOutputs((s) => s.open);
  const lastLabel = last ? t(getCommand(last.commandId)?.labelKey ?? last.commandId) : null;
  return (
    <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-line bg-surface-1 px-3 text-xs text-fg-muted">
      <Tooltip content={t('shell.audienceOutput')}>
        <button
          type="button"
          className="focus-ring inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm px-1.5 hover:text-fg"
          onClick={() => void execute('output.open', { role: 'audience' })}
        >
          <Icon icon={MonitorPlay} size={14} className={open.audience ? 'text-success' : ''} />
          {t('shell.audience')}: {open.audience ? t('shell.open') : t('shell.closed')}
        </button>
      </Tooltip>
      <Tooltip content={t('shell.stageOutput')}>
        <button
          type="button"
          className="focus-ring inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm px-1.5 hover:text-fg"
          onClick={() => void execute('output.open', { role: 'stage' })}
        >
          <Icon icon={MonitorSmartphone} size={14} className={open.stage ? 'text-success' : ''} />
          {t('shell.stage')}: {open.stage ? t('shell.open') : t('shell.closed')}
        </button>
      </Tooltip>
      <div className="flex-1" />
      {last && (
        <span className="flex items-center gap-2 truncate" aria-live="polite">
          <span className="text-fg-subtle">{t('shell.lastCommand')}</span>
          <span className={last.status === 'error' ? 'text-danger' : 'text-fg'}>{lastLabel}</span>
          <Badge tone={last.source === 'ai' ? 'ai' : 'neutral'}>{t(`sources.${last.source}`)}</Badge>
          {last.status === 'error' && <span className="truncate text-danger">{last.errorMessage}</span>}
        </span>
      )}
      <Button
        variant="ghost"
        icon={Undo2}
        className="h-7! px-2 text-xs"
        onClick={() => void execute('app.undo')}
      >
        {t('cmd.app.undo')}
      </Button>
    </footer>
  );
}
