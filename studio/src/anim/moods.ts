// The mood timelines: which pose, face, squash, sway and effects each frame shows.
//
// Written the way a pixel-art animator keeps an Aseprite file: a loop a mood,
// laid out in tracks (layers): the body's pose, the face, the breath or the
// beat (squash), the hair's sway, the move, the melt, and the effects as
// flights (one place a frame from the frame they start on). `frames` lays the
// tracks out frame by frame, `loop` merges identical neighbours back into keys
// with holds, `sceneAt` expands a tag to its frames; the Remotion compositions
// draw one frame each, and the export folds the identical neighbours again.
// ANIM-BRIEF.md is the contract (the beats, the principles); ART-BRIEF.md has
// the poses, faces, sway overlays and squash these keys name;
// reference/character-notes.md the personalities the timing plays.
//
// The four loops of a mood run on one clock (the mod plays every loop from the
// same zero), so a mood's loops are the same length for all four and the beats
// are placed member by member: no two blink, glance, breathe, bob or jump on
// the same frame, and the neighbours in the band's row (Bocchi and Nijika,
// Nijika and Ryo, Ryo and Kita) keep two frames between their body beats. Each
// loop is drawn to cost few distinct frames (the mod layers a sprite's frames
// into one SVG): the tracks change together where they can, and long holds sit
// between.
//
// The small views see less of the body: the portrait window rides with the
// head (a breath or a beat's squash keeps the face still in it) and the hair's
// sway mostly falls outside it; the mini ignores squash and sway altogether.
// So the faces and the effects carry the life there, and every loop keeps
// something changing in every view at least every half second or so.
//
// Effects keep to each member's open side. Where the full figure's place would
// land on what identifies her in the portrait or the mini (Bocchi's cubes and
// ahoge on the left, Nijika's Dorito on top and side tail on the right, Ryo's
// pins on the left, Kita's side tail on the right), on her eyes, or be cut at
// the window's edge, the effect flies its own path in those views (`twice`,
// `thrice`): whole inside the window, off her face and her features. The mini
// has little room beside a 16x16 head, so its sparkles are glints in a free
// corner (a small one, the twinkle, a small one) and its notes single.

import type { FxKind } from '../art/fx'
import { resolvePose } from '../art/compose'
import type { FaceName, MemberArt, MemberId, Mood, PeekName, PoseName } from '../art/types'
import type { View } from './scene'

/** 10 frames a second: 100 ms a frame, the classic pixel-art beat (and the mod's sprite clock). */
export const FPS = 10

export const MOODS: readonly Mood[] = ['anxious', 'focused', 'happy', 'panic', 'melting', 'hiding']
export const MEMBER_IDS: readonly MemberId[] = ['bocchi', 'nijika', 'ryo', 'kita']

/**
 * An effect. By default (`on: 'head'`) at a spot measured from the top-left
 * of the portrait window (the head), riding with every move of it; with
 * `on: 'ground'`, x from the window's left and y up from the soles' row (93,
 * negative is up), for dust at the feet: drawn in the full view only; with
 * `on: 'body'`, x and y a point on the pose in canvas pixels (riding with
 * the move, and with the squash above the bend), for what the body does away
 * from the head, like Nijika's stick hits: the portrait and the mini show it
 * only where it falls inside the portrait window, never pulled in. `views`
 * keeps it to the views named (an effect beside Nijika's side tail in the full
 * figure would land on the tail in the portrait and the mini).
 */
export type Fx = {
  kind: FxKind
  x: number
  y: number
  color?: string
  on?: 'head' | 'ground' | 'body'
  views?: readonly View[]
  /** The mini draws it inside a ring of the outline (its small effects have none), for one that crosses her hair there. */
  ring?: boolean
}

export type Key = {
  /** Frames (100 ms each). */
  hold: number
  pose: PoseName
  /** Not on the box. */
  face?: FaceName
  /** The box only. */
  peek?: PeekName
  /** The whole figure moved (shakes, jumps). */
  dx?: number
  dy?: number
  /** Rows above `bend` lowered: 1 a breath or a beat, 2 a landing. Not on the box. */
  squash?: number
  /** The hair's free ends a step aside (stand, playA and playB only). */
  sway?: 'L' | 'R'
  /** 0 whole, 1 a puddle. */
  melt?: number
  fx?: readonly Fx[]
}

export type Tag = { keys: readonly Key[]; direction: 'forward' | 'pingpong' }

/** One frame as drawn. */
export type Scene = Required<Pick<Key, 'pose' | 'dx' | 'dy' | 'squash' | 'melt'>> & { face?: FaceName; peek?: PeekName; sway?: 'L' | 'R'; fx: readonly Fx[] }

const SWEAT = '#9ad8ff'
const GOLD = '#ffd166'
const RIBBON = '#e0405e'
const BANG = '#ff5d73'
const DUST = '#d9d0c7'
/** Kita's heart where it crosses her crimson hair (the portrait and the mini): a light pink that reads on it. */
const BLUSH = '#ffb3c1'
/** Bocchi's gloom lines: a dark violet (edged #6d5a92, the effect's own ink). */
const GLOOM = '#4b3b6b'
/** Ryo's notes: her hair's pale sheen, which reads (outlined) where a note crosses her cobalt hair; her accent does not. */
const SHEEN = '#a2bedd'

/**
 * The color a member's notes and sparkles take: one that stands out against
 * her own hair. Bocchi's pink, Nijika's gold and Kita's red would vanish into
 * it, so they play in gold, ribbon red and gold; Ryo's blue reads off her hair
 * once her notes sit to its right.
 */
function sparkColor(art: MemberArt): string {
  if (art.id === 'bocchi' || art.id === 'kita') return GOLD
  if (art.id === 'nijika') return RIBBON
  return art.accent
}

/** The first row a pose draws on: how much headroom a jump has. */
function topRow(art: MemberArt, pose: PoseName): number {
  const y = resolvePose(art, pose).findIndex(row => /[^.]/.test(row))
  return y < 0 ? 0 : y
}

// ---- The animator's tools: tracks, flights, loops ---------------------------------------------------------

/** A hair sway in a track: a step left, right, or `-` none. */
type Lean = 'L' | 'R' | '-'

/** A run in a track: a value held for so many frames. */
type Run<T> = readonly [value: T, frames: number]

/** A track: its runs laid out frame by frame. */
function track<T>(...runs: readonly Run<T>[]): T[] {
  return runs.flatMap(([v, n]) => Array.from({ length: n }, () => v))
}

/** A track of `n` frames, `rest` everywhere but the spans laid over it (from..to inclusive, on the loop's clock, wrapping past its end). */
function spans<T>(n: number, rest: T, over: readonly (readonly [from: number, to: number, value: T])[]): T[] {
  const out = Array.from({ length: n }, () => rest)
  for (const [from, to, v] of over) {
    for (let k = 0, f = ((from % n) + n) % n; k < n; k += 1, f = (f + 1) % n) {
      out[f] = v
      if (f === ((to % n) + n) % n) break
    }
  }
  return out
}

/** `k` frames of the same thing. */
function rep<T>(k: number, v: T): T[] {
  return Array.from({ length: k }, () => v)
}

/** An effect's flight: where it is on each frame from `at` on (null: not drawn that frame), wrapping round the loop's end. */
type Flight = { at: number; path: readonly (Fx | null)[] }

/** The tracks of a loop, each a frame long (or one value all along). */
type Tracks = {
  pose: PoseName | readonly PoseName[]
  face?: FaceName | readonly FaceName[]
  peek?: PeekName | readonly PeekName[]
  squash?: readonly number[]
  sway?: readonly Lean[]
  dx?: readonly number[]
  dy?: readonly number[]
  melt?: readonly number[]
}

