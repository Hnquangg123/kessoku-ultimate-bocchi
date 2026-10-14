// Kita's mini: her head hand-drawn at 16x16 for the terminal (ART-BRIEF.md
// "The minis"). `stand` is the head every pose but the box shows, the faces
// laid over it; `box` is the head over the box's rim, the peeks laid over it.
// Coordinates are the mini's own (0-15); every overlay sits inside it.
//
// On Bocchi's mini face geometry (as Nijika's and Ryo's are), so the four
// minis line up, and registered like hers to the portrait window halved (mini
// col = (col - 34) / 2, row = (row - 16) / 2): the lid line on row 7, the
// irises on rows 8-9 (near cols 6-7, far col 10), the cheeks on rows 10-11,
// the mouth on row 12 (cols 6-7), the collar on row 13. Drawn from her
// polished stand: its crown, its pointed side tail, its lashes winging up and
// out.
//
// Drawn for the quadrants first: the terminal draws every mini (the head
// beside a card, the band strip) as 8x4 cells, each quadrant one column of two
// rows (the darker pixel winning), at most two colors a cell (the two
// commonest; every other quadrant takes the nearer). So the lids on row 7 pair
// with the bangs (a dark quadrant), each eye column is Q at its darkest (near
// W Q over Q e, far Q over W) so the eye cells read yellow-green over skin, the
// open smile b b on row 12 wins its pair over the neck, and the collar is w on
// rows 13-15 beside the bow. A jump or a crouch moves the mini a row, so the
// pairs fall on the other parity there: the faces are checked at both.
// - side tail (viewer's right, her accessory): a wing rising off the head's
//   top right from its tie v (12,4), level with the crown as the portrait's
//   (its tip on hi-res row 18, the crown's top): the base h (12,3 13,4), the
//   lit H edge up its top (13,3 14,2 to the pointed tip 14,1), the r underside
//   (15,3 14,4) and a second, lower lobe h (15,2). It hugs the crown so its
//   lower half survives a jump that lifts the mini off the top. No outline on
//   it: in quadrants it reads as a red wing on the background.
// - hair: the crown's outline p on row 1 (cols 4-8), the light H on its top
//   (5-6,2) and massed in a band on rows 4-5 (cols 5-11, light from the upper
//   right), parted by one strand r down col 7 (rows 4-5) as the portrait's
//   (col 48); the bangs h on row 6 split by strands r at 4,6 and 9,6, lit at
//   2,6 and 11,6. The near lock cols 0-4: lit H down cols 1-2 (rows 7-9), then
//   col 1 (row 10) and col 0 (rows 11-13) as it flips out past the edge, its
//   shadow r beside the face (col 4, rows 8-10, then col 3 down the jaw,
//   rows 11-13), its outline p down col 0 to row 10. The far lock r r under
//   the far eye (10-11), lit H on col 12, outline col 13, flipping out over the
//   shoulder on rows 11-14 (H 13-14,13, outline 15,13).
// - eyes: the near lid n n n (5-7,7) with its lash winging out at 4,7, the
//   outer corner n 5,8; the iris W Q over Q e (6-7, rows 8-9); a two-pixel
//   skin bridge (S, cols 8-9); the far eye one column wide (10: Q over W) under
//   its lid 10-11,7; a strand r between them (8,7).
// - mouth: the open smile b b on the chin (6-7,12) inside the jaw p (5,11-12,
//   9,11, 8,12).
// - collar and bow: the neck S S (6-7,13) in the sailor collar's V (w 5,13
//   8,13), the collar w on rows 14-15 (cols 4 and 9, then 4-5 and 8-9) round
//   the red bow: its loops R at 5,14 and 8,14 either side of the knot b b
//   (6-7,14), its tails R R under the knot (6-7,15); the camel cardigan j at
//   3,15 and 10,15.
// Faces overlay cols 0-11, rows 3-13 (the happy one reaches out to col 0 and
// up to row 3 for her peace sign; the rest keep to cols 4-11, rows 7-13). Each
// keeps the cells to two colors, so every face reads apart in quadrants:
//   idle (the head as drawn), half (the lid a row lower over the near eye's
//   outer half, n n 5-6,8, and over the far eye, 10,8, its iris's lower row Q
//   at 10,9: in quadrants the near eye goes dark), blink (closed lines n n
//   6-7,9 and 10,9, the lashes flicking up at 5,8 and 11,8, eyelid skin on rows
//   7-8, the wing gone back to the strand r at 4,7), glance (to the viewer's
//   left, at the crowd: the near iris pushed to the outer corner, Q 6,8 over
//   Q e 5-6,9, the white Z over W on the nose side, 7,8-9; the far iris Q over
//   e), focus (singing: a one-row slit Q Q under the lids, the lower lids
//   raised S S on row 9, the mouth open tall, m m 6-7,11 over the smile's b b),
//   happy (the "Kitan" wink: the near eye shut in a ^, apex 6,8, legs 5,9 7,9;
//   the far eye open, its glint W up over Q; blush B at 5-6,10 and 9,10; the
//   smile wide open, m R R m across the chin on row 12; and the peace sign by
//   her face, drawn so each finger keeps its own quadrant column: two fingers
//   s spread in a V with the hand's outline P between them (P P 1-2,4 over P
//   2,5), the near finger leaning out (tip 0,4, bending in through S s at
//   0-1,5), the far one straight and a pixel longer (3,3-5); the knuckles and
//   the fist S s s s on rows 6-7 over S S S s (shaded on its left and under,
//   away from the light), the camel sleeve J J j, J j, J (rows 9-11) running
//   down and out at the left edge; the near lock's shadow r down col 4 between
//   the hand and her cheek. In quadrants: S P P s over S S s s at rest (two
//   fingertips, the dark V between, the palm), s P p s over s s p s in the
//   crouch, the far tip and a notched palm (S s P s) in the jump), panic (a
//   stunned stare, on Bocchi's mini panic: blank whites W W over W W, the near
//   one edged n at 5,9, the far W W at col 10; the pupils M on row 10 at the
//   whites' nose side (7,10 and 9,10, as Bocchi's irises sit under her whites),
//   so in quadrants the near eye is a white cell with its pupil, W W over W M,
//   and the far one a white quadrant; the cool tint y under the outer corners,
//   6,10 and 10,10, as the hi-res face's band (no cyan to read as tears or to
//   merge with the flying sweat drops); a crooked mouth m S over S m), melt
//   (Bocchi's droop: the lids a row lower,
//   n n 6-7,8 and n 10,8, sagging to n at 5,9 and 11,9 over the dulled irises
//   Q E and E; eyelid skin S on row 7; the mouth slack, m m over b b).
// Peeks overlay cols 4-11, rows 7-9 on the box head: peekL (glance's eyes),
//   peekR (the near iris to the right, Z Q over W e, the far Q over Q),
//   peekBlink (blink's closed lines).
// The box: the head as stand down to the eyes, then the hands gripping the
//   rim at both edges as Bocchi's do (the top line P on row 9, the backs s on
//   rows 10-11, the fingers S s over the rim on rows 12-13, outlined P like
//   her stand's hands), the cheeks between them, the rim's outline o on row
//   12, the lit fold ^ on row 13, the cardboard ~ on rows 14-15 with its tape
//   (^, cols 8-9) and the cast shadow - under the fingers. The far flap stands
//   behind her far lock (cols 13-15, rows 4-8), under the side tail (the
//   tail's underside r over its top corner, 14,4).
// Colors of its own: the shared box ramp (the brief's cardboard), keyed on
// symbols as Ryo's and Nijika's minis key it, so no letter another part picks
// can clash; and the panic's under-eye y, Bocchi's own (faces.ts keys it the
// same); everything else is her palette.

