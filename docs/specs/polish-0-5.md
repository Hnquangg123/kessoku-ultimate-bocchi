# Spec: the v0.5.0 polish release

Status: ready for implementation · written 2026-10-18 · triage: `ready-for-agent`

No new art and no new gag: six small pieces of polish, each grounded in the engine's own declarations
(`claude-code.d.ts` as Claude Code 2.1.299 writes it; the older installed 2.1.295 declares every hook and call named
below too, so none of them is dropped). The backlog these came from was the prototype page's table
(`npm run proto`, never committed); its rows outlive the page in `docs/BACKLOG.md`.

## Problem Statement

1. **Compaction.** Nothing hooks `session.compact`. After `/compact` or the engine's own threshold, the panel keeps
   the old `ctx 87%` beside a window that is now a tenth full, and Cache Tax keeps the old token count and warm time:
   the next send is either held for a tax that no longer applies at that size, or priced for a prefix that no longer
   exists. Bocchi's face says nothing while the set is compacted.
2. **Typeahead.** `/bocchi` has nine sub-commands and `/keepwarm` takes a duration, all typed from memory; the
   engine's `prompt.autocomplete` and `prompt.suggest` are unused. After a turn with edits the only doors to Replay
   Theater are the strip's button and `/replay`.
3. **Notifications.** Everything the mod says is a toast or the status line, inside the window. When the person is
   away, the guard holds a command for ten minutes with nobody told, the set ends unannounced, and the cache goes cold
   unnoticed; `$.ui.notify`, the person's own notification channel, is unused.
4. **Engine version.** The README promises "Claude Code 2.1.287+" and nothing checks it: on an engine that lacks an
   API, a hook fails where a feature could simply switch itself off, and `/bocchi help` cannot say which mod runs on
   which engine.
5. **Themes.** `themes/*.json` are the palette's two token maps written out by hand; the README asks the person to
   regenerate them with a one-off `tsc` recipe, and nothing checks that the committed files still match
   `hooks/lib/palette.ts`.
6. **Housekeeping.** The slime prototype (`studio/proto/`, `studio/scripts/proto-upgrades.mjs`, the `proto` script)
   has served; its table of upgrades is the only record of the backlog.

## Solution

Six small changes to the hooks module and the studio, no new state keys and one new option description:

- A `session.compact` hook: Bocchi melts in the strip and the status line while the main conversation is compacted;
  afterwards the panel's context figure and Cache Tax's token count and warm time are set from the compaction's own
  result, so nothing stale survives it.
- A `prompt.autocomplete` hook that completes `/bocchi`'s sub-commands (and their arguments) and `/keepwarm`'s
  durations, and a `$.prompt.suggest` after a turn with edits that puts a dim `/replay 3 tracks` in the empty prompt
  box, Tab to take.
- `$.ui.notify`, titled `Kessoku Band`, for the three things worth coming back for: the guard holding a command,
  the set finishing after a long turn, the cache about to go cold. The `toasts` option governs them too.
- An engine-version gate: `$.session.version()` read once, the mod's own version read from its manifest, both shown
  by `/bocchi help`; every new call guarded where it is made, so a call the running engine lacks switches its
  feature off and is listed, never a failing hook (the new hooks cannot be gated: the loader refuses a module
  that hooks an event it does not know, so they set the floor).
- `npm run themes` in the studio writes `themes/*.json` from the palette's maps, and `npm run themes -- --check`
  (run by `npm run check` too) fails when the committed files drift.
- The prototype files leave; `docs/BACKLOG.md` keeps the table.

## User Stories

