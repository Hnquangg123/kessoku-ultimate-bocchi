// A scene drawn to pixels: the pose resolved, the face over the head (the peek
// on the box), the hair's sway, the squash, the melt, the move, then the
// effects; cropped to the 32x32 portrait window for the small spots. The mini
// (16x16) is the member's hand-drawn mini rig with the scene scaled down onto
// it, or, for a member without one, the portrait halved.

import { OUTLINE, blank, crop, downscale2, gridSize, headOffset, melt, resolvePose, shift, solidMask, squash, stamp, stampFx, stampFxMini } from '../art/compose'
import type { MeltInk, Pixels } from '../art/compose'
import { FX_MINI, fxSize } from '../art/fx'
import type { Grid, MemberArt, MemberId, MiniArt, Mood, Palette } from '../art/types'
import { H, MINI, PH, PW, W } from '../art/types'
import { sceneAt } from './moods'
import type { Fx, Scene } from './moods'

export type View = 'full' | 'portrait' | 'mini'

/** The soles' row: where `on: 'ground'` effects measure from. */
export const GROUND = 93

/** Where the portrait window sits for a scene's pose, before the scene's squash and move. */
export function windowOf(art: MemberArt, scene: Pick<Scene, 'pose'>): { x: number; y: number } {
  if (scene.pose === 'box') return art.boxHead
  const { dx, dy } = headOffset(art, scene.pose)
  return { x: art.head.x + dx, y: art.head.y + dy }
}

/** Whether an effect shows in a view: everywhere unless its `views` names the ones it keeps to. */
function shows(f: Fx, view: View): boolean {
  return f.views === undefined || f.views.includes(view)
}

/** How many rows at the top of a window the pose leaves empty: how far her head can rise in it uncut. */
function headroom(grid: Grid, at: { x: number; y: number }): number {
  let free = 0
  while (free < PH) {
    const row = grid[at.y + free] ?? ''
    if (/[^.]/.test([...row].slice(Math.max(0, at.x), at.x + PW).join(''))) break
    free += 1
  }
  return free
}

/**
 * How each member melts, by palette key (her palette.ts names what each key paints):
 *   own     her instrument's own colors: they never drip, and the instrument sinks into the puddle
 *   shared  colors the instrument shares with her (Bocchi's and Kita's grey-purple and dark grey, also their
 *           skirts; a glint, also in the eyes; Ryo's pickup black and string metal, also her hair pins): the
 *           instrument's only where they join its own colors (`solidMask`)
 *   line, top, light, body, shade
 *           the puddle: her hair's outline, her hair and its light, her clothing (Bocchi's jacket shade, Nijika's
 *           vest, Ryo's sweater, Kita's cardigan), and the shade along the floor (her hair's shadow)
 * A key missing from her palette leaves the color out: an instrument color simply is not held back, a puddle
 * color falls back to the outline (line, shade) or her accent.
 */
const MELT_KEYS: Readonly<Record<MemberId, { own: string; shared: string; line: string; top: string; light: string; body: string; shade: string }>> = {
  bocchi: { own: 'aAt', shared: 'gGW', line: 'p', top: 'h', light: 'H', body: 'J', shade: 'r' },
  nijika: { own: 'aT', shared: '', line: 'p', top: 'h', light: 'H', body: 'R', shade: 'r' },
  ryo: { own: 'zZYqQuA', shared: 'XtW', line: 'N', top: 'h', light: 'U', body: 'j', shade: 'R' },
  kita: { own: 'aAiIOXT', shared: 'gGWt', line: 'p', top: 'h', light: 'H', body: 'j', shade: 'r' },
}

const colorsOf = (palette: Palette, keys: string): string[] => [...keys].flatMap(k => (palette[k] === undefined ? [] : [palette[k] as string]))

/** A member's melt colors over a canvas of her: the instrument found on it, the puddle's colors, the face row it keeps clear. */
function meltInk(art: MemberArt, px: Pixels | null, keep: number): MeltInk {
  const k = MELT_KEYS[art.id]
  const pick = (key: string, or: string) => art.palette[key] ?? or
  return {
    ...(px ? { solid: solidMask(px, colorsOf(art.palette, k.own), colorsOf(art.palette, k.shared)) } : {}),
    keep,
    line: pick(k.line, OUTLINE),
    top: pick(k.top, art.accent),
    light: pick(k.light, art.accent),
    body: pick(k.body, art.accent),
    shade: pick(k.shade, OUTLINE),
  }
}

/** The bottom row of a face overlay (the tallest of its grids) on the canvas it is drawn on. */
function faceFoot(face: { y: number; grids: Readonly<Record<string, Grid>> }): number {
  return face.y + Math.max(0, ...Object.values(face.grids).map(g => gridSize(g).h)) - 1
}

