// The quick check between edits, no render: compiles the art with esbuild and
// prints what `checkArt` finds wrong (palette keys, grids not 96x96, unknown
// characters, `_` outside a patch or an overlay, patches off the canvas, from
// cycles, a face region that differs between the poses, windows that miss the
// face or the peeking eyes, sway overlays that do not fit, a palette key two
// part files define with different colors, a mini rig not 16x16 or with
// overlays off it, a slime grid that does not fit the slime canvas below its
// top row, Bocchi's two slime faces not one body). Exit code 1 when anything
// is wrong.
//
//   node scripts/check.mjs [member...]

import { MEMBERS, loadStudio } from './studio.mjs'

const asked = process.argv.slice(2).filter(m => MEMBERS.includes(m))
const members = asked.length > 0 ? asked : MEMBERS

const S = await loadStudio()
let bad = 0
for (const id of members) {
  const art = S.ART[id]
  const problems = S.checkArt(art)
  const colors = Object.keys(art.palette).length
  const patched = S.POSES.filter(p => S.isPatched(art.poses[p])).length
  const slime = art.slime === undefined ? 'no slime' : `a slime (${art.slime.awake === undefined ? 'one face' : 'two faces'})`
  const summary = `${colors} colors, ${S.POSES.length - patched} grid poses, ${patched} patched, ${art.mini ? 'a mini rig' : 'no mini rig (the portrait halved)'}, ${slime}`
  if (problems.length === 0) {
    console.log(`${id}: ok (${summary})`)
    continue
  }
  bad += problems.length
  console.log(`${id}: ${problems.length} problem${problems.length === 1 ? '' : 's'} (${summary})`)
  for (const p of problems) console.log(`  - ${p}`)
}
process.exit(bad > 0 ? 1 : 0)
