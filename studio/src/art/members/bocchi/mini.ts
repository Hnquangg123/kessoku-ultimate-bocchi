// Bocchi's mini: her head hand-drawn at 16x16 for the terminal (ART-BRIEF.md
// "The minis"). `stand` is the head every pose but the box shows, the faces
// laid over it; `box` is the head over the box's rim, the peeks laid over it.
// Coordinates are the mini's own (0-15); every overlay sits inside it. No
// colors of its own: the reference's palette and the shared box colors only.
//
// Registered to the portrait window halved (mini col = (col - 34) / 2, mini
// row = (row - 16) / 2 on REF_STAND), so FX_MINI effects land beside her head
// as they do in the portrait.
//
// Drawn for the quadrants: the terminal draws the mini only as 8x4 cells, each
// quadrant one column of two rows (the darker pixel winning), at most two
// colors a cell. The rows are laid out so each cell holds one thing over
// another: the lid line on row 7 (pairs with the hair: a navy quadrant), the
// irises on rows 8-9, the cheeks on rows 10-11 (so every eye cell is eye over
// skin and the eyes keep their own colors), the mouth on row 12 with the collar
// on row 13 (so the mouth wins its pair), the jacket on rows 14-15.
// - ahoge: a one-color hook off the dome's top-left corner (3,0 over to 1,0,
//   down col 0 to its tip at 0,2), nothing under the tip: in quadrants a pink
//   hook on the background.
// - clips (viewer's left, cols 1-4): the blue cube (C b over b B) inside its
//   navy outline (cap 2-3,3), the yellow cube (z Z over Y Y) inside its rust
//   rim (cols 1 and 4), closed underneath by the hair's cast shadow (r at
//   2-3,8). In quadrants: navy, blue, yellow, hair.
// - hair: the light band on row 5 broken by strands on cols 7 and 9, the light
//   massed on the upper right; the near lock cols 1-4 (lit H down col 1,
//   strands r), the long back hair lit down col 0 (rows 11-12); the far lock
//   cols 10-12 (shadow r, light H) inside its plum outline (col 13, then col
//   12), tapering to its tip at 11,14 over the far shoulder.
// - eyes: the near eye cols 5-7 (lid n n at 6-7,7, lash corner 5,8, glint W at
//   6,8 over the iris E / E e), a 2-px skin bridge (cols 8-9), the far eye one
//   column wide (col 10: E over W) under a lid that runs out over cols 10-11.
// - face: cheeks rows 10-11 (S shade on the far side), the jaw in plum (5,11-12
//   near; 9,11 and 8,12 far), the mouth m m on the chin (6-7,12).
// - jacket: the high collar zipped to the chin (j w j at 6-8,13; the zipper y
//   down col 7), the near shoulder's seam in k (2-3,12), the sleeve's white
//   stripe from 2,13 (y) to 1,14-15 (w), the near lock's strand over the chest
//   (4,12-13 to its tip at 5,14, outlined p on its right), k folds, J under the
//   far jaw.
// Faces overlay cols 4-11, rows 7-13. Each keeps the cells to two colors, so
// every face reads apart in quadrants: idle (blue eyes), glance (the near iris
// slid left: blue then skin), focus (the lower lid raised: a one-row slit of
// blue, a firm K K mouth), half (the lids a row lower at their outer ends),
// blink (closed lines on row 9, lashes at 5,8 and 11,8), happy (^ ^ arcs, blush
// under the near eye and at 9,10, an open mouth m m over k k), panic (blank
// white eyes, blue marks under them, a crooked mouth), melt (lids sagging to
// 5,9 and 11,9 over a dull glint Q and the irises, a slack open mouth m m
// over K K).
// The box: the head as stand down to the cheeks (the near lock dark over the
// hand), the rim's outline on row 12, the lit fold on row 13, the cardboard on
// rows 14-15 with its tape on cols 8-9 (as the box portrait has it). Her hands
// grip the rim at both edges, cut by the window like the box portrait's: a
// plum top line on row 9, the back of the hand on rows 10-11, the fingers over
// the rim on rows 12-13 (S s), the cast shadow U under them; near cols 0-1
// (outline col 2), far cols 14-15 (outline col 13), a row of hair between the
// yellow clip and the near hand. The far flap stands behind her hair (cols
// 13-15, rows 4-8).

