# Kessoku Ultimate Bocchi Theme

A Claude Code mod (function hooks, Claude Code 2.1.287+): a *Bocchi the Rock!*-inspired
charcoal-and-pink skin for **all of Claude Code**, a live **Kessoku Band** agent panel with the
band drawn as **animated pixel-art sprites**, and five themed workflow gags.

![The Kessoku Band on stage, every mood in turn](assets/kessoku-band.gif)

## What it does

| Piece | What you see | How to try it |
| --- | --- | --- |
| Engine theme | The plugin ships `themes/kessoku-bocchi.json`, a real Claude Code theme: pink prompt border and spinner, charcoal diff backgrounds, band colours for success / error / warning / plan mode / permission dialogs, the usage meter, selection, the eight subagent colours and the ultrathink rainbow. On first run Nijika asks once whether to put it on; it is also in `/theme`. | `/bocchi theme on`, `/bocchi theme off` (restores the theme you had), `/bocchi theme` for the state. |
| Skin | Every render site: tool rows framed in pink (edits in a double frame as "setlist" cards with `+a -d` counts), your prompts and Bocchi's replies with a pink bar, folded tool groups marked `♪`, the spinner's verb picked by what the turn is doing (terminal), `Encored for 3s` closing a turn, Bocchi's face on the hint line under the prompt, Nijika heading the question dialog, `♪ kessoku` in the footer, the mod's own command output in a card, and Bocchi's face in the status line: anxious when idle, focused while working, happy when a turn lands, panicking on an error, melting past 85 % context, hiding in the box when interrupted. | Just work. `/bocchi mood panic` tries a face. `/config` → Transcript skin: full / light / none. |
| Pixel-art band | Bocchi, Nijika, Ryo and Kita as chibi pixel-art sprites, six moods each (anxious, focused, happy, panic, melting, hiding), each a short loop: a breathing idle with nervous glances, strumming with notes rising, a jump with sparkles, shaking with sweat flying, melting into a puddle and back, peeking out of a cardboard box. The art is drawn in `studio/` and animated and rendered with Remotion. In the desktop app (and the editor, and the phone) each sprite is an SVG the surface animates itself; in a terminal it is half-block pixels repainted ten times a second with `$.ui.blit`. They stand in the panel's cards, the strip above the prompt, the Blast Radius screen (Bocchi panicking beside her guitar hitting the stage), the Cache Tax warning, Nijika's memo, Replay Theater and the question dialog. The status line and toasts take only text, so they keep the kaomoji. | Open `/kessoku`, or `/bocchi demo` to put the band on stage. `/config` → Character art: sprites / kaomoji. |
| Kessoku Band panel | A pane with one card per member. Bocchi = the main loop and heavy tasks; Nijika = planning/coordination subagents; Ryo = background, refactors, searches, db, shells; Kita = UI, frontend, docs, edits. Each card shows the task, context %, tokens, a cost estimate and status, live, plus the plan's fullest rate-limit window. A strip above the prompt shows the four of them (heads in a terminal, four rows), agents on stage, session cost and the cache's warmth. | `/kessoku` toggles the pane. `/bocchi demo` puts sample acts on stage, `/bocchi demo off` clears them. |
| Cache Tax | When the prompt cache has gone cold, the next send is held once: a panicked warning with the re-write cost (the engine's own estimate after a model switch, else list price at the cache's TTL rate), your prompt is put back in the box, Enter sends it. `/keepwarm` pings the cache with cheap forks shortly before it would lapse and reports when a ping found it already cold. | `/bocchi tax` previews the warning. `/cache-tax` shows the state. `/keepwarm 90m`, `/keepwarm 1h30`, `/keepwarm off`. |
| Blast Radius | `rm -rf`, `Remove-Item -Recurse`, `rd /s`, `git reset --hard`, `git clean`, force pushes, `git checkout -- <paths>`, `git restore <paths>`, `find -delete`, `rimraf`, `sh -c "..."`, migrations and infrastructure destroys are held behind the **dropped guitar** screen listing exactly what would go, measured through the engine's own file system (no shell needed). Cancel has focus; Esc cancels; Proceed lets it fall. Heredoc bodies, quoted text, comments, dry runs (`git clean -n`, `migrate status`, `-WhatIf`) and a single-file `rm -f` are left alone. The model is told why when it was refused. | `/bocchi crash` previews the screen. Or ask Claude to `rm -rf` a scratch folder. |
| Filetree | The project's files in a pane. A file shimmers pink while Claude edits it, stays pink a while, and turns neon green when a `git commit` succeeds. Reads glow faintly. | `/filetree`, then let Claude edit and commit something. |
| Reflect | A correction ("no, in this repo we use pnpm") becomes a band memo from Nijika above the prompt, with Save to `./CLAUDE.md`, Global, Edit and Skip. Questions and chatter are left alone; one tiny Haiku call drafts the rule, which lands under the band's heading with the file's own line endings. | `/bocchi memo` previews it (Save really writes). |
| Replay Theater | After a turn with edits, the strip offers Replay; `/replay` opens the setlist and steps through each edit as a unified diff with the file's real line numbers, track by track. | `/bocchi setlist` previews it. |

`/bocchi help` lists everything; `/bocchi strip` hides or shows the strip.

## Tweaking

Every file hot-reloads on save while the session runs.

