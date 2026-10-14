// Ryo's mini: her head hand-drawn at 16x16 for the terminal (ART-BRIEF.md
// "The minis"). `stand` is the head every pose but the box shows, the faces
// laid over it; `box` is the head over the box's rim, the peeks laid over it.
// Coordinates are the mini's own (0-15); every overlay sits inside it.
//
// Registered to the portrait window halved like Bocchi's (mini col =
// (col - 34) / 2, mini row = (row - 16) / 2 on her stand, whose head is drawn
// on Bocchi's), and on Bocchi's mini face geometry, so the four minis line up
// and FX_MINI effects land beside her head as they do in the portrait: the
// lid line on row 7, the irises on rows 8-9 (near cols 6-7, far col 10), the
// cheeks on rows 10-11, the mouth on row 12 (cols 6-7), the collar on row 13.
//
// Drawn for the quadrants, the only way a terminal draws a mini (8x4 cells):
// each cell is 2 cols x 4 rows, a quadrant a pair of rows (the darker pixel
// winning), at most two colors a cell. So the eye cells (cols 6-7 and 10-11,
// rows 8-11) take no mouth pixel on row 11, every mouth keeps 6-7,12 dark
// enough to win over the collar (or the face loses its mouth), and each eye
// cell holds one iris color over skin: the
// near iris is L L over W e (merged: L L, gold); the far iris L over e (L)
// shares its cell with the plum face edge p only (11,8-10, the jaw 10,11; the
// hair under the ear at 11,11 is the lighter r, so p wins that quadrant and
// the gold survives); the lid n on row 7 pairs with the bangs on row 6 (a navy
// quadrant); the pins sit on rows 7 and 10 so a hair pair (rows 8-9) parts them.
// - hair: the cobalt bob in her ramp (U sheen, H light, h, r shadow and
//   strands, R deep, N outline), a round dome from the top outline (4-8,1) out
//   to col 0 and col 13 in even steps (2-1-1-1); the sheen U a broken ring
//   over the crown (6-7,3 -> 7-8,2 -> 9,3 -> 9-10,4), a strand H at 8,3
//   parting it, as the portrait's band on rows 21-23; the light H on the
//   dome's right side (cols 5-11, rows 3-6) and in streaks on the left (2,4-5;
//   1,8-9 and 2,9; 1,12-13); the near lock over the eye's outer corner (col 5 rows
//   6-9, strand r and R down col 4 to row 12), the portrait's strand down col
//   45; the long left side to the window's edge (cols 0-3, rows 4-14), its
//   flip lit H down col 0 (rows 10-11) and ending in N on row 14; the far side
//   tucked behind the ear (the ear s over S at 12,8-9, outline N down col 13),
//   the deep R under the jaw ending at row 12.
// - pins (viewer's left): two dark bars K K at cols 1-2, rows 7 and 10, each
//   with a metal glint t at its right end (col 3), hair between them.
// - eyes: heavy lids n n (6-7,7 and 10-11,7); the near iris L L over a glint W
//   (6,9) and lemon e (7,9); the far iris L over e (col 10); the skin between
//   them in shade S (8-9, rows 8-9); the mole v under the far eye (10,10).
// - face: cheeks s (row 10, cols 5-9), the jaw narrowing like Bocchi's: the
//   near jaw p down col 5 (rows 11-12), the far face edge p down col 11 (rows
//   8-10) stepping in 1-2-1 to 9-10,11 and 8,12, the chin s s S (6-8,11), the
//   mouth m m on the chin (6-7,12).
// - clothes: the white shirt collar w (6,13 and 8,13) around the neck's shade,
//   the black string tie K down col 7 (rows 14-15) between the collar's points
//   (6,14 and 8,14), the dark navy sweater j with its lit rim k, outlined K,
//   the far shoulder stepping down (11,13 to 13,15); the purple bass strap P
//   crossing it from the far shoulder (10,14 -> 9,15), as in her portrait.
// Faces overlay cols 4-11, rows 7-13, the same box as Bocchi's, each the
// matching hi-res face (faces.ts) at this size. Each keeps the eye cells to
// two colors so every face reads apart in quadrants too: idle (gold eyes under
// navy lids), half (the upper iris darkened E E: olive), blink (closed lines
// on row 9, the lids' row now skin), glance (the near iris slid right: white W
// then L, the far eye widened by a white at 9,8), focus (the lower lid raised:
// one row of gold), happy (Bocchi's mini happy: the lids on row 7 lifted to
// skin s, the far edge p at 11,7, and closed ∧ arcs on rows 8-9, the near
// 5,9 / 6,8 / 7,9, the far 10,8 / 11,9 with the shade S at 9,9 as its soft
// inner side, so in quadrants each eye cell is navy over skin (the far one
// navy over the plum edge) with skin between them, as Bocchi's; a smug smirk:
// the mouth 6-7,12 with its far corner up at 8,11), panic (blank white eyes,
// one-pixel pupils at 7,9 and 10,9, the grey-blue y under the near one only so
// the mole v at 10,10 stays; a crooked \ mouth inside the chin from the near
// jaw: 5,11 -> 6-7,12, against the smirk's /, the hi-res wave's start at the
// chin line; row 13 stays the collar), melt (the lids two rows thick, sagging
// out to 5,8 and 11,8 over dull L L, the jaw slack: x x under the mouth on
// row 13).
// Peeks (the same box, rows 7-9): peekL the near iris slid left (L W over e s),
// peekR slid right (glance's eyes), peekBlink closed (blink's eyes: she dozes).
// The box: the head as stand down to the chin (rows 0-11, both pins and the
// hair between and under them); the rim's outline o on row 12, the lit fold ^
// on row 13, the cardboard ~ on rows 14-15 with its tape (^, cols 8-9), as
// Bocchi's box mini. Her forearms rest on the rim at both edges in her
// oversized sleeves, the sweater cuff on the rim's row 12 showing its lit top
// k (inner edge K), lighter than the rim's outline o so the sleeve lies over
// it, a row of hair (H h h, 0-2,11) parting it from the lower pin, and the hands
// hang over the front on rows 13-15 (s s over S s, S s; outline p on cols 2
// and 13), so in quadrants the pins read as in stand, the cuffs pair rows
// 12-13 and the fingers 14-15. The far flap stands behind her hair (cols
// 14-15, rows 4-11: outline o, lit edge ^, inner face -).
// Colors: her palette, plus the shared cardboard ramp (`colors` below; the
// deep shade is not used here).

