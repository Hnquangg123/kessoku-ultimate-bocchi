// Nijika's feast faces, laid at her face box (16x10 at 42,30) like the face overlays: idlePot, halfPot and
// focusPot are idle, half and focus with each iris moved toward the pot on our right (the near iris over toward her
// nose, a white sliver W on its outer side; the far one past its glint, its glow following), for eating; bite is
// idle with the mouth opened wide as the chopsticks reach it (the tongue P), the eyes at us. The chewing after it is
// `happy`.

import type { Box, FeastFace, Grid } from '../../types'

/** Her near and far eye: where a pot-look face may differ from the face it comes from (checkArt holds them to it). */
export const eyes: readonly Box[] = [{ x: 44, y: 31, w: 4, h: 5 }, { x: 53, y: 33, w: 2, h: 3 }]

export const feastFaces: Readonly<Record<FeastFace, Grid>> = {
    idlePot: [
      'hhnnnnSssssSnnrh', // 30
      'nnWEEEnssssnEnrH', // 31
      'rnWWEMsssssWMnrH', // 32
      'rsWeeMssssssEnrH', // 33
      'rsWeeessssssWprH', // 34
      'rsssQQssssssQprH', // 35
      'hrssssssssssSprH', // 36
      'hrmsiWWWissSprrH', // 37
      'hhpmsiiisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    halfPot: [
      'hhhSSSSssssSrrrh', // 30
      'rssssssssssssprH', // 31
      'nsssssssssssspnH', // 32
      'rnnnnnnssssnnnrH', // 33
      'rsWWeMsssssWMprH', // 34
      'rssQQsssssssQprH', // 35
      'hrssssssssssSprH', // 36
      'hrmsiWWWissSprrH', // 37
      'hhpmsiiisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    focusPot: [
      'nhhSSSSssssSrrnh', // 30
      'nnnnnsssssssnnrH', // 31
      'rnWWEnnssssnMnrH', // 32
      'rsWeeMsssssWEnrH', // 33
      'rsWeeessssssWprH', // 34
      'rssssssssssssprH', // 35
      'hrssssssssssSprH', // 36
      'hrmiWWWWWisSprrH', // 37
      'hhpmsiiisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    bite: [
      'hhnnnnSssssSnnrh', // 30
      'nnEEEEnssssnEnrH', // 31
      'rnWEMEsssssWMnrH', // 32
      'rseeMessssseEnrH', // 33
      'rseeeessssseeprH', // 34
      'rssQQssssssQsprH', // 35
      'hrssssssssssSprH', // 36
      'hrmiiiiissSSprrH', // 37
      'hhpmiPPisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
}