/** The figure alone (no effects, no move): pose, face or peek, sway, squash, melt. */
function figure(art: MemberArt, scene: Scene): { px: Pixels; sank: number; squashed: number } {
  const grid = resolvePose(art, scene.pose)
  let px = stamp(blank(), grid, art.palette, 0, 0)
  const box = scene.pose === 'box'
  if (box) {
    if (scene.peek) stamp(px, art.peek.grids[scene.peek], art.palette, art.peek.x, art.peek.y)
  } else {
    const { dx, dy } = headOffset(art, scene.pose)
    if (scene.face) stamp(px, art.face.grids[scene.face], art.palette, art.face.x + dx, art.face.y + dy)
    // The sway overlays are drawn for the hair of stand, playA and playB; the other poses keep their own hair.
    const sway = scene.sway ? art.sway?.[scene.sway] : undefined
    if (sway && (scene.pose === 'stand' || scene.pose === 'playA' || scene.pose === 'playB')) stamp(px, sway.grid, art.palette, sway.x, sway.y)
  }
  const squashed = box ? 0 : Math.max(0, scene.squash)
  if (squashed > 0) px = squash(px, art.bend, squashed)
  let sank = 0
  if (scene.melt > 0) {
    const keep = box ? art.peek.y + squashed : faceFoot(art.face) + headOffset(art, scene.pose).dy + squashed
    const m = melt(px, scene.melt, windowOf(art, scene).y + squashed + PH / 2, 1, meltInk(art, px, keep))
    px = m.px
    sank = m.sank
  }
  return { px, sank, squashed }
}

/** Where a body effect (`on: 'body'`, canvas pixels on the pose) lands: with the move, and the squash above the bend. */
function onBody(art: MemberArt, scene: Scene, f: Fx, squashed: number): { x: number; y: number } {
  return { x: f.x + scene.dx, y: f.y + (f.y < art.bend ? squashed : 0) + scene.dy }
}

export function drawScene(art: MemberArt, scene: Scene, view: View): Pixels {
  if (view === 'mini') return art.mini ? drawMini(art, art.mini, scene) : downscale2(drawScene(art, scene, 'portrait'))
  const { px: still, sank, squashed } = figure(art, scene)
  const px = shift(still, scene.dx, scene.dy)
  const win = windowOf(art, scene)
  // Body effects first, on the canvas: the portrait then shows them only where they fall inside its window.
  for (const f of scene.fx) {
    if (f.on !== 'body' || !shows(f, view)) continue
    const { fw, fh } = fxSize(f.kind)
    const at = onBody(art, scene, f, squashed)
    stampFx(px, f.kind, Math.max(0, Math.min(W - fw, at.x)), Math.max(0, Math.min(H - fh, at.y)), f.color ?? art.accent)
  }
  if (view === 'full') {
    // The head window where it ended up; every effect whole on the canvas (one keyed past an edge is pulled in).
    const hx = win.x + scene.dx
    const hy = win.y + squashed + sank + scene.dy
    for (const f of scene.fx) {
      if (f.on === 'body' || !shows(f, view)) continue
      const { fw, fh } = fxSize(f.kind)
      const x = hx + f.x
      const y = f.on === 'ground' ? GROUND + scene.dy + f.y : hy + f.y
      stampFx(px, f.kind, Math.max(0, Math.min(W - fw, x)), Math.max(0, Math.min(H - fh, y)), f.color ?? art.accent)
    }
    return px
  }
  // The portrait: the window rides with the head (its pose offset, the squash, the melt sinking), so a breath
  // keeps the face still in it; a shake shows as a move inside it; a jump moves the window with her, but for
  // a row, and only as far up as her hair has room in the window.
  const pdy = portraitLift(art, scene)
  const out = crop(px, win.x, win.y + squashed + sank + scene.dy - pdy)
  // Effects in the window: one keyed past its left or right edge is pulled in to that edge with at least half of
  // it showing, so a wide one keyed beside her stays off her face on either side (the left as the right).
  // Ground effects belong to the full view; body effects are already in.
  for (const f of scene.fx) {
    if (f.on === 'ground' || f.on === 'body' || !shows(f, view)) continue
    const { fw, fh } = fxSize(f.kind)
    const x = Math.max(-Math.floor(fw / 2), Math.min(PW - Math.ceil(fw / 2), scene.dx + f.x))
    const y = Math.max(0, Math.min(PH - fh, pdy + f.y))
    stampFx(out, f.kind, x, y, f.color ?? art.accent)
  }
  return out
}

