// The feast's timelines: the band at the Hotpot's table, each member's loop in
// each feast state, and the feast drawn to pixels.
//
// Written like the moods (./moods.ts) and the slimes (./slimes.ts): a loop a
// state, laid out in tracks (her seat pose, her face, the food on her
// chopsticks, the effects' flights), folded into keys with holds, ten frames a
// second on the mod's sprite clock. The loops move arms and faces only (no
// move, no squash), so each figure's frames share most of their pixels and
// stay cheap to draw. A state's loop is one length for every member who loops
// it, on one clock, and the beats are placed member by member on that clock
// (no two members blink, bite or look round on the same frame); `cold` keeps
// its own (Ryo chewing her weed; Nijika's and Kita's slumps are stills) and
// `serve` its own (Nijika's, one ping's moment long).
//
//   wait   nothing cached yet (the lid on the pot): resting on her seat, idle, blinking, a look at the pot
//   eat    a feast (levels 5 and 4, and the zosui): into the pot (seatPot, eyes on it), the food on her
//          tips, to her torizara (seatBowl), up to her mouth (seatUp, the bite), chewing (happy); Bocchi
//          shy and slow, Ryo two bites to everyone's one, Nijika serving with her ladle between bites
//          (seatLadle), Kita photographing the pot between them (seatPhone, the flash on her lens)
//   calm   simmering, running low, or Nijika tending the pot: the same, slower, the eyes half shut on the pot
//   worry  last orders: still, eyes at us, sweating (a look aside at most a beat); Ryo's chopsticks on the
//          last piece (seatPoint), Nijika's ladle in the pot
//   cold   once cold: Nijika and Kita slumped on the table, melting (stills); Ryo chewing her weed
//          (`half` over seat); Bocchi has none (the mod seats her box, bocchi-hiding, in her place)
//   shock  a send held by Cache Tax: the panic face, the bang, sweat flying; Bocchi's hands up (seatPanic)
//   serve  Nijika ladling broth in at a ping: the ladle in the pot, steam rising from it
//
// The poses, the faces and the props' points (the chopsticks' tips, the
// ladle's cup, the phone's lens: MemberArt.tips; Ryo's weed: feast.weed) are
// the art's, read by name: a re-drawn pose drops in unchanged.

import { blank, crop, highlight, stamp } from '../art/compose'
import type { Pixels } from '../art/compose'
import { FLASH_COLOR, MORSEL_COLORS, WEED_COLOR, fxSize } from '../art/fx'
import type { FxKind } from '../art/fx'
import type { FaceName, FeastFace, FeastState, MemberArt, MemberId, SeatPose } from '../art/types'
import { FEAST_H, FEAST_Y, W } from '../art/types'
import { MEMBER_IDS, spans } from './moods'
import type { Fx } from './moods'
import { drawScene } from './scene'

export const FEAST_STATES: readonly FeastState[] = ['wait', 'eat', 'calm', 'worry', 'cold', 'shock', 'serve']

/** The feast states each member loops (Bocchi's cold is her box, the mod's own; serve is Nijika's). */
export const FEAST_STATES_OF: Readonly<Record<MemberId, readonly FeastState[]>> = {
  bocchi: ['wait', 'eat', 'calm', 'worry', 'shock'],
  nijika: ['wait', 'eat', 'calm', 'worry', 'cold', 'shock', 'serve'],
  ryo: ['wait', 'eat', 'calm', 'worry', 'cold', 'shock'],
  kita: ['wait', 'eat', 'calm', 'worry', 'cold', 'shock'],
}

/** A state's loop, in frames: one for every member who loops it. `cold` and `serve` are each member's own (FEAST_OWN). */
export const FEAST_LENGTH: Readonly<Record<Exclude<FeastState, 'cold' | 'serve'>, number>> = { wait: 40, eat: 48, calm: 64, worry: 40, shock: 20 }

