# Spec: slimes as subagents (Variant A)

Status: ready for implementation · written 2026-10-16 · triage: `ready-for-agent`

Prototype: `studio/out/proto/index.html` (built by `npm run proto` in `studio/`), variant A. The five bead
patterns read back as grids live in `studio/proto/slimes.mjs`. Both are throwaway; this spec is the contract.

## Problem Statement

The Kessoku Band panel seats every subagent under a member (Nijika plans, Ryo searches and runs shells, Kita edits),
but a subagent is only a text row under her card: the task, a status word, a context percentage, a cost. When Ryo has
three searches running at once, the card is three near-identical lines, and the strip above the prompt says
"3 on stage" in dim text. Nothing shows at a glance how many acts are on stage, whose they are, which are still playing
and which have finished. The member sprites (the 96x96 figures, the portraits, the hand-drawn minis) carry the mood
of the band as a whole, not the state of each act.

The user has five slime drawings of the band (Kita, Nijika with her triangle ahoge, Ryo, Bocchi smiling with her
clips, and Bocchi with her eyes open) and wants them in the mod in a way that means something.

## Solution

Each subagent becomes a slime in its member's color. The slime appears at the head of the subagent's row on the
member's card, bouncing while the act runs, breathing while it waits, and asleep with a drifting `z` once it is
done. The card's name line gets a chip counting the slimes on stage. The strip above the prompt draws a row of
slimes after the four portraits (or minis), one a live subagent, so "how many, whose, still playing?" reads as a
picture. The members themselves (figures, portraits, minis, moods, timelines) do not change.

The slimes are drawn in the studio like every other part of the art: palette grids in each member's folder, a
mood-style timeline a state, rendered by Remotion and exported into the mod's generated sprite table, played by the
mod's own player (half-block or quadrant cells in a terminal, an animated SVG on the desktop, the editor and the
phone). Nothing is fetched or rendered at run time.

## User Stories

1. As a user watching the panel, I want each subagent row to start with a small slime in the member's color, so that I can tell whose act it is without reading the card header.
2. As a user, I want a running subagent's slime to bounce, so that I can see which acts are still playing.
3. As a user, I want a waiting or pending subagent's slime to sit still and breathe, so that a stalled act looks different from a running one.
4. As a user, I want a finished subagent's slime to be asleep with a `z` drifting up, so that done work reads as resting, not as an error.
5. As a user, I want a failed or killed subagent's slime to be asleep too, with the row's red status text telling me why, so that the art never contradicts the status word.
6. As a user, I want a chip on the member's name line counting the slimes on stage, so that a card with four rows still tells me the number at a glance.
7. As a user, I want Bocchi's own slime (the main loop is never a slime) to stay as she is: her figure, her portrait, her mini, so that the band's lead is not demoted to an act.
8. As a user of the desktop app, I want the slimes as animated SVGs at one CSS pixel a pixel beside the row text, so that they match the density of the figures on the cards.
9. As a user of the phone app or the editor, I want the same SVG slimes in the pane, so that every remote surface shows the acts the same way.
10. As a terminal user with a tall panel (the heads drawn in half blocks), I want a quadrant-cell slime beside each subagent's two rows, so that the terminal gets the picture where it has room.
11. As a terminal user with a short panel (the heads in quadrants or dropped), I want a colored glyph at the row's head instead of a slime, so that the card never grows a row to fit a picture.
12. As a user, I want the strip above the prompt to show a row of slimes after the portraits, one a live subagent, so that I see the acts without opening the panel.
13. As a user, I want the strip's slime row to keep a just-finished act's sleeping slime for half a minute, then let it go, so that I notice an act ending without the row growing forever.
14. As a user, I want the strip to cap its slime row at six and say `+n` beyond, so that a burst of subagents does not push the band's line off the strip.
15. As a user, I want the strip's dim line to read "4 slimes on stage (3 playing, 1 waiting)", so that the words and the picture agree.
16. As a terminal user with a strip of seven or more rows, I want the slimes drawn as a quadrant raster under the minis, so that the terminal strip shows them where it can.
17. As a terminal user with a short strip, I want the strip to fall back to the count in words, so that nothing is cut.
18. As a user who chose the kaomoji art style, I want no slimes anywhere and the text rows as today, so that the art style setting means what it says.
19. As a user who runs `/bocchi demo`, I want the sample acts to show slimes in every state (running, waiting, done), so that I can see the feature without spawning anything.
20. As a user, I want the sprite clock to repaint the terminal's slime rasters in place with blit, like the minis, so that the slimes animate without redrawing the pane.
21. As a user, I want the slime row and the card slimes to be one picture each (one Raster or one Svg per site), so that the pane stays cheap to draw.
22. As a user, I want every slime drawing to fit the Svg element's limit, so that a card never falls back to the engine's own drawing.
23. As a user on a light theme, I want the slimes drawn over the light background without a dark halo, so that the terminal's quadrant encoding never hides a drawn pixel.
24. As a user, I want the alt text of every slime picture to name the member and the state, so that a screen reader and the tests read it.
25. As an artist editing the studio, I want each member's slime as a part file in her folder with her own palette, so that the slime is drawn in the same hand as her figure.
26. As an artist, I want Bocchi's slime to have two faces, eyes open (awake) and eyes shut in a smile (content), and the other three their smiling face from the bead patterns, so that the five drawings are all used.
27. As an artist, I want `npm run check` to validate the slime grids (size, palette keys, the two Bocchi faces the same body), so that a broken grid never reaches a render.
28. As an artist, I want `node scripts/sheet.mjs` to include the slime states and frames on the contact sheet, so that I can review the loops.
29. As an artist, I want `node scripts/svg.mjs` and `node scripts/terminal.mjs` to preview the slimes as the desktop and the terminal draw them, so that both encodings are checked before export.
30. As an artist, I want the three slime timelines (active, idle, asleep) written as keys with holds like the moods, so that the timing follows the animation brief.
31. As an artist, I want the slimes' loops on the same clock as the members' loops, so that the strip's heads and slimes share one tick.
32. As a maintainer, I want the exporter to write the slimes into the generated sprite table under ids the player can resolve by member, state and view, so that the mod needs no second table.
33. As a maintainer, I want a `slime` view and a `slime-mini` view beside `full`, `portrait` and `mini`, so that the player's size lookup and composition work unchanged.
34. As a maintainer, I want the slime mini to be the slime halved by the existing downscale, so that no new hand-drawn art is needed for the terminal in this release.
35. As a maintainer, I want the state of a slime derived from the agent record's status by one pure function, so that it is tested directly and used by both the card and the strip.
36. As a maintainer, I want the plugin tests to mount the pane and the strip on the terminal and the desktop and find the slime pictures by key, so that the feature is tested at the surface the engine draws.
37. As a maintainer, I want `claude plugin validate`, `claude plugin test` and the type check to pass, so that the mod loads as before.
38. As a reader of the README, I want the pixel-art row and the panel row to mention the slimes, so that the table of pieces stays true.

