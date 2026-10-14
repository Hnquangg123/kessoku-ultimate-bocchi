// Bocchi's panic: the classic freak-out. Shoulders shrugged up to her ears (the collar under the chin,
// the neck gone), both arms flung out with the hands open and the fingers spread, the knees knocked
// together with the feet apart and the toes turned in, the guitar slid down and turned so its neck
// dips, a few strands of hair standing on end. A whole grid: the head is stand's pixel for pixel
// (rows 18-39; the 16x10 face box at 42,30 untouched), so every face overlay fits it.
//
// Where things are (col,row; checked against this grid):
// - Strands: rows 13-19 over the crown (one tall, kinking left; two short, bent right).
// - Near arm: the sleeve's top runs from the shoulder at 32-33,37 (against the head) down in even
//   2-px steps to the elbow flat (cols 20-23, row 42), then up in 2-px steps to the cuff (cols 13-14,
//   top row 39); the white stripe one pixel inside the top outline all the way; the underside is one
//   concave line from the armpit (33-35,47) to the elbow (19-22,50) and back up to the cuff (13-14,47).
//   Ribbed cuff (rows alternating j/J) with its opening at col 12 (rows 39-47).
// - Near hand: rising out of the top of the cuff, skin cols 4-11, rows 33-41 (outline from col 3, rows 32-42):
//   thumb up toward the head, index up, middle up-left, ring and pinky out; S knuckle marks.
// - Far arm, a size thinner and shorter: top from 60-62,39 to the elbow flat (cols 67-70, row 42) and
//   up to the cuff (cols 75-76, top row 40); underside from the armpit (59-63,47) to 68-71,49 and up
//   to 74-76,47; opening col 77 (rows 40-47). Far hand smaller and lower: skin cols 78-84, rows 35-42.
//   Both hands keep 1+ px of canvas through the shake (cols 3-85, dx +-2).
// - Hair over the shoulders: the near side lock lies on the raised shoulder and ends in one tip at
//   31-32,46; stand's thin lock on the chest (41-48, rows 40-45) and stand's far lock (52-59, rows 40-46).
// - Torso cols 36-58, rows 40-54: collar row 40 under the chin, the chin's shadow J (rows 41-43), the
//   near side turning away (k edge, J band cols 37-40), the far edge k, short pull folds from the
//   armpits (39-42,46-48 and 53-55,48-49), zipper col 48, ribbed hem row 53, outline row 54. The long
//   back hair continues behind the body (hair filled to the jacket and skirt edges, no gaps).
// - Far back hair: one mass under the far arm (cols 56-67, rows 48-65), H on the right, two tips.
// - Skirt rows 55-69, flaring right from col 57 to col 62, pleat folds G fanning out; its hem
//   (row 68) lies behind the guitar and the neck, so no hem line is seen.
// - The Les Paul, lowered and turned (strings on the 1:3 axis row 62+floor((x-33)/3)): body cols 26-48,
//   rows 55-72 (lower bout an r7 circle at 33,62, upper bout r6 at 42,65; the waist step on the top
//   edge and a notch at 37,69 on the bottom); binding A (top, left) and a (bottom, right) with the
//   body's side G under the bottom binding; gold tailpiece (col 33), bridge (col 36) and humbuckers
//   (cols 39-40, 44-45), each centred on the dotted strings; gloss t/W on the upper right of each bout.
//   It hangs over the near thigh (bottom row 72), clear of the hidden hem. Neck cols 48-62 (rows
//   65-73): g top edge, t string line, W fret glints at 51,68 and 58,70. Headstock cols 63-71, rows
//   67-77, lit g on top, 3+3 gold tuners.
// - Legs: the near thigh (rows 69-76, 10 px) pressed over the far thigh (rows 68-76, 9 px) right
//   below the neck; the near knee in front (rows 77-79, cols 42-52); the shins splay to the ankles at
//   row 86 (near cols 35-42, far 56-61). Over-knee sock tops at rows 76-77 (near) and 75-77 (far).
// - Shoes rows 87-93: the near one is stand's near shoe moved 8 right (cols 34-40, toe in to col 40);
//   the far one is stand's far shoe mirrored (cols 54-61, toe in to col 54).
//
// Built from layers by the artist's scratch script (panic5/build.mjs --emit); the older panic3 and
// panic4 compose scripts are retired.

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
  '.......................................pp.......................................................', // 13
  '........................................ppp.....................................................', // 14
  '.........................................phHp......pp...........................................', // 15
  '..........................................php....phHp.pp........................................', // 16
  '...........................................phHp.php..php........................................', // 17
  '..........................................pphHpphhppphp.........................................', // 18
  '........................................pphhHHHHhhhhphp.........................................', // 19
  '.......................................phhhhhhhhhhhhhhhp........................................', // 20
  '......................................nnhhhhhhhhhhhhhhhhp.......................................', // 21
  '.....................................nCbnhhhhhhrhhhhhhhhhp......................................', // 22
  '................................ppppnCBBbnhhhhhhrhhhrhhhhp......................................', // 23
  '.............................ppphhhhnbccbnhhhhhhhhhhhrHhhHp.....................................', // 24
  '............................phhppppphnbbnhhhhhhHrHhhHrHHHHp.....................................', // 25
  '...........................phpp....povzYvhrHhhhHrHHHHrHHHHp.....................................', // 26
  '...........................pp......pvzqqZvrHHHHHrHHHHrHHHHp.....................................', // 27
  '...........................p.......pvZuuYvrHHHHHrHhhHrHhhHp.....................................', // 28
  '..................................phhvYYvhrHhhhHhhhhrrhhhrp.....................................', // 29
  '..................................phhrvvhhrHhhhHhhhhrrhhhrhp....................................', // 30
  '..................................phhrhrhhrhhnnnnrrrsnnprhhp....................................', // 31
  '......p..p........................phhrhrhhrnnnnnnssssnnnrHHp....................................', // 32
  '.....psppspp......................pHhrhrhhrnnQMLMSSSSnLnrrHHp...................................', // 33
  '....p.pspspsp.....................pHHrhrhhrsnWEEESSSSEWnrrHHp...................p..p............', // 34
  '...psppspspsp.....................pHHrhrhhrssseeSSSSSeWprrHHp.................ppsppsp...........', // 35
  '....psSsSssp......................pHHrhrhhhrssssssssssSprrHHp................pspspspp...........', // 36
  '.....psssssp....................ppHHHhhhrhhrmSsssssssSprrrHHp................pspspspsp..........', // 37
  '....ppsssssp..................ppwpHHrhhrrhhhpmSssssSpprrrrHHp.................pssSssp...........', // 38
  '...pSSSssssspppp............ppwwjpHHhhhrrrhhpJmmmmpprrrrrHHhppp...............psssspp...........', // 39
  '....pppSsssspjjwpp........ppwwjjphHrhhrrpphhpJJJyJJkprrrrhhpwwwpp........pppppssssssSp..........', // 40
  '.......pSSSSpJJjwwpp....ppwwjjjphhHhrhrpjjphhpJJyJJJprrrrhhpjjjwwpp....ppwwjjpssssSpp...........', // 41
  '........pppppjjjjjwwppppwwjjjjjphHhrhrpjjjjphpJJwJJjprrrhhpjjjjjjwwppppwwjjjjpSSSSp.............', // 42
  '............pJJjjjjjwwwwjjjjjjphHhrrrpjjjjjjphpJwjjjjpphhrpjjjjjjjjwwwwjjjjJJppppp..............', // 43
  '............pjjjjJjjkkJjjjjjJjphHrrrpJJjjjjjjphpwjjjjjjprrpjjjjjJjjjkkJjjJjjjp..................', // 44
  '............pJJjkjjJjjjjjjjJjjpHrrpJjJJjjjjjjjpppjjjjjjjprpJJJJJjjjjjjjjjjkJJp..................', // 45
  '............pkkJJjjjjjjjjjkjJJJppkkkkJJJjjJjjjjjwjjjjjjjjppkkkkkJJJJjjjjJJkkkp..................', // 46
  '............pppkkJJjjjjJJkJJkkkkkppppkJJkkjjjjjjwjjjjjjjJkppppppkkkkJJJJkkpppp..................', // 47
  '...............ppkkJJJJkkkkkppppphrrpkJkjjjjjjjjwjjjjJkjJkphhhhpppppkkkkpp......................', // 48
  '.................ppkkkkpppppHrhhhhrrpkJJjjjjjjjjwjjjjjjkJkphhHhp....pppp........................', // 49
  '...................pppppHHHHHhhhhhrrrpkJJjjjjjjjwjjjjjjJkprrhHHp................................', // 50
  '......................pHHHHrhhhhhhrrrpkJJJJjjjjjwjjjjJjJkprhhhHHp...............................', // 51
  '.....................pHHHHHHhhhhrhrrrpkJjjjJjjjjwjjjJjjJkprhhhHHp...............................', // 52
  '.....................pHhHrHHhhHhrhrrrpjJjJjJjJjJyJjJjJjJjprrhhhHHp..............................', // 53
  '....................phhHrHHHHHHrrhrrrppppppppppppppppppppprhrhhhHp..............................', // 54
  '....................phhhrHHHHHroooooroGGGGGGGGGGGGGGGGGGGorhrhhhHHp.............................', // 55
  '...................phhhrHHHHHooAAAAAooggGgggGgggGgggGggGgorhrrhhhHp.............................', // 56
  '...................phhhrHHHHoAAggggtAAogGgggGgggGgggGggGggorhrhhhHHp............................', // 57
  '...................phhppHhHoAgggggggWgAoGgggGgggGgggGggGggorhrrhhHHp............................', // 58
  '..................phhp.phhHoAggggggggtgAooooogggGgggGgggGgorhrrhhhHp............................', // 59
  '..................phhp.phhoAggggggggggggAAAAAoggGgggGgggGggorhrrhhHp............................', // 60
  '..................php..phhoAgggggaggggggggggtAoGggggGgggGggorhhrhhHp............................', // 61
  '..................php..phhoAgggggAttaggAaggggWAogggggGggGggorrhprhHp............................', // 62
  '..................pp...phhoAgggggAggAttAagggAatAoggggGgggGggorhppHHp............................', // 63
  '..................p....phhoAggggggggAggAAttgAagaogggGGggGGggorp..pHp............................', // 64
  '........................phroAggggggggggAAgtgAAggaoogGGggGGggop....pp............................', // 65
  '........................phroAgggggggggggggggAAttgggoooggGGgggo..................................', // 66
  '.........................prroaagggggaagggggggggatttgggoooGGgggo.o...............................', // 67
  '..........................pppoGaaaaaGoagggggggaoGGGWttgggoooggooao.o............................', // 68
  '..............................oGGGGGo.oagggggaoooooGGGtttgggooogtgoao.o.........................', // 69
  '...............................ooooo...oaaaaaoSoSSSoooGGGtWtgggggggggoao........................', // 70
  '.......................................oGGGGGoSSoSSSssoooGGGtttGGGgggggo........................', // 71
  '.......................................oooooosSSoSSSsssSSoooGGGGGGGGGggo........................', // 72
  '........................................oSsssssSSoSSsssSSo..oooGGGGGGGGo........................', // 73
  '........................................oSsssssSSoSSssSSo......oAoGGGGGo........................', // 74
  '.........................................oSssssSSSogSSsSo.......o.oAoGGo........................', // 75
  '.........................................oSssssgGGoggSSSo..........o.oAo........................', // 76
  '..........................................oGgggggGGoGggo..............o.........................', // 77
  '..........................................oGgggggGGGogGo........................................', // 78
  '..........................................oGgggGGGgoGGggo.......................................', // 79
  '.........................................oGggggGGgoGGGgggo......................................', // 80
  '........................................oGGgggggGo.oGGgggo......................................', // 81
  '.......................................oGGggggGo....oGGgggo.....................................', // 82
  '......................................oGGGgggGo......oGGGggo....................................', // 83
  '.....................................oGGGGggGo........oGGGgo....................................', // 84
  '....................................oGGGGggo...........oGGGGo...................................', // 85
  '...................................oGGGGGoo.............oGGGGo..................................', // 86
  '...................................oGdddo...............oddGGo..................................', // 87
  '..................................odfffo................offddo..................................', // 88
  '..................................odfDDo................oDDfdo..................................', // 89
  '..................................odfffo...............offffdo..................................', // 90
  '..................................oddFFFo.............oFFFfdxo..................................', // 91
  '..................................oxxxxxo.............oddddxo...................................', // 92
  '..................................ooooooo..............ooooo....................................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