/** The loops of their own: Ryo's weed chewed on 2.4 s, the slumps stills, Nijika's serve a ping's moment (2.4 s). */
const FEAST_OWN: Readonly<Partial<Record<MemberId, Partial<Record<'cold' | 'serve', number>>>>> = {
  nijika: { cold: 1, serve: 24 },
  ryo: { cold: 24 },
  kita: { cold: 1 },
}

/** A member's loop length in a state (throws for a state she does not loop). */
export function feastLength(id: MemberId, state: FeastState): number {
  if (!FEAST_STATES_OF[id].includes(state)) throw new Error(`feast: ${id} has no ${state} loop`)
  if (state === 'cold' || state === 'serve') {
    const n = FEAST_OWN[id]?.[state]
    if (n === undefined) throw new Error(`feast: ${id}'s ${state} loop has no length`)
    return n
  }
  return FEAST_LENGTH[state]
}

export type FeastFaceName = FaceName | FeastFace

export type FeastKey = {
  /** Frames (100 ms each). */
  hold: number
  pose: SeatPose
  face: FeastFaceName
  fx?: readonly Fx[]
}

export type FeastTag = { keys: readonly FeastKey[] }

/** One frame as drawn: a seat pose, a face, effects; never moved, squashed or melted (scene.ts draws it). */
export type FeastScene = { pose: SeatPose; face: FeastFaceName; dx: 0; dy: 0; squash: 0; melt: 0; fx: readonly Fx[] }

// ---- The effects ----------------------------------------------------------------------------------------------

/** The moods' own effect colors, the same here: nervous sweat, the panic bang, Bocchi's and Kita's gold sparkles, Nijika's ribbon red, steam (the dust's). */
const SWEAT = '#9ad8ff'
const BANG = '#ff5d73'
const GOLD = '#ffd166'
const RIBBON = '#e0405e'
const STEAM = '#d9d0c7'

/** The food a bite carries: a slice of pork, a leaf of napa or shungiku, a cube of tofu (MORSEL_COLORS). */
type Food = keyof typeof MORSEL_COLORS

/**
 * Every color the feast's effects take, with the highlight each one's shape paints (its `h`): what the export's
 * palette needs beside the members' own and the moods' (the sweat, bang, sparkles and steam are already there).
 */
export const FEAST_FX_COLORS: readonly string[] = [...Object.values(MORSEL_COLORS), FLASH_COLOR, WEED_COLOR].flatMap(c => [c.toLowerCase(), highlight(c)])

/** An effect with its top-left at (x, y): canvas pixels on the pose (`body`) or, from the portrait window, the head. */
function fxAt(kind: FxKind, x: number, y: number, color: string, on: 'body' | 'head' = 'body'): Fx {
  return { kind, x, y, color, ...(on === 'body' ? { on: 'body' as const } : {}) }
}

/** An effect centred on a canvas point. */
function fxOn(kind: FxKind, p: { x: number; y: number }, color: string): Fx {
  const { fw, fh } = fxSize(kind)
  return fxAt(kind, p.x - Math.floor(fw / 2), p.y - Math.floor(fh / 2), color)
}

/** Where what she holds acts on a pose (MemberArt.tips): the chopsticks' tips, the ladle's cup, the phone's lens. */
function tipOf(art: MemberArt, pose: SeatPose): { x: number; y: number } {
  const t = art.tips?.[pose]
  if (t === undefined) throw new Error(`feast: ${art.id}'s ${pose} has no tip (MemberArt.tips)`)
  return t
}

/** The food on her chopsticks' tips, on whatever pose they are on. */
function morsel(art: MemberArt, pose: SeatPose, food: Food): Fx {
  return fxOn('morsel', tipOf(art, pose), MORSEL_COLORS[food])
}

/** A flight: an effect a frame from frame `at` on (null: not drawn that frame), wrapping round the loop's end. */
type Flight = { at: number; path: readonly (Fx | null)[] }

