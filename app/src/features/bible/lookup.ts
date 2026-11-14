import { isTauri } from '@/outputs/bridge';
import { useLibrary } from '@/state/library';
import type { ScriptureVerse } from '@/state/domain';
import type { ScriptureRef } from './reference';

/** KJV source text marks translator-supplied words as {word}; render them plainly. */
export const cleanVerseText = (t: string) => t.replace(/[{}]/g, '');

/**
 * Looks up a passage.
 *  - Desktop (Tauri): reads the bundled KJV `data/bible.db` via the `bible_lookup` Rust command (real data, 31,100 verses).
 *  - Browser dev mode: falls back to the small KJV sample in mocks.
 * `verseEnd === 0` means "to the end of the chapter".
 */
export async function lookupPassage(ref: ScriptureRef): Promise<ScriptureVerse[]> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const rows = await invoke<ScriptureVerse[]>('bible_lookup', {
        book: ref.book.en,
        chapter: ref.chapter,
        verseStart: ref.verseStart,
        verseEnd: ref.verseEnd,
      });
      return rows.map((r) => ({ ...r, text: cleanVerseText(r.text) }));
    } catch {
      // Fall through to the sample (e.g. bible.db missing in a dev checkout).
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
