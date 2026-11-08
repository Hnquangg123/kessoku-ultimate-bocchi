// Bocchi's seated panic (a send held by Cache Tax: the bill came), patched on her seat: both hands up
// beside her head, palms out, fingers spread (near 25-32, far 60-67, rows 31-36), the ribbed cuffs, the forearms up
// from the elbows out at her sides (the jacket's stripes running down them), the jacket whole under where her
// forearms lay. The `panic` face goes over it.

import type { SeatPoseDef } from '../../types'

/** Both hands up beside her head, palms out (the bill came). */
export const seatPanic: SeatPoseDef = {
  from: 'seat',
  patches: [
    // 43x25 at 25,31
    {
      x: 25,
      y: 31,
      grid: [
        '.p.p.p.....................................', // 31
        'psppspp.............................pp.p.p.', // 32
        'psspspsp............................spspsp.', // 33
        'pssssssp............................sspspsp', // 34
        'pSssssSp............................ssssssp', // 35
        '.pSsssp.............................SssssSp', // 36
        '.pJjJjp.............................psSsSp.', // 37
        '.pjJjJp.............................pJjJjp.', // 38
        '.pjwjjp.............................pjJjJp.', // 39
        '.pjwjjp.............................pjjwjp.', // 40
        '.pjwjjj.............................pjjwjp.', // 41
        '.pjwjjjjp..........................pjjjwjp.', // 42
        '.pkjwjjjjjp.......................pjjjjwjp.', // 43
        '.pkjjwjjjjj.......................jjjjwjkp.', // 44
        '..pkjjwwjjjp....................pjjjjwjkp..', // 45
        '...pkkjjwwjpJJ..................jjjwwkkp...', // 46
        '....ppkkjjw.pkJ.j...............jjwkkpp....', // 47
        '......ppkk.jpkJjj................kppp......', // 48
        '........p.pppkJjj..........................', // 49
        '.........rrrpk.Jj..j..jjjwjjjkjj.kp_.......', // 50
        '.........rrrpkJ.jjjjjjjjjjw..k...kp_.......', // 51
        '.........rrrpkJjjjj.j.jjjjjw....kp_........', // 52
        '.........rrrpkJJ...j.jjjjjjwjjjj...........', // 53
        '.........rrrpk.jjjjjj.jjjjjwjjjjkp.........', // 54
        '..........rr.kJJjjjjjjjjjjj................', // 55
      ],
    },
  ],
}
