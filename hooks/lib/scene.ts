// Kessoku Ultimate Bocchi Theme: the band at STARRY, drawn for a surface that draws Svg.
//
// Pure, no `$` and no `on`: the panel as a live house, a stage under neon
// with the band and their slimes, the plates under it, and a chalkboard
// setlist where every act is a song. Each function turns the panel's view
// (hooks/lib/stage.ts) into the source of one Svg element; the hooks module
// stacks them edge to edge in Boxes painted the scene's own colours, so a
// seam between two pictures reads as the wall or the board.
//
// The stage is the one moving picture (its sprites and lights animate, SMIL
// and CSS inside the image): it carries no clock and no cost, so its source
// changes only when a mood, a light, a slime, a failure mark, the air or the
// solo does, and an unchanged stage is the same string (memoised) and never
// sent again, so a redraw never restarts its motion. Every other picture may
// change at each redraw.
//
// Every picture is a standalone SVG document: `viewBox="0 0 W H"` with W the
// layout's width, and a width and height four times that, so a surface
// scales it down to whatever slot it is drawn in. The board's slices (head,
// songs, details, foot) each paint the green full bleed and place the
// chalk's texture in board coordinates (`translate(0, -y)`), so the songs
// read as one board however they are stacked.

import type { ActView, MemberView, PanelView } from './stage'
import { animOf, fitSprites, framePixels, SVG_LIMIT } from './sprite'
import type { SpritePart } from './sprite'
import { fmtUsd } from './band'

/** One Svg element's drawing: its source, the words a reader gets for it, and its height in layout units. */
export type SceneSvg = { svg: string; alt: string; height: number }

/**
 * How wide the pictures are laid out, in CSS pixels at 1:1. Every picture
 * declares a large width, so a surface scales it to the slot it is drawn in;
 * the layout width is only what the wrapping and the type sizes are chosen for.
 */
export type SceneLayout = { width: number }

/** The layout for a pane `bodyColumns` cells wide (the desktop's cells are about 7.5 CSS pixels). */
export function layoutFor(bodyColumns: number): SceneLayout {
  return { width: Math.max(340, Math.min(1080, Math.round(bodyColumns * 7.5))) }
}

/**
 * How much narrower the board's pictures are than the pane, in layout pixels:
 * the wooden frame around them, its Box's 1 px border and one cell (about 7
 * px) of wood each side. A song's Box has no border of its own (a desktop pads
 * a bordered Box), so every slice of the board is drawn at one width.
 */
export const BOARD_INSET = 16

/** The layout the board's pictures (head, songs, details, foot) are drawn for: the pane's, less the frame around them. */
export function boardLayout(layout: SceneLayout): SceneLayout {
  return { width: Math.max(300, layout.width - BOARD_INSET) }
}

/**
 * The colours the Boxes around the pictures are painted, so a seam between
 * two pictures reads as the scene: the wall, the board's green, the board's
 * wooden frame and its dark edge, the plates.
 */
export const SCENE_COLORS = { wall: '#17121a', board: '#24302a', wood: '#7a5233', woodEdge: '#3a2414', plate: '#151117' } as const

/**
 * How a song's Box, the hover scope that opens it, is painted. Its picture is
 * a stencil: the board's green, painted fully round a hand-drawn chalk box,
 * a shade thinner inside it, and not at all along the box's lines. At rest the
 * Box is the board's green (`color`), so nothing shows; under the pointer it
 * is her chalk (`hover`), which shows through the stencil as the box's chalk
 * lines and, a shade, as the wash inside them (`wash`, what that mixes to).
 * Her details, revealed under it, paint the box's sides and foot themselves;
 * their Box is `ground` (the board's green as its chalk dust leaves it on
 * average), which the native row under the card (its button) stands on.
 * `chalk` is the colour her card's words are in (its button's label).
 */
export type SongLook = { color: string; hover: string; wash: string; ground: string; chalk: string }

export function songLook(act: ActView): SongLook {
  const c = chalkOf(act.member)
  const line = cardLine(act.member)
  return { color: SCENE_COLORS.board, hover: line, wash: shadeToward(SCENE_COLORS.board, line, CARD_WASH), ground: BOARD_DUSTED, chalk: c }
}

/** The board's green under its chalk dust, on average (measured on the drawn board): a native row's ground on the board. */
const BOARD_DUSTED = '#28342d'

/** The card's chalk line: her chalk, a little whiter, as a fresh stroke reads. */
const cardLine = (m: Member) => shadeToward(chalkOf(m), '#ffffff', 0.2)
/** How much of her chalk the wash inside the card mixes into the green. */
const CARD_WASH = 0.085
/** The card's chalk box: its sides `inset` from the board's edges, its top line at `top`, the second pass `gap` inside the first. */
const CARD = { inset: 3.5, top: 1.7, gap: 1.7 } as const

/** Which songs the board lists, in order; how many earlier ones fold into one line; whether every song shows its details. */
export type BoardPlan = { songs: ActView[]; folded: number; expanded: boolean }

type Member = ActView['member']

// ---- The setlist's order ---------------------------------------------------------------

/**
 * When an act started (live) or ended, in seconds into the set, for ordering:
 * `5:14` into the set, `1h04m`, `2d 3h`; an act from before the set (`2:40 ago`)
 * sorts before every act of the set, the longer ago the earlier.
 */
function atSeconds(at: string): number {
  const ago = /\s*ago\s*$/.test(at)
  const s = at.replace(/\s*ago\s*$/, '').trim()
  let n = 0
  const ms = /^(\d+):(\d{2})$/.exec(s)
  const hm = /^(\d+)h(\d{2})m$/.exec(s)
  const dh = /^(\d+)d\s*(\d+)h$/.exec(s)
  if (ms) n = Number(ms[1]) * 60 + Number(ms[2])
  else if (hm) n = Number(hm[1]) * 3600 + Number(hm[2]) * 60
  else if (dh) n = Number(dh[1]) * 86400 + Number(dh[2]) * 3600
  return ago ? -1e9 - n : n
}

const newestFirst = (x: ActView, y: ActView) => atSeconds(y.at) - atSeconds(x.at)

// ---- What an act's state means on the panel ----------------------------------------------------

/**
 * A real failure: an act that ended in an error or a refusal (its status
 * says so). A failing tool call (`hadError`, which the mod never clears) in a
 * live act, the main loop, an act that answered anyway (`encore!`) or one the
 * person stopped is no failure here; its error gets a line of its own.
 */
function hardFail(a: ActView): boolean {
  return a.isFailed && !a.isLive && a.id !== 'main' && oneLine(a.reason) !== 'encore!' && !/^stopped:\s*(aborted|interrupted|killed)\b/.test(a.reason)
}

/**
 * A failure that counts: a real one in the set on now. An earlier set's
 * failure keeps its red mark on its own song, but is no longer counted,
 * pilled, bubbled on stage or hoisted to the top of the board.
 */
const setFail = (a: ActView) => hardFail(a) && a.inSet

/** An act that hit a failing tool call and carried on (or answered, or was stopped). */
const toolErr = (a: ActView) => (a.hadError || a.isFailed) && !hardFail(a)

/** Her state as the panel shows it: a stuck error flag never turns a finished act into a failure. */
function shownState(a: ActView): ActView['state'] {
  if (a.state !== 'failed' || hardFail(a)) return a.state
  return /^stopped:/.test(a.reason) ? 'stopped' : 'done'
}

/** An act in its encore: it answered a moment ago (a failure or a stop that just ended is no encore). */
const encoreOf = (a: ActView) => a.isEncore && shownState(a) === 'done'

/** The mix's order: the main loop, the playing, the waiting (newest first), this set's failed, then the rest (an earlier set's failures with them) newest first. */
function mixOrder(all: readonly ActView[]): ActView[] {
  const live = all.filter(a => a.isLive)
  const main = live.filter(a => a.id === 'main')
  const playing = live.filter(a => a.id !== 'main' && shownState(a) === 'playing').sort(newestFirst)
  const waiting = live.filter(a => a.id !== 'main' && shownState(a) !== 'playing').sort(newestFirst)
  const failed = all.filter(a => !a.isLive && setFail(a)).sort(newestFirst)
  const rest = all.filter(a => !a.isLive && !setFail(a)).sort(newestFirst)
  return [...main, ...playing, ...waiting, ...failed, ...rest]
}

/**
 * The setlist: the songs playing or waiting first (the main loop, then the
 * playing ones, then the waiting, newest first), then this set's failed ones,
 * then the rest newest first, at most `maxSongs`, the rest folding into one line
 * that says what folded. On a solo, her acts alone (the main loop for
 * Bocchi), the pressed one first and the rest in the mix's order, every one
 * expanded.
 */
export function boardPlan(view: PanelView, maxSongs = 8): BoardPlan {
  const cap = Math.max(1, Math.floor(maxSongs))
  const solo = view.members.find(m => m.isSolo)
  if (solo !== undefined) {
    const first = view.soloAct === null ? undefined : solo.acts.find(a => a.id === view.soloAct)
    const ordered = [...(first === undefined ? [] : [first]), ...mixOrder(solo.acts.filter(a => a !== first))]
    return { songs: ordered.slice(0, cap), folded: Math.max(0, ordered.length - cap), expanded: true }
  }
  const ordered = mixOrder(view.members.flatMap(m => m.acts))
  return { songs: ordered.slice(0, cap), folded: Math.max(0, ordered.length - cap), expanded: false }
}

// ---- Type: advance widths per 100 px of font size, measured in Chrome on Windows -------------

type Face = 'ink' | 'ui' | 'uib' | 'script' | 'bahn'

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
function advance(ch: string, face: Face): number {
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
function wrapText(text: string, face: Face, size: number, max: number, firstMax = max, maxLines = 99): string[] {
  return wrapLines(text, face, size, max, firstMax, maxLines).lines
}

/** `wrapText`, and whether the text was cut. */
function wrapLines(text: string, face: Face, size: number, max: number, firstMax = max, maxLines = 99): { lines: string[]; cut: boolean } {
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
function clipEnd(text: string, face: Face, size: number, max: number): string {
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

/**
 * A tool call's words fitted to a width, keeping what matters: the verb and
 * the file's name (`Edit …/lib/register.tsx`, `Edit …/register.tsx`), the
 * name's middle given up last, the end of anything else.
 */
function fitTool(text: string, face: Face, size: number, max: number): string {
  if (textWidth(text, face, size) <= max) return text
  const m = /^(\S+)\s+(.+)$/.exec(text)
  if (m !== null && (m[2] ?? '').includes('/') && !/\s/.test((m[2] ?? '').trim())) {
    const verb = m[1] ?? ''
    const segs = (m[2] ?? '').split('/')
    for (let k = 1; k < segs.length; k += 1) {
      const cand = `${verb} …/${segs.slice(k).join('/')}`
      if (textWidth(cand, face, size) <= max) return cand
    }
    const file = segs[segs.length - 1] ?? ''
    const dot = file.lastIndexOf('.')
    const ext = dot > 0 && file.length - dot <= 6 ? file.slice(dot) : ''
    const stem = ext === '' ? file : file.slice(0, dot)
    const head = `${verb} …/`
    const room = max - textWidth(head, face, size) - textWidth(ext, face, size)
    if (room > textWidth('ab…', face, size)) return `${head}${clipEnd(stem, face, size, room)}${ext}`
  }
  return clipEnd(text, face, size, max)
}

/**
 * Items joined by a separator, wrapped into as few lines as the width
 * allows and balanced so no line is left with a lone item while another
 * holds many.
 */
function balanceItems(items: string[], sep: string, face: Face, size: number, max: number): string[] {
  const pack = (limit: number) => {
    const lines: string[] = []
    for (const it of items) {
      const last = lines[lines.length - 1]
      if (last !== undefined && textWidth(`${last}${sep}${it}`, face, size) <= limit) lines[lines.length - 1] = `${last}${sep}${it}`
      else lines.push(it)
    }
    return lines
  }
  const greedy = pack(max)
  if (greedy.length <= 1) return greedy
  let lo = 0
  let hi = max
  for (let i = 0; i < 14; i += 1) {
    const mid = (lo + hi) / 2
    if (pack(mid).length <= greedy.length) hi = mid
    else lo = mid
  }
  return pack(hi)
}

// ---- Markup helpers ---------------------------------------------------------------------------

const f = (n: number) => String(Math.round(n * 10) / 10)
/** Text as XML: escaped, and free of what XML cannot hold (control characters, lone surrogates). */
const esc = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '')
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
/** A text as one line: whitespace runs as one space. */
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Seeded pseudo-random, so the same chalk wobbles the same way every redraw. */
function rng(seed: string): () => number {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A hand-drawn line: quadratic wobbles between the ends. */
function wobble(x1: number, y1: number, x2: number, y2: number, seed: string, amp = 0.9, step = 18): string {
  const r = rng(seed)
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step))
  let d = `M${f(x1)} ${f(y1)}`
  for (let i = 1; i <= n; i += 1) {
    const t = i / n
    const tm = (i - 0.5) / n
    d += `Q${f(x1 + (x2 - x1) * tm + (r() - 0.5) * amp)} ${f(y1 + (y2 - y1) * tm + (r() - 0.5) * amp * 2)} ${f(x1 + (x2 - x1) * t)} ${f(y1 + (y2 - y1) * t + (i === n ? 0 : (r() - 0.5) * amp))}`
  }
  return d
}

/** A wavy underline from x over w at y: the red chalk under a failed song. */
function wave(x: number, y: number, w: number, amp = 1.7, half = 3): string {
  const n = Math.max(2, Math.round(w / half))
  return `M${f(x)} ${f(y)}q${f(half / 2)} ${f(-amp * 1.4)} ${f(half)} 0${`t${f(half)} 0`.repeat(n - 1)}`
}

/** A four-point sparkle. */
function sparkleD(x: number, y: number, r: number): string {
  const k = r * 0.2
  return `M${f(x)} ${f(y - r)}Q${f(x + k)} ${f(y - k)} ${f(x + r)} ${f(y)}Q${f(x + k)} ${f(y + k)} ${f(x)} ${f(y + r)}Q${f(x - k)} ${f(y + k)} ${f(x - r)} ${f(y)}Q${f(x - k)} ${f(y - k)} ${f(x)} ${f(y - r)}z`
}
function sparkle(x: number, y: number, r: number, fill: string, cls = ''): string {
  return `<path${cls === '' ? '' : ` class="${cls}"`} d="${sparkleD(x, y, r)}" fill="${fill}"/>`
}

/** One standalone SVG document: the layout's width in its viewBox, four times that as its size, so a surface scales it down. */
function svgDoc(W: number, H: number, body: string, css = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W * 4)}" height="${f(H * 4)}">${css === '' ? '' : `<style>${css}</style>`}${body}</svg>`
}

/** A picture held to the element's limit: past it, the simpler drawing (which must fit). */
function capped(svg: string, simpler: () => string): string {
  return svg.length <= SVG_LIMIT ? svg : simpler()
}

// ---- The look --------------------------------------------------------------------------------

const SANS = `'Segoe UI', system-ui, -apple-system, sans-serif`
const CHALK_HAND = `'Ink Free', 'Segoe Print', 'Chalkboard SE', 'Comic Sans MS', cursive`
const SCRIPT = `'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive`
const LAMP_FACE = `Bahnschrift, 'DIN Alternate', 'Arial Narrow', 'Segoe UI', sans-serif`
/** The two voices: `.u` the tabular sans for numbers and meta, `.c` the chalk hand for titles. */
const TEXT_CSS = `.u{font-family:${SANS};font-variant-numeric:tabular-nums}.c{font-family:${CHALK_HAND}}`

/** Each member's colour as chalk reads it on the slate. */
const CHALK: Record<Member, string> = { bocchi: '#ffc6de', nijika: '#ffe39a', ryo: '#bcd4ff', kita: '#ffb79e' }
const NEON: Record<Member, string> = { bocchi: '#f7a8c9', nijika: '#ffd166', ryo: '#8fb8ff', kita: '#ff8a65' }
const NAME: Record<Member, string> = { bocchi: 'Bocchi', nijika: 'Nijika', ryo: 'Ryo', kita: 'Kita' }
const WHITE = '#f3f0e8'
const SOFT = '#d6d9d0'
const LABEL = '#a2b1a7'
const FAINT = '#7c8a81'
const RED = '#ff8090'
const RED_DEEP = '#ff5d73'
const MINT = '#a9f0c6'

const chalkOf = (m: Member) => CHALK[m] ?? WHITE
const neonOf = (m: Member) => NEON[m] ?? '#f7a8c9'

/** The text helper: a `<text>` in a voice (`u` sans, `c` chalk). */
function T(x: number, y: number, s: string, size: number, fill: string, cls: 'u' | 'c', extra = ''): string {
  return `<text class="${cls}" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" fill="${fill}"${extra}>${esc(s)}</text>`
}

/** A run of a line: its words, its colour, bold, faded. */
type Seg = { t: string; c: string; bold?: boolean; fixed?: boolean; faded?: boolean }

/**
 * A line of runs flowing in one `<text>` (the face lays them out, so no run
 * can overlap the next), anchored at x. Given its `room`, a line close to it
 * is held to its measured width, so a wider fallback face (SF, Roboto,
 * Verdana) squeezes instead of running into its neighbour.
 */
function runs(x: number, y: number, segs: readonly Seg[], size: number, anchor: 'start' | 'middle' | 'end' = 'start', extra = '', room = 0): string {
  const spans = segs.map(s => `<tspan fill="${s.c}"${s.bold === true ? ' font-weight="600"' : ''}${s.faded === true ? ' fill-opacity=".42"' : ''}>${esc(s.t)}</tspan>`).join('')
  const w = runsWidth(segs, size)
  const guard = room > 0 && w > room * 0.86 ? ` textLength="${f(Math.min(w, room))}" lengthAdjust="spacingAndGlyphs"` : ''
  return `<text class="u" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" style="white-space:pre"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${guard}${extra}>${spans}</text>`
}

/** How wide a line of runs is. */
function runsWidth(segs: readonly Seg[], size: number): number {
  return segs.reduce((w, s) => w + textWidth(s.t, s.bold === true ? 'uib' : 'ui', size), 0)
}

/** A sans text held to exactly its measured width: for the few words laid out against their neighbours (the strip's head). */
function fixedT(x: number, y: number, s: string, size: number, fill: string, face: 'ui' | 'uib', extra = ''): string {
  return T(x, y, s, size, fill, 'u', ` textLength="${f(textWidth(s, face, size))}" lengthAdjust="spacingAndGlyphs"${face === 'uib' ? ' font-weight="600"' : ''}${extra}`)
}

/** A context % as words, never `NaN%`. */
const pctText = (p: number) => `${Number.isFinite(p) ? Math.max(0, Math.round(p)) : 0}%`

/** A chalk line held to its measured width, so a wider fallback hand squeezes instead of running over. */
function chalkLine(x: number, y: number, s: string, size: number, fill: string, extra = ''): string {
  const w = textWidth(s, 'ink', size)
  return T(x, y, s, size, fill, 'c', ` textLength="${f(w)}" lengthAdjust="spacingAndGlyphs"${extra}`)
}

/** A sans line close to its room held to its measured width (a wider fallback face squeezes to fit). */
function sansLine(x: number, y: number, s: string, size: number, fill: string, room: number, extra = '', face: Face = 'ui'): string {
  const w = textWidth(s, face, size)
  const guard = w > room * 0.86 ? ` textLength="${f(Math.min(w, room))}" lengthAdjust="spacingAndGlyphs"` : ''
  return T(x, y, s, size, fill, 'u', `${guard}${face === 'uib' ? ' font-weight="600"' : ''}${extra}`)
}

/** `claude-sonnet-5-5` as `sonnet 5.5`. */
function modelName(m: string): string {
  return m.replace(/^claude-/, '').replace(/-(\d+)-(\d+)(?:-\d{6,})?$/, ' $1.$2').replace(/-(\d{6,})$/, '')
}

/** An agent type in a word: `kessoku-ultimate-bocchi:ryo` as `ryo`, `main` as `main loop`. */
function typeName(t: string): string {
  if (t === 'main') return 'main loop'
  const tail = t.includes(':') ? t.slice(t.lastIndexOf(':') + 1) : t
  return tail === '' ? 'agent' : tail
}

/**
 * The set's last error when it is this act's, as `Tool: what went wrong`
 * (the member's name dropped): only an act with an error (a failing tool
 * call it carried on from, or a failure) has one; a subagent's is written
 * `Tool (Name): …` and counts for her newest act with an error; the main
 * loop's has no name.
 */
