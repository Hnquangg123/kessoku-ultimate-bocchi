// Ryo's crouch: anticipation before the happy jump and the landing after it. Bocchi's crouch
// (../bocchi/crouch.ts) ported onto her stand, so the band crouches as one.
//
// A whole grid (everything above the thighs moves):
// - Rows 0-67 of stand moved down 3 rows to 3-70: the bob, the head, the sweater, both arms and
//   the bass (its lower bout's bottom outline now on row 71, cols 28-33), with all of stand's
//   final polish (the tie, the far shoulder, both horns, the fretting hand's fingers on row 50,
//   the strings to the bridge, the single chrome plate). The head is pixel-identical, so the face
//   overlay fits at `crouchHead` {dx: 0, dy: 3}.
// - Secondary motion: the bob's near flip tucks in a step as she sinks and lands (sway.ts's R
//   drawing, 3 rows lower: cols 27-42, rows 46-49; the flip's contour 31, 30, 30, 30, 29, its
//   bottom on row 49 at cols 30-34). The cheer flares it out (sway L) and lifts its tip a row
//   further, so the jump swings it tuck, flare-and-lift, tuck, then stand's rest.
// - Rows 87-95 (ankles and loafers) are stand's own: the feet stay planted, soles on row 93.
// - The skirt's far corner flares a touch as Bocchi's does: it fills out 1 px on row 68 (g58-59,
//   o60), its hem rises on rows 69-72 (o58-60, o57, o55-56, o53-54) into the hem on row 73
//   (o44-52). The near corner stays stand's, tucked under the bass's bottom (no doubled outline
//   under o28-33 on row 71); the hem corner is o34-38 on row 72.
// - Legs: Bocchi's crouch legs in her black tights (thigh and sock tones both to i/I: lit i,
//   shade I), knees bent out over the feet.
//   Near thigh: about 34 degrees down-left from the hip (40,74) to the knee (33,79); outer contour
//   o36 (73), o35 (74), o33-34 (75), o31-32 (76), o30 (77), o29 (78); inner o46 (74), o45 (75),
//   o44 (76), o43 (77), o41-42 (78). The strip under the hem I36-45 (74); the I rim on the outer
//   contour I35 (75), I33 (76), I31 (77), I30 (78), I29 (79); the underside I. Her tights' sheen
//   (l, as on stand's legs) runs along the thigh's axis in even 2-px steps: l38-39 (75),
//   l36-37 (76), l34-35 (77), l32-33 (78). The fold under the kneecap I33-34 (80), I35 (81).
//   Near shin: near vertical (cols 28-35), its shaded left side widening into stand's ankle.
//   Far thigh: a straight 1:1 contour from o60 (70) to the knee tip o67 (77-78); lit along the top
//   (the I/i boundary steps 57, 58, 59, 59, 59 down rows 73-77), the sheen l61 (73) to l65 (77)
//   on the 1:1 diagonal; the shadow wedge under the knee I58-61 (78), I59-61 (79); the shin
//   tapers 7, 6, 5, 4, 4, 3, 3, 3 (rows 79-86) into stand's ankle.
// - No colors of its own: stand's o, I, i, l, the skirt's g/G and the loafers.

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
  '..........................................NNNNNNNNNN............................................', // 21
  '.......................................NNNhhHHHHHHhhNNN.........................................', // 22
  '.....................................NNhhhhHHHHHHHHhhhhN........................................', // 23
  '....................................NhhhhhhhHHHHUUUUUhhhN.......................................', // 24
  '...................................NhhhrhhhHHrUUHHHrHUUUhN......................................', // 25
  '..................................NhhhrhHHHHrHHHHHrHHUUHhN......................................', // 26
  '..................................NhhrhhhHHrHHHHHrhHHHHHhhN.....................................', // 27
  '.................................NhhrhhhhhrHHhhHrhhHHrhHHhN.....................................', // 28
  '.................................NhrhhHhhhrhHHhHrhhHHrhHHhN.....................................', // 29
  '.................................NhrhhHhhhrhHHHHrhHHhrhHHhN.....................................', // 30
  '................................NhhrhHHhhrrhhHHHrhHHhrhhHhN.....................................', // 31
  '................................NhhrhHHhhrhhhhHHrhhHrrhhHHhN....................................', // 32
  '................................NhhrhHHhhrhhhhhhrrhhrrhhHHhN....................................', // 33
  '................................NhhrhHHhhrhhhrnnnrhrsnnphHhN....................................', // 34
  '................................NhhrhHHthrrhhrnnnssssnnnhHhN....................................', // 35
  '...............................NhhrhhXXHrhrhhhMeESSSSEenSrrN....................................', // 36
  '...............................NhhrXXHHHrhrhhHWLLSSSSLWnsSrN....................................', // 37
  '...............................NhhrhhHHtrhrRsReeSSSSSeWpsSrN....................................', // 38
  '...............................NhhrhhXXhrhhrsssssssssvSpStrN....................................', // 39
  '...............................NhhrXXHHhrhhrmSsssssssSpRhhN.....................................', // 40
  '...............................NhhrhHHhhrhhRpmSssssSppRRrhN............................oo.......', // 41
  '...............................NhrhhHHhhrhRRpSmmmmppRRrNNN..........................oooAAo......', // 42
  '...............................NhrhHHhhrhRRRRwSSsspwRNN..........................oooAAoto.......', // 43
  '...............................NhrhHHhhrhRRRNwKyyyKwkkk.......................oooAAotoozo.......', // 44
  '..............................NhhrHHhhrhhRRNJwwKKKwwjkkKK....................oAAotozzzzzo.......', // 45
  '..............................NhhrHhhrhhRRRNJkwKyKwJjkkaPK...................otozzzzzzzzZo......', // 46
  '..............................NHhrHhrRhhRRNJJkwKyKwJjjPPkkK..................ozzzzzzzzZZYo......', // 47
  '.............................NHhRRRNJNhhRNJJjjKwwKJjaPPjkkkK................ozzzzzzZZYYoo.......', // 48
  '..............................NNNNNKjjjNNNJjjjkywwKPPjjJjkkkK....ppp....oooozzzZZYYYooo.........', // 49
  '.................................KJJjjjkJJjjjjjkyJaPjjjJjkkkK...pssspooouuuWZZYYYooo............', // 50
  '.................................KJjjjkJJjjjjjjJPPjjooJjJjkkkK..pssspuzuZZZWYYooo...............', // 51
  '................................KJjjjJKKJjjjjJjPPooozzojJjjkkkKopSSspZZZoooooo..................', // 52
  '...............................KJjjjJkkkKKjJjjjjAzzzZZojJjjjooouKksSpooo........................', // 53
  '...............................KJjjJjjjkkkKKKjjozZZooojjjooouzuZJjkpo...........................', // 54
  '...............................KJjjjjjjjjJkkkpppZoojjjooouzuZZZoJjK.............................', // 55
  '.............................ooKJjjjjjjjjJjjkssspjjooozuuZZZooojjkK.............................', // 56
  '...........................oozzzKJJjjjjjjJjjsssspoouuuZZZoooJjjjkK..............................', // 57
  '..........................ozzzzqqKKJJjjjjJJJSSSspuuZZZooojjJjjjkK...............................', // 58
  '.........................ozzzzQqqqqKKKKKKKKKqpsspZZooojjjjJjJjkK................................', // 59
  '........................oZzzzzQqqQQQQQQQXXqqqpspooojjkkkjJjJjkK.................................', // 60
  '........................oZzzzzQqqqqqqqqqXXtttQpzojjJJJJjJjjjkK..................................', // 61
  '.......................oZzzzzzzQqqqqqqqtttqqqQQzzojJjJjJjJjJjK..................................', // 62
  '.......................oZzzzzzAAQqqqtttXXqqqqqQzzzoJjJjJjJjJjK..................................', // 63
  '.......................oZzzzzzAAttttzzzXXQQQQzzZZZoKKKKKKKKKKK..................................', // 64
  '.......................oZzzzzzAAZzzzzzzzzzzzzzooooggGgggGggGGo..................................', // 65
  '.......................oYZzzzzZZzzzzzzzzzzzZoogggGggGGgggGggo...................................', // 66
  '........................oYZzzzzzzAAXAzzzZYoogggggGGggGggggGGo...................................', // 67
  '........................oYZzzzAXAAzzzzZYooggGgGgggGggGGgggggo...................................', // 68
  '.........................oYZZZZZZZZZYooogGgGggGgggGGggGgggooo...................................', // 69
  '..........................ooYYYYYYoooGGggGgGggGgggGGggGggoiio...................................', // 70
  '............................ooooooGGgGGgGggGggGggggGggGooIiiio..................................', // 71
  '..................................oooooGGgGgggGgggggGooIIIiiiio.................................', // 72
  '....................................oIIooooooooooooooIIIIIiiilio................................', // 73
  '...................................oIIIIIIIIIIo......oIIIIIiiilio...............................', // 74
  '.................................ooIiilliiIIIo........oIIIIIiiilio..............................', // 75
  '...............................ooIiilliiiIIIo..........oIIIIiiiilio.............................', // 76
  '..............................oIiilliiiIIIIo............oIIIiiiiilio............................', // 77
  '.............................oIilliiiIIIIoo..............oIIIIiiiiio............................', // 78
  '............................oIiiiiiiiiIoo.................oIIIiiiio.............................', // 79
  '............................oIiiiIIiioo....................oIIiiiio.............................', // 80
  '............................oIiiiiiIo......................oIiiiio..............................', // 81
  '............................oIIiiiio........................oIIiio..............................', // 82
  '............................oIIIiiio........................oIIIio..............................', // 83
  '............................oIIIIiio........................oIIIo...............................', // 84
  '............................oIIIIIIo........................oIIIo...............................', // 85
  '...........................oIIIIIoo..........................oIIIo..............................', // 86
  '...........................oIdddo............................oIIddo.............................', // 87
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
