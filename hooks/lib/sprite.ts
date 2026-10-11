// Kessoku Ultimate Bocchi Theme: the band's pixel-art sprites, played.
//
// Pure helpers, no `$` and no `on`. The frames come from sprites.gen.ts, which
// the Remotion studio (../../studio) renders and exports; this file turns them
// into what a surface can draw:
//
//   terminal  a Raster's cells: two pixels a cell with the half block (`▀`,
//             the top pixel the foreground, the bottom the background), or
//             four with the quadrant blocks for the small spots; repainted
//             frame by frame with `$.ui.blit`.
//   desktop   an SVG: one group per distinct frame, shown in turn by a
//   (and the  discrete SMIL `visibility` animation, so the surface plays it
//   editor,   with no redraw at all; the first frame is the one left visible
//   mobile)   where animation does not run.

import type { KessokuMember, KessokuMood } from '../../types'
import { SPRITES, SPRITE_COLORS } from './sprites.gen'
import type { SpriteAnim } from './sprites.gen'

export type { SpriteAnim }

/** The whole figure (32x32) or the window over the head (16x16). */
export type SpriteView = 'full' | 'portrait'

/**
 * How a terminal packs pixels into cells, a cell being about twice as tall as
 * it is wide: `half` puts a column of two pixels in a cell (square pixels,
 * every color kept); `quad` puts two columns of four (each quadrant a pair of
 * rows merged, two colors a cell), half the size each way, for the small spots.
 */
export type CellMode = 'half' | 'quad'

/** One sprite placed in a drawing, at a pixel offset. */
export type SpritePart = { id: string; x: number; y: number }

/** The Blast Radius crash, Bocchi's guitar hitting the stage. */
export const CRASH = 'fx-crash'

/** The Svg element takes at most this much markup. */
export const SVG_LIMIT = 131_072

/** A Raster color word for "the terminal's own default". */
const DEFAULT_COLOR = 0x01000000

export function spriteId(member: KessokuMember, mood: KessokuMood, view: SpriteView = 'full'): string {
  return view === 'portrait' ? `${member}-${mood}-portrait` : `${member}-${mood}`
}

export function animOf(id: string): SpriteAnim | undefined {
  return SPRITES[id]
}

export function hasSprites(): boolean {
  return Object.keys(SPRITES).length > 0
}

/** How long one pass of the loop takes, in milliseconds. */
export function loopMs(anim: SpriteAnim): number {
  let t = 0
  for (const [ms] of anim.frames) t += ms
  return t
}

/** The frame showing at clock time `now`: every loop runs on the same clock, so two drawings of one sprite agree. */
export function frameAt(anim: SpriteAnim, now: number): number {
  const total = loopMs(anim)
  if (total <= 0 || anim.frames.length <= 1) return 0
  let t = ((now % total) + total) % total
  for (let i = 0; i < anim.frames.length; i += 1) {
    const ms = (anim.frames[i] as readonly [number, string])[0]
    if (t < ms) return i
    t -= ms
  }
  return anim.frames.length - 1
}

// ---- Decoding -------------------------------------------------------------------

const decoded = new Map<string, readonly (string | null)[]>()

/** A frame's pixels, row by row: a `#rrggbb` color, or null where it is transparent. */
export function framePixels(id: string, index: number): readonly (string | null)[] {
  const key = `${id}#${index}`
  const hit = decoded.get(key)
  if (hit !== undefined) return hit
  const anim = SPRITES[id]
  const frame = anim?.frames[index]
  if (anim === undefined || frame === undefined) return []
  const px = decodeRle(frame[1], anim.w * anim.h)
  decoded.set(key, px)
  return px
}