## Implementation Decisions

### Vocabulary

- A **slime** is a member's chibi blob form. It stands for a **subagent** (an act on stage), never for the main loop.
- A slime has a **state**: `active` (the act runs), `idle` (pending or waiting), `asleep` (completed, failed or killed). The state is derived from the agent record's status by one pure function in the band module; failed and killed are asleep in the art and red in the words.
- A slime has a **view**: `slime` (the canvas size, for remote surfaces and the terminal's half blocks) and `slime-mini` (the canvas halved, for the terminal's quadrants). These join the existing views `full`, `portrait` and `mini`; the player's size lookup, `spriteId`, composition, cell encoding and the SVG writer take them unchanged.

### Art (the studio)

- One part file a member, `slime`, in her folder, in her palette: the body in her hair's ramp (base, a shadow row along the bottom and the shadowed side, a glint on the lit side, per the art brief's hue-shifting rule), the outline in the near-black every member shares, Bocchi's clips in their own colors, the eye whites in the shared white. The bead colors in the prototype are placeholders.
- The **slime canvas** is one size for all members, wide enough for Bocchi's awake drawing and tall enough for Nijika's ahoge; the body is bottom-aligned and horizontally centred so the squash and stretch keep the feet planted. The canvas is a new constant beside the figure, portrait and mini sizes, and both its dimensions are even, so the quadrant encoding and the halving are exact.
- Faces: Kita, Nijika and Ryo keep the smiling shut eyes from the bead patterns in every state. Bocchi's slime has two grids: `awake` (eyes open, used in the active state) and `content` (eyes shut, used idle and asleep). The art type gains an optional `slime` member art: a content grid and an optional awake grid; the check script requires the two Bocchi grids to differ only in the face region.
- The slime mini is `downscale2` of the slime, as a portrait halves into a mini for a member without a hand-drawn rig. Hand-drawn slime minis are out of scope.
- Three **timelines** in a new animation module beside the moods, keys with holds at the mod's 10 frames a second, one loop length shared by the four members, beats staggered per member as the moods do:
  - `active`: a bounce (squash 1 on the floor, a stretch and a one-pixel hop, a landing squash) with a long hold between; Bocchi's eyes open throughout.
  - `idle`: a slow breath (squash 1 every two to three seconds), nothing else.
  - `asleep`: a slower breath and a `z` glyph from the pixel font drifting up and fading on the member's open side, drawn inside the canvas in both views.
- Squash and stretch for the slime are a canvas-wide row scaling about the bottom row (a blob has no bend row); the melt helper is not reused.
- Compositions: one per member, state and view, as the moods have; the exporter's id pattern admits `<member>-slime-<state>` and `<member>-slime-<state>-mini`; the sheet, SVG and terminal preview scripts include them; the showcase does not.
- The check script validates: grids inside the canvas, palette keys defined, no `_` outside overlays, Bocchi's two faces on one body.

