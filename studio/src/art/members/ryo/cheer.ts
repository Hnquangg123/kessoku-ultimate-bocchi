// Ryo's cheer: the top of a happy jump, a whole 96x96 grid: Bocchi's cheer (../bocchi/cheer.ts) in
// Ryo's own cool key. Both hands come off the bass like the rest of the band's, but smaller: the far
// fist straight up, the near one a short bent arm with the fist at shoulder height. The bass hangs
// on its strap. The head is stand's, pixel for pixel, at offset 0.
//
// - The near arm is a small guts pose, out to the left under the bob (Bocchi's flung arm, shorter).
//   - The fist is Bocchi's near fist pixel for pixel (back of the hand, S knuckle row, the thumb
//     notch toward the head), at cols 15-21, rows 37-41.
//   - The ribbed cuff covers the lower half of the hand (K15 j/J ribs k21 K22, rows 42-43), with a J
//     shadow under it (row 44).
//   - The forearm goes straight down to the elbow (K15, J16, j17-19, the lit band k20-21, K22).
//   - The elbow corner rounds off at K16 (51) and K17 (52). The upper arm runs level back to the
//     shoulder under the bob (rows 47-53). Its top outline is K23-29 on row 47, and then the bob's
//     own outline above k30-36. The lit top k is on row 48 (cols 22-29) and on row 47 (cols 30-36).
//     The underside is J (row 52) and the outline K18-33 (row 53), which turns up at the armpit
//     K34-35 (52). A J crease marks the inner elbow (J21 on row 48, J22 on row 49).
//   - The crook between the forearm, the upper arm and the bob's lifted tip stays background, so
//     the hang's left sparkle bursts out in clear air.
//   - A pull fold runs from the near armpit toward the middle: J37 k38 (49), J37-38 k39 (50),
//     J38-39 k40 (51), J39-40 (52). It is panic's fold, moved to this armpit.
// - The far arm goes straight up beside the bob, like Bocchi's far arm. Its inner outline is the
//   bob's own outline (N at cols 57-59).
//   - The fist is Bocchi's far fist (seen from the finger side, the thumb wrapped across), at cols
//     57-64, rows 17-21, lit as hers from the upper right: shade S down its left side
//     (S58-59 on row 19), the thumb S58-62 across row 20, the knuckles lit s on the right.
//   - The oversized sleeve covers half the hand. The ribbed cuff (j/J) is at cols 58-64, rows 22-23,
//     outlined K65, with a J shadow under it (row 24).
//   - The sleeve is 6 px wide: J on the inner side, and on the outer side stand's 2-px lit band k
//     (cols 63-65). An elbow crease runs k61 (row 30), J61 k62 (31), J62 k63 (32), J63 (33). Its
//     outline is K65 on rows 22-28 and K66 on rows 29-39.
//   - The sleeve widens into the raised shoulder (rows 39-46), in J shadow under the bob (J55-58,
//     row 40). Its outer contour eases into the sweater's far side: K65 (40), K64 (41), K63 (42-44),
//     K62 (45-46), K61 (47-58). The lit rim k runs along it.
//   - A fold runs down-left from the armpit: J58 (44), J57 (45), J56 (46), into stand's J55 (47).
//   - The strap goes on over the shoulder under the raised arm: P56-57 (42), a57 P58 (41).
// - The raised arm pulls the sweater's far side up. The ribbed hem steps up toward the arm: K48-53
//   on row 61, K54-57 on row 60, K58-61 on row 59. The far edge is k60 K61 down rows 47-56.
// - The bass hangs on its strap with no hand under it. It is panic's bass (stand's drawing turned)
//   swung back up to a 1:6 dip, so the neck runs nearly level and a little down. The body stays at
//   the hip, about where stand slings it.
//   - The strap is taut from the far shoulder to the upper horn's button, on panic's path: 2 px
//     wide, a column every 2 rows (P56-57 on rows 42-44 down to P50-51 on row 55), with a pink
//     flower a on its right pixel every 5 rows (a57 on row 43, a55 on 48, a52 on 53). The chrome
//     button A50 (56) sits at the horn's tip.
//   - The body: cols 27-50, rows 52-68. Its top-left corner is under the near upper arm. The left
//     contour is o30 (54), 29 (55-56), 28 (57-59), 27 (60-62), 28 (63-64), 29 (65), 30 (66),
//     31-32 (67), with the bottom o33-43 on row 68. The top edge steps down to the horn: o36-38
//     (52), 39-42 (53), 43-46 (54), 47-48 (55). Its underside steps back to the neck: o49 (57),
//     o48 (58), o47 (59).
//   - Light from the upper right: the lit rim W under the top edge (W36-38, 39-42, 43-46, and the
//     horn W47-49), the shade Z one pixel inside the left contour, and the body's side Y along
//     the lower left and the bottom (Y33-43 on row 67) over the Z band (row 66).
//   - The mint guard q has its bevel Q on the left (Q39 (56), Q38 (57), Q37 (58-64)) and along
//     the bottom (Q39-45 on row 65). The bridge A is at cols 33-34, rows 58-60. The strings t run
//     at the neck's 1:6 into the board (t35-40 on row 59, t41-45 on row 60). The split pickup has
//     one 2x2 half on each side of them (X42-43 on rows 58-59, X38-39 on rows 60-61). The control
//     plate with its two knobs is A33 X34 A35-36 X37 A38 on row 65. The lower horn sits under the
//     neck at z47 (64) and z46 (65).
//   - The neck runs from col 46 to the nut W74 (65): o / board u (frets z every 3 cols) / maple
//     side Z / o. Each layer drops a row every 6 columns, so the top outline is on row 60 at cols
//     46-51 and on row 64 at cols 70-74. It crosses the sweater's hem and the skirt.
//   - The headstock is cols 74-89, rows 60-68. Its top edge stands 2 rows above the neck's
//     (o74 (63), o75-76 (62)). Four chrome keys A sit on stems t in the top outline, in pairs
//     stepping with the dip: A77-78 and A80-81 on row 61, A83-84 and A86-87 on row 62. It is
//     cream z, shaded Z (row 66) and Y (its lower edge), and its lower edge swells a little
//     before the rounded end (o82-85 on row 68, o86-87 (67), o88 (66), o89 (64-65)).
// - Secondary motion: the bob's near flip is sway.ts's L drawing with its free end lifted a further
//   row as she hangs in the air. The contour steps up and out to the tip N26 (44), with H27-29 lit
//   along its top. The underside is N27-29 (45) and N30-32 (46), with the deep R30-32 above it.
//   The slit to the inner lock opens a row higher (N34 J35 N36 on row 44, J on rows 45-46).
//   Everything stays outside the face box. The crouch tucks the flip in (sway R), so the jump
//   swings it tuck, flare-and-lift, tuck.
// - The skirt shows from row 60 under the lifted hem and flares out. Its edge is o62 (60-61), o63
//   (62-63), o64 (64), o65 (65), o66 (66).
//   - Its pleats fan out from stand's: G49 straight down; 52->54, 56->59 and 58->64 lean right;
//     46->44 and 41->39 lean left.
//   - It ends in Bocchi's sawtooth hem on row 67: 2-px tips g/G at cols 53, 58 and 63, closed by
//     oo on row 68, with the hem o between them. The hem is straight over the gap between the legs
//     (cols 45-52).
//   - The bass's body hides its near half. The neck crosses it.
// - The legs are Bocchi's cheer legs in black tights (her skin and sock tones become i/I).
//   - The near leg is kicked back. Its thigh comes down from under the skirt (cols 38-45, rows
//     68-74), I in the skirt's shadow on row 68. The knee is at col 45, and the shin goes back to
//     the left (rows 71-79), with the crease I37-39 where it folds against the thigh. The loafer's
//     sole turns up at cols 19-29, rows 70-75.
//   - The far leg is straight, angled down-right to its pointed loafer, with the sole on row 93.
//   - The tights' sheen (l, as on stand) runs down the near thigh's front (l44, rows 69-72), along
//     the near shin's top (l30-35, row 73), and down the far leg's axis (l60 70-71, l61 72-74,
//     l62 75-77, l63 78).
// - It adds no colors: everything is from stand's palette.

