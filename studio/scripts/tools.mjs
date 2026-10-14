// Shared by the quick look tools (look, onion, lineup, compare, grid): the
// options they take (--out, --scale, --stand), a stand candidate laid over a
// member for one run, and the cell specs ("playA+focus", "mini:stand+blink",
// "mood:happy", ...) turned into scenes and pictures. No browser.

import path from 'node:path'
import { MOODS, OUT, loadTs, slash } from './studio.mjs'

export const FACES = ['idle', 'half', 'blink', 'glance', 'focus', 'happy', 'panic', 'melt']
export const PEEKS = ['peekL', 'peekR', 'peekBlink']

/**
 * The options every tool takes, out of the arguments: `--out <file>`,
 * `--scale N` (a whole number, at least 1), `--stand <module.ts>`; the rest
 * are positional.
 */
export function parseArgs(argv, { scale = 4 } = {}) {
  const positional = []
  const opts = { out: undefined, scale, stand: undefined }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--out' || a === '--stand' || a === '--scale') {
      const v = argv[i + 1]
      if (v === undefined) throw new Error(`${a} wants a value`)
      i += 1
      if (a === '--out') opts.out = path.resolve(v)
      else if (a === '--stand') opts.stand = path.resolve(v)
      else {
        const n = Number(v)
        if (!Number.isInteger(n) || n < 1) throw new Error(`--scale wants a whole number of 1 or more, not "${v}"`)
        opts.scale = n
      }
    } else if (a.startsWith('--')) throw new Error(`unknown option ${a}`)
    else positional.push(a)
  }
  return { positional, ...opts }
}

/** Where a tool writes: `--out`, or out/look/<name> by default. */
export function outFile(out, name) {
  return out ?? path.join(OUT, 'look', name)
}

/** A file-name-safe version of a spec list. */
export const slug = text => text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

/**
 * A stand candidate laid over a member for one run: `file` is a module that
 * exports `stand` (a 96-row grid) and `palette` (merged over the member's,
 * the candidate's keys winning), and may export `colors`, `head` and `bend`
 * too. Every pose patched on stand is rebuilt on the candidate.
 */
export async function withStand(art, file) {
  if (!file) return art
  const m = await loadTs(`export * from ${JSON.stringify(slash(file))}`)
  if (!Array.isArray(m.stand)) throw new Error(`${file}: exports no \`stand\` grid`)
  return {
    ...art,
    palette: { ...art.palette, ...(m.palette ?? {}), ...(m.colors ?? {}) },
    poses: { ...art.poses, stand: m.stand },
    ...(m.head ? { head: m.head } : {}),
    ...(typeof m.bend === 'number' ? { bend: m.bend } : {}),
  }
}

/** A scene with every field filled. */
export const sceneOf = s => ({ dx: 0, dy: 0, squash: 0, melt: 0, fx: [], ...s })