/** `A3B.2` back to `AAAB..`, each character its color. */
export function decodeRle(rle: string, size: number): (string | null)[] {
  const out: (string | null)[] = []
  let i = 0
  while (i < rle.length && out.length < size) {
    const ch = rle[i] as string
    i += 1
    let digits = ''
    while (i < rle.length && /[0-9]/.test(rle[i] as string)) {
      digits += rle[i]
      i += 1
    }
    const n = digits === '' ? 1 : Number(digits)
    const color = ch === '.' ? null : (SPRITE_COLORS[ch] ?? null)
    for (let k = 0; k < n && out.length < size; k += 1) out.push(color)
  }
  while (out.length < size) out.push(null)
  return out
}

/** Several sprites, each at its own frame for `now`, laid on one canvas of `w` x `h` pixels. */
export function composite(parts: readonly SpritePart[], w: number, h: number, now: number): (string | null)[] {
  const px: (string | null)[] = Array.from({ length: w * h }, () => null)
  for (const part of parts) {
    const anim = SPRITES[part.id]
    if (anim === undefined) continue
    const frame = framePixels(part.id, frameAt(anim, now))
    for (let y = 0; y < anim.h; y += 1) {
      const ty = part.y + y
      if (ty < 0 || ty >= h) continue
      for (let x = 0; x < anim.w; x += 1) {
        const tx = part.x + x
        if (tx < 0 || tx >= w) continue
        const c = frame[y * anim.w + x] ?? null
        if (c !== null) px[ty * w + tx] = c
      }
    }
  }
  return px
}

/** Whether any of the parts ever changes: a still one needs no clock. */
export function isAnimated(parts: readonly SpritePart[]): boolean {
  return parts.some(p => (SPRITES[p.id]?.frames.length ?? 0) > 1)
}

/** Which frame each part shows at `now`: two equal signatures draw the same cells. */
export function frameSignature(parts: readonly SpritePart[], now: number): string {
  return parts.map(p => (SPRITES[p.id] === undefined ? '-' : String(frameAt(SPRITES[p.id] as SpriteAnim, now)))).join(',')
}

// ---- Terminal: Raster cells --------------------------------------------------------

/** The cells `w` x `h` pixels take. */
export function cellsFor(w: number, h: number, mode: CellMode): { columns: number; rows: number } {
  return mode === 'half' ? { columns: w, rows: Math.ceil(h / 2) } : { columns: Math.ceil(w / 2), rows: Math.ceil(h / 4) }
}

function rgb(hex: string): number {
  return parseInt(hex.slice(1), 16) & 0xffffff
}

function luma(c: number): number {
  return ((c >> 16) & 255) * 0.299 + ((c >> 8) & 255) * 0.587 + (c & 255) * 0.114
}

/** Two stacked pixels as one quadrant: the darker wins, so eyes, mouths and outlines survive the merge. */
function mergePair(a: string | null, b: string | null): string | null {
  if (a === null) return b
  if (b === null) return a
  return luma(rgb(a)) <= luma(rgb(b)) ? a : b
}

function distance(a: number, b: number): number {
  const dr = ((a >> 16) & 255) - ((b >> 16) & 255)
  const dg = ((a >> 8) & 255) - ((b >> 8) & 255)
  const db = (a & 255) - (b & 255)
  return dr * dr + dg * dg + db * db
}

// The quadrant blocks by which quarters they fill: upper-left 1, upper-right 2, lower-left 4, lower-right 8.
const QUADRANTS = [0x20, 0x2598, 0x259d, 0x2580, 0x2596, 0x258c, 0x259e, 0x259b, 0x2597, 0x259a, 0x2590, 0x259c, 0x2584, 0x2599, 0x259f, 0x2588]

/**
 * A pixel canvas as Raster cells: standard base64 of little-endian u32
 * triplets `[codePoint, foreground, background]`, row-major. Transparent
 * pixels take `bg` (a `#rrggbb`, or the terminal's own default when absent;
 * `isLight` says whether that default is a light one, for the quadrants'
 * nearest-color choice).
 */