/** Sweat sliding down beside her face (on our right, past her far cheek), a row a frame from a drip forming. */
function sweat(art: MemberArt, at: number): Flight {
  const x = art.face.x - art.head.x + 16
  const y = art.face.y - art.head.y - 2
  return { at, path: [fxAt('drop', x + 1, y, SWEAT, 'head'), ...[1, 2, 3, 4, 5, 6].map(d => fxAt('sweat', x, y + d, SWEAT, 'head'))] }
}

/** The panic bang above her head on our right: in small, held big, out small (the panic mood's, still). */
function bang(art: MemberArt, at: number, hold: number): Flight {
  const x = 28
  const small = fxAt('twinkle', x - 1, 3, BANG, 'head')
  return { at, path: [small, ...Array.from({ length: hold }, () => fxAt('bang', x, -1, BANG, 'head')), small] }
}

/** Sweat flung off her head in an arc to one side (the panic mood's arcs, from the head window). */
function fling(at: number, side: 1 | -1): Flight {
  const spots: readonly (readonly [number, number])[] = side === 1 ? [[27, 12], [31, 8], [34, 7], [36, 10]] : [[2, 16], [-2, 13], [-5, 12], [-8, 15]]
  return { at, path: spots.map(([x, y], i) => fxAt(i === spots.length - 1 ? 'drop' : 'sweat', x, y, SWEAT, 'head')) }
}

/** A sparkle's pulse centred on a canvas point beside her: small, big, small. */
function pulse(cx: number, cy: number, color: string): Flight['path'] {
  return [fxAt('twinkle', cx - 2, cy - 2, color), fxAt('sparkle', cx - 4, cy - 4, color), fxAt('twinkle', cx - 2, cy - 2, color)]
}

/** Kita's photo: the flash bursting on her phone's lens, then a twinkle where it was. */
function flash(art: MemberArt, at: number): Flight {
  const lens = tipOf(art, 'seatPhone')
  return { at, path: [fxOn('flash', lens, FLASH_COLOR), fxOn('flash', lens, FLASH_COLOR), fxOn('twinkle', lens, GOLD)] }
}

/** Steam puffing up off the ladle's cup as the broth goes in, rising a row a frame and thinning out. */
function steam(art: MemberArt, at: number): Flight {
  const cup = tipOf(art, 'seatLadle')
  const puff = (dy: number) => fxAt('dust', cup.x - 4, cup.y - 7 - dy, STEAM)
  return { at, path: [puff(0), puff(1), puff(2), puff(3), fxAt('twinkle', cup.x - 2, cup.y - 13, GOLD), null] }
}

/** Ryo's weed in the corner of her mouth (feast.weed), a row lower on the chew. */
function weed(art: MemberArt, down: 0 | 1): Fx {
  const at = art.feast?.weed
  if (at === undefined) throw new Error(`feast: ${art.id} has no weed (feast.weed)`)
  return fxAt('weed', at.x, at.y + down, WEED_COLOR)
}

// ---- Laying a loop out --------------------------------------------------------------------------------------------

/** A member's loop on the shared clock: her pose and face a frame (a track, or one all along), the food on her tips over spans, effects' flights, effects held all along. */
type Plan = {
  pose: SeatPose | readonly SeatPose[]
  face: FeastFaceName | readonly FeastFaceName[]
  food?: readonly (readonly [from: number, to: number, food: Food])[]
  flights?: readonly Flight[]
  each?: (f: number) => readonly Fx[]
}

