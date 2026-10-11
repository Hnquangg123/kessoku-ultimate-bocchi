// Kessoku Ultimate Bocchi Theme: tests, run with `claude plugin test <mod folder>`.
//
// The test's `on` sits beneath the mod: it answers every `$` call the mod
// makes (the engine would) and reads what the mod asked for. The pure parts
// are tested directly.

import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { memberFor, memberForTool, parseDuration, fmtTokens, fmtUsd, priceInfo, cacheWriteUsd, describeCall } from '../hooks/lib/band'
import { classify, classifyPowerShell, isGitCommit } from '../hooks/lib/blast'
import { cutHunks, patchToUnified, unifiedDiff } from '../hooks/lib/diff'
import { FACE_WIDTH, MEMBERS, SPINNER_WORDS_BY_MODE, THEME_OVERRIDES, TURN_WORDS, padFace, textWidth } from '../hooks/lib/palette'
import { appendRule, cleanRule, looksLikeCorrection } from '../hooks/lib/reflect'
import { CRASH, SVG_LIMIT, animOf, base64, cellsFor, decodeRle, encodeCells, frameAt, spriteId, spritesSvg } from '../hooks/lib/sprite'
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

/** A Raster's cells as their u32 words. */
function words(cells: string): DataView {
  return new DataView(Uint8Array.from(atob(cells), c => c.charCodeAt(0)).buffer)
}

test('sprites: every member has every mood, whole and as a portrait, and the crash is there', async () => {
  for (const member of SPRITE_MEMBERS) {
    for (const mood of SPRITE_MOODS) {
      const full = animOf(spriteId(member, mood, 'full'))
      const portrait = animOf(spriteId(member, mood, 'portrait'))
      expect(full).toBeDefined()
      expect(portrait).toBeDefined()
      expect(full?.w).toBe(32)
      expect(full?.h).toBe(32)
      expect(portrait?.w).toBe(16)
      expect(portrait?.h).toBe(16)
    }
  }
  expect(animOf(CRASH)?.w).toBe(48)
  // Every frame decodes to its full size from known colors, and holds a whole number of 100 ms beats.
  for (const [id, anim] of Object.entries(SPRITES)) {
    expect(anim.frames.length).toBeGreaterThan(0)
    for (const [ms, rle] of anim.frames) {
      expect(ms % 100).toBe(0)
      for (const ch of rle.replace(/[0-9]/g, '')) expect(ch === '.' || ch in SPRITE_COLORS).toBe(true)
      expect(decodeRle(rle, anim.w * anim.h)).toHaveLength(anim.w * anim.h)
    }
    expect(id).toMatch(/^(bocchi|nijika|ryo|kita)-(anxious|focused|happy|panic|melting|hiding)(-portrait)?$|^fx-crash$/)
  }
})

test('sprites: run lengths, the loop clock, cells and base64', async () => {
  const [a, b] = Object.keys(SPRITE_COLORS) as [string, string]
  const ca = SPRITE_COLORS[a] as string
  const cb = SPRITE_COLORS[b] as string
  expect(decodeRle(`${a}3${b}.2`, 6)).toEqual([ca, ca, ca, cb, null, null])
  expect(decodeRle(`${a}`, 3)).toEqual([ca, null, null])
  const anim = { w: 1, h: 1, frames: [[100, a], [300, b]] as const }
  expect(frameAt(anim, 0)).toBe(0)
  expect(frameAt(anim, 99)).toBe(0)
  expect(frameAt(anim, 100)).toBe(1)
  expect(frameAt(anim, 399)).toBe(1)
  expect(frameAt(anim, 400)).toBe(0)
  expect(frameAt(anim, 1_000_250)).toBe(1)
  expect(cellsFor(32, 32, 'half')).toEqual({ columns: 32, rows: 16 })
  expect(cellsFor(16, 16, 'quad')).toEqual({ columns: 8, rows: 4 })
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
  // A whole portrait in quadrants: 8 x 4 cells, 12 bytes each.
  const portrait = animOf(spriteId('bocchi', 'anxious', 'portrait'))
  expect(portrait).toBeDefined()
  if (portrait !== undefined) {
    const q = encodeCells(decodeRle((portrait.frames[0] as readonly [number, string])[1], 256), 16, 16, 'quad')
    expect(atob(q.cells).length).toBe(8 * 4 * 12)
  }
})

