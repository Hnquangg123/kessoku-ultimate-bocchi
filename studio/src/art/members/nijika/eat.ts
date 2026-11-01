// Nijika eating at the table, patched on her seat, arms and what they hold only: the far forearm folded
// across her lifts away (the vest's V and body under it), her torizara in the near hand at the end of the near
// forearm still on the table (the plate 44-53, rows 47-52), and the far hand with the chopsticks:
//   seatPot   the far arm out over her tail, the forearm rising, the long cooking chopsticks in across the pot's
//             side, the tips in the food (93,32: she sits in front of the pot, drawn after it)
//   seatBowl  the far forearm up from the elbow at her side, the chopsticks down into the plate
//   seatUp    the hand raised under her chin, the tips at her mouth (49,40: just under the face box)
// The plate and the near arm are the same in all three, so an eating loop changes only the far arm.

import type { Point, SeatPoseDef } from '../../types'

/** Her torizara in the near hand, the long chopsticks in the pot (their tips in the food, 93,32). */
export const seatPot: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 50x25 at 44,32
    {
      x: 44,
      y: 32,
      grid: [
        '................................................((', // 32
        '..............................................((()', // 33
        '............................................((()).', // 34
        '..........................................((())...', // 35
        '........................................((()).....', // 36
        '......................................((()).......', // 37
        '....................................((()).........', // 38
        '.............................ppp..(())............', // 39
        '........................qqqqpsss()................', // 40
        '.....................qqqwwwwpsssSp................', // 41
        '..................qqqwwwwwwyqSsSp.................', // 42
        '...............qqqwwwwwwwyyYqpppp.................', // 43
        '..........__cw.wwwwwwwyyYYqq......................', // 44
        '..........__....wwwwyYYqqq........................', // 45
        '..........__.yyyyyYYYqq...........................', // 46
        '..ooooooo._.qYYYYqqqq.............................', // 47
        'oWW<<<<WWovcuqq.q.................................', // 48
        'oW<<<<<<Wovcouu._.................................', // 49
        'o{WWWWWW{ovcouu._.................................', // 50
        '.o{{{{{{o.vcouu_..................................', // 51
        '..oooooovvvcouu_..................................', // 52
        '........_vvcoru_..................................', // 53
        '........_vvcoru_..................................', // 54
        '........_..co.._..................................', // 55
        '........_......_..................................', // 56
      ],
    },
  ],
}

/** The chopsticks at the torizara (48,48). */
export const seatBowl: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 16x14 at 44,43
    {
      x: 44,
      y: 43,
      grid: [
        '...........p.p..', // 43
        '..........pssSp.', // 44
        '.......((psssp..', // 45
        '......((.pSsSp..', // 46
        '..ooo((ooqww.q..', // 47
        'oWW<(<<Wqyww.q..', // 48
        'oW<<<<<<Wqyw..yq', // 49
        'o{WWWWWW{qyyw.yq', // 50
        '.o{{{{{{o.Yyyy..', // 51
        '..oooooovqqYYYY.', // 52
        '........_vqqqqq.', // 53
        '........_vv...._', // 54
        '........_......_', // 55
        '........_......_', // 56
      ],
    },
  ],
}

/** The chopsticks at her mouth (49,40). */
export const seatUp: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 16x17 at 44,40
    {
      x: 44,
      y: 40,
      grid: [
        '.....((.........', // 40
        '......((ppp.....', // 41
        '.......(psssp...', // 42
        '........pssS....', // 43
        '........pSsSp...', // 44
        '........qwwyq...', // 45
        '........qywwyq..', // 46
        '..ooooooqywwwyq.', // 47
        'oWW<<<<Wqyywwyq.', // 48
        'oW<<<<<<Wqyw.y..', // 49
        'o{WWWWWW{qYy.y..', // 50
        '.o{{{{{{o..YYYY.', // 51
        '..oooooovvqqqqq.', // 52
        '........_vqYYY..', // 53
        '........_vv...._', // 54
        '........_......_', // 55
        '........_......_', // 56
      ],
    },
  ],
}

/** Where the chopsticks' tips are on each (canvas pixels): the feast centres the food it picked (the morsel effect) there. */
export const tips: { seatPot: Point; seatBowl: Point; seatUp: Point } = { seatPot: { x: 93, y: 32 }, seatBowl: { x: 48, y: 48 }, seatUp: { x: 49, y: 40 } }
