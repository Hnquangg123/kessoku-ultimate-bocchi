import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { ART } from './art/members'
import type { MemberId, Mood } from './art/types'
import { drawCrash, drawCrashMini } from './anim/crash'
import { drawMood } from './anim/scene'
import type { View } from './anim/scene'
import { PixelCanvas } from './PixelCanvas'

export type SpriteProps = { member: MemberId; mood: Mood; view: View }

/** One member in one mood, 1:1 on a transparent canvas: the frames the mod plays (full 96x96, portrait 32x32, mini 16x16). */
export const Sprite: React.FC<SpriteProps> = ({ member, mood, view }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      <PixelCanvas px={drawMood(ART[member], mood, frame, view)} />
    </AbsoluteFill>
  )
}

/** The dropped guitar, 1:1 (96x32, or its 48x16 mini). */
export const Crash: React.FC<{ mini: boolean }> = ({ mini }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      <PixelCanvas px={mini ? drawCrashMini(ART.bocchi, frame) : drawCrash(ART.bocchi, frame)} />
    </AbsoluteFill>
  )
}

/** Holds the palette for the export (it snaps every rendered color to one of these). */
export const PaletteHolder: React.FC<{ colors: string[] }> = () => null
