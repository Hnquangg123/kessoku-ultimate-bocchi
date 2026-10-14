// Ryo's palette: one character a color (ART-BRIEF.md "The format";
// reference/character-notes.md has her researched ramps). A part that needs a
// color of its own exports `colors` (see ../../parts.ts).
//
// v2: 44 colors. The reference's outline, skin, mouth, lid navy, glints, metal and
// loafer ramp (shared with the band); her cobalt hair ramp with a sheen, lemon
// eyes, a navy-charcoal sweater (k j J K), the white shirt and the black string
// tie, navy pleats, black tights with a shin sheen, an Olympic White P-bass with a
// mint guard and a rosewood board, chrome, and the purple floral strap.

import type { Palette } from '../../types'

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
  L: '#c2a53a', // iris mid gold, under the lid shadow
  M: '#3b3222', // pupil
  v: '#5a3a3a', // the mole under the far eye
  k: '#5f5d76', // sweater light, the lit rim
  j: '#40404f', // sweater, navy-charcoal
  J: '#36364a', // sweater shade, folds (above the outline K)
  K: '#191a2b', // sweater outline; the string tie; the bar pins
  w: '#f2f2ee', // shirt
  y: '#c7d0e8', // shirt shade (the reference's zipper grey-blue)
  g: '#33467a', // skirt, navy (lifted with G so the pleats hold on the dark stage; Nijika shares it)
  G: '#273159', // skirt deep, the pleat folds (above the outline o)
  l: '#727a8b', // tights sheen
  i: '#555a67', // tights (the reference's black-fabric value, cooler)
  I: '#3c404c', // tights shade (above the outline o)
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