/** The loop's frames, one key a frame, then identical neighbours folded into holds. Throws on a track of the wrong length. */
function lay(art: MemberArt, state: FeastState, plan: Plan): FeastTag {
  const n = feastLength(art.id, state)
  const at = <T>(v: T | readonly T[], f: number, name: string): T => {
    if (!Array.isArray(v)) return v as T
    if (v.length !== n) throw new Error(`feast: ${art.id}'s ${state} ${name} track is ${v.length} frames, the loop ${n}`)
    return v[f] as T
  }
  const fx: Fx[][] = Array.from({ length: n }, () => [])
  for (const [from, to, food] of plan.food ?? []) {
    for (let k = 0, f = ((from % n) + n) % n; k < n; k += 1, f = (f + 1) % n) {
      ;(fx[f] as Fx[]).push(morsel(art, at(plan.pose, f, 'pose'), food))
      if (f === ((to % n) + n) % n) break
    }
  }
  for (const fl of plan.flights ?? []) fl.path.forEach((e, i) => e && (fx[(((fl.at + i) % n) + n) % n] as Fx[]).push(e))
  const keys = Array.from({ length: n }, (_, f): FeastKey => {
    const extra = plan.each?.(f) ?? []
    const all = [...(fx[f] as Fx[]), ...extra]
    return { hold: 1, pose: at(plan.pose, f, 'pose'), face: at(plan.face, f, 'face'), ...(all.length ? { fx: all } : {}) }
  })
  const out: FeastKey[] = []
  for (const k of keys) {
    const last = out[out.length - 1]
    if (last && JSON.stringify({ ...last, hold: 0 }) === JSON.stringify({ ...k, hold: 0 })) out[out.length - 1] = { ...last, hold: last.hold + 1 }
    else out.push({ ...k })
  }
  return { keys: out }
}

/** A blink: half, shut, half, from frame `at`. */
const blink = (at: number, base: FeastFaceName = 'half'): readonly (readonly [number, number, FeastFaceName])[] => [
  [at, at, base],
  [at + 1, at + 1, 'blink'],
  [at + 2, at + 2, base],
]

// ---- wait: nothing cached yet, 4 s (40 frames) -------------------------------------------------------------------
//
// Resting on her seat, the forearms folded, waiting for the first order; on the shared clock:
//   bocchi  looks away 6-11 (shy) · her eyes dart 17 · blinks 24-26 · peeks at the pot 31-36
//   nijika  beams 0-3 (a twinkle by her hair) · blinks 12-14 · looks at the pot 18-23 · beams again 33-35
//   ryo     heavy lids · looks aside 6-11 (bored) · one slow blink 20-21 · the lids lift 30-35
//   kita    sparkles 6-10 (her aura, gold) · looks round 16-18 · looks at the pot 26-30 · blinks 36-38

function wait(art: MemberArt): FeastTag {
  const n = FEAST_LENGTH.wait
  switch (art.id) {
    case 'bocchi':
      return lay(art, 'wait', { pose: 'seat', face: spans<FeastFaceName>(n, 'idle', [[6, 11, 'glance'], [17, 17, 'glance'], ...blink(24), [31, 36, 'idlePot']]) })
    case 'nijika':
      return lay(art, 'wait', {
        pose: 'seat',
        face: spans<FeastFaceName>(n, 'idle', [[0, 3, 'happy'], ...blink(12), [18, 23, 'idlePot'], [33, 35, 'happy']]),
        flights: [{ at: 1, path: pulse(30, 27, RIBBON) }],
      })
    case 'ryo':
      return lay(art, 'wait', {
        pose: 'seat',
        face: spans<FeastFaceName>(n, 'half', [
          [6, 11, 'glance'],
          [20, 21, 'blink'],
          [30, 35, 'idle'],
        ]),
      })
    case 'kita':
      return lay(art, 'wait', {
        pose: 'seat',
        face: spans<FeastFaceName>(n, 'idle', [[6, 10, 'happy'], [16, 18, 'glance'], [26, 30, 'idlePot'], ...blink(36)]),
        flights: [{ at: 7, path: pulse(30, 28, GOLD) }],
      })
  }
}

