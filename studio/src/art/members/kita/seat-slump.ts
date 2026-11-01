// Kita slumped at the table (the cold), patched on her seat: her forearms dropped flat on the table
// toward the pot, the hands limp, palms down (Nijika's slump, mirrored); the head where her seat has it, so only the
// `melt` face tells the rest.

import type { SeatPoseDef } from '../../types'

/** Shoulders and arms dropped on the table, the hands limp. */
export const seatSlump: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 28x7 at 21,50
    {
      x: 21,
      y: 50,
      grid: [
        '.........PPPPP.P.lj.jjjjjjjJ', // 50
        '...PPPPPjjjjjjlP..lP........', // 51
        '.PSsssPJjjjjjjl.JJJPPPP.PPP.', // 52
        'PSsSsSPJJJJJJJP.PPPPSsss..P.', // 53
        'PPSPSPPPPPPPPPP._.J.sSsSsSP.', // 54
        '....................PPS.S..J', // 55
        '.....................PPPP__.', // 56
      ],
    },
  ],
}
