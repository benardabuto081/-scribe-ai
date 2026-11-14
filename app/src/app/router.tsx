import type { ReactNode } from 'react';
import { createHashRouter, Navigate, useParams } from 'react-router-dom';
import { StudioLayout } from './StudioLayout';
import { ModulePlaceholder } from './ModulePlaceholder';
import { NAV_ITEMS, SEARCH_ITEM } from './nav';
import { StyleGuide } from '@/design-system/styleguide/StyleGuide';
import { ScreensPage } from '@/features/screens/ScreensPage';
import { OutputView } from '@/outputs/OutputView';
import { OUTPUT_ROLES, type OutputRole } from '@/outputs/types';

/** Implemented module screens by nav id. Anything missing renders a visible "Coming soon" screen. */
const PAGES: Partial<Record<string, ReactNode>> = {
  screens: <ScreensPage />,
};

function BrowserOutputRoute() {
  const { role } = useParams();
  if (!OUTPUT_ROLES.includes(role as OutputRole)) return <Navigate to="/home" replace />;
  return <OutputView role={role as OutputRole} />;
}

export function createAppRouter() {
  return createHashRouter([
    { path: '/', element: <Navigate to="/home" replace /> },
    {
      element: <StudioLayout />,
      children: [
        ...[...NAV_ITEMS, SEARCH_ITEM].map((item) => ({
          path: item.path,
          element: PAGES[item.id] ?? <ModulePlaceholder item={item} />,
        })),
        { path: '/design-system', element: <StyleGuide /> },
      ],
    },
    // Browser dev mode: outputs open as popups at #/output/<role>. (In Tauri, output windows
    // are detected by window label in main.tsx and never mount the Studio router.)
    { path: '/output/:role', element: <BrowserOutputRoute /> },
    { path: '*', element: <Navigate to="/home" replace /> },
  ]);
}
