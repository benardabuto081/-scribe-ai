import { invokeChecked, isTauri } from '@/outputs/tauri';
import { toast } from '@/design-system/components/Toast';
import i18n from '@/i18n';
import { useLibrary } from '@/state/library';
import type { ScriptureVerse } from '@/state/domain';
import type { ScriptureRef } from './reference';

let warned = false;
function warnSampleOnce(reason: string) {
  if (warned) return;
  warned = true;
  toast({
    title: i18n.t('bible.sampleOnlyTitle'),
    description: `${i18n.t('bible.sampleOnlyBody')} (${reason})`,
    tone: 'warn',
  });
}

/** KJV source text marks translator-supplied words as {word}; render them plainly. */
export const cleanVerseText = (t: string) => t.replace(/[{}]/g, '');

/**
 * Looks up a passage.
 *  - Desktop (Tauri): reads the bundled KJV `data/bible.db` via the `bible_lookup` Rust command
 *    (real data, 31,100 verses). That command lands with the Scripture module; until then the
 *    call fails and the operator sees a one-time warning that the built-in sample is in use.
 *  - Browser dev mode: uses the small KJV sample in mocks.
 * `verseEnd === 0` means "to the end of the chapter".
 */
export async function lookupPassage(ref: ScriptureRef): Promise<ScriptureVerse[]> {
  if (isTauri()) {
    try {
      const rows = await invokeChecked<ScriptureVerse[]>('bible_lookup', {
        book: ref.book.en,
        chapter: ref.chapter,
        verseStart: ref.verseStart,
        verseEnd: ref.verseEnd,
      });
      return rows.map((r) => ({ ...r, text: cleanVerseText(r.text) }));
    } catch (e) {
      // Visible fallback (never a hidden fake): the operator is told the sample is in use.
      warnSampleOnce(e instanceof Error ? e.message : String(e));
    }
  }
  return useLibrary
    .getState()
    .kjv.filter(
      (v) =>
        v.book === ref.book.en &&
        v.chapter === ref.chapter &&
        v.verse >= ref.verseStart &&
        (ref.verseEnd === 0 || v.verse <= ref.verseEnd),
    );
}
