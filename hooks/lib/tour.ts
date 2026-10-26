// Kessoku Ultimate Bocchi Theme: the tour, as data.
//
// Pure, no `$` and no `on`: what a set that just ended did (its figures and
// its MVP, read off the band and the set's tally), what `$.store` keeps of a
// project's sets between sessions (its book: one line a night, a night being
// a calendar day the band played, under a key named by the project's root),
// how a set or a saved memo is added to a book and how the oldest nights fold,
// reading back whatever the store holds, and the view the /bocchi stats page
// draws of one book or several: its one-line summary, the terminal's bars and
// the desktop's chart.

import type { KessokuAgent, KessokuBand, KessokuMember, KessokuRecap, KessokuTally, KessokuTourView } from '../../types'
import { fmtUsd } from './band'
import { MEMBERS, PALETTE } from './palette'
import { BAND_ORDER } from './stage'
import { norm } from './tree'

/** Counts kept by member. */
export type ByMember = Record<KessokuMember, number>

/** What the /bocchi stats page reads (the state contract's type: the page keeps it in `$.state`). */
export type TourView = KessokuTourView

/** The member a recap names (the state contract's type: the recap keeps it in `$.state`). */
export type Mvp = KessokuRecap['mvp']

/** One set as it ended: what the tour adds up. */
export type SetFacts = {
  /** The night it ended on, `YYYY-MM-DD`. */
  day: string
  ms: number
  usd: number
  acts: ByMember
  errors: ByMember
  edits: number
  commits: number
  held: number
  stopped: number
}

/** One night of a project's tour: every set that ended on that day, summed, and the memos saved on it. */
export type TourNight = {
  day: string
  sets: number
  ms: number
  usd: number
  acts: ByMember
  errors: ByMember
  edits: number
  commits: number
  held: number
  stopped: number
  memos: number
}

/** Nights folded out of a book, summed: their figures and how many of them the band played. */
export type TourTotals = Omit<TourNight, 'day'> & { nights: number }

/** A project's tour as `$.store` keeps it. */
export type TourBook = {
  v: 1
  /** The project's root (the main working tree's, for a repository). */
  root: string
  name: string
  /** The first night ever played, folded or not; '' before any. */
  since: string
  /** The newest nights, oldest first, at most the cap. */
  nights: TourNight[]
  /** Every night folded out of `nights`, summed. */
  older: TourTotals
  /** The longest set and the priciest, each with its night; null before any. */
  longest: { ms: number; day: string } | null
  priciest: { usd: number; day: string } | null
}

/** The nights a book keeps whole; older ones are summed into `older`. */
export const MAX_NIGHTS = 60

/** The nights the page charts. */
export const CHART_NIGHTS = 14

/** How the page names every project at once. */
export const ALL_PROJECTS = 'all projects'

/** Dollars to a hundredth of a cent: what the store keeps, and what a sum of them reads as. */
function money(usd: number): number {
  return Number.isFinite(usd) ? Math.round(usd * 10_000) / 10_000 : 0
}

/** Nothing for anyone. */
function nobody(): ByMember {
  return { bocchi: 0, nijika: 0, ryo: 0, kita: 0 }
}

function plus(a: ByMember, b: ByMember): ByMember {
  return { bocchi: a.bocchi + b.bocchi, nijika: a.nijika + b.nijika, ryo: a.ryo + b.ryo, kita: a.kita + b.kita }
}

function emptyNight(day: string): TourNight {
  return { day, sets: 0, ms: 0, usd: 0, acts: nobody(), errors: nobody(), edits: 0, commits: 0, held: 0, stopped: 0, memos: 0 }
}

function emptyTotals(): TourTotals {
  const { day: _, ...figures } = emptyNight('')
  return { ...figures, nights: 0 }
}

/** Two nights' (or totals') figures added up. */
function sum<T extends Omit<TourNight, 'day'>>(a: T, b: Omit<TourNight, 'day'>): T {
  return {
    ...a,
    sets: a.sets + b.sets,
    ms: a.ms + b.ms,
    usd: money(a.usd + money(b.usd)),
    acts: plus(a.acts, b.acts),
    errors: plus(a.errors, b.errors),
    edits: a.edits + b.edits,
    commits: a.commits + b.commits,
    held: a.held + b.held,
    stopped: a.stopped + b.stopped,
    memos: a.memos + b.memos,
  }
}

/** A night the band played: at least one set ended on it (a memo alone does not count). */
function isPlayed(n: TourNight): boolean {
  return n.sets > 0
}

/** A project with no tour yet. */
export function emptyBook(root: string, name: string): TourBook {
  return { v: 1, root, name, since: '', nights: [], older: emptyTotals(), longest: null, priciest: null }
}

// ---- The set that just ended ----------------------------------------------------

