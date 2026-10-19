// Kessoku Ultimate Bocchi Theme: tests, run with `claude plugin test <mod folder>`.
//
// The test's `on` sits beneath the mod: it answers every `$` call the mod
// makes (the engine would) and reads what the mod asked for. The pure parts
// are tested directly.

import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { KessokuAgent, KessokuBand, KessokuMember, KessokuMood, KessokuUi } from '../types'
import { BAND_AGENTS, memberFor, memberForTool, parseDuration, fmtTokens, fmtUsd, priceInfo, cacheWriteUsd, describeCall, seatOf, slimeState } from '../hooks/lib/band'
import { classify, classifyPowerShell, isGitCommit } from '../hooks/lib/blast'
import { cutHunks, patchToUnified, unifiedDiff } from '../hooks/lib/diff'
import { FACE_WIDTH, MEMBERS, SPINNER_WORDS_BY_MODE, THEME_OVERRIDES, TURN_WORDS, padFace, textWidth } from '../hooks/lib/palette'
import { MEMO_TOOL, MEMO_TOOL_SPEC, RULE_MAX, appendRule, checkRule, cleanRule, looksLikeCorrection, memoAnswer } from '../hooks/lib/reflect'
import { completions } from '../hooks/lib/typeahead'
import { panelView } from '../hooks/lib/stage'
import { SCENE_COLORS } from '../hooks/lib/scene'
import type { MemberView } from '../hooks/lib/stage'
import { isAtLeast, offLine, parseVersion } from '../hooks/lib/engine'
import { CRASH, CRASH_MINI, SVG_LIMIT, animOf, base64, cellsFor, colorOf, composite, decodeCodes, decodeFrames, drawSvg, encodeCells, frameAt, framePixels, layerFrames, mergeTimeline, pixelsOf, shade, spriteId, spritesSvg, stageGradientId, stageMarkup, viewSize } from '../hooks/lib/sprite'
import type { SpriteAnim, SpriteTable } from '../hooks/lib/sprite'
import { SPRITES, SPRITE_COLORS } from '../hooks/lib/sprites.gen'
import { isInside, relPath, treeRows } from '../hooks/lib/tree'

const PLUGIN = 'kessoku-ultimate-bocchi'
const MEMBERS_HAPPY = '(≧▽≦)'
const THEME_OPTION = 'Kessoku Bocchi (kessoku-ultimate-bocchi)'

/** A slash command as the person typed it. */
const cmd = (command: string, args = '') => ({ command, args, origin: { kind: 'composer' as const }, presentation: { isFullscreen: true, columns: 120 } })
/** A prompt as the person sent it. */
const typed = (text: string) => ({ text, origin: { kind: 'composer' as const }, wait: false })
const SURFACES = ['terminal', 'desktop'] as const

const PANE_PROPS = { title: 'x', isFocused: false, bodyColumns: 80, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 30 }, view: {} }
const BAND_PROPS = { hasSurvey: false, isWorking: false, maxRows: 20, bodyColumns: 100, scroll: { offset: 0, bodyRows: 18 }, view: {} }

type Entry = { name: string; kind: 'file' | 'dir'; size: number; mtimeMs: number; isLink: boolean }
type Registered = { name: string; description: string; prompt?: string; tools?: readonly string[]; inputSchema?: Record<string, unknown>; isDeferred?: boolean }
type Seen = { commands: string[]; status: (string | undefined)[]; toasts: string[]; opened: string[]; closed: string[]; filled: string[]; written: Record<string, string>; sleeps: number; sleepers: string[]; forks: number; configSets: { key: string; value: unknown }[]; theme: string; asks: string[]; askAnswer: string; rendered: Record<string, unknown>; blits: { requestId: string; key: string; isTaken: boolean }[]; suggested: string[]; notified: { text: string; title: string | undefined }[]; agents: Registered[]; tools: Registered[]; drafts: number }
/** What a test may vary in the engine beneath: one bottom per event, so the knobs live here. */
type Answers = { sleepMs?: number; forkCacheRead?: number; gitLsFails?: boolean; os?: string; refuseBlits?: boolean; unplaced?: boolean; compactMs?: number; compactSkip?: string; notifyReason?: 'disabled' | 'no-channel' | 'no-surface' | 'refused'; engineVersion?: string; noVersion?: boolean; refuseRegister?: boolean; writeMs?: number }
const THEME_OPTION_LIGHT = 'Kessoku Bocchi Light (kessoku-ultimate-bocchi)'

/** `C:\proj\x` and `/proj/x` are the same file to the engine's fs; the tests key by the forward-slash spelling. */
function key(path: string): string {
  return path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')
}

