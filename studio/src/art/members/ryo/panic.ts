// Ryo's panic: Bocchi's freak-out (panic.ts in ../bocchi) in Ryo's hand, so the band panics as one:
// shoulders shrugged up to the head, both arms flung out with the hands open and the fingers spread,
// the knees knocked together with the toes turned in, the bass slid down and turned so its neck
// dives, three strands of hair standing on end. A whole grid: the head is stand's pixel for pixel
// (rows 18-46, the bob included; the 16x10 face box at 42,30 untouched), so every face fits it.
//
// Where things are (col,row; checked against this grid):
// - Strands: Bocchi's three, in the hair ramp (N h H), rows 13-19 over the crown: the tall one
//   kinking left from its root at 44-45,18 to 39-40,13; two short ones bent right, rooted at 48-49,18
//   and 53,18-19. Every other head and hair pixel is stand's.
// - Arms and hands: Bocchi's panic arms and hands, the jacket in the sweater ramp (j base, J shade,
//   K outline; her white sleeve stripe becomes the sweater's lit top rim k). The near sleeve runs from
//   under the bob (col 28) to the elbow flat (cols 20-23, row 42) and up to a cuff whose opening sits
//   at col 10 (rows 38-47), two columns further out than Bocchi's: the oversized sleeve covers the
//   lower half of the palm. The far sleeve's cuff opening is at col 79 (rows 39-47). The hands are
//   Bocchi's (skin s/S, plum p): near fingers cols 3-9 rows 32-42, far fingers cols 80-85 rows 34-42.
// - Torso: an oversized V-neck sweater, cols 37-61, rows 39-58: the far shoulder's top at row 39
//   (cols 58-62) with its lit top k on row 40 under the hair's edge; stand's shirt collar, string-tie
//   bow and V (cols 44-51 rows 40-47); one pull fold from each armpit toward the middle (near: J from
//   40,48 to 43,52 with a short lit lip k at 41,48 42,49 43,50; far: J from 59,48 to 56,51); the near
//   side in shade (J band, cols 38-39), the far edge lit (k, col 60); a ribbed hem (rows 56-57, the
//   ribs vertical as on stand: J on even cols, j on odd) and its outline on row 58.
// - Strap: purple P with pink flowers a, 2 px wide at 2:1, from over the far shoulder (57-58,41) down
//   across the hem to the upper horn's tip (48,62), its chrome button A at 48,63.
// - Skirt: navy pleats, cols 32-63 rows 59-69 flaring right, seen right of the bass: as Bocchi's panic
//   skirt, a shade band G under the sweater's hem (row 59), pleat folds G every 4 cols (43-59) fanning
//   right toward the hem, the hem's shade band (row 69); its hem outline on row 70.
// - The bass, an Olympic White P-bass with the mint guard, slid down the strap as Bocchi's guitar is
//   (its body at her hip and over the near thigh, 3 rows lower than on stand) and dipping 1:3 like
//   hers (the neck on the stair whose top outline is cols x0..x0+2, x0 = 46 + 3*(row - 67)):
//   body cols 25-48, rows 56-74 (cream z, its side Y and shade Z along the lower left, the lit rim W
//   along the upper right; the upper horn's tip at 47-48,62-64, the lower horn under the neck at
//   43-45,70-72), the mint guard q with its Q bevel on the left, the chrome bridge A (30-32,62-64),
//   the strings t stepping down from the bridge (33,63; 34-36,64; 37-39,65; 40-42,66) into the board,
//   the split pickup drawn as on stand, one 2x2 half each side of the strings (X: 40-41,64-65 above,
//   38-39,66-67 below), the control plate with two knobs (30-35,69-70). Neck cols 43-72, rows
//   66-78: o / rosewood u (with z fret marks) / maple side Z / o, each a 3-col stair; the nut W at
//   72,76. Headstock cols 72-88, rows 70-81: cream, shaded Z/Y along its bottom edge, four chrome
//   keys A on stems t stepping down its top edge (74-75,71; 77-78,72; 80-81,73; 83-84,74), the
//   stand's tuner drawing turned the other way. It hangs in front of the near hip and the thighs.
// - Legs: Bocchi's knocked knees in Ryo's black tights: the near thigh (cols 39-49) pressed over the
//   far one (cols 49-57) under the hem, the near knee in front (rows 77-79), the shins splaying to the
//   ankles at row 86; the tights lit as on stand (I at both edges, i between, one sheen pixel l a
//   little left of centre, rows 72-83). Shoes: Bocchi's panic loafers (near cols 34-40, far 54-61,
//   rows 87-93, soles on 93).
// Every pixel stays 1+ px inside the canvas through the shake (cols 3-88, dx +-2).
//
// Built from layers by the artist's scratch script (ryo-pb3/build-panic.mjs --emit: Bocchi's panic
// recolored, stand's head, the hand-placed bass in body.mjs, neck.mjs and head-panic.txt, slid 3 rows
// down; the round-3 fixes are its steps 8-10: the pickup and strings, the sweater, the pleats).

