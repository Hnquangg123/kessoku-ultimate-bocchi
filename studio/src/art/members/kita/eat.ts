// Kita eating at the table, patched on her seat, arms and what they hold only: the far forearm folded across
// her lifts away (the cardigan under it), her torizara in the near hand at the end of the near forearm still on the
// table (the plate 41-50, rows 47-52), and the far hand with the chopsticks:
//   seatPot   the far arm out toward the pot, the forearm rising, the long cooking chopsticks in across the pot's
//             side, the tips in the food (3,31: she sits in front of the pot, drawn after it); her left flip hangs
//             in front of the arm
//   seatBowl  the far forearm up from the elbow at her side, the chopsticks down into the plate
//   seatUp    the hand raised under her chin, the tips at her mouth (47,40: just under the face box)
// The plate and the near arm are the same in all three, so an eating loop changes only the far arm.

import type { Point, SeatPoseDef } from '../../types'

/** Her torizara in the near hand, the long chopsticks in the pot (their tips in the food, 3,31). */
export const seatPot: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 48x24 at 3,31
    {
      x: 3,
      y: 31,
      grid: [
        '))..............................................', // 31
        '()))............................................', // 32
        '.(())...........................................', // 33
        '..(())..........................................', // 34
        '....(())........................................', // 35
        '......(())......................................', // 36
        '........(())....................................', // 37
        '..........(())...PPP............................', // 38
        '............()P(sssPllll........................', // 39
        '.............PSsssPjjjlPPP......................', // 40
        '.............PSsSPJjjjjjjlPP....................', // 41
        '...............PPPPJJjjjjjjj....................', // 42
        '.....................kkJjjjj.....lP.............', // 43
        '.......................PPJjj.....lP.............', // 44
        '.........................PP.....jjlP............', // 45
        '.................................PP__P..........', // 46
        '................................_____P..ooooooo.', // 47
        '..............................._____PJoWW<<<<WWo', // 48
        '..............................._____PJoW<<<<<<Wo', // 49
        '................................___PJ_o{WWWWWW{o', // 50
        '................................___PJ..o{{{{{{o.', // 51
        '.................................__PJ...oooooo..', // 52
        '.................................__P.jjjjj......', // 53
        '.................................._.Jjjjjj......', // 54
      ],
    },
  ],
}

/** The chopsticks at the torizara (46,48). */
export const seatBowl: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 17x12 at 34,43
    {
      x: 34,
      y: 43,
      grid: [
        '....PPP..........', // 43
        '...PSssP.........', // 44
        '...PsssP((.......', // 45
        '...PSsSP.((......', // 46
        '...PJjJP.o((oooo.', // 47
        '...PjJjJPW<<(<WWo', // 48
        '....j.lPW<<<<<<Wo', // 49
        'PJj..jl.{WWWWWW{o', // 50
        'PJj...JPo{{{{{{o.', // 51
        'PPJJJJJP.oooooo..', // 52
        '.P.PPPPPjjj......', // 53
        '..._.Jjjjjj......', // 54
      ],
    },
  ],
}

/** The chopsticks at her mouth (47,40). */
export const seatUp: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 17x15 at 34,40
    {
      x: 34,
      y: 40,
      grid: [
        '............((...', // 40
        '.......PPP((.....', // 41
        '.....PsssP(......', // 42
        '.....PSssP.......', // 43
        '.....PSsSP.......', // 44
        '.....PJjJP.......', // 45
        '....PjJ..P.......', // 46
        '...P.jj..lPooooo.', // 47
        '....j.j.lP<<<<WWo', // 48
        '....j.j.JP<<<<<Wo', // 49
        'P.JJJJJJ.WWWWWW{o', // 50
        'P.PPPPPPP{{{{{{o.', // 51
        'PJJJJJP..oooooo..', // 52
        '.P.PPPjjjjj......', // 53
        '..._.Jjjjjj......', // 54
      ],
    },
  ],
}

/** Where the chopsticks' tips are on each (canvas pixels): the feast centres the food it picked (the morsel effect) there. */
export const tips: { seatPot: Point; seatBowl: Point; seatUp: Point } = { seatPot: { x: 3, y: 31 }, seatBowl: { x: 46, y: 48 }, seatUp: { x: 47, y: 40 } }
