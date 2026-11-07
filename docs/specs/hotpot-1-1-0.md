# Spec: Hotpot Night, the v1.1.0 release

Status: implemented · written 2026-10-31, revised 2026-11-01, built 2026-11-01 and 2026-11-02 · triage: `done`

Design brief: the throwaway page `npm run proto:1.1.0` in `studio/` (`studio/scripts/proto-1-1-0.mjs`, written to
`studio/out/proto/1.1.0.html`), kept on the branch `prototype/hotpot-night-1-1-0` (last at `39f8034`) and not for
merging; its seated band is a stand-in, not how the release's art is made ([Art](#art-the-studio)). Chosen: variant
A "Nabe Night" (one scene that is itself the gauge) alone, with its own wooden board under it (the state in a word,
then the prices). Not chosen: B's tablet of figures (its hit rate, saving and tax paid move to the bill, its re-order
price to the wooden board); B's conveyor of plates and C's pot clock go to the backlog (both are drawn on the branch's
first commit, `771438d`).

Grounded in the engine's own declarations (`claude-code.d.ts` as Claude Code 2.1.308 writes it; 1.0.1 was checked on
2.1.299, and on 2026-10-31 it still validates, type-checks and passes its 104 tests on 2.1.308): `turn.step` is the
one per-request event, and its result carries `usage` (input, output, cache read, cache creation, and the model) for
the main loop and, with `agentId`, for subagents; `$.model.fork` answers `nothing-to-fork`, with no request made,
until a turn of the conversation has run to its end, again after `/clear` or a fresh resume, and on a host that keeps
no snapshot; `$.session.compact` is the call `/compact` makes, and `$.prompt.fill` puts text in the prompt box;
`classic.SessionStart` on a resume or fork carries `model`, `seconds_since_last_response`, `context_tokens` and
`prompt_cache_likely_expired`, each optional; `classic.PostModelSwitch` declares every field on every source, `resume`
included; `Svg` takes no `key` and no `onPress`; `Text` takes `size`, `weight` and `tabular`. Every hook below, and
every call 1.0.1 already makes, exists in 2.1.299 too; the two new calls, `$.session.compact` and `$.prompt.read`,
were read only in the 2.1.308 declarations (the 2.1.299 ones are no longer at hand), and both are gated (`compact`,
`draft`; The actions); 2.1.287 to 2.1.298 are not checked. The release hooks no event 2.1.308 added (`prompt.change`,
`ui.view`), and its one new hook, `classic.SessionStart`, is in the classic union with the `classic.PostModelSwitch`,
`classic.SubagentStart` and `classic.SubagentStop` hooks 1.0.x has under the same floor, so the engine floor stays
2.1.287 (`MIN_ENGINE` moves to 2.1.299 if a load on an older engine refuses the module).

## Problem Statement

1. **The cache shows only when it bites.** Cache Tax speaks twice: a notification shortly before the cache goes
   cold, and the hold once it has. In between, the cache is a few characters on the chalkboard's foot
   (`warm, 48m left`), the terminal's rail and strip (`☀ warm 48:00`, `cache warm 48:00`) and the desktop sign
   between sets, only as fresh as the last redraw (nothing redraws while the TTL runs down in an idle session); what
   a cold send or keeping it warm would cost is a `/cache-tax` away.
