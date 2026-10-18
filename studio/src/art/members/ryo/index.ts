// Ryo Yamada, bass: a cobalt-blue bob, longer and flipped out on the viewer's
// left (two dark bar pins there), tucked behind the ear on the right; heavy-
// lidded lemon-yellow eyes, a mole under the far eye, deadpan; an oversized dark
// navy V-neck sweater over a white shirt and a string tie, navy pleats, black
// tights, brown loafers; an Olympic White P-bass with a mint guard, slung low
// and long, on a purple floral strap. reference/character-notes.md has her
// colors and cues.
//
// v2: her stand (stand.ts) and palette (palette.ts) are drawn at the
// reference's density on REF_STAND's body: the hair top row 18 (cols 42-51),
// the bob rows 18-46 from col 28 (the flip's tips) to col 59, tucked behind
// the far ear (cols 56-57 rows 33-36, a tuck line at col 58); the two bar pins
// at cols 35-39 rows 32-37 (bar 1 at rows 33-34, bar 2 at rows 36-37, a glint
// above each); the eyes on Bocchi's rows and columns (lids rows 31-32, near
// eye cols 46-48 rows 33-35 under a strand of the near lock down col 45, far
// eye 53-54), the mole at 53,36 under the far iris, the mouth row 39 (cols
// 46-49), the chin line at 44,37 and 45,38; the string-tie bow at cols 46-50
// rows 41-42, its ends to row 46; the plucking hand at cols 44-47 rows 53-56
// under the sweater cuff, one finger down to the strings at 46,57; the
// fretting hand at cols 64-68 rows 46-51, its fingers a row over the board;
// the bass body cols 23-50 rows 53-68 (its bottom outline on row 68, the
// skirt's corner below it on rows 67-69), the upper horn running right of the
// hand along the neck's rise at cols 47-54 rows 48-52 (its tip at 53,49, the
// strap's button at 48,50), the lower horn under the neck at cols 47-50 rows
// 58-62 (the cutaway's corner at 48,58), the neck rising 1 row in 3 to the
// nut at col 75 and the headstock to col 89 (keys stepping up to row 39, the
// tip bulging up at 87,41); the skirt cols 34-61 rows 62-69, its hem row 70,
// the knees (bend) row 72, the soles row 93. So her face box is Bocchi's:
// 16x10 at 42,30, and her portrait window Bocchi's: 32x32 at 34,16.
//
// Assembled here from her part files (one per pose or overlay set: see
// ../../parts.ts); each artist edits only her own part.

import { memberPalette } from '../../parts'
import type { MemberArt } from '../../types'
import * as box from './box'
import * as cheer from './cheer'
import * as crouch from './crouch'
import * as faces from './faces'
import * as mini from './mini'
import * as palette from './palette'
import * as panic from './panic'
import * as play from './play'
import * as slime from './slime'
import * as stand from './stand'
import * as sway from './sway'

const { palette: merged, colorSources } = memberPalette({ palette, stand, play, crouch, cheer, panic, box, faces, sway, mini, slime })

export const ryo: MemberArt = {
  id: 'ryo',
  name: 'Ryo',
  accent: '#8fb8ff',
  palette: merged,
  colorSources,
  poses: {
    stand: stand.stand,
    playA: play.playA,
    playB: play.playB,
    crouch: crouch.crouch,
    cheer: cheer.cheer,
    panic: panic.panic,
    box: box.box,
  },
  heads: { crouch: crouch.crouchHead },
  face: faces.face,
  peek: box.peek,
  sway: sway.sway,
  bend: stand.bend,
  head: stand.head,
  boxHead: box.boxHead,
  mini: mini.mini,
  slime: slime.slime,
}
