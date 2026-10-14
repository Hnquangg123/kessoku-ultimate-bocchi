// Nijika's stand, candidate B (v2): idle and ready, both light-wood sticks
// crossed low before her (ART-BRIEF.md "The poses"). The head drawn here is the
// head of every pose but the box.
//
// Silhouette first: the flat triangle on the crown, the round head, the side
// tail springing from the scrunchie on the viewer's right and hanging free of
// the head (a 1-px gap, rows 25-40) behind the far shoulder to a brush tip at
// the waist; the X of the sticks over the navy pleats; REF_STAND's wide stance.
// Then rendered in the reference's hand: 1-px outlines (o for the lower body,
// the sticks and the shoes; p for the hair and the skin; q for the shirt; K for
// the bow), 3-4 tone hue-shifted ramps, light from the upper right.
//
// Built on REF_STAND: its legs, knees, stance and shoe outlines (the socks
// recolored to bare skin, white slouched short socks rows 82-86, red sneakers
// rows 87-93 with white soles on row 92, soles on row 93); its skirt outline and
// hem (rows 58-70, the far side rising to 60,65) with the pleats redrawn in
// navy; Bocchi's picking arm (cols 34-46, rows 41-56: sleeve contour, elbow
// fold, cuff, the stripe kept as a crease) recolored to the white shirt, and
// the far arm drawn as its mirror, foreshortened; her face geometry.
//
// Where things are (cols, rows):
// - Dorito ahoge: tip 42,13, rows 13-17 on the crown's left, light on its right face.
// - Head: crown outline row 18 (cols 40-52), REF's head contour; bangs in
//   side-swept panels (strand lines at cols 42, 48, 53) with a shine band rows
//   23-28, open at the forehead (cols 49-52 from row 26, 47-52 on row 30).
// - Near side lock to row 43, lit outer edge (cols 35-36), flaring at chin
//   height to col 32; far side lock cols 55-59 to row 43.
// - Scrunchie: a bumpy ring, cols 54-60 rows 17-23.
// - Tail: out of the scrunchie (top row 17), cols 60-70, deep shadow u under
//   the scrunchie and behind the shoulder, tips 64,56 and 67,59.
// - Eyes: lid rows 31-32 (lash tick 43,30), near eye cols 43-48 rows 31-35,
//   far eye cols 53-56; cheek blush 44-45,36 and 52-53,36.
// - Grin: teeth W 47-49 row 37 (mouth corners m 46, 50), mouth i 47-49 row 38;
//   chin line row 39 (cols 46-49), jaw 44,37 / 45,38. Face box 16x10 at 42,30.
// - Bow: cols 41-54 rows 41-50 (knot 47-48, tails to row 50).
// - Vest: cols 43-56 rows 42-57, V-neck trim c, point 47,49, ribbed hem row 56.
// - Fists: near cols 41-47 rows 54-59 (REF's hand place), far cols 49-55 rows
//   56-61, outlined p, knuckle lines S; far forearm cols 50-57 rows 53-56.
// - Sticks: the near stick (in front, lit a on its upper-right side) from the
//   near fist 45,59 to the tip 54-55,68; the far stick (t T, behind) from the
//   far fist 50,61 to the tip 41,69; they cross at 48-49,61-63.
// - Portrait window 34,12 (the ahoge's tip inside; the lower lid row 32 on an
//   even window row). Bend (knees) row 72.

import type { Grid, Palette } from '../../types'

