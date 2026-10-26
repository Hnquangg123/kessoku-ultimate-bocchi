// Kessoku Ultimate Bocchi Theme: the tour's arithmetic (hooks/lib/tour.ts), tested directly.
//
// A book is one project's tour as `$.store` keeps it; the view is what the
// /bocchi stats page reads. The hooks that write and draw them are tested in
// kessoku.test.ts.

import { expect, test } from 'claude-code/testing'

import { addMemo, addSet, bar, dayOf, emptyBook, mvpOf, readBook, spark, tourView } from '../hooks/lib/tour'
import type { SetFacts } from '../hooks/lib/tour'

const NONE = { bocchi: 0, nijika: 0, ryo: 0, kita: 0 }

/** A set that ended on 2026-10-20 after a minute, for half a dollar, with nothing else to its name. */
function aSet(over: Partial<SetFacts> = {}): SetFacts {
  return { day: '2026-10-20', ms: 60_000, usd: 0.5, acts: NONE, errors: NONE, edits: 0, commits: 0, held: 0, stopped: 0, ...over }
}

test('a set added to an empty book is its first night', async () => {
  const book = addSet(emptyBook('/proj', 'proj'), aSet({ ms: 72_000, usd: 0.54, edits: 3, commits: 1, acts: { ...NONE, ryo: 2 } }))
  const v = tourView([book])
  expect(v.label).toBe('proj')
  expect(v.sets).toBe(1)
  expect(v.nights).toBe(1)
  expect(v.since).toBe('2026-10-20')
  expect(v.usd).toBe(0.54)
  expect(v.ms).toBe(72_000)
  expect(v.edits).toBe(3)
  expect(v.commits).toBe(1)
  expect(v.acts).toEqual({ ...NONE, ryo: 2 })
})

test('sets on the same day add up to one night; a later day is a night of its own', async () => {
  let book = emptyBook('/proj', 'proj')
  book = addSet(book, aSet({ usd: 0.5, edits: 1, acts: { ...NONE, kita: 1 } }))
  book = addSet(book, aSet({ usd: 0.25, edits: 2, acts: { ...NONE, kita: 1, ryo: 1 } }))
  book = addSet(book, aSet({ day: '2026-10-22', usd: 0.25 }))
  const v = tourView([book])
  expect(v.sets).toBe(3)
  expect(v.nights).toBe(2)
  expect(v.usd).toBe(1)
  expect(v.edits).toBe(3)
  expect(v.acts).toEqual({ ...NONE, kita: 2, ryo: 1 })
  expect(book.nights.map(n => [n.day, n.sets])).toEqual([['2026-10-20', 2], ['2026-10-22', 1]])
})

