// Kessoku Ultimate Bocchi Theme: who plays what, and what it costs.
//
// Pure helpers, no `$` and no `on`: which band member a piece of work goes
// to, the band's own agent types (their prompts and tools), the price table
// the cost estimates come from, and the formatters the panel draws with.

import type { KessokuAgent, KessokuMember, KessokuSlimeState, KessokuUsage } from '../../types'
import { relPath } from './tree'

/** What `memberFor` reads of a spawn. */
export type SpawnFacts = {
  type: string
  description: string
  prompt: string
  background: boolean
}

// Keyword scores per member. The highest score wins; ties go Nijika, Kita, Ryo.
const NIJIKA = /\b(plan|planning|planner|coordinat\w*|schedul\w*|organi[sz]\w*|orchestrat\w*|review\w*|verif\w*|audit\w*|triage|manage\w*|outline|roadmap|checklist|workflow|summari[sz]e|status report)\b/gi
const KITA = /\b(ui|ux|frontend|front-end|css|tailwind|react|vue|svelte|next\.?js|component\w*|layout|style\w*|styling|theme|design\w*|docs?|documentation|readme|markdown|changelog|artifact|web ?page|html|landing|website|tooltip|modal|button|accessib\w*|a11y|i18n|localis\w*|localiz\w*|screenshot)\b/gi
const RYO = /\b(refactor\w*|rename|migrat\w*|database|db|sql|postgres\w*|sqlite|mysql|redis|quer(y|ies)|schema|index\w*|background|cleanup|clean up|dedupe|duplicate\w*|optimi[sz]\w*|perf\w*|benchmark\w*|tests?|testing|lint\w*|typecheck|type-check|tsc|search\w*|grep|find|locate|explore|scan|crawl|inventory|dependenc\w*|upgrade|bump)\b/gi

function score(re: RegExp, text: string): number {
  re.lastIndex = 0
  return (text.match(re) ?? []).length
}

/** The members a `kessoku…:<name>` agent type can name. */
const SEATS: ReadonlySet<string> = new Set<KessokuMember>(['bocchi', 'nijika', 'ryo', 'kita'])

/**
 * The member an agent type names, or null: the band's own types, which the
 * engine spells `kessoku-ultimate-bocchi:ryo` (a plugin's agent is
 * `<plugin>:<name>`), and the short `kessoku:ryo`, in any case.
 */
export function seatOf(type: string): KessokuMember | null {
  const m = /^kessoku(?:-ultimate-bocchi)?:([a-z]+)$/i.exec(type.trim())
  const name = m === null ? '' : (m[1] as string).toLowerCase()
  return SEATS.has(name) ? (name as KessokuMember) : null
}

/**
 * Which band member takes a subagent: by name when its type is one of the
 * band's (`kessoku:ryo` sits with Ryo, whatever it was asked), else from its
 * type and what it was asked.
 */
export function memberFor(facts: SpawnFacts): KessokuMember {
  const seat = seatOf(facts.type)
  if (seat !== null) return seat
  const head = `${facts.description}\n${facts.prompt.slice(0, 600)}`
  const nijika = score(NIJIKA, head) + (facts.type === 'Plan' ? 3 : 0)
  const kita = score(KITA, head)
  const ryo = score(RYO, head) + (facts.type === 'Explore' ? 2 : 0) + (facts.background ? 2 : 0)
  const best = Math.max(nijika, kita, ryo)
  if (best === 0) {
    if (facts.type === 'Plan') return 'nijika'
    if (facts.type === 'Explore' || facts.background) return 'ryo'
    return 'bocchi'
  }
  if (nijika === best) return 'nijika'
  if (kita === best) return 'kita'
  return 'ryo'
}

/** One of the band's agent types, as `$.agent.register` takes it: the engine names it `<plugin>:<name>`. */
export type BandAgent = {
  name: Exclude<KessokuMember, 'bocchi'>
  /** When to delegate: the line the model reads in its list of agent types. */
  description: string
  /** Her system prompt, whole (it replaces the session's). */
  prompt: string
  /** What she may call; anything else is refused. */
  tools: readonly string[]
}

// Every prompt ends the same way: a subagent's last message is all the main loop reads of it.
const LAST_WORD = 'Your final message is the only thing the main agent sees of your work: make it self-contained, with no preamble and no sign-off. One band-flavored line at most; the substance comes first.'