export const palette: Palette = {
  // shared with the band (the reference's own)
  o: '#2e222e', // outline: legs, skirt, vest, sticks, shoes
  s: '#fedec7', // skin
  S: '#f0bcae', // skin shade
  m: '#aa6257', // mouth line, chin line
  W: '#f8fbf3', // glint, teeth
  // hair: warm golden blonde, orange-amber shadows (character-notes.md sprite ramp)
  p: '#5e3428', // hair outline, hands: warm brown with a plum lean
  H: '#fbe7a1', // hair light
  h: '#f0cc62', // hair
  r: '#cd8a3a', // hair shadow
  u: '#a5612b', // hair deep shadow (inside the tail, under the scrunchie)
  Z: '#ffe27a', // scrunchie (the hair's yellow, a touch brighter)
  // eyes: red-orange
  n: '#3a2229', // lid line, warm dark
  M: '#4a1c1c', // pupil
  E: '#8f3b36', // iris dark
  e: '#d9573f', // iris
  Q: '#f2c27a', // iris lower glow
  i: '#7e2a36', // mouth inside
  // white shirt
  w: '#f7f7f2', // shirt, socks, laces, soles
  y: '#c9cad6', // white shade
  Y: '#9a9bb2', // white deep shade
  q: '#4d4a62', // shirt outline
  // dark grey V-neck vest
  c: '#5e5e66', // vest light
  v: '#49494f', // vest
  V: '#2f2f37', // vest shade
  // the bow: red with pink polka dots
  P: '#ef657a', // bow polka dots, bow light
  R: '#d33950', // bow red
  k: '#9c2238', // bow shade
  K: '#4e1426', // bow outline
  // navy pleated skirt
  b: '#415584', // skirt light
  g: '#2c3c61', // skirt navy
  G: '#1b1c3a', // skirt deep
  // red sneakers
  F: '#e65a5f', // sneaker light
  f: '#cb3341', // sneaker red
  d: '#93212e', // sneaker shade
  x: '#5c1a26', // sneaker darkest
  // light natural-wood drumsticks
  a: '#f4dcb6', // stick light
  T: '#e5b789', // stick wood
  t: '#c4935f', // stick shade
}

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
  '..........................................p.....................................................', // 13
  '..........................................pHp...................................................', // 14
  '..........................................phHp..................................................', // 15
  '..........................................phhHp.................................................', // 16
  '..........................................prhhHp.......pp.pp.pppp...............................', // 17
  '........................................pprhhhhHppppp.pZZpZhpHHHHHpp............................', // 18
  '.......................................phhrhhhHHHHhhhppZhrZhphhhhHHHp...........................', // 19
  '......................................phhhrhhhhHHHHHhhphZhrZpurhhhhHHp..........................', // 20
  '.....................................phhhhrhhhhhHHHHhhpZhZhrpurhhrhHHp..........................', // 21
  '....................................phhhhhrhhhhhrhhhhrhprhrppuurhrhhHp..........................', // 22
  '....................................phhhhhrhhhhhrhHhhrhHppp.purrhrhHHp..........................', // 23
  '...................................phhrhhhrhHhhhrhHHhrHHHhp.prrhhrhHHp..........................', // 24
  '...................................phhrhrhrHHHhhrhHHhrHHHhp.prhhhrhHHp..........................', // 25
  '...................................phhrhrhrHHHHhhhrrhHHHHhp.prhhhrhHHp..........................', // 26
  '...................................phhhhrhrhHHHhhrssrHHHhhp..prhhrhhHHp.........................', // 27
  '...................................pHhhhrhrhhHHhrsssrHHhhhp..prhhrhhHHp.........................', // 28
  '..................................pHhhhhrhrhhhHrssssrrHhhhp..prhrhhhHHp.........................', // 29
  '..................................pHHhhhrhrnhHrssssssrhHhhrp.prhrhhhHHp.........................', // 30
  '..................................pHHhhhrhrsnnnnsssssnnnnhhp.prhrhhhHHp.........................', // 31
  '..................................pHHhhhrhrnnnnnnssssnnnrHHp..prrhhhHHp.........................', // 32
  '..................................pHHhhhrhrsnWMEnssssMEnrrHHp.prrhhHHHp.........................', // 33
  '..................................pHHhhhrhrsEeMeEsssseWErrHHp.prhrhhHHp.........................', // 34
  '..................................pHHhhhrhrssQeQsssssQesrrHHp.prhrhhHHp.........................', // 35
  '..................................pHHhhhrhhrSSssssssSSSprrHHp.prhhrhHHp.........................', // 36
  '.................................pHHHhhhrhhrmSmWWWmssSprrrHHp.prhhrhHHp.........................', // 37
  '.................................pHHhhhrrhhhpmSiiiSSpprrrrHHp.prhhrhHHp.........................', // 38
  '................................pHHhhhhhrrhhrpmmmmpprrrrrHHhp.prhhrhHHp.........................', // 39
  '................................pHhhhhhhrrhrppSSsspprrrrhhHp..prhrhhHHp.........................', // 40
  '................................phhhhhhrrpKKKwSSSswqpprrhhHp.purhrhhHp..........................', // 41
  '.................................pphrhhpwKRPRKKSSwKKRRprhHp..purhrhhHp..........................', // 42
  '...................................pppwywKRRRRRKKKRRPRKpp....purhrhHHp..........................', // 43
  '....................................qwywwKPRRkKRRKkRRRKcoq...purhrhHHp..........................', // 44
  '...................................qywywwKRRkKKRPKKkRPKcowwq.purrhhHHp..........................', // 45
  '...................................qwywwwKkkKwKkRKvKkkKcowwq.purrhhHHp..........................', // 46
  '..................................qywywwwyKKwKRKKRKvKKccowwwquurrhhHHp..........................', // 47
  '..................................qwywwwyywwKPKwKRKvvvccowwwqurrhrhHHp..........................', // 48
  '..................................qwywwYyYwwKRKcKkKvvvvcowwwqurrhrhHp...........................', // 49
  '..................................qwywwwYYwwKKvvvKKvvvvcowwwwqrhhrhHp...........................', // 50
  '..................................qwywwwwqqVVVvvvvvvvvvcoywwwqurhrHHp...........................', // 51
  '..................................qwwywwwwqVVVvvvvvvvvvvoyywwqurhrhHp...........................', // 52
  '...................................qwwywwyYqqVvvvvvvvvqwoyyywqurrhhHp...........................', // 53
  '....................................qwwwywysSpVvvvvvqwwwyyqq...prhhHp...........................', // 54
  '.....................................qwywysssSpvvvvqwwwyyq.....prphHHp..........................', // 55
  '......................................qyypsSsSspcVqpssSpo.......p.phHp..........................', // 56
  '.......................................qqpsSsSspoopssssSp.........phHp..........................', // 57
  '........................................oqpSsSpggGpsSsSspo........php...........................', // 58
  '.......................................oggqpoTaggGpsSsSspgo........p............................', // 59
  '......................................ogggGggoTagGbpSsSpbgo.....................................', // 60
  '.....................................oggggGggGoTatTopppGbggo....................................', // 61
  '....................................oggggGgggGgoTaogGggGbggo....................................', // 62
  '....................................oggggGgggGgtoTagGggGggggo...................................', // 63
  '...................................oggggGgggGgtTooTaGgggGgggo...................................', // 64
  '...................................oggggGgggGtToGgoTagggGgoooo..................................', // 65
  '.................................ooggggGggggtTogGggoTaggGoSo....................................', // 66
  '.................................oogggGGgggtToGGgggGoTaooSSSo...................................', // 67
  '.................................ogggGGgggtTogGGgggGGoaaossso...................................', // 68
  '.................................ooooooggToGggGGgggooSoossssSo..................................', // 69
  '.....................................oSoooooooooooooSSSsssssso..................................', // 70
  '.....................................oSSSSSSSSo.....oSSSsssSSo..................................', // 71
  '....................................oSSssssSSo.......oSSSsSSSso.................................', // 72
  '....................................oSsssssSSo........oSSSSSsso.................................', // 73
  '....................................oSssssSSo..........oSSSsssso................................', // 74
  '...................................oSssssSSSo...........oSssssso................................', // 75
  '...................................oSssssSSo............oSsssssso...............................', // 76
  '..................................oSssssssSo............oSSssssso...............................', // 77
  '..................................oSsssssso..............oSSsssso...............................', // 78
  '.................................oSsssssso...............oSSsssso...............................', // 79
  '................................oSsssssso.................oSsssso...............................', // 80
  '................................oSssssso..................oSSssso...............................', // 81
  '...............................oSssssso...................oywwwwo...............................', // 82
  '.............................oywwwwwwo....................oyywwwo...............................', // 83
  '.............................oyyywwwo......................oyywwo...............................', // 84
  '............................oyyywwwo.......................oyywwo...............................', // 85
  '...........................oyywwwoo.........................oyywwo..............................', // 86
  '...........................oywddo............................oywddo.............................', // 87
  '..........................odfwfo.............................odfwfo.............................', // 88
  '..........................odfFwo.............................odffwo.............................', // 89
  '..........................odfFFo.............................odffFFo............................', // 90
  '..........................odfFFFo............................oxdfFFFo...........................', // 91
  '..........................oywwwwo.............................oywwwwo...........................', // 92
  '..........................ooooooo..............................ooooo............................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]

export const head = { x: 34, y: 12 }

export const bend = 72
