// Nijika's stand, candidate A (template-first). Not wired into index.ts: preview it with
//   node scripts/look.mjs nijika ref stand portrait:stand --stand src/art/members/nijika/stand-a.ts
//
// Built on REF_STAND by a character map: its legs, knees and stance, the skirt's hem and the far
// thigh, Bocchi's picking arm (sleeve contour, elbow crease, cuff), her head silhouette and face
// geometry are kept pixel for pixel and recolored to Nijika's ramps (reference/character-notes.md);
// the hair, the top, the far arm, the fists and the sticks are drawn over them. Light from the upper
// right; 1-px outlines (o: legs, skirt, vest, sticks, shoes; p: hair and skin; q: shirt; K: bow).
//
// Where things are (cols, rows):
// - Dorito ahoge: tip 42,13, base 41-46 on row 18, shadow r on its left face, light H on its right.
// - Crown rows 18-23 (Bocchi's outline), strands slanting toward the scrunchie; bangs rows 23-30 in
//   three clumps split by r lines (A 44,21 -> 37,30; s1 47,23 -> 43,29; s3 54,23 -> 56,30), open
//   at the forehead: a skin gap from 51,27 widening to 47-52 on row 30.
// - Near side lock: Bocchi's strands (r37, r39, r42) down to row 37, flaring out to col 32 at
//   chin height (rows 38-42), two pointed tips at 34,44 and 38,45 over the shoulder.
// - Far lock: cols 53-59 rows 30-44, H band outside, tip 56,45.
// - Scrunchie: a bumpy hair-yellow ring (Z h r) at cols 54-60 rows 17-23.
// - Side tail: springs up out of the scrunchie (arch top 62-64,16), hangs behind the far shoulder,
//   shaded like the reference's long hair (u r inside, a long H cluster with strand lines, h rim),
//   split into an inner lock (tip 63,57) and an outer lock flicking out (tip 67,59).
// - Face on Bocchi's coordinates: lid row 31 (near eye 43-48, far eye 53-55), lashes flicking up
//   at 42,30 and 56,30, irises E/e/M with a W glint and a gold Q glow; toothy grin row 37
//   (i46 W47-49 i50) over i47-49 on row 38; chin row 39.
// - Collar rows 40-42; big red bow (R P k K) cols 43-54 rows 41-50 with polka dots; dark grey
//   V-neck vest (V v, c trim) cols 42-56 rows 41-57, its hem band rows 55-57.
// - Near sleeve cols 34-47 rows 41-57 (Bocchi's arm); far sleeve cols 52-61 rows 42-55, elbow 60,52.
// - Fists: near cols 41-46 rows 54-59, far cols 50-56 rows 56-60 (knuckle line S).
// - Sticks (T, shade t on the underside, tips a): near 45,59 -> 54,68, far 51,60 -> 43,68,
//   crossing at 48-49,62-63, the near one in front.
// - Navy skirt (b g G) cols 33-60 rows 57-70, pleats fanning to REF's hem folds, the left panel in
//   shadow; bare legs; white slouch socks rows 81-87; red sneakers (F f d x) with laces, a white
//   toe cap and white soles on row 92; soles on row 93.

import type { Grid, Palette } from '../../types'

/** Her full palette: the reference's shared outline, skin, mouth and glint, and her own ramps (reference/character-notes.md). */
export const palette: Palette = {
  o: '#2e222e', // outline: legs, skirt, vest, sticks, shoes (the reference's)
  s: '#fedec7', // skin (the reference's)
  S: '#f0bcae', // skin shade (the reference's)
  m: '#aa6257', // mouth and chin line (the reference's)
  W: '#f8fbf3', // eye glint, teeth (the reference's)
  p: '#5e3428', // hair and skin outline: warm brown with a plum lean
  H: '#fbe7a1', // hair light
  h: '#f0cc62', // hair
  r: '#cd8a3a', // hair shadow
  u: '#a5612b', // hair deep shadow
  Z: '#ffe27a', // scrunchie (hair yellow, a touch brighter)
  n: '#3a2229', // lid line, warm dark
  M: '#4a1c1c', // pupil
  E: '#8f3b36', // iris dark
  e: '#d9573f', // iris, red-orange
  Q: '#f2c27a', // iris lower glow
  i: '#7e2a36', // mouth inside
  w: '#f7f7f2', // shirt white, socks, laces, soles
  y: '#c9cad6', // white shade
  Y: '#9a9bb2', // white deep shade
  q: '#4d4a62', // shirt outline
  v: '#49494f', // vest
  V: '#2f2f37', // vest shade
  c: '#5e5e66', // vest light: the V-neck trim
  R: '#d33950', // bow red
  P: '#ef657a', // bow polka dots
  k: '#9c2238', // bow shade
  K: '#4e1426', // bow outline
  b: '#415584', // skirt light
  g: '#2c3c61', // skirt navy
  G: '#1b1c3a', // skirt deep
  F: '#e65a5f', // sneaker light
  f: '#cb3341', // sneaker red
  d: '#93212e', // sneaker shade
  x: '#5c1a26', // sneaker darkest
  a: '#f4dcb6', // stick light
  T: '#e5b789', // stick wood
  t: '#c4935f', // stick wood shade
}

