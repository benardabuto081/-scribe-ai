import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LeftRail } from './LeftRail';
import { StatusBar } from './StatusBar';
import { BottomStrip } from './BottomStrip';
import { startOutputSync } from '@/outputs/sync';
import { refreshMonitors } from '@/outputs/windows';

/** Studio window chrome: left rail, top status bar, workspace, bottom strip. */
export function StudioLayout() {
  useEffect(() => startOutputSync(), []);
  useEffect(() => {
    void refreshMonitors().catch(() => undefined);
  }, []);
  return (
    <div className="flex h-full bg-canvas">
      <LeftRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <StatusBar />
        <main className="min-h-0 flex-1 overflow-hidden" id="main">
          <Outlet />
        </main>
        <BottomStrip />
      </div>
    </div>
  );
}
