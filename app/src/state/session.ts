import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PermissionLevel } from '@/commands/types';

export const ROLES = ['admin', 'operator', 'planner', 'designer', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Role → highest command permission. Linear for Phase A; per-role, per-command permission
 * matrices arrive with Team and Permissions (SPEC 4.25, Phase F).
 */
export const ROLE_PERMISSION: Record<Role, PermissionLevel> = {
  admin: 'admin',
  designer: 'edit',
  planner: 'edit',
  operator: 'operate',
  viewer: 'view',
};

export type SessionUser = { id: string; name: string; email?: string; mode: 'local' | 'account' };

type SessionState = {
  user: SessionUser | null;
  workspace: { id: string; name: string } | null;
  role: Role;
  onboarded: boolean;
  setSession: (user: SessionUser, workspace: { id: string; name: string } | null) => void;
  setRole: (r: Role) => void;
  setOnboarded: (v: boolean) => void;
  signOut: () => void;
  permission: () => PermissionLevel;
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      role: 'admin',
      onboarded: false,
      setSession: (user, workspace) => set({ user, workspace }),
      setRole: (role) => set({ role }),
      setOnboarded: (onboarded) => set({ onboarded }),
      signOut: () => set({ user: null, workspace: null }),
      permission: () => ROLE_PERMISSION[get().role],
    }),
    {
      name: 'scribe.session',
      partialize: (s) => ({ user: s.user, workspace: s.workspace, role: s.role, onboarded: s.onboarded }),
    },
  ),
);
