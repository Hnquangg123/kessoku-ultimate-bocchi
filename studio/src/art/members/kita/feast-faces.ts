// Kita's feast faces, laid at her face box (16x10 at 42,30) like the face overlays: idlePot, halfPot and
// focusPot are idle, half and focus with each iris moved toward the pot on our left (the irises over to the outer
// corners, the whites W on the inner side), for eating; bite is idle with the mouth opened wide as the chopsticks
// reach it (the bow's b inside, R the tongue), the eyes at us. The chewing after it is `happy`.

import type { Box, FeastFace, Grid } from '../../types'

/** Her near and far eye: where a pot-look face may differ from the face it comes from (checkArt holds them to it). */
export const eyes: readonly Box[] = [{ x: 45, y: 33, w: 4, h: 3 }, { x: 53, y: 33, w: 2, h: 3 }]

export const feastFaces: Readonly<Record<FeastFace, Grid>> = {
    idlePot: [
      'rHhhhhhhhhrrhhhr', // 30
      'rnnnnnnrrrsnnprh', // 31
      'rsnnnnnssrsnnnrH', // 32
      'rsnMEEWSSrSMWnrr', // 33
      'rsneeWQSSSSeWnrr', // 34
      'rsseLsSSSSSELprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    halfPot: [
      'rHhhhhhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rnnnnnnssrsnnprH', // 32
      'rsnnnnnSSrSnnnrr', // 33
      'rsnEeWWSSSSEWnrr', // 34
      'rsssssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    focusPot: [
      'rHhhhhhhhhrrhhhr', // 30
      'rnnnnssrrrssnprh', // 31
      'rsnnnnnssrsnnnrH', // 32
      'rsnMnnnSSrSnWnrr', // 33
      'rsneeWQSSSSeWnrr', // 34
      'rsssssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSssmmsssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    bite: [
      'rHhhhhhhhhrrhhhr', // 30
      'rnnnnnnrrrsnnprh', // 31
      'rsnnnnnssrsnnnrH', // 32
      'rsnWMEESSrSMEnrr', // 33
      'rsnQeeWSSSSeWnrr', // 34
      'rssseLSSSSSeLprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsbbbssssprrr', // 37
      'hhpmSbRRbSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
}
