// Kessoku Ultimate Bocchi Theme: tests, run with `claude plugin test <mod folder>`.
//
// The test's `on` sits beneath the mod: it answers every `$` call the mod
// makes (the engine would) and reads what the mod asked for. The pure parts
// are tested directly.

import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { KessokuMood } from '../types'
import { memberFor, memberForTool, parseDuration, fmtTokens, fmtUsd, priceInfo, cacheWriteUsd, describeCall } from '../hooks/lib/band'
import { classify, classifyPowerShell, isGitCommit } from '../hooks/lib/blast'
import { cutHunks, patchToUnified, unifiedDiff } from '../hooks/lib/diff'
import { FACE_WIDTH, MEMBERS, SPINNER_WORDS_BY_MODE, THEME_OVERRIDES, TURN_WORDS, padFace, textWidth } from '../hooks/lib/palette'
import { appendRule, cleanRule, looksLikeCorrection } from '../hooks/lib/reflect'
import { CRASH, CRASH_MINI, SVG_LIMIT, animOf, base64, cellsFor, colorOf, composite, decodeCodes, decodeFrames, drawSvg, encodeCells, frameAt, framePixels, layerFrames, mergeTimeline, pixelsOf, spriteId, spritesSvg, viewSize } from '../hooks/lib/sprite'
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
type Seen = { commands: string[]; status: (string | undefined)[]; toasts: string[]; opened: string[]; closed: string[]; filled: string[]; written: Record<string, string>; sleeps: number; sleepers: string[]; forks: number; configSets: { key: string; value: unknown }[]; theme: string; asks: string[]; askAnswer: string; rendered: Record<string, unknown>; blits: { requestId: string; key: string; isTaken: boolean }[] }
/** What a test may vary in the engine beneath: one bottom per event, so the knobs live here. */
type Answers = { sleepMs?: number; forkCacheRead?: number; gitLsFails?: boolean; os?: string; refuseBlits?: boolean; unplaced?: boolean }
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
  on('fs.read', ($, e) => ({ value: seen.written[key(e.path)] ?? '' }))
  on('fs.write', ($, e) => {
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
  on('model.complete', () => ({
    value: { isAnswered: true as const, text: 'Always use pnpm instead of npm in this repository.', usage: { input_tokens: 100, output_tokens: 12, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
  }))
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
}

function fresh(): Seen {
  return { commands: [], status: [], toasts: [], opened: [], closed: [], filled: [], written: {}, sleeps: 0, sleepers: [], forks: 0, configSets: [], theme: 'dark', asks: [], askAnswer: 'Not now', rendered: {}, blits: [] }
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
  for (const surface of SURFACES) {
    const strip = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
    expect(await strip.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
    expect(await strip.find({ type: 'Text', text: /Nijika/ })).toBeDefined()
    await strip.unmount()
    const panel = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    expect(await panel.find({ type: 'Text', text: /KESSOKU BAND/ })).toBeDefined()
    expect(await panel.find({ type: 'Text', text: /legacyQuery/ })).toBeDefined()
    expect(await panel.find({ type: 'Text', text: /README/ })).toBeDefined()
    expect(await panel.find({ type: 'Text', text: /plan .*42%/ })).toBeDefined()
    await panel.unmount()
  }
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
  expect(await panel.find({ type: 'Text', text: /43\.0k/ })).toBeDefined()
  await panel.unmount()
  await $.turn.complete({ turnId: 'a1', agentId: 'agent-1', answer: 'found 3', durationMs: 4000, isAborted: false, reason: 'answer' })
  expect(seen.toasts.some(t => /Ryo finished/.test(t))).toBe(true)
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
    expect(await panel.find({ type: 'Text', text: /KESSOKU BAND/ })).toBeDefined()
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
  expect(Object.keys(SPRITES)).toHaveLength(SPRITE_MEMBERS.length * SPRITE_MOODS.length * 3 + 2)
  for (const [id, anim] of Object.entries(SPRITES)) {
    expect(id).toMatch(/^(bocchi|nijika|ryo|kita)-(anxious|focused|happy|panic|melting|hiding)(-portrait|-mini)?$|^fx-crash(-mini)?$/)
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
  // The moods on stage, read off the desktop's drawing of the same moment.
  const desk = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  const bocchiSvg = (await desk.find({ type: 'Svg' }))?.props
  await desk.unmount()
  const bocchiMood = moodsIn(String(bocchiSvg?.alt)).bocchi as KessokuMood
  expect(bocchiMood).toBeDefined()
  // A tall pane: four cards, each with her hand-drawn mini in half blocks (16 x 8 cells, every color kept).
  const tall = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: { ...PANE_PROPS, scroll: { offset: 0, bodyRows: 50 } } })
  const tallBocchi = (await tall.find({ type: 'Raster', key: 'sprite-bocchi' }))?.props
  expect(tallBocchi).toMatchObject({ columns: 16, rows: 8 })
  const bocchiMini = spriteId('bocchi', bocchiMood, 'mini')
  expect(tallBocchi?.cells).toBe(encodeCells(composite([{ id: bocchiMini, x: 0, y: 0 }], 16, 16, now), 16, 16, 'half', '#26262c').cells)
  expect(await tall.find({ type: 'Raster', key: 'sprite-ryo' })).toBeDefined()
  // No kaomoji where the sprite stands in for her face.
  expect(await tall.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeUndefined()
  // The sprite clock walks the frames: repaints reach the pane in place, no redraw.
  await clock.advance(3000)
  expect(seen.blits.some(x => x.requestId === 'kessoku-band' && x.key.startsWith('sprite-') && x.isTaken)).toBe(true)
  await tall.unmount()
  // A shorter one: the minis in quadrants (8 x 4), so the four cards fit.
  const short = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await short.find({ type: 'Raster', key: 'sprite-kita' }))?.props).toMatchObject({ columns: 8, rows: 4 })
  expect(await short.find({ type: 'Text', text: /legacyQuery/ })).toBeDefined()
  await short.unmount()
  // The strip: the four minis in one picture where the band has the rows (35 x 4), the one-line strip where it does not.
  const t2 = 1_003_000
  const deskStrip = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'AbovePrompt', props: BAND_PROPS })
  const stripSvg = (await deskStrip.find({ type: 'Svg' }))?.props
  await deskStrip.unmount()
  // On a remote surface: the four portraits side by side, 34 apart, one CSS pixel a pixel.
  expect(stripSvg).toMatchObject({ width: 134, height: 32, isInteractive: true })
  const moods = moodsIn(String(stripSvg?.alt))
  expect(Object.keys(moods)).toHaveLength(4)
  const strip = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  const stripRaster = (await strip.find({ type: 'Raster', key: 'strip-sprites' }))?.props
  expect(stripRaster).toMatchObject({ columns: 35, rows: 4 })
  const minis = SPRITE_MEMBERS.map((m, i) => ({ id: spriteId(m, moods[m] as KessokuMood, 'mini'), x: i * 18, y: 0 }))
  expect(stripRaster?.cells).toBe(encodeCells(composite(minis, 70, 16, t2), 70, 16, 'quad', '#1b1b1f').cells)
  expect(await strip.find({ type: 'Text', text: /Nijika/ })).toBeDefined()
  expect(await strip.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  await strip.unmount()
  const low = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, maxRows: 4, scroll: { offset: 0, bodyRows: 3 } } })
  expect(await low.find({ type: 'Raster' })).toBeUndefined()
  expect(await low.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  await low.unmount()
  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    // The panel's whole figure, 96 x 96 at one CSS pixel a pixel.
    const pane = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    const svg = await pane.find({ type: 'Svg' })
    expect(svg).toBeDefined()
    expect(svg?.props).toMatchObject({ isInteractive: true, width: 96, height: 96 })
    expect(String(svg?.props.source)).toContain('<animate')
    expect(String(svg?.props.source).length).toBeLessThanOrEqual(SVG_LIMIT)
    expect(String(svg?.props.alt)).toMatch(/Bocchi/)
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
  // No room for a pane: the panel is drawn above the prompt, its cards with the minis (8 x 4) in a terminal and the
  // portraits (32 CSS pixels) on a remote surface.
  expect((await $.command.run(cmd('kessoku'))).text).toMatch(/above the prompt/)
  const band = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await band.find({ type: 'Raster', key: 'sprite-bocchi' }))?.props).toMatchObject({ columns: 8, rows: 4 })
  await band.unmount()
  for (const surface of ['desktop', 'mobile'] as const) {
    const remote = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
    expect((await remote.find({ type: 'Svg' }))?.props).toMatchObject({ width: 32, height: 32 })
    await remote.unmount()
  }
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

test('characterArt kaomoji keeps the text faces and draws no pictures', { options: { characterArt: 'kaomoji', applyTheme: false } }, async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  for (const surface of SURFACES) {
    const panel = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    expect(await panel.find({ type: 'Raster' })).toBeUndefined()
    expect(await panel.find({ type: 'Svg' })).toBeUndefined()
    expect(await panel.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeDefined()
    await panel.unmount()
    const strip = await $.ui.mount({ plugin: PLUGIN, surface, component: 'AbovePrompt', props: BAND_PROPS })
    expect(await strip.find({ type: 'Raster' })).toBeUndefined()
    expect(await strip.find({ type: 'Svg' })).toBeUndefined()
    expect(await strip.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeDefined()
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
