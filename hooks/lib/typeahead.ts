// Kessoku Ultimate Bocchi Theme: the typeahead.
//
// Pure, no `$` and no `on`: what the prompt box's typeahead offers for the
// mod's own commands (`prompt.autocomplete`), from the draft and the token at
// the cursor: /bocchi's sub-commands and their arguments, /keepwarm's
// durations. The descriptions are the help's words, so the two agree.

/** One row of the typeahead: what taking it writes over the token, what the row shows (the text when absent), a dim line beside it. */
export type Completion = { text: string; label?: string; description?: string }

/** The prompt box as `prompt.autocomplete` hands it: the draft, the caret, the token that ends at the caret, and where it starts. */
export type Draft = { text: string; cursor: number; token: string; start: number }

type Word = readonly [word: string, description: string]

/** /bocchi's sub-commands, in the order help lists them. */
export const BOCCHI_VERBS: readonly Word[] = [
  ['theme', "switch Claude Code's own theme to Kessoku Bocchi, or back: on | off | status"],
  ['mood', 'try a face in the status line: anxious | focused | happy | panic | melting | hiding'],
  ['demo', 'put sample acts on the panel (demo off clears them)'],
  ['tax', 'preview the Cache Tax warning'],
  ['crash', 'preview the dropped-guitar screen'],
  ['memo', "preview Nijika's band memo"],
  ['setlist', 'preview Replay Theater with a sample setlist'],
  ['strip', 'hide or show the band strip above the prompt'],
  ['help', 'the commands, the versions, the config'],
]

export const THEME_ARGS: readonly Word[] = [
  ['on', 'put the Kessoku theme on (the light twin on a light theme)'],
  ['off', 'put the theme you had back'],
  ['status', 'which theme is on, and whether Kessoku is listed'],
]

export const MOOD_ARGS: readonly Word[] = [
  ['anxious', 'idle'],
  ['focused', 'working'],
  ['happy', 'a turn landed'],
  ['panic', 'a wrong note'],
  ['melting', 'the context is full'],
  ['hiding', 'interrupted'],
]

export const DEMO_ARGS: readonly Word[] = [['off', 'clear the sample acts']]

/** /keepwarm's durations (any `90m`, `1h30`, `2h` works; these are the ones offered). */
export const KEEPWARM_ARGS: readonly Word[] = [
  ['30m', 'keep the prompt cache warm for half an hour'],
  ['1h', 'keep the prompt cache warm for an hour'],
  ['2h', 'keep the prompt cache warm for two hours'],
  ['off', 'stop the pings'],
]

const BOCCHI = '/bocchi'
const KEEPWARM = '/keepwarm'

/** What /bocchi's sub-commands take, by sub-command; one not listed takes nothing. */
const BOCCHI_ARGS: Readonly<Record<string, readonly Word[]>> = { theme: THEME_ARGS, mood: MOOD_ARGS, demo: DEMO_ARGS }

/** The words the token begins (ignoring case), each a row; a word the token spells whole is no completion. */
function rows(words: readonly Word[], token: string): Completion[] {
  const t = token.toLowerCase()
  return words.filter(([w]) => w.startsWith(t) && w !== t).map(([w, description]) => ({ text: w, description }))
}

/**
 * The rows for the token at the cursor. A draft that is exactly `/bocchi` or
 * `/keepwarm`: every next word, written out whole (`/bocchi theme`; the
 * engine's own row already completes a command's name, so a prefix of it adds
 * nothing). `/bocchi <word>`: the sub-commands the word begins. `/bocchi
 * theme|mood|demo <word>` and `/keepwarm <word>`: the arguments it begins.
 * Anything else: nothing.
 */
export function completions(d: Draft): Completion[] {
  const before = d.text.slice(0, d.start)
  if (before.trim() === '') {
    if (d.token === BOCCHI) return BOCCHI_VERBS.map(([w, description]) => ({ text: `${BOCCHI} ${w}`, description }))
    if (d.token === KEEPWARM) return KEEPWARM_ARGS.map(([w, description]) => ({ text: `${KEEPWARM} ${w}`, description }))
    return []
  }
  // The token is not the first word: the draft so far must be the command alone, or the command and its sub-command.
  if (!/^\s*\//.test(before)) return []
  const words = before.trim().split(/\s+/)
  const command = (words[0] ?? '').toLowerCase()
  if (command === BOCCHI && words.length === 1) return rows(BOCCHI_VERBS, d.token)
  if (command === BOCCHI && words.length === 2) return rows(BOCCHI_ARGS[(words[1] ?? '').toLowerCase()] ?? [], d.token)
  if (command === KEEPWARM && words.length === 1) return rows(KEEPWARM_ARGS, d.token)
  return []
}
