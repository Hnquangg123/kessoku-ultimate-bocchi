// Ryo's stand, candidate B (silhouette-first). Ryo Yamada, bass (reference/character-notes.md).
// The silhouette was set first as flat shapes and checked at 1x against the reference's: a round
// cobalt bob, longer on the near side (viewer's left) where its ends flip out, tucked behind the ear
// on the far side so the ear and jaw show; an oversized V-neck sweater; an Olympic White P-bass slung
// low and long, its neck rising 1 row in 3 (about 18 degrees) to a 4-in-line headstock at col 88.
// Then rendered in the reference's hand: the hair ramp N R r h H U (a sheen ring across the crown,
// lit bangs on the far side), two dark bar pins on the near lock, heavy flat lids over lemon eyes, a
// mole under the far eye, deadpan; the sweater j/J/k with folds and a ribbed hem, a white collar and
// a black string tie in the V, the purple floral strap from the horn to the far shoulder; the near
// forearm resting on the body's top edge, plucking by the split-coil pickup over the mint guard; the
// fretting hand at the 4th-5th fret; navy pleats, black tights with a shin sheen, brown loafers.
// Synced to REF_STAND: hair top row 18 (cols 42-51); REF's face kept pixel for pixel but the eyes
// (lids rows 31-32, near eye cols 43-48, far eye cols 53-55, rows 31-35), the chin line 44,37 and
// 45,38, the mouth row 39 cols 46-49; REF's legs, stance and loafers recolored; the skirt's pleats
// and hem (row 70); knees row 72; soles row 93. The bass stays above the bend (bottom row 70).
// A preview module for the tools' --stand option; not wired into index.ts.

import type { Grid, Palette } from '../../types'

