// The quick check between edits, no render: compiles the art with esbuild and
// prints what `checkArt` finds wrong (palette keys, grids not 96x96, unknown
// characters, `_` outside a patch or an overlay, patches off the canvas, from
// cycles, a face region that differs between the poses, windows that miss the
// face or the peeking eyes, sway overlays that do not fit, a palette key two
// part files define with different colors, a mini rig not 16x16 or with
// overlays off it, a slime grid that does not fit the slime canvas below its
// top row, Bocchi's two slime faces not one body; at the hotpot table, a seat
// pose missing or off stand's face region, past the feast window, its waist
// row not ending at `waist` or more than hair below it, a pot-look face moving
// more than the eyes or an iris away from the pot, a tip missing or off the
// window, the headband over pixels the seat poses do not share). Then, for the
// band: the feast's loops (each lays out, each state one length for all who
// loop it, `cold` and `serve` aside) and every color the sprites paint with
// (the members', the effects' and their highlights, the feast's food, flash and
// weed) counted against the generated file's alphabet (scripts/alphabet.mjs).
// Exit code 1 when anything is wrong.
//
//   node scripts/check.mjs [member...]

import { ALPHABET } from './alphabet.mjs'
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
  const seats = art.feast === undefined ? 'no seat' : `${S.SEAT_POSES.filter(p => art.feast.poses[p]).length} seat poses${art.feast.headband ? ' and a headband' : ''}`
  const summary = `${colors} colors, ${S.POSES.length - patched} grid poses, ${patched} patched, ${seats}, ${art.mini ? 'a mini rig' : 'no mini rig (the portrait halved)'}, ${slime}`
  if (problems.length === 0) {
    console.log(`${id}: ok (${summary})`)
    continue
  }
  bad += problems.length
  console.log(`${id}: ${problems.length} problem${problems.length === 1 ? '' : 's'} (${summary})`)
  for (const p of problems) console.log(`  - ${p}`)
}

// The band: the feast's loops, and the palette against the alphabet.
const loops = S.checkFeastTimelines(S.ART)
const lengths = MEMBERS.map(id => `${id} ${S.FEAST_STATES_OF[id].map(state => `${state} ${(() => { try { return S.feastFramesOf(S.ART[id], state) } catch { return '?' } })()}`).join(', ')}`)
if (loops.length === 0) console.log(`feast: ok (${lengths.join('; ')})`)
else {
  bad += loops.length
  console.log(`feast: ${loops.length} problem${loops.length === 1 ? '' : 's'}`)
  for (const p of loops) console.log(`  - ${p}`)
}
const colors = S.allColors().length
if (colors <= ALPHABET.length) console.log(`palette: ok (${colors} of the alphabet's ${ALPHABET.length} colors)`)
else {
  bad += 1
  console.log(`palette: ${colors} colors, more than the alphabet's ${ALPHABET.length} (scripts/alphabet.mjs): the export would fail`)
}
process.exit(bad > 0 ? 1 : 0)
