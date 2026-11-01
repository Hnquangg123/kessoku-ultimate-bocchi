// Contact sheets of the band at the hotpot table (MemberArt.feast), to judge
// the seated art without a browser:
//
//   out/feast/seats.png   every seat pose of each member with stand's idle face, the feast window (96x64) at
//                         4x on the checker, her waist marked beside it (the pixel the mod lays on the table's
//                         edge), each tip named under it
//   out/feast/faces.png   each feast face beside the face it comes from, on the portrait window over seat, at 6x
//   out/feast/loops.png   every feast loop's distinct frames (where each starts, how long it holds) and the
//                         headband still, 96x64 at 2x
//   out/feast/table.png   the four seated as the mod's scene places them (288x184 at 3x): a plain table and a
//                         plain pot, each figure clipped by the table nearer than her waist, painted Bocchi,
//                         Ryo, the pot, Nijika, Kita; four panels (eating, reacting, the props, the cold), then
//                         the same at 1x and 2x
//
//   node scripts/feast.mjs [seats|faces|table|loops|all] [--out <dir>] [--with <module.mjs>]
//
// --with  a module exporting `overlay(ART, S)` that returns the band with candidate art laid over it, for
// previewing drafts without wiring them in.

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { OUT, loadStudio } from './studio.mjs'
import { canvas, drawPixels, drawText, fillRect, save } from './png.mjs'

const args = process.argv.slice(2)
const opt = name => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const what = args.find(a => !a.startsWith('--') && a !== opt('--out') && a !== opt('--with')) ?? 'all'
const outDir = path.resolve(opt('--out') ?? path.join(OUT, 'feast'))
const S = await loadStudio()
let ART = S.ART
if (opt('--with')) ART = await (await import(pathToFileURL(path.resolve(opt('--with'))).href)).overlay(S.ART, S)

const MEMBERS = ['bocchi', 'nijika', 'ryo', 'kita']
const TITLE = '#f7a8c9'
const MUTED = '#8a8392'
const label = t => t.toUpperCase().replace(/[^A-Z0-9!:+.,/() -]/g, ' ')

/** A member drawn at the table: a seat pose (or the box), a face (a face overlay or a feast face), effects centred on points, the headband. */
function seated(art, pose, face, { fx = [], headband = false } = {}) {
  const px = S.stamp(S.blank(), S.resolvePose(art, pose), art.palette, 0, 0)
  if (face && pose !== 'box') {
    const grid = art.face.grids[face] ?? art.feast?.faces[face]
    if (grid) S.stamp(px, grid, art.palette, art.face.x, art.face.y)
  }
  if (headband && art.feast?.headband) S.stamp(px, art.feast.headband.grid, art.palette, art.feast.headband.x, art.feast.headband.y)
  for (const f of fx) {
    const { fw, fh } = S.fxSize(f.kind)
    // centred on its point, or (`corner`) its top-left there, as a timeline keys an `on: 'body'` effect
    if (f.corner) S.stampFx(px, f.kind, f.x, f.y, f.color)
    else S.stampFx(px, f.kind, f.x - Math.floor(fw / 2), f.y - Math.floor(fh / 2), f.color)
  }
  return px
}

const feastCrop = px => S.crop(px, 0, S.FEAST_Y, S.W, S.FEAST_H)

// ---- seats.png -----------------------------------------------------------------------------------------------

