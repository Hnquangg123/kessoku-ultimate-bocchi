# Spec: band routing, the v0.6.0 release

Status: implemented · written 2026-10-18 · triage: `done`

Design brief: the throwaway before/after page `npm run proto:0.6` in `studio/` (`studio/scripts/proto-0-6.mjs`,
written to `studio/out/proto/0.6.html`), sections A and B and their "What changes" tables. Like the earlier
prototypes it lives untracked in the main checkout and is not wanted on `develop`; this spec is the record.

Two backlog items, both M, both chosen because they change what the model can do, not only what you see: the band as
real subagent types, and a memo tool the model can call. Grounded in the engine's own declarations
(`claude-code.d.ts` as Claude Code 2.1.299 writes it: `$.agent.register` and its `AgentSpec`, `$.tool.register` and
its `ToolSpec`, a `tool.call` hook on `mcp__<plugin>__<name>`) and in a live headless run against that engine (see
Further Notes).

## Problem Statement

1. **Routing is a guess made after the fact.** The model delegates to `general-purpose`, `Explore` or `Plan`; the mod
   then scores the spawn's description and prompt against keyword tables and seats the act. A spawn that matches no
   keyword ("Look into why the strip flickers on resize") sits on Bocchi's card as a subagent of the main loop, and
   an act on Nijika's card reads `general-purpose`: the model never picked her. A Ryo slime is a general-purpose
   agent painted blue; nothing about its prompt or its tools is Ryo's.
2. **Rules come through one door.** Reflect listens to the person's corrections only. When Claude notices on its own
   that it broke a convention ("I ran `npm run check` again; this repo uses pnpm"), the observation is gone with the
   turn, and the next session repeats the mistake.

## Solution

- **Band agent types.** Three agent types registered with `$.agent.register` at `session.start`, behind the engine
  gate: `nijika`, `ryo` and `kita`, which the engine names `kessoku-ultimate-bocchi:nijika` and so on (a plugin's
  agent type is `<plugin>:<name>`). Each has a when-to-delegate description (the line the model reads beside
  general-purpose, Explore and Plan), a whole system prompt in the band's voice and a tool list that fits the part.
  `memberFor` seats a band type by name before any keyword runs; every other type keeps today's tables, so nothing
  that works today stops working. The short spelling `kessoku:ryo` reaches the Agent tool as the registered type.
- **The memo tool.** One tool registered with `$.tool.register` at `session.start`, behind the engine gate and only
  while the `reflect` option is on: `memo({ rule, why? })`, called as `mcp__kessoku-ultimate-bocchi__memo` and served
  by a `tool.call` hook. A valid proposal opens Nijika's existing memo card with status `open` and a new `by` field,
  so the byline reads "proposed by Bocchi mid-set"; there is no Haiku call (the rule arrives written); the tool's
  result tells the model the rule is held and nothing is written until the person presses Save. Reflect's own door
  stays as it is.

## User Stories

1. As a user, I want Claude to see Nijika, Ryo and Kita in its list of agent types, each with a line saying when to delegate to her, so that the model can pick a member when it delegates.
2. As a user, I want a spawn of `kessoku-ultimate-bocchi:ryo` to sit on Ryo's card whatever its description says, so that the panel shows the routing the model chose, not a keyword guess.
3. As a user, I want the toast for such a spawn to say it was seated by name, so that I can tell a chosen member from a guessed one.
4. As a user, I want a plain `general-purpose`, `Explore` or `Plan` spawn seated exactly as before, so that nothing that works today changes.
5. As a user, I want a Ryo act to be a read-only searcher with Bash and PowerShell, a Kita act to have only Read, Edit and Write, and a Nijika act to edit and run nothing, so that a slime's color means what the act can do.
6. As a user, I want each band type's last message to be self-contained and to state what it found or touched (Nijika's plan or verdict, Ryo's short lines with path:line evidence, Kita's list of files), so that the main loop can act on it.
7. As a user or a prompt that writes `kessoku:ryo`, I want the short spelling to work in the Agent tool, so that the band's names can be typed as the band calls them.
8. As a user on an engine without `$.agent.register`, I want the types simply absent and `/bocchi help` to say so, with every other feature as before.
9. As a user, I want Claude to be able to propose a rule itself when it catches itself breaking a convention, so that the rule is written down at the moment the mistake is understood.
10. As a user, I want the proposal on the same Nijika memo card, with the same Save, Global, Edit and Skip, signed "proposed by Bocchi mid-set" (or the member whose act proposed it), so that I know who drafted it and decide the same way.
11. As a user, I want nothing written to CLAUDE.md until I press Save, and the tool to tell Claude exactly that, so that the model never assumes a rule exists.
12. As a user, I want a proposal that is not one sentence under 140 characters sent back to Claude with the reason, so that the card only ever holds a rule worth saving.
13. As a user, I want a second proposal to wait behind the card on screen and come up once that card is answered, and the same rule proposed twice to be held once, so that two memos never fight over the card.
14. As a user who turned Reflect off, I want no memo tool and no proposals, so that one option governs both doors.
15. As a user of a session nobody is watching (a `-p` run), I want a proposal refused with the reason rather than held for a card nobody will see, so that the model says the rule in its reply instead.
16. As a user, I want the memo call's row in the transcript to carry Nijika's card title ("kessoku memo · proposed a rule"), so that the transcript says what happened.
17. As a user, I want `/bocchi memo proposed` to preview the signed card, and the typeahead and help to know the word, so that the new card can be seen without waiting for Claude.
18. As a user, I want my corrections to keep working exactly as before (looksLikeCorrection, one Haiku call, the same card), so that the new door adds and never replaces.
19. As a maintainer, I want the prompts, tool lists and the memo tool's words kept as data in `hooks/lib`, tested directly, so that they can be tuned without touching the hooks.
20. As a maintainer, I want `claude plugin validate`, `claude plugin test` and the type check to pass, and the README and backlog to say what shipped.

