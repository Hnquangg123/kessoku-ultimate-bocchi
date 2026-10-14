import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { blank, stampText, textWidth } from './art/compose'
import type { Pixels } from './art/compose'
import { ART } from './art/members'
import { W } from './art/types'
import { MEMBER_IDS, MOODS } from './anim/moods'
import { drawMood } from './anim/scene'
import { PixelCanvas } from './PixelCanvas'

/**
 * The band on stage for the README: the four of them side by side under
 * their spotlights, every mood in turn, three seconds each, the band's name
 * and the mood in the 2x pixel font. Drawn in pixels end to end and scaled
 * by whole pixels, so the GIF stays as crisp as the sprites.
 */

const GUTTER = 8
/** Where a sprite's row 0 sits on the stage (its soles, row 93, land on the floor's rim). */
const SPRITE_TOP = 14
const SOLES = 93
const RIM_Y = SPRITE_TOP + SOLES + 1

export const STAGE_W = GUTTER + MEMBER_IDS.length * (W + GUTTER)
export const STAGE_H = RIM_Y + 12
export const SHOWCASE_SCALE = 2
export const MOOD_FRAMES = 30
export const SHOWCASE_FRAMES = MOOD_FRAMES * MOODS.length

const BG = '#1b1b1f'
const FLOOR = '#26262c'
const FLOOR_LINE = '#2f2f37'
const RIM = '#5e5866'

/** A color faded toward the stage's dark by `amount` (0 the background, 1 the color). */
function fade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(0x1b + (c - 0x1b) * amount)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function drawStage(frame: number): Pixels {
  const px = blank(STAGE_W, STAGE_H)
  px.forEach(row => row.fill(BG))
  const mood = MOODS[Math.floor(frame / MOOD_FRAMES) % MOODS.length] ?? 'anxious'
  const local = frame % MOOD_FRAMES
  // The floor, its rim and a few boards.
  for (let y = RIM_Y; y < STAGE_H; y += 1) (px[y] as (string | null)[]).fill(y === RIM_Y ? RIM : (y - RIM_Y) % 4 === 0 ? FLOOR_LINE : FLOOR)
  MEMBER_IDS.forEach((id, i) => {
    const art = ART[id]
    const x0 = GUTTER + i * (W + GUTTER)
    const cx = x0 + W / 2
    // A spotlight cone in her color, faint, widening to the floor, and its pool on the boards.
    const cone = fade(art.accent, 0.16)
    const pool = fade(art.accent, 0.3)
    const top = 4
    for (let y = top; y < RIM_Y; y += 1) {
      const half = 6 + Math.round(((y - top) * 38) / (RIM_Y - top))
      for (let x = cx - half; x < cx + half; x += 1) if (x >= 0 && x < STAGE_W) (px[y] as (string | null)[])[x] = cone
    }
    for (let y = RIM_Y + 1; y < RIM_Y + 5 && y < STAGE_H; y += 1) {
      const half = 44 - (y - RIM_Y) * 3
      for (let x = cx - half; x < cx + half; x += 1) if (x >= 0 && x < STAGE_W) (px[y] as (string | null)[])[x] = pool
    }
    const sprite = drawMood(art, mood, local, 'full')
    sprite.forEach((row, y) =>
      row.forEach((c, x) => {
        const ty = y + SPRITE_TOP
        if (c !== null && ty >= 0 && ty < STAGE_H) (px[ty] as (string | null)[])[x0 + x] = c
      }),
    )
  })
  stampText(px, 'KESSOKU BAND', GUTTER, 3, '#f7a8c9', 2)
  const label = mood.toUpperCase()
  stampText(px, label, STAGE_W - GUTTER - textWidth(label, 2), 3, '#8a8392', 2)
  return px
}

export const Showcase: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: BG }}>
      <PixelCanvas px={drawStage(frame)} scale={SHOWCASE_SCALE} />
    </AbsoluteFill>
  )
}
