// Kessoku Ultimate Bocchi Theme: the band on stage, as data.
//
// Pure, no `$` and no `on`: who is playing, what each act is doing, how full
// its context is, what it costs, what failed and why, and the session's own
// figures, read off the mod's state into one view that every drawing of the
// panel (the desktop's scene, the terminal's cells, the strip) shares. Also
// the readers that fill in what an older version of the mod left out of
// `$.state`, which outlives a reload.

import type { KessokuAgent, KessokuBand, KessokuCache, KessokuMember, KessokuMood, KessokuSlimeState, KessokuUi } from '../../types'
import { fmtDuration, fmtTokens, fmtUsd, slimeState } from './band'
import { MEMBERS } from './palette'

/** How long an act that just ended holds its line bold in her color (its encore). */
export const ENCORE_MS = 8000
/** How long an act that ended stays in her pit, asleep. */
export const SLIME_TAIL_MS = 30_000
/** The members in the band's order. */
export const BAND_ORDER: readonly KessokuMember[] = ['bocchi', 'nijika', 'ryo', 'kita']
/** Her hotkey on the panel: the first letter of her name. */
export const SOLO_KEYS: Readonly<Record<KessokuMember, string>> = { bocchi: 'b', nijika: 'n', ryo: 'r', kita: 'k' }

export function isLive(a: KessokuAgent): boolean {
  return a.status === 'running' || a.status === 'pending' || a.status === 'waiting'
}

/** A member's mood from the agents on their part of the stage. */
export function memberMood(b: KessokuBand, member: KessokuMember, now: number): KessokuMood {
  if (member === 'bocchi') return b.mood
  const mine = b.agents.filter(a => a.member === member && a.id !== 'main')
  if (mine.some(a => isLive(a))) return 'focused'
  const latest = mine.filter(a => a.endedAt !== null).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0]
  // Her encore: a wrong note panics her, a stopped act sends her into her box, a finished one is a bow.
  if (latest && latest.endedAt !== null && now - latest.endedAt < ENCORE_MS) return latest.isError ? 'panic' : latest.status === 'killed' ? 'hiding' : 'happy'
  return 'anxious'
}

// `$.state` outlives a hot reload (`/reload-plugins`, an update), so a value written by an older version of the mod
// lacks the fields added since: these fill them in wherever the drawings and the bookkeeping read them.

/** An act as this version keeps it: a tool tally and a last tool, empty where an older version wrote it. */
export function agentOf(a: KessokuAgent): KessokuAgent {
  return a.toolTally === undefined || a.lastTool === undefined ? { ...a, toolTally: a.toolTally ?? {}, lastTool: a.lastTool ?? '' } : a
}

/** The band as this version keeps it: the set counted from 0, every act whole. */
export function bandOf(b: KessokuBand): KessokuBand {
  return { ...b, set: b.set ?? 0, setStartedAt: b.setStartedAt ?? 0, setPrompt: b.setPrompt ?? '', agents: b.agents.map(agentOf) }
}

/** The drawings' flags as this version keeps them: no solo where an older version wrote them. */
export function uiOf(u: KessokuUi): KessokuUi {
  return u.solo === undefined || u.soloAct === undefined || u.soloUntil === undefined || u.soloChosen === undefined
    ? { ...u, solo: u.solo ?? null, soloAct: u.soloAct ?? null, soloUntil: u.soloUntil ?? 0, soloChosen: u.soloChosen ?? false }
    : u
}

/** The solo as a drawing reads it: a solo past its due returns to the mix as it is read. */
export function soloNow(raw: KessokuUi, now: number): KessokuUi {
  const u = uiOf(raw)
  return u.solo !== null && u.soloUntil > 0 && now >= u.soloUntil ? { ...u, solo: null, soloAct: null, soloUntil: 0, soloChosen: false } : u
}

/** Her acts on the band, newest first (the main loop is no act). */
export function actsOf(b: KessokuBand, member: KessokuMember): KessokuAgent[] {
  return b.agents.filter(a => a.member === member && a.id !== 'main').sort((x, y) => y.startedAt - x.startedAt)
}