## Implementation Decisions

### Vocabulary

- A **band type** is an agent type this mod registers: `<plugin>:<name>` with `name` one of `nijika`, `ryo`, `kita`.
  Its **seat** is the member its name names. `seatOf(type)` reads `kessoku-ultimate-bocchi:<member>` (the engine's
  spelling) and `kessoku:<member>` (the short one), in any case; anything else has no seat.
- A **proposal** is one valid call of the memo tool: a checked rule, an optional why, the proposing member, a time.
  It is **held** while it is on the card or in the queue; it is **saved** only by the card's Save or Global.

### Band agent types (`$.agent.register`)

- Grounding: `AgentSpec { name, description, prompt, tools?, disallowedTools?, model?, effort?, permissionMode?, … }`;
  the type is `<plugin>:<name>`; the Agent tool dispatches it from the next turn on; a name registered again is
  replaced; the call rejects until the session binds, on a spec the schema refuses, and on a hook's deny; it answers
  `{ agent }`, the full name.
- `BAND_AGENTS` in `hooks/lib/band.ts`, one entry a member:
  - `nijika`: planning, review, triage, summaries; a numbered plan (one concrete action a step, files named, the risky
    step flagged) or a verdict first (ship it, fix first, rethink) with path:line findings; edits nothing, runs
    nothing. Tools: Read, Grep, Glob, WebSearch, WebFetch.
  - `ryo`: searches, shells, tests, lint, type checks, "find where X happens"; never creates, edits or deletes, and
    runs no command that changes the repository or the machine unless the task names that exact command; reports in
    short lines, the answer first, evidence as path:line or the command and its output. Tools: Read, Grep, Glob, Bash,
    PowerShell, WebSearch, WebFetch.
  - `kita`: edits scoped to named files, docs, README, UI copy; reads before she edits, stays inside the named files
    (and says so rather than guessing when the task needs more), prefers Edit to Write; ends with every file touched.
    Tools: Read, Edit, Write.
  - Every prompt opens with who she is and that she works as a subagent for the main agent (Bocchi), and ends with the
    same line: her final message is all the main agent sees, so it is self-contained, the substance first, one
    band-flavored line at most. No `model`, `effort` or `permissionMode` is set (the session's subagent default and
    the parent's mode), and CLAUDE.md is kept (Kita needs the project's conventions).
- `registerBand($)` runs at every `session.start`, before the screen work, so a headless run gets the types too; the
  names the engine answered are kept in module state (`bandTypes`, by member). A `TypeError` "not a function" switches
  the `agents` feature off for the session (help: `the band agent types (no $.agent.register)`); any other refusal
  leaves that one type out, nothing more.
- `memberFor` asks `seatOf` first; a seat wins over every keyword and type bonus. `agent.spawn` seats with it and its
  toast adds ` (seated by name: <type>)`; `classic.SubagentStart` and the agent-list reconcile use `memberFor` too, so
  an act first seen there lands on the same card.
- The short spelling: the engine resolves an agent type before any `agent.spawn` hook runs (live: a
  `$.agent.spawn({ subagentType: 'kessoku:ryo' })` is refused "Agent type 'kessoku:ryo' not found" before a hook could
  rename it). So the alias lives in the mod's general `tool.call` hook: an Agent call whose `subagent_type` has a seat
  and a registered name it does not already spell goes on to the tool as the registered name. A plugin's own
  `$.agent.spawn` uses the registered name.
