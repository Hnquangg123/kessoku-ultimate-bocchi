// Kessoku Ultimate Bocchi Theme: the ♨ Hotpot's arithmetic and drawing (hooks/lib/hotpot.ts), tested directly.
//
// The phase the strip, the chalkboard's foot, the rail and the pane share;
// when the next redraw is due; the ledger's booking and judging and its
// figures; the wooden board, the bill and the buttons' words; the scene's
// seats, sizes and memo. The hooks that write the state and draw the pane are
// tested in kessoku.test.ts.

import { expect, test } from 'claude-code/testing'

import type { KessokuHotpot, KessokuLedger } from '../types'
import {
  BOX_RAISE,
  FEAST_TOP,
  FEAST_WAIST,
  HEADBAND,
  HELD_PROMPT_MS,
  INITIAL_LEDGER,
  OVER_POT,
  SEAT_ORDER,
  SEAT_ROW,
  SEAT_SIDE,
  TABLE,
  bandParts,
  billRows,
  boardOf,
  bookActStep,
  bookFork,
  bookMainStep,
  bookSummary,
  drawnPhase,
  edgeL,
  edgeR,
  enginePriceOf,
  feastOf,
  fitBand,
  hitRate,
  hotpotAlt,
  hotpotButtons,
  hotpotCells,
  hotpotDue,
  hotpotLine,
  hotpotSvg,
  judgeStep,
  keepwarmUsd,
  minutesText,
  miniMoods,
  momentOf,
  newLedger,
  pingsADay,
  potGauge,
  railWords,
  reheatUsd,
  reorderUsd,
  savedUsd,
  seatAt,
  seatStates,
  speechOf,
  stripWords,
  topUpUsd,
  ttlInForce,
  ttlMark,
  warmthDue,
  writeRate,
} from '../hooks/lib/hotpot'
import type { HotpotView, MainStep, StepContext, StepUsage, TtlInForce } from '../hooks/lib/hotpot'
import { MEMBERS } from '../hooks/lib/palette'
import { SVG_LIMIT, animOf, fitSprites, framePixels, viewSize } from '../hooks/lib/sprite'
import type { SpritePart } from '../hooks/lib/sprite'

const MIN = 60_000
const HOUR = 60 * MIN
const NOW = 1_800_000_000_000
const OPUS = 'claude-opus-5-5'
const ASSUMED: TtlInForce = { ms: HOUR, how: 'assumed', sighting: 0 }
/** Two prices within half a unit of the given decimal place. */
const near = (got: number, want: number, digits = 6) => expect(Math.abs(got - want)).toBeLessThan(0.5 * 10 ** -digits)

const cacheAt = (ageMs: number, over: Partial<{ keepWarmUntil: number; contextTokens: number; model: string; heldAt: number }> = {}) => ({ lastWarmAt: ageMs < 0 ? 0 : NOW - ageMs, keepWarmUntil: 0, contextTokens: 168_000, model: OPUS, heldAt: 0, ...over })
const HOTPOT: KessokuHotpot = { isOpen: true, inBand: false, isBillOpen: false, pick: 0, armed: null, moment: null, note: null, sample: null }
const FLAGS = { noSnapshot: false, compacting: false, working: false, forkOut: false, compactOff: false, draftOff: false }

/** A view of the pane: a cache warmed `ageMs` ago (-1: nothing cached), the ledger P at 168k, a one-hour TTL assumed. */
function viewOf(ageMs: number, over: Partial<HotpotView> = {}, cacheOver: Parameters<typeof cacheAt>[1] = {}, flags: Parameters<typeof feastOf>[3] = {}): HotpotView {
  const cache = cacheAt(ageMs, cacheOver)
  const ttl = over.ttl ?? ASSUMED
  return {
    now: NOW,
    feast: feastOf(cache, NOW, ttl.ms, flags),
    cache,
    ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: true, steps: 3 },
    hotpot: HOTPOT,
    ttl,
    pick: 2 * HOUR,
    slip: null,
    flags: FLAGS,
    isTerminal: false,
    isFocused: true,
    ...over,
  }
}

const step = (u: Partial<StepUsage>, over: Partial<MainStep> = {}): MainStep => ({ usage: { input: 2000, output: 500, read: 0, write: 0, model: OPUS, ...u }, startedAt: NOW, index: 0, effort: 'high', serverTools: false, responded: true, now: NOW + 1000, ...over })
const ctxOf = (lastWarmAt: number, over: Partial<StepContext> = {}): StepContext => ({ lastWarmAt, ttl: ASSUMED, loadedAt: 0, context: 0, ...over })
/** A ledger after a warm step of 168k on Opus at `at`, as the mod saw it. */
const warmed = (at: number, over: Partial<KessokuLedger> = {}): KessokuLedger => ({ ...newLedger(0), prompt: 168_000, lastModel: OPUS, warmModel: OPUS, warmEffort: 'high', seenWarmAt: at, canFork: true, ...over })

// ---- the phase ----------------------------------------------------------------------------------------

test('the feast steps by the warmth left: more than 84 % and two thirds a feast, a third simmering, then running low, last orders, cold', async () => {
  const at = (age: number, ttl = HOUR, keep = 0) => feastOf(cacheAt(age, { keepWarmUntil: keep }), NOW, ttl)
  expect(at(0)).toMatchObject({ phase: 'feast', level: 5, leftMs: HOUR })
  expect(at(0.16 * HOUR - 1)).toMatchObject({ phase: 'feast', level: 5 })
  expect(at(0.16 * HOUR)).toMatchObject({ phase: 'feast', level: 4 })
  expect(at(HOUR / 3 - 1)).toMatchObject({ phase: 'feast', level: 4 })
  expect(at(HOUR / 3)).toMatchObject({ phase: 'simmer', level: 3 })
  expect(at((2 * HOUR) / 3 - 1).level).toBe(3)
  expect(at((2 * HOUR) / 3)).toMatchObject({ phase: 'low', level: 2 })
  // last orders: the cold notice's window, the last five minutes of an hour, half of five minutes
  expect(at(55 * MIN - 1)).toMatchObject({ phase: 'low', level: 2 })
  expect(at(55 * MIN)).toMatchObject({ phase: 'last', level: 1, leftMs: 5 * MIN })
  expect(at(2.5 * MIN - 1, 5 * MIN).phase).toBe('simmer')
  expect(at(2.5 * MIN, 5 * MIN)).toMatchObject({ phase: 'last', level: 1 })
  // cold means now - lastWarmAt >= TTL
  expect(at(HOUR - 1)).toMatchObject({ phase: 'last' })
  expect(at(HOUR)).toMatchObject({ phase: 'cold', level: 0, leftMs: 0 })
  expect(at(74 * MIN)).toMatchObject({ phase: 'cold', leftMs: -14 * MIN, ageMs: 74 * MIN })
  // keepwarm turns last orders into Nijika's
  expect(at(57 * MIN, HOUR, NOW + HOUR)).toMatchObject({ phase: 'tend', level: 1 })
  expect(at(70 * MIN, HOUR, NOW + HOUR).phase).toBe('cold')
  // nothing cached, cleared
  expect(feastOf(cacheAt(-1), NOW, HOUR)).toMatchObject({ phase: 'none', level: 0 })
  expect(feastOf(cacheAt(-1), NOW, HOUR, { cleared: true }).phase).toBe('cleared')
})

test('compacting, a held send and caching off win over the warmth, in that order', async () => {
  const c = cacheAt(70 * MIN)
  expect(feastOf(c, NOW, HOUR, { compacting: true, held: true, cachingOff: true })).toMatchObject({ phase: 'zosui', level: 5 })
  expect(feastOf(c, NOW, HOUR, { held: true, cachingOff: true })).toMatchObject({ phase: 'held', level: 0 })
  expect(feastOf(c, NOW, HOUR, { cachingOff: true, cleared: true })).toMatchObject({ phase: 'off', level: 0 })
  expect(feastOf(cacheAt(-1), NOW, HOUR, { cleared: true, cachingOff: true }).phase).toBe('off')
})