/** The frames of an `n`-frame loop, one key a frame: the tracks read across, the flights' effects gathered. */
function frames(n: number, t: Tracks, flights: readonly Flight[] = []): Key[] {
  const at = <T>(v: T | readonly T[] | undefined, f: number, name: string): T | undefined => {
    if (!Array.isArray(v)) return v as T | undefined
    if (v.length !== n) throw new Error(`moods: the ${name} track is ${v.length} frames, the loop ${n}`)
    return v[f] as T
  }
  const fx: Fx[][] = Array.from({ length: n }, () => [])
  for (const fl of flights) fl.path.forEach((e, i) => e && (fx[(((fl.at + i) % n) + n) % n] as Fx[]).push(e))
  return Array.from({ length: n }, (_, f): Key => {
    const sway = at(t.sway, f, 'sway')
    const k: Key = { hold: 1, pose: at(t.pose, f, 'pose') as PoseName }
    const face = at(t.face, f, 'face')
    const peek = at(t.peek, f, 'peek')
    const squash = at(t.squash, f, 'squash') ?? 0
    const dx = at(t.dx, f, 'dx') ?? 0
    const dy = at(t.dy, f, 'dy') ?? 0
    const m = at(t.melt, f, 'melt') ?? 0
    return {
      ...k,
      ...(k.pose === 'box' ? (peek ? { peek } : {}) : face ? { face } : {}),
      ...(squash ? { squash } : {}),
      ...(sway && sway !== '-' ? { sway } : {}),
      ...(dx ? { dx } : {}),
      ...(dy ? { dy } : {}),
      ...(m ? { melt: m } : {}),
      ...((fx[f] as Fx[]).length ? { fx: fx[f] } : {}),
    }
  })
}

/** A loop's frames as a tag: turned `spin` frames later (frame f shows frame f - spin), identical neighbours folded into holds. */
function loop(keys: readonly Key[], spin = 0): Tag {
  const n = keys.length
  const turned = keys.map((_, f) => keys[(((f - spin) % n) + n) % n] as Key)
  const out: Key[] = []
  for (const k of turned) {
    const last = out[out.length - 1]
    if (last && JSON.stringify({ ...last, hold: 0 }) === JSON.stringify({ ...k, hold: 0 })) out[out.length - 1] = { ...last, hold: last.hold + 1 }
    else out.push({ ...k })
  }
  return { direction: 'forward', keys: out }
}

/** An effect at a spot (its centre at cx, cy for the round ones), in a color, from the head unless said. */
function fxAt(kind: FxKind, x: number, y: number, color: string, more: Partial<Fx> = {}): Fx {
  return { kind, x, y, color, ...more }
}

/** The full figure only. */
const FULL: readonly View[] = ['full']
/** The small views: the portrait window and the mini drawn from it. */
const NEAR: readonly View[] = ['portrait', 'mini']
const PORTRAIT: readonly View[] = ['portrait']
const MINI: readonly View[] = ['mini']
/** The full figure and the portrait (a path the mini flies its own way). */
const BIG: readonly View[] = ['full', 'portrait']

/** A path kept to some views. */
function only(views: readonly View[], path: readonly (Fx | null)[]): (Fx | null)[] {
  return path.map(e => (e ? { ...e, views } : null))
}

/** One effect flown twice from the same frame: `full` in the full figure, `near` in the portrait and the mini. */
function twice(at: number, full: readonly (Fx | null)[], near: readonly (Fx | null)[]): Flight[] {
  return [
    { at, path: only(FULL, full) },
    { at, path: only(NEAR, near) },
  ]
}

/** One effect flown its own way in each view, from the same frame. */
function thrice(at: number, full: readonly (Fx | null)[], portrait: readonly (Fx | null)[], mini: readonly (Fx | null)[]): Flight[] {
  return [
    { at, path: only(FULL, full) },
    { at, path: only(PORTRAIT, portrait) },
    { at, path: only(MINI, mini) },
  ]
}

/** One effect flown one way in the full figure and the portrait, its own way in the mini. */
function bigAndMini(at: number, big: readonly (Fx | null)[], mini: readonly (Fx | null)[]): Flight[] {
  return [
    { at, path: only(BIG, big) },
    { at, path: only(MINI, mini) },
  ]
}

/** A sparkle's pulse centred on (cx, cy): small, big, small (then gone). */
function pulse(cx: number, cy: number, color: string, more: Partial<Fx> = {}): (Fx | null)[] {
  const tw = fxAt('twinkle', cx - 2, cy - 2, color, more)
  return [tw, fxAt('sparkle', cx - 4, cy - 4, color, more), tw]
}

/** A sparkle's pulse rising as it goes: small at (cx, cy), big three rows higher, small three more (then gone). */
function rising(cx: number, cy: number, color: string): (Fx | null)[] {
  return [fxAt('twinkle', cx - 2, cy - 2, color), fxAt('sparkle', cx - 4, cy - 7, color), fxAt('twinkle', cx - 2, cy - 8, color)]
}

/** A sparkle's pulse held big at its peak for `peak` frames: small, big..., small. */
function burst(cx: number, cy: number, color: string, peak: number): (Fx | null)[] {
  const tw = fxAt('twinkle', cx - 2, cy - 2, color)
  return [tw, ...Array.from({ length: peak }, () => fxAt('sparkle', cx - 4, cy - 4, color)), tw]
}

/**
 * The mini's sparkle, for a corner too tight for its big one: a glint rising in a 3x3 corner whose top-left is
 * the mini pixel (mx, my): a spark below (the mini's dust, an upturned V), the twinkle, a spark at the top, gone.
 * Given in portrait-window places (the mini halves them). `peak` holds the twinkle longer.
 */
function glint(mx: number, my: number, color: string, peak = 1): (Fx | null)[] {
  return [fxAt('dust', 2 * mx, 2 * my + 2, color), ...rep(peak, fxAt('twinkle', 2 * mx, 2 * my, color)), fxAt('dust', 2 * mx, 2 * my, color)]
}

/** The mini's sparkle where a corner has no room to rise: a spark, the twinkle, a spark, in place at the mini pixel (mx, my). */
function spot(mx: number, my: number, color: string): (Fx | null)[] {
  const dust = fxAt('dust', 2 * mx, 2 * my, color)
  return [dust, fxAt('twinkle', 2 * mx, 2 * my, color), dust]
}

/** A path through spots, one a frame, in one kind (the last spot may take a smaller kind as it flies off). */
function path(kind: FxKind, spots: readonly (readonly [number, number])[], color: string, last?: FxKind, more: Partial<Fx> = {}): (Fx | null)[] {
  return spots.map(([x, y], i) => fxAt(i === spots.length - 1 && last ? last : kind, x, y, color, more))
}

/** Each member's own take on a mood, built from the shared beats. */
export function tagFor(art: MemberArt, mood: Mood): Tag {
  switch (mood) {
    case 'anxious':
      return anxious(art)
    case 'focused':
      return focused(art)
    case 'happy':
      return happy(art)
    case 'panic':
      return panic(art)
    case 'melting':
      return melting(art)
    case 'hiding':
      return hiding(art)
  }
}

// ---- anxious: the resting loop, 4 s (40 frames) --------------------------------------------------------------
//
// The four side by side (frame numbers on the shared clock):
//   bocchi  sinks 6, 19, 32 · rises 13, 26, 39 (each two frames clear of Nijika's bobs) · hair R 7, 20, 33, L
//           14, 27, 0-1 · eyes dart 3, 33, 38 · glances away 7-24 (a twitch back at 13) · gloom flickers in 9-11,
//           sinks a row at 20, flickers out 28-30 · sweat 19-25 · blinks 25-27 (the sweat gone)
//   nijika  bobs 2, 9, 15, 22, 28, 35 (the tail swinging out on each rise, back a frame after each drop) ·
//           giggles 2-5, 29-31 · blinks 16-18 · looks round 20-23 · twinkles 9 (high), 35 (low)
//   ryo     sinks 20 · rises 32 (the bob tips sway 33-34) · lids lift once, 38-3 · blinks 12-13 (slowly) ·
//           glances 22-29 (eight-frame holds between: she barely moves)
//   kita    sinks 8, 30 · rises 18 (as her glance goes out), 38 · side tail R 9, 31, L 19-21, 39-0 · blinks 38-0 ·
//           glances out 17-22 · sparkles 4 (left), 11 (right), 26 (right), 32 (left)
// No two hairs change on the same frame side by side, and never three at once.

