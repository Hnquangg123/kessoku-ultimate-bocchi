// Bocchi's crouch: anticipation before the happy jump and the landing after it.
//
// A whole grid (everything above the thighs moves, so a patch would cover it all):
// - Rows 0-70 of stand moved down 3 rows to 3-73: the head, hair, jacket, arms, guitar
//   and skirt (rows 3-59 exactly; rows 60-73 with the hair ends and skirt corners
//   below). The head is pixel-identical, so the face overlay fits at
//   `crouchHead` {dx: 0, dy: 3} (checkArt holds the region to stand's).
// - Rows 85-95 (ankles and shoes) are stand's own: the feet stay planted, soles on row 93.
// - The long back hair's ends bunch up 2 rows: the near mass ends at row 69 (not 71),
//   its outer strand's tip flicks out a pixel (col 17, rows 63-65). The strand behind
//   the guitar still ends on row 70 (p31 r32), tucked behind the skirt corner's outline
//   (32,71). The far lock is a clean 2 px (h60-61) from row 63 to 67 beside a straight
//   skirt edge (o59), narrows to h61 on row 68 where the skirt flares (o60 h61 p62) and
//   ends in a single p61 on row 69 beside the outline o60, as stand's lock ends beside
//   its thigh (1 row higher than stand's, so the compression shows).
// - The skirt flares a touch on both sides, its pleats carried down. Near corner: it
//   rides out 1 px, o32 on row 71 (G33 inside) and o33 on row 72, and overhangs the
//   thigh, which comes out from under it at col 36 (o36 S37-38 on row 73). Far corner:
//   1 px down-right: the skirt fills (58-59,68), its edge steps out to o60 beside the
//   lock, and the hem's rising edge moves right on rows 69-70 (o58-60, o57), then
//   o55-56 (71), o53-54 (72) into the hem. On row 69 the outline runs on to o60, which
//   meets the far thigh's top outline (o60, row 70), so no gap opens under the lock.
// - Legs: both knees bend out over their feet (knees forward and apart).
//   Near thigh: more level, about 34 degrees down-left from the hip (40,74) to the
//   knee. Outer contour o36 (73), o35 (74), o33-34 (75), o31-32 (76), o30 (77),
//   o29 (78); inner o46 (74), o45 (75), o44 (76), o43 (77), o41-42 (78). Skin: S36-45
//   in the hem's shadow on row 74; a lit s band along the thigh's axis (s36-41,
//   s34-40, s33-38 on rows 75-77) with a 1-px S rim on the outer edge (S35, S33) and
//   the underside in S (S42-44, S41-43, S39-42, S37-40 on rows 75-78). The sock top is
//   higher on the outer side, as on stand: g31-32 (77), g31-36 (78), g37 G38 (79).
//   Near knee: centre about (33,79), over the shoe (cols 26-32) as the far knee is
//   over its own; outer contour at col 28 (rows 79-85), never wider (wider reads as
//   a frog splay). The pit G38 beside the outline o39-40 (79); the fold under the
//   kneecap G33-34 (80), G35 (81) runs down-right into the outline o36, like stand's
//   G38-39/o40. The thigh's underside curves into the shin evenly: o41-42 (78),
//   o39-40 (79), o37-38 (80), o36 (81), o35 (82-85).
//   Near shin: near vertical, 7 then 6 px wide into stand's ankle (row 86); the G of
//   its shaded left side widens 1, 1, 1, 2, 3, 4, 6 (rows 79-85), so row 85 is
//   stand's own.
//   Far thigh: one straight 1:1 top contour from under the lock to the knee, o60 (70),
//   o61 (71), o62 (72), o63 (73), o64 (74), o65 (75), o66 (76), o67 (77-78); the
//   underside 1:1 too, o53 (74) to o58 (79). Skin: S under the skirt (S58-59, row 70);
//   the light runs along the lit upper-right contour, s58-60 (71), s58-61 (72),
//   s58-62 (73), s59-60 (74), touching the outline o61-o63 on rows 71-73; the shadow
//   widens on the underside, S57 (71), S55-57 (72), S53-57 (73), S54-58 (74),
//   S55-60 (75), S56-59 (76), with S61 (74) just above the cuff as on stand. The
//   sock top runs on the 1:1 diagonal from (62,74) to (58,78), across the thigh.
//   Far knee: its tip at col 67 (rows 77-78), the wide shadow wedge under it, G58-61
//   (78), G59-61 (79), G60-61 (80), G60 (81), then the shin's shaded side widens
//   2, 3, 3. The shin tapers 7, 6, 5, 4, 4, 3, 3, 3 (rows 79-86) into stand's ankle.
// - No colors of its own: o, G, g, S, s and the hair, skirt and guitar tones of stand.

