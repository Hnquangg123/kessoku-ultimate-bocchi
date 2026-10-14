// Kessoku Ultimate Bocchi Theme: the band's pixel-art sprites, played.
//
// Pure helpers, no `$` and no `on`. The frames come from sprites.gen.ts, which
// the Remotion studio (../../studio) renders and exports; this file turns them
// into what a surface can draw:
//
//   terminal  a Raster's cells: two pixels a cell with the half block (`▀`,
//             the top pixel the foreground, the bottom the background), or
//             four with the quadrant blocks; repainted frame by frame with
//             `$.ui.blit`.
//   desktop   an SVG drawn in layers, so a 96x96 loop of a dozen frames fits
//   (and the  the Svg element: the pixels every frame shares are drawn once
//   editor,   and always shown; the pixels a cluster of like frames shares are
//   mobile)   drawn once and shown over those frames' spans of the loop; each
//             frame draws only what is left of it, shown over its own spans.
//             The spans are discrete SMIL `visibility` animations, so the
//             surface plays the loop with no redraw at all, and what is
//             visible to begin with is the first frame, left standing where
//             animation does not run. A drawing still too large for the
//             element loses frames (neighbours merged into longer holds), at
//             worst down to a still of the first.

import type { KessokuMember, KessokuMood } from '../../types'
import { SPRITES, SPRITE_COLORS } from './sprites.gen'
import type { SpriteAnim } from './sprites.gen'

export type { SpriteAnim }

/** The whole figure (96x96), the window over the head (32x32), or the hand-drawn head the terminal shows (16x16). */
export type SpriteView = 'full' | 'portrait' | 'mini'

/**
 * How a terminal packs pixels into cells, a cell being about twice as tall as
 * it is wide: `half` puts a column of two pixels in a cell (square pixels,
 * every color kept); `quad` puts two columns of four (each quadrant a pair of
 * rows merged, two colors a cell), half the size each way.
 */
export type CellMode = 'half' | 'quad'

/**
 * One sprite placed in a drawing, at a pixel offset, each of its pixels drawn
 * `zoom` x `zoom` (a whole number; 1 when absent). A mini at zoom 2 at an
 * even column and a row a multiple of four, in quadrants, is the mini in half
 * blocks: each cell its pixel on top and the one below at the bottom.
 */
export type SpritePart = { id: string; x: number; y: number; zoom?: number }

/** A part's zoom: a whole number, at least 1. */
function zoomOf(part: SpritePart): number {
  return Math.max(1, Math.floor(part.zoom ?? 1))
}

/** Animations by id: the exported ones, or a table of a test's own. */
export type SpriteTable = Readonly<Record<string, SpriteAnim>>

/** The Blast Radius crash, Bocchi's guitar hitting the stage (96x32). */
export const CRASH = 'fx-crash'

/** The crash at half the size (48x16), for the terminal's small spots. */
export const CRASH_MINI = 'fx-crash-mini'

/** The Svg element takes at most this much markup. */
export const SVG_LIMIT = 131_072

/** A Raster color word for "the terminal's own default". */
const DEFAULT_COLOR = 0x01000000

/** Each view's size as the studio draws it, for when no frames are there to say. */
const NOMINAL: Readonly<Record<SpriteView, number>> = { full: 96, portrait: 32, mini: 16 }

export function spriteId(member: KessokuMember, mood: KessokuMood, view: SpriteView = 'full'): string {
  return view === 'full' ? `${member}-${mood}` : `${member}-${mood}-${view}`
}