### The mod (the hooks module)

- The generated sprite table carries the slimes under the ids above; `spriteId` accepts a slime state where it takes a mood when the view is a slime view. The state type is declared in the mod's type contract beside the mood.
- **Cards.** A subagent row begins with the act's slime: on a remote surface an animated Svg at one CSS pixel a pixel (view `slime`, scale 1) keyed by the act's id; in a terminal a quadrant Raster of the slime mini keyed the same way, drawn only while the panel draws the heads in half blocks (the tall layout), else a one-cell glyph in the member's color. A completed act's row keeps its sleeping slime for as long as the card lists it. The name line gets a chip with the number of live acts (`n on stage`) when it is above zero.
- **Strip.** After the heads picture, one picture of the live acts' slimes: on a remote surface an Svg composed of slime parts side by side, two pixels apart; in a terminal a quadrant Raster of slime-mini parts under the minis, drawn when the band has at least seven rows, else nothing. At most six slimes, then a `+n` Text. An act stays in the strip's row for thirty seconds after it ends, asleep, then leaves (the strip redraws on the sprite clock, so no extra timer). The dim line reads `n slimes on stage (a playing, b waiting)`; with none it reads as today.
- **Keys and blits.** Every slime picture is one Raster or one Svg; the terminal's are repainted by the sprite clock's blit like the minis, parked when a repaint is refused, released when the pane closes.
- **Alt text** names each slime: `Ryo's act, active` or `Kita's act, asleep`; the strip's alt lists them.
- **Settings.** The character art option decides: `sprites` draws slimes, `kaomoji` draws none and keeps today's rows. No new option.
- **Demo.** `/bocchi demo` seats acts in all three states so every slime state shows.
- **Light theme.** The quadrant encoder's rule (never hide a drawn pixel in the background slot) covers the slimes unchanged.
- Nothing changes in how acts are assigned to members, in the toasts, the status line, the moods or the member timelines.

### State and data

- No new state keys: the agent list already holds status, member and times; the strip's thirty-second tail is computed from `endedAt` and the clock while drawing.
- The sprite table's generated file grows by the slime loops; the SVG writer's frame layering keeps each drawing under the Svg limit, merging frames if a drawing would run over, as it does for the figures.

## Testing Decisions

- **The seam.** One seam, the highest the mod has: the plugin test harness mounts a surface (`$.ui.mount` for `Pane` and `AbovePrompt` on `terminal` and `desktop`) after `/bocchi demo` and reads the tree the mod drew, finding elements by type and key and comparing a Raster's cells to the player's own encoding of the same parts at the same clock, as the existing sprite test does. No test reads the module's internals.
- **A good test** states what the person sees: a card row begins with a Raster or Svg keyed by the act's id; a running act's picture differs between two clock ticks and an idle act's does not; the strip's picture holds one part per live act and none past the tail; the chip and the dim line say the numbers; kaomoji mode draws none; a short terminal panel draws the glyph, not a Raster.
- **Pure parts tested directly** (prior art: the `sprites:` tests and the small-helper test): the status-to-state function, `spriteId` and `viewSize` for the slime views, every member having every state in both views in the generated table, every slime drawing under the Svg limit, the slime mini being the slime halved.
- **Studio checks**: `npm run check` covers the slime grids; the exporter's id pattern is asserted by exporting to a scratch table in a test of the studio scripts if one exists, else by the plugin test reading the table.
- The README's claims are tested where the existing tests test them (the panel and strip draw on both surfaces).

## Out of Scope

- Variant B (slimes as a third art style, the sleeping band, the narrow tile layout) and Variant C (slime meters in the strip).
- A seventh mood, idle-time sleeping, cache-cold sleeping, or any change to the member timelines.
- Hand-drawn slime minis for the terminal, and slimes in the terminal's short panel or short strip beyond the glyph and the count.
- An entrance animation when an act spawns (the loops run from one shared clock), and sounds.
- Slimes for linked sessions, peers or the main loop.
- Changes to toasts, the status line, Blast Radius, Cache Tax, Reflect, Replay or the filetree.

## Further Notes

- The bead patterns are 27x18 (Kita, Ryo), 27x24 (Nijika), 29x18 (Bocchi content) and 34x15 (Bocchi awake) beads; the prototype reads them back one bead a pixel. Bocchi's two drawings differ in body shape as well as face; the art pass should redraw her awake face onto the content body so one canvas and one timeline serve both.
- The prototype page shows the intended look on the desktop (figures beside slimes at one CSS pixel a pixel) and the bounce, breathe and doze motions as CSS animations; the studio timelines should match their feel, not their mechanism.
- The terminal budget is tight: a slime mini in quadrants is about half the width of a member's mini. If the halved art reads badly, drop the terminal card slime to the glyph in this release and keep the strip row; the spec allows either.
- When the prototype has served, move `studio/proto/` and the `proto` script to a scratch branch and out of `develop`.
