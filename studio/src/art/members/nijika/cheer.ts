// Nijika's cheer: the top of a happy jump, a whole 96x96 grid on Bocchi's cheer (bocchi/cheer.ts): the
// same guts-pose fist pump on the near side and the far fist straight up, the near leg kicked back, the far
// leg straight to a pointed toe. She raises a stick in each fist. The head is stand's, pixel for pixel, at
// offset 0. The top row is 13 (the Dorito's tip and the far stick's tip): nothing rises above her head, so
// the happy jump gets the most hang her head allows (9 rows; Bocchi's 11 needs a top row of 15).
//
// - Near arm (Bocchi's guts pose, 1 row lower under Nijika's longer side lock, in her white shirt): the
//   upper arm level from the shoulder under the side lock's tip (top outline q25-31 on row 43; under the
//   lock, w32-34 meets the lock's own outline, so no doubled line), lit w on top, y and Y beneath, its
//   bottom outline on row 49 into the vest's side o39. The elbow corner at cols 16-19, rows 43-49, a y
//   crease from 24,43 to 21,46 at the inner elbow. The forearm leans out 2:1 (cols 12-24, rows 36-42), y
//   down its shaded left side; the cuff (rows 33-35) tilts with it, its y seam rising to the right. The
//   crook between the forearm, the upper arm and the head stays background for the hang's left sparkle
//   and twinkle.
// - Near fist (cols 11-17, rows 27-32): the back of the hand, as Bocchi's: a flat top with cut corners,
//   an S knuckle row (29), S down its left side, the thumb notch toward the head (16,31).
// - Far arm: straight up beside the head, right of the scrunchie (Bocchi's fist would sit on it). The
//   fist (cols 63-70, rows 18-23) is seen from the finger side with the thumb across it in S (row 21),
//   its bottom row in the cuff (rows 24-26: a white band over a y seam). The sleeve tapers down to the
//   shoulder (cols 58-65, rows 41-46), y on its shaded left side, a fold at 64-65,30-31. The tail root
//   shows left of the fist as on stand (rows 17-23) and keeps stand's tones between the head and the
//   sleeve (u59-60 against the head, then r and h, cols 59-61, rows 24-34), so the lit root runs from
//   the scrunchie behind the arm into the flung tail; u only as a 1-px cast shadow along the sleeve's
//   q (cols 61-62, rows 24-31).
// - Sticks (light wood: a on the upper side, T, the outline o beneath, an o end cap): the near one comes
//   out of the fist's flat top, 2 rows a step up-left to 9,15 (cap 9-10,14), about 14 px; the far one
//   comes out of the fist's top-right corner (a69,18) and lies flatter, 2 px a step out to the right
//   (a on top, T, o beneath) to its tip at 78-79,13 (cap o80,13-14), about 12 px.
// - Ponytail: lifted off her back and trailing down-right from under the raised far arm (rows 27-53, the
//   tip at 80,53 and a flick out to 84,50). H runs along its lit upper edge, which steps out evenly, with
//   r and u beneath; it is outlined p where it leaves the sleeve.
// - Torso: stand's collar and bow (rows 41-49); the vest's armholes under both arms (q40 c41, c57 q58),
//   the vest V at its left edge, c at its right, the V-neck closing at 49,52; its hem band c (row 56)
//   ridden up by the raised arms, so a strip of white shirt shows on row 57.
// - Skirt: flared for the jump from the waist (cols 40-56, row 58) to the hem (cols 28-65, row 66),
//   pleats fanning from about 48,30 (G folds, b lit faces on the right half), a sawtooth hem on
//   row 67 (the folds hang a row lower, outlined beneath on row 68).
// - Legs (Bocchi's, her socks turned to bare skin): the near thigh comes down from the hem (cols 37-46)
//   to a knee with Bocchi's kneecap bump (o47, rows 75-76), drawn as Bocchi's bare thigh is: S under
//   the hem (row 69), then a light band s down its middle (40-44 on row 70, stepping right to 44 on row
//   77) between an S rim on each side. Its back edge is the knee crease C, an even 1:1 line from the
//   notch 36,71 to 43,78 against the bottom outline, so the thigh reads in front of the kicked-back
//   shin. The shin (rows 71-79) is S behind it, lit s only on its top by the sock (35,71 34-35,72), and
//   tapers into the sock: 6 rows at the cuff, 9 under the knee (top outline row 71 to col 34, then row
//   70; bottom row 78 to col 35, 79 at 36-37, 80 at 38-43). A short white sock covers the ankle (cols
//   29-33, rows 72-77, cuff y33), and the red sneaker is sole-up behind her (cols 19-28, rows 70-77,
//   white sole). The far leg is straight, S on its left, with a sock on rows
//   82-86 (cuff y on 82) and the sneaker pointed down (rows 87-93: laces 63-64,89, white toe cap
//   67-68,91, white sole 64-68,92).
// - One color of its own (`colors`): C, the crease's deeper skin; the rest is stand's palette.

