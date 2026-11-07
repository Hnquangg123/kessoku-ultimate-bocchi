// Kessoku Ultimate Bocchi Theme: text and markup for the pictures a surface draws as Svg.
//
// Pure, no `$` and no `on`: what scene.ts and hotpot.ts both write their
// pictures with. Numbers and text as markup (`f`, `esc`); a standalone
// document held to the element's limit (`svgDoc`, `capped`); the fonts and
// the two voices (`TEXT_CSS`); each face's advance widths as Chrome on
// Windows measures them (`textWidth`), wrapping and clipping by measured
// width; the text helpers (`T`, `runs`, `fixedT`, `sansLine`); the
// four-point sparkle. A leaf: it imports nothing of scene.ts.

import { SVG_LIMIT } from './sprite'

// ---- Type: advance widths per 100 px of font size, measured in Chrome on Windows -------------

export type Face = 'ink' | 'ui' | 'uib' | 'script' | 'bahn'

const GLYPHS = "0123456789 !\"#$%&'()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~·…—–’“”♪✓✗×≈"
const ADV: Record<Face, readonly number[]> = {
  ink: [56, 44, 69, 70, 70, 55, 58, 59, 69, 62, 29, 20, 34, 61, 55, 99, 64, 21, 41, 41, 36, 47, 21, 34, 21, 36, 21, 21, 48, 49, 48, 50, 100, 62, 69, 55, 65, 59, 59, 73, 68, 66, 58, 58, 58, 81, 69, 72, 56, 71, 63, 55, 71, 65, 55, 71, 39, 49, 60, 41, 36, 41, 48, 47, 46, 53, 51, 37, 48, 46, 42, 54, 56, 22, 22, 48, 20, 75, 46, 43, 52, 48, 41, 45, 49, 50, 54, 71, 39, 43, 53, 41, 36, 41, 57, 21, 64, 100, 50, 23, 39, 39, 50, 75, 82, 47, 55],
  ui: [54, 54, 54, 54, 54, 54, 54, 54, 54, 54, 27, 28, 39, 59, 54, 82, 80, 23, 30, 30, 42, 68, 22, 40, 22, 39, 22, 22, 68, 68, 68, 45, 96, 65, 57, 62, 70, 51, 49, 69, 71, 27, 36, 58, 47, 90, 75, 75, 56, 75, 60, 53, 52, 69, 62, 93, 59, 55, 57, 30, 38, 30, 68, 42, 27, 51, 59, 46, 59, 52, 31, 59, 57, 24, 24, 50, 24, 86, 57, 59, 59, 59, 35, 42, 34, 57, 48, 72, 46, 48, 45, 30, 24, 30, 68, 22, 73, 100, 50, 23, 38, 38, 50, 75, 82, 68, 69],
  uib: [56, 40, 56, 56, 58, 56, 56, 54, 56, 56, 27, 30, 44, 59, 56, 84, 72, 26, 33, 33, 43, 69, 24, 40, 24, 41, 24, 24, 69, 69, 69, 44, 95, 67, 60, 62, 72, 52, 50, 70, 74, 29, 40, 61, 49, 92, 77, 76, 58, 76, 62, 54, 55, 70, 64, 97, 62, 58, 59, 33, 40, 33, 69, 42, 29, 52, 60, 47, 60, 53, 34, 60, 58, 26, 26, 52, 26, 89, 58, 60, 60, 60, 37, 43, 36, 58, 51, 76, 50, 51, 46, 33, 28, 33, 69, 24, 81, 100, 50, 26, 43, 43, 50, 75, 82, 69, 70],
  script: [73, 73, 73, 73, 73, 73, 73, 73, 73, 73, 40, 32, 40, 80, 55, 73, 92, 23, 40, 36, 51, 57, 34, 64, 25, 58, 30, 33, 54, 63, 57, 52, 82, 84, 75, 74, 87, 75, 58, 80, 82, 31, 61, 78, 68, 100, 84, 80, 78, 83, 88, 61, 70, 77, 73, 101, 73, 68, 85, 41, 55, 42, 58, 42, 31, 61, 54, 55, 71, 52, 39, 53, 65, 38, 30, 65, 40, 111, 73, 52, 62, 56, 54, 39, 45, 70, 60, 83, 71, 61, 69, 42, 32, 40, 78, 26, 81, 114, 81, 24, 58, 57, 66, 75, 82, 57, 73],
  bahn: [55, 33, 52, 53, 57, 54, 51, 50, 56, 51, 27, 27, 38, 62, 58, 69, 65, 18, 34, 34, 43, 53, 23, 48, 23, 38, 23, 23, 42, 46, 43, 43, 89, 65, 65, 62, 66, 60, 56, 65, 68, 28, 51, 64, 57, 78, 70, 65, 62, 66, 65, 62, 48, 66, 59, 85, 57, 50, 54, 29, 38, 29, 50, 44, 29, 53, 54, 50, 54, 54, 32, 54, 56, 25, 27, 53, 29, 86, 56, 54, 54, 54, 43, 52, 33, 56, 50, 77, 52, 48, 49, 36, 28, 36, 51, 21, 58, 86, 56, 18, 32, 32, 50, 75, 82, 50, 55],
}
const GLYPH_AT = new Map<string, number>([...GLYPHS].map((c, i) => [c, i]))

