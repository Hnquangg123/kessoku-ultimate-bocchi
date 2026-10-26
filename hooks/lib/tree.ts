// Kessoku Ultimate Bocchi Theme: the file tree's shape.
//
// Pure: which folders stay out, how paths become rows, and the colour of a
// light by its age. Paths are compared with forward slashes; a Windows drive
// letter makes the comparison case-insensitive, as the file system is.

import type { KessokuLight } from '../../types'

/** Folders the tree never shows, even when git tracks files under them. */
export const ALWAYS_IGNORED = new Set(['.git', 'node_modules', '.claude-plugin'])

/** Folders the fallback walk (no git) stays out of: build output, caches, editors. */
export const IGNORED_DIRS = new Set([
  ...ALWAYS_IGNORED, 'dist', 'build', 'out', '.next', '.nuxt', '.turbo', '.cache', 'coverage',
  'target', '__pycache__', '.venv', 'venv', '.tox', '.mypy_cache', '.pytest_cache', '.idea', '.vscode',
  '.gradle', 'Pods', 'DerivedData', '.terraform', 'vendor', 'bin', 'obj', '.svn', '.hg', '.yarn',
  '.pnpm-store', '.svelte-kit', '.angular', '.parcel-cache', '.dart_tool',
])

export const MAX_PATHS = 600

/** Forward slashes, `\\?\` prefixes dropped, `.` and `..` folded, no trailing slash. */
export function norm(path: string): string {
  let p = path.replace(/\\/g, '/').replace(/^\/\/\?\/UNC\//i, '//').replace(/^\/\/\?\//, '')
  const unc = p.startsWith('//')
  const drive = /^[A-Za-z]:/.exec(p)?.[0] ?? ''
  const rooted = p.startsWith('/') || drive !== ''
  const parts: string[] = []
  for (const seg of p.slice(drive.length).split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      if (parts.length > 0 && parts[parts.length - 1] !== '..') parts.pop()
      else if (!rooted) parts.push('..')
      continue
    }
    parts.push(seg)
  }
  p = `${drive}${unc ? '//' : rooted ? '/' : ''}${parts.join('/')}`
  return p === '' ? '.' : p
}

/** A drive-letter or UNC path: Windows compares them without regard to case. */
function isWindowsPath(path: string): boolean {
  return /^[A-Za-z]:\//.test(path) || /^\/\/[^/]/.test(path)
}

/** A path relative to the project root, forward slashes; the path itself when it is outside. */
export function relPath(root: string, path: string): string {
  const p = norm(path)
  const r = norm(root)
  if (r === '') return p
  const ci = isWindowsPath(r) || isWindowsPath(p)
  const under = ci ? p.toLowerCase().startsWith(r.toLowerCase() + '/') : p.startsWith(r + '/')
  if (under) return p.slice(r.length + 1)
  if (ci ? p.toLowerCase() === r.toLowerCase() : p === r) return ''
  return p
}

/** Whether `path` (absolute or already relative) lies under the root. */
export function isInside(root: string, path: string): boolean {
  const rel = relPath(root, path)
  if (rel === '' || rel.startsWith('..')) return false
  return !rel.startsWith('/') && !isWindowsPath(rel) && !/^[A-Za-z]:/.test(rel)
}

/** The last segment of a root path, for a header. */
export function baseName(path: string): string {
  const parts = norm(path).split('/').filter(Boolean)
  return parts[parts.length - 1] ?? path
}

export type TreeRow = { key: string; depth: number; name: string; isDir: boolean; path: string }

let rowsCache: { paths: readonly string[]; rows: TreeRow[] } | null = null

/** Rows for a sorted list of file paths: folders first at each level, files under them. Memoised on the list's identity. */
export function treeRows(paths: readonly string[]): TreeRow[] {
  if (rowsCache !== null && rowsCache.paths === paths) return rowsCache.rows
  const sorted = [...paths].sort(comparePaths)
  const rows: TreeRow[] = []
  const seen = new Set<string>()
  for (const path of sorted) {
    const parts = path.split('/')
    for (let d = 0; d < parts.length - 1; d += 1) {
      const dir = parts.slice(0, d + 1).join('/')
      if (seen.has(dir)) continue
      seen.add(dir)
      rows.push({ key: `d:${dir}`, depth: d, name: `${parts[d]}/`, isDir: true, path: dir })
    }
    rows.push({ key: `f:${path}`, depth: parts.length - 1, name: parts[parts.length - 1] as string, isDir: false, path })
  }
  rowsCache = { paths, rows }
  return rows
}

function comparePaths(a: string, b: string): number {
  const pa = a.split('/')
  const pb = b.split('/')
  const n = Math.min(pa.length, pb.length)
  for (let i = 0; i < n; i += 1) {
    const aIsLeaf = i === pa.length - 1
    const bIsLeaf = i === pb.length - 1
    if (aIsLeaf !== bIsLeaf) return aIsLeaf ? 1 : -1 // folders before files
    if (pa[i] !== pb[i]) return (pa[i] as string).localeCompare(pb[i] as string)
  }
  return pa.length - pb.length
}

/** How long an `editing` light may wait for the call that finishes it before it fades on its own. */
export const EDITING_MAX_MS = 100_000
/** How long an edited file glows pink after the edit. */
export const EDIT_GLOW_MS = 25_000
/** How long an edited file stays marked (dimly, once the glow is over) so a later commit can light it green. */
export const EDITED_KEEP_MS = 6 * 60 * 60_000
export const READ_GLOW_MS = 8_000
export const COMMIT_GLOW_MS = 90_000

/** Whether a light still shows at `now`: glowing, or remembered as edited and waiting for a commit. */
export function isLit(light: KessokuLight, now: number): boolean {
  const age = now - light.at
  if (light.kind === 'editing') return age < EDITING_MAX_MS
  if (light.kind === 'edited') return age < EDITED_KEEP_MS
  if (light.kind === 'read') return age < READ_GLOW_MS
  return age < COMMIT_GLOW_MS
}

/** Whether a light is in its bright phase (the first seconds), as against merely remembered. */
export function isGlowing(light: KessokuLight, now: number): boolean {
  const age = now - light.at
  if (light.kind === 'editing') return age < EDITING_MAX_MS
  if (light.kind === 'edited') return age < EDIT_GLOW_MS
  return isLit(light, now)
}

/** Whether any file is being edited right now, which is the one state that animates. */
export function isAnyHot(lights: readonly KessokuLight[], now: number): boolean {
  return lights.some(l => l.kind === 'editing' && isLit(l, now))
}

/** The rows to show: a window of `rows` around the newest light, or the top. */
export function windowRows<T extends { path: string }>(rows: readonly T[], focusPath: string | null, count: number): { rows: T[]; above: number; below: number } {
  if (rows.length <= count) return { rows: [...rows], above: 0, below: 0 }
  let start = 0
  if (focusPath !== null) {
    const at = rows.findIndex(r => r.path === focusPath)
    if (at >= 0) start = Math.max(0, Math.min(rows.length - count, at - Math.floor(count / 2)))
  }
  return { rows: rows.slice(start, start + count), above: start, below: rows.length - start - count }
}
