// An onion skin of two pictures of a member: A, B, B laid over A at half
// opacity, and a mask of the pixels B changed (magenta where B paints a new
// color, cyan where it erases one). It prints how many pixels changed and
// where, and, for two full-figure poses, the patch that turns A into B in
// palette characters (`_` where B erases), ready to paste into a part file.
// No browser.
//
//   node scripts/onion.mjs <member> <A> <B> [--out <file.png>] [--scale N] [--stand <module.ts>]
//
// A and B are look.mjs's picture cells of the same size: <pose>+..., portrait:<pose>+...,
// mini:<pose>+..., ref, extra:<name>.
//
// e.g.  node scripts/onion.mjs bocchi stand playA
//       node scripts/onion.mjs bocchi stand+idle+sway:L stand+idle+sway:R --scale 6

import { MEMBERS, loadStudio } from './studio.mjs'
import { canvas, drawPixels, drawText, mix, save, textWidth } from './png.mjs'
import { cellPixels, label, outFile, parseArgs, parseCell, slug, withStand } from './tools.mjs'

const { positional, out, scale: N, stand } = parseArgs(process.argv.slice(2), { scale: 4 })
const [member, specA, specB] = positional
if (!MEMBERS.includes(member) || specA === undefined || specB === undefined || positional.length > 3) {
  console.error('usage: node scripts/onion.mjs <member> <A> <B> [--out <file.png>] [--scale N] [--stand <module.ts>]')
  process.exit(2)
}
const S = await loadStudio()
const art = await withStand(S.ART[member], stand)
const cellA = parseCell(S, specA)
const cellB = parseCell(S, specB)
const A = cellPixels(S, art, cellA)
const B = cellPixels(S, art, cellB)
const w = A[0]?.length ?? 0
const h = A.length
if ((B[0]?.length ?? 0) !== w || B.length !== h) throw new Error(`A is ${w}x${h}, B is ${B[0]?.length ?? 0}x${B.length}: onion two pictures of one size`)

const PAINT = '#ff2bd6'
const ERASE = '#2bd6ff'
const BG = '#1b1b1f'
const CHECK = ['#2c2c33', '#26262c']
let painted = 0
let erased = 0
let box = null
const onion = []
const mask = []
for (let y = 0; y < h; y += 1) {
  onion.push([])
  mask.push([])
  for (let x = 0; x < w; x += 1) {
    const a = A[y][x]
    const b = B[y][x]
    const under = a ?? CHECK[(x + y) % 2]
    onion[y].push(b === null ? under : mix(under, b, 0.5))
    if (a === b) {
      mask[y].push(a === null ? null : mix(BG, a, 0.3))
      continue
    }
    if (b === null) erased += 1
    else painted += 1
    mask[y].push(b === null ? ERASE : PAINT)
    box = box === null ? { x0: x, x1: x, y0: y, y1: y } : { x0: Math.min(box.x0, x), x1: Math.max(box.x1, x), y0: Math.min(box.y0, y), y1: Math.max(box.y1, y) }
  }
}

const scale = (cellA.mult ?? 1) * N
const M = 24
const GAP = 20
const LH = 20
const panels = [
  [`A: ${specA}`, A],
  [`B: ${specB}`, B],
  ['B over A at half', onion],
  [`changed: ${painted} painted, ${erased} erased`, mask],
]
const pw = Math.max(w * scale, ...panels.map(([t]) => textWidth(S.FONT, label(t), 2)))
const width = M * 2 + panels.length * (pw + GAP) - GAP
const height = M * 2 + 30 + LH + h * scale
const png = canvas(width, height)
drawText(png, S.FONT, label(`${art.name} onion, ${scale}x`), M, M, art.accent, 3)
panels.forEach(([title, px], i) => {
  const x = M + i * (pw + GAP)
  drawText(png, S.FONT, label(title), x, M + 30, i === 3 ? PAINT : '#f7a8c9', 2)
  drawPixels(png, px, x, M + 30 + LH, scale)
})
const file = outFile(out, `onion-${member}-${slug(`${specA}_${specB}`)}.png`)
save(png, file)

const where = box === null ? 'nowhere' : `cols ${box.x0}-${box.x1}, rows ${box.y0}-${box.y1} (a patch at x ${box.x0}, y ${box.y0}, ${box.x1 - box.x0 + 1}x${box.y1 - box.y0 + 1})`
console.log(`wrote ${file}: B changes ${painted + erased} pixels of A (${painted} painted, ${erased} erased), ${where}`)

// Two full-figure poses: the patch that turns A into B, in the member's palette characters.
if (box !== null && cellA.kind === 'scene' && cellB.kind === 'scene' && cellA.view === 'full' && cellB.view === 'full') {
  const keyOf = new Map()
  for (const [k, c] of Object.entries(art.palette)) if (!keyOf.has(c.toLowerCase())) keyOf.set(c.toLowerCase(), k)
  const rows = []
  for (let y = box.y0; y <= box.y1; y += 1) {
    let r = ''
    for (let x = box.x0; x <= box.x1; x += 1) {
      const a = A[y][x]
      const b = B[y][x]
      r += a === b ? '.' : b === null ? '_' : (keyOf.get(b.toLowerCase()) ?? '?')
    }
    rows.push(`  '${r}', // ${y}`)
  }
  if (rows.length <= 96) console.log(`as a patch on A: { x: ${box.x0}, y: ${box.y0}, grid: [\n${rows.join('\n')}\n] }`)
}