function ownError(view: PanelView, act: ActView): string {
  const e = oneLine(view.lastError)
  if (e === '' || !(act.hadError || act.isFailed)) return ''
  const sub = /^(\S+)\s*\(([^)]+)\):\s*(.*)$/.exec(e)
  if (act.id === 'main') return sub === null ? e : ''
  if (sub === null) return ''
  const who = (sub[2] ?? '').toLowerCase()
  if (who !== act.member && who !== NAME[act.member].toLowerCase()) return ''
  const newest = view.members.find(x => x.member === act.member)?.acts.find(a => (a.hadError || a.isFailed) && a.id !== 'main')
  return newest?.id === act.id ? `${sub[1] ?? ''}: ${sub[3] ?? ''}` : ''
}

/**
 * Why an act failed or stopped: a failure's own error when the set's last
 * error is hers, else its own words; never its tool or `encore!`. A stopped
 * act's error is no reason it stopped: it keeps its amber line instead.
 */
function reasonOf(view: PanelView, act: ActView): string {
  const err = hardFail(act) ? ownError(view, act) : ''
  if (err !== '') return err
  const own = oneLine(act.reason)
  if (own === '' || own === 'encore!' || own === oneLine(act.tool)) return hardFail(act) ? 'ended in an error' : 'stopped'
  // the mod's `stopped: <why>` in words
  const why = /^stopped:\s*(\w+)$/.exec(own)?.[1]
  if (why === 'error') return 'ended in an error'
  if (why === 'refusal') return 'refused to go on'
  if (why === 'aborted' || why === 'killed') return 'stopped before it finished'
  if (why === 'interrupted') return 'interrupted'
  return own
}

/** Her real failures this set (a tool call that errored is none, an earlier set's failure is none). */
const failedCount = (m: MemberView) => m.acts.filter(setFail).length

// ---- The stage ---------------------------------------------------------------------------------

/** Where a member stands: her centre, her feet, and her line (0 the back line on the drum riser, 1 the front line on the deck). */
type Spot = { cx: number; feet: number; row: 0 | 1 }

/** The width from which the band is drawn x3. */
const X3_AT = 900

/**
 * How far each member reaches across her 96 px frame, over her usual moods
 * (the first pixel and one past the last): Bocchi's guitar, the drum kit
 * before Nijika, Ryo's bass, Kita's guitar. The band's places are worked out
 * from these, so no two cross where the stage has the room.
 */
const REACH: Record<Member, readonly [number, number]> = { bocchi: [16, 78], nijika: [14, 87], ryo: [23, 90], kita: [18, 78] }
const BAND: readonly Member[] = ['bocchi', 'nijika', 'ryo', 'kita']
/**
 * The room kept between the kit and Ryo where the stage has it, in frame
 * pixels: in a panic Nijika's stick hand reaches past her cymbals (column 91)
 * and Ryo's arm far past her bass (column 2), and two figures on the same
 * riser can only stand apart.
 */
const FLAIL = 25

/** How far a figure reaches across her frame in one mood, over every frame (the first column and one past the last): what the stage's edges keep in. */
const reachMemo = new Map<string, readonly [number, number]>()
function reachOf(id: string, member: Member): readonly [number, number] {
  const hit = reachMemo.get(id)
  if (hit !== undefined) return hit
  const anim = animOf(id)
  let x0 = 99
  let x1 = -1
  for (let k = 0; anim !== undefined && k < anim.frames.length; k += 1) {
    const px = framePixels(id, k)
    for (let i = 0; i < px.length; i += 1) {
      if (px[i] == null) continue
      const x = i % 96
      if (x < x0) x0 = x
      if (x > x1) x1 = x
    }
  }
  const reach = x1 < 0 ? REACH[member] : ([x0, x1 + 1] as const)
  reachMemo.set(id, reach)
  return reach
}

/** The stage's measures for the band as it stands: its width, and how far the outer two reach in their moods. */
function geoOf(view: PanelView, W: number) {
  const first = view.members[0]
  const last = view.members[view.members.length - 1]
  const left = first === undefined ? REACH.bocchi[0] : reachOf(`${first.member}-${first.mood}`, first.member)[0]
  const right = last === undefined ? REACH.kita[1] : reachOf(`${last.member}-${last.mood}`, last.member)[1]
  return stageGeo(W, left, right)
}

/**
 * The stage's measures at a width: a live house seen from the floor. The
 * band is drawn at an integer zoom at every width (x2, x3 from 900 px). The
 * back line stands on the drum riser, Nijika behind her kit and Ryo beside it
 * with her bass rig; the front line stands on the deck before it and lower,
 * Bocchi by her amp and Kita at her mic. Across, the four take their reach
 * side by side, the kit and Ryo kept a panic's flail apart, and share the room
 * left over; where there is too little (below about 530 px at x2) they close
 * up only where it reads as depth, a front figure before the riser: Bocchi
 * before the kit's floor tom, Kita before Ryo's legs (her head under Ryo's
 * neck), the kit and Ryo barely, and the front line stands further forward and
 * lower. The outer two step in from the stage's edges as far as their mood
 * reaches (`left`, `right`: Bocchi's first column, one past Kita's last). Every
 * pit stands in one row along the stage's front, each in its member's quarter
 * (over her plate). The top band (truss, string lights, the sign) stays tight:
 * the back line's heads stand just under the sign.
 */
function stageGeo(W: number, left: number = REACH.bocchi[0], right: number = REACH.kita[1]) {
  const z = W >= X3_AT ? 3 : 2
  const wide = W >= 600
  const narrow = W < 400
  const can = 12
  const signSize = z === 3 ? 38 : wide ? 31 : narrow ? 24 : 27
  const signY = Math.round(can + 8 + signSize * 0.8)
  // the back line's frames: Nijika's ahoge (13 pixels into her frame) a few pixels under the sign's glow
  const frameTop = Math.round(signY + 5 - 13 * z) + 5
  // where the back line stands: the riser's top
  const riser = frameTop + 94 * z
  const m = 2 * z
  const need = BAND.reduce((n, mb) => n + (REACH[mb][1] - REACH[mb][0]) * z, 0)
  const slack = W - 2 * m - need
  const short = Math.max(0, -slack)
  // the room kept between the kit and Ryo first, then the rest of the room, or the overlap, shared: before Bocchi,
  // Bocchi|kit, kit|Ryo, Ryo|Kita, after Kita. An overlap goes where a front figure stands before the riser; the two
  // on the riser, at one depth, barely meet (Ryo's bass before the hi-hat)
  const keep = Math.max(0, Math.min(slack, FLAIL * z))
  const rest = slack - keep
  const share = slack >= 0 ? [0.12, 0.3, 0.12, 0.3, 0.16] : [0, 0.46, 0.1, 0.44, 0]
  const snap = (x: number) => Math.round(x / z) * z
  const xs: number[] = []
  let x = m + rest * (share[0] ?? 0)
  BAND.forEach((mb, i) => {
    const [a, b] = REACH[mb]
    xs.push(snap(x + (48 - a) * z))
    x += (b - a) * z + (i === 1 ? keep : 0) + rest * (share[i + 1] ?? 0)
  })
  // the outer two inside the stage in their mood (a panic's arms, a happy jump)
  xs[0] = Math.max(xs[0] ?? 0, Math.ceil((m + (48 - left) * z) / z) * z)
  xs[3] = Math.min(xs[3] ?? W, Math.floor((W - m - (right - 48) * z) / z) * z)
  // the front line before the riser: its face and a stretch of deck; further forward and lower where the band closes
  // up, so the front figures stand clearly before the back line they cover (up to 20 pixels more at 340 px)
  const front = snap(riser + 30 * z + Math.min(20 * z, short * 0.2))
  const spots: Spot[] = [
    { cx: xs[0] ?? W * 0.15, feet: front, row: 1 },
    { cx: xs[1] ?? W * 0.38, feet: riser - z, row: 0 },
    { cx: xs[2] ?? W * 0.62, feet: riser + z, row: 0 },
    { cx: xs[3] ?? W * 0.85, feet: front, row: 1 },
  ]
  const quarter = W / 4
  // the riser: under the kit, Ryo and her rig, its top's back edge at the wall's foot, its face 13 pixels deep
  const rx0 = Math.max(0, (spots[1]?.cx ?? 0) - 42 * z)
  const rx1 = Math.min(W, (spots[2]?.cx ?? W) + 50 * z)
  const wallFoot = riser - 6 * z
  const edge = riser + 3 * z
  const face = edge + 13 * z
  // the pits: one row of slimes along the front, a little before the front line's feet; under them the stage's lip
  const slimeTop = front - 7 * z
  const lip = slimeTop + 24 * z
  const H = lip + 3 * z
  return { W, z, wide, narrow, can, signSize, signY, frameTop, riser, front, quarter, spots, rx0, rx1, wallFoot, edge, face, slimeTop, lip, H }
}
type StageGeo = ReturnType<typeof stageGeo>

// ---- The stage's furniture: pixel art in the sprites' own language ----------------------------------

/**
 * A small picture drawn pixel by pixel (flat colours, a darker outline, a
 * highlight from the upper right, as the band is drawn), written as the
 * sprites are: a stroked path a colour, a run a row or a column of pixels.
 */
type Pix = { w: number; h: number; px: (string | null)[] }

const pix = (w: number, h: number): Pix => ({ w, h, px: new Array<string | null>(w * h).fill(null) })
const pxAt = (p: Pix, x: number, y: number): string | null => (x >= 0 && y >= 0 && x < p.w && y < p.h ? (p.px[y * p.w + x] ?? null) : null)

function put(p: Pix, x: number, y: number, c: string | null): void {
  if (c !== null && x >= 0 && y >= 0 && x < p.w && y < p.h) p.px[y * p.w + x] = c
}

/** Every pixel of a rectangle (both corners in), coloured by where it is. */
function block(p: Pix, x0: number, y0: number, x1: number, y1: number, c: (x: number, y: number) => string | null): void {
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) put(p, x, y, c(x, y))
}

/** A filled ellipse round (cx, cy) in pixel edges, each pixel coloured by where it falls in it (u, v from -1 to 1). */
function oval(p: Pix, cx: number, cy: number, rx: number, ry: number, c: (u: number, v: number) => string | null): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const u = (x + 0.5 - cx) / rx
      const v = (y + 0.5 - cy) / ry
      if (u * u + v * v <= 1) put(p, x, y, c(u, v))
    }
  }
}

/** A one-pixel line. */
function pline(p: Pix, x0: number, y0: number, x1: number, y1: number, c: string): void {
  const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let k = 0; k <= n; k += 1) put(p, Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c)
}

/** The outline: every empty pixel beside a drawn one (above, below, left or right) in `c`. */
function rim(p: Pix, c: string): void {
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
function layOn(p: Pix, top: Pix): void {
  top.px.forEach((c, k) => {
    if (c !== null) p.px[k] = c
  })
}

/** Two numbers of a relative move, as short as a path takes them. */
const pairOf = (a: number, b: number) => `${a}${b < 0 ? '' : ' '}${b}`

/**
 * The picture as the sprites are written: one stroked path a colour, its
 * pixels in runs along rows or along columns, whichever writes shorter. The
 * colours go most-drawn first, and a run of one may cross pixels of the
 * colours drawn after it (they paint over it), so the big areas take long
 * runs and the details sit on top.
 */
function pixPaths(p: Pix): string {
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

/** The kit's colours: her bow's red sparkle for the shells, coated heads, chrome, brass, the band's yellow star. */
const KIT = {
  o: '#2b1b24',
  R: '#d33950',
  L: '#f27d8c',
  r: '#a3263c',
  W: '#f6f1e6',
  w: '#d6ccbb',
  C: '#f6f1e6',
  c: '#aab2bf',
  n: '#6f7688',
  Y: '#fff6cc',
  y: '#f1c75e',
  t: '#c8913a',
  T: '#7a521d',
  S: '#ffd166',
  s: '#b8741c',
} as const

/** The row of her frame under which Nijika, sitting behind her kit, is hidden by it: her legs never show between its drums. */
const KIT_SEAT = 72
/** A rectangle of a frame's pixels: its left, its top, one past its right and its bottom. */
type Cells = readonly [number, number, number, number]
/**
 * The marks over a figure's shoulder that read as drawn on whatever stands
 * behind them, by sprite: Bocchi's notes over her headstock while she plays,
 * her gloom's squiggles while she worries, and in her box the squiggles and
 * drops over its right flap. Her hair, her hands, her guitar and the box lie
 * outside them in every frame. Standing before the kit she shows them only
 * over the wall (see marksOnKit).
 */
const MARKS: Readonly<Record<string, readonly Cells[]>> = {
  'bocchi-focused': [[64, 18, 80, 39]],
  'bocchi-anxious': [[61, 18, 80, 38]],
  'bocchi-hiding': [
    [63, 34, 79, 46],
    [63, 46, 65, 50],
    [65, 46, 66, 48],
  ],
}

/** An encore's two stars' radii (her colour, then a small white one), in band pixels. */
const SPARKLE_R = [3.4, 2.2] as const

/** The band's star, seven pixels a side, as on the neon sign. */
const STAR = ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.']

/**
 * Nijika's drum kit, in her frame's own pixels (her feet on row 93, the kit's
 * on row 96, a step before her): a bass drum facing the audience with the
 * band's star on its head, two rack toms on
 * it, the floor tom at her right hand (the audience's left) and the snare and
 * hi-hat at her left, a ride and a crash on stands. It covers her from the
 * waist down. `glint` is the cymbals' highlights, which shimmer while she plays.
 */
const kitMemo: { body: string; glint: string; pix: Pix }[] = []
function kitArt(): { body: string; glint: string; pix: Pix } {
  const hit = kitMemo[0]
  if (hit !== undefined) return hit
  const P = pix(96, 98)
  const glint = pix(96, 98)
  // the stands, behind everything: a chrome pole on a tripod
  const stands = pix(96, 98)
  const tripod = (x: number, top: number) => {
    pline(stands, x, top, x, 93, KIT.c)
    pline(stands, x - 1, 93, x - 4, 96, KIT.n)
    pline(stands, x + 1, 93, x + 4, 96, KIT.n)
  }
  tripod(21, 55)
  tripod(73, 49)
  tripod(81, 55)
  tripod(67, 72)
  layOn(P, stands)
  // a cymbal: a thin brass ellipse lit on top, tilted, its bell a bump in the middle, an outline in deep brass
  const cymbal = (cx: number, cy: number, rx: number, tilt: number, shine: [number, number][]) => {
    const c = pix(96, 98)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx) - 1; x += 1) {
      const u = (x + 0.5 - cx) / rx
      if (Math.abs(u) > 1) continue
      const y = Math.round(cy + u * tilt)
      const thick = Math.abs(u) < 0.55 ? 2 : 1
      put(c, x, y, KIT.y)
      if (thick === 2) put(c, x, y + 1, KIT.t)
    }
    put(c, Math.floor(cx), Math.round(cy) - 1, KIT.t)
    put(c, Math.floor(cx) - 1, Math.round(cy) - 1, KIT.t)
    rim(c, KIT.T)
    layOn(P, c)
    for (const [gx, gy] of shine) put(glint, gx, gy, KIT.Y)
  }
  cymbal(21, 54, 9, 1, [[24, 54], [25, 54]])
  cymbal(73, 47, 9, -2, [[76, 46], [77, 46]])
  // the hi-hat: two cymbals shut, on its pole
  cymbal(81, 58, 7.5, 0, [[83, 58]])
  cymbal(81, 60, 7.5, 0, [])
  // a drum seen from the floor: its coated head on top (the near edge its chrome hoop), its shell below lit from the right
  const drum = (cx: number, top: number, rx: number, tall: number, chrome: boolean) => {
    const d = pix(96, 98)
    const x0 = Math.round(cx - rx)
    const x1 = Math.round(cx + rx) - 1
    block(d, x0, top + 1, x1, top + tall, (xx, yy) => {
      if ((xx === x0 || xx === x1) && yy === top + tall) return null
      const u = (xx + 0.5 - cx) / rx
      if (yy === top + tall) return chrome ? KIT.n : KIT.r
      if (yy === top + 1) return KIT.c
      if (u > 0.45) return chrome ? KIT.C : KIT.L
      if (u < -0.5) return chrome ? KIT.n : KIT.r
      return chrome ? KIT.c : KIT.R
    })
    block(d, x0 + 1, top - 1, x1 - 1, top - 1, () => KIT.W)
    block(d, x0, top, x1, top, xx => ((xx + 0.5 - cx) / rx < -0.5 ? KIT.w : KIT.W))
    if (!chrome) for (const lx of [x0 + 2, x1 - 2]) put(d, lx, top + Math.ceil(tall / 2), KIT.c)
    rim(d, KIT.o)
    layOn(P, d)
  }
  // the floor tom (her right hand, the audience's left), on its legs; the snare behind the bass drum's shoulder
  pline(P, 21, 85, 20, 96, KIT.n)
  pline(P, 33, 85, 34, 96, KIT.n)
  drum(27, 69, 7, 15, false)
  drum(67, 68, 6.5, 4, true)
  // the rack toms, sitting on the bass drum
  drum(42, 63, 5.5, 6, false)
  drum(55, 63, 5.5, 6, false)
  // the bass drum, facing the audience: its red hoop (lit at the upper right), its coated head shaded at the lower left,
  // the lugs round it and the band's star in the middle
  const bd = pix(96, 98)
  const R = 13.5
  oval(bd, 48, 82.5, R, R, (u, v) => {
    const r = Math.hypot(u, v) * R
    const lean = u - v
    if (r > 11.5) return lean > 1 ? KIT.L : lean < -0.9 ? KIT.r : KIT.R
    return lean < -0.95 ? KIT.w : KIT.W
  })
  for (let k = 0; k < 6; k += 1) {
    const a = (k * Math.PI) / 3 + Math.PI / 6
    put(bd, Math.floor(48 + Math.cos(a) * 12.4), Math.floor(82.5 + Math.sin(a) * 12.4), KIT.C)
  }
  const star = pix(96, 98)
  STAR.forEach((row, sy) => [...row].forEach((ch, sx) => (ch === '#' ? put(star, 45 + sx, 79 + sy, KIT.S) : undefined)))
  rim(star, KIT.s)
  layOn(bd, star)
  rim(bd, KIT.o)
  layOn(P, bd)
  // its spurs, splayed to the riser
  pline(P, 36, 92, 33, 96, KIT.c)
  pline(P, 60, 92, 63, 96, KIT.c)
  const art = { body: pixPaths(P), glint: pixPaths(glint), pix: P }
  kitMemo.push(art)
  return art
}

/**
 * Whether any of a sprite's marks (MARKS), in any frame, lands on a pixel of
 * the kit, the sprite's frame standing (dx, dy) stage pixels from the kit's,
 * both drawn `z` pixels a pixel.
 */
const onKitMemo = new Map<string, boolean>()
function marksOnKit(id: string, dx: number, dy: number, z: number): boolean {
  const key = `${id}|${dx}|${dy}|${z}`
  const hit = onKitMemo.get(key)
  if (hit !== undefined) return hit
  const kit = kitArt().pix
  const anim = animOf(id)
  const cells = MARKS[id] ?? []
  // the kit's pixels a sprite pixel at (x, y) (in stage pixels from the kit's frame) covers: one, two or four
  const covers = (x: number, y: number) => {
    for (const kx of new Set([Math.floor(x / z), Math.floor((x + z - 1) / z)])) for (const ky of new Set([Math.floor(y / z), Math.floor((y + z - 1) / z)])) if (pxAt(kit, kx, ky) !== null) return true
    return false
  }
  let on = false
  for (let k = 0; !on && anim !== undefined && k < anim.frames.length; k += 1) {
    const px = framePixels(id, k)
    for (const [c0, r0, c1, r1] of cells) for (let r = r0; !on && r < r1; r += 1) for (let c = c0; !on && c < c1; c += 1) if (px[r * 96 + c] != null && covers(dx + c * z, dy + r * z)) on = true
  }
  if (onKitMemo.size > 64) onKitMemo.clear()
  onKitMemo.set(key, on)
  return on
}

/** The grilles' cloth and mesh, a pixel a cell in the amps' own pixels: what the amps' grilles are filled with. */
const GRILLES = '<pattern id="ag" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 0h2v2H0z" fill="#4a3c31"/><path d="M0 0h1v1H0zM1 1h1v1H1z" fill="#64533f"/></pattern><pattern id="cm" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 0h2v2H0z" fill="#33373f"/><path d="M0 0h1v1H0z" fill="#525866"/></pattern>'

/** A box of pixels: its colour (or a fill), its left, top, width and height. */
type Px4 = readonly [string, number, number, number, number]

