// Kita (Ikuyo Kita), vocals and rhythm guitar: crimson hair to the shoulders,
// the ends flipping out, a small side tail up on the viewer's RIGHT; bright
// yellow-green eyes and a sparkling smile; a camel cardigan over a cream sailor
// collar and a red bow, Bocchi's charcoal Shuka skirt, white loose socks, brown
// loafers; a Pelham Blue Les Paul Junior double-cut with a black guard.
// reference/character-notes.md has her colors and cues.
//
// v2: her stand (stand.ts) and palette (palette.ts) are drawn at the
// reference's density on REF_STAND's body, so her face geometry is Bocchi's:
// the head and hair rows 18-40, the eyes' lid rows 31-32 (near eye cols 43-48,
// its lashes winging up and out at 43,31, far eye 53-55), the open smile rows
// 38-39 (cols 47-50) on REF's mouth row 39 as the jaw; the side tail cols
// 57-64 rows 18-25, its pointed tip 62-63,18, tied at 57-58,23-25 (col 65 free
// for sway.R). Her face box is Bocchi's, 16x10 at 42,30, and her portrait
// window Bocchi's, 32x32 at 34,16: both eyes, the mouth, the hair top and the
// whole side tail inside it. The guitar sits one row higher than Bocchi's; the
// knees (bend) row 72, the soles row 93.
//
// Assembled here from her part files (one per pose or overlay set: see
// ../../parts.ts); each artist edits only her own part.
//
// THE STAND'S POLISH, CARRIED (a bridge): the senior review's fixes to the
// stand (stand.ts; see its header) touch pixels that crouch, cheer, panic,
// box, the faces, the box's blink peek and the sway overlays copy from the
// old stand. Each touch below is one stand pixel, in the stand's coordinates:
// the character the old stand had and the polished one. `polished` lays a
// part's touches on it, moved by the part's offset (the crouch's head drop,
// the box's head move), only if the part still holds every old character
// there: a part drawn as a copy of the old stand takes the polish, a part
// redrawn since is left exactly as its artist drew it. Once each part is
// rebuilt on the polished stand its touches stop matching and this does
// nothing; then delete its entry.

import { memberPalette } from '../../parts'
import type { FaceName, Grid, HeadOffset, MemberArt, Overlay, Point, PoseDef } from '../../types'
import * as box from './box'
import * as cheer from './cheer'
import * as crouch from './crouch'
import * as faces from './faces'
import * as mini from './mini'
import * as palette from './palette'
import * as panic from './panic'
import * as play from './play'
import * as slime from './slime'
import * as stand from './stand'
import * as sway from './sway'

const { palette: merged, colorSources } = memberPalette({ palette, stand, play, crouch, cheer, panic, box, faces, sway, mini, slime })

/** One pixel of the stand's polish, at x, y on the stand: the old stand's character there, and the polished one. */
type Touch = readonly [x: number, y: number, was: string, now: string]

/** The side tail's tip sharpened to a point (62-63,18) and its split outlined (63,20). */
const TAIL: readonly Touch[] = [[61, 18, 'p', '.'], [61, 19, 'H', 'p'], [63, 19, 'h', 'H'], [63, 20, 'v', 'p']]
/** The skin gap in the bangs over the near lid closed. */
const BANGS: readonly Touch[] = [[46, 30, 's', 'h'], [47, 30, 's', 'h']]
/** The near eye's outer corner: the lashes wing up and out at 43,31 in place of the anxious droop (43,32-33). */
const WING: readonly Touch[] = [[43, 31, 'h', 'n'], [43, 32, 'n', 's'], [43, 33, 'n', 's']]
/** One pupil pixel in the near iris's top row (W M E E). */
const PUPIL: readonly Touch[] = [[47, 33, 'M', 'E']]
const HEAD: readonly Touch[] = [...TAIL, ...BANGS, ...WING, ...PUPIL]
/** The collar's stripe made one run (40-42,43 over 38-39,44); the cardigan's shoulder line out of the near lock. */
const COLLAR: readonly Touch[] = [[37, 42, 'P', 'h'], [40, 43, 'w', 'o']]
/** The far lock rests on the neck's outline with one line, not two. */
const FAR_LOCK: readonly Touch[] = [[58, 45, 'p', 'r'], [59, 45, 'p', 'r']]
/** The upper cutaway's shade one run (53-54,48 / 51-52,49). */
const HORN: readonly Touch[] = [[53, 48, 'A', 'i'], [51, 49, 'A', 'i']]
/** The lower horn's tip off the neck (a58,52 under its own outline 58,51), the far forearm in the V. */
const LOW_HORN: readonly Touch[] = [[58, 51, 'a', 'o'], [59, 51, 'o', 'J']]
/** The guitar's left edge up behind the elbow, closing the silhouette's nick. */
const ELBOW: readonly Touch[] = [[34, 52, '.', 'o']]

