import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster, TooltipProvider } from '@/design-system';
import { applyAppearance, useSettings } from '@/state/settings';
import { initCommands, setNavigator } from '@/commands';
import { installKeyboard } from '@/commands/keyboard';
import { CommandPaletteHost } from '@/commands/CommandPaletteHost';
import { createAppRouter } from '@/app/router';
import { installOutputWindowTracking } from '@/outputs/windows';
import { installCommandFeedback } from '@/commands/feedback';
import { runSelfTestIfEnabled } from '@/app/selftest';

// Apply persisted appearance before first paint, and register every command.
applyAppearance(useSettings.getState());
initCommands();

const router = createAppRouter();
setNavigator((path) => void router.navigate(path));

/** The Studio (operator) application. Output windows render `OutputApp` instead (see main.tsx). */
export function App() {
  useEffect(() => installKeyboard(), []);
  useEffect(() => installOutputWindowTracking(), []);
  useEffect(() => installCommandFeedback(), []);
  useEffect(() => {
    void runSelfTestIfEnabled();
  }, []);
  return (
    <TooltipProvider delayDuration={350}>
      <RouterProvider router={router} />
      <CommandPaletteHost />
      <Toaster />
    </TooltipProvider>
  );
}