const BUILD: Record<string, Entry[]> = {
  '/proj': [
    { name: 'README.md', kind: 'file', size: 10, mtimeMs: 0, isLink: false },
    { name: 'build', kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
    { name: 'node_modules', kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
    { name: 'src', kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
    { name: '.env', kind: 'file', size: 1, mtimeMs: 0, isLink: false },
  ],
  '/proj/src': [
    { name: 'app.ts', kind: 'file', size: 10, mtimeMs: 0, isLink: false },
    { name: 'lib', kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
  ],
  '/proj/src/lib': [{ name: 'util.ts', kind: 'file', size: 10, mtimeMs: 0, isLink: false }],
  '/proj/build': [
    { name: 'css', kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
    { name: 'index.html', kind: 'file', size: 500_000, mtimeMs: 0, isLink: false },
    { name: 'js', kind: 'dir', size: 0, mtimeMs: 0, isLink: false },
  ],
  '/proj/build/js': [{ name: 'app.js', kind: 'file', size: 400_000, mtimeMs: 0, isLink: false }],
  '/proj/build/css': [{ name: 'app.css', kind: 'file', size: 500_000, mtimeMs: 0, isLink: false }],
}

/** The engine beneath the mod: every noun it calls, answered from memory. */
function bottoms(on: On, clock: ReturnType<typeof mock.clock>, seen: Seen, a: Answers = {}): void {
  mock.store(on)
  // The engine's own drawing at every site: what a hook that passes or wraps gets back; the props that reached it are kept for the test.
  on('ui.render', ($, e) => {
    seen.rendered[e.component] = e.props
    return { type: 'engine' as const, ref: 0 }
  })
  on('classic.PostModelSwitch', () => ({}))
  on('session.end', ($, e) => ({ sessionId: e.sessionId }))
  on('model.fork', () => {
    seen.forks += 1
    return { value: { isAnswered: true as const, text: 'ok', usage: { input_tokens: 20, output_tokens: 1, cache_read_input_tokens: a.forkCacheRead ?? 300_000, cache_creation_input_tokens: a.forkCacheRead === undefined ? 0 : 300_000 } } }
  })
  on('ui.status', ($, e) => {
    seen.status.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', ($, e) => {
    seen.toasts.push(e.text)
    return { value: undefined }
  })
  // The person's notification channel: a terminal that takes them, or (a knob) one that cannot send.
  on('ui.notify', ($, e) => {
    seen.notified.push({ text: e.text, title: e.title })
    return { value: a.notifyReason === undefined ? { isSent: true as const, channel: 'kitty' as const } : { isSent: false as const, reason: a.notifyReason } }
  })
  on('ui.open', ($, e) => {
    seen.opened.push(e.id)
    return { value: a.unplaced === true ? { isPlaced: false as const, reason: 'the terminal is too narrow for a pane' } : { isPlaced: true as const } }
  })
  on('ui.close', ($, e) => {
    seen.closed.push(e.id)
    return { value: undefined }
  })
  on('ui.panes', () => ({ value: [] }))
  // The surface takes every repaint of a sprite it holds; the test keeps where each went.
  on('ui.blit', ($, e) => {
    seen.blits.push({ requestId: e.requestId, key: e.key, isTaken: a.refuseBlits !== true })
    return { value: a.refuseBlits === true ? { deny: 'not mounted' } : {} }
  })
  on('command.register', ($, e) => {
    seen.commands.push(e.name)
    return { value: { command: e.name } }
  })
  // The band's agent types and the memo tool, named as the engine names a plugin's own; or (a knob) refused.
  on('agent.register', ($, e) => {
    if (a.refuseRegister) throw new Error('refused by another plugin')
    seen.agents.push(e)
    return { value: { agent: `${PLUGIN}:${e.name}` } }
  })
  on('tool.register', ($, e) => {
    if (a.refuseRegister) throw new Error('refused by another plugin')
    seen.tools.push(e)
    return { value: { tool: `mcp__${PLUGIN}__${e.name}` } }
  })
  on('config.list', () => ({
    value: [{ key: 'theme', label: 'Theme', kind: 'choice' as const, value: seen.theme, options: ['dark', 'light', THEME_OPTION, THEME_OPTION_LIGHT], provider: { plugin: 'engine', tier: 'core' as const }, isLocked: false }],
  }))
  on('config.set', ($, e) => {
    seen.configSets.push({ key: e.key, value: e.value })
    if (e.key === 'theme') seen.theme = String(e.value)
    return { value: e.value }
  })
  on('agent.list', () => ({ value: [] }))
  on('session.cwd', () => ({ value: '/proj' }))
  on('session.root', () => ({ value: '/proj' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200_000, percent: 12, tokens: 24_000 }, rateLimits: [{ kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-10T12:00:00Z' }], cost: { usd: 0.42 } } }))
  on('fs.exists', ($, e) => ({ value: key(e.path) in seen.written }))
  // The mod's own manifest, read for its version; anything else is what a test wrote.
  on('fs.read', ($, e) => ({ value: /\.claude-plugin\/plugin\.json$/.test(key(e.path)) ? '{ "name": "kessoku-ultimate-bocchi", "version": "9.9.9" }' : (seen.written[key(e.path)] ?? '') }))
  on('session.version', () => {
    if (a.noVersion) throw new Error('no such op on this engine')
    const version = a.engineVersion ?? '2.1.299'
    return { value: { version, base: version } }
  })
  // A write lands at once, or (a knob) takes a while on this clock.
  on('fs.write', async ($, e) => {
    if (a.writeMs) await clock.sleep(a.writeMs)
    seen.written[key(e.path)] = e.text
    return { value: undefined }
  })
  on('fs.list', ($, e) => ({ value: BUILD[key(e.path)] ?? [] }))
  on('fs.stat', ($, e) => {
    const p = key(e.path)
    if (p in BUILD) return { value: { kind: 'dir' as const, size: 0, mtimeMs: 0, isLink: false, realPath: e.path } }
    if (p === '/proj') return { value: { kind: 'dir' as const, size: 0, mtimeMs: 0, isLink: false, realPath: e.path } }
    const parent = p.slice(0, p.lastIndexOf('/'))
    const name = p.slice(p.lastIndexOf('/') + 1)
    const en = (BUILD[parent] ?? []).find(x => x.name === name)
    if (en !== undefined) return { value: { kind: en.kind, size: en.size, mtimeMs: 0, isLink: false, realPath: e.path } }
    throw new Error(`ENOENT: ${e.path}`)
  })
  on('env.get', ($, e) => ({ value: e.name === 'OS' ? a.os : undefined }))
  on('prompt.fill', ($, e) => {
    seen.filled.push(e.text)
    return { isFilled: true }
  })
  on('model.complete', () => {
    seen.drafts += 1
    return { value: { isAnswered: true as const, text: 'Always use pnpm instead of npm in this repository.', usage: { input_tokens: 100, output_tokens: 12, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }
  })
  on('process.run', async ($, e) => {
    const argv = e.argv
    const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
    if (argv[0] === 'sleep' || argv[0] === 'powershell' || argv[0] === 'pwsh') {
      seen.sleeps += 1
      seen.sleepers.push(argv.join(' '))
      await clock.sleep(a.sleepMs ?? 250)
      return ok('')
    }
    if (argv[0] === 'git' && argv[1] === 'ls-files') {
      if (a.gitLsFails) return { value: { exitCode: 128, stdout: '', stderr: 'fatal: not a git repository', isStdoutTruncated: false, isStderrTruncated: false } }
      return ok('src/app.ts\nsrc/lib/util.ts\nREADME.md\n')
    }
    if (argv[0] === 'git' && argv[1] === 'clean') return ok('Would remove tmp/a.log\nWould remove tmp/b.log\n')
    if (argv[0] === 'git' && argv[1] === 'status') return ok(' M src/app.ts\nM  src/lib/util.ts\n?? notes.txt\n')
    if (argv[0] === 'git' && argv[1] === 'diff') return ok(' 2 files changed, 10 insertions(+), 3 deletions(-)')
    if (argv[0] === 'git' && argv[1] === 'rev-parse' && argv.includes('--abbrev-ref')) return ok('main\n')
    if (argv[0] === 'git' && argv[1] === 'rev-parse') return ok('abc123\n')
    if (argv[0] === 'git' && argv[1] === 'log') return ok('abc123 fix the thing\ndef456 wip\n')
    return ok('')
  })
  // The engine's own tool bottom: every call that reaches it ran fine; a question is answered as the test says.
  on('tool.call', ($, e) => {
    if (e.tool === 'AskUserQuestion') {
      const questions = (e as unknown as { questions?: { question: string }[] }).questions ?? []
      for (const q of questions) seen.asks.push(q.question)
      return { result: { questions, answers: Object.fromEntries(questions.map(q => [q.question, seen.askAnswer])) } }
    }
    return { result: { ok: true, tool: e.tool } }
  })
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.measure', ($, e) => ({ changed: e.changed }))
  // The prompt box takes every dim suggestion; the typeahead's own rows are none.
  on('prompt.suggest', ($, e) => {
    seen.suggested.push(e.text)
    return { isShown: true }
  })
  on('prompt.autocomplete', () => ({ suggestions: [] }))
  // The engine's own compaction: a summary that takes a while (on this clock), 180k tokens down to 12k, or a veto.
  on('session.compact', async ($, e) => {
    if (a.compactMs) await clock.sleep(a.compactMs)
    if (a.compactSkip !== undefined) return { skip: a.compactSkip }
    return { messages: [{ role: 'user' as const, text: `summary of ${e.messages.length} messages`, toolUses: [] }], tokensBefore: 180_000, tokensAfter: 12_000 }
  })
}

function fresh(): Seen {
  return { commands: [], status: [], toasts: [], opened: [], closed: [], filled: [], written: {}, sleeps: 0, sleepers: [], forks: 0, configSets: [], theme: 'dark', asks: [], askAnswer: 'Not now', rendered: {}, blits: [], suggested: [], notified: [], agents: [], tools: [], drafts: 0 }
}

/** One warm main-thread turn, as the engine would report it: 300k tokens read from the cache. */
function stepBottom(on: On): void {
  on('turn.step', async function* ($, e) {
    return { turnId: e.turnId, index: e.index, answer: 'hi', toolUses: [], stopReason: 'end_turn' as const, usage: { model: 'claude-sonnet-5-5', input_tokens: 2000, output_tokens: 500, cache_read_input_tokens: 300_000, cache_creation_input_tokens: 1000 } }
  })
}

// ---- The pure parts -------------------------------------------------------------

test('classify: the risky commands and the quiet ones', async () => {
  expect(classify('rm -rf build')?.kind).toBe('rm')
  expect(classify('cd sub && rm -r out')?.kind).toBe('rm')
  expect(classify('git reset --hard HEAD~1')?.kind).toBe('git-reset')
  expect(classify('git push --force origin main')?.kind).toBe('git-push-force')
  expect(classify('git push --force-with-lease origin main')?.label).toBe('git push --force-with-lease')
  expect(classify('git clean -fd')?.kind).toBe('git-clean')
  expect(classify('git checkout -- .')?.kind).toBe('git-checkout')
  expect(classify('git restore src/')?.kind).toBe('git-checkout')
  expect(classify('npx prisma migrate dev')?.kind).toBe('migrate')
  expect(classify('bash -c "rm -rf dist"')?.kind).toBe('rm')
  expect(classify('find . -name "*.log" -delete')?.kind).toBe('rm')
  expect(classify('terraform destroy')?.kind).toBe('other')
  expect(classify('ls -la && git status')).toBeNull()
  expect(classify('rm build/tmp.txt')).toBeNull()
  expect(classify('rm -f one-file.txt')).toBeNull()
  expect(classify('rm -f *.log')?.kind).toBe('rm')
  expect(classify('echo migrate')).toBeNull()
  expect(classify('git clean -n')).toBeNull()
  expect(classify('npx prisma migrate status')).toBeNull()
  expect(classify('git checkout -b feature .')).toBeNull()
  // Quoting: a heredoc body, a quoted ';' and a comment are not commands.
  expect(classify('cat > x.js <<EOF\nrm -rf build\nEOF')).toBeNull()
  expect(classify('git commit -m "cleanup; rm -rf old junk"')).toBeNull()
  expect(classify('ls # && rm -rf build')).toBeNull()
  expect(classify('(cd sub && rm -rf out) > log')).toEqual({ kind: 'rm', label: 'rm -rf', targets: ['out'], dir: 'sub' })
  expect(classify('rm -rf $BUILD_DIR')?.kind).toBe('rm')
  expect((classify('rm -rf $BUILD_DIR') as { note?: string }).note).toMatch(/not measured/)
  expect(classify('rm -rf dir/{a,b}')).toMatchObject({ kind: 'rm', targets: [] })
  // Adjacent quoted and bare runs are one word; combined shell flags still unwrap; heredocs belong to the command that opened them.
  expect(classify('NODE_ENV="production" rm -rf dist')?.kind).toBe('rm')
  expect(classify('rm -rf "a b"/c')).toMatchObject({ kind: 'rm', targets: ['a b/c'] })
  expect(classify('bash -lc "rm -rf dist"')?.kind).toBe('rm')
  expect(classify('bash <<EOF | tee log\nrm -rf x\nEOF')?.kind).toBe('rm')
  expect(classify('cat <<\\EOF\nrm -rf x\nEOF')).toBeNull()
  expect(classify('if cd sub; then rm -rf out; fi')?.dir).toBe('sub')
  expect(classify('cmd /c "rd /s /q build"')?.kind).toBe('rm')
  expect(classify('powershell -Command "Remove-Item -Recurse build"')?.kind).toBe('rm')
  expect(classify('npx -y rimraf dist')?.kind).toBe('rm')
  expect(classify('pnpm dlx rimraf dist')?.kind).toBe('rm')
  expect(classify('grep -r "DROP TABLE" src/')).toBeNull()
  expect(classify('kubectl delete pod x --dry-run=client')).toBeNull()
  expect(classify('git push -fu origin main')?.kind).toBe('git-push-force')
  expect(classify('git push --force --dry-run origin main')).toBeNull()
  expect(classify('git worktree remove --force ../wt')?.kind).toBe('other')
  expect(classify('git switch --discard-changes main')?.kind).toBe('other')
  expect(classify('php artisan migrate:status')).toBeNull()
  expect(classify('migrate -path db -database postgres://x up')?.kind).toBe('migrate')
  expect(isGitCommit('git commit -m "x"')).toBe(true)
  expect(isGitCommit('git add . && git commit -m "x"')).toBe(true)
  expect(isGitCommit('git -C "my dir" commit -m x')).toBe(true)
  expect(isGitCommit('git commit -n -m "skip hooks"')).toBe(true)
  expect(isGitCommit('git commit --dry-run')).toBe(false)
  expect(isGitCommit('git status')).toBe(false)
  expect(isGitCommit('git commit-tree HEAD^{tree}')).toBe(false)
})

test('classifyPowerShell: Remove-Item and friends, git, and the quiet ones', async () => {
  expect(classifyPowerShell('Remove-Item -Recurse -Force build')?.kind).toBe('rm')
  expect(classifyPowerShell('ri -r -fo build')?.kind).toBe('rm')
  expect(classifyPowerShell('rd /s /q build')?.kind).toBe('rm')
  expect(classifyPowerShell('Remove-Item -Path a,b -Recurse')).toEqual({ kind: 'rm', label: 'Remove-Item -Recurse', targets: ['a', 'b'], dir: null })
  expect(classifyPowerShell('cd sub; Remove-Item -Recurse out')?.dir).toBe('sub')
  expect(classifyPowerShell('git reset --hard')?.kind).toBe('git-reset')
  expect(classifyPowerShell('Remove-Item -Recurse build -WhatIf')).toBeNull()
  // Script blocks, pipelines, line continuations, common parameters and nested shells.
  expect(classifyPowerShell('if (Test-Path build) { Remove-Item -Recurse -Force build }')?.kind).toBe('rm')
  expect(classifyPowerShell('Get-ChildItem *.log -Recurse | Remove-Item -Force')).toMatchObject({ kind: 'rm', targets: [] })
  expect(classifyPowerShell('Remove-Item `\n  -Recurse `\n  -Force build')?.kind).toBe('rm')
  expect(classifyPowerShell('Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue 2>$null')).toMatchObject({ kind: 'rm', targets: ['build'] })
  expect(classifyPowerShell('Remove-Item "build", "dist" -Recurse')).toMatchObject({ kind: 'rm', targets: ['build', 'dist'] })
  expect(classifyPowerShell('cmd /c "rd /s /q build"')?.kind).toBe('rm')
  expect(classifyPowerShell('bash -c "rm -rf build"')?.kind).toBe('rm')
  expect(classifyPowerShell('Select-String "DROP TABLE" *.sql')).toBeNull()
  expect(classifyPowerShell('Get-ChildItem migrate')).toBeNull()
  expect(classifyPowerShell('Remove-Item -Force one.txt')).toBeNull()
  expect(classifyPowerShell('Get-ChildItem -Recurse')).toBeNull()
  expect(classifyPowerShell('git commit -m "a; Remove-Item -Recurse x"')).toBeNull()
})

test('unifiedDiff: hunks the Code element can read, CRLF or LF', async () => {
  const d = unifiedDiff('a\nb\nc\nd\ne\nf\n', 'a\nb\nC\nd\ne\nf\n')
  expect(d.add).toBe(1)
  expect(d.del).toBe(1)
  expect(d.hunks.split('\n')[0]).toBe('@@ -1,5 +1,5 @@')
  expect(d.hunks).toContain('-c')
  expect(d.hunks).toContain('+C')
  const fresh = unifiedDiff('', 'one\ntwo\n')
  expect(fresh.hunks.split('\n')[0]).toBe('@@ -0,0 +1,2 @@')
  expect(fresh.add).toBe(2)
  expect(unifiedDiff('same\n', 'same\n').hunks).toBe('')
  expect(unifiedDiff('a\r\nb\r\n', 'a\nb\n').hunks).toBe('')
  const big = Array.from({ length: 401 }, (_, i) => `line ${i}`)
  const changed = [...big]
  changed[200] = 'changed'
  const bigDiff = unifiedDiff(`${big.join('\n')}\n`, `${changed.join('\n')}\n`)
  expect([bigDiff.add, bigDiff.del, bigDiff.isApproximate]).toEqual([1, 1, false])
  expect(bigDiff.hunks.split('\n')[0]).toBe('@@ -199,5 +199,5 @@')
  expect(patchToUnified([{ oldStart: 10, oldLines: 3, newStart: 10, newLines: 3, lines: [' a', '-b', '+B', ' c'] }]).hunks).toBe('@@ -10,3 +10,3 @@\n a\n-b\n+B\n c')
  // A window over a long diff keeps a parseable hunk: the header counts follow the lines shown.
  const long = unifiedDiff(Array.from({ length: 30 }, (_, i) => `l${i}`).join('\n'), Array.from({ length: 30 }, (_, i) => `L${i}`).join('\n'))
  const win = cutHunks(long.hunks, 5)
  expect(win.text.split('\n')).toEqual(['@@ -1,4 +0,0 @@', '-l0', '-l1', '-l2', '-l3'])
  expect(win.hidden).toBe(long.hunks.split('\n').length - 5)
  expect(cutHunks(long.hunks, 1000)).toEqual({ text: long.hunks, hidden: 0 })
})

test('memberFor: the band takes the work by its kind', async () => {
  expect(memberFor({ type: 'general-purpose', description: 'Plan the rollout and coordinate the steps', prompt: '', background: false })).toBe('nijika')
  expect(memberFor({ type: 'general-purpose', description: 'Update the README and the docs page', prompt: '', background: false })).toBe('kita')
  expect(memberFor({ type: 'general-purpose', description: 'Refactor the database query layer', prompt: '', background: true })).toBe('ryo')
  expect(memberFor({ type: 'Explore', description: 'Look around', prompt: '', background: false })).toBe('ryo')
  expect(memberFor({ type: 'general-purpose', description: 'Implement the feature', prompt: 'Build it end to end.', background: false })).toBe('bocchi')
  expect(memberForTool('PowerShell')).toBe('ryo')
  expect(memberForTool('Skill')).toBe('nijika')
  expect(memberForTool('mcp__github__create_issue')).toBe('ryo')
  expect(memberForTool('Edit')).toBe('kita')
  expect(memberForTool(MEMO_TOOL)).toBe('nijika')
})

test('memberFor: a band agent type seats by name before any keyword runs; other types keep the tables', async () => {
  // The engine's spelling of a plugin's own type, and the short one, in any case.
  expect(seatOf('kessoku-ultimate-bocchi:ryo')).toBe('ryo')
  expect(seatOf('kessoku:nijika')).toBe('nijika')
  expect(seatOf('Kessoku:Kita')).toBe('kita')
  expect(seatOf('kessoku:bocchi')).toBe('bocchi')
  for (const other of ['kessoku:drummer', 'kessoku:', 'ryo', 'other-plugin:ryo', 'kessoku-ultimate-bocchi:ryo:x', 'general-purpose', 'Explore', '']) expect(seatOf(other)).toBeNull()
  // By name, whatever the words say: a Ryo type asked to plan is still Ryo's act.
  expect(memberFor({ type: 'kessoku-ultimate-bocchi:ryo', description: 'Plan the rollout and coordinate the steps', prompt: '', background: false })).toBe('ryo')
  expect(memberFor({ type: 'kessoku:kita', description: 'Refactor the database query layer', prompt: '', background: true })).toBe('kita')
  expect(memberFor({ type: 'kessoku:nijika', description: 'Update the README', prompt: '', background: false })).toBe('nijika')
  // Unknown names and plain types fall through to today's tables, unchanged.
  expect(memberFor({ type: 'kessoku:drummer', description: 'Update the README and the docs page', prompt: '', background: false })).toBe('kita')
  expect(memberFor({ type: 'Plan', description: 'Look around', prompt: '', background: false })).toBe('nijika')
  expect(memberFor({ type: 'general-purpose', description: 'Look into why the strip flickers on resize', prompt: 'Read hooks/register.tsx around drawStrip.', background: false })).toBe('bocchi')
})

test('the band agent types: three specs, each with a when-to-delegate line, a whole prompt and a tool list that fits the part', async () => {
  expect(BAND_AGENTS.map(a => a.name)).toEqual(['nijika', 'ryo', 'kita'])
  for (const a of BAND_AGENTS) {
    // A short name the engine takes (letters, digits, _ and -, up to 64), seated by name once it is `<plugin>:<name>`.
    expect(a.name).toMatch(/^[A-Za-z0-9_-]{1,64}$/)
    expect(seatOf(`kessoku-ultimate-bocchi:${a.name}`)).toBe(a.name)
    expect(a.description).toMatch(/Delegate /)
    expect(a.description.length).toBeLessThan(320)
    // The prompt replaces the session's: it says who she works for and that her last message is all the main agent reads.
    expect(a.prompt).toMatch(/subagent for the main agent/)
    expect(a.prompt).toMatch(/final message is the only thing the main agent sees/)
    expect(a.tools.length).toBeGreaterThan(0)
    expect(a.tools).toContain('Read')
    expect(a.tools.every(t => t !== 'Agent')).toBe(true)
  }
  const [nijika, ryo, kita] = BAND_AGENTS
  const writes = ['Edit', 'Write', 'NotebookEdit']
  // Nijika edits nothing and runs nothing; Ryo is read-only plus the shells; Kita has Read, Edit and Write.
  expect(nijika?.tools.some(t => writes.includes(t) || t === 'Bash' || t === 'PowerShell')).toBe(false)
  expect(nijika?.prompt).toMatch(/numbered plan/)
  expect(nijika?.prompt).toMatch(/verdict/)
  expect(ryo?.tools.some(t => writes.includes(t))).toBe(false)
  expect(ryo?.tools).toContain('Bash')
  expect(ryo?.tools).toContain('PowerShell')
  expect(ryo?.prompt).toMatch(/short lines/)
  expect(kita?.tools).toEqual(['Read', 'Edit', 'Write'])
  expect(kita?.prompt).toMatch(/every file you touched/)
})

test('the memo tool: its spec, the check a proposed rule passes, and what the call answers', async () => {
  expect(MEMO_TOOL).toBe(`mcp__${PLUGIN}__${MEMO_TOOL_SPEC.name}`)
  expect(MEMO_TOOL_SPEC.description).toMatch(/press Save/)
  expect(MEMO_TOOL_SPEC.inputSchema.required).toEqual(['rule'])
  expect(Object.keys(MEMO_TOOL_SPEC.inputSchema.properties)).toEqual(['rule', 'why'])
  // Cleaned as it would be saved: spaces collapsed, a list marker or a matched pair of quotes dropped, a full stop added.
  expect(checkRule('Use pnpm, not npm, for every script in this repository.')).toEqual({ rule: 'Use pnpm, not npm, for every script in this repository.' })
  expect(checkRule('  - "Use   pnpm, not npm"  ')).toEqual({ rule: 'Use pnpm, not npm.' })
  expect(checkRule('Name test files *.test.ts, e.g. Foo.test.ts.')).toEqual({ rule: 'Name test files *.test.ts, e.g. Foo.test.ts.' })
  expect(checkRule('Run the build with v1.2. Never with v1.1.')).toHaveProperty('why')
  expect(checkRule('Say "done."')).toEqual({ rule: 'Say "done."' })
  // Refused, each with why.
  const why = (input: unknown) => {
    const r = checkRule(input)
    return 'why' in r ? r.why : ''
  }
  expect(why('')).toMatch(/empty/)
  expect(why(42)).toMatch(/empty/)
  expect(why(undefined)).toMatch(/empty/)
  expect(why('Use pnpm.\nNever npm.')).toMatch(/several lines/)
  expect(why('Use pnpm. Never use npm.')).toMatch(/2 sentences/)
  expect(why('Use pnpm! Then lint? Then test.')).toMatch(/3 sentences/)
  expect(why('!!! ???')).toMatch(/no words/)
  expect(why(`Always ${'x'.repeat(RULE_MAX)}`)).toMatch(new RegExp(`keep it under ${RULE_MAX}`))
  expect('rule' in checkRule(`${'a'.repeat(RULE_MAX - 2)}.`)).toBe(true)
  expect('rule' in checkRule(`${'a'.repeat(RULE_MAX - 1)}.`)).toBe(false)
  // The answers say the rule is held, never written.
  for (const kind of ['open', 'queued', 'duplicate'] as const) {
    expect(memoAnswer(kind, 2)).toMatch(/^(Held|Already held) for the user/)
    expect(memoAnswer(kind, 2)).toMatch(/Nothing is written until the user presses Save/)
  }
  expect(memoAnswer('queued', 2)).toMatch(/2 waiting/)
  expect(describeCall(MEMO_TOOL, { rule: 'Use pnpm, not npm.' }, '/proj')).toBe('memo "Use pnpm, not npm."')
})

test('reflect: corrections are spotted, questions and chatter are not, rules cleaned and appended once', async () => {
  for (const s of ['no — in this repo we always use pnpm, not npm', "don't use any, type the props properly", 'please use tabs in this repo', 'We write tests in Vitest here, not Jest', 'Prefer named exports over default exports', 'The API is at /v2 now, not /v1', 'I said use the existing helper', 'stop using moment, we moved to date-fns', 'not like that, keep the imports sorted']) {
    expect(looksLikeCorrection(s)).toBe(true)
  }
  for (const s of ['what does this function do?', '/replay', 'no problem, go ahead with the plan', 'remember to run the tests after', 'stop the dev server please', 'never mind, leave it', 'Can I use fetch instead of axios here?', 'in this repo, where is the auth code?', "don't worry about the tests for now", 'always been flaky, this config', 'avoid breaking the api tests']) {
    expect(looksLikeCorrection(s)).toBe(false)
  }
  expect(cleanRule('```\nAlways use pnpm.\n```')).toBe('Always use pnpm.')
  expect(cleanRule('"Keep quotes" balanced')).toBe('"Keep quotes" balanced.')
  expect(cleanRule('"Always use pnpm instead of npm in this repository"')).toBe('Always use pnpm instead of npm in this repository.')
  expect(cleanRule('NONE')).toBe('')
  expect(cleanRule('2 spaces for indentation, not tabs')).toBe('2 spaces for indentation, not tabs.')
  expect(cleanRule('1. Use pnpm')).toBe('Use pnpm.')
  const once = appendRule('# CLAUDE.md\n', 'Always use pnpm.')
  expect(once).toContain('- Always use pnpm.')
  expect(appendRule(once, 'Always use pnpm.')).toBe(once)
  expect(appendRule('# A\r\n\r\n## Band notes (from Reflect)\r\n- Old.\r\n', 'New.')).toBe('# A\r\n\r\n## Band notes (from Reflect)\r\n- Old.\r\n- New.\r\n')
  expect(appendRule('# A\n\n## Band notes (from Reflect)\n- Old.\n\n## Build\n- make\n', 'New.')).toBe('# A\n\n## Band notes (from Reflect)\n- Old.\n- New.\n\n## Build\n- make\n')
  expect(appendRule('# A\n~~~\n## Band notes (from Reflect)\n~~~\n', 'X.')).toBe('# A\n~~~\n## Band notes (from Reflect)\n~~~\n\n## Band notes (from Reflect)\n- X.\n')
})

test('small helpers: durations, formats, prices, paths, faces', async () => {
  expect(parseDuration('90m')).toBe(90 * 60_000)
  expect(parseDuration('1h30m')).toBe(90 * 60_000)
  expect(parseDuration('1h30')).toBe(90 * 60_000)
  expect(parseDuration('1.5h')).toBe(90 * 60_000)
  expect(parseDuration('45')).toBe(45 * 60_000)
  expect(parseDuration('1m30')).toBe(90_000)
  expect(parseDuration('0')).toBeNull()
  expect(parseDuration('soon')).toBeNull()
  expect(fmtTokens(12_400)).toBe('12.4k')
  expect(fmtTokens(330_316)).toBe('330k')
  expect(fmtTokens(99_950)).toBe('100k')
  expect(fmtUsd(99.95)).toBe('$100')
  expect(priceInfo('claude-fable-5-1')).toEqual({ price: { input: 10, output: 50, cacheRead: 0.25, cacheWrite: 12.5, cacheWriteHour: 20 }, isExact: true })
  expect(priceInfo('claude-opus-5-5').price.input).toBe(4)
  expect(priceInfo('claude-sonnet-5-5').price.cacheRead).toBe(0.1)
  expect(priceInfo('claude-haiku-4-5-20251001').price.input).toBe(1)
  expect(priceInfo('claude-sonnet-9').isExact).toBe(false)
  expect(cacheWriteUsd(1_000_000, 'claude-sonnet-5-5', 60 * 60_000)).toBe(4)
  const rows = treeRows(['src/app.ts', 'src/lib/util.ts', 'README.md'])
  expect(rows.map(r => r.name)).toEqual(['src/', 'lib/', 'util.ts', 'app.ts', 'README.md'])
  expect(relPath('D:\\Develop\\proj', 'd:\\develop\\proj\\src\\a.ts')).toBe('src/a.ts')
  expect(relPath('D:\\Develop\\proj\\', 'D:\\Develop\\proj\\src\\..\\a.ts')).toBe('a.ts')
  expect(relPath('\\\\server\\share\\proj', '\\\\SERVER\\Share\\proj\\a.ts')).toBe('a.ts')
  expect(isInside('D:\\Develop\\proj', 'C:\\Users\\x\\CLAUDE.md')).toBe(false)
  expect(isInside('/proj', '/proj/src/../../etc/passwd')).toBe(false)
  expect(describeCall('Edit', { file_path: 'D:\\Develop\\proj\\hooks\\a.tsx' }, 'D:\\Develop\\proj')).toBe('Edit hooks/a.tsx')
  expect(describeCall('PowerShell', { command: 'Get-ChildItem' }, '/proj')).toBe('PS> Get-ChildItem')
  expect(describeCall('mcp__github__create_issue', {}, '/proj')).toBe('github: create_issue')
  for (const card of Object.values(MEMBERS)) {
    for (const face of Object.values(card.faces)) {
      expect(textWidth(face) <= FACE_WIDTH).toBe(true)
      expect(textWidth(padFace(face))).toBe(FACE_WIDTH)
    }
  }
  for (const token of ['claude', 'promptBorder', 'diffAdded', 'userMessageBackground', 'pink_FOR_SUBAGENTS_ONLY', 'rainbow_violet_shimmer']) expect(THEME_OVERRIDES[token]).toMatch(/^#[0-9a-f]{6}$/i)
})

// ---- The mod in the engine ---------------------------------------------------------

test('session.start registers the commands, opens the panel and seats Bocchi in the status line', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect(seen.commands.sort()).toEqual(['bocchi', 'cache-tax', 'filetree', 'keepwarm', 'kessoku', 'replay'])
  expect(seen.opened).toContain('kessoku-band')
  expect(seen.status.at(-1)).toMatch(/bocchi/)
  // The band's agent types and the memo tool, for the model from the next turn on.
  expect(seen.agents.map(a => a.name)).toEqual(['nijika', 'ryo', 'kita'])
  expect(seen.agents.map(a => a.tools)).toEqual(BAND_AGENTS.map(a => a.tools))
  expect(seen.agents.every(a => (a.prompt ?? '').length > 200)).toBe(true)
  expect(seen.tools.map(t => t.name)).toEqual(['memo'])
  expect(seen.tools[0]?.isDeferred).toBe(false)
  expect(seen.tools[0]?.inputSchema).toMatchObject({ type: 'object', required: ['rule'] })
})

test('a headless run registers the band types and the memo tool too; reflect off leaves the tool out', { options: { reflect: false, applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
  expect(seen.agents.map(a => a.name)).toEqual(['nijika', 'ryo', 'kita'])
  expect(seen.tools).toEqual([])
  // Called anyway (a tool registered before the option changed): refused, nothing drafted, no card.
  const call = await $.tool.call({ tool: MEMO_TOOL, rule: 'Use pnpm, not npm.' })
  expect(call.deny).toMatch(/memos are off/)
  expect(seen.drafts).toBe(0)
})

test('the engine theme is offered once, switched on when accepted, and restored by /bocchi theme off', async ($, on) => {
  const seen = fresh()
  seen.askAnswer = 'Yes, tune up'
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect(seen.configSets).toEqual([])
  await clock.advance(2000)
  expect(seen.asks.length).toBe(1)
  expect(seen.asks[0]).toMatch(/Kessoku Bocchi theme/)
  expect(seen.configSets).toEqual([{ key: 'theme', value: THEME_OPTION }])
  expect(seen.toasts.some(t => /theme on/.test(t))).toBe(true)
  // Asked once: a reload (session.start again, the store remembering) brings no second dialog.
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await clock.advance(2000)
  expect(seen.asks.length).toBe(1)
  const status = await $.command.run(cmd('bocchi', 'theme'))
  expect(status.text).toMatch(/current theme is Kessoku Bocchi/)
  const off = await $.command.run(cmd('bocchi', 'theme off'))
  expect(off.text).toMatch(/back to dark/)
  expect(seen.configSets.at(-1)).toEqual({ key: 'theme', value: 'dark' })
  const on2 = await $.command.run(cmd('bocchi', 'theme on'))
  expect(on2.text).toMatch(/on:/)
  expect(seen.theme).toBe(THEME_OPTION)
})

test('a declined offer is remembered, and applyTheme off asks nothing', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await clock.advance(2000)
  expect(seen.asks.length).toBe(1)
  expect(seen.configSets).toEqual([])
  expect(seen.toasts.some(t => /bocchi theme on/.test(t))).toBe(true)
  // Declined once is declined for good: a reload asks nothing more.
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await clock.advance(2000)
  expect(seen.asks.length).toBe(1)
})

test('a desktop-style host (no surface at start) gets the screen work once its client attaches, and the guard still holds there', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  on('session.attach', ($, e) => ({ clientId: e.clientId }))
  await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
  expect(seen.opened).toEqual([])
  await $.session.attach({ surface: 'desktop', clientId: 'desktop:default' })
  expect(seen.opened).toContain('kessoku-band')
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await clock.settle()
  expect(seen.opened).toContain('kessoku-blast-radius')
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  await pane.press({ key: 'blast-cancel' })
  await clock.advance(300)
  expect((await call).deny).toMatch(/caught the guitar/)
  await pane.unmount()
})

test('on Windows the hold waits through PowerShell, not a sleep binary', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { os: 'Windows_NT' })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await clock.settle()
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  await pane.press({ key: 'blast-cancel' })
  await clock.advance(500)
  expect((await call).deny).toMatch(/caught the guitar/)
  expect(seen.sleepers.length > 0).toBe(true)
  expect(seen.sleepers.every(s => s.startsWith('powershell -NoProfile -NonInteractive'))).toBe(true)
  await pane.unmount()
})

test('applyTheme off: no dialog', { options: { applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await clock.advance(3000)
  expect(seen.asks).toEqual([])
  expect(seen.configSets).toEqual([])
})

test('the strip and the panel draw on the terminal and the desktop', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  // A terminal: cells and text.
  const strip = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await strip.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  // Between turns: OFF AIR, backstage; the newest running act is what plays.
  expect(await strip.find({ type: 'Text', text: /OFF AIR/ })).toBeDefined()
  expect(await strip.find({ type: 'Text', text: /^ · NOW PLAYING · $/ })).toBeDefined()
  expect(await strip.find({ type: 'Text', text: /^Ryo$/ })).toBeDefined()
  expect(await strip.find({ type: 'Text', text: /Find every call site of legacyQuery/ })).toBeDefined()
  await strip.unmount()
  const panel = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect(await panel.find({ type: 'Text', text: /KESSOKU BAND/ })).toBeDefined()
  expect(await panel.find({ type: 'Text', text: /legacyQuery/ })).toBeDefined()
  expect(await panel.find({ type: 'Text', text: /README/ })).toBeDefined()
  // The rail: the session's figures behind labels.
  expect(await panel.find({ type: 'Text', text: /^CTX .* · PLAN .*42% · GATE \$0\.42 · AMP / })).toBeDefined()
  await panel.unmount()
  // The desktop: the live house, pictures whose words say the same.
  const sign = await sceneOf(await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS }))
  expect(sign['strip-sign']?.alt).toMatch(/^Off air · now playing · Ryo · Find every call site of legacyQuery\(\) · 0:17 · 3 on stage · \$0\.42 · 1 failed$/)
  const desk = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const scene = await sceneOf(desk)
  expect(scene['scene-stage']?.alt).toBe('Kessoku Band on stage, between sets: Bocchi resting (anxious); Nijika playing 1 (focused); Ryo playing 2 (focused); Kita resting (happy), 1 failed')
  expect(scene['scene-stage']?.isInteractive).toBe(false)
  expect(Object.values(scene).some(s => /Find every call site of legacyQuery\(\)/.test(s.alt))).toBe(true)
  expect(Object.values(scene).some(s => /README/.test(s.alt))).toBe(true)
  expect(scene['scene-foot']?.alt).toMatch(/session \$0\.42 · ctx \d+% · plan 42% · cache /)
  expect(await desk.find({ type: 'Button', key: 'solo-ryo' })).toBeDefined()
  await desk.unmount()
})

test('Blast Radius holds rm -rf behind the dropped guitar, measures it through the file system, and Cancel refuses it', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await clock.settle()
  expect(seen.opened).toContain('kessoku-blast-radius')
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  expect(await pane.find({ type: 'Text', text: /DROPPED GUITAR/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /delete 3 files \(about 1\.3 MB\)/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /build\/js\/app\.js/ })).toBeDefined()
  await pane.press({ key: 'blast-cancel' })
  await clock.advance(300)
  const ran = await call
  expect(ran.deny).toMatch(/caught the guitar/)
  expect(seen.closed).toContain('kessoku-blast-radius')
  await pane.unmount()
})

test('Blast Radius lets Proceed through, holds PowerShell too, and quiet commands pass untouched', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const quiet = await $.tool.call({ tool: 'Bash', command: 'ls -la' })
  expect(quiet.deny).toBeUndefined()
  const quietPs = await $.tool.call({ tool: 'PowerShell', command: 'Get-ChildItem -Recurse' })
  expect(quietPs.deny).toBeUndefined()
  const call = $.tool.call({ tool: 'Bash', command: 'git reset --hard' })
  await clock.settle()
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  await pane.press({ key: 'blast-proceed' })
  await clock.advance(300)
  const ran = await call
  expect(ran.deny).toBeUndefined()
  expect(seen.toasts.some(t => /guitar fell/.test(t))).toBe(true)
  await pane.unmount()
  const ps = $.tool.call({ tool: 'PowerShell', command: 'Remove-Item -Recurse -Force build' })
  await clock.settle()
  const pane2 = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  expect(await pane2.find({ type: 'Text', text: /Remove-Item/ })).toBeDefined()
  expect(await pane2.find({ type: 'Text', text: /delete 3 files/ })).toBeDefined()
  await pane2.press({ key: 'blast-cancel' })
  await clock.advance(300)
  expect((await ps).deny).toMatch(/caught the guitar/)
  await pane2.unmount()
})

test('Cache Tax holds a cold send once, puts the prompt back, and lets the second send through', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const step = $.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await clock.advance(61 * 60_000)
  const held = await $.prompt.submit(typed('where were we?'))
  expect(held.drop).toMatch(/CACHE TAX/)
  expect(held.drop).toMatch(/30[34]k tokens/)
  await clock.advance(500)
  expect(seen.filled).toContain('where were we?')
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await band.find({ type: 'Text', text: /CACHE TAX/ })).toBeDefined()
  await band.unmount()
  const sent = await $.prompt.submit(typed('where were we?'))
  expect(sent.drop).toBeUndefined()
  expect(sent.text).toBe('where were we?')
})

test('Bocchi hides in her box when a call is turned down, and while the cache is cold until the next prompt', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  on('tool.call', { tool: 'Write' }, () => ({ deny: "The user doesn't want to proceed with this tool use." }))
  bottoms(on, clock, seen)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'write the notes', turnId: 't1' })
  // Told no: into the box for a moment, then back to playing.
  const denied = await $.tool.call({ tool: 'Write', file_path: '/proj/notes.md', content: 'x', tool_use_id: 'tu-write' })
  expect(denied.deny).toBeDefined()
  expect(seen.status.at(-1)).toBe(`${MEMBERS.bocchi.faces.hiding} bocchi · told no… hiding in the box`)
  await clock.advance(6100)
  expect(seen.status.at(-1)?.startsWith(`${MEMBERS.bocchi.faces.focused} bocchi · `)).toBe(true)
  // The mod's own memo refusals are no one's no.
  expect((await $.tool.call({ tool: MEMO_TOOL, rule: '', tool_use_id: 'tu-memo' })).deny).toBeDefined()
  expect(seen.status.at(-1)).not.toMatch(/told no/)
  const step = $.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await $.turn.complete({ turnId: 't1', answer: 'done', durationMs: 1200, isAborted: false, reason: 'answer' })
  // Warm: she waits; cold (the TTL gone, nobody playing): in her box, on the stage too, until the next prompt.
  await clock.advance(30 * 60_000)
  expect(seen.status.at(-1)).not.toMatch(/box/)
  await clock.advance(31 * 60_000)
  expect(seen.status.at(-1)).toBe(`${MEMBERS.bocchi.faces.hiding} bocchi · the cache went cold… in the box till your next prompt`)
  const desk = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(desk))['scene-stage']?.alt).toMatch(/: Bocchi resting \(hiding\);/)
  await desk.unmount()
  // The next prompt brings her out.
  await $.turn.start({ text: 'where were we?', turnId: 't2' })
  expect(seen.status.at(-1)).toMatch(/where were we\?/)
  await $.turn.complete({ turnId: 't2', answer: 'here', durationMs: 900, isAborted: false, reason: 'answer' })
  await clock.advance(61 * 60_000)
  expect(seen.status.at(-1)).toMatch(/cache went cold/)
  // /clear starts the room over: she waits again, and the line says so.
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  expect(seen.status.at(-1)).toBe(`${MEMBERS.bocchi.faces.anxious} bocchi · ${MEMBERS.bocchi.lines.anxious}`)
  await clock.advance(61 * 60_000)
  expect(seen.status.at(-1)).not.toMatch(/box/)
})

