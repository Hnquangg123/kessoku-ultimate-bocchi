// Nijika slumped at the table (the cold), patched on her seat: her shoulders dropped, sloping from under
// her hair down to the elbows on the table (the near elbow out at her side, the far upper arm in front of her tail),
// the forearms flat on the table toward the pot, the hands limp, palms down (the near one past where it rested, the
// far one at the end of the far forearm stretched along the table); the head where her seat has it, so the `melt`
// face tells the rest. The headband stays on while keepwarm runs.

import type { SeatPoseDef } from '../../types'

/** Shoulders dropped, sloping down to the elbows; the forearms flat on the table toward the pot, the hands limp. */
export const seatSlump: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 47x14 at 32,43
    {
      x: 32,
      y: 43,
      grid: [
        '....___...................o....................', // 43
        '....___q..................qu...................', // 44
        '...___q....................qu..................', // 45
        '..___qy..................y.....................', // 46
        '..__qy...................y..wq.................', // 47
        '.._q.y.....................wwwq................', // 48
        '..qy.w.................Yyywwwwwq...............', // 49
        '.qyyww...................q.qqqqqqqqqqqq........', // 50
        '.qy.w..........vcycvv..Yyywwwwwwwwwwwwwyqpppp..', // 51
        'qyyqqqqqqq.......q..pppYyy.wwwwwwwwwwwwyqssssp.', // 52
        'qywww..............sssSpYY.yyyyyyyyyyyyYqSsSsSp', // 53
        'qYyyy...............sSsp....qqqqqqqqqqqqqpSpSpp', // 54
        '.qYYY............p.pSpp...._...................', // 55
        '..qqq......................_...................', // 56
      ],
    },
  ],
}