function seatsSheet() {
  const N = 4
  const cw = S.W * N
  const ch = S.FEAST_H * N
  const GAP = 28
  const M = 24
  const rows = MEMBERS.filter(m => ART[m].feast).map(m => ({ m, art: ART[m], poses: S.SEAT_POSES.filter(p => ART[m].feast.poses[p]) }))
  const cols = Math.max(...rows.map(r => r.poses.length))
  const rowH = 20 + ch + 30
  const png = canvas(M * 2 + cols * (cw + GAP) - GAP, M * 2 + 30 + rows.length * (rowH + GAP))
  drawText(png, S.FONT, label('the band at the table: every seat pose, stand idle face, feast window 96x64 at 4x'), M, M, TITLE, 3)
  rows.forEach(({ art, poses }, ri) => {
    const y0 = M + 30 + ri * (rowH + GAP)
    const f = art.feast
    poses.forEach((pose, ci) => {
      const x0 = M + ci * (cw + GAP)
      drawText(png, S.FONT, label(`${art.name} ${pose}`), x0, y0, art.accent, 2)
      drawPixels(png, feastCrop(seated(art, pose, 'idle')), x0, y0 + 20, N)
      // her waist: a notch beside the cell on her outer side, at the waist row
      const wy = y0 + 20 + (f.waist.y - S.FEAST_Y) * N
      const wx = x0 + f.waist.x * N
      if (f.side === 'left') fillRect(png, wx - 10, wy, 8, N, '#7ee0a0')
      else fillRect(png, wx + N + 2, wy, 8, N, '#7ee0a0')
      const tip = art.tips?.[pose]
      const note = `waist ${f.waist.x},${f.waist.y}${tip ? `  tip ${tip.x},${tip.y}` : ''}`
      drawText(png, S.FONT, label(note), x0, y0 + 20 + ch + 8, MUTED, 2)
    })
  })
  return png
}

// ---- faces.png -----------------------------------------------------------------------------------------------

function facesSheet() {
  const N = 6
  const cw = S.PW * N
  const GAP = 12
  const PAIR = 40
  const M = 24
  const pairs = [['idle', 'idlePot'], ['half', 'halfPot'], ['focus', 'focusPot'], ['idle', 'bite'], ['happy', null]]
  const rows = MEMBERS.filter(m => ART[m].feast)
  const pairW = 2 * cw + GAP
  const rowH = 20 + cw
  const png = canvas(M * 2 + pairs.length * (pairW + PAIR) - PAIR, M * 2 + 30 + rows.length * (rowH + 28))
  drawText(png, S.FONT, label('feast faces beside the faces they come from (portrait window over seat, 6x)'), M, M, TITLE, 3)
  rows.forEach((m, ri) => {
    const art = ART[m]
    const base = art.feast.poses.seat ? 'seat' : 'stand'
    const y0 = M + 30 + ri * (rowH + 28)
    pairs.forEach(([from, to], pi) => {
      const x0 = M + pi * (pairW + PAIR)
      for (const [k, face] of [[0, from], [1, to]]) {
        if (!face) continue
        const x = x0 + k * (cw + GAP)
        drawText(png, S.FONT, label(`${art.name} ${face}`), x, y0, k === 1 ? art.accent : MUTED, 2)
        drawPixels(png, S.crop(seated(art, base, face), art.head.x, art.head.y), x, y0 + 20, N)
      }
    })
  })
  return png
}

// ---- table.png -----------------------------------------------------------------------------------------------

const SW = 288
const SH = 184
const TABLE = { farY: 96, farL: 84, farR: 204, nearY: 176, slope: 0.36 }
const edgeL = y => TABLE.farL - TABLE.slope * (y - TABLE.farY)
const edgeR = y => TABLE.farR + TABLE.slope * (y - TABLE.farY)
/** Her waist row in the scene: the far two at 112, the near two at 150. */
const WAIST_Y = { bocchi: 112, ryo: 112, nijika: 150, kita: 150 }
const onTable = (x, y) => y >= TABLE.farY && y <= TABLE.nearY && x >= edgeL(y) && x <= edgeR(y)

/** Where her canvas lands: her waist's outer end a pixel inside the table's side edge at her row. */
function seatOffset(m, art) {
  const Y = WAIST_Y[m]
  const f = art.feast
  const ex = f.side === 'left' ? Math.round(edgeL(Y)) + 1 : Math.round(edgeR(Y)) - 1
  return { ox: ex - f.waist.x, oy: Y - f.waist.y, Y }
}

