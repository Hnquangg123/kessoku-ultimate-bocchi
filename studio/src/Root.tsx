import React from 'react'
import { Composition, Still } from 'remotion'
import { OUTLINE, highlight } from './art/compose'
import { FX_INKS } from './art/fx'
import { ART } from './art/members'
import { H, MINI, PH, PW, W } from './art/types'
import { CRASH_COLORS, CRASH_FRAMES, CRASH_FX_COLORS, CRASH_H, CRASH_MINI_H, CRASH_MINI_W, CRASH_W } from './anim/crash'
import { FPS, MEMBER_IDS, MOODS, framesOf, fxColors } from './anim/moods'
import { SHEET_WIDTH, Sheet, calculateSheet } from './Sheet'
import { SHOWCASE_FRAMES, SHOWCASE_SCALE, STAGE_H, STAGE_W, Showcase } from './Showcase'
import { Crash, PaletteHolder, Sprite } from './Sprite'

/** Every color the art (the minis' too), the effects (with their highlights, outline and own inks) and the crash paint with. */
function allColors(): string[] {
  const set = new Set<string>([OUTLINE, ...CRASH_COLORS, ...CRASH_FX_COLORS.map(highlight)])
  for (const inks of Object.values(FX_INKS)) for (const c of Object.values(inks ?? {})) set.add(c.toLowerCase())
  for (const art of Object.values(ART)) {
    set.add(art.accent.toLowerCase())
    for (const c of Object.values(art.palette)) set.add(c.toLowerCase())
    for (const c of fxColors(art)) {
      set.add(c)
      set.add(highlight(c))
    }
  }
  return [...set].map(c => c.toLowerCase())
}

/**
 * The compositions:
 *   <member>-<mood>            96x96, the full figure: what the panels play
 *   <member>-<mood>-portrait   32x32, the window over her head: the strip and the small spots
 *   <member>-<mood>-mini       16x16, the hand-drawn mini rig (or the portrait halved): the terminal's smallest spots
 *   fx-crash                   96x32, the dropped guitar for Blast Radius
 *   fx-crash-mini              48x16, the same halved
 *   sheet-<member>             a contact sheet of every pose, face and frame (a still)
 *   Showcase                   the band on stage, every mood in turn (the README GIF)
 *   Palette                    the colors, for the export to snap to
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {MEMBER_IDS.flatMap(member =>
        MOODS.flatMap(mood => [
          <Composition
            key={`${member}-${mood}`}
            id={`${member}-${mood}`}
            component={Sprite}
            width={W}
            height={H}
            fps={FPS}
            durationInFrames={framesOf(ART[member], mood)}
            defaultProps={{ member, mood, view: 'full' as const }}
          />,
          <Composition
            key={`${member}-${mood}-portrait`}
            id={`${member}-${mood}-portrait`}
            component={Sprite}
            width={PW}
            height={PH}
            fps={FPS}
            durationInFrames={framesOf(ART[member], mood)}
            defaultProps={{ member, mood, view: 'portrait' as const }}
          />,
          <Composition
            key={`${member}-${mood}-mini`}
            id={`${member}-${mood}-mini`}
            component={Sprite}
            width={MINI}
            height={MINI}
            fps={FPS}
            durationInFrames={framesOf(ART[member], mood)}
            defaultProps={{ member, mood, view: 'mini' as const }}
          />,
        ]),
      )}
      <Composition id="fx-crash" component={Crash} width={CRASH_W} height={CRASH_H} fps={FPS} durationInFrames={CRASH_FRAMES} defaultProps={{ mini: false }} />
      <Composition id="fx-crash-mini" component={Crash} width={CRASH_MINI_W} height={CRASH_MINI_H} fps={FPS} durationInFrames={CRASH_FRAMES} defaultProps={{ mini: true }} />
      {MEMBER_IDS.map(member => (
        <Still key={`sheet-${member}`} id={`sheet-${member}`} component={Sheet} width={SHEET_WIDTH} height={1200} defaultProps={{ member }} calculateMetadata={calculateSheet} />
      ))}
      <Composition id="Showcase" component={Showcase} width={STAGE_W * SHOWCASE_SCALE} height={STAGE_H * SHOWCASE_SCALE} fps={FPS} durationInFrames={SHOWCASE_FRAMES} />
      <Still id="Palette" component={PaletteHolder} width={1} height={1} defaultProps={{ colors: allColors() }} />
    </>
  )
}
