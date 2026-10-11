// Kessoku Ultimate Bocchi Theme: the look.
//
// Pure data, no `$` and no `on`: the palette, the engine themes built from it
// (a dark and a light twin), the band members, their faces per mood, and the
// words the spinner and the turn footer borrow. This is the file to tweak.

import type { KessokuMember, KessokuMood } from '../../types'

/** The colors. Hex for terminals and the desktop alike. */
export const PALETTE = {
  pink: '#f7a8c9', // the soft pink accent (borders, highlights)
  hotPink: '#ff69b4', // a louder pink for live things
  rose: '#d98aa8', // pink at rest (finished tool rows)
  blush: '#ffd6e8', // the palest pink (read glow)
  charcoal: '#1b1b1f', // panel background
  charcoalLight: '#26262c', // card background
  neon: '#39ff14', // commit green
  yellow: '#ffd166', // Nijika
  blue: '#8fb8ff', // Ryo
  coral: '#ff8a65', // Kita: her red, kept apart from the error red
  red: '#ff5d73', // errors
  lavender: '#c3a6ff', // merged, the purple seat
  peach: '#ffb27a', // the orange seat
  mint: '#7fe7d9', // the cyan seat
  ink: '#ece6ee', // body text on charcoal
  dim: '#8a8392', // quiet text
  faint: '#5e5866', // borders at rest
} as const

/** The dark theme's slug and name: `themes/<slug>.json` in the plugin, `custom:<slug>` when copied to ~/.claude/themes. */
export const THEME_SLUG = 'kessoku-bocchi'
export const THEME_NAME = 'Kessoku Bocchi'
/** The light twin, for people on a light terminal. */
export const THEME_SLUG_LIGHT = 'kessoku-bocchi-light'
export const THEME_NAME_LIGHT = 'Kessoku Bocchi Light'

/**
 * The dark engine theme: every documented color token of Claude Code's custom
 * theme format, mapped onto the palette. themes/kessoku-bocchi.json is this
 * map written out for the engine to read: regenerate it after editing here
 * (the README's Tweaking section says how), or the two drift apart.
 */
export const THEME_OVERRIDES: Readonly<Record<string, string>> = {
  // Brand and text
  claude: PALETTE.pink,
  claudeShimmer: PALETTE.hotPink,
  text: PALETTE.ink,
  inverseText: PALETTE.charcoal,
  inactive: PALETTE.dim,
  inactiveShimmer: '#a79fb0',
  subtle: PALETTE.faint,
  suggestion: PALETTE.rose,
  remember: PALETTE.yellow,
  // Status
  success: PALETTE.neon,
  error: PALETTE.red,
  warning: PALETTE.yellow,
  warningShimmer: '#ffe6a3',
  merged: PALETTE.lavender,
  // The prompt box and its modes
  promptBorder: PALETTE.pink,
  promptBorderShimmer: PALETTE.hotPink,
  permission: PALETTE.hotPink,
  permissionShimmer: PALETTE.blush,
  planMode: PALETTE.blue,
  autoAccept: PALETTE.rose,
  autoAcceptShimmer: PALETTE.blush,
  bashBorder: PALETTE.yellow,
  ide: PALETTE.blue,
  fastMode: PALETTE.hotPink,
  fastModeShimmer: PALETTE.blush,
  effortUltra: PALETTE.hotPink,
  // Diffs: dark tints readable under pink and white text
  diffAdded: '#1f3a22',
  diffRemoved: '#3a1f27',
  diffAddedDimmed: '#172a19',
  diffRemovedDimmed: '#2a171c',
  diffAddedWord: '#2e6b33',
  diffRemovedWord: '#6b2e3a',
  // Fullscreen backgrounds
  userMessageBackground: PALETTE.charcoalLight,
  userMessageBackgroundHover: '#2e2e36',
  bashMessageBackgroundColor: '#2a2430',
  memoryBackgroundColor: '#2a2a22',
  selectionBg: '#4a2f3f',
  // The usage meter and the speaker labels
  rate_limit_fill: PALETTE.pink,
  rate_limit_empty: '#3a3340',
  briefLabelYou: PALETTE.blue,
  briefLabelClaude: PALETTE.pink,
  // The eight subagent seats
  red_FOR_SUBAGENTS_ONLY: PALETTE.red,
  blue_FOR_SUBAGENTS_ONLY: PALETTE.blue,
  green_FOR_SUBAGENTS_ONLY: PALETTE.neon,
  yellow_FOR_SUBAGENTS_ONLY: PALETTE.yellow,
  purple_FOR_SUBAGENTS_ONLY: PALETTE.lavender,
  orange_FOR_SUBAGENTS_ONLY: PALETTE.peach,
  pink_FOR_SUBAGENTS_ONLY: PALETTE.hotPink,
  cyan_FOR_SUBAGENTS_ONLY: PALETTE.mint,
  // The ultrathink rainbow, in the band's colors
  rainbow_red: PALETTE.red,
  rainbow_orange: PALETTE.peach,
  rainbow_yellow: PALETTE.yellow,
  rainbow_green: PALETTE.neon,
  rainbow_blue: PALETTE.blue,
  rainbow_indigo: PALETTE.lavender,
  rainbow_violet: PALETTE.hotPink,
  rainbow_red_shimmer: '#ff93a3',
  rainbow_orange_shimmer: '#ffd0ad',
  rainbow_yellow_shimmer: '#ffe6a3',
  rainbow_green_shimmer: '#9dff8a',
  rainbow_blue_shimmer: '#bcd3ff',
  rainbow_indigo_shimmer: '#dccbff',
  rainbow_violet_shimmer: PALETTE.blush,
}

