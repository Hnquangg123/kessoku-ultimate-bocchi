// Bocchi eating at the table, patched on her seat, arms and what they hold only: the far forearm folded
// across her lifts away (the jacket under it), her torizara in the near hand at the end of the near forearm still
// on the table (the plate 44-53, rows 47-52, white with its blue band), and the far hand with the chopsticks:
//   seatPot   the far arm out toward the pot, the chopsticks' tips at its back rim (88,56: the scene's row 112, the
//             last her lap clip leaves her; the pot, drawn after her, hides anything past the rim)
//   seatBowl  the far forearm up from the elbow at her side, the hand at her chest, the chopsticks down into the plate
//   seatUp    the hand raised under her chin, the tips at her mouth (50,40: just under the face box, which stays
//             stand's; the morsel the feast puts there covers her mouth, open for the bite)
// The plate and the near arm are the same in all three, so an eating loop changes only the far arm.

import type { Point, SeatPoseDef } from '../../types'

/** Her torizara in the near hand, the chopsticks in the pot (their tips at its back rim, 88,56). */
export const seatPot: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 45x11 at 44,46
    {
      x: 44,
      y: 46,
      grid: [
        '............jkppp............................', // 46
        '._ooooooo....jjjjppp.........................', // 47
        'oWW<<<<WWo...wwwwjjjppp......................', // 48
        'oW<<<<<<Wo.J..jjjwwwjjjppp...................', // 49
        'o{WWWWWW{okJJ..jjjjjwwwjJjJppp...............', // 50
        '.o{{{{{{o.kkJJJJjjjjjjjJjJpssp(((............', // 51
        '..oooooow...kpp.JJJJJjjJjJpssSp))(((.........', // 52
        '........wjjjkp_.pppppJJJjJpSsSp...))(((......', // 53
        '........wjjjk........pppppppppp......))(((...', // 54
        '........................................))((.', // 55
        '...........................................)(', // 56
      ],
    },
  ],
}

/** The chopsticks at the torizara (49,48). */
export const seatBowl: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 18x12 at 44,43
    {
      x: 44,
      y: 43,
      grid: [
        '...........ppp....', // 43
        '..........pssS....', // 44
        '........((psss....', // 45
        '.......((.pSsSp...', // 46
        '..oooo((o.pJ.J....', // 47
        'oWW<<(<WWkJ.Jj....', // 48
        'oW<<<<<<Wo....wkp.', // 49
        'o{WWWWWW{okjj..wkp', // 50
        '.o{{{{{{o.kJ...wkp', // 51
        '..oooooow.kJJJwkp.', // 52
        '........wjkppp.pp.', // 53
        '........wjjjjkp...', // 54
      ],
    },
  ],
}

/** The chopsticks at her mouth (50,40). */
export const seatUp: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 17x15 at 44,40
    {
      x: 44,
      y: 40,
      grid: [
        '......((.........', // 40
        '.......((ppp.....', // 41
        '........(psssp...', // 42
        '..........ssSp...', // 43
        '.........pSsSp...', // 44
        '.........pJjJp...', // 45
        '..........J.Jwp..', // 46
        '..oooooookj..jwp.', // 47
        'oWW<<<<WWkj..jwkp', // 48
        'oW<<<<<<WkJ...wkp', // 49
        'o{WWWWWW{okJJJw..', // 50
        '.o{{{{{{o.kppppp.', // 51
        '..oooooow....kp_.', // 52
        '........wjjjj....', // 53
        '........wjjjjkp..', // 54
      ],
    },
  ],
}

/** Where the chopsticks' tips are on each (canvas pixels): the feast centres the food it picked (the morsel effect) there. */
export const tips: { seatPot: Point; seatBowl: Point; seatUp: Point } = { seatPot: { x: 88, y: 56 }, seatBowl: { x: 49, y: 48 }, seatUp: { x: 50, y: 40 } }