test('the strip, the foot and the rail read their words off the phase, in whole minutes', async () => {
  const words = (age: number, flags: Parameters<typeof feastOf>[3] = {}, keep = 0) => {
    const c = cacheAt(age, { keepWarmUntil: keep })
    const fe = feastOf(c, NOW, HOUR, flags)
    return [stripWords(fe, c, NOW), railWords(fe, c, NOW)]
  }
  expect(words(-1)).toEqual(['no cache yet', '○ no cache yet'])
  expect(words(-1, { cleared: true })).toEqual(['no cache yet', '○ no cache yet'])
  expect(words(-1, { cachingOff: true })).toEqual(['no cache here (caching off)', '○ caching off'])
  expect(words(12 * MIN)).toEqual(['warm, 48m left', '☀ warm 48m'])
  expect(words(12 * MIN, {}, NOW + 5 * HOUR + 12 * MIN)).toEqual(['kept warm, 5h 12m left', '● keepwarm 5h12m'])
  expect(words(57 * MIN)).toEqual(['last orders, cold in 3m', '☀ last orders 3m'])
  expect(words(72 * MIN)).toEqual(['cold for 12m', '❄ cold'])
  expect(words(72 * MIN, {}, NOW + HOUR)).toEqual(['cold for 12m · keepwarm on', '❄ cold · keepwarm on'])
  expect(words(72 * MIN, { held: true })).toEqual(['cold for 12m · a send is held', '❄ cold · held'])
  expect(words(12 * MIN, { compacting: true })).toEqual(['zosui (compacting)', '〆 zosui'])
  expect(minutesText(59_999)).toBe('under 1m')
  expect(minutesText(48 * MIN + 59_999)).toBe('48m')
  expect(minutesText(5 * HOUR)).toBe('5h')
})

// ---- when to redraw ----------------------------------------------------------------------------------

test('warmthDue is the next minute of the count, a level step, last orders, cold or keepwarm’s end; hotpotDue adds the moments, notes, presses, the hold and the next ping', async () => {
  // 12m 30s old at an hour: 47m 30s left, so the count drops to 47m in 30 s
  expect(warmthDue(cacheAt(12.5 * MIN), NOW, HOUR)).toBe(NOW + 30_000 + 1)
  // just before the level step at 16 % (9m 36s): the step comes first
  expect(warmthDue(cacheAt(9.5 * MIN), NOW, HOUR)).toBe(NOW + 6000)
  // the steps at a third and two thirds, and last orders: at an hour each sits on a minute of the count, a millisecond before it drops
  expect(warmthDue(cacheAt(20 * MIN - 10_000), NOW, HOUR)).toBe(NOW + 10_000)
  expect(warmthDue(cacheAt(40 * MIN - 10_000), NOW, HOUR)).toBe(NOW + 10_000)
  expect(warmthDue(cacheAt(55 * MIN - 500), NOW, HOUR)).toBe(NOW + 500)
  // off the count's minutes, well before it drops: a third of five minutes, two thirds of twenty, last orders at five (its last half)
  expect(warmthDue(cacheAt(90_000), NOW, 5 * MIN)).toBe(NOW + 10_000)
  expect(warmthDue(cacheAt(790_000), NOW, 20 * MIN)).toBe(NOW + 10_000)
  expect(warmthDue(cacheAt(140_000), NOW, 5 * MIN)).toBe(NOW + 10_000)
  // in the last minute the count says under 1m: the next change is cold
  expect(warmthDue(cacheAt(HOUR - 20_000), NOW, HOUR)).toBe(NOW + 20_000)
  // cold for 12m 10s: the count rises to 13m in 50 s
  expect(warmthDue(cacheAt(72 * MIN + 10_000), NOW, HOUR)).toBe(NOW + 50_000)
  // nothing cached and keepwarm off: nothing is due
  expect(warmthDue(cacheAt(-1), NOW, HOUR)).toBe(0)
  // keepwarm's own count and end; over a warm pot its end comes before the warmth's next minute
  expect(warmthDue(cacheAt(-1, { keepWarmUntil: NOW + 90_000 }), NOW, HOUR)).toBe(NOW + 30_000 + 1)
  expect(warmthDue(cacheAt(-1, { keepWarmUntil: NOW + 30_000 }), NOW, HOUR)).toBe(NOW + 30_000)
  expect(warmthDue(cacheAt(12.5 * MIN, { keepWarmUntil: NOW + 20_000 }), NOW, HOUR)).toBe(NOW + 20_000)
  const c = cacheAt(70 * MIN + 30_000)
  const h = (over: Partial<KessokuHotpot>) => ({ ...HOTPOT, ...over })
  expect(hotpotDue(c, h({}), NOW, HOUR)).toBe(NOW + 30_000)
  expect(hotpotDue(c, h({ moment: { kind: 'ping', until: NOW + 2400 } }), NOW, HOUR)).toBe(NOW + 2400)
  expect(hotpotDue(c, h({ note: { text: 'x', until: NOW + 6000 } }), NOW, HOUR)).toBe(NOW + 6000)
  expect(hotpotDue(c, h({ armed: { action: 'reheat', at: NOW - 4000 } }), NOW, HOUR)).toBe(NOW + 6000)
  expect(hotpotDue({ ...c, heldAt: NOW - HELD_PROMPT_MS + 5000 }, h({}), NOW, HOUR)).toBe(NOW + 5000)
  // keepwarm on, warm: the next ping (at TTL - 90 s) and its count, 6m 20s off, dropping to 5m before the warmth's and keepwarm's counts move
  expect(hotpotDue(cacheAt(58 * MIN + 10_000, { keepWarmUntil: NOW + 2 * HOUR + 50_000 }), h({}), NOW, HOUR)).toBe(NOW + 20_000)
  expect(hotpotDue(cacheAt(52 * MIN + 10_000, { keepWarmUntil: NOW + 2 * HOUR + 50_000 }), h({}), NOW, HOUR)).toBe(NOW + 20_001)
})

// ---- the TTL --------------------------------------------------------------------------------------------

test('the TTL in force: the option when set (not 60, 0, empty or negative), else what the engine or the evidence taught, else the hour assumed', async () => {
  const learned = { ttl: { ms: 5 * MIN, how: 'seen' as const }, sighting: 0 }
  expect(ttlInForce(30, learned)).toEqual({ ms: 30 * MIN, how: 'option', sighting: 0 })
  for (const m of [60, 0, -5, Number.NaN]) expect(ttlInForce(m, learned)).toEqual({ ms: 5 * MIN, how: 'seen', sighting: 0 })
  expect(ttlInForce(0, INITIAL_LEDGER)).toEqual({ ms: HOUR, how: 'assumed', sighting: 0 })
  expect(ttlMark({ ms: HOUR, how: 'assumed', sighting: 0 })).toBe('TTL 1h?')
  expect(ttlMark({ ms: HOUR, how: 'assumed', sighting: NOW })).toBe('TTL 5m?')
  expect(ttlMark({ ms: HOUR, how: 'seen', sighting: 0 })).toBe('')
  expect(ttlMark({ ms: 5 * MIN, how: 'engine', sighting: 0 })).toBe('')
  expect(writeRate(HOUR)).toBe(2)
  expect(writeRate(5 * MIN)).toBe(1.25)
})

// ---- the ledger -----------------------------------------------------------------------------------------

test('a main-loop step is judged against P: warm, cold, cacheless or partial; one that ran server tools is booked, not judged, and leaves P alone', async () => {
  expect(judgeStep({ input: 10, read: 0.9 * 168_000, write: 0 }, 168_000)).toBe('warm')
  expect(judgeStep({ input: 10, read: 0.49 * 168_000, write: 0.5 * 168_000 }, 168_000)).toBe('cold')
  expect(judgeStep({ input: 10, read: 0, write: 0 }, 168_000)).toBe('cacheless')
  expect(judgeStep({ input: 10, read: 0.6 * 168_000, write: 0.3 * 168_000 }, 168_000)).toBe('partial')
  const l = warmed(NOW - 2 * MIN)
  const warm = bookMainStep(l, step({ read: 170_000, write: 3000 }), ctxOf(NOW - 2 * MIN))
  expect(warm.kind).toBe('warm')
  expect(warm.warmAt).toBe(NOW)
  expect(warm.ledger).toMatchObject({ prompt: 175_000, lastOutput: 500, steps: 1, cacheRead: 170_000, cacheWrite: 3000, turnSteps: 1, seenWarmAt: NOW })
  expect(warm.ledger.members.bocchi).toEqual({ read: 170_000, write: 3000, input: 2000 })
  const server = bookMainStep(l, step({ read: 400_000, write: 9000 }, { serverTools: true }), ctxOf(NOW - 2 * MIN))
  expect(server.kind).toBe('unjudged')
  expect(server.ledger.prompt).toBe(168_000)
  expect(server.ledger.steps).toBe(1)
  // a step refused before any chunk leaves the warmth where it was; one cut mid-answer still counts
  expect(bookMainStep(l, { ...step({}), usage: null, responded: false }, ctxOf(NOW - 2 * MIN)).warmAt).toBeNull()
  expect(bookMainStep(l, { ...step({}), usage: null, responded: true }, ctxOf(NOW - 2 * MIN)).warmAt).toBe(NOW)
  // one that read and wrote no cache does not warm it
  expect(bookMainStep(l, step({ read: 0, write: 0 }), ctxOf(NOW - 2 * MIN)).warmAt).toBeNull()
})