- `hooks/lib/palette.ts` — the colors (`PALETTE`), the two engine themes' token maps (`THEME_OVERRIDES`, `THEME_OVERRIDES_LIGHT`), the members' faces and lines per mood (alignment-safe: no combining marks or fullwidth glyphs, padded to one width), the spinner words per mode, the turn-footer words, the guitar art. The files under `themes/` are those maps written out for the engine; after editing a map, regenerate them (compile `palette.ts` with `tsc` and write `{ name, base, overrides }` as JSON) so the two stay in step.
- `hooks/lib/band.ts` — which keywords send a subagent to Nijika / Kita / Ryo, which tools belong to whom, the price table behind the cost estimates (list prices for the Claude 5 and 4 families, **not your bill**), formatters.
- `hooks/lib/blast.ts` — the quote-aware shell splitter, the Bash and PowerShell risk classifiers, the dry-run exceptions.
- `hooks/register.tsx` — the hooks and every drawing (`drawPanel`, `drawStrip`, `drawBlast`, `drawCacheTax`, `drawMemo`, `drawReplay`, `drawTree`), `drawSprite` (a Raster on the terminal, an animated Svg elsewhere) with the sprite clock that repaints the terminal's Rasters, and the render hooks for the engine's own sites.
- `hooks/lib/sprite.ts` — playing the sprites: the run-length decoder, which frame shows when, the terminal encoder (half blocks, or quadrants for the small spots), the SVG writer. `hooks/lib/sprites.gen.ts` is generated by the studio: do not edit it by hand.
- `studio/` — the sprite studio, a Remotion project (Node 20+). `ART-BRIEF.md` is the art direction. The art is palette grids in `src/art/members/<member>.ts` (six poses, seven faces, three box peeks each); the mood timelines are in `src/anim/moods.ts`, written as keyframes with holds the way a pixel-art animator keeps an Aseprite file; effects and the 3x5 pixel font are in `src/art/fx.ts`, the melt in `src/art/compose.ts`, the guitar crash in `src/anim/crash.ts`. From `studio/` after `npm install`:
  - `npm run dev` opens Remotion Studio on every sprite, contact sheet and the showcase.
  - `npm run check` checks the grids in a second (sizes, palette, the face region identical across poses, the portrait windows holding the face).
  - `node scripts/sheet.mjs <member|all>` renders a contact sheet of every pose, face and frame to `out/sheets/`.
  - `npm run sprites` renders every sprite with Remotion and writes `hooks/lib/sprites.gen.ts`, which the running session hot-reloads.
  - `node scripts/terminal.mjs [member]` shows what a terminal draws, through the mod's own encoder, in `out/terminal/`.
  - `node scripts/svg.mjs [member]` writes the SVGs the desktop app draws to a page in `out/svg/`, animating in any browser.
  - `npm run showcase` renders the band on stage to `out/kessoku-band.gif` (the README's GIF lives in `assets/`).
- `/config` → **kessoku-ultimate-bocchi** — the engine theme offer, the transcript skin (full / light / none), character art (sprites / kaomoji), restyling other mods' panels, accent color (a theme key such as `claude`, a hex color or a terminal color name), charcoal backgrounds on/off (skipped on a light theme), which tool rows get cards (all / edits / none), spinner words, the cache TTL the tax assumes when the engine has not said (60 min on a subscription, 5 on an API key), the default keepwarm length, Reflect on/off, panel on start.

Checks: `claude plugin validate <folder>`, `claude plugin test <folder>`, and a type check: `tsc -p <folder>` once the engine has laid `.claude-plugin/types/` beside the mod, or otherwise a `tsconfig.json` kept outside the folder whose `include` names the engine's `claude-code.d.ts` and the mod's `hooks`, `types` and `tests` (the header of that declaration file carries the compiler options).

## Installing it for good

The folder is its own marketplace (`.claude-plugin/marketplace.json`). Copy it somewhere you keep, then in a terminal:

```
claude plugin marketplace add /path/to/kessoku-ultimate-bocchi
claude plugin install kessoku-ultimate-bocchi@kessoku-mods --scope user
```

It then loads in every new session, the desktop app's Code tab included, and its theme is listed in `/theme`. For one session only: `claude --plugin-dir /path/to/kessoku-ultimate-bocchi`. Edits to the folder reach a running session with `/reload-plugins`.

Turn it off with `/plugin` (disable or uninstall), or `claude plugin uninstall kessoku-ultimate-bocchi`. If the Kessoku theme is still selected afterwards, `/theme` picks another; the plugin's copy leaves with it, and a copy written to `~/.claude/themes/` (only where the engine did not list the plugin's) can be deleted there.

## Notes

- A mod is not sandboxed: this one reads the project's file list, runs `git` to measure a held git command, walks the engine's file system to measure a held delete, writes CLAUDE.md only when you press Save, writes a theme copy to `~/.claude/themes/` only when you accept the theme and the engine did not list the plugin's own, switches the `/config` theme row only with your yes, and makes one small Haiku call per correction and one cheap fork per keepwarm ping. No network calls of its own.
- Windows: the guard waits for your answer through PowerShell's `Start-Sleep` (no `sleep` binary needed), the PowerShell tool is guarded like Bash, and paths with drive letters and backslashes are compared the way Windows does.
- The Blast Radius classifier is adapted from Anthropic's Blast Radius sample mod (claude-code-playground, Apache-2.0).
- Cost figures are estimates from a price table; `/cost` is the ledger.
- The sprites ship inside the mod as data (`hooks/lib/sprites.gen.ts`); nothing is fetched or rendered at run time. A terminal shows them best with true color; the desktop app animates them in its sandboxed SVG frame (no script runs there). The sprite clock only ticks while a terminal shows a sprite.
- The studio is only for changing the art: the mod never needs `studio/node_modules`, and a copy of the mod for sharing can leave `studio/node_modules` and `studio/out` out.
- Bocchi, Nijika, Ryo and Kita are characters of *Bocchi the Rock!* (Aki Hamaji, Houbunsha / CloverWorks); this is a fan-made, unofficial mod.
