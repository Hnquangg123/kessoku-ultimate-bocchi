// Every color the sprites paint with: what the export (scripts/sprites.mjs)
// snaps each rendered pixel to, and what `npm run check` counts against the
// generated file's alphabet (scripts/alphabet.mjs). Root.tsx hands it to the
// Palette still; scripts/studio.mjs exports it to the quick scripts.

import { OUTLINE, highlight } from './art/compose'
import { FX_INKS } from './art/fx'
import { ART } from './art/members'
import { CRASH_COLORS, CRASH_FX_COLORS } from './anim/crash'
import { FEAST_FX_COLORS, feastFxColors } from './anim/feast'
import { fxColors } from './anim/moods'
import { SLIME_FX_COLORS } from './anim/slimes'

/**
 * Every color the art (the minis', the slimes' and the seated feast's too), the effects (with their highlights,
 * the outline and their own inks), the slimes' z, the feast's food, flash and weed, and the crash paint with.
 */
export function allColors(): string[] {
  const set = new Set<string>([OUTLINE, ...CRASH_COLORS, ...CRASH_FX_COLORS.map(highlight), ...SLIME_FX_COLORS, ...FEAST_FX_COLORS])
  for (const inks of Object.values(FX_INKS)) for (const c of Object.values(inks ?? {})) set.add(c.toLowerCase())
  for (const art of Object.values(ART)) {
    set.add(art.accent.toLowerCase())
    for (const c of Object.values(art.palette)) set.add(c.toLowerCase())
    for (const c of [...fxColors(art), ...(art.feast ? feastFxColors(art) : [])]) {
      set.add(c)
      set.add(highlight(c))
    }
  }
  return [...set].map(c => c.toLowerCase())
}