import type { MiniArt, Palette } from '../../types'

export const colors: Palette = {
  '^': '#e2b778', // box light flap and top edge (shared)
  '~': '#c99a5b', // box cardboard (shared)
  '-': '#8f6a3a', // box shade (shared)
  y: '#c7d0e8', // panic: the cool band under the eyes (Bocchi's y, as faces.ts)
}

export const mini: MiniArt = {
  stand: [
    '................', // 0
    '....ppppp.....H.', // 1
    '...phHHhhpp...Hh', // 2
    '..phhhhhhhhphHhr', // 3
    '.phhhhhrhHHHvhr.', // 4
    'phhhhHHrHHHHp...', // 5
    'phHhrhhhhrhHp...', // 6
    'pHHhnnnnrsnnHp..', // 7
    'pHHhrnWQSSQrHp..', // 8
    'pHHhrsQeSSWrHp..', // 9
    'pHhhrssssSrrHp..', // 10
    'HhhrhpssSprrHHp.', // 11
    'HhhrhpbbprrhHHp.', // 12
    'HhhrpwSSwprhhHHp', // 13
    'hHhpwRbbRwprhHp.', // 14
    'hHpjwwRRwwjprpp.', // 15
  ],
  box: [
    '................', // 0
    '....ppppp.....H.', // 1
    '...phHHhhpp...Hh', // 2
    '..phhhhhhhhphHhr', // 3
    '.phhhhhrhHHHvhro', // 4
    'phhhhHHrHHHHp^^o', // 5
    'phHhrhhhhrhHp--^', // 6
    'pHHhnnnnrsnnHp--', // 7
    'pHHhrnWQSSQrHp--', // 8
    'PPPhrsQeSSWrHPPP', // 9
    'ssPhrssssSrrHPss', // 10
    'ssPrhssssSrrHPss', // 11
    'SsPooooooooooPSs', // 12
    'SsP^^^^^^^^^^PSs', // 13
    '--~~~~~~^^~~~~--', // 14
    '~~~~~~~~^^~~~~~~', // 15
  ],
  face: {
    x: 0,
    y: 3,
    grids: {
      idle: [
        '............', // 3
        '............', // 4
        '............', // 5
        '............', // 6
        '............', // 7
        '............', // 8
        '............', // 9
        '............', // 10
        '............', // 11
        '............', // 12
        '............', // 13
      ],
      half: [
        '............', // 3
        '............', // 4
        '............', // 5
        '............', // 6
        '............', // 7
        '......n...n.', // 8
        '..........Q.', // 9
        '............', // 10
        '............', // 11
        '............', // 12
        '............', // 13
      ],
      blink: [
        '............', // 3
        '............', // 4
        '............', // 5
        '............', // 6
        '....rhss..sr', // 7
        '......ss..sn', // 8
        '......nn..n.', // 9
        '............', // 10
        '............', // 11
        '............', // 12
        '............', // 13
      ],
      glance: [
        '............', // 3
        '............', // 4
        '............', // 5
        '............', // 6
        '............', // 7
        '......QZ....', // 8
        '.....QeW..e.', // 9
        '............', // 10
        '............', // 11
        '............', // 12
        '............', // 13
      ],
      focus: [
        '............', // 3
        '............', // 4
        '............', // 5
        '............', // 6
        '............', // 7
        '......Q.....', // 8
        '......SS..S.', // 9
        '............', // 10
        '......mm....', // 11
        '............', // 12
        '............', // 13
      ],
      happy: [
        '...s........', // 3
        'sPPs........', // 4
        'SsPs........', // 5
        'Ssss........', // 6
        'Ssssrhss....', // 7
        'SSSs.sns..W.', // 8
        'JJj..nsn..Q.', // 9
        'Jj...BB..B..', // 10
        'J...........', // 11
        '.....mRRm...', // 12
        '............', // 13
      ],
      panic: [
        '............', // 3
        '............', // 4
        '............', // 5
        '............', // 6
        '............', // 7
        '.......W..W.', // 8
        '.....nWW....', // 9
        '......yM.My.', // 10
        '............', // 11
        '......mS....', // 12
        '.......m....', // 13
      ],
      melt: [
        '............', // 3
        '............', // 4
        '............', // 5
        '............', // 6
        '....rhSS..Sr', // 7
        '.....Snn..n.', // 8
        '.....n.E..En', // 9
        '............', // 10
        '............', // 11
        '......mm....', // 12
        '......bb....', // 13
      ],
    },
  },
  peek: {
    x: 4,
    y: 7,
    grids: {
      peekL: [
        '........', // 7
        '..QZ....', // 8
        '.QeW..e.', // 9
      ],
      peekR: [
        '........', // 7
        '..Z.....', // 8
        '..W...Q.', // 9
      ],
      peekBlink: [
        'rhss..sr', // 7
        '..ss..sn', // 8
        '..nn..n.', // 9
      ],
    },
  },
}