test('Cache Tax never holds a prompt nobody can resend (an SDK host, a -p run)', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
  const step = $.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await clock.advance(61 * 60_000)
  const sent = await $.prompt.submit({ text: 'where were we?', origin: { kind: 'sdk' as const }, wait: false })
  expect(sent.drop).toBeUndefined()
  expect(seen.filled).toEqual([])
})

test('a correction becomes a band memo that Save writes to CLAUDE.md', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const sent = await $.prompt.submit(typed('no — in this repo we always use pnpm, not npm'))
  expect(sent.drop).toBeUndefined()
  await clock.advance(100)
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await band.find({ type: 'Text', text: /pnpm/ })).toBeDefined()
  await band.press({ key: 'memo-save' })
  await clock.settle()
  expect(seen.written['/proj/CLAUDE.md']).toContain('- Always use pnpm instead of npm in this repository.')
  expect(seen.toasts.some(t => /Nijika wrote it down/.test(t))).toBe(true)
  await band.unmount()
})

test('the memo tool puts a proposed rule on Nijika\'s card with its byline, queues the next, and Save still writes', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'agent-kita' }))
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'run the checks', turnId: 't1' })
  const proposed = await $.tool.call({ tool: MEMO_TOOL, rule: 'Use pnpm, not npm, for every script in this repository', why: 'ran npm twice; package.json has a pnpm lockfile' })
  expect(proposed.deny).toBeUndefined()
  expect(String(proposed.result)).toMatch(/^Held for the user: Nijika's memo card is up/)
  expect(String(proposed.result)).toMatch(/Nothing is written until the user presses Save/)
  // The rule arrived written: no Haiku call, and nothing on disk yet.
  expect(seen.drafts).toBe(0)
  expect(seen.written['/proj/CLAUDE.md']).toBeUndefined()
  for (const surface of SURFACES) {
    const band = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
    expect(await band.find({ type: 'Text', text: /^ BAND MEMO $/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /BAND MEMO .*Nijika · proposed by/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /^ · proposed by $/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /^Bocchi$/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /^ mid-set$/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /"Use pnpm, not npm, for every script in this repository\."/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /no, in this band/ })).toBeUndefined()
    await band.unmount()
  }
  // While the card is up: a second proposal (from Kita's act) waits, the same rule again is already held, a ramble is refused.
  await $.agent.spawn({ tool_use_id: 'tu-kita', prompt: 'Fix the README typo.', description: 'Fix the README typo', subagentType: 'kessoku:kita', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  const queued = await $.tool.call({ tool: MEMO_TOOL, rule: 'Keep README headings in sentence case.', agentId: 'agent-kita' })
  expect(String(queued.result)).toMatch(/queued behind the memo already on screen \(1 waiting\)/)
  expect(String((await $.tool.call({ tool: MEMO_TOOL, rule: 'use pnpm, not npm, for every script in this repository.' })).result)).toMatch(/^Already held/)
  expect((await $.tool.call({ tool: MEMO_TOOL, rule: 'Use pnpm. Never use npm.' })).deny).toMatch(/refused: the rule reads as 2 sentences/)
  expect((await $.tool.call({ tool: MEMO_TOOL, rule: `Always ${'x'.repeat(150)}` })).deny).toMatch(/keep it under 140/)
  expect((await $.tool.call({ tool: MEMO_TOOL })).deny).toMatch(/the rule is empty/)
  // Save writes the proposed rule as Reflect's own would be written.
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  await band.press({ key: 'memo-save' })
  await clock.settle()
  expect(seen.written['/proj/CLAUDE.md']).toContain('## Band notes (from Reflect)\n- Use pnpm, not npm, for every script in this repository.')
  expect(seen.toasts.some(t => /Nijika wrote it down/.test(t))).toBe(true)
  await band.unmount()
  // Once the saved card clears, the queued proposal takes the card, signed by Kita.
  await clock.advance(7000)
  const next = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await next.find({ type: 'Text', text: /Keep README headings in sentence case/ })).toBeDefined()
  expect(await next.find({ type: 'Text', text: /^Kita$/ })).toBeDefined()
  await next.press({ key: 'memo-skip' })
  await clock.advance(100)
  expect(seen.written['/proj/CLAUDE.md']).not.toContain('sentence case')
  await next.unmount()
  // The tool row carries Nijika's card title.
  for (const surface of SURFACES) {
    const row = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolUse', requestId: 'tu-memo', props: { tool_use_id: 'tu-memo', tool: MEMO_TOOL, input: { rule: 'Use pnpm.' }, isRunning: false, isErrored: false, isInterrupted: false } })
    expect(await row.find({ type: 'Text', text: /♪ kessoku memo · proposed a rule/ })).toBeDefined()
    expect(await row.find({ type: 'Text', text: /Nijika holds it for Save/ })).toBeDefined()
    expect((await row.drawn()).type).toBe('Box')
    await row.unmount()
    const refused = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolUse', requestId: 'tu-memo2', props: { tool_use_id: 'tu-memo2', tool: MEMO_TOOL, input: { rule: 'x' }, isRunning: false, isErrored: true, isInterrupted: false } })
    expect(await refused.find({ type: 'Text', text: /kessoku memo · sent back/ })).toBeDefined()
    await refused.unmount()
  }
  // /bocchi memo proposed previews the signed card.
  expect((await $.command.run(cmd('bocchi', 'memo proposed'))).text).toMatch(/proposed through the memo tool/)
  const preview = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await preview.find({ type: 'Text', text: /^ · proposed by $/ })).toBeDefined()
  await preview.unmount()
})

test('a memo nobody can answer is refused; once a client attaches, it opens', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  on('session.attach', ($, e) => ({ clientId: e.clientId }))
  await $.session.start({ cwd: '/proj', surface: null, isInteractive: false })
  expect(seen.tools.map(t => t.name)).toEqual(['memo'])
  const alone = await $.tool.call({ tool: MEMO_TOOL, rule: 'Use pnpm, not npm.' })
  expect(alone.deny).toMatch(/nobody is at a screen to press Save/)
  await $.session.attach({ surface: 'desktop', clientId: 'desktop:default' })
  const seen2 = await $.tool.call({ tool: MEMO_TOOL, rule: 'Use pnpm, not npm.' })
  expect(String(seen2.result)).toMatch(/memo card is up/)
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await band.find({ type: 'Text', text: /"Use pnpm, not npm\."/ })).toBeDefined()
  await band.unmount()
  // /clear forgets the card and the queue.
  await $.tool.call({ tool: MEMO_TOOL, rule: 'Keep commits small.' })
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  const after = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await after.find({ type: 'Text', text: /band memo/ })).toBeUndefined()
  await after.unmount()
})

test('an answered memo clears alone: a newer memo stays up, in the same conversation and after /clear', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const press = async (key: string) => {
    const band = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
    await band.press({ key })
    await band.unmount()
  }
  const shows = async (text: RegExp) => {
    const band = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
    const found = await band.find({ type: 'Text', text })
    await band.unmount()
    return found !== undefined
  }
  // Saved, then a correction drafts the next memo before the saved one's six seconds are up: the clear leaves it.
  await $.tool.call({ tool: MEMO_TOOL, rule: 'Keep commits small.' })
  await press('memo-save')
  await clock.advance(1000)
  await $.prompt.submit(typed('no — in this repo we always use pnpm, not npm'))
  await clock.advance(6000)
  expect(await shows(/"Always use pnpm instead of npm in this repository\."/)).toBe(true)
  // Skipped, it goes at once.
  await press('memo-skip')
  await clock.advance(100)
  expect(await shows(/band memo/)).toBe(false)
  // Saved, then /clear: the next conversation's memo outlives the old conversation's clear.
  await $.tool.call({ tool: MEMO_TOOL, rule: 'Name branches after their ticket.' })
  await press('memo-save')
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await clock.advance(1000)
  expect(String((await $.tool.call({ tool: MEMO_TOOL, rule: 'Run the linter before every commit.' })).result)).toMatch(/memo card is up/)
  await clock.advance(6000)
  expect(await shows(/"Run the linter before every commit\."/)).toBe(true)
  // Its own Save still clears it.
  await press('memo-save')
  await clock.advance(7000)
  expect(await shows(/band memo|saved to/)).toBe(false)
})

test('a memo that takes the card while Save writes stays open, unsaved; the written rule is the one saved', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { writeMs: 500 })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: MEMO_TOOL, rule: 'Keep commits small.' })
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  await band.press({ key: 'memo-save' })
  await band.unmount()
  // A correction drafts the next memo while CLAUDE.md is still being written.
  await $.prompt.submit(typed('no — in this repo we always use pnpm, not npm'))
  await clock.advance(100)
  await clock.advance(1000)
  expect(seen.written['/proj/CLAUDE.md']).toContain('- Keep commits small.')
  expect(seen.written['/proj/CLAUDE.md']).not.toContain('pnpm')
  await clock.advance(7000)
  const after = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await after.find({ type: 'Text', text: /"Always use pnpm instead of npm in this repository\."/ })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /saved to/ })).toBeUndefined()
  await after.unmount()
})

test('edits land on the Replay Theater setlist with the tool\'s own line numbers, and light the file tree', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  // The Edit tool's own answer, with the real line numbers; registered first so it answers before the generic bottom.
  on('tool.call', { tool: 'Edit' }, () => ({
    result: { filePath: '/proj/src/app.ts', oldString: 'greet(', newString: 'welcome(', originalFile: null, structuredPatch: [{ oldStart: 40, oldLines: 3, newStart: 40, newLines: 3, lines: [' a', '-greet(', '+welcome(', ' b'] }], userModified: false, replaceAll: false },
  }))
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect((await $.command.run(cmd('filetree'))).text).toMatch(/3 files/)
  await $.turn.start({ text: 'rename greet', turnId: 't1' })
  await $.tool.call({ tool: 'Edit', file_path: '/proj/src/app.ts', old_string: 'greet(', new_string: 'welcome(' })
  const tree = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-filetree', props: PANE_PROPS })
  expect(await tree.find({ type: 'Text', text: /app\.ts/ })).toBeDefined()
  expect(await tree.find({ type: 'Text', text: /Kita|Bocchi/ })).toBeDefined()
  await tree.unmount()
  await $.turn.complete({ turnId: 't1', answer: 'done', durationMs: 1200, isAborted: false, reason: 'answer' })
  expect((await $.command.run(cmd('replay'))).text).toMatch(/1 track/)
  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-replay', props: PANE_PROPS })
    expect(await pane.find({ type: 'Text', text: /REPLAY THEATER/ })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: /src\/app\.ts/ })).toBeDefined()
    const code = await pane.find({ type: 'Code' })
    expect(code).toBeDefined()
    expect(JSON.stringify(code)).toContain('@@ -40,3 +40,3 @@')
    await pane.unmount()
  }
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "rename"' })
  expect(seen.toasts.some(t => /committed/.test(t))).toBe(true)
})

test('subagents take the stage as band members and leave with their cost', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'agent-1' }))
  on('turn.step', async function* ($, e) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn' as const, usage: { model: 'claude-sonnet-5-5', input_tokens: 1000, output_tokens: 2000, cache_read_input_tokens: 40_000, cache_creation_input_tokens: 0 } }
  })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const spawned = await $.agent.spawn({ tool_use_id: 'tu-agent', prompt: 'Find every call site of legacyQuery and list the files.', description: 'Search for legacyQuery call sites', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  expect(spawned.agentId).toBe('agent-1')
  expect(seen.toasts.some(t => /Ryo takes the stage: Search for legacyQuery/.test(t))).toBe(true)
  const step = $.turn.step({ turnId: 'a1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1, agentId: 'agent-1' })
  for await (const chunk of step) void chunk
  const panel = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect(await panel.find({ type: 'Text', text: /legacyQuery/ })).toBeDefined()
  // On the mix, her act's own context meter; on her solo, its tokens too.
  expect(JSON.stringify(await panel.find({ type: 'Box', key: 'chan-ryo' }))).toMatch(/ctx /)
  await panel.unmount()
  await $.command.run(cmd('bocchi', 'solo ryo'))
  const solo = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect(await solo.find({ type: 'Text', text: /tokens 43\.0k · cost ≈\$/ })).toBeDefined()
  await solo.unmount()
  await $.turn.complete({ turnId: 'a1', agentId: 'agent-1', answer: 'found 3', durationMs: 4000, isAborted: false, reason: 'answer' })
  expect(seen.toasts.some(t => /Ryo finished/.test(t))).toBe(true)
})

test('a SubagentStart for an act its spawn seated leaves the act as the spawn wrote it', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  // The engine starts the subagent (SubagentStart) as it resolves the spawn, so the two hooks run at once. The real
  // engine interleaves them closely enough that a check-then-write let the bare act land over the spawn's (its
  // description became the type); this kit runs them in turn, so this test guards the end state only.
  let start: Promise<unknown> = Promise.resolve()
  on('agent.spawn', () => {
    start = $.classic.SubagentStart({ agent_id: 'agent-1', agent_type: 'Explore' })
    return { model: 'claude-sonnet-5-5', agentId: 'agent-1' }
  })
  on('classic.SubagentStart', () => ({}))
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.agent.spawn({ tool_use_id: 'tu-r', prompt: 'Find every call site of legacyQuery.', description: 'Search for legacyQuery call sites', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  await start
  const panel = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  // Her song is the spawn's act: its description, not the bare type SubagentStart carried.
  expect((await sceneOf(panel))['song-agent-1']?.alt).toMatch(/^Ryo · playing · Search for legacyQuery call sites · /)
  await panel.unmount()
})

test('a band agent type lands on its member\'s card by name, and the Agent tool takes the short spelling as the registered type', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  // The Agent tool as the engine runs it: what reaches it is kept (registered first, so it answers before the generic bottom).
  const toAgentTool: string[] = []
  on('tool.call', { tool: 'Agent' }, ($, e) => {
    toAgentTool.push(String((e as unknown as { subagent_type?: string }).subagent_type))
    return { result: { status: 'async_launched' } }
  })
  bottoms(on, clock, seen)
  const dispatched: string[] = []
  let n = 0
  on('agent.spawn', ($, e) => {
    dispatched.push(e.subagentType)
    n += 1
    return { model: 'claude-sonnet-5-5', agentId: `agent-${n}` }
  })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const spawn = (subagentType: string, description: string, prompt: string) =>
    $.agent.spawn({ tool_use_id: `tu-${description}`, prompt, description, subagentType, provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  // The model may write the short spelling: the engine resolves the type in the Agent tool, so the tool gets the registered name.
  for (const subagent_type of ['kessoku:ryo', 'Kessoku:Nijika', `${PLUGIN}:kita`, 'kessoku:drummer', 'Explore']) {
    await $.tool.call({ tool: 'Agent', subagent_type, description: 'x', prompt: 'y' } as never)
  }
  expect(toAgentTool).toEqual([`${PLUGIN}:ryo`, `${PLUGIN}:nijika`, `${PLUGIN}:kita`, 'kessoku:drummer', 'Explore'])
  // The spawn that follows names the registered type. No keyword in it would have found Ryo: by the tables this is Bocchi's.
  expect((await spawn(`${PLUGIN}:ryo`, 'Look into why the strip flickers on resize', 'Read hooks/register.tsx around drawStrip.')).agentId).toBe('agent-1')
  expect(dispatched[0]).toBe(`${PLUGIN}:ryo`)
  expect(seen.toasts.some(t => /Ryo takes the stage: Look into why the strip flickers on resize \(seated by name: kessoku-ultimate-bocchi:ryo\)/.test(t))).toBe(true)
  await spawn(`${PLUGIN}:nijika`, 'Update the README', 'Check the README.')
  expect(dispatched[1]).toBe(`${PLUGIN}:nijika`)
  await spawn('general-purpose', 'Implement the feature', 'Build it end to end.')
  expect(seen.toasts.at(-1)).toMatch(/Bocchi takes the stage: Implement the feature$/)
  // Each act sits on her own channel: Ryo's on Ryo's, Nijika's on Nijika's (whatever the words said), the plain one on Bocchi's.
  for (const surface of SURFACES) {
    const panel = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    // A terminal's channels by key; the desktop's songs by whose they are.
    const card = async (member: string) =>
      surface === 'terminal'
        ? JSON.stringify(await panel.find({ type: 'Box', key: `chan-${member}` }))
        : Object.values(await sceneOf(panel)).filter(s => s.alt.startsWith(`${member === 'bocchi' ? 'Bocchi' : MEMBERS[member as 'ryo'].name} · `)).map(s => s.alt).join(' | ')
    expect(await card('ryo')).toContain('strip flickers')
    expect(await card('nijika')).toContain('Update the README')
    expect(await card('bocchi')).toContain('Implement the feature')
    expect(await card('bocchi')).not.toContain('strip flickers')
    expect(await card('kita')).not.toContain('Update the README')
    await panel.unmount()
  }
})

test('the skin frames tool rows and diff cards, borrows spinner words, and marks the footer', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  for (const surface of SURFACES) {
    const row = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolUse', requestId: 'tu-1', props: { tool_use_id: 'tu-1', tool: 'Bash', input: { command: 'ls' }, isRunning: true, isErrored: false, isInterrupted: false } })
    expect(await row.find({ type: 'Text', text: /Bash/ })).toBeDefined()
    expect(await row.find({ type: 'Text', text: /Ryo/ })).toBeDefined()
    expect((await row.drawn()).type).toBe('Box')
    await row.unmount()
    const card = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolResult', requestId: 'tu-2', props: { tool_use_id: 'tu-2', tool: 'Edit', output: { filePath: '/proj/src/app.ts', gitDiff: { additions: 2, deletions: 1 } }, isErrored: false } })
    expect(await card.find({ type: 'Text', text: /setlist · src\/app\.ts/ })).toBeDefined()
    expect(await card.find({ type: 'Text', text: /\+2 -1/ })).toBeDefined()
    await card.unmount()
  }
  const spinner = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Spinner', requestId: 'sp', props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' } })
  expect((await spinner.drawn()).type).toBe('engine')
  const spun = seen.rendered.Spinner as { word: string; suffix: string }
  expect(SPINNER_WORDS_BY_MODE.thinking).toContain(spun.word)
  expect(spun.suffix).toBe('…')
  await spinner.unmount()
  const footer = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'SessionMode', requestId: 'sm', props: { modes: ['focus'] } })
  expect((await footer.drawn()).type).toBe('engine')
  expect((seen.rendered.SessionMode as { modes: string[] }).modes).toEqual(['focus', '♪ kessoku'])
  await footer.unmount()
})

test('every other render site is skinned: messages, tool groups, command output, the dialog, the small lines', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  for (const surface of SURFACES) {
    const user = await $.ui.mount({ plugin: PLUGIN, surface, component: 'UserMessage', requestId: 'm1', props: { text: 'hello', origin: { kind: 'composer' as const }, isExpanded: false } })
    expect((await user.drawn()).type).toBe('Box')
    await user.unmount()
    const expanded = await $.ui.mount({ plugin: PLUGIN, surface, component: 'UserMessage', requestId: 'm2', props: { text: 'hello', origin: { kind: 'composer' as const }, isExpanded: true } })
    expect((await expanded.drawn()).type).toBe('engine')
    await expanded.unmount()
    const reply = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AssistantMessage', requestId: 'm3', props: { text: 'hi there', isFirstOfReply: true } })
    expect((await reply.drawn()).type).toBe('Box')
    await reply.unmount()
    const group = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolGroup', requestId: 'g1', props: { calls: [], isActive: false, isExpanded: false } })
    expect(await group.find({ type: 'Text', text: /♪/ })).toBeDefined()
    await group.unmount()
    const own = await $.ui.mount({ plugin: PLUGIN, surface, component: 'CommandOutput', requestId: 'c1', props: { command: 'bocchi', args: 'help', text: 'line one\nline two', isErrored: false } })
    expect(await own.find({ type: 'Text', text: /\/bocchi help/ })).toBeDefined()
    expect(await own.find({ type: 'Text', text: /line two/ })).toBeDefined()
    await own.unmount()
    const other = await $.ui.mount({ plugin: PLUGIN, surface, component: 'CommandOutput', requestId: 'c2', props: { command: 'cost', args: '', text: 'x', isErrored: false } })
    expect((await other.drawn()).type).toBe('engine')
    await other.unmount()
    const ask = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AskUserQuestion', requestId: 'q1', props: { tool: 'AskUserQuestion', questions: [] } })
    expect(await ask.find({ type: 'Text', text: /Nijika asks/ })).toBeDefined()
    await ask.unmount()
    const hint = await $.ui.mount({ plugin: PLUGIN, surface, component: 'PromptHint', requestId: 'h1', props: { isDraft: false, isWorking: false, hint: '? for shortcuts' } })
    expect((await hint.drawn()).type).toBe('engine')
    const hinted = seen.rendered.PromptHint as { hint: string; tail?: string }
    expect(hinted.hint).toBe('? for shortcuts')
    expect(hinted.tail).toMatch(/♪ .* \/bocchi help/)
    await hint.unmount()
    const draft = await $.ui.mount({ plugin: PLUGIN, surface, component: 'PromptHint', requestId: 'h2', props: { isDraft: true, isWorking: false, hint: '? for shortcuts' } })
    expect((seen.rendered.PromptHint as { tail?: string }).tail).toBeUndefined()
    await draft.unmount()
  }
  const duration = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'TurnDuration', requestId: 'd1', props: { word: 'Baked', durationMs: 3000 } })
  expect((await duration.drawn()).type).toBe('engine')
  const ended = seen.rendered.TurnDuration as { word: string; durationMs: number }
  expect(TURN_WORDS).toContain(ended.word)
  expect(ended.durationMs).toBe(3000)
  await duration.unmount()
  const notice = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'InfoNotice', requestId: 'n1', props: { text: 'Model: sonnet', command: null } })
  expect((await notice.drawn()).type).toBe('engine')
  expect((seen.rendered.InfoNotice as { text: string }).text).toBe('♪ Model: sonnet')
  await notice.unmount()
  const progress = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'ToolProgress', requestId: 'p1', props: { tool_use_id: 'tu', kind: 'background_hint' as const, hint: '(ctrl+b to run in background)' } })
  expect((await progress.drawn()).type).toBe('engine')
  expect((seen.rendered.ToolProgress as { hint: string }).hint).toBe('(ctrl+b to let Ryo take it backstage)')
  await progress.unmount()
})

test('transcriptSkin none and toolCards none leave the engine\'s drawings alone', { options: { transcriptSkin: 'none', toolCards: 'none', applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const user = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'UserMessage', requestId: 'm1', props: { text: 'hello', origin: { kind: 'composer' as const }, isExpanded: false } })
  expect((await user.drawn()).type).toBe('engine')
  await user.unmount()
  const row = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'ToolUse', requestId: 'tu-1', props: { tool_use_id: 'tu-1', tool: 'Bash', input: { command: 'ls' }, isRunning: true, isErrored: false, isInterrupted: false } })
  expect((await row.drawn()).type).toBe('engine')
  await row.unmount()
})

test('on a light theme the light twin is picked, and /clear forgets the old conversation\'s cache', async ($, on) => {
  const seen = fresh()
  seen.theme = 'light'
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect((await $.command.run(cmd('bocchi', 'theme on'))).text).toMatch(/on: Kessoku Bocchi Light/)
  expect(seen.configSets.at(-1)).toEqual({ key: 'theme', value: THEME_OPTION_LIGHT })
  const step = $.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await clock.advance(61 * 60_000)
  const sent = await $.prompt.submit(typed('a fresh start'))
  expect(sent.drop).toBeUndefined()
  expect((await $.command.run(cmd('cache-tax'))).text).toMatch(/nothing cached yet/)
})

test('keepwarm pings with a fork shortly before the TTL lapses, books the ping, and notices a cold cache', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { forkCacheRead: 0 })
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'warm up', turnId: 't1' })
  const step = $.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 900, isAborted: false, reason: 'answer' })
  expect((await $.command.run(cmd('keepwarm', '2h'))).text).toMatch(/keepwarm on for 2h00m/)
  await clock.advance(57 * 60_000)
  expect(seen.forks).toBe(0)
  await clock.advance(2 * 60_000)
  expect(seen.forks).toBe(1)
  const report = (await $.command.run(cmd('cache-tax'))).text
  expect(report).toMatch(/1 pings so far/)
  expect(report).toMatch(/found it cold/)
  expect(seen.toasts.some(t => /keepwarm: the cache had gone cold/.test(t))).toBe(true)
  await $.classic.PostModelSwitch({ from_model: 'claude-sonnet-5-5', to_model: 'claude-opus-5-5', requested_model: 'opus', source: 'command', context_tokens: 300_000, prompt_cache_warm: false, cache_ttl: '5m', estimated_cache_write_usd: 1.5, pricing: 'catalog' })
  expect((await $.command.run(cmd('cache-tax'))).text).toMatch(/TTL 5:00/)
  expect((await $.command.run(cmd('cache-tax'))).text).toMatch(/\$1\.50 to re-write the cache \(the engine's own estimate\)/)
})

