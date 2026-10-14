// Ryo's stand, candidate A (template-first). A preview module for the tools' --stand option, not
// wired into index.ts: `node scripts/look.mjs ryo ref stand --stand src/art/members/ryo/stand-a.ts`.
//
// Built from REF_STAND by script: the legs, knees and loafers pixel for pixel (thigh skin and socks
// recolored to black tights, a sheen line down each leg), the skirt's far side and pleats from the
// reference recolored navy, and the reference's face geometry kept exactly: lids rows 31-32, near eye
// cols 44-48 (the lock covers its outer corner at 42-43), far eye cols 53-55, rows 31-35; the chin line
// at 44,37 and 45,38; the mouth row 39 cols 46-49; the neck rows 40-41 cols 46-49; soles on row 93.
// Then the hair, the top and the instrument redrawn over it as Ryo (reference/character-notes.md):
// - a cobalt bob, hair top row 18 (cols 42-51), the reference's head width (cols 34-60), a sheen
//   arc on the crown and the bangs swept to the viewer's left in clumps lit on their right faces;
//   longer on the near side, where the ends flip out over the shoulder to col 29 (rows 39-45, the
//   underside dark) and two dark bar pins slant at cheek height (cols 36-40, rows 34-37); on the
//   far side the hair is tucked behind a small ear (cols 56-58, rows 33-36) with a piercing glint;
// - heavy flat lids over lemon eyes, dark under the lid (deadpan), the mole at 52,37;
// - an oversized navy-charcoal V-neck (light from the upper right: the far shoulder and the far
//   sleeve's outer edge, the near sleeve's inner edge), the white collar and a black string tie in
//   the V (rows 41-46), a ribbed hem at rows 60-62, sleeves over half of each hand; a purple strap
//   with pink flowers from the far shoulder to the bass horn;
// - an Olympic White Precision bass slung low at the hip: the body cols 30-56, rows 53-71 (above the
//   bend), offset horns, a mint pickguard round the split-coil pickup, chrome bridge and control
//   plate; the rosewood neck rising 1 row in 3 (about 18 degrees) from 46,59 to the nut at 73,50-53,
//   a maple Fender headstock to col 87 with four keys on top. Fingerstyle: the near hand plucks over
//   the strings at cols 43-48 rows 58-63; the far hand wraps the neck at cols 63-67 rows 52-57, its
//   sleeve passing behind the neck.

import type { Grid, Palette } from '../../types'