test('Cache Tax is booked from a cold step a TTL after the warmth (five minutes while assumed): mid-turn, silent, or a person’s paid re-order', async () => {
  const l = warmed(NOW - 70 * MIN, { isPersonTurn: true })
  const paid = bookMainStep(l, step({ read: 0, write: 170_000 }), ctxOf(NOW - 70 * MIN))
  expect(paid.tax).toMatchObject({ tokens: 168_000, silent: false, midTurn: false })
  near(paid.tax?.usd ?? 0, 168_000 * 8 / 1e6, 6)
  expect(paid.ledger.tax).toMatchObject({ count: 1, silent: 0, midTurn: 0, tokens: 168_000 })
  near(paid.ledger.tax.warmUsd, 168_000 * 0.2 / 1e6, 6)
  const silent = bookMainStep({ ...l, isPersonTurn: false }, step({ read: 0, write: 170_000 }), ctxOf(NOW - 70 * MIN))
  expect(silent.ledger.tax).toMatchObject({ count: 1, silent: 1, midTurn: 0 })
  const mid = bookMainStep(l, step({ read: 0, write: 170_000 }, { index: 3 }), ctxOf(NOW - 70 * MIN))
  expect(mid.ledger.tax).toMatchObject({ count: 1, silent: 0, midTurn: 1 })
  // assumed hour: six minutes is enough, the step's own write being the proof; a learned hour needs the hour
  expect(bookMainStep(l, step({ read: 0, write: 170_000 }), ctxOf(NOW - 6 * MIN)).tax).not.toBeNull()
  expect(bookMainStep(l, step({ read: 0, write: 170_000 }), ctxOf(NOW - 6 * MIN, { ttl: { ms: HOUR, how: 'seen', sighting: 0 } })).tax).toBeNull()
  // a partial step pays the shortfall, at most its write
  const partial = bookMainStep(l, step({ read: 100_000, write: 40_000 }), ctxOf(NOW - 70 * MIN))
  expect(partial.tax?.tokens).toBe(40_000)
  // nothing cached, a warm step, or a step taken as a switch: no tax
  expect(bookMainStep(l, step({ read: 0, write: 170_000 }), ctxOf(0)).tax).toBeNull()
  expect(bookMainStep(l, step({ read: 168_000, write: 100 }), ctxOf(NOW - 70 * MIN)).tax).toBeNull()
  expect(bookMainStep(l, step({ read: 0, write: 170_000, model: 'claude-sonnet-5-5' }), ctxOf(NOW - 70 * MIN)).tax).toBeNull()
})

test('while P is unset (a resumed session before its first step) the context stands in for it: a cold step pays its tax and a fork warms against it', async () => {
  // a fresh book, P unset, over the warmth and the context a resume's classic.SessionStart gave, two hours old
  const l: KessokuLedger = { ...newLedger(NOW - 2 * HOUR), isPersonTurn: true }
  const first = bookMainStep(l, step({ read: 0, write: 170_000 }), ctxOf(NOW - 2 * HOUR, { context: 168_000 }))
  expect(first.kind).toBe('cold')
  expect(first.tax).toMatchObject({ tokens: 168_000, silent: false, midTurn: false })
  expect(first.ledger.tax).toMatchObject({ count: 1, tokens: 168_000 })
  // the step sets P for the next; a warm step ten minutes after a warmth the mod never saw teaches nothing
  expect(first.ledger.prompt).toBe(172_000)
  expect(bookMainStep(l, step({ read: 168_000, write: 1000 }), ctxOf(NOW - 10 * MIN, { context: 168_000 })).taught).toBeNull()
  // once set, P is the ledger's, whatever the context says
  expect(bookMainStep(warmed(NOW - 70 * MIN), step({ read: 0, write: 170_000 }), ctxOf(NOW - 70 * MIN, { context: 180_000 })).tax?.tokens).toBe(168_000)
  // a re-heat that re-wrote the context warms the pot; a top-up that did is a miss, and warms it too
  const fork = (kind: 'topup' | 'reheat') => bookFork(newLedger(NOW - 2 * HOUR), { kind, usage: { input: 30, output: 8, read: 0, write: 168_000 }, calledAt: NOW, gateOpen: true, model: OPUS }, { lastWarmAt: NOW - 2 * HOUR, loadedAt: 0, ttlMs: HOUR, context: 168_000 })
  expect(fork('reheat').warmAt).toBe(NOW)
  expect(fork('topup')).toMatchObject({ warmAt: NOW, miss: true })
  // once set, P is the ledger's for a fork too: a read of P warms, though the context says more
  expect(bookFork(warmed(NOW - 58 * MIN), { kind: 'ping', usage: { input: 30, output: 8, read: 168_000, write: 0 }, calledAt: NOW, gateOpen: true, model: OPUS }, { lastWarmAt: NOW - 58 * MIN, loadedAt: 0, ttlMs: HOUR, context: 300_000 }).warmAt).toBe(NOW)
})

test('a step on another model that no switch reported is a new pot: its first write, no tax or evidence, the engine price dropped, the fork gate shut', async () => {
  const l = warmed(NOW - 10 * MIN, { engine: { perToken: 1e-5, model: OPUS } })
  const o = bookMainStep(l, step({ read: 0, write: 170_000, model: 'claude-sonnet-5-5' }), ctxOf(NOW - 10 * MIN))
  expect(o).toMatchObject({ isSwitch: true, kind: 'unjudged', tax: null, taught: null, warmAt: NOW })
  expect(o.ledger).toMatchObject({ engine: null, canFork: false, lastModel: 'claude-sonnet-5-5' })
  // a reported switch since the last step: the next step on the new model is not taken as one
  expect(bookMainStep({ ...l, switched: true }, step({ read: 0, write: 170_000, model: 'claude-sonnet-5-5' }), ctxOf(NOW - 10 * MIN)).isSwitch).toBe(false)
})

test('the TTL is learned from what the steps show: a warm step after 6 minutes teaches an hour, two cold sightings five minutes', async () => {
  // one hour: read 90 % of P and wrote under half, more than 5.5 minutes after a warmth the mod saw
  const hour = bookMainStep(warmed(NOW - 6 * MIN), step({ read: 168_000, write: 1000 }), ctxOf(NOW - 6 * MIN))
  expect(hour.taught).toBe('1h')
  expect(hour.ledger.ttl).toEqual({ ms: HOUR, how: 'seen' })
  // with server tools: nothing
  expect(bookMainStep(warmed(NOW - 6 * MIN), step({ read: 168_000, write: 1000 }, { serverTools: true }), ctxOf(NOW - 6 * MIN)).taught).toBeNull()
  // five minutes: a cold step after 10 minutes on the same model and effort is a sighting (TTL 5m?), a second settles it
  const first = bookMainStep(warmed(NOW - 10 * MIN), step({ read: 0, write: 170_000 }), ctxOf(NOW - 10 * MIN))
  expect(first.taught).toBe('sighting')
  expect(first.ledger.sighting).toBe(NOW)
  expect(first.ledger.ttl.how).toBe('assumed')
  const second = bookMainStep({ ...first.ledger, seenWarmAt: NOW + 1000 }, step({ read: 0, write: 170_000 }, { startedAt: NOW + 11 * MIN }), ctxOf(NOW + 1000))
  expect(second.taught).toBe('5m')
  expect(second.ledger).toMatchObject({ ttl: { ms: 5 * MIN, how: 'seen' }, sighting: 0 })
  // one-hour evidence between them clears the first
  const cleared = bookMainStep({ ...first.ledger, seenWarmAt: NOW + 1000 }, step({ read: 170_000, write: 100 }, { startedAt: NOW + 8 * MIN }), ctxOf(NOW + 1000))
  expect(cleared.ledger).toMatchObject({ ttl: { ms: HOUR, how: 'seen' }, sighting: 0 })
  // a sighting needs the same model and effort, no reload in the gap, and a warmth the mod saw (never a resume's)
  expect(bookMainStep(warmed(NOW - 10 * MIN), step({ read: 0, write: 170_000 }, { effort: 'low' }), ctxOf(NOW - 10 * MIN)).taught).toBeNull()
  expect(bookMainStep(warmed(NOW - 10 * MIN), step({ read: 0, write: 170_000 }), ctxOf(NOW - 10 * MIN, { loadedAt: NOW - 5 * MIN })).taught).toBeNull()
  expect(bookMainStep(warmed(NOW - 10 * MIN, { seenWarmAt: 0 }), step({ read: 0, write: 170_000 }), ctxOf(NOW - 10 * MIN)).taught).toBeNull()
  // while the engine has spoken, no evidence
  expect(bookMainStep(warmed(NOW - 6 * MIN, { ttl: { ms: 5 * MIN, how: 'engine' } }), step({ read: 168_000, write: 1000 }), ctxOf(NOW - 6 * MIN)).taught).toBeNull()
})

