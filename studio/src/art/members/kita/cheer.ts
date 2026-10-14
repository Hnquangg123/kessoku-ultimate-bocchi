// Kita's cheer: the top of a happy jump, a whole 96x96 grid on her polished stand, synced with Bocchi's cheer.ts
// (the guitar hanging and turned on its strap, the far fist punched up, the near leg kicked back). Her own beat:
// a peace sign beside her winking eye (the "Kitan" pose) instead of Bocchi's second fist. The head is stand's, pixel
// for pixel, at offset 0; the top row is 16 (the far fist), so the jump keeps its -11 hang.
//
// - Head, hair, collar and bow: the stand's rows 0-44 (the face box 42-57 x 30-39, the side tail 57-64 x 18-25
//   with its pointed tip at 62-63,18). The raised arm covers the near lock's flip; the lock shows as a dark (r)
//   wedge between the forearm and the face (cols 37-41, rows 38-42), over the collar flap.
// - Near arm (her right), Bocchi's L construction folded short: the upper arm runs out level from the shoulder
//   under the collar flap (its lit top l on row 46, cols 33-40; the shoulder seam k at col 41; the bottom outline
//   on row 50, cols 29-39, just over the guitar's top-left corner) to the elbow out on the viewer's left (outer
//   edge col 27, rows 43-48, rounding off at 28,49 and 29,50). The forearm lies in front of it: it rises from the
//   elbow at a clean 1:1 up and right ('PkJjjjjlP', k shade on the lower left, l light on the lit upper right;
//   from cols 27-35 on row 43 to 31-39 on row 39), and its near edge carries on over the upper arm as the fold
//   line K (33,45 down to 29,49), so the bend reads. Forearm and upper arm are about the same length (~10 px).
//   Ribbed cuff on rows 37-38 (cols 33-41, then 32-40). The peace sign, palm out, sits inside the portrait window
//   beside the eye, in front of the near hair: the middle finger 34-35 (cap 34-35,25, tip row 26), the index
//   40-41 (cap row 26, tip row 27) stepping in 2-2 to 38-39, a two-pixel V notch (37-38, rows 27-28) narrowing to
//   one (37, rows 29-30), the fingers joined by one shared outline (37,31) that turns to a crease S (37,32); the
//   palm rows 32-36 (cols 33-41, shade S down the left, the curled fingers' knuckles S35-36 on row 34, the
//   thumb's crease S39 on rows 33-34).
//   Nothing crosses the face box (the hand's right edge is col 41 from row 29 down; the index's outline uses col
//   42 only on rows 27-28, above the box).
// - Far arm (her left): Bocchi's raised fist (finger side, the thumb across it in S), one column right of the side
//   tail so the two outlines never touch: the fist 66-73 x 16-21, the cuff 67-74 x 22-23, the forearm leaning in
//   ('PkJjlP', a column left every 3 rows) from 68-73 (row 24) to 61-67 (row 44). It passes behind the headstock
//   (rows 32-40) and the far lock, shows again right of the neck (rows 40-44) and turns into the shoulder at the
//   armpit (65,45).
// - Guitar: her stand's Pelham Blue LP Junior double-cut, turned about 10 degrees counter-clockwise about the neck
//   joint (a RotSprite guide, redrawn by hand): the neck at a clean 1:1 from the body (48-50,52) to the nut (TT at
//   61-62,40), the 4-px board lit O over shade X with W dots and t frets; the black headstock a 1:1 blade (rows
//   32-39, cols 60-72) with three chrome pegs out of each side through a post. The body cols 31-58, rows 44-67:
//   the upper horn's tip at 50-51,44 with the cutaway notch beside the neck (52-54, 45-47) and its shade (i) along
//   the neck, the lower horn's tip at 57-58,48-51, the top edge stepping 2-2-1 with its a light band, the i shade
//   down the bass side, the I deep bottom, the a rim on the lit treble side, the black guard band below the neck's
//   end (44-52, 52-58), the P-90 (37-40, 57-59), the wraparound bridge (34,61 / 35,62), the knobs (43-44,60;
//   42,63); the bottom outline on row 67 (38-45), as Bocchi's.
// - Torso: the far side of the cardigan between the neck and the flank (P 65,45; 64,46; 63 on rows 47-49; 62 on rows
//   50-55) with one k fold (61,45-47; 60,48-52), the hem riding up: ribbed JjJj (row 53), a k band (54), the hem
//   outline (row 55, cols 52-62), the skirt's waist in shade (G, row 56).
// - Skirt and legs: Bocchi's flared cheer skirt and sawtooth hem (rows 56-67), its pleats carried into the place
//   the old guitar left (cols 50-55, rows 56-60); Bocchi's legs (the near leg kicked back, the far leg straight to
//   a pointed toe), bare skin to her loose white socks: the near thigh out from under the hem (row 68) to the knee
//   at the bottom (38-44, 77-80), the kicked shin's sock from the ankle (col 29) to a cuff at 34-35 bulging a pixel
//   above and below the shin, V creases at 33,73 and 32,74; the far sock cuff o57-o66 (row 80), creases V63 (81)
//   and V61-62 (82). Bocchi's loafers (the shared ramp). The bare knee is drawn as Nijika's cheer leg: the thigh
//   S under the hem (row 69), then a light band s down its middle (40-44 on row 70, narrowing to 44 by row 76)
//   between an S rim each side; its back edge the knee crease N, an even 1:1 line from under the notch (37,72)
//   to 43,78 against the bottom outline, so the thigh reads in front of the shin; the shin S behind it, lit s
//   only at its top by the cuff (36,72-73).
// - One color of its own (`colors`): N, the crease's deeper skin (Nijika's C); the rest is her stand's palette.