test('a hold with no answer times out after 10 minutes, and the git measures read git', { timeoutMs: 20_000 }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { sleepMs: 30_000 })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await clock.settle()
  await clock.advance(11 * 60_000)
  expect((await call).deny).toMatch(/no answer within 10 minutes/)
  expect(seen.closed).toContain('kessoku-blast-radius')
  for (const [command, want] of [
    ['git clean -fd', /remove 2 untracked paths/],
    ['git reset --hard', /discard uncommitted changes in 2 files/],
    ['git checkout -- .', /discard uncommitted changes in 1 file/],
    ['git push --force origin main', /drops 2 commits/],
  ] as const) {
    const held = $.tool.call({ tool: 'Bash', command })
    await clock.settle()
    const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
    expect(await pane.find({ type: 'Text', text: want })).toBeDefined()
    await pane.press({ key: 'blast-cancel' })
    await clock.advance(31_000)
    expect((await held).deny).toMatch(/caught the guitar/)
    await pane.unmount()
  }
})

test('the file tree walks with fs.list when git ls-files fails; the panes draw on every surface', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { gitLsFails: true })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  // The walk skips build/, node_modules/ and dotfiles: README.md, src/app.ts, src/lib/util.ts remain.
  expect((await $.command.run(cmd('filetree'))).text).toMatch(/3 files/)
  const walked = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-filetree', props: PANE_PROPS })
  expect(await walked.find({ type: 'Text', text: /util\.ts/ })).toBeDefined()
  expect(await walked.find({ type: 'Text', text: /node_modules/ })).toBeUndefined()
  await walked.unmount()
  await $.command.run(cmd('bocchi', 'demo'))
  await $.command.run(cmd('bocchi', 'setlist'))
  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const panel = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    if (surface === 'terminal') expect(await panel.find({ type: 'Text', text: /KESSOKU BAND/ })).toBeDefined()
    else expect((await sceneOf(panel))['scene-stage']?.alt).toMatch(/^Kessoku Band on stage/)
    await panel.unmount()
    const replay = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-replay', props: PANE_PROPS })
    expect(await replay.find({ type: 'Text', text: /track 1 of 2/ })).toBeDefined()
    await replay.unmount()
    const tree = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-filetree', props: PANE_PROPS })
    expect(await tree.find({ type: 'Text', text: /FILETREE/ })).toBeDefined()
    await tree.unmount()
  }
})

test('toolCards edits frames only the edits, and toasts important keeps the chatter down', { options: { toolCards: 'edits', toasts: 'important', applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'agent-1' }))
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const bash = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'ToolUse', requestId: 'tu-1', props: { tool_use_id: 'tu-1', tool: 'Bash', input: { command: 'ls' }, isRunning: true, isErrored: false, isInterrupted: false } })
  expect((await bash.drawn()).type).toBe('engine')
  await bash.unmount()
  const edit = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'ToolUse', requestId: 'tu-2', props: { tool_use_id: 'tu-2', tool: 'Edit', input: { file_path: '/proj/a.ts' }, isRunning: false, isErrored: false, isInterrupted: false } })
  expect((await edit.drawn()).type).toBe('Box')
  await edit.unmount()
  await $.agent.spawn({ tool_use_id: 'tu-agent', prompt: 'Look around.', description: 'Explore the repo', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  expect(seen.toasts.some(t => /takes the stage/.test(t))).toBe(false)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "x"' })
})

test('/bocchi previews put every piece on screen', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect((await $.command.run(cmd('bocchi', 'help'))).text).toMatch(/\/kessoku/)
  expect((await $.command.run(cmd('bocchi', 'help'))).text).toMatch(/\/bocchi theme/)
  expect((await $.command.run(cmd('bocchi', 'mood happy'))).text).toMatch(/happy/)
  expect(seen.status.at(-1)).toContain(MEMBERS_HAPPY)
  await $.command.run(cmd('bocchi', 'tax'))
  await $.command.run(cmd('bocchi', 'crash'))
  const crash = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  expect(await crash.find({ type: 'Text', text: /rm -rf build/ })).toBeDefined()
  await crash.press({ key: 'blast-cancel' })
  expect(seen.closed).toContain('kessoku-blast-radius')
  await crash.unmount()
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect(await band.find({ type: 'Text', text: /CACHE TAX/ })).toBeDefined()
  await band.press({ key: 'tax-dismiss' })
  await band.unmount()
  expect((await $.command.run(cmd('bocchi', 'setlist'))).text).toMatch(/two-track/)
  const replay = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-replay', props: PANE_PROPS })
  expect(await replay.find({ type: 'Text', text: /track 1 of 2/ })).toBeDefined()
  await replay.press({ key: 'replay-next' })
  expect(await replay.find({ type: 'Text', text: /track 2 of 2/ })).toBeDefined()
  expect(await replay.find({ type: 'Text', text: /README\.md/ })).toBeDefined()
  await replay.unmount()
  expect((await $.command.run(cmd('keepwarm', '90m'))).text).toMatch(/keepwarm on for 1h30m/)
  expect((await $.command.run(cmd('cache-tax'))).text).toMatch(/keepwarm   on/)
  expect((await $.command.run(cmd('keepwarm', 'off'))).text).toMatch(/off/)
})

// ---- The sprites ------------------------------------------------------------------

const SPRITE_MOODS = ['anxious', 'focused', 'happy', 'panic', 'melting', 'hiding'] as const
const SPRITE_MEMBERS = ['bocchi', 'nijika', 'ryo', 'kita'] as const
const SLIME_STATES = ['active', 'idle', 'asleep'] as const
const BOCCHI_ANXIOUS = '(;´Д`)'
const PALETTE_CHARS = Object.keys(SPRITE_COLORS)

/** A Raster's cells as their u32 words. */
function words(cells: string): DataView {
  return new DataView(Uint8Array.from(atob(cells), c => c.charCodeAt(0)).buffer)
}

/** The quadrant blocks by which quarters they fill: upper-left 1, upper-right 2, lower-left 4, lower-right 8. */
const QUADRANT_MASKS = new Map([[0x20, 0], [0x2598, 1], [0x259d, 2], [0x2580, 3], [0x2596, 4], [0x258c, 5], [0x259e, 6], [0x259b, 7], [0x2597, 8], [0x259a, 9], [0x2590, 10], [0x259c, 11], [0x2584, 12], [0x2599, 13], [0x259f, 14], [0x2588, 15]])

/**
 * What a terminal shows in each cell of a Raster's `columns` x `rows` block at
 * (`col`, `row`), as its top half's color over its bottom half's ("top/bottom",
 * color words in hex); a cell whose halves are not each one color throws.
 */
function halvesOf(cells: string, rasterColumns: number, col: number, row: number, columns: number, rows: number): string[] {
  const view = words(cells)
  const out: string[] = []
  for (let r = row; r < row + rows; r += 1) {
    for (let c = col; c < col + columns; c += 1) {
      const o = (r * rasterColumns + c) * 12
      const mask = QUADRANT_MASKS.get(view.getUint32(o, true))
      if (mask === undefined) throw new Error(`cell ${c},${r} is not a block element`)
      const fg = view.getUint32(o + 4, true).toString(16)
      const bg = view.getUint32(o + 8, true).toString(16)
      const quarter = (bit: number) => (mask & bit ? fg : bg)
      if (quarter(1) !== quarter(2) || quarter(4) !== quarter(8)) throw new Error(`cell ${c},${r} does not split into a top and a bottom half`)
      out.push(`${quarter(1)}/${quarter(4)}`)
    }
  }
  return out
}

/** A frame's runs spelled out pixel by pixel (`=` taken from the frame before), the plain way: a check on the decoder. */
function spellOut(rle: string, size: number, prev: string): string {
  let s = ''
  for (const [, ch, digits] of rle.matchAll(/([^0-9])([0-9]*)/g)) {
    const n = digits === '' ? 1 : Number(digits)
    s += ch === '=' ? prev.slice(s.length, s.length + n) : (ch as string).repeat(n)
  }
  return s.slice(0, size).padEnd(size, '.')
}

/**
 * What an SVG the mod wrote shows at `t` ms into its animation (or, with t
 * null, where animation does not run): each group's visibility read off its
 * own `<animate>` (discrete, at the last key time not after t), translations
 * and whole-number scales applied, the paths' runs painted in document order.
 * Null where nothing is painted. Throws on markup it does not know, so the
 * format is checked too.
 */
function paintSvg(svg: string, w: number, h: number, t: number | null): (string | null)[] {
  const out: (string | null)[] = Array.from({ length: w * h }, () => null)
  const head = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) (\d+)" width="\d+" height="\d+" shape-rendering="crispEdges" fill="none" stroke-width="1">/.exec(svg)
  if (head === null || Number(head[1]) !== w || Number(head[2]) !== h || !svg.endsWith('</svg>')) throw new Error('not the svg head the mod writes')
  const body = svg.slice(head[0].length, -'</svg>'.length)
  const token = /<g transform="translate\((-?\d+) (-?\d+)\)(?: scale\((\d+)\))?">|<g visibility="(visible|hidden)"><animate attributeName="visibility" dur="(\d+)ms" repeatCount="indefinite" calcMode="discrete" keyTimes="([^"]*)" values="([^"]*)"\/>|<\/g>|<path stroke="(#[0-9a-f]{6})" d="([^"]*)"\/>/y
  const stack: { isVisible: boolean; dx: number; dy: number; z: number }[] = []
  let at = 0
  while (at < body.length) {
    token.lastIndex = at
    const m = token.exec(body)
    if (m === null) throw new Error(`unknown markup at ${at}: ${body.slice(at, at + 40)}`)
    at = token.lastIndex
    if (m[1] !== undefined) {
      stack.push({ isVisible: true, dx: Number(m[1]), dy: Number(m[2]), z: m[3] === undefined ? 1 : Number(m[3]) })
    } else if (m[4] !== undefined) {
      const dur = Number(m[5])
      const times = (m[6] as string).split(';').map(Number)
      const values = (m[7] as string).split(';')
      if (times.length !== values.length || times[0] !== 0 || values[0] !== m[4]) throw new Error('an animation that does not start as its group does')
      let value = m[4]
      if (t !== null) {
        const f = (t % dur) / dur
        times.forEach((k, i) => {
          if (k <= f) value = values[i] as string
        })
      }
      stack.push({ isVisible: value === 'visible', dx: 0, dy: 0, z: 1 })
    } else if (m[0] === '</g>') {
      if (stack.pop() === undefined) throw new Error('a group closed twice')
    } else {
      if (!stack.every(g => g.isVisible)) continue
      // A pixel of the path's own space to the canvas: each group's transform, the innermost first.
      const place = (px: number, py: number): [number, number] => stack.reduceRight<[number, number]>(([x, y], g) => [g.dx + g.z * x, g.dy + g.z * y], [px, py])
      const z = stack.reduce((n, g) => n * g.z, 1)
      const color = m[8] as string
      let x = 0
      let y = 0
      for (const [, cmd, a, b] of (m[9] as string).matchAll(/([Mmhv])(-?[\d.]+)(?: ?(-?[\d.]+))?/g)) {
        const n = Number(a)
        if (cmd === 'M' || cmd === 'm') {
          x = (cmd === 'M' ? 0 : x) + n
          y = (cmd === 'M' ? 0 : y) + Number(b)
          continue
        }
        for (let k = 0; k < n; k += 1) {
          const [px0, py0] = place(Math.floor(x + (cmd === 'h' ? k : 0)), Math.floor(y + (cmd === 'v' ? k : 0)))
          for (let sy = 0; sy < z; sy += 1) {
            for (let sx = 0; sx < z; sx += 1) {
              const px = px0 + sx
              const py = py0 + sy
              if (px < 0 || px >= w || py < 0 || py >= h) throw new Error('a run off the canvas')
              out[py * w + px] = color
            }
          }
        }
        if (cmd === 'h') x += n
        else y += n
      }
    }
  }
  if (stack.length !== 0) throw new Error('a group left open')
  return out
}

/** How many pixels two pictures disagree on. */
function differing(a: readonly (string | null)[], b: readonly (string | null)[]): number {
  let n = Math.abs(a.length - b.length)
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) if (a[i] !== b[i]) n += 1
  return n
}

/** The start of each frame of a loop, in ms, and the loop's length. */
function frameStarts(anim: SpriteAnim): { starts: number[]; total: number } {
  const starts: number[] = []
  let t = 0
  for (const [ms] of anim.frames) {
    starts.push(t)
    t += ms
  }
  return { starts, total: t }
}

/** A sprite of random pixels (a fixed seed): every frame different, nothing to share, so its markup is as large as it gets. */
function noise(w: number, h: number, frames: number, colors: number, seed: number): SpriteAnim {
  const chars = PALETTE_CHARS.slice(0, colors)
  let s = seed
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x80000000
  }
  const out: [number, string][] = []
  for (let f = 0; f < frames; f += 1) {
    let rle = ''
    for (let i = 0; i < w * h; i += 1) rle += chars[Math.floor(next() * chars.length)]
    out.push([100, rle])
  }
  return { w, h, frames: out }
}

/** The moods a remote drawing's alt names, by member: "Kessoku Band: Bocchi, anxious; Nijika, happy". */
function moodsIn(alt: string): Record<string, KessokuMood> {
  const out: Record<string, KessokuMood> = {}
  for (const [, name, mood] of alt.matchAll(/(Bocchi|Nijika|Ryo|Kita), (\w+)/g)) out[(name as string).toLowerCase()] = mood as KessokuMood
  return out
}

test('sprites: every member has every mood whole, as a portrait and as a mini, and both crashes are there', async () => {
  for (const member of SPRITE_MEMBERS) {
    for (const mood of SPRITE_MOODS) {
      expect(animOf(spriteId(member, mood, 'full'))).toMatchObject({ w: 96, h: 96 })
      expect(animOf(spriteId(member, mood, 'portrait'))).toMatchObject({ w: 32, h: 32 })
      expect(animOf(spriteId(member, mood, 'mini'))).toMatchObject({ w: 16, h: 16 })
    }
  }
  expect(spriteId('kita', 'happy')).toBe('kita-happy')
  expect(spriteId('kita', 'happy', 'mini')).toBe('kita-happy-mini')
  expect(animOf(CRASH)).toMatchObject({ w: 96, h: 32 })
  expect(animOf(CRASH_MINI)).toMatchObject({ w: 48, h: 16 })
  expect(viewSize('full')).toEqual({ w: 96, h: 96 })
  expect(viewSize('portrait')).toEqual({ w: 32, h: 32 })
  expect(viewSize('mini')).toEqual({ w: 16, h: 16 })
  // The figures in three views a mood, the slimes in two a state, and the two crashes.
  expect(Object.keys(SPRITES)).toHaveLength(SPRITE_MEMBERS.length * SPRITE_MOODS.length * 3 + SPRITE_MEMBERS.length * SLIME_STATES.length * 2 + 2)
  for (const [id, anim] of Object.entries(SPRITES)) {
    expect(id).toMatch(/^(bocchi|nijika|ryo|kita)-(anxious|focused|happy|panic|melting|hiding)(-portrait|-mini)?$|^(bocchi|nijika|ryo|kita)-slime-(active|idle|asleep)(-mini)?$|^fx-crash(-mini)?$/)
    expect(anim.frames.length).toBeGreaterThan(0)
    // Every frame holds a whole number of 100 ms beats and is spelled in the palette's characters, `.`, `=` and counts;
    // the first never leans on a frame before it.
    anim.frames.forEach(([ms, rle], i) => {
      expect(ms % 100).toBe(0)
      const strange = [...new Set(rle.replace(/[0-9]/g, ''))].filter(ch => ch !== '.' && ch !== '=' && !(ch in SPRITE_COLORS))
      expect(strange).toEqual([])
      if (i === 0) expect(rle.includes('=')).toBe(false)
    })
  }
})

test('slimes: an act sleeps once it ends, breathes while it waits, bounces while it runs', async () => {
  expect(slimeState('running')).toBe('active')
  expect(slimeState('pending')).toBe('idle')
  expect(slimeState('waiting')).toBe('idle')
  expect(slimeState('idle')).toBe('idle')
  expect(slimeState('completed')).toBe('asleep')
  // A failed or killed act sleeps too: its row's words say why.
  expect(slimeState('failed')).toBe('asleep')
  expect(slimeState('killed')).toBe('asleep')
})

test('slimes: every member has every state as a slime and as its mini, the mini the slime halved', async () => {
  expect(spriteId('ryo', 'active', 'slime')).toBe('ryo-slime-active')
  expect(spriteId('kita', 'asleep', 'slime-mini')).toBe('kita-slime-asleep-mini')
  expect(viewSize('slime')).toEqual({ w: 36, h: 24 })
  expect(viewSize('slime-mini')).toEqual({ w: 18, h: 12 })
  // The slime mini in quadrants: 9 x 3 cells, exactly.
  expect(cellsFor(18, 12, 'quad')).toEqual({ columns: 9, rows: 3 })
  for (const member of SPRITE_MEMBERS) {
    const loops: number[] = []
    for (const state of SLIME_STATES) {
      const slime = animOf(spriteId(member, state, 'slime')) as SpriteAnim
      const mini = animOf(spriteId(member, state, 'slime-mini')) as SpriteAnim
      expect(slime).toMatchObject({ w: 36, h: 24 })
      expect(mini).toMatchObject({ w: slime.w / 2, h: slime.h / 2 })
      // The same loop, and the mini changes only where the slime does (it is drawn from it).
      const big = frameStarts(slime)
      const small = frameStarts(mini)
      expect(small.total).toBe(big.total)
      for (const t of small.starts) if (!big.starts.includes(t)) throw new Error(`${member} ${state}: the mini changes at ${t} ms where the slime does not`)
      // Every state moves: a bounce, a breath, a doze.
      expect(slime.frames.length).toBeGreaterThan(1)
      loops.push(big.total)
    }
    // Asleep is the slowest, active the quickest.
    expect(loops[0] as number).toBeLessThan(loops[1] as number)
    expect(loops[1] as number).toBeLessThan(loops[2] as number)
  }
  // Each state's loop is one length for the band (one clock, one beat).
  for (const state of SLIME_STATES) expect(new Set(SPRITE_MEMBERS.map(m => frameStarts(animOf(spriteId(m, state, 'slime')) as SpriteAnim).total)).size).toBe(1)
})

test('sprites: = runs copy the frame before, so the frames decode in order', { timeoutMs: 30_000 }, async () => {
  const [a, b, c] = PALETTE_CHARS as [string, string, string]
  const [ca, cb, cc] = [SPRITE_COLORS[a], SPRITE_COLORS[b], SPRITE_COLORS[c]] as [string, string, string]
  // `A3B.2`, then `=2C=3` (two kept, one new, three kept), then `=B2=2.` (one kept, two new, two kept, one cleared).
  const anim: SpriteAnim = { w: 3, h: 2, frames: [[100, `${a}3${b}.2`], [100, `=2${c}=3`], [100, `=${b}2=2.`]] }
  const frames = decodeFrames(anim).map(pixelsOf)
  expect(frames[0]).toEqual([ca, ca, ca, cb, null, null])
  expect(frames[1]).toEqual([ca, ca, cc, cb, null, null])
  expect(frames[2]).toEqual([ca, cb, cb, cb, null, null])
  // Short runs pad with transparency, long ones stop at the frame's end, `=` with no frame before keeps nothing,
  // and a character the palette lacks draws nothing.
  expect(pixelsOf(decodeCodes(`${a}`, 3))).toEqual([ca, null, null])
  expect(pixelsOf(decodeCodes(`${a}9`, 3))).toEqual([ca, ca, ca])
  expect(pixelsOf(decodeCodes(`=2${b}`, 3))).toEqual([null, null, cb])
  expect(pixelsOf(decodeCodes(`${a}☃${a}`, 3))).toEqual([ca, null, ca])
  expect(colorOf(0)).toBeNull()
  expect(colorOf(a.charCodeAt(0))).toBe(ca)
  // Every exported frame decodes as spelling it out pixel by pixel does, `=` from the frame before.
  let leaning = 0
  for (const [id, anim2] of Object.entries(SPRITES)) {
    const size = anim2.w * anim2.h
    let prev = ''
    const decoded = decodeFrames(anim2)
    anim2.frames.forEach(([, rle], i) => {
      if (rle.includes('=')) leaning += 1
      const plain = spellOut(rle, size, prev)
      prev = plain
      const want = [...plain].map(ch => (ch === '.' ? null : (SPRITE_COLORS[ch] ?? null)))
      const got = pixelsOf(decoded[i] as Uint16Array)
      expect(got.length).toBe(size)
      if (differing(got, want) !== 0) throw new Error(`${id} frame ${i} decodes wrong`)
    })
    // The terminal's own copy (decoded once, in order) agrees, frame by frame, whichever is asked first.
    const last = anim2.frames.length - 1
    expect(differing(framePixels(id, last), pixelsOf(decoded[last] as Uint16Array))).toBe(0)
    expect(differing(framePixels(id, 0), pixelsOf(decoded[0] as Uint16Array))).toBe(0)
  }
  // The export leans on `=` for most frames after the first.
  expect(leaning).toBeGreaterThan(Object.keys(SPRITES).length)
})

test('sprites: the loop clock, cells and base64', async () => {
  const [a, b] = PALETTE_CHARS as [string, string]
  const anim = { w: 1, h: 1, frames: [[100, a], [300, b]] as const }
  expect(frameAt(anim, 0)).toBe(0)
  expect(frameAt(anim, 99)).toBe(0)
  expect(frameAt(anim, 100)).toBe(1)
  expect(frameAt(anim, 399)).toBe(1)
  expect(frameAt(anim, 400)).toBe(0)
  expect(frameAt(anim, 1_000_250)).toBe(1)
  // The footprints: the mini in half blocks takes 16 x 8 cells (what the portrait took in quadrants), in quadrants 8 x 4.
  expect(cellsFor(16, 16, 'half')).toEqual({ columns: 16, rows: 8 })
  expect(cellsFor(32, 32, 'quad')).toEqual({ columns: 16, rows: 8 })
  expect(cellsFor(16, 16, 'quad')).toEqual({ columns: 8, rows: 4 })
  expect(cellsFor(96, 96, 'quad')).toEqual({ columns: 48, rows: 24 })
  expect(cellsFor(48, 16, 'quad')).toEqual({ columns: 24, rows: 4 })
  expect(base64(new Uint8Array([77, 97, 110]))).toBe('TWFu')
  expect(base64(new Uint8Array([77, 97]))).toBe('TWE=')
  // A transparent top over a red bottom: the lower half block in red on the terminal's own background.
  const half = encodeCells([null, '#ff0000'], 1, 2, 'half')
  expect(half).toMatchObject({ columns: 1, rows: 1 })
  const w1 = words(half.cells)
  expect([w1.getUint32(0, true), w1.getUint32(4, true), w1.getUint32(8, true)]).toEqual([0x2584, 0xff0000, 0x01000000])
  // Two colors over two: the upper half block, the top the foreground, the bottom the background.
  const w2 = words(encodeCells(['#00ff00', '#0000ff'], 1, 2, 'half').cells)
  expect([w2.getUint32(0, true), w2.getUint32(4, true), w2.getUint32(8, true)]).toEqual([0x2580, 0x00ff00, 0x0000ff])
  // Transparency takes the card's background where one is given.
  expect(words(encodeCells([null, null], 1, 2, 'half', '#26262c').cells).getUint32(8, true)).toBe(0x26262c)
  // Quadrants: a dark left column over a light right one is the left half block.
  const w3 = words(encodeCells(['#000000', '#ffffff', '#000000', '#ffffff', '#000000', '#ffffff', '#000000', '#ffffff'], 2, 4, 'quad').cells)
  expect([w3.getUint32(0, true), w3.getUint32(4, true), w3.getUint32(8, true)]).toEqual([0x258c, 0x000000, 0xffffff])
  // The mini in half blocks and in quadrants: 16 x 8 and 8 x 4 cells, 12 bytes each.
  expect(atob(encodeCells(framePixels(spriteId('bocchi', 'anxious', 'mini'), 0), 16, 16, 'half').cells).length).toBe(16 * 8 * 12)
  expect(atob(encodeCells(framePixels(spriteId('bocchi', 'anxious', 'mini'), 0), 16, 16, 'quad').cells).length).toBe(8 * 4 * 12)
})