function anxious(art: MemberArt): Tag {
  const n = 40
  const spark = sparkColor(art)
  switch (art.id) {
    case 'bocchi': {
      // Breathing, the hair a frame behind: R as she sinks (held while she is down), L as she rises, then
      // settling. Her eyes dart aside now and then (a twitch). She glances away to the left; the gloom lines
      // flicker in beside her head and hold; her eyes twitch back a moment and away again; the gloom sinks a row
      // as a sweat drop forms and slides down beside her face; she blinks it off, looks back, and the gloom
      // flickers out. (The portrait and the mini ride with the breath, so there the eyes and the effects live.)
      // The gloom keeps beside her head in the full figure and the mini; the portrait has no room beside it, so
      // there it hangs over the top of her hair at the right, all three strokes in the window.
      const gloom = (x: number, y: number): (Fx | null)[] => {
        const g = (dy: number) => fxAt('gloom', x, y + dy, GLOOM)
        return [g(0), null, ...rep(9, g(0)), ...rep(8, g(1)), null, g(1)]
      }
      // The sweat slides a row a frame beside her face; in the mini (where the big drop would lie on her far eye)
      // a drip a column clear of her cheek.
      const sweat = [fxAt('drop', 26, 9, SWEAT), ...[10, 11, 12, 13, 14, 15].map(y => fxAt('sweat', 25, y, SWEAT))]
      const drip = [9, 10, 11, 12, 13, 14, 15].map(y => fxAt('drop', 28, y, SWEAT))
      return loop(
        frames(
          n,
          {
            pose: 'stand',
            squash: spans(n, 0, [
              [6, 12, 1],
              [19, 25, 1],
              [32, 38, 1],
            ]),
            sway: spans<Lean>(n, '-', [
              [7, 13, 'R'],
              [14, 14, 'L'],
              [20, 26, 'R'],
              [27, 27, 'L'],
              [33, 39, 'R'],
              [0, 1, 'L'],
            ]),
            face: spans<FaceName>(n, 'idle', [
              [3, 3, 'glance'],
              [7, 12, 'glance'],
              [14, 24, 'glance'],
              [25, 25, 'half'],
              [26, 26, 'blink'],
              [27, 27, 'half'],
              [33, 33, 'glance'],
              [38, 38, 'glance'],
            ]),
          },
          [...thrice(9, gloom(27, 3), gloom(19, 1), gloom(27, 3)), ...bigAndMini(19, sweat, drip)],
        ),
      )
    }
    case 'nijika': {
      // On the beat: a quick bob (2 frames down) every 6-7 frames. The ponytail swings like a pendulum: it holds
      // its swing through the drop, falls back to the middle a frame later, and swings out the other way as she
      // rises. Her face changes on the bobs (the portrait and the mini ride with them): a giggle, a twinkle, a
      // blink, a look round, a giggle, a twinkle. The two twinkles never twice in one place: high then low on her
      // left hair in the portrait, the mini's top-left corner then its top-right.
      const twinkle = (at: number, high: boolean): Flight[] => thrice(at, pulse(-3, high ? 15 : 22, spark), pulse(4, high ? 5 : 15, spark), high ? glint(0, 0, spark) : spot(13, 0, spark))
      return loop(
        frames(
          n,
          {
            pose: 'stand',
            squash: spans(n, 0, [
              [2, 3, 1],
              [9, 10, 1],
              [15, 16, 1],
              [22, 23, 1],
              [28, 29, 1],
              [35, 36, 1],
            ]),
            sway: spans<Lean>(n, '-', [
              [37, 2, 'L'],
              [4, 9, 'R'],
              [11, 15, 'L'],
              [17, 22, 'R'],
              [24, 28, 'L'],
              [30, 35, 'R'],
            ]),
            face: spans<FaceName>(n, 'idle', [
              [2, 5, 'happy'],
              [16, 16, 'half'],
              [17, 17, 'blink'],
              [18, 18, 'half'],
              [20, 23, 'glance'],
              [29, 31, 'happy'],
            ]),
          },
          [...twinkle(9, true), ...twinkle(35, false)],
        ),
      )
    }
    case 'ryo': {
      // Still: one long slow breath (down 12 frames), her bob tips swaying once, a frame late, after she rises.
      // Heavy half lids, held: they lift once, slowly (six frames); one slow blink (two frames shut); one long
      // glance aside. Eight frames between her looks: she barely moves.
      return loop(
        frames(n, {
          pose: 'stand',
          squash: spans(n, 0, [[20, 31, 1]]),
          sway: spans<Lean>(n, '-', [[33, 34, 'R']]),
          face: spans<FaceName>(n, 'half', [
            [38, 3, 'idle'],
            [12, 13, 'blink'],
            [22, 29, 'glance'],
          ]),
        }),
      )
    }
    case 'kita': {
      // Confident: two slow breaths, the side tail a frame behind (R while she is down, L as she rises); her
      // sparkles twinkling beside her eyes in turn (the Kita aura); a glance out to the crowd; one blink.
      // The left sparkle sits on her hair beside the near eye in the portrait, the right one on her hair's edge
      // beside the far eye (below the side tail); the mini's are glints in its free corners.
      const left = (at: number): Flight[] => thrice(at, pulse(-4, 15, spark), pulse(4, 12, spark), glint(0, 0, spark))
      const right = (at: number): Flight[] => thrice(at, pulse(27, 21, spark), pulse(27, 21, spark), glint(13, 7, spark))
      return loop(
        frames(
          n,
          {
            pose: 'stand',
            squash: spans(n, 0, [
              [8, 17, 1],
              [30, 37, 1],
            ]),
            sway: spans<Lean>(n, '-', [
              [9, 18, 'R'],
              [19, 21, 'L'],
              [31, 38, 'R'],
              [39, 0, 'L'],
            ]),
            face: spans<FaceName>(n, 'idle', [
              [38, 38, 'half'],
              [39, 39, 'blink'],
              [0, 0, 'half'],
              [17, 22, 'glance'],
            ]),
          },
          [...left(4), ...right(11), ...right(26), ...left(32)],
        ),
      )
    }
  }
}

// ---- focused: playing, 1.6 s (16 frames, four bars of four) ------------------------------------------------
//
// The band in a ripple, not in step: each member dips (squash 1) on her own beat of the bar, and her hair
// sways one frame after her own dip, a side a bar (R, then L). On the shared clock:
//   bocchi  strokes every frame (stand, playB, stand, playA) · dips 1 (the downstroke) · hair 2 · a note leaves
//           1, 5, 9, 13 · blinks 12-14 (half, shut on her hit at 13, half)
//   nijika  sticks strike 1 (playA) and 3 (playB), the star at the tip · dips 2 (the follow-through) · hair 3 ·
//           notes 3, 7, 11, 15
//   ryo     half time (two frames a pose) · nods late, 4 and 12 · tips 5 and 13 · notes 2, 6, 10, 14
//   kita    down (playB) 3 and ringing on 0, rest 1, up (playA) 2 · dips 3 · hair 0 · notes 0, 4, 8, 12 · eye
//           twinkles 4 and 12 · blinks 13-15 (half, shut at 14, half: a frame behind Bocchi, so never both shut)
// So the dips run down the row (1, 2, 3, then Ryo on 4 every other bar) and Kita's strokes sit off Bocchi's
// and Nijika's parity (she rests on 1 when they strike). The blinks (the brief's half, blink, half) both fall in
// the last bar, open again before the loop closes; Nijika and Ryo, between them in the row, never blink here.

