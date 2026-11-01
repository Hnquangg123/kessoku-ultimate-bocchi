// Kessoku Ultimate Bocchi Theme: the ♨ Hotpot, the prompt cache as the band's after-show hotpot.
//
// Pure, no `$` and no `on`. The cache's warmth read as the feast's phase
// (`feastOf`), which the strip, the chalkboard's foot and the terminal's rail
// share with the pane, so they never disagree; when the next redraw is due
// (`warmthDue`, `hotpotDue`), since nothing redraws on a clock; the ledger's
// arithmetic (each model request, ping, re-heat and summary booked, judged
// against P, the main loop's last prompt, and the TTL learned from what the
// steps show) and its figures (hit rate, saving, a re-order, a top-up, a day
// of keepwarm); the wooden board's two lines, the bill's rows, the buttons'
// words and why one is dim; and the drawing: the izakaya room, the square
// table, the donabe and what is in it, the four seated at the table's sides
// (`hotpotSvg`, memoised, no clock inside, so a redraw that changes nothing
// sends the same string and the animations never restart), the terminal's
// table and pot under the minis (`hotpotCells`), and the alt words.
//
// A leaf: no value imports from stage.ts (whose `ampOf` calls `feastOf`).

import type { KessokuCache, KessokuCacheShare, KessokuFeastState, KessokuHotpot, KessokuLedger, KessokuMember, KessokuMood } from '../../types'
import { fmtTokens, fmtUsd, priceInfo } from './band'
import { MEMBERS } from './palette'
import { block, oval, pix, pixPaths, placedArt, pline, put, pxAt, rim, spliceAfter } from './pixart'
import type { Pix } from './pixart'
import type { SceneLayout, SceneSvg } from './scene'
import { fitSprites, spriteId, SVG_LIMIT } from './sprite'
import type { SpritePart, SpriteTable } from './sprite'
import { SPRITES } from './sprites.gen'
import { capped, esc, f, SANS, sparkle, svgDoc, textWidth } from './svgtext'

type Member = KessokuMember

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** The cold notice's window, and last orders: the last five minutes of the TTL (half of it when that is shorter). */
export const COLD_NOTICE_MS = 5 * MINUTE
/** A Cache Tax hold stands this long. */
export const HELD_PROMPT_MS = 15 * MINUTE
/** Re-heat, zosui and clear the table wait this long for their second press. */
export const ARM_MS = 10_000
/** A one-shot moment of the feast (a ping, a re-heat, keepwarm switched on, a paid re-order). */
export const MOMENT_MS = 2400
/** What a press said, in place of the wooden board's first tail. */
export const NOTE_MS = 6000
/** Keepwarm pings once the cache is this close to its TTL (its minute tick finds it so). */
export const PING_LEAD_MS = 90_000
/** A ping's own tokens: its few words in, its word out. */
export const PING_INPUT = 30
export const PING_OUTPUT = 8
/** Consecutive cacheless main-loop steps that mean caching is off. */
export const CACHELESS_RUN = 3
/** Below this many tokens of context there is nothing worth topping up. */
export const TOP_UP_MIN_TOKENS = 1000

// ---- The phase -----------------------------------------------------------------------------------------

/**
 * The feast as the cache stands: `zosui` while compacting, `held` while a send
 * is held, `off` while caching is off, `none` or `cleared` with nothing cached,
 * `cold` once lapsed, `last` (or `tend`, keepwarm on) in the cold notice's
 * window, else `feast`, `simmer` or `low` by the warmth left.
 */
export type FeastPhase = 'zosui' | 'held' | 'off' | 'none' | 'cleared' | 'cold' | 'last' | 'tend' | 'feast' | 'simmer' | 'low'

/** The feast's step: 5 and 4 a feast, 3 simmering, 2 running low, 1 last orders, 0 cold (and nothing on the stove). */
export type FeastLevel = 0 | 1 | 2 | 3 | 4 | 5

export type Feast = { phase: FeastPhase; level: FeastLevel; leftMs: number; ageMs: number }

export type FeastFlags = { held?: boolean; compacting?: boolean; cleared?: boolean; cachingOff?: boolean }

/** The last stretch of the TTL: the cold notice's window, which is last orders. */
export function lastWindow(ttlMs: number): number {
  return Math.min(COLD_NOTICE_MS, ttlMs / 2)
}

/**
 * The feast's phase, level, the time left (negative once cold) and the age
 * of the warmth. Cold means `now - lastWarmAt >= TTL`, everywhere.
 */
export function feastOf(cache: Pick<KessokuCache, 'lastWarmAt' | 'keepWarmUntil'>, now: number, ttlMs: number, flags: FeastFlags = {}): Feast {
  const warmed = cache.lastWarmAt > 0
  const ageMs = warmed ? now - cache.lastWarmAt : 0
  const leftMs = warmed ? ttlMs - ageMs : 0
  const at = (phase: FeastPhase, level: FeastLevel): Feast => ({ phase, level, leftMs, ageMs })
  if (flags.compacting === true) return at('zosui', 5)
  if (flags.held === true) return at('held', 0)
  if (flags.cachingOff === true) return at('off', 0)
  if (!warmed) return at(flags.cleared === true ? 'cleared' : 'none', 0)
  if (leftMs <= 0) return at('cold', 0)
  if (leftMs <= lastWindow(ttlMs)) return at(cache.keepWarmUntil > now ? 'tend' : 'last', 1)
  const w = leftMs / ttlMs
  return w > 0.84 ? at('feast', 5) : w > 2 / 3 ? at('feast', 4) : w > 1 / 3 ? at('simmer', 3) : at('low', 2)
}

/** Whether the phase is a warm one: food on the stove and time left. */
export function isWarmPhase(phase: FeastPhase): boolean {
  return phase === 'feast' || phase === 'simmer' || phase === 'low' || phase === 'last' || phase === 'tend'
}

// ---- The words that count minutes ------------------------------------------------------------------------

/** A stretch as the strip counts it, in whole minutes rounded down: `under 1m`, `48m`, `5h 12m`, `5h`; `tight` drops the space (`5h12m`). */
export function minutesText(ms: number, tight = false): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return 'under 1m'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? (m > 0 ? `${h}h${tight ? '' : ' '}${m}m` : `${h}h`) : `${m}m`
}

/** A length as the buttons name it: `30m`, `1h`, `2h`, `6h`, `1h30m`. */
export function lengthText(ms: number): string {
  const total = Math.max(1, Math.round(ms / MINUTE))
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? (m > 0 ? `${h}h${m}m` : `${h}h`) : `${m}m`
}

/** The warmth in the strip's words (the desktop sign, both terminal strips, after `cache `) and the chalkboard's foot. */
export function stripWords(fe: Feast, cache: Pick<KessokuCache, 'keepWarmUntil'>, now: number): string {
  const kept = cache.keepWarmUntil > now
  switch (fe.phase) {
    case 'none':
    case 'cleared':
      return 'no cache yet'
    case 'off':
      return 'no cache here (caching off)'
    case 'last':
      return `last orders, cold in ${minutesText(fe.leftMs)}`
    case 'cold':
      return `cold for ${minutesText(-fe.leftMs)}${kept ? ' · keepwarm on' : ''}`
    case 'held':
      return fe.ageMs > 0 ? `cold for ${minutesText(-fe.leftMs)} · a send is held` : 'a send is held'
    case 'zosui':
      return 'zosui (compacting)'
    default:
      return kept ? `kept warm, ${minutesText(cache.keepWarmUntil - now)} left` : `warm, ${minutesText(fe.leftMs)} left`
  }
}

/** The warmth on the terminal panel's rail. */
export function railWords(fe: Feast, cache: Pick<KessokuCache, 'keepWarmUntil'>, now: number): string {
  const kept = cache.keepWarmUntil > now
  switch (fe.phase) {
    case 'none':
    case 'cleared':
      return '○ no cache yet'
    case 'off':
      return '○ caching off'
    case 'last':
      return `☀ last orders ${minutesText(fe.leftMs, true)}`
    case 'cold':
      return `❄ cold${kept ? ' · keepwarm on' : ''}`
    case 'held':
      return '❄ cold · held'
    case 'zosui':
      return '〆 zosui'
    default:
      return kept ? `● keepwarm ${minutesText(cache.keepWarmUntil - now, true)}` : `☀ warm ${minutesText(fe.leftMs, true)}`
  }
}

/** The warmth's four kinds, by the warmth alone: nothing cached, cold once lapsed (keepwarm on or not), kept warm, warm. */
export function ampKind(cache: Pick<KessokuCache, 'lastWarmAt' | 'keepWarmUntil'>, now: number, ttlMs: number): 'warm' | 'cold' | 'keepwarm' | 'none' {
  if (cache.lastWarmAt <= 0) return 'none'
  if (now - cache.lastWarmAt >= ttlMs) return 'cold'
  return cache.keepWarmUntil > now ? 'keepwarm' : 'warm'
}

// ---- When to redraw ----------------------------------------------------------------------------------------

/** When a count of whole minutes going down (`ms` left now) next drops; 0 once it reads `under 1m`. */
function dropAt(ms: number, now: number): number {
  return ms >= MINUTE ? now + (ms % MINUTE) + 1 : 0
}

/** When a count of whole minutes going up (`ms` so far) next rises. */
function riseAt(ms: number, now: number): number {
  return now + MINUTE - (Math.max(0, ms) % MINUTE)
}

function soonest(dues: readonly number[], now: number): number {
  let best = Infinity
  for (const d of dues) if (d > now && d < best) best = d
  return best === Infinity ? 0 : best
}

/**
 * The next time the warmth's words or the feast change on their own: the
 * next level step, last orders, cold, and the next whole minute of what the
 * strip, the rail and the chalkboard's foot count (the time left or since it
 * went cold, keepwarm's time left, and its end). 0 when nothing is due.
 */
export function warmthDue(cache: Pick<KessokuCache, 'lastWarmAt' | 'keepWarmUntil'>, now: number, ttlMs: number): number {
  const dues: number[] = []
  if (cache.lastWarmAt > 0) {
    const t0 = cache.lastWarmAt
    dues.push(t0 + ttlMs * 0.16, t0 + ttlMs / 3, t0 + (ttlMs * 2) / 3, t0 + ttlMs - lastWindow(ttlMs), t0 + ttlMs)
    const left = t0 + ttlMs - now
    dues.push(left > 0 ? dropAt(left, now) : riseAt(-left, now))
  }
  if (cache.keepWarmUntil > now) dues.push(cache.keepWarmUntil, dropAt(cache.keepWarmUntil - now, now))
  return soonest(dues, now)
}

/** When keepwarm's next ping goes out: once the cache is TTL - 90 s old. */
export function nextPingAt(cache: Pick<KessokuCache, 'lastWarmAt'>, ttlMs: number): number {
  return cache.lastWarmAt > 0 ? cache.lastWarmAt + ttlMs - PING_LEAD_MS : 0
}

/**
 * The next redraw an open Hotpot needs: `warmthDue`, a moment's end, a
 * note's end, an armed press's end, keepwarm's end, a hold's end, and the
 * next whole minute of each count on the wooden board (the next ping too).
 */
export function hotpotDue(cache: Pick<KessokuCache, 'lastWarmAt' | 'keepWarmUntil' | 'heldAt'>, hotpot: Pick<KessokuHotpot, 'moment' | 'note' | 'armed'>, now: number, ttlMs: number): number {
  const dues = [warmthDue(cache, now, ttlMs)]
  if (hotpot.moment !== null) dues.push(hotpot.moment.until)
  if (hotpot.note !== null) dues.push(hotpot.note.until)
  if (hotpot.armed !== null) dues.push(hotpot.armed.at + ARM_MS)
  if (cache.heldAt > 0) dues.push(cache.heldAt + HELD_PROMPT_MS)
  if (cache.keepWarmUntil > now) {
    const ping = nextPingAt(cache, ttlMs)
    if (ping > now) dues.push(ping, dropAt(ping - now, now))
  }
  return soonest(dues, now)
}

// ---- The TTL -----------------------------------------------------------------------------------------------

/** The TTL in force: the Cache TTL option's, the engine's, the evidence's, or the hour assumed; and a pending five-minute sighting. */
export type TtlInForce = { ms: number; how: 'option' | 'engine' | 'seen' | 'assumed'; sighting: number }

/** Whether the Cache TTL option leaves the TTL to Claude Code and the evidence: 60, 0, empty, negative, not a number. */
export function isTtlDefault(minutes: number): boolean {
  return !(minutes > 0) || minutes === 60
}

export function ttlInForce(optionMinutes: number, l: Pick<KessokuLedger, 'ttl' | 'sighting'>): TtlInForce {
  if (!isTtlDefault(optionMinutes)) return { ms: optionMinutes * MINUTE, how: 'option', sighting: 0 }
  return { ms: l.ttl.ms, how: l.ttl.how, sighting: l.sighting }
}

/** The mark the wooden board carries while the TTL is unsettled: `TTL 5m?` after a first five-minute sighting of a longer one, `TTL 1h?` while assumed. */
export function ttlMark(ttl: TtlInForce): string {
  if (ttl.how === 'option' || ttl.how === 'engine') return ''
  if (ttl.sighting > 0 && ttl.ms > 5 * MINUTE) return 'TTL 5m?'
  return ttl.how === 'assumed' ? 'TTL 1h?' : ''
}

/** A cache write's price as a multiple of the input price, at a TTL: 2x for an hour, 1.25x for five minutes. */
export function writeRate(ttlMs: number): number {
  return ttlMs > 5 * MINUTE ? 2 : 1.25
}

// ---- The ledger ----------------------------------------------------------------------------------------------

const NO_SHARE: KessokuCacheShare = { read: 0, write: 0, input: 0 }