/** A full-width character (CJK, kana, hangul, full-width forms, emoji): one em wide. */
function isWide(cp: number): boolean {
  return (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6) || (cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x20000 && cp <= 0x3fffd)
}

/** One character's advance in a face, per 100 px; the sans faces' digits tabular. */
export function advance(ch: string, face: Face): number {
  const i = GLYPH_AT.get(ch)
  if (i !== undefined) {
    if (i < 10 && face === 'ui') return 54
    if (i < 10 && face === 'uib') return 56
    return ADV[face][i] ?? 60
  }
  const cp = ch.codePointAt(0) ?? 0
  return isWide(cp) ? 100 : face === 'ink' ? 58 : 62
}

/** A string's width in CSS pixels in a face (`ink` the chalk hand, `ui` the sans, `uib` its semibold, `script` the neon, `bahn` the lamp). */
export function textWidth(s: string, face: Face, size: number): number {
  let w = 0
  for (const ch of s) w += advance(ch, face)
  return (w / 100) * size
}

const KATAKANA = /[゠-ヿㇰ-ㇿｦ-ﾟ]/
/** Where CJK text breaks best: after its own punctuation. */
const CJK_STOP = /[、。，．！？」』）〕】]/
/** Where a path or a long name breaks best: after a slash, then after a dash, a dot or an underscore. */
const PATH_STOP = /[/\\]/
const NAME_STOP = /[-._]/

/**
 * A word too wide for a line, broken by width: never inside a run of
 * katakana; in CJK text after its punctuation (、。) where that leaves the
 * line at least half full; in a path after a slash (else a dash, a dot, an
 * underscore) where that leaves it a third full, so a file's name stays whole
 * when it can. The first piece may have a narrower room.
 */
function breakWord(word: string, face: Face, size: number, max: number, firstMax = max): string[] {
  const units: string[] = []
  for (const ch of word) {
    const last = units[units.length - 1]
    if (KATAKANA.test(ch) && last !== undefined && KATAKANA.test(last.slice(-1))) units[units.length - 1] = last + ch
    else units.push(ch)
  }
  const parts: string[] = []
  const room = () => (parts.length === 0 ? firstMax : max)
  let cur = ''
  let w = 0
  let stop = -1
  let stopW = 0
  // how full a line must be for a break at its stop: half for CJK punctuation, a third for a path's
  let stopFill = 0.5
  let slash = false
  const flush = () => {
    if (cur !== '') parts.push(cur)
    cur = ''
    w = 0
    stop = -1
    slash = false
  }
  for (const u of units) {
    const uw = textWidth(u, face, size)
    if (cur !== '' && w + uw > room()) {
      if (stop > 0 && stop < cur.length && stopW >= room() * stopFill) {
        const rest = cur.slice(stop)
        cur = cur.slice(0, stop)
        flush()
        cur = rest
        w = textWidth(rest, face, size)
        if (w + uw > room()) flush()
      } else flush()
    }
    if (uw > room()) {
      // a run too long for any line (a long katakana word, a path): by character after all
      for (const ch of u) {
        const cw = (advance(ch, face) / 100) * size
        if (cur !== '' && w + cw > room()) flush()
        cur += ch
        w += cw
      }
      continue
    }
    cur += u
    w += uw
    if (CJK_STOP.test(u)) {
      stop = cur.length
      stopW = w
      stopFill = 0.5
    } else if (PATH_STOP.test(u) || (NAME_STOP.test(u) && !slash)) {
      // a slash outranks a dash before it; after a slash, a dash in the file's name breaks only as a last resort
      if (PATH_STOP.test(u)) slash = true
      stop = cur.length
      stopW = w
      stopFill = 0.34
    }
  }
  flush()
  return parts
}

