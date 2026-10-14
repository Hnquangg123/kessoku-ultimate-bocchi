// Nijika's stand (v2): idle and ready, both light-wood sticks crossed low
// before her (ART-BRIEF.md "The poses"). The head drawn here is the head of
// every pose but the box.
//
// Built on REF_STAND, in the reference's hand: its legs, stance, knees,
// skirt silhouette and hem, the far thigh, Bocchi's picking arm (sleeve
// contour, elbow fold, cuff) and her hand (on both fists, the far one
// mirrored) and the face geometry, recolored to Nijika's ramps
// (reference/character-notes.md); the hair, the top and the sticks drawn over
// them. Light from the upper right; 1-px outlines (o for the lower body,
// sticks and shoes; p for hair and skin; q for the shirt; K for the bow's
// silhouette).
//
// Where things are (cols, rows):
// - Dorito ahoge: a flat, solid corn-chip triangle leaning to the viewer's
//   left, rows 13-18: a 3-px cap 42-44,13; left edge 42 (rows 13-14), 43
//   (15-16), 44 (17-18) into the crown's 42-44,18; right edge 44,13 / 45-46,14
//   / 47,15 / 48-49,16 / 50,17 / 51,18; fill widths 2-3-4-5-6 (rows 14-18,
//   base cols 45-50); h tip, r on its left face (44,16 45,17-18), an H band
//   down its right face from row 15 (46,15 47,16 48-49,17 49-50,18).
// - Head and hair: crown 39-41,19 / 37-38,20 / 36,21 / 35,22-23, then col 34
//   from row 24 (a round dome); far contour 52-56,19, the scrunchie, 58
//   (rows 23-29), 59 (30-40). Near-side strands: r curving up into the crown
//   40,21-22 / 39,23-25 / 38,26-37 (37,38-39), and a short one at 36,25-28.
//   Near side lock out to col 31 (rows 40-41), flaring at chin height to
//   2-px tips (32-33 over row 42, 35-36,42 to 35,43, 39,43); its inner strand
//   ends at 41,41-42. Far side lock cols 53-58 to its tip 57-58,42.
// - Scrunchie: a small bumpy ring in the hair's yellow, outline cols 56-60
//   rows 17-22 (top 58-59,17; bottom 57,22 and 59,22 round an r bump at
//   58,22), fill 3x4 at 57-59 rows 18-21: Z, one z sheen at 59,18, r gathers
//   on the shadow side (57,20 58,21). The tail root closes over its right
//   side (61,19 p, 61,20 h, 61,21 r); the crown over its left (55,20-21 h).
// - Side tail: springs out of the scrunchie (root 61-65 rows 18-21, top
//   62-63,18), pinched under it (rows 22-24, right edge 66), swelling to
//   right edge 67 (rows 25-29) and 68 (30-41), tapering 67 (42-47) and 66
//   (48-51). It hangs behind the far shoulder: deep shadow u at 59,41-43,
//   60-61,44, col 61 rows 45-47, 60-61 row 48, 59-60 rows 49-54, the sleeve's
//   q its only edge. It ends in a main lock tapering to 62,59 and an outer
//   flick (66-67, rows 54-55) tipping at 67,56. H band on the lit right, r and
//   u on the inner side; root strands fan out of the scrunchie, creases lead
//   into the split (64-65, rows 51-54).
// - Eyes: lid row 31 (near 42-47 solid, its lash flicking up at 42,30; far
//   53-55, flick 56,30), each flick standing alone against h (42,28-29 and
//   56,29 are h: the strands stop a pixel short); near eye cols 42-48 rows
//   30-35, far eye 53-56.
// - Grin: row 37 i46 W47-49 i50, row 38 i47-49; chin line 44,37 45,38; the
//   chin row 39 lit (s 45-49) over the neck's S (row 40, 46-49); jaw p
//   44,38-39 (44,40 collar q) and 50-51,39 52-53,38 54,37.
// - Collar rows 40-42; the bow cols 43-54 rows 41-49 (tails end row 49),
//   outlined K only on its silhouette (row 43's top edge against the collar,
//   the loops' outer sides and bottoms, the tails); inside it the shade k
//   does the work: the knot cols 47-50 rows 44-47 is a k R R k band, the
//   loops R with a k lower shade and a P dot each (45,44 and 52,44).
//   Vest: its shoulders run out to the armholes, near V at 40-42 rows 43-47
//   (armhole c 40,43-44 41,45-46 42,47), far v at 55-56 rows 43-47 (armhole
//   c 57,43-44 56,45-46 55,47); the body cols 43-53 rows 47-57, V-neck trim
//   c at 47-50 rows 50-52, a ribbed hem on row 57 (c47 V48) between the fists.
// - Near sleeve (the reference's arm): outer edge 36 (rows 43-44), 35 (45),
//   34 (46-48, the elbow), 35 (49-52), then the forearm tapers 36,53 .. 40,57
//   to the cuff (38-42, rows 54-56); inner edge q 42 rows 48-52. Far sleeve,
//   foreshortened (the elbow tucked, so the arms do not hoop): outer edge
//   58,43 59,44, 60 (45-47, the shoulder; playB's raised forearm sits on
//   it), 59 (48), 58 (49-55), 57,56 56,57; inner q 54 rows 48-51, the elbow
//   crease Y 55-56 rows 50-51.
// - Fists: near cols 41-45 rows 54-59, far cols 50-54 rows 55-60, outlined p
//   and closed at the bottom (p 42-44,59; p 52-53,60) as the reference's hand
//   is, so each stick starts under its fist's outline.
// - Sticks (o T a: the outline on the left, the lit a on the right, both in
//   the notes' wood, darker than the skin): near-hand stick from 44-45,60
//   down-right to the tip 53,68; far-hand stick from 51-52,61 down-left to
//   the tip 43,69; they cross at 48,63-64, the near one in front.
// - Skirt cols 33-60, waist rows 58-59, hem rows 69-70 (its corner 40,58),
//   the right flank outlined o in an even run 57,57 58,58-59 59,60-61
//   60,62-64; knees rows 71-74 (bend 72). Near bare leg: REF_STAND's
//   silhouette, thigh 37-44 (rows 72-73), the knee-back crease S 44,73 43,74,
//   the calf's outline o right 44 (row 75), 43 (76-77), 42 (78), 41 (79), 40
//   (80), 39 (81) and left 35 (75-76), 34 (77-78), 33 (79), 32 (80-81); S on
//   its left 1-2 cols, s on its lit right. Far knee: one highlight band
//   57-58,71 58-59,72 59-61,73 59-62,74. White socks rows 81-87; red
//   sneakers rows 87-93 (near cols 26-32, far cols 61-68), soles on row 93.