function scenePixels() {
  return Array.from({ length: SH }, (_, y) => Array.from({ length: SW }, () => (y < 70 ? '#3a2a22' : y < 72 ? '#2a1d17' : (Math.floor(y / 20) + Math.floor(SW / 64)) % 2 ? '#5f5a38' : '#66603c')))
}
const put = (sc, x, y, c) => {
  if (x >= 0 && y >= 0 && x < SW && y < SH && c) sc[y][x] = c
}
function ellipse(sc, cx, cy, rx, ry, fill, line) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const u = (x + 0.5 - cx) / rx
      const v = (y + 0.5 - cy) / ry
      const d = u * u + v * v
      if (d > 1) continue
      const ue = (x + 0.5 - cx) / (rx - 1)
      const ve = (y + 0.5 - cy) / (ry - 1)
      put(sc, x, y, line && ue * ue + ve * ve > 1 ? line : fill)
    }
}
function drawTable(sc) {
  for (let y = TABLE.farY; y <= TABLE.nearY + 8; y += 1)
    for (let x = 0; x < SW; x += 1) {
      const yy = Math.min(y, TABLE.nearY) + 0.5
      if (x + 0.5 < edgeL(yy) || x + 0.5 > edgeR(yy)) continue
      const edge = x + 0.5 - edgeL(yy) < 1.2 || edgeR(yy) - x - 0.5 < 1.2 || y === TABLE.farY
      put(sc, x, y, y > TABLE.nearY ? '#3a2014' : edge ? '#2e1a10' : y % 22 === 0 ? '#6a3e26' : '#8a5a36')
    }
}
function drawPot(sc, food) {
  for (let y = 140; y <= 154; y += 1) for (let x = 116; x <= 172; x += 1) put(sc, x, y, y === 140 || y === 154 || x === 116 || x === 172 ? '#33373d' : y < 146 ? '#aab0b6' : '#80868c')
  for (let y = 124; y <= 144; y += 1) {
    const hw = 31.6 - (y - 124) * 0.4
    for (let x = Math.round(144 - hw); x <= Math.round(144 + hw); x += 1) put(sc, x, y, Math.abs(x - 144) > hw - 1 || y === 144 ? '#26170f' : y < 132 ? '#6a4535' : '#4e3227')
  }
  ellipse(sc, 144, 124, 31.6, 11.4, '#8a5e4a', '#26170f')
  ellipse(sc, 144, 124.5, 28.4, 9.8, '#4e3227', null)
  if (food) {
    ellipse(sc, 144, 125, 26, 8, '#cf8f34', null)
    for (const [x, y, c] of [[128, 123, '#ee9aa3'], [136, 121, '#8cc85a'], [146, 124, '#f6f1e2'], [154, 122, '#ee9aa3'], [160, 126, '#8cc85a'], [140, 128, '#f6f1e2'], [133, 127, '#ee9aa3']])
      for (let k = 0; k < 6; k += 1) put(sc, x + (k % 3), y + Math.floor(k / 3), c)
  } else ellipse(sc, 144, 125, 26, 8, '#7a6a54', null)
}
function drawPlatter(sc) {
  ellipse(sc, 144, 163.5, 34, 9.5, '#f0ead8', '#5f82c4')
}

/** A member's figure laid on the scene, clipped by the table nearer than her waist; only the feast window's rows. */
function seat(sc, m, px) {
  const art = ART[m]
  const { ox, oy, Y } = seatOffset(m, art)
  for (let y = S.FEAST_Y; y < S.FEAST_Y + S.FEAST_H; y += 1)
    for (let x = 0; x < S.W; x += 1) {
      const c = px[y]?.[x]
      if (!c) continue
      const sx = x + ox
      const sy = y + oy
      if (sy >= Y + 1 && onTable(sx + 0.5, sy + 0.5)) continue
      put(sc, sx, sy, c)
    }
}

/** A seated member, her box raised 10 rows from where her seat's canvas lies (Bocchi's cold). */
function boxed(sc, m) {
  const art = ART[m]
  const px = seated(art, 'box', null)
  const box = S.stamp(S.blank(), art.peek.grids.peekL, art.palette, art.peek.x, art.peek.y)
  box.forEach((row, y) => row.forEach((c, x) => c && (px[y][x] = c)))
  const { ox, oy, Y } = seatOffset(m, art)
  for (let y = 0; y < S.H; y += 1)
    for (let x = 0; x < S.W; x += 1) {
      const c = px[y]?.[x]
      if (!c) continue
      const sx = x + ox
      const sy = y + oy - 10
      if (sy >= Y + 1 && onTable(sx + 0.5, sy + 0.5)) continue
      put(sc, sx, sy, c)
    }
}

