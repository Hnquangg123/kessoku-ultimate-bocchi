// Kita's strum, as patches on her stand: Bocchi's strum (bocchi/play.ts) ported
// one row up (Kita's guitar and picking arm sit one row higher than Bocchi's),
// so the band strums with one arm. The head and the hair stay pixel-identical
// (checkArt holds the face region to stand's, and the sway overlays must fit
// stand, playA and playB), so nothing here touches the head, the hair or
// anything left of col 36 (the side lock, the sleeve's outer contour at cols
// 34-35, the guitar's left rim). The elbow stays where stand has it; the forearm
// swings about it and the hand turns at the wrist.
//
// playA, the upstroke: the fist 6 rows up (skin rows 47-51, cols 41-45),
// cocked back at the wrist and tilted, its outline P 42-43,46 / 41,47 / 40,48,
// the knuckle line S 43,47 / 45,49 / 44,50-51. The ribbed cuff (J with a j
// centre, as on stand) slants at 39-42, rows 49-51; the forearm folds over the
// upper arm with a K edge at 38,49 / 39,48, so the upper arm's light ridge l
// shows above it (41,46 / 40,47) and at the elbow (37,50 / 36,51). The
// forearm's underside runs P along row 52 (39-44) into the elbow's P at
// 36-38,53, covering the guitar's top edge as Bocchi's does; its cast shadow i
// falls at 41-42,53. The horn passes behind the fist, the crevice at 46,48 K.
// The body the hand uncovers is plain Pelham Blue A, and the black P-90 is
// whole again (GGGG / GttG / GGGG at 38-41, rows 57-59).
// playB, the follow-through: the fist 4 rows down (skin rows 57-61, cols
// 41-45), flicked the other way, its right side against the guard's tip. The
// forearm runs down cols 37-43 from stand's elbow, covering the P-90; the
// light ridge turns round the elbow (36,51 / 37,52 / 38,53) and runs down col
// 39 (rows 54-56) to the ribbed cuff (rows 57-59). The inner contour has a crook
// at the elbow (in to col 41 at rows 51-52, the guitar's edge o/a passing
// behind it at 42-44, rows 50-52, then out to 43) with a k crease at 40,51 and a
// K fold at 42,56. Cast shadow i at 39,61 and 40,62.
// The fretting hand lives too: in playA the little finger comes down on the
// fretboard (65,45-46), inside the neck; playB keeps stand's hand.
//
// Drawn in the stand's hand: the cardigan ramp l/j/J/k/K outlined in P, the
// skin s/S with its knuckle line, the guitar's A/i/a with the black G parts
// and the o outline. No colors of its own.
//
// Checked on the polished stand: none of the review's 23 touched pixels lies
// under these patches, so both poses inherit them as they are (the elbow's
// silhouette at 34,52, the collar stripe, the far lock on the neck, the
// cutaway's shade run at 53,48 / 51,49, the lower horn at 58-59,51), and
// index.ts needs no carry for play.

import type { PoseDef } from '../../types'

export const playA: PoseDef = {
  from: 'stand',
  patches: [
    // the picking arm, the hand and the guitar it uncovers: 10x13 at 37,46
    {
      x: 37,
      y: 46,
      grid: [
        '.....PP...', // 46
        '....PsSP..', // 47
        '..KPssssPK', // 48
        '.KJJssssSP', // 49
        '..J.JssSsP', // 50
        '...J.JsSP.', // 51
        '..PPPP....', // 52
        'PPAAiiAAA.', // 53
        'AAAAAAAAAA', // 54
        '.AAAAAAAAA', // 55
        '..AAAAAAAA', // 56
        '....GAAAA.', // 57
        '.....AAA..', // 58
      ],
    },
    // the fretting hand: 1x2 at 65,45
    {
      x: 65,
      y: 45,
      grid: [
        'P', // 45
        's', // 46
      ],
    },
  ],
}

export const playB: PoseDef = {
  from: 'stand',
  patches: [
    // the picking arm, the hand and the guitar it uncovers: 10x12 at 37,51
    {
      x: 37,
      y: 51,
      grid: [
        '...kPo....', // 51
        'l...PaAA..', // 52
        '.lj..PAAA.', // 53
        '..l.jjPAAA', // 54
        'PjljjjPAAA', // 55
        'PjljJKPPPA', // 56
        'PjJJjJJ.SP', // 57
        'PjJjJssssP', // 58
        '.PJJssssSP', // 59
        '..PPsssSP.', // 60
        '..iPsSsP..', // 61
        '...iPPP...', // 62
      ],
    },
  ],
}
