// Ryo eating at the table, patched on her seat, arms and what they hold only: the far forearm folded across
// her lifts away (the sweater under it), her torizara in the near hand at the end of the near forearm still on the
// table (the plate 41-50, rows 47-52), and the far hand with the chopsticks (Bocchi's reach, mirrored):
//   seatPot   the far arm out from under her bob toward the pot, the chopsticks' tips at its back rim (7,56: the
//             scene's row 112, the last her lap clip leaves her)
//   seatBowl  the far forearm up from the elbow at her side, the chopsticks down into the plate
//   seatUp    the hand raised under her chin, the tips at her mouth (47,40: just under the face box)
// The plate and the near arm are the same in all three, so an eating loop changes only the far arm.

import type { Point, SeatPoseDef } from '../../types'

/** Her torizara in the near hand, the chopsticks in the pot (their tips at its back rim, 7,56). */
export const seatPot: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 44x10 at 7,47
    {
      x: 7,
      y: 47,
      grid: [
        '.........................KKKjj......ooooooo.', // 47
        '......................KKKjjjkkkk.joWW<<<<WWo', // 48
        '...................KKKjjjkkkjj...JoW<<<<<<Wo', // 49
        '...............pppJjJjkkkjjjjj..JJo{WWWWWW{o', // 50
        '............(((psspJjJjjjjjjjJJJJJKo{{{{{{o.', // 51
        '.........((())pSsspJjJjjJJJJJ.KKJ...oooooo..', // 52
        '......((())...pSsSpJjJJJKKKKK__K.jjjjj......', // 53
        '...((())......pppppKKKKK......_.Jjjjjj......', // 54
        '.(()).......................................', // 55
        '()..........................................', // 56
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
        '....ppp..........', // 43
        '...pSssp.........', // 44
        '...psssp((.......', // 45
        '...pSsSp.((......', // 46
        '...KJ.JK.o((oooo.', // 47
        '...K.Jj.KW<<(<WWo', // 48
        '......kKW<<<<<<Wo', // 49
        'KJj..jk.{WWWWWW{o', // 50
        'KJjjjjJKo{{{{{{o.', // 51
        'KKJJJJJK.oooooo..', // 52
        '.K.KKKKKjjj......', // 53
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
        '.......ppp((.....', // 41
        '.....psssp(......', // 42
        '.....pSssp.......', // 43
        '.....pSsSp.......', // 44
        '.....KJj.K.......', // 45
        '....KjJ..K.......', // 46
        '...K..jj.kKooooo.', // 47
        '......jjkK<<<<WWo', // 48
        '......jj.K<<<<<Wo', // 49
        'K.JJJJJJ.WWWWWW{o', // 50
        'K.KKKKKKK{{{{{{o.', // 51
        'KJJJJJK..oooooo..', // 52
        '.K.KKKjjjjj......', // 53
        '..._.Jjjjjj......', // 54
      ],
    },
  ],
}

/** Where the chopsticks' tips are on each (canvas pixels): the feast centres the food it picked (the morsel effect) there. */
export const tips: { seatPot: Point; seatBowl: Point; seatUp: Point } = { seatPot: { x: 7, y: 56 }, seatBowl: { x: 46, y: 48 }, seatUp: { x: 47, y: 40 } }
