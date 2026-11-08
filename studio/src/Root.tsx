import React from 'react'
import { Composition, Still } from 'remotion'
import { ART } from './art/members'
import { FEAST_H, H, MINI, PH, PW, SLIME_H, SLIME_W, W } from './art/types'
import { CRASH_FRAMES, CRASH_H, CRASH_MINI_H, CRASH_MINI_W, CRASH_W } from './anim/crash'
import { FEAST_STATES_OF, feastFramesOf } from './anim/feast'
import { FPS, MEMBER_IDS, MOODS, framesOf } from './anim/moods'
import { SLIME_MINI_H, SLIME_MINI_W, SLIME_STATES, slimeFramesOf } from './anim/slimes'
import { allColors } from './colors'
import { SHEET_WIDTH, Sheet, calculateSheet } from './Sheet'
import { SHOWCASE_FRAMES, SHOWCASE_SCALE, STAGE_H, STAGE_W, Showcase } from './Showcase'
import { Crash, Feast, FeastHeadband, PaletteHolder, Slime, Sprite } from './Sprite'

/**
 * The compositions:
 *   <member>-<mood>            96x96, the full figure: what the panels play
 *   <member>-<mood>-portrait   32x32, the window over her head: the strip and the small spots
 *   <member>-<mood>-mini       16x16, the hand-drawn mini rig (or the portrait halved): the terminal's smallest spots
 *   <member>-slime-<state>     36x24, her slime, one an act on stage (active, idle, asleep): remote surfaces
 *   <member>-slime-<state>-mini  18x12, the slime halved: the terminal's quadrants
 *   <member>-feast-<state>     96x64, seated at the Hotpot's table (rows 6-69 of her canvas): the Hotpot's feast
 *   nijika-feast-headband      96x64, Nijika's headband alone, laid over her while keepwarm runs (a still)
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
      {MEMBER_IDS.filter(member => ART[member].slime !== undefined).flatMap(member =>
        SLIME_STATES.flatMap(state => [
          <Composition
            key={`${member}-slime-${state}`}
            id={`${member}-slime-${state}`}
            component={Slime}
            width={SLIME_W}
            height={SLIME_H}
            fps={FPS}
            durationInFrames={slimeFramesOf(ART[member], state)}
            defaultProps={{ member, state, view: 'slime' as const }}
          />,
          <Composition
            key={`${member}-slime-${state}-mini`}
            id={`${member}-slime-${state}-mini`}
            component={Slime}
            width={SLIME_MINI_W}
            height={SLIME_MINI_H}
            fps={FPS}
            durationInFrames={slimeFramesOf(ART[member], state)}
            defaultProps={{ member, state, view: 'slime-mini' as const }}
          />,
        ]),
      )}
      {MEMBER_IDS.filter(member => ART[member].feast !== undefined).flatMap(member =>
        FEAST_STATES_OF[member].map(state => (
          <Composition
            key={`${member}-feast-${state}`}
            id={`${member}-feast-${state}`}
            component={Feast}
            width={W}
            height={FEAST_H}
            fps={FPS}
            durationInFrames={feastFramesOf(ART[member], state)}
            defaultProps={{ member, state }}
          />
        )),
      )}
      <Still id="nijika-feast-headband" component={FeastHeadband} width={W} height={FEAST_H} />
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
