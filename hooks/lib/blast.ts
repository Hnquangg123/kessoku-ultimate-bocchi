// Kessoku Ultimate Bocchi Theme: what counts as dropping the guitar.
//
// The risk classifier, adapted from Anthropic's Blast Radius sample mod
// (claude-code-playground, Apache-2.0) and extended: quote-aware splitting
// (heredocs, comments, quoted ';'), wrappers (sh -c, eval, xargs, timeout,
// cmd /c, find -delete, rimraf), PowerShell spellings (script blocks, pipelines,
// line continuations), and the dry-run forms that are not risky. Pure: no `$`,
// no `on`. Measuring lives in the hooks module.

export type Risk =
  | { kind: 'rm'; label: string; targets: string[]; dir: string | null; note?: string }
  | { kind: 'git-reset' | 'git-clean' | 'git-push-force' | 'git-checkout'; label: string; args: string[]; dir: string | null }
  | { kind: 'migrate'; label: string; tool: string; dir: string | null }
  | { kind: 'other'; label: string; note: string; dir: string | null }

type Segment = Risk | { cd: string }

/** One command of a shell line: its text, and the heredoc body fed to it, if any. */
export type ShellSegment = { text: string; heredoc: string | null }

// sudo options that take a value, so the value isn't read as the command.
const SUDO_VALUE_OPTIONS = new Set(['-u', '-g', '-C', '-D', '-h', '-p', '-r', '-t', '-T', '-U'])
// Commands that only read or edit text, so a bare word "migrate" or "DROP TABLE" in them changes nothing.
const READ_ONLY = new Set(['ls', 'cat', 'echo', 'printf', 'grep', 'rg', 'ag', 'ack', 'find', 'less', 'head', 'tail', 'cd', 'git', 'vim', 'nvim', 'vi', 'nano', 'code', 'emacs', 'man', 'which', 'type', 'file', 'stat', 'wc', 'diff', 'bat', 'more', 'sed', 'awk', 'tee', 'sort', 'uniq', 'cut', 'tr', 'jq', 'yq', 'curl', 'wget', 'open', 'xdg-open'])
// PowerShell cmdlets and aliases that only read.
const READ_ONLY_PS = new Set(['get-childitem', 'gci', 'ls', 'dir', 'get-content', 'gc', 'cat', 'type', 'select-string', 'sls', 'write-host', 'write-output', 'echo', 'test-path', 'get-item', 'gi', 'measure-object', 'where-object', 'where', '?', 'foreach-object', 'foreach', '%', 'select-object', 'select', 'sort-object', 'sort', 'get-command', 'gcm', 'get-help', 'help', 'out-file', 'set-content', 'sc', 'add-content', 'ac', 'write-warning', 'write-error', 'format-table', 'ft', 'format-list', 'fl', 'out-string', 'code', 'notepad'])
// Words that can come before the real command without changing what it does.
const PREFIXES = new Set(['command', 'exec', 'env', 'nohup', 'time', 'then', 'do', 'else', '!', 'doas', 'busybox', 'stdbuf', 'caffeinate', 'unbuffer', 'if', 'elif', 'while', 'until'])
// Prefix words that take a value before the real command (timeout 10 cmd, nice -n 5 cmd).
const PREFIX_WITH_VALUE = new Set(['timeout', 'ionice', 'chrt', 'taskset', 'nice'])
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish'])
const RM_LIKE = new Set(['rimraf', 'del-cli', 'trash', 'trash-put', 'shred', 'unlink'])
const RUNNERS = new Set(['npx', 'bunx'])
const DLX = new Set(['pnpm', 'yarn'])

/** A folder a later `cd arg` moves to, given the folder so far (null = the session folder). */
function joinDir(dir: string | null, arg: string | undefined): string {
  if (arg === undefined || arg === '~' || arg.startsWith('/') || arg.startsWith('~/') || /^[A-Za-z]:[\\/]/.test(arg)) {
    return arg ?? '~'
  }
  return dir ? `${dir}/${arg}` : arg
}

/**
 * Splits a shell command line at unquoted `;`, `|`, `||`, `&&`, `&` and
 * newlines. Quoted text, `$(...)`, backticks and `#` comments never split;
 * a heredoc's body is lifted out of the stream and attached to the segment
 * that opened it, wherever that segment ended on its line.
 */
