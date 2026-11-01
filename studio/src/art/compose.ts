// Pixel compositing: poses resolved from their patches, overlays and effects
// stamped onto a canvas of colors, then squashed, melted, moved, cropped or
// halved. Pure functions over plain arrays, so the Remotion compositions, the
// contact sheets, the checks and the studio's node scripts share them.

import { FONT, FX, FX_INKS, FX_MINI, outlined } from './fx'
import type { FxKind } from './fx'
import { paletteClashes } from './parts'
import type { AnyPose, FaceName, FeastFace, Grid, HeadOffset, MemberArt, MemberId, Palette, Patch, PoseDef, PoseName, SeatPose, SeatPoseDef } from './types'
import { FEAST_H, FEAST_Y, H, MINI, PH, PW, SLIME_H, SLIME_W, W } from './types'

/** A canvas: `[y][x]`, a `#rrggbb` color or null for transparent. */
export type Pixels = (string | null)[][]

/** The near-black outline the effects are drawn with: the reference's own `o`. */
export const OUTLINE = '#2e222e'

/** Every pose, in the order the sheets show them. */
export const POSES: readonly PoseName[] = ['stand', 'playA', 'playB', 'crouch', 'cheer', 'panic', 'box']

/** The poses that carry the head, face overlay and all (every one but the box). */
export const HEAD_POSES: readonly PoseName[] = ['stand', 'playA', 'playB', 'crouch', 'cheer', 'panic']

/** The poses the sway overlays are drawn for (the hair is the same in all three). */
export const SWAY_POSES: readonly PoseName[] = ['stand', 'playA', 'playB']

/** The seat poses (MemberArt.feast), in the order the sheets show them. Each carries stand's head, face box and all. */
export const SEAT_POSES: readonly SeatPose[] = ['seat', 'seatPot', 'seatBowl', 'seatUp', 'seatPanic', 'seatPoint', 'seatLadle', 'seatPhone', 'seatSlump']

/** Who sits where and holds what: the seat poses each member has, and her edge of the table (checkArt holds her feast to both). */
export const FEAST_POSES: Readonly<Record<MemberId, readonly SeatPose[]>> = {
  bocchi: ['seat', 'seatPot', 'seatBowl', 'seatUp', 'seatPanic'],
  nijika: ['seat', 'seatPot', 'seatBowl', 'seatUp', 'seatLadle', 'seatSlump'],
  ryo: ['seat', 'seatPot', 'seatBowl', 'seatUp', 'seatPoint'],
  kita: ['seat', 'seatPot', 'seatBowl', 'seatUp', 'seatPhone', 'seatSlump'],
}
export const FEAST_SIDE: Readonly<Record<MemberId, 'left' | 'right'>> = { bocchi: 'left', nijika: 'left', ryo: 'right', kita: 'right' }

/** The seat poses that hold something with a point that acts (`tips`): the chopsticks' tips, the ladle's cup, the phone's lens. */
export const TIPPED_SEATS: readonly SeatPose[] = ['seatPot', 'seatBowl', 'seatUp', 'seatPoint', 'seatLadle', 'seatPhone']

/** The feast faces, and the face each pot-look face moves the eyes of (`bite` keeps idle's eyes). */
export const FEAST_FACES: readonly FeastFace[] = ['idlePot', 'halfPot', 'focusPot', 'bite']
export const POT_LOOK_OF: Readonly<Record<'idlePot' | 'halfPot' | 'focusPot', FaceName>> = { idlePot: 'idle', halfPot: 'half', focusPot: 'focus' }

export function isSeatPose(name: string): name is SeatPose {
  return (SEAT_POSES as readonly string[]).includes(name)
}

export function blank(w = W, h = H): Pixels {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => null as string | null))
}

export function clone(px: Pixels): Pixels {
  return px.map(row => row.slice())
}

/**
 * Draws `grid` at (x, y): each character through `palette`; `.` (and a space)
 * left alone, `_` erasing the pixel beneath back to transparent.
 */
export function stamp(px: Pixels, grid: Grid, palette: Palette, x: number, y: number, flipX = false): Pixels {
  const h = px.length
  const w = px[0]?.length ?? 0
  grid.forEach((row, gy) => {
    const chars = [...row]
    chars.forEach((ch, gx) => {
      if (ch === '.' || ch === ' ') return
      const tx = x + (flipX ? chars.length - 1 - gx : gx)
      const ty = y + gy
      if (tx < 0 || ty < 0 || tx >= w || ty >= h) return
      if (ch === '_') {
        ;(px[ty] as (string | null)[])[tx] = null
        return
      }
      const color = palette[ch]
      if (color === undefined) return
      ;(px[ty] as (string | null)[])[tx] = color
    })
  })
  return px
}

/** A grid's size: its widest row and its rows. */
export function gridSize(grid: Grid): { w: number; h: number } {
  return { w: Math.max(0, ...grid.map(r => [...r].length)), h: grid.length }
}

// ---- Poses -------------------------------------------------------------------------

export function isPatched(def: PoseDef | SeatPoseDef): def is { from: PoseName; patches: readonly Patch[] } | SeatPoseDef {
  return !Array.isArray(def)
}

/** A pose's definition: the stage's in `poses`, a seat pose's in `feast.poses`. */
function poseDef(art: MemberArt, name: AnyPose): PoseDef | SeatPoseDef | undefined {
  return isSeatPose(name) ? art.feast?.poses[name] : (art.poses[name] as PoseDef | undefined)
}

/** Lays a patch over rows of characters: `.` keeps, `_` erases to `.`, anything else replaces. Clipped to the rows. */
function overlayChars(rows: string[][], patch: Patch): void {
  patch.grid.forEach((row, gy) => {
    const target = rows[patch.y + gy]
    if (target === undefined) return
    ;[...row].forEach((ch, gx) => {
      const tx = patch.x + gx
      if (ch === '.' || ch === ' ' || tx < 0 || tx >= target.length) return
      target[tx] = ch === '_' ? '.' : ch
    })
  })
}

const resolved = new WeakMap<MemberArt, Map<AnyPose, Grid>>()

/**
 * A pose as a full 96x96 grid: a grid pose as drawn (padded or cut to the
 * canvas), a patched pose (a seat pose always is) as its `from` with each
 * patch laid over in order. Memoised per member. Throws on a missing pose or
 * a `from` cycle (`checkArt` reports both as problems).
 */
export function resolvePose(art: MemberArt, name: AnyPose): Grid {
  let memo = resolved.get(art)
  if (memo === undefined) {
    memo = new Map()
    resolved.set(art, memo)
  }
  const hit = memo.get(name)
  if (hit !== undefined) return hit
  const grid = resolveChain(art, name, [])
  memo.set(name, grid)
  return grid
}

