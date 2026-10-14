// The little things that fly around the band: notes, sweat, sparkles, the
// panic mark, sleep z's, hearts, impact stars, drips, dust, Bocchi's gloom
// lines, and a 3x5 pixel font for the CRASH of the dropped guitar.
//
// Drawn at the v2 density (about twice v1's size). Each effect is written as
// its shape, `x` the effect's color and `h` its highlight (a lighter tint of
// the color, on the side the light comes from: the upper right), and
// `outlined` gives it a clean 1-pixel outline `o` on every side a filled pixel
// shows to the outside (never the diagonal corners, so curves stay round).
// `stampFx` in ./compose paints x, h and o (and an effect's own inks, FX_INKS);
// `.` is transparent. FX_MINI holds v1's small ones for the 16x16 minis.
//
// (No "stress" mark: the thin black cross beside her cheek in the reference
// JPEG is the drawing program's cursor, not art.)

import type { Grid, Palette } from './types'

export type FxKind = 'note' | 'note2' | 'sweat' | 'sparkle' | 'twinkle' | 'bang' | 'zz' | 'heart' | 'star' | 'drop' | 'dust' | 'gloom'

/** A shape with one pixel of margin all round, outlined with `o` wherever a filled pixel touches the outside (4-neighbours). */
export function outlined(core: Grid): Grid {
  const w = Math.max(0, ...core.map(r => [...r].length)) + 2
  const h = core.length + 2
  const cells = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => [...(core[y - 1] ?? '')][x - 1] ?? '.'))
  const filled = (x: number, y: number) => {
    const c = cells[y]?.[x]
    return c !== undefined && c !== '.' && c !== 'o'
  }
  const out = cells.map((row, y) => row.map((c, x) => (c === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? 'o' : c)))
  return out.map(r => r.join(''))
}

export const FX: Readonly<Record<FxKind, Grid>> = {
  // ♪ an eighth note, 8x10: a filled tilted head, the stem on its right, the flag curling down
  note: outlined([
    '...x..',
    '...xx.',
    '...x.x',
    '...x.x',
    '...x..',
    '.xhx..',
    'xxxx..',
    '.xx...',
  ]),
  // ♫ a beamed pair, 11x10
  note2: outlined([
    '...xxxxxx',
    '...xxxxhx',
    '...x....x',
    '...x....x',
    '...x....x',
    '.xhx..xhx',
    'xxxx.xxxx',
    '.xx...xx.',
  ]),
  // a drop of nervous sweat, 5x7: a pointed top, a round bulb, a glint
  sweat: outlined([
    '.x.',
    '.x.',
    'xxh',
    'xxx',
    'xxx',
  ]),
  // a four-point sparkle, 9x9
  sparkle: outlined([
    '...x...',
    '...x...',
    '..xxx..',
    'xxxhxxx',
    '..xxx..',
    '...x...',
    '...x...',
  ]),
  // a small twinkle, 5x5: the sparkle's in-between
  twinkle: outlined([
    '.x.',
    'xhx',
    '.x.',
  ]),
  // the panic mark, 4x11
  bang: outlined([
    'xh',
    'xx',
    'xx',
    'xx',
    'xx',
    'xx',
    '..',
    'xx',
    'xx',
  ]),
  // a sleepy z, 7x7
  zz: outlined([
    'xxxxh',
    '...x.',
    '..x..',
    '.x...',
    'xxxxx',
  ]),
  // a heart, 9x8
  heart: outlined([
    '.xx.xx.',
    'xxxxxhx',
    'xxxxxxx',
    '.xxxxx.',
    '..xxx..',
    '...x...',
  ]),
  // an impact star, 9x9: four long rays and four short ones
  star: outlined([
    '...x...',
    '.x.x.x.',
    '..xxx..',
    'xxxhxxx',
    '..xxx..',
    '.x.x.x.',
    '...x...',
  ]),
  // a falling drip, 4x5: a point on top, a round bulb with a glint
  drop: outlined([
    '.x',
    'xh',
    'xx',
  ]),
  // dust kicked up on landing, 9x6: a big puff and a small one
  dust: outlined([
    '.xh....',
    'xxxx.x.',
    'xxxxxhx',
    '.xx.xx.',
  ]),
  // Bocchi's gloom lines beside her head (the anime's shorthand for her dread), 13x9: three short wavy
  // vertical strokes, each about 3x8, two columns apart, the middle one a row lower. No outline: the
  // strokes are the line, `x` in the key's dark violet (GLOOM, #4b3b6b) edged on the lit side with
  // `e` (#6d5a92, FX_INKS).
  gloom: [
    '.x.........x.',
    '.xe...x....xe',
    '.xe...xe...xe',
    'xe....xe..xe.',
    'xe...xe...xe.',
    '.xe..xe....xe',
    '.xe...xe...xe',
    '.x....xe...x.',
    '......x......',
  ],
}

/** Colors an effect always paints with, whatever color its key gives it: the gloom lines' lighter edge. */
export const FX_INKS: Readonly<Partial<Record<FxKind, Palette>>> = {
  gloom: { e: '#6d5a92' },
}

/**
 * The effects at the minis' size (16x16): v1's own grids, as small as they
 * were drawn for its 16x16 heads. `x` takes the effect's color, `o` the
 * outline (the twinkle's center), and the gloom its edge `e` (FX_INKS).
 */