import type { Palette, PoseDef } from '../../types'

/** The bare leg's crease: a deeper skin, between the shade S and the chin line m, cooler (the knee-back fold). */
export const colors: Palette = {
  C: '#d8968e',
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
  '..........................................ppp.................................aao...............', // 13
  '.........oo...............................phhpp.............................aaTTo...............', // 14
  '........oTa................................phhHp..........................aaTToo................', // 15
  '........oTa................................prhhHpp......................aaTToo..................', // 16
  '.........oTa................................prhhHHp.......pp..........aaTToo....................', // 17
  '.........oTa..............................ppprhhhHHp.....pZzp.pp.ppppaTToo......................', // 18
  '..........oTa..........................ppphhhhhhHHHHpppppZZZpphHpsssspoo........................', // 19
  '..........oTa........................pphhhhhhhhhhHHHHhhhprZZphhpSSssssp.........................', // 20
  '...........oTa......................phhhrhhhhhhhhhHHHHhhpZrZprrpSSSSSsp.........................', // 21
  '...........oTa.....................phhhhrhhrhhHHrhHHHHhhhprpuurhpSssssp.........................', // 22
  '............oTa....................phhhrhhhrhHHHrhHrhhHHrhpuurhhpSssspp.........................', // 23
  '............oTa...................phhhhrhhrhHHHrhHHrhHHHrhpuuruqwwwwwwq.........................', // 24
  '.............oTa..................phrhhrhhrhHHhrHHrrhHHhrhpurruqyyyyyyq.........................', // 25
  '.............oTa..................phrhrhhhrHHHhrHHrSrHHhrhpurruqywwwwq..........................', // 26
  '.............pTap.................phrhrhhhrHHHrHHrSsSrHhrhprruqywwwwwqp.........................', // 27
  '............pssssp................phrhrhhhhhHHrHrSsssSHhrhprhuqywwwwwqHp........................', // 28
  '...........pSSSSsp................phhhrhhhhhHHrSSssssSrhhhprhuqywwwwqHHHp.......................', // 29
  '...........pSssssp................phhhrhhhnhhSSSSssssSrrnhhphuqywywwqHHHHp......................', // 30
  '...........pSsssp.................pHhhrhhhnnnnnnsssssnnnrHhphuqyYywwqhhhHHp.....................', // 31
  '...........pSSsssp................pHHhrhhhrnWEMEnssssWMnrHHprqywwwwwqrhhHHp.....................', // 32
  '...........qwwwwwwq...............pHHhrhhhrseeMessssseEnrHHprqywwwwqhhrhHHHp....................', // 33
  '...........qwwwyyyq...............pHHhrhhhrseeeessssseeprHHprqywwwwqhhrhHHHp....................', // 34
  '...........qyyywwwwq..............pHHhrhhhrssQQssssssQsprHHpqywwwwwqrhhhrHHHp...................', // 35
  '............qyywwwwq..............pHHhrhhhhrssssssssssSprHHpqywwwwqpprrhhhrHHp..................', // 36
  '.............qyywwwwq............pHHhhrhhhhrmsiWWWissSprrHHpqywwwwq.prrhhhrHHp..................', // 37
  '.............qyywwwwwq..........pHHhhrrhhhhhpmsiiisSpprrrHHpywwwwq..purrhhhhHHp.................', // 38
  '..............qyywwwwq..........pHhhhrhhrhhhpssssspprrrrHHhpywwwwq..purrrhhhHHp.................', // 39
  '...............qyywwwwq........phHrhhhhrprhhqqSSSsqqqprrrHhpywwwwq...puurrhhHHp.................', // 40
  '...............qyywwwwwq.......phhrhhrhhprrKKywwwwwwwKKrrHpywwwwwq....puurhhHHp.................', // 41
  '................qyywwwwwq.......ppprhpprpppKRKwwwwwwKRKprpqywwwwwq......purrhHHp................', // 42
  '................qyywwwwwyqqqqqqqwwwpwwwpqcVVRRKKKKKKRRKvpcqywwwwwq.......purhhHHp...............', // 43
  '.................qyywwwywwwwwwwwwwwwwwwwqcVVRPRkRRkRPRKvvcqywwwwyq.......purhhHHp...............', // 44
  '.................qyywwywwwwwwwwwwwwwwwwwqcVVkRRkRRkRRkKvcwqywwwq.........puurhHHp...............', // 45
  '.................qyywywwwwwwwwwwwwwwwwwwqcVVkkkkRRkkkkKvcwqyyq...........puurhhHp...............', // 46
  '.................qyyyyyyyyyyyyyyyyyyyyyyqVVKKKVkRRkVKKKvccqq..............purhhrHp..............', // 47
  '..................qYYYYYYYYYYYYYYYYYYYYqVVvvvvKRKKRKvvvcco................puurhhhrHp............', // 48
  '...................qqqqqqqqqqqqqqqqqqqqoVVvvvKRKywKRKvvcco................puurhhhpHHp...........', // 49
  '.......................................oVVvvvvvcywcvvvvcco.................purrhhp.pHp..........', // 50
  '.......................................oVVvvvvvvcycvvvvcco..................prrhhp..p...........', // 51
  '.......................................oVVvvvvvvvcvvvvvcco....................prhp..............', // 52
  '.......................................oVVvvvvvvvvvvvvvcco.....................php..............', // 53
  '........................................oVvvvvvvvvvvvvvco.......................................', // 54
  '........................................oVvvvvvvvvvvvvvco.......................................', // 55
  '........................................oVvvcccccccccvvvco......................................', // 56
  '........................................occcywwwwwwwycccco......................................', // 57
  '........................................oGgggGggGbggGbggo.......................................', // 58
  '.......................................ogGgggGggGbggGbggGo......................................', // 59
  '......................................ogGgggGgggGbgggGbggGo.....................................', // 60
  '.....................................oggGgggGgggGbgggGbggGbo....................................', // 61
  '...................................oGgggGgggGgggGbgggGbggGbgo...................................', // 62
  '..................................oGggggGgggGgggGbgggGbggGbggo..................................', // 63
  '................................oggGgggGggggGgggGbgggGbgggGbggo.................................', // 64
  '..............................ogggGggggGggggGgggGbgggGbgggGbgggGo...............................', // 65
  '............................oGggggGggggGggggGgggGbgggGbgggGbgggGbo..............................', // 66
  '...........................ogGooogGooogGooogGoogGooogGooogGooogGoo..............................', // 67
  '............................oo...oo..oooSSSooSooo...oooSSooSSSoo................................', // 68
  '.....................................oSSSSSSsSo.......oSSsssssSo................................', // 69
  '....................ooo....oo......oooSSsssssSo........oSSssssSo................................', // 70
  '...................owwwoooowwoooooosCSSSsssssSo........oSSssssSo................................', // 71
  '...................oFFFwwwwfdwwwwyssSCSSsssssSo........oSSsssssso...............................', // 72
  '....................oFffwwffdwwwwySSSSCSSssssSo........oSSsssssso...............................', // 73
  '.....................oodffffdwwwwySSSSSCSSsssSo.........oSsssssso...............................', // 74
  '.......................ooddddywwwySSSSSSCSSsssSo........oSsssssso...............................', // 75
  '.........................ooddyywwySSSSSSSCSSssSo........oSsssssso...............................', // 76
  '...........................ooyyyyySSSSSSSSCSsSo..........oSsssssso..............................', // 77
  '.............................oooooooSSSSSSSCSo...........oSSSsssso..............................', // 78
  '....................................ooSSSSSSo............oSSSsssso..............................', // 79
  '......................................oooooo..............oSssssso..............................', // 80
  '..........................................................oSssssso..............................', // 81
  '..........................................................oyyyyyyo..............................', // 82
  '...........................................................oywwwwo..............................', // 83
  '...........................................................oyywwwwo.............................', // 84
  '............................................................oywwwwo.............................', // 85
  '............................................................oywwwwo.............................', // 86
  '............................................................oddffffo............................', // 87
  '...........................................................odddfffFo............................', // 88
  '...........................................................oodfwwfFo............................', // 89
  '.............................................................odfffFFo...........................', // 90
  '..............................................................oddffwwo..........................', // 91
  '...............................................................oywwwwo..........................', // 92
  '................................................................ooooo...........................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