/** A fresh book (the learned TTL and its pending sighting carried over when given). */
export function newLedger(since: number, keep?: Pick<KessokuLedger, 'ttl' | 'sighting'>): KessokuLedger {
  return {
    since,
    steps: 0,
    input: 0,
    cacheRead: 0,
    cacheWrite: 0,
    output: 0,
    inputUsd: 0,
    outputUsd: 0,
    cacheReadUsd: 0,
    cacheWriteBase: 0,
    cacheReadBase: 0,
    tax: { count: 0, silent: 0, midTurn: 0, tokens: 0, base: 0, warmUsd: 0 },
    pings: { count: 0, misses: 0, usd: 0, writeBase: 0 },
    reheats: { count: 0, usd: 0, writeBase: 0 },
    summarizer: { count: 0, usd: 0, writeBase: 0 },
    members: { bocchi: NO_SHARE, nijika: NO_SHARE, ryo: NO_SHARE, kita: NO_SHARE },
    prompt: 0,
    lastOutput: 0,
    isPersonTurn: false,
    nextTurn: 'none',
    turnSteps: 0,
    engine: null,
    cacheless: 0,
    ttl: keep?.ttl ?? { ms: HOUR, how: 'assumed' },
    sighting: keep?.sighting ?? 0,
    warmModel: '',
    warmEffort: '',
    seenWarmAt: 0,
    lastModel: '',
    switched: false,
    canFork: false,
    cleared: false,
    lastStepAt: 0,
  }
}

/** The book a session starts with, standing in for one no version wrote. */
export const INITIAL_LEDGER: KessokuLedger = newLedger(0)

/** One request's tokens as the engine reports them, and the model that answered. */
export type StepUsage = { input: number; output: number; read: number; write: number; model: string }

/** How a main-loop step read the cache, against P: warm (read 0.9 P or more), cold (read under half and wrote half or more), cacheless (read and wrote nothing), partial. */
export type StepKind = 'warm' | 'cold' | 'cacheless' | 'partial'

export function judgeStep(u: Pick<StepUsage, 'input' | 'read' | 'write'>, prompt: number): StepKind {
  if (u.input > 0 && u.read === 0 && u.write === 0) return 'cacheless'
  if (prompt > 0 && u.read >= 0.9 * prompt) return 'warm'
  if (prompt > 0 && u.read < 0.5 * prompt && u.write >= 0.5 * prompt) return 'cold'
  return 'partial'
}

/** A step's tokens into the totals and one member's share, priced at its own model (the write at its base). */
function addSpend(l: KessokuLedger, member: Member, u: StepUsage): KessokuLedger {
  const p = priceInfo(u.model).price
  const share = l.members[member] ?? NO_SHARE
  return {
    ...l,
    steps: l.steps + 1,
    input: l.input + u.input,
    cacheRead: l.cacheRead + u.read,
    cacheWrite: l.cacheWrite + u.write,
    output: l.output + u.output,
    inputUsd: l.inputUsd + (u.input * p.input) / 1e6,
    outputUsd: l.outputUsd + (u.output * p.output) / 1e6,
    cacheReadUsd: l.cacheReadUsd + (u.read * p.cacheRead) / 1e6,
    cacheReadBase: l.cacheReadBase + (u.read * p.input) / 1e6,
    cacheWriteBase: l.cacheWriteBase + (u.write * p.input) / 1e6,
    members: { ...l.members, [member]: { read: share.read + u.read, write: share.write + u.write, input: share.input + u.input } },
  }
}

/** A seated act's step: booked to her member, nothing else (an act's steps never warm the pot). */
export function bookActStep(l: KessokuLedger, member: Member, u: StepUsage): KessokuLedger {
  return addSpend(l, member, u)
}

/** A main-loop step, as `turn.step` saw it: its usage (null when none came), when it began, its place in the turn, its effort, whether it ran server tools, whether its response began. */
export type MainStep = { usage: StepUsage | null; startedAt: number; index: number; effort: string; serverTools: boolean; responded: boolean; now: number }

/** What the step finds the cache as: its warmth, the TTL in force, when the module loaded, its context (P until a step, a measure or a compaction sets it). */
export type StepContext = { lastWarmAt: number; ttl: TtlInForce; loadedAt: number; context: number }

export type StepOutcome = {
  ledger: KessokuLedger
  /** The cache's warmth after the step: its start when it warmed the pot, 0 when it emptied it, null when it left it alone. */
  warmAt: number | null
  /** The step was taken as a model switch no hook reported: the new pot's first write. */
  isSwitch: boolean
  kind: StepKind | 'unjudged'
  tax: { tokens: number; usd: number; silent: boolean; midTurn: boolean } | null
  taught: 'sighting' | '5m' | '1h' | null
}

/**
 * A main-loop step booked and judged: into the totals and Bocchi's share; its
 * kind against P; the tax when it re-wrote a cold cache (a TTL or more after
 * the last warmth, five minutes while the TTL is only assumed); the TTL's
 * evidence; the warmth from its start; P and the step's model for the next.
 */
export function bookMainStep(l: KessokuLedger, s: MainStep, ctx: StepContext): StepOutcome {
  const quiet: StepOutcome = { ledger: l, warmAt: null, isSwitch: false, kind: 'unjudged', tax: null, taught: null }
  const u = s.usage
  if (u === null) {
    if (!s.responded) return quiet
    // Cut mid-answer: its request reached the cache.
    const warmAt = Math.max(ctx.lastWarmAt, s.startedAt)
    return { ...quiet, warmAt, ledger: { ...l, seenWarmAt: warmAt, cleared: false, lastStepAt: s.now } }
  }
  const p = priceInfo(u.model).price
  const P = l.prompt > 0 ? l.prompt : ctx.context
  const isSwitch = l.lastModel !== '' && u.model !== l.lastModel && !l.switched
  const judged = !s.serverTools && !isSwitch
  const kind: StepKind | 'unjudged' = judged ? judgeStep(u, P) : 'unjudged'
  const gap = s.startedAt - ctx.lastWarmAt
  let tax: StepOutcome['tax'] = null
  let next = addSpend(l, 'bocchi', u)
  if (judged && (kind === 'cold' || kind === 'partial') && ctx.lastWarmAt > 0 && gap >= (ctx.ttl.how === 'assumed' ? 5 * MINUTE : ctx.ttl.ms)) {
    const tokens = Math.max(0, Math.min(P - u.read, u.write))
    if (tokens > 0) {
      const midTurn = s.index > 0
      const silent = !midTurn && !l.isPersonTurn
      const base = (tokens * p.input) / 1e6
      tax = { tokens, usd: base * writeRate(ctx.ttl.ms), silent, midTurn }
      next = { ...next, tax: { count: next.tax.count + 1, silent: next.tax.silent + (silent ? 1 : 0), midTurn: next.tax.midTurn + (midTurn ? 1 : 0), tokens: next.tax.tokens + tokens, base: next.tax.base + base, warmUsd: next.tax.warmUsd + (tokens * p.cacheRead) / 1e6 } }
    }
  }
  // The TTL's evidence, while the engine has said nothing: a gap from a warmth the mod saw to this request's start.
  let taught: StepOutcome['taught'] = null
  const seen = ctx.lastWarmAt > 0 && ctx.lastWarmAt === l.seenWarmAt
  if (judged && P > 0 && seen && next.ttl.how !== 'engine') {
    if (gap > 5.5 * MINUTE && u.read >= 0.9 * P && u.write < 0.5 * P) {
      next = { ...next, ttl: { ms: HOUR, how: 'seen' }, sighting: 0 }
      taught = '1h'
    } else if (next.ttl.ms > 5 * MINUTE && gap >= 5.5 * MINUTE && gap <= 59 * MINUTE && ctx.lastWarmAt >= ctx.loadedAt && u.model === l.warmModel && s.effort === l.warmEffort && u.write >= 0.5 * P && u.read < 0.1 * P) {
      if (next.sighting > 0) {
        next = { ...next, ttl: { ms: 5 * MINUTE, how: 'seen' }, sighting: 0 }
        taught = '5m'
      } else {
        next = { ...next, sighting: s.startedAt }
        taught = 'sighting'
      }
    }
  }
  const touched = u.read > 0 || u.write > 0
  const cacheless = u.input > 0 && !touched
  const run = cacheless ? (isSwitch ? 1 : l.cacheless + 1) : touched || isSwitch ? 0 : l.cacheless
  let warmAt: number | null = null
  if (touched) warmAt = isSwitch ? s.startedAt : Math.max(ctx.lastWarmAt, s.startedAt)
  else if (isSwitch) warmAt = 0
  next = {
    ...next,
    cacheless: run,
    lastModel: u.model,
    switched: false,
    turnSteps: l.turnSteps + 1,
    lastStepAt: s.now,
    ...(s.serverTools ? {} : { prompt: u.input + u.read + u.write, lastOutput: u.output }),
    ...(touched ? { warmModel: u.model, warmEffort: s.effort, seenWarmAt: warmAt ?? 0, cleared: false } : {}),
    ...(isSwitch ? { engine: null, canFork: false } : {}),
  }
  return { ledger: next, warmAt, isSwitch, kind, tax, taught }
}

/** A fork the mod sent: keepwarm's ping, a top-up, a re-heat. */
export type ForkKind = 'ping' | 'topup' | 'reheat'

/** What a fork came back with: its usage (any arm's), when it was called, whether the fork gate stayed open, the cache's model. */
export type ForkFacts = { kind: ForkKind; usage: Omit<StepUsage, 'model'> | null; calledAt: number; gateOpen: boolean; model: string }

export type ForkOutcome = { ledger: KessokuLedger; warmAt: number | null; miss: boolean; usd: number; taught: StepOutcome['taught'] }

/**
 * A fork booked: a ping or top-up (a miss when it wrote 0.1 P or more) or a
 * re-heat, priced at the cache's model. It warms the pot (never back) from
 * the clock read before the call only when its read and write come to 0.9 P
 * or more and it landed with the fork gate open; and it is the TTL's
 * evidence on a fork's terms. Landing with the gate shut, it books and
 * changes nothing else.
 */
export function bookFork(l: KessokuLedger, fk: ForkFacts, ctx: { lastWarmAt: number; loadedAt: number; ttlMs: number; context: number }): ForkOutcome {
  const u = fk.usage
  if (u === null) return { ledger: l, warmAt: null, miss: false, usd: 0, taught: null }
  const p = priceInfo(fk.model || 'default').price
  const usd = (u.input * p.input + u.output * p.output + u.read * p.cacheRead) / 1e6
  const writeBase = (u.write * p.input) / 1e6
  const P = l.prompt > 0 ? l.prompt : ctx.context
  const miss = fk.kind !== 'reheat' && P > 0 && u.write >= 0.1 * P
  let next: KessokuLedger =
    fk.kind === 'reheat'
      ? { ...l, reheats: { count: l.reheats.count + 1, usd: l.reheats.usd + usd, writeBase: l.reheats.writeBase + writeBase } }
      : { ...l, pings: { count: l.pings.count + 1, misses: l.pings.misses + (miss ? 1 : 0), usd: l.pings.usd + usd, writeBase: l.pings.writeBase + writeBase } }
  const total = usd + writeBase * writeRate(ctx.ttlMs)
  if (!fk.gateOpen || P <= 0) return { ledger: next, warmAt: null, miss, usd: total, taught: null }
  let taught: StepOutcome['taught'] = null
  const gap = fk.calledAt - ctx.lastWarmAt
  if (ctx.lastWarmAt > 0 && ctx.lastWarmAt === l.seenWarmAt && next.ttl.how !== 'engine') {
    if (gap > 5.5 * MINUTE && u.read >= 0.9 * P && u.write < 0.1 * P) {
      next = { ...next, ttl: { ms: HOUR, how: 'seen' }, sighting: 0 }
      taught = '1h'
    } else if (next.ttl.ms > 5 * MINUTE && gap >= 5.5 * MINUTE && gap <= 59 * MINUTE && ctx.lastWarmAt >= ctx.loadedAt && u.write >= 0.5 * P) {
      if (next.sighting > 0) {
        next = { ...next, ttl: { ms: 5 * MINUTE, how: 'seen' }, sighting: 0 }
        taught = '5m'
      } else {
        next = { ...next, sighting: fk.calledAt }
        taught = 'sighting'
      }
    }
  }
  let warmAt: number | null = null
  if (u.read + u.write >= 0.9 * P) {
    warmAt = Math.max(ctx.lastWarmAt, fk.calledAt)
    next = { ...next, seenWarmAt: warmAt }
  }
  return { ledger: next, warmAt, miss, usd: total, taught }
}

/** A compaction's summarizing request, priced at the cache's model. */
export function bookSummary(l: KessokuLedger, u: Omit<StepUsage, 'model'>, model: string): KessokuLedger {
  const p = priceInfo(model || 'default').price
  return { ...l, summarizer: { count: l.summarizer.count + 1, usd: l.summarizer.usd + (u.input * p.input + u.output * p.output + u.read * p.cacheRead) / 1e6, writeBase: l.summarizer.writeBase + (u.write * p.input) / 1e6 } }
}

/**
 * The engine's price of a cache write per token from a model switch: its
 * estimate over its context, taken only with tokens to price and a list price
 * on a known model (`catalog`), never a resume's.
 */
export function enginePriceOf(e: { source: string; context_tokens: number; estimated_cache_write_usd: number; pricing: string; to_model: string }): KessokuLedger['engine'] {
  if (e.source === 'resume' || !(e.context_tokens > 0) || e.pricing !== 'catalog' || !(e.estimated_cache_write_usd >= 0)) return null
  return { perToken: e.estimated_cache_write_usd / e.context_tokens, model: e.to_model }
}

// ---- The figures -------------------------------------------------------------------------------------------

/** Everything the steps sent: input, cache write and cache read, over the main loop's and the acts' steps. */
export function promptTokens(l: Pick<KessokuLedger, 'input' | 'cacheRead' | 'cacheWrite'>): number {
  return l.input + l.cacheRead + l.cacheWrite
}

/** Cache read over everything the steps sent; null before any. */
export function hitRate(l: Pick<KessokuLedger, 'input' | 'cacheRead' | 'cacheWrite'>): number | null {
  const all = promptTokens(l)
  return all > 0 ? l.cacheRead / all : null
}

export function writesUsd(l: KessokuLedger, ttlMs: number): number {
  return l.cacheWriteBase * writeRate(ttlMs)
}

export function taxPaidUsd(l: KessokuLedger, ttlMs: number): number {
  return l.tax.base * writeRate(ttlMs)
}

export function pingsUsd(l: KessokuLedger, ttlMs: number): number {
  return l.pings.usd + l.pings.writeBase * writeRate(ttlMs)
}

