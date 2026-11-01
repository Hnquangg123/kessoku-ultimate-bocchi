// Ryo pointing (last orders: "That one's mine."), patched on her seat: the far arm straight out over
// the table, the hand lifted, the chopsticks angled steeply down over the pot's back rim at the last piece (their
// tips at the rim, 9,56; the pot hides anything past it); her torizara still in the near hand.

import type { Point, SeatPoseDef } from '../../types'

/** The chopsticks pointing at the last piece in the pot (their tips at its back rim, 9,56). */
export const seatPoint: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 42x12 at 9,45
    {
      x: 9,
      y: 45,
      grid: [
        '..........ppp.............................', // 45
        '.........pssspKKKKKKKKKK..................', // 46
        '........psssSpJjJkkkkkkkkj.____...ooooooo.', // 47
        '.......)pSssSpjJjjjjjjjjjjjjK_KJoWW<<<<WWo', // 48
        '......))pSsSpJjJjjjjjjjjjjJ.K_KJoW<<<<<<Wo', // 49
        '.....))(pppKKKJJJJJJJJJJJJ.__KJ_o{WWWWWW{o', // 50
        '.....((.......KKKKKKKKKKKK.__KJjjo{{{{{{o.', // 51
        '....(((....................__KJ...oooooo..', // 52
        '...(().....................__K.jjjjj......', // 53
        '..(()......................._.Jjjjjj......', // 54
        '.(()......................................', // 55
        '()........................................', // 56
      ],
    },
  ],
}

/** Where the chopsticks' tips are on each (canvas pixels): the feast centres the food it picked (the morsel effect) there. */
export const tips: { seatPoint: Point } = { seatPoint: { x: 9, y: 56 } }
