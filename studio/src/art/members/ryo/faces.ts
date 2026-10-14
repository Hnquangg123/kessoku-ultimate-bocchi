// Ryo's faces: overlays laid over the head at (x, y) on stand (shifted by a
// pose's head offset elsewhere), `.` keeping the head's own pixel, `_` erasing
// it. ART-BRIEF.md "The faces" says what each shows.
//
// Bocchi's face box (16x10 at 42,30, cols 42-57, rows 30-39), since Ryo's eyes
// sit on Bocchi's rows and columns, in her own palette (no colors of their
// own): the lid line n two pixels thick, iris E (dark, under the lid) / L (mid
// gold) / e (lemon), pupil M, glint W, skin s/S, the face edge p, the mouth m,
// the shirt's grey-blue y, the loafer's dark red x. A `.` is stand's own pixel
// (the bangs, the near lock over cols 42-44 and its strand down col 45 over
// the near eye's outer corner, the far ear and its piercing at cols 56-57, the
// mole v at 53,36), so the faces follow any change to stand there. No face
// writes col 45 on rows 31-35: the strand stays over the eye in every face.
// Stand's face (idle) under the box:
//   30 hhhhhhrrhhrrhhHH   the bangs
//   31 hhhrnnnrhrsnnphH   the lids: near cols 46-48 (the strand r r at 45), far 53-55 (rows 31-32)
//   32 rhhrnnnssssnnnhH
//   33 rhhhMeESSSSEenSr   near iris M e E / W L L / e e (cols 46-48); the strand h H R down col 45
//   34 rhhHWLLSSSSLWnsS   far iris E e / L W / e W (cols 53-54), col 55 its edge
//   35 rRsReeSSSSSeWpsS
//   36 hrsssssssssvSpSt   the mole v at 53,36, under the far iris
//   37 hrmSsssssssSpRhh   chin line m at 44,37 and 45,38
//   38 hRpmSssssSppRRrh
//   39 RRpSmmmmppRRrNNN   the mouth on the chin, m at cols 46-49
// Her personality: cool, deadpan, barely moves, sleepy heavy lids; a smug
// little smirk at best, no blush (reference/character-notes.md). Each face is
// Bocchi's matching face redrawn on Ryo's narrower, heavier-lidded eyes.
//   idle    stand's own: heavy flat lids over the iris's three rows
//   half    her sleepy look (held most of the anxious mood): idle's lids moved
//           down a row (lid tops on row 32, the second row on 33, skin s
//           above them on row 31), so the iris's two lower rows show (near
//           W L L over e e, far L W over e W), gold under a heavy lid
//   blink   closed: a ‿ crescent on rows 34-35 (near 46-48 over 46-47, its
//           outer end under the strand; far 53-55 over 54), skin over the
//           open eye's rows 31-33, the far eye's edge back to p (55,32-33)
//   (every blink closes one way: the iris shows on rows 33-35 in idle, 34-35
//   in half and glance, 34 in focus, none in blink; the lid's top row goes
//   31 -> 32 -> 34)
//   glance  a sidelong look to the viewer's right under half's lids: the near
//           iris slid to the nose side (W L M on row 34, s e e on 35), the
//           far one to its outer side (W M over W e at 53-54)
//   focus   playing: half's lids with the lower lid raised, a one-row slit on
//           row 34 showing two lemon pixels an eye (near M e e, the pupil at
//           the outer end; far e e against the lid's edge n at 55), row 35
//           skin, so her yellow holds at 1x under the heavy lid; the mouth is
//           idle's (she never blinks mid-song, so focus holds the whole loop)
//   happy   smug-content closed eyes: the lids lifted off (skin on rows
//           31-33) and one-pixel arcs in the lid's navy, the near one ⌒ 1-2-1
//           (46,33 / 47-48,32 / 49,33, the strand at 45 bounding it), the far
//           one ∧ on the far eye (53,33 / 54,32 / 55,33, its outer leg on the
//           face edge, p above and below it at 55,32 and 55,34), so the closed
//           eyes keep a 3-pixel gap (50-52) like Bocchi's; no blush; a smirk:
//           the mouth shortened to 46-48,39 with its far corner up at 49,38
//           (49,39 skin S)
//   panic   the blank stare: idle's lids over blank whites (near 3x3 at 46-48
//           rows 33-35, its lower inner corner rounded off at 48,35; far 2x3
//           at 53-54), a one-pixel pupil in each (47,34 and 53,34), the
//           shirt's grey-blue y under the whites (row 36: 46-48, and 54 only,
//           so the mole v at 53,36 stays as in every face), a ~ mouth from the
//           chin line zigzagging inside the jaw (45,38 -> 46,39 -> 47-48,38 ->
//           49,39 -> 50,38), Bocchi's wave one step shorter
//   melt    defeated: both lids sag to their outer corners in even steps,
//           two pixels thick (near 47-48,32 -> 46-48,33 -> 46,34, the droop
//           inside the strand; far 53-54,32 -> 53-55,33 -> 54-55,34 ->
//           55,35), the irises dulled with no glint (near E L over L L at
//           47-48, far E over L at 53), a slack open mouth above the chin
//           line (m m on 47-48,37 over the dark red x x on 47-48,38)

import type { FaceName, Overlay } from '../../types'

export const face: Overlay<FaceName> = {
  x: 42,
  y: 30,
  grids: {
    idle: [
      '................', // 30
      '................', // 31
      '................', // 32
      '................', // 33
      '................', // 34
      '................', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    half: [
      '................', // 30
      '....sss....ss...', // 31
      '................', // 32
      '....nnn....nn...', // 33
      '................', // 34
      '................', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    blink: [
      '................', // 30
      '....sss....ss...', // 31
      '....sss....ssp..', // 32
      '....sss....ssp..', // 33
      '....nnn....nn...', // 34
      '....nn.....sn...', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    glance: [
      '................', // 30
      '....sss....ss...', // 31
      '................', // 32
      '....nnn....nn...', // 33
      '......M....WM...', // 34
      '....s.e....We...', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    focus: [
      '................', // 30
      '....sss....ss...', // 31
      '................', // 32
      '....nnn....nn...', // 33
      '....Mee....ee...', // 34
      '....ss.....ss...', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    happy: [
      '................', // 30
      '....sss....ss...', // 31
      '....s......snp..', // 32
      '....nssn...nsn..', // 33
      '....sss....ssp..', // 34
      '....ss.....ss...', // 35
      '................', // 36
      '................', // 37
      '.......m........', // 38
      '.......S........', // 39
    ],
    panic: [
      '................', // 30
      '................', // 31
      '................', // 32
      '....WWW....WW...', // 33
      '.....MW....M....', // 34
      '....WW.....W....', // 35
      '....yyy.....y...', // 36
      '................', // 37
      '.....mm.m.......', // 38
      '.....SS.........', // 39
    ],
    melt: [
      '................', // 30
      '....sss....ss...', // 31
      '....s........p..', // 32
      '....nnn....nn...', // 33
      '....nE.....En...', // 34
      '....sLL....Lsn..', // 35
      '................', // 36
      '.....mm.........', // 37
      '.....xx.........', // 38
      '................', // 39
    ],
  },
}
