// Prints a resolved grid with row and column rulers, so an artist can edit by
// coordinates: a pose as its patches resolve it, or a face, a peek or a sway
// laid over the pose it belongs to, or an extra. Every 5th column is marked
// `|` on the ruler and every 5th row `+` beside its number; the palette
// characters the window uses are listed under it.
//
//   node scripts/grid.mjs <member> <pose> [x y w h]        a pose (stand, playA, ..., box), whole canvas by default
//   node scripts/grid.mjs <member> face:<name> [x y w h]   stand with that face (the portrait window by default)
//   node scripts/grid.mjs <member> peek:<name> [x y w h]   the box with those eyes (the box's window by default)
//   node scripts/grid.mjs <member> sway:L|R [x y w h]      stand with the hair swayed (around the overlay by default)
//   node scripts/grid.mjs <member> extra:<name>            an extra (Bocchi's guitarFlat, guitarTilt)
//   node scripts/grid.mjs <member> mini:<stand|box>[+<face|peek>]   the 16x16 mini rig's head, with a face or a peek
//
// Options: --stand <module.ts> lays a stand candidate (a module exporting { palette, stand }) over the member
// for this run; --out <file.txt> writes the print to a file as well.

import fs from 'node:fs'
import path from 'node:path'
import { MEMBERS, loadStudio } from './studio.mjs'
import { FACES, PEEKS, parseArgs, withStand } from './tools.mjs'

const { positional, out, stand: standFile } = parseArgs(process.argv.slice(2))
const [member, what = 'stand', ...rest] = positional
if (!MEMBERS.includes(member)) {
  console.error('usage: node scripts/grid.mjs <member> <pose|face:name|peek:name|sway:L|sway:R|extra:name|mini:stand|box[+face|peek]> [x y w h] [--stand <module.ts>] [--out <file.txt>]')
  process.exit(2)
}
const S = await loadStudio()
const art = await withStand(S.ART[member], standFile)
const lines = []
const print = line => {
  lines.push(line)
  console.log(line)
}

/** Lays an overlay's characters over rows of characters: `.` keeps, `_` erases. */
function overlay(rows, grid, x, y) {
  const out = rows.map(r => [...r])
  grid.forEach((row, gy) =>
    [...row].forEach((ch, gx) => {
      const r = out[y + gy]
      if (ch === '.' || r === undefined || x + gx < 0 || x + gx >= r.length) return
      r[x + gx] = ch === '_' ? '.' : ch
    }),
  )
  return out.map(r => r.join(''))
}
const size = grid => ({ w: Math.max(0, ...grid.map(r => [...r].length)), h: grid.length })