// ---- eat: a feast, 4.8 s (48 frames) -----------------------------------------------------------------------------
//
// Into the pot (eyes on it), the food on her tips, to her torizara, up to her mouth (the bite), chewing; on the
// shared clock, the bites never together:
//   bocchi  shy and slow, one bite: hovers over the pot 0-5, takes meat 6-9, to the plate 10-13, bites 14-16,
//           chews 17-26, blinks 27-29, looks up at us 30-37, eyes the pot again 38-47
//   nijika  serves with her ladle 0-9, then tofu: reaches 10-11, takes it 12-15, plate 16-18, bites 19-21, chews
//           22-29, blinks 30-32, beams at us 33-39, back to her ladle 40-47
//   ryo     fast, two bites: meat 0-8 (bites 7-8), chews 9-14, eyes the pot 15-23, napa 24-32 (bites 31-32),
//           chews 33-38, blinks 39-41, eyes the pot 42-47 ("Seconds.")
//   kita    chews 0-8 (a sparkle 3), blinks 9-11, smiles at us 12-23, frames the pot 24-29, the flash 30, pleased
//           31-35 ("So photogenic!"), reaches 36-37, takes napa 38-41, plate 42-44, bites 45-47

function eat(art: MemberArt): FeastTag {
  const n = FEAST_LENGTH.eat
  switch (art.id) {
    case 'bocchi':
      return lay(art, 'eat', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [0, 9, 'seatPot'],
          [14, 16, 'seatUp'],
        ]),
        face: spans<FeastFaceName>(n, 'idlePot', [[14, 16, 'bite'], [17, 26, 'happy'], ...blink(27), [30, 37, 'idle']]),
        food: [[6, 16, 'meat']],
      })
    case 'nijika':
      return lay(art, 'eat', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [0, 9, 'seatLadle'],
          [10, 15, 'seatPot'],
          [19, 21, 'seatUp'],
          [40, 47, 'seatLadle'],
        ]),
        face: spans<FeastFaceName>(n, 'idle', [
          [0, 9, 'focusPot'],
          [10, 18, 'idlePot'],
          [19, 21, 'bite'],
          [22, 29, 'happy'],
          ...blink(30),
          [40, 47, 'focusPot'],
        ]),
        food: [[12, 21, 'tofu']],
      })
    case 'ryo':
      return lay(art, 'eat', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [0, 4, 'seatPot'],
          [7, 8, 'seatUp'],
          [24, 28, 'seatPot'],
          [31, 32, 'seatUp'],
        ]),
        face: spans<FeastFaceName>(n, 'idlePot', [
          [7, 8, 'bite'],
          [9, 14, 'happy'],
          [31, 32, 'bite'],
          [33, 38, 'happy'],
          ...blink(39),
        ]),
        food: [
          [2, 8, 'meat'],
          [26, 32, 'veg'],
        ],
      })
    case 'kita':
      return lay(art, 'eat', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [24, 35, 'seatPhone'],
          [36, 41, 'seatPot'],
          [45, 47, 'seatUp'],
        ]),
        face: spans<FeastFaceName>(n, 'idle', [
          [0, 8, 'happy'],
          ...blink(9),
          [24, 29, 'idlePot'],
          [30, 35, 'happy'],
          [36, 44, 'idlePot'],
          [45, 47, 'bite'],
        ]),
        food: [[38, 47, 'veg']],
        flights: [flash(art, 30), { at: 3, path: pulse(30, 28, GOLD) }, { at: 17, path: pulse(66, 33, GOLD) }, { at: 32, path: pulse(30, 25, GOLD) }],
      })
  }
}