test('sprites: a part at zoom 2 is drawn two by two, and a mini so drawn in quadrants is the mini in half blocks', async () => {
  for (const member of SPRITE_MEMBERS) {
    for (const mood of SPRITE_MOODS) {
      const id = spriteId(member, mood, 'mini')
      const anim = animOf(id) as SpriteAnim
      const { starts } = frameStarts(anim)
      for (const t of [starts[0] as number, starts[Math.floor(starts.length / 2)] as number]) {
        const one = composite([{ id, x: 0, y: 0 }], 16, 16, t)
        const two = composite([{ id, x: 0, y: 0, zoom: 2 }], 32, 32, t)
        for (let y = 0; y < 32; y += 1) for (let x = 0; x < 32; x += 1) if (two[y * 32 + x] !== one[(y >> 1) * 16 + (x >> 1)]) throw new Error(`${id}: pixel ${x},${y} at zoom 2 is not its own`)
        // Each cell of the zoomed mini in quadrants shows what the mini in half blocks shows there: a pixel over the one below.
        const quads = encodeCells(two, 32, 32, 'quad', '#26262c').cells
        const halves = encodeCells(one, 16, 16, 'half', '#26262c').cells
        expect(halvesOf(quads, 16, 0, 0, 16, 8)).toEqual(halvesOf(halves, 16, 0, 0, 16, 8))
      }
    }
  }
  // Placed off the origin, beside another part, and drawn as an SVG: the same pixels, two by two.
  const mini = spriteId('kita', 'happy', 'mini')
  const placed = composite([{ id: CRASH_MINI, x: 0, y: 0 }, { id: mini, x: 50, y: 0, zoom: 2 }], 82, 32, 0)
  const still = framePixels(mini, 0)
  for (let y = 0; y < 32; y += 1) for (let x = 0; x < 32; x += 1) if (still[(y >> 1) * 16 + (x >> 1)] !== null) expect(placed[y * 82 + 50 + x]).toBe(still[(y >> 1) * 16 + (x >> 1)])
  const anim = animOf(mini) as SpriteAnim
  const { svg, levels } = drawSvg([{ id: mini, x: 4, y: 2, zoom: 2 }], 36, 34, 1)
  expect(levels).toEqual([0])
  expect(svg).toContain('scale(2)')
  const frames = decodeFrames(anim).map(pixelsOf)
  const { starts } = frameStarts(anim)
  anim.frames.forEach(([ms], k) => {
    const want: (string | null)[] = Array.from({ length: 36 * 34 }, () => null)
    const f = frames[k] as (string | null)[]
    for (let y = 0; y < 32; y += 1) for (let x = 0; x < 32; x += 1) want[(2 + y) * 36 + 4 + x] = f[(y >> 1) * 16 + (x >> 1)] ?? null
    if (differing(paintSvg(svg, 36, 34, (starts[k] as number) + ms / 2), want) !== 0) throw new Error(`${mini} at zoom 2: frame ${k} is not drawn exactly`)
  })
})

test('sprites: the layered SVG draws exactly each frame over its span, and the first where nothing animates', { timeoutMs: 60_000 }, async () => {
  let checked = 0
  for (const [id, anim] of Object.entries(SPRITES)) {
    const { svg, levels } = drawSvg([{ id, x: 0, y: 0 }], anim.w, anim.h, 1)
    // Whole: no frame merged away to fit.
    expect(levels).toEqual([0])
    const frames = decodeFrames(anim).map(pixelsOf)
    const { starts } = frameStarts(anim)
    anim.frames.forEach(([ms], k) => {
      const want = frames[k] as (string | null)[]
      // Just after the frame comes in, halfway through it, and just before it goes (10 ms in from either end).
      for (const t of [starts[k] as number, (starts[k] as number) + ms / 2, (starts[k] as number) + ms]) {
        const at = Math.min(Math.max(t, (starts[k] as number) + 10), (starts[k] as number) + ms - 10)
        if (differing(paintSvg(svg, anim.w, anim.h, at), want) !== 0) throw new Error(`${id}: frame ${k} is not drawn exactly at ${at} ms`)
      }
      checked += 1
    })
    // A surface that does not animate shows the first frame.
    if (differing(paintSvg(svg, anim.w, anim.h, null), frames[0] as (string | null)[]) !== 0) throw new Error(`${id}: the still is not the first frame`)
    expect(svg.includes('<animate')).toBe(new Set(frames.map(f => f.join())).size > 1)
    expect(svg).not.toMatch(/<script|\son[a-z]+=|href/i)
  }
  expect(checked).toBe(Object.values(SPRITES).reduce((n, a) => n + a.frames.length, 0))
})

test('sprites: the layers only add, each one inside every frame that shows it', { timeoutMs: 30_000 }, async () => {
  for (const id of ['bocchi-melting', 'bocchi-happy', 'nijika-focused', 'ryo-panic', 'kita-hiding-portrait', 'bocchi-anxious-mini', CRASH]) {
    const anim = animOf(id) as SpriteAnim
    const frames = decodeFrames(anim)
    const durations = anim.frames.map(([ms]) => ms)
    const { total, layers } = layerFrames(frames, durations, anim.w, anim.h)
    expect(layers.length).toBeGreaterThan(0)
    const { starts } = frameStarts(anim)
    frames.forEach((f, k) => {
      const t = (starts[k] as number) + (durations[k] as number) / 2
      const shown = layers.filter(l => l.spans === null || l.spans.some(([a, b]) => a <= t && t < b))
      // What the visible layers cover is exactly what the frame draws, and painting them in order gives its colors.
      const painted = new Uint16Array(f.length)
      for (const l of shown) {
        for (let i = 0; i < f.length; i += 1) {
          if (l.px[i] === 0) continue
          if (f[i] === 0) throw new Error(`${id}: a layer shown in frame ${k} draws where it is transparent`)
          painted[i] = l.px[i] as number
        }
      }
      for (let i = 0; i < f.length; i += 1) if (painted[i] !== f[i]) throw new Error(`${id}: frame ${k} pixel ${i} is not its own`)
    })
    expect(total).toBe(durations.reduce((n, ms) => n + ms, 0))
  }
})

test('sprites: every drawing fits the Svg element whole: each sprite, the strip at its heaviest, the guard screen', { timeoutMs: 30_000 }, async () => {
  for (const [id, anim] of Object.entries(SPRITES)) {
    const { svg, levels } = drawSvg([{ id, x: 0, y: 0 }], anim.w, anim.h, 1)
    expect(svg.length).toBeLessThanOrEqual(SVG_LIMIT)
    expect(levels).toEqual([0])
  }
  // The strip on a remote surface: four portraits 34 apart, each member in her heaviest mood, and in every mood at once.
  const size = (id: string) => spritesSvg([{ id, x: 0, y: 0 }], 32, 32, 1).length
  const heaviest = SPRITE_MEMBERS.map(m => SPRITE_MOODS.map(mood => spriteId(m, mood, 'portrait')).sort((p, q) => size(q) - size(p))[0] as string)
  for (const ids of [heaviest, ...SPRITE_MOODS.map(mood => SPRITE_MEMBERS.map(m => spriteId(m, mood, 'portrait')))]) {
    const strip = drawSvg(ids.map((id, i) => ({ id, x: i * 34, y: 0 })), 134, 32, 1)
    expect(strip.svg.length).toBeLessThanOrEqual(SVG_LIMIT)
    expect(strip.levels).toEqual([0, 0, 0, 0])
  }
  // The strip's row of slimes at its fullest: six acts 38 apart, the six heaviest slimes the band has.
  const slimeSize = (id: string) => spritesSvg([{ id, x: 0, y: 0 }], 36, 24, 1).length
  const heaviestSlimes = SPRITE_MEMBERS.flatMap(m => SLIME_STATES.map(s => spriteId(m, s, 'slime'))).sort((p, q) => slimeSize(q) - slimeSize(p)).slice(0, 6)
  const slimeRow = drawSvg(heaviestSlimes.map((id, i) => ({ id, x: i * 38, y: 0 })), 6 * 38 - 2, 24, 1)
  expect(slimeRow.svg.length).toBeLessThanOrEqual(SVG_LIMIT)
  expect(slimeRow.levels).toEqual([0, 0, 0, 0, 0, 0])
  // The guard screen on a remote surface: her whole figure, the crash tucked in at her feet.
  const blastDrawing = drawSvg([{ id: spriteId('bocchi', 'panic', 'full'), x: 0, y: 0 }, { id: CRASH, x: 84, y: 64 }], 180, 96, 1)
  expect(blastDrawing.svg.length).toBeLessThanOrEqual(SVG_LIMIT)
  expect(blastDrawing.levels).toEqual([0, 0])
  // Both parts drawn, each in place.
  const still = paintSvg(blastDrawing.svg, 180, 96, null)
  const crash0 = framePixels(CRASH, 0)
  for (let y = 0; y < 32; y += 1) for (let x = 0; x < 96; x += 1) if (crash0[y * 96 + x] !== null) expect(still[(64 + y) * 180 + 84 + x]).toBe(crash0[y * 96 + x])
})

test('sprites: a drawing too large for the Svg element loses frames, at worst to a still of the first, and never runs over', { timeoutMs: 60_000 }, async () => {
  // Twelve frames of noise: far over the limit whole, so neighbours merge until it fits.
  const loud = noise(96, 96, 12, 60, 7)
  const table: SpriteTable = { loud, small: animOf(spriteId('bocchi', 'anxious', 'mini')) as SpriteAnim, huge: noise(200, 200, 2, 60, 11) }
  const merged = drawSvg([{ id: 'loud', x: 0, y: 0 }], 96, 96, 1, table)
  expect(merged.svg.length).toBeLessThanOrEqual(SVG_LIMIT)
  expect(merged.levels[0]).toBeGreaterThan(0)
  const frames = decodeFrames(loud).map(pixelsOf)
  // Where nothing animates, and at the start, it is the first frame; at any time after, one of its own frames, held.
  expect(differing(paintSvg(merged.svg, 96, 96, null), frames[0] as (string | null)[])).toBe(0)
  const { starts } = frameStarts(loud)
  const shown = new Set<number>()
  for (const t of starts) {
    const painted = paintSvg(merged.svg, 96, 96, t + 50)
    const which = frames.findIndex(f => differing(f, painted) === 0)
    expect(which).toBeGreaterThanOrEqual(0)
    shown.add(which)
  }
  expect(shown.has(0)).toBe(true)
  expect(shown.size).toBeLessThanOrEqual(Math.ceil(12 / 2 ** (merged.levels[0] as number)))
  expect(shown.size).toBeLessThan(12)
  // Beside a small sprite, the large one gives and the small one stays whole.
  const pair = drawSvg([{ id: 'small', x: 0, y: 0 }, { id: 'loud', x: 16, y: 0 }], 112, 96, 1, table)
  expect(pair.svg.length).toBeLessThanOrEqual(SVG_LIMIT)
  expect(pair.levels[0]).toBe(0)
  expect(pair.levels[1]).toBeGreaterThan(0)
  // Too large even as a still: left out, the drawing empty but well formed.
  const none = drawSvg([{ id: 'huge', x: 0, y: 0 }], 200, 200, 1, table)
  expect(none.levels).toEqual([-1])
  expect(none.svg.length).toBeLessThanOrEqual(SVG_LIMIT)
  expect(paintSvg(none.svg, 200, 200, null).every(c => c === null)).toBe(true)
  // A loop merged down keeps its length and its first frame first.
  const down = mergeTimeline(decodeFrames(loud), loud.frames.map(([ms]) => ms), 3)
  expect(down.frames).toHaveLength(3)
  expect(down.durations.reduce((n, ms) => n + ms, 0)).toBe(1200)
  expect(differing(pixelsOf(down.frames[0] as Uint16Array), frames[0] as (string | null)[])).toBe(0)
})

test('the band is drawn as sprites: a Raster on the terminal, repainted by blit; an animated Svg on the desktop', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  const now = 1_000_000
  // A tall pane: the stage's four minis side by side in half blocks (70 x 8 cells, every color kept), on the charcoal.
  const tall = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: { ...PANE_PROPS, scroll: { offset: 0, bodyRows: 50 } } })
  const heads = (await tall.find({ type: 'Raster', key: 'stage-heads' }))?.props
  expect(heads).toMatchObject({ columns: 70, rows: 8 })
  // No kaomoji where the sprite stands in for her face.
  expect(await tall.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeUndefined()
  // The sprite clock walks the frames: repaints reach the pane in place, no redraw.
  await clock.advance(3000)
  expect(seen.blits.some(x => x.requestId === 'kessoku-band' && x.key.startsWith('stage-') && x.isTaken)).toBe(true)
  await tall.unmount()
  // A shorter one: the minis in quadrants (35 x 4), so the mixer fits under them.
  const short = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await short.find({ type: 'Raster', key: 'stage-heads' }))?.props).toMatchObject({ columns: 35, rows: 4 })
  expect(await short.find({ type: 'Text', text: /legacyQuery/ })).toBeDefined()
  await short.unmount()
  // The tall stage's heads, cell for cell: the four minis in the demo's moods, two pixels apart, in half blocks.
  const stageMoods: Record<string, KessokuMood> = { bocchi: 'anxious', nijika: 'focused', ryo: 'focused', kita: 'happy' }
  const tallAgain = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: { ...PANE_PROPS, scroll: { offset: 0, bodyRows: 50 } } })
  // The clock as the earlier advance left it.
  const at = 1_003_000
  const heads4 = SPRITE_MEMBERS.map((m, i) => ({ id: spriteId(m, stageMoods[m] as KessokuMood, 'mini'), x: i * 18, y: 0 }))
  expect((await tallAgain.find({ type: 'Raster', key: 'stage-heads' }))?.props.cells).toBe(encodeCells(composite(heads4, 70, 16, at), 70, 16, 'half', '#1b1b1f').cells)
  await tallAgain.unmount()
  expect(now).toBe(1_000_000)
  // The strip: the four minis in one picture where the band has the rows (35 x 4), the one-line strip where it does not.
  const t2 = 1_003_000
  const deskStrip = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  // On a remote surface: the neon now-playing sign, an image (it changes with every redraw).
  const sign = (await sceneOf(deskStrip))['strip-sign']
  expect(sign?.isInteractive).toBe(false)
  expect(sign?.alt).toMatch(/^Off air · now playing · Ryo · /)
  await deskStrip.unmount()
  // The moods on stage, as the demo seats them: Bocchi idle, Nijika and Ryo playing, Kita's README just done.
  const moods: Record<string, KessokuMood> = { bocchi: 'anxious', nijika: 'focused', ryo: 'focused', kita: 'happy' }
  const strip = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  const stripRaster = (await strip.find({ type: 'Raster', key: 'strip-sprites' }))?.props
  expect(stripRaster).toMatchObject({ columns: 35, rows: 4 })
  const minis = SPRITE_MEMBERS.map((m, i) => ({ id: spriteId(m, moods[m] as KessokuMood, 'mini'), x: i * 18, y: 0 }))
  expect(stripRaster?.cells).toBe(encodeCells(composite(minis, 70, 16, t2), 70, 16, 'quad', '#1b1b1f').cells)
  expect(await strip.find({ type: 'Text', text: /^ · NOW PLAYING · $/ })).toBeDefined()
  expect(await strip.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  await strip.unmount()
  const low = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, maxRows: 4, scroll: { offset: 0, bodyRows: 3 } } })
  expect(await low.find({ type: 'Raster' })).toBeUndefined()
  expect(await low.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  await low.unmount()
  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    // The stage: an image (it scales to the pane's width), its sprites animating, inside the Svg element's limit.
    const pane = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    const stage = (await sceneOf(pane))['scene-stage']
    expect(stage?.isInteractive).toBe(false)
    expect(stage?.source.length).toBeLessThanOrEqual(SVG_LIMIT)
    expect(stage?.source).toMatch(/^<svg [^>]*viewBox="0 0 \d+ \d+"/)
    expect(stage?.source).toContain('<animate')
    expect(stage?.alt).toMatch(/Bocchi/)
    await pane.unmount()
  }
  // Nijika's memo carries her mini above the prompt in a terminal, her portrait on the desktop.
  await $.command.run(cmd('bocchi', 'memo'))
  const memoBand = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await memoBand.find({ type: 'Raster', key: 'memo-sprite' }))?.props).toMatchObject({ columns: 8, rows: 4 })
  await memoBand.unmount()
  const memoDesk = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await memoDesk.find({ type: 'Svg' }))?.props).toMatchObject({ width: 32, height: 32 })
  await memoDesk.press({ key: 'memo-skip' })
  await memoDesk.unmount()
})

test("the small spots keep v1's footprints: Cache Tax and the panel above the prompt, the minis in a terminal, portraits elsewhere", async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { unplaced: true })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  // Cache Tax: Bocchi's mini in quadrants (8 x 4) in a terminal, her portrait (32 CSS pixels) on a remote surface.
  await $.command.run(cmd('bocchi', 'tax'))
  const tax = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  const taxRaster = (await tax.find({ type: 'Raster', key: 'tax-sprite' }))?.props
  expect(taxRaster).toMatchObject({ columns: 8, rows: 4 })
  expect(taxRaster?.cells).toBe(encodeCells(composite([{ id: spriteId('bocchi', 'panic', 'mini'), x: 0, y: 0 }], 16, 16, 1_000_000), 16, 16, 'quad', '#1b1b1f').cells)
  await tax.unmount()
  const taxDesk = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await taxDesk.find({ type: 'Svg' }))?.props).toMatchObject({ width: 32, height: 32, isInteractive: true })
  await taxDesk.press({ key: 'tax-dismiss' })
  await taxDesk.unmount()
  await $.command.run(cmd('bocchi', 'demo'))
  // No room for a pane: the panel is drawn above the prompt, its stage the four minis in quadrants (35 x 4) in a
  // terminal; on a remote surface the live house without its stage (the plates and a board of three songs) and Hide.
  expect((await $.command.run(cmd('kessoku'))).text).toMatch(/above the prompt/)
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await band.find({ type: 'Raster', key: 'stage-heads' }))?.props).toMatchObject({ columns: 35, rows: 4 })
  expect(await band.find({ type: 'Button', key: 'panel-hide' })).toBeDefined()
  await band.unmount()
  for (const surface of ['desktop', 'mobile'] as const) {
    const remote = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
    const scene = await sceneOf(remote)
    expect(scene['scene-stage']).toBeUndefined()
    expect(scene['scene-plates']?.alt).toMatch(/^Bocchi: /)
    expect(scene['scene-head']).toBeDefined()
    expect(Object.keys(scene).filter(k => k.startsWith('song-'))).toEqual(['song-demo-ryo', 'song-demo-nijika', 'song-demo-ryo2'])
    expect(scene['scene-foot']?.alt).toMatch(/^\+3 earlier songs · /)
    expect(await remote.find({ type: 'Button', key: 'panel-hide' })).toBeDefined()
    await remote.unmount()
  }
  // Hide: the band goes back to the strip.
  const toHide = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  await toHide.press({ key: 'panel-hide' })
  await clock.settle()
  await toHide.unmount()
  const after = await sceneOf(await $.ui.mount({ plugin: PLUGIN, surface: 'mobile', component: 'AbovePrompt', props: BAND_PROPS }))
  expect(after['scene-head']).toBeUndefined()
  expect(after['strip-sign']).toBeDefined()
})

test('the guard screen fits its picture to the room inside its frame, and keeps the command in view', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'crash'))
  const at = (bodyColumns: number, bodyRows = 40) => ({ ...PANE_PROPS, bodyColumns, scroll: { offset: 0, bodyRows } })
  const pictureAt = async (props: typeof PANE_PROPS) => {
    const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props })
    const raster = await pane.find({ type: 'Raster', key: 'blast-sprite' })
    const ascii = await pane.find({ type: 'Text', text: /C R A S H/ })
    const command = await pane.find({ type: 'Text', text: /rm -rf build/ })
    await pane.unmount()
    return { raster: raster?.props, ascii: ascii !== undefined, command: command !== undefined }
  }
  // What a picture's cells are, the parts laid on a canvas of w x h and drawn in quadrants on the screen's charcoal.
  const cellsOf = (parts: { id: string; x: number; y: number; zoom?: number }[], w: number, h: number) => encodeCells(composite(parts, w, h, 1_000_000), w, h, 'quad', '#1b1b1f').cells
  const panicMini = spriteId('bocchi', 'panic', 'mini')
  // 70 columns (what the pane asks for): her mini in half blocks (16 x 8 cells, drawn at zoom 2 in the quadrant canvas)
  // beside the crash in quadrants, 66 x 8 as before.
  const wide = (await pictureAt(at(70))).raster
  expect(wide).toMatchObject({ columns: 66, rows: 8 })
  expect(wide?.cells).toBe(cellsOf([{ id: panicMini, x: 0, y: 0, zoom: 2 }, { id: CRASH, x: 36, y: 0 }], 132, 32))
  const miniHalves = encodeCells(composite([{ id: panicMini, x: 0, y: 0 }], 16, 16, 1_000_000), 16, 16, 'half', '#1b1b1f').cells
  expect(halvesOf(String(wide?.cells), 66, 0, 0, 16, 8)).toEqual(halvesOf(miniHalves, 16, 0, 0, 16, 8))
  // 66: the frame leaves 62, too few for both: the crash alone.
  const crashOnly = (await pictureAt(at(66))).raster
  expect(crashOnly).toMatchObject({ columns: 48, rows: 8 })
  expect(crashOnly?.cells).toBe(cellsOf([{ id: CRASH, x: 0, y: 0 }], 96, 32))
  // 50: her mini and the small crash in 33 columns, 4 rows.
  const small = (await pictureAt(at(50))).raster
  expect(small).toMatchObject({ columns: 33, rows: 4 })
  expect(small?.cells).toBe(cellsOf([{ id: panicMini, x: 0, y: 0 }, { id: CRASH_MINI, x: 18, y: 0 }], 66, 16))
  // 30: the frame leaves 26, too few for her mini beside it: the small crash alone.
  expect((await pictureAt(at(30))).raster).toMatchObject({ columns: 24, rows: 4 })
  // Short on rows (a band): the small picture however wide.
  expect((await pictureAt(at(70, 26))).raster).toMatchObject({ rows: 4 })
  // Too narrow for any picture: the old ASCII line, and the command still shows.
  const narrow = await pictureAt(at(24))
  expect(narrow.raster).toBeUndefined()
  expect(narrow.ascii).toBe(true)
  expect(narrow.command).toBe(true)
  // On a remote surface: her whole figure and the crash at her feet, one CSS pixel a pixel.
  const blastD = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  const blastSvg = (await blastD.find({ type: 'Svg' }))?.props
  expect(String(blastSvg?.alt)).toMatch(/guitar/)
  expect(blastSvg).toMatchObject({ width: 180, height: 96, isInteractive: true })
  expect(String(blastSvg?.source).length).toBeLessThanOrEqual(SVG_LIMIT)
  await blastD.press({ key: 'blast-cancel' })
  await blastD.unmount()
})

test('a refused repaint parks the sprite and it picks up again once the surface takes it; a closed pane lets it go', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  const knobs: Answers = { refuseBlits: true }
  bottoms(on, clock, seen, knobs)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const panel = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  // Behind another pane's tab: every repaint is refused. Four sprites retry every beat for their first second
  // (a tree still mounting), then once a second: about 4 x (10 + 4), where every beat would be 4 x 50.
  await clock.advance(5000)
  const refused = seen.blits.filter(x => !x.isTaken).length
  expect(refused).toBeGreaterThan(0)
  expect(refused).toBeLessThan(80)
  // Shown again: the next retry is taken and the frames move on.
  knobs.refuseBlits = false
  await clock.advance(3000)
  expect(seen.blits.some(x => x.isTaken && x.requestId === 'kessoku-band')).toBe(true)
  // Closed (the panel opened at start; /kessoku takes it down through ui.close): no more repaints for it.
  await $.command.run(cmd('kessoku'))
  expect(seen.closed).toContain('kessoku-band')
  const before = seen.blits.length
  await panel.unmount()
  await clock.advance(5000)
  expect(seen.blits.slice(before).filter(x => x.requestId === 'kessoku-band')).toHaveLength(0)
})