test('a five-minute TTL once settled stays so: a cold step or a missed top-up after it records no sighting, and the board marks a sighting only of a longer TTL', async () => {
  const five = { ms: 5 * MIN, how: 'seen' as const }
  const l = warmed(NOW - 10 * MIN, { ttl: five })
  // a cold return 10 minutes after a warmth the mod saw, on the same model and effort: five minutes' evidence, which it already is
  const cold = bookMainStep(l, step({ read: 0, write: 170_000 }), ctxOf(NOW - 10 * MIN, { ttl: { ...five, sighting: 0 } }))
  expect(cold.taught).toBeNull()
  expect(cold.ledger).toMatchObject({ ttl: five, sighting: 0 })
  // a top-up that found it cold, the same
  const miss = bookFork(l, { kind: 'topup', usage: { input: 30, output: 8, read: 0, write: 168_000 }, calledAt: NOW, gateOpen: true, model: OPUS }, { lastWarmAt: NOW - 10 * MIN, loadedAt: 0, ttlMs: 5 * MIN, context: 0 })
  expect(miss).toMatchObject({ miss: true, taught: null })
  expect(miss.ledger.sighting).toBe(0)
  // a sighting is news only against a longer TTL
  expect(ttlMark({ ms: 5 * MIN, how: 'seen', sighting: NOW })).toBe('')
  expect(ttlMark({ ms: HOUR, how: 'seen', sighting: NOW })).toBe('TTL 5m?')
})

test('three cacheless main-loop steps in a row turn caching off; a cached step ends the run', async () => {
  let l = warmed(NOW)
  for (let i = 0; i < 3; i += 1) l = bookMainStep(l, step({ read: 0, write: 0 }), ctxOf(NOW)).ledger
  expect(l.cacheless).toBe(3)
  l = bookMainStep(l, step({ read: 10, write: 0 }), ctxOf(NOW)).ledger
  expect(l.cacheless).toBe(0)
})

test('a seated act’s step is booked to her member; a fork books a ping, a miss or a re-heat and warms only as judged', async () => {
  const act = bookActStep(warmed(NOW), 'ryo', { input: 100, output: 50, read: 20_000, write: 1000, model: 'claude-sonnet-5-5' })
  expect(act.members.ryo).toEqual({ read: 20_000, write: 1000, input: 100 })
  expect(act.steps).toBe(1)
  expect(act.prompt).toBe(168_000)
  const l = warmed(NOW - 58 * MIN)
  const ctx = { lastWarmAt: NOW - 58 * MIN, loadedAt: 0, ttlMs: HOUR, context: 0 }
  const ping = bookFork(l, { kind: 'ping', usage: { input: 30, output: 8, read: 168_000, write: 0 }, calledAt: NOW, gateOpen: true, model: OPUS }, ctx)
  expect(ping).toMatchObject({ warmAt: NOW, miss: false })
  expect(ping.ledger.pings).toMatchObject({ count: 1, misses: 0 })
  near(ping.usd, topUpUsd(168_000, OPUS), 6)
  const miss = bookFork(l, { kind: 'topup', usage: { input: 30, output: 8, read: 0, write: 168_000 }, calledAt: NOW, gateOpen: true, model: OPUS }, ctx)
  expect(miss).toMatchObject({ warmAt: NOW, miss: true })
  expect(miss.ledger.pings.misses).toBe(1)
  // a fork that read and wrote too little warms nothing; one that landed after the gate shut changes nothing else
  expect(bookFork(l, { kind: 'reheat', usage: { input: 30, output: 8, read: 10, write: 10 }, calledAt: NOW, gateOpen: true, model: OPUS }, ctx).warmAt).toBeNull()
  const shut = bookFork(l, { kind: 'reheat', usage: { input: 30, output: 8, read: 0, write: 168_000 }, calledAt: NOW, gateOpen: false, model: OPUS }, ctx)
  expect(shut.warmAt).toBeNull()
  expect(shut.ledger.reheats.count).toBe(1)
  expect(shut.taught).toBeNull()
  // never back: a fork called before the last warmth leaves it
  expect(bookFork(warmed(NOW + 5000), { kind: 'ping', usage: { input: 30, output: 8, read: 168_000, write: 0 }, calledAt: NOW, gateOpen: true, model: OPUS }, { ...ctx, lastWarmAt: NOW + 5000 }).warmAt).toBe(NOW + 5000)
  const summary = bookSummary(l, { input: 168_000, output: 4000, read: 0, write: 0 }, OPUS)
  expect(summary.summarizer.count).toBe(1)
  near(summary.summarizer.usd, (168_000 * 4 + 4000 * 20) / 1e6, 6)
})

test('the engine’s price per token is taken from a catalog switch with tokens to price, never at 0, at another pricing or on a resume', async () => {
  const sw = { source: 'command', context_tokens: 300_000, estimated_cache_write_usd: 1.5, pricing: 'catalog', to_model: OPUS }
  expect(enginePriceOf(sw)).toEqual({ perToken: 1.5 / 300_000, model: OPUS })
  expect(enginePriceOf({ ...sw, context_tokens: 0 })).toBeNull()
  expect(enginePriceOf({ ...sw, pricing: 'configured' })).toBeNull()
  expect(enginePriceOf({ ...sw, pricing: 'default' })).toBeNull()
  expect(enginePriceOf({ ...sw, source: 'resume' })).toBeNull()
  const engine = enginePriceOf(sw)
  near(reorderUsd(200_000, OPUS, engine, HOUR), 1.0, 6)
  // another model, or no estimate: the TTL's list write rate
  near(reorderUsd(200_000, 'claude-sonnet-5-5', engine, HOUR), 200_000 * 4 / 1e6, 6)
  near(reorderUsd(200_000, OPUS, null, 5 * MIN), 200_000 * 5 / 1e6, 6)
})

test('the figures: hit rate, the saving (negative early), writes at the TTL’s rate, a top-up and a re-heat from P, a day of keepwarm', async () => {
  const l: KessokuLedger = { ...warmed(NOW), input: 0, cacheRead: 1_320_000, cacheWrite: 226_000, cacheReadUsd: 0.264, cacheReadBase: 5.28, cacheWriteBase: 0.904, pings: { count: 3, misses: 0, usd: 0.1, writeBase: 0 }, reheats: { count: 1, usd: 1.34, writeBase: 0 } }
  near(hitRate(l) ?? 0, 1_320_000 / 1_546_000, 6)
  expect(hitRate(INITIAL_LEDGER)).toBeNull()
  near(savedUsd(l, HOUR), 2.672, 3)
  // the writes re-priced once the TTL is learned to be five minutes
  near(savedUsd(l, 5 * MIN), 5.016 - 0.904 * 0.25 - 1.44, 3)
  expect(savedUsd({ ...l, cacheRead: 0, cacheReadUsd: 0, cacheReadBase: 0 }, HOUR)).toBeLessThan(0)
  near(topUpUsd(168_000, OPUS), 0.03388, 5)
  near(reheatUsd(168_000, OPUS, null, HOUR), 168_000 * 8 / 1e6 + 0.00028, 5)
  near(pingsADay(HOUR), 1440 / 59, 6)
  expect(pingsADay(5 * MIN)).toBe(360)
  near(pingsADay(HOUR) * topUpUsd(168_000, OPUS), 0.827, 3)
  near(keepwarmUsd(2 * HOUR, HOUR, topUpUsd(168_000, OPUS)), 0.0689, 4)
})

// ---- what the pane says ---------------------------------------------------------------------------------