export function splitSegments(command: string): ShellSegment[] {
  const out: ShellSegment[] = []
  const n = command.length
  let cur = ''
  let i = 0
  let quote: "'" | '"' | '`' | null = null
  let depth = 0 // inside $( ... )
  const pending: { tag: string; strip: boolean; owner: number }[] = []
  let heredoc: string | null = null
  const push = (): void => {
    if (cur.trim() !== '') out.push({ text: cur, heredoc })
    cur = ''
    heredoc = null
  }
  while (i < n) {
    const ch = command[i] as string
    if (quote === "'") {
      cur += ch
      if (ch === "'") quote = null
      i += 1
      continue
    }
    if (quote === '"' || quote === '`') {
      cur += ch
      if (ch === '\\' && i + 1 < n) {
        cur += command[i + 1]
        i += 2
        continue
      }
      if (ch === quote) quote = null
      i += 1
      continue
    }
    if (ch === '\\' && i + 1 < n) {
      cur += ch + command[i + 1]
      i += 2
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch
      cur += ch
      i += 1
      continue
    }
    if (ch === '$' && command[i + 1] === '(') {
      depth += 1
      cur += '$('
      i += 2
      continue
    }
    if (depth > 0) {
      if (ch === '(') depth += 1
      else if (ch === ')') depth -= 1
      cur += ch
      i += 1
      continue
    }
    if (ch === '#' && (i === 0 || /\s/.test(command[i - 1] as string))) {
      while (i < n && command[i] !== '\n') i += 1
      continue
    }
    if (ch === '<' && command[i + 1] === '<' && command[i + 2] !== '<') {
      let j = i + 2
      let strip = false
      if (command[j] === '-') {
        strip = true
        j += 1
      }
      while (command[j] === ' ' || command[j] === '\t') j += 1
      let tag = ''
      const q = command[j]
      if (q === "'" || q === '"') {
        j += 1
        while (j < n && command[j] !== q) tag += command[j++]
        j += 1
      } else {
        if (command[j] === '\\') j += 1 // <<\EOF: a literal heredoc
        while (j < n && /[A-Za-z0-9_]/.test(command[j] as string)) tag += command[j++]
      }
      if (tag !== '') {
        pending.push({ tag, strip, owner: out.length })
        cur += command.slice(i, j)
        i = j
        continue
      }
    }
    if (ch === '\n') {
      i += 1
      while (pending.length > 0) {
        const { tag, strip, owner } = pending.shift() as { tag: string; strip: boolean; owner: number }
        const body: string[] = []
        while (i < n) {
          let end = command.indexOf('\n', i)
          if (end < 0) end = n
          const line = command.slice(i, end)
          i = end + 1
          if ((strip ? line.replace(/^\t+/, '') : line) === tag) break
          body.push(line)
        }
        if (body.length === 0) continue
        const text = body.join('\n')
        const seg = out[owner]
        if (seg !== undefined) seg.heredoc = seg.heredoc === null ? text : `${seg.heredoc}\n${text}`
        else heredoc = heredoc === null ? text : `${heredoc}\n${text}`
      }
      push()
      continue
    }
    if (ch === ';') {
      push()
      i += 1
      continue
    }
    if (ch === '|') {
      push()
      i += command[i + 1] === '|' ? 2 : 1
      continue
    }
    if (ch === '&') {
      if (command[i + 1] === '&') {
        push()
        i += 2
        continue
      }
      if (command[i + 1] === '>' || (i > 0 && /[0-9>]/.test(command[i - 1] as string))) {
        cur += ch // `&>` and `2>&1` are redirects, not separators
        i += 1
        continue
      }
      push()
      i += 1
      continue
    }
    cur += ch
    i += 1
  }
  push()
  return out
}

