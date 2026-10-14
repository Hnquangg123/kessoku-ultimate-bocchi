// Ryo's sway: the free ends of her bob one step left (L) and right (R), drawn
// over stand (`_` erases the old ends). They must fit stand, playA and playB:
// checkArt holds the pixels they cover to be the same in all three (her play
// patches start at row 47, so rows 43-46 are hers alone).
//
// A short bob is stiff, so the swing is small and graded like Bocchi's
// pendulum: rows 18-42 never move; on row 43 only the outer contour (L) or
// the strand (R) steps over; rows 44-46 (the flip and the inner lock's tip)
// shift 1 px. The tucked side behind the far ear stays put (it is tucked, and
// its end sits inside the face box).
// L: the flip swings out, its contour stepping evenly 31, 30, 29, 28, 27 down
// rows 41-45 (stand: 31, 30, 30, 29, 28), its bottom outline on row 46 at
// cols 28-32; the strand r keeps an even slope (33, 33, 32, 31 down rows
// 41-44) and the light band H follows it down the flip (H33-34 on row 43, H32
// on row 44, the tip's H28); the slit of sweater between the flip and the
// inner lock widens to 3 px (J34-36 on row 45), and the shoulder's outline K
// carries on up to 33,46 where the flip's corner was; the inner lock's tip
// moves to N37-39 on row 46, sweater j filling in behind it at 40.
// R: the flip tucks in, its contour 31, 30, 30, 30, 29 down rows 41-45 (a
// straighter side with a small flick at the tip) and its bottom on row 46 at
// cols 30-34 (over the shoulder's outline at 34); the strand r runs straight
// down col 33 (rows 41-44) and the light band packs 1 px tighter beside it
// (H34 on rows 43-44, the edge light H31 and the tip's H30); the slit narrows
// to 1 px (J36); the inner lock's tip moves to N39-41 on row 46, sweater j at
// 38 behind it.
// Everything stays in cols 27-42, rows 43-46, outside the face box (42-57,
// 30-39) and clear of the arm, the strap and the bass.

import type { Patch } from '../../types'

export const sway: { L: Patch; R: Patch } = {
  L: {
    x: 27,
    y: 43,
    grid: [
      '..NhhrHHhhrhhRRR', // 43
      '.NHhrHhhhrRhhRRN', // 44
      'NHhRRRNJJJNhhRNJ', // 45
      '.NNNNNKKKjNNNjjJ', // 46
    ],
  },
  R: {
    x: 27,
    y: 43,
    grid: [
      '...NhhrHhhrhhRRR', // 43
      '.._NHhrHhrRhhRRN', // 44
      '._NHhRRRNJNhhRNJ', // 45
      '.._NNNNNKjjjNNNJ', // 46
    ],
  },
}