function resolveChain(art: MemberArt, name: AnyPose, chain: readonly AnyPose[]): Grid {
  if (chain.includes(name)) throw new Error(`pose cycle: ${[...chain, name].join(' -> ')}`)
  const def = poseDef(art, name)
  if (def === undefined) throw new Error(`pose ${name} is missing`)
  if (!isPatched(def)) {
    return Array.from({ length: H }, (_, y) => {
      const row = [...(def[y] ?? '')].slice(0, W)
      return row.join('') + '.'.repeat(W - row.length)
    })
  }
  const base = resolveChain(art, def.from, [...chain, name])
  const rows = base.map(r => [...r])
  for (const patch of def.patches) overlayChars(rows, patch)
  return rows.map(r => r.join(''))
}

/** Where a pose carries the head, from stand's: `heads[pose]`, 0 for the box (it has its own window) and the seat poses (stand's head untouched). */
export function headOffset(art: MemberArt, pose: AnyPose): HeadOffset {
  if (pose === 'box' || isSeatPose(pose)) return { dx: 0, dy: 0 }
  return art.heads?.[pose] ?? { dx: 0, dy: 0 }
}

// ---- Effects and text -------------------------------------------------------------

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex(r: number, g: number, b: number): string {
  return `#${((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).padStart(6, '0')}`
}

/** Perceived brightness, 0-255. */
export function luma(hex: string): number {
  const [r, g, b] = channels(hex)
  return r * 0.299 + g * 0.587 + b * 0.114
}

/** The highlight of an effect's color: a lighter, slightly warmer tint (the light comes from the upper right). */
export function highlight(color: string): string {
  const [r, g, b] = channels(color)
  const mix = (c: number, to: number) => c + (to - c) * 0.55
  return toHex(mix(r, 255), mix(g, 250), mix(b, 236))
}

/** An effect: its shape in `color`, its highlight a lighter tint of it, its outline (`outline`, the near-black by default), its own inks (FX_INKS). */
export function stampFx(px: Pixels, kind: FxKind, x: number, y: number, color: string, outline = OUTLINE): Pixels {
  return stamp(px, FX[kind], { x: color, o: outline, h: highlight(color), ...FX_INKS[kind] }, x, y)
}

/** An effect at the minis' size (FX_MINI, v1's grids): its shape in `color`, `o` the outline, its own inks. */
export function stampFxMini(px: Pixels, kind: FxKind, x: number, y: number, color: string, outline = OUTLINE, ring = false): Pixels {
  // With `ring`, inside a 1-pixel ring of the outline (cut at the canvas' edge), for one laid over her hair.
  return ring ? stamp(px, outlined(FX_MINI[kind]), { x: color, o: outline, ...FX_INKS[kind] }, x - 1, y - 1) : stamp(px, FX_MINI[kind], { x: color, o: outline, ...FX_INKS[kind] }, x, y)
}

/** How wide a word is in the 3x5 font at a scale (one blank column of the scale between letters). */
export function textWidth(text: string, scale = 1): number {
  let w = 0
  for (const ch of text.toUpperCase()) w += ((FONT[ch] ?? FONT[' '])?.[0]?.length ?? 3) + 1
  return Math.max(0, w - 1) * scale
}

/** A word in the 3x5 pixel font, each font pixel `scale` x `scale`, one column of the scale between letters. Returns the width drawn. */
export function stampText(px: Pixels, text: string, x: number, y: number, color: string, scale = 1): number {
  const s = Math.max(1, Math.round(scale))
  let at = x
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT[' ']
    if (glyph === undefined) continue
    const big = s === 1 ? glyph : glyph.flatMap(row => Array.from({ length: s }, () => [...row].map(c => c.repeat(s)).join('')))
    stamp(px, big, { x: color }, at, y)
    at += ((glyph[0]?.length ?? 3) + 1) * s
  }
  return Math.max(0, at - x - s)
}

// ---- Moves --------------------------------------------------------------------------

/** The canvas moved by (dx, dy); what leaves the edge is gone. */
export function shift(px: Pixels, dx: number, dy: number): Pixels {
  if (dx === 0 && dy === 0) return px
  const h = px.length
  const w = px[0]?.length ?? 0
  const out = blank(w, h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const c = (px[y] as (string | null)[])[x] ?? null
      if (c === null) continue
      const tx = x + dx
      const ty = y + dy
      if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue
      ;(out[ty] as (string | null)[])[tx] = c
    }
  }
  return out
}

/**
 * A breath or a bob: every row above `bend` moves down `n` rows, the rows at
 * and below it stay planted. Where the moved rows land on the planted ones,
 * a moved pixel overwrites and a transparent one does not.
 */
export function squash(px: Pixels, bend: number, n: number): Pixels {
  if (n <= 0) return px
  const h = px.length
  const w = px[0]?.length ?? 0
  const out = clone(px)
  const top = Math.max(0, Math.min(bend, h))
  for (let y = 0; y < top; y += 1) out[y] = Array.from({ length: w }, () => null as string | null)
  for (let y = 0; y < top; y += 1) {
    const ty = y + n
    if (ty >= h) continue
    const src = px[y] as (string | null)[]
    const dst = out[ty] as (string | null)[]
    for (let x = 0; x < w; x += 1) {
      const c = src[x] ?? null
      if (c !== null) dst[x] = c
    }
  }
  return out
}

/**
 * A blob's squash (`n` rows) or stretch (`-n` rows), for the slimes, which
 * have no bend row: the canvas's rows scaled about its bottom row, which stays
 * planted. The rows that give are the plainest: each step drops (or doubles)
 * the drawn row most like the one below it, the lowest of equals, so the belly
 * takes it while the face, the outline and the feet hold. The rows above it
 * move down (or up); a stretch past the top edge loses what leaves it. The
 * drawing's own top and bottom rows never give.
 */
export function scaleRows(px: Pixels, n: number): Pixels {
  if (n === 0) return px
  const w = px[0]?.length ?? 0
  const out = clone(px)
  for (let k = 0; k < Math.abs(n); k += 1) {
    const b = bounds(out)
    if (b === null || b.maxY - b.minY < 2) break
    let give = -1
    let least = Infinity
    for (let y = b.minY + 1; y < b.maxY; y += 1) {
      const row = out[y] as (string | null)[]
      const below = out[y + 1] as (string | null)[]
      let d = 0
      for (let x = 0; x < w; x += 1) if (row[x] !== below[x]) d += 1
      if (d <= least) {
        least = d
        give = y
      }
    }
    if (n > 0) {
      for (let y = give; y > 0; y -= 1) out[y] = out[y - 1] as (string | null)[]
      out[0] = Array.from({ length: w }, () => null as string | null)
    } else {
      for (let y = 0; y < give; y += 1) out[y] = (out[y + 1] as (string | null)[]).slice()
    }
  }
  return out
}

/** A window of the canvas; outside it is transparent. */
export function crop(px: Pixels, x: number, y: number, w = PW, h = PH): Pixels {
  const out = blank(w, h)
  for (let cy = 0; cy < h; cy += 1) {
    for (let cx = 0; cx < w; cx += 1) {
      const c = px[y + cy]?.[x + cx] ?? null
      ;(out[cy] as (string | null)[])[cx] = c
    }
  }
  return out
}

