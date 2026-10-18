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

## Open

| Group | Upgrade | What you would see | Benefit | Difference from now | Effort |
| --- | --- | --- | --- | --- | --- |
| Polish | Copy and quote | Each Replay track gets "Copy diff"; the memo card gets "Copy rule"; `/bocchi memo` with text selected in the transcript turns the selection into a rule. | Replay becomes a working tool, not just a show; a rule can start from Claude's own words. | Today Replay is view-only; memos come only from your corrections. `$.ui.copy` and `$.ui.selection` are unused. | S |
| Polish | Markdown in the cards | The memo preview, `/bocchi help` and Replay's notes render as Markdown (headings, lists, fences) the way an assistant reply does. | Readable help and rules without hand-laid Text rows. | Today every card is Text rows; the Markdown element is unused. | S |
| Polish | True pictures in kitty / Ghostty | In a terminal that speaks the kitty graphics protocol, the band is drawn as real PNG pixels at full color, swapped by blit; other terminals keep the half-block cells. | The desktop's look in the terminal for the people who have it. | Today the terminal always gets 16x8 half-block cells; the Image element is unused. Not Windows Terminal (no kitty protocol). | M |
| Polish | Animate only what is on screen | Transcript rows carrying a sprite stop animating once scrolled out of view (desktop). | Less work in long sessions. | Today the SVGs animate whether or not the row is visible; `e.props.onScreen` is unused. | S |
| Feature | Blast Radius reads the engine's verdict | The guard asks `tool.check` first: a command your rules already deny is simply denied; one your rules allow in auto mode is the one held behind the dropped guitar, with the verdict shown beside Proceed. | Fewer double prompts; the guard holds exactly what would otherwise run. | Today the hold happens at `tool.call` before the engine decides anything. | M |
| Feature | A memo tool the model can call | A `kessoku_memo` tool: when Claude notices a convention it keeps breaking, it proposes the rule itself; the proposal lands in Nijika's memo card and you still press Save. | Rules get written at the moment the mistake is understood, not only when you complain. | Today Reflect listens to your corrections only; `$.tool.register` is unused. | M |
| Feature | Band agent types | `kessoku:nijika` (planner), `kessoku:ryo` (searcher), `kessoku:kita` (editor) as real subagent types with band prompts; the panel seats them by name. | The routing the panel pretends becomes routing the model can pick. | Today members are assigned by keyword and tool after the fact; `$.agent.register` is unused. | M |
| Feature | Linked sessions on stage | Desktop side-sessions you start appear as guest members; their reports arrive as toasts in Kita's voice; a muted one is a pressed button away. | One place to see everything working for you. | Today only subagents of this session are seated; `session.receive` / `session.send` are unused. | M |
| Feature | Tour stats | `/bocchi stats`: per project, across sessions: cost, turns, commits, blasts stopped, memos saved, longest set. | A reason to open the panel after the novelty wears off. | Today `$.store` holds only the theme-before value. | S |
| Feature | Clickable filetree | Each row is a Link: a click opens the file in the editor. | The tree becomes navigation, not only a light show. | Today rows are Text. | S |
| Feature | Cheaper Reflect | A label call (correction / question / chatter) via `$.model.classify` runs before the Haiku draft. | Fewer Haiku calls on chatter that merely looked like a correction. | Today one completion per candidate; classify is unused. | S |
| Maybe | Band voice, sound | An opt-in `prompt.compose` section that lets Claude sign off tool-free replies with a ♪; a guitar sting on commit via `$.audio.play`. | Fun, nothing more. | Both off by default; audio plays on macOS only (Windows has no player). | S |
