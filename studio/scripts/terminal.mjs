// What the sprites look like in a terminal: runs the mod's own encoder
// (../hooks/lib/sprite.ts) over the exported frames and paints the Raster
// cells it would send into a PNG, each cell 8x16 pixels as a terminal draws
// it, block elements and all. Per mood, frame 0: the full figure in quadrants
// (48x24 cells), the portrait in quadrants (16x8) and in half blocks (32x16),
// the mini in quadrants (8x4) and in half blocks (16x8); then the crash; then
// per slime state its frame 0 in half blocks (36x12) and every distinct frame
// of its mini in quadrants (9x3), as the panel's cards and the strip draw them.
//
//   node scripts/terminal.mjs [--gen <sprites.gen.ts>] [member...]   -> out/terminal/<member>.png

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import { MEMBERS, MOODS, OUT, SLIME_STATES } from './studio.mjs'
import { genArg, loadModSprites } from './mod.mjs'

const { gen, rest } = genArg(process.argv.slice(2))
const asked = rest.filter(m => MEMBERS.includes(m))
const members = asked.length > 0 ? asked : MEMBERS
const { S, ids } = await loadModSprites(gen)

const CW = 8
const CH = 16
const TERM_BG = [0x1e, 0x1e, 0x24]
const QUAD = new Map([[0x20, 0], [0x2598, 1], [0x259d, 2], [0x2580, 3], [0x2596, 4], [0x258c, 5], [0x259e, 6], [0x259b, 7], [0x2597, 8], [0x259a, 9], [0x2590, 10], [0x259c, 11], [0x2584, 12], [0x2599, 13], [0x259f, 14], [0x2588, 15]])

function color(word) {
  if (word & 0x01000000) return TERM_BG
  return [(word >> 16) & 255, (word >> 8) & 255, word & 255]
}

/** Paints a Raster's cells at (ox, oy) on the PNG. */
function paint(png, cells, columns, rows, ox, oy) {
  const bytes = Buffer.from(cells, 'base64')
  for (let r = 0; r < rows; r += 1)
    for (let c = 0; c < columns; c += 1) {
      const o = (r * columns + c) * 12
      const cp = bytes.readUInt32LE(o)
      const fg = color(bytes.readUInt32LE(o + 4))
      const bg = color(bytes.readUInt32LE(o + 8))
      const mask = QUAD.get(cp) ?? 0
      for (let y = 0; y < CH; y += 1)
        for (let x = 0; x < CW; x += 1) {
          const q = (y < CH / 2 ? 0 : 2) + (x < CW / 2 ? 0 : 1)
          const rgb = mask & (1 << q) ? fg : bg
          const px = ox + c * CW + x
          const py = oy + r * CH + y
          if (px >= png.width || py >= png.height) continue
          const i = (py * png.width + px) * 4
          png.data[i] = rgb[0]
          png.data[i + 1] = rgb[1]
          png.data[i + 2] = rgb[2]
          png.data[i + 3] = 255
        }
    }
}

/** Draws sprite `id`'s frame `frame` (0 unless given) in `mode` at cell (col, row); returns the cells it took. */
function draw(png, id, mode, col, row, frame = 0) {
  const anim = S.animOf(id)
  if (!anim || !ids.includes(id)) return { columns: 0, rows: 0 }
  const e = S.encodeCells(S.framePixels(id, frame), anim.w, anim.h, mode)
  paint(png, e.cells, e.columns, e.rows, col * CW, row * CH)
  return e
}

/** The slime rows: 12 for the half blocks, one between. */
const SLIME_ROW = 13

fs.mkdirSync(path.join(OUT, 'terminal'), { recursive: true })
for (const member of members) {
  const width = (48 + 2 + 16 + 2 + 32 + 2 + 8 + 2 + 16) * CW
  const height = (MOODS.length * 25 + 8 + 1 + SLIME_STATES.length * SLIME_ROW) * CH
  const png = new PNG({ width, height })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = TERM_BG[0]
    png.data[i + 1] = TERM_BG[1]
    png.data[i + 2] = TERM_BG[2]
    png.data[i + 3] = 255
  }
  MOODS.forEach((mood, k) => {
    const row = k * 25
    const id = `${member}-${mood}`
    draw(png, id, 'quad', 0, row)
    draw(png, `${id}-portrait`, 'quad', 50, row)
    draw(png, `${id}-portrait`, 'half', 68, row)
    draw(png, `${id}-mini`, 'quad', 102, row)
    draw(png, `${id}-mini`, 'half', 112, row)
  })
  const crashRow = MOODS.length * 25
  draw(png, 'fx-crash', 'quad', 0, crashRow)
  draw(png, 'fx-crash-mini', 'quad', 50, crashRow)
  draw(png, 'fx-crash-mini', 'half', 68, crashRow)
  SLIME_STATES.forEach((state, k) => {
    const row = crashRow + 9 + k * SLIME_ROW
    const id = `${member}-slime-${state}`
    draw(png, id, 'half', 0, row)
    const mini = S.animOf(`${id}-mini`)
    // Each distinct frame of the mini, ten columns apart: what the cards and the strip blit in turn.
    for (let f = 0; mini !== undefined && f < Math.min(mini.frames.length, 8); f += 1) draw(png, `${id}-mini`, 'quad', 38 + f * 10, row, f)
  })
  const file = path.join(OUT, 'terminal', `${member}.png`)
  fs.writeFileSync(file, PNG.sync.write(png))
  console.log(`wrote ${file}`)
}