test('past the cap the oldest nights are folded into one line, and the tour still counts them', async () => {
  let book = emptyBook('/proj', 'proj')
  for (const day of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']) book = addSet(book, aSet({ day, edits: 1, acts: { ...NONE, nijika: 1 } }), 3)
  book = addSet(book, aSet({ day: '2026-10-05' }), 3)
  expect(book.nights.map(n => n.day)).toEqual(['2026-10-03', '2026-10-04', '2026-10-05'])
  const v = tourView([book])
  expect(v.sets).toBe(6)
  expect(v.nights).toBe(5)
  expect(v.since).toBe('2026-10-01')
  expect(v.usd).toBe(3)
  expect(v.edits).toBe(5)
  expect(v.acts).toEqual({ ...NONE, nijika: 5 })
})

test('the longest and the priciest set are kept with their nights, folded or not', async () => {
  let book = emptyBook('/proj', 'proj')
  book = addSet(book, aSet({ day: '2026-10-01', ms: 60_000, usd: 0.5 }), 1)
  book = addSet(book, aSet({ day: '2026-10-02', ms: 1_120_000, usd: 0.75 }), 1)
  book = addSet(book, aSet({ day: '2026-10-03', ms: 90_000, usd: 1.5 }), 1)
  book = addSet(book, aSet({ day: '2026-10-03', ms: 30_000, usd: 0.25 }), 1)
  const v = tourView([book])
  expect(v.longest).toEqual({ ms: 1_120_000, day: '2026-10-02' })
  expect(v.priciest).toEqual({ usd: 1.5, day: '2026-10-03' })
  expect(tourView([emptyBook('/new', 'new')]).longest).toBeNull()
})

test('money is kept to a hundredth of a cent, so sums read the way they were spent', async () => {
  let book = emptyBook('/proj', 'proj')
  book = addSet(book, aSet({ usd: 0.1 }))
  book = addSet(book, aSet({ usd: 0.2 }))
  book = addSet(book, aSet({ day: '2026-10-21', usd: 0.123456 }))
  expect(book.nights[0]?.usd).toBe(0.3)
  expect(book.nights[1]?.usd).toBe(0.1235)
  expect(tourView([book]).usd).toBe(0.4235)
})

test('a memo saved counts on its night; a day with memos and no set is no night played', async () => {
  let book = emptyBook('/proj', 'proj')
  book = addSet(book, aSet({ day: '2026-10-20' }))
  book = addMemo(book, '2026-10-20')
  book = addMemo(book, '2026-10-21')
  book = addMemo(book, '2026-10-21')
  const v = tourView([book])
  expect(v.memos).toBe(3)
  expect(v.nights).toBe(1)
  expect(v.sets).toBe(1)
  expect(book.nights.map(n => [n.day, n.sets, n.memos])).toEqual([['2026-10-20', 1, 1], ['2026-10-21', 0, 2]])
  // A memo before any set starts no tour.
  expect(tourView([addMemo(emptyBook('/new', 'new'), '2026-10-21')]).since).toBe('')
})

test('wrong notes are counted by member, the most named; the guard\'s holds and stops add up', async () => {
  let book = emptyBook('/proj', 'proj')
  book = addSet(book, aSet({ errors: { ...NONE, ryo: 2, kita: 1 }, held: 1, stopped: 1 }))
  book = addSet(book, aSet({ day: '2026-10-21', errors: { ...NONE, ryo: 2, bocchi: 3 }, held: 2 }), 1)
  const v = tourView([book])
  expect(v.errors).toEqual({ bocchi: 3, nijika: 0, ryo: 4, kita: 1 })
  expect(v.mostErrors).toEqual({ member: 'ryo', count: 4 })
  expect(v.held).toBe(3)
  expect(v.stopped).toBe(1)
  // A tie goes to the band's order; no wrong note, nobody.
  expect(tourView([addSet(emptyBook('/a', 'a'), aSet({ errors: { ...NONE, kita: 2, nijika: 2 } }))]).mostErrors).toEqual({ member: 'nijika', count: 2 })
  expect(tourView([addSet(emptyBook('/b', 'b'), aSet())]).mostErrors).toBeNull()
})

test('the chart reads the last 14 nights played, oldest first, each with its cost and sets', async () => {
  let book = emptyBook('/proj', 'proj')
  for (let d = 1; d <= 16; d += 1) {
    const day = `2026-10-${String(d).padStart(2, '0')}`
    book = addSet(book, aSet({ day, usd: d / 4 }))
    if (d === 16) book = addSet(book, aSet({ day, usd: 1 }))
  }
  book = addMemo(book, '2026-10-17')
  const recent = tourView([book]).recent
  expect(recent).toHaveLength(14)
  expect(recent[0]).toEqual({ day: '2026-10-03', usd: 0.75, sets: 1 })
  expect(recent[13]).toEqual({ day: '2026-10-16', usd: 5, sets: 2 })
  expect(tourView([emptyBook('/new', 'new')]).recent).toEqual([])
})

test('every project at once: the figures add up, and a night played in two projects is one night', async () => {
  let a = emptyBook('/work/app', 'app')
  a = addSet(a, aSet({ day: '2026-10-20', usd: 1, ms: 600_000 }))
  a = addSet(a, aSet({ day: '2026-10-21', usd: 0.5 }))
  let b = emptyBook('/work/site', 'site')
  b = addSet(b, aSet({ day: '2026-10-19', usd: 0.25 }))
  b = addSet(b, aSet({ day: '2026-10-21', usd: 2 }))
  const v = tourView([a, b, emptyBook('/work/empty', 'empty')])
  expect(v.label).toBe('all projects')
  expect(v.projects).toBe(2)
  expect(v.sets).toBe(4)
  expect(v.nights).toBe(3)
  expect(v.since).toBe('2026-10-19')
  expect(v.usd).toBe(3.75)
  expect(v.longest).toEqual({ ms: 600_000, day: '2026-10-20' })
  expect(v.priciest).toEqual({ usd: 2, day: '2026-10-21' })
  expect(v.recent).toEqual([
    { day: '2026-10-19', usd: 0.25, sets: 1 },
    { day: '2026-10-20', usd: 1, sets: 1 },
    { day: '2026-10-21', usd: 2.5, sets: 2 },
  ])
  // One project reads as itself.
  expect(tourView([a]).label).toBe('app')
  expect(tourView([a]).projects).toBe(1)
})

test('a stored value reads back as the book it was; anything else starts the project afresh', async () => {
  let book = addSet(emptyBook('/proj', 'proj'), aSet({ day: '2026-10-01', usd: 0.5, errors: { ...NONE, kita: 1 } }), 1)
  book = addMemo(addSet(book, aSet({ day: '2026-10-02', usd: 0.25 }), 1), '2026-10-02', 1)
  const stored: unknown = JSON.parse(JSON.stringify(book))
  expect(readBook(stored, '/proj', 'proj')).toEqual(book)
  for (const junk of [undefined, null, 'tour', 42, [], { v: 2, nights: [] }, { v: 1, nights: 'x' }]) expect(readBook(junk, '/proj', 'proj')).toEqual(emptyBook('/proj', 'proj'))
  // A night that lost a field reads as nothing there, not as a broken sum; an entry that is no night is dropped.
  const partial = { v: 1, root: '/proj', name: 'proj', nights: [{ day: '2026-10-20', sets: 2, usd: 1, acts: { ryo: 'many' } }, 'junk', { sets: 1 }] }
  const v = tourView([readBook(partial, '/proj', 'proj')])
  expect(v.sets).toBe(2)
  expect(v.nights).toBe(1)
  expect(v.usd).toBe(1)
  expect(v.edits).toBe(0)
  expect(v.acts).toEqual(NONE)
  expect(v.since).toBe('2026-10-20')
  expect(v.longest).toBeNull()
})

test('the MVP is the member with the most acts, the cheaper on a tie, then the band\'s order; with no acts, the main loop', async () => {
  const act = (member: 'bocchi' | 'nijika' | 'ryo' | 'kita', usd: number, what: string, startedAt: number) => ({ member, usd, what, startedAt })
  const main = { tracks: 12, usd: 0.31 }
  expect(mvpOf([act('nijika', 0.06, 'Plan: split the loader', 10), act('ryo', 0.11, 'Explore: cells', 5), act('ryo', 0.08, 'Look into the flicker', 20)], main)).toEqual({ member: 'ryo', acts: 2, usd: 0.19, what: 'Look into the flicker', tracks: 0 })
  expect(mvpOf([act('kita', 0.1, 'README', 1), act('ryo', 0.05, 'grep', 2)], main).member).toBe('ryo')
  expect(mvpOf([act('ryo', 0.05, 'grep', 1), act('nijika', 0.05, 'plan', 2)], main).member).toBe('nijika')
  expect(mvpOf([], main)).toEqual({ member: 'bocchi', acts: 0, usd: 0.31, what: '', tracks: 12 })
})

test('a time is the night of its local date; the terminal draws the nights and the members as blocks', async () => {
  // Midday UTC is the same date on every clock from UTC-11 to UTC+11.
  expect(dayOf(Date.UTC(2026, 9, 20, 12))).toBe('2026-10-20')
  expect(dayOf(Date.UTC(2026, 0, 5, 12))).toBe('2026-01-05')
  // The nights against the dearest one: a free night still shows its floor.
  expect(spark([0.25, 1, 0.5, 0])).toBe('▂█▄▁')
  expect(spark([])).toBe('')
  // A member's bar against the busiest member's, ten blocks wide: one block at least for any act.
  expect(bar(41, 41, 10)).toBe('██████████')
  expect(bar(27, 41, 10)).toBe('███████')
  expect(bar(1, 41, 10)).toBe('█')
  expect(bar(0, 41, 10)).toBe('')
})