/**
 * `grid` (its top-left at `at` on the canvas) with `touches` laid on it,
 * moved by `by`, when it still holds every touch's old character; else
 * `grid` as it is.
 */
function polished(grid: Grid, touches: readonly Touch[], at: Point = { x: 0, y: 0 }, by: HeadOffset = { dx: 0, dy: 0 }): Grid {
  const rows = grid.map(row => [...row])
  for (const [x, y, was] of touches) if (rows[y + by.dy - at.y]?.[x + by.dx - at.x] !== was) return grid
  for (const [x, y, , now] of touches) {
    const row = rows[y + by.dy - at.y]
    if (row !== undefined) row[x + by.dx - at.x] = now
  }
  return rows.map(row => row.join(''))
}

/** A whole-grid pose polished; a patched pose takes the polish from the pose it is laid on. */
function polishedPose(def: PoseDef, touches: readonly Touch[], by?: HeadOffset): PoseDef {
  return 'from' in def ? def : polished(def, touches, undefined, by)
}

/** Where the box carries the head: its window from stand's. */
const BOX_HEAD: HeadOffset = { dx: box.boxHead.x - stand.head.x, dy: box.boxHead.y - stand.head.y }

/** The faces whose near lid is the stand's (open eyes) take the wing; the shut and lowered lids keep their own corners. */
const FACE_TOUCHES: Readonly<Record<FaceName, readonly Touch[]>> = {
  idle: [...BANGS, ...WING, ...PUPIL],
  half: BANGS,
  blink: BANGS,
  glance: [...BANGS, ...WING],
  focus: [...BANGS, ...WING],
  happy: BANGS,
  panic: [...BANGS, ...WING],
  melt: BANGS,
}
const faceGrids = {} as Record<FaceName, Grid>
for (const name of Object.keys(FACE_TOUCHES) as FaceName[]) faceGrids[name] = polished(faces.face.grids[name], FACE_TOUCHES[name], faces.face)
const face: Overlay<FaceName> = { ...faces.face, grids: faceGrids }

/**
 * The box's blink peek kept as drawn over the polished box head: hair over
 * the wing (43,31) and its own lash flick (43,33), in stand's coordinates.
 */
const peek: typeof box.peek = {
  ...box.peek,
  grids: { ...box.peek.grids, peekBlink: polished(box.peek.grids.peekBlink, [[43, 31, '.', 'h'], [43, 33, '.', 'n']], box.peek, BOX_HEAD) },
}

/** The sway overlays redrawn for the pointed tail tip and the outlined split: L its tip 61-62,18, R its tip 63-64,18 and split 64,20. */
const swayL = sway.sway.L
const swayR = sway.sway.R
const swayed: typeof sway.sway = {
  L: { ...swayL, grid: polished(swayL.grid, [[60, 18, 'p', '.'], [61, 18, '.', 'p'], [60, 19, 'H', '.'], [61, 19, '.', 'H'], [62, 19, 'h', '.']], swayL) },
  R: { ...swayR, grid: polished(swayR.grid, [[62, 18, '.', '_'], [62, 19, '.', 'p'], [64, 19, 'h', 'H'], [64, 20, 'v', 'p']], swayR) },
}

export const kita: MemberArt = {
  id: 'kita',
  name: 'Kita',
  accent: '#ff8a65',
  palette: merged,
  colorSources,
  poses: {
    stand: stand.stand,
    playA: play.playA,
    playB: play.playB,
    crouch: polishedPose(crouch.crouch, [...HEAD, ...COLLAR, ...FAR_LOCK, ...HORN, ...LOW_HORN, ...ELBOW], crouch.crouchHead),
    // the far arm is up: the cardigan's side (k) shows in the lower cutaway's V
    cheer: polishedPose(cheer.cheer, [...HEAD, ...COLLAR, ...FAR_LOCK, ...HORN, [58, 51, 'a', 'o'], [59, 51, 'o', 'k']]),
    panic: polishedPose(panic.panic, HEAD),
    // the peeks draw the pupils, so the box head keeps its own
    box: polishedPose(box.box, [...TAIL, ...BANGS, ...WING], BOX_HEAD),
  },
  heads: { crouch: crouch.crouchHead },
  face,
  peek,
  sway: swayed,
  bend: stand.bend,
  head: stand.head,
  boxHead: box.boxHead,
  mini: mini.mini,
  slime: slime.slime,
}