test('the wooden board in every phase: the state in a word and its tail, then the context and its prices, the TTL’s mark while unsettled', async () => {
  const board = (v: HotpotView) => [boardOf(v).word, boardOf(v).tail]
  expect(board(viewOf(9 * MIN))).toEqual(['♨ Bubbling', '51m of feast left'])
  expect(board(viewOf(30 * MIN))).toEqual(['Simmering', '30m of feast left'])
  expect(board(viewOf(45 * MIN))).toEqual(['Running low', '15m of feast left'])
  expect(board(viewOf(57 * MIN))).toEqual(['Last orders!', 'cold in 3m'])
  expect(board(viewOf(56 * MIN, {}, { keepWarmUntil: NOW + HOUR }))).toEqual(['Nijika has the pot', 'she tops it up in 2m'])
  expect(board(viewOf(74 * MIN))).toEqual(['❄ Gone cold', '14m ago: the next send re-orders everything'])
  expect(board(viewOf(74 * MIN, { slip: { writeUsd: 1.34, warmUsd: 0.03, tokens: 168_000, ageMs: 14 * MIN } }, {}, { held: true }))).toEqual(['The bill came', 'your prompt waits: re-ordering costs ≈$1.34'])
  expect(board(viewOf(9 * MIN, {}, {}, { compacting: true }))).toEqual(['〆 Zosui', 'compacting 168k tokens'])
  expect(board(viewOf(-1))).toEqual(['The table is set', 'the first order warms the pot'])
  expect(board(viewOf(-1, {}, {}, { cleared: true }))).toEqual(['A fresh table', 'nothing cached yet: the next prompt is the first order'])
  expect(board(viewOf(-1, {}, {}, { cachingOff: true }))).toEqual(['No cache here', 'prompt caching is off'])
  // a note stands in for the tail for its 6 s
  expect(boardOf(viewOf(9 * MIN, { hotpot: { ...HOTPOT, note: { text: '168k → 40k tokens', until: NOW + 1 } } })).tail).toBe('168k → 40k tokens')
  expect(boardOf(viewOf(9 * MIN)).line).toBe('168k on the table · a re-order ≈$1.34 · a top-up ≈$0.03 · a day of keepwarm ≈$0.83 · keepwarm off · TTL 1h?')
  expect(boardOf(viewOf(9 * MIN, { ttl: { ms: HOUR, how: 'assumed', sighting: NOW } })).line).toMatch(/ · TTL 5m\?$/)
  expect(boardOf(viewOf(9 * MIN, { ttl: { ms: HOUR, how: 'engine', sighting: 0 } })).line).not.toMatch(/TTL/)
  const kept = viewOf(9 * MIN, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: true, steps: 3, pings: { count: 3, misses: 0, usd: 0.1, writeBase: 0 } } }, { keepWarmUntil: NOW + 5 * HOUR + 12 * MIN })
  expect(boardOf(kept).line).toMatch(/ · keepwarm 5h12m · 3 pings ≈\$0\.10 · TTL 1h\?$/)
  // a dim button's reason, and the terminal's hint while the pane does not hold the keys
  expect(boardOf(viewOf(9 * MIN, { flags: { ...FLAGS, working: true } })).line).toMatch(/ · a turn is running$/)
  expect(boardOf(viewOf(9 * MIN, { isTerminal: true, isFocused: false })).line).toMatch(/ · ctrl\+x tab for its keys$/)
  expect(boardOf(viewOf(74 * MIN, { slip: { writeUsd: 1.34, warmUsd: 0.03, tokens: 168_000, ageMs: 0 } }, {}, { held: true })).line).toBe('your prompt is back in the box: Enter pays and sends it, Start fresh puts /clear in its place')
  // the second line in the other phases: the figures, then the reason a dim button gives (compacting, nothing cached, the gate, caching off)
  const figures = '168k on the table · a re-order ≈$1.34 · a top-up ≈$0.03 · a day of keepwarm ≈$0.83'
  for (const age of [30 * MIN, 45 * MIN, 57 * MIN, 74 * MIN]) expect(boardOf(viewOf(age)).line).toBe(`${figures} · keepwarm off · TTL 1h?`)
  expect(boardOf(viewOf(56 * MIN, {}, { keepWarmUntil: NOW + HOUR })).line).toBe(`${figures} · keepwarm 1h · no pings yet · TTL 1h?`)
  expect(boardOf(viewOf(9 * MIN, { flags: { ...FLAGS, compacting: true } }, {}, { compacting: true })).line).toBe(`${figures} · keepwarm off · TTL 1h? · compacting`)
  expect(boardOf(viewOf(-1)).line).toBe(`${figures} · keepwarm off · TTL 1h? · nothing cached yet`)
  expect(boardOf(viewOf(-1, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: false, cleared: true } }, {}, { cleared: true })).line).toBe(`${figures} · keepwarm off · TTL 1h? · the table was cleared`)
  expect(boardOf(viewOf(-1, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: true, steps: 3, cacheless: 3 } }, {}, { cachingOff: true })).line).toBe(`${figures} · keepwarm off · TTL 1h? · prompt caching is off`)
  expect(hotpotLine(viewOf(9 * MIN))).toBe('♨ Hotpot · bubbling, 51m of feast left · 168k on the table · a re-order ≈$1.34 · a top-up ≈$0.03 · a day of keepwarm ≈$0.83 · keepwarm off · TTL 1h?')
  expect(hotpotAlt(viewOf(9 * MIN))).toBe("the band's hotpot · bubbling, 51m left")
  expect(hotpotAlt(viewOf(57 * MIN))).toBe("the band's hotpot · last orders, cold in 3m")
  expect(hotpotAlt(viewOf(72 * MIN))).toBe("the band's hotpot · cold for 12m")
  expect(hotpotAlt(viewOf(74 * MIN, { slip: { writeUsd: 1.34, warmUsd: 0.03, tokens: 168_000, ageMs: 14 * MIN } }, {}, { held: true }))).toBe("the band's hotpot · the bill: re-order ≈$1.34")
  expect(hotpotAlt(viewOf(-1))).toBe("the band's hotpot · the table is set")
  expect(hotpotAlt(viewOf(9 * MIN, {}, {}, { compacting: true }))).toBe("the band's hotpot · zosui")
})

test('the buttons say their prices and what is armed, and a dim one names why, in its order of reasons', async () => {
  const keys = (v: HotpotView) => hotpotButtons(v).map(b => `${b.key}:${b.label}${b.reason === '' ? '' : ` [${b.reason}]`}`)
  expect(keys(viewOf(9 * MIN))).toEqual([
    'hotpot-keep:Keep the fire on · 2h ≈$0.07',
    'hotpot-pick-30m:30m',
    'hotpot-pick-1h:1h',
    'hotpot-pick-2h:2h',
    'hotpot-pick-6h:6h',
    'hotpot-topup:Top up now ≈$0.03 (≈$0.84 if the cache lives 5m)',
    'hotpot-zosui:Zosui (compact) · the next send writes the smaller pot',
    'hotpot-clear:Clear the table (/clear) · the next send writes a fresh pot',
    'hotpot-bill:The bill',
    'hotpot-close:Close',
  ])
  expect(keys(viewOf(4 * MIN))[5]).toBe('hotpot-topup:Top up now ≈$0.03')
  expect(keys(viewOf(9 * MIN, {}, { keepWarmUntil: NOW + HOUR }))[0]).toBe('hotpot-keep:Let it cool (keepwarm off)')
  expect(keys(viewOf(9 * MIN, {}, { keepWarmUntil: NOW + HOUR })).find(k => k.startsWith('hotpot-clear'))).toBe('hotpot-clear:Clear the table (/clear) · the next send writes a fresh pot · keepwarm stays on')
  expect(keys(viewOf(74 * MIN))[5]).toBe('hotpot-topup:Re-heat now ≈$1.34')
  expect(keys(viewOf(74 * MIN, { hotpot: { ...HOTPOT, armed: { action: 'reheat', at: NOW - 1000 } } }))[5]).toBe('hotpot-topup:Press again: re-write ≈$1.34')
  expect(keys(viewOf(9 * MIN, { hotpot: { ...HOTPOT, armed: { action: 'zosui', at: NOW - 1000 } } }))[6]).toBe('hotpot-zosui:Press again: compact 168k tokens · one summarizing request')
  expect(keys(viewOf(9 * MIN, { hotpot: { ...HOTPOT, armed: { action: 'clear', at: NOW - 1000 } } }))[7]).toBe('hotpot-clear:Press again: your draft gives way to /clear')
  // the armed window is ten seconds
  expect(keys(viewOf(74 * MIN, { hotpot: { ...HOTPOT, armed: { action: 'reheat', at: NOW - 10_000 } } }))[5]).toBe('hotpot-topup:Re-heat now ≈$1.34')
  const reason = (v: HotpotView) => hotpotButtons(v).find(b => b.key === 'hotpot-topup')?.reason
  expect(reason(viewOf(9 * MIN, { flags: { ...FLAGS, noSnapshot: true, working: true } }))).toBe('this host keeps no snapshot to fork')
  expect(reason(viewOf(9 * MIN, { flags: { ...FLAGS, compacting: true, working: true } }))).toBe('compacting')
  expect(reason(viewOf(9 * MIN, { flags: { ...FLAGS, forkOut: true } }))).toBe('a top-up is on its way')
  expect(reason(viewOf(9 * MIN, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: false, cleared: true } }))).toBe('the table was cleared')
  expect(reason(viewOf(9 * MIN, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: false, steps: 4 } }))).toBe('nothing to top up until the next turn ends')
  expect(reason(viewOf(9 * MIN, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: false } }))).toBe('nothing to top up yet: the first turn has not ended')
  expect(reason(viewOf(9 * MIN, {}, { contextTokens: 800 }))).toBe('under 1k tokens')
  const off = viewOf(9 * MIN, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, canFork: true, cacheless: 3 } })
  expect(hotpotButtons(off).filter(b => b.reason === 'prompt caching is off').map(b => b.key)).toEqual(['hotpot-keep', 'hotpot-topup'])
  expect(hotpotButtons(viewOf(9 * MIN, { flags: { ...FLAGS, compactOff: true } })).find(b => b.key === 'hotpot-zosui')?.reason).toBe('needs a newer Claude Code')
  // during a hold: the Cache Tax card's three, then the bill and close
  const held = viewOf(74 * MIN, { slip: { writeUsd: 1.34, warmUsd: 0.03, tokens: 168_000, ageMs: 0 } }, {}, { held: true })
  expect(keys(held)).toEqual(['hotpot-tax-keep:Keep it warm after (2h) ≈$0.07', 'hotpot-tax-clear:Start fresh (/clear)', 'hotpot-tax-dismiss:Dismiss', 'hotpot-bill:The bill', 'hotpot-close:Close'])
})