/**
 * Where a member's notes fly. The full figure: two in flight, single and beamed in turn, a new one every 4
 * frames, each rising 2 rows a frame for 8 frames from beside the instrument (above the headstock for the
 * guitars and the bass, beside the sticks' hands for Nijika) past the head, in an arc: no drift for two frames,
 * then a column a frame, then a column every other frame, outward. The portrait: one note at a time (every
 * other one of the full figure's; two would stack into one chain in a 32-row window), single, whole inside the
 * window beside the head, drifting a column; Nijika's beside her left hair, below the Dorito; Ryo's straight up
 * in the free strip right of her bob (her pins are on the other side). The mini: one at a time, single, in a free
 * corner of the 16x16 above the eyes (a small twinkle low, the note, the note a row higher, then an empty frame
 * before the next); Nijika's mini has no corner a note fits, so hers glints on the beat instead. `color` where
 * the member's spark color would vanish on her hair (Ryo's: her sheen), `ring` where the mini's note crosses her
 * hair (Ryo's crown fills the corner to its edge, so the note's head lies on it, ringed in the outline).
 */
const NOTE_PATHS: Readonly<
  Record<MemberId, { side: 1 | -1; full: readonly [number, number]; portrait: readonly [x: number, y: number, drift: number]; mini: readonly (readonly [FxKind, number, number])[] | null; color?: string; ring?: boolean }>
> = {
  bocchi: {
    side: 1,
    full: [29, 20],
    portrait: [23, 20, 1],
    mini: [
      ['twinkle', 26, 10],
      ['note', 22, 2],
      ['note', 22, 0],
    ],
  },
  nijika: { side: -1, full: [-9, 24], portrait: [0, 20, 0], mini: null },
  ryo: {
    side: 1,
    full: [30, 18],
    portrait: [25, 20, 0],
    mini: [
      ['twinkle', 26, 10],
      ['note', 22, 2],
      ['note', 22, 0],
    ],
    color: SHEEN,
    ring: true,
  },
  kita: {
    side: -1,
    full: [-12, 21],
    portrait: [1, 18, 1],
    mini: [
      ['twinkle', 0, 8],
      ['note', 0, 2],
      ['note', 0, 0],
    ],
  },
}

/** The arc's drift by a note's age (frames): none for two, then a column a frame, then every other frame. */
const ARC = [0, 0, 1, 2, 3, 3, 4, 4] as const

/**
 * The notes' flights, leaving on frames `first`, +4, +8, +12 (each member on her own beat of the bar, so the
 * four never send theirs up together); the portrait flies only those leaving on `first` and +8.
 */
function notes(art: MemberArt, first: number): Flight[] {
  const p = NOTE_PATHS[art.id]
  const color = p.color ?? sparkColor(art)
  return [0, 4, 8, 12].flatMap(k => {
    const kind: FxKind = k % 8 === 0 ? 'note' : 'note2'
    const at = first + k
    return [
      { at, path: ARC.map((d, age) => fxAt(kind, p.full[0] + p.side * d, p.full[1] - 2 * age, color, { views: FULL })) },
      ...(k % 8 === 0 ? [{ at, path: ARC.map((d, age) => fxAt('note', p.portrait[0] + p.side * Math.min(p.portrait[2], d), p.portrait[1] - 2 * age, color, { views: PORTRAIT })) }] : []),
      ...(p.mini ? [{ at, path: p.mini.map(([kd, x, y]) => fxAt(kd, x, y, color, { views: MINI, ...(p.ring ? { ring: true } : {}) })) }] : []),
    ]
  })
}

/** Four bars of four frames: the same bar four times. */
function bars<T>(...bar: readonly Run<T>[]): T[] {
  return Array.from({ length: 4 }, () => track(...bar)).flat()
}

/** Something on one beat (0-3) of every bar, the rest `rest`; `sides` alternate bar by bar (the hair R, then L). */
function onBeat<T>(beat: number, rest: T, ...sides: readonly T[]): T[] {
  return Array.from({ length: 16 }, (_, f) => (f % 4 === beat ? (sides[Math.floor(f / 4) % sides.length] as T) : rest))
}

function focused(art: MemberArt): Tag {
  const n = 16
  switch (art.id) {
    case 'bocchi':
      // Sure-handed: stand (on the strings), playB (the downstroke, squash 1 on the hit), stand, playA (the
      // upstroke), a frame each; her hair flies out a frame behind the downstroke (R, then L the next bar). A note
      // leaves on every downstroke. A blink on the last bar (half, blink, half), shut on the hit.
      return loop(
        frames(
          n,
          {
            pose: bars<PoseName>(['stand', 1], ['playB', 1], ['stand', 1], ['playA', 1]),
            squash: onBeat(1, 0, 1),
            sway: onBeat<Lean>(2, '-', 'R', 'L'),
            face: spans<FaceName>(n, 'focus', [
              [12, 12, 'half'],
              [13, 13, 'blink'],
              [14, 14, 'half'],
            ]),
          },
          notes(art, 1),
        ),
      )
    case 'nijika': {
      // The sticks alternate (playA: the left stick strikes, the right up; playB: the reverse), stand between, an
      // impact star at the striking tip that fades to a twinkle on the next frame; her body follows through a
      // frame after the first hit (squash 1 on 2), the ponytail whipping a frame after that. She smiles through
      // (focus all along). In the mini (where the sticks are out of sight) the hits flash in its two free corners
      // (the top left, the top right beyond the tail's tie): the bar's first hit the bigger glint, the second a
      // spark, nothing between, the corners trading sticks bar by bar.
      const hit = (at: number, pose: 'playA' | 'playB'): Flight[] => {
        const t = art.tips?.[pose]
        return t ? [{ at, path: [fxAt('star', t.x - 4, t.y - 4, GOLD, { on: 'body' }), fxAt('twinkle', t.x - 2, t.y - 2, GOLD, { on: 'body' })] }] : []
      }
      const flash = (at: number, kind: FxKind, mx: number): Flight => ({ at, path: [fxAt(kind, 2 * mx, 0, GOLD, { views: MINI })] })
      return loop(
        frames(
          n,
          {
            pose: bars<PoseName>(['stand', 1], ['playA', 1], ['stand', 1], ['playB', 1]),
            squash: onBeat(2, 0, 1),
            sway: onBeat<Lean>(3, '-', 'L', 'R'),
            face: 'focus',
          },
          [
            ...[0, 4, 8, 12].flatMap(b => [...hit(b + 1, 'playA'), ...hit(b + 3, 'playB')]),
            ...[0, 8].flatMap(b => [flash(b + 1, 'twinkle', 0), flash(b + 3, 'dust', 13), flash(b + 5, 'twinkle', 13), flash(b + 7, 'dust', 0)]),
            ...notes(art, 3),
          ],
        ),
      )
    }
    case 'ryo':
      // Fingerstyle and unhurried, in half time: she rests on the strings two frames, plucks (playB) two, rests,
      // a lighter pluck (playA); she nods late, on the rest after the first pluck (4, 12), and her bob tips sway a
      // frame after the nod. A note leaves on every pluck. She never blinks mid-song.
      return loop(
        frames(
          n,
          {
            pose: track<PoseName>(...Array.from({ length: 2 }, () => [['stand', 2], ['playB', 2], ['stand', 2], ['playA', 2]] as const).flat()),
            squash: spans(n, 0, [
              [4, 4, 1],
              [12, 12, 1],
            ]),
            sway: spans<Lean>(n, '-', [
              [5, 5, 'R'],
              [13, 13, 'L'],
            ]),
            face: 'focus',
          },
          notes(art, 2),
        ),
      )
    case 'kita': {
      // Rhythm against Bocchi's lead, syncopated: the downstroke (playB, squash 1) on the bar's last beat, ringing
      // into the next downbeat (her side tail swaying out on it), a rest where Bocchi strikes down, the upstroke
      // (playA). A note leaves a frame after each downstroke. A twinkle pulses at her eye on the downbeats of bars 2
      // and 4 (beside the far eye's outer corner, below the side tail; the mini's a glint in the free space under the
      // tail), and she blinks on the last bar (half, blink, half) a frame behind Bocchi, the twinkle flashing as her
      // eyes close: a wink to the crowd.
      const eye = (at: number): Flight[] => bigAndMini(at, pulse(26, 15, GOLD), glint(13, 5, GOLD))
      return loop(
        frames(
          n,
          {
            pose: bars<PoseName>(['playB', 1], ['stand', 1], ['playA', 1], ['playB', 1]),
            squash: onBeat(3, 0, 1),
            sway: onBeat<Lean>(0, '-', 'R', 'L'),
            face: spans<FaceName>(n, 'focus', [
              [13, 13, 'half'],
              [14, 14, 'blink'],
              [15, 15, 'half'],
            ]),
          },
          [...eye(4), ...eye(12), ...notes(art, 0)],
        ),
      )
    }
  }
}

