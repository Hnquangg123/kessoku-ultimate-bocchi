// Shared by the studio's quick scripts (no browser): where things are, and the
// studio's TypeScript (the art, the compositing, the timelines) compiled with
// esbuild and imported straight into node.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

export const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const OUT = path.join(STUDIO, 'out')
export const MEMBERS = ['bocchi', 'nijika', 'ryo', 'kita']
export const MOODS = ['anxious', 'focused', 'happy', 'panic', 'melting', 'hiding']
export const SLIME_STATES = ['active', 'idle', 'asleep']

export const slash = p => p.replace(/\\/g, '/')
export const src = (...parts) => JSON.stringify(slash(path.join(STUDIO, ...parts)))

/** Bundles a little TypeScript module (its imports resolved from the studio) and imports it. */
export async function loadTs(contents) {
  const out = await build({ stdin: { contents, resolveDir: STUDIO, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'error' })
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`)
}

/** The studio's art and engine in one import: ART, the compose helpers, the scene drawer, the timelines (moods and slimes), the reference. */
export async function loadStudio() {
  return loadTs(`
export { ART } from ${src('src', 'art', 'members', 'index.ts')}
export * from ${src('src', 'art', 'compose.ts')}
export { memberPalette, paletteClashes } from ${src('src', 'art', 'parts.ts')}
export { FX, FX_MINI, FX_INKS, FONT, fxSize } from ${src('src', 'art', 'fx.ts')}
export { W, H, PW, PH, MINI, SLIME_W, SLIME_H } from ${src('src', 'art', 'types.ts')}
export { drawScene, drawMood, windowOf, miniMove, GROUND } from ${src('src', 'anim', 'scene.ts')}
export { sceneAt, tagFor, expand, framesOf, FPS } from ${src('src', 'anim', 'moods.ts')}
export { SLIME_STATES, drawSlime, drawSlimeScene, slimeSceneAt, slimeTag, slimeFramesOf } from ${src('src', 'anim', 'slimes.ts')}
export { drawCrash, drawCrashMini, CRASH_FRAMES } from ${src('src', 'anim', 'crash.ts')}
export { REF_GRID, REF_STAND, REF_PALETTE } from ${src('reference', 'bocchi-reference.grid.ts')}
`)
}