/** One act of the set as the recap weighs it: whose, what it spent, what it was asked, when it began. */
export type ActFacts = { member: KessokuMember; usd: number; what: string; startedAt: number }

/**
 * The set's MVP: the member with the most acts, the one who spent less on a
 * tie, then the band's order. With no act at all, Bocchi for the main loop,
 * with its tool calls and what it spent.
 */
export function mvpOf(acts: readonly ActFacts[], main: { tracks: number; usd: number }): Mvp {
  const by = BAND_ORDER.map(member => {
    const mine = acts.filter(a => a.member === member)
    const newest = mine.reduce<ActFacts | null>((top, a) => (top === null || a.startedAt > top.startedAt ? a : top), null)
    return { member, acts: mine.length, usd: money(mine.reduce((n, a) => n + a.usd, 0)), what: newest?.what ?? '', tracks: 0 }
  })
  const top = best(by.map(m => (m.acts > 0 ? m : null)), (a, b) => a.acts > b.acts || (a.acts === b.acts && a.usd < b.usd))
  return top ?? { member: 'bocchi', acts: 0, usd: money(main.usd), what: '', tracks: main.tracks }
}

/**
 * What the set that just ended did, read off the band and its tally: its acts
 * (the subagents that began during it, sample acts aside), what it spent at
 * list prices (the main loop's spend during the set and its acts' so far), its
 * wrong notes and its MVP. A tally that did not begin with this set (one an
 * older version of the mod never kept) has no baseline for the main loop, so
 * the main loop's part is left out rather than the whole session's charged.
 */
export function setOf(b: KessokuBand, t: KessokuTally): { acts: KessokuAgent[]; usd: number; errors: number; mvp: Mvp } {
  const main = b.agents.find(a => a.id === 'main')
  const mainUsd = t.set === b.set ? Math.max(0, (main?.cost ?? 0) - t.mainUsd) : 0
  const acts = b.agents.filter(a => a.id !== 'main' && !a.id.startsWith('demo-') && a.startedAt >= b.setStartedAt)
  const tracks = Object.values(main?.toolTally ?? {}).reduce((n, x) => n + x, 0)
  const mvp = mvpOf(acts.map(a => ({ member: a.member, usd: a.cost, what: a.description, startedAt: a.startedAt })), { tracks, usd: mainUsd })
  return { acts, usd: mainUsd + acts.reduce((n, a) => n + a.cost, 0), errors: BAND_ORDER.reduce((n, m) => n + (t.errors[m] ?? 0), 0), mvp }
}

// ---- The store's key ----------------------------------------------------------------

/** The store's key prefix for a project's tour; the rest of the key is the project's root. */
export const TOUR_KEY = 'tour:'

/** A project's root in one spelling: forward slashes, no slash at the end, the drive letter in capitals. */
export function projectRoot(root: string): string {
  return norm(root).replace(/^([a-z]):/, (_, d: string) => `${d.toUpperCase()}:`)
}

/** The store's key for a project's tour. */
export function tourKey(root: string): string {
  return `${TOUR_KEY}${projectRoot(root)}`
}

// ---- Reading back what the store holds ----------------------------------------
// The store outlives every version of the mod and can be edited by hand: whatever it holds is read field by field,
// a figure that is missing or not a number as nothing, an entry that is no night dropped, and a value that is no
// book at all as a project with no tour yet.

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/** A figure as the store holds it (a count, a length, dollars): a finite number above zero, else nothing. */
function amount(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0
}

function isDay(x: unknown): x is string {
  return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
}

function readByMember(x: unknown): ByMember {
  const r = isRecord(x) ? x : {}
  return { bocchi: amount(r.bocchi), nijika: amount(r.nijika), ryo: amount(r.ryo), kita: amount(r.kita) }
}

function readFigures(r: Record<string, unknown>): Omit<TourNight, 'day'> {
  return {
    sets: amount(r.sets),
    ms: amount(r.ms),
    usd: money(amount(r.usd)),
    acts: readByMember(r.acts),
    errors: readByMember(r.errors),
    edits: amount(r.edits),
    commits: amount(r.commits),
    held: amount(r.held),
    stopped: amount(r.stopped),
    memos: amount(r.memos),
  }
}

function readRecord<K extends 'ms' | 'usd'>(x: unknown, k: K): ({ day: string } & Record<K, number>) | null {
  if (!isRecord(x) || !isDay(x.day) || amount(x[k]) === 0) return null
  return { [k]: amount(x[k]), day: x.day } as { day: string } & Record<K, number>
}