// ---- happy: a jump, 2 s (20 frames) --------------------------------------------------------------------------
//
// The brief's beats for everyone: crouch 2 (anticipation), cheer -6, -10, -11 for 2 (the hang; sparkles burst
// out at both sides), -6, crouch 2 (the landing; dust at the feet), stand squash 1, stand happy with a sparkle
// (Kita: a heart), idle 2. Each member's loop is turned so the four go up one after another (launching on
// frames 2 Nijika, 7 Kita, 12 Ryo, 17 Bocchi), never two in the air together for long. The portrait rides the
// crouch and the landing's squash (the head stays put in it), so there the face takes the impact: the eyes
// squeeze shut for the frame she lands.

function happy(art: MemberArt): Tag {
  const n = 20
  const spark = sparkColor(art)
  // The brief's heights (-6, -10, -11) where the cheer pose has the headroom for them, scaled down to it where
  // not (the effects, the ahoge and the Dorito kept on the canvas): Nijika's go -5, -8, -9.
  const room = Math.max(0, topRow(art, 'cheer') - 4)
  const up = (k: number) => -Math.round(k * Math.min(1, room / 11))
  const dust = (spread: number): Fx[] => [fxAt('dust', -12 - spread, -5 - spread, DUST, { on: 'ground' }), fxAt('dust', 33 + spread, -5 - spread, DUST, { on: 'ground' })]
  const puffs = (at: number): Flight[] => [
    { at, path: [dust(0)[0] ?? null, dust(2)[0] ?? null] },
    { at, path: [dust(0)[1] ?? null, dust(2)[1] ?? null] },
  ]
  switch (art.id) {
    case 'bocchi': {
      // She hesitates (crouches with a sidelong look, should I?, half rises, then commits: the grin on the second
      // crouch), launches, hangs at the top with sparkles bursting out at both sides (in the portrait the left one
      // low, below her cubes, the right one under her raised forearm beside her cheek, the fist left clear; in the
      // mini a glint in the free corner at the right), drops into a landing crouch (squash 2, dust at the feet, eyes
      // squeezed), settles with the hair following, basks with a sparkle twinkling up beside her, and calms.
      const seq = frames(
        n,
        {
          pose: track<PoseName>(['crouch', 1], ['stand', 1], ['crouch', 2], ['cheer', 5], ['crouch', 2], ['stand', 9]),
          face: spans<FaceName>(n, 'happy', [
            [0, 0, 'glance'],
            [1, 1, 'idle'],
            [9, 9, 'blink'],
            [18, 19, 'idle'],
          ]),
          dy: track([0, 4], [up(6), 1], [up(10), 1], [up(11), 2], [up(6), 1], [0, 11]),
          squash: track([0, 9], [2, 1], [0, 1], [1, 1], [0, 8]),
          sway: track<Lean>(['-', 11], ['R', 1], ['L', 1], ['-', 7]),
        },
        [
          ...thrice(5, burst(-6, 21, spark, 1), burst(4, 22, spark, 1), []),
          ...thrice(5, burst(33, 11, spark, 1), burst(27, 16, spark, 1), glint(13, 0, spark)),
          ...puffs(9),
          ...thrice(
            13,
            [fxAt('twinkle', 28, 8, spark), fxAt('sparkle', 27, 3, spark), fxAt('twinkle', 29, 2, spark)],
            [fxAt('twinkle', 25, 8, spark), fxAt('sparkle', 23, 3, spark), fxAt('twinkle', 26, 1, spark)],
            glint(13, 1, spark),
          ),
        ],
      )
      return loop(seq, 14)
    }
    case 'nijika': {
      // On the beat: a crouch, up to the top of her headroom (the Dorito stays on the canvas), a hang, down into a
      // squash (eyes squeezed shut on the impact), then a little bounce on the beat (squeezed again) with the
      // ponytail whipping after each landing, two twinkles, calm. The sparkles on her right are for the full figure
      // only (in the portrait and the mini they would land on her tail); the portrait's sit on her left hair, each in
      // its own place (beside the Dorito at the hang, low on her hair after the landing, then one rising from low to
      // high), the mini's in its two free top corners in turn.
      const seq = frames(
        n,
        {
          pose: track<PoseName>(['crouch', 2], ['cheer', 5], ['crouch', 2], ['stand', 11]),
          face: spans<FaceName>(n, 'happy', [
            [7, 7, 'blink'],
            [12, 12, 'blink'],
            [18, 19, 'idle'],
          ]),
          dy: track([0, 2], [up(6), 1], [up(10), 1], [up(11), 2], [up(6), 1], [0, 13]),
          squash: track([0, 7], [2, 1], [0, 1], [1, 1], [0, 2], [1, 1], [0, 7]),
          sway: track<Lean>(['-', 10], ['R', 1], ['L', 1], ['-', 1], ['R', 1], ['-', 6]),
        },
        [
          ...thrice(3, burst(-7, 14, spark, 1), burst(4, 5, spark, 1), glint(0, 0, spark)),
          { at: 3, path: only(FULL, burst(38, 12, spark, 1)) },
          ...puffs(7),
          ...thrice(10, pulse(-3, 15, spark), pulse(4, 15, spark), spot(13, 0, spark)),
          ...thrice(15, pulse(-4, 9, spark), rising(4, 15, spark), glint(0, 0, spark)),
        ],
      )
      return loop(seq, 0)
    }
    case 'ryo': {
      // Late and low: a slow three-frame crouch, a lazy hop half the others' height with a short hang (the
      // portrait's burst under her raised forearm, the fist left clear), a soft landing (the dust puffing out and
      // spreading, eyes squeezed), one twinkle while she basks (coolly).
      const seq = frames(
        n,
        {
          pose: track<PoseName>(['crouch', 3], ['cheer', 5], ['crouch', 2], ['stand', 10]),
          face: spans<FaceName>(n, 'happy', [
            [8, 8, 'blink'],
            [18, 19, 'idle'],
          ]),
          dy: track([0, 3], [up(3), 1], [up(5), 1], [up(6), 2], [up(3), 1], [0, 12]),
          squash: track([0, 8], [1, 1], [0, 1], [1, 1], [0, 9]),
          sway: track<Lean>(['-', 11], ['R', 2], ['-', 7]),
        },
        [
          ...thrice(4, burst(-6, 6, spark, 1), burst(27, 16, spark, 1), []),
          ...thrice(4, burst(34, 12, spark, 1), [], glint(12, 0, spark)),
          { at: 8, path: [dust(-2)[0] ?? null, dust(0)[0] ?? null] },
          { at: 8, path: [dust(-2)[1] ?? null, dust(0)[1] ?? null] },
          ...thrice(13, pulse(28, 8, spark), pulse(27, 6, spark), glint(12, 0, spark)),
        ],
      )
      return loop(seq, 9)
    }
    case 'kita': {
      // A performer's jump: up high, a three-frame hang to pose in the air with the sparkles bursting, a landing
      // crouch (eyes squeezed), the hair following, and a heart rising beside her as she beams (over her hair in
      // the portrait and the mini, in a light pink that reads on the crimson).
      const heart = [fxAt('twinkle', -2, 12, RIBBON), fxAt('heart', -6, 7, RIBBON), fxAt('heart', -7, 5, RIBBON), fxAt('heart', -7, 3, RIBBON), fxAt('heart', -8, 1, RIBBON), fxAt('twinkle', -6, 0, RIBBON)]
      const heartNear = [fxAt('twinkle', 2, 8, BLUSH), fxAt('heart', 0, 6, BLUSH), fxAt('heart', 0, 4, BLUSH), fxAt('heart', 0, 2, BLUSH), fxAt('heart', 0, 0, BLUSH), fxAt('twinkle', 2, 0, BLUSH)]
      const heartMini = [fxAt('twinkle', 0, 2, BLUSH), fxAt('heart', 0, 2, BLUSH), fxAt('heart', 0, 2, BLUSH), fxAt('heart', 0, 0, BLUSH), fxAt('heart', 0, 0, BLUSH), fxAt('twinkle', 0, 0, BLUSH)]
      const seq = frames(
        n,
        {
          pose: track<PoseName>(['crouch', 2], ['cheer', 6], ['crouch', 2], ['stand', 10]),
          face: spans<FaceName>(n, 'happy', [
            [8, 8, 'blink'],
            [18, 19, 'idle'],
          ]),
          dy: track([0, 2], [up(6), 1], [up(10), 1], [up(11), 3], [up(6), 1], [0, 12]),
          squash: track([0, 8], [2, 1], [0, 1], [1, 1], [0, 9]),
          sway: track<Lean>(['-', 10], ['R', 1], ['L', 1], ['-', 8]),
        },
        [
          ...thrice(3, burst(-7, 8, spark, 2), burst(4, 5, spark, 2), glint(0, 0, spark, 2)),
          ...thrice(3, burst(39, 21, spark, 2), burst(27, 21, spark, 2), glint(13, 6, spark, 2)),
          ...puffs(8),
          ...thrice(12, heart, heartNear, heartMini),
        ],
      )
      return loop(seq, 5)
    }
  }
}

