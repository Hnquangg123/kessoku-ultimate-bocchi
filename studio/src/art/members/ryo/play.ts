// Ryo's fingerstyle pluck, as patches on stand, the way Bocchi's strum is
// patched on hers (same beats: stand -> playB, the hit -> stand -> playA). The
// head and the hair stay pixel-identical (checkArt holds the face region to
// stand's, and the sway overlays must fit stand, playA and playB), so nothing
// here reaches above row 47 or left of col 37. The elbow and the upper arm stay
// where stand has them; the wrist, the hand and the bass they cover or uncover
// change. She plucks, she does not strum: the hand travels 3 rows up and 2
// down (Bocchi's fist travels 6 and 4), and the fingers do the playing.
//
// stand: the hand at cols 44-48, rows 52-58, one finger down on the strings at
// 46,57 where they leave the body for the neck.
//
// playA, the fingers drawn back after the pluck: the hand 3 rows up, the same
// hand as stand's (top outline p45-47 on row 49 over the strap's end, the back
// of the hand on rows 50-51, the knuckle line S44-46 on row 52), its fingers
// curled under (rows 53-54, narrowing to the outline p46-47 on row 55). The
// cuff lifts with the wrist: its top outline K42-44 on row 48 over the lit rim
// k42-44 on row 49 (k44 on row 50 beside the hand), the forearm's top contour K
// level on row 49 (cols 38-41) over the rim k on row 50 (37-41). Its underside
// rises in even steps from stand's (K35-37 on row 56, K38-40 on row 55, K41-44
// on row 54), the shade J above it, and uncovers the guard: the sleeve's cast
// shadow Q under it (38-40,56 / 41-45,55; light from the upper right), lit
// guard q beyond (38-39,57 / 41-47,56), the end of the board u at 48,55 and its
// edge Z at 48,56, the strings t carried up to 45-47,57, and the lower horn
// whole again (z at 46-47,58, the cutaway's corner o at 48,58).
// The fretting hand lives too: in playA the little finger reaches one fret on
// (s68 S69 on row 48, the board's row, with its outline p at 69,47 and 70,48);
// playB keeps stand's hand, so the left hand changes only into and out of the
// upstroke, as Bocchi's does.
//
// playB, the pluck itself (the hit, squash 1): the hand 2 rows down (top
// outline p45-47 on row 54, the back of the hand rows 55-56, the knuckle line
// S44-46 on row 57) and the index finger pulled through the strings: s46 on
// rows 58-60 between outlines p45 and p47, its tip p at 46,61 on the body below
// the guard, the middle finger beside it at 47,58; the hand's right outline p48
// runs over the cutaway's corner. Its cast shadow: Q at 44,60, Z at 45,61. The
// cuff follows the wrist down (contour K42-43 on row 51 and K44 on row 52, the
// rim k42-43 on row 52 and k44 on rows 53-55, its bottom K42-43 on row 57), and
// its lip comes down over the back of the hand (j45-46 on row 52, the shade
// J45-46 on row 53), so the sleeve rests on the hand's top outline p on row 54
// as it does in stand and playA, and the hand never slides out from under it.
// The only body uncovered is the sliver beside the lip: z at 47,52 under the
// horn's edge o47,51, the shade Z at 47,53, and the cutaway's edge o at
// 48,53-54 into the neck's top outline.
//
// Drawn in the reference's hand: the plum p round the skin where it meets
// another material, the knuckle line in S, the sweater ramp k/j/J/K with its K
// outline, the bass outlined in o with its z/Z/q/Q/u. No colors of its own.

import type { PoseDef } from '../../types'

export const playA: PoseDef = {
  from: 'stand',
  patches: [
    // the plucking hand, the lifted cuff and forearm, the guard and neck end they uncover: 12x11 at 37,48
    {
      x: 37,
      y: 48,
      grid: [
        '.....KKK....', // 48
        '...KKkkkppp.', // 49
        '...kk.jksssp', // 50
        '..jjJjjssssp', // 51
        '.....jjSSSsp', // 52
        '.....JJp....', // 53
        '.JJJKKKKp...', // 54
        'JKKKQQQQQppu', // 55
        '.QQQqqq.qqqZ', // 56
        '.qq.....ttt.', // 57
        '.........z..', // 58
      ],
    },
    // the fretting hand's little finger: 3x2 at 68,47
    {
      x: 68,
      y: 47,
      grid: [
        '.p.', // 47
        'sSp', // 48
      ],
    },
  ],
}

export const playB: PoseDef = {
  from: 'stand',
  patches: [
    // the plucking hand, the cuff lip that follows it, the sliver of body beside it and the finger through the strings: 7x11 at 42,51
    {
      x: 42,
      y: 51,
      grid: [
        '..j....', // 51
        '..Kjjz.', // 52
        '...JJZo', // 53
        '..kpppo', // 54
        'jjkss..', // 55
        'JJss...', // 56
        'KKSSSsp', // 57
        '...pssp', // 58
        '...psp.', // 59
        '..Qpsp.', // 60
        '...Zp..', // 61
      ],
    },
  ],
}
