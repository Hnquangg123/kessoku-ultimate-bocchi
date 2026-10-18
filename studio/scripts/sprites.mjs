// Renders every sprite composition with Remotion and exports the frames to
// the mod: ../hooks/lib/sprites.gen.ts (or --out <path>).
//
// Each frame comes back from the headless browser as a transparent PNG at 1:1.
// Every pixel is snapped to the studio's palette (so a stray color can never
// reach the mod), identical neighbouring frames fold into one longer hold, and
// each frame is written as run-length palette characters, `=` runs standing
// for pixels unchanged from the frame before. Strips of the distinct frames
// land in out/sprites/ for a look.
//
//   node scripts/sprites.mjs                 rewrites the mod's hooks/lib/sprites.gen.ts
//   node scripts/sprites.mjs --out <path>    writes there instead (a scratch export)
//
// The sprites: <member>-<mood> (96x96), <member>-<mood>-portrait (32x32),
// <member>-<mood>-mini (16x16), <member>-slime-<state> (36x24),
// <member>-slime-<state>-mini (18x12), fx-crash (96x32), fx-crash-mini (48x16).

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import { renderFrames } from '@remotion/renderer'
import { OUT, STUDIO, open } from './lib.mjs'

const args = process.argv.slice(2)
const outAt = args.indexOf('--out')
if (outAt >= 0 && args[outAt + 1] === undefined) {
  console.error('usage: node scripts/sprites.mjs [--out <path>]')
  process.exit(2)
}
const TARGET = outAt >= 0 ? path.resolve(args[outAt + 1]) : path.resolve(STUDIO, '..', 'hooks', 'lib', 'sprites.gen.ts')

/**
 * Palette characters for the generated file: one UTF-16 unit each, never `.`
 * (transparent), `=` (same as the frame before), a digit (run counts), a
 * quote, a backslash or a backtick. 268 of them: A-Z, a-z, safe punctuation,
 * the Latin-1 letters, then Latin Extended-A.
 */
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String.fromCharCode(from + i)).join('')
const ALPHABET = [
  range(0x41, 0x5a), // A-Z
  range(0x61, 0x7a), // a-z
  '!#$%&()*+,-/:;<>?@[]^_{|}~',
  range(0xc0, 0xd6), // À-Ö
  range(0xd8, 0xf6), // Ø-ö
  range(0xf8, 0xff), // ø-ÿ
  range(0x100, 0x17f), // Ā-ſ
].join('')
if (/[.=0-9'"\\`]/.test(ALPHABET) || new Set(ALPHABET).size !== ALPHABET.length) throw new Error('the alphabet holds a reserved or repeated character')

const SPRITE_ID = /^(bocchi|nijika|ryo|kita)-(anxious|focused|happy|panic|melting|hiding)(-portrait|-mini)?$|^(bocchi|nijika|ryo|kita)-slime-(active|idle|asleep)(-mini)?$|^fx-crash(-mini)?$/

const { serveUrl, browser, compositions } = await open()
const palette = (compositions.find(c => c.id === 'Palette')?.props?.colors ?? []).map(c => c.toLowerCase())
if (palette.length === 0) throw new Error('the Palette composition carries no colors')
const known = palette.map(c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)])

/** The palette color nearest a rendered pixel, and how far it was. */
function snap(r, g, b) {
  let best = 0
  let dist = Infinity
  known.forEach(([pr, pg, pb], i) => {
    const d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2
    if (d < dist) {
      dist = d
      best = i
    }
  })
  return { color: palette[best], dist }
}

const used = new Map() // color -> palette character
let worstSnap = 0
function charFor(color) {
  let ch = used.get(color)
  if (ch === undefined) {
    ch = ALPHABET[used.size]
    if (ch === undefined) throw new Error(`more than ${ALPHABET.length} colors in the sprites`)
    used.set(color, ch)
  }
  return ch
}

/** A PNG frame as one string of palette characters, row after row. */
function toChars(png) {
  let s = ''
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = (y * png.width + x) * 4
      if (png.data[i + 3] < 128) {
        s += '.'
        continue
      }
      const { color, dist } = snap(png.data[i], png.data[i + 1], png.data[i + 2])
      worstSnap = Math.max(worstSnap, dist)
      s += charFor(color)
    }
  }
  return s
}

/**
 * A frame as runs: `A3` is `AAA`; with the frame before given, `=5` is five
 * pixels the same as in it. Greedy: an unchanged run wins when it is at least
 * as long as the color run starting at the same pixel.
 */
function encode(cur, prev) {
  let out = ''
  for (let i = 0; i < cur.length; ) {
    let same = 0
    if (prev !== undefined) while (i + same < cur.length && cur[i + same] === prev[i + same]) same += 1
    let run = 1
    while (i + run < cur.length && cur[i + run] === cur[i]) run += 1
    if (same > 0 && same >= run) {
      out += same > 1 ? `=${same}` : '='
      i += same
    } else {
      out += run > 1 ? `${cur[i]}${run}` : cur[i]
      i += run
    }
  }
  return out
}

