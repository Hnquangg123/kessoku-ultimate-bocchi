// Bocchi's cheer: the top of a happy jump, a whole 96x96 grid. The head is stand's, pixel for pixel, at
// offset 0. The top row is 16 (the far fist), so the jump keeps its -11 hang.
// Near arm: a guts-pose fist pump. The upper arm leaves the shoulder level under the side lock's tapered
// tip (top outline on row 42), turns at an elbow corner at cols 17-19, rows 43-48, and the forearm leans
// out to the fist. The crook between the forearm, the upper arm and the head stays background, so the
// hang's left sparkle and twinkle (cols 23-31, rows 33-41) burst out in clear air. The fist shows the back
// of the hand (cols 11-17, rows 26-31): a flat 4-px top with cut corners, an S knuckle row, and the thumb
// notch on the side toward the head. Its bottom row sits in the opening of a ribbed cuff that tilts with
// the forearm. The white stripe runs from the cuff down the forearm's outer side, round the elbow and
// along the underside: white (w) like stand's as it turns the elbow and runs on (row 46, cols 19-27),
// going into shadow (y) only toward the armpit (cols 28-32), so it never reads as a pale blue line. A k
// crease marks the inner elbow.
// Far arm: wholly inside the portrait window (cols 34-65, rows 16-47). The fist is seen from the finger
// side with the thumb across it in S (cols 57-64, rows 16-21). There is 1 px of background between the
// sleeve and the hair down to row 32, a 1-px elbow bump at col 65 with a k fold, and then the upper arm
// tucks behind the hair and the headstock on its way to the shoulder.
// Back hair: rooted behind the back. It comes out below the armpit with background under the sleeve and
// falls at about 60 degrees: a thin outer strand, lock A in h, a long r strand, lock B as a broad H sheen,
// and r in the body's shadow. The tips end at different lengths (rows 67-69). The far back hair beyond
// the far flank is 4 px wide with H on its lit side and tapers to a tip behind the skirt.
// The Les Paul hangs on its strap, which runs 1:1 from the guitar's top edge to behind the far side lock.
// The bass side and the bottom are one round curve (col 31 at the side, lowest at cols 40-44 on row 68),
// the horn tip is pulled in to col 56, and the treble side shows a waist. The far jacket hem rides up
// (rib band rows 52-53, hem row 54). The near leg is kicked back, with the calf bulging behind the knee
// and a kneecap bump at col 47. The far leg is straight, and the pleated hem has a tip in every run.

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
  '...........................................................pppp.................................', // 16
  '..........................................................pssssp................................', // 17
  '..........................................pppppppppp.....pSSssssp...............................', // 18
  '........................................pphhHHHHhhhhppp..pSSSSSsp...............................', // 19
  '.......................................phhhhhhhhhhhhhhhp.pSssssp................................', // 20
  '......................................nnhhhhhhhhhhhhhhhhp.pSssspp...............................', // 21
  '.....................................nCbnhhhhhhrhhhhhhhhhp.pJjJjJp..............................', // 22
  '................................ppppnCBBbnhhhhhhrhhhrhhhhp.pJjkkkp..............................', // 23
  '.............................ppphhhhnbccbnhhhhhhhhhhhrHhhHp.pkjwp...............................', // 24
  '............................phhppppphnbbnhhhhhhHrHhhHrHHHHp.pJjwp...............................', // 25
  '.............pppp..........phpp....povzYvhrHhhhHrHHHHrHHHHp.pJjwp...............................', // 26
  '............pssssp.........pp......pvzqqZvrHHHHHrHHHHrHHHHp.pJjwp...............................', // 27
  '...........pSSSSsp.........p.......pvZuuYvrHHHHHrHhhHrHhhHp.pJjjwp..............................', // 28
  '...........pSssssp................phhvYYvhrHhhhHhhhhrrhhhrp.pkJjjp..............................', // 29
  '...........pSsssp.................phhrvvhhrHhhhHhhhhrrhhhrhp.pkkjp..............................', // 30
  '...........pSSsssp................phhrhrhhrhhnnnnrrrsnnprhhp.pJkp...............................', // 31
  '...........pJjJjJjp...............phhrhrhhrnnnnnnssssnnnrHHp.pJjp......ooo......................', // 32
  '...........pJjJkkkp...............pHhrhrhhrnnQMLMSSSSnLnrrHHpJjJp......oago.....................', // 33
  '...........pkkkjjjjp..............pHHrhrhhrsnWEEESSSSEWnrrHHpJjJp....oogAggo....................', // 34
  '............pJwjjjjp..............pHHrhrhhrssseeSSSSSeWprrHHpJjp....oagggGGo....................', // 35
  '.............pJwjjjjp.............pHHrhrhhhrssssssssssSprrHHpJjp..oooAgggGGo....................', // 36
  '.............pJwjjjjjp...........pHHHhhhrhhrmSsssssssSprrrHHpJp..oaggggGGGo.....................', // 37
  '..............pJwjjjjp...........pHHrhhrrhhhpmSssssSpprrrrHHpJp..oAgggGGGa......................', // 38
  '...............pJwjjjjp..........pHHhhhrrrhhpJmmmmpprrrrrHHhpJjJoggggGGooAo.....................', // 39
  '...............pJwjjjjjp.........pHrhhrrpphhpjSSsspjprrrrhhpJjJogggGGGa..o......................', // 40
  '................pJwjjjjjp........pHrrrpjkjphhpjjyjjjprrrrhhpJjotggGGGoAo........................', // 41
  '................pJwjjjjjkpppppppppprrpjjkjjphpjjwjjjprrrhhpjjogygGGao.o.........................', // 42
  '.................pJwjjjkjjjjjjjjjjjppjjjjjjjphpjwjjjjpphhrpooggtGGoAo...........................', // 43
  '.................pJwjjkjjjjjjjjjjjjjjjjjjjjjjphpwJjjjoGprrpgWgtoGo.o............................', // 44
  '.................pJwjkJJJJJJJJJJJJJJJJjjjjjjjjppwJjjoGooprpggGooo...............................', // 45
  '.................pJwwwwwwwwwyyyyyJJJJJJJjjjjjkkkwJjoGooooppGGokKppp.............................', // 46
  '..................pkkkkkkkkkkkkkkkkkkkJJJjjjjjoooooGooogWgtookKprhHp............................', // 47
  '...................pppppppppppppppppKkkJJjjjooAAAAAooogggGojkKjprhHp............................', // 48
  '...................................pKkJJJjjoAAgggggooggGGojkjjprhhHp............................', // 49
  '.................................pppkKJJjjoAggggggogWgtoojjjkjprhhHp............................', // 50
  '..............................ppphrpkJJJjoAgggggggogggGojjjjjjprhHHp............................', // 51
  '............................ppHHhrrpkJJooAggggggooggGGoJjJjJjJprhHHp............................', // 52
  '..........................ppHHHhhrrooooAAgggAgogWgtoojjookkkkkprhhHp............................', // 53
  '.........................phHHHhhrrooAAAggggggAAgggggooAaopppppprhHp.............................', // 54
  '........................phhHrHHrroAAggggggggggaaggggAaGoGGGGGGorhHp.............................', // 55
  '........................phhhrHHroAgggggggggggggaggggaGoggggGggorhp..............................', // 56
  '.......................phhhrHHrroAgggAAggggggggggggaGogggggGggorhp..............................', // 57
  '.......................phHhrHHroAgggggAAggggggggggaGogggGggGggorp...............................', // 58
  '....................ppphHhrHHhroAggggggaaggggggggaGooGggGgggGgorp...............................', // 59
  '...................phhphHhrHHhroAgggggggaaggggggaGoggGgggGgggGop................................', // 60
  '..................phhphHhrHHHhroAggggggggaggggggaGoggGgggGgggGgo................................', // 61
  '.................phhpphHhrHHhrrroAgggggggggggggggaGoggGgggGgggGgo...............................', // 62
  '................phhpphHhrHHhrhrroAggggggggggggggaGogggGgggGggggGgo..............................', // 63
  '...............phhp.phHhpHHhrhHhroAgggggggggggggaGogggGggggGggggGgo.............................', // 64
  '..............phhp.phHhppHhhphHhrroAAggggggggggaGoGggggGgggGggggGggo............................', // 65
  '..............php..php..pHhp.phHhrrooAaagggggaaGooGggggGggggGggggGggo...........................', // 66
  '..............pp...pp..phhp...phrrrp.oooaaaaGooogGooogGooogGooogGooo............................', // 67
  '.......................php.....pprrp.oSSoooooSo.oo...ooSSSooSSSoo...............................', // 68
  '.......................pp........ooo.oSSSSSSSSo.......oSSsssssSo................................', // 69
  '....................ooo....oo..oogggooSSsssssSo........oSSssssSo................................', // 70
  '...................oxxxooooxxooggggggGSssssssSo........oSSssssSo................................', // 71
  '...................oFFFxxxxfdggggggggGSssssssSo........oSSssssggo...............................', // 72
  '....................oFffDDffdggggggggGgggssssSo........oSSssggggo...............................', // 73
  '.....................oodffffdgggggggggGggggggso.........oSggggggo...............................', // 74
  '.......................ooddddggggggggggGgggggggo........oGggggggo...............................', // 75
  '.........................ooddGGggggggggggggggggo........oGggggggo...............................', // 76
  '...........................ooGGGGgggGGggggggGGo..........oGggggggo..............................', // 77
  '.............................ooooGGGGGGGGGGGGo...........oGGGggggo..............................', // 78
  '.................................oooooGGGGGGo............oGGGggggo..............................', // 79
  '......................................oooooo..............oGgggggo..............................', // 80
  '..........................................................oGgggggo..............................', // 81
  '..........................................................oGGggggo..............................', // 82
  '...........................................................oGGgggo..............................', // 83
  '...........................................................oGGGgggo.............................', // 84
  '............................................................oGGGggo.............................', // 85
  '............................................................oGGGggo.............................', // 86
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