/** What the store holds under a project's key, as that project's book (named by its root, whatever the value says). */
export function readBook(value: unknown, root: string, name: string): TourBook {
  if (!isRecord(value) || value.v !== 1 || !Array.isArray(value.nights)) return emptyBook(root, name)
  const nights = value.nights.filter((n): n is Record<string, unknown> => isRecord(n) && isDay(n.day)).map(n => ({ day: n.day as string, ...readFigures(n) }))
  const older = isRecord(value.older) ? { ...readFigures(value.older), nights: amount(value.older.nights) } : emptyTotals()
  const since = isDay(value.since) ? value.since : (nights.find(isPlayed)?.day ?? '')
  return { v: 1, root, name, since, nights, older, longest: readRecord(value.longest, 'ms'), priciest: readRecord(value.priciest, 'usd') }
}

// ---- Adding to a book --------------------------------------------------------------

/** The book with its oldest nights past `cap` summed into `older`. */
function fold(book: TourBook, cap: number): TourBook {
  const over = book.nights.length - Math.max(1, cap)
  if (over <= 0) return book
  const gone = book.nights.slice(0, over)
  const older = gone.reduce((t, n) => sum(t, n), { ...book.older, nights: book.older.nights + gone.filter(isPlayed).length })
  return { ...book, nights: book.nights.slice(over), older }
}

/** The book with its newest night changed by `fn`: that night when it is `day`'s, else a new one. */
function onNight(book: TourBook, day: string, fn: (n: TourNight) => TourNight): TourBook {
  const last = book.nights[book.nights.length - 1]
  if (last !== undefined && last.day === day) return { ...book, nights: [...book.nights.slice(0, -1), fn(last)] }
  return { ...book, nights: [...book.nights, fn(emptyNight(day))] }
}

/** The book with the set added to its night, the oldest nights past `cap` folded. */
export function addSet(book: TourBook, s: SetFacts, cap = MAX_NIGHTS): TourBook {
  const added = onNight(book, s.day, n => sum(n, { ...s, sets: 1, memos: 0 }))
  return fold(
    {
      ...added,
      since: book.since === '' ? s.day : book.since,
      longest: book.longest === null || s.ms > book.longest.ms ? { ms: s.ms, day: s.day } : book.longest,
      priciest: book.priciest === null || money(s.usd) > book.priciest.usd ? { usd: money(s.usd), day: s.day } : book.priciest,
    },
    cap,
  )
}

/** The book with a memo saved on `day`: on that night, which a memo alone does not make a night played. */
export function addMemo(book: TourBook, day: string, cap = MAX_NIGHTS): TourBook {
  return fold(onNight(book, day, n => ({ ...n, memos: n.memos + 1 })), cap)
}

// ---- The view ------------------------------------------------------------------------

/** The record of several books: the one `better` prefers, null when none has one. */
function best<T>(records: readonly (T | null)[], better: (a: T, b: T) => boolean): T | null {
  return records.reduce<T | null>((top, r) => (r !== null && (top === null || better(r, top)) ? r : top), null)
}

/** Every night the books keep whole that the band played, one entry a day across the books, oldest first. */
function playedNights(books: readonly TourBook[]): { day: string; usd: number; sets: number }[] {
  const byDay = new Map<string, { day: string; usd: number; sets: number }>()
  for (const n of books.flatMap(b => b.nights).filter(isPlayed)) {
    const was = byDay.get(n.day) ?? { day: n.day, usd: 0, sets: 0 }
    byDay.set(n.day, { day: n.day, usd: money(was.usd + n.usd), sets: was.sets + n.sets })
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0))
}

/** The tour of one book, or of several summed; named `label`, by default the one book's name or `all projects`. */
export function tourView(books: readonly TourBook[], label = books.length === 1 ? (books[0]?.name ?? '') : ALL_PROJECTS): TourView {
  const t = books.reduce((acc, b) => b.nights.reduce((x, n) => sum(x, n), sum(acc, b.older)), emptyTotals())
  const played = playedNights(books)
  return {
    label,
    projects: books.filter(b => b.since !== '').length,
    since: books.map(b => b.since).filter(d => d !== '').sort()[0] ?? '',
    // A night two projects both keep whole is one night; folded nights are counted per project.
    nights: books.reduce((n, b) => n + b.older.nights, 0) + played.length,
    sets: t.sets,
    ms: t.ms,
    usd: t.usd,
    edits: t.edits,
    commits: t.commits,
    memos: t.memos,
    held: t.held,
    stopped: t.stopped,
    acts: t.acts,
    errors: t.errors,
    longest: best(books.map(b => b.longest), (a, b) => a.ms > b.ms),
    priciest: best(books.map(b => b.priciest), (a, b) => a.usd > b.usd),
    mostErrors: best(BAND_ORDER.map(member => (t.errors[member] > 0 ? { member, count: t.errors[member] } : null)), (a, b) => a.count > b.count),
    recent: played.slice(-CHART_NIGHTS),
  }
}