export function reheatsUsd(l: KessokuLedger, ttlMs: number): number {
  return l.reheats.usd + l.reheats.writeBase * writeRate(ttlMs)
}

export function summaryUsd(l: KessokuLedger, ttlMs: number): number {
  return l.summarizer.usd + l.summarizer.writeBase * writeRate(ttlMs)
}

/**
 * What the cache saved against sending it all uncached: the reads at the
 * input price less the read price, less the writes' premium over the input
 * price, less what the pings and the re-heats cost. Negative early on.
 */
export function savedUsd(l: KessokuLedger, ttlMs: number): number {
  return l.cacheReadBase - l.cacheReadUsd - l.cacheWriteBase * (writeRate(ttlMs) - 1) - pingsUsd(l, ttlMs) - reheatsUsd(l, ttlMs)
}

/** A cache write's price per token: the engine's while the cache's model is the one it priced, else the TTL's list write rate. */
export function writePerToken(model: string, engine: KessokuLedger['engine'], ttlMs: number): number {
  if (engine !== null && engine.model !== '' && engine.model === model) return engine.perToken
  return (priceInfo(model || 'default').price.input * writeRate(ttlMs)) / 1e6
}

/** A re-order: the context written to the cache afresh. */
export function reorderUsd(tokens: number, model: string, engine: KessokuLedger['engine'], ttlMs: number): number {
  return tokens * writePerToken(model, engine, ttlMs)
}

/** A ping's own few tokens, in and out. */
function pingOwnUsd(model: string): number {
  const p = priceInfo(model || 'default').price
  return (PING_INPUT * p.input + PING_OUTPUT * p.output) / 1e6
}

/** A top-up: P read from the cache, and the ping's own few tokens (a fork re-sends the main thread's last request, not its answer). */
export function topUpUsd(prompt: number, model: string): number {
  return (prompt * priceInfo(model || 'default').price.cacheRead) / 1e6 + pingOwnUsd(model)
}

/** A re-heat: P re-written at a re-order's price per token, and the ping's own few tokens. */
export function reheatUsd(prompt: number, model: string, engine: KessokuLedger['engine'], ttlMs: number): number {
  return prompt * writePerToken(model, engine, ttlMs) + pingOwnUsd(model)
}

/** Minutes between keepwarm's pings: its minute tick pings once the cache is TTL - 90 s old. */
export function pingEvery(ttlMs: number): number {
  return Math.max(1, Math.ceil((ttlMs - PING_LEAD_MS) / MINUTE))
}

/** Keepwarm's pings in a day: about 24 at an hour's TTL (59 minutes apart), 360 at five minutes (4 apart). */
export function pingsADay(ttlMs: number): number {
  return (24 * 60) / pingEvery(ttlMs)
}

/** Keepwarm over a stretch: its pings in it, each a top-up. */
export function keepwarmUsd(ms: number, ttlMs: number, topUp: number): number {
  return (ms / MINUTE / pingEvery(ttlMs)) * topUp
}

// ---- What the pane shows ---------------------------------------------------------------------------------------

/** What dims a button: the host, caching, the session's state, a fork in flight, the engine's calls. */
export type HotpotFlags = {
  /** The host keeps no snapshot a fork may share (a fork answered `nothing-to-fork` with the gate open). */
  noSnapshot: boolean
  compacting: boolean
  working: boolean
  /** A top-up, a re-heat or a ping is on its way. */
  forkOut: boolean
  /** `$.session.compact` is missing on this engine. */
  compactOff: boolean
  /** `$.prompt.read` is missing on this engine. */
  draftOff: boolean
}

/** Everything the pane's drawings read, built where the state is read. */
export type HotpotView = {
  now: number
  feast: Feast
  cache: Pick<KessokuCache, 'lastWarmAt' | 'keepWarmUntil' | 'contextTokens' | 'model' | 'heldAt'>
  ledger: KessokuLedger
  hotpot: KessokuHotpot
  ttl: TtlInForce
  /** Keepwarm's length for Keep the fire on (the pick, or the option's). */
  pick: number
  /** The hold's figures while a send is held: the re-write's price, a warm turn's, the tokens (the /bocchi tax sample's while it stands). */
  slip: { writeUsd: number; warmUsd: number; tokens: number; ageMs: number } | null
  flags: HotpotFlags
  isTerminal: boolean
  isFocused: boolean
}

export function cachingOff(l: Pick<KessokuLedger, 'cacheless'>): boolean {
  return l.cacheless >= CACHELESS_RUN
}

/** P for a price: the main loop's last prompt, else the context the cache knows (a resumed session before its first step). */
function promptOf(v: HotpotView): number {
  return v.ledger.prompt > 0 ? v.ledger.prompt : v.cache.contextTokens
}

/** The prices the pane names, at the cache's model and the TTL in force. */
export function pricesOf(v: HotpotView): { reorder: number; topUp: number; reheat: number; day: number; keep: number; topUp5m: number } {
  const model = v.cache.model
  const P = promptOf(v)
  const topUp = topUpUsd(P, model)
  return {
    reorder: reorderUsd(v.cache.contextTokens, model, v.ledger.engine, v.ttl.ms),
    topUp,
    reheat: reheatUsd(P, model, v.ledger.engine, v.ttl.ms),
    day: pingsADay(v.ttl.ms) * topUp,
    keep: keepwarmUsd(v.pick, v.ttl.ms, topUp),
    topUp5m: reheatUsd(P, model, null, 5 * MINUTE),
  }
}

/** One of the pane's buttons: its key, label and hotkey, and why it is dim (empty when it can act). */
export type HotpotButton = { key: string; label: string; hotkey?: string; reason: string; pick?: number; isOn?: boolean }

const ARMED = (v: HotpotView, action: 'reheat' | 'zosui' | 'clear') => v.hotpot.armed !== null && v.hotpot.armed.action === action && v.now - v.hotpot.armed.at < ARM_MS

/** The fork gate's words while it is shut. */
function gateReason(l: KessokuLedger): string {
  if (l.cleared) return 'the table was cleared'
  return l.steps > 0 ? 'nothing to top up until the next turn ends' : 'nothing to top up yet: the first turn has not ended'
}

/**
 * The pane's buttons in their row, each under a fixed key: keepwarm (and its
 * lengths while it is off), top up or re-heat, zosui, clear the table, the
 * bill, close; during a hold, the Cache Tax card's three and then the bill
 * and close. A dim one names why, in its order of reasons.
 */
export function hotpotButtons(v: HotpotView): HotpotButton[] {
  const { flags: fl, ledger: l } = v
  const off = cachingOff(l)
  const pr = pricesOf(v)
  const kept = v.cache.keepWarmUntil > v.now
  const bill: HotpotButton = { key: 'hotpot-bill', label: v.hotpot.isBillOpen ? 'Close the bill' : 'The bill', hotkey: 'b', reason: '' }
  const close: HotpotButton = { key: 'hotpot-close', label: 'Close', hotkey: 'c', reason: '' }
  if (v.feast.phase === 'held') {
    return [
      { key: 'hotpot-tax-keep', label: kept ? 'Keep warm: on' : `Keep it warm after (${lengthText(v.pick)}) ≈${fmtUsd(pr.keep)}`, hotkey: 'w', reason: '' },
      { key: 'hotpot-tax-clear', label: 'Start fresh (/clear)', hotkey: 'f', reason: '' },
      { key: 'hotpot-tax-dismiss', label: 'Dismiss', hotkey: 'd', reason: '' },
      bill,
      close,
    ]
  }
  const keepReason = fl.noSnapshot ? 'this host keeps no snapshot to fork' : off ? 'prompt caching is off' : ''
  const keep: HotpotButton[] = kept
    ? [{ key: 'hotpot-keep', label: 'Let it cool (keepwarm off)', hotkey: 'w', reason: '' }]
    : [
        { key: 'hotpot-keep', label: `Keep the fire on · ${lengthText(v.pick)} ≈${fmtUsd(pr.keep)}`, hotkey: 'w', reason: keepReason },
        ...[30, 60, 120, 360].map(min => ({ key: `hotpot-pick-${lengthText(min * MINUTE)}`, label: lengthText(min * MINUTE), reason: '', pick: min * MINUTE, isOn: v.pick === min * MINUTE })),
      ]
  const cold = v.feast.phase === 'cold'
  const forkReason = fl.noSnapshot
    ? 'this host keeps no snapshot to fork'
    : off
      ? 'prompt caching is off'
      : fl.compacting
        ? 'compacting'
        : fl.working
          ? 'a turn is running'
          : fl.forkOut
            ? 'a top-up is on its way'
            : !l.canFork
              ? gateReason(l)
              : v.cache.lastWarmAt <= 0
                ? 'nothing cached yet'
                : v.cache.contextTokens < TOP_UP_MIN_TOKENS
                  ? 'under 1k tokens'
                  : ''
  const fiveMinNote = v.ttl.how === 'assumed' && v.cache.lastWarmAt > 0 && v.now - v.cache.lastWarmAt > 5 * MINUTE ? ` (≈${fmtUsd(pr.topUp5m)} if the cache lives 5m)` : ''
  const topup: HotpotButton = cold
    ? { key: 'hotpot-topup', label: ARMED(v, 'reheat') && forkReason === '' ? `Press again: re-write ≈${fmtUsd(pr.reheat)}` : `Re-heat now ≈${fmtUsd(pr.reheat)}`, hotkey: 't', reason: forkReason }
    : { key: 'hotpot-topup', label: `Top up now ≈${fmtUsd(pr.topUp)}${fiveMinNote}`, hotkey: 't', reason: forkReason }
  const zosuiReason = fl.compactOff ? 'needs a newer Claude Code' : fl.compacting ? 'compacting' : fl.working ? 'a turn is running' : ''
  const zosui: HotpotButton = {
    key: 'hotpot-zosui',
    label: ARMED(v, 'zosui') && zosuiReason === '' ? `Press again: compact ${fmtTokens(v.cache.contextTokens)} tokens · one summarizing request` : 'Zosui (compact) · the next send writes the smaller pot',
    hotkey: 'z',
    reason: zosuiReason,
  }
  const clear: HotpotButton = {
    key: 'hotpot-clear',
    label: ARMED(v, 'clear') ? 'Press again: your draft gives way to /clear' : `Clear the table (/clear) · the next send writes a fresh pot${kept ? ' · keepwarm stays on' : ''}`,
    hotkey: 'f',
    reason: '',
  }
  return [...keep, topup, zosui, clear, bill, close]
}

/** The reason the wooden board names: the first dim button's first. */
export function dimReason(buttons: readonly HotpotButton[]): string {
  return buttons.find(b => b.reason !== '')?.reason ?? ''
}

/** The state in a word, a short word for a line, and the tail, per phase. */
function stateWords(v: HotpotView): { word: string; short: string; tail: string; alt: string } {
  const fe = v.feast
  const left = minutesText(fe.leftMs)
  switch (fe.phase) {
    case 'feast':
      return { word: '♨ Bubbling', short: 'bubbling', tail: `${left} of feast left`, alt: `bubbling, ${left} left` }
    case 'simmer':
      return { word: 'Simmering', short: 'simmering', tail: `${left} of feast left`, alt: `simmering, ${left} left` }
    case 'low':
      return { word: 'Running low', short: 'running low', tail: `${left} of feast left`, alt: `running low, ${left} left` }
    case 'last':
      return { word: 'Last orders!', short: 'last orders', tail: `cold in ${left}`, alt: `last orders, cold in ${left}` }
    case 'tend': {
      const ping = nextPingAt(v.cache, v.ttl.ms) - v.now
      const when = ping > 0 ? `in ${minutesText(ping)}` : 'any moment'
      return { word: 'Nijika has the pot', short: 'Nijika has the pot', tail: `she tops it up ${when}`, alt: `Nijika has the pot, cold in ${left}` }
    }
    case 'cold': {
      const ago = minutesText(-fe.leftMs)
      return { word: '❄ Gone cold', short: 'gone cold', tail: `${ago} ago: the next send re-orders everything`, alt: `cold for ${ago}` }
    }
    case 'held': {
      const usd = fmtUsd(v.slip?.writeUsd ?? 0)
      return { word: 'The bill came', short: 'the bill came', tail: `your prompt waits: re-ordering costs ≈${usd}`, alt: `the bill: re-order ≈${usd}` }
    }
    case 'zosui':
      return { word: '〆 Zosui', short: 'zosui', tail: `compacting ${fmtTokens(v.cache.contextTokens)} tokens`, alt: 'zosui' }
    case 'cleared':
      return { word: 'A fresh table', short: 'a fresh table', tail: 'nothing cached yet: the next prompt is the first order', alt: 'a fresh table' }
    case 'off':
      return { word: 'No cache here', short: 'no cache here', tail: 'prompt caching is off', alt: 'no cache here' }
    default:
      return { word: 'The table is set', short: 'the table is set', tail: 'the first order warms the pot', alt: 'the table is set' }
  }
}

/** The second line's figures: the context and its prices, keepwarm, the TTL while unsettled. */
function figuresLine(v: HotpotView): string[] {
  const pr = pricesOf(v)
  const kept = v.cache.keepWarmUntil > v.now
  const pings = v.ledger.pings.count
  const keep = kept ? `keepwarm ${minutesText(v.cache.keepWarmUntil - v.now, true)} · ${pings === 0 ? 'no pings yet' : `${pings} ${pings === 1 ? 'ping' : 'pings'} ≈${fmtUsd(pingsUsd(v.ledger, v.ttl.ms))}`}` : 'keepwarm off'
  const mark = ttlMark(v.ttl)
  return [`${fmtTokens(v.cache.contextTokens)} on the table`, `a re-order ≈${fmtUsd(pr.reorder)}`, `a top-up ≈${fmtUsd(pr.topUp)}`, `a day of keepwarm ≈${fmtUsd(pr.day)}`, keep, ...(mark === '' ? [] : [mark])]
}

/**
 * The wooden board: the state in a word and its tail (a press's note in the
 * tail's place for its 6 s), then the context and its prices, the TTL's mark
 * while unsettled, a dim button's reason, and on a terminal whose pane does
 * not hold the keys how to give them; during a hold, how to pay or start fresh.
 */
