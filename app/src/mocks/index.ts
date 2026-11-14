import { USE_MOCKS } from './flag';
import * as data from './data';

/**
 * The only entry point for seeded data. When VITE_USE_MOCKS is not "true", every collection is empty
 * and screens show their empty states (Phase B replaces this with SQLite-backed stores).
 */
export const seed = {
  libraries: USE_MOCKS ? data.libraries : [],
  presentations: USE_MOCKS ? data.presentations : [],
  playlists: USE_MOCKS ? data.playlists : [],
  looks: USE_MOCKS ? data.looks : [],
  themes: USE_MOCKS ? data.themes : [],
  backgrounds: USE_MOCKS ? data.backgrounds : [],
  props: USE_MOCKS ? data.props : [],
  messages: USE_MOCKS ? data.messages : [],
  timers: USE_MOCKS ? data.timers : [],
  media: USE_MOCKS ? data.media : [],
  macros: USE_MOCKS ? data.macros : [],
  kjv: USE_MOCKS ? data.kjvSample : [],
};

export { USE_MOCKS };