/** The rows and columns that hold anything. */
export function bounds(px: Pixels): { minX: number; maxX: number; minY: number; maxY: number } | null {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  px.forEach((row, y) =>
    row.forEach((c, x) => {
      if (c === null) return
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }),
  )
  return minY === Infinity ? null : { minX, maxX, minY, maxY }
}

/** Below this brightness a color is a line (an outline, an eye's lid, a pupil): see `downscale2`. */
export const LINE_LUMA = 70

/** How far a color must stand out from its block's main color to be kept as a detail (an iris, a clip, a mouth): see `downscale2`. */
export const DETAIL_CONTRAST = 50

/**
 * How much two colors differ, hue first: the red-green and yellow-blue
 * differences in full, the brightness difference at half. A shade of the same
 * material (hair and its shadow, skin and its shade) scores low; an iris on
 * skin, a clip on hair or a mouth on skin scores high.
 */
export function contrast(a: string, b: string): number {
  const [r1, g1, b1] = channels(a)
  const [r2, g2, b2] = channels(b)
  const rg = r1 - g1 - (r2 - g2)
  const yb = (r1 + g1) / 2 - b1 - ((r2 + g2) / 2 - b2)
  const l = (luma(a) - luma(b)) / 2
  return Math.sqrt(rg * rg + yb * yb + l * l)
}

/**
 * Halves a canvas for the minis, outline-aware: each 2x2 block becomes one
 * pixel, decided from that block alone (so a mini pixel changes only when
 * its block does: no flicker from a change elsewhere in the picture), in
 * this order:
 *
 *   1. transparent when three or four of its pixels are;
 *   2. a line color (brightness under LINE_LUMA, the darkest such) when it
 *      covers two of the four, or when the block is on the silhouette's edge
 *      (it holds a transparent pixel): outlines and lids survive, while a lone
 *      dark pixel (a strand, a pupil's corner) does not blot out its block;
 *   3. when the block's most common color has fewer than three, the color
 *      that stands out most from it (`contrast` at least DETAIL_CONTRAST):
 *      the iris, the clips and the mouth survive the halving, while a shade
 *      of the same material does not take over;
 *   4. else the most common color, a tie going to the darker.
 *
 * The window's parity still matters: put a portrait window where the eyes'
 * lid row starts a block (an even row of the window).
 */
export function downscale2(px: Pixels): Pixels {
  const h = px.length
  const w = px[0]?.length ?? 0
  const out = blank(Math.ceil(w / 2), Math.ceil(h / 2))
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const block = [px[y]?.[x], px[y]?.[x + 1], px[y + 1]?.[x], px[y + 1]?.[x + 1]].map(c => c ?? null)
      const opaque = block.filter((c): c is string => c !== null)
      if (opaque.length <= 1) continue
      const counts = new Map<string, number>()
      for (const c of opaque) counts.set(c, (counts.get(c) ?? 0) + 1)
      // The most common color, a tie to the darker.
      let pick = opaque[0] as string
      let best = -1
      for (const [c, n] of counts) {
        if (n > best || (n === best && luma(c) < luma(pick))) {
          best = n
          pick = c
        }
      }
      // The strongest line: the most pixels, then the darkest.
      let line: string | null = null
      for (const [c, n] of counts) {
        if (luma(c) >= LINE_LUMA) continue
        if (line === null || n > (counts.get(line) ?? 0) || (n === counts.get(line) && luma(c) < luma(line))) line = c
      }
      const edge = opaque.length < 4
      if (line !== null && ((counts.get(line) ?? 0) >= 2 || edge)) pick = line
      else if (best < 3) {
        // The detail: the color that stands out most from the main one, a tie to the darker.
        let detail: string | null = null
        let most = DETAIL_CONTRAST
        for (const c of counts.keys()) {
          if (c === pick) continue
          const k = contrast(c, pick)
          if (k > most || (k === most && (detail === null || luma(c) < luma(detail)))) {
            most = k
            detail = c
          }
        }
        if (detail !== null) pick = detail
      }
      ;(out[y / 2] as (string | null)[])[x / 2] = pick
    }
  }
  return out
}

/** A small stable hash, so drips fall in the same places every loop. */
function hash(n: number): number {
  let h = (n + 1) * 2654435761
  h ^= h >>> 13
  h = Math.imul(h, 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** A pixel mask over a canvas, `[y][x]`. */
export type Mask = readonly (readonly boolean[])[]

/**
 * Which pixels of a figure are its instrument, for the melt: every pixel in
 * one of the instrument's own colors (`own`: Bocchi's gold binding and
 * strings, Ryo's white body and mint guard, Kita's Pelham Blue, Nijika's stick
 * wood), every pixel in a color it shares with her (`shared`: Bocchi's
 * grey-purple, also her skirt; a glint, also in her eyes; Ryo's pickup black,
 * also her hair pins) joined to those (4-connected, through the own and the
 * shared colors only: never through the outline, which joins everything), and
 * the outline pixels (OUTLINE) that touch them. A shared color on her (the
 * skirt, the eyes, the pins) stays hers wherever the instrument's outline
 * stands between them.
 */
export function solidMask(px: Pixels, own: Iterable<string>, shared: Iterable<string>): boolean[][] {
  const h = px.length
  const w = px[0]?.length ?? 0
  const ownSet = new Set([...own].map(c => c.toLowerCase()))
  const sharedSet = new Set([...shared].map(c => c.toLowerCase()))
  const color = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? null : ((px[y] as (string | null)[])[x] ?? null)?.toLowerCase() ?? null)
  const mask = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => ownSet.has(color(x, y) ?? '')))
  const queue: [number, number][] = []
  mask.forEach((row, y) => row.forEach((m, x) => m && queue.push([x, y])))
  const sides = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const
  for (let q = queue.pop(); q !== undefined; q = queue.pop()) {
    for (const [dx, dy] of sides) {
      const nx = q[0] + dx
      const ny = q[1] + dy
      const c = color(nx, ny)
      if (c === null || !sharedSet.has(c) || (mask[ny] as boolean[])[nx]) continue
      ;(mask[ny] as boolean[])[nx] = true
      queue.push([nx, ny])
    }
  }
  // Its outline goes with it (so no line of it is left hanging across her when it slips away): the line that
  // touches it, then the line beyond that touches nothing of hers (a doubled tip, a tuner's peg).
  const ink = OUTLINE.toLowerCase()
  const isLine = (x: number, y: number) => color(x, y) === ink
  const touches = (x: number, y: number) => sides.some(([dx, dy]) => mask[y + dy]?.[x + dx] === true)
  const hers = (x: number, y: number) => sides.some(([dx, dy]) => color(x + dx, y + dy) !== null && !isLine(x + dx, y + dy) && mask[y + dy]?.[x + dx] !== true)
  const first = mask.map((row, y) => row.map((m, x) => !m && isLine(x, y) && touches(x, y)))
  first.forEach((row, y) => row.forEach((e, x) => e && ((mask[y] as boolean[])[x] = true)))
  for (let grew = true; grew; ) {
    grew = false
    mask.forEach((row, y) =>
      row.forEach((m, x) => {
        if (m || !isLine(x, y) || !touches(x, y) || hers(x, y)) return
        row[x] = true
        grew = true
      }),
    )
  }
  return mask
}