/** The light twin: the same roles in deeper pinks and tints that read on a pale terminal. */
export const THEME_OVERRIDES_LIGHT: Readonly<Record<string, string>> = {
  claude: '#c2185b',
  claudeShimmer: '#e91e63',
  text: '#2a2230',
  inverseText: '#fff5f9',
  inactive: '#7a6f80',
  inactiveShimmer: '#9a8fa0',
  subtle: '#b8aebe',
  suggestion: '#ad1457',
  remember: '#8a6d00',
  success: '#1b7f2a',
  error: '#c62828',
  warning: '#9a6b00',
  warningShimmer: '#c9a227',
  merged: '#6a1b9a',
  promptBorder: '#c2185b',
  promptBorderShimmer: '#e91e63',
  permission: '#ad1457',
  permissionShimmer: '#f48fb1',
  planMode: '#1e5bbf',
  autoAccept: '#ad1457',
  autoAcceptShimmer: '#f48fb1',
  bashBorder: '#9a6b00',
  ide: '#1e5bbf',
  fastMode: '#e91e63',
  fastModeShimmer: '#f48fb1',
  effortUltra: '#e91e63',
  diffAdded: '#dcf5dd',
  diffRemoved: '#fde0e6',
  diffAddedDimmed: '#edf9ee',
  diffRemovedDimmed: '#fdeef1',
  diffAddedWord: '#a9e5ad',
  diffRemovedWord: '#f8b6c4',
  userMessageBackground: '#fdf0f5',
  userMessageBackgroundHover: '#fbe4ec',
  bashMessageBackgroundColor: '#f6eef9',
  memoryBackgroundColor: '#f7f3e4',
  selectionBg: '#f9c9db',
  rate_limit_fill: '#c2185b',
  rate_limit_empty: '#f3dfe8',
  briefLabelYou: '#1e5bbf',
  briefLabelClaude: '#c2185b',
  red_FOR_SUBAGENTS_ONLY: '#c62828',
  blue_FOR_SUBAGENTS_ONLY: '#1e5bbf',
  green_FOR_SUBAGENTS_ONLY: '#1b7f2a',
  yellow_FOR_SUBAGENTS_ONLY: '#9a6b00',
  purple_FOR_SUBAGENTS_ONLY: '#6a1b9a',
  orange_FOR_SUBAGENTS_ONLY: '#c05a0f',
  pink_FOR_SUBAGENTS_ONLY: '#e91e63',
  cyan_FOR_SUBAGENTS_ONLY: '#00838f',
  rainbow_red: '#c62828',
  rainbow_orange: '#c05a0f',
  rainbow_yellow: '#9a6b00',
  rainbow_green: '#1b7f2a',
  rainbow_blue: '#1e5bbf',
  rainbow_indigo: '#6a1b9a',
  rainbow_violet: '#e91e63',
  rainbow_red_shimmer: '#e57373',
  rainbow_orange_shimmer: '#f0a070',
  rainbow_yellow_shimmer: '#d4b24c',
  rainbow_green_shimmer: '#66bb6a',
  rainbow_blue_shimmer: '#6f9bdf',
  rainbow_indigo_shimmer: '#a56cc1',
  rainbow_violet_shimmer: '#f48fb1',
}

