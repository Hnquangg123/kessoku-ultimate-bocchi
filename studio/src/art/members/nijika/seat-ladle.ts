// Nijika with the ladle, patched on her seat (the nabe-bugyo serving, and topping the pot up at a
// ping): the far arm out over her tail toward the pot, the forearm rising, the hand on the steel ladle's handle, its
// cup down in the broth across the pot's side (93,33); the near forearm still on the table, the hand on it now.

import type { Point, SeatPoseDef } from '../../types'

/** The ladle in the pot (its cup at 93,33). */
export const seatLadle: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 49x25 at 47,32
    {
      x: 47,
      y: 32,
      grid: [
        '...........................................ooooo.', // 32
        '..........................................o[rrr[o', // 33
        '........................................[[o]rr]o.', // 34
        '......................................[[]]ooo....', // 35
        '....................................[[]].........', // 36
        '..................................[[]]...........', // 37
        '................................[[]].............', // 38
        '..........................ppp.[[]]...............', // 39
        '.....................qqqqpsssp]].................', // 40
        '..................qqqwwwwpsss[[p.................', // 41
        '...............qqqwwwwwwyqSsS]]..................', // 42
        '............qqqwwwwwwwyyYqpppp...................', // 43
        '.......__cw.wwwwwwwyyYYqq........................', // 44
        '.......__....wwwwyYYqqq..........................', // 45
        '.......__.yyyyyYYYqq.............................', // 46
        '......._.qYYYYqqqq...............................', // 47
        '.......vcuqq.q...................................', // 48
        '.......vcouu.....................................', // 49
        '.......vcouu.....................................', // 50
        'vcycvv.vcouuu....................................', // 51
        '.....vvvcouuu....................................', // 52
        '....._vvcoruu....................................', // 53
        '....._vvcoruu....................................', // 54
        '....._..co.......................................', // 55
        '....._...........................................', // 56
      ],
    },
  ],
}

/** Where the ladle's cup is (canvas pixels): where the broth she ladles pours. */
export const tips: { seatLadle: Point } = { seatLadle: { x: 93, y: 33 } }