/**
 * What a melt knows of a member (scene.ts gives it, from her palette):
 *   solid   her instrument's pixels on the canvas being melted (`solidMask`): they never drip, and the
 *           instrument slips down out of her hands as she goes and sinks into the puddle, under it by the end
 *   keep    a row of that canvas (the bottom of her face) the puddle never rises over, so her face stays
 *           above it; the row below the canvas' foot when absent
 *   line, top, light, body, shade
 *           the puddle's colors: its outline (her hair's line), its top (her hair) and the highlight along it,
 *           her clothing beneath, the shade along the floor
 */
export type MeltInk = { solid?: Mask; keep?: number; line: string; top: string; light: string; body: string; shade: string }

/**
 * Melts a figure: `t` 0 is whole, 1 a puddle. The figure sinks toward its
 * feet (rows dropped evenly, nearest neighbour, so the outline holds) to
 * about a quarter of its height, her head (down to `ink.keep`, the foot of
 * her face) sinking less than her body (to ~55%, so her face still reads),
 * into a puddle that grows under her: from a film of her hair's color under
 * her to a soft dome around her feet (up to ~14 pixels past each, up to ~13
 * rows high in the middle but never over her face), outlined where it meets
 * the air, her hair's color along its top with a highlight on the right (the
 * light comes from the upper right), her clothing beneath, a shade and the
 * outline along the floor. Where she stands in it she runs into it unlined.
 * Drips two pixels wide (about every third pair of columns) run off her
 * overhangs in her hair, skin and clothing colors, the outline opening where
 * they leave it and closing at their tips; the outline and the instrument
 * never drip. The instrument (`ink.solid`) does not melt: whole, it rides
 * down with her hands, slips from them (slowly at first) and sinks into the
 * puddle, under the floor at 1; where it lay over her she is left as the
 * same goo as the puddle's body. `scale` sizes it all for a smaller picture:
 * 0.5 for a 16x16 mini (a puddle up to ~7 past each side, at least two rows
 * under her face, drips one pixel wide and up to ~6 long).
 *
 * Without `ink` the puddle takes the figure's own most common color under
 * the outline (OUTLINE), and nothing is held back as an instrument.
 *
 * Returns the canvas and how far a row at `trackY` sank, so a portrait
 * window can follow the face down.
 */
export function melt(px: Pixels, t: number, trackY = 32, scale = 1, ink?: MeltInk): { px: Pixels; sank: number } {
  const b = bounds(px)
  if (b === null || t <= 0) return { px, sank: 0 }
  const h = px.length
  const w = px[0]?.length ?? 0
  const colors = ink ?? plainInk(px)
  const solid = ink?.solid
  const tall = b.maxY - b.minY + 1
  // Her head (to the bottom of her face, `keep`) sinks less than her body, so her face still reads in the puddle.
  const keep = ink?.keep !== undefined && ink.keep > b.minY && ink.keep < b.maxY ? ink.keep : null
  const headH = keep === null ? tall : keep - b.minY + 1
  const bodyH = tall - headH
  let newTall = Math.max(Math.max(2, Math.round(8 * scale)), Math.round(tall * (1 - 0.72 * t)))
  let newHead = 0
  let newBody = newTall
  if (keep !== null) {
    // Room under her face for the puddle; never taller than she was (no row drawn twice).
    newHead = Math.max(1, Math.round(headH * (1 - 0.45 * t)))
    newTall = Math.min(tall, Math.max(newTall, newHead + Math.max(2, Math.round(5 * scale))))
    newBody = Math.max(1, Math.min(bodyH, newTall - newHead))
    newHead = newTall - newBody
  }
  const top = b.maxY - newTall + 1
  /** The row of the figure that lands on row `top + r`. */
  const source = (r: number) => (keep === null ? b.minY + Math.floor((r * tall) / newTall) : r < newHead ? b.minY + Math.floor((r * headH) / newHead) : keep + 1 + Math.floor(((r - newHead) * bodyH) / newBody))
  /** Where a row of the figure lands. */
  const landing = (y: number) => (keep === null ? top + Math.floor(((y - b.minY) * newTall) / tall) : y <= keep ? top + Math.floor(((y - b.minY) * newHead) / headH) : top + newHead + Math.floor(((y - keep - 1) * newBody) / bodyH))
  const get = (c: Pixels, x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? null : ((c[y] as (string | null)[])[x] ?? null))
  const put = (c: Pixels, x: number, y: number, v: string | null) => {
    if (x >= 0 && y >= 0 && x < w && y < h) (c[y] as (string | null)[])[x] = v
  }

  // She sinks: her rows dropped toward her feet, the instrument's pixels left out (it does not melt).
  const out = blank(w, h)
  const gone = blank(w, h)
  for (let r = 0; r < newTall; r += 1) {
    const src = source(r)
    ;(px[src] as (string | null)[]).forEach((c, x) => {
      if (c !== null) put(solid?.[src]?.[x] ? gone : out, x, top + r, c)
    })
  }
  // Where the instrument lay over her she is goo (the puddle's body): wherever she is close on both sides of it.
  const near = Math.round(12 * scale)
  const hersAt = (x: number, y: number, dx: number, dy: number) => {
    for (let k = 1; k <= near; k += 1) if (get(out, x + dx * k, y + dy * k) !== null) return true
    return false
  }
  const goo: [number, number][] = []
  gone.forEach((row, y) =>
    row.forEach((c, x) => {
      if (c !== null && get(out, x, y) === null && ((hersAt(x, y, -1, 0) && hersAt(x, y, 1, 0)) || (hersAt(x, y, 0, -1) && hersAt(x, y, 0, 1)))) goo.push([x, y])
    }),
  )
  for (const [x, y] of goo) put(out, x, y, colors.body)
  // Drips off her overhangs, in her own colors: under an outline the color inside it runs, through it.
  const runny = (c: string | null): c is string => c !== null && luma(c) >= LINE_LUMA
  const drips = blank(w, h)
  const dripW = Math.max(1, Math.round(2 * scale))
  for (let x = 0; x < w; x += 1) {
    const hv = hash(Math.floor(x / dripW))
    if (hv < 0.66) continue
    const len = Math.round(t * 12 * scale * hv)
    if (len < 2) continue
    for (let y = 1; y < b.maxY; y += 1) {
      const c = get(out, x, y)
      if (c === null || get(out, x, y + 1) !== null) continue
      const inside = get(out, x, y - 1)
      const run = runny(c) ? c : runny(inside) ? inside : null
      if (run === null) continue
      if (run !== c) put(drips, x, y, run)
      let k = 1
      while (k <= len && y + k <= b.maxY && get(out, x, y + k) === null) {
        put(drips, x, y + k, k === len && run !== c ? c : run)
        k += 1
      }
    }
  }
  drips.forEach((row, y) =>
    row.forEach((c, x) => {
      if (c !== null) put(out, x, y, c)
    }),
  )
  // The instrument does not melt: whole, it rides down with her hands (its middle row where hers lands), then
  // slips from them, slowly at first, into the puddle: below the floor (gone) at 1.
  if (solid !== undefined) {
    let sum = 0
    let n = 0
    let first = -1
    solid.forEach((row, y) =>
      row.forEach((m, x) => {
        if (!m || get(px, x, y) === null) return
        sum += y
        n += 1
        if (first < 0) first = y
      }),
    )
    if (n > 0) {
      const mid = Math.round(sum / n)
      const ride = landing(mid) - mid
      const drop = ride + Math.round(t ** 3 * Math.max(0, b.maxY + 1 - first - ride))
      solid.forEach((row, y) =>
        row.forEach((m, x) => {
          const c = m ? get(px, x, y) : null
          if (c !== null && y + drop <= b.maxY) put(out, x, y + drop, c)
        }),
      )
    }
  }

  // The puddle: a dome around her feet, from a pool under her to past her stance.
  let fl = Infinity
  let fr = -Infinity
  for (let y = b.maxY - Math.round(2 * scale); y <= b.maxY; y += 1) {
    ;(out[y] as (string | null)[]).forEach((c, x) => {
      if (c === null) return
      fl = Math.min(fl, x)
      fr = Math.max(fr, x)
    })
  }
  if (fl > fr) fl = fr = Math.round((b.minX + b.maxX) / 2)
  const cx = (fl + fr) / 2
  const hw = ((fr - fl) / 2 + 1) * Math.min(1, 0.3 + t) + Math.round(14 * scale * t)
  const roof = keep === null ? b.minY : landing(keep) + 1
  const high = Math.max(1, Math.min(b.maxY - roof + 1, Math.round(13 * scale * t ** 1.2)))
  const depth = new Map<number, number>()
  for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x += 1) {
    if (x < 0 || x >= w) continue
    const u = (x - cx) / hw
    depth.set(x, Math.max(1, Math.round(high * Math.sqrt(Math.max(0, 1 - u * u)))))
  }
  const inPuddle = (x: number, y: number) => y <= b.maxY && y > b.maxY - (depth.get(x) ?? 0)
  const under = clone(out)
  for (const [x, d] of depth) {
    const surface = b.maxY - d + 1
    const u = (x - cx) / hw
    for (let y = surface; y <= b.maxY; y += 1) {
      const k = y - surface
      // Outlined where it meets the air (above or beside), and along the floor; unlined where she stands in it.
      // A film (the first rows of it) is her hair's color over the floor's line, outlined at its ends only.
      const open = (dx: number, dy: number) => !inPuddle(x + dx, y + dy) && get(under, x + dx, y + dy) === null
      const side = open(-1, 0) || open(1, 0)
      let c: string
      if (high <= 2) c = side || (y === b.maxY && high === 2) ? colors.line : colors.top
      else if (side || open(0, -1) || y === b.maxY) c = colors.line
      else if (y === b.maxY - 1 && d >= 4) c = colors.shade
      else if (k === 1 && u > 0.15 && u < 0.6) c = colors.light
      else if (k <= 2 + Math.round(1.5 * (1 - u * u))) c = colors.top
      else c = colors.body
      put(out, x, y, c)
    }
  }
  const tracked = Math.max(top, Math.min(b.maxY, landing(Math.max(b.minY, Math.min(b.maxY, trackY)))))
  return { px: out, sank: tracked - trackY }
}