import type { MiniArt } from '../../types'

export const mini: MiniArt = {
  stand: [
    '.hhh............', // 0
    'h...ppppp.......', // 1
    'h..phHHhhpp.....', // 2
    '..nnhhhrhhhp....', // 3
    '.nCbnhhrhHHHp...', // 4
    'pnbBnHHrHrHHp...', // 5
    'pvzZvhhrhrhHp...', // 6
    'pvYYvhnnrsnnHp..', // 7
    'pHrrrnWESSErHp..', // 8
    'pHrhrsEeSSWrHp..', // 9
    'pHrhrssssSrrHp..', // 10
    'HhhrhpssSprrHp..', // 11
    'HhkkhpmmprrhHp..', // 12
    'hhyjhpjwjprhp...', // 13
    'hwjjkhjyJjkrp...', // 14
    'hwjjjkjyJjjp....', // 15
  ],
  box: [
    '.hhh............', // 0
    'h...ppppp.......', // 1
    'h..phHHhhpp.....', // 2
    '..nnhhhrhhhp....', // 3
    '.nCbnhhrhHHHpoo.', // 4
    'pnbBnHHrHrHHpTTo', // 5
    'pvzZvhhrhrhHpUUT', // 6
    'pvYYvhnnrsnnHpUU', // 7
    'phrrrnWESSErHpUU', // 8
    'ppphrsEeSSWrHppp', // 9
    'ssphrssssSrrHpss', // 10
    'ssprhssssSrrHpss', // 11
    'SspoooooooooopSs', // 12
    'SspTTTTTTTTTTpSs', // 13
    'UUXXXXXXTTXXXXUU', // 14
    'XXXXXXXXTTXXXXXX', // 15
  ],
  face: {
    x: 4,
    y: 7,
    grids: {
      idle: [
        '........', // 7
        '........', // 8
        '........', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      half: [
        '..S...Sr', // 7
        '..n...nn', // 8
        '......E.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      blink: [
        '..SS..Sr', // 7
        '..SS..Sn', // 8
        '..nn..n.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      glance: [
        '........', // 7
        '..EQ..E.', // 8
        '.EeW..e.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      focus: [
        '........', // 7
        '..EE..E.', // 8
        '..SS..S.', // 9
        '........', // 10
        '........', // 11
        '..KK....', // 12
        '........', // 13
      ],
      happy: [
        '..SS..Sr', // 7
        '.sns..n.', // 8
        '.nsn.Ssn', // 9
        '.jj..j..', // 10
        '........', // 11
        '..mm....', // 12
        '..kk....', // 13
      ],
      panic: [
        '........', // 7
        '..WW..W.', // 8
        '.nWW..W.', // 9
        '..eE.e..', // 10
        '........', // 11
        '..mS....', // 12
        '..Sm....', // 13
      ],
      melt: [
        '..SS..Sr', // 7
        '.Snn..nr', // 8
        '.nQE..En', // 9
        '........', // 10
        '........', // 11
        '..mm....', // 12
        '..KK....', // 13
      ],
    },
  },
  peek: {
    x: 4,
    y: 7,
    grids: {
      peekL: [
        '........', // 7
        '..EQ..E.', // 8
        '.EeW..e.', // 9
      ],
      peekR: [
        '........', // 7
        '..QE..E.', // 8
        '.SWe..E.', // 9
      ],
      peekBlink: [
        '..SS..Sr', // 7
        '..SS..Sn', // 8
        '..nn..n.', // 9
      ],
    },
  },
}
