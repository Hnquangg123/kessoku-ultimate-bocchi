import React from 'react'
import { AbsoluteFill } from 'remotion'
import type { CalculateMetadataFunction } from 'remotion'
import { POSES, blank, checkArt, isPatched, resolvePose, stamp } from './art/compose'
import type { Pixels } from './art/compose'
import { ART } from './art/members'
import type { FaceName, MemberArt, MemberId, PeekName, PoseDef } from './art/types'
import { MOODS, expand, sceneAt, tagFor } from './anim/moods'
import type { Scene } from './anim/moods'
import { drawScene } from './anim/scene'
import { PixelCanvas } from './PixelCanvas'

/**
 * A member's contact sheet, one still: every pose (3x), every face and peek on
 * the head (the 32x32 portrait window at 6x, its 16x16 mini beside it), the
 * mini rig's bare heads, the secondary motion (sway, squash, head offsets,
 * 2x), and every distinct frame of every mood (the full figure at 2x, the
 * portrait and the mini at 3x beside it) with how long it holds. checkArt's
 * problems head it, in red.
 * What an artist looks at while drawing: `node scripts/sheet.mjs <member>`.
 */

export const SHEET_WIDTH = 2400
const PAGE_PAD = 24
const CELL_PAD = 10
const GAP = 10
const LABEL_H = 24
const TITLE_H = 34
const PROBLEM_LINE = 20
const MAX_PROBLEMS = 24
const CHECKER = 'repeating-conic-gradient(#3a3a42 0% 25%, #2c2c33 0% 50%) 0 0 / 12px 12px'

type Pic = { px: Pixels; scale: number }
type Cell = { label: string; main: Pic; side?: Pic[] }
type Section = { title: string; cells: Cell[] }

const FACES: readonly FaceName[] = ['idle', 'half', 'blink', 'glance', 'focus', 'happy', 'panic', 'melt']
const PEEKS: readonly PeekName[] = ['peekL', 'peekR', 'peekBlink']

function same(a: Pixels, b: Pixels): boolean {
  return a.length === b.length && a.every((row, y) => row.every((c, x) => c === (b[y] as (string | null)[])[x]))
}

/** A frame's three pictures: a frame is distinct when any of them changes. */
type Views = { full: Pixels; portrait: Pixels; mini: Pixels }
const sameViews = (a: Views, b: Views) => same(a.full, b.full) && same(a.portrait, b.portrait) && same(a.mini, b.mini)

function scene(s: Partial<Scene> & Pick<Scene, 'pose'>): Scene {
  return { dx: 0, dy: 0, squash: 0, melt: 0, fx: [], ...s }
}

function poseLabel(art: MemberArt, name: (typeof POSES)[number]): string {
  const def = art.poses[name] as PoseDef | undefined
  const head = art.heads?.[name]
  const offset = head && name !== 'box' ? ` · head ${head.dx},${head.dy}` : ''
  if (def === undefined) return `${name} · missing`
  if (!isPatched(def)) return `${name} · grid${offset}`
  return `${name} · ${def.from} + ${def.patches.length} patch${def.patches.length === 1 ? '' : 'es'}${offset}`
}

function safePose(art: MemberArt, name: (typeof POSES)[number]): Pixels {
  try {
    return stamp(blank(), resolvePose(art, name), art.palette, 0, 0)
  } catch {
    return blank()
  }
}

export function sheetSections(member: MemberId): Section[] {
  const art = ART[member]
  const sections: Section[] = []
  sections.push({ title: 'poses (resolved, no face overlay) · 3x', cells: POSES.map(p => ({ label: poseLabel(art, p), main: { px: safePose(art, p), scale: 3 } })) })
  const mini = art.mini
  sections.push({
    title: `faces on stand · peeks on the box · the portrait window at 6x, its mini beside it at 6x (${mini ? 'the mini rig' : 'no mini rig: the portrait halved'})`,
    cells: [
      ...FACES.map(f => {
        const s = scene({ pose: 'stand', face: f })
        return { label: f, main: { px: drawScene(art, s, 'portrait'), scale: 6 }, side: [{ px: drawScene(art, s, 'mini'), scale: 6 }] }
      }),
      ...PEEKS.map(p => {
        const s = scene({ pose: 'box', peek: p })
        return { label: p, main: { px: drawScene(art, s, 'portrait'), scale: 6 }, side: [{ px: drawScene(art, s, 'mini'), scale: 6 }] }
      }),
      ...(mini
        ? [
            { label: 'mini stand (bare)', main: { px: stamp(blank(16, 16), mini.stand, art.palette, 0, 0), scale: 6 } },
            { label: 'mini box (bare)', main: { px: stamp(blank(16, 16), mini.box, art.palette, 0, 0), scale: 6 } },
          ]
        : []),
    ],
  })
  sections.push({
    title: `secondary motion · 2x · bend row ${art.bend}`,
    cells: [
      { label: 'sway L', main: { px: drawScene(art, scene({ pose: 'stand', face: 'idle', sway: 'L' }), 'full'), scale: 2 } },
      { label: 'sway R', main: { px: drawScene(art, scene({ pose: 'stand', face: 'idle', sway: 'R' }), 'full'), scale: 2 } },
      { label: 'squash 1', main: { px: drawScene(art, scene({ pose: 'stand', face: 'idle', squash: 1 }), 'full'), scale: 2 } },
      { label: 'squash 2', main: { px: drawScene(art, scene({ pose: 'stand', face: 'idle', squash: 2 }), 'full'), scale: 2 } },
      { label: 'crouch + idle', main: { px: drawScene(art, scene({ pose: 'crouch', face: 'idle' }), 'full'), scale: 2 } },
      { label: 'cheer + happy', main: { px: drawScene(art, scene({ pose: 'cheer', face: 'happy' }), 'full'), scale: 2 } },
      { label: 'panic + panic', main: { px: drawScene(art, scene({ pose: 'panic', face: 'panic' }), 'full'), scale: 2 } },
    ],
  })
  for (const mood of MOODS) {
    const total = expand(tagFor(art, mood)).length
    const cells: Cell[] = []
    let last: Views | null = null
    let start = 0
    for (let f = 0; f <= total; f += 1) {
      const s = f < total ? sceneAt(art, mood, f) : null
      const views: Views | null = s === null ? null : { full: drawScene(art, s, 'full'), portrait: drawScene(art, s, 'portrait'), mini: drawScene(art, s, 'mini') }
      if (last !== null && (views === null || !sameViews(views, last))) {
        cells.push({ label: `f${start} ${(f - start) * 100}ms`, main: { px: last.full, scale: 2 }, side: [{ px: last.portrait, scale: 3 }, { px: last.mini, scale: 3 }] })
        start = f
      }
      if (last === null) start = f
      last = views
    }
    sections.push({ title: `${mood} · ${total} frames · ${total * 100} ms loop · ${cells.length} distinct`, cells })
  }
  return sections
}

