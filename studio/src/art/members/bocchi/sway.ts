// Bocchi's sway: the free ends of her long back hair one step left (L) and
// right (R), drawn over stand (`_` erases the old ends). They must fit stand,
// playA and playB: checkArt holds the pixels they cover to be the same in all
// three.
//
// A graded swing, as a pendulum from the shoulders: rows 40-50 never move; the
// mass below shifts 1 px (L from row 53, R from row 51, where the left edge's
// 1:1 diagonal can absorb the step without a jaggy); the tips go 2 px. The
// strand line in the light band (the parting that becomes the gap between the
// thin lock and the main lock) keeps an even slope: L 27,25,24,23,22,22 and
// R 28,26,25,25,24,24 (rows 51, 53-57), every mark touching the h region on
// its right as in stand (R's row 51 is stand's row 51 moved 1 px), and the
// 1-px H highlight line beside it stays 1 px (L leaves stand's H24 and H23 on
// rows 53-54 showing through).
// L: the thin far-left lock keeps stand's 4-4-3-3-2-1 taper, its outer edge
// stepping 18,17,16 in even runs of 3 (rows 56-64); the main lock's end flicks
// 2 px left and keeps stand's rounding (left edge 22x8, 23x2, bottom 24-27;
// right edge 29, 28, 28, 27); the small lock by the skirt opens from the
// shadow band at (63,32), swings its body 1 px left (left edge 31, 30x3) and
// rounds into stand's own tip at (68,31-32), the slit between it and the main
// lock widening 1,1,1,2,3 px. R: the thin lock keeps stand's 4-4-3-3-2-1
// taper (left edge 19 on rows 59-63) and its point curls in to (64,20), the
// notch beside it opening 1,1,2,2,3,4 as in stand; the main lock's end tucks
// 2 px toward the body, its left edge running 24x5, 25x2, 26, 27 into a
// rounded 3-px bottom (28-30); the small lock shows
// as a 1-px strip of shadow against the guitar and skirt, ending in its own tip
// at (68,32), a notch at (68,31) keeping the two ends apart. Hair revealed from
// behind the guitar and the skirt is the shadow tone r; everything stays in
// cols 16-32, rows 51-68 (the picking arm, the guitar and the face are never
// touched).

import type { Patch } from '../../types'

export const sway: { L: Patch; R: Patch } = {
  L: {
    x: 16,
    y: 53,
    grid: [
      '....pHh......Hhr.',
      '...ph.........r..',
      '...ph..rH....r...',
      '..ph..rH....r....',
      '..ph..rH....r....',
      '..ph.p.HhH.r.....',
      '.ph.p_ph.Hr......',
      '.ph.p_ph..r......',
      '.php_.ph..r......',
      'ph.__.ph.r.......',
      'pp__..ph.r....p.r',
      'p._...ph.r...p_pr',
      '......phrr..p_.r.',
      '......_prrrrp_pr.',
      '.......prr.p__pr.',
      '........pp..__...',
    ],
  },
  R: {
    x: 18,
    y: 51,
    grid: [
      '...._p...Hr....',
      '..._p.....H...h',
      '..._pHhHr.H.hHh',
      '.._p.hHr.....H.',
      '.._p..hr....H..',
      '._p..hr....H...',
      '._p..hr....H...',
      '._p.h.pHh.H....',
      '_p.hp_p.hH.....',
      '_p.hp_p..h.....',
      '_php._p..h.....',
      '_php._p.h......',
      '_.p.._p.h....r.',
      '_.p..__phh..rr.',
      '......_phh..rrp',
      '......__ph.rr..',
      '.......__p.rr..',
      '........__..p_.',
    ],
  },
}