/** A view's size in pixels, read off the exported frames (every member's is the same), the studio's own when none are there. */
export function viewSize(view: SpriteView): { w: number; h: number } {
  const anim = SPRITES[spriteId('bocchi', 'anxious', view)]
  return anim === undefined ? { w: NOMINAL[view], h: NOMINAL[view] } : { w: anim.w, h: anim.h }
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
//
// A frame decodes to palette codes, one a pixel: the UTF-16 unit of the
// pixel's palette character, 0 where it is transparent. Two bytes a pixel, and
// the color only looked up where a pixel is drawn.

const DOT = 0x2e
const SAME = 0x3d
const ZERO = 0x30
const NINE = 0x39

/** Each palette code's color, by code. */
const COLOR_OF: (string | undefined)[] = []
for (const [ch, hex] of Object.entries(SPRITE_COLORS)) COLOR_OF[ch.charCodeAt(0)] = hex

/** A palette code's color: null for transparency (0) or a character the palette does not hold. */
export function colorOf(code: number): string | null {
  return code === 0 ? null : (COLOR_OF[code] ?? null)
}

/**
 * One frame's runs as palette codes (`size` of them): `A3` is three of `A`,
 * `.` transparent, and `=` (with a count the same way) pixels copied from
 * `prev`, the frame before decoded; transparent where there is none, as is a
 * character the palette does not hold.
 */
export function decodeCodes(rle: string, size: number, prev?: Uint16Array): Uint16Array {
  const out = new Uint16Array(size)
  let o = 0
  let i = 0
  while (i < rle.length && o < size) {
    const ch = rle.charCodeAt(i)
    i += 1
    let n = 0
    let isCounted = false
    while (i < rle.length) {
      const d = rle.charCodeAt(i)
      if (d < ZERO || d > NINE) break
      n = n * 10 + (d - ZERO)
      isCounted = true
      i += 1
    }
    const end = Math.min(size, o + (isCounted ? n : 1))
    if (ch === SAME) {
      if (prev !== undefined) out.set(prev.subarray(o, end), o)
    } else if (ch !== DOT && COLOR_OF[ch] !== undefined) {
      out.fill(ch, o, end)
    }
    o = end
  }
  return out
}

/** Every frame of an animation, decoded in play order (each `=` read against the frame before). */
export function decodeFrames(anim: SpriteAnim): Uint16Array[] {
  const size = anim.w * anim.h
  const out: Uint16Array[] = []
  let prev: Uint16Array | undefined
  for (const [, rle] of anim.frames) {
    prev = decodeCodes(rle, size, prev)
    out.push(prev)
  }
  return out
}

/** A frame's codes as colors, row by row: a `#rrggbb`, or null where it is transparent. */
export function pixelsOf(codes: Uint16Array): (string | null)[] {
  const out: (string | null)[] = new Array(codes.length)
  for (let i = 0; i < codes.length; i += 1) out[i] = colorOf(codes[i] as number)
  return out
}

function sameCodes(a: Uint16Array, b: Uint16Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false
  return true
}

/** A sprite's frames decoded, and for each the first frame that looks the same (so equal frames repaint nothing). */
type Decoded = { frames: Uint16Array[]; same: number[] }

const decoded = new Map<string, Decoded>()

/** The terminal's frames, decoded once a sprite and kept (the desktop decodes afresh and keeps only its markup). */
function decodedOf(id: string): Decoded | undefined {
  const hit = decoded.get(id)
  if (hit !== undefined) return hit
  const anim = SPRITES[id]
  if (anim === undefined) return undefined
  const frames = decodeFrames(anim)
  const firsts: number[] = []
  const same = frames.map((f, i) => {
    const j = firsts.find(k => sameCodes(frames[k] as Uint16Array, f))
    if (j !== undefined) return j
    firsts.push(i)
    return i
  })
  const entry = { frames, same }
  decoded.set(id, entry)
  return entry
}

/** A frame's pixels, row by row: a `#rrggbb` color, or null where it is transparent. */
export function framePixels(id: string, index: number): readonly (string | null)[] {
  const frame = decodedOf(id)?.frames[index]
  return frame === undefined ? [] : pixelsOf(frame)
}

/** Several sprites, each at its own frame for `now` and drawn at its zoom, laid on one canvas of `w` x `h` pixels. */
export function composite(parts: readonly SpritePart[], w: number, h: number, now: number): (string | null)[] {
  const px: (string | null)[] = Array.from({ length: w * h }, () => null)
  for (const part of parts) {
    const anim = SPRITES[part.id]
    const frame = decodedOf(part.id)?.frames[anim === undefined ? 0 : frameAt(anim, now)]
    if (anim === undefined || frame === undefined) continue
    const z = zoomOf(part)
    for (let y = 0; y < anim.h * z; y += 1) {
      const ty = part.y + y
      if (ty < 0 || ty >= h) continue
      const row = Math.floor(y / z) * anim.w
      for (let x = 0; x < anim.w * z; x += 1) {
        const tx = part.x + x
        if (tx < 0 || tx >= w) continue
        const code = frame[row + Math.floor(x / z)] as number
        if (code !== 0) px[ty * w + tx] = COLOR_OF[code] ?? null
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
  return parts
    .map(p => {
      const anim = SPRITES[p.id]
      if (anim === undefined) return '-'
      const i = frameAt(anim, now)
      return String(decodedOf(p.id)?.same[i] ?? i)
    })
    .join(',')
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

// ---- Desktop: the layers ------------------------------------------------------------

/** A stretch of the loop, in milliseconds from its start: `[from, to)`. */
export type Span = readonly [from: number, to: number]

/**
 * One layer of a drawing: its pixels (palette codes, 0 where it draws
 * nothing), the spans of the loop it shows over (null for always), and the
 * pixels outside it that every frame it shows over draws in one color
 * (`free`), which a run of that color may cross, painting them as they are.
 */
export type SvgLayer = { px: Uint16Array; spans: readonly Span[] | null; free: Uint16Array | null }

/** A sprite's loop as layers, drawn in order: over any span, exactly the frame then showing. */
export type SvgLayers = { w: number; h: number; total: number; layers: SvgLayer[] }

/**
 * What markup costs, in characters, for weighing one layering against
 * another: a run (`m-7 1h5`), a path's head (`<path stroke="#rrggbb"
 * d=""/>`), and an animated layer's group with its animation.
 */
const RUN_CHARS = 7
const HEAD_CHARS = 29
const GROUP_CHARS = 170

/**
 * About what a layer of `px` (less the pixels `less` draws) costs as markup:
 * its runs, its paths' heads and its group; nothing when it draws nothing.
 */
function layerCost(px: Uint16Array, w: number, less: Uint16Array | null): number {
  let runs = 0
  const hues = new Set<number>()
  let prev = 0
  for (let i = 0; i < px.length; i += 1) {
    const c = less !== null && less[i] !== 0 ? 0 : (px[i] as number)
    if (c !== 0 && (c !== prev || i % w === 0)) {
      runs += 1
      hues.add(c)
    }
    prev = c
  }
  return runs === 0 ? 0 : runs * RUN_CHARS + hues.size * HEAD_CHARS + GROUP_CHARS
}

function countOf(px: Uint16Array): number {
  let n = 0
  for (let i = 0; i < px.length; i += 1) if (px[i] !== 0) n += 1
  return n
}

/** Spans in order with touching ones joined; null when they cover the whole loop. */
function joinSpans(spans: readonly Span[], total: number): Span[] | null {
  const sorted = [...spans].sort((a, b) => a[0] - b[0])
  const out: [number, number][] = []
  for (const [a, b] of sorted) {
    const last = out[out.length - 1]
    if (last !== undefined && a <= last[1]) last[1] = Math.max(last[1], b)
    else out.push([a, b])
  }
  const only = out[0]
  return out.length === 1 && only !== undefined && only[0] <= 0 && only[1] >= total ? null : out
}

/**
 * A loop's frames (codes, in play order, each held `durations[i]` ms) as
 * layers. Frames that look the same are one frame, shown over several spans.
 *
 * The first layer, always shown, is the base: every pixel all the frames
 * draw, in the color most of them give it. Over it each frame has a
 * residual, its pixels the base leaves out or colors otherwise, and the
 * residuals are clustered (clusterLayers): a cluster's shared pixels are a
 * layer shown over all its frames' spans, and what is left of a frame its own
 * layer, shown over its own.
 *
 * Exact: the base covers only pixels every frame draws; a frame's other
 * layers are disjoint parts of its residual that together make it, drawn
 * after the base; and a layer is hidden whenever none of its frames shows.
 * So at every instant the visible layers cover exactly the frame's pixels,
 * and painted in order they give each its color.
 */
export function layerFrames(frames: readonly Uint16Array[], durations: readonly number[], w: number, h: number): SvgLayers {
  const size = w * h
  // Distinct frames and the spans each covers; a frame of no duration never shows.
  const distinct: { px: Uint16Array; spans: [number, number][] }[] = []
  let total = 0
  frames.forEach((f, i) => {
    const ms = durations[i] ?? 0
    if (ms <= 0) return
    let d = distinct.find(x => sameCodes(x.px, f))
    if (d === undefined) {
      d = { px: f, spans: [] }
      distinct.push(d)
    }
    const last = d.spans[d.spans.length - 1]
    if (last !== undefined && last[1] === total) last[1] = total + ms
    else d.spans.push([total, total + ms])
    total += ms
  })
  const first = distinct[0]
  if (first === undefined) {
    const still = frames[0]
    return { w, h, total: 0, layers: still === undefined ? [] : [{ px: still, spans: null, free: null }] }
  }
  if (distinct.length === 1) return { w, h, total, layers: [{ px: first.px, spans: null, free: null }] }
  const pxOf = (f: number) => (distinct[f] as (typeof distinct)[number]).px

  const base = new Uint16Array(size)
  const tally = new Map<number, number>()
  for (let i = 0; i < size; i += 1) {
    if (distinct.some(d => d.px[i] === 0)) continue
    tally.clear()
    let best = 0
    let most = 0
    for (const d of distinct) {
      const c = d.px[i] as number
      const n = (tally.get(c) ?? 0) + 1
      tally.set(c, n)
      if (n > most) {
        most = n
        best = c
      }
    }
    base[i] = best
  }
  const residual = distinct.map(d => {
    const r = new Uint16Array(size)
    for (let i = 0; i < size; i += 1) if (base[i] !== d.px[i]) r[i] = d.px[i] as number
    return r
  })
  // A layer shown over some frames: their spans, and the pixels all of them draw in one color.
  const place = (px: Uint16Array, members: readonly number[]): SvgLayer => {
    const free = new Uint16Array(size)
    const lead = pxOf(members[0] as number)
    for (let i = 0; i < size; i += 1) {
      const c = lead[i] as number
      if (c !== 0 && members.every(m => pxOf(m)[i] === c)) free[i] = c
    }
    return { px, spans: joinSpans(members.flatMap(m => (distinct[m] as (typeof distinct)[number]).spans), total), free }
  }
  const layers: SvgLayer[] = []
  if (countOf(base) > 0) layers.push({ px: base, spans: null, free: null })
  layers.push(...clusterLayers(distinct.map((_, f) => f), residual, w, place))
  return { w, h, total, layers }
}

/**
 * Frames' residuals (what each draws over the layers below) as layers,
 * clustered greedily in play order: a frame joins the cluster it saves the
 * most markup with (what the cluster's layers cost with it, against what
 * they cost without it plus its own layer), or starts one of its own when
 * none saves any. A cluster's shared pixels (those all its frames draw
 * alike, a subset of each one's residual) are a layer shown over all their
 * spans; what is left of its frames is clustered again the same way, down
 * to each frame's own layer.
 */
function clusterLayers(members: readonly number[], residual: readonly Uint16Array[], w: number, place: (px: Uint16Array, members: readonly number[]) => SvgLayer): SvgLayer[] {
  const size = (residual[members[0] as number] as Uint16Array).length
  type Cluster = { members: number[]; shared: Uint16Array; cost: number }
  const clusters: Cluster[] = []
  for (const f of members) {
    const r = residual[f] as Uint16Array
    const alone = layerCost(r, w, null)
    if (alone === 0) continue
    let best: Cluster | null = null
    let bestShared: Uint16Array | null = null
    let bestCost = 0
    let bestGain = 0
    for (const c of clusters) {
      const shared = new Uint16Array(size)
      let k = 0
      for (let i = 0; i < size; i += 1) {
        const v = r[i] as number
        if (v !== 0 && c.shared[i] === v) {
          shared[i] = v
          k += 1
        }
      }
      if (k === 0) continue
      let cost = layerCost(shared, w, null) + layerCost(r, w, shared)
      for (const m of c.members) cost += layerCost(residual[m] as Uint16Array, w, shared)
      const gain = c.cost + alone - cost
      if (gain > bestGain) {
        best = c
        bestShared = shared
        bestCost = cost
        bestGain = gain
      }
    }
    if (best === null || bestShared === null) {
      clusters.push({ members: [f], shared: r, cost: alone })
      continue
    }
    best.members.push(f)
    best.shared = bestShared
    best.cost = bestCost
  }
  const layers: SvgLayer[] = []
  for (const c of clusters) {
    layers.push(place(c.shared, c.members))
    if (c.members.length === 1) continue
    const rest = residual.slice()
    for (const m of c.members) {
      const r = residual[m] as Uint16Array
      const own = new Uint16Array(size)
      for (let i = 0; i < size; i += 1) if (c.shared[i] === 0) own[i] = r[i] as number
      rest[m] = own
    }
    layers.push(...clusterLayers(c.members, rest, w, place))
  }
  return layers
}

/**
 * A loop with its frames merged down to at most `keep`: the two neighbours
 * that differ least become one, the earlier held for both their times, until
 * few enough are left. The first frame always stays first, so at `keep` 1 the
 * loop is a still of it.
 */
export function mergeTimeline(frames: readonly Uint16Array[], durations: readonly number[], keep: number): { frames: Uint16Array[]; durations: number[] } {
  const fs = [...frames]
  const ds = fs.map((_, i) => durations[i] ?? 0)
  const differ = (a: Uint16Array, b: Uint16Array) => {
    let n = 0
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) n += 1
    return n
  }
  // diffs[i]: how much frame i differs from frame i - 1.
  const diffs = fs.map((f, i) => (i === 0 ? Infinity : differ(fs[i - 1] as Uint16Array, f)))
  while (fs.length > Math.max(1, keep)) {
    let at = 1
    for (let i = 2; i < fs.length; i += 1) if ((diffs[i] as number) < (diffs[at] as number)) at = i
    ds[at - 1] = (ds[at - 1] as number) + (ds[at] as number)
    fs.splice(at, 1)
    ds.splice(at, 1)
    diffs.splice(at, 1)
    if (at < fs.length) diffs[at] = differ(fs[at - 1] as Uint16Array, fs[at] as Uint16Array)
  }
  return { frames: fs, durations: ds }
}

// ---- Desktop: the markup -------------------------------------------------------------

function fmt(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

/** Two path numbers: a space between them, unless the second's minus sign parts them. */
function pair(a: number, b: number): string {
  return b < 0 ? `${a}${b}` : `${a} ${b}`
}

/**
 * One color's runs in a layer as path data: along the rows (`h` segments) or
 * down the columns (`v`), each a stroke a pixel wide through the middle of
 * its pixels, the moves between them relative. A run reaches across pixels
 * that `crosses` allows (ones painted over later, or ones it paints as they
 * are), and ends on its own last pixel.
 */
function runData(px: Uint16Array, w: number, h: number, c: number, isDown: boolean, crosses: (p: number) => boolean): string {
  const lines = isDown ? w : h
  const along = isDown ? h : w
  const step = isDown ? w : 1
  const lineStep = isDown ? 1 : w
  let d = ''
  let lastLine = 0
  let lastAt = 0
  let isStarted = false
  for (let line = 0; line < lines; line += 1) {
    const origin = line * lineStep
    let at = 0
    while (at < along) {
      if (px[origin + at * step] !== c) {
        at += 1
        continue
      }
      let end = at + 1
      let k = at + 1
      while (k < along) {
        const p = origin + k * step
        if (px[p] === c) {
          k += 1
          end = k
        } else if (crosses(p)) {
          k += 1
        } else {
          break
        }
      }
      const n = end - at
      if (isDown) d += isStarted ? `m${pair(line - lastLine, at - lastAt)}v${n}` : `M${line}.5 ${at}v${n}`
      else d += isStarted ? `m${pair(at - lastAt, line - lastLine)}h${n}` : `M${at} ${line}.5h${n}`
      isStarted = true
      lastLine = line
      lastAt = end
      at = end
    }
  }
  return d
}

/**
 * A layer's pixels as SVG paths, a stroke a color. The colors go most-drawn
 * first, and a run of one may cross pixels of colors drawn after it (they
 * paint over it) and pixels outside the layer that every frame showing it
 * draws in that color (the layer's `free`), so the big areas take long runs
 * and the details sit on top. Each color takes whichever way, rows or
 * columns, writes shorter.
 */
function layerPaths(layer: SvgLayer, w: number, h: number): string {
  const { px, free } = layer
  const counts = new Map<number, number>()
  for (let i = 0; i < px.length; i += 1) {
    const c = px[i] as number
    if (c !== 0) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  const order = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(e => e[0])
  const rank = new Map<number, number>()
  order.forEach((c, r) => rank.set(c, r))
  let out = ''
  order.forEach((c, r) => {
    const hex = COLOR_OF[c]
    if (hex === undefined) return
    const crosses = (p: number) => {
      const q = px[p] as number
      return q !== 0 ? (rank.get(q) as number) > r : free !== null && free[p] === c
    }
    const across = runData(px, w, h, c, false, crosses)
    const down = runData(px, w, h, c, true, crosses)
    out += `<path stroke="${hex}" d="${down.length < across.length ? down : across}"/>`
  })
  return out
}

/** One layer as markup: its paths, in a group shown over its spans by a discrete visibility animation unless it always shows. */
function layerMarkup(layer: SvgLayer, w: number, h: number, total: number): string {
  const paths = layerPaths(layer, w, h)
  if (paths === '' || layer.spans === null) return paths
  const isVisibleAtStart = layer.spans.some(([a]) => a <= 0)
  const times: number[] = [0]
  const values: string[] = [isVisibleAtStart ? 'visible' : 'hidden']
  for (const [a, b] of layer.spans) {
    if (a > 0) {
      times.push(a / total)
      values.push('visible')
    }
    if (b < total) {
      times.push(b / total)
      values.push('hidden')
    }
  }
  const animate = `<animate attributeName="visibility" dur="${total}ms" repeatCount="indefinite" calcMode="discrete" keyTimes="${times.map(fmt).join(';')}" values="${values.join(';')}"/>`
  return `<g visibility="${isVisibleAtStart ? 'visible' : 'hidden'}">${animate}${paths}</g>`
}

/** How many times a sprite's loop can be halved before it is a still. */
function levelsOf(anim: SpriteAnim): number {
  let n = anim.frames.length
  let level = 0
  while (n > 1) {
    n = Math.ceil(n / 2)
    level += 1
  }
  return level
}

const markupCaches = new WeakMap<SpriteTable, Map<string, string>>()

/**
 * A sprite's drawing at `level`: every frame at 0; at each level above, half
 * as many (neighbours merged by mergeTimeline), down to a still of the first
 * frame. Kept as markup only.
 */
function spriteMarkup(table: SpriteTable, id: string, level: number): string {
  let cache = markupCaches.get(table)
  if (cache === undefined) {
    cache = new Map()
    markupCaches.set(table, cache)
  }
  const key = `${id}@${level}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const anim = table[id]
  if (anim === undefined) return ''
  let frames = decodeFrames(anim)
  let durations = anim.frames.map(([ms]) => ms)
  if (level > 0) ({ frames, durations } = mergeTimeline(frames, durations, Math.ceil(frames.length / 2 ** level)))
  const { total, layers } = layerFrames(frames, durations, anim.w, anim.h)
  const markup = layers.map(l => layerMarkup(l, anim.w, anim.h, total)).join('')
  if (cache.size > 400) cache.clear()
  cache.set(key, markup)
  return markup
}

/** A drawing as made: its markup, and how far each part gave to fit (0 every frame; above, frames merged; -1 left out). */
export type SvgDrawing = { svg: string; levels: number[] }

const svgCache = new Map<string, SvgDrawing>()

/**
 * Sprites laid on one `w` x `h` pixel canvas as one SVG document, each
 * `scale` CSS pixels a pixel, at most SVG_LIMIT characters: while it is
 * longer, the largest part that can still lose frames loses half of them,
 * and past a still of every part the largest part is left out. The ids are
 * looked up in `table` (the exported sprites, unless a test brings its own).
 */
export function drawSvg(parts: readonly SpritePart[], w: number, h: number, scale: number, table: SpriteTable = SPRITES): SvgDrawing {
  const key = `${w}x${h}@${scale}:${parts.map(p => `${p.id}+${p.x}+${p.y}*${zoomOf(p)}`).join('|')}`
  const hit = table === SPRITES ? svgCache.get(key) : undefined
  if (hit !== undefined) return hit
  const present = parts.filter(p => table[p.id] !== undefined)
  const levels = present.map(() => 0)
  const most = present.map(p => levelsOf(table[p.id] as SpriteAnim))
  const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" fill="none" stroke-width="1">${body}</svg>`
  const placed = (p: SpritePart, level: number) => {
    if (level < 0) return ''
    const inner = spriteMarkup(table, p.id, level)
    const z = zoomOf(p)
    if (inner === '' || (p.x === 0 && p.y === 0 && z === 1)) return inner
    return `<g transform="translate(${p.x} ${p.y})${z === 1 ? '' : ` scale(${z})`}">${inner}</g>`
  }
  for (;;) {
    const bodies = present.map((p, i) => placed(p, levels[i] as number))
    const svg = wrap(bodies.join(''))
    if (svg.length <= SVG_LIMIT) {
      const drawing = { svg, levels }
      if (table === SPRITES) {
        if (svgCache.size > 200) svgCache.clear()
        svgCache.set(key, drawing)
      }
      return drawing
    }
    // The largest part that can still give: frames first, the whole part last.
    const largest = (canGive: (i: number) => boolean) => {
      let pick = -1
      bodies.forEach((body, i) => {
        if (canGive(i) && (pick < 0 || body.length > (bodies[pick] as string).length)) pick = i
      })
      return pick
    }
    const merge = largest(i => (levels[i] as number) >= 0 && (levels[i] as number) < (most[i] as number))
    if (merge >= 0) {
      levels[merge] = (levels[merge] as number) + 1
      continue
    }
    const drop = largest(i => (levels[i] as number) >= 0)
    if (drop < 0) return { svg: wrap(''), levels }
    levels[drop] = -1
  }
}

/** Sprites laid on one `w` x `h` pixel canvas as one SVG document, each `scale` CSS pixels a pixel (see drawSvg). */
export function spritesSvg(parts: readonly SpritePart[], w: number, h: number, scale: number): string {
  return drawSvg(parts, w, h, scale).svg
}
