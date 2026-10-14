// Kita's palette: one character a color (ART-BRIEF.md "The format";
// reference/character-notes.md has her researched ramps). A part that needs a
// color of its own exports `colors` (see ../../parts.ts).
//
// v2: the reference's outline, skin, mouth, glint, metal, Shuka skirt and loafer
// ramp (shared with the band); her crimson hair ramp with a dark crimson outline,
// chartreuse eyes (the iris's top row in the film's upper-iris olive E, a
// clear step above the pupil M and the lid n, so the iris reads 3 rows tall
// under the lid), the camel cardigan (l j J k K, outlined P), the cream sailor
// collar, the red bow, white loose socks, and the Pelham Blue Les Paul Junior
// double-cut: its black guard, P-90, knobs and headstock drawn in the reference's black-guitar
// tones (g G, as Bocchi's guitar), nickel hardware and a rosewood board (O X). 44 colors.

import type { Palette } from '../../types'

export const palette: Palette = {
  o: '#2e222e', // outline: lower body, guitar, shoes (the reference's)
  p: '#4a1726', // hair outline, a dark crimson tint; also the bow's line
  s: '#fedec7', // skin (the reference's)
  S: '#f0bcae', // skin shade (the reference's)
  m: '#aa6257', // mouth and chin line (the reference's)
  n: '#2e2626', // eye lid line and lashes
  M: '#2f330f', // pupil
  E: '#747c34', // iris dark, the top row: the film's upper-iris olive (lighter than the lid and the pupil)
  Q: '#93b034', // iris mid
  e: '#cfdc45', // iris light
  L: '#f2f0a0', // iris lower glow
  W: '#f8fbf3', // glint (the reference's)
  H: '#ef7a76', // hair light, warm
  h: '#df4955', // hair
  r: '#992e43', // hair shadow, toward magenta
  v: '#682229', // hair deep (under the tail, inner shadow)
  l: '#ecc9ad', // cardigan light: the sleeve ridge
  j: '#d7ae96', // cardigan
  J: '#b48471', // cardigan shade; with j, the ribbed cuffs
  k: '#94625c', // cardigan deep shade: the inner arm contour, folds
  K: '#6e4448', // cardigan crease: the elbow fold
  P: '#4b2a33', // cardigan outline, a dark tint of camel
  w: '#f3e3d7', // sailor collar, cream
  B: '#f08a8c', // bow light
  R: '#e45d65', // bow
  b: '#ab424a', // bow shade; the open mouth
  g: '#625566', // skirt (the reference's Shuka grey-purple); black parts' lit face and edge (headstock, guard rim)
  G: '#3e3546', // skirt shade; black parts: guard, P-90 cover, knobs, headstock shade (the reference's)
  z: '#f3f3f4', // loose socks, white
  Z: '#cbc9d8', // loose socks shade, sailor collar shade, cool
  V: '#9d98b0', // loose socks: the one crease under the cuff
  a: '#9ad9e4', // Pelham Blue light
  A: '#5ab4c9', // Pelham Blue
  i: '#3a8097', // Pelham Blue shade
  I: '#275a70', // Pelham Blue deep
  T: '#c9d1d6', // nickel: wraparound bridge, tuners; the nut
  t: '#9babb2', // strings, frets, P-90 pole pieces (the reference's)
  O: '#6b4538', // rosewood fingerboard, lit face
  X: '#43271f', // fingerboard shade side
  d: '#9d4539', // loafer dark (the reference's shoe ramp)
  f: '#cd683c', // loafer
  D: '#a85732', // loafer mid
  F: '#ef8555', // loafer light
  x: '#6f2627', // loafer darkest
}
