// Nijika's seat at the hotpot table (the Hotpot's feast): at its left edge, near side, turned about 35 degrees toward
// the pot on our right, her face (stand's) to us; the sticks gone, her forearms folded on the table: the far one
// behind (its top on row 51, coming in from the elbow at 57-59), the near one over it (the white sleeve, its cuff's
// shade at 46-47), her hand resting on the far forearm (49-51, rows 53-55); the side tail hangs behind the far arm,
// past her waist (the table hides that part). Her vest runs a row longer than the others' jackets, so her waist is
// row 57 (the vest's ribbed hem).
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
  '[': '#c9d1d6', // the ladle's steel, lit (the band's chrome)
  ']': '#9babb2', // the ladle's steel, shade (the band's string metal t)
}

/** Her edge of the table: she turns toward the pot on our right. */
export const side = 'left' as const

/** The outer end of her waist row (row 57: the vest's left outline): the pixel the mod lays on the table's left edge. */
export const waist: Point = { x: 38, y: 57 }

/** Her hair's keys: her side tail, the only thing drawn below her waist (it hangs behind her far arm, past it). */
export const hair = 'hHrup'

/** Both hands resting on the table, the forearms folded, the sticks gone; patched on stand. */
export const seat: SeatPoseDef = {
  from: 'stand',
  patches: [
    // 43x43 at 26,51
    {
      x: 26,
      y: 51,
      grid: [
        '........qy.w...Y.....qqqqqqq.qqwyq.........', // 51
        '........qyww..w..qqqqqqpppwww..wyq.........', // 52
        '........qyyww..wwwwwyYqssSpyyyy.Yq.........', // 53
        '.........qYy.yyy.yyyYYqSsSpqqqqq.q.........', // 54
        '..........qYY.YYYYYYYYqSSSpvvvco_..........', // 55
        '...........qq.qqqqqqqqq.pppvVvco...........', // 56
        '............oVvVvVvVvVvVvVvVvVc............', // 57
        '..............___________________..........', // 58
        '..............___________________..........', // 59
        '............._____________________.........', // 60
        '............______________________.........', // 61
        '...........________________________........', // 62
        '.........._________________________........', // 63
        '.........__________________________........', // 64
        '........__________________________.........', // 65
        '.......___________________________.........', // 66
        '.......____________________________........', // 67
        '.......____________________________........', // 68
        '........____________________________.......', // 69
        '..........._________________________.......', // 70
        '...........__________.....__________.......', // 71
        '..........__________.......__________......', // 72
        '..........__________........_________......', // 73
        '.........._________.........._________.....', // 74
        '.........__________...........________.....', // 75
        '........._________............_________....', // 76
        '........__________............_________....', // 77
        '........_________..............________....', // 78
        '......._________...............________....', // 79
        '......_________................._______....', // 80
        '......________.................._______....', // 81
        '.....________....................______....', // 82
        '....________.....................______....', // 83
        '...________......................._____....', // 84
        '..________........................_____....', // 85
        '.________.........................._____...', // 86
        '.______............................______..', // 87
        '______.............................______..', // 88
        '______.............................______..', // 89
        '______............................._______.', // 90
        '_______............................________', // 91
        '_______............................._______', // 92
        '_______.............................._____.', // 93
      ],
    },
  ],
}
