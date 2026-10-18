// Writes the engine themes (../themes/<slug>.json) from the palette's token
// maps in ../hooks/lib/palette.ts, so the two never drift, or checks that the
// committed files still match (`--check`: exit code 1 when one differs or is
// missing). The files are written as the mod writes a copy to
// ~/.claude/themes: `{ name, base, overrides }`, two-space JSON, a newline at
// the end. No engine, no render: the palette is compiled with esbuild and read.
//
//   npm run themes              write themes/kessoku-bocchi.json and themes/kessoku-bocchi-light.json
//   npm run themes -- --check   compare them with the palette (npm run check runs this too)

import fs from 'node:fs'
import path from 'node:path'
import { STUDIO, loadTs, src } from './studio.mjs'

const P = await loadTs(`export * from ${src('..', 'hooks', 'lib', 'palette.ts')}`)
const THEMES = path.resolve(STUDIO, '..', 'themes')
const isCheck = process.argv.includes('--check')

/** What the engine reads, in the shape and spelling the mod's writeThemeCopy writes. */
const files = [
  { slug: P.THEME_SLUG, theme: { name: P.THEME_NAME, base: 'dark', overrides: P.THEME_OVERRIDES } },
  { slug: P.THEME_SLUG_LIGHT, theme: { name: P.THEME_NAME_LIGHT, base: 'light', overrides: P.THEME_OVERRIDES_LIGHT } },
]

let bad = 0
for (const { slug, theme } of files) {
  const file = path.join(THEMES, `${slug}.json`)
  const want = `${JSON.stringify(theme, null, 2)}\n`
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (!isCheck) {
    // The file keeps its own line endings (a Windows checkout has CRLF; git stores LF either way).
    fs.writeFileSync(file, raw !== null && raw.includes('\r\n') ? want.replace(/\n/g, '\r\n') : want)
    console.log(`wrote themes/${slug}.json (${Object.keys(theme.overrides).length} tokens)`)
    continue
  }
  // Line endings are git's; the tokens are what must match.
  const have = raw === null ? null : raw.replace(/\r\n/g, '\n')
  if (have === want) {
    console.log(`themes/${slug}.json: matches the palette`)
    continue
  }
  bad += 1
  if (have === null) {
    console.log(`themes/${slug}.json: missing (npm run themes writes it)`)
    continue
  }
  const theirs = JSON.parse(have)
  const drift = Object.keys({ ...theme.overrides, ...(theirs.overrides ?? {}) }).filter(k => theme.overrides[k] !== (theirs.overrides ?? {})[k])
  const head = ['name', 'base'].filter(k => theme[k] !== theirs[k])
  console.log(`themes/${slug}.json: differs from the palette (npm run themes rewrites it): ${[...head, ...drift].join(', ') || 'the spelling'}`)
}
process.exit(bad > 0 ? 1 : 0)
