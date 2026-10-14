// The band as Aseprite source files, rebuilt from the studio in one command:
// for each member, out/aseprite/<member>.aseprite (96x96 rgb) and
// <member>-mini.aseprite (16x16): every mood's distinct frames in play order
// (scripts/raw.mjs writes them), each frame's duration, one forward tag per
// mood. From each file, a rows spritesheet (<name>.png + <name>.json, one row
// per mood, the tags listed) and one GIF per mood in out/aseprite/gif/. Then
// every file is opened again and checked pixel for pixel against the frames.
//
//   npm run aseprite                       the four members
//   node scripts/aseprite.mjs ryo kita     some of them
//   node scripts/aseprite.mjs --keep       keep the frame PNGs in out/aseprite/.frames
//
// Aseprite: $ASEPRITE, else the local build at
// ~/builds/aseprite-release/bin/aseprite.exe, else `aseprite` on the PATH.

import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { PNG } from 'pngjs'
import { MEMBERS, MOODS, OUT, STUDIO, loadStudio } from './studio.mjs'

const run = promisify(execFile)
const VIEWS = [
  { view: 'full', suffix: '' },
  { view: 'mini', suffix: '-mini' },
]

const args = process.argv.slice(2)
const keep = args.includes('--keep')
const asked = args.filter(a => !a.startsWith('--'))
const unknown = asked.filter(m => !MEMBERS.includes(m) && m !== 'all')
if (unknown.length > 0 || args.some(a => a.startsWith('--') && a !== '--keep')) {
  console.error(`usage: node scripts/aseprite.mjs [${MEMBERS.join('|')}|all ...] [--keep]`)
  process.exit(2)
}
const members = asked.length === 0 || asked.includes('all') ? MEMBERS : MEMBERS.filter(m => asked.includes(m))

function findAseprite() {
  const candidates = [process.env.ASEPRITE, path.join(os.homedir(), 'builds', 'aseprite-release', 'bin', process.platform === 'win32' ? 'aseprite.exe' : 'aseprite')]
  return candidates.find(c => c && fs.existsSync(c)) ?? 'aseprite'
}
const ASEPRITE = findAseprite()

async function aseprite(argv) {
  try {
    const { stdout, stderr } = await run(ASEPRITE, ['-b', ...argv], { maxBuffer: 64 * 1024 * 1024 })
    const text = `${stdout}${stderr}`
    if (/\bFAIL\b|error/i.test(text)) throw new Error(text)
    return text
  } catch (e) {
    throw new Error(`aseprite ${argv.join(' ')} failed:\n${e.stdout ?? ''}${e.stderr ?? ''}${e.message}`)
  }
}

/** Runs the jobs, `limit` at a time. */
async function pool(jobs, limit) {
  const results = []
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const i = next
      next += 1
      results[i] = await jobs[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker))
  return results
}

const DIR = path.join(OUT, 'aseprite')
const GIFS = path.join(DIR, 'gif')
const STAGE = path.join(DIR, '.frames')
fs.rmSync(STAGE, { recursive: true, force: true })
fs.mkdirSync(GIFS, { recursive: true })

// 1. Every mood's frames as 1x PNGs, through raw.mjs (the studio's own export).
const RAW = path.join(STUDIO, 'scripts', 'raw.mjs')
const jobs = []
for (const member of members)
  for (const { view } of VIEWS)
    for (const mood of MOODS) {
      const dir = path.join(STAGE, member, view)
      jobs.push(async () => {
        await run(process.execPath, [RAW, member, `mood:${mood}`, view, '--out', dir], { cwd: STUDIO })
        const suffix = view === 'full' ? '' : `-${view}`
        return { member, view, mood, list: JSON.parse(fs.readFileSync(path.join(dir, `${member}-${mood}${suffix}.frames.json`), 'utf8')) }
      })
    }
const raws = await pool(jobs, Math.max(2, Math.min(8, os.cpus().length)))
console.log(`raw.mjs wrote ${raws.reduce((n, r) => n + r.list.length, 0)} frames`)