/** The 32x32 portrait window on this stand: the Dorito's tip, both eyes, the grin and the scrunchie; the lid row (31) on an even window row. */
export const head = { x: 34, y: 13 }

/** The knee row: a squash lowers every row above it. */
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
  '..........................................p.....................................................', // 13
  '..........................................pp....................................................', // 14
  '..........................................php...................................................', // 15
  '..........................................phHp................ppp...............................', // 16
  '..........................................prhHp.........ppp..pHHHpp.............................', // 17
  '.........................................prhhHHppppp...pZZhpphHHHHhp............................', // 18
  '........................................pphhhhHHHHhhpppZZhhrphHHHHhhp...........................', // 19
  '.......................................phhhhhhhHHHHhhhhpZhrprhhHHHHhhp..........................', // 20
  '......................................phhhhhrhhHHHHrhhpZZhrrprhhHHHHhp..........................', // 21
  '.....................................phhhhhrhhhHHHrhhhhphrrpurrhhHHHHp..........................', // 22
  '....................................phhhhhrhhhhrHHrhHHrhpppuurrhhHHHHp..........................', // 23
  '....................................phhhhrhhHHrhHHrhHHrhHHpuurrhhHHHHp..........................', // 24
  '...................................phhhhrhhHHrhHHHrhHHrhHHpuurrhHHHHhp..........................', // 25
  '...................................phhhrhhHHhrhHHHrhhHHrHHpuurrhHrHHhp..........................', // 26
  '...................................phhhrhhHHrhhHHhrSrHHrHHpurrhhHrHHhp..........................', // 27
  '...................................phhrhhHHrhHHhhrSsSrHhrHpurrhhHrHHhp..........................', // 28
  '..................................phhhrhhHHrhHhhrSssSrhhrHpurrhhHrHHhp..........................', // 29
  '..................................phhrhhhhnrhhrSssssSrhrnHhpurrhHrHHhp..........................', // 30
  '..................................phhrhrhhrnnnnnnssssnnnrhHpurrhHHHhp...........................', // 31
  '..................................phhrhrhhrnEEEEEssssEEnrHHpurrhHHHhp...........................', // 32
  '..................................pHhrhrhhrsWeMeessssMWnrrHHpurhHHHhp...........................', // 33
  '..................................pHHrhrhhrseeeeesssseenrrHHpurhHHHhp...........................', // 34
  '..................................pHHrhrhhrsseQesssssQeprrHHpurrhHHhp...........................', // 35
  '..................................pHHrhrhhhrssssssssssSprrHHpurrhHHhp...........................', // 36
  '.................................pHHHhhhrhhrmSiWWWissSprrrHHpurhHHrhp...........................', // 37
  '................................pHHHrhhrrhhhpmSiiiSSpprrrrHHpurhHHrhp...........................', // 38
  '................................pHHhhrhrrrhhpSsssSpprrrrrHHhpurhHHrhp...........................', // 39
  '................................phHHrhhrhrhpqwSSSSpwprrrhHhpuurhHHrhp...........................', // 40
  '................................pHhrhhrhhrpqKKwyywwwKKrhHhpuuurhHHrhp...........................', // 41
  '................................phrphrhhrpwKRRKwwwwKRRKhHpuuuurhHHHhp...........................', // 42
  '.................................prpphrhpwwKRPRKKKKRPRKrhpquuurrhHHhp...........................', // 43
  '..................................p.qphpwwwKRRkKRRKkRRKphpwquurrhHHhp...........................', // 44
  '......................................pwwwwKkRkKRkKkRkKqpwwwqurhHHHhp...........................', // 45
  '...................................qyywwwwywKkKKkkKKkKvqywwwqurhHHhhp...........................', // 46
  '..................................qyyywwwyywwKyKRRKvKvvqyywwwqrhHHhp............................', // 47
  '..................................qyywwwyywwwwKRkkRKvvvqyywwwqrhHHhp............................', // 48
  '..................................qyywwYyYwwwyKRKKRKvvvqYywwwqrrHHhp............................', // 49
  '..................................qyywwwYYwwyqVKvcKvvvvqYyywwqrrHrhp............................', // 50
  '..................................qyyywwwqqVVVVVvvvvvvvqYyywwqrhHrhp............................', // 51
  '..................................qyyywwwwqVVVVVVvvvvvqyyyywwqrhHrhp............................', // 52
  '...................................qyyywwwyYqqVVVvvvvqywwwwwqprhHHhp............................', // 53
  '....................................qyyywypppVVVVvvvqywwwwwq.prphHhhp...........................', // 54
  '.....................................qyYypssspVVVVVVqyyyyyq...prpHHhp...........................', // 55
  '.......................................qYpsSSspvvvvpssspo.....prphHhp...........................', // 56
  '.......................................qqpsssSpooopsSSssp......p.phHp...........................', // 57
  '........................................oGpSspGggGpsssSspo........php...........................', // 58
  '.......................................oGGgppTGgGggpsSspggo........p............................', // 59
  '.......................................oGGGggtTgGggTpppGggo.....................................', // 60
  '......................................oGGgGggGtTGgTtbgGbGggo....................................', // 61
  '.....................................oGGGGggGggtTTtGbgGbgGggo...................................', // 62
  '....................................oGGGGgggGggGtTgGbgGbggGgo...................................', // 63
  '....................................oGGGGgggGggTttTGbgGbggGgo...................................', // 64
  '...................................oGGGGgggGggTtggtTbgGbggoo....................................', // 65
  '..................................oGGGGGgggGgTtGgggtTgGbgoSo....................................', // 66
  '.................................oGGGGGgggGgTtGggggGtTGooSSSo...................................', // 67
  '.................................oGGGGggggGaggGgggGbgoaSSssso...................................', // 68
  '..................................oooooGGgGgggGggggooSSSssssSo..................................', // 69
  '.....................................oSoooooooooooooSSSsssssso..................................', // 70
  '.....................................oSSSSSSSSo.....oSSSsssSSo..................................', // 71
  '....................................oSSssssSSo.......oSSSsSSSso.................................', // 72
  '....................................oSsssssSSo........oSSSSSsso.................................', // 73
  '....................................oSssssSSo..........oSSSsssso................................', // 74
  '...................................oSssssSSSo...........osssssso................................', // 75
  '...................................osssssSSo............oSsssssSo...............................', // 76
  '..................................oSssssssSo............oSSssssso...............................', // 77
  '..................................ossssssso..............oSSSSsso...............................', // 78
  '.................................osssSSsso...............oSSSssso...............................', // 79
  '................................oSssssSSo.................oSsssso...............................', // 80
  '................................oywwwwwo..................oywwwwo...............................', // 81
  '...............................oywwywwo....................oywywo...............................', // 82
  '..............................oyywwwwo.....................oyywwo...............................', // 83
  '.............................oywwywwo.......................oywwo...............................', // 84
  '............................oyywwwwo........................oyywo...............................', // 85
  '...........................oyywwwoo..........................oywwwo.............................', // 86
  '...........................odfFfo............................odfFfo.............................', // 87
  '..........................odfwfo.............................odfwfo.............................', // 88
  '..........................odffwo.............................odffwo.............................', // 89
  '..........................odffFo.............................odffFFo............................', // 90
  '..........................odfFFwo............................oxdfFFwo...........................', // 91
  '..........................oywwwwo.............................oywwwwo...........................', // 92
  '..........................ooooooo..............................ooooo............................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
