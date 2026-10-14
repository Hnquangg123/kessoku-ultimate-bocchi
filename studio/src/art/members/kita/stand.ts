// Kita's stand (v2): idle and ready, the Pelham Blue Les Paul Junior double-cut
// across the body like Bocchi's (ART-BRIEF.md "The poses"). The head drawn here
// is the head of every pose but the box.
//
// Candidate B (stand-b.ts) with the art director's grafts and fixes, then the
// senior review's polish: the board ends at a nut and the headstock is drawn
// as REF draws Bocchi's black one; the guard, P-90 and knobs in REF's
// black-guitar tones (G with a g rim) with the guard a teardrop clear of the
// heel; a steeper side tail in one H band and one r band; the smile on REF's
// mouth row as the jaw; the bright iris in the middle row; slouched loose socks
// with closed cuffs; a near lock that falls straight and flips out once.
// Then the second review's polish: the near lashes wing up and out (43,31) in
// place of Bocchi's anxious droop, one pupil pixel and a lighter olive E in
// the iris's top row (so it reads 3 rows tall), no skin window in the bangs,
// the side tail sharpened to a point with its split outlined, the collar's
// stripe one run, the far lock resting on the neck with one outline, the
// cutaway's shade one run and the lower horn off the neck, the silhouette
// closed behind the elbow, the inner calves straight into the sock cuffs.
// (index.ts carries these into the parts drawn from the old stand.)
//
// Built on REF_STAND: its legs, stance, knees, skirt, shoes, arm and hand drawing
// and face geometry, recolored to her ramps. Light from the upper right; 1-px
// outlines (o for the lower body, guitar and shoes; p for hair and the bow; P for
// the cardigan).
//
// Where things are (cols, rows):
// - Head and hair: crown outline row 18 (cols 42-51); near lock outline falls
//   from 33,36 to col 31 (rows 41-44), flips out over rows 45-48 to its tip
//   26,48 (H band 30-32,46 and 29-31,47, r band 27-30,48 under it), bottom edge
//   27-33,49; far lock cols 55-63 to row 45.
// - Side tail (the portrait's accessory): cols 57-64, rows 18-25, col 65 left
//   free for sway.R. Main tip a point at 62-63,18 (top outline 59-61,19 rising
//   to it, right edge 64,19); second tip 63,21 (outline 64,21) under a notch at
//   64,20, the split outlined p at 63,20 with the v crease 62,21 inside. H band
//   62-63,19 / 59-60,20 / 58,21-22; r band 61-62,22 / 59-60,23 / 59,24; the v
//   tie at 57,23 and 58,24-25.
// - Eyes: lid rows 31-32, the bangs' lower edge on row 30 (all hair); near
//   eye cols 43-48: the lid 43-48 on row 31 over 44-48 on row 32, so the lashes
//   wing up and out at 43,31, the outer rim 44,33-34 (skin 43,32-35); iris
//   45-48 rows 33-35 (top W M E E: the glint, one pupil, the olive; bright
//   middle Q e e W, pale bottom e L; glints 45,33 and 48,34); far eye cols
//   53-55, iris 53-54 (M E / e W / e L; glint 54,34); a hair strand between them
//   at 51,32-33.
// - Mouth: an open smile on REF's mouth row, m 47,38 b 48-49,38 m 50,38 over
//   m 48-49,39 (the jaw); chin line 44,37 45,38; chin bottom 46-47,39; the neck
//   shaded under it (S 46-48,40, lit edge 49,40-41), rows 40-42.
// - Sailor collar: the near flap cols 36-44 rows 42-45 (one stripe, 40-42,43
//   over 38-39,44; the near lock covers the shoulder line above 36,43), the V
//   45-51 rows 40-42. The far lock rests on the guitar neck's top outline
//   with its shadow r (58-59,45 and 60-61,44), no line of its own there. Bow cols 44-52 rows 43-45, knot 48,
//   outlined p all round.
// - Near arm: sleeve cols 34-44 rows 45-56 (ridge l 41,45 to 36,51; crease K
//   41-42,49; ribbed cuff j/J cols 37-41 rows 53-55); picking hand cols 41-46
//   rows 53-58, on the strings.
// - Far arm: fretting hand cols 61-65 rows 45-51 round the neck; forearm cols
//   56-63 rows 50-57, its elbow at the skirt's waist.
// - Guitar: body cols 32-58 rows 46-67 (upper horn top edge 43-44,50 /
//   45-46,49 / 47-48,48 / 49-52,47 / 53-54,46, its cutaway's shade i 53-54,48 /
//   51-52,49 / 51,50; lower horn tip a 58,52 under its own outline 58,51, the
//   far forearm J in the V at 59,51; the left edge o up to 34,52 behind the
//   elbow). Black
//   parts in G: the guard a teardrop cols 46-54 rows 54-59 (g rim 54,54 to
//   51,58; 53,54 kept blue, clear of the heel); P-90 cols 38-41 rows 57-59
//   (poles t 39-40,58); knobs 44-45,61 and 41-42,63. Bridge 35,60 to 36,62.
//   Neck from 51,52 up to the nut T at 67,43-44 (board O, shade X, dots W);
//   headstock cols 66-77 rows 37-46 (g face, G shade, o outline), tuners T/t at
//   74,38-39 72,39-40 70,40-41 and 76,42-43 74,43-44 72,44-45 (capped 72,46).
// - Skirt cols 33-60 to the hem rows 69-70; knees rows 71-74 (bend 72); white
//   loose socks rows 79-87 (the cuffs bulge out on the outer sides, rows 79-80,
//   corners closed at 33,78 and 65,78; the inner calves run straight into them,
//   43,76-79 and 56,75-79; lit right, Z shade left; one V crease 34-35,82 / 61-62,82 under the
//   cuff; a sag fold 31-34,84-85 / 61-64,84-85; ankle shade row 86); loafers
//   rows 87-93 (near cols 26-32, far cols 61-67), soles on row 93.

