// Ryo's feast faces, overlays on her stand's own face (16x10 at 42,30; `.` keeps it) like her face
// overlays: idlePot, halfPot and focusPot are idle, half and focus with each iris moved toward the pot on our left
// (the white W on the right, the iris darkened on the left), for eating; bite is idle with the mouth open as the
// chopsticks reach it (x inside), the eyes at us. The chewing after it is `happy`.

import type { Box, FeastFace, Grid, Point } from '../../types'

/** Her near and far eye: where a pot-look face may differ from the face it comes from (checkArt holds them to it). */
export const eyes: readonly Box[] = [{ x: 46, y: 33, w: 3, h: 3 }, { x: 53, y: 33, w: 2, h: 3 }]

/** Where her weed hangs from (the weed effect's top-left: the blade's end in the corner of her mouth), for her cold: chewing it, half over seat, a row lower on the chew. */
export const weed: Point = { x: 50, y: 38 }

export const feastFaces: Readonly<Record<FeastFace, Grid>> = {
    idlePot: [
      '................', // 30
      '................', // 31
      '................', // 32
      '....MEW....EW...', // 33
      '....LLW.........', // 34
      '.....s..........', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    halfPot: [
      '................', // 30
      '....sss....ss...', // 31
      '................', // 32
      '....nnn....nn...', // 33
      '....LLW.........', // 34
      '...........E....', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    focusPot: [
      '................', // 30
      '....sss....ss...', // 31
      '................', // 32
      '....nnn....nn...', // 33
      '....MeW....eW...', // 34
      '....ss.....ss...', // 35
      '................', // 36
      '................', // 37
      '................', // 38
      '................', // 39
    ],
    bite: [
      '................', // 30
      '................', // 31
      '................', // 32
      '................', // 33
      '................', // 34
      '................', // 35
      '................', // 36
      '....mmm.........', // 37
      '....mxxm........', // 38
      '................', // 39
    ],
}
