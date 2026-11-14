import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/assets/fonts/fonts.css';
import '@/styles/index.css';
import { isTauri } from '@/outputs/bridge';
import { OUTPUT_ROLES, type OutputRole } from '@/outputs/types';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

/**
 * One bundle, two kinds of window. Tauri output windows are identified by their label
 * (`output-audience`, `output-stage`) and mount only the lightweight output renderer — never the
 * Studio app, its stores or the command bus.
 */
function outputRoleFromWindow(): OutputRole | null {
  if (!isTauri()) return null;
  const internals = (
    window as unknown as { __TAURI_INTERNALS__?: { metadata?: { currentWindow?: { label?: string } } } }
  ).__TAURI_INTERNALS__;
  const label = internals?.metadata?.currentWindow?.label ?? '';
  const role = label.replace(/^output-/, '');
  return label.startsWith('output-') && OUTPUT_ROLES.includes(role as OutputRole)
    ? (role as OutputRole)
    : null;
}

const outputRole = outputRoleFromWindow();
const OutputView = lazy(() => import('@/outputs/OutputView').then((m) => ({ default: m.OutputView })));
const StudioApp = lazy(() => import('@/App').then((m) => ({ default: m.App })));

createRoot(root).render(
  <StrictMode>
    <Suspense fallback={null}>{outputRole ? <OutputView role={outputRole} /> : <StudioApp />}</Suspense>
  </StrictMode>,
);