// ---- calm: simmering, 6.4 s (64 frames) --------------------------------------------------------------------------
//
// The same eating, slower, the eyes half shut on the pot (halfPot), one bite each; on the shared clock:
//   bocchi  reaches 0-9, napa 10-15, plate 16-21, bites 22-25, chews 26-37, blinks 38-40, rests 41-63 (looks up
//           at us 50-55)
//   nijika  tends the pot with her ladle 0-15 (a smile 6-9), reaches 16-19, tofu 20-25, plate 26-31, bites
//           32-35, chews 36-45, blinks 46-48, back to the ladle 49-63 (a smile 56-59)
//   ryo     rests (looks up 8-12, blinks 18-20), reaches 30-33, meat 34-37, plate 38-40, bites 41-43, chews
//           44-51, blinks 52-54, rests (looks up 60-63)
//   kita    chews 0-11, blinks 12-14, rests 15-43 (smiles at us 26-31, blinks 33-35), reaches 44-49, meat 50-55,
//           plate 56-59, bites 60-63

function calm(art: MemberArt): FeastTag {
  const n = FEAST_LENGTH.calm
  switch (art.id) {
    case 'bocchi':
      return lay(art, 'calm', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [0, 15, 'seatPot'],
          [22, 25, 'seatUp'],
        ]),
        face: spans<FeastFaceName>(n, 'halfPot', [[22, 25, 'bite'], [26, 37, 'happy'], ...blink(38), [50, 55, 'idle']]),
        food: [[10, 25, 'veg']],
      })
    case 'nijika':
      return lay(art, 'calm', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [0, 15, 'seatLadle'],
          [16, 25, 'seatPot'],
          [32, 35, 'seatUp'],
          [49, 63, 'seatLadle'],
        ]),
        face: spans<FeastFaceName>(n, 'halfPot', [
          [0, 15, 'focusPot'],
          [6, 9, 'happy'],
          [32, 35, 'bite'],
          [36, 45, 'happy'],
          ...blink(46),
          [49, 63, 'focusPot'],
          [56, 59, 'happy'],
        ]),
        food: [[20, 35, 'tofu']],
      })
    case 'ryo':
      return lay(art, 'calm', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [30, 37, 'seatPot'],
          [41, 43, 'seatUp'],
        ]),
        face: spans<FeastFaceName>(n, 'halfPot', [[8, 12, 'half'], ...blink(18), [41, 43, 'bite'], [44, 51, 'happy'], ...blink(52), [60, 63, 'half']]),
        food: [[34, 43, 'meat']],
      })
    case 'kita':
      return lay(art, 'calm', {
        pose: spans<SeatPose>(n, 'seatBowl', [
          [44, 55, 'seatPot'],
          [60, 63, 'seatUp'],
        ]),
        face: spans<FeastFaceName>(n, 'halfPot', [[0, 11, 'happy'], ...blink(12), [26, 31, 'idle'], ...blink(33), [60, 63, 'bite']]),
        food: [[50, 63, 'meat']],
      })
  }
}

// ---- worry: last orders, 4 s (40 frames) -------------------------------------------------------------------------
//
// Still, the eyes at us (a look aside at most a beat), sweat sliding down beside the face; on the shared clock:
//   bocchi  her torizara still in hand: sweat 4-10 and 30-36, looks aside 16-17, blinks 26-28
//   nijika  her ladle still in the pot, set on it (focus): blinks 8-10, sweat 20-26
//   ryo     her chopsticks on the last piece (seatPoint), staring us down (focus): her lids droop 8-9, she eases
//           18-23, looks aside 28 (a beat), one slow blink 34-35
//   kita    her torizara in hand: looks aside 2-3, sweat 12-18, blinks 22-24