export function boardOf(v: HotpotView): { word: string; tail: string; line: string } {
  const s = stateWords(v)
  const note = v.hotpot.note !== null && v.now < v.hotpot.note.until ? v.hotpot.note.text : ''
  if (v.feast.phase === 'held') return { word: s.word, tail: note || s.tail, line: 'your prompt is back in the box: Enter pays and sends it, Start fresh puts /clear in its place' }
  const reason = dimReason(hotpotButtons(v))
  const parts = [...figuresLine(v), ...(reason === '' ? [] : [reason]), ...(v.isTerminal && !v.isFocused ? ['ctrl+x tab for its keys'] : [])]
  return { word: s.word, tail: note || s.tail, line: parts.join(' · ') }
}

/** `/hotpot` where nothing can draw: the wooden board as one line. */
export function hotpotLine(v: HotpotView): string {
  const s = stateWords(v)
  return ['♨ Hotpot', `${s.short}, ${s.tail}`, ...figuresLine(v)].join(' · ')
}

/** The scene's alt: a noun phrase and the state's words. */
export function hotpotAlt(v: HotpotView): string {
  return `the band's hotpot · ${stateWords(v).alt}`
}

export type BillRow = { label: string; detail: string; figure: string; tone?: 'good' | 'bad' }

const perM = (usd: number, tokens: number) => `$${((usd / Math.max(1, tokens)) * 1e6).toFixed(2)}/M`
const pct = (r: number) => `${Math.round(r * 100)}%`

/**
 * The bill: this conversation's cache, row by row (reads, writes and the tax
 * among them, the pings, the re-heats, the compactions' summaries, the
 * saving, the hit rate overall and by member, a re-order, a day of keepwarm),
 * a row with nothing to say left out, and the list-price caveat under it.
 */
export function billRows(v: HotpotView): { title: string; rows: BillRow[]; foot: string } {
  const l = v.ledger
  const ttl = v.ttl.ms
  const p = priceInfo(v.cache.model || 'default').price
  const pr = pricesOf(v)
  const rows: BillRow[] = []
  rows.push({ label: 'Read from cache', detail: `${fmtTokens(l.cacheRead)} × ${l.cacheRead > 0 ? perM(l.cacheReadUsd, l.cacheRead) : `$${p.cacheRead.toFixed(2)}/M`}`, figure: fmtUsd(l.cacheReadUsd) })
  rows.push({ label: 'Written to cache', detail: `${fmtTokens(l.cacheWrite)} × ${l.cacheWrite > 0 ? perM(writesUsd(l, ttl), l.cacheWrite) : `$${(p.input * writeRate(ttl)).toFixed(2)}/M`}`, figure: fmtUsd(writesUsd(l, ttl)) })
  const t = l.tax
  const taxBits = t.count === 0 ? ['no cold re-writes'] : [`${t.count} cold re-write${t.count === 1 ? '' : 's'}`, ...(t.silent > 0 ? [`${t.silent} silent (a background report)`] : []), ...(t.midTurn > 0 ? [`${t.midTurn} mid-turn`] : [])]
  rows.push({ label: 'of which Cache Tax', detail: taxBits.join(' · '), figure: fmtUsd(taxPaidUsd(l, ttl)) })
  if (l.pings.count > 0) rows.push({ label: 'Keepwarm', detail: `${l.pings.count} ${l.pings.count === 1 ? 'ping' : 'pings'}${l.pings.misses > 0 ? ` · ${l.pings.misses} found it cold` : ''}`, figure: fmtUsd(pingsUsd(l, ttl)) })
  if (l.reheats.count > 0) rows.push({ label: 'Re-heats', detail: String(l.reheats.count), figure: fmtUsd(reheatsUsd(l, ttl)) })
  if (l.summarizer.count > 0) rows.push({ label: 'Compaction', detail: `${l.summarizer.count} zosui`, figure: fmtUsd(summaryUsd(l, ttl)) })
  const saved = savedUsd(l, ttl)
  rows.push(saved >= 0 ? { label: 'Saved by the cache', detail: 'vs. sending it all uncached', figure: fmtUsd(saved), tone: 'good' } : { label: 'Saved by the cache', detail: 'vs. sending it all uncached', figure: `cost ${fmtUsd(-saved)} more`, tone: 'bad' })
  const rate = hitRate(l)
  rows.push({ label: 'Hit rate', detail: 'read ÷ everything the steps sent', figure: rate === null ? '—' : pct(rate) })
  const members = (['bocchi', 'nijika', 'ryo', 'kita'] as const).flatMap(m => {
    const s = l.members[m] ?? NO_SHARE
    const all = s.read + s.write + s.input
    return all > 0 ? [`${MEMBERS[m].name} ${pct(s.read / all)}`] : []
  })
  if (members.length > 0) rows.push({ label: 'By member', detail: members.join(' · '), figure: '' })
  rows.push({ label: 'If it goes cold', detail: `re-order ${fmtTokens(v.cache.contextTokens)}`, figure: fmtUsd(pr.reorder), tone: 'bad' })
  const n = Math.round(pingsADay(ttl))
  const assumed = v.ttl.how === 'assumed'
  rows.push({ label: 'A day of keepwarm', detail: `≈${n} pings at a ${lengthText(ttl)} TTL${assumed ? `, assumed · ≈${fmtUsd(pingsADay(5 * MINUTE) * pr.topUp)} if it lives 5m` : ''}`, figure: fmtUsd(pr.day) })
  return { title: "お会計 · this conversation's cache", rows, foot: 'cost ≈ list prices × tokens, not your bill' }
}

// ---- Who plays what ----------------------------------------------------------------------------------------

/** A seated member's loop: the feast family's states (`serve` is Nijika's); Bocchi plays her box (`box`) while cold. */
export type FeastState = KessokuFeastState

/** The phase the drawing shows: a paid re-order draws the feast back before its first step lands. */
export function drawnPhase(v: Pick<HotpotView, 'feast' | 'hotpot' | 'now'>): { phase: FeastPhase; level: FeastLevel } {
  const m = v.hotpot.moment
  if (m !== null && v.now < m.until && (m.kind === 'paid' || m.kind === 'reheat' || m.kind === 'ping')) return { phase: 'feast', level: 5 }
  return { phase: v.feast.phase, level: v.feast.level }
}

/** The one-shot moment playing now, if any. */
export function momentOf(v: Pick<HotpotView, 'hotpot' | 'now'>): KessokuHotpot['moment'] {
  const m = v.hotpot.moment
  return m !== null && v.now < m.until ? m : null
}

/** Each member's state at the table for a phase (Nijika serves for a ping). */
export function seatStates(phase: FeastPhase, moment: KessokuHotpot['moment']): Record<Member, FeastState | 'box'> {
  const all = (s: FeastState): Record<Member, FeastState | 'box'> => ({ bocchi: s, nijika: s, ryo: s, kita: s })
  let out: Record<Member, FeastState | 'box'>
  switch (phase) {
    case 'feast':
    case 'zosui':
      out = all('eat')
      break
    case 'simmer':
    case 'low':
    case 'tend':
      out = all('calm')
      break
    case 'last':
      out = all('worry')
      break
    case 'cold':
      out = { ...all('cold'), bocchi: 'box' }
      break
    case 'held':
      out = all('shock')
      break
    default:
      out = all('wait')
  }
  if (moment?.kind === 'ping') out.nijika = 'serve'
  return out
}

/** The sprite a member plays at the table: `<member>-feast-<state>`, Bocchi's box `bocchi-hiding`. */
export function seatSpriteId(member: Member, state: FeastState | 'box'): string {
  return state === 'box' ? spriteId('bocchi', 'hiding') : spriteId(member, state, 'feast')
}

/** The terminal's heads by phase: happy feasting, focused waiting or simmering, anxious at last orders, panic at the bill; cold, Bocchi hides, Nijika and Kita melt, Ryo is anxious. */
export function miniMoods(phase: FeastPhase): Record<Member, KessokuMood> {
  const all = (m: KessokuMood): Record<Member, KessokuMood> => ({ bocchi: m, nijika: m, ryo: m, kita: m })
  switch (phase) {
    case 'feast':
    case 'zosui':
      return all('happy')
    case 'tend':
      return { ...all('focused'), nijika: 'happy' }
    case 'last':
      return all('anxious')
    case 'held':
      return all('panic')
    case 'cold':
      return { bocchi: 'hiding', nijika: 'melting', ryo: 'anxious', kita: 'melting' }
    default:
      return all('focused')
  }
}

/** The pot as a text gauge, for kaomoji: its level in five bars, a snowflake once cold. */
export function potGauge(phase: FeastPhase, level: FeastLevel): string {
  const lit = phase === 'zosui' ? 5 : level
  return `${phase === 'cold' || phase === 'held' ? '❄' : '♨'} ${'▰'.repeat(lit)}${'▱'.repeat(5 - lit)}`
}

/** The speech the feast shows: one line, or two alternating; a moment's line wins. */
export function speechOf(phase: FeastPhase, keepwarm: boolean, moment: KessokuHotpot['moment']): [Member, string][] {
  if (moment?.kind === 'ping') return [['nijika', 'Topping it up~']]
  if (moment?.kind === 'reheat') return [['bocchi', 'I-it’s warm again…']]
  if (moment?.kind === 'keepon') return [['nijika', 'Nabe-bugyō, reporting!']]
  if (moment?.kind === 'paid') return [['bocchi', '…paid.']]
  switch (phase) {
    case 'none':
      return [['nijika', 'What shall we order?']]
    case 'cleared':
      return [['kita', 'Fresh table!']]
    case 'feast':
      return [
        ['kita', 'So photogenic!'],
        ['ryo', 'Seconds.'],
      ]
    case 'simmer':
      return [['nijika', 'Plenty left!']]
    case 'low':
      return [['bocchi', 'It’s going…']]
    case 'last':
      return [['ryo', 'That one’s mine.']]
    case 'tend':
      return [['nijika', 'Leave the pot to me!']]
    case 'cold':
      return keepwarm
        ? [['nijika', 'The next order warms it.']]
        : [
            ['nijika', 'It went cold…'],
            ['ryo', '…grass.'],
          ]
    case 'held':
      return [['kita', 'The BILL?!']]
    case 'zosui':
      return [['nijika', 'Zosui time!']]
    default:
      return []
  }
}

// ---- The drawing: where things are ---------------------------------------------------------------------------

/** The scene's viewBox: a sidebar's width of izakaya, declared at four times its size like every picture. */
export const SCENE_W = 288
export const SCENE_H = 184

/** The square low table seen from its empty side: its far edge, its ends, how its side edges spread toward us, its near edge. */
export const TABLE = { farY: 96, farL: 84, farR: 204, slope: 0.36, nearY: 176 } as const
export const edgeL = (y: number): number => TABLE.farL - TABLE.slope * (y - TABLE.farY)
export const edgeR = (y: number): number => TABLE.farR + TABLE.slope * (y - TABLE.farY)

/** Her edge of the table: Bocchi and Nijika at its left, turned to our right; Ryo and Kita at its right. */
export const SEAT_SIDE: Readonly<Record<Member, 'left' | 'right'>> = { bocchi: 'left', nijika: 'left', ryo: 'right', kita: 'right' }
/** Her waist's row in the scene: the far two higher up the table, the near two lower. */
export const SEAT_ROW: Readonly<Record<Member, number>> = { bocchi: 112, ryo: 112, nijika: 150, kita: 150 }
/**
 * The outer end of her waist on her 96x96 canvas, the same in every seat
 * pose: the studio's `feast.waist`, kept here as scene.ts keeps KIT_SEAT and
 * held by a test to the sprites' own pixels.
 */
export const FEAST_WAIST: Readonly<Record<Member, { x: number; y: number }>> = {
  bocchi: { x: 37, y: 56 },
  nijika: { x: 38, y: 57 },
  ryo: { x: 60, y: 56 },
  kita: { x: 60, y: 56 },
}
/** Kita's phone's lens on her canvas while she holds it out (the studio's `tips.seatPhone`), where her sprite's flash bursts. */
export const KITA_LENS = { x: 23, y: 31 } as const
/** The feast view: rows 6 to 69 of her canvas, its full width. */
export const FEAST_TOP = 6
export const FEAST_H = 64
/** Bocchi's box (her 96x96 `hiding`) sits this much higher than her seat's canvas, its rim at her chest. */
export const BOX_RAISE = 10
/** The paint order of the band, over the stove and the pot: the far two (reaching over its back rim), then the near two. */
export const SEAT_ORDER: readonly Member[] = ['bocchi', 'ryo', 'nijika', 'kita']

/**
 * Her canvas's top left in the scene: the outer end of her waist on her edge
 * of the table at her row, the outer side of that pixel on the edge's line
 * (its left side at the left edge, its right side at the right).
 */
export function seatAt(m: Member): { x: number; y: number } {
  const row = SEAT_ROW[m]
  const end = SEAT_SIDE[m] === 'left' ? Math.round(edgeL(row)) : Math.round(edgeR(row)) - 1
  return { x: end - FEAST_WAIST[m].x, y: row - FEAST_WAIST[m].y }
}

/** The middle of her face in the scene (the face box, 16x10 at 42,30 on her canvas). */
export function headAt(m: Member): { x: number; y: number } {
  const s = seatAt(m)
  return { x: s.x + 50, y: s.y + 35 }
}

/** The donabe's top left (80 x 33), on the stove in the table's middle; the platter's, in front of it. */
const POT = { x: 104, y: 114 }
const PLATTER = { x: 110, y: 154 }

/** The platter's step by the context: under 40k, to 120k, to 250k, from 250k. */
export function platterTier(tokens: number): 0 | 1 | 2 | 3 {
  return tokens < 40_000 ? 0 : tokens < 120_000 ? 1 : tokens < 250_000 ? 2 : 3
}

// ---- The props, pixel by pixel -------------------------------------------------------------------------------

const CREAM = ['#fbf4e4', '#ecdfc4', '#d6c6a4', '#b3a282', '#8f7f62'] as const
const GLAZE = ['#8a5e4a', '#6a4535', '#4e3227', '#38231c', '#26170f'] as const
const POT_LINE = '#1d120e'

