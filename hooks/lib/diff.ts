// Kessoku Ultimate Bocchi Theme: one edit as a unified diff.
//
// Pure: a line diff (common prefix and suffix trimmed, then LCS over the
// middle; a huge middle falls back to remove-all-then-add-all and says so)
// rendered as unified-diff hunks, which the `Code` element draws with gutters
// and colours under `format: 'diff'`. CRLF and LF lines compare equal.

export type DiffOp = { op: ' ' | '-' | '+'; t: string }

const MAX_LCS_LINES = 1500

export function splitLines(text: string | undefined | null): string[] {
  if (text === undefined || text === null || text === '') return []
  const lines = String(text).split(/\r\n|\n|\r/)
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

export type LineDiff = { ops: DiffOp[]; isApproximate: boolean }

/** The line operations turning `oldText` into `newText`, and whether the middle was too large to diff exactly. */
export function diffLinesEx(oldText: string, newText: string): LineDiff {
  const a = splitLines(oldText)
  const b = splitLines(newText)
  // Common prefix and suffix are unchanged lines; only the middle needs the LCS.
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1
  let tail = 0
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1
  const ops: DiffOp[] = []
  for (let i = 0; i < head; i += 1) ops.push({ op: ' ', t: a[i] as string })
  const ma = a.slice(head, a.length - tail)
  const mb = b.slice(head, b.length - tail)
  let isApproximate = false
  if (ma.length > MAX_LCS_LINES || mb.length > MAX_LCS_LINES) {
    isApproximate = true
    for (const t of ma) ops.push({ op: '-', t })
    for (const t of mb) ops.push({ op: '+', t })
  } else {
    ops.push(...lcsOps(ma, mb))
  }
  for (let i = a.length - tail; i < a.length; i += 1) ops.push({ op: ' ', t: a[i] as string })
  return { ops, isApproximate }
}

/** The line operations turning `oldText` into `newText`. */
export function diffLines(oldText: string, newText: string): DiffOp[] {
  return diffLinesEx(oldText, newText).ops
}

function lcsOps(a: string[], b: string[]): DiffOp[] {
  const n = a.length
  const m = b.length
  if (n === 0) return b.map(t => ({ op: '+' as const, t }))
  if (m === 0) return a.map(t => ({ op: '-' as const, t }))
  const w = m + 1
  const dp = new Uint16Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i -= 1) {
    const ai = a[i]
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * w + j] = ai === b[j] ? (dp[(i + 1) * w + j + 1] as number) + 1 : Math.max(dp[(i + 1) * w + j] as number, dp[i * w + j + 1] as number)
    }
  }
  const out: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ op: ' ', t: a[i] as string })
      i += 1
      j += 1
    } else if ((dp[(i + 1) * w + j] as number) >= (dp[i * w + j + 1] as number)) {
      out.push({ op: '-', t: a[i] as string })
      i += 1
    } else {
      out.push({ op: '+', t: b[j] as string })
      j += 1
    }
  }
  while (i < n) out.push({ op: '-', t: a[i++] as string })
  while (j < m) out.push({ op: '+', t: b[j++] as string })
  return out
}

export type Unified = { hunks: string; add: number; del: number; lines: number; isApproximate: boolean }

/**
 * Unified-diff hunks for the change, `context` unchanged lines around each
 * run of changes; runs closer than that merge into one hunk. Line numbers
 * count from `startLine` (1 when the text is a snippet, not a whole file).
 */
