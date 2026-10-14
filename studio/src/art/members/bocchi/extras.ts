// Bocchi's guitar on its own, for the Blast Radius crash (src/anim/crash.ts): her
// father's black Les Paul Custom, drawn from the reference's guitar (REF_STAND cols
// 33-77, rows 38-69) in the reference's own colors and hand. The outline is o, the
// body g with its dark side G. The binding is gold: A on the far edge, a on the near
// edge over a 1-pixel rim of G along the near side. The hardware is gold in A and a
// only, as the reference draws all its gold: two humbuckers and a stopbar tailpiece,
// each a short stroke across the strings with its far half A and its near half a,
// like the reference's pickup (REF_STAND 37-41, rows 58-61). The body between them is
// quiet g with no strings, as in the reference. The ebony board carries pearl blocks
// W, each with its fret glint t across the board, the nut is t, and the open-book
// headstock has 3+3 tuner pills, a over A, capped in o. The outline is one pixel
// everywhere. Hands and body hide parts of the guitar on stand, so these are rebuilt
// as a Les Paul: the lower bout's far side, the cutaway and horn, the headstock face.

import type { Grid } from '../../types'

// Lying flat on the stage, face up, seen from the front and a little above (44x16).
// - Lower bout (cols 0-10, rows 0-15): the outline is the same 6-2-2-8 stair top and
//   bottom (4-9,0, 2-3,1, 1,2-3, 0,4-11, 1,12-13, 2-3,14, 4-9,15).
// - Bass side (top): the bout ends at 10,1, the waist dips to 11-12,2, the upper bout
//   is 13-16,1, and it steps down by 17-18,2 and 19,3 into the neck's far outline.
//   The waist sits between the two pickups, so both stay clean rectangles clear of
//   its binding (11-12,3).
// - Treble side (bottom): no waist dip, like the reference's near edge, which rises
//   steadily to the horn. The outline runs on row 15 under the bout and on row 14
//   (cols 10-17) after it, then rounds up through 18-19,13, 20,12 and 21,10-11 to
//   the horn tip.
// - Cutaway: the neck's underside is row 8, the body's edge under it is 17,9, and the
//   slit on row 9 is open from col 18. The horn's top outline is row 10 (cols 18-21).
// - Binding: the far binding A runs 1 px inside the outline over the top (row 1 cols
//   4-9, 10,2, the waist 11-12,3, the shoulder 13-16,2 and 17-18,3) and down the butt
//   (col 1, rows 4-6). There it turns to a, the near binding, which runs on down
//   col 1 (rows 7-11) and along the bottom: 2-3,12, 4-9,13, 10-17,12, then up the
//   horn on 18-20,11. A rim G runs under it: 2-3,13, 4-9,14, 10-17,13 and 18-19,12.
// - Hardware (rows 4-8), each piece a stroke across the strings, A on the far rows
//   and a on the near ones:
//   - the tailpiece, col 5, rows 5-7: A A a;
//   - the bridge pickup close to it, cols 8-9, and the neck pickup, cols 14-15. Each
//     is a full 2x5 rectangle: AA on rows 4-5, Aa on row 6, aa on rows 7-8.
// - Neck: the outline rows 4 and 8 run into the body up to the neck pickup (col 16).
//   The board is g g G (rows 5-7). The blocks W sit on the middle row 6 at cols 21,
//   24, 28 and 32 (frets 12, 9, 5 and 3), each with its t straight under it on row 7.
//   Resting on the stage (crash rows 14-29), rows 6-7 share a 2x2 block when the crash
//   is halved, so each block halves to its own dot. The nut is t, col 35, rows 5-7.
// - Headstock (cols 36-43): the face is the neck's width (rows 5-7), with 2 plain
//   pixels between the nut and the first tuner. The tuners sit at cols 38, 40 and 42,
//   parted by o:
//   - above, an o cap on row 2, a on row 3 and A on row 4, in the head's outline;
//   - below, a on row 8, in the outline, A on row 9 and an o cap on row 10.
//   Col 43 closes the end in o, with the open-book V at 42,6 (43,6 open).
// The bottom row (15) is the one that rests on the stage.
export const guitarFlat: Grid = [
  '....oooooo..................................', // 0
  '..ooAAAAAAo..oooo...........................', // 1
  '.oAAggggggAooAAAAoo...................o.o.o.', // 2
  '.oAggggggggAAggggAAo.................oaoaoao', // 3
  'oAggggggAAggggAAooooooooooooooooooooooAoAoAo', // 4
  'oAgggAggAAggggAAgggggggggggggggggggtgggggggo', // 5
  'oAgggAggAaggggAagggggWggWgggWgggWggtggggggo.', // 6
  'oagggaggaaggggaaGGGGGtGGtGGGtGGGtGGtGGGGGGGo', // 7
  'oaggggggaaggggaaooooooooooooooooooooooaoaoao', // 8
  'oagggggggggggggggo...................oAoAoAo', // 9
  'oaggggggggggggggggoooo................o.o.o.', // 10
  'oaggggggggggggggggaaao......................', // 11
  '.oaaggggggaaaaaaaaGGo.......................', // 12
  '.oGGaaaaaaGGGGGGGGoo........................', // 13
  '..ooGGGGGGoooooooo..........................', // 14
  '....oooooo..................................', // 15
]

