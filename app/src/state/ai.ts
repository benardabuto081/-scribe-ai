import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Id } from './domain';

export type AiMode = 'manual' | 'assist' | 'auto';

export type ProposalKind = 'scripture' | 'lyric' | 'state' | 'command';

/** An AI suggestion awaiting operator decision (Assist) or awaiting confidence (Auto). */
export type Proposal = {
  id: Id;
  at: number;
  kind: ProposalKind;
  /** What the AI heard (transcript excerpt). */
  heard: string;
  /** What it decided to do, human-readable. */
  decision: string;
  /** Why (detector + matching evidence). */
  why: string;
  confidence: number; // 0..1
  commandId: string;
  args: unknown;
  status: 'pending' | 'approved' | 'dismissed' | 'auto' | 'failed';
};

export type TranscriptLine = { id: Id; at: number; text: string; speaker?: string };

type AiState = {
  mode: AiMode;
  paused: boolean;
  /** Minimum confidence for Auto mode to execute without asking. */
  autoThreshold: number;
  /** Commands the AI is forbidden to run even in Auto (per-church setting). */
  blockedCommands: string[];
  proposals: Proposal[];
  transcript: TranscriptLine[];
  setMode: (m: AiMode) => void;
  setPaused: (p: boolean) => void;
  addProposal: (p: Proposal) => void;
  setProposalStatus: (id: Id, status: Proposal['status']) => void;
  pushTranscript: (l: TranscriptLine) => void;
};

export const useAi = create<AiState>()(
  persist(
    (set) => ({
      mode: 'assist', // CLAUDE.md: default is Assist
      paused: false,
      autoThreshold: 0.85,
      blockedCommands: ['screen.blackout', 'screen.clear', 'output.assignDisplay', 'output.testPattern'],
      proposals: [],
      transcript: [],
      setMode: (mode) => set({ mode }),
      setPaused: (paused) => set({ paused }),
      addProposal: (p) => set((s) => ({ proposals: [p, ...s.proposals].slice(0, 100) })),
      setProposalStatus: (id, status) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, status } : p)) })),
      pushTranscript: (l) => set((s) => ({ transcript: [...s.transcript, l].slice(-300) })),
    }),
    {
      name: 'scribe.ai',
      partialize: (s) => ({
        mode: s.mode,
        autoThreshold: s.autoThreshold,
        blockedCommands: s.blockedCommands,
      }),
    },
  ),
);
