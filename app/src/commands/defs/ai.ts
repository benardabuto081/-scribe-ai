import { Check, CirclePause, Lightbulb, PauseCircle, PlayCircle, Sparkles, Undo2, X } from 'lucide-react';
import { z } from 'zod';
import { defineCommand } from '../registry';
import { CommandFailure, execute, undoLast } from '../bus';
import { useAi, type Proposal } from '@/state/ai';
import { toast } from '@/design-system/components/Toast';
import i18n from '@/i18n';

let proposalSeq = 0;

export const aiCommands = [
  defineCommand({
    id: 'ai.setMode',
    category: 'ai',
    labelKey: 'cmd.ai.setMode',
    icon: Sparkles,
    args: z.object({ mode: z.enum(['manual', 'assist', 'auto']) }),
    permission: 'operate',
    aiAllowed: false,
    handler: ({ mode }) => {
      const prev = useAi.getState().mode;
      useAi.getState().setMode(mode);
      return { undo: () => useAi.getState().setMode(prev) };
    },
  }),
  defineCommand({
    id: 'ai.pause',
    category: 'ai',
    labelKey: 'cmd.ai.pause',
    icon: PauseCircle,
    args: z.object({}),
    permission: 'operate',
    aiAllowed: false,
    palette: true,
    handler: () => useAi.getState().setPaused(true),
  }),
  defineCommand({
    id: 'ai.resume',
    category: 'ai',
    labelKey: 'cmd.ai.resume',
    icon: PlayCircle,
    args: z.object({}),
    permission: 'operate',
    aiAllowed: false,
    palette: true,
    handler: () => useAi.getState().setPaused(false),
  }),
  defineCommand({
    id: 'ai.togglePause',
    category: 'ai',
    labelKey: 'cmd.ai.togglePause',
    icon: CirclePause,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'Ctrl+Shift+P',
    aiAllowed: false,
    palette: true,
    handler: () => {
      const s = useAi.getState();
      s.setPaused(!s.paused);
      toast({
        title: i18n.t(s.paused ? 'ai.resumedToast' : 'ai.pausedToast'),
        tone: s.paused ? 'info' : 'warn',
      });
    },
  }),
  defineCommand({
    id: 'ai.propose',
    category: 'ai',
    labelKey: 'cmd.ai.propose',
    icon: Lightbulb,
    args: z.object({
      kind: z.enum(['scripture', 'lyric', 'state', 'command']),
      heard: z.string(),
      decision: z.string(),
      why: z.string(),
      confidence: z.number().min(0).max(1),
      commandId: z.string(),
      args: z.unknown().default({}),
    }),
    permission: 'operate',
    aiAllowed: true,
    handler: async (p) => {
      const ai = useAi.getState();
      if (ai.mode === 'manual') return; // Manual: AI listens but never proposes actions.
      const proposal: Proposal = {
        ...p,
        id: `prop-${Date.now()}-${++proposalSeq}`,
        at: Date.now(),
        status: 'pending',
      };
      ai.addProposal(proposal);
      if (ai.mode === 'auto' && !ai.paused) {
        const out = await execute(p.commandId, p.args, {
          source: 'ai',
          confidence: p.confidence,
          explanation: `${p.decision} — ${p.why}`,
        });
        // Low confidence or blocked commands stay pending for the operator (never auto-execute).
        if (out.ok) useAi.getState().setProposalStatus(proposal.id, 'auto');
      }
      return { result: proposal.id };
    },
  }),
  defineCommand({
    id: 'ai.approve',
    category: 'ai',
    labelKey: 'cmd.ai.approve',
    icon: Check,
    args: z.object({ proposalId: z.string().optional() }),
    permission: 'operate',
    shortcut: 'Ctrl+Enter',
    aiAllowed: false,
    palette: true,
    handler: async ({ proposalId }) => {
      const ai = useAi.getState();
      const p = proposalId
        ? ai.proposals.find((x) => x.id === proposalId)
        : ai.proposals.find((x) => x.status === 'pending');
      if (!p || p.status !== 'pending') throw new CommandFailure('not_found', 'No pending AI suggestion');
      const out = await execute(p.commandId, p.args, {
        source: 'ai',
        approved: true,
        confidence: p.confidence,
        explanation: `${p.decision} — ${p.why}`,
      });
      ai.setProposalStatus(p.id, out.ok ? 'approved' : 'failed');
      if (!out.ok) throw new CommandFailure(out.error.code, out.error.message);
    },
  }),
  defineCommand({
    id: 'ai.dismiss',
    category: 'ai',
    labelKey: 'cmd.ai.dismiss',
    icon: X,
    args: z.object({ proposalId: z.string().optional() }),
    permission: 'operate',
    shortcut: 'Ctrl+Backspace',
    aiAllowed: false,
    palette: true,
    handler: ({ proposalId }) => {
      const ai = useAi.getState();
      const p = proposalId
        ? ai.proposals.find((x) => x.id === proposalId)
        : ai.proposals.find((x) => x.status === 'pending');
      if (!p) throw new CommandFailure('not_found', 'No pending AI suggestion');
      ai.setProposalStatus(p.id, 'dismissed');
      return { undo: () => useAi.getState().setProposalStatus(p.id, 'pending') };
    },
  }),
  defineCommand({
    id: 'ai.undoLast',
    category: 'ai',
    labelKey: 'cmd.ai.undoLast',
    icon: Undo2,
    args: z.object({}),
    permission: 'operate',
    shortcut: 'Ctrl+Shift+Z',
    aiAllowed: false,
    palette: true,
    handler: async () => {
      const undone = await undoLast('ai');
      if (!undone) throw new CommandFailure('not_found', 'No AI action to undo');
      return { result: undone };
    },
  }),
];
