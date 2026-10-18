// What the desktop app draws: the mod's own SVG writer (../hooks/lib/sprite.ts)
// over the exported frames, animating by SMIL as the app's Svg element would.
// One page per member (every mood: the full figure at 2x, the portrait at 3x,
// the mini at 4x; every slime state: the slime at 4x, its mini at 6x), and an
// index with the strip, the strip's row of slimes, the guard screen and the
// minis, so no page grows large. Each cell shows its markup size, in red past
// the Svg element's limit (SVG_LIMIT).
//
//   node scripts/svg.mjs [--gen <sprites.gen.ts>] [member...]   -> out/svg/index.html, out/svg/<member>.html

import fs from 'node:fs'
import path from 'node:path'
import { MEMBERS, MOODS, OUT, SLIME_STATES } from './studio.mjs'
import { genArg, loadModSprites } from './mod.mjs'

const { gen, rest } = genArg(process.argv.slice(2))
const asked = rest.filter(m => MEMBERS.includes(m))
const members = asked.length > 0 ? asked : MEMBERS
const { S, ids } = await loadModSprites(gen)
const LIMIT = S.SVG_LIMIT ?? 131072
const has = id => ids.includes(id)
/** One sprite alone at its own size, `scale` CSS pixels a pixel. */
const one = (id, scale) => {
  const anim = S.animOf(id)
  return S.spritesSvg([{ id, x: 0, y: 0 }], anim.w, anim.h, scale)
}

const cell = (svg, label) => `<figure><div class="pic">${svg}</div><figcaption>${label} · <span class="${svg.length > LIMIT ? 'over' : ''}">${svg.length.toLocaleString()} chars</span></figcaption></figure>`
const page = (title, body) => `<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>body{background:#1b1b1f;color:#ece6ee;font:13px Consolas,monospace;margin:16px}a{color:#f7a8c9}h2{color:#f7a8c9;margin:14px 0 6px}.row{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}figure{margin:0;background:#26262c;padding:6px;border-radius:6px}figcaption{color:#8a8392;margin-top:4px}.over{color:#ff5d73}.pic{background:repeating-conic-gradient(#3a3a42 0% 25%,#2c2c33 0% 50%) 0 0/12px 12px;display:inline-block}</style>
<p><a href="index.html">index</a> · ${MEMBERS.map(m => `<a href="${m}.html">${m}</a>`).join(' · ')} · sprites from ${gen.replace(/\\/g, '/')}</p>
${body}`

const dir = path.join(OUT, 'svg')
fs.mkdirSync(dir, { recursive: true })
for (const member of members) {
  let body = `<h2>${member}</h2>`
  for (const mood of MOODS) {
    const full = `${member}-${mood}`
    body += `<div class="row">`
    if (has(full)) body += cell(S.spritesSvg([{ id: full, x: 0, y: 0 }], 96, 96, 2), `${mood}`)
    if (has(`${full}-portrait`)) body += cell(S.spritesSvg([{ id: `${full}-portrait`, x: 0, y: 0 }], 32, 32, 3), 'portrait')
    if (has(`${full}-mini`)) body += cell(S.spritesSvg([{ id: `${full}-mini`, x: 0, y: 0 }], 16, 16, 4), 'mini')
    body += '</div>'
  }
  body += `<h2>${member}'s slime</h2><div class="row">`
  for (const state of SLIME_STATES) {
    const slime = `${member}-slime-${state}`
    if (has(slime)) body += cell(one(slime, 4), `slime ${state}`)
    if (has(`${slime}-mini`)) body += cell(one(`${slime}-mini`, 6), 'mini')
  }
  body += '</div>'
  const file = path.join(dir, `${member}.html`)
  fs.writeFileSync(file, page(`${member}: the sprites as the desktop draws them`, body))
  console.log(`wrote ${file}`)
}
const strip = S.spritesSvg(MEMBERS.map((m, i) => ({ id: `${m}-focused-portrait`, x: i * 34, y: 0 })), 134, 32, 2)
const minis = S.spritesSvg(MEMBERS.map((m, i) => ({ id: `${m}-anxious-mini`, x: i * 18, y: 0 })), 70, 16, 3)
const blast = S.spritesSvg([{ id: 'bocchi-panic', x: 0, y: 0 }, { id: 'fx-crash', x: 70, y: 64 }], 166, 96, 2)
const crashMini = S.spritesSvg([{ id: 'fx-crash-mini', x: 0, y: 0 }], 48, 16, 3)
// The strip's row of slimes at its fullest: six acts, two pixels apart, in every state.
const ACTS = [['nijika', 'active'], ['ryo', 'active'], ['ryo', 'idle'], ['kita', 'asleep'], ['bocchi', 'active'], ['kita', 'idle']]
const slimeAt = (m, s) => `${m}-slime-${s}`
const sw = S.animOf(slimeAt('bocchi', 'active'))?.w ?? 36
const sh = S.animOf(slimeAt('bocchi', 'active'))?.h ?? 24
const slimes = S.spritesSvg(ACTS.filter(([m, s]) => has(slimeAt(m, s))).map(([m, s], i) => ({ id: slimeAt(m, s), x: i * (sw + 2), y: 0 })), ACTS.length * (sw + 2) - 2, sh, 2)
const body = `<h2>strip, guard screen, minis</h2><div class="row">${cell(strip, 'strip, focused portraits')}${cell(minis, 'anxious minis')}</div><div class="row">${cell(slimes, "the strip's slimes, six acts")}</div><div class="row">${cell(blast, 'blast radius')}${cell(crashMini, 'crash mini')}</div>`
const index = path.join(dir, 'index.html')
fs.writeFileSync(index, page('Kessoku sprites as the desktop draws them', body))
console.log(`wrote ${index}`)
