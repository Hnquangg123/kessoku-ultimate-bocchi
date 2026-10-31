# Spec: On Tour, the v1.0.1 release

Status: implemented · written 2026-10-26 · triage: `done`

Design brief: the throwaway before/after page `npm run proto:1.0.1` in `studio/` (`studio/scripts/proto-1-0-1.mjs`,
written to `studio/out/proto/1.0.1.html`), variant B "On tour": the recap card above the prompt and the
`/bocchi stats` page, with its "What changes" table. Like the earlier prototypes the page lives untracked in the main
checkout and is not wanted on `develop`; this spec is the record. Variants A (Hands on: copy, open, a memo from a
selection, a clickable file tree) and C (Quiet & clear: Markdown help, the engine's verdict on Blast Radius, a
cheaper Reflect) were not chosen; their rows stay in the backlog.

Grounded in the engine's own declarations (`claude-code.d.ts` as Claude Code 2.1.299 writes it): `$.store` is the
plugin's own key-value store, one JSON file under the user's configuration directory, kept between sessions and hot
reloads, refusing a write past 4 MiB of JSON in all; `$.session.repo()` answers the repository's root, the main
working tree's for a worktree; `Text` takes `size`, `weight` and `tabular` on a graphical surface; `Svg` is the
picture a graphical surface draws.

## Problem Statement

1. **A set ends and leaves nothing behind.** The strip says `set 3 done` until the next prompt; the native
   notification that a long set ended reaches a terminal's channel only, so in the desktop app a set that ran while
   the person was away ends in silence. What it did (its edits, its acts, its wrong notes, what it cost) has to be
   pieced together from the transcript.
2. **The band forgets everything between sessions.** `$.store` holds the theme the person had before and two flags.
   How much a project has cost, how many sets it took, which member did the work, how often the guard stopped a
   command: none of it outlives the session.

## Solution

- **A recap card.** When a set of 30 seconds or more ends (not interrupted: the person was there), Nijika holds up
  one card above the prompt, in the strip's place: `♪ SET 3 · that's a wrap` (or `stopped on error`), the set's
  length and its cost, four counts (edits, acts, wrong notes, blasts held), the set's MVP and Replay. It leaves on
  the next prompt, on Dismiss, or with `/clear`. Toasts `none` and a hidden strip show no card.
- **A tour.** Every set (short, long or interrupted, with or without a screen) is added to the project's tour in
  `$.store`: one line a night (a calendar day the band played), the newest 60 nights, the older ones summed into one.
  A memo saved counts on the night it was saved.
- **`/bocchi stats`**, the tour page: the project, since when and how many nights; sets, spend, commits, blasts
  stopped, memos saved; the cost of each of the last 14 nights played; acts by member; the longest set, the
  priciest set and who hit the most wrong notes. `/bocchi stats all`, or the page's own button, reads every project
  the store holds. The recap's Tour button opens it too.

## User Stories

1. As a user who comes back to a finished set, I want a card that says what the set did and what it cost, so that I do not have to scroll the transcript to find out.
2. As a user, I want the card to name the member who did the most, so that the band's work reads as the band's.
3. As a user, I want Replay one key away on the card, so that the edits the set left are where the recap is.
4. As a user, I want the card gone when I send the next prompt, so that it never stands between two sets.
5. As a user who turned toasts off or hid the strip, I want no card either, so that my prompt area stays as quiet as I set it.
6. As a user, I want every set counted in the project's tour, so that `/bocchi stats` adds up what the project has cost across sessions.
7. As a user who works in several worktrees of one repository, I want them on one tour, so that a project's history is not split by branch folders.
8. As a user, I want to see the cost of each recent night, so that a night that ran expensive stands out.
9. As a user, I want the tour across every project, so that I know what the band has cost me in all.
10. As a user, I want the store to stay small however long I use the mod, so that the tour never fills my configuration folder.
11. As a user, I want a set to end normally even when the store cannot be written, so that the tour is never a reason a turn fails.
12. As a user tweaking the look, I want `/bocchi recap` to put a sample card up, so that I can see it without waiting for a long set.

## Implementation Decisions

### Vocabulary

- **Set**: one turn of the main loop (as before). **Act**: a subagent run, seated with its member (as before).
- **Recap**: the card above the prompt after a set of 30 s or more. **MVP**: the member the recap names.
- **Night**: a calendar day (the machine's local date) on which the band played at least one set in a project.
- **Tour**: what the store keeps of a project's nights. **Book**: one project's tour as stored.

### The recap (`turn.complete` of the main loop, the `AbovePrompt` band)

- Shown when `durationMs >= SET_AWAY_MS` (30 s, the notification's threshold), the reason is not `aborted`, a
  screen exists (`canDraw()`), and toasts are not `none`. The title reads `that's a wrap` on an answer, else
  `stopped on <reason>`.
- Counts: **edits** (every edit the set made; its setlist keeps the newest 40), **acts** (subagents that started
  during the set), **wrong notes** (tool calls that came back as errors, the main loop's and its acts'), **blasts
  held** (commands the guard held, on screen or waiting in line behind another). The cost is the mod's list-price
  estimate, as everywhere else: what the main loop spent during the set plus what the set's acts have spent so far.
- **MVP**: the member with the most acts in the set, ties to the one who spent less, then the band's order. With no
  acts, Bocchi for the main loop, with the set's tool calls.
- Buttons: `Replay N` (`r`, when the set left edits and Replay is not open), `Tour` (`t`), `Dismiss` (`x`).
  Nijika's head beside it: happy after an answer, her usual smile after a set that stopped.