import type { HeadOffset, PoseDef } from '../../types'

export const crouch: PoseDef = [
  '................................................................................................', // 0
  '................................................................................................', // 1
  '................................................................................................', // 2
  '................................................................................................', // 3
  '................................................................................................', // 4
  '................................................................................................', // 5
  '................................................................................................', // 6
  '................................................................................................', // 7
  '................................................................................................', // 8
  '................................................................................................', // 9
  '................................................................................................', // 10
  '................................................................................................', // 11
  '................................................................................................', // 12
  '................................................................................................', // 13
  '................................................................................................', // 14
  '................................................................................................', // 15
  '................................................................................................', // 16
  '................................................................................................', // 17
  '................................................................................................', // 18
  '................................................................................................', // 19
  '................................................................................................', // 20
  '..........................................pppppppppp............................................', // 21
  '........................................pphhHHHHhhhhppp.........................................', // 22
  '.......................................phhhhhhhhhhhhhhhp........................................', // 23
  '......................................nnhhhhhhhhhhhhhhhhp.......................................', // 24
  '.....................................nCbnhhhhhhrhhhhhhhhhp......................................', // 25
  '................................ppppnCBBbnhhhhhhrhhhrhhhhp......................................', // 26
  '.............................ppphhhhnbccbnhhhhhhhhhhhrHhhHp.....................................', // 27
  '............................phhppppphnbbnhhhhhhHrHhhHrHHHHp.....................................', // 28
  '...........................phpp....povzYvhrHhhhHrHHHHrHHHHp.....................................', // 29
  '...........................pp......pvzqqZvrHHHHHrHHHHrHHHHp.....................................', // 30
  '...........................p.......pvZuuYvrHHHHHrHhhHrHhhHp.....................................', // 31
  '..................................phhvYYvhrHhhhHhhhhrrhhhrp.....................................', // 32
  '..................................phhrvvhhrHhhhHhhhhrrhhhrhp....................................', // 33
  '..................................phhrhrhhrhhnnnnrrrsnnprhhp....................................', // 34
  '..................................phhrhrhhrnnnnnnssssnnnrHHp....................................', // 35
  '..................................pHhrhrhhrnnQMLMSSSSnLnrrHHp...................................', // 36
  '..................................pHHrhrhhrsnWEEESSSSEWnrrHHp...................................', // 37
  '..................................pHHrhrhhrssseeSSSSSeWprrHHp...................................', // 38
  '..................................pHHrhrhhhrssssssssssSprrHHp...................................', // 39
  '.................................pHHHhhhrhhrmSsssssssSprrrHHp...................................', // 40
  '.................................pHHrhhrrhhhpmSssssSpprrrrHHp.............o.....................', // 41
  '.................................pHHhhhrrrhhpJmmmmpprrrrrHHhp...........ooaoo...................', // 42
  '................................phHrhhrrpphhpjSSsspjprrrrhhp..........ooaoAGo...................', // 43
  '................................phhhhhppykphhpjjyjjjprrrrhhp.........oAoAgggGo..................', // 44
  '...............................phhhhhpjyjjkphpjjwjjkprrrhhp.........ooaogggGGo..................', // 45
  '..............................phhrhhpkjwjjjkphpjwjjjkpphhrp.......ooggGggGGoao..................', // 46
  '.............................phhhhhhpjwjjjjjkphpyJJjjjkprrp.....oogWggGGGoaoAo..................', // 47
  '............................phhhhhhpkjwjjjjjjkpppJJJjjjkprp...ooWgggtGGoaoAoo...................', // 48
  '...........................pHhhhhhhpjwjjjjkjjjkkjwjjjkjjkpp.ooppptgGooooAoo.....................', // 49
  '..........................pHhhhhhhpkjwjjjkkjjjjjjwjjjjkjjkoogpssSpoo....o.......................', // 50
  '.........................pHHhHhhhhpjwjjjkkjjjjjJoooojjkjjooWgpSSsp..............................', // 51
  '........................pHHHHrhhhhpjwjjKkKjjjjJoAAAAojkoogggtGpSsp..............................', // 52
  '.......................pHHHHHhhhhrpjwjjjKKjjJooAggAojoogWgggoopssp..............................', // 53
  '......................pHHHHrhhhhhrpjwjjjjppooAAggggAoggggtoookpssp..............................', // 54
  '.....................pHHHHHHhhhhrrpjjwjjjjpAAggggggoWgggGookjjkpp...............................', // 55
  '.....................pHhHrHHhhHhrrrpjjwjjJKppggggooggtGookkkjjjp................................', // 56
  '....................phhHrHHHHHHrrroApjjyJjJsSpAAggggGooppkkjjpp.................................', // 57
  '....................phhhrHHHHHrrroAggpjJjJsssspAAggoooorrpppp...................................', // 58
  '...................phhhrHHHHHrrrroAgggpJJssssSpgaagorprrrhhhp...................................', // 59
  '...................phhppHhHHrrrroAgggggppsssSspggggGoorrrrhhhp..................................', // 60
  '..................phhp.phhHrrrrroAgggAAgGpsSspoggggggaorrrrhhp..................................', // 61
  '..................php..phhhrrrrroAggggAAgGpppogggggaaogoorrhhp..................................', // 62
  '.................php...phhrrrrrroAgggggaaggggggggaaoogGggoorhhp.................................', // 63
  '.................pp....phhrrrrrroAggggggaaggggggaoogGggGggGohhp.................................', // 64
  '.................p.....phhrrrrrrroaggggggggggggaoGggGgggGgGohhp.................................', // 65
  '........................phrrrrrppoagggggggggggaogGggGGgggGgohhp.................................', // 66
  '........................phrrrrp.proagggggggggaGogGGggGggggGohhp.................................', // 67
  '.........................prrrp.prrooaggggggaaGogggGggGGgggggohp.................................', // 68
  '..........................pppp.proGGoaaaaaaGGoGgggGGggGgggooop..................................', // 69
  '...............................proGGGooGGGGoogGgggGGggGggoSSo...................................', // 70
  '................................oGGGgGGooooGggGggggGggGooSssso..................................', // 71
  '.................................ooooooGGgGgggGgggggGooSSSsssso.................................', // 72
  '....................................oSSooooooooooooooSSSSSssssso................................', // 73
  '...................................oSSSSSSSSSSo......oSSSSSssSggo...............................', // 74
  '.................................ooSssssssSSSo........oSSSSSSggggo..............................', // 75
  '...............................ooSsssssssSSSo..........oSSSSggggggo.............................', // 76
  '..............................oggssssssSSSSo............oSSGgggggggo............................', // 77
  '.............................oGggggggSSSSoo..............oGGGGgggggo............................', // 78
  '............................oGggggggggGoo.................oGGGggggo.............................', // 79
  '............................oGgggGGggoo....................oGGggggo.............................', // 80
  '............................oGgggggGo......................oGggggo..............................', // 81
  '............................oGGggggo........................oGGggo..............................', // 82
  '............................oGGGgggo........................oGGGgo..............................', // 83
  '............................oGGGGggo........................oGGGo...............................', // 84
  '............................oGGGGGGo........................oGGGo...............................', // 85
  '...........................oGGGGGoo..........................oGGGo..............................', // 86
  '...........................oGdddo............................oGGddo.............................', // 87
  '..........................odfffo.............................oddffo.............................', // 88
  '..........................odfDDo.............................odfDDo.............................', // 89
  '..........................odfffo.............................odffffo............................', // 90
  '..........................oddFFFo............................oxdfFFFo...........................', // 91
  '..........................oxxxxxo.............................oxddddo...........................', // 92
  '..........................ooooooo..............................ooooo............................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]

/** The upper body rides 3 rows lower than on stand, so the face overlay and the portrait follow it. */
export const crouchHead: HeadOffset = { dx: 0, dy: 3 }