/** A cheap hash of a pixel, for speckle that is the same every build. */
function speck(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** A hand-drawn grid: each character its colour, `.` empty. */
function grid(rows: readonly string[], pal: Readonly<Record<string, string>>): Pix {
  const p = pix(Math.max(...rows.map(r => r.length)), rows.length)
  rows.forEach((row, y) => [...row].forEach((ch, x) => put(p, x, y, pal[ch] ?? null)))
  return p
}

/**
 * The donabe from above and a little in front: a cream glaze run over a dark body, its two ears, the wide opening
 * the broth fills. Drawn a row above POT (its rim's dark top line, where the far two's chopsticks cross it).
 */
function potPix(): Pix {
  const p = pix(80, 34)
  const cx = 40
  for (let j = 0; j <= 20; j += 1) {
    const y = 11 + j
    const hw = Math.round(32 - 12 * Math.pow(j / 20, 1.7))
    for (let x = cx - hw; x < cx + hw; x += 1) {
      const u = (x + 0.5 - cx) / hw
      const tone = u < -0.84 ? 1 : u < -0.3 ? 0 : u < 0.32 ? 1 : u < 0.74 ? 2 : 3
      const drip = 19 + Math.round(1.3 * Math.sin(x * 0.61) + Math.sin(x * 1.31 + 1.7) + (speck(x, 0, 7) > 0.78 ? 2 + speck(x, 1, 3) * 2 : 0))
      const isCream = y < drip
      let c: string = (isCream ? CREAM : GLAZE)[tone] as string
      if (isCream && u > -0.62 && u < -0.48 && y > 12 && y < 17) c = '#fffdf6'
      if (!isCream && u > -0.64 && u < -0.52 && y > drip + 1 && y < drip + 6) c = '#a7765f'
      if (isCream && speck(x, y - 1, 2) < 0.04) c = CREAM[3]
      if (!isCream && speck(x, y - 1, 5) < 0.035) c = GLAZE[0]
      if (j >= 19) c = j === 20 ? '#4a2c1e' : '#6d4430'
      put(p, x, y, c)
    }
  }
  // the ears, a lug each side at the rim
  block(p, 3, 12, 6, 15, (x, y) => (y === 12 ? CREAM[0] : x === 3 ? CREAM[1] : CREAM[2]))
  block(p, 73, 12, 76, 15, (x, y) => (y === 12 ? CREAM[1] : x === 76 ? CREAM[3] : CREAM[2]))
  rim(p, POT_LINE)
  oval(p, cx, 11, 31.6, 11.4, () => POT_LINE)
  oval(p, cx, 11, 30.6, 10.4, (u, v) => (v < 0 ? (Math.hypot(u, v) > 0.74 ? CREAM[2] : CREAM[1]) : Math.hypot(u, v) > 0.8 ? CREAM[1] : CREAM[0]))
  oval(p, cx, 11, 26.2, 8.2, (_u, v) => (v < -0.2 ? '#3e2a21' : '#2a1b15'))
  return p
}

/** The broth seen from above, lower in the pot as the level drops: golden while warm, a cold scum with frost, zosui's rice and egg. */
function brothPix(kind: 'warm' | 'cold' | 'zosui', level: number): Pix {
  const p = pix(56, 20)
  const drop = kind === 'warm' ? (5 - level) * 0.9 : 0.5
  const rx = 25 - drop * 0.8
  const ry = 7.6 - drop * 0.4
  oval(p, 28, 9 + drop, rx, ry, (u, v) => {
    const x = Math.round(28 + u * rx)
    const y = Math.round(9 + v * ry)
    const n = speck(x, y, kind === 'cold' ? 31 : kind === 'zosui' ? 37 : 41)
    const d = Math.hypot(u, v)
    if (kind === 'cold') return n < 0.06 ? '#e6eef5' : d > 0.8 ? '#5f5040' : v < -0.3 ? '#8c7c66' : '#7a6a54'
    if (kind === 'zosui') return n < 0.035 ? '#7fb84a' : n < 0.1 ? '#fff4c8' : n < 0.17 ? '#f6dc78' : d > 0.82 ? '#c9a95e' : '#ead292'
    if (d > 0.86) return '#8f5a1c'
    if (n < 0.03) return '#f7d27a'
    if (v < -0.3 && u > -0.6 && u < 0.2) return '#e8ad4c'
    return d > 0.55 ? '#b97a2a' : '#cf8f34'
  })
  return p
}

/** The lid, domed, its knob on top: the pot covered while nothing is cached. */
function lidPix(): Pix {
  const p = pix(66, 26)
  const cx = 33
  for (let y = 2; y <= 19; y += 1) {
    const t = (19 - y) / 17
    const hw = Math.round(30 * Math.sqrt(Math.max(0, 1 - t * t)))
    for (let x = cx - hw; x < cx + hw; x += 1) {
      const u = (x + 0.5 - cx) / Math.max(1, hw)
      put(p, x, y, u < -0.52 ? CREAM[0] : u < 0.22 ? CREAM[1] : u < 0.68 ? CREAM[2] : CREAM[3])
    }
  }
  oval(p, cx, 19, 30.5, 6, (_u, v) => (v > 0.2 ? CREAM[2] : CREAM[1]))
  oval(p, cx, 7, 5, 2.2, (u, v) => (u + v < -0.4 ? GLAZE[0] : GLAZE[2]))
  block(p, cx - 2, 1, cx + 1, 5, x => (x < cx ? GLAZE[0] : GLAZE[1]))
  rim(p, POT_LINE)
  return p
}

/** The gas stove under the pot: its dark grate, a brushed body with the band's sticker, the knob. */
function stovePix(): Pix {
  const p = pix(86, 14)
  block(p, 2, 1, 83, 3, (_x, y) => (y === 1 ? '#3b3e45' : '#2a2c31'))
  block(p, 2, 4, 83, 12, (_x, y) => (y < 6 ? '#e6e9ec' : y < 8 ? '#c8cdd2' : y < 11 ? '#a2a9b1' : '#7a828b'))
  block(p, 7, 6, 18, 10, (_x, y) => (y === 6 ? '#7c848d' : '#5d646c'))
  block(p, 27, 7, 52, 8, () => '#f7a8c9')
  ;['#ffd166', '#8fb8ff', '#ff8a65'].forEach((c, i) => block(p, 28 + i * 3, 7, 29 + i * 3, 8, () => c))
  oval(p, 73, 8, 3.2, 3.2, (u, v) => (v < -0.3 && u < 0.2 ? '#4a4a52' : '#1d1d22'))
  pline(p, 73, 5, 73, 8, '#e8484f')
  rim(p, '#33373d')
  return p
}

/** The ten ingredients, as small grids. */
const FOOD: Readonly<Record<string, Pix>> = {
  shiitake: grid(['.ommmo.', 'omMwMmo', 'owwMwwo', 'omMwMmo', '.ommmo.'], { o: '#3a2216', m: '#7a4b2e', M: '#a06a42', w: '#e0c49a' }),
  tofu: grid(['kkkkkk', 'kwwwwk', 'kwwwwk', 'kWWWWk', 'kkkkkk'], { k: '#cdbfa2', w: '#fffdf6', W: '#ece3cf' }),
  napa: grid(['..gGgG...', '.gGGGGg..', 'kwwwwwwgk', 'kwwwwwwwk', '.kkkkkkk.'], { g: '#c4e48f', G: '#93c25e', w: '#f7f9ea', k: '#b9c49a' }),
  naruto: grid(['.kkkkk.', 'kwwpwwk', 'kwpwpwk', 'kwwpwwk', '.kkkkk.'], { k: '#d6cab8', w: '#fffaf4', p: '#f07b9a' }),
  meat: grid(['.pPPpp...', 'pPwppPPp.', '.ppPwpppP', '..pppPp..'], { p: '#ea919a', P: '#c45f6d', w: '#fbe3e6' }),
  shrimp: grid(['.rrrr..', 'rRwwRr.', 'rR..rRr', 'rR...rr', '.rr.rr.', '..rrr..'], { r: '#ef6a4a', R: '#ff9a78', w: '#ffd8c8' }),
  negi: grid(['.www.', 'wgGgw', '.www.'], { w: '#f4f7e4', g: '#8cc04a', G: '#5f9b2e' }),
  carrot: grid(['.o.o.', 'ooOoo', '.OoO.', 'ooOoo', '.o.o.'], { o: '#f08a3c', O: '#ffb26b' }),
  enoki: grid(['w.w.w.', 'WwWwW.', '.w.w.w', '.w.w.w', '.wwww.', '..kk..'], { w: '#fbf7e8', W: '#e3d9bd', k: '#c7b48a' }),
  shungiku: grid(['.g.G.g.', 'gGgGgGg', '.GgGgG.', '..g.g..'], { g: '#62ac4c', G: '#3f7f34' }),
}

/** What is in the pot, nearest last: [dx, dy from the opening's middle, ingredient]; the last ones go last. */
const IN_POT: readonly (readonly [number, number, string])[] = [
  [-16, -3, 'napa'],
  [12, -3, 'shiitake'],
  [-3, -4, 'tofu'],
  [-21, 1, 'shungiku'],
  [17, 1, 'naruto'],
  [-9, 1, 'negi'],
  [5, 1, 'shrimp'],
  [-14, 4, 'carrot'],
  [11, 4, 'enoki'],
  [0, 4, 'meat'],
]
/** How many pieces are left in the pot at each level (one piece of meat at last orders). */
const POT_PIECES: readonly number[] = [0, 1, 3, 5, 8, 10]

/** The food still to come, on the platter: [dx, dy, ingredient], the first ones go first. */
const ON_PLATTER: readonly (readonly [number, number, string])[] = [
  [-24, -1, 'napa'],
  [-13, -3, 'meat'],
  [-2, -3, 'meat'],
  [9, -3, 'shiitake'],
  [20, -1, 'tofu'],
  [-18, 3, 'shungiku'],
  [-6, 3, 'enoki'],
  [6, 3, 'carrot'],
  [18, 3, 'naruto'],
  [-1, 0, 'shrimp'],
]
/** The platter's share by the context's step, and by the feast's level. */
const PLATTER_SHARE: readonly number[] = [0.5, 0.67, 1, 1]
const LEVEL_SHARE: readonly number[] = [0, 0, 0.25, 0.5, 0.8, 1]

/** Each member's drink: Bocchi's grape soda, Nijika's oolong, Ryo's water, Kita's cola with a straw. */
const DRINK: Readonly<Record<Member, readonly [string, string]>> = { bocchi: ['#9a5bc0', '#c79ae6'], nijika: ['#c98a3a', '#e8b46a'], ryo: ['#bfe3f2', '#e8f7ff'], kita: ['#5a2a1a', '#8a4a2a'] }

function glassPix(m: Member): Pix {
  const p = pix(9, 15)
  const [dk, lt] = DRINK[m]
  block(p, 1, 2, 6, 12, (x, y) => (y < 4 ? '#dfeef5' : x === 1 || x === 6 ? '#a9c6d6' : y % 4 === 1 && x === 3 ? lt : dk))
  block(p, 2, 4, 3, 5, () => '#ffffff')
  block(p, 1, 13, 6, 13, () => '#cfe3ec')
  if (m === 'kita') {
    pline(p, 5, 0, 5, 6, '#ff5d73')
    put(p, 6, 0, '#ff5d73')
  }
  rim(p, '#56707e')
  return p
}

/** The platter: a blue-rimmed oval plate. */
function platterPix(): Pix {
  const p = pix(68, 19)
  oval(p, 34, 9, 32.5, 8.2, (u, v) => {
    const d = Math.hypot(u, v)
    const x = Math.round(34 + u * 32.5)
    return d > 0.86 ? '#2f4a8a' : d > 0.72 ? (x % 4 < 2 ? '#4a68b0' : '#f2f0ea') : v > 0.35 ? '#dcd8ce' : '#f4f2ec'
  })
  rim(p, '#1d2a52')
  return p
}

/** Each member's zabuton in her colours: light, mid, shade, outline. */
const ZABUTON: Readonly<Record<Member, readonly [string, string, string, string]>> = {
  bocchi: ['#f6c9d8', '#e7a3bb', '#c06e8a', '#5a2a3e'],
  nijika: ['#f9e3a6', '#efcf7a', '#c99a3e', '#5e4512'],
  ryo: ['#bcd0f2', '#93b2e6', '#5f82c4', '#22365e'],
  kita: ['#f9c7b2', '#f2a283', '#cf6a4c', '#5e2416'],
}

function zabutonPix(m: Member): Pix {
  const [lt, md, sh, ln] = ZABUTON[m]
  const p = pix(34, 11)
  for (let y = 1; y <= 9; y += 1) {
    const inset = y === 1 || y === 9 ? 2 : y === 2 || y === 8 ? 1 : 0
    for (let x = 1 + inset; x <= 32 - inset; x += 1) put(p, x, y, y >= 7 ? sh : y === 1 || x <= 2 + inset ? lt : (x + y) % 11 === 0 ? lt : md)
  }
  block(p, 16, 3, 17, 4, () => sh)
  rim(p, ln)
  return p
}

/** A gig bag leaning on the wall after the show: the headstock's pocket, the neck, the two bouts, a front pocket, a tag in its owner's colour. */
function gigBagPix(h: number, pal: readonly [string, string, string, string], tag: string): Pix {
  const [lt, md, sh, ln] = pal
  const p = pix(20, h)
  const cx = 9.5
  const PROFILE: readonly (readonly [number, number])[] = [[0, 2.2], [0.04, 3.2], [0.1, 3], [0.4, 3], [0.46, 5.2], [0.52, 6.6], [0.6, 6.1], [0.66, 5.6], [0.74, 7], [0.86, 8.2], [0.95, 7.6], [1, 5.6]]
  const hwAt = (t: number) => {
    for (let i = 1; i < PROFILE.length; i += 1) {
      const [t1, b] = PROFILE[i] as readonly [number, number]
      if (t <= t1) {
        const [t0, a] = PROFILE[i - 1] as readonly [number, number]
        return a + ((b - a) * (t - t0)) / (t1 - t0)
      }
    }
    return 5.6
  }
  for (let y = 0; y < h; y += 1) {
    const hw = hwAt(y / (h - 1))
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x += 1) {
      const pocket = y > h * 0.58 && y < h * 0.86 && Math.abs(x - cx) < hw - 2.5
      put(p, x, y, x <= cx - hw + 1.5 ? lt : x >= cx + hw - 2 ? sh : pocket ? (y === Math.round(h * 0.58) + 1 ? lt : md) : y % 9 === 4 && Math.abs(x - cx) < 1 ? lt : md)
    }
  }
  pline(p, Math.round(cx + 3), Math.round(h * 0.12), Math.round(cx + 6), Math.round(h * 0.5), sh)
  block(p, Math.round(cx) - 1, Math.round(h * 0.44), Math.round(cx), Math.round(h * 0.44) + 2, () => tag)
  rim(p, ln)
  return p
}