/** A puddle's colors when no member's are given: the figure's most common color under the near-black outline. */
function plainInk(px: Pixels): MeltInk {
  const counts = new Map<string, number>()
  for (const row of px) for (const c of row) if (c !== null && luma(c) >= LINE_LUMA) counts.set(c, (counts.get(c) ?? 0) + 1)
  const main = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? OUTLINE
  return { line: OUTLINE, top: main, light: main, body: main, shade: main }
}

// ---- Checking --------------------------------------------------------------------

/** Never a palette key: transparent, erase, the export's repeat mark, run digits, and what a TS string would need escaped. */
const RESERVED = /^[._=0-9'"\\` ]$/

/**
 * Problems with a member's art, as sentences: palette keys and colors, grids
 * of the wrong size or with characters missing from the palette, `_` where it
 * means nothing, patches off the canvas, `from` cycles, a face region that
 * differs between the poses, windows that miss the face or the peeking eyes,
 * sway overlays that do not fit stand, playA and playB, a palette key two
 * part files define with different colors, a mini rig that is not 16x16 or
 * whose overlays run off it, stick tips off the canvas, a slime grid that
 * does not fit its canvas below the bounce's row, slime faces (Bocchi's
 * awake and content) that differ outside their face region, and whatever is
 * wrong with her seats at the hotpot table (checkFeast).
 */
export function checkArt(art: MemberArt): string[] {
  const problems: string[] = []
  for (const [ch, color] of Object.entries(art.palette)) {
    if ([...ch].length !== 1) problems.push(`palette key "${ch}" is not one character`)
    else if (RESERVED.test(ch)) problems.push(`palette key "${ch}" is reserved (not . _ = a digit, a quote, a backslash or a backtick)`)
    if (!/^#[0-9a-f]{6}$/i.test(color)) problems.push(`palette "${ch}" is not #rrggbb: ${color}`)
  }
  if (art.colorSources !== undefined) problems.push(...paletteClashes(art.colorSources))
  const known = new Set(Object.keys(art.palette))

  /** Row widths and characters; `_` only where `erase` (overlays and patches). */
  const checkChars = (label: string, grid: Grid, erase: boolean) => {
    const bad = new Map<string, number>()
    grid.forEach((row, y) => {
      for (const ch of row) {
        if (ch === '.' || known.has(ch) || (erase && ch === '_')) continue
        if (!bad.has(ch)) bad.set(ch, y)
      }
    })
    for (const [ch, y] of bad) problems.push(ch === '_' ? `${label} row ${y}: "_" (erase) only means something in a patch or an overlay` : `${label} row ${y}: "${ch}" is not in the palette`)
    const widths = new Set(grid.map(r => [...r].length))
    if (widths.size > 1) problems.push(`${label}: rows of different widths (${[...widths].join(', ')})`)
  }
  const inCanvas = (label: string, x: number, y: number, grid: Grid) => {
    const { w, h } = gridSize(grid)
    if (x < 0 || y < 0 || x + w > W || y + h > H) problems.push(`${label}: ${w}x${h} at ${x},${y} runs off the ${W}x${H} canvas`)
  }

  const resolvedPoses = new Map<PoseName, Grid>()
  for (const name of POSES) {
    const def = art.poses[name] as PoseDef | undefined
    if (def === undefined) {
      problems.push(`pose ${name} is missing`)
      continue
    }
    if (isPatched(def)) {
      if (!POSES.includes(def.from)) problems.push(`pose ${name}: from "${def.from}" is not a pose`)
      def.patches.forEach((p, i) => {
        checkChars(`pose ${name} patch ${i}`, p.grid, true)
        inCanvas(`pose ${name} patch ${i}`, p.x, p.y, p.grid)
      })
    } else {
      checkChars(`pose ${name}`, def, false)
      if (def.length !== H) problems.push(`pose ${name}: ${def.length} rows, wants ${H}`)
      const wrong = def.map((r, y) => [y, [...r].length] as const).filter(([, n]) => n !== W)
      if (wrong.length > 0) problems.push(`pose ${name}: ${wrong.length} rows not ${W} wide (row ${wrong[0]?.[0]} is ${wrong[0]?.[1]})`)
    }
    try {
      resolvedPoses.set(name, resolvePose(art, name))
    } catch (e) {
      problems.push(`pose ${name}: ${(e as Error).message}`)
    }
  }

  for (const [name, grid] of Object.entries(art.face.grids)) checkChars(`face ${name}`, grid, true)
  for (const [name, grid] of Object.entries(art.peek.grids)) checkChars(`peek ${name}`, grid, true)
  for (const [name, grid] of Object.entries(art.extras ?? {})) checkChars(`extra ${name}`, grid, false)
  for (const [pose, at] of Object.entries(art.tips ?? {})) {
    if (at !== undefined && (at.x < 0 || at.y < 0 || at.x >= W || at.y >= H)) problems.push(`tips.${pose}: ${at.x},${at.y} is off the ${W}x${H} canvas`)
  }

  // The mini rig: 16x16 bases, overlays inside them.
  if (art.mini !== undefined) {
    const mini = art.mini
    for (const [label, grid] of [['mini stand', mini.stand], ['mini box', mini.box]] as const) {
      checkChars(label, grid, false)
      if (grid.length !== MINI) problems.push(`${label}: ${grid.length} rows, wants ${MINI}`)
      const wrong = grid.map((r, y) => [y, [...r].length] as const).filter(([, n]) => n !== MINI)
      if (wrong.length > 0) problems.push(`${label}: ${wrong.length} rows not ${MINI} wide (row ${wrong[0]?.[0]} is ${wrong[0]?.[1]})`)
    }
    for (const [label, ov] of [['mini face', mini.face], ['mini peek', mini.peek]] as const) {
      for (const [name, grid] of Object.entries(ov.grids) as [string, Grid][]) {
        checkChars(`${label} ${name}`, grid, true)
        const { w, h } = gridSize(grid)
        if (ov.x < 0 || ov.y < 0 || ov.x + w > MINI || ov.y + h > MINI) problems.push(`${label} ${name}: ${w}x${h} at ${ov.x},${ov.y} runs off the ${MINI}x${MINI} mini`)
      }
    }
  }
  // The slime: whole grids on the slime canvas with its top row left for the bounce, Bocchi's two faces one body.
  if (art.slime !== undefined) {
    const { content, awake, face } = art.slime
    const grids: [string, Grid][] = awake === undefined ? [['slime content', content]] : [['slime content', content], ['slime awake', awake]]
    for (const [label, grid] of grids) {
      checkChars(label, grid, false)
      const { w, h } = gridSize(grid)
      if (w === 0 || h === 0) problems.push(`${label}: empty`)
      else if (w > SLIME_W || h > SLIME_H - 1) problems.push(`${label}: ${w}x${h} does not fit the ${SLIME_W}x${SLIME_H} slime canvas below its top row (the bounce's)`)
    }
    if (awake !== undefined && face === undefined) problems.push('slime awake: no face region says where it may differ from content')
    if (awake !== undefined && face !== undefined) {
      const a = gridSize(awake)
      const c = gridSize(content)
      if (face.x < 0 || face.y < 0 || face.w < 1 || face.h < 1 || face.x + face.w > c.w || face.y + face.h > c.h) problems.push(`slime face: ${face.w}x${face.h} at ${face.x},${face.y} is not inside the ${c.w}x${c.h} grid`)
      if (a.w !== c.w || a.h !== c.h) {
        problems.push(`slime awake: ${a.w}x${a.h} where content is ${c.w}x${c.h}, so they are not one body`)
      } else {
        let diff = 0
        let first = ''
        content.forEach((row, y) =>
          [...row].forEach((ch, x) => {
            if (ch === [...(awake[y] ?? '')][x] || (x >= face.x && x < face.x + face.w && y >= face.y && y < face.y + face.h)) return
            diff += 1
            if (first === '') first = ` (first at ${x},${y})`
          }),
        )
        if (diff > 0) problems.push(`slime awake: differs from content in ${diff} pixels outside the face region (${face.w}x${face.h} at ${face.x},${face.y})${first}, so they are not one body`)
      }
    }
  }
  if (!Number.isInteger(art.bend) || art.bend < 1 || art.bend >= H) problems.push(`bend ${art.bend} is not a row inside the canvas`)
  for (const [label, at] of [['head', art.head], ['boxHead', art.boxHead]] as const) {
    if (at.x < 0 || at.y < 0 || at.x + PW > W || at.y + PH > H) problems.push(`${label}: the ${PW}x${PH} window at ${at.x},${at.y} runs off the canvas`)
  }

  // One face overlay fits every pose but the box: the pixels under it must be the same in each, at the pose's head offset.
  const fw = Math.max(0, ...Object.values(art.face.grids).map(g => gridSize(g).w))
  const fh = Math.max(0, ...Object.values(art.face.grids).map(g => gridSize(g).h))
  const region = (grid: Grid, x: number, y: number) => grid.slice(y, y + fh).map(r => [...r].slice(x, x + fw).join(''))
  const stand = resolvedPoses.get('stand')
  if (stand !== undefined) {
    const under = region(stand, art.face.x, art.face.y)
    for (const pose of HEAD_POSES) {
      if (pose === 'stand') continue
      const grid = resolvedPoses.get(pose)
      if (grid === undefined) continue
      const { dx, dy } = headOffset(art, pose)
      const here = region(grid, art.face.x + dx, art.face.y + dy)
      let diff = 0
      let first = ''
      here.forEach((row, ry) =>
        [...row].forEach((c, rx) => {
          if (c === (under[ry] ?? '')[rx]) return
          diff += 1
          if (first === '') first = ` (first at ${art.face.x + dx + rx},${art.face.y + dy + ry})`
        }),
      )
      if (diff > 0) problems.push(`pose ${pose}: the face region (${fw}x${fh} at ${art.face.x + dx},${art.face.y + dy}, offset ${dx},${dy}) differs from stand's in ${diff} pixels${first}, so the face overlays will not fit it`)
    }
  }
  // The portrait windows hold the face and the peeking eyes.
  if (art.face.x < art.head.x || art.face.y < art.head.y || art.face.x + fw > art.head.x + PW || art.face.y + fh > art.head.y + PH) {
    problems.push(`head: the ${PW}x${PH} portrait window at ${art.head.x},${art.head.y} does not hold the face region (${fw}x${fh} at ${art.face.x},${art.face.y})`)
  }
  const pw = Math.max(0, ...Object.values(art.peek.grids).map(g => gridSize(g).w))
  const ph = Math.max(0, ...Object.values(art.peek.grids).map(g => gridSize(g).h))
  if (art.peek.x < art.boxHead.x || art.peek.y < art.boxHead.y || art.peek.x + pw > art.boxHead.x + PW || art.peek.y + ph > art.boxHead.y + PH) {
    problems.push(`boxHead: the ${PW}x${PH} window at ${art.boxHead.x},${art.boxHead.y} does not hold the peeking eyes (${pw}x${ph} at ${art.peek.x},${art.peek.y})`)
  }
  for (const [name, grid] of Object.entries(art.face.grids)) inCanvas(`face ${name}`, art.face.x, art.face.y, grid)
  for (const [name, grid] of Object.entries(art.peek.grids)) inCanvas(`peek ${name}`, art.peek.x, art.peek.y, grid)

  // Sway overlays: on the canvas, and over pixels that are the same in stand, playA and playB.
  for (const side of ['L', 'R'] as const) {
    const s = art.sway?.[side]
    if (s === undefined) continue
    checkChars(`sway ${side}`, s.grid, true)
    inCanvas(`sway ${side}`, s.x, s.y, s.grid)
    if (stand === undefined) continue
    for (const pose of SWAY_POSES) {
      if (pose === 'stand') continue
      const grid = resolvedPoses.get(pose)
      if (grid === undefined) continue
      let diff = 0
      let first = ''
      s.grid.forEach((row, gy) =>
        [...row].forEach((c, gx) => {
          if (c === '.') return
          const x = s.x + gx
          const y = s.y + gy
          if ([...(grid[y] ?? '')][x] === [...(stand[y] ?? '')][x]) return
          diff += 1
          if (first === '') first = ` (first at ${x},${y})`
        }),
      )
      if (diff > 0) problems.push(`sway ${side}: ${pose} differs from stand in ${diff} of the pixels it covers${first}, so it will not fit ${pose}`)
    }
  }
  if (art.feast !== undefined) problems.push(...checkFeast(art, resolvedPoses.get('stand'), checkChars, inCanvas, fw, fh))
  return problems
}

/** How far (in pixels, along the row) a pot-look eye's darkness must move toward the pot: any real move of a pixel's tone does it. */
const POT_SHIFT = 0.02

/**
 * The feast's problems (see checkArt): her seat poses (the ones FEAST_POSES
 * gives her, each from stand or a seat pose, its patches on the canvas), each
 * keeping stand's face region (as the HEAD_POSES do), drawn inside the feast
 * window (rows 6-69: her face, her hands, what she holds), her waist row
 * ending at `waist` on her outer side in every one (her body from there in,
 * only `hair` beyond it) and only her hair below it; her feast faces (the
 * face overlays' size), the pot-look ones differing from the face they come from
 * only inside her eyes, each iris toward the pot, and `bite` keeping idle's
 * eyes; a tip on every seat pose that holds something, inside the window; the
 * headband over pixels every seat pose of hers has the same, clear of her face.
 */
function checkFeast(
  art: MemberArt,
  stand: Grid | undefined,
  checkChars: (label: string, grid: Grid, erase: boolean) => void,
  inCanvas: (label: string, x: number, y: number, grid: Grid) => void,
  fw: number,
  fh: number,
): string[] {
  const problems: string[] = []
  const feast = art.feast
  if (feast === undefined) return problems
  const dir = feast.side === 'left' ? 1 : -1
  const want = FEAST_POSES[art.id]
  const top = FEAST_Y
  const foot = FEAST_Y + FEAST_H - 1
  const at = (grid: Grid, x: number, y: number) => [...(grid[y] ?? '')][x] ?? '.'
  if (feast.side !== FEAST_SIDE[art.id]) problems.push(`feast.side: ${feast.side}, where ${art.name} sits at the table's ${FEAST_SIDE[art.id]} edge`)

  // The poses: hers, from the right pose, on the canvas, resolving.
  const seats = new Map<SeatPose, Grid>()
  for (const name of want) if (feast.poses[name] === undefined) problems.push(`feast pose ${name} is missing`)
  for (const name of SEAT_POSES) {
    const def = feast.poses[name]
    if (def === undefined) continue
    if (!want.includes(name)) problems.push(`feast pose ${name}: not one of ${art.name}'s (${want.join(', ')})`)
    if (name === 'seat' ? def.from !== 'stand' : !isSeatPose(def.from)) problems.push(`feast pose ${name}: from "${def.from}", wants ${name === 'seat' ? 'stand' : 'a seat pose'}`)
    def.patches.forEach((p, i) => {
      checkChars(`feast pose ${name} patch ${i}`, p.grid, true)
      inCanvas(`feast pose ${name} patch ${i}`, p.x, p.y, p.grid)
    })
    try {
      seats.set(name, resolvePose(art, name))
    } catch (e) {
      problems.push(`feast pose ${name}: ${(e as Error).message}`)
    }
  }

  // Stand's face region in every one, so every face overlay and feast face fits.
  if (stand !== undefined) {
    for (const [name, grid] of seats) {
      let diff = 0
      let first = ''
      for (let y = art.face.y; y < art.face.y + fh; y += 1)
        for (let x = art.face.x; x < art.face.x + fw; x += 1) {
          if (at(grid, x, y) === at(stand, x, y)) continue
          diff += 1
          if (first === '') first = ` (first at ${x},${y})`
        }
      if (diff > 0) problems.push(`feast pose ${name}: the face region (${fw}x${fh} at ${art.face.x},${art.face.y}) differs from stand's in ${diff} pixels${first}, so the face overlays will not fit it`)
    }
  }

  // The feast window holds all of her: the face, the hands, what she holds.
  for (const [name, grid] of seats) {
    let out = 0
    let first = ''
    grid.forEach((row, y) => {
      if (y >= top && y <= foot) return
      ;[...row].forEach((c, x) => {
        if (c === '.') return
        out += 1
        if (first === '') first = ` (first at ${x},${y})`
      })
    })
    if (out > 0) problems.push(`feast pose ${name}: ${out} pixels outside the feast window (rows ${top}-${foot})${first}`)
  }

  // Her waist row ends at `waist` on her outer side in every pose: her body from there inward (the pixel past it is
  // not her hair: Bocchi's hair outline is her jacket's too), only her hair beyond it.
  const { x: wx, y: wy } = feast.waist
  if (!Number.isInteger(wx) || !Number.isInteger(wy) || wx < 0 || wx >= W || wy < top || wy > foot) {
    problems.push(`feast.waist: ${wx},${wy} is not a pixel inside the feast window (rows ${top}-${foot})`)
  } else {
    const hair = new Set([...(feast.hair ?? '')])
    for (const [name, grid] of seats) {
      const c = at(grid, wx, wy)
      const inward = at(grid, wx + dir, wy)
      if (c === '.') problems.push(`feast pose ${name}: nothing at feast.waist (${wx},${wy}), the pixel the mod lays on the table's edge`)
      else if (inward === '.' || hair.has(inward)) problems.push(`feast pose ${name}: inward of feast.waist (${wx},${wy}) is ${inward === '.' ? 'nothing' : `her hair ("${inward}")`}, not her body`)
      for (let x = wx - dir; x >= 0 && x < W; x -= dir) {
        const o = at(grid, x, wy)
        if (o === '.' || hair.has(o)) continue
        problems.push(`feast pose ${name}: her waist row (${wy}) runs on past feast.waist (${wx}) on her outer side, to ${x} ("${o}"), so the mod would seat her ${Math.abs(x - wx)} pixels off`)
        break
      }
      // below the waist, only her hair (the table hides the rest of her; beside it, her hair still shows)
      let below = 0
      let first = ''
      for (let y = wy + 1; y < H; y += 1)
        [...(grid[y] ?? '')].forEach((ch, x) => {
          if (ch === '.' || hair.has(ch)) return
          below += 1
          if (first === '') first = ` (first at ${x},${y}: "${ch}")`
        })
      if (below > 0) problems.push(`feast pose ${name}: ${below} pixels below her waist (row ${wy}) that are not her hair${first}`)
    }
  }

  // The faces: the face overlays' size at the face box; the pot-look ones move only the eyes, each iris toward the pot.
  for (const name of FEAST_FACES) {
    const grid = feast.faces[name] as Grid | undefined
    if (grid === undefined) {
      problems.push(`feast face ${name} is missing`)
      continue
    }
    checkChars(`feast face ${name}`, grid, true)
    const { w, h } = gridSize(grid)
    if (w > fw || h > fh) problems.push(`feast face ${name}: ${w}x${h}, larger than the face region (${fw}x${fh}) every pose keeps as stand's`)
    inCanvas(`feast face ${name}`, art.face.x, art.face.y, grid)
  }
  if (feast.eyes.length !== 2) problems.push(`feast.eyes: ${feast.eyes.length} boxes, wants her two eyes (near, far)`)
  feast.eyes.forEach((b, i) => {
    if (b.w < 1 || b.h < 1 || b.x < art.face.x || b.y < art.face.y || b.x + b.w > art.face.x + fw || b.y + b.h > art.face.y + fh) problems.push(`feast.eyes[${i}]: ${b.w}x${b.h} at ${b.x},${b.y} is not inside the face region (${fw}x${fh} at ${art.face.x},${art.face.y})`)
  })
  const inEye = (x: number, y: number) => feast.eyes.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)
  if (stand !== undefined) {
    /** Stand with a face laid on it, as rows of characters. */
    const lay = (grid: Grid) => {
      const rows = stand.map(r => [...r])
      overlayChars(rows, { x: art.face.x, y: art.face.y, grid })
      return rows.map(r => r.join(''))
    }
    /** The darkness-weighted mean column of an eye: an iris moved toward the pot (its white away from it) moves it that way. */
    const darkMean = (rows: Grid, b: { x: number; y: number; w: number; h: number }) => {
      let sum = 0
      let mass = 0
      for (let y = b.y; y < b.y + b.h; y += 1)
        for (let x = b.x; x < b.x + b.w; x += 1) {
          const color = art.palette[at(rows, x, y)]
          if (color === undefined) continue
          const k = 255 - luma(color)
          sum += k * x
          mass += k
        }
      return mass > 0 ? sum / mass : 0
    }
    const towards = feast.side === 'left' ? 'our right' : 'our left'
    for (const [pot, base] of Object.entries(POT_LOOK_OF) as ['idlePot' | 'halfPot' | 'focusPot', FaceName][]) {
      const from = art.face.grids[base]
      const to = feast.faces[pot] as Grid | undefined
      if (to === undefined) continue
      const a = lay(from)
      const b = lay(to)
      let outside = 0
      let first = ''
      for (let y = art.face.y; y < art.face.y + fh; y += 1)
        for (let x = art.face.x; x < art.face.x + fw; x += 1) {
          if (at(a, x, y) === at(b, x, y) || inEye(x, y)) continue
          outside += 1
          if (first === '') first = ` (first at ${x},${y})`
        }
      if (outside > 0) problems.push(`feast face ${pot}: differs from ${base} in ${outside} pixels outside her eyes${first}`)
      feast.eyes.forEach((box, i) => {
        const was = darkMean(a, box)
        const now = darkMean(b, box)
        if ((now - was) * dir < POT_SHIFT) problems.push(`feast face ${pot}: the ${i === 0 ? 'near' : 'far'} eye (${box.w}x${box.h} at ${box.x},${box.y}) does not look toward the pot (${towards}): its iris sits at ${now.toFixed(2)}, ${base}'s at ${was.toFixed(2)}`)
      })
    }
    const idle = lay(art.face.grids.idle)
    const bite = lay(feast.faces.bite)
    let moved = 0
    for (let y = art.face.y; y < art.face.y + fh; y += 1) for (let x = art.face.x; x < art.face.x + fw; x += 1) if (inEye(x, y) && at(idle, x, y) !== at(bite, x, y)) moved += 1
    if (moved > 0) problems.push(`feast face bite: its eyes differ from idle's in ${moved} pixels (a bite keeps the eyes at us)`)
  }

  // A tip on every seat pose that holds something, inside the window.
  for (const name of TIPPED_SEATS) if (want.includes(name) && art.tips?.[name] === undefined) problems.push(`tips.${name} is missing (where what she holds acts: the chopsticks' tips, the ladle's cup, the phone's lens)`)
  for (const [name, p] of Object.entries(art.tips ?? {})) {
    if (p === undefined || !isSeatPose(name)) continue
    if (p.y < top || p.y > foot) problems.push(`tips.${name}: ${p.x},${p.y} is outside the feast window (rows ${top}-${foot})`)
  }

  // The headband: over pixels every seat pose has the same (it is drawn over whatever she plays), clear of her face.
  const band = feast.headband
  if (band !== undefined) {
    checkChars('feast headband', band.grid, true)
    inCanvas('feast headband', band.x, band.y, band.grid)
    const seat = seats.get('seat')
    let diff = 0
    let face = 0
    let outside = 0
    let first = ''
    band.grid.forEach((row, gy) =>
      [...row].forEach((c, gx) => {
        if (c === '.') return
        const x = band.x + gx
        const y = band.y + gy
        if (y < top || y > foot) outside += 1
        if (x >= art.face.x && x < art.face.x + fw && y >= art.face.y && y < art.face.y + fh) face += 1
        if (seat === undefined) return
        for (const grid of seats.values()) {
          if (at(grid, x, y) === at(seat, x, y)) continue
          diff += 1
          if (first === '') first = ` (first at ${x},${y})`
          break
        }
      }),
    )
    if (outside > 0) problems.push(`feast headband: ${outside} pixels outside the feast window (rows ${top}-${foot})`)
    if (face > 0) problems.push(`feast headband: ${face} pixels on the face region (${fw}x${fh} at ${art.face.x},${art.face.y}), where the faces change under it`)
    if (diff > 0) problems.push(`feast headband: covers ${diff} pixels that differ between her seat poses${first}, so it will not fit them all`)
  }
  return problems
}
