// Kita slumped at the table (the cold), patched on her seat: Nijika's slump mirrored, her shoulders dropped,
// sloping from under her hair down to the elbows on the table (the near elbow out at her side, the far upper arm in
// front of her flip), the forearms flat on the table toward the pot, the hands limp, palms down; the head where her
// seat has it, so the `melt` face tells the rest.

import type { SeatPoseDef } from '../../types'

/** Shoulders dropped, sloping down to the elbows; the forearms flat on the table toward the pot, the hands limp. */
export const seatSlump: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 46x11 at 17,46
    {
      x: 17,
      y: 46,
      grid: [
        '......................................lP_____.', // 46
        '.................PJj.lkj...............lP____.', // 47
        '................PJjjlk.j................lP___.', // 48
        '...............PJjjlkj.j.................lP__.', // 49
        '.........PPPPPPPPP.P.lj.jjjjjjjJ..........lP__', // 50
        '...PPPPPjjjjjjjjjjlP..lP..............PPPP..P_', // 51
        '.PSsssPJjjjjjjjjjlPJJJJPPPP.PPP...............', // 52
        'PSsSsSPJJJJJJJJJJJP.PPPPSsss..P...............', // 53
        'PPSPSPPPPPPPPPPPPPP._.J.sSsSsSP...............', // 54
        '........................PPS.S..J..............', // 55
        '.........................PPPP__...............', // 56
      ],
    },
  ],
}
