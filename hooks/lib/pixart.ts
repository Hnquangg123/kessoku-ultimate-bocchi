// Kessoku Ultimate Bocchi Theme: small pictures drawn pixel by pixel, in the sprites' own language.
//
// Pure, no `$` and no `on`: the stage's furniture and the hotpot's props
// are drawn on a `Pix` and written as the sprites are (`pixPaths`); boxes
// of pixels as filled paths (`boxPaths`); a picture placed at a zoom
// (`placedArt`); a figure's furniture spliced in after it in the sprites'
// markup (`spliceAfter`). A leaf: it imports nothing of scene.ts.

import { f } from './svgtext'
import type { SpritePart } from './sprite'

/**
 * A small picture drawn pixel by pixel (flat colours, a darker outline, a
 * highlight from the upper right, as the band is drawn), written as the
 * sprites are: a stroked path a colour, a run a row or a column of pixels.
 */
export type Pix = { w: number; h: number; px: (string | null)[] }

export const pix = (w: number, h: number): Pix => ({ w, h, px: new Array<string | null>(w * h).fill(null) })
export const pxAt = (p: Pix, x: number, y: number): string | null => (x >= 0 && y >= 0 && x < p.w && y < p.h ? (p.px[y * p.w + x] ?? null) : null)

export function put(p: Pix, x: number, y: number, c: string | null): void {
  if (c !== null && x >= 0 && y >= 0 && x < p.w && y < p.h) p.px[y * p.w + x] = c
}

/** Every pixel of a rectangle (both corners in), coloured by where it is. */
export function block(p: Pix, x0: number, y0: number, x1: number, y1: number, c: (x: number, y: number) => string | null): void {
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) put(p, x, y, c(x, y))
}

/** A filled ellipse round (cx, cy) in pixel edges, each pixel coloured by where it falls in it (u, v from -1 to 1). */
export function oval(p: Pix, cx: number, cy: number, rx: number, ry: number, c: (u: number, v: number) => string | null): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const u = (x + 0.5 - cx) / rx
      const v = (y + 0.5 - cy) / ry
      if (u * u + v * v <= 1) put(p, x, y, c(u, v))
    }
  }
}

/** A one-pixel line. */
export function pline(p: Pix, x0: number, y0: number, x1: number, y1: number, c: string): void {
  const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let k = 0; k <= n; k += 1) put(p, Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c)
}

/** The outline: every empty pixel beside a drawn one (above, below, left or right) in `c`. */
export function rim(p: Pix, c: string): void {
  const edge: number[] = []
  for (let y = 0; y < p.h; y += 1) {
    for (let x = 0; x < p.w; x += 1) {
      if (p.px[y * p.w + x] !== null) continue
      if (pxAt(p, x - 1, y) !== null || pxAt(p, x + 1, y) !== null || pxAt(p, x, y - 1) !== null || pxAt(p, x, y + 1) !== null) edge.push(y * p.w + x)
    }
  }
  for (const k of edge) p.px[k] = c
}

/** `top` laid over `p` (the same size). */
export function layOn(p: Pix, top: Pix): void {
  top.px.forEach((c, k) => {
    if (c !== null) p.px[k] = c
  })
}

/** Two numbers of a relative move, as short as a path takes them. */
export const pairOf = (a: number, b: number) => `${a}${b < 0 ? '' : ' '}${b}`

/**
 * The picture as the sprites are written: one stroked path a colour, its
 * pixels in runs along rows or along columns, whichever writes shorter. The
 * colours go most-drawn first, and a run of one may cross pixels of the
 * colours drawn after it (they paint over it), so the big areas take long
 * runs and the details sit on top.
 */