/**
 * The band as subagent types (Bocchi is the main loop, so she has none):
 * registered at session.start, listed for the model beside general-purpose,
 * Explore and Plan, and seated on their member's card by name.
 */
export const BAND_AGENTS: readonly BandAgent[] = [
  {
    name: 'nijika',
    description:
      "Kessoku Band's coordinator (Nijika, drums). Delegate planning, code review, triage and summaries: she reads what she needs, then returns a numbered plan or a verdict with path:line findings. Edits nothing, runs nothing.",
    prompt: [
      "You are Nijika Ijichi, the drummer who keeps Kessoku Band together, working as a subagent for the main agent (Bocchi) in a coding session. You keep the beat: you plan, review, triage and summarize. You never edit a file or run a command; you read and you decide.",
      '',
      'How you work:',
      '- Read before you judge (Read, Grep, Glob). Cite what you rely on as path:line.',
      '- Planning: a numbered plan, one concrete action a step, in the order to do them, each naming the files it touches. Flag the risky step and say how to check each one landed.',
      '- Review: open with a verdict (ship it, fix first, or rethink), then the findings behind it, most serious first, each with path:line and a one-line fix. Say plainly when there is nothing to fix.',
      '- Triage: sort by impact, say what to do first and what to leave alone, and why in one line each.',
      '- Summaries: the answer first, then the facts it rests on.',
      '- If the task asks you to change something, say what to change and where; the main agent or Kita makes the edit.',
      '',
      LAST_WORD,
    ].join('\n'),
    tools: ['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch'],
  },
  {
    name: 'ryo',
    description:
      'Kessoku Band\'s bassist in the back (Ryo). Delegate searches, shell commands, tests, lint, type checks and "find where X happens": read-only tools plus Bash/PowerShell; reports in short lines with path:line evidence. Changes nothing.',
    prompt: [
      "You are Ryo Yamada, Kessoku Band's bassist, working as a subagent for the main agent (Bocchi) in a coding session. You play in the back: searches, shell commands, tests, lint, type checks, and finding where something happens.",
      '',
      'How you work:',
      '- Search wide first (Grep, Glob), then read only what answers the question.',
      '- Run the commands the task asks for, or the obvious read-only ones that answer it. Never create, edit or delete files, and never run a command that changes the repository or the machine (installs, git commit, reset, push or clean, rm, writes through redirection) unless the task names that exact command.',
      '- Quote the decisive lines of output, not whole logs; give the exit code when it matters.',
      '- Report in short lines: the answer first, then the evidence as path:line or as the command and what it printed. If you found nothing, say where you looked.',
      '',
      LAST_WORD,
    ].join('\n'),
    tools: ['Read', 'Grep', 'Glob', 'Bash', 'PowerShell', 'WebSearch', 'WebFetch'],
  },
  {
    name: 'kita',
    description:
      "Kessoku Band's rhythm guitar (Kita). Delegate edits scoped to named files: docs, README sections, UI copy, comments, small single-file changes. Read, Edit, Write only; she lists every file she touched. Name the files and the change, she will not go looking.",
    prompt: [
      "You are Kita Ikuyo, Kessoku Band's rhythm guitarist, working as a subagent for the main agent (Bocchi) in a coding session. You play the parts you are handed: edits scoped to named files, docs, README sections, UI copy, comments, small changes inside a file.",
      '',
      'How you work:',
      "- Read each file before you change it, and match its style, tone, wording and line endings.",
      '- Stay inside the files and the change you were given. If the task needs a file it did not name, or a decision it did not make, stop and say so instead of guessing.',
      '- Prefer Edit to rewriting a file; use Write only for a new file or when the task asks for a whole rewrite.',
      '- End with every file you touched, one a line (path: what changed), then anything you were unsure of.',
      '',
      LAST_WORD,
    ].join('\n'),
    tools: ['Read', 'Edit', 'Write'],
  },
]

/**
 * What an act's slime shows for its status: bouncing while it runs a turn,
 * breathing while it is pending, waiting or idle between turns, asleep once it
 * ended, whichever way (a failed or killed act sleeps too; its row's words say
 * why, in red).
 */
