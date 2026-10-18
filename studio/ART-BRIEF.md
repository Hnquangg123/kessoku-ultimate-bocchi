# Kessoku Band sprites: the art brief (v2, hi-res)

The four members of Kessoku Band (*Bocchi the Rock!*) as animated pixel-art sprites, drawn as
palette grids in `src/art/members/`, animated by the mood timelines in `src/anim/moods.ts`,
rendered by Remotion and exported by `scripts/sprites.mjs` to the mod, which plays them in the
Kessoku Band panel, the band strip above the prompt and the guard screens: as an animated SVG
on the desktop, the editor and the phone, as half-block or quadrant cells in a terminal.

## The target

`reference/bocchi-reference.jpg` is the style target, and since v2 it is also **the art itself**:
the JPEG is a 100x100 pixel-art canvas (14.4 screen pixels a pixel), read back cell by cell into
`reference/bocchi-reference.grid.ts`. `REF_STAND` there is Bocchi's `stand` pose on our canvas,
pixel for pixel. Everything else (her other poses, her faces, the other three members) is drawn
**at the same pixel density, in the same hand**:

- A full figure about 76 pixels tall, ~2.8 heads: head and hair rows 18-40, torso 39-62, skirt to
  69, legs 66-87, shoes 87-93. Not the squat chibi of v1: long legs in a wide, planted stance.
- Three-quarter view facing the viewer's right, the instrument held across the body, its neck
  rising to the upper right; the fretting hand on the neck, the picking hand over the strings.
- Outlines: a 1-pixel line, never doubled. The lower body, the instrument and the shoes take the
  near-black `o #2e222e`; hair and the jacket take a dark tint of their own color (Bocchi's plum
  `p #542549`); eyes and the blue clip a navy `n #292847`. Inner lines (folds, strands, the
  zipper) are a darker tone of the local color, not the outline color.
