// Nijika's beat, as patches on her stand: the sticks alternate, playA the right (near) stick
// raised high and the left low on the hit, playB the reverse, with stand (both crossed low)
// between them, on the four beats of Bocchi's strum (the focused mood plays stand, playA,
// stand, playB, a frame each, squash 1 on both hits). Nothing here touches the face box
// (16x10 at 42,30) or the tail pixels her sways cover (sway.ts names the cells playB's raised
// forearm takes over): checkArt holds both to stand's. The patches are generated from full
// grids, so every pixel they hold differs from stand.
//
// The raised arm is a drummer's backswing: the elbow stays low at the side where stand has
// it, the forearm curls up in front of the upper arm, the fist comes up beside the jaw, and
// the stick stands up out of the fist's top across the hair, so both raised sticks cross the
// portrait window (cols 34-65, rows 11-42): playA's over the near lock, playB's over the tail.
// The low hand strikes: its fist, cuff and stick drop 2 rows on the hit (the sleeve stretched
// to reach), the stick whole now that the other one has left the cross, its tip (tips below)
// 2 rows under stand's, where the impact star lands.
//
// The vest the raised arm uncovers is drawn the same in both: the near shade band carried
// down from stand's (VV beside the near arm), a pull fold V from under the raised elbow into
// the hem, and the hem itself as panic draws it, a rib on rows 56-57 (V on even cols and v on
// odd on the shaded side, v on even and c on odd on the lit side, from col 53), over the waist
// G on row 58. Stand keeps its own: its fists hide the hem.
//
// playA, the right stick up:
// - The stick: a T o on each row like playB's (a on the upper left, the o line on the lower
//   right), a 2:1 slope up and forward from the fist's top-right (a T o at 34-36 on row 38)
//   over the near lock to 39-41 on rows 27-28, capped at 40-41,26; clear of the face box (it
//   keeps to col 40 and left on rows 30-39).
// - The fist: skin cols 31-35, rows 39-42, the p outline, its top p across 31-33 on row 38;
//   the knuckle line S at 34,39 / 35,40-41 and the underside S at 31,41 / 32,42, the stand
//   fists' vocabulary.
// - The cuff: a y band on row 43 (cols 32-36) that runs into the shoulder (Y at 37,43).
// - The forearm (rows 44-52): its left contour steps 32, 32, 33, 33, 34, 34, 35, 35, 35; y on
//   its shadow side, w lit; down its right side the crease Y (38,44 to 41,52) where it lies
//   over the upper arm, whose shaded strip shows beside it up to the vest's armhole trim; the
//   elbow's round bottom q at 36-41,53.
// - What the arm uncovers: the vest's near side (o down col 41, rows 54-57); under the elbow
//   the shadow V across 42-45 on row 53, the near band VV at 42-43 on rows 54-55 (stand's at
//   43-44 on rows 48-52, following the edge); the pull fold V at 46,54 / 47,55 into the rib's
//   48,56; the rib on rows 56-57 (cols 42-49), the left fist's shadow V at 49,57.
// - The left hand on the hit: stand's fist and cuff 2 rows down (skin rows 57-61, cols
//   49-54), the sleeve stretched over rows 54-56; its stick from 51,63 to the tip at 43,71
//   on the near thigh, capped at 43-44,72.
// - The skirt the sticks uncover: stand's pleats carried through the middle (the L3 fold up
//   to the waist at 45,61; a fold surfacing at 48,63 into stand's 46,68; the centre pleat
//   edge 50,61 to 51,67 with its lit face b), and the fist's shadow G at 49-50,62.
// playB, the left stick up, playA mirrored with the light kept from the upper right:
// - The stick: 1:1 up and out (a T o, from 61-63,38 to 71-73,28, capped at 72-73,27), steep
//   enough to clear the tail's edge from row 30 so the wood reads against the air, not the hair.
// - The fist: skin cols 58-62, rows 39-42 (cols 58+: clear of the face box), the shade S
//   down its left side (59,39 / 58,40-41), the knuckles S at 62,41-42; the cuff y on row 43.
// - The forearm (rows 44-52): its right contour steps 62, 62, 61, 61, 60, 60, 59, 59, 58 over
//   the tail's root (a 2-px shadow u on the tail beside it at 61,48-49), its left contour 56
//   down to 52 over the armhole, y on the left, w lit; the elbow's bottom q at 53-58,53.
// - What the arm uncovers: the vest's lit far side (v, the rim c on col 57, the outline o
//   down col 58 where the sleeve's q was); the elbow's shadow V at 53-54,54 and the pull fold
//   V from it at 52,55 / 51,56 into the rib's 50,57; the near band VV beside the lowered
//   sleeve (44-45,54 / 45-46,55) into the rib's 46,56; the rib on rows 56-57 (cols 46-57,
//   the fist at 45-46), the waist G on row 58, the skirt's top corner and its pleat back
//   (rows 59-60).
// - The right hand on the hit: stand's fist and cuff 2 rows down (skin rows 56-61), the
//   sleeve stretched over rows 53-54; its stick from 44,62 to the tip at 52,70 on the far
//   thigh, capped at 52-53,71. The skirt as in playA.
//
// Drawn in the stand's hand: shirt q/y/Y/w, skin s/S with the p outline, vest v/V/c with o,
// skirt g/G/b with o, the light-wood sticks a/T outlined in o. No colors of its own.

