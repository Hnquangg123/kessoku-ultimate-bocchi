// Bocchi's seat at the hotpot table (the Hotpot's feast): at its left edge, far side, turned about 35 degrees toward the
// pot on our right, her face (stand's) to us; the guitar and its headstock gone, her forearms folded on the table: the
// far one behind (its top on row 50, coming in from the elbow at 57-60), the near one over it (the jacket's white
// stripe running down the upper arm and along the forearm's top, the ribbed cuff at 45-47), her hand resting on the
// far forearm, half in the long sleeve (48-50, rows 52-54). The jacket's zipper slants with the turn (col 49 under
// the collar, 52 at the waist); her long hair falls past the waist on the left, outside the table.
//
// The table's left edge runs across her lap: the mod lays `waist` (the outer end of her body's waist row, the
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

/** Her edge of the table: she turns toward the pot on our right. */
export const side = 'left' as const

/** The outer end of her waist row (row 56: the jacket's left outline): the pixel the mod lays on the table's left edge. */
export const waist: Point = { x: 37, y: 56 }

/** Her hair's keys: the only thing drawn below her waist and outward of `waist` on row 56 (her long hair falls past both; its outline p is her jacket's too). */
export const hair = 'hHrp'

/** Both hands resting on the table, the forearms folded, the guitar gone; patched on stand. */
export const seat: SeatPoseDef = {
  from: 'stand',
  patches: [
    // 52x56 at 26,38
    {
      x: 26,
      y: 38,
      grid: [
        '................................................_...', // 38
        '.............................................._____.', // 39
        '............................................_______.', // 40
        '..........................................._________', // 41
        '..........................................__________', // 42
        '........................................____________', // 43
        '......................................______________', // 44
        '...................................._______________.', // 45
        '................................_._______________...', // 46
        '................................p_________...._.....', // 47
        '......................jwjj.....kp_______............', // 48
        '.............j.k...Jjjjwjjj..jjjkp______............', // 49
        '.......pjwj...kkJ..jjppppppppppjjkp_____............', // 50
        '.......pj........ppppppppjjjjjjjjkp_____............', // 51
        '.......pk...wwwwwwjJjJssSpjjjjjjkp_____.............', // 52
        '.......pkJ..j..jjjJjJssspJJJJJJ.p_____..............', // 53
        '........pkJJJJ.J.JkJjJSsSpppp..p_____...............', // 54
        '.......rrpp.pppppppp.pppppwjjjk.___.................', // 55
        '.......rrrrpk..jjjjjjjjjjjwjjjkp___.................', // 56
        '......p_____________________________................', // 57
        '......p_____________________________................', // 58
        '......p_____________________________................', // 59
        '......p______________________________...............', // 60
        '......p______________________________...............', // 61
        '.......p_____________________________...............', // 62
        '.......p_____________________________...............', // 63
        '........p____________________________...............', // 64
        '........p____________________________...............', // 65
        '.......p_____________________________...............', // 66
        '.......p____________________________................', // 67
        '.......p___________________________.................', // 68
        '........____________________________................', // 69
        '..........._________________________................', // 70
        '...........__________.....__________................', // 71
        '..........__________.......__________...............', // 72
        '..........__________........_________...............', // 73
        '.........._________.........._________..............', // 74
        '.........__________...........________..............', // 75
        '........._________............_________.............', // 76
        '........__________............_________.............', // 77
        '........_________..............________.............', // 78
        '......._________...............________.............', // 79
        '......_________................._______.............', // 80
        '......________.................._______.............', // 81
        '.....________....................______.............', // 82
        '....________.....................______.............', // 83
        '...________......................._____.............', // 84
        '..________........................_____.............', // 85
        '.________.........................._____............', // 86
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
