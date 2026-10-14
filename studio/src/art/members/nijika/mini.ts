// Nijika's mini: her head hand-drawn at 16x16 for the terminal (ART-BRIEF.md
// "The minis"). `stand` is the head every pose but the box shows, the faces
// laid over it; `box` is the head over the box's rim, the peeks laid over it.
// Coordinates are the mini's own (0-15); every overlay sits inside it.
//
// On Bocchi's mini face geometry (as Ryo's is), so the four minis line up:
// the lid line on row 7, the irises on rows 8-9 (near cols 6-7, far col 10),
// the cheeks on rows 10-11, the mouth on row 12 (cols 6-7), the collar on row
// 13. Her portrait window (34,11) halved would put her eyes three rows lower;
// she sits three rows up from it so the Dorito fits over her crown, and the
// FX_MINI effects keyed beside her head (the twinkle at 13,2, the bang at
// 13,0, the sweat at 0,8 and 14,6) still land beside it, off her face.
//
// Drawn for the quadrants as well as the half blocks: in quadrants each cell
// is 2 cols x 4 rows, a quadrant a pair of rows (the darker pixel winning),
// at most two colors a cell. So the lids on row 7 pair with the bangs on row
// 6 (a dark quadrant); each eye column is e at its darkest (near W e over
// e e, far e over Q), so the eye cells read red-orange over skin; the far
// lock r on 11,8-11 and 10,11 keeps the far eye's cell to e and r; the grin's
// i i on row 12 wins its pair with the collar (a dark mouth under the eyes).
// - Dorito: a flat solid triangle leaning to the viewer's left, its left
//   edge straight up col 4 (rows 1-3) to a two-pixel cap 4-5,0, its right
//   edge stepping 7,1 / 8,2 / 9,3; r on its left face (5,2-4), the light H
//   streak down its right face (6,1 7,2 8,3); its base merges into the crown
//   while the crown's top-left stays a row lower (2-4,3), so a notch at 3,2
//   sets it apart from the head.
// - scrunchie: the gold ring Z (10-11, rows 2-3) with its sheen z at 11,2,
//   outlined over and before it (10-11,1, 9,2-3), the deep shadow u under it
//   (10,4) where the tail leaves it.
// - side tail (viewer's right): springs out of the scrunchie (its root
//   12-13, rows 2-4, outline 12,1 13,2 14,3), three wide behind the far
//   contour on rows 4-6, then hangs down cols 13-14 to the bottom edge:
//   r on its inner side against the head's far contour (p, col 11 on rows
//   5-6, col 12 below), the light H down its lit right side, outline col 15.
// - hair: the crown's light H massed on the upper right (8-9, rows 3-6), the
//   bangs parted by strands r (3 and 5), the forehead showing at 8,6; the
//   near side lock cols 0-4 lit H down col 1, strands r (2-4), its outline p
//   down col 0 to its tips (0,14 1,15); the far lock r h down cols 9-11
//   under the far eye to the collar.
// - eyes: the near lid n n n at 5-7,7, its lash flicking up at 4,6; the iris
//   W e over e e (6-7, rows 8-9); a two-pixel skin bridge (S, cols 8-9); the
//   far eye one column wide (10: e over Q) under its lid 10-11,7.
// - grin: teeth W W (6-7,11), the far corner i 8,11, the open mouth i i on
//   the chin (6-7,12); the jaw p at 5,11-12, 9,11 and 8,12.
// - collar and bow: the white collar w (5,13 8,13) round the neck S (6-7,13);
//   the red polka-dot bow on rows 14-15, cols 4-10: loops R with a dot P each
//   (6,14 9,14), pinched in the middle by the white shirt showing at 7,14
//   over the plain red knot 7,15, shaded k under each loop (5,15 9,15), the
//   outline K at both ends; the far lock r runs on down col 11 to the bottom.
//   In quadrants the cell under the chin (cols 6-7, rows 12-15) holds no
//   k, so it reads as the grin's dark i over the bow's red R, not one dark
//   block, and the far lock's cell stays gold.
// Faces overlay cols 4-11, rows 6-12, each keeping its cells to two colors:
//   idle (the head as drawn), half (the lids a row down, n 5-7,8 and 10-11,8,
//   the flick at 4,7, eyelid skin on row 7, the irises' lower row showing),
//   blink (closed lines n 5-7,9 and 10,9, lashes up at 4,8 and 11,8), glance
//   (the deadpan side-eye: flat lids on row 8, no flick, the near iris slid
//   left e W, the grin shut to a flat m m on row 12), focus (narrowed but
//   bright, as the full-size focus: the lower lids raised to skin on row 9,
//   leaving one row of iris W e with its glint kept at 6,8, and the near
//   lid's inner end stepping down to the nose, n at 8,8 on the skin bridge,
//   so in quadrants the near eye's cell narrows to skin and e and the
//   bridge's cell darkens, apart from idle's; the grin kept as idle's: she
//   smiles through the song, and happy keeps the wide W W W),
//   happy (^ ^ arcs, apexes 6,8 and 10,8, legs 5,9 7,9 and 9,9 11,9; blush j
//   at 5-6,10 and 9,10; the grin wide, W W W over i and the tongue P at
//   7,12), panic (blank white eyes W W over W W, the near one edged n at
//   5,9, far W W; the shirt's cool y under them, 6-7,10 and 10,10; a crooked
//   mouth i s i over s i), melt (lids n n 6-7,8 and 10,8 sagging to 5,9 and
//   11,9 over dull irises E e and e, the grin slack: skin over i i).
// Peeks overlay cols 4-11, rows 6-9 on the box head: peekL (both rows of the
//   near eye e W: the iris to the viewer's left), peekR (W e: to the right),
//   peekBlink (blink's closed lines).
// The box: the head as stand down to the eyes, then the hands gripping the
//   rim at both edges as Bocchi's do (a plum top line on row 9, the backs on
//   rows 10-11, the fingers over the rim on rows 12-13), the cheeks between
//   them, the rim's outline o on row 12, the lit fold ^ on row 13, the
//   cardboard ~ on rows 14-15 with its tape (^, cols 8-9) and the cast
//   shadow ; under the fingers. The tail hangs behind the far hand.
// Colors of its own: the shared box ramp (the brief's cardboard), keyed on
// symbols as Ryo's mini keys it, so no letter another part picks can clash;
// and happy's blush j, the same as faces.ts defines.