// The same guitar falling body-first at 45 degrees, neck up and to the right
// (34x30). Read it with u = x - y along the neck (butt u -25, head tip u 27) and
// v = x + y across it. The neck band is v 27 (far outline) to v 32 (near outline),
// with the board g on v 28-29 and G on v 30-31.
// - Lower bout: an even 5-2-2-5 stair like the flat's round bout: 3-4,18, 2,19-20,
//   1,21-25, 2,26-27, 3-4,28, 5-9,29, 10-11,28, 12,26-27, 13,24-25. It spans v 21-39
//   (12.7 px, 0.85 of the flat's 15). Row 29 lands first.
// - Bass side: the outline runs 5-7,17 and 8,15-16, with the waist at 7,17-8,16. The
//   shoulder is a hump at 10-11,13 that slopes into the neck at 12-13,14. The neck's
//   far outline runs on into the body at 12,15, as the reference's does.
// - Treble side: a waist 1 unit deep with 2-px turns. The outline is 13,24-25,
//   14-15,23, then a straight 45-degree run (16,22 to 19,19) up to the horn.
// - Horn: its tip (u +1) reaches 2 u past the shoulder's join (u -1), as the flat's
//   (col 21) reaches past col 19. It is capped by 17-18,17 and 19,18-19, with a g
//   core at 17,18 and 16,19. The channel between it and the neck
//   is the open diagonal v 33 (15,18, 16,17).
// - Binding: the far binding A is 3,26, 2,21-25, 3,20, 3-4,19, 5-7,18, 8,17, 9,15-16
//   and 10-11,14. It turns to a at 3,27. The near binding a is 3-9,27, 10,26,
//   11,24-25, 12,23, 13,22, 14-15,21, 16,20, 17,19 and 18,18 (the horn tip). The
//   rim G is 5-9,28, 10-11,27, 11,26, 12,24-25, 13,23, 14-15,22, 16,21, 17,20 and
//   18,19.
// - Hardware: strokes across the strings, far half A and near half a, as the
//   reference draws them:
//   - the neck pickup: 11,17-18 A and 12,18-19 a;
//   - the bridge pickup: 7,21-22 A and 8,22-23 a;
//   - the tailpiece: 4,24 A and 5,25 a.
//   The tailpiece is 2 px because a third pixel would touch the binding (at 4,25 it
//   meets 3,26) or leave one g between it and the bridge pickup (at 5,24). Two g
//   pixels lie along every diagonal between the strokes. No strings on the body.
// - Neck: three blocks W (20,8, 17,11 and 14,14), each with its t one down and one
//   right, across the neck. When the crash is halved they stay separate dots. The
//   nut is t at 22,7 and 23,8 (u 15).
// - Headstock: the tuners are a over A, capped and parted in o:
//   - far side: cols 22, 24 and 26 (a on rows 4, 2 and 0);
//   - near side: cols 25, 27 and 29 (a on rows 7, 5 and 3).
//   The open-book end is 27,1 and 28-29,2, with the notch at 28,1.
// - Proportions against the flat: the body is 26 u (18.4 px, 0.88), the neck 16 u
//   (11.3 px, 0.71) and the head 12 u (8.5 px, 1.06). At 45 degrees, pills along one
//   edge must be 4 u apart, or they touch, so the head cannot shrink. In 30 rows that
//   costs the neck.
export const guitarTilt: Grid = [
  '.........................oao......', // 0
  '........................ooAo......', // 1
  '.......................oaoggoo....', // 2
  '......................ooAggGGao...', // 3
  '.....................oaoggGGoAo...', // 4
  '.....................oAggGGaoo....', // 5
  '.....................oggGGoAo.....', // 6
  '....................ogtGGaoo......', // 7
  '...................oWgGtoAo.......', // 8
  '..................oggtGooo........', // 9
  '.................oggGGo...........', // 10
  '................oWgGGo............', // 11
  '...............oggtGo.............', // 12
  '..........oo..oggGGo..............', // 13
  '.........oAAooWgGGo...............', // 14
  '........oAggoggtGo................', // 15
  '........oAggggGGo.................', // 16
  '.....oooAggAgGGo.oo...............', // 17
  '...ooAAAgggAago.ogao..............', // 18
  '..oAAgggggggaggogaGo..............', // 19
  '..oAggggggggggggaGo...............', // 20
  '.oAggggAggggggaaGo................', // 21
  '.oAggggAaggggaGGo.................', // 22
  '.oAgggggagggaGoo..................', // 23
  '.oAgAggggggaGo....................', // 24
  '.oAggagggggaGo....................', // 25
  '..oAggggggaGo.....................', // 26
  '..oaaaaaaaGGo.....................', // 27
  '...ooGGGGGoo......................', // 28
  '.....ooooo........................', // 29
]
