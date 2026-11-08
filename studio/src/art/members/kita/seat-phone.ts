// Kita photographing the pot (a feast: "So photogenic!"), patched on her seat: leaning in, she carries
// the phone out and down over the pot's right rim in both hands, its back to us in a Pelham Blue case (her guitar's
// blue: a, A, i) tilted down into the pot, the lens and its glint at its lower end (8,38: the flash bursts there, over
// the rim in the scene); the near hand round its upper end, the far one under it by the lens, their ribbed cuffs; both
// arms bent at the elbow, the far one behind her left flip, the near one across in front of her from the dropped near
// shoulder; the cardigan whole under where her forearms lay, its near side drawn in toward the pot (from 56 under her
// hair to the waist's 60). The head is stand's, untouched, and nothing moves it.

import type { Point, SeatPoseDef } from '../../types'

/** Leaning in, the phone carried out and down over the pot's right rim in both hands (its lens at 8,38). */
export const seatPhone: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 57x26 at 6,30
    {
      x: 6,
      y: 30,
      grid: [
        '..............PP.........................................', // 30
        '............PPaaP........................................', // 31
        '..........PPaaAAP........................................', // 32
        '........PPaaAAAAiP.......................................', // 33
        '......PPaaAAAAAAPPP......................................', // 34
        '....PPaaAAAAAAiPsssP.....................................', // 35
        '..PPaaAAAAAAiiPSsssP.....................................', // 36
        'PPaaAAAAAAiiPPPSsSsP.....................................', // 37
        'PaWoAAAAiIPP...PPSsPPP...................................', // 38
        '.PooAAiPPP......PJjPllP..................................', // 39
        '.PAAiIPsssP.......PJjllP.................................', // 40
        '..PIPPSsssPP......PJJjllPP...............................', // 41
        '..PP.PSsSsPlPP.....PPJJjllP..............................', // 42
        '......PPJjPlllP......PJJjllPP............................', // 43
        '.........PJJJllPP.....PPJJjllP...........................', // 44
        '..........PPJJjllP......PJJjllPP.........................', // 45
        '............PPJJllPP.....PJJjjllPjjkj..J.......jJlP_____.', // 46
        '..............PJJjllP.....PPJJjllPjk.j.J.......PPPPP____.', // 47
        '...............PPJJl.........J...lPP..jJ..jPPPPllllPP___.', // 48
        '.................PJJJ......._.PJJ.llP..PPPPlllljj..P..P_.', // 49
        '..................PPJJjlPPP..__PJJjll..llll..j.jJJJPlP___', // 50
        '....................PPJPP....__PPPJJ.ll.jjjjJJJJ.PP..lP__', // 51
        '.....................PPP......_PJ.PJJ.lPJJ.JPPPPjjjjj.lP_', // 52
        '.............................._P..jP..jPPPPPj..........P_', // 53
        '..............................PJJjjj...PjjL.jjjjjjjjjjP_.', // 54
        '..............................PJJj....jjjjjjjjjjjjjjjj...', // 55
      ],
    },
  ],
}

/** Where the phone's lens is (canvas pixels): the feast centres her flash there. */
export const tips: { seatPhone: Point } = { seatPhone: { x: 8, y: 38 } }