/**
 * Greedy wrap by measured width (the first line may be narrower), at most
 * `maxLines`; a cut text ends its last line in an ellipsis.
 */
export function wrapText(text: string, face: Face, size: number, max: number, firstMax = max, maxLines = 99): string[] {
  return wrapLines(text, face, size, max, firstMax, maxLines).lines
}

/** `wrapText`, and whether the text was cut. */
export function wrapLines(text: string, face: Face, size: number, max: number, firstMax = max, maxLines = 99): { lines: string[]; cut: boolean } {
  const out: string[] = []
  let line = ''
  const room = () => (out.length === 0 ? firstMax : max)
  const words = text.split(/\s+/).filter(w => w !== '')
  let cut = false
  for (const word of words) {
    if (out.length >= maxLines) {
      cut = true
      break
    }
    const next = line === '' ? word : `${line} ${word}`
    if (textWidth(next, face, size) <= room()) {
      line = next
      continue
    }
    // a path too long for any line starts on this one (`Edit studio/out/` then the rest), broken after a slash
    const left = room() - textWidth(`${line} `, face, size)
    if (line !== '' && /[/\\]/.test(word) && textWidth(word, face, size) > max && left >= room() * 0.3) {
      const pieces = breakWord(word, face, size, max, left)
      const head = pieces[0] ?? ''
      if (pieces.length > 1 && /[/\\]$/.test(head)) {
        out.push(`${line} ${head}`)
        line = ''
        for (let k = 1; k < pieces.length - 1; k += 1) {
          if (out.length >= maxLines) break
          out.push(pieces[k] ?? '')
        }
        if (out.length >= maxLines) {
          cut = true
          break
        }
        line = pieces[pieces.length - 1] ?? ''
        continue
      }
    }
    if (line !== '') {
      out.push(line)
      line = ''
      if (out.length >= maxLines) {
        cut = true
        break
      }
    }
    if (textWidth(word, face, size) <= room()) {
      line = word
      continue
    }
    const pieces = breakWord(word, face, size, max, room())
    for (let k = 0; k < pieces.length - 1; k += 1) {
      out.push(pieces[k] ?? '')
      if (out.length >= maxLines) {
        cut = true
        break
      }
    }
    if (cut) break
    line = pieces[pieces.length - 1] ?? ''
  }
  if (!cut && line !== '') {
    if (out.length >= maxLines) cut = true
    else out.push(line)
  }
  if (cut && out.length > 0) {
    const last = out.length - 1
    out[last] = clipEnd(`${out[last] ?? ''}…`, face, size, last === 0 ? firstMax : max)
  }
  return { lines: out, cut }
}

/** Cut to a width with an ellipsis. */
export function clipEnd(text: string, face: Face, size: number, max: number): string {
  if (textWidth(text, face, size) <= max) return text
  const ell = textWidth('…', face, size)
  let out = ''
  let w = 0
  for (const ch of text) {
    const cw = (advance(ch, face) / 100) * size
    if (w + cw + ell > max) break
    out += ch
    w += cw
  }
  return `${out.trimEnd()}…`
}

export const f = (n: number) => String(Math.round(n * 10) / 10)
/** Text as XML: escaped, and free of what XML cannot hold (control characters, lone surrogates). */
export const esc = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '')
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** A four-point sparkle. */
export function sparkleD(x: number, y: number, r: number): string {
  const k = r * 0.2
  return `M${f(x)} ${f(y - r)}Q${f(x + k)} ${f(y - k)} ${f(x + r)} ${f(y)}Q${f(x + k)} ${f(y + k)} ${f(x)} ${f(y + r)}Q${f(x - k)} ${f(y + k)} ${f(x - r)} ${f(y)}Q${f(x - k)} ${f(y - k)} ${f(x)} ${f(y - r)}z`
}
export function sparkle(x: number, y: number, r: number, fill: string, cls = ''): string {
  return `<path${cls === '' ? '' : ` class="${cls}"`} d="${sparkleD(x, y, r)}" fill="${fill}"/>`
}