export function unifiedDiff(oldText: string, newText: string, context = 2, startLine = 1): Unified {
  const { ops, isApproximate } = diffLinesEx(oldText, newText)
  let add = 0
  let del = 0
  for (const o of ops) {
    if (o.op === '+') add += 1
    else if (o.op === '-') del += 1
  }
  if (add === 0 && del === 0) return { hunks: '', add, del, lines: 0, isApproximate }
  // Which ops to keep: every change, and `context` lines on either side.
  const keep = new Array<boolean>(ops.length).fill(false)
  for (let k = 0; k < ops.length; k += 1) {
    if ((ops[k] as DiffOp).op === ' ') continue
    for (let c = Math.max(0, k - context); c <= Math.min(ops.length - 1, k + context); c += 1) keep[c] = true
  }
  // Walk the ops with running old and new line numbers, cutting hunks where
  // the kept runs break.
  const out: string[] = []
  let oldLine = startLine
  let newLine = startLine
  let k = 0
  let lines = 0
  while (k < ops.length) {
    if (!keep[k]) {
      if ((ops[k] as DiffOp).op !== '+') oldLine += 1
      if ((ops[k] as DiffOp).op !== '-') newLine += 1
      k += 1
      continue
    }
    const start = k
    let end = k
    while (end < ops.length && keep[end]) end += 1
    let oldCount = 0
    let newCount = 0
    const body: string[] = []
    for (let x = start; x < end; x += 1) {
      const o = ops[x] as DiffOp
      if (o.op !== '+') oldCount += 1
      if (o.op !== '-') newCount += 1
      body.push(`${o.op}${o.t}`)
    }
    out.push(`@@ -${oldCount === 0 ? Math.max(0, oldLine - 1) : oldLine},${oldCount} +${newCount === 0 ? Math.max(0, newLine - 1) : newLine},${newCount} @@`)
    out.push(...body)
    lines += body.length
    oldLine += oldCount
    newLine += newCount
    k = end
  }
  return { hunks: out.join('\n'), add, del, lines, isApproximate }
}

/**
 * The first `maxLines` lines of unified-diff text, cut so the result still
 * parses as hunks: whole hunks are kept while they fit, and a hunk cut short
 * gets its header's counts rewritten to the lines actually shown.
 */
export function cutHunks(hunks: string, maxLines: number): { text: string; hidden: number } {
  if (hunks === '') return { text: '', hidden: 0 }
  const lines = hunks.split('\n')
  if (lines.length <= maxLines) return { text: hunks, hidden: 0 }
  const kept: string[] = []
  let headerAt = -1
  let oldCount = 0
  let newCount = 0
  let oldStart = 0
  let newStart = 0
  const closeHunk = (): void => {
    if (headerAt >= 0) kept[headerAt] = `@@ -${oldCount === 0 ? Math.max(0, oldStart - 1) : oldStart},${oldCount} +${newCount === 0 ? Math.max(0, newStart - 1) : newStart},${newCount} @@`
  }
  for (let i = 0; i < lines.length && kept.length < maxLines; i += 1) {
    const line = lines[i] as string
    const header = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/.exec(line)
    if (header !== null) {
      closeHunk()
      headerAt = kept.length
      oldStart = Number(header[1])
      newStart = Number(header[3])
      oldCount = 0
      newCount = 0
      kept.push(line)
      continue
    }
    if (line.startsWith('+')) newCount += 1
    else if (line.startsWith('-')) oldCount += 1
    else {
      oldCount += 1
      newCount += 1
    }
    kept.push(line)
  }
  closeHunk()
  // A header left as the last line shows nothing: drop it.
  if (kept.length > 0 && (kept[kept.length - 1] as string).startsWith('@@')) kept.pop()
  return { text: kept.join('\n'), hidden: Math.max(0, lines.length - kept.length) }
}

/** The tool result's `structuredPatch` entries as unified-diff text with real line numbers. */
export function patchToUnified(patch: ReadonlyArray<{ oldStart: number; oldLines: number; newStart: number; newLines: number; lines: readonly string[] }>): Unified {
  const out: string[] = []
  let add = 0
  let del = 0
  let lines = 0
  for (const h of patch) {
    out.push(`@@ -${h.oldStart},${h.oldLines} +${h.newStart},${h.newLines} @@`)
    for (const l of h.lines) {
      const clean = l.replace(/\r$/, '')
      if (clean.startsWith('+')) add += 1
      else if (clean.startsWith('-')) del += 1
      out.push(clean)
      lines += 1
    }
  }
  return { hunks: out.join('\n'), add, del, lines, isApproximate: false }
}