/** Bocchi's rain cloud, over her box while the cache is cold. */
function cloudPix(): Pix {
  const p = pix(26, 11)
  oval(p, 8, 6, 6.5, 4.2, () => '#8e97a8')
  oval(p, 15, 4.6, 7, 4.2, () => '#a2abbb')
  oval(p, 20, 6.6, 5.2, 3.6, () => '#8e97a8')
  block(p, 4, 7, 22, 9, (_x, y) => (y === 9 ? '#6c7486' : '#7d8698'))
  rim(p, '#3c4252')
  return p
}

/** The red lantern at the right, its paper lit from within (dull once cold): the black rings, the ribs, a highlight at the upper left, the tassel. */
function lanternPix(lit: boolean): Pix {
  const [hi, paper, shade, rib] = lit ? (['#ee5b54', '#d8343c', '#b52a33', '#a5222c'] as const) : (['#7a3238', '#6a2a30', '#5c252b', '#4a1c22'] as const)
  const p = pix(21, 35)
  oval(p, 10.5, 15.5, 8.5, 14, (u, v) => {
    const x = Math.round(10 + u * 8.5)
    const y = Math.round(15 + v * 14)
    if (y < 4 || y > 26) return null
    const shine = (x === 6 || x === 7) && y > 6 && y < 18
    if (y % 3 === 0) return shine ? paper : rib
    return shine ? hi : u > 0.66 ? shade : paper
  })
  block(p, 5, 1, 15, 3, (_x, y) => (y === 1 ? '#3d3035' : '#1d1619'))
  block(p, 5, 27, 15, 29, (_x, y) => (y === 27 ? '#3d3035' : '#1d1619'))
  put(p, 10, 30, '#d8343c')
  block(p, 9, 31, 11, 33, () => '#d8343c')
  rim(p, '#1d1619')
  return p
}

/** The lamp over the pot: its cord and socket, a domed shade with a highlight at the upper left and its lip, the bulb under it while lit. */
function lampPix(lit: boolean): Pix {
  const [hi, glaze, shade, lip] = lit ? (['#ffd79a', '#e9a456', '#c9853f', '#8a5226'] as const) : (['#5a4a3a', '#4a3a2a', '#3f3124', '#3a2a1a'] as const)
  const p = pix(27, 21)
  for (let y = 9; y <= 16; y += 1) {
    const hw = 10.5 * Math.pow(1 - Math.pow((16.5 - y) / 8, 2.5), 0.4)
    block(p, Math.ceil(13 - hw), y, Math.floor(13 + hw), y, x => ((x - 13) / hw > 0.6 ? shade : glaze))
  }
  for (const [x, y] of [[9, 10], [10, 10], [11, 10], [7, 11], [8, 11], [6, 12], [6, 13], [5, 14]] as const) put(p, x, y, hi)
  block(p, 1, 17, 25, 17, () => lip)
  block(p, 12, 7, 14, 8, () => '#1d1619')
  rim(p, '#1d1619')
  pline(p, 13, 0, 13, 6, '#1d1619')
  if (lit) block(p, 10, 18, 16, 19, (x, y) => (y === 19 && (x === 10 || x === 16) ? null : '#fff6d0'))
  return p
}

/** A prop lit, and dark once cold. */
type Lit = { lit: string; dark: string }

/** The props, built once a load, as the sprites are written. */
type Props = { pot: string; lid: string; stove: string; platter: string; glass: Record<Member, string>; zabuton: Record<Member, string>; bags: string; cloud: string; food: Record<string, string>; lantern: Lit; lamp: Lit }
const propsMemo: Props[] = []
function props(): Props {
  const hit = propsMemo[0]
  if (hit !== undefined) return hit
  const members = ['bocchi', 'nijika', 'ryo', 'kita'] as const
  const each = (fn: (m: Member) => Pix) => Object.fromEntries(members.map(m => [m, pixPaths(fn(m))])) as Record<Member, string>
  const built: Props = {
    pot: pixPaths(potPix()),
    lid: pixPaths(lidPix()),
    stove: pixPaths(stovePix()),
    platter: pixPaths(platterPix()),
    glass: each(glassPix),
    zabuton: each(zabutonPix),
    bags: [
      placedArt(10, 14, 1, pixPaths(gigBagPix(60, ['#4a4452', '#2f2a36', '#1f1b25', '#120f16'], '#f7a8c9'))),
      placedArt(236, 6, 1, pixPaths(gigBagPix(68, ['#3b4560', '#262d42', '#181d2e', '#0d1018'], '#8fb8ff'))),
      placedArt(257, 14, 1, pixPaths(gigBagPix(60, ['#55424a', '#38282f', '#261a20', '#140c10'], '#ff8a65'))),
    ].join(''),
    cloud: pixPaths(cloudPix()),
    food: Object.fromEntries(Object.entries(FOOD).map(([k, p]) => [k, pixPaths(p)])),
    lantern: { lit: pixPaths(lanternPix(true)), dark: pixPaths(lanternPix(false)) },
    lamp: { lit: pixPaths(lampPix(true)), dark: pixPaths(lampPix(false)) },
  }
  propsMemo.push(built)
  return built
}

const brothMemo = new Map<string, string>()
function broth(kind: 'warm' | 'cold' | 'zosui', level: number): string {
  const key = `${kind}${level}`
  let hit = brothMemo.get(key)
  if (hit === undefined) {
    hit = pixPaths(brothPix(kind, level))
    brothMemo.set(key, hit)
  }
  return hit
}

// ---- The drawing ---------------------------------------------------------------------------------------------

const MINCHO = `'Yu Mincho', 'YuMincho', 'Hiragino Mincho ProN', 'MS Mincho', serif`
const R = (x: number, y: number, w: number, h: number, fill: string, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra}/>`
const CRISP = (body: string) => `<g shape-rendering="crispEdges" fill="none" stroke-width="1">${body}</g>`
const at = (x: number, y: number, body: string) => placedArt(x, y, 1, body)

/** The room behind the table: the plank wall, the lamp-lit shoji, the band's flyer, the menu plaques, the beam, the tatami. */
function roomMarkup(): string {
  let s = `<defs><pattern id="pk" width="16" height="96" patternUnits="userSpaceOnUse">${R(0, 0, 16, 96, '#3b2419')}${R(0, 0, 8, 96, '#42291d')}${R(15, 0, 1, 96, '#25150e')}${R(7, 0, 1, 96, '#2f1c14')}${R(3, 8, 1, 30, '#4b2f21')}${R(11, 46, 1, 28, '#48301f')}</pattern>`
  s += `<radialGradient id="pp" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#fff3d6"/><stop offset=".7" stop-color="#f1dcae"/><stop offset="1" stop-color="#d9bd87"/></radialGradient>`
  s += `<pattern id="tm" width="4" height="6" patternUnits="userSpaceOnUse">${R(0, 0, 4, 6, '#a59869')}${R(0, 0, 1, 6, '#998c5d')}${R(2, 3, 2, 1, '#9e9162')}</pattern>`
  s += `<radialGradient id="gw"><stop offset="0" stop-color="#ffd89a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd89a" stop-opacity="0"/></radialGradient>`
  s += `<linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5634"/><stop offset=".55" stop-color="#7a4a2c"/><stop offset="1" stop-color="#5e3820"/></linearGradient></defs>`
  s += R(0, 0, SCENE_W, 64, 'url(#pk)')
  s += R(6, 3, 98, 44, '#4a2e1f') + R(8, 5, 94, 40, 'url(#pp)')
  for (let x = 21; x < 102; x += 13) s += R(x, 5, 1, 40, '#7a5238')
  for (let y = 15; y < 45; y += 10) s += R(8, y, 94, 1, '#7a5238')
  s += R(8, 5, 94, 1, '#a07a58') + R(6, 45, 98, 2, '#2a1810')
  // the band's flyer, pinned up: its outline, the paper, the pink head, the four in their colours, the pin
  s += R(110, 13, 21, 32, '#24150e') + R(109, 14, 23, 30, '#24150e') + R(110, 14, 21, 30, '#efe7da') + R(110, 14, 21, 6, '#f7a8c9')
  s += ['#f7a8c9', '#ffd166', '#8fb8ff', '#ff8a65'].map((c, i) => R(113 + i * 4, 25, 3, 3, c)).join('')
  s += R(118, 12, 5, 2, '#24150e') + R(119, 11, 3, 1, '#24150e') + R(119, 12, 3, 2, '#c4304a') + R(119, 12, 1, 1, '#f07a8c')
  s += `<text x="120.5" y="18.6" font-family="${MINCHO}" font-size="4.2" font-weight="bold" text-anchor="middle" fill="#542549">結束バンド</text>`
  s += `<text x="120.5" y="34" font-family="${SANS}" font-size="3.6" font-weight="bold" text-anchor="middle" fill="#2a1912">LIVE @</text><text x="120.5" y="39" font-family="${SANS}" font-size="3.8" font-weight="bold" text-anchor="middle" fill="#c4304a">STARRY</text>`
  ;['寄せ鍋', '雑炊', '唐揚げ', '枝豆', '烏龍茶', '焼き鳥'].forEach((t, i) => {
    const x = 168 + i * 15
    s += R(x, 7, 12, 40, '#8a6440') + R(x + 1, 8, 10, 38, '#dcbb8d') + R(x + 1, 8, 10, 1, '#efd3a8')
    s += `<text x="${x + 6}" y="12" font-family="${MINCHO}" font-size="7" font-weight="bold" fill="#2a1912" writing-mode="tb" letter-spacing="-.5">${t}</text>`
  })
  s += R(166, 4, 92, 3, '#26160f') + R(166, 4, 92, 1, '#5a3a28')
  s += R(0, 49, SCENE_W, 4, '#24140d') + R(0, 49, SCENE_W, 1, '#5e3e2b') + R(0, 53, SCENE_W, 11, '#2b1a12')
  for (let x = 0; x < SCENE_W; x += 36) s += R(x, 53, 1, 11, '#22130c')
  s += R(0, 64, SCENE_W, 120, 'url(#tm)') + R(0, 64, SCENE_W, 2, '#1d1610')
  for (const y of [104, 146]) s += R(0, y, SCENE_W, 2, '#2f3a24') + R(0, y + 2, SCENE_W, 1, '#4a5a36')
  for (const [x, y0, y1] of [[82, 66, 104], [204, 66, 104], [30, 107, 146], [152, 107, 146], [270, 107, 146], [96, 149, 184], [218, 149, 184]] as const) s += R(x, y0, 2, y1 - y0, '#2f3a24')
  return s
}

/** The lamp over the pot and its light, the lantern swaying at the right (dark once cold), the LAST ORDER sign at last orders. */
function lampsMarkup(phase: FeastPhase): string {
  const P = props()
  const lit = phase !== 'cold'
  let s = `${R(272, 0, 1, 5, '#1d1619')}<g transform="translate(262 5)"><g class="lt">`
  if (lit) s += `<ellipse cx="10.5" cy="15.5" rx="16" ry="18" fill="url(#gw)" opacity=".8"/>`
  s += `${CRISP(lit ? P.lantern.lit : P.lantern.dark)}<text x="10.5" y="19" text-anchor="middle" font-family="${MINCHO}" font-weight="bold" font-size="9" fill="#1d1012">鍋</text></g></g>`
  if (lit) s += `<path d="M133 18h22l74 100h-170z" fill="#ffd89a" opacity="${phase === 'last' ? 0.04 : 0.08}"/><ellipse cx="144" cy="20" rx="22" ry="10" fill="url(#gw)"/>`
  s += CRISP(at(131, 0, lit ? P.lamp.lit : P.lamp.dark))
  if (phase === 'last') {
    s += `${R(150, 20, 16, 32, '#24150e')}${R(149, 21, 18, 30, '#24150e')}${R(150, 21, 16, 30, '#c4304a')}${R(151, 22, 14, 28, '#fffaf2')}<text x="158" y="24" font-family="'Yu Gothic', Meiryo, sans-serif" font-weight="900" font-size="3.6" fill="#c4304a" writing-mode="tb" letter-spacing="-.4">ラストオーダー</text><text x="158" y="49" text-anchor="middle" font-family="${SANS}" font-weight="900" font-size="3" fill="#c4304a">LAST</text>`
  }
  return s
}