/** `fx:<kind>@x,y[@body|@ground][#rrggbb]`: an effect keyed as the timelines key it (from the head window by default). */
const FX_SPEC = /^(\w+)@(-?\d+),(-?\d+)(?:@(head|body|ground))?(#[0-9a-fA-F]{6})?$/

/**
 * A pose spec as a scene: `<pose>` then `+` modifiers in any order: a face
 * name (or `face:<name>`), a peek name (or `peek:<name>`, the box only),
 * `sway:L|R`, `squash:N`, `melt:T` (0-1), `dx:N`, `dy:N`, and any number of
 * `fx:<kind>@x,y[@body|@ground][#rrggbb]` (an effect as a timeline keys it,
 * in the member's accent unless a color is given).
 */
export function parseScene(S, spec) {
  const [pose, ...mods] = spec.split('+')
  if (!S.POSES.includes(pose)) throw new Error(`"${spec}": "${pose}" is not a pose (${S.POSES.join(', ')})`)
  const s = sceneOf({ pose })
  for (const m of mods) {
    const [k, v] = m.includes(':') ? m.split(':') : [m, undefined]
    if (v === undefined && FACES.includes(k)) s.face = k
    else if (v === undefined && PEEKS.includes(k)) s.peek = k
    else if (k === 'face' && FACES.includes(v)) s.face = v
    else if (k === 'peek' && PEEKS.includes(v)) s.peek = v
    else if (k === 'sway' && (v === 'L' || v === 'R')) s.sway = v
    else if (k === 'squash' && /^\d+$/.test(v)) s.squash = Number(v)
    else if (k === 'melt' && Number(v) >= 0 && Number(v) <= 1) s.melt = Number(v)
    else if ((k === 'dx' || k === 'dy') && /^-?\d+$/.test(v)) s[k] = Number(v)
    else if (k === 'fx' && FX_SPEC.test(v)) {
      const [, kind, x, y, on, color] = FX_SPEC.exec(v)
      if (!(kind in S.FX)) throw new Error(`"${m}" in "${spec}": no effect "${kind}" (${Object.keys(S.FX).join(' ')})`)
      s.fx = [...s.fx, { kind, x: Number(x), y: Number(y), ...(on ? { on } : {}), ...(color ? { color } : {}) }]
    } else throw new Error(`"${m}" in "${spec}": not a face (${FACES.join(' ')}), a peek (${PEEKS.join(' ')}), sway:L|R, squash:N, melt:T, dx:N, dy:N or fx:<kind>@x,y[@body|@ground][#rrggbb]`)
  }
  if (s.peek && pose !== 'box') throw new Error(`"${spec}": a peek goes on the box`)
  if (s.face && pose === 'box') throw new Error(`"${spec}": the box takes a peek, not a face`)
  return s
}

/**
 * A cell spec: what it shows and at what multiple of the tool's scale.
 *   <pose>+...            { kind: 'scene', view: 'full' }       at 1x
 *   portrait:<pose>+...   { kind: 'scene', view: 'portrait' }   at 2x
 *   mini:<pose>+...       { kind: 'scene', view: 'mini' }       at 4x
 *   ref                   { kind: 'ref' }                       at 1x (REF_STAND: the reference on our canvas)
 *   extra:<name>          { kind: 'extra', name }               at 1x
 *   mood:<mood>           { kind: 'mood', mood }
 *   crash                 { kind: 'crash' }
 */
export function parseCell(S, spec) {
  if (spec === 'ref') return { kind: 'ref', spec, mult: 1 }
  if (spec === 'crash') return { kind: 'crash', spec }
  if (spec.startsWith('extra:')) return { kind: 'extra', spec, name: spec.slice(6), mult: 1 }
  if (spec.startsWith('mood:')) {
    const mood = spec.slice(5)
    if (!MOODS.includes(mood)) throw new Error(`"${spec}": "${mood}" is not a mood (${MOODS.join(', ')})`)
    return { kind: 'mood', spec, mood }
  }
  for (const [prefix, view, mult] of [['portrait:', 'portrait', 2], ['mini:', 'mini', 4]]) {
    if (spec.startsWith(prefix)) return { kind: 'scene', spec, view, mult, scene: parseScene(S, spec.slice(prefix.length)) }
  }
  return { kind: 'scene', spec, view: 'full', mult: 1, scene: parseScene(S, spec) }
}

/** Grid rows to pixels through a palette. */
export const toPixels = (grid, palette) => grid.map(r => [...r].map(c => (c === '.' ? null : (palette[c] ?? null))))

/** The pixels of a picture cell (scene, ref or extra). */
export function cellPixels(S, art, cell) {
  if (cell.kind === 'scene') return S.drawScene(art, cell.scene, cell.view)
  if (cell.kind === 'ref') return toPixels(S.REF_STAND, S.REF_PALETTE)
  if (cell.kind === 'extra') {
    const grid = art.extras?.[cell.name]
    if (!grid) throw new Error(`no extra "${cell.name}" (${Object.keys(art.extras ?? {}).join(', ') || 'none'})`)
    return toPixels(grid, art.palette)
  }
  throw new Error(`"${cell.spec}" is not a single picture`)
}

const keyOf = px => px.map(r => r.map(c => c ?? '.').join(',')).join('|')

/**
 * A mood's distinct frames, in order: where each starts, how many frames it
 * holds, its scene and its three pictures. A frame is new when its full,
 * portrait or mini picture changes.
 */
export function moodFrames(S, art, mood) {
  const total = S.framesOf(art, mood)
  const out = []
  let lastKey = null
  for (let f = 0; f < total; f += 1) {
    const scene = S.sceneAt(art, mood, f)
    const full = S.drawScene(art, scene, 'full')
    const portrait = S.drawScene(art, scene, 'portrait')
    const mini = S.drawScene(art, scene, 'mini')
    const key = `${keyOf(full)}#${keyOf(portrait)}#${keyOf(mini)}`
    if (key === lastKey) out[out.length - 1].hold += 1
    else out.push({ start: f, hold: 1, scene, full, portrait, mini })
    lastKey = key
  }
  return { total, frames: out }
}

/** The crash's distinct frames (96x32 and its 48x16 mini), with holds. */
export function crashFrames(S, art) {
  const out = []
  let lastKey = null
  for (let f = 0; f < S.CRASH_FRAMES; f += 1) {
    const full = S.drawCrash(art, f)
    const key = keyOf(full)
    if (key === lastKey) out[out.length - 1].hold += 1
    else out.push({ start: f, hold: 1, full, mini: S.drawCrashMini(art, f) })
    lastKey = key
  }
  return out
}

/** Text the 3x5 font can draw. */
export const label = text => text.toUpperCase().replace(/[^A-Z0-9!:+.,/() -]/g, ' ')
