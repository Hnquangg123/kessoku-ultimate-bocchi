// Kessoku Ultimate Bocchi Theme: Nijika's notebook.
//
// Pure: spotting a correction in a prompt, the prompt that turns it into one
// rule, the memo tool Claude proposes a rule through (its spec, the check a
// proposal passes, what the call answers), and how a rule lands in a CLAUDE.md.

// Openers that say "do it differently from now on", not a question or a task.
const OPENERS = /^\s*(?:no\s*[,.!:—–-]\s*(?:don'?t|do not|not|never|use|we|in this|that'?s|you|please)|nope\b|don'?t(?!\s+(?:worry|forget|mind|bother|hesitate))\b|do not\b|never(?! mind)\b|wrong\b|incorrect\b|from now on\b|going forward\b|rule:|remember(?::| that\b| to (?:always|never)\b)|please (?:use|don'?t|do not|never|always|prefer|avoid|keep|stop using)\b|prefer\b|avoid\b(?!\s+(?:breaking|this))|always\b(?!\s+(?:been|has|was|worry))|stop (?:using|doing|adding|writing)\b|you should(?:n'?t| not)?\b|that'?s (?:wrong|incorrect|not right|not how)\b|actually,?\s+(?:don'?t|do not|no\b|use|we|it should|it'?s)|in this (?:repo|project|codebase)\b|we (?:always|never|use|don'?t|do not|write|put|keep|name|call|prefer)\b(?!\s+(?:this|that)\s+(?:config|setup|file))|use \S+ (?:instead|not|rather)\b)/i
// Said once and worth a rule on its own: a plain telling-off, or a move from one tool to another.
const STRONG = /^\s*(?:i (?:said|told you|asked for)\b|not like that\b|wrong[,.!:]|stop using\b.{1,60}\b(?:we )?(?:moved|switched|use)\b)/i
// Pairs that set one thing against another: "X, not Y", "A instead of B".
const PAIRS = /\b(?:instead of|rather than|not .{1,40}\buse\b|use .{1,40}\bnot\b|never .{1,60}\balways\b|always .{1,60}\bnever\b|should (?:not|never|always)\b|(?:is|are|lives?|belongs?|goes?) (?:at|in|under) .{1,40},? not\b|,\s*not\s+\S+\s*\.?\s*$|\bmoved to\b|\bswitched to\b)/i
// A sentence about a durable preference names a tool, a style or this place.
const SUBJECT = /\b(?:repo|repository|project|codebase|here|convention|style|format|indent|tabs?|spaces|pnpm|npm|yarn|bun|eslint|prettier|lint|tests?|vitest|jest|pytest|commit|branch|main|master|import|export|types?|interface|enum|any|null|undefined|semicolons?|quotes|snake_case|camelCase|kebab|tailwind|css|sass|docker|make|cargo|go|python|typescript|javascript|api|endpoint|v\d|folder|directory|files?|naming|name|prefix|suffix|default|config)\b/i

/**
 * Whether a prompt reads like a correction of how Claude works: a strong
 * telling-off on its own, or two signals among an opener ("don't", "always",
 * "in this repo"), a pair ("X, not Y", "A instead of B") and a subject (a
 * tool, a style, this repository). A question is never one, nor a slash command.
 */
export function looksLikeCorrection(text: string): boolean {
  const t = text.trim()
  if (t.length < 8 || t.length > 1500) return false
  if (t.startsWith('/') || t.startsWith('!') || t.startsWith('#')) return false
  if (/\?\s*$/.test(t)) return false
  if (STRONG.test(t)) return true
  let score = 0
  if (OPENERS.test(t)) score += 1
  if (PAIRS.test(t)) score += 1
  if (SUBJECT.test(t)) score += 1
  return score >= 2
}

/** The one-shot prompt that asks a small model for the rule, or NONE. */
export function rulePrompt(original: string): string {
  return [
    'You are the band manager keeping a notebook of durable rules for an AI coding assistant.',
    'The user just corrected the assistant with the message below.',
    'If the message contains a durable, reusable rule (a preference about tools, libraries, style, workflow, or this repository), write it as ONE imperative sentence under 140 characters, in plain English, with no quotes around it and no list marker.',
    'Example: Always use pnpm instead of npm in this repository.',
    'If it is a one-off instruction with no lasting rule, answer exactly: NONE',
    'Answer with the rule or NONE and nothing else.',
    '',
    '<message>',
    original.slice(0, 1500),
    '</message>',
  ].join('\n')
}

/** The model's reply as a rule line, or '' when it said NONE or rambled. */
export function cleanRule(reply: string): string {
  // The first line that is text: not blank, not a code fence, not a rule.
  const line = reply.trim().split('\n').find(l => l.trim() !== '' && !/^\s*(```|~~~|---)/.test(l)) ?? ''
  const rule = line
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/^rule:\s*/i, '')
    .replace(/^(["'“‘])(.*)["'”’]$/, '$2') // a matched pair of quotes, never one side alone
    .trim()
  if (rule === '' || /^none\b/i.test(rule) || rule.length > 220 || !/[A-Za-z]/.test(rule)) return ''
  return /[.!?]$/.test(rule) ? rule : `${rule}.`
}

/** The memo tool's short name, and the full one the model calls (`mcp__<plugin>__<name>`). */
export const MEMO_TOOL_NAME = 'memo'
export const MEMO_TOOL = 'mcp__kessoku-ultimate-bocchi__memo'

/** A proposed rule is one sentence shorter than this. */
export const RULE_MAX = 140
/** Proposals waiting behind the open memo, at most. */
export const MEMO_QUEUE_MAX = 5

/** The memo tool as `$.tool.register` takes it: what the model reads, and the input it gives. */
export const MEMO_TOOL_SPEC = {
  name: MEMO_TOOL_NAME,
  description: [
    "kessoku memo: propose one durable rule for this repository's CLAUDE.md when you notice a convention you have broken or had to re-learn (a tool, a style, a workflow, a place things live).",
    `One imperative sentence under ${RULE_MAX} characters.`,
    'The user decides: the rule is shown as a band memo and saved only if they press Save, so the call returns at once and nothing exists until then; never assume the rule was written.',
    'Never call it for a one-off instruction, and never to repeat what CLAUDE.md already says.',
  ].join(' '),
  inputSchema: {
    type: 'object',
    properties: {
      rule: { type: 'string', description: `The rule: one imperative sentence under ${RULE_MAX} characters, e.g. "Use pnpm, not npm, for every script in this repository."` },
      why: { type: 'string', description: 'Optional: what made you notice it, in one short line.' },
    },
    required: ['rule'],
    additionalProperties: false,
  },
  isDeferred: false,
} as const

// A full stop after one of these does not end a sentence.
const ABBREVIATIONS = /\b(?:e\.g|i\.e|etc|vs|cf|approx)\.$/i

/**
 * A proposed rule as it would be saved, or why it is refused: a string, one
 * line, one sentence, under RULE_MAX characters, with a letter in it. Spaces
 * are collapsed, a list marker or a matched pair of quotes around it dropped,
 * and a full stop added when it ends without one.
 */
export function checkRule(input: unknown): { rule: string } | { why: string } {
  if (typeof input !== 'string' || input.trim() === '') return { why: 'the rule is empty: give one imperative sentence' }
  if (/[\r\n]/.test(input.trim())) return { why: 'the rule runs over several lines: give one sentence on one line' }
  const flat = input
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/^rule:\s*/i, '')
    .replace(/^(["'“‘])(.*)["'”’]$/, '$2')
    .trim()
  if (!/[A-Za-z]/.test(flat)) return { why: 'the rule has no words in it' }
  const rule = /[.!?]["'”’)\]]*$/.test(flat) ? flat : `${flat}.`
  if (rule.length >= RULE_MAX) return { why: `the rule is ${rule.length} characters; keep it under ${RULE_MAX}` }
  // A sentence ends at . ! or ? (a closing quote or bracket may follow) before a space and a capital or a digit.
  const ends = [...rule.matchAll(/[.!?]["'”’)\]]*\s+(?=[A-Z0-9"“'‘(])/g)].filter(m => !ABBREVIATIONS.test(rule.slice(0, (m.index ?? 0) + 1)))
  if (ends.length > 0) return { why: `the rule reads as ${ends.length + 1} sentences; propose one rule a call, in one sentence` }
  return { rule }
}

/** What the model reads back from a memo it proposed: where the rule stands, and that nothing is written yet. */
export function memoAnswer(kind: 'open' | 'queued' | 'duplicate', waiting = 0): string {
  const tail = 'Nothing is written until the user presses Save; do not assume the rule exists, and do not propose it again.'
  if (kind === 'duplicate') return `Already held for the user: that rule is on Nijika's memo card or waiting behind it. ${tail}`
  if (kind === 'queued') return `Held for the user: queued behind the memo already on screen (${waiting} waiting). ${tail}`
  return `Held for the user: Nijika's memo card is up with the rule. ${tail}`
}

export const RULES_HEADING = '## Band notes (from Reflect)'

/**
 * `existing` with the rule appended once, under the band's heading: after
 * the heading's own list when the heading exists, as a new section at the
 * end otherwise. The file's own line ending (CRLF or LF) is kept.
 */
export function appendRule(existing: string, rule: string): string {
  const line = `- ${rule}`
  const eol = /\r\n/.test(existing) ? '\r\n' : '\n'
  const lines = existing === '' ? [] : existing.split(/\r\n|\n/)
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  if (lines.some(l => l.trim() === line)) return existing
  if (lines.length === 0) lines.push('# CLAUDE.md')
  // Find the heading outside code fences (``` or ~~~, of any length; a fence closes with its own kind, at least as long).
  let fence: string | null = null
  let at = -1
  for (let i = 0; i < lines.length; i += 1) {
    const l = (lines[i] as string).trim()
    const m = /^(`{3,}|~{3,})/.exec(l)
    if (m !== null) {
      const mark = m[1] as string
      if (fence === null) fence = mark
      else if (mark[0] === fence[0] && mark.length >= fence.length && l === mark) fence = null
      continue
    }
    if (fence === null && l === RULES_HEADING) {
      at = i
      break
    }
  }
  if (at < 0) {
    if ((lines[lines.length - 1] as string).trim() !== '') lines.push('')
    lines.push(RULES_HEADING, line)
    return lines.join(eol) + eol
  }
  // The heading's list: items and blank lines until the next heading or other text.
  let end = at
  for (let i = at + 1; i < lines.length; i += 1) {
    const l = (lines[i] as string).trim()
    if (l === '') continue
    if (l.startsWith('- ') || l.startsWith('* ')) {
      end = i
      continue
    }
    break
  }
  lines.splice(end + 1, 0, line)
  return lines.join(eol) + eol
}