- Ramps of 3-4 tones a material with hue shifting (shadows cooler and more saturated, lights
  warmer and paler): hair `H` light, `h` base, `r` shadow; skin `s`, `S`; the jacket `j`, `J`, `k`,
  `K`; the skirt and socks `g`, `G`. Light comes from the upper right (the hair's light band is
  on her right side and crown; the skirt's pleats catch it on their right faces).
- Clean pixel clusters: no pillow shading, no lone noise pixels, no jaggies on curves (stair
  steps grow and shrink evenly: 1-1-2-3, never 1-3-1-2), selective outlining where light hits.
- Big readable eyes (about 4-5 wide, 3-4 tall) with a dark upper lid line, an iris in two tones,
  a light glint; a small mouth; the cheeks soft and pale.

Look at the reference at full size before drawing anything, and again after.

## The canvas and its windows (see `src/art/types.ts`)

| thing | size | what it is |
| --- | --- | --- |
| full figure | 96x96 | the whole member; soles on row 93, rows 94-95 empty; rows 0-17 are headroom for a jump, the ahoge and the effects |
| portrait | 32x32 | a window over the head (`head: {x, y}` on the stand pose): both eyes, the mouth, the hair top and the identifying accessory (Bocchi's clips, Nijika's triangle ahoge, Ryo's clip, Kita's side tail) |
| mini | 16x16 | a hand-drawn head for the terminal (see "The minis"); `downscale2` of the portrait only where a member has none |
| slime | 36x24 | her blob form, one an act on stage (a subagent), on a canvas of its own (see "The slimes"); its mini 18x12 is the slime halved |
| crash | 96x32 | Bocchi's guitar dropping onto the stage, for Blast Radius; and its 48x16 mini |

The terminal draws the mini in half blocks (16x8 cells, v1's footprint) or quadrants (8x4
cells); the desktop draws an SVG at one CSS pixel a pixel (the full figure, the 32x32 portrait).

## The format

```ts
export const bocchi: MemberArt = {
  id: 'bocchi', name: 'Bocchi', accent: '#f7a8c9',
  palette: { o: '#2e222e', p: '#542549', h: '#eba2b3', ... },  // one character a color; see below
  poses: {
    stand: [ ...96 rows of 96 characters... ],                    // a full grid
    playA: { from: 'stand', patches: [{ x: 38, y: 50, grid: [...] }] }, // or a pose with patches on another
    ...
  },
  heads: { crouch: { dx: 0, dy: 3 } },  // where a pose carries the head, from stand's (absent: 0,0)
  face: { x, y, grids: { idle, blink, half, glance, focus, happy, panic, melt } },
  peek: { x, y, grids: { peekL, peekR, peekBlink } },
  sway: { L: { x, y, grid }, R: { x, y, grid } },  // the hair's free ends a step left / right
  bend: 72,               // the row the figure bends at for a breath or a bob (see Squash)
  head: { x, y },         // the 32x32 portrait window on the stand pose
  boxHead: { x, y },      // the same window on the box pose
  mini: { stand, box, face: { x, y, grids }, peek: { x, y, grids } },  // the 16x16 mini rig (see The minis)
  slime: { content, awake, face: { x, y, w, h } },  // her slime (see The slimes); awake and face Bocchi's only
  tips: { playA: { x, y }, playB: { x, y } },  // Nijika only: where the striking stick's tip is
  extras: { guitarFlat, guitarTilt },  // Bocchi only
}
```

Each member is a folder, `src/art/members/<member>/`, one file a part, so several artists draw
at once without touching each other's files; its `index.ts` assembles the `MemberArt` above:

| file | exports |
| --- | --- |
| `palette.ts` | `palette` |
| `stand.ts` | `stand`, `head` (the portrait window), `bend` |
| `play.ts` | `playA`, `playB` (Nijika also `tips`) |
| `crouch.ts` | `crouch`, `crouchHead` (its head offset) |
| `cheer.ts`, `panic.ts` | `cheer`, `panic` |
| `box.ts` | `box`, `peek`, `boxHead` |
| `faces.ts` | `face` |
| `sway.ts` | `sway` |
| `mini.ts` | `mini` |
| `slime.ts` | `slime` |
| `extras.ts` | `guitarFlat`, `guitarTilt` (Bocchi only) |

Any part may also export `colors`, palette entries of its own; `index.ts` merges them into the
palette (`memberPalette` in `src/art/parts.ts`). A key two files define with the same color is
fine; with different colors `checkArt` reports it (the first, palette.ts's, wins).

- Palette characters: one character each, anything but `.`, `_`, `=`, a digit, a quote, a
  backslash or a backtick. Colors as `#rrggbb`. A member may use up to about 44 colors (Bocchi's
  reference has 41); the export maps the whole band onto its own alphabet.
- In a full grid `.` is transparent. In a patch, a face, a peek or a sway overlay `.` keeps the
  pixel beneath and `_` **erases** it (back to transparent): that is how an arm that moves away
  leaves no ghost.
- A pose given as `{ from, patches }` is `from`'s grid with each patch laid over it in order;
  `from` may itself be patched (no cycles). Patches keep the art small and keep the head
  identical; draw a whole new grid only where most of the body changes (cheer, panic, box).
- **The head is pixel-identical** in every pose but the box, at `face` shifted by the pose's
  `heads` offset (stand, playA, playB, cheer, panic: offset 0; crouch: lower). `checkArt` holds
  the region under the face overlay to stand's. Hair below the head (the long back hair, a
  ponytail) may change with the pose.

## The poses

| pose | what it shows |
| --- | --- |
| `stand` | idle and ready: the instrument across the body, picking hand on the strings (Bocchi: `REF_STAND`) |
| `playA` | the strum's upstroke: picking hand and forearm raised above the strings, the wrist cocked |
| `playB` | the downstroke's follow-through: the hand swept below the strings, the elbow out |
| `crouch` | anticipation and landing: knees bent, the upper body 3 rows lower (`heads.crouch = {dx: 0, dy: 3}`), the instrument riding with the body |
| `cheer` | the top of a happy jump: both fists up, the instrument hanging on its strap against the body, one foot kicked back |
| `panic` | arms flung out wide, shoulders up to the ears, knees knocked together, the instrument sliding askew |
| `box` | hiding in a cardboard box: the hair top, the accessory and the eyes over the rim |

Nijika plays drums: her `stand` holds both sticks crossed low before her, `playA` the right stick
raised high with the left low, `playB` the reverse (the stick tips swing ~8 rows); her cheer
raises the sticks. Everyone else holds a guitar or bass like the reference.

The box is the same for everyone and drawn like the reference's materials: cardboard
`#c99a5b`, the light flap and top edge `#e2b778`, shade `#8f6a3a`, deep shade `#6e4f2a`, outlined in
`o`; about columns 22-74, rows 56-93, open flaps; the head over the rim from about row 40.

## The faces (overlays at `face`, about 16x10, `.` keeps the head beneath)

| face | what it shows |
| --- | --- |
| `idle` | her resting look (Bocchi: the reference's shy look; Nijika: a bright open smile; Ryo: deadpan, heavy lids; Kita: sparkly eyes, a confident smile) |
| `half` | the eyes half shut: the in-between of a blink, and Ryo's sleepy look |
| `blink` | eyes closed: a curved lid line |
| `glance` | the eyes slid aside (Bocchi: nervously away to the viewer's left) |
| `focus` | playing: narrowed eyes, a set mouth |
| `happy` | closed happy eyes (^ ^), an open smile, a hint of blush |
| `panic` | white blank eyes or tiny pupils, a wavy mouth, blue under the eyes |
| `melt` | droopy defeated eyes, the mouth slack |

`peekL`, `peekR`: the eyes over the box rim looking left and right. `peekBlink`: closed.

## Secondary motion

- **Sway**: `sway.L` and `sway.R` are overlays that move the free ends of the hair (Bocchi's long
  back hair below the shoulders; Nijika's ponytail; Ryo's bob tips; Kita's side tail) one step
  left or right, erasing (`_`) the old ends. They are drawn on the stand pose and must fit stand,
  playA and playB (the hair there is the same).
- **Squash**: a key's `squash: n` moves every row above `bend` down `n` rows (1 or 2), the rows at
  and below it staying planted: a breath, a bob on the beat, the settle after a landing. The face
  and the portrait window ride with it. `bend` is the knee row, about 72.
- **Head offset**: `heads[pose]` moves where the face overlay and the portrait window sit.

## The members (the same body, the same stance, the same hand; their own hair, face, clothes, instrument)

The four should read as one set, like a character-select screen: same height (soles on row 93,
hair top near row 18 give or take a hairstyle), the same wide stance and leg drawing (the legs,
socks and shoes of `REF_STAND`, recolored), the same skirt shape and pleats, the same arm and hand
drawing; the same outline and ramp rules.

- **Bocchi** (Hitori Gotoh), lead guitar: `REF_STAND` as drawn. Very long pink hair flowing
  behind her to below the waist, the ahoge, the blue and yellow cube clips on the viewer's left,
  blue eyes under heavy bangs, the pink track jacket with white zipper and stripes, a dark
  grey-purple pleated skirt, dark socks, brown shoes; a black Les Paul with gold binding.
  Extras: `guitarFlat` (her guitar lying flat, about 44x14) and `guitarTilt` (falling at a steep
  angle, about 34x30), drawn from the reference's guitar, for the crash.
- **Nijika** (Nijika Ijichi), drums: long warm-golden-blonde hair gathered in one long side
  ponytail high on the viewer's right (a hair-yellow scrunchie), the flat triangular ahoge on
  top ("the Dorito"), choppy side-swept bangs, red-orange eyes, a big toothy grin; a white shirt
  under a dark grey V-neck sweater vest, a big red bow with pink polka dots, a navy pleated skirt,
  bare legs, white short socks, red sneakers with white soles; light natural-wood drumsticks.
- **Ryo** (Ryo Yamada), bass: a short asymmetric cobalt-blue bob (longer and flipped out on the
  viewer's left, tucked behind the ear on the right), a lock over the near eye, two dark bar
  hairpins on the viewer's left, lemon-yellow eyes under heavy flat lids, a mole under the far
  eye, deadpan; an oversized dark navy-charcoal V-neck sweater over a white shirt with a thin
  black string tie, a navy pleated skirt, black tights, brown loafers; an Olympic White Fender
  Precision bass with a mint-green pickguard, slung lower and longer than Bocchi's guitar, its
  neck nearly level.
- **Kita** (Ikuyo Kita), vocals and rhythm guitar: vivid crimson hair to the shoulders, the ends
  flipping out, a small side tail sticking up on the **viewer's right**, bright yellow-green eyes,
  a sparkling confident smile; a camel cardigan over a cream sailor collar (one dark stripe) with
  a red bow, the same charcoal Shuka skirt as Bocchi (`g`/`G`), bare legs, white loose socks,
  brown loafers; a Pelham Blue (light turquoise) Les Paul Junior double-cutaway with a black
  pickguard and a black P-90, held like Bocchi's.

`reference/character-notes.md` has the researched colors (official fills and sprite ramps),
details, personality cues and gags for each; where it and this brief differ, the notes win.

## The minis (hand-drawn, 16x16)

The terminal has no room for the hi-res art: it draws a member's head as a 16x16 **mini**, in
half blocks (16x8 cells) or quadrants (8x4 cells). Halving the 32x32 portrait muddies it, so each
member has a hand-drawn mini rig in the same colors, drawn for legibility at that size like v1's
heads were: `mini: { stand, box, face: { x, y, grids }, peek: { x, y, grids } }` (16x16 bases and
small overlays for every face and peek, in the mini's own coordinates 0-15, inside it). The mini
view draws `mini.box` for the box pose and `mini.stand` for every other pose, lays the frame's face
(peek) over it, melts it at half scale, moves it by the frame's `dx/2` and `dy/4` (kept within
-3..1; no squash), and adds v1's small effects (`FX_MINI`) at their portrait-window places halved.
A member without a rig falls back to the portrait halved (`downscale2`). It must read at a glance: the hair color and shape, the
accessory (Bocchi's blue-over-yellow cubes, Nijika's triangle and tail, Ryo's pins, Kita's tuft),
two clear eyes in the member's eye color, a mouth. The mini view follows the scene (its face or
peek, a melt, a jump or a shake scaled down) with v1's small effects.

## The slimes (`slime.ts`, 36x24)

Each subagent the band takes on is an act on stage, drawn as a **slime** in its member's
colors: the member's chibi blob form, from the user's five bead patterns (Kita, Nijika with her
triangle ahoge, Ryo, Bocchi smiling with her clips, Bocchi with her eyes open), read back bead for
bead. The main loop is never a slime: Bocchi stays her figure.

- One canvas for the band, **36x24** (`SLIME_W`, `SLIME_H`): wide enough for Bocchi's awake
  drawing, tall enough for Nijika's ahoge with a row above it. The grid (whole, `.`
  transparent, never `_`) is at most 36 wide and 23 tall, laid **bottom-aligned and centred**,
  so the top row is free for the bounce's stretch and hop and the feet stay planted.
- The palette is the member's own: the body in her **hair's ramp** (base `h`; a shadow `r` down
  the left side and along the scalloped bottom; a light rim `H` along the top-right curve; a
  glint of the band's white `W W` on the crown, light from the upper right), the **outline**
  the band's near-black `o` (the closed eyes and the hair's inner lines too), Bocchi's clips in
  their own ramps (blue `b C` over `B b`, yellow `Y Z` over `q`), the open eyes' whites `W`.
- Faces: Kita, Nijika and Ryo keep the bead patterns' smiling shut eyes (`> <`) in every state.
  Bocchi has two grids on **one body**: `content` (shut, smiling) and `awake` (her open-eyed
  bead pattern's face, a heavy lid two rows thick over each white eye, redrawn on the content
  body), which may differ only inside `face`, the eyes' box. `checkArt` holds them to it.
- Nijika's stem row under the ahoge is left out (the Dorito sits on her head), so her 23 rows
  leave the canvas's top row free.
- A squash or a stretch scales the blob's rows about its bottom row (`scaleRows`): the plainest
  row (the one most like the row below it) gives, so the belly takes it while the face, the
  outline and the feet hold. A slime has no `bend`.
- The **slime mini** (18x12, the terminal's: 9x3 quadrant cells) is the slime halved
  (`downscale2`), its `z` drawn again at the font's size on its own path. No hand-drawn slime
  minis: the terminal's slime is a colored blob with its eyes, its motion carrying the state.

## Effects (`src/art/fx.ts`)

Drawn at the new density (about twice v1's size: a note ~8x10, a sparkle ~9x9, a sweat drop
~5x7), each with a 1-pixel outline and a highlight: notes, beamed notes, sweat, sparkle, twinkle,
the panic bang, z's, a heart, an impact star, drips, dust, and Bocchi's **gloom lines** (three
short wavy vertical strokes in a dark violet beside her head, the anime's shorthand for her
dread). The thin black cross beside her cheek in the reference JPEG is the drawing program's
cursor caught in the screenshot, not art: never draw it. The 3x5 font is drawn at 2x for the
CRASH.

## Checking the art

```bash
npm run check                         # every member: row lengths, palette, the face region, the windows, the slime
node scripts/sheet.mjs <member>       # out/sheets/sheet-<member>.png: every pose, face and frame, the slime's too
node scripts/compare.mjs <member>     # out/compare/compare-<member>.png: her stand beside the reference, same scale
node scripts/grid.mjs <member> <pose> [x y w h]   # a pose's resolved grid with row and column rulers
node scripts/look.mjs <member> <cell...>          # cells side by side: playA+focus, box+peekL, ref, mini:stand+blink, mood:happy, crash
node scripts/onion.mjs <member> <A> <B>           # B over A, the pixels B changed, and the patch that makes A into B
node scripts/lineup.mjs                           # the reference and the four stands on one stage: one set?
```

`look`, `onion`, `lineup` and `compare` take `--out <file.png>` and `--scale N`; `look`, `onion`,
`compare` and `grid` take `--stand <module.ts>`, a candidate module exporting `{ palette, stand }`
laid over the member for that run (preview a stand without wiring it in).

Look at what you drew, at 4x or more, beside the reference, after every change. Do not run
`scripts/sprites.mjs` while drawing: it rewrites the mod's sprites.

### Aseprite files

`npm run aseprite` (or `node scripts/aseprite.mjs [member...] [--keep]`) rebuilds the band as
Aseprite sources in `out/aseprite/`, about a minute for all four: `<member>.aseprite` (96x96 rgb)
and `<member>-mini.aseprite` (16x16), one layer each, every mood's distinct frames in play order
(exported by `scripts/raw.mjs`; a run of identical mini frames is one frame holding them all),
each frame's duration, one forward tag per mood (anxious, focused, happy, panic, melting,
hiding), the palette set to the colors used. From each file: `<name>.png` + `<name>.json`, a rows
sheet with one row per mood and the tags listed, and `gif/<name>-<mood>.gif`. The script then
opens every file again and checks each frame's pixels and duration against the studio's frames;
any mismatch fails the run. `scripts/aseprite.lua` is the Aseprite half (build and verify).
Aseprite is `$ASEPRITE`, else `~/builds/aseprite-release/bin/aseprite.exe`, else `aseprite` on
the PATH. The files are made from the studio: change the art here and rebuild, not the other way.
