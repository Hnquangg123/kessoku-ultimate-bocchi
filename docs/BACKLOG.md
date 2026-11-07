# Backlog

The upgrades the slime prototype page listed beyond the slimes, kept here so the ideas outlive the page (the page,
`npm run proto` in the studio, was a throwaway that never reached a commit and is not wanted on `develop`). The
rows read as the page wrote them, before v0.4.0: what you would see, the benefit, how it differs from the mod as it
was, and the page's guess at the effort (S a day or two, M a week).

## Shipped since

| Upgrade | Where |
| --- | --- |
| Slimes as subagents (Variant A) | v0.4.0 · `docs/specs/slime-subagents.md` |
| Compaction awareness | v0.5.0 · `docs/specs/polish-0-5.md` |
| Native notifications | v0.5.0 |
| Typeahead and suggestions | v0.5.0 |
| Engine-version gate | v0.5.0 (the calls are gated; the hooks cannot be: the loader refuses a module that hooks an event the engine does not know) |
| Themes from the palette | v0.5.0 · `npm run themes` |
| Band agent types | v0.6.0 · `docs/specs/band-routing-0-6.md` (the engine names them `kessoku-ultimate-bocchi:nijika` / `:ryo` / `:kita`; the short `kessoku:ryo` works through the Agent tool) |
| A memo tool the model can call | v0.6.0 · `docs/specs/band-routing-0-6.md` (`mcp__kessoku-ultimate-bocchi__memo`) |
| Live Stage: the panel as a stage, a two-column mixer, solo, encore, tracks (prototype variant A) | v0.7.0 · `docs/specs/live-stage-0-7.md` |
| Tour stats, with a recap card when a long set ends (the 1.0.1 prototype's variant B, "On tour") | v1.0.1 · `docs/specs/tour-1-0-1.md` (`/bocchi stats [all]`; nights, not sessions; Copy as text left for Copy and quote) |
| Hotpot Night: the prompt cache as the band's after-show hotpot, the feast as its gauge, a ledger of every request's cache tokens, the cache's truth (the 1.1.0 prototype's variant A, "Nabe Night") | v1.1.0 · `docs/specs/hotpot-1-1-0.md` (`/hotpot`, ♨ Hotpot on the strip and the board; B's tablet not taken: its hit rate, saving and tax paid are on the bill, its re-order price on the wooden board) |

## Open

| Group | Upgrade | What you would see | Benefit | Difference from now | Effort |
| --- | --- | --- | --- | --- | --- |
| Polish | Copy and quote | Each Replay track gets "Copy diff"; the memo card gets "Copy rule"; the tour page gets "Copy as text"; `/bocchi memo` with text selected in the transcript turns the selection into a rule. | Replay becomes a working tool, not just a show; a rule can start from Claude's own words. | Today Replay is view-only; memos come from your corrections and Claude's memo tool, never from a selection. `$.ui.copy` and `$.ui.selection` are unused. | S |
| Polish | Markdown in the cards | The memo preview, `/bocchi help` and Replay's notes render as Markdown (headings, lists, fences) the way an assistant reply does. | Readable help and rules without hand-laid Text rows. | Today every card is Text rows; the Markdown element is unused. | S |
| Polish | True pictures in kitty / Ghostty | In a terminal that speaks the kitty graphics protocol, the band is drawn as real PNG pixels at full color, swapped by blit; other terminals keep the half-block cells. | The desktop's look in the terminal for the people who have it. | Today the terminal always gets 16x8 half-block cells; the Image element is unused. Not Windows Terminal (no kitty protocol). | M |
| Polish | Animate only what is on screen | Transcript rows carrying a sprite stop animating once scrolled out of view (desktop). | Less work in long sessions. | Today the SVGs animate whether or not the row is visible; `e.props.onScreen` is unused. | S |
| Feature | Blast Radius reads the engine's verdict | The guard asks `tool.check` first: a command your rules already deny is simply denied; one your rules allow in auto mode is the one held behind the dropped guitar, with the verdict shown beside Proceed. | Fewer double prompts; the guard holds exactly what would otherwise run. | Today the hold happens at `tool.call` before the engine decides anything. | M |
| Feature | Linked sessions on stage | Desktop side-sessions you start appear as guest members; their reports arrive as toasts in Kita's voice; a muted one is a pressed button away. | One place to see everything working for you. | Today only subagents of this session are seated; `session.receive` / `session.send` are unused. | M |
| Feature | Clickable filetree | Each row is a Link: a click opens the file in the editor. | The tree becomes navigation, not only a light show. | Today rows are Text. | S |
| Feature | Cheaper Reflect | A label call (correction / question / chatter) via `$.model.classify` runs before the Haiku draft. | Fewer Haiku calls on chatter that merely looked like a correction. | Today one completion per candidate; classify is unused. | S |
| Polish | Press a slime | A click on a slime in the pit solos its act directly. | The slime is the thing you watch; it should be the thing you press. | Today the act's number under the pit stands in: `Svg` and `Raster` take no `onPress` on 2.1.299. | S |
| Polish | Setlist Timeline (prototype variant B) | The set so far as a gantt of tool calls and acts with their cost; finished sets collapsed to a line. | "What happened, what is running, what did it cost" in one view. | Not chosen for v0.7.0; the tracks it needs are counted now (`trackNumbers`), not kept. | M |
| Polish | Dressing Room (prototype variant C) | A hero of gauges, four tiles with big numbers, a backstage feed of the last toasts. | A glanceable dashboard; a missed toast stays. | Not chosen for v0.7.0. | S |
| Feature | Hotpot conveyor (1.1.0 prototype variant B, "Kaiten Counter") | The cache as a kaitenzushi counter: each request a plate passing the band on a conveyor (read plates, written plates, a cold re-order's stack), its timeline as the TTL runs. | The cache's history at a glance, not only its state now. | Not chosen for v1.1.0 (variant A's feast is the gauge); drawn on the prototype branch's first commit, `771438d`. The ledger books totals, not a request-by-request history it would need. | M |
| Feature | Pot clock (1.1.0 prototype variant C) | The donabe seen from above as a clock face, the TTL its hand, the four portraits round the rim. | A compact gauge for a narrow dock. | Not chosen for v1.1.0; drawn on `771438d`. | S |
| Maybe | Band voice, sound | An opt-in `prompt.compose` section that lets Claude sign off tool-free replies with a ♪; a guitar sting on commit via `$.audio.play`. | Fun, nothing more. | Both off by default; audio plays on macOS only (Windows has no player). | S |
