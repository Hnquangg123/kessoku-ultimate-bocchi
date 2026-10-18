// Assembling a member from her part files.
//
// Each member is a folder, ./members/<member>/, one file a part, so several
// artists can draw at once without touching each other's files:
//
//   palette.ts  palette                      the colors (one character each)
//   stand.ts    stand, head, bend            the stand pose, its portrait window, the knee row
//   play.ts     playA, playB (Nijika: tips)  the strum (her sticks; where they strike)
//   crouch.ts   crouch, crouchHead           the crouch and how far it carries the head
//   cheer.ts    cheer
//   panic.ts    panic
//   box.ts      box, peek, boxHead           the box pose, the eyes over its rim, its window
//   faces.ts    face                         the face overlays
//   sway.ts     sway                         the hair's free ends a step left and right
//   mini.ts     mini                         the 16x16 head for the terminal
//   slime.ts    slime                        her blob form, one an act on stage (a subagent)
//   extras.ts   guitarFlat, guitarTilt       Bocchi only: her guitar for the crash
//
// Any part may also export `colors`: palette entries of its own (a color the
// part needs that palette.ts lacks). index.ts merges them all into the
// member's palette with `memberPalette`; the same key twice with the same
// color is fine (a shared color), with different colors it is a problem
// `checkArt` reports.

import type { Palette } from './types'

/** A part file as `import * as part from './part'` sees it: its exports, among them perhaps `palette` and `colors`. */
type PartModule = object

function entries(value: unknown): Palette | undefined {
  if (value === null || typeof value !== 'object') return undefined
  return value as Palette
}

/**
 * The member's palette from her part files, in the order given: each part's
 * `palette` export (palette.ts) and `colors` export (any part). The first
 * definition of a key wins; every source is kept in `colorSources` so
 * `checkArt` can report a key defined twice with different colors.
 */
export function memberPalette(parts: Readonly<Record<string, PartModule>>): { palette: Palette; colorSources: Readonly<Record<string, Palette>> } {
  const palette: Record<string, string> = {}
  const colorSources: Record<string, Palette> = {}
  for (const [name, part] of Object.entries(parts)) {
    const own = part as { palette?: unknown; colors?: unknown }
    for (const [label, source] of [
      [`${name}.ts palette`, entries(own.palette)],
      [`${name}.ts colors`, entries(own.colors)],
    ] as const) {
      if (source === undefined) continue
      colorSources[label] = source
      for (const [key, color] of Object.entries(source)) if (!(key in palette)) palette[key] = color
    }
  }
  return { palette, colorSources }
}

/** Keys defined by more than one source with different colors, as sentences. */
export function paletteClashes(colorSources: Readonly<Record<string, Palette>>): string[] {
  const seen = new Map<string, { color: string; where: string }[]>()
  for (const [where, source] of Object.entries(colorSources)) {
    for (const [key, color] of Object.entries(source)) {
      const list = seen.get(key) ?? []
      list.push({ color: color.toLowerCase(), where })
      seen.set(key, list)
    }
  }
  const out: string[] = []
  for (const [key, list] of seen) {
    if (new Set(list.map(l => l.color)).size < 2) continue
    out.push(`palette key "${key}" is defined twice with different colors: ${list.map(l => `${l.where} ${l.color}`).join(', ')} (the first wins; pick a free character)`)
  }
  return out
}