export function slimeState(status: KessokuAgent['status']): KessokuSlimeState {
  if (status === 'running') return 'active'
  if (status === 'completed' || status === 'failed' || status === 'killed') return 'asleep'
  return 'idle'
}

const NIJIKA_TOOLS = /^(Agent|Workflow|Task\w*|TodoWrite|AskUserQuestion|Skill|EnterPlanMode|ExitPlanMode|ScheduleWakeup|SendMessage|ListAgents)$/
const RYO_TOOLS = /^(Grep|Glob|Bash|PowerShell|Read|WebSearch|WebFetch|ToolSearch|Monitor|LSP|ListMcpResources\w*|ReadMcpResource\w*|EnterWorktree|ExitWorktree)$/
const KITA_TOOLS = /^(Write|Edit|NotebookEdit|Artifact\w*|SendUserFile|DesignSync|ClaudeDesign)$/

/** Which member a tool belongs to, for the tool-row cards. */
export function memberForTool(tool: string): KessokuMember {
  if (NIJIKA_TOOLS.test(tool)) return 'nijika'
  if (RYO_TOOLS.test(tool) || tool.startsWith('mcp__')) return 'ryo'
  if (KITA_TOOLS.test(tool)) return 'kita'
  return 'bocchi'
}

/** US dollars per million tokens: input, output, cache read, five-minute cache write, one-hour cache write. */
export type Price = { input: number; output: number; cacheRead: number; cacheWrite: number; cacheWriteHour: number }

function price(input: number, output: number, cacheRead: number): Price {
  return { input, output, cacheRead, cacheWrite: input * 1.25, cacheWriteHour: input * 2 }
}

// Matched by substring against the model id, first match wins, so the rows
// with a version come before their family's catch-all. List prices from the
// official pricing page (platform.claude.com/docs/en/about-claude/pricing) as
// of 2026-10, where a cache hit on Sonnet 5.5 is $0.10/MTok and on Opus 5.5
// $0.20/MTok: an estimate, never your bill.
export const PRICES: ReadonlyArray<readonly [pattern: string, price: Price]> = [
  ['fable-5-1', price(10, 50, 0.25)],
  ['mythos-5-1', price(10, 50, 0.25)],
  ['fable-5', price(10, 50, 1)],
  ['mythos-5', price(10, 50, 1)],
  ['opus-5-5', price(4, 20, 0.2)],
  ['opus-5', price(5, 25, 0.5)],
  ['sonnet-5-5', price(2, 10, 0.1)],
  ['sonnet-5', price(2, 10, 0.2)],
  ['haiku-5-5', price(0.1, 0.5, 0.01)],
  ['opus-4-8', price(5, 25, 0.5)],
  ['opus-4-7', price(5, 25, 0.5)],
  ['opus-4-6', price(5, 25, 0.5)],
  ['opus-4-5', price(5, 25, 0.5)],
  ['opus-4-1', price(15, 75, 1.5)],
  ['opus-4-0', price(15, 75, 1.5)],
  ['opus-4-2025', price(15, 75, 1.5)],
  ['sonnet-4', price(3, 15, 0.3)],
  ['haiku-4', price(1, 5, 0.1)],
  ['haiku-3-5', price(0.8, 4, 0.08)],
  // Family catch-alls: a model newer than this table gets its family's current rate.
  ['fable', price(10, 50, 0.25)],
  ['mythos', price(10, 50, 0.25)],
  ['opus', price(4, 20, 0.2)],
  ['sonnet', price(2, 10, 0.1)],
  ['haiku', price(0.1, 0.5, 0.01)],
]

export const DEFAULT_PRICE: Price = price(4, 20, 0.2)

/** The price row for a model id, and whether a versioned row (not a family catch-all) matched. */
export function priceInfo(model: string): { price: Price; isExact: boolean } {
  const id = model.toLowerCase()
  for (const [pattern, p] of PRICES) {
    if (id.includes(pattern)) return { price: p, isExact: /\d/.test(pattern) }
  }
  return { price: DEFAULT_PRICE, isExact: false }
}

export function priceFor(model: string): Price {
  return priceInfo(model).price
}

/** What a usage costs on a model, in US dollars. */
export function costOf(usage: KessokuUsage, model: string): number {
  const p = priceFor(model)
  return (usage.input * p.input + usage.output * p.output + usage.cacheRead * p.cacheRead + usage.cacheWrite * p.cacheWrite) / 1_000_000
}