// ---- panic: about 1 s (10 frames) ------------------------------------------------------------------------------
//
// Each member's loop is turned so the four freeze one after another (Bocchi on frame 0, Nijika 3, Kita 5, Ryo
// 7): the bangs pop in turn, never together, and no two hop on the same frame. Bocchi and Kita shake one way,
// Nijika and Ryo the other (antiphase), so the band rattles against itself rather than in unison. The bang
// keeps beside her head in the full figure; in the portrait and the mini (where the window's edge would cut
// it) it stands whole just inside the window, on her open side (gold on Kita there: red on her crimson hair
// would read as a strand). The sweat drops fly off in arcs in the full figure; in the portrait they arc out of
// a closer place, kept three rows clear of the bang's dot, and end on the frame they reach the window's edge
// (then gone: they leave rather than stick to it); in the mini a drip falls off the cheek below the bang.

function panic(art: MemberArt): Tag {
  const n = 10
  const hop = -Math.min(2, Math.max(0, topRow(art, 'panic') - 2))
  // The bang pops in small (a twinkle in its red), then big; drops fly off both sides in arcs, sweat leaving her
  // head and shrinking to a drip as it flies off.
  const bang = (x: number, big: boolean, color: string, more: Partial<Fx>): Fx => (big ? fxAt('bang', x, -1, color, more) : fxAt('twinkle', x - 1, 3, color, more))
  const bangs = (x: number, more: Partial<Fx> = {}, color = BANG) => [bang(x, false, color, more), ...rep(8, bang(x, true, color, more)), bang(x, false, color, more)]
  const arc = (spots: readonly (readonly [number, number])[], more: Partial<Fx> = {}) => path('sweat', spots, SWEAT, 'drop', more)
  // The portrait's arcs: out from beside the face, up and over, the drip touching the window's edge on the
  // last frame. Left: below row 15 (Bocchi's cubes), off the near eye. Right: below the bang (its dot ends on
  // row 10). Nijika's left falls rather than rises: above it is her bang.
  const nearL = (y: number) => arc([[4, y], [2, y - 2], [0, y - 1]], { views: PORTRAIT })
  const nearR = (y: number) => arc([[23, y], [25, y - 2], [28, y - 1]], { views: PORTRAIT })
  const fallL = arc([[2, 15], [1, 17], [0, 20]], { views: PORTRAIT })
  // The mini's: a drip off the cheek below the bang, falling away down the open side, clear of the eyes.
  const flick = (side: 1 | -1) =>
    path(
      'drop',
      (side === 1
        ? [
            [28, 14],
            [30, 16],
            [31, 19],
            [31, 23],
          ]
        : [
            [4, 14],
            [2, 16],
            [0, 19],
            [0, 23],
          ]) as readonly (readonly [number, number])[],
      SWEAT,
      undefined,
      { views: MINI },
    )
  // A flight held steady against the shake: each spot keyed back by its frame's dx (the head's effects ride the
  // move; a drop flung off her flies its own line while she rattles). The mini moves a pixel for any dx.
  const steady = (dx: readonly number[], at: number, p: readonly (Fx | null)[]): Flight => ({
    at,
    path: p.map((e, i) => {
      if (!e) return null
      const d = dx[(at + i) % n] ?? 0
      return { ...e, x: e.x - (e.views?.length === 1 && e.views[0] === 'mini' ? 2 * Math.sign(d) : d) }
    }),
  })
  switch (art.id) {
    case 'bocchi': {
      // She freezes (three frames: the bang small, big, held), then falls apart: dx -2 +2 -1 +1 -2 +2, a hop in the
      // middle, two waves of sweat; a settle frame. The left drops fly low, below her cubes.
      const dx = track([0, 3], [-2, 1], [2, 1], [-1, 1], [1, 1], [-2, 1], [2, 1], [0, 1])
      const L = arc([[-2, 18], [-6, 16], [-9, 17], [-11, 20]], { views: FULL })
      const R = arc([[27, 12], [31, 8], [34, 7], [36, 10]], { views: FULL })
      return loop(
        frames(n, { pose: 'panic', face: 'panic', dx, dy: track([0, 4], [hop, 2], [0, 4]) }, [
          ...twice(0, bangs(28), bangs(26)),
          ...[3, 6].flatMap(at => [L, R, nearL(22), nearR(16), flick(1)].map(p => steady(dx, at, p))),
        ]),
      )
    }
    case 'nijika': {
      // Bouncy even in a panic: a two-frame freeze, then she shakes the other way to Bocchi, hopping on her two
      // swings right; the drops on her right are for the full figure only (in the portrait and the mini they
      // would land on her tail).
      const dx = track([0, 2], [2, 1], [-2, 1], [1, 1], [-1, 1], [2, 1], [-2, 1], [0, 2])
      const L = arc([[-3, 14], [-7, 11], [-10, 10], [-12, 13]], { views: FULL })
      const R = arc([[34, 12], [38, 8], [41, 7], [43, 10]], { views: FULL })
      return loop(
        frames(n, { pose: 'panic', face: 'panic', dx, dy: spans(n, 0, [[4, 4, hop], [6, 6, hop]]) }, [
          ...twice(0, bangs(-2), bangs(2)),
          ...[2, 5].flatMap(at => [L, R, fallL, flick(-1)].map(p => steady(dx, at, p))),
        ]),
        3,
      )
    }
    case 'ryo': {
      // Barely moves, even now, and late: the longest freeze (five frames), then a tremble of one pixel (against
      // Kita's shake), one drop a side (the left one high, above her pins). The near views' bang stands in the
      // window's top-right corner, off her hair, a column in from the edge (it trembles with her).
      const dx = track([0, 5], [-1, 1], [1, 1], [-1, 1], [1, 1], [0, 1])
      const L = arc([[-2, 5], [-6, 2], [-9, 0], [-11, 2]], { views: FULL })
      const R = arc([[27, 12], [31, 8], [34, 7], [36, 10]], { views: FULL })
      return loop(
        frames(n, { pose: 'panic', face: 'panic', dx }, [
          { at: 0, path: only(FULL, bangs(28)) },
          { at: 0, path: only(PORTRAIT, bangs(27)) },
          { at: 0, path: only(MINI, bangs(28)) },
          ...[L, R, nearR(16), flick(1)].map(p => steady(dx, 5, p)),
        ]),
        7,
      )
    }
    case 'kita': {
      // A stunned stare (three frames), then the shake (mirrored: turned by an odd number of frames, it moves with
      // Bocchi's) and a hop in the middle; the drops on her right kept below her side tail, the bang on her left
      // (gold in the near views, where it stands on her hair).
      const dx = track([0, 3], [2, 1], [-2, 1], [1, 1], [-1, 1], [2, 1], [-2, 1], [0, 1])
      const L = arc([[-3, 16], [-7, 13], [-10, 12], [-12, 15]], { views: FULL })
      const R = arc([[27, 14], [31, 11], [34, 11], [36, 14]], { views: FULL })
      return loop(
        frames(n, { pose: 'panic', face: 'panic', dx, dy: track([0, 5], [hop, 2], [0, 3]) }, [
          ...twice(0, bangs(-3), bangs(3, {}, GOLD)),
          ...[L, R, nearL(22), flick(-1)].map(p => steady(dx, 3, p)),
          ...[L, R, nearR(16), flick(-1)].map(p => steady(dx, 6, p)),
        ]),
        5,
      )
    }
  }
}

