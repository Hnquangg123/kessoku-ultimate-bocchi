// The sprite format the band's pixel art is written in (v2, hi-res).
//
// A member is a set of 96x96 poses drawn as rows of palette characters, at the
// density of reference/bocchi-reference.jpg (Bocchi's stand IS that image).
// A pose is either a whole grid or another pose with patches laid over it, so
// the head stays pixel-identical and the art stays small. Face overlays swap
// the expression on the head without redrawing the body, peek overlays do the
// same for the cardboard box, and sway overlays move the hair's free ends.
// A hand-drawn 16x16 mini rig stands in for the head where the terminal has
// no room for the hi-res art, and a slime (her blob form, on a 36x24 canvas
// of its own) stands for each of her acts on stage, a subagent, animated by
// the slime timelines in ../anim/slimes.ts. Each member lives in its own folder,
// ./members/<member>/, one part file a pose or overlay set (see its index.ts).
// The mood timelines in ../anim/moods.ts decide which pose, face, sway and
// squash each frame shows and where it sits; Remotion renders the result and
// scripts/sprites.mjs turns the frames into the mod's hooks/lib/sprites.gen.ts.
// ART-BRIEF.md is the contract for everything here.

/** The canvas every pose is drawn on, in pixels: soles on row 93, rows 0-17 headroom. */
export const W = 96
export const H = 96
/** The portrait window that follows the head, for the small spots (the strip, the terminal's cards). */
export const PW = 32
export const PH = 32
/** The mini: a hand-drawn 16x16 head (`MemberArt.mini`) for the terminal's smallest spots; the portrait halved where a member has none. */
export const MINI = 16
/**
 * The slime canvas (`MemberArt.slime`), one size for the band: wide enough for
 * Bocchi's awake drawing, tall enough for Nijika's ahoge with a row above it
 * for the bounce. Both even (a multiple of 4 across, of 8 down), so the slime
 * halves exactly into its mini (18x12) and that into quadrant cells (9x3).
 */
export const SLIME_W = 36
export const SLIME_H = 24

/**
 * Rows of palette characters, top to bottom. `.` is transparent (in an
 * overlay: keeps the pixel beneath). In a patch, a face, a peek or a sway
 * overlay `_` erases the pixel beneath back to transparent.
 */
export type Grid = readonly string[]

/**
 * One character per color, `#rrggbb`. Reserved, never a key: `.` (transparent),
 * `_` (erase), `=` (the export's "same as the last frame"), the digits (run
 * counts), quotes, the backslash and the backtick.
 */
export type Palette = Readonly<Record<string, string>>

export type MemberId = 'bocchi' | 'nijika' | 'ryo' | 'kita'

export type Mood = 'anxious' | 'focused' | 'happy' | 'panic' | 'melting' | 'hiding'

/**
 * What a slime (one act on stage: a subagent) is doing: `active` the act runs
 * (a bounce), `idle` it is pending or waiting (a breath), `asleep` it is done,
 * failed or killed (a slow breath, a z drifting up). See ../anim/slimes.ts.
 */
export type SlimeState = 'active' | 'idle' | 'asleep'

/** A slime's face: the smiling shut eyes of the bead patterns (`content`), or Bocchi's open ones (`awake`). */
export type SlimeFace = 'content' | 'awake'

/**
 * The poses. The head is pixel-identical in every pose but the box, at the
 * face overlay's place shifted by the pose's `heads` offset (0 for all but
 * crouch), so one face overlay fits them all.
 *
 *   stand   idle and ready: the instrument across the body, picking hand on the strings
 *   playA   the strum's upstroke: the picking hand raised above the strings, wrist cocked
 *   playB   the downstroke's follow-through: the hand swept below the strings, elbow out
 *   crouch  anticipation and landing: knees bent, the upper body lower (`heads.crouch`)
 *   cheer   the top of a happy jump: both fists up, one foot kicked back
 *   panic   arms flung out, shoulders up, knees knocked, the instrument askew
 *   box     hiding in a cardboard box: the hair top, the accessory and the eyes over the rim
 */
export type PoseName = 'stand' | 'playA' | 'playB' | 'crouch' | 'cheer' | 'panic' | 'box'

/** Expressions laid over the head of every pose but the box (see ART-BRIEF.md, "The faces"). */
export type FaceName = 'idle' | 'half' | 'blink' | 'glance' | 'focus' | 'happy' | 'panic' | 'melt'