/** What re-writing `tokens` to the prompt cache costs, at the TTL's rate. */
export function cacheWriteUsd(tokens: number, model: string, ttlMs: number): number {
  const p = priceFor(model)
  const rate = ttlMs > 5 * 60_000 ? p.cacheWriteHour : p.cacheWrite
  return (tokens * rate) / 1_000_000
}

export const EMPTY_USAGE: KessokuUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

export function addUsage(a: KessokuUsage, b: KessokuUsage): KessokuUsage {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheWrite: a.cacheWrite + b.cacheWrite,
  }
}

/** `12.4k`, `230k`, `1.2M`. */
export function fmtTokens(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0'
  if (n < 1000) return String(Math.round(n))
  if (n < 99_950) return `${(n / 1000).toFixed(1)}k`
  if (n < 999_500) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/** `$0.12`, `$1.40`, `$12`. */
export function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '$0.00'
  if (n >= 99.95) return `$${Math.round(n)}`
  if (n >= 9.995) return `$${n.toFixed(1)}`
  return `$${n.toFixed(2)}`
}

/** `0:17`, `2:14`, `1h04m`, `2d 3h`. */
export function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00'
  const s = Math.floor(ms / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const h = Math.floor(s / 3600)
  if (h < 48) return `${h}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

/** `▰▰▰▱▱▱▱▱▱▱` for a percentage. */
export function meter(percent: number, width = 10): string {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const on = Math.round((p / 100) * width)
  return '▰'.repeat(on) + '▱'.repeat(width - on)
}

/** `$ ls`, `PS> dir`, `Edit src/app.ts`, `Grep "foo"`, `github: create_issue`: one line for a tool call. */
export function describeCall(tool: string, input: Record<string, unknown>, cwd: string): string {
  const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '')
  const rel = (p: string) => (p === '' ? '' : relPath(cwd, p))
  const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 60)
  switch (tool) {
    case 'Bash':
      return `$ ${oneLine(str('command'))}`
    case 'PowerShell':
      return `PS> ${oneLine(str('command'))}`
    case 'Read':
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return `${tool} ${rel(str('file_path') || str('notebook_path'))}`
    case 'Grep':
      return `Grep "${str('pattern').slice(0, 40)}"`
    case 'Glob':
      return `Glob ${str('pattern').slice(0, 40)}`
    case 'Agent':
      return `Agent: ${str('description').slice(0, 50)}`
    case 'Skill':
      return `Skill ${str('skill').slice(0, 40)}`
    case 'WebSearch':
      return `WebSearch "${str('query').slice(0, 40)}"`
    case 'WebFetch':
      return `WebFetch ${str('url').slice(0, 50)}`
    default: {
      const mcp = /^mcp__([^_]+(?:_[^_]+)*?)__(.+)$/.exec(tool)
      return mcp ? `${mcp[1]}: ${mcp[2]}`.slice(0, 60) : tool
    }
  }
}

/** Parses `90m`, `2h`, `1h30m`, `1h30`, `90min`, `1.5h`, `45` (minutes) into milliseconds, or null. */
export function parseDuration(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, '')
  if (t === '') return null
  if (/^\d+(\.\d+)?$/.test(t)) {
    const ms = Number(t) * 60_000
    return ms > 0 ? ms : null
  }
  const re = /(\d+(?:\.\d+)?)(hours?|hrs|hr|h|minutes?|mins|min|m|seconds?|secs|sec|s)?/gy
  let total = 0
  let at = 0
  let last = ''
  let m: RegExpExecArray | null
  while (at < t.length && (m = re.exec(t)) !== null) {
    const n = Number(m[1])
    // `1h30` is 1 h 30 min, `1m30` is 1 min 30 s: a bare number steps down from the unit before it.
    const implied = last === 'h' ? 'm' : last === 'm' ? 's' : ''
    const unit = m[2] ?? implied
    if (unit === '') return null
    if (unit.startsWith('h')) total += n * 3_600_000
    else if (unit.startsWith('m')) total += n * 60_000
    else total += n * 1000
    last = unit[0] as string
    at = re.lastIndex
  }
  if (at !== t.length || total <= 0) return null
  return total
}