export const FX_MINI: Readonly<Record<FxKind, Grid>> = {
  // ♪
  note: ['..xx.', '..x.x', '..x..', '..x..', 'xxx..', 'xx...'],
  // ♫
  note2: ['.xxxx', '.x..x', '.x..x', '.x..x', 'xx.xx', 'x..x.'],
  // a drop of nervous sweat
  sweat: ['.x.', 'xxx', 'xxx', '.x.'],
  // a four-point sparkle
  sparkle: ['..x..', '..x..', 'xxxxx', '..x..', '..x..'],
  // a small twinkle
  twinkle: ['.x.', 'xox', '.x.'],
  // the panic mark
  bang: ['xx', 'xx', 'xx', 'xx', '..', 'xx'],
  // z
  zz: ['xxx', '..x', '.x.', 'xxx'],
  // a heart
  heart: ['xx.xx', 'xxxxx', '.xxx.', '..x..'],
  // an impact star
  star: ['x...x', '.x.x.', '..x..', '.x.x.', 'x...x'],
  // a melting drip
  drop: ['x', 'x'],
  // dust kicked up on landing
  dust: ['.x.', 'x.x'],
  // the gloom lines (new in v2): three dark strokes, the middle one longer, lit tips
  gloom: ['x.x.x', 'x.x.x', 'e.x.e', '..e..'],
}

/** An effect's size in pixels (in `table`: FX, or FX_MINI for the minis). */
export function fxSize(kind: FxKind, table: Readonly<Record<FxKind, Grid>> = FX): { fw: number; fh: number } {
  const g = table[kind]
  return { fw: Math.max(0, ...g.map(r => [...r].length)), fh: g.length }
}

/** The pixel font: 3x5 capitals, for CRASH, the band's name and the mood labels (drawn at any whole scale). */
export const FONT: Readonly<Record<string, Grid>> = {
  A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'],
  B: ['xx.', 'x.x', 'xx.', 'x.x', 'xx.'],
  C: ['.xx', 'x..', 'x..', 'x..', '.xx'],
  D: ['xx.', 'x.x', 'x.x', 'x.x', 'xx.'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
  F: ['xxx', 'x..', 'xx.', 'x..', 'x..'],
  G: ['.xx', 'x..', 'x.x', 'x.x', '.xx'],
  H: ['x.x', 'x.x', 'xxx', 'x.x', 'x.x'],
  I: ['xxx', '.x.', '.x.', '.x.', 'xxx'],
  J: ['..x', '..x', '..x', 'x.x', '.x.'],
  K: ['x.x', 'x.x', 'xx.', 'x.x', 'x.x'],
  L: ['x..', 'x..', 'x..', 'x..', 'xxx'],
  M: ['x.x', 'xxx', 'xxx', 'x.x', 'x.x'],
  N: ['xx.', 'x.x', 'x.x', 'x.x', 'x.x'],
  O: ['.x.', 'x.x', 'x.x', 'x.x', '.x.'],
  P: ['xx.', 'x.x', 'xx.', 'x..', 'x..'],
  Q: ['.x.', 'x.x', 'x.x', 'xx.', '.xx'],
  R: ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'],
  S: ['.xx', 'x..', '.x.', '..x', 'xx.'],
  T: ['xxx', '.x.', '.x.', '.x.', '.x.'],
  U: ['x.x', 'x.x', 'x.x', 'x.x', 'xxx'],
  V: ['x.x', 'x.x', 'x.x', 'x.x', '.x.'],
  W: ['x.x', 'x.x', 'xxx', 'xxx', 'x.x'],
  X: ['x.x', 'x.x', '.x.', 'x.x', 'x.x'],
  Y: ['x.x', 'x.x', '.x.', '.x.', '.x.'],
  Z: ['xxx', '..x', '.x.', 'x..', 'xxx'],
  '0': ['.x.', 'x.x', 'x.x', 'x.x', '.x.'],
  '1': ['.x.', 'xx.', '.x.', '.x.', 'xxx'],
  '2': ['xx.', '..x', '.x.', 'x..', 'xxx'],
  '3': ['xx.', '..x', '.x.', '..x', 'xx.'],
  '4': ['x.x', 'x.x', 'xxx', '..x', '..x'],
  '5': ['xxx', 'x..', 'xx.', '..x', 'xx.'],
  '6': ['.xx', 'x..', 'xx.', 'x.x', '.x.'],
  '7': ['xxx', '..x', '.x.', '.x.', '.x.'],
  '8': ['.x.', 'x.x', '.x.', 'x.x', '.x.'],
  '9': ['.x.', 'x.x', '.xx', '..x', 'xx.'],
  '!': ['x', 'x', 'x', '.', 'x'],
  '-': ['...', '...', 'xxx', '...', '...'],
  ':': ['.', 'x', '.', 'x', '.'],
  '+': ['...', '.x.', 'xxx', '.x.', '...'],
  '.': ['.', '.', '.', '.', 'x'],
  ',': ['.', '.', '.', 'x', 'x'],
  '/': ['..x', '..x', '.x.', 'x..', 'x..'],
  '(': ['.x', 'x.', 'x.', 'x.', '.x'],
  ')': ['x.', '.x', '.x', '.x', 'x.'],
  ' ': ['..', '..', '..', '..', '..'],
}
