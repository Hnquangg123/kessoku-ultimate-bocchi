// The slimes' timelines: how one act on stage (a subagent) moves in each of
// its three states, and the slime drawn to pixels.
//
// Written like the moods (./moods.ts): a loop a state, laid out in tracks (the
// body's squash, stretch or hop, the z's flight), folded into keys with holds,
// ten frames a second on the mod's sprite clock. A state's loop is one length
// for the four members and runs from the same zero as every other loop, so
// the strip's heads and slimes share one tick; each member's beat falls a
// quarter of the loop after the one before her in the band's row (Bocchi,
// Nijika, Ryo, Kita), so a row of slimes ripples instead of marching in step.
//
//   active  the act runs: a bounce (a squash on the floor, a stretch, a hop
//           of one pixel, a landing squash) and a long hold; Bocchi awake,
//           her eyes open throughout.
//   idle    pending or waiting: a slow breath (a squash held 0.8 s every
//           2.4 s), nothing else.
//   asleep  done, failed or killed: a slower breath (1.2 s every 3.2 s) and a
//           z from the pixel font drifting up and fading on her open side
//           (Bocchi's and Ryo's right, clear of the clips and the long bob;
//           Nijika's and Kita's left, clear of the ponytail and the side
//           tail), twice a loop.
//
// The body is her slime grid (`content`, Bocchi's `awake` while active) laid
// on the 36x24 slime canvas bottom-aligned and centred; a squash or a stretch
// scales its rows about the bottom row (compose.ts `scaleRows`: a blob has no
// bend row), a hop lifts it a pixel off the floor. The slime mini (18x12, the
// terminal's) is that body halved by `downscale2`; its z is drawn again at the
// font's size on its own path, inside the mini.

import { blank, downscale2, gridSize, scaleRows, shift, stamp, stampText } from '../art/compose'
import type { Pixels } from '../art/compose'
import type { MemberArt, MemberId, SlimeFace, SlimeState } from '../art/types'
import { SLIME_H, SLIME_W } from '../art/types'
import { MEMBER_IDS, track } from './moods'

export const SLIME_STATES: readonly SlimeState[] = ['active', 'idle', 'asleep']

/** The slime canvas (36x24: the desktop's, one CSS pixel a pixel), or the slime mini, the canvas halved (18x12: the terminal's quadrants). */
export type SlimeView = 'slime' | 'slime-mini'

export const SLIME_MINI_W = SLIME_W / 2
export const SLIME_MINI_H = SLIME_H / 2

/**
 * The z: the pixel font's 3x5 Z with its top-left at (x, y) on the slime
 * canvas and at (mx, my) on the mini, in one of the fade's colors.
 */
export type Zee = { x: number; y: number; mx: number; my: number; color: string }

export type SlimeKey = {
  /** Frames (100 ms each). */
  hold: number
  /** Absent: `content`. */
  face?: SlimeFace
  /** Rows lower (1 a breath or a landing). */
  squash?: number
  /** Rows taller (1 the take-off). */
  stretch?: number
  /** The whole slime moved up or down (-1 the hop). */
  dy?: number
  z?: Zee
}

export type SlimeTag = { keys: readonly SlimeKey[] }

/** One frame as drawn. */
export type SlimeScene = { face: SlimeFace; squash: number; stretch: number; dy: number; z: Zee | null }

/**
 * The z fading in and out: dusk, lavender, pale lavender. Mid-tones with no outline, so every step shows on a
 * dark surface and on a light one alike (where the fade reads the other way round).
 */
const Z_DIM = '#6f6884'
const Z_MID = '#8f86ad'
const Z_BRIGHT = '#b8b0dd'
/** Every color the slime timelines paint beside the members' own (the export's palette needs them). */
export const SLIME_FX_COLORS: readonly string[] = [Z_DIM, Z_MID, Z_BRIGHT]

/** A state's loop, in frames: the same for the four members (they play on one clock). */
const LENGTH: Readonly<Record<SlimeState, number>> = { active: 16, idle: 24, asleep: 32 }