export const palette: Palette = {
  o: '#2e222e', // outline: legs, skirt, bass, shoes (the reference's)
  p: '#542549', // skin outline: jaw, ear, hands (the reference's plum)
  s: '#fedec7', // skin (the reference's)
  S: '#f0bcae', // skin shade (the reference's)
  m: '#aa6257', // mouth and chin line (the reference's)
  n: '#292847', // lid line (the reference's navy)
  W: '#f8fbf3', // glint; the bass body's lit rim (the reference's)
  t: '#9babb2', // metal: strings, frets, the pins' glint (the reference's)
  F: '#ef8555', // loafer light (the reference's)
  f: '#cd683c', // loafer (the reference's)
  D: '#a85732', // loafer mid (the reference's)
  d: '#9d4539', // loafer dark (the reference's)
  x: '#6f2627', // loafer darkest (the reference's)
  U: '#a2bedd', // hair sheen
  H: '#5d8ccc', // hair light
  h: '#375fa5', // hair, cobalt
  r: '#233a78', // hair shadow, strands
  R: '#1b2b60', // hair deep: the underside of the bob
  N: '#161a3d', // hair outline
  E: '#6f6034', // iris dark, under the lid
  e: '#e3d566', // iris, lemon
  L: '#f8f0c0', // iris lower light
  M: '#3b3222', // pupil; the mole
  k: '#5f5d76', // sweater light, the lit rim
  j: '#40404f', // sweater, navy-charcoal
  J: '#2b2b3c', // sweater shade, folds
  K: '#191a2b', // sweater outline; the string tie; the bar pins
  w: '#f2f2ee', // shirt
  y: '#c7d0e8', // shirt shade (the reference's zipper grey-blue)
  g: '#2c3c61', // skirt, navy
  G: '#1d2343', // skirt deep, the pleat folds
  l: '#5b6272', // tights sheen
  i: '#40454f', // tights
  I: '#2d3038', // tights shade
  z: '#efe9d6', // bass body, Olympic White
  Z: '#cbc2a6', // bass body shade; the maple neck edge
  Y: '#9c9277', // bass body deep shade, the body's side
  q: '#cde5c9', // pickguard, mint
  Q: '#a6c4a3', // pickguard shade, the bevel
  u: '#4a2c22', // rosewood fingerboard
  A: '#c9d1d6', // chrome: bridge, control plate, tuners
  X: '#1f1f22', // pickup, knobs
  P: '#6b4785', // strap, purple
  a: '#e98fb7', // strap flowers, pink
}

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
  '..........................................NNNNNNNNNN............................................', // 18
  '.......................................NNNhhHHHHHHhhhNN.........................................', // 19
  '.....................................NNhhhhHHHHHHHHhhhhN........................................', // 20
  '....................................NhhhhhhhHHHHHHHHhhhhN.......................................', // 21
  '...................................NhhhrhhhHHrHHHHHrHHhhhN......................................', // 22
  '..................................NhhhrhHUUUrUUUHHrUUUHhhN......................................', // 23
  '..................................NhhrhhhHHrHhHHHrhHHHHHhhN.....................................', // 24
  '.................................NhhrhhhhhrHHhhHrhhHHrhHHhN.....................................', // 25
  '.................................NhrhhHhhhrhHHhHrhhHHrhHHhN.....................................', // 26
  '.................................NhrhhHhhhrhHHrHrhHHhrhHHhN.....................................', // 27
  '................................NhhrhHHhhrrhHHrhrhHHhrhhHhN.....................................', // 28
  '................................NhhrhHHhhrhhHhrhrhhHrrhhHHhN....................................', // 29
  '................................NhhrhHHhhrhhhrrhrrhhrrhhHHhN....................................', // 30
  '................................NhhrhHHhhrhhhnnnnrhrsnnphHhN....................................', // 31
  '................................NhhrhHHhhrrhhnnnnssssnnnhHhN....................................', // 32
  '...............................NhhrhhHHtrhrhhEMeESSSSEenShhN....................................', // 33
  '...............................NhhrhhXXHrhrhhWeeeSSSSeWnsShN....................................', // 34
  '...............................NhhrXXHHtrhrRssLLSSSSSLLpsShN....................................', // 35
  '...............................NhhrhhXXhrhhrssssssssssSpSphN....................................', // 36
  '...............................NhhrXXHHhrhhrmSssssssMSpRhhN.....................................', // 37
  '...............................NhhrhHHhhrhhRpmSssssSpp.NNN......................................', // 38
  '...............................NhrhhHHhhrhRRpSmmmmpp..................................o.........', // 39
  '...............................NhrhHHhhrhRRRRwSSsspw...............................o.oAo........', // 40
  '...............................NhrhHHhhrhRRRNwwyKywwKKK.........................o.oAozto........', // 41
  '..............................NhhrHHhhrhhRRNJwwKKKwwkkkKKPP..................o.oAoztzzzzo.......', // 42
  '..............................NhrHHhhrhhRRRNJkwKwKwJjkkaPP..................oAoztzzzzzzZo.......', // 43
  '.............................NHhrHhhrRhhRRNJJkwKwKwJjjPPkkK.................ztzzzzzzzZZYo.......', // 44
  '............................NHhRRRNJJNhhRNJJjjkKwKJjaPPjkkkK...............ozzzzzzZZYYYo........', // 45
  '.............................NNNNN.KjjNNNjJjjjkywKJPPjjJjkkkK...........oooZzzzZZYYYooo.........', // 46
  '..................................KJjjjkJJjjjjjkyJaPjjjJjkkkK....ppp.ooouuuWZZYYYooo............', // 47
  '.................................KJjjjkJJjjjjoooPPPjjjJjJjkkkK..pssspuzuZuuWYYooo...............', // 48
  '................................KJjjjJKKJjoooWWoPjjjjJjjJjjkkk.opSSspZZZoooooo..................', // 49
  '...............................KJjjjJkkkKKWWWzzojjjjJjjjJjjjoooupssSpooo........................', // 50
  '...............................KJjjJjjjkkkKKzzYjjjjJjjjjjooouzuZpsSpo...........................', // 51
  '...............................KJjjjjjjjjJkKpppjjjJjjjooouzuZZZoopp.............................', // 52
  '.............................ooKJjjjjjjjjJksssSpjJjooozuuZZZoookkk..............................', // 53
  '...........................oozzzKJJjjjjjjJksSSspooouuuZZZooojjjjkK..............................', // 54
  '..........................ozzzzqqKKJJjjjjJJpsSspuuuZZZoooJJjjjjkK...............................', // 55
  '.........................ozzzzQqqqqKKKKKKKqqpspuZZZooojjjJJJjjJK................................', // 56
  '........................oZzzzzQqqQQQQQQQXXqqqpZZooojjkkkjjjJJJK.................................', // 57
  '........................oZzzzzQqqqqqqqqqXXtttooojjjJJJJjjjjjJK..................................', // 58
  '.......................oZzzzzzzQqqqqqqqtttqqqQoJJJjJjJjJjJjJjK..................................', // 59
  '.......................oZzzzzzAAQqqqtttXXqqqqqQojJjJjJjJjJjJjK..................................', // 60
  '.......................oZzzzzzAAztttzzXXXQQQQzWoKKKKKKKKKKKKKK..................................', // 61
  '.......................oZzzzzzAAtzzzzzzzzzzzzzoggGggGgggGggGG...................................', // 62
  '.......................oYZzzzzttzzzzzzzzzzzzzogggGggGGgggGggo...................................', // 63
  '.......................oYZzzzzzzzzzzzzzzzZZYogggggGGggGggggGGo..................................', // 64
  '........................oYZzzzzzAAXAzzzzzZYoGgGgggGggGGgggoo....................................', // 65
  '........................oYZzzAXAAtzzzzZZYooGggGgggGGggGggoio....................................', // 66
  '.........................oYZtttzzzZZZZYooggGggGgggGGggGooiiio...................................', // 67
  '..........................oYZZZZZZZYYoogGggGggGggggGgooIIiiio...................................', // 68
  '...........................ooYYYYYoooooGGgGgggGggggooIIIiiiiIo..................................', // 69
  '.............................ooooo...oIoooooooooooooIIIiiiiiio..................................', // 70
  '.....................................oIIIIIIIIo.....oIIIiiiIIo..................................', // 71
  '....................................oIIiiliIIo.......oIIIilIIio.................................', // 72
  '....................................oIiiiliIIo........oIIIIliio.................................', // 73
  '....................................oIiiliIIo..........oIIIliiio................................', // 74
  '...................................oIiiliIIIo...........oiiiliio................................', // 75
  '...................................oiiiliIIo............oIiiliiIo...............................', // 76
  '..................................oIiiliiiIo............oIIiliiio...............................', // 77
  '..................................oiiiliiio..............oIIIliio...............................', // 78
  '.................................oiiilIiio...............oIIIliio...............................', // 79
  '................................oIiiliIIo.................oIiliio...............................', // 80
  '................................oIiiiiio..................oIIiiio...............................', // 81
  '...............................oIIiiiio....................oIIiio...............................', // 82
  '..............................oIIIIiio.....................oIIIIo...............................', // 83
  '.............................oIIIIIIo.......................oIIIo...............................', // 84
  '............................oIIIIIIo........................oIIIo...............................', // 85
  '...........................oIIIIIoo..........................oIIIo..............................', // 86
  '...........................oIdddo............................oIIddo.............................', // 87
  '..........................odfffo.............................oddffo.............................', // 88
  '..........................odfDDo.............................odfDDo.............................', // 89
  '..........................odfffo.............................odffffo............................', // 90
  '..........................oddFFFo............................oxdfFFFo...........................', // 91
  '..........................oxxxxxo.............................oxddddo...........................', // 92
  '..........................ooooooo..............................ooooo............................', // 93
  '................................................................................................', // 94
  '................................................................................................', // 95
]
