// Exact pixels as transparent PNGs at 1x, for Aseprite (the pixel plugin's
// MCP imports them, suggests anti-aliasing on them, tags and exports them):
// one picture cell, or every distinct frame of a mood (numbered, with each
// frame's hold in milliseconds in a JSON beside them).
//
//   node scripts/raw.mjs <member> <cell> --out file.png          a pose, face, portrait:..., mini:..., ref or extra:<name>
//   node scripts/raw.mjs <member> mood:<mood> [full|portrait|mini] --out dir
//                                                              -> dir/<member>-<mood>[-view]-<nn>.png + frames.json

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import { MEMBERS, loadStudio } from './studio.mjs'
import { cellPixels, moodFrames, parseArgs, parseCell, withStand } from './tools.mjs'

const { positional, out, stand } = parseArgs(process.argv.slice(2), { scale: 1 })
const [member, spec, view = 'full'] = positional
if (!MEMBERS.includes(member) || spec === undefined || out === undefined) {
  console.error('usage: node scripts/raw.mjs <member> <cell> --out file.png  |  node scripts/raw.mjs <member> mood:<mood> [full|portrait|mini] --out dir')
  process.exit(2)
}
const S = await loadStudio()
const art = await withStand(S.ART[member], stand)

function write(px, file) {
  const h = px.length
  const w = px[0]?.length ?? 0
  const png = new PNG({ width: w, height: h })
  px.forEach((row, y) =>
    row.forEach((c, x) => {
      const i = (y * w + x) * 4
      if (c === null) return
      png.data[i] = parseInt(c.slice(1, 3), 16)
      png.data[i + 1] = parseInt(c.slice(3, 5), 16)
      png.data[i + 2] = parseInt(c.slice(5, 7), 16)
      png.data[i + 3] = 255
    }),
  )
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, PNG.sync.write(png))
  return `${w}x${h}`
}

const cell = parseCell(S, spec)
if (cell.kind === 'mood') {
  if (!['full', 'portrait', 'mini'].includes(view)) throw new Error(`view "${view}" is not full, portrait or mini`)
  const { frames } = moodFrames(S, art, cell.mood)
  const ms = Math.round(1000 / S.FPS)
  const suffix = view === 'full' ? '' : `-${view}`
  const list = frames.map((f, i) => {
    const file = path.join(out, `${member}-${cell.mood}${suffix}-${String(i + 1).padStart(2, '0')}.png`)
    write(f[view], file)
    return { file, ms: f.hold * ms }
  })
  fs.writeFileSync(path.join(out, `${member}-${cell.mood}${suffix}.frames.json`), JSON.stringify(list, null, 1))
  console.log(`wrote ${list.length} frames of ${member} ${cell.mood} (${view}) to ${out}`)
} else {
  console.log(`wrote ${out} (${write(cellPixels(S, art, cell), out)})`)
}
