// Pictures side by side, to look at while drawing: a pose with any face, sway,
// squash or peek, the portrait window, the mini, the reference at the same
// scale, an extra, every distinct frame of a mood, the crash. No browser: the
// studio's TypeScript compiled with esbuild, painted with pngjs, in a second.
//
//   node scripts/look.mjs <member> <cell...> [--out <file.png>] [--scale N] [--stand <module.ts>]
//
// Cells:
//   <pose>[+<face>][+sway:L|R][+squash:N][+melt:T][+dx:N][+dy:N]   the full figure, 96x96, at N
//         [+fx:<kind>@x,y[@body|@ground][#rrggbb]]                    with an effect keyed as a timeline keys it
//   box+<peek>  (or box+peek:<name>)                              the box with the eyes over the rim, at N
//   portrait:<pose>+...                                           the 32x32 portrait window, at 2N
//   mini:<stand|box>+<face|peek>                                  the 16x16 mini, at 4N
//   ref                                                           the reference on our canvas (REF_STAND), at N
//   extra:<name>                                                  an extra (Bocchi: guitarFlat, guitarTilt), at N
//   mood:<mood>                                                   every distinct frame of a mood: full (N),
//                                                                 portrait (2N) and mini (4N) strips, with holds
//   crash                                                         every frame of fx-crash (N) and its mini (2N)
//
// e.g.  node scripts/look.mjs bocchi ref stand+idle playA+focus crouch+happy --scale 4
//       node scripts/look.mjs bocchi mood:anxious --scale 2
//
// --scale N  the full figure's scale (default 4); --stand  a candidate module exporting { palette, stand }
// laid over the member for this run; --out  the PNG (default out/look/look-<member>-<cells>.png).

import { MEMBERS, loadStudio } from './studio.mjs'
import { canvas, drawPixels, drawText, save, textWidth } from './png.mjs'
import { cellPixels, crashFrames, label, moodFrames, outFile, parseArgs, parseCell, slug, withStand } from './tools.mjs'

const { positional, out, scale: N, stand } = parseArgs(process.argv.slice(2), { scale: 4 })
const [member, ...specs] = positional
if (!MEMBERS.includes(member) || specs.length === 0) {
  console.error('usage: node scripts/look.mjs <member> <cell...> [--out <file.png>] [--scale N] [--stand <module.ts>]')
  console.error('cells: <pose>[+face][+sway:L|R][+squash:N]  box+<peek>  portrait:<pose>+...  mini:<stand|box>+<face|peek>  ref  extra:<name>  mood:<mood>  crash')
  process.exit(2)
}
const S = await loadStudio()
const art = await withStand(S.ART[member], stand)
const cells = specs.map(spec => parseCell(S, spec))

const M = 24
const GAP = 20
const LH = 20
const TITLE = '#f7a8c9'
const MUTED = '#8a8392'
const MAX_W = Math.max(3200, 96 * N * 3)
const picW = p => (p.px[0]?.length ?? 0) * p.scale
const picH = p => p.px.length * p.scale

/** A block: its size and how to paint it at (x, y). */
function pictureBlock(title, pic) {
  const w = Math.max(picW(pic), textWidth(S.FONT, label(title), 2))
  return { w, h: LH + picH(pic), draw: (png, x, y) => {
    drawText(png, S.FONT, label(title), x, y, TITLE, 2)
    drawPixels(png, pic.px, x, y + LH, pic.scale)
  } }
}

/** Frames in columns (a label, then one picture a strip below it), wrapped into rows of columns. */
function stripBlock(title, columns, strips) {
  const colW = Math.max(...columns.flatMap(c => c.pics.map(picW)), ...columns.map(c => textWidth(S.FONT, label(c.label), 2)))
  const stripH = k => Math.max(...columns.map(c => picH(c.pics[k])))
  const perRow = Math.max(1, Math.floor((MAX_W + GAP) / (colW + GAP)))
  const chunks = []
  for (let i = 0; i < columns.length; i += perRow) chunks.push(columns.slice(i, i + perRow))
  const chunkH = LH + Array.from({ length: strips }, (_, k) => stripH(k) + GAP).reduce((a, b) => a + b, 0)
  const w = Math.max(textWidth(S.FONT, label(title), 2), Math.min(columns.length, perRow) * (colW + GAP) - GAP)
  return {
    w,
    h: LH + chunks.length * chunkH,
    draw: (png, x, y) => {
      drawText(png, S.FONT, label(title), x, y, TITLE, 2)
      chunks.forEach((chunk, ci) => {
        const y0 = y + LH + ci * chunkH
        chunk.forEach((c, i) => {
          const cx = x + i * (colW + GAP)
          drawText(png, S.FONT, label(c.label), cx, y0, MUTED, 2)
          let sy = y0 + LH
          c.pics.forEach((p, k) => {
            drawPixels(png, p.px, cx, sy, p.scale)
            sy += stripH(k) + GAP
          })
        })
      })
    },
  }
}

const blocks = cells.map(cell => {
  if (cell.kind === 'mood') {
    const { total, frames } = moodFrames(S, art, cell.mood)
    const columns = frames.map(f => ({ label: `f${f.start} ${f.hold * 100}ms`, pics: [{ px: f.full, scale: N }, { px: f.portrait, scale: 2 * N }, { px: f.mini, scale: 4 * N }] }))
    return stripBlock(`${member} ${cell.mood}: ${total} frames, ${total * 100}ms loop, ${frames.length} distinct (full, portrait, mini)`, columns, 3)
  }
  if (cell.kind === 'crash') {
    const crashArt = art.extras?.guitarFlat ? art : S.ART.bocchi
    const frames = crashFrames(S, crashArt)
    const columns = frames.map(f => ({ label: `f${f.start} ${f.hold * 100}ms`, pics: [{ px: f.full, scale: N }, { px: f.mini, scale: 2 * N }] }))
    return stripBlock(`fx-crash: ${S.CRASH_FRAMES} frames, ${frames.length} distinct (96x32, its 48x16 mini)`, columns, 2)
  }
  const px = cellPixels(S, art, cell)
  const scale = cell.mult * N
  return pictureBlock(`${cell.spec} ${scale}x`, { px, scale })
})

// Flow the blocks left to right, wrapping at MAX_W.
const rows = []
let row = { blocks: [], w: 0, h: 0 }
for (const b of blocks) {
  if (row.blocks.length > 0 && row.w + GAP + b.w > MAX_W) {
    rows.push(row)
    row = { blocks: [], w: 0, h: 0 }
  }
  row.w += (row.blocks.length > 0 ? GAP : 0) + b.w
  row.h = Math.max(row.h, b.h)
  row.blocks.push(b)
}
rows.push(row)
const head = `${art.name}${stand ? ` with stand from ${stand.replace(/\\/g, '/').split('/').pop()}` : ''}`
const width = M * 2 + Math.max(textWidth(S.FONT, label(head), 3), ...rows.map(r => r.w))
const height = M * 2 + 30 + rows.reduce((n, r) => n + r.h + GAP, 0) - GAP
const png = canvas(width, height)
drawText(png, S.FONT, label(head), M, M, art.accent, 3)
let y = M + 30
for (const r of rows) {
  let x = M
  for (const b of r.blocks) {
    b.draw(png, x, y)
    x += b.w + GAP
  }
  y += r.h + GAP
}
const file = outFile(out, `look-${member}-${slug(specs.join('_'))}.png`)
save(png, file)
console.log(`wrote ${file} (${width}x${height})`)