export function encodeCells(px: readonly (string | null)[], w: number, h: number, mode: CellMode, bg?: string, isLight = false): { cells: string; columns: number; rows: number } {
  const back = bg === undefined ? DEFAULT_COLOR : rgb(bg)
  // The color a transparent quadrant is measured as: the background's own, or, for the terminal's default, white or black.
  const seen = (c: number) => (c === DEFAULT_COLOR ? (isLight ? 0xffffff : 0x000000) : c)
  const at = (x: number, y: number): string | null => (x < w && y < h ? (px[y * w + x] ?? null) : null)
  const { columns, rows } = cellsFor(w, h, mode)
  const bytes = new Uint8Array(columns * rows * 12)
  const view = new DataView(bytes.buffer)
  let o = 0
  const put = (cp: number, fg: number, bgc: number) => {
    view.setUint32(o, cp, true)
    view.setUint32(o + 4, fg, true)
    view.setUint32(o + 8, bgc, true)
    o += 12
  }
  if (mode === 'half') {
    for (let r = 0; r < rows; r += 1) {
      for (let x = 0; x < columns; x += 1) {
        const top = at(x, r * 2)
        const bottom = at(x, r * 2 + 1)
        if (top === null && bottom === null) put(0x20, DEFAULT_COLOR, back)
        else if (bottom === null) put(0x2580, rgb(top as string), back)
        else if (top === null) put(0x2584, rgb(bottom), back)
        else if (top === bottom) put(0x2588, rgb(top), back)
        else put(0x2580, rgb(top), rgb(bottom))
      }
    }
  } else {
    // Quadrants: each one pixel wide and two tall (a pair of rows merged), so the
    // cell keeps the sprite's aspect. A cell shows two colors at most: its two
    // commonest, every other quadrant taking the nearer of them.
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        const x0 = c * 2
        const y0 = r * 4
        const quad = [
          mergePair(at(x0, y0), at(x0, y0 + 1)),
          mergePair(at(x0 + 1, y0), at(x0 + 1, y0 + 1)),
          mergePair(at(x0, y0 + 2), at(x0, y0 + 3)),
          mergePair(at(x0 + 1, y0 + 2), at(x0 + 1, y0 + 3)),
        ].map(p => (p === null ? back : rgb(p)))
        const counts = new Map<number, number>()
        for (const q of quad) counts.set(q, (counts.get(q) ?? 0) + 1)
        // The commonest first; on a tie a drawn color beats the background (so thin lines
        // survive) and a darker one a lighter (as mergePair does, so outlines and eyes win).
        const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] === back ? 1 : 0) - (b[0] === back ? 1 : 0) || luma(a[0]) - luma(b[0]))
        const first = (ranked[0] as [number, number])[0]
        if (ranked.length === 1) {
          if (first === back) put(0x20, DEFAULT_COLOR, back)
          else put(0x2588, first, back)
          continue
        }
        const second = (ranked[1] as [number, number])[0]
        // The foreground is a drawn color whenever there is one.
        const fg = first === back ? second : first
        const other = fg === first ? second : first
        let mask = 0
        quad.forEach((q, i) => {
          // When the other slot is the background it keeps the transparent quadrants alone: every drawn one shows.
          const isFg = other === back ? q !== back : q === fg || (q !== other && distance(seen(q), fg) <= distance(seen(q), other))
          if (isFg) mask |= 1 << i
        })
        put(QUADRANTS[mask] as number, fg, other)
      }
    }
  }
  return { cells: base64(bytes), columns, rows }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Standard padded base64; the runtime's own `toBase64` where it has one. */
export function base64(bytes: Uint8Array): string {
  const native = (bytes as Uint8Array & { toBase64?: () => string }).toBase64
  if (typeof native === 'function') return native.call(bytes)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] as number
    const b = i + 1 < bytes.length ? (bytes[i + 1] as number) : 0
    const c = i + 2 < bytes.length ? (bytes[i + 2] as number) : 0
    const n = (a << 16) | (b << 8) | c
    out += B64[(n >> 18) & 63]
    out += B64[(n >> 12) & 63]
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '='
    out += i + 2 < bytes.length ? B64[n & 63] : '='
  }
  return out
}