import type { PoseDef } from '../../types'

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
  '................................................................................................', // 16
  '...........................................................pppp.................................', // 17
  '..........................................NNNNNNNNNN......pssssp................................', // 18
  '.......................................NNNhhHHHHHHhhNNN..pSSssssp...............................', // 19
  '.....................................NNhhhhHHHHHHHHhhhhN.pSSSSSsp...............................', // 20
  '....................................NhhhhhhhHHHHUUUUUhhhN.pSssssp...............................', // 21
  '...................................NhhhrhhhHHrUUHHHrHUUUhNjJjJjJkK..............................', // 22
  '..................................NhhhrhHHHHrHHHHHrHHUUHhNjJjJjJkK..............................', // 23
  '..................................NhhrhhhHHrHHHHHrhHHHHHhhNJJJJkkK..............................', // 24
  '.................................NhhrhhhhhrHHhhHrhhHHrhHHhNJjjjkkK..............................', // 25
  '.................................NhrhhHhhhrhHHhHrhhHHrhHHhNJjjjkkK..............................', // 26
  '.................................NhrhhHhhhrhHHHHrhHHhrhHHhNJjjjkkK..............................', // 27
  '................................NhhrhHHhhrrhhHHHrhHHhrhhHhNJjjjkkK..............................', // 28
  '................................NhhrhHHhhrhhhhHHrhhHrrhhHHhNJjjjkkK.............................', // 29
  '................................NhhrhHHhhrhhhhhhrrhhrrhhHHhNJkjjkkK.............................', // 30
  '................................NhhrhHHhhrhhhrnnnrhrsnnphHhNJJkjkkK.............................', // 31
  '................................NhhrhHHthrrhhrnnnssssnnnhHhNJjJkkkK.............................', // 32
  '...............................NhhrhhXXHrhrhhhMeESSSSEenSrrNJjjJkkK.............................', // 33
  '...............................NhhrXXHHHrhrhhHWLLSSSSLWnsSrNJjjjkkK.............................', // 34
  '...............................NhhrhhHHtrhrRsReeSSSSSeWpsSrNJjjjkkK.............................', // 35
  '...............................NhhrhhXXhrhhrsssssssssvSpStrNJjjjkkK.............................', // 36
  '.................pppp..........NhhrXXHHhrhhrmSsssssssSpRhhNJjjjjkkK.............................', // 37
  '................pssssp.........NhhrhHHhhrhhRpmSssssSppRRrhNJjjjjkkK.............................', // 38
  '...............pSSSSsp.........NhrhhHHhhrhRRpSmmmmppRRrNNNJjjjjjkkK.............................', // 39
  '...............pSssssp.........NhrhHHhhrhRRRRwSSsspwRNNJJJJjjjjkkK..............................', // 40
  '...............pSsssp..........NhrhHHhhrhRRRNwKyyyKwkkJJJaPjjjkkK...............................', // 41
  '...............KjJjJjkK.......NhhrHHhhrhhRRNJwwKKKwwjkkkPPjjjkkK................................', // 42
  '...............KjJjJjkK.....NHhhrHHhhrhhRRRNJkwKyKwJjkkkPajjjkkK................................', // 43
  '...............KJJJJkkK...NHHHhrHrNJNrhhRRNJJkwKyKwJjjjjPPJjjkkK................................', // 44
  '...............KJjjjkkK....NNNRRRNJJJNhhRNJJjjKwwKJjjjjPPJjjjkK.................................', // 45
  '...............KJjjjkkK.......NNNJJJJNNNjjjjjjkywwKjjjjPPjjjkkK.................................', // 46
  '...............KJjjjkkKKKKKKKKkkkkkkkjjjjjjjjjjkyJjjjjPPjjjjkK..................................', // 47
  '...............KJjjjkJkkkkkkkkjjjjjjjjjjjjjjjjjJjjjjjjPaJjjjkK..................................', // 48
  '...............KJjjjjjJjjjjjjjjjjjjjjJkjjjjjjjjjjjjjjPPjJjjjkK..................................', // 49
  '...............KJjjjjjjjjjjjjjjjjjjjjJJkjjjjjjjjjjjjjPPjJjjjkK..................................', // 50
  '................KJjjjjjjjjjjjjjjjjjjjjJJkjjjjjjjjjjjPPjjjjjjkK..................................', // 51
  '.................KJJJJJJJJJJJJJJJJKKoooJJjjjjjjjjjjjPPjjjjjjkK..................................', // 52
  '..................KKKKKKKKKKKKKKKKzzWWWoooojjjjjjjjPajjjjjjjkK..................................', // 53
  '..............................ozzzzzzzzWWWWoooojjjjPPjjjjjjjkK..................................', // 54
  '.............................oZzzzzzzzzzzzzWWWWoojPPjjjjjjjJkK..................................', // 55
  '.............................oZzzzzzzzzQqqqqqqqWWWAjjjjjjjJjkK..................................', // 56
  '............................oZzzzzzzzzQqqqqqqqqqZojjjjjjjJjJjK..................................', // 57
  '............................oZzzzAAzzQqqqqXXqqqZojjJJJjJjJjJjK..................................', // 58
  '............................oZzzzAAttttttqXXqqZoJjjJjJjJjJKKKK..................................', // 59
  '...........................oZzzzzAAzzQXXqtttttoooooojJKKKKGgggo..............oo.oo..............', // 60
  '...........................oZzzzzzzzzQXXqqqqqquzuuzuooooooGgggo.............oAAoAAooo.oo........', // 61
  '...........................oZzzzzzzzzQqqqqqqqqZZZZZZuzuuzuoooooo...........ootootooAAoAAo.......', // 62
  '............................oYZzzzzzzQqqqqqqqqooooooZZZZZZuzuuzuoooooo....ozzzzzzzztootoo.......', // 63
  '............................oYZzzzzzzQqqqqqqqqqzoGggooooooZZZZZZuzuuzuooooozzzzzzzzzzzzzzo......', // 64
  '.............................oYZzAXAAXAQQQQQQQzogGgggGggggooooooZZZZZZuzuuWzzzzzzzzzzzzzzo......', // 65
  '..............................oYZZZZZZZZZZZZZZoggGggggGgggGggggGooooooZZZZZZZZZZZZZZZZZZo.......', // 66
  '...............................ooYYYYYYYYYYYooooooooogGooogGooogGoo...ooooooooooooYYYYoo........', // 67
  '.................................ooooooooooooIo......ooIIIooIIIoo.................oooo..........', // 68
  '.....................................oIIiiiilio.......oIIiiiiiio................................', // 69
  '....................ooo....oo........oIiiiiilio........oIIiiliio................................', // 70
  '...................oxxxooooxxoooooooooIiiiiilio........oIIiiliio................................', // 71
  '...................oFFFxxxxfdiiiiiiiiIiiiiiilio........oIIiiiliio...............................', // 72
  '....................oFffDDffdilllllliIiiiiiiiio........oIIiiiliio...............................', // 73
  '.....................oodffffdiiiiiiiiiIiiiiiiio.........oIiiiliio...............................', // 74
  '.......................ooddddiiiiiiiiiiIiiiiiio.........oIiiiilio...............................', // 75
  '.........................ooddIIiiiiiiiiiiiiiiio.........oIiiiilio...............................', // 76
  '...........................ooIIIIiiiIIiiiiiiIIo..........oIiiiliio..............................', // 77
  '.............................ooooIIIIIIIIIIIIo...........oIIIiilio..............................', // 78
  '.................................oooooIIIIIIo............oIIIiiiio..............................', // 79
  '......................................oooooo..............oIiiiiio..............................', // 80
  '..........................................................oIiiiiio..............................', // 81
  '..........................................................oIIiiiio..............................', // 82
  '...........................................................oIIiiio..............................', // 83
  '...........................................................oIIIiiio.............................', // 84
  '............................................................oIIIiio.............................', // 85
  '............................................................oIIIiio.............................', // 86
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