import type { Point, PoseDef } from '../../types'

export const playA: PoseDef = {
  from: 'stand',
  patches: [
    // the right arm curled up, its stick raised, the vest it uncovers: 19x33 at 30,26
    {
      x: 30,
      y: 26,
      grid: [
        '..........oo.......', // 26
        '.........aTo.......', // 27
        '.........aTo.......', // 28
        '........aTo........', // 29
        '........aTo........', // 30
        '.......aTo.........', // 31
        '.......aTo.........', // 32
        '......aTo..........', // 33
        '......aTo..........', // 34
        '.....aTo...........', // 35
        '.....aTo...........', // 36
        '....aTor...........', // 37
        '.p.paTo............', // 38
        'psssSp.............', // 39
        'pssssSp............', // 40
        'pSsssSp............', // 41
        '.pSsspr............', // 42
        '.qyyyyyY...........', // 43
        '..qywwwwYy.........', // 44
        '..qywwwwYyy........', // 45
        '...qyww..Yy........', // 46
        '...qyww..Yy........', // 47
        '......w...Y........', // 48
        '....qyww.w.y.......', // 49
        '.......w..w........', // 50
        '...........Y.......', // 51
        '........y.wY.......', // 52
        '.......qqqqqVVVV...', // 53
        '.......____oVVvvV..', // 54
        '........___oVVvvvVv', // 55
        '.........__oVvVvV..', // 56
        '.........._oVvVvVv.', // 57
        '...........GGGGG...', // 58
      ],
    },
    // the left hand's hit, 2 rows down; the skirt the sticks uncover: 17x19 at 42,54
    {
      x: 42,
      y: 54,
      grid: [
        '..........yw.....', // 54
        '........vqyw..w..', // 55
        '.......vVqqyw.wyq', // 56
        '.......Vp..ywwYyq', // 57
        '.........s..ywYq.', // 58
        'ggg....pS.s.syq..', // 59
        '.ggg...psSsssp...', // 60
        '..gGg...psSsp....', // 61
        '...ggg.GGopp.....', // 62
        '....ggGgoTa......', // 63
        '.....GgoTa.Gb....', // 64
        '....gG...........', // 65
        '...gGoTagG.......', // 66
        '..ggoTa.gGb......', // 67
        '.ggoTa...ggg.....', // 68
        'ggoTa............', // 69
        '..Ta.............', // 70
        'oTa..............', // 71
        '.oo..............', // 72
      ],
    },
  ],
}

export const playB: PoseDef = {
  from: 'stand',
  patches: [
    // the left arm curled up, its stick raised, the vest it uncovers: 27x34 at 47,27
    {
      x: 47,
      y: 27,
      grid: [
        '.........................oo', // 27
        '........................aTo', // 28
        '.......................aTo.', // 29
        '......................aTo..', // 30
        '.....................aTo...', // 31
        '....................aTo....', // 32
        '...................aTo.....', // 33
        '..................aTo......', // 34
        '.................aTo.......', // 35
        '................aTo........', // 36
        '...............aTo.........', // 37
        '.............paTo..........', // 38
        '...........pSsssp..........', // 39
        '..........pSssssp..........', // 40
        '..........pSsssSp..........', // 41
        '............sssSp..........', // 42
        '..........qyyyyyq..........', // 43
        '.........qy.wwwq...........', // 44
        '.........qy..wwq...........', // 45
        '........qy...wq............', // 46
        '........q....wq............', // 47
        '.........w..wq.............', // 48
        '.........y.wwqu............', // 49
        '......qyyw.wq..............', // 50
        '......qyyywwq..............', // 51
        '.....qyyy.w................', // 52
        '.....vqqqqq................', // 53
        '....vvVVvvco...............', // 54
        '.v.vvVvvvvco...............', // 55
        '..vVVvcvcvco...............', // 56
        'v.vVvvcvcvco...............', // 57
        '..GGGGGGGGG................', // 58
        '...ggggg...................', // 59
        '....ggg....................', // 60
      ],
    },
    // the right hand's hit, 2 rows down; the skirt the sticks uncover: 19x19 at 35,53
    {
      x: 35,
      y: 53,
      grid: [
        'qy.w.y.qVV.........', // 53
        '.qy.w.y.qVV........', // 54
        '.qyyw..yqqVV.......', // 55
        '..qyYwwy..pV.......', // 56
        '...qYwy..s.........', // 57
        '....qys.sSSp.......', // 58
        '.....qsssSsp.......', // 59
        '......psSsp........', // 60
        '.......pppGg...Ggg.', // 61
        '........oTagg.gGb..', // 62
        '.........oTagggG...', // 63
        '..........oTagg....', // 64
        '.............agg...', // 65
        '..........gGoTagG..', // 66
        '.........ggG.oTaGb.', // 67
        '........ggg...oTagg', // 68
        '.......ggg.....oTa.', // 69
        '.................Ta', // 70
        '..................o', // 71
      ],
    },
  ],
}

/**
 * Where the striking (low) stick's tip is on each pose (canvas pixels): the focused mood centres its
 * impact star there. It moves with the sticks.
 */
export const tips: { playA: Point; playB: Point } = { playA: { x: 43, y: 71 }, playB: { x: 52, y: 70 } }
