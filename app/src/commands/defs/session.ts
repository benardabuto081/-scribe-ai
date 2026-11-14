import { z } from 'zod';
import { CheckCircle2, LogOut, RefreshCcw } from 'lucide-react';
import { defineCommand } from '../registry';
import { useSession } from '@/state/session';
import { useWizard } from '@/features/onboarding/wizard';
import { useLibrary } from '@/state/library';
import { useLive } from '@/state/live';
import { navigateTo } from './app';

/**
 * Session-level commands. (Sign-in forms themselves run before a session exists, so they call the
 * AuthProvider directly — the Command Bus needs an operator and permission level to exist.)
 */
export const sessionCommands = [
  defineCommand({
    id: 'auth.signOut',
    category: 'app',
    labelKey: 'cmd.auth.signOut',
    icon: LogOut,
    args: z.object({}),
    permission: 'view',
    aiAllowed: false,
    palette: true,
    handler: () => {
      useSession.getState().signOut();
      navigateTo('/auth/sign-in');
    },
  }),
  defineCommand({
    id: 'onboarding.complete',
    category: 'app',
    labelKey: 'cmd.onboarding.complete',
    icon: CheckCircle2,
    args: z.object({ practice: z.boolean().default(false) }),
    permission: 'view',
    aiAllowed: false,
    handler: ({ practice }) => {
      useSession.getState().setOnboarded(true);
      const church = useWizard.getState().data.church.name.trim();
      const ws = useSession.getState().workspace;
      if (church && ws) useSession.setState({ workspace: { ...ws, name: church } });
      if (practice) {
        const first = useLibrary.getState().playlists[0];
        if (first) useLive.setState({ selectedPlaylistId: first.id, selectedItemId: null });
        navigateTo('/live');
      } else {
        navigateTo('/home');
      }
    },
  }),
  defineCommand({
    id: 'onboarding.restart',
    category: 'app',
    labelKey: 'cmd.onboarding.restart',
    icon: RefreshCcw,
    args: z.object({}),
    permission: 'admin',
    aiAllowed: false,
    palette: true,
    handler: () => {
      useWizard.getState().reset();
      useSession.getState().setOnboarded(false);
      navigateTo('/onboarding');
    },
  }),
];