test('the bill: reads, writes and the tax among them, pings, re-heats, compaction, the saving, the hit rate by member, a re-order, a day of keepwarm', async () => {
  const ledger: KessokuLedger = {
    ...INITIAL_LEDGER,
    prompt: 168_000,
    input: 0,
    cacheRead: 1_320_000,
    cacheWrite: 226_000,
    cacheReadUsd: 0.264,
    cacheReadBase: 5.28,
    cacheWriteBase: 0.904,
    tax: { count: 1, silent: 1, midTurn: 0, tokens: 110_000, base: 0.44, warmUsd: 0.022 },
    pings: { count: 3, misses: 1, usd: 0.1, writeBase: 0 },
    reheats: { count: 1, usd: 1.34, writeBase: 0 },
    summarizer: { count: 1, usd: 0.14, writeBase: 0 },
    members: { bocchi: { read: 880, write: 100, input: 20 }, nijika: { read: 71, write: 29, input: 0 }, ryo: { read: 0, write: 0, input: 0 }, kita: { read: 64, write: 36, input: 0 } },
  }
  const bill = billRows(viewOf(9 * MIN, { ledger }))
  expect(bill.title).toBe("お会計 · this conversation's cache")
  expect(bill.foot).toBe('cost ≈ list prices × tokens, not your bill')
  expect(bill.rows.map(r => [r.label, r.detail, r.figure])).toEqual([
    ['Read from cache', '1.3M × $0.20/M', '$0.26'],
    ['Written to cache', '226k × $8.00/M', '$1.81'],
    ['of which Cache Tax', '1 cold re-write · 1 silent (a background report)', '$0.88'],
    ['Keepwarm', '3 pings · 1 found it cold', '$0.10'],
    ['Re-heats', '1', '$1.34'],
    ['Compaction', '1 zosui', '$0.14'],
    ['Saved by the cache', 'vs. sending it all uncached', '$2.67'],
    ['Hit rate', 'read ÷ everything the steps sent', '85%'],
    ['By member', 'Bocchi 88% · Nijika 71% · Kita 64%', ''],
    ['If it goes cold', 're-order 168k', '$1.34'],
    ['A day of keepwarm', '≈24 pings at a 1h TTL, assumed · ≈$12.2 if it lives 5m', '$0.83'],
  ])
  expect(bill.rows.find(r => r.label === 'Saved by the cache')?.tone).toBe('good')
  // nothing to say: no pings, no re-heats, no compaction, no members; a negative saving in red; a learned TTL names no 5m price
  const bare = billRows(viewOf(9 * MIN, { ledger: { ...INITIAL_LEDGER, prompt: 168_000, cacheWrite: 100_000, cacheWriteBase: 0.4 }, ttl: { ms: HOUR, how: 'seen', sighting: 0 } }))
  expect(bare.rows.map(r => r.label)).toEqual(['Read from cache', 'Written to cache', 'of which Cache Tax', 'Saved by the cache', 'Hit rate', 'If it goes cold', 'A day of keepwarm'])
  expect(bare.rows.find(r => r.label === 'Saved by the cache')).toMatchObject({ figure: 'cost $0.40 more', tone: 'bad' })
  expect(bare.rows.find(r => r.label === 'of which Cache Tax')?.detail).toBe('no cold re-writes')
  expect(bare.rows.find(r => r.label === 'A day of keepwarm')?.detail).toBe('≈24 pings at a 1h TTL')
})

test('who plays what, the terminal’s heads, the kaomoji gauge and the speech, by phase and moment', async () => {
  expect(seatStates('feast', null)).toEqual({ bocchi: 'eat', nijika: 'eat', ryo: 'eat', kita: 'eat' })
  expect(seatStates('zosui', null).ryo).toBe('eat')
  expect(seatStates('simmer', null).kita).toBe('calm')
  expect(seatStates('tend', null).nijika).toBe('calm')
  expect(seatStates('last', null).ryo).toBe('worry')
  expect(seatStates('cold', null)).toEqual({ bocchi: 'box', nijika: 'cold', ryo: 'cold', kita: 'cold' })
  expect(seatStates('held', null).bocchi).toBe('shock')
  expect(seatStates('none', null).kita).toBe('wait')
  expect(seatStates('feast', { kind: 'ping', until: NOW }).nijika).toBe('serve')
  expect(miniMoods('feast').bocchi).toBe('happy')
  expect(miniMoods('tend')).toEqual({ bocchi: 'focused', nijika: 'happy', ryo: 'focused', kita: 'focused' })
  expect(miniMoods('cold')).toEqual({ bocchi: 'hiding', nijika: 'melting', ryo: 'anxious', kita: 'melting' })
  expect(miniMoods('held').kita).toBe('panic')
  expect(miniMoods('off').nijika).toBe('focused')
  expect(potGauge('feast', 3)).toBe('♨ ▰▰▰▱▱')
  expect(potGauge('cold', 0)).toBe('❄ ▱▱▱▱▱')
  expect(speechOf('feast', false, null)).toEqual([['kita', 'So photogenic!'], ['ryo', 'Seconds.']])
  expect(speechOf('cold', true, null)).toEqual([['nijika', 'The next order warms it.']])
  expect(speechOf('cold', false, { kind: 'reheat', until: NOW })).toEqual([['bocchi', 'I-it’s warm again…']])
  expect(speechOf('off', false, null)).toEqual([])
})

test('the seats sit at the table’s side edges, each with the outer end of her waist on the edge at her row', async () => {
  expect(SEAT_ORDER).toEqual(['bocchi', 'ryo', 'nijika', 'kita'])
  for (const m of SEAT_ORDER) {
    const s = seatAt(m)
    const waist = { x: s.x + FEAST_WAIST[m].x, y: s.y + FEAST_WAIST[m].y }
    const edge = SEAT_SIDE[m] === 'left' ? edgeL(SEAT_ROW[m]) : edgeR(SEAT_ROW[m])
    expect(waist.y).toBe(SEAT_ROW[m])
    // the outer side of her waist's last pixel on the edge's line: its left side at the left edge, its right side at the right
    const outer = SEAT_SIDE[m] === 'left' ? waist.x : waist.x + 1
    expect(Math.abs(outer - edge)).toBeLessThanOrEqual(0.5)
    // the feast window starts at row 6 of her canvas
    expect(s.y + FEAST_TOP).toBeGreaterThan(0)
  }
  expect(SEAT_SIDE.bocchi).toBe('left')
  expect(SEAT_SIDE.nijika).toBe('left')
  expect(SEAT_ROW.bocchi).toBeLessThan(SEAT_ROW.nijika)
  expect(seatAt('ryo').x).toBeGreaterThan(TABLE.farL)
})