/** Her full palette: the reference's shared skin, mouth and outline, and her own ramps. */
export const palette: Palette = {
  o: '#2e222e', // outline: the lower body, the bass, the shoes
  p: '#542549', // skin outline (the reference plum): jaw, ear, hands
  s: '#fedec7', // skin
  S: '#f0bcae', // skin shade
  m: '#aa6257', // mouth and chin line
  n: '#292847', // lid line (the reference navy)
  W: '#f8fbf3', // glint; the bass body's lit rim; the nut; an inlay dot
  t: '#9babb2', // metal: frets, tuner posts, the pins' glint, the ear piercing
  f: '#cd683c', // loafer
  F: '#ef8555', // loafer light
  D: '#a85732', // loafer mid
  d: '#9d4539', // loafer dark
  x: '#6f2627', // loafer darkest
  U: '#a2bedd', // hair sheen
  H: '#5d8ccc', // hair light
  h: '#375fa5', // hair
  r: '#233a78', // hair shadow
  R: '#1b2b60', // hair deep: the underside of the bob
  N: '#161a3d', // hair outline
  E: '#6f6034', // iris dark (under the lid)
  e: '#e3d566', // iris (lemon)
  L: '#f8f0c0', // iris lower light
  M: '#3b3222', // pupil; the mole under the far eye
  k: '#625e7a', // sweater light
  j: '#454559', // sweater
  J: '#2d2f47', // sweater shade
  K: '#181a2e', // sweater outline; the string tie
  w: '#f2f2ee', // shirt
  y: '#c7d0e8', // shirt shade (the reference zipper grey-blue)
  g: '#34446e', // skirt
  G: '#212a4b', // skirt shade
  l: '#626a7a', // tights sheen
  i: '#474c57', // tights
  I: '#33363f', // tights shade
  z: '#efe9d6', // bass body (Olympic White)
  Z: '#cbc2a6', // bass body shade; the maple headstock
  Y: '#a2987b', // bass body deep shade; the headstock's lower edge
  q: '#cde5c9', // pickguard (mint)
  Q: '#a6c4a3', // pickguard shade
  u: '#4a2c22', // rosewood fingerboard
  A: '#c9d1d6', // chrome: bridge, control plate, tuner keys
  X: '#1f1f22', // pickup; the bar hairpins
  P: '#6b4785', // strap (purple)
  a: '#e98fb7', // strap flowers (pink)
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
  '........................................NNhhhhHHHHHHNNN.........................................', // 19
  '.......................................NhhhhhhHHHHHHHHHN........................................', // 20
  '......................................NhhhhhHHHHUUUUUHHHN.......................................', // 21
  '.....................................NhhhhhHHHUUHHHHHUUUHN......................................', // 22
  '....................................NhhhhhhrhHHrHHHrHUUHHN......................................', // 23
  '...................................NhhhhhhhrhHHrhHHrhHHrHHN.....................................', // 24
  '..................................NHhhhhhhrhHHrhHHHrhHHrHHHN....................................', // 25
  '..................................NHhhrhhhrhHHrhHHrhHHHrHHHN....................................', // 26
  '..................................NHhhrhhhrhHHrhHHrhHHrHHrHN....................................', // 27
  '..................................NHhhrhhrhhHrhHHHrhHHrHHrHN....................................', // 28
  '..................................NhhhrhhrhhHrhhHrhHHHrHHrHN....................................', // 29
  '..................................NhhhrhhrhhhrhhHrhhHrHHHrHN....................................', // 30
  '..................................NhhhrhhrhhhnnnnrhhsnnphrHN....................................', // 31
  '..................................NhhhrhhrhhnnnnnssssnnnhrHN....................................', // 32
  '..................................NhhhrhhrhhnEMMESSSSnMnSprHN...................................', // 33
  '..................................NhhrXXtrhRnWeeESSSSeWnSsphN...................................', // 34
  '..................................NhXXhhhrhRssLLSSSSSLeSSSphN...................................', // 35
  '..................................NhhrXXtrRRssssssssssspptrhN...................................', // 36
  '..................................NhXXhhhRRRmSssssssMSpRRrhhN...................................', // 37
  '..................................NhhrhhRRRRpmSssssSppRRrhhN....................................', // 38
  '.................................NHhhrhRRRRRppmmmmppRRrrhhN.....................................', // 39
  '................................NHhhhrhhRRNNRpSSsspNRrNNNN......................................', // 40
  '...............................NHhhhrhhRNNjKwwSSSSwwKkkK........................................', // 41
  '..............................NHhhhrhRRNjjjjkwKKKKwJkPPkK.......................................', // 42
  '.............................NHhhrRRRNNjjjjjkywKKwyJkaPkkK........................oo.oo.........', // 43
  '.............................NhRRRNNjjjjjjkkJkwKKwJjkPPkkkK....................oooAAoAAo........', // 44
  '..............................NNNNKJjjjjjjkkJkwKyyJjjPPJkkkK................oooAAotooto.........', // 45
  '.................................KJjjjjjjjkkJJkKyJjjjPPJjkkK...............oAAotozzzzzo.........', // 46
  '.................................KJjjjjjjjkkkKjkJjjjjjPPjjkkK..............otozzzZZZZZzo........', // 47
  '.................................KJJjjjjjjkkkKjjjjjjjjPajjkkK..............ozzZZZZZZZYYo........', // 48
  '.................................KJJjjjjjjkkkKjjjjJjjjPPJjjkkK............ozZZZZZZYYYoo.........', // 49
  '.................................KJJjjjjjjkkkKjjjjJkjjPPJjjkkK...........ozZZZZYYYooo...........', // 50
  '.................................KJJJjjjjjjkkKjjjjjJkjaPJjjjkK........oooWZZYYYooo..............', // 51
  '.................................KJjJJjjjjjkkKjjjjjJkjjPPJjjkkK.pppooouuuWYYooo.................', // 52
  '.................................KJjjJJjjjjkkKjjjjoooooPPJjjkkKpsSsptuuuuooo....................', // 53
  '.................................KJjjjJJjjjkkKjjooWWWWWojjJjjoooSsspuuooo.......................', // 54
  '..................................KJjjjjJjjkkKooWqqqqqqYojooouuusSspoo..........................', // 55
  '..................................KJJjjjjjJkkjKWqqqqQQQooouutuWuSsp.............................', // 56
  '..................................oKJjjjjkkKkkKqqQQQoooutuuuuooKpp..............................', // 57
  '................................ooWWKJJjJjkJsSpqqoootuuuuuoooJK.................................', // 58
  '...............................oWWzzzKJJJJjJssspouuuuuuooojjKK..................................', // 59
  '..............................oZzzzzzzKJKJJssssSpuuuooojJjKK....................................', // 60
  '..............................oZzzzzzqqKKKKpsSsSpooojJjJjKKK....................................', // 61
  '..............................oZzAzzzXXXqqqqpsSspqqZoKKKKKgGo...................................', // 62
  '..............................oZzAzzzXXXqqqqqpppqQQYoGgggGggo...................................', // 63
  '..............................oZzAzzzzzzQQQqqqqQQYoogGggggGGo...................................', // 64
  '..............................oZzzAzzzzzzzzQQQQYooGggGGgggoo....................................', // 65
  '..............................oYzzAzzzzzzAXAzZYoggGGggGggoIo....................................', // 66
  '..............................oYZzzzzzAXAzzZZYogggGGggGooIIIo...................................', // 67
  '...............................oYZZzzzzzZZZYYoGggggGgooIIiiio...................................', // 68
  '................................oYYZZZZZYYYoogGggggooIIIiiiiIo..................................', // 69
  '.................................ooYYYYYooooooooooooIIIiiiiiio..................................', // 70
  '...................................oooooIIIIIIo.....oIIIiiiIIo..................................', // 71
  '....................................oIIiiliIIo.......oIIIiIIIio.................................', // 72
  '....................................oIiiliiIIo........oIIIIIiio.................................', // 73
  '....................................oIiiliIIo..........oIIIiiiio................................', // 74
  '...................................oIiiliIIIo...........oiiiliio................................', // 75
  '...................................oiiiliIIo............oIiiliiIo...............................', // 76
  '..................................oIiiliiiIo............oIIiiliio...............................', // 77
  '..................................oiiiliiio..............oIIIIlio...............................', // 78
  '.................................oiiiIIiio...............oIIIilio...............................', // 79
  '................................oIiiliIIo.................oIiilio...............................', // 80
  '................................oIiiliio..................oIIilio...............................', // 81
  '...............................oIIiliio....................oIIiio...............................', // 82
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