2. **What is kept about the cache does not add up.** The mod keeps when the cache was last warmed, the context size
   and three ping counters (how many, how many found it cold, one dollar figure; the pings' tokens are dropped). Each
   act of the band, the main loop's included, sums its steps' tokens (`band.agents[].usage`), but past 24 acts the
   oldest ended ones go with their totals, an act keeps only its last model (so its tokens cannot be re-priced across
   a model switch), and every cache write is priced at the five-minute rate, 1.25×. Nothing books what Cache Tax cost
   (the hold's `heldUsd` is an estimate), so no reliable hit rate or saving can be shown.
3. **Managing it means typing.** `/keepwarm 2h`, `/keepwarm off`, `/compact`, `/clear`; and there is no way to
   refresh the cache on demand, or to pay a re-write on purpose before coming back to a cold session.
4. **What the mod knows is often wrong.** The TTL is assumed to be an hour until a model switch says otherwise (a
   plain-API-key session's five-minute cache reads warm for 55 minutes after it lapsed), a model switch that forfeits
   the cache can leave it reading warm, a resumed session reads as "nothing cached yet" (a new process) or as the
   conversation it left (an in-process `/resume`, whose `session.end` the mod ignores), an interrupted turn marks the
   cache warm, and a background report pays a cold re-write that no one sees.

## Solution

- **♨ Hotpot, a pane.** `/hotpot`, or the ♨ Hotpot button (`o`) on the strip and under the band's chalkboard, opens
  the band's after-show hotpot in an izakaya room: a donabe on a gas stove in the middle of a square low table,
  Bocchi and Nijika at its left edge, Ryo and Kita at its right, all four facing us. Warm, they eat, and the pot and
  the platter in front of it empty as the TTL runs down; the last minutes are last orders; cold is an empty pot, a
  dead flame and snow, Bocchi in her box. Keepwarm puts Nijika in charge, ladling broth in at each ping; a send
  Cache Tax holds is the slip landing on the table; a compaction is zosui
  ([The feast, state by state](#the-feast-state-by-state)). The scene is the gauge: it changes when the warmth steps
  a level or the state changes, never on a clock.
- **The wooden board under it.** The state in a word and its tail, in whole minutes (`♨ Bubbling`
  `51m of feast left`, `Last orders!` `cold in 3m`, `❄ Gone cold` `14m ago: the next send re-orders everything`),
  then the context and its prices (`168k on the table · a re-order ≈$1.34 · a top-up ≈$0.03 · a day of keepwarm
  ≈$0.83 · keepwarm off`).
- **Feast actions.** Keep the fire on (30m, 1h, 2h, 6h) or let it cool (`/keepwarm`), top up now (one ping, new),
  re-heat now (a re-write paid on purpose while cold, new), zosui (compaction), clear the table (`/clear`), the bill,
  close. Each that spends says its price before it is pressed (zosui, unpriced until it has run, says that it sends
  a summarizing request), and zosui and clear the table say what they do to the cache (the next send writes the
  smaller pot, or a fresh one).
- **The bill.** A receipt of the conversation's cache: reads, writes, the tax, the pings, the re-heats, the
  compactions' summarizing requests, the net saving, the hit rate overall and by member, and a day of keepwarm next
  to one re-order.
- **A ledger.** Every model request of the main loop and of the band's seated acts, every keepwarm ping, top-up and
  re-heat, and each compaction's summarizing request is booked (tokens and cost, the cache writes at the TTL's write
  rate), so the bill is counted, not guessed.
- **The cache's truth.** The TTL comes from the Cache TTL option when it is set, else from Claude Code, else from what
  the steps and the mod's own pings show, and is kept for the session (across reloads, `/clear` and an in-process
  `/resume`); a model switch other than a resume's empties the pot, a resumed session knows its pot, the cache warms
  from the start of a main-loop step (an act's steps never warm it), and cold means one thing everywhere.
- **The terminal** gets the same pane in cells: the four mini heads seated round a half-block pot (Bocchi above
  Nijika at its left, Ryo above Kita at its right), the wooden board's two lines as text and the keys; kaomoji mode
  gets the faces.

## User Stories

1. As a user, I want to see at a glance how warm the prompt cache is, so that I know whether coming back now costs a
   re-write.
2. As a user, I want the warmth shown as the band's feast running down, so that I notice the cache before it costs me.
3. As a user who stepped away, I want a cold cache to look cold, so that Cache Tax is never a surprise.
4. As a user, I want the scene to follow the clock while I leave the pane open and the session idle, so that what it
   shows is never stale.
5. As a user, I want the price of a re-order next to the price of keeping the cache warm, so that I can tell whether
   keepwarm pays.
6. As a user, I want to start keepwarm with one press and a length, so that I do not have to type `/keepwarm 2h`.
7. As a user, I want to refresh the cache now, so that a long read or a meeting does not let it lapse.
8. As a user coming back to a cold session, I want to pay the re-write on purpose before I type, so that my next
   prompt starts warm and nothing is held.
9. As a user, I want the conversation's hit rate and what the cache saved, so that I can see the cache working.
10. As a user, I want what Cache Tax actually cost, so that its warnings have a number behind them.
11. As a user, I want a receipt of the cache's reads, writes and pings, overall and by member, so that the money adds
    up.
12. As a user, I want compaction and `/clear` one press away, with what each does to the cache said, and compaction
    asking twice, so that I shrink or drop the feast only on purpose.
13. As a user, I want the buttons that spend money to say what they will cost (a compaction, which has no price until
    it has run, says that it sends a request), so that I never pay blind.
14. As a user on a plain API key, I want the pane to learn from the lapses it sees that my cache lives five minutes
    (the first shows `TTL 5m?`, a second settles it), so that from then on it never shows a full pot over a cold
    cache.
15. As a user who resumes a session, I want the pane to know how long ago the last answer was, so that it shows the
    pot I am really coming back to.
16. As a user in a terminal, I want the same pane in cells, so that the feature is not desktop-only.
17. As a user with reduced motion, I want the steam, bubbles and flames still, so that the pane is calm.
18. As a user, I want the pane to cost nothing while it is closed, so that it never slows a session.
19. As a user, I want the feast drawn in the band's own pixel style, so that it belongs beside the stage.

## Implementation Decisions

### Vocabulary

- **Hotpot**: the pane (`kessoku-hotpot`). **Feast**: its scene. **The wooden board**: the two lines of text under
  the feast, always named in full. **The chalkboard**: the band panel's board; its foot, **the chalkboard's foot**,
  shows the cache today. **The bill**: the receipt the pane opens (`b`); the one drawn on the table during a Cache
  Tax hold is **the slip**.
- **Warmth**: the share of the TTL left since the cache was last warmed: 1 just warmed, 0 cold.
- **Level**: the feast's step: 5 (more than 84 % left) and 4 (more than two thirds) a feast, 3 simmering (more than a
  third), 2 running low, 1 last orders (the cold notice's window: the last `min(5 min, TTL/2)`), 0 cold.
- **Top-up**: one keepwarm ping sent on demand. **Re-heat**: a ping sent on purpose to a cold cache, which pays the
  re-write.
- **Ledger**: what the mod books about the cache, per conversation. **Step**: one model request, as `turn.step`
  reports it.

### The feast, state by state

The table is square and seen from its empty side: Bocchi (far) and Nijika (near) at its left edge, Ryo (far) and Kita
(near) at its right, each from the waist up, her body turned 30° to 45° toward the pot (about 35°: past 45°, under a
face to us, it reads as a twisted neck) and her face to us; the table's side edges hide their laps. Eating, they look
at the pot, but for the bite (the eyes at us as the chopsticks reach the mouth), the chewing (`happy`) and a blink;
reacting (last orders, a held send), at us on every beat. How each is drawn is Art's and The drawing's; the table
below gives what each state shows.

| The cache | The feast |
| --- | --- |
| nothing cached yet (`none`, `cleared`) | the table set, the platter full (as the context fills it), the lid on the pot, the stove out; all four wait, hands on the table; Nijika: `What shall we order?` (after `/clear`, Kita: `Fresh table!`) |
| level 5 and 4 | a bubbling pot, steam, the platter as full as the context fills it; Bocchi eats shyly and Ryo fast, Nijika serves with her ladle, Kita leans in to photograph the pot (a flash, sparkles); Kita: `So photogenic!`, Ryo: `Seconds.` |
| level 3 | simmering: half the food, slower chopsticks; Nijika: `Plenty left!` |
| level 2 | the last few pieces; Bocchi: `It's going…` |
| level 1, keepwarm off | last orders: a LAST ORDER sign goes up, the flame sputters, one piece of meat is left; all four look up at us, Ryo's chopsticks still at it: `That one's mine.`, Bocchi sweats |
| cold | an empty, frosted pot, no flame, blue light, snow, gloom lines; Bocchi in her box under a rain cloud, Ryo chewing a weed, Nijika and Kita slumped with melting faces; Nijika: `It went cold…`, Ryo: `…grass.` |
| keepwarm on | Nijika wears the nabe-bugyō headband (switched on, it is on: `Nabe-bugyō, reporting!`) and the stove's knob glows; at level 1 she has the pot: `Leave the pot to me!`; cold, she slumps over the empty pot, the headband still on: `The next order warms it.` |
| caching off (`off`) | the lid stays on, the platter full (as the context fills it), all four waiting as before the first order; no line |
| a ping warms the pot (keepwarm's or a top-up) | Nijika ladles broth in (broth spilling over her ladle cup's lip into the pot, a ripple stepping out where it lands): `Topping it up~`; the food comes back to level 5 |
| a re-heat warms the pot | the flame and the food come back to level 5; Bocchi leaves her box: `I-it's warm again…` |
| a send held by Cache Tax | the slip on the table with the re-write's price and a warm turn's; all four look up at us, Bocchi in a seated panic, hands up; Kita: `The BILL?!` |
| a held send is paid | the slip goes and the feast comes back, staying while the re-sent turn's first step runs (until it books the cache warm); Bocchi: `…paid.` |
| compacting | zosui: rice and egg swirling in the broth, heavy steam, the four eating it; Nijika: `Zosui time!` |
| context size | the platter holds about half its pieces under 40k tokens, two thirds to 120k, all from 120k, and a meat tower on top from 250k; full before the first order and while caching is off, the pieces go as the level drops, none left from last orders on |

One speech line shows at a time, two alternating every 3.5 s where a row names two; the first shows by default and
only the second's turn is animated, so reduced motion keeps the first. One-shot moments (a ping, a re-heat, keepwarm
switched on, a paid re-order) last 2.4 s; a paid re-order's feast stays drawn after it until the re-sent turn's first
step books.

### The pane (`kessoku-hotpot`)

- Opened by `/hotpot` (a toggle), the ♨ Hotpot buttons (`o`) and `/bocchi hotpot` (the same, for the typeahead):
  `$.ui.open({ id: 'kessoku-hotpot', title: '♨ Hotpot', focus: true, closeOnEscape: true, rows: 28, columns: 74 })`
  after `reopenSprites`: 28 rows hold the picture, the wooden board and the buttons inline (the bill scrolls); 74
  columns are the half-block tier's, which a dock (at most 45% of the terminal) gets only from about 165 terminal
  columns, a narrower dock drawing quadrants. Closed by Esc, `Close` (`c`), the panel's ♨ button again (the strip's
  shows only while the Hotpot is closed), `/hotpot` again or the person; always by id.
- `/hotpot` is registered `immediate: true` (its handler only toggles the pane, or with no screen prints one line), so
  typed during a turn it opens at once, as an asked open. An unplaced open (no surface places panes, `/bocchi hotpot`
  run from the queue) draws above the prompt (`inBand: !placed.isPlaced`).
- `focus` is granted only while the prompt holds the keys over an empty composer: `/hotpot` typed at the prompt gets
  the keyboard, a ♨ press does not (the band or the panel keeps it; on the panel `b` stays Bocchi's solo).
- State: a new atom `hotpot: KessokuHotpot`: `isOpen`, `inBand`, `isBillOpen`, `pick` (keepwarm's length, initially
  the **Keepwarm default** option), `armed: { action: 'reheat' | 'zosui' | 'clear'; at } | null` (one 10 s window for
  all three), `moment: { kind: 'ping' | 'reheat' | 'keepon' | 'paid'; until } | null`, `note: { text; until } | null`
  (The actions' "What a press says") and `sample: { model; tokens; ageMs; heldAt } | null` (the `/bocchi tax`
  preview's model, size and age, stamped with its hold's `heldAt`; its age the cache's only once it has gone cold,
  else two TTLs back, so the card reads as a real hold would; The cache's truth). A separate atom (as the
  tour's), so no older value needs a filler. The `ui.close` hook sets `isOpen` and `inBand` false and clears `armed`,
  `moment` and `note`, keeping `pick`, `isBillOpen` and `sample`; `/clear` and an in-process `/resume` clear `armed`,
  `moment` and `note` and keep the rest; `startUi` reconciles it with `$.ui.panes()`.
- Above the prompt it ranks with Replay, the tour and the file tree (opened pages), before the panel, even with the
  strip hidden. Cache Tax still wins the band; during a hold the pane's feast shows the slip (the bill opens only with
  `b`) while the card holds the band.

**Desktop, VS Code and mobile** (with **Character art** on `sprites`), top to bottom:
1. The feast: one `Svg` image (no `isInteractive`, so it scales to the pane's width) in a keyed Box `hotpot-scene`,
   alt `the band's hotpot · <state words>` (`· bubbling, 51m left`, `· last orders, cold in 3m`, `· cold for 12m`,
   `· the bill: re-order ≈$1.34`, `· re-ordering, 304k tokens being written back`, `· zosui`, `· the table is set`),
   declared at 4× its 288×184 viewBox.
2. The wooden board: a Box painted dark wood (`#3a2419`), two lines of native Text (no Svg) in its own cream colours,
   which a light theme does not darken. Its state tails show no clock times and count whole minutes (a note in a
   tail's place may name a time for its 6 s: The actions' rate limits), so an open pane redraws once a minute (a
   redraw is `$.ui.invalidate`, which redraws every drawing).
   - The state in a word (semibold, `heading` size) and its tail: `♨ Bubbling` `51m of feast left` (`Simmering` and
     `Running low` take the same tail); `Last orders!` `cold in 3m`; `Nijika has the pot` `she tops it up in 2m`
     (only while keepwarm can ping: armed but held back it keeps nothing, and the board says `Last orders!`);
     `❄ Gone cold` `14m ago: the next send re-orders everything`, and while a paid re-order's turn runs over the cold
     cache `♨ Re-ordering` `your prompt writes 304k tokens back into the pot`; `The bill came` `your prompt waits:
     re-ordering costs ≈$1.34`; `〆 Zosui` `compacting 168k tokens` (as it lands, the note `168k → 40.0k tokens`,
     counted as every token count is); `The table is
     set` `the first order warms the pot` (`none`); `A fresh table` `nothing cached yet: the next prompt is the first
     order` (`cleared`); `No cache here` `prompt caching is off`.
   - The context and the prices: `168k on the table · a re-order ≈$1.34 · a top-up ≈$0.03 · a day of keepwarm
     ≈$0.83 · keepwarm off` (or `keepwarm 5h12m · 3 pings ≈$0.10` while it runs, its pings counted with the top-ups
     as the bill counts them); then, only while the TTL is unsettled, `· TTL 1h?` while it is assumed or `· TTL 5m?`
     after a first five-minute sighting; then a dim button's reason (the reasons are The actions'); then, in the
     terminal until the pane holds the keys (`isFocused` false), `ctrl+x tab for its keys`. The TTL in force and a
     day of keepwarm at five minutes are on the bill's `A day of keepwarm` row. During a Cache Tax hold the line is
     instead `your prompt is back in the box: Enter pays and sends it, Start fresh puts /clear in its place`; where
     the box could not take the prompt back, `your prompt could not go back in the box: your next send pays and sends
     it, Start fresh puts /clear in the box`, ending `type /clear to start fresh` once no box is bound.
3. The buttons: native Buttons, letter hotkeys only, each under a fixed key that the focus ring, a second press and
   the tests follow while its label changes (live prices, armed words):
   - `Keep the fire on · <pick> ≈<price>` (`w`, `hotpot-keep`; `Keep the fire on · 2h ≈$0.07`: priced as a day of
     keepwarm is, over `pick`), then `30m`, `1h`, `2h`, `6h` (no hotkeys; `hotpot-pick-30m`, `hotpot-pick-1h`,
     `hotpot-pick-2h`, `hotpot-pick-6h`) setting `pick`; while keepwarm runs, `Let it cool (keepwarm off)` (`w`,
     `hotpot-keep`).
   - `Top up now ≈$0.03` (`t`, `hotpot-topup`) while warm, adding `(≈$0.84 if the cache lives 5m)` while the TTL is
     assumed and the cache was last warmed over 5 minutes ago; while cold, `Re-heat now ≈$1.34` (`t`, `hotpot-topup`),
     which arms on the first press (`Press again: re-write ≈$1.34`) and runs on a second within 10 s.
   - `Zosui (compact) · the next send writes the smaller pot` (`z`, `hotpot-zosui`), which arms on the first press
     (`Press again: compact <168k> tokens · one summarizing request`) and runs on a second within 10 s.
   - `Clear the table (/clear) · the next send writes a fresh pot`, ending `· keepwarm stays on` while keepwarm runs
     (`f`, as the Cache Tax card's `Start fresh`; `hotpot-clear`; over a draft it arms first, as The actions says).
   - `The bill` / `Close the bill` (`b`, `hotpot-bill`); `Close` (`c`, `hotpot-close`).
   - During a Cache Tax hold the row is the card's, then the pane's own two: `Keep it warm after (<pick>) ≈<price>`
     (`w`, `hotpot-tax-keep`), `Start fresh (/clear)` (`f`, `hotpot-tax-clear`), `Dismiss` (`d`,
     `hotpot-tax-dismiss`), `The bill` (`b`) and `Close` (`c`) as above. The card's own `Keep it warm after` takes the
     same label and press, so both arm one length; `Start fresh` replaces the held prompt in one press, on purpose, as
     the card's does.
   - A button that cannot act now is drawn dim (`dimColor`, no `variant`) with an `onPress` that spends and arms
     nothing (Button requires one and has no disabled state), so its hotkey does nothing; the wooden board says why.
4. The bill, when open: `お会計 · this conversation's cache` (not the session's: the ledger starts over at `/clear`
   and `/resume`), then Text rows (label, detail, figure) as [The bill](#the-bill) lists them, on the wooden board's
   paint in its own inks (the figures light green or rose for good and bad), never the theme's: the pane's wall stays
   near-black on a light theme, where the theme's text would vanish.

**Terminal**: one Raster keyed `hotpot-scene` (70×34 pixels) seats the mini heads at the pot's corners as at the
desktop's table, Bocchi above Nijika on the left and Ryo above Kita on the right, the table and the pot in the 38
pixels between. The pot (broth and food by level) uses the desktop props' pixel helpers at its own size (the desktop's
is 80 pixels across), on opaque backdrop cells so the cold blue reads on a light terminal. Half blocks (70×17 cells)
need 74 body columns and 24 body rows (the picture, the wooden board's two lines and the buttons); quadrants (35×9
cells) need 36 columns; narrower, text alone. The heads take the mood minis by phase: happy at `feast` and `zosui`;
focused at `simmer`, `low` and `tend` (Nijika happy at `tend`) and, as the desktop's `wait`, at `none`, `cleared` and
`off`; anxious at `last`; panic at `held`; at `cold` Bocchi hides (her box), Nijika and Kita melt and Ryo is anxious
(her deadpan `(-_-)`; her `hiding` is a box too, and the cold gives the box to Bocchi alone). Then the wooden board's
two lines as text, the buttons and the bill, as on the desktop.

The pot rides with the heads: `LiveSprite` and `composite` take an optional still backdrop (`under`, the pot's
pixels) that every repaint composites first, so the sprite clock repaints the heads over the pot and the pot changes
only with a redraw (one picture, as the heads sit at its corners). HOTPOT joins `isLastingSite`, so repaints refused
while it is off screen go on being retried every second for as long as it is open, not given up after a minute, and
its Pane hook calls `beginSprites` (the open follows `reopenSprites`; `closeHotpot`'s `dropSprites` lets the heads
go, as does the `ui.close` hook's: the mod's own `$.ui.close`, from `Close` or a ♨, raises no `ui.close` hook of the
mod's). The Hotpot never opens on its own (no `session.start` open, no timer); its one unasked open, `/bocchi
hotpot` run from the queue, waits undrawn below 144 columns (110 for an id opened before) and meanwhile draws above
the prompt, as above.

**Kaomoji**: the terminal's layout with no Raster or Svg, on every surface: each member's own face for the mood her
mini would show (`MEMBERS[m].faces[mood]`; Bocchi's are `(≧▽≦)`, `( •_•)♪`, `` (;´Д`) ``, `[(._.)]`, `(ﾟДﾟ;)`), at
the pot's corners as the minis sit, and the pot between them as a text gauge of its level (`♨ ▰▰▰▱▱`; cold
`❄ ▱▱▱▱▱`, in the theme's red in a terminal and a fixed one on the other surfaces' near-black wall).

### Redraws

- The scene's source is memoised on `[width, phase, level, keepwarm, platter, held, compacting, moment]` (no clock
  inside; `moment` by its kind; `platter` the context's step as The feast's context row gives it: under 40k, to 120k,
  to 250k, from 250k) and, while a send is held, the slip's figures as printed (the re-write's price, the
  warm turn's, the tokens): a redraw that changes none of them sends the same string, so the animations never
  restart.
- While open, the pane schedules its redraws through the mod's tail timer (`scheduleTail`) at the time `hotpotDue`
  gives. A pure `warmthDue(cache, now, ttl)` returns the soonest of the next level step, last orders
  (TTL − `min(5 min, TTL/2)`), cold (TTL), the next whole minute of what the strip, the rail and the chalkboard's
  foot count (the time left, and the time since it went cold while that is counted in minutes), keepwarm's end and a
  hold's end (`heldAt` + 15 min, where their held words go). A pure `hotpotDue(cache, hotpot, now, ttl)` returns the
  soonest of that, a moment's end (`moment.until`), a note's end (`note.until`), an armed window's end (`armed.at` +
  10 s, so `Press again: …` goes back on time) and the next whole minute of each count on the wooden board (the time
  left or since it went cold, keepwarm's time left, the next ping).
- `drawPanel` and the strip's drawings hand `scheduleTail` `warmthDue` too, whether or not the Hotpot is open (one
  timer serves them all), so an idle session's counts stay fresh with the Hotpot closed. The Cache Tax card, which
  takes the band's place during a hold, hands it its hold's end itself.