- Its place in the band, by priority: a held Blast Radius, Cache Tax, a memo, then what the person opened above the
  prompt (Replay, the tour page, the file tree, the panel, in that order), then the recap, then the strip. A hidden
  strip hides it.
- Cleared at the main loop's next `turn.start`, by Dismiss, and by `/clear`.

### The tour (`$.store`, `hooks/lib/tour.ts`)

- Key `tour:<root>`: the repository's root from `$.session.repo()` (the main working tree's, so worktrees share a
  tour), else `$.session.root()`, spelled one way (forward slashes, no slash at the end, the drive letter in
  capitals). The book keeps the root, the folder's name, its nights oldest first, the older nights summed (with
  their count), the longest and the priciest set with their nights, and the first night.
- A night: `day` (`YYYY-MM-DD`), sets, length, cost, acts and wrong notes by member (band order), edits, commits,
  blasts held, blasts stopped (held and not run: the person said no, closed the screen, or nobody answered), memos
  saved.
- Written at every main-loop `turn.complete` and at every memo saved, read-modify-write through one function that
  runs its writes one after another (a set and a memo saved at once each read what the other wrote); a value that
  does not read as a book is started afresh; any store failure is swallowed.
- At most 60 nights a book, the page showing 14 of them (a night is ~150 bytes of JSON: about 9 KB a project at the
  cap). Folded nights keep their totals and their count, not their dates.
- The set's counters live in a `tally` atom (they survive a reload mid-set): the set it began with, wrong notes by
  member, blasts held and stopped, commits, and the main loop's cost when the set began. Edits come from the
  setlist, acts from the band. A tally that did not begin with the set that ends (an older version kept none) leaves
  the main loop's spend out of that set rather than charge it the session's.
- Pure, in `hooks/lib/tour.ts`: the set's figures and its MVP, the store's key, reading a stored value as a book,
  adding a set or a memo to a book (and folding past the cap), the tour view of one book or several, its one-line
  summary, the local day of a time, the terminal's bars and the desktop's chart.

### `/bocchi stats` (pane `kessoku-tour`)

- Answers in one line (`♪ On tour · app: 41 sets over 14 nights since 2026-10-12 · ≈$7.34 · 23 commits · 5 blasts
  stopped · 9 memos saved`), which is all a run with no screen gets, and opens the page with the focus; Esc closes
  it. Drawn above the prompt where the terminal has no room for a pane (as Replay). `all` reads every `tour:` key and
  names the view `all projects` however many there are. The view is computed when the page opens, when its scope
  changes and when a set ends while it is open, and kept in the `tour` atom, so the drawing reads state only.
- Remote surfaces (desktop, vscode, mobile): the figures as large tabular Text, the nights and the members as one
  Svg chart (its alt text carries the numbers). The terminal: the same rows in Text, the nights as `▁▂▃▄▅▆▇█`, the
  members as bars of `█` in their colours.
- With nothing recorded: `No sets played here yet.`

### Commands, typeahead, help

- `/bocchi stats [all]`, `/bocchi recap` (the sample card), each in the typeahead and in help; the argument hint
  names them.

### State added

- `tally: KessokuTally`, `recap: KessokuRecap | null`, `tour: KessokuTour` in `types/index.d.ts`. Each atom's
  initial value stands in for a value an older version never wrote.

## Testing Decisions

The seams were agreed before any test was written:

1. **`hooks/lib/tour.ts`, directly**: a set added to an empty book and to the same night, a new night, the fold past
   the cap (totals kept, the count of folded nights, the first night), memos on a night, records (longest,
   priciest), a stored value that is not a book, the view of one book and of several (nights shared across
   projects counted once), the last 14 nights, the MVP and its ties, the bars. Catches the arithmetic; misses the wiring.
2. **The hooks module through `claude plugin test`**, at public events only: a long set writes its night to the
   store and puts the recap up (its counts, its MVP, Replay, Tour and Dismiss pressed); a short or interrupted set
   writes the night but shows no card; the next prompt clears it; toasts `none` shows none; `/bocchi stats` opens the
   tour from a store seeded as another session left it, `all` merges the projects, and the page draws on the terminal
   and the desktop; a memo saved counts. Catches wiring and the band's priority; misses the desktop's paint and the
   store's real file.

`claude plugin validate`, `claude plugin test` and the type check against the 2.1.299 declarations pass.

## Out of Scope

- Copy as text (variant A's `$.ui.copy`; a remote surface has no clipboard path yet), forgetting a project's tour
  (the store's file can be edited), syncing a tour between machines, nights as sessions, and every backlog row not
  named here.

## Further Notes

- The store is one file for every key of the plugin: 100 projects at the cap take about a fifth of its 4 MiB. A write
  the store refuses leaves the book as it was; the set is not affected.
- Across projects, a night played in two of them counts once while both keep it; folded nights are counted per
  project.
- An act still playing when its set ends (a background subagent): what it spends afterwards is not counted, and its
  wrong notes, commits and holds count with the next set (or, if none follows, nowhere). A set of more than 24 acts
  can lose its earliest-ended ones to the band's own cap before they are counted.
- Checked 2026-10-26: `claude plugin validate`, `claude plugin test` (104 tests across two files) and the type check
  against the 2.1.299 declarations pass; the desktop chart was looked at through the lib in a browser, on a dark and
  a light card. Not checked live in a session, and the serialised store writes are not covered by a test (the test
  kit does not interleave hooks as the engine does).
- Reviewed on two axes (standards, spec) before the commit. Declined: the night's nine figures repeated across its
  types (the data model), view fields the page does not draw yet (they mirror the stored night and stay tested), the
  recap's and the page's twin figure blocks.
- A night is the local date where the hooks run; a set past midnight counts on the night it ended.
