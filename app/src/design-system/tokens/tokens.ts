/** JS mirror of tokens.css for values that code needs (motion, theme ids). */
export const THEMES = ['dark', 'light', 'hc'] as const;
export type ThemeId = (typeof THEMES)[number];

export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];

export const MOTION = { fast: 120, base: 200, slow: 320, ease: 'cubic-bezier(0.2, 0, 0, 1)' } as const;

/** Group colors for presentation slide groups. Token names, resolved via CSS vars. */
export const GROUP_COLORS = {
  verse: '#3f86ff',
  chorus: '#22d3ee',
  bridge: '#8b7cff',
  preChorus: '#5ea2ff',
  intro: '#2fcf7a',
  outro: '#f5b53d',
  tag: '#f07ab0',
  interlude: '#7c8aa5',
  sermonPoint: '#ff8a4c',
  scripture: '#e7c06a',
  announcement: '#4dd4a4',
  custom: '#9ca8be',
} as const;
export type GroupColorKey = keyof typeof GROUP_COLORS;