/** The pink lights a file cycles through while it is being edited. */
export const SHIMMER = ['#ff8fc4', '#ffb3d9', '#ffd6ea', '#ffb3d9', '#ff69b4', '#ff8fc4'] as const

/** The cycle of the "playing" marker beside a working member. */
export const NOTES = ['♪', '♫', '♩', '♬'] as const

export type MemberCard = {
  name: string
  full: string
  instrument: string
  role: string
  color: string
  faces: Record<KessokuMood, string>
  lines: Record<KessokuMood, string>
}

/**
 * The band. Faces are plain text, one per mood, each at most FACE_WIDTH
 * columns and free of combining marks, fullwidth forms and right-to-left
 * letters, so the rows they head stay aligned on every terminal.
 */
export const MEMBERS: Record<KessokuMember, MemberCard> = {
  bocchi: {
    name: 'Bocchi',
    full: 'Hitori Gotoh',
    instrument: 'lead guitar',
    role: 'main agent · heavy tasks',
    color: PALETTE.pink,
    faces: {
      anxious: '(;´Д`)',
      focused: '( •_•)♪',
      happy: '(≧▽≦)',
      panic: '(ﾟДﾟ;)',
      melting: '(x_x)…',
      hiding: '[(._.)]',
    },
    lines: {
      anxious: '"...um, hi"',
      focused: 'playing, head down',
      happy: 'nailed it!',
      panic: 'a wrong note!!',
      melting: 'melting... context too full',
      hiding: 'hiding in the box',
    },
  },
  nijika: {
    name: 'Nijika',
    full: 'Nijika Ijichi',
    instrument: 'drums',
    role: 'coordinator · scheduling',
    color: PALETTE.yellow,
    faces: {
      anxious: '(^-^)/',
      focused: '(•ᴗ•)♪',
      happy: '(*^▽^*)',
      panic: '(>_<)!',
      melting: '(^-^;)',
      hiding: '(^-^)…',
    },
    lines: {
      anxious: 'keeping time',
      focused: 'counting in: 1, 2, 3, 4!',
      happy: 'that was the best!',
      panic: 'okay okay, from the top!',
      melting: 'we need a break...',
      hiding: 'where did everyone go?',
    },
  },
  ryo: {
    name: 'Ryo',
    full: 'Ryo Yamada',
    instrument: 'bass',
    role: 'background · refactors · db',
    color: PALETTE.blue,
    faces: {
      anxious: '(-_-)',
      focused: '(¬_¬)♩',
      happy: '(-▽-)',
      panic: '(¬_¬;)',
      melting: '(-_-)…',
      hiding: '(-_-)zz',
    },
    lines: {
      anxious: 'quiet. efficient.',
      focused: 'holding the low end',
      happy: '...not bad.',
      panic: '...oops.',
      melting: 'running out of strings',
      hiding: 'went to buy weeds',
    },
  },
  kita: {
    name: 'Kita',
    full: 'Ikuyo Kita',
    instrument: 'vocals & rhythm',
    role: 'ui · frontend · docs',
    color: PALETTE.coral,
    faces: {
      anxious: '(★ω★)',
      focused: '(ﾉ≧∀≦)ﾉ',
      happy: '\\(>∀<)/',
      panic: '(☆_☆;)',
      melting: '(★_★)…',
      hiding: '(★ω★)?',
    },
    lines: {
      anxious: 'so excited!!',
      focused: 'KITAAAAN~ ✧',
      happy: 'everyone, that was amazing!',
      panic: 'eek, hold on!',
      melting: 'need... sparkle...',
      hiding: 'guitar hero? never heard of her',
    },
  },
}

