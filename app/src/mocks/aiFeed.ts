import { execute } from '@/commands';
import { useAi } from '@/state/ai';

/**
 * SIMULATED AI feed for Phase A (the real engine connects in Phase C). Started only by the
 * operator's visible "Simulate AI" switch in Live Control. It replays a short service: transcript
 * lines plus detections sent through the real Command Bus as `ai.propose` with source 'ai', so
 * Assist / Auto / Pause and per-command AI permissions behave exactly as they will with the engine.
 */
type Beat =
  | { say: string }
  | {
      say: string;
      propose: {
        kind: 'scripture' | 'lyric' | 'state';
        decision: string;
        why: string;
        confidence: number;
        commandId: string;
        args: unknown;
      };
    };

const SCRIPT: Beat[] = [
  { say: 'Good morning church, let us stand and worship the Lord together.' },
  {
    say: 'Alright church, let’s stand and worship.',
    propose: {
      kind: 'state',
      decision: 'Service state → Worship',
      why: 'Phrase “stand and worship” (state detector)',
      confidence: 0.91,
      commandId: 'service.setState',
      args: { state: 'worship' },
    },
  },
  {
    say: 'You are mighty, You are holy, seated high above it all',
    propose: {
      kind: 'lyric',
      decision: 'Show “Mighty God Reigns”, Verse 1',
      why: 'Lyric match 0.94 against “Mighty God Reigns” line 1',
      confidence: 0.94,
      commandId: 'song.load',
      args: { songId: 'p-mighty-god', live: true },
    },
  },
  { say: 'Every knee will bow before You, every tongue will hear the call' },
  { say: 'Let us pray. Father we thank you for this day.' },
  {
    say: 'Turn with me to the book of John chapter three verse sixteen.',
    propose: {
      kind: 'scripture',
      decision: 'Show John 3:16 (KJV)',
      why: 'Reference “John chapter three verse sixteen” (scripture detector)',
      confidence: 0.96,
      commandId: 'scripture.show',
      args: { reference: 'John 3:16' },
    },
  },
  { say: 'For God so loved the world that he gave his only begotten son…' },
  {
    say: 'And Paul writes… I think it’s in Philippians somewhere…',
    propose: {
      kind: 'scripture',
      decision: 'Show Philippians 4:13 (KJV)',
      why: 'Vague reference “Philippians somewhere”; best guess from sermon context',
      confidence: 0.52,
      commandId: 'scripture.show',
      args: { reference: 'Philippians 4:13' },
    },
  },
];

let timer: number | undefined;
let index = 0;
let lineSeq = 0;

export function isAiFeedRunning() {
  return timer !== undefined;
}

export function startAiFeed(intervalMs = 5000): void {
  if (timer !== undefined) return;
  const step = () => {
    const beat = SCRIPT[index % SCRIPT.length];
    index++;
    if (!beat) return;
    useAi
      .getState()
      .pushTranscript({ id: `t${++lineSeq}`, at: Date.now(), text: beat.say, speaker: 'Simulated' });
    if ('propose' in beat) {
      void execute(
        'ai.propose',
        { ...beat.propose, heard: beat.say },
        { source: 'ai', confidence: beat.propose.confidence, explanation: beat.propose.why },
      );
    }
  };
  step();
  timer = window.setInterval(step, intervalMs);
}

export function stopAiFeed(): void {
  window.clearInterval(timer);
  timer = undefined;
}
