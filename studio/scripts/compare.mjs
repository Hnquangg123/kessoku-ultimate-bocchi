// A member beside the style target, at the same pixel scale (N, default 6):
//   row 1  the reference (REF_GRID, 100x100) | her stand (96x96) | for Bocchi, her stand against REF_STAND
//          pixel by pixel (equal pixels dimmed, differing ones magenta); for the others, her stand over the
//          reference's silhouette (height, stance, proportions), all at N, the soles' and bend rows ticked
//   row 2  every pose, resolved, at N/2
//   row 3  every face on the head (the 32x32 portrait window) at 4N/3
//   row 4  the peeks on the box (portrait windows) at 4N/3, and the mini rig's bare stand and box heads at 8N/3
//   row 5  the mini (16x16) of every face and every peek at 8N/3: the rig's if she has one, else the portrait halved
// No browser: the studio's TypeScript compiled with esbuild, painted with pngjs.
//
//   node scripts/compare.mjs <member> [--out <file.png>] [--scale N] [--stand <module.ts>]
//                                                       -> out/compare/compare-<member>.png by default
// --stand: a candidate module exporting { palette, stand }, laid over the member for this run.

import path from 'node:path'
import { MEMBERS, OUT, loadStudio } from './studio.mjs'
import { canvas, drawPixels, drawText, fillRect, save } from './png.mjs'
import { FACES, PEEKS, label, parseArgs, sceneOf, toPixels, withStand } from './tools.mjs'

const { positional, out, scale: BIG, stand: standFile } = parseArgs(process.argv.slice(2), { scale: 6 })
const member = positional[0]
if (!MEMBERS.includes(member) || positional.length > 1) {
  console.error(`usage: node scripts/compare.mjs <${MEMBERS.join('|')}> [--out <file.png>] [--scale N] [--stand <module.ts>]`)
  process.exit(2)
}
const S = await loadStudio()
const art = await withStand(S.ART[member], standFile)

const M = 24
const GAP = 24
const LH = 24
const POSE = Math.max(1, Math.round(BIG / 2))
const FACE = Math.max(1, Math.round((BIG * 4) / 3))
const MINI = Math.max(1, Math.round((BIG * 8) / 3))
const ref = toPixels(S.REF_GRID, S.REF_PALETTE)
const refStand = toPixels(S.REF_STAND, S.REF_PALETTE)
const stand = toPixels(S.resolvePose(art, 'stand'), art.palette)

// Row 1, panel 3: the difference from the reference (Bocchi), or an onion skin over it (the others).
let diffCount = 0
const third = stand.map((row, y) =>
  row.map((c, x) => {
    const r = refStand[y]?.[x] ?? null
    if (member === 'bocchi') {
      if (c === r) return c === null ? null : dim(c)
      diffCount += 1
      return '#ff2bd6'
    }
    return c ?? (r === null ? null : '#4a4552')
  }),
)
function dim(hex) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (v, bg) => Math.round(bg + (v - bg) * 0.35)
  return `#${[mix((n >> 16) & 255, 0x1b), mix((n >> 8) & 255, 0x1b), mix(n & 255, 0x1f)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

const rig = art.mini !== undefined
const poses = S.POSES.map(p => ({ name: p, px: toPixels(S.resolvePose(art, p), art.palette) }))
const faces = FACES.map(f => ({ name: `face ${f}`, px: S.drawScene(art, sceneOf({ pose: 'stand', face: f }), 'portrait') }))
const peeks = PEEKS.map(p => ({ name: p, px: S.drawScene(art, sceneOf({ pose: 'box', peek: p }), 'portrait'), scale: FACE }))
const bases = rig ? [{ name: 'mini stand', px: toPixels(art.mini.stand, art.palette), scale: MINI }, { name: 'mini box', px: toPixels(art.mini.box, art.palette), scale: MINI }] : []
const minis = [
  ...FACES.map(f => ({ name: `mini ${f}`, px: S.drawScene(art, sceneOf({ pose: 'stand', face: f }), 'mini') })),
  ...PEEKS.map(p => ({ name: `mini ${p}`, px: S.drawScene(art, sceneOf({ pose: 'box', peek: p }), 'mini') })),
]

const row1W = 100 * BIG + 2 * (96 * BIG) + 2 * GAP
const row2W = poses.length * (96 * POSE) + (poses.length - 1) * GAP
const row3W = faces.length * (32 * FACE) + (faces.length - 1) * GAP
const row4W = [...peeks, ...bases].reduce((n, p) => n + 32 * FACE + GAP, -GAP)
const row5W = minis.length * (16 * MINI) + (minis.length - 1) * GAP
const width = M * 2 + Math.max(row1W, row2W, row3W, row4W, row5W)
const height = M * 2 + (LH + 100 * BIG) + GAP + (LH + 96 * POSE) + GAP + (LH + 32 * FACE) + GAP + (LH + 32 * FACE) + GAP + (LH + 16 * MINI)
const png = canvas(width, height)

let y = M
let x = M
drawText(png, S.FONT, 'reference 100x100', x, y, '#f7a8c9', 3)
drawPixels(png, ref, x, y + LH, BIG)
x += 100 * BIG + GAP
drawText(png, S.FONT, label(`${art.name} stand 96x96${standFile ? ' (candidate)' : ''}`), x, y, art.accent, 3)
drawPixels(png, stand, x, y + LH, BIG)
x += 96 * BIG + GAP
drawText(png, S.FONT, member === 'bocchi' ? `vs ref stand: ${diffCount} px differ` : 'over the reference', x, y, member === 'bocchi' && diffCount > 0 ? '#ff2bd6' : '#8a8392', 3)
drawPixels(png, third, x, y + LH, BIG)
// Guides on the big panels: the soles' row (93) and the bend row, a pixel high.
for (const px0 of [M + 100 * BIG + GAP, M + 100 * BIG + GAP + 96 * BIG + GAP]) {
  for (const r of [93, art.bend]) fillRect(png, px0 - 8, y + LH + r * BIG + Math.floor(BIG / 2), 6, 1, '#7fd18b')
}
y += LH + 100 * BIG + GAP

x = M
for (const p of poses) {
  drawText(png, S.FONT, label(p.name), x, y, '#8a8392', 3)
  drawPixels(png, p.px, x, y + LH, POSE)
  x += 96 * POSE + GAP
}
y += LH + 96 * POSE + GAP

x = M
for (const f of faces) {
  drawText(png, S.FONT, label(f.name), x, y, '#8a8392', 3)
  drawPixels(png, f.px, x, y + LH, FACE)
  x += 32 * FACE + GAP
}
y += LH + 32 * FACE + GAP

x = M
for (const p of [...peeks, ...bases]) {
  drawText(png, S.FONT, label(p.name), x, y, '#8a8392', 3)
  drawPixels(png, p.px, x, y + LH, p.scale)
  x += (p.px[0]?.length ?? 32) * p.scale + GAP
}
y += LH + 32 * FACE + GAP

x = M
for (const p of minis) {
  drawText(png, S.FONT, label(p.name), x, y, rig ? '#8a8392' : '#c9a35b', 2)
  drawPixels(png, p.px, x, y + LH, MINI)
  x += 16 * MINI + GAP
}

const file = out ?? path.join(OUT, 'compare', `compare-${member}.png`)
save(png, file)
console.log(`wrote ${file} (${width}x${height})${member === 'bocchi' ? `: stand vs REF_STAND, ${diffCount} pixels differ` : ''}; minis ${rig ? 'from the mini rig' : 'halved from the portrait (no mini rig)'}`)
