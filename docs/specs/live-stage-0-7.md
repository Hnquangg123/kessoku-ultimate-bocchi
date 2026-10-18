# Spec: Live Stage, the v0.7.0 release

Status: implemented · written 2026-10-19 · triage: `done`

Design brief: the throwaway before/after page `npm run proto:0.7` in `studio/` (`studio/scripts/proto-0-7.mjs`,
written to `studio/out/proto/0.7.html`), variant A "Live Stage" with its two drawings (the mixer at rest, the mixer
with Ryo on solo), its "What changes" table and the "Shared by all three" list. Like the earlier prototypes the page
lives untracked in the main checkout and is not wanted on `develop`; this spec is the record. Variants B (Setlist
Timeline) and C (Dressing Room) were not chosen; their ideas stay on the page and in the backlog.

One release about how the band looks and reads, chosen over the backlog's feature rows because the panel is the
thing a person opens: it should be a show, and it should still answer what each member is doing, what it costs and
how full her context is. Grounded in the engine's own declarations (`claude-code.d.ts` as Claude Code 2.1.299 writes
it: `Box`, `Text` and `Button` with its `hotkey`, `plain`, children and `hover`; `Svg` and `Raster` as leaves without
`onPress`; `ui.render` on `ToolUse` with `tool_use_id`, `tool` and `input`).

## Problem Statement

1. **The panel is a list.** Four cards stacked, each her figure beside a column of dim stats joined by dots. The
   figures are the point of the mod and they sit in a margin; `ctx 42%`, a cost and a role read at the same weight,
   so nothing stands out: not who is playing, not who costs what, not how full anyone's context is.
2. **The strip says the same thing twice.** Four heads, then four names under them, then a dotted sentence. What is
   playing right now, the one thing worth a glance above the prompt, is not on it.
3. **A tool row says who, not what.** `♪ Read · (¬_¬)♩ Ryo · ♪`: the tool and a face. Which call this is in the turn,
   what it touched and how long it took are the engine's row's to tell, below, in another style.
4. **A finished act is a toast.** "Ryo finished: … ≈$0.11" flies past; on the panel the act is simply dim. A wrong
   note shows for five seconds in the status line.
5. **The desk has no solo.** A member with three acts gets four truncated lines. There is no way to look at one
   member alone with every act in full.

## Solution

- **A stage.** The panel opens on the band standing on one stage: a slot a member, her spotlight (a cone in her
  color, up while she plays and down while she rests), her figure, her acts as slimes in the pit at her feet, her
  name on a tag in her color with a count of her acts on stage, and her context as a six-step meter under the tag.
  A marquee above reads `♪ KESSOKU BAND ♪`, `● ON AIR` while a turn runs, and the set number with its length.
