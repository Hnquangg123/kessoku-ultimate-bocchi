// Bocchi's palette: the reference's own 41 colors (reference/bocchi-reference.grid.ts,
// REF_PALETTE, each named there for what it paints) and the shared cardboard box's.
// One character a color; a part that needs a color of its own exports `colors`
// (see ../../parts.ts).

import { REF_PALETTE } from '../../../../reference/bocchi-reference.grid'
import type { Palette } from '../../types'

export const palette: Palette = {
  ...REF_PALETTE,
  X: '#c99a5b', // box cardboard (shared)
  T: '#e2b778', // box light flap and top edge (shared)
  U: '#8f6a3a', // box shade (shared)
  V: '#6e4f2a', // box deep shade (shared)
}