/** Boxes of pixels as filled paths, in drawing order (the later over the earlier), the boxes of one colour in a row sharing a path. */
function boxPaths(list: readonly Px4[]): string {
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

/** The amp behind Bocchi: a half stack, its head's gold panel and red jewel over a cab of salt-and-pepper grille cloth (GRILLES) with her pink plate. 30 x 39. */
const AMP = boxPaths([
  ['#120d12', 0, 1, 30, 38],
  ['#120d12', 11, 0, 8, 1],
  ['#2a2229', 1, 2, 28, 7],
  ['#43373f', 1, 2, 28, 1],
  ['#43373f', 28, 2, 1, 7],
  ['#d9b55e', 3, 5, 24, 2],
  ['#9c7a36', 3, 7, 24, 1],
  ...[6, 9, 12, 15, 18].map((x): Px4 => ['#120d12', x, 6, 1, 1]),
  ['#ff5d73', 23, 6, 2, 1],
  ['#2a2229', 1, 10, 28, 28],
  ['#43373f', 1, 10, 28, 1],
  ['#43373f', 28, 10, 1, 28],
  ['#cdbfa6', 3, 13, 24, 22],
  ['url(#ag)', 4, 14, 22, 20],
  ['#f7a8c9', 5, 15, 6, 2],
  ...[[1, 10], [27, 10], [1, 36], [27, 36]].map(([x, y]): Px4 => ['#b9b3bd', x ?? 0, y ?? 0, 2, 2]),
])

/** Ryo's bass rig behind her: a silver-faced head with her blue light over a tall cab of black mesh (GRILLES), a brace across it. 26 x 46. */
const CAB = boxPaths([
  ['#0f0d12', 0, 0, 26, 46],
  ['#25222b', 1, 1, 24, 6],
  ['#3c3844', 1, 1, 24, 1],
  ['#3c3844', 24, 1, 1, 6],
  ['#bcc3cf', 3, 3, 20, 1],
  ['#868d9c', 3, 4, 20, 1],
  ...[5, 8, 11, 14].map((x): Px4 => ['#0f0d12', x, 3, 1, 1]),
  ['#8fb8ff', 20, 3, 1, 2],
  ['#25222b', 1, 8, 24, 37],
  ['#3c3844', 1, 8, 24, 1],
  ['#3c3844', 24, 8, 1, 37],
  ['url(#cm)', 3, 10, 20, 16],
  ['url(#cm)', 3, 27, 20, 16],
  ['#8fb8ff', 4, 11, 5, 1],
  ...[[1, 8], [23, 8], [1, 43], [23, 43]].map(([x, y]): Px4 => ['#b9b3bd', x ?? 0, y ?? 0, 2, 2]),
])

/** Kita's mic stand, in her frame's pixels: a pole on a tripod before her feet, its boom bringing the mic to her mouth. */
const micMemo: string[] = []
function micArt(): string {
  const hit = micMemo[0]
  if (hit !== undefined) return hit
  const P = pix(96, 98)
  const S = { s: '#57515e', S: '#8e8798', g: '#e3e6ec', G: '#9aa1ae' }
  pline(P, 30, 43, 30, 93, S.s)
  pline(P, 31, 42, 39, 40, S.S)
  pline(P, 29, 94, 26, 97, S.s)
  pline(P, 31, 94, 34, 97, S.s)
  put(P, 30, 94, S.s)
  put(P, 30, 95, S.s)
  block(P, 40, 37, 42, 39, (x, y) => (y === 37 || x === 42 ? S.g : S.G))
  put(P, 40, 40, S.s)
  put(P, 39, 40, S.s)
  const art = pixPaths(P)
  micMemo.push(art)
  return art
}

/** A picture placed on the stage: its top left at (x, y), drawn `z` pixels a pixel. */
const placedArt = (x: number, y: number, z: number, body: string) => `<g transform="translate(${f(x)} ${f(y)}) scale(${z})">${body}</g>`

type PitSlime = { state: ActView['slime']; encore: boolean; failed: boolean }

/**
 * The slimes drawn at her feet: her pit (live first), this set's failure kept
 * on stage with its mark, at most `cap`. A failed or encore slime is awake
 * (only a plain finished act sleeps, an earlier set's failure with them), and
 * the failure stands outermost (`outerLeft`: on her left, else her right),
 * away from the stage's middle, so its bubble clears her legs and her
 * neighbours.
 */
function pitOf(m: MemberView, cap: number, outerLeft = true): { shown: PitSlime[]; extra: number; fails: number } {
  const pit: PitSlime[] = m.pit.map(a => {
    const failed = setFail(a)
    const encore = encoreOf(a)
    return { state: failed || encore ? 'idle' : a.slime, encore, failed }
  })
  const fails = failedCount(m)
  if (fails > 0 && !pit.some(p => p.failed)) pit.push({ state: 'idle', encore: false, failed: true })
  let shown = pit.slice(0, cap)
  const fail = pit.find(p => p.failed)
  if (fail !== undefined) {
    const rest = shown.filter(p => p !== fail).slice(0, Math.max(0, cap - 1))
    shown = outerLeft ? [fail, ...rest] : [...rest, fail]
  }
  return { shown, extra: pit.length - shown.length, fails }
}

/** Where a figure's legs stand in her 96 px frame (its lowest 30 rows), over every frame of a mood: what a mark beside her keeps clear of. */
const legsMemo = new Map<string, { x0: number; x1: number }>()
function legsOf(id: string): { x0: number; x1: number } {
  const hit = legsMemo.get(id)
  if (hit !== undefined) return hit
  const anim = animOf(id)
  let x0 = 99
  let x1 = -1
  for (let k = 0; anim !== undefined && k < anim.frames.length; k += 1) {
    const px = framePixels(id, k)
    for (let y = 66; y < 96; y += 1) {
      for (let x = 0; x < 96; x += 1) {
        if (px[y * 96 + x] == null) continue
        if (x < x0) x0 = x
        if (x > x1) x1 = x
      }
    }
  }
  const legs = x1 < 0 ? { x0: 28, x1: 68 } : { x0, x1 }
  legsMemo.set(id, legs)
  return legs
}

/** A box on the stage: a mark's bounds. */
export type StageBox = { x0: number; y0: number; x1: number; y1: number }
/** A mark in a member's pit (a failure's bubble with its count, the badge counting the rest, an encore's sparkle) and where it is drawn. */
export type PitMark = { member: Member; kind: 'bubble' | 'badge' | 'sparkle'; box: StageBox }

const meets = (a: StageBox, b: StageBox, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad

/** Her pit as drawn: her slimes (their frames' left edges) and her marks, each with its markup. */
type PitDrawing = { i: number; m: MemberView; slimes: { x: number; p: PitSlime }[]; marks: (PitMark & { svg: string })[] }

/**
 * Every pit on the stage and its marks, placed so each mark stays inside its
 * member's quarter (4 px in from it), clear of every other mark, and, beside
 * a figure standing in front, clear of her legs: a failure's bubble (its count
 * inside it, `✗2`) over her outermost slime, its tail on that slime; the badge
 * counting the slimes left out at her innermost slime's shoulder, on the far
 * side from the bubble; an encore's sparkle on her slime's shoulder.
 */
function pitPlan(view: PanelView, g: StageGeo): PitDrawing[] {
  const { z, quarter: q } = g
  const cap = pitCap(g)
  const spotOf = (i: number): Spot => g.spots[i] ?? { cx: q * (i + 0.5), feet: g.front, row: 1 }
  // the legs of everyone standing at the front, which a mark in the pit must not cover
  const legs: StageBox[] = []
  view.members.forEach((m, i) => {
    const s = spotOf(i)
    if (s.row !== 1) return
    const l = legsOf(`${m.member}-${m.mood}`)
    const fx = Math.round(s.cx - 48 * z)
    legs.push({ x0: fx + l.x0 * z, y0: s.feet - 30 * z, x1: fx + (l.x1 + 1) * z, y1: s.feet })
  })
  const placed: StageBox[] = []
  const free = (b: StageBox, i: number) => b.x0 >= q * i + 4 - 0.01 && b.x1 <= q * (i + 1) - 4 + 0.01 && !placed.some(p => meets(p, b, 1)) && !legs.some(l => meets(l, b))
  const sy = g.slimeTop
  const head = sy + 4 * z
  const plans = view.members.map((m, i) => {
    const cx = spotOf(i).cx
    const outerLeft = cx < g.W / 2
    const side = outerLeft ? -1 : 1
    const { shown, extra, fails } = pitOf(m, cap, outerLeft)
    const xs = pitXs(g, i, shown.length)
    return { m, i, side, shown, extra, fails, xs }
  })
  // the slimes' own bodies, which a badge may not cover (another member's)
  const bodies = plans.flatMap(pl => pl.xs.map(x => ({ i: pl.i, box: { x0: x + 4 * z, y0: head, x1: x + 31 * z, y1: sy + 24 * z } })))
  return plans.map(({ m, i, side, shown, extra, fails, xs }) => {
    const marks: (PitMark & { svg: string })[] = []
    const add = (kind: PitMark['kind'], box: StageBox, svg: string) => {
      placed.push(box)
      marks.push({ member: m.member, kind, box, svg })
    }
    // one bubble a pit, its count every failure of hers: over the outermost slime, where pitOf stands the failure
    const outer = side < 0 ? 0 : shown.length - 1
    shown.forEach((p, j) => {
      const sx = xs[j] ?? 0
      const mid = sx + 17 * z
      if (p.failed && j === outer) {
        // the bubble: its count inside it; over her slime, outward, as far up as it must go to clear her legs
        const b = z === 3 ? 2 : 1.35
        const count = fails > 1 ? String(fails) : ''
        const bw = (count === '' ? 22 : 17.5 + count.length * 5.6) * b
        const bh = 15.5 * b
        const lo = q * i + 4 + bw / 2
        const hi = q * (i + 1) - 4 - bw / 2
        const tipY = head
        let best: { bx: number; top: number } | null = null
        for (const lift of [0, 4, 8, 12, 16]) {
          for (const dx of [8, 4, 12, 0, 16, -4, -8]) {
            const bx = Math.max(lo, Math.min(hi, mid + side * dx * z))
            const top = tipY - lift * z - bh
            const box = { x0: bx - bw / 2, y0: top, x1: bx + bw / 2, y1: top + bh }
            if (free(box, i)) {
              best = { bx, top }
              break
            }
          }
          if (best !== null) break
        }
        const at = best ?? { bx: Math.max(lo, Math.min(hi, mid + side * 8 * z)), top: tipY - bh }
        const box = { x0: at.bx - bw / 2, y0: at.top, x1: at.bx + bw / 2, y1: at.top + bh }
        // the tail points at her slime from the body's foot (a bubble lifted clear of her legs floats over it)
        const tail = Math.max(box.x0 + 5 * b, Math.min(box.x1 - 5 * b, mid))
        const foot = box.y1 - 3.5 * b
        const r = 3 * b
        const tip = box.y1
        const d = `M${f(box.x0 + r)} ${f(box.y0)}H${f(box.x1 - r)}Q${f(box.x1)} ${f(box.y0)} ${f(box.x1)} ${f(box.y0 + r)}V${f(foot - r)}Q${f(box.x1)} ${f(foot)} ${f(box.x1 - r)} ${f(foot)}H${f(tail + 3 * b)}L${f(tail)} ${f(tip)}L${f(tail - 3 * b)} ${f(foot)}H${f(box.x0 + r)}Q${f(box.x0)} ${f(foot)} ${f(box.x0)} ${f(foot - r)}V${f(box.y0 + r)}Q${f(box.x0)} ${f(box.y0)} ${f(box.x0 + r)} ${f(box.y0)}z`
        const xc = count === '' ? at.bx : box.x0 + 7.8 * b
        const xm = `<path d="M${f(xc - 2.6 * b)} ${f(box.y0 + 3.4 * b)}l${f(5.2 * b)} ${f(5.2 * b)}M${f(xc + 2.6 * b)} ${f(box.y0 + 3.4 * b)}l${f(-5.2 * b)} ${f(5.2 * b)}" stroke="#ffd0d6" stroke-width="${f(1.7 * b)}" stroke-linecap="round"/>`
        const num = count === '' ? '' : T(box.x0 + 12.3 * b, box.y0 + 9.4 * b, count, 9.4 * b, '#ffd0d6', 'u', ' font-weight="700"')
        add('bubble', box, `<path d="${d}" fill="#3a0c16" stroke="${RED_DEEP}" stroke-width="${f(1.2 * b)}"/>${xm}${num}`)
      }
      if (p.encore) {
        // an encore's sparkle on her slime's shoulder, on her side of the quarter line; still while she is dimmed
        // (a twinkle under the room's dark mask repaints the whole stage every frame)
        const [r1, r2] = SPARKLE_R.map(r => r * z) as [number, number]
        const boxAt = (sx1: number) => {
          const sx2 = mid + 4 * sign(sx1 - mid) * z
          return { sx1, sx2, box: { x0: Math.min(sx1 - r1, sx2 - r2), y0: sy - 3 * z - r2, x1: Math.max(sx1 + r1, sx2 + r2), y1: sy + 2 * z + r1 } }
        }
        const inside = (bx: StageBox) => bx.x0 >= q * i + 4 && bx.x1 <= q * (i + 1) - 4 && !placed.some(pl => meets(pl, bx, 1))
        const right = boxAt(mid + 11 * z)
        const left = boxAt(mid - 11 * z)
        const { sx1, sx2, box } = inside(right.box) || !inside(left.box) ? right : left
        // the two stars drawn once in the stage's defs (SPARKLES), placed here
        const star = (ref: string, x: number, y: number, fill: string, cls: string) => `<use href="#${ref}" x="${f(x)}" y="${f(y)}" fill="${fill}"${cls === '' ? '' : ` class="${cls}"`}/>`
        add('sparkle', box, star('s1', sx1, sy + 2 * z, chalkOf(m.member), m.isDim ? '' : 'tw') + star('s2', sx2, sy - 3 * z, '#fff8e6', m.isDim ? '' : 'tw t2'))
      }
    })
    if (extra > 0) {
      // the rest counted on a badge at her innermost slime's shoulder, the far side from her bubble, inside her quarter
      // and off every other member's slime
      const words = `+${extra}`
      const size = 6 * z
      const bw = textWidth(words, 'uib', size) + 3.5 * z
      const bh = size + 2.5 * z
      const inner = side < 0 ? (xs[xs.length - 1] ?? 0) : (xs[0] ?? 0)
      const others = bodies.filter(bd => bd.i !== i).map(bd => bd.box)
      const lo = q * i + 4
      const hi = q * (i + 1) - 4 - bw
      const clear = (bx: number, by: number) => {
        const box = { x0: bx, y0: by, x1: bx + bw, y1: by + bh }
        return bx >= lo - 0.01 && bx <= hi + 0.01 && !others.some(o => meets(o, box)) && !placed.some(p => meets(p, box, 1))
      }
      // her innermost slime's shoulder, then lower down its inner side, then anywhere along her quarter at either height
      const shoulder = side < 0 ? inner + 28 * z - bw * 0.8 : inner + 8 * z - bw * 0.2
      const cands: [number, number][] = [[shoulder, sy + 1.5 * z], [side < 0 ? inner + 33 * z - bw : inner + 3 * z, sy + 11 * z]]
      for (let bx = hi; bx >= lo; bx -= 2) cands.push([bx, sy + 1.5 * z], [bx, sy + 11 * z])
      const at = cands.map(([bx, by]): [number, number] => [Math.max(lo, Math.min(hi, bx)), by]).find(([bx, by]) => clear(bx, by)) ?? [Math.max(lo, Math.min(hi, shoulder)), sy + 1.5 * z]
      const [bx, by] = at
      add('badge', { x0: bx, y0: by, x1: bx + bw, y1: by + bh }, `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" rx="${f(bh / 2)}" fill="#1a1216" stroke="${chalkOf(m.member)}" stroke-width="1.2"/>${T(bx + bw / 2, by + bh * 0.73, words, size, chalkOf(m.member), 'u', ' text-anchor="middle" font-weight="700"')}`)
    }
    return { i, m, slimes: shown.map((p, j) => ({ x: xs[j] ?? 0, p })), marks }
  })
}

const sign = (n: number) => (n < 0 ? -1 : 1)

/** Every mark in the pits as drawn on the stage at a width: for checking that each stays in its member's quarter and clear of the others. */
export function stageMarks(view: PanelView, layout: SceneLayout): PitMark[] {
  return pitPlan(view, geoOf(view, layout.width)).flatMap(pd => pd.marks.map(({ member, kind, box }) => ({ member, kind, box })))
}

/** How many slimes her quarter of the front holds: the slimes a little overlapped, as a crowd stands; one to three. */
function pitCap(g: StageGeo): number {
  return Math.max(1, Math.min(3, 1 + Math.floor((g.quarter - 30 * g.z) / (22 * g.z))))
}

/** Her pit's slimes' frames (their left edges) in her quarter of the front: as close under her (moved by `shift`) as they fit. */
function pitXs(g: StageGeo, i: number, count: number, shift = 0): number[] {
  const step = 22 * g.z
  const span = (count - 1) * step + 36 * g.z
  const lo = g.quarter * i - 3 * g.z
  const hi = g.quarter * (i + 1) + 3 * g.z
  const want = (g.spots[i]?.cx ?? g.quarter * (i + 0.5)) + shift - span / 2
  const x0 = Math.max(lo, Math.min(hi - span, want))
  return Array.from({ length: count }, (_, j) => Math.round(x0 + j * step))
}

/**
 * What the stage depends on, and nothing else: the width, the air, the solo,
 * and each member's mood, light, dim, pit and this set's failures (a failure
 * that falls into an earlier set changes both its slime's mark and the count).
 */
function stageKey(view: PanelView, layout: SceneLayout): string {
  return JSON.stringify([
    layout.width,
    view.onAir,
    view.solo,
    view.members.map(m => [m.member, m.mood, m.isLit, m.isDim, m.isSolo, m.pit.map(a => `${a.slime}${encoreOf(a) ? 'e' : ''}${setFail(a) ? 'x' : ''}${a.isLive ? 'l' : ''}`).join(','), failedCount(m)]),
  ])
}

/** The stage as drawn: the picture, the sprites' fit (each part's level: 0 every frame, above that frames merged, -1 left out), and the chrome's size. */
export type StageDrawing = { scene: SceneSvg; parts: string[]; levels: number[]; chrome: number }

const stageMemo = new Map<string, StageDrawing>()

/** The stage's words: who stands in a light, who in the dark, what is at their feet. */
function stageAlt(view: PanelView): string {
  const anyLit = view.members.some(m => m.isLit)
  const who = view.members.map(m => {
    const bits: string[] = []
    if (m.isSolo) bits.push('on solo')
    const main = m.isPlaying && m.member === 'bocchi' && view.onAir ? ' the main loop' : ''
    bits.push(m.isLit ? `lit, playing${main}` : m.isDim ? 'dimmed' : anyLit ? 'in the dark' : 'resting')
    if (m.mood === 'happy') bits.push('happy')
    else if (m.mood === 'panic') bits.push('in a panic')
    else if (m.mood === 'melting') bits.push('melting')
    else if (m.mood === 'hiding') bits.push(m.member === 'nijika' ? 'in her box behind her drums' : 'in her box')
    if (m.member === 'nijika' && m.mood !== 'hiding') bits.push('at her drums')
    const live = m.pit.filter(a => a.isLive).length
    const asleep = m.pit.filter(a => !a.isLive && !setFail(a) && !encoreOf(a)).length
    if (live > 0) bits.push(`${live} act${live === 1 ? '' : 's'} at her feet`)
    if (m.pit.some(encoreOf)) bits.push('an encore sparkle over her slime')
    if (asleep > 0) bits.push(`${asleep} slime${asleep === 1 ? '' : 's'} asleep`)
    const fails = failedCount(m)
    if (fails > 0) bits.push(`a red ✗ over her slime: ${fails} failed`)
    return `${m.name} ${bits.join(', ')}`
  })
  const air = view.solo !== null ? `, ${view.members.find(m => m.isSolo)?.name ?? 'one'} on solo under the only light` : view.onAir ? ', live' : anyLit ? '' : ', between sets under a warm house light, the sign off'
  return `Kessoku Band on stage${air}: ${who.join('; ')}`
}

/** The stage: the drawing and the sprites' fit, memoised on what it depends on. */
export function stageDrawing(view: PanelView, layout: SceneLayout): StageDrawing {
  const key = stageKey(view, layout)
  const hit = stageMemo.get(key)
  if (hit !== undefined) return hit
  const drawn = drawStage(view, layout)
  if (stageMemo.size > 48) stageMemo.clear()
  stageMemo.set(key, drawn)
  return drawn
}

/**
 * The furniture spliced into the sprites' markup, each piece just after the
 * figure it stands before (the kit after Nijika, the mic after Kita), so a
 * figure in front of it stands over it and the figures behind stay behind:
 * `thens[k]` follows `parts[k]`, drawn or not (a part with no sprite, or left
 * out to fit, keeps its furniture). A drawn part with a wrap (`wraps[k]`, a
 * group's attributes: a clip, an id its copies use) is drawn inside that group.
 */
function spliceAfter(markup: string, parts: readonly SpritePart[], thens: readonly string[], wraps: readonly string[] = []): string {
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

function drawStage(view: PanelView, layout: SceneLayout): StageDrawing {
  const g = geoOf(view, layout.width)
  const { W, z, lip, H, can, front, riser, wallFoot, edge, face, rx0, rx1 } = g
  const members = view.members
  const anyLit = members.some(m => m.isLit)
  const solo = view.solo !== null
  // each member's spot, by her place in the band's order (the view lists them so)
  const spot = (i: number): Spot => g.spots[i] ?? { cx: g.quarter * (i + 0.5), feet: front, row: 1 }
  const cx = (i: number) => spot(i).cx
  const feetOf = (i: number) => spot(i).feet
  // her cone's half-width at her feet (Nijika's takes in her kit)
  const spread = (m: MemberView) => (m.member === 'nijika' ? 40 : 30) * z * (m.isSolo ? 1.2 : 1)
  const at = (who: Member) => members.findIndex(m => m.member === who)
  const dimmed = (i: number, body: string) => (members[i]?.isDim === true ? `${DIM_SOLID}${body}</g>` : body)

  // --- the room: the brick wall, the deck (its boards closer together toward the back), the drum riser, the amps
  let back = `<rect width="${f(W)}" height="${f(lip)}" fill="url(#br)"/><rect width="${f(W)}" height="${f(lip)}" fill="url(#ws)"/>`
  back += `<rect y="${f(wallFoot)}" width="${f(W)}" height="${f(lip - wallFoot)}" fill="url(#wd)"/><path d="M0 ${f(wallFoot)}H${f(W)}" stroke="#0a0608" stroke-width="2"/>`
  let planks = ''
  for (let py = wallFoot + 3 * z, step = 3 * z; py < lip - 2; step *= 1.22, py += step) planks += `M0 ${f(py)}H${f(W)}`
  back += `<path d="${planks}" stroke="#120a0a" stroke-opacity=".4"/>`
  // the riser: its shadow on the deck, its carpeted top (the nearer half a shade lighter), the lit nosing along its
  // front edge, its black skirted face (its pleats a dashed stroke)
  const rw = rx1 - rx0
  back += `<rect x="${f(rx0 - z)}" y="${f(face)}" width="${f(rw + 2 * z)}" height="${f(3 * z)}" fill="#000" opacity=".5"/>`
  back += `<rect x="${f(rx0)}" y="${f(wallFoot)}" width="${f(rw)}" height="${f(edge - wallFoot)}" fill="#33262b"/><rect x="${f(rx0)}" y="${f(riser - z)}" width="${f(rw)}" height="${f(edge - riser + z)}" fill="#43333a"/>`
  back += `<rect x="${f(rx0)}" y="${f(edge)}" width="${f(rw)}" height="${f(face - edge)}" fill="#1a1317"/><path d="M${f(rx0 + 4 * z)} ${f((edge + z + face) / 2)}H${f(rx1)}" stroke="#2a2026" stroke-width="${f(face - edge - z)}" stroke-dasharray="${z} ${5 * z}"/>`
  back += `<rect x="${f(rx0)}" y="${f(edge)}" width="${f(rw)}" height="${f(z)}" fill="#a98a7c"/>`
  // the amps: Bocchi's half stack on the deck by the wall, behind her shoulder; Ryo's bass rig at the riser's back, by her
  const bi = at('bocchi')
  const ri = at('ryo')
  let gear = ''
  if (bi >= 0) gear += dimmed(bi, placedArt(Math.max(cx(bi) - 38 * z, Math.min(2 * z, cx(bi) - 30 * z)), riser - 41 * z, z, AMP))
  if (ri >= 0) gear += dimmed(ri, placedArt(cx(ri) + 19 * z, riser - 49 * z, z, CAB))
  back += `<g shape-rendering="crispEdges">${gear}</g>`
  members.forEach((m, i) => {
    if (m.isLit) back += `<ellipse cx="${f(cx(i))}" cy="${f(feetOf(i) + z)}" rx="${f(spread(m))}" ry="${f(6 * z)}" fill="url(#p${i})"/>`
  })

  // --- the band, the kit and the mic, and their slimes
  const parts: SpritePart[] = []
  const thens: string[] = []
  const marks: string[] = []
  // a dimmed member's marks dim with her (under the room's dark), so nothing of hers outshines the soloist
  const dimMarks: string[] = []
  // the back line first, so the front line stands over it; a soloist stands over the others of her own line only (her
  // light, the room's dark and their dim already set her apart), so the stage keeps its depth on a solo
  const order = members.map((m, i) => ({ m, i })).sort((a, b) => spot(a.i).row * 2 + (a.m.isSolo ? 1 : 0) - (spot(b.i).row * 2 + (b.m.isSolo ? 1 : 0)))
  const wraps: string[] = []
  let clipDefs = ''
  // the kit's frame on the stage (Nijika's)
  const ni = at('nijika')
  const kitAt = ni < 0 ? null : { x: Math.round(cx(ni) - 48 * z), y: Math.round(feetOf(ni) - 94 * z) }
  for (const { m, i } of order) {
    const fx = Math.round(cx(i) - 48 * z)
    const fy = Math.round(feetOf(i) - 94 * z)
    const id = `${m.member}-${m.mood}`
    parts.push({ id, x: fx, y: fy, zoom: z, dim: m.isDim })
    let then = ''
    let wrap = ''
    if (m.member === 'nijika') {
      // her kit stands before her; its cymbals glint, and shimmer while she plays. She sits behind it: nothing of her
      // below its drums' heads shows between them (in her box, the box stands on the riser behind it, whole)
      const kit = kitArt()
      then = dimmed(i, placedArt(fx, fy, z, `${kit.body}${m.isLit && !m.isDim ? `<g class="gl">${kit.glint}</g>` : kit.glint}`))
      if (m.mood !== 'hiding') {
        wrap = 'clip-path="url(#nk)"'
        clipDefs += `<clipPath id="nk"><path d="M0 0H${f(W)}V${f(fy + KIT_SEAT * z)}H0z"/></clipPath>`
      }
    } else if (m.member === 'kita') then = dimmed(i, placedArt(fx, fy, z, micArt()))
    if (spot(i).row === 1 && MARKS[id] !== undefined && kitAt !== null && marksOnKit(id, fx - kitAt.x, fy - kitAt.y, z)) {
      // standing before the kit, her marks over her shoulder (notes, squiggles, drops) would read as drawn on its
      // drums: where any of them would touch it, they are left out
      wrap = `clip-path="url(#m${i})"`
      clipDefs += `<clipPath id="m${i}"><path clip-rule="evenodd" d="M0 0H${f(W)}V${f(H)}H0z${(MARKS[id] ?? []).map(([c0, r0, c1, r1]) => `M${f(fx + c0 * z)} ${f(fy + r0 * z)}H${f(fx + c1 * z)}V${f(fy + r1 * z)}H${f(fx + c0 * z)}z`).join('')}"/></clipPath>`
    }
    thens.push(then)
    wraps.push(wrap)
  }
  // the pits (one row along the front, each in her quarter) and their marks, placed clear of each other and of the legs
  // a slime drawn again (the same member's, in the same state) is a copy of the first one drawn: her pit pays for one
  const pits = pitPlan(view, g)
  const firsts = new Map<string, { k: number; x: number }>()
  for (const pd of pits) {
    for (const s of pd.slimes) {
      const id = `${pd.m.member}-slime-${s.p.state}`
      const first = firsts.get(id)
      if (first !== undefined) {
        wraps[first.k] = `id="q${first.k}"`
        thens[thens.length - 1] += `<use href="#q${first.k}" x="${f(s.x - first.x)}"/>`
        continue
      }
      if (animOf(id) !== undefined) firsts.set(id, { k: parts.length, x: s.x })
      parts.push({ id, x: s.x, y: g.slimeTop, zoom: z, dim: pd.m.isDim })
      thens.push('')
      wraps.push('')
    }
    for (const mk of pd.marks) (pd.m.isDim ? dimMarks : marks).push(mk.svg)
  }

  // --- light and air, over the band
  // the dark of the room, the lit cones cut out of it; the front of the floor stays in the house light. On a solo
  // the dark also takes the dimmed members' pits, so nothing of theirs outshines the soloist.
  const darkness = anyLit ? (solo ? 0.66 : 0.6) : 0.34
  let over = dimMarks.length > 0 ? `<g opacity=".55">${dimMarks.join('')}</g>` : ''
  over += `<rect width="${f(W)}" height="${f(solo ? lip : front + 6 * z)}" fill="#050307" opacity="${darkness}" mask="url(#dk)"/>`
  // the cones: soft light screened over the band, nothing animated inside the blend (a moving mote there repaints the whole stage)
  let beams = ''
  members.forEach((m, i) => {
    if (!m.isLit) return
    const s = spread(m)
    beams += `<polygon points="${f(cx(i) - 4)},${can + 6} ${f(cx(i) + 4)},${can + 6} ${f(cx(i) + s)},${f(feetOf(i) + 4)} ${f(cx(i) - s)},${f(feetOf(i) + 4)}" fill="url(#g${i})"/>`
  })
  if (beams !== '') over += `<g style="mix-blend-mode:screen"><g filter="url(#sf)">${beams}</g></g>`
  if (!anyLit) over += `<ellipse cx="${f(W / 2)}" cy="${f(front - 40 * z)}" rx="${f(W * 0.62)}" ry="${f(80 * z)}" fill="url(#hs)" style="mix-blend-mode:screen"/>`

  // the truss and its cans
  over += `<rect width="${f(W)}" height="${can - 4}" fill="#0b080c"/><path d="M0 ${can - 4}H${f(W)}M0 ${can - 9}H${f(W)}" stroke="#2c2630" stroke-width="1.5"/>`
  over += `<rect y="${can - 10}" width="${f(W)}" height="6" fill="url(#tz)"/>`
  members.forEach((m, i) => {
    over += `<use href="#cn" x="${f(cx(i))}"/><ellipse cx="${f(cx(i))}" cy="${can + 6}" rx="5" ry="1.8" fill="${m.isLit ? neonOf(m.member) : '#2a242c'}"/>`
    if (m.isLit) over += `<ellipse cx="${f(cx(i))}" cy="${can + 7}" rx="9" ry="4" fill="${neonOf(m.member)}" opacity=".55" filter="url(#gl)"/>`
  })

  // string lights: one wire, its bulbs as dashes of a round cap in the band's colours, hung shallow over the sign
  const swags = W >= 520 ? 4 : 3
  const sag = 4 + z
  let wire = ''
  for (let s = 0; s < swags; s += 1) {
    const x0 = (W / swags) * s
    const x1 = (W / swags) * (s + 1)
    wire += `M${f(x0)} ${can - 2}Q${f((x0 + x1) / 2)} ${can - 2 + sag * 2} ${f(x1)} ${can - 2}`
  }
  const bulbs = ['#ffe3a3', '#f7a8c9', '#ffd166', '#8fb8ff', '#ff8a65']
  const step = 11 * z + 4
  const dash = (c: string, k: number) => `<use href="#wr" stroke="${c}" stroke-dashoffset="${f(-(k * step) - step / 2)}"/>`
  const bulbRow = `<g id="bl" stroke-linecap="round" stroke-dasharray="0 ${step * bulbs.length}">${bulbs.map(dash).join('')}</g>`
  over += `<use href="#wr" stroke="#2a2128" stroke-width="1.1"/><use href="#bl" stroke-width="8" opacity=".5" filter="url(#gl)"/><use href="#bl" stroke-width="4.2"/>`

  // the neon sign and its star, the LIVE lamp: sized so nothing meets at any width
  const lampH = Math.round(g.signSize * 0.6)
  const lampW = Math.round(lampH * 2.6)
  const lampX = W - 8 - lampW
  const lampY = Math.round(g.signY - g.signSize * 0.66)
  let signSize = g.signSize
  const sign = 'Kessoku Band'
  let signW = textWidth(sign, 'script', signSize) * 1.04
  const starR = Math.round(g.signSize * 0.3)
  const roomRight = lampX - 10
  while (signW + 10 + 2 * starR > roomRight - 10 && signSize > 16) {
    signSize -= 1
    signW = textWidth(sign, 'script', signSize) * 1.04
  }
  const groupW = signW + 10 + 2 * starR
  const gx = Math.max(10, Math.min(W / 2 - groupW / 2, roomRight - groupW))
  const signX = gx + signW / 2
  const signY = g.signY
  const starX = gx + signW + 10 + starR
  const starY = signY - signSize * 0.52
  if (view.onAir || anyLit) over += `<ellipse cx="${f(signX)}" cy="${f(signY - signSize * 0.35)}" rx="${f(signW * 0.7)}" ry="${f(signSize * 0.95)}" fill="url(#sg)" style="mix-blend-mode:screen"/>`
  const lit = view.onAir
  over += `<text id="sn" x="${f(signX)}" y="${f(signY)}" text-anchor="middle" font-family="${SCRIPT}" font-size="${signSize}" font-weight="bold" fill="none">${sign}</text>`
  let starD = ''
  for (let s = 0; s < 10; s += 1) {
    const a = -Math.PI / 2 + (s * Math.PI) / 5
    const rr = s % 2 === 1 ? starR * 0.45 : starR
    starD += `${s === 0 ? 'M' : 'L'}${f(starX + rr * Math.cos(a))} ${f(starY + rr * Math.sin(a))}`
  }
  starD += 'z'
  over += `<path id="st" d="${starD}" fill="none"/>`
  over += lit
    ? `<g class="hum" fill="none" stroke-linejoin="round"><use href="#sn" stroke="#ff2f9b" stroke-width="5" opacity=".7" filter="url(#gl)"/><use href="#sn" stroke="#ff7cc0" stroke-width="2.1"/><use href="#sn" stroke="#fff0f8" stroke-width=".7"/><use href="#st" stroke="#ffb300" stroke-width="5" opacity=".65" filter="url(#gl)"/><use href="#st" stroke="#ffd166" stroke-width="2"/><use href="#st" stroke="#fff8dc" stroke-width=".7"/></g>`
    : // the tube off: dark glass with one cold highlight along it, no gas
      `<g fill="none" stroke-linejoin="round"><use href="#sn" stroke="#0e0a0d" stroke-width="4.2" opacity=".6"/><use href="#sn" stroke="#3a3038" stroke-width="3"/><use href="#sn" stroke="#d8cfd6" stroke-width=".8" opacity=".55" transform="translate(-.3 -.6)"/><use href="#st" stroke="#0e0a0d" stroke-width="4" opacity=".6"/><use href="#st" stroke="#3a3038" stroke-width="2.8"/><use href="#st" stroke="#d8cfd6" stroke-width=".8" opacity=".5" transform="translate(-.3 -.6)"/></g>`
  over += `<rect x="${f(lampX)}" y="${lampY}" width="${lampW}" height="${lampH}" rx="3" fill="${lit ? '#3d0c16' : '#1b1216'}" stroke="${lit ? '#ff5d73' : '#3b2a31'}" stroke-width="1.2"/>`
  if (lit) over += `<rect class="lamp" x="${f(lampX - 3)}" y="${lampY - 3}" width="${lampW + 6}" height="${lampH + 6}" rx="6" fill="#ff3d5a" opacity=".25" filter="url(#gl)"/>`
  over += `<text x="${f(lampX + lampW / 2)}" y="${f(lampY + lampH * 0.74)}" text-anchor="middle" font-family="${LAMP_FACE}" font-size="${f(lampH * 0.66)}" font-weight="bold" letter-spacing="1.3" fill="${lit ? '#ffc2ca' : '#5b4850'}">${lit ? 'LIVE' : 'OFF'}</text>`

  // the stage's front
  over += `<rect y="${f(lip)}" width="${f(W)}" height="${f(H - lip)}" fill="url(#fr)"/><path d="M0 ${f(lip + 0.5)}H${f(W)}" stroke="#8a6a55" stroke-opacity=".7"/><path d="M0 ${f(lip + 2)}H${f(W)}" stroke="#000" stroke-opacity=".5"/>`
  members.forEach((m, i) => {
    if (m.isLit) over += `<ellipse cx="${f(cx(i))}" cy="${f(lip + 2)}" rx="${f(spread(m) * 0.7)}" ry="3.5" fill="${neonOf(m.member)}" opacity=".22" filter="url(#sf)"/>`
  })
  over += marks.join('')

  // --- defs and motion
  let defs = `<pattern id="br" width="56" height="20" patternUnits="userSpaceOnUse"><rect width="56" height="20" fill="#150b0f"/><path d="M1 1h26v8.6H1zM29 1h26v8.6H29zM15 11h26v8.6H15zM-13 11h26v8.6H-13zM43 11h26v8.6H43z" fill="#331a20"/><path d="M1 1.5h26M29 1.5h26M15 11.5h26M43 11.5h26" stroke="#fff" stroke-opacity=".05"/></pattern>`
  defs += `<linearGradient id="ws" x2="0" y2="1"><stop offset="0" stop-opacity=".55"/><stop offset=".5" stop-opacity=".15"/><stop offset="1" stop-opacity=".5"/></linearGradient>`
  defs += `<linearGradient id="wd" x2="0" y2="1"><stop offset="0" stop-color="#24180f"/><stop offset="1" stop-color="#4f3626"/></linearGradient>`
  defs += `<linearGradient id="fr" x2="0" y2="1"><stop offset="0" stop-color="#1e1519"/><stop offset="1" stop-color="${SCENE_COLORS.plate}"/></linearGradient>`
  defs += `<radialGradient id="sg"><stop offset="0" stop-color="#ff3fa0" stop-opacity="${lit ? 0.26 : 0.08}"/><stop offset="1" stop-color="#ff3fa0" stop-opacity="0"/></radialGradient>`
  if (!anyLit) defs += `<radialGradient id="hs"><stop offset="0" stop-color="#ffc98a" stop-opacity=".2"/><stop offset="1" stop-color="#ffc98a" stop-opacity="0"/></radialGradient>`
  defs += `<filter id="gl" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="3"/></filter><filter id="sf" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="mb" x="-30%" y="-10%" width="160%" height="130%"><feGaussianBlur stdDeviation="8"/></filter>`
  defs += `<path id="wr" d="${wire}" fill="none"/>${bulbRow}<pattern id="tz" width="12" height="6" patternUnits="userSpaceOnUse"><path d="M0 6l6-5 6 5" stroke="#2c2630" fill="none"/></pattern><rect id="cn" x="-6" y="${can - 5}" width="12" height="11" rx="2" fill="#19151b" stroke="#332c36"/>`
  let cut = ''
  members.forEach((m, i) => {
    const c = neonOf(m.member)
    if (!m.isLit) return
    defs += `<linearGradient id="g${i}" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".6"/><stop offset=".6" stop-color="${c}" stop-opacity=".2"/><stop offset="1" stop-color="${c}" stop-opacity=".32"/></linearGradient>`
    defs += `<radialGradient id="p${i}"><stop offset="0" stop-color="${c}" stop-opacity=".7"/><stop offset=".6" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
    const s = spread(m) * 1.16
    cut += `<polygon points="${f(cx(i) - 8)},${can} ${f(cx(i) + 8)},${can} ${f(cx(i) + s)},${f(feetOf(i) + 8)} ${f(cx(i) - s)},${f(feetOf(i) + 8)}"/><ellipse cx="${f(cx(i))}" cy="${f(feetOf(i))}" rx="${f(s)}" ry="${f(12 * z)}"/>`
    // her pit stays in her light too (on a solo the room's dark reaches the pits)
    const mine = pits.find(pd => pd.i === i)?.slimes ?? []
    if (mine.length > 0) {
      const px0 = Math.min(...mine.map(sl => sl.x))
      const px1 = Math.max(...mine.map(sl => sl.x)) + 36 * z
      cut += `<ellipse cx="${f((px0 + px1) / 2)}" cy="${f(g.slimeTop + 14 * z)}" rx="${f((px1 - px0) / 2 + 6 * z)}" ry="${f(13 * z)}"/>`
    }
  })
  defs += `<mask id="dk" maskUnits="userSpaceOnUse" x="0" y="0" width="${f(W)}" height="${f(lip)}"><rect width="${f(W)}" height="${f(lip)}" fill="#fff"/><g filter="url(#mb)">${cut}</g></mask>`
  // the furniture of a dimmed member dims with her: the filter the sprites bring, or its own when no sprite of hers is drawn
  if (members.some(m => m.isDim)) defs += DIM_FILTER_NEW
  if (gear !== '') defs += GRILLES
  defs += clipDefs
  // an encore's two stars, drawn once
  const sparkles = pits.flatMap(pd => pd.marks).filter(mk => mk.kind === 'sparkle')
  if (sparkles.length > 0) defs += SPARKLE_R.map((r, k) => `<path id="s${k + 1}" d="${sparkleD(0, 0, r * z)}"/>`).join('')

  // motion, only what moves now: the neon's hum a shallow flicker once in 48 s (never a blink) and the LIVE lamp
  // breathing while the sign is lit, an encore's twinkle (not while she is dimmed), the cymbals' glint while Nijika plays
  let motion = ''
  if (lit) motion += '.hum{animation:hum 48s linear infinite}.lamp{animation:lamp 3.6s ease-in-out infinite alternate}@keyframes hum{0%,96%,100%{opacity:1}97%{opacity:.82}98%{opacity:.9}}@keyframes lamp{from{opacity:.12}to{opacity:.34}}'
  if (sparkles.some(mk => mk.svg.includes('class="tw'))) motion += '.tw{animation:tw 2.8s ease-in-out infinite}.t2{animation-delay:-1.3s}@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}'
  if (members.some(m => m.member === 'nijika' && m.isLit && !m.isDim)) motion += '.gl{animation:gl .9s steps(1,end) infinite}@keyframes gl{0%{opacity:1}50%{opacity:0}}'
  const css = `.u{font-family:${SANS}}${motion}${motion === '' ? '' : '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'}`

  const alt = stageAlt(view)
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W * 4)}" height="${f(H * 4)}"><style>${css}</style><defs>${defs}</defs>${back}`
  const tail = `${over}</svg>`
  const furniture = thens.reduce((n, t) => n + t.length, 0) + wraps.reduce((n, w) => n + (w === '' ? 0 : `<g ${w}></g>`.length), 0)
  const chrome = head.length + tail.length + furniture
  // a little margin: the source is plain ASCII (no text of anyone's in it), so its characters are its bytes
  const MARGIN = 64
  let budget = SVG_LIMIT - chrome - MARGIN
  // a dimmed member (another's solo) stands in the dark as a solid figure, never a see-through ghost: her parts'
  // see-through wrapper goes, and her filter darkens and greys her at full opacity (the stage brings its own)
  const fit = (n: number) => {
    const r = fitSprites(parts, Math.max(0, n))
    return { levels: r.levels, markup: spliceAfter(r.markup, parts, thens, wraps).split(DIM_GHOST).join(DIM_SOLID).replace(DIM_FILTER_OLD, '') }
  }
  let fitted = fit(budget)
  let svg = head + fitted.markup + tail
  for (let tries = 0; svg.length > SVG_LIMIT - MARGIN && tries < 4; tries += 1) {
    budget -= svg.length - (SVG_LIMIT - MARGIN) + 64
    fitted = fit(budget)
    svg = head + fitted.markup + tail
  }
  if (svg.length > SVG_LIMIT) svg = head + tail
  // the levels name only the parts the sprite table holds (fitSprites leaves the others out)
  return { scene: { svg, alt, height: H }, parts: parts.filter(p => animOf(p.id) !== undefined).map(p => p.id), levels: fitted.levels, chrome }
}

/** The sprites' dimmed wrapper as `fitSprites` writes it, and as the stage draws it: solid, darkened by its filter. */
const DIM_GHOST = '<g opacity="0.35" filter="url(#kessoku-dim)">'
const DIM_SOLID = '<g filter="url(#kessoku-dim)">'
const DIM_FILTER_OLD = '<filter id="kessoku-dim"><feColorMatrix type="saturate" values="0.2"/></filter>'
/** Greyed a little (her colours kept) and darkened to about three fifths, in sRGB, alpha kept: under the room's dark, a figure standing unlit. */
const DIM_FILTER_NEW = '<filter id="kessoku-dim" color-interpolation-filters="sRGB"><feColorMatrix values=".47 .13 .013 0 0 .04 .57 .013 0 0 .04 .13 .45 0 .01 0 0 0 1 0"/></filter>'

/** The stage: the neon sign, the lights, the band and their pit. No clock, no cost. */
export function stageSvg(view: PanelView, layout: SceneLayout): SceneSvg {
  return stageDrawing(view, layout).scene
}

// ---- The plates ----------------------------------------------------------------------------------

/** One item of her status: its words, and the glyph form a narrow plate falls back to. */
type PlateItem = { full: Seg; short: Seg }

/**
 * Her status as items in the one grammar every picture uses (`♪ main loop`,
 * `♪ 1 playing`, `⧗ 1 waiting`, `✓ 2 done`, `✗ 1 failed`, `in her box`), the
 * failure apart (it always shows), and her context as an extra (shown where it
 * fits, always past 85%, red).
 */
function plateItems(m: MemberView): { items: PlateItem[]; fail: PlateItem | null; ctx: PlateItem | null; hot: boolean } {
  const c = chalkOf(m.member)
  const own = m.acts.filter(a => a.id !== 'main')
  const playing = own.filter(a => shownState(a) === 'playing').length
  const waiting = own.filter(a => a.isLive && shownState(a) !== 'playing').length
  const main = m.acts.find(a => a.id === 'main')
  const done = own.filter(a => !a.isLive && shownState(a) === 'done').length
  const stopped = own.filter(a => !a.isLive && shownState(a) === 'stopped').length
  const ctx = m.ctxPercent
  const hot = ctx > 85
  const item = (full: string, short: string, color: string, bold = false): PlateItem => ({ full: { t: full, c: color, bold }, short: { t: short, c: color, bold } })
  const live = main !== undefined && main.isLive
  const items: PlateItem[] = []
  // in her box (and not playing): what would say she rests, or her stopped act or her encore, says so instead
  const boxed = m.mood === 'hiding' && !m.isPlaying
  const box = item('in her box', 'box', SOFT)
  const stop = boxed ? box : item(`${stopped} stopped`, `■ ${stopped}`, SOFT)
  if (live) items.push(item('♪ main loop', '♪ main', c))
  else if (playing > 0 || waiting > 0) {
    if (playing > 0) items.push(item(`♪ ${playing} playing`, `♪ ${playing}`, c))
    if (waiting > 0) items.push(item(`⧗ ${waiting} waiting`, `⧗ ${waiting}`, SOFT))
  } else if (own.some(encoreOf)) items.push(boxed ? box : item('✦ encore!', '✦', c))
  else if (done > 0) items.push(item(`✓ ${done} done`, `✓ ${done}`, MINT), ...(stopped > 0 || boxed ? [stop] : []))
  else if (stopped > 0) items.push(stop)
  else items.push(boxed ? box : item('resting', 'resting', '#a39caa'))
  const fc = failedCount(m)
  const fail = fc > 0 ? { full: { t: `✗ ${fc} failed`, c: RED, bold: true, fixed: true }, short: { t: `✗ ${fc}`, c: RED, bold: true, fixed: true } } : null
  const ctxItem = live || playing > 0 || hot ? item(`ctx ${pctText(ctx)}`, `ctx ${pctText(ctx)}`, hot ? RED : SOFT, hot) : null
  return { items, fail, ctx: ctxItem, hot }
}

/**
 * Her status laid out in at most two lines, words before glyphs: of every way
 * to write it that fits (each item in words or as its glyph, on one line or
 * split over two), the one with the most words, the failure's first; a second
 * line only where it buys words (free when the plates have a second line
 * anyway, `roomy`); her context beside her other words where it fits (always
 * when it runs hot, then on a line of its own if it must). The failure always
 * shows.
 */
function plateLines(m: MemberView, fits: (segs: Seg[]) => boolean, roomy = false): Seg[][] {
  const { items, fail, ctx, hot } = plateItems(m)
  const sep: Seg = { t: ' · ', c: '#6c6370' }
  const join = (xs: Seg[]): Seg[] => xs.flatMap((s, k) => (k === 0 ? [s] : [sep, s]))
  const best: { score: number; lines: Seg[][] } = { score: -1e9, lines: [] }
  for (const withCtx of ctx === null ? [false] : hot ? [true] : [true, false]) {
    const all = [...items, ...(withCtx && ctx !== null ? [ctx] : []), ...(fail === null ? [] : [fail])]
    const n = all.length
    for (let forms = 0; forms < 1 << n; forms += 1) {
      const segs = all.map((it, k) => ((forms >> k) & 1 ? it.short : it.full))
      const words = all.reduce((s, it, k) => s + ((forms >> k) & 1 ? 0 : it === fail ? 12 : it === ctx ? 1 : 10 + (n - k) * 0.1), 0)
      const score = (lines: number) => words + (withCtx ? 2 : 0) - (lines - 1) * (roomy ? 0 : 4)
      if (fits(join(segs)) && score(1) > best.score) {
        best.score = score(1)
        best.lines = [join(segs)]
      }
      for (let k = 1; k < n; k += 1) {
        // her context takes a line of its own only when it runs hot
        if (k === n - 1 && all[k] === ctx && !hot) continue
        const a = join(segs.slice(0, k))
        const b = join(segs.slice(k))
        if (fits(a) && fits(b) && score(2) > best.score) {
          best.score = score(2)
          best.lines = [a, b]
        }
      }
    }
  }
  if (best.lines.length > 0) return best.lines
  // nothing fits whole: the failure, else her first state, as a glyph (a hot context under it)
  const first = [(fail ?? items[0] ?? { full: { t: '', c: SOFT }, short: { t: '', c: SOFT } }).short]
  return hot && ctx !== null ? [first, [ctx.full]] : [first]
}

/**
 * The plates under the stage: each member's name, status and spend, in one
 * voice (the tabular sans, her colour), each under her quarter of the stage.
 * Her plate glows while she plays (her light spilling over the stage's edge),
 * is outlined on her solo, faded on another's.
 */
export function platesSvg(view: PanelView, layout: SceneLayout): SceneSvg {
  const W = layout.width
  const g = stageGeo(W)
  const big = g.z === 3
  const wide = g.wide
  const n = Math.max(1, view.members.length)
  const slot = W / n
  const nameSize = big ? 17.5 : wide ? 14.5 : g.narrow ? 12.5 : 13.5
  const subSize = big ? 15 : wide ? 13 : g.narrow ? 11.5 : 12
  const room = slot - 12
  const fits = (segs: Seg[]) => runsWidth(segs, subSize) <= room
  let lines = view.members.map(m => plateLines(m, fits))
  // a second line any plate needs is room the others may use for their words
  if (lines.some(l => l.length > 1)) lines = view.members.map(m => plateLines(m, fits, true))
  const most = Math.max(1, ...lines.map(l => l.length))
  const lh = subSize + 4
  const nameY = Math.round((big ? 22 : wide ? 19 : 17) + 0.5)
  const subY = Math.round(nameY + subSize + 5)
  const H = Math.round(subY + (most - 1) * lh + subSize * 0.55 + (big ? 11 : 9))
  let body = `<rect width="${f(W)}" height="${H}" fill="url(#pl)"/>`
  let defs = `<linearGradient id="pl" x2="0" y2="1"><stop offset="0" stop-color="${SCENE_COLORS.plate}"/><stop offset=".8" stop-color="${SCENE_COLORS.plate}"/><stop offset="1" stop-color="${SCENE_COLORS.wall}"/></linearGradient>`
  const alts: string[] = []
  view.members.forEach((m, i) => {
    const x = slot * (i + 0.5)
    const c = neonOf(m.member)
    if (m.isLit && !m.isSolo) {
      // her light spilling over the stage's edge: a soft glow from the top of her plate, gone before its sides
      defs += `<radialGradient id="lp${i}"><stop offset="0" stop-color="${c}" stop-opacity=".26"/><stop offset=".55" stop-color="${c}" stop-opacity=".09"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
      body += `<ellipse cx="${f(x)}" cy="0" rx="${f(slot * 0.47)}" ry="${f(H * 0.95)}" fill="url(#lp${i})"/>`
    }
    if (m.isSolo) body += `<rect x="${f(slot * i + 3)}" y="2" width="${f(slot - 6)}" height="${H - 6}" rx="6" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-opacity=".45"/>`
    if (i > 0) body += `<path d="M${f(slot * i)} 9V${H - 9}" stroke="#2c2329"/>`
    // her name and her spend (every plate, idle too)
    body += runs(x, nameY, [{ t: m.name, c, bold: true, faded: m.isDim }, { t: ' ', c: '#d9d1dd' }, { t: m.spend, c: '#d9d1dd', faded: m.isDim }], nameSize, 'middle', '', room)
    // her status in words where they fit (a failure always shows, and stays red on a solo)
    const mine = lines[i] ?? []
    mine.forEach((segs, k) => {
      body += runs(x, subY + k * lh, segs.map(s => ({ ...s, faded: m.isDim && s.fixed !== true })), subSize, 'middle', '', room)
    })
    alts.push(`${m.name} ${m.spend}: ${mine.map(l => l.map(s => s.t).join('')).join(' · ')}${m.isSolo ? ' (solo)' : ''}`)
  })
  const svg = capped(svgDoc(W, H, `<defs>${defs}</defs>${body}`, TEXT_CSS), () => svgDoc(W, H, `<rect width="${f(W)}" height="${H}" fill="${SCENE_COLORS.plate}"/>`))
  return { svg, alt: alts.join('; '), height: H }
}

// ---- The board -------------------------------------------------------------------------------------

/** The board's measures at a width: three tiers of type, the margins, the columns. */
function boardGeo(W: number) {
  // the tiers: narrow, the common pane, a wide one, and the very wide board beside a x3 band (from the same pane width)
  const t = W < 400 ? 0 : W < 540 ? 1 : W < X3_AT - BOARD_INSET ? 2 : 3
  const p = (a: number, b: number, c: number, d = c) => (t === 0 ? a : t === 1 ? b : t === 2 ? c : d)
  const X0 = p(10, 12, 16, 22)
  return {
    W,
    X0,
    X1: W - X0,
    descX: X0 + p(21, 23, 27, 30),
    desc: p(14.5, 15.5, 17.5, 19.5),
    lh: p(18.5, 19.5, 22, 24.5),
    meta: p(12, 12.5, 13.5, 15),
    mlh: p(17, 17.5, 19.5, 21.5),
    small: p(11.5, 12, 12.5, 13.5),
    title: p(22, 24, 28, 32),
    barW: p(28, 34, 44, 52),
    barH: p(6, 6, 7, 8),
    padY: p(7, 7.5, 9.5, 12),
    tray: p(12, 12, 12, 14),
    /** A title's most lines on the board; its details print the rest. */
    titleLines: t === 0 ? 2 : 3,
  }
}
type BoardGeo = ReturnType<typeof boardGeo>

/** The board's top rail, drawn by the head: the frame's wood across the top, joining the frame Box's wooden sides. */
const RAIL = 6

/**
 * The chalk dust over a slice, placed in board coordinates (`y` the slice's
 * top on the board), so it runs on across slices. Translucent: the board's Box
 * gives the green, or a slice paints it itself under the dust (a song's card
 * stencil, its details' card).
 */
function slate(W: number, h: number, y: number): { defs: string; body: string } {
  const defs =
    `<filter id="du" filterUnits="userSpaceOnUse" x="0" y="${f(y)}" width="${f(W)}" height="${f(h)}"><feTurbulence type="fractalNoise" baseFrequency=".018 .042" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .93 0 0 0 0 .96 0 0 0 0 .9 0 0 0 .55 -.2"/></filter>` +
    `<filter id="gr" filterUnits="userSpaceOnUse" x="0" y="${f(y)}" width="${f(W)}" height="${f(h)}"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" seed="2"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 -.55"/></filter>` +
    `<filter id="ck" x="-3%" y="-15%" width="106%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale=".9" xChannelSelector="R" yChannelSelector="G" result="d"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.5 1.72" result="a"/><feComposite in="d" in2="a" operator="in"/></filter>`
  const dust = `<g transform="translate(0 ${f(-y)})"><rect y="${f(y)}" width="${f(W)}" height="${f(h)}" filter="url(#du)" opacity=".42"/><rect y="${f(y)}" width="${f(W)}" height="${f(h)}" filter="url(#gr)" opacity=".28"/></g>`
  return { defs, body: dust }
}

/** A board slice as a document: what it paints under the dust (`base`), the chalk dust, the marks under the chalk, then chalk (filtered) and sans (crisp). */
function boardDoc(W: number, h: number, y: number, chalk: string, crisp: string, defsExtra = '', under = '', base = ''): string {
  const s = slate(W, h, y)
  return svgDoc(W, h, `<defs>${s.defs}${defsExtra}</defs>${base}${s.body}${under}<g filter="url(#ck)">${chalk}</g>${crisp}`, TEXT_CSS)
}

// ---- The opened card: a hand-drawn chalk box round a song and its details --------------------------------------

/** The card's grain: a chalk stroke's coverage broken up, as chalk on a slate is (user space, so it runs on across slices). */
const cardGrain = (W: number, h: number, y: number) =>
  `<filter id="cg" filterUnits="userSpaceOnUse" x="-4" y="-4" width="${f(W + 8)}" height="${f(h + 8)}"><feTurbulence type="fractalNoise" baseFrequency=".9 .7" numOctaves="2" seed="${7 + (Math.round(y) % 5)}" result="n"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 2.05" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`

/**
 * The card's chalk box as one path, drawn twice over as a hand does (the
 * second pass a little inside the first): its top at `top` (or none), its
 * sides from `from` to `to`, its foot at `foot` (or none). A side's ends sit
 * exactly at the box's x, so a side drawn in two slices meets itself.
 */
function cardLines(W: number, top: number | null, from: number, to: number, foot: number | null, seed: string): { outer: string; inner: string } {
  const x0 = CARD.inset
  const x1 = W - CARD.inset
  const pass = (k: 0 | 1, gap: number, amp: number) => {
    const a = x0 + gap
    const b = x1 - gap
    let d = ''
    // the corners overshoot a little, the strokes crossing as a quick hand's do
    if (top !== null) d += wobble(a - 2.6 + k, top + gap, b + 2.2 - k, top + gap + 0.4, `${seed}t${k}`, amp, 24)
    d += wobble(a, from, a, to, `${seed}l${k}`, amp * 0.9, 20) + wobble(b, from, b, to, `${seed}r${k}`, amp * 0.9, 20)
    if (foot !== null) d += wobble(a - 2.2 + k, foot - gap, b + 2.6 - k, foot - gap - 0.4, `${seed}f${k}`, amp, 24)
    return d
  }
  return { outer: pass(0, 0, 0.7), inner: pass(1, CARD.gap, 1.1) }
}

/** The card's two passes of chalk, stroked: the first firm, the second lighter and thinner. */
const cardStrokes = (lines: { outer: string; inner: string }, color: string) =>
  `<g fill="none" stroke="${color}" stroke-linecap="round" filter="url(#cg)"><path d="${lines.outer}" stroke-width="1.5"/><path d="${lines.inner}" stroke-width="1.05" stroke-opacity=".5"/></g>`

/**
 * A song's card stencil: the board's green painted under the song, fully round
 * the chalk box, a shade thinner inside it, and not at all along its lines, so
 * the Box's colour shows through: the board at rest (nothing shows), her chalk
 * under the pointer (the box's lines, and inside them the wash).
 */
function cardStencil(W: number, h: number, y: number, seed: string): { defs: string; base: string } {
  const x0 = CARD.inset
  const x1 = W - CARD.inset
  const lines = cardLines(W, CARD.top, CARD.top - 2.4, h, null, seed)
  const defs = `${cardGrain(W, h, y)}<mask id="cm" maskUnits="userSpaceOnUse" x="0" y="0" width="${f(W)}" height="${f(h)}"><rect width="${f(W)}" height="${f(h)}" fill="#fff"/><rect x="${f(x0)}" y="${f(CARD.top)}" width="${f(x1 - x0)}" height="${f(h - CARD.top + 1)}" fill="#000" fill-opacity="${CARD_WASH}"/>${cardStrokes(lines, '#000')}</mask>`
  return { defs, base: `<rect width="${f(W)}" height="${f(h)}" fill="${SCENE_COLORS.board}" mask="url(#cm)"/>` }
}

/**
 * The card's lower part, under the song (only seen while it is open): the
 * board's green round it, the wash inside, and the box's sides and foot in her
 * chalk, its foot at `foot`.
 */
function cardBottom(W: number, h: number, y: number, foot: number, member: Member, seed: string): { defs: string; base: string } {
  const x0 = CARD.inset
  const x1 = W - CARD.inset
  const line = cardLine(member)
  const lines = cardLines(W, null, 0, foot + 2.4, foot, seed)
  return {
    defs: cardGrain(W, h, y),
    base: `<rect width="${f(W)}" height="${f(h)}" fill="${SCENE_COLORS.board}"/><rect x="${f(x0)}" width="${f(x1 - x0)}" height="${f(foot)}" fill="${shadeToward(SCENE_COLORS.board, line, CARD_WASH)}"/>${cardStrokes(lines, line)}`,
  }
}

// Chalk marks in a 14 px box, its top-left at (x, y).
const MARK: Record<ActView['state'], (x: number, y: number, c: string) => string> = {
  playing: (x, y, c) => `<g fill="${c}" stroke="${c}"><ellipse cx="${f(x + 4)}" cy="${f(y + 11)}" rx="3.6" ry="2.7" transform="rotate(-22 ${f(x + 4)} ${f(y + 11)})" stroke="none"/><path d="M${f(x + 7.2)} ${f(y + 10.6)}V${f(y + 0.6)}q3.4 1.4 5.4 5" fill="none" stroke-width="1.6" stroke-linecap="round"/></g>`,
  waiting: (x, y, c) => `<path d="M${f(x + 1.5)} ${f(y + 0.5)}h10M${f(x + 1.5)} ${f(y + 13)}h10M${f(x + 2.5)} ${f(y + 0.5)}q0 4.5 4 6.3q-4 1.8-4 6.2M${f(x + 10.5)} ${f(y + 0.5)}q0 4.5-4 6.3q4 1.8 4 6.2" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`,
  done: (x, y, c) => `<path d="M${f(x + 0.5)} ${f(y + 7.5)}q2 1.4 4.2 5.2q3.2-7.6 9-12.4" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  failed: (x, y, c) => `<path d="M${f(x + 1)} ${f(y + 1)}q6 5.5 12 12.2M${f(x + 12.6)} ${f(y + 0.6)}q-6.4 5.8-11.8 12.6" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`,
  stopped: (x, y, c) => `<path d="M${f(x + 1.5)} ${f(y + 7)}h11" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`,
}

/** A context bar: a solid chalk fill on a faint track, red past 85%. Returns the track (crisp) and the fill (chalk). */
function ctxBar(x: number, y: number, w: number, h: number, pct: number, color: string): { track: string; fill: string } {
  const p = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0))
  const fw = p <= 0 ? 0 : Math.max(2.5, (w * p) / 100)
  const col = pct > 85 ? RED : color
  return {
    track: `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="#e9f0ea" fill-opacity=".1" stroke="#e9f0ea" stroke-opacity=".22" stroke-width=".8"/>`,
    fill: fw > 0 ? `<rect x="${f(x)}" y="${f(y)}" width="${f(fw)}" height="${f(h)}" rx="${f(Math.min(h / 2, fw / 2))}" fill="${col}"/>` : '',
  }
}

/** Tally strokes for a count up to ten: bundles of five, the fifth struck across. Returns the markup and its width. */
function tally(x: number, base: number, count: number, color: string, h: number): { svg: string; w: number } {
  if (count > 10 || count <= 0) return { svg: '', w: 0 }
  let d = ''
  let cx = x
  for (let i = 0; i < count; i += 1) {
    if (i % 5 === 4) {
      d += `M${f(cx - 13.4)} ${f(base - h * 0.25)}L${f(cx - 0.6)} ${f(base - h * 0.8)}`
      cx += 4
    } else {
      d += `M${f(cx + 0.5)} ${f(base)}v${f(-h)}`
      cx += 3.2
    }
  }
  return { svg: `<path d="${d}" stroke="${color}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".8"/>`, w: cx - x - 2.2 }
}

/** The colours a finished song's figures settle to, so the playing ones stand out. */
const DONE_FIG = '#b9c3bc'
const DONE_AGE = '#aab4ad'
/** A tool call that errored in an act that carried on: amber, not the failure's red. */
const AMBER = '#f0a35e'

/** Whose name a song carries on its figures' line: none on her own page, `main loop` for the main loop (its colour says Bocchi). */
function labelOf(view: PanelView, act: ActView): string {
  if (act.id === 'main') return 'main loop'
  return view.solo !== null ? '' : NAME[act.member] ?? act.member
}

/**
 * The words before the tool and the tool: `now` while it plays, `last` once
 * it waits or ended (its mark says which); with no tool, `now thinking` or
 * `waiting`.
 */
function toolWords(act: ActView): { pre: string; tool: string } {
  const tool = oneLine(act.tool)
  const st = shownState(act)
  if (tool === '') return { pre: st === 'playing' ? 'now thinking' : st === 'waiting' ? 'waiting' : '', tool: '' }
  return { pre: st === 'playing' ? 'now' : 'last', tool }
}

/** Whether a song's tool fits at x before the board's edge: whole, or as a path shortened at its front that keeps its file's name. */
function toolFits(act: ActView, x: number, g: BoardGeo): boolean {
  const { pre, tool } = toolWords(act)
  if (pre === '') return true
  if (tool === '') return x + textWidth(pre, 'ui', g.meta) * 1.04 <= g.X1
  const room = (g.X1 - x - textWidth(`${pre} `, 'ui', g.meta)) / 1.04
  if (textWidth(tool, 'ui', g.meta) <= room) return true
  const file = /\/([^/\s]+)$/.exec(tool)?.[1]
  return file !== undefined && fitTool(tool, 'ui', g.meta, room).endsWith(`/${file}`)
}

/** A song's time: bare while it plays (how long so far), `ran 2:40` once it ended. */
const ageSegs = (act: ActView, color: string): Seg[] => (act.isLive ? [{ t: act.age, c: color }] : [{ t: 'ran ', c: LABEL }, { t: act.age, c: color }])

/** Its title as one line, never empty, never endless. */
const titleOf = (act: ActView) => {
  const t = oneLine(act.title)
  return t === '' ? '(untitled)' : t.slice(0, 1200)
}

/** The title as the board writes it: at most `titleLines` lines, the first beside the time. */
function titleWrap(act: ActView, g: BoardGeo): { lines: string[]; cut: boolean } {
  const ageW = runsWidth(ageSegs(act, WHITE), g.meta + 0.5)
  const descMax = g.X1 - g.descX
  return wrapLines(titleOf(act), 'ink', g.desc, descMax, descMax - ageW - 10, g.titleLines)
}

/**
 * The board's one rhythm, decided over every song it draws so each row
 * agrees (a song and its details too): where the cost and whose name sit,
 * where `now`/`last` starts (10 px after the widest name), and whether every
 * row puts the tool on a line of its own (always below 400 px; else when any
 * row's tool would not fit beside its figures). Measured over the plan the
 * board is drawn with (the default one when none is given), so a song folded
 * out of a compact board never moves or heightens the rows that are drawn.
 */
type MetaCols = { costX: number; nameX: number; toolX: number; ownLine: boolean }

/** Per view, by the width and the songs drawn. */
const colsMemo = new WeakMap<PanelView, Map<string, MetaCols>>()

function metaCols(view: PanelView, g: BoardGeo, plan?: BoardPlan): MetaCols {
  let memo = colsMemo.get(view)
  if (memo === undefined) {
    memo = new Map()
    colsMemo.set(view, memo)
  }
  const songs = (plan ?? boardPlan(view)).songs
  const key = JSON.stringify([g.W, songs.map(a => a.id)])
  const hit = memo.get(key)
  if (hit !== undefined) return hit
  const costX = g.descX + g.barW + 6 + textWidth('100%', 'ui', g.meta) + 9
  const costW = Math.max(textWidth('$0.00', 'ui', g.meta), ...songs.map(a => textWidth(a.cost, 'ui', g.meta)))
  const nameX = costX + costW + 10
  const labelW = Math.max(0, ...songs.map(a => (labelOf(view, a) === '' ? 0 : textWidth(labelOf(view, a), a.id === 'main' ? 'uib' : 'ui', g.meta))))
  const toolX = nameX + (labelW > 0 ? labelW + 10 : 0)
  const ownLine = g.W < 400 || songs.some(a => !toolFits(a, toolX, g))
  const cols = { costX, nameX, toolX, ownLine }
  if (memo.size > 16) memo.clear()
  memo.set(key, cols)
  return cols
}

type SongLayout = {
  geo: BoardGeo
  cols: MetaCols
  lines: string[]
  base0: number
  metaY: number
  /** The tool beside the figures, or on a line of its own on every row. */
  toolY: number
  toolX: number
  toolPre: string
  toolText: string
  nameText: string
  reasonLines: string[]
  reasonY: number
  /** A tool call that errored in an act that carried on: its own amber line. */
  errLines: string[]
  errY: number
  detailTop: number
  height: number
}

/** Everything a song's drawing needs, measured (its columns over the plan the board is drawn with). */
function songLayout(view: PanelView, act: ActView, geo: BoardGeo, expanded: boolean, plan?: BoardPlan): SongLayout {
  const g = geo
  const cols = metaCols(view, g, plan)
  const { lines, cut } = titleWrap(act, g)
  const base0 = g.padY + g.desc * 0.82
  const metaY = base0 + (lines.length - 1) * g.lh + g.mlh + 1
  const nameText = labelOf(view, act)
  const { pre, tool } = toolWords(act)
  const own = cols.ownLine && pre !== ''
  const toolX = own ? g.descX : cols.toolX
  const toolY = own ? metaY + g.mlh : metaY
  // its own line keeps it whole where it can; a path keeps its file's name
  const toolText = tool === '' ? '' : fitTool(tool, 'ui', g.meta, (g.X1 - toolX - textWidth(`${pre} `, 'ui', g.meta)) / 1.04)
  let y = toolY
  const hard = hardFail(act)
  const why = hard || shownState(act) === 'stopped' ? reasonOf(view, act) : ''
  const lineW = g.X1 - g.descX
  // a failure's reason in red, the FAILED stamp at the end of its first line
  const reasonLines = why === '' ? [] : wrapText(hard ? `✗ ${why}` : why, 'ui', g.meta, lineW, lineW - (hard ? stampWidth(g) + 8 : 0), 3)
  const reasonY = y + g.mlh
  y += reasonLines.length * g.mlh
  const err = toolErr(act) ? ownError(view, act) : ''
  const errLines = err === '' ? [] : wrapText(`⚠ last error: ${err}`, 'ui', g.small, lineW, lineW, 2)
  const elh = g.mlh - 1
  const errY = y + elh
  y += errLines.length * elh
  const detailTop = y + 6
  let height = y + g.padY + 2
  if (expanded) height = detailTop + detailLayout(view, act, g, detailTop, cut, false, toolText !== tool).height
  return { geo: g, cols, lines, base0, metaY, toolY, toolX, toolPre: pre, toolText, nameText, reasonLines, reasonY, errLines, errY, detailTop, height: Math.ceil(height) }
}

const stampSize = (g: BoardGeo) => Math.max(11, g.small - 1)
const stampWidth = (g: BoardGeo) => textWidth('FAILED', 'uib', stampSize(g)) + 1.2 * 6 + 12

/** Seconds as a clock: `0:48`, `1h04m`. */
function clock(s: number): string {
  const n = Math.max(0, Math.round(s))
  if (n < 3600) return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
  return `${Math.floor(n / 3600)}h${String(Math.floor((n % 3600) / 60)).padStart(2, '0')}m`
}

/** When it started (live) or ended, said plainly: `started 0:48 ago` on air, `ended at 3:42 of the 6:02 set` between sets. */
function whenOf(view: PanelView, act: ActView): string {
  const verb = act.isLive ? 'started' : 'ended'
  if (/ago\s*$/.test(act.at)) return `${verb} ${act.at}`
  const at = atSeconds(act.at)
  if (view.setLength === '' || act.at === '' || at < 0) return act.at === '' ? verb : `${verb} ${act.at} into the set`
  const len = atSeconds(view.setLength)
  return view.onAir ? `${verb} ${clock(len - at)} ago` : `${verb} at ${act.at} of the ${view.setLength} set`
}

type DetailLayout = { chalk: string; crisp: string; height: number; foot: number }

/** The details' labels, chalked faint in the margin (light enough to read on her card's wash). */
const DETAIL_LABEL = '#a7b6ac'
/** The details' separators, faint but legible on the wash. */
const DETAIL_SEP = '#a0afa5'

/**
 * A song's details at `top`, in the same chalk as the song: its whole title
 * when the board cut it, the tools it used (names in chalk, counts as digits
 * with tally strokes), its model, steps and tokens, what kind of act it is and
 * when it ran, and (`hand`: when the song's row had to shorten it) the tool
 * in its hands in full. On her opened `card` a short rule of her chalk
 * parts them from the song, and the card's foot (`foot`) closes them.
 */
function detailLayout(view: PanelView, act: ActView, g: BoardGeo, top: number, cut: boolean, card = false, hand = false): DetailLayout {
  const c = chalkOf(act.member)
  const { pre, tool } = toolWords(act)
  const handLabel = !hand || pre === '' || tool === '' ? '' : pre.split(' ')[0] ?? ''
  const labels = ['tools', 'model', 'act', handLabel].filter(l => l !== '')
  const labelSize = g.meta
  const labelW = Math.max(...labels.map(l => textWidth(l, 'ink', labelSize))) + 12
  const vx = g.descX + labelW
  const size = g.meta
  const room = g.X1 - vx
  let crisp = ''
  let chalk = ''
  if (card) chalk += `<path d="${wobble(g.descX, top + 1.5, g.descX + Math.min(g.X1 - g.descX, 90 + g.W * 0.08), top + 2, `dr${act.id}`, 0.7, 20)}" stroke="${c}" stroke-width="1.1" stroke-dasharray="7 4 12 5" opacity=".34" fill="none" stroke-linecap="round"/>`
  let y = top + (card ? 6 : 0) + g.meta * 0.95
  const row = (label: string) => {
    chalk += chalkLine(g.descX, y, label, labelSize, DETAIL_LABEL)
  }
  // the title the board cut, whole (to a point), carried on in her chalk
  if (cut) {
    for (const ln of wrapText(titleOf(act), 'ink', g.desc - 1, g.X1 - g.descX, g.X1 - g.descX, 8)) {
      chalk += chalkLine(g.descX, y, ln, g.desc - 1, c)
      y += g.lh - 1
    }
    y += 4
  }
  // tools: the name in chalk, the count in digits, tally strokes after it, a dot centred in each gap
  row('tools')
  const tools = act.tools.slice(0, 12)
  if (tools.length === 0) crisp += T(vx, y, 'none yet', size, SOFT, 'u')
  const GAP = 16
  let x = vx
  tools.forEach((t, k) => {
    const nameW = textWidth(t.name, 'ink', size + 0.5)
    const countW = textWidth(String(t.count), 'uib', size)
    const marks = tally(0, 0, t.count, c, size * 0.66)
    const itemW = nameW + 4 + countW + (marks.w > 0 ? 5 + marks.w : 0)
    if (k > 0 && x + GAP + itemW > g.X1) {
      x = vx
      y += g.mlh
    } else if (k > 0) {
      crisp += T(x + GAP / 2, y, '·', size, DETAIL_SEP, 'u', ' text-anchor="middle"')
      x += GAP
    }
    chalk += chalkLine(x, y, t.name, size + 0.5, WHITE)
    crisp += fixedT(x + nameW + 4, y, String(t.count), size, c, 'uib')
    x += nameW + 4 + countW
    if (marks.w > 0) {
      chalk += tally(x + 5, y - 0.5, t.count, c, size * 0.66).svg
      x += 5 + marks.w
    }
  })
  if (act.tools.length > tools.length) crisp += T(Math.min(x + 8, g.X1 - 30), y, `+${act.tools.length - tools.length}`, size, DETAIL_SEP, 'u')
  // model, steps, tokens: chalked, as the rest of the card
  const hs = size + 0.5
  y += g.mlh
  row('model')
  const model = act.model === '' ? 'no reply yet' : modelName(act.model)
  const fig = `${model} · ${act.steps} step${act.steps === 1 ? '' : 's'} · ${act.tokens || '0'} tokens`
  for (const ln of wrapText(fig, 'ink', hs, room, room, 2)) {
    chalk += chalkLine(vx, y, ln, hs, WHITE)
    y += g.mlh
  }
  // what kind of act, and when it ran
  row('act')
  const kind = typeName(act.type)
  const when = `${kind === 'main loop' || / agent$/.test(kind) ? kind : `${kind} agent`} · ${whenOf(view, act)}`
  for (const ln of wrapText(when, 'ink', hs, room, room, 2)) {
    chalk += chalkLine(vx, y, ln, hs, WHITE)
    y += g.mlh
  }
  // the tool in her hands (or the last she held), whole: the sans, as the song's own row has it
  if (handLabel !== '') {
    row(handLabel)
    for (const ln of wrapText(tool, 'ui', size, room, room, 3)) {
      crisp += sansLine(vx, y, ln, size, act.isLive ? WHITE : SOFT, room)
      y += g.mlh
    }
  }
  const end = y - g.mlh + g.meta * 0.35
  // her card closes a little under its last row; in place (a solo's page) the song's own padding does
  const foot = card ? end + 8 + CARD.gap : end
  const height = card ? foot + 4 - top : end - top + g.padY + 4
  return { chalk, crisp, height, foot }
}

/** One song's drawing in its own slice coordinates (top 0). */
function songMarkup(view: PanelView, act: ActView, L: SongLayout, expanded: boolean): { chalk: string; crisp: string; defs: string; under: string } {
  const g = L.geo
  const c = chalkOf(act.member)
  const st = shownState(act)
  const hard = hardFail(act)
  // a finished song (done or stopped) settles back, so what plays reads at a glance
  const done = !act.isLive && !hard
  let chalk = ''
  let crisp = ''
  let defs = ''
  let under = ''
  // the line between songs
  chalk += `<path d="${wobble(g.X0, 1.2, g.X1, 1.2, `dv${act.id}`, 0.6, 30)}" stroke="${FAINT}" stroke-width=".8" stroke-dasharray="3 5" opacity=".5" fill="none"/>`
  // a playing song carries a tick of her colour inside the rail, beside its title and figures, so what plays reads at
  // a glance; it runs where her opened card's left side does, so the two never stand side by side
  if (st === 'playing') {
    defs += `<linearGradient id="tk" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".35"/></linearGradient>`
    under += `<rect x="${f(CARD.inset - 1.1)}" y="${f(g.padY - 1)}" width="2.2" height="${f(Math.max(L.metaY, L.toolY) + 3 - g.padY + 1)}" rx="1.1" fill="url(#tk)"/>`
  }
  // the mark
  const markC = hard ? RED : st === 'stopped' ? SOFT : done ? MINT : st === 'waiting' ? SOFT : c
  chalk += MARK[st](g.X0, L.base0 - 11.5, markC)
  if (encoreOf(act)) chalk += sparkle(g.X0 + 16, L.base0 - 13, 3.2, c) + sparkle(g.X0 + 1, L.base0 - 14, 2, WHITE)
  // the title (at most a few lines; its details print the rest)
  L.lines.forEach((ln, j) => {
    const y = L.base0 + j * g.lh
    chalk += chalkLine(g.descX, y, ln, g.desc, c, done ? ' opacity=".6"' : '')
    if (hard) chalk += `<path d="${wave(g.descX - 1, y + 4, textWidth(ln, 'ink', g.desc) + 2)}" stroke="${RED}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".9"/>`
  })
  // its time, top right: bare while it plays, `ran` once it ended
  const age = ageSegs(act, hard ? RED : done ? DONE_AGE : WHITE)
  crisp += runs(g.X1, L.base0, age, g.meta + 0.5, 'end', '', runsWidth(age, g.meta + 0.5))
  // the figures: context, cost, whose, and the tool in her hands, every row on the board's own columns,
  // each held to its measured width so a wider fallback face cannot run one into the next
  const bar = ctxBar(g.descX, L.metaY - g.meta * 0.36 - g.barH / 2, g.barW, g.barH, act.ctxPercent, c)
  crisp += bar.track
  chalk += done && bar.fill !== '' ? `<g opacity=".55">${bar.fill}</g>` : bar.fill
  const figC = done ? DONE_FIG : WHITE
  crisp += fixedT(g.descX + g.barW + 6 + textWidth('100%', 'ui', g.meta), L.metaY, pctText(act.ctxPercent), g.meta, act.ctxPercent > 85 ? RED : figC, 'ui', ' text-anchor="end"')
  crisp += fixedT(L.cols.costX, L.metaY, act.cost, g.meta, figC, 'ui')
  if (L.nameText !== '') crisp += fixedT(L.cols.nameX, L.metaY, L.nameText, g.meta, c, act.id === 'main' ? 'uib' : 'ui')
  if (L.toolPre !== '') crisp += runs(L.toolX, L.toolY, L.toolText === '' ? [{ t: L.toolPre, c: LABEL }] : [{ t: `${L.toolPre} `, c: LABEL }, { t: L.toolText, c: act.isLive ? WHITE : SOFT }], g.meta, 'start', '', g.X1 - L.toolX)
  // a failure: the reason on its own red line, a stamp at its end
  L.reasonLines.forEach((ln, j) => {
    crisp += sansLine(g.descX, L.reasonY + j * g.mlh, ln, g.meta, hard ? RED : SOFT, g.X1 - g.descX - (hard && j === 0 ? stampWidth(g) + 8 : 0), hard ? ' font-weight="600"' : '')
  })
  if (hard) {
    const sw = stampWidth(g)
    const sx = g.X1 - sw
    const sh = stampSize(g) + 5
    const sy = L.reasonY - sh * 0.78
    chalk += `<g transform="rotate(-4 ${f(sx + sw / 2)} ${f(sy + sh / 2)})"><rect x="${f(sx)}" y="${f(sy)}" width="${f(sw)}" height="${f(sh)}" rx="3" fill="${RED}" fill-opacity=".12" stroke="${RED}" stroke-width="1.4"/><text class="u" x="${f(sx + sw / 2)}" y="${f(sy + sh * 0.74)}" text-anchor="middle" font-size="${f(stampSize(g))}" font-weight="700" letter-spacing="1.2" fill="${RED}">FAILED</text></g>`
  }
  // a tool call that errored while she carried on: one amber line, only when the error is hers
  L.errLines.forEach((ln, j) => {
    crisp += sansLine(g.descX, L.errY + j * (g.mlh - 1), ln, g.small, AMBER, g.X1 - g.descX)
  })
  if (expanded) {
    const d = detailLayout(view, act, g, L.detailTop, titleWrap(act, g).cut, false, L.toolText !== oneLine(act.tool))
    // the same chalk bracket in her colour that ties a revealed detail to its song
    chalk += `<path d="${wobble(g.X0 + 6, L.detailTop - 2, g.X0 + 6, L.height - g.padY - 2, `br${act.id}`, 0.6, 14)}" stroke="${c}" stroke-width="1.4" opacity=".55" fill="none" stroke-linecap="round"/>` + d.chalk
    crisp += d.crisp
  }
  return { chalk, crisp, defs, under }
}

/** What a reader gets for a song: the same words as the picture. */
const songAlt = (view: PanelView, act: ActView) => {
  const st = shownState(act)
  const hard = hardFail(act)
  const why = hard || st === 'stopped' ? reasonOf(view, act) : ''
  const err = toolErr(act) ? ownError(view, act) : ''
  const whose = act.id === 'main' ? 'main loop' : NAME[act.member] ?? act.member
  const { pre, tool } = toolWords(act)
  const doing = pre === '' ? '' : ` · ${tool === '' ? pre : `${pre} ${tool}`}`
  return `${whose} · ${encoreOf(act) ? 'just done' : st} · ${titleOf(act)} · ${act.isLive ? act.age : `ran ${act.age}`} · ctx ${pctText(act.ctxPercent)} · ${act.cost}${doing}${why !== '' ? ` · ${why}` : ''}${err !== '' ? ` · last error: ${err}` : ''}`
}

/** The board's head: the setlist's title and the set's figures, or on a solo her page with her polaroid. */
export function boardHeadSvg(view: PanelView, layout: SceneLayout): SceneSvg {
  const g = boardGeo(layout.width)
  const W = g.W
  const solo = view.members.find(m => m.isSolo)
  let chalk = ''
  let crisp = ''
  let extraDefs = `<linearGradient id="rt" x2="0" y2="1"><stop offset="0" stop-color="#a87449"/><stop offset=".25" stop-color="${SCENE_COLORS.wood}"/><stop offset="1" stop-color="#5e3c22"/></linearGradient>`
  let H: number
  let alt: string
  const top = RAIL
  if (solo === undefined) {
    H = Math.ceil(top + g.padY + g.title + 25)
    const ty = top + g.padY + g.title * 0.95
    const label = 'Setlist'
    const tW = textWidth(label, 'ink', g.title + 2) * 1.04
    chalk += chalkLine(g.X0, ty, label, g.title + 2, WHITE, ' font-weight="bold"')
    chalk += `<path d="${wobble(g.X0 - 2, ty + 7, g.X0 + tW + 4, ty + 6, 'u1', 1.3, 16)}M${f(g.X0 + 6)} ${f(ty + 10.5)}L${f(g.X0 + tW - 4)} ${f(ty + 10)}" stroke="${WHITE}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".85"/>`
    if (view.set > 0) {
      const setT = `set ${view.set}`
      chalk += chalkLine(g.X0 + tW + 10, ty, setT, g.title - 6, CHALK.nijika)
      chalk += sparkle(g.X0 + tW + 10 + textWidth(setT, 'ink', g.title - 6) + 10, ty - 9, 4.5, CHALK.nijika)
    }
    // the session's spend, the head's one big figure; under it what it is, and how long the set has run
    crisp += T(g.X1, ty - 1, view.session, g.title - 1, WHITE, 'u', ' text-anchor="end" font-weight="700"')
    const live = view.members.flatMap(m => m.acts).filter(a => a.isLive)
    const playing = live.filter(a => shownState(a) === 'playing').length
    const waiting = live.length - playing
    const status = view.onAir ? `session · set ${view.setLength || '0:00'}` : view.set > 0 ? `session · set ${view.set} done` : 'session'
    crisp += sansLine(g.X1, ty + 17, status, g.small, LABEL, g.X1 - g.X0 - 150, ' text-anchor="end"')
    alt = `Setlist${view.set > 0 ? `, set ${view.set}` : ''} · ${view.session} this session · ${view.onAir ? `${playing} playing${waiting > 0 ? `, ${waiting} waiting` : ''}, the set at ${view.setLength || '0:00'}` : 'between sets'}`
  } else {
    const c = chalkOf(solo.member)
    const photo = 64
    const px = Math.round(g.X1 - photo - 6)
    const textMax = px - 16 - g.X0
    const ty = top + g.padY + g.title + 2
    const label = `${solo.name}’s page`
    const size = Math.min(g.title + 6, Math.max(16, (textMax / Math.max(1, textWidth(label, 'ink', 1))) * 0.98))
    chalk += chalkLine(g.X0, ty, label, size, c, ' font-weight="bold"')
    chalk += `<path d="${wobble(g.X0, ty + 8, g.X0 + textWidth(label, 'ink', size) + 6, ty + 7, 'solou', 1.4, 20)}" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    let y = ty + 28
    for (const ln of wrapText(`${solo.instrument} · ${solo.role}`, 'ui', g.small, textMax)) {
      crisp += T(g.X0, y, ln, g.small, LABEL, 'u')
      y += g.mlh - 1
    }
    const acts = solo.acts.filter(a => a.id !== 'main')
    const playing = acts.filter(a => shownState(a) === 'playing').length
    const waiting = acts.filter(a => a.isLive && shownState(a) !== 'playing').length
    const done = acts.filter(a => !a.isLive && !hardFail(a)).length
    const fails = failedCount(solo)
    const items = [`${acts.length} act${acts.length === 1 ? '' : 's'}`, solo.spend]
    if (solo.acts.some(a => a.id === 'main' && a.isLive)) items.push('main loop playing')
    if (playing > 0) items.push(`${playing} playing`)
    if (waiting > 0) items.push(`${waiting} waiting`)
    if (done > 0) items.push(`${done} done`)
    if (fails > 0) items.push(`${fails} failed`)
    y += 4
    for (const ln of balanceItems(items, ' · ', 'ui', g.meta, textMax)) {
      // a failure in the summary stays red
      const segs: Seg[] = []
      ln.split(' · ').forEach((p, k) => {
        if (k > 0) segs.push({ t: ' · ', c: FAINT })
        segs.push(/failed$/.test(p) ? { t: p, c: RED, bold: true } : { t: p, c: WHITE })
      })
      crisp += runs(g.X0, y, segs, g.meta, 'start', '', textMax)
      y += g.mlh
    }
    // her polaroid: the portrait at exactly 2x, crisp, outside the chalk; only the tape askew
    const py = top + g.padY + 4
    const portrait = fitSprites([{ id: `${solo.member}-${solo.mood}-portrait`, x: 0, y: 0, zoom: 2 }], 60_000)
    crisp += `<rect x="${px - 3}" y="${py + 2}" width="${photo + 10}" height="${photo + 24}" fill="#000" opacity=".35" filter="url(#ps)"/><rect x="${px - 5}" y="${py - 5}" width="${photo + 10}" height="${photo + 22}" rx="1" fill="#efe9dc"/><rect x="${px}" y="${py}" width="${photo}" height="${photo}" fill="#2b3550"/>`
    crisp += `<g transform="translate(${px} ${py})">${portrait.markup}</g>`
    crisp += `<text class="c" x="${px + photo / 2}" y="${py + photo + 13}" text-anchor="middle" font-size="11" fill="#4a5470">${esc(solo.name.toLowerCase())} ♪</text>`
    crisp += `<rect x="${f(px + photo / 2 - 17)}" y="${py - 11}" width="34" height="11" fill="#e8e2c8" opacity=".8" transform="rotate(-7 ${f(px + photo / 2)} ${py - 5})"/>`
    extraDefs += `<filter id="ps" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>`
    H = Math.ceil(Math.max(y - g.mlh + g.padY + 8, py + photo + 26))
    alt = `${solo.name}'s page · ${solo.instrument} · ${items.join(' · ')}`
  }
  // the board's top rail, the side rails' corner
  crisp += `<rect width="${f(W)}" height="${RAIL}" fill="url(#rt)"/><path d="M0 ${RAIL + 0.5}H${f(W)}" stroke="#000" stroke-opacity=".35"/>`
  const svg = capped(boardDoc(W, H, 0, chalk, crisp, extraDefs), () => boardDoc(W, H, 0, '', ''))
  return { svg, alt, height: H }
}

/**
 * One song: `y` is where it starts on the board (the chalk's texture runs on
 * across songs); `expanded` shows its details in place; `plan` is the plan
 * the board is drawn with (the default `boardPlan(view)` when left out), so
 * its rows' columns are measured over the songs that are drawn.
 */
export function songSvg(view: PanelView, act: ActView, layout: SceneLayout, y: number, expanded: boolean, plan?: BoardPlan): SceneSvg {
  const g = boardGeo(layout.width)
  const L = songLayout(view, act, g, expanded, plan)
  const m = songMarkup(view, act, L, expanded)
  // a song that opens on hover is her card's stencil (see songLook); one shown in full needs none
  const card = expanded ? { defs: '', base: '' } : cardStencil(g.W, L.height, y, `cd${act.id}`)
  const svg = capped(boardDoc(g.W, L.height, y, m.chalk, m.crisp, m.defs + card.defs, m.under, card.base), () => boardDoc(g.W, L.height, y, '', m.crisp, card.defs, '', card.base))
  return { svg, alt: songAlt(view, act), height: L.height }
}

/**
 * A song's details, revealed under it on hover: its whole title when the
 * board cut it, the tools it used, its model, steps and tokens, its type,
 * when it ran. `y` is the details' own top on the board (the song's top plus
 * its height), as for every other slice. `plan` is the plan the board is
 * drawn with, taken as `songSvg` takes it; the details keep their own label
 * column, so nothing in them is measured over the other songs. They are the
 * lower part of her opened card: they paint the board and her wash
 * themselves, and close the card's chalk box at their foot (the button that
 * opens her page sits under it, on the board).
 */
export function songDetailSvg(view: PanelView, act: ActView, layout: SceneLayout, y: number, plan?: BoardPlan): SceneSvg {
  const g = boardGeo(layout.width)
  const cut = titleWrap(act, g).cut
  const shortened = songLayout(view, act, g, false, plan).toolText !== oneLine(act.tool)
  const d = detailLayout(view, act, g, 0, cut, true, shortened)
  const H = Math.ceil(d.height)
  const card = cardBottom(g.W, H, y, d.foot, act.member, `cd${act.id}`)
  const svg = capped(boardDoc(g.W, H, y, d.chalk, d.crisp, card.defs, '', card.base), () => boardDoc(g.W, H, y, '', '', card.defs, '', card.base))
  const { pre, tool } = toolWords(act)
  const alt = `${cut ? `${titleOf(act)} · ` : ''}${act.tools.map(t => `${t.name} ${t.count}`).join(' · ') || 'no tools yet'} · ${act.model === '' ? 'no reply yet' : modelName(act.model)} · ${act.steps} steps · ${act.tokens || '0'} tokens · ${typeName(act.type)} · ${whenOf(view, act)}${pre === '' ? '' : ` · ${tool === '' ? pre : `${pre.split(' ')[0] ?? ''} ${tool}`}`}`
  return { svg, alt, height: H }
}

/** The cache's warmth in plain words, never a clock: `warm, 48m left`, `cold for 12m`, `kept warm, 5m left`. */
function ampText(view: PanelView): string {
  const m = /^(warm|cold|keepwarm)\s+(.+)$/.exec(view.amp.words)
  if (m === null) return view.amp.words
  const s = Math.max(0, atSeconds(m[2] ?? ''))
  const h = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const d = s < 60 ? 'under 1m' : h > 0 ? (mins > 0 ? `${h}h ${mins}m` : `${h}h`) : `${mins}m`
  return m[1] === 'cold' ? `cold for ${d}` : m[1] === 'keepwarm' ? `kept warm, ${d} left` : `warm, ${d} left`
}

/** A member's status in the plates' grammar, for one line: `♪ main loop`, `♪ 1`, `✓ 2`, `✗ 1 failed`; `short`: `♪ main`, `♪1`, `✓2`, `✗1`. */
function statusBits(m: MemberView, short = false): Seg[] {
  const c = chalkOf(m.member)
  const own = m.acts.filter(a => a.id !== 'main')
  const bits: Seg[] = []
  const live = own.filter(a => a.isLive).length
  const gap = short ? '' : ' '
  if (m.acts.some(a => a.id === 'main' && a.isLive)) bits.push({ t: short ? '♪ main' : '♪ main loop', c })
  else if (live > 0) bits.push({ t: `♪${gap}${live}`, c })
  const done = own.filter(a => !a.isLive && !hardFail(a)).length
  if (done > 0) bits.push({ t: `✓${gap}${done}`, c: MINT })
  const fc = failedCount(m)
  if (fc > 0) bits.push({ t: short ? `✗${fc}` : `✗ ${fc} failed`, c: RED, bold: true })
  if (bits.length === 0) bits.push({ t: 'resting', c: FAINT })
  return bits
}

/**
 * The board's foot: the line for the songs that folded, the session's
 * figures, the chalk tray. `plan` is the plan the board was drawn with (a
 * compact one too): what folded is what it left out, and nothing here sits on
 * the songs' figure columns.
 */
export function boardFootSvg(view: PanelView, plan: BoardPlan, layout: SceneLayout, y: number): SceneSvg {
  const g = boardGeo(layout.width)
  const W = g.W
  let chalk = ''
  let crisp = ''
  let yy = g.padY + 4
  const alts: string[] = []
  chalk += `<path d="${wobble(g.X0, 1.2, g.X1, 1.2, 'ftl', 0.6, 30)}" stroke="${FAINT}" stroke-width=".8" opacity=".55" fill="none"/>`
  if (plan.songs.length === 0) {
    yy += g.desc * 0.8
    // a set that ended gets the done mark; an empty setlist only a quiet chalk note
    chalk += view.set > 0 ? MARK.done(g.X0, yy - 11.5, MINT) : `<g opacity=".7">${MARK.playing(g.X0, yy - 11.5, FAINT)}</g>`
    const words = view.set > 0 ? `Set ${view.set} is done. The band is tuning up.` : 'Nothing on the setlist yet. The band is tuning up.'
    for (const ln of wrapText(words, 'ink', g.desc, g.X1 - g.descX)) {
      chalk += chalkLine(g.descX, yy, ln, g.desc, WHITE)
      yy += g.lh
    }
    yy += 2
    alts.push(words)
  }
  if (plan.folded > 0) {
    // the songs that folded, tallied by state: this set's failure first and red, 'all done' only when every one is
    yy += g.small * 0.6
    // what folded is what the plan the board was drawn with left out, whatever its cap
    const drawn = new Set(plan.songs.map(a => a.id))
    const gone = boardPlan(view, plan.songs.length + plan.folded).songs.filter(a => !drawn.has(a.id))
    const n = gone.length
    const nf = gone.filter(setFail).length
    const np = gone.filter(a => a.isLive && shownState(a) === 'playing').length
    const nw = gone.filter(a => a.isLive && shownState(a) !== 'playing').length
    const ns = gone.filter(a => !a.isLive && shownState(a) === 'stopped').length
    const nd = gone.filter(a => !a.isLive && shownState(a) === 'done').length
    const label = `${n} ${np + nw > 0 ? 'more' : 'earlier'} song${n === 1 ? '' : 's'}`
    const segs: Seg[] = []
    const add = (s: Seg) => {
      if (segs.length > 0) segs.push({ t: ' · ', c: FAINT })
      segs.push(s)
    }
    if (nf > 0) add({ t: `✗ ${nf} failed`, c: RED, bold: true })
    if (np > 0) add({ t: `♪ ${np} playing`, c: WHITE })
    if (nw > 0) add({ t: `⧗ ${nw} waiting`, c: SOFT })
    if (ns > 0) add({ t: `${ns} stopped`, c: SOFT })
    if (nd > 0) add({ t: nd === n ? 'all done' : `✓ ${nd} done`, c: MINT })
    add({ t: fmtUsd(gone.reduce((t, a) => t + a.costUsd, 0)), c: WHITE })
    // in the marks' column, a stack of folded cards (the front one whole, two edges peeking out behind it); the
    // count in chalk, the tally in the sans
    yy += 2
    const fx0 = g.X0 + 0.5
    chalk += `<path d="M${f(fx0 + 4.5)} ${f(yy - 9.5)}h9.5v7.5M${f(fx0 + 2.2)} ${f(yy - 7.2)}h9.5v7.5" stroke="${SOFT}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".6"/><rect x="${f(fx0)}" y="${f(yy - 5)}" width="9.5" height="7" rx="1" stroke="${SOFT}" stroke-width="1.3" fill="none" opacity=".9"/>`
    chalk += chalkLine(g.descX, yy + 1, label, g.desc - 1, SOFT)
    const fx = g.descX + textWidth(label, 'ink', g.desc - 1) + 12
    if (fx + runsWidth(segs, g.small) * 1.03 <= g.X1) crisp += runs(fx, yy, segs, g.small, 'start', '', g.X1 - fx)
    else {
      yy += g.mlh
      crisp += runs(g.descX, yy, segs, g.small, 'start', '', g.X1 - g.descX)
    }
    alts.push(`+ ${label} folded: ${segs.map(s => s.t).join('')}`)
    // a faint rule between what folded and the session's figures
    yy += g.mlh * 0.62
    chalk += `<path d="${wobble(g.X0, yy, g.X1, yy, 'fdl', 0.5, 30)}" stroke="${FAINT}" stroke-width=".8" stroke-dasharray="3 5" opacity=".45" fill="none"/>`
    yy += g.mlh * 0.45
  }
  yy += g.meta * 0.75
  const solo = view.members.find(m => m.isSolo)
  if (solo !== undefined) {
    // the rest of the band, folded to one line in the plates' grammar (its short form where the words would leave
    // one of them alone on a second line); a failure still red
    const lead = textWidth('also tonight', 'ui', g.small) + 12
    const others = view.members.filter(mm => !mm.isSolo)
    const chunk = (m: MemberView, short: boolean): { segs: Seg[]; w: number } => {
      const segs: Seg[] = [{ t: m.name, c: neonOf(m.member), bold: true }, { t: ' ', c: WHITE }]
      statusBits(m, short).forEach((b, k) => {
        if (k > 0) segs.push({ t: short ? ' ' : ' · ', c: FAINT })
        segs.push(b)
      })
      return { segs, w: runsWidth(segs, g.meta) * 1.03 }
    }
    const lineW = (cs: { w: number }[]) => cs.reduce((t, c) => t + c.w, 0) + 14 * Math.max(0, cs.length - 1)
    const full = others.map(m => chunk(m, false))
    const short = others.map(m => chunk(m, true))
    const room = g.X1 - g.X0 - lead
    const chunks = lineW(full) <= room ? full : lineW(short) <= room ? short : full
    // past one line: as many to a line as fit, the lines balanced so none holds one alone where it need not
    const rows: (typeof chunks)[] = []
    for (const c of chunks) {
      const last = rows[rows.length - 1]
      const avail = rows.length === 0 ? room : g.X1 - g.X0
      if (last !== undefined && lineW([...last, c]) <= avail) last.push(c)
      else rows.push([c])
    }
    const lastRow = rows[rows.length - 1]
    const prevRow = rows[rows.length - 2]
    if (rows.length > 1 && lastRow !== undefined && prevRow !== undefined && lastRow.length === 1 && prevRow.length > 2) {
      const moved = prevRow.pop()
      if (moved !== undefined) lastRow.unshift(moved)
    }
    crisp += fixedT(g.X0, yy, 'also tonight', g.small, LABEL, 'ui')
    rows.forEach((row, r) => {
      let x = r === 0 ? g.X0 + lead : g.X0
      if (r > 0) yy += g.mlh
      for (const c of row) {
        crisp += runs(x, yy, c.segs, g.meta, 'start', '', Math.min(c.w, g.X1 - x))
        x += c.w + 14
      }
    })
    others.forEach(m => alts.push(`${m.name} ${statusBits(m).map(b => b.t).join(' · ')}`))
    yy += 4
  } else {
    // the session's figures: main context, the rate limit's window, the cache (who is on stage is in the head)
    type Item = { label: string; value: string; color: string; bar?: number }
    const items: Item[] = [{ label: 'main ctx', value: pctText(view.ctxPercent), color: view.ctxPercent > 85 ? RED : WHITE, bar: view.ctxPercent }]
    if (view.planPercent > 0) items.push({ label: 'limit', value: pctText(view.planPercent), color: view.planPercent > 85 ? RED : WHITE })
    items.push({ label: 'cache', value: ampText(view), color: view.amp.kind === 'warm' || view.amp.kind === 'keepwarm' ? CHALK.nijika : SOFT })
    let x = g.X0
    for (const it of items) {
      const lw = textWidth(it.label, 'ui', g.small) + 5
      const bw = it.bar === undefined ? 0 : g.barW + 6
      const vw = textWidth(it.value, 'ui', g.meta) * 1.03
      if (x > g.X0 && x + lw + bw + vw > g.X1) {
        x = g.X0
        yy += g.mlh
      }
      crisp += fixedT(x, yy, it.label, g.small, LABEL, 'ui')
      x += lw
      if (it.bar !== undefined) {
        const b = ctxBar(x, yy - g.meta * 0.36 - g.barH / 2, g.barW, g.barH, it.bar, CHALK.bocchi)
        crisp += b.track
        chalk += b.fill
        x += bw
      }
      crisp += fixedT(x, yy, it.value, g.meta, it.color, 'ui')
      x += vw + 16
      alts.push(`${it.label} ${it.value}`)
    }
  }
  // the chalk tray: a deep ledge with a lit top edge, a stick in each band colour, a quiet legend
  const trayY = Math.ceil(yy + g.padY + 9)
  const H = trayY + g.tray
  let tray = `<rect y="${trayY - 3}" width="${f(W)}" height="3" fill="#000" opacity=".25"/><rect y="${trayY}" width="${f(W)}" height="${g.tray}" fill="url(#ty)"/><path d="M0 ${trayY + 0.6}H${f(W)}" stroke="#d29a66" stroke-opacity=".85"/><path d="M0 ${trayY + 1.8}H${f(W)}" stroke="#a87449" stroke-opacity=".5"/><rect y="${H - 2}" width="${f(W)}" height="2" fill="${SCENE_COLORS.woodEdge}"/>`
  const sticks: [string, number, number][] = [['#f6f3ea', 22, -2], ...view.members.map((m, k): [string, number, number] => [chalkOf(m.member), 13 + ((k * 5) % 7), [4, 0, 3, -3][k % 4] ?? 0])]
  let tx = W * 0.58
  for (const [col, w, rot] of sticks) {
    tray += `<rect x="${f(tx)}" y="${trayY - 3.6}" width="${w}" height="4.4" rx="2" fill="${col}" transform="rotate(${rot} ${f(tx + w / 2)} ${trayY - 1})"/>`
    tx += w + 7
  }
  tray += `<g transform="translate(${f(W * 0.2)} ${trayY - 7})"><rect width="34" height="8" rx="1.5" fill="#3b3f46"/><rect y="5" width="34" height="3" fill="#d9d4c8"/><rect x="2" y="1.5" width="30" height="2" fill="#565b63"/></g>`
  const trayDefs = `<linearGradient id="ty" x2="0" y2="1"><stop offset="0" stop-color="#8a5c38"/><stop offset=".45" stop-color="${SCENE_COLORS.wood}"/><stop offset="1" stop-color="#5e3c22"/></linearGradient>`
  const svg = capped(boardDoc(W, H, y, chalk, crisp + tray, trayDefs), () => boardDoc(W, H, y, '', tray, trayDefs))
  return { svg, alt: alts.join(' · '), height: H }
}

// ---- The strip ----------------------------------------------------------------------------------------

/** The act the strip shows: the newest running act of who is playing, or the main loop; on air before any act is seated, the now-playing words as one. */
function nowAct(view: PanelView): { m: MemberView; act: ActView } | null {
  const who = view.nowPlaying.who
  if (who === null) return null
  const m = view.members.find(x => x.member === who)
  if (m === undefined) return null
  const running = m.acts.filter(a => a.id !== 'main' && shownState(a) === 'playing')
  const words = view.nowPlaying.words
  const act = running.find(a => words.startsWith(a.title.slice(0, 60))) ?? running[0] ?? m.acts.find(a => a.id === 'main') ?? m.acts[0]
  if (act !== undefined) return { m, act }
  if (!view.onAir) return null
  const ctx = who === 'bocchi' ? view.ctxPercent : Math.max(0, m.ctxPercent)
  return { m, act: { id: 'main', member: who, title: words, type: 'main', state: 'playing', isLive: true, isEncore: false, isFailed: false, hadError: false, inSet: true, reason: '', age: view.setLength || '0:00', at: '', cost: m.spend, costUsd: m.spendUsd, ctxPercent: ctx, tokens: '', model: '', steps: 0, tools: [], tool: '', slime: 'active' } }
}

/** The failure pill's wordings, fullest first: who failed by name, then a count. */
function failPills(view: PanelView): { pills: string[]; total: number; failing: MemberView[] } {
  const failing = view.members.filter(m => failedCount(m) > 0)
  const total = failing.reduce((n, m) => n + failedCount(m), 0)
  if (total === 0) return { pills: [''], total, failing }
  const named = failing.length === 1 && total === 1 ? `✗ ${failing[0]?.name ?? ''} failed` : `✗ ${total} failed: ${failing.map(m => m.name).join(', ')}`
  return { pills: [named, `✗ ${total} failed`, `✗ ${total}`], total, failing }
}

/** The club's brick wall, as the stage's, a shade darker: what the strip's sign hangs on. */
const BRICK = `<pattern id="bk" width="56" height="20" patternUnits="userSpaceOnUse"><rect width="56" height="20" fill="#150b0f"/><path d="M1 1h26v8.6H1zM29 1h26v8.6H29zM15 11h26v8.6H15zM-13 11h26v8.6H-13zM43 11h26v8.6H43z" fill="#2e171d"/><path d="M1 1.5h26M29 1.5h26M15 11.5h26M43 11.5h26" stroke="#fff" stroke-opacity=".04"/></pattern>`

/** The strip above the prompt: the neon now-playing sign. */
export function stripSvg(view: PanelView, layout: SceneLayout): SceneSvg {
  const W = layout.width
  const now = nowAct(view)
  const pad = 14
  const { pills, total: fails, failing } = failPills(view)
  const rights = view.set > 0 ? [`set ${view.set} · ${view.session}`, view.session] : [view.session]
  const pillWOf = (p: string) => (p === '' ? 0 : textWidth(p, 'uib', 11) + 16)
  // the club's brick wall behind the sign, dim, darkest where the words are
  let defs = `<filter id="gl" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>${BRICK}<linearGradient id="bs"><stop offset="0" stop-color="${SCENE_COLORS.wall}" stop-opacity=".2"/><stop offset=".55" stop-color="${SCENE_COLORS.wall}" stop-opacity=".72"/><stop offset="1" stop-color="${SCENE_COLORS.wall}" stop-opacity=".5"/></linearGradient>`
  const wall = (h: number) => `<rect width="${f(W)}" height="${h}" fill="${SCENE_COLORS.wall}"/><rect x="7" y="7" width="${f(W - 14)}" height="${f(h - 14)}" rx="9" fill="url(#bk)"/><rect x="7" y="7" width="${f(W - 14)}" height="${f(h - 14)}" rx="9" fill="url(#bs)"/>`
  let o = ''
  let H: number
  let alt: string
  const frame = (h: number, stroke: string, w: number, extra = '') => `<rect x="5.5" y="5.5" width="${f(W - 11)}" height="${f(h - 11)}" rx="11" fill="none" stroke="${stroke}" stroke-width="${w}"${extra}/>`
  const pillAt = (p: string, x: number, y: number) => `<rect x="${f(x)}" y="${f(y - 12)}" width="${f(pillWOf(p))}" height="17" rx="8.5" fill="#3a0c16" stroke="${RED_DEEP}"/>${fixedT(x + pillWOf(p) / 2, y, p, 11, '#ffc2ca', 'uib', ' text-anchor="middle"')}`
  /** The head row's words that fit: the name always, then the pill (fullest first), the set's figures, the label; 10 px apart at least. */
  const headRow = (startX: number, nameW: number, labels: string[], rx: number) => {
    for (const pill of pills)
      for (const right of rights)
        for (const label of labels) {
          const need = startX + nameW + (label === '' ? 0 : 10 + textWidth(label, 'ui', 11.5)) + (pill === '' ? 0 : 10 + pillWOf(pill)) + 10 + textWidth(right, 'ui', 12)
          if (need <= rx) return { pill, right, label }
        }
    return { pill: pills[pills.length - 1] ?? '', right: view.session, label: '' }
  }
  if (now === null) {
    // between sets: the house light's warm sign; the set's figures, and who failed and why
    const label = 'Between sets'
    const ls = W < 400 ? 18 : 19
    const tail = [`main ctx ${pctText(view.ctxPercent)}`, `cache ${ampText(view)}`]
    if (view.planPercent > 0) tail.push(`limit ${pctText(view.planPercent)}`)
    const room = W - 2 * pad - 10
    // the band's line only where the figures leave it room on one line
    const withBand = balanceItems(['The band is tuning up', ...tail], ' · ', 'ui', 12.5, room / 1.03)
    const words = withBand.length === 1 ? withBand : balanceItems(tail, ' · ', 'ui', 12.5, room / 1.03)
    const hers = failing[0]
    const failAct = hers?.acts.find(setFail)
    const failLine = hers === undefined || failAct === undefined ? '' : clipEnd(`✗ ${hers.name}${fails > 1 ? ` (+${fails - 1} more)` : ''} · ${reasonOf(view, failAct)}`, 'ui', 12.5, room / 1.03)
    const lines = (failLine === '' ? 0 : 1) + words.length
    H = 46 + lines * 17
    o += wall(H)
    o += frame(H, '#2b2229', 3.4) + frame(H, '#6b5040', 1.8) + frame(H, '#a07a5a', 0.6, ' opacity=".8"')
    o += `<text id="np" x="${pad + 4}" y="31" font-family="${SCRIPT}" font-weight="bold" font-size="${ls}" fill="none">${label}</text><g fill="none" stroke-linejoin="round"><use href="#np" stroke="#ffcf8a" stroke-width="4.5" opacity=".22" filter="url(#gl)"/><use href="#np" stroke="#c99a6a" stroke-width="1.6"/><use href="#np" stroke="#fff3d6" stroke-width=".7"/></g>`
    const labelEnd = pad + 4 + textWidth(label, 'script', ls) * 1.04
    const rx = W - pad - 4
    const pick = headRow(labelEnd, 0, [''], rx)
    const rightW = textWidth(pick.right, 'ui', 12)
    o += fixedT(rx, 28, pick.right, 12, '#cfc6d4', 'ui', ' text-anchor="end"')
    if (pick.pill !== '') o += pillAt(pick.pill, rx - rightW - 10 - pillWOf(pick.pill), 28)
    let ly = 50
    if (failLine !== '') {
      o += sansLine(pad + 4, ly, failLine, 12.5, '#ff9aa6', room, ' font-weight="600"')
      ly += 17
    }
    words.forEach((ln, j) => (o += sansLine(pad + 4, ly + j * 17, ln, 12.5, '#b8adb4', room)))
    alt = `Between sets${view.set > 0 ? ` · set ${view.set} done` : ''} · ${view.session}${failLine !== '' ? ` · ${failLine}` : ''} · ${tail.join(' · ')}`
    const svg = capped(svgDoc(W, H, `<defs>${defs}</defs>${o}`, TEXT_CSS), () => svgDoc(W, H, `<rect width="${f(W)}" height="${H}" fill="${SCENE_COLORS.wall}"/>`))
    return { svg, alt, height: H }
  }
  const { m, act } = now
  const c = neonOf(m.member)
  const headS = 32
  const textX = pad + 6 + headS + 12
  const descSize = W < 400 ? 13 : 13.5
  const lh = descSize + 4
  // the sign's row, as between sets: `Now playing` in neon script in her colour, a failure pill naming who, the
  // set's figures at the right
  const ls = W < 400 ? 18 : 19
  const label = 'Now playing'
  o += `<text id="np" x="${pad + 4}" y="31" font-family="${SCRIPT}" font-weight="bold" font-size="${ls}" fill="none">${label}</text><g fill="none" stroke-linejoin="round"><use href="#np" stroke="${c}" stroke-width="4.5" opacity=".38" filter="url(#gl)"/><use href="#np" stroke="${c}" stroke-width="1.7"/><use href="#np" stroke="#fff6fb" stroke-width=".7"/></g>`
  const rx = W - pad - 4
  const pick = headRow(pad + 4 + textWidth(label, 'script', ls) * 1.04, 0, [''], rx)
  const rW = textWidth(pick.right, 'ui', 12)
  o += fixedT(rx, 28, pick.right, 12, '#cfc6d4', 'ui', ' text-anchor="end"')
  if (pick.pill !== '') o += pillAt(pick.pill, rx - rW - 10 - pillWOf(pick.pill), 28)
  // her name in her colour, then the act (at most two lines, the first beside her name)
  const nameSize = 14.5
  const nameW = textWidth(m.name, 'uib', nameSize)
  const by1 = 53
  const room = W - pad - 6 - textX
  o += fixedT(textX, by1, m.name, nameSize, c, 'uib', ' opacity=".6" filter="url(#ng)"') + fixedT(textX, by1, m.name, nameSize, c, 'uib')
  const lines = wrapText(titleOf(act), 'ui', descSize, room, room - nameW - 9, 2)
  lines.forEach((ln, j) => (o += sansLine(j === 0 ? textX + nameW + 9 : textX, by1 + j * lh, ln, descSize, '#f4eef6', j === 0 ? room - nameW - 9 : room)))
  // the meta line, always: the tool in her hands, its age, its context, its cost; who else is on stage at the right, by name.
  // One line where it fits; else the tool on a line of its own (a path keeping its file's name) and the figures under it.
  const metaSize = 12.5
  const lineEnd = W - pad - 8
  const sep: Seg = { t: ' · ', c: '#6c6370' }
  const figs: Seg[] = [{ t: act.age, c: WHITE }, sep, { t: `ctx ${pctText(act.ctxPercent)}`, c: act.ctxPercent > 85 ? RED_DEEP : c }, sep, { t: act.cost, c: WHITE }]
  const toolWordsNow = act.tool === '' ? 'thinking' : oneLine(act.tool)
  const toolSegs = (t: string): Seg[] => [...(act.id === 'main' ? [{ t: 'main loop', c, bold: true }, sep] : []), { t: 'now ', c: '#a99fae' }, { t, c: '#f0e8f2' }]
  // who else is on stage: her own other acts in a word (`+1 waiting`), then the others by name in the band's order
  // (`Bocchi · Nijika ⧗`), else a count (`+3 on stage`)
  const mine = m.acts.filter(a => a.isLive && a !== act)
  const groups = view.members
    .filter(mm => mm.member !== m.member)
    .map(mm => {
      const xs = mm.acts.filter(a => a.isLive)
      return { mm, n: xs.length, waiting: xs.length > 0 && xs.every(a => shownState(a) !== 'playing') }
    })
    .filter(gr => gr.n > 0)
  const others = mine.length + groups.reduce((n, gr) => n + gr.n, 0)
  const named: Seg[] = []
  if (mine.length > 0) named.push({ t: `+${mine.length} ${mine.every(a => shownState(a) !== 'playing') ? 'waiting' : 'more'}`, c })
  groups.forEach((gr, k) => {
    if (k > 0 || named.length > 0) named.push({ t: ' · ', c: '#6c6370' })
    else named.push({ t: '+ ', c: '#b2a9b7' })
    named.push({ t: `${gr.mm.name}${gr.n > 1 ? ` ×${gr.n}` : ''}${gr.waiting ? ' ⧗' : ''}`, c: neonOf(gr.mm.member) })
  })
  const counted: Seg[] = [{ t: `+${others} on stage`, c: '#b2a9b7' }]
  const mores: Seg[][] = others === 0 ? [[]] : W >= 400 ? [named, counted] : [counted]
  const moreW = (s: Seg[]) => (s.length === 0 ? 0 : runsWidth(s, 12) * 1.03 + 14)
  let meta: Seg[][] = []
  let more: Seg[] = []
  for (const mv of mores) {
    const one = [...toolSegs(toolWordsNow), sep, ...figs]
    if (textX + runsWidth(one, metaSize) * 1.03 + moreW(mv) <= lineEnd) {
      meta = [one]
      more = mv
      break
    }
  }
  if (meta.length === 0) {
    const toolRoom = lineEnd - textX - runsWidth(toolSegs(''), metaSize)
    meta = [toolSegs(fitTool(toolWordsNow, 'ui', metaSize, toolRoom / 1.03)), figs]
    more = mores.find(mv => textX + runsWidth(figs, metaSize) * 1.03 + moreW(mv) <= lineEnd) ?? []
  }
  const my0 = by1 + (lines.length - 1) * lh + lh + 1
  meta.forEach((segs, k) => (o += runs(textX, my0 + k * 16.5, segs, metaSize, 'start', '', Math.min(runsWidth(segs, metaSize), lineEnd - textX))))
  const my = my0 + (meta.length - 1) * 16.5
  if (more.length > 0) o += runs(W - pad - 6, my, more, 12, 'end', '', moreW(more))
  H = Math.ceil(my + 14)
  // the frame in her colour (glow, tube, hot core), her head in a pool of her light beside her lines; the strip keeps
  // still (only the stage hums)
  const tube = shadeToward(c, '#ffffff', 0.35)
  const head = `${wall(H)}${frame(H, c, 5, ' opacity=".5" filter="url(#gl)"')}${frame(H, tube, 1.8)}${frame(H, '#fff8fb', 0.6, ' opacity=".75"')}`
  const hx = pad + 6
  const hy = Math.round((by1 - 14 + my + 4) / 2 - headS / 2)
  defs += `<radialGradient id="hl"><stop offset="0" stop-color="${c}" stop-opacity=".42"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><filter id="ng" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter>`
  const halo = `<ellipse cx="${hx + headS / 2}" cy="${hy + headS / 2 + 2}" rx="26" ry="22" fill="url(#hl)"/>`
  // her portrait (the 32x32 window over her head) at 1:1 in a small frame of her colour
  const sprite = fitSprites([{ id: `${m.member}-${m.mood}-portrait`, x: hx, y: hy }], 40_000)
  const photo = `<rect x="${hx - 1.5}" y="${hy - 1.5}" width="${headS + 3}" height="${headS + 3}" rx="3" fill="#1b1520" stroke="${c}" stroke-opacity=".7"/>`
  const whoElse = [...(mine.length > 0 ? [`${mine.length} more of hers`] : []), ...groups.map(gr => `${gr.mm.name}${gr.n > 1 ? ` ×${gr.n}` : ''}${gr.waiting ? ' (waiting)' : ''}`)].join(', ')
  alt = `Now playing: ${m.name}${act.id === 'main' ? ' (main loop)' : ''} · ${titleOf(act)} · now ${toolWordsNow} · ${figs.map(x => x.t).join('')}${fails > 0 ? ` · ${pills[0] ?? ''}` : ''}${others > 0 ? ` · also on stage: ${whoElse}` : ''}`
  const svg = capped(svgDoc(W, H, `<defs>${defs}</defs>${head}${halo}${photo}${sprite.markup}${o}`, TEXT_CSS), () => svgDoc(W, H, `<defs>${defs}</defs>${head}${o}`, TEXT_CSS))
  return { svg, alt, height: H }
}

/** A colour mixed `amount` of the way toward another. */
function shadeToward(color: string, toward: string, amount: number): string {
  const hex = (s: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(s)
    const v = m === null ? 0 : parseInt(m[1] ?? '0', 16)
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255] as const
  }
  const a = hex(color)
  const b = hex(toward)
  const mix = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * amount)
  return `#${[mix(0), mix(1), mix(2)].map(n => n.toString(16).padStart(2, '0')).join('')}`
}
