// Nijika's palette (v2): one character a color (ART-BRIEF.md "The format";
// reference/character-notes.md has her researched ramps). The outline o, skin
// s/S, mouth m and glint W are the reference's own, shared with the band; the
// rest are her derived ramps, each with its hue shift (shadows cooler and
// deeper, lights warmer and paler), light from the upper right. A part that
// needs a color of its own exports `colors` (see ../../parts.ts): pick a key
// that is not here.

import type { Palette } from '../../types'

export const palette: Palette = {
  o: '#2e222e', // outline: legs, skirt, vest, sticks, shoes (the reference's)
  s: '#fedec7', // skin (the reference's)
  S: '#f0bcae', // skin shade (the reference's)
  m: '#aa6257', // mouth and chin line (the reference's)
  W: '#f8fbf3', // eye glint, teeth (the reference's)
  p: '#5e3428', // hair outline, hands: warm brown with a plum lean
  H: '#fbe7a1', // hair light
  h: '#f0cc62', // hair
  r: '#cd8a3a', // hair shadow
  u: '#a5612b', // hair deep shadow
  Z: '#ffd447', // scrunchie: the hair's yellow, deeper and more saturated so the ring reads apart from the hair
  z: '#fff6cf', // scrunchie sheen (upper right)
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
  a: '#e5b789', // stick wood, lit side (the notes' wood: apart from the skin s)
  T: '#c4935f', // stick wood, shade side (the notes' wood shade: apart from the skin S)
}
