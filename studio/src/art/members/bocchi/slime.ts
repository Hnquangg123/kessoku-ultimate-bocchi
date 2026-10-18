// Bocchi's slime: her blob form, one of her acts on stage (a subagent), drawn
// from the user's two bead patterns and re-paletted into her hair's ramp
// (ART-BRIEF.md "The slimes"). `content` is the smiling one (29x18) bead for
// bead: her eyes shut (> <), the hair over the viewer's left with her clips,
// the blue cube (5-6, 2-3: b C over B b, lit at its upper right) over the
// yellow one (4-5, 4 and 4, 5: Y Z over q). `awake` is her open-eyed bead
// pattern's face (each eye a heavy lid two rows thick over a white eye, the
// anxious stare) redrawn on the same body, so one canvas and one timeline
// serve both: the two differ only inside `face`, the eyes' box (cols 7-20,
// rows 5-9). The active state shows her awake, idle and asleep content.
//
// Light from the upper right: the base h, a light rim H along the top-right
// curve and down her right side, a glint W W on the crown (15-16, 2), the
// shadow r down the left side and along the scalloped bottom, the outline o
// the band's near-black, the eye whites the band's white W. Laid on the 36x24
// slime canvas bottom-aligned and centred (at 3,6).

import type { SlimeArt } from '../../types'

export const slime: SlimeArt = {
  content: [
    '...........oooooooo..........',
    '..ooooo..oohhhhhHHooo........',
    '.ohhhbCoohhhhhhWWhhHoo.......',
    'ohhhhBbohhhhhhhhhhhhhHo......',
    'ohooYZohhhhhhhhhhhhhhhHo.....',
    '.o.oqohhhhhhhhhhhhoohhHo.....',
    '....ohhoohhhhhhhoohhhhhHo....',
    '....ohhhhohhhhhohhhhhhhHo....',
    '....orhoooohhhooooooohhhHo...',
    '....orhhhhhhhhhhhhhhhhhhHo...',
    '....orhhhhhhhhhhhhhhhhhhhho..',
    '....orhhhhhhhhhhhhhhhhhhhhho.',
    '....orhhhhhhhhhhhhhhhhhhhhhho',
    '....orhhhhhhhhhhhhhhhhhhhhhho',
    '....orhhhhhhhhhhhhhhhhhhhhhho',
    '....orhhhhrrrrrhhhhhrrrrhhhro',
    '....orrrrrooooorrrrroooorroo.',
    '.....ooooo.....ooooo....ooo..',
  ],
  awake: [
    '...........oooooooo..........',
    '..ooooo..oohhhhhHHooo........',
    '.ohhhbCoohhhhhhWWhhHoo.......',
    'ohhhhBbohhhhhhhhhhhhhHo......',
    'ohooYZohhhhhhhhhhhhhhhHo.....',
    '.o.oqohoooooohoooooohhHo.....',
    '....ohhoooooohoooooohhhHo....',
    '....ohhhoWWohhhoWWohhhhHo....',
    '....orhhoWWohhhoWWohhhhhHo...',
    '....orhhhoohhhhhoohhhhhhHo...',
    '....orhhhhhhhhhhhhhhhhhhhho..',
    '....orhhhhhhhhhhhhhhhhhhhhho.',
    '....orhhhhhhhhhhhhhhhhhhhhhho',
    '....orhhhhhhhhhhhhhhhhhhhhhho',
    '....orhhhhhhhhhhhhhhhhhhhhhho',
    '....orhhhhrrrrrhhhhhrrrrhhhro',
    '....orrrrrooooorrrrroooorroo.',
    '.....ooooo.....ooooo....ooo..',
  ],
  face: { x: 7, y: 5, w: 14, h: 5 },
}