let rows
let win
let title
const [kind, name] = what.includes(':') ? what.split(':') : ['pose', what]
if (kind === 'pose') {
  if (!S.POSES.includes(name)) throw new Error(`no pose "${name}" (${S.POSES.join(', ')})`)
  rows = S.resolvePose(art, name)
  win = { x: 0, y: 0, w: S.W, h: S.H }
  const off = S.headOffset(art, name)
  title = `${member} ${name}${off.dx || off.dy ? ` (head offset ${off.dx},${off.dy})` : ''}`
} else if (kind === 'face') {
  const grid = art.face.grids[name]
  if (!grid) throw new Error(`no face "${name}" (${Object.keys(art.face.grids).join(', ')})`)
  rows = overlay(S.resolvePose(art, 'stand'), grid, art.face.x, art.face.y)
  win = { x: art.head.x, y: art.head.y, w: S.PW, h: S.PH }
  const { w, h } = size(grid)
  title = `${member} stand + face ${name} (the overlay: ${w}x${h} at ${art.face.x},${art.face.y}; the window is the portrait)`
} else if (kind === 'peek') {
  const grid = art.peek.grids[name]
  if (!grid) throw new Error(`no peek "${name}" (${Object.keys(art.peek.grids).join(', ')})`)
  rows = overlay(S.resolvePose(art, 'box'), grid, art.peek.x, art.peek.y)
  win = { x: art.boxHead.x, y: art.boxHead.y, w: S.PW, h: S.PH }
  const { w, h } = size(grid)
  title = `${member} box + peek ${name} (the overlay: ${w}x${h} at ${art.peek.x},${art.peek.y})`
} else if (kind === 'sway') {
  const s = art.sway?.[name]
  if (!s) throw new Error(`no sway "${name}" (L, R)`)
  rows = overlay(S.resolvePose(art, 'stand'), s.grid, s.x, s.y)
  const { w, h } = size(s.grid)
  win = { x: s.x - 2, y: s.y - 2, w: w + 4, h: h + 4 }
  title = `${member} stand + sway ${name} (the overlay: ${w}x${h} at ${s.x},${s.y})`
} else if (kind === 'mini') {
  const mini = art.mini
  if (!mini) throw new Error(`${member} has no mini rig (her mini is the portrait halved)`)
  const [base, over] = name.split('+')
  if (base !== 'stand' && base !== 'box') throw new Error(`mini:${name}: the mini's heads are stand and box`)
  rows = base === 'box' ? mini.box : mini.stand
  let note = ''
  if (over !== undefined) {
    const ov = base === 'box' ? mini.peek : mini.face
    const names = base === 'box' ? PEEKS : FACES
    if (!names.includes(over)) throw new Error(`mini:${name}: "${over}" is not a ${base === 'box' ? 'peek' : 'face'} (${names.join(', ')})`)
    rows = overlay(rows, ov.grids[over], ov.x, ov.y)
    const { w, h } = size(ov.grids[over])
    note = ` + ${base === 'box' ? 'peek' : 'face'} ${over} (the overlay: ${w}x${h} at ${ov.x},${ov.y})`
  }
  win = { x: 0, y: 0, w: S.MINI, h: S.MINI }
  title = `${member} mini ${base}${note}`
} else if (kind === 'extra') {
  const grid = art.extras?.[name]
  if (!grid) throw new Error(`no extra "${name}" (${Object.keys(art.extras ?? {}).join(', ')})`)
  rows = grid
  win = { x: 0, y: 0, ...size(grid) }
  title = `${member} extra ${name}`
} else {
  throw new Error(`what to print: a pose, face:<name>, peek:<name>, sway:L|R, extra:<name> or mini:<stand|box>[+<face|peek>], not "${what}"`)
}
if (rest.length === 4) {
  const [x, y, w, h] = rest.map(Number)
  win = { x, y, w, h }
}

const x0 = Math.max(0, win.x)
const x1 = Math.min(Math.max(...rows.map(r => [...r].length)), win.x + win.w)
const y0 = Math.max(0, win.y)
const y1 = Math.min(rows.length, win.y + win.h)
const cols = Array.from({ length: Math.max(0, x1 - x0) }, (_, i) => x0 + i)
const pad = '     '
print(`${title}: cols ${x0}-${x1 - 1}, rows ${y0}-${y1 - 1}`)
print(pad + cols.map(x => (x % 10 === 0 || x === x0 ? String(Math.floor(x / 10) % 10) : ' ')).join(''))
print(pad + cols.map(x => String(x % 10)).join(''))
print(pad + cols.map(x => (x % 5 === 0 ? '|' : ' ')).join(''))
const used = new Set()
for (let y = y0; y < y1; y += 1) {
  const chars = [...(rows[y] ?? '')]
  const line = cols.map(x => chars[x] ?? '.').join('')
  for (const c of line) if (c !== '.') used.add(c)
  print(`${String(y).padStart(3)}${y % 5 === 0 ? '+' : ' '} ${line}`)
}
const legend = [...used].sort().map(c => `${c} ${art.palette[c] ?? '?'}`)
for (let i = 0; i < legend.length; i += 6) print(`  ${legend.slice(i, i + 6).join('   ')}`)
if (out) {
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `${lines.join('\n')}\n`)
  console.log(`wrote ${out}`)
}