/** The table: one polygon of keyaki planks, the lamp's warmth in its middle, its lit rims, the front board. */
function tableMarkup(): string {
  const yN = TABLE.nearY
  const pt = (x: number, y: number) => `${f(x)},${f(y)}`
  let s = `<polygon points="${pt(TABLE.farL - 3, TABLE.farY + 5)} ${pt(TABLE.farR + 3, TABLE.farY + 5)} ${pt(edgeR(yN) + 10, yN)} ${pt(edgeL(yN) - 10, yN)}" fill="#000" opacity=".35"/>`
  s += `<polygon points="${pt(TABLE.farL, TABLE.farY)} ${pt(TABLE.farR, TABLE.farY)} ${pt(edgeR(yN), yN)} ${pt(edgeL(yN), yN)}" fill="url(#wd)"/>`
  for (const y of [117, 139, 162]) s += `<path d="M${f(edgeL(y))} ${y}.5H${f(edgeR(y))}" stroke="#4a2918" stroke-width="1" opacity=".55"/>`
  for (let i = 0; i < 14; i += 1) {
    const y = TABLE.farY + 4 + ((i * 29) % 76)
    const x = edgeL(y) + 8 + ((i * 53) % Math.max(10, Math.round(edgeR(y) - edgeL(y) - 50)))
    s += R(Math.round(x), y, 18 + ((i * 17) % 28), 1, i % 3 ? '#6a3e26' : '#94603c', ' opacity=".6"')
  }
  s += `<ellipse cx="144" cy="132" rx="84" ry="36" fill="url(#gw)" opacity=".35"/>`
  s += `<path d="M${TABLE.farL} ${TABLE.farY}.5H${TABLE.farR}" stroke="#c48c58" stroke-width="1"/>`
  s += `<path d="M${f(TABLE.farL + 1)} ${TABLE.farY + 1}L${f(edgeL(yN) + 1)} ${yN}M${f(TABLE.farR - 1)} ${TABLE.farY + 1}L${f(edgeR(yN) - 1)} ${yN}" stroke="#b07a48" stroke-width="1" opacity=".9"/>`
  s += `<path d="M${TABLE.farL} ${TABLE.farY}L${f(edgeL(yN))} ${yN}M${TABLE.farR} ${TABLE.farY}L${f(edgeR(yN))} ${yN}" stroke="#2e1a10" stroke-width="1"/>`
  s += `<polygon points="${pt(edgeL(yN), yN)} ${pt(edgeR(yN), yN)} ${pt(edgeR(yN) - 1, 186)} ${pt(edgeL(yN) + 1, 186)}" fill="#3a2014"/>`
  s += `<path d="M${f(edgeL(yN))} ${yN}.5H${f(edgeR(yN))}" stroke="#b07a48" stroke-width="1"/>`
  return s
}

/**
 * Over the pot, where the far two's chopsticks reach down into it: the table behind the pot's middle, from their
 * waists' row, and the pot's top (its rim's oval). Below their waists they draw nothing else (only hair, which
 * falls outside the table), so the window shows only their chopsticks and what is on them.
 */
export const OVER_POT = { x0: 112, x1: 176, top: SEAT_ROW.bocchi + 1, cy: 124, rx: 32, ry: 11.4 } as const

/**
 * Her lap's clip: everything but the table nearer than her waist, which hides her lap; for the far two, eating
 * (`overPot`), with OVER_POT open again, so their chopsticks show over the pot's back rim and in its opening (the
 * pot is laid under the whole band). The table's quad winds against the room's, the window with it: nonzero.
 */
function lapClip(m: Member, overPot: boolean): string {
  const y = SEAT_ROW[m] + 1
  const low = SCENE_H + 2
  const o = OVER_POT
  const window = overPot ? ` M${o.x0} ${o.top}H${o.x1}V${o.cy}A${o.rx} ${o.ry} 0 0 1 ${o.x0} ${o.cy}Z` : ''
  return `<clipPath id="lp${m[0]}"><path d="M-10 -10H${SCENE_W + 10}V${SCENE_H + 10}H-10Z M${f(edgeL(y))} ${y}L${f(edgeL(low))} ${low}L${f(edgeR(low))} ${low}L${f(edgeR(y))} ${y}Z${window}"/></clipPath>`
}

/** Each zabuton's left side from the table's edge at her row: the far two's further out, past the near two's heads. */
const CUSHION_OUT: Readonly<Record<Member, number>> = { bocchi: -34, nijika: -22, ryo: 0, kita: -12 }

/** A zabuton's top left (34 x 11) under her seat, its outer corner past the table's edge. */
export function cushionAt(m: Member): { x: number; y: number } {
  const row = SEAT_ROW[m]
  return { x: Math.round((SEAT_SIDE[m] === 'left' ? edgeL(row) : edgeR(row)) + CUSHION_OUT[m]), y: row + 1 }
}

/** The zabuton under each seat, drawn under the table, each one's corner showing past its edge. */
function cushions(): string {
  const P = props()
  return SEAT_ORDER.map(m => {
    const c = cushionAt(m)
    return at(c.x, c.y, P.zabuton[m])
  }).join('')
}

/** The flames under the pot, the burner's ring wider than its base so the outer ones show at its sides: blue, licking up; sputtering at last orders; none while it is out. */
function flames(phase: FeastPhase, level: number): string {
  if (!(phase === 'zosui' || (isWarmPhase(phase) && level > 0))) return ''
  const cls = phase === 'last' || phase === 'tend' ? 'fs' : 'fl'
  let s = ''
  for (let i = 0; i < 9; i += 1) {
    const x = 112 + i * 8
    s += `<g class="${cls}" style="animation-delay:${f(-i * 0.13)}s"><path d="M${x} 143c-1.6-1.2-1.8-3.2 0-5.4 1.8 2.2 1.6 4.2 0 5.4z" fill="#7fb6ff"/><path d="M${x} 143c-.8-.7-.9-1.8 0-3 .9 1.2.8 2.3 0 3z" fill="#e8f3ff"/></g>`
  }
  return s
}

/** The pot and what is in it: broth by level, the food left, the lid while nothing is cached. */
function potMarkup(phase: FeastPhase, level: FeastLevel): string {
  const P = props()
  let s = at(POT.x, POT.y - 1, P.pot)
  if (phase === 'none' || phase === 'cleared' || phase === 'off') return s + at(POT.x + 7, POT.y - 12, P.lid)
  const kind = phase === 'zosui' ? 'zosui' : phase === 'cold' || phase === 'held' ? 'cold' : 'warm'
  s += at(POT.x + 12, POT.y + 1, broth(kind, kind === 'warm' ? level : 0))
  if (kind === 'warm') {
    const n = POT_PIECES[level] ?? 0
    for (const [dx, dy, ing] of IN_POT.slice(IN_POT.length - n)) {
      const food = FOOD[ing] as Pix
      s += at(Math.round(144 + dx - food.w / 2), Math.round(POT.y + 10 + dy - food.h / 2), props().food[ing] as string)
    }
  }
  return s
}

/** The bubbles on a boiling broth, and zosui's rice turning in it. */
function bubbles(phase: FeastPhase): string {
  if (phase !== 'zosui' && phase !== 'feast' && phase !== 'simmer') return ''
  const n = phase === 'simmer' ? 3 : 6
  let s = ''
  for (let i = 0; i < n; i += 1) {
    const x = 128 + ((i * 37) % 34)
    const y = POT.y + 6 + ((i * 13) % 8)
    s += `<circle class="bb" cx="${x}" cy="${y}" r="${phase === 'zosui' ? 1.4 : 1.1}" fill="none" stroke="${phase === 'zosui' ? '#fffaf0' : '#f7d27a'}" stroke-width=".6" style="animation-delay:${f(-i * 0.37)}s"/>`
  }
  if (phase === 'zosui') s += `<g class="zs"><ellipse cx="144" cy="${POT.y + 10}" rx="9" ry="3" fill="none" stroke="#fff4c8" stroke-width=".7" stroke-dasharray="2 3"/></g>`
  return s
}

/** The steam: heavy over zosui, rising over a feast, thinner as it runs low, none once cold. */
function steam(phase: FeastPhase): string {
  const n = phase === 'zosui' ? 5 : phase === 'feast' ? 4 : phase === 'simmer' ? 3 : phase === 'low' ? 2 : phase === 'last' || phase === 'tend' ? 1 : 0
  let s = ''
  for (let i = 0; i < n; i += 1) {
    const x = 132 + i * 6
    s += `<g class="st" style="animation-delay:${f(-i * 0.8)}s"><path d="M${x} ${POT.y + 4}c-3-4 3-6 0-10s3-6 0-10" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/></g>`
  }
  return s
}

/** The platter's food: its share by the context's step and the feast's level (all of it set while nothing is cached), a meat tower from 250k. */
function platterFood(phase: FeastPhase, level: number, tier: 0 | 1 | 2 | 3): string {
  const P = props()
  const share = phase === 'none' || phase === 'cleared' || phase === 'off' ? 1 : phase === 'zosui' ? 0 : (LEVEL_SHARE[level] ?? 0)
  const n = Math.round(ON_PLATTER.length * share * (PLATTER_SHARE[tier] ?? 1))
  let s = ''
  for (const [dx, dy, ing] of ON_PLATTER.slice(0, n)) {
    const food = FOOD[ing] as Pix
    s += at(Math.round(144 + dx - food.w / 2), Math.round(PLATTER.y + 9 + dy - food.h / 2), P.food[ing] as string)
  }
  if (tier === 3 && share > 0.4) for (let i = 0; i < 3; i += 1) s += at(140 - (i % 2), PLATTER.y + 2 - i * 3, P.food.meat as string)
  return s
}

/** The slip on the table while a send is held: the re-write's price and a warm turn's. */
function slipMarkup(slip: NonNullable<HotpotView['slip']>): string {
  return `<g transform="translate(121 ${POT.y + 23}) rotate(-6)"><path d="M0 0h46v38l-3 2.4-3-2.4-3 2.4-3-2.4-3 2.4-3-2.4-3 2.4-3-2.4-3 2.4-3-2.4-3 2.4-3-2.4-3 2.4-3-2.4-3 2.4L0 38z" fill="#fffdf6" stroke="#b9ad98" stroke-width=".6"/><text x="23" y="7.5" text-anchor="middle" font-family="${MINCHO}" font-weight="bold" font-size="6" fill="#2a1912">お会計</text><text x="23" y="14" text-anchor="middle" font-family="${SANS}" font-size="4" fill="#6b5a4a">re-order ${esc(fmtTokens(slip.tokens))} tok</text><text x="23" y="25" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="9" fill="#c4304a">≈${esc(fmtUsd(slip.writeUsd))}</text><text x="23" y="32" text-anchor="middle" font-family="${SANS}" font-size="3.8" fill="#6b5a4a">warm, it was ${esc(fmtUsd(slip.warmUsd))}</text></g>`
}

/** Snow falling across the room once the cache is cold. */
function snow(): string {
  let s = ''
  for (let i = 0; i < 18; i += 1) {
    const x = 8 + ((i * 53) % 272)
    const y = 4 + ((i * 29) % 60)
    s += `<circle class="sn" cx="${x}" cy="${y}" r="${i % 3 === 0 ? 1.2 : 0.8}" fill="#eef6ff" opacity=".85" style="animation-delay:${f(-i * 0.61)}s"/>`
  }
  return s
}

/** Gloom lines over a head. */
function gloom(x: number, y: number): string {
  let s = '<g class="gm">'
  for (let i = 0; i < 4; i += 1) s += `<path d="M${f(x + i * 5)} ${f(y)}v${i % 2 ? 7 : 9}" stroke="#6d5a92" stroke-width="1" opacity=".8"/>`
  return `${s}</g>`
}

/** Bocchi's rain cloud over her box, its drips falling. */
function rainCloud(x: number, y: number): string {
  let s = CRISP(at(Math.round(x - 13), Math.round(y), props().cloud))
  for (let i = 0; i < 4; i += 1) s += `<path class="dr" d="M${f(x - 8 + i * 5)} ${f(y + 12)}v3" stroke="#8fb8ff" stroke-width="1" style="animation-delay:${f(-i * 0.4)}s"/>`
  return s
}

/** Sparkles on the pot between Kita's phone and the food while she photographs it (the flash is her sprite's, on its lens). */
function photoSparkles(): string {
  const k = seatAt('kita')
  const x = k.x + KITA_LENS.x
  const y = k.y + KITA_LENS.y
  return sparkle(x - 12, y - 5, 2.4, '#fff6c0', 'sk') + sparkle(x - 5, y - 13, 1.9, '#ffffff', 'sk') + sparkle(x - 21, y - 11, 1.7, '#ffd6e6', 'sk')
}

/** A speech bubble over her head; of two, the second shows in turn. */
function bubble(m: Member, text: string, cls: string): string {
  const h = headAt(m)
  const size = 7
  const w = Math.ceil(textWidth(text, 'uib', size)) + 10
  const side = SEAT_SIDE[m]
  const far = m === 'bocchi' || m === 'ryo'
  const cx = Math.max(w / 2 + 2, Math.min(SCENE_W - w / 2 - 2, side === 'left' ? h.x - (far ? 10 : 18) : h.x + (far ? 10 : 18)))
  const cy = Math.max(9, h.y - (far ? 27 : 24))
  const tip = side === 'left' ? Math.min(cx + w / 2 - 6, h.x - 2) : Math.max(cx - w / 2 + 6, h.x + 2)
  const color = MEMBERS[m].color
  return `<g class="${cls}"><path d="M${f(tip - 3)} ${f(cy + 6)}L${f(tip)} ${f(cy + 11)}L${f(tip + 3)} ${f(cy + 6)}z" fill="#fffaf2" stroke="${color}" stroke-width="1"/><rect x="${f(cx - w / 2)}" y="${f(cy - 6)}" width="${w}" height="12" rx="4" fill="#fffaf2" stroke="${color}" stroke-width="1"/><path d="M${f(tip - 2.4)} ${f(cy + 5.6)}h4.8" stroke="#fffaf2" stroke-width="1.2"/><text x="${f(cx)}" y="${f(cy + 2.5)}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="${size}" fill="#2a1912">${esc(text)}</text></g>`
}

/** The room's light: a shade darker than the table under the lamp; blue and dim once cold; the knob's glow while keepwarm runs. */
function lighting(phase: FeastPhase, keepwarm: boolean): string {
  let s = ''
  if (phase === 'cold') s += R(0, 0, SCENE_W, SCENE_H, '#1b2a4a', ' opacity=".34"')
  else if (phase === 'held') s += R(0, 0, SCENE_W, SCENE_H, '#140a10', ' opacity=".18"')
  else s += `<path d="M0 0H${SCENE_W}V${SCENE_H}H0z M60 132a84 36 0 1 0 168 0a84 36 0 1 0 -168 0z" fill="#140a10" fill-rule="evenodd" opacity="${phase === 'last' || phase === 'tend' ? 0.3 : 0.2}"/>`
  if (keepwarm) s += `<circle class="kb" cx="${POT.x + 70}" cy="${POT.y + 34}" r="4" fill="#ff7a3a" opacity=".55"/>`
  return s
}