import type { MiniArt, Palette } from '../../types'

export const colors: Palette = {
  '^': '#e2b778', // box light flap and top edge (shared)
  '~': '#c99a5b', // box cardboard (shared)
  '-': '#8f6a3a', // box shade (shared)
}

export const mini: MiniArt = {
  stand: [
    '................', // 0
    '....NNNNN.......', // 1
    '..NNhhHUUNN.....', // 2
    '.NhhhHUUHUHN....', // 3
    'NhHrhHHHHUUhN...', // 4
    'hhHrhHHHHHHhhN..', // 5
    'hhrhrhHrhHrHhN..', // 6
    'hKKtrhnnrsnnhN..', // 7
    'hHhhrhLLSSLpsN..', // 8
    'hHHhrhWeSSepSN..', // 9
    'HKKtrsssssvphN..', // 10
    'HhhrRpssSpprRN..', // 11
    'hHhrRpmmpRRRN...', // 12
    'hHrRjjwSwjjK....', // 13
    'NhRNjjwKwjPjK...', // 14
    'KKjjjkjKjPjjjK..', // 15
  ],
  box: [
    '................', // 0
    '....NNNNN.......', // 1
    '..NNhhHUUNN.....', // 2
    '.NhhhHUUHUHN....', // 3
    'NhHrhHHHHUUhNoo.', // 4
    'hhHrhHHHHHHhhN^o', // 5
    'hhrhrhHrhHrHhN-^', // 6
    'hKKtrhnnrsnnhN--', // 7
    'hHhhrhLLSSLpsN--', // 8
    'hHHhrhWeSSepSN--', // 9
    'HKKtrsssssvphN--', // 10
    'HhhrRpssSpprRN--', // 11
    'kkKooooooooooKkk', // 12
    'ssp^^^^^^^^^^pss', // 13
    'Ssp~~~~~^^~~~pSs', // 14
    'Ssp~~~~~^^~~~pSs', // 15
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
        '........', // 7
        '..EE..E.', // 8
        '..L.....', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      blink: [
        '..ss..sp', // 7
        '..ss..s.', // 8
        '..nn..n.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      glance: [
        '........', // 7
        '..W..W..', // 8
        '..s.....', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      focus: [
        '........', // 7
        '........', // 8
        '..ss..s.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '........', // 13
      ],
      happy: [
        '..ss..sp', // 7
        '..ns..n.', // 8
        '.nsn..sn', // 9
        '........', // 10
        '....m...', // 11
        '........', // 12
        '........', // 13
      ],
      panic: [
        '........', // 7
        '..WW..W.', // 8
        '...M..M.', // 9
        '..yy....', // 10
        '.m......', // 11
        '........', // 12
        '........', // 13
      ],
      melt: [
        '........', // 7
        '.nnn..nn', // 8
        '..LL..L.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
        '..xx....', // 13
      ],
    },
  },
  peek: {
    x: 4,
    y: 7,
    grids: {
      peekL: [
        '........', // 7
        '...W....', // 8
        '..es....', // 9
      ],
      peekR: [
        '........', // 7
        '..W..W..', // 8
        '..s.....', // 9
      ],
      peekBlink: [
        '..ss..sp', // 7
        '..ss..s.', // 8
        '..nn..n.', // 9
      ],
    },
  },
}
