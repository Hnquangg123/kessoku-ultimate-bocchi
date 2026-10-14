// Tiny PNG painting for the studio's quick scripts (no browser): a canvas,
// pixel art laid on it at a whole scale over a per-pixel checker (or none),
// labels in the studio's own 3x5 font, a color mix.

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]

export function canvas(w, h, bg = '#1b1b1f') {
  const png = new PNG({ width: w, height: h })
  const [r, g, b] = rgb(bg)
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r
    png.data[i + 1] = g
    png.data[i + 2] = b
    png.data[i + 3] = 255
  }
  return png
}

export function fillRect(png, x, y, w, h, hex) {
  const [r, g, b] = rgb(hex)
  for (let yy = Math.max(0, y); yy < Math.min(png.height, y + h); yy += 1)
    for (let xx = Math.max(0, x); xx < Math.min(png.width, x + w); xx += 1) {
      const i = (yy * png.width + xx) * 4
      png.data[i] = r
      png.data[i + 1] = g
      png.data[i + 2] = b
      png.data[i + 3] = 255
    }
}

/** Pixels (`[y][x]` of `#rrggbb` or null) at (ox, oy), each `scale` x `scale`; transparent ones show a checker, one square a pixel. */
export function drawPixels(png, px, ox, oy, scale, checker = ['#2c2c33', '#26262c']) {
  px.forEach((row, y) =>
    row.forEach((c, x) => {
      const color = c ?? (checker ? checker[(x + y) % 2] : null)
      if (color) fillRect(png, ox + x * scale, oy + y * scale, scale, scale, color)
    }),
  )
}

/** A label in the 3x5 font (FONT from src/art/fx.ts), each font pixel `scale` x `scale`. Returns the width. */
export function drawText(png, FONT, text, x, y, hex, scale = 2) {
  let at = x
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT[' ']
    glyph.forEach((row, gy) => [...row].forEach((c, gx) => c === 'x' && fillRect(png, at + gx * scale, y + gy * scale, scale, scale, hex)))
    at += (glyph[0].length + 1) * scale
  }
  return at - x
}

/** How wide a label is in the 3x5 font at a scale. */
export function textWidth(FONT, text, scale = 2) {
  let w = 0
  for (const ch of text.toUpperCase()) w += ((FONT[ch] ?? FONT[' '])[0].length + 1) * scale
  return Math.max(0, w - scale)
}

/** `a` moved toward `b` by `t` (0 is a, 1 is b). */
export function mix(a, b, t) {
  const [r1, g1, b1] = rgb(a)
  const [r2, g2, b2] = rgb(b)
  const m = (x, y) => Math.round(x + (y - x) * t)
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

export function save(png, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, PNG.sync.write(png))
}
