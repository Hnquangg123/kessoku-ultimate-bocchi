// Nijika slumped at the table (the cold), patched on her seat: her forearms dropped flat on the table
// toward the pot, the hands limp, palms down (the near one past where it rested, the far one at the end of the far
// forearm stretched along the table from the elbow at her side); the head where her seat has it, so only the
// `melt` face tells the rest. The headband stays on while keepwarm runs.

import type { SeatPoseDef } from '../../types'

/** Shoulders and arms dropped on the table, the hands limp. */
export const seatSlump: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 28x7 at 47,50
    {
      x: 47,
      y: 50,
      grid: [
        '............qqqqqqq.........', // 50
        'vcycvv..Yyyqwwwwwwwyqpppp...', // 51
        '..q..pppYyyqyywwwwwyyqssssp.', // 52
        '....sssSpYYqYyyyyyyyYqSsSsSp', // 53
        '.....sSsp....qqqqqqqqqpSpSpp', // 54
        '..p.pSpp...._...............', // 55
        '............_...............', // 56
      ],
    },
  ],
}
