import type { ReactNode } from 'react';
import { createHashRouter, Navigate, useLocation, useParams } from 'react-router-dom';
import {
  CreateAccountScreen,
  ForgotPasswordScreen,
  RoleScreen,
  SignInScreen,
  SplashScreen,
  WorkspaceScreen,
} from '@/features/auth/AuthScreens';
import type { Workspace } from '@/features/auth/provider';
import { OnboardingRoute } from '@/features/onboarding/Onboarding';
import { useSession } from '@/state/session';
import { StudioLayout } from './StudioLayout';
import { ModulePlaceholder } from './ModulePlaceholder';
import { NAV_ITEMS, SEARCH_ITEM } from './nav';
import { StyleGuide } from '@/design-system/styleguide/StyleGuide';
import { ScreensPage } from '@/features/screens/ScreensPage';
import { LivePage } from '@/features/live/LivePage';
import { OutputView } from '@/outputs/OutputView';
import { OUTPUT_ROLES, type OutputRole } from '@/outputs/types';

/** Implemented module screens by nav id. Anything missing renders a visible "Coming soon" screen. */
const PAGES: Partial<Record<string, ReactNode>> = {
  screens: <ScreensPage />,
  live: <LivePage />,
};

/** Studio screens need a session and a finished first-run wizard. */
function RequireSession() {
  const user = useSession((s) => s.user);
  const onboarded = useSession((s) => s.onboarded);
  if (!user) return <Navigate to="/auth/sign-in" replace />;
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <StudioLayout />;
}

function RoleRoute() {
  const location = useLocation();
  return <RoleScreen workspace={(location.state as Workspace | null) ?? null} />;
}

function BrowserOutputRoute() {
  const { role } = useParams();
  if (!OUTPUT_ROLES.includes(role as OutputRole)) return <Navigate to="/home" replace />;
  return <OutputView role={role as OutputRole} />;
}

export function createAppRouter() {
  return createHashRouter([
    { path: '/', element: <Navigate to="/splash" replace /> },
    { path: '/splash', element: <SplashScreen /> },
    { path: '/auth/sign-in', element: <SignInScreen /> },
    { path: '/auth/create', element: <CreateAccountScreen /> },
    { path: '/auth/forgot', element: <ForgotPasswordScreen /> },
    { path: '/auth/workspace', element: <WorkspaceScreen /> },
    { path: '/auth/role', element: <RoleRoute /> },
    { path: '/onboarding', element: <OnboardingRoute /> },
    { path: '/onboarding/:step', element: <OnboardingRoute /> },
    {
      element: <RequireSession />,
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
    { path: '*', element: <Navigate to="/splash" replace /> },
  ]);
}