/** One standalone SVG document: the layout's width in its viewBox, four times that as its size, so a surface scales it down. */
export function svgDoc(W: number, H: number, body: string, css = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W * 4)}" height="${f(H * 4)}">${css === '' ? '' : `<style>${css}</style>`}${body}</svg>`
}

/** A picture held to the element's limit: past it, the simpler drawing (which must fit). */
export function capped(svg: string, simpler: () => string): string {
  return svg.length <= SVG_LIMIT ? svg : simpler()
}

export const SANS = `'Segoe UI', system-ui, -apple-system, sans-serif`
export const CHALK_HAND = `'Ink Free', 'Segoe Print', 'Chalkboard SE', 'Comic Sans MS', cursive`
export const SCRIPT = `'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive`
export const LAMP_FACE = `Bahnschrift, 'DIN Alternate', 'Arial Narrow', 'Segoe UI', sans-serif`
/** The two voices: `.u` the tabular sans for numbers and meta, `.c` the chalk hand for titles. */
export const TEXT_CSS = `.u{font-family:${SANS};font-variant-numeric:tabular-nums}.c{font-family:${CHALK_HAND}}`

/** The text helper: a `<text>` in a voice (`u` sans, `c` chalk). */
export function T(x: number, y: number, s: string, size: number, fill: string, cls: 'u' | 'c', extra = ''): string {
  return `<text class="${cls}" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" fill="${fill}"${extra}>${esc(s)}</text>`
}

/** A run of a line: its words, its colour, bold, faded. */
export type Seg = { t: string; c: string; bold?: boolean; fixed?: boolean; faded?: boolean }

/**
 * A line of runs flowing in one `<text>` (the face lays them out, so no run
 * can overlap the next), anchored at x. Given its `room`, a line close to it
 * is held to its measured width, so a wider fallback face (SF, Roboto,
 * Verdana) squeezes instead of running into its neighbour.
 */
export function runs(x: number, y: number, segs: readonly Seg[], size: number, anchor: 'start' | 'middle' | 'end' = 'start', extra = '', room = 0): string {
  const spans = segs.map(s => `<tspan fill="${s.c}"${s.bold === true ? ' font-weight="600"' : ''}${s.faded === true ? ' fill-opacity=".42"' : ''}>${esc(s.t)}</tspan>`).join('')
  const w = runsWidth(segs, size)
  const guard = room > 0 && w > room * 0.86 ? ` textLength="${f(Math.min(w, room))}" lengthAdjust="spacingAndGlyphs"` : ''
  return `<text class="u" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" style="white-space:pre"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${guard}${extra}>${spans}</text>`
}

/** How wide a line of runs is. */
export function runsWidth(segs: readonly Seg[], size: number): number {
  return segs.reduce((w, s) => w + textWidth(s.t, s.bold === true ? 'uib' : 'ui', size), 0)
}

/** A sans text held to exactly its measured width: for the few words laid out against their neighbours (the strip's head). */
export function fixedT(x: number, y: number, s: string, size: number, fill: string, face: 'ui' | 'uib', extra = ''): string {
  return T(x, y, s, size, fill, 'u', ` textLength="${f(textWidth(s, face, size))}" lengthAdjust="spacingAndGlyphs"${face === 'uib' ? ' font-weight="600"' : ''}${extra}`)
}

/** A sans line close to its room held to its measured width (a wider fallback face squeezes to fit). */
export function sansLine(x: number, y: number, s: string, size: number, fill: string, room: number, extra = '', face: Face = 'ui'): string {
  const w = textWidth(s, face, size)
  const guard = w > room * 0.86 ? ` textLength="${f(Math.min(w, room))}" lengthAdjust="spacingAndGlyphs"` : ''
  return T(x, y, s, size, fill, 'u', `${guard}${face === 'uib' ? ' font-weight="600"' : ''}${extra}`)
}