const picW = (p: Pic) => (p.px[0]?.length ?? 0) * p.scale
const picH = (p: Pic) => p.px.length * p.scale

function cellSize(c: Cell): { w: number; h: number } {
  const side = c.side ?? []
  const sideW = side.length > 0 ? GAP + Math.max(...side.map(picW)) : 0
  const sideH = side.length > 0 ? side.reduce((n, p) => n + picH(p), 0) + GAP * (side.length - 1) : 0
  return { w: picW(c.main) + sideW + CELL_PAD * 2, h: Math.max(picH(c.main), sideH) + LABEL_H + CELL_PAD * 2 }
}

function sectionHeight(s: Section): number {
  const sizes = s.cells.map(cellSize)
  const w = Math.max(1, ...sizes.map(z => z.w))
  const h = Math.max(1, ...sizes.map(z => z.h))
  const perRow = Math.max(1, Math.floor((SHEET_WIDTH - PAGE_PAD * 2 + GAP) / (w + GAP)))
  return TITLE_H + Math.ceil(s.cells.length / perRow) * (h + GAP) + 14
}

function headerHeight(member: MemberId): number {
  const n = Math.min(MAX_PROBLEMS + 1, checkArt(ART[member]).length)
  return 64 + (n > 0 ? 8 + n * PROBLEM_LINE : 0)
}

export function sheetHeight(member: MemberId): number {
  return PAGE_PAD * 2 + headerHeight(member) + sheetSections(member).reduce((n, s) => n + sectionHeight(s), 0)
}

export const calculateSheet: CalculateMetadataFunction<{ member: MemberId }> = ({ props }) => ({ width: SHEET_WIDTH, height: sheetHeight(props.member) })

export const Sheet: React.FC<{ member: MemberId }> = ({ member }) => {
  const art = ART[member]
  const problems = checkArt(art)
  const shown = problems.length > MAX_PROBLEMS ? [...problems.slice(0, MAX_PROBLEMS), `... and ${problems.length - MAX_PROBLEMS} more (npm run check)`] : problems
  return (
    <AbsoluteFill style={{ background: '#1b1b1f', color: '#ece6ee', fontFamily: 'Consolas, monospace', padding: PAGE_PAD }}>
      <div style={{ height: headerHeight(member) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: art.accent }}>{art.name}</div>
          <div style={{ fontSize: 15, color: problems.length > 0 ? '#ff5d73' : '#7fd18b' }}>{problems.length > 0 ? `${problems.length} problem${problems.length === 1 ? '' : 's'}` : 'checkArt: ok'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {Object.entries(art.palette).map(([ch, c]) => (
              <div key={ch} title={c} style={{ width: 26, height: 26, background: c, border: '1px solid #555', fontSize: 13, color: '#000', textAlign: 'center', lineHeight: '26px', textShadow: '0 0 2px #fff' }}>
                {ch}
              </div>
            ))}
          </div>
        </div>
        {shown.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            {shown.map((p, i) => (
              <div key={i} style={{ color: '#ff5d73', fontSize: 15, height: PROBLEM_LINE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                - {p}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {sheetSections(member).map(s => (
        <div key={s.title} style={{ height: sectionHeight(s) }}>
          <div style={{ fontSize: 19, color: '#f7a8c9', height: TITLE_H, lineHeight: `${TITLE_H}px` }}>{s.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: GAP }}>
            {s.cells.map((c, i) => (
              <div key={`${s.title}-${i}`} style={{ padding: CELL_PAD, background: '#26262c', borderRadius: 6 }}>
                <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>
                  <div style={{ background: CHECKER }}>
                    <PixelCanvas px={c.main.px} scale={c.main.scale} />
                  </div>
                  {c.side ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                      {c.side.map((p, k) => (
                        <div key={k} style={{ background: CHECKER }}>
                          <PixelCanvas px={p.px} scale={p.scale} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div style={{ fontSize: 14, marginTop: 4, height: LABEL_H - 4, color: '#8a8392', whiteSpace: 'nowrap' }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  )
}