// ---- melting: 2.8 s (28 frames) ------------------------------------------------------------------------------
//
// The brief's beats (Bocchi's): the melt face 3 frames, sinking into a puddle over about 9 frames (easing in:
// barely at first, a long slow start, then faster and faster), drops falling beside her, a long hold in the
// puddle that still lives, oozing back up over 3 frames, a half, a blink, open. At the puddle the face is too
// flat for a blink to read, so the puddle lives by what falls into it and by its own quiver (a row or two, a
// frame: 0.97, with 0.99 on the way back). The melt itself (compose.ts `melt`, given her colors by scene.ts)
// keeps her face above a soft puddle of her hair and clothing, drips only her hair, skin and clothing, and lets
// her instrument slip from her hands and sink into the puddle whole. Each member melts her own way:
//   bocchi  the fastest: she crumbles (pink crumbs falling off her) and runs; a drip falls into the puddle with a
//           splash that sets it quivering; she pulls herself back up and blinks.
//   nijika  sags first, slumps down evenly, quivers in the puddle on the beat (every third frame), and snaps
//           back up in two frames into a bounce and a short giggle.
//   ryo     lazy: she never quite goes, sinking slowly to half, lying there half melted (a drip running off
//           her), with one slow blink at the end of it (her face still reads), and oozing back up slowly.
//   kita    a swoon: her aura goes out first, she wilts and hangs there (a long hold at the start of the sink)
//           with a last drip, then drops all at once; she quivers in the puddle on her beat (twice), oozes up,
//           blinks, and the sparkle comes back.
// On the shared clock they give way in turn: Bocchi at 3, Ryo 11, Kita 19, Nijika 23; their puddles come in
// turn (Nijika 3-11, Bocchi 12-19, Ryo's half-melt 21-0, Kita 27-4), they come back on their own frames
// (Ryo 6, Kita 8, Nijika 13, Bocchi 23), and no two have their eyes shut at once (Kita 8-10, Nijika 13-16 with
// her giggle, Bocchi 23-25, Ryo 26-1). Frame 0 (the still the desktop shows on mount, and a degraded drawing's
// one frame) has nobody coming back: Bocchi whole in the melt face, Nijika sinking, Ryo lying half melted, Kita
// in her puddle.

/** Bocchi's sink: barely (two rows), then faster and faster to the puddle (9 frames). */
const SINK: readonly Run<number>[] = [
  [0.04, 2],
  [0.1, 2],
  [0.2, 1],
  [0.33, 1],
  [0.5, 1],
  [0.72, 1],
  [1, 1],
]
/** Oozing back up over 3 frames. */
const OOZE: readonly Run<number>[] = [
  [0.7, 1],
  [0.4, 1],
  [0.15, 1],
]
/** The puddle's quiver: up two rows for a frame (any more and it reads as a hiccup, the puddle re-forming). */
const QUIVER = 0.97

function melting(art: MemberArt): Tag {
  const n = 28
  // A drop falling `k` frames, 3 rows a frame, from (x, y).
  const drop = (x: number, y: number, k: number, color = art.accent): (Fx | null)[] => Array.from({ length: k }, (_, i) => fxAt('drop', x, y + 3 * i, color))
  switch (art.id) {
    case 'bocchi': {
      // Crumbs (her pink) fall off her right side as she gives way, drops run off her into the puddle; in the
      // puddle a drip falls from above into it with a little splash, and the splash sets the puddle quivering (up
      // two rows, back by one, flat); she oozes back up, a half, a blink, open.
      const crumb = (x: number, y: number): (Fx | null)[] => [fxAt('twinkle', x, y, art.accent), fxAt('drop', x + 1, y + 4, art.accent), fxAt('drop', x + 1, y + 8, art.accent)]
      return loop(
        frames(
          n,
          {
            pose: 'stand',
            face: spans<FaceName>(n, 'melt', [
              [23, 23, 'half'],
              [24, 24, 'blink'],
              [25, 25, 'half'],
              [26, 27, 'idle'],
            ]),
            melt: track([0, 3], ...SINK, [1, 5], [QUIVER, 1], [0.99, 1], [1, 1], ...OOZE, [0, 5]),
          },
          [
            { at: 7, path: crumb(25, 8) },
            { at: 9, path: crumb(27, 12) },
            { at: 9, path: drop(22, 18, 3) },
            { at: 13, path: [fxAt('drop', 27, 4, art.accent), fxAt('drop', 27, 9, art.accent), fxAt('drop', 27, 14, art.accent), fxAt('twinkle', 25, 17, art.accent)] },
          ],
        ),
      )
    }
    case 'nijika':
      // She sags first (a squash as the melt face comes), then slumps down evenly; in the puddle she quivers on the
      // beat, twice; she snaps back in two frames into a bounce (squash 2, eyes squeezed), bounces again with a
      // short giggle, and opens her eyes.
      return loop(
        frames(
          n,
          {
            pose: 'stand',
            face: spans<FaceName>(n, 'melt', [
              [21, 21, 'blink'],
              [22, 24, 'happy'],
              [25, 27, 'idle'],
            ]),
            squash: spans(n, 0, [
              [1, 2, 1],
              [21, 21, 2],
              [23, 23, 1],
            ]),
            melt: track([0, 3], [0.04, 1], [0.1, 2], [0.2, 2], [0.38, 1], [0.6, 1], [0.85, 1], [1, 2], [QUIVER, 1], [1, 2], [QUIVER, 1], [1, 3], [0.5, 1], [0, 7]),
          },
          [
            ...twice(7, drop(-4, 16, 3), drop(1, 16, 3)),
            ...twice(9, drop(-7, 12, 3), drop(0, 10, 3)),
          ],
        ),
        20,
      )
    case 'ryo':
      // Unbothered: she stands in the melt face longest, sinks slowly and only halfway, lies there half melted (a
      // drip running off her), and at the end of it one slow blink (half, two frames shut, half); she oozes back
      // up slowly to her heavy lids.
      return loop(
        frames(
          n,
          {
            pose: 'stand',
            face: spans<FaceName>(n, 'melt', [
              [19, 19, 'half'],
              [20, 21, 'blink'],
              [22, 27, 'half'],
            ]),
            melt: track([0, 4], [0.04, 2], [0.1, 2], [0.18, 2], [0.28, 2], [0.38, 1], [0.46, 1], [0.5, 8], [0.4, 1], [0.3, 1], [0.2, 1], [0.1, 1], [0.04, 1], [0, 1]),
          },
          [{ at: 15, path: drop(27, 16, 3) }],
        ),
        7,
      )
    case 'kita': {
      // Dramatic: the aura's sparkle goes out as she wilts (big, small, gone), she swoons and hangs there a long
      // moment (a last drip running off her), then drops all at once into the puddle; she lies there quivering on
      // her beat (twice), oozes up, blinks, and the sparkle comes back (its first glint as she opens her eyes).
      const spark = sparkColor(art)
      return loop(
        frames(
          n,
          {
            pose: 'stand',
            face: spans<FaceName>(n, 'melt', [
              [0, 1, 'idle'],
              [22, 22, 'half'],
              [23, 23, 'blink'],
              [24, 24, 'half'],
              [25, 27, 'idle'],
            ]),
            melt: track([0, 5], [0.04, 1], [0.1, 1], [0.16, 4], [0.45, 1], [0.78, 1], [1, 2], [QUIVER, 1], [1, 2], [QUIVER, 1], ...OOZE, [0, 6]),
          },
          [
            ...bigAndMini(25, [fxAt('twinkle', 2, 10, spark), ...rep(3, fxAt('sparkle', 0, 8, spark)), fxAt('twinkle', 2, 10, spark)], glint(0, 0, spark, 3)),
            ...twice(9, drop(-4, 16, 3), drop(1, 16, 3)),
          ],
        ),
        14,
      )
    }
  }
}

