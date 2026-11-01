// Bocchi's feast faces, laid at her face box (16x10 at 42,30) like the face overlays: idlePot, halfPot and
// focusPot are idle, half and focus with each iris moved toward the pot on our right (the near iris over to the
// inner corner, its white W on the outer side; the far one past its glint), for eating; bite is idle with the
// mouth open as the chopsticks reach it (the jacket's K inside, k the tongue), the eyes at us. The chewing after it
// is `happy`.

import type { Box, FeastFace, Grid } from '../../types'

/** Her near and far eye: where a pot-look face may differ from the face it comes from (checkArt holds them to it). */
export const eyes: readonly Box[] = [{ x: 45, y: 33, w: 4, h: 3 }, { x: 53, y: 33, w: 2, h: 3 }]

export const feastFaces: Readonly<Record<FeastFace, Grid>> = {
    idlePot: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhnnnnrrrsnnprh', // 31
      'rnnnnnnssssnnnrH', // 32
      'rnnWQMMSSSSnLnrr', // 33
      'rsnWWEESSSSWEnrr', // 34
      'rsssseeSSSSWeprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
    halfPot: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rssnnnnssssnnprH', // 32
      'rnnnnnnSSSSnnnrr', // 33
      'rnnWWEESSSSWEnrr', // 34
      'rsnsssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
    focusPot: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhnnssrrrssnprh', // 31
      'rnnnnnnssssnnnrH', // 32
      'rnnWQnnSSSSnLnrr', // 33
      'rsnWWEESSSSWEnrr', // 34
      'rsssssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSssssSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
    bite: [
      'rHhhhHhhhhrrhhhr', // 30
      'rhhnnnnrrrsnnprh', // 31
      'rnnnnnnssssnnnrH', // 32
      'rnnQMLMSSSSnLnrr', // 33
      'rsnWEEESSSSEWnrr', // 34
      'rssseeSSSSSeWprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSmmmssssSprrr', // 37
      'hhpmKkKmsSpprrrr', // 38
      'hhpJmmmmpprrrrrH', // 39
    ],
}