// 2. The manifest: frames in play order (a run of identical frames, as a mini
// can have where only the full figure moved, becomes one frame holding them
// all), the tags, the palette in the member's own order.
const S = await loadStudio()
const hex = (d, i) => `#${[d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')}`
const sprites = []
for (const member of members)
  for (const { view, suffix } of VIEWS) {
    const name = `${member}${suffix}`
    const frames = []
    const tags = []
    const used = new Set()
    let size = null
    for (const mood of MOODS) {
      const { list } = raws.find(r => r.member === member && r.view === view && r.mood === mood)
      const from = frames.length + 1
      let last = null
      for (const { file, ms } of list) {
        const png = PNG.sync.read(fs.readFileSync(file))
        size ??= { width: png.width, height: png.height }
        if (png.width !== size.width || png.height !== size.height) throw new Error(`${file} is ${png.width}x${png.height}`)
        for (let i = 0; i < png.data.length; i += 4) if (png.data[i + 3] !== 0) used.add(hex(png.data, i))
        if (last !== null && frames.length >= from && png.data.equals(last)) frames[frames.length - 1].ms += ms
        else frames.push({ file: file.replace(/\\/g, '/'), ms })
        last = png.data
      }
      tags.push({ name: mood, from, to: frames.length })
    }
    const own = [...new Set(Object.values(S.ART[member].palette).map(c => c.toLowerCase()))].filter(c => used.has(c))
    const palette = [...own, ...[...used].filter(c => !own.includes(c))]
    const at = file => path.join(DIR, file).replace(/\\/g, '/')
    sprites.push({
      name,
      layer: member,
      ...size,
      frames,
      tags,
      palette,
      out: at(`${name}.aseprite`),
      sheet: { png: at(`${name}.png`), json: at(`${name}.json`) },
      gifs: tags.map(t => ({ tag: t.name, file: at(`gif/${name}-${t.name}.gif`) })),
    })
  }
const manifest = path.join(STAGE, 'manifest.json')
fs.writeFileSync(manifest, JSON.stringify({ sprites }, null, 1))

// 3. The .aseprite files (one Aseprite run builds them all).
const LUA = path.join(STUDIO, 'scripts', 'aseprite.lua')
const script = mode => ['--script-param', `manifest=${manifest}`, '--script-param', `mode=${mode}`, '--script', LUA]
process.stdout.write(await aseprite(script('build')))

// 4. The exports, from the saved files: a rows sheet with a row per mood, a GIF per mood.
await pool(
  sprites.flatMap(s => [
    () =>
      aseprite([s.out, '--sheet', s.sheet.png, '--data', s.sheet.json, '--sheet-type', 'rows', '--split-tags', '--list-tags', '--format', 'json-array', '--filename-format', '{title} {tag} {tagframe}']),
    () => aseprite([s.out, '--split-tags', '--save-as', path.join(GIFS, `${s.name}-{tag}.gif`)]),
  ]),
  4,
)

// 5. Everything opened again and checked against the frames.
process.stdout.write(await aseprite(script('verify')))
if (!keep) fs.rmSync(STAGE, { recursive: true, force: true })

const kb = file => `${(fs.statSync(file).size / 1024).toFixed(1)} KB`
console.log('\nout/aseprite:')
for (const s of sprites) {
  console.log(`  ${s.name}.aseprite  ${s.width}x${s.height} rgb, ${s.frames.length} frames, ${s.tags.length} tags (${s.tags.map(t => `${t.name} ${t.to - t.from + 1}`).join(', ')}), ${s.palette.length} colors, ${kb(s.out)}`)
  console.log(`  ${s.name}.png + .json  ${kb(s.sheet.png)} + ${kb(s.sheet.json)}`)
  console.log(`  gif/${s.name}-<mood>.gif  ${s.gifs.map(g => kb(g.file)).join(', ')}`)
}