import type { Grid } from '../../types'

/** The 32x32 portrait window over the head: Bocchi's place, so the faces line up across the band. */
export const head = { x: 34, y: 16 }

/** The knee row the figure bends at for a breath or a bob. */
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
  '................................................................................................', // 13
  '................................................................................................', // 14
  '................................................................................................', // 15
  '................................................................................................', // 16
  '................................................................................................', // 17
  '..........................................pppppppppp..........pp................................', // 18
  '........................................pphhHHHHhhhhppp....pppHHp...............................', // 19
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
  '..................................phhrhrhhrsnnnnnssrsnnnrHHp....................................', // 32
  '..................................pHhrhrhhrsnWMEESSrSMEnrrHHp...................................', // 33
  '..................................pHHrhrhhrsnQeeWSSSSeWnrrHHp...................................', // 34
  '..................................pHHrhrhhrssseLSSSSSeLprrHHp...................................', // 35
  '.................................pHHHrhrhhhrssssssssssSprrHHp...................................', // 36
  '.................................pHHHhhhrhhrmSsssssssSprrrHHp.............o.....................', // 37
  '................................pHHHrhhrrhhhpmSmbbmSpprrrrHHhp..........ooToo...................', // 38
  '................................pHHhhhhrrrhhpSssmmpprrrrrHHhhhp.......ooTotGo...................', // 39
  '................................pHHrhhrrrrhppwSSSsZpprrrrhhHhhp......ototgggGo..................', // 40
  '...............................pHHhrhhrrrrpwwwSSSsZwpvrrrhhhHHHp....ooTogggGGo..................', // 41
  '...............................pHhhrhhrrwwwwwppSSZppwpvvrrhhhhHp..ooggGggGGoTo..................', // 42
  '...............................pHhhrPwwwooowpRBpbpBRpjpvrrrhhrhpooOTggGGGoToto..................', // 43
  '...............................pHhhrPwooZZZZpRRRRRRRpjkpvrrrrrpoWOOTGGGoTotoo...................', // 44
  '..............................pHhhrPZZZZjljkpbbpRpbbpjjkpprrooPPPtOXooootoo.....................', // 45
  '.............................pHHHhrPJjjjjljkjJJJjjjjjoojjjooOPssSPoo....o.......................', // 46
  '...........................ppHHHhhrPJjjjljjkjjjjjooooaaojotOOPSSsP..............................', // 47
  '..........................prrrrhhrPJjjjljjkkjjjooaaaaiiooOOWXXPSsP..............................', // 48
  '...........................pppppppPJjjljjKKjJooaAAAiiootOOXXooPssP..............................', // 49
  '..................................PJjljjjPPooaaAAAAioOWOOXoojjPssP..............................', // 50
  '..................................PJljjjjjPaaAAAAAiotOOXXooJJjjPP...............................', // 51
  '..................................oPJJJjjJKPPAAAAiioOXXooAaoJjjP................................', // 52
  '..................................oiPkjJjJjsSPAAAAioXooAAaoJjjP.................................', // 53
  '.................................oiAAPjJjJssssPAAAiioAgAaoJjjP..................................', // 54
  '.................................oiAAAPJJssssSPAAiAAGgAaoJJjjP..................................', // 55
  '................................oiAAAAAPPsssSsPAAAGGGgAaoJJPP...................................', // 56
  '................................oiAAAAGGGPsSsPAAGGGGgAaoJPP.....................................', // 57
  '................................oiAAAAGttGPPPAAGGGGgAaoGGgo.....................................', // 58
  '................................oiAAAAGGGGAAAAGGGGAaoogGggo.....................................', // 59
  '................................oiATAAAAAAAAAAAAAaooggGgggGo....................................', // 60
  '.................................oiATAAAAAAAGGAAaoGgGggGggGo....................................', // 61
  '.................................oIitAAAAAAAAAAaoGggGgggGggGo...................................', // 62
  '.................................ooIiiAAAGGAAAaogGggGGgggGggo...................................', // 63
  '.................................oGoIiiiAAAAAaoggGGggGggggGGo...................................', // 64
  '.................................oGGoIIIIIIIIoggggGggGGgggoo....................................', // 65
  '.................................oGGGooIIIIoogGgggGGggGggoSo....................................', // 66
  '.................................oGGGGGooooGggGgggGGggGooSSSo...................................', // 67
  '.................................oGGgGGGGgGGggGggggGgooSSssso...................................', // 68
  '..................................oooooGGgGgggGggggooSSSssssSo..................................', // 69
  '.....................................oSoooooooooooooSSSsssssso..................................', // 70
  '.....................................oSSSSSSSSo.....oSSSsssSSo..................................', // 71
  '....................................oSSssssSSo.......oSSsssSSSo.................................', // 72
  '....................................oSsssssSSo........oSsssSSSo.................................', // 73
  '....................................oSssssSSo..........oSsssSSSo................................', // 74
  '...................................oSssssSSSo...........oSsssSSo................................', // 75
  '...................................oSssssSSo............oSssssSSo...............................', // 76
  '..................................oSsssssSSo............oSssssSSo...............................', // 77
  '.................................oSSssssSSSo............oSSsssSSSo..............................', // 78
  '................................oZzzzzzzzzzo............oZzzzzzzzzo.............................', // 79
  '...............................oZzzzzzzzzzo..............oZzzzzzzzo.............................', // 80
  '...............................oZZzzVzzzzo................oZZzzVzo..............................', // 81
  '..............................oZzzVVzzzoo.................oZzVVzzo..............................', // 82
  '.............................oZzzzzzzzo....................oZzzzzo..............................', // 83
  '............................oZzZzzZzzo.....................oZZzzZo..............................', // 84
  '...........................oZZzzZZzoo.......................oZZZzo..............................', // 85
  '...........................oZZZzzoo.........................oZZzzo..............................', // 86
  '...........................oZdddo............................oZZddo.............................', // 87
  '..........................odfffo.............................oddffo.............................', // 88
  '..........................odfDDo.............................odfDDo.............................', // 89
  '..........................odfffo.............................odffffo............................', // 90
  '..........................oddFFFo............................oxdfFFFo...........................', // 91
  '..........................oxxxxxo.............................oxddddo...........................', // 92
  '..........................ooooooo..............................ooooo............................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
