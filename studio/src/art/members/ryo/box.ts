// Ryo hiding in the cardboard box: the same ripe-mango box as Bocchi's (box.ts in ../bocchi), her bob,
// her two bar pins and her eyes over the rim, her fingertips hooked over it out of her long sweater
// sleeves. `peek` lays the eyes over the box pose (`.` keeps, `_` erases); `boxHead` is the 32x32
// portrait window over it. In the hiding mood she dozes (peekBlink, z's rising), then wakes to a peekL.
//
// - The box is Bocchi's pixel for pixel (front face cols 35-73 rows 57-93, side face cols 25-34, both
//   flaps, the cut tape, the dents and the mango print), its cardboard under keys Ryo's palette leaves
//   free (`colors` below: O base, T light, C shade, V deep; the print in her loafer ramp f F D d,
//   which is the reference's).
// - The head is stand's rows 18-37 moved 4 right and 19 down, pixel for pixel (today's stand: the
//   strand of the near lock down col 49, rows 50-54, over the near eye's outer corner; the mole at
//   57,55 under the far iris): the hair top row 37 (cols 46-55), the bob cols 35-63, the bar pins
//   cols 39-42 rows 52-56 (both over the rim), the eyes rows 50-54 (lids 50-51; near iris cols 50-52,
//   far iris 57-58, its edge at col 59), the cheeks and the mole on row 55, the chin's top on row 56
//   just above the front rim (row 57). One row higher than Bocchi's head (she moves 20) so the second
//   pin clears the rim; boxHead (38,35) is stand's window (34,16) moved by the same (4,19), so the
//   head sits in the portrait exactly where it does on stand (the lids on window rows 15-16).
// - Behind the head, where Bocchi's wider hair and ahoge were: the box's inside (V) at 63,56 and
//   64,53-56, the rest of the back rim and the flaps as Bocchi's.
// - Her hands: Bocchi's fingers (skin s, S over the notches, plum p): the knuckles on the rim's row
//   (57), the tips on rows 58-59, the outline under each tip on row 60. Above them, instead of the
//   backs of her hands, her sweater cuffs (K outline, lit top k, j, shade J; rows 53-56): the near one
//   cols 32-37 (Bocchi's place, its tips at 33-34 and 36), the far one cols 65-70 (one column right of
//   Bocchi's, so its outline does not double the hair's at col 63; tips at 66 and 68).
//
// Built by the artist's scratch script (ryo-pb3: build-box.mjs, box-diff.mjs, emit-box.mjs) from
// Bocchi's box and Ryo's stand.

import type { Overlay, Palette, PeekName, PoseDef } from '../../types'