- `/bocchi help` gains a line naming the three types and what each takes.

### The memo tool (`$.tool.register`, `tool.call`)

- Grounding: `ToolSpec { name, description, inputSchema?, isDeferred? }`, called as `mcp__<plugin>__<name>`; served by
  a `tool.call` hook on that name that answers `{ result }` (a call no hook answers fails); `{ deny }` refuses and
  the model reads the text as an error result.
- `MEMO_TOOL_SPEC` in `hooks/lib/reflect.ts`: the description the prototype drew (propose one durable rule for this
  repository's CLAUDE.md when you notice a convention you broke or had to re-learn; one imperative sentence under 140
  characters; the user decides and saves; never for a one-off instruction), plus "the call returns at once and
  nothing exists until then; never assume the rule was written" and "never to repeat what CLAUDE.md already says".
  Input `{ rule: string, why?: string }`, `rule` required, no other keys. `isDeferred: false`: the tool sits in the
  prompt's tool list (about 150 tokens), so the model knows the door exists without a ToolSearch.
- `registerMemoTool($)` at every `session.start`, only while `reflect` is on; the `memo` feature switches off on a
  missing call like the others. Turning `reflect` off later leaves the registered tool in place for the session; the
  hook then refuses every call.
- The hook is registered after the general `tool.call` hook, so the bookkeeping above it still runs (the task line
  reads `memo "<rule>"`), and its matcher is spelled as a literal so the host reads it off the source. Its `.catch`
  refuses ("Nijika dropped her pen").
- `proposeRule` decides, in order:
  1. `reflect` off: refused.
  2. `checkRule(rule)`: a string, one line, one sentence (a `.`, `!` or `?` followed by a space and a capital or a
     digit ends one, except after e.g., i.e., etc., vs, cf, approx), under 140 characters, with a letter in it; spaces
     collapsed, a list marker, a `rule:` prefix and a matched pair of quotes dropped, a full stop added when it ends
     without one. A refusal names the reason (`the rule reads as 2 sentences; propose one rule a call…`).
  3. No screen (no REPL and no attached client): refused, "say the rule in your reply instead".
  4. The same rule (ignoring case) already on the card or in the queue: answered "Already held".
  5. The card free: the proposal opens it, decided inside the write so two calls at once never overwrite each other;
     answered "Held for the user: Nijika's memo card is up…".
  6. Otherwise queued (five at most, then refused), answered "queued behind the memo already on screen (n waiting)".
  Every answer ends "Nothing is written until the user presses Save; do not assume the rule exists, and do not propose
  it again."
- `by` is the member of the act that called (`e.agentId`), Bocchi for the main loop.
- The queue is a new state key, `proposals` (`KessokuProposal[]`, oldest first), so it survives a hot reload.
  `showNextProposal` moves the oldest onto the card once the card is free: when a saved or skipped card clears, when
  a correction drafts no rule, and at the screen start after a reload. `/clear` forgets the card and the queue.
