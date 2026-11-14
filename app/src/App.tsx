import { useEffect } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Toaster, TooltipProvider } from '@/design-system';
import { StyleGuide } from '@/design-system/styleguide/StyleGuide';
import { applyAppearance, useSettings } from '@/state/settings';
import { initCommands, setNavigator } from '@/commands';
import { installKeyboard } from '@/commands/keyboard';
import { CommandPaletteHost } from '@/commands/CommandPaletteHost';

// Apply persisted appearance before first paint, and register every command.
applyAppearance(useSettings.getState());
initCommands();

// Hash routing works identically from the Vite dev server and Tauri's bundled assets,
// and lets output windows open at index.html#/output/<role>.
const router = createHashRouter([
  { path: '/', element: <StyleGuide /> },
  { path: '/design-system', element: <StyleGuide /> },
]);
setNavigator((path) => void router.navigate(path));

export function App() {
  useEffect(() => installKeyboard(), []);
  return (
    <TooltipProvider delayDuration={350}>
      <RouterProvider router={router} />
      <CommandPaletteHost />
      <Toaster />
    </TooltipProvider>
  );
}
