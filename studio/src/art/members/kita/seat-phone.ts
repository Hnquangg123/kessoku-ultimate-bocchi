// Kita photographing the pot (a feast: "So photogenic!"), patched on her seat: the phone held out
// toward the pot in both hands, its back to us in a Pelham Blue case (her guitar's blue: a, A, i), the lens and its
// glint at its top left (23,31: the flash bursts there), her hands on its lower corners; the far arm bent up from
// the elbow at her side, the near one reaching across in front of her, her shoulders leaning in; the cardigan whole
// under where her forearms lay. (Her arms reach no further than this: the phone is held out toward the pot, at the
// right of its rim in the scene, as the prototype held it.)

import type { Point, SeatPoseDef } from '../../types'

/** The phone held out toward the pot in both hands (its lens at 23,31). */
export const seatPhone: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 44x26 at 19,30
    {
      x: 19,
      y: 30,
      grid: [
        '....PPPPPPPPP...............................', // 30
        '...PoWaaaaaaaP..............................', // 31
        '...PooaaaaaaAP..............................', // 32
        '...PaaAAAAAAAP..............................', // 33
        '.PPPAAAAAAAAiPP.............................', // 34
        'PssPiiiiiiiiPssP............................', // 35
        'PsssPPPPPPPPSssP............................', // 36
        'PSssSP....PSssSP............................', // 37
        '.PSsSP.....PSsSP............................', // 38
        '..PPPlP....PPPPlP...........................', // 39
        '...PJjlP....PJJllPP.........................', // 40
        '....PJjlP....PJJjllP........................', // 41
        '.....PJjlP....PPJJllPP......................', // 42
        '......PJjlP.....PJJlllP............PPPP.....', // 43
        '.......PJjlP......JJJllP.......PPPPllllP....', // 44
        '........PJj......lPPJJ.lPP..PPPlllljj.jP....', // 45
        '.........P......lj..PJJjllPPllll..jjJJJPl.jP', // 46
        '................J.JJJPPJ.llP....JJ.JPPPjl.jP', // 47
        '.................PPPPjkPJ..lPJJJJPPPk...jljP', // 48
        '...............___PJ.j..PPJPJPPPP.jj....jl..', // 49
        '................__PJjjjjj....j..j.jj......P_', // 50
        '................__PJ......jjjLjjjjjj......P_', // 51
        '................._PJ.....jjjjj.j.jjjjjjj.lP_', // 52
        '................._P..jjjjjjjjj.j..........P_', // 53
        '.................PJJjjjjjjjjjL.jjjjjjjjjjP_.', // 54
        '.................PJJj....jjjjjjjjjjjjjjjj...', // 55
      ],
    },
  ],
}

/** Where the phone's lens is (canvas pixels): the feast centres her flash there. */
export const tips: { seatPhone: Point } = { seatPhone: { x: 23, y: 31 } }