import type { Grid } from '../../types'

/** The 32x32 portrait window over her head on stand (its top-left): the Dorito (from row 13), both eyes, the grin, the scrunchie. The lid row (31) lands on window row 20, an even row. */
export const head = { x: 34, y: 11 }

/** The knee row: a squash lowers every row above it (a breath, a bob, a landing). */
export const bend = 72

export const stand: Grid = [
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
  '..........................................ppp...................................................', // 13
  '..........................................phhpp.................................................', // 14
  '...........................................phhHp................................................', // 15
  '...........................................prhhHpp..............................................', // 16
  '............................................prhhHHp.......pp....................................', // 17
  '..........................................ppprhhhHHp.....pZzp.pp................................', // 18
  '.......................................ppphhhhhhHHHHpppppZZZpphHp...............................', // 19
  '.....................................pphhhhhhhhhhHHHHhhhprZZphhHHp..............................', // 20
  '....................................phhhrhhhhhhhhhHHHHhhpZrZprrhHHp.............................', // 21
  '...................................phhhhrhhrhhHHrhHHHHhhhprpuurhHHp.............................', // 22
  '...................................phhhrhhhrhHHHrhHrhhHHrhpuurhhHHp.............................', // 23
  '..................................phhhhrhhrhHHHrhHHrhHHHrhpuurrhHHp.............................', // 24
  '..................................phrhhrhhrhHHhrHHrrhHHhrhpurrhrhHHp............................', // 25
  '..................................phrhrhhhrHHHhrHHrSrHHhrhpurhhrhHHp............................', // 26
  '..................................phrhrhhhrHHHrHHrSsSrHhrhprrhhhrHHp............................', // 27
  '..................................phrhrhhhhhHHrHrSsssSHhrhprhhhhrHHp............................', // 28
  '..................................phhhrhhhhhHHrSSssssSrhhhprhhhhhHHp............................', // 29
  '..................................phhhrhhhnhhSSSSssssSrrnhhphhhhhHHHp...........................', // 30
  '..................................pHhhrhhhnnnnnnsssssnnnrHhphhrhhHHHp...........................', // 31
  '..................................pHHhrhhhrnWEMEnssssWMnrHHphhrhhhHHp...........................', // 32
  '..................................pHHhrhhhrseeMessssseEnrHHphhrhhhHHp...........................', // 33
  '..................................pHHhrhhhrseeeessssseeprHHphhhrhhHHp...........................', // 34
  '..................................pHHhrhhhrssQQssssssQsprHHphhhrhHHHp...........................', // 35
  '..................................pHHhrhhhhrssssssssssSprHHprhhrhHHHp...........................', // 36
  '.................................pHHhhrhhhhrmsiWWWissSprrHHprhhhrHHHp...........................', // 37
  '................................pHHhhrrhhhhhpmsiiisSpprrrHHprrhhrhHHp...........................', // 38
  '................................pHhhhrhhrhhhpssssspprrrrHHhprrhhhrHHp...........................', // 39
  '...............................phHrhhhhrprhhqqSSSsqqqprrrHhprrhhhrHHp...........................', // 40
  '...............................phhrhhrhhprrKKywwwwwwwKKrrHpurrhhhhHHp...........................', // 41
  '................................ppprhpprpppKRKwwwwwwKRKprppurrrhhHHp............................', // 42
  '...................................pqywpcVVKRRKKKKKKRRKvpcquurrhhHHp............................', // 43
  '....................................qyywcVVKRPRkRRkRPRKvvcwquurhhHHp............................', // 44
  '...................................qyywwwcVKkRRkRRkRRkKvcwwwqurhhHHp............................', // 45
  '..................................qyywwwwcVKkkkkRRkkkkKvcwwwqurrhHHp............................', // 46
  '..................................qyywwwwycKKKVkRRkVKKKcywwwqurhhHHp............................', // 47
  '..................................qyywwwyyqVVVKRKKRKvvqyywwquurhHHp.............................', // 48
  '...................................qyywyYYqVVKRKywKRKvqywwquurrhHHp.............................', // 49
  '...................................qyywwYYqVVVvcywcvvvqYywquurrhhHp.............................', // 50
  '...................................qyywwwqqVVvvvcycvvvqYYyquurhhrHp.............................', // 51
  '...................................qyywwyyqVVvvvvcvvvqqwwyquurhhrhHp............................', // 52
  '....................................qyywwyyqqvvvvvvvqwwwwyquurhhhrHp............................', // 53
  '.....................................qyYwwysSpvvvvvqqywwwyquurhhhpHHp...........................', // 54
  '......................................qYwysssspvVvpssywwYyqurrhhp.pHp...........................', // 55
  '.......................................qysssSSpvVpssssywYq.prrhhp..p............................', // 56
  '........................................qsssSspcVpSssssyqo..prhp................................', // 57
  '........................................opsSspGGGpsSssspggo..php................................', // 58
  '........................................oGpppggGggpsSspGbgo...p.................................', // 59
  '.......................................oGgGoTaGggggoppGbggGo....................................', // 60
  '......................................oGgGggoTagggoTagGbgGbo....................................', // 61
  '.....................................oGgGgggGoTagoTagGbggGbgo...................................', // 62
  '....................................oGggGgggGgoTaTabgGbggGbgo...................................', // 63
  '...................................oGggGgggGgggoTaGbgggggGbgo...................................', // 64
  '..................................oGggGggggGggoToTaGbgggGboo....................................', // 65
  '.................................oGgggGgggGggoTagoTabgggGoSo....................................', // 66
  '.................................oGggGggggGgoTagggoTagggoSSSo...................................', // 67
  '.................................oGggGgggGgoTaGgggGoTaooossso...................................', // 68
  '..................................ooooogGgoTaGggggGoooSSssssSo..................................', // 69
  '.....................................oSoooooooooooooSSSsssssso..................................', // 70
  '.....................................oSSSSSSSSo.....oSSSSssSSo..................................', // 71
  '....................................oSSsssssso.......oSSSSssSSo.................................', // 72
  '....................................oSssssssSo........oSSSSssso.................................', // 73
  '....................................oSsssssSo..........oSSSsssso................................', // 74
  '...................................oSssssssso...........osssssso................................', // 75
  '...................................oSsssssso............oSsssssso...............................', // 76
  '..................................oSSsssssso............oSSssssso...............................', // 77
  '..................................oSsssssso..............oSSSSsso...............................', // 78
  '.................................oSsssssso...............oSSSssso...............................', // 79
  '................................oSSssssso.................oSsssso...............................', // 80
  '................................oSssssso..................oyyyyyo...............................', // 81
  '...............................oyyyyyyo....................oywwwo...............................', // 82
  '..............................oywwwwwo.....................oyyywo...............................', // 83
  '.............................oywyywwo.......................oywwo...............................', // 84
  '............................oyywwwwo........................oywwo...............................', // 85
  '...........................oyywwwoo..........................oywwo..............................', // 86
  '...........................oydddo............................oywddo.............................', // 87
  '..........................odfffo.............................oddffo.............................', // 88
  '..........................odfwwo.............................odfwwo.............................', // 89
  '..........................odfffo.............................odffffo............................', // 90
  '..........................oddfwwo............................oxdfFwwo...........................', // 91
  '..........................oywwwwo.............................oywwwwo...........................', // 92
  '..........................ooooooo..............................ooooo............................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