/** Eyes over the box's rim: looking left, looking right, blinking. */
export type PeekName = 'peekL' | 'peekR' | 'peekBlink'

/** A small grid laid at (x, y) on a canvas: `.` keeps the pixel beneath, `_` erases it. */
export type Patch = { x: number; y: number; grid: Grid }

/**
 * A pose: a whole 96x96 grid, or another pose (`from`, itself possibly
 * patched, never in a cycle) with patches laid over it in order.
 */
export type PoseDef = Grid | { from: PoseName; patches: readonly Patch[] }

/** Overlays sharing one place: each grid laid at (x, y), `.` keeping the pixel beneath, `_` erasing it. */
export type Overlay<N extends string> = {
  x: number
  y: number
  grids: Readonly<Record<N, Grid>>
}

/** How far a pose carries the head from where stand has it. */
export type HeadOffset = { dx: number; dy: number }

/** A pixel on the canvas. */
export type Point = { x: number; y: number }

/**
 * The mini rig: the member's head hand-drawn at 16x16 for the terminal (half
 * blocks or quadrants), in her own palette. `stand` is the head as every pose
 * but the box shows it (the face overlays go on it), `box` the head over the
 * box's rim (the peek overlays go on it); the overlays work like the big ones
 * (`.` keeps, `_` erases) and must sit inside the 16x16. The scene draws it
 * for the `mini` view: base, face or peek, a melt at mini scale, the move
 * scaled down (dx/2, dy/4 kept within -3..1; no squash), the small effects.
 */
export type MiniArt = {
  stand: Grid
  box: Grid
  face: Overlay<FaceName>
  peek: Overlay<PeekName>
}

/**
 * The member as a slime, her chibi blob form, drawn from the user's bead
 * patterns in her own palette: the body in her hair's ramp, the outline the
 * band's near-black. The grids are whole (`.` transparent, never `_`), no
 * larger than the slime canvas less its top row (the bounce's), and laid on
 * it bottom-aligned and centred, so a squash or a stretch keeps her planted.
 * `content` is her smiling shut eyes; `awake` (Bocchi only) the same body
 * with her eyes open, different from `content` only inside `face`.
 */
export type SlimeArt = {
  content: Grid
  awake?: Grid
  /** Where `awake` may differ from `content`: the eyes' box, in the grid's own pixels. */
  face?: { x: number; y: number; w: number; h: number }
}

export type MemberArt = {
  id: MemberId
  name: string
  /** The member's own color: her notes, sparkles and spotlight. */
  accent: string
  palette: Palette
  poses: Readonly<Record<PoseName, PoseDef>>
  /** Where a pose carries the head, from stand's (absent: 0, 0). The box ignores it (it has `boxHead`). */
  heads?: Readonly<Partial<Record<PoseName, HeadOffset>>>
  /** Over the eyes and mouth on stand (about 16x10); shifted by `heads[pose]` on the other poses. */
  face: Overlay<FaceName>
  /** Over the eyes above the box's rim. */
  peek: Overlay<PeekName>
  /** The hair's free ends a step left or right, drawn on stand; they fit stand, playA and playB. */
  sway?: Readonly<{ L: Patch; R: Patch }>
  /** The row the figure bends at for a breath or a bob: a squash lowers every row above it (the knees, about 72). */
  bend: number
  /** Top-left of the 32x32 portrait window over the head, in the stand pose. */
  head: { x: number; y: number }
  /** The same window over the box pose (it follows her eyes over the rim). */
  boxHead: { x: number; y: number }
  /** Props some scenes borrow: Bocchi's guitar for the Blast Radius crash (`guitarFlat`, `guitarTilt`). */
  extras?: Readonly<Record<string, Grid>>
  /** The hand-drawn 16x16 head for the terminal; without it the mini is the portrait halved (`downscale2`). */
  mini?: MiniArt
  /** Her slime: what each of her acts on stage (a subagent) is drawn as, on the slime canvas. */
  slime?: SlimeArt
  /**
   * Where the instrument strikes on a pose, in canvas pixels: Nijika's stick
   * tip on playA and playB. The focused mood centres its impact star there.
   */
  tips?: Readonly<Partial<Record<PoseName, Point>>>
  /**
   * Where each palette entry came from: palette.ts's `palette` and every part
   * file's `colors`, by part (set by the member's index.ts through
   * `memberPalette`), so checkArt can report a key defined twice with
   * different colors. `palette` above is already the merge.
   */
  colorSources?: Readonly<Record<string, Palette>>
}