- **A mixer.** Under the stage, the numbers: a channel a member, two channels a row (so a channel is as wide as
  today's card and a task name fits), each with a VU of her share of the session's spend, her name line (a button),
  and one entry an act: the act's name with its cost at the right edge, then `ctx ▰▰▱▱▱▱ 18%`. Under the console,
  one labelled rail for the session (`CTX · PLAN · GATE · AMP`) in place of the dotted sentence.
- **Solo.** Her hotkey (`b n r k`), Tab to her name line and Enter, a click on it, or `/bocchi solo <member>` opens
  her channel across the whole console with every act in full (name, type, status, a ten-step context meter, tokens,
  cost, when it started or ended, a tally of the tools it used and the tool in its hands now) and her figure beside;
  the other three fold to one strip each; on the stage only her spotlight stays up. The same key, `m`, a second
  press or `/bocchi solo off` returns to the mix. An act's number under her slimes solos her with that act first.
  With the `autoSolo` option on, a member who takes a new act is soloed for ten seconds.
- **Encore.** An act that just ended holds its line for eight seconds in her color, bold: `✓ encore! · 2m 40s ·
  ≈$0.11` (a failed one: `✖ wrong note · <reason>` in red), then settles dim. The last wrong note stays on the rail.
- **The strip** reads `● ON AIR` and `NOW PLAYING · Ryo · Look into why the strip flickers on resize · 48s` (the
  newest running act; Bocchi and the set's task when none; "backstage" between turns) over the heads and the slimes.
- **Tool rows** are tracks: `♪ 03 · Ryo · Read · hooks/register.tsx · 2s`, the member's name on a tag in her color,
  the track number counting the turn's calls, the target as the task line already describes it, the duration once
  it ends. The memo card gets a backstage-pass stripe in Nijika's yellow and a `BAND MEMO` tag.
- **One language**, whichever drawing: a member's name on her color wherever she is named; `▰▱` for every meter;
  labelled figures with the number first; a member who plays bright and one who rests dim; durations at the right.

## User Stories

1. As a user who opens the panel, I want to see the four members on one stage with a spotlight up on each one who is playing, so that who is working reads before any number does.
2. As a user, I want each member's subagents at her feet as slimes, bouncing while they run and asleep once they end, so that the stage shows the acts the way the cards did.
3. As a user, I want her name on a tag in her color with the count of her acts on stage, and her context as a meter under it, so that the two figures I check most are under her feet.
4. As a user, I want the mixer's channels two a row, each showing the full name of every act with its cost at the right and its own context meter beneath, so that no task name is cut in the normal case.
5. As a user, I want a VU of her share of the session's spend beside each channel, so that who costs what reads at a glance.
6. As a user, I want the session's context, plan window, cost and cache warmth on one rail with labels, so that I never read a dotted sentence for them again.
7. As a user, I want to press her hotkey, Tab to her name and press Enter, or click her name, to see her alone with every act in full, so that a member with three acts is not three truncated lines.
8. As a user on solo, I want each act's type, status, context as a ten-step meter, tokens, cost, when it started or ended, which tools it has used how often and the tool in its hands right now, so that I can tell a grinding act from a stuck one.
9. As a user on solo, I want her figure beside her acts and only her spotlight up on the stage, so that the solo is a moment on stage, not just a bigger table.
10. As a user on solo, I want the same key, `m`, a second press of her name or `/bocchi solo off` to bring the mix back, so that I am never stuck in a solo.
11. As a user, I want the number under one of her slimes to solo her with that act listed first, so that a slime I am watching is one press from its details.
12. As a user who turned `autoSolo` on, I want a member who takes a new act soloed for ten seconds, and a solo I chose myself never cut short by it, so that delegations show themselves without my touching anything.
13. As a user, I want a solo to end itself once her last act has ended and nothing of hers is on stage, so that the console does not stay on an empty channel.
14. As a user, I want an act that just finished to hold its line bold in her color for a few seconds with `encore!`, its length and its cost, then settle dim, so that a finish is seen on the panel and not only in a toast.
15. As a user, I want a failed act to hold `✖ wrong note` and the reason in red the same way, and the last wrong note to stay on the rail until the next set, so that an error is not gone in five seconds.
16. As a user, I want the strip to read ON AIR while a turn runs and NOW PLAYING with the newest running act, so that a glance above the prompt says what is happening right now.
17. As a user, I want a tool row to read as a track: its number in the turn, the member's name on her tag, the tool, what it touched and how long it took, so that the transcript reads as a setlist.
18. As a user, I want the memo card to carry Nijika's yellow stripe and a BAND MEMO tag, so that it reads as the band's note and not as another panel.
19. As a user in a terminal, I want the same stage, mixer, solo and strip drawn with the minis, block characters and meters, so that the terminal is not a lesser band.
20. As a user with character art set to kaomoji, I want the stage, the mixer and the solo drawn with the text faces, so that the layout does not depend on the pictures.
21. As a user, I want `/bocchi demo` to put acts on the new stage and `/bocchi solo` in the typeahead and help, so that the new drawings can be seen without waiting for a subagent.
22. As a maintainer, I want the stage layer and the dimming kept in the sprite writer and tested directly, the counters and the solo in state, and the drawings tested at the seam on both surfaces, so that the release is tested where the engine draws it.
23. As a maintainer, I want `claude plugin validate`, `claude plugin test` and the type check to pass, and the README, the backlog and the version to say what shipped.

## Implementation Decisions

### Vocabulary

- A **slot** is a member's place on the stage: her cone, her figure, her pit, her tag, her context meter.
- The **pit** is the row of her acts' slimes under her figure.
- A **channel** is her column on the mixer; a **strip** (on the mixer) is a channel folded to one line while another
  member is on solo. The **rail** is the session's line under the console.
- A **set** is one turn of the main loop, numbered from the session's first; `set 3 · 6m 02s` is the third turn,
  six minutes in. (Replay Theater's `setlist` number counts turns with edits and keeps its own meaning.)
- **Solo** is one member's channel open across the console; the **mix** is the console with every channel up.
- **Encore** is the eight seconds after an act ends, during which its line is held bold in her color.
- A **track** is one tool call of the turn, numbered from one at `turn.start`.

### State

- `types/index.d.ts`:
  - `KessokuBand` gains `set: number` (0 before the first turn) and `setStartedAt: number`.
  - `KessokuAgent` gains `toolTally: Record<string, number>` (calls by tool name, this act) and `lastTool: string`
    (the task line's words for its newest call, `''` before one), both kept by the general `tool.call` hook; the
    main loop's act keeps them too and they reset at `turn.start`.
  - `KessokuUi` gains `solo: KessokuMember | null`, `soloAct: string | null` (the act listed first) and
    `soloUntil: number` (when an automatic solo ends; 0 for a chosen one).
- Module state: `trackNumbers: Map<string, { n: number; startedAt: number }>` keyed by `tool_use_id`, with
  `trackCount` reset at `turn.start`; lost on a hot reload, after which rows draw without a number until the next
  turn. The encore and the automatic solo end by a timer that invalidates `ui.render` (the strip's `scheduleTail`
  already does this; the same timer carries the earliest of the three dues).
- Options: `autoSolo` (boolean, default false) in `plugin.json`.

### The sprite writer (`hooks/lib/sprite.ts`)

- `drawSvg` and `spritesSvg` take an optional `stage: { color: string; isLit: boolean }`: before the parts, a cone
  (`polygon` from the top's middle sixth to the canvas's full width at the floor) filled with a vertical gradient of
  her color (opacity 0.55 to 0.10 lit, 0.12 to 0.02 at rest) and the pool on the floor (`ellipse` at the canvas's
  bottom, opacity 0.35 lit, 0.08 at rest). The cache key carries it. The gradient's id carries the color, so four
  slots in one document never share one.
- `SpritePart` gains `dim?: boolean`: in an SVG the part is wrapped in `<g opacity="0.35">` and desaturated through
  a `feColorMatrix` filter declared once; on a terminal `composite` mixes each of the part's pixels two thirds of the
  way to the background (`shade`), so a resting member's mini reads dim in cells too. The cache key and the frame
  signature are unchanged by `dim` (the frames are the same; only their paint differs), but the SVG key carries it.
- No new art. The slot composites what already ships: her figure (96x96) at the top, her live slimes (36x24) in a row
  under it two pixels apart, as many as fit her width (two; `+n` is text under the picture).

### The panel (`drawPanel`)

- **Marquee.** `♪ KESSOKU BAND ♪`, then `● ON AIR` (text on the error red while `isWorking`) or `○ OFF AIR` dim,
  then `set N · <length>` (the length since `setStartedAt` while it runs, the last set's once it ended), then on
  solo `solo: <Name>` at the right.
- **Stage.** A remote surface draws a flex row of four slots, each a Box column: her slot picture (one Svg: the stage
  layer, her figure, her pit) through `drawSprite` with the stage option, then `+n` when more slimes than fit, then
  the tag line (`<Text backgroundColor={her color} color={charcoal} bold> Name </Text>` and `×n` in her color when
  she has acts on stage), then the context line (`meter(ctx, 6)` and the percentage: the main loop's for Bocchi, her
  fullest live act's otherwise, blank while she rests). A slot whose member rests gets `isLit: false`; on solo every
  slot but the soloist's gets `isLit: false` and `dim`.
  A terminal draws the four minis as one Raster in quadrants (`stripSpec` as the strip does, 35x4 cells; in half
  blocks, 70x8, where the panel has 72 columns and the rows) over a line of `▔` in the accent, then the tag row (a
  tag a member at a pitch of ten columns), the context row (`▰▰▰▱▱▱ 42%` under each tag), and the pit as one Raster
  of every live act's slime mini (`stripSlimeSpec`), each member's run under her column where they fit, else the
  row as the strip draws it with `+n`. A resting member's mini is drawn `dim`.
  With character art off the slot is her face (`padFace`) over her tag, the pit her acts as `●` glyphs.
- **Mixer.** A Box column of rows, each a Box row of two channels (Bocchi and Nijika, then Ryo and Kita), a channel a
  Box column with `borderStyle="single"` in her color, `flexGrow 1`, `flexBasis 0`, padding 1. Inside, a Box row: the
  VU (a Box column of `▮` Texts, one a row of the channel's text, lit in her color from the bottom up to her share
  of the session's spend in eighths, the top two in red) and the text column:
  - the name line as a Button (`key: solo-<member>`, `hotkey` her letter, `plain`): her name bold in her color, then
    dim `playing, head down` (Bocchi), `n playing`, `set done` or her anxious line;
  - one entry an act (Bocchi: the main loop's task): a Box row with the act's line (`♪` live in her color, `✓` done
    dim, `✖` failed in red, the description, `wrap="truncate-end"`) and its cost at the right (`justifyContent
    space-between`), then `ctx ▰▰▱▱▱▱ 18%` (`meter(ctx, 6)`); during its encore the line is bold in her color and
    reads `✓ encore! · <length> · ≈$`; four entries at most, then `+ n more`;
  - `no act on stage` dim when she has none.
  Above the prompt (compact) the channels go one a row and show two acts each.
- **Keys row.** `solo b n r k` dim, each letter a Button (the same `solo-<member>` Buttons are the name lines; this
  row only names them in a terminal where the names scroll out: `Text`, not more Buttons), then `m mix` on solo.
- **Rail.** One Text: `CTX ▰▰▰▰▱▱▱▱▱▱ 42% · PLAN ▰▱▱▱▱▱ 18% · GATE $0.54 · AMP ☀ warm 48m` (`AMP ❄ cold` once the
  cache lapsed, `AMP ● keepwarm 2h` while keepwarm holds it), the labels dim, the values bright; the plan part only
  on a subscription. Then `✖ last wrong note: …` in red when there is one, and the footer line as today.
- **Solo.** With `ui.solo` set: the stage as above with the others dim; the console as one Box column: a row of
  three strips (a Box each in her color: her name, a horizontal VU of eight `▮`, `n playing` / `ctx 42%` / `resting`),
  then the soloist's channel across the width: her name line (the same Button, now reading `SOLO` on her color after
  the name, and `esc or r back to the mix` dim at the right as words only), then an act card an act (`soloAct`
  first, then live, then ended, newest first; eight at most): a Box column with `borderStyle="single"` dim, the act's
  line (mark, description bold, dim type, `done · 2m 40s` or `48s` at the right), a line of four labelled figures
  (`ctx ▰▰▰▰▰▰▰▰▱▱ 31% · tokens 68k · cost ≈$0.11 · started 5:14`, the last `ended 2:46` once done, as minutes into
  the set), and a line of the tool tally (`Grep ×4 · Read ×3 · Bash ×1`) with `now: <lastTool>` while it runs or
  `last: <lastTool>` after; her figure beside the cards on a remote surface (her full figure, the Svg she already
  has), her mini in half blocks in a terminal with the rows for it.
- **Pressing.** `solo-<member>` toggles: the same member again (or `m`) clears `solo`, `soloAct` and `soloUntil`;
  another sets `solo` to her with `soloUntil: 0`. The act buttons under a pit (`act-solo-<id>`, `plain`, the act's
  number as the label, no hotkey) set `solo` to her and `soloAct` to the act. `m` is `mix` (`key: solo-mix`,
  `hotkey: m`, `plain`, dim, drawn only on solo). A press writes state; the redraw follows.
- **Ending by itself.** At an act's `turn.complete` (and `SubagentStop`), when `ui.solo` is her and she has no live
  act left, the solo ends after the encore (`soloUntil: endedAt + ENCORE_MS`, whether chosen or automatic). An
  automatic solo (`autoSolo` on, set at `agent.spawn` when `ui.solo` is null or automatic) ends at `soloUntil`.
  A timer invalidates the render at the earliest due; a drawing past a due clears the fields as it reads them.
- **Encore.** `isEncore(a, now)`: ended, and `now - endedAt < ENCORE_MS` (8000). The timer above redraws at its end.
  Nothing is added to the toast or the notification.

### The strip (`drawStrip`)

- The one-line strip (no room for pictures) keeps the faces and the names; the heads strip's text column becomes:
  - line 1: `● ON AIR` on red (or `○ OFF AIR` dim), then `NOW PLAYING · <Name> · <description> · <age>` for the newest
    running act with the name in her color; `Bocchi · <set task>` while a turn runs with no act; `backstage · set N`
    between turns;
  - line 2 as today (the acts in words, the cost, the warmth);
  - the buttons as today.
- The heads picture and the slimes row are unchanged.

### Tool rows and the memo (`ui.render` ToolUse, `drawMemo`)

- The general `tool.call` hook numbers the call (`trackNumbers.set(tool_use_id, { n, startedAt })`) before anything
  else; `turn.start` resets the count and the map.
- The `ToolUse` header becomes `♪ 03 · ` (the number, two digits, dim; `♪` live in the accent, `♫` for an edit), the
  member's tag (`<Text backgroundColor={her color} color={charcoal}> Name </Text>`), the tool bold, `· <target>` dim
  (`describeCall(tool, input, cwd)` without the tool's own name), and at the right `playing` in the accent while it
  runs, `cut off` or `wrong note` after, else its length (`fmtDuration(now - startedAt)` from the map; nothing when
  the map has no entry). The header's row uses a Box with `justifyContent="space-between"` so the length sits at
  the edge. Everything else about the row (the edit frame, the memo frame, the `toolCards` option) is as it was.
- `drawMemo`'s open card gains a one-column Box in Nijika's yellow at its left (inside the round border) and the
  title reads `<Text backgroundColor={yellow} color={charcoal}> BAND MEMO </Text>` then `Nijika` in her color; the
  rest of the card, the buttons and the drafting and saved lines are unchanged.

### Commands, typeahead, help, version

- `/bocchi solo <bocchi|nijika|ryo|kita|off>` sets or clears the solo (for a terminal where the pane never holds the
  focus); the typeahead offers `solo` after `/bocchi` and the five words after `solo`; the help line names it and
  the keys. `/bocchi demo` is unchanged (its acts land on the new stage). `/clear` clears the solo.
- `plugin.json` goes to `0.7.0` with the `autoSolo` option; the README's panel and strip rows and the Tweaking
  section describe the stage, the mixer and the solo; `docs/BACKLOG.md` lists what shipped and keeps B and C.

## Testing Decisions

- **Pure parts, directly:** the stage layer in `drawSvg` (a cone and a pool before the parts, lit and at rest, the
  gradient id per color, the cache key telling them apart); `dim` (the SVG wrapper and filter, `shade` on the
  terminal's pixels, the frame signature unchanged); `meter`; the typeahead's `solo` words.
- **At the seam** (the plugin test kit): after `/bocchi demo`, on the desktop the panel's four slot Svgs carry the
  stage layer (lit for a member with a live act, at rest for Kita), the tags and context lines read as specified,
  the mixer has two channels a row with each act's full description and its own context meter, the rail reads with
  labels; in a terminal the stage Raster, the tag row and the pit Raster are there and a resting mini is shaded;
  pressing `solo-ryo` opens the solo (the strips for the others, Ryo's act cards with their figures, her figure
  beside), `soloAct` through an act button lists that act first, a second press and `/bocchi solo off` return to
  the mix; `autoSolo` solos a spawn's member and the clock ends it, a chosen solo outliving it; an act's end holds
  its encore line until the clock passes eight seconds; a wrong note holds red; the strip reads ON AIR and NOW
  PLAYING with the newest act; a tool row's header carries the track number, the tag, the target and, once the
  call ends, its length; the memo card carries the stripe and the tag; character art `kaomoji` draws the stage with
  faces and no pictures.
- `claude plugin validate`, `claude plugin test` and the type check against the 2.1.299 declarations pass.

## Out of Scope

- A pressable slime: `Svg` and `Raster` are leaves without `onPress` on this engine (the declarations say "yet"); the
  act's number under the pit stands in, and a press on the slime itself is a follow-up for the engine that allows it.
- A scrolling ticker on the strip (a static line re-cut each redraw; the sprite clock is not spent on text), sound,
  new art (a bowing slime), the B and C variants, Replay Theater and the file tree (unchanged), and every backlog
  row not named here.

## Further Notes

- Hover: `Button.hover` restyles the label while its keyed Box is hovered on a desktop and raises no hook, so a
  channel's name line brightens under the pointer; nothing expands on hover, by the engine's design.
- A hotkey fires only while the plugin's site holds the focus (ctrl+x tab, a click, or a pane opened with focus);
  from the prompt the letters type. `/bocchi solo` exists for that reason.
- Checked 2026-10-19: `claude plugin validate`, `claude plugin test` (73 tests) and the type check against the 2.1.299
  declarations pass. The slot pictures were looked at through the mod's own SVG writer in a browser (the mix, and Ryo on
  solo with the others dimmed). Not checked live in a session: the installed copy runs until this branch is installed.
  Durations read as the mod's other figures do (`0:48`, `1:31`), not `48s`.