/** The body on a frame: resting, squashed a row, stretched a row, or a pixel off the floor. */
type Body = 'rest' | 'squash' | 'stretch' | 'hop'
const BODY: Readonly<Record<Body, Pick<SlimeKey, 'squash' | 'stretch' | 'dy'>>> = { rest: {}, squash: { squash: 1 }, stretch: { stretch: 1 }, hop: { dy: -1 } }

// ---- active: a bounce, 1.6 s (16 frames) -------------------------------------------------------------------
//
// From each member's own beat (on the shared clock: Bocchi 0, Nijika 4, Ryo 8, Kita 12):
//   bocchi  hesitates: the anticipation held two frames (0-1), the stretch 2, the hop 3-4, the landing 5
//   nijika  on the beat: squash 4, stretch 5, hop 6-7, landing 8, and a bob on the off-beat (12)
//   ryo     one bounce and the longest hold: squash 8, stretch 9, hop 10-11, landing 12
//   kita    performs: hangs in the air a beat longer, squash 12, stretch 13, hop 14-0, landing 1
const BOUNCE: Readonly<Record<MemberId, readonly Body[]>> = {
  bocchi: track<Body>(['squash', 2], ['stretch', 1], ['hop', 2], ['squash', 1], ['rest', 10]),
  nijika: track<Body>(['squash', 1], ['stretch', 1], ['hop', 2], ['squash', 1], ['rest', 3], ['squash', 1], ['rest', 7]),
  ryo: track<Body>(['squash', 1], ['stretch', 1], ['hop', 2], ['squash', 1], ['rest', 11]),
  kita: track<Body>(['squash', 1], ['stretch', 1], ['hop', 3], ['squash', 1], ['rest', 10]),
}

// ---- idle: a breath, 2.4 s (24 frames) --------------------------------------------------------------------
//
// Down for 8 frames from her beat (Bocchi 0, Nijika 6, Ryo 12, Kita 18), up for 16.
const BREATH: readonly Body[] = track<Body>(['squash', 8], ['rest', 16])

// ---- asleep: a slow breath and a z, 3.2 s (32 frames) -------------------------------------------------------
//
// Down for 12 frames from her beat (Bocchi 0, Nijika 8, Ryo 16, Kita 24), up for 20; a z leaves two frames after
// the beat and another half a loop later, each 14 frames: up a row every other frame (six rows), a column outward
// halfway, fading in (dim, light), held bright, fading out. On the mini, from its own corner, a row every four
// frames while it fits there (on frames the slime's z moves too, so the mini changes only where the slime does).
const DOZE: readonly Body[] = track<Body>(['squash', 12], ['rest', 20])
const Z_RISE = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6] as const
const Z_DRIFT = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1] as const
const Z_MINI_RISE = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2] as const
const Z_FADE = [Z_DIM, Z_DIM, Z_MID, Z_MID, Z_BRIGHT, Z_BRIGHT, Z_BRIGHT, Z_BRIGHT, Z_BRIGHT, Z_BRIGHT, Z_MID, Z_MID, Z_DIM, Z_DIM] as const
const Z_STARTS = [2, 18] as const

/**
 * Where her z starts (its top-left) and which way it drifts, on her open side: on the canvas beside her
 * shoulder, clear of her by two columns or more; on the mini in the free corner above her shoulder, as high
 * as it can rise there (the lowest row it may start on).
 */
const Z_FROM: Readonly<Record<MemberId, { x: number; y: number; out: 1 | -1; mx: number; my: number }>> = {
  bocchi: { x: 30, y: 8, out: 1, mx: 15, my: 2 },
  nijika: { x: 1, y: 7, out: -1, mx: 0, my: 0 },
  ryo: { x: 30, y: 8, out: 1, mx: 15, my: 2 },
  kita: { x: 1, y: 7, out: -1, mx: 0, my: 0 },
}

/** One z's flight from its start, a frame a step. */
function zFlight(id: MemberId): Zee[] {
  const from = Z_FROM[id]
  return Z_FADE.map((color, i) => ({
    x: Math.max(0, Math.min(SLIME_W - 3, from.x + from.out * (Z_DRIFT[i] as number))),
    y: Math.max(0, from.y - (Z_RISE[i] as number)),
    mx: from.mx,
    my: Math.max(0, from.my - (Z_MINI_RISE[i] as number)),
    color,
  }))
}

