// Kita's panic, synced with Bocchi's (bocchi/panic.ts): the same freak-out on the same beats. Shoulders
// shrugged up (the collar and bow one row higher, the neck down to one row of chin shadow), both arms
// flung out with the hands open and the fingers spread, the knees knocked together with the feet apart
// and the toes turned in, the guitar slid down and turned so its neck dips, three strands of hair
// standing on end. A whole grid: the head is the POLISHED stand's pixel for pixel (rows 18-39: the side
// tail's pointed tip 62-63,18, the bangs closed over the near lid at 46-47,30, the lashes winging up at
// 43,31, the near iris's one pupil pixel 47,33; the 16x10 face box at 42,30 untouched), so every face
// overlay fits it and index.ts's polish carry no longer matches it (its panic entry can go). No colors
// of its own: her stand's palette.
//
// Where things are (col,row; checked against this grid):
// - Strands: Bocchi's three, rows 13-19 over the crown (one tall kinking left, two short bent right),
//   in Kita's crimson; her crown outline is Bocchi's, so they root the same. The side tail is stand's
//   (cols 57-64, rows 18-25), clear of the bang the panic keys at window 27,0.
// - Hair locks: stand's, lying over the raised shoulders and the arms' roots. The near lock (cols
//   26-36, rows 36-49; flip and tip 26,48, bottom edge 27-33,49) hides the near sleeve from the
//   shoulder to col 31; the far lock (cols 51-63, rows 38-45) the far one to col 63, its bottom edge
//   closed in p at 56-61,45.
// - Collar and bow: stand's rows 40-45 moved up a row. Chin shadow S at 46-48,40 between collar w at
//   45 and Z at 50; the bow's top outline 45-46 and 50-51,41; the bow cols 44-52 rows 42-44 (p all
//   round, loops R/B over b, knot 48); the near collar flap w with its stripe in one run, as on the
//   polished stand (o at 40-42,42 over 38-39,43), its shade Z at 40-43,43 / 36-39,44; the hair at
//   37-39,42 falls over it as on stand.
// - Cardigan: cols 34-58, rows 45-54, the raised arms dragging it up into pull folds that run from
//   each armpit up toward the collar, as on Bocchi's jacket. A J band down the near side (36-37), the
//   bow's shadow J (45-51,45).
//   - Near (shade side), deepest at the armpit and fading toward the chest: k 38,48 / k 39-40,47 /
//     J 41-42,46, and under it k 38-40,50 / J 41-43,49.
//   - Far (lit side), short at the armpit corner: J 54,45 / J 55,46 + k 56,46, and J 53-54,47 / k 55,48.
//   - The light from the upper right as a thin l band down the far chest, following the far
//     contour in to the waist (53,45 / 52-53,46 / 52,47 / 51-52,48-49 / 51,50-52), then j, the far side turning
//     away in J and k (cols 55-57).
//   - The placket a J line down col 48 (rows 46-52) with two small buttons L at 48,48 and 48,51
//     (the Nendoroid's yellow buttons; both below the portrait window's bottom row 47).
//   - The hem bunching (J 42-43,52 and 52-53,52) over the ribbed hem j/J on row 53, its outline P on row 54.
// - Arms and hands: Bocchi's panic arms and hands pixel for pixel (the sleeve's top from the shoulder
//   down in even 2-px steps to the elbow flat, up to the cuff; the concave underside), in the cardigan:
//   outline P, j/J/k/K, the light ridge l one pixel inside the top outline where Bocchi's white stripe
//   runs, the ribbed cuffs j/J. Near hand skin cols 4-11 rows 33-41 out of the cuff at col 12; far hand
//   cols 78-84 rows 35-42 out of the cuff at col 77; outlined P with S knuckle marks, like her stand's
//   hands. Both stay on the canvas through the shake (cols 3-85, dx +-2).
// - Skirt: Bocchi's panic skirt (rows 55-69, the g/G pleats fanning out, flaring right to col 62); its
//   left edge (col 38, behind the guitar) shows only in the cutaway above the neck (48-51,64).
// - The Pelham Blue Les Paul Junior double-cut, lowered and turned like Bocchi's guitar (strings on the
//   1:3 axis row 62+floor((x-33)/3)) and drawn as the double-cut so its two horns read:
//   - Lower bout: Bocchi's panic lower bout outline (cap 31-35,55; the left edge col 26 rows 60-64, col
//     27 rows 58-59 and 65-66; the bottom 31-37,70). The top edge then runs at the axis's 3:1 (38-39,57 /
//     40-42,58 / 43-45,59 / 46-48,60 / 49-50,61) to the upper (bass) horn's point at 51,62; its inner edge
//     48-50,63 stands over a one-row cutaway (48-51,64, the skirt) above the neck's top outline (48-50,65).
//   - The lower (treble) horn under the neck's end: cols 41-48, rows 68-73, its blunt tip down col 48
//     (rows 70-71) and 47,72; the cutaway right of it (49-50,70) shows the far thigh.
//   - Light from the upper right: a lit rim a under the top outline and along the horn, shade i down the
//     left edge and along the bottom, and the body's side I under the bottom edge (30,68; 31-37,69;
//     38-40,70; 41-43,71; 44-46,72), outlined o under it.
//   - Hardware: the wraparound bridge T at 34,61-63 (its shadow i at 33,62-63); the black dog-ear P-90
//     cols 36-38 rows 61-65 with its ears at 37,60 and 36,66, three poles t at 37,62-64 and its lit
//     rim g down col 38 (rows 61-63); the black guard G wrapping round its bottom and running just
//     under the strings to the board's end (35,64-66; 36-38 rows 65-66; 39-41 rows 65-67; 42-43,67),
//     its tip lit g at 42,66 (no lit rim along its top: it would double the string line); the strings t
//     from the bridge past it to the board (35,62; 39-41,64; 42-43,65); two black knobs G with a lit g
//     on the lower bout (30-31,65 and 33-34,66).
//   - The rosewood board from its end (o at 43,64 and 43,66, the string over it) along the neck: top
//     outline o, lit face O, the string line t, the shade X, bottom outline o (from 44,63-67 down to the
//     nut T at 60,70-71; W fret glints at 51,68 and 58,70). Headstock: Bocchi's (cols 60-71, rows
//     67-77) in her black g/G with the o outline, the 3+3 tuners in nickel T.
// - Legs: Bocchi's knocked knees, bare. The near thigh (cols 41-49, rows 72-76) over the far thigh
//   (cols 49-56); the near knee in front (cols 43-51, rows 77-79), the far knee behind it (52-55); her
//   stand's leg shading (S on the left, s, SS on the right). Bare shins to row 81.
// - Loose socks, slouched below the knee like her stand's: a cuff one pixel wider each side on rows
//   82-83 (near cols 37-49, far cols 51-60), a crease (V over Z) under it at 41,84-85 and 57,84-85,
//   the sag fold in Z dashes on row 85 (36, 38 / 55, 59), the ankle in shade on row 86, the sock overhanging the shoe's top (row 87).
// - Shoes rows 87-93: Bocchi's panic loafers (near cols 34-40, far cols 54-61, toes turned in).
//
// Built by a scratch script from her previous panic (Bocchi's arms, legs, skirt and headstock recolored
// to Kita's ramps) with the polished stand's head laid on; the guitar body redrawn by hand on the
// rotated axis (scratchpad kita-pb4/body3.txt), the old body cleared to the skirt's pleats behind it;
// the cardigan front redrawn by hand (scratchpad kita-pb5/t2.txt, t3.txt).

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
  '..........................................pphHpphhppphp.......pp................................', // 18
  '........................................pphhHHHHhhhhphp....pppHHp...............................', // 19
  '.......................................phhhhhhhhhhhhhhhp..pHHhhp................................', // 20
  '......................................phhhhhhhhhhhhhhhhhppHhhhvhp...............................', // 21
  '.....................................phhhhhhhhhrhhhhhhhhhpHhhrrp................................', // 22
  '....................................phhhhhhhhhhhrhhhrhhhhvhrrpp.................................', // 23
  '...................................pHhhhhhhhhhhhhhhhhrHhhHvrp...................................', // 24
  '...................................pHhhrhhhhhhhHrHhhHrHHHHvp....................................', // 25
  '..................................pHhhrhhhrHhhhHrHHHHrHHHHp.....................................', // 26
  '..................................pHhrhhrhrHHHHHrHHHHrHHHHp.....................................', // 27
  '..................................pHhrhrhhrHHHHHrHhhHrHhhHp.....................................', // 28
  '..................................phhrhrhhrHhhhHhhhhrrhhhrp.....................................', // 29
  '..................................phhrhrhhrHhhhhhhhhrrhhhrhp....................................', // 30
  '..................................phhrhrhhrnnnnnnrrrsnnprhhp....................................', // 31
  '......P..P........................phhrhrhhrsnnnnnssrsnnnrHHp....................................', // 32
  '.....PsPPsPP......................pHhrhrhhrsnWMEESSrSMEnrrHHp...................................', // 33
  '....P.PsPsPsP.....................pHHrhrhhrsnQeeWSSSSeWnrrHHp...................P..P............', // 34
  '...PsPPsPsPsP.....................pHHrhrhhrssseLSSSSSeLprrHHp.................PPsPPsP...........', // 35
  '....PsSsSssP.....................pHHHrhrhhhrssssssssssSprrHHp................PsPsPsPP...........', // 36
  '.....PsssssP.....................pHHHhhhrhhrmSsssssssSprrrHHp................PsPsPsPsP..........', // 37
  '....PPsssssP....................pHHHrhhrrhhhpmSmbbmSpprrrrHHhp................PssSssP...........', // 38
  '...PSSSsssssPPPP................pHHhhhhrrrhhpSssmmpprrrrrHHhhhp...............PssssPP...........', // 39
  '....PPPSssssPjjlPP........PPlljjpHHrhhrrrrhppwSSSsZpprrrrhhHhhpPP........PPPPPssssssSP..........', // 40
  '.......PSSSSPJJjllPP....PPlljjjpHHhrhhrrrrpwwppSSZpppvrrrhhhHHHplPP....PPlljjPssssSPP...........', // 41
  '........PPPPPjjjjjllPPPPlljjjjjpHhhrhrrrooowpRBpbpBRpvvvrrhhhhHpjllPPPPlljjjjPSSSSP.............', // 42
  '............PJJjjjjjlllljjjjjjPpHhhrPwooZZZZpRRRRRRRpjpvrrrhhrhpjjjlllljjjjJJPPPPP..............', // 43
  '............PjjjjJjjkkJjjjjjJjPpHhhrZZZZjljkpbbpRpbbpjjpvrrrrrpjJjjjkkJjjJjjjP..................', // 44
  '............PJJjkjjJjjjjjjjJjjpHhhrPJJjjjjjjjJJJJJJJjlJjppppppJJjjjjjjjjjjkJJP..................', // 45
  '............PkkJJjjjjjjjjjkjJpHHHhrPJJjjjJJjjjjjJjjjlljJkPPkkkkkJJJJjjjjJJkkkP..................', // 46
  '............PPPkkJJjjjjJJkJppHHHhhrPJJjkkjjjjjjjJjjjlJJjJkPPPPPPkkkkJJJJkkPPPP..................', // 47
  '...............PPkkJJJJkkkprrrrhhrPJJJkjjjjjjjjjLjjlljjkJkP.....PPPPkkkkPP......................', // 48
  '.................PPkkkkPPPPpppppppPkJJjjjJJJjjjjJjjlljjjJkP.........PPPP........................', // 49
  '...................PPPPP...........PkJkkkjjjjjjjJjjljjjJkP......................................', // 50
  '....................................PkJJjjjjjjjjLjjljjjJkP......................................', // 51
  '.....................................PkJjjJJjjjjJjjlJJjJkP......................................', // 52
  '.....................................PjJjJjJjJjJJJjJjJjJjP......................................', // 53
  '.....................................PPPPPPPPPPPPPPPPPPPPP......................................', // 54
  '...............................ooooo.oGGGGGGGGGGGGGGGGGGGo......................................', // 55
  '.............................ooaaaaaooggGgggGgggGgggGggGgo......................................', // 56
  '............................oaaAAAAAaaooGgggGgggGgggGggGggo.....................................', // 57
  '...........................oaAAAAAAAAAaaooogGgggGgggGggGggo.....................................', // 58
  '...........................oiAAAAAAAAAAAaaaoooggGgggGgggGgo.....................................', // 59
  '..........................oiAAAAAAAAAGAAAAAaaaooogggGgggGggo....................................', // 60
  '..........................oiAAAAAATAGGgAAAAAAAaaaoogGgggGggo....................................', // 61
  '..........................oiAAAAAiTtGtgAAAAAAAAAAaaogGggGggo....................................', // 62
  '..........................oiAAAAAiTAGtgAAAAAoAAAoooggGgggGggo...................................', // 63
  '..........................oiAAAAAAAGGtGtttAoOoooGgggGGggGGggo...................................', // 64
  '...........................oiAGgAAAGGGGGGGtttOOOooogGGggGGggo...................................', // 65
  '...........................oiAAAAGgGGGGGGGgoXtttOOOoooggGGgggo..................................', // 66
  '............................oiiAAAAAAAAGGGGGoXXXtttOOOoooGGgggo.o...............................', // 67
  '.............................oIiiiiiiiAAAAAAAoooXXXWttOOOoooggooTo.o............................', // 68
  '..............................oIIIIIIIiiiAAAAAAAoooXXXtttOOOooogtgoTo.o.........................', // 69
  '...............................oooooooIIIiiiAAAAoSSoooXXXtWtTggggggggoTo........................', // 70
  '......................................oooIIIiiiioSSSssoooXXXTttGGGgggggo........................', // 71
  '.........................................oooIIIooSSSsssSSoooGGGGGGGGGggo........................', // 72
  '........................................oSssoooSSoSssssSSo..oooGGGGGGGGo........................', // 73
  '........................................oSsssssSSoSsssSSo......oToGGGGGo........................', // 74
  '.........................................oSsssssSSoSssSSo.......o.oToGGo........................', // 75
  '.........................................oSsssssSSoSssSSo..........o.oTo........................', // 76
  '..........................................oSsssssSSoSsSo..............o.........................', // 77
  '..........................................oSsssssSSSosSo........................................', // 78
  '..........................................oSssssSSsoSssSo.......................................', // 79
  '.........................................oSssssSSsoSsssSSo......................................', // 80
  '........................................oSsssssSSo.oSsssSo......................................', // 81
  '......................................oZzzzzzzzzzo.oZzzzzzzo....................................', // 82
  '.....................................oZzzzzzzzzzo...oZzzzzzzo...................................', // 83
  '....................................oZZzzVzzzzo......oZZzVzzo...................................', // 84
  '...................................oZzZzzZzzo.........oZzZzZzo..................................', // 85
  '..................................oZZZzzZo.............oZZzzZo..................................', // 86
  '...................................oZdddo...............oddZZo..................................', // 87
  '..................................odfffo................offddo..................................', // 88
  '..................................odfDDo................oDDfdo..................................', // 89
  '..................................odfffo...............offffdo..................................', // 90
  '..................................oddFFFo.............oFFFfdxo..................................', // 91
  '..................................oxxxxxo.............oddddxo...................................', // 92
  '..................................ooooooo..............ooooo....................................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
