import React from 'react'
import type { Pixels } from './art/compose'

/**
 * Pixels as crisp SVG: one path per color, a rectangle per horizontal run,
 * edges never smoothed, so a 1:1 render is exactly the art and a scaled one
 * stays blocky. (One node per color keeps a contact sheet of a few hundred
 * 96x96 frames light for the browser.)
 */
export const PixelCanvas: React.FC<{ px: Pixels; scale?: number; style?: React.CSSProperties }> = ({ px, scale = 1, style }) => {
  const h = px.length
  const w = px[0]?.length ?? 0
  const paths = new Map<string, string[]>()
  px.forEach((row, y) => {
    let x = 0
    while (x < w) {
      const c = row[x] ?? null
      if (c === null) {
        x += 1
        continue
      }
      let run = 1
      while (x + run < w && row[x + run] === c) run += 1
      let d = paths.get(c)
      if (d === undefined) {
        d = []
        paths.set(c, d)
      }
      d.push(`M${x} ${y}h${run}v1h-${run}z`)
      x += run
    }
  })
  return (
    <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{ display: 'block', ...style }}>
      {[...paths.entries()].map(([c, d]) => (
        <path key={c} d={d.join('')} fill={c} />
      ))}
    </svg>
  )
}
