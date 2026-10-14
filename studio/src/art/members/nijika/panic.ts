// Nijika's panic, drawn on Bocchi's (bocchi/panic.ts) so the two freak out as one: the same arms flung out
// wide from shoulders shrugged up under the hair, the same open hands with the fingers spread, the knees
// knocked together with the feet apart and the toes turned in. Her sticks are still caught in her splayed
// fingers but knocked askew, both leaning to the viewer's right the way Bocchi's guitar slides on its
// strap, so they jolt with her hands through the shake. Her side tail flares out under the far arm, two
// strands stand on end. A whole grid: the head is her final stand's pixel for pixel (rows 0-36, cols
// 30-76: the Dorito, the scrunchie, the tail's root; the 16x10 face box at 42,30 untouched), so every face
// overlay fits it.
//
// Where things are (col,row):
// - Hair on end, Bocchi's thin strands (1-px fill, outline both sides, an outline-only tip): a tall one
//   kinking up-left out of the crown left of the Dorito (root 38-39,19-20, tip 34-36,14); a short one bent
//   right between the Dorito and the scrunchie (root 53,19, tip 55-56,16).
// - Sticks (o T a: the outline on the left, the light on the right, as on her stand; an oo cap at the tip):
//   each butt is wedged 2 rows deep into the V between two fingers (the fingertip-cap row and the row below,
//   no o on that row, so the left finger keeps its tip), the fingers closing round it beneath. The near one
//   (V cols 7-8, rows 32-33 between the col-6 and col-9 fingers) leans in toward her head, 3 rows a column,
//   up to its cap at 11-12,18; the far one (V cols 81-82, rows 34-35 between the col-80 and col-83 fingers)
//   tumbles out, 2 rows a column, up to its cap at 87-88,21, clear of the far fingertip. Both stay on the
//   canvas through the shake (dx +-2) and clear of the sweat drops' arcs.
// - Near arm: Bocchi's, in her white shirt (w lit top, a y band, Y underside, q outline): the top runs from
//   the shoulder under the side lock (32,37) down in 2-px steps to the elbow flat (cols 20-23, row 42) and
//   up to the cuff (cols 13-15, top row 39); the underside from the armpit (33-38,47) to the elbow (19-23,50)
//   and back up to 12-14,47; a crease at 20-21,44; the cuff seam col 15, its opening col 12.
// - Near hand: Bocchi's open hand, skin cols 4-11 rows 33-41 (outline p from col 3), thumb and fingers up.
// - Far arm: top from 60-62,39 to the elbow flat (67-70,42) and up to the cuff (75-76,40), its root against
//   the far side lock's outline (58,41-42; no doubled line); underside from the armpit (58-63,47) to
//   68-71,49; crease 68-69,44, cuff seam col 74. Far hand cols 78-84 rows 35-42.
// - Collar and bow: her stand's (rows 40-49, cols 43-54: the k inner lines, the plain k R R k knot); the
//   side locks lie over the sleeve roots.
// - Vest cols 39-58 rows 43-57: armhole trim c on col 39 (rows 43-47) and col 57; the near side turning away
//   in one V band that narrows from under the near arm to the hip (cols 40-45 on row 48, 40-43 on rows
//   50-51, 40-42 on rows 52-54, 40-41 on row 55); the far side lit (c, cols 56-57) with one pull fold V from
//   the far armpit (56,48) down to 51,53; the V-neck as on stand (trim c to its point at 49,52, the shirt
//   inside, the bow tails over it); a 2-row ribbed hem (rows 56-57, V/v ribs, v/c on the lit side);
//   outline o on cols 39 and 58 below the armpits.
// - Side tail: behind the far arm; below it (rows 49-61) one full mass that hugs the vest on its left (as
//   Bocchi's back hair does: u deep shadow against the vest under the arm, r, h, H on the right) and flares
//   out to the right (outline 68 on row 50 to 71 on rows 56-57), ending in three pointed locks (tips 61,60,
//   65,61 and the flick 71,60), r strand lines following the flare.
// - Skirt: waistband G row 58 (cols 40-58); pleats rows 59-69 fanning out from the waist, the left edge
//   40 -> 35 in 2-row stairs, the right 58 -> 61; folds G from 44 -> 39, 47 -> 45, 51, 55 -> 57, lit b right
//   of the last two; the hem outline row 70 (cols 36-60).
// - Legs, knock-kneed (Bocchi's panic legs, bare), a >< read: both thighs taper in from the hips
//   (outline cols 39-57, row 71) to the knees (cols 42-55, rows 76-78), then the shins splay out. The
//   near thigh slants down-right in 2-row stairs (outer edge 39 -> 42, inner edge 49 -> 50) to its knee
//   (skin cols 43-49) pressed over the far knee, its shin down-left to the ankle (cols 35-42, row 86);
//   the far thigh behind it narrows from 50-56 to 51-54 (outer edge 57 -> 55), its shin splaying
//   down-right to cols 55-61 (row 86). S on each leg's left (the far thigh in the near one's shadow, 2 px),
//   s lit; the near knee's inner edge S where the knees press (rows 75-77); row 71 in the skirt's shadow.
//   White socks rows 82-86 (the y cuff on row 82).
// - Sneakers rows 87-93: the near one is her stand's near sneaker moved 8 right (cols 34-40, toe in); the
//   far one is her stand's far sneaker mirrored (cols 54-61, toe in to col 54).
//
// Built from layers by the artist's scratch scripts (nij-pb/gen-panic.mjs, then nij-pb3/step1-3.mjs: the
// final stand's head and bow, the strands, the tail, the vest; nij-pb4/sticks.mjs: the sticks in the fingers).

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
  '..........................................ppp...................................................', // 13
  '..................................ppp.....phhpp.................................................', // 14
  '...................................php.....phhHp................................................', // 15
  '....................................phHp...prhhHpp.....pp.......................................', // 16
  '.....................................php....prhhHHp..php..pp....................................', // 17
  '...........oo........................phHp.ppprhhhHHpphp..pZzp.pp................................', // 18
  '..........oTa........................phhpphhhhhhHHHHphpppZZZpphHp...............................', // 19
  '..........oTa........................phhhhhhhhhhhHHHHhhhprZZphhHHp..............................', // 20
  '..........oTa.......................phhhrhhhhhhhhhHHHHhhpZrZprrhHHp....................oo.......', // 21
  '.........oTa.......................phhhhrhhrhhHHrhHHHHhhhprpuurhHHp...................oTa.......', // 22
  '.........oTa.......................phhhrhhhrhHHHrhHrhhHHrhpuurhhHHp...................oTa.......', // 23
  '.........oTa......................phhhhrhhrhHHHrhHHrhHHHrhpuurrhHHp..................oTa........', // 24
  '........oTa.......................phrhhrhhrhHHhrHHrrhHHhrhpurrhrhHHp.................oTa........', // 25
  '........oTa.......................phrhrhhhrHHHhrHHrSrHHhrhpurhhrhHHp................oTa.........', // 26
  '........oTa.......................phrhrhhhrHHHrHHrSsSrHhrhprrhhhrHHp................oTa.........', // 27
  '.......oTa........................phrhrhhhhhHHrHrSsssSHhrhprhhhhrHHp...............oTa..........', // 28
  '.......oTa........................phhhrhhhhhHHrSSssssSrhhhprhhhhhHHp...............oTa..........', // 29
  '.......oTa........................phhhrhhhnhhSSSSssssSrrnhhphhhhhHHHp.............oTa...........', // 30
  '......oTa.........................pHhhrhhhnnnnnnsssssnnnrHhphhrhhHHHp.............oTa...........', // 31
  '......oTap........................pHHhrhhhrnWEMEnssssWMnrHHphhrhhhHHp............oTa............', // 32
  '.....psTaspp......................pHHhrhhhrseeMessssseEnrHHphhrhhhHHp............oTa............', // 33
  '....p.pspspsp.....................pHHhrhhhrseeeessssseeprHHphhhrhhHHp...........oTap............', // 34
  '...psppspspsp.....................pHHhrhhhrssQQssssssQsprHHphhhrhHHHp.........ppsTasp...........', // 35
  '....psSsSssp......................pHHhrhhhhrssssssssssSprHHprhhrhHHHp........pspspspp...........', // 36
  '.....psssssp....................qpHHhhrhhhhrmsiWWWissSprrHHprhhhrHHHp........pspspspsp..........', // 37
  '....ppsssssp..................qqpHHhhrrhhhhhpmsiiisSpprrrHHprrhhrhHHp.........pssSssp...........', // 38
  '...pSSSssssspqqq............qqwwpHhhhrhhrhhhpssssspprrrrHHhpqqqhhrHHp.........psssspp...........', // 39
  '....pppSsssspwwwqq........qqwwwphHrhhhhrprhhqqSSSsqqqprrrHhqwwwqqrHHp....qqqqpssssssSp..........', // 40
  '.......pSSSSpwwywwqq....qqwwwwwphprhhrhhprrKKywwwwwwwKKrrHpwwwwwwqqHp..qqwwwwpssssSpp...........', // 41
  '........pppppwwywwwwqqqqwwwwwwwwpwprhpprpppKRKwwwwwwKRKprppwwwwwwwwqqqqwwwywwpSSSSp.............', // 42
  '............qwwywwwwwwwwwwwwwwwwwwwpwwwpVVVKRRKKKKKKRRKvpcwwwwwwwwwwwwwwwwywwppppp..............', // 43
  '............qyyywwwwyywwwwwwwwwwwyyyyyycVVVKRPRkRRkRPRKvvcwyyyyywwwwyywwwwyyyq..................', // 44
  '............qyyyywwwwwwwwwwwyyyyyyyyyyycVVVKkRRkRRkRRkKvvcyyyyyyyyyywwwwyyyyyq..................', // 45
  '............qYYyyyywwwwyyyyyyyyyyYYYYYYcVVVKkkkkRRkkkkKvvcYYYYYYyyyyyyyyyyYYYq..................', // 46
  '............qqqYYyyyyyyyyyyyYYYYYqqqqqqcVVVKKKVkRRkVKKKvvcqqqqqqYYYYyyyyYYqqqq..................', // 47
  '...............qqYYyyyyYYYYYqqqqq......oVVVVVVKRKKRKvvvvVcouuurqqqqqYYYYqq......................', // 48
  '.................qqYYYYqqqqq...........oVVVVVKRKywKRKvvVccouuurrhhHHqqqq........................', // 49
  '...................qqqqq...............oVVVVvvvcywcvvvVvccouurrhhrhHp...........................', // 50
  '.......................................oVVVVvvvvcycvvVvvccouurhhrhhHHp..........................', // 51
  '.......................................oVVVvvvvvvcvvVvvvccourrhhrhhHHp..........................', // 52
  '.......................................oVVVvvvvvvvvVvvvvccourrhhrhhrHHp.........................', // 53
  '.......................................oVVVvvvvvvvvvvvvvccourhhrhhrhHHp.........................', // 54
  '.......................................oVVvvvvvvvvvvvvvvvcorrhhrhhrhHHp.........................', // 55
  '.......................................oVvVvVvVvVvVvvcvcvcorrhhrphhrhHHp........................', // 56
  '.......................................oVvVvVvVvVvVvvcvcvcorhhrp.phrphHp........................', // 57
  '........................................oGGGGGGGGGGGGGGGGGorhrp..phrpHHp........................', // 58
  '........................................oGggGggGgggGbggGbgo.php..phHp.pHp.......................', // 59
  '.......................................oGgggGggGgggGbggGbgo..p...pHp...p........................', // 60
  '.......................................oGggGgggGgggGbggGbggo.....p..............................', // 61
  '......................................oGgggGggGggggGbgggGbgo....................................', // 62
  '......................................oGggGgggGggggGbgggGbgo....................................', // 63
  '.....................................oGgggGgggGggggGbgggGbggo...................................', // 64
  '.....................................oGggGggggGggggGbgggGbggo...................................', // 65
  '....................................oGgggGgggGgggggGbggggGbgo...................................', // 66
  '....................................oGggGggggGgggggGbggggGbggo..................................', // 67
  '...................................oGgggGggggGgggggGbggggGbggo..................................', // 68
  '...................................oGgGGggggGGggggGGbgggGGbggo..................................', // 69
  '....................................ooooooooooooooooooooooooo...................................', // 70
  '.......................................oSSSSSSSSSoSSSSSSSo......................................', // 71
  '........................................oSsssssssoSSssssso......................................', // 72
  '........................................oSsssssssoSSsssso.......................................', // 73
  '.........................................oSsssssssoSSssso.......................................', // 74
  '.........................................oSssssssSoSSsso........................................', // 75
  '..........................................oSSssssSoSSsso........................................', // 76
  '..........................................oSSssssSoSSsso........................................', // 77
  '..........................................oSssssssoSSssso.......................................', // 78
  '.........................................oSsssssso.oSsssso......................................', // 79
  '........................................oSsssssso..oSssssso.....................................', // 80
  '.......................................oSsssssso...oSssssso.....................................', // 81
  '.......................................oyyyyyyo....oyyyyyyo.....................................', // 82
  '......................................oywwwwwo......oywwwwwo....................................', // 83
  '.....................................oywwwwwo........oywwwwo....................................', // 84
  '....................................oyywwwwo..........oyywwwo...................................', // 85
  '...................................oyywwwoo............oyywwwo..................................', // 86
  '...................................oydddo...............oddwyo..................................', // 87
  '..................................odfffo................offddo..................................', // 88
  '..................................odfwwo................owwfdo..................................', // 89
  '..................................odfffo...............offffdo..................................', // 90
  '..................................oddfwwo.............owwFfdxo..................................', // 91
  '..................................oywwwwo.............owwwwyo...................................', // 92
  '..................................ooooooo..............ooooo....................................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