import type { Palette, PoseDef } from '../../types'

/** The bare leg's crease: a deeper skin, between the shade S and the chin line m, cooler (the knee-back fold; Nijika's C). */
export const colors: Palette = {
  N: '#d8968e',
}

export const cheer: PoseDef = [
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
  '....................................................................PPPP........................', // 16
  '...................................................................PssssP.......................', // 17
  '..........................................pppppppppp..........pp..PSSssssP......................', // 18
  '........................................pphhHHHHhhhhppp....pppHHp.PSSSSSsP......................', // 19
  '.......................................phhhhhhhhhhhhhhhp..pHHhhp..PSssssP.......................', // 20
  '......................................phhhhhhhhhhhhhhhhhppHhhhvhp..PSsssPP......................', // 21
  '.....................................phhhhhhhhhrhhhhhhhhhpHhhrrp...PJjJjJjP.....................', // 22
  '....................................phhhhhhhhhhhrhhhrhhhhvhrrpp....PJjkkkkP.....................', // 23
  '...................................pHhhhhhhhhhhhhhhhhrHhhHvrp.......PkJjlP......................', // 24
  '..................................PPHhhrhhhhhhhHrHhhHrHHHHvp........PkJjlP......................', // 25
  '.................................PSsPhrhPPrHhhhHrHHHHrHHHHp.........PkJjlP......................', // 26
  '.................................PSsPrhPSsPHHHHHrHHHHrHHHHp........PkJjjlP......................', // 27
  '.................................PSsPrhPSsPHHHHHrHhhHrHhhHp........PkJjjlP......................', // 28
  '.................................PSsPrPSsPrHhhhHhhhhrrhhhrp........PkJjlP.......................', // 29
  '.................................PSsPrPSsPrHhhhhhhhhrrhhhrhp.......PkJjlP.......................', // 30
  '..................................PSsPSsPhrnnnnnnrrrsnnprhhp......PkJjlP........................', // 31
  '..................................PSsSSsPPrsnnnnnssrsnnnrHHp......PkoooP........................', // 32
  '.................................PSssssSsPrsnWMEESSrSMEnrrHHp....oPoggGo........................', // 33
  '.................................PSSSssSsPrsnQeeWSSSSeWnrrHHp...oTtgggGGo.......................', // 34
  '.................................PSssssssPrssseLSSSSSeLprrHHp..o.ogggGGtTo......................', // 35
  '.................................PSSSsssPhhrssssssssssSprrHHp.oTtgggGGo.o.......................', // 36
  '.................................PJjJjJjJPhrmSsssssssSprrrHHpo.ogggGGtTo........................', // 37
  '................................PkkkkkkkPhhhpmSmbbmSpprrrrHHoTtgggGGoPo.........................', // 38
  '...............................PkJjjjjlPrrhhpSssmmpprrrrrHHhhogggGGtTo..........................', // 39
  '..............................PkJjjjjlPrrrhppwSSSsZpprrrrhhHoTTXXojlo...........................', // 40
  '.............................PkJjjjjlPrrrrpwwwSSSsZwpvrrrhhotOXXoJjlP...........................', // 41
  '............................PkJjjjjlPhrrwwwwwppSSZppwpvvrroOOXXoJjjlP...........................', // 42
  '...........................PkJjjjjlPwwwwooowpRBpbpBRpjpvroOWXXopJjjlP...........................', // 43
  '...........................PkJjjjlPPPwooZZZZpRRRRRoopjkpotOXXopJjjjP............................', // 44
  '...........................PkJjjjKllZZZZjljkpbbpooaopjjoOOXXokjjjP..............................', // 45
  '...........................PkJjjKllllllllkjkjJooaaaojjoOWXXojkjjP...............................', // 46
  '...........................PkJjKjjjjjjjjjkjkjoaaAAiojotOXXojjkjP................................', // 47
  '...........................PkJKjjjjjjjjjJkkooaaAAAAioOOXXoojkjjP................................', // 48
  '............................PKJJJJJJJJJkPooaaAAAAAioOWXXoaojkjjP................................', // 49
  '.............................PPPPPPPPPPPoaAAAAAAAiotOXXoAaojkjP.................................', // 50
  '.......................................oaaAAAAAAioOXXoAAAaojkjP.................................', // 51
  '....................................oooaAAAAAAAioXoGgAAAaojjkjP.................................', // 52
  '...................................oaAAAAAAAAAAAAoGGgAAAaoJjJjP.................................', // 53
  '.................................ooaaAAAAAAAAAAAAGGGgAAaokkkkkP.................................', // 54
  '................................oiAAAAAAAAAAAAAAGGGGgAaoPPPPPPP.................................', // 55
  '................................oiAAAAAAAAAAAAAGGGGgAaoGGGGGGo..................................', // 56
  '...............................oiAAAAGGGGAAAAGGGGgAAaoggGggGgo..................................', // 57
  '...............................oiAAAAGttGAAAGGGGAAAaogggGggGgo..................................', // 58
  '...............................oiAAAAGGGGAAAAAAAAAaoGgggGgggGgo.................................', // 59
  '...............................oiAAAAAAAAAAGGAAAAaoggGgggGgggGo.................................', // 60
  '...............................oiATAAAAAAAAAAAAAaogggGgggGgggGgo................................', // 61
  '................................oiATAAAAAAAAAAAAaoggggGgggGgggGgo...............................', // 62
  '................................ooiiAAAAAAGAAAAaoGggggGgggGggggGgo..............................', // 63
  '.................................oIiiiAAAAAAAAaoggGgggGggggGggggGgo.............................', // 64
  '..................................ooIIIIIIIIIaogggGggggGgggGggggGggo............................', // 65
  '....................................ooIIIIIIIoogggGggggGggggGggggGggo...........................', // 66
  '......................................oooooooogGooooogGooogGooogGooo............................', // 67
  '.......................................oSSSSSSoo.....ooSSSooSSSoo...o...........................', // 68
  '......................................oSSSSSsSo.......oSSsssssSo................................', // 69
  '....................ooo....oo.....oo.oSSsssssSo........oSSssssSo................................', // 70
  '...................oxxxooooxxooooozzooSSsssssSo........oSSssssSo................................', // 71
  '...................oFFFxxxxfdzzzzzzzsNSSsssssSo........oSSsssssso...............................', // 72
  '....................oFffDDffdzzzzVzzsSNSSssssSo........oSSsssssso...............................', // 73
  '.....................oodffffdzzzVzzzSSSNSSsssSo.........oSsssssso...............................', // 74
  '.......................ooddddzzzzzzzSSSSNSSssSo.........oSsssssso...............................', // 75
  '.........................ooddZZzzzZzSSSSSNSSsSo.........oSsssssso...............................', // 76
  '...........................ooZZZZZZZSSSSSSNSsSo..........oSsssssso..............................', // 77
  '.............................ooooZZZSSSSSSSNSo...........oSSSsssso..............................', // 78
  '.................................oZZooSSSSSSo............oSSSsssso..............................', // 79
  '..................................oo..oooooo.............oZzzzzzzzo.............................', // 80
  '..........................................................oZZzzVzo..............................', // 81
  '..........................................................oZzVVzzo..............................', // 82
  '...........................................................oZzzzzo..............................', // 83
  '...........................................................oZZzzZzo.............................', // 84
  '............................................................oZZZzzo.............................', // 85
  '............................................................oZZzzzo.............................', // 86
  '............................................................oxddfffo............................', // 87
  '...........................................................oxxdfffFo............................', // 88
  '...........................................................ooxdfDDFo............................', // 89
  '.............................................................oxdfffFo...........................', // 90
  '..............................................................oxdffFFo..........................', // 91
  '...............................................................oxxdFFo..........................', // 92
  '.................................................................oooo...........................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
