// Kita's seat at the hotpot table (the Hotpot's feast): at its right edge, near side, turned about 35 degrees toward
// the pot on our left (the body mirrored under stand's head), her face to us; the guitar gone, the camel cardigan's
// forearms folded on the table: the far one behind (its top on row 50, coming in from the elbow at 35-38), the near
// one over it (lit along its top, the ribbed cuff at 48-50), her hand resting on the far forearm (45-47, rows
// 52-54), the cardigan's buttons down its front. Her hair flips out at her shoulders: nothing past her waist.
//
// The table's right edge runs across her lap: the mod lays `waist` (the outer end of her body's waist row, the
// same pixel in every seat pose) on it and clips the table nearer than her waist out of her figure, so below the
// waist only hair is drawn, and all of her lives in rows 6-69 (the feast window, 96x64). Stand's head is untouched,
// face box and all (checkArt holds every seat pose to it), so every face overlay and feast face fits. The patches
// are generated from full drafts, so every pixel they hold differs from stand.

import type { Palette, Point, SeatPoseDef } from '../../types'

/** The props her hands hold at the table, the same for the band (every value already one of the sprites' colors): the chopsticks, the torizara (the white glaze is W, its rim the outline o), the ladle. */
export const colors: Palette = {
  '(': '#e5b789', // chopstick wood, lit (Nijika's stick wood a)
  ')': '#c4935f', // chopstick wood, shade (Nijika's stick shade T)
  '{': '#4f74ca', // the torizara's blue band (Bocchi's clip B)
  '<': '#c7d0e8', // the torizara's glaze in shade (Bocchi's zipper grey-blue y)
}

/** Her edge of the table: she turns toward the pot on our left. */
export const side = 'right' as const

/** The outer end of her waist row (row 56: the cardigan's right outline): the pixel the mod lays on the table's right edge. */
export const waist: Point = { x: 60, y: 56 }

/** Both hands resting on the table, the forearms folded, the guitar gone; patched on stand. */
export const seat: SeatPoseDef = {
  from: 'stand',
  patches: [
    // 52x58 at 26,36
    {
      x: 26,
      y: 36,
      grid: [
        '.................................._.................', // 36
        '.................................._............._...', // 37
        '..................................__.........._____.', // 38
        '..................................___......._______.', // 39
        '..................................___......_________', // 40
        '..................................____....__________', // 41
        '..................................____..____________', // 42
        '..................................__________________', // 43
        '............................j........______________.', // 44
        '............................lJj.ppppp____________...', // 45
        '.............lkjJJJjjj.....Jk...ljj.______...._.....', // 46
        '.............lk..JJ....jjjjJkj.jljj.____............', // 47
        '.........PJ.ljk.jjJ..jLjjjjJkjjjjljP____............', // 48
        '.........PJ...kjj.jjjjjjjjjJkjjjjljP____............', // 49
        '........_Plj.PP..PPPPPPjjJjJkjjjjjll.___............', // 50
        '........_P......jjjPPPPPPPPPPjjjjjllP__.............', // 51
        '........__Plj..jjj.SssJjJjllllllljjlP_..............', // 52
        '........__.lJ.J.JJPsssJjJjjjjjjjjjJl................', // 53
        '.......____.PPPPPPPSsSJjJkJJJJJJ.Jl.................', // 54
        '......._____..jjjjPP.PPPPPPPPPPPPPP_................', // 55
        '......____PjJjJjJjJjJjJjJjJjJjJj.j..................', // 56
        '......___________________________...................', // 57
        '......___________________________...................', // 58
        '......___________________________...................', // 59
        '......____________________________..................', // 60
        '.......___________________________..................', // 61
        '.......____________________________.................', // 62
        '.......____________________________.................', // 63
        '.......____________________________.................', // 64
        '.......___________________________..................', // 65
        '.......___________________________..................', // 66
        '.......____________________________.................', // 67
        '.......____________________________.................', // 68
        '........____________________________................', // 69
        '..........._________________________................', // 70
        '...........__________.....__________................', // 71
        '..........__________.......__________...............', // 72
        '..........__________........_________...............', // 73
        '.........._________.........._________..............', // 74
        '.........__________...........________..............', // 75
        '........._________............_________.............', // 76
        '........__________............_________.............', // 77
        '.......___________............__________............', // 78
        '......____________............___________...........', // 79
        '.....____________..............__________...........', // 80
        '.....___________................________............', // 81
        '....___________.................________............', // 82
        '...__________...................._______............', // 83
        '..__________....................._______............', // 84
        '.__________.......................______............', // 85
        '.________.........................______............', // 86
        '.______............................______...........', // 87
        '______.............................______...........', // 88
        '______.............................______...........', // 89
        '______............................._______..........', // 90
        '_______............................________.........', // 91
        '_______............................._______.........', // 92
        '_______.............................._____..........', // 93
      ],
    },
  ],
}
