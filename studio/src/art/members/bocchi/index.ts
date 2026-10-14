// Bocchi (Hitori Gotoh), lead guitar: the face of the mod.
//
// Her stand IS the reference: reference/bocchi-reference.jpg read back to its
// grid (REF_STAND, soles on row 93) in its own 41 colors (REF_PALETTE). Very
// long pink hair flowing behind her past the waist, the ahoge, the blue and
// yellow cube clips on the viewer's left, blue eyes under heavy bangs, the
// pink track jacket with its white zipper and stripes, a dark grey-purple
// pleated skirt, dark socks, brown shoes, and her black Les Paul with gold
// binding held across the body, its neck rising to the upper right.
//
// Where things are on stand: the head and hair rows 18-40 (the ahoge out to
// col 27 at rows 26-28), the clips cols 36-41 rows 21-30, the eyes cols 43-55
// rows 31-35, the mouth and chin line rows 37-39; the face overlay 16x10 at
// 42,30; the portrait window 32x32 at 34,16 (34, not 33: on that parity the
// mini's 2x2 blocks keep both clips, both eyes and the mouth); the knees
// (bend) row 72.
//
// Everything but stand and the idle face is a PLACEHOLDER for now (the v2
// engine upgrade): the other poses are stand itself, the box is v1's upscaled
// 2x, the other faces and the sways are one transparent pixel, the guitars
// are v1's upscaled 2x. To be redrawn in the reference's hand: ART-BRIEF.md.
//
// Assembled here from her part files (one per pose or overlay set: see
// ../../parts.ts); each artist edits only her own part.

import { memberPalette } from '../../parts'
import type { MemberArt } from '../../types'
import * as box from './box'
import * as cheer from './cheer'
import * as crouch from './crouch'
import * as extras from './extras'
import * as faces from './faces'
import * as mini from './mini'
import * as palette from './palette'
import * as panic from './panic'
import * as play from './play'
import * as stand from './stand'
import * as sway from './sway'

const { palette: merged, colorSources } = memberPalette({ palette, stand, play, crouch, cheer, panic, box, faces, sway, mini, extras })

export const bocchi: MemberArt = {
  id: 'bocchi',
  name: 'Bocchi',
  accent: '#f7a8c9',
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
  extras: { guitarFlat: extras.guitarFlat, guitarTilt: extras.guitarTilt },
}