1. As a user watching the strip while `/compact` runs, I want Bocchi to melt (her melting sprite, the `(x_x)…` face in the status line with "compacting the set…"), so that I can see the set is being compacted.
2. As a user, I want the panel's `ctx` figure after a compaction to be the compacted size over the window, so that no stale 87% stands beside a fresh window.
3. As a user, I want Cache Tax to forget the old warm time and token count at a compaction, so that the next send is never held for a tax that applies to a prefix that no longer exists.
4. As a user, I want Cache Tax's token count after a compaction to be the compacted size, so that the next warning, when it comes, is priced right.
5. As a user, I want Bocchi back to her real face once the compaction stands or is skipped, and a short toast saying how far the set shrank, so that the melt is a moment, not a state.
6. As a user whose compaction the engine skipped or that failed, I want the band to carry on as before, so that a vetoed compaction changes nothing.
7. As a user, I want a subagent's compaction and the engine's `precompute` pass to change nothing on stage, so that the melt means the main conversation.
8. As a user who typed `/bocchi`, I want the typeahead to list its sub-commands beneath the engine's own row, each with one line of what it does, so that I need not remember them.
9. As a user who typed `/bocchi t`, I want `theme` and `tax` offered, so that the next word completes from its first letters.
10. As a user who typed `/bocchi mood `, `/bocchi theme ` or `/bocchi demo `, I want the moods, `on`/`off`/`status` and `off` offered, so that the arguments complete too.
11. As a user who typed `/keepwarm`, I want `30m`, `1h`, `2h` and `off` offered, and filtered by what I type next, so that a duration is a Tab away.
12. As a user, I want nothing offered for any other draft, so that the typeahead stays the engine's elsewhere.
13. As a user whose turn ended with edits, I want a dim `/replay 3 tracks` in the empty prompt box that Tab takes, so that Replay Theater has a quiet second door.
14. As a user, I want that suggestion only after a turn that answered with edits and only where a prompt box exists, so that it never appears over an SDK run or an interrupted turn.
15. As a user who is away, I want my notification channel to tell me when the guard is holding a command and what it would do, so that I come back for the question.
16. As a user who is away, I want to be told when a set longer than half a minute is done (or stopped on an error), with the edits count, so that I come back when it matters and not for every short turn.
17. As a user, I want to be told when the cache will go cold within five minutes while the session is idle and keepwarm is off, with what the re-write would cost, so that I can send a turn or arm keepwarm in time.
18. As a user, I want that cold-cache notice once per warm period, and as a toast where my surface has no notification channel, so that it neither nags nor goes unheard.
19. As a user who set toasts to `none`, I want no notifications either, so that one setting silences the band.
20. As a user on the desktop app (no notification channel), I want the mod to carry on without the notifications, so that a channel that cannot send is not an error.
21. As a user, I want `/bocchi help` to open with the mod's version and the engine's, so that a bug report says which runs on which.
22. As a user on an engine older than the mod expects, I want `/bocchi help` to say so, so that the README's "2.1.287+" is a check.
23. As a user on an engine that lacks one of the new APIs, I want that feature off and named in `/bocchi help`, and every other feature as before, so that a missing API never fails a hook.
24. As a maintainer, I want `npm run themes` to write `themes/kessoku-bocchi.json` and `themes/kessoku-bocchi-light.json` from `THEME_OVERRIDES` and `THEME_OVERRIDES_LIGHT`, so that the files and the maps are one source.
25. As a maintainer, I want `npm run themes -- --check` to fail when a committed theme file differs from what the palette would write, so that drift is caught by the usual studio check.
26. As a maintainer, I want the written files byte-identical to what the mod writes to `~/.claude/themes/` when it copies a theme, so that the two paths agree.
27. As a maintainer, I want the prototype page and its script gone from the branch, and the table of upgrades kept as `docs/BACKLOG.md` with the pieces shipped here marked done, so that the ideas are not lost with the page.
28. As a maintainer, I want the plugin tests to drive each piece at the surface seam (the strip and the panel mounted through the test kit, the commands run, the hooks raised), with the pure parts tested directly, so that the release is tested where the engine draws it.
29. As a maintainer, I want `claude plugin validate`, `claude plugin test` and the type check to pass, so that the mod loads as before.
30. As a reader of the README, I want the table and the Tweaking section to say what changed (compaction, typeahead, notifications, versions, `npm run themes`), so that the README stays true.

## Implementation Decisions

### Vocabulary

- A **compaction** is one `session.compact` event of the main conversation with trigger `manual`, `auto` or `plugin`.
  A `precompute` pass installs nothing and is passed through untouched; so is a subagent's (`e.agentId` set).
- A **completion** is one row the typeahead shows for the token at the cursor: `{ text, label?, description? }`, as
  `PromptAutocompleteSuggestion` has it; taking it writes `text` over the token.
- A **notification** is one `$.ui.notify(text, { title })` call; the channel answers `{ isSent, channel }` or
  `{ isSent: false, reason }` with reason `disabled`, `no-channel`, `no-surface` or `refused`.
- A **feature** is one of the three new *calls* on the engine: `suggest` (`$.prompt.suggest`), `notify`
  (`$.ui.notify`), `version` (`$.session.version`). Each has a flag the gate sets; a feature that is off calls
  nothing more. The two new *hooks* (`session.compact`, `prompt.autocomplete`) are not features: an engine that does
  not know an event refuses the whole module at load (see Further Notes), so they cannot be gated and set the
  mod's floor instead.

### Compaction awareness (hook `session.compact`)