// ---- hiding: in the box, 3 s (30 frames) -----------------------------------------------------------------------
//
// The brief's beats: peekL held, a blink, peekL, a duck (the whole box down a pixel for a frame), peekR held, a
// blink; Ryo dozes. On the shared clock the eyes switch sides in turn and no two blink or duck on the same frame.
// (The box has one closed peek and no half one, so its blinks are a single frame.)

function hiding(art: MemberArt): Tag {
  const n = 30
  const spark = sparkColor(art)
  switch (art.id) {
    case 'bocchi': {
      // Peeks left (held) while the gloom lines flicker in beside her, sink a row, and flicker as she blinks;
      // peeks on, ducks from it all (eyes shut, the whole box down a pixel: the gloom gone), peeks right with a
      // sweat drop sliding down beside her, blinks it off, and her eyes dart left a moment (a twitch) before the
      // loop takes them back there. The portrait's gloom hangs over the top of her hair at the right; the mini's
      // sweat is a drip on the box's flap, clear of her far eye.
      const gloom = (x: number, y: number): (Fx | null)[] => {
        const g = (dy: number) => fxAt('gloom', x, y + dy, GLOOM)
        return [g(0), null, ...rep(4, g(0)), ...rep(4, g(1)), null, g(1)]
      }
      return loop(
        frames(
          n,
          {
            pose: 'box',
            peek: spans<PeekName>(n, 'peekR', [
              [0, 7, 'peekL'],
              [8, 8, 'peekBlink'],
              [9, 13, 'peekL'],
              [14, 14, 'peekBlink'],
              [22, 22, 'peekBlink'],
              [26, 26, 'peekL'],
            ]),
            dy: spans(n, 0, [[14, 14, 1]]),
          },
          [
            ...thrice(2, gloom(27, 0), gloom(19, 0), gloom(27, 0)),
            ...bigAndMini(16, [fxAt('drop', 26, 5, SWEAT), ...[6, 7, 8, 9, 10].map(y => fxAt('sweat', 25, y, SWEAT))], [5, 6, 7, 8, 9, 10].map(y => fxAt('drop', 28, y, SWEAT))),
          ],
        ),
      )
    }
    case 'nijika':
      // Peekaboo on the beat: peeking left, a blink, a duck (eyes shut on the dip) and up again peeking right; a
      // twinkle; a glance back left and right again; a blink, a duck, back left; a twinkle on her open side. The
      // two twinkles in two places: high then low on her left hair in the portrait, the mini's top-left corner
      // then its top-right.
      return loop(
        frames(
          n,
          {
            pose: 'box',
            peek: spans<PeekName>(n, 'peekL', [
              [3, 3, 'peekBlink'],
              [6, 10, 'peekR'],
              [11, 11, 'peekBlink'],
              [12, 15, 'peekR'],
              [16, 17, 'peekL'],
              [18, 25, 'peekR'],
              [26, 26, 'peekBlink'],
            ]),
            dy: spans(n, 0, [
              [11, 11, 1],
              [26, 26, 1],
            ]),
          },
          [...thrice(7, pulse(-3, 12, spark), pulse(4, 4, spark), glint(0, 0, spark)), ...thrice(23, pulse(-4, 8, spark), pulse(4, 15, spark), spot(13, 0, spark))],
        ),
      )
    case 'ryo': {
      // Dozing: eyes shut, z's rising slowly one after another (a step every other frame), drifting right and out
      // through the top of the window; she stirs, opens an eye, and nods off again.
      const zs = (x: number) => Array.from({ length: 8 }, (_, age) => fxAt('zz', x + Math.floor(age / 4), 12 - 3 * Math.floor(age / 2), art.accent))
      const z = (at: number): Flight[] => thrice(at, zs(26), zs(23), zs(26))
      return loop(frames(n, { pose: 'box', peek: spans<PeekName>(n, 'peekBlink', [[18, 20, 'peekL']]) }, [...z(0), ...z(6), ...z(23)]))
    }
    case 'kita':
      // Hide and seek with the crowd: peeking right, a blink, on; then left, a blink, a duck (eyes shut on the dip),
      // and up again looking right; the aura twinkling on her open side, high then low (the mini's in its top-left
      // corner, then rising in the gap left of her side tail).
      return loop(
        frames(
          n,
          {
            pose: 'box',
            peek: spans<PeekName>(n, 'peekR', [
              [5, 5, 'peekBlink'],
              [10, 16, 'peekL'],
              [17, 17, 'peekBlink'],
              [18, 23, 'peekL'],
              [24, 24, 'peekBlink'],
            ]),
            dy: spans(n, 0, [[24, 24, 1]]),
          },
          [...thrice(12, pulse(-3, 8, spark), pulse(4, 4, spark), glint(0, 0, spark)), ...thrice(27, pulse(-4, 17, spark), pulse(4, 16, spark), glint(11, 0, spark))],
        ),
      )
  }
}

/** The frames of a tag, in play order (a ping-pong plays its keys back without repeating the end keys, each for its own hold). */
export function expand(tag: Tag): Key[] {
  const keys = tag.direction === 'pingpong' ? [...tag.keys, ...tag.keys.slice(1, -1).reverse()] : tag.keys
  const out: Key[] = []
  for (const k of keys) for (let i = 0; i < k.hold; i += 1) out.push(k)
  return out
}

export function framesOf(art: MemberArt, mood: Mood): number {
  return expand(tagFor(art, mood)).length
}

/** The scene at frame `f` of a member's mood, looping. */
export function sceneAt(art: MemberArt, mood: Mood, f: number): Scene {
  const all = expand(tagFor(art, mood))
  const k = all[((f % all.length) + all.length) % all.length] as Key
  return { pose: k.pose, face: k.face, peek: k.peek, dx: k.dx ?? 0, dy: k.dy ?? 0, squash: k.squash ?? 0, sway: k.sway, melt: k.melt ?? 0, fx: k.fx ?? [] }
}

/** Every color the timelines give their effects (the export's palette needs them, with their highlights). */
export function fxColors(art: MemberArt): string[] {
  const set = new Set<string>()
  for (const mood of MOODS) for (const k of tagFor(art, mood).keys) for (const f of k.fx ?? []) set.add((f.color ?? art.accent).toLowerCase())
  return [...set]
}