/** Whether an act is in its encore: ended less than ENCORE_MS ago. */
export function isEncore(a: KessokuAgent, now: number): boolean {
  return !isLive(a) && a.endedAt !== null && now - a.endedAt < ENCORE_MS
}

/** The acts her pit and her channel show first: live ones, then the rest newest first; on her solo the pressed act first. */
export function actsInOrder(b: KessokuBand, member: KessokuMember, first: string | null): KessokuAgent[] {
  const acts = actsOf(b, member)
  const ordered = [...acts.filter(isLive), ...acts.filter(a => !isLive(a))]
  if (first === null) return ordered
  const pick = ordered.find(a => a.id === first)
  return pick === undefined ? ordered : [pick, ...ordered.filter(a => a !== pick)]
}

/** The acts whose slimes stand in her pit: the live ones and those that ended less than SLIME_TAIL_MS ago. */
export function pitActs(b: KessokuBand, member: KessokuMember, now: number): KessokuAgent[] {
  return actsInOrder(b, member, null).filter(a => isLive(a) || (a.endedAt !== null && now - a.endedAt < SLIME_TAIL_MS))
}

/** The context her slot shows: the main loop's for Bocchi, her fullest live act's otherwise; -1 while she rests. */
export function slotContext(b: KessokuBand, member: KessokuMember): number {
  if (member === 'bocchi') return b.contextPercent
  const live = actsOf(b, member).filter(isLive)
  if (live.length === 0 || b.window <= 0) return -1
  return Math.round((Math.max(...live.map(a => a.context)) / b.window) * 100)
}

/** What she has spent: the main loop's cost for Bocchi (and any act seated with her), her acts' for the others. */
export function spendOf(b: KessokuBand, member: KessokuMember): number {
  const acts = actsOf(b, member).reduce((n, a) => n + a.cost, 0)
  return member === 'bocchi' ? (b.agents.find(a => a.id === 'main')?.cost ?? 0) + acts : acts
}

/** Her share of the session's spend in eighths, for a VU. */
export function vuLevel(b: KessokuBand, member: KessokuMember): number {
  if (b.sessionUsd <= 0) return 0
  return Math.max(0, Math.min(8, Math.round((spendOf(b, member) / b.sessionUsd) * 8)))
}

/** What her name line says after her name. */
export function channelState(b: KessokuBand, member: KessokuMember, now: number): string {
  const mood = memberMood(b, member, now)
  if (member === 'bocchi') return MEMBERS.bocchi.lines[mood]
  const acts = actsOf(b, member)
  const live = acts.filter(isLive).length
  if (live > 0) return `${live} playing`
  if (acts.length > 0) return 'set done'
  return MEMBERS[member].lines[mood]
}

/** The length of the set so far (or of the last one). */
export function setLength(b: KessokuBand, now: number): string {
  if (b.setStartedAt <= 0) return ''
  const main = b.agents.find(a => a.id === 'main')
  const end = b.isWorking ? now : (main?.endedAt ?? now)
  return fmtDuration(Math.max(0, end - b.setStartedAt))
}

/** `NOW PLAYING · Ryo · <act> · 48s`, Bocchi and the set's task with no act, `backstage · set 3` between turns. */
export function nowPlaying(b: KessokuBand, now: number): { who: KessokuMember | null; words: string } {
  const running = b.agents.filter(a => a.id !== 'main' && a.status === 'running').sort((x, y) => y.startedAt - x.startedAt)[0]
  if (running !== undefined) return { who: running.member, words: `${running.description.slice(0, 60)} · ${fmtDuration(now - running.startedAt)}` }
  if (b.isWorking) return { who: 'bocchi', words: b.mainTask || MEMBERS.bocchi.lines.focused }
  return { who: null, words: `backstage${b.set > 0 ? ` · set ${b.set}` : ''}` }
}

/** The acts on stage (the live ones). */
export function liveCount(b: KessokuBand): number {
  return b.agents.filter(a => a.id !== 'main' && isLive(a)).length
}

