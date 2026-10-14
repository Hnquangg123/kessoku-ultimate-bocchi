// Shared by svg.mjs and terminal.mjs: the mod's own sprite player
// (../hooks/lib/sprite.ts) compiled with esbuild and imported into node, over
// a sprites.gen.ts of our choosing (`--gen <path>`; the mod's own by default),
// so a scratch export can be previewed without touching the mod.
//
// The frames are handed to the player with their `=` runs ("same pixel as the
// frame before") already expanded to plain runs, so the preview works with the
// mod's decoder whether or not it reads `=` yet. (What it previews is the
// drawing: the SVG writer and the terminal cell encoder.)

import fs from 'node:fs'
import path from 'node:path'
import { build } from 'esbuild'
import { STUDIO, slash } from './studio.mjs'

export const MOD_SPRITE = path.resolve(STUDIO, '..', 'hooks', 'lib', 'sprite.ts')
export const MOD_GEN = path.resolve(STUDIO, '..', 'hooks', 'lib', 'sprites.gen.ts')

/** `--gen <path>` out of the arguments; the rest kept. */
export function genArg(argv) {
  const at = argv.indexOf('--gen')
  if (at < 0) return { gen: MOD_GEN, rest: argv }
  const gen = argv[at + 1]
  if (gen === undefined) throw new Error('--gen wants a path to a sprites.gen.ts')
  return { gen: path.resolve(gen), rest: [...argv.slice(0, at), ...argv.slice(at + 2)] }
}

async function importTs(file) {
  const out = await build({ entryPoints: [file], bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'error' })
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`)
}

/** One frame's runs to its characters, `=` taken from the frame before. */
function expand(rle, size, prev) {
  let s = ''
  let i = 0
  while (i < rle.length && s.length < size) {
    const ch = rle[i]
    i += 1
    let digits = ''
    while (i < rle.length && rle[i] >= '0' && rle[i] <= '9') digits += rle[i++]
    const n = digits === '' ? 1 : Number(digits)
    s += ch === '=' ? prev.slice(s.length, s.length + n) : ch.repeat(n)
  }
  return s.padEnd(size, '.')
}

function rle(s) {
  let out = ''
  for (let i = 0; i < s.length; ) {
    let n = 1
    while (s[i + n] === s[i]) n += 1
    out += n > 1 ? `${s[i]}${n}` : s[i]
    i += n
  }
  return out
}

/** The mod's sprite.ts over `gen`, with its exports, plus the gen file's own size and sprite ids. */
export async function loadModSprites(gen = MOD_GEN) {
  if (!fs.existsSync(gen)) throw new Error(`no sprites at ${gen}: run node scripts/sprites.mjs --out ${gen}`)
  const G = await importTs(gen)
  const plain = {}
  for (const [id, a] of Object.entries(G.SPRITES)) {
    let prev = ''
    plain[id] = {
      w: a.w,
      h: a.h,
      frames: a.frames.map(([ms, r]) => {
        const s = expand(r, a.w * a.h, prev)
        prev = s
        return [ms, rle(s)]
      }),
    }
  }
  const virtual = `export const SPRITE_COLORS = ${JSON.stringify(G.SPRITE_COLORS)}\nexport const SPRITES = ${JSON.stringify(plain)}\n`
  const out = await build({
    stdin: { contents: `export * from ${JSON.stringify(slash(MOD_SPRITE))}`, resolveDir: STUDIO, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'error',
    plugins: [
      {
        name: 'gen',
        setup(b) {
          b.onResolve({ filter: /sprites\.gen(\.ts)?$/ }, () => ({ path: 'sprites.gen', namespace: 'gen' }))
          b.onLoad({ filter: /.*/, namespace: 'gen' }, () => ({ contents: virtual, loader: 'js' }))
        },
      },
    ],
  })
  const S = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`)
  return { S, ids: Object.keys(G.SPRITES), genBytes: fs.statSync(gen).size, gen }
}