/** How far the head moves inside the portrait window: a jump's dy, but at most a row down and only as high as the pose's hair has room. */
function portraitLift(art: MemberArt, scene: Scene): number {
  return Math.max(-headroom(resolvePose(art, scene.pose), windowOf(art, scene)), Math.min(1, scene.dy))
}

/** `v / k` rounded half away from zero (so a shake of -1 and one of +1 both survive halving, the same size). */
function scaleDown(v: number, k: number): number {
  return Math.sign(v) * Math.round(Math.abs(v) / k)
}

/**
 * The mini's move for a scene: dx halved, dy quartered (both rounded half away from zero, so a shake is as big
 * left as right) and kept within -3..1 (a jump lifts the head 3 at most), any drop at all showing as a row (a
 * one-pixel duck is the mini's one-row duck); no squash. `room` caps the lift (the rows the mini's head leaves
 * empty at its top), `sink` is how far the pose carries the head down (the crouch's head offset), added to dy
 * before quartering.
 */
export function miniMove(scene: Pick<Scene, 'dx' | 'dy'>, room = 3, sink = 0): { dx: number; dy: number } {
  const dx = scaleDown(scene.dx, 2)
  const down = scene.dy + sink
  const dy = Math.max(-Math.min(3, room), Math.min(1, down > 0 ? Math.max(1, scaleDown(down, 4)) : scaleDown(down, 4)))
  return { dx: dx === 0 ? 0 : dx, dy: dy === 0 ? 0 : dy }
}

/** How many rows at the top of a mini grid are empty. */
function miniHeadroom(grid: Grid): number {
  let free = 0
  while (free < MINI && !/[^.]/.test(grid[free] ?? '')) free += 1
  return free
}

/**
 * The move the mini rig takes for a scene: miniMove, with the lift capped at the rows its head leaves empty
 * at the top (so a jump never cuts off the ahoge, the Dorito or the side tail: the portrait does the same with
 * its window), and the crouch's lowered head showing as a dip (the anticipation and the landing of a jump).
 */
export function miniMoveFor(art: MemberArt, scene: Pick<Scene, 'pose' | 'dx' | 'dy'>): { dx: number; dy: number } {
  const mini = art.mini
  if (!mini) return miniMove(scene)
  const box = scene.pose === 'box'
  return miniMove(scene, miniHeadroom(box ? mini.box : mini.stand), box ? 0 : headOffset(art, scene.pose).dy)
}

/**
 * The mini from the member's rig: its stand head (box head on the box) with
 * the scene's face (peek), a melt at mini scale, the move scaled down, then
 * v1's small effects (FX_MINI) at their portrait-window places halved, pulled
 * inside the 16x16. Ground effects stay out; a body effect shows only when
 * its place falls inside the portrait window. A head effect sinks with the
 * melting head, as the portrait's window does (a drip falls into the puddle).
 */
function drawMini(art: MemberArt, mini: MiniArt, scene: Scene): Pixels {
  const box = scene.pose === 'box'
  let px = stamp(blank(MINI, MINI), box ? mini.box : mini.stand, art.palette, 0, 0)
  if (box) {
    if (scene.peek) stamp(px, mini.peek.grids[scene.peek], art.palette, mini.peek.x, mini.peek.y)
  } else if (scene.face) {
    stamp(px, mini.face.grids[scene.face], art.palette, mini.face.x, mini.face.y)
  }
  let sank = 0
  if (scene.melt > 0) {
    const m = melt(px, scene.melt, MINI / 2, 0.5, meltInk(art, null, box ? mini.peek.y : faceFoot(mini.face)))
    px = m.px
    sank = m.sank
  }
  const move = miniMoveFor(art, scene)
  px = shift(px, move.dx, move.dy)
  const win = windowOf(art, scene)
  for (const f of scene.fx) {
    if (f.on === 'ground' || !shows(f, 'mini')) continue
    let wx = f.x
    let wy = f.y + 2 * sank
    if (f.on === 'body') {
      // Its place in the portrait window (the figure unmoved); skipped when it falls outside.
      const { fw, fh } = fxSize(f.kind)
      wx = f.x - win.x
      wy = f.y - win.y
      if (wx + fw <= 0 || wy + fh <= 0 || wx >= PW || wy >= PH) continue
    }
    const { fw, fh } = fxSize(f.kind, FX_MINI)
    const x = Math.max(0, Math.min(MINI - fw, move.dx + Math.floor(wx / 2)))
    const y = Math.max(0, Math.min(MINI - fh, move.dy + Math.floor(wy / 2)))
    stampFxMini(px, f.kind, x, y, f.color ?? art.accent, OUTLINE, f.ring === true)
  }
  return px
}

export function drawMood(art: MemberArt, mood: Mood, frame: number, view: View): Pixels {
  return drawScene(art, sceneAt(art, mood, frame), view)
}