/** The widest face, in columns; `padFace` pads every face to it. */
export const FACE_WIDTH = 7

function isWide(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  )
}

/**
 * Terminal columns a string takes: combining marks and zero-width characters
 * none, East Asian wide glyphs and emoji two (a VS16 widens the glyph before
 * it, a ZWJ sequence counts once, a skin-tone modifier adds nothing), the rest one.
 */
export function textWidth(text: string): number {
  let width = 0
  let joined = false
  for (const ch of text) {
    const cp = ch.codePointAt(0) as number
    if (cp === 0x200d) {
      joined = true
      continue
    }
    if (/\p{M}/u.test(ch) || cp === 0x200b || cp === 0x200c || cp === 0xfeff || (cp >= 0x1f3fb && cp <= 0x1f3ff)) continue
    if (cp === 0xfe0f) {
      if (width > 0 && !joined) width += 1 // text-presentation glyph shown as emoji
      continue
    }
    if (joined) {
      joined = false
      continue // the glyph after a ZWJ belongs to the sequence before it
    }
    const emoji = cp >= 0x1f000 && /\p{Extended_Pictographic}/u.test(ch)
    const flag = cp >= 0x1f1e6 && cp <= 0x1f1ff
    width += isWide(cp) || emoji || flag ? 2 : 1
    if (flag) width -= 1 // a pair of regional indicators is one flag of two cells
  }
  return width
}

/** A face padded with spaces to FACE_WIDTH columns, so the text after it lines up across rows. */
export function padFace(face: string, width = FACE_WIDTH): string {
  return face + ' '.repeat(Math.max(0, width - textWidth(face)))
}

/** Words the spinner uses in place of the engine's verb (terminal only). */
export const SPINNER_WORDS = [
  'Shredding',
  'Soundchecking',
  'Tuning',
  'Counting in',
  'Riffing',
  'Jamming',
  'Strumming',
  'Rehearsing',
  'Noodling',
  'Looping',
  'Sweating',
  'Hyping',
  'Amping',
  'Encore-ing',
  'Wailing',
  'Plucking',
] as const

/** Spinner words by what the turn is doing, so the verb means something. */
export const SPINNER_WORDS_BY_MODE: Readonly<Record<string, readonly string[]>> = {
  thinking: ['Tuning', 'Soundchecking', 'Rehearsing', 'Noodling'],
  requesting: ['Counting in', 'Amping', 'Sweating'],
  'tool-input': ['Plucking', 'Looping'],
  'tool-use': ['Shredding', 'Riffing', 'Jamming', 'Strumming'],
  responding: ['Wailing', 'Hyping', 'Encore-ing'],
}

/** Past-tense words for the line that closes a turn (`Encored for 3s`). */
export const TURN_WORDS = ['Encored', 'Jammed', 'Shredded', 'Soundchecked', 'Riffed', 'Rehearsed', 'Looped', 'Wailed'] as const

/** The dropped guitar, for the Blast Radius guard screen. Original ASCII art, every row 54 columns. */
export const GUITAR = [
  '        .-""""-.                                      ',
  '       /   ()   \\___________________________          ',
  '      |    ()    |___________________________|===|>   ',
  '       \\        /         *  C R A S H  *             ',
  "        '-....-'                                      ",
] as const

/** A stable pick from a list, keyed by any string (so a redraw keeps its word). */
export function pick<T>(list: readonly T[], key: string): T {
  let h = 2166136261
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return list[h % list.length] as T
}