test('sprites: quadrants never hide a drawn pixel in the background slot, on a light terminal or a dark one', async () => {
  const L = '#8fb8ff'
  const D = '#2b1a24'
  // A light quadrant over a dark one on the left, transparency on the right: the whole left column is drawn,
  // in the darker color, whichever is on top.
  for (const isLight of [false, true]) {
    for (const px of [[L, null, L, null, D, null, D, null], [D, null, D, null, L, null, L, null]]) {
      const w = words(encodeCells(px, 2, 4, 'quad', undefined, isLight).cells)
      expect([w.getUint32(0, true), w.getUint32(4, true), w.getUint32(8, true)]).toEqual([0x258c, 0x2b1a24, 0x01000000])
    }
  }
})

/** A drawing's leaves in document order: a Text's words, `[raster]`, `[button:<key>]`. */
function leaves(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') return out
  if (node === null || typeof node !== 'object') return out
  const el = node as { type?: string; props?: Record<string, unknown>; children?: unknown[] }
  const words = (n: unknown): string =>
    typeof n === 'string' ? n : n !== null && typeof n === 'object' ? ((n as { children?: unknown[] }).children ?? []).map(words).join('') : ''
  if (el.type === 'Text') out.push(words(el))
  else if (el.type === 'Raster') out.push('[raster]')
  else if (el.type === 'Button') out.push(`[button:${String(el.props?.key ?? '')}]`)
  else for (const c of el.children ?? []) leaves(c, out)
  return out
}

test('the guard screen held above the prompt keeps the command and the buttons first in a short band', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { unplaced: true })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'crash'))
  // No room for a pane: the screen is drawn in the band. A short band: no picture, no ASCII guitar either.
  const short = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, bodyColumns: 75, maxRows: 12, scroll: { offset: 0, bodyRows: 11 } } })
  const rows = leaves(await short.drawn())
  expect(rows[0]).toMatch(/DROPPED GUITAR/)
  expect(rows[1]).toMatch(/^Command/)
  expect(rows[2]).toMatch(/^Would/)
  expect(rows.some(r => r.includes('.-""""-.'))).toBe(false)
  expect(rows).not.toContain('[raster]')
  await short.unmount()
  // A tall band: the picture comes after the command and its damage.
  const tall = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, bodyColumns: 75, maxRows: 40, scroll: { offset: 0, bodyRows: 39 } } })
  const tallRows = leaves(await tall.drawn())
  expect(tallRows.indexOf('[raster]')).toBeGreaterThan(tallRows.findIndex(r => /^Would/.test(r)))
  await tall.press({ key: 'blast-cancel' })
  await tall.unmount()
})

test('the strip keeps its heads in a band of six to nine rows when no other mod draws below it', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const strip = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, maxRows: 8, scroll: { offset: 0, bodyRows: 7 } } })
  expect((await strip.find({ type: 'Raster', key: 'strip-sprites' }))?.props).toMatchObject({ columns: 35, rows: 4 })
  await strip.unmount()
})

test('a desktop drawing of the same pane does not stop the terminal sprites, and a narrow panel draws none', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const terminal = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  await clock.advance(1000)
  const phone = await $.ui.mount({ plugin: PLUGIN, surface: 'mobile', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect(await phone.find({ type: 'Svg' })).toBeDefined()
  const before = seen.blits.length
  await clock.advance(4000)
  expect(seen.blits.slice(before).some(x => x.requestId === 'kessoku-band' && x.isTaken)).toBe(true)
  await phone.unmount()
  await terminal.unmount()
  const narrow = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: { ...PANE_PROPS, bodyColumns: 30 } })
  expect(await narrow.find({ type: 'Raster' })).toBeUndefined()
  expect(await narrow.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeDefined()
  await narrow.unmount()
})

// ---- The slimes: each act on stage (a subagent) as its member's slime ------------------------------------------

/** The acts `/bocchi demo` seats, each with whose it is and the state its slime shows. */
const DEMO_ACTS = {
  'demo-nijika': ['nijika', 'active'],
  'demo-ryo': ['ryo', 'active'],
  'demo-ryo2': ['ryo', 'idle'],
  'demo-kita': ['kita', 'asleep'],
  'demo-kita2': ['kita', 'asleep'],
} as const

/** A slime mini as a tall panel's card draws it in a terminal: quadrants on the card's charcoal. */
function slimeCells(member: (typeof SPRITE_MEMBERS)[number], state: (typeof SLIME_STATES)[number], t: number): string {
  return encodeCells(composite([{ id: spriteId(member, state, 'slime-mini'), x: 0, y: 0 }], 18, 12, t), 18, 12, 'quad', '#26262c').cells
}

/** The props of the picture a remote surface's drawing holds under `key`: the Svg in the Box of that key. */
type Drawn = { find: (q: { type?: string; key?: string; text?: RegExp | string }) => Promise<{ children: unknown[]; props: Record<string, unknown> } | undefined>; findAll: (q: { type?: string }) => Promise<{ key?: string; children: unknown[]; props?: Record<string, unknown> }[]> }

/**
 * The desktop's live house as words: every picture's alt (and source), by the key of the Box it is drawn in:
 * `scene-stage`, `scene-plates`, `scene-head`, `song-<act id>`, `scene-foot`, `strip-sign`. A song's details
 * (revealed on hover) are under `detail:<act id>`.
 */
type ScenePicture = { alt: string; source: string; isInteractive: boolean; hover?: unknown; buttons?: { key?: string; label?: string }[]; box?: { props?: Record<string, unknown>; hover?: unknown } }

async function sceneOf(drawing: Drawn): Promise<Record<string, ScenePicture>> {
  const out: Record<string, ScenePicture> = {}
  const boxes = await drawing.findAll({ type: 'Box' })
  // A keyed Box's hover, read off its parent's children (a found element carries its props, not its hover).
  const hovers = new Map<string, unknown>()
  for (const box of boxes) {
    for (const child of box.children) {
      const n = child as { type?: unknown; key?: string; props?: { key?: string }; hover?: unknown }
      const k = n.key ?? n.props?.key
      if (n.type === 'Box' && typeof k === 'string') hovers.set(k, n.hover)
    }
  }
  for (const box of boxes) {
    if (box.key === undefined) continue
    const svgs = box.children.filter(c => typeof c === 'object' && c !== null && (c as { type?: unknown }).type === 'Svg') as { props: { alt: string; source: string; isInteractive?: boolean } }[]
    const first = svgs[0]
    // the keyed Box's own look too (a song's: its border, and the wash its hover paints)
    if (first !== undefined) out[box.key] = { alt: first.props.alt, source: first.props.source, isInteractive: first.props.isInteractive === true, box: { props: box.props, hover: hovers.get(box.key) } }
    // A song's hidden details: the Svg in the unkeyed Box under it.
    for (const child of box.children) {
      const inner = child as { type?: unknown; children?: unknown[]; hover?: unknown; props?: { display?: string } }
      if (inner.type !== 'Box' || inner.props?.display !== 'none' || box.key.startsWith('song-') === false) continue
      const svg = inner.children?.find(c => (c as { type?: unknown }).type === 'Svg') as { props: { alt: string; source: string; isInteractive?: boolean } } | undefined
      // The Buttons under the hidden Box, however deep.
      const buttons: { key?: string; label?: string }[] = []
      const walk = (node: unknown) => {
        const n = node as { type?: unknown; key?: string; props?: { label?: string; key?: string }; children?: unknown[] }
        if (n === null || typeof n !== 'object') return
        if (n.type === 'Button') buttons.push({ key: n.key ?? n.props?.key, label: n.props?.label })
        for (const c of n.children ?? []) walk(c)
      }
      walk(inner)
      if (svg !== undefined) out[`detail:${box.key.slice('song-'.length)}`] = { alt: svg.props.alt, source: svg.props.source, isInteractive: svg.props.isInteractive === true, hover: inner.hover, buttons }
    }
  }
  return out
}

async function svgUnder(drawing: { find: (q: { type?: string; key?: string }) => Promise<{ children: unknown[] } | undefined> }, key: string): Promise<Record<string, unknown> | undefined> {
  const box = await drawing.find({ type: 'Box', key })
  const svg = box?.children.find(c => typeof c === 'object' && c !== null && (c as { type?: unknown }).type === 'Svg') as { props?: Record<string, unknown> } | undefined
  return svg?.props
}

test('every act on stage is a slime in its member\'s pit: in her slot on a remote surface, one row under the stage in a terminal', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect((await $.command.run(cmd('bocchi', 'demo'))).text).toMatch(/five demo acts/)
  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    const pane = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    const scene = await sceneOf(pane)
    // The stage says who plays: Nijika's act, Ryo's two; Kita rests (her README's encore is no act on stage) with one failed.
    expect(scene['scene-stage']?.alt).toBe('Kessoku Band on stage, between sets: Bocchi resting (anxious); Nijika playing 1 (focused); Ryo playing 2 (focused); Kita resting (happy), 1 failed')
    // The setlist: the live songs first, then the failed one, then the rest; each its whole description and its figures.
    const songs = Object.keys(scene).filter(k => k.startsWith('song-')).map(k => k.slice('song-'.length))
    expect(songs).toEqual(['demo-ryo', 'demo-nijika', 'demo-ryo2', 'demo-kita2', 'demo-kita', 'main'])
    expect(scene['song-demo-ryo']?.alt).toMatch(/^Ryo · playing · Find every call site of legacyQuery\(\) · 0:17 · ctx \d+% · \$0\.\d\d · now Grep "legacyQuery"$/)
    expect(scene['song-demo-ryo2']?.alt).toMatch(/^Ryo · waiting · Benchmark the cache warm-up · /)
    expect(scene['song-demo-kita']?.alt).toMatch(/^Kita · encore · Update README for the new CLI flags · 1:31 · /)
    expect(scene['song-demo-kita2']?.alt).toMatch(/^Kita · failed · Polish the settings page styles · .* · last Edit src\/settings\.css$/)
    expect(scene['song-main']?.alt).toMatch(/^Bocchi \(main loop\) · /)
    // A song's details, revealed on hover: the tools by count, the model, steps and tokens; a button to open it on her page.
    expect(scene['detail:demo-ryo']?.alt).toMatch(/^Read 5 · Grep 4 · Bash 3 · claude-sonnet-5-5 · 7 steps · [\d.]+k tokens · general-purpose$/)
    for (const act of ['demo-nijika', 'demo-ryo', 'demo-ryo2', 'demo-kita', 'demo-kita2']) expect(await pane.find({ type: 'Button', key: `act-solo-${act}` })).toBeDefined()
    // The details sit in an unkeyed Box drawn hidden, revealed by the surface while the pointer is over the song's keyed
    // Box (its hover scope); an image, not a frame; its button opens the song on her page.
    expect(scene['detail:demo-ryo']).toMatchObject({ hover: { display: 'flex' }, isInteractive: false, buttons: [{ key: 'act-solo-demo-ryo', label: "Open on Ryo's page →" }] })
    expect(scene['detail:main']?.buttons).toEqual([])
    // The song's keyed Box is the card that opens: the board's green at rest and no border (a desktop pads a bordered
    // Box); under the pointer her chalk (Ryo's blue, not Kita's coral), which the song's stencil shows as a chalk box.
    const card = scene['song-demo-ryo']?.box
    expect(card?.props).toMatchObject({ backgroundColor: SCENE_COLORS.board })
    expect(card?.props?.borderStyle).toBeUndefined()
    const lit = (card?.hover ?? {}) as { backgroundColor?: string }
    expect([lit.backgroundColor === SCENE_COLORS.board, /^#[0-9a-f]{6}$/.test(lit.backgroundColor ?? '')]).toEqual([false, true])
    expect((scene['song-demo-kita']?.box?.hover as { backgroundColor?: string } | undefined)?.backgroundColor).not.toBe(lit.backgroundColor)
    // The song paints the board only through its stencil (round the card, a shade thinner inside, none on its lines);
    // the details paint the card's lower part themselves and close its chalk box.
    expect(scene['song-demo-ryo']?.source).toContain(`fill="${SCENE_COLORS.board}" mask="url(#cm)"`)
    expect(scene['detail:demo-ryo']?.source).toContain('filter="url(#cg)"')
    // The pictures say it too: the whole description, the failure stamped.
    expect(scene['song-demo-ryo']?.source).toContain('legacyQuery')
    expect(scene['song-demo-kita2']?.source).toContain('FAILED')
    expect(scene['song-demo-kita2']?.alt).not.toMatch(/Edit src\/settings\.css · Edit src\/settings\.css/)
    expect(await pane.find({ type: 'Button', key: 'act-solo-main' })).toBeUndefined()
    // Every picture is an image (an interactive frame would be drawn 300 x 150), each inside the Svg element's limit.
    expect(Object.entries(scene).filter(([, s]) => s.isInteractive).map(([k]) => k)).toEqual([])
    for (const [key, s] of Object.entries(scene)) expect([key, s.source.length <= SVG_LIMIT]).toEqual([key, true])
    await pane.unmount()
  }
  // A terminal: one row of slime minis in quadrants under the stage (39 x 3 cells for four), in the band's order.
  const term = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const pit = [['nijika', 'active'], ['ryo', 'active'], ['ryo', 'idle'], ['kita', 'asleep']] as const
  const raster = (await term.find({ type: 'Raster', key: 'stage-pit' }))?.props
  expect(raster).toMatchObject({ columns: 39, rows: 3 })
  expect(raster?.cells).toBe(encodeCells(composite(pit.map(([m, s], i) => ({ id: spriteId(m, s, 'slime-mini'), x: i * 20, y: 0 })), 78, 12, 1_000_000), 78, 12, 'quad', '#1b1b1f').cells)
  await term.unmount()
  // The encore is over eight seconds after the act ended: her line settles dim, its cost at the right again.
  await clock.advance(5000)
  const later = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(later))['song-demo-kita']?.alt).toMatch(/^Kita · done · Update README for the new CLI flags · /)
  await later.unmount()
})

test("the pit's running slime moves from one beat to the next, repainted in place", async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  const pitAt = (t: number) => {
    const acts = [['nijika', 'active'], ['ryo', 'active'], ['ryo', 'idle'], ['kita', 'asleep']] as const
    return encodeCells(composite(acts.map(([m, s], i) => ({ id: spriteId(m, s, 'slime-mini'), x: i * 20, y: 0 })), 78, 12, t), 78, 12, 'quad', '#1b1b1f').cells
  }
  const t1 = 1_000_000
  const t2 = Array.from({ length: 48 }, (_, k) => t1 + 100 * (k + 1)).find(t => pitAt(t) !== pitAt(t1))
  expect(t2).toBeDefined()
  const drawn = async () => {
    const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    const cells = (await pane.find({ type: 'Raster', key: 'stage-pit' }))?.props.cells
    await pane.unmount()
    return cells
  }
  const before = await drawn()
  await clock.advance((t2 as number) - t1)
  const after = await drawn()
  expect(after).not.toBe(before)
  expect(after).toBe(pitAt(t2 as number))
  // While the pane shows them, the sprite clock repaints the pit in place: no redraw.
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const from = seen.blits.length
  await clock.advance(3200)
  expect(seen.blits.slice(from).some(x => x.requestId === 'kessoku-band' && x.key === 'stage-pit' && x.isTaken)).toBe(true)
  await pane.unmount()
})

test('the strip shows the acts on stage as slimes after the heads, a finished act asleep there for half a minute', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  // In the band's order, each member's oldest first: Nijika's run, Ryo's wait and run, and Kita's README, which ended
  // 4 s ago (her act that failed 70 s ago has left the strip; it sleeps on her card).
  const acts = [['nijika', 'active'], ['ryo', 'idle'], ['ryo', 'active'], ['kita', 'asleep']] as const
  const words = /^3 slimes on stage \(2 playing, 1 waiting\) · \$0\.42 · /
  const desk = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  // The desktop's strip is the neon now-playing sign: one picture, its words the same story.
  expect((await sceneOf(desk))['strip-sign']?.alt).toMatch(/ · 3 on stage · \$0\.42 · 1 failed$/)
  expect((await sceneOf(desk))['strip-sign']?.source).toContain('Ryo')
  expect(await desk.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  expect(await desk.find({ type: 'Button', key: 'strip-hide' })).toBeDefined()
  await desk.unmount()
  // A terminal: the minis in quadrants in one Raster under the heads (39 x 3 cells), on the strip's charcoal.
  const term = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await term.find({ type: 'Raster', key: 'strip-sprites' }))?.props).toMatchObject({ columns: 35, rows: 4 })
  const raster = (await term.find({ type: 'Raster', key: 'strip-slimes' }))?.props
  expect(raster).toMatchObject({ columns: 39, rows: 3 })
  expect(raster?.cells).toBe(encodeCells(composite(acts.map(([m, s], i) => ({ id: spriteId(m, s, 'slime-mini'), x: i * 20, y: 0 })), 78, 12, 1_000_000), 78, 12, 'quad', '#1b1b1f').cells)
  // The heads' row first (their picture, the band's line, the buttons), the slimes' row under it.
  const order = leaves(await term.drawn())
  expect(order.indexOf('[raster]')).toBe(0)
  expect(order.lastIndexOf('[raster]')).toBeGreaterThan(order.indexOf('[button:strip-hide]'))
  expect(await term.find({ type: 'Text', text: words })).toBeDefined()
  // Half a minute after it ended Kita's act leaves the strip, though nothing on stage changed: the strip redraws itself.
  await clock.advance(25_000)
  expect((await term.find({ type: 'Raster', key: 'strip-slimes' }))?.props).toMatchObject({ columns: 39 })
  await clock.advance(1_200)
  expect((await term.find({ type: 'Raster', key: 'strip-slimes' }))?.props).toMatchObject({ columns: 29, rows: 3 })
  await term.unmount()
  const later = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await sceneOf(later))['strip-sign']?.alt).toMatch(/ · 3 on stage · /)
  await later.unmount()
  // The setlist keeps the act as a done song as long as it lists it, though her pit has let it go.
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(pane))['song-demo-kita']?.alt).toMatch(/^Kita · done · Update README for the new CLI flags · /)
  await pane.unmount()
  // A short band has no rows for the slimes under the heads: the count stays, in words.
  const low = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, maxRows: 6, scroll: { offset: 0, bodyRows: 5 } } })
  expect((await low.find({ type: 'Raster', key: 'strip-sprites' }))?.props).toMatchObject({ rows: 4 })
  expect(await low.find({ type: 'Raster', key: 'strip-slimes' })).toBeUndefined()
  expect(await low.find({ type: 'Text', text: words })).toBeDefined()
  await low.unmount()
  const oneLine = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, maxRows: 4, scroll: { offset: 0, bodyRows: 3 } } })
  expect(await oneLine.find({ type: 'Raster' })).toBeUndefined()
  expect(await oneLine.find({ type: 'Text', text: /^│ 3 slimes on stage \(2 playing, 1 waiting\) · / })).toBeDefined()
  await oneLine.unmount()
})

test('the strip draws six slimes at most and counts the rest', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  on('classic.SubagentStart', () => ({}))
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  // Eight searches at once: eight of Ryo's acts on stage.
  for (let i = 1; i <= 8; i += 1) await $.classic.SubagentStart({ agent_id: `agent-${i}`, agent_type: 'Explore' })
  for (const surface of SURFACES) {
    const strip = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
    if (surface === 'terminal') {
      expect((await strip.find({ type: 'Raster', key: 'strip-slimes' }))?.props).toMatchObject({ columns: 59, rows: 3 })
      expect(await strip.find({ type: 'Text', text: /^\+2$/ })).toBeDefined()
      expect(await strip.find({ type: 'Text', text: /^8 slimes on stage \(8 playing, 0 waiting\) · / })).toBeDefined()
    } else {
      expect((await sceneOf(strip))['strip-sign']?.alt).toMatch(/ · 8 on stage · /)
      // Hide takes the sign away; /bocchi strip brings it back.
      await strip.press({ key: 'strip-hide' })
      await clock.settle()
      const hidden = await $.ui.mount({ plugin: PLUGIN, surface: 'mobile', component: 'AbovePrompt', props: BAND_PROPS })
      expect((await sceneOf(hidden))['strip-sign']).toBeUndefined()
      await hidden.unmount()
      await $.command.run(cmd('bocchi', 'strip'))
    }
    await strip.unmount()
  }
  // The panel (600 px: the band in one row at x2): three slimes fit her quarter of the stage's front and `+5` counts the
  // rest; her channel lists four acts and counts the rest; her tag counts all eight.
  const boardPane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const board = await sceneOf(boardPane)
  await boardPane.unmount()
  expect(Object.keys(board).filter(k => k.startsWith('song-'))).toHaveLength(8)
  expect(board['scene-stage']?.source).toMatch(/>\s*\+5\s*</)
  expect(board['scene-foot']?.alt).toMatch(/^\+1 earlier songs · /)
  const panel = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect(await panel.find({ type: 'Text', text: /^\+2$/ })).toBeDefined()
  expect((await panel.findAll({ type: 'Box' })).filter(box => box.key?.startsWith('entry-'))).toHaveLength(4)
  expect(await panel.find({ type: 'Text', text: /^\+ 4 more$/ })).toBeDefined()
  expect(await panel.find({ type: 'Text', text: /^ ×8$/ })).toBeDefined()
  await panel.unmount()
})

test('characterArt kaomoji keeps the text faces and draws no pictures', { options: { characterArt: 'kaomoji', applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  // Acts on stage in every state, and still no slime anywhere: the rows and the count read as they always did.
  await $.command.run(cmd('bocchi', 'demo'))
  for (const surface of SURFACES) {
    const panel = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    expect(await panel.find({ type: 'Raster' })).toBeUndefined()
    expect(await panel.find({ type: 'Svg' })).toBeUndefined()
    expect(await panel.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeDefined()
    expect(await panel.find({ type: 'Text', text: /legacyQuery/ })).toBeDefined()
    // The stage as faces: her pit as glyphs in her colour (Ryo's two acts playing, Kita's README just done), her count by her tag.
    expect((await panel.find({ type: 'Text', text: /^♪ ♪$/ }))?.props).toMatchObject({ color: MEMBERS.ryo.color })
    expect((await panel.find({ type: 'Text', text: /^✓$/ }))?.props).toMatchObject({ color: MEMBERS.kita.color })
    expect(await panel.find({ type: 'Text', text: /^ ×2$/ })).toBeDefined()
    expect(await panel.find({ type: 'Button', key: 'act-solo-demo-ryo2' })).toBeDefined()
    await panel.unmount()
    const strip = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
    expect(await strip.find({ type: 'Raster' })).toBeUndefined()
    expect(await strip.find({ type: 'Svg' })).toBeUndefined()
    expect(await strip.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeDefined()
    expect(await strip.find({ type: 'Text', text: /^│ 3 on stage · / })).toBeDefined()
    await strip.unmount()
  }
  // The guard screen keeps its ASCII guitar.
  await $.command.run(cmd('bocchi', 'crash'))
  const blastT = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  expect(await blastT.find({ type: 'Raster' })).toBeUndefined()
  expect(await blastT.find({ type: 'Text', text: /C R A S H/ })).toBeDefined()
  await blastT.press({ key: 'blast-cancel' })
  await blastT.unmount()
  await clock.advance(3000)
  expect(seen.blits).toHaveLength(0)
})

// ---- The v0.5.0 polish ---------------------------------------------------------------

/** A conversation to compact: the engine refuses an empty one. */
const TRANSCRIPT = [
  { role: 'user' as const, text: 'where were we?', toolUses: [] },
  { role: 'assistant' as const, text: 'renaming greet to welcome', toolUses: [] },
]

test('a compaction melts Bocchi in the strip, then the panel and Cache Tax read the compacted set', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  const knobs: Answers = { compactMs: 3000 }
  bottoms(on, clock, seen, knobs)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  // A warm turn of 300k tokens, as Cache Tax books it; the panel reads the engine's 12%.
  await $.turn.start({ text: 'warm up', turnId: 't1' })
  const step = $.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 900, isAborted: false, reason: 'answer' })
  expect((await $.command.run(cmd('cache-tax'))).text).toMatch(/cache warm/)
  // /compact: while the engine summarizes (three seconds here), Bocchi melts in the strip and the status line.
  const compacting = $.session.compact({ trigger: 'manual', messages: TRANSCRIPT })
  await clock.settle()
  expect(seen.status.at(-1)).toMatch(/compacting the set/)
  const melting = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(melting))['scene-stage']?.alt).toMatch(/: Bocchi resting \(melting\);/)
  await melting.unmount()
  await clock.advance(3000)
  const stood = await compacting
  expect(stood.skip).toBeUndefined()
  expect(seen.toasts.some(t => /the set is compacted: 180k → 12\.0k tokens/.test(t))).toBe(true)
  expect(seen.status.at(-1)).not.toMatch(/compacting/)
  // The panel's ctx is the compacted set over the window (12k of 200k), not the 12% the engine measured before (the
  // desktop's drawing: a terminal's would start the sprite clock, which the hour below would have to tick through).
  const panel = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(panel))['scene-foot']?.alt).toMatch(/ · ctx 6% · /)
  await panel.unmount()
  // Cache Tax: nothing is cached for the new transcript, and the next write is priced at the compacted size.
  const report = (await $.command.run(cmd('cache-tax'))).text
  expect(report).toMatch(/nothing cached yet/)
  expect(report).toMatch(/12\.0k tokens/)
  // An hour on, the send is not held: there is no cache entry to pay for (before the compaction it would have been).
  await clock.advance(61 * 60_000)
  const sent = await $.prompt.submit(typed('where were we?'))
  expect(sent.drop).toBeUndefined()
  expect(sent.text).toBe('where were we?')
  // The precompute pass and a subagent's compaction leave the band alone; a vetoed one only brings Bocchi back.
  knobs.compactMs = 0
  const lines = seen.status.length
  await $.session.compact({ trigger: 'precompute', messages: TRANSCRIPT })
  await $.session.compact({ trigger: 'auto', agentId: 'agent-1', messages: TRANSCRIPT })
  expect(seen.status.length).toBe(lines)
  knobs.compactSkip = 'off'
  const vetoed = await $.session.compact({ trigger: 'auto', messages: TRANSCRIPT })
  expect(vetoed.skip).toBe('off')
  expect(seen.status.at(-1)).not.toMatch(/compacting/)
})