function worry(art: MemberArt): FeastTag {
  const n = FEAST_LENGTH.worry
  switch (art.id) {
    case 'bocchi':
      return lay(art, 'worry', {
        pose: 'seatBowl',
        face: spans<FeastFaceName>(n, 'idle', [[16, 17, 'glance'], ...blink(26)]),
        flights: [sweat(art, 4), sweat(art, 30)],
      })
    case 'nijika':
      return lay(art, 'worry', { pose: 'seatLadle', face: spans<FeastFaceName>(n, 'focus', [...blink(8)]), flights: [sweat(art, 20)] })
    case 'ryo':
      return lay(art, 'worry', {
        pose: 'seatPoint',
        face: spans<FeastFaceName>(n, 'focus', [
          [8, 9, 'half'],
          [18, 23, 'idle'],
          [28, 28, 'glance'],
          [34, 35, 'blink'],
        ]),
      })
    case 'kita':
      return lay(art, 'worry', {
        pose: 'seatBowl',
        face: spans<FeastFaceName>(n, 'idle', [[2, 3, 'glance'], ...blink(22)]),
        flights: [sweat(art, 12)],
      })
  }
}

// ---- cold: once it lapsed -----------------------------------------------------------------------------------------
//
// Nijika and Kita slumped over the table, melting: stills. Ryo chewing a weed, 2.4 s (24 frames): the blade dips a
// row on each chew (three, then a rest), one slow blink 20-21.

function cold(art: MemberArt): FeastTag {
  switch (art.id) {
    case 'ryo': {
      const n = feastLength('ryo', 'cold')
      const chew = spans<0 | 1>(n, 0, [
        [3, 4, 1],
        [8, 9, 1],
        [13, 14, 1],
      ])
      return lay(art, 'cold', { pose: 'seat', face: spans<FeastFaceName>(n, 'half', [[20, 21, 'blink']]), each: f => [weed(art, chew[f] as 0 | 1)] })
    }
    case 'nijika':
    case 'kita':
      return lay(art, 'cold', { pose: 'seatSlump', face: 'melt' })
    case 'bocchi':
      throw new Error('feast: Bocchi has no cold loop (the mod seats her box)')
  }
}

// ---- shock: a send held, 2 s (20 frames) ------------------------------------------------------------------------
//
// The panic face held, the bang popping in and held, sweat flying off (no shake: the figures stay still); on the
// shared clock, the bangs popping one after another: bocchi 0 (hands up, sweat flung both ways 4 and 12), nijika 5
// (sweat 9), kita 10 ("The BILL?!", sweat 2), ryo late, as everything she does (sweat sliding 3, the bang 15, a
// drop flung 14).

function shock(art: MemberArt): FeastTag {
  switch (art.id) {
    case 'bocchi':
      return lay(art, 'shock', { pose: 'seatPanic', face: 'panic', flights: [bang(art, 0, 17), fling(4, 1), fling(4, -1), fling(12, 1), fling(12, -1)] })
    case 'nijika':
      return lay(art, 'shock', { pose: 'seat', face: 'panic', flights: [bang(art, 5, 13), fling(9, 1)] })
    case 'ryo':
      return lay(art, 'shock', { pose: 'seat', face: 'panic', flights: [sweat(art, 3), bang(art, 15, 3), fling(14, -1)] })
    case 'kita':
      return lay(art, 'shock', { pose: 'seat', face: 'panic', flights: [bang(art, 10, 13), fling(2, 1)] })
  }
}

// ---- serve: a ping, 2.4 s (24 frames), Nijika's ---------------------------------------------------------------------
//
// The ladle in the pot, topping it up ("Topping it up~"): set on it, then beaming, twice; steam puffing up off the
// cup 2 and 14.

function serve(art: MemberArt): FeastTag {
  const n = feastLength(art.id, 'serve')
  return lay(art, 'serve', {
    pose: 'seatLadle',
    face: spans<FeastFaceName>(n, 'focusPot', [
      [6, 11, 'happy'],
      [18, 23, 'happy'],
    ]),
    flights: [steam(art, 2), steam(art, 14)],
  })
}

// ---- The loops --------------------------------------------------------------------------------------------------------

const memo = new WeakMap<MemberArt, Map<FeastState, FeastTag>>()