// ---- The view --------------------------------------------------------------------

/** One act as every drawing shows it. */
export type ActView = {
  id: string
  member: KessokuMember
  /** What it was asked: the description (the main loop's: the set's task). */
  title: string
  /** Its agent type (`kessoku-ultimate-bocchi:ryo`, `Explore`, `main`). */
  type: string
  state: 'playing' | 'waiting' | 'done' | 'failed' | 'stopped'
  isLive: boolean
  isEncore: boolean
  /** It ended in a failure (its status says so; the main loop never does). */
  isFailed: boolean
  /** A tool call in it failed at some point, whether or not it carried on. */
  hadError: boolean
  /** It started in the set on now (or there is no set yet): a failure from an earlier set no longer counts as a wrong note. */
  inSet: boolean
  /** Why it failed or stopped (`stopped: error`, the last wrong note), empty otherwise. */
  reason: string
  /** How long it has run, or ran. */
  age: string
  /** When it started (live) or ended, as minutes into the set (`5:14`), or as `2:40 ago` before the set. */
  at: string
  cost: string
  costUsd: number
  ctxPercent: number
  tokens: string
  /** The model it runs on (`claude-sonnet-5-5`), empty before its first step. */
  model: string
  /** Its model steps so far. */
  steps: number
  /** Its calls by tool, most first. */
  tools: { name: string; count: number }[]
  /** The tool in its hands (live) or the last it used. */
  tool: string
  slime: KessokuSlimeState
}

/** One member as every drawing shows her. */
export type MemberView = {
  member: KessokuMember
  name: string
  color: string
  instrument: string
  role: string
  mood: KessokuMood
  /** Her line after her name: `2 playing`, `set done`, her mood's words. */
  line: string
  hotkey: string
  isPlaying: boolean
  /** Her spotlight: up while she plays, and on a solo only hers. */
  isLit: boolean
  /** Faded: another member is on solo. */
  isDim: boolean
  isSolo: boolean
  /** Bocchi: the main loop first, then any act seated with her. The others: live acts first, then the rest newest first (on her solo the pressed act first). */
  acts: ActView[]
  /** The acts whose slimes stand at her feet (live, or ended within half a minute). */
  pit: ActView[]
  liveCount: number
  /** Her slot's context %, or -1 while she rests. */
  ctxPercent: number
  spend: string
  spendUsd: number
  /** Her share of the session's spend, 0..1. */
  share: number
}

export type PanelView = {
  now: number
  onAir: boolean
  set: number
  setLength: string
  mainTask: string
  ctxPercent: number
  /** The plan's fullest rate-limit window, 0 off a subscription. */
  planPercent: number
  session: string
  sessionUsd: number
  amp: { kind: 'warm' | 'cold' | 'keepwarm' | 'none'; words: string }
  liveCount: number
  lastError: string
  nowPlaying: { who: KessokuMember | null; words: string }
  solo: KessokuMember | null
  /** The act pressed to open the solo (listed first on her page), null for her newest. */
  soloAct: string | null
  members: MemberView[]
}