test('typeahead: /bocchi and /keepwarm complete their next word, and nothing else does', async () => {
  // The box with the caret at its end: the token is the last word.
  const at = (text: string) => {
    const start = text.lastIndexOf(' ') + 1
    return { text, cursor: text.length, token: text.slice(start), start }
  }
  const texts = (text: string) => completions(at(text)).map(c => c.text)
  expect(texts('/bocchi')).toEqual(['/bocchi theme', '/bocchi mood', '/bocchi demo', '/bocchi tax', '/bocchi crash', '/bocchi memo', '/bocchi setlist', '/bocchi solo', '/bocchi strip', '/bocchi help'])
  expect(texts('/bocchi t')).toEqual(['theme', 'tax'])
  expect(texts('/bocchi T')).toEqual(['theme', 'tax'])
  expect(texts('/bocchi s')).toEqual(['setlist', 'solo', 'strip'])
  expect(texts('/bocchi solo')).toEqual([])
  expect(texts('/bocchi solo ')).toEqual(['bocchi', 'nijika', 'ryo', 'kita', 'off'])
  expect(texts('/bocchi solo r')).toEqual(['ryo'])
  expect(texts('/bocchi theme')).toEqual([])
  expect(texts('/bocchi theme o')).toEqual(['on', 'off'])
  expect(texts('/bocchi mood h')).toEqual(['happy', 'hiding'])
  expect(texts('/bocchi demo o')).toEqual(['off'])
  expect(texts('/bocchi memo p')).toEqual(['proposed'])
  expect(texts('/bocchi memo proposed x')).toEqual([])
  expect(texts('/bocchi tax x')).toEqual([])
  expect(texts('/bocchi theme on x')).toEqual([])
  expect(texts('/keepwarm')).toEqual(['/keepwarm 30m', '/keepwarm 1h', '/keepwarm 2h', '/keepwarm off'])
  expect(texts('/keepwarm 1')).toEqual(['1h'])
  expect(texts('/keepwarm o')).toEqual(['off'])
  expect(texts('/keepwarm 1h 2')).toEqual([])
  for (const other of ['/boc', '/bocch', '/replay', '/kessoku', 'bocchi t', 'fix the /bocchi t', '/compact t']) expect(texts(other)).toEqual([])
  // Every row says what it does, in the help's words.
  expect(completions(at('/bocchi')).every(c => (c.description ?? '').length > 0)).toBe(true)
  expect(completions(at('/bocchi t'))[0]?.description).toMatch(/theme/)
  // A caret in the middle of the draft completes the word under it.
  expect(completions({ text: '/bocchi theme on', cursor: 9, token: 't', start: 8 }).map(c => c.text)).toEqual(['theme', 'tax'])
})

test('after a turn with edits the prompt box is offered /replay, Tab to take; a turn without edits offers nothing', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'look around', turnId: 't1' })
  await $.turn.complete({ turnId: 't1', answer: 'nothing to change', durationMs: 500, isAborted: false, reason: 'answer' })
  expect(seen.suggested).toEqual([])
  await $.turn.start({ text: 'rename greet', turnId: 't2' })
  await $.tool.call({ tool: 'Edit', file_path: '/proj/src/app.ts', old_string: 'greet(', new_string: 'welcome(' })
  await $.turn.complete({ turnId: 't2', answer: 'done', durationMs: 1200, isAborted: false, reason: 'answer' })
  expect(seen.suggested).toEqual(['/replay 1 track'])
  // Taken and sent, the suggestion runs as the command: the words after /replay are ignored.
  expect((await $.command.run(cmd('replay', '1 track'))).text).toMatch(/1 track on the setlist/)
  // An interrupted turn with edits, and a turn while Replay is open, offer nothing.
  await $.turn.start({ text: 'rename again', turnId: 't3' })
  await $.tool.call({ tool: 'Edit', file_path: '/proj/src/app.ts', old_string: 'welcome(', new_string: 'hello(' })
  await $.turn.complete({ turnId: 't3', answer: '', durationMs: 300, isAborted: true, reason: 'aborted' })
  expect(seen.suggested).toHaveLength(1)
  await $.turn.start({ text: 'and again', turnId: 't4' })
  await $.tool.call({ tool: 'Edit', file_path: '/proj/src/app.ts', old_string: 'hello(', new_string: 'hi(' })
  await $.turn.complete({ turnId: 't4', answer: 'done', durationMs: 300, isAborted: false, reason: 'answer' })
  expect(seen.suggested).toHaveLength(1)
  // The typeahead hook itself: the kit raises the event (untyped, as it is not among its typed engine calls).
  type Box = { text: string; cursor: number; token: string; start: number }
  const autocomplete = ($ as unknown as { prompt: { autocomplete: (e: Box) => Promise<{ suggestions: { text: string; description?: string }[] }> } }).prompt.autocomplete
  const rows = await autocomplete({ text: '/bocchi t', cursor: 9, token: 't', start: 8 })
  expect(rows.suggestions.map(s => s.text)).toEqual(['theme', 'tax'])
  expect(rows.suggestions[0]?.description).toMatch(/theme/)
  expect((await autocomplete({ text: '/replay x', cursor: 9, token: 'x', start: 8 })).suggestions).toEqual([])
})

test('native notifications: the guard holding a command, a long set done, the cache about to go cold', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  const knobs: Answers = {}
  bottoms(on, clock, seen, knobs)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  // The guard: told once the screen is up, with what the command would do.
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await clock.settle()
  expect(seen.notified).toHaveLength(1)
  expect(seen.notified[0]?.title).toBe('Kessoku Band')
  expect(seen.notified[0]?.text).toBe('Blast Radius is holding rm -rf: it would delete 3 files (about 1.3 MB). Answer the dropped-guitar screen.')
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  await pane.press({ key: 'blast-cancel' })
  await clock.advance(300)
  expect((await call).deny).toMatch(/caught the guitar/)
  await pane.unmount()
  // A short set ends unannounced; a long one with edits is announced with its count.
  await $.turn.start({ text: 'quick', turnId: 't1' })
  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 3000, isAborted: false, reason: 'answer' })
  expect(seen.notified).toHaveLength(1)
  await $.turn.start({ text: 'long', turnId: 't2' })
  const step = $.turn.step({ turnId: 't2', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await $.tool.call({ tool: 'Edit', file_path: '/proj/src/app.ts', old_string: 'greet(', new_string: 'welcome(' })
  await $.turn.complete({ turnId: 't2', answer: 'done', durationMs: 72_000, isAborted: false, reason: 'answer' })
  expect(seen.notified[1]?.text).toBe('Nijika: the set is done after 1:12 · 1 edit on the setlist (/replay)')
  // Five minutes before the hour-long TTL lapses, idle and without keepwarm: told once, priced like the tax.
  await clock.advance(54 * 60_000)
  expect(seen.notified).toHaveLength(2)
  await clock.advance(2 * 60_000)
  expect(seen.notified).toHaveLength(3)
  expect(seen.notified[2]?.text).toMatch(/^Cache Tax: the cache goes cold in 4:\d\d · re-writing 30[34]k tokens would cost ≈\$\d/)
  expect(seen.notified[2]?.text).toMatch(/\/keepwarm keeps it warm$/)
  await clock.advance(3 * 60_000)
  expect(seen.notified).toHaveLength(3)
  expect(seen.toasts.some(t => /goes cold/.test(t))).toBe(false)
  // A set that stopped on an error is announced too; an interrupted one is not (the person was there).
  await $.turn.start({ text: 'again', turnId: 't3' })
  await $.turn.complete({ turnId: 't3', answer: '', durationMs: 40_000, isAborted: false, reason: 'error' })
  expect(seen.notified[3]?.text).toBe('Nijika: the set stopped on error after 0:40')
  await $.turn.start({ text: 'once more', turnId: 't4' })
  await $.turn.complete({ turnId: 't4', answer: '', durationMs: 40_000, isAborted: true, reason: 'aborted' })
  expect(seen.notified).toHaveLength(4)
  // No channel (the desktop app): the cold-cache notice becomes a toast; the guard and the set keep their screens.
  knobs.notifyReason = 'no-surface'
  await clock.advance(56 * 60_000)
  expect(seen.notified).toHaveLength(5)
  expect(seen.toasts.filter(t => /goes cold/.test(t))).toHaveLength(1)
  const held = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await clock.settle()
  expect(seen.notified).toHaveLength(6)
  expect(seen.toasts.filter(t => /holding/.test(t))).toHaveLength(0)
  const pane2 = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  await pane2.press({ key: 'blast-cancel' })
  await clock.advance(300)
  expect((await held).deny).toMatch(/caught the guitar/)
  await pane2.unmount()
})

test('toasts none silences the notifications too', { options: { toasts: 'none', applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await clock.settle()
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  await pane.press({ key: 'blast-cancel' })
  await clock.advance(300)
  expect((await call).deny).toMatch(/caught the guitar/)
  await pane.unmount()
  await $.turn.start({ text: 'long', turnId: 't1' })
  const step = $.turn.step({ turnId: 't1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1 })
  for await (const chunk of step) void chunk
  await $.turn.complete({ turnId: 't1', answer: 'done', durationMs: 72_000, isAborted: false, reason: 'answer' })
  await clock.advance(58 * 60_000)
  expect(seen.notified).toEqual([])
  expect(seen.toasts).toEqual([])
})

test('/bocchi help opens with the mod and engine versions, and names what this engine lacks', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  const knobs: Answers = {}
  bottoms(on, clock, seen, knobs)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const lines = ((await $.command.run(cmd('bocchi', 'help'))).text ?? '').split('\n')
  expect(lines[0]).toBe('♪ Kessoku Ultimate Bocchi Theme v9.9.9 · Claude Code 2.1.299')
  expect(lines.some(l => l.startsWith('/kessoku'))).toBe(true)
  expect(lines.some(l => l.startsWith('off on this engine'))).toBe(false)
  // An older engine is named as such; one that cannot say its version, as unknown.
  knobs.engineVersion = '2.1.280'
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect(((await $.command.run(cmd('bocchi', 'help'))).text ?? '').split('\n')[0]).toBe('♪ Kessoku Ultimate Bocchi Theme v9.9.9 · Claude Code 2.1.280 (older than the mod expects, 2.1.287+)')
  knobs.noVersion = true
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect(((await $.command.run(cmd('bocchi', 'help'))).text ?? '').split('\n')[0]).toBe('♪ Kessoku Ultimate Bocchi Theme v9.9.9 · Claude Code (version unknown)')
  // The pure parts: versions compare as releases, dev builds included; what does not parse is never enough.
  expect(parseVersion('2.1.299')).toEqual([2, 1, 299])
  expect(parseVersion('2.1.280-dev.20260920.t101500.sha1a2b3c4')).toEqual([2, 1, 280])
  expect(parseVersion('v2.1.1')).toEqual([2, 1, 1])
  expect(parseVersion('dev')).toBeNull()
  expect(isAtLeast('2.1.299', '2.1.287')).toBe(true)
  expect(isAtLeast('2.1.287', '2.1.287')).toBe(true)
  expect(isAtLeast('2.1.280', '2.1.287')).toBe(false)
  expect(isAtLeast('3.0.0', '2.1.287')).toBe(true)
  expect(isAtLeast('2.10.0', '2.9.9')).toBe(true)
  expect(isAtLeast('', '2.1.287')).toBe(false)
  const allOn = { suggest: true, notify: true, version: true, agents: true, memo: true }
  expect(offLine(allOn)).toBe('')
  expect(offLine({ ...allOn, notify: false })).toBe('off on this engine: native notifications (no $.ui.notify)')
  expect(offLine({ ...allOn, suggest: false, version: false })).toBe('off on this engine: the Replay suggestion (no $.prompt.suggest), the engine version (no $.session.version)')
  expect(offLine({ ...allOn, agents: false, memo: false })).toBe('off on this engine: the band agent types (no $.agent.register), the memo tool (no $.tool.register)')
  // Help names the band types and the memo tool, and every /bocchi word the typeahead offers.
  expect(lines.some(l => l.startsWith('Band agent types:') && l.includes('kessoku-ultimate-bocchi:nijika'))).toBe(true)
  expect(lines.some(l => /memo tool/.test(l))).toBe(true)
  expect(lines.some(l => l.includes('/bocchi memo [proposed]'))).toBe(true)
})

test('a refused registration breaks nothing: the session starts, help names no missing call, band types still seat by name', { options: { applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen, { refuseRegister: true })
  const dispatched: string[] = []
  on('agent.spawn', ($, e) => {
    dispatched.push(e.subagentType)
    return { model: 'claude-sonnet-5-5', agentId: `agent-${dispatched.length}` }
  })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  expect(seen.agents).toEqual([])
  expect(seen.tools).toEqual([])
  expect(seen.opened).toContain('kessoku-band')
  // A refusal is not a missing call: nothing is named off (that line is for an engine without $.agent.register or $.tool.register).
  const lines = ((await $.command.run(cmd('bocchi', 'help'))).text ?? '').split('\n')
  expect(lines.some(l => l.startsWith('off on this engine'))).toBe(false)
  // Nothing was registered to dispatch to, so the short name goes on as spelled; the tables and the seat still work.
  await $.agent.spawn({ tool_use_id: 'tu-a', prompt: 'Look around.', description: 'Explore the repo', subagentType: 'Explore', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  expect(seen.toasts.some(t => /Ryo takes the stage: Explore the repo$/.test(t))).toBe(true)
  await $.agent.spawn({ tool_use_id: 'tu-b', prompt: 'Fix it.', description: 'Fix the README typo', subagentType: 'kessoku:kita', provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  expect(dispatched).toEqual(['Explore', 'kessoku:kita'])
  expect(seen.toasts.some(t => /Kita takes the stage: Fix the README typo \(seated by name: kessoku:kita\)/.test(t))).toBe(true)
})

// ---- The v0.7.0 Live Stage ---------------------------------------------------------------

test('sprites: a spotlight behind a slot, lit or at rest, and a dimmed part shaded on both surfaces', async () => {
  expect(shade('#ffffff', '#000000', 0.5)).toBe('#808080')
  expect(shade('#f7a8c9', '#1b1b1f', 0)).toBe('#f7a8c9')
  expect(shade('#f7a8c9', '#1b1b1f', 1)).toBe('#1b1b1f')
  const lit = { color: '#8fb8ff', isLit: true, floor: 96 }
  const rest = { ...lit, isLit: false }
  // A gradient id per color and state, so four slots never share one.
  expect(stageGradientId(lit)).not.toBe(stageGradientId(rest))
  expect(stageGradientId(lit)).not.toBe(stageGradientId({ ...lit, color: '#ffd166' }))
  // The cone from the top's middle sixth to the full width at the floor, strong lit, faint at rest; the pool on the floor.
  expect(stageMarkup(lit, 96, 122)).toContain('points="40,0 56,0 96,96 0,96"')
  expect(stageMarkup(lit, 96, 122)).toContain('stop-opacity="0.55"')
  expect(stageMarkup(rest, 96, 122)).toContain('stop-opacity="0.12"')
  expect(stageMarkup(lit, 96, 122)).toContain('<ellipse cx="48" cy="96"')
  // Drawn before the sprite, and only when asked; the cache tells the two apart.
  const id = spriteId('ryo', 'focused', 'full')
  const plain = drawSvg([{ id, x: 0, y: 0 }], 96, 96, 1).svg
  const staged = drawSvg([{ id, x: 0, y: 0 }], 96, 96, 1, SPRITES, lit).svg
  expect(plain).not.toContain('<polygon')
  expect(staged.indexOf('<polygon')).toBeGreaterThan(0)
  expect(staged.indexOf('<polygon')).toBeLessThan(staged.indexOf('<path'))
  expect(staged.length).toBeLessThanOrEqual(SVG_LIMIT)
  // A dimmed part: faded and desaturated in an SVG, its pixels two thirds of the way to the charcoal in a terminal.
  const dim = drawSvg([{ id, x: 0, y: 0, dim: true }], 96, 96, 1).svg
  expect(dim).toContain('<g opacity="0.35" filter="url(#kessoku-dim)">')
  expect(dim).toContain('<feColorMatrix type="saturate" values="0.2"/>')
  expect(plain).not.toContain('kessoku-dim')
  const px = composite([{ id, x: 0, y: 0 }], 96, 96, 0)
  const shaded = composite([{ id, x: 0, y: 0, dim: true }], 96, 96, 0)
  expect(shaded.every((p, i) => (px[i] === null ? p === null : p === shade(px[i] as string, '#1b1b1f', 2 / 3)))).toBe(true)
  expect(shaded.some((p, i) => p !== px[i])).toBe(true)
})

test('solo: her name opens her channel across the mixer with every act in full; the same press, m or /bocchi solo off is the mix', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  const mount = (surface: (typeof SURFACES)[number]) => $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  for (const surface of ['terminal'] as const) {
    // The mix: four channels, each name a button with her letter.
    const mix = await mount(surface)
    const mixHeads = (await mix.find({ type: 'Raster', key: 'stage-heads' }))?.props.cells
    for (const [member, key] of [['bocchi', 'b'], ['nijika', 'n'], ['ryo', 'r'], ['kita', 'k']] as const) {
      expect((await mix.find({ type: 'Button', key: `solo-${member}` }))?.props).toMatchObject({ hotkey: key })
      expect(await mix.find({ type: 'Box', key: `chan-${member}` })).toBeDefined()
    }
    expect(await mix.find({ type: 'Button', key: 'solo-mix' })).toBeUndefined()
    await mix.press({ key: 'solo-ryo' })
    await clock.settle()
    await mix.unmount()
    // Her solo: the others folded to a strip each, her acts as cards with every figure, the tool tally and the tool in hand.
    const solo = await mount(surface)
    expect(await solo.find({ type: 'Text', text: /^ SOLO $/ })).toBeDefined()
    expect(await solo.find({ type: 'Text', text: /^Ryo$/ })).toBeDefined()
    for (const member of ['bocchi', 'nijika', 'kita']) expect(await solo.find({ type: 'Box', key: `strip-chan-${member}` })).toBeDefined()
    expect(await solo.find({ type: 'Box', key: 'chan-ryo' })).toBeUndefined()
    const cards = (await solo.findAll({ type: 'Box' })).filter(box => box.key?.startsWith('solo-card-')).map(box => box.key)
    expect(cards).toEqual(['solo-card-demo-ryo', 'solo-card-demo-ryo2'])
    expect(await solo.find({ type: 'Text', text: /^ctx [▰▱]{10} \d+% · tokens [\d.]+k · cost ≈\$[\d.]+ · started / })).toBeDefined()
    expect(await solo.find({ type: 'Text', text: /^Read ×5 · Grep ×4 · Bash ×3 · now: Grep "legacyQuery"$/ })).toBeDefined()
    expect(await solo.find({ type: 'Button', key: 'solo-mix' })).toBeDefined()
    expect((await solo.find({ type: 'Raster', key: 'solo-figure' }))?.props).toMatchObject({ columns: 16, rows: 8 })
    // The stage dims every head but hers.
    const soloHeads = (await solo.find({ type: 'Raster', key: 'stage-heads' }))?.props.cells
    expect(soloHeads).toBeDefined()
    expect(soloHeads).not.toBe(mixHeads)
    // An act's number under her pit puts that act first; m is the mix.
    await solo.press({ key: 'act-solo-demo-ryo2' })
    await clock.settle()
    await solo.unmount()
    const first = await mount(surface)
    expect((await first.findAll({ type: 'Box' })).filter(box => box.key?.startsWith('solo-card-')).map(box => box.key)).toEqual(['solo-card-demo-ryo2', 'solo-card-demo-ryo'])
    await first.press({ key: 'solo-mix' })
    await clock.settle()
    await first.unmount()
    const back = await mount(surface)
    expect(await back.find({ type: 'Box', key: 'chan-ryo' })).toBeDefined()
    expect(await back.find({ type: 'Text', text: /^ SOLO $/ })).toBeUndefined()
    // Her name twice: her solo, then the mix.
    await back.press({ key: 'solo-kita' })
    await clock.settle()
    await back.press({ key: 'solo-kita' })
    await clock.settle()
    await back.unmount()
    const again = await mount(surface)
    expect(await again.find({ type: 'Text', text: /^ SOLO $/ })).toBeUndefined()
    await again.unmount()
  }
  // The desktop: the live house. The mix lists every member's songs; her name (a native button) opens her page.
  const sceneNow = async () => {
    const pane = await mount('desktop')
    const scene = await sceneOf(pane)
    return { pane, scene, songs: Object.keys(scene).filter(k => k.startsWith('song-')).map(k => k.slice('song-'.length)) }
  }
  const mixed = await sceneNow()
  for (const [member, key] of [['bocchi', 'b'], ['nijika', 'n'], ['ryo', 'r'], ['kita', 'k']] as const) expect((await mixed.pane.find({ type: 'Button', key: `solo-${member}` }))?.props).toMatchObject({ hotkey: key })
  expect(await mixed.pane.find({ type: 'Button', key: 'solo-mix' })).toBeUndefined()
  expect(mixed.songs).toContain('demo-nijika')
  await mixed.pane.press({ key: 'solo-ryo' })
  await clock.settle()
  await mixed.pane.unmount()
  // Her page: her songs alone, every one in full (no hover needed), the stage lit for her alone, the mix a primary button.
  const page = await sceneNow()
  expect(page.scene['scene-head']?.alt).toMatch(/^Ryo's page · bass · 2 acts · \$/)
  expect(page.songs).toEqual(['demo-ryo', 'demo-ryo2'])
  expect(Object.keys(page.scene).some(k => k.startsWith('detail:'))).toBe(false)
  expect(page.scene['scene-stage']?.alt).toMatch(/, Ryo on solo: /)
  // The others faded under the dark; the mix fades no one.
  expect(page.scene['scene-stage']?.source).toContain('kessoku-dim')
  expect(mixed.scene['scene-stage']?.source).not.toContain('kessoku-dim')
  expect((await page.pane.find({ type: 'Button', key: 'solo-mix' }))?.props).toMatchObject({ hotkey: 'm', variant: 'primary' })
  expect((await page.pane.find({ type: 'Button', key: 'solo-ryo' }))?.props).toMatchObject({ variant: 'primary' })
  await page.pane.press({ key: 'solo-mix' })
  await clock.settle()
  await page.pane.unmount()
  // From a song's details (revealed on hover), "Open on her page" puts that song first.
  const opened = await sceneNow()
  expect(opened.scene['scene-stage']?.alt).not.toMatch(/on solo/)
  await opened.pane.press({ key: 'act-solo-demo-ryo2' })
  await clock.settle()
  await opened.pane.unmount()
  const firstSong = await sceneNow()
  expect(firstSong.songs).toEqual(['demo-ryo2', 'demo-ryo'])
  // Her name twice: her page, then the mix.
  await firstSong.pane.press({ key: 'solo-kita' })
  await clock.settle()
  await firstSong.pane.press({ key: 'solo-kita' })
  await clock.settle()
  await firstSong.pane.unmount()
  const backToMix = await sceneNow()
  expect(backToMix.scene['scene-head']?.alt).toMatch(/^Setlist · /)
  await backToMix.pane.unmount()
  // From the prompt, where the panel never holds the focus.
  expect((await $.command.run(cmd('bocchi', 'solo nijika'))).text).toMatch(/Nijika on solo/)
  const cmdSolo = await mount('desktop')
  expect((await sceneOf(cmdSolo))['scene-head']?.alt).toMatch(/^Nijika's page · /)
  expect((await sceneOf(cmdSolo))['song-demo-nijika']).toBeDefined()
  await cmdSolo.unmount()
  expect((await $.command.run(cmd('bocchi', 'solo off'))).text).toMatch(/back to the mix/)
  expect((await $.command.run(cmd('bocchi', 'solo drums'))).text).toMatch(/^\/bocchi solo </)
  // Bocchi's solo is the main loop: the set's own figures.
  await $.command.run(cmd('bocchi', 'solo bocchi'))
  const main = await mount('desktop')
  expect((await sceneOf(main))['song-main']?.alt).toMatch(/^Bocchi \(main loop\) · /)
  expect(await (await mount('terminal')).find({ type: 'Box', key: 'solo-card-main' })).toBeDefined()
  await main.unmount()
  expect((await $.command.run(cmd('bocchi', 'help'))).text).toMatch(/\/bocchi solo </)
})

test('a solo ends itself after the encore of her last act; autoSolo opens one for a new act and never cuts short a chosen one', { options: { autoSolo: true, applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  let n = 0
  on('agent.spawn', () => {
    n += 1
    return { model: 'claude-sonnet-5-5', agentId: `agent-${n}` }
  })
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const spawn = (subagentType: string, description: string) =>
    $.agent.spawn({ tool_use_id: `tu-${description}`, prompt: 'Go.', description, subagentType, provider: { plugin: 'engine', tier: 'core' }, parentModel: 'claude-sonnet-5-5', background: false, fork: false })
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  // Whose solo the open pane draws: its stage says `…, Ryo on solo: …`. The pane stays mounted: what it shows after a
  // wait is what its own timers redrew.
  const soloOf = async () => {
    const named = /, (Bocchi|Nijika|Ryo|Kita) on solo: /.exec((await sceneOf(pane))['scene-stage']?.alt ?? '')?.[1]
    return named === undefined ? null : named.toLowerCase()
  }
  // A new act: her solo for ten seconds, then the mix.
  await spawn(`${PLUGIN}:ryo`, 'Find where the strip is drawn')
  expect(await soloOf()).toBe('ryo')
  await clock.advance(10_100)
  expect(await soloOf()).toBeNull()
  // Her name pressed once after the automatic solo ran out opens her page: the press reads what is drawn.
  await pane.press({ key: 'solo-ryo' })
  await clock.settle()
  expect(await soloOf()).toBe('ryo')
  await pane.press({ key: 'solo-ryo' })
  await clock.settle()
  expect(await soloOf()).toBeNull()
  // Two automatic solos half a second apart: the second takes the stage and ends on its own due, not the first's.
  await spawn(`${PLUGIN}:kita`, 'Fix the README typo')
  await clock.advance(500)
  await spawn(`${PLUGIN}:nijika`, 'Plan the rollout')
  await clock.advance(9_700)
  expect(await soloOf()).toBe('nijika')
  await clock.advance(400)
  expect(await soloOf()).toBeNull()
  // A solo chosen by hand outlives another member's new act.
  await $.command.run(cmd('bocchi', 'solo nijika'))
  await spawn(`${PLUGIN}:ryo`, 'Look again')
  expect(await soloOf()).toBe('nijika')
  await clock.advance(10_100)
  expect(await soloOf()).toBe('nijika')
  // Her act ends, so her solo would end after its encore; her next act, in time, keeps it up.
  await $.turn.complete({ turnId: 'a3', agentId: 'agent-3', answer: 'planned', durationMs: 4000, isAborted: false, reason: 'answer' })
  await clock.advance(4000)
  await spawn(`${PLUGIN}:nijika`, 'Review the plan')
  await clock.advance(6000)
  expect(await soloOf()).toBe('nijika')
  // Her last act ends for good: the encore, then the mix.
  await $.turn.complete({ turnId: 'a5', agentId: 'agent-5', answer: 'reviewed', durationMs: 4000, isAborted: false, reason: 'answer' })
  expect(await soloOf()).toBe('nijika')
  await clock.advance(8_100)
  expect(await soloOf()).toBeNull()
  // Bocchi's solo holds while the main loop plays, though an act seated with her ends.
  await $.turn.start({ text: 'build it', turnId: 't1' })
  await $.command.run(cmd('bocchi', 'solo bocchi'))
  await spawn('general-purpose', 'Implement the feature')
  await $.turn.complete({ turnId: 'a6', agentId: 'agent-6', answer: 'built', durationMs: 4000, isAborted: false, reason: 'answer' })
  await clock.advance(8_100)
  expect(await soloOf()).toBe('bocchi')
  await pane.unmount()
})

test('tool rows are tracks of the set: number, member tag, tool, target, then the length; the strip and the marquee are ON AIR while it plays', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.turn.start({ text: 'rework the strip for narrow panes', turnId: 't1' })
  await $.tool.call({ tool: 'Grep', pattern: 'drawStrip', tool_use_id: 'tu-grep' } as never)
  await $.tool.call({ tool: 'Read', file_path: '/proj/src/app.ts', tool_use_id: 'tu-read' } as never)
  await clock.advance(2000)
  for (const surface of SURFACES) {
    const done = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolUse', requestId: 'tu-read', props: { tool_use_id: 'tu-read', tool: 'Read', input: { file_path: '/proj/src/app.ts' }, isRunning: false, isErrored: false, isInterrupted: false } })
    expect(await done.find({ type: 'Text', text: /^ 02$/ })).toBeDefined()
    expect((await done.find({ type: 'Text', text: /^ Ryo $/ }))?.props).toMatchObject({ backgroundColor: MEMBERS.ryo.color })
    expect(await done.find({ type: 'Text', text: /^ Read$/ })).toBeDefined()
    expect(await done.find({ type: 'Text', text: /^ · src\/app\.ts$/ })).toBeDefined()
    // What the call took (it answered at once), not the time since it began, however late the row is drawn.
    expect(await done.find({ type: 'Text', text: /^0:00$/ })).toBeDefined()
    await done.unmount()
    const running = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolUse', requestId: 'tu-grep', props: { tool_use_id: 'tu-grep', tool: 'Grep', input: { pattern: 'drawStrip' }, isRunning: true, isErrored: false, isInterrupted: false } })
    expect(await running.find({ type: 'Text', text: /^ 01$/ })).toBeDefined()
    expect(await running.find({ type: 'Text', text: /^playing$/ })).toBeDefined()
    await running.unmount()
    const failed = await $.ui.mount({ plugin: PLUGIN, surface, component: 'ToolUse', requestId: 'tu-x', props: { tool_use_id: 'tu-x', tool: 'Bash', input: { command: 'npm run check' }, isRunning: false, isErrored: true, isInterrupted: false } })
    expect((await failed.find({ type: 'Text', text: /^wrong note$/ }))?.props).toMatchObject({ color: 'error' })
    expect(await failed.find({ type: 'Text', text: /^ 0\d$/ })).toBeUndefined()
    await failed.unmount()
    // While the set plays: ON AIR, and Bocchi with the set's task is what plays (no act on stage).
    if (surface === 'terminal') {
      const strip = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
      expect(await strip.find({ type: 'Text', text: /^ ● ON AIR $/ })).toBeDefined()
      expect(await strip.find({ type: 'Text', text: /^Bocchi$/ })).toBeDefined()
      expect(await strip.find({ type: 'Text', text: /^ · Read src\/app\.ts$/ })).toBeDefined()
      await strip.unmount()
      const panel = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
      expect(await panel.find({ type: 'Text', text: /^ ● ON AIR $/ })).toBeDefined()
      expect(await panel.find({ type: 'Text', text: /^ {2}set 1 · 0:02$/ })).toBeDefined()
      await panel.unmount()
    } else {
      const signPane = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
      expect((await sceneOf(signPane))['strip-sign']?.alt).toMatch(/^On air · now playing · Bocchi · Read src\/app\.ts · 0 on stage · /)
      await signPane.unmount()
      const housePane = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
      const scene = await sceneOf(housePane)
      await housePane.unmount()
      expect(scene['scene-head']?.alt).toMatch(/^Setlist · set 1 · on air · /)
      expect(scene['scene-foot']?.alt).toMatch(/^set 1 · 0:02 · /)
      expect(scene['song-main']?.alt).toMatch(/^Bocchi \(main loop\) · playing · rework the strip for narrow panes · /)
    }
  }
  // A subagent's own turn is no new set: the tracks count on, the set and its prompt stay the main loop's.
  await $.turn.start({ text: 'Sub prompt words.', turnId: 'a1', agentId: 'agent-x' } as never)
  await $.tool.call({ tool: 'Glob', pattern: '*.md', tool_use_id: 'tu-glob0' } as never)
  const third = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'ToolUse', requestId: 'tu-glob0', props: { tool_use_id: 'tu-glob0', tool: 'Glob', input: { pattern: '*.md' }, isRunning: false, isErrored: false, isInterrupted: false } })
  expect(await third.find({ type: 'Text', text: /^ 03$/ })).toBeDefined()
  await third.unmount()
  const stillSet1 = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const set1 = await sceneOf(stillSet1)
  await stillSet1.unmount()
  expect(set1['scene-head']?.alt).toMatch(/^Setlist · set 1 · on air · /)
  expect(set1['song-main']?.alt).toMatch(/ · rework the strip for narrow panes · /)
  // Between sets the set's length stands still.
  await $.turn.complete({ turnId: 't1', answer: 'done', durationMs: 2000, isAborted: false, reason: 'answer' })
  await clock.advance(30_000)
  const between = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(between))['scene-foot']?.alt).toMatch(/^set 1 · 0:02 · /)
  await between.unmount()
  // A new set numbers its tracks from one again.
  await $.turn.start({ text: 'again', turnId: 't2' })
  await $.tool.call({ tool: 'Glob', pattern: '*.ts', tool_use_id: 'tu-glob' } as never)
  const next = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'ToolUse', requestId: 'tu-glob', props: { tool_use_id: 'tu-glob', tool: 'Glob', input: { pattern: '*.ts' }, isRunning: false, isErrored: false, isInterrupted: false } })
  expect(await next.find({ type: 'Text', text: /^ 01$/ })).toBeDefined()
  await next.unmount()
  // Earlier sets' rows keep their numbers and their lengths.
  const earlier = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'ToolUse', requestId: 'tu-read', props: { tool_use_id: 'tu-read', tool: 'Read', input: { file_path: '/proj/src/app.ts' }, isRunning: false, isErrored: false, isInterrupted: false } })
  expect(await earlier.find({ type: 'Text', text: /^ 02$/ })).toBeDefined()
  expect(await earlier.find({ type: 'Text', text: /^0:00$/ })).toBeDefined()
  await earlier.unmount()
  // The main loop's song is this set's: its age counts from this set's start, not the session's.
  await clock.advance(1000)
  const set2 = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(set2))['song-main']?.alt).toMatch(/^Bocchi \(main loop\) · playing · again · 0:01 · /)
  await set2.unmount()
})

