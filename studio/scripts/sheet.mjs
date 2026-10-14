// Renders a member's contact sheet (every pose, face and distinct frame) to
// out/sheets/sheet-<member>.png, to look at while drawing.
//
//   node scripts/sheet.mjs bocchi        one member
//   node scripts/sheet.mjs all           the four of them

import fs from 'node:fs'
import path from 'node:path'
import { renderStill } from '@remotion/renderer'
import { OUT, open } from './lib.mjs'

const MEMBERS = ['bocchi', 'nijika', 'ryo', 'kita']
const asked = process.argv.slice(2)
const members = asked.length === 0 || asked.includes('all') ? MEMBERS : asked.filter(m => MEMBERS.includes(m))
if (members.length === 0) {
  console.error(`usage: node scripts/sheet.mjs <${MEMBERS.join('|')}|all>`)
  process.exit(2)
}

const { serveUrl, browser, compositions } = await open()
const dir = path.join(OUT, 'sheets')
fs.mkdirSync(dir, { recursive: true })
try {
  for (const member of members) {
    const composition = compositions.find(c => c.id === `sheet-${member}`)
    if (!composition) throw new Error(`no composition sheet-${member}`)
    const output = path.join(dir, `sheet-${member}.png`)
    await renderStill({ composition, serveUrl, output, imageFormat: 'png', puppeteerInstance: browser, overwrite: true, logLevel: 'error' })
    console.log(`wrote ${output} (${composition.width}x${composition.height})`)
  }
} finally {
  await browser.close({ silent: true })
}