/** `3 sets`, `1 set`: a count and its word. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** `/bocchi stats` in one line: what the page shows first. */
export function statsLine(v: TourView): string {
  if (v.sets === 0) return `♪ On tour · ${v.label}: no sets played here yet.`
  return `♪ On tour · ${v.label}: ${plural(v.sets, 'set')} over ${plural(v.nights, 'night')} since ${v.since} · ≈${fmtUsd(v.usd)} · ${plural(v.commits, 'commit')} · ${plural(v.stopped, 'blast')} stopped · ${plural(v.memos, 'memo')} saved`
}

// ---- Days and bars -----------------------------------------------------------------

/** The night a time falls on: its date where the hooks run, `YYYY-MM-DD`. */
export function dayOf(ms: number): string {
  const d = new Date(ms)
  const two = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`
}

/** `10-18` for `2026-10-18`: a night as the page's short labels read it. */
export function shortDay(day: string): string {
  return day.slice(5)
}

const STEPS = '▁▂▃▄▅▆▇█'

/** The nights as eighth blocks against the dearest one; every night shows at least its floor. */
export function spark(values: readonly number[]): string {
  const max = Math.max(0, ...values)
  return values.map(v => STEPS[max > 0 ? Math.min(7, Math.max(0, Math.ceil((v / max) * 8) - 1)) : 0]).join('')
}

/** A member's bar against the busiest member's, `width` blocks at most; one block at least for anything at all. */
export function bar(n: number, max: number, width: number): string {
  if (n <= 0 || max <= 0) return ''
  return '█'.repeat(Math.max(1, Math.min(width, Math.round((n / max) * width))))
}

const CHART_W = 560
const CHART_FONT = 'font-family="ui-monospace, Menlo, Consolas, monospace" font-size="11"'

/**
 * The page's picture on a surface that draws Svg: the recent nights as
 * columns against the dearest (tonight's in hot pink), then a bar a member for
 * her acts against the busiest member's, each in her colour. The alt text
 * carries every number the picture shows.
 */
export function tourChart(v: TourView): { svg: string; alt: string } {
  const top = Math.max(0, ...v.recent.map(n => n.usd))
  const slot = CHART_W / CHART_NIGHTS
  const columns = v.recent
    .map((n, i) => {
      const h = Math.max(2, top > 0 ? Math.round((n.usd / top) * 64) : 2)
      const isLast = i === v.recent.length - 1
      return `<rect x="${Math.round(i * slot + 4)}" y="${90 - h}" width="${Math.round(slot - 8)}" height="${h}" rx="2" fill="${isLast ? PALETTE.hotPink : PALETTE.pink}" fill-opacity="${isLast ? 1 : 0.75}"/>`
    })
    .join('')
  const first = v.recent[0]
  const last = v.recent[v.recent.length - 1]
  const days =
    first === undefined || last === undefined
      ? ''
      : `<text x="0" y="104" fill="${PALETTE.dim}" ${CHART_FONT}>${shortDay(first.day)}</text>${last === first ? '' : `<text x="${CHART_W}" y="104" text-anchor="end" fill="${PALETTE.dim}" ${CHART_FONT}>${shortDay(last.day)}</text>`}`
  const busiest = Math.max(0, ...BAND_ORDER.map(m => v.acts[m]))
  const rows = BAND_ORDER.map((m, i) => {
    const y = 124 + i * 16
    const w = busiest > 0 && v.acts[m] > 0 ? Math.max(3, Math.round((v.acts[m] / busiest) * 400)) : 0
    return `<text x="0" y="${y + 10}" fill="${MEMBERS[m].color}" ${CHART_FONT} font-weight="bold">${MEMBERS[m].name}</text>${w > 0 ? `<rect x="72" y="${y + 1}" width="${w}" height="10" rx="2" fill="${MEMBERS[m].color}"/>` : ''}<text x="${CHART_W}" y="${y + 10}" text-anchor="end" fill="${PALETTE.dim}" ${CHART_FONT}>${v.acts[m]}</text>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CHART_W} 188" width="${CHART_W}" height="188"><text x="0" y="12" fill="${PALETTE.dim}" ${CHART_FONT}>cost a night</text><text x="${CHART_W}" y="12" text-anchor="end" fill="${PALETTE.dim}" ${CHART_FONT}>dearest ≈${fmtUsd(top)}</text>${columns}${days}<text x="0" y="118" fill="${PALETTE.dim}" ${CHART_FONT}>acts by member</text>${rows}</svg>`
  const alt = `cost a night: ${v.recent.map(n => `${shortDay(n.day)} ≈${fmtUsd(n.usd)}`).join(', ') || 'none yet'}; acts: ${BAND_ORDER.map(m => `${MEMBERS[m].name} ${v.acts[m]}`).join(', ')}`
  return { svg, alt }
}