function actView(b: KessokuBand, a: KessokuAgent, now: number): ActView {
  const live = isLive(a)
  const failed = a.id !== 'main' && a.status === 'failed'
  const isMain = a.id === 'main'
  const ctx = isMain ? b.contextPercent : b.window > 0 ? Math.round((a.context / b.window) * 100) : 0
  const when = live || a.endedAt === null ? a.startedAt : a.endedAt
  const at = b.setStartedAt > 0 && when >= b.setStartedAt ? fmtDuration(when - b.setStartedAt) : `${fmtDuration(Math.max(0, now - when))} ago`
  const tally = a.toolTally ?? {}
  return {
    id: a.id,
    member: a.member,
    title: isMain ? b.setPrompt || b.mainTask || 'the main conversation' : a.description,
    type: a.type,
    state: a.status === 'running' ? 'playing' : live ? 'waiting' : failed ? 'failed' : a.status === 'killed' ? 'stopped' : 'done',
    isLive: isMain ? b.isWorking : live,
    isEncore: !isMain && isEncore(a, now),
    isFailed: failed,
    hadError: a.isError,
    inSet: isMain || b.setStartedAt <= 0 || (a.endedAt ?? a.startedAt) >= b.setStartedAt || live,
    reason: failed || a.status === 'killed' ? a.task : '',
    age: fmtDuration(Math.max(0, (a.endedAt ?? now) - (a.startedAt || now))),
    at,
    cost: fmtUsd(a.cost),
    costUsd: a.cost,
    ctxPercent: ctx,
    tokens: fmtTokens(a.usage.input + a.usage.cacheRead + a.usage.cacheWrite + a.usage.output),
    model: a.model,
    steps: a.steps,
    tools: Object.entries(tally)
      .map(([name, count]) => ({ name, count }))
      .sort((x, y) => y.count - x.count),
    tool: a.lastTool ?? '',
    slime: slimeState(a.status),
  }
}

/** The cache's warmth in a word or three, for the session's figures. */
function ampOf(c: KessokuCache, now: number, ttlMs: number): PanelView['amp'] {
  if (c.keepWarmUntil > now) return { kind: 'keepwarm', words: `keepwarm ${fmtDuration(c.keepWarmUntil - now)}` }
  if (c.lastWarmAt <= 0) return { kind: 'none', words: 'no cache yet' }
  const left = ttlMs - (now - c.lastWarmAt)
  return left <= 0 ? { kind: 'cold', words: `cold ${fmtDuration(-left)}` } : { kind: 'warm', words: `warm ${fmtDuration(left)}` }
}

/**
 * The panel as data: the band read through `bandOf`, the solo through
 * `soloNow`, the cache's warmth at its TTL. Every drawing of the panel draws
 * this, so the desktop and the terminal say the same things.
 */
export function panelView(rawBand: KessokuBand, cache: KessokuCache, rawUi: KessokuUi, now: number, ttlMs: number): PanelView {
  const b = bandOf(rawBand)
  const u = soloNow(rawUi, now)
  const main = b.agents.find(a => a.id === 'main')
  const members = BAND_ORDER.map((member): MemberView => {
    const m = MEMBERS[member]
    const own = actsInOrder(b, member, u.solo === member ? u.soloAct : null)
    const acts = (member === 'bocchi' && main !== undefined ? [main, ...own] : own).map(a => actView(b, a, now))
    const plays = member === 'bocchi' ? b.isWorking : own.some(isLive)
    const spendUsd = spendOf(b, member)
    return {
      member,
      name: m.name,
      color: m.color,
      instrument: m.instrument,
      role: m.role,
      mood: memberMood(b, member, now),
      line: channelState(b, member, now),
      hotkey: SOLO_KEYS[member],
      isPlaying: plays,
      isLit: u.solo === null ? plays : u.solo === member,
      isDim: u.solo !== null && u.solo !== member,
      isSolo: u.solo === member,
      acts,
      pit: pitActs(b, member, now).map(a => actView(b, a, now)),
      liveCount: own.filter(isLive).length,
      ctxPercent: slotContext(b, member),
      spend: fmtUsd(spendUsd),
      spendUsd,
      share: b.sessionUsd > 0 ? Math.min(1, spendUsd / b.sessionUsd) : 0,
    }
  })
  return {
    now,
    onAir: b.isWorking,
    set: b.set,
    setLength: setLength(b, now),
    mainTask: b.mainTask,
    ctxPercent: b.contextPercent,
    planPercent: b.rateLimitPercent,
    session: fmtUsd(b.sessionUsd),
    sessionUsd: b.sessionUsd,
    amp: ampOf(cache, now, ttlMs),
    liveCount: liveCount(b),
    lastError: b.lastError,
    nowPlaying: nowPlaying(b, now),
    solo: u.solo,
    soloAct: u.solo === null ? null : u.soloAct,
    members,
  }
}