const PART = /\$'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|'([^']*)'|((?:[^\s"'\\]|\\.)+)/g
// A whole shell word: adjacent quoted and bare runs with no space between (`FOO="a b"`, `"dir"/sub`).
const WORD = /(?:\$'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|'[^']*'|(?:[^\s"'\\]|\\.)+)+/g

function unquote(word: string): string {
  let out = ''
  PART.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = PART.exec(word)) !== null) {
    if (m[1] !== undefined) out += m[1].replace(/\\(.)/g, '$1')
    else if (m[2] !== undefined) out += m[2].replace(/\\(["\\$`])/g, '$1')
    else if (m[3] !== undefined) out += m[3]
    else out += (m[4] as string).replace(/\\(.)/g, '$1')
  }
  return out
}

/** Splits one segment into words, honouring quotes and escapes; redirects are dropped. */
export function tokenize(text: string): string[] {
  const words: string[] = []
  WORD.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = WORD.exec(text)) !== null) words.push(unquote(m[0]))
  // Redirects: `> f`, `>>f`, `2>&1`, `&> f`, `< f` are not arguments.
  const out: string[] = []
  for (let k = 0; k < words.length; k += 1) {
    const w = words[k] as string
    if (/^(\d*>>?|&>>?|<)$/.test(w)) {
      k += 1 // the operand
      continue
    }
    if (/^\d*>&\d*$|^(\d*>>?|&>>?|<)[^\s&]/.test(w)) continue
    out.push(w)
  }
  return out
}

/** The first risky segment of a POSIX shell command, or null when nothing in it is. */
export function classify(command: string): Risk | null {
  let dir: string | null = null // where a `cd` earlier on the line moved to
  const scopes: (string | null)[] = [] // dir to restore when a ( subshell ) closes
  const pushed: (string | null)[] = [] // pushd stack, for popd
  for (const seg of splitSegments(command)) {
    const raw = seg.text
    const opens = raw.match(/^\s*\(+/)?.[0].trim().length ?? 0
    // Trailing redirects don't hide a closing ) : `(cd sub && rm -rf out) > log`.
    const tail = raw.replace(/(?:\s*(?:\d*>>?|&>>?|<)\s*\S+)+\s*$/, '')
    const closes = tail.match(/\)+\s*$/)?.[0].trim().length ?? 0
    for (let k = 0; k < opens; k += 1) scopes.push(dir)
    const found = classifySegment(tail, dir, pushed, seg.heredoc)
    if (found !== null && !('cd' in found)) return found
    if (found !== null) dir = found.cd === '-' ? null : found.cd // a cd, pushd or popd moved the folder
    for (let k = 0; k < closes && scopes.length > 0; k += 1) dir = scopes.pop() ?? null
  }
  return null
}

/** Whether the args mark a dry run, a status query or a preview, which changes nothing. */
function isDryRun(args: string[]): boolean {
  return args.some(a => {
    const low = a.toLowerCase()
    return low.startsWith('--dry-run') || low === '--check' || low === '--plan' || low === '--sql' || low === '--pretend' || low === '--create-only' || low === '-whatif' || low === '-wi' || low === 'status' || low === 'diff' || low === 'info' || low === 'add' || low === 'new' || low === 'create' || low === 'make'
  })
}

function withDir(risk: Risk | null, dir: string | null): Risk | null {
  if (risk === null) return risk
  return { ...risk, dir: risk.dir ?? dir }
}

/** The word after the runner's options: `npx -y rimraf dist` names rimraf. */
function afterRunnerOptions(args: string[]): { word: string | undefined; rest: string[] } {
  let k = 0
  while (k < args.length && (args[k] as string).startsWith('-')) {
    const opt = args[k] as string
    k += opt === '-p' || opt === '--package' ? 2 : 1
  }
  return { word: args[k], rest: args.slice(k + 1) }
}

function classifySegment(segment: string, dir: string | null, pushed: (string | null)[], heredoc: string | null): Segment | null {
  // A subshell's parens, a group's braces: `(cd sub && rm -rf out)`, `{ rm -rf x; }`. A brace glued to a word is an expansion and stays.
  const words = tokenize(segment.trim().replace(/^\(+\s*/, '').replace(/^\{+(?=\s)/, '').replace(/\)+\s*$/, '').replace(/(^|\s)\}+\s*$/, '$1'))
  // Leading VAR=value, sudo and its options, and the wrappers that change nothing.
  for (;;) {
    while (words.length > 0 && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0] as string)) words.shift()
    const head = words[0]
    if (head === undefined) return null
    if (head === 'sudo') {
      words.shift()
      while (words.length > 0 && (words[0] as string).startsWith('-')) {
        const option = words.shift() as string
        if (SUDO_VALUE_OPTIONS.has(option)) words.shift()
      }
      continue
    }
    if (PREFIXES.has(head)) {
      words.shift()
      continue
    }
    if (PREFIX_WITH_VALUE.has(head)) {
      words.shift()
      if (head === 'nice') {
        const level = words[0]
        if (level === '-n') words.splice(0, 2)
        else if (/^-\d+$/.test(level ?? '')) words.shift()
      } else {
        while (words.length > 0 && (words[0] as string).startsWith('-')) {
          const option = words.shift() as string
          if (/^-[a-zA-Z]$/.test(option) || /^--[a-z-]+$/.test(option)) words.shift() // -s SIG, --signal SIG
        }
        if (head === 'timeout') words.shift() // the duration
      }
      continue
    }
    if (head === 'xargs') {
      words.shift()
      while (words.length > 0 && (words[0] as string).startsWith('-')) {
        const option = words.shift() as string
        if (/^-[IdnLPsE]$/.test(option) || option === '--max-args' || option === '--delimiter') words.shift()
      }
      // What xargs runs reads its targets from stdin, which nobody can measure here.
      const inner = classifySegment(words.join(' '), dir, pushed, null)
      if (inner !== null && !('cd' in inner) && inner.kind === 'rm') return { ...inner, targets: [], note: 'targets come from xargs input; not measured' }
      return inner
    }
    break
  }
  const [first, ...args] = words
  if (first === undefined) return null
  const cmd = first.replace(/^\\/, '').replace(/^.*\//, '').replace(/\.exe$/i, '') // \rm skips aliases; /bin/rm is rm
  if (cmd === 'cd' || cmd === 'pushd') {
    const target = args.find(a => !a.startsWith('-')) // `cd -P sub`, `cd -- sub`: the options are not the folder
    if (cmd === 'pushd') pushed.push(dir)
    if (cmd === 'cd' && args[0] === '-') return { cd: '-' }
    return { cd: joinDir(dir, target) }
  }
  if (cmd === 'popd') return { cd: pushed.length > 0 ? (pushed.pop() ?? '-') : '-' }
  // A shell given a script: `sh -c "..."`, `bash -lc "..."`, `bash <<EOF ... EOF`, `eval "..."`, `wsl rm -rf`.
  if (SHELLS.has(cmd)) {
    const at = args.findIndex(a => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(a))
    if (at >= 0) {
      const script = args.slice(at + 1).find(a => !a.startsWith('-'))
      if (script !== undefined) return withDir(classify(script), dir)
    }
    if (heredoc !== null) return withDir(classify(heredoc), dir)
    return null
  }
  if (cmd === 'eval') return withDir(classify(args.join(' ')), dir)
  if (cmd === 'wsl') {
    const at = args.findIndex(a => !a.startsWith('-') && !/^(-d|--distribution|-u|--user|--cd)$/.test(args[Math.max(0, args.indexOf(a) - 1)] ?? ''))
    const inner = at >= 0 ? args.slice(at) : []
    const script = inner[0] === '-e' || inner[0] === '--exec' ? inner.slice(1) : inner
    return script.length > 0 ? withDir(classify(script.join(' ')), dir) : null
  }
  // Windows shells from a POSIX shell: cmd /c "rd /s /q x", powershell -Command "Remove-Item -Recurse x".
  if (cmd.toLowerCase() === 'cmd' && /^\/{1,2}[ck]$/i.test(args[0] ?? '')) return withDir(classifyPowerShell(args.slice(1).join(' ')), dir)
  if (cmd.toLowerCase() === 'powershell' || cmd.toLowerCase() === 'pwsh') {
    const at = args.findIndex(a => /^-(c|command)$/i.test(a))
    if (at >= 0) return withDir(classifyPowerShell(args.slice(at + 1).join(' ')), dir)
    const script = args.find(a => !a.startsWith('-'))
    return script === undefined ? null : withDir(classifyPowerShell(script), dir)
  }
  // rm and its lookalikes, also behind npx / bunx / pnpm dlx / yarn dlx.
  let rmWord: string | null = null
  let rmArgs: string[] = args
  if (cmd === 'rm' || RM_LIKE.has(cmd)) rmWord = cmd
  else if (RUNNERS.has(cmd)) {
    const { word, rest } = afterRunnerOptions(args)
    if (word !== undefined && RM_LIKE.has(word)) {
      rmWord = word
      rmArgs = rest
    }
  } else if (DLX.has(cmd) && args[0] === 'dlx') {
    const { word, rest } = afterRunnerOptions(args.slice(1))
    if (word !== undefined && RM_LIKE.has(word)) {
      rmWord = word
      rmArgs = rest
    }
  }
  if (rmWord !== null) {
    const dd = rmArgs.indexOf('--') // everything after `--` is a target, however it is spelled
    const flagPart = dd < 0 ? rmArgs : rmArgs.slice(0, dd)
    const flags = flagPart.filter(a => a.startsWith('-'))
    const targets = [...flagPart.filter(a => !a.startsWith('-') || a === '-'), ...(dd < 0 ? [] : rmArgs.slice(dd + 1))]
    const recursive = rmWord !== 'rm' || flags.some(f => f === '--recursive' || (/^-[^-]/.test(f) && /[rR]/.test(f)))
    const force = flags.some(f => f === '--force' || (/^-[^-]/.test(f) && f.includes('f')))
    const isGlob = targets.some(t => /[*?[]/.test(t))
    // A plain `-f` on one file deletes what the bare command would; the hold is for trees and sweeps.
    if (recursive || (force && (targets.length > 1 || isGlob))) {
      const label = rmWord === 'rm' ? `rm ${flags.join(' ')}`.trim() : rmWord
      if (targets.some(t => /[$`{]/.test(t))) return { kind: 'rm', label, targets: [], dir, note: 'targets use shell expansion; not measured' }
      return { kind: 'rm', label, targets, dir }
    }
  }
  if (cmd === 'find') {
    const exec = args.findIndex(a => a === '-exec' || a === '-execdir')
    const runsRm = exec >= 0 && /^(\\?rm|rimraf)$/.test(args[exec + 1] ?? '')
    if (args.includes('-delete') || runsRm) {
      const roots = args.filter((a, k) => !a.startsWith('-') && (k === 0 || !(args[k - 1] as string).startsWith('-')) && !/[{};+]/.test(a))
      return { kind: 'rm', label: args.includes('-delete') ? 'find -delete' : 'find -exec rm', targets: [], dir, note: `find under ${roots.join(' ') || '.'} decides what goes; not measured` }
    }
  }
  if (cmd === 'git') return classifyGit(args, dir)
  if (READ_ONLY.has(cmd)) return null
  if (isDryRun(args)) return null
  const joined = words.join(' ')
  if (/\bdocker\s+(system\s+prune|volume\s+(prune|rm)|compose\s+down\s.*-v|rmi\s+-f)/.test(joined)) return { kind: 'other', label: 'docker prune', note: 'Removes containers, images or volumes; a volume holds data no git has.', dir }
  if (/\b(terraform|pulumi|cdk)\s+destroy\b/.test(joined)) return { kind: 'other', label: 'infrastructure destroy', note: 'Tears down deployed infrastructure.', dir }
  if (/\bkubectl\s+delete\b|\bhelm\s+(uninstall|delete)\b/.test(joined)) return { kind: 'other', label: 'kubectl delete', note: 'Deletes cluster resources.', dir }
  if (/\b(aws\s+s3\s+(rm|rb)|gsutil\s+(rm|rb)|az\s+storage\s+blob\s+delete)\b/.test(joined)) return { kind: 'other', label: 'cloud storage delete', note: 'Deletes objects in cloud storage.', dir }
  if (/\b(drop\s+(table|database|schema)|truncate\s+table)\b/i.test(joined)) return { kind: 'other', label: 'SQL drop', note: 'Drops or truncates database objects.', dir }
  if (/\balembic\s+(upgrade|downgrade)\b/.test(joined)) return { kind: 'migrate', tool: 'alembic', label: 'alembic upgrade', dir }
  if (/\bdb:(migrate|rollback|reset|drop|schema:load)(?!:status\b)/.test(joined)) return { kind: 'migrate', tool: 'rails', label: 'db:migrate', dir }
  if (/\bprisma\s+(migrate\s+(dev|deploy|reset)|db\s+push)\b/.test(joined)) return { kind: 'migrate', tool: 'prisma', label: 'prisma migrate', dir }
  if (/\bmanage\.py\s+migrate\b/.test(joined)) return { kind: 'migrate', tool: 'django', label: 'manage.py migrate', dir }
  if (/\bknex\s+migrate:(latest|up|down|rollback)\b/.test(joined)) return { kind: 'migrate', tool: 'knex', label: 'knex migrate', dir }
  if (/\bartisan\s+migrate(?::(fresh|refresh|rollback|reset))?(?!:)\b/.test(joined)) return { kind: 'migrate', tool: 'laravel', label: 'artisan migrate', dir }
  if (/\bdotnet\s+ef\s+database\s+(update|drop)\b/.test(joined)) return { kind: 'migrate', tool: 'ef', label: 'ef database update', dir }
  if (/\b(goose|flyway|liquibase|dbmate|sqlx)\s+(up|down|reset|migrate|update|rollback|run)\b/.test(joined)) return { kind: 'migrate', tool: 'migrate', label: 'migrate', dir }
  if (/\bmigrate\b(?:\s+-\S+(?:\s+[^-\s]\S*)?)*\s+(up|down|goto|force|drop)\b/.test(joined)) return { kind: 'migrate', tool: 'migrate', label: 'migrate', dir }
  if (args.includes('migrate')) return { kind: 'migrate', tool: 'unknown', label: 'migrate', dir }
  return null
}

/** The risky git subcommands; `args` follow the word `git`. Shared by the shell and PowerShell classifiers. */
export function classifyGit(args: string[], dir: string | null): Risk | null {
  // Git's own options come before the subcommand; -C moves where it runs.
  let gitDir = dir
  let i = 0
  while (i < args.length && (args[i] as string).startsWith('-')) {
    const opt = args[i] as string
    if (opt === '-C' && i + 1 < args.length) {
      gitDir = joinDir(gitDir, args[i + 1])
      i += 2
    } else if ((opt === '-c' || opt === '--git-dir' || opt === '--work-tree' || opt === '--namespace') && i + 1 < args.length) {
      i += 2
    } else {
      i += 1
    }
  }
  const sub = args[i]
  const rest = args.slice(i + 1)
  if (sub === 'reset' && rest.includes('--hard')) return { kind: 'git-reset', label: 'git reset --hard', args: rest, dir: gitDir }
  if (sub === 'clean') {
    const dry = rest.some(a => a === '-n' || a === '--dry-run' || a === '-i' || a === '--interactive' || (/^-[a-zA-Z]+$/.test(a) && /[ni]/.test(a)))
    return dry ? null : { kind: 'git-clean', label: 'git clean', args: rest, dir: gitDir }
  }
  if (sub === 'push') {
    if (rest.some(a => a === '-n' || a === '--dry-run')) return null
    const lease = rest.some(a => a.startsWith('--force-with-lease') || a === '--force-if-includes')
    const force = rest.some(a => a === '--force' || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) || /^\+/.test(a))
    if (force || lease) return { kind: 'git-push-force', label: lease && !force ? 'git push --force-with-lease' : 'git push --force', args: rest, dir: gitDir }
  }
  if (sub === 'checkout' || sub === 'restore') {
    const stagedOnly = sub === 'restore' && (rest.includes('--staged') || rest.includes('-S')) && !rest.includes('--worktree') && !rest.includes('-W')
    if (stagedOnly) return null
    const newBranch = rest.some(a => a === '-b' || a === '-B' || a === '--orphan')
    const dash = rest.indexOf('--')
    let paths: string[] = []
    if (dash >= 0) paths = rest.slice(dash + 1)
    else if (sub === 'restore') paths = rest.filter((a, k) => !a.startsWith('-') && !(k > 0 && /^(-s|--source)$/.test(rest[k - 1] as string)))
    else if (!newBranch && rest.includes('.')) paths = ['.']
    if (paths.length > 0) return { kind: 'git-checkout', label: `git ${sub} -- ${paths.join(' ')}`.slice(0, 60), args: rest, dir: gitDir }
    if (sub === 'checkout' && rest.some(a => a === '-f' || a === '--force')) return { kind: 'other', label: 'git checkout --force', note: 'Discards uncommitted changes in the working tree to switch.', dir: gitDir }
  }
  if (sub === 'switch' && rest.some(a => a === '-f' || a === '--force' || a === '--discard-changes')) return { kind: 'other', label: 'git switch --discard-changes', note: 'Discards uncommitted changes in the working tree to switch.', dir: gitDir }
  if (sub === 'worktree' && rest[0] === 'remove' && rest.some(a => a === '-f' || a === '--force')) return { kind: 'other', label: 'git worktree remove --force', note: 'Deletes the worktree with its modified and untracked files.', dir: gitDir }
  if (sub === 'stash' && (rest[0] === 'drop' || rest[0] === 'clear')) return { kind: 'other', label: `git stash ${rest[0]}`, note: 'Dropped stashes are hard to recover.', dir: gitDir }
  if (sub === 'branch' && rest.some(a => a === '-D' || a === '--delete' || a === '-d')) return { kind: 'other', label: 'git branch delete', note: 'Deletes a branch; unmerged commits on it are left to the reflog.', dir: gitDir }
  return null
}

// ---- PowerShell -------------------------------------------------------------------

const PS_RM = new Set(['remove-item', 'ri', 'rm', 'rmdir', 'rd', 'del', 'erase'])
// Parameters that take a value, so the value is not a path.
const PS_VALUED = /^-(path|literalpath|lp|p|filter|include|exclude|credential|erroraction|ea|warningaction|wa|informationaction|ia|errorvariable|ev|warningvariable|wv|outvariable|ov|outbuffer|ob|pipelinevariable|pv|stream)$/i

export type PsSegment = { text: string; piped: boolean }

/**
 * Splits a PowerShell line at unquoted `;`, `|`, `||`, `&&`, `&`, newlines and
 * the braces of a script block (`if (...) { Remove-Item ... }`); a backtick
 * before a newline continues the line; `#` comments are dropped.
 */
export function splitPsSegments(command: string): PsSegment[] {
  const out: PsSegment[] = []
  let cur = ''
  let quote: "'" | '"' | null = null
  let piped = false
  let nextPiped = false
  const push = (): void => {
    if (cur.trim() !== '') out.push({ text: cur, piped })
    cur = ''
    piped = nextPiped
    nextPiped = false
  }
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i] as string
    if (quote !== null) {
      cur += ch
      if (ch === '`' && quote === '"' && i + 1 < command.length) cur += command[++i]
      else if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      cur += ch
      continue
    }
    if (ch === '`' && (command[i + 1] === '\n' || command[i + 1] === '\r')) {
      cur += ' '
      i += command[i + 1] === '\r' && command[i + 2] === '\n' ? 2 : 1
      continue
    }
    if (ch === '#') {
      while (i < command.length && command[i] !== '\n') i += 1
      push()
      continue
    }
    if (ch === ';' || ch === '\n' || ch === '{' || ch === '}') {
      push()
      continue
    }
    if (ch === '|') {
      if (command[i + 1] === '|') {
        i += 1
        push()
      } else {
        nextPiped = true
        push()
      }
      continue
    }
    if (ch === '&') {
      if (i > 0 && command[i - 1] === '>') {
        cur += ch // `2>&1`
        continue
      }
      if (command[i + 1] === '&') i += 1
      push()
      continue
    }
    cur += ch
  }
  push()
  return out
}

/** PowerShell words: quotes honoured, a comma list (`a,b` or `"a", "b"`) kept as one word, a lone continuation backtick dropped. */
function tokenizePs(text: string): string[] {
  const words: string[] = []
  let cur = ''
  let has = false
  let quote: "'" | '"' | null = null
  const push = (): void => {
    if (has) words.push(cur)
    cur = ''
    has = false
  }
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i] as string
    if (quote !== null) {
      if (quote === '"' && ch === '`' && i + 1 < text.length) {
        cur += text[++i]
        continue
      }
      if (quote === "'" && ch === "'" && text[i + 1] === "'") {
        cur += "'"
        i += 1
        continue
      }
      if (ch === quote) {
        quote = null
        continue
      }
      cur += ch
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      has = true
      continue
    }
    if (/\s/.test(ch)) {
      // A comma list may continue after whitespace: `"a", "b"`.
      if (cur.endsWith(',')) continue
      let j = i
      while (j < text.length && /\s/.test(text[j] as string)) j += 1
      if (text[j] === ',' && has) {
        i = j - 1
        continue
      }
      push()
      continue
    }
    cur += ch
    has = true
  }
  push()
  return words.filter(w => w !== '`')
}

/** The first risky segment of a PowerShell command, or null. */
export function classifyPowerShell(command: string): Risk | null {
  let dir: string | null = null
  for (const seg of splitPsSegments(command)) {
    const words = tokenizePs(seg.text.trim())
    while (words.length > 0 && /^(&|\.)$/.test(words[0] as string)) words.shift()
    const first = words[0]
    if (first === undefined) continue
    const cmd = first.toLowerCase().replace(/^.*[\\/]/, '').replace(/\.exe$/, '')
    const args = words.slice(1)
    if (cmd === 'cd' || cmd === 'set-location' || cmd === 'sl' || cmd === 'chdir' || cmd === 'pushd' || cmd === 'push-location') {
      const target = args.find(a => !a.startsWith('-'))
      dir = target === undefined ? dir : joinDir(dir, target)
      continue
    }
    // Another shell from PowerShell: cmd /c, bash -c, wsl, a nested powershell, Invoke-Expression.
    if (cmd === 'cmd' && /^\/{1,2}[ck]$/i.test(args[0] ?? '')) {
      const inner = classifyPowerShell(args.slice(1).join(' '))
      if (inner !== null) return withDir(inner, dir)
      continue
    }
    if (SHELLS.has(cmd) || cmd === 'wsl') {
      const inner = classify(cmd === 'wsl' ? args.join(' ') : (args.find((a, k) => k > 0 && /^-[a-zA-Z]*c[a-zA-Z]*$/.test(args[k - 1] ?? '')) ?? ''))
      if (inner !== null) return withDir(inner, dir)
      continue
    }
    if (cmd === 'powershell' || cmd === 'pwsh' || cmd === 'invoke-expression' || cmd === 'iex') {
      const at = args.findIndex(a => /^-(c|command)$/i.test(a))
      const script = at >= 0 ? args.slice(at + 1).join(' ') : (args.find(a => !a.startsWith('-')) ?? '')
      const inner = script === '' ? null : classifyPowerShell(script)
      if (inner !== null) return withDir(inner, dir)
      continue
    }
    if (PS_RM.has(cmd)) {
      const low = args.map(a => a.toLowerCase())
      if (low.some(a => a === '-whatif' || a === '-wi' || a === '-confirm')) continue
      const recursive = low.some(a => /^-r(e(c(u(r(se?)?)?)?)?)?(:\$?true)?$/.test(a) || a === '/s')
      const force = low.some(a => /^-fo(r(ce?)?)?(:\$?true)?$/.test(a) || a === '/q' || a === '/f')
      const targets: string[] = []
      for (let k = 0; k < args.length; k += 1) {
        const a = args[k] as string
        if (/^(\d|\*)?>>?(&\d)?$/.test(a)) {
          k += 1 // a redirect and its operand
          continue
        }
        if (/^(\d|\*)?>>?(&\d)?\S/.test(a)) continue
        if (PS_VALUED.test(a) && args[k + 1] !== undefined) {
          if (/^-(path|literalpath|lp|p)$/i.test(a)) targets.push(...(args[k + 1] as string).split(',').map(s => s.trim()).filter(Boolean))
          k += 1
        } else if (/^-(path|literalpath|lp|p):/i.test(a)) {
          targets.push(...a.slice(a.indexOf(':') + 1).split(',').map(s => s.trim()).filter(Boolean))
        } else if (!a.startsWith('-') && !a.startsWith('/')) {
          targets.push(...a.split(',').map(s => s.trim()).filter(Boolean))
        }
      }
      const switches = args.filter(a => (a.startsWith('-') || a.startsWith('/')) && !PS_VALUED.test(a) && !/^-(path|literalpath|lp|p):/i.test(a))
      const label = `${first} ${switches.join(' ')}`.trim().slice(0, 40)
      if (seg.piped && targets.length === 0) return { kind: 'rm', label, targets: [], dir, note: 'targets come from the pipeline; not measured' }
      const isGlob = targets.some(t => /[*?[]/.test(t))
      if (recursive || (force && (targets.length > 1 || isGlob))) {
        if (targets.some(t => t.includes('$'))) return { kind: 'rm', label, targets: [], dir, note: 'targets use variables; not measured' }
        return { kind: 'rm', label, targets, dir }
      }
      continue
    }
    if (cmd === 'git') {
      const risk = classifyGit(args, dir)
      if (risk !== null) return risk
      continue
    }
    if (READ_ONLY_PS.has(cmd) || READ_ONLY.has(cmd)) continue
    if (isDryRun(args)) continue
    const joined = words.join(' ')
    if (/\bdrop\s+(table|database|schema)\b|\btruncate\s+table\b/i.test(joined)) return { kind: 'other', label: 'SQL drop', note: 'Drops or truncates database objects.', dir }
    if (args.includes('migrate') || /\bmanage\.py\s+migrate\b|\bprisma\s+migrate\s+(dev|deploy|reset)\b|\bdotnet\s+ef\s+database\s+update\b/.test(joined)) {
      return { kind: 'migrate', tool: 'unknown', label: 'migrate', dir }
    }
  }
  return null
}

// ---- Measuring helpers (pure) ----------------------------------------------------------

export const LIST_MAX = 10

/** A glob path segment (`*.log`, `build?`, `[ab]*`) as a RegExp over one file name; null when it has no glob. */
export function globToRegExp(segment: string, ignoreCase = false): RegExp | null {
  if (!/[*?[]/.test(segment)) return null
  let re = '^'
  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i] as string
    if (ch === '*') re += '[^/]*'
    else if (ch === '?') re += '[^/]'
    else if (ch === '[') {
      const end = segment.indexOf(']', i + 1)
      if (end < 0) re += '\\['
      else {
        const body = segment.slice(i + 1, end).replace(/^!/, '^').replace(/\\/g, '\\\\')
        re += `[${body}]`
        i = end
      }
    } else re += ch.replace(/[.+^${}()|\\]/g, '\\$&')
  }
  return new RegExp(`${re}$`, ignoreCase ? 'i' : '')
}

/** The git clean flags and paths, with -n added and -f/-i/-q dropped so the dry run stays one. */
export function cleanArgs(args: string[]): { flags: string[]; paths: string[] } {
  const flags: string[] = []
  const paths: string[] = []
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] as string
    if (a === '--') {
      paths.push(...args.slice(i + 1))
      break
    }
    if (a === '-e' || a === '--exclude') {
      flags.push(a, args[i + 1] ?? '')
      i += 1
    } else if (a.startsWith('--exclude=') || /^-e./.test(a)) {
      flags.push(a)
    } else if (/^-[a-zA-Z]+$/.test(a)) {
      const kept = a.replace(/[finq]/g, '')
      if (kept !== '-') flags.push(kept)
    } else if (!a.startsWith('-')) {
      paths.push(a)
    }
  }
  return { flags, paths }
}

/** `1.4 MB`. */
export function size(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = bytes
  let i = -1
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`
}

/** Whether a shell or PowerShell command runs a git commit (the lights turn green when it succeeds). */
export function isGitCommit(command: string): boolean {
  const segments = [...splitSegments(command).map(s => tokenize(s.text)), ...splitPsSegments(command).map(s => tokenizePs(s.text))]
  return segments.some(w => {
    while (w.length > 0 && /^[A-Za-z_][A-Za-z0-9_]*=/.test(w[0] as string)) w.shift()
    const head = (w[0] ?? '').replace(/^[({]+/, '')
    if (head !== 'git' && head !== 'git.exe') return false
    let i = 1
    while (i < w.length && (w[i] as string).startsWith('-')) {
      const opt = w[i] as string
      i += opt === '-C' || opt === '-c' || opt === '--git-dir' || opt === '--work-tree' ? 2 : 1
    }
    if (w[i] !== 'commit') return false
    return !w.slice(i + 1).includes('--dry-run') // a dry run commits nothing; `-n` is --no-verify and does
  })
}
