// The "do they read as one set?" check: the reference and the four members'
// stands side by side on a dark stage, at the same scale, over faint guide
// lines at the brief's landmark rows (hair top 18, chin 40, waist 62, skirt
// hem 69, knees 72, shoe tops 87, soles 93); below each, her portrait at 2x
// that scale and her mini at 4x. No browser.
//
//   node scripts/lineup.mjs [--out <file.png>] [--scale N]       (default scale 4)

import { MEMBERS, loadStudio } from './studio.mjs'
import { canvas, drawPixels, drawText, fillRect, save } from './png.mjs'
import { label, outFile, parseArgs, sceneOf, toPixels } from './tools.mjs'

const { positional, out, scale: N } = parseArgs(process.argv.slice(2), { scale: 4 })
if (positional.length > 0) {
  console.error('usage: node scripts/lineup.mjs [--out <file.png>] [--scale N]')
  process.exit(2)
}
const S = await loadStudio()

const BG = '#1b1b1f'
const GUIDE = '#2a2a33'
const FLOOR = '#5e5866'
const GUIDES = [
  [18, 'hair top'],
  [40, 'chin'],
  [62, 'waist'],
  [69, 'hem'],
  [72, 'knees'],
  [87, 'shoes'],
  [93, 'soles'],
]
const M = 24
const GAP = 12 * N
const LH = 20
const LEFT = 90
const colW = 96 * N

// The columns: the reference (Bocchi's windows over it), then each member's stand with her idle face.
const columns = [
  (() => {
    const ref = toPixels(S.REF_STAND, S.REF_PALETTE)
    const b = S.ART.bocchi
    const portrait = S.crop(ref, b.head.x, b.head.y)
    return { name: 'reference', color: '#8a8392', full: ref, portrait, mini: S.downscale2(portrait), miniNote: 'halved' }
  })(),
  ...MEMBERS.map(id => {
    const art = S.ART[id]
    const s = sceneOf({ pose: 'stand', face: 'idle' })
    return { name: art.name, color: art.accent, full: S.drawScene(art, s, 'full'), portrait: S.drawScene(art, s, 'portrait'), mini: S.drawScene(art, s, 'mini'), miniNote: art.mini ? 'mini rig' : 'halved' }
  }),
]

const stageH = 96 * N
const width = M * 2 + LEFT + columns.length * (colW + GAP) - GAP
const height = M * 2 + LH + stageH + GAP + LH + 32 * 2 * N + GAP + LH + 16 * 4 * N
const png = canvas(width, height, BG)
const top = M + LH
// The guides behind the figures, labelled at the left.
let labelY = -Infinity
for (const [row, name] of GUIDES) {
  fillRect(png, M + LEFT - 8, top + row * N + Math.floor(N / 2), width - M * 2 - LEFT + 8, Math.max(1, Math.floor(N / 4)), GUIDE)
  labelY = Math.max(top + row * N - 3, labelY + 13)
  drawText(png, S.FONT, label(`${row} ${name}`), M, labelY, '#5e5866', 2)
}
// The floor under the soles.
fillRect(png, M + LEFT - 8, top + 94 * N, width - M * 2 - LEFT + 8, N, FLOOR)
columns.forEach((c, i) => {
  const x = M + LEFT + i * (colW + GAP)
  drawText(png, S.FONT, label(c.name), x, M, c.color, 2)
  drawPixels(png, c.full, x, top, N, null)
  let y = top + stageH + GAP
  drawText(png, S.FONT, label(`portrait ${2 * N}x`), x, y, '#8a8392', 2)
  drawPixels(png, c.portrait, x, y + LH, 2 * N)
  y += LH + 32 * 2 * N + GAP
  drawText(png, S.FONT, label(`mini ${4 * N}x (${c.miniNote})`), x, y, '#8a8392', 2)
  drawPixels(png, c.mini, x, y + LH, 4 * N)
})
const file = outFile(out, 'lineup.png')
save(png, file)
console.log(`wrote ${file} (${width}x${height}) at ${N}x: ${columns.map(c => c.name).join(', ')}`)