/** A member's loop in a feast state (throws for a state she does not loop, or a track of the wrong length). */
export function feastTag(art: MemberArt, state: FeastState): FeastTag {
  let byState = memo.get(art)
  if (byState === undefined) {
    byState = new Map()
    memo.set(art, byState)
  }
  const hit = byState.get(state)
  if (hit !== undefined) return hit
  if (!FEAST_STATES_OF[art.id].includes(state)) throw new Error(`feast: ${art.id} has no ${state} loop`)
  const make = { wait, eat, calm, worry, cold, shock, serve }[state]
  const tag = make(art)
  byState.set(state, tag)
  return tag
}

/** A loop's length in frames. */
export function feastFramesOf(art: MemberArt, state: FeastState): number {
  return feastTag(art, state).keys.reduce((n, k) => n + k.hold, 0)
}

/** The scene at frame `f` of a member's feast loop, looping. */
export function feastSceneAt(art: MemberArt, state: FeastState, f: number): FeastScene {
  const { keys } = feastTag(art, state)
  const total = keys.reduce((n, k) => n + k.hold, 0)
  let t = ((f % total) + total) % total
  for (const k of keys) {
    if (t < k.hold) return { pose: k.pose, face: k.face, dx: 0, dy: 0, squash: 0, melt: 0, fx: k.fx ?? [] }
    t -= k.hold
  }
  const k = keys[0] as FeastKey
  return { pose: k.pose, face: k.face, dx: 0, dy: 0, squash: 0, melt: 0, fx: k.fx ?? [] }
}

/** A frame of a member's feast loop on the feast window (96x64: rows 6-69 of her canvas). */
export function drawFeast(art: MemberArt, state: FeastState, frame: number): Pixels {
  return drawScene(art, feastSceneAt(art, state, frame), 'feast')
}

/** Nijika's headband alone on the feast window (transparent elsewhere): the mod lays it over whatever she plays while keepwarm runs. */
export function drawFeastHeadband(art: MemberArt): Pixels {
  const px = blank()
  const band = art.feast?.headband
  if (band !== undefined) stamp(px, band.grid, art.palette, band.x, band.y)
  return crop(px, 0, FEAST_Y, W, FEAST_H)
}

/** Every color the feast's loops give their effects (the export's palette needs them, with their highlights). */
export function feastFxColors(art: MemberArt): string[] {
  const set = new Set<string>()
  for (const state of FEAST_STATES_OF[art.id]) for (const k of feastTag(art, state).keys) for (const f of k.fx ?? []) set.add((f.color ?? art.accent).toLowerCase())
  return [...set]
}

/**
 * What is wrong with the feast's loops, as sentences: a loop that does not lay out (a track of the wrong length,
 * a pose without its tip), a state's loops not all one length (`cold` and `serve` aside: each member's own), a
 * loop that moves the figure (the feast's move arms and faces only).
 */
export function checkFeastTimelines(band: Readonly<Record<MemberId, MemberArt>>): string[] {
  const problems: string[] = []
  const lengths = new Map<FeastState, Map<number, MemberId[]>>()
  for (const id of MEMBER_IDS) {
    const art = band[id]
    for (const state of FEAST_STATES_OF[id]) {
      let n: number
      try {
        n = feastFramesOf(art, state)
      } catch (e) {
        problems.push(`feast ${id} ${state}: ${(e as Error).message}`)
        continue
      }
      const want = feastLength(id, state)
      if (n !== want) problems.push(`feast ${id} ${state}: ${n} frames, wants ${want}`)
      if (state === 'cold' || state === 'serve') continue
      const byLength = lengths.get(state) ?? new Map<number, MemberId[]>()
      byLength.set(n, [...(byLength.get(n) ?? []), id])
      lengths.set(state, byLength)
    }
  }
  for (const [state, byLength] of lengths) {
    if (byLength.size > 1) problems.push(`feast ${state}: the loops are not one length (${[...byLength].map(([n, ids]) => `${ids.join(', ')} ${n}`).join('; ')}), so they would drift apart on the mod's clock`)
  }
  return problems
}