// ---- Desktop: animated SVG ------------------------------------------------------------

/** One frame's pixels as SVG paths: a stroke per color, one horizontal segment per run, moves relative. */
function framePaths(px: readonly (string | null)[], w: number, h: number): string {
  const runs = new Map<string, string>()
  const ends = new Map<string, [number, number]>()
  for (let y = 0; y < h; y += 1) {
    let x = 0
    while (x < w) {
      const c = px[y * w + x] ?? null
      if (c === null) {
        x += 1
        continue
      }
      let n = 1
      while (x + n < w && px[y * w + x + n] === c) n += 1
      const last = ends.get(c)
      const step = last === undefined ? `M${x} ${y}.5h${n}` : `m${x - last[0]} ${y - last[1]}h${n}`
      runs.set(c, (runs.get(c) ?? '') + step)
      ends.set(c, [x + n, y])
      x += n
    }
  }
  return [...runs.entries()].map(([c, d]) => `<path stroke="${c}" d="${d}"/>`).join('')
}

function fmt(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

/**
 * One sprite's frames as SVG groups. Each distinct frame is drawn once and
 * shown over every span of the loop it covers by a discrete `visibility`
 * animation; the first frame is visible to begin with, so a surface that does
 * not animate still shows her.
 */
function spriteGroups(id: string): string {
  const anim = SPRITES[id]
  if (anim === undefined) return ''
  const total = loopMs(anim)
  // Distinct frames, and the spans of the loop each one covers.
  const spans = new Map<string, { index: number; at: [number, number][] }>()
  let t = 0
  anim.frames.forEach(([ms, data], index) => {
    const entry = spans.get(data) ?? { index, at: [] }
    entry.at.push([t, t + ms])
    spans.set(data, entry)
    t += ms
  })
  const groups: string[] = []
  for (const { index, at } of spans.values()) {
    const paths = framePaths(framePixels(id, index), anim.w, anim.h)
    const visibleAtStart = at.some(([a]) => a === 0)
    if (spans.size === 1) {
      groups.push(`<g>${paths}</g>`)
      continue
    }
    const times: number[] = [0]
    const values: string[] = [visibleAtStart ? 'visible' : 'hidden']
    for (const [a, b] of at) {
      if (a > 0) {
        times.push(a / total)
        values.push('visible')
      }
      if (b < total) {
        times.push(b / total)
        values.push('hidden')
      }
    }
    const anim_ = `<animate attributeName="visibility" dur="${total}ms" repeatCount="indefinite" calcMode="discrete" keyTimes="${times.map(fmt).join(';')}" values="${values.join(';')}"/>`
    groups.push(`<g visibility="${visibleAtStart ? 'visible' : 'hidden'}">${anim_}${paths}</g>`)
  }
  return groups.join('')
}

const svgCache = new Map<string, string>()

/** Sprites laid on one `w` x `h` pixel canvas as one SVG document, each `scale` CSS pixels a pixel. */
export function spritesSvg(parts: readonly SpritePart[], w: number, h: number, scale: number): string {
  const key = `${w}x${h}@${scale}:${parts.map(p => `${p.id}+${p.x}+${p.y}`).join('|')}`
  const hit = svgCache.get(key)
  if (hit !== undefined) return hit
  const body = parts
    .filter(p => SPRITES[p.id] !== undefined)
    .map(p => (p.x === 0 && p.y === 0 ? spriteGroups(p.id) : `<g transform="translate(${p.x} ${p.y})">${spriteGroups(p.id)}</g>`))
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" fill="none" stroke-width="1">${body}</svg>`
  if (svgCache.size > 200) svgCache.clear()
  svgCache.set(key, svg)
  return svg
}
