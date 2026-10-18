// Nijika Ijichi, drums: sunny golden-blonde hair with the flat triangular ahoge
// ("the Dorito") and one long side ponytail high on the viewer's right (a
// hair-yellow scrunchie); red-orange eyes and a toothy grin; a white shirt, a
// dark grey V-neck sweater vest, a big red polka-dot bow, navy pleats, bare
// legs, white short socks, red sneakers; light wooden drumsticks crossed low.
// reference/character-notes.md has her colors and cues.
//
// v2: her stand (stand.ts) and palette (palette.ts) are drawn at the
// reference's density on REF_STAND's body: the Dorito, a solid corn-chip
// triangle leaning left (cap 42-44,13, base cols 45-50 on row 18), the head
// and hair rows 13-43, the small bumpy scrunchie at cols 56-60 rows 17-22
// with the tail springing out of it (root 61-65 rows 18-21), swelling to col
// 68 and tapering behind the far shoulder to its tips (62,59 and the flick
// 67,56); the eyes on Bocchi's rows and columns (lid row 31, near eye cols
// 42-48, far eye 53-56), the grin rows 37-38, the chin row 39; the vest's
// shoulders out to the armholes (cols 40-42 and 55-57, rows 43-47); the far
// sleeve foreshortened (outer edge 60 on rows 45-47, 58 from row 49); the
// fists at cols 41-45 rows 54-59 and 50-54 rows 55-60, closed over the
// light-wood sticks that cross at 48,63-64 (tips 53,68 and 43,69); REF_STAND's
// legs (the near calf its exact silhouette); the knees (bend) row 72, the
// soles row 93. So her face box is Bocchi's: 16x10 at 42,30.
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

export const nijika: MemberArt = {
  id: 'nijika',
  name: 'Nijika',
  accent: '#ffd166',
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
  tips: play.tips,
}
