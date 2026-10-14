// Bocchi's strum, as patches on stand (the reference itself). The head and the
// hair stay pixel-identical (checkArt holds the face region to stand's, and the
// sway overlays must fit stand, playA and playB), so nothing here touches the
// head or anything left of col 35 below row 44 (the side lock, the back hair,
// the sleeve's outer contour at col 34). The elbow stays where stand has it;
// the forearm swings about it and the hand turns at the wrist, so each extreme
// has its own hand shape.
//
// playA, the upstroke: the fist 6 rows up (skin rows 48-52), cocked back at the
// wrist and tilted (its top leans left, its lower-right corner rounds off; the
// knuckle line S runs 43,48 / 45,50 / 44,51-52). The forearm lies along the
// guitar's upper edge and covers it from col 36 to the fist: its contour sits
// on the binding's row (36-38,54 / 39-44,53), with plain body below and the
// hand's cast shadow G at 41-42,54. The binding shows at 35,54 under the elbow,
// as on stand. The cuff is a J band with a j centre line, slanting down-right
// at 39-42, rows 50-52, perpendicular to the forearm. The forearm's top edge
// is K where it folds over the upper arm (38,50 / 39,49), then p where the
// hand meets the jacket. The stripe runs down the upper arm as on stand to
// 36,51, wraps the elbow at 37,52 and runs along the forearm to y at 39,52.
// The horn passes behind the fist: the fist covers its base (45-46, rows
// 50-51), and the crevice between them at 46,49 is K. The body the hand
// uncovered is plain g with both gold bars whole, as the visible guitar has
// no strings drawn on the body.
// playB, the follow-through: the fist 4 rows down at stand's column (skin rows
// 58-62), flicked the other way (its top leans right, its lower-right corner is
// cut, 1-2 px clear of the lower-right binding). The cuff (stand's, moved
// 4 down) and the forearm cover the bridge bar whole. The outer contour keeps
// stand's elbow (35,53 / 36,54, the binding at 35,54 restored), then runs down
// col 37 with 2 px of body beside the left binding, into the cuff. The stripe
// follows it 1 px inside: stand's turn round the elbow, then down col 39 to y
// at 39,58. The inner contour has a crook at the elbow (in to col 41 at rows
// 52-53, the binding passing behind it at 42,53, then out to 43), with stand's
// fold kept and a k crease at 40,52. Cast shadow G at 39,62 and 40,63.
// The fretting hand lives too: in playA the little finger comes down on the
// fretboard (65,46-47), inside the neck; playB keeps stand's hand, so the left
// hand changes only into and out of the upstroke.
//
// Drawn in the reference's hand: 1-pixel plum outlines where the sleeve or the
// hand meets another material, jacket tones for folds, the jacket ramp j/J/k/K,
// the skin s/S with its knuckle line, the guitar outlined in o with its A/a
// binding. No colors of its own.

import type { PoseDef } from '../../types'

export const playA: PoseDef = {
  from: 'stand',
  patches: [
    // the picking arm, the hand and the guitar it uncovers: 10x13 at 37,47
    {
      x: 37,
      y: 47,
      grid: [
        '.....pp...', // 47
        '....psSp..', // 48
        '...psssspK', // 49
        '.KJJssssSp', // 50
        '..J.JssSsp', // 51
        '.wyJ.JsSp.', // 52
        'JJpppp....', // 53
        'ppggGGggg.', // 54
        'gggggggggg', // 55
        '.ggggggggg', // 56
        '..gggggggg', // 57
        '...ggggggg', // 58
        '....ggggg.', // 59
      ],
    },
    // the fretting hand: 1x2 at 65,46
    {
      x: 65,
      y: 46,
      grid: [
        'p', // 46
        's', // 47
      ],
    },
  ],
}

export const playB: PoseDef = {
  from: 'stand',
  patches: [
    // the picking arm, the hand and the guitar it uncovers: 10x12 at 37,52
    {
      x: 37,
      y: 52,
      grid: [
        '...kpo....', // 52
        '....pAgg..', // 53
        '..wj.pggg.', // 54
        '..w.jjpggg', // 55
        'pjwjjjpggg', // 56
        'pjwjJKpppg', // 57
        'pjyJjJJ.Sp', // 58
        'pjJjJssssp', // 59
        '.pJJssssSp', // 60
        '..ppsssSp.', // 61
        '..GpsSsp..', // 62
        '...Gppp...', // 63
      ],
    },
  ],
}
