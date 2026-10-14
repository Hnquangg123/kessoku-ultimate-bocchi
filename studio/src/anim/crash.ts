// The dropped guitar: Bocchi's black Les Paul tumbles in from the top of the
// frame at a steep angle, hits the stage flat, bounces once, and the CRASH
// pops up in the 2x font. For the Blast Radius screen, 96x32 (and its 48x16
// mini), ten frames a second.

import { blank, downscale2, gridSize, shift, stamp, stampFx, stampText, textWidth } from '../art/compose'
import type { Pixels } from '../art/compose'
import type { MemberArt } from '../art/types'

export const CRASH_W = 96
export const CRASH_H = 32
export const CRASH_MINI_W = CRASH_W / 2
export const CRASH_MINI_H = CRASH_H / 2

/** The stage floor: two rows at the bottom. */
const FLOOR = '#5e5866'
const FLOOR_LIGHT = '#8a8392'
const STAR = '#ffd166'
const PINK = '#ff69b4'
const RED = '#ff5d73'
/** The colors the crash paints beside the guitar's own (the effects' highlights come from `highlight`). */
export const CRASH_COLORS: readonly string[] = [FLOOR, FLOOR_LIGHT, STAR, PINK, RED]
/** The ones that color an effect (and so have a highlight too). */
export const CRASH_FX_COLORS: readonly string[] = [STAR, PINK]

/** `bottom` is the row the guitar's lowest pixel sits on; flat on the stage that is REST (the floor is rows 30-31). */
type Beat = { hold: number; bottom: number; tilt: boolean; stars: number; text: boolean }

const REST = CRASH_H - 3

const BEATS: readonly Beat[] = [
  { hold: 2, bottom: 9, tilt: true, stars: 0, text: false },
  { hold: 1, bottom: 16, tilt: true, stars: 0, text: false },
  { hold: 1, bottom: REST, tilt: true, stars: 0, text: false },
  { hold: 1, bottom: REST, tilt: false, stars: 2, text: false },
  { hold: 1, bottom: REST - 3, tilt: false, stars: 3, text: true },
  { hold: 1, bottom: REST, tilt: false, stars: 1, text: true },
  { hold: 6, bottom: REST, tilt: false, stars: 0, text: true },
  { hold: 3, bottom: REST, tilt: false, stars: 0, text: false },
]

export const CRASH_FRAMES = BEATS.reduce((n, b) => n + b.hold, 0)

function beatAt(f: number): Beat {
  let n = ((f % CRASH_FRAMES) + CRASH_FRAMES) % CRASH_FRAMES
  for (const b of BEATS) {
    if (n < b.hold) return b
    n -= b.hold
  }
  return BEATS[0] as Beat
}

export function drawCrash(bocchi: MemberArt, f: number): Pixels {
  const b = beatAt(f)
  let px = blank(CRASH_W, CRASH_H)
  const flat = bocchi.extras?.guitarFlat
  const tilt = bocchi.extras?.guitarTilt ?? flat
  const grid = b.tilt ? tilt : flat
  if (grid !== undefined) {
    const { h } = gridSize(grid)
    // The flat guitar lies left of center (the CRASH takes the right); the tilted one falls onto the same spot,
    // its lower bout leading.
    const x = Math.floor((CRASH_W - gridSize(flat ?? grid).w) / 2) - 14 + (b.tilt ? 8 : 0)
    stamp(px, grid, bocchi.palette, x, 0)
    px = shift(px, 0, b.bottom - (h - 1))
  }
  // The stage floor and its lit edge.
  for (let x = 2; x < CRASH_W - 2; x += 1) {
    ;(px[CRASH_H - 2] as (string | null)[])[x] = FLOOR_LIGHT
    ;(px[CRASH_H - 1] as (string | null)[])[x] = FLOOR
  }
  if (b.stars >= 1) stampFx(px, 'star', 6, 14, STAR)
  if (b.stars >= 2) stampFx(px, 'star', 50, 16, STAR)
  if (b.stars >= 3) stampFx(px, 'sparkle', 28, 4, PINK)
  if (b.text) stampText(px, 'CRASH', CRASH_W - 4 - textWidth('CRASH', 2), 3, RED, 2)
  return px
}

/** The crash halved for the terminal's small spots, 48x16. */
export function drawCrashMini(bocchi: MemberArt, f: number): Pixels {
  return downscale2(drawCrash(bocchi, f))
}