/** A loop's frames as a tag: turned `spin` frames later (frame f shows frame f - spin), identical neighbours folded into holds. */
function loop(keys: readonly SlimeKey[], spin: number): SlimeTag {
  const n = keys.length
  const out: SlimeKey[] = []
  for (let f = 0; f < n; f += 1) {
    const k = keys[(((f - spin) % n) + n) % n] as SlimeKey
    const last = out[out.length - 1]
    if (last && JSON.stringify({ ...last, hold: 0 }) === JSON.stringify({ ...k, hold: 0 })) out[out.length - 1] = { ...last, hold: last.hold + 1 }
    else out.push({ ...k })
  }
  return { keys: out }
}

/** A member's loop in a state. */
export function slimeTag(art: MemberArt, state: SlimeState): SlimeTag {
  const n = LENGTH[state]
  const spin = (MEMBER_IDS.indexOf(art.id) * n) / 4
  const body = state === 'active' ? BOUNCE[art.id] : state === 'idle' ? BREATH : DOZE
  const face: SlimeFace = state === 'active' && art.slime?.awake !== undefined ? 'awake' : 'content'
  const zs: (Zee | undefined)[] = Array.from({ length: n }, () => undefined)
  if (state === 'asleep') for (const at of Z_STARTS) zFlight(art.id).forEach((z, i) => (zs[(at + i) % n] = z))
  if (body.length !== n) throw new Error(`slimes: ${art.id}'s ${state} body track is ${body.length} frames, the loop ${n}`)
  const keys = body.map((b, f): SlimeKey => {
    const z = zs[f]
    return { hold: 1, ...(face === 'awake' ? { face } : {}), ...BODY[b], ...(z ? { z } : {}) }
  })
  return loop(keys, spin)
}

/** A loop's length in frames. */
export function slimeFramesOf(art: MemberArt, state: SlimeState): number {
  return slimeTag(art, state).keys.reduce((n, k) => n + k.hold, 0)
}

/** The scene at frame `f` of a member's slime in a state, looping. */
export function slimeSceneAt(art: MemberArt, state: SlimeState, f: number): SlimeScene {
  const { keys } = slimeTag(art, state)
  const total = keys.reduce((n, k) => n + k.hold, 0)
  let t = ((f % total) + total) % total
  for (const k of keys) {
    if (t < k.hold) return { face: k.face ?? 'content', squash: k.squash ?? 0, stretch: k.stretch ?? 0, dy: k.dy ?? 0, z: k.z ?? null }
    t -= k.hold
  }
  return { face: 'content', squash: 0, stretch: 0, dy: 0, z: null }
}

/** The body alone on the slime canvas: the face's grid bottom-aligned and centred, squashed or stretched, moved. */
function slimeBody(art: MemberArt, scene: SlimeScene): Pixels {
  const slime = art.slime
  if (slime === undefined) return blank(SLIME_W, SLIME_H)
  const grid = scene.face === 'awake' && slime.awake !== undefined ? slime.awake : slime.content
  const { w, h } = gridSize(grid)
  const px = stamp(blank(SLIME_W, SLIME_H), grid, art.palette, Math.floor((SLIME_W - w) / 2), SLIME_H - h)
  return shift(scaleRows(px, scene.squash - scene.stretch), 0, scene.dy)
}

/** A slime scene drawn in a view: the body, then the z over it (on the mini, the body halved and the z drawn again on it). */
export function drawSlimeScene(art: MemberArt, scene: SlimeScene, view: SlimeView): Pixels {
  const body = slimeBody(art, scene)
  if (view === 'slime') {
    if (scene.z !== null) stampText(body, 'Z', scene.z.x, scene.z.y, scene.z.color)
    return body
  }
  const mini = downscale2(body)
  if (scene.z !== null) stampText(mini, 'Z', scene.z.mx, scene.z.my, scene.z.color)
  return mini
}

export function drawSlime(art: MemberArt, state: SlimeState, frame: number, view: SlimeView): Pixels {
  return drawSlimeScene(art, slimeSceneAt(art, state, frame), view)
}