const SCENE_CSS =
  '.st{animation:st 3.2s ease-out infinite}@keyframes st{0%{transform:translateY(2px);opacity:0}25%{opacity:1}100%{transform:translateY(-12px);opacity:0}}' +
  '.fl{transform-box:fill-box;transform-origin:50% 100%;animation:fl .5s ease-in-out infinite alternate}@keyframes fl{from{transform:scaleY(.8)}to{transform:scaleY(1.15)}}' +
  '.fs{transform-box:fill-box;transform-origin:50% 100%;animation:fs 1.3s steps(2,end) infinite}@keyframes fs{0%{transform:scaleY(1);opacity:1}50%{transform:scaleY(.5);opacity:.4}100%{transform:scaleY(.9);opacity:1}}' +
  '.bb{transform-box:fill-box;transform-origin:50% 50%;animation:bb 1.4s ease-out infinite}@keyframes bb{0%{transform:scale(.3);opacity:0}40%{opacity:1}100%{transform:scale(1.4);opacity:0}}' +
  '.zs{transform-box:fill-box;transform-origin:50% 50%;animation:zs 6s linear infinite}@keyframes zs{to{transform:rotate(360deg)}}' +
  '.lt{transform-origin:10px 0;animation:lt 4.8s ease-in-out infinite alternate}@keyframes lt{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
  '.sk{animation:sk 2.2s ease-in-out infinite}@keyframes sk{0%,100%{opacity:.2}50%{opacity:1}}' +
  '.sn{animation:sn 6s linear infinite}@keyframes sn{from{transform:translateY(-8px)}to{transform:translateY(120px)}}' +
  '.dr{animation:dr 1.1s linear infinite}@keyframes dr{from{transform:translateY(0);opacity:1}to{transform:translateY(8px);opacity:0}}' +
  '.gm{animation:gm 2.4s ease-in-out infinite}@keyframes gm{0%,100%{opacity:.5}50%{opacity:1}}' +
  '.kb{animation:kb 1.8s ease-in-out infinite}@keyframes kb{0%,100%{opacity:.3}50%{opacity:.75}}' +
  '.sa{animation:sa 7s steps(1,end) infinite}@keyframes sa{0%{opacity:1}50%{opacity:0}}' +
  '.sb{opacity:0;animation:sb 7s steps(1,end) infinite}@keyframes sb{0%{opacity:0}50%{opacity:1}}' +
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'

/** Nijika's headband: one still on the feast window, drawn over whatever she plays while keepwarm runs. */
export const HEADBAND = 'nijika-feast-headband'

/** The band's parts, in paint order (Bocchi, Ryo, Nijika, the headband while keepwarm runs, Kita), each with her lap's clip. */
export function bandParts(phase: FeastPhase, moment: KessokuHotpot['moment'], keepwarm: boolean): { parts: SpritePart[]; wraps: string[] } {
  const states = seatStates(phase, moment)
  const parts: SpritePart[] = []
  const wraps: string[] = []
  for (const m of SEAT_ORDER) {
    const s = seatAt(m)
    const state = states[m]
    parts.push(state === 'box' ? { id: seatSpriteId(m, state), x: s.x, y: s.y - BOX_RAISE } : { id: seatSpriteId(m, state), x: s.x, y: s.y + FEAST_TOP })
    wraps.push(`clip-path="url(#lp${m[0]})"`)
    if (m === 'nijika' && keepwarm) {
      parts.push({ id: HEADBAND, x: s.x, y: s.y + FEAST_TOP })
      wraps.push(`clip-path="url(#lp${m[0]})"`)
    }
  }
  return { parts, wraps }
}

/**
 * The band fitted into `budget` characters with `under` (the stove and the
 * pot) laid first inside the sprites' group, under all four, so the far two
 * reach over its back rim and the near two sit in front of it: the largest
 * gives up frames first, and the headband goes with Nijika when the fit
 * leaves her out (a guard: the real scenes leave the band room to spare, all
 * four at level 0). `levels` and `parts` are the fit's, over the parts the
 * table has.
 */
export function fitBand(parts: readonly SpritePart[], wraps: readonly string[], under: string, budget: number, table: SpriteTable = SPRITES): { markup: string; levels: number[]; parts: SpritePart[] } {
  const fit = (list: readonly SpritePart[], wrapList: readonly string[]) => {
    const r = fitSprites(list, budget, table)
    const markup = spliceAfter(r.markup, list, [], wrapList).replace(/^<g [^>]*>/, open => open + under)
    return { markup, levels: r.levels, parts: list.filter(p => table[p.id] !== undefined) }
  }
  const first = fit(parts, wraps)
  const nijikaAt = first.parts.findIndex(p => p.id.startsWith('nijika-feast-') && p.id !== HEADBAND)
  const hasHeadband = first.parts.some(p => p.id === HEADBAND)
  if (!hasHeadband || (nijikaAt >= 0 && (first.levels[nijikaAt] ?? 0) >= 0)) return first
  const kept = parts.map((p, i) => [p, wraps[i] ?? ''] as const).filter(([p]) => p.id !== HEADBAND)
  return fit(
    kept.map(([p]) => p),
    kept.map(([, w]) => w),
  )
}

/** What the scene's source depends on, and nothing else (no clock): the same key, the same string. */
function sceneKey(v: HotpotView, layout: SceneLayout): string {
  const { phase, level } = drawnPhase(v)
  const keepwarm = v.cache.keepWarmUntil > v.now
  const moment = momentOf(v)
  const slip = phase === 'held' && v.slip !== null ? [fmtUsd(v.slip.writeUsd), fmtUsd(v.slip.warmUsd), fmtTokens(v.slip.tokens)] : null
  return JSON.stringify([layout.width, phase, level, keepwarm, platterTier(v.cache.contextTokens), phase === 'held', phase === 'zosui', moment?.kind ?? '', slip])
}

const sceneMemo = new Map<string, SceneSvg>()

/**
 * The feast: the room, the table and its cushions, the stove and the pot, the
 * far two seated (their chopsticks over its back rim), the near two, the
 * platter and the steam, the slip during a hold, the room's light and the
 * speech; the band fitted into what the room leaves of the Svg's limit, the
 * largest giving up frames first. Memoised on its key, so an unchanged feast
 * is the same string.
 */
export function hotpotSvg(v: HotpotView, layout: SceneLayout): SceneSvg {
  const key = sceneKey(v, layout)
  const hit = sceneMemo.get(key)
  if (hit !== undefined) return { ...hit, alt: hotpotAlt(v) }
  const { phase, level } = drawnPhase(v)
  const moment = momentOf(v)
  const keepwarm = v.cache.keepWarmUntil > v.now
  const P = props()
  const states = seatStates(phase, moment)
  const reaches = (m: Member) => (m === 'bocchi' || m === 'ryo') && (states[m] === 'eat' || states[m] === 'calm' || states[m] === 'worry')
  const clips = `<defs>${SEAT_ORDER.map(m => lapClip(m, reaches(m))).join('')}</defs>`
  const back = roomMarkup() + clips + CRISP(P.bags) + lampsMarkup(phase) + CRISP(cushions()) + tableMarkup() + CRISP(at(98, 97, P.glass.bocchi) + at(181, 97, P.glass.ryo))
  // the stove, its flames, the pot: laid first inside the sprites' group (crisp, stroked, no fill), under the band
  const potStuff = `<ellipse cx="144" cy="${POT.y + 39}" rx="44" ry="3" fill="#000" opacity=".35"/>${at(POT.x - 3, POT.y + 26, P.stove)}${flames(phase, level)}${potMarkup(phase, level)}${bubbles(phase)}`
  const n = seatAt('nijika')
  const k = seatAt('kita')
  let after = CRISP(at(n.x + FEAST_WAIST.nijika.x + 30, 143, P.glass.nijika) + at(k.x + FEAST_WAIST.kita.x - 40, 143, P.glass.kita) + at(PLATTER.x, PLATTER.y, P.platter) + platterFood(phase, level, platterTier(v.cache.contextTokens))) + steam(phase)
  if (phase === 'held' && v.slip !== null) after += slipMarkup(v.slip)
  if (phase === 'feast' && moment === null) after += photoSparkles()
  if (phase === 'cold') {
    const b = headAt('bocchi')
    after += snow() + rainCloud(b.x, b.y - 26) + gloom(headAt('nijika').x - 8, headAt('nijika').y - 26) + gloom(headAt('ryo').x - 8, headAt('ryo').y - 28) + gloom(headAt('kita').x - 8, headAt('kita').y - 26)
  }
  after += lighting(phase, keepwarm)
  const lines = speechOf(phase, keepwarm, moment)
  after += lines.map(([m, t], i) => bubble(m, t, lines.length === 1 ? 'sp' : i === 0 ? 'sa' : 'sb')).join('')
  const open = svgDoc(SCENE_W, SCENE_H, '', SCENE_CSS).replace(/<\/svg>$/, '')
  const band = bandParts(phase, moment, keepwarm)
  // the room, the pot, what comes after the band, and each seat's clip around her
  const wraps = band.wraps.reduce((n, w) => n + (w === '' ? 0 : `<g ${w}></g>`.length), 0)
  const chrome = open.length + back.length + potStuff.length + after.length + '</svg>'.length + wraps
  const { markup } = fitBand(band.parts, band.wraps, potStuff, SVG_LIMIT - chrome - 64)
  const svg = capped(`${open}${back}${markup}${after}</svg>`, () => `${open}${back}${CRISP(potStuff)}${after}</svg>`)
  const drawn: SceneSvg = { svg, alt: '', height: SCENE_H }
  if (sceneMemo.size > 48) sceneMemo.clear()
  sceneMemo.set(key, drawn)
  return { ...drawn, alt: hotpotAlt(v) }
}

// ---- The terminal's table and pot ----------------------------------------------------------------------------

/** The terminal's picture: the minis at the pot's corners (Bocchi above Nijika at its left, Ryo above Kita at its right) over the table and the pot between them. */
export const CELLS_W = 70
export const CELLS_H = 34
const MINI_AT: Readonly<Record<Member, { x: number; y: number }>> = { bocchi: { x: 0, y: 0 }, nijika: { x: 0, y: 18 }, ryo: { x: 54, y: 0 }, kita: { x: 54, y: 18 } }

/**
 * The terminal's table and pot as a still backdrop under the minis: opaque
 * room cells (so the cold blue reads on a light terminal), the table in the
 * 38 pixels between the heads, the pot at its own size with its broth and
 * food by level, the flame while lit, the lid while nothing is cached; and
 * the minis by the phase's moods.
 */
export function hotpotCells(v: Pick<HotpotView, 'feast' | 'hotpot' | 'now'>): { under: (string | null)[]; parts: SpritePart[]; w: number; h: number } {
  const { phase, level } = drawnPhase(v)
  const p = pix(CELLS_W, CELLS_H)
  const cold = phase === 'cold' || phase === 'held'
  block(p, 0, 0, CELLS_W - 1, CELLS_H - 1, (_x, y) => (y < 9 ? (cold ? '#1d2436' : '#2a1a14') : cold ? '#26304a' : '#3a2a1c'))
  for (let y = 12; y < CELLS_H; y += 1) {
    const spread = Math.round((y - 12) * 0.25)
    for (let x = Math.max(16, 18 - spread); x <= Math.min(53, 51 + spread); x += 1) put(p, x, y, y === 12 ? '#c48c58' : y % 7 === 0 ? '#6a3e26' : '#7a4a2c')
  }
  const cx = 35
  for (let y = 18; y <= 25; y += 1) {
    const hw = Math.round(12 - Math.pow((y - 18) / 7, 1.6) * 4)
    for (let x = cx - hw; x < cx + hw; x += 1) put(p, x, y, y < 21 ? CREAM[1] : y === 25 ? GLAZE[3] : GLAZE[1])
  }
  if (phase === 'none' || phase === 'cleared' || phase === 'off') {
    oval(p, cx, 17, 11, 4.5, u => (u < -0.3 ? CREAM[0] : u < 0.5 ? CREAM[1] : CREAM[2]))
    block(p, cx - 1, 12, cx, 13, () => GLAZE[1])
  } else {
    const kind = phase === 'zosui' ? 'zosui' : cold ? 'cold' : 'warm'
    oval(p, cx, 18, 11, 3.6, () => POT_LINE)
    oval(p, cx, 18, 9.6, 2.8, (u, w) => {
      const n = speck(Math.round(u * 9), Math.round(w * 3), kind === 'cold' ? 3 : 5)
      return kind === 'cold' ? (n < 0.15 ? '#e6eef5' : '#7a6a54') : kind === 'zosui' ? (n < 0.3 ? '#fff4c8' : '#ead292') : '#cf8f34'
    })
    if (kind === 'warm') {
      const bits: readonly (readonly [number, number, string])[] = [[-6, 18, '#ea919a'], [5, 17, '#93c25e'], [-1, 19, '#fffdf6'], [3, 19, '#ef6a4a'], [-4, 17, '#7a4b2e']]
      for (const [dx, y, c] of bits.slice(0, level)) block(p, cx + dx, y, cx + dx + 1, y, () => c)
    }
    if (phase === 'zosui' || (isWarmPhase(phase) && level > 0)) for (let x = cx - 8; x <= cx + 8; x += 4) block(p, x, 26, x + 1, 27, (_x, y) => (y === 26 ? '#7fb6ff' : '#e8f3ff'))
  }
  if (cold) for (const [x, y] of [[20, 3], [31, 6], [44, 2], [50, 8], [25, 9], [38, 4]] as const) put(p, x, y, '#eef6ff')
  const moods = miniMoods(phase)
  const parts = (['bocchi', 'nijika', 'ryo', 'kita'] as const).map(m => ({ id: `${m}-${moods[m]}-mini`, x: MINI_AT[m].x, y: MINI_AT[m].y }))
  return { under: p.px, parts, w: CELLS_W, h: CELLS_H }
}

/** The kaomoji layout's faces, by the moods the minis would show. */
export function hotpotFaces(phase: FeastPhase): Record<Member, string> {
  const moods = miniMoods(phase)
  return { bocchi: MEMBERS.bocchi.faces[moods.bocchi], nijika: MEMBERS.nijika.faces[moods.nijika], ryo: MEMBERS.ryo.faces[moods.ryo], kita: MEMBERS.kita.faces[moods.kita] }
}

/** A pixel of the terminal's backdrop. */
export function cellAt(under: readonly (string | null)[], x: number, y: number): string | null {
  return pxAt({ w: CELLS_W, h: CELLS_H, px: under as (string | null)[] }, x, y)
}