test('the terminal’s table and pot: opaque backdrop cells under the minis at the pot’s corners, the moods by phase', async () => {
  const cells = hotpotCells(viewOf(9 * MIN))
  expect(cells.w).toBe(70)
  expect(cells.h).toBe(34)
  expect(cells.under.every(c => c !== null)).toBe(true)
  expect(cells.parts).toEqual([
    { id: 'bocchi-happy-mini', x: 0, y: 0 },
    { id: 'nijika-happy-mini', x: 0, y: 18 },
    { id: 'ryo-happy-mini', x: 54, y: 0 },
    { id: 'kita-happy-mini', x: 54, y: 18 },
  ])
  expect(hotpotCells(viewOf(74 * MIN)).parts.map(p => p.id)).toEqual(['bocchi-hiding-mini', 'nijika-melting-mini', 'ryo-anxious-mini', 'kita-melting-mini'])
  // cold reads blue
  expect(hotpotCells(viewOf(74 * MIN)).under[0]).not.toBe(cells.under[0])
})

test('the scene: the same key gives the same string; the alt moves with the clock while the source does not', async () => {
  const a = hotpotSvg(viewOf(9 * MIN), { width: 600 })
  const b = hotpotSvg({ ...viewOf(9 * MIN), now: NOW + 30_000, feast: feastOf(cacheAt(9 * MIN), NOW + 30_000, HOUR) }, { width: 600 })
  expect(b.svg).toBe(a.svg)
  expect(a.alt).toBe("the band's hotpot · bubbling, 51m left")
  expect(b.alt).toBe("the band's hotpot · bubbling, 50m left")
  expect(a.svg.length).toBeLessThanOrEqual(SVG_LIMIT)
  expect(a.svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 288 184" width="1152" height="736">/)
  // a level step, keepwarm, the platter's step or a moment changes it
  expect(hotpotSvg(viewOf(30 * MIN), { width: 600 }).svg).not.toBe(a.svg)
  expect(hotpotSvg(viewOf(9 * MIN, {}, { keepWarmUntil: NOW + HOUR }), { width: 600 }).svg).not.toBe(a.svg)
  expect(hotpotSvg(viewOf(9 * MIN, {}, { contextTokens: 300_000 }), { width: 600 }).svg).not.toBe(a.svg)
  expect(hotpotSvg(viewOf(9 * MIN, { hotpot: { ...HOTPOT, moment: { kind: 'keepon', until: NOW + 1000 } } }), { width: 600 }).svg).not.toBe(a.svg)
  // reduced motion stops the room's motion (the steam, the flames, the speech's turn)
  expect(a.svg).toContain('@media (prefers-reduced-motion:reduce){*{animation:none!important}}')
  expect(a.svg).not.toContain('mix-blend-mode')
})

test('the flames stand out past the pot’s foot while it is lit: sputtering at last orders, back with a re-heat, none once cold, held, with nothing cached or caching off', async () => {
  // the flames the scene draws: their class (`fl` lit, `fs` sputtering) and the outer two's x, or `out`
  const flames = (v: HotpotView) => {
    const all = [...hotpotSvg(v, { width: 600 }).svg.matchAll(/<g class="(f[ls])"[^>]*><path d="M(\d+) 143c/g)]
    const xs = all.map(m => Number(m[2]))
    return all.length === 0 ? 'out' : `${[...new Set(all.map(m => m[1]))].join('+')} ${Math.min(...xs)}..${Math.max(...xs)}`
  }
  // the donabe's foot covers columns 120 to 167 with its outline, and a flame reaches some 1.3 px each side of its x: those at 112 and 176 stand clear of it
  for (const age of [9 * MIN, 30 * MIN, 45 * MIN]) expect(flames(viewOf(age))).toBe('fl 112..176')
  expect(flames(viewOf(9 * MIN, { flags: { ...FLAGS, compacting: true } }, {}, { compacting: true }))).toBe('fl 112..176')
  expect(flames(viewOf(57 * MIN))).toBe('fs 112..176')
  expect(flames(viewOf(74 * MIN, { hotpot: { ...HOTPOT, moment: { kind: 'reheat', until: NOW + 1 } } }))).toBe('fl 112..176')
  expect(flames(viewOf(74 * MIN))).toBe('out')
  expect(flames(viewOf(74 * MIN, { slip: { writeUsd: 1.34, warmUsd: 0.03, tokens: 168_000, ageMs: 14 * MIN } }, {}, { held: true }))).toBe('out')
  expect(flames(viewOf(-1))).toBe('out')
  expect(flames(viewOf(-1, {}, {}, { cleared: true }))).toBe('out')
  expect(flames(viewOf(-1, {}, {}, { cachingOff: true }))).toBe('out')
})

// ---- the seated band (the studio's feast family) ------------------------------------------------------------

const FEAST_IDS: readonly string[] = [
  ...(['bocchi', 'nijika', 'ryo', 'kita'] as const).flatMap(m => (['eat', 'calm', 'worry', 'wait', 'shock'] as const).map(s => `${m}-feast-${s}`)),
  'nijika-feast-cold',
  'ryo-feast-cold',
  'kita-feast-cold',
  'nijika-feast-serve',
]

test('the feast family is exported whole: every member\'s seat in every state she plays, 96x64, and Nijika\'s headband', async () => {
  expect(FEAST_IDS).toHaveLength(24)
  for (const id of FEAST_IDS) expect(animOf(id)).toMatchObject({ w: 96, h: 64 })
  expect(animOf(HEADBAND)).toMatchObject({ w: 96, h: 64 })
  expect(animOf(HEADBAND)?.frames).toHaveLength(1)
  expect(animOf('bocchi-feast-cold')).toBeUndefined()
  expect(viewSize('feast')).toEqual({ w: 96, h: 64 })
  // every id the table asks for is there
  for (const phase of ['none', 'feast', 'simmer', 'last', 'cold', 'held', 'zosui'] as const)
    for (const moment of [null, { kind: 'ping' as const, until: NOW + 1 }])
      for (const p of bandParts(phase, moment, true).parts) expect(animOf(p.id)).toBeDefined()
})

test('every figure the feast draws, its seats and Bocchi\'s box, is whole at level 0 within 24,000 characters', async () => {
  for (const id of [...FEAST_IDS, HEADBAND, 'bocchi-hiding']) {
    const r = fitSprites([{ id, x: 0, y: 0 }], 10_000_000)
    expect(r.levels).toEqual([0])
    expect(r.markup.length).toBeLessThanOrEqual(24_000)
  }
})

/** Bocchi's hair, which falls past her waist on her outer side (the studio's seat.ts; its outline is her jacket's too): all that may lie beyond its end. */
const BOCCHI_HAIR = new Set(['#eba2b3', '#fcc7cd', '#b76c8d', '#542549'])

test('the waist constants are the sprites\' own: the outer end of each seat\'s waist is drawn in every frame of every loop, only Bocchi\'s hair beyond it', async () => {
  for (const m of ['bocchi', 'nijika', 'ryo', 'kita'] as const) {
    const w = FEAST_WAIST[m]
    for (const id of FEAST_IDS.filter(x => x.startsWith(`${m}-`))) {
      const anim = animOf(id)
      if (anim === undefined) throw new Error(id)
      anim.frames.forEach((_f, i) => {
        const px = framePixels(id, i)
        const row = (w.y - FEAST_TOP) * anim.w
        expect(px[row + w.x]).not.toBeNull()
        // the waist ends there: the next pixel out on her outer side is empty, or Bocchi's hair
        const beyond = px[row + (SEAT_SIDE[m] === 'left' ? w.x - 1 : w.x + 1)] ?? null
        if (beyond !== null) expect(m === 'bocchi' && BOCCHI_HAIR.has(beyond)).toBe(true)
      })
    }
  }
})

test('the scene draws the band in every phase, platter, keepwarm and moment, under the Svg\'s limit; the pot under all four', async () => {
  const phases: [string, number, NonNullable<Parameters<typeof feastOf>[3]>][] = [
    ['none', -1, {}],
    ['cleared', -1, { cleared: true }],
    ['off', -1, { cachingOff: true }],
    ['feast', 5 * MIN, {}],
    ['feast4', 15 * MIN, {}],
    ['simmer', 30 * MIN, {}],
    ['low', 45 * MIN, {}],
    ['last', 57 * MIN, {}],
    ['cold', 74 * MIN, {}],
    ['held', 74 * MIN, { held: true }],
    ['zosui', 5 * MIN, { compacting: true }],
  ]
  const moments: KessokuHotpot['moment'][] = [null, { kind: 'ping', until: NOW + 1 }, { kind: 'reheat', until: NOW + 1 }, { kind: 'keepon', until: NOW + 1 }, { kind: 'paid', until: NOW + 1 }]
  let largest = 0
  for (const [, age, flags] of phases)
    for (const tokens of [20_000, 80_000, 200_000, 320_000])
      for (const keep of [0, NOW + HOUR])
        for (const moment of moments) {
          const v = viewOf(age, { hotpot: { ...HOTPOT, moment }, slip: flags.held ? { writeUsd: 1.34, warmUsd: 0.03, tokens, ageMs: 14 * MIN } : null }, { contextTokens: tokens, keepWarmUntil: keep }, flags)
          const svg = hotpotSvg(v, { width: 600 }).svg
          largest = Math.max(largest, svg.length)
          expect(svg.length).toBeLessThanOrEqual(SVG_LIMIT)
          const states = seatStates(drawnPhase(v).phase, momentOf(v))
          // the stove and the pot under all four, then every member seated in paint order: Bocchi, Ryo, Nijika (and her headband), Kita
          const at = (m: 'bocchi' | 'nijika' | 'ryo' | 'kita') => {
            const s = seatAt(m)
            return svg.indexOf(`<g transform="translate(${s.x} ${states[m] === 'box' ? s.y - BOX_RAISE : s.y + FEAST_TOP})">`)
          }
          const stove = svg.indexOf('<g transform="translate(101 140) scale(1)">')
          for (const m of ['bocchi', 'nijika', 'ryo', 'kita'] as const) expect(at(m)).toBeGreaterThan(0)
          expect(stove).toBeGreaterThan(0)
          expect(stove).toBeLessThan(at('bocchi'))
          expect(at('bocchi')).toBeLessThan(at('ryo'))
          expect(at('ryo')).toBeLessThan(at('nijika'))
          expect(at('nijika')).toBeLessThan(at('kita'))
          // each through her lap's clip
          for (const m of ['bocchi', 'nijika', 'ryo', 'kita'] as const) expect(svg).toContain(`<g clip-path="url(#lp${m[0]})"><g transform="translate(${seatAt(m).x} `)
        }
  expect(largest).toBeLessThan(SVG_LIMIT)
})

test('the far two reach over the pot’s back rim into its opening, through the window their lap clips open over it while they eat', async () => {
  /** The chopsticks' wood, lit and shaded. */
  const WOOD = new Set(['#e5b789', '#c4935f'])
  const inOpening = (x: number, y: number) => ((x + 0.5 - 144) / 26.2) ** 2 + ((y + 0.5 - 124) / 8.2) ** 2 <= 1
  const o = OVER_POT
  const inWindow = (x: number, y: number) => (x + 0.5 >= o.x0 && x + 0.5 <= o.x1 && y + 0.5 >= o.top && y + 0.5 <= o.cy) || (y + 0.5 > o.cy && ((x + 0.5 - 144) / o.rx) ** 2 + ((y + 0.5 - o.cy) / o.ry) ** 2 <= 1)
  // the first frame of each: Bocchi's and Ryo's seatPot, Ryo's seatPoint at the last piece, nothing on the tips yet
  for (const [m, id] of [['bocchi', 'bocchi-feast-eat'], ['ryo', 'ryo-feast-eat'], ['ryo', 'ryo-feast-worry']] as const) {
    const anim = animOf(id)
    if (anim === undefined) throw new Error(id)
    const s = seatAt(m)
    const wood: (readonly [number, number])[] = []
    framePixels(id, 0).forEach((c, i) => c !== null && WOOD.has(c) && wood.push([s.x + (i % anim.w), s.y + FEAST_TOP + Math.floor(i / anim.w)]))
    const tip = wood.reduce((a, b) => (b[1] > a[1] ? b : a))
    // past the back rim (rows 113 to 116 in the pot's middle) and down in the opening
    expect(tip[1]).toBeGreaterThanOrEqual(117)
    expect(inOpening(tip[0], tip[1])).toBe(true)
    // all of them below her waist lies in the window, so her clip shows them whole
    for (const [x, y] of wood) if (y > SEAT_ROW[m]) expect(inWindow(x, y)).toBe(true)
  }
  // open in the far two's clips while they eat, simmer or watch the last piece; never in the near two's, nor round Bocchi's box
  const clip = (svg: string, k: string) => svg.match(new RegExp(`<clipPath id="lp${k}">.*?</clipPath>`))?.[0] ?? ''
  const window = `M${o.x0} ${o.top}H${o.x1}V${o.cy}`
  for (const [age, open] of [[5 * MIN, true], [30 * MIN, true], [57 * MIN, true], [-1, false], [74 * MIN, false]] as const) {
    const svg = hotpotSvg(viewOf(age), { width: 600 }).svg
    for (const k of ['b', 'r']) expect(clip(svg, k).includes(window)).toBe(open)
    for (const k of ['n', 'k']) expect(clip(svg, k)).not.toContain(window)
  }
})

test('the band’s budget counts each seat’s clip: a room that leaves the band its whole size but not its clips still draws it, a few frames short, never the capped picture', async () => {
  // The real room leaves the band some 50,000 characters, so its budget never binds. Nijika's colour strokes the set
  // table's one speech bubble: padded, it grows the room until the band whole with its four clips (29 characters
  // each) would run the scene a character or two past the limit, so only a budget that counts the clips has the
  // band give up frames in time.
  const band = bandParts('none', null, false)
  const clips = band.wraps.reduce((n, w) => n + `<g ${w}></g>`.length, 0)
  const whole = fitSprites(band.parts, 10_000_000).markup.length
  const card = MEMBERS.nijika
  const color = card.color
  let width = 1000
  // each drawing at a width of its own, which the memo keys on and the drawing never reads
  const draw = (pad: number) => {
    card.color = color + ' '.repeat(pad)
    try {
      width += 1
      return hotpotSvg(viewOf(-1), { width }).svg
    } finally {
      card.color = color
    }
  }
  // the room: everything but the band and its clips, measured while the band is drawn whole
  const room = draw(0).length - whole - clips
  const perPad = (draw(1000).length - whole - clips - room) / 1000
  expect(perPad).toBeGreaterThan(0)
  const svg = draw(Math.ceil((SVG_LIMIT + 1 - whole - clips - room) / perPad))
  expect(svg.length).toBeLessThanOrEqual(SVG_LIMIT)
  for (const m of SEAT_ORDER) expect(svg).toContain(`<g clip-path="url(#lp${m[0]})"><g transform="translate(${seatAt(m).x} `)
})

test('Nijika wears her headband while keepwarm runs, on whatever she plays, and only with her', async () => {
  const kept = bandParts('feast', null, true)
  const i = kept.parts.findIndex(p => p.id === HEADBAND)
  expect(kept.parts[i - 1]?.id).toBe('nijika-feast-eat')
  expect(kept.parts[i]).toMatchObject({ x: kept.parts[i - 1]?.x, y: kept.parts[i - 1]?.y })
  expect(kept.wraps[i]).toBe(kept.wraps[i - 1])
  expect(bandParts('feast', null, false).parts.some(p => p.id === HEADBAND)).toBe(false)
  expect(bandParts('cold', null, true).parts.map(p => p.id)).toEqual(['bocchi-hiding', 'ryo-feast-cold', 'nijika-feast-cold', HEADBAND, 'kita-feast-cold'])
  // Bocchi's box sits where her seat is, raised, through her lap's clip
  const cold = bandParts('cold', null, false)
  expect(cold.parts[0]).toEqual({ id: 'bocchi-hiding', x: seatAt('bocchi').x, y: seatAt('bocchi').y - BOX_RAISE })
  expect(cold.wraps[0]).toBe('clip-path="url(#lpb)"')
  // no headband without Nijika: a budget the headband fits but Nijika's still does not leaves both out
  const pair = kept.parts.slice(i - 1, i + 1)
  const wraps = kept.wraps.slice(i - 1, i + 1)
  const alone = fitSprites([pair[1] as SpritePart], 10_000_000).markup.length
  // Nijika alone, even as a still, is past it
  expect(fitSprites([pair[0] as SpritePart], alone + 4).levels).toEqual([-1])
  const tight = fitBand(pair, wraps, '', alone + 4)
  expect(tight.parts.map(p => p.id)).toEqual(['nijika-feast-eat'])
  expect(tight.levels).toEqual([-1])
  expect(tight.markup).not.toContain('translate(')
  const roomy = fitBand(pair, wraps, '', 10_000_000)
  expect(roomy.parts.map(p => p.id)).toEqual(['nijika-feast-eat', HEADBAND])
  expect(roomy.levels).toEqual([0, 0])
})