- Grounding: `SessionCompactInput { trigger: 'manual' | 'auto' | 'plugin' | 'precompute'; agentId?; instructions?;
  messages }`, result `SessionCompacted { messages; tokensBefore?; tokensAfter?; usage? }` or
  `SessionCompactSkipped { skip }`. A hook's time waiting on `next(e)` is free of its budget, so the hook may await
  the engine's summarizer.
- The hook: for a compaction of the main conversation it sets a module flag, puts Bocchi in the `melting` mood with
  the status detail `compacting the set…` (the strip and the panel read the band's mood, so both melt), then
  `await next(e)`. In `finally` the flag clears and the mood reverts (`revertMood`). When the result stands
  (`skip` undefined): the band's `contextPercent` becomes `round(tokensAfter / window * 100)` when `tokensAfter` is
  given, else 0 (the next turn's measurement restores the truth; a stale figure never survives), and the main agent's
  `context` the same tokens; the cache's `lastWarmAt` becomes 0 (the new transcript has no cache entry yet),
  `contextTokens` the compacted size (0 when unknown), `isArmed`, `heldAt`, `heldText`, `heldUsd`, `warmUsd`,
  `engineWriteUsd` and `engineModel` cleared; `model`, `keepWarmUntil` and the ping ledger stay. A chatter toast
  says `Nijika: the set is compacted: 180k → 12k tokens` (the figures when the engine gave them).
- A skipped compaction only reverts the mood. A failing `next(e)` propagates (the engine reports its own failure);
  the `finally` still reverts. The hook's own bookkeeping is wrapped so that it can never stop the compaction.
- The keepwarm tick pings nothing while the flag is set.
- `revertMood` reads the band as reset, so Bocchi comes back `anxious` (or `focused`), never `melting` from a stale
  percentage.

### Typeahead and the Replay suggestion

- Grounding: `prompt.autocomplete` fires as the person types, for the non-empty token at the cursor, with
  `{ text, cursor, token, start }`; its result is `{ suggestions }`; the rows join beneath the engine's own and a
  taken row writes its `text` over the token. `$.prompt.suggest({ text })` proposes the dim suggestion, Tab (or
  right arrow) takes it, `{ isShown: false }` while the box holds text, a turn runs or the session is headless.
- A pure module `hooks/lib/typeahead.ts` owns the table and the rule: `completions({ text, cursor, token, start })`
  returns the rows for a draft. The rule reads the words before the token:
  - the token is the whole draft and spells `/bocchi` or `/keepwarm` exactly: every next word, written as
    `/bocchi theme` … `/bocchi help` or `/keepwarm 30m` … `/keepwarm off`, each with its one-line description
    (the engine's own row already completes the command's name, so a prefix of the name adds nothing);
  - the draft is `/bocchi` and one word, the token: the sub-commands that start with it (`theme`, `mood`, `demo`,
    `tax`, `crash`, `memo`, `setlist`, `strip`, `help`), case-insensitively;
  - after `/bocchi theme`: `on`, `off`, `status`; after `/bocchi mood`: the six moods; after `/bocchi demo`: `off`;
  - after `/keepwarm`: `30m`, `1h`, `2h`, `off`, filtered by the token;
  - anything else, or a cursor not at the end of its word: no rows.
- The hook calls `next(e)` and appends its rows after what the engine and other plugins gave. The descriptions are
  the `HELP` lines' words, kept in the table so help and typeahead agree.
- The suggestion: in `turn.complete` of the main loop, when the turn answered (`reason === 'answer'`), the setlist
  took edits, Replay is not open and a screen exists (`canDraw()`), the mod calls
  `$.prompt.suggest({ text: '/replay 3 tracks' })` (`1 track` singular) and ignores the answer. `/replay` keeps
  ignoring anything after it, so the taken suggestion runs as the command; the count is there to read, as the
  strip's `Replay 3` button and the turn's closing line already say it.

### Native notifications (`$.ui.notify`)

- Grounding: `$.ui.notify(text, { title })` raises `ui.notify` through the other plugins' hooks, then the person's
  `preferredNotifChannel` writes; the desktop app and an SDK host answer `no-surface`, `notifications_disabled`
  answers `disabled`. It rejects on a hook's deny or a failed write.
- One helper, `notify($, text)`, titled `Kessoku Band`: nothing when the `toasts` option is `none` or the feature
  is off; otherwise the call in a try, a rejection read as not sent. It returns whether the channel sent it.
- Three sites, each an `important` notice in the toasts sense:
  - **The guard.** Once the dropped-guitar screen is up (`holdForDecision`, after `$.ui.open`):
    `Blast Radius is holding "rm -rf build": delete 3 files (about 1.3 MB). Answer the dropped-guitar screen.`
    The screen itself is the fallback; no toast.
  - **The set.** In `turn.complete` of the main loop, when the turn ran at least 30 s (`SET_AWAY_MS`; a short turn
    was watched): `Nijika: the set is done after 1:12 · 3 edits on the setlist (/replay)` on an answer,
    `Nijika: the set stopped on error after 1:12` on an error or a refusal; an interrupted turn had the person at the
    keyboard and sends nothing. The status line's mood is the fallback; no toast.
  - **The cold cache.** On the existing minute tick: when the cache is warm, the session idle, keepwarm off, the
    context at or past the tax threshold (20k tokens), and the cache due to lapse within five minutes (or half the
    TTL when that is shorter, so a five-minute TTL warns at two and a half), once per warm period (keyed by
    `lastWarmAt` in module state): `Cache Tax: the cache goes cold in 4:30 · re-writing 300k tokens would cost
    ≈$1.20 · /keepwarm keeps it warm`. When the channel did not send it, the same words as an important toast.
- No notification carries a prompt back or needs an answer; the engine's own idle notification is left as it is
  (the mod adds the band's voice to the three moments, nothing more).
- The `toasts` option's description in `plugin.json` names the notifications it also governs.

### The engine-version gate (`$.session.version`, `$.plugin.root`)

- Grounding: `$.session.version()` answers `{ version, base?, builtAt? }` (`base` the release, `2.1.299`);
  `$.plugin.root` is the plugin's directory, `$.plugin.name` its name; the manifest's version is read from
  `${$.plugin.root}/.claude-plugin/plugin.json` with `$.fs.read` (no JSON import exists in a hooks module, and a
  constant would drift from the manifest).
- A pure module `hooks/lib/engine.ts`: `MIN_ENGINE = '2.1.287'` (the README's floor), `parseVersion`, `isAtLeast`,
  and the feature table (key, the API it needs, its label for help).
- Module state: `engineVersion` (the base, else the version, else `''`), `modVersion` (`''` when the manifest could
  not be read) and `features: Record<FeatureKey, boolean>` for the three calls.
- The gate: a call the engine lacks throws a `TypeError` (`$.ui.notify is not a function`) where it is made, so
  every call site sits in a try that reads that error as "no such call" and switches the feature off for the
  session, and reads any other failure (a hook's deny, a failed write) as the call refused, nothing more. The
  loader forbids reading a call as a value (`typeof $.ui.notify`): `$` is always spelled `$.noun.event(...)`, so
  the probe is the first call itself. `$.session.version` and the manifest read are each one try at
  `session.start`; `notify` and `suggest` are probed where they are first used.
- The hooks are registered plainly: the loader scans the compiled module and refuses one that hooks an event it
  does not know (`"session.nothing" is not an event`), before `register` runs, so a try around `on(...)` gates
  nothing. The floor is therefore the engine version the README names, and both installed engines (2.1.295,
  2.1.299) declare every hook and call used here.
- `/bocchi help` opens with `♪ Kessoku Ultimate Bocchi Theme v0.5.0 · Claude Code 2.1.299` (`version unknown`
  where the engine did not say; `older than the mod expects (2.1.287)` appended when `base` is below `MIN_ENGINE`)
  and, only when a feature is off, one line `off on this engine: native notifications (no $.ui.notify), …`.
- Nothing else changes for a feature that is off: no toast at start, no status line.

### Themes from the palette (the studio)

- `studio/scripts/themes.mjs`, run as `npm run themes`: bundles `hooks/lib/palette.ts` with esbuild through the
  studio's `loadTs` (no engine, no render), and writes `themes/<THEME_SLUG>.json` and
  `themes/<THEME_SLUG_LIGHT>.json` as `JSON.stringify({ name, base, overrides }, null, 2) + '\n'`, the shape the
  mod's `writeThemeCopy` writes; `--check` compares each committed file with what would be written and exits 1 with
  the file named when one differs or is missing.
- `npm run check` runs the art check and then the theme check, so the studio's quick check covers both; the mod's
  own tests cannot read files, so this is the only place the check lives.
- The README's Tweaking section replaces the `tsc` recipe with `npm run themes`.

### Housekeeping

- The prototype never reached a commit: `studio/proto/` and `studio/scripts/proto-upgrades.mjs` are untracked
  files of the main checkout, and the `proto` script is an uncommitted edit of `studio/package.json` there. The
  branch therefore has nothing to delete; the main checkout's copies are the person's to remove (one command,
  named in the hand-over), and this spec records that they are not wanted on `develop`.
- `docs/BACKLOG.md` keeps the table's rows (group, upgrade, what you would see, the benefit, the difference, the
  effort), with the five polish items shipped here under their own heading as done, and the slimes noted as v0.4.0.

### State and data

- No new state keys: the compaction writes existing band and cache fields; the notification ledger (one cold notice
  per warm period), the features and the versions are module state, lost on a hot reload and read again at the next
  `session.start`.
- `plugin.json` goes to `0.5.0`; the `toasts` option's description mentions the notifications.

## Testing Decisions

- **The seam.** As before: the plugin test kit mounts the strip (`AbovePrompt`) and the panel (`Pane`) on the
  terminal and the desktop and reads what the mod drew; commands are run with `$.command.run`; the engine's events
  are raised on the test's `$` (`$.session.compact`, `$.turn.complete`, `$.tool.call`, `$.prompt.submit`); the
  bottoms beneath answer the new calls from memory (`session.version`, `ui.notify`, `prompt.suggest`,
  `session.compact`, `fs.read` of the manifest) and keep what they were asked, one bottom per event, knobs in
  `Answers`.
- **A good test states what the person sees:**
  - a compaction in flight (the bottom sleeps on the mock clock) draws Bocchi melting on the desktop strip and
    writes the melting status line; once it stands, the panel says `ctx 6%` (12k of 200k), `/cache-tax` says
    nothing is cached and names 12.0k tokens, and a send an hour later is not held, where before the compaction it
    would have been; a `precompute` pass and a subagent's compaction draw and write nothing;
  - after a turn that edited a file, the prompt box was offered `/replay 1 track`; after a turn without edits,
    nothing;
  - the guard's hold, a 45 s turn and the minute before the cache lapses each sent one notification titled
    `Kessoku Band` with the expected words; a 3 s turn sent none; the cold notice came once and, where the channel
    answered `no-surface`, as a toast; under `toasts: none` none of the three was sent;
  - `/bocchi help` opens with the version the manifest bottom gave and the engine version the bottom gave, says
    `version unknown` when the engine call fails, and names an older engine as such; the line naming features
    that are off is tested as a pure part, since the kit's `$` has every call.
- **Pure parts tested directly** (prior art: the `small helpers` test): `completions` for each rule above and for
  drafts that get nothing; `parseVersion` and `isAtLeast` on releases, dev builds and junk.
- **The typeahead hook itself** is raised through the kit where the kit can (the event is not among the kit's typed
  engine calls); where it cannot, the hook is a one-line adapter over `completions` and the test of the table is the
  test.
- **Studio checks**: `npm run themes -- --check` passes on the committed files; a deliberate edit to one theme file
  makes it fail (run by hand once, not a committed test).
- `claude plugin validate`, `claude plugin test` and the type check against the engine's declarations pass.

## Out of Scope

- Markdown in the cards, copy and quote, kitty/Ghostty pictures, on-screen-only animation, and every `Feature` and
  `Maybe` row of the backlog (`docs/BACKLOG.md`).
- Rewriting the compaction (its instructions or messages), compacting on the mod's own initiative, or a
  context-full warning beyond the melting face that already exists.
- Completing anything but the mod's own commands; a suggestion other than Replay's.
- A notification setting of its own, per-member titles, sounds, or notifying from a subagent's events.
- A version floor per feature (every API here is declared by both installed engines; the gate is the probe), or a
  check of the engine's version at install time.
- Any change to the art, the sprite pipeline, the slimes, Reflect, the file tree or the Blast Radius classifier.

## Further Notes

- What the loader does with an API the engine lacks, measured on 2.1.299 with a scratch copy of the module:
  `claude plugin validate` passes it either way; at load, a hook on an event the engine does not know refuses the
  whole module (`hooks module did not load: "session.nothing" is not an event`), a call it does not know loads
  and throws `TypeError: $.ui.nothingOfTheSort is not a function` when made, and reading a call as a value
  (`typeof $.ui.notify`) refuses the module too (`$.ui.notify is used as a value ... instead of called`). The gate
  follows: calls are guarded at the call, hooks are the floor.
- The kit's typed engine calls (`EventCalls`) carry `prompt.suggest` but not `prompt.autocomplete`; the test of the
  completion table is therefore the test of the typeahead unless the kit raises the event untyped.
- "Away" is a guess: the engine does not say whether the window is focused, so the set's notice fires on length
  (30 s), and the terminal channels (iTerm2, kitty, Ghostty) decide what to show while the window has focus.
- After a compaction the engine's `$.session.usage()` may still report the fill of the last response of the old
  window; that is why the mod sets the figure from `tokensAfter` and otherwise to 0 rather than re-reading it.