test('sprites: every animation fits the Svg element and animates where it has frames to show', async () => {
  for (const [id, anim] of Object.entries(SPRITES)) {
    const svg = spritesSvg([{ id, x: 0, y: 0 }], anim.w, anim.h, 2)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.length).toBeLessThan(SVG_LIMIT)
    expect(svg.includes('<animate')).toBe(new Set(anim.frames.map(f => f[1])).size > 1)
    expect(svg).not.toMatch(/<script|\son[a-z]+=/i)
  }
  // The heaviest drawings: the strip's four heads, the guard screen's figure and crash.
  const strip = spritesSvg(SPRITE_MEMBERS.map((m, i) => ({ id: spriteId(m, 'anxious', 'portrait'), x: i * 18, y: 0 })), 70, 16, 2)
  expect(strip.length).toBeLessThan(SVG_LIMIT)
  const blastSvg = spritesSvg([{ id: spriteId('bocchi', 'panic', 'full'), x: 0, y: 0 }, { id: CRASH, x: 34, y: 16 }], 82, 32, 3)
  expect(blastSvg.length).toBeLessThan(SVG_LIMIT)
})

test('the band is drawn as sprites: a Raster on the terminal, repainted by blit; an animated Svg on the desktop', async ($, on) => {
  const seen = fresh()
  const clock = mock.clock(on, { now: 1_000_000 })
  bottoms(on, clock, seen)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run(cmd('bocchi', 'demo'))
  // A tall pane: four cards with half-block portraits (16 x 8 cells).
  const tall = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: { ...PANE_PROPS, scroll: { offset: 0, bodyRows: 50 } } })
  expect((await tall.find({ type: 'Raster', key: 'sprite-bocchi' }))?.props).toMatchObject({ columns: 16, rows: 8 })
  expect(await tall.find({ type: 'Raster', key: 'sprite-ryo' })).toBeDefined()
  // No kaomoji where the sprite stands in for her face.
  expect(await tall.find({ type: 'Text', text: BOCCHI_ANXIOUS })).toBeUndefined()
  // The sprite clock walks the frames: repaints reach the pane in place, no redraw.
  await clock.advance(3000)
  expect(seen.blits.some(x => x.requestId === 'kessoku-band' && x.key.startsWith('sprite-') && x.isTaken)).toBe(true)
  await tall.unmount()
  // A shorter one: quadrant portraits (8 x 4), so the four cards fit.
  const short = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
  expect((await short.find({ type: 'Raster', key: 'sprite-kita' }))?.props).toMatchObject({ columns: 8, rows: 4 })
  expect(await short.find({ type: 'Text', text: /legacyQuery/ })).toBeDefined()
  await short.unmount()
  // The strip: the four heads in one picture where the band has the rows, the one-line strip where it does not.
  const strip = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await strip.find({ type: 'Raster', key: 'strip-sprites' }))?.props).toMatchObject({ columns: 35, rows: 4 })
  expect(await strip.find({ type: 'Text', text: /Nijika/ })).toBeDefined()
  expect(await strip.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  await strip.unmount()
  const low = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: { ...BAND_PROPS, maxRows: 4, scroll: { offset: 0, bodyRows: 3 } } })
  expect(await low.find({ type: 'Raster' })).toBeUndefined()
  expect(await low.find({ type: 'Button', key: 'strip-panel' })).toBeDefined()
  await low.unmount()
  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    const pane = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'kessoku-band', props: PANE_PROPS })
    const svg = await pane.find({ type: 'Svg' })
    expect(svg).toBeDefined()
    expect(svg?.props).toMatchObject({ isInteractive: true, width: 64, height: 64 })
    expect(String(svg?.props.source)).toContain('<animate')
    expect(String(svg?.props.alt)).toMatch(/Bocchi/)
    await pane.unmount()
  }
  // Nijika's memo carries her portrait above the prompt.
  await $.command.run(cmd('bocchi', 'memo'))
  const memoBand = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await memoBand.find({ type: 'Raster', key: 'memo-sprite' }))?.props).toMatchObject({ columns: 8, rows: 4 })
  await memoBand.press({ key: 'memo-skip' })
  await memoBand.unmount()
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
  // 70 columns (what the pane asks for): her head and the crash, half blocks.
  expect((await pictureAt(at(70))).raster).toMatchObject({ columns: 66, rows: 8 })
  // 66: the frame leaves 62, too few for both: the crash alone.
  expect((await pictureAt(at(66))).raster).toMatchObject({ columns: 48, rows: 8 })
  // 50: quadrants, her head and the crash in 33 columns, 4 rows.
  expect((await pictureAt(at(50))).raster).toMatchObject({ columns: 33, rows: 4 })
  // Short on rows (a band): quadrants however wide.
  expect((await pictureAt(at(70, 26))).raster).toMatchObject({ rows: 4 })
  // Too narrow for any picture: the old ASCII line, and the command still shows.
  const narrow = await pictureAt(at(24))
  expect(narrow.raster).toBeUndefined()
  expect(narrow.ascii).toBe(true)
  expect(narrow.command).toBe(true)
  const blastD = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'kessoku-blast-radius', props: PANE_PROPS })
  expect(String((await blastD.find({ type: 'Svg' }))?.props.alt)).toMatch(/guitar/)
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