/** A tip's point with food, as the timelines will key it. */
const tipFx = (art, pose, food) => {
  const t = art.tips?.[pose]
  return t && food ? [{ kind: 'morsel', x: t.x, y: t.y, color: S.MORSEL_COLORS[food] }] : []
}

function panel(cast, { food = true, cold = false } = {}) {
  const sc = scenePixels()
  drawTable(sc)
  const fig = m => {
    const c = cast[m]
    if (!c || !ART[m].feast) return null
    if (c.box) return 'box'
    const art = ART[m]
    return seated(art, c.pose, c.face, { fx: [...tipFx(art, c.pose, c.food), ...(c.fx ?? [])], headband: c.headband })
  }
  for (const m of ['bocchi', 'ryo']) {
    const f = fig(m)
    if (f === 'box') boxed(sc, m)
    else if (f) seat(sc, m, f)
  }
  drawPot(sc, food && !cold)
  for (const m of ['nijika', 'kita']) {
    const f = fig(m)
    if (f === 'box') boxed(sc, m)
    else if (f) seat(sc, m, f)
  }
  drawPlatter(sc)
  if (cold) for (let y = 0; y < SH; y += 1) for (let x = 0; x < SW; x += 1) sc[y][x] = mixHex(sc[y][x], '#1c2c5c', 0.35)
  return sc
}
function mixHex(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const [r1, g1, b1] = p(a)
  const [r2, g2, b2] = p(b)
  const m = (x, y) => Math.round(x + (y - x) * t)
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function tableSheet() {
  const has = m => ART[m].feast?.poses
  const pick = (m, pose, alt = 'seat') => (has(m)?.[pose] ? pose : alt)
  const flash = () => {
    const t = ART.kita.tips?.seatPhone
    return t ? [{ kind: 'flash', x: t.x, y: t.y, color: S.FLASH_COLOR }] : []
  }
  const weed = () => {
    const at = ART.ryo.feast?.weed
    return at ? [{ kind: 'weed', x: at.x, y: at.y, color: S.WEED_COLOR, corner: true }] : []
  }
  const panels = [
    ['eating: everyone in seatPot, eyes to the pot', {
      bocchi: { pose: pick('bocchi', 'seatPot'), face: 'idlePot', food: 'meat' },
      ryo: { pose: pick('ryo', 'seatPot'), face: 'halfPot', food: 'meat' },
      nijika: { pose: pick('nijika', 'seatPot'), face: 'focusPot', food: 'tofu' },
      kita: { pose: pick('kita', 'seatPot'), face: 'idlePot', food: 'veg' },
    }],
    ['reacting: bocchi seatPanic, the others seat with panic', {
      bocchi: { pose: pick('bocchi', 'seatPanic'), face: 'panic' },
      ryo: { pose: 'seat', face: 'panic' },
      nijika: { pose: 'seat', face: 'panic' },
      kita: { pose: 'seat', face: 'panic' },
    }],
    ['the props: ladle (headband), phone (flash), point, bowl', {
      bocchi: { pose: pick('bocchi', 'seatBowl'), face: 'idlePot', food: 'veg' },
      ryo: { pose: pick('ryo', 'seatPoint'), face: 'focus' },
      nijika: { pose: pick('nijika', 'seatLadle'), face: 'focusPot', headband: true },
      kita: { pose: pick('kita', 'seatPhone'), face: 'idlePot', fx: flash() },
    }],
    ['the cold: the box, the weed, the slumps', {
      bocchi: { box: true },
      ryo: { pose: 'seat', face: 'half', fx: weed() },
      nijika: { pose: pick('nijika', 'seatSlump'), face: 'melt', headband: true },
      kita: { pose: pick('kita', 'seatSlump'), face: 'melt' },
    }],
  ].map(([title, cast], i) => ({ title, sc: panel(cast, { cold: i === 3 }) }))
  const N = 3
  const M = 24
  const GAP = 24
  const pw = SW * N
  const ph = SH * N
  const png = canvas(M * 2 + 2 * pw + GAP, M * 2 + 30 + 2 * (20 + ph + GAP) + (20 + SH + GAP) + (20 + 2 * (SH * 2 + GAP)))
  drawText(png, S.FONT, label('the band at the table as the scene places them (288x184 at 3x)'), M, M, TITLE, 3)
  panels.forEach(({ title, sc }, i) => {
    const x0 = M + (i % 2) * (pw + GAP)
    const y0 = M + 30 + Math.floor(i / 2) * (20 + ph + GAP)
    drawText(png, S.FONT, label(title), x0, y0, MUTED, 2)
    drawPixels(png, sc, x0, y0 + 20, N, null)
  })
  // the same at 1x (in a row) and at 2x (two by two), the sizes the mod draws them near
  let y = M + 30 + 2 * (20 + ph + GAP)
  drawText(png, S.FONT, label('at 1x'), M, y, MUTED, 2)
  panels.forEach(({ sc }, i) => drawPixels(png, sc, M + i * (SW + GAP), y + 20, 1, null))
  y += 20 + SH + GAP
  drawText(png, S.FONT, label('at 2x'), M, y, MUTED, 2)
  panels.forEach(({ sc }, i) => drawPixels(png, sc, M + (i % 2) * (SW * 2 + GAP), y + 20 + Math.floor(i / 2) * (SH * 2 + GAP), 2, null))
  return png
}

// ---- loops.png -----------------------------------------------------------------------------------------------

/** Every feast loop's distinct frames, a row a loop (where each starts and how long it holds), and the headband still, at 2x. */
function loopsSheet() {
  const N = 2
  const M = 24
  const GAP = 10
  const cw = S.W * N
  const ch = S.FEAST_H * N
  const keyOf = px => px.map(r => r.map(c => c ?? '.').join(',')).join('|')
  const rows = []
  for (const m of MEMBERS) {
    const art = ART[m]
    if (!art.feast) continue
    for (const state of S.FEAST_STATES_OF[m]) {
      const total = S.feastFramesOf(art, state)
      const frames = []
      let last = null
      for (let f = 0; f < total; f += 1) {
        const px = S.drawFeast(art, state, f)
        const key = keyOf(px)
        if (key === last) frames[frames.length - 1].hold += 1
        else frames.push({ start: f, hold: 1, px })
        last = key
      }
      rows.push({ title: `${m}-feast-${state}: ${total} frames, ${total * 100}ms, ${frames.length} distinct`, frames, accent: art.accent })
    }
  }
  if (ART.nijika.feast?.headband) rows.push({ title: 'nijika-feast-headband: a still', frames: [{ start: 0, hold: 1, px: S.drawFeastHeadband(ART.nijika) }], accent: ART.nijika.accent })
  const cols = Math.max(...rows.map(r => r.frames.length))
  const rowH = 20 + 16 + ch + 14
  const png = canvas(M * 2 + cols * (cw + GAP) - GAP, M * 2 + 30 + rows.length * rowH)
  drawText(png, S.FONT, label('the feast loops: every distinct frame (where it starts, how long it holds), 96x64 at 2x'), M, M, TITLE, 3)
  rows.forEach((r, ri) => {
    const y0 = M + 30 + ri * rowH
    drawText(png, S.FONT, label(r.title), M, y0, r.accent, 2)
    r.frames.forEach((f, i) => {
      const x = M + i * (cw + GAP)
      drawText(png, S.FONT, label(`f${f.start} ${f.hold * 100}ms`), x, y0 + 18, MUTED, 2)
      drawPixels(png, f.px, x, y0 + 36, N)
    })
  })
  return png
}

const jobs = { seats: seatsSheet, faces: facesSheet, table: tableSheet, loops: loopsSheet }
for (const [name, job] of Object.entries(jobs)) {
  if (what !== 'all' && what !== name) continue
  const file = path.join(outDir, `${name}.png`)
  const png = job()
  save(png, file)
  console.log(`wrote ${file} (${png.width}x${png.height})`)
}
if (what !== 'all' && !(what in jobs)) {
  console.error(`usage: node scripts/feast.mjs [seats|faces|table|all] [--out <dir>] [--with <module.mjs>] (not "${what}")`)
  process.exit(2)
}