- The strip (the desktop sign and both terminal strips, after `cache `), the chalkboard's foot and the rail read one
  phase function (below), so they never disagree: `ampOf` and the rail take their words from `feastOf`, and
  `panelView` takes its flags (false when left out). `amp.words` is the strip's words below, counted as `ampText`
  counts (`under 1m`, `48m`, `5h 12m`), and `ampText` goes. The rail counts whole minutes too (`48m`, not
  `fmtDuration`'s `48:00`), so the once-a-minute redraw keeps it right. `amp.kind` keeps its four values, by the
  warmth alone: `none` with nothing cached, `cold` once lapsed (keepwarm on or not), `keepwarm` while warm with
  keepwarm on, else `warm`.

| Phase | The strip and the chalkboard's foot | The rail |
| --- | --- | --- |
| `none`, `cleared` | `no cache yet` | `○ no cache yet` |
| `off` | `no cache here (caching off)` | `○ caching off` |
| `feast`, `simmer`, `low`, `tend` | `warm, 48m left` (`kept warm, 5h 12m left` while keepwarm runs; armed but held back, `warm, 48m left · keepwarm waits`) | `☀ warm 48m` (`● keepwarm 5h12m`; held back, `☀ warm 48m`) |
| `last` | `last orders, cold in 3m` (`· keepwarm waits` while it is armed but held back) | `☀ last orders 3m` |
| `cold` | `cold for 12m` (`cold for 12m · keepwarm on` while it is on) | `❄ cold` (`❄ cold · keepwarm on`) |
| `held` | `cold for 12m · a send is held` (over a warm pot, which only `/bocchi tax`'s preview holds, `warm, 48m left · a send is held`; with nothing cached, `a send is held`) | `❄ cold · held` (`☀ warm · held`; `○ no cache · held`) |
| `zosui` | `zosui (compacting)` | `〆 zosui` |

### The phase function (`hooks/lib/hotpot.ts`)

`feastOf(cache, now, ttlMs, flags: { held, compacting, cleared, cachingOff, keepwarmHeld })` returns
`{ phase, level, leftMs, ageMs }`. Its phases, first match wins: `zosui` while compacting, `held` while a send is
held, `off` while caching is off, `none`/`cleared` with nothing cached, `cold` once lapsed, `last` or `tend` (keepwarm
on, lasting until its ping at TTL − 90 s, and able to send it) in the cold notice's window, else
`feast`/`simmer`/`low` by warmth. `keepwarmHeld` is keepwarm armed with no ping able to go, as keepWarmTick's own
guard has it: the fork gate shut, the pings stopped after a second 429, no snapshot, caching off, `contextTokens` under
1,000, no minute tick (nothing can draw), or a main-loop turn running through the cold notice's window (one in flight
or a 429's retry still keeps the pot); it keeps nothing, so last orders stay `last`. `level` is 5 for `zosui`; 0 for
`held`, `off`, `none`, `cleared` and `cold`; 1 for `last` and `tend`. Cold means `now − lastWarmAt ≥ TTL` everywhere:
`isColdRoom` (`≥`) and `warmth`, `ampOf` and `coldWatch`'s notice (`left ≤ 0`) have it, keepwarm (`age > ttl`),
the rail, the hold and `/cache-tax`'s face (`>`) move to it, and all take it from `feastOf`. `hotpot.ts` is a leaf
with no value imports from `stage.ts` (whose `ampOf` calls `feastOf`).

### The ledger (`ledger: KessokuLedger`, `hooks/lib/hotpot.ts`)

- **Judged** against **P**, the prompt tokens of the main loop's last request: set by each main-loop step to its
  input + cache read + cache write (but not by one that ran server tools), by `session.measure` to `context.tokens`
  after each main-loop turn when present, and by a compaction to its `tokensAfter`; the context until then.
  - A main-loop step is **warm** when it read 0.9 × P or more, **cold** when it read under 0.5 × P and wrote 0.5 × P
    or more, **cacheless** when it read and wrote nothing (three in a row turn caching off, under The cache's truth),
    and **partial** otherwise; one that ran server tools is booked but not judged. Only warm and cold steps can be
    the TTL's evidence, on the stricter terms under The cache's truth; a partial one never is.
  - A fork (keepwarm's ping, a top-up, a re-heat) sums its completions and is judged by its write: a ping or top-up
    that wrote 0.1 × P or more is a **miss**. A fork moves `lastWarmAt`, never back, to the clock read just before
    `$.model.fork` was called, only when its read and write together (any arm's) come to 0.9 × P or more, the prefix
    re-written or read and so refreshed, and it lands while the fork gate is open (The actions). A re-heat has worked
    only when it moved `lastWarmAt`.
- **Booked**:
  - every `turn.step` with usage, the main loop's (`agentId` absent) and each seated act's, into the totals and its
    member's (the main loop's is Bocchi's), skipping `demo-` acts and ids the band has not seated (the engine's own
    compaction and memory forks, a stalled workflow agent's retry, an act trimmed past 24; a workflow's agents are
    seated, as `agent.spawn` raises them); priced at capture with `priceInfo(usage.model)`, the cache write kept at its
    base (the tokens × that model's input price) and drawn at the TTL's write rate in force (2× input at one hour,
    1.25× at five minutes, never `costOf`'s flat 1.25×), as every write below is;
  - every keepwarm ping, top-up and re-heat, as `ping`, `miss` or `reheat`: the fork's usage, priced at the cache's
    `model`, from every arm that carries it (answered, `empty-reply`, and what an `api-error` or `aborted` fork spent
    before it failed); `nothing-to-fork` books nothing;
  - the summarizer's usage, priced at the cache's `model`, from the main loop's compaction that stands and from a
    `precompute` dispatch, which the `session.compact` hook now reads without drawing zosui (a compaction that reuses
    that summary carries no usage);
  - **the tax**: a main-loop step, at any index in its turn, that is cold or partial and began a TTL or more after
    `lastWarmAt` (above 0; five minutes while the TTL is only assumed, the step's own write being the proof: a test of
    the booking, apart from `feastOf`'s cold), but not one taken as a switch no hook reported (The cache's truth). Its
    tokens, the shortfall P − its cache read (at most its cache write), are priced at the write rate, and the warm
    cost they replaced at the cache-read rate; the rest of its write is an ordinary write. Held or not, it is booked,
    as **mid-turn** when it is not its turn's first step, else as a **silent re-order** when no person sent the turn
    (a background act's report, a scheduled prompt). A turn is a person's when the last prompt sent while idle (no
    `turnId`) came from a person (`isPersonPrompt`), as `prompt.submit` records it for the next main-loop `turn.start`
    to take; with none recorded, it is not. Keepwarm misses and re-heats are not tax: they keep their own rows, and
    the tax is a part of the steps' writes.
- **Kept**: running totals over the booked steps (steps; input, cache read, cache write and output tokens; their costs
  at each step's own prices, the cache write's as its base; the cache read's base), the tax (count, of which silent
  and mid-turn, tokens, cost, the warm cost it replaced), pings (count, misses, cost), re-heats (count, cost), the
  summarizer (count, cost) and totals by member (read, write, input); P; the turn's origin; the engine's price per
  token; for The cache's truth, the run of consecutive cacheless main-loop steps, the learned TTL and its pending
  five-minute sighting (its time), the model and effort of the request that last warmed the pot, and the last
  main-loop step's model; `canFork` (the fork gate, under The actions); `cleared` (set by `/clear` until a main-loop
  step warms the cache again: `feastOf`'s flag and the `the table was cleared` wording); `since`; the last step's
  time. Nothing in it grows with the conversation: at most about a kilobyte.
- **Reset** with the conversation, all but the learned TTL and its pending sighting, by `/clear` and by an in-process
  `/resume` (`session.end` with reason `resume`, handled as the `/clear` branch but for setting `cleared`: the cache,
  keeping keepwarm, the band, the mood, the solo, Replay, the file lights, the memo, the proposals and the recap; the
  hotpot atom as under The pane). A compaction keeps all but P (its `tokensAfter`), `canFork` and the cacheless run.
- **The figures**, pure:
  - prompt tokens = input + cache write + cache read, over the main loop's and the acts' steps (pings, re-heats and
    the summarizer excluded); **hit rate** = cache read ÷ prompt tokens; **Cache Tax paid** = the booked tax's cost;
  - **saved by the cache** = cache read × (input price − cache-read price) − cache write × (write price − input price)
    − the pings' and re-heats' cost, each step at its own model's prices. It can be negative early in a conversation,
    and the bill's row then reads `cost $0.12 more` in red. The summarizer's cost is outside the hit rate and the
    saving (the bill's `Compaction` row);
  - **a re-order** = the context × a cache write's price per token: the engine's (`engine: { perToken, model }` in
    the ledger) while the cache's `model` is the one it priced, else the TTL's list write rate; `coldWriteUsd`, and
    so the hold, the card, the cold notice and `/cache-tax`, take it. The engine's price is
    `classic.PostModelSwitch`'s `estimated_cache_write_usd` ÷ `context_tokens`, taken only when `context_tokens` is
    above 0 and `pricing` is `catalog` (a list price on a known model): not `configured` (the managed `modelPricing`,
    where every other figure is a list price) and not `default` (`to_model` unknown, the default tier assumed).
    `classic.SessionStart`'s is never taken (it carries no `pricing`, and the declarations say it is the managed
    price where one is set), so on a resume the mod's own table prices the re-order on the session's `model` until a
    switch brings a `catalog` estimate. A switch replaces the engine's price with its own, if taken, else drops it (a
    `resume` switch's is not read; one no hook reports has none), as `/clear` does; a compaction keeps it. The cache
    atom's `engineWriteUsd` and `engineModel` go unwritten and unread, so an older version's value is never taken;
  - **a top-up** ≈ P × the cache-read price + the ping's own few input and output tokens (a fork re-sends the main
    thread's last request, not its answer; ≈$0.034 on the bill's sample); **a re-heat** ≈ P × a re-order's price per
    token + the same few tokens;
  - **a day of keepwarm** = pings a day × a top-up, pings a day being 24 h ÷ ⌈(TTL − 90 s) ÷ 1 min⌉ minutes, as
    keepWarmTick's minute tick pings once the cache is TTL − 90 s old: about 24 at a one-hour TTL (59 minutes
    apart), 360 at five minutes (4 apart).
- `/cache-tax` gains `saved      …` and `tax paid   …` lines from these figures. Pings have one book, the ledger:
  keepWarmTick and the top-up book them there alone; `/cache-tax`'s keepwarm line, the wooden board and
  `lastPingNote` take their counts and costs from it; the cache atom's `pings`, `pingUsd` and `misses` stay in the
  type, unwritten and unread.

### The actions

Each button lists its dim reasons in order; the one said is the first that applies, of the first dim button in the row
(The pane says where).

- **Keep the fire on / Let it cool**: write `keepWarmUntil` as `/keepwarm <pick>` and `/keepwarm off` do, from the
  clock read at the press (so do both `Keep it warm after` buttons, the card's and the pane's). On a cold cache it
  says `the cache is cold: the next send warms it, and the pings start then` (with nothing cached, `nothing cached
  yet: …`), as `/keepwarm` now does after its `keepwarm on for <d>` in place of its promise of a ping. Dim: `this host
  keeps no snapshot to fork`, `prompt caching is off` (Let it cool never is).
- **Top up now / Re-heat now**: keepWarmTick's ping, sent now rather than in its 90 s window, to a warm cache, or to a
  cold one after the second press. Dim: `this host keeps no snapshot to fork`, `prompt caching is off`, `compacting`,
  `a turn is running`, `a top-up is on its way`, the fork gate's wordings (below), `nothing cached yet`,
  `under 1k tokens` (`contextTokens` under 1,000). A top-up toasts at `chatter` (a miss or a failure at `important`);
  it books, and plays the `ping` moment when it moves `lastWarmAt`, as keepwarm's pings do. A re-heat that moved
  `lastWarmAt` (The ledger) plays the `reheat` moment; one that did not says it could not re-heat and books what it
  paid.
- **Every fork** (keepwarm's ping, a top-up, a re-heat):
  - **The fork gate**, the ledger's `canFork`: false as a conversation begins (a new session, `/clear`, a resume); set
    when a main-loop turn that had a step with usage ends; unset by the ledger's reset (`/clear`, an in-process
    `/resume`), a compaction and a model switch; kept across a reload. While it is shut no fork goes out: keepwarm
    waits, still armed, and Top up and Re-heat are dim with `the table was cleared` while `cleared` holds, else
    `nothing to top up until the next turn ends` if the ledger holds booked steps (after a compaction or a model
    switch), else `nothing to top up yet: the first turn has not ended` (a new or resumed conversation). A fork that
    was out when the gate shut books its usage and changes nothing else: no warmth, no conclusion.
  - **One at a time**: no fork goes out while another is in flight (module state, which keepWarmTick honours too).
  - **Warmth**: a fork moves `lastWarmAt` only as The ledger's Judged says.
  - **Nothing to fork**: landing with the fork gate still open, a `nothing-to-fork` answer means the host keeps no
    snapshot: it says `this host keeps no snapshot to fork`, keepwarm goes off, and Keep the fire on, Top up
    and Re-heat stay dim for the session (module state: a reload forgets it, and the next fork learns it again).
  - **Rate limits**: an `api-error` with `status` 429 on keepwarm's own ping is retried once about 20 s later, if the
    cache has not lapsed and nothing else holds a ping back; after a second 429 it says `the cache lapses at 14:32;
    keepwarm resumes after your next send`, and keepwarm sends no more pings until a main-loop step warms the cache
    again. A top-up's or a re-heat's 429 is not retried and pauses nothing (a top-up says `rate-limited: the cache
    lapses at 14:32`).
- **Zosui**: `$.session.compact()` after the second press. Dim: `needs a newer Claude Code` (`compact` off, below),
  `this app compacts only from a typed /compact` (outside the REPL: the desktop app and other SDK hosts refuse the
  call, known from `session.start`'s `isInteractive` and from the refusal itself), `compacting`, `a turn is running`
  (the call rejects then). A hook's veto (`{ skip }`) says so and lets Bocchi out of melting, as does any other
  rejection. The press draws the zosui until the call resolves, then settles the cache from the call's own
  `tokensBefore` and `tokensAfter` and books its `usage`: the engine runs every `session.compact` hook but the calling
  plugin's, so the mod's own hook never sees its own press, on any install. That hook draws the zosui for the other
  triggers (`manual`, `auto` and another plugin's `plugin`, not `precompute`) and settles the cache.
- **Clear the table**: `$.prompt.fill({ text: '/clear', mode: 'replace' })`, for the person to send. Over a draft
  (`$.prompt.read()`; exactly `/clear` is not one) the first press arms (`Press again: your draft gives way to /clear`)
  and a second within 10 s fills. A fill that lands says `/clear is in the box: Esc, then Enter` (while the Hotpot
  holds the keys Enter presses its focus ring, and that Esc closes it: `closeOnEscape`); `isFilled: false` from a
  dialog holding the keys (or a hook's refusal with no cause) says `the box could not take /clear: type it` and
  disarms. A `no_composer` answer (no box bound: a host with no client that takes fills, as `-p`; the desktop app
  takes them into its own box) says `this app keeps its own prompt box: type /clear` and dims Clear the table and
  Start fresh, the pane's and the card's, from then on (module state, learned from that answer alone).
- **The bill** toggles `isBillOpen`; **Close** closes the pane.
- **What a press says**: an action's outcome, and a keepwarm ping's while the pane is open, is the hotpot atom's
  `note`: 6 s in place of the tail of the wooden board's first line, whatever the **Toasts** option (toasts go out
  as stated besides).
- **Two calls the mod has not made before**, `$.session.compact` and `$.prompt.read`, are guarded where they are made,
  like the five features `FEATURES` (`hooks/lib/engine.ts`) lists: a missing call (`isMissingApi`) switches its
  feature off for the session. `FEATURES` gains `compact` (`$.session.compact`, `the Hotpot's zosui`) and `draft`
  (`$.prompt.read`, `the Hotpot's draft check`), which help's off line names; with `draft` off, Clear the table
  always takes two presses.

### The bill

The pane's only place for the reads, writes, tax paid, saving and hit rate; rows of `label · detail · figure`:

| Row | Detail | Figure |
| --- | --- | --- |
| Read from cache | `1.3M × $0.20/M` | `$0.26` |
| Written to cache | `226k × $8.00/M` (the TTL's rate) | `$1.81` |
| of which Cache Tax | `1 cold re-write · 1 silent (a background report)` (`· 1 mid-turn` when one was) | `$0.88` |
| Keepwarm | `3 pings`, top-ups included (`· 1 found it cold` when one did) | `$0.10` |
| Re-heats | `1` | `$1.34` |
| Compaction | `1 zosui` (the summarizer's request) | `$0.14` |
| Saved by the cache | `vs. sending it all uncached` | `$2.67` (green, or `cost $x more` in red) |
| Hit rate | `read ÷ everything the steps sent` | `85%` |
| By member | `Bocchi 88% · Nijika 71% · Ryo 92% · Kita 64%` | |
| If it goes cold | `re-order 168k` | `$1.34` (red) |
| A day of keepwarm | `≈24 pings at a 1h TTL, assumed · ≈$12.2 if it lives 5m` | `$0.83` |

Rows with nothing to say (no pings, no re-heats, no compaction) and members with no steps are left out; Bocchi's rate
is the main loop's and her acts' (The ledger). `A day of keepwarm` names the TTL in force, with `assumed` and the
five-minute price only while it is assumed. Under the rows, `cost ≈ list prices × tokens, not your bill`. The sample
is Opus 5.5 at a one-hour TTL ($4.00/M input, $20.00/M output, $0.20/M read, $8.00/M write) with P at 168k: saved =
1.32M × $3.80/M − 226k × $4.00/M − $0.10 − $1.34 ≈ $2.67; a top-up = 168k × $0.20/M plus a ping's own 30 input and 8
output tokens ≈ $0.0339, so a day of keepwarm is 24.4 × that ≈ $0.83, and at five minutes 360 × that ≈ $12.2.

### The cache's truth (fixes the pane depends on)

1.1.0 fixes what the mod gets wrong about the cache today:

- **The TTL is learned, and kept.** The ledger keeps what the engine and the evidence taught, `ttl: { ms, how }`
  (`how`: `assumed`, `engine` or `seen`), and a pending five-minute sighting, through a reload, `/clear` and an
  in-process `/resume`. The TTL in force is the first of these that applies:
  - The **Cache TTL** option, set to a positive number other than 60. At 60 or anything else (0, which the README
    says reads as 60, empty, negative) the two below decide, the hour assumed until they speak: `isTtlDefault`
    becomes `!(ttl > 0) || ttl === 60`, and `ttlMs` reads such a value as 60 minutes (a negative one gives 1 minute
    today).
  - The engine: `cache_ttl` on every `classic.PostModelSwitch` (whose sources include `resume`), and on a resume or
    fork `classic.SessionStart`'s `prompt_cache_likely_expired` when `seconds_since_last_response` is over 300 and at
    most 3600 (true: five minutes; false: one hour).
  - Evidence, while the engine has said nothing: a main-loop step with no `serverToolUses`, or one of the mod's
    forks, judged against P (The ledger's) over the gap from a `lastWarmAt` the mod saw (a main-loop step's or a
    fork's; never 0 or one a resume set) to the request's start. **One hour**: after more than 5.5 minutes (a step
    starts before its request reaches the API, retries included), a step that reads at least 90 % of P and writes
    under half of it, or a fork that reads as much and writes under 0.1 × P. **Five minutes**: after 5.5 minutes to
    an hour less 20 s (`SIGHTING_MAX_GAP`: keepwarm's own pings at an assumed hour go out on the first tick of its
    minute beat from TTL − 90 s, 58:30 to 59:30 after a step's warmth and about 59 minutes after a ping's, so a miss
    among them is a sighting) with no reload of the mod in it, a step on the model (`usage.model`) and effort of the
    request that last warmed the pot, or a fork (which re-sends that request), that writes at least half of P and,
    for a main-loop step, reads under 10 % of it (a fork is judged by its write, as The ledger judges it). A re-write
    has other causes (a changed tool list or system prompt, a speed or effort change, a turn past the cache's
    20-position lookback), so a first sighting only shows `TTL 5m?`, the TTL in force staying an hour, and a second
    with no one-hour evidence between them sets five minutes. One-hour evidence clears a pending sighting and
    replaces a learned five minutes; two sightings replace a learned hour, even one taught by a refresh the mod
    cannot see (another plugin's `$.model.fork`).
- **A model switch is a new pot.** A switch forfeits the entry (`prompt_cache_warm`: "likely still warm (a switch
  then forfeits it)"), so every `classic.PostModelSwitch` whose `source` is not `resume` and whose `to_model` differs
  from `from_model` sets `lastWarmAt` to 0 whatever that flag says, and no fork goes out until a main-loop turn on the
  new model has ended (the fork gate, under The actions). A `resume` switch restores the model the transcript was
  cached on and forfeits nothing: the mod reads only its `cache_ttl` and `to_model` (its `context_tokens`,
  `prompt_cache_warm` and estimate go unread), and the warmth and the context come from `classic.SessionStart`, in
  either order (the declarations order neither), the model from either of them. Every other switch's
  `estimated_cache_write_usd` is the re-order's price per token on The ledger's terms (**a re-order**). A main-loop
  step whose `usage.model` differs from the last main-loop step's (the same field, so the names compare like for
  like), with no `classic.PostModelSwitch` since that step, is taken as a switch, since, where an organization manages
  Claude Code without listing the mod, classic hooks are passed over and no switch arrives. That step is the new pot's
  first write, neither tax nor the TTL's evidence; the engine's price per token is dropped; the fork gate shuts until
  its turn ends. The ledger keeps the last main-loop step's model for this.
- **Warm from the step's start.** The TTL runs from when a request is processed, so `lastWarmAt` is a step's start:
  `turn.complete` no longer writes it, and each main-loop `turn.step` reads the clock before it calls `next(e)` and
  writes that time once its response began (its `usage` is not null, or a text, thinking, tool or stop chunk came
  through). A step refused or cut before any chunk, or one that read and wrote no cache, leaves `lastWarmAt` where
  the last real request put it; one cut mid-answer still counts, as its request reached the cache.
- **An act's steps never warm the pot.** An act's steps, a `fork: true` act's included, are booked to its member and
  never move `lastWarmAt` (a forked act reads the main thread's entry only in its first request, then its own): a
  long background act lets the pot go cold, and the main loop's next step is held, or booked as a silent re-order
  when it is the act's report.
- **The context is the engine's.** `contextTokens` is what the next request re-sends, as the engine's
  `context_tokens` counts it on a switch and a resume: P (The ledger's Judged) plus the last main-loop response's
  `output_tokens`; `$.session.usage()` leaves both alone. The re-order prices `contextTokens`; a top-up and the TTL's
  evidence use P.
- **A resume knows its pot.** On a resume or fork, `classic.SessionStart` sets, each only when present (an absent one
  leaves its figure alone, so without `seconds_since_last_response` the pot reads as nothing cached until the first
  step), `lastWarmAt` from `seconds_since_last_response` (a lower bound on the age, which ran from the last request's
  start), cold when `prompt_cache_likely_expired` whatever TTL is in force; `contextTokens` from `context_tokens`; and
  `model` from `model`, so the pane is right before the first step. Its `estimated_cache_write_usd` is never taken
  (The ledger's **a re-order**).
- **`nothing-to-fork` is read against the mod's own record.** The answer carries no detail, but the record is the
  fork gate: no fork goes out while it is shut, so a `nothing-to-fork` that lands with it open means the host keeps
  no snapshot, by the fork rules under The actions.
- **Caching off.** The ledger keeps the run of consecutive cacheless main-loop steps (with usage, `input_tokens`
  above 0, both cache counts 0): three or more in a row is caching off; a step with either cache count above 0 ends
  the run, and a model switch, a compaction and `/clear` reset it (whether requests cache can change with the
  model). With caching off there is no pot to lose: `feastOf` gives `off`, which the Cache Tax hold and the cold
  notice take as not cold, so nothing is held and nothing warns; Keep the fire on, Top up and Re-heat are dim
  (`prompt caching is off`; Let it cool stays pressable), and a ping never toasts as a miss.
- The Cache Tax card's `Dismiss` (and the pane's, during a hold) clears the hold (`isArmed` false, `heldAt` 0,
  `heldText` empty) and brings Bocchi out of her panic (`revertMood`: her box while the cache is cold); today it only
  zeroes `heldAt`. The prompt stays in the box, and the next send is judged afresh: a cold one is held again.
- `/keepwarm` with no screen says that nothing will ping (the minute timer only runs with one).
- `/bocchi tax` leaves the ledger and the cache's figures alone (today it fills an empty `model`, `contextTokens` and
  `lastWarmAt`, two TTLs old, so an empty session draws a cold 330k pot and books its next real step as Cache Tax).
  The sample's model, size and age (the session's own where it has them) go to the hotpot atom's `sample`, stamped
  with the preview hold's `heldAt`, and the card and the pane draw from it while that hold stands; the preview still
  arms the hold in `cache` (`heldAt`, an empty `heldText`, `isArmed`, `heldUsd`, `warmUsd`), so the next send clears
  it.

### The buttons on other surfaces

- The strip: `strip-hotpot` `♨ Hotpot` (`o`, plain) after `Panel`, in all three of its drawings (the desktop sign,
  the roomy terminal strip, the one-line strip); shown while the Hotpot is closed.
- Under the band's chalkboard: `hotpot` `♨ Hotpot` (`o`) after the member buttons, and in the terminal panel's keys
  row.
- `o` is free in every site today (strip `r k h`, chalkboard `b n r k m h`, Cache Tax `w f d`, memo `s g e k`, recap
  `r t x`, Replay `p n c`, tour `a p c`, file tree `f c`, the guard `0 p`).

### Art (the studio)

The figures go through the studio and `npm run sprites` like every sprite, drawn on the reference grid; the room, the
table and every prop no one holds or wears are drawn in `hooks/lib` (below).

The person's bar for the figures: "Re-drawing the characters is ok, just make it pretty and gorgeous." Below stand's
head anything may be drawn anew (the shoulders, arms and torso); the heads and all their faces are reused as they
are, and the four feast faces are the only new face art (`bite` is `idle` with its mouth open).

- **A new family, not new moods.** `FeastState` = `eat`, `calm`, `worry`, `wait`, `cold`, `shock`, plus Nijika's
  `serve`. `studio/src/anim/feast.ts` holds the timelines (as `slimes.ts` does), `loadStudio` in
  `studio/scripts/studio.mjs` exports it (so `npm run check` runs its checks), `Root.tsx` registers the compositions,
  `sprites.mjs`'s id pattern takes them, and `sprite.ts` learns the view (`feast`, 96×64). Ids:
  `<member>-feast-<state>` (the slimes' pattern), and one still, `nijika-feast-headband`.
- **Who plays what.** `wait` in `none`, `cleared` and `off`; `eat` (Nijika's with her ladle between bites, Kita's with
  her phone) in `feast` (levels 5 and 4) and `zosui`; `calm` in `simmer`, `low` and `tend`; `worry` at `last` (Ryo's
  on `seatPoint`); `cold` once cold; `shock` while `held`. Nijika plays `serve` for a `ping` moment while the other
  three keep theirs.
- **Four front seats, from the waist up**, seated as under The feast, state by state (turned 30° to 45°, about 35°;
  past 45°, under a face to us, it reads as a twisted neck). `MemberArt` gains an optional `feast: { side: 'left' | 'right'; waist;
  poses; faces; headband? }` (`side` is her edge of the table), and `checkArt` checks what each member has:
  - **Poses**, each keeping stand's head untouched: `seat`, patched on `stand` (the instrument and its headstock gone,
    the torso turned toward the pot, both hands resting on the table); then, patched on `seat`, arms only: `seatPot`
    (her torizara in the near hand, the chopsticks in the far hand in the pot: the far two reach over its back rim,
    the chopsticks angled down into the broth, the near two across its side), `seatBowl` (the chopsticks at the
    bowl) and `seatUp` (at her mouth); and each one's own: Bocchi's `seatPanic` (both hands up), Ryo's `seatPoint`
    (her chopsticks down over the back rim at the last piece), Nijika's `seatLadle` (the ladle in the pot), Kita's
    `seatPhone` (the phone carried out and down over the pot's right rim in both hands, its lens at the rim, her
    shoulders and upper torso leaning toward it), and Nijika's and Kita's `seatSlump` (shoulders and arms dropped on
    the table, the head where `seat` has it). Below her waist only her hair (Bocchi's falls past it) and the far two's
    chopsticks reaching into the pot are drawn, in a window of rows 6 to 69 at the canvas's full width. `waist` is
    the outer end of her waist, the same in every seat pose.
  - **The eyes**: `faces` holds feast-only overlays at the face's place: `idlePot`, `halfPot` and `focusPot`, for
    eating (those faces with each iris moved within its eye's whites toward the pot: our right for Bocchi and Nijika,
    our left for Ryo and Kita), and `bite` (the mouth open as the chopsticks reach it, the eyes at us); the chewing
    after a bite is `happy`. These faces are studio art (drawn variants, or an iris shift the studio applies), never
    a runtime trick; the minis gain none.
  - Held props are part of the poses or effects: the torizara, the chopsticks and the food on them (`tips` extended
    to the seat poses, a new effect `morsel`, colored per food), Kita's phone and its flash (a new effect `flash`, on
    her lens, which the drawing keeps as `KITA_LENS`), Nijika's ladle, Ryo's weed (a new effect `weed`, dipping a row
    on each chew). The top-up's pour is the drawing's (below), at the ladle's cup.
  - Nijika's headband is `feast.headband`, a patch (its grid and its place on her hair), exported once as the still
    `nijika-feast-headband` on the feast window and drawn over whatever she plays while keepwarm runs (no headband
    copies of her loops).
  - **The checks** (`npm run check`): each seat pose's face region is stand's, checked as the `HEAD_POSES` are (so
    every face overlay and feast face fits), and `seat` keeps stand's whole head (the portrait window down to the
    face box's foot, hair and outline untouched); every seat pose keeps that head (inside the window nothing of
    stand's cut down to the face box's foot, outside it none of her hair; below it `seat` keeps her hair wherever the
    table does not hide her, and the poses built on `seat` keep its hair, or stand's behind what `seat` drew); each
    seat pose's waist ends at `waist` on her outer side, with only
    hair and chopsticks below it; the window holds the face, the hands and the bowl; a pot-look face differs from the
    face it comes from only inside the eyes, each iris toward the pot; the tips stay on the canvas; the headband
    covers only pixels that every seat pose of Nijika's has the same (as the sway is checked); the loops' lengths; the
    four loops' beats apart (no two members blink, bite or look round on the same frame); and the faces each loop
    plays: in `worry` and `shock` no pot look and no `glance`, in `eat`, `calm` and `serve` only a
    pot look, `bite`, `happy`, a blink with its half lids beside it and at most one `glance`.
- **Loops move arms, shoulders and faces only**, by changing pose and face: the head and the waist never move (no dx,
  dy or squash), so each figure stays near 10k to 16k characters at level 0 (the prototype's largest is 14.4k) and the
  four come to 40k to 64k of the 131,072-character Svg. A bite goes: into the pot (`seatPot` under a pot look, the
  food caught on the tips), to the torizara (`seatBowl`), up to the mouth (`seatUp`, `bite`), back at the bowl chewing
  (`happy`) and a blink, then a pot look again. `wait` is `seat`, both hands resting on the table. Each state has one
  length for the members who loop it, beats staggered, as the moods are (no two members blink, bite or look round on
  the same frame); Ryo bites twice to Bocchi's once in the one length, her beats shorter. `cold` keeps its own:
  Bocchi's box its 3 s loop, Nijika's and Kita's slumps stills, Ryo chewing her weed on a loop of her own (`half` over
  `seat`).
- **Reused as they are**: Bocchi's box (`bocchi-hiding`, 12.1k) for her `cold`, at her seat raised 10 rows from where
  her seat poses' 96×96 canvas lies (`box.ts` draws stand's head 20 rows down, so unraised its rim, row 57, would
  fall below her waist), its rim at her chest and her eyes just over it; the faces `idle` and `focus` with sweat for
  `worry`, the eyes at us on every beat (no `glance`, no pot look), `melt` for Nijika's and Kita's `cold`, `panic`
  for `shock` (Bocchi's over `seatPanic`, not the 51.6k `bocchi-panic`).
- **Growth**: about 24 loops (Bocchi 5, Ryo 6, Nijika 7, Kita 6, the two slumps stills) at about 10 KB each, and the
  headband's still: `sprites.gen.ts` grows from 557 KB to about 800 KB, and about 24 colors of the 100 the alphabet
  still has. No feast minis in 1.1.0.
- **Colors, counted before a render.** `fxColors` scans the moods only, so the feast timelines' effect colors (the
  food, the flash) join `allColors()` as `FEAST_FX_COLORS`, as `SLIME_FX_COLORS` did. `allColors()` moves out of
  `Root.tsx` into a module `loadStudio` exports, and the 268-character alphabet out of `sprites.mjs` into a module
  both scripts read, so `npm run check` counts the colors against it.

### The drawing (`hooks/lib/hotpot.ts`)

- Pure, no `$`: `feastOf`, `warmthDue`, `hotpotDue`, the ledger's arithmetic and figures, `hotpotSvg(view, layout)`
  (the feast, memoised), `boardOf(view)` and `billRows(view)` (the Text the pane lays out: the wooden board's two
  lines, the bill's rows), `hotpotCells(view, mode)` (the terminal's table and pot: the minis' backdrop, `under`),
  and the alt words.
- The props are pixel art: the room's wall, shoji, plaques, flyer, the LAST ORDER sign (up at last orders), lantern
  and the lamp over the pot as pixel-aligned rects; the donabe, broth at each level, lid, stove, glasses, the platter,
  ten ingredients, the four zabuton (drawn under the table, each one's corner showing past its edge, the far two's
  further out, clear of the near two's heads), the three gig
  bags (Bocchi's guitar, Ryo's bass and Kita's guitar, leaning on the wall) and Bocchi's rain cloud (over her box
  while cold) as `Pix`, built once and memoised the way `kitArt` is, the broth per level and the food (in the pot by
  level, on the platter by level and context) in a small memo. The table is one polygon, so the seats' clips follow
  its side edges exactly. Steam, bubbles, flames, the lantern's sway, sparkles, snow, the cloud's drips and the gloom
  lines (over Nijika's, Ryo's and Kita's heads from the row under each one's speech bubble tip, so no bubble covers
  them) are CSS-classed layers, which the reduced-motion rule stops (the band's SMIL loops play on); so is the
  top-up's pour, drawn for a `ping` moment only: whole-pixel rects of broth spilling over the lip of Nijika's ladle's
  cup (`NIJIKA_CUP`, the studio's tip) toward the pot's middle and a ripple stepping out three rings wide where it
  lands, played once over the moment (reduced motion keeps the spill and the middle ring as a still).
  Lighting is plain alpha overlays (the room a shade darker than the table under the lamp), never a
  `mix-blend-mode`, which darkens the whole picture in Chromium.
- Each seat is placed so the outer end of her waist (`feast.waist`, kept in `hotpot.ts` as constants, as `scene.ts`
  keeps `KIT_SEAT`, and checked by a test against the sprites' pixels) lies on the table's side edge at her row, and
  is drawn through a clip of everything but the table nearer than her waist (a wrap per seat, as the kit clips Nijika
  on stage), so the table hides her lap and her hair beside it still shows. Bocchi's box takes her seat's place and
  clip.
- The parts go Bocchi, Ryo, Nijika, the headband (while keepwarm runs), Kita: all four, and the headband while
  keepwarm runs, drawn whole at `fitSprites`' level 0, none left out and never `capped`, in every phase × platter ×
  keepwarm × moment (the room leaves the band some 50,000 characters it never needs). One `fitSprites` call given the
  budget left after the room (as `drawStage` does) stays as the guard: should it ever bind, the largest gives up
  frames first, and the headband goes with Nijika if the fit leaves her out.
- The paint order: the stove, the pot and what is in it first, laid inside the band's group under all four; then the
  far two, who reach over the pot's back rim: while they eat, simmer or watch the last piece their lap clips open again
  over the pot (`OVER_POT`: the table behind its middle from their waists' row down to the rim's middle, and the
  rim's lower half), so their chopsticks show crossing the back rim and their tips in the broth; then the near two,
  in front of it. The near glasses, the platter, the steam, the pour and the slip come after the band. A `capped`
  fallback draws the room and the pot without the band.
- `Pix`, `pix`, `pxAt`, `put`, `block`, `oval`, `pline`, `rim`, `layOn`, `pairOf`, `pixPaths`, `Px4`, `boxPaths`,
  `placedArt` and `spliceAfter` (with `DIM_GHOST`) move unchanged from `scene.ts` into a leaf `hooks/lib/pixart.ts`,
  and the text helpers (`f`, `esc`, `svgDoc`, `capped`, the fonts and `TEXT_CSS`, `Face` with `GLYPHS`, `ADV`,
  `GLYPH_AT`, `isWide` and `advance`, `textWidth`, `wrapText` with `wrapLines`, `breakWord`, `clipEnd` and the stop
  patterns, `T`, `Seg`, `runs`, `runsWidth`, `fixedT`, `sansLine`, `sparkleD`, `sparkle`) into
  `hooks/lib/svgtext.ts`, each with every private helper it calls, so neither leaf imports `scene.ts`: `svgtext.ts`
  takes `SVG_LIMIT` from `sprite.ts`, `pixart.ts` takes `f` from `svgtext.ts` and `SpritePart` from `sprite.ts`, and
  `scene.ts` imports them all back. Neither `register.tsx` nor `scene.ts` takes the hotpot drawing.

### Commands, typeahead, help

- `/hotpot` toggles the pane, `canDraw()`-gated: with no screen it answers the wooden board as one line (`♨ Hotpot ·
  bubbling, 51m of feast left · 168k on the table · a re-order ≈$1.34 · a top-up ≈$0.03 · a day of keepwarm ≈$0.83
  · keepwarm off`). `/bocchi hotpot` does the same.
- `/keepwarm` offers `6h` too (`30m`, `1h`, `2h`, `6h`, `off`).
- `/hotpot` and `/bocchi hotpot` join help, the `/bocchi` argument hint, `OWN_COMMANDS` (the pink output card) and
  the typeahead.

### State added

- Two atoms in `types/index.d.ts`: `hotpot: KessokuHotpot` (its fields under The pane's State) and
  `ledger: KessokuLedger` (what The ledger keeps), each with an initial value that stands in for a value an older
  version never wrote. `KessokuCache` and `KessokuAgent` gain nothing, so the tests' literals of both stand.
- Module state, which a reload forgets (keepwarm may then ping once more): the fork in flight, the 429 retry's
  timer, the stop after a second 429, a host found to keep no snapshot, a host that cannot compact (outside the
  REPL, or found so by its refusal) or fill its box (found so by a `no_composer` answer), when the module loaded
  (for the five-minute evidence's "no reload"), and a paid re-order's turn under way (`paying`, set once the held
  prompt has entered: the feast stays drawn and the board says `♨ Re-ordering` until its first step books, or the
  turn ends).

## Testing Decisions

The seams, agreed before any test is written:

1. **`hooks/lib/hotpot.ts`, directly** (a new `tests/hotpot.test.ts`, pure like `tour.test.ts`): `feastOf` at every
   boundary (84 %, two thirds, a third, the last-orders window for 60 and 5 minutes, cold; keepwarm turns `last` into
   `tend`; held, compacting, cleared and caching off win); each time `warmthDue` and `hotpotDue` return; every case
   booked or judged under The ledger, writes re-priced once the TTL is learned, the engine's price per token refused
   at `context_tokens` 0, at any `pricing` but `catalog` and on a `resume` switch, and P left alone by a step that ran
   server tools; the figures (hit rate, a negative saving, the write rate by TTL, a top-up and a re-heat priced from
   P, a day of keepwarm); the wooden board's two lines in every phase, the TTL marks too; the bill's rows and the rows
   left out; the seats and eyes in every phase and moment, Bocchi's box too (Bocchi and Nijika at the table's left
   edge, Ryo and Kita at its right, each placed so the outer end of her waist lies on the table's side edge and the
   table covers what is below it: each lap's clip read by the nonzero rule against every pixel she plays; the
   `feast.waist` constants against the sprites' pixels; the pot under all four, the far two's chopsticks ending in its
   opening and wholly inside their clips' window over it, the window only theirs and only
   while they eat; Kita's flash whole and centred on `KITA_LENS`, over the pot; the pour during a ping only, whole
   pixels from Nijika's cup (`NIJIKA_CUP`, held to the serve loop's cup), played once; each zabuton's corner showing,
   100 pixels or more clear of the table and the band; no headband without Nijika; while cold, the gloom lines over
   the heads, clear of every bubble); every figure the feast draws (the
   feast family and Bocchi's box) whole, at level 0, within 24,000 characters; the scene under `SVG_LIMIT` with all
   four (and the headband exactly while keepwarm runs) whole at level 0 in it, never the `capped` fallback, for every
   phase × platter × keepwarm × moment, and its largest 40,000 characters or more under the limit; the same key
   giving the same string; the alt words. Catches the arithmetic and the drawing's bounds; misses the wiring and how
   the picture looks.
2. **The hooks module through `claude plugin test`**, at public events only: the ♨ button on all three strips and
   under the chalkboard opening the pane (placed, or above the prompt with `unplaced`); the pane on the terminal, the
   desktop and kaomoji (the feast, the wooden board's two lines, the buttons by key); keep the fire on, let it cool
   and both `Keep it warm after` buttons write keepwarm, timed from the press, not the draw; top up forks and books a
   ping, and while it is out no second press or minute tick sends another; re-heat and zosui need two presses (a
   re-heat warms the pot, from the clock read before the call, only when its read and write reach 0.9 × P, a written
   prefix or a live entry read; zosui's second press calls `$.session.compact` and settles it itself, a slow one drawn
   until it resolves and a vetoed one saying so); outside the REPL (the desktop app's start) Zosui is dim with its
   reason and Clear fills the app's box; clear fills `/clear`, on the second press over a draft, and arms nothing on
   `isFilled: false`; a held prompt the box cannot take back keeps its hold, the next send passing as the paid one;
   with no pane open the Cache Tax card gives way at its hold's end; keepwarm through a running turn's last minutes
   is last orders, no fork going, and with no screen it never has the pot;
   a Hotpot closed by its own `Close` lets its sprites go; the bill (`b`) shows the figures nothing else in the pane
   does, on the board's paint; a paid held send books the tax and keeps the feast drawn, the board saying
   `♨ Re-ordering`, until its first step books it warm, a held send re-sent and refused beneath plays nothing, a send
   after `/bocchi tax`'s preview plays no `…paid.`, and a cold `task-notification` turn books a silent one; acts'
   steps, a `fork: true` act's included, land on their members
   (`demo-` acts' nowhere) and never move `lastWarmAt`, so after a long background act the main loop's next step is
   held, or booked as a silent re-order when it is the act's report; `/clear`, and `session.end` with reason `resume`,
   reset the ledger, the band and the cache, drop the engine's price per token and keep the learned TTL and its
   pending sighting; a switch to another model empties the pot (a `resume` one does not), as does a main-loop step on
   another `usage.model` that no switch reported; a resume's `classic.SessionStart` sets the warmth, the context and
   the model (never the price per token), whichever of it and a `resume` switch comes first; a warm step after a
   6-minute gap teaches one hour, one with `serverToolUses` nothing, a cold step after 10 minutes shows `TTL 5m?` and
   a second sets five minutes, one-hour evidence between them clears the first, and a Cache TTL of 0 leaves learning
   on (a `turn.step` bottom per test, as the step tests do); three cacheless steps in a row turn caching off (Let it
   cool still pressable), and a cached step turns it back on; with the fork gate (under The actions) shut no fork goes
   out, keepwarm stays armed and Top up and Re-heat are dim with its wordings, and with it open a `nothing-to-fork`
   answer books nothing, turns keepwarm off and dims Keep the fire on, Top up and Re-heat for the session; a top-up's
   or a re-heat's 429 is not retried and pauses nothing, and keepwarm's is retried once about 20 s later, a second
   stopping its pings until a main-loop step warms the cache; the Cache Tax card's `Dismiss` clears the hold and
   brings Bocchi out of her panic; a `turn.complete`, an error's or an interrupt's included, leaves `lastWarmAt` where
   its last step put it; `contextTokens` follows a `session.measure`'s `context.tokens`; `/cache-tax` prints `saved`
   and `tax paid`; with no screen `/hotpot` answers in one line and `/keepwarm` says that nothing will ping, and on a
   cold or empty cache `/keepwarm`, still opening `keepwarm on for <d>`, says the next send warms it and the pings
   start then; `/bocchi tax` touches neither the ledger nor the cache's model, context and warmth, so the next step
   (a cold first order, on a real date's clock) books no tax; the scene's alt and the wooden board's first line move
   with `clock.advance` by whole minutes (long advances on the desktop drawing: a terminal Raster's 100 ms sprite clock
   fails them).

   One bottom per event, so the knobs live in `bottoms()`: `model.fork` gains `forkReason` (`nothing-to-fork`, or
   `api-error` with `forkStatus` and the usage spent before the failure), `forkMs` (it answers that much later) and
   `forkCacheWrite` (unset, today's 300k when `forkCacheRead` is set, else 0); `prompt.fill` answers
   `isFilled: false` under `refuseFill`; a `prompt.read` bottom answers from a `draft` knob (empty by default; the
   call throws without it); a `classic.SessionStart` bottom joins `classic.PostModelSwitch`'s; `session.compact`
   counts its calls in `seen.compacts`, `compactMs` and `compactSkip` making a zosui slow or vetoed (over a
   transcript: the kit refuses an empty compaction). Catches wiring, the band's priority and the redraw schedule;
   misses the desktop's paint, the engine's real fork and a missing hook or call.
3. **The studio**: `npm run check` with Art's feast checks (every seat pose held to stand's whole head: nothing of
   it erased inside the window down to the face's foot, and the arm poses keeping seat's hair and stand's behind it;
   the window holding the face, the hands and the bowl, the pot-look eyes, and the rest it lists), one loop length per
   state (`cold` and `serve` excepted), the four loops' beats apart, the faces each loop plays (reacting at us, eating
   on the pot) and the palette, `FEAST_FX_COLORS` included, against the 268-character
   alphabet.

Existing tests that change: the command list, the `/bocchi` verbs and the `/keepwarm` offers in the typeahead tests;
the help test (help names `/hotpot` and `/bocchi hotpot`; `allOn` gains `compact` and `draft`); the sprite count (98,
now 123: 24 feast animations and `nijika-feast-headband`) and id pattern; the `panelView` amp tests, whose words
come from `feastOf` (`warm 59:00` becomes `warm, 59m left` and `cold 10:00` becomes `cold for 10m`; the `keepwarm`
kind and `no cache yet` stand); the native-notifications test, whose stepless error and interrupted
turns (t3, t4) get a step with usage for its second warm period (no `turn.complete` warms the cache now), while its
cold notice's `30[34]k` stands: `$.session.usage()` (refreshUsage, the kit's 24k) leaves P and `contextTokens`
alone and still writes only the band's figures. `claude plugin validate`, `claude plugin test` and the type check
against the 2.1.308 declarations pass; the 2.1.299 type check is not run (those declarations are gone), and the two
calls they cannot vouch for are gated (`compact`, `draft`).

## Out of Scope

- The variants not chosen (B's tablet and conveyor, C's pot clock); cache figures on the tour (per night: tax paid,
  saved), which would need the book's format to grow; feast minis for the terminal; the kitty/Ghostty `Image`
  picture of the feast; pricing the tax from the Agent tool's 5m/1h split; linked sessions' caches; a sound; every
  backlog row not named here.

## Further Notes

- On the prototype (measured 2026-11-01) the biggest scene (warm, a big context) is about 95,000 of the Svg's 131,072
  characters (72 %), every figure fits 24,000 (the largest about 14,400), and the wooden board counts m:ss; the
  release counts whole minutes so that an open pane redraws once a minute, not once a second.
- The acts' costs on the chalkboard and each member's spend on the plates still come from `costOf`, summed step by
  step at each step's model but with every cache write at the five-minute rate, so they read low for one-hour writes
  (the chalkboard's session total is Claude Code's own `cost.usd`); they can move to the ledger in a later patch.
- Live checks before release: whether a fork's re-written prefix serves the main thread's next request (the re-heat
  rests on it; the fork's doc does not say), and whether `classic.SessionStart` with source `resume` reaches the
  module when `claude --resume` starts a new process. Where it does not, or a managed install passes it over (if
  `claude plugin validate` names it, the README's note on such installs counts five hooks and says so), a resumed
  session reads as nothing cached until its first step.
- The desktop app runs the engine as an SDK host (`--input-format stream-json`): there `$.session.compact` is
  refused ("not available in a headless (-p / SDK) session yet"), so Zosui is dim there with its reason (found by the
  review on 2026-11-02, after this spec was written). `$.prompt.fill` reaches the app: the engine sends it on as a
  `ui_prompt_fill` request to an attached client that takes fills, which the app's is, and answers `no_composer` only
  where none is attached (seen live on 2.1.309 by the second review, 2026-11-07).
- Several sessions with keepwarm on are several pots pinged: each pane says only its own session's.
- The pane writes numbers, times and model ids, never prompt text. In the README, what the mod touches gains the
  top-up and the re-heat (one request each, through the session's own fork); "Five features switch themselves off"
  becomes seven (the Hotpot's zosui and draft check); the Cache TTL text, like `plugin.json`'s `cacheTtlMinutes`,
  says that 60, 0 or empty leaves the TTL to Claude Code or to learning (an hour assumed until then); and Keys gain
  the Hotpot's, which a ♨-opened Hotpot takes only after `ctrl+x tab` (on the panel `b` stays Bocchi's solo).