import type { MiniArt, Palette } from '../../types'

export const colors: Palette = {
  '^': '#e2b778', // box light flap and top edge (shared)
  '~': '#c99a5b', // box cardboard (shared)
  ';': '#8f6a3a', // box shade (shared)
  j: '#efa2a8', // blush (as in faces.ts: Bocchi's jacket pink, the band's one blush)
}

export const mini: MiniArt = {
  stand: [
    '....pp..........', // 0
    '....phHp..ppp...', // 1
    '....prhHppZzHp..', // 2
    '..ppprhhHpZZhHp.', // 3
    '.phhhrhhHHurrhHp', // 4
    'phhrhrhhHHhprhHp', // 5
    'phhrnhHrSHhprhHp', // 6
    'pHhrhnnnssnnprHp', // 7
    'pHrhrsWeSSerprHp', // 8
    'pHrhrseeSSQrprHp', // 9
    'pHrhrssssSsrprHp', // 10
    'HhhrhpWWiprrprHp', // 11
    'HhrhhpiiprrhprHp', // 12
    'hHrhhwSSwrrhprHp', // 13
    'pHrhKRPwRPKrprHp', // 14
    '.prhKkRRRkKrprHp', // 15
  ],
  box: [
    '....pp..........', // 0
    '....phHp..ppp...', // 1
    '....prhHppZzHp..', // 2
    '..ppprhhHpZZhHp.', // 3
    '.phhhrhhHHurrhHp', // 4
    'phhrhrhhHHhprhHp', // 5
    'phhrnhHrSHhprhHp', // 6
    'pHhrhnnnssnnprHp', // 7
    'pHrhrsWeSSerprHp', // 8
    'ppphrseeSSQrpppp', // 9
    'ssphrssssSsrpsss', // 10
    'ssphrssssSrrpsss', // 11
    'SspoooooooooopSs', // 12
    'Ssp^^^^^^^^^^pSs', // 13
    ';;~~~~~~^^~~~~;;', // 14
    '~~~~~~~~^^~~~~~~', // 15
  ],
  face: {
    x: 4,
    y: 6,
    grids: {
      idle: [
        '........', // 6
        '........', // 7
        '........', // 8
        '........', // 9
        '........', // 10
        '........', // 11
        '........', // 12
      ],
      half: [
        'h.......', // 6
        'nsss..sr', // 7
        '.nnn..nn', // 8
        '......e.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
      ],
      blink: [
        'h.......', // 6
        '.sss..sr', // 7
        'n.ss..sn', // 8
        '.nnn..n.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
      ],
      glance: [
        'h.......', // 6
        '.sss..sr', // 7
        '.nnn..nn', // 8
        '...W..e.', // 9
        '........', // 10
        '..ssS...', // 11
        '..mm....', // 12
      ],
      focus: [
        '........', // 6
        '........', // 7
        '....n...', // 8
        '..ss..s.', // 9
        '........', // 10
        '........', // 11
        '........', // 12
      ],
      happy: [
        'h.......', // 6
        '.sss..sr', // 7
        '..ns..n.', // 8
        '.nsn.nsn', // 9
        '.jj..j..', // 10
        '....W...', // 11
        '...P....', // 12
      ],
      panic: [
        '........', // 6
        '........', // 7
        '...W..W.', // 8
        '.nWW..W.', // 9
        '..yy..y.', // 10
        '..is....', // 11
        '..s.....', // 12
      ],
      melt: [
        'h.......', // 6
        '.sss..sr', // 7
        '..nn..n.', // 8
        '.nE...en', // 9
        '........', // 10
        '..ssS...', // 11
        '........', // 12
      ],
    },
  },
  peek: {
    x: 4,
    y: 6,
    grids: {
      peekL: [
        '........', // 6
        '........', // 7
        '..eW....', // 8
        '...W..e.', // 9
      ],
      peekR: [
        '........', // 6
        '........', // 7
        '........', // 8
        '..W...e.', // 9
      ],
      peekBlink: [
        'h.......', // 6
        '.sss..sr', // 7
        'n.ss..sn', // 8
        '.nnn..n.', // 9
      ],
    },
  },
}
