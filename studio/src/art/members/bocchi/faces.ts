// Bocchi's faces: overlays laid over the head at (x, y) on stand (shifted by a
// pose's head offset elsewhere), `.` keeping the head's own pixel, `_` erasing
// it. ART-BRIEF.md "The faces" says what each shows.
//
// Over the eyes and the mouth (cols 42-57, rows 30-39), all eight in the
// reference's own colors and eye drawing (no colors of their own): the lid line
// n two pixels thick, iris E/e, pupil M, glints Q W L, skin s/S, mouth m, the
// jacket's pinks j/k for blush and an open mouth, the zipper's grey-blue y. The
// near eye is cols 43-48 (its outer corner, the drooping lash, at 43-44), the
// far eye cols 53-55 (its outer edge on the face outline, col 55). The closed
// mouth is the chin line on row 39 (cols 46-49): melt's open mouth sits on
// rows 37-38 above it, happy's U and panic's wave use rows 38-39.
//   half    a one-row slit: idle's lid moved down one row (its top row on
//           45-48,32, the outer corner drooping over 43-44,34 and 44,35, the
//           far lid's 2-over-3 taper ending in p at 55,32) and the iris
//           bottoms (row 35) under skin, so only row 34 of each iris shows
//   blink   a closed lid: a crescent on rows 34-35, the lash flick at 43,33
//   (every blink closes one way: idle shows the iris on rows 33-35, glance
//   and melt likewise or less, focus on 33-34, half on 34 only, blink none;
//   the lid's top row goes 31 -> 32 -> 34, the close speeding up)
//   glance  both irises slid to the viewer's left inside idle's own outline
//           (the drooping lash on 43-44,33 and 44,34 kept): the near iris one
//           column over (45-47), its white now on the nose side (Q over W at
//           48); the far iris stays on its nose side (col 53, as the
//           reference has it), its glint turned pale mint Q (54,33); the
//           mouth a pixel shorter
//   focus   narrowed: the lids slant down toward the nose (inner lid tops off
//           on row 31, the near lid over the inner iris on row 33), the outer
//           wing and lash kept, the iris bottoms (row 35) hidden under skin;
//           the mouth is idle's closed line, so the blink on the focused
//           mood's last bar (focus -> half -> blink -> half) moves only the eyes
//   happy   clean ^ ^ arcs (near apex 45-46,32, legs to 43,34 and 48,34; far
//           apex 53,32, legs 52,33 and 54,33), jacket-pink blush a row lower on
//           the cheeks (row 36), a small open U smile (row 38: corners 45 and
//           48, k at 46-47; row 39: lip 46-48)
//   panic   blank white eyes (the near white 4x3 at 45-48, the far one lifted
//           a row to 2x3 at 53-54), a one-pixel pupil in each (47,34 and
//           53,34, white above and below), the
//           lower corners rounded in lavender L, a band of the zipper's
//           grey-blue y on the skin under both eyes (row 36: the blue tint),
//           a ~ mouth in runs of two (46,39 -> 47-48,38 -> 49-50,39 -> 51,38)
//   melt    half lids two pixels thick at the inner end, sagging at both
//           outer corners in even steps (near 44,33 -> 43-44,34 -> 43,35;
//           far 53-55,33 -> 54-55,34 -> 55,35), dull mint glints in both eyes
//           (the far one under its lid at 54,35), a slack 'o' mouth (rows
//           37-38) over the chin

import type { FaceName, Overlay } from '../../types'

export const face: Overlay<FaceName> = {
  x: 42,
  y: 30,
  grids: {
    // Her resting look: the reference's own face region.
    idle: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhnnnnrrrsnnprh', // 31
      'rnnnnnnssssnnnrH', // 32
      'rnnQMLMSSSSnLnrr', // 33
      'rsnWEEESSSSEWnrr', // 34
      'rssseeSSSSSeWprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
    half: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rssnnnnssssnnprH', // 32
      'rnnnnnnSSSSnnnrr', // 33
      'rnnWEEESSSSEWnrr', // 34
      'rsnsssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
    blink: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rssssssssssssprH', // 32
      'rnsssssSSSSssprr', // 33
      'rsnnnnnSSSSnnnrr', // 34
      'rssnnnSSSSSsnprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
    glance: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhnnnnrrrsnnprh', // 31
      'rnnnnnnssssnnnrH', // 32
      'rnnMLMQSSSSnQnrr', // 33
      'rsnEEEWSSSSEWnrr', // 34
      'rsseesSSSSSeWprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmppprrrrrH', // 39
    ],
    focus: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhnnssrrrssnprh', // 31
      'rnnnnnnssssnnnrH', // 32
      'rnnQMnnSSSSnLnrr', // 33
      'rsnWEEESSSSEWnrr', // 34
      'rsssssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
    happy: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rssnnssssssnsprH', // 32
      'rsnssnsSSSnsnprr', // 33
      'rnssssnSSSSssprr', // 34
      'rsssssSSSSSssprr', // 35
      'hrsjjjsssssjjprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmkkmssSpprrrr', // 38
      'hhpJmmmppprrrrrH', // 39
    ],
    panic: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhnnnnrrrsnnprh', // 31
      'rnnnnnnssssnnnrH', // 32
      'rnnWWWWSSSSWWnrr', // 33
      'rsnWWMWSSSSMWnrr', // 34
      'rssLWWLSSSSWLprr', // 35
      'hrsyyyyssssyyprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmmssmpprrrr', // 38
      'hhpJmSSmmprrrrrH', // 39
    ],
    melt: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rsssnnnssssnnprH', // 32
      'rsnnnnnSSSSnnnrr', // 33
      'rnnQEEESSSSEnnrr', // 34
      'rnsseeSSSSSeQnrr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsmmssssSprrr', // 37
      'hhpmSkkssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
  },
}