- The card is `drawMemo` as it was with one change: when the memo has `by`, the dim quote ("no, in this band we do it
  like this") gives way to `· proposed by <Name> mid-set`, the name in her color. Same buttons, same `saveRule`, same
  heading in CLAUDE.md.
- The tool row: the `ToolUse` render hook frames the memo call in Nijika's yellow with the title `♪ kessoku memo ·
  proposed a rule` (`proposing a rule` while it runs, `sent back` when refused) and a dim `· Nijika holds it for
  Save`. `toolCards: none` leaves it alone; `edits` keeps it (it proposes an edit to CLAUDE.md). `memberForTool` gives
  the tool to Nijika.
- Reflect's correction door is untouched: a correction still drafts with one Haiku call and replaces whatever card is
  up, as before (a proposal on screen at that moment is dropped; the queue behind it waits).
- `/bocchi memo proposed` previews the signed card; the typeahead offers `proposed` after `/bocchi memo`; the help
  lines name the tool, the preview and the band types; `/bocchi`'s argument hint reads `memo [proposed]`.

### State and data

- `types/index.d.ts`: `KessokuMemo` gains `by?: KessokuMember`; new `KessokuProposal { rule, why, by, at }` and the
  state key `proposals`. Module state: `bandTypes` and the two new feature flags (`agents`, `memo`), read again at the
  next `session.start`.
- `plugin.json` goes to `0.6.0`; its description mentions the subagent types, and the `reflect` option's description
  names the memo tool.

### A fix found on the way

- `classic.SubagentStart` checked for the act and then wrote a bare one (description = the type, no model, no task);
  the engine starts the subagent while the spawn's hook is still seating it, so the bare act could land over the
  spawn's. The check now happens inside the write. Live, the stop toast of a probe spawn read "Ryo stopped:
  kessoku-ultimate-bocchi:ryo" before and "Ryo stopped: Look into why the strip flickers on resize" after (twice).

## Testing Decisions

- **Pure parts, directly:** `seatOf` and `memberFor` (both spellings, any case, unknown names and plain types falling
  through to the tables); the shape of `BAND_AGENTS` (names the engine takes, a "Delegate" description, the
  subagent framing and the last-word line in every prompt, the tool lists: Nijika without writes or shells, Ryo
  without writes and with both shells, Kita exactly Read, Edit, Write); `MEMO_TOOL_SPEC`; `checkRule` (cleaning, the
  140 boundary, sentences, abbreviations, empty and non-string input); `memoAnswer`; `describeCall`; the typeahead.
- **At the seam** (the plugin test kit; bottoms answer `agent.register` and `tool.register` from memory and keep what
  they were asked): `session.start` registers the three types with their tools and the tool with its schema; a
  headless start registers them too, and `reflect: false` leaves the tool out and refuses a call; band spawns land on
  their member's card on the terminal and the desktop, a plain one on Bocchi's; the Agent tool receives the
  registered name for a short spelling and everything else as given; a proposal opens the card with its byline on
  both surfaces with no Haiku call and nothing written, a second waits (signed Kita when Kita's act proposed it), a
  repeat is already held, refusals say why, Save writes the rule under the band's heading, and the queued one takes
  the card once the saved one clears; the tool row's title on both surfaces; a session with no screen refuses, and
  the same call opens the card once a client attaches; `/clear` forgets; a refused registration breaks nothing; help
  names the types, the tool and the preview.
- The kit cannot stand for an engine that lacks a call (a bottom that throws is reported as a skipped hook, not as the
  call's `TypeError`), so the help line for a missing call is tested on `offLine` directly. Nor does it interleave
  hooks the way the engine does, so the SubagentStart fix was proven live and its test guards the end state.
- `claude plugin validate`, `claude plugin test` (67 tests) and the type check against the 2.1.299 declarations pass.

## Out of Scope

- Pieces C (portrait tiles for a narrow panel) and D (the first-run tour) of the same prototype page, and every other
  backlog row.
- A model, effort or permission mode per band type; hiding a type from the model (`agent.offer`); a Bocchi type (she is
  the main loop).
- Writing a rule without Save, polishing a proposal with a model call, showing a proposal's `why` on the card, or
  changing how a correction treats a card already up.

## Further Notes

- Live check, 2026-10-18, against the bundled `claude.exe` 2.1.299 in print mode with `--plugin-dir` on this branch
  (the user-scope install switched off for the run with `--settings`), plus a throwaway probe plugin whose `/probe`
  command drove the engine without a model turn:
  - the session's init listed `kessoku-ultimate-bocchi:kita`, `:nijika` and `:ryo` among the agents and
    `mcp__kessoku-ultimate-bocchi__memo` among the tools;
  - `$.agent.spawn` of `kessoku-ultimate-bocchi:ryo` with "Look into why the strip flickers on resize" (no keyword
    would seat it) toasted "Ryo takes the stage: … (seated by name: kessoku-ultimate-bocchi:ryo)"; the spawn,
    SubagentStart and turn.complete carried one agent id;
  - the short `kessoku:ryo` was refused by the engine before any spawn hook ran, which moved the alias to the Agent
    tool's `tool.call`;
  - the memo tool was served by the mod's hook: with no screen it refused ("nobody is at a screen to press Save"), and
    a two-sentence rule came back with the reason;
  - a plugin may not run the Agent tool through `$.tool.call` ("that is $.agent.spawn (host check)").
- Not checked live: a model turn. The bundled CLI is not signed in outside the desktop app, so the model's own Agent
  call with the short spelling, and the memo card on a real surface with Save, are covered at the kit's seam only. To
  see them in the desktop app, install this branch (the `kessoku-mods` marketplace points at the main checkout), start
  a session, ask "have Ryo find where drawStrip is defined" and watch the act land on Ryo's card; then ask Claude to
  propose a rule through the memo tool and press Save.
- The prototype and the backlog called the types `kessoku:nijika`; the engine names a plugin's type after the plugin,
  so the listing shows `kessoku-ultimate-bocchi:nijika`, and the short spelling works through the alias.