test('state an older version wrote survives a reload: the panel draws, an old act tallies its tools, the set counts from one', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  // What /reload-plugins hands the new module: $.state as v0.6.0 wrote it (no solo, no set, no tool tally).
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  const oldAct = { id: 'old-ryo', member: 'ryo', description: 'Search left over from before the reload', type: `${PLUGIN}:ryo`, status: 'running', task: 'warming up', startedAt: 990_000, endedAt: null, model: 'claude-sonnet-5-5', usage, context: 30_000, steps: 0, tools: 0, cost: 0.02, isError: false }
  const oldMain = { ...oldAct, id: 'main', member: 'bocchi', description: 'the main conversation', type: 'main', status: 'idle', task: '', startedAt: 0, context: 0, cost: 0 }
  const legacy: Record<string, unknown> = {
    ui: { isPanelOpen: true, isStripHidden: false, panelWhere: 'pane' },
    band: { agents: [oldMain, oldAct], mood: 'anxious', mainTask: '', contextPercent: 40, window: 200_000, sessionUsd: 28.4, rateLimitPercent: 0, isWorking: false, lastError: '' },
  }
  on('state.get', async ($, e, next) => {
    const r = await next(e)
    const key = (e as unknown as { key: string }).key
    const stored = (r as { value?: { value: unknown; version: number } }).value
    return (stored !== undefined && stored.version === 0 && key in legacy ? { value: { value: legacy[key], version: 0 } } : r) as never
  })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect(await pane.find({ type: 'Text', text: /KESSOKU BAND/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /^♪ Search left over from before the reload$/ })).toBeDefined()
  expect(await pane.find({ type: 'Box', key: 'chan-ryo' })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /^ SOLO $/ })).toBeUndefined()
  expect(await pane.find({ type: 'Text', text: /no set yet/ })).toBeDefined()
  await pane.unmount()
  const deskPane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const desk = await sceneOf(deskPane)
  await deskPane.unmount()
  expect(desk['scene-stage']?.alt).not.toMatch(/on solo/)
  expect(desk['song-old-ryo']?.alt).toMatch(/^Ryo · playing · Search left over from before the reload · /)
  expect(desk['scene-head']?.alt).toMatch(/^Setlist · set 0 · /)
  // The old act's next call starts its tally; its solo reads it.
  await $.tool.call({ tool: 'Grep', pattern: 'drawStrip', agentId: 'old-ryo' } as never)
  await $.command.run(cmd('bocchi', 'solo ryo'))
  const solo = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect(await solo.find({ type: 'Text', text: /^Grep ×1 · now: Grep "drawStrip"$/ })).toBeDefined()
  await solo.unmount()
  const pagePane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const page = await sceneOf(pagePane)
  await pagePane.unmount()
  expect(page['song-old-ryo']?.alt).toMatch(/ · now Grep "drawStrip"$/)
  // The first set after the reload is set 1, not NaN.
  await $.turn.start({ text: 'go', turnId: 't1' })
  const panel = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await sceneOf(panel))['scene-foot']?.alt).toMatch(/^set 1 · /)
  await panel.unmount()
})

test('panelView: who plays, what each act does, its context, cost, tools and failure, read off the state for every drawing', async () => {
  const now = 10_000_000
  const usage = { input: 1000, output: 2000, cacheRead: 30_000, cacheWrite: 0 }
  const act = (id: string, member: KessokuMember, description: string, status: KessokuAgent['status'], startedAgo: number, endedAgo: number | null, extra: Partial<KessokuAgent> = {}): KessokuAgent => ({
    id, member, description, type: `${PLUGIN}:${member}`, status, task: '', startedAt: now - startedAgo, endedAt: endedAgo === null ? null : now - endedAgo, model: 'claude-sonnet-5-5', usage, context: 40_000, steps: 1, tools: 1, cost: 0.08, isError: false, toolTally: {}, lastTool: '', ...extra,
  })
  const band: KessokuBand = {
    agents: [
      act('main', 'bocchi', 'the main conversation', 'running', 62_000, null, { type: 'main', cost: 0.31, toolTally: { Read: 2, Edit: 5 }, lastTool: 'Edit hooks/register.tsx' }),
      act('r1', 'ryo', 'Find every call site of legacyQuery()', 'running', 48_000, null, { toolTally: { Grep: 4, Read: 3, Bash: 1 }, lastTool: 'Grep "legacyQuery"' }),
      act('r0', 'ryo', 'Explore: where cells are encoded', 'completed', 300_000, 140_000),
      act('k1', 'kita', 'Update README for the new CLI flags', 'completed', 95_000, 4_000, { cost: 0.04 }),
      act('k0', 'kita', 'Polish the settings page styles', 'failed', 160_000, 70_000, { isError: true, task: 'stopped: error' }),
    ],
    mood: 'focused', mainTask: 'Edit hooks/register.tsx', contextPercent: 42, window: 200_000, sessionUsd: 0.6, rateLimitPercent: 18, isWorking: true, lastError: 'Edit (Kita): old_string not found', set: 3, setStartedAt: now - 62_000, setPrompt: 'rework the strip',
  }
  const cache = { lastWarmAt: now - 60_000, contextTokens: 80_000, model: 'claude-sonnet-5-5', keepWarmUntil: 0, isArmed: false, heldAt: 0, heldText: '', heldUsd: 0, warmUsd: 0, pings: 0, pingUsd: 0, misses: 0, lastPingNote: '', engineWriteUsd: 0, engineModel: '' }
  const ui = { isPanelOpen: true, isStripHidden: false, panelWhere: 'pane' as const, solo: null, soloAct: null, soloUntil: 0, soloChosen: false }
  const v = panelView(band, cache, ui, now, 60 * 60_000)
  expect(v.members.map(m => m.member)).toEqual(['bocchi', 'nijika', 'ryo', 'kita'])
  expect(v).toMatchObject({ onAir: true, set: 3, setLength: '1:02', ctxPercent: 42, planPercent: 18, session: '$0.60', liveCount: 1, solo: null })
  expect(v.amp).toEqual({ kind: 'warm', words: 'warm 59:00' })
  expect(v.nowPlaying).toEqual({ who: 'ryo', words: 'Find every call site of legacyQuery() · 0:48' })
  const [bocchi, nijika, ryo, kita] = v.members as [MemberView, MemberView, MemberView, MemberView]
  // Bocchi's first act is the main loop: the set's task, the session's context, its own tools.
  expect(bocchi.acts[0]).toMatchObject({ id: 'main', title: 'rework the strip', ctxPercent: 42, isLive: true, tool: 'Edit hooks/register.tsx' })
  expect(bocchi.acts[0]?.tools).toEqual([{ name: 'Edit', count: 5 }, { name: 'Read', count: 2 }])
  expect(bocchi).toMatchObject({ isPlaying: true, isLit: true, isDim: false, hotkey: 'b', ctxPercent: 42 })
  // Nijika rests: no acts, her spotlight down, no context.
  expect(nijika).toMatchObject({ isPlaying: false, isLit: false, acts: [], liveCount: 0, ctxPercent: -1, line: MEMBERS.nijika.lines.anxious })
  // Ryo: the live act first, its context of the window, its tools most first, the tool in its hands.
  expect(ryo.acts.map(a => a.id)).toEqual(['r1', 'r0'])
  expect(ryo.acts[0]).toMatchObject({ state: 'playing', ctxPercent: 20, cost: '$0.08', at: '0:14', tool: 'Grep "legacyQuery"', slime: 'active' })
  expect(ryo.acts[0]?.tools.map(t => t.name)).toEqual(['Grep', 'Read', 'Bash'])
  expect(ryo.acts[1]).toMatchObject({ state: 'done', isEncore: false, at: '2:20 ago', slime: 'asleep' })
  expect(ryo).toMatchObject({ isPlaying: true, liveCount: 1, ctxPercent: 20, line: '1 playing' })
  expect(ryo.pit.map(a => a.id)).toEqual(['r1'])
  // Kita: the README just ended (its encore, in her pit); the failed one says why.
  expect(kita.acts.find(a => a.id === 'k1')).toMatchObject({ state: 'done', isEncore: true, age: '1:31' })
  expect(kita.acts.find(a => a.id === 'k0')).toMatchObject({ state: 'failed', isFailed: true, reason: 'stopped: error', isEncore: false })
  expect(kita.pit.map(a => a.id)).toEqual(['k1'])
  expect(kita).toMatchObject({ mood: 'happy', line: 'set done', spend: '$0.12' })
  // A member whose act was just stopped waits out her encore in her box; after it she rests.
  const stoppedAct = (endedAgo: number) => panelView({ ...band, agents: [...band.agents, act('n1', 'nijika', 'Plan the auth refactor', 'killed', 30_000, endedAgo)] }, cache, ui, now, 60 * 60_000).members[1]?.mood
  expect(stoppedAct(2_000)).toBe('hiding')
  expect(stoppedAct(9_000)).toBe('anxious')
  // Shares of the session's spend.
  expect(Math.round(ryo.share * 100)).toBe(27)
  // Ryo on solo: only her spotlight, the others faded; the pressed act first.
  const solo = panelView(band, cache, { ...ui, solo: 'ryo', soloAct: 'r0' }, now, 60 * 60_000)
  expect(solo.members.map(m => [m.member, m.isLit, m.isDim, m.isSolo])).toEqual([['bocchi', false, true, false], ['nijika', false, true, false], ['ryo', true, false, true], ['kita', false, true, false]])
  expect(solo.members[2]?.acts.map(a => a.id)).toEqual(['r0', 'r1'])
  // A solo past its due is the mix; the cache cold, kept warm, or never warmed.
  expect(panelView(band, cache, { ...ui, solo: 'ryo', soloUntil: now - 1 }, now, 60 * 60_000).solo).toBeNull()
  expect(panelView(band, { ...cache, lastWarmAt: now - 70 * 60_000 }, ui, now, 60 * 60_000).amp).toEqual({ kind: 'cold', words: 'cold 10:00' })
  expect(panelView(band, { ...cache, keepWarmUntil: now + 7_200_000 }, ui, now, 60 * 60_000).amp.kind).toBe('keepwarm')
  expect(panelView(band, { ...cache, lastWarmAt: 0 }, ui, now, 60 * 60_000).amp).toEqual({ kind: 'none', words: 'no cache yet' })
  // State an older version wrote (no set, no solo, no tally) reads whole.
  const legacyBand = { ...band, set: undefined, setStartedAt: undefined, agents: band.agents.map(a => ({ ...a, toolTally: undefined, lastTool: undefined })) } as unknown as KessokuBand
  const legacy = panelView(legacyBand, cache, { isPanelOpen: true, isStripHidden: false, panelWhere: 'pane' } as unknown as KessokuUi, now, 60 * 60_000)
  expect(legacy).toMatchObject({ set: 0, setLength: '', solo: null })
  expect(legacy.members[2]?.acts[0]).toMatchObject({ tools: [], tool: '' })
})

test("the stage's source stays the same while only clocks, costs and tools change; a mood, a slime or a solo changes it", async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  stepBottom(on)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const stageNow = async () => (await sceneOf(pane))['scene-stage']?.source
  const before = await stageNow()
  const songBefore = (await sceneOf(pane))['song-demo-ryo']?.source
  // A second on, Ryo's act calls a tool and takes a model step (its cost, tokens and context move): the songs change,
  // the stage does not, so its frame never reloads and its animations never restart.
  await clock.advance(1500)
  await $.tool.call({ tool: 'Read', file_path: '/proj/src/app.ts', agentId: 'demo-ryo' } as never)
  const step = $.turn.step({ turnId: 'r1', index: 0, model: 'claude-sonnet-5-5', messageCount: 1, agentId: 'demo-ryo' })
  for await (const chunk of step) void chunk
  expect((await sceneOf(pane))['song-demo-ryo']?.source).not.toBe(songBefore)
  expect(await stageNow()).toBe(before)
  // Kita's encore ends (her face goes back to waiting): the stage is drawn anew.
  await clock.advance(5000)
  const afterEncore = await stageNow()
  expect(afterEncore).not.toBe(before)
  // Ryo on solo: drawn anew again.
  await pane.press({ key: 'solo-ryo' })
  await clock.settle()
  expect(await stageNow()).not.toBe(afterEncore)
  await pane.unmount()
})

test('a slime that ended leaves the stage by itself half a minute later, though nothing else happens', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  // Kita's README ended four seconds ago: asleep in her pit. Nothing changes the state from here on.
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const at10 = async () => (await sceneOf(pane))['scene-stage']?.source
  await clock.advance(6000)
  const withSlime = await at10()
  await clock.advance(21_000)
  expect(await at10()).not.toBe(withSlime)
  await pane.unmount()
})