export function pixPaths(p: Pix): string {
  const byColor = new Map<string, number[]>()
  p.px.forEach((c, k) => {
    if (c === null) return
    const list = byColor.get(c) ?? []
    list.push(k)
    byColor.set(c, list)
  })
  const order = [...byColor.entries()].sort((x, y) => y[1].length - x[1].length || (x[0] < y[0] ? -1 : 1))
  const rank = new Map<string, number>()
  order.forEach(([c], r) => rank.set(c, r))
  let out = ''
  order.forEach(([c], r) => {
    const mine = (k: number) => p.px[k] === c
    const crosses = (k: number) => {
      const q = p.px[k]
      return q !== null && q !== undefined && (rank.get(q) ?? -1) > r
    }
    const runsAlong = (down: boolean) => {
      const lines = down ? p.w : p.h
      const along = down ? p.h : p.w
      const idx = (line: number, at: number) => (down ? at * p.w + line : line * p.w + at)
      let d = ''
      let lastLine = 0
      let lastAt = 0
      let started = false
      for (let line = 0; line < lines; line += 1) {
        let at = 0
        while (at < along) {
          if (!mine(idx(line, at))) {
            at += 1
            continue
          }
          // the run goes on over her own pixels and over those drawn after her, and ends on her own last
          let end = at + 1
          for (let k = at + 1; k < along; k += 1) {
            if (mine(idx(line, k))) end = k + 1
            else if (!crosses(idx(line, k))) break
          }
          const n = end - at
          if (down) d += started ? `m${pairOf(line - lastLine, at - lastAt)}v${n}` : `M${line}.5 ${at}v${n}`
          else d += started ? `m${pairOf(at - lastAt, line - lastLine)}h${n}` : `M${at} ${line}.5h${n}`
          started = true
          lastLine = line
          lastAt = end
          at = end
        }
      }
      return d
    }
    // or each run along a row or a column, whichever takes more of her pixels not drawn yet
    const mixed = () => {
      const done = new Set<number>()
      const run = (x: number, y: number, down: boolean) => {
        const along = down ? p.h - y : p.w - x
        const at = (k: number) => (down ? (y + k) * p.w + x : y * p.w + x + k)
        let end = 1
        let fresh = 1
        let seen = 1
        for (let k = 1; k < along; k += 1) {
          if (mine(at(k))) {
            end = k + 1
            if (!done.has(at(k))) seen += 1
            fresh = seen
          } else if (!crosses(at(k))) break
        }
        return { n: end, fresh, cells: Array.from({ length: end }, (_, k) => at(k)) }
      }
      const num = (n: number) => String(n).replace(/^(-?)0./, '$1.')
      let d = ''
      let penX = 0
      let penY = 0
      for (let k = 0; k < p.px.length; k += 1) {
        if (!mine(k) || done.has(k)) continue
        const x = k % p.w
        const y = Math.floor(k / p.w)
        const h = run(x, y, false)
        const v = run(x, y, true)
        const down = v.fresh > h.fresh
        const r = down ? v : h
        for (const cell of r.cells) done.add(cell)
        const sx = down ? x + 0.5 : x
        const sy = down ? y : y + 0.5
        d += d === '' ? `M${num(sx)} ${num(sy)}` : `m${num(sx - penX)}${sy - penY < 0 ? '' : ' '}${num(sy - penY)}`
        d += `${down ? 'v' : 'h'}${r.n}`
        penX = down ? sx : sx + r.n
        penY = down ? sy + r.n : sy
      }
      return d
    }
    const ways = [runsAlong(false), runsAlong(true), mixed()]
    out += `<path stroke="${c}" d="${ways.reduce((a, b) => (b.length < a.length ? b : a))}"/>`
  })
  return out
}

/** A box of pixels: its colour (or a fill), its left, top, width and height. */
export type Px4 = readonly [string, number, number, number, number]

/** Boxes of pixels as filled paths, in drawing order (the later over the earlier), the boxes of one colour in a row sharing a path. */
export function boxPaths(list: readonly Px4[]): string {
  let out = ''
  let color = ''
  let d = ''
  const flush = () => {
    if (d !== '') out += `<path fill="${color}" d="${d}"/>`
    d = ''
  }
  for (const [c, x, y, w, h] of list) {
    if (c !== color) {
      flush()
      color = c
    }
    d += `M${x} ${y}h${w}v${h}h${-w}z`
  }
  flush()
  return out
}

/** A picture placed on the stage: its top left at (x, y), drawn `z` pixels a pixel. */
export const placedArt = (x: number, y: number, z: number, body: string) => `<g transform="translate(${f(x)} ${f(y)}) scale(${z})">${body}</g>`

/**
 * The furniture spliced into the sprites' markup, each piece just after the
 * figure it stands before (the kit after Nijika, the mic after Kita), so a
 * figure in front of it stands over it and the figures behind stay behind:
 * `thens[k]` follows `parts[k]`, drawn or not (a part with no sprite, or left
 * out to fit, keeps its furniture). A drawn part with a wrap (`wraps[k]`, a
 * group's attributes: a clip, an id its copies use) is drawn inside that group.
 */
export function spliceAfter(markup: string, parts: readonly SpritePart[], thens: readonly string[], wraps: readonly string[] = []): string {
  const starts: number[] = []
  let from = 0
  for (const p of parts) {
    const z = p.zoom ?? 1
    let at = markup.indexOf(`<g transform="translate(${p.x} ${p.y})${z === 1 ? '' : ` scale(${z})`}">`, from)
    if (at >= 0) {
      if (p.dim === true && markup.slice(Math.max(0, at - DIM_GHOST.length), at) === DIM_GHOST) at -= DIM_GHOST.length
      from = at + 1
    }
    starts.push(at)
  }
  const end = markup.lastIndexOf('</g>')
  let out = markup
  for (let k = parts.length - 1; k >= 0; k -= 1) {
    const start = starts[k] ?? -1
    const wrap = start >= 0 ? (wraps[k] ?? '') : ''
    const then = (wrap === '' ? '' : '</g>') + (thens[k] ?? '')
    if (then !== '') {
      const next = starts.slice(k + 1).find(s => s >= 0) ?? end
      out = out.slice(0, next) + then + out.slice(next)
    }
    if (wrap !== '') out = `${out.slice(0, start)}<g ${wrap}>${out.slice(start)}`
  }
  return out
}

/** The sprites' dimmed wrapper as `fitSprites` writes it. */
export const DIM_GHOST = '<g opacity="0.35" filter="url(#kessoku-dim)">'
