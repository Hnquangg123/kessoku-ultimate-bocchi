import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { ART } from './art/members'
import type { FeastState, MemberId, Mood, SlimeState } from './art/types'
import { drawCrash, drawCrashMini } from './anim/crash'
import { drawFeast, drawFeastHeadband } from './anim/feast'
import { drawMood } from './anim/scene'
import type { View } from './anim/scene'
import { drawSlime } from './anim/slimes'
import type { SlimeView } from './anim/slimes'
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

export type SlimeProps = { member: MemberId; state: SlimeState; view: SlimeView }

/** One member's slime (an act on stage) in one state, 1:1 on a transparent canvas: 36x24, or its mini 18x12. */
export const Slime: React.FC<SlimeProps> = ({ member, state, view }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      <PixelCanvas px={drawSlime(ART[member], state, frame, view)} />
    </AbsoluteFill>
  )
}

export type FeastProps = { member: MemberId; state: FeastState }

/** One member at the Hotpot's table in one feast state, 1:1 on a transparent canvas: the feast window, 96x64. */
export const Feast: React.FC<FeastProps> = ({ member, state }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      <PixelCanvas px={drawFeast(ART[member], state, frame)} />
    </AbsoluteFill>
  )
}

/** Nijika's headband alone on the feast window (96x64), for the mod to lay over her while keepwarm runs. */
export const FeastHeadband: React.FC = () => (
  <AbsoluteFill>
    <PixelCanvas px={drawFeastHeadband(ART.nijika)} />
  </AbsoluteFill>
)

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