const sprites = compositions.filter(c => SPRITE_ID.test(c.id)).sort((a, b) => a.id.localeCompare(b.id))
const anims = {}
const stripDir = path.join(OUT, 'sprites')
fs.mkdirSync(stripDir, { recursive: true })
const t0 = Date.now()
try {
  for (const composition of sprites) {
    const buffers = []
    await renderFrames({
      composition,
      serveUrl,
      inputProps: composition.props,
      imageFormat: 'png',
      outputDir: null,
      puppeteerInstance: browser,
      logLevel: 'error',
      concurrency: 4,
      onStart: () => undefined,
      onFrameUpdate: () => undefined,
      onFrameBuffer: (buffer, frame) => {
        buffers[frame] = buffer
      },
    })
    const ms = Math.round(1000 / composition.fps)
    const frames = [] // { ms, chars, first }: `first` the rendered frame it came from
    buffers.forEach((buffer, i) => {
      const chars = toChars(PNG.sync.read(buffer))
      const last = frames[frames.length - 1]
      if (last !== undefined && last.chars === chars) last.ms += ms
      else frames.push({ ms, chars, first: i })
    })
    // A loop whose first and last frames match plays them as two holds: kept apart, the loop restarts on frame 0.
    const encoded = frames.map((f, k) => [f.ms, encode(f.chars, k === 0 ? undefined : frames[k - 1].chars)])
    anims[composition.id] = { w: composition.width, h: composition.height, frames: encoded, rendered: buffers.length }
    // A strip of the distinct frames, 1:1, for a look.
    const strip = new PNG({ width: composition.width * frames.length, height: composition.height })
    frames.forEach((f, k) => PNG.bitblt(PNG.sync.read(buffers[f.first]), strip, 0, 0, composition.width, composition.height, k * composition.width, 0))
    fs.writeFileSync(path.join(stripDir, `${composition.id}.png`), PNG.sync.write(strip))
  }
} finally {
  await browser.close({ silent: true })
}

const colors = Object.fromEntries([...used.entries()].map(([color, ch]) => [ch, color]))
const lines = Object.entries(anims).map(([id, a]) => ({ id, a, line: `  '${id}': { w: ${a.w}, h: ${a.h}, frames: [${a.frames.map(([ms, rle]) => `[${ms}, '${rle}']`).join(', ')}] },` }))
const source = `// GENERATED by studio/scripts/sprites.mjs from the Remotion renders (\`npm run sprites\` in studio/).
// Do not edit by hand: change the art in studio/src/art or the timelines in
// studio/src/anim, then render again.

/** The colors, by the character that stands for each in a frame; \`.\` is transparent. */
export const SPRITE_COLORS: Readonly<Record<string, string>> = ${JSON.stringify(colors)}

/**
 * One animation: its size in pixels, and its frames in play order, each held
 * \`ms\` milliseconds, its pixels row by row (\`w * h\` of them) as runs: a
 * palette character (\`.\` transparent) followed by how many when more than
 * one (\`A3\` is \`AAA\`). From the second frame on, \`=\` stands for "the
 * same pixel as in the frame before" and takes a count the same way (\`=12\`
 * is twelve pixels unchanged from the previous frame, \`=\` alone one), so
 * decode the frames in order; the first frame never uses \`=\` and decodes
 * alone.
 */
export type SpriteAnim = { readonly w: number; readonly h: number; readonly frames: ReadonlyArray<readonly [ms: number, pixels: string]> }

export const SPRITES: Readonly<Record<string, SpriteAnim>> = {
${lines.map(l => l.line).join('\n')}
}
`
fs.mkdirSync(path.dirname(TARGET), { recursive: true })
fs.writeFileSync(TARGET, source)

const kb = n => `${(n / 1024).toFixed(1)} KB`
const width = Math.max(...lines.map(l => l.id.length))
for (const { id, a, line } of lines) console.log(`${id.padEnd(width)}  ${String(a.w).padStart(2)}x${String(a.h).padEnd(2)}  ${String(a.rendered).padStart(3)} frames -> ${String(a.frames.length).padStart(2)} distinct  ${kb(Buffer.byteLength(line)).padStart(8)}`)
const largest = [...lines].sort((p, q) => Buffer.byteLength(q.line) - Buffer.byteLength(p.line)).slice(0, 5)
console.log(`largest: ${largest.map(l => `${l.id} ${kb(Buffer.byteLength(l.line))}`).join(', ')}`)
console.log(`wrote ${TARGET}: ${lines.length} animations, ${used.size} colors, ${kb(Buffer.byteLength(source))} in ${((Date.now() - t0) / 1000).toFixed(1)}s (worst color snap distance ${worstSnap})`)