import type { PoseDef } from '../../types'

export const panic: PoseDef = [
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
  '.......................................NN.......................................................', // 13
  '........................................NNN.....................................................', // 14
  '.........................................NhHN......NN...........................................', // 15
  '..........................................NhN....NhHN.NN........................................', // 16
  '...........................................NhHN.NhN..NhN........................................', // 17
  '..........................................NNhHNNhhNNNhN.........................................', // 18
  '.......................................NNNhhHHHHHHhhNhN.........................................', // 19
  '.....................................NNhhhhHHHHHHHHhhhhN........................................', // 20
  '....................................NhhhhhhhHHHHUUUUUhhhN.......................................', // 21
  '...................................NhhhrhhhHHrUUHHHrHUUUhN......................................', // 22
  '..................................NhhhrhHHHHrHHHHHrHHUUHhN......................................', // 23
  '..................................NhhrhhhHHrHHHHHrhHHHHHhhN.....................................', // 24
  '.................................NhhrhhhhhrHHhhHrhhHHrhHHhN.....................................', // 25
  '.................................NhrhhHhhhrhHHhHrhhHHrhHHhN.....................................', // 26
  '.................................NhrhhHhhhrhHHHHrhHHhrhHHhN.....................................', // 27
  '................................NhhrhHHhhrrhhHHHrhHHhrhhHhN.....................................', // 28
  '................................NhhrhHHhhrhhhhHHrhhHrrhhHHhN....................................', // 29
  '................................NhhrhHHhhrhhhhhhrrhhrrhhHHhN....................................', // 30
  '................................NhhrhHHhhrhhhrnnnrhrsnnphHhN....................................', // 31
  '......p..p......................NhhrhHHthrrhhrnnnssssnnnhHhN....................................', // 32
  '.....psppspp...................NhhrhhXXHrhrhhhMeESSSSEenSrrN....................................', // 33
  '....p.pspspsp..................NhhrXXHHHrhrhhHWLLSSSSLWnsSrN....................p..p............', // 34
  '...psppspspsp..................NhhrhhHHtrhrRsReeSSSSSeWpsSrN..................ppsppsp...........', // 35
  '....psSsSssp...................NhhrhhXXhrhhrsssssssssvSpStrN.................pspspspp...........', // 36
  '.....psssssp...................NhhrXXHHhrhhrmSsssssssSpRhhN..................pspspspsp..........', // 37
  '....ppssssKKK.................KNhhrhHHhhrhhRpmSssssSppRRrhN...................pssSssp...........', // 38
  '...pSSSsssKkkKKK............KKkNhrhhHHhhrhRRpSmmmmppRRrNNNKKKKK..............KKKssspp...........', // 39
  '....pppSssKjjjjkKK........KKkkjNhrhHHhhrhRRRRwSSsspwRNNkkkkkkkkKK........KKKKkkKssssSp..........', // 40
  '.......pSSKJJJJjkkKK....KKkkjjjNhrhHHhhrhRRRNwKyyyKwKkkkjPPjjJjkkKK....KKkkjjjjKssSpp...........', // 41
  '........ppKjjjjjjjkkKKKKkkjjjjNhhrHHhhrhhRRNJwwKKKwwJjkjjPPjjjJjjkkKKKKkkjjjjJJKSSp.............', // 42
  '..........KJJJJjjjjjkkkkjjjjjjNhrHHhhrhhRRRNJkwKyKwJJjjjPajjjjJjjjjkkkkjjjjJJjjKpp..............', // 43
  '..........KjjjjjjJjjJJJjjjjjJNHhrHhhrRhhRRNJJkwKyKwJJjjjPPjjjJJjJjjjJJJjjJjjjJJK................', // 44
  '..........KJJJJjJjjJjjjjjjjJNHhRRRNJJNhhRNJJjjKwwKJjjjjPPjjjjJJJjjjjjjjjjjJJJjjK................', // 45
  '..........KjjJJJJjjjjjjjjjJjJNNNNNKJJJNNNJJJjjkywwKjjjjPPjjjJJJJJJJJjjjjJJJJJJJK................', // 46
  '..........KKKKKJJJJjjjjJJJJJJJJJJKKKKJJJJjjjjjjkyJjjjjPPjjjjJJJJJJJJJJJJJJKKKKKK................', // 47
  '...............KKJJJJJJJJJJJKKKKK....KJJJkjjjjjjjjjjjjPajjjJkKKKKKKKJJJJKK......................', // 48
  '.................KKJJJJKKKKK.........KJJJJkjjjjjjjjjjPPjjjJjkK......KKKK........................', // 49
  '...................KKKKK.............KJJjJJkjjjjjjjjjPPjjJjjkK..................................', // 50
  '.....................................KJJjjJJjjjjjjjjPPjjJjjjkK..................................', // 51
  '.....................................KJJjjjJjjjjjjjjPPjjjjjjkK..................................', // 52
  '.....................................KJJjjjjjjjjjjjPajjjjjjjkK..................................', // 53
  '.....................................KJJjjjjjjjjjjjPPjjjjjjjkK..................................', // 54
  '....................................KJJjjjjjjjjjjjPPjjjjjjjjkkK.................................', // 55
  '...............................ooo..KjJjJjJjJjJjJjPPJjJjJjJjJkK.................................', // 56
  '.............................oozzzooKjJjJjJjJjJjJPPjJjJjJjJjJkK.................................', // 57
  '............................ozzzzzWWooKKKKKKKKKKKPaKKKKKKKKKKKK.................................', // 58
  '...........................oZzzzzzzzWWooGGGGGGGGPPGGGGGGGGGGGo..................................', // 59
  '...........................oZzzzzzzzzzWWoooooggGPPgGgggGgggGgo..................................', // 60
  '..........................oZzzzzzzzzzzzQqqqqWooPPggGgggGgggGgo..................................', // 61
  '..........................oZzzzAAzzzzzQqqqqqqqWoPggGgggGgggGggo.................................', // 62
  '.........................oZzzzzAAtzzzQqqqqqqqqqWAggGggggGgggGgo.................................', // 63
  '.........................oZzzzAAzztttQqqXXqqqqqZoggGggggGgggGggo................................', // 64
  '.........................oZzzzzzzzzzQtttXXqqqoooggggGgggGgggGggo................................', // 65
  '.........................oZzzzzzzzzzQqXXtttooogGggggGgggGgggGggo................................', // 66
  '.........................oYZzzzzzzzzQqXXqqquuzooogggGgggGgggGggo................................', // 67
  '..........................oYZzzzzzzzQqqqqqqZZZuuuoooGgggGggggGgo................................', // 68
  '..........................oYZzAXAzzzzQqqqqqoooZZZzuuoooGGGGGGGGo................................', // 69
  '...........................oYZzzAAXAzzQqqqqqqqoooZZZzuuooooooooo..........oo....................', // 70
  '............................ooYZZzzzzzzQQqqqqZoIIoooZZZuzuooo............oAAooo.................', // 71
  '..............................oooYYZZZzzzQQZZoiIIoIioooZZZuuzooo.........otooAAooo..............', // 72
  '.................................ooooYYYYYYooiiIIoIiilioooZZZuuuooo......ooootooAAooo...........', // 73
  '.....................................ooooooiliiIIoIiliIIo.oooZZZuzuooo..ozzzooootooAAo..........', // 74
  '.........................................oIiiliiIIoIiiIIo....oooZZZuuuooozzzzzzooooto...........', // 75
  '.........................................oIiiliiIIoIiiIIo.......oooZZZuuWzzzzzzzzzooo...........', // 76
  '..........................................oIiiliiIIoIiIo...........oooZZZZzzzzzzzzzzzooo........', // 77
  '..........................................oIiiiliiIIoIIo..............oooZZzzzzzzzzzzzzzo.......', // 78
  '..........................................oIiiliiIIoIiiIo................oooZZZzzzzzzzzZo.......', // 79
  '.........................................oIiiliiIIoIiliIIo..................oooYYZZZZZZo........', // 80
  '........................................oIiiliiIIo.oIiiIIo.....................oooooooo.........', // 81
  '.......................................oIiiliIIo....oIiiIIo.....................................', // 82
  '......................................oIiiliIIo......oIiiIIo....................................', // 83
  '.....................................oIiiiiIIo........oIiiIo....................................', // 84
  '....................................oIiiiIIo...........oIiiIo...................................', // 85
  '...................................oIiiIIoo.............oIiiIo..................................', // 86
  '...................................oIdddo...............oddIIo..................................', // 87
  '..................................odfffo................offddo..................................', // 88
  '..................................odfDDo................oDDfdo..................................', // 89
  '..................................odfffo...............offffdo..................................', // 90
  '..................................oddFFFo.............oFFFfdxo..................................', // 91
  '..................................oxxxxxo.............oddddxo...................................', // 92
  '..................................ooooooo..............ooooo....................................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