export const box: PoseDef = [
  '................................................................................................', // 0
  '................................................................................................', // 1
  '................................................................................................', // 2
  '................................................................................................', // 3
  '................................................................................................', // 4
  '................................................................................................', // 5
  '................................................................................................', // 6
  '................................................................................................', // 7
  '................................................................................................', // 8
  '................................................................................................', // 9
  '................................................................................................', // 10
  '................................................................................................', // 11
  '................................................................................................', // 12
  '................................................................................................', // 13
  '................................................................................................', // 14
  '................................................................................................', // 15
  '................................................................................................', // 16
  '................................................................................................', // 17
  '................................................................................................', // 18
  '................................................................................................', // 19
  '................................................................................................', // 20
  '................................................................................................', // 21
  '................................................................................................', // 22
  '................................................................................................', // 23
  '................................................................................................', // 24
  '................................................................................................', // 25
  '................................................................................................', // 26
  '................................................................................................', // 27
  '................................................................................................', // 28
  '................................................................................................', // 29
  '................................................................................................', // 30
  '................................................................................................', // 31
  '................................................................................................', // 32
  '................................................................................................', // 33
  '................................................................................................', // 34
  '................................................................................................', // 35
  '................................................................................................', // 36
  '..............................................NNNNNNNNNN........................................', // 37
  '...........................................NNNhhHHHHHHhhNNN.....................................', // 38
  '.........................................NNhhhhHHHHHHHHhhhhN....................................', // 39
  '........................................NhhhhhhhHHHHUUUUUhhhN...................................', // 40
  '.......................................NhhhrhhhHHrUUHHHrHUUUhN..................................', // 41
  '......................................NhhhrhHHHHrHHHHHrHHUUHhN..................................', // 42
  '......................................NhhrhhhHHrHHHHHrhHHHHHhhN.................................', // 43
  '.....................................NhhrhhhhhrHHhhHrhhHHrhHHhN.................................', // 44
  '.....................................NhrhhHhhhrhHHhHrhhHHrhHHhN.................................', // 45
  '.....................................NhrhhHhhhrhHHHHrhHHhrhHHhN...oo............................', // 46
  '....................................NhhrhHHhhrrhhHHHrhHHhrhhHhN...oToo..........................', // 47
  '....................................NhhrhHHhhrhhhhHHrhhHrrhhHHhN.oCCTToo........................', // 48
  '....................................NhhrhHHhhrhhhhhhrrhhrrhhHHhN.oCCCCTToo......................', // 49
  '....................................NhhrhHHhhrhhhrnnnrhrsnnphHhNCCCCCCCCTToo....................', // 50
  '....................................NhhrhHHthrrhhrnnnssssnnnhHhNCCCCCCCCCCTTo...................', // 51
  '........................oooooooooooNhhrhhXXHrhrhhhMeESSSSEenSrrNVCCCCCCCCCCCo...................', // 52
  '....................ooooTTTOOCCCCKKKKhrXXHHHrhrhhHWLLSSSSLWnsSrNVVKKKKCCCCCo....................', // 53
  '................ooooTTTTTTTTTOOVKjkkkKrhhHHtrhrRsReeSSSSSeWpsSrNVKkkkkKCCCCo....................', // 54
  '.............oooTTTTTTTTTTTTTTTOKJjjjKrhhXXhrhhrsssssssssvSpStrNVKjjjkKCCCo.....................', // 55
  '...............ooTTTTTTTTTTTTTTTKJJJJKrXXHHhrhhrmSsssssssSpRhhNVVKJJJJKVVCo.....................', // 56
  '.................ooTTTTTTTTTTTOOpSssssooooooooooooooooooooooooooooSssspooo......................', // 57
  '...................ooTTTTTOOOOoopSsSspTTTTTTTTTTTTTTTTTTTTTTTTTTTpSSsSpTTo......................', // 58
  '.....................ooOOOooooVVpSspspOOOOOOOOOOOOOTTTTOOOOOOOOOOpspspOOTo......................', // 59
  '.......................oooVVVVCCCppOpOOOOOOOOOOOOOOTTTTOOOOOOOOOOOpOpOOOTo......................', // 60
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 61
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 62
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 63
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 64
  '.........................oCCCCCCCCVVVVVVVVVVVVVVVVVCCCCVVVVVVVVVVVVVVVVVTo......................', // 65
  '.........................oCCCCCCCCVCCCCCCCCCCCCCCCCOOOOCCCCCCCCCCCCCCOOOTo......................', // 66
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 67
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 68
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 69
  '.........................oCCCCCCCCVOOOOTOOOOOOOOOOOTTOOOOOOOOOOOOOOOOOOOTo......................', // 70
  '.........................oCCCCCCCCVOOCCOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 71
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 72
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOdOOOOOOOOOOOTo......................', // 73
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOffFOOOddOdddOOTo......................', // 74
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOODffFOOOOOOOOOOOTo......................', // 75
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOODDDOOOOdddOddOOTo......................', // 76
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 77
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 78
  '.........................oCCCCCCCCVOOOOOOOTOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 79
  '.........................oCCCCCCCCVOOOOCCCOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 80
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 81
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 82
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 83
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOTo......................', // 84
  '.........................oCCCCCCCCVOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOCTOOTo......................', // 85
  '.........................oVCCCCCCCVOOOOOOOOOOOOOOOOOOTTOOOOOOOOOOOCCOOOOTo......................', // 86
  '.........................oVVVCCCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 87
  '.........................ooVVVVCCCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 88
  '...........................ooVVVVCVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 89
  '.............................ooVVVVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 90
  '...............................ooVVOOOOOOOOOOOOOOOOTTTTOOOOOOOOOOOOOOOOOTo......................', // 91
  '.................................ooCCCCCCCCCCCCCCCCOOOOCCCCCCCCCCCCCCCCCTo......................', // 92
  '...................................ooooooooooooooooooooooooooooooooooooooo......................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]

// The eyes over the rim, 10x5 at 50,50 (cols 50-59, rows 50-54): stand's eyes (cols 46-55, rows 31-35)
// moved with the head, in her own eye drawing (faces.ts), so the box reads as the same girl. The strand
// at col 49 is left alone, as the faces leave col 45. Awake, she peeks under her idle lids (heavy and
// flat, rows 50-51), the iris's three rows slid aside with the white W on the far side of the gaze;
// dozing, the lids shut as her blink shuts them.
export const peek: Overlay<PeekName> = {
  x: 50,
  y: 50,
  grids: {
    // looking left: the near iris at its outer corner (pupil M at 50,52, E L over e e) and the white W
    // at the nose side (col 52); the far pupil at its inner edge (57,52), the white at 58
    peekL: [
      '..........', // 50
      '..........', // 51
      'MEW....ME.', // 52
      'LLW....LW.', // 53
      'ee.....eW.', // 54
    ],
    // looking right: faces.ts's glance on three rows: the near iris slid to the nose side (pupil M at
    // 52,52), the white W at its outer corner (col 50) over s; the far iris at its outer side (pupil at
    // 58,52), the white at 57
    peekR: [
      '..........', // 50
      '..........', // 51
      'WEM....EM.', // 52
      'WLL....WL.', // 53
      'see....We.', // 54
    ],
    // dozing: faces.ts's blink moved with the head: the lids shut in a crescent (near 50-52 over
    // 50-51, its outer end under the strand; far 57-58 over 58), the far eye's edge back to p above it
    peekBlink: [
      'sss....ss.', // 50
      'sss....ssp', // 51
      'sss....ssp', // 52
      'nnn....nn.', // 53
      'nn.....sn.', // 54
    ],
  },
}

/** The 32x32 portrait window over the box: stand's (34,16) moved with the head (4,19). */
export const boxHead = { x: 38, y: 35 }

/** The shared cardboard box (Bocchi's X T U V, under keys Ryo's palette leaves free). */
export const colors: Palette = {
  T: '#e2b778', // box light flap and top edge (shared)
  O: '#c99a5b', // box cardboard (shared)
  C: '#8f6a3a', // box shade (shared)
  V: '#6e4f2a', // box deep shade (shared)
}
